import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import { authHeaders } from '../utils/auth';
import Banner from './Banner';

function AdminProfilePage() {
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
    phone: user?.PHONE || user?.phone,
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

  const [newOrg, setNewOrg] = useState({ ORG_LEADER_ID: '', ORG_NAME: '' });

  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [allSponsors, setAllSponsors] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Load all data on mount
  useEffect(() => {
    fetchAvailableSponsors();
    fetchAllSponsors();
    fetchAllDrivers();
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

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
          phone: editForm.phone
        };

        setProfile(updatedProfile);

        const newStoredUser = {
          ...storedUser,
          USERNAME: editForm.username,
          EMAIL: editForm.email,
          F_NAME: editForm.firstName,
          L_NAME: editForm.lastName
        };

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
      console.error('Error updating admin profile:', err);
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

  // Fetch unassigned sponsors (existing functionality)
  const fetchAvailableSponsors = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/users/unassigned-sponsors`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAvailableSponsors(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    }
  };

  // Fetch all sponsors for emulation
  const fetchAllSponsors = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/users/all-sponsors`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') setAllSponsors(data.data);
    } catch (err) {
      console.error("Failed to load all sponsors:", err);
    }
  };

  // Fetch all drivers for emulation
  const fetchAllDrivers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/users/all-drivers`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') setAllDrivers(data.data);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    }
  };

  // Emulate a specific user's account
  const emulateUser = async (targetUserId) => {
    try {
      setMessage('');
      setMessageType('');
      const response = await fetch(`${process.env.REACT_APP_API}/users/${targetUserId}/profile`, {
        headers: authHeaders()
      });

      // Log raw response for debugging
      console.log('Emulate fetch response:', response);
      const data = await response.json();
      console.log('Emulate fetch data:', data);
      if (data.status !== "success" || !data.data) {
        setMessage("Failed to load user profile");
        setMessageType("error");
        return;
      }

      const targetUser = data.data;
      
      // Save current admin profile before switching
      const currentAdmin = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentAdmin && currentAdmin.USER_ID) {
        localStorage.setItem('admin_original_user', JSON.stringify(currentAdmin));
      }

      localStorage.setItem("user", JSON.stringify(targetUser));
      localStorage.setItem("isLoggedIn", "true");
      console.log("Emulated user:", targetUser);
      setMessage(`Now emulating ${targetUser.F_NAME} ${targetUser.L_NAME} (${targetUser.USERNAME})`);
      setMessageType("success");

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error("Emulation error:", err);
      setMessage("Emulation failed");
      setMessageType("error");
    }
  };  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Admin Profile</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={handleEdit}>Edit Profile</button>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>{message}</div>
        )}

        {/* --- PROFILE VIEW --- */}
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
              <div className="field-value">
                {profile.emailNotifications ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        ) : (
          /* --- PROFILE EDIT MODE --- */
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
                  onChange={(e) =>
                    handleInputChange('emailNotifications', e.target.checked)
                  }
                />{' '}
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
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* --- NAVIGATION BUTTONS --- */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: "center" }}>
        <button onClick={() => navigate('/admin/adduser')}>Add User</button>
        <button onClick={() => navigate('/admin/updateuser')}>Update User</button>
        <button onClick={() => navigate('/adjust-points')}>Adjust Points</button>
      </div>

      {/* --- EMULATE SPECIFIC SPONSOR OR DRIVER --- */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h2>Emulate Account</h2>

        <div>
          <h3>Emulate a Sponsor</h3>
          <select
            value={selectedSponsor}
            onChange={(e) => setSelectedSponsor(e.target.value)}
          >
            <option value="">Select a sponsor...</option>
            {allSponsors.map(s => (
              <option key={s.USER_ID} value={s.USER_ID}>
                {s.F_NAME} {s.L_NAME} ({s.USERNAME})
              </option>
            ))}
          </select>
          <button
            disabled={!selectedSponsor}
            onClick={() => emulateUser(selectedSponsor)}
          >
            Emulate Sponsor
          </button>
        </div>

        <div>
          <h3>Emulate a Driver</h3>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="">Select a driver...</option>
            {allDrivers.map(d => (
              <option key={d.USER_ID} value={d.USER_ID}>
                {d.F_NAME} {d.L_NAME} ({d.USERNAME})
              </option>
            ))}
          </select>
          <button
            disabled={!selectedDriver}
            onClick={() => emulateUser(selectedDriver)}
          >
            Emulate Driver
          </button>
        </div>
      </div>

      {/* --- LOGOUT BUTTON --- */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: "center" }}>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default AdminProfilePage;
