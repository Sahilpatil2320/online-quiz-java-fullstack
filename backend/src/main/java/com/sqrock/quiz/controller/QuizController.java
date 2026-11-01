package com.sqrock.quiz.controller;

import com.sqrock.quiz.dto.QuizDtos.*;
import com.sqrock.quiz.service.QuizService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public endpoints: anyone can browse published quizzes. No answers are ever returned here. */
@RestController
@RequestMapping("/api/quizzes")
public class QuizController {
    private final QuizService quizzes;

    public QuizController(QuizService quizzes) {
        this.quizzes = quizzes;
    }

    @GetMapping
    public List<QuizSummary> list() {
        return quizzes.listPublished();
    }

    @GetMapping("/{id}")
    public QuizSummary get(@PathVariable Long id) {
        return quizzes.getPublished(id);
    }

    @GetMapping("/{id}/instructions")
    public QuizInstructions instructions(@PathVariable Long id) {
        return quizzes.getInstructions(id);
    }
}
