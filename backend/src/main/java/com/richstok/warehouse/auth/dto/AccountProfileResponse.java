package com.richstok.warehouse.auth.dto;

import com.richstok.warehouse.auth.UserRole;

public record AccountProfileResponse(
        Long id,
        String email,
        String fullName,
        UserRole role,
        String phone,
        String phoneAlt,
        String addressLine1,
        String addressLine2,
        String city,
        String postalCode,
        String country
) {
}
