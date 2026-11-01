package com.sqrock.quiz.service;

import com.sqrock.quiz.dto.AdminDtos.*;
import com.sqrock.quiz.entity.AnswerOption;
import com.sqrock.quiz.entity.Question;
import com.sqrock.quiz.entity.Quiz;
import com.sqrock.quiz.exception.ApiException;
import com.sqrock.quiz.repository.QuestionRepository;
import com.sqrock.quiz.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Quiz and question management for administrators. Deletes are soft deletes to keep history intact. */
@Service
@Transactional
public class AdminQuizService {
    private final QuizRepository quizzes;
    private final QuestionRepository questions;

    public AdminQuizService(QuizRepository quizzes, QuestionRepository questions) {
        this.quizzes = quizzes;
        this.questions = questions;
    }

    @Transactional(readOnly = true)
    public List<AdminQuizSummary> listAll() {
        return quizzes.findByDeletedFalseOrderByIdAsc().stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public AdminQuizDetail getDetail(Long id) {
        Quiz quiz = find(id);
        List<AdminQuestion> list = questions.findByQuizIdAndDeletedFalseOrderByQuestionOrderAscIdAsc(id)
                .stream().map(this::toAdminQuestion).toList();
        return new AdminQuizDetail(toSummary(quiz), list);
    }

    public AdminQuizSummary create(QuizRequest req) {
        Quiz quiz = new Quiz();
        apply(quiz, req);
        quiz.setPublished(false);   // a new quiz has no questions yet, so it starts as a draft
        return toSummary(quizzes.save(quiz));
    }

    public AdminQuizSummary update(Long id, QuizRequest req) {
        Quiz quiz = find(id);
        apply(quiz, req);
        if (req.published() != null) {
            changePublication(quiz, req.published());
        }
        return toSummary(quizzes.save(quiz));
    }

    public AdminQuizSummary setPublished(Long id, boolean published) {
        Quiz quiz = find(id);
        changePublication(quiz, published);
        return toSummary(quizzes.save(quiz));
    }

    public void delete(Long id) {
        Quiz quiz = find(id);
        quiz.setDeleted(true);
        quiz.setPublished(false);
        quizzes.save(quiz);
    }

    public AdminQuestion addQuestion(Long quizId, QuestionRequest req) {
        Quiz quiz = find(quizId);
        validateOptions(req);
        Question q = new Question();
        q.setQuiz(quiz);
        q.setQuestionOrder(questions.findMaxOrder(quizId) + 1);
        applyQuestion(q, req);
        for (int i = 0; i < 4; i++) {
            AnswerOption o = new AnswerOption();
            o.setOptionOrder(i + 1);
            o.setOptionText(req.options().get(i).text().trim());
            o.setCorrect(req.options().get(i).correct());
            q.addOption(o);
        }
        return toAdminQuestion(questions.save(q));
    }

    public AdminQuestion updateQuestion(Long questionId, QuestionRequest req) {
        Question q = questions.findByIdAndDeletedFalse(questionId)
                .orElseThrow(() -> ApiException.notFound("Question not found."));
        validateOptions(req);
        applyQuestion(q, req);
        // Update options in place (by position) so old attempts keep pointing at the same option rows.
        for (int i = 0; i < 4; i++) {
            AnswerOption o = q.getOptions().get(i);
            o.setOptionText(req.options().get(i).text().trim());
            o.setCorrect(req.options().get(i).correct());
        }
        return toAdminQuestion(questions.save(q));
    }

    public void deleteQuestion(Long questionId) {
        Question q = questions.findByIdAndDeletedFalse(questionId)
                .orElseThrow(() -> ApiException.notFound("Question not found."));
        q.setDeleted(true);
        questions.save(q);
        Quiz quiz = q.getQuiz();
        if (quiz.isPublished() && questions.countByQuizIdAndDeletedFalse(quiz.getId()) == 0) {
            quiz.setPublished(false);       // a quiz without questions cannot stay published
            quizzes.save(quiz);
        }
    }

    // ---------- helpers ----------

    private Quiz find(Long id) {
        return quizzes.findByIdAndDeletedFalse(id).orElseThrow(() -> ApiException.notFound("Quiz not found."));
    }

    private void apply(Quiz quiz, QuizRequest req) {
        quiz.setTitle(req.title().trim());
        quiz.setDescription(blankToNull(req.description()));
        quiz.setSubject(req.subject().trim());
        quiz.setDifficulty(req.difficulty());
        quiz.setDurationMinutes(req.durationMinutes());
    }

    private void applyQuestion(Question q, QuestionRequest req) {
        q.setQuestionText(req.questionText().trim());
        q.setExplanation(blankToNull(req.explanation()));
        q.setTopic(blankToNull(req.topic()));
    }

    private void changePublication(Quiz quiz, boolean publish) {
        if (publish && questions.countByQuizIdAndDeletedFalse(quiz.getId()) == 0) {
            throw ApiException.badRequest("Add at least one question before publishing this quiz.");
        }
        quiz.setPublished(publish);
    }

    private void validateOptions(QuestionRequest req) {
        long correct = req.options().stream().filter(OptionRequest::correct).count();
        if (correct != 1) {
            throw ApiException.badRequest("Select exactly one correct option.");
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private AdminQuizSummary toSummary(Quiz q) {
        int count = (int) questions.countByQuizIdAndDeletedFalse(q.getId());
        return new AdminQuizSummary(q.getId(), q.getTitle(), q.getDescription(), q.getSubject(), q.getDifficulty(),
                q.getDurationMinutes(), q.isPublished(), count, q.getCreatedAt(), q.getUpdatedAt());
    }

    private AdminQuestion toAdminQuestion(Question q) {
        List<AdminOption> options = q.getOptions().stream()
                .map(o -> new AdminOption(o.getId(), o.getOptionText(), o.isCorrect())).toList();
        return new AdminQuestion(q.getId(), q.getQuestionOrder(), q.getQuestionText(), q.getExplanation(),
                q.getTopic(), options);
    }
}
