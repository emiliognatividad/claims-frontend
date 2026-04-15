import { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function NewCase({ token, onBack, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/cases/?token=${token}`, form);
      onCreated();
    } catch {
      setError('Failed to create case. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#2563eb',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0
      }}>← Back</button>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 20 }}>New case</h2>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Title</label>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Shipment #4821 — cargo damaged in transit"
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e0e4f0',
              borderRadius: 8, fontSize: 13, outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the claim in detail..."
            rows={4}
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e0e4f0',
              borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Priority</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['low', 'medium', 'high'].map(p => (
              <button key={p} onClick={() => setForm({ ...form, priority: p })} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: form.priority === p ? (p === 'high' ? '#fef2f2' : p === 'medium' ? '#fff7ed' : '#f0fdf4') : '#f8fafc',
                color: form.priority === p ? (p === 'high' ? '#dc2626' : p === 'medium' ? '#c2410c' : '#16a34a') : '#64748b',
                border: `1px solid ${form.priority === p ? (p === 'high' ? '#fecaca' : p === 'medium' ? '#fed7aa' : '#bbf7d0') : '#e0e4f0'}`
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={loading} style={{
          width: '100%', padding: '12px', background: '#2563eb', color: 'white',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>
          {loading ? 'Creating...' : 'Create case'}
        </button>
      </div>
    </div>
  );
}
