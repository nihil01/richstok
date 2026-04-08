package com.richstok.warehouse.product;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.http.HttpResponse;

public class CustomBodyHandler<W> implements HttpResponse.BodyHandler<W> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final Class<W> targetClass;

    public CustomBodyHandler(Class<W> targetClass) {
        this.targetClass = targetClass;
    }

    @Override
    public HttpResponse.BodySubscriber<W> apply(HttpResponse.ResponseInfo responseInfo) {
        return HttpResponse.BodySubscribers.mapping(
                HttpResponse.BodySubscribers.ofInputStream(),
                this::readValue
        );
    }

    private W readValue(InputStream inputStream) {
        try (InputStream stream = inputStream) {
            return OBJECT_MAPPER.readValue(stream, targetClass);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}