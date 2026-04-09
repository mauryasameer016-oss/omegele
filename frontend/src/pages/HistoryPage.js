import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/user/history')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (connected, disconnected) => {
    if (!disconnected) return 'Ongoing';
    const secs = Math.floor((new Date(disconnected) - new Date(connected)) / 1000);
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Connection History</h1>
          <p className="text-muted text-sm mt-1">Your recent chat sessions</p>
        </div>
        <div className="badge badge-gray">{history.length} sessions</div>
      </div>

      {loading && <div className="text-muted text-sm">Loading…</div>}

      {!loading && history.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No history yet</div>
            <div className="empty-state-desc">Start a chat to see your connections here</div>
          </div>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Stranger</th>
                <th>Type</th>
                <th>Date</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {h.partner_username || h.partner_username_resolved || 'Anonymous'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${h.session_type === 'video' ? 'badge-blue' : 'badge-gray'}`}>
                      {h.session_type === 'video' ? '📹 Video' : '💬 Text'}
                    </span>
                  </td>
                  <td className="text-muted">
                    {new Date(h.connected_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="text-muted">
                    {formatDuration(h.connected_at, h.disconnected_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
