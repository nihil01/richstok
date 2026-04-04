package com.richstok.warehouse.product.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        Integer stockQuantity,
        String brand,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
