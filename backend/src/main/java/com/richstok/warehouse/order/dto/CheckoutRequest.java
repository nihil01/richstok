package com.richstok.warehouse.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutRequest(
        @Size(max = 120) String fullName,
        @Email @Size(max = 180) String email,
        @Size(max = 40) String phone,
        @Size(max = 220) String addressLine1,
        @Size(max = 220) String addressLine2,
        @Size(max = 120) String city,
        @Size(max = 40) String postalCode,
        @Size(max = 120) String country,
        @Size(max = 20) String fulfillmentCity,
        @Size(max = 500) String comment,
        @Valid List<CheckoutItemRequest> items
) {
}
