import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Construction, Terminal, Database, Cpu } from 'lucide-react';
import { modules } from '../lib/modules';

export const Placeholder: React.FC = () => {
  const location = useLocation();
  const currentModule = modules.find((m) => m.path === location.pathname) || {
    id: 'unknown',
    title: 'Module',
    path: location.pathname,
    eyebrow: 'System Component',
    phase: 0,
    description: 'Component designated for future build phase.',
    iconName: 'Activity',
    defaultReadout: 'pending',
  };

  return (
    <div className="placeholder-container">
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">{currentModule.eyebrow}</p>
            <h2>{currentModule.title}</h2>
          </div>
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>SCHEDULED : PHASE {currentModule.phase}</span>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Construction className="brand-icon" size={20} />
          <h3 style={{ fontSize: '1.05rem' }}>Phase {currentModule.phase} Target Scope</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          {currentModule.description}
        </p>

        <div className="spec-grid">
          <div className="spec-card">
            <div className="spec-card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} />
                <span>Planned Data Layer</span>
              </div>
            </div>
            <ul className="spec-list">
              <li>• PostgreSQL + Prisma Model</li>
              <li>• JSONB Flexible Telemetry</li>
              <li>• Per-user data partitioning</li>
            </ul>
          </div>

          <div className="spec-card">
            <div className="spec-card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} />
                <span>Planned Endpoints</span>
              </div>
            </div>
            <ul className="spec-list">
              <li>• REST API /api/{currentModule.id}</li>
              <li>• Single-user allowlist guard</li>
              <li>• Redis telemetry cache</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="panel" style={{ background: '#0e1217', borderColor: '#1f242d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Terminal size={14} color="var(--accent)" />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--accent)' }}>
            ENGINEERING CONTRACT
          </span>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Phase {currentModule.phase} will be implemented strictly according to the architecture specification in sequence. Current active phase: <strong>Phase 0 — Foundation</strong>.
        </p>
      </div>
    </div>
  );
};
