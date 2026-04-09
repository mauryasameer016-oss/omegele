import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">stranger<span>.chat</span></Link>
      <div className="nav-actions">
        {user ? (
          <>
            <Link to="/chat" className={`btn btn-ghost btn-sm ${pathname === '/chat' ? 'active' : ''}`}>Chat</Link>
            <Link to="/history" className={`btn btn-ghost btn-sm ${pathname === '/history' ? 'active' : ''}`}>History</Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-ghost btn-sm">Admin</Link>
            )}
            <span className="text-muted text-sm" style={{ padding: '0 6px' }}>{user.username}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
