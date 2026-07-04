import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import ConfirmDialog from '../components/ConfirmDialog';
import MissingPersonForm from './MissingPersonsForm';
import MissingPersonImageSearchModal from './MissingPersonImageSearchModal';
import {
  getMissingPersonsApi,
  getMissingPersonsByOfficerApi,
  createMissingPersonApi,
  updateMissingPersonApi,
  updateMissingPersonImageApi,
  deleteMissingPersonApi,
  searchMissingPersonsApi,
} from '../api/authApi';
import './TablePage.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const ExpandIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/>
    <polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/>
    <line x1="3"  y1="21" x2="10" y2="14"/>
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ImageSearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="14" height="14" rx="2"/>
    <circle cx="8" cy="9" r="1.8"/>
    <path d="M2 14l3.5-3.5L9 14"/>
    <circle cx="17.5" cy="17.5" r="3.2"/>
    <line x1="19.8" y1="19.8" x2="22" y2="22"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>
  </svg>
);

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ─── Pagination component ────────────────────────────────────────────────────
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
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} missing persons
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

// ─── Empty filter state ──────────────────────────────────────────────────────
const EMPTY_FILTERS = {
  person_name:   '',
  person_mobile: '',
  alert_status:  '',
};

const PAGE_LIMIT = 10;

// ─── Location resolver ────────────────────────────────────────────────────
// The real API nests location under person_state / person_district objects:
//   person_state:    { state_code, state_name }
//   person_district: { district_code, district_name, state_code }
// Flat state_name/district_name are checked too as a fallback.
function getLocationLabel(person) {
  const district =
    person.person_district?.district_name ||
    person.district_name ||
    '';
  const state =
    person.person_state?.state_name ||
    person.state_name ||
    '';
  return [district, state].filter(Boolean).join(', ');
}

