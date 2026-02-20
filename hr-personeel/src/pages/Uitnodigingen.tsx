import { useState } from 'react';
import {
  Plus,
  Send,
  Trash2,
  Edit3,
  Users,
  Calendar,
  Mail,
  PartyPopper,
  Megaphone,
  GraduationCap,
  MessageCircle,
  MoreHorizontal,
  Eye,
  X,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import type { Uitnodiging, UitnodigingFilter, PersoneelType, ArbeidsRegime } from '../types';
import { alleSectoren } from '../data/mockData';

const typeIcons = {
  personeelsfeest: PartyPopper,
  vergadering: Users,
  training: GraduationCap,
  communicatie: Megaphone,
  overig: MessageCircle,
};

const typeLabels = {
  personeelsfeest: 'Personeelsfeest',
  vergadering: 'Vergadering',
  training: 'Training',
  communicatie: 'Communicatie',
  overig: 'Overig',
};

export default function Uitnodigingen() {
  const { uitnodigingen, maakUitnodiging, updateUitnodiging, verstuurUitnodiging, getGefilterdeOntvangers, distributieGroepen } =
    usePersoneel();

  const [modalOpen, setModalOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titel: '',
    beschrijving: '',
    datum: '',
    type: 'personeelsfeest' as Uitnodiging['type'],
    filters: {
      alleenActief: true,
      sectoren: [] as string[],
      types: [] as PersoneelType[],
      regimes: [] as ArbeidsRegime[],
    } as UitnodigingFilter,
  });

  const handleCreate = () => {
    maakUitnodiging({
      ...formData,
      ontvangers: getGefilterdeOntvangers(formData.filters).map(m => m.id),
      status: 'concept',
    });
    setModalOpen(false);
    setFormData({
      titel: '',
      beschrijving: '',
      datum: '',
      type: 'personeelsfeest',
      filters: { alleenActief: true, sectoren: [], types: [], regimes: [] },
    });
  };

  const handleVerstuur = (id: string) => {
    if (window.confirm('Weet u zeker dat u deze uitnodiging wilt versturen?')) {
      verstuurUitnodiging(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Weet u zeker dat u deze uitnodiging wilt verwijderen?')) {
      updateUitnodiging(id, { status: 'geannuleerd' });
    }
  };

  const ontvangerCount = getGefilterdeOntvangers(formData.filters).length;
  const previewUitnodiging = uitnodigingen.find(u => u.id === previewId);

  const toggleSectorFilter = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        sectoren: prev.filters.sectoren?.includes(sector)
          ? prev.filters.sectoren.filter(s => s !== sector)
          : [...(prev.filters.sectoren || []), sector],
      },
    }));
  };

  const toggleTypeFilter = (type: PersoneelType) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        types: prev.filters.types?.includes(type)
          ? prev.filters.types.filter(t => t !== type)
          : [...(prev.filters.types || []), type],
      },
    }));
  };

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

      {/* Bestaande uitnodigingen */}
      <div className="invitations-grid">
        {uitnodigingen.map(u => {
          const Icon = typeIcons[u.type];
          const ontvangers = getGefilterdeOntvangers(u.filters);
          return (
            <div key={u.id} className={`invitation-card invitation-${u.status}`}>
              <div className="invitation-header">
                <div className="invitation-icon">
                  <Icon size={24} />
                </div>
                <div className="invitation-meta">
                  <span className={`invitation-status status-${u.status}`}>
                    {u.status === 'concept'
                      ? 'Concept'
                      : u.status === 'verstuurd'
                      ? 'Verstuurd'
                      : 'Geannuleerd'}
                  </span>
                  <span className="invitation-type">{typeLabels[u.type]}</span>
                </div>
              </div>

              <h3 className="invitation-title">{u.titel}</h3>
              <p className="invitation-desc">{u.beschrijving}</p>

              <div className="invitation-details">
                <div className="invitation-detail">
                  <Calendar size={14} />
                  <span>{u.datum}</span>
                </div>
                <div className="invitation-detail">
                  <Users size={14} />
                  <span>{ontvangers.length} ontvangers</span>
                </div>
                {u.verstuurdOp && (
                  <div className="invitation-detail">
                    <Mail size={14} />
                    <span>Verstuurd op {u.verstuurdOp}</span>
                  </div>
                )}
              </div>

              <div className="invitation-actions">
                <button
                  className="icon-btn"
                  title="Voorbeeld"
                  onClick={() => setPreviewId(u.id)}
                >
                  <Eye size={16} />
                </button>
                {u.status === 'concept' && (
                  <>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleVerstuur(u.id)}
                    >
                      <Send size={14} /> Versturen
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Annuleren"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {uitnodigingen.length === 0 && (
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
      {previewUitnodiging && (
        <div className="modal-overlay" onClick={() => setPreviewId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Voorbeeld: {previewUitnodiging.titel}</h2>
              <button className="icon-btn" onClick={() => setPreviewId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="preview-content">
              <div className="preview-email">
                <div className="preview-email-header">
                  <strong>Van:</strong> hr@diepenbeek.be
                </div>
                <div className="preview-email-header">
                  <strong>Aan:</strong> {getGefilterdeOntvangers(previewUitnodiging.filters).length} ontvangers
                </div>
                <div className="preview-email-header">
                  <strong>Onderwerp:</strong> {previewUitnodiging.titel}
                </div>
                <hr />
                <div className="preview-email-body">
                  <p>Beste collega,</p>
                  <p>{previewUitnodiging.beschrijving}</p>
                  <p>
                    <strong>Datum:</strong> {previewUitnodiging.datum}
                  </p>
                  <p>Met vriendelijke groeten,<br />HR Gemeente Diepenbeek</p>
                </div>
              </div>

              <h3 style={{ marginTop: '1.5rem' }}>Ontvangers ({getGefilterdeOntvangers(previewUitnodiging.filters).length})</h3>
              <div className="preview-recipients">
                {getGefilterdeOntvangers(previewUitnodiging.filters)
                  .slice(0, 10)
                  .map(m => (
                    <div key={m.id} className="preview-recipient">
                      <span>{m.volledigeNaam}</span>
                      <span className="text-muted">{m.email}</span>
                    </div>
                  ))}
                {getGefilterdeOntvangers(previewUitnodiging.filters).length > 10 && (
                  <p className="text-muted">
                    ... en {getGefilterdeOntvangers(previewUitnodiging.filters).length - 10} anderen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nieuwe uitnodiging modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nieuwe Uitnodiging</h2>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
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
                    onChange={e =>
                      setFormData(prev => ({ ...prev, type: e.target.value as Uitnodiging['type'] }))
                    }
                  >
                    <option value="personeelsfeest">Personeelsfeest</option>
                    <option value="vergadering">Vergadering</option>
                    <option value="training">Training</option>
                    <option value="communicatie">Communicatie</option>
                    <option value="overig">Overig</option>
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
                  onChange={e =>
                    setFormData(prev => ({ ...prev, beschrijving: e.target.value }))
                  }
                  placeholder="Beschrijf het evenement of de communicatie..."
                />
              </div>

              <h3 className="form-section-title">Ontvangers filteren</h3>

              <div className="form-group">
                <label>Distributiegroep (MG-)</label>
                <select
                  value={formData.filters.distributieGroepIds?.[0] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        distributieGroepIds: val ? [val] : [],
                        // Reset other filters when selecting a distribution group
                        ...(val ? { sectoren: [], types: [], regimes: [] } : {}),
                      },
                    }));
                  }}
                >
                  <option value="">-- Handmatig filteren (geen groep) --</option>
                  {distributieGroepen.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.displayName} ({g.ledenIds.length} leden) &mdash; {g.emailAddress}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Selecteer een mailgroep om alle leden als ontvanger te gebruiken, of filter handmatig hieronder
                </span>
              </div>

              {!formData.filters.distributieGroepIds?.length && (
                <>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.filters.alleenActief ?? true}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, alleenActief: e.target.checked },
                          }))
                        }
                      />
                      Alleen actieve medewerkers
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Sectoren</label>
                    <div className="chip-list">
                      {alleSectoren.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`chip ${formData.filters.sectoren?.includes(s) ? 'chip-active' : ''}`}
                          onClick={() => toggleSectorFilter(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <span className="form-hint">
                      Geen selectie = alle sectoren
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Type medewerker</label>
                    <div className="chip-list">
                      {(['personeel', 'vrijwilliger', 'interim', 'extern'] as PersoneelType[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`chip ${formData.filters.types?.includes(t) ? 'chip-active' : ''}`}
                          onClick={() => toggleTypeFilter(t)}
                        >
                          {t === 'personeel' ? 'Personeel' : t === 'vrijwilliger' ? 'Vrijwilliger' : t === 'interim' ? 'Interim' : 'Extern'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="recipient-preview">
                <Users size={18} />
                <strong>{ontvangerCount}</strong> ontvangers op basis van de huidige filters
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={!formData.titel || !formData.datum || !formData.beschrijving}
                >
                  Uitnodiging Aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
