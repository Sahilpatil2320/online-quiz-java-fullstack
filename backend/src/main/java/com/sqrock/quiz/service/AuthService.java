package com.sqrock.quiz.service;

import com.sqrock.quiz.dto.AuthDtos.*;
import com.sqrock.quiz.entity.AuthToken;
import com.sqrock.quiz.entity.Role;
import com.sqrock.quiz.entity.User;
import com.sqrock.quiz.exception.ApiException;
import com.sqrock.quiz.repository.AuthTokenRepository;
import com.sqrock.quiz.repository.UserRepository;
import com.sqrock.quiz.security.TokenHasher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class AuthService {
    private final UserRepository users;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final long tokenTtlHours;
    // Used so that "unknown email" and "wrong password" take a similar amount of time.
    private final String dummyHash;

    public AuthService(UserRepository users, AuthTokenRepository tokens, PasswordEncoder encoder,
                       @Value("${app.auth.token-ttl-hours:12}") long tokenTtlHours) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.tokenTtlHours = tokenTtlHours;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "An account with this email already exists.");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(Role.STUDENT);          // public registration can only create students
        users.save(user);
        return issueToken(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim()).orElse(null);
        boolean ok = encoder.matches(req.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !ok) {
            throw ApiException.unauthorized("Incorrect email or password.");
        }
        return issueToken(user);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            tokens.deleteByTokenHash(TokenHasher.sha256(rawToken));
        }
    }

    private AuthResponse issueToken(User user) {
        tokens.deleteByExpiresAtBefore(Instant.now());   // light housekeeping
        String raw = TokenHasher.newToken();
        AuthToken token = new AuthToken();
        token.setUser(user);
        token.setTokenHash(TokenHasher.sha256(raw));
        token.setExpiresAt(Instant.now().plus(Duration.ofHours(tokenTtlHours)));
        tokens.save(token);
        return new AuthResponse(raw, toView(user));
    }

    public static UserView toView(User u) {
        return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole());
    }
}
