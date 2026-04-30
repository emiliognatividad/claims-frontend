import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleLogin = async (e = email, p = password) => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, { email: e, password: p });
      onLogin(res.data.access_token);
    } catch { setError('Invalid email or password'); }
    setLoading(false);
  };

  const handleDemo = () => {
    setEmail('requester@claims.com');
    setPassword('123456');
    handleLogin('requester@claims.com', '123456');
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    }}>
      <style>{`
        @keyframes wave1 { 0%,100% { transform: translateX(-50%) rotate(0deg); } 50% { transform: translateX(-50%) rotate(180deg); } }
        @keyframes wave2 { 0%,100% { transform: translateX(-50%) rotate(0deg) scale(1.1); } 50% { transform: translateX(-50%) rotate(-180deg) scale(0.9); } }
        @keyframes wave3 { 0%,100% { transform: translateX(-50%) rotate(45deg); } 50% { transform: translateX(-50%) rotate(225deg) scale(1.1); } }
      `}</style>

      {/* CSS wave bg */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.6 }}>
        <div style={{
          position: 'absolute', width: '200%', height: '200%',
          top: '30%', left: '50%',
          background: 'radial-gradient(ellipse 80% 40% at center, rgba(180,180,180,0.15) 0%, transparent 60%)',
          animation: 'wave1 12s ease-in-out infinite',
          transformOrigin: 'center',
        }} />
        <div style={{
          position: 'absolute', width: '200%', height: '150%',
          top: '20%', left: '50%',
          background: 'radial-gradient(ellipse 60% 30% at center, rgba(220,220,220,0.1) 0%, transparent 60%)',
          animation: 'wave2 16s ease-in-out infinite',
          transformOrigin: 'center',
        }} />
        <div style={{
          position: 'absolute', width: '180%', height: '120%',
          top: '40%', left: '50%',
          background: 'radial-gradient(ellipse 50% 25% at center, rgba(255,255,255,0.08) 0%, transparent 55%)',
          animation: 'wave3 20s ease-in-out infinite',
          transformOrigin: 'center',
        }} />
      </div>

      <div style={{
        width: 380,
        background: 'rgba(28,28,30,0.75)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '44px 40px',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        position: 'relative', zIndex: 2,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: 'white', fontWeight: 600,
          }}>C</div>
          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500, letterSpacing: '-0.01em' }}>Claims Platform</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 36, letterSpacing: '-0.01em' }}>Logistics claims management</p>

        {error && <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 7, letterSpacing: '-0.01em' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '11px 14px', background: focusedField === 'email' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)', border: `1px solid ${focusedField === 'email' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, fontSize: 15, color: 'white', outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 0.2s' }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 7, letterSpacing: '-0.01em' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width: '100%', padding: '11px 14px', background: focusedField === 'password' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)', border: `1px solid ${focusedField === 'password' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, fontSize: 15, color: 'white', outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 0.2s' }}
          />
        </div>

        <button onClick={() => handleLogin()} disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.background = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.01)'}
          style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.92)', color: '#000', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 500, fontFamily: 'inherit', letterSpacing: '-0.01em', cursor: 'pointer', marginBottom: 10, opacity: loading ? 0.6 : 1, transition: 'transform 0.15s, background 0.15s' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <button onClick={handleDemo} disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 15, fontWeight: 400, fontFamily: 'inherit', letterSpacing: '-0.01em', cursor: 'pointer', transition: 'all 0.15s' }}>
          Try demo account
        </button>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 18, letterSpacing: '-0.01em' }}>
          requester@claims.com / 123456
        </p>
      </div>
    </div>
  );
}
