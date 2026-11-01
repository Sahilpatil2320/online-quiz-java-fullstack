package com.sqrock.quiz.dto;

import com.sqrock.quiz.entity.AttemptStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AttemptDtos {
    private AttemptDtos() {}

    public record StartAttemptRequest(@NotNull(message = "quizId is required") Long quizId) {}

    public record StartAttemptResponse(Long attemptId, Long quizId, Instant startedAt, Instant deadlineAt,
                                       Instant serverTime, int totalQuestions, boolean resumed) {}

    /** optionId == null clears the answer. */
    public record SaveAnswerRequest(@NotNull(message = "questionId is required") Long questionId, Long optionId) {}

    public record AnswerItem(@NotNull Long questionId, Long optionId) {}

    /** Optional body of /submit: the complete final list of answers (lets the server recover from failed saves). */
    public record SubmitRequest(@Valid List<AnswerItem> answers) {}

    // ---- active attempt (no correct answers!) ----
    public record OptionView(Long id, String text) {}

    public record QuestionView(Long id, int number, String text, String topic, List<OptionView> options) {}

    public record SavedAnswer(Long questionId, Long optionId) {}

    public record ActiveAttemptResponse(Long attemptId, Long quizId, String quizTitle, Instant startedAt,
                                        Instant deadlineAt, Instant serverTime,
                                        List<QuestionView> questions, List<SavedAnswer> answers) {}

    // ---- result ----
    public record TopicPerformance(String topic, int correct, int total, BigDecimal percentage) {}

    public record ResultResponse(Long attemptId, Long quizId, String quizTitle, AttemptStatus status,
                                 int score, int maxScore, BigDecimal percentage, int correct, int incorrect,
                                 int unanswered, long timeTakenSeconds, Instant submittedAt,
                                 String performanceMessage, List<TopicPerformance> topics) {}

    // ---- review (only after submission) ----
    public record ReviewOption(Long id, String text, boolean correct, boolean selected) {}

    public record ReviewItem(Long questionId, int number, String text, String topic, String explanation,
                             List<ReviewOption> options, Long selectedOptionId, Long correctOptionId,
                             String outcome) {}

    public record ReviewResponse(Long attemptId, String quizTitle, int score, int maxScore,
                                 List<ReviewItem> items) {}

    // ---- history ----
    public record AttemptSummary(Long attemptId, Long quizId, String quizTitle, Instant startedAt,
                                 Instant submittedAt, AttemptStatus status, Integer score, int totalQuestions,
                                 BigDecimal percentage) {}

    public record AttemptPage(List<AttemptSummary> items, int page, int size, long totalItems, int totalPages) {}
}
