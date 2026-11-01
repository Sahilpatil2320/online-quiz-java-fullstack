import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="SQROCK Quiz home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="28" height="28"><rect width="64" height="64" rx="14" fill="currentColor" /><path d="M20 34l8 8 16-18" fill="none" stroke="#5eead4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span>SQROCK <strong>Quiz</strong></span>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Brand />
        <button type="button" className="icon-btn nav-toggle" aria-expanded={open} aria-controls="main-nav"
                aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="main-nav" className={`nav ${open ? 'nav-open' : ''}`} aria-label="Main">
          <NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink>
          <NavLink to="/quizzes" className={linkClass} onClick={close}>Available Quizzes</NavLink>
          {user && <NavLink to="/my-results" className={linkClass} onClick={close}>My Results</NavLink>}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass} onClick={close}>
              <ShieldCheck size={16} aria-hidden="true" /> Admin
            </NavLink>
          )}
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user" title={user.email}>{user.name}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  <LogOut size={16} aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm" onClick={close}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
