import Header from '../components/Header';
import NavbarHome from '../components/NavbarHome';
import './MissingHomePage.css';

export default function MissingHomePage() {
  const officerName = localStorage.getItem('officerName') || 'Rajesh Kumar';

  return (
    <>
      <Header />
      <NavbarHome />

      <div className="dashboard-wrap">
        {/* Hero strip */}
        <div className="hero-strip">
          <div className="hero-left">
            <span className="hero-tag">🛡️ Officer Console</span>
            <h1>Welcome back, {officerName}</h1>
            <p>Track, file, and manage missing person cases from one place.</p>
          </div>
          <div className="hero-stats">
            <div className="stat-box">
              <span className="stat-num">128</span>
              <span className="stat-label">Active Cases</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">42</span>
              <span className="stat-label">Resolved</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">9</span>
              <span className="stat-label">New Today</span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="recent-activity">
          <div className="recent-activity__header">
            <h2>Recent Activity</h2>
            <p>Latest updates across missing person cases</p>
          </div>

          <div className="activity-list">
            <div className="activity-row">
              <div className="activity-icon icon-blue">📝</div>
              <div className="activity-text">
                <h4>New report filed — Ramesh Yadav</h4>
                <p>Reported missing from Lucknow, Uttar Pradesh</p>
              </div>
              <span className="activity-time">2h ago</span>
            </div>

            <div className="activity-row">
              <div className="activity-icon icon-green">✅</div>
              <div className="activity-text">
                <h4>Case resolved — Sunita Devi</h4>
                <p>Marked as found and reunited with family</p>
              </div>
              <span className="activity-time">5h ago</span>
            </div>

            <div className="activity-row">
              <div className="activity-icon icon-blue">✏️</div>
              <div className="activity-text">
                <h4>Report updated — Arjun Mehta</h4>
                <p>Added new address and contact details</p>
              </div>
              <span className="activity-time">1d ago</span>
            </div>

            <div className="activity-row">
              <div className="activity-icon icon-red">📋</div>
              <div className="activity-text">
                <h4>New alert raised — Priya Sharma</h4>
                <p>Case escalated in Kanpur district</p>
              </div>
              <span className="activity-time">2d ago</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}