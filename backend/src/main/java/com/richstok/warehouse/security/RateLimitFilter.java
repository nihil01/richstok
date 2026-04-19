package com.richstok.warehouse.security;

import com.richstok.warehouse.config.LimitType;
import com.richstok.warehouse.config.RateLimitConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;

    public RateLimitFilter(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();

        LimitType limitType = resolveLimitType(path);

        boolean allowed = rateLimitConfig.allowRequest(ip, limitType);

        if (!allowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("""
                {
                  "error": "Too many requests"
                }
                """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private LimitType resolveLimitType(String path) {
        if (path.startsWith("/api/auth")) {
            return LimitType.AUTH;
        }
        return LimitType.ALL;
    }
}