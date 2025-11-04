import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import { authHeaders } from '../utils/auth';

function PointsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ ORG_ID: '', RULE_TYPE: '', PT_CHANGE: 0 });
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user'));
  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('/login');
      return;
    }
    if (!(user.USER_TYPE === 'admin' || user.USER_TYPE === 'sponsor')) {
      navigate('/');
      return;
    }
    setLoading(false);
    fetchRules();
  }, [isLoggedIn, user, navigate]);

  const fetchRules = async () => {
    try {
      // Server-side verifies token and filters by user role/org. Just call the protected endpoint with auth headers.
      const res = await fetch(`${process.env.REACT_APP_API}/pointrules`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'success') setRules(data.data || []);
    } catch (err) {
      console.error('Failed to load point rules', err);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.RULE_TYPE || newRule.PT_CHANGE === '') return;
    try {
      // For sponsors, use their organization ID automatically
      const payload = { 
        ORG_ID: user?.USER_TYPE === 'sponsor' ? user.ORG_ID : (newRule.ORG_ID || null), 
        RULE_TYPE: newRule.RULE_TYPE, 
        PT_CHANGE: Number(newRule.PT_CHANGE) 
      };
      const res = await fetch(`${process.env.REACT_APP_API}/pointrules/add`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...authHeaders() }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNewRule({ ORG_ID: '', RULE_TYPE: '', PT_CHANGE: 0 });
        fetchRules();
      } else {
        alert(data.message || 'Failed to add rule');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    navigate('/');
  };
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h2>Point Rules Management</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>RULE_ID</th>
                  {user?.USER_TYPE === 'admin' && (
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>ORG_ID</th>
                  )}
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>RULE_TYPE</th>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>PT_CHANGE</th>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.RULE_ID}>
                    <td style={{ padding: '0.5rem' }}>{r.RULE_ID}</td>
                    {user?.USER_TYPE === 'admin' && (
                      <td style={{ padding: '0.5rem' }}>{r.ORG_ID || '-'}</td>
                    )}
                    <td style={{ padding: '0.5rem' }}>{r.RULE_TYPE}</td>
                    <td style={{ padding: '0.5rem' }}>{r.PT_CHANGE}</td>
                    {(user?.USER_TYPE === 'admin' || user?.USER_TYPE === 'sponsor') && (
                      <td style={{ padding: '0.5rem' }}>
                        <button className="template-button" onClick={async () => {
                          if (typeof window !== 'undefined' && !window.confirm('Delete this rule?')) return;
                          try {
                            const res = await fetch(`${process.env.REACT_APP_API}/pointrules/${r.RULE_ID}`, {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', ...authHeaders() }
                            });
                            const data = await res.json();
                            if (data.status === 'success') {
                              const rr = rules.filter(x => x.RULE_ID !== r.RULE_ID);
                              setRules(rr);
                            } else {
                              alert(data.message || 'Failed to delete rule');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Server error');
                          }
                        }}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(user?.USER_TYPE === 'admin' || user?.USER_TYPE === 'sponsor') && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Add Point Rule</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                {user?.USER_TYPE === 'admin' && (
                  <input 
                    className="template-input"
                    placeholder="ORG_ID (optional)" 
                    value={newRule.ORG_ID} 
                    onChange={(e) => setNewRule(prev => ({ ...prev, ORG_ID: e.target.value }))} 
                  />
                )}
                <input 
                  className="template-input"
                  placeholder="RULE_TYPE" 
                  value={newRule.RULE_TYPE} 
                  onChange={(e) => setNewRule(prev => ({ ...prev, RULE_TYPE: e.target.value }))} 
                />
                <input 
                  className="template-input"
                  placeholder="PT_CHANGE" 
                  type="number" 
                  value={newRule.PT_CHANGE} 
                  onChange={(e) => setNewRule(prev => ({ ...prev, PT_CHANGE: e.target.value }))} 
                />
                <button className="template-button" onClick={handleAddRule}>Add Rule</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointsPage;
