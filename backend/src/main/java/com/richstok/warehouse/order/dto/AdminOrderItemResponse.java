package com.richstok.warehouse.order.dto;

import java.math.BigDecimal;

public record AdminOrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        String productBrand,
        String productCategory,
        String productOem,
        String productModel,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal,
        String imageUrl,
        String stockState
) {
}
