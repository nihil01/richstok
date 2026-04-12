package com.richstok.warehouse.product;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(nullable = false, unique = true, length = 120)
    private String sku;

    @Column(nullable = false, length = 120)
    private String category;

    @Column(length = 140)
    private String oemNumber;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stockQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StockState stockState;

    @Column(length = 120)
    private String brand;

    @Column(name = "baku_count", nullable = false)
    private Integer bakuCount;

    @Column(name = "baku_count_unknown", nullable = false)
    private boolean bakuCountUnknown;

    @Column(name = "ganja_count", nullable = false)
    private Integer ganjaCount;

    @Column(name = "ganja_count_unknown", nullable = false)
    private boolean ganjaCountUnknown;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @Column(nullable = false)
    private String model;

    @Column(columnDefinition = "text")
    private String imageUrl;


    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

}
