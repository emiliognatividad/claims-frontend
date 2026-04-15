import { useState, useEffect } from 'react';
import axios from 'axios';

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

export default function CaseDetail({ token, caseId, onBack }) {
  const [caseData, setCaseData] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => { fetchCase(); }, [caseId]);

  const fetchCase = async () => {
    setLoading(true);
    const [caseRes, commentsRes, historyRes] = await Promise.all([
      axios.get(`${API}/cases/${caseId}?token=${token}`),
      axios.get(`${API}/cases/${caseId}/comments?token=${token}`),
      axios.get(`${API}/cases/${caseId}/history?token=${token}`).catch(() => ({ data: [] }))
    ]);
    setCaseData(caseRes.data);
    setComments(commentsRes.data);
    setHistory(historyRes.data);
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

  if (loading) return (
    <div style={{ padding: 40, color: '#94a3b8', fontSize: 14 }}>Loading case...</div>
  );

  const nextStates = TRANSITIONS[caseData.status] || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#2563eb',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0
      }}>← Back to cases</button>

      {/* Case header */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', flex: 1, marginRight: 16 }}>{caseData.title}</h2>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: statusColors[caseData.status]?.bg,
            color: statusColors[caseData.status]?.color,
            flexShrink: 0
          }}>{caseData.status.replace(/_/g, ' ')}</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>{caseData.description}</p>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#94a3b8' }}>
          <div><span style={{ fontWeight: 500, color: '#64748b' }}>Priority: </span>
            <span style={{ color: priorityColors[caseData.priority], fontWeight: 600 }}>{caseData.priority}</span>
          </div>
          <div><span style={{ fontWeight: 500, color: '#64748b' }}>Created: </span>
            {new Date(caseData.created_at).toLocaleDateString()}
          </div>
          <div><span style={{ fontWeight: 500, color: '#64748b' }}>SLA deadline: </span>
            {caseData.sla_deadline ? new Date(caseData.sla_deadline).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      {/* Status transition */}
      {nextStates.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>Move case</div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            style={{
              width: '100%', padding: '9px 14px', border: '1px solid #e0e4f0',
              borderRadius: 8, fontSize: 13, marginBottom: 12, outline: 'none'
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
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e4f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          {['comments', 'audit trail'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#2563eb' : '#64748b',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              textTransform: 'capitalize'
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {activeTab === 'comments' && (
            <>
              {comments.length === 0 && (
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>No comments yet.</div>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Write a comment..."
                  style={{
                    flex: 1, padding: '9px 14px', border: '1px solid #e0e4f0',
                    borderRadius: 8, fontSize: 13, outline: 'none'
                  }}
                />
                <button onClick={addComment} style={{
                  background: '#2563eb', color: 'white', border: 'none',
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}>Send</button>
              </div>
            </>
          )}

          {activeTab === 'audit trail' && (
            <>
              {history.length === 0 && (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>No history yet.</div>
              )}
              {history.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: 16, paddingBottom: 16, position: 'relative' }}>
                  {i < history.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 11, top: 24,
                      width: 2, height: '100%', background: '#f0f0f0'
                    }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#eff6ff',
                    border: '2px solid #2563eb', flexShrink: 0, marginTop: 2
                  }} />
                  <div>
                    <div style={{ fontSize: 13, color: '#334155', marginBottom: 2 }}>
                      Status changed from{' '}
                      <span style={{ fontWeight: 600 }}>{h.from_status.replace(/_/g, ' ')}</span>
                      {' '}to{' '}
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{h.to_status.replace(/_/g, ' ')}</span>
                    </div>
                    {h.note && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>"{h.note}"</div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
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
