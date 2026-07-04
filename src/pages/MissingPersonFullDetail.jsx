import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import { getMissingPersonByIdApi } from '../api/authApi';
import './MissingPersonFullDetail.css';

export default function MissingPersonFullDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  // ── Fetch full report — GET /missingperson/:id ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMissingPersonByIdApi(id)
      .then((data) => { if (!cancelled) setReport(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load report details.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const imgSrc = report?.person_image_url || report?.image_url || null;
  const districtName = report?.person_district?.district_name || report?.district_name;
  const stateName     = report?.person_state?.state_name     || report?.state_name;
  const reportedOn    = formatDate(report?.createdAt || report?.created_at || report?.reportedAt);
  const updatedOn     = formatDate(report?.updatedAt || report?.updated_at);

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="mpd-page">
        <div className="mpd-topbar">
          <button className="mpd-back-btn" onClick={() => navigate('/missing/list')}>
            ← Back to list
          </button>
        </div>

        {loading ? (
          <div className="mpd-card">
            <p className="mpd-status-text">Loading report…</p>
          </div>
        ) : error ? (
          <div className="mpd-card">
            <p className="mpd-status-text mpd-error-text">⚠️ {error}</p>
          </div>
        ) : !report ? (
          <div className="mpd-card">
            <p className="mpd-status-text">Report not found.</p>
          </div>
        ) : (
          <div className="mpd-card">

            <div className="mpd-header">
              <div className="mpd-photo">
                {imgSrc && !imgLoadFailed ? (
                  <img src={imgSrc} alt={report.person_name} onError={() => setImgLoadFailed(true)} />
                ) : (
                  <div className="mpd-no-photo">No Image</div>
                )}
              </div>

              <div className="mpd-header-info">
                <h1>{report.person_name}</h1>
                <span className={`mpd-status-badge ${report.alert_status ? 'active' : 'inactive'}`}>
                  {report.alert_status ? 'Active — Still Missing' : 'Resolved'}
                </span>
                {report.person_id && <p className="mpd-id">Report ID: #{report.person_id}</p>}
              </div>
            </div>

            <div className="mpd-section">
              <h2>Basic information</h2>
              <div className="mpd-grid">
                <div className="mpd-field">
                  <span className="mpd-label">Full name</span>
                  <span className="mpd-value">{report.person_name || '—'}</span>
                </div>
                <div className="mpd-field">
                  <span className="mpd-label">Father's name</span>
                  <span className="mpd-value">{report.person_fname || '—'}</span>
                </div>
                <div className="mpd-field">
                  <span className="mpd-label">Mobile number</span>
                  <span className="mpd-value">{report.person_mobile || '—'}</span>
                </div>
                <div className="mpd-field">
                  <span className="mpd-label">Pincode</span>
                  <span className="mpd-value">{report.person_pincode || '—'}</span>
                </div>
                <div className="mpd-field mpd-field-full">
                  <span className="mpd-label">Address</span>
                  <span className="mpd-value">{report.person_address || '—'}</span>
                </div>
              </div>
            </div>

            <div className="mpd-section">
              <h2>Location details</h2>
              <div className="mpd-grid">
                <div className="mpd-field">
                  <span className="mpd-label">State</span>
                  <span className="mpd-value">{stateName || '—'}</span>
                </div>
                <div className="mpd-field">
                  <span className="mpd-label">District</span>
                  <span className="mpd-value">{districtName || '—'}</span>
                </div>
              </div>
            </div>

            {(report.reason_for_alert || report.missing_notes) && (
              <div className="mpd-section">
                <h2>Case details</h2>
                <div className="mpd-grid">
                  {report.reason_for_alert && (
                    <div className="mpd-field mpd-field-full">
                      <span className="mpd-label">Reason for alert</span>
                      <span className="mpd-value">{report.reason_for_alert}</span>
                    </div>
                  )}
                  {report.missing_notes && (
                    <div className="mpd-field mpd-field-full">
                      <span className="mpd-label">Missing notes</span>
                      <span className="mpd-value">{report.missing_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(reportedOn || updatedOn) && (
              <div className="mpd-section">
                <h2>Timeline</h2>
                <div className="mpd-grid">
                  {reportedOn && (
                    <div className="mpd-field">
                      <span className="mpd-label">Reported on</span>
                      <span className="mpd-value">{reportedOn}</span>
                    </div>
                  )}
                  {updatedOn && (
                    <div className="mpd-field">
                      <span className="mpd-label">Last updated</span>
                      <span className="mpd-value">{updatedOn}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}