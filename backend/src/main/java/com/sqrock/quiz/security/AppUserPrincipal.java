package com.sqrock.quiz.security;

import com.sqrock.quiz.entity.Role;

/** The authenticated user, available in controllers via @AuthenticationPrincipal. */
public record AppUserPrincipal(Long id, String email, String name, Role role) {}
