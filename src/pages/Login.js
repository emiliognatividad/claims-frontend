import { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e = email, p = password) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, { email: e, password: p });
      onLogin(res.data.access_token);
    } catch {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  const handleDemo = () => {
    setEmail('requester@claims.com');
    setPassword('123456');
    handleLogin('requester@claims.com', '123456');
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '48px 40px',
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
          <span style={{ color: '#2563eb' }}>Claims</span> Platform
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32 }}>Logistics claims management system</p>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626',
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginBottom: 16
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6, color: '#475569' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid #e0e4f0', borderRadius: 8,
              fontSize: 14, outline: 'none', color: '#334155'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6, color: '#475569' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid #e0e4f0', borderRadius: 8,
              fontSize: 14, outline: 'none', color: '#334155'
            }}
          />
        </div>

        <button
          onClick={() => handleLogin()}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: '#2563eb', color: 'white',
            border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            marginBottom: 12, opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          onClick={handleDemo}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: '#f8fafc', color: '#64748b',
            border: '1px solid #e0e4f0', borderRadius: 8,
            fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}
        >
          Try demo account
        </button>

        <p style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', marginTop: 16 }}>
          Demo: requester@claims.com / 123456
        </p>
      </div>
    </div>
  );
}
