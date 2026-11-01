# SQROCK Quiz – Online Quiz Application (Java Full Stack)

A complete online examination app built for the Java Full Stack internship at **SQROCK IT SOLUTION**.

**React (Vite) → Spring Boot REST API → Service layer → Spring Data JPA/Hibernate → MySQL 8**

## Features
- Quiz list, search and subject filter – all data from MySQL via REST (nothing hardcoded in React)
- Instructions page, then a real timed attempt
- Quiz page: question card, 4 options, Previous/Next/First/Last, numbered palette (answered / unanswered / current / marked), progress bar, countdown with low-time warning, **Mark for review**, **Clear answer**, confirm-before-submit
- **Server-authoritative timer**: the server stores `deadline_at`; the browser only displays it (computed from absolute time, so inactive tabs cannot gain time) and auto-submits at zero
- **Server-side scoring**: browser never sends a score; the correct answers never leave the server until the attempt is finished
- Results: score, percentage, correct/incorrect/unanswered, time taken, circular chart, performance message, topic-wise bars
- Answer review with explanations, retake (new attempt), attempt history with pagination
- Registration/login/logout with BCrypt passwords, roles `STUDENT` and `ADMIN`
- Admin area: create/edit/delete (soft) quizzes, questions with 4 options and exactly 1 correct, explanation, publish/unpublish, preview
- Responsive, keyboard-accessible UI, loading / empty / error / success states

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, plain CSS, Lucide icons, Fetch API |
| Backend | Java 17 or newer (JDK 17 or 21), Spring Boot 3.3.5, Spring Web, Spring Data JPA/Hibernate, Bean Validation, Spring Security, Maven Wrapper |
| Database | MySQL 8 (`database/schema.sql`, `database/seed.sql`) |
| Tests | JUnit 5, MockMvc, H2 (tests only), Vitest, React Testing Library |

## Project structure
```
online-quiz-java-fullstack/
├── frontend/   React app (src/components, pages, layouts, services, hooks, utils, styles)
├── backend/    Spring Boot app (controller, service, repository, entity, dto, security, config, exception)
├── database/   schema.sql (tables) and seed.sql (4 quizzes, 32 questions)
└── docs/       API.md, TESTING.md
```

## Architecture
```
React frontend ──HTTP/JSON──▶ Spring Boot REST API ──▶ Service layer ──▶ Repository / JPA ──▶ MySQL
 (pages, api.js)               (controllers + DTOs,      (business rules,    (Spring Data,       (quiz_app)
                                security filter,          transactions,       Hibernate)
                                exception handler)        scoring)
```
- **Controllers** only map HTTP ↔ DTOs. **Services** hold the rules and run in transactions. **Entities** are never returned directly; DTO records are.
- `GlobalExceptionHandler` turns every error into the same JSON shape (see `docs/API.md`).

### How an attempt works
1. `POST /api/attempts` – checks the quiz is published, stores `started_at`, `deadline_at = now + duration`, `total_questions`. A second start of the same quiz resumes the unfinished attempt.
2. `GET /api/attempts/{id}/questions` – returns questions and options **without** `is_correct`, plus the server clock and deadline.
3. Every click calls `PUT /api/attempts/{id}/answers` (saved in order). The server verifies the option belongs to the question and that the deadline has not passed.
4. `POST /api/attempts/{id}/submit` – takes a database row lock on the attempt (so two simultaneous submits cannot both win), re-checks the deadline, optionally reconciles the final answer list, then **scores from `answer_options.is_correct`**: 1 mark per correct answer, 0 for wrong/unanswered, no negative marking, `percentage = correct / total × 100`. The status becomes `SUBMITTED`; a second submit returns `409`.
5. **Timer enforcement**: after `deadline_at` all answer changes return `410 ATTEMPT_EXPIRED`; the attempt is finalized as `EXPIRED` using only answers saved before the deadline (`submitted_at = deadline_at`). This also happens lazily when the student opens the result, the question list or history, so an abandoned tab is still closed correctly.
6. `GET …/result` and `GET …/review` are available only after finalization; the review is where correct answers and explanations are revealed.

