package com.sqrock.quiz.service;

import com.sqrock.quiz.dto.QuizDtos.*;
import com.sqrock.quiz.entity.Quiz;
import com.sqrock.quiz.exception.ApiException;
import com.sqrock.quiz.repository.QuestionRepository;
import com.sqrock.quiz.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class QuizService {
    private final QuizRepository quizzes;
    private final QuestionRepository questions;

    public QuizService(QuizRepository quizzes, QuestionRepository questions) {
        this.quizzes = quizzes;
        this.questions = questions;
    }

    public List<QuizSummary> listPublished() {
        return quizzes.findByDeletedFalseAndPublishedTrueOrderByIdAsc().stream().map(this::toSummary).toList();
    }

    public QuizSummary getPublished(Long id) {
        return toSummary(findPublished(id));
    }

    public QuizInstructions getInstructions(Long id) {
        Quiz quiz = findPublished(id);
        QuizSummary summary = toSummary(quiz);
        List<String> rules = List.of(
                "You have " + quiz.getDurationMinutes() + " minutes. The countdown is controlled by the server.",
                "Each question has four options and exactly one correct answer.",
                "You can move between questions, change answers, and mark questions for review before submitting.",
                "Each correct answer earns 1 mark. Wrong or unanswered questions earn 0 marks (no negative marking).",
                "Unanswered questions are counted as not correct.",
                "When time runs out, your saved answers are submitted automatically.",
                "A quiz can be submitted only once. You can retake it later as a new attempt.",
                "Correct answers are shown only after you submit.");
        return new QuizInstructions(summary, "1 mark per correct answer, no negative marking", false, true, rules);
    }

    private Quiz findPublished(Long id) {
        return quizzes.findByIdAndDeletedFalse(id).filter(Quiz::isPublished)
                .orElseThrow(() -> ApiException.notFound("This quiz is not available."));
    }

    private QuizSummary toSummary(Quiz q) {
        int count = (int) questions.countByQuizIdAndDeletedFalse(q.getId());
        return new QuizSummary(q.getId(), q.getTitle(), q.getDescription(), q.getSubject(), q.getDifficulty(),
                q.getDurationMinutes(), count);
    }
}
