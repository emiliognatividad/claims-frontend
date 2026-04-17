import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CaseDetail from './CaseDetail';
import NewCase from './NewCase';
import Profile from './Profile';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const statusColors = {
  open: { bg: '#eff6ff', color: '#1d4ed8' },
  in_review: { bg: '#fefce8', color: '#a16207' },
  pending_approval: { bg: '#fff7ed', color: '#c2410c' },
  escalated: { bg: '#fef2f2', color: '#dc2626' },
  approved: { bg: '#f0fdf4', color: '#16a34a' },
  resolved: { bg: '#f0fdf4', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' },
};

const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const priorityOrder = { high: 0, medium: 1, low: 2 };

const industryColors = {
  'E-commerce': '#2563eb',
  'Pharmaceutical': '#7c3aed',
  'Automotive': '#0891b2',
  'Retail': '#d97706',
  'Industrial': '#64748b',
  'Food & Beverage': '#16a34a',
  'Government': '#dc2626',
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getDaysOld(createdAt) {
  const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  return days === 0 ? 'today' : days === 1 ? '1 day old' : `${days} days old`;
}

function getSLAColor(deadline, status) {
  if (status === 'resolved' || status === 'rejected') return '#94a3b8';
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return daysLeft < 0 ? '#ef4444' : daysLeft <= 2 ? '#f59e0b' : '#94a3b8';
}

function getSLALabel(deadline, status) {
  if (status === 'resolved' || status === 'rejected') return new Date(deadline).toLocaleDateString();
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const base = new Date(deadline).toLocaleDateString();
  if (daysLeft < 0) return `${base} · overdue`;
  if (daysLeft === 0) return `${base} · today`;
  if (daysLeft === 1) return `${base} · tomorrow`;
  return base;
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

function StatCard({ label, value, sub, subColor, color, onClick }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') { setDisplayed(value); return; }
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 12, padding: '20px',
      border: '1px solid #e0e4f0', cursor: onClick ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = '#2563eb')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = '#e0e4f0')}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#1e293b' }}>{displayed}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

function HealthPage({ token, summary }) {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    axios.get(`${API}/analytics/summary?token=${token}`)
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 20 }}>System health</h2>
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Services</div>
        {[
          { label: 'API Server', status: apiStatus, detail: API },
          { label: 'Database', status: apiStatus === 'online' ? 'online' : 'unknown', detail: 'PostgreSQL 15' },
          { label: 'Frontend', status: 'online', detail: 'React 18' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: s.status === 'online' ? '#16a34a' : s.status === 'checking' ? '#f59e0b' : '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.detail}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: s.status === 'online' ? '#f0fdf4' : s.status === 'checking' ? '#fff7ed' : '#fef2f2', color: s.status === 'online' ? '#16a34a' : s.status === 'checking' ? '#c2410c' : '#dc2626' }}>{s.status}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Platform stats</div>
        {summary && [
          { label: 'Total cases', value: summary.total },
          { label: 'Open cases', value: summary.open },
          { label: 'Escalated', value: summary.escalated },
          { label: 'Resolved', value: summary.resolved },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>{s.label}</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.value}</span>
          </div>
        ))}
      </div>
      <a href={`${API}/docs`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
        Open API Docs (Swagger) ↗
      </a>
    </div>
  );
}

