package com.richstok.warehouse.auth;

import com.richstok.warehouse.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthCredentialsEmailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public void sendCredentials(AppUser user, String rawPassword) {
        AppProperties.Mail mail = appProperties.mail();
        if (mail != null && !mail.enabled()) {
            return;
        }

        String appName = resolveAppName(mail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setFrom(resolveFrom(mail));
        message.setSubject(appName + " — login credentials");
        message.setText("""
                Your account has been created.

                Email: %s
                Password: %s
                Role: %s

                Please sign in and change the password after first login.
                """.formatted(user.getEmail(), rawPassword, user.getRole().name()));

        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new IllegalStateException("User created, but SMTP email delivery failed.", exception);
        }
    }

    private String resolveFrom(AppProperties.Mail mail) {
        if (mail != null && hasText(mail.from())) {
            return mail.from().trim();
        }
        return "no-reply@richstok.local";
    }

    private String resolveAppName(AppProperties.Mail mail) {
        if (mail != null && hasText(mail.appName())) {
            return mail.appName().trim();
        }
        return "RICHSTOK";
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
