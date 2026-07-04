import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CriminalImageSearchModal.css';
import { searchCriminalsByImageApi } from '../api/authApi';

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
  <svg className="cis-checkbox-tick" viewBox="0 0 16 16" width="9" height="9">
    <polyline points="2,8 6,12 14,3" fill="none" stroke="#fff" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── helpers ──────────────────────────────────────────────────────────────────
function buildImageProxyUrl(rawUrl) {
  if (!rawUrl) return null;
  return rawUrl.replace(/^https?:\/\/[^/]+/, '');
}

const REOPEN_STORAGE_KEY = 'cis_reopen_state';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, filename, mimeType) {
  const [, base64] = dataUrl.split(',');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CriminalImageSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState(null);
  const selectedImageFileRef = useRef(null);

  const [useVectorSearch, setUseVectorSearch] = useState(false);

  const [imageVectorText, setImageVectorText] = useState('');
  const [imageVectorFile, setImageVectorFile] = useState(null);
  const [vectorInputMode, setVectorInputMode] = useState(null);

  const [topK, setTopK] = useState('3');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let saved = null;
    try {
      const raw = sessionStorage.getItem(REOPEN_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (err) {
      console.warn('[CriminalImageSearchModal] Failed to restore saved state:', err);
    }

    if (saved) {
      setResults(saved.results ?? null);
      setHasSearched(!!saved.hasSearched);
      setTopK(saved.topK ?? '3');
      setUseVectorSearch(!!saved.useVectorSearch);
      setImageVectorText(saved.imageVectorText ?? '');
      setVectorInputMode(saved.vectorInputMode ?? null);

      if (saved.photoDataUrl && saved.photoFileName) {
        try {
          const rebuiltFile = dataUrlToFile(
            saved.photoDataUrl,
            saved.photoFileName,
            saved.photoMimeType || 'image/jpeg'
          );
          selectedImageFileRef.current = rebuiltFile;
          setImagePreview(saved.photoDataUrl);
        } catch (err) {
          console.warn('[CriminalImageSearchModal] Failed to rebuild saved photo:', err);
        }
      }

      sessionStorage.removeItem(REOPEN_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    try {
      sessionStorage.removeItem(REOPEN_STORAGE_KEY);
    } catch (err) {
      // ignore
    }
    onClose();
  };

  const handleResultClick = async (criminalId) => {
    try {
      const stateToSave = {
        results,
        hasSearched,
        topK,
        useVectorSearch,
        imageVectorText,
        vectorInputMode,
      };

      const photoFile = selectedImageFileRef.current;
      if (photoFile && !useVectorSearch) {
        stateToSave.photoDataUrl = await fileToDataUrl(photoFile);
        stateToSave.photoFileName = photoFile.name;
        stateToSave.photoMimeType = photoFile.type;
      }

      sessionStorage.setItem(REOPEN_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('[CriminalImageSearchModal] Failed to persist state before navigating:', err);
    }

    onClose();
    navigate(`/criminals/${criminalId}`);
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
          : 'Upload a criminal photo to search by.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (hasImage)      fd.append('criminal_image', imageFile);
      if (hasVectorText) fd.append('image_vector', imageVectorText.trim());
      if (hasVectorFile) fd.append('image_vector_file', imageVectorFile);
      fd.append('topK', topK.trim() ? topK.trim() : '3');

      const matches = await searchCriminalsByImageApi(fd);
      setResults(Array.isArray(matches) ? matches : []);
      setHasSearched(true);
    } catch (err) {
      console.error('[CriminalImageSearchModal] Search failed:', err);
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
      <div className="modal-card cis-modal-card">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-hicon">
              <CameraIcon />
            </div>
            <div>
              <h2 className="modal-title">Search Criminal by Image</h2>
              <p className="modal-sub">Find the closest matching profiles in the database</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="cis-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-body cis-body cis-scroll">

            {/* Photo panel */}
            <div className={`cis-panel cis-panel-photo${useVectorSearch ? ' cis-panel-disabled' : ''}`}>
              <div className="cis-panel-head">
                <span className="cis-panel-icon cis-icon-photo">🖼️</span>
                <div>
                  <div className="cis-panel-title">Criminal photo</div>
                  <div className="cis-panel-sub">Upload a clear, front-facing photo</div>
                </div>
              </div>

              {imagePreview && (
                <img src={imagePreview} alt="Selected criminal" className="cis-photo-preview-sm" />
              )}

              <label className="cis-dropzone cis-dropzone-compact" htmlFor="cis-img-input">
                <span className="cis-dropzone-icon"><UploadIcon /></span>
                <span className="cis-dropzone-text">
                  {imagePreview ? 'Click to change photo' : 'Click to upload a photo'}
                </span>
                <span className="cis-dropzone-hint">JPG, PNG or WEBP — max 5 MB</span>
                <input
                  id="cis-img-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={useVectorSearch}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Checkbox */}
            <label className="cis-checkbox-row">
              <span className="cis-checkbox-wrap">
                <input
                  type="checkbox"
                  className="cis-checkbox-input"
                  checked={useVectorSearch}
                  onChange={handleToggleVectorMode}
                />
                <span className="cis-checkbox-box">
                  <CheckTick />
                </span>
              </span>
              <span className="cis-checkbox-text">
                Search using an image vector instead of a photo
              </span>
            </label>

            {/* Vector panel */}
            {useVectorSearch && (
              <div className="cis-panel cis-panel-vector">
                <div className="cis-panel-head">
                  <span className="cis-panel-icon cis-icon-vector">🧬</span>
                  <div>
                    <div className="cis-panel-title">Image vector</div>
                    <div className="cis-panel-sub">Text or file — only one is used at a time</div>
                  </div>
                </div>

                <div className="cis-vector-row">
                  <div className="cis-field">
                    <label className="cis-field-label">
                      Vector text
                      {vectorInputMode === 'file' && (
                        <span className="cis-lock-tag">🔒 file selected</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="[0.123, -0.456, ...]"
                      value={imageVectorText}
                      onChange={handleImageVectorTextChange}
                      disabled={vectorInputMode === 'file'}
                      className={`cis-textarea${vectorInputMode === 'file' ? ' cis-disabled' : ''}`}
                    />
                  </div>

                  <div className="cis-field">
                    <label className="cis-field-label">
                      Vector file (.json)
                      {vectorInputMode === 'text' && (
                        <span className="cis-lock-tag">🔒 text entered</span>
                      )}
                    </label>
                    <label
                      htmlFor="cis-vec-file-input"
                      className={`cis-dropzone cis-dropzone-sm${vectorInputMode === 'text' ? ' cis-disabled' : ''}`}
                    >
                      <span className="cis-dropzone-icon"><DocumentIcon /></span>
                      <span className="cis-dropzone-text cis-dropzone-text-file">
                        {imageVectorFile ? imageVectorFile.name : 'Click to upload .json'}
                      </span>
                      <input
                        id="cis-vec-file-input"
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
            <div className="cis-panel cis-panel-settings">
              <div className="cis-topk-row">
                <span className="cis-panel-icon cis-icon-settings cis-icon-sm">🎯</span>
                <label className="cis-field-label cis-topk-label">Top K results</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="3"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="cis-input cis-input-sm"
                />
              </div>
            </div>

            {/* Results */}
            {hasSearched && (
              <div className="cis-panel cis-panel-results">
                <div className="cis-panel-head">
                  <span className="cis-panel-icon cis-icon-results">🔎</span>
                  <div>
                    <div className="cis-panel-title">
                      Matches
                      {results && results.length > 0 && (
                        <span className="cis-result-count">{results.length} found</span>
                      )}
                    </div>
                    <div className="cis-panel-sub">
                      Closest profiles, ranked by similarity score — click any card to view details
                    </div>
                  </div>
                </div>

                {results && results.length > 0 ? (
                  <div className="cis-results-grid">
                    {results.map((r, idx) => {
                      const rawUrl   = r.image_url || r.criminal_image_url || r.profile_image_url || null;
                      const proxyUrl = buildImageProxyUrl(rawUrl);
                      const isBest   = idx === 0;
                      return (
                        <div
                          className={`cis-card${isBest ? ' cis-card-best' : ''} cis-card-clickable`}
                          key={r.criminal_id ?? idx}
                          onClick={() => handleResultClick(r.criminal_id)}
                          title={`View details for ${r.criminal_name || 'criminal'}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleResultClick(r.criminal_id)}
                        >
                          <div className="cis-card-img-wrap">
                            {proxyUrl ? (
                              <img
                                src={proxyUrl}
                                alt={r.criminal_name || 'Criminal'}
                                className="cis-card-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="cis-card-img-fallback">
                                {r.criminal_name?.charAt(0) || 'C'}
                              </div>
                            )}
                            {isBest && <span className="cis-best-tag">Best match</span>}
                            {typeof r.score !== 'undefined' && (
                              <span className="cis-score-badge">
                                {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                              </span>
                            )}
                          </div>
                          <div className="cis-card-body">
                            <div className="cis-card-name">{r.criminal_name || 'Unknown'}</div>
                            <div className="cis-card-id">#{r.criminal_id}</div>
                            <div className="cis-card-view-hint">View profile →</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="cis-empty">No matching profiles found.</p>
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