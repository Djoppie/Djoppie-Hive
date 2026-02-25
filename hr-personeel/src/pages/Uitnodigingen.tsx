import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Send,
  Trash2,
  Users,
  Calendar,
  Mail,
  PartyPopper,
  Megaphone,
  GraduationCap,
  MessageCircle,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Cloud,
  Zap,
  User,
  Search,
} from 'lucide-react';
import { eventsApi, unifiedGroupsApi } from '../services/api';
import type {
  EventDTO,
  EventDetailDTO,
  EventTypeAPI,
  EventFilterCriteria,
  CreateEventRequest,
  UpdateEventRequest,
  EventRecipientsPreview,
  UnifiedGroup,
  GroupSource,
} from '../types';

const typeIcons: Record<EventTypeAPI, typeof PartyPopper> = {
  Personeelsfeest: PartyPopper,
  Vergadering: Users,
  Training: GraduationCap,
  Communicatie: Megaphone,
  Overig: MessageCircle,
};

const typeLabels: Record<EventTypeAPI, string> = {
  Personeelsfeest: 'Personeelsfeest',
  Vergadering: 'Vergadering',
  Training: 'Training',
  Communicatie: 'Communicatie',
  Overig: 'Overig',
};

const sourceIcons: Record<GroupSource, typeof Cloud> = {
  Exchange: Cloud,
  Dynamic: Zap,
  Local: User,
};


