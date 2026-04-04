package com.richstok.warehouse.common;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
        String message,
        OffsetDateTime timestamp,
        Map<String, String> fieldErrors
) {
}
