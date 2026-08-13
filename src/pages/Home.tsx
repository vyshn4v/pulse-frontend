import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { modules, ModuleDef } from '../lib/modules';
import { apiUrl } from '../lib/api';
import {
  User,
  Activity,
  Briefcase,
  Users,
  Code,
  Share2,
  TrendingUp,
  Cpu,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  Radio,
  Lock,
  LogIn,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  User,
  Activity,
  Briefcase,
  Users,
  Code,
  Share2,
  TrendingUp,
  Cpu,
  Sparkles,
  Clock,
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authParam = searchParams.get('auth');
  const [currentTime, setCurrentTime] = useState<string>('');

  const { isAuthenticated, sessionExpired, isLoading } = useSelector((state: RootState) => state.auth);
  const isLocked = !isAuthenticated || sessionExpired;

  // Live telemetry metrics
  const [activityCount, setActivityCount] = useState<number>(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [meConfigured, setMeConfigured] = useState<boolean>(false);
  const [meDomainCount, setMeDomainCount] = useState<number>(0);
  const [jobTotal, setJobTotal] = useState<number>(0);
  const [jobActive, setJobActive] = useState<number>(0);
  const [jobInterviews, setJobInterviews] = useState<number>(0);
  const [hrCount, setHrCount] = useState<number>(0);
  const [leetcodeStats, setLeetcodeStats] = useState<{
    total: number;
    easy: number;
    med: number;
    hard: number;
    username: string;
  }>({ total: 0, easy: 0, med: 0, hard: 0, username: '' });
  const [linkedinStats, setLinkedinStats] = useState<{
    scheduled: number;
    published: number;
    drafts: number;
    nextDate: string | null;
  }>({ scheduled: 0, published: 0, drafts: 0, nextDate: null });
  const [performanceStats, setPerformanceStats] = useState<{
    momentumIndex: number;
    grade: string;
    streak: number;
  }>({ momentumIndex: 0, grade: 'B+', streak: 0 });
  const [brainStats, setBrainStats] = useState<{ score: number; memories: number }>({ score: 0, memories: 0 });
  const [systemStats, setSystemStats] = useState<{
    cpu: number;
    mem: number;
    uptime: string;
    cores: number;
  }>({ cpu: 0, mem: 0, uptime: '', cores: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
          ' · ' +
          now.toLocaleTimeString('en-US', { hour12: false }) +
          ' IST',
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Fetch live activity stats
    fetch('/api/activity-log', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setActivityCount(data.length);
          if (data.length > 0) {
            setLastActivityDate(new Date(data[0].startDate || data[0].date).toLocaleDateString());
          }
        }
      })
      .catch(() => {});

    // 2. Fetch live Me profile stats
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data.whoAmI || data.goals)) {
          setMeConfigured(true);
          const domains = data.brainBehaviorPrefs?.focusDomains;
          setMeDomainCount(Array.isArray(domains) ? domains.length : 1);
        }
      })
      .catch(() => {});

    // 3. Fetch live Job Pipeline stats
    fetch('/api/job-pipeline', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setJobTotal(data.length);
          const active = data.filter((j: any) => j.status === 'applied' || j.status === 'interview').length;
          const interviews = data.filter((j: any) => j.status === 'interview').length;
          setJobActive(active);
          setJobInterviews(interviews);
        }
      })
      .catch(() => {});

    // 4. Fetch live HR Details stats
    fetch('/api/hr-details', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setHrCount(data.length);
        }
      })
      .catch(() => {});

    // 5. Fetch live LeetCode stats
    fetch('/api/leetcode/stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLeetcodeStats({
            total: data.totalSolved || 0,
            easy: data.easyCount || 0,
            med: data.mediumCount || 0,
            hard: data.hardCount || 0,
            username: data.username || '',
          });
        }
      })
      .catch(() => {});

    // 6. Fetch live LinkedIn stats
    fetch('/api/linkedin/stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLinkedinStats({
            scheduled: data.scheduledCount || 0,
            published: data.publishedCount || 0,
            drafts: data.draftCount || 0,
            nextDate: data.nextScheduledPost?.scheduledFor
              ? new Date(data.nextScheduledPost.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : null,
          });
        }
      })
      .catch(() => {});

    // 7. Fetch live Performance Momentum stats
    fetch('/api/performance/overview?range=30d', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPerformanceStats({
            momentumIndex: data.momentumIndex || 0,
            grade: data.momentumGrade || 'B+',
            streak: data.streakDays || 0,
          });
        }
      })
      .catch(() => {});

    // 8. Fetch live Brain stats
    fetch('/api/brain/stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBrainStats({
            score: data.latestScore || 88,
            memories: data.totalIndexedMemories || 0,
          });
        }
      })
      .catch(() => {});

    // 9. Fetch live System Monitor stats
    fetch('/api/system-monitor/stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSystemStats({
            cpu: data.cpu?.overallUsagePercent || 0,
            mem: data.memory?.usagePercent || 0,
            uptime: data.host?.uptimeFormatted || '',
            cores: data.cpu?.coreCount || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const getTileReadout = (mod: ModuleDef): string => {
    if (mod.id === 'activity-log') {
      return activityCount > 0
        ? `${activityCount} entries · ${lastActivityDate || 'today'}`
        : '0 entries logged today';
    }
    if (mod.id === 'me') {
      return meConfigured
        ? `configured · ${meDomainCount} focus domains active`
        : 'kernel ready · click to configure';
    }
    if (mod.id === 'job-pipeline') {
      return jobTotal > 0
        ? `${jobActive} active · ${jobInterviews} interviews`
        : '0 active applications';
    }
    if (mod.id === 'hr-details') {
      return hrCount > 0
        ? `${hrCount} recruiter contacts indexed`
        : '0 HR contacts indexed';
    }
    if (mod.id === 'leetcode') {
      return leetcodeStats.total > 0
        ? `${leetcodeStats.total} solved · ${leetcodeStats.easy}E / ${leetcodeStats.med}M / ${leetcodeStats.hard}H`
        : leetcodeStats.username
        ? `@${leetcodeStats.username} connected`
        : 'connect LeetCode handle';
    }
    if (mod.id === 'linkedin') {
      return linkedinStats.scheduled > 0
        ? `${linkedinStats.scheduled} queued · ${linkedinStats.published} published · next ${linkedinStats.nextDate || 'soon'}`
        : linkedinStats.published > 0
        ? `${linkedinStats.published} published · 0 queued`
        : '0 posts in queue';
    }
    if (mod.id === 'performance') {
      return performanceStats.momentumIndex > 0
        ? `${performanceStats.momentumIndex}/100 Momentum (${performanceStats.grade}) · ${performanceStats.streak}d streak`
        : 'active · 4-pillar analytics';
    }
    if (mod.id === 'brain') {
      return brainStats.score > 0
        ? `${brainStats.score}/100 Score · 5:00 AM Daily Dispatch`
        : '5:00 AM Synthesis Active';
    }
    if (mod.id === 'ai-query') {
      return 'real-time vector RAG · active';
    }
    if (mod.id === 'system-monitor') {
      return systemStats.cores > 0
        ? `${systemStats.cpu}% CPU · ${systemStats.mem}% RAM · ${systemStats.uptime} uptime`
        : 'real-time SSE stream · active';
    }
    return mod.defaultReadout;
  };

  return (
    <div className="home-container">
      {authParam === 'success' && (
        <div className="auth-banner success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>Google Authentication verified successfully. Session established.</span>
          </div>
        </div>
      )}

      {authParam === 'failed' && (
        <div className="auth-banner failed">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>Google Authentication rejected: account is not on the single-user allowlist.</span>
          </div>
        </div>
      )}

      {authParam === 'not_configured' && (
        <div className="auth-banner failed">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>Google OAuth credentials not configured in environment (.env).</span>
          </div>
        </div>
      )}

      <div className="dashboard-heading">
        <div className="dashboard-title-group">
          <p className="dashboard-subtitle">Personal Telemetry & Cognitive Control OS</p>
          <h1>INSTRUMENT PANEL</h1>
        </div>
        <div className="dashboard-clock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
            <Radio size={14} />
            <span>{currentTime || 'SYNCHRONIZING...'}</span>
          </div>
        </div>
      </div>

      {/* Session Notification Banner (PULSE dark scheme) */}
      {(sessionExpired || (!isAuthenticated && !isLoading)) && (
        <div
          id="session-banner"
          style={{
            background: 'rgba(245, 158, 11, 0.07)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={17} color="var(--accent-2, #f59e0b)" />
            <span style={{ fontSize: '0.86rem', color: 'var(--text-bright, #f8fafc)' }}>
              <strong style={{ color: 'var(--accent-2, #f59e0b)' }}>
                {sessionExpired ? 'Session Expired:' : 'Session Inactive:'}
              </strong>{' '}
              {sessionExpired
                ? 'Your session has timed out. Please login again to continue accessing telemetry modules.'
                : 'Authentication required. Please log in to unlock telemetry ledger, job pipeline, and AI tools.'}
            </span>
          </div>

          <a
            href={apiUrl('/api/auth/google')}
            className="btn btn-sm btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <LogIn size={13} /> Sign in with Google
          </a>
        </div>
      )}

      {/* Telemetry Gauge Row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Daily Activities</div>
          <div className="stat-value">{isLocked ? '--' : activityCount}</div>
          <div className="stat-sub">
            {isLocked ? 'Login required' : activityCount > 0 ? `last entry ${lastActivityDate}` : 'Phase 1 live ledger'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Active Job Funnel</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{isLocked ? '--' : jobActive}</div>
          <div className="stat-sub">
            {isLocked ? 'Login required' : jobTotal > 0 ? `${jobTotal} total · ${jobInterviews} interviews` : 'Phase 2 pipeline'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">DSA Solved</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{isLocked ? '--' : leetcodeStats.total}</div>
          <div className="stat-sub">
            {isLocked ? 'Login required' : leetcodeStats.total > 0
              ? `${leetcodeStats.easy}E · ${leetcodeStats.med}M · ${leetcodeStats.hard}H`
              : 'Phase 3 scraped telemetry'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Scheduled Posts</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{isLocked ? '--' : linkedinStats.scheduled}</div>
          <div className="stat-sub">
            {isLocked ? 'Login required' : linkedinStats.scheduled > 0
              ? `${linkedinStats.published} published · next ${linkedinStats.nextDate || 'soon'}`
              : 'Phase 4 queue ready'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Cognitive Synthesis</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{isLocked ? '--' : '5:00 AM'}</div>
          <div className="stat-sub">{isLocked ? 'Login required' : 'Phase 7 Pinecone RAG'}</div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="icon-grid">
        {modules.map((mod: ModuleDef) => {
          const IconComp = iconMap[mod.iconName] || Activity;
          const isBrain = mod.id === 'brain';
          const isBuilt = mod.phase <= 5 || mod.id === 'brain' || mod.id === 'ai-query' || mod.id === 'app-usage' || mod.id === 'system-monitor' || mod.phase <= 10;

          return (
            <Link
              key={mod.id}
              to={isLocked ? '#' : mod.path}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                }
              }}
              className={`tile-card ${isBrain ? 'brain-tile' : ''} ${isLocked ? 'tile-locked' : ''}`}
              style={{
                opacity: isLocked ? 0.7 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={isLocked ? 'Locked · Please use the Sign in with Google button above' : undefined}
            >
              <div className="tile-top">
                <div className="tile-icon-box">
                  {isLocked ? <Lock size={16} color="var(--text-muted)" /> : <IconComp size={18} />}
                </div>
                <span className={`tile-badge ${isLocked ? 'pending' : isBuilt ? 'ready' : 'pending'}`}>
                  {isLocked ? 'Locked' : isBuilt ? 'Active' : `Phase ${mod.phase}`}
                </span>
              </div>

              <div className="tile-info">
                <p className="tile-eyebrow">{mod.eyebrow}</p>
                <h3 className="tile-title">{mod.title}</h3>
              </div>

              <div className="tile-readout-row">
                <div className="tile-readout">
                  <span>▸</span>
                  <span>{isLocked ? 'Authentication required' : getTileReadout(mod)}</span>
                </div>
              </div>

              {/* Signature Waveform element on Brain tile only */}
              {isBrain && (
                <svg
                  className="waveform-svg"
                  viewBox="0 0 200 30"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="waveform-path"
                    d="M0,15 L30,15 L40,15 L45,3 L50,27 L55,9 L60,21 L65,15 L100,15 L130,15 L135,5 L140,25 L145,10 L150,20 L155,15 L200,15"
                  />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