export default function Uitnodigingen() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unifiedGroups, setUnifiedGroups] = useState<UnifiedGroup[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDTO | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventDetailDTO | null>(null);
  const [recipientPreview, setRecipientPreview] = useState<EventRecipientsPreview | null>(null);

  const [copiedEmails, setCopiedEmails] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState<'all' | GroupSource>('all');

  const [formData, setFormData] = useState<{
    titel: string;
    beschrijving: string;
    datum: string;
    type: EventTypeAPI;
    filterCriteria: EventFilterCriteria;
    selectedGroupIds: string[];
  }>({
    titel: '',
    beschrijving: '',
    datum: '',
    type: 'Personeelsfeest',
    filterCriteria: {
      alleenActief: true,
      sectoren: [],
      employeeTypes: [],
      arbeidsRegimes: [],
    },
    selectedGroupIds: [],
  });

  // Group unified groups by source
  const groupsBySource = useMemo(() => {
    const result: Record<GroupSource, UnifiedGroup[]> = {
      Exchange: [],
      Dynamic: [],
      Local: [],
    };
    unifiedGroups.forEach(g => {
      result[g.source].push(g);
    });
    return result;
  }, [unifiedGroups]);

  // Filter groups by search term and type filter
  const filteredGroupsBySource = useMemo(() => {
    const term = groupSearchTerm.toLowerCase().trim();

    const filterGroups = (groups: UnifiedGroup[]) => {
      if (!term) return groups;
      return groups.filter(g => g.displayName.toLowerCase().includes(term));
    };

    return {
      Exchange: groupTypeFilter === 'all' || groupTypeFilter === 'Exchange'
        ? filterGroups(groupsBySource.Exchange)
        : [],
      Dynamic: groupTypeFilter === 'all' || groupTypeFilter === 'Dynamic'
        ? filterGroups(groupsBySource.Dynamic)
        : [],
      Local: groupTypeFilter === 'all' || groupTypeFilter === 'Local'
        ? filterGroups(groupsBySource.Local)
        : [],
    };
  }, [groupsBySource, groupSearchTerm, groupTypeFilter]);

  // Load events and groups on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update recipient preview when filters change
  useEffect(() => {
    if (modalOpen) {
      updateRecipientPreview();
    }
  }, [formData.filterCriteria, formData.selectedGroupIds, modalOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, groupsData] = await Promise.all([
        eventsApi.getAll(),
        unifiedGroupsApi.getAll(),
      ]);
      setEvents(eventsData);
      setUnifiedGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon gegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateRecipientPreview = async () => {
    try {
      if (formData.selectedGroupIds.length > 0) {
        // Use unified groups preview
        const preview = await unifiedGroupsApi.getPreview(formData.selectedGroupIds);
        setRecipientPreview({
          totaalAantal: preview.totalUniqueMembers,
          voorbeeldOntvangers: preview.sampleMembers.map(m => ({
            employeeId: m.id,
            displayName: m.displayName,
            email: m.email,
            jobTitle: m.jobTitle ?? undefined,
            emailVerstuurd: false,
          })),
        });
      } else {
        // Use filter-based preview
        const preview = await eventsApi.previewOntvangers(formData.filterCriteria);
        setRecipientPreview(preview);
      }
    } catch {
      setRecipientPreview(null);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Only use Exchange group IDs for distributieGroepId (FK constraint)
      // Local/Dynamic groups have prefixes and can't be used as FK
      const exchangeGroupId = formData.selectedGroupIds.find(id =>
        !id.startsWith('local:') && !id.startsWith('dynamic:')
      );

      const request: CreateEventRequest = {
        titel: formData.titel,
        beschrijving: formData.beschrijving,
        datum: formData.datum,
        type: formData.type,
        filterCriteria: formData.selectedGroupIds.length > 0 ? undefined : formData.filterCriteria,
        // Only Exchange groups can be stored (FK to DistributionGroups table)
        distributieGroepId: exchangeGroupId || undefined,
      };

      await eventsApi.create(request);
      await loadData();

      setModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon event niet aanmaken');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEvent) return;

    setLoading(true);
    setError(null);

    try {
      // Only use Exchange group IDs for distributieGroepId (FK constraint)
      const exchangeGroupId = formData.selectedGroupIds.find(id =>
        !id.startsWith('local:') && !id.startsWith('dynamic:')
      );

      const request: UpdateEventRequest = {
        titel: formData.titel,
        beschrijving: formData.beschrijving,
        datum: formData.datum,
        type: formData.type,
        filterCriteria: formData.selectedGroupIds.length > 0 ? undefined : formData.filterCriteria,
        distributieGroepId: exchangeGroupId || undefined,
      };

      await eventsApi.update(editingEvent.id, request);
      await loadData();

      setModalOpen(false);
      setEditingEvent(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon event niet bijwerken');
    } finally {
      setLoading(false);
    }
  };

  const handleVerstuur = async (id: string) => {
    if (!window.confirm('Weet u zeker dat u deze uitnodiging wilt versturen?')) {
      return;
    }

    setLoading(true);
    try {
      await eventsApi.versturen(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon event niet versturen');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Weet u zeker dat u deze uitnodiging wilt annuleren?')) {
      return;
    }

    setLoading(true);
    try {
      await eventsApi.annuleren(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon event niet annuleren');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPreview = async (id: string) => {
    try {
      const detail = await eventsApi.getById(id);
      setPreviewEvent(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon preview niet laden');
    }
  };

  const handleEdit = (event: EventDTO) => {
    setEditingEvent(event);
    setFormData({
      titel: event.titel,
      beschrijving: event.beschrijving,
      datum: event.datum.split('T')[0],
      type: event.type,
      filterCriteria: event.filterCriteria || { alleenActief: true },
      selectedGroupIds: event.distributieGroepId ? [event.distributieGroepId] : [],
    });
    setModalOpen(true);
  };

  const handleOpenInOutlook = async () => {
    if (!previewEvent || previewEvent.deelnemers.length === 0) return;

    try {
      // Get mailto link from API for selected groups or generate from preview
      if (formData.selectedGroupIds.length > 0) {
        const result = await unifiedGroupsApi.getMailtoLink(
          formData.selectedGroupIds,
          previewEvent.titel
        );
        window.location.href = result.mailtoLink;
      } else {
        // Generate mailto from preview recipients
        const emails = previewEvent.deelnemers.map(d => d.email).slice(0, 50);
        const subject = encodeURIComponent(previewEvent.titel);
        const mailtoLink = `mailto:${emails.join(',')}?subject=${subject}`;
        window.location.href = mailtoLink;
      }
    } catch (err) {
      console.error('Failed to open in Outlook:', err);
      // Fallback: just use the emails from preview
      const emails = previewEvent.deelnemers.map(d => d.email).slice(0, 50);
      const subject = encodeURIComponent(previewEvent.titel);
      window.location.href = `mailto:${emails.join(',')}?subject=${subject}`;
    }
  };

  const handleCopyEmails = async () => {
    if (!previewEvent) return;

    const emails = previewEvent.deelnemers.map(d => d.email).join(', ');
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = emails;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({
      titel: '',
      beschrijving: '',
      datum: '',
      type: 'Personeelsfeest',
      filterCriteria: { alleenActief: true, sectoren: [], employeeTypes: [], arbeidsRegimes: [] },
      selectedGroupIds: [],
    });
    setRecipientPreview(null);
    setEditingEvent(null);
    setGroupSearchTerm('');
    setGroupTypeFilter('all');
  };

  const toggleGroupSelection = (groupId: string) => {
    setFormData(prev => {
      const current = prev.selectedGroupIds;
      const updated = current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId];
      return { ...prev, selectedGroupIds: updated };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Evenementen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Uitnodigingen & Communicatie</h1>
          <p className="page-subtitle">
            Verstuur uitnodigingen voor het personeelsfeest, vergaderingen en andere communicatie
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nieuwe Uitnodiging
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={() => setError(null)}>Sluiten</button>
        </div>
      )}

      {/* Event cards */}
      <div className="invitations-grid">
        {events.map(event => {
          const Icon = typeIcons[event.type];
          return (
            <div key={event.id} className={`invitation-card invitation-${event.status.toLowerCase()}`}>
              <div className="invitation-header">
                <div className="invitation-icon">
                  <Icon size={24} />
                </div>
                <div className="invitation-meta">
                  <span className={`invitation-status status-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                  <span className="invitation-type">{typeLabels[event.type]}</span>
                </div>
              </div>

              <h3 className="invitation-title">{event.titel}</h3>
              <p className="invitation-desc">{event.beschrijving}</p>

              <div className="invitation-details">
                <div className="invitation-detail">
                  <Calendar size={14} />
                  <span>{formatDate(event.datum)}</span>
                </div>
                <div className="invitation-detail">
                  <Users size={14} />
                  <span>{event.aantalDeelnemers} ontvangers</span>
                </div>
                {event.distributieGroepNaam && (
                  <div className="invitation-detail">
                    <Mail size={14} />
                    <span>{event.distributieGroepNaam}</span>
                  </div>
                )}
                {event.verstuurdOp && (
                  <div className="invitation-detail">
                    <Send size={14} />
                    <span>Verstuurd op {formatDate(event.verstuurdOp)}</span>
                  </div>
                )}
              </div>

              <div className="invitation-actions">
                <button
                  className="icon-btn"
                  title="Voorbeeld"
                  onClick={() => handleShowPreview(event.id)}
                >
                  <Eye size={16} />
                </button>
                {event.status === 'Concept' && (
                  <>
                    <button
                      className="icon-btn"
                      title="Bewerken"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleVerstuur(event.id)}
                      disabled={loading}
                    >
                      <Send size={14} /> Versturen
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Annuleren"
                      onClick={() => handleDelete(event.id)}
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="empty-state-card">
            <Mail size={48} className="text-muted" />
            <p>Nog geen uitnodigingen aangemaakt.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Eerste uitnodiging maken
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewEvent && (
        <div className="modal-overlay" onClick={() => setPreviewEvent(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Voorbeeld: {previewEvent.titel}</h2>
              <button className="icon-btn" onClick={() => setPreviewEvent(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="preview-content">
              <div className="preview-email">
                <div className="preview-email-header">
                  <strong>Van:</strong> hr@diepenbeek.be
                </div>
                <div className="preview-email-header">
                  <strong>Aan:</strong> {previewEvent.deelnemers.length} ontvangers
                </div>
                <div className="preview-email-header">
                  <strong>Onderwerp:</strong> {previewEvent.titel}
                </div>
                <hr />
                <div className="preview-email-body">
                  <p>Beste collega,</p>
                  <p>{previewEvent.beschrijving}</p>
                  <p>
                    <strong>Datum:</strong> {formatDate(previewEvent.datum)}
                  </p>
                  <p>Met vriendelijke groeten,<br />HR Gemeente Diepenbeek</p>
                </div>
              </div>

              {/* Outlook export buttons */}
              <div className="preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleOpenInOutlook}
                  title={previewEvent.deelnemers.length > 50 ? 'Maximaal 50 ontvangers in mailto link' : undefined}
                >
                  <ExternalLink size={14} /> Open in Outlook
                  {previewEvent.deelnemers.length > 50 && (
                    <span className="btn-warning-badge">max 50</span>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyEmails}
                >
                  {copiedEmails ? (
                    <>
                      <Check size={14} /> Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Kopieer e-mails
                    </>
                  )}
                </button>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Ontvangers ({previewEvent.deelnemers.length})</h3>
              <div className="preview-recipients">
                {previewEvent.deelnemers.slice(0, 10).map(d => (
                  <div key={d.employeeId} className="preview-recipient">
                    <span>{d.displayName}</span>
                    <span className="text-muted">{d.email}</span>
                  </div>
                ))}
                {previewEvent.deelnemers.length > 10 && (
                  <p className="text-muted">
                    ... en {previewEvent.deelnemers.length - 10} anderen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); resetForm(); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Uitnodiging Bewerken' : 'Nieuwe Uitnodiging'}</h2>
              <button className="icon-btn" onClick={() => { setModalOpen(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="titel">Titel *</label>
                  <input
                    id="titel"
                    type="text"
                    required
                    value={formData.titel}
                    onChange={e => setFormData(prev => ({ ...prev, titel: e.target.value }))}
                    placeholder="bijv. Personeelsfeest 2026"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as EventTypeAPI }))}
                  >
                    <option value="Personeelsfeest">Personeelsfeest</option>
                    <option value="Vergadering">Vergadering</option>
                    <option value="Training">Training</option>
                    <option value="Communicatie">Communicatie</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="datum">Datum *</label>
                <input
                  id="datum"
                  type="date"
                  required
                  value={formData.datum}
                  onChange={e => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="beschrijving">Beschrijving *</label>
                <textarea
                  id="beschrijving"
                  rows={4}
                  required
                  value={formData.beschrijving}
                  onChange={e => setFormData(prev => ({ ...prev, beschrijving: e.target.value }))}
                  placeholder="Beschrijf het evenement of de communicatie..."
                />
              </div>

              <h3 className="form-section-title">Ontvangers selecteren</h3>

              <div className="form-group">
                <label>Groepen (meerdere selecteerbaar)</label>

                {/* Type filter tabs */}
                <div className="groups-type-tabs">
                  <button
                    type="button"
                    className={`groups-type-tab ${groupTypeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setGroupTypeFilter('all')}
                  >
                    Alle
                    <span className="tab-count">{unifiedGroups.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`groups-type-tab tab-exchange ${groupTypeFilter === 'Exchange' ? 'active' : ''}`}
                    onClick={() => setGroupTypeFilter('Exchange')}
                  >
                    <Cloud size={14} />
                    Exchange
                    <span className="tab-count">{groupsBySource.Exchange.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`groups-type-tab tab-dynamic ${groupTypeFilter === 'Dynamic' ? 'active' : ''}`}
                    onClick={() => setGroupTypeFilter('Dynamic')}
                  >
                    <Zap size={14} />
                    Dynamisch
                    <span className="tab-count">{groupsBySource.Dynamic.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`groups-type-tab tab-local ${groupTypeFilter === 'Local' ? 'active' : ''}`}
                    onClick={() => setGroupTypeFilter('Local')}
                  >
                    <User size={14} />
                    Lokaal
                    <span className="tab-count">{groupsBySource.Local.length}</span>
                  </button>
                </div>

                {/* Search input - outside the scrollable area */}
                <div className="groups-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Zoek groepen..."
                    value={groupSearchTerm}
                    onChange={e => setGroupSearchTerm(e.target.value)}
                  />
                  {groupSearchTerm && (
                    <button
                      type="button"
                      className="groups-search-clear"
                      onClick={() => setGroupSearchTerm('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="groups-selector">
                  {/* Exchange Groups */}
                  {filteredGroupsBySource.Exchange.length > 0 && (
                    <div className="groups-section section-exchange">
                      <div className="groups-section-header">
                        <Cloud size={14} /> Exchange Groepen ({filteredGroupsBySource.Exchange.length})
                      </div>
                      <div className="groups-list">
                        {filteredGroupsBySource.Exchange.map(g => {
                          const SourceIcon = sourceIcons[g.source];
                          const isSelected = formData.selectedGroupIds.includes(g.id);
                          return (
                            <label key={g.id} className={`group-checkbox ${isSelected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGroupSelection(g.id)}
                              />
                              <SourceIcon size={12} />
                              <span className="group-name">{g.displayName}</span>
                              <span className="group-count">{g.memberCount}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Groups */}
                  {filteredGroupsBySource.Dynamic.length > 0 && (
                    <div className="groups-section section-dynamic">
                      <div className="groups-section-header">
                        <Zap size={14} /> Dynamische Groepen ({filteredGroupsBySource.Dynamic.length})
                      </div>
                      <div className="groups-list">
                        {filteredGroupsBySource.Dynamic.map(g => {
                          const SourceIcon = sourceIcons[g.source];
                          const isSelected = formData.selectedGroupIds.includes(g.id);
                          return (
                            <label key={g.id} className={`group-checkbox ${isSelected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGroupSelection(g.id)}
                              />
                              <SourceIcon size={12} />
                              <span className="group-name">{g.displayName}</span>
                              <span className="group-count">{g.memberCount}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Local Groups */}
                  {filteredGroupsBySource.Local.length > 0 && (
                    <div className="groups-section section-local">
                      <div className="groups-section-header">
                        <User size={14} /> Lokale Groepen ({filteredGroupsBySource.Local.length})
                      </div>
                      <div className="groups-list">
                        {filteredGroupsBySource.Local.map(g => {
                          const SourceIcon = sourceIcons[g.source];
                          const isSelected = formData.selectedGroupIds.includes(g.id);
                          return (
                            <label key={g.id} className={`group-checkbox ${isSelected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGroupSelection(g.id)}
                              />
                              <SourceIcon size={12} />
                              <span className="group-name">{g.displayName}</span>
                              <span className="group-count">{g.memberCount}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No results message */}
                  {groupSearchTerm &&
                   filteredGroupsBySource.Exchange.length === 0 &&
                   filteredGroupsBySource.Dynamic.length === 0 &&
                   filteredGroupsBySource.Local.length === 0 && (
                    <div className="groups-no-results">
                      <Search size={24} />
                      <p>Geen groepen gevonden voor "{groupSearchTerm}"</p>
                    </div>
                  )}
                </div>
                <span className="form-hint">
                  Selecteer een of meerdere groepen. Dubbele ontvangers worden automatisch gefilterd.
                </span>
              </div>

              {formData.selectedGroupIds.length === 0 && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.filterCriteria.alleenActief ?? true}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          filterCriteria: { ...prev.filterCriteria, alleenActief: e.target.checked },
                        }))
                      }
                    />
                    Alleen actieve medewerkers (wanneer geen groep geselecteerd)
                  </label>
                </div>
              )}

              {/* Selected groups chips */}
              {formData.selectedGroupIds.length > 0 && (
                <div className="selected-groups">
                  <label>Geselecteerde groepen:</label>
                  <div className="selected-groups-list">
                    {formData.selectedGroupIds.map(id => {
                      const group = unifiedGroups.find(g => g.id === id);
                      if (!group) return null;
                      const SourceIcon = sourceIcons[group.source];
                      return (
                        <div key={id} className={`selected-group-chip chip-${group.source.toLowerCase()}`}>
                          <SourceIcon size={12} />
                          <span>{group.displayName}</span>
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={() => toggleGroupSelection(id)}
                            title="Verwijderen"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="recipient-preview">
                <Users size={18} />
                <strong>{recipientPreview?.totaalAantal ?? 0}</strong> unieke ontvangers
                {formData.selectedGroupIds.length > 1 && (
                  <span className="text-muted" style={{ marginLeft: 8 }}>
                    ({formData.selectedGroupIds.length} groepen)
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={editingEvent ? handleUpdate : handleCreate}
                  disabled={!formData.titel || !formData.datum || !formData.beschrijving || loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> {editingEvent ? 'Opslaan...' : 'Aanmaken...'}
                    </>
                  ) : (
                    editingEvent ? 'Wijzigingen Opslaan' : 'Uitnodiging Aanmaken'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Type filter tabs */
        .groups-type-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .groups-type-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          background: var(--surface);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }

        .groups-type-tab:hover {
          background: var(--surface-hover);
          border-color: var(--border-color);
        }

        .groups-type-tab.active {
          background: var(--primary-main);
          color: white;
          border-color: var(--primary-main);
        }

        .groups-type-tab.tab-exchange.active {
          background: #0078d4;
          border-color: #0078d4;
        }

        .groups-type-tab.tab-dynamic.active {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }

        .groups-type-tab.tab-local.active {
          background: #10b981;
          border-color: #10b981;
        }

        .tab-count {
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .groups-type-tab:not(.active) .tab-count {
          background: var(--surface-elevated);
        }

        /* Groups selector container */
        .groups-selector {
          background: var(--surface-elevated);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          max-height: 320px;
          overflow-y: auto;
        }

        .groups-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .groups-search input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          outline: none;
        }

        .groups-search input::placeholder {
          color: var(--text-secondary);
        }

        .groups-search-clear {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .groups-search-clear:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }

        .groups-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          color: var(--text-secondary);
          text-align: center;
        }

        .groups-no-results p {
          margin: 0;
          font-size: 14px;
        }

        /* Group sections with colored headers */
        .groups-section {
          margin-bottom: 16px;
          border-radius: 8px;
          overflow: hidden;
        }

        .groups-section:last-child {
          margin-bottom: 0;
        }

        .groups-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 12px;
          margin: 0 -12px;
          border-radius: 6px;
        }

        .groups-section:first-child .groups-section-header {
          margin-top: 0;
        }

        .section-exchange .groups-section-header {
          background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
        }

        .section-dynamic .groups-section-header {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .section-local .groups-section-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .groups-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 8px;
        }

        .group-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .group-checkbox:hover {
          background: var(--surface-hover);
        }

        .group-checkbox.selected {
          background: var(--primary-light);
          border-color: var(--primary-main);
        }

        .group-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-main);
        }

        .group-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
        }

        .group-count {
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--surface);
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 500;
        }

        /* Selected groups chips */
        .selected-groups {
          margin-top: 12px;
        }

        .selected-groups label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }

        .selected-groups-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .selected-group-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          background: var(--primary-main);
        }

        .selected-group-chip.chip-exchange {
          background: #0078d4;
        }

        .selected-group-chip.chip-dynamic {
          background: #8b5cf6;
        }

        .selected-group-chip.chip-local {
          background: #10b981;
        }

        .chip-remove {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          padding: 0;
          margin-left: 2px;
          transition: background 0.15s ease;
        }

        .chip-remove:hover {
          background: rgba(255,255,255,0.4);
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .btn-warning-badge {
          margin-left: 6px;
          font-size: 10px;
          background: var(--warning-main);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
