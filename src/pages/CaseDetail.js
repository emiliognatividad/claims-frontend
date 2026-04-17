import { useState, useEffect } from 'react';
import axios from 'axios';

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

const TRANSITIONS = {
  open: ['in_review', 'escalated'],
  in_review: ['pending_approval', 'escalated'],
  escalated: ['in_review'],
  pending_approval: ['approved', 'rejected'],
  approved: ['resolved'],
  rejected: ['open'],
};

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

function formatMXN(amount) {
  if (!amount) return null;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function CreditNoteModal({ caseData, onClose }) {
  const clientMatch = caseData.description?.match(/\[(.+?) — (.+?)\]/);
  const industry = clientMatch ? clientMatch[1] : '—';
  const client = clientMatch ? clientMatch[2] : '—';
  const noteNumber = `CN-${String(caseData.id).slice(0, 8).toUpperCase()}`;
  const today = new Date().toLocaleDateString('es-MX');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '32px',
        width: '100%', maxWidth: 520, position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#94a3b8'
        }}>✕</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              <span style={{ color: '#2563eb' }}>Claims</span> Platform
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Logistics operations</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>CREDIT NOTE</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{noteNumber}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{today}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '16px 0', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CLIENT</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{client}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{industry}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CASE REFERENCE</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{caseData.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Priority: {caseData.priority}</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Claim description</span>
            <span style={{ color: '#334155', maxWidth: 240, textAlign: 'right' }}>{caseData.title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Case ID</span>
            <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>{caseData.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Status</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Approved</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 15, fontWeight: 700 }}>
            <span style={{ color: '#1e293b' }}>Total claimed amount</span>
            <span style={{ color: '#2563eb' }}>{caseData.claimed_amount ? formatMXN(caseData.claimed_amount) : 'Not specified'}</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>
          This credit note was generated automatically by Claims Platform upon case approval. Case approved on {today}.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{
            flex: 1, padding: '11px', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>Print / Save PDF</button>
          <button onClick={onClose} style={{
            padding: '11px 20px', background: '#f8fafc',
            border: '1px solid #e0e4f0', borderRadius: 8, fontSize: 13, color: '#64748b', cursor: 'pointer'
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function CaseDetail({ token, user, caseId, onBack }) {
  const [caseData, setCaseData] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');
  const [showCreditNote, setShowCreditNote] = useState(false);

  useEffect(() => { fetchCase(); }, [caseId]);

  const fetchCase = async () => {
    setLoading(true);
    const [caseRes, commentsRes, historyRes, usersRes] = await Promise.all([
      axios.get(`${API}/cases/${caseId}?token=${token}`),
      axios.get(`${API}/cases/${caseId}/comments?token=${token}`),
      axios.get(`${API}/cases/${caseId}/history?token=${token}`).catch(() => ({ data: [] })),
      axios.get(`${API}/cases/users/list?token=${token}`).catch(() => ({ data: [] }))
    ]);
    setCaseData(caseRes.data);
    setComments(commentsRes.data);
    setHistory(historyRes.data);
    setUsers(usersRes.data);
    setLoading(false);
  };

  const transition = async (toStatus) => {
    await axios.post(`${API}/cases/${caseId}/transition?token=${token}&to_status=${toStatus}&note=${note}`);
    setNote('');
    fetchCase();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await axios.post(`${API}/cases/${caseId}/comments?token=${token}`, { body: newComment });
    setNewComment('');
    fetchCase();
  };

  const assignCase = async (userId) => {
    await axios.patch(`${API}/cases/${caseId}/assign?token=${token}&assigned_to=${userId}`);
    fetchCase();
  };

  if (loading) return (
    <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading case...</div>
  );

  const nextStates = TRANSITIONS[caseData.status] || [];
  const clientMatch = caseData.description?.match(/\[(.+?) — (.+?)\]/);
  const client = clientMatch ? clientMatch[2] : null;
  const industry = clientMatch ? clientMatch[1] : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {showCreditNote && <CreditNoteModal caseData={caseData} onClose={() => setShowCreditNote(false)} />}

      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--accent)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0
      }}>← Back to cases</button>

      {/* Case header */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', flex: 1, marginRight: 16 }}>{caseData.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {(caseData.status === 'approved' || caseData.status === 'resolved') && (
              <button onClick={() => setShowCreditNote(true)} style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'
              }}>
                Credit note
              </button>
            )}
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: statusColors[caseData.status]?.bg,
              color: statusColors[caseData.status]?.color,
            }}>{caseData.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{caseData.description}</p>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, flexWrap: 'wrap' }}>
          <div><span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Priority: </span>
            <span style={{ color: priorityColors[caseData.priority], fontWeight: 600 }}>{caseData.priority}</span>
          </div>
          {client && <div><span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Client: </span><span style={{ color: 'var(--text-primary)' }}>{client}</span></div>}
          {industry && <div><span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Industry: </span><span style={{ color: 'var(--text-primary)' }}>{industry}</span></div>}
          <div><span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Created: </span>
            <span style={{ color: 'var(--text-primary)' }}>{new Date(caseData.created_at).toLocaleDateString()}</span>
          </div>
          <div><span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>SLA deadline: </span>
            <span style={{ color: 'var(--text-primary)' }}>{caseData.sla_deadline ? new Date(caseData.sla_deadline).toLocaleDateString() : '—'}</span>
          </div>
          {caseData.claimed_amount && (
            <div>
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Claimed amount: </span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatMXN(caseData.claimed_amount)}</span>
            </div>
          )}
        </div>
        {user?.role === 'admin' && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Assigned to:</span>
            <select
              value={caseData.assigned_to || ''}
              onChange={e => assignCase(e.target.value)}
              style={{
                padding: '5px 10px', border: '1px solid var(--card-border)',
                borderRadius: 8, fontSize: 12, color: 'var(--text-primary)',
                background: 'var(--input-bg)', outline: 'none'
              }}
            >
              <option value=''>Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status transition */}
      {nextStates.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Move case</div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            style={{
              width: '100%', padding: '9px 14px', border: '1px solid var(--card-border)',
              borderRadius: 8, fontSize: 13, marginBottom: 12, outline: 'none',
              background: 'var(--input-bg)', color: 'var(--text-primary)'
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nextStates.map(status => (
              <button key={status} onClick={() => transition(status)} style={{
                padding: '8px 16px',
                background: status === 'rejected' || status === 'escalated' ? '#fef2f2' : '#eff6ff',
                color: status === 'rejected' || status === 'escalated' ? '#dc2626' : '#1d4ed8',
                border: `1px solid ${status === 'rejected' || status === 'escalated' ? '#fecaca' : '#bfdbfe'}`,
                borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer'
              }}>
                → {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
          {['comments', 'audit trail'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              textTransform: 'capitalize'
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {activeTab === 'comments' && (
            <>
              {comments.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>No comments yet.</div>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.author_name}</span>
                    {' · '}
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Write a comment..."
                  style={{
                    flex: 1, padding: '9px 14px', border: '1px solid var(--card-border)',
                    borderRadius: 8, fontSize: 13, outline: 'none',
                    background: 'var(--input-bg)', color: 'var(--text-primary)'
                  }}
                />
                <button onClick={addComment} style={{
                  background: 'var(--accent)', color: 'white', border: 'none',
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}>Send</button>
              </div>
            </>
          )}

          {activeTab === 'audit trail' && (
            <>
              {history.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No history yet.</div>
              )}
              {history.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: 16, paddingBottom: 16, position: 'relative' }}>
                  {i < history.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 11, top: 24,
                      width: 2, height: '100%', background: 'var(--card-border)'
                    }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--hover-bg)',
                    border: '2px solid var(--accent)', flexShrink: 0, marginTop: 2
                  }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                      Status changed from{' '}
                      <span style={{ fontWeight: 600 }}>{h.from_status.replace(/_/g, ' ')}</span>
                      {' '}to{' '}
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{h.to_status.replace(/_/g, ' ')}</span>
                    </div>
                    {h.note && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>"{h.note}"</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(h.changed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
