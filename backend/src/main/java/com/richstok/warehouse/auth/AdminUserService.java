package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AdminUserCreateRequest;
import com.richstok.warehouse.auth.dto.AdminUserResponse;
import com.richstok.warehouse.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthCredentialsEmailService authCredentialsEmailService;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return appUserRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(AdminUserCreateRequest request) {
        String email = normalizeEmail(request.email());
        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("User with this email already exists.");
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setActive(Boolean.TRUE.equals(request.active()));

        AppUser savedUser = appUserRepository.save(user);
        authCredentialsEmailService.sendCredentials(savedUser, request.password());
        return toResponse(savedUser);
    }

    @Transactional
    public AdminUserResponse setUserActive(Long id, boolean active) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User id not found: " + id));
        user.setActive(active);
        return toResponse(appUserRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id, AppUser actor) {
        AppUser targetUser = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User id not found: " + id));

        if (targetUser.getId().equals(actor.getId())) {
            throw new IllegalArgumentException("You cannot delete your own account.");
        }

        if (targetUser.getRole() == UserRole.ADMIN && appUserRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new IllegalArgumentException("You cannot delete the last admin account.");
        }

        appUserRepository.delete(targetUser);
    }

    private AdminUserResponse toResponse(AppUser user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
