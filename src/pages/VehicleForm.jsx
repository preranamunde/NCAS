import { useState, useEffect, useRef } from 'react';
import './TablePage.css';
import { getStatesApi, getDistrictsByStateApi } from '../api/authApi';

const VEHICLE_TYPES = ['Car', 'Truck', 'Motorcycle', 'Bus', 'Van', 'SUV', 'Other'];

export default function VehicleForm({
  isOpen,
  vehicle,
  isEditing,
  onClose,
  onSubmit,
  onSubmitImageOnly,
}) {
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [imageChanged, setImageChanged]   = useState(false);
  const selectedImageFileRef              = useRef(null);

  const [states, setStates]                     = useState([]);
  const [statesLoading, setStatesLoading]       = useState(false);
  const [districts, setDistricts]               = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  const [embeddingText, setEmbeddingText]         = useState('');
  const [embeddingFile, setEmbeddingFile]         = useState(null);
  const [generateVector, setGenerateVector]       = useState('');
  const [vectorInputMode, setVectorInputMode]     = useState(null);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_number:   '',
    vehicle_make:     '',
    vehicle_model:    '',
    vehicle_type:     '',
    alert_status:     '',
    reason_for_alert: '',
    site_lat:         '',
    site_long:        '',
    state_code:       '',
    state_name:       '',
    district_code:    '',
    district_name:    '',
  });

  // Cleanup blob URL only
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Fetch states on open
  useEffect(() => {
    if (!isOpen) return;
    setStatesLoading(true);
    getStatesApi()
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('[VehicleForm] Failed to load states:', err.message))
      .finally(() => setStatesLoading(false));
  }, [isOpen]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!formData.state_code) { setDistricts([]); return; }
    setDistrictsLoading(true);
    getDistrictsByStateApi(formData.state_code)
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn('[VehicleForm] Failed to load districts:', err.message);
        setDistricts([]);
      })
      .finally(() => setDistrictsLoading(false));
  }, [formData.state_code]);

  // Reset state on open / vehicle change
  useEffect(() => {
    if (!isOpen) return;

    if (vehicle) {
      setFormData({
        vehicle_number:   vehicle.vehicle_number   || '',
        vehicle_make:     vehicle.vehicle_make      || '',
        vehicle_model:    vehicle.vehicle_model     || '',
        vehicle_type:     vehicle.vehicle_type      || '',
        alert_status:     vehicle.alert_status != null
                            ? String(vehicle.alert_status)
                            : '',
        reason_for_alert: vehicle.reason_for_alert  || '',
        site_lat:         vehicle.site_lat  != null ? String(vehicle.site_lat)  : '',
        site_long:        vehicle.site_long != null ? String(vehicle.site_long) : '',
        state_code:       vehicle.state_code   || '',
        state_name:       vehicle.state_name   || '',
        district_code:    vehicle.district_code || '',
        district_name:    vehicle.district_name || '',
      });

      setImagePreview(vehicle.vehicle_image_url || null);

    } else {
      setFormData({
        vehicle_number:   '',
        vehicle_make:     '',
        vehicle_model:    '',
        vehicle_type:     '',
        alert_status:     '',
        reason_for_alert: '',
        site_lat:         '',
        site_long:        '',
        state_code:       '',
        state_name:       '',
        district_code:    '',
        district_name:    '',
      });
      setImagePreview(null);
      setDistricts([]);
    }

    selectedImageFileRef.current = null;
    setImageChanged(false);
    setEmbeddingText('');
    setEmbeddingFile(null);
    setGenerateVector('');
    setVectorInputMode(null);
    setShowAdditionalDetails(false);
    setError(null);
  }, [vehicle, isOpen]);

  const set = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleStateChange = (e) => {
    const selectedCode  = e.target.value;
    const selectedState = states.find((s) => s.state_code === selectedCode);
    setFormData((prev) => ({
      ...prev,
      state_code:    selectedCode,
      state_name:    selectedState?.state_name || '',
      district_code: '',
      district_name: '',
    }));
  };

  const handleDistrictChange = (e) => {
    const selectedCode     = e.target.value;
    const selectedDistrict = districts.find((d) => d.district_code === selectedCode);
    setFormData((prev) => ({
      ...prev,
      district_code: selectedCode,
      district_name: selectedDistrict?.district_name || '',
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    selectedImageFileRef.current = file;
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setImageChanged(true);
  };

  const handleRevert = (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectedImageFileRef.current = null;
    setImageChanged(false);
    setImagePreview(vehicle?.vehicle_image_url || null);
  };

  const handleEmbeddingTextChange = (e) => {
    const value = e.target.value;
    setEmbeddingText(value);
    if (value.trim()) {
      setVectorInputMode('text');
    } else if (vectorInputMode === 'text') {
      setVectorInputMode(null);
    }
  };

  const handleEmbeddingFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEmbeddingFile(file);
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

      // ── Image-only update path ──────────────────────────────────────────
      if (isEditing && imageChanged && imageFile) {
        const nonImageChanged =
          formData.vehicle_make      !== (vehicle?.vehicle_make      || '') ||
          formData.vehicle_model     !== (vehicle?.vehicle_model     || '') ||
          formData.vehicle_type      !== (vehicle?.vehicle_type      || '') ||
          formData.alert_status      !== (vehicle?.alert_status != null ? String(vehicle.alert_status) : '') ||
          formData.reason_for_alert  !== (vehicle?.reason_for_alert  || '') ||
          formData.site_lat          !== (vehicle?.site_lat  != null ? String(vehicle.site_lat)  : '') ||
          formData.site_long         !== (vehicle?.site_long != null ? String(vehicle.site_long) : '') ||
          formData.state_code        !== (vehicle?.state_code        || '') ||
          formData.district_code     !== (vehicle?.district_code     || '');

        if (!nonImageChanged) {
          const fd = new FormData();
          fd.append('vehicle_image', imageFile);
          await onSubmitImageOnly(formData.vehicle_number, fd);
          onClose();
          return;
        }
      }

      // ── Full create or full update ──────────────────────────────────────
      const fd = new FormData();

      if (!isEditing) fd.append('vehicle_number', formData.vehicle_number);

      fd.append('vehicle_make',  formData.vehicle_make);
      fd.append('vehicle_model', formData.vehicle_model);
      fd.append('vehicle_type',  formData.vehicle_type);

      if (formData.alert_status !== '')
        fd.append('alert_status', formData.alert_status);

      if (formData.reason_for_alert.trim())
        fd.append('reason_for_alert', formData.reason_for_alert.trim());

      if (formData.site_lat.trim())  fd.append('site_lat',  formData.site_lat.trim());
      if (formData.site_long.trim()) fd.append('site_long', formData.site_long.trim());

      if (formData.state_code)    fd.append('state_code',    formData.state_code);
      if (formData.state_name)    fd.append('state_name',    formData.state_name);
      if (formData.district_code) fd.append('district_code', formData.district_code);
      if (formData.district_name) fd.append('district_name', formData.district_name);

      if (imageFile) fd.append('vehicle_image', imageFile);

      if (vectorInputMode === 'text' && embeddingText.trim()) {
        fd.append('embedding', embeddingText.trim());
      } else if (vectorInputMode === 'file' && embeddingFile) {
        fd.append('embedding_file', embeddingFile);
      }
      if (generateVector) fd.append('generate_vector', generateVector);

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
            <div className="modal-hicon modal-hicon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v3h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">
                {isEditing ? 'Edit vehicle record' : 'Add vehicle record'}
              </h2>
              <p className="modal-sub">
                {isEditing
                  ? 'Vehicle number is locked for editing'
                  : 'Fill in the details to register a new vehicle'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-body">

            {/* ── Vehicle Info ──────────────────────────────────────────── */}
            <div className="cf-section">
              <div className="cf-section-label"><span>🚗</span> Vehicle information</div>
              <div className="cf-grid">

                <div className="cf-group">
                  <label>
                    Vehicle number
                    {isEditing && <span className="cf-lock-badge">🔒 locked</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH11AA1112"
                    value={formData.vehicle_number}
                    onChange={(e) =>
                      !isEditing && set('vehicle_number', e.target.value.toUpperCase())
                    }
                    disabled={isEditing}
                    className={isEditing ? 'cf-locked' : ''}
                    required
                  />
                </div>

                <div className="cf-group">
                  <label>Vehicle make</label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota"
                    value={formData.vehicle_make}
                    onChange={(e) => set('vehicle_make', e.target.value)}
                    required
                  />
                </div>

                <div className="cf-group">
                  <label>Vehicle model</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda Civic"
                    value={formData.vehicle_model}
                    onChange={(e) => set('vehicle_model', e.target.value)}
                    required
                  />
                </div>

                <div className="cf-group">
                  <label>Vehicle type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => set('vehicle_type', e.target.value)}
                    required
                    className="cf-select"
                  >
                    <option value="" disabled>Select type…</option>
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* ── Alert Status ──────────────────────────────────────────── */}
            <div className="cf-section">
              <div className="cf-section-label"><span>🚨</span> Alert information</div>
              <div className="cf-grid">

                <div className="cf-group">
                  <label>Alert status</label>
                  <select
                    value={formData.alert_status}
                    onChange={(e) => set('alert_status', e.target.value)}
                    className="cf-select"
                  >
                    <option value="">Select…</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="cf-group cf-full">
                  <label>Reason for alert</label>
                  <input
                    type="text"
                    placeholder="e.g. Absconder, Stolen vehicle"
                    value={formData.reason_for_alert}
                    onChange={(e) => set('reason_for_alert', e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* ── Location / Site coords ────────────────────────────────── */}
            <div className="cf-section">
              <div className="cf-section-label"><span>📍</span> Location details</div>
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

                <div className="cf-group">
                  <label>Site latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 28.6139"
                    value={formData.site_lat}
                    onChange={(e) => set('site_lat', e.target.value)}
                  />
                </div>

                <div className="cf-group">
                  <label>Site longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 77.2090"
                    value={formData.site_long}
                    onChange={(e) => set('site_long', e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* ── Vehicle Image ─────────────────────────────────────────── */}
            <div className="cf-section">
              <div className="cf-section-label">
                <span>🖼️</span> Vehicle image
                {isEditing && imageChanged && (
                  <span className="cf-new-img-badge">new image selected</span>
                )}
              </div>

              {imagePreview && (
                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Vehicle"
                    style={{
                      width: '100%', maxHeight: 200, objectFit: 'cover',
                      borderRadius: 10, border: '1px solid #e4e8ef', display: 'block',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <label className="cf-upload-area" htmlFor="vf-img-input" style={{ minHeight: 72 }}>
                {!imagePreview ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      strokeLinejoin="round" className="cf-upload-icon">
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                    </svg>
                    <span className="cf-upload-text">
                      {isEditing
                        ? 'No photo yet — click to upload'
                        : 'Click to upload vehicle image'}
                    </span>
                    <span className="cf-upload-hint">JPG, PNG or WEBP — max 5 MB</span>
                  </>
                ) : (
                  <span className="cf-upload-text" style={{ fontSize: 12, color: '#64748b' }}>
                    📷 Click to change photo
                  </span>
                )}
                <input
                  id="vf-img-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>

              {imageChanged && (
                <button
                  type="button"
                  className="cf-img-remove-btn"
                  onClick={handleRevert}
                  style={{ marginTop: 6 }}
                >
                  ↩ Revert to original
                </button>
              )}

              {/* ── Toggle for vehicle vector / embedding ── */}
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
                onClick={() => setShowAdditionalDetails((prev) => !prev)}
              >
                <input
                  type="checkbox"
                  checked={showAdditionalDetails}
                  readOnly
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: '#003366',
                    cursor: 'pointer',
                    flexShrink: 0,
                    pointerEvents: 'none',
                  }}
                />
                Add vehicle vector / embedding details
              </div>

              <style>{`
                @keyframes of-spin { to { transform: rotate(360deg); } }
                @keyframes cf-expand {
                  from { opacity: 0; transform: translateY(-6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>

            {/* ── Vehicle vector / embedding (conditionally shown) ──────── */}
            {showAdditionalDetails && (
              <div className="cf-section" style={{ animation: 'cf-expand 0.2s ease' }}>
                <div className="cf-section-label"><span>🧬</span> Vehicle vector (optional)</div>
                <p className="cf-upload-hint" style={{ marginBottom: 8 }}>
                  Provide the embedding as text <strong>or</strong> upload an embedding file —
                  only one is used at a time.
                </p>
                <div className="cf-grid">

                  <div className="cf-group cf-full">
                    <label>
                      Embedding
                      {vectorInputMode === 'file' && (
                        <span className="cf-lock-badge">🔒 disabled — file selected</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. [0.123, -0.456, 0.789, ...]"
                      value={embeddingText}
                      onChange={handleEmbeddingTextChange}
                      disabled={vectorInputMode === 'file'}
                      className={vectorInputMode === 'file' ? 'cf-locked' : ''}
                    />
                  </div>

                  <div className="cf-group">
                    <label>
                      Embedding file (.json)
                      {vectorInputMode === 'text' && (
                        <span className="cf-lock-badge">🔒 disabled — text entered</span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleEmbeddingFileChange}
                      disabled={vectorInputMode === 'text'}
                      className={vectorInputMode === 'text' ? 'cf-locked' : ''}
                    />
                    {embeddingFile && (
                      <span className="cf-upload-hint">📄 {embeddingFile.name}</span>
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
            <button
              type="button"
              className="cf-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cf-btn-submit cf-btn-blue"
              disabled={submitting}
            >
              {submitting
                ? (isEditing ? 'Saving…' : 'Adding…')
                : (isEditing ? '✓  Update vehicle' : '✓  Add vehicle')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}