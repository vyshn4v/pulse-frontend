import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { LogIn, ShieldCheck, Activity } from 'lucide-react';
import { apiUrl } from '../lib/api';

export const Login: React.FC = () => {
  const { isGoogleConfigured } = useSelector((state: RootState) => state.auth);

  return (
    <div className="login-panel panel">
      <div className="login-icon-ring">
        <Activity size={28} />
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Sign in to PULSE</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
        Single-user personal life & career OS. Protected by Google OAuth and server-side email verification.
      </p>

      {isGoogleConfigured ? (
        <a
          href={apiUrl('/api/auth/google')}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
        >
          <LogIn size={16} />
          <span>Continue with Google</span>
        </a>
      ) : (
        <div className="auth-banner failed" style={{ textAlign: 'left' }}>
          <span>Google OAuth credentials not configured in backend .env file.</span>
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'JetBrains Mono',
        }}
      >
        <ShieldCheck size={14} color="var(--accent-2)" />
        <span>Allowlist: vyshnavpcnaravoor@gmail.com</span>
      </div>
    </div>
  );
};
