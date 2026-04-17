package com.richstok.warehouse.order;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.JoinType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Locale;

public final class OrderRecordSpecifications {

    private OrderRecordSpecifications() {
    }

    public static Specification<OrderRecord> byQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return null;
        }

        String normalized = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";

        return (root, queryDef, criteriaBuilder) -> {
            var userJoin = root.join("user", JoinType.INNER);
            var userInfoJoin = root.join("userInfo", JoinType.LEFT);

            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(userJoin.get("fullName")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(userJoin.get("email")), normalized),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(criteriaBuilder.coalesce(userInfoJoin.get("phone").as(String.class), "")),
                            normalized
                    ),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(criteriaBuilder.coalesce(userInfoJoin.get("city").as(String.class), "")),
                            normalized
                    ),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(criteriaBuilder.coalesce(userJoin.get("city").as(String.class), "")),
                            normalized
                    )
            );
        };
    }

    public static Specification<OrderRecord> byStatus(OrderStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<OrderRecord> fromDate(LocalDate fromDate) {
        if (fromDate == null) {
            return null;
        }
        OffsetDateTime from = fromDate.atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        return (root, query, criteriaBuilder) -> criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<OrderRecord> toDate(LocalDate toDate) {
        if (toDate == null) {
            return null;
        }
        OffsetDateTime toExclusive = toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        return (root, query, criteriaBuilder) -> criteriaBuilder.lessThan(root.get("createdAt"), toExclusive);
    }

    public static Specification<OrderRecord> build(String query, OrderStatus status, LocalDate fromDate, LocalDate toDate) {
        return Specification.where(byQuery(query))
                .and(byStatus(status))
                .and(fromDate(fromDate))
                .and(toDate(toDate));
    }
}
