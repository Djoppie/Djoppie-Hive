import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import StatusBadge from '../components/StatusBadge';
import SyncValidatieSection from '../components/SyncValidatieSection';
import type { Medewerker, ValidatieStatus } from '../types';
import { alleSectoren } from '../data/mockData';

export default function Validatie() {
  const { medewerkers, updateValidatieStatus, bulkValidatie } = usePersoneel();

  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState<ValidatieStatus | ''>('');
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set(alleSectoren));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [opmerkingenModal, setOpmerkingenModal] = useState<{
    open: boolean;
    medewerkerId: string;
    actie: ValidatieStatus;
  }>({ open: false, medewerkerId: '', actie: 'goedgekeurd' });
  const [opmerkingText, setOpmerkingText] = useState('');
  const [detailMedewerker, setDetailMedewerker] = useState<Medewerker | null>(null);

  const teValideren = useMemo(() => {
    let result = medewerkers;
    if (filterSector) result = result.filter(m => m.sector === filterSector);
    if (filterStatus) result = result.filter(m => m.validatieStatus === filterStatus);
    return result;
  }, [medewerkers, filterSector, filterStatus]);

  const perSector = useMemo(() => {
    const grouped: Record<string, Medewerker[]> = {};
    teValideren.forEach(m => {
      if (!grouped[m.sector]) grouped[m.sector] = [];
      grouped[m.sector].push(m);
    });
    return grouped;
  }, [teValideren]);

  const toggleSector = (sector: string) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const handleGoedkeuren = (id: string) => {
    updateValidatieStatus(id, 'goedgekeurd');
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAfkeurenStart = (id: string) => {
    setOpmerkingenModal({ open: true, medewerkerId: id, actie: 'afgekeurd' });
    setOpmerkingText('');
  };

  const handleOpmerkingenSubmit = () => {
    updateValidatieStatus(
      opmerkingenModal.medewerkerId,
      opmerkingenModal.actie,
      opmerkingText
    );
    setOpmerkingenModal({ open: false, medewerkerId: '', actie: 'goedgekeurd' });
    setOpmerkingText('');
  };

  const handleBulkGoedkeuren = () => {
    bulkValidatie(Array.from(selectedIds), 'goedgekeurd');
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nieuwCount = medewerkers.filter(m => m.validatieStatus === 'nieuw').length;
  const reviewCount = medewerkers.filter(m => m.validatieStatus === 'in_review').length;
  const goedCount = medewerkers.filter(m => m.validatieStatus === 'goedgekeurd').length;
  const afkeurCount = medewerkers.filter(m => m.validatieStatus === 'afgekeurd').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Validatie</h1>
          <p className="page-subtitle">
            Controle en goedkeuring van personeelsgegevens door diensthoofden en sectormanagers
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="page-actions">
            <span className="selection-count">{selectedIds.size} geselecteerd</span>
            <button className="btn btn-success" onClick={handleBulkGoedkeuren}>
              <CheckCircle2 size={16} /> Alles goedkeuren
            </button>
          </div>
        )}
      </div>

      {/* Sync validatie verzoeken */}
      <SyncValidatieSection />

      {/* Status overzicht */}
      <div className="validation-stats">
        <button
          className={`validation-stat-btn ${filterStatus === 'nieuw' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'nieuw' ? '' : 'nieuw')}
        >
          <AlertTriangle size={16} />
          <span>{nieuwCount} Nieuw</span>
        </button>
        <button
          className={`validation-stat-btn ${filterStatus === 'in_review' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'in_review' ? '' : 'in_review')}
        >
          <Eye size={16} />
          <span>{reviewCount} In Review</span>
        </button>
        <button
          className={`validation-stat-btn ${filterStatus === 'goedgekeurd' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'goedgekeurd' ? '' : 'goedgekeurd')}
        >
          <CheckCircle2 size={16} />
          <span>{goedCount} Goedgekeurd</span>
        </button>
        <button
          className={`validation-stat-btn ${filterStatus === 'afgekeurd' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'afgekeurd' ? '' : 'afgekeurd')}
        >
          <XCircle size={16} />
          <span>{afkeurCount} Afgekeurd</span>
        </button>
      </div>

      {/* Sector filter */}
      <div className="toolbar">
        <div className="form-group" style={{ minWidth: 200 }}>
          <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
            <option value="">Alle sectoren</option>
            {alleSectoren.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Filter size={18} className="text-muted" />
      </div>

      {/* Per sector groepering */}
      <div className="validation-sectors">
        {Object.entries(perSector).map(([sector, lijst]) => {
          const expanded = expandedSectors.has(sector);
          const sectorNieuw = lijst.filter(
            m => m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review'
          ).length;

          return (
            <div key={sector} className="validation-sector-card">
              <div
                className="sector-card-header"
                onClick={() => toggleSector(sector)}
              >
                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <h3>{sector}</h3>
                <span className="sector-total">{lijst.length} medewerkers</span>
                {sectorNieuw > 0 && (
                  <span className="badge badge-warning">{sectorNieuw} te valideren</span>
                )}
              </div>

              {expanded && (
                <div className="sector-card-body">
                  <table className="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th className="th-checkbox">
                          <input
                            type="checkbox"
                            onChange={() => {
                              const ids = lijst.map(m => m.id);
                              const allSelected = ids.every(id => selectedIds.has(id));
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                ids.forEach(id => {
                                  if (allSelected) next.delete(id);
                                  else next.add(id);
                                });
                                return next;
                              });
                            }}
                            checked={lijst.length > 0 && lijst.every(m => selectedIds.has(m.id))}
                          />
                        </th>
                        <th>Naam</th>
                        <th>Dienst</th>
                        <th>Functie</th>
                        <th>Regime</th>
                        <th>Type</th>
                        <th>Actief</th>
                        <th>Status</th>
                        <th>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lijst.map(m => (
                        <tr key={m.id} className={!m.actief ? 'row-inactive' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(m.id)}
                              onChange={() => toggleSelect(m.id)}
                            />
                          </td>
                          <td className="td-name">{m.volledigeNaam}</td>
                          <td>{m.dienst}</td>
                          <td>{m.functie}</td>
                          <td>{m.arbeidsRegime}</td>
                          <td>{m.type}</td>
                          <td>{m.actief ? 'Ja' : 'Nee'}</td>
                          <td>
                            <StatusBadge status={m.validatieStatus} />
                          </td>
                          <td className="td-actions">
                            <button
                              className="icon-btn"
                              title="Details"
                              onClick={() => setDetailMedewerker(m)}
                            >
                              <Eye size={16} />
                            </button>
                            {(m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review') && (
                              <>
                                <button
                                  className="icon-btn icon-btn-success"
                                  title="Goedkeuren"
                                  onClick={() => handleGoedkeuren(m.id)}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  className="icon-btn icon-btn-danger"
                                  title="Afkeuren"
                                  onClick={() => handleAfkeurenStart(m.id)}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
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

        {Object.keys(perSector).length === 0 && (
          <div className="empty-state-card">
            <CheckCircle2 size={48} className="text-success" />
            <p>Geen medewerkers gevonden met de huidige filters.</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailMedewerker && (
        <div className="modal-overlay" onClick={() => setDetailMedewerker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Details: {detailMedewerker.volledigeNaam}</h2>
              <button className="icon-btn" onClick={() => setDetailMedewerker(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">E-mail</span>
                <span className="detail-value">{detailMedewerker.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Telefoon</span>
                <span className="detail-value">{detailMedewerker.telefoon || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sector</span>
                <span className="detail-value">{detailMedewerker.sector}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Dienst</span>
                <span className="detail-value">{detailMedewerker.dienst}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Functie</span>
                <span className="detail-value">{detailMedewerker.functie || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Arbeidsregime</span>
                <span className="detail-value">{detailMedewerker.arbeidsRegime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type</span>
                <span className="detail-value">{detailMedewerker.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Actief</span>
                <span className="detail-value">{detailMedewerker.actief ? 'Ja' : 'Nee'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bron</span>
                <span className="detail-value">
                  {detailMedewerker.bronAD ? 'Azure AD' : 'Handmatig toegevoegd'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Validatiestatus</span>
                <StatusBadge status={detailMedewerker.validatieStatus} />
              </div>
              {detailMedewerker.validatieOpmerkingen && (
                <div className="detail-item detail-full">
                  <span className="detail-label">Validatie opmerkingen</span>
                  <span className="detail-value">{detailMedewerker.validatieOpmerkingen}</span>
                </div>
              )}
              {detailMedewerker.opmerkingen && (
                <div className="detail-item detail-full">
                  <span className="detail-label">Opmerkingen</span>
                  <span className="detail-value">{detailMedewerker.opmerkingen}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Opmerkingen modal voor afkeuren */}
      {opmerkingenModal.open && (
        <div className="modal-overlay" onClick={() => setOpmerkingenModal({ open: false, medewerkerId: '', actie: 'goedgekeurd' })}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <MessageSquare size={20} /> Reden van afkeuring
              </h2>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="opmerkingen">Opmerkingen *</label>
                <textarea
                  id="opmerkingen"
                  rows={4}
                  required
                  value={opmerkingText}
                  onChange={e => setOpmerkingText(e.target.value)}
                  placeholder="Geef de reden van afkeuring op..."
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setOpmerkingenModal({ open: false, medewerkerId: '', actie: 'goedgekeurd' })}
                >
                  Annuleren
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleOpmerkingenSubmit}
                  disabled={!opmerkingText.trim()}
                >
                  Afkeuren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
