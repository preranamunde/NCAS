import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import { API_BASE_URL, ENDPOINTS } from '../api/config';
import './OfficerDetailPage.css';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function OfficerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const fetchOfficer = async () => {
      setLoading(true);
      setError(null);
      setImgFailed(false);
      try {
        const res = await fetch(`${API_BASE_URL}${ENDPOINTS.OFFICER_BY_ID(id)}`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || `Request failed (${res.status})`);
        }
        const json = await res.json();
        setOfficer(json.data?.[0] ?? json.data ?? json);
      } catch (err) {
        setError(err.message || 'Failed to load officer details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOfficer();
  }, [id]);

  /* ── helpers ── */
  const Field = ({ label, value }) => (
    <div className="od-field">
      <span className="od-field-label">{label}</span>
      <span className="od-field-value">{value || <em className="od-empty">—</em>}</span>
    </div>
  );

  const Section = ({ icon, title, children, geo }) => (
    <div className={`od-section${geo ? ' od-section--geo' : ''}`}>
      <div className="od-section-header">
        <span className="od-section-icon">{icon}</span>
        <span className="od-section-title">{title}</span>
      </div>
      <div className="od-section-body">{children}</div>
    </div>
  );

  /* ── render states ── */
  if (loading) {
    return (
      <>
        <Header /><NavbarHome />
        <div className="od-page">
          <div className="od-loading">
            <svg className="od-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading officer details…
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header /><NavbarHome />
        <div className="od-page">
          <div className="od-error">
            <span>⚠️</span> {error}
            <button className="od-back-btn" onClick={() => navigate(-1)}>← Go back</button>
          </div>
        </div>
      </>
    );
  }

  if (!officer) return null;

  // ✅ officer_image_url comes directly from the API response — use it directly
  const imgSrc = officer.officer_image_url || null;

  return (
    <>
      <Header />
      <NavbarHome />
      <div className="od-page">

        {/* ── Top bar ── */}
        <div className="od-topbar">
          <button className="od-back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Officers
          </button>
          <div className="od-breadcrumb">Officers / <span>#{officer.officer_id}</span></div>
        </div>

        {/* ── Hero card ── */}
        <div className="od-hero">
          <div className="od-hero-photo">
            {/* ✅ Show image from officer_image_url — fallback to initials avatar if null or broken */}
            {imgSrc && !imgFailed ? (
              <img
                src={imgSrc}
                alt={officer.officer_name}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="od-hero-avatar">
                {officer.officer_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="od-hero-info">
            <div className="od-hero-name">
              {officer.officer_name} {officer.officer_surname}
            </div>
            <div className="od-hero-meta">
              <span className="od-badge od-badge-blue">{officer.officer_designation}</span>
              <span className="od-hero-id">ID: #{officer.officer_id}</span>
            </div>
            <div className="od-hero-sub">
              <span>🏛️ {officer.officer_dept}</span>
              <span>📍 {officer.officer_location}</span>
            </div>
          </div>

          <div className="od-status-pill">
            <span className="od-dot" />
            Active
          </div>
        </div>

        {/* ── Detail sections ── */}
        <div className="od-grid">

          <Section icon="👤" title="Basic Information">
            <Field label="Officer ID"  value={officer.officer_id} />
            <Field label="First Name"  value={officer.officer_name} />
            <Field label="Surname"     value={officer.officer_surname} />
            <Field label="Designation" value={officer.officer_designation} />
          </Section>

          <Section icon="🏛️" title="Department & Location">
            <Field label="Department"      value={officer.officer_dept} />
            <Field label="Headquarters"    value={officer.officer_hqrs} />
            <Field label="Location / Zone" value={officer.officer_location} />
          </Section>

          <Section icon="📍" title="Geo Coordinates" geo>
            <Field label="Latitude"  value={officer.officer_location_lat} />
            <Field label="Longitude" value={officer.officer_location_long} />
            {officer.officer_location_lat && officer.officer_location_long && (
              <a
                className="od-map-link"
                href={`https://maps.google.com/?q=${officer.officer_location_lat},${officer.officer_location_long}`}
                target="_blank"
                rel="noreferrer"
              >
                🗺️ View on Google Maps
              </a>
            )}
          </Section>

        </div>
      </div>

      <style>{`@keyframes od-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}