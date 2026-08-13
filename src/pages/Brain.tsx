import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Search,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface DailySynthesis {
  id: number;
  date: string;
  summary: string;
  highlights: string[];
  actionItems: string[];
  risksOrBlockers: string[];
  cognitiveScore: number;
  rawLLMResponse?: string;
  metricsSnapshot: any;
  emailDelivered: boolean;
  emailDeliveredAt?: string | null;
  createdAt: string;
}

interface BrainStats {
  totalSyntheses: number;
  latestScore: number;
  averageScore: number;
  totalIndexedMemories: number;
  lastSynthesisDate: string | null;
  nextScheduledTime: string;
}

interface BrainMemoryItem {
  id: number;
  sourceType: string;
  title: string;
  content: string;
  createdAt: string;
  metadata: any;
}

export const Brain: React.FC = () => {
  const [latestSynthesis, setLatestSynthesis] = useState<DailySynthesis | null>(null);
  const [history, setHistory] = useState<DailySynthesis[]>([]);
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [memories, setMemories] = useState<BrainMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [activeTab, setActiveTab] = useState<'latest' | 'history' | 'memories'>('latest');
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [memorySearch, setMemorySearch] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [latestRes, histRes, statsRes, memRes] = await Promise.all([
        fetch('/api/brain/latest', { credentials: 'include' }),
        fetch('/api/brain/history', { credentials: 'include' }),
        fetch('/api/brain/stats', { credentials: 'include' }),
        fetch('/api/brain/memories', { credentials: 'include' }),
      ]);

      if (latestRes.ok) {
        const data = await latestRes.json();
        setLatestSynthesis(data);
      }
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (memRes.ok) {
        const data = await memRes.json();
        setMemories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch Brain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSynthesizeNow = async (sendEmail: boolean = false) => {
    try {
      setSynthesizing(true);
      setFeedback(null);
      const res = await fetch(`/api/brain/synthesize-now?email=${sendEmail}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const fresh = await res.json();
        setLatestSynthesis(fresh);
        setFeedback({
          msg: `Cognitive synthesis generated successfully! (Score: ${fresh.cognitiveScore}/100)${sendEmail ? ' and emailed to inbox' : ''}`,
          type: 'success',
        });
        fetchData();
      } else {
        setFeedback({ msg: 'Failed to generate synthesis.', type: 'error' });
      }
    } catch {
      setFeedback({ msg: 'Network error generating synthesis.', type: 'error' });
    } finally {
      setSynthesizing(false);
    }
  };

  const handleIndexMemories = async () => {
    try {
      setIndexing(true);
      const res = await fetch('/api/brain/index-memories', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setFeedback({ msg: json.message || 'Knowledge Base memories indexed successfully.', type: 'success' });
        fetchData();
      }
    } catch {
      setFeedback({ msg: 'Failed to index memories.', type: 'error' });
    } finally {
      setIndexing(false);
    }
  };

  const handleCopySummary = (synthesis: DailySynthesis) => {
    const text = `🧠 PULSE Daily Synthesis (${new Date(synthesis.date).toLocaleDateString()})\n\nScore: ${synthesis.cognitiveScore}/100\n\nExecutive Summary:\n${synthesis.summary}\n\nTop Accomplishments:\n${synthesis.highlights.join('\n')}\n\nAction Roadmap:\n${synthesis.actionItems.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(synthesis.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMemories = memories.filter((m) => {
    if (memoryFilter !== 'all' && m.sourceType !== memoryFilter) return false;
    if (memorySearch.trim()) {
      const q = memorySearch.toLowerCase();
      return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="activity-page" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Nightly Intelligence & Pinecone Vector RAG</p>
            <h2>Autonomous Brain & Synthesis</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Index Knowledge Base Button */}
          <button
            onClick={handleIndexMemories}
            disabled={indexing}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Index activities, jobs, and DSA into vector memory base"
          >
            <Database size={13} color="var(--accent-2)" className={indexing ? 'spin' : ''} />
            <span>{indexing ? 'Indexing...' : 'Index Knowledge Base'}</span>
          </button>

          {/* Trigger Synthesis Button */}
          <button
            onClick={() => handleSynthesizeNow(false)}
            disabled={synthesizing}
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Run LLM Cognitive Synthesis immediately"
          >
            <Sparkles size={14} className={synthesizing ? 'spin' : ''} />
            <span>{synthesizing ? 'Synthesizing...' : '⚡ Run Synthesis Now'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`auth-banner ${feedback.type}`} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.msg}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          HERO WAVEFORM & AUTONOMOUS HUD
         ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(24, 30, 38, 0.95), rgba(14, 18, 23, 0.98))',
          border: '1px solid rgba(95, 168, 160, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Animated Signature Waveform */}
        <div style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.15, pointerEvents: 'none', width: '380px' }}>
          <svg viewBox="0 0 200 30" preserveAspectRatio="none" style={{ width: '100%', height: '80px' }}>
            <path
              d="M0,15 L30,15 L40,15 L45,3 L50,27 L55,9 L60,21 L65,15 L100,15 L130,15 L135,5 L140,25 L145,10 L150,20 L155,15 L200,15"
              fill="none"
              stroke="#5fa8a0"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Cpu size={14} />
              <span>COGNITIVE SYNTHESIS ENGINE</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-bright)' }}>
              Nightly Synthesis: 5:00 AM IST
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Auto-dispatches executive reflection & action roadmap to your inbox daily.
            </p>
          </div>

          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              LATEST COGNITIVE SCORE
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'monospace' }}>
              {stats?.latestScore || latestSynthesis?.cognitiveScore || 85}/100
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {stats?.averageScore ? `Average: ${stats.averageScore}/100 over ${stats.totalSyntheses} runs` : 'Computed from 4 operational pillars'}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              INDEXED KNOWLEDGE MEMORIES
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-2)', fontFamily: 'monospace' }}>
              {stats?.totalIndexedMemories || memories.length} Records
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Available for Vector Semantic RAG
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
        {[
          { id: 'latest', label: 'Latest Daily Synthesis', icon: Sparkles },
          { id: 'history', label: `Synthesis History (${history.length})`, icon: Calendar },
          { id: 'memories', label: `Brain Memories (${memories.length})`, icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="btn btn-sm"
              style={{
                background: isActive ? 'var(--surface-hover)' : 'transparent',
                borderColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: LATEST SYNTHESIS
         ========================================================================= */}
      {activeTab === 'latest' && (
        <div>
          {loading && !latestSynthesis ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
              <p className="mono" style={{ fontSize: '0.85rem' }}>Loading latest cognitive synthesis...</p>
            </div>
          ) : latestSynthesis ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* Header Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-accent mono" style={{ fontSize: '0.75rem' }}>
                      SCORE: {latestSynthesis.cognitiveScore}/100
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📅 {new Date(latestSynthesis.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-bright)' }}>
                    Executive Briefing & Daily Action Plan
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleCopySummary(latestSynthesis)}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedId === latestSynthesis.id ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === latestSynthesis.id ? 'Copied' : 'Copy Briefing'}</span>
                  </button>

                  <button
                    onClick={() => handleSynthesizeNow(true)}
                    disabled={synthesizing}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Send this synthesis to your email inbox"
                  >
                    <Mail size={13} color="var(--accent-2)" />
                    <span>Email to Inbox</span>
                  </button>
                </div>
              </div>

              {/* Executive Summary Block */}
              <div
                style={{
                  background: 'rgba(232, 163, 61, 0.05)',
                  borderLeft: '4px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px',
                  lineHeight: '1.65',
                  fontSize: '0.9rem',
                  color: 'var(--text-bright)',
                }}
              >
                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '6px' }}>
                  EXECUTIVE OVERVIEW
                </div>
                {latestSynthesis.summary}
              </div>

              {/* 3 Columns: Highlights, Action Items, Risks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Highlights */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(95, 168, 160, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckCircle2 size={16} color="var(--accent-2)" />
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-2)', fontFamily: 'monospace' }}>
                      TOP ACCOMPLISHMENTS & WINS
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-bright)' }}>
                    {latestSynthesis.highlights.map((h, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{h}</li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(232, 163, 61, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={16} color="var(--accent)" />
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
                      HIGH-PRIORITY ROADMAP
                    </h4>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-bright)' }}>
                    {latestSynthesis.actionItems.map((a, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{a}</li>
                    ))}
                  </ol>
                </div>

                {/* Risks / Blockers */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(224, 108, 117, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertTriangle size={16} color="#e06c75" />
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#e06c75', fontFamily: 'monospace' }}>
                      ATTENTION & BLOCKERS
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', lineHeight: '1.6', color: '#e06c75' }}>
                    {latestSynthesis.risksOrBlockers.map((r, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics Snapshot Tags */}
              {latestSynthesis.metricsSnapshot && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span className="badge mono" style={{ fontSize: '0.7rem' }}>
                    Activities: {latestSynthesis.metricsSnapshot.activities24h || 0} logged
                  </span>
                  <span className="badge mono" style={{ fontSize: '0.7rem', color: 'var(--accent-2)' }}>
                    DSA Solved: {latestSynthesis.metricsSnapshot.dsaSolvedTotal || 0} total
                  </span>
                  <span className="badge mono" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
                    Active Jobs: {latestSynthesis.metricsSnapshot.activeJobsCount || 0}
                  </span>
                  <span className="badge mono" style={{ fontSize: '0.7rem', color: '#a37acc' }}>
                    Content Views: {latestSynthesis.metricsSnapshot.totalImpressions || 0}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SYNTHESIS HISTORY
         ========================================================================= */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {history.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No historical syntheses recorded yet.</p>
            </div>
          ) : (
            history.map((item) => {
              const isExpanded = expandedHistoryId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--surface-hover)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className="badge badge-accent mono" style={{ fontSize: '0.75rem' }}>
                        {item.cognitiveScore}/100
                      </span>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-bright)' }}>
                          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.highlights.length} wins · {item.actionItems.length} actions
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-bright)' }}>
                        {item.summary}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <strong className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-2)', display: 'block', marginBottom: '6px' }}>
                            WINS & ACCOMPLISHMENTS:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.highlights.map((h, idx) => <li key={idx}>{h}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginBottom: '6px' }}>
                            ACTION ROADMAP:
                          </strong>
                          <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.actionItems.map((a, idx) => <li key={idx}>{a}</li>)}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: MEMORY KNOWLEDGE BASE
         ========================================================================= */}
      {activeTab === 'memories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'activity', 'synthesis', 'job', 'leetcode'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMemoryFilter(type)}
                  className="btn btn-xs"
                  style={{
                    background: memoryFilter === type ? 'var(--surface-hover)' : 'var(--surface)',
                    borderColor: memoryFilter === type ? 'var(--accent)' : 'var(--border)',
                    color: memoryFilter === type ? 'var(--accent)' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search semantic vector memories..."
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Memories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {filteredMemories.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No indexed memories found matching filter.</p>
              </div>
            ) : (
              filteredMemories.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge mono" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        {m.sourceType}
                      </span>
                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--text-bright)' }}>
                      {m.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5', maxHeight: '90px', overflow: 'hidden' }}>
                      {m.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
