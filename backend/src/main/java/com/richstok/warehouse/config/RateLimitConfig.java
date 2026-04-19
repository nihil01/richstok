package com.richstok.warehouse.config;

import io.github.bucket4j.Bucket;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> allBuckets = new ConcurrentHashMap<>();

    public boolean allowRequest(String key, LimitType limitType) {
        Bucket bucket;

        if (limitType == LimitType.AUTH) {
            bucket = authBuckets.computeIfAbsent(key, k -> createAuthBucket());
        } else {
            bucket = allBuckets.computeIfAbsent(key, k -> createAllBucket());
        }

        return bucket.tryConsume(1);
    }

    private Bucket createAuthBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit
                        .capacity(10)
                        .refillGreedy(5, Duration.ofMinutes(1)))
                .build();
    }

    private Bucket createAllBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit
                        .capacity(120)
                        .refillGreedy(60, Duration.ofMinutes(1)))
                .build();
    }
}