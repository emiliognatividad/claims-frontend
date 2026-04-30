import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CaseDetail from './CaseDetail';
import NewCase from './NewCase';
import Profile from './Profile';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const statusColors = {
  open: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' },
  in_review: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' },
  pending_approval: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' },
  escalated: { bg: 'rgba(255,80,80,0.15)', color: 'rgba(255,160,160,0.9)' },
  approved: { bg: 'rgba(80,255,140,0.1)', color: 'rgba(140,255,180,0.8)' },
  resolved: { bg: 'rgba(80,255,140,0.1)', color: 'rgba(140,255,180,0.8)' },
  rejected: { bg: 'rgba(255,80,80,0.1)', color: 'rgba(255,160,160,0.8)' },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getDaysOld(createdAt) {
  const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  return days === 0 ? 'today' : days === 1 ? '1d old' : `${days}d old`;
}

function getSLAColor(deadline, status) {
  if (status === 'resolved' || status === 'rejected') return 'rgba(255,255,255,0.25)';
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return daysLeft < 0 ? 'rgba(255,120,120,0.8)' : daysLeft <= 2 ? 'rgba(255,200,100,0.8)' : 'rgba(255,255,255,0.3)';
}

function getSLALabel(deadline, status) {
  if (status === 'resolved' || status === 'rejected') return new Date(deadline).toLocaleDateString();
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const base = new Date(deadline).toLocaleDateString();
  if (daysLeft < 0) return `${base} · overdue`;
  if (daysLeft === 0) return `${base} · today`;
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

function exportToCSV(cases) {
  const rows = cases.map(c => {
    const match = c.description?.match(/\[(.+?) — (.+?)\]/);
    const industry = match ? match[1] : '';
    const client = match ? match[2] : '';
    return [c.id, `"${c.title.replace(/"/g, '""')}"`, c.status, c.priority, client, industry, c.claimed_amount || '', new Date(c.created_at).toLocaleDateString(), c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : ''].join(',');
  });
  const csv = ['ID,Title,Status,Priority,Client,Industry,Claimed Amount,Created,SLA Deadline', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `claims-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub, subColor, onClick }) {
  const [displayed, setDisplayed] = useState('');
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
      background: '#1c1c1e', borderRadius: 16, padding: '22px 24px',
      border: '1px solid rgba(255,255,255,0.06)', cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginBottom: 10, letterSpacing: '-0.01em' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.03em', lineHeight: 1 }}>{displayed}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: '-0.01em' }}>{sub}</div>}
    </div>
  );
}

function HealthPage({ token, summary }) {
  const [apiStatus, setApiStatus] = useState('checking');
  useEffect(() => {
    axios.get(`${API}/analytics/summary?token=${token}`).then(() => setApiStatus('online')).catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '8px 0' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.02em', marginBottom: 24 }}>System health</div>
      {[
        { label: 'API Server', status: apiStatus, detail: API },
        { label: 'Database', status: apiStatus === 'online' ? 'online' : 'unknown', detail: 'PostgreSQL 15' },
        { label: 'Frontend', status: 'online', detail: 'React 18' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'online' ? '#34c759' : s.status === 'checking' ? '#ff9f0a' : '#ff3b30', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 500, letterSpacing: '-0.01em' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.detail}</div>
          </div>
          <span style={{ fontSize: 12, color: s.status === 'online' ? '#34c759' : 'rgba(255,255,255,0.3)' }}>{s.status}</span>
        </div>
      ))}
      <a href={`${API}/docs`} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 24, padding: '13px', background: 'rgba(255,255,255,0.08)', color: '#f5f5f7', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '-0.01em' }}>
        Open API Docs
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
    } catch (err) {
      if (err?.response?.status === 401) onLogout();
    }
    setLoading(false);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const clearAllFilters = () => { setStatusFilter(null); setPriorityFilter(null); setSearch(''); setClientFilter(null); setIndustryFilter(null); };

  const filteredCases = cases.filter(c => {
    const match = c.description?.match(/\[(.+?) — (.+?)\]/);
    const industry = match ? match[1] : null;
    const client = match ? match[2] : null;
    const searchLower = search.toLowerCase();
    return (
      (!statusFilter || c.status === statusFilter) &&
      (!priorityFilter || c.priority === priorityFilter) &&
      (!search || c.title.toLowerCase().includes(searchLower) || (client && client.toLowerCase().includes(searchLower)) || (industry && industry.toLowerCase().includes(searchLower))) &&
      (!clientFilter || client === clientFilter) &&
      (!industryFilter || industry === industryFilter)
    );
  }).sort((a, b) => {
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
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = cases.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length;
    return { day: label, cases: count };
  });

  const statusChartData = summary ? [
    { name: 'Open', value: summary.open },
    { name: 'Review', value: summary.in_review },
    { name: 'Pending', value: summary.pending_approval },
    { name: 'Escalated', value: summary.escalated },
    { name: 'Resolved', value: summary.resolved },
  ] : [];

  const clientCounts = {};
  const clientIndustry = {};
  cases.forEach(c => {
    if (c.description) {
      const match = c.description.match(/\[(.+?) — (.+?)\]/);
      if (match) { clientCounts[match[2]] = (clientCounts[match[2]] || 0) + 1; clientIndustry[match[2]] = match[1]; }
    }
  });
  const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const industryCounts = {};
  cases.forEach(c => {
    if (c.description) { const match = c.description.match(/\[(.+?) — (.+?)\]/); if (match) industryCounts[match[1]] = (industryCounts[match[1]] || 0) + 1; }
  });
  const industries = Object.keys(industryCounts);

  const resolvedRate = summary ? Math.round((summary.resolved / summary.total) * 100) : 0;
  const totalClaimed = cases.reduce((acc, c) => acc + (c.claimed_amount || 0), 0);

  const navigateTo = (p) => { setPage(p); setShowMobileMenu(false); };

  const recentSorted = [...cases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const activeFilterCount = [statusFilter, priorityFilter, clientFilter, industryFilter, search].filter(Boolean).length;

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (showProfile) return (
    <div style={{ display: 'flex', height: '100vh', background: '#000' }}>
      {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px 40px' }}><Profile token={token} user={user} onBack={() => setShowProfile(false)} /></div>
    </div>
  );

  if (showNewCase) return (
    <div style={{ display: 'flex', height: '100vh', background: '#000' }}>
      {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px 40px' }}><NewCase token={token} onBack={() => setShowNewCase(false)} onCreated={() => { setShowNewCase(false); fetchData(); }} /></div>
    </div>
  );

  if (selectedCase) return (
    <div style={{ display: 'flex', height: '100vh', background: '#000' }}>
      {!isMobile && <Sidebar page={lastPage} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px 40px' }}><CaseDetail token={token} user={user} caseId={selectedCase} onBack={() => { setSelectedCase(null); setPage(lastPage); fetchData(); }} /></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000' }} onClick={() => setShowNotifications(false)}>
      {!isMobile && <Sidebar page={page} setPage={navigateTo} onLogout={onLogout} user={user} caseCount={cases.length} onProfile={() => setShowProfile(true)} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', padding: isMobile ? '12px 16px' : '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            {isMobile && (
              <button onClick={e => { e.stopPropagation(); setShowMobileMenu(p => !p); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.6)' }}>☰</button>
            )}
            {!isMobile && (
              <input value={search} onChange={e => { setSearch(e.target.value); setPage('cases'); setCurrentPage(1); }} placeholder="Search cases..." style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, outline: 'none', width: 260, color: '#f5f5f7', background: 'rgba(255,255,255,0.06)', letterSpacing: '-0.01em', fontFamily: 'inherit' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowNotifications(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', position: 'relative', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {summary && (summary.escalated + summary.pending_approval) > 0 && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.9)', color: '#000', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {summary.escalated + summary.pending_approval}
                  </div>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: 40, right: 0, background: '#1c1c1e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', width: 300, zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>Needs attention</div>
                  {cases.filter(c => c.status === 'escalated' || c.status === 'pending_approval').length === 0 && (
                    <div style={{ padding: '16px 18px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>All clear</div>
                  )}
                  {cases.filter(c => c.status === 'escalated' || c.status === 'pending_approval').map(c => (
                    <div key={c.id} onClick={() => { setLastPage(page); setSelectedCase(c.id); setShowNotifications(false); }}
                      style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: c.status === 'escalated' ? 'rgba(255,120,120,0.8)' : 'rgba(255,200,100,0.8)' }} />
                      <div>
                        <div style={{ fontSize: 13, color: '#f5f5f7', fontWeight: 500, letterSpacing: '-0.01em' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{c.status.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>{user?.role}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px 40px' }}>
          {page === 'health' && <HealthPage token={token} summary={summary} />}

          {page === 'dashboard' && summary && (
            <>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.02em', marginBottom: 24 }}>Overview</div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                <StatCard label="Total cases" value={summary.total} sub={`${resolvedRate}% resolved`} onClick={() => { setPage('cases'); setStatusFilter(null); }} />
                <StatCard label="Open" value={summary.open} sub="awaiting action" onClick={() => { setPage('cases'); setStatusFilter('open'); }} />
                <StatCard label="Escalated" value={summary.escalated} sub="needs attention" subColor="rgba(255,120,120,0.7)" onClick={() => { setPage('cases'); setStatusFilter('escalated'); }} />
                <StatCard label="Total claimed" value={totalClaimed > 0 ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalClaimed) : '—'} sub="across all cases" />
              </div>

              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <div style={{ background: '#1c1c1e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em', marginBottom: 4 }}>Case volume</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Last 7 days</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, background: '#2c2c2e', color: '#f5f5f7', fontFamily: 'inherit' }} />
                        <Line type="monotone" dataKey="cases" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} dot={{ fill: 'rgba(255,255,255,0.7)', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: '#1c1c1e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em', marginBottom: 4 }}>By status</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Current distribution</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={statusChartData} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, background: '#2c2c2e', color: '#f5f5f7', fontFamily: 'inherit' }} />
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {statusChartData.map((_, i) => <Cell key={i} fill={`rgba(255,255,255,${0.15 + i * 0.1})`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 12 }}>
                <div style={{ background: '#1c1c1e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>Top clients</div>
                  <div style={{ padding: '8px 0' }}>
                    {topClients.map(([client, count], i) => (
                      <div key={client} onClick={() => { setClientFilter(client); setPage('cases'); setCurrentPage(1); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                          {getInitials(client)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#f5f5f7', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{client}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{count} case{count !== 1 ? 's' : ''}</div>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <CasesTable cases={recentSorted} title="Recent cases" onSelectCase={id => { setLastPage('dashboard'); setSelectedCase(id); }} onNewCase={() => setShowNewCase(true)} priorityFilter={priorityFilter} onPriorityFilter={p => { setPriorityFilter(p); setPage('cases'); }} onSort={handleSort} sortBy={sortBy} sortDir={sortDir} showPagination={false} isMobile={isMobile} showViewAll={() => setPage('cases')} />
              </div>
            </>
          )}

          {page === 'cases' && (
            <>
              {!isMobile && industries.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {industries.map(ind => (
                    <button key={ind} onClick={() => { setIndustryFilter(industryFilter === ind ? null : ind); setCurrentPage(1); }} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: industryFilter === ind ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', color: industryFilter === ind ? '#f5f5f7' : 'rgba(255,255,255,0.4)', border: `1px solid ${industryFilter === ind ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>{ind}</button>
                  ))}
                  {activeFilterCount > 0 && <button onClick={clearAllFilters} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'rgba(255,80,80,0.1)', color: 'rgba(255,120,120,0.8)', border: '1px solid rgba(255,80,80,0.2)', fontFamily: 'inherit' }}>Clear all ({activeFilterCount})</button>}
                </div>
              )}
              <CasesTable cases={pagedCases} title={clientFilter ? `${clientFilter}` : industryFilter ? `${industryFilter}` : search ? `"${search}"` : statusFilter ? statusFilter.replace(/_/g, ' ') : 'All cases'} onSelectCase={id => { setLastPage('cases'); setSelectedCase(id); }} statusFilter={statusFilter} priorityFilter={priorityFilter} onClearFilter={clearAllFilters} onNewCase={() => setShowNewCase(true)} onPriorityFilter={p => { setPriorityFilter(p); setCurrentPage(1); }} onSort={handleSort} sortBy={sortBy} sortDir={sortDir} showPagination={true} currentPage={currentPage} totalPages={totalPages} totalCount={filteredCases.length} onPageChange={setCurrentPage} isMobile={isMobile} activeFilterCount={activeFilterCount} onClearAll={clearAllFilters} onExport={() => exportToCSV(filteredCases)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout, user, caseCount, onProfile }) {
  return (
    <div style={{ width: 220, background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.02em' }}>Claims Platform</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3, letterSpacing: '-0.01em' }}>Logistics operations</div>
      </div>

      <nav style={{ marginTop: 8, flex: 1, padding: '0 8px' }}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'cases', label: 'All cases', count: caseCount },
          { id: 'health', label: 'System health' },
          { id: 'api', label: 'API Docs', external: `${API}/docs` },
        ].map(item => (
          <div key={item.id} onClick={() => item.external ? window.open(item.external, '_blank') : setPage(item.id)}
            style={{ padding: '10px 12px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: page === item.id ? '#f5f5f7' : 'rgba(255,255,255,0.4)', background: page === item.id ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: 8, marginBottom: 2, fontWeight: page === item.id ? 500 : 400, letterSpacing: '-0.01em', transition: 'all 0.15s' }}
            onMouseEnter={e => page !== item.id && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => page !== item.id && (e.currentTarget.style.background = 'transparent')}
          >
            <span>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.count !== undefined && <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>{item.count}</span>}
              {item.external && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>↗</span>}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div onClick={onProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', borderRadius: 10, padding: '8px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {user?.role?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#f5f5f7', fontWeight: 500, letterSpacing: '-0.01em' }}>{user?.email?.split('@')[0] || user?.role}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>View profile</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >Sign out</button>
      </div>
    </div>
  );
}

function CasesTable({ cases, title, onSelectCase, statusFilter, priorityFilter, onClearFilter, onNewCase, onPriorityFilter, onSort, sortBy, sortDir, showPagination, currentPage, totalPages, totalCount, onPageChange, isMobile, showViewAll, activeFilterCount, onClearAll, onExport }) {
  return (
    <div style={{ background: '#1c1c1e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>{title}</span>
          {showPagination && totalCount > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{totalCount}</span>}
          {showViewAll && <button onClick={showViewAll} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em' }}>View all</button>}
          {activeFilterCount > 0 && onClearAll && <button onClick={onClearAll} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Clear</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isMobile && ['high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => onPriorityFilter && onPriorityFilter(priorityFilter === p ? null : p)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', background: priorityFilter === p ? 'rgba(255,255,255,0.1)' : 'transparent', color: priorityFilter === p ? '#f5f5f7' : 'rgba(255,255,255,0.35)', border: `1px solid ${priorityFilter === p ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>{p}</button>
          ))}
          {onExport && <button onClick={onExport} style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Export</button>}
          <button onClick={onNewCase} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f5f5f7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >New case</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: isMobile ? 500 : 'auto' }}>
          <thead>
            <tr>
              {['Title', 'Priority', 'Status', ...(!isMobile ? ['Client', 'Industry'] : []), 'SLA'].map((h, i) => (
                <th key={h} onClick={() => ['Title','Priority','Status','SLA'].includes(h) && onSort(['created','priority','status','sla'][['Title','Priority','Status','SLA'].indexOf(h)])}
                  style={{ padding: '10px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: 400, fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 && (
              <tr><td colSpan={isMobile ? 4 : 6} style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 16, letterSpacing: '-0.01em' }}>No cases found</div>
                <button onClick={onNewCase} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>New case</button>
              </td></tr>
            )}
            {cases.map(c => {
              const clientMatch = c.description?.match(/\[(.+?) — (.+?)\]/);
              const industry = clientMatch ? clientMatch[1] : null;
              const clientName = clientMatch ? clientMatch[2] : null;
              return (
                <tr key={c.id} onClick={() => onSelectCase(c.id)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 20px', maxWidth: 260 }}>
                    <div style={{ fontSize: 13, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{getDaysOld(c.created_at)}</div>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ fontSize: 12, color: c.priority === 'high' ? 'rgba(255,120,120,0.8)' : c.priority === 'medium' ? 'rgba(255,200,100,0.7)' : 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>{c.priority}</span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: statusColors[c.status]?.bg, color: statusColors[c.status]?.color, letterSpacing: '-0.01em' }}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  {!isMobile && <td style={{ padding: '13px 20px' }}><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>{clientName || '—'}</span></td>}
                  {!isMobile && <td style={{ padding: '13px 20px' }}><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>{industry || '—'}</span></td>}
                  <td style={{ padding: '13px 20px' }}>
                    {c.sla_deadline ? <span style={{ color: getSLAColor(c.sla_deadline, c.status), fontSize: 12 }}>{getSLALabel(c.sla_deadline, c.status)}</span> : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.01em' }}>{currentPage} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: currentPage === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>Previous</button>
            <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: currentPage === totalPages ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: currentPage === totalPages ? 'default' : 'pointer', fontSize: 12, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
