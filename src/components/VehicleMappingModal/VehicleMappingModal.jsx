import { useState, useEffect } from 'react';
import {
  getCriminalsApi,
  getVehiclesApi,
  createVehicleMappingApi,
  updateVehicleMappingApi,
} from '../../api/authApi';
import './VehicleMappingModal.css';

export default function VehicleMappingModal({
  isOpen,
  onClose,
  onSuccess,
  mapping,   // null → create mode, object → edit mode
}) {
  const isEditing = !!mapping;

  const [criminals, setCriminals] = useState([]);
  const [vehicles, setVehicles]   = useState([]);

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [dropdownError, setDropdownError]       = useState(null);

  const [form, setForm] = useState({ profile_id: '', vehicle_id: '' });

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Helper: extract _id whether value is a populated object or plain string
  const resolveId = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val._id ?? '';
    return String(val);
  };

  // Load dropdowns and pre-fill form whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setLoadingDropdowns(true);
    setDropdownError(null);
    setSubmitError(null);

    Promise.all([getCriminalsApi(), getVehiclesApi()])
      .then(([c, v]) => {
        setCriminals(Array.isArray(c) ? c : []);
        setVehicles(Array.isArray(v) ? v : []);

        if (isEditing && mapping) {
          setForm({
            profile_id: resolveId(mapping.profile_id),
            vehicle_id: resolveId(mapping.vehicle_id),
          });
        } else {
          setForm({ profile_id: '', vehicle_id: '' });
        }
      })
      .catch((err) => setDropdownError(err.message || 'Failed to load data.'))
      .finally(() => setLoadingDropdowns(false));
  }, [isOpen, mapping]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.profile_id || !form.vehicle_id) {
      setSubmitError('Criminal and Vehicle are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing) {
        const mappingId = mapping._id ?? mapping.id;
        await updateVehicleMappingApi(mappingId, {
          profile_id: form.profile_id,
          vehicle_id: form.vehicle_id,
        });
      } else {
        // officer_id is resolved from localStorage inside createVehicleMappingApi
        await createVehicleMappingApi({
          profile_id: form.profile_id,
          vehicle_id: form.vehicle_id,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to save mapping.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="vm-overlay" onClick={handleOverlayClick}>
      <div className="vm-modal" role="dialog" aria-modal="true">

        <div className="vm-header">
          <h2>{isEditing ? 'Edit Vehicle Mapping' : 'Map Vehicle'}</h2>
          <button className="vm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="vm-body">

          {loadingDropdowns && (
            <div className="vm-loader">
              <span className="vm-spinner" />
              Loading data…
            </div>
          )}

          {dropdownError && (
            <p className="vm-error-banner">{dropdownError}</p>
          )}

          {!loadingDropdowns && !dropdownError && (
            <form onSubmit={handleSubmit} className="vm-form">

              <div className="vm-field">
                <label className="vm-label" htmlFor="profile_id">👤 Criminal</label>
                <select
                  id="profile_id"
                  name="profile_id"
                  value={form.profile_id}
                  onChange={handleChange}
                  className="vm-select"
                >
                  <option value="">— Select Criminal —</option>
                  {criminals.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.criminal_name ?? c.name ?? 'Unknown'}
                      {c.criminal_id ? ` (${c.criminal_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vm-field">
                <label className="vm-label" htmlFor="vehicle_id">🚗 Vehicle</label>
                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  className="vm-select"
                >
                  <option value="">— Select Vehicle —</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.vehicle_number}
                      {v.vehicle_type ? ` — ${v.vehicle_type}` : ''}
                      {v.vehicle_make ? ` (${v.vehicle_make})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {submitError && (
                <p className="vm-error-banner">{submitError}</p>
              )}

              <div className="vm-actions">
                <button
                  type="button"
                  className="vm-btn vm-btn--cancel"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vm-btn vm-btn--submit"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Saving…'
                    : isEditing ? 'Update Mapping' : 'Save Mapping'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}