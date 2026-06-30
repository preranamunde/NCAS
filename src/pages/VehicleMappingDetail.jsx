import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import { getVehicleMappingByIdApi } from '../api/authApi';
import './VehicleMappingDetail.css';

const VehicleMappingDetail = () => {
  const { mappingId } = useParams();
  const navigate      = useNavigate();

  const [mapping, setMapping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchMapping = async () => {
      try {
        setLoading(true);
        const data = await getVehicleMappingByIdApi(mappingId);
        setMapping(data);
      } catch (err) {
        console.error('Failed to load mapping:', err);
        setError(err.message || 'Failed to load mapping details.');
      } finally {
        setLoading(false);
      }
    };

    if (mappingId) fetchMapping();
  }, [mappingId]);

  // ── Resolve nested fields safely ─────────────────────────────────────────
  const vehicle = mapping?.vehicle ?? mapping?.vehicle_id ?? null;

  const vehicleNumber =
    typeof vehicle === 'object' ? vehicle?.vehicle_number : vehicle;
  const vehicleType =
    typeof vehicle === 'object' ? vehicle?.vehicle_type   : '—';
  const vehicleModel =
    typeof vehicle === 'object' ? vehicle?.vehicle_model  : '—';
  const vehicleImageUrl =
    typeof vehicle === 'object' ? vehicle?.vehicle_image_url : null;

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="vmd-page">
        <button className="vmd-back-btn" onClick={() => navigate(-1)}>
          ← Back to Vehicle Mappings
        </button>

        {loading && <div className="vmd-loading">Loading mapping details…</div>}

        {error && (
          <div className="vmd-error">⚠️ {error}</div>
        )}

        {!loading && !error && mapping && (
          <div className="vmd-card">

            {/* ── Left: Vehicle Image ──────────────────────────────────── */}
            <div className="vmd-image-section">
              {vehicleImageUrl ? (
                <img
                  src={vehicleImageUrl}
                  alt={vehicleNumber}
                  className="vmd-image"
                />
              ) : (
                <div className="vmd-image-placeholder">
                  <span>🚗</span>
                  <p>No vehicle image</p>
                </div>
              )}

              {vehicleNumber && (
                <div className="vmd-plate">{vehicleNumber}</div>
              )}
            </div>

            {/* ── Right: Details ───────────────────────────────────────── */}
            <div className="vmd-info-section">

              {/* Header */}
              <div className="vmd-header">
                <h1 className="vmd-title">Mapping Detail</h1>
              </div>

              {/* Vehicle section */}
              <div className="vmd-section">
                <p className="vmd-section-label">🚗 Vehicle Info</p>
                <div className="vmd-fields">
                  <Row label="Vehicle Number" value={vehicleNumber} mono />
                  <Row label="Vehicle Model"  value={vehicleModel} />
                  <Row label="Vehicle Type"   value={vehicleType} badge />
                </div>
              </div>

              {/* Officer section */}
              {mapping?.officer_id && (
                <div className="vmd-section">
                  <p className="vmd-section-label">🪪 Assigned Officer</p>
                  <div className="vmd-fields">
                    <Row
                      label="Officer ID"
                      value={
                        typeof mapping.officer_id === 'object'
                          ? `#${mapping.officer_id?.officer_id}`
                          : `#${mapping.officer_id}`
                      }
                      mono
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ── Helper row component ─────────────────────────────────────────────────────
const Row = ({ label, value, mono, badge }) => (
  <div className="vmd-row">
    <span className="vmd-label">{label}</span>
    {badge ? (
      <span className="type-badge">{value || '—'}</span>
    ) : (
      <span className={`vmd-value${mono ? ' vmd-mono' : ''}`}>
        {value || '—'}
      </span>
    )}
  </div>
);

export default VehicleMappingDetail;