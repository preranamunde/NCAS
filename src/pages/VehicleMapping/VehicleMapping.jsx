import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import NavbarHome from '../../components/NavbarHome';
import VehicleMappingModal from '../../components/VehicleMappingModal/VehicleMappingModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  getVehicleMappingsApi,
  deleteVehicleMappingApi,
} from '../../api/authApi';
import '../TablePage.css';

const ExpandIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/>
    <polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// Helper: extract a display value from a field that may be a populated object or plain string
function resolveField(val, ...keys) {
  if (!val) return '—';
  if (typeof val === 'object') {
    for (const k of keys) {
      if (val[k] != null) return String(val[k]);
    }
    return val._id ?? '—';
  }
  return String(val);
}

const VehicleMapping = () => {
  const navigate = useNavigate();

  const [mappings, setMappings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMapping, setEditMapping] = useState(null);

  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getVehicleMappingsApi();
      setMappings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteVehicleMappingApi(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error('Delete mapping failed:', error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openCreate = () => { setEditMapping(null); setIsModalOpen(true); };
  const openEdit   = (m) => { setEditMapping(m);   setIsModalOpen(true); };
  const closeModal = ()  => { setEditMapping(null); setIsModalOpen(false); };

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="table-page">
        <div className="table-header">
          <div>
            <h1>Vehicle Mapping</h1>
            <p className="subtitle">Link criminals to tracked vehicles</p>
          </div>
          <button className="add-btn" onClick={openCreate}>+ Map Vehicle</button>
        </div>

        <div className="table-card">
          {loading ? (
            <div className="loading-text">Loading…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Criminal</th>
                  <th>Vehicle Number</th>
                  <th>Vehicle Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.length ? mappings.map((mapping, idx) => {
                  if (!mapping) return null;

                  const id = mapping._id ?? mapping.id ?? idx;

                  // profile_id may be a populated criminal object or a plain string/id
                  const criminalName = resolveField(
                    mapping.profile_id,
                    'criminal_name', 'name'
                  );

                  // vehicle_id may be a populated vehicle object or a plain string/id
                  const vehicleNum  = resolveField(mapping.vehicle_id, 'vehicle_number');
                  const vehicleType = resolveField(mapping.vehicle_id, 'vehicle_type');

                  return (
                    <tr key={id}>
                      <td>#{idx + 1}</td>

                      <td>
                        <div className="name-cell">
                          <span className="avatar avatar-blue">
                            {criminalName.charAt(0).toUpperCase()}
                          </span>
                          {criminalName}
                        </div>
                      </td>

                      <td>
                        <span className="vehicle-number-badge">{vehicleNum}</span>
                      </td>

                      <td>
                        <span className="type-badge">{vehicleType}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                          {/* View details */}
                          <button
                            className="expand-icon-btn"
                            title="View details"
                            onClick={() => navigate(`/vehicle-mapping/${id}`)}
                            style={{ display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', padding: '4px 6px' }}
                          >
                            <ExpandIcon />
                          </button>

                          {/* Edit — passes full mapping object to modal */}
                          <button
                            className="edit-icon-btn"
                            title="Edit"
                            onClick={() => openEdit(mapping)}
                          >
                            ✏️
                          </button>

                          {/* Delete */}
                          <button
                            className="edit-icon-btn delete-icon-btn"
                            title="Delete"
                            onClick={() => setDeleteTarget({ id, vehicleNum })}
                            style={{ display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', padding: '4px 6px' }}
                          >
                            <DeleteIcon />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="no-data">No vehicle mappings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <VehicleMappingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={loadData}
        mapping={editMapping}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mapping?"
        message={deleteTarget
          ? `Are you sure you want to remove the mapping for vehicle "${deleteTarget.vehicleNum}"? This action cannot be undone.`
          : ''}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .delete-icon-btn { color: #dc2626 !important; }
        .delete-icon-btn:hover { background: #fee2e2 !important; }
      `}</style>
    </>
  );
};

export default VehicleMapping;