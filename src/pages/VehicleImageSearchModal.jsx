import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './VehicleImageSearchModal.css';
import { searchVehiclesByImageApi } from '../api/authApi';

// ─── Icons ───────────────────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A32D2D"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const CheckTick = () => (
  <svg className="vis-checkbox-tick" viewBox="0 0 16 16" width="9" height="9">
    <polyline points="2,8 6,12 14,3" fill="none" stroke="#fff" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildImageProxyUrl(rawUrl) {
  if (!rawUrl) return null;
  return rawUrl.replace(/^https?:\/\/[^/]+/, '');
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VehicleImageSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState(null);
  const selectedImageFileRef = useRef(null);

  const [useVectorSearch, setUseVectorSearch] = useState(false);

  const [embeddingText, setEmbeddingText] = useState('');
  const [embeddingFile, setEmbeddingFile] = useState(null);
  const [vectorInputMode, setVectorInputMode] = useState(null); // null | 'text' | 'file'

  const [topK, setTopK] = useState('3');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Image upload ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    selectedImageFileRef.current = file;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  // ── Checkbox toggle ──
  const handleToggleVectorMode = (e) => {
    const checked = e.target.checked;
    setUseVectorSearch(checked);

    if (checked) {
      selectedImageFileRef.current = null;
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    } else {
      setEmbeddingText('');
      setEmbeddingFile(null);
      setVectorInputMode(null);
    }
  };

  // ── Embedding text / file — mutually exclusive ──
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

  const resetForm = () => {
    selectedImageFileRef.current = null;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUseVectorSearch(false);
    setEmbeddingText('');
    setEmbeddingFile(null);
    setVectorInputMode(null);
    setTopK('3');
    setResults(null);
    setHasSearched(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Navigate to vehicle detail page, closing the modal first ──
  const handleResultClick = (vehicleNumber) => {
    handleClose();
    navigate(`/vehicles/${vehicleNumber}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const imageFile        = selectedImageFileRef.current;
    const hasImage         = !useVectorSearch && !!imageFile;
    const hasEmbeddingText = useVectorSearch && vectorInputMode === 'text' && embeddingText.trim() !== '';
    const hasEmbeddingFile = useVectorSearch && vectorInputMode === 'file' && !!embeddingFile;

    if (!hasImage && !hasEmbeddingText && !hasEmbeddingFile) {
      setError(
        useVectorSearch
          ? 'Provide an embedding vector, or upload an embedding file, to search by.'
          : 'Upload a vehicle photo to search by.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (hasImage)         fd.append('vehicle_image', imageFile);
      if (hasEmbeddingText) fd.append('embedding', embeddingText.trim());
      if (hasEmbeddingFile) fd.append('embedding_file', embeddingFile);
      fd.append('topK', topK.trim() ? topK.trim() : '3');

      const matches = await searchVehiclesByImageApi(fd);
      setResults(Array.isArray(matches) ? matches : []);
      setHasSearched(true);
    } catch (err) {
      console.error('[VehicleImageSearchModal] Search failed:', err);
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
      setHasSearched(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card vis-modal-card">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-hicon">
              <CameraIcon />
            </div>
            <div>
              <h2 className="modal-title">Search Vehicle by Image</h2>
              <p className="modal-sub">Find the closest matching vehicles in the database</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-body vis-body">

            {/* Photo panel */}
            <div className={`vis-panel vis-panel-photo${useVectorSearch ? ' vis-panel-disabled' : ''}`}>
              <div className="vis-panel-head">
                <span className="vis-panel-icon vis-icon-photo">🚗</span>
                <div>
                  <div className="vis-panel-title">Vehicle photo</div>
                  <div className="vis-panel-sub">Upload a clear photo of the vehicle</div>
                </div>
              </div>

              {imagePreview && (
                <img src={imagePreview} alt="Selected vehicle" className="vis-photo-preview-sm" />
              )}

              <label className="vis-dropzone vis-dropzone-compact" htmlFor="vis-img-input">
                <span className="vis-dropzone-icon"><UploadIcon /></span>
                <span className="vis-dropzone-text">
                  {imagePreview ? 'Click to change photo' : 'Click to upload a photo'}
                </span>
                <span className="vis-dropzone-hint">JPG, PNG or WEBP — max 5 MB</span>
                <input
                  id="vis-img-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={useVectorSearch}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Checkbox */}
            <label className="vis-checkbox-row">
              <span className="vis-checkbox-wrap">
                <input
                  type="checkbox"
                  className="vis-checkbox-input"
                  checked={useVectorSearch}
                  onChange={handleToggleVectorMode}
                />
                <span className="vis-checkbox-box">
                  <CheckTick />
                </span>
              </span>
              <span className="vis-checkbox-text">
                Search using an embedding vector instead of a photo
              </span>
            </label>

            {/* Vector panel */}
            {useVectorSearch && (
              <div className="vis-panel vis-panel-vector">
                <div className="vis-panel-head">
                  <span className="vis-panel-icon vis-icon-vector">🧬</span>
                  <div>
                    <div className="vis-panel-title">Embedding vector</div>
                    <div className="vis-panel-sub">Text or file — only one is used at a time</div>
                  </div>
                </div>

                <div className="vis-vector-row">
                  <div className="vis-field">
                    <label className="vis-field-label">
                      Vector text
                      {vectorInputMode === 'file' && (
                        <span className="vis-lock-tag">🔒 file selected</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="[0.123, -0.456, ...]"
                      value={embeddingText}
                      onChange={handleEmbeddingTextChange}
                      disabled={vectorInputMode === 'file'}
                      className={`vis-textarea${vectorInputMode === 'file' ? ' vis-disabled' : ''}`}
                    />
                  </div>

                  <div className="vis-field">
                    <label className="vis-field-label">
                      Vector file (.json)
                      {vectorInputMode === 'text' && (
                        <span className="vis-lock-tag">🔒 text entered</span>
                      )}
                    </label>
                    <label
                      htmlFor="vis-vec-file-input"
                      className={`vis-dropzone vis-dropzone-sm${vectorInputMode === 'text' ? ' vis-disabled' : ''}`}
                    >
                      <span className="vis-dropzone-icon"><DocumentIcon /></span>
                      <span className="vis-dropzone-text vis-dropzone-text-file">
                        {embeddingFile ? embeddingFile.name : 'Click to upload .json'}
                      </span>
                      <input
                        id="vis-vec-file-input"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleEmbeddingFileChange}
                        disabled={vectorInputMode === 'text'}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Top K */}
            <div className="vis-panel vis-panel-settings">
              <div className="vis-topk-row">
                <span className="vis-panel-icon vis-icon-settings vis-icon-sm">🎯</span>
                <label className="vis-field-label vis-topk-label">Top K results</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="3"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="vis-input vis-input-sm"
                />
              </div>
            </div>

            {/* Results */}
            {hasSearched && (
              <div className="vis-panel vis-panel-results">
                <div className="vis-panel-head">
                  <span className="vis-panel-icon vis-icon-results">🔎</span>
                  <div>
                    <div className="vis-panel-title">
                      Matches
                      {results && results.length > 0 && (
                        <span className="vis-result-count">{results.length} found</span>
                      )}
                    </div>
                    <div className="vis-panel-sub">
                      Closest vehicles, ranked by similarity score — click any card to view details
                    </div>
                  </div>
                </div>

                {results && results.length > 0 ? (
                  <div className="vis-results-grid">
                    {results.map((r, idx) => {
                      const rawUrl   = r.image_url || r.vehicle_image_url || r.vehicle_image || null;
                      const proxyUrl = buildImageProxyUrl(rawUrl);
                      const isBest   = idx === 0;
                      return (
                        <div
                          className={`vis-card${isBest ? ' vis-card-best' : ''} vis-card-clickable`}
                          key={r.vehicle_number ?? idx}
                          onClick={() => handleResultClick(r.vehicle_number)}
                          title={`View details for ${r.vehicle_number || 'vehicle'}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleResultClick(r.vehicle_number)}
                        >
                          <div className="vis-card-img-wrap">
                            {proxyUrl ? (
                              <img
                                src={proxyUrl}
                                alt={r.vehicle_number || 'Vehicle'}
                                className="vis-card-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="vis-card-img-fallback">🚗</div>
                            )}
                            {isBest && <span className="vis-best-tag">Best match</span>}
                            {typeof r.score !== 'undefined' && (
                              <span className="vis-score-badge">
                                {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                              </span>
                            )}
                          </div>
                          <div className="vis-card-body">
                            <div className="vis-card-number">{r.vehicle_number || 'Unknown'}</div>
                            <div className="vis-card-meta">
                              {r.vehicle_model || '—'}{r.vehicle_type ? ` · ${r.vehicle_type}` : ''}
                            </div>
                            <div className="vis-card-view-hint">View details →</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="vis-empty">No matching vehicles found.</p>
                )}
              </div>
            )}

          </div>

          {/* Actions */}
          <div className="cf-actions">
            <button type="button" className="cf-btn-cancel" onClick={resetForm} disabled={submitting}>
              ↺ Reset
            </button>
            <button type="submit" className="cf-btn-submit" disabled={submitting}>
              {submitting ? 'Searching…' : '🔍  Search'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}