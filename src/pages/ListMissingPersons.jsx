import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import { getMissingPersonsByOfficerApi } from '../api/authApi';
import './ListMissingPersons.css';

// Officer whose reports this page lists — "Read Persons by Officer".
const OFFICER_ID = 'off10010';

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

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
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

// ─── Empty filter state ──────────────────────────────────────────────────────
const EMPTY_FILTERS = {
  person_name:   '',
  person_mobile: '',
  alert_status:  '',
};

const DEFAULT_LIMIT = 10;

// ── Build a usable <img> src from whatever the API gives us. ──
//    The list endpoint returns a bare filename (e.g. "person_image-...jpg"),
//    not a full URL, so it needs to be resolved against the uploads path.
//    If the backend ever starts returning a full URL (http/https) or an
//    already-rooted path ("/uploads/..."), this passes it through as-is.
function resolveImageSrc(filename) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename) || filename.startsWith('/')) return filename;
  return `/uploads/${filename}`;
}

export default function ListMissingPersons() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Pagination — mirrors the officer/vehicle list pages ──
  const [page, setPage]   = useState(1);
  const [limit]            = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState(EMPTY_FILTERS);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim ? v.trim() !== '' : v !== ''
  ).length;

  // ── Load reports for OFFICER_ID — GET /missingpersons/officer/:officerId ──
  //    Response shape: { success, count, total, page, limit, sort, data: [...] }
  //    getMissingPersonsByOfficerApi() normalizes this to { data, total, page, limit }.
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMissingPersonsByOfficerApi(OFFICER_ID, { page, limit });
      setReports(Array.isArray(res.data) ? res.data : []);
      setTotal(Number(res.total ?? 0));
    } catch (err) {
      setError(err.message || 'Failed to load missing person reports.');
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  // ── Client-side filtering over the current page's report set ──────
  //    (no additional API calls — filters run against `reports` in memory)
  const filteredReports = useMemo(() => {
    const nameQ   = filters.person_name.trim().toLowerCase();
    const mobileQ = filters.person_mobile.trim();
    const alertQ  = filters.alert_status;

    return reports.filter((r) => {
      if (nameQ && !(r.person_name || '').toLowerCase().includes(nameQ)) return false;
      if (mobileQ && !(r.person_mobile || '').includes(mobileQ)) return false;
      if (alertQ !== '' && String(!!r.alert_status) !== alertQ) return false;
      return true;
    });
  }, [reports, filters]);

  const isSearchMode = activeFilterCount > 0;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  // ── View a single report — navigate to full detail page ──
  const handleView = (personId) => {
    navigate(`/missing/details/${personId}`);
  };

  // ── Edit a report — navigate to AddMissingReport in edit mode ──
  const handleEdit = (personId) => {
    navigate(`/missing/add-report/${personId}`);
  };

  // ── Safely format a date value. Returns null (rendered as "—") for anything
  //    that isn't a valid date.
  const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="list-page">

        {/* Top bar */}
        <div className="list-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>List of Missing Persons</h2>
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
          </div>
          <p>
            {isSearchMode
              ? `${filteredReports.length} result${filteredReports.length !== 1 ? 's' : ''} found (this page)`
              : `${total} case${total !== 1 ? 's' : ''} reported`}
          </p>
        </div>

        {/* Filter panel — filters the in-memory report list, no extra API calls */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-panel__header">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Filter Missing Persons
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
                  disabled
                  title="Filtering is applied automatically as you type"
                >
                  <SearchIcon />
                  Filter
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">
              <p>Loading…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p>⚠️ {error}</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <p>
                {isSearchMode
                  ? 'No missing persons match your filters.'
                  : 'No missing person records found for this officer.'}
              </p>
            </div>
          ) : (
            <table className="missing-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Father's Name</th>
                  <th>District</th>
                  <th>State</th>
                  <th>Pincode</th>
                  <th>Reported On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  // Prefer whatever full URL the API already returns; only
                  // fall back to building one from a bare filename.
                  const imgSrc = resolveImageSrc(
                    report.person_image_url || report.image_url || report.person_image
                  );

                  // Widened fallback chain so we pick up whatever date field the
                  // backend actually sends. formatDate() rejects anything that
                  // isn't a valid date and returns null, which renders as "—".
                  const reportedOn = formatDate(
                    report.created_at ||
                    report.createdAt ||
                    report.reportedAt ||
                    report.reported_at ||
                    report.reported_on ||
                    report.report_date ||
                    report.date_created ||
                    report.timestamp
                  );

                  return (
                    <tr key={report._id || report.person_id}>
                      <td>
                        <div className="thumb">
                          {imgSrc ? (
                            <img src={imgSrc} alt={report.person_name} />
                          ) : (
                            <span className="no-thumb">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="name-cell">{report.person_name}</td>
                      <td>{report.person_fname}</td>
                      <td>{report.person_district?.district_name || report.district_name}</td>
                      <td>{report.person_state?.state_name || report.state_name}</td>
                      <td>{report.person_pincode}</td>
                      <td>{reportedOn || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="expand-icon-btn"
                            title="View details"
                            onClick={() => handleView(report.person_id)}
                          >
                            <ExpandIcon />
                          </button>
                          <button
                            className="edit-icon-btn"
                            title="Edit"
                            onClick={() => handleEdit(report.person_id)}
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination — only meaningful when not actively filtering client-side */}
        {!loading && !error && total > limit && (
          <div className="pagination-bar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginTop: 16,
          }}>
            <button
              className="filter-toggle-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="filter-toggle-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}