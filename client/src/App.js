import './App.css';
import './Template.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Catalog from './components/catalogue';
import Banner from './components/Banner';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SponsorProfilePage from './components/SponsorProfilePage';
import PointsPage from './components/PointsPage';
import AdminProfilePage from './components/AdminProfilePage';
import AdminAddUser from './components/AdminAddUser';
import UpdateUser from './components/UpdateUser';
import NotificationsPage from './components/NotificationsPage';

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
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sponsor" element={<SponsorProfilePage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin" element={<AdminProfilePage />} />
          <Route path="/admin/adduser" element={<AdminAddUser />} />
          <Route path="/admin/updateuser" element={<UpdateUser />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;