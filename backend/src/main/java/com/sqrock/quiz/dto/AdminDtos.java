package com.sqrock.quiz.dto;

import com.sqrock.quiz.entity.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record QuizRequest(
            @NotBlank(message = "Title is required") @Size(max = 200, message = "Title is too long") String title,
            @Size(max = 1000, message = "Description is too long") String description,
            @NotBlank(message = "Subject is required") @Size(max = 100, message = "Subject is too long") String subject,
            @NotNull(message = "Difficulty is required") Difficulty difficulty,
            @NotNull(message = "Duration is required")
            @Min(value = 1, message = "Duration must be at least 1 minute")
            @Max(value = 300, message = "Duration cannot exceed 300 minutes") Integer durationMinutes,
            Boolean published) {}

    public record PublishRequest(@NotNull(message = "published is required") Boolean published) {}

    public record OptionRequest(
            @NotBlank(message = "Option text is required") @Size(max = 500, message = "Option is too long") String text,
            boolean correct) {}

    public record QuestionRequest(
            @NotBlank(message = "Question text is required")
            @Size(max = 2000, message = "Question is too long") String questionText,
            @Size(max = 1000, message = "Explanation is too long") String explanation,
            @Size(max = 100, message = "Topic is too long") String topic,
            @NotNull(message = "Options are required")
            @Size(min = 4, max = 4, message = "Exactly four options are required") List<@Valid OptionRequest> options) {}

    public record AdminQuizSummary(Long id, String title, String description, String subject, Difficulty difficulty,
                                   int durationMinutes, boolean published, int questionCount,
                                   Instant createdAt, Instant updatedAt) {}

    public record AdminOption(Long id, String text, boolean correct) {}

    public record AdminQuestion(Long id, int order, String questionText, String explanation, String topic,
                                List<AdminOption> options) {}

    public record AdminQuizDetail(AdminQuizSummary quiz, List<AdminQuestion> questions) {}
}
