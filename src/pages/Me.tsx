import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  User,
  Target,
  Sliders,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Code,
  Globe,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const FOCUS_DOMAINS = [
  { id: 'dsa', label: 'LeetCode & DSA Mastery', desc: 'Algorithm patterns, hard problem sprints' },
  { id: 'system_design', label: 'High-Scale Architecture', desc: 'Distributed systems, concurrency, DB scaling' },
  { id: 'job_pipeline', label: 'Job Search & Pipeline', desc: 'Recruiter reachouts, interview preparation, offers' },
  { id: 'executive_presence', label: 'Executive Presence & Comms', desc: 'Technical articulation, leadership voice' },
  { id: 'linkedin_content', label: 'Technical Writing & Social', desc: 'LinkedIn / Medium engineering articles' },
  { id: 'daily_habits', label: 'Daily Execution & Habits', desc: 'Deep work blocks, fitness, consistency ledger' },
];

interface MeProfileData {
  id?: number;
  whoAmI: string;
  goals: string;
  leetcodeHandle: string;
  githubHandle: string;
  linkedinUrl: string;
  brainBehaviorPrefs: {
    sprintStyle?: 'aggressive' | 'balanced' | 'sustainable';
    focusDomains: string[];
    primaryFocus?: string;
    tone?: 'direct' | 'encouraging' | 'analytical';
    dailyTaskCap?: number;
    externalHandles?: {
      leetcode?: string;
      github?: string;
      linkedin?: string;
    };
  };
  updatedAt?: string;
}

