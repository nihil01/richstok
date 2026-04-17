package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AuthUserResponse;
import com.richstok.warehouse.auth.dto.ChangePasswordRequest;
import com.richstok.warehouse.auth.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResult login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        AppUser appUser = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));
        String token = jwtService.generateToken(new AppUserPrincipal(appUser));
        return new AuthResult(toResponse(appUser), token);
    }

    public AuthUserResponse getCurrentUser(AppUser user) {
        return toResponse(user);
    }

    public void changePassword(AppUser user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is invalid.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        appUserRepository.save(user);
    }

    private AuthUserResponse toResponse(AppUser appUser) {
        return new AuthUserResponse(
                appUser.getId(),
                appUser.getEmail(),
                appUser.getFullName(),
                appUser.getAvatarUrl(),
                appUser.getRole()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    public record AuthResult(AuthUserResponse user, String token) {
    }
}
