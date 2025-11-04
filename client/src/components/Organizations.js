
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authHeaders } from '../utils/auth';
import Banner from './Banner';
import '../Template.css';

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [newOrg, setNewOrg] = useState({ ORG_LEADER_ID: '', ORG_NAME: '' });
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user?.USER_TYPE === 'admin') {
      fetchOrganizations();
      fetchAvailableSponsors();
    }
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOrganizations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  };

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

  const handleCreateOrg = async () => {
    if (!newOrg.ORG_LEADER_ID || !newOrg.ORG_NAME) {
      setMessage('Please select a sponsor and enter organization name');
      setMessageType('error');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ 
          ORG_LEADER_ID: newOrg.ORG_LEADER_ID, 
          ORG_NAME: newOrg.ORG_NAME,
          user 
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Organization created successfully!');
        setMessageType('success');
        setNewOrg({ ORG_LEADER_ID: '', ORG_NAME: '' });
        fetchAvailableSponsors();
        fetchOrganizations();
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

  const handleDeleteClick = (orgId) => {
    setDeleteOrgId(orgId);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/${deleteOrgId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          password: deletePassword,
          user
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Organization deleted successfully!');
        setMessageType('success');
        setShowDeleteModal(false);
        fetchOrganizations();
        fetchAvailableSponsors();
      } else {
        setDeleteError(data.message || 'Failed to delete organization');
      }
    } catch (err) {
      console.error(err);
      setDeleteError('Server error');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteOrgId(null);
    setDeletePassword('');
    setDeleteError('');
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Organizations</h1>
          
          {user?.USER_TYPE === 'admin' && (
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>Create Organization</h3>
              {message && (
                <div className={`message ${messageType}`} style={{ marginBottom: '1rem' }}>
                  {message}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label>Organization Name:</label>
                  <input 
                    type="text"
                    placeholder="Enter organization name" 
                    value={newOrg.ORG_NAME} 
                    onChange={(e) => setNewOrg(prev => ({ ...prev, ORG_NAME: e.target.value }))} 
                    style={{ marginLeft: '8px', padding: '4px' }}
                  />
                </div>
                <div>
                  <label>Select Sponsor:</label>
                  <select 
                    value={newOrg.ORG_LEADER_ID} 
                    onChange={(e) => setNewOrg(prev => ({ ...prev, ORG_LEADER_ID: e.target.value }))}
                    style={{ marginLeft: '8px', padding: '4px' }}
                  >
                    <option value="">-- Select a sponsor --</option>
                    {availableSponsors.map(sponsor => (
                      <option key={sponsor.USER_ID} value={sponsor.USER_ID}>
                        {sponsor.USERNAME} ({sponsor.F_NAME} {sponsor.L_NAME})
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={handleCreateOrg} style={{ marginTop: '8px' }}>
                  Create Organization
                </button>
              </div>
            </div>
          )}

          <div>
            <h3>All Organizations</h3>
            {organizations.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ID</th>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Name</th>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Leader ID</th>
                    {user?.USER_TYPE === 'admin' && (
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {organizations.map(org => (
                    <tr key={org.ORG_ID}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_ID}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_NAME}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_LEADER_ID}</td>
                      {user?.USER_TYPE === 'admin' && (
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          <button 
                            onClick={() => handleDeleteClick(org.ORG_ID)}
                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No organizations found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            <h3>Confirm Delete Organization</h3>
            <p>Are you sure you want to delete this organization? This action cannot be undone.</p>
            <p><strong>Please enter your password to confirm:</strong></p>
            
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: '100%', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            
            {deleteError && (
              <div style={{ color: 'red', marginBottom: '1rem' }}>
                {deleteError}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleDeleteCancel}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#dc3545', color: 'white' }}
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;

