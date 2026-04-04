package com.richstok.warehouse.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlugAndActiveTrue(String slug);

    List<Product> findAllByActiveTrueOrderByCreatedAtDesc();
}
