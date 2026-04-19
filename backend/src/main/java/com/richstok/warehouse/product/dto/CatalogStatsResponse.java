package com.richstok.warehouse.product.dto;

public record CatalogStatsResponse(
        long totalProducts,
        long totalBrands,
        long totalCategories,
        long totalStockQuantity,
        long unknownStockProducts
) {
}
