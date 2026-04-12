package com.richstok.warehouse.order.dto;

import com.richstok.warehouse.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record UserOrderDetailsResponse(
        Long id,
        String invoiceNumber,
        BigDecimal totalAmount,
        Integer itemCount,
        String currencyCode,
        OrderStatus status,
        OffsetDateTime createdAt,
        String customerFullName,
        String customerPhone,
        String addressLine1,
        String addressLine2,
        String city,
        String postalCode,
        String country,
        String fulfillmentCity,
        String comment,
        List<UserOrderItemResponse> items
) {
}
