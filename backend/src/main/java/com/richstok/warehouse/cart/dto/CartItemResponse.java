package com.richstok.warehouse.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long productId,
        String name,
        String sku,
        String imageUrl,
        String category,
        String brand,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal,
        String stockState,
        Integer availableStock,
        boolean unknownCount,
        Integer deliveryDays
) {
}
