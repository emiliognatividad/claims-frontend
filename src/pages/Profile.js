import { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Profile({ token, user, onBack }) {
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    escalated: true,
    pending: true,
    assigned: true,
    resolved: false,
  });
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = () => {
    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--accent)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0
      }}>← Back</button>

      {/* Profile header */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--hover-bg)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, flexShrink: 0,
          border: '1px solid var(--card-border)'
        }}>
          {user?.role?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.email || 'Your account'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Role: <span style={{
              background: 'var(--hover-bg)', color: 'var(--accent)',
              padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid var(--card-border)'
            }}>{user?.role || 'user'}</span>
          </div>
        </div>
      </div>

      {/* Display name */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Display name</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your display name"
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid var(--card-border)',
            borderRadius: 8, fontSize: 13, outline: 'none',
            color: 'var(--text-primary)', background: 'var(--input-bg)'
          }}
        />
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Change password</div>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Current password', value: currentPassword, onChange: setCurrentPassword },
            { label: 'New password', value: newPassword, onChange: setNewPassword },
            { label: 'Confirm new password', value: confirmPassword, onChange: setConfirmPassword },
          ].map((field, i) => (
            <div key={i}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{field.label}</label>
              <input type="password" value={field.value} onChange={e => field.onChange(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--card-border)',
                  borderRadius: 8, fontSize: 13, outline: 'none',
                  color: 'var(--text-primary)', background: 'var(--input-bg)'
                }} />
            </div>
          ))}
        </div>
      </div>

      {/* Notification preferences */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Notification preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'escalated', label: 'Escalated cases', desc: 'Notify when a case is escalated' },
            { key: 'pending', label: 'Pending approvals', desc: 'Notify when a case needs approval' },
            { key: 'assigned', label: 'Case assigned to me', desc: 'Notify when a case is assigned to you' },
            { key: 'resolved', label: 'Case resolved', desc: 'Notify when a case is closed' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <div
                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                style={{
                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                  background: notifications[item.key] ? 'var(--accent)' : 'var(--card-border)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3,
                  left: notifications[item.key] ? 21 : 3,
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Theme</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['light', 'dark', 'system'].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: theme === t ? 'var(--hover-bg)' : 'var(--card)',
              color: theme === t ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1px solid ${theme === t ? 'var(--accent)' : 'var(--card-border)'}`,
              textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button onClick={saveProfile} style={{
        width: '100%', padding: '12px',
        background: saved ? '#16a34a' : 'var(--accent)',
        color: 'white', border: 'none', borderRadius: 8,
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.2s'
      }}>
        {saved ? '✓ Saved' : 'Save changes'}
      </button>
    </div>
  );
}
