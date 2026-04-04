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

        var adminEntity = properties.bootstrap().admin();
        var userEntity = properties.bootstrap().admin();

        ensureUser(adminEntity.email(), adminEntity.fullName(), adminEntity.password(), UserRole.ADMIN);
        ensureUser(userEntity.email(), userEntity.fullName(), userEntity.password(), UserRole.USER);
    }

    private void ensureUser(String email, String fullName, String password, UserRole role) {
        String normalizedEmail = email.trim().toLowerCase();
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
