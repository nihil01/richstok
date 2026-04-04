package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AuthUserResponse;
import com.richstok.warehouse.auth.dto.LoginRequest;
import com.richstok.warehouse.auth.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResult register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("User with this email already exists.");
        }

        AppUser appUser = new AppUser();
        appUser.setEmail(email);
        appUser.setFullName(request.fullName().trim());
        appUser.setPasswordHash(passwordEncoder.encode(request.password()));
        appUser.setRole(UserRole.USER);
        appUser.setActive(true);

        AppUser saved = appUserRepository.save(appUser);
        String token = jwtService.generateToken(new AppUserPrincipal(saved));
        return new AuthResult(toResponse(saved), token);
    }

    public AuthResult login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        AppUser appUser = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));
        String token = jwtService.generateToken(new AppUserPrincipal(appUser));
        return new AuthResult(toResponse(appUser), token);
    }

    public AuthUserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException("Unauthorized.");
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof AppUserPrincipal(AppUser user))) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return toResponse(user);
    }

    private AuthUserResponse toResponse(AppUser appUser) {
        return new AuthUserResponse(
                appUser.getId(),
                appUser.getEmail(),
                appUser.getFullName(),
                appUser.getRole()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    public record AuthResult(AuthUserResponse user, String token) {
    }
}
