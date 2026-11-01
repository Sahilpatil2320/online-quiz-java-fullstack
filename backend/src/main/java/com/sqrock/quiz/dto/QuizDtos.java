package com.sqrock.quiz.dto;

import com.sqrock.quiz.entity.Difficulty;
import java.util.List;

/** Public (student-facing) quiz DTOs. They never contain correct answers. */
public final class QuizDtos {
    private QuizDtos() {}

    public record QuizSummary(Long id, String title, String description, String subject,
                              Difficulty difficulty, int durationMinutes, int questionCount) {}

    public record QuizInstructions(QuizSummary quiz, String scoringPolicy, boolean negativeMarking,
                                   boolean unansweredCountsAsIncorrect, List<String> rules) {}
}
