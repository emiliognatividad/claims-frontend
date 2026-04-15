import { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      onLogin(res.data.access_token);
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dark)'
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 16,
        padding: '48px 40px',
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Claims Platform</h1>
        <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 32 }}>Sign in to your account</p>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: 'var(--red)',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--purple)',
            color: 'var(--white)',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
