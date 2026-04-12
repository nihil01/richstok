package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.UserInfo;
import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.order.dto.AdminOrderDetailsResponse;
import com.richstok.warehouse.order.dto.AdminOrderItemResponse;
import com.richstok.warehouse.order.dto.AdminOrderListItemResponse;
import com.richstok.warehouse.order.dto.AdminOrderSummaryResponse;
import com.richstok.warehouse.product.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderReportService {

    private final OrderRecordRepository orderRecordRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminOrderListItemResponse> getOrders(
            int page,
            int size,
            String query,
            OrderStatus status,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        validateDateRange(fromDate, toDate);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var specification = OrderRecordSpecifications.build(query, status, fromDate, toDate);

        Page<AdminOrderListItemResponse> mappedPage = orderRecordRepository.findAll(specification, pageable)
                .map(this::toListItemResponse);

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
    public AdminOrderDetailsResponse getOrderDetails(Long id) {
        OrderRecord order = orderRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found: " + id));
        return toDetailsResponse(order);
    }

    @Transactional(readOnly = true)
    public AdminOrderSummaryResponse getSummary(
            String query,
            OrderStatus status,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        validateDateRange(fromDate, toDate);
        var specification = OrderRecordSpecifications.build(query, status, fromDate, toDate);
        List<OrderRecord> orders = orderRecordRepository.findAll(specification);

        long totalOrders = orders.size();
        long totalItems = orders.stream()
                .map(OrderRecord::getItemCount)
                .filter(value -> value != null && value > 0)
                .mapToLong(Integer::longValue)
                .sum();

        BigDecimal totalRevenue = orders.stream()
                .map(OrderRecord::getTotalAmount)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal averageOrderValue = totalOrders == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);

        Map<String, Long> statusCounts = orders.stream()
                .map(OrderRecord::getStatus)
                .filter(value -> value != null)
                .collect(Collectors.groupingBy(
                        Enum::name,
                        Collectors.counting()
                ));

        String currencyCode = orders.stream()
                .map(OrderRecord::getCurrencyCode)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse("AZN");

        return new AdminOrderSummaryResponse(
                totalOrders,
                totalItems,
                totalRevenue,
                averageOrderValue,
                currencyCode,
                statusCounts
        );
    }

    private AdminOrderListItemResponse toListItemResponse(OrderRecord order) {
        AppUser user = order.getUser();
        UserInfo userInfo = order.getUserInfo();

        String phone = userInfo != null ? userInfo.getPhone() : user.getPhone();
        String city = userInfo != null ? userInfo.getCity() : user.getCity();
        String country = userInfo != null ? userInfo.getCountry() : user.getCountry();

        return new AdminOrderListItemResponse(
                order.getId(),
                order.getInvoiceNumber(),
                order.getUserId(),
                order.getUserInfoId(),
                user.getFullName(),
                user.getEmail(),
                phone,
                city,
                country,
                order.getFulfillmentCity() != null ? order.getFulfillmentCity().name() : null,
                order.getTotalAmount(),
                order.getItemCount(),
                order.getCurrencyCode(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }

    private AdminOrderDetailsResponse toDetailsResponse(OrderRecord order) {
        AppUser user = order.getUser();
        UserInfo userInfo = order.getUserInfo();

        List<AdminOrderItemResponse> items = order.getItems().stream()
                .map(this::toAdminOrderItemResponse)
                .toList();

        return new AdminOrderDetailsResponse(
                order.getId(),
                order.getInvoiceNumber(),
                order.getUserId(),
                order.getUserInfoId(),
                user.getFullName(),
                user.getEmail(),
                userInfo != null ? userInfo.getPhone() : user.getPhone(),
                userInfo != null ? userInfo.getAddressLine1() : user.getAddressLine1(),
                userInfo != null ? userInfo.getAddressLine2() : user.getAddressLine2(),
                userInfo != null ? userInfo.getCity() : user.getCity(),
                userInfo != null ? userInfo.getPostalCode() : user.getPostalCode(),
                userInfo != null ? userInfo.getCountry() : user.getCountry(),
                order.getFulfillmentCity() != null ? order.getFulfillmentCity().name() : null,
                order.getComment(),
                order.getTotalAmount(),
                order.getItemCount(),
                order.getCurrencyCode(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                items
        );
    }

    private AdminOrderItemResponse toAdminOrderItemResponse(OrderItemRecord item) {
        Product product = item.getProduct();
        String stockState = product != null && product.getStockState() != null
                ? product.getStockState().name()
                : null;

        return new AdminOrderItemResponse(
                item.getId(),
                item.getProductId(),
                product != null ? product.getName() : "Unknown product",
                product != null ? product.getSku() : null,
                product != null ? product.getBrand() : null,
                product != null ? product.getCategory() : null,
                product != null ? product.getOemNumber() : null,
                product != null ? product.getModel() : null,
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal(),
                product != null ? product.getImageUrl() : null,
                stockState
        );
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate.");
        }
    }
}
