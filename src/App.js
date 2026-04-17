import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return {};
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('token'));
  const user = token ? parseToken(token) : null;

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />;
  }

  if (token) {
    return <Dashboard token={token} user={user} onLogout={() => {
      localStorage.removeItem('token');
      setToken(null);
      setShowLanding(true);
    }} />;
  }

  return <Login onLogin={(t) => {
    localStorage.setItem('token', t);
    setToken(t);
  }} />;
}

export default App;
