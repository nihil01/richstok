package com.richstok.warehouse.cart;

import com.richstok.warehouse.auth.AppUser;
import com.richstok.warehouse.cart.dto.CartItemResponse;
import com.richstok.warehouse.cart.dto.CartMergeItemRequest;
import com.richstok.warehouse.cart.dto.CartResponse;
import com.richstok.warehouse.product.Product;
import com.richstok.warehouse.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final long CART_TTL_DAYS = 14;

    private final StringRedisTemplate redisTemplate;
    private final ProductRepository productRepository;

    public CartResponse getCurrentUserCart(AppUser user) {
        return buildCartResponse(user);
    }

    public CartResponse upsertCurrentUserItem(AppUser user, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero.");
        }
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        if (product.getStockState() == null || product.getStockQuantity() <= 0) {
            throw new IllegalArgumentException("Product is out of stock.");
        }

        String key = getUserCartKey(user.getId());
        redisTemplate.opsForHash().put(key, productId.toString(), Integer.toString(quantity));
        redisTemplate.expire(key, CART_TTL_DAYS, TimeUnit.DAYS);
        return buildCartResponse(user);
    }

    public CartResponse removeCurrentUserItem(AppUser user, Long productId) {
        String key = getUserCartKey(user.getId());
        redisTemplate.opsForHash().delete(key, productId.toString());
        return buildCartResponse(user);
    }

    public void clearCurrentUserCart(AppUser user) {
        clearCartByUserId(user.getId());
    }

    public CartResponse mergeCurrentUserCart(AppUser user, List<CartMergeItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return getCurrentUserCart(user);
        }
        String key = getUserCartKey(user.getId());

        Map<Long, Integer> merged = new LinkedHashMap<>(readRawCart(user.getId()));
        for (CartMergeItemRequest item : items) {
            Product product = productRepository.findByIdAndActiveTrue(item.productId())
                    .orElse(null);
            if (product == null) {
                continue;
            }
            merged.merge(item.productId(), item.quantity(), Integer::sum);
        }

        redisTemplate.delete(key);
        if (!merged.isEmpty()) {
            Map<String, String> redisValues = merged.entrySet().stream()
                    .collect(Collectors.toMap(entry -> entry.getKey().toString(), entry -> entry.getValue().toString()));
            redisTemplate.opsForHash().putAll(key, redisValues);
            redisTemplate.expire(key, CART_TTL_DAYS, TimeUnit.DAYS);
        }
        return buildCartResponse(user);
    }

    public Map<Long, Integer> getRawCartByUserId(Long userId) {
        return readRawCart(userId);
    }

    public void clearCartByUserId(Long userId) {
        redisTemplate.delete(getUserCartKey(userId));
    }

    private CartResponse buildCartResponse(AppUser user) {
        Map<Long, Integer> requestedItems = readRawCart(user.getId());
        if (requestedItems.isEmpty()) {
            return new CartResponse(List.of(), 0, BigDecimal.ZERO);
        }

        List<Long> productIds = new ArrayList<>(requestedItems.keySet());
        Map<Long, Product> productsById = productRepository.findAllById(productIds).stream()
                .filter(Product::isActive)
                .collect(Collectors.toMap(Product::getId, product -> product));

        List<CartItemResponse> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (Map.Entry<Long, Integer> entry : requestedItems.entrySet()) {
            Product product = productsById.get(entry.getKey());
            if (product == null) {
                continue;
            }
            int quantity = Math.max(1, entry.getValue());
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(lineTotal);
            totalItems += quantity;
            items.add(new CartItemResponse(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    product.getImageUrl(),
                    product.getCategory(),
                    product.getBrand(),
                    product.getPrice(),
                    quantity,
                    lineTotal,
                    product.getStockState().name(),
                    product.getStockQuantity(),
                    product.isUnknownCount(),
                    product.getDeliveryDays()
            ));
        }

        return new CartResponse(items, totalItems, subtotal);
    }

    private Map<Long, Integer> readRawCart(Long userId) {
        Map<Object, Object> rawEntries = redisTemplate.opsForHash().entries(getUserCartKey(userId));
        if (rawEntries.isEmpty()) {
            return Map.of();
        }

        Map<Long, Integer> parsed = new LinkedHashMap<>();
        for (Map.Entry<Object, Object> entry : rawEntries.entrySet()) {
            Long productId = parseLong(entry.getKey());
            Integer quantity = parseInt(entry.getValue());
            if (productId == null || quantity == null || quantity <= 0) {
                continue;
            }
            parsed.put(productId, quantity);
        }
        return parsed;
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Integer parseInt(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String getUserCartKey(Long userId) {
        return "richstok:cart:user:" + userId;
    }
}
