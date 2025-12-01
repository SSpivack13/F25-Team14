import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';

function NotificationsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [form, setForm] = useState({ notif_type: '', notif_content: '' });
  const [status, setStatus] = useState(null);
  const [recipients, setRecipients] = useState({ mode: 'single', value: '' });
  const [myNotifications, setMyNotifications] = useState([]);
  const parsePayload = (raw) => {
    try {
      let p = JSON.parse(raw || '{}');
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch {}
      }
      return typeof p === 'object' && p ? p : {};
    } catch {
      // Fallback: try to extract compact keys from truncated JSON string
      const s = String(raw || '');
      const grabStr = (key) => {
        const m = s.match(new RegExp(`${key}\\":\\"([^\\"]*)`));
        return m && m[1] ? m[1] : '';
      };
      const grabNum = (key) => {
        const m = s.match(new RegExp(`${key}\\":(\\d+)`));
        return m && m[1] ? Number(m[1]) : undefined;
      };
      return {
        an: grabStr('an'),
        auid: grabNum('auid'),
        on: grabStr('on'),
        oid: grabNum('oid'),
        ph: grabStr('ph'),
        em: grabStr('em'),
        exp: grabStr('exp'),
        msg: grabStr('msg'),
        st: grabStr('st')
      };
    }
  };
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/notifications/my`, { headers: authHeaders() });
        if (res.data?.status === 'success') setMyNotifications(res.data.data || []);
      } catch {}
    };
    fetchMine();
  }, []);

  const [myDriverOrgs, setMyDriverOrgs] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [sponsorOrgId, setSponsorOrgId] = useState(null);

  useEffect(() => {
    if (user?.USER_TYPE === 'driver' && user?.USER_ID) {
      axios.get(`${process.env.REACT_APP_API}/driver/${user.USER_ID}/organizations`, { headers: authHeaders() })
        .then(res => { if (res.data?.status === 'success') setMyDriverOrgs(res.data.data || []); })
        .catch(() => {});
    }
  }, [user?.USER_TYPE, user?.USER_ID]);

  // Fetch users in sponsor's organization for dropdown (only those with email)
  useEffect(() => {
    if (user?.USER_TYPE === 'sponsor' && user?.USER_ID) {
      // Fetch the sponsor's organization details to get ORG_ID
      axios.get(`${process.env.REACT_APP_API}/organizations/my-org/${user.USER_ID}`, { headers: authHeaders() })
        .then(res => {
          if (res.data?.status === 'success' && res.data.data?.organization) {
            const orgId = res.data.data.organization.ORG_ID;
            setSponsorOrgId(orgId);

            // Now fetch drivers with the org ID
            return axios.get(`${process.env.REACT_APP_API}/users/${user.USER_ID}/organization/drivers`, { headers: authHeaders() });
          }
        })
        .then(res => {
          if (res && res.data?.status === 'success') {
            // Filter to only include users with an email address
            const usersWithEmail = (res.data.data || []).filter(u => u.EMAIL && u.EMAIL.trim() !== '');
            setOrgUsers(usersWithEmail);
          }
        })
        .catch(err => {
          console.error('Failed to fetch organization data:', err);
        });
    }
  }, [user?.USER_TYPE, user?.USER_ID]);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!form.notif_type.trim() || !form.notif_content.trim()) return setStatus({ type: 'error', message: 'Type and content required' });

    let recPayload = null;
    if (recipients.mode === 'all') {
      // Send to all users in the organization
      console.log('Sponsor Org ID:', sponsorOrgId);
      if (!sponsorOrgId) return setStatus({ type: 'error', message: 'Organization ID not found. Please refresh the page.' });
      recPayload = { type: 'org', org_id: sponsorOrgId };
    } else {
      // Send to single user
      if (!recipients.value) return setStatus({ type: 'error', message: 'Please select a recipient' });
      recPayload = { type: 'user', user_id: Number(recipients.value) };
    }

    try {
      const payload = { notif_type: form.notif_type, notif_content: form.notif_content, recipients: recPayload };
      const res = await axios.post(`${process.env.REACT_APP_API}/notifications/send`, payload, { headers: authHeaders() });
      if (res.data?.status === 'success') {
        setStatus({ type: 'success', message: `Notification sent successfully to ${res.data.recipients} user(s)` });
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
        {/* My Applications moved to Application page for drivers */}
        {/* Applications moved to My Organization page for sponsors */}
        {status && (
          <div className={`message ${status.type}`} style={{ marginBottom: '1rem' }}>{status.message}</div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '720px' }}>
          <label>Type</label>
          <input value={form.notif_type} onChange={(e) => handleChange('notif_type', e.target.value)} placeholder="Notification type (free text)" />

          <label>Content</label>
          <textarea value={form.notif_content} onChange={(e) => handleChange('notif_content', e.target.value)} rows={5} />

          <label>Recipients</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="recipientMode"
                checked={recipients.mode === 'single'}
                onChange={() => setRecipients({ mode: 'single', value: '' })}
              />
              Single User
            </label>
            {recipients.mode === 'single' && (
              user?.USER_TYPE === 'sponsor' ? (
                <select
                  value={recipients.value}
                  onChange={(e) => setRecipients({ ...recipients, value: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginLeft: '24px' }}
                >
                  <option value="">-- Select a user --</option>
                  {orgUsers.map(u => (
                    <option key={u.USER_ID} value={u.USER_ID}>
                      {u.F_NAME} {u.L_NAME} ({u.USERNAME}) - {u.EMAIL}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="USER_ID"
                  value={recipients.value}
                  onChange={(e) => setRecipients({ ...recipients, value: e.target.value })}
                  style={{ marginLeft: '24px' }}
                />
              )
            )}

            {user?.USER_TYPE === 'sponsor' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="recipientMode"
                  checked={recipients.mode === 'all'}
                  onChange={() => setRecipients({ mode: 'all', value: '' })}
                />
                All Users in My Organization
              </label>
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
