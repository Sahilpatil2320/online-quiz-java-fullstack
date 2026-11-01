package com.sqrock.quiz.repository;

import com.sqrock.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByDeletedFalseAndPublishedTrueOrderByIdAsc();
    List<Quiz> findByDeletedFalseOrderByIdAsc();
    Optional<Quiz> findByIdAndDeletedFalse(Long id);
}
