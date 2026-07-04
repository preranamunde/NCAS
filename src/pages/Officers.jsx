import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import OfficerForm from './OfficerForm';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getOfficersApi,
  createOfficerApi,
  updateOfficerApi,
  updateOfficerImageApi,
  deleteOfficerApi,
  searchOfficersApi,
} from '../api/authApi';
import './TablePage.css';

const EMPTY_FILTERS = {
  officer_name:     '',
  officer_surname:  '',
  officer_location: '',
};

const PAGE_LIMIT = 10;

// ── Pagination component (identical to Vehicles.jsx) ──────────────────────
function Pagination({ total, page, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px', borderTop: '0.5px solid #e4e8ef',
      background: '#fafbfc', borderRadius: '0 0 12px 12px',
      flexWrap: 'wrap', gap: 10,
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} officers
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{
            height: 34, padding: '0 12px',
            border: '0.5px solid #d1d5db', borderRadius: 7,
            background: '#fff', fontSize: 13, fontWeight: 500,
            color: page === 1 ? '#9ca3af' : '#374151',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            opacity: page === 1 ? 0.5 : 1,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          ← Previous
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...'
            ? (
              <span key={`e-${idx}`} style={{
                padding: '0 4px', color: '#9ca3af', fontSize: 14, userSelect: 'none',
              }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => p !== page && onPageChange(p)}
                style={{
                  height: 34, minWidth: 34, padding: '0 10px',
                  border: p === page ? '0.5px solid #003366' : '0.5px solid #e2e8f0',
                  borderRadius: 7,
                  background: p === page ? '#003366' : '#fff',
                  color: p === page ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: p === page ? 600 : 400,
                  cursor: p === page ? 'default' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {p}
              </button>
            )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{
            height: 34, padding: '0 12px',
            border: '0.5px solid #d1d5db', borderRadius: 7,
            background: '#fff', fontSize: 13, fontWeight: 500,
            color: page === totalPages ? '#9ca3af' : '#374151',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            opacity: page === totalPages ? 0.5 : 1,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Main Officers page ─────────────────────────────────────────────────────
export default function Officers() {
  const navigate = useNavigate();

  // Only the CURRENT page's records live here — never the whole dataset
  const [officers, setOfficers]           = useState([]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode]   = useState(false);
  const [error, setError]                 = useState(null);

  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);

  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const activeFilterCount = Object.values(filters).filter(v => v.trim()).length;

  // ── Load ONE page from the backend — GET /officers?page=&limit=&sortBy=&order=
  const loadData = useCallback(async (pageArg = 1) => {
    setLoading(true);
    setError(null);
    setIsSearchMode(false);
    try {
      const result = await getOfficersApi({
        page: pageArg,
        limit: PAGE_LIMIT,
        sortBy: 'created_at',
        order: 'desc',
      });
      setOfficers(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      console.error('Failed to load officers:', err);
      setError(err.message || 'Failed to load officer records.');
      setOfficers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(1); }, [loadData]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  // ── Run search (server-side paginated) ─────────────────────────────────────
  const runSearch = useCallback(async (pageArg = 1) => {
    const hasFilter = Object.values(filters).some(v => v.trim());
    if (!hasFilter) { await loadData(1); return; }

    setSearchLoading(true);
    setIsSearchMode(true);
    try {
      const result = await searchOfficersApi({
        officer_name:     filters.officer_name.trim(),
        officer_surname:  filters.officer_surname.trim(),
        officer_location: filters.officer_location.trim(),
        page: pageArg,
        limit: PAGE_LIMIT,
      });
      setOfficers(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      console.error('Officer search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, loadData]);

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') runSearch(1); };

  const handleClearFilters = () => { setFilters(EMPTY_FILTERS); loadData(1); };

  // ── Page change — re-fetches from backend, no client slicing ──────────────
  const handlePageChange = (newPage) => {
    if (isSearchMode) runSearch(newPage); else loadData(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (fd) => {
    await createOfficerApi(fd);
    await loadData(1);
  };

  const handleUpdate = async (fd) => {
    await updateOfficerApi(editingOfficer.officer_id, fd);
    if (isSearchMode) await runSearch(page); else await loadData(page);
  };

  const handleImageOnly = async (id, fd) => {
    await updateOfficerImageApi(id, fd);
    if (isSearchMode) await runSearch(page); else await loadData(page);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteOfficerApi(deleteTarget.officer_id);
      const isLastOnPage = officers.length === 1 && page > 1;
      const targetPage = isLastOnPage ? page - 1 : page;
      if (isSearchMode) await runSearch(targetPage); else await loadData(targetPage);
    } catch (err) {
      console.error('Delete officer failed:', err);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const openCreateModal = () => { setEditingOfficer(null); setIsModalOpen(true); };
  const openEditModal   = (o) => { setEditingOfficer(o);   setIsModalOpen(true); };
  const closeModal      = () => { setIsModalOpen(false);   setEditingOfficer(null); };
  const openDetailPage  = (id) => navigate(`/officers/${id}`);

  const isActive = loading || searchLoading;

  // ── Icons ──
  const ExpandIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
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
  const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const FilterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );

  return (
    <>
      <Header />
      <NavbarHome />
      <div className="table-page">

        {/* ── Top bar ── */}
        <div className="table-header">
          <div className="criminals-header-left">
            <button
              className={`filter-toggle-btn${showFilters ? ' filter-toggle-btn--active' : ''}`}
              onClick={() => setShowFilters(p => !p)}
            >
              <FilterIcon />
              Search / Filter
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>

            <span className="filter-result-count">
              {isSearchMode
                ? `${total} result${total !== 1 ? 's' : ''} found`
                : `${total} officer${total !== 1 ? 's' : ''} total`}
            </span>
          </div>

          <button className="add-btn" onClick={openCreateModal}>+ Add Officer</button>
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-panel__header">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Search Officers
              </span>
              <button
                className="filter-clear-link"
                onClick={handleClearFilters}
                disabled={activeFilterCount === 0}
              >
                ✕ Clear all
              </button>
            </div>

            <div className="filter-row">
              <div className="filter-field">
                <label className="filter-label">First Name</label>
                <input
                  className="filter-input"
                  placeholder="e.g. Aseem"
                  value={filters.officer_name}
                  onChange={e => setFilter('officer_name', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              <div className="filter-field">
                <label className="filter-label">Surname</label>
                <input
                  className="filter-input"
                  placeholder="e.g. Kaur"
                  value={filters.officer_surname}
                  onChange={e => setFilter('officer_surname', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              <div className="filter-field">
                <label className="filter-label">Location</label>
                <input
                  className="filter-input"
                  placeholder="e.g. Delhi"
                  value={filters.officer_location}
                  onChange={e => setFilter('officer_location', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              <div className="filter-field filter-field--btn">
                <label className="filter-label" style={{ visibility: 'hidden' }}>Search</label>
                <button
                  className="add-btn filter-search-inline-btn"
                  style={{ background: 'linear-gradient(135deg,#005090,#0070c0)', whiteSpace: 'nowrap' }}
                  onClick={() => runSearch(1)}
                  disabled={searchLoading || activeFilterCount === 0}
                >
                  <SearchIcon />
                  {searchLoading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="table-card">
          {isActive ? (
            <div className="loading-text">{searchLoading ? 'Searching…' : 'Loading…'}</div>
          ) : error ? (
            <div className="loading-text">⚠️ {error}</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Designation</th>
                    <th>Department</th><th>HQ</th><th>Location</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.length > 0 ? officers.map((officer) => (
                    <tr key={officer._id ?? officer.officer_id}>
                      <td>#{officer.officer_id}</td>
                      <td>
                        <div className="name-cell">
                          <span className="avatar">{officer.officer_name?.charAt(0)}</span>
                          {officer.officer_name} {officer.officer_surname}
                        </div>
                      </td>
                      <td><span className="rank-badge">{officer.officer_designation}</span></td>
                      <td>{officer.officer_dept}</td>
                      <td>{officer.officer_hqrs}</td>
                      <td>{officer.officer_location}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className="edit-icon-btn" title="View details"
                            onClick={() => openDetailPage(officer.officer_id)}
                            style={{ display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', padding: '4px 6px' }}>
                            <ExpandIcon />
                          </button>
                          <button className="edit-icon-btn" title="Edit"
                            onClick={() => openEditModal(officer)}>✏️</button>
                          <button className="edit-icon-btn delete-icon-btn" title="Delete"
                            onClick={() => setDeleteTarget(officer)}
                            style={{ display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', padding: '4px 6px' }}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {isSearchMode
                          ? 'No officers match your search criteria.'
                          : 'No officer records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                total={total}
                page={page}
                limit={PAGE_LIMIT}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      <OfficerForm
        isOpen={isModalOpen}
        officer={editingOfficer}
        isEditing={!!editingOfficer}
        onClose={closeModal}
        onSubmit={editingOfficer ? handleUpdate : handleCreate}
        onSubmitImageOnly={handleImageOnly}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Officer?"
        message={deleteTarget
          ? `Are you sure you want to delete "${deleteTarget.officer_name} ${deleteTarget.officer_surname}" (ID: #${deleteTarget.officer_id})? This action cannot be undone.`
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
}