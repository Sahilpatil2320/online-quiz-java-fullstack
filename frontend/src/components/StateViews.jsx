import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <Loader2 className="spin" size={32} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const message = error?.message || 'Please try again.';
  return (
    <div className="state-view state-error" role="alert">
      <AlertTriangle size={32} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state-view">
      <Inbox size={32} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function InlineError({ message }) {
  if (!message) return null;
  return <div className="alert alert-error" role="alert">{message}</div>;
}
