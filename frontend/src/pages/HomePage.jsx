import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Clock, ListChecks, Play, ShieldCheck } from 'lucide-react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/api';
import QuizCard from '../components/QuizCard';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

export default function HomePage() {
  const { data, error, loading, reload } = useAsync(() => api.listQuizzes(), []);
  const featured = (data || []).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="chip chip-light">Online examination platform</span>
            <h1>Test your knowledge. <span className="accent">Track your progress.</span></h1>
            <p>
              SQROCK Quiz lets you take timed multiple-choice quizzes, get instant results scored by the server,
              review every answer with explanations and see how you perform topic by topic.
            </p>
            <div className="hero-actions">
              <Link to="/quizzes" className="btn btn-accent btn-lg"><Play size={18} aria-hidden="true" /> Start Quiz</Link>
              <Link to="/my-results" className="btn btn-ghost btn-lg">My Results <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
            <ul className="hero-points">
              <li><CheckCircle2 size={16} aria-hidden="true" /> Server-side timer &amp; scoring</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Instant answer review</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Full attempt history</li>
            </ul>
          </div>
          <div className="hero-card card" aria-hidden="true">
            <div className="mock-head"><span>Question 3 of 10</span><span className="mock-timer"><Clock size={14} /> 08:42</span></div>
            <div className="mock-progress"><span style={{ width: '30%' }} /></div>
            <p className="mock-q">Which keyword is used to inherit a class in Java?</p>
            <div className="mock-opt">implements</div>
            <div className="mock-opt selected">extends</div>
            <div className="mock-opt">inherits</div>
            <div className="mock-opt">super</div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Available quizzes</h2>
          <Link to="/quizzes" className="link-arrow">View all <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {loading && <Loading label="Loading quizzes..." />}
        {error && <ErrorState error={error} onRetry={reload} title="Could not load quizzes" />}
        {!loading && !error && featured.length === 0 && (
          <EmptyState title="No quizzes published yet" message="Please check back soon - new quizzes are added by the administrator." />
        )}
        {!loading && !error && featured.length > 0 && (
          <div className="grid grid-3">{featured.map((q) => <QuizCard key={q.id} quiz={q} />)}</div>
        )}
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head"><h2>How it works</h2></div>
          <div className="grid grid-3">
            <div className="card step"><span className="step-num">1</span><ListChecks size={26} aria-hidden="true" /><h3>Choose a quiz</h3><p className="muted">Pick a subject and difficulty, read the instructions and start when you are ready.</p></div>
            <div className="card step"><span className="step-num">2</span><Clock size={26} aria-hidden="true" /><h3>Answer before time runs out</h3><p className="muted">Move freely between questions, mark some for review and submit - or let the timer submit for you.</p></div>
            <div className="card step"><span className="step-num">3</span><BarChart3 size={26} aria-hidden="true" /><h3>Review your result</h3><p className="muted">See your score, topic-wise performance and the correct answers with explanations.</p></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head"><h2>Quiz rules</h2></div>
        <div className="card rules-card">
          <ShieldCheck size={28} aria-hidden="true" />
          <ul>
            <li>Each question has four options and exactly one correct answer.</li>
            <li>1 mark per correct answer. No negative marking. Unanswered questions score 0.</li>
            <li>The countdown is controlled by the server; late answers are not accepted.</li>
            <li>A quiz can be submitted only once, but you can retake it as a new attempt.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
