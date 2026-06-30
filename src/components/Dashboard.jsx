import bannerImg from '../assets/banner.png';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-content">
      <h1>Welcome to NCAS</h1>
      <h2>National Criminal Alert System</h2>

      <div className="banner-image">
        <img src={bannerImg} alt="Banner" />
      </div>
    </div>
  );
}