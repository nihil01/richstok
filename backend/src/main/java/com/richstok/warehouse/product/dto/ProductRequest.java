package com.richstok.warehouse.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 180) String name,
        @NotBlank @Size(max = 220) String slug,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull @PositiveOrZero Integer stockQuantity,
        @Size(max = 120) String brand,
        boolean active
) {
}
