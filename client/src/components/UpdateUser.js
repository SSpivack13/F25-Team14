import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import Banner from './Banner';
import '../Template.css';

function UpdateUser() {
  const [users, setUsers] = useState([]);
  const [updates, setUpdates] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/users`, { headers: authHeaders() });
        const usersRaw = res.data?.data ?? res.data ?? [];

        if (!Array.isArray(usersRaw) || usersRaw.length === 0) {
          setUsers([]);
          return;
        }

        // Fetch orgs for each user from UserOrganizations table
        const orgFetches = usersRaw.map(u =>
          axios.get(`${process.env.REACT_APP_API}/user/${u.USER_ID}/organizations`, { headers: authHeaders() })
            .then(r => ({ userId: u.USER_ID, orgs: r.data?.data ?? [] }))
            .catch(() => ({ userId: u.USER_ID, orgs: [] }))
        );

        const orgResults = await Promise.all(orgFetches);
        const orgMap = {};
        orgResults.forEach(r => {
          const ids = Array.isArray(r.orgs) ? r.orgs.map(o => o.ORG_ID).filter(Boolean) : [];
          orgMap[r.userId] = ids; // could be [] or [id,...]
        });

        const usersWithOrgs = usersRaw.map(u => ({
          ...u,
          USER_ORGS: orgMap[u.USER_ID] || [],
          ORG_ID: (orgMap[u.USER_ID] && orgMap[u.USER_ID][0]) || null
        }));
        setUsers(usersWithOrgs);
      } catch (err) {
        console.error('Error fetching users:', err?.response?.data || err.message || err);
        setMessage('Error loading users.');
        setMessageType('error');
      }
    }
    fetchUsers();
  }, []);

  const handleFieldChange = (userId, field, value) => {
    setUpdates(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [field]: value }
    }));
  };

  const handleUpdate = async (userId) => {
    const dataToSend = updates[userId];
    if (!dataToSend) {
      setMessage('No fields changed.');
      setMessageType('error');
      return;
    }

    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/updateUser/${userId}`, dataToSend, { headers: authHeaders() });
      setMessage(res.data.message || 'User updated successfully!');
      setMessageType('success');
      const updatedUsers = users.map(u =>
        u.USER_ID === userId ? { ...u, ...dataToSend } : u
      );
      setUsers(updatedUsers);
    } catch (err) {
      console.error(err);
      setMessage('Error updating user.');
      setMessageType('error');
    }
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Update User</h1>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First</th>
                  <th>Last</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Type</th>
                  <th>Org</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const fields = ['F_NAME', 'L_NAME', 'EMAIL', 'USERNAME', 'PASSWORD', 'USER_TYPE', 'ORG_ID'];
                  return (
                    <tr key={user.USER_ID}>
                      <td>{user.USER_ID}</td>
                      {fields.map((field) => {
                        const val = user[field];
                        const isMissing = val === null || val === '' || val === undefined;
                        return (
                          <td key={field} style={{ backgroundColor: isMissing ? '#fff3cd' : 'transparent', padding: '8px' }}>
                            <input
                              type="text"
                              placeholder={isMissing ? `Enter ${field}` : `${val}`}
                              value={(updates[user.USER_ID]?.[field]) || ''}
                              onChange={(e) => handleFieldChange(user.USER_ID, field, e.target.value)}
                              style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px' }}>
                        <button 
                          onClick={() => handleUpdate(user.USER_ID)}
                          style={{ padding: '6px 12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateUser;
