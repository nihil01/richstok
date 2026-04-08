package com.richstok.warehouse.product;


import com.richstok.warehouse.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BrandsController {

    private final AppProperties appProperties;

    @GetMapping("/brands_images")
    public List<String> getBrands() {
        try (var stream = Files.list(Paths.get(appProperties.brands().images()))) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(file -> "/brands/" + file.getFileName().toString())
                    .toList();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


}
