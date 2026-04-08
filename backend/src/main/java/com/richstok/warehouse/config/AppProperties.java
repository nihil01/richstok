package com.richstok.warehouse.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Cors cors,
        Security security,
        Bootstrap bootstrap,
        Brands brands
) {
    public record Cors(List<String> allowedOrigins) {}

    public record Brands(String images) {}

    public record Security(
            String jwtSecret,
            long jwtExpirationSeconds,
            String cookieName,
            boolean cookieSecure,
            String cookieSameSite,
            long cookieMaxAgeSeconds
    ) {}

    public record Bootstrap(
            Entity admin,
            Entity user
    ) {
        public record Entity(
                String email,
                String password,
                String fullName
        ) {}
    }
}
