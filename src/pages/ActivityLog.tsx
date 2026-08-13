import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Play,
  PauseCircle,
  XCircle,
  X,
  Tag,
  CheckSquare,
  Hourglass,
  CalendarDays,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export type ActivityStatus = 'pending' | 'in-progress' | 'hold' | 'rejected' | 'done';

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  category: string;
  status: ActivityStatus;
  date: string;
  startDate?: string;
  endDate?: string | null;
  metadata?: {
    notes?: string;
    holdReason?: string;
    rejectionReason?: string;
    [key: string]: any;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'work', label: 'Work / PRs', color: '#4A90E2' },
  { id: 'learning', label: 'Learning / DSA', color: '#E8A33D' },
  { id: 'health', label: 'Health / Fitness', color: '#5FA8A0' },
  { id: 'personal', label: 'Personal', color: '#9B51E0' },
  { id: 'finance', label: 'Finance', color: '#27AE60' },
  { id: 'other', label: 'Other', color: '#8A8F98' },
];

import type { LucideIcon } from 'lucide-react';

const STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  pending: {
    label: 'Pending',
    color: '#8A8F98',
    bg: 'rgba(138, 143, 152, 0.1)',
    border: '#262C35',
    icon: Clock,
  },
  'in-progress': {
    label: 'In Progress',
    color: '#E8A33D',
    bg: 'rgba(232, 163, 61, 0.12)',
    border: 'rgba(232, 163, 61, 0.4)',
    icon: Play,
  },
  hold: {
    label: 'On Hold',
    color: '#F2C94C',
    bg: 'rgba(242, 201, 76, 0.12)',
    border: 'rgba(242, 201, 76, 0.4)',
    icon: PauseCircle,
  },
  rejected: {
    label: 'Rejected',
    color: '#D66A5F',
    bg: 'rgba(214, 106, 95, 0.12)',
    border: 'rgba(214, 106, 95, 0.4)',
    icon: XCircle,
  },
  done: {
    label: 'Done',
    color: '#5FA8A0',
    bg: 'rgba(95, 168, 160, 0.12)',
    border: 'rgba(95, 168, 160, 0.4)',
    icon: CheckCircle,
  },
};

const ALL_STATUSES: Array<'all' | ActivityStatus> = [
  'all',
  'pending',
  'in-progress',
  'hold',
  'rejected',
  'done',
];

function formatDuration(startStr?: string, endStr?: string | null): string | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return null;

  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMins / (60 * 24));
  const hours = Math.floor((diffMins % (60 * 24)) / 60);
  const minutes = diffMins % 60;

  if (days > 0) {
    return `${days}d ${hours > 0 ? `${hours}h` : ''}`.trim();
  }
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  return `${minutes}m`;
}

