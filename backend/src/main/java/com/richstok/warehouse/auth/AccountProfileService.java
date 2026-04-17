package com.richstok.warehouse.auth;

import com.richstok.warehouse.auth.dto.AccountProfileRequest;
import com.richstok.warehouse.auth.dto.AccountProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountProfileService {

    private final AppUserRepository appUserRepository;
    private final UserInfoRepository userInfoRepository;

    @Transactional(readOnly = true)
    public AccountProfileResponse getProfile(AppUser user) {
        UserInfo userInfo = userInfoRepository.findByUserId(user.getId())
                .orElse(null);
        return toResponse(user, userInfo);
    }

    @Transactional
    public AccountProfileResponse updateProfile(AppUser user, AccountProfileRequest request) {
        user.setFullName(request.fullName().trim());
        user.setAvatarUrl(normalizeAvatar(request.avatarUrl()));
        AppUser savedUser = appUserRepository.save(user);

        UserInfo userInfo = userInfoRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserInfo created = new UserInfo();
                    created.setUserId(user.getId());
                    return created;
                });
        userInfo.setPhone(normalizeNullable(request.phone()));
        userInfo.setPhoneAlt(normalizeNullable(request.phoneAlt()));
        userInfo.setAddressLine1(normalizeNullable(request.addressLine1()));
        userInfo.setAddressLine2(normalizeNullable(request.addressLine2()));
        userInfo.setCity(normalizeNullable(request.city()));
        userInfo.setPostalCode(normalizeNullable(request.postalCode()));
        userInfo.setCountry(normalizeNullable(request.country()));

        UserInfo savedUserInfo = userInfoRepository.save(userInfo);
        return toResponse(savedUser, savedUserInfo);
    }

    private AccountProfileResponse toResponse(AppUser user, UserInfo userInfo) {
        String phone = userInfo != null ? userInfo.getPhone() : user.getPhone();
        String phoneAlt = userInfo != null ? userInfo.getPhoneAlt() : user.getPhoneAlt();
        String addressLine1 = userInfo != null ? userInfo.getAddressLine1() : user.getAddressLine1();
        String addressLine2 = userInfo != null ? userInfo.getAddressLine2() : user.getAddressLine2();
        String city = userInfo != null ? userInfo.getCity() : user.getCity();
        String postalCode = userInfo != null ? userInfo.getPostalCode() : user.getPostalCode();
        String country = userInfo != null ? userInfo.getCountry() : user.getCountry();

        return new AccountProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRole(),
                phone,
                phoneAlt,
                addressLine1,
                addressLine2,
                city,
                postalCode,
                country
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeAvatar(String avatarUrl) {
        if (avatarUrl == null) {
            return null;
        }
        String trimmed = avatarUrl.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        if (trimmed.startsWith("data:image/")) {
            return trimmed;
        }
        if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
            return trimmed;
        }
        throw new IllegalArgumentException("Avatar must be a valid image data URI or http(s) URL.");
    }
}
