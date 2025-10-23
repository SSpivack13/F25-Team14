import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

function NotificationsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ notif_type: '', notif_content: '' });
  const [status, setStatus] = useState(null);
  const [recipients, setRecipients] = useState({ mode: 'single', value: '' });
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!form.notif_type.trim() || !form.notif_content.trim()) return setStatus({ type: 'error', message: 'Type and content required' });

    // Build recipients payload
    let recPayload = null;
    if (recipients.mode === 'single') {
      recPayload = { type: 'user', user_id: Number(recipients.value) };
    } else if (recipients.mode === 'multiple') {
      const ids = String(recipients.value).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      recPayload = { type: 'users', user_ids: ids };
    } else if (recipients.mode === 'org') {
      recPayload = { type: 'org', org_id: recipients.value };
    } else {
      return setStatus({ type: 'error', message: 'Invalid recipient mode' });
    }

    try {
      const payload = { notif_type: form.notif_type, notif_content: form.notif_content, recipients: recPayload };
      const res = await axios.post(`${process.env.REACT_APP_API}/notifications/send`, payload);
      if (res.data?.status === 'success') {
        setStatus({ type: 'success', message: `Sent to ${res.data.recipients} users` });
        setForm({ notif_type: '', notif_content: '' });
        setRecipients({ mode: 'single', value: '' });
      } else setStatus({ type: 'error', message: res.data?.message || 'Failed' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Server error' });
    }
  };

  return (
    <div>
      <Banner />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}} >
        <h2>Send Notification</h2>
        {status && (
          <div className={`message ${status.type}`} style={{ marginBottom: '1rem' }}>{status.message}</div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '720px' }}>
          <label>Type</label>
          <input value={form.notif_type} onChange={(e) => handleChange('notif_type', e.target.value)} placeholder="Notification type (free text)" />

          <label>Content</label>
          <textarea value={form.notif_content} onChange={(e) => handleChange('notif_content', e.target.value)} rows={5} />

          <label>Recipients</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label>
              <input type="radio" name="recipients" checked={recipients.mode === 'single'} onChange={() => setRecipients({ mode: 'single', value: '' })} /> Single USER_ID
            </label>
            {recipients.mode === 'single' && (
              <input placeholder="USER_ID" value={recipients.value} onChange={(e) => setRecipients({ ...recipients, value: e.target.value })} />
            )}

            <label>
              <input type="radio" name="recipients" checked={recipients.mode === 'multiple'} onChange={() => setRecipients({ mode: 'multiple', value: '' })} /> Multiple USER_IDs (CSV)
            </label>
            {recipients.mode === 'multiple' && (
              <input placeholder="e.g. 12,34,56" value={recipients.value} onChange={(e) => setRecipients({ ...recipients, value: e.target.value })} />
            )}

            <label>
              <input type="radio" name="recipients" checked={recipients.mode === 'org'} onChange={() => setRecipients({ mode: 'org', value: '' })} /> Entire ORG_ID
            </label>
            {recipients.mode === 'org' && (
              <input placeholder="ORG_ID" value={recipients.value} onChange={(e) => setRecipients({ ...recipients, value: e.target.value })} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit">Send Notification</button>
            <button type="button" onClick={() => { setForm({ notif_type: '', notif_content: '' }); setRecipients({ mode: 'single', value: '' }); }}>Reset</button>
            <button type="button" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NotificationsPage;
