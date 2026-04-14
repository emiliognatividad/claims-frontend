import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

const statusColors = {
  open: { bg: '#eff6ff', color: '#3b82f6' },
  in_review: { bg: '#fef9c3', color: '#ca8a04' },
  pending_approval: { bg: '#fef9c3', color: '#ca8a04' },
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

export default function Dashboard({ token, onLogout }) {
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [casesRes, summaryRes] = await Promise.all([
      axios.get(`${API}/cases/?token=${token}`),
      axios.get(`${API}/analytics/summary?token=${token}`)
    ]);
    setCases(casesRes.data);
    setSummary(summaryRes.data);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        background: 'var(--dark)',
        color: '#ccc',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2a2a4a' }}>
          <span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 16 }}>Claims</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}> Platform</span>
        </div>
        <nav style={{ marginTop: 16 }}>
          {['dashboard', 'cases'].map(item => (
            <div
              key={item}
              onClick={() => setPage(item)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                cursor: 'pointer',
                borderLeft: page === item ? '3px solid var(--purple)' : '3px solid transparent',
                background: page === item ? '#2a2a4a' : 'transparent',
                color: page === item ? 'white' : '#ccc',
                textTransform: 'capitalize'
              }}
            >
              {item}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '0 20px' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '1px solid #2a2a4a',
              color: '#ccc',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Topbar */}
        <div style={{
          background: 'white',
          padding: '16px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>{page}</h1>
          <div style={{
            background: 'var(--light-purple)',
            color: 'var(--purple)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500
          }}>
            Logistics Claims
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {page === 'dashboard' && summary && (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total cases', value: summary.total, sub: '' },
                  { label: 'Open', value: summary.open, sub: '', color: '#3b82f6' },
                  { label: 'Escalated', value: summary.escalated, sub: 'needs attention', color: '#ef4444' },
                  { label: 'Resolved', value: summary.resolved, sub: '', color: '#22c55e' },
                ].map((card, i) => (
                  <div key={i} style={{
                    background: 'white',
                    borderRadius: 10,
                    padding: '18px 20px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>{card.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 600, color: card.color || 'var(--dark)' }}>{card.value}</div>
                    {card.sub && <div style={{ fontSize: 11, color: card.color, marginTop: 4 }}>{card.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Recent cases table */}
              <CasesTable cases={cases.slice(0, 5)} title="Recent cases" />
            </>
          )}

          {page === 'cases' && (
            <CasesTable cases={cases} title="All cases" />
          )}
        </div>
      </div>
    </div>
  );
}

function CasesTable({ cases, title }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            {['Title', 'Priority', 'Status', 'SLA Deadline'].map(h => (
              <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--gray)', fontWeight: 500, fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '12px 20px', color: 'var(--dark)', maxWidth: 300 }}>{c.title}</td>
              <td style={{ padding: '12px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[c.priority] }} />
                  {c.priority}
                </div>
              </td>
              <td style={{ padding: '12px 20px' }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  background: statusColors[c.status]?.bg,
                  color: statusColors[c.status]?.color
                }}>
                  {c.status.replace('_', ' ')}
                </span>
              </td>
              <td style={{ padding: '12px 20px', color: 'var(--gray)' }}>
                {c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
