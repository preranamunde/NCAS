import { useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import ProfileModal from './ProfileModal/ProfileModal';
import { getMyProfileApi, logoutApi } from '../api/authApi';
import './NavbarHome.css';

export default function NavbarHome() {
  const navigate = useNavigate();
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  // ── True ONLY on OFF10010's dedicated section: /missing-home,
  //    /missing/add-report, /missing/list.
  //    NOTE: this must NOT match /missing-persons (the normal officers'
  //    Missing Persons list page) — that page keeps the full navbar. ──────
  const isMissingSection =
    location.pathname === '/missing-home' ||
    location.pathname.startsWith('/missing/');

  // Fetch profile only on first open
  const handleProfileClick = useCallback(async () => {
    setModalOpen(true);
    if (profile) return; // already loaded — skip fetch

    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfileApi();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('[NavbarHome] Logout API error:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('officerId');
      setProfile(null);
      setModalOpen(false);
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <nav className="navbar-home">
        <ul className="nav-links-home">
          {isMissingSection ? (
            <>
              <li>
                <NavLink to="/missing/add-report" className={({ isActive }) => isActive ? 'active' : ''}>
                  Report Missing Person
                </NavLink>
              </li>
              <li>
                <NavLink to="/missing/list" className={({ isActive }) => isActive ? 'active' : ''}>
                  View Missing Persons
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/officers" className={({ isActive }) => isActive ? 'active' : ''}>
                  Officers
                </NavLink>
              </li>
              <li>
                <NavLink to="/criminals" className={({ isActive }) => isActive ? 'active' : ''}>
                  Criminals
                </NavLink>
              </li>
              <li>
                <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'active' : ''}>
                  Vehicles
                </NavLink>
              </li>
              <li>
                <NavLink to="/vehicle-mapping" className={({ isActive }) => isActive ? 'active' : ''}>
                  Vehicle Mapping
                </NavLink>
              </li>
              <li>
                <NavLink to="/missing-persons" className={({ isActive }) => isActive ? 'active' : ''}>
                  Missing Persons
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Profile icon button — always shown, both sections */}
        <button
          className="profile-icon-btn"
          onClick={handleProfileClick}
          aria-label="Open profile"
          title="My Profile"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
      </nav>

      <ProfileModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onLogout={handleLogout}
        profile={profile}
        loading={loading}
        error={error}
      />
    </>
  );
}