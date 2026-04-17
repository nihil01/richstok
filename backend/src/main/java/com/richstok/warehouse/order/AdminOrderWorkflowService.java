package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.UserInfo;
import com.richstok.warehouse.config.AppProperties;
import com.richstok.warehouse.product.Product;
import com.richstok.warehouse.product.ProductRepository;
import com.richstok.warehouse.product.StockState;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
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
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderWorkflowService {

    private final OrderRecordRepository orderRecordRepository;
    private final ProductRepository productRepository;
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus targetStatus, String note) {
        OrderRecord order = orderRecordRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        if (previousStatus == targetStatus) {
            return;
        }

        ensureTransitionAllowed(previousStatus, targetStatus);
        if (previousStatus == OrderStatus.PENDING && targetStatus == OrderStatus.PROCESSING) {
            reserveStockForOrder(order);
            sendInvoiceEmail(order);
        }

        order.setStatus(targetStatus);
        appendAdminNote(order, targetStatus, note);
        orderRecordRepository.save(order);
        sendOrderStatusChangedEmail(order, previousStatus, targetStatus, note);
    }

    private void reserveStockForOrder(OrderRecord order) {
        List<OrderItemRecord> items = order.getItems();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Order does not contain items.");
        }

        List<Long> productIds = items.stream()
                .map(OrderItemRecord::getProductId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("Order items do not have linked products.");
        }

        Map<Long, Product> productsById = productRepository.findAllForUpdateByIdIn(productIds).stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        List<String> availabilityErrors = new ArrayList<>();
        for (OrderItemRecord item : items) {
            Long productId = item.getProductId();
            if (productId == null) {
                continue;
            }

            Product product = productsById.get(productId);
            if (product == null || !product.isActive()) {
                availabilityErrors.add("Product id " + productId + " is unavailable.");
                continue;
            }

            if (product.isUnknownCount()) {
                availabilityErrors.add("Brand code " + product.getSku() + ": stock is unknown.");
                continue;
            }

            int requestedQuantity = normalizeQuantity(item.getQuantity());
            int available = normalizeQuantity(product.getStockQuantity());
            if (available < requestedQuantity) {
                availabilityErrors.add(
                        "Brand code " + product.getSku()
                                + ": requested " + requestedQuantity
                                + ", available " + available + "."
                );
                continue;
            }

            int nextQuantity = available - requestedQuantity;
            product.setStockQuantity(nextQuantity);
            product.setStockState(resolveStockState(nextQuantity));
        }

        if (!availabilityErrors.isEmpty()) {
            throw new IllegalArgumentException("Cannot approve order. " + String.join(" ", availabilityErrors));
        }

        productRepository.saveAll(productsById.values());
    }

    private void sendInvoiceEmail(OrderRecord order) {
        if (!isMailEnabled()) {
            return;
        }

        String toEmail = resolveCustomerEmail(order);
        if (!hasText(toEmail)) {
            return;
        }

        String appName = resolveAppName();
        String subject = appName + " Invoice " + order.getInvoiceNumber();
        String html = buildInvoiceHtml(order, appName);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(resolveFrom());
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new IllegalStateException("Order approved, but invoice email delivery failed.", exception);
        }
    }

    private void sendOrderStatusChangedEmail(
            OrderRecord order,
            OrderStatus previousStatus,
            OrderStatus targetStatus,
            String note
    ) {
        if (!isMailEnabled()) {
            return;
        }

        String toEmail = resolveCustomerEmail(order);
        if (!hasText(toEmail)) {
            return;
        }

        String appName = resolveAppName();
        String noteText = hasText(note) ? "\nAdmin note: " + note.trim() : "";
        String text = """
                Order status has been updated.

                Invoice: %s
                Previous status: %s
                New status: %s%s

                Thank you for using %s.
                """.formatted(
                order.getInvoiceNumber(),
                previousStatus.name(),
                targetStatus.name(),
                noteText,
                appName
        );

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setFrom(resolveFrom());
            message.setSubject(appName + " — order " + order.getInvoiceNumber() + " status update");
            message.setText(text);
            mailSender.send(message);
        } catch (MailException exception) {
            throw new IllegalStateException("Order status updated, but notification email delivery failed.", exception);
        }
    }

    private void appendAdminNote(OrderRecord order, OrderStatus targetStatus, String note) {
        if (!hasText(note)) {
            return;
        }

        String line = "[ADMIN " + targetStatus.name() + " "
                + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                + "] " + note.trim();

        if (!hasText(order.getComment())) {
            order.setComment(line);
            return;
        }

        order.setComment(order.getComment().trim() + "\n" + line);
    }

    private void ensureTransitionAllowed(OrderStatus currentStatus, OrderStatus nextStatus) {
        boolean allowed = switch (currentStatus) {
            case PENDING -> nextStatus == OrderStatus.PROCESSING || nextStatus == OrderStatus.CANCELLED;
            case PROCESSING -> nextStatus == OrderStatus.SHIPPED || nextStatus == OrderStatus.CANCELLED || nextStatus == OrderStatus.COMPLETED;
            case SHIPPED -> nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELLED;
            case COMPLETED -> false;
            case PARTIALLY_RETURNED -> nextStatus == OrderStatus.RETURNED;
            case CANCELLED, RETURNED -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Cannot change status from " + currentStatus + " to " + nextStatus + ".");
        }
    }

    private String buildInvoiceHtml(OrderRecord order, String appName) {
        String rows = order.getItems().stream()
                .map(item -> {
                    Product product = item.getProduct();
                    String productName = product != null ? product.getName() : "Unknown product";
                    String sku = product != null ? product.getSku() : "-";
                    return """
                            <tr>
                              <td style="padding:12px;border-bottom:1px solid #eceff4;">%s</td>
                              <td style="padding:12px;border-bottom:1px solid #eceff4;">%s</td>
                              <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:center;">%d</td>
                              <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:right;">%s AZN</td>
                              <td style="padding:12px;border-bottom:1px solid #eceff4;text-align:right;font-weight:600;">%s AZN</td>
                            </tr>
                            """.formatted(
                            escapeHtml(productName),
                            escapeHtml(sku),
                            normalizeQuantity(item.getQuantity()),
                            formatMoney(item.getUnitPrice()),
                            formatMoney(item.getLineTotal())
                    );
                })
                .collect(Collectors.joining());

        UserInfo userInfo = order.getUserInfo();
        String phone = userInfo != null ? userInfo.getPhone() : order.getUser().getPhone();
        String address = userInfo != null ? userInfo.getAddressLine1() : order.getUser().getAddressLine1();
        String city = userInfo != null ? userInfo.getCity() : order.getUser().getCity();
        String country = userInfo != null ? userInfo.getCountry() : order.getUser().getCountry();
        String postalCode = userInfo != null ? userInfo.getPostalCode() : order.getUser().getPostalCode();

        String commentBlock = hasText(order.getComment())
                ? "<p style=\"margin:14px 0 0;font-size:14px;color:#334155;\"><strong>Comment:</strong> " + escapeHtml(order.getComment()) + "</p>"
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
                escapeHtml(order.getInvoiceNumber()),
                order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                escapeHtml(order.getUser().getFullName()),
                escapeHtml(resolveCustomerEmail(order)),
                escapeHtml(phone),
                escapeHtml(address),
                escapeHtml(city),
                escapeHtml(country),
                escapeHtml(postalCode == null ? "" : postalCode),
                commentBlock,
                rows,
                formatMoney(order.getTotalAmount())
        );
    }

    private String resolveCustomerEmail(OrderRecord order) {
        return order.getUser() != null ? order.getUser().getEmail() : null;
    }

    private int normalizeQuantity(Integer value) {
        return value == null ? 0 : Math.max(0, value);
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

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "0.00";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
}
