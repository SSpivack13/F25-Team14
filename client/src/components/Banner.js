import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

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

  const goPoints = () => {
    if (isLoggedIn) {
      navigate('/points');
    } else {
      navigate('/login', { state: { redirectTo: '/points' } });
    }
  };

  const goOrganizations = () => {
    if (isLoggedIn) {
      navigate('/organizations');
    } else {
      navigate('/login', { state: { redirectTo: '/organizations' } });
    }
  };

  return (
    <div className="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1>Talladega Nights</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')}>Home</button>
          {isLoggedIn === true ? (
            <>
              <button onClick={goCatalog}>Catalog</button>
            </>
          ) : null}
        </div>
      </div>
      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={goProfile}>Profile</button>
            <button onClick={goNotifications}>Notifications</button>
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              return user?.USER_TYPE === 'admin' ? <button onClick={goOrganizations}>Organizations</button> : null;
            })()}
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              return (user?.USER_TYPE === 'admin' || user?.USER_TYPE === 'sponsor') ? <button onClick={goPoints}>Points</button> : null;
            })()}
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              // Show "My Organization" for sponsors who are in an organization OR users with ORG_ID
              return (user?.USER_TYPE === 'sponsor' || user?.ORG_ID) ? <button onClick={goOrganizations}>My Organization</button> : null;
            })()}
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
