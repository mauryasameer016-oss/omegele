import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import NavBar from './components/common/NavBar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="text-muted">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="text-muted">Loading...</div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="text-muted">Loading...</div></div>;

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<><NavBar /><LandingPage /></>} />
        <Route path="/login" element={user ? <Navigate to="/chat" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/chat" /> : <RegisterPage />} />
        <Route path="/chat" element={
          <ProtectedRoute><NavBar /><ChatPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><NavBar /><HistoryPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
