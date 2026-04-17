package com.richstok.warehouse.order;

import com.richstok.warehouse.common.dto.PageResponse;
import com.richstok.warehouse.order.dto.AdminOrderDetailsResponse;
import com.richstok.warehouse.order.dto.AdminOrderListItemResponse;
import com.richstok.warehouse.order.dto.AdminOrderStatusUpdateRequest;
import com.richstok.warehouse.order.dto.AdminOrderSummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderReportService adminOrderReportService;
    private final AdminOrderWorkflowService adminOrderWorkflowService;

    @GetMapping
    public PageResponse<AdminOrderListItemResponse> getOrders(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) OrderStatus status,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return adminOrderReportService.getOrders(page, size, query, status, fromDate, toDate);
    }

    @GetMapping("/summary")
    public AdminOrderSummaryResponse getSummary(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) OrderStatus status,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return adminOrderReportService.getSummary(query, status, fromDate, toDate);
    }

    @GetMapping("/{id}")
    public AdminOrderDetailsResponse getOrderDetails(@PathVariable Long id) {
        return adminOrderReportService.getOrderDetails(id);
    }

    @PatchMapping("/{id}/status")
    public AdminOrderDetailsResponse updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request
    ) {
        adminOrderWorkflowService.updateOrderStatus(id, request.status(), request.note());
        return adminOrderReportService.getOrderDetails(id);
    }
}
