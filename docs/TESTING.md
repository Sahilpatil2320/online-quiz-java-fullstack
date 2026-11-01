# Testing

## Automated tests

### Backend (JUnit 5 + Spring Boot Test + MockMvc, in-memory H2 in MySQL mode)
No MySQL is needed. Working directory: `backend`
```powershell
.\mvnw.cmd test
```
Covered: quiz listing (published only), admin authorization (401 / 403 / 201), quiz & question validation,
no correct answers in active questions, server-side scoring (correct / wrong / unanswered), percentage,
clearing answers and the final answer list, duplicate submit (409) and locked answers after submit,
invalid options, expired attempts (410 + `EXPIRED` result), late submit ignoring client answers,
attempt ownership, resume vs. retake, soft-deleted quizzes keep history, registration/login/logout,
plus unit tests for `ScoreCalculator`.

### Frontend (Vitest + React Testing Library, API mocked)
Working directory: `frontend`
```powershell
npm test
npm run build
```
Covered: answers kept while navigating, progress, clear answer, mark for review, palette state, confirm dialog,
no double submit, auto-submit at deadline, expired/submitted attempts redirect to the result, network-error message,
result page rendering, API helper (network errors, field errors, bearer token).

## Manual end-to-end checklist
Start MySQL, backend and frontend (see README), log in as a student, then tick each item:

1. [ ] Open http://localhost:5173 – home page loads with hero and quiz cards.
2. [ ] Quiz cards come from MySQL (change a title in the Admin area and refresh).
3. [ ] Click a quiz → instructions page shows title, questions, minutes, rules.
4. [ ] "Start Test" (logged in) opens the quiz page; timer counts down.
5. [ ] Answer several questions; progress bar and palette update.
6. [ ] Next / Previous / First / Last keep every selected answer.
7. [ ] "Mark for review" shows an amber marker; click again to unmark.
8. [ ] "Clear answer" removes the selection.
9. [ ] Refresh the page mid-quiz: same attempt, answers and remaining time are restored.
10. [ ] "Submit Quiz" shows a confirmation with unanswered count; confirm submits once.
11. [ ] Result page: score, %, correct/incorrect/unanswered, time, ring chart, topic bars – verify by hand against your answers.
12. [ ] "Review Answers" shows your answer, the correct answer and explanations.
13. [ ] "Retake Quiz" starts a **new** attempt; the old result is still in My Results.
14. [ ] My Results lists both attempts with date, score, status; View results works.
15. [ ] Timer expiry: create a 1-minute quiz, wait – answers are submitted automatically and the result says "Time ran out".
16. [ ] Open DevTools → Network: `GET /attempts/{id}/questions` contains no correct answers.
17. [ ] Admin (admin account): create quiz, add 4-option question, publish, edit, preview, unpublish, delete (with confirmation).
18. [ ] Student account: `/admin` shows "Administrator access required"; `curl` to `/api/admin/quizzes` with a student token returns 403.
19. [ ] Resize to ~400 px wide: navigation collapses, quiz page stacks, tables become cards.
20. [ ] Stop the backend: pages show "Cannot reach the server" with a Try again button; restart and retry works.
21. [ ] Stop MySQL only: `/api/health` returns 503 and pages show a friendly server error.
