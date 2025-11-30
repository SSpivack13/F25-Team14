import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import { authHeaders } from '../utils/auth';
import Banner from './Banner';
import '../Template.css';

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

  const [allSponsors, setAllSponsors] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilters, setLogFilters] = useState({
    log_type: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Load all data on mount
  useEffect(() => {
    fetchAllSponsors();
    fetchAllDrivers();
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('admin_original_user');
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
          L_NAME: editForm.lastName,
          PHONE: editForm.phone
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

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams({
        requester_id: user.USER_ID,
        ...Object.fromEntries(Object.entries(logFilters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`${process.env.REACT_APP_API}/auditlogs?${params}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAuditLogs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setLogFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    fetchAuditLogs();
  };

  const clearFilters = () => {
    setLogFilters({
      log_type: '',
      user_id: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(() => fetchAuditLogs(), 100);
  };

  const formatLogDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatLogDetails = (details) => {
    if (!details) return '';
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(details);
    }
  };

  const emulateUser = async (targetUserId) => {
    try {
      setMessage('');
      setMessageType('');
      const response = await fetch(`${process.env.REACT_APP_API}/users/${targetUserId}/profile`, {
        headers: authHeaders()
      });

      const data = await response.json();
      if (data.status !== "success" || !data.data) {
        setMessage("Failed to load user profile");
        setMessageType("error");
        return;
      }

      const targetUser = data.data;
      
      const currentAdmin = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentAdmin && currentAdmin.USER_ID) {
        localStorage.setItem('admin_original_user', JSON.stringify(currentAdmin));
      }

      localStorage.setItem("user", JSON.stringify(targetUser));
      localStorage.setItem("isLoggedIn", "true");
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
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Admin Profile</h1>

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

          {/* Admin Actions */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #eee' }}>
            <h2>Admin Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => navigate('/admin/adduser')}
                style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Add User
              </button>
              <button
                onClick={() => navigate('/admin/updateuser')}
                style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Update User
              </button>
              <button
                onClick={() => navigate('/adjust-points')}
                style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Adjust Points
              </button>
            </div>

            {/* Audit Logs Section */}
            <h2>Audit Logs</h2>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Log Type</label>
                  <select
                    value={logFilters.log_type}
                    onChange={(e) => handleFilterChange('log_type', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="">All Types</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGIN_FAILED">Login Failed</option>
                    <option value="USER_CREATED">User Created</option>
                    <option value="USER_UPDATED">User Updated</option>
                    <option value="USER_ROLE_CHANGED">Role Changed</option>
                    <option value="POINTS_ADDED">Points Added</option>
                    <option value="POINTS_DEDUCTED">Points Deducted</option>
                    <option value="ORG_CREATED">Org Created</option>
                    <option value="ORG_DELETED">Org Deleted</option>
                    <option value="INVITATION_SENT">Invitation Sent</option>
                    <option value="INVITATION_ACCEPTED">Invitation Accepted</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>User ID</label>
                  <input
                    type="text"
                    value={logFilters.user_id}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                    placeholder="Filter by user ID"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Start Date</label>
                  <input
                    type="date"
                    value={logFilters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>End Date</label>
                  <input
                    type="date"
                    value={logFilters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={applyFilters}
                  style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                No audit logs found
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Date/Time</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Performed By</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Target User</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Org ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>IP Address</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={log.LOG_ID || idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatLogDate(log.LOG_DATE)}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: log.LOG_TYPE?.includes('FAILED') ? '#f44336' : '#333' }}>
                          {log.LOG_TYPE}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{log.PERFORMED_BY_USER_ID || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{log.TARGET_USER_ID || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{log.ORG_ID || '-'}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{log.IP_ADDRESS || '-'}</td>
                        <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                          {log.DETAILS ? (
                            <details style={{ cursor: 'pointer' }}>
                              <summary style={{ fontWeight: 'bold', color: '#2196f3' }}>View</summary>
                              <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto', maxHeight: '150px' }}>
                                {formatLogDetails(log.DETAILS)}
                              </pre>
                            </details>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 style={{ marginTop: '2rem' }}>Emulate Account</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <h3 style={{ marginTop: 0 }}>Emulate Sponsor</h3>
                <select
                  value={selectedSponsor}
                  onChange={(e) => setSelectedSponsor(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
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
                  style={{ width: '100%', padding: '10px', backgroundColor: selectedSponsor ? '#ff9800' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: selectedSponsor ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                  Emulate Sponsor
                </button>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <h3 style={{ marginTop: 0 }}>Emulate Driver</h3>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
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
                  style={{ width: '100%', padding: '10px', backgroundColor: selectedDriver ? '#ff9800' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: selectedDriver ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                  Emulate Driver
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              style={{ marginTop: '2rem', width: '100%', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfilePage;
