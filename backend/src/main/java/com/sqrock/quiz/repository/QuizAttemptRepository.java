package com.sqrock.quiz.repository;

import com.sqrock.quiz.entity.AttemptStatus;
import com.sqrock.quiz.entity.QuizAttempt;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    /** Row lock: two simultaneous submits of the same attempt are processed one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from QuizAttempt a where a.id = :id")
    Optional<QuizAttempt> findByIdForUpdate(@Param("id") Long id);

    Optional<QuizAttempt> findFirstByUserIdAndQuizIdAndStatusOrderByStartedAtDesc(
            Long userId, Long quizId, AttemptStatus status);

    List<QuizAttempt> findByUserIdAndStatusAndDeadlineAtBefore(Long userId, AttemptStatus status, Instant time);

    Page<QuizAttempt> findByUserId(Long userId, Pageable pageable);
}
