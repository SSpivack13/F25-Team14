import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Banner from './Banner';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMessageType('error');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    if (!token) {
      setMessage('Invalid reset token.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/reset-password`, {
        token,
        newPassword
      });
      
      if (response.data.status === 'success') {
        setMessage(response.data.message);
        setMessageType('success');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
          <h1>Reset Password</h1>
        </div>
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        {token && (
          <div className="profile-edit">
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Enter your new password below.
            </p>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter new password (min 6 characters)"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Confirm new password"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-actions">
              <button 
                className="save-btn" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;

