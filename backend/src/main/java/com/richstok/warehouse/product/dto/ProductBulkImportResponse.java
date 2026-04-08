package com.richstok.warehouse.product.dto;

import java.util.List;

public record ProductBulkImportResponse(
        int created,
        int updated,
        int skipped,
        List<String> errors
) {
}
