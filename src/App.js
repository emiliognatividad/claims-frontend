import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t);
      setToken(t);
    }} />;
  }

  return <Dashboard token={token} onLogout={() => {
    localStorage.removeItem('token');
    setToken(null);
  }} />;
}

export default App;
