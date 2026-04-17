package com.richstok.warehouse.order.dto;

import java.math.BigDecimal;

public record UserOrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        Integer quantity,
        Integer returnedQuantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String imageUrl,
        String returnReason
) {
}
