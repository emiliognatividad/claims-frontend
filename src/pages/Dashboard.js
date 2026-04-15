import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CaseDetail from './CaseDetail';
import NewCase from './NewCase';

const API = 'http://localhost:8000';

const statusColors = {
  open: { bg: '#eff6ff', color: '#1d4ed8' },
  in_review: { bg: '#fefce8', color: '#a16207' },
  pending_approval: { bg: '#fff7ed', color: '#c2410c' },
  escalated: { bg: '#fef2f2', color: '#dc2626' },
  approved: { bg: '#f0fdf4', color: '#16a34a' },
  resolved: { bg: '#f0fdf4', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' },
};

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

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

export default function Dashboard({ token, user, onLogout }) {
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState('dashboard');
  const pageSize = 10;

  useEffect(() => {
    fetchData();
    document.title = summary && (summary.escalated + summary.pending_approval) > 0
      ? `(${summary.escalated + summary.pending_approval}) Claims Platform`
      : 'Claims Platform';
  }, [summary?.escalated, summary?.pending_approval]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowNotifications(false);
      if (e.key === 'n' && !e.target.matches('input, textarea')) {
        setShowNewCase(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const fetchData = async () => {
    const [casesRes, summaryRes] = await Promise.all([
      axios.get(`${API}/cases/?token=${token}`),
      axios.get(`${API}/analytics/summary?token=${token}`)
    ]);
    setCases(casesRes.data);
    setSummary(summaryRes.data);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filteredCases = cases
    .filter(c =>
      (!statusFilter || c.status === statusFilter) &&
      (!priorityFilter || c.priority === priorityFilter) &&
      (!search || c.title.toLowerCase().includes(search.toLowerCase()))
    )
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

  const resolvedRate = summary ? Math.round((summary.resolved / summary.total) * 100) : 0;
  const avgResolution = '1.8d';

  if (showNewCase) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }}>
        <Sidebar page={page} setPage={(p) => { setPage(p); setShowNewCase(false); }} onLogout={onLogout} user={user} caseCount={cases.length} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <NewCase token={token} onBack={() => setShowNewCase(false)} onCreated={() => { setShowNewCase(false); fetchData(); }} />
        </div>
      </div>
    );
  }

  if (selectedCase) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }}>
        <Sidebar page={lastPage} setPage={(p) => { setPage(p); setSelectedCase(null); }} onLogout={onLogout} user={user} caseCount={cases.length} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <CaseDetail token={token} user={user} caseId={selectedCase} onBack={() => { setSelectedCase(null); setPage(lastPage); fetchData(); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f7ff' }} onClick={() => setShowNotifications(false)}>
      <Sidebar page={page} setPage={setPage} onLogout={onLogout} user={user} caseCount={cases.length} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', padding: '14px 24px', borderBottom: '1px solid #e0e4f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{page}</h1>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage('cases'); setCurrentPage(1); }}
              placeholder="Search cases... (or press N for new)"
              style={{ padding: '7px 14px', border: '1px solid #e0e4f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 280, color: '#334155' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    <div style={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>All clear 🎉</div>
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
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {user?.role || 'user'} · Logistics Claims
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {page === 'dashboard' && summary && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Total cases', value: summary.total, sub: `${resolvedRate}% resolved`, subColor: '#2563eb', filter: null },
                  { label: 'Open', value: summary.open, color: '#2563eb', sub: 'awaiting assignment', subColor: '#94a3b8', filter: 'open' },
                  { label: 'Escalated', value: summary.escalated, color: '#ef4444', sub: 'SLA breached', subColor: '#ef4444', filter: 'escalated' },
                  { label: 'Avg resolution', value: avgResolution, color: '#16a34a', sub: 'across all cases', subColor: '#16a34a', filter: 'resolved' },
                ].map((card, i) => (
                  <div key={i} onClick={() => { setPage('cases'); setStatusFilter(card.filter); }}
                    style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: `1px solid ${card.color === '#ef4444' && summary.escalated > 0 ? '#fecaca' : '#e0e4f0'}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = card.color === '#ef4444' && summary.escalated > 0 ? '#fecaca' : '#e0e4f0'}
                  >
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{card.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: card.color || '#1e293b' }}>{card.value}</div>
                    <div style={{ fontSize: 10, color: card.subColor, marginTop: 3 }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Cases by status</div>
                  <div style={{ padding: '14px 18px' }}>
                    {[
                      { label: 'Open', value: summary.open, total: summary.total, color: '#2563eb' },
                      { label: 'In review', value: summary.in_review, total: summary.total, color: '#60a5fa' },
                      { label: 'Pending', value: summary.pending_approval, total: summary.total, color: '#f59e0b' },
                      { label: 'Escalated', value: summary.escalated, total: summary.total, color: '#ef4444' },
                      { label: 'Resolved', value: summary.resolved, total: summary.total, color: '#16a34a' },
                    ].map((bar, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                          <span>{bar.label}</span><span>{bar.value}</span>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: 4, height: 8, marginBottom: 10 }}>
                          <div style={{ width: `${Math.round((bar.value / bar.total) * 100)}%`, height: 8, borderRadius: 4, background: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Distribution</div>
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <svg width="110" height="110" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="22"/>
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#2563eb" strokeWidth="22" strokeDasharray={`${(summary.open/summary.total)*339} 339`} strokeDashoffset="0" transform="rotate(-90 70 70)"/>
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#60a5fa" strokeWidth="22" strokeDasharray={`${(summary.in_review/summary.total)*339} 339`} strokeDashoffset={`-${(summary.open/summary.total)*339}`} transform="rotate(-90 70 70)"/>
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#ef4444" strokeWidth="22" strokeDasharray={`${(summary.escalated/summary.total)*339} 339`} strokeDashoffset={`-${((summary.open+summary.in_review)/summary.total)*339}`} transform="rotate(-90 70 70)"/>
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#16a34a" strokeWidth="22" strokeDasharray={`${(summary.resolved/summary.total)*339} 339`} strokeDashoffset={`-${((summary.open+summary.in_review+summary.escalated)/summary.total)*339}`} transform="rotate(-90 70 70)"/>
                      <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e293b">{summary.total}</text>
                      <text x="70" y="82" textAnchor="middle" fontSize="11" fill="#94a3b8">total</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Open', value: summary.open, color: '#2563eb' },
                        { label: 'In review', value: summary.in_review, color: '#60a5fa' },
                        { label: 'Escalated', value: summary.escalated, color: '#ef4444' },
                        { label: 'Resolved', value: summary.resolved, color: '#16a34a' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <span style={{ color: '#64748b' }}>{item.label}</span>
                          <span style={{ fontWeight: 600, color: '#1e293b', marginLeft: 'auto' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <CasesTable
                cases={cases.slice(0, 5)}
                title="Recent cases"
                onSelectCase={(id) => { setLastPage('dashboard'); setSelectedCase(id); }}
                onNewCase={() => setShowNewCase(true)}
                priorityFilter={priorityFilter}
                onPriorityFilter={(p) => { setPriorityFilter(p); setPage('cases'); }}
                onSort={handleSort}
                sortBy={sortBy}
                sortDir={sortDir}
                showPagination={false}
              />
            </>
          )}

          {page === 'cases' && (
            <>
              <CasesTable
                cases={pagedCases}
                title={search ? `Results for "${search}"` : statusFilter ? `${statusFilter.replace(/_/g, ' ')} cases` : priorityFilter ? `${priorityFilter} priority cases` : 'All cases'}
                onSelectCase={(id) => { setLastPage('cases'); setSelectedCase(id); }}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                onClearFilter={() => { setStatusFilter(null); setPriorityFilter(null); setSearch(''); }}
                onNewCase={() => setShowNewCase(true)}
                onPriorityFilter={(p) => setPriorityFilter(p)}
                onSort={handleSort}
                sortBy={sortBy}
                sortDir={sortDir}
                showPagination={true}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredCases.length}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout, user, caseCount }) {
  return (
    <div style={{ width: 220, background: 'white', borderRight: '1px solid #e0e4f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
        <span style={{ color: '#2563eb' }}>Claims</span> Platform
      </div>
      <nav style={{ marginTop: 8, flex: 1 }}>
        {[
          { id: 'dashboard', label: 'Dashboard', count: null },
          { id: 'cases', label: 'All cases', count: caseCount },
        ].map(item => (
          <div key={item.id} onClick={() => setPage(item.id)} style={{
            padding: '10px 16px', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            color: page === item.id ? '#2563eb' : '#64748b',
            background: page === item.id ? '#eff6ff' : 'transparent',
            borderRadius: 8, margin: '2px 8px', fontWeight: page === item.id ? 500 : 400
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: page === item.id ? '#2563eb' : '#cbd5e1' }} />
            {item.label}
            {item.count !== null && (
              <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>
                {item.count}
              </span>
            )}
          </div>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
          Signed in as <span style={{ color: '#64748b', fontWeight: 500 }}>{user?.role || 'user'}</span>
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

function CasesTable({ cases, title, onSelectCase, statusFilter, priorityFilter, onClearFilter, onNewCase, onPriorityFilter, onSort, sortBy, sortDir, showPagination, currentPage, totalPages, totalCount, onPageChange }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{title}</span>
          {showPagination && totalCount > 0 && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>({totalCount} cases)</span>
          )}
          {(statusFilter || priorityFilter) && (
            <button onClick={onClearFilter} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear filter</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => onPriorityFilter && onPriorityFilter(priorityFilter === p ? null : p)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              background: priorityFilter === p ? (p === 'high' ? '#fef2f2' : p === 'medium' ? '#fff7ed' : '#f0fdf4') : '#f8fafc',
              color: priorityFilter === p ? (p === 'high' ? '#dc2626' : p === 'medium' ? '#c2410c' : '#16a34a') : '#64748b',
              border: `1px solid ${priorityFilter === p ? (p === 'high' ? '#fecaca' : p === 'medium' ? '#fed7aa' : '#bbf7d0') : '#e0e4f0'}`
            }}>{p}</button>
          ))}
          <button onClick={onNewCase} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500, marginLeft: 4 }}>+ New case</button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th onClick={() => onSort('created')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
              Title <SortIcon col="created" sortBy={sortBy} sortDir={sortDir} />
            </th>
            <th onClick={() => onSort('priority')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
              Priority <SortIcon col="priority" sortBy={sortBy} sortDir={sortDir} />
            </th>
            <th onClick={() => onSort('status')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
              Status <SortIcon col="status" sortBy={sortBy} sortDir={sortDir} />
            </th>
            <th style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0' }}>Assigned</th>
            <th onClick={() => onSort('sla')} style={{ padding: '9px 18px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
              SLA Deadline <SortIcon col="sla" sortBy={sortBy} sortDir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {cases.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No cases found
              </td>
            </tr>
          )}
          {cases.map(c => (
            <tr key={c.id}
              onClick={() => onSelectCase(c.id)}
              style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: c.status === 'escalated' ? '#fff8f8' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = c.status === 'escalated' ? '#fff0f0' : '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = c.status === 'escalated' ? '#fff8f8' : 'transparent'}
            >
              <td style={{ padding: '11px 18px', color: '#334155', maxWidth: 280 }}>
                <div>{c.title}</div>
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
              <td style={{ padding: '11px 18px' }}>
                {c.assigned_to ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {getInitials(c.assigned_to)}
                  </div>
                ) : (
                  <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>
                )}
              </td>
              <td style={{ padding: '11px 18px' }}>
                {c.sla_deadline ? (
                  <span style={{ color: getSLAColor(c.sla_deadline, c.status) }}>
                    {getSLALabel(c.sla_deadline, c.status)}
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
