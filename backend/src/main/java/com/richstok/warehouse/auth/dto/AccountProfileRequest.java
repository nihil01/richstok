package com.richstok.warehouse.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AccountProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 40) String phone,
        @Size(max = 40) String phoneAlt,
        @Size(max = 220) String addressLine1,
        @Size(max = 220) String addressLine2,
        @Size(max = 120) String city,
        @Size(max = 40) String postalCode,
        @Size(max = 120) String country
) {
}
