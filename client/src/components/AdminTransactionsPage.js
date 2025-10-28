import React, { useEffect, useState } from 'react';
import Banner from './Banner';

function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ start: '', end: '', userId: '', orgId: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchTransactions = async () => {
    if (!user?.USER_ID) return;
    const params = new URLSearchParams();
    params.set('requester_id', user.USER_ID);
    if (filters.start) params.set('start_date', filters.start);
    if (filters.end) params.set('end_date', filters.end);
    if (filters.userId) params.set('user_id', filters.userId);
    if (filters.orgId) params.set('org_id', filters.orgId);
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') setTransactions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Points Transactions</h1>
          <button className="edit-btn" onClick={fetchTransactions}>Refresh</button>
        </div>
        <div className="profile-edit" style={{ gap: '8px' }}>
          <div className="form-group">
            <label>Start</label>
            <input type="datetime-local" value={filters.start} onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>End</label>
            <input type="datetime-local" value={filters.end} onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>User ID</label>
            <input type="number" value={filters.userId} onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label>Org ID</label>
            <input type="number" value={filters.orgId} onChange={(e) => setFilters(prev => ({ ...prev, orgId: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="form-actions">
            <button className="save-btn" onClick={fetchTransactions}>Apply Filters</button>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>TRANS_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>USER_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>ORG_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>RULE_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>PT_CHANGE</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>TRANS_DATE</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={`${t.TRANS_ID}-${t.TRANS_DATE}`}>
                  <td>{t.TRANS_ID}</td>
                  <td>{t.USER_ID}</td>
                  <td>{t.ORG_ID ?? '-'}</td>
                  <td>{t.RULE_ID ?? '-'}</td>
                  <td>{t.PT_CHANGE}</td>
                  <td>{new Date(t.TRANS_DATE).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminTransactionsPage;