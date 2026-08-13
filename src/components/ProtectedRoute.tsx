import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, sessionExpired } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <div className="spinner" style={{ width: '28px', height: '28px' }} />
        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Verifying session...</span>
      </div>
    );
  }

  // If session expired or not authenticated, stay outside on Home
  if (!isAuthenticated || sessionExpired) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
