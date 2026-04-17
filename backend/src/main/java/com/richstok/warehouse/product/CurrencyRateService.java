package com.richstok.warehouse.product;

import com.richstok.warehouse.config.AppProperties;
import com.richstok.warehouse.product.dto.CurrencyDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public final class CurrencyRateService {

    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private final AppProperties appProperties;

    private static CurrencyDTO currencyDto = null;
    private static Instant lastSave = null;
    private static final int refreshRate = 3600 * 24 * 1000;

    public CurrencyDTO getRate() {

        String API_KEY = appProperties.currency().apiKey();

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