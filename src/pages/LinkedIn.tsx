import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  FileText,
  Send,
  SlidersHorizontal,
  Bookmark,
  LayoutGrid,
  List,
  MessageCircle,
  CornerDownRight,
  AlertCircle,
  Zap,
  Globe,
  Radio,
  Unlink,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'review' | 'archived';

interface LinkedInPostItem {
  id: number;
  topic: string;
  content: string;
  status: PostStatus;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  firstComment?: string | null;
  commentScheduledFor?: string | null;
  commentPublishedAt?: string | null;
  commentPosted?: boolean;
  retryCount?: number;
  commentRetryCount?: number;
  linkedinUrn?: string;
  failureReason?: string;
  tags: string[];
  mediaUrls: string[];
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  postUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkedInStats {
  totalPosts: number;
  scheduledCount: number;
  publishedCount: number;
  draftCount: number;
  reviewCount: number;
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  totalReposts: number;
  totalEngagements: number;
  nextScheduledPost: LinkedInPostItem | null;
  topTags: Array<{ tag: string; count: number }>;
}

interface LinkedInAccountStatus {
  isConnected: boolean;
  isExpired: boolean;
  accountName: string;
  memberUrn: string;
  expiresAt: string | null;
  clientIdConfigured: boolean;
  source?: string;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  scheduled: {
    label: 'Scheduled',
    color: '#E8A33D',
    bg: 'rgba(232, 163, 61, 0.12)',
    border: 'rgba(232, 163, 61, 0.35)',
  },
  published: {
    label: 'Published',
    color: '#5FA8A0',
    bg: 'rgba(95, 168, 160, 0.12)',
    border: 'rgba(95, 168, 160, 0.35)',
  },
  review: {
    label: 'Needs Review',
    color: '#E06C75',
    bg: 'rgba(224, 108, 117, 0.12)',
    border: 'rgba(224, 108, 117, 0.35)',
  },
  draft: {
    label: 'Draft',
    color: '#8A8F98',
    bg: 'rgba(138, 143, 152, 0.12)',
    border: 'rgba(138, 143, 152, 0.35)',
  },
  archived: {
    label: 'Archived',
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.35)',
  },
};

const SUGGESTED_HASHTAGS = [
  '#SystemDesign',
  '#SoftwareEngineering',
  '#NestJS',
  '#TypeScript',
  '#ReactJS',
  '#PostgreSQL',
  '#DistributedSystems',
  '#CareerGrowth',
  '#TechLeadership',
  '#FullStack',
];

const COMMENT_PRESETS = [
  { label: '+1 min', minutes: 1 },
  { label: '+5 min', minutes: 5 },
  { label: '+15 min', minutes: 15 },
  { label: '+30 min', minutes: 30 },
  { label: '+1 hour', minutes: 60 },
];

