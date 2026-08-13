import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DatePicker } from '../components/DatePicker';
import {
  ArrowLeft,
  Plus,
  Search,
  Briefcase,
  LayoutGrid,
  List,
  Building2,
  Trash2,
  Edit2,
  ExternalLink,
  DollarSign,
  User,
  Mail,
  Calendar,
  X,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  XCircle,
  Phone,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplicationItem {
  id: number;
  company: string;
  role: string;
  status: JobStatus;
  appliedAt: string;
  source: string;
  jobLink?: string;
  salaryRange?: string;
  notes?: string;
  hrDetailsId?: number | null;
  hrDetails?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const STAGE_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon; description: string }
> = {
  applied: {
    label: 'Applied',
    color: '#8A8F98',
    bg: 'rgba(138, 143, 152, 0.08)',
    border: '#262C35',
    icon: Clock,
    description: 'Submitted applications awaiting initial review',
  },
  interview: {
    label: 'Interview',
    color: '#E8A33D',
    bg: 'rgba(232, 163, 61, 0.1)',
    border: 'rgba(232, 163, 61, 0.35)',
    icon: TrendingUp,
    description: 'Active technical screens, take-homes, and onsite loops',
  },
  offer: {
    label: 'Offer',
    color: '#5FA8A0',
    bg: 'rgba(95, 168, 160, 0.12)',
    border: 'rgba(95, 168, 160, 0.4)',
    icon: Award,
    description: 'Formal job offers secured & in negotiation',
  },
  rejected: {
    label: 'Rejected',
    color: '#D66A5F',
    bg: 'rgba(214, 106, 95, 0.1)',
    border: 'rgba(214, 106, 95, 0.35)',
    icon: XCircle,
    description: 'Archived / closed applications for record keeping',
  },
};

const SOURCES = [
  'Wellfound',
  'Cutshort',
  'Instahyre',
  'YC India',
  'Naukri',
  'LinkedIn',
  'Referral',
  'Company Career Page',
  'Other',
];

export const JobPipeline: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<'all' | JobStatus>('all');

  // Full View Modal state
  const [selectedJobForView, setSelectedJobForView] = useState<JobApplicationItem | null>(null);

  // Drag and Drop state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<JobStatus | null>(null);

  // Drawer state for Create / Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formStatus, setFormStatus] = useState<JobStatus>('applied');
  const [formAppliedAt, setFormAppliedAt] = useState('');
  const [formSource, setFormSource] = useState('LinkedIn');
  const [formJobLink, setFormJobLink] = useState('');
  const [formSalaryRange, setFormSalaryRange] = useState('');
  const [formNotes, setFormNotes] = useState('');
  // Recruiter fields
  const [formHrName, setFormHrName] = useState('');
  const [formHrEmail, setFormHrEmail] = useState('');
  const [formHrPhone, setFormHrPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Refs for horizontal scrolling tracks
  const scrollTrackRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/job-pipeline', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch job pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = (stage?: JobStatus) => {
    setEditingId(null);
    setFormCompany('');
    setFormRole('');
    setFormStatus(stage || 'applied');
    setFormAppliedAt(new Date().toISOString().slice(0, 10));
    setFormSource('LinkedIn');
    setFormJobLink('');
    setFormSalaryRange('');
    setFormNotes('');
    setFormHrName('');
    setFormHrEmail('');
    setFormHrPhone('');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: JobApplicationItem) => {
    setEditingId(item.id);
    setFormCompany(item.company || '');
    setFormRole(item.role || '');
    setFormStatus(item.status || 'applied');
    setFormAppliedAt(
      item.appliedAt ? new Date(item.appliedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    );
    setFormSource(item.source || 'LinkedIn');
    setFormJobLink(item.jobLink || '');
    setFormSalaryRange(item.salaryRange || '');
    setFormNotes(item.notes || '');
    setFormHrName(item.hrDetails?.name || '');
    setFormHrEmail(item.hrDetails?.email || '');
    setFormHrPhone(item.hrDetails?.phone || '');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formRole.trim()) return;

    setSubmitting(true);
    setFormError(null);

    const payload = {
      company: formCompany.trim(),
      role: formRole.trim(),
      status: formStatus,
      appliedAt: formAppliedAt ? new Date(formAppliedAt).toISOString() : new Date().toISOString(),
      source: formSource,
      jobLink: formJobLink.trim(),
      salaryRange: formSalaryRange.trim(),
      notes: formNotes.trim(),
      hrName: formHrName.trim(),
      hrEmail: formHrEmail.trim().toLowerCase(),
      hrPhone: formHrPhone.trim(),
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/job-pipeline/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setJobs((prev) => prev.map((j) => (j.id === editingId ? updated : j)));
          if (selectedJobForView?.id === editingId) {
            setSelectedJobForView(updated);
          }
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to update job application.');
        }
      } else {
        const res = await fetch('/api/job-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setJobs((prev) => [created, ...prev]);
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to create job application.');
        }
      }
    } catch (err) {
      setFormError('Network error saving job application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (item: JobApplicationItem, newStatus: JobStatus) => {
    if (item.status === newStatus) return;

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === item.id ? { ...j, status: newStatus } : j)),
    );
    if (selectedJobForView?.id === item.id) {
      setSelectedJobForView((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/job-pipeline/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) fetchJobs();
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchJobs();
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!window.confirm('Delete this job application from pipeline?')) return;

    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedJobForView?.id === id) {
      setSelectedJobForView(null);
    }

    try {
      await fetch(`/api/job-pipeline/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to delete job:', err);
      fetchJobs();
    }
  };

  const scrollTrack = (stage: string, direction: 'left' | 'right') => {
    const el = scrollTrackRefs.current[stage];
    if (el) {
      const amount = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Metrics
  const totalApps = jobs.length;
  const activeApps = jobs.filter((j) => j.status === 'applied' || j.status === 'interview').length;
  const interviewApps = jobs.filter((j) => j.status === 'interview').length;
  const offerApps = jobs.filter((j) => j.status === 'offer').length;
  const responseRate = totalApps > 0 ? Math.round(((interviewApps + offerApps) / totalApps) * 100) : 0;

  // Filtered list
  const filteredJobs = useMemo(() => {
    return jobs.filter((item) => {
      if (selectedStage !== 'all' && item.status !== selectedStage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComp = item.company?.toLowerCase().includes(q);
        const matchesRole = item.role?.toLowerCase().includes(q);
        const matchesSource = item.source?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesHr = item.hrDetails?.name?.toLowerCase().includes(q) || item.hrDetails?.email?.toLowerCase().includes(q);
        if (!matchesComp && !matchesRole && !matchesSource && !matchesNotes && !matchesHr) return false;
      }
      return true;
    });
  }, [jobs, selectedStage, searchQuery]);

  const stages: JobStatus[] = ['applied', 'interview', 'offer', 'rejected'];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Career Funnel & Stage Tracker</p>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>Job Search Pipeline</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/hr-details" className="btn btn-sm btn-secondary">
            <User size={14} color="var(--accent-2)" />
            <span>Recruiter Roster</span>
          </Link>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <button
              onClick={() => setViewMode('board')}
              className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', borderRadius: '4px' }}
              title="Horizontal Carousel View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', borderRadius: '4px' }}
              title="Table List View"
            >
              <List size={14} />
            </button>
          </div>

          <button onClick={() => openCreateDrawer()} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* 4 Metric / KPI Gauges */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{totalApps}</div>
          <div className="stat-sub">Lifetime pipeline</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Active Funnel</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{activeApps}</div>
          <div className="stat-sub">Applied & In Review</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Active Interviews</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{interviewApps}</div>
          <div className="stat-sub">{offerApps > 0 ? `${offerApps} offers secured` : 'Live interview loops'}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Interview Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent-2)' }}>{responseRate}%</div>
          <div className="stat-sub">Positive conversion</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="panel" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by company, role, recruiter, or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        {/* Stage Filter Chips */}
        <div className="filter-scroll-row" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'applied', 'interview', 'offer', 'rejected'] as Array<'all' | JobStatus>).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`btn btn-sm ${selectedStage === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize', fontSize: '0.75rem', flexShrink: 0 }}
            >
              {st === 'all' ? 'All Stages' : STAGE_CONFIG[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pipeline Display */}
      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING JOB PIPELINE...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <Briefcase size={36} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No job applications tracked yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Start tracking applications, interview stages, and recruiter contacts in one unified funnel.
          </p>
          <button onClick={() => openCreateDrawer()} className="btn btn-primary">
            <Plus size={16} />
            <span>Add First Job Application</span>
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* Vertical Stage Sections with Horizontal Carousels */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {stages.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const StageIcon = config.icon;
            const stageItems = filteredJobs.filter((j) => j.status === stage);
            const isDragOver = dragOverStage === stage;

            if (selectedStage !== 'all' && selectedStage !== stage) return null;

            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stage) setDragOverStage(stage);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const idStr = e.dataTransfer.getData('text/plain');
                  const id = Number(idStr) || draggedId;
                  if (id) {
                    const item = jobs.find((j) => j.id === id);
                    if (item && item.status !== stage) {
                      handleStageChange(item, stage);
                    }
                  }
                  setDragOverStage(null);
                  setDraggedId(null);
                }}
                style={{
                  backgroundColor: isDragOver ? 'rgba(232, 163, 61, 0.04)' : 'var(--surface)',
                  border: isDragOver ? `2px dashed ${config.color}` : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 140ms ease',
                  boxShadow: isDragOver ? `0 0 18px rgba(var(--accent-rgb), 0.25)` : 'none',
                }}
              >
                {/* Stage Section Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: config.bg,
                        color: config.color,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <StageIcon size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            fontFamily: 'Space Grotesk',
                            textTransform: 'uppercase',
                            color: config.color,
                            margin: 0,
                          }}
                        >
                          {config.label}
                        </h3>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '3px',
                            backgroundColor: config.bg,
                            color: config.color,
                            border: `1px solid ${config.border}`,
                          }}
                        >
                          {stageItems.length}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Controls: Left/Right Carousel Nav + Quick Add */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stageItems.length > 2 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => scrollTrack(stage, 'left')}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Scroll left"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => scrollTrack(stage, 'right')}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Scroll right"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => openCreateDrawer(stage)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Jobs Scrolling Row */}
                <div
                  ref={(el) => (scrollTrackRefs.current[stage] = el)}
                  className="horizontal-jobs-track"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    padding: '4px 2px 10px 2px',
                    minHeight: '140px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Drop Indicator */}
                  {isDragOver && (
                    <div
                      style={{
                        flex: '0 0 200px',
                        border: `2px dashed ${config.color}`,
                        borderRadius: 'var(--radius)',
                        backgroundColor: config.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: config.color,
                        fontSize: '0.8rem',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 600,
                        textAlign: 'center',
                        padding: '16px',
                      }}
                    >
                      ↓ Drop here to advance
                    </div>
                  )}

                  {stageItems.length === 0 && !isDragOver ? (
                    <div
                      style={{
                        width: '100%',
                        padding: '28px 16px',
                        textAlign: 'center',
                        background: 'rgba(0, 0, 0, 0.15)',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>No applications in {config.label.toLowerCase()} stage</span>
                      <button
                        onClick={() => openCreateDrawer(stage)}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.74rem', marginTop: '4px' }}
                      >
                        <Plus size={12} /> Add one now
                      </button>
                    </div>
                  ) : (
                    stageItems.map((item) => {
                      const initial = (item.company || 'C').charAt(0).toUpperCase();
                      const appliedDate = new Date(item.appliedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      });
                      const isBeingDragged = draggedId === item.id;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.id.toString());
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDragOverStage(null);
                          }}
                          onClick={() => setSelectedJobForView(item)}
                          className="card job-horizontal-card"
                          style={{
                            flex: '0 0 290px',
                            minWidth: '270px',
                            maxWidth: '320px',
                            scrollSnapAlign: 'start',
                            backgroundColor: '#12161c',
                            cursor: 'pointer',
                            opacity: isBeingDragged ? 0.35 : 1,
                            border: isBeingDragged
                              ? '1px dashed var(--accent)'
                              : '1px solid var(--border)',
                            transform: isBeingDragged ? 'scale(0.98)' : 'none',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'all 140ms ease',
                          }}
                        >
                          {/* Card Top: Drag handle + Initial + Company & Role + Quick edit */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--accent)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                  fontFamily: 'Space Grotesk',
                                  flexShrink: 0,
                                }}
                              >
                                {initial}
                              </div>

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h4
                                  style={{
                                    fontSize: '0.92rem',
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={item.company}
                                >
                                  {item.company}
                                </h4>
                                <p
                                  style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    margin: '2px 0 0 0',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={item.role}
                                >
                                  {item.role}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDrawer(item);
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '3px 5px' }}
                                title="Edit Application"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteJob(item.id);
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '3px 5px', color: 'var(--danger)' }}
                                title="Delete Application"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Source badge + Salary */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontFamily: 'JetBrains Mono',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: 'rgba(232, 163, 61, 0.08)',
                                border: '1px solid rgba(232, 163, 61, 0.25)',
                                color: 'var(--accent)',
                              }}
                            >
                              {item.source}
                            </span>

                            {item.salaryRange && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'JetBrains Mono',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: 'rgba(95, 168, 160, 0.08)',
                                  border: '1px solid rgba(95, 168, 160, 0.25)',
                                  color: 'var(--accent-2)',
                                }}
                              >
                                {item.salaryRange}
                              </span>
                            )}
                          </div>

                          {/* Recruiter pill if attached */}
                          {item.hrDetails && (
                            <div
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border)',
                                fontSize: '0.72rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <User size={11} color="var(--accent)" />
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.hrDetails.name || 'Recruiter'}
                              </span>
                            </div>
                          )}

                          {/* Bottom Row: Applied Date + Full View button + Stage changer */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {appliedDate}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--accent)',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                Full View <Maximize2 size={11} />
                              </span>

                              {/* Stage switcher */}
                              <select
                                value={item.status}
                                onChange={(e) => handleStageChange(item, e.target.value as JobStatus)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '2px 4px',
                                  fontSize: '0.68rem',
                                  fontFamily: 'JetBrains Mono',
                                  height: '24px',
                                }}
                              >
                                <option value="applied">Applied</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#0e1217', color: 'var(--text-muted)', fontFamily: 'Space Grotesk', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Company & Role</th>
                <th style={{ padding: '12px 16px' }}>Stage</th>
                <th style={{ padding: '12px 16px' }}>Source</th>
                <th style={{ padding: '12px 16px' }}>Salary Range</th>
                <th style={{ padding: '12px 16px' }}>Recruiter Contact</th>
                <th style={{ padding: '12px 16px' }}>Applied Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((item) => {
                const conf = STAGE_CONFIG[item.status];
                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    className="hover-row"
                    onClick={() => setSelectedJobForView(item)}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.company}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.role}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: conf.bg,
                          border: `1px solid ${conf.border}`,
                          color: conf.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                      {item.source}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-2)', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                      {item.salaryRange || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.hrDetails ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.hrDetails.name || 'Recruiter'}</div>
                          <a
                            href={`mailto:${item.hrDetails.email}`}
                            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
                            className="mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.hrDetails.email}
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.appliedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {item.jobLink && (
                          <a
                            href={item.jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '4px 6px' }}
                            title="Open Link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDrawer(item);
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(item.id);
                          }}
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

      {/* ========================================================================= */}
      {/* FULL VIEW MODAL FOR SELECTED JOB APPLICATION */}
      {/* ========================================================================= */}
      {selectedJobForView && (
        <div
          className="job-full-view-overlay"
          onClick={() => setSelectedJobForView(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 14, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="job-full-view-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    fontFamily: 'Space Grotesk',
                    flexShrink: 0,
                  }}
                >
                  {(selectedJobForView.company || 'C').charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedJobForView.company}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--accent)', margin: '2px 0 0 0', fontWeight: 500 }}>
                    {selectedJobForView.role}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobForView(null)}
                className="btn btn-sm btn-secondary"
                style={{ padding: '6px', borderRadius: '50%', border: 'none' }}
                aria-label="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Content */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Interactive Stage Transition Bar */}
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Application Stage (Tap to Advance)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {stages.map((st) => {
                    const conf = STAGE_CONFIG[st];
                    const isCurrent = selectedJobForView.status === st;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStageChange(selectedJobForView, st)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: isCurrent ? conf.color : 'var(--border)',
                          backgroundColor: isCurrent ? conf.bg : 'var(--bg)',
                          color: isCurrent ? conf.color : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontFamily: 'Space Grotesk',
                          fontWeight: isCurrent ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 120ms ease',
                        }}
                      >
                        {isCurrent && <Check size={13} />}
                        <span>{conf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* Applied Date */}
                <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Date Applied
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                    {new Date(selectedJobForView.appliedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {/* Source */}
                <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Source Channel
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                    {selectedJobForView.source}
                  </div>
                </div>

                {/* Salary / CTC */}
                {selectedJobForView.salaryRange && (
                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Salary / Compensation
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>
                      {selectedJobForView.salaryRange}
                    </div>
                  </div>
                )}

                {/* Job Link */}
                {selectedJobForView.jobLink && (
                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Job Posting URL
                    </div>
                    <a
                      href={selectedJobForView.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                      }}
                    >
                      <span>Open External Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Recruiter / HR Contact Section */}
              {selectedJobForView.hrDetails && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <User size={16} color="var(--accent)" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent)' }}>
                      Recruiter / HR Contact Details
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedJobForView.hrDetails.name || 'Recruiter'}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                      <a href={`mailto:${selectedJobForView.hrDetails.email}`} style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>
                        {selectedJobForView.hrDetails.email}
                      </a>
                    </div>

                    {selectedJobForView.hrDetails.phone && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                        <a href={`tel:${selectedJobForView.hrDetails.phone}`} style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>
                          {selectedJobForView.hrDetails.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes & Interview Feedback */}
              <div>
                <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FileText size={13} color="var(--accent)" />
                  <span>Interview Notes & Preparation Details</span>
                </label>
                <div
                  style={{
                    background: '#0e1217',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    color: selectedJobForView.notes ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    minHeight: '80px',
                  }}
                >
                  {selectedJobForView.notes || 'No notes added for this job application yet.'}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <button
                onClick={() => {
                  const id = selectedJobForView.id;
                  handleDeleteJob(id);
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'rgba(214, 106, 95, 0.4)' }}
              >
                <Trash2 size={13} />
                <span>Delete Application</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const item = selectedJobForView;
                    setSelectedJobForView(null);
                    openEditDrawer(item);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Edit2 size={13} />
                  <span>Edit Application</span>
                </button>

                <button onClick={() => setSelectedJobForView(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Add/Edit Application */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 130,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={closeDrawer}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '100%',
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.15rem' }}>
                    {editingId ? 'Edit Application' : 'Add Job Application'}
                  </h3>
                </div>
                <button onClick={closeDrawer} className="btn btn-sm btn-secondary" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div className="auth-banner failed" style={{ margin: 0 }}>
                  <span>{formError}</span>
                </div>
              )}

              <form id="job-form" onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Stripe, Uber"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Role / Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer - Distributed Systems"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Status selector */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Current Pipeline Stage
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {stages.map((st) => {
                      const conf = STAGE_CONFIG[st];
                      const isSel = formStatus === st;
                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setFormStatus(st)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontFamily: 'JetBrains Mono',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isSel ? conf.color : 'var(--border)',
                            backgroundColor: isSel ? conf.bg : 'var(--bg)',
                            color: isSel ? conf.color : 'var(--text-muted)',
                            fontWeight: isSel ? 700 : 500,
                          }}
                        >
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date + Source in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Date Applied
                    </label>
                    <DatePicker
                      value={formAppliedAt}
                      onChange={(newDate) => setFormAppliedAt(newDate)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Source
                    </label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Job Link / Posting URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://jobs.lever.co/..."
                    value={formJobLink}
                    onChange={(e) => setFormJobLink(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Salary Range / Expected CTC (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $140,000 - $165,000 or ₹35-45 LPA"
                    value={formSalaryRange}
                    onChange={(e) => setFormSalaryRange(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Recruiter Details Sub-Section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <User size={14} color="var(--accent)" />
                    <span className="stat-label" style={{ margin: 0 }}>
                      Recruiter / HR Contact (Optional)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Recruiter Full Name"
                      value={formHrName}
                      onChange={(e) => setFormHrName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="recruiter@company.com"
                      value={formHrEmail}
                      onChange={(e) => setFormHrEmail(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000 (Optional)"
                      value={formHrPhone}
                      onChange={(e) => setFormHrPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Interview Notes & Follow-up Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Screening completed with Sarah. Next: System Design on Thursday..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                form="job-form"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Application' : 'Save Application'}
              </button>
              <button type="button" onClick={closeDrawer} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
