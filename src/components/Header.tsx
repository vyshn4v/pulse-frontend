import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logoutUser } from '../store/authSlice';
import { Activity, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { apiUrl } from '../lib/api';

export const Header: React.FC = () => {
  const { user, isAuthenticated, sessionExpired } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const isLocked = !isAuthenticated || sessionExpired;

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navItems = [
    { to: '/activity-log', label: 'Activity' },
    { to: '/job-pipeline', label: 'Jobs' },
    { to: '/leetcode', label: 'LeetCode' },
    { to: '/linkedin', label: 'LinkedIn' },
    { to: '/brain', label: 'Brain' },
    { to: '/ai-query', label: 'AI Query' },
    { to: '/app-usage', label: 'Screen Time' },
    { to: '/system-monitor', label: 'System' },
  ];

  return (
    <header className="pulse-header">
      <div className="header-left">
        <Link to="/" className="brand-link">
          <Activity className="brand-icon" size={22} />
          <span className="brand-text">PULSE</span>
        </Link>

        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Instrument
          </NavLink>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={isLocked ? '#' : item.to}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) =>
                `nav-link ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'nav-locked' : ''}`
              }
              style={{
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
              title={isLocked ? 'Locked · Click Sign in with Google on the right' : undefined}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="header-right">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>FASTIFY : 5000</span>
        </div>

        {isAuthenticated && user ? (
          <div className="user-pill">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || user.email} className="user-avatar" />
            ) : (
              <div className="user-avatar-fallback">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="user-email">{user.email}</span>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-secondary"
              title="Sign Out"
              style={{ border: 'none', padding: '2px 6px', marginLeft: '4px' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <a href={apiUrl('/api/auth/google')} className="btn btn-sm btn-primary">
            <LogIn size={14} />
            <span>Sign in with Google</span>
          </a>
        )}
      </div>
    </header>
  );
};
