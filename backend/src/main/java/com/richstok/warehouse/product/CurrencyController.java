package com.richstok.warehouse.product;

import com.richstok.warehouse.config.AppProperties;
import com.richstok.warehouse.product.dto.CurrencyDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyRateService currencyRateService;

    @GetMapping("/currency_rate")
    public CurrencyDTO getBrands() {

        return currencyRateService.getRate();

    }


}
