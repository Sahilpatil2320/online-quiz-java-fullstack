package com.sqrock.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sqrock.quiz.entity.QuizAttempt;
import com.sqrock.quiz.entity.Role;
import com.sqrock.quiz.entity.User;
import com.sqrock.quiz.repository.QuizAttemptRepository;
import com.sqrock.quiz.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end API tests against an in-memory H2 database (MySQL mode).
 * Each test runs in a transaction that is rolled back, so tests do not affect each other.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:quiz_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.admin.email=",
        "app.admin.password="
})
@AutoConfigureMockMvc
@Transactional
class QuizFlowIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired QuizAttemptRepository attemptRepo;

    // ------------------------------------------------------------ helpers

    private JsonNode call(MockHttpServletRequestBuilder request, String token, Object body, int expected)
            throws Exception {
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        MvcResult result = mvc.perform(request).andExpect(status().is(expected)).andReturn();
        String content = result.getResponse().getContentAsString();
        return content.isBlank() ? null : json.readTree(content);
    }

    private String adminToken() throws Exception {
        User admin = new User();
        admin.setName("Admin");
        admin.setEmail("admin-" + UUID.randomUUID() + "@test.com");
        admin.setPasswordHash(encoder.encode("AdminPass123"));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        JsonNode login = call(post("/api/auth/login"), null,
                Map.of("email", admin.getEmail(), "password", "AdminPass123"), 200);
        return login.get("token").asText();
    }

    private String studentToken() throws Exception {
        JsonNode res = call(post("/api/auth/register"), null,
                Map.of("name", "Student", "email", "s-" + UUID.randomUUID() + "@test.com",
                        "password", "StudentPass1"), 201);
        return res.get("token").asText();
    }

    private Map<String, Object> questionBody(String text, String topic) {
        List<Map<String, Object>> options = new ArrayList<>();
        String[] labels = {"Alpha", "Beta", "Gamma", "Delta"};
        for (int i = 0; i < 4; i++) {
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("text", labels[i]);
            o.put("correct", i == 0);          // option 1 ("Alpha") is the right answer
            options.add(o);
        }
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("questionText", text);
        q.put("topic", topic);
        q.put("explanation", "Because Alpha is first.");
        q.put("options", options);
        return q;
    }

    /** Creates and publishes a quiz with the given number of questions; returns the admin detail JSON. */
    private JsonNode publishedQuiz(String adminToken, int questionCount) throws Exception {
        Map<String, Object> quiz = Map.of("title", "Test Quiz " + UUID.randomUUID(), "description", "d",
                "subject", "Java", "difficulty", "EASY", "durationMinutes", 10);
        long quizId = call(post("/api/admin/quizzes"), adminToken, quiz, 201).get("id").asLong();
        for (int i = 1; i <= questionCount; i++) {
            call(post("/api/admin/quizzes/" + quizId + "/questions"), adminToken,
                    questionBody("Question " + i, i % 2 == 0 ? "Topic B" : "Topic A"), 201);
        }
        call(patch("/api/admin/quizzes/" + quizId + "/publish"), adminToken, Map.of("published", true), 200);
        return call(get("/api/admin/quizzes/" + quizId), adminToken, null, 200);
    }

    private long optionId(JsonNode question, boolean correct) {
        for (JsonNode o : question.get("options")) {
            if (o.get("correct").asBoolean() == correct) return o.get("id").asLong();
        }
        throw new IllegalStateException("no option");
    }

    private void answer(String token, long attemptId, long questionId, Long optionId, int expected) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("questionId", questionId);
        body.put("optionId", optionId);
        call(put("/api/attempts/" + attemptId + "/answers"), token, body, expected);
    }

    // -------------------------------------------------------------- tests

    @Test
    void quizListShowsOnlyPublishedQuizzes() throws Exception {
        String admin = adminToken();
        long published = publishedQuiz(admin, 2).get("quiz").get("id").asLong();
        long draft = call(post("/api/admin/quizzes"), admin, Map.of("title", "Draft", "subject", "SQL",
                "difficulty", "HARD", "durationMinutes", 5), 201).get("id").asLong();

        JsonNode list = call(get("/api/quizzes"), null, null, 200);   // public, no token
        List<Long> ids = new ArrayList<>();
        list.forEach(q -> ids.add(q.get("id").asLong()));
        assertTrue(ids.contains(published));
        assertFalse(ids.contains(draft));
        call(get("/api/quizzes/" + draft), null, null, 404);
    }

    @Test
    void adminEndpointsAreProtectedOnTheServer() throws Exception {
        Map<String, Object> quiz = Map.of("title", "X", "subject", "Java", "difficulty", "EASY", "durationMinutes", 5);
        call(post("/api/admin/quizzes"), null, quiz, 401);                       // anonymous
        call(post("/api/admin/quizzes"), studentToken(), quiz, 403);             // student
        call(post("/api/admin/quizzes"), adminToken(), quiz, 201);               // admin
        call(get("/api/admin/quizzes"), studentToken(), null, 403);
    }

    @Test
    void quizAndQuestionValidation() throws Exception {
        String admin = adminToken();
        JsonNode bad = call(post("/api/admin/quizzes"), admin, Map.of("title", " ", "subject", "Java",
                "difficulty", "EASY", "durationMinutes", 5), 400);
        assertEquals("VALIDATION_ERROR", bad.get("code").asText());
        assertTrue(bad.get("fieldErrors").has("title"));

        long quizId = call(post("/api/admin/quizzes"), admin, Map.of("title", "V", "subject", "Java",
                "difficulty", "EASY", "durationMinutes", 5), 201).get("id").asLong();

        // only two options
        Map<String, Object> twoOptions = questionBody("Q", "T");
        twoOptions.put("options", List.of(Map.of("text", "A", "correct", true), Map.of("text", "B", "correct", false)));
        call(post("/api/admin/quizzes/" + quizId + "/questions"), admin, twoOptions, 400);

        // two correct options
        Map<String, Object> twoCorrect = questionBody("Q", "T");
        twoCorrect.put("options", List.of(Map.of("text", "A", "correct", true), Map.of("text", "B", "correct", true),
                Map.of("text", "C", "correct", false), Map.of("text", "D", "correct", false)));
        JsonNode err = call(post("/api/admin/quizzes/" + quizId + "/questions"), admin, twoCorrect, 400);
        assertTrue(err.get("message").asText().contains("exactly one"));

        // cannot publish an empty quiz
        call(patch("/api/admin/quizzes/" + quizId + "/publish"), admin, Map.of("published", true), 400);
    }

    @Test
    void activeQuestionsNeverContainCorrectAnswers() throws Exception {
        String admin = adminToken();
        long quizId = publishedQuiz(admin, 3).get("quiz").get("id").asLong();
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        MvcResult res = mvc.perform(get("/api/attempts/" + attemptId + "/questions")
                .header("Authorization", "Bearer " + student)).andExpect(status().isOk()).andReturn();
        String body = res.getResponse().getContentAsString();
        assertFalse(body.toLowerCase().contains("correct"), "response must not reveal correct answers");
        assertFalse(body.toLowerCase().contains("explanation"));
        JsonNode node = json.readTree(body);
        assertEquals(3, node.get("questions").size());
        assertEquals(4, node.get("questions").get(0).get("options").size());

        // result/review are not available before submission
        call(get("/api/attempts/" + attemptId + "/review"), student, null, 409);
    }

    @Test
    void scoreIsCalculatedOnTheServerAndCountsUnanswered() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 4);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();

        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();
        answer(student, attemptId, qs.get(0).get("id").asLong(), optionId(qs.get(0), true), 204);   // correct
        answer(student, attemptId, qs.get(1).get("id").asLong(), optionId(qs.get(1), true), 204);   // correct
        answer(student, attemptId, qs.get(2).get("id").asLong(), optionId(qs.get(2), false), 204);  // wrong
        // question 4 left unanswered

        JsonNode result = call(post("/api/attempts/" + attemptId + "/submit"), student, null, 200);
        assertEquals(2, result.get("score").asInt());
        assertEquals(4, result.get("maxScore").asInt());
        assertEquals(50.0, result.get("percentage").asDouble(), 0.001);
        assertEquals(2, result.get("correct").asInt());
        assertEquals(1, result.get("incorrect").asInt());
        assertEquals(1, result.get("unanswered").asInt());
        assertEquals("SUBMITTED", result.get("status").asText());
        assertEquals(2, result.get("topics").size());

        JsonNode review = call(get("/api/attempts/" + attemptId + "/review"), student, null, 200);
        assertEquals("CORRECT", review.get("items").get(0).get("outcome").asText());
        assertEquals("INCORRECT", review.get("items").get(2).get("outcome").asText());
        assertEquals("UNANSWERED", review.get("items").get(3).get("outcome").asText());
        assertEquals("Because Alpha is first.", review.get("items").get(0).get("explanation").asText());

        // history
        JsonNode history = call(get("/api/attempts/mine"), student, null, 200);
        assertEquals(1, history.get("totalItems").asInt());
    }

    @Test
    void clearingAnAnswerAndSubmittingFinalAnswerList() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 2);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        long q1 = qs.get(0).get("id").asLong();
        answer(student, attemptId, q1, optionId(qs.get(0), false), 204);
        answer(student, attemptId, q1, null, 204);                          // cleared again

        // final answer list sent with submit replaces whatever was stored
        List<Map<String, Object>> finalAnswers = List.of(
                Map.of("questionId", q1, "optionId", optionId(qs.get(0), true)));
        JsonNode result = call(post("/api/attempts/" + attemptId + "/submit"), student,
                Map.of("answers", finalAnswers), 200);
        assertEquals(1, result.get("score").asInt());
        assertEquals(1, result.get("unanswered").asInt());
    }

    @Test
    void secondSubmitIsRejectedAndAnswersAreLockedAfterSubmit() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 2);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        call(post("/api/attempts/" + attemptId + "/submit"), student, null, 200);
        JsonNode second = call(post("/api/attempts/" + attemptId + "/submit"), student, null, 409);
        assertEquals("ATTEMPT_SUBMITTED", second.get("code").asText());
        answer(student, attemptId, qs.get(0).get("id").asLong(), optionId(qs.get(0), true), 409);

        // score is still the one calculated on the first submit
        assertEquals(0, call(get("/api/attempts/" + attemptId + "/result"), student, null, 200).get("score").asInt());
    }

    @Test
    void invalidOptionIsRejected() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 2);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        long optionOfQuestion2 = optionId(qs.get(1), true);
        answer(student, attemptId, qs.get(0).get("id").asLong(), optionOfQuestion2, 400);   // wrong question
        answer(student, attemptId, qs.get(0).get("id").asLong(), 999999L, 400);             // does not exist
        answer(student, attemptId, 999999L, optionOfQuestion2, 400);                        // unknown question
    }

    @Test
    void expiredAttemptRejectsChangesAndIsFinalizedByTheServer() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 2);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        answer(student, attemptId, qs.get(0).get("id").asLong(), optionId(qs.get(0), true), 204);   // saved in time

        QuizAttempt attempt = attemptRepo.findById(attemptId).orElseThrow();
        attempt.setDeadlineAt(Instant.now().minusSeconds(5));                                       // time is up
        attemptRepo.saveAndFlush(attempt);

        JsonNode error = call(put("/api/attempts/" + attemptId + "/answers"), student,
                Map.of("questionId", qs.get(1).get("id").asLong(), "optionId", optionId(qs.get(1), true)), 410);
        assertEquals("ATTEMPT_EXPIRED", error.get("code").asText());

        JsonNode result = call(get("/api/attempts/" + attemptId + "/result"), student, null, 200);
        assertEquals("EXPIRED", result.get("status").asText());
        assertEquals(1, result.get("score").asInt());          // only the answer saved before the deadline counts
        call(post("/api/attempts/" + attemptId + "/submit"), student, null, 409);
    }

    @Test
    void lateSubmitUsesOnlySavedAnswers() throws Exception {
        String admin = adminToken();
        JsonNode detail = publishedQuiz(admin, 2);
        long quizId = detail.get("quiz").get("id").asLong();
        JsonNode qs = detail.get("questions");
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        QuizAttempt attempt = attemptRepo.findById(attemptId).orElseThrow();
        attempt.setDeadlineAt(Instant.now().minusSeconds(1));
        attemptRepo.saveAndFlush(attempt);

        // The browser tries to sneak in answers after the deadline: they are ignored.
        List<Map<String, Object>> late = List.of(
                Map.of("questionId", qs.get(0).get("id").asLong(), "optionId", optionId(qs.get(0), true)));
        JsonNode result = call(post("/api/attempts/" + attemptId + "/submit"), student, Map.of("answers", late), 200);
        assertEquals("EXPIRED", result.get("status").asText());
        assertEquals(0, result.get("score").asInt());
    }

    @Test
    void attemptsBelongToTheirOwner() throws Exception {
        String admin = adminToken();
        long quizId = publishedQuiz(admin, 2).get("quiz").get("id").asLong();
        String owner = studentToken();
        String other = studentToken();
        long attemptId = call(post("/api/attempts"), owner, Map.of("quizId", quizId), 201).get("attemptId").asLong();

        call(get("/api/attempts/" + attemptId + "/questions"), other, null, 404);
        call(post("/api/attempts/" + attemptId + "/submit"), other, null, 404);
        call(get("/api/attempts/" + attemptId + "/questions"), null, null, 401);
    }

    @Test
    void startingAgainResumesTheOpenAttemptButRetakeAfterSubmitCreatesNewOne() throws Exception {
        String admin = adminToken();
        long quizId = publishedQuiz(admin, 2).get("quiz").get("id").asLong();
        String student = studentToken();

        JsonNode first = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201);
        JsonNode again = call(post("/api/attempts"), student, Map.of("quizId", quizId), 200);
        assertEquals(first.get("attemptId").asLong(), again.get("attemptId").asLong());
        assertTrue(again.get("resumed").asBoolean());

        call(post("/api/attempts/" + first.get("attemptId").asLong() + "/submit"), student, null, 200);
        JsonNode retake = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201);
        assertNotEquals(first.get("attemptId").asLong(), retake.get("attemptId").asLong());
    }

    @Test
    void deletedQuizDisappearsFromListButHistoryIsKept() throws Exception {
        String admin = adminToken();
        long quizId = publishedQuiz(admin, 2).get("quiz").get("id").asLong();
        String student = studentToken();
        long attemptId = call(post("/api/attempts"), student, Map.of("quizId", quizId), 201).get("attemptId").asLong();
        call(post("/api/attempts/" + attemptId + "/submit"), student, null, 200);

        call(delete("/api/admin/quizzes/" + quizId), admin, null, 204);
        call(get("/api/quizzes/" + quizId), null, null, 404);
        call(post("/api/attempts"), student, Map.of("quizId", quizId), 404);
        // the old result is still readable
        call(get("/api/attempts/" + attemptId + "/result"), student, null, 200);
    }

    @Test
    void registrationAndLoginValidation() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@test.com";
        call(post("/api/auth/register"), null, Map.of("name", "A", "email", email, "password", "short"), 400);
        call(post("/api/auth/register"), null, Map.of("name", "A", "email", email, "password", "LongEnough1"), 201);
        call(post("/api/auth/register"), null, Map.of("name", "A", "email", email, "password", "LongEnough1"), 409);
        call(post("/api/auth/login"), null, Map.of("email", email, "password", "WrongPassword"), 401);
        JsonNode ok = call(post("/api/auth/login"), null, Map.of("email", email, "password", "LongEnough1"), 200);
        assertEquals("STUDENT", ok.get("user").get("role").asText());

        String token = ok.get("token").asText();
        call(get("/api/auth/me"), token, null, 200);
        call(post("/api/auth/logout"), token, null, 204);
        call(get("/api/auth/me"), token, null, 401);       // token no longer valid after logout
    }
}
