import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import './Home.css';

export default function Home() {
  const stats = [
    { label: 'Total Officers', value: 128, icon: '👮', color: '#2563eb' },
    { label: 'Active Officers', value: 102, icon: '✅', color: '#16a34a' },
    { label: 'Total Criminals', value: 340, icon: '🚨', color: '#dc2626' },
    { label: 'Pending Cases', value: 57, icon: '📁', color: '#ea580c' },
  ];

  return (
    <>
      <Header />
      <NavbarHome />
      <div className="home-content">
        <div className="welcome-banner">
          <h1>Welcome to NCAS Dashboard</h1>
          <p>National Criminal & Administration System — Overview</p>
        </div>

        <div className="cards-grid">
          {stats.map((item, idx) => (
            <div className="stat-card" key={idx} style={{ borderTopColor: item.color }}>
              <div className="stat-icon" style={{ background: `${item.color}1A`, color: item.color }}>
                {item.icon}
              </div>
              <div className="stat-info">
                <p className="stat-label">{item.label}</p>
                <h2 className="stat-value">{item.value}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Recent Activity</h3>
            <ul>
              <li><span className="dot blue"></span> New officer added — Priya Sharma</li>
              <li><span className="dot red"></span> Criminal record updated — FIR-2024-104</li>
              <li><span className="dot green"></span> Case marked resolved — FIR-2024-098</li>
              <li><span className="dot orange"></span> New criminal entry — Suresh Nair</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Quick Links</h3>
            <div className="quick-links">
              <a href="/officers" className="quick-btn">Manage Officers</a>
              <a href="/criminals" className="quick-btn">Manage Criminals</a>
              <a href="/home" className="quick-btn">View Reports</a>
              <a href="/home" className="quick-btn">Settings</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}