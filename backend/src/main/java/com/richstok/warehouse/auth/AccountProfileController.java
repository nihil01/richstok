package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AccountProfileRequest;
import com.richstok.warehouse.auth.dto.AccountProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account/profile")
@RequiredArgsConstructor
public class AccountProfileController {

    private final AccountProfileService accountProfileService;

    @GetMapping
    public AccountProfileResponse getProfile(@AuthenticationPrincipal AppUserPrincipal principal) {
        return accountProfileService.getProfile(requireUser(principal));
    }

    @PutMapping
    public AccountProfileResponse updateProfile(@Valid @RequestBody AccountProfileRequest request, @AuthenticationPrincipal AppUserPrincipal principal) {
        return accountProfileService.updateProfile(requireUser(principal), request);
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