export default function Dashboard({ token, user, onLogout }) {
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [clientFilter, setClientFilter] = useState(null);
  const [industryFilter, setIndustryFilter] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState('dashboard');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const isMobile = useWindowWidth() < 768;

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (summary) {
      document.title = (summary.escalated + summary.pending_approval) > 0
        ? `(${summary.escalated + summary.pending_approval}) Claims Platform`
        : 'Claims Platform';
    }
  }, [summary]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { setShowNotifications(false); setShowMobileMenu(false); setShowProfile(false); }
      if (e.key === 'n' && !e.target.matches('input, textarea')) setShowNewCase(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesRes, summaryRes] = await Promise.all([
        axios.get(`${API}/cases/?token=${token}`),
        axios.get(`${API}/analytics/summary?token=${token}`)
      ]);
      setCases(casesRes.data);
      setSummary(summaryRes.data);
      setLastRefreshed(new Date());
    } catch (err) {
      if (err?.response?.status === 401) {
        onLogout();
      }
    }
    setLoading(false);
  };
  

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const clearAllFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setSearch('');
    setClientFilter(null);
    setIndustryFilter(null);
  };

  const filteredCases = cases
    .filter(c => {
      const match = c.description?.match(/\[(.+?) — (.+?)\]/);
      const industry = match ? match[1] : null;
      const client = match ? match[2] : null;
      return (
        (!statusFilter || c.status === statusFilter) &&
        (!priorityFilter || c.priority === priorityFilter) &&
        (!search || c.title.toLowerCase().includes(search.toLowerCase())) &&
        (!clientFilter || client === clientFilter) &&
        (!industryFilter || industry === industryFilter)
      );
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      let av, bv;
      if (sortBy === 'priority') { av = priorityOrder[a.priority]; bv = priorityOrder[b.priority]; }
      else if (sortBy === 'sla') { av = new Date(a.sla_deadline); bv = new Date(b.sla_deadline); }
      else if (sortBy === 'status') { av = a.status; bv = b.status; }
      else if (sortBy === 'created') { av = new Date(a.created_at); bv = new Date(b.created_at); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredCases.length / pageSize);
  const pagedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = cases.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length;
    return { day: label, cases: count };
  });

  const statusChartData = summary ? [
    { name: 'Open', value: summary.open, color: '#2563eb' },
    { name: 'In review', value: summary.in_review, color: '#60a5fa' },
    { name: 'Pending', value: summary.pending_approval, color: '#f59e0b' },
    { name: 'Escalated', value: summary.escalated, color: '#ef4444' },
    { name: 'Resolved', value: summary.resolved, color: '#16a34a' },
  ] : [];

  const clientCounts = {};
  const clientIndustry = {};
  cases.forEach(c => {
    if (c.description) {
      const match = c.description.match(/\[(.+?) — (.+?)\]/);
      if (match) {
        const industry = match[1];
        const client = match[2];
        clientCounts[client] = (clientCounts[client] || 0) + 1;
        clientIndustry[client] = industry;
      }
    }
  });
  const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const industryCounts = {};
  cases.forEach(c => {
    if (c.description) {
      const match = c.description.match(/\[(.+?) — (.+?)\]/);
      if (match) {
        const industry = match[1];
        industryCounts[industry] = (industryCounts[industry] || 0) + 1;
      }
    }
  });
  const industries = Object.keys(industryCounts);

  const resolvedRate = summary ? Math.round((summary.resolved / summary.total) * 100) : 0;
  const avgAge = cases.length > 0 ? Math.round(cases.reduce((acc, c) => acc + Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24)), 0) / cases.length) : 0;

  const navigateTo = (p) => { setPage(p); setShowMobileMenu(false); };

  const recentSorted = [...cases].sort((a, b) => {
    if (!sortBy) return new Date(b.created_at) - new Date(a.created_at);
    let av, bv;
    if (sortBy === 'priority') { av = priorityOrder[a.priority]; bv = priorityOrder[b.priority]; }
    else if (sortBy === 'sla') { av = new Date(a.sla_deadline); bv = new Date(b.sla_deadline); }
    else if (sortBy === 'status') { av = a.status; bv = b.status; }
    else if (sortBy === 'created') { av = new Date(a.created_at); bv = new Date(b.created_at); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }).slice(0, 8);

  const activeFilterCount = [statusFilter, priorityFilter, clientFilter, industryFilter, search].filter(Boolean).length;

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e0e4f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (showProfile) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }}>
        {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
          <Profile token={token} user={user} onBack={() => setShowProfile(false)} />
        </div>
      </div>
    );
  }

  if (showNewCase) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }}>
        {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
          <NewCase token={token} onBack={() => setShowNewCase(false)} onCreated={() => { setShowNewCase(false); fetchData(); }} />
        </div>
      </div>
    );
  }

  if (selectedCase) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }}>
        {!isMobile && <Sidebar page={lastPage} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
          <CaseDetail token={token} user={user} caseId={selectedCase} onBack={() => { setSelectedCase(null); setPage(lastPage); fetchData(); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }} onClick={() => setShowNotifications(false)}>
      {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', padding: isMobile ? '12px 16px' : '14px 24px', borderBottom: '1px solid #e0e4f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={(e) => { e.stopPropagation(); setShowMobileMenu(prev => !prev); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            {isMobile ? (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}><span style={{ color: '#2563eb' }}>Claims</span> Platform</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h1 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{page}</h1>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage('cases'); setCurrentPage(1); }}
                  placeholder="Search cases... (or press N)"
                  style={{ padding: '7px 14px', border: '1px solid #e0e4f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 260, color: '#334155' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Refreshed {Math.floor((new Date() - lastRefreshed) / 60000)} min ago
                </span>
                <button onClick={fetchData} style={{ background: 'none', border: '1px solid #e0e4f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
            )}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <div style={{ cursor: 'pointer' }} onClick={() => setShowNotifications(prev => !prev)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {summary && (summary.escalated + summary.pending_approval) > 0 && (
                  <div style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {summary.escalated + summary.pending_approval}
                  </div>
                )}
              </div>
              {showNotifications && (
                <div style={{ position: 'absolute', top: 32, right: 0, background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', width: 320, zIndex: 100, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Needs attention</div>
                  {cases.filter(c => c.status === 'escalated' || c.status === 'pending_approval').length === 0 && (
                    <div style={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>All clear</div>
                  )}
                  {cases.filter(c => c.status === 'escalated' || c.status === 'pending_approval').map(c => (
                    <div key={c.id} onClick={() => { setLastPage(page); setSelectedCase(c.id); setShowNotifications(false); }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.status === 'escalated' ? '#ef4444' : '#f59e0b' }} />
                      <div>
                        <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.status.replace(/_/g, ' ')} · {getDaysOld(c.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isMobile && (
              <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {user?.role || 'user'} · Logistics Claims
              </div>
            )}
          </div>
        </div>

        {isMobile && (
          <div style={{ background: 'white', padding: '8px 16px', borderBottom: '1px solid #e0e4f0' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage('cases'); setCurrentPage(1); }} placeholder="Search cases..." style={{ width: '100%', padding: '8px 14px', border: '1px solid #e0e4f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#334155' }} />
          </div>
        )}

        {isMobile && showMobileMenu && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, display: 'flex' }} onClick={() => setShowMobileMenu(false)}>
            <div style={{ width: 240, background: 'white', height: '100%', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                <span style={{ color: '#2563eb' }}>Claims</span> Platform
              </div>
              <nav style={{ marginTop: 8, flex: 1 }}>
                {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'cases', label: `All cases (${cases.length})` }, { id: 'health', label: 'System health' }].map(item => (
                  <div key={item.id} onClick={() => navigateTo(item.id)} style={{ padding: '12px 20px', fontSize: 14, cursor: 'pointer', color: page === item.id ? '#2563eb' : '#64748b', background: page === item.id ? '#eff6ff' : 'transparent', fontWeight: page === item.id ? 500 : 400 }}>{item.label}</div>
                ))}
                <div onClick={() => window.open(`${API}/docs`, '_blank')} style={{ padding: '12px 20px', fontSize: 14, cursor: 'pointer', color: '#64748b' }}>API Docs ↗</div>
              </nav>
              <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Signed in as <span style={{ color: '#64748b', fontWeight: 500 }}>{user?.role}</span></div>
                <button onClick={() => { setShowMobileMenu(false); setShowProfile(true); }} style={{ width: '100%', padding: 8, background: '#f8fafc', border: '1px solid #e0e4f0', color: '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: 12, marginBottom: 8 }}>Profile & settings</button>
                <button onClick={onLogout} style={{ width: '100%', padding: 8, background: '#f8fafc', border: '1px solid #e0e4f0', color: '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
          {page === 'health' && <HealthPage token={token} summary={summary} />}

          {page === 'dashboard' && summary && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                <StatCard label="Total cases" value={summary.total} sub={`${resolvedRate}% resolved`} subColor="#2563eb" onClick={() => { setPage('cases'); setStatusFilter(null); }} />
                <StatCard label="Open" value={summary.open} color="#2563eb" sub="awaiting action" subColor="#94a3b8" onClick={() => { setPage('cases'); setStatusFilter('open'); }} />
                <StatCard label="Escalated" value={summary.escalated} color="#ef4444" sub="needs attention" subColor="#ef4444" onClick={() => { setPage('cases'); setStatusFilter('escalated'); }} />
                <StatCard label="Avg case age" value={`${avgAge}d`} color="#64748b" sub="across all cases" subColor="#94a3b8" />
              </div>

              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Case volume</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Last 7 days</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0e4f0', fontSize: 12 }} />
                        <Line type="monotone" dataKey="cases" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Cases by status</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Current distribution</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={statusChartData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e0e4f0', fontSize: 12 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: 14, marginBottom: 16 }}>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Top clients</div>
                  <div style={{ padding: '12px 18px' }}>
                    {topClients.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No client data yet</div>}
                    {topClients.map(([client, count], i) => {
                      const industry = clientIndustry[client];
                      const indColor = industryColors[industry] || '#64748b';
                      return (
                        <div key={client}
                          onClick={() => { setClientFilter(client); setPage('cases'); setCurrentPage(1); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topClients.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', borderRadius: 6 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${indColor}20`, color: indColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(client)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{count} case{count !== 1 ? 's' : ''} · {industry}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: indColor }}>#{i + 1}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <CasesTable
                  cases={recentSorted}
                  title="Recent cases"
                  onSelectCase={(id) => { setLastPage('dashboard'); setSelectedCase(id); }}
                  onNewCase={() => setShowNewCase(true)}
                  priorityFilter={priorityFilter}
                  onPriorityFilter={(p) => { setPriorityFilter(p); setPage('cases'); }}
                  onSort={handleSort}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  showPagination={false}
                  isMobile={isMobile}
                  showViewAll={() => setPage('cases')}
                />
              </div>
            </>
          )}

          {page === 'cases' && (
            <>
              {!isMobile && industries.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {industries.map(ind => (
                    <button key={ind} onClick={() => { setIndustryFilter(industryFilter === ind ? null : ind); setCurrentPage(1); }} style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      background: industryFilter === ind ? `${industryColors[ind] || '#64748b'}15` : 'white',
                      color: industryFilter === ind ? (industryColors[ind] || '#64748b') : '#64748b',
                      border: `1px solid ${industryFilter === ind ? (industryColors[ind] || '#64748b') : '#e0e4f0'}`
                    }}>{ind}</button>
                  ))}
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 500 }}>
                      Clear all ({activeFilterCount})
                    </button>
                  )}
                </div>
              )}
              <CasesTable
                cases={pagedCases}
                title={
                  clientFilter ? `Cases for ${clientFilter}` :
                  industryFilter ? `${industryFilter} cases` :
                  search ? `Results for "${search}"` :
                  statusFilter ? `${statusFilter.replace(/_/g, ' ')} cases` :
                  priorityFilter ? `${priorityFilter} priority cases` :
                  'All cases'
                }
                onSelectCase={(id) => { setLastPage('cases'); setSelectedCase(id); }}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                onClearFilter={clearAllFilters}
                onNewCase={() => setShowNewCase(true)}
                onPriorityFilter={(p) => { setPriorityFilter(p); setCurrentPage(1); }}
                onSort={handleSort}
                sortBy={sortBy}
                sortDir={sortDir}
                showPagination={true}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredCases.length}
                onPageChange={setCurrentPage}
                isMobile={isMobile}
                activeFilterCount={activeFilterCount}
                onClearAll={clearAllFilters}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout, user, caseCount, onProfile }) {
  return (
    <div style={{ width: 220, background: 'white', borderRight: '1px solid #e0e4f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
          <span style={{ color: '#2563eb' }}>Claims</span> Platform
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Logistics operations</div>
      </div>
      <nav style={{ marginTop: 8, flex: 1 }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '◉' },
          { id: 'cases', label: 'All cases', icon: '◈', count: caseCount },
          { id: 'health', label: 'System health', icon: '◆' },
          { id: 'api', label: 'API Docs', icon: '◇', external: `${API}/docs` },
        ].map(item => (
          <div key={item.id}
            onClick={() => item.external ? window.open(item.external, '_blank') : setPage(item.id)}
            style={{
              padding: '10px 16px', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              color: page === item.id ? '#2563eb' : '#64748b',
              background: page === item.id ? '#eff6ff' : 'transparent',
              borderRadius: 8, margin: '2px 8px', fontWeight: page === item.id ? 500 : 400
            }}>
            <span style={{ fontSize: 12 }}>{item.icon}</span>
            {item.label}
            {item.count !== undefined && (
              <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>
                {item.count}
              </span>
            )}
            {item.external && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>↗</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
        <div
          onClick={onProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', borderRadius: 8, padding: '6px 8px' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user?.role?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{user?.email || user?.role || 'user'}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>View profile →</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: 8, background: '#f8fafc', border: '1px solid #e0e4f0', color: '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
      </div>
    </div>
  );
}

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <span style={{ color: '#cbd5e1', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#2563eb', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

function CasesTable({ cases, title, onSelectCase, statusFilter, priorityFilter, onClearFilter, onNewCase, onPriorityFilter, onSort, sortBy, sortDir, showPagination, currentPage, totalPages, totalCount, onPageChange, isMobile, showViewAll, activeFilterCount, onClearAll }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{title}</span>
          {showPagination && totalCount > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>({totalCount})</span>}
          {activeFilterCount > 0 && onClearAll && (
            <button onClick={onClearAll} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
          )}
          {showViewAll && (
            <button onClick={showViewAll} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer' }}>View all →</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {!isMobile && ['high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => onPriorityFilter && onPriorityFilter(priorityFilter === p ? null : p)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              background: priorityFilter === p ? (p === 'high' ? '#fef2f2' : p === 'medium' ? '#fff7ed' : '#f0fdf4') : '#f8fafc',
              color: priorityFilter === p ? (p === 'high' ? '#dc2626' : p === 'medium' ? '#c2410c' : '#16a34a') : '#64748b',
              border: `1px solid ${priorityFilter === p ? (p === 'high' ? '#fecaca' : p === 'medium' ? '#fed7aa' : '#bbf7d0') : '#e0e4f0'}`
            }}>{p}</button>
          ))}
          <button onClick={onNewCase} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>+ New</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: isMobile ? 500 : 'auto' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th onClick={() => onSort('created')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Title <SortIcon col="created" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th onClick={() => onSort('priority')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Priority <SortIcon col="priority" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th onClick={() => onSort('status')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Status <SortIcon col="status" sortBy={sortBy} sortDir={sortDir} />
              </th>
              {!isMobile && <th style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0' }}>Client</th>}
              {!isMobile && <th style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0' }}>Industry</th>}
              <th onClick={() => onSort('sla')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                SLA <SortIcon col="sla" sortBy={sortBy} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 && (
              <tr>
                <td colSpan={isMobile ? 4 : 6} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>No cases found</div>
                  <button onClick={onNewCase} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    + Create first case
                  </button>
                </td>
              </tr>
            )}
            {cases.map(c => {
              const clientMatch = c.description?.match(/\[(.+?) — (.+?)\]/);
              const industry = clientMatch ? clientMatch[1] : null;
              const clientName = clientMatch ? clientMatch[2] : null;
              const indColor = industryColors[industry] || '#64748b';
              return (
                <tr key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: c.status === 'escalated' ? '#fff8f8' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = c.status === 'escalated' ? '#fff0f0' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = c.status === 'escalated' ? '#fff8f8' : 'transparent'}
                >
                  <td style={{ padding: '11px 18px', color: '#334155', maxWidth: 260 }}>
                    <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{getDaysOld(c.created_at)}</div>
                  </td>
                  <td style={{ padding: '11px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[c.priority] }} />
                      <span style={{ color: '#64748b' }}>{c.priority}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: statusColors[c.status]?.bg, color: statusColors[c.status]?.color }}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  {!isMobile && (
                    <td style={{ padding: '11px 18px' }}>
                      {clientName ? (
                        <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: 6, border: '1px solid #e0e4f0' }}>{clientName}</span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                    </td>
                  )}
                  {!isMobile && (
                    <td style={{ padding: '11px 18px' }}>
                      {industry ? (
                        <span style={{ fontSize: 11, color: indColor, background: `${indColor}15`, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>{industry}</span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                    </td>
                  )}
                  <td style={{ padding: '11px 18px' }}>
                    {c.sla_deadline ? (
                      <span style={{ color: getSLAColor(c.sla_deadline, c.status), fontSize: 11 }}>{getSLALabel(c.sla_deadline, c.status)}</span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Page {currentPage} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e0e4f0', background: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#cbd5e1' : '#334155', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
            <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e0e4f0', background: currentPage === totalPages ? '#f8fafc' : 'white', color: currentPage === totalPages ? '#cbd5e1' : '#334155', cursor: currentPage === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
