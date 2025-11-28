import React, { useState } from 'react';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

function AdjustPointsPage() {
  const [userIdInput, setUserIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [deltas, setDeltas] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Only admin should access this page
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }
  if (user?.USER_TYPE !== 'admin') {
    navigate('/');
    return null;
  }

  const fetchById = async () => {
    if (!userIdInput) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/user/${userIdInput}/organizations-with-points`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setTargetUser(data.data.user);
        setUserOrganizations(data.data.organizations);
        setDeltas({});
        setMessage('');
      } else {
        setMessage(data.message || 'User not found');
        setMessageType('error');
        setTargetUser(null);
        setUserOrganizations([]);
        setDeltas({});
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error fetching user');
      setMessageType('error');
      setTargetUser(null);
      setUserOrganizations([]);
      setDeltas({});
    }
  };

  const fetchByUsername = async () => {
    if (!usernameInput) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/users`, { headers: authHeaders() });
      const users = res.data || [];
      const found = users.find(u => (u.USERNAME || '').toLowerCase() === usernameInput.trim().toLowerCase());
      if (found) {
        setUserIdInput(found.USER_ID);
        // Fetch organizations for this user
        const orgRes = await fetch(`${process.env.REACT_APP_API}/user/${found.USER_ID}/organizations-with-points`, { headers: authHeaders() });
        const orgData = await orgRes.json();
        if (orgData.status === 'success') {
          setTargetUser(orgData.data.user);
          setUserOrganizations(orgData.data.organizations);
          setDeltas({});
          setMessage('');
        } else {
          setMessage(orgData.message || 'User not found');
          setMessageType('error');
          setTargetUser(null);
          setUserOrganizations([]);
          setDeltas({});
        }
      } else {
        setMessage('User not found by username');
        setMessageType('error');
        setTargetUser(null);
        setUserOrganizations([]);
        setDeltas({});
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error fetching users');
      setMessageType('error');
      setTargetUser(null);
      setUserOrganizations([]);
      setDeltas({});
    }
  };

  const applyDelta = async (orgId, currentPoints) => {
    const delta = deltas[orgId] || 0;

    if (!targetUser || typeof delta === 'undefined' || delta === null || delta === 0) {
      setMessage('Enter a non-zero point delta');
      setMessageType('error');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API}/organizations/update-driver-points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          driverId: targetUser.USER_ID,
          pointsDelta: Number(delta),
          orgId: orgId,
          user
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        // Update the organization points in state
        setUserOrganizations(prev => prev.map(org =>
          org.ORG_ID === orgId
            ? { ...org, POINT_TOTAL: Number(currentPoints) + Number(delta) }
            : org
        ));
        // Clear the delta for this org
        setDeltas(prev => ({ ...prev, [orgId]: 0 }));
        setMessage(`Points updated successfully! ${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} points.`);
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to update points');
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
          <h1>Adjust User Points by Organization</h1>
        </div>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', maxWidth: 900 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input placeholder="User ID" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} />
            <button onClick={fetchById}>Lookup by ID</button>
            <span style={{ marginLeft: '12px', marginRight: '12px' }}>or</span>
            <input placeholder="Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} />
            <button onClick={fetchByUsername}>Lookup by username</button>
          </div>

          {targetUser && (
            <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: 6 }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>{targetUser.F_NAME} {targetUser.L_NAME}</strong> (ID: {targetUser.USER_ID})
                <button
                  onClick={() => {
                    setTargetUser(null);
                    setUserOrganizations([]);
                    setDeltas({});
                    setUserIdInput('');
                    setUsernameInput('');
                    setMessage('');
                  }}
                  style={{ marginLeft: '16px', padding: '4px 12px' }}
                >
                  Clear
                </button>
              </div>

              {userOrganizations.length === 0 ? (
                <div style={{ color: '#666', fontStyle: 'italic' }}>
                  This user is not assigned to any organizations.
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '12px' }}>Organizations & Points</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Organization</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Current Points</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Adjust Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrganizations.map((org) => (
                        <tr key={org.ORG_ID}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_NAME}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                            <strong>{org.POINT_TOTAL}</strong>
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={deltas[org.ORG_ID] || 0}
                                onChange={(e) => setDeltas(prev => ({ ...prev, [org.ORG_ID]: Number(e.target.value) }))}
                                style={{ width: 100 }}
                                placeholder="±points"
                              />
                              <button
                                onClick={() => applyDelta(org.ORG_ID, org.POINT_TOTAL)}
                                disabled={!deltas[org.ORG_ID] || deltas[org.ORG_ID] === 0}
                                style={{
                                  padding: '4px 12px',
                                  opacity: (!deltas[org.ORG_ID] || deltas[org.ORG_ID] === 0) ? 0.5 : 1,
                                  cursor: (!deltas[org.ORG_ID] || deltas[org.ORG_ID] === 0) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Apply
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdjustPointsPage;
