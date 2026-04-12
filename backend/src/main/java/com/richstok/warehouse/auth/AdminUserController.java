package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AdminUserActiveRequest;
import com.richstok.warehouse.auth.dto.AdminUserCreateRequest;
import com.richstok.warehouse.auth.dto.AdminUserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserResponse> getUsers() {
        return adminUserService.getAllUsers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse create(@Valid @RequestBody AdminUserCreateRequest request) {
        return adminUserService.createUser(request);
    }

    @PatchMapping("/{id}/active")
    public AdminUserResponse setActive(@PathVariable Long id, @Valid @RequestBody AdminUserActiveRequest request) {
        return adminUserService.setUserActive(id, Boolean.TRUE.equals(request.active()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        adminUserService.deleteUser(id, requireUser(principal));
    }

    private AppUser requireUser(AppUserPrincipal principal) {
        if (principal == null || principal.user() == null) {
            throw new BadCredentialsException("Unauthorized.");
        }
        return principal.user();
    }
}
