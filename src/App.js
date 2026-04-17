import { useState, useEffect } from 'react';
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
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const user = token ? parseToken(token) : null;

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />;
  }

  if (token) {
    return <Dashboard token={token} user={user} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={() => {
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
