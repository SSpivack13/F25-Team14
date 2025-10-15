import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from './Banner';

function LoginPage() {
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const intendedRoute = location.state?.redirectTo;
  const loginTitle = intendedRoute === '/profile'
    ? 'Manager Login'
    : intendedRoute === '/sponsor'
      ? 'Sponsor Login'
      : intendedRoute === '/admin'
        ? 'Admin Login'
        : 'Login';
  const expectedRole = intendedRoute === '/profile' ? 'manager'
    : intendedRoute === '/sponsor' ? 'sponsor'
    : intendedRoute === '/admin'? 'admin'
    : undefined;

  const demoUsers = {
    manager: { password: 'password', USER_TYPE: 'manager' },
    sponsor: { password: 'password', USER_TYPE: 'sponsor' },
    admin: { password: 'password', USER_TYPE: 'admin' },
  };

  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const useManagerDemo = () => {
    setLoginForm({ username: 'manager', password: 'password' });
  };
  const useSponsorDemo = () => {
    setLoginForm({ username: 'sponsor', password: 'password' });
  };
  const useAdminDemo = () => {
    setLoginForm({ username: 'admin', password: 'password' });
  };

  const handleLogin = async () => {
    if (!loginForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }
    if (!loginForm.password.trim()) {
      setMessage('Password is required');
      setMessageType('error');
      return;
    }
    const demo = demoUsers[loginForm.username];
    if (demo && loginForm.password === demo.password) {
      if (expectedRole && demo.USER_TYPE !== expectedRole) {
        setMessage(`Please use ${expectedRole} demo credentials on this page.`);
        setMessageType('error');
        return;
      }
      setMessage('Login successful!');
      setMessageType('success');
      const user = { USERNAME: loginForm.username, USER_TYPE: demo.USER_TYPE };
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      const redirectTo = location.state?.redirectTo
        || (user?.USER_TYPE === 'sponsor' ? '/sponsor'
            : user?.USER_TYPE === 'admin' ? '/admin'
            : '/profile');
      setTimeout(() => {
        navigate(redirectTo);
      }, 800);
      return;
    }
    try {
      const response = await axios.post('{DB_PATH}/login', {
        username: loginForm.username,
        password: loginForm.password
      });
      if (response.data.status === 'success') {
        setMessage('Login successful!');
        setMessageType('success');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        const user = response.data.user;
        const redirectTo = location.state?.redirectTo
          || (user?.USER_TYPE === 'sponsor' ? '/sponsor'
              : user?.USER_TYPE === 'admin' ? '/admin'
              : '/profile');
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'An error occurred during login.');
      } else if (error.request) {
        setMessage('Could not connect to the server. Please try again later.');
      } else {
        setMessage('An unexpected error occurred.');
      }
      setMessageType('error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>{loginTitle}</h1>
        </div>
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        <div className="profile-edit">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
            />
          </div>
          <div className="form-actions">
            <button className="save-btn" onClick={handleLogin}>
              Login
            </button>
          </div>
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.9rem', color: '#666', display: 'grid', gap: '0.75rem' }}>
            {(loginTitle === 'Login' || loginTitle === 'Manager Login') && (
              <div>
                <strong>Manager Demo:</strong><br />
                Username: <code>manager</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useManagerDemo}>
                  Use Manager Demo
                </button>
              </div>
            )}
            {(loginTitle === 'Login' || loginTitle === 'Sponsor Login') && (
              <div>
                <strong>Sponsor Demo:</strong><br />
                Username: <code>sponsor</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useSponsorDemo}>
                  Use Sponsor Demo
                </button>
              </div>
            )}
            {(loginTitle === 'Login' || loginTitle === 'Admin Login') && (
              <div>
                <strong>Admin Demo:</strong><br />
                Username: <code>admin</code><br />
                Password: <code>password</code><br />
                <button className="save-btn" style={{ marginTop: '0.5rem' }} onClick={useAdminDemo}>
                  Use Admin Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
