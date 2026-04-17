package com.richstok.warehouse.order.dto;

import jakarta.validation.constraints.Min;

public record OrderItemReturnRequest(
        @Min(1)
        Integer quantity,
        String reason
) {
}