export const Me: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<MeProfileData>({
    whoAmI: '',
    goals: '',
    leetcodeHandle: '',
    githubHandle: '',
    linkedinUrl: '',
    brainBehaviorPrefs: {
      sprintStyle: 'balanced',
      focusDomains: ['dsa', 'system_design', 'job_pipeline', 'executive_presence'],
      primaryFocus: 'dsa',
      tone: 'direct',
      dailyTaskCap: 3,
      externalHandles: {
        leetcode: '',
        github: '',
        linkedin: '',
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const existingPrefs = data.brainBehaviorPrefs || {};
        const ext = existingPrefs.externalHandles || {};

        // Parse focusDomains with backwards compatibility
        let loadedDomains: string[] = [];
        if (Array.isArray(existingPrefs.focusDomains) && existingPrefs.focusDomains.length > 0) {
          loadedDomains = existingPrefs.focusDomains;
        } else if (existingPrefs.primaryFocus) {
          loadedDomains = [existingPrefs.primaryFocus];
        } else {
          loadedDomains = ['dsa', 'system_design', 'job_pipeline', 'executive_presence'];
        }

        const leetcode = data.user?.leetcodeUsername || ext.leetcode || '';

        setProfile({
          whoAmI: data.whoAmI || '',
          goals: data.goals || '',
          leetcodeHandle: leetcode,
          githubHandle: ext.github || '',
          linkedinUrl: ext.linkedin || '',
          brainBehaviorPrefs: {
            sprintStyle: existingPrefs.sprintStyle || 'balanced',
            focusDomains: loadedDomains,
            primaryFocus: loadedDomains[0] || 'dsa',
            tone: existingPrefs.tone || 'direct',
            dailyTaskCap: existingPrefs.dailyTaskCap || 3,
            externalHandles: {
              leetcode,
              github: ext.github || '',
              linkedin: ext.linkedin || '',
            },
          },
          updatedAt: data.updatedAt,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFocusDomain = (domainId: string) => {
    const current = profile.brainBehaviorPrefs.focusDomains || [];
    let updated: string[];
    if (current.includes(domainId)) {
      if (current.length === 1) return;
      updated = current.filter((id) => id !== domainId);
    } else {
      updated = [...current, domainId];
    }

    setProfile({
      ...profile,
      brainBehaviorPrefs: {
        ...profile.brainBehaviorPrefs,
        focusDomains: updated,
        primaryFocus: updated[0] || 'dsa',
      },
    });
  };

  const toggleSelectAllDomains = () => {
    const allIds = FOCUS_DOMAINS.map((d) => d.id);
    const current = profile.brainBehaviorPrefs.focusDomains || [];
    const isAllSelected = current.length === FOCUS_DOMAINS.length;

    const updated = isAllSelected ? [FOCUS_DOMAINS[0].id] : allIds;

    setProfile({
      ...profile,
      brainBehaviorPrefs: {
        ...profile.brainBehaviorPrefs,
        focusDomains: updated,
        primaryFocus: updated[0] || 'dsa',
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    const cleanLeetcode = profile.leetcodeHandle
      .trim()
      .replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, '')
      .replace(/\/.*$/, '');

    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          whoAmI: profile.whoAmI,
          goals: profile.goals,
          leetcodeUsername: cleanLeetcode,
          brainBehaviorPrefs: {
            ...profile.brainBehaviorPrefs,
            primaryFocus: profile.brainBehaviorPrefs.focusDomains[0] || 'dsa',
            externalHandles: {
              leetcode: cleanLeetcode,
              github: profile.githubHandle.trim(),
              linkedin: profile.linkedinUrl.trim(),
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({
          ...prev,
          leetcodeHandle: cleanLeetcode,
          updatedAt: data.updatedAt,
        }));
        setToast({ type: 'success', message: 'Profile, LeetCode handle, and Multi-Domain AI preferences saved.' });
        setTimeout(() => setToast(null), 4000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setToast({
          type: 'error',
          message: errJson.message || 'Failed to update profile. Please ensure you are logged in.',
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error saving profile.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = profile.brainBehaviorPrefs.focusDomains?.length || 0;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Personal Kernel</p>
            <h2>Me Profile & AI Preferences</h2>
          </div>
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>
            {profile.updatedAt
              ? `UPDATED: ${new Date(profile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'LIVE READY'}
          </span>
        </div>
      </div>

      {toast && (
        <div className={`auth-banner ${toast.type === 'success' ? 'success' : 'failed'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING ME PROFILE TELEMETRY...</div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Persona Card */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.05rem' }}>Who Am I (Kernel Persona)</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
              Describe your professional persona, primary tech stack, current role, and core competencies.
              The Brain intelligence engine uses this as personal context during daily cognitive synthesis.
            </p>
            <textarea
              rows={4}
              value={profile.whoAmI}
              onChange={(e) => setProfile({ ...profile, whoAmI: e.target.value })}
              placeholder="e.g. Staff Full-Stack & Systems Engineer specializing in NestJS, React, PostgreSQL, distributed systems, and LLM orchestration..."
              style={{ width: '100%' }}
            />
          </div>

          {/* Goals Card */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.05rem' }}>Core Goals & Objectives</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
              Define your 30/60/90-day targets, compensation milestones, LeetCode targets, and career aspirations.
            </p>
            <textarea
              rows={4}
              value={profile.goals}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              placeholder="e.g. Master Hard DP & Graph DSA problems on LeetCode, publish 2 architectural deep-dives on LinkedIn/Medium weekly, secure Staff Engineer offer..."
              style={{ width: '100%' }}
            />
          </div>

          {/* External Handles & Scraper Connections Card */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Globe size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.05rem' }}>Connected Profiles & Scraper Handles</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
              Your LeetCode handle is used by the autonomous background scraper to fetch your solved problem library, ranking, and difficulty metrics automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Code size={13} color="var(--accent)" />
                  <span>LeetCode Handle / Profile URL *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. vyshnavpc or https://leetcode.com/u/vyshnavpc/"
                  value={profile.leetcodeHandle}
                  onChange={(e) => setProfile({ ...profile, leetcodeHandle: e.target.value })}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Auto-scrapes stats on `/leetcode`
                </span>
              </div>

              <div>
                <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Globe size={13} color="var(--accent-2)" />
                  <span>GitHub Username</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. vyshnavpc"
                  value={profile.githubHandle}
                  onChange={(e) => setProfile({ ...profile, githubHandle: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Share2 size={13} color="#4A90E2" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/..."
                  value={profile.linkedinUrl}
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Autonomous Brain Behavior Preferences Card */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.05rem' }}>Autonomous Brain Behavior Preferences</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sprint Style */}
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                  AI Sprint Execution Style
                </label>
                <select
                  value={profile.brainBehaviorPrefs.sprintStyle}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      brainBehaviorPrefs: {
                        ...profile.brainBehaviorPrefs,
                        sprintStyle: e.target.value as any,
                      },
                    })
                  }
                  style={{ width: '100%' }}
                >
                  <option value="aggressive">Aggressive (High-velocity tasks, maximal output)</option>
                  <option value="balanced">Balanced (Optimal pacing with daily retrospectives)</option>
                  <option value="sustainable">Sustainable (Focus on deep work & zero cognitive burnout)</option>
                </select>
              </div>

              {/* Multi-Domain Focus */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="stat-label" style={{ margin: 0 }}>
                    Active Focus Domains ({selectedCount}/{FOCUS_DOMAINS.length} active)
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAllDomains}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                      fontSize: '0.72rem',
                      fontFamily: 'JetBrains Mono',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedCount === FOCUS_DOMAINS.length ? 'Reset Default' : 'Select All Domains'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                  {FOCUS_DOMAINS.map((domain) => {
                    const isSelected = profile.brainBehaviorPrefs.focusDomains?.includes(domain.id);
                    return (
                      <div
                        key={domain.id}
                        onClick={() => toggleFocusDomain(domain.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius)',
                          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <div style={{ marginTop: '2px', color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {domain.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {domain.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Cap & Tone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Daily Autonomous Task Cap
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={profile.brainBehaviorPrefs.dailyTaskCap || 3}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        brainBehaviorPrefs: {
                          ...profile.brainBehaviorPrefs,
                          dailyTaskCap: Number(e.target.value),
                        },
                      })
                    }
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    AI Synthesizer Tone
                  </label>
                  <select
                    value={profile.brainBehaviorPrefs.tone || 'direct'}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        brainBehaviorPrefs: {
                          ...profile.brainBehaviorPrefs,
                          tone: e.target.value as any,
                        },
                      })
                    }
                    style={{ width: '100%' }}
                  >
                    <option value="direct">Direct & Concise</option>
                    <option value="analytical">Analytical & Metric-driven</option>
                    <option value="encouraging">Motivational & Strategic</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving Preferences...' : 'Save Kernel Profile'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
