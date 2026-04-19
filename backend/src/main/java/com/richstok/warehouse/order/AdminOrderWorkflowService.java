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

        boolean invoiceRequired = previousStatus == OrderStatus.PENDING && targetStatus == OrderStatus.COMPLETED;
        if (invoiceRequired) {
            reserveStockForOrder(order);
        }

        order.setStatus(targetStatus);
        appendAdminNote(order, targetStatus, note);
        orderRecordRepository.save(order);

        sendOrderStatusChangedEmail(order, previousStatus, targetStatus, note);
        if (invoiceRequired) {
            sendInvoiceEmail(order);
        }
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

        String language = resolveLanguage(order.getCustomerLanguage());
        String appName = resolveAppName();
        String subject = localizedInvoiceSubject(language, appName, order.getInvoiceNumber());
        String html = buildInvoiceHtml(order, appName, language);

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

        String language = resolveLanguage(order.getCustomerLanguage());
        String appName = resolveAppName();
        String previousLabel = localizedStatus(language, previousStatus);
        String nextLabel = localizedStatus(language, targetStatus);
        String normalizedNote = hasText(note) ? note.trim() : null;

        String subject;
        String html;
        switch (language) {
            case "ru" -> {
                subject = appName + " — Статус заказа обновлён " + order.getInvoiceNumber();
                html = buildStatusChangedHtml(order, language, appName, previousLabel, nextLabel, normalizedNote);
            }
            case "en" -> {
                subject = appName + " — Order status update " + order.getInvoiceNumber();
                html = buildStatusChangedHtml(order, language, appName, previousLabel, nextLabel, normalizedNote);
            }
            default -> {
                subject = appName + " — Sifariş statusu yeniləndi " + order.getInvoiceNumber();
                html = buildStatusChangedHtml(order, language, appName, previousLabel, nextLabel, normalizedNote);
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
            case PENDING -> nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELLED;
            case PROCESSING -> nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELLED;
            case SHIPPED -> nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELLED;
            case COMPLETED -> false;
            case PARTIALLY_RETURNED -> nextStatus == OrderStatus.RETURNED;
            case CANCELLED, RETURNED -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Cannot change status from " + currentStatus + " to " + nextStatus + ".");
        }
    }

    private String buildInvoiceHtml(OrderRecord order, String appName, String language) {
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

        String title;
        String customerLabel;
        String emailLabel;
        String phoneLabel;
        String addressLabel;
        String locationLabel;
        String productLabel;
        String codeLabel;
        String qtyLabel;
        String unitLabel;
        String totalLabel;
        String grandTotalLabel;

        switch (language) {
            case "ru" -> {
                title = "Инвойс";
                customerLabel = "Клиент";
                emailLabel = "Email";
                phoneLabel = "Телефон";
                addressLabel = "Адрес";
                locationLabel = "Локация";
                productLabel = "Товар";
                codeLabel = "Brand code";
                qtyLabel = "Кол-во";
                unitLabel = "Цена";
                totalLabel = "Сумма";
                grandTotalLabel = "Итог";
            }
            case "en" -> {
                title = "Invoice";
                customerLabel = "Customer";
                emailLabel = "Email";
                phoneLabel = "Phone";
                addressLabel = "Address";
                locationLabel = "Location";
                productLabel = "Product";
                codeLabel = "Brand code";
                qtyLabel = "Qty";
                unitLabel = "Unit";
                totalLabel = "Total";
                grandTotalLabel = "Grand Total";
            }
            default -> {
                title = "İnvoice";
                customerLabel = "Müştəri";
                emailLabel = "Email";
                phoneLabel = "Telefon";
                addressLabel = "Ünvan";
                locationLabel = "Məkan";
                productLabel = "Məhsul";
                codeLabel = "Brand code";
                qtyLabel = "Say";
                unitLabel = "Qiymət";
                totalLabel = "Cəm";
                grandTotalLabel = "Yekun";
            }
        }

        String commentBlock = hasText(order.getComment())
                ? "<p style=\"margin:14px 0 0;font-size:14px;color:#334155;\"><strong>Comment:</strong> " + escapeHtml(order.getComment()) + "</p>"
                : "";

        return """
                <!doctype html>
                <html lang="en">
                <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
                  <div style="max-width:860px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                    <div style="padding:20px 24px;background:#111827;color:#f9fafb;">
                      <h1 style="margin:0;font-size:22px;">%s — %s</h1>
                      <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1;">#%s · %s</p>
                    </div>
                    <div style="padding:22px 24px;">
                      <p style="margin:0 0 10px;font-size:14px;"><strong>%s:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>%s:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>%s:</strong> %s</p>
                      <p style="margin:0 0 6px;font-size:14px;"><strong>%s:</strong> %s</p>
                      <p style="margin:0 0 0;font-size:14px;"><strong>%s:</strong> %s, %s %s</p>
                      %s
                    </div>
                    <div style="padding:0 24px 16px;">
                      <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                        <thead>
                          <tr style="background:#f8fafc;color:#334155;">
                            <th style="text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;">%s</th>
                            <th style="text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;">%s</th>
                            <th style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;">%s</th>
                            <th style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;">%s</th>
                            <th style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;">%s</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                        </tbody>
                      </table>
                    </div>
                    <div style="padding:14px 24px 24px;text-align:right;">
                      <p style="margin:0;font-size:13px;color:#64748b;">%s</p>
                      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#dc2626;">%s AZN</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                escapeHtml(appName),
                title,
                escapeHtml(order.getInvoiceNumber()),
                order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                customerLabel,
                escapeHtml(order.getUser().getFullName()),
                emailLabel,
                escapeHtml(resolveCustomerEmail(order)),
                phoneLabel,
                escapeHtml(phone),
                addressLabel,
                escapeHtml(address),
                locationLabel,
                escapeHtml(city),
                escapeHtml(country),
                escapeHtml(postalCode == null ? "" : postalCode),
                commentBlock,
                productLabel,
                codeLabel,
                qtyLabel,
                unitLabel,
                totalLabel,
                rows,
                grandTotalLabel,
                formatMoney(order.getTotalAmount())
        );
    }

    private String localizedInvoiceSubject(String language, String appName, String invoiceNumber) {
        return switch (language) {
            case "ru" -> appName + " — Инвойс " + invoiceNumber;
            case "en" -> appName + " — Invoice " + invoiceNumber;
            default -> appName + " — İnvoice " + invoiceNumber;
        };
    }

    private String localizedStatus(String language, OrderStatus status) {
        return switch (language) {
            case "ru" -> switch (status) {
                case PENDING -> "Ожидает";
                case PROCESSING -> "В обработке";
                case SHIPPED -> "Отправлен";
                case COMPLETED -> "Принят";
                case PARTIALLY_RETURNED -> "Частичный возврат";
                case CANCELLED -> "Отменен";
                case RETURNED -> "Возврат";
            };
            case "en" -> switch (status) {
                case PENDING -> "Pending";
                case PROCESSING -> "Processing";
                case SHIPPED -> "Shipped";
                case COMPLETED -> "Accepted";
                case PARTIALLY_RETURNED -> "Partially returned";
                case CANCELLED -> "Cancelled";
                case RETURNED -> "Returned";
            };
            default -> switch (status) {
                case PENDING -> "Gözləmədə";
                case PROCESSING -> "İcrada";
                case SHIPPED -> "Yoldadır";
                case COMPLETED -> "Qəbul edildi";
                case PARTIALLY_RETURNED -> "Qismən geri qaytarılıb";
                case CANCELLED -> "Ləğv edildi";
                case RETURNED -> "Geri qaytarıldı";
            };
        };
    }

    private String buildStatusChangedHtml(
            OrderRecord order,
            String language,
            String appName,
            String previousLabel,
            String nextLabel,
            String note
    ) {
        String title;
        String lead;
        String orderLabel;
        String previousLabelTitle;
        String nextLabelTitle;
        String noteLabel;
        String footer;

        switch (language) {
            case "ru" -> {
                title = "Статус заказа обновлён";
                lead = "Ваш заказ обновлён.";
                orderLabel = "Номер заказа";
                previousLabelTitle = "Предыдущий статус";
                nextLabelTitle = "Новый статус";
                noteLabel = "Комментарий администратора";
                footer = "Если есть вопросы, пожалуйста свяжитесь с поддержкой.";
            }
            case "en" -> {
                title = "Order status updated";
                lead = "Your order has been updated.";
                orderLabel = "Order number";
                previousLabelTitle = "Previous status";
                nextLabelTitle = "New status";
                noteLabel = "Admin note";
                footer = "If you have questions, please contact support.";
            }
            default -> {
                title = "Sifariş statusu yeniləndi";
                lead = "Sifarişiniz yeniləndi.";
                orderLabel = "Sifariş nömrəsi";
                previousLabelTitle = "Əvvəlki status";
                nextLabelTitle = "Yeni status";
                noteLabel = "Admin qeydi";
                footer = "Suallarınız varsa, dəstək xidməti ilə əlaqə saxlayın.";
            }
        }

        String noteBlock = hasText(note)
                ? """
                        <tr>
                          <td style="padding:12px 16px;border-top:1px solid #e5e7eb;background:#f8fafc;"><strong>%s</strong></td>
                          <td style="padding:12px 16px;border-top:1px solid #e5e7eb;background:#f8fafc;">%s</td>
                        </tr>
                        """.formatted(escapeHtml(noteLabel), escapeHtml(note))
                : "";

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
                          <tr>
                            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;"><strong>%s</strong></td>
                            <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">%s</td>
                          </tr>
                          %s
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
                escapeHtml(previousLabelTitle),
                escapeHtml(previousLabel),
                escapeHtml(nextLabelTitle),
                escapeHtml(nextLabel),
                noteBlock,
                escapeHtml(footer)
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

    private String resolveLanguage(String value) {
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
