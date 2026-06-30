import { useState, useEffect, useRef } from 'react';
import './TablePage.css';
import { getStatesApi, getDistrictsByStateApi } from '../api/authApi';

const HARDCODED_SITE_LAT = '28.6139';
const HARDCODED_SITE_LONG = '77.2090';

export default function CriminalForm({ isOpen, criminal, isEditing, onClose, onSubmit, onSubmitImageOnly }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);
  const selectedImageFileRef = useRef(null);

  // States & Districts
  const [states, setStates]                     = useState([]);
  const [statesLoading, setStatesLoading]       = useState(false);
  const [districts, setDistricts]               = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // Image vector / embedding fields
  const [imageVectorText, setImageVectorText]   = useState('');
  const [imageVectorFile, setImageVectorFile]   = useState(null);
  const [generateVector, setGenerateVector]     = useState('');
  const [vectorInputMode, setVectorInputMode]   = useState(null); // null | 'text' | 'file'
  const [showVectorDetails, setShowVectorDetails] = useState(false);

  const [formData, setFormData] = useState({
    criminal_id:       '',
    criminal_name:     '',
    alert_status:      false,
    reason_for_alert:  '',
    set_by_officer_id: '',
    state_code:        '',
    state_name:        '',
    district_code:     '',
    district_name:     '',
  });

  // ── Fetch all states when modal opens ──
  useEffect(() => {
    if (!isOpen) return;
    setStatesLoading(true);
    getStatesApi()
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('[CriminalForm] Failed to load states:', err.message))
      .finally(() => setStatesLoading(false));
  }, [isOpen]);

  // ── Fetch districts whenever state_code changes ──
  useEffect(() => {
    if (!formData.state_code) {
      setDistricts([]);
      return;
    }
    setDistrictsLoading(true);
    getDistrictsByStateApi(formData.state_code)
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn('[CriminalForm] Failed to load districts:', err.message);
        setDistricts([]);
      })
      .finally(() => setDistrictsLoading(false));
  }, [formData.state_code]);

  // ── Populate form when modal opens ──
  useEffect(() => {
    if (!isOpen) return;

    if (criminal) {
      setFormData({
        criminal_id:       criminal.criminal_id       || '',
        criminal_name:     criminal.criminal_name     || '',
        alert_status:      criminal.alert_status      || false,
        reason_for_alert:  criminal.reason_for_alert  || '',
        set_by_officer_id: criminal.set_by_officer_id || '',
        state_code:        criminal.state_code        || '',
        state_name:        criminal.state_name        || '',
        district_code:     criminal.district_code     || '',
        district_name:     criminal.district_name     || '',
      });

      setImgLoadFailed(false);

      const rawUrl =
        criminal.criminal_image_url ||
        criminal.profile_image_url  ||
        criminal.criminal_image     ||
        null;

      console.log('[CriminalForm] Image URL from API:', rawUrl);
      setImagePreview(rawUrl);

    } else {
      setFormData({
        criminal_id:       '',
        criminal_name:     '',
        alert_status:      false,
        reason_for_alert:  '',
        set_by_officer_id: '',
        state_code:        '',
        state_name:        '',
        district_code:     '',
        district_name:     '',
      });
      setImagePreview(null);
      setImgLoadFailed(false);
      setDistricts([]);
    }

    selectedImageFileRef.current = null;
    setImageVectorText('');
    setImageVectorFile(null);
    setGenerateVector('');
    setVectorInputMode(null);
    setShowVectorDetails(false);
    setError(null);
  }, [criminal, isOpen]);

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  // ── State dropdown change ──
  const handleStateChange = (e) => {
    const selectedCode = e.target.value;
    const selectedState = states.find((s) => s.state_code === selectedCode);
    setFormData((prev) => ({
      ...prev,
      state_code:    selectedCode,
      state_name:    selectedState?.state_name || '',
      district_code: '',
      district_name: '',
    }));
  };

  // ── District dropdown change ──
  const handleDistrictChange = (e) => {
    const selectedCode = e.target.value;
    const selectedDistrict = districts.find((d) => d.district_code === selectedCode);
    setFormData((prev) => ({
      ...prev,
      district_code: selectedCode,
      district_name: selectedDistrict?.district_name || '',
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    selectedImageFileRef.current = file;
    setImgLoadFailed(false);
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageVectorTextChange = (e) => {
    const value = e.target.value;
    setImageVectorText(value);
    if (value.trim()) {
      setVectorInputMode('text');
    } else if (vectorInputMode === 'text') {
      setVectorInputMode(null);
    }
  };

  const handleImageVectorFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageVectorFile(file);
    if (file) {
      setVectorInputMode('file');
    } else if (vectorInputMode === 'file') {
      setVectorInputMode(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const imageFile = selectedImageFileRef.current;
      const imageChanged = !!imageFile;

      if (isEditing && imageChanged) {
        const nonImageChanged =
          formData.criminal_name     !== (criminal?.criminal_name     || '') ||
          formData.alert_status      !== (criminal?.alert_status      || false) ||
          formData.reason_for_alert  !== (criminal?.reason_for_alert  || '') ||
          formData.set_by_officer_id !== (criminal?.set_by_officer_id || '') ||
          formData.state_code        !== (criminal?.state_code        || '') ||
          formData.state_name        !== (criminal?.state_name        || '') ||
          formData.district_code     !== (criminal?.district_code     || '') ||
          formData.district_name     !== (criminal?.district_name     || '');

        if (!nonImageChanged) {
          const fd = new FormData();
          fd.append('criminal_image', imageFile);
          fd.append('officer_id', formData.set_by_officer_id);
          await onSubmitImageOnly(formData.criminal_id, fd);
          onClose();
          return;
        }
      }

      const fd = new FormData();
      fd.append('criminal_id',       formData.criminal_id);
      fd.append('criminal_name',     formData.criminal_name);
      fd.append('alert_status',      String(formData.alert_status));
      fd.append('reason_for_alert',  formData.reason_for_alert);
      if (imageFile) fd.append('criminal_image', imageFile);
      fd.append('set_by_officer_id', formData.set_by_officer_id);
      fd.append('site_lat',          HARDCODED_SITE_LAT);
      fd.append('site_long',         HARDCODED_SITE_LONG);

      if (vectorInputMode === 'text' && imageVectorText.trim()) {
        fd.append('image_vector', imageVectorText.trim());
      } else if (vectorInputMode === 'file' && imageVectorFile) {
        fd.append('image_vector_file', imageVectorFile);
      }
      if (generateVector) fd.append('generate_vector', generateVector);

      if (formData.state_code)    fd.append('state_code',    formData.state_code);
      if (formData.state_name)    fd.append('state_name',    formData.state_name);
      if (formData.district_code) fd.append('district_code', formData.district_code);
      if (formData.district_name) fd.append('district_name', formData.district_name);

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

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-hicon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">
                {isEditing ? 'Edit criminal profile' : 'Create criminal profile'}
              </h2>
              <p className="modal-sub">
                {isEditing ? 'Some fields are locked for editing' : 'Fill in the details to register a new profile'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-body">

            {/* Basic Info */}
            <div className="cf-section">
              <div className="cf-section-label">
                <span>👤</span> Basic information
              </div>
              <div className="cf-grid">
                <div className="cf-group">
                  <label>
                    Criminal ID
                    {isEditing && <span className="cf-lock-badge">🔒 locked</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1001"
                    value={formData.criminal_id}
                    onChange={(e) => !isEditing && set('criminal_id', e.target.value)}
                    disabled={isEditing}
                    className={isEditing ? 'cf-locked' : ''}
                    required
                  />
                </div>

                <div className="cf-group">
                  <label>Criminal name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.criminal_name}
                    onChange={(e) => set('criminal_name', e.target.value)}
                    required
                  />
                </div>

                <div className="cf-group">
                  <label>Alert status</label>
                  <div className="cf-status-row">
                    <button
                      type="button"
                      className={`cf-status-btn ${formData.alert_status ? 'cf-status-active' : ''}`}
                      onClick={() => set('alert_status', true)}
                    >
                      <span className="cf-dot cf-dot-red" /> Active
                    </button>
                    <button
                      type="button"
                      className={`cf-status-btn ${!formData.alert_status ? 'cf-status-sel' : ''}`}
                      onClick={() => set('alert_status', false)}
                    >
                      <span className="cf-dot cf-dot-gray" /> Inactive
                    </button>
                  </div>
                </div>

                <div className="cf-group cf-full">
                  <label>Reason for alert</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the reason for this alert..."
                    value={formData.reason_for_alert}
                    onChange={(e) => set('reason_for_alert', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* State & District */}
            <div className="cf-section">
              <div className="cf-section-label">
                <span>📍</span> Location details
              </div>
              <div className="cf-grid">

                <div className="cf-group">
                  <label>State</label>
                  <select
                    value={formData.state_code}
                    onChange={handleStateChange}
                    className="cf-select"
                    disabled={statesLoading}
                  >
                    <option value="">
                      {statesLoading ? 'Loading states…' : 'Select state…'}
                    </option>
                    {states.map((s) => (
                      <option key={s.state_code} value={s.state_code}>
                        {s.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cf-group">
                  <label>District</label>
                  <select
                    value={formData.district_code}
                    onChange={handleDistrictChange}
                    className="cf-select"
                    disabled={!formData.state_code || districtsLoading}
                  >
                    <option value="">
                      {!formData.state_code
                        ? 'Select state first…'
                        : districtsLoading
                          ? 'Loading districts…'
                          : 'Select district…'}
                    </option>
                    {districts.map((d) => (
                      <option key={d.district_code} value={d.district_code}>
                        {d.district_name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Identification / Image */}
            <div className="cf-section">
              <div className="cf-section-label">
                <span>🖼️</span> Identification
              </div>

              {imagePreview && !imgLoadFailed && (
                <div style={{ marginBottom: 10 }}>
                  <img
                    src={imagePreview}
                    alt="Criminal"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '1px solid #e4e8ef',
                      display: 'block',
                    }}
                    onLoad={() => console.log('[CriminalForm] Image rendered OK:', imagePreview)}
                    onError={() => {
                      console.warn('[CriminalForm] Image failed to load:', imagePreview);
                      setImgLoadFailed(true);
                    }}
                  />
                </div>
              )}

              <label className="cf-upload-area" htmlFor="cf-img-input">
                {(!imagePreview || imgLoadFailed) ? (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="cf-upload-icon">
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                    </svg>
                    <span className="cf-upload-text">
                      {imgLoadFailed
                        ? 'Photo unavailable — click to upload new'
                        : isEditing
                          ? 'No photo yet — click to upload'
                          : 'Click to upload criminal image'}
                    </span>
                    <span className="cf-upload-hint">JPG, PNG or WEBP — max 5 MB</span>
                  </>
                ) : (
                  <span className="cf-upload-text" style={{ fontSize: 12, color: '#64748b' }}>
                    📷 Click to change photo
                  </span>
                )}
                <input
                  id="cf-img-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>

              {/* ── Toggle for image vector / embedding ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                }}
                onClick={() => setShowVectorDetails((prev) => !prev)}
              >
                <input
                  type="checkbox"
                  checked={showVectorDetails}
                  readOnly
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: '#A32D2D',
                    cursor: 'pointer',
                    flexShrink: 0,
                    pointerEvents: 'none',
                  }}
                />
                Add image vector / embedding details
              </div>

              <style>{`
                @keyframes cf-expand {
                  from { opacity: 0; transform: translateY(-6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>

            {/* Image vector / embedding (conditionally shown) */}
            {showVectorDetails && (
              <div className="cf-section" style={{ animation: 'cf-expand 0.2s ease' }}>
                <div className="cf-section-label">
                  <span>🧬</span> Image vector <span className="cf-opt-badge">optional</span>
                </div>
                <p className="cf-upload-hint" style={{ marginBottom: 8 }}>
                  Provide the vector as text <strong>or</strong> upload a vector file — only one is used at a time.
                </p>
                <div className="cf-grid">

                  <div className="cf-group cf-full">
                    <label>
                      Image vector
                      {vectorInputMode === 'file' && (
                        <span className="cf-lock-badge">🔒 disabled — file selected</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. [0.123, -0.456, 0.789, ...]"
                      value={imageVectorText}
                      onChange={handleImageVectorTextChange}
                      disabled={vectorInputMode === 'file'}
                      className={vectorInputMode === 'file' ? 'cf-locked' : ''}
                    />
                  </div>

                  <div className="cf-group">
                    <label>
                      Image vector file (.json)
                      {vectorInputMode === 'text' && (
                        <span className="cf-lock-badge">🔒 disabled — text entered</span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImageVectorFileChange}
                      disabled={vectorInputMode === 'text'}
                      className={vectorInputMode === 'text' ? 'cf-locked' : ''}
                    />
                    {imageVectorFile && (
                      <span className="cf-upload-hint">📄 {imageVectorFile.name}</span>
                    )}
                  </div>

                  <div className="cf-group">
                    <label>Generate vector</label>
                    <select
                      value={generateVector}
                      onChange={(e) => setGenerateVector(e.target.value)}
                      className="cf-select"
                    >
                      <option value="">Select…</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Actions */}
          <div className="cf-actions">
            <button type="button" className="cf-btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="cf-btn-submit" disabled={submitting}>
              {submitting
                ? (isEditing ? 'Saving…' : 'Creating…')
                : (isEditing ? '✓  Update profile' : '✓  Create profile')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}