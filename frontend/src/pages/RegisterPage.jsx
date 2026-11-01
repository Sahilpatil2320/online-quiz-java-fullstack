import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InlineError } from '../components/StateViews';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
      setBusy(false);
    }
  };

  const field = (id, label, type, autoComplete) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} value={form[id]}
             aria-invalid={Boolean(fieldErrors[id])} aria-describedby={fieldErrors[id] ? `${id}-err` : undefined}
             onChange={(e) => setForm({ ...form, [id]: e.target.value })} />
      {fieldErrors[id] && <span id={`${id}-err`} className="field-error">{fieldErrors[id]}</span>}
    </div>
  );

  return (
    <div className="container page auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Register as a student to start taking quizzes.</p>
        <InlineError message={error} />
        {field('name', 'Full name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Password (8+ characters)', 'password', 'new-password')}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <UserPlus size={16} aria-hidden="true" /> {busy ? 'Creating account...' : 'Register'}
        </button>
        <p className="muted center">Already registered? <Link to="/login" state={{ from }}>Log in</Link></p>
      </form>
    </div>
  );
}
