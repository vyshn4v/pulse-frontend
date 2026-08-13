import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Flame,
  Layers,
  Shuffle,
  Calendar,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Monitor,
  Code2,
  Terminal,
  Compass,
  MessageSquare,
  Palette,
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Trash2,
  Smartphone,
  Laptop,
  Radio,
  Search,
  Pause,
  Play,
} from 'lucide-react';

interface TopApp {
  appName: string;
  seconds: number;
  category: string;
  isProductive: boolean;
  percentage: number;
}

interface HourlyBucket {
  hour: number;
  label: string;
  productiveSeconds: number;
  distractingSeconds: number;
  totalSeconds: number;
}

interface TodaySummary {
  date: string;
  totalSeconds: number;
  productiveSeconds: number;
  distractingSeconds: number;
  focusScore: number;
  deepWorkBlocks: number;
  contextSwitches: number;
  categoryBreakdown: Record<string, number>;
  topApps: TopApp[];
  hourlyTimeline: HourlyBucket[];
  logCount: number;
}

interface DailyTrendItem {
  date: string;
  totalSeconds: number;
  productiveSeconds: number;
  distractingSeconds: number;
  focusScore: number;
  logs: number;
}

interface HistoricalAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  totalSeconds: number;
  productiveSeconds: number;
  distractingSeconds: number;
  avgFocusScore: number;
  dailyAverageHours: number;
  focusStreakDays: number;
  dailyTrend: DailyTrendItem[];
}

