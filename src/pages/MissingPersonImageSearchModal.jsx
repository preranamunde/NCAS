import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MissingPersonImageSearchModal.css';
import { searchMissingPersonsByImageApi } from '../api/authApi';

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
  <svg className="mis-checkbox-tick" viewBox="0 0 16 16" width="9" height="9">
    <polyline points="2,8 6,12 14,3" fill="none" stroke="#fff" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── helpers ──────────────────────────────────────────────────────────────────
function buildImageProxyUrl(rawUrl) {
  if (!rawUrl) return null;
  return rawUrl.replace(/^https?:\/\/[^/]+/, '');
}

// ─── Component ───────────────────────────────────────────────────────────────
// Mirrors CriminalImageSearchModal, but posts to /search/missingperson via
// searchMissingPersonsByImageApi (person_image / image_vector / image_vector_file / topK).
//
// NOTE: searchMissingPersonsByImageApi now returns a paginated shape
// { data, total, page, limit } (to match the vehicles/officers/criminals APIs).
// This modal is a top-K similarity search, not a paged table, so we just
// unwrap `.data` — the page/total/limit fields aren't used here.
export default function MissingPersonImageSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState(null);
  const selectedImageFileRef = useRef(null);

  const [useVectorSearch, setUseVectorSearch] = useState(false);

  const [imageVectorText, setImageVectorText] = useState('');
  const [imageVectorFile, setImageVectorFile] = useState(null);
  const [vectorInputMode, setVectorInputMode] = useState(null); // null | 'text' | 'file'

  const [topK, setTopK] = useState('3');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Photo upload ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    selectedImageFileRef.current = file;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

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
      setImageVectorText('');
      setImageVectorFile(null);
      setVectorInputMode(null);
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

  const resetForm = () => {
    selectedImageFileRef.current = null;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUseVectorSearch(false);
    setImageVectorText('');
    setImageVectorFile(null);
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

  // ── Navigate to missing person detail page, closing the modal first ──
  const handleResultClick = (personId) => {
    handleClose();
    navigate(`/missingpersons/${personId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const imageFile     = selectedImageFileRef.current;
    const hasImage      = !useVectorSearch && !!imageFile;
    const hasVectorText = useVectorSearch && vectorInputMode === 'text' && imageVectorText.trim() !== '';
    const hasVectorFile = useVectorSearch && vectorInputMode === 'file' && !!imageVectorFile;

    if (!hasImage && !hasVectorText && !hasVectorFile) {
      setError(
        useVectorSearch
          ? 'Provide an image vector, or upload a vector file, to search by.'
          : 'Upload a photo to search by.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (hasImage)      fd.append('person_image', imageFile);
      if (hasVectorText) fd.append('image_vector', imageVectorText.trim());
      if (hasVectorFile) fd.append('image_vector_file', imageVectorFile);
      fd.append('topK', topK.trim() ? topK.trim() : '3');

      // searchMissingPersonsByImageApi returns { data, total, page, limit }.
      // This is a top-K similarity search, not a paged list, so we only need `.data`.
      const response = await searchMissingPersonsByImageApi(fd);
      const matches  = Array.isArray(response?.data) ? response.data : [];
      setResults(matches);
      setHasSearched(true);
    } catch (err) {
      console.error('[MissingPersonImageSearchModal] Search failed:', err);
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
      <div className="modal-card mis-modal-card">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-hicon">
              <CameraIcon />
            </div>
            <div>
              <h2 className="modal-title">Search Missing Person by Image</h2>
              <p className="modal-sub">Find the closest matching records in the database</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mis-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-body mis-body">

            {/* Photo panel */}
            <div className={`mis-panel mis-panel-photo${useVectorSearch ? ' mis-panel-disabled' : ''}`}>
              <div className="mis-panel-head">
                <span className="mis-panel-icon mis-icon-photo">🖼️</span>
                <div>
                  <div className="mis-panel-title">Person's photo</div>
                  <div className="mis-panel-sub">Upload a clear, front-facing photo</div>
                </div>
              </div>

              {imagePreview && (
                <img src={imagePreview} alt="Selected person" className="mis-photo-preview-sm" />
              )}

              <label className="mis-dropzone mis-dropzone-compact" htmlFor="mis-img-input">
                <span className="mis-dropzone-icon"><UploadIcon /></span>
                <span className="mis-dropzone-text">
                  {imagePreview ? 'Click to change photo' : 'Click to upload a photo'}
                </span>
                <span className="mis-dropzone-hint">JPG, PNG or WEBP — max 5 MB</span>
                <input
                  id="mis-img-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={useVectorSearch}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Checkbox */}
            <label className="mis-checkbox-row">
              <span className="mis-checkbox-wrap">
                <input
                  type="checkbox"
                  className="mis-checkbox-input"
                  checked={useVectorSearch}
                  onChange={handleToggleVectorMode}
                />
                <span className="mis-checkbox-box">
                  <CheckTick />
                </span>
              </span>
              <span className="mis-checkbox-text">
                Search using an image vector instead of a photo
              </span>
            </label>

            {/* Vector panel */}
            {useVectorSearch && (
              <div className="mis-panel mis-panel-vector">
                <div className="mis-panel-head">
                  <span className="mis-panel-icon mis-icon-vector">🧬</span>
                  <div>
                    <div className="mis-panel-title">Image vector</div>
                    <div className="mis-panel-sub">Text or file — only one is used at a time</div>
                  </div>
                </div>

                <div className="mis-vector-row">
                  <div className="mis-field">
                    <label className="mis-field-label">
                      Vector text
                      {vectorInputMode === 'file' && (
                        <span className="mis-lock-tag">🔒 file selected</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="[0.123, -0.456, ...]"
                      value={imageVectorText}
                      onChange={handleImageVectorTextChange}
                      disabled={vectorInputMode === 'file'}
                      className={`mis-textarea${vectorInputMode === 'file' ? ' mis-disabled' : ''}`}
                    />
                  </div>

                  <div className="mis-field">
                    <label className="mis-field-label">
                      Vector file (.json)
                      {vectorInputMode === 'text' && (
                        <span className="mis-lock-tag">🔒 text entered</span>
                      )}
                    </label>
                    <label
                      htmlFor="mis-vec-file-input"
                      className={`mis-dropzone mis-dropzone-sm${vectorInputMode === 'text' ? ' mis-disabled' : ''}`}
                    >
                      <span className="mis-dropzone-icon"><DocumentIcon /></span>
                      <span className="mis-dropzone-text mis-dropzone-text-file">
                        {imageVectorFile ? imageVectorFile.name : 'Click to upload .json'}
                      </span>
                      <input
                        id="mis-vec-file-input"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImageVectorFileChange}
                        disabled={vectorInputMode === 'text'}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Top K */}
            <div className="mis-panel mis-panel-settings">
              <div className="mis-topk-row">
                <span className="mis-panel-icon mis-icon-settings mis-icon-sm">🎯</span>
                <label className="mis-field-label mis-topk-label">Top K results</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="3"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="mis-input mis-input-sm"
                />
              </div>
            </div>

            {/* Results */}
            {hasSearched && (
              <div className="mis-panel mis-panel-results">
                <div className="mis-panel-head">
                  <span className="mis-panel-icon mis-icon-results">🔎</span>
                  <div>
                    <div className="mis-panel-title">
                      Matches
                      {results && results.length > 0 && (
                        <span className="mis-result-count">{results.length} found</span>
                      )}
                    </div>
                    <div className="mis-panel-sub">
                      Closest records, ranked by similarity score — click any card to view details
                    </div>
                  </div>
                </div>

                {results && results.length > 0 ? (
                  <div className="mis-results-grid">
                    {results.map((r, idx) => {
                      const rawUrl   = r.image_url || r.person_image_url || r.profile_image_url || null;
                      const proxyUrl = buildImageProxyUrl(rawUrl);
                      const isBest   = idx === 0;
                      const personId = r.person_id ?? r.id;
                      return (
                        <div
                          className={`mis-card${isBest ? ' mis-card-best' : ''} mis-card-clickable`}
                          key={personId ?? idx}
                          onClick={() => handleResultClick(personId)}
                          title={`View details for ${r.person_name || 'person'}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleResultClick(personId)}
                        >
                          <div className="mis-card-img-wrap">
                            {proxyUrl ? (
                              <img
                                src={proxyUrl}
                                alt={r.person_name || 'Missing person'}
                                className="mis-card-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="mis-card-img-fallback">
                                {r.person_name?.charAt(0) || 'P'}
                              </div>
                            )}
                            {isBest && <span className="mis-best-tag">Best match</span>}
                            {typeof r.score !== 'undefined' && (
                              <span className="mis-score-badge">
                                {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                              </span>
                            )}
                          </div>
                          <div className="mis-card-body">
                            <div className="mis-card-name">{r.person_name || 'Unknown'}</div>
                            <div className="mis-card-id">#{personId}</div>
                            <div className="mis-card-view-hint">View profile →</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mis-empty">No matching records found.</p>
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