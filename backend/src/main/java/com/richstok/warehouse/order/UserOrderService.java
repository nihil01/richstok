package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.UserInfo;
import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.order.dto.UserOrderDetailsResponse;
import com.richstok.warehouse.order.dto.UserOrderItemResponse;
import com.richstok.warehouse.order.dto.UserOrderListItemResponse;
import com.richstok.warehouse.product.Product;
import com.richstok.warehouse.product.ProductRepository;
import com.richstok.warehouse.product.StockState;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserOrderService {

    private final OrderRecordRepository orderRecordRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserOrderListItemResponse> getMyOrders(Long userId, int page, int size, String query) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 20);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<OrderRecord> specification = buildUserOrdersSpecification(userId, query);
        Page<UserOrderListItemResponse> mappedPage = orderRecordRepository.findAll(specification, pageable)
            .map(order -> new UserOrderListItemResponse(
                order.getId(),
                order.getInvoiceNumber(),
                order.getTotalAmount(),
                order.getItemCount(),
                order.getCurrencyCode(),
                order.getStatus(),
                order.getCreatedAt()
            ));

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
    public UserOrderDetailsResponse getMyOrderDetails(Long userId, Long orderId) {
        OrderRecord order = orderRecordRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        return toDetailsResponse(order);
    }

    @Transactional
    public UserOrderDetailsResponse requestReturn(Long userId, Long orderId) {
        OrderRecord order = orderRecordRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        ensureOrderIsReturnable(order);

        Map<Long, Integer> quantitiesToRestore = order.getItems().stream()
                .map(item -> Map.entry(item.getProductId(), resolveReturnableQuantity(item)))
                .filter(entry -> entry.getKey() != null && entry.getValue() > 0)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        Integer::sum
                ));

        if (quantitiesToRestore.isEmpty()) {
            throw new IllegalArgumentException("All items in this order are already returned.");
        }

        restoreStock(quantitiesToRestore);
        for (OrderItemRecord item : order.getItems()) {
            int returnableQuantity = resolveReturnableQuantity(item);
            if (returnableQuantity <= 0) {
                continue;
            }
            item.setReturnedQuantity(normalizeReturnedQuantity(item.getReturnedQuantity()) + returnableQuantity);
            appendReturnReason(item, returnableQuantity, null);
        }
        refreshOrderStatus(order);

        OrderRecord savedOrder = orderRecordRepository.save(order);
        return toDetailsResponse(savedOrder);
    }

    @Transactional
    public UserOrderDetailsResponse requestItemReturn(
            Long userId,
            Long orderId,
            Long orderItemId,
            Integer quantity,
            String reason
    ) {
        OrderRecord order = orderRecordRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        ensureOrderIsReturnable(order);

        OrderItemRecord item = order.getItems().stream()
                .filter(orderItem -> Objects.equals(orderItem.getId(), orderItemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order item not found: " + orderItemId));

        int quantityToReturn = quantity == null ? 1 : quantity;
        if (quantityToReturn <= 0) {
            throw new IllegalArgumentException("Returned quantity must be greater than zero.");
        }

        int returnableQuantity = resolveReturnableQuantity(item);
        if (returnableQuantity <= 0) {
            throw new IllegalArgumentException("This item is already fully returned.");
        }
        if (quantityToReturn > returnableQuantity) {
            throw new IllegalArgumentException("You can return up to " + returnableQuantity + " item(s).");
        }

        if (item.getProductId() != null) {
            restoreStock(Map.of(item.getProductId(), quantityToReturn));
        }
        item.setReturnedQuantity(normalizeReturnedQuantity(item.getReturnedQuantity()) + quantityToReturn);
        appendReturnReason(item, quantityToReturn, reason);
        refreshOrderStatus(order);

        OrderRecord savedOrder = orderRecordRepository.save(order);
        return toDetailsResponse(savedOrder);
    }

    private UserOrderDetailsResponse toDetailsResponse(OrderRecord order) {
        AppUser user = order.getUser();
        UserInfo userInfo = order.getUserInfo();

        List<UserOrderItemResponse> items = order.getItems().stream()
                .map(item -> new UserOrderItemResponse(
                        item.getId(),
                        item.getProductId(),
                        resolveProductName(item),
                        resolveProductSku(item),
                        item.getQuantity(),
                        normalizeReturnedQuantity(item.getReturnedQuantity()),
                        item.getUnitPrice(),
                        item.getLineTotal(),
                        resolveProductImage(item),
                        item.getReturnReason()
                ))
                .toList();

        return new UserOrderDetailsResponse(
                order.getId(),
                order.getInvoiceNumber(),
                order.getTotalAmount(),
                order.getItemCount(),
                order.getCurrencyCode(),
                order.getStatus(),
                order.getCreatedAt(),
                user.getFullName(),
                userInfo != null ? userInfo.getPhone() : user.getPhone(),
                userInfo != null ? userInfo.getAddressLine1() : user.getAddressLine1(),
                userInfo != null ? userInfo.getAddressLine2() : user.getAddressLine2(),
                userInfo != null ? userInfo.getCity() : user.getCity(),
                userInfo != null ? userInfo.getPostalCode() : user.getPostalCode(),
                userInfo != null ? userInfo.getCountry() : user.getCountry(),
                order.getComment(),
                items
        );
    }

    private Specification<OrderRecord> buildUserOrdersSpecification(Long userId, String query) {
        return (root, queryDef, criteriaBuilder) -> {
            queryDef.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("userId"), userId));

            if (hasText(query)) {
                String normalized = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                var itemsJoin = root.join("items", JoinType.LEFT);
                var productJoin = itemsJoin.join("product", JoinType.LEFT);
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("name").as(String.class), "")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("sku").as(String.class), "")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("brand").as(String.class), "")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("category").as(String.class), "")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("oemNumber").as(String.class), "")), normalized),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(productJoin.get("model").as(String.class), "")), normalized)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void ensureOrderIsReturnable(OrderRecord order) {
        if (order.getStatus() == OrderStatus.RETURNED) {
            throw new IllegalArgumentException("This order is already returned.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled orders cannot be returned.");
        }
        if (order.getStatus() != OrderStatus.COMPLETED
                && order.getStatus() != OrderStatus.SHIPPED
                && order.getStatus() != OrderStatus.PARTIALLY_RETURNED) {
            throw new IllegalArgumentException("Only shipped or completed orders can be returned.");
        }
    }

    private int resolveReturnableQuantity(OrderItemRecord item) {
        int orderedQuantity = normalizeQuantity(item.getQuantity());
        int returnedQuantity = Math.min(normalizeReturnedQuantity(item.getReturnedQuantity()), orderedQuantity);
        return Math.max(orderedQuantity - returnedQuantity, 0);
    }

    private void refreshOrderStatus(OrderRecord order) {
        int totalOrderedQuantity = 0;
        int totalReturnedQuantity = 0;

        for (OrderItemRecord item : order.getItems()) {
            int orderedQuantity = normalizeQuantity(item.getQuantity());
            int returnedQuantity = Math.min(normalizeReturnedQuantity(item.getReturnedQuantity()), orderedQuantity);
            totalOrderedQuantity += orderedQuantity;
            totalReturnedQuantity += returnedQuantity;
        }

        if (totalOrderedQuantity <= 0 || totalReturnedQuantity <= 0) {
            return;
        }

        if (totalReturnedQuantity >= totalOrderedQuantity) {
            order.setStatus(OrderStatus.RETURNED);
            return;
        }

        order.setStatus(OrderStatus.PARTIALLY_RETURNED);
    }

    private void appendReturnReason(OrderItemRecord item, int quantity, String reason) {
        String normalizedReason = normalizeNullable(reason);
        if (!hasText(normalizedReason)) {
            return;
        }
        String line = "[%s] %d pcs: %s".formatted(
                OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                quantity,
                normalizedReason
        );
        if (!hasText(item.getReturnReason())) {
            item.setReturnReason(line);
            return;
        }
        item.setReturnReason(item.getReturnReason().trim() + "\n" + line);
    }

    private void restoreStock(Map<Long, Integer> quantitiesToRestore) {
        List<Long> productIds = quantitiesToRestore.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getKey() > 0 && entry.getValue() != null && entry.getValue() > 0)
                .map(Map.Entry::getKey)
                .toList();
        if (productIds.isEmpty()) {
            return;
        }

        Map<Long, Product> productsById = productRepository.findAllForUpdateByIdIn(productIds).stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        for (Map.Entry<Long, Integer> entry : quantitiesToRestore.entrySet()) {
            Product product = productsById.get(entry.getKey());
            if (product == null) {
                continue;
            }
            int quantityToRestore = Math.max(0, entry.getValue() == null ? 0 : entry.getValue());
            if (quantityToRestore <= 0) {
                continue;
            }
            int nextQuantity = Math.max(0, (product.getStockQuantity() == null ? 0 : product.getStockQuantity()) + quantityToRestore);
            product.setStockQuantity(nextQuantity);
            product.setStockState(resolveStockState(nextQuantity));
        }

        productRepository.saveAll(productsById.values());
    }

    private StockState resolveStockState(int quantity) {
        if (quantity <= 0) {
            return StockState.OUT_OF_STOCK;
        }
        if (quantity <= 5) {
            return StockState.LOW_STOCK;
        }
        return StockState.IN_STOCK;
    }

    private String resolveProductName(OrderItemRecord item) {
        Product product = item.getProduct();
        return product != null ? product.getName() : "Unknown product";
    }

    private String resolveProductSku(OrderItemRecord item) {
        Product product = item.getProduct();
        return product != null ? product.getSku() : null;
    }

    private String resolveProductImage(OrderItemRecord item) {
        Product product = item.getProduct();
        return product != null ? product.getImageUrl() : null;
    }

    private int normalizeQuantity(Integer quantity) {
        return quantity == null ? 0 : Math.max(quantity, 0);
    }

    private int normalizeReturnedQuantity(Integer returnedQuantity) {
        return returnedQuantity == null ? 0 : Math.max(returnedQuantity, 0);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
