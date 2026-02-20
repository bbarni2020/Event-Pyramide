import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { language, available, changeLanguage, t } = useLanguage();
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
          <h1>{/* title is static for now but could be keyed */}
            EVENT PYRAMIDE
          </h1>
          <div className="nav-actions">
            <span className="user-info">
              {user.username}
              {user.is_admin && <span className="admin-badge">ADMIN</span>}
            </span>
            {/* language selector */}
            {Object.keys(available).length > 0 && (
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                {Object.entries(available).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <button onClick={() => setCurrentView('dashboard')}>{t('nav.dashboard')}</button>
            {user.is_admin && (
              <button onClick={() => setCurrentView('admin')}>{t('nav.admin')}</button>
            )}
            <button onClick={logout}>{t('nav.logout')}</button>
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
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
