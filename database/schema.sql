-- SQROCK Quiz - MySQL 8 schema
-- Run as an administrative MySQL user (e.g. root) from MySQL Workbench or the mysql CLI.
-- Re-running this script is safe: it only creates what is missing.

CREATE DATABASE IF NOT EXISTS quiz_app CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE quiz_app;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(190) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,              -- BCrypt hash, never the password
    role          VARCHAR(20)  NOT NULL,              -- STUDENT | ADMIN
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT ck_users_role CHECK (role IN ('STUDENT', 'ADMIN'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash CHAR(64)    NOT NULL,                  -- SHA-256 of the bearer token
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_auth_tokens_hash (token_hash),
    KEY idx_auth_tokens_user (user_id),
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quizzes (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    title            VARCHAR(200)  NOT NULL,
    description      VARCHAR(1000) NULL,
    subject          VARCHAR(100)  NOT NULL,
    difficulty       VARCHAR(20)   NOT NULL,          -- EASY | MEDIUM | HARD
    duration_minutes INT           NOT NULL,
    published        TINYINT(1)    NOT NULL DEFAULT 0,
    deleted          TINYINT(1)    NOT NULL DEFAULT 0, -- soft delete keeps history
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_quizzes_listing (deleted, published),
    CONSTRAINT ck_quizzes_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT ck_quizzes_duration CHECK (duration_minutes BETWEEN 1 AND 300)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    quiz_id        BIGINT        NOT NULL,
    question_text  VARCHAR(2000) NOT NULL,
    explanation    VARCHAR(1000) NULL,
    topic          VARCHAR(100)  NULL,
    question_order INT           NOT NULL,
    deleted        TINYINT(1)    NOT NULL DEFAULT 0,  -- soft delete keeps old answers valid
    PRIMARY KEY (id),
    KEY idx_questions_quiz (quiz_id, deleted, question_order),
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS answer_options (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    question_id  BIGINT       NOT NULL,
    option_text  VARCHAR(500) NOT NULL,
    is_correct   TINYINT(1)   NOT NULL DEFAULT 0,
    option_order INT          NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_option_order (question_id, option_order),
    CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    quiz_id         BIGINT       NOT NULL,
    started_at      DATETIME(6)  NOT NULL,
    deadline_at     DATETIME(6)  NOT NULL,            -- authoritative end time (server-set)
    submitted_at    DATETIME(6)  NULL,
    status          VARCHAR(20)  NOT NULL,            -- IN_PROGRESS | SUBMITTED | EXPIRED
    score           INT          NULL,
    total_questions INT          NOT NULL,
    percentage      DECIMAL(5,2) NULL,
    PRIMARY KEY (id),
    KEY idx_attempts_user (user_id, started_at),
    KEY idx_attempts_quiz (quiz_id),
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id),
    CONSTRAINT ck_attempts_status CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempt_answers (
    id                 BIGINT     NOT NULL AUTO_INCREMENT,
    attempt_id         BIGINT     NOT NULL,
    question_id        BIGINT     NOT NULL,
    selected_option_id BIGINT     NOT NULL,
    is_correct         TINYINT(1) NULL,               -- set by the server when the attempt is finalized
    PRIMARY KEY (id),
    UNIQUE KEY uk_attempt_question (attempt_id, question_id),   -- one answer per question per attempt
    CONSTRAINT fk_answers_attempt  FOREIGN KEY (attempt_id)         REFERENCES quiz_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id)        REFERENCES questions (id),
    CONSTRAINT fk_answers_option   FOREIGN KEY (selected_option_id) REFERENCES answer_options (id)
) ENGINE=InnoDB;
