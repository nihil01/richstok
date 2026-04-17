package com.richstok.warehouse.product;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> activeOnly() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("active"));
    }

    public static Specification<Product> bySearchQuery(String rawQuery) {
        return (root, query, criteriaBuilder) -> {
            String normalizedQuery = rawQuery == null ? "" : rawQuery.trim();
            if (normalizedQuery.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String likePattern = "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
            List<Predicate> predicates = new ArrayList<>();

            String[] textFields = {"name", "slug", "sku", "category", "oemNumber", "description", "brand", "model"};
            for (String field : textFields) {
                predicates.add(
                    criteriaBuilder.like(
                        criteriaBuilder.lower(criteriaBuilder.coalesce(root.get(field), "")),
                        likePattern
                    )
                );
            }

            try {
                predicates.add(criteriaBuilder.equal(root.get("id"), Long.parseLong(normalizedQuery)));
            } catch (NumberFormatException ignored) {
            }

            try {
                predicates.add(criteriaBuilder.equal(root.get("price"), new BigDecimal(normalizedQuery)));
            } catch (NumberFormatException ignored) {
            }

            try {
                predicates.add(criteriaBuilder.equal(root.get("stockQuantity"), Integer.parseInt(normalizedQuery)));
            } catch (NumberFormatException ignored) {
            }

            try {
                predicates.add(criteriaBuilder.equal(root.get("deliveryDays"), Integer.parseInt(normalizedQuery)));
            } catch (NumberFormatException ignored) {
            }

            String normalizedUpper = normalizedQuery.toUpperCase(Locale.ROOT);
            if ("TRUE".equals(normalizedUpper) || "ACTIVE".equals(normalizedUpper)) {
                predicates.add(criteriaBuilder.isTrue(root.get("active")));
            } else if ("FALSE".equals(normalizedUpper) || "INACTIVE".equals(normalizedUpper)) {
                predicates.add(criteriaBuilder.isFalse(root.get("active")));
            }

            if ("UNKNOWN".equals(normalizedUpper)
                    || "VAR".equals(normalizedUpper)
                    || "AZVAR".equals(normalizedUpper)) {
                predicates.add(criteriaBuilder.isTrue(root.get("unknownCount")));
            }

            try {
                StockState stockState = StockState.valueOf(normalizedUpper);
                predicates.add(criteriaBuilder.equal(root.get("stockState"), stockState));
            } catch (IllegalArgumentException ignored) {
            }

            return criteriaBuilder.or(predicates.toArray(Predicate[]::new));
        };
    }

    public static Specification<Product> byCategory(String rawCategory) {
        return (root, query, criteriaBuilder) -> {
            String category = rawCategory == null ? "" : rawCategory.trim();
            if (category.isBlank()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("category"), "")),
                    category.toLowerCase(Locale.ROOT)
            );
        };
    }
}
