package com.richstok.warehouse.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemRequest(
        @NotNull @Min(1) @Max(999) Integer quantity
) {
}
