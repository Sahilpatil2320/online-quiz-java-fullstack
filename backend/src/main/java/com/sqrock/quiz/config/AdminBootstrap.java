package com.sqrock.quiz.config;

import com.sqrock.quiz.entity.Role;
import com.sqrock.quiz.entity.User;
import com.sqrock.quiz.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first administrator at startup from ADMIN_EMAIL / ADMIN_PASSWORD
 * (environment variables or the untracked application-local.properties).
 * Nothing is hardcoded and nothing happens if the values are not provided.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String name;
    private final String email;
    private final String password;

    public AdminBootstrap(UserRepository users, PasswordEncoder encoder,
                          @Value("${app.admin.name:Administrator}") String name,
                          @Value("${app.admin.email:}") String email,
                          @Value("${app.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (email.isBlank() || password.isBlank()) {
            log.info("No ADMIN_EMAIL/ADMIN_PASSWORD configured - skipping admin bootstrap.");
            return;
        }
        if (password.length() < 8) {
            log.warn("ADMIN_PASSWORD must be at least 8 characters - admin was NOT created.");
            return;
        }
        if (users.existsByEmailIgnoreCase(email)) {
            log.info("Admin account already exists.");
            return;
        }
        User admin = new User();
        admin.setName(name);
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.info("Created first administrator account: {}", admin.getEmail());
    }
}
