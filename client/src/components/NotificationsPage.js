import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

function NotificationsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ notif_type: 'info', notif_content: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!form.notif_type.trim() || !form.notif_content.trim()) {
      setStatus({ type: 'error', message: 'Type and content are required.' });
      return;
    }

    try {
      const payload = {
        notif_type: form.notif_type,
        notif_content: form.notif_content
      };

      const res = await axios.post(`${process.env.REACT_APP_API}/notifications/add`, payload);
      if (res.data?.status === 'success') {
        setStatus({ type: 'success', message: 'Notification posted.' });
  setForm({ notif_type: 'info', notif_content: '' });
      } else {
        setStatus({ type: 'error', message: res.data?.message || 'Failed to post notification' });
      }
    } catch (err) {
      console.error('Error posting notification', err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Server error' });
    }
  };

  return (
    <div>
      <Banner />
      <div className="template-content" style={{ padding: '1rem' }}>
        <h2>Create Notification</h2>
        {status && (
          <div className={`message ${status.type}`} style={{ marginBottom: '1rem' }}>
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
            <label>Type</label>
            <select value={form.notif_type} onChange={(e) => handleChange('notif_type', e.target.value)}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>

            <label>Content</label>
            <textarea value={form.notif_content} onChange={(e) => handleChange('notif_content', e.target.value)} rows={4} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit">Post Notification</button>
            <button type="button" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NotificationsPage;
