import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Zap,
  Activity,
  Code,
  Briefcase,
  Share2,
  Award,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface PillarScore {
  score: number;
  weight: number;
  status: 'optimal' | 'moderate' | 'lagging';
  title: string;
  metricReadout: string;
  trend: 'up' | 'down' | 'neutral';
  deltaPercent: number;
}

interface PerformanceData {
  momentumIndex: number;
  momentumGrade: string;
  momentumStatus: string;
  streakDays: number;
  pillars: {
    engineering: PillarScore;
    career: PillarScore;
    thoughtLeadership: PillarScore;
    execution: PillarScore;
  };
  activityStats: {
    total: number;
    rangeCount: number;
    byCategory: Record<string, number>;
    dailyAverage: number;
  };
  jobStats: {
    totalApplied: number;
    activeApplications: number;
    interviewsScheduled: number;
    offersReceived: number;
    funnelConversionRate: number;
  };
  leetcodeStats: {
    totalSolved: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    dailyStreak: number;
    weeklySolvedRate: number;
  };
  linkedinStats: {
    totalPosts: number;
    publishedCount: number;
    scheduledCount: number;
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
  };
  timelineData: Array<{
    date: string;
    activities: number;
    leetcodeSolved: number;
    jobApplications: number;
    linkedinPosts: number;
    cumulativeMomentum: number;
  }>;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export const Performance: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('30d');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'activities' | 'leetcode' | 'jobs' | 'linkedin'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);

  const fetchOverview = async (selectedRange: TimeRange = range) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/performance/overview?range=${selectedRange}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch performance telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
  }, [range]);

  // Chart Dimensions & Scales
  const timeline = data?.timelineData || [];
  const maxChartVal = useMemo(() => {
    if (!timeline.length) return 10;
    const maxVal = Math.max(
      ...timeline.map((p) => Math.max(p.activities, p.leetcodeSolved * 2, p.jobApplications * 3, p.linkedinPosts * 3, 1)),
    );
    return Math.max(maxVal + 2, 8);
  }, [timeline]);

  const chartWidth = 900;
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 30, bottom: 35, left: 35 };

  const getX = (index: number) => {
    if (timeline.length <= 1) return chartPadding.left;
    const innerW = chartWidth - chartPadding.left - chartPadding.right;
    return chartPadding.left + (index / (timeline.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    const innerH = chartHeight - chartPadding.top - chartPadding.bottom;
    const clamped = Math.min(val, maxChartVal);
    return chartHeight - chartPadding.bottom - (clamped / maxChartVal) * innerH;
  };

  // Generate SVG Path
  const generateLinePath = (key: 'activities' | 'leetcodeSolved' | 'jobApplications' | 'linkedinPosts') => {
    if (!timeline.length) return '';
    return timeline
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p[key]);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const generateAreaPath = (key: 'activities' | 'leetcodeSolved' | 'jobApplications' | 'linkedinPosts') => {
    if (!timeline.length) return '';
    const line = generateLinePath(key);
    const lastX = getX(timeline.length - 1);
    const firstX = getX(0);
    const bottomY = chartHeight - chartPadding.bottom;
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Executive Digest Generator
  const generateDigestText = () => {
    if (!data) return '';
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `=====================================================
PULSE COGNITIVE PERFORMANCE REPORT · ${nowStr}
Range: ${range.toUpperCase()} | Overall Momentum: ${data.momentumIndex}/100 (${data.momentumGrade})
Status: ${data.momentumStatus} | Streak: ${data.streakDays} Consecutive Days
=====================================================

1. ENGINEERING & PROBLEM SOLVING (${data.pillars.engineering.score}/100)
   • Total Solved: ${data.leetcodeStats.totalSolved} (${data.leetcodeStats.easyCount}E / ${data.leetcodeStats.mediumCount}M / ${data.leetcodeStats.hardCount}H)
   • Velocity Rate: ${data.leetcodeStats.weeklySolvedRate} solved/week

2. CAREER & PIPELINE VELOCITY (${data.pillars.career.score}/100)
   • Total Applied: ${data.jobStats.totalApplied}
   • Active Pipeline: ${data.jobStats.activeApplications} active · ${data.jobStats.interviewsScheduled} interviews
   • Conversion Rate: ${data.jobStats.funnelConversionRate}%

3. THOUGHT LEADERSHIP & CONTENT (${data.pillars.thoughtLeadership.score}/100)
   • Posts: ${data.linkedinStats.publishedCount} published, ${data.linkedinStats.scheduledCount} queued
   • Total Impressions: ${data.linkedinStats.totalImpressions.toLocaleString()}
   • Engagement: ${data.linkedinStats.totalEngagements} total (${data.linkedinStats.avgEngagementRate}% rate)

4. DAILY EXECUTION & CONSISTENCY (${data.pillars.execution.score}/100)
   • Activities Logged: ${data.activityStats.rangeCount} entries (Avg ${data.activityStats.dailyAverage}/day)
   • Consistency: ${data.pillars.execution.metricReadout}

Generated by PULSE OS · Personal Telemetry & Cognitive Intelligence
=====================================================`;
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(generateDigestText());
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  };

  // Radial Gauge Calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = data
    ? circumference - (data.momentumIndex / 100) * circumference
    : circumference;

  return (
    <div className="activity-page" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Cognitive Analytics & Career Trajectory Engine</p>
            <h2>Performance & Momentum Command</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Time Range Selector */}
          <div
            style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  background: range === r ? 'var(--surface-hover)' : 'transparent',
                  color: range === r ? 'var(--accent)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: range === r ? '600' : '400',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOverview(range)}
            disabled={refreshing}
            className="btn btn-sm btn-secondary"
            title="Refresh analytics telemetry"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
          </button>

          {/* Export / Digest Button */}
          <button
            onClick={() => setIsDigestOpen(true)}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(232, 163, 61, 0.4)' }}
          >
            <Zap size={13} color="var(--accent)" />
            <span>Executive Briefing</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
          <p className="mono" style={{ fontSize: '0.85rem' }}>Aggregating multi-pillar cognitive telemetry...</p>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* =========================================================================
              HERO COGNITIVE MOMENTUM HUD
             ========================================================================= */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(24, 30, 38, 0.95), rgba(14, 18, 23, 0.98))',
              border: '1px solid rgba(232, 163, 61, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 28px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Ambient Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '240px',
                height: '240px',
                background: 'radial-gradient(circle, rgba(232, 163, 61, 0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.4fr) minmax(220px, 0.9fr)',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              {/* Radial Gauge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background Track */}
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="10"
                    />
                    {/* Active Progress */}
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      fill="transparent"
                      stroke="url(#momentumGradient)"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                    <defs>
                      <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e8a33d" />
                        <stop offset="100%" stopColor="#5fa8a0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner Text */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent)' }}>
                      {data.momentumIndex}
                    </span>
                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      / 100
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(232, 163, 61, 0.15)',
                        border: '1px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent)',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {data.momentumGrade}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Cognitive Momentum
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-bright)', letterSpacing: '-0.01em' }}>
                    {data.momentumStatus}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Weighted composite rollup across 4 key operational pillars.
                  </p>
                </div>
              </div>

              {/* Pillar Quick Readout Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(data.pillars).map(([key, pillar]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: '500' }}>
                        {pillar.title}
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                        {pillar.score}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pillar.score}%`,
                          background:
                            pillar.score >= 70
                              ? 'linear-gradient(90deg, #e8a33d, #5fa8a0)'
                              : pillar.score >= 40
                              ? '#e8a33d'
                              : '#e06c75',
                          borderRadius: '3px',
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Streak & Velocity Highlights */}
              <div
                style={{
                  borderLeft: '1px solid var(--border)',
                  paddingLeft: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flame size={12} color="#e8a33d" />
                    <span>EXECUTION STREAK</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'monospace' }}>
                    {data.streakDays} Days
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Active daily ledger commitment
                  </div>
                </div>

                <div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    WEEKLY SOLVED RATE
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-2)', fontFamily: 'monospace' }}>
                    {data.leetcodeStats.weeklySolvedRate} / wk
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    DSA technical problem pace
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              THE 4 PILLAR COMMAND CARDS
             ========================================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Pillar 1: Engineering */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'rgba(95, 168, 160, 0.12)', borderRadius: 'var(--radius-sm)' }}>
                      <Code size={16} color="var(--accent-2)" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-bright)' }}>
                      Engineering & DSA
                    </span>
                  </div>
                  <span className="badge badge-accent2 mono" style={{ fontSize: '0.7rem' }}>
                    30% WEIGHT
                  </span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'monospace', margin: '8px 0 4px' }}>
                  {data.leetcodeStats.totalSolved} Solved
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {data.leetcodeStats.easyCount} Easy · {data.leetcodeStats.mediumCount} Medium · {data.leetcodeStats.hardCount} Hard
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Pillar Score: <strong style={{ color: 'var(--accent-2)' }}>{data.pillars.engineering.score}/100</strong>
                </span>
                <Link to="/leetcode" className="btn btn-xs btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                  <span>Inspect</span>
                  <ChevronRight size={10} />
                </Link>
              </div>
            </div>

            {/* Pillar 2: Career & Pipeline */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'rgba(232, 163, 61, 0.12)', borderRadius: 'var(--radius-sm)' }}>
                      <Briefcase size={16} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-bright)' }}>
                      Career & Funnel
                    </span>
                  </div>
                  <span className="badge badge-accent mono" style={{ fontSize: '0.7rem' }}>
                    25% WEIGHT
                  </span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'monospace', margin: '8px 0 4px' }}>
                  {data.jobStats.funnelConversionRate}% Rate
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {data.jobStats.totalApplied} applied · {data.jobStats.activeApplications} active · {data.jobStats.interviewsScheduled} interviews
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Pillar Score: <strong style={{ color: 'var(--accent)' }}>{data.pillars.career.score}/100</strong>
                </span>
                <Link to="/job-pipeline" className="btn btn-xs btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                  <span>Pipeline</span>
                  <ChevronRight size={10} />
                </Link>
              </div>
            </div>

            {/* Pillar 3: Thought Leadership */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'rgba(163, 122, 204, 0.12)', borderRadius: 'var(--radius-sm)' }}>
                      <Share2 size={16} color="#a37acc" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-bright)' }}>
                      Thought Leadership
                    </span>
                  </div>
                  <span className="badge mono" style={{ fontSize: '0.7rem', color: '#a37acc', borderColor: '#a37acc' }}>
                    20% WEIGHT
                  </span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'monospace', margin: '8px 0 4px' }}>
                  {data.linkedinStats.totalImpressions.toLocaleString()} Views
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {data.linkedinStats.publishedCount} published · {data.linkedinStats.scheduledCount} queued · {data.linkedinStats.avgEngagementRate}% eng
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Pillar Score: <strong style={{ color: '#a37acc' }}>{data.pillars.thoughtLeadership.score}/100</strong>
                </span>
                <Link to="/linkedin" className="btn btn-xs btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                  <span>Content</span>
                  <ChevronRight size={10} />
                </Link>
              </div>
            </div>

            {/* Pillar 4: Daily Execution */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'rgba(224, 108, 117, 0.12)', borderRadius: 'var(--radius-sm)' }}>
                      <Activity size={16} color="#e06c75" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-bright)' }}>
                      Execution & Ledger
                    </span>
                  </div>
                  <span className="badge mono" style={{ fontSize: '0.7rem', color: '#e06c75', borderColor: '#e06c75' }}>
                    25% WEIGHT
                  </span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'monospace', margin: '8px 0 4px' }}>
                  {data.activityStats.rangeCount} Entries
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Avg {data.activityStats.dailyAverage}/day · {data.streakDays} day streak
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Pillar Score: <strong style={{ color: '#e06c75' }}>{data.pillars.execution.score}/100</strong>
                </span>
                <Link to="/activity-log" className="btn btn-xs btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                  <span>Ledger</span>
                  <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================================
              MULTI-AXIS TIME-SERIES VELOCITY CHART
             ========================================================================= */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
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
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-bright)' }}>
                  Operational Velocity & Output Timeline
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Daily cadence across engineering tasks, LeetCode solutions, job pipeline, and content publishing.
                </p>
              </div>

              {/* Chart Layer Toggles */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'Composite', color: 'var(--accent)' },
                  { id: 'activities', label: 'Activities', color: '#e06c75' },
                  { id: 'leetcode', label: 'LeetCode', color: 'var(--accent-2)' },
                  { id: 'jobs', label: 'Job Apps', color: '#e8a33d' },
                  { id: 'linkedin', label: 'LinkedIn', color: '#a37acc' },
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id as any)}
                    style={{
                      background: selectedLayer === layer.id ? 'var(--surface-hover)' : 'transparent',
                      color: selectedLayer === layer.id ? layer.color : 'var(--text-muted)',
                      border: `1px solid ${selectedLayer === layer.id ? layer.color : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: layer.color,
                      }}
                    />
                    <span>{layer.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) * (1 - ratio);
                  const val = Math.round(ratio * maxChartVal);
                  return (
                    <g key={ratio}>
                      <line
                        x1={chartPadding.left}
                        y1={y}
                        x2={chartWidth - chartPadding.right}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartPadding.left - 8}
                        y={y + 3}
                        fill="var(--text-muted)"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Date Labels */}
                {timeline.map((point, idx) => {
                  if (timeline.length > 15 && idx % Math.ceil(timeline.length / 8) !== 0) return null;
                  const x = getX(idx);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartHeight - 10}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {point.date}
                    </text>
                  );
                })}

                {/* Shaded Areas */}
                {(selectedLayer === 'all' || selectedLayer === 'activities') && (
                  <path
                    d={generateAreaPath('activities')}
                    fill="rgba(224, 108, 117, 0.06)"
                  />
                )}
                {(selectedLayer === 'all' || selectedLayer === 'leetcode') && (
                  <path
                    d={generateAreaPath('leetcodeSolved')}
                    fill="rgba(95, 168, 160, 0.08)"
                  />
                )}

                {/* Line Paths */}
                {(selectedLayer === 'all' || selectedLayer === 'activities') && (
                  <path
                    d={generateLinePath('activities')}
                    fill="none"
                    stroke="#e06c75"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {(selectedLayer === 'all' || selectedLayer === 'leetcode') && (
                  <path
                    d={generateLinePath('leetcodeSolved')}
                    fill="none"
                    stroke="var(--accent-2)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {(selectedLayer === 'all' || selectedLayer === 'jobs') && (
                  <path
                    d={generateLinePath('jobApplications')}
                    fill="none"
                    stroke="#e8a33d"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                  />
                )}
                {(selectedLayer === 'all' || selectedLayer === 'linkedin') && (
                  <path
                    d={generateLinePath('linkedinPosts')}
                    fill="none"
                    stroke="#a37acc"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points & Interactive Hover Circles */}
                {timeline.map((point, idx) => {
                  const x = getX(idx);
                  const isHovered = hoveredPoint === idx;

                  return (
                    <g key={idx}>
                      {/* Invisible hover trigger column */}
                      <rect
                        x={x - (chartWidth / Math.max(1, timeline.length)) / 2}
                        y={chartPadding.top}
                        width={chartWidth / Math.max(1, timeline.length)}
                        height={chartHeight - chartPadding.top - chartPadding.bottom}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint(idx)}
                      />

                      {/* Hover Indicator Line */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={chartPadding.top}
                          x2={x}
                          y2={chartHeight - chartPadding.bottom}
                          stroke="rgba(232, 163, 61, 0.4)"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Small point dots */}
                      {isHovered && (
                        <>
                          <circle cx={x} cy={getY(point.activities)} r="4" fill="#e06c75" />
                          <circle cx={x} cy={getY(point.leetcodeSolved)} r="4.5" fill="var(--accent-2)" />
                          <circle cx={x} cy={getY(point.jobApplications)} r="4" fill="#e8a33d" />
                          <circle cx={x} cy={getY(point.linkedinPosts)} r="4" fill="#a37acc" />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Popup - Boundary Clamped */}
              {hoveredPoint !== null && timeline[hoveredPoint] && (
                (() => {
                  const pct = (hoveredPoint / Math.max(1, timeline.length - 1)) * 100;
                  const transform =
                    pct > 75 ? 'translateX(-100%)' : pct < 25 ? 'translateX(0%)' : 'translateX(-50%)';
                  const left = pct > 75 ? `${pct - 2}%` : pct < 25 ? `${pct + 2}%` : `${pct}%`;

                  return (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left,
                        transform,
                        background: '#12161c',
                        border: '1px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        minWidth: '180px',
                        maxWidth: '240px',
                      }}
                    >
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '4px' }}>
                        📅 {timeline[hoveredPoint].date}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.7rem' }}>
                        <span style={{ color: '#e06c75' }}>Activities: <strong>{timeline[hoveredPoint].activities}</strong></span>
                        <span style={{ color: 'var(--accent-2)' }}>LeetCode: <strong>{timeline[hoveredPoint].leetcodeSolved}</strong></span>
                        <span style={{ color: '#e8a33d' }}>Job Apps: <strong>{timeline[hoveredPoint].jobApplications}</strong></span>
                        <span style={{ color: '#a37acc' }}>LinkedIn: <strong>{timeline[hoveredPoint].linkedinPosts}</strong></span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* =========================================================================
              DEEP-DIVE SUBSYSTEM ANALYTICS (3 COLUMNS)
             ========================================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Subsystem 1: Activity Category Breakdown */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                Activity Category Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(data.activityStats.byCategory).map(([cat, count]) => {
                  const total = Math.max(1, data.activityStats.rangeCount);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{cat}</span>
                        <span className="mono" style={{ color: 'var(--text-muted)' }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--accent)',
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subsystem 2: Job Pipeline Conversion Funnel */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                Career Funnel Conversion
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Total Submitted', count: data.jobStats.totalApplied, pct: 100, color: 'var(--text-muted)' },
                  { label: 'Active in Process', count: data.jobStats.activeApplications, pct: data.jobStats.totalApplied ? Math.round((data.jobStats.activeApplications / data.jobStats.totalApplied) * 100) : 0, color: 'var(--accent)' },
                  { label: 'Interviews Scheduled', count: data.jobStats.interviewsScheduled, pct: data.jobStats.totalApplied ? Math.round((data.jobStats.interviewsScheduled / data.jobStats.totalApplied) * 100) : 0, color: 'var(--accent-2)' },
                  { label: 'Offers Extended', count: data.jobStats.offersReceived, pct: data.jobStats.totalApplied ? Math.round((data.jobStats.offersReceived / data.jobStats.totalApplied) * 100) : 0, color: '#a37acc' },
                ].map((step) => (
                  <div key={step.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>{step.label}</span>
                      <span className="mono" style={{ color: step.color }}>
                        {step.count} ({step.pct}%)
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${step.pct}%`,
                          background: step.color,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsystem 3: LeetCode Difficulty Ratios */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                DSA Mastery Difficulty Ratios
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Easy (Fundamentals)', count: data.leetcodeStats.easyCount, color: 'var(--accent-2)', total: Math.max(1, data.leetcodeStats.totalSolved) },
                  { label: 'Medium (Core System & Algo)', count: data.leetcodeStats.mediumCount, color: 'var(--accent)', total: Math.max(1, data.leetcodeStats.totalSolved) },
                  { label: 'Hard (Advanced Optimization)', count: data.leetcodeStats.hardCount, color: '#e06c75', total: Math.max(1, data.leetcodeStats.totalSolved) },
                ].map((diff) => {
                  const pct = Math.round((diff.count / diff.total) * 100);
                  return (
                    <div key={diff.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-main)' }}>{diff.label}</span>
                        <span className="mono" style={{ color: diff.color }}>
                          {diff.count} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: diff.color,
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* =========================================================================
          EXECUTIVE BRIEFING / DIGEST SNAPSHOT MODAL
         ========================================================================= */}
      {isDigestOpen && data && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#12161c',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-bright)' }}>
                  Executive Briefing & Performance Digest
                </h3>
              </div>
              <button
                onClick={() => setIsDigestOpen(false)}
                className="btn btn-xs btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <pre
                className="mono"
                style={{
                  background: '#0a0d12',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  lineHeight: '1.5',
                  color: 'var(--text-bright)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {generateDigestText()}
              </pre>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: '#0e1217',
              }}
            >
              <button
                onClick={() => setIsDigestOpen(false)}
                className="btn btn-sm btn-secondary"
              >
                Close
              </button>
              <button
                onClick={handleCopyDigest}
                className="btn btn-sm btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedDigest ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedDigest ? 'Copied to Clipboard!' : 'Copy Briefing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
