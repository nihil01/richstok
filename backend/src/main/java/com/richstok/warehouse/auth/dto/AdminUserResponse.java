package com.richstok.warehouse.auth.dto;

import com.richstok.warehouse.auth.UserRole;

import java.time.OffsetDateTime;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        UserRole role,
        boolean active,
        OffsetDateTime createdAt
) {
}
