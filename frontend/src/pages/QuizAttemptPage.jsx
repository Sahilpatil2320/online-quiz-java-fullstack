import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, BookmarkCheck, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
  Clock, Eraser, Send,
} from 'lucide-react';
import { api } from '../services/api';
import useCountdown from '../hooks/useCountdown';
import ConfirmDialog from '../components/ConfirmDialog';
import { ErrorState, Loading } from '../components/StateViews';
import { formatClock } from '../utils/format';

// "Marked for review" is only a convenience for the student, so a safe local copy survives a page refresh.
const marksKey = (attemptId) => `sqrock_marks_${attemptId}`;
function loadMarks(attemptId) {
  try { return JSON.parse(localStorage.getItem(marksKey(attemptId)) || '[]'); } catch { return []; }
}
function storeMarks(attemptId, set) {
  try { localStorage.setItem(marksKey(attemptId), JSON.stringify([...set])); } catch { /* ignore */ }
}

const FINISHED_CODES = ['ATTEMPT_EXPIRED', 'ATTEMPT_SUBMITTED'];

export default function QuizAttemptPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);          // questions WITHOUT correct answers + deadline
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({});            // questionId -> optionId
  const [marked, setMarked] = useState(() => new Set(loadMarks(attemptId)));
  const [index, setIndex] = useState(0);
  const [unsaved, setUnsaved] = useState({});            // questionId -> true if the last save failed
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [retryTick, setRetryTick] = useState(0);

  // Refs hold the latest values for async code and guard against duplicate submissions.
  const answersRef = useRef({});
  const saveQueue = useRef(Promise.resolve());           // answers are saved one after another, in order
  const submittingRef = useRef(false);
  const leavingRef = useRef(false);

  const remainingMs = useCountdown(attempt?.deadlineAt, attempt?.serverTime);
  const timeUp = remainingMs === 0;

  const goToResult = useCallback(() => {
    leavingRef.current = true;
    try { localStorage.removeItem(marksKey(attemptId)); } catch { /* ignore */ }
    navigate(`/results/${attemptId}`, { replace: true });
  }, [attemptId, navigate]);

  // ---- load the attempt -------------------------------------------------
  const load = useCallback(() => {
    setLoadError(null);
    api.getAttemptQuestions(attemptId)
      .then((data) => {
        const saved = {};
        data.answers.forEach((a) => { saved[a.questionId] = a.optionId; });
        answersRef.current = saved;
        setAnswers(saved);
        setAttempt(data);
      })
      .catch((err) => {
        if (FINISHED_CODES.includes(err.code)) goToResult();   // already over: show the result instead
        else setLoadError(err);
      });
  }, [attemptId, goToResult]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { storeMarks(attemptId, marked); }, [attemptId, marked]);

  // Ask before the tab is closed by accident.
  useEffect(() => {
    if (!attempt) return undefined;
    const handler = (e) => { if (!leavingRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [attempt]);

  // ---- save answers -----------------------------------------------------
  const setAnswer = (questionId, optionId) => {
    if (submittingRef.current || leavingRef.current || timeUp) return;
    const next = { ...answersRef.current };
    if (optionId == null) delete next[questionId]; else next[questionId] = optionId;
    answersRef.current = next;
    setAnswers(next);

    saveQueue.current = saveQueue.current
      .then(() => api.saveAnswer(attemptId, questionId, optionId ?? null))
      .then(() => setUnsaved((u) => {
        if (!u[questionId]) return u;
        const { [questionId]: _removed, ...rest } = u;
        return rest;
      }))
      .catch((err) => {
        if (FINISHED_CODES.includes(err.code)) { goToResult(); return; }
        setUnsaved((u) => ({ ...u, [questionId]: true }));   // will be re-sent together with the submit
      });
  };

  // ---- submit -----------------------------------------------------------
  const submit = useCallback(async (auto = false) => {
    if (submittingRef.current || leavingRef.current) return;   // never submit twice
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      await saveQueue.current;
      const payload = Object.entries(answersRef.current)
        .map(([questionId, optionId]) => ({ questionId: Number(questionId), optionId }));
      await api.submitAttempt(attemptId, payload);   // the SERVER calculates the score
      goToResult();
    } catch (err) {
      if (FINISHED_CODES.includes(err.code)) { goToResult(); return; }
      submittingRef.current = false;
      setSubmitting(false);
      setSubmitError(err.message);
      if (auto) setTimeout(() => setRetryTick((t) => t + 1), 3000);   // keep trying when time ran out
    }
  }, [attemptId, goToResult]);

  // Time is up: submit automatically.
  useEffect(() => {
    if (attempt && timeUp) submit(true);
  }, [attempt, timeUp, retryTick, submit]);

  // ---- derived values ---------------------------------------------------
  const questions = attempt?.questions ?? [];
  const total = questions.length;
  const answeredCount = useMemo(() => questions.filter((q) => answers[q.id] != null).length, [questions, answers]);
  const markedCount = useMemo(() => questions.filter((q) => marked.has(q.id)).length, [questions, marked]);
  const unsavedCount = Object.keys(unsaved).length;

  if (loadError) {
    return (
      <div className="container page narrow">
        <ErrorState error={loadError} onRetry={load} title="Could not open this quiz attempt" />
        <p className="center"><Link to="/quizzes" className="btn btn-secondary">Back to quizzes</Link></p>
      </div>
    );
  }
  if (!attempt) return <div className="container page"><Loading label="Loading your quiz..." /></div>;
  if (total === 0) {
    return <div className="container page"><ErrorState error={{ message: 'This quiz has no questions.' }} /></div>;
  }

  const question = questions[index];
  const locked = submitting || timeUp;
  const seconds = remainingMs == null ? null : Math.ceil(remainingMs / 1000);
  const nearlyDone = seconds != null && seconds > 0 && seconds <= 60;
  const progressPct = Math.round((answeredCount / total) * 100);

  const toggleMark = () => setMarked((prev) => {
    const next = new Set(prev);
    if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
    return next;
  });

  const paletteState = (q, i) => {
    const parts = [`Question ${i + 1}`, answers[q.id] != null ? 'answered' : 'not answered'];
    if (marked.has(q.id)) parts.push('marked for review');
    if (i === index) parts.push('current question');
    return parts.join(', ');
  };

  return (
    <div className="exam">
      <header className="exam-header">
        <div className="container exam-header-inner">
          <div className="exam-title">
            <span className="exam-brand">SQROCK Quiz</span>
            <h1>{attempt.quizTitle}</h1>
          </div>
          <div className={`timer ${nearlyDone ? 'timer-warning' : ''}`} role="timer" aria-label="Time remaining">
            <Clock size={18} aria-hidden="true" />
            <span data-testid="timer">{seconds == null ? '--:--' : formatClock(seconds)}</span>
          </div>
        </div>
      </header>

      <div className="container exam-body">
        {nearlyDone && (
          <div className="alert alert-warning" role="alert">
            <AlertTriangle size={18} aria-hidden="true" /> Less than a minute left! Your saved answers will be submitted automatically when time runs out.
          </div>
        )}
        {unsavedCount > 0 && (
          <div className="alert alert-error" role="alert">
            {unsavedCount === 1 ? 'One answer' : `${unsavedCount} answers`} could not be saved because of a network problem.
            Keep going - everything will be sent again when you submit.
          </div>
        )}

        <div className="exam-grid">
          <section className="card question-card" aria-labelledby="question-text">
            <div className="q-meta">
              <span className="q-count">Question {index + 1} of {total}</span>
              {question.topic && <span className="chip chip-subject">{question.topic}</span>}
              {marked.has(question.id) && <span className="chip chip-review"><Bookmark size={12} aria-hidden="true" /> For review</span>}
            </div>
            <h2 id="question-text" className="q-text">{question.text}</h2>

            <fieldset className="options" disabled={locked}>
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((option, i) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label key={option.id} className={`option ${selected ? 'selected' : ''}`}>
                    <input type="radio" name={`question-${question.id}`} checked={selected}
                           onChange={() => setAnswer(question.id, option.id)} />
                    <span className="option-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                    <span className="option-text">{option.text}</span>
                  </label>
                );
              })}
            </fieldset>

            <div className="q-tools">
              <button type="button" className={`btn btn-secondary btn-sm ${marked.has(question.id) ? 'is-on' : ''}`}
                      aria-pressed={marked.has(question.id)} onClick={toggleMark} disabled={locked}>
                {marked.has(question.id) ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                {marked.has(question.id) ? 'Unmark review' : 'Mark for review'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnswer(question.id, null)}
                      disabled={locked || answers[question.id] == null}>
                <Eraser size={16} aria-hidden="true" /> Clear answer
              </button>
            </div>

            <div className="q-nav">
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setIndex(0)}
                      disabled={index === 0} aria-label="First question"><ChevronFirst size={18} /></button>
              <button type="button" className="btn btn-secondary" onClick={() => setIndex(index - 1)} disabled={index === 0}>
                <ChevronLeft size={18} aria-hidden="true" /> Previous
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)} disabled={index === total - 1}>
                Next <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setIndex(total - 1)}
                      disabled={index === total - 1} aria-label="Last question"><ChevronLast size={18} /></button>
            </div>
          </section>

          <aside className="card palette-card" aria-label="Question navigator">
            <div className="progress-head">
              <strong>Progress</strong>
              <span data-testid="answered-count">{answeredCount} / {total} answered</span>
            </div>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={progressPct} aria-label="Questions answered">
              <span style={{ width: `${progressPct}%` }} />
            </div>

            <ol className="palette">
              {questions.map((q, i) => {
                const classes = ['palette-btn'];
                if (answers[q.id] != null) classes.push('answered');
                if (marked.has(q.id)) classes.push('marked');
                if (i === index) classes.push('current');
                return (
                  <li key={q.id}>
                    <button type="button" className={classes.join(' ')} onClick={() => setIndex(i)}
                            aria-label={paletteState(q, i)} aria-current={i === index ? 'true' : undefined}>
                      {i + 1}
                    </button>
                  </li>
                );
              })}
            </ol>

            <ul className="legend">
              <li><span className="dot dot-answered" /> Answered</li>
              <li><span className="dot dot-unanswered" /> Not answered</li>
              <li><span className="dot dot-marked" /> For review</li>
              <li><span className="dot dot-current" /> Current</li>
            </ul>

            <button type="button" className="btn btn-accent btn-block btn-lg" onClick={() => setConfirmOpen(true)}
                    disabled={submitting || timeUp}>
              <Send size={18} aria-hidden="true" /> Submit Quiz
            </button>
          </aside>
        </div>
      </div>

      <ConfirmDialog open={confirmOpen && !timeUp} title="Submit your quiz?" confirmLabel="Yes, submit"
                     cancelLabel="Keep working" busy={submitting}
                     onCancel={() => setConfirmOpen(false)} onConfirm={() => submit(false)}>
        <p>You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.</p>
        {total - answeredCount > 0 && (
          <p className="text-warning">{total - answeredCount} unanswered question(s) will score 0 marks.</p>
        )}
        {markedCount > 0 && <p>{markedCount} question(s) are still marked for review.</p>}
        <p className="muted">After submitting you cannot change your answers.</p>
        {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}
      </ConfirmDialog>

      {timeUp && (
        <div className="modal-backdrop">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="timeup-title">
            <h2 id="timeup-title">Time is up</h2>
            <div className="modal-body">
              <p>{submitError ? 'We could not submit your answers yet.' : 'Submitting your saved answers...'}</p>
              {submitError && <div className="alert alert-error" role="alert">{submitError} Retrying automatically...</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
