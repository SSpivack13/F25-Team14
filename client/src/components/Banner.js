import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // The active user (may be emulated)
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Only exists when admin is emulating someone
  const adminOriginal = JSON.parse(localStorage.getItem('admin_original_user') || 'null');

  // Only exists when sponsor is emulating a driver
  const sponsorOriginal = JSON.parse(localStorage.getItem('sponsor_original_user') || 'null');

  const isEmulating = Boolean((adminOriginal && adminOriginal.USER_ID !== user.USER_ID) || (sponsorOriginal && sponsorOriginal.USER_ID !== user.USER_ID));

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('admin_original_user'); // safety
    localStorage.removeItem('sponsor_original_user'); // safety
    navigate('/');
  };

  const goProfile = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: '/profile' } });
      return;
    }

    if (isEmulating) {
      navigate('/profile');
      return;
    }

    if (user.USER_TYPE === 'admin') navigate('/admin');
    else if (user.USER_TYPE === 'sponsor') navigate('/sponsor');
    else navigate('/profile');
  };

  const goCatalog = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: '/catalog' } });
      return;
    }
    navigate('/catalog');
  };

  const goNotifications = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: '/notifications' } });
      return;
    }
    navigate('/notifications');
  };

  const goPoints = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: '/points' } });
      return;
    }
    navigate('/points');
  };

  const goOrganizations = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: '/organizations' } });
      return;
    }
    navigate('/organizations');
  };

  // Restore admin or sponsor session
  const returnToOriginal = () => {
    if (adminOriginal) {
      localStorage.setItem('user', JSON.stringify(adminOriginal));
      localStorage.removeItem('admin_original_user');
      navigate('/admin');
    } else if (sponsorOriginal) {
      localStorage.setItem('user', JSON.stringify(sponsorOriginal));
      localStorage.removeItem('sponsor_original_user');
      navigate('/sponsor');
    }
    window.location.reload();
  };

  return (
    <div className="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1>Talladega Nights</h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/')}>Home</button>

          {isLoggedIn && (
            <>
              <button onClick={goCatalog}>Catalog</button>
            </>
          )}
        </div>
      </div>

      <div className="button-row" style={{ display: 'flex', gap: '8px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={goProfile}>Profile</button>
            <button onClick={goNotifications}>Notifications</button>

            {/* Admin or Sponsor = can view points */}
            {(user.USER_TYPE === 'admin' || user.USER_TYPE === 'sponsor') && (
              <button onClick={goPoints}>Points</button>
            )}

            {(user.USER_TYPE === 'admin' || user.USER_TYPE === 'sponsor' || user.ORG_ID) && (
              <button onClick={goOrganizations}>
                {user.USER_TYPE === 'admin' ? "Organizations" : "My Organization"}
              </button>
            )}

            {/* Return to Original User button ONLY during emulation */}
            {isEmulating && (
              <button onClick={returnToOriginal} style={{ backgroundColor: '#ffcc00', fontWeight: 'bold' }}>
                Return to {adminOriginal ? 'Admin' : 'Sponsor'}
              </button>
            )}

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
