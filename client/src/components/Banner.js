import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const goManager = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login', { state: { redirectTo: '/profile' } });
    }
  };
  const goSponsor = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/sponsor');
    } else {
      navigate('/login', { state: { redirectTo: '/sponsor' } });
    }
  };
  const goAdmin = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/admin');
    } else {
      navigate('/login', { state: { redirectTo: '/admin' } });
    }
  };
  const goCatalog = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/catalog');
    } else {
      navigate('/login', { state: { redirectTo: '/catalog' } });
    }
  };

  return (
    <div className="banner">
      <h1>Talladega Nights</h1>
      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={goCatalog}>Catalog</button>
        <button onClick={goManager}>Manager Profile</button>
        <button onClick={goSponsor}>Sponsor Profile</button>
        <button onClick={goAdmin}>Admin Profile</button>
      </div>
    </div>
  );
}

export default Banner;
