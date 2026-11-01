import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>&copy; {new Date().getFullYear()} SQROCK Quiz &middot; Java Full Stack internship project at SQROCK IT SOLUTION</p>
        <nav aria-label="Footer">
          <Link to="/quizzes">Quizzes</Link>
          <Link to="/my-results">My Results</Link>
        </nav>
      </div>
    </footer>
  );
}