### Database schema summary
`users` · `auth_tokens` (SHA-256 hash of login tokens) · `quizzes` (soft `deleted`, `published`) · `questions` (soft `deleted`, `question_order`, `topic`) · `answer_options` (`is_correct`, unique `(question_id, option_order)`) · `quiz_attempts` (`deadline_at`, `status`, `score`, `percentage`) · `attempt_answers` (unique `(attempt_id, question_id)`).
Foreign keys and indexes are in `database/schema.sql`. Quizzes and questions are soft-deleted so history is never destroyed.

## Prerequisites (Windows)
| Tool | Check | Install |
|---|---|---|
| JDK 17 or newer | `java -version` | https://adoptium.net (Temurin 17 or 21) |
| Node.js 18+ and npm | `node -v` | https://nodejs.org |
| MySQL Server 8 + Workbench | `mysql --version` | https://dev.mysql.com/downloads/installer/ |
Maven is **not** needed – the project includes the Maven Wrapper (`mvnw.cmd`), which downloads Maven on first run (internet required).

## Setup and run (PowerShell)

### 1. Create the database and a limited MySQL user
Open MySQL Workbench (or `mysql -u root -p`) and run the schema, then seed data (the seed has no passwords). From the repository root:
```powershell
cd online-quiz-java-fullstack
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql        # run ONCE on the empty database
```
Create the application user with only the permissions it needs (choose your own password):
```sql
CREATE USER 'quiz_user'@'localhost' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_app.* TO 'quiz_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure the backend (secrets stay local)
```powershell
cd backend
Copy-Item application-local.properties.example application-local.properties
notepad application-local.properties     # put YOUR DB password and first admin email/password
```
`application-local.properties` is git-ignored. Alternative: set environment variables for the current window:
```powershell
$env:DB_PASSWORD = "your-db-password"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "a-strong-password"
```
On startup, if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no such user exists, the first ADMIN account is created (password stored as a BCrypt hash). Public registration can only create students.

### 3. Start the backend  (working directory: `backend`)
```powershell
cd online-quiz-java-fullstack\backend
.\mvnw.cmd spring-boot:run
```
Check: http://localhost:8080/api/health → `{"status":"UP","database":"UP",...}` and http://localhost:8080/api/quizzes.

### 4. Start the frontend  (working directory: `frontend`)
```powershell
cd online-quiz-java-fullstack\frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Open http://localhost:5173. Register a student (or log in as the admin you configured) and start a quiz.

### 5. Test the REST API
Use Postman or `curl.exe` – examples in [docs/API.md](docs/API.md).

## Tests
```powershell
cd online-quiz-java-fullstack\backend;  .\mvnw.cmd test      # backend (uses in-memory H2, no MySQL needed)
cd online-quiz-java-fullstack\frontend; npm test; npm run build
```
Details and the manual end-to-end checklist: [docs/TESTING.md](docs/TESTING.md).

## API
Full endpoint list with request/response shapes and error codes: [docs/API.md](docs/API.md).

## Screenshots
Run the app and add your own screenshots (for example `screenshots/home.png`, `quiz.png`, `result.png`, `admin.png`), then reference them here. Do not include real passwords or personal data in screenshots.

## Security notes
- Passwords: BCrypt. Login tokens: random 256-bit values, only their SHA-256 hash is stored, 12 h expiry, deleted on logout.
- `/api/admin/**` requires the ADMIN role **on the server**; the hidden React link is only cosmetic.
- Attempts are owned by a user; other users get `404`.
- No secrets are committed; DB credentials and the first admin come from environment variables or an untracked file.
- Use HTTPS and a reverse proxy before any real deployment.

## Known limitations
- Editing a question's text or its correct option after students have attempted it changes what the **review** page shows for old attempts (stored scores do not change). Unpublish a quiz before editing it.
- The login token is kept in the browser's local storage (simple SPA approach); there is no password reset, e-mail verification or rate limiting yet.
- Only single-answer multiple-choice questions (exactly 4 options). Questions are shown in a fixed order.
- "Mark for review" flags live in the browser only (local, non-sensitive).
- The app is a learning/internship project, not hardened for production.

## Future enhancements
Random question order, question banks, negative marking option, image questions, password reset, rate limiting, admin analytics and CSV export, Flyway migrations, Docker Compose, dark mode.