// ─── Component ───────────────────────────────────────────────────────────────
const MissingPersons = () => {
  const navigate = useNavigate();

  // Only the CURRENT page's records live here — never the whole dataset
  const [persons, setPersons] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const [loading, setLoading]             = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError]                 = useState(null);

  // 'all' | 'search' | 'myProfile'
  const [viewMode, setViewMode] = useState('all');

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState(EMPTY_FILTERS);

  // Edit modal
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  // Image / vector search modal
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim ? v.trim() !== '' : v !== ''
  ).length;

  const isSearchMode    = viewMode === 'search';
  const isMyProfileMode = viewMode === 'myProfile';

  // ── Load ONE page of ALL records — GET /missingpersons?page=&limit=&sortBy=&order=
  const loadAll = useCallback(async (pageArg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMissingPersonsApi({
        page: pageArg,
        limit: PAGE_LIMIT,
        sortBy: 'created_at',
        order: 'desc',
      });
      setPersons(result.data);
      setTotal(result.total);
      setPage(result.page);
      setViewMode('all');
    } catch (err) {
      console.error('Failed to load missing persons:', err);
      setError(err.message || 'Failed to load missing person records.');
      setPersons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(1); }, [loadAll]);

  // ── Load ONE page of the logged-in officer's own reports —
  //    GET /missingpersons/officer/:officerId?page=&limit=&sortBy=&order= ────
  const loadMyProfile = useCallback(async (pageArg = 1) => {
    const officerId = localStorage.getItem('officerId');
    if (!officerId) {
      console.error('No officer ID found. Please login again.');
      setError('No officer ID found. Please login again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getMissingPersonsByOfficerApi(officerId, {
        page: pageArg,
        limit: PAGE_LIMIT,
        sortBy: 'created_at',
        order: 'desc',
      });
      setPersons(result.data);
      setTotal(result.total);
      setPage(result.page);
      setViewMode('myProfile');
    } catch (err) {
      console.error('Failed to load my missing person reports:', err);
      setError(err.message || 'Failed to load your missing person reports.');
      setPersons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadAll(1);
  };

  // ── Run search (server-side paginated) ─────────────────────────────────────
  const runSearch = useCallback(async (pageArg = 1) => {
    const hasAny = Object.values(filters).some((v) => v.trim ? v.trim() !== '' : v !== '');
    if (!hasAny) { await loadAll(1); return; }

    setSearchLoading(true);
    try {
      const result = await searchMissingPersonsApi({
        person_name:   filters.person_name.trim(),
        person_mobile: filters.person_mobile.trim(),
        alert_status:  filters.alert_status,
        page: pageArg,
        limit: PAGE_LIMIT,
      });
      setPersons(result.data);
      setTotal(result.total);
      setPage(result.page);
      setViewMode('search');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [filters, loadAll]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') runSearch(1);
  };

  // ── Refresh whatever view is currently active ──────────────────────────────
  const refreshCurrent = useCallback(async (targetPage) => {
    if (viewMode === 'search')    return runSearch(targetPage);
    if (viewMode === 'myProfile') return loadMyProfile(targetPage);
    return loadAll(targetPage);
  }, [viewMode, runSearch, loadMyProfile, loadAll]);

  // ── Page change — re-fetches from backend, no client slicing ──────────────
  const handlePageChange = (newPage) => {
    refreshCurrent(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Create (POST /missingperson) ────────────────────────────────────────
  const openCreateModal = () => { setEditingPerson(null); setIsModalOpen(true); };

  // ── Edit (PUT /missingperson/:id) ───────────────────────────────────────
  const openEditModal = (person) => { setEditingPerson(person); setIsModalOpen(true); };
  const closeModal    = ()        => { setIsModalOpen(false);   setEditingPerson(null); };

  const handleCreate = async (formData) => {
    try {
      await createMissingPersonApi(formData);
      await refreshCurrent(1);
      closeModal();
    } catch (err) { console.error('Create missing person failed:', err); }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateMissingPersonApi(editingPerson.person_id, formData);
      await refreshCurrent(page);
      closeModal();
    } catch (err) { console.error('Update missing person failed:', err); }
  };

  // Image-only PUT (used internally by MissingPersonForm when only the photo changed)
  const handleImageOnly = async (personId, formData) => {
    try {
      await updateMissingPersonImageApi(personId, formData);
      await refreshCurrent(page);
    } catch (err) { console.error('Image update failed:', err); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMissingPersonApi(deleteTarget.person_id);
      const isLastOnPage = persons.length === 1 && page > 1;
      await refreshCurrent(isLastOnPage ? page - 1 : page);
    } catch (err) { console.error('Delete missing person failed:', err); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  // ── Expand icon → navigate to detail page, which fetches via
  //    GET /missingperson/:id (getMissingPersonByIdApi-style call) ──────────
  const openDetailPage = (id) => navigate(`/missingpersons/${id}`);

  const isActive = loading || searchLoading;

  const modeLabel = isSearchMode
    ? `${total} result${total !== 1 ? 's' : ''} found`
    : isMyProfileMode
      ? `${total} missing person${total !== 1 ? 's' : ''} reported by you`
      : `${total} missing person${total !== 1 ? 's' : ''} total`;

  return (
    <>
      <Header />
      <NavbarHome />
      <div className="table-page">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="table-header">
          <div className="criminals-header-left">
            <button
              className={`filter-toggle-btn${showFilters ? ' filter-toggle-btn--active' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>

            <span className="filter-result-count">{modeLabel}</span>

            {viewMode !== 'all' && (
              <button
                className="filter-clear-link"
                onClick={handleClearFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <BackIcon /> Back to all missing persons
              </button>
            )}
          </div>

          <div className="criminals-header-right" style={{ display: 'flex', gap: 10 }}>
            <button
              className={`add-btn search-trigger-btn${isMyProfileMode ? ' filter-toggle-btn--active' : ''}`}
              onClick={() => loadMyProfile(1)}
            >
              <ProfileIcon /> My List
            </button>
            <button
              className="add-btn search-trigger-btn"
              onClick={() => setIsImageSearchOpen(true)}
            >
              <ImageSearchIcon /> Search by Image
            </button>
            <button className="add-btn" onClick={openCreateModal}>+ Add Missing Report</button>
          </div>
        </div>

        {/* ── Horizontal Filter Panel ──────────────────────────────────────── */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-panel__header">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Search Missing Persons
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
                <label className="filter-label">Name</label>
                <input
                  className="filter-input"
                  type="text"
                  placeholder="Full or partial name"
                  value={filters.person_name}
                  onChange={(e) => handleFilterChange('person_name', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              <div className="filter-field">
                <label className="filter-label">Mobile Number</label>
                <input
                  className="filter-input"
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={filters.person_mobile}
                  onChange={(e) => handleFilterChange('person_mobile', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              <div className="filter-field">
                <label className="filter-label">Alert Status</label>
                <select
                  className="filter-input filter-select"
                  value={filters.alert_status}
                  onChange={(e) => handleFilterChange('alert_status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
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

        {/* ── Table ────────────────────────────────────────────────────────── */}
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
                    <th>ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Alert Status</th>
                    <th>Location</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {persons.length > 0 ? persons.map((person) => (
                    <tr key={person._id || person.person_id}>
                      <td>#{person.person_id}</td>
                      <td>
                        <div className="name-cell">
                          <span className="avatar avatar-red">
                            {person.person_name?.charAt(0) || 'P'}
                          </span>
                          {person.person_name}
                        </div>
                      </td>
                      <td>{person.person_mobile}</td>
                      <td>
                        <span className={`status-badge ${person.alert_status ? 'active' : 'inactive'}`}>
                          {person.alert_status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{getLocationLabel(person) || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                      <td>
                        <div className="action-btns">
                          <button className="expand-icon-btn" title="View details"
                            onClick={() => openDetailPage(person.person_id)}>
                            <ExpandIcon />
                          </button>
                          <button className="edit-icon-btn" title="Edit"
                            onClick={() => openEditModal(person)}>✏️</button>
                          <button className="delete-icon-btn" title="Delete"
                            onClick={() => setDeleteTarget(person)}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {isSearchMode
                          ? 'No missing persons match your search criteria.'
                          : isMyProfileMode
                            ? "You haven't reported any missing persons yet."
                            : 'No missing person records found.'}
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

      {/* ── Create modal → POST /missingperson
             Edit modal   → PUT /missingperson/:id
                            (or /missingperson/:id/image when only the photo changed) ── */}
      <MissingPersonForm
        isOpen={isModalOpen}
        person={editingPerson}
        isEditing={Boolean(editingPerson)}
        onClose={closeModal}
        onSubmit={editingPerson ? handleUpdate : handleCreate}
        onSubmitImageOnly={handleImageOnly}
      />

      {/* ── Image/vector search modal → POST /search/missingperson ── */}
      <MissingPersonImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Missing Person Record?"
        message={deleteTarget
          ? `Are you sure you want to delete "${deleteTarget.person_name}" (ID: #${deleteTarget.person_id})? This action cannot be undone.`
          : ''}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default MissingPersons;