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
import AdjustPointsPage from './components/AdjustPointsPage';
import AdminLogsPage from './components/AdminLogsPage';
import AdminTransactionsPage from './components/AdminTransactionsPage';
import AdminAddUser from './components/AdminAddUser';
import UpdateUser from './components/UpdateUser';
import NotificationsPage from './components/NotificationsPage';
import Cart from './components/cart';
import Organizations from './components/Organizations';

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
          <Route path="/adjust-points" element={<AdjustPointsPage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin" element={<AdminProfilePage />} />
          <Route path="/admin/logs" element={<AdminLogsPage />} />
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/adduser" element={<AdminAddUser />} />
          <Route path="/admin/updateuser" element={<UpdateUser />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/organizations" element={<Organizations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
