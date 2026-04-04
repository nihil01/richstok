package com.richstok.warehouse.auth.dto;

import com.richstok.warehouse.auth.UserRole;

public record AuthUserResponse(
        Long id,
        String email,
        String fullName,
        UserRole role
) {
}
