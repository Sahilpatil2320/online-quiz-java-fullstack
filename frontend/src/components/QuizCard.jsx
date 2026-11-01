import { Clock, HelpCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { titleCase } from '../utils/format';

export default function QuizCard({ quiz }) {
  return (
    <article className="card quiz-card">
      <div className="quiz-card-top">
        <span className="chip chip-subject">{quiz.subject}</span>
        <span className={`chip chip-${quiz.difficulty.toLowerCase()}`}>{titleCase(quiz.difficulty)}</span>
      </div>
      <h3>{quiz.title}</h3>
      <p className="muted quiz-desc">{quiz.description || 'Test your knowledge with this quiz.'}</p>
      <ul className="quiz-meta">
        <li><HelpCircle size={16} aria-hidden="true" /> {quiz.questionCount} questions</li>
        <li><Clock size={16} aria-hidden="true" /> {quiz.durationMinutes} min</li>
      </ul>
      <Link className="btn btn-primary btn-block" to={`/quizzes/${quiz.id}/instructions`}>
        <Play size={16} aria-hidden="true" /> Start
        <span className="sr-only"> {quiz.title}</span>
      </Link>
    </article>
  );
}
