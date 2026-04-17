package com.richstok.warehouse.order.dto;

import com.richstok.warehouse.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record AdminOrderStatusUpdateRequest(
        @NotNull OrderStatus status,
        String note
) {
}
