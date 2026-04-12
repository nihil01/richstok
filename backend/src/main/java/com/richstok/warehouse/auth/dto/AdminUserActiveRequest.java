package com.richstok.warehouse.auth.dto;

import jakarta.validation.constraints.NotNull;

public record AdminUserActiveRequest(
        @NotNull Boolean active
) {
}
