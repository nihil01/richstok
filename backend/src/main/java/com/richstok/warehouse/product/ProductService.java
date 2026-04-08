package com.richstok.warehouse.product;

import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.product.dto.ProductBulkImportResponse;
import com.richstok.warehouse.product.dto.ProductRequest;
import com.richstok.warehouse.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int MAX_IMPORT_ERRORS = 100;
    private static final DataFormatter DATA_FORMATTER = new DataFormatter(Locale.US);

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProducts() {
        return productRepository.findAllByActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveBySlug(String slug) {
        Product product = productRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveById(Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new NotFoundException("Product id not found: " + id));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchActiveProducts(String query) {
        if (query == null || query.trim().isBlank()) {
            return getActiveProducts();
        }

        return productRepository.findAll(
                ProductSpecifications.activeOnly().and(ProductSpecifications.bySearchQuery(query)),
                Sort.by(Sort.Direction.DESC, "createdAt")
            ).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request, null);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product id not found: " + id));
        applyRequest(product, request, id);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductBulkImportResponse importProductsFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Excel file is empty.");
        }

        String filename = file.getOriginalFilename();
        if (filename != null) {
            String lowercase = filename.toLowerCase(Locale.ROOT);
            if (!lowercase.endsWith(".xlsx") && !lowercase.endsWith(".xls")) {
                throw new IllegalArgumentException("Only .xlsx or .xls files are supported.");
            }
        }

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new IllegalArgumentException("Excel file does not contain any sheets.");
            }

            HengstHeaderMapping mapping = resolveHengstHeaderMapping(sheet);

            List<String> errors = new ArrayList<>();
            int created = 0;
            int updated = 0;
            int skipped = 0;

            for (int rowIndex = mapping.headerRowIndex() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isRowBlank(row)) {
                    continue;
                }

                ParsedRow parsedRow = parseHengstRow(row, rowIndex + 1, mapping, errors);
                if (parsedRow == null) {
                    skipped++;
                    continue;
                }

                Product product = productRepository.findBySkuIgnoreCase(parsedRow.sku())
                    .orElseGet(Product::new);

                boolean exists = product.getId() != null;

                applyParsedRow(product, parsedRow, product.getId());
                productRepository.save(product);

                if (exists) {
                    updated++;
                } else {
                    created++;
                }
            }

            return new ProductBulkImportResponse(created, updated, skipped, errors);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Failed to read Excel file.", exception);
        }
    }

    private ParsedRow parseHengstRow(Row row, int humanRowNumber, HengstHeaderMapping mapping, List<String> errors) {
        String brand = normalizeNullable(readStringCell(row, mapping.brandColumn()));
        String sku = normalizeSku(readStringCell(row, mapping.skuColumn()));
        String oemNumber = normalizeNullable(readStringCell(row, mapping.oemColumn()));
        String name = normalizeNullable(readStringCell(row, mapping.nameColumn()));
        String model = normalizeNullable(readStringCell(row, mapping.modelColumn()));
        String baseDescription = normalizeNullable(readStringCell(row, mapping.descriptionColumn()));
        String bakiRaw = readStringCell(row, mapping.bakiColumn());
        String gancaRaw = readStringCell(row, mapping.gancaColumn());
//        String leadTime = normalizeNullable(readStringCell(row, mapping.leadTimeColumn()));
        String priceRaw = readStringCell(row, mapping.priceColumn());

        if ((name == null || name.isBlank())
                && (sku == null || sku.isBlank())
                && (priceRaw == null || priceRaw.isBlank())
                && (bakiRaw == null || bakiRaw.isBlank())
                && (gancaRaw == null || gancaRaw.isBlank())) {
            return null;
        }

        if (name == null || name.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": product name is empty.");
            return null;
        }

        if (sku == null || sku.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": SKU (BREND KODU) is empty.");
            return null;
        }

        if (priceRaw == null || priceRaw.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": price (QİYMƏT AZN) is empty.");
            return null;
        }

        if (model == null || model.isBlank()){
            model = "-";
        }

        BigDecimal price;
        StockResolution stockResolution;

        try {
            price = parseDecimal(priceRaw);
            stockResolution = resolveStockQuantity(bakiRaw, gancaRaw);

            if (stockResolution == null) {
                addRowError(errors, "Row " + humanRowNumber + ": stock cannot be resolved from BAKİ/GANCA.");
                return null;
            }

            if (price.signum() < 0) {
                addRowError(errors, "Row " + humanRowNumber + ": price must be non-negative.");
                return null;
            }

            if (stockResolution.quantity() < 0) {
                addRowError(errors, "Row " + humanRowNumber + ": stock must be non-negative.");
                return null;
            }
        } catch (NumberFormatException exception) {
            addRowError(errors, "Row " + humanRowNumber + ": invalid numeric value.");
            return null;
        }

        String description = buildDescription(baseDescription);
        String category = inferCategory(name, description);
        boolean active = stockResolution.quantity() > 0;

        return new ParsedRow(
                name.trim(),
                sku,
                category,
                oemNumber,
                description,
                null,
                price,
                stockResolution.quantity(),
                stockResolution.stockState(),
                brand,
                active,
                null,
                model
        );
    }

    private HengstHeaderMapping resolveHengstHeaderMapping(Sheet sheet) {
        Row headerRow = sheet.getRow(sheet.getFirstRowNum());
        if (headerRow == null) {
            throw new IllegalArgumentException("Excel file does not contain a header row.");
        }

        Integer brandColumn = null;
        Integer skuColumn = null;
        Integer oemColumn = null;
        Integer nameColumn = null;
        Integer modelColumn = null;
        Integer descriptionColumn = null;
        Integer bakiColumn = null;
        Integer gancaColumn = null;
        Integer leadTimeColumn = null;
        Integer priceColumn = null;

        for (int index = 0; index < headerRow.getLastCellNum(); index++) {
            String rawHeader = readStringCell(headerRow, index);
            String normalized = normalizeHeader(rawHeader);

            System.out.println(normalized);

            switch (normalized) {
                case "brend" -> brandColumn = index;
                case "brendkodu", "brandcode", "artikul" -> skuColumn = index;
                case "oemkodu", "oem", "oemnumber" -> oemColumn = index;
                case "mehsulunadi", "mehsuladi", "name" -> nameColumn = index;
                case "model" -> modelColumn = index;
                case "tesvir", "description" -> descriptionColumn = index;
                case "baki", "baku" -> bakiColumn = index;
                case "ganca", "ganja" -> gancaColumn = index;
                case "gun" -> leadTimeColumn = index;
                case "qiymetazn", "priceazn", "price" -> priceColumn = index;
                default -> {
                }
            }
        }

        if (brandColumn == null
                || skuColumn == null
                || oemColumn == null
                || nameColumn == null
                || bakiColumn == null
                || gancaColumn == null
                || leadTimeColumn == null
                || priceColumn == null) {
            throw new IllegalArgumentException("""
                Excel header does not match required format.
                Required columns:
                BREND, BREND KODU, OEM KODU, MƏHSULUN ADI, BAKİ, GANCA, GÜN, QİYMƏT AZN
                """);
        }

        return new HengstHeaderMapping(
                headerRow.getRowNum(),
                brandColumn,
                skuColumn,
                oemColumn,
                nameColumn,
                modelColumn,
                descriptionColumn,
                bakiColumn,
                gancaColumn,
                leadTimeColumn,
                priceColumn
        );
    }

    private record HengstHeaderMapping(
            int headerRowIndex,
            int brandColumn,
            int skuColumn,
            int oemColumn,
            int nameColumn,
            Integer modelColumn,
            Integer descriptionColumn,
            int bakiColumn,
            int gancaColumn,
            int leadTimeColumn,
            int priceColumn
    ) {
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NotFoundException("Product id not found: " + id);
        }
        productRepository.deleteById(id);
    }

    private void applyRequest(Product product, ProductRequest request, Long currentProductId) {
        String normalizedSku = normalizeSku(request.sku());
        ensureUniqueSku(normalizedSku, currentProductId);

        ParsedRow parsedRow = new ParsedRow(
                request.name().trim(),
                normalizedSku,
                request.category().trim(),
                normalizeNullable(request.oemNumber()),
                normalizeNullable(request.description()),
                normalizeImageUrl(request.imageUrl()),
                request.price(),
                request.stockQuantity(),
                resolveManualStockState(request.stockState(), request.stockQuantity()),
                normalizeNullable(request.brand()),
                request.active(),
                resolveUniqueSlug(request.slug(), request.name(), normalizedSku, currentProductId),
                request.model()
        );

        applyParsedRow(product, parsedRow, currentProductId);
    }

    private void applyParsedRow(Product product, ParsedRow parsedRow, Long currentProductId) {
        String resolvedSlug = resolveUniqueSlug(parsedRow.slug(), parsedRow.name(), parsedRow.sku(), currentProductId);
        product.setName(parsedRow.name());
        product.setSlug(resolvedSlug);
        product.setSku(parsedRow.sku());
        product.setCategory(parsedRow.category());
        product.setOemNumber(parsedRow.oemNumber());
        product.setDescription(parsedRow.description());
        product.setImageUrl(parsedRow.imageUrl());
        product.setPrice(parsedRow.price());
        product.setStockQuantity(parsedRow.stockQuantity());
        product.setStockState(parsedRow.stockState());
        product.setBrand(parsedRow.brand());
        product.setActive(parsedRow.active());
        product.setModel(parsedRow.model());
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getSku(),
                product.getCategory(),
                product.getOemNumber(),
                product.getDescription(),
                product.getImageUrl(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getStockState().name(),
                product.getModel(),
                product.getBrand(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private String resolveUniqueSlug(String explicitSlug, String name, String sku, Long currentProductId) {
        String preferredSlug = normalizeSlug(explicitSlug);
        if (preferredSlug.isBlank()) {
            preferredSlug = normalizeSlug(name + "-" + sku);
        }
        if (preferredSlug.isBlank()) {
            preferredSlug = "product-" + sku.toLowerCase(Locale.ROOT);
        }

        String candidate = preferredSlug;
        int suffix = 2;
        while (slugExists(candidate, currentProductId)) {
            candidate = preferredSlug + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private boolean slugExists(String slug, Long currentProductId) {
        if (currentProductId == null) {
            return productRepository.existsBySlugIgnoreCase(slug);
        }
        return productRepository.existsBySlugIgnoreCaseAndIdNot(slug, currentProductId);
    }

    private void ensureUniqueSku(String sku, Long currentProductId) {
        if (currentProductId == null && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new IllegalArgumentException("SKU already exists: " + sku);
        }
        if (currentProductId != null && productRepository.existsBySkuIgnoreCaseAndIdNot(sku, currentProductId)) {
            throw new IllegalArgumentException("SKU already exists: " + sku);
        }
    }

    private String readStringCell(Row row, Integer cellIndex) {
        if (cellIndex == null || row.getCell(cellIndex) == null) {
            return "";
        }
        return DATA_FORMATTER.formatCellValue(row.getCell(cellIndex)).trim();
    }

    private boolean isRowBlank(Row row) {
        for (int cellIndex = row.getFirstCellNum(); cellIndex < row.getLastCellNum(); cellIndex++) {
            if (!readStringCell(row, cellIndex).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private BigDecimal parseDecimal(String value) {
        String normalized = value.replace(" ", "").replace(",", ".").replaceAll("[^0-9.-]", "");
        return new BigDecimal(normalized);
    }

    private StockResolution resolveStockQuantity(String primaryStock, String secondaryStock) {
        StockCell primary = parseStockValue(primaryStock);
        StockCell secondary = parseStockValue(secondaryStock);
        if (primary == null && secondary == null) {
            return null;
        }
        if (primary == null) {
            return new StockResolution(secondary.quantity(), secondary.stockState());
        }
        if (secondary == null) {
            return new StockResolution(primary.quantity(), primary.stockState());
        }
        int quantity = primary.quantity() + secondary.quantity();
        StockState stockState = mergeStockState(primary.stockState(), secondary.stockState(), quantity);
        return new StockResolution(quantity, stockState);
    }

    private StockCell parseStockValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();

        try {
            if (trimmed.matches("\\d+")) {
                int quantity = Integer.parseInt(trimmed);
                return new StockCell(quantity, deriveStockStateByQuantity(quantity));
            }

            if (trimmed.matches("\\d+[.,]\\d+")) {
                int quantity = (int) Math.round(Double.parseDouble(trimmed.replace(",", ".")));
                return new StockCell(quantity, deriveStockStateByQuantity(quantity));
            }

            if (trimmed.matches("\\d+\\s*[-/]\\s*\\d+")) {
                String[] parts = trimmed.split("[-/]");
                int quantity = Integer.parseInt(parts[0].trim());
                return new StockCell(quantity, deriveStockStateByQuantity(quantity));
            }
        } catch (NumberFormatException ignored) {
        }

        String normalized = normalizeHeader(trimmed);

        if (normalized.equals("0")
                || normalized.equals("yox")
                || normalized.equals("yoxdur")
                || normalized.contains("outofstock")
                || normalized.contains("netvnalichii")) {
            return new StockCell(0, StockState.OUT_OF_STOCK);
        }

        if (normalized.equals("azvar")
                || normalized.contains("limited")
                || normalized.contains("few")
                || normalized.contains("lowstock")
                || normalized.contains("malo")) {
            return new StockCell(3, StockState.LOW_STOCK);
        }

        if (normalized.equals("var")
                || normalized.contains("instock")
                || normalized.contains("available")
                || normalized.contains("vnalichii")) {
            return new StockCell(10, StockState.IN_STOCK);
        }

        return null;
    }

    private StockState resolveManualStockState(String requestedState, int stockQuantity) {
        if (requestedState == null || requestedState.isBlank()) {
            return deriveStockStateByQuantity(stockQuantity);
        }
        return StockState.valueOf(requestedState);
    }

    private StockState deriveStockStateByQuantity(int stockQuantity) {
        if (stockQuantity <= 0) {
            return StockState.OUT_OF_STOCK;
        }
        if (stockQuantity <= 5) {
            return StockState.LOW_STOCK;
        }
        return StockState.IN_STOCK;
    }

    private StockState mergeStockState(StockState firstState, StockState secondState, int quantity) {
        if (quantity <= 0) {
            return StockState.OUT_OF_STOCK;
        }
        if (firstState == StockState.LOW_STOCK || secondState == StockState.LOW_STOCK) {
            return quantity <= 5 ? StockState.LOW_STOCK : StockState.IN_STOCK;
        }
        if (firstState == StockState.OUT_OF_STOCK && secondState == StockState.OUT_OF_STOCK) {
            return StockState.OUT_OF_STOCK;
        }
        if (firstState == StockState.IN_STOCK || secondState == StockState.IN_STOCK) {
            return StockState.IN_STOCK;
        }
        return deriveStockStateByQuantity(quantity);
    }

    private String inferCategory(String name, String description) {
        String source = (name == null ? "" : name) + " " + (description == null ? "" : description);
        String normalized = normalizeHeader(source);
        if (normalized.contains("filtr") || normalized.contains("filter")) {
            return "Filters";
        }
        if (normalized.contains("nasos") || normalized.contains("pump")) {
            return "Fuel Pumps";
        }
        if (normalized.contains("hidravlik") || normalized.contains("hydraulic")) {
            return "Hydraulic";
        }
        return "Auto Parts";
    }

    private String buildDescription(String baseDescription) {
        return baseDescription;
    }

    private String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }

        String normalized = header
                .toLowerCase(Locale.ROOT)
                // азербайджанские буквы → латиница
                .replace("ə", "e")
                .replace("ı", "i")
                .replace("ö", "o")
                .replace("ü", "u")
                .replace("ç", "c")
                .replace("ş", "s")
                .replace("ğ", "g");

        return Normalizer.normalize(normalized, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\p{Alnum}]+", "");
    }

    private String normalizeSlug(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "")
                .replaceAll("-{2,}", "-");
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeImageUrl(String value) {
        String trimmed = normalizeNullable(value);
        if (trimmed == null) {
            return null;
        }
        if (trimmed.startsWith("data:image/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
            return trimmed;
        }
        throw new IllegalArgumentException("Image must be a valid http(s) URL or data:image URI.");
    }

    private String normalizeSku(String sku) {
        if (sku == null) {
            return "";
        }
        return sku.trim().toUpperCase(Locale.ROOT);
    }

    private void addRowError(List<String> errors, String message) {
        if (errors.size() < MAX_IMPORT_ERRORS) {
            errors.add(message);
        }
    }

    private record ParsedRow(
            String name,
            String sku,
            String category,
            String oemNumber,
            String description,
            String imageUrl,
            BigDecimal price,
            Integer stockQuantity,
            StockState stockState,
            String brand,
            boolean active,
            String slug,
            String model
    ) {
    }

    private record StockCell(
            int quantity,
            StockState stockState
    ) {
    }

    private record StockResolution(
            int quantity,
            StockState stockState
    ) {
    }
}
