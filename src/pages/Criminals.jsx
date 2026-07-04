import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import CriminalForm from './CriminalForm';
import CriminalImageSearchModal from './CriminalImageSearchModal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getCriminalsApi,
  getCriminalsByOfficerApi,
  createCriminalApi,
  updateCriminalApi,
  updateCriminalImageApi,
  deleteCriminalApi,
  searchCriminalsApi,
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
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} criminals
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
  criminal_id:       '',
  criminal_name:     '',
  set_by_officer_id: '',
  alert_status:      '',
};

const PAGE_LIMIT = 10;

// ─── Component ───────────────────────────────────────────────────────────────
const Criminals = () => {
  const navigate = useNavigate();

  // Current page of records, as returned by the backend (never sliced client-side)
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);

  const [loading, setLoading]             = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // 'all' | 'search' | 'myProfile'
  const [viewMode, setViewMode] = useState('all');

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState(EMPTY_FILTERS);

  // Form modal
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingCriminal, setEditingCriminal] = useState(null);

  // Image / vector search modal
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Derived: is criminal_id filled? → lock other fields
  const criminalIdEntered = filters.criminal_id.trim() !== '';
  const otherFieldsLocked = criminalIdEntered;

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim ? v.trim() !== '' : v !== ''
  ).length;

  const isSearchMode    = viewMode === 'search';
  const isMyProfileMode = viewMode === 'myProfile';

  // ── Load a page of ALL records ────────────────────────────────────────────
  const loadAll = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await getCriminalsApi({ page: targetPage, limit: PAGE_LIMIT });
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
      setViewMode('all');
    } catch (err) {
      console.error('Failed to load criminals:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(1); }, [loadAll]);

  // ── Load a page of the logged-in officer's own criminals ("My Profile") ───
  const loadMyProfile = useCallback(async (targetPage = 1) => {
    const officerId = localStorage.getItem('officerId');
    if (!officerId) {
      console.error('No officer ID found. Please login again.');
      return;
    }
    setLoading(true);
    try {
      const res = await getCriminalsByOfficerApi(officerId, { page: targetPage, limit: PAGE_LIMIT });
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
      setViewMode('myProfile');
    } catch (err) {
      console.error('Failed to load my profile criminals:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Handle individual filter field change ─────────────────────────────────
  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'criminal_id' && value.trim() !== '') {
        next.criminal_name     = '';
        next.set_by_officer_id = '';
        next.alert_status      = '';
      }
      return next;
    });
  };

  // ── Clear all filters and reload ──────────────────────────────────────────
  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadAll(1);
  };

  // ── Run search (paginated) ─────────────────────────────────────────────────
  const runSearch = useCallback(async (targetPage = 1) => {
    const hasAny = Object.values(filters).some((v) => v.trim ? v.trim() !== '' : v !== '');
    if (!hasAny) { await loadAll(1); return; }

    setSearchLoading(true);
    try {
      const params = {
        criminal_id:       filters.criminal_id.trim(),
        criminal_name:     filters.criminal_name.trim(),
        set_by_officer_id: filters.set_by_officer_id.trim(),
        alert_status:      filters.alert_status,
        page:  targetPage,
        limit: PAGE_LIMIT,
      };
      const res = await searchCriminalsApi(params);
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
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

  // ── Page change ──────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    refreshCurrent(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    try {
      await createCriminalApi(formData);
      await refreshCurrent(1);
      closeModal();
    } catch (err) { console.error('Create criminal failed:', err); }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateCriminalApi(editingCriminal.criminal_id, formData);
      await refreshCurrent(page);
      closeModal();
    } catch (err) { console.error('Update criminal failed:', err); }
  };

  const handleImageOnly = async (criminalId, formData) => {
    try {
      await updateCriminalImageApi(criminalId, formData);
      await refreshCurrent(page);
    } catch (err) { console.error('Image update failed:', err); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCriminalApi(deleteTarget.criminal_id);
      const isLastOnPage = items.length === 1 && page > 1;
      await refreshCurrent(isLastOnPage ? page - 1 : page);
    } catch (err) { console.error('Delete criminal failed:', err); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const openCreateModal = () => { setEditingCriminal(null); setIsModalOpen(true); };
  const openEditModal   = (c)  => { setEditingCriminal(c);  setIsModalOpen(true); };
  const closeModal      = ()   => { setIsModalOpen(false);  setEditingCriminal(null); };
  const openDetailPage  = (id) => navigate(`/criminals/${id}`);

  const isActive = loading || searchLoading;

  const modeLabel = isSearchMode
    ? `${total} result${total !== 1 ? 's' : ''} found`
    : isMyProfileMode
      ? `${total} criminal${total !== 1 ? 's' : ''} added by you`
      : `${total} criminal${total !== 1 ? 's' : ''} total`;

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

            {/* Total count badge — always visible */}
            <span className="filter-result-count">{modeLabel}</span>

            {viewMode !== 'all' && (
              <button
                className="filter-clear-link"
                onClick={handleClearFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <BackIcon /> Back to all criminals
              </button>
            )}
          </div>

          <div className="criminals-header-right" style={{ display: 'flex', gap: 10 }}>
            <button
              className={`add-btn search-trigger-btn${isMyProfileMode ? ' filter-toggle-btn--active' : ''}`}
              onClick={() => loadMyProfile(1)}
            >
              <ProfileIcon /> My Profile
            </button>
            <button
              className="add-btn search-trigger-btn"
              onClick={() => setIsImageSearchOpen(true)}
            >
              <ImageSearchIcon /> Search by Image
            </button>
            <button className="add-btn" onClick={openCreateModal}>+ Add Criminal</button>
          </div>
        </div>

        {/* ── Horizontal Filter Panel ──────────────────────────────────────── */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-panel__header">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Search Criminals
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

              {/* 1. Criminal ID */}
              <div className="filter-field">
                <label className="filter-label">
                  Criminal ID
                  {criminalIdEntered && (
                    <span className="filter-lock-badge">🔒 other fields locked</span>
                  )}
                </label>
                <input
                  className="filter-input"
                  type="text"
                  placeholder="e.g. crm10001"
                  value={filters.criminal_id}
                  onChange={(e) => handleFilterChange('criminal_id', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {/* 2. Criminal Name */}
              <div className="filter-field">
                <label className="filter-label">Criminal Name</label>
                <input
                  className={`filter-input${otherFieldsLocked ? ' filter-input--locked' : ''}`}
                  type="text"
                  placeholder="Full or partial name"
                  value={filters.criminal_name}
                  disabled={otherFieldsLocked}
                  onChange={(e) => handleFilterChange('criminal_name', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {/* 3. Officer ID */}
              <div className="filter-field">
                <label className="filter-label">Officer ID</label>
                <input
                  className={`filter-input${otherFieldsLocked ? ' filter-input--locked' : ''}`}
                  type="text"
                  placeholder="e.g. off10009"
                  value={filters.set_by_officer_id}
                  disabled={otherFieldsLocked}
                  onChange={(e) => handleFilterChange('set_by_officer_id', e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {/* 4. Alert Status */}
              <div className="filter-field">
                <label className="filter-label">Alert Status</label>
                <select
                  className={`filter-input filter-select${otherFieldsLocked ? ' filter-input--locked' : ''}`}
                  value={filters.alert_status}
                  disabled={otherFieldsLocked}
                  onChange={(e) => handleFilterChange('alert_status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Search button */}
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

            {criminalIdEntered && (
              <p className="filter-id-tip">
                💡 Searching by <strong>Criminal ID</strong> — clear it to enable name / officer / status filters.
              </p>
            )}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="table-card">
          {isActive ? (
            <div className="loading-text">{searchLoading ? 'Searching…' : 'Loading…'}</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Alert Status</th>
                    <th>Officer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((criminal) => (
                    <tr key={criminal._id || criminal.criminal_id}>
                      <td>#{criminal.criminal_id}</td>
                      <td>
                        <div className="name-cell">
                          <span className="avatar avatar-red">
                            {criminal.criminal_name?.charAt(0) || 'C'}
                          </span>
                          {criminal.criminal_name}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${criminal.alert_status ? 'active' : 'inactive'}`}>
                          {criminal.alert_status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{criminal.set_by_officer_id}</td>
                      <td>
                        <div className="action-btns">
                          <button className="expand-icon-btn" title="View details"
                            onClick={() => openDetailPage(criminal.criminal_id)}>
                            <ExpandIcon />
                          </button>
                          <button className="edit-icon-btn" title="Edit"
                            onClick={() => openEditModal(criminal)}>✏️</button>
                          <button className="delete-icon-btn" title="Delete"
                            onClick={() => setDeleteTarget(criminal)}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {isSearchMode
                          ? 'No criminals match your search criteria.'
                          : isMyProfileMode
                            ? "You haven't added any criminal profiles yet."
                            : 'No criminal records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ── Pagination ── */}
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

      <CriminalForm
        isOpen={isModalOpen}
        criminal={editingCriminal}
        isEditing={Boolean(editingCriminal)}
        onClose={closeModal}
        onSubmit={editingCriminal ? handleUpdate : handleCreate}
        onSubmitImageOnly={handleImageOnly}
      />

      <CriminalImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Criminal Profile?"
        message={deleteTarget
          ? `Are you sure you want to delete "${deleteTarget.criminal_name}" (ID: #${deleteTarget.criminal_id})? This action cannot be undone.`
          : ''}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default Criminals;