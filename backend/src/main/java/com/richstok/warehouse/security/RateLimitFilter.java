package com.richstok.warehouse.security;

import com.richstok.warehouse.config.LimitType;
import com.richstok.warehouse.config.RateLimitConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String url = request.getRequestURI();
        boolean allowed;

        if (url.startsWith("/api/v1/auth")) {
            allowed = rateLimitConfig.limit(LimitType.AUTH);
            if (!allowed) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"message\":\"Too many authentication requests!\"}");
                return;
            }
        } else {
            allowed = rateLimitConfig.limit(LimitType.ALL);
            if (!allowed) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"message\":\"Too many requests!\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}