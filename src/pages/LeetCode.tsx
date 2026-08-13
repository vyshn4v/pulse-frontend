import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Code2,
  ExternalLink,
  Edit3,
  Trash2,
  FileText,
  X,
  CheckCircle2,
  User,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Percent,
  Check,
  Flame,
  AlertCircle,
  Calendar as CalendarIcon,
  Activity,
  Layers,
  Terminal,
  Trophy,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

interface LeetCodeSubmissionItem {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: ProblemDifficulty;
  status: string;
  language: string;
  timestamp: string;
  notes?: string;
  topics: string[];
  createdAt: string;
}

interface LeetCodeScrapedProfileStats {
  username: string;
  realName?: string;
  avatarUrl?: string;
  ranking?: number | null;
  reputation?: number;
  countryName?: string;
  company?: string;
  school?: string;
  aboutMe?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  // Contest stats
  contestRating?: number | null;
  contestGlobalRanking?: number | null;
  contestTopPercentage?: number | null;
  contestsAttended?: number;
  contestBadge?: string | null;
  // Problems
  totalQuestions: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  totalSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  acceptanceRate: number;
  easyAcceptanceRate?: number;
  mediumAcceptanceRate?: number;
  hardAcceptanceRate?: number;
  // Skills & Languages
  skills: {
    fundamental: Array<{ name: string; slug: string; count: number }>;
    intermediate: Array<{ name: string; slug: string; count: number }>;
    advanced: Array<{ name: string; slug: string; count: number }>;
  };
  languages: Array<{ language: string; count: number }>;
  badges: Array<{ id: string; name: string; icon: string; displayName?: string; category?: string }>;
  // Calendar
  activeDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  totalSubmissionsCount: number;
  submissionCalendar: Record<string, number>;
  topTopics: Array<{ topic: string; count: number }>;
  recentSubmissions: LeetCodeSubmissionItem[];
  lastScrapedAt?: string | null;
}

const DIFFICULTY_CONFIG: Record<
  ProblemDifficulty,
  { label: string; color: string; bg: string; border: string }
> = {
  Easy: {
    label: 'Easy',
    color: '#5FA8A0',
    bg: 'rgba(95, 168, 160, 0.12)',
    border: 'rgba(95, 168, 160, 0.35)',
  },
  Medium: {
    label: 'Medium',
    color: '#E8A33D',
    bg: 'rgba(232, 163, 61, 0.12)',
    border: 'rgba(232, 163, 61, 0.35)',
  },
  Hard: {
    label: 'Hard',
    color: '#D66A5F',
    bg: 'rgba(214, 106, 95, 0.12)',
    border: 'rgba(214, 106, 95, 0.35)',
  },
};

