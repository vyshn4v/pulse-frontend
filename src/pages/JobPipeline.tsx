import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';

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

import type { LucideIcon } from 'lucide-react';

const STAGE_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  applied: {
    label: 'Applied',
    color: '#8A8F98',
    bg: 'rgba(138, 143, 152, 0.08)',
    border: '#262C35',
    icon: Clock,
  },
  interview: {
    label: 'Interview',
    color: '#E8A33D',
    bg: 'rgba(232, 163, 61, 0.1)',
    border: 'rgba(232, 163, 61, 0.35)',
    icon: TrendingUp,
  },
  offer: {
    label: 'Offer',
    color: '#5FA8A0',
    bg: 'rgba(95, 168, 160, 0.12)',
    border: 'rgba(95, 168, 160, 0.4)',
    icon: Award,
  },
  rejected: {
    label: 'Rejected',
    color: '#D66A5F',
    bg: 'rgba(214, 106, 95, 0.1)',
    border: 'rgba(214, 106, 95, 0.35)',
    icon: XCircle,
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

  // Drag and Drop state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<JobStatus | null>(null);

  // Drawer state
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

  const openCreateDrawer = () => {
    setEditingId(null);
    setFormCompany('');
    setFormRole('');
    setFormStatus('applied');
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
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Career Funnel</p>
            <h2>Job Search Pipeline</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              title="Kanban Board View"
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

          <button onClick={openCreateDrawer} className="btn btn-primary">
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
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
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

        {/* Stage Filter Chips (for list view or search refinement) */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'applied', 'interview', 'offer', 'rejected'] as Array<'all' | JobStatus>).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`btn btn-sm ${selectedStage === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
            >
              {st === 'all' ? 'All Stages' : STAGE_CONFIG[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pipeline Display (Board vs List) */}
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
          <button onClick={openCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Add First Job Application</span>
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View with Drag & Drop */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {stages.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const stageItems = filteredJobs.filter((j) => j.status === stage);
            const isDragOver = dragOverStage === stage;

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
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 280px)',
                  transition: 'border 140ms ease, background-color 140ms ease',
                  boxShadow: isDragOver ? `0 0 16px rgba(var(--accent-rgb), 0.2)` : 'none',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `3px solid ${config.color}`,
                    borderRadius: 'var(--radius) var(--radius) 0 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Space Grotesk', textTransform: 'uppercase', color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      backgroundColor: config.bg,
                      color: config.color,
                      border: `1px solid ${config.border}`,
                    }}
                  >
                    {stageItems.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {/* Drop Zone Banner when Dragging */}
                  {isDragOver && (
                    <div
                      style={{
                        padding: '10px',
                        border: `1px dashed ${config.color}`,
                        borderRadius: '4px',
                        backgroundColor: config.bg,
                        textAlign: 'center',
                        color: config.color,
                        fontSize: '0.75rem',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 600,
                      }}
                    >
                      ↓ DROP TO MOVE TO {config.label.toUpperCase()}
                    </div>
                  )}

                  {stageItems.length === 0 && !isDragOver ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}>
                      NO APPLICATIONS
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
                          className="card"
                          style={{
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            backgroundColor: '#12161c',
                            cursor: 'grab',
                            opacity: isBeingDragged ? 0.35 : 1,
                            border: isBeingDragged ? '1px dashed var(--accent)' : '1px solid var(--border)',
                            transform: isBeingDragged ? 'scale(0.98)' : 'none',
                            transition: 'opacity 120ms ease, transform 120ms ease',
                          }}
                        >
                          {/* Top: Drag Grip + Initial + Company & Role + Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div title="Drag card to change stage" style={{ display: 'flex', alignItems: 'center' }}>
                                <GripVertical
                                  size={14}
                                  style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }}
                                />
                              </div>

                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--accent)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  fontFamily: 'Space Grotesk',
                                  flexShrink: 0,
                                }}
                              >
                                {initial}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.2 }}>
                                  {item.company}
                                </h4>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {item.role}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDrawer(item);
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '3px 5px' }}
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
                                style={{ padding: '3px 5px', color: 'var(--danger)' }}
                                title="Delete"
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
                                padding: '1px 6px',
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
                                  padding: '1px 6px',
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

                          {/* Recruiter Contact info if linked */}
                          {item.hrDetails && (
                            <div
                              style={{
                                padding: '6px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border)',
                                fontSize: '0.72rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <User size={11} color="var(--accent)" />
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.hrDetails.name || 'Recruiter'}:
                              </span>
                              <a
                                href={`mailto:${item.hrDetails.email}`}
                                style={{ color: 'var(--accent-2)', textDecoration: 'none' }}
                                className="mono"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.hrDetails.email}
                              </a>
                            </div>
                          )}

                          {/* Bottom Row: Date + Job Link + Stage advance buttons */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {appliedDate}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {item.jobLink && (
                                <a
                                  href={item.jobLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '2px 5px' }}
                                  title="Open Job Posting"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}

                              {/* Stage switcher dropdown */}
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
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
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
                          <a href={`mailto:${item.hrDetails.email}`} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} className="mono">
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
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(item.id)}
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

      {/* Slide-over Drawer for Add/Edit Application */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={closeDrawer}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
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
                  <Briefcase size={18} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.15rem' }}>
                    {editingId ? 'Edit Application' : 'Log Job Application'}
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
                {/* Company & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OpenAI, Stripe..."
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      style={{ width: '100%' }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Target Role / Level *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Backend Engineer"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Stage & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Funnel Stage
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as JobStatus)}
                      style={{ width: '100%' }}
                    >
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Date Applied *
                    </label>
                    <DatePicker
                      value={formAppliedAt}
                      onChange={(newDate) => setFormAppliedAt(newDate)}
                      placeholder="Select application date"
                      required
                    />
                  </div>
                </div>

                {/* Source & Salary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Discovery Source
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

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Salary Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. $160k - $190k or 40-50LPA"
                      value={formSalaryRange}
                      onChange={(e) => setFormSalaryRange(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Job Link */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Job Link / Posting URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://jobs.lever.co/..."
                    value={formJobLink}
                    onChange={(e) => setFormJobLink(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Recruiter / HR Coordination Box */}
                <div
                  style={{
                    backgroundColor: '#0e1217',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--accent)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--accent)' }}>
                      RECRUITER / HR COORDINATION
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Providing a recruiter email will automatically index their contact details in your HR Roster.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Recruiter Name"
                        value={formHrName}
                        onChange={(e) => setFormHrName(e.target.value)}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="recruiter@company.com"
                        value={formHrEmail}
                        onChange={(e) => setFormHrEmail(e.target.value)}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <input
                    type="tel"
                    placeholder="Recruiter Phone (Optional)"
                    value={formHrPhone}
                    onChange={(e) => setFormHrPhone(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Interview Notes / Prep Strategy
                  </label>
                  <textarea
                    rows={3}
                    placeholder="System design focus, key behavioral answers, offer deadlines..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={closeDrawer} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="submit"
                form="job-form"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Application' : 'Save Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
