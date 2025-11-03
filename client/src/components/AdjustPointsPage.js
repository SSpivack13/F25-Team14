import React, { useState } from 'react';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

function AdjustPointsPage() {
  const [userIdInput, setUserIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [delta, setDelta] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Only admin or sponsor should access this page
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }
  if (!(user?.USER_TYPE === 'admin' || user?.USER_TYPE === 'sponsor')) {
    navigate('/');
    return null;
  }

  const fetchById = async () => {
    if (!userIdInput) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/users/${userIdInput}/points`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setTargetUser({ USER_ID: userIdInput, F_NAME: data.data.F_NAME, L_NAME: data.data.L_NAME, POINT_TOTAL: data.data.POINT_TOTAL });
        setMessage('');
      } else {
        setMessage(data.message || 'User not found');
        setMessageType('error');
        setTargetUser(null);
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error fetching user');
      setMessageType('error');
      setTargetUser(null);
    }
  };

  const fetchByUsername = async () => {
    if (!usernameInput) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/users`, { headers: authHeaders() });
      const users = res.data || [];
      const found = users.find(u => (u.USERNAME || '').toLowerCase() === usernameInput.trim().toLowerCase());
      if (found) {
        // Use points endpoint to be consistent
        setUserIdInput(found.USER_ID);
        await fetchById();
      } else {
        setMessage('User not found by username');
        setMessageType('error');
        setTargetUser(null);
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error fetching users');
      setMessageType('error');
      setTargetUser(null);
    }
  };

  const applyDelta = async () => {
    if (!targetUser || typeof delta === 'undefined' || delta === null) {
      setMessage('Select a user and enter a point delta');
      setMessageType('error');
      return;
    }
    const newTotal = Number(targetUser.POINT_TOTAL || 0) + Number(delta);
    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/updateUser/${targetUser.USER_ID}`, { POINT_TOTAL: newTotal }, { headers: authHeaders() });
      if (res.data?.status === 'success') {
        setTargetUser(prev => ({ ...prev, POINT_TOTAL: newTotal }));
        setMessage('Points updated successfully');
        setMessageType('success');
        // update localStorage user if we changed the logged-in user's points
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser?.USER_ID === targetUser.USER_ID) {
          storedUser.POINT_TOTAL = newTotal;
          localStorage.setItem('user', JSON.stringify(storedUser));
        }
      } else {
        setMessage(res.data?.message || 'Failed to update points');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error updating points');
      setMessageType('error');
    }
  };

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Adjust User Points</h1>
        </div>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', maxWidth: 700 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input placeholder="User ID" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} />
            <button onClick={fetchById}>Lookup by ID</button>
            <span style={{ marginLeft: '12px', marginRight: '12px' }}>or</span>
            <input placeholder="Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} />
            <button onClick={fetchByUsername}>Lookup by username</button>
          </div>

          {targetUser && (
            <div style={{ border: '1px solid #ddd', padding: '12px', borderRadius: 6 }}>
              <div><strong>{targetUser.F_NAME} {targetUser.L_NAME}</strong> (ID: {targetUser.USER_ID})</div>
              <div>Current Points: <strong>{targetUser.POINT_TOTAL}</strong></div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} style={{ width: 120 }} />
                <button onClick={applyDelta}>Apply</button>
                <button onClick={() => { setTargetUser(null); setUserIdInput(''); setUsernameInput(''); setDelta(0); setMessage(''); }}>Clear</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdjustPointsPage;
