import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logoutUser } from '../store/authSlice';
import {
  Activity,
  LogOut,
  LogIn,
  Menu,
  X,
  Briefcase,
  Code,
  Share2,
  Cpu,
  Sparkles,
  Clock,
  User as UserIcon,
  Server,
  Home as HomeIcon,
  ChevronRight,
} from 'lucide-react';
import { apiUrl } from '../lib/api';

export const Header: React.FC = () => {
  const { user, isAuthenticated, sessionExpired } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isLocked = !isAuthenticated || sessionExpired;

  const handleLogout = () => {
    setMobileMenuOpen(false);
    dispatch(logoutUser());
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { to: '/', label: 'Instrument', icon: HomeIcon },
    { to: '/activity-log', label: 'Activity', icon: Activity },
    { to: '/job-pipeline', label: 'Jobs', icon: Briefcase },
    { to: '/leetcode', label: 'LeetCode', icon: Code },
    { to: '/linkedin', label: 'LinkedIn', icon: Share2 },
    { to: '/brain', label: 'Brain', icon: Cpu },
    { to: '/ai-query', label: 'AI Query', icon: Sparkles },
    { to: '/app-usage', label: 'Screen Time', icon: Clock },
    { to: '/system-monitor', label: 'System', icon: Server },
  ];

  return (
    <>
      <header className="pulse-header">
        <div className="header-left">
          <Link to="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <Activity className="brand-icon" size={22} />
            <span className="brand-text">PULSE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Instrument
            </NavLink>

            {navItems.slice(1).map((item) => (
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
          {/* Server fastify indicator (hidden on small mobile screens) */}
          <div className="status-indicator desktop-only-indicator">
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
              <span className="user-email desktop-only-email">{user.email}</span>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-secondary logout-btn-header"
                title="Sign Out"
                style={{ border: 'none', padding: '2px 6px', marginLeft: '4px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <a href={apiUrl('/api/auth/google')} className="btn btn-sm btn-primary login-btn-header">
              <LogIn size={14} />
              <span className="login-btn-text">Sign in with Google</span>
            </a>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="mobile-hamburger-btn"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent)" />
                <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent)' }}>
                  PULSE OS
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-sm btn-secondary"
                style={{ border: 'none', padding: '6px', borderRadius: '50%' }}
                aria-label="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile User Profile Card */}
            {isAuthenticated && user && (
              <div className="mobile-drawer-user">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name || user.email} className="user-avatar-lg" />
                ) : (
                  <div className="user-avatar-fallback-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {user.name || 'Personal Admin'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation List */}
            <div className="mobile-drawer-links">
              <div className="mobile-drawer-section-title">TELEMETRY & MODULES</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

                return (
                  <Link
                    key={item.to}
                    to={isLocked && item.to !== '/' ? '#' : item.to}
                    onClick={(e) => {
                      if (isLocked && item.to !== '/') {
                        e.preventDefault();
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={`mobile-nav-item ${isActive ? 'active' : ''} ${isLocked && item.to !== '/' ? 'locked' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="mobile-nav-icon-box">
                        <Icon size={18} />
                      </div>
                      <span className="mobile-nav-label">{item.label}</span>
                    </div>
                    <ChevronRight size={15} color="var(--text-muted)" opacity={0.6} />
                  </Link>
                );
              })}

              <div className="mobile-drawer-section-title" style={{ marginTop: '16px' }}>
                CONFIGURATION
              </div>
              <Link
                to="/me"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-item ${location.pathname === '/me' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="mobile-nav-icon-box">
                    <UserIcon size={18} />
                  </div>
                  <span className="mobile-nav-label">Me Profile</span>
                </div>
                <ChevronRight size={15} color="var(--text-muted)" opacity={0.6} />
              </Link>
            </div>

            {/* Drawer Footer Actions */}
            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <a
                  href={apiUrl('/api/auth/google')}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <LogIn size={16} />
                  <span>Sign in with Google</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (Pixel 7 & Mobile Screens) */}
      <nav className="mobile-bottom-bar" aria-label="Mobile quick navigation">
        <NavLink to="/" end className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}>
          <HomeIcon size={21} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to={isLocked ? '#' : '/activity-log'}
          onClick={(e) => isLocked && e.preventDefault()}
          className={({ isActive }) => `bottom-bar-item ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        >
          <Activity size={21} />
          <span>Activity</span>
        </NavLink>

        <NavLink
          to={isLocked ? '#' : '/job-pipeline'}
          onClick={(e) => isLocked && e.preventDefault()}
          className={({ isActive }) => `bottom-bar-item ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        >
          <Briefcase size={21} />
          <span>Jobs</span>
        </NavLink>

        <NavLink
          to={isLocked ? '#' : '/system-monitor'}
          onClick={(e) => isLocked && e.preventDefault()}
          className={({ isActive }) => `bottom-bar-item ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        >
          <Server size={21} />
          <span>System</span>
        </NavLink>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`bottom-bar-item ${mobileMenuOpen ? 'active' : ''}`}
          aria-label="Open More Modules"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Menu size={21} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
