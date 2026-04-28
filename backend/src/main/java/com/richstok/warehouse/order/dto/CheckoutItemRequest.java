package com.richstok.warehouse.order.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CheckoutItemRequest(
        @NotNull Long productId,
        @NotNull @Min(1) @Max(999) Integer quantity,
        @Size(max = 500) String note
) {
}
