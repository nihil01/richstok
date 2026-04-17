package com.richstok.warehouse.product;

import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.product.dto.CatalogCategoryResponse;
import com.richstok.warehouse.product.dto.ProductBulkImportResponse;
import com.richstok.warehouse.product.dto.ProductRequest;
import com.richstok.warehouse.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int MAX_IMPORT_ERRORS = 100;
    private static final DataFormatter DATA_FORMATTER = new DataFormatter(Locale.US);

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProducts() {
        return getCatalogProducts().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getActiveProductsPage(int page, int size, String category, String query) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 60);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        var specification = ProductSpecifications.byCategory(category).and(ProductSpecifications.bySearchQuery(query));
        if (isCatalogActiveFilterEnabled()) {
            specification = ProductSpecifications.activeOnly().and(specification);
        }

        Page<ProductResponse> mappedPage = productRepository.findAll(specification, pageable).map(this::toResponse);
        return new PageResponse<>(
                mappedPage.getContent(),
                mappedPage.getNumber(),
                mappedPage.getSize(),
                mappedPage.getTotalElements(),
                mappedPage.getTotalPages(),
                mappedPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<CatalogCategoryResponse> getCatalogCategories() {
        Map<String, Long> categoryCounters = new LinkedHashMap<>();
        Map<String, String> categoryLabels = new LinkedHashMap<>();

        for (Product product : getCatalogProducts()) {
            String normalizedCategory = normalizeCatalogCategory(product.getCategory());
            if (normalizedCategory == null) {
                continue;
            }
            String categoryKey = normalizedCategory.toLowerCase(Locale.ROOT);
            categoryCounters.merge(categoryKey, 1L, Long::sum);
            categoryLabels.putIfAbsent(categoryKey, normalizedCategory);
        }

        return categoryCounters.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.comparing(value -> value.toLowerCase(Locale.ROOT))))
                .map(entry -> new CatalogCategoryResponse(categoryLabels.get(entry.getKey()), entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveBySlug(String slug) {
        Product product = isCatalogActiveFilterEnabled()
                ? productRepository.findBySlugAndActiveTrue(slug)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + slug))
                : productRepository.findBySlugIgnoreCase(slug)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveById(Long id) {
        Product product = isCatalogActiveFilterEnabled()
                ? productRepository.findByIdAndActiveTrue(id)
                    .orElseThrow(() -> new NotFoundException("Product id not found: " + id))
                : productRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("Product id not found: " + id));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchActiveProducts(String query) {
        if (query == null || query.trim().isBlank()) {
            return getActiveProducts();
        }

        if (isCatalogActiveFilterEnabled()) {
            return productRepository.findAll(
                            ProductSpecifications.activeOnly().and(ProductSpecifications.bySearchQuery(query)),
                            Sort.by(Sort.Direction.DESC, "createdAt")
                    ).stream()
                    .map(this::toResponse)
                    .toList();
        }

        return productRepository.findAll(
                        ProductSpecifications.bySearchQuery(query),
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
        String gunRaw = readStringCell(row, mapping.leadTimeColumn());
        String priceRaw = readStringCell(row, mapping.priceColumn());

        if ((name == null || name.isBlank())
                && (sku == null || sku.isBlank())
                && (priceRaw == null || priceRaw.isBlank())
                && (bakiRaw == null || bakiRaw.isBlank())
                && (gancaRaw == null || gancaRaw.isBlank())
                && (gunRaw == null || gunRaw.isBlank())) {
            return null;
        }

        if (name == null || name.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": product name is empty.");
            return null;
        }

        if (sku == null || sku.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": brand code (BREND KODU) is empty.");
            return null;
        }

        if (priceRaw == null || priceRaw.isBlank()) {
            addRowError(errors, "Row " + humanRowNumber + ": price (QİYMƏT AZN) is empty.");
            return null;
        }

        StockCell bakuStock = parseWarehouseCount(bakiRaw, humanRowNumber, "BAKI", errors);
        StockCell ganjaStock = parseWarehouseCount(gancaRaw, humanRowNumber, "GANCA", errors);
        if (bakuStock == null || ganjaStock == null) {
            return null;
        }

        Integer deliveryDays = parseDeliveryDays(gunRaw);
        if (deliveryDays == null) {
            addRowError(errors, "Row " + humanRowNumber + ": delivery days (GUN) is empty or invalid.");
            return null;
        }

        if (model == null || model.isBlank()) {
            model = "-";
        }

        BigDecimal price;
        StockResolution stockResolution;

        try {
            price = parseDecimal(priceRaw);
            stockResolution = resolveStockQuantity(bakuStock, ganjaStock);

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
        boolean active = true;

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
                model,
                stockResolution.unknownCount(),
                deliveryDays
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

            switch (normalized) {
                case "brend" -> brandColumn = index;
                case "brendkodu", "brandcode", "artikul" -> skuColumn = index;
                case "oemkodu", "oem", "oemnumber" -> oemColumn = index;
                case "mehsulunadi", "mehsuladi", "name" -> nameColumn = index;
                case "model" -> modelColumn = index;
                case "tesvir", "description" -> descriptionColumn = index;
                case "baki", "baku", "bakicount", "bakucount" -> bakiColumn = index;
                case "ganca", "ganja", "gence", "gancacount", "ganjacount" -> gancaColumn = index;
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
                || leadTimeColumn == null
                || priceColumn == null
                || bakiColumn == null
                || gancaColumn == null) {
            throw new IllegalArgumentException("""
                Excel header does not match required format.
                Required columns:
                BREND, BREND KODU, OEM KODU, MƏHSULUN ADI, BAKI, GANCA, GUN, QİYMƏT AZN
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
            Integer bakiColumn,
            Integer gancaColumn,
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
        int normalizedStockQuantity = normalizeStockQuantity(request.stockQuantity());
        boolean unknownCount = request.unknownCount() != null ? request.unknownCount() : product.isUnknownCount();
        StockState resolvedStockState = resolveManualStockState(
                request.stockState(),
                normalizedStockQuantity,
                unknownCount
        );

        ParsedRow parsedRow = new ParsedRow(
                request.name().trim(),
                normalizedSku,
                request.category().trim(),
                normalizeNullable(request.oemNumber()),
                normalizeNullable(request.description()),
                normalizeImageUrl(request.imageUrl()),
                request.price(),
                normalizedStockQuantity,
                resolvedStockState,
                normalizeNullable(request.brand()),
                request.active(),
                resolveUniqueSlug(request.slug(), request.name(), normalizedSku, currentProductId),
                request.model(),
                unknownCount,
                normalizeDeliveryDays(request.deliveryDays())
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
        product.setUnknownCount(parsedRow.unknownCount());
        product.setDeliveryDays(parsedRow.deliveryDays());
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
                product.isUnknownCount(),
                product.getDeliveryDays(),
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
            throw new IllegalArgumentException("Brand code already exists: " + sku);
        }
        if (currentProductId != null && productRepository.existsBySkuIgnoreCaseAndIdNot(sku, currentProductId)) {
            throw new IllegalArgumentException("Brand code already exists: " + sku);
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

    private StockResolution resolveStockQuantity(StockCell... stocks) {
        int quantity = 0;
        boolean hasUnknownQuantity = false;
        boolean hasInStockHint = false;

        for (StockCell stock : stocks) {
            if (stock == null) {
                continue;
            }
            quantity += stock.quantity();
            hasUnknownQuantity = hasUnknownQuantity || stock.unknownQuantity();
            hasInStockHint = hasInStockHint || stock.stockState() == StockState.IN_STOCK;
        }

        if (quantity > 0) {
            return new StockResolution(quantity, deriveStockStateByQuantity(quantity), hasUnknownQuantity);
        }

        if (hasUnknownQuantity) {
            StockState unknownState = hasInStockHint
                    ? StockState.IN_STOCK
                    : StockState.LOW_STOCK;
            return new StockResolution(0, unknownState, true);
        }
        return new StockResolution(0, StockState.OUT_OF_STOCK, false);
    }

    private Integer parseDeliveryDays(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            if (normalized.matches("\\d+")) {
                return Integer.parseInt(normalized);
            }
            if (normalized.matches("\\d+[.,]\\d+")) {
                return (int) Math.round(Double.parseDouble(normalized.replace(",", ".")));
            }
            if (normalized.matches("\\d+\\s*[-/]\\s*\\d+")) {
                String[] parts = normalized.split("[-/]");
                int first = Integer.parseInt(parts[0].trim());
                int second = Integer.parseInt(parts[1].trim());
                return Math.max(first, second);
            }
        } catch (NumberFormatException ignored) {
            return null;
        }
        return null;
    }

    private StockCell parseWarehouseCount(String rawValue, int humanRowNumber, String columnName, List<String> errors) {
        String normalized = normalizeNullable(rawValue);
        if (normalized == null) {
            return new StockCell(0, StockState.OUT_OF_STOCK, false);
        }

        StockCell parsed = parseStockValue(normalized);
        if (parsed == null) {
            addRowError(errors, "Row " + humanRowNumber + ": " + columnName + " value is invalid.");
            return null;
        }
        return parsed;
    }

    private StockCell parseStockValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();

        try {
            if (trimmed.matches("\\d+")) {
                int quantity = Integer.parseInt(trimmed);
                return new StockCell(quantity, deriveStockStateByQuantity(quantity), false);
            }

            if (trimmed.matches("\\d+[.,]\\d+")) {
                int quantity = (int) Math.round(Double.parseDouble(trimmed.replace(",", ".")));
                return new StockCell(quantity, deriveStockStateByQuantity(quantity), false);
            }

            if (trimmed.matches("\\d+\\s*[-/]\\s*\\d+")) {
                String[] parts = trimmed.split("[-/]");
                int quantity = Integer.parseInt(parts[0].trim());
                return new StockCell(quantity, deriveStockStateByQuantity(quantity), false);
            }
        } catch (NumberFormatException ignored) {
        }

        String normalized = normalizeHeader(trimmed);

        if (normalized.equals("0")
                || normalized.equals("yox")
                || normalized.equals("yoxdur")
                || normalized.contains("outofstock")
                || normalized.contains("netvnalichii")) {
            return new StockCell(0, StockState.OUT_OF_STOCK, false);
        }

        if (normalized.equals("azvar")
                || normalized.contains("limited")
                || normalized.contains("few")
                || normalized.contains("lowstock")
                || normalized.contains("malo")) {
            return new StockCell(0, StockState.LOW_STOCK, true);
        }

        if (normalized.equals("var")
                || normalized.contains("instock")
                || normalized.contains("available")
                || normalized.contains("vnalichii")) {
            return new StockCell(0, StockState.IN_STOCK, true);
        }

        return null;
    }

    private StockState resolveManualStockState(String requestedState, int stockQuantity, boolean hasUnknownStock) {
        if (requestedState == null || requestedState.isBlank()) {
            if (hasUnknownStock && stockQuantity <= 0) {
                return StockState.LOW_STOCK;
            }
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

        return getString(header);
    }

    public static String getString(String header) {
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

    private String normalizeCatalogCategory(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        return normalized.replaceAll("\\s+", " ");
    }

    private int normalizeStockQuantity(Integer value) {
        if (value == null) {
            return 0;
        }
        if (value < 0) {
            throw new IllegalArgumentException("Stock quantity must be non-negative.");
        }
        return value;
    }

    private Integer normalizeDeliveryDays(Integer value) {
        if (value == null) {
            return null;
        }
        if (value < 0) {
            throw new IllegalArgumentException("Delivery days must be non-negative.");
        }
        return value;
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

    private List<Product> getCatalogProducts() {
        if (isCatalogActiveFilterEnabled()) {
            return productRepository.findAllByActiveTrueOrderByCreatedAtDesc();
        }
        return productRepository.findAllByOrderByCreatedAtDesc();
    }

    private boolean isCatalogActiveFilterEnabled() {
        return productRepository.existsByActiveTrue();
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
            String model,
            boolean unknownCount,
            Integer deliveryDays
    ) {
    }

    private record StockCell(
            int quantity,
            StockState stockState,
            boolean unknownQuantity
    ) {
    }

    private record StockResolution(
            int quantity,
            StockState stockState,
            boolean unknownCount
    ) {
    }
}
