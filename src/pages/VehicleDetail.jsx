import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import { getVehicleByIdApi } from '../api/authApi';
import './VehicleDetail.css';

const VehicleDetail = () => {
  const { vehicleNumber } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const data = await getVehicleByIdApi(vehicleNumber);
        setVehicle(data);
      } catch (err) {
        console.error('Failed to load vehicle:', err);
        setError(err.message || 'Failed to load vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleNumber) fetchVehicle();
  }, [vehicleNumber]);

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="vehicle-detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Vehicles
        </button>

        {loading && <div className="vd-loading">Loading vehicle details…</div>}

        {error && (
          <div className="vd-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!loading && !error && vehicle && (
          <div className="vd-card">
            {/* Image */}
            <div className="vd-image-section">
              {vehicle.vehicle_image_url ? (
                <img
                  src={vehicle.vehicle_image_url}
                  alt={vehicle.vehicle_number}
                  className="vd-image"
                />
              ) : (
                <div className="vd-image-placeholder">
                  <span>🚗</span>
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="vd-info-section">
              <div className="vd-header">
                <span className="vd-type-badge">{vehicle.vehicle_type || 'Unknown Type'}</span>
                <h1 className="vd-vehicle-number">{vehicle.vehicle_number}</h1>
              </div>

              <div className="vd-fields">
                <DetailRow label="Vehicle Model"  value={vehicle.vehicle_model} />
                <DetailRow label="Vehicle Number" value={vehicle.vehicle_number} />
                <DetailRow label="Vehicle Type"   value={vehicle.vehicle_type} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="vd-row">
    <span className="vd-label">{label}</span>
    <span className="vd-value">{value || '—'}</span>
  </div>
);

export default VehicleDetail;