export const LeetCode: React.FC = () => {
  const [stats, setStats] = useState<LeetCodeScrapedProfileStats | null>(null);
  const [submissions, setSubmissions] = useState<LeetCodeSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Active skill tab
  const [activeSkillTab, setActiveSkillTab] = useState<'all' | 'fundamental' | 'intermediate' | 'advanced'>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | ProblemDifficulty>('all');

  // Notes Modal
  const [editingNoteItem, setEditingNoteItem] = useState<LeetCodeSubmissionItem | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Quick Handle Link State
  const [quickHandle, setQuickHandle] = useState('');
  const [savingQuickHandle, setSavingQuickHandle] = useState(false);

  // Heatmap tooltip state
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, subsRes] = await Promise.all([
        fetch('/api/leetcode/stats', { credentials: 'include' }),
        fetch('/api/leetcode/submissions', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setQuickHandle(statsData.username || '');
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissions(Array.isArray(subsData) ? subsData : []);
      }
    } catch (err) {
      console.error('Failed to fetch LeetCode data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeProfile = async (targetUser?: string) => {
    const handleToScrape = targetUser || stats?.username || quickHandle;
    if (!handleToScrape?.trim()) {
      setFeedback({ msg: 'Please enter a LeetCode handle first.', type: 'error' });
      return;
    }

    try {
      setScraping(true);
      setFeedback(null);
      const res = await fetch('/api/leetcode/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: handleToScrape.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ msg: data.message || 'Complete LeetCode telemetry scraped successfully.', type: 'success' });
        fetchData();
      } else {
        setFeedback({ msg: data.message || 'Failed to scrape LeetCode profile.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ msg: 'Network error while connecting to LeetCode scraper.', type: 'error' });
    } finally {
      setScraping(false);
    }
  };

  const handleSaveQuickHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHandle.trim()) return;

    setSavingQuickHandle(true);
    try {
      const res = await fetch('/api/leetcode/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: quickHandle.trim() }),
      });
      if (res.ok) {
        handleScrapeProfile(quickHandle.trim());
      }
    } catch (err) {
      console.error('Failed to save handle:', err);
    } finally {
      setSavingQuickHandle(false);
    }
  };

  const handleOpenNoteEditor = (item: LeetCodeSubmissionItem) => {
    setEditingNoteItem(item);
    setNoteContent(item.notes || '');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteItem) return;

    try {
      const res = await fetch(`/api/leetcode/${editingNoteItem.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: noteContent.trim() }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === editingNoteItem.id ? { ...s, notes: noteContent.trim() } : s)),
        );
        setEditingNoteItem(null);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (!window.confirm('Remove this problem submission record?')) return;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/leetcode/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete submission:', err);
      fetchData();
    }
  };

  // Build 52-week daily calendar grid
  const calendarGrid = useMemo(() => {
    const calendar = stats?.submissionCalendar || {};
    const weeks: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (52 * 7) + (6 - today.getDay()));

    let curr = new Date(startDate);
    let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];

    while (curr <= today) {
      const dateStr = curr.toISOString().slice(0, 10);
      const count = calendar[dateStr] || 0;
      const dayOfWeek = curr.getDay();

      currentWeek.push({ date: dateStr, count, dayOfWeek });

      if (dayOfWeek === 6 || curr.getTime() === today.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [stats?.submissionCalendar]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      if (selectedDifficulty !== 'all' && item.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase())
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSlug = item.titleSlug.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesLang = item.language.toLowerCase().includes(q);
        const matchesTopic = item.topics.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSlug && !matchesNotes && !matchesLang && !matchesTopic)
          return false;
      }
      return true;
    });
  }, [submissions, selectedDifficulty, searchQuery]);

  const total = stats?.totalSolved || submissions.length;
  const easy = stats?.easyCount || submissions.filter((s) => s.difficulty === 'Easy').length;
  const med = stats?.mediumCount || submissions.filter((s) => s.difficulty === 'Medium').length;
  const hard = stats?.hardCount || submissions.filter((s) => s.difficulty === 'Hard').length;

  const totalEasyQ = stats?.totalEasy || 830;
  const totalMedQ = stats?.totalMedium || 1740;
  const totalHardQ = stats?.totalHard || 760;

  const easyProgress = Math.min(100, Math.round((easy / totalEasyQ) * 100));
  const medProgress = Math.min(100, Math.round((med / totalMedQ) * 100));
  const hardProgress = Math.min(100, Math.round((hard / totalHardQ) * 100));

  const profileUrl = stats?.username ? `https://leetcode.com/u/${stats.username}/` : null;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#12161c';
    if (count <= 2) return 'rgba(232, 163, 61, 0.3)';
    if (count <= 5) return 'rgba(232, 163, 61, 0.65)';
    return '#E8A33D';
  };

  // Skill tags filtered by tab
  const displayedSkills = useMemo(() => {
    if (!stats?.skills) return [];
    if (activeSkillTab === 'fundamental') return stats.skills.fundamental || [];
    if (activeSkillTab === 'intermediate') return stats.skills.intermediate || [];
    if (activeSkillTab === 'advanced') return stats.skills.advanced || [];
    return [
      ...(stats.skills.fundamental || []),
      ...(stats.skills.intermediate || []),
      ...(stats.skills.advanced || []),
    ].sort((a, b) => b.count - a.count);
  }, [stats?.skills, activeSkillTab]);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Algorithmic Scraper Engine & Full Telemetry</p>
            <h2>LeetCode & DSA Intelligence</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/me" className="btn btn-sm btn-secondary" title="Configure in Me Profile">
            <User size={13} color="var(--accent)" />
            <span>Me Profile</span>
          </Link>

          {/* Trigger Profile Scrape */}
          <button
            onClick={() => handleScrapeProfile()}
            disabled={scraping || !stats?.username}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Scrape and extract complete profile telemetry"
          >
            <RefreshCw size={14} className={scraping ? 'spin-icon' : ''} />
            <span>{scraping ? 'Scraping Telemetry...' : 'Scrape Full Profile'}</span>
          </button>
        </div>
      </div>

      {/* Sync / Scraper Feedback */}
      {feedback && (
        <div
          className={`auth-banner ${feedback.type === 'success' ? 'success' : 'failed'}`}
          style={{ margin: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.msg}</span>
          </div>
        </div>
      )}

      {/* Scraper Handle Setup Box if No Username */}
      {!stats?.username && (
        <div
          className="panel"
          style={{
            border: '1px solid rgba(232, 163, 61, 0.4)',
            backgroundColor: 'rgba(232, 163, 61, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent)' }}>Connect Your LeetCode Handle</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            PULSE scrapes your public LeetCode profile, daily commit calendar, tiered skill tree, contest rankings, and problem history automatically. Enter your handle below or in your{' '}
            <Link to="/me" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Me Profile
            </Link>.
          </p>

          <form onSubmit={handleSaveQuickHandle} style={{ display: 'flex', gap: '10px', maxWidth: '440px' }}>
            <input
              type="text"
              required
              placeholder="e.g. vyshnavpc or https://leetcode.com/u/vyshnavpc/"
              value={quickHandle}
              onChange={(e) => setQuickHandle(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={savingQuickHandle}>
              {savingQuickHandle ? 'Connecting...' : 'Scrape Now'}
            </button>
          </form>
        </div>
      )}

      {/* Scraped Public Profile Header & Contest Card */}
      {stats?.username && (
        <div
          className="panel"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            backgroundColor: '#12161c',
            border: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          {/* Identity & Social Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {stats.avatarUrl ? (
              <img
                src={stats.avatarUrl}
                alt={stats.username}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: 'var(--accent)',
                  fontFamily: 'Space Grotesk',
                }}
              >
                {stats.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {stats.realName || `@${stats.username}`}
                </h3>
                {profileUrl && (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                    className="mono"
                  >
                    <span>@{stats.username}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Bio Details */}
              <div style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', flexWrap: 'wrap' }}>
                {stats.company && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} color="var(--accent)" /> {stats.company}
                  </span>
                )}
                {stats.school && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GraduationCap size={12} color="var(--accent-2)" /> {stats.school}
                  </span>
                )}
                {stats.countryName && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={12} /> {stats.countryName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contest & Global Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {stats.contestRating ? (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(232, 163, 61, 0.08)',
                  border: '1px solid rgba(232, 163, 61, 0.3)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
                  <Trophy size={12} /> Contest Rating
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                  {stats.contestRating} {stats.contestBadge && `(${stats.contestBadge})`}
                </div>
                {stats.contestTopPercentage && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Top {stats.contestTopPercentage.toFixed(1)}%
                  </div>
                )}
              </div>
            ) : null}

            {stats.ranking && (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
                  Global Rank
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                  #{stats.ranking.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {stats.reputation || 0} reputation
                </div>
              </div>
            )}

            {stats.acceptanceRate > 0 && (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
                  Acceptance Rate
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>
                  {stats.acceptanceRate}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {stats.totalSubmissionsCount || 0} total submissions
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 KPI Gauges */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Total Solved</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">Across Easy, Med & Hard</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Easy Solved</div>
          <div className="stat-value" style={{ color: DIFFICULTY_CONFIG.Easy.color }}>
            {easy}
          </div>
          <div className="stat-sub">{easyProgress}% of {totalEasyQ} LeetCode Easy</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Medium Solved</div>
          <div className="stat-value" style={{ color: DIFFICULTY_CONFIG.Medium.color }}>
            {med}
          </div>
          <div className="stat-sub">{medProgress}% of {totalMedQ} LeetCode Med</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Hard Solved</div>
          <div className="stat-value" style={{ color: DIFFICULTY_CONFIG.Hard.color }}>
            {hard}
          </div>
          <div className="stat-sub">{hardProgress}% of {totalHardQ} LeetCode Hard</div>
        </div>
      </div>

      {/* Daily Commit & Practice Heatmap Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent)" />
            <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Daily Submissions & Practice Heatmap
            </span>
          </div>

          {/* Streak & Consistency Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>
              <Flame size={14} color="#E8A33D" />
              <span style={{ color: 'var(--text-muted)' }}>CURRENT STREAK:</span>
              <span style={{ fontWeight: 700, color: '#E8A33D' }}>{stats?.currentStreak || 0}d</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>
              <Zap size={14} color="var(--accent-2)" />
              <span style={{ color: 'var(--text-muted)' }}>LONGEST STREAK:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-2)' }}>{stats?.longestStreak || 0}d</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>
              <CalendarIcon size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>ACTIVE DAYS:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.activeDaysCount || 0}</span>
            </div>
          </div>
        </div>

        {/* 52-Week Matrix Grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
          <div style={{ display: 'inline-flex', gap: '3px', minWidth: '700px' }}>
            {calendarGrid.map((week, wIdx) => (
              <div key={`w-${wIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }).map((_, dIdx) => {
                  const dayData = week.find((d) => d.dayOfWeek === dIdx);
                  if (!dayData) {
                    return (
                      <div
                        key={`empty-${dIdx}`}
                        style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'transparent' }}
                      />
                    );
                  }

                  const bgColor = getHeatmapColor(dayData.count);

                  return (
                    <div
                      key={dayData.date}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          date: dayData.date,
                          count: dayData.count,
                          x: rect.left + window.scrollX,
                          y: rect.top + window.scrollY - 30,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: bgColor,
                        border: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'transform 100ms ease',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            <span>Less</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#12161c', border: '1px solid var(--border)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(232, 163, 61, 0.3)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(232, 163, 61, 0.65)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#E8A33D' }} />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip for Heatmap */}
      {hoveredCell && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#161B22',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.72rem',
            fontFamily: 'JetBrains Mono',
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <strong>{hoveredCell.count} submissions</strong> on {hoveredCell.date}
        </div>
      )}

      {/* 2-Column Grid: Difficulty Progress + Languages & Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Difficulty Breakdown */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px' }}>
          <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Difficulty Coverage & Acceptance
          </span>

          {/* Easy Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: DIFFICULTY_CONFIG.Easy.color, fontWeight: 600 }}>Easy Problems</span>
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {easy} / {totalEasyQ} ({easyProgress}%)
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${easyProgress}%`, height: '100%', backgroundColor: DIFFICULTY_CONFIG.Easy.color }} />
            </div>
          </div>

          {/* Medium Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: DIFFICULTY_CONFIG.Medium.color, fontWeight: 600 }}>Medium Problems</span>
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {med} / {totalMedQ} ({medProgress}%)
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${medProgress}%`, height: '100%', backgroundColor: DIFFICULTY_CONFIG.Medium.color }} />
            </div>
          </div>

          {/* Hard Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: DIFFICULTY_CONFIG.Hard.color, fontWeight: 600 }}>Hard Problems</span>
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {hard} / {totalHardQ} ({hardProgress}%)
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${hardProgress}%`, height: '100%', backgroundColor: DIFFICULTY_CONFIG.Hard.color }} />
            </div>
          </div>
        </div>

        {/* Languages & Badges Card */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
          <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Language Proficiency & Badges
          </span>

          {/* Languages solved */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: '8px' }}>
              SOLVED LANGUAGES:
            </div>
            {stats?.languages && stats.languages.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {stats.languages.map((l) => (
                  <span
                    key={l.language}
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Terminal size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {l.language} <span style={{ color: 'var(--accent)', fontWeight: 700 }}>({l.count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Languages telemetry indexed during sync.</span>
            )}
          </div>

          {/* Badges */}
          {stats?.badges && stats.badges.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: '8px' }}>
                SCRAPED BADGES ({stats.badges.length}):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {stats.badges.map((b) => (
                  <div
                    key={b.id || b.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    {b.icon ? (
                      <img src={b.icon} alt={b.name} style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <Award size={14} color="var(--accent)" />
                    )}
                    <span>{b.displayName || b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tiered Skill Tree & Topic Breakdown */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent)" />
            <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Algorithmic Skill Tree & Concept Mastery
            </span>
          </div>

          {/* Tab Filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'fundamental', 'intermediate', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSkillTab(tab)}
                className={`btn btn-sm ${activeSkillTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Tags Cloud */}
        {displayedSkills.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {displayedSkills.map((s) => (
              <span
                key={s.name}
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{s.name}</span>
                <span
                  style={{
                    backgroundColor: 'rgba(232, 163, 61, 0.15)',
                    color: 'var(--accent)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                >
                  {s.count}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Skill domains will be indexed upon your next live profile scrape.
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="panel" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search problems, takeaways, optimal strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        {/* Difficulty Filter Chips */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {(['all', 'Easy', 'Medium', 'Hard'] as Array<'all' | ProblemDifficulty>).map((diff) => {
            const isSel = selectedDifficulty === diff;
            const conf = diff !== 'all' ? DIFFICULTY_CONFIG[diff] : null;

            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.75rem',
                  color: isSel ? '#12161C' : conf ? conf.color : 'inherit',
                }}
              >
                {diff === 'all' ? 'All Difficulties' : diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scraped Submissions Ledger / Table */}
      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING LEETCODE TELEMETRY...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <Code2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No problems scraped yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Click "Scrape Full Profile" to automatically import your solved problem history.
          </p>
          <button onClick={() => handleScrapeProfile()} disabled={scraping} className="btn btn-primary">
            <RefreshCw size={14} className={scraping ? 'spin-icon' : ''} />
            <span>{scraping ? 'Scraping Telemetry...' : 'Scrape LeetCode Profile'}</span>
          </button>
        </div>
      ) : (
        <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#0e1217', color: 'var(--text-muted)', fontFamily: 'Space Grotesk', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Problem Title</th>
                <th style={{ padding: '12px 16px' }}>Difficulty</th>
                <th style={{ padding: '12px 16px' }}>Language</th>
                <th style={{ padding: '12px 16px' }}>Solved Date</th>
                <th style={{ padding: '12px 16px' }}>Key Notes / Takeaway</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((item) => {
                const diffConf = DIFFICULTY_CONFIG[item.difficulty] || DIFFICULTY_CONFIG.Medium;
                const leetcodeUrl = `https://leetcode.com/problems/${item.titleSlug}/`;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                    {/* Problem Title & Direct Link */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                        <a
                          href={leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open problem on LeetCode"
                          style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                          className="hover-accent"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>

                    {/* Difficulty Badge */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: diffConf.bg,
                          border: `1px solid ${diffConf.border}`,
                          color: diffConf.color,
                          fontWeight: 600,
                        }}
                      >
                        {item.difficulty}
                      </span>
                    </td>

                    {/* Language */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                      {item.language || 'Python3'}
                    </td>

                    {/* Solved Date */}
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </td>

                    {/* Key Notes / Takeaways */}
                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      {item.notes ? (
                        <div
                          onClick={() => handleOpenNoteEditor(item)}
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--accent)',
                            fontFamily: 'JetBrains Mono',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.notes}
                        >
                          "{item.notes}"
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenNoteEditor(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                        >
                          + Add Note
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenNoteEditor(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Edit Takeaway Notes"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(item.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px', color: 'var(--danger)' }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes / Takeaway Editor Modal */}
      {editingNoteItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setEditingNoteItem(null)}
        >
          <div
            className="panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '1.05rem' }}>Notes: {editingNoteItem.title}</h3>
              </div>
              <button onClick={() => setEditingNoteItem(null)} className="btn btn-sm btn-secondary" style={{ padding: '4px' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Optimal Strategy / Time Complexity / Key Gotchas
                </label>
                <textarea
                  rows={4}
                  autoFocus
                  placeholder="e.g. O(N) Two-Pointer approach. Edge case: handle duplicate numbers by skipping while nums[i] == nums[i-1]..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingNoteItem(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
