import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appInfo } from '../appInfo';

function HomePage() {
  const [aboutInfo, setAboutInfo] = useState(null);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginMessage, setLoginMessage] = useState('');
  const [loginMessageType, setLoginMessageType] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    const fetchAboutInfo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/about`);
        if (response.data.status === 'success') {
          setAboutInfo(response.data.data);
        } else {
          setError(response.data.message || 'Could not fetch project information.');
        }
      } catch (err) {
        setError('Failed to connect to the server. Please try again later.');
        console.error('Error fetching about info:', err);
      }
    };

    fetchAboutInfo();
  }, []);

  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setLoginMessage('Please enter both username and password.');
      setLoginMessageType('error');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/login`, {
        username: loginForm.username,
        password: loginForm.password
      });
      if (response.data.status === 'success') {
        setLoginMessage('Login successful!');
        setLoginMessageType('success');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        const user = response.data.user;
        const redirectTo = user?.USER_TYPE === 'sponsor' ? '/sponsor'
          : user?.USER_TYPE === 'admin' ? '/admin'
          : '/profile';
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        setLoginMessage(error.response.data.message || 'An error occurred during login.');
      } else if (error.request) {
        setLoginMessage('Could not connect to the server. Please try again later.');
      } else {
        setLoginMessage('An unexpected error occurred.');
      }
      setLoginMessageType('error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="template-content">
      {error && <div className="template-card"><p className="template-alert template-alert-error">{error}</p></div>}
      {!aboutInfo && !error && <div className="template-card"><p>Loading project information...</p></div>}

      {/* Project Information */}
      {aboutInfo && (
        <div className="template-card" style={{ marginBottom: '30px' }}>
          <h2>{aboutInfo.PROD_NAME}</h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '15px', marginBottom: '20px' }}>
            {aboutInfo.PROD_DESC}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <strong style={{ color: '#555' }}>Version:</strong>
              <div style={{ marginTop: '5px', fontSize: '15px' }}>{aboutInfo.SPRINT}</div>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Release Date:</strong>
              <div style={{ marginTop: '5px', fontSize: '15px' }}>
                {new Date(aboutInfo.RELEASE_DATE).toLocaleDateString()}
              </div>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Team:</strong>
              <div style={{ marginTop: '5px', fontSize: '15px' }}>#{aboutInfo.TEAM}</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="template-card" style={{ marginBottom: '30px' }}>
        <h2>Team 14 Members</h2>
        <div style={{ marginTop: '15px', lineHeight: '1.8', fontSize: '15px' }}>
          {appInfo.teamMembers.map((member, index) => (
            <div key={index} style={{ padding: '5px 0' }}>
              {member}
            </div>
          ))}
        </div>
      </div>

      {/* Login Form - Show at bottom if not logged in */}
      {!isLoggedIn && (
        <div className="template-card" style={{
          maxWidth: '500px',
          margin: '0 auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login to Your Account</h2>
          {loginMessage && (
            <div className={`message ${loginMessageType}`} style={{ marginBottom: '20px' }}>
              {loginMessage}
            </div>
          )}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter username"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>
          <div className="form-actions" style={{ marginBottom: '15px' }}>
            <button
              className="save-btn"
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Login
            </button>
          </div>
          <div style={{
            textAlign: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <a
              href="/forgot-password"
              style={{
                color: '#007bff',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Forgot Password?
            </a>
            <span style={{ color: '#999' }}>|</span>
            <a
              href="/signup"
              style={{
                color: '#28a745',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Create Account
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