export interface TelemetryLogItem {
  id: number;
  appName: string;
  category: string;
  windowTitle?: string;
  durationSeconds: number;
  date: string;
  isProductive: boolean;
  device: 'pc' | 'android';
  platform?: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, { color: string; label: string; icon: any }> = {
  coding: { color: '#38bdf8', label: 'IDE & Coding', icon: Code2 },
  terminal: { color: '#10b981', label: 'Terminal & CLI', icon: Terminal },
  research: { color: '#818cf8', label: 'Research & Docs', icon: Compass },
  communication: { color: '#f59e0b', label: 'Communication', icon: MessageSquare },
  design: { color: '#ec4899', label: 'Design & UI', icon: Palette },
  entertainment: { color: '#f43f5e', label: 'Entertainment', icon: Film },
  other: { color: '#94a3b8', label: 'Other', icon: Monitor },
};

export const AppUsage: React.FC = () => {
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [analytics, setAnalytics] = useState<HistoricalAnalytics | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingDigest, setSendingDigest] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Polling Feed State
  const [recentLogs, setRecentLogs] = useState<TelemetryLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [livePollingEnabled, setLivePollingEnabled] = useState<boolean>(true);
  const [logSearch, setLogSearch] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'pc' | 'android'>('all');
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  // Quick Log Modal State
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logAppName, setLogAppName] = useState<string>('VS Code');
  const [logCategory, setLogCategory] = useState<string>('coding');
  const [logDurationMinutes, setLogDurationMinutes] = useState<number>(60);
  const [logWindowTitle, setLogWindowTitle] = useState<string>('');
  const [logIsProductive, setLogIsProductive] = useState<boolean>(true);
  const [submittingLog, setSubmittingLog] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRecentLogs = async (showSpinner = false) => {
    if (showSpinner) setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '80');
      if (logSearch) params.set('search', logSearch);
      if (deviceFilter !== 'all') params.set('device', deviceFilter);

      const res = await fetch(`/api/app-usage/logs?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch recent telemetry logs', err);
    } finally {
      if (showSpinner) setLogsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, analyticsRes] = await Promise.all([
        fetch('/api/app-usage/today', { credentials: 'include' }),
        fetch(`/api/app-usage/analytics?period=${period === 'today' ? 'week' : period}`, {
          credentials: 'include',
        }),
      ]);

      if (todayRes.ok) {
        const data = await todayRes.json();
        setTodaySummary(data);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch screen time data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecentLogs(true);
  }, [period]);

  // Live Auto-Polling Interval for incoming agent logs (every 6 seconds)
  useEffect(() => {
    if (!livePollingEnabled) return;
    const timer = setInterval(() => {
      fetchRecentLogs(false);
      // Also silently refresh today's totals
      fetch('/api/app-usage/today', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setTodaySummary(data);
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(timer);
  }, [livePollingEnabled, logSearch, deviceFilter]);

  const handleDeleteLog = async (id: number) => {
    setDeletingLogId(id);
    try {
      const res = await fetch(`/api/app-usage/logs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setRecentLogs((prev) => prev.filter((item) => item.id !== id));
        showToast('🗑️ Log entry deleted.');
        fetchData();
      }
    } catch (err) {
      showToast('⚠️ Failed to delete log entry.');
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await fetch('/api/app-usage/digest', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('📤 21:00 Screen Time Digest queued to your email inbox!');
      } else {
        showToast('⚠️ Could not trigger digest.');
      }
    } catch (err) {
      showToast('⚠️ Network error while triggering digest.');
    } finally {
      setSendingDigest(false);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAppName || logDurationMinutes <= 0) return;

    setSubmittingLog(true);
    try {
      const res = await fetch('/api/app-usage/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: logAppName,
          category: logCategory,
          durationSeconds: logDurationMinutes * 60,
          windowTitle: logWindowTitle,
          isProductive: logIsProductive,
        }),
        credentials: 'include',
      });

      if (res.ok) {
        showToast(`⚡ Logged ${logDurationMinutes}m on ${logAppName}`);
        setShowLogModal(false);
        setLogWindowTitle('');
        await fetchData();
      }
    } catch (err) {
      showToast('⚠️ Failed to log usage.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const formatHoursMinutes = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    if (mins < 60) {
      return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`.trim();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            border: '1px solid var(--accent)',
            color: '#e2e8f0',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          <Sparkles size={16} color="var(--accent)" />
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          background: 'var(--card-bg, #0f131c)',
          padding: '20px 24px',
          borderRadius: '12px',
          border: '1px solid var(--card-border, #1e293b)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #38bdf8)',
              }}
            >
              <Clock size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-bright, #f8fafc)' }}>
              App Usage & Developer Focus
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 46px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
            Deep work tracking, distraction velocity, context-switching metrics & 21:00 digest dispatch.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: period === p ? 'var(--accent, #38bdf8)' : 'transparent',
                  color: period === p ? '#07090e' : 'var(--text-muted, #94a3b8)',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="btn btn-sm btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <Plus size={14} /> Log Session
          </button>

          <button
            onClick={handleSendDigest}
            disabled={sendingDigest}
            className="btn btn-sm btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
            title="Dispatch today's 21:00 screen time digest email"
          >
            <Send size={14} /> {sendingDigest ? 'Dispatching...' : '21:00 Digest'}
          </button>
        </div>
      </div>

      {/* KPI Momentum Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Focus Score */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Focus Score
            </span>
            <Zap size={16} color="var(--accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--accent, #38bdf8)' }}>
              {todaySummary?.focusScore || 0}%
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '4px',
                background:
                  (todaySummary?.focusScore || 0) >= 75
                    ? 'rgba(16, 185, 129, 0.15)'
                    : (todaySummary?.focusScore || 0) >= 50
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                color:
                  (todaySummary?.focusScore || 0) >= 75
                    ? '#10b981'
                    : (todaySummary?.focusScore || 0) >= 50
                    ? '#f59e0b'
                    : '#f43f5e',
              }}
            >
              {(todaySummary?.focusScore || 0) >= 75
                ? 'Deep Flow'
                : (todaySummary?.focusScore || 0) >= 50
                ? 'Moderate'
                : 'Distracted'}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {formatHoursMinutes(todaySummary?.productiveSeconds || 0)} productive / {formatHoursMinutes(todaySummary?.totalSeconds || 0)} total
          </p>
        </div>

        {/* Deep Work Blocks */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Deep Work Blocks
            </span>
            <Flame size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f59e0b' }}>
            {todaySummary?.deepWorkBlocks || 0}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Uninterrupted &gt; 90m coding periods
          </p>
        </div>

        {/* Context Switches */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Context Switches
            </span>
            <Shuffle size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#818cf8' }}>
            {todaySummary?.contextSwitches || 0}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            App window transitions today
          </p>
        </div>

        {/* Focus Streak */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Focus Streak
            </span>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#10b981' }}>
            {analytics?.focusStreakDays || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Days</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Consecutive days &gt;= 75% target focus
          </p>
        </div>
      </div>

      {/* Main Grid: Hourly Timeline & Category Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* 24-Hour Hourly Timeline */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-bright)' }}>
                24-Hour Screen Time Timeline
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Hour-by-hour distribution across today
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }} /> Productive
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#f43f5e' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f43f5e' }} /> Distracting
              </span>
            </div>
          </div>

          {/* Timeline Bars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(24, 1fr)',
              gap: '4px',
              alignItems: 'flex-end',
              height: '160px',
              paddingTop: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {todaySummary?.hourlyTimeline.map((bucket) => {
              const maxMinutes = 60;
              const prodMins = Math.min(60, bucket.productiveSeconds / 60);
              const distMins = Math.min(60 - prodMins, bucket.distractingSeconds / 60);
              const prodHeight = (prodMins / maxMinutes) * 100;
              const distHeight = (distMins / maxMinutes) * 100;
              const isCurrentHour = new Date().getHours() === bucket.hour;

              return (
                <div
                  key={bucket.hour}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    height: '100%',
                    position: 'relative',
                  }}
                  title={`${bucket.label}: ${Math.round(prodMins)}m productive, ${Math.round(distMins)}m distracting`}
                >
                  {/* Distracting bar (top stack) */}
                  {distHeight > 0 && (
                    <div
                      style={{
                        height: `${distHeight}%`,
                        background: '#f43f5e',
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.85,
                      }}
                    />
                  )}
                  {/* Productive bar (bottom stack) */}
                  {prodHeight > 0 && (
                    <div
                      style={{
                        height: `${prodHeight}%`,
                        background: '#38bdf8',
                        borderRadius: distHeight > 0 ? '0' : '2px 2px 0 0',
                        boxShadow: isCurrentHour ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                      }}
                    />
                  )}
                  {prodHeight === 0 && distHeight === 0 && (
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline Hour Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(24, 1fr)',
              gap: '4px',
              marginTop: '8px',
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}
          >
            {todaySummary?.hourlyTimeline.map((bucket) => (
              <div key={bucket.hour} style={{ opacity: bucket.hour % 3 === 0 ? 1 : 0 }}>
                {bucket.hour}h
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-bright)' }}>
            Category Distribution
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Time logged per functional engineering domain
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(todaySummary?.categoryBreakdown || {}).map(([catKey, secs]) => {
              const catConfig = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
              const Icon = catConfig.icon;
              const totalSecs = todaySummary?.totalSeconds || 1;
              const percentage = Math.round((secs / totalSecs) * 100);

              return (
                <div key={catKey}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                      <Icon size={14} color={catConfig.color} />
                      {catConfig.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {formatHoursMinutes(secs)} ({percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: catConfig.color,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Applications & 7-Day Velocity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Top Applications Leaderboard */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-bright)' }}>
                Top Applications Today
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ranked by active foreground duration
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {todaySummary?.topApps.length || 0} Apps Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!todaySummary?.topApps || todaySummary.topApps.length === 0) && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active screen time logs today. Start the background PC/Android monitor or click <strong>+ Log Session</strong> above.
              </div>
            )}

            {todaySummary?.topApps.slice(0, 7).map((app, idx) => {
              const catConfig = CATEGORY_COLORS[app.category] || CATEGORY_COLORS.other;
              return (
                <div
                  key={app.appName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)', width: '18px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {app.appName}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          fontFamily: 'monospace',
                          color: catConfig.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {catConfig.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'monospace' }}>
                      {formatHoursMinutes(app.seconds)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {app.percentage}% of day
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Focus Velocity & Trends */}
        <div
          style={{
            background: 'var(--card-bg, #0f131c)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--card-border, #1e293b)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-bright)' }}>
                7-Day Focus & Hours Trend
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Daily average: {analytics?.dailyAverageHours || 0}h / day ({analytics?.avgFocusScore || 0}% focus)
              </p>
            </div>
            <Calendar size={16} color="var(--accent)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!analytics?.dailyTrend || analytics.dailyTrend.length === 0) && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No historical analytics recorded yet.
              </div>
            )}

            {analytics?.dailyTrend.map((day) => {
              const totalHours = Number((day.totalSeconds / 3600).toFixed(1));
              const prodHours = Number((day.productiveSeconds / 3600).toFixed(1));
              const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={day.date} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                      {dateLabel}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {prodHours}h / {totalHours}h
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: day.focusScore >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: day.focusScore >= 75 ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {day.focusScore}% Focus
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (totalHours / 10) * 100)}%`,
                        background: day.focusScore >= 75 ? 'var(--accent)' : '#f59e0b',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📡 Live Telemetry Stream / Polling Logs Feed */}
      <div
        style={{
          background: 'var(--card-bg, #0f131c)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--card-border, #1e293b)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--accent, #38bdf8)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-bright, #f8fafc)' }}>
                Live Telemetry Polling Stream
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              Real-time incoming active window & application logs from PC Monitor and Android Mobile.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Live Auto-Polling Toggle Button */}
            <button
              onClick={() => setLivePollingEnabled(!livePollingEnabled)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: livePollingEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                color: livePollingEnabled ? '#10b981' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {livePollingEnabled ? (
                <>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  Live Sync: ON (6s)
                </>
              ) : (
                <>
                  <Pause size={12} /> Sync Paused
                </>
              )}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchRecentLogs(true)}
              disabled={logsLoading}
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Refresh log stream"
            >
              <RefreshCw size={13} className={logsLoading ? 'spinner' : ''} /> Refresh
            </button>

            {/* Device Filter */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '2px' }}>
              {[
                { id: 'all', label: 'All', icon: null },
                { id: 'pc', label: 'PC', icon: Laptop },
                { id: 'android', label: 'Mobile', icon: Smartphone },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDeviceFilter(d.id as any)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    background: deviceFilter === d.id ? 'var(--accent, #38bdf8)' : 'transparent',
                    color: deviceFilter === d.id ? '#07090e' : 'var(--text-muted)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {d.icon && <d.icon size={12} />} {d.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search app or window..."
                style={{
                  padding: '5px 10px 5px 30px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #334155',
                  color: 'var(--text-bright)',
                  fontSize: '0.78rem',
                  width: '180px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Logs Feed Container */}
        {recentLogs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.01)',
              borderRadius: '8px',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            <Radio size={28} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
            <div>No live telemetry logs received yet.</div>
            <div style={{ fontSize: '0.78rem', marginTop: '6px', color: 'var(--text-muted)' }}>
              Start your background monitor on PC (<code>monitor/pc/start_pc_monitor.bat</code>) or Android (<code>pulse_android_monitor.py</code>) to stream active window usage.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  <th style={{ padding: '8px 12px' }}>DEVICE</th>
                  <th style={{ padding: '8px 12px' }}>APPLICATION</th>
                  <th style={{ padding: '8px 12px' }}>ACTIVE WINDOW / TASK</th>
                  <th style={{ padding: '8px 12px' }}>CATEGORY</th>
                  <th style={{ padding: '8px 12px' }}>DURATION</th>
                  <th style={{ padding: '8px 12px' }}>TIME</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const catConfig = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.other;
                  const logTime = new Date(log.date);
                  const timeFormatted = logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                  const dateFormatted = logTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const isAndroid = log.device === 'android';

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Device */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isAndroid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                            color: isAndroid ? '#10b981' : '#38bdf8',
                            border: `1px solid ${isAndroid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                          }}
                        >
                          {isAndroid ? <Smartphone size={11} /> : <Laptop size={11} />}
                          {isAndroid ? 'Android' : log.platform || 'PC Desktop'}
                        </span>
                      </td>

                      {/* App Name */}
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: log.isProductive ? '#10b981' : '#f43f5e',
                            }}
                          />
                          {log.appName}
                        </div>
                      </td>

                      {/* Window Title */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.windowTitle}>
                        {log.windowTitle || '—'}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            color: catConfig.color,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.03)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {catConfig.label}
                        </span>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: log.isProductive ? 'var(--text-bright)' : '#f43f5e' }}>
                        {formatDuration(log.durationSeconds)}
                      </td>

                      {/* Time */}
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {timeFormatted} · <span style={{ opacity: 0.6 }}>{dateFormatted}</span>
                      </td>

                      {/* Delete Action */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deletingLogId === log.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          title="Delete log entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Log Modal */}
      {showLogModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f131c',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                ⚡ Quick Log App Session
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Application Name
                </label>
                <input
                  type="text"
                  value={logAppName}
                  onChange={(e) => setLogAppName(e.target.value)}
                  placeholder="e.g. VS Code, Terminal, Postman"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#07090e',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="coding">IDE & Coding</option>
                    <option value="terminal">Terminal & Shell</option>
                    <option value="research">Research & Docs</option>
                    <option value="communication">Communication</option>
                    <option value="design">Design</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={logDurationMinutes}
                    onChange={(e) => setLogDurationMinutes(Number(e.target.value))}
                    min={1}
                    max={1440}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Window / Task Title (Optional)
                </label>
                <input
                  type="text"
                  value={logWindowTitle}
                  onChange={(e) => setLogWindowTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="prodCheck"
                  checked={logIsProductive}
                  onChange={(e) => setLogIsProductive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="prodCheck" style={{ fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  Mark as Productive Engineering Focus
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '8px 18px', fontWeight: 600 }}
                >
                  {submittingLog ? 'Logging...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppUsage;
