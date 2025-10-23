import React from 'react';
import { useNavigate } from 'react-router-dom';

//Banner function for each page (Manaager, Sponsor, Admin, Catalog)
function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  // Navigation button for profile page, is based on user type
  // Done this way so different user types can have different profile page options (e.g., admins can add users)
  const goProfile = () => {
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = user?.USER_TYPE;
      
      if (userType === 'admin') {
        navigate('/admin');
      } else if (userType === 'sponsor') {
        navigate('/sponsor');
      } else {
        navigate('/profile');
      }
    } else {
      navigate('/login', { state: { redirectTo: '/profile' } });
    }
  };

  const goCatalog = () => {
    if (isLoggedIn) {
      navigate('/catalog');
    } else {
      navigate('/login', { state: { redirectTo: '/catalog' } });
    }
  };

  const goNotifications = () => {
    if (isLoggedIn) {
      navigate('/notifications');
    } else {
      navigate('/login', { state: { redirectTo: '/notifications' } });
    }
  };

  return (
    <div className="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1>Talladega Nights</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')}>Home</button>
          {isLoggedIn === true ? (
            <button onClick={goCatalog}>Catalog</button>
          ) : null}
        </div>
      </div>
      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={goProfile}>Profile</button>
            <button onClick={goNotifications}>Notifications</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </div>
  );
}

export default Banner;