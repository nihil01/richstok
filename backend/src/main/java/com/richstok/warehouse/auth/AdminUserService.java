package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AdminUserCreateRequest;
import com.richstok.warehouse.auth.dto.AdminUserResponse;
import com.richstok.warehouse.common.NotFoundException;
import com.richstok.warehouse.debt.UserDebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthCredentialsEmailService authCredentialsEmailService;
    private final UserDebtService userDebtService;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        List<AppUser> users = appUserRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, UserDebtService.DebtSnapshot> debtByUserId = userDebtService.getDebtSnapshots(
                users.stream().map(AppUser::getId).toList()
        );

        return users.stream()
                .map(user -> toResponse(user, debtByUserId.get(user.getId())))
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
        return toResponse(savedUser, userDebtService.getDebtSnapshot(savedUser.getId()));
    }

    @Transactional
    public AdminUserResponse setUserActive(Long id, boolean active) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User id not found: " + id));
        user.setActive(active);
        AppUser savedUser = appUserRepository.save(user);
        return toResponse(savedUser, userDebtService.getDebtSnapshot(savedUser.getId()));
    }

    @Transactional
    public AdminUserResponse setUserDebtLimit(Long id, BigDecimal debtLimit) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User id not found: " + id));
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Debt limit cannot be assigned to admin users.");
        }
        UserDebtService.DebtSnapshot debtSnapshot = userDebtService.setDebtLimit(id, debtLimit);
        return toResponse(user, debtSnapshot);
    }

    @Transactional
    public AdminUserResponse resetUserDebtLimit(Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User id not found: " + id));
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Debt limit cannot be assigned to admin users.");
        }
        UserDebtService.DebtSnapshot debtSnapshot = userDebtService.resetDebtLimit(id);
        return toResponse(user, debtSnapshot);
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

    private AdminUserResponse toResponse(AppUser user, UserDebtService.DebtSnapshot debtSnapshot) {
        UserDebtService.DebtSnapshot safeDebtSnapshot = debtSnapshot != null
                ? debtSnapshot
                : userDebtService.getDebtSnapshot(user.getId());
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                safeDebtSnapshot.debtLimit(),
                safeDebtSnapshot.currentDebt(),
                safeDebtSnapshot.availableDebt(),
                user.getCreatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
