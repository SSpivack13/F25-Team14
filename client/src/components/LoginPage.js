import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from './Banner';

//Login page that takes a username and password
function LoginPage() {
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  //Separate routes for each type of user
  const intendedRoute = location.state?.redirectTo;
  const loginTitle = intendedRoute === '/profile'
    ? 'Manager Login'
    : intendedRoute === '/sponsor'
      ? 'Sponsor Login'
      : intendedRoute === '/admin'
        ? 'Admin Login'
        : 'Login';

  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  //Error handler for missing information
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

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/login`, {
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
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
