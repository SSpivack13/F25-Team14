import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Banner from './Banner';
import '../Template.css';

function RegisterWithInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('invite');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    f_name: '',
    l_name: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give React Router time to parse URL params
    const timer = setTimeout(() => {
      if (!inviteToken) {
        console.log('No invite token found, redirecting to home');
        navigate('/');
      } else {
        console.log('Invite token found:', inviteToken);
        setIsLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [inviteToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API}/users/register-with-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          f_name: formData.f_name,
          l_name: formData.l_name,
          email: formData.email,
          inviteToken
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Account created successfully! Welcome to Talladega Nights!');
        setMessageType('success');

        // Auto-login the new user
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        // Redirect to driver profile page
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setMessage(data.message || 'Registration failed');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Server error');
      setMessageType('error');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Banner />
        <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Banner />
      <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
        <h2>Join as Driver</h2>
        <p>Complete your registration to join the organization.</p>

      {message && (
        <div className={`message ${messageType}`} style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={formData.f_name}
          onChange={(e) => setFormData(prev => ({ ...prev, f_name: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.l_name}
          onChange={(e) => setFormData(prev => ({ ...prev, l_name: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />
        <button type="submit">Create Account</button>
      </form>
      </div>
    </div>
  );
}

export default RegisterWithInvite;
