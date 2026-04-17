package com.richstok.warehouse.common;

public class RateLimitException extends RuntimeException{
    public RateLimitException(String exception) {
        super(exception);
    }
}
