package com.sqrock.quiz.controller;

import com.sqrock.quiz.dto.AttemptDtos.*;
import com.sqrock.quiz.security.AppUserPrincipal;
import com.sqrock.quiz.service.AttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** All endpoints need a logged-in user and only ever touch that user's own attempts. */
@RestController
@RequestMapping("/api/attempts")
public class AttemptController {
    private final AttemptService attempts;

    public AttemptController(AttemptService attempts) {
        this.attempts = attempts;
    }

    @PostMapping
    public ResponseEntity<StartAttemptResponse> start(@AuthenticationPrincipal AppUserPrincipal user,
                                                      @Valid @RequestBody StartAttemptRequest req) {
        StartAttemptResponse response = attempts.start(user.id(), req.quizId());
        return ResponseEntity.status(response.resumed() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mine")
    public AttemptPage mine(@AuthenticationPrincipal AppUserPrincipal user,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size) {
        return attempts.history(user.id(), page, size);
    }

    @GetMapping("/{attemptId}/questions")
    public ActiveAttemptResponse questions(@AuthenticationPrincipal AppUserPrincipal user,
                                           @PathVariable Long attemptId) {
        return attempts.getQuestions(user.id(), attemptId);
    }

    @PutMapping("/{attemptId}/answers")
    public ResponseEntity<Void> saveAnswer(@AuthenticationPrincipal AppUserPrincipal user,
                                           @PathVariable Long attemptId,
                                           @Valid @RequestBody SaveAnswerRequest req) {
        attempts.saveAnswer(user.id(), attemptId, req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{attemptId}/submit")
    public ResultResponse submit(@AuthenticationPrincipal AppUserPrincipal user,
                                 @PathVariable Long attemptId,
                                 @Valid @RequestBody(required = false) SubmitRequest body) {
        return attempts.submit(user.id(), attemptId, body);
    }

    @GetMapping("/{attemptId}/result")
    public ResultResponse result(@AuthenticationPrincipal AppUserPrincipal user, @PathVariable Long attemptId) {
        return attempts.getResult(user.id(), attemptId);
    }

    @GetMapping("/{attemptId}/review")
    public ReviewResponse review(@AuthenticationPrincipal AppUserPrincipal user, @PathVariable Long attemptId) {
        return attempts.getReview(user.id(), attemptId);
    }
}
