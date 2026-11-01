import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import QuestionForm from '../../components/QuestionForm';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';

const blankQuiz = { title: '', description: '', subject: '', difficulty: 'EASY', durationMinutes: 10, published: false };

export default function AdminQuizEditorPage() {
  const { quizId } = useParams();
  const isNew = !quizId;
  const navigate = useNavigate();
  const { notify } = useToast();

  const { data, error, loading, reload } = useAsync(
    () => (isNew ? Promise.resolve(null) : api.adminGetQuiz(quizId)), [quizId]);

  const [form, setForm] = useState(blankQuiz);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);          // question being edited, or 'new'
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (data?.quiz) {
      const q = data.quiz;
      setForm({ title: q.title, description: q.description || '', subject: q.subject,
        difficulty: q.difficulty, durationMinutes: q.durationMinutes, published: q.published });
    }
  }, [data]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    const d = Number(form.durationMinutes);
    if (!Number.isInteger(d) || d < 1 || d > 300) errs.durationMinutes = 'Enter 1 to 300 minutes';
    return errs;
  };

  const saveQuiz = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(), description: form.description.trim(), subject: form.subject.trim(),
      difficulty: form.difficulty, durationMinutes: Number(form.durationMinutes),
      ...(isNew ? {} : { published: form.published }),
    };
    try {
      if (isNew) {
        const created = await api.adminCreateQuiz(payload);
        notify('Quiz created. Now add some questions.');
        navigate(`/admin/quizzes/${created.id}/edit`, { replace: true });
      } else {
        await api.adminUpdateQuiz(quizId, payload);
        notify('Quiz saved.');
        reload();
      }
    } catch (err) {
      setServerError(err.message);
      setErrors(err.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async (payload) => {
    if (editing === 'new') await api.adminAddQuestion(quizId, payload);
    else await api.adminUpdateQuestion(editing.id, payload);
    notify(editing === 'new' ? 'Question added.' : 'Question updated.');
    setEditing(null);
    reload();
  };

  const deleteQuestion = async () => {
    setDeleting(true);
    try {
      await api.adminDeleteQuestion(toDelete.id);
      notify('Question deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!isNew && loading && !data) return <div className="container page"><Loading label="Loading quiz..." /></div>;
  if (!isNew && error) {
    return (
      <div className="container page narrow">
        <ErrorState error={error} onRetry={reload} title="Could not load this quiz" />
        <p className="center"><Link to="/admin" className="btn btn-secondary">Back to admin</Link></p>
      </div>
    );
  }

  const questions = data?.questions ?? [];
  const field = (id, label, input, hint) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {input}
      {hint && <span className="muted hint">{hint}</span>}
      {errors[id] && <span className="field-error">{errors[id]}</span>}
    </div>
  );

  return (
    <div className="container page">
      <div className="page-head page-head-row">
        <div>
          <p className="breadcrumb"><Link to="/admin">Admin</Link> / {isNew ? 'New quiz' : 'Edit quiz'}</p>
          <h1>{isNew ? 'Create quiz' : 'Edit quiz'}</h1>
        </div>
        {!isNew && <Link to={`/admin/quizzes/${quizId}/preview`} className="btn btn-secondary"><Eye size={16} aria-hidden="true" /> Preview</Link>}
      </div>

      <form className="card form-card" onSubmit={saveQuiz} noValidate>
        <InlineError message={serverError} />
        {field('title', 'Title *', <input id="title" type="text" value={form.title} maxLength={200}
              aria-invalid={Boolean(errors.title)} onChange={(e) => setForm({ ...form, title: e.target.value })} />)}
        {field('description', 'Description', <textarea id="description" rows={3} value={form.description} maxLength={1000}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />)}
        <div className="form-row">
          {field('subject', 'Subject / category *', <input id="subject" type="text" value={form.subject} maxLength={100}
                aria-invalid={Boolean(errors.subject)} onChange={(e) => setForm({ ...form, subject: e.target.value })} />)}
          {field('difficulty', 'Difficulty *', (
            <select id="difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
            </select>))}
          {field('durationMinutes', 'Duration (minutes) *', <input id="durationMinutes" type="number" min="1" max="300"
                value={form.durationMinutes} aria-invalid={Boolean(errors.durationMinutes)}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />)}
        </div>
        {!isNew && (
          <label className="check">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <span>Published (visible to students)</span>
          </label>
        )}
        {isNew && <p className="muted">New quizzes start as drafts. Add questions, then publish.</p>}
        <div className="actions-row">
          <Link to="/admin" className="btn btn-secondary">Back</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} aria-hidden="true" /> {saving ? 'Saving...' : isNew ? 'Create quiz' : 'Save changes'}
          </button>
        </div>
      </form>

      {!isNew && (
        <section className="section-tight" aria-labelledby="questions-title">
          <div className="section-head">
            <h2 id="questions-title">Questions ({questions.length})</h2>
            {editing === null && (
              <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                <Plus size={16} aria-hidden="true" /> Add question
              </button>
            )}
          </div>

          {editing !== null && (
            <QuestionForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing}
                          onSave={saveQuestion} onCancel={() => setEditing(null)} />
          )}

          {questions.length === 0 && editing === null && (
            <div className="card muted center">No questions yet. Add at least one before publishing.</div>
          )}

          <ol className="admin-questions">
            {questions.map((q, i) => (
              <li key={q.id} className="card admin-question">
                <div className="admin-q-head">
                  <strong>{i + 1}. {q.questionText}</strong>
                  <div className="row-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(q)}>
                      <Pencil size={14} aria-hidden="true" /> Edit<span className="sr-only"> question {i + 1}</span>
                    </button>
                    <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setToDelete(q)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete<span className="sr-only"> question {i + 1}</span>
                    </button>
                  </div>
                </div>
                <ul className="admin-options">
                  {q.options.map((o) => (
                    <li key={o.id} className={o.correct ? 'is-correct' : ''}>{o.text}{o.correct && <span className="review-tags">Correct</span>}</li>
                  ))}
                </ul>
                {q.topic && <p className="muted small">Topic: {q.topic}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Delete this question?" confirmLabel="Delete question" danger
                     busy={deleting} onCancel={() => setToDelete(null)} onConfirm={deleteQuestion}>
        <p>{toDelete?.questionText}</p>
        <p className="muted">Answers already given in earlier attempts are kept.</p>
      </ConfirmDialog>
    </div>
  );
}
