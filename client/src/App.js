import './App.css';
import './Template.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CatalogPage from './Catalog';
import Banner from './components/Banner';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SponsorProfilePage from './components/SponsorProfilePage';
import PointsPage from './components/PointsPage';
import AdminProfilePage from './components/AdminProfilePage';
import AdminAddUser from './components/AdminAddUser';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <div>
              <Banner />
              <HomePage />
            </div>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sponsor" element={<SponsorProfilePage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin" element={<AdminProfilePage />} />
          <Route path="/admin/adduser" element={<AdminAddUser />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;