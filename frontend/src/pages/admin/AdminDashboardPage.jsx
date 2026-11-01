import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { EmptyState, ErrorState, Loading } from '../../components/StateViews';
import { titleCase } from '../../utils/format';

export default function AdminDashboardPage() {
  const { data, error, loading, reload } = useAsync(() => api.adminListQuizzes(), []);
  const { notify } = useToast();
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const togglePublish = async (quiz) => {
    setBusyId(quiz.id);
    try {
      await api.adminSetPublished(quiz.id, !quiz.published);
      notify(quiz.published ? `"${quiz.title}" is now a draft.` : `"${quiz.title}" is published.`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.adminDeleteQuiz(toDelete.id);
      notify(`"${toDelete.title}" was deleted. Past results are kept.`);
      setToDelete(null);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-head page-head-row">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Create quizzes, manage questions and publish them to students.</p>
        </div>
        <Link to="/admin/quizzes/new" className="btn btn-primary"><Plus size={18} aria-hidden="true" /> New quiz</Link>
      </div>

      {loading && <Loading label="Loading quizzes..." />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load quizzes" />}
      {!loading && !error && data.length === 0 && (
        <EmptyState title="No quizzes yet" message="Create your first quiz to get started."
                    action={<Link to="/admin/quizzes/new" className="btn btn-primary">Create quiz</Link>} />
      )}

      {!loading && !error && data.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Quiz</th><th>Subject</th><th>Difficulty</th><th>Questions</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.map((q) => (
                <tr key={q.id}>
                  <td data-label="Quiz"><strong>{q.title}</strong></td>
                  <td data-label="Subject">{q.subject}</td>
                  <td data-label="Difficulty"><span className={`chip chip-${q.difficulty.toLowerCase()}`}>{titleCase(q.difficulty)}</span></td>
                  <td data-label="Questions">{q.questionCount}</td>
                  <td data-label="Duration">{q.durationMinutes} min</td>
                  <td data-label="Status">
                    <span className={`chip ${q.published ? 'chip-easy' : 'chip-draft'}`}>{q.published ? 'Published' : 'Draft'}</span>
                  </td>
                  <td data-label="Actions" className="row-actions">
                    <Link to={`/admin/quizzes/${q.id}/edit`} className="btn btn-secondary btn-sm"><Pencil size={14} aria-hidden="true" /> Edit<span className="sr-only"> {q.title}</span></Link>
                    <Link to={`/admin/quizzes/${q.id}/preview`} className="btn btn-secondary btn-sm"><Eye size={14} aria-hidden="true" /> Preview<span className="sr-only"> {q.title}</span></Link>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => togglePublish(q)} disabled={busyId === q.id}>
                      {q.published ? 'Unpublish' : 'Publish'}<span className="sr-only"> {q.title}</span>
                    </button>
                    <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setToDelete(q)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete<span className="sr-only"> {q.title}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Delete this quiz?" confirmLabel="Delete quiz" danger busy={deleting}
                     onCancel={() => setToDelete(null)} onConfirm={confirmDelete}>
        <p><strong>{toDelete?.title}</strong> will no longer be available to students.</p>
        <p className="muted">Students' previous attempts and results are kept.</p>
      </ConfirmDialog>
    </div>
  );
}
