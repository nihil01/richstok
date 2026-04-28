package com.richstok.warehouse.order;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum OrderStatus {
    PENDING,
    COMPLETED,
    PARTIALLY_RETURNED,
    CANCELLED,
    RETURNED;

    @JsonCreator
    public static OrderStatus fromJson(String rawValue) {
        return fromExternal(rawValue);
    }

    public static OrderStatus fromExternal(String rawValue) {
        if (rawValue == null) {
            throw new IllegalArgumentException("Order status is required.");
        }
        String normalized = rawValue.trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Order status is required.");
        }
        return switch (normalized) {
            case "PROCESSING", "SHIPPED" -> COMPLETED;
            default -> OrderStatus.valueOf(normalized);
        };
    }
}
