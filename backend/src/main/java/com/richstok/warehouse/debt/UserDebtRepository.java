package com.richstok.warehouse.debt;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserDebtRepository extends JpaRepository<UserDebt, Long> {

    Optional<UserDebt> findByUserId(Long userId);

    List<UserDebt> findAllByUserIdIn(Collection<Long> userIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select debt from UserDebt debt where debt.userId = :userId")
    Optional<UserDebt> findByUserIdForUpdate(@Param("userId") Long userId);
}
