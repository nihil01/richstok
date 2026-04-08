package com.richstok.warehouse.product;

import  com.richstok.warehouse.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog/products")
@RequiredArgsConstructor
public class CatalogController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> getProducts() {
        return productService.getActiveProducts();
    }

    @GetMapping("/search")
    public List<ProductResponse> searchProducts(@RequestParam(value = "query", required = false) String query) {
        return productService.searchActiveProducts(query);
    }

    @GetMapping("/id/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getActiveById(id);
    }

    @GetMapping("/slug/{slug}")
    public ProductResponse getBySlugPath(@PathVariable String slug) {
        return productService.getActiveBySlug(slug);
    }

    @GetMapping("/{slug}")
    public ProductResponse getBySlug(@PathVariable String slug) {
        return productService.getActiveBySlug(slug);
    }
}
