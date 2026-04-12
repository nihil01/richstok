package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.AppUserRepository;
import com.richstok.warehouse.auth.UserInfo;
import com.richstok.warehouse.auth.UserInfoRepository;
import com.richstok.warehouse.cart.CartService;
import com.richstok.warehouse.config.AppProperties;
import com.richstok.warehouse.order.dto.CheckoutRequest;
import com.richstok.warehouse.order.dto.CheckoutResponse;
import com.richstok.warehouse.product.Product;
import com.richstok.warehouse.product.ProductRepository;
import com.richstok.warehouse.product.StockState;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final ProductRepository productRepository;
    private final AppUserRepository appUserRepository;
    private final UserInfoRepository userInfoRepository;
    private final OrderRecordRepository orderRecordRepository;
    private final CartService cartService;
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request, AppUser user) {
        UserInfo userInfo = userInfoRepository.findByUserId(user.getId())
                .orElse(null);

        FulfillmentCity fulfillmentCity = resolveFulfillmentCity(
                request.fulfillmentCity(),
                userInfo != null ? userInfo.getCity() : user.getCity()
        );

        List<OrderLine> orderLines = resolveOrderLines(user, fulfillmentCity);
        if (orderLines.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }
        CustomerProfile customer = resolveCustomerProfile(request, user, userInfo);
        validateCustomer(customer);
        UserInfo savedUserInfo = persistCustomerProfile(user, customer, userInfo);
        reserveStock(orderLines, fulfillmentCity);

        String invoiceNumber = buildInvoiceNumber();
        OffsetDateTime createdAt = OffsetDateTime.now();
        BigDecimal total = orderLines.stream()
                .map(OrderLine::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int itemCount = orderLines.stream().mapToInt(OrderLine::quantity).sum();

        persistCompletedOrder(invoiceNumber, user, savedUserInfo, customer, fulfillmentCity, total, itemCount, orderLines);
        sendInvoiceEmail(customer.email(), invoiceNumber, createdAt, orderLines, customer, fulfillmentCity, total);
        cartService.clearCartByUserId(user.getId());

        return new CheckoutResponse(
                invoiceNumber,
                createdAt,
                itemCount,
                total.setScale(2, RoundingMode.HALF_UP),
                customer.email()
        );
    }

    private void persistCompletedOrder(
            String invoiceNumber,
            AppUser user,
            UserInfo userInfo,
            CustomerProfile customer,
            FulfillmentCity fulfillmentCity,
            BigDecimal total,
            int itemCount,
            List<OrderLine> lines
    ) {
        OrderRecord orderRecord = new OrderRecord();
        orderRecord.setInvoiceNumber(invoiceNumber);
        orderRecord.setUserId(user.getId());
        orderRecord.setUserInfoId(userInfo != null ? userInfo.getId() : null);
        orderRecord.setComment(customer.comment());
        orderRecord.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        orderRecord.setItemCount(itemCount);
        orderRecord.setFulfillmentCity(fulfillmentCity);
        orderRecord.setCurrencyCode("AZN");
        orderRecord.setStatus(OrderStatus.COMPLETED);

        for (OrderLine line : lines) {
            Product product = line.product();
            OrderItemRecord itemRecord = new OrderItemRecord();
            itemRecord.setProductId(product.getId());
            itemRecord.setUnitPrice(product.getPrice().setScale(2, RoundingMode.HALF_UP));
            itemRecord.setQuantity(line.quantity());
            itemRecord.setLineTotal(line.lineTotal().setScale(2, RoundingMode.HALF_UP));
            orderRecord.addItem(itemRecord);
        }

        orderRecordRepository.save(orderRecord);
    }

    private List<OrderLine> resolveOrderLines(AppUser user, FulfillmentCity fulfillmentCity) {
        Map<Long, Integer> rawCart = cartService.getRawCartByUserId(user.getId());
        return mapOrderLines(rawCart, fulfillmentCity);
    }

    private List<OrderLine> mapOrderLines(Map<Long, Integer> itemQuantities, FulfillmentCity fulfillmentCity) {
        if (itemQuantities.isEmpty()) {
            return List.of();
        }
        List<Long> productIds = new ArrayList<>(itemQuantities.keySet());
        Map<Long, Product> products = productRepository.findAllForUpdateByIdIn(productIds).stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        List<OrderLine> lines = new ArrayList<>();
        List<String> availabilityErrors = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : itemQuantities.entrySet()) {
            Product product = products.get(entry.getKey());
            if (product == null) {
                availabilityErrors.add("Product id " + entry.getKey() + " is no longer available.");
                continue;
            }
            if (!product.isActive()) {
                availabilityErrors.add("Product " + product.getName() + " is no longer active.");
                continue;
            }
            int quantity = Math.max(1, entry.getValue());
            if (isCityStockUnknown(product, fulfillmentCity)) {
                availabilityErrors.add(
                        product.getName()
                                + " (brand code " + product.getSku() + ", city " + fulfillmentCity.name() + "): exact stock is unknown, please contact support."
                );
                continue;
            }
            int availableQuantity = resolveCityAvailableStock(product, fulfillmentCity);
            if (availableQuantity < quantity) {
                availabilityErrors.add(
                        product.getName()
                                + " (brand code " + product.getSku() + ", city " + fulfillmentCity.name() + "): requested "
                                + quantity + ", available " + availableQuantity + "."
                );
                continue;
            }
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            lines.add(new OrderLine(product, quantity, lineTotal));
        }

        if (!availabilityErrors.isEmpty()) {
            throw new IllegalArgumentException("Some items are unavailable or low on stock: " + String.join(" ", availabilityErrors));
        }

        return lines;
    }

    private void reserveStock(List<OrderLine> lines, FulfillmentCity fulfillmentCity) {
        Map<Long, Product> productsToUpdate = new HashMap<>();
        for (OrderLine line : lines) {
            Product product = line.product();
            int bakuCount = normalizeStock(product.getBakuCount());
            int ganjaCount = normalizeStock(product.getGanjaCount());

            if (fulfillmentCity == FulfillmentCity.BAKI) {
                product.setBakuCount(Math.max(0, bakuCount - line.quantity()));
            } else {
                product.setGanjaCount(Math.max(0, ganjaCount - line.quantity()));
            }

            int updatedQuantity = normalizeStock(product.getBakuCount()) + normalizeStock(product.getGanjaCount());
            product.setStockQuantity(updatedQuantity);
            product.setStockState(resolveStockState(updatedQuantity));
            productsToUpdate.put(product.getId(), product);
        }
        productRepository.saveAll(productsToUpdate.values());
    }

    private StockState resolveStockState(int quantity) {
        if (quantity <= 0) {
            return StockState.OUT_OF_STOCK;
        }
        if (quantity <= 5) {
            return StockState.LOW_STOCK;
        }
        return StockState.IN_STOCK;
    }

    private FulfillmentCity resolveFulfillmentCity(String requestedCity, String profileCity) {
        FulfillmentCity fromRequest = FulfillmentCity.fromInput(requestedCity);
        if (fromRequest != null) {
            return fromRequest;
        }
        if (hasText(requestedCity)) {
            throw new IllegalArgumentException("Invalid fulfillment city. Allowed values: BAKI or GANCA.");
        }
        FulfillmentCity fromProfile = FulfillmentCity.fromInput(profileCity);
        if (fromProfile != null) {
            return fromProfile;
        }
        return FulfillmentCity.BAKI;
    }

    private int resolveCityAvailableStock(Product product, FulfillmentCity fulfillmentCity) {
        if (fulfillmentCity == FulfillmentCity.BAKI) {
            return normalizeStock(product.getBakuCount());
        }
        return normalizeStock(product.getGanjaCount());
    }

    private boolean isCityStockUnknown(Product product, FulfillmentCity fulfillmentCity) {
        if (fulfillmentCity == FulfillmentCity.BAKI) {
            return product.isBakuCountUnknown();
        }
        return product.isGanjaCountUnknown();
    }

    private int normalizeStock(Integer quantity) {
        return quantity == null ? 0 : Math.max(0, quantity);
    }

    private CustomerProfile resolveCustomerProfile(CheckoutRequest request, AppUser user, UserInfo userInfo) {
        String phone = userInfo != null ? userInfo.getPhone() : user.getPhone();
        String addressLine1 = userInfo != null ? userInfo.getAddressLine1() : user.getAddressLine1();
        String addressLine2 = userInfo != null ? userInfo.getAddressLine2() : user.getAddressLine2();
        String city = userInfo != null ? userInfo.getCity() : user.getCity();
        String postalCode = userInfo != null ? userInfo.getPostalCode() : user.getPostalCode();
        String country = userInfo != null ? userInfo.getCountry() : user.getCountry();

        return new CustomerProfile(
                normalizeNullable(user.getFullName()),
                normalizeNullable(user.getEmail()),
                normalizeNullable(phone),
                normalizeNullable(addressLine1),
                normalizeNullable(addressLine2),
                normalizeNullable(city),
                normalizeNullable(postalCode),
                normalizeNullable(country),
                normalizeNullable(request.comment())
        );
    }

    private void validateCustomer(CustomerProfile customer) {
        List<String> missingFields = new ArrayList<>();
        if (isBlank(customer.fullName())) {
            missingFields.add("full name");
        }
        if (isBlank(customer.email())) {
            missingFields.add("email");
        }
        if (isBlank(customer.phone())) {
            missingFields.add("phone");
        }
        if (isBlank(customer.addressLine1())) {
            missingFields.add("address");
        }
        if (isBlank(customer.city())) {
            missingFields.add("city");
        }
        if (isBlank(customer.country())) {
            missingFields.add("country");
        }
        if (!missingFields.isEmpty()) {
            throw new IllegalArgumentException("Profile data is incomplete. Missing fields: " + String.join(", ", missingFields) + ".");
        }
        if (!customer.email().contains("@")) {
            throw new IllegalArgumentException("Email format is invalid.");
        }
    }

    private UserInfo persistCustomerProfile(AppUser user, CustomerProfile customer, UserInfo existingUserInfo) {
        user.setFullName(customer.fullName());
        appUserRepository.save(user);

        UserInfo target = existingUserInfo != null ? existingUserInfo : new UserInfo();
        if (target.getUserId() == null) {
            target.setUserId(user.getId());
        }
        target.setPhone(customer.phone());
        target.setAddressLine1(customer.addressLine1());
        target.setAddressLine2(customer.addressLine2());
        target.setCity(customer.city());
        target.setPostalCode(customer.postalCode());
        target.setCountry(customer.country());
        return userInfoRepository.save(target);
    }

    private void sendInvoiceEmail(
            String toEmail,
            String invoiceNumber,
            OffsetDateTime createdAt,
            List<OrderLine> lines,
            CustomerProfile customer,
            FulfillmentCity fulfillmentCity,
            BigDecimal total
    ) {
        AppProperties.Mail mail = appProperties.mail();
        if (mail != null && !mail.enabled()) {
            return;
        }

        String appName = mail != null && hasText(mail.appName()) ? mail.appName().trim() : "RICHSTOK";
        String from = mail != null && hasText(mail.from()) ? mail.from().trim() : "no-reply@richstok.local";
        String html = buildInvoiceHtml(appName, invoiceNumber, createdAt, lines, customer, fulfillmentCity, total);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(from);
            helper.setSubject(appName + " Invoice " + invoiceNumber);
            helper.setText(html, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException | MailException exception) {
            throw new IllegalStateException("Checkout completed, but invoice email delivery failed.", exception);
        }
    }

    private String buildInvoiceHtml(
            String appName,
            String invoiceNumber,
            OffsetDateTime createdAt,
            List<OrderLine> lines,
            CustomerProfile customer,
            FulfillmentCity fulfillmentCity,
            BigDecimal total
    ) {
        String rows = lines.stream()
                .map(line -> """
                        <tr>
                          <td style="padding:12px;border-bottom:1px solid #eceff4;">%s</td>
                          <td style="padding:12px;border-bottom:1px solid #eceff4;">%s</td>
                          <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:center;">%d</td>
                          <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:right;">%s AZN</td>
                          <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:right;font-weight:600;">%s AZN</td>
                        </tr>
                        """.formatted(
                        escapeHtml(line.product().getName()),
                        escapeHtml(line.product().getSku()),
                        line.quantity(),
                        formatMoney(line.product().getPrice()),
                        formatMoney(line.lineTotal())
                ))
                .collect(Collectors.joining());

        String commentBlock = hasText(customer.comment())
                ? "<p style=\"margin:14px 0 0;font-size:14px;color:#334155;\"><strong>Comment:</strong> " + escapeHtml(customer.comment()) + "</p>"
                : "";

        return """
                <!doctype html>
                <html lang="en">
                <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
                  <div style="max-width:860px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                    <div style="padding:20px 24px;background:#111827;color:#f9fafb;">
                      <h1 style="margin:0;font-size:22px;">%s — Invoice</h1>
                      <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1;">Invoice #%s · %s</p>
                    </div>
                    <div style="padding:22px 24px;">
                      <p style="margin:0 0 10px;font-size:14px;"><strong>Customer:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>Email:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>Phone:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>Address:</strong> %s</p>
                      <p style="margin:0 0 0;font-size:14px;"><strong>Location:</strong> %s, %s %s</p>
                      <p style="margin:6px 0 0;font-size:14px;"><strong>Warehouse city:</strong> %s</p>
                      %s
                    </div>
                    <div style="padding:0 24px 16px;">
                      <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                        <thead>
                          <tr style="background:#f8fafc;color:#334155;">
                            <th style="text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;">Product</th>
                            <th style="text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;">Brand code</th>
                            <th style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;">Qty</th>
                            <th style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;">Unit</th>
                            <th style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                        </tbody>
                      </table>
                    </div>
                    <div style="padding:14px 24px 24px;text-align:right;">
                      <p style="margin:0;font-size:13px;color:#64748b;">Grand Total</p>
                      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#dc2626;">%s AZN</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                escapeHtml(appName),
                escapeHtml(invoiceNumber),
                createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                escapeHtml(customer.fullName()),
                escapeHtml(customer.email()),
                escapeHtml(customer.phone()),
                escapeHtml(customer.addressLine1()),
                escapeHtml(customer.city()),
                escapeHtml(customer.country()),
                escapeHtml(customer.postalCode() == null ? "" : customer.postalCode()),
                escapeHtml(fulfillmentCity.name()),
                commentBlock,
                rows,
                formatMoney(total)
        );
    }

    private String buildInvoiceNumber() {
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        return "RSK-" + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + randomPart;
    }

    private String formatMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record OrderLine(
            Product product,
            int quantity,
            BigDecimal lineTotal
    ) {
    }

    private record CustomerProfile(
            String fullName,
            String email,
            String phone,
            String addressLine1,
            String addressLine2,
            String city,
            String postalCode,
            String country,
            String comment
    ) {
    }
}
