package com.richstok.warehouse.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 180) String name,
        @Size(max = 220) String slug,
        @NotBlank @Size(max = 120) String sku,
        @NotBlank @Size(max = 120) String category,
        @Size(max = 140) String oemNumber,
        @Size(max = 2000) String description,
        @Size(max = 2000000) String imageUrl,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull @PositiveOrZero Integer stockQuantity,
        @Pattern(regexp = "IN_STOCK|LOW_STOCK|OUT_OF_STOCK") String stockState,
        @Size(max = 60) String model,
        @Size(max = 120) String brand,
        Boolean unknownCount,
        @PositiveOrZero Integer deliveryDays,
        boolean active
) {
}
