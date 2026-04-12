package com.richstok.warehouse.order;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.AppUserPrincipal;
import com.richstok.warehouse.order.dto.CheckoutRequest;
import com.richstok.warehouse.order.dto.CheckoutResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request, @AuthenticationPrincipal AppUserPrincipal principal) {
        AppUser user = requireUser(principal);
        return checkoutService.checkout(request, user);
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
