import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Lightbulb, MinusCircle, XCircle } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import { ErrorState, Loading } from '../components/StateViews';

const OUTCOME = {
  CORRECT: { label: 'Correct', icon: CheckCircle2, cls: 'good' },
  INCORRECT: { label: 'Incorrect', icon: XCircle, cls: 'bad' },
  UNANSWERED: { label: 'Not answered', icon: MinusCircle, cls: 'skip' },
};

export default function ReviewPage() {
  const { attemptId } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.getReview(attemptId), [attemptId]);

  if (loading) return <div className="container page"><Loading label="Loading answers..." /></div>;
  if (error) {
    return (
      <div className="container page narrow">
        <ErrorState error={error} onRetry={reload} title="Review unavailable" />
        <p className="center"><Link to="/my-results" className="btn btn-secondary">My results</Link></p>
      </div>
    );
  }

  return (
    <div className="container page narrow">
      <div className="page-head">
        <h1>Review answers</h1>
        <p className="muted">{data.quizTitle} &middot; Score {data.score} / {data.maxScore}</p>
      </div>

      {data.items.map((item) => {
        const o = OUTCOME[item.outcome];
        const Icon = o.icon;
        return (
          <article key={item.questionId} className={`card review-item review-${o.cls}`}>
            <header className="review-head">
              <span className="q-count">Question {item.number}</span>
              <span className={`outcome outcome-${o.cls}`}><Icon size={16} aria-hidden="true" /> {o.label}</span>
            </header>
            <h2 className="q-text">{item.text}</h2>
            <ul className="review-options">
              {item.options.map((opt) => {
                const tags = [];
                if (opt.correct) tags.push('Correct answer');
                if (opt.selected) tags.push('Your answer');
                const cls = opt.correct ? 'is-correct' : opt.selected ? 'is-wrong' : '';
                return (
                  <li key={opt.id} className={`review-option ${cls}`}>
                    <span>{opt.text}</span>
                    {tags.length > 0 && <span className="review-tags">{tags.join(' / ')}</span>}
                  </li>
                );
              })}
            </ul>
            {item.explanation && (
              <p className="explanation"><Lightbulb size={16} aria-hidden="true" /> <span><strong>Explanation:</strong> {item.explanation}</span></p>
            )}
          </article>
        );
      })}

      <div className="actions-row actions-center">
        <Link to={`/results/${attemptId}`} className="btn btn-secondary">Back to result</Link>
        <Link to="/quizzes" className="btn btn-primary">More quizzes</Link>
      </div>
    </div>
  );
}
