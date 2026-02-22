import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  UserMinus,
  UserPlus,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowUp,
  RefreshCw,
} from 'lucide-react';
import { validatieVerzoekenApi } from '../services/api';
import type { SyncValidatieVerzoek, ValidatieAfhandeling } from '../types';

export default function Validatie() {
  const [verzoeken, setVerzoeken] = useState<SyncValidatieVerzoek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGroep, setFilterGroep] = useState('');
  const [expandedGroepen, setExpandedGroepen] = useState<Set<string>>(new Set());
  const [afhandelModal, setAfhandelModal] = useState<{
    open: boolean;
    verzoek: SyncValidatieVerzoek | null;
    actie: ValidatieAfhandeling | null;
  }>({ open: false, verzoek: null, actie: null });
  const [notities, setNotities] = useState('');

  const laadVerzoeken = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await validatieVerzoekenApi.getOpenstaande();
      setVerzoeken(data);
      setError(null);
      // Automatisch alle groepen uitklappen
      const groepen = new Set(data.map(v => v.groepNaam || 'Onbekend'));
      setExpandedGroepen(groepen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen verzoeken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    laadVerzoeken();
  }, [laadVerzoeken]);

  const gefilterdVerzoeken = useMemo(() => {
    if (!filterGroep) return verzoeken;
    return verzoeken.filter(v => v.groepNaam === filterGroep);
  }, [verzoeken, filterGroep]);

  const perGroep = useMemo(() => {
    const grouped: Record<string, SyncValidatieVerzoek[]> = {};
    gefilterdVerzoeken.forEach(v => {
      const groep = v.groepNaam || 'Onbekend';
      if (!grouped[groep]) grouped[groep] = [];
      grouped[groep].push(v);
    });
    return grouped;
  }, [gefilterdVerzoeken]);

  const alleGroepen = useMemo(() => {
    return Array.from(new Set(verzoeken.map(v => v.groepNaam || 'Onbekend'))).sort();
  }, [verzoeken]);

  const toggleGroep = (groep: string) => {
    setExpandedGroepen(prev => {
      const next = new Set(prev);
      if (next.has(groep)) next.delete(groep);
      else next.add(groep);
      return next;
    });
  };

  const handleAfhandelen = async () => {
    if (!afhandelModal.verzoek || !afhandelModal.actie) return;

    try {
      await validatieVerzoekenApi.afhandelen(afhandelModal.verzoek.id, {
        afhandeling: afhandelModal.actie,
        notities: notities || undefined,
      });
      setAfhandelModal({ open: false, verzoek: null, actie: null });
      setNotities('');
      await laadVerzoeken();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij afhandelen');
    }
  };

  const openAfhandelModal = (verzoek: SyncValidatieVerzoek, actie: ValidatieAfhandeling) => {
    setAfhandelModal({ open: true, verzoek, actie });
    setNotities('');
  };

  const getActieLabel = (actie: ValidatieAfhandeling) => {
    switch (actie) {
      case 'BevestigVerwijdering':
        return 'Verwijdering bevestigen';
      case 'HandmatigHertoevoegen':
        return 'Handmatig hertoevoegen';
      case 'Negeren':
        return 'Negeren';
      case 'Escaleren':
        return 'Escaleren naar sectormanager';
    }
  };

  const totaalCount = verzoeken.length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Validatie</h1>
          <p className="page-subtitle">
            Controle en goedkeuring van lidmaatschap-wijzigingen gedetecteerd tijdens synchronisatie
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={laadVerzoeken} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} /> Vernieuwen
          </button>
        </div>
      </div>

      {/* Status overzicht */}
      {!isLoading && !error && (
        <div className="validation-stats">
          <div className="validation-stat-card">
            <AlertTriangle size={20} className="text-warning" />
            <div>
              <div className="stat-value">{totaalCount}</div>
              <div className="stat-label">Openstaande verzoeken</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="empty-state-card">
          <RefreshCw size={48} className="spinning text-primary" />
          <p>Validatieverzoeken laden...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="empty-state-card">
          <AlertTriangle size={48} className="text-danger" />
          <h3>Fout bij laden</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={laadVerzoeken}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && verzoeken.length === 0 && (
        <div className="empty-state-card">
          <CheckCircle2 size={48} className="text-success" />
          <h3>Geen openstaande validaties</h3>
          <p>Er zijn momenteel geen validatieverzoeken die aandacht vereisen.</p>
        </div>
      )}

      {/* Groep filter */}
      {!isLoading && !error && verzoeken.length > 0 && (
        <>
          <div className="toolbar">
            <div className="form-group" style={{ minWidth: 250 }}>
              <select value={filterGroep} onChange={e => setFilterGroep(e.target.value)}>
                <option value="">Alle distributiegroepen</option>
                {alleGroepen.map(groep => (
                  <option key={groep} value={groep}>{groep}</option>
                ))}
              </select>
            </div>
            <Filter size={18} className="text-muted" />
          </div>

          {/* Per groep groepering */}
          <div className="validation-sectors">
            {Object.entries(perGroep).map(([groep, lijst]) => {
              const expanded = expandedGroepen.has(groep);

              return (
                <div key={groep} className="validation-sector-card">
                  <div
                    className="sector-card-header"
                    onClick={() => toggleGroep(groep)}
                  >
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h3>{groep}</h3>
                    <span className="badge badge-warning">{lijst.length} te valideren</span>
                  </div>

                  {expanded && (
                    <div className="sector-card-body">
                      <table className="data-table data-table-compact">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Medewerker</th>
                            <th>E-mail</th>
                            <th>Beschrijving</th>
                            <th>Vorige waarde</th>
                            <th>Aangemaakt</th>
                            <th>Acties</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lijst.map(v => (
                            <tr key={v.id}>
                              <td>
                                <span className="sync-type-badge">
                                  {v.type === 'LidVerwijderd' && <UserMinus size={12} />}
                                  {v.type}
                                </span>
                              </td>
                              <td className="td-name">{v.medewerkerNaam || '-'}</td>
                              <td>{v.medewerkerEmail || '-'}</td>
                              <td>{v.beschrijving}</td>
                              <td>{v.vorigeWaarde || '-'}</td>
                              <td>
                                {new Date(v.aangemaaktOp).toLocaleDateString('nl-BE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="td-actions">
                                <button
                                  className="icon-btn icon-btn-success"
                                  title="Verwijdering bevestigen"
                                  onClick={() => openAfhandelModal(v, 'BevestigVerwijdering')}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  className="icon-btn icon-btn-primary"
                                  title="Handmatig hertoevoegen"
                                  onClick={() => openAfhandelModal(v, 'HandmatigHertoevoegen')}
                                >
                                  <UserPlus size={16} />
                                </button>
                                <button
                                  className="icon-btn"
                                  title="Negeren"
                                  onClick={() => openAfhandelModal(v, 'Negeren')}
                                >
                                  <XCircle size={16} />
                                </button>
                                <button
                                  className="icon-btn icon-btn-warning"
                                  title="Escaleren"
                                  onClick={() => openAfhandelModal(v, 'Escaleren')}
                                >
                                  <ArrowUp size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Afhandel modal */}
      {afhandelModal.open && afhandelModal.verzoek && (
        <div className="modal-overlay" onClick={() => setAfhandelModal({ open: false, verzoek: null, actie: null })}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getActieLabel(afhandelModal.actie!)}</h2>
            </div>
            <div className="modal-form">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{afhandelModal.verzoek.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Medewerker</span>
                  <span className="detail-value">{afhandelModal.verzoek.medewerkerNaam || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">E-mail</span>
                  <span className="detail-value">{afhandelModal.verzoek.medewerkerEmail || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Groep</span>
                  <span className="detail-value">{afhandelModal.verzoek.groepNaam || '-'}</span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">Beschrijving</span>
                  <span className="detail-value">{afhandelModal.verzoek.beschrijving}</span>
                </div>
                {afhandelModal.verzoek.vorigeWaarde && (
                  <div className="detail-item detail-full">
                    <span className="detail-label">Vorige waarde</span>
                    <span className="detail-value">{afhandelModal.verzoek.vorigeWaarde}</span>
                  </div>
                )}
              </div>
              <div className="form-group mt-3">
                <label htmlFor="notities">Notities (optioneel)</label>
                <textarea
                  id="notities"
                  rows={3}
                  value={notities}
                  onChange={e => setNotities(e.target.value)}
                  placeholder="Eventuele toelichting..."
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setAfhandelModal({ open: false, verzoek: null, actie: null })}
                >
                  Annuleren
                </button>
                <button className="btn btn-primary" onClick={handleAfhandelen}>
                  Bevestigen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
