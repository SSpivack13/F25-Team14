import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authHeaders } from '../utils/auth';
import Banner from './Banner';
import '../Template.css';

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [myOrganization, setMyOrganization] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [newOrg, setNewOrg] = useState({ ORG_LEADER_ID: '', ORG_NAME: '' });
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showRemoveDriverModal, setShowRemoveDriverModal] = useState(false);
  const [removeDriverId, setRemoveDriverId] = useState(null);
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [adjustPointsDriverId, setAdjustPointsDriverId] = useState(null);
  const [adjustPointsDriverName, setAdjustPointsDriverName] = useState('');
  const [pointsDelta, setPointsDelta] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');
  const [products, setProducts] = useState([]);
  const [showManageProductsModal, setShowManageProductsModal] = useState(false);
  const [selectedOrgForProducts, setSelectedOrgForProducts] = useState(null);
  const [orgProducts, setOrgProducts] = useState({
    product1: null,
    product2: null,
    product3: null,
    product4: null,
    product5: null
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const navigate = useNavigate();
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user?.USER_TYPE === 'admin') {
      fetchOrganizations();
      fetchAvailableSponsors();
      fetchAvailableProducts();
    } else if (user?.USER_TYPE === 'sponsor') {
      fetchMyOrganization();
      fetchAvailableDrivers();
      fetchAvailableProducts();
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

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products');
      const data = await response.json();
      setAvailableProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleManageProducts = (org) => {
    setSelectedOrgForProducts(org);
    setOrgProducts({
      product1: org.product1 || null,
      product2: org.product2 || null,
      product3: org.product3 || null,
      product4: org.product4 || null,
      product5: org.product5 || null
    });
    setShowManageProductsModal(true);
  };

  const handleSaveProducts = async () => {
    if (!selectedOrgForProducts) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organization/${selectedOrgForProducts.ORG_ID}/catalog`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          product1: orgProducts.product1,
          product2: orgProducts.product2,
          product3: orgProducts.product3,
          product4: orgProducts.product4,
          product5: orgProducts.product5,
          user
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Products updated successfully!');
        setMessageType('success');
        setShowManageProductsModal(false);
        fetchOrganizations();
      } else {
        setMessage(data.message || 'Failed to update products');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error saving products:', err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  const handleProductChange = (slot, productId) => {
    setOrgProducts(prev => ({
      ...prev,
      [slot]: productId ? parseInt(productId) : null
    }));
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
        // Clear message after 2 seconds and refresh page
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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

  const fetchMyOrganization = async () => {
    console.log('Fetching organization for user:', user.USER_ID);
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/my-org/${user.USER_ID}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      console.log('Organization API response:', data);
      if (data.status === 'success') {
        setMyOrganization(data.data.organization);
        setDrivers(data.data.drivers);
      } else {
        console.log('No organization found for user');
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
    }
  };

  const fetchProducts = async () => {
    console.log('Fetching products for organization:', myOrganization.ORG_ID);
    try{
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/products/${myOrganization.ORG_ID}`, {
        headers: authHeaders()
    });
      const data = await response.json();
      console.log('Products response:', data);
      if (data.status === 'success') {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };


  const fetchAvailableDrivers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/users/all-drivers`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAvailableDrivers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  const handleAddDriver = async () => {
    if (!selectedDriverId) {
      setMessage('Please select a driver');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/add-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          driverId: selectedDriverId,
          user
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Driver added successfully!');
        setMessageType('success');
        setSelectedDriverId('');
        fetchMyOrganization();
        fetchAvailableDrivers();
      } else {
        setMessage(data.message || 'Failed to add driver');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  const handleRemoveDriverClick = (driverId) => {
    setRemoveDriverId(driverId);
    setShowRemoveDriverModal(true);
  };

  const handleRemoveDriverConfirm = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/remove-driver/${removeDriverId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ user })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Driver removed successfully!');
        setMessageType('success');
        setShowRemoveDriverModal(false);
        fetchMyOrganization();
        fetchAvailableDrivers();
      } else {
        setMessage(data.message || 'Failed to remove driver');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  const handleAdjustPointsClick = (driver) => {
    setAdjustPointsDriverId(driver.USER_ID);
    setAdjustPointsDriverName(`${driver.F_NAME} ${driver.L_NAME}`);
    setPointsDelta(0);
    setShowAdjustPointsModal(true);
  };

  const handleAdjustPointsConfirm = async () => {
    if (!adjustPointsDriverId || pointsDelta === 0) {
      setMessage('Please enter a point value to adjust');
      setMessageType('error');
      return;
    }

    try {
      // Get current driver points
      const driver = drivers.find(d => d.USER_ID === adjustPointsDriverId);
      const newTotal = Number(driver.POINT_TOTAL || 0) + Number(pointsDelta);

      const response = await fetch(`${process.env.REACT_APP_API}/updateUser/${adjustPointsDriverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          POINT_TOTAL: newTotal
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage(`Points adjusted successfully! ${pointsDelta > 0 ? 'Added' : 'Removed'} ${Math.abs(pointsDelta)} points.`);
        setMessageType('success');
        setShowAdjustPointsModal(false);
        fetchMyOrganization(); // Refresh to show updated points
      } else {
        setMessage(data.message || 'Failed to adjust points');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  const handleAdjustPointsCancel = () => {
    setShowAdjustPointsModal(false);
    setAdjustPointsDriverId(null);
    setAdjustPointsDriverName('');
    setPointsDelta(0);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/invite-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          email: inviteEmail,
          user
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMessage('Invitation sent successfully!');
        setMessageType('success');
        setInviteEmail('');
      } else {
        setMessage(data.message || 'Failed to send invitation');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
    }
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
    setBulkUploadFile(null);
    setBulkUploadResults(null);
  };

  const handleBulkUploadFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    setBulkUploadFile(file);
  };

  const handleBulkUploadConfirm = async () => {
    console.log('Upload button clicked, file:', bulkUploadFile);
    
    if (!bulkUploadFile) {
      console.error('No file selected');
      setMessage('Please select a file');
      setMessageType('error');
      return;
    }

    console.log('Starting upload for file:', bulkUploadFile.name);
    const formData = new FormData();
    formData.append('file', bulkUploadFile);

    try {
      // Get auth headers but remove Content-Type since FormData sets it automatically
      const headers = authHeaders();
      delete headers['Content-Type'];
      
      const response = await fetch(`${process.env.REACT_APP_API}/organizations/bulk-upload`, {
        method: 'POST',
        headers: {
          ...headers,
          'X-User-ID': user.USER_ID,
          'X-User-Type': user.USER_TYPE
        },
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.status === 'success') {
        setBulkUploadResults(data.results);
        setMessage('File processed successfully!');
        setMessageType('success');
        fetchMyOrganization();
        fetchAvailableDrivers();
      } else {
        setMessage(data.message || 'Failed to process file');
        setMessageType('error');
        setBulkUploadResults(data.results || null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Server error: ' + err.message);
      setMessageType('error');
    }
  };

  const handleBulkUploadCancel = () => {
    setShowBulkUploadModal(false);
    setBulkUploadFile(null);
    setBulkUploadResults(null);
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>{user?.USER_TYPE === 'sponsor' ? 'My Organization' : 'Organizations'}</h1>
          
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

          {user?.USER_TYPE === 'sponsor' && (
            <div>
              {message && (
                <div className={`message ${messageType}`} style={{ marginBottom: '1rem' }}>
                  {message}
                </div>
              )}
              
              {myOrganization ? (
                <div>
                  <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Organization Details</h3>
                    <p><strong>Name:</strong> {myOrganization.ORG_NAME}</p>
                    <p><strong>Organization ID:</strong> {myOrganization.ORG_ID}</p>
                  </div>

                  <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Bulk Upload Users</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      Upload a text file with user data.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                      <strong>Format:</strong> &lt;type&gt;||FirstName|LastName|email@example.com
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                      <strong>Valid types:</strong>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        <li>D - Driver</li>
                        <li>S - Sponsor</li>
                      </ul>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                      <strong>Example:</strong><br/>
                      D||John|Smith|john@example.com<br/>
                      S||Jane|Doe|jane@example.com
                    </p>
                    <button 
                      onClick={handleBulkUploadClick}
                      style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Upload File
                    </button>
                  </div>

                  <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Add Driver</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        value={selectedDriverId} 
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        style={{ padding: '4px' }}
                      >
                        <option value="">-- Select a driver --</option>
                        {availableDrivers.map(driver => (
                          <option key={driver.USER_ID} value={driver.USER_ID}>
                            {driver.USERNAME} ({driver.F_NAME} {driver.L_NAME})
                          </option>
                        ))}
                      </select>
                      <button onClick={handleAddDriver}>Add Driver</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Invite New Driver</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="email"
                        placeholder="Enter driver's email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        style={{ padding: '4px', flex: 1 }}
                      />
                      <button onClick={handleSendInvite}>Send Invitation</button>
                    </div>
                  </div>

                  <div>
                    <h3>Drivers in Organization</h3>
                    {drivers.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                          <tr>
                            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Username</th>
                            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Name</th>
                            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Points</th>
                            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drivers.map(driver => (
                            <tr key={driver.USER_ID}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{driver.USERNAME}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{driver.F_NAME} {driver.L_NAME}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{driver.POINT_TOTAL}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                <button 
                                  onClick={() => handleAdjustPointsClick(driver)}
                                  style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                                >
                                  Adjust Points
                                </button>
                                <button 
                                  onClick={() => handleRemoveDriverClick(driver.USER_ID)}
                                  style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No drivers in organization.</p>
                    )}
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Manage Organization Products</h3>
                    <button 
                      onClick={() => handleManageProducts(myOrganization)}
                      style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Manage Products
                    </button>
                  </div>
                </div>
              ) : (
                <p>You are not assigned to any organization.</p>
              )}
            </div>
          )}

          {user?.USER_TYPE === 'admin' && (
            <div>
              <h3>All Organizations</h3>
              {organizations.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>ID</th>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Name</th>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Leader ID</th>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map(org => (
                      <tr key={org.ORG_ID}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_ID}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_NAME}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{org.ORG_LEADER_ID}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          <button 
                            onClick={() => handleManageProducts(org)}
                            style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                          >
                            Manage Products
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(org.ORG_ID)}
                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No organizations found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remove Driver Confirmation Modal */}
      {showRemoveDriverModal && (
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
            <h3>Confirm Remove Driver</h3>
            <p>Are you sure you want to remove this driver from the organization?</p>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowRemoveDriverModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRemoveDriverConfirm}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#dc3545', color: 'white' }}
              >
                Remove Driver
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Adjust Points Modal */}
      {showAdjustPointsModal && (
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
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3>Adjust Points for {adjustPointsDriverName}</h3>
            <p>Enter the number of points to add or subtract:</p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Points to adjust (use negative numbers to subtract):</label>
              <input
                type="number"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                placeholder="Enter points (e.g., 100 or -50)"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleAdjustPointsCancel}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdjustPointsConfirm}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#28a745', color: 'white' }}
              >
                Adjust Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Products Modal */}
      {showManageProductsModal && selectedOrgForProducts && (
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
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '600px',
            margin: '2rem auto'
          }}>
            <h3>Manage Products for {selectedOrgForProducts.ORG_NAME}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map(slot => (
                <div key={slot}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Product Slot {slot}:
                  </label>
                  <select
                    value={orgProducts[`product${slot}`] || ''}
                    onChange={(e) => handleProductChange(`product${slot}`, e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="">-- No Product --</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.title} (ID: {product.id})
                      </option>
                    ))}
                  </select>
                  {orgProducts[`product${slot}`] && (
                    <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                      Selected: {availableProducts.find(p => p.id === orgProducts[`product${slot}`])?.title}
                    </small>
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowManageProductsModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProducts}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#28a745', color: 'white' }}
              >
                Save Products
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div
          onClick={() => console.log('modal backdrop clicked')}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,               // increased z-index
            pointerEvents: 'auto'      // ensure it receives pointer events
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // allow clicks inside the dialog
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              minWidth: '400px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              zIndex: 10000,            // keep inner dialog above backdrop
              pointerEvents: 'auto'
            }}
          >
            <h3>Bulk Upload Users</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              Upload a text file with user data.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
              <strong>Format:</strong> &lt;type&gt;||FirstName|LastName|email@example.com
            </p>
            <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
              <strong>Valid types:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>D - Driver</li>
                <li>S - Sponsor</li>
              </ul>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
              <strong>Example:</strong><br/>
              D||John|Smith|john@example.com<br/>
              S||Jane|Doe|jane@example.com
            </p>
            
            {!bulkUploadResults && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select File:</label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleBulkUploadFileChange}
                  style={{ marginBottom: '1rem', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                />
                {bulkUploadFile && <p style={{ fontSize: '0.9rem', color: '#666' }}>Selected: {bulkUploadFile.name}</p>}
              </div>
            )}
            
            {bulkUploadResults && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h4>Upload Results</h4>
                <p><strong>Total Records:</strong> {bulkUploadResults.total}</p>
                <p><strong>Successful:</strong> <span style={{ color: '#28a745' }}>{bulkUploadResults.successful}</span></p>
                <p><strong>Failed:</strong> <span style={{ color: '#dc3545' }}>{bulkUploadResults.failed}</span></p>
                
                {bulkUploadResults.errors && bulkUploadResults.errors.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h5>Errors:</h5>
                    <ul style={{ fontSize: '0.85rem', color: '#dc3545' }}>
                      {bulkUploadResults.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={handleBulkUploadCancel}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}
              >
                Close
              </button>
              {!bulkUploadResults && (
                <button 
                  type="button"
                  onClick={() => { console.log('Upload button clicked (UI)'); handleBulkUploadConfirm(); }}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;

