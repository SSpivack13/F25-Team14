import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const goManager = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login', { state: { redirectTo: '/profile' } });
    }
  };

  const goSponsor = () => {
    if (isLoggedIn) {
      navigate('/sponsor');
    } else {
      navigate('/login', { state: { redirectTo: '/sponsor' } });
    }
  };

  const goAdmin = () => {
    if (isLoggedIn) {
      navigate('/admin');
    } else {
      navigate('/login', { state: { redirectTo: '/admin' } });
    }
  };

  const goCatalog = () => {
    if (isLoggedIn) {
      navigate('/catalog');
    } else {
      navigate('/login', { state: { redirectTo: '/catalog' } });
    }
  };

  return (
    <div className="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1>Talladega Nights</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={goCatalog}>Catalog</button>
        </div>
      </div>
      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={goManager}>Manager Profile</button>
            <button onClick={goSponsor}>Sponsor Profile</button>
            <button onClick={goAdmin}>Admin Profile</button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </div>
  );
}

export default Banner;
