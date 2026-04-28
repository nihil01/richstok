package com.richstok.warehouse.debt;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDebtService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final UserDebtRepository userDebtRepository;

    @Transactional(readOnly = true)
    public DebtSnapshot getDebtSnapshot(Long userId) {
        if (userId == null) {
            return new DebtSnapshot(ZERO, ZERO);
        }
        return userDebtRepository.findByUserId(userId)
                .map(this::toSnapshot)
                .orElseGet(() -> new DebtSnapshot(ZERO, ZERO));
    }

    @Transactional(readOnly = true)
    public Map<Long, DebtSnapshot> getDebtSnapshots(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return userDebtRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserDebt::getUserId, this::toSnapshot));
    }

    @Transactional
    public DebtSnapshot setDebtLimit(Long userId, BigDecimal debtLimit) {
        UserDebt debt = findOrCreateForUpdate(userId);
        BigDecimal normalizedLimit = normalizeMoney(debtLimit);
        BigDecimal normalizedCurrentDebt = normalizeMoney(debt.getCurrentDebt());
        if (normalizedCurrentDebt.compareTo(normalizedLimit) > 0) {
            throw new IllegalArgumentException(
                    "Debt limit cannot be lower than current debt (" + formatMoney(normalizedCurrentDebt) + " AZN)."
            );
        }
        debt.setDebtLimit(normalizedLimit);
        debt.setCurrentDebt(normalizedCurrentDebt);
        return toSnapshot(userDebtRepository.save(debt));
    }

    @Transactional
    public DebtSnapshot resetDebtLimit(Long userId) {
        UserDebt debt = findOrCreateForUpdate(userId);
        debt.setDebtLimit(ZERO);
        debt.setCurrentDebt(ZERO);
        return toSnapshot(userDebtRepository.save(debt));
    }

    @Transactional
    public DebtSnapshot reserveDebt(Long userId, BigDecimal amount, String language) {
        BigDecimal normalizedAmount = normalizeMoney(amount);
        if (normalizedAmount.compareTo(ZERO) <= 0) {
            return getDebtSnapshot(userId);
        }

        UserDebt debt = findOrCreateForUpdate(userId);
        BigDecimal currentDebt = normalizeMoney(debt.getCurrentDebt());
        BigDecimal debtLimit = normalizeMoney(debt.getDebtLimit());
        BigDecimal nextDebt = currentDebt.add(normalizedAmount).setScale(2, RoundingMode.HALF_UP);

        if (nextDebt.compareTo(debtLimit) > 0) {
            BigDecimal requiredPayment = nextDebt.subtract(debtLimit).setScale(2, RoundingMode.HALF_UP);
            throw new IllegalArgumentException(
                    buildDebtLimitExceededMessage(language, requiredPayment)
            );
        }

        debt.setCurrentDebt(nextDebt);
        return toSnapshot(userDebtRepository.save(debt));
    }

    @Transactional
    public DebtSnapshot reduceDebt(Long userId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizeMoney(amount);
        if (normalizedAmount.compareTo(ZERO) <= 0) {
            return getDebtSnapshot(userId);
        }

        UserDebt debt = findOrCreateForUpdate(userId);
        BigDecimal currentDebt = normalizeMoney(debt.getCurrentDebt());
        BigDecimal nextDebt = currentDebt.subtract(normalizedAmount);
        if (nextDebt.compareTo(ZERO) < 0) {
            nextDebt = ZERO;
        }
        debt.setCurrentDebt(nextDebt.setScale(2, RoundingMode.HALF_UP));
        return toSnapshot(userDebtRepository.save(debt));
    }

    private UserDebt findOrCreateForUpdate(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required.");
        }

        return userDebtRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> createDebtRow(userId));
    }

    private UserDebt createDebtRow(Long userId) {
        UserDebt userDebt = new UserDebt();
        userDebt.setUserId(userId);
        userDebt.setDebtLimit(ZERO);
        userDebt.setCurrentDebt(ZERO);

        try {
            return userDebtRepository.saveAndFlush(userDebt);
        } catch (DataIntegrityViolationException duplicateUserDebtException) {
            return userDebtRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> duplicateUserDebtException);
        }
    }

    private DebtSnapshot toSnapshot(UserDebt userDebt) {
        return new DebtSnapshot(
                normalizeMoney(userDebt.getDebtLimit()),
                normalizeMoney(userDebt.getCurrentDebt())
        );
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return ZERO;
        }
        return value.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatMoney(BigDecimal value) {
        return normalizeMoney(value).toPlainString();
    }

    private String buildDebtLimitExceededMessage(String language, BigDecimal requiredPayment) {
        String amount = formatMoney(requiredPayment);
        return switch (resolveLanguage(language)) {
            case "az" -> "Borc limiti aşılıb. Yeni sifariş üçün ən azı "
                    + amount
                    + " AZN borcunuzu ödəyin.";
            case "ru" -> "Превышен лимит долга. Погасите минимум "
                    + amount
                    + " AZN перед новым заказом.";
            default -> "Debt limit exceeded. Please pay at least "
                    + amount
                    + " AZN before placing a new order.";
        };
    }

    private String resolveLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        String normalized = language.trim().toLowerCase();
        if (normalized.startsWith("az")) {
            return "az";
        }
        if (normalized.startsWith("ru")) {
            return "ru";
        }
        return "en";
    }

    public record DebtSnapshot(
            BigDecimal debtLimit,
            BigDecimal currentDebt
    ) {
        public BigDecimal availableDebt() {
            return debtLimit.subtract(currentDebt).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }

        public DebtSnapshot {
            Objects.requireNonNull(debtLimit, "debtLimit");
            Objects.requireNonNull(currentDebt, "currentDebt");
        }
    }
}
