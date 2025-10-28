import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import Banner from './Banner';

//Generic profile page function, tailored to Sponsor users
function SponsorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [profile, setProfile] = useState({
    username: user?.USERNAME || user?.username,
    password: user?.PASSWORD || user?.password,
    email: user?.EMAIL || user?.email,
    firstName: user?.F_NAME || user?.f_name || user?.firstName,
    lastName: user?.L_NAME || user?.l_name || user?.lastName,
    phone: user?.PHONE || user?.phone || '',
    emailNotifications: user?.EMAIL_NOTIFICATIONS || user?.emailNotifications || false
  });
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    emailNotifications: false
  });
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const [userRole, setUserRole] = useState(user?.USER_TYPE || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user?.USER_ID) {
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API}/users/${user.USER_ID}/profile`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        if (data.status === 'success') {
          const userData = data.data;
          setUserRole(userData.USER_TYPE);
          setProfile(prev => ({
            ...prev,
            username: userData.USERNAME,
            email: userData.EMAIL || prev.email,
            firstName: userData.F_NAME || prev.firstName,
            lastName: userData.L_NAME || prev.lastName,
            phone: userData.PHONE || userData.phone || prev.phone
          }));
        }
      } catch (err) {
        console.error('Error fetching sponsor profile:', err);
        setMessage('Failed to load profile data');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isLoggedIn, user?.USER_ID]);

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
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      emailNotifications: profile.emailNotifications || false
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
      firstName: '',
      lastName: '',
      phone: '',
      emailNotifications: false
    });
    setMessage('');
  };

  //Error messages for incomplete editing information
  const handleSave = async () => {
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
    const payload = {
      USERNAME: editForm.username,
      EMAIL: editForm.email,
      F_NAME: editForm.firstName,
      L_NAME: editForm.lastName,
      PHONE: editForm.phone
    };
    if (editForm.password) payload.PASSWORD = editForm.password;

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser?.USER_ID;
      if (!userId) throw new Error('Missing user ID');

      const res = await axios.put(`${process.env.REACT_APP_API}/updateUser/${userId}`, payload);
      if (res.data?.status === 'success') {
        const updatedProfile = {
          ...profile,
          username: editForm.username,
          email: editForm.email,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          emailNotifications: editForm.emailNotifications || false
        };
        setProfile(updatedProfile);
        const newStoredUser = { ...storedUser, USERNAME: editForm.username, EMAIL: editForm.email, F_NAME: editForm.firstName, L_NAME: editForm.lastName };
        newStoredUser.EMAIL_NOTIFICATIONS = editForm.emailNotifications || false;
        localStorage.setItem('user', JSON.stringify(newStoredUser));

        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(res.data?.message || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error updating sponsor profile:', err);
      setMessage('Failed to update profile');
      setMessageType('error');
    }
  };
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Sponsor Profile</h1>
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
              <label>First Name</label>
              <div className="field-value">{profile.firstName || 'Not provided'}</div>
            </div>
            <div className="profile-field">
              <label>Last Name</label>
              <div className="field-value">{profile.lastName || 'Not provided'}</div>
            </div>
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
              <label>First Name</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
              />
            </div>
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
    </div>
  );
}

export default SponsorProfilePage;
