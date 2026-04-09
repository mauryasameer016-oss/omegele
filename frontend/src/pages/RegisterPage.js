import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.username, form.password, form.email);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card card-padded" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Create account</h1>
          <p className="text-muted text-sm mt-1">Join stranger.chat today</p>
        </div>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Username <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className="form-input" placeholder="min. 3 characters" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="text-muted">(optional)</span></label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className="form-input" type="password" placeholder="choose a strong password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
