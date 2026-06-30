/* ConfirmDialog.jsx — reusable "Are you sure?" modal */
import './ConfirmDialog.css';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="cd-overlay">
      <div className="cd-card">
        <div className="cd-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 className="cd-title">{title || 'Are you sure?'}</h3>
        <p className="cd-message">{message || 'This action cannot be undone.'}</p>
        <div className="cd-actions">
          <button className="cd-btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="cd-btn-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}