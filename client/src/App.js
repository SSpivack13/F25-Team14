import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();

  return (
    <div className="banner">
      <h1>About</h1>
      <button onClick={() => navigate('/profile')}>Profile</button>
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <Banner />
      {/* Rest of your home page content */}
    </div>
  );
}

function ProfilePage() {
  return (
    <div>
      <h1>Profile Page</h1>
      {/* Profile page content */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
