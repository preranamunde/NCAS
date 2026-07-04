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

export default function MissingPersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setError(null);
      setImgFailed(false);
      try {
        // ── Calls: GET /missingperson/:id ──────────────────────────────────
        const res = await fetch(`${API_BASE_URL}${ENDPOINTS.MISSING_PERSON_BY_ID(id)}`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || `Request failed (${res.status})`);
        }
        const json = await res.json();
        setPerson(json.data ?? json);
      } catch (err) {
        setError(err.message || 'Failed to load missing person details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
  }, [id]);

  const Field = ({ label, value, wide }) => (
    <div className={`od-field${wide ? ' od-field--wide' : ''}`}>
      <span className="od-field-label">{label}</span>
      <span className="od-field-value">{value || <em className="od-empty">—</em>}</span>
    </div>
  );

  const Section = ({ icon, title, children }) => (
    <div className="od-section">
      <div className="od-section-header">
        <span className="od-section-icon">{icon}</span>
        <span className="od-section-title">{title}</span>
      </div>
      <div className="od-section-body">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header /><NavbarHome />
        <div className="od-page">
          <div className="od-loading">
            <svg className="od-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading missing person details…
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

  if (!person) return null;

  // ── Derive values from actual API response shape ──────────────────────────
  const alertActive = person.alert_status === true || person.alert_status === 'true';

  const stateName    = person.person_state?.state_name       || person.state_name    || '';
  const stateCode    = person.person_state?.state_code       || person.state_code    || '';
  const districtName = person.person_district?.district_name || person.district_name || '';
  const districtCode = person.person_district?.district_code || person.district_code || '';

  const locationLabel = [districtName, stateName].filter(Boolean).join(', ');

  const imgSrc = person.person_image_url || person.profile_image_url || person.image_url || null;

  return (
    <>
      <Header />
      <NavbarHome />
      <div className="od-page">

        {/* ── Top bar ── */}
        <div className="od-topbar">
          <button className="od-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Missing Persons
          </button>
          <div className="od-breadcrumb">Missing Persons / <span>#{person.person_id}</span></div>
        </div>

        {/* ── Hero card ── */}
        <div className="od-hero">
          <div className="od-hero-photo">
            {imgSrc && !imgFailed ? (
              <img
                src={imgSrc}
                alt={person.person_name}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="od-hero-avatar od-hero-avatar--red">
                {person.person_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="od-hero-info">
            <div className="od-hero-name">{person.person_name}</div>
            <div className="od-hero-meta">
              <span className={`od-badge ${alertActive ? 'od-badge-red' : 'od-badge-gray'}`}>
                {alertActive ? '🔴 Missing' : '⚫ Resolved'}
              </span>
              <span className="od-hero-id">ID: #{person.person_id}</span>
            </div>
            {person.person_mobile && (
              <div className="od-hero-sub">
                <span>📞 {person.person_mobile}</span>
              </div>
            )}
            {locationLabel && (
              <div className="od-hero-sub">
                <span>📍 {locationLabel}</span>
              </div>
            )}
          </div>

          <div className={`od-status-pill ${alertActive ? '' : 'od-status-pill--inactive'}`}>
            <span className={`od-dot ${alertActive ? '' : 'od-dot--gray'}`} />
            {alertActive ? 'Active Alert' : 'No Alert'}
          </div>
        </div>

        {/* ── Detail sections ── */}
        <div className="od-grid od-grid--full">

          <Section icon="🪪" title="Basic Information">
            <Field label="Person ID"        value={person.person_id} />
            <Field label="Full Name"        value={person.person_name} />
            <Field label="Father's/Guardian's Name" value={person.person_fname} />
            <Field label="Mobile Number"    value={person.person_mobile} />
            <Field label="Alert Status"     value={alertActive ? 'Active' : 'Inactive'} />
            <Field label="Reason for Alert" value={person.reason_for_alert} />
            <Field label="Missing Notes"    value={person.missing_notes} wide />
          </Section>

          <Section icon="📍" title="Location Details">
            <Field label="Address"         value={person.person_address} wide />
            <Field label="Pincode"         value={person.person_pincode} />
            <Field label="State"           value={stateName} />
            <Field label="State Code"      value={stateCode} />
            <Field label="District"        value={districtName} />
            <Field label="District Code"   value={districtCode} />
          </Section>

        </div>

      </div>

      <style>{`
        .od-hero-avatar--red  { background: #fee2e2 !important; color: #dc2626 !important; }
        .od-badge-red         { background: #fee2e2; color: #dc2626; }
        .od-badge-gray        { background: #f1f5f9; color: #64748b; }
        .od-status-pill--inactive {
          background:   #f8fafc !important;
          border-color: #e2e8f0 !important;
          color:        #64748b !important;
        }
        .od-dot--gray { background: #94a3b8 !important; }
        .od-grid--full {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 900px;
        }
        @media (max-width: 640px) {
          .od-grid--full { grid-template-columns: 1fr; }
        }
        .od-field--wide { grid-column: 1 / -1; }
      `}</style>
    </>
  );
}