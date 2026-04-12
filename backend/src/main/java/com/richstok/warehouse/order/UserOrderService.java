package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.UserInfo;
import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.order.dto.UserOrderDetailsResponse;
import com.richstok.warehouse.order.dto.UserOrderItemResponse;
import com.richstok.warehouse.order.dto.UserOrderListItemResponse;
import com.richstok.warehouse.product.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserOrderService {

    private final OrderRecordRepository orderRecordRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserOrderListItemResponse> getMyOrders(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 20);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<UserOrderListItemResponse> mappedPage = orderRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(order -> new UserOrderListItemResponse(
                        order.getId(),
                        order.getInvoiceNumber(),
                        order.getTotalAmount(),
                        order.getItemCount(),
                        order.getCurrencyCode(),
                        order.getFulfillmentCity() != null ? order.getFulfillmentCity().name() : null,
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
        AppUser user = order.getUser();
        UserInfo userInfo = order.getUserInfo();

        List<UserOrderItemResponse> items = order.getItems().stream()
                .map(item -> new UserOrderItemResponse(
                        item.getProductId(),
                        resolveProductName(item),
                        resolveProductSku(item),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal(),
                        resolveProductImage(item)
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
                order.getFulfillmentCity() != null ? order.getFulfillmentCity().name() : null,
                order.getComment(),
                items
        );
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
}
