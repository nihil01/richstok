package com.richstok.warehouse.product;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ProductPricing {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private ProductPricing() {
    }

    public static BigDecimal normalizeDiscountPercent(BigDecimal discountPercent) {
        if (discountPercent == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal normalized = discountPercent.setScale(2, RoundingMode.HALF_UP);
        if (normalized.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (normalized.compareTo(HUNDRED) > 0) {
            return HUNDRED.setScale(2, RoundingMode.HALF_UP);
        }
        return normalized;
    }

    public static boolean hasDiscount(BigDecimal discountPercent) {
        return normalizeDiscountPercent(discountPercent).compareTo(BigDecimal.ZERO) > 0;
    }

    public static BigDecimal resolveDiscountedPrice(BigDecimal basePrice, BigDecimal discountPercent) {
        if (basePrice == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal normalizedBase = basePrice.setScale(2, RoundingMode.HALF_UP);
        BigDecimal normalizedDiscount = normalizeDiscountPercent(discountPercent);
        if (normalizedDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return normalizedBase;
        }
        BigDecimal multiplier = BigDecimal.ONE.subtract(
                normalizedDiscount.divide(HUNDRED, 6, RoundingMode.HALF_UP)
        );
        BigDecimal discounted = normalizedBase.multiply(multiplier);
        if (discounted.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return discounted.setScale(2, RoundingMode.HALF_UP);
    }
}

