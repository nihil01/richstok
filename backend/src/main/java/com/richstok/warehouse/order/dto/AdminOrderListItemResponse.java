package com.richstok.warehouse.order.dto;

import com.richstok.warehouse.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AdminOrderListItemResponse(
        Long id,
        String invoiceNumber,
        Long userId,
        Long userInfoId,
        String customerFullName,
        String customerEmail,
        String customerPhone,
        String city,
        String country,
        BigDecimal totalAmount,
        Integer itemCount,
        String currencyCode,
        OrderStatus status,
        OffsetDateTime createdAt
) {
}
