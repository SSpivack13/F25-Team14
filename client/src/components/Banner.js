import React from 'react';
import { useNavigate } from 'react-router-dom';

function Banner() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Check if currently emulating
  const adminOriginal = JSON.parse(localStorage.getItem('admin_original_user') || 'null');
  const sponsorOriginal = JSON.parse(localStorage.getItem('sponsor_original_user') || 'null');
  const isEmulating = Boolean((adminOriginal && adminOriginal.USER_ID) || (sponsorOriginal && sponsorOriginal.USER_ID));
  const originalUser = adminOriginal || sponsorOriginal;

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('sponsor_original_user');
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

  const goApply = () => {
    if (isLoggedIn) {
      navigate('/apply');
    } else {
      navigate('/login', { state: { redirectTo: '/apply' } });
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

  const revertToOriginal = () => {
    if (!originalUser) return;

    localStorage.setItem('user', JSON.stringify(originalUser));
    localStorage.removeItem('admin_original_user');
    localStorage.removeItem('sponsor_original_user');

    // Redirect based on original user type
    if (originalUser.USER_TYPE === 'admin') {
      navigate('/admin');
    } else if (originalUser.USER_TYPE === 'sponsor') {
      navigate('/sponsor');
    } else {
      navigate('/profile');
    }

    window.location.reload();
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
              return user?.USER_TYPE === 'driver' ? <button onClick={goApply}>Apply</button> : null;
            })()}
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
            {isEmulating && (
              <button onClick={revertToOriginal} style={{ backgroundColor: '#ffcc00', fontWeight: 'bold' }}>
                Return to {originalUser?.USER_TYPE === 'admin' ? 'Admin' : 'Sponsor'}
              </button>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate('/signup')}>Create Account</button>
        )}
      </div>
    </div>
  );
}

export default Banner;
