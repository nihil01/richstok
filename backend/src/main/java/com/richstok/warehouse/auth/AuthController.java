package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AuthResponse;
import com.richstok.warehouse.auth.dto.ChangePasswordRequest;
import com.richstok.warehouse.auth.dto.LoginRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult authResult = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.buildAuthCookie(authResult.token()))
                .body(new AuthResponse(authResult.user()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookieService.buildClearCookie())
                .build();
    }

    @GetMapping("/me")
    public AuthResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return new AuthResponse(authService.getCurrentUser(requireUser(principal)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, @AuthenticationPrincipal AppUserPrincipal principal) {
        authService.changePassword(requireUser(principal), request);
        return ResponseEntity.noContent().build();
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
