import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import { useNavigate, Navigate } from 'react-router-dom';
import Banner from './Banner';
import '../Template.css';

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

  const [driversInOrg, setDriversInOrg] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (isLoggedIn && user?.USER_ID) {
      fetchDriversInOrganization();
    }
  }, [isLoggedIn, user?.USER_ID]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const fetchDriversInOrganization = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/my-org/${user.USER_ID}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success' && data.data.drivers) {
        setDriversInOrg(data.data.drivers);
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const handleEdit = () => {
    setEditForm({
      username: profile.username,
      password: '',
      confirmPassword: '',
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
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
      firstName: '',
      lastName: '',
      emailNotifications: false
    });
    setMessage('');
  };

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

    const payload = {
      USERNAME: editForm.username,
      EMAIL: editForm.email,
      F_NAME: editForm.firstName,
      L_NAME: editForm.lastName
    };
    if (editForm.phone) {
      payload.PHONE = editForm.phone;
    }
    if (editForm.password) {
      payload.PASSWORD = editForm.password;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.USER_ID;
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
        };
        setProfile(updatedProfile);

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const newStoredUser = { ...storedUser, USERNAME: editForm.username, EMAIL: editForm.email, F_NAME: editForm.firstName, L_NAME: editForm.lastName, PHONE: editForm.phone };
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
      console.error('Error updating profile:', err);
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

  const emulateDriver = async (driverId) => {
    try {
      setMessage('');
      setMessageType('');
      const response = await fetch(`${process.env.REACT_APP_API}/users/${driverId}/profile`, {
        headers: authHeaders()
      });

      const data = await response.json();
      if (data.status !== 'success' || !data.data) {
        setMessage('Failed to load driver profile');
        setMessageType('error');
        return;
      }

      const driverUser = data.data;
      
      const currentSponsor = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentSponsor && currentSponsor.USER_ID) {
        localStorage.setItem('sponsor_original_user', JSON.stringify(currentSponsor));
      }

      localStorage.setItem('user', JSON.stringify(driverUser));
      localStorage.setItem('isLoggedIn', 'true');
      setMessage(`Now emulating ${driverUser.F_NAME} ${driverUser.L_NAME} (${driverUser.USERNAME})`);
      setMessageType('success');

      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error('Emulation error:', err);
      setMessage('Emulation failed');
      setMessageType('error');
    }
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Sponsor Profile</h1>

          {message && (
            <div className={`message ${messageType}`} style={{ marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          {!isEditing ? (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>First Name</label>
                    <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {profile.firstName || 'Not provided'}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Last Name</label>
                    <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {profile.lastName || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Username</label>
                    <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {profile.username}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {profile.email || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                    <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {profile.phone || 'Not provided'}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <div className="password-field" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', flex: 1 }}>
                        {showPassword ? profile.password : '••••••••••'}
                      </div>
                      <button 
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile-field">
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Email Notifications</label>
                  <div className="field-value" style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    {profile.emailNotifications ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                <button 
                  onClick={handleEdit}
                  style={{ padding: '10px 20px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Edit Profile
                </button>
              </div>

              {/* Emulate Driver Section */}
              {driversInOrg.length > 0 && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #eee' }}>
                  <h2>Emulate Driver</h2>
                  <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Select a Driver</label>
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                      <option value="">Choose a driver...</option>
                      {driversInOrg.map(d => (
                        <option key={d.USER_ID} value={d.USER_ID}>
                          {d.F_NAME} {d.L_NAME} ({d.USERNAME})
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!selectedDriver}
                      onClick={() => emulateDriver(selectedDriver)}
                      style={{ width: '100%', padding: '10px', backgroundColor: selectedDriver ? '#ff9800' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: selectedDriver ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                    >
                      Emulate Driver
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  />
                  <span style={{ fontWeight: 'bold' }}>Send notifications to email</span>
                </label>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Change Password</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter new password (leave blank to keep current)"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleCancel}
                  style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            style={{ marginTop: '2rem', width: '100%', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default SponsorProfilePage;
