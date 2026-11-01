import { useEffect, useRef } from 'react';

/** Accessible modal: focus moves into it, Escape cancels, Tab stays inside. */
export default function ConfirmDialog({
  open, title, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, busy = false, danger = false, hideCancel = false,
}) {
  const panelRef = useRef(null);
  // Keep the latest props in a ref so the effect below only re-runs when the dialog opens or closes
  // (otherwise focus would jump back to the first button on every re-render, e.g. each timer tick).
  const latest = useRef({ busy, hideCancel, onCancel });
  latest.current = { busy, hideCancel, onCancel };

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const focusables = () => panelRef.current?.querySelectorAll('button:not([disabled]), [href], input, select, textarea') ?? [];
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !latest.current.busy && !latest.current.hideCancel) latest.current.onCancel?.();
      if (e.key === 'Tab') {
        const items = Array.from(focusables());
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy && !hideCancel) onCancel?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={panelRef}>
        <h2 id="dialog-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          {!hideCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          )}
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
