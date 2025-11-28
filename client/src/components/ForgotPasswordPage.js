import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from './Banner';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email) {
      setMessage('Please enter your email address.');
      setMessageType('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/forgot-password`, {
        email
      });
      
      if (response.data.status === 'success') {
        setMessage(response.data.message);
        setMessageType('success');
        setEmail('');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'An error occurred.');
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
          <h1>Forgot Password</h1>
        </div>
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        <div className="profile-edit">
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your email"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button 
              className="save-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button 
              className="cancel-btn" 
              onClick={() => navigate('/login')}
              disabled={isSubmitting}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

