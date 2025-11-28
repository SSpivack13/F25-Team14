import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from './Banner';

function RegisterPage() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.username || !formData.password || !formData.confirmPassword || 
        !formData.f_name || !formData.l_name || !formData.email) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setMessageType('error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/register`, {
        username: formData.username,
        password: formData.password,
        f_name: formData.f_name,
        l_name: formData.l_name,
        email: formData.email
      });

      if (response.data.status === 'success') {
        setMessage('Account created successfully! Redirecting to login...');
        setMessageType('success');
        
        // Clear form
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          f_name: '',
          l_name: '',
          email: ''
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Registration failed.');
      } else if (error.request) {
        setMessage('Could not connect to the server. Please try again later.');
      } else {
        setMessage('An unexpected error occurred.');
      }
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Create Driver Account</h1>
        </div>
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        <div className="profile-edit">
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Sign up to create your driver account and start earning points!
          </p>
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={formData.f_name}
              onChange={(e) => handleInputChange('f_name', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter first name"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={formData.l_name}
              onChange={(e) => handleInputChange('l_name', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter last name"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Choose a username"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter password (min 6 characters)"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Confirm password"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button
              className="save-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            <button
              className="cancel-btn"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Already have an account? </span>
            <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
              Login here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

