import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InlineError } from '../components/StateViews';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
      setBusy(false);
    }
  };

  return (
    <div className="container page auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Log in to take quizzes and see your results.</p>
        <InlineError message={error} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email}
                 aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-err' : undefined}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {fieldErrors.email && <span id="email-err" className="field-error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={form.password}
                 aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-err' : undefined}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {fieldErrors.password && <span id="password-err" className="field-error">{fieldErrors.password}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <LogIn size={16} aria-hidden="true" /> {busy ? 'Logging in...' : 'Log in'}
        </button>
        <p className="muted center">New here? <Link to="/register" state={{ from }}>Create an account</Link></p>
      </form>
    </div>
  );
}
