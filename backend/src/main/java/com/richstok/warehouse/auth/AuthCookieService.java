package com.richstok.warehouse.auth;

import com.richstok.warehouse.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthCookieService {
    private final AppProperties app;

    public String buildAuthCookie(String token) {

        AppProperties.Security security = app.security();

        return ResponseCookie.from(security.cookieName(), token)
                .httpOnly(true)
                .secure(security.cookieSecure())
                .path("/")
                .sameSite(security.cookieSameSite())
                .maxAge(Duration.ofSeconds(security.cookieMaxAgeSeconds()))
                .build()
                .toString();
    }

    public String buildClearCookie() {

        AppProperties.Security security = app.security();

        return ResponseCookie.from(security.cookieName(), "")
                .httpOnly(true)
                .secure(security.cookieSecure())
                .path("/")
                .sameSite(security.cookieSameSite())
                .maxAge(Duration.ZERO)
                .build()
                .toString();
    }

    public String getCookieName(){
        return app.security().cookieName();
    }
}
