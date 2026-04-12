package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.AppUserPrincipal;
import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.order.dto.UserOrderDetailsResponse;
import com.richstok.warehouse.order.dto.UserOrderListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders/my")
@RequiredArgsConstructor
public class UserOrderController {

    private final UserOrderService userOrderService;

    @GetMapping
    public PageResponse<UserOrderListItemResponse> getMyOrders(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        AppUser user = requireUser(principal);
        return userOrderService.getMyOrders(user.getId(), page, size);
    }

    @GetMapping("/{id}")
    public UserOrderDetailsResponse getMyOrderDetails(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long id
    ) {
        AppUser user = requireUser(principal);
        return userOrderService.getMyOrderDetails(user.getId(), id);
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
