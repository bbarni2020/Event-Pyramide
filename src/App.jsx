import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <h1>EVENT PYRAMIDE</h1>
          <div className="nav-actions">
            <span className="user-info">
              {user.username}
              {user.is_admin && <span className="admin-badge">ADMIN</span>}
            </span>
            {user.is_admin && (
              <>
                <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
                <button onClick={() => setCurrentView('admin')}>Admin Panel</button>
              </>
            )}
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {currentView === 'dashboard' ? <Dashboard /> : <AdminPanel />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
