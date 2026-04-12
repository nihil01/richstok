package com.richstok.warehouse.order.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AdminOrderSummaryResponse(
        long totalOrders,
        long totalItems,
        BigDecimal totalRevenue,
        BigDecimal averageOrderValue,
        String currencyCode,
        Map<String, Long> statusCounts
) {
}
