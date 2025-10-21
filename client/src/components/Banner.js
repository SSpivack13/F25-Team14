import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

 const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  return (
    <div className="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1>Talladega Nights</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/catalog')}>Catalog</button>
        </div>
      </div>
      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={() => navigate('/profile')}>Profile</button>
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
