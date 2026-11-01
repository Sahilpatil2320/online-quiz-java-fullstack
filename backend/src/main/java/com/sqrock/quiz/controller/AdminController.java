package com.sqrock.quiz.controller;

import com.sqrock.quiz.dto.AdminDtos.*;
import com.sqrock.quiz.service.AdminQuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Protected by SecurityConfig: /api/admin/** requires the ADMIN role. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminQuizService admin;

    public AdminController(AdminQuizService admin) {
        this.admin = admin;
    }

    @GetMapping("/quizzes")
    public List<AdminQuizSummary> list() {
        return admin.listAll();
    }

    @GetMapping("/quizzes/{id}")
    public AdminQuizDetail detail(@PathVariable Long id) {
        return admin.getDetail(id);
    }

    @PostMapping("/quizzes")
    public ResponseEntity<AdminQuizSummary> create(@Valid @RequestBody QuizRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(admin.create(req));
    }

    @PutMapping("/quizzes/{id}")
    public AdminQuizSummary update(@PathVariable Long id, @Valid @RequestBody QuizRequest req) {
        return admin.update(id, req);
    }

    @PatchMapping("/quizzes/{id}/publish")
    public AdminQuizSummary publish(@PathVariable Long id, @Valid @RequestBody PublishRequest req) {
        return admin.setPublished(id, req.published());
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        admin.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<AdminQuestion> addQuestion(@PathVariable Long quizId,
                                                     @Valid @RequestBody QuestionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(admin.addQuestion(quizId, req));
    }

    @PutMapping("/questions/{id}")
    public AdminQuestion updateQuestion(@PathVariable Long id, @Valid @RequestBody QuestionRequest req) {
        return admin.updateQuestion(id, req);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        admin.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
