package com.richstok.warehouse.order.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CheckoutResponse(
        String invoiceNumber,
        OffsetDateTime createdAt,
        Integer itemCount,
        BigDecimal totalAmount,
        String recipientEmail
) {
}
