package com.richstok.warehouse.product.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String sku,
        String category,
        String oemNumber,
        String description,
        String imageUrl,
        BigDecimal price,
        Integer stockQuantity,
        String stockState,
        String model,
        String brand,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
