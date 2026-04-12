package com.richstok.warehouse.cart;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.auth.AppUserPrincipal;
import com.richstok.warehouse.cart.dto.CartItemRequest;
import com.richstok.warehouse.cart.dto.CartMergeItemRequest;
import com.richstok.warehouse.cart.dto.CartResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal AppUserPrincipal principal) {
        return cartService.getCurrentUserCart(requireUser(principal));
    }

    @PutMapping("/items/{productId}")
    public CartResponse upsertItem(@PathVariable Long productId, @Valid @RequestBody CartItemRequest request, @AuthenticationPrincipal AppUserPrincipal principal) {
        return cartService.upsertCurrentUserItem(requireUser(principal), productId, request.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@PathVariable Long productId, @AuthenticationPrincipal AppUserPrincipal principal) {
        return cartService.removeCurrentUserItem(requireUser(principal), productId);
    }

    @DeleteMapping
    public void clearCart(@AuthenticationPrincipal AppUserPrincipal principal) {
        cartService.clearCurrentUserCart(requireUser(principal));
    }

    @PostMapping("/merge")
    public CartResponse mergeCart(@Valid @RequestBody List<CartMergeItemRequest> items, @AuthenticationPrincipal AppUserPrincipal principal) {
        return cartService.mergeCurrentUserCart(requireUser(principal), items);
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
