import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';
import { formatDateTime, formatPercent } from '../utils/format';

const STATUS = {
  SUBMITTED: { label: 'Completed', cls: 'chip-easy' },
  EXPIRED: { label: 'Time expired', cls: 'chip-warn' },
  IN_PROGRESS: { label: 'In progress', cls: 'chip-medium' },
};

export default function MyResultsPage() {
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAsync(() => api.myAttempts(page, 8), [page]);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>My results</h1>
        <p className="muted">All your quiz attempts, newest first.</p>
      </div>

      {loading && <Loading label="Loading your attempts..." />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load your results" />}

      {!loading && !error && data.items.length === 0 && (
        <EmptyState title="No attempts yet" message="Take your first quiz and your results will appear here."
                    action={<Link to="/quizzes" className="btn btn-primary">Browse quizzes</Link>} />
      )}

      {!loading && !error && data.items.length > 0 && (
        <>
          <ul className="attempt-list">
            {data.items.map((a) => {
              const s = STATUS[a.status] || STATUS.SUBMITTED;
              const inProgress = a.status === 'IN_PROGRESS';
              return (
                <li key={a.attemptId} className="card attempt-row">
                  <div className="attempt-main">
                    <h3>{a.quizTitle}</h3>
                    <p className="muted">{formatDateTime(a.startedAt)}</p>
                  </div>
                  <span className={`chip ${s.cls}`}>{s.label}</span>
                  <div className="attempt-score">
                    {inProgress ? <span className="muted">-</span> : (
                      <>
                        <strong>{a.score} / {a.totalQuestions}</strong>
                        <span className="muted">{formatPercent(a.percentage)}</span>
                      </>
                    )}
                  </div>
                  {inProgress
                    ? <Link className="btn btn-primary btn-sm" to={`/attempt/${a.attemptId}`}>Resume</Link>
                    : <Link className="btn btn-secondary btn-sm" to={`/results/${a.attemptId}`}>View results</Link>}
                </li>
              );
            })}
          </ul>
          {data.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} aria-hidden="true" /> Previous
              </button>
              <span>Page {data.page + 1} of {data.totalPages}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
