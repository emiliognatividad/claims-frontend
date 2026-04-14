import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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
  const user = token ? parseToken(token) : null;

  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t);
      setToken(t);
    }} />;
  }

  return <Dashboard token={token} user={user} onLogout={() => {
    localStorage.removeItem('token');
    setToken(null);
  }} />;
}

export default App;
