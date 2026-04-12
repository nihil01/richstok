package com.richstok.warehouse.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface OrderRecordRepository extends JpaRepository<OrderRecord, Long>, JpaSpecificationExecutor<OrderRecord> {

    Page<OrderRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<OrderRecord> findByIdAndUserId(Long id, Long userId);
}
