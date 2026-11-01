import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { InlineError } from './StateViews';

const emptyOptions = () => [0, 1, 2, 3].map(() => ({ text: '', correct: false }));

/** Add / edit one question: question text, exactly four options, exactly one correct, optional explanation. */
export default function QuestionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    questionText: initial?.questionText || '',
    topic: initial?.topic || '',
    explanation: initial?.explanation || '',
    options: initial ? initial.options.map((o) => ({ text: o.text, correct: o.correct })) : emptyOptions(),
  }));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const setOption = (i, patch) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  const markCorrect = (i) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => ({ ...o, correct: idx === i })) }));

  const validate = () => {
    const errs = {};
    if (!form.questionText.trim()) errs.questionText = 'Question text is required';
    form.options.forEach((o, i) => { if (!o.text.trim()) errs[`option${i}`] = 'Option text is required'; });
    if (form.options.filter((o) => o.correct).length !== 1) errs.correct = 'Select exactly one correct option';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSave({
        questionText: form.questionText.trim(),
        topic: form.topic.trim(),
        explanation: form.explanation.trim(),
        options: form.options.map((o) => ({ text: o.text.trim(), correct: o.correct })),
      });
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="card question-form" onSubmit={submit} noValidate aria-label={initial ? 'Edit question' : 'Add question'}>
      <h3>{initial ? 'Edit question' : 'Add a question'}</h3>
      <InlineError message={serverError} />

      <div className="field">
        <label htmlFor="qf-text">Question *</label>
        <textarea id="qf-text" rows={3} value={form.questionText} aria-invalid={Boolean(errors.questionText)}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
        {errors.questionText && <span className="field-error">{errors.questionText}</span>}
      </div>

      <fieldset className="option-editor">
        <legend>Answer options * <span className="muted">(select the correct one)</span></legend>
        {form.options.map((o, i) => (
          <div className="option-edit-row" key={i}>
            <input type="radio" name="correct-option" checked={o.correct} onChange={() => markCorrect(i)}
                   aria-label={`Option ${i + 1} is the correct answer`} />
            <div className="field grow">
              <input type="text" value={o.text} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1} text`}
                     aria-invalid={Boolean(errors[`option${i}`])}
                     onChange={(e) => setOption(i, { text: e.target.value })} />
              {errors[`option${i}`] && <span className="field-error">{errors[`option${i}`]}</span>}
            </div>
          </div>
        ))}
        {errors.correct && <span className="field-error">{errors.correct}</span>}
      </fieldset>

      <div className="form-row">
        <div className="field">
          <label htmlFor="qf-topic">Topic (used for topic-wise results)</label>
          <input id="qf-topic" type="text" value={form.topic} maxLength={100}
                 onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="qf-expl">Explanation (shown after submission)</label>
        <textarea id="qf-expl" rows={2} value={form.explanation} maxLength={1000}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
      </div>

      <div className="actions-row">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          <X size={16} aria-hidden="true" /> Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Save size={16} aria-hidden="true" /> {busy ? 'Saving...' : 'Save question'}
        </button>
      </div>
    </form>
  );
}
