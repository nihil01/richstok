package com.richstok.warehouse.order.dto;

import java.math.BigDecimal;

public record UserOrderItemResponse(
        Long productId,
        String productName,
        String productSku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String imageUrl
) {
}
