import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, HelpCircle, Info, Play } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ErrorState, InlineError, Loading } from '../components/StateViews';
import { titleCase } from '../utils/format';

export default function QuizInstructionsPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, error, loading, reload } = useAsync(() => api.getInstructions(quizId), [quizId]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const start = async () => {
    setStarting(true);
    setStartError('');
    try {
      const attempt = await api.startAttempt(Number(quizId));
      navigate(`/attempt/${attempt.attemptId}`);
    } catch (err) {
      setStartError(err.message);
      setStarting(false);
    }
  };

  if (loading) return <div className="container page"><Loading label="Loading instructions..." /></div>;
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} title="Quiz unavailable" />
        <p className="center"><Link to="/quizzes" className="btn btn-secondary">Back to quizzes</Link></p>
      </div>
    );
  }

  const { quiz, rules } = data;
  return (
    <div className="container page narrow">
      <div className="card instructions">
        <div className="quiz-card-top">
          <span className="chip chip-subject">{quiz.subject}</span>
          <span className={`chip chip-${quiz.difficulty.toLowerCase()}`}>{titleCase(quiz.difficulty)}</span>
        </div>
        <h1>{quiz.title}</h1>
        <p className="muted">{quiz.description}</p>

        <div className="facts">
          <div><HelpCircle size={20} aria-hidden="true" /><strong>{quiz.questionCount}</strong><span>Questions</span></div>
          <div><Clock size={20} aria-hidden="true" /><strong>{quiz.durationMinutes}</strong><span>Minutes</span></div>
          <div><Info size={20} aria-hidden="true" /><strong>1</strong><span>Mark each</span></div>
        </div>

        <h2>Before you begin</h2>
        <ul className="rules">{rules.map((r) => <li key={r}>{r}</li>)}</ul>

        <InlineError message={startError} />
        <div className="actions-row">
          <Link to="/quizzes" className="btn btn-secondary">Back</Link>
          {user ? (
            <button type="button" className="btn btn-primary btn-lg" onClick={start} disabled={starting}>
              <Play size={18} aria-hidden="true" /> {starting ? 'Starting...' : 'Start Test'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}>
              Log in to start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
