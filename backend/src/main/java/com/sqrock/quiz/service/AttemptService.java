package com.sqrock.quiz.service;

import com.sqrock.quiz.dto.AttemptDtos.*;
import com.sqrock.quiz.entity.*;
import com.sqrock.quiz.exception.ApiException;
import com.sqrock.quiz.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Everything about a quiz attempt: start, save answers, enforce the deadline, score and review.
 *
 * noRollbackFor: when an attempt has expired we finalize it and THEN throw an error to the client.
 * The finalization must be committed, so ApiException must not roll the transaction back.
 */
@Service
@Transactional(noRollbackFor = ApiException.class)
public class AttemptService {
    private final QuizRepository quizzes;
    private final QuestionRepository questions;
    private final AnswerOptionRepository options;
    private final QuizAttemptRepository attempts;
    private final AttemptAnswerRepository answers;
    private final UserRepository users;

    public AttemptService(QuizRepository quizzes, QuestionRepository questions, AnswerOptionRepository options,
                          QuizAttemptRepository attempts, AttemptAnswerRepository answers, UserRepository users) {
        this.quizzes = quizzes;
        this.questions = questions;
        this.options = options;
        this.attempts = attempts;
        this.answers = answers;
        this.users = users;
    }

    // ------------------------------------------------------------------ start

    public StartAttemptResponse start(Long userId, Long quizId) {
        Quiz quiz = quizzes.findByIdAndDeletedFalse(quizId).filter(Quiz::isPublished)
                .orElseThrow(() -> ApiException.notFound("This quiz is not available."));
        int total = (int) questions.countByQuizIdAndDeletedFalse(quizId);
        if (total == 0) {
            throw ApiException.badRequest("This quiz has no questions yet.");
        }
        Instant now = now();

        // Resume an unfinished attempt instead of creating a second one.
        Optional<QuizAttempt> open = attempts
                .findFirstByUserIdAndQuizIdAndStatusOrderByStartedAtDesc(userId, quizId, AttemptStatus.IN_PROGRESS);
        if (open.isPresent()) {
            QuizAttempt existing = attempts.findByIdForUpdate(open.get().getId()).orElseThrow();
            if (existing.getStatus() == AttemptStatus.IN_PROGRESS && now.isBefore(existing.getDeadlineAt())) {
                return startResponse(existing, now, true);
            }
            if (existing.getStatus() == AttemptStatus.IN_PROGRESS) {
                finalizeAttempt(existing, AttemptStatus.EXPIRED, now);
            }
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(users.getReferenceById(userId));
        attempt.setQuiz(quiz);
        attempt.setStartedAt(now);
        attempt.setDeadlineAt(now.plus(Duration.ofMinutes(quiz.getDurationMinutes())));
        attempt.setTotalQuestions(total);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempts.save(attempt);
        return startResponse(attempt, now, false);
    }

    // -------------------------------------------------------- active questions

    /** Returns questions WITHOUT correct answers, plus the answers already saved. */
    public ActiveAttemptResponse getQuestions(Long userId, Long attemptId) {
        QuizAttempt attempt = loadActive(userId, attemptId, true);
        Long quizId = attempt.getQuiz().getId();
        List<QuestionView> views = new ArrayList<>();
        int number = 1;
        for (Question q : questions.findByQuizIdAndDeletedFalseOrderByQuestionOrderAscIdAsc(quizId)) {
            List<OptionView> opts = q.getOptions().stream()
                    .map(o -> new OptionView(o.getId(), o.getOptionText())).toList();
            views.add(new QuestionView(q.getId(), number++, q.getQuestionText(), q.getTopic(), opts));
        }
        List<SavedAnswer> saved = answers.findByAttemptId(attemptId).stream()
                .map(a -> new SavedAnswer(a.getQuestion().getId(), a.getSelectedOption().getId())).toList();
        return new ActiveAttemptResponse(attempt.getId(), quizId, attempt.getQuiz().getTitle(),
                attempt.getStartedAt(), attempt.getDeadlineAt(), now(), views, saved);
    }

    // ------------------------------------------------------------ save answer

    public void saveAnswer(Long userId, Long attemptId, SaveAnswerRequest req) {
        QuizAttempt attempt = loadActive(userId, attemptId, true);
        Map<Long, AttemptAnswer> existing = existingAnswers(attemptId);
        applyAnswer(attempt, existing, req.questionId(), req.optionId());
    }

    // ----------------------------------------------------------------- submit

    public ResultResponse submit(Long userId, Long attemptId, SubmitRequest body) {
        QuizAttempt attempt = loadOwned(userId, attemptId, true);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw ApiException.conflict("ATTEMPT_SUBMITTED", "This attempt has already been submitted.");
        }
        Instant now = now();
        if (!now.isBefore(attempt.getDeadlineAt())) {
            // Too late: the client cannot change anything anymore, only the saved answers count.
            finalizeAttempt(attempt, AttemptStatus.EXPIRED, now);
        } else {
            if (body != null && body.answers() != null) {
                replaceAnswers(attempt, body.answers());
            }
            finalizeAttempt(attempt, AttemptStatus.SUBMITTED, now);
        }
        return buildResult(attempt);
    }

