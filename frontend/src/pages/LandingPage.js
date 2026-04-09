import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="page-center" style={{ flexDirection: 'column', gap: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>
          Meet someone new
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16, color: 'var(--text-primary)' }}>
          Talk to a stranger.<br />
          <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>Instantly.</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Connect with a random person anywhere in the world for text or video chat. 
          No setup, no algorithms — just a real conversation.
        </p>
        <div className="flex-center gap-3">
          {user ? (
            <Link to="/chat" className="btn btn-primary btn-lg">Start Chatting →</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Log in</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 600, width: '100%' }}>
        {[
          { icon: '⚡', title: 'Instant matching', desc: 'Connected in seconds' },
          { icon: '📹', title: 'Text & video', desc: 'Your choice of mode' },
          { icon: '🔒', title: 'Safe & clean', desc: 'Report & skip anytime' },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{f.title}</div>
            <div className="text-muted text-sm">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
