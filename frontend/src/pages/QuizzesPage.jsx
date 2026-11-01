import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import QuizCard from '../components/QuizCard';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export default function QuizzesPage() {
  const { data, error, loading, reload } = useAsync(() => api.listQuizzes(), []);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('ALL');

  const subjects = useMemo(() => ['ALL', ...new Set((data || []).map((q) => q.subject))], [data]);
  const filtered = useMemo(() => (data || []).filter((q) => {
    const matchesSubject = subject === 'ALL' || q.subject === subject;
    const text = `${q.title} ${q.description || ''} ${q.subject}`.toLowerCase();
    return matchesSubject && text.includes(query.trim().toLowerCase());
  }), [data, query, subject]);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Available quizzes</h1>
        <p className="muted">Choose a quiz to read its instructions and begin.</p>
      </div>

      {loading && <Loading label="Loading quizzes..." />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load quizzes" />}

      {!loading && !error && (data || []).length === 0 && (
        <EmptyState title="No quizzes are published yet" message="Please check back soon." />
      )}

      {!loading && !error && (data || []).length > 0 && (
        <>
          <div className="toolbar">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Search quizzes</span>
              <input type="search" placeholder="Search quizzes" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className="select-box">
              <span className="sr-only">Filter by subject</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjects.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All subjects' : s}</option>)}
              </select>
            </label>
          </div>
          {filtered.length === 0
            ? <EmptyState title="No quizzes match your search" message="Try a different word or subject." />
            : <div className="grid grid-3">{filtered.map((q) => <QuizCard key={q.id} quiz={q} />)}</div>}
        </>
      )}
    </div>
  );
}
