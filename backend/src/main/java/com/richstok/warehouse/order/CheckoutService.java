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

        List<OrderLine> orderLines = resolveOrderLines(user);
        if (orderLines.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }

        CustomerProfile customer = resolveCustomerProfile(request, user, userInfo);
        validateCustomer(customer);
        UserInfo savedUserInfo = persistCustomerProfile(user, customer, userInfo);

        String invoiceNumber = buildInvoiceNumber();
        OffsetDateTime createdAt = OffsetDateTime.now();
        BigDecimal total = orderLines.stream()
                .map(OrderLine::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int itemCount = orderLines.stream().mapToInt(OrderLine::quantity).sum();

        String customerLanguage = normalizeUiLanguage(request.language());
        OrderRecord orderRecord = persistPendingOrder(
                invoiceNumber,
                user,
                savedUserInfo,
                customer,
                total,
                itemCount,
                orderLines,
                customerLanguage
        );

        sendPendingOrderPlacedEmail(orderRecord, customer.email());
        cartService.clearCartByUserId(user.getId());

        return new CheckoutResponse(
                invoiceNumber,
                createdAt,
                itemCount,
                total.setScale(2, RoundingMode.HALF_UP),
                customer.email()
        );
    }

    private OrderRecord persistPendingOrder(
            String invoiceNumber,
            AppUser user,
            UserInfo userInfo,
            CustomerProfile customer,
            BigDecimal total,
            int itemCount,
            List<OrderLine> lines,
            String customerLanguage
    ) {
        OrderRecord orderRecord = new OrderRecord();
        orderRecord.setInvoiceNumber(invoiceNumber);
        orderRecord.setUserId(user.getId());
        orderRecord.setUserInfoId(userInfo != null ? userInfo.getId() : null);
        orderRecord.setComment(customer.comment());
        orderRecord.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        orderRecord.setItemCount(itemCount);
        orderRecord.setFulfillmentCity(FulfillmentCity.BAKI);
        orderRecord.setCurrencyCode("AZN");
        orderRecord.setCustomerLanguage(customerLanguage);
        orderRecord.setStatus(OrderStatus.PENDING);

        for (OrderLine line : lines) {
            Product product = line.product();
            OrderItemRecord itemRecord = new OrderItemRecord();
            itemRecord.setProductId(product.getId());
            itemRecord.setUnitPrice(product.getPrice().setScale(2, RoundingMode.HALF_UP));
            itemRecord.setQuantity(line.quantity());
            itemRecord.setLineTotal(line.lineTotal().setScale(2, RoundingMode.HALF_UP));
            orderRecord.addItem(itemRecord);
        }

        return orderRecordRepository.save(orderRecord);
    }

    private List<OrderLine> resolveOrderLines(AppUser user) {
        Map<Long, Integer> rawCart = cartService.getRawCartByUserId(user.getId());
        return mapOrderLines(rawCart);
    }

    private List<OrderLine> mapOrderLines(Map<Long, Integer> itemQuantities) {
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
            if (isStockUnknown(product)) {
                availabilityErrors.add(
                        product.getName()
                                + " (brand code " + product.getSku() + "): exact stock is unknown, please contact support."
                );
                continue;
            }

            int availableQuantity = normalizeStock(product.getStockQuantity());
            if (availableQuantity < quantity) {
                availabilityErrors.add(
                        product.getName()
                                + " (brand code " + product.getSku() + "): requested "
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

    private boolean isStockUnknown(Product product) {
        return product.isUnknownCount();
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

    private void sendPendingOrderPlacedEmail(OrderRecord order, String toEmail) {
        if (!isMailEnabled() || !hasText(toEmail)) {
            return;
        }

        String language = normalizeUiLanguage(order.getCustomerLanguage());
        String appName = resolveAppName();

        String subject;
        String html;
        switch (language) {
            case "ru" -> {
                subject = appName + " — Заказ принят: " + order.getInvoiceNumber();
                html = buildPendingOrderHtml(order, language, appName);
            }
            case "en" -> {
                subject = appName + " — Order received: " + order.getInvoiceNumber();
                html = buildPendingOrderHtml(order, language, appName);
            }
            default -> {
                subject = appName + " — Sifariş qəbul edildi: " + order.getInvoiceNumber();
                html = buildPendingOrderHtml(order, language, appName);
            }
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(resolveFrom());
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new IllegalStateException("Order created, but email delivery failed.", exception);
        }
    }

    private String buildPendingOrderHtml(OrderRecord order, String language, String appName) {
        String title;
        String lead;
        String orderLabel;
        String statusLabel;
        String statusValue;
        String footer;

        switch (language) {
            case "ru" -> {
                title = "Заказ успешно оформлен";
                lead = "Ваш заказ принят и ожидает подтверждения администратором.";
                orderLabel = "Номер заказа";
                statusLabel = "Статус";
                statusValue = "Ожидает подтверждения";
                footer = "После подтверждения мы отправим вам инвойс отдельным письмом.";
            }
            case "en" -> {
                title = "Order placed successfully";
                lead = "Your order was received and is waiting for admin confirmation.";
                orderLabel = "Order number";
                statusLabel = "Status";
                statusValue = "Pending confirmation";
                footer = "After confirmation we will send the invoice in a separate email.";
            }
            default -> {
                title = "Sifariş uğurla yaradıldı";
                lead = "Sifarişiniz qəbul edildi və admin təsdiqini gözləyir.";
                orderLabel = "Sifariş nömrəsi";
                statusLabel = "Status";
                statusValue = "Təsdiq gözləyir";
                footer = "Təsdiqdən sonra invoice ayrıca məktub ilə göndəriləcək.";
            }
        }

        return """
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body style="margin:0;padding:18px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
                  <table role="presentation" style="width:100%%;max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;border-collapse:separate;">
                    <tr>
                      <td style="padding:18px 20px;background:#111827;color:#f9fafb;">
                        <div style="font-size:20px;font-weight:700;">%s</div>
                        <div style="margin-top:6px;font-size:13px;color:#d1d5db;">%s</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 20px;">
                        <p style="margin:0 0 12px;font-size:14px;">%s</p>
                        <table role="presentation" style="width:100%%;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;border-collapse:separate;">
                          <tr>
                            <td style="padding:12px 16px;background:#f8fafc;"><strong>%s</strong></td>
                            <td style="padding:12px 16px;background:#f8fafc;">%s</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;"><strong>%s</strong></td>
                            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">%s</td>
                          </tr>
                        </table>
                        <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">%s</p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(appName),
                escapeHtml(title),
                escapeHtml(lead),
                escapeHtml(orderLabel),
                escapeHtml(order.getInvoiceNumber()),
                escapeHtml(statusLabel),
                escapeHtml(statusValue),
                escapeHtml(footer)
        );
    }

    private String resolveFrom() {
        AppProperties.Mail mail = appProperties.mail();
        if (mail != null && hasText(mail.from())) {
            return mail.from().trim();
        }
        return "no-reply@richstok.local";
    }

    private String resolveAppName() {
        AppProperties.Mail mail = appProperties.mail();
        if (mail != null && hasText(mail.appName())) {
            return mail.appName().trim();
        }
        return "RICHSTOK";
    }

    private boolean isMailEnabled() {
        AppProperties.Mail mail = appProperties.mail();
        return mail == null || mail.enabled();
    }

    private String buildInvoiceNumber() {
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        return "RSK-" + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + randomPart;
    }

    private String normalizeUiLanguage(String value) {
        if (!hasText(value)) {
            return "az";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "ru", "ru-ru", "russian" -> "ru";
            case "en", "en-us", "en-gb", "english" -> "en";
            default -> "az";
        };
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
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

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
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
