package com.richstok.warehouse.order.dto;

import com.richstok.warehouse.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UserOrderListItemResponse(
        Long id,
        String invoiceNumber,
        BigDecimal totalAmount,
        Integer itemCount,
        String currencyCode,
        OrderStatus status,
        OffsetDateTime createdAt
) {
}
