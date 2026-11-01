import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './StateViews';

/** UI guard only. The real protection is on the server; this just avoids showing pages that would fail. */
export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && !isAdmin) {
    return (
      <div className="container page">
        <div className="state-view state-error" role="alert">
          <h3>Administrator access required</h3>
          <p>Your account does not have permission to open this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
