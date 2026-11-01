import { Outlet } from 'react-router-dom';

/** Distraction-free layout for the quiz-taking page: no navigation links to click by accident. */
export default function ExamLayout() {
  return (
    <div className="app-shell exam-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <main id="main" className="app-main"><Outlet /></main>
    </div>
  );
}
