import React, { useEffect, useState } from 'react';
import Banner from './Banner';

function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ start: '', end: '', userId: '', logType: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLogs = async () => {
    if (!user?.USER_ID) return;
    const params = new URLSearchParams();
    params.set('requester_id', user.USER_ID);
    if (filters.start) params.set('start_date', filters.start);
    if (filters.end) params.set('end_date', filters.end);
    if (filters.userId) params.set('user_id', filters.userId);
    if (filters.logType) params.set('log_type', filters.logType);
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/auditlogs?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Banner />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Audit Logs</h1>
          <button className="edit-btn" onClick={fetchLogs}>Refresh</button>
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
            <label>Log Type</label>
            <input value={filters.logType} onChange={(e) => setFilters(prev => ({ ...prev, logType: e.target.value }))} placeholder="e.g., LOGIN" />
          </div>
          <div className="form-actions">
            <button className="save-btn" onClick={fetchLogs}>Apply Filters</button>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>LOG_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>LOG_TYPE</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>USER_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>TRANS_ID</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>LOG_DATE</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={`${l.LOG_ID}-${l.LOG_DATE}`}>
                  <td>{l.LOG_ID}</td>
                  <td>{l.LOG_TYPE}</td>
                  <td>{l.USER_ID}</td>
                  <td>{l.TRANS_ID ?? '-'}</td>
                  <td>{new Date(l.LOG_DATE).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminLogsPage;