import { useState, useEffect, useRef } from 'react';
import './TablePage.css';
// No image API call needed — officer_image_url comes directly in the officer object

export default function OfficerForm({ isOpen, officer, isEditing, onClose, onSubmit, onSubmitImageOnly }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const selectedImageFileRef = useRef(null);

  const [formData, setFormData] = useState({
    officer_id: '',
    officer_name: '',
    officer_surname: '',
    officer_designation: '',
    officer_dept: '',
    officer_hqrs: '',
    officer_location: '',
    password: '',
    pin: '',
    officer_location_lat: '',
    officer_location_long: '',
  });

  // Cleanup blob URL on unmount or when imagePreview changes
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!isOpen) return;

    if (officer) {
      setFormData({
        officer_id:            officer.officer_id            ?? '',
        officer_name:          officer.officer_name          ?? '',
        officer_surname:       officer.officer_surname        ?? '',
        officer_designation:   officer.officer_designation   ?? '',
        officer_dept:          officer.officer_dept           ?? '',
        officer_hqrs:          officer.officer_hqrs           ?? '',
        officer_location:      officer.officer_location       ?? '',
        password: '',
        pin: '',
        officer_location_lat:  officer.officer_location_lat  ?? '',
        officer_location_long: officer.officer_location_long ?? '',
      });

      // ✅ officer_image_url is already in the officer object from the list API
      // No extra API call needed — just use it directly, show nothing if null
      setImagePreview(officer.officer_image_url || null);
      setImageLoading(false);

    } else {
      setFormData({
        officer_id: '', officer_name: '', officer_surname: '',
        officer_designation: '', officer_dept: '', officer_hqrs: '',
        officer_location: '', password: '', pin: '',
        officer_location_lat: '', officer_location_long: '',
      });
      setImagePreview(null);
      setImageLoading(false);
    }

    selectedImageFileRef.current = null;
    setError(null);
  }, [officer, isOpen]);

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    selectedImageFileRef.current = file;
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const imageFile = selectedImageFileRef.current;

      if (isEditing) {
        const nonImageChanged =
          formData.officer_name          !== (officer?.officer_name          ?? '') ||
          formData.officer_surname       !== (officer?.officer_surname       ?? '') ||
          formData.officer_designation   !== (officer?.officer_designation   ?? '') ||
          formData.officer_dept          !== (officer?.officer_dept          ?? '') ||
          formData.officer_hqrs          !== (officer?.officer_hqrs          ?? '') ||
          formData.officer_location      !== (officer?.officer_location      ?? '') ||
          formData.officer_location_lat  !== (officer?.officer_location_lat  ?? '') ||
          formData.officer_location_long !== (officer?.officer_location_long ?? '') ||
          formData.password !== '' ||
          formData.pin      !== '';

        if (imageFile && !nonImageChanged) {
          const fd = new FormData();
          fd.append('officer_image', imageFile);
          fd.append('officer_id', formData.officer_id);
          await onSubmitImageOnly(formData.officer_id, fd);
          onClose();
          return;
        }

        const fd = new FormData();
        fd.append('officer_name',          formData.officer_name);
        fd.append('officer_surname',       formData.officer_surname);
        fd.append('officer_designation',   formData.officer_designation);
        fd.append('officer_dept',          formData.officer_dept);
        fd.append('officer_hqrs',          formData.officer_hqrs);
        fd.append('officer_location',      formData.officer_location);
        if (imageFile)                     fd.append('officer_image',        imageFile);
        if (formData.password)             fd.append('password',             formData.password);
        if (formData.pin)                  fd.append('pin',                  formData.pin);
        if (formData.officer_location_lat  !== '') fd.append('officer_location_lat',  formData.officer_location_lat);
        if (formData.officer_location_long !== '') fd.append('officer_location_long', formData.officer_location_long);
        await onSubmit(fd);
        onClose();
        return;
      }

      const fd = new FormData();
      fd.append('officer_id',            formData.officer_id);
      fd.append('officer_name',          formData.officer_name);
      fd.append('officer_surname',       formData.officer_surname);
      fd.append('officer_designation',   formData.officer_designation);
      fd.append('officer_dept',          formData.officer_dept);
      fd.append('officer_hqrs',          formData.officer_hqrs);
      fd.append('officer_location',      formData.officer_location);
      if (imageFile)               fd.append('officer_image',        imageFile);
      if (formData.password)       fd.append('password',             formData.password);
      if (formData.pin)            fd.append('pin',                  formData.pin);
      if (formData.officer_location_lat  !== '') fd.append('officer_location_lat',  formData.officer_location_lat);
      if (formData.officer_location_long !== '') fd.append('officer_location_long', formData.officer_location_long);
      await onSubmit(fd);
      onClose();

    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 403) {
        window.dispatchEvent(new CustomEvent('app:forbidden'));
        onClose();
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-hicon modal-hicon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">
                {isEditing ? 'Edit officer profile' : 'Create officer profile'}
              </h2>
              <p className="modal-sub">
                {isEditing ? 'Some fields are locked for editing' : 'Fill in the details to register a new officer'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-body">

            <div className="cf-section">
              <div className="cf-section-label"><span>👤</span> Basic information</div>
              <div className="cf-grid">
                <div className="cf-group">
                  <label>Officer ID {isEditing && <span className="cf-lock-badge">🔒 locked</span>}</label>
                  <input
                    type="text" placeholder="e.g. 3001"
                    value={formData.officer_id}
                    onChange={(e) => !isEditing && set('officer_id', e.target.value)}
                    disabled={isEditing}
                    className={isEditing ? 'cf-locked' : ''}
                    required
                  />
                </div>
                <div className="cf-group">
                  <label>First name</label>
                  <input type="text" placeholder="e.g. Bitabrata" value={formData.officer_name}
                    onChange={(e) => set('officer_name', e.target.value)} required />
                </div>
                <div className="cf-group">
                  <label>Surname</label>
                  <input type="text" placeholder="e.g. Basu" value={formData.officer_surname}
                    onChange={(e) => set('officer_surname', e.target.value)} required />
                </div>
                <div className="cf-group">
                  <label>Designation</label>
                  <input type="text" placeholder="e.g. DIG" value={formData.officer_designation}
                    onChange={(e) => set('officer_designation', e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="cf-section">
              <div className="cf-section-label"><span>🏛️</span> Department &amp; location</div>
              <div className="cf-grid">
                <div className="cf-group">
                  <label>Department</label>
                  <input type="text" placeholder="e.g. Home" value={formData.officer_dept}
                    onChange={(e) => set('officer_dept', e.target.value)} required />
                </div>
                <div className="cf-group">
                  <label>Headquarters</label>
                  <input type="text" placeholder="e.g. Kolkata" value={formData.officer_hqrs}
                    onChange={(e) => set('officer_hqrs', e.target.value)} required />
                </div>
                <div className="cf-group cf-full">
                  <label>Location / zone</label>
                  <input type="text" placeholder="e.g. Eastern Zone" value={formData.officer_location}
                    onChange={(e) => set('officer_location', e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="cf-section">
              <div className="cf-section-label"><span>🖼️</span> Officer photo</div>

              {/* Loading spinner */}
              {imageLoading && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '20px 0', color: '#94a3b8',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: 'of-spin 1s linear infinite', flexShrink: 0 }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span style={{ fontSize: 13 }}>Loading photo…</span>
                </div>
              )}

              {/* ✅ Show image directly from API URL — if null, nothing renders */}
              {!imageLoading && imagePreview && (
                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Officer"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '1px solid #e4e8ef',
                      display: 'block',
                    }}
                    onError={(e) => {
                      // If image fails to load, hide it silently
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Upload area — always shown when not loading */}
              {!imageLoading && (
                <label className="cf-upload-area" htmlFor="of-img-input" style={{ minHeight: 72 }}>
                  {!imagePreview ? (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="cf-upload-icon">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                      </svg>
                      <span className="cf-upload-text">
                        {isEditing
                          ? 'No photo yet — click to upload'
                          : 'Click to upload officer photo'}
                      </span>
                      <span className="cf-upload-hint">JPG, PNG or WEBP — max 5 MB</span>
                    </>
                  ) : (
                    <span className="cf-upload-text" style={{ fontSize: 12, color: '#64748b' }}>
                      📷 Click to change photo
                    </span>
                  )}
                  <input
                    id="of-img-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              <style>{`@keyframes of-spin { to { transform: rotate(360deg); } }`}</style>
            </div>

            <div className="cf-section">
              <div className="cf-section-label"><span>🔐</span> Credentials</div>
              <div className="cf-grid">
                <div className="cf-group">
                  <label>Password {isEditing && <span className="cf-opt-badge">optional</span>}</label>
                  <div className="cf-input-icon-wrap">
                    <input type="password"
                      placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Set a password'}
                      value={formData.password}
                      onChange={(e) => set('password', e.target.value)}
                      required={!isEditing} />
                    <span className="cf-input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="cf-group">
                  <label>PIN {isEditing && <span className="cf-opt-badge">optional</span>}</label>
                  <div className="cf-input-icon-wrap">
                    <input type="password"
                      placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Set a 4–6 digit PIN'}
                      value={formData.pin}
                      onChange={(e) => set('pin', e.target.value)}
                      required={!isEditing} maxLength={6} />
                    <span className="cf-input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cf-section">
              <div className="cf-section-label"><span>📍</span> Site location</div>
              <div className="cf-grid">
                <div className="cf-group">
                  <label>Location latitude</label>
                  <input type="text" placeholder="e.g. 56.5687" value={formData.officer_location_lat}
                    onChange={(e) => set('officer_location_lat', e.target.value)} />
                </div>
                <div className="cf-group">
                  <label>Location longitude</label>
                  <input type="text" placeholder="e.g. 98.6789" value={formData.officer_location_long}
                    onChange={(e) => set('officer_location_long', e.target.value)} />
                </div>
              </div>
            </div>

          </div>

          <div className="cf-actions">
            <button type="button" className="cf-btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="cf-btn-submit cf-btn-blue" disabled={submitting || imageLoading}>
              {submitting
                ? (isEditing ? 'Saving…' : 'Creating…')
                : (isEditing ? '✓  Update officer' : '✓  Create officer')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}