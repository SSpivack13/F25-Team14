import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

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
      const res = await fetch(`${process.env.REACT_APP_API}/pointrules`);
      const data = await res.json();
      if (data.status === 'success') setRules(data.data || []);
    } catch (err) {
      console.error('Failed to load point rules', err);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.RULE_TYPE || newRule.PT_CHANGE === '') return;
    try {
      const payload = { ORG_ID: newRule.ORG_ID || null, RULE_TYPE: newRule.RULE_TYPE, PT_CHANGE: Number(newRule.PT_CHANGE), user };
      const res = await fetch(`${process.env.REACT_APP_API}/pointrules/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}} >
        <h1>Point Rules</h1>
        <div style={{ width: '100%', maxWidth: '900px', marginTop: '1rem' }}>
          <h3>Point Rules</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>RULE_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>ORG_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>RULE_TYPE</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>PT_CHANGE</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.RULE_ID}>
                  <td>{r.RULE_ID}</td>
                  <td>{r.ORG_ID || '-'}</td>
                  <td>{r.RULE_TYPE}</td>
                  <td>{r.PT_CHANGE}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {(user?.USER_TYPE === 'admin' || user?.USER_TYPE === 'sponsor') && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Add Point Rule</h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input placeholder="ORG_ID (optional)" value={newRule.ORG_ID} onChange={(e) => setNewRule(prev => ({ ...prev, ORG_ID: e.target.value }))} />
                <input placeholder="RULE_TYPE" value={newRule.RULE_TYPE} onChange={(e) => setNewRule(prev => ({ ...prev, RULE_TYPE: e.target.value }))} />
                <input placeholder="PT_CHANGE" type="number" value={newRule.PT_CHANGE} onChange={(e) => setNewRule(prev => ({ ...prev, PT_CHANGE: e.target.value }))} />
                <button onClick={handleAddRule}>Add Rule</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointsPage;
