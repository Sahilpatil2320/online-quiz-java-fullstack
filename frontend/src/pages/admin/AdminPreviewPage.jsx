import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Pencil } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { api } from '../../services/api';
import { ErrorState, Loading } from '../../components/StateViews';
import { titleCase } from '../../utils/format';

/** Read-only preview of a quiz exactly as students will see its questions. */
export default function AdminPreviewPage() {
  const { quizId } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.adminGetQuiz(quizId), [quizId]);
  const [showAnswers, setShowAnswers] = useState(false);

  if (loading) return <div className="container page"><Loading label="Loading preview..." /></div>;
  if (error) {
    return (
      <div className="container page narrow">
        <ErrorState error={error} onRetry={reload} title="Could not load the preview" />
        <p className="center"><Link to="/admin" className="btn btn-secondary">Back to admin</Link></p>
      </div>
    );
  }

  const { quiz, questions } = data;
  return (
    <div className="container page narrow">
      <p className="breadcrumb"><Link to="/admin">Admin</Link> / Preview</p>
      <div className="alert alert-info" role="note">Preview mode - nothing you do here is saved.</div>
      <div className="page-head page-head-row">
        <div>
          <h1>{quiz.title}</h1>
          <p className="muted">
            {quiz.subject} &middot; {titleCase(quiz.difficulty)} &middot; <Clock size={14} aria-hidden="true" /> {quiz.durationMinutes} min &middot; {quiz.questionCount} questions &middot; {quiz.published ? 'Published' : 'Draft'}
          </p>
        </div>
        <Link to={`/admin/quizzes/${quiz.id}/edit`} className="btn btn-secondary"><Pencil size={16} aria-hidden="true" /> Edit</Link>
      </div>

      <label className="check">
        <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} />
        <span>Show correct answers (admin only)</span>
      </label>

      {questions.length === 0 && <div className="card muted center">This quiz has no questions yet.</div>}
      {questions.map((q, i) => (
        <article key={q.id} className="card question-card preview-q">
          <div className="q-meta"><span className="q-count">Question {i + 1} of {questions.length}</span>{q.topic && <span className="chip chip-subject">{q.topic}</span>}</div>
          <h2 className="q-text">{q.questionText}</h2>
          <div className="options" role="presentation">
            {q.options.map((o, idx) => (
              <div key={o.id} className={`option ${showAnswers && o.correct ? 'preview-correct' : ''}`}>
                <span className="option-key" aria-hidden="true">{String.fromCharCode(65 + idx)}</span>
                <span className="option-text">{o.text}</span>
                {showAnswers && o.correct && <span className="review-tags">Correct</span>}
              </div>
            ))}
          </div>
          {showAnswers && q.explanation && <p className="explanation"><strong>Explanation:</strong> {q.explanation}</p>}
        </article>
      ))}
    </div>
  );
}
