import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Home from './pages/Home';
import Officers from './pages/Officers';
import Criminals from './pages/Criminals';
import Vehicles from './pages/Vehicles';
import VehicleMapping from './pages/VehicleMapping/VehicleMapping';
import OfficerDetailPage from './pages/OfficerDetailPage';
import CriminalDetailPage from './pages/CriminalDetailPage';
import VehicleDetail from './pages/VehicleDetail';
import './App.css';
import VehicleMappingDetail from './pages/VehicleMappingDetail';

function LandingPage() {
  return (
    <>
      <Header />
      <Navbar />
      <Dashboard />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<LandingPage />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/home"            element={<Home />} />
        <Route path="/officers"        element={<Officers />} />
        <Route path="/criminals"       element={<Criminals />} />
        <Route path="/vehicles"        element={<Vehicles />} />
        <Route path="/vehicle-mapping" element={<VehicleMapping />} />
        <Route path="/officers/:id" element={<OfficerDetailPage />} />
        <Route path="/criminals/:id" element={<CriminalDetailPage />} />
        <Route path="/vehicles/:vehicleNumber" element={<VehicleDetail />} />
        <Route path="/vehicle-mapping/:mappingId" element={<VehicleMappingDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;