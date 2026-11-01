# REST API

Base URL: `http://localhost:8080/api` · JSON everywhere · Times are ISO-8601 UTC strings.

Authenticated endpoints need the header `Authorization: Bearer <token>` (token from login/register).

## Error format

```json
{ "timestamp": "2026-10-29T10:00:00Z", "status": 409, "code": "ATTEMPT_SUBMITTED",
  "message": "This attempt has already been submitted.", "fieldErrors": { "title": "Title is required" } }
```
`fieldErrors` only appears for `400 VALIDATION_ERROR`.

| Status | Codes | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `BAD_REQUEST`, `MALFORMED_REQUEST` | Invalid input, invalid option, bad JSON |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token, wrong password |
| 403 | `FORBIDDEN` | Logged in but not an ADMIN |
| 404 | `NOT_FOUND` | Unknown quiz/question/attempt (also other users' attempts) |
| 409 | `ATTEMPT_SUBMITTED`, `ATTEMPT_IN_PROGRESS`, `EMAIL_TAKEN`, `CONFLICT` | Duplicate submit, result requested too early, duplicate email |
| 410 | `ATTEMPT_EXPIRED` | Deadline passed; the attempt was finalized with the saved answers |
| 500/503 | `SERVER_ERROR` | Unexpected error / database down (`/health` returns 503) |

## Health
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | none | `{"status":"UP","database":"UP"}`; 503 if MySQL is unreachable |

## Authentication
| Method | Path | Auth | Body → Response |
|---|---|---|---|
| POST | `/auth/register` | none | `{name,email,password(8-72)}` → `201 {token,user}` (role is always STUDENT) |
| POST | `/auth/login` | none | `{email,password}` → `200 {token,user:{id,name,email,role}}` |
| POST | `/auth/logout` | user | → `204` (token is deleted server-side) |
| GET | `/auth/me` | user | → `{id,name,email,role}` |

## Public quiz endpoints (no login)
| Method | Path | Response |
|---|---|---|
| GET | `/quizzes` | `[{id,title,description,subject,difficulty,durationMinutes,questionCount}]` (published only) |
| GET | `/quizzes/{id}` | one summary, `404` if unpublished/deleted |
| GET | `/quizzes/{id}/instructions` | `{quiz, scoringPolicy, negativeMarking, unansweredCountsAsIncorrect, rules[]}` |

## Attempts (login required, own attempts only)
| Method | Path | Description |
|---|---|---|
| POST | `/attempts` | Body `{quizId}`. Creates an attempt and the **server-side deadline**. `201` new, `200` if an unfinished attempt was resumed. → `{attemptId,quizId,startedAt,deadlineAt,serverTime,totalQuestions,resumed}` |
| GET | `/attempts/{id}/questions` | Questions + options (**no correct answers, no explanations**) and already-saved answers: `{attemptId,quizTitle,deadlineAt,serverTime,questions:[{id,number,text,topic,options:[{id,text}]}],answers:[{questionId,optionId}]}`. `410` if time ran out, `409` if submitted. |
| PUT | `/attempts/{id}/answers` | Body `{questionId, optionId}`; `optionId: null` clears the answer. `204`. `400` invalid option, `410` expired, `409` submitted. |
| POST | `/attempts/{id}/submit` | Optional body `{answers:[{questionId,optionId}]}` = the complete final answer list. Server scores and returns the result. After the deadline the body is ignored and the attempt is finalized as `EXPIRED`. Second submit → `409`. |
| GET | `/attempts/{id}/result` | `{score,maxScore,percentage,correct,incorrect,unanswered,timeTakenSeconds,status,performanceMessage,topics[]}` |
| GET | `/attempts/{id}/review` | Only after submission: per question the options with `correct`/`selected` flags, `outcome` (`CORRECT`/`INCORRECT`/`UNANSWERED`) and `explanation`. `409` while in progress. |
| GET | `/attempts/mine?page=0&size=10` | Paged history `{items,page,size,totalItems,totalPages}` |

## Admin (role ADMIN, enforced on the server)
| Method | Path | Description |
|---|---|---|
| GET | `/admin/quizzes` | All non-deleted quizzes incl. drafts |
| GET | `/admin/quizzes/{id}` | Quiz + questions **with** correct answers (editing/preview) |
| POST | `/admin/quizzes` | `{title,description,subject,difficulty(EASY/MEDIUM/HARD),durationMinutes(1-300)}` → `201` (always a draft) |
| PUT | `/admin/quizzes/{id}` | Same body plus optional `published` |
| PATCH | `/admin/quizzes/{id}/publish` | `{published:true|false}` (needs ≥1 question to publish) |
| DELETE | `/admin/quizzes/{id}` | Soft delete (`204`); old attempts stay readable |
| POST | `/admin/quizzes/{quizId}/questions` | `{questionText,topic,explanation,options:[{text,correct} x4]}` – exactly 4 options, exactly 1 correct |
| PUT | `/admin/questions/{id}` | Same body; options are updated in place |
| DELETE | `/admin/questions/{id}` | Soft delete |

### Quick curl check (PowerShell: use `curl.exe`)
```
curl.exe http://localhost:8080/api/health
curl.exe http://localhost:8080/api/quizzes
curl.exe -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"YOUR_PASSWORD\"}"
```
