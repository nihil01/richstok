package com.richstok.warehouse.product;

import com.richstok.warehouse.product.dto.CurrencyDTO;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.time.Instant;

public final class CurrencyRateService {

    private static final String API_KEY = "68a5e50543f4fb78d18ffd28";
    private static final HttpClient CLIENT = HttpClient.newHttpClient();

    private static CurrencyDTO currencyDto = null;
    private static Instant lastSave = null;
    private static final int refreshRate = 3600 * 24 * 1000;

    public static CurrencyDTO getRate() {

        if (currencyDto != null && lastSave != null && Instant.now().isBefore(lastSave.plusMillis(refreshRate))){
            return currencyDto;
        }


        HttpRequest request = HttpRequest.newBuilder()
            .GET()
            .uri(URI.create("https://v6.exchangerate-api.com/v6/%s/latest/AZN".formatted(API_KEY)))
            .build();

        return CLIENT.sendAsync(request, new CustomBodyHandler<>(CurrencyDTO.class))
            .thenApply(resp -> {

                if (resp.statusCode() != 200) {
                    throw new RuntimeException(
                            "Something went wrong with exchange API. Status: " + resp.statusCode()
                    );
                }

                CurrencyDTO result = resp.body();

                currencyDto = result;
                lastSave = Instant.now();

                return result;
            })
            .join();
    }
}