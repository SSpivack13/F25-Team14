import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Banner from './Banner';

//Generic profile page function, tailored to Admin users
function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: 'admin123',
    password: 'password123',
    email: 'admin@talladeganights.com',
    phone: '',
    emailNotifications: false
  });
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    emailNotifications: false
  });
  const [newOrg, setNewOrg] = useState({ ORG_LEADER: '' });
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };
  
  //Editing state for changing user information
  const handleEdit = () => {
    setEditForm({
      username: profile.username,
      password: '',
      confirmPassword: '',
      email: profile.email,
      phone: profile.phone || '',
      emailNotifications: profile.emailNotifications
    });
    setIsEditing(true);
    setMessage('');
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: '',
      emailNotifications: false
    });
    setMessage('');
  };

  //Error messages for incomplete editing information
  const handleSave = () => {
    if (!editForm.username.trim()) {
      setMessage('Username is required');
      setMessageType('error');
      return;
    }
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }
    if (editForm.email && !editForm.email.includes('@')) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }
    if (editForm.phone && !/^[-+()\s\d]{7,}$/.test(editForm.phone)) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }
    const updatedProfile = {
      username: editForm.username,
      password: editForm.password || profile.password,
      email: editForm.email,
      phone: editForm.phone,
      emailNotifications: editForm.emailNotifications
    };
    setProfile(updatedProfile);
    setIsEditing(false);
    setMessage('Profile updated successfully!');
    setMessageType('success');
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateOrg = async () => {
    if (!newOrg.ORG_LEADER) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ORG_LEADER: newOrg.ORG_LEADER, user })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Organization created successfully!');
        setMessageType('success');
        setNewOrg({ ORG_LEADER: '' });
      } else {
        setMessage(data.message || 'Failed to create organization');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Admin Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-field">
              <label>Username</label>
              <div className="field-value">{profile.username}</div>
            </div>
            <div className="profile-field">
              <label>Password</label>
              <div className="password-field">
                <div className="field-value">
                  {showPassword ? profile.password : '••••••••••'}
                </div>
                <button 
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="profile-field">
              <label>Email</label>
              <div className="field-value">{profile.email || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Phone</label>
              <div className="field-value">{profile.phone || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Email Notifications</label>
              <div className="field-value">{profile.emailNotifications ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editForm.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                />
                Send notifications to email
              </label>
            </div>
            <div className="password-section">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => navigate('/admin/adduser')}>Add User</button>
      <button onClick={() => navigate('/admin/updateuser')}>Update User</button>
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Create Organization</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            placeholder="Supervisor Username" 
            value={newOrg.ORG_LEADER} 
            onChange={(e) => setNewOrg({ ORG_LEADER: e.target.value })} 
          />
          <button onClick={handleCreateOrg}>Create Organization</button>
        </div>
      </div>
    </div>
  );
}

export default AdminProfilePage;
