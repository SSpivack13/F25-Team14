import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Banner from './Banner';

function UpdateUser() {
  const [users, setUsers] = useState([]);
  const [updates, setUpdates] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setMessage('Error loading users.');
        setMessageType('error');
      }
    }
    fetchUsers();
  }, [process.env.REACT_APP_API]);
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
      const res = await axios.put(`${process.env.REACT_APP_API}/updateUser/${userId}`, dataToSend);
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
      <div className="profile-container">
        <div className="profile-header">
          <h1>Update User</h1>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="profile-edit" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>First</th>
                <th>Last</th>
                <th>Email</th>
                <th>Username</th>
                <th>Password</th>
                <th>Points</th>
                <th>Type</th>
                <th>Org</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const fields = ['F_NAME', 'L_NAME', 'EMAIL', 'USERNAME', 'PASSWORD', 'POINT_TOTAL', 'USER_TYPE', 'ORG_ID'];
                return (
                  <tr key={user.USER_ID}>
                    <td>{user.USER_ID}</td>
                    {fields.map((field) => {
                      const val = user[field];
                      const isMissing = val === null || val === '' || val === undefined;
                      return (
                        <td key={field} style={{ backgroundColor: isMissing ? '#fff3cd' : 'transparent' }}>
                          {isMissing ? (
                            <input
                              type="text"
                              placeholder={`Enter ${field}`}
                              value={(updates[user.USER_ID]?.[field]) || ''}
                              onChange={(e) => handleFieldChange(user.USER_ID, field, e.target.value)}
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder={`${val}`}
                              value={(updates[user.USER_ID]?.[field]) || ''}
                              onChange={(e) => handleFieldChange(user.USER_ID, field, e.target.value)}
                              style={{ width: '100%' }}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <button className="save-btn" onClick={() => handleUpdate(user.USER_ID)}>
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
  );
}

export default UpdateUser;