export const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ActivityStatus>('all');
  const [sortAsc, setSortAsc] = useState(false);

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('work');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('pending');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick Status Reason Modal state
  const [statusReasonModal, setStatusReasonModal] = useState<{
    item: ActivityItem;
    targetStatus: 'hold' | 'rejected';
    reason: string;
  } | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/activity-log', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setEditingId(null);
    setFormTitle('');
    setFormCategory('work');
    setFormStatus('pending');
    setFormStartDate(now.toISOString().slice(0, 16));
    setFormEndDate(oneHourLater.toISOString().slice(0, 16));
    setFormNotes('');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: ActivityItem) => {
    setEditingId(item.id);
    setFormTitle(item.title || item.description);
    setFormCategory(item.category || 'work');
    setFormStatus(item.status || 'pending');
    const start = item.startDate || item.date || new Date().toISOString();
    setFormStartDate(new Date(start).toISOString().slice(0, 16));
    setFormEndDate(item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '');
    setFormNotes(
      item.metadata?.notes ||
        item.metadata?.holdReason ||
        item.metadata?.rejectionReason ||
        item.description ||
        '',
    );
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Validate mandatory note on hold or rejected
    if ((formStatus === 'hold' || formStatus === 'rejected') && !formNotes.trim()) {
      setFormError(
        `A mandatory note/reason is required when marking an activity as '${STATUS_CONFIG[formStatus].label}'.`,
      );
      return;
    }

    if (formStartDate && formEndDate) {
      const startMs = new Date(formStartDate).getTime();
      const endMs = new Date(formEndDate).getTime();
      if (endMs < startMs) {
        setFormError('Ending date/time cannot be earlier than Starting date/time.');
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: formTitle.trim(),
        description: formNotes.trim() || formTitle.trim(),
        category: formCategory,
        status: formStatus,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        date: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
        notes: formNotes.trim(),
      };

      if (editingId) {
        const res = await fetch(`/api/activity-log/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setActivities((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to update activity.');
        }
      } else {
        const res = await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setActivities((prev) => [created, ...prev]);
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to create activity.');
        }
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      setFormError('Network error saving activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusClick = (item: ActivityItem, targetStatus: ActivityStatus) => {
    if (item.status === targetStatus) return;

    if (targetStatus === 'hold' || targetStatus === 'rejected') {
      // Require reason dialog
      setStatusReasonModal({
        item,
        targetStatus,
        reason: item.metadata?.notes || item.metadata?.holdReason || item.metadata?.rejectionReason || '',
      });
      return;
    }

    applyStatusUpdate(item, targetStatus);
  };

  const applyStatusUpdate = async (item: ActivityItem, newStatus: ActivityStatus, reason?: string) => {
    const updates: any = { status: newStatus };
    if (reason) {
      updates.notes = reason.trim();
    }
    if (newStatus === 'done' && !item.endDate) {
      updates.endDate = new Date().toISOString();
    }

    // Optimistic UI update
    setActivities((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? {
              ...a,
              ...updates,
              metadata: {
                ...(a.metadata || {}),
                ...(reason ? { notes: reason.trim() } : {}),
                ...(newStatus === 'hold' ? { holdReason: reason?.trim() } : {}),
                ...(newStatus === 'rejected' ? { rejectionReason: reason?.trim() } : {}),
              },
            }
          : a,
      ),
    );

    try {
      const res = await fetch(`/api/activity-log/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchActivities();
    }
  };

  const submitStatusReasonModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReasonModal || !statusReasonModal.reason.trim()) return;

    applyStatusUpdate(
      statusReasonModal.item,
      statusReasonModal.targetStatus,
      statusReasonModal.reason.trim(),
    );
    setStatusReasonModal(null);
  };

  const handleDeleteActivity = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this activity entry?')) return;

    setActivities((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/activity-log/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to delete activity:', err);
      fetchActivities();
    }
  };

  // Filter & Search
  const filteredActivities = useMemo(() => {
    return activities
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title?.toLowerCase().includes(q);
          const matchesDesc = item.description?.toLowerCase().includes(q);
          const matchesNotes = item.metadata?.notes?.toLowerCase().includes(q);
          const matchesHold = item.metadata?.holdReason?.toLowerCase().includes(q);
          const matchesRej = item.metadata?.rejectionReason?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesNotes && !matchesHold && !matchesRej)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.startDate || a.date).getTime();
        const timeB = new Date(b.startDate || b.date).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [activities, selectedCategory, selectedStatus, searchQuery, sortAsc]);

  // Group by Date sections
  const groupedActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { label: string; items: ActivityItem[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'This Week', items: [] },
      { label: 'Earlier', items: [] },
    ];

    filteredActivities.forEach((item) => {
      const itemDate = new Date(item.startDate || item.date);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups[0].items.push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups[1].items.push(item);
      } else if (itemDate >= weekAgo) {
        groups[2].items.push(item);
      } else {
        groups[3].items.push(item);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredActivities]);

  const getCategoryColor = (cat: string) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found?.color || '#8A8F98';
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Daily Ledger</p>
            <h2>Activity Log</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>{activities.length} ENTRIES</span>
          </div>
          <button onClick={openCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search activities, hold reasons, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px' }}
            />
          </div>

          {/* 5-State Status Filter Chips */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {ALL_STATUSES.map((st) => {
              const isSelected = selectedStatus === st;
              const config = st !== 'all' ? STATUS_CONFIG[st] : null;

              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    textTransform: 'capitalize',
                    fontSize: '0.75rem',
                    color: isSelected ? '#12161C' : config ? config.color : 'inherit',
                  }}
                >
                  {st === 'all' ? 'All' : STATUS_CONFIG[st].label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortAsc ? 'asc' : 'desc'}
            onChange={(e) => setSortAsc(e.target.value === 'asc')}
            style={{ width: '140px' }}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--border)',
                background: selectedCategory === cat.id ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--bg)',
                color: selectedCategory === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {cat.id !== 'all' && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
              )}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity List Content */}
      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING ACTIVITY LEDGER...</div>
        </div>
      ) : groupedActivities.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <CheckSquare size={36} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No activities found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No records match your active search and filter criteria.'
              : 'Your activity ledger is currently clear for today.'}
          </p>
          <button onClick={openCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Create First Activity</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedActivities.map((group) => (
            <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {group.label}
                </span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ({group.items.length})
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((item) => {
                  const catColor = getCategoryColor(item.category);
                  const stConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const StatusIcon = stConfig.icon;
                  const startTimeStr = item.startDate || item.date;
                  const startFormatted = new Date(startTimeStr).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endFormatted = item.endDate
                    ? new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null;
                  const duration = formatDuration(startTimeStr, item.endDate);

                  const holdOrRejectReason =
                    item.status === 'hold'
                      ? item.metadata?.holdReason || item.metadata?.notes
                      : item.status === 'rejected'
                      ? item.metadata?.rejectionReason || item.metadata?.notes
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '14px 16px',
                        gap: '10px',
                        borderLeft: `3px solid ${stConfig.color}`,
                      }}
                    >
                      {/* Top Row: Title + Category + Controls */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: catColor,
                              marginTop: '6px',
                              flexShrink: 0,
                            }}
                            title={`Category: ${item.category}`}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '0.94rem',
                                  fontWeight: 600,
                                  color: item.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: item.status === 'done' ? 'line-through' : 'none',
                                }}
                              >
                                {item.title}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'JetBrains Mono',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--border)',
                                  color: catColor,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {item.category}
                              </span>
                            </div>

                            {(item.metadata?.notes || (item.description && item.description !== item.title)) && (
                              <p
                                style={{
                                  color: 'var(--text-muted)',
                                  fontSize: '0.82rem',
                                  marginTop: '4px',
                                }}
                              >
                                {item.metadata?.notes || item.description}
                              </p>
                            )}

                            {/* Time / Duration Readout */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono' }}>
                                <CalendarDays size={12} color="var(--accent)" />
                                <span>{startFormatted}</span>
                                {endFormatted && (
                                  <>
                                    <span>→</span>
                                    <span>{endFormatted}</span>
                                  </>
                                )}
                              </div>

                              {duration && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: 'var(--accent-2)',
                                    fontSize: '0.7rem',
                                    fontFamily: 'JetBrains Mono',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    background: 'rgba(95, 168, 160, 0.1)',
                                    border: '1px solid rgba(95, 168, 160, 0.25)',
                                  }}
                                >
                                  <Hourglass size={11} />
                                  <span>{duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openEditDrawer(item)}
                            className="btn btn-sm btn-secondary"
                            title="Edit activity"
                            style={{ padding: '5px 8px' }}
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={(e) => handleDeleteActivity(item.id, e)}
                            className="btn btn-sm btn-secondary"
                            title="Delete activity"
                            style={{ padding: '5px 8px', color: 'var(--danger)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Mandatory Reason Callout Box (if hold or rejected) */}
                      {holdOrRejectReason && (item.status === 'hold' || item.status === 'rejected') && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: stConfig.bg,
                            border: `1px solid ${stConfig.border}`,
                            fontSize: '0.78rem',
                            fontFamily: 'JetBrains Mono',
                            color: stConfig.color,
                          }}
                        >
                          <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                              [{item.status.toUpperCase()} REASON]:
                            </span>{' '}
                            <span>{holdOrRejectReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive 5-State Selector Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginRight: '4px' }}>
                          STATUS:
                        </span>
                        {(['pending', 'in-progress', 'hold', 'rejected', 'done'] as ActivityStatus[]).map((st) => {
                          const conf = STATUS_CONFIG[st];
                          const isActive = item.status === st;
                          const StIcon = conf.icon;

                          return (
                            <button
                              key={st}
                              onClick={() => handleStatusClick(item, st)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '3px',
                                fontSize: '0.72rem',
                                fontFamily: 'JetBrains Mono',
                                cursor: 'pointer',
                                transition: 'all 120ms ease',
                                border: '1px solid',
                                borderColor: isActive ? conf.color : 'var(--border)',
                                background: isActive ? conf.bg : 'var(--bg)',
                                color: isActive ? conf.color : 'var(--text-muted)',
                                fontWeight: isActive ? 700 : 500,
                              }}
                              title={
                                st === 'hold' || st === 'rejected'
                                  ? `Mark as ${conf.label} (Mandatory reason required)`
                                  : `Mark as ${conf.label}`
                              }
                            >
                              <StIcon size={12} />
                              <span>{conf.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Reason Dialog for Hold / Rejection */}
      {statusReasonModal && (
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
        >
          <div
            className="panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--surface)',
              border: `1px solid ${STATUS_CONFIG[statusReasonModal.targetStatus].color}`,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color={STATUS_CONFIG[statusReasonModal.targetStatus].color} />
              <h3 style={{ fontSize: '1.1rem' }}>
                Mandatory Reason Required: {STATUS_CONFIG[statusReasonModal.targetStatus].label}
              </h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Please document why task <strong>"{statusReasonModal.item.title}"</strong> is being marked as{' '}
              <span style={{ color: STATUS_CONFIG[statusReasonModal.targetStatus].color, fontWeight: 700 }}>
                {statusReasonModal.targetStatus.toUpperCase()}
              </span>.
            </p>

            <form onSubmit={submitStatusReasonModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Reason / Blocker / Note *
                </label>
                <textarea
                  rows={3}
                  required
                  autoFocus
                  placeholder={
                    statusReasonModal.targetStatus === 'hold'
                      ? 'e.g. Blocked on upstream API spec; waiting for team review on Friday...'
                      : 'e.g. Deprioritized in favor of high-impact sprint deliverable...'
                  }
                  value={statusReasonModal.reason}
                  onChange={(e) =>
                    setStatusReasonModal({
                      ...statusReasonModal,
                      reason: e.target.value,
                    })
                  }
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setStatusReasonModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: STATUS_CONFIG[statusReasonModal.targetStatus].color,
                    borderColor: STATUS_CONFIG[statusReasonModal.targetStatus].color,
                    color: '#12161C',
                  }}
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Add/Edit Activity */}
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
                  <Tag size={18} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.15rem' }}>
                    {editingId ? 'Edit Activity Entry' : 'Log New Activity'}
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

              <form id="activity-form" onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Activity Title / Task Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement PR review for auth middleware"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5-State Status Selector */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Lifecycle Status
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {(['pending', 'in-progress', 'hold', 'rejected', 'done'] as ActivityStatus[]).map((st) => {
                      const conf = STATUS_CONFIG[st];
                      const isSel = formStatus === st;
                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setFormStatus(st)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '6px 8px',
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
                          <span>{conf.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Starting and Ending Date & Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Starting Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Ending Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {formStartDate && formEndDate && formatDuration(formStartDate, formEndDate) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>
                    <Hourglass size={13} />
                    <span>Calculated Duration: {formatDuration(formStartDate, formEndDate)}</span>
                  </div>
                )}

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Notes / Blocker Reason {formStatus === 'hold' || formStatus === 'rejected' ? <span style={{ color: 'var(--danger)' }}>* (Mandatory for {STATUS_CONFIG[formStatus].label})</span> : '(Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    required={formStatus === 'hold' || formStatus === 'rejected'}
                    placeholder={
                      formStatus === 'hold'
                        ? 'Mandatory: Describe why this activity is placed on hold / blockers...'
                        : formStatus === 'rejected'
                        ? 'Mandatory: Explain reason for rejection / deprioritization...'
                        : 'Key observations, links, PR URLs, or blockers...'
                    }
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{
                      width: '100%',
                      borderColor:
                        (formStatus === 'hold' || formStatus === 'rejected') && !formNotes.trim()
                          ? STATUS_CONFIG[formStatus].color
                          : undefined,
                    }}
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
                form="activity-form"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
