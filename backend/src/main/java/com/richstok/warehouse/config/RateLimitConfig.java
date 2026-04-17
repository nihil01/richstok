package com.richstok.warehouse.config;
import io.github.bucket4j.Bucket;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    private static final Bucket bucketAuth = Bucket.builder()
            .addLimit(limit -> limit.capacity(10).refillGreedy(2, Duration.ofMinutes(1)))
            .build();

    private static final Bucket bucketAll = Bucket.builder()
            .addLimit(limit -> limit.capacity(50).refillGreedy(25, Duration.ofMinutes(1)))
            .build();

    public boolean limit(LimitType limitType){

        if (limitType == LimitType.AUTH){
            return bucketAuth.tryConsume(1);

        }else{
            return bucketAll.tryConsume(1);

        }

    }

}
