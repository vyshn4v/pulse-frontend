import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  Trash2,
  Edit2,
  Briefcase,
  X,
  UserCheck,
  FileText,
} from 'lucide-react';

interface HRContact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  jobApplications?: Array<{
    id: number;
    company: string;
    role: string;
    status: string;
    appliedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const HRDetails: React.FC = () => {
  const [contacts, setContacts] = useState<HRContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr-details', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch HR details:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormNotes('');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (contact: HRContact) => {
    setEditingId(contact.id);
    setFormName(contact.name || '');
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormCompany(contact.company || '');
    setFormNotes(contact.notes || '');
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      phone: formPhone.trim(),
      company: formCompany.trim(),
      notes: formNotes.trim(),
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/hr-details/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setContacts((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to update HR contact.');
        }
      } else {
        const res = await fetch('/api/hr-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setContacts((prev) => [created, ...prev]);
          closeDrawer();
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.message || 'Failed to create HR contact.');
        }
      }
    } catch (err) {
      setFormError('Network error saving HR contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!window.confirm('Delete this HR contact? Any linked applications will remain intact.')) return;

    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/hr-details/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to delete HR contact:', err);
      fetchContacts();
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q),
    );
  }, [contacts, searchQuery]);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/" className="back-btn" title="Back to Instrument Panel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="dashboard-subtitle">Recruiter Contacts</p>
            <h2>HR & Talent Roster</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>{contacts.length} RECRUITERS INDEXED</span>
          </div>
          <button onClick={openCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Add HR Contact</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="panel" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by recruiter name, email, company, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="mono" style={{ color: 'var(--accent-2)' }}>LOADING HR ROSTER...</div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <Users size={36} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No HR contacts found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {searchQuery
              ? 'No recruiter matches your active search query.'
              : 'HR contacts will be automatically indexed as you log job applications with recruiter emails, or you can add them directly.'}
          </p>
          <button onClick={openCreateDrawer} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Recruiter Contact</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {filteredContacts.map((contact) => {
            const initial = (contact.name || contact.email || 'H').charAt(0).toUpperCase();
            const appCount = contact.jobApplications?.length || 0;

            return (
              <div key={contact.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#12161c',
                        border: '1px solid var(--border)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontFamily: 'Space Grotesk',
                      }}
                    >
                      {initial}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 600 }}>{contact.name || 'Unnamed Recruiter'}</h4>
                      {contact.company && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.75rem', marginTop: '2px' }}>
                          <Building2 size={12} />
                          <span>{contact.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => openEditDrawer(contact)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px' }}
                      title="Edit contact"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 6px', color: 'var(--danger)' }}
                      title="Delete contact"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <a
                    href={`mailto:${contact.email}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none' }}
                    className="hover-accent"
                  >
                    <Mail size={13} color="var(--accent-2)" />
                    <span className="mono" style={{ fontSize: '0.78rem' }}>{contact.email}</span>
                  </a>

                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none' }}
                      className="hover-accent"
                    >
                      <Phone size={13} color="var(--accent-2)" />
                      <span className="mono" style={{ fontSize: '0.78rem' }}>{contact.phone}</span>
                    </a>
                  )}
                </div>

                {contact.notes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    "{contact.notes}"
                  </p>
                )}

                {/* Linked Applications */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    <Briefcase size={12} color="var(--accent)" />
                    <span>{appCount} {appCount === 1 ? 'Linked Application' : 'Linked Applications'}</span>
                  </div>

                  {appCount > 0 && (
                    <Link
                      to="/job-pipeline"
                      style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}
                    >
                      View Pipeline →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Drawer for Add/Edit Contact */}
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
              maxWidth: '440px',
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
                  <UserCheck size={18} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.15rem' }}>
                    {editingId ? 'Edit HR Contact' : 'New HR Contact'}
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

              <form id="hr-form" onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Recruiter Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. s.jenkins@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe, OpenAI, Meta..."
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Notes / Communication History
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Technical recruiter for Infrastructure team; preferred contact on LinkedIn."
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
                form="hr-form"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Contact' : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
