package com.sqrock.quiz.repository;

import com.sqrock.quiz.entity.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = "options")
    List<Question> findByQuizIdAndDeletedFalseOrderByQuestionOrderAscIdAsc(Long quizId);

    Optional<Question> findByIdAndDeletedFalse(Long id);

    Optional<Question> findByIdAndQuizIdAndDeletedFalse(Long id, Long quizId);

    long countByQuizIdAndDeletedFalse(Long quizId);

    @Query("select coalesce(max(q.questionOrder), 0) from Question q where q.quiz.id = :quizId")
    int findMaxOrder(@Param("quizId") Long quizId);
}
