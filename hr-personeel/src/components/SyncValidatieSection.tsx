import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserMinus,
  UserPlus,
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { validatieVerzoekenApi } from '../services/api';
import type { SyncValidatieVerzoek, ValidatieAfhandeling } from '../types';

/**
 * Component voor het weergeven en afhandelen van sync validatieverzoeken.
 * Toont verzoeken voor lidmaatschap-wijzigingen die tijdens sync zijn gedetecteerd.
 */
export default function SyncValidatieSection() {
  const [verzoeken, setVerzoeken] = useState<SyncValidatieVerzoek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen verzoeken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    laadVerzoeken();
  }, [laadVerzoeken]);

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

  if (verzoeken.length === 0 && !isLoading && !error) {
    return null; // Geen sync validatieverzoeken
  }

  return (
    <div className="sync-validatie-section">
      <div
        className="sync-validatie-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="sync-validatie-title">
          <RefreshCw size={18} />
          <h3>Sync Validatieverzoeken</h3>
          {verzoeken.length > 0 && (
            <span className="badge badge-warning">{verzoeken.length}</span>
          )}
        </div>
        <button className="icon-btn">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="sync-validatie-body">
          {isLoading && (
            <div className="sync-validatie-loading">
              <RefreshCw size={20} className="spinning" />
              <span>Laden...</span>
            </div>
          )}

          {error && (
            <div className="sync-validatie-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button className="btn btn-sm" onClick={laadVerzoeken}>
                Opnieuw proberen
              </button>
            </div>
          )}

          {!isLoading && !error && verzoeken.length === 0 && (
            <div className="sync-validatie-empty">
              <CheckCircle2 size={24} />
              <span>Geen openstaande sync validatieverzoeken</span>
            </div>
          )}

          {!isLoading && verzoeken.length > 0 && (
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Beschrijving</th>
                  <th>Medewerker</th>
                  <th>Groep</th>
                  <th>Aangemaakt</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {verzoeken.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span className="sync-type-badge">
                        {v.type === 'LidVerwijderd' && <UserMinus size={12} />}
                        {v.type}
                      </span>
                    </td>
                    <td>{v.beschrijving}</td>
                    <td>{v.medewerkerNaam || '-'}</td>
                    <td>{v.groepNaam || '-'}</td>
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
          )}
        </div>
      )}

      {/* Afhandel modal */}
      {afhandelModal.open && afhandelModal.verzoek && (
        <div className="modal-overlay" onClick={() => setAfhandelModal({ open: false, verzoek: null, actie: null })}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getActieLabel(afhandelModal.actie!)}</h2>
            </div>
            <div className="modal-form">
              <p className="mb-3">{afhandelModal.verzoek.beschrijving}</p>
              <div className="form-group">
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
