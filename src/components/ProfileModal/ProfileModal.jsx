import { useEffect, useState } from 'react';
import './ProfileModal.css';
import { getOfficerImageApi } from '../../api/authApi';

/**
 * ProfileModal
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onLogout  – () => void
 *   profile   – officer data object | null
 *   loading   – boolean
 *   error     – string | null
 */
export default function ProfileModal({ isOpen, onClose, onLogout, profile, loading, error }) {
  const [avatarSrc, setAvatarSrc]         = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarFailed, setAvatarFailed]   = useState(false);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Fetch image URL whenever the modal opens with a profile
  useEffect(() => {
    if (!isOpen || !profile?.officer_id) {
      setAvatarSrc(null);
      setAvatarFailed(false);
      setAvatarLoading(false);
      return;
    }

    setAvatarSrc(null);
    setAvatarFailed(false);
    setAvatarLoading(true);

    getOfficerImageApi(profile.officer_id)
      .then((imageUrl) => {
        if (!imageUrl) throw new Error('No image URL returned');
        console.log('[ProfileModal] Image URL:', imageUrl);
        setAvatarSrc(imageUrl);
      })
      .catch((err) => {
        console.warn('[ProfileModal] Failed to get officer image URL:', err.message);
        setAvatarSrc(null);
        setAvatarFailed(true);
      })
      .finally(() => {
        setAvatarLoading(false);
      });
  }, [isOpen, profile?.officer_id]);

  if (!isOpen) return null;

  const fullName = profile
    ? [profile.officer_name, profile.officer_surname].filter(Boolean).join(' ')
    : '';
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'O';

  return (
    <div className="pm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Officer Profile">
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <svg className="pm-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Officer profile</span>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="pm-body">

          {/* Loading (profile data) */}
          {loading && (
            <div className="pm-state">
              <div className="pm-spinner" />
              <p>Loading profile…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="pm-state pm-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {/* Profile */}
          {profile && !loading && !error && (
            <>
              {/* Identity block */}
              <div className="pm-identity">

                {/* Avatar: spinner while loading, image when ready, initials as fallback */}
                {avatarLoading ? (
                  <div className="pm-avatar pm-avatar-initials" style={{ position: 'relative' }}>
                    <svg
                      width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ animation: 'pm-spin 1s linear infinite' }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </div>
                ) : avatarSrc && !avatarFailed ? (
                  <img
                    className="pm-avatar"
                    src={avatarSrc}
                    alt={fullName || 'Officer'}
                    onLoad={() => console.log('[ProfileModal] Image rendered successfully')}
                    onError={() => {
                      console.warn('[ProfileModal] Image failed to render:', avatarSrc);
                      setAvatarFailed(true);
                    }}
                  />
                ) : (
                  <div className="pm-avatar pm-avatar-initials">
                    {initials}
                  </div>
                )}

                <div className="pm-identity-info">
                  <p className="pm-full-name">{fullName || '—'}</p>

                  {/* Designation + Officer ID share one row */}
                  <div className="pm-meta-row">
                    {profile.officer_designation && (
                      <span className="pm-badge">{profile.officer_designation}</span>
                    )}
                    {(profile.officer_id || profile.officer_id === 0) && (
                      <span className="pm-id-chip">
                        <svg className="pm-id-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="12" y1="10" x2="16" y2="10" />
                          <line x1="12" y1="14" x2="16" y2="14" />
                        </svg>
                        {profile.officer_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail rows (Officer ID now lives in the identity row above) */}
              <div className="pm-details">
                <DetailRow icon="building" label="Department"   value={profile.officer_dept} />
                <DetailRow icon="hq"       label="Headquarters" value={profile.officer_hqrs} />
                <DetailRow icon="location" label="Location"     value={profile.officer_location} />
                <DetailRow icon="geo"      label="Latitude"     value={profile.officer_location_lat} />
                <DetailRow icon="geo"      label="Longitude"    value={profile.officer_location_long} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button className="pm-logout-btn" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        <style>{`@keyframes pm-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ─── Icon map for detail rows ─────────────────────────────────────────────── */
const ICONS = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="22" x2="9" y2="12" /><line x1="15" y1="22" x2="15" y2="12" /><rect x="9" y="12" width="6" height="10" /><line x1="9" y1="7" x2="9.01" y2="7" /><line x1="15" y1="7" x2="15.01" y2="7" />
    </svg>
  ),
  hq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 9 12 2 21 9 21 20 3 20" /><rect x="9" y="14" width="6" height="6" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  geo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

function DetailRow({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="pm-row">
      <div className="pm-row-icon">{ICONS[icon]}</div>
      <div className="pm-row-content">
        <span className="pm-row-label">{label}</span>
        <span className="pm-row-value">{value}</span>
      </div>
    </div>
  );
}