import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import bannerImg from '../assets/image.png';
import { loginApi } from '../api/authApi';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const data = await loginApi(officerId, password);

    // Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('officerId', officerId);

    // Special routing: this specific officer gets the Missing Persons dashboard
    if (officerId.trim().toUpperCase() === 'OFF10010') {
      navigate('/missing-home');
    } else {
      navigate('/home');
    }
  } catch (err) {
    setError(err.message || 'Invalid Officer ID or Password');
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <Header />

      <div className="login-page">
        {/* Banner section */}
        <div className="login-banner">
          <img src={bannerImg} alt="Banner" />
        </div>

        {/* Login section */}
        <div className="login-form">
          <form onSubmit={handleSubmit}>

            <h2>Login</h2>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <label>Officer ID</label>
            <input
              type="text"
              placeholder="Enter Officer ID"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}