import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TABS = ['overview', 'users', 'sessions', 'reports', 'logs'];
const TAB_LABELS = { overview: 'Overview', users: 'Users', sessions: 'Sessions', reports: 'Reports', logs: 'Logs' };
const TAB_ICONS = { overview: '📊', users: '👥', sessions: '💬', reports: '🚩', logs: '📋' };

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, u, se, r, l] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/sessions'),
        axios.get('/api/admin/reports'),
        axios.get('/api/admin/logs'),
      ]);
      setStats(s.data);
      setUsers(u.data.users || []);
      setSessions(se.data);
      setReports(r.data);
      setLogs(l.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (id) => {
    await axios.post(`/api/admin/users/${id}/ban`);
    fetchAll();
  };

  const unbanUser = async (id) => {
    await axios.post(`/api/admin/users/${id}/unban`);
    fetchAll();
  };

  const resolveReport = async (id) => {
    await axios.post(`/api/admin/reports/${id}/resolve`);
    fetchAll();
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '4px 12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>stranger<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>.chat</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Admin Panel</div>
        </div>
        {TABS.map(t => (
          <button key={t} className={`sidebar-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <span>{TAB_ICONS[t]}</span> {TAB_LABELS[t]}
            {t === 'reports' && stats?.pending_reports > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>
                {stats.pending_reports}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <div className="divider" />
          <div style={{ padding: '0 12px', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Logged in as <strong>{user?.username}</strong>
          </div>
          <button className="sidebar-item" onClick={handleLogout}>🚪 Log out</button>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {loading && <div className="text-muted text-sm">Loading…</div>}

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <>
            <div className="mb-4">
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Overview</h2>
              <p className="text-muted text-sm mt-1">Platform statistics at a glance</p>
            </div>
            <div className="stats-grid mb-4">
              {[
                { label: 'Total Users', value: stats.total_users, color: 'var(--text-primary)' },
                { label: 'Active Today', value: stats.active_today, color: 'var(--green)' },
                { label: 'Total Sessions', value: stats.total_sessions, color: 'var(--blue)' },
                { label: 'Pending Reports', value: stats.pending_reports, color: stats.pending_reports > 0 ? 'var(--red)' : 'var(--text-primary)' },
                { label: 'Banned Users', value: stats.banned_users, color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} className="card stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <>
            <div className="flex-between mb-4">
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Users</h2>
                <p className="text-muted text-sm mt-1">{users.length} registered users</p>
              </div>
            </div>
            <div className="card overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><span style={{ fontWeight: 500 }}>{u.username}</span></td>
                      <td className="text-muted">{u.email || '—'}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.is_banned ? 'badge-red' : 'badge-green'}`}>
                          {u.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {u.role !== 'admin' && (
                          u.is_banned
                            ? <button className="btn btn-sm btn-green" onClick={() => unbanUser(u.id)}>Unban</button>
                            : <button className="btn btn-sm btn-danger" onClick={() => banUser(u.id)}>Ban</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* SESSIONS */}
        {tab === 'sessions' && (
          <>
            <div className="mb-4">
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Sessions</h2>
              <p className="text-muted text-sm mt-1">Recent chat sessions</p>
            </div>
            <div className="card overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>User 1</th><th>User 2</th><th>Type</th><th>Started</th><th>Duration</th></tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const dur = s.duration_seconds
                      ? `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s`
                      : (s.ended_at ? '—' : 'Ongoing');
                    return (
                      <tr key={s.id}>
                        <td>{s.user1_name || 'Anon'}</td>
                        <td>{s.user2_name || 'Anon'}</td>
                        <td><span className={`badge ${s.session_type === 'video' ? 'badge-blue' : 'badge-gray'}`}>{s.session_type}</span></td>
                        <td className="text-muted">{new Date(s.started_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-muted">{dur}</td>
                      </tr>
                    );
                  })}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No sessions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <>
            <div className="mb-4">
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Reports</h2>
              <p className="text-muted text-sm mt-1">{reports.filter(r => !r.resolved).length} pending</p>
            </div>
            <div className="card overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Reporter</th><th>Reported</th><th>Reason</th><th>Date</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td>{r.reporter_name || 'Anon'}</td>
                      <td><span style={{ fontWeight: 500 }}>{r.reported_name || 'Anon'}</span></td>
                      <td className="text-muted" style={{ maxWidth: 200 }}>{r.reason || '—'}</td>
                      <td className="text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${r.resolved ? 'badge-green' : 'badge-red'}`}>
                          {r.resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {!r.resolved && (
                          <button className="btn btn-sm btn-outline" onClick={() => resolveReport(r.id)}>Resolve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No reports</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LOGS */}
        {tab === 'logs' && (
          <>
            <div className="mb-4">
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Admin Logs</h2>
              <p className="text-muted text-sm mt-1">Recent admin actions</p>
            </div>
            <div className="card overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Admin</th><th>Action</th><th>Target</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500 }}>{l.admin_name}</td>
                      <td><span className={`badge ${l.action === 'ban' ? 'badge-red' : 'badge-green'}`}>{l.action}</span></td>
                      <td>{l.target_name || '—'}</td>
                      <td className="text-muted">{new Date(l.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