    // ----------------------------------------------------------- result/review

    public ResultResponse getResult(Long userId, Long attemptId) {
        return buildResult(loadFinished(userId, attemptId));
    }

    public ReviewResponse getReview(Long userId, Long attemptId) {
        QuizAttempt attempt = loadFinished(userId, attemptId);
        Map<Long, AttemptAnswer> byQuestion = existingAnswers(attemptId);
        List<ReviewItem> items = new ArrayList<>();
        int number = 1;
        for (Question q : questions.findByQuizIdAndDeletedFalseOrderByQuestionOrderAscIdAsc(attempt.getQuiz().getId())) {
            AttemptAnswer given = byQuestion.get(q.getId());
            Long selectedId = given == null ? null : given.getSelectedOption().getId();
            Long correctId = null;
            List<ReviewOption> opts = new ArrayList<>();
            for (AnswerOption o : q.getOptions()) {
                if (o.isCorrect()) correctId = o.getId();
                opts.add(new ReviewOption(o.getId(), o.getOptionText(), o.isCorrect(), o.getId().equals(selectedId)));
            }
            String outcome = given == null ? "UNANSWERED"
                    : (Boolean.TRUE.equals(given.getCorrect()) ? "CORRECT" : "INCORRECT");
            items.add(new ReviewItem(q.getId(), number++, q.getQuestionText(), q.getTopic(), q.getExplanation(),
                    opts, selectedId, correctId, outcome));
        }
        return new ReviewResponse(attempt.getId(), attempt.getQuiz().getTitle(),
                attempt.getScore() == null ? 0 : attempt.getScore(), attempt.getTotalQuestions(), items);
    }

    // ---------------------------------------------------------------- history

