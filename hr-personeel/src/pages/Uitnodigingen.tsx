import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { eventsApi, distributionGroupsApi } from '../services/api';
import type {
  EventDTO,
  EventDetailDTO,
  EventTypeAPI,
  EventFilterCriteria,
  CreateEventRequest,
  EventRecipientsPreview,
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

interface DistributionGroupOption {
  id: string;
  displayName: string;
  memberCount: number;
}

export default function Uitnodigingen() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributionGroups, setDistributionGroups] = useState<DistributionGroupOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<EventDetailDTO | null>(null);
  const [recipientPreview, setRecipientPreview] = useState<EventRecipientsPreview | null>(null);

  const [formData, setFormData] = useState<{
    titel: string;
    beschrijving: string;
    datum: string;
    type: EventTypeAPI;
    filterCriteria: EventFilterCriteria;
    distributieGroepId: string;
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
    distributieGroepId: '',
  });

  // Load events and distribution groups on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update recipient preview when filters change
  useEffect(() => {
    if (modalOpen) {
      updateRecipientPreview();
    }
  }, [formData.filterCriteria, formData.distributieGroepId, modalOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, groupsData] = await Promise.all([
        eventsApi.getAll(),
        distributionGroupsApi.getAll(),
      ]);
      setEvents(eventsData);
      setDistributionGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon gegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateRecipientPreview = async () => {
    try {
      const preview = await eventsApi.previewOntvangers(
        formData.filterCriteria,
        formData.distributieGroepId || undefined
      );
      setRecipientPreview(preview);
    } catch {
      setRecipientPreview(null);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CreateEventRequest = {
        titel: formData.titel,
        beschrijving: formData.beschrijving,
        datum: formData.datum,
        type: formData.type,
        filterCriteria: formData.distributieGroepId ? undefined : formData.filterCriteria,
        distributieGroepId: formData.distributieGroepId || undefined,
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

  const resetForm = () => {
    setFormData({
      titel: '',
      beschrijving: '',
      datum: '',
      type: 'Personeelsfeest',
      filterCriteria: { alleenActief: true, sectoren: [], employeeTypes: [], arbeidsRegimes: [] },
      distributieGroepId: '',
    });
    setRecipientPreview(null);
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
                {event.verstuurdOp && (
                  <div className="invitation-detail">
                    <Mail size={14} />
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
          <div className="modal" onClick={e => e.stopPropagation()}>
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

      {/* Create modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); resetForm(); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nieuwe Uitnodiging</h2>
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

              <h3 className="form-section-title">Ontvangers filteren</h3>

              <div className="form-group">
                <label>Distributiegroep (MG-)</label>
                <select
                  value={formData.distributieGroepId}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      distributieGroepId: val,
                      filterCriteria: val
                        ? { alleenActief: true }
                        : prev.filterCriteria,
                    }));
                  }}
                >
                  <option value="">-- Handmatig filteren (geen groep) --</option>
                  {distributionGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.displayName} ({g.memberCount} leden)
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Selecteer een mailgroep om alle leden als ontvanger te gebruiken
                </span>
              </div>

              {!formData.distributieGroepId && (
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
                    Alleen actieve medewerkers
                  </label>
                </div>
              )}

              <div className="recipient-preview">
                <Users size={18} />
                <strong>{recipientPreview?.totaalAantal ?? 0}</strong> ontvangers op basis van de huidige filters
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={!formData.titel || !formData.datum || !formData.beschrijving || loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Aanmaken...
                    </>
                  ) : (
                    'Uitnodiging Aanmaken'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
