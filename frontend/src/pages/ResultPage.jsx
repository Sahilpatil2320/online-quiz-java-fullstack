import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, Clock, Home, RotateCcw, Target, XCircle, MinusCircle, Trophy } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import ScoreRing from '../components/ScoreRing';
import { ErrorState, Loading } from '../components/StateViews';
import { formatDateTime, formatDuration, formatPercent } from '../utils/format';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.getResult(attemptId), [attemptId]);

  if (loading) return <div className="container page"><Loading label="Loading your result..." /></div>;
  if (error) {
    const inProgress = error.code === 'ATTEMPT_IN_PROGRESS';
    return (
      <div className="container page narrow">
        <ErrorState error={error} onRetry={reload} title={inProgress ? 'Quiz not submitted yet' : 'Result unavailable'} />
        <p className="center">
          {inProgress && <Link to={`/attempt/${attemptId}`} className="btn btn-primary">Continue quiz</Link>}{' '}
          <Link to="/my-results" className="btn btn-secondary">My results</Link>
        </p>
      </div>
    );
  }

  const r = data;
  return (
    <div className="container page">
      <div className="result-header">
        <span className="result-badge"><CheckCircle2 size={20} aria-hidden="true" /></span>
        <div>
          <h1>Quiz completed</h1>
          <p className="muted">{r.quizTitle} &middot; {formatDateTime(r.submittedAt)}</p>
          {r.status === 'EXPIRED' && (
            <p className="chip chip-warn">Time ran out - your saved answers were submitted automatically</p>
          )}
        </div>
      </div>

      <div className="result-grid">
        <section className="card score-card" aria-label="Your score">
          <ScoreRing percentage={r.percentage} label="Score" />
          <p className="score-big"><strong>{r.score}</strong> / {r.maxScore}</p>
          <p className="performance"><Trophy size={18} aria-hidden="true" /> {r.performanceMessage}</p>
        </section>

        <section className="stat-grid" aria-label="Result details">
          <div className="card stat stat-good"><CheckCircle2 size={22} aria-hidden="true" /><strong>{r.correct}</strong><span>Correct</span></div>
          <div className="card stat stat-bad"><XCircle size={22} aria-hidden="true" /><strong>{r.incorrect}</strong><span>Incorrect</span></div>
          <div className="card stat stat-skip"><MinusCircle size={22} aria-hidden="true" /><strong>{r.unanswered}</strong><span>Unanswered</span></div>
          <div className="card stat"><Target size={22} aria-hidden="true" /><strong>{formatPercent(r.percentage)}</strong><span>Percentage</span></div>
          <div className="card stat"><Clock size={22} aria-hidden="true" /><strong>{formatDuration(r.timeTakenSeconds)}</strong><span>Time taken</span></div>
        </section>
      </div>

      {r.topics.length > 0 && (
        <section className="card topics" aria-labelledby="topics-title">
          <h2 id="topics-title">Topic-wise performance</h2>
          <ul>
            {r.topics.map((t) => (
              <li key={t.topic}>
                <div className="topic-row">
                  <span>{t.topic}</span>
                  <span className="muted">{t.correct} / {t.total} &middot; {formatPercent(t.percentage)}</span>
                </div>
                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                     aria-valuenow={Math.round(Number(t.percentage))} aria-label={`${t.topic} score`}>
                  <span style={{ width: `${Number(t.percentage)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actions-row actions-center">
        <Link to={`/results/${attemptId}/review`} className="btn btn-primary btn-lg">
          <BookOpenCheck size={18} aria-hidden="true" /> Review Answers
        </Link>
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(`/quizzes/${r.quizId}/instructions`)}>
          <RotateCcw size={18} aria-hidden="true" /> Retake Quiz
        </button>
        <Link to="/" className="btn btn-ghost btn-lg"><Home size={18} aria-hidden="true" /> Back to Dashboard</Link>
      </div>
    </div>
  );
}
