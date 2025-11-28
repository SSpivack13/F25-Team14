import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Banner from './Banner';
import { authHeaders } from '../utils/auth';

function ApplicationPage() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [organizations, setOrganizations] = useState([]);
  const [sponsorByOrg, setSponsorByOrg] = useState({});
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [form, setForm] = useState({ phone: '', email: '', yearsExperience: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [myNotifications, setMyNotifications] = useState([]);
  const [myDriverOrgs, setMyDriverOrgs] = useState([]);
  const parsePayload = (raw) => {
    try {
      let p = JSON.parse(raw || '{}');
      if (typeof p === 'string') {
        try { p = JSON.parse(p); } catch {}
      }
      return typeof p === 'object' && p ? p : {};
    } catch {
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

  const loadOrganizations = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/organizations`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        const orgs = Array.isArray(data.data) ? data.data : [];
        setOrganizations(orgs);
        if (orgs.length > 0) setSelectedOrgId(String(orgs[0].ORG_ID));
        const sponsorMap = {};
        for (const org of orgs) {
          if (org.ORG_LEADER_ID) {
            try {
              const sRes = await axios.get(`${process.env.REACT_APP_API}/users/${org.ORG_LEADER_ID}/profile`, { headers: authHeaders() });
              if (sRes.data?.status === 'success') sponsorMap[org.ORG_ID] = sRes.data.data;
            } catch {}
          }
        }
        setSponsorByOrg(sponsorMap);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to load organizations' });
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.USER_ID) {
      const refreshMine = () => {
        axios.get(`${process.env.REACT_APP_API}/notifications/my`, { headers: authHeaders() })
          .then(res => { if (res.data?.status === 'success') setMyNotifications(res.data.data || []); })
          .catch(() => {});
        if (user?.USER_TYPE === 'driver') {
          axios.get(`${process.env.REACT_APP_API}/driver/${user.USER_ID}/organizations`, { headers: authHeaders() })
            .then(res => { if (res.data?.status === 'success') setMyDriverOrgs(res.data.data || []); })
            .catch(() => {});
        }
      };
      refreshMine();
      const interval = setInterval(refreshMine, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user?.USER_ID, user?.USER_TYPE]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (!isLoggedIn || !user || user.USER_TYPE !== 'driver') {
      setStatus({ type: 'error', message: 'Only logged-in drivers can apply' });
      return;
    }
    if (!selectedOrgId) {
      setStatus({ type: 'error', message: 'Select an organization' });
      return;
    }

    const org = organizations.find(o => String(o.ORG_ID) === String(selectedOrgId));
    const sponsor = sponsorByOrg[org?.ORG_ID];
    const finalForm = {
      phone: form.phone,
      email: form.email || user?.EMAIL || '',
      yearsExperience: form.yearsExperience,
      message: form.message
    };
    const an = user?.USERNAME || '';
    const compact = {
      an,
      auid: user?.USER_ID,
      oid: org?.ORG_ID,
      on: org?.ORG_NAME,
      ph: finalForm.phone,
      em: finalForm.email,
      exp: finalForm.yearsExperience,
      msg: String(finalForm.message || '').slice(0, 200)
    };
    let content = JSON.stringify(compact);
    if (content.length > 220) {
      const { msg, ...rest } = compact;
      content = JSON.stringify(rest);
    }

    try {
      const payload = { notif_type: 'driver_application', notif_content: content, recipients: { type: 'users', user_ids: [sponsor?.USER_ID || org.ORG_LEADER_ID] } };
      const res = await axios.post(`${process.env.REACT_APP_API}/notifications/send`, payload, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      if (res.data?.status === 'success') {
        try {
          const selfPayload = { notif_type: 'driver_application_request', notif_content: JSON.stringify({ ...compact, st: 'pending' }), recipients: { type: 'user', user_id: user.USER_ID } };
          await axios.post(`${process.env.REACT_APP_API}/notifications/send`, selfPayload, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
        } catch {}
        setStatus({ type: 'success', message: 'Application submitted to sponsor' });
        setForm({ phone: '', email: '', yearsExperience: '', message: '' });
      } else {
        setStatus({ type: 'error', message: res.data?.message || 'Failed to submit application' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server error submitting application' });
    }
  };

  return (
    <div>
      <Banner />
      <div className="template-content">
        <div className="template-card">
          <h1>Driver Applications</h1>
          {status.message && (
            <div className={`message ${status.type}`} style={{ marginBottom: '1rem' }}>{status.message}</div>
          )}

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <h3>Organizations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} style={{ padding: '8px' }}>
                  {organizations.map(org => (
                    <option key={org.ORG_ID} value={org.ORG_ID}>{org.ORG_NAME}</option>
                  ))}
                </select>
                {selectedOrgId && (
                  <div style={{ fontSize: '0.95rem', color: '#333' }}>
                    <div><strong>Sponsor:</strong> {(() => {
                      const s = sponsorByOrg[Number(selectedOrgId)];
                      if (!s) return 'Unknown';
                      const name = [s.F_NAME, s.L_NAME].filter(Boolean).join(' ');
                      return name || s.USERNAME;
                    })()}</div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={submitApplication} style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3>Application</h3>
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="Phone" />
              <label>Email</label>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="Email" />
              <label>Years of Experience</label>
              <input value={form.yearsExperience} onChange={(e) => setField('yearsExperience', e.target.value)} placeholder="e.g. 5" />
              <label>Message</label>
              <textarea rows={5} value={form.message} onChange={(e) => setField('message', e.target.value)} placeholder="Tell us about yourself" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit">Submit Application</button>
                <button type="button" onClick={() => setForm({ phone: '', email: '', yearsExperience: '', message: '' })}>Reset</button>
              </div>
            </form>
          </div>
        </div>
        <div className="template-card" style={{ marginTop: '1rem' }}>
          <h3>My Applications</h3>
          {(() => {
            const reqs = myNotifications.filter(n => n.NOTIF_TYPE === 'driver_application_request').map(n => ({ id: n.NOTIF_ID, p: parsePayload(n.NOTIF_CONTENT) })).filter(a => a.p.auid === user?.USER_ID);
            const decisions = myNotifications.filter(n => n.NOTIF_TYPE === 'driver_application_decision').map(n => ({ id: n.NOTIF_ID, p: parsePayload(n.NOTIF_CONTENT) })).filter(a => a.p.auid === user?.USER_ID);
            const latestByOrg = {};
            decisions.forEach(d => { latestByOrg[d.p.oid] = d; });
            const items = reqs.map(r => {
              const dec = latestByOrg[r.p.oid];
              const s = dec?.p?.st || r.p.st || 'awaiting';
              const inOrg = myDriverOrgs.some(o => String(o.ORG_ID) === String(r.p.oid));
              return { id: r.id, p: r.p, status: s, inOrg };
            });
            return items.length === 0 ? (
              <div style={{ color: '#666' }}>No applications</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(it => (
                  <div key={it.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px' }}>
                    <div><strong>Organization:</strong> {it.p.on} (ID {it.p.oid})</div>
                    <div><strong>Status:</strong> {it.status}</div>
                    {it.inOrg && it.status !== 'accepted' && (
                      <div style={{ color: '#007bff' }}>Note: You are already in this organization</div>
                    )}
                    <div style={{ color: '#666' }}><strong>Submitted:</strong> {it.p.msg ? it.p.msg : ''}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ marginTop: '8px' }}>
            <button onClick={() => {
              axios.get(`${process.env.REACT_APP_API}/notifications/my`, { headers: authHeaders() })
                .then(res => { if (res.data?.status === 'success') setMyNotifications(res.data.data || []); })
                .catch(() => {});
              if (user?.USER_TYPE === 'driver') {
                axios.get(`${process.env.REACT_APP_API}/driver/${user.USER_ID}/organizations`, { headers: authHeaders() })
                  .then(res => { if (res.data?.status === 'success') setMyDriverOrgs(res.data.data || []); })
                  .catch(() => {});
              }
            }}>Refresh</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationPage;
