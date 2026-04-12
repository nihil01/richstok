package com.richstok.warehouse.order.dto;

import com.richstok.warehouse.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminOrderDetailsResponse(
        Long id,
        String invoiceNumber,
        Long userId,
        Long userInfoId,
        String customerFullName,
        String customerEmail,
        String customerPhone,
        String addressLine1,
        String addressLine2,
        String city,
        String postalCode,
        String country,
        String fulfillmentCity,
        String comment,
        BigDecimal totalAmount,
        Integer itemCount,
        String currencyCode,
        OrderStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<AdminOrderItemResponse> items
) {
}
