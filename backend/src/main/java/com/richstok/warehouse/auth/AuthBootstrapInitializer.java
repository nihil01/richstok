package com.richstok.warehouse.auth;

import com.richstok.warehouse.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthBootstrapInitializer implements ApplicationRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.Bootstrap bootstrap = properties.bootstrap();
        if (bootstrap == null) {
            ensureUser("admin@richstok.local", "Richstok Admin", "Admin123!", UserRole.ADMIN);
            return;
        }

        AppProperties.Bootstrap.Entity adminEntity = bootstrap.admin();
        AppProperties.Bootstrap.Entity userEntity = bootstrap.user();

        if (adminEntity != null) {
            ensureUser(adminEntity.email(), adminEntity.fullName(), adminEntity.password(), UserRole.ADMIN);
        }
        if (userEntity != null) {
            ensureUser(userEntity.email(), userEntity.fullName(), userEntity.password(), UserRole.USER);
        }
    }

    private void ensureUser(String email, String fullName, String password, UserRole role) {
        if (email == null || fullName == null || password == null) {
            return;
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail.isBlank()) {
            return;
        }
        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }

        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setFullName(fullName.trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        appUserRepository.save(user);
    }
}
