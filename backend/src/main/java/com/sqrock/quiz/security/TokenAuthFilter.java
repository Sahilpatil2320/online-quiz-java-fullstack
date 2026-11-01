package com.sqrock.quiz.security;

import com.sqrock.quiz.entity.AuthToken;
import com.sqrock.quiz.entity.User;
import com.sqrock.quiz.repository.AuthTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Reads "Authorization: Bearer <token>", looks the token up in MySQL and authenticates the request. */
public class TokenAuthFilter extends OncePerRequestFilter {
    private final AuthTokenRepository tokens;

    public TokenAuthFilter(AuthTokenRepository tokens) {
        this.tokens = tokens;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String raw = header.substring(7).trim();
            Optional<AuthToken> found = tokens.findByTokenHash(TokenHasher.sha256(raw));
            if (found.isPresent() && found.get().getExpiresAt().isAfter(Instant.now())) {
                User user = found.get().getUser();
                AppUserPrincipal principal =
                        new AppUserPrincipal(user.getId(), user.getEmail(), user.getName(), user.getRole());
                var auth = new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