export const LinkedIn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const authUrlParam = searchParams.get('linkedin_auth');
  const authMsgParam = searchParams.get('msg');

  const [stats, setStats] = useState<LinkedInStats | null>(null);
  const [posts, setPosts] = useState<LinkedInPostItem[]>([]);
  const [accountStatus, setAccountStatus] = useState<LinkedInAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedCommentId, setCopiedCommentId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [commentingId, setCommentingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Inspector Modal State
  const [inspectingPost, setInspectingPost] = useState<LinkedInPostItem | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | PostStatus>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const [formTopic, setFormTopic] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<PostStatus>('draft');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formScheduledTime, setFormScheduledTime] = useState('09:00');

  // First Comment State
  const [formFirstComment, setFormFirstComment] = useState('');
  const [formCommentOffsetMins, setFormCommentOffsetMins] = useState<number>(1);
  const [formCommentCustomDate, setFormCommentCustomDate] = useState('');
  const [formCommentCustomTime, setFormCommentCustomTime] = useState('09:01');
  const [isCustomCommentTime, setIsCustomCommentTime] = useState(false);

  const [formTags, setFormTags] = useState('');
  const [formPostUrl, setFormPostUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFailureReason, setFormFailureReason] = useState('');
  const [formImpressions, setFormImpressions] = useState(0);
  const [formReactions, setFormReactions] = useState(0);
  const [formComments, setFormComments] = useState(0);
  const [formReposts, setFormReposts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, postsRes, accRes] = await Promise.all([
        fetch('/api/linkedin/stats', { credentials: 'include' }),
        fetch('/api/linkedin/posts', { credentials: 'include' }),
        fetch('/api/linkedin/account-status', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : []);
        // Update inspecting post if open
        if (inspectingPost) {
          const fresh = postsData.find((p: LinkedInPostItem) => p.id === inspectingPost.id);
          if (fresh) setInspectingPost(fresh);
        }
      }

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccountStatus(accData);
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const res = await fetch('/api/linkedin/auth-url', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        setActionFeedback({
          msg: 'Please add LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET or direct LINKEDIN_ACCESS_TOKEN in .env.',
          type: 'error',
        });
      }
    } catch (err) {
      setActionFeedback({ msg: 'Network error starting LinkedIn connection.', type: 'error' });
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!window.confirm('Disconnect LinkedIn auto-publisher account?')) return;
    try {
      const res = await fetch('/api/linkedin/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
        setActionFeedback({ msg: 'LinkedIn account disconnected.', type: 'success' });
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const [triggeringCron, setTriggeringCron] = useState(false);

  const handleTriggerCron = async () => {
    try {
      setTriggeringCron(true);
      const res = await fetch('/api/linkedin/trigger-cron', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setActionFeedback({ msg: 'Cron auto-publisher check ran successfully!', type: 'success' });
        fetchData();
      }
    } catch {
      setActionFeedback({ msg: 'Failed to run cron check.', type: 'error' });
    } finally {
      setTriggeringCron(false);
    }
  };

  const handlePublishLiveNow = async (post: LinkedInPostItem) => {
    if (!accountStatus?.isConnected) {
      setActionFeedback({
        msg: 'Please connect your LinkedIn account or add LINKEDIN_ACCESS_TOKEN in .env to auto-publish live.',
        type: 'error',
      });
      return;
    }

    if (!window.confirm(`Publish "${post.topic || 'this post'}" directly to your live LinkedIn feed now?`)) return;

    try {
      setPublishingId(post.id);
      setActionFeedback(null);
      const res = await fetch(`/api/linkedin/posts/${post.id}/publish-now`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ msg: data.message || 'Published to LinkedIn feed successfully!', type: 'success' });
        fetchData();
      } else {
        setActionFeedback({ msg: data.message || 'Failed to publish to LinkedIn.', type: 'error' });
        fetchData();
      }
    } catch (err) {
      setActionFeedback({ msg: 'Network error while publishing to LinkedIn.', type: 'error' });
      fetchData();
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishCommentNow = async (post: LinkedInPostItem) => {
    if (!accountStatus?.isConnected) {
      setActionFeedback({ msg: 'Please connect your LinkedIn account first.', type: 'error' });
      return;
    }

    try {
      setCommentingId(post.id);
      const res = await fetch(`/api/linkedin/posts/${post.id}/comment-now`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setActionFeedback({ msg: '1st Comment published live to LinkedIn post!', type: 'success' });
        fetchData();
      } else {
        setActionFeedback({ msg: 'Failed to publish comment to LinkedIn.', type: 'error' });
      }
    } catch (err) {
      setActionFeedback({ msg: 'Network error publishing comment.', type: 'error' });
    } finally {
      setCommentingId(null);
    }
  };

  const handleOpenCreateDrawer = () => {
    setEditingPostId(null);
    setFormTopic('');
    setFormContent('');
    setFormStatus('scheduled');

    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const dStr = String(now.getDate()).padStart(2, '0');
    const localDateStr = `${yStr}-${mStr}-${dStr}`;

    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    setFormScheduledDate(localDateStr);
    setFormScheduledTime(currentTimeStr);

    setFormFirstComment('');
    setFormCommentOffsetMins(1); // Default to +1 min after post
    setIsCustomCommentTime(false);

    const commDt = new Date(now.getTime() + 1 * 60 * 1000);
    const commY = commDt.getFullYear();
    const commM = String(commDt.getMonth() + 1).padStart(2, '0');
    const commD = String(commDt.getDate()).padStart(2, '0');
    const commH = String(commDt.getHours()).padStart(2, '0');
    const commMin = String(commDt.getMinutes()).padStart(2, '0');
    setFormCommentCustomDate(`${commY}-${commM}-${commD}`);
    setFormCommentCustomTime(`${commH}:${commMin}`);

    setFormTags('#SoftwareEngineering, #SystemDesign');
    setFormPostUrl('');
    setFormNotes('');
    setFormFailureReason('');
    setFormImpressions(0);
    setFormReactions(0);
    setFormComments(0);
    setFormReposts(0);
    setValidationError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (post: LinkedInPostItem) => {
    setEditingPostId(post.id);
    setFormTopic(post.topic || '');
    setFormContent(post.content || '');
    setFormStatus(post.status);
    if (post.scheduledFor) {
      const d = new Date(post.scheduledFor);
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setFormScheduledDate(`${dy}-${dm}-${dd}`);
      const dh = String(d.getHours()).padStart(2, '0');
      const dmin = String(d.getMinutes()).padStart(2, '0');
      setFormScheduledTime(`${dh}:${dmin}`);
    } else {
      const now = new Date();
      const dy = now.getFullYear();
      const dm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setFormScheduledDate(`${dy}-${dm}-${dd}`);
      const dh = String(now.getHours()).padStart(2, '0');
      const dmin = String(now.getMinutes()).padStart(2, '0');
      setFormScheduledTime(`${dh}:${dmin}`);
    }

    setFormFirstComment(post.firstComment || '');
    if (post.commentScheduledFor && post.scheduledFor) {
      const postDt = new Date(post.scheduledFor).getTime();
      const commDt = new Date(post.commentScheduledFor).getTime();
      const diffMins = Math.round((commDt - postDt) / 60000);

      if ([1, 5, 15, 30, 60].includes(diffMins)) {
        setFormCommentOffsetMins(diffMins);
        setIsCustomCommentTime(false);
      } else {
        setIsCustomCommentTime(true);
        const cd = new Date(post.commentScheduledFor);
        const cdy = cd.getFullYear();
        const cdm = String(cd.getMonth() + 1).padStart(2, '0');
        const cdd = String(cd.getDate()).padStart(2, '0');
        setFormCommentCustomDate(`${cdy}-${cdm}-${cdd}`);
        const cdh = String(cd.getHours()).padStart(2, '0');
        const cdmin = String(cd.getMinutes()).padStart(2, '0');
        setFormCommentCustomTime(`${cdh}:${cdmin}`);
      }
    } else {
      setFormCommentOffsetMins(1);
      setIsCustomCommentTime(false);
    }

    setFormTags(post.tags?.join(', ') || '');
    setFormPostUrl(post.postUrl || '');
    setFormNotes(post.notes || '');
    setFormFailureReason(post.failureReason || '');
    setFormImpressions(post.impressions || 0);
    setFormReactions(post.reactions || 0);
    setFormComments(post.comments || 0);
    setFormReposts(post.reposts || 0);
    setValidationError(null);
    setIsDrawerOpen(true);
  };

  const computedCommentTime = useMemo(() => {
    if (!formFirstComment.trim()) return null;
    if (!formScheduledDate) return null;

    const [yStr, mStr, dStr] = formScheduledDate.split('-');
    const [hStr, minStr] = formScheduledTime.split(':');
    const postDt = new Date(
      Number(yStr),
      Number(mStr) - 1,
      Number(dStr),
      Number(hStr) || 9,
      Number(minStr) || 0,
      0,
      0,
    );

    if (isCustomCommentTime) {
      if (!formCommentCustomDate) return null;
      const [cyStr, cmStr, cdStr] = formCommentCustomDate.split('-');
      const [chStr, cminStr] = formCommentCustomTime.split(':');
      const commDt = new Date(
        Number(cyStr),
        Number(cmStr) - 1,
        Number(cdStr),
        Number(chStr) || 9,
        Number(cminStr) || 5,
        0,
        0,
      );
      return commDt;
    } else {
      return new Date(postDt.getTime() + formCommentOffsetMins * 60 * 1000);
    }
  }, [
    formFirstComment,
    formScheduledDate,
    formScheduledTime,
    isCustomCommentTime,
    formCommentCustomDate,
    formCommentCustomTime,
    formCommentOffsetMins,
  ]);

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;
    setValidationError(null);

    let scheduledFor: string | null = null;
    let postDt: Date | null = null;

    if (formScheduledDate) {
      const [yStr, mStr, dStr] = formScheduledDate.split('-');
      const [hStr, minStr] = formScheduledTime.split(':');
      postDt = new Date(
        Number(yStr),
        Number(mStr) - 1,
        Number(dStr),
        Number(hStr) || 9,
        Number(minStr) || 0,
        0,
        0,
      );
      scheduledFor = postDt.toISOString();
    }

    let commentScheduledFor: string | null = null;
    if (formFirstComment.trim()) {
      if (computedCommentTime) {
        if (postDt && computedCommentTime.getTime() < postDt.getTime()) {
          setValidationError('Comment schedule time cannot be earlier than the post schedule time.');
          return;
        }
        commentScheduledFor = computedCommentTime.toISOString();
      } else if (postDt) {
        commentScheduledFor = new Date(postDt.getTime() + 5 * 60 * 1000).toISOString();
      }
    }

    setSubmitting(true);

    const tagsArr = formTags
      .split(',')
      .map((t) => t.trim())
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const payload = {
      topic: formTopic.trim(),
      content: formContent.trim(),
      status: formStatus,
      scheduledFor,
      firstComment: formFirstComment.trim(),
      commentScheduledFor,
      failureReason: formStatus === 'review' ? formFailureReason : '',
      retryCount: formStatus === 'scheduled' ? 0 : undefined,
      commentRetryCount: formStatus === 'scheduled' ? 0 : undefined,
      tags: tagsArr,
      postUrl: formPostUrl.trim(),
      notes: formNotes.trim(),
      impressions: Number(formImpressions) || 0,
      reactions: Number(formReactions) || 0,
      comments: Number(formComments) || 0,
      reposts: Number(formReposts) || 0,
    };

    try {
      const url = editingPostId ? `/api/linkedin/posts/${editingPostId}` : '/api/linkedin/posts';
      const method = editingPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setValidationError(errJson.message || 'Failed to save post.');
      }
    } catch (err) {
      console.error('Failed to save post:', err);
      setValidationError('Network error saving post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Delete this LinkedIn post from queue?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (inspectingPost?.id === id) setInspectingPost(null);
    try {
      await fetch(`/api/linkedin/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete post:', err);
      fetchData();
    }
  };

  const handleCopyContent = (post: LinkedInPostItem) => {
    navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyComment = (post: LinkedInPostItem) => {
    if (!post.firstComment) return;
    navigator.clipboard.writeText(post.firstComment);
    setCopiedCommentId(post.id);
    setTimeout(() => setCopiedCommentId(null), 2000);
  };

  const handleAddHashtag = (tag: string) => {
    if (formTags.includes(tag)) return;
    setFormTags((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((item) => {
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = item.topic?.toLowerCase().includes(q);
        const matchesContent = item.content?.toLowerCase().includes(q);
        const matchesComment = item.firstComment?.toLowerCase().includes(q);
        const matchesFailure = item.failureReason?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTopic && !matchesContent && !matchesComment && !matchesFailure && !matchesNotes && !matchesTags)
          return false;
      }
      return true;
    });
  }, [posts, selectedStatus, selectedTag, searchQuery]);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Technical Thought Leadership & Auto-Publisher</p>
            <h2>LinkedIn Post Management</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* LinkedIn Connection Status */}
          {accountStatus?.isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                className="btn btn-sm btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(95, 168, 160, 0.4)',
                  backgroundColor: 'rgba(95, 168, 160, 0.08)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-2)' }} />
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-2)' }}>
                  {accountStatus.accountName || 'LinkedIn Active'}
                </span>
              </div>
              <button
                onClick={handleDisconnectLinkedIn}
                className="btn btn-sm btn-secondary"
                style={{ padding: '6px 8px' }}
                title="Disconnect LinkedIn account"
              >
                <Unlink size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectLinkedIn}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(232, 163, 61, 0.4)' }}
              title="Connect LinkedIn via OAuth 2.0 to enable automated background publishing"
            >
              <Zap size={13} color="var(--accent)" />
              <span>Connect Auto-Publisher</span>
            </button>
          )}

          {/* Run Cron Check On Demand */}
          <button
            onClick={handleTriggerCron}
            disabled={triggeringCron}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Trigger LinkedIn Auto-Publisher Cron check immediately (also runs automatically every 30 seconds)"
          >
            <RefreshCw size={13} className={triggeringCron ? 'spin' : ''} color="var(--accent)" />
            <span>{triggeringCron ? 'Checking...' : 'Run Cron Check'}</span>
          </button>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--surface-hover)' : 'var(--surface)',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)',
                padding: '6px 10px',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--surface-hover)' : 'var(--surface)',
                color: viewMode === 'table' ? 'var(--accent)' : 'var(--text-muted)',
                padding: '6px 10px',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Table List View"
            >
              <List size={14} />
            </button>
          </div>

          {/* New Post Button */}
          <button onClick={handleOpenCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* OAuth Banner Notification */}
      {authUrlParam === 'success' && (
        <div className="auth-banner success" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>LinkedIn OAuth 2.0 connected successfully. Automated background publisher is now active.</span>
          </div>
        </div>
      )}

      {authUrlParam === 'failed' && (
        <div className="auth-banner failed" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>LinkedIn OAuth failed: {authMsgParam || 'Could not verify authorization code.'}</span>
          </div>
        </div>
      )}

      {actionFeedback && (
        <div
          className={`auth-banner ${actionFeedback.type === 'success' ? 'success' : 'failed'}`}
          style={{ margin: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actionFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{actionFeedback.msg}</span>
          </div>
        </div>
      )}

      {/* 4 KPI Gauges */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Scheduled Queue</div>
          <div className="stat-value" style={{ color: STATUS_CONFIG.scheduled.color }}>
            {stats?.scheduledCount || 0}
          </div>
          <div className="stat-sub">
            {stats?.nextScheduledPost?.scheduledFor
              ? `Next: ${new Date(stats.nextScheduledPost.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
              : 'Queue ready'}
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Published Posts</div>
          <div className="stat-value" style={{ color: STATUS_CONFIG.published.color }}>
            {stats?.publishedCount || 0}
          </div>
          <div className="stat-sub">Live technical posts</div>
        </div>

        {stats && stats.reviewCount > 0 ? (
          <div className="stat-box" style={{ borderColor: 'rgba(224, 108, 117, 0.5)', backgroundColor: 'rgba(224, 108, 117, 0.04)' }}>
            <div className="stat-label" style={{ color: STATUS_CONFIG.review.color }}>Needs Review</div>
            <div className="stat-value" style={{ color: STATUS_CONFIG.review.color }}>
              {stats.reviewCount}
            </div>
            <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>3 Retries Exceeded · Action needed</div>
          </div>
        ) : (
          <div className="stat-box">
            <div className="stat-label">Draft Workspace</div>
            <div className="stat-value" style={{ color: STATUS_CONFIG.draft.color }}>
              {stats?.draftCount || 0}
            </div>
            <div className="stat-sub">Ideas in incubation</div>
          </div>
        )}

        <div className="stat-box">
          <div className="stat-label">Total Engagements</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {stats?.totalEngagements || 0}
          </div>
          <div className="stat-sub">{stats?.totalImpressions || 0} lifetime impressions</div>
        </div>
      </div>

      {/* Next Scheduled Highlight Banner */}
      {stats?.nextScheduledPost && stats.nextScheduledPost.scheduledFor && (
        <div
          className="panel"
          style={{
            border: '1px solid rgba(232, 163, 61, 0.4)',
            backgroundColor: 'rgba(232, 163, 61, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(232, 163, 61, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontWeight: 700, textTransform: 'uppercase' }}>
                  NEXT UP IN QUEUE
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  {new Date(stats.nextScheduledPost.scheduledFor).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {accountStatus?.isConnected && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>
                    ⚡ AUTO-PUBLISHER ACTIVE (MAX 3 RETRIES)
                  </span>
                )}
                {stats.nextScheduledPost.firstComment && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'JetBrains Mono',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(95, 168, 160, 0.15)',
                      color: 'var(--accent-2)',
                      border: '1px solid rgba(95, 168, 160, 0.3)',
                    }}
                  >
                    + 1st Comment Prepared
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                {stats.nextScheduledPost.topic || stats.nextScheduledPost.content.slice(0, 60) + '...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setInspectingPost(stats.nextScheduledPost!)}
              className="btn btn-sm btn-secondary"
              title="Inspect post & 1st comment verification"
            >
              <Eye size={12} />
              <span>Inspect</span>
            </button>

            {accountStatus?.isConnected && (
              <button
                onClick={() => handlePublishLiveNow(stats.nextScheduledPost!)}
                disabled={publishingId === stats.nextScheduledPost.id}
                className="btn btn-sm btn-primary"
                title="Publish directly to live LinkedIn feed right now"
              >
                <Send size={12} />
                <span>{publishingId === stats.nextScheduledPost.id ? 'Publishing...' : 'Publish Live Now'}</span>
              </button>
            )}

            <button
              onClick={() => handleCopyContent(stats.nextScheduledPost!)}
              className="btn btn-sm btn-secondary"
              title="Copy post content to clipboard"
            >
              {copiedId === stats.nextScheduledPost.id ? <Check size={12} color="var(--accent-2)" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="panel" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search topic, content, 1st comments, failure reasons, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'scheduled', 'draft', 'review', 'published'] as Array<'all' | PostStatus>).map((status) => {
            const isSel = selectedStatus === status;
            const conf = status !== 'all' ? STATUS_CONFIG[status] : null;
            const count =
              status === 'scheduled'
                ? stats?.scheduledCount
                : status === 'draft'
                ? stats?.draftCount
                : status === 'review'
                ? stats?.reviewCount
                : status === 'published'
                ? stats?.publishedCount
                : null;

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.75rem',
                  color: isSel ? '#12161C' : conf ? conf.color : 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {status === 'all' ? 'All Posts' : status === 'review' ? 'Needs Review' : status}
                {count !== null && count !== undefined && count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Tag Filter */}
        {stats?.topTags && stats.topTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '6px 10px', maxWidth: '160px' }}
          >
            <option value="all">All Hashtags</option>
            {stats.topTags.map((t) => (
              <option key={t.tag} value={t.tag}>
                {t.tag} ({t.count})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Posts Content Area */}
      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING LINKEDIN CONTENT QUEUE...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <Share2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No LinkedIn posts in your queue</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Draft, schedule, and measure your technical engineering posts and planned 1st comments.
          </p>
          <button onClick={handleOpenCreateDrawer} className="btn btn-primary">
            <Plus size={14} />
            <span>Create Your First Post</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
          {filteredPosts.map((post) => {
            const conf = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            const isScheduled = post.status === 'scheduled' && post.scheduledFor;
            const isPublished = post.status === 'published';
            const isReview = post.status === 'review';

            return (
              <div
                key={post.id}
                className="panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  border: `1px solid ${
                    isReview
                      ? 'rgba(224, 108, 117, 0.4)'
                      : post.status === 'scheduled'
                      ? 'rgba(232, 163, 61, 0.3)'
                      : 'var(--border)'
                  }`,
                  backgroundColor: 'var(--surface)',
                  transition: 'border-color 150ms ease, transform 150ms ease',
                }}
              >
                <div>
                  {/* Top: Status Pill + Scheduled / Published Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: conf.bg,
                          border: `1px solid ${conf.border}`,
                          color: conf.color,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {post.status === 'review' ? 'Needs Review' : post.status}
                      </span>

                      {(post.retryCount || 0) > 0 && post.status !== 'published' && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontFamily: 'JetBrains Mono',
                            color: (post.retryCount || 0) >= 3 ? '#E06C75' : 'var(--accent)',
                          }}
                        >
                          Retry {post.retryCount}/3
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                      {isScheduled
                        ? new Date(post.scheduledFor!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : isPublished && post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Failure Reason Alert for Review Queue */}
                  {isReview && post.failureReason && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(224, 108, 117, 0.08)',
                        border: '1px solid rgba(224, 108, 117, 0.3)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={13} color="#E06C75" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.74rem', color: '#E06C75', fontFamily: 'JetBrains Mono', lineHeight: '1.4' }}>
                        <strong>Reason:</strong> {post.failureReason}
                      </div>
                    </div>
                  )}

                  {/* Topic / Headline */}
                  {post.topic && (
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {post.topic}
                    </h4>
                  )}

                  {/* Content Preview */}
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '130px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {post.content}
                  </div>

                  {/* Scheduled 1st Comment Box */}
                  {post.firstComment && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg)',
                        border: `1px solid ${post.commentPosted ? 'rgba(95, 168, 160, 0.4)' : 'rgba(95, 168, 160, 0.25)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--accent-2)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                          <CornerDownRight size={11} />
                          <span>1ST COMMENT</span>
                          {post.commentPosted ? (
                            <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}>· LIVE ✅</span>
                          ) : post.commentScheduledFor ? (
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                              · {new Date(post.commentScheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : null}
                        </div>

                        <button
                          onClick={() => handleCopyComment(post)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '1px 5px', fontSize: '0.68rem' }}
                          title="Copy comment to clipboard"
                        >
                          {copiedCommentId === post.id ? <Check size={10} color="var(--accent-2)" /> : <Copy size={10} />}
                        </button>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.firstComment}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '0.68rem',
                            fontFamily: 'JetBrains Mono',
                            color: 'var(--accent)',
                            backgroundColor: 'rgba(232, 163, 61, 0.08)',
                            padding: '1px 6px',
                            borderRadius: '3px',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom: Metrics & Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isPublished ? (
                    <div style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)', fontSize: '0.74rem', fontFamily: 'JetBrains Mono' }}>
                      <span title="Impressions" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Eye size={12} color="var(--accent)" /> {post.impressions}
                      </span>
                      <span title="Reactions" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ThumbsUp size={12} color="var(--accent-2)" /> {post.reactions}
                      </span>
                      <span title="Comments" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MessageSquare size={12} /> {post.comments}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                      {post.content.length} chars
                    </span>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => setInspectingPost(post)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px' }}
                      title="Inspect & Verify details"
                    >
                      <Eye size={12} />
                    </button>

                    {post.postUrl && (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '4px 6px' }}
                        title="Open on LinkedIn"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}

                    <button
                      onClick={() => handleCopyContent(post)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px' }}
                      title="Copy post content"
                    >
                      {copiedId === post.id ? <Check size={12} color="var(--accent-2)" /> : <Copy size={12} />}
                    </button>

                    {/* Publish / Retry Live Now */}
                    {post.status !== 'published' && (
                      <button
                        onClick={() => handlePublishLiveNow(post)}
                        disabled={publishingId === post.id}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '4px 6px', color: isReview ? '#E06C75' : 'var(--accent)' }}
                        title={isReview ? 'Retry publishing to LinkedIn feed' : 'Publish directly to LinkedIn feed now'}
                      >
                        {isReview ? <RefreshCw size={12} /> : <Zap size={12} />}
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditDrawer(post)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px' }}
                      title="Edit"
                    >
                      <Edit3 size={12} />
                    </button>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px', color: 'var(--danger)' }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#0e1217', color: 'var(--text-muted)', fontFamily: 'Space Grotesk', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Topic & Content</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Schedule / 1st Comment</th>
                <th style={{ padding: '12px 16px' }}>Hashtags</th>
                <th style={{ padding: '12px 16px' }}>Engagements</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const conf = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                const isReview = post.status === 'review';

                return (
                  <tr key={post.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.topic || 'Untitled Post'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.content}
                      </div>
                      {isReview && post.failureReason && (
                        <div style={{ fontSize: '0.7rem', color: '#E06C75', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                          Error: {post.failureReason}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'JetBrains Mono',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: conf.bg,
                            border: `1px solid ${conf.border}`,
                            color: conf.color,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            display: 'inline-block',
                            width: 'fit-content',
                          }}
                        >
                          {post.status === 'review' ? 'Needs Review' : post.status}
                        </span>
                        {(post.retryCount || 0) > 0 && post.status !== 'published' && (
                          <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: (post.retryCount || 0) >= 3 ? '#E06C75' : 'var(--accent)' }}>
                            Retries: {post.retryCount}/3
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>
                        {post.scheduledFor
                          ? new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()}
                      </div>
                      {post.firstComment && (
                        <div style={{ fontSize: '0.68rem', color: post.commentPosted ? 'var(--accent-2)' : 'var(--text-muted)', marginTop: '2px', fontWeight: post.commentPosted ? 600 : 400 }}>
                          {post.commentPosted ? '✓ 1st Comment LIVE' : `+ 1st Comment (${post.commentScheduledFor ? new Date(post.commentScheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '+5m'})`}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {post.tags?.slice(0, 3).map((t) => (
                          <span key={t} style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {post.status === 'published' ? (
                        <span>{post.impressions} imp · {post.reactions + post.comments + post.reposts} eng</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          onClick={() => setInspectingPost(post)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Inspect post & 1st comment verification"
                        >
                          <Eye size={12} />
                        </button>
                        {post.status !== 'published' && (
                          <button
                            onClick={() => handlePublishLiveNow(post)}
                            disabled={publishingId === post.id}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '4px 6px', color: isReview ? '#E06C75' : 'var(--accent)' }}
                            title={isReview ? 'Retry publish' : 'Publish live now'}
                          >
                            {isReview ? <RefreshCw size={12} /> : <Zap size={12} />}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyContent(post)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Copy post content"
                        >
                          {copiedId === post.id ? <Check size={12} color="var(--accent-2)" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => handleOpenEditDrawer(post)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 6px' }}
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
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

      {/* POST INSPECTION & COMMENT VERIFICATION MODAL */}
      {inspectingPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setInspectingPost(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'JetBrains Mono',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: STATUS_CONFIG[inspectingPost.status]?.bg,
                      border: `1px solid ${STATUS_CONFIG[inspectingPost.status]?.border}`,
                      color: STATUS_CONFIG[inspectingPost.status]?.color,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {inspectingPost.status === 'review' ? 'Needs Review' : inspectingPost.status}
                  </span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Post ID #{inspectingPost.id}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                  {inspectingPost.topic || 'Untitled Technical Post'}
                </h3>
              </div>

              <button onClick={() => setInspectingPost(null)} className="btn btn-sm btn-secondary" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Diagnostic Alert Box (If in Review Queue or has Failure) */}
            {inspectingPost.failureReason && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'rgba(224, 108, 117, 0.08)',
                  border: '1px solid rgba(224, 108, 117, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E06C75', fontWeight: 600, fontSize: '0.86rem' }}>
                  <ShieldAlert size={16} />
                  <span>Failure Diagnostics & Review Reason</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#E06C75', lineHeight: '1.4' }}>
                  {inspectingPost.failureReason}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(224, 108, 117, 0.2)' }}>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Publish Attempts: {inspectingPost.retryCount || 0} / 3 | Comment Attempts: {inspectingPost.commentRetryCount || 0} / 3
                  </span>
                  {inspectingPost.status !== 'published' && (
                    <button
                      onClick={() => handlePublishLiveNow(inspectingPost)}
                      disabled={publishingId === inspectingPost.id}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <RefreshCw size={11} />
                      <span>{publishingId === inspectingPost.id ? 'Retrying...' : 'Retry Publish to LinkedIn'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Post Content Box */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', backgroundColor: 'var(--bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Post Body ({inspectingPost.content.length} characters)
                </span>
                <button
                  onClick={() => handleCopyContent(inspectingPost)}
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                >
                  {copiedId === inspectingPost.id ? <Check size={12} color="var(--accent-2)" /> : <Copy size={12} />}
                  <span>{copiedId === inspectingPost.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
                {inspectingPost.content}
              </div>

              {inspectingPost.tags && inspectingPost.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {inspectingPost.tags.map((t) => (
                    <span key={t} style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--accent)', backgroundColor: 'rgba(232, 163, 61, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 1ST COMMENT VERIFICATION & LIFECYCLE PANEL */}
            <div style={{ border: '1px solid rgba(95, 168, 160, 0.35)', borderRadius: 'var(--radius)', padding: '14px', backgroundColor: 'rgba(95, 168, 160, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CornerDownRight size={15} color="var(--accent-2)" />
                  <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--accent-2)', fontWeight: 700, textTransform: 'uppercase' }}>
                    1st Comment Verification & Status
                  </span>
                </div>

                {inspectingPost.commentPosted ? (
                  <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--accent-2)', fontWeight: 700, padding: '2px 8px', backgroundColor: 'rgba(95, 168, 160, 0.15)', borderRadius: '4px', border: '1px solid rgba(95, 168, 160, 0.4)' }}>
                    ✓ POSTED LIVE ON LINKEDIN
                  </span>
                ) : inspectingPost.status === 'published' && inspectingPost.firstComment ? (
                  <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--accent)', padding: '2px 8px', backgroundColor: 'rgba(232, 163, 61, 0.12)', borderRadius: '4px', border: '1px solid rgba(232, 163, 61, 0.3)' }}>
                    ⏳ QUEUED FOR DISPATCH ({inspectingPost.commentRetryCount || 0}/3)
                  </span>
                ) : inspectingPost.firstComment ? (
                  <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                    Scheduled with post
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                    No Comment Planned
                  </span>
                )}
              </div>

              {inspectingPost.firstComment ? (
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: '1.4', marginBottom: '10px' }}>
                    {inspectingPost.firstComment}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                      {inspectingPost.commentPosted && inspectingPost.commentPublishedAt
                        ? `Published at: ${new Date(inspectingPost.commentPublishedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                        : inspectingPost.commentScheduledFor
                        ? `Delivery target: ${new Date(inspectingPost.commentScheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                        : 'Delivery target: +5m after post'}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopyComment(inspectingPost)}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {copiedCommentId === inspectingPost.id ? <Check size={11} color="var(--accent-2)" /> : <Copy size={11} />}
                        <span>{copiedCommentId === inspectingPost.id ? 'Copied' : 'Copy 1st'}</span>
                      </button>

                      {inspectingPost.status === 'published' && !inspectingPost.commentPosted && (
                        <button
                          onClick={() => handlePublishCommentNow(inspectingPost)}
                          disabled={commentingId === inspectingPost.id}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <Send size={11} />
                          <span>{commentingId === inspectingPost.id ? 'Posting...' : 'Post Comment Live Now'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  No first comment was drafted for this post. You can edit the post to add follow-up links or resources.
                </div>
              )}
            </div>

            {/* Live LinkedIn Link & Telemetry */}
            {inspectingPost.status === 'published' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '14px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span><Eye size={12} color="var(--accent)" /> {inspectingPost.impressions} Views</span>
                  <span><ThumbsUp size={12} color="var(--accent-2)" /> {inspectingPost.reactions} Reactions</span>
                  <span><MessageSquare size={12} /> {inspectingPost.comments} Comments</span>
                </div>

                {inspectingPost.postUrl && (
                  <a
                    href={inspectingPost.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <span>View on LinkedIn</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => {
                  const p = inspectingPost;
                  setInspectingPost(null);
                  handleOpenEditDrawer(p);
                }}
                className="btn btn-secondary"
              >
                <Edit3 size={13} />
                <span>Edit Post</span>
              </button>
              <button onClick={() => setInspectingPost(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Creator / Editor Slide-over Drawer */}
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
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              height: '100vh',
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Top Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0e1217',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  {editingPostId ? 'Edit LinkedIn Post' : 'Create LinkedIn Post'}
                </h3>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="btn btn-sm btn-secondary" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {validationError && (
                <div className="auth-banner failed" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{validationError}</span>
                  </div>
                </div>
              )}

              <form id="linkedin-post-form" onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Topic / Hook */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Topic / Hook Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Why we replaced Redis locks with PostgreSQL advisory locks"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Content Body */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="stat-label" style={{ margin: 0 }}>
                      Post Content *
                    </label>
                    <span className="mono" style={{ fontSize: '0.72rem', color: formContent.length > 2800 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {formContent.length} / 3000 chars
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    required
                    placeholder="Write your insightful breakdown, architecture diagram explanation, or career lesson..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    style={{ width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Status & Post Schedule Date / Time */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', backgroundColor: 'var(--bg)' }}>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Post Lifecycle & Schedule Time (Max 3 Auto-Retries)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                        Lifecycle Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as PostStatus)}
                        style={{ width: '100%' }}
                      >
                        <option value="draft">Draft (Incubation)</option>
                        <option value="scheduled">Scheduled (Queue)</option>
                        <option value="review">Needs Review (Failed / Issue)</option>
                        <option value="published">Published (Live)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                        Post Publish Time (IST)
                      </label>
                      <TimePicker
                        value={formScheduledTime}
                        onChange={(t) => setFormScheduledTime(t)}
                        placeholder="Select post time"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Post Publish Date
                    </label>
                    <DatePicker
                      value={formScheduledDate}
                      onChange={(d) => setFormScheduledDate(d)}
                      placeholder="Select schedule date for post"
                    />
                  </div>
                </div>

                {/* Scheduled 1st Comment Section (Future of Post Time) */}
                <div style={{ border: '1px solid rgba(95, 168, 160, 0.35)', borderRadius: 'var(--radius)', padding: '12px', backgroundColor: 'rgba(95, 168, 160, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CornerDownRight size={14} color="var(--accent-2)" />
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent-2)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Scheduled 1st Comment (Links / Extra Takeaways)
                      </span>
                    </div>

                    {computedCommentTime && (
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-2)' }}>
                        Delivery: {computedCommentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '8px' }}>
                    Add resource links or code repositories in the first comment to optimize LinkedIn post reach. Comment timing must be in the future of the post date.
                  </p>

                  <textarea
                    rows={3}
                    placeholder="e.g. 🔗 Full architecture repository & diagrams available here: github.com/vyshnavpc/pulse_v3. Let me know your thoughts!"
                    value={formFirstComment}
                    onChange={(e) => setFormFirstComment(e.target.value)}
                    style={{ width: '100%', marginBottom: '10px', fontSize: '0.82rem' }}
                  />

                  {/* Comment Schedule Date & Time Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="stat-label" style={{ margin: 0, color: 'var(--accent-2)' }}>
                        Comment Publish Date & Time
                      </label>
                      {computedCommentTime && (
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-2)', fontWeight: 600 }}>
                          Will post: {computedCommentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {computedCommentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Preset Timing Offsets */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {COMMENT_PRESETS.map((preset) => (
                        <button
                          key={preset.minutes}
                          type="button"
                          onClick={() => {
                            setFormCommentOffsetMins(preset.minutes);
                            setIsCustomCommentTime(false);
                          }}
                          className={`btn btn-sm ${!isCustomCommentTime && formCommentOffsetMins === preset.minutes ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {preset.label} after post
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCommentTime(true);
                          if (formScheduledDate) {
                            setFormCommentCustomDate(formScheduledDate);
                          }
                        }}
                        className={`btn btn-sm ${isCustomCommentTime ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        Custom Date & Time
                      </button>
                    </div>

                    {/* Explicit Custom Date & Time Pickers */}
                    {isCustomCommentTime && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px', padding: '8px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div>
                          <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>
                            Comment Date *
                          </label>
                          <DatePicker
                            value={formCommentCustomDate}
                            onChange={(d) => setFormCommentCustomDate(d)}
                            placeholder="Select comment date"
                          />
                        </div>

                        <div>
                          <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>
                            Comment Time (IST) *
                          </label>
                          <TimePicker
                            value={formCommentCustomTime}
                            onChange={(t) => setFormCommentCustomTime(t)}
                            accentColor="var(--accent-2)"
                            placeholder="Select comment time"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hashtag Quick Inserter */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Hashtags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="#SystemDesign, #SoftwareEngineering, #NestJS"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    style={{ width: '100%', marginBottom: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {SUGGESTED_HASHTAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddHashtag(tag)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--accent)',
                          fontSize: '0.68rem',
                          fontFamily: 'JetBrains Mono',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Published Post Telemetry */}
                {formStatus === 'published' && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', backgroundColor: 'var(--bg)' }}>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-2)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                      Live Performance Metrics
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Impressions</label>
                        <input
                          type="number"
                          min="0"
                          value={formImpressions}
                          onChange={(e) => setFormImpressions(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Reactions</label>
                        <input
                          type="number"
                          min="0"
                          value={formReactions}
                          onChange={(e) => setFormReactions(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Comments</label>
                        <input
                          type="number"
                          min="0"
                          value={formComments}
                          onChange={(e) => setFormComments(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>Reposts</label>
                        <input
                          type="number"
                          min="0"
                          value={formReposts}
                          onChange={(e) => setFormReposts(Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="stat-label" style={{ display: 'block', marginBottom: '4px' }}>LinkedIn Post Live URL</label>
                      <input
                        type="url"
                        placeholder="https://www.linkedin.com/posts/..."
                        value={formPostUrl}
                        onChange={(e) => setFormPostUrl(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Strategy Notes */}
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Strategy Notes / Visual Assets Reference
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Attach high-res architecture SVG diagram, tag @NestJS community..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </form>
            </div>

            {/* Fixed Sticky Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                backgroundColor: '#0e1217',
                display: 'flex',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="submit"
                form="linkedin-post-form"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingPostId ? 'Update Post' : 'Schedule / Save Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