    public AttemptPage history(Long userId, int page, int size) {
        Instant now = now();
        // Unfinished attempts whose time has run out are closed before listing.
        for (QuizAttempt stale : attempts.findByUserIdAndStatusAndDeadlineAtBefore(
                userId, AttemptStatus.IN_PROGRESS, now)) {
            QuizAttempt locked = attempts.findByIdForUpdate(stale.getId()).orElseThrow();
            if (locked.getStatus() == AttemptStatus.IN_PROGRESS) {
                finalizeAttempt(locked, AttemptStatus.EXPIRED, now);
            }
        }
        int safeSize = Math.max(1, Math.min(size, 50));
        Page<QuizAttempt> result = attempts.findByUserId(userId,
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "startedAt", "id")));
        List<AttemptSummary> items = result.getContent().stream()
                .map(a -> new AttemptSummary(a.getId(), a.getQuiz().getId(), a.getQuiz().getTitle(),
                        a.getStartedAt(), a.getSubmittedAt(), a.getStatus(), a.getScore(),
                        a.getTotalQuestions(), a.getPercentage())).toList();
        return new AttemptPage(items, result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages());
    }

    // ============================================================== internals

    private static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS);
    }

    private StartAttemptResponse startResponse(QuizAttempt a, Instant now, boolean resumed) {
        return new StartAttemptResponse(a.getId(), a.getQuiz().getId(), a.getStartedAt(), a.getDeadlineAt(), now,
                a.getTotalQuestions(), resumed);
    }

    /** Loads an attempt that belongs to the user. Other people's attempts look like "not found". */
    private QuizAttempt loadOwned(Long userId, Long attemptId, boolean lock) {
        Optional<QuizAttempt> found = lock ? attempts.findByIdForUpdate(attemptId) : attempts.findById(attemptId);
        QuizAttempt attempt = found.orElseThrow(() -> ApiException.notFound("Attempt not found."));
        if (!attempt.getUser().getId().equals(userId)) {
            throw ApiException.notFound("Attempt not found.");
        }
        return attempt;
    }

    /** Loads an attempt that can still be changed; finalizes it first if its deadline has passed. */
    private QuizAttempt loadActive(Long userId, Long attemptId, boolean lock) {
        QuizAttempt attempt = loadOwned(userId, attemptId, lock);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw ApiException.conflict("ATTEMPT_SUBMITTED", "This attempt has already been submitted.");
        }
        Instant now = now();
        if (!now.isBefore(attempt.getDeadlineAt())) {
            finalizeAttempt(attempt, AttemptStatus.EXPIRED, now);
            throw ApiException.gone("ATTEMPT_EXPIRED", "Time is up. Your saved answers were submitted automatically.");
        }
        return attempt;
    }

    /** Loads an attempt whose result may be shown (finalizing it if time ran out). */
    private QuizAttempt loadFinished(Long userId, Long attemptId) {
        QuizAttempt attempt = loadOwned(userId, attemptId, true);
        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
            Instant now = now();
            if (now.isBefore(attempt.getDeadlineAt())) {
                throw ApiException.conflict("ATTEMPT_IN_PROGRESS", "This attempt has not been submitted yet.");
            }
            finalizeAttempt(attempt, AttemptStatus.EXPIRED, now);
        }
        return attempt;
    }

    private Map<Long, AttemptAnswer> existingAnswers(Long attemptId) {
        Map<Long, AttemptAnswer> map = new HashMap<>();
        for (AttemptAnswer a : answers.findByAttemptId(attemptId)) {
            map.put(a.getQuestion().getId(), a);
        }
        return map;
    }

    /** Validates and stores (or clears, when optionId is null) one answer. */
    private void applyAnswer(QuizAttempt attempt, Map<Long, AttemptAnswer> existing, Long questionId, Long optionId) {
        Question question = questions.findByIdAndQuizIdAndDeletedFalse(questionId, attempt.getQuiz().getId())
                .orElseThrow(() -> ApiException.badRequest("This question does not belong to the quiz."));
        AttemptAnswer current = existing.get(questionId);
        if (optionId == null) {
            if (current != null) {
                answers.delete(current);
                existing.remove(questionId);
            }
            return;
        }
        AnswerOption option = options.findByIdAndQuestionId(optionId, questionId)
                .orElseThrow(() -> ApiException.badRequest("Invalid answer option for this question."));
        if (current == null) {
            AttemptAnswer created = new AttemptAnswer();
            created.setAttempt(attempt);
            created.setQuestion(question);
            created.setSelectedOption(option);
            existing.put(questionId, answers.save(created));
        } else {
            current.setSelectedOption(option);
        }
    }

    /** Makes the stored answers exactly equal to the list sent with the submit request. */
    private void replaceAnswers(QuizAttempt attempt, List<AnswerItem> items) {
        Map<Long, Long> wanted = new LinkedHashMap<>();
        for (AnswerItem item : items) {
            if (item.optionId() != null) {
                wanted.put(item.questionId(), item.optionId());
            }
        }
        Map<Long, AttemptAnswer> existing = existingAnswers(attempt.getId());
        for (Long questionId : new ArrayList<>(existing.keySet())) {
            if (!wanted.containsKey(questionId)) {
                applyAnswer(attempt, existing, questionId, null);
            }
        }
        for (Map.Entry<Long, Long> e : wanted.entrySet()) {
            applyAnswer(attempt, existing, e.getKey(), e.getValue());
        }
    }

    /**
     * THE scoring step. Correctness comes only from answer_options.is_correct in the database.
     * Runs inside the caller's transaction while the attempt row is locked.
     */
    private void finalizeAttempt(QuizAttempt attempt, AttemptStatus status, Instant now) {
        int correct = 0;
        for (AttemptAnswer a : answers.findByAttemptId(attempt.getId())) {
            boolean isCorrect = a.getSelectedOption().isCorrect();
            a.setCorrect(isCorrect);
            if (isCorrect) correct++;
        }
        attempt.setScore(correct);
        attempt.setPercentage(ScoreCalculator.percentage(correct, attempt.getTotalQuestions()));
        attempt.setStatus(status);
        // An expired attempt is closed at its deadline, so "time taken" can never exceed the time limit.
        attempt.setSubmittedAt(status == AttemptStatus.EXPIRED ? attempt.getDeadlineAt() : now);
        attempts.save(attempt);
    }

    private ResultResponse buildResult(QuizAttempt attempt) {
        Map<Long, AttemptAnswer> given = existingAnswers(attempt.getId());
        int total = attempt.getTotalQuestions();
        int score = attempt.getScore() == null ? 0 : attempt.getScore();
        int answered = given.size();
        int incorrect = Math.max(0, answered - score);
        int unanswered = Math.max(0, total - answered);

        // Topic-wise performance
        Map<String, int[]> perTopic = new LinkedHashMap<>();   // topic -> {correct, total}
        for (Question q : questions.findByQuizIdAndDeletedFalseOrderByQuestionOrderAscIdAsc(attempt.getQuiz().getId())) {
            String topic = (q.getTopic() == null || q.getTopic().isBlank()) ? "General" : q.getTopic();
            int[] counts = perTopic.computeIfAbsent(topic, t -> new int[2]);
            counts[1]++;
            AttemptAnswer a = given.get(q.getId());
            if (a != null && Boolean.TRUE.equals(a.getCorrect())) counts[0]++;
        }
        List<TopicPerformance> topics = perTopic.entrySet().stream()
                .map(e -> new TopicPerformance(e.getKey(), e.getValue()[0], e.getValue()[1],
                        ScoreCalculator.percentage(e.getValue()[0], e.getValue()[1]))).toList();

        Instant end = attempt.getSubmittedAt() != null ? attempt.getSubmittedAt() : attempt.getDeadlineAt();
        long seconds = Math.max(0, Duration.between(attempt.getStartedAt(), end).getSeconds());
        BigDecimal pct = attempt.getPercentage() == null ? BigDecimal.ZERO : attempt.getPercentage();
        return new ResultResponse(attempt.getId(), attempt.getQuiz().getId(), attempt.getQuiz().getTitle(),
                attempt.getStatus(), score, total, pct, score, incorrect, unanswered, seconds,
                attempt.getSubmittedAt(), ScoreCalculator.performanceMessage(pct), topics);
    }
}
