import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  employeesApi,
  type Employee,
  type ValidatieStatusAPI,
  type ValidatieStatistieken,
} from '../services/api';

// Status display configuration
const statusConfig: Record<ValidatieStatusAPI, { label: string; className: string }> = {
  Nieuw: { label: 'Nieuw', className: 'status-nieuw' },
  InReview: { label: 'In Review', className: 'status-review' },
  Goedgekeurd: { label: 'Goedgekeurd', className: 'status-goedgekeurd' },
  Afgekeurd: { label: 'Afgekeurd', className: 'status-afgekeurd' },
};

// Regime display mapping
const regimeLabels: Record<string, string> = {
  Voltijds: 'voltijds',
  Deeltijds: 'deeltijds',
  Vrijwilliger: 'vrijwilliger',
};

// Type display mapping
const typeLabels: Record<string, string> = {
  Personeel: 'personeel',
  Vrijwilliger: 'vrijwilliger',
  Interim: 'interim',
  Extern: 'extern',
  Stagiair: 'stagiair',
};

export default function Validatie() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState<ValidatieStatusAPI | ''>('');
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ValidatieStatistieken | null>(null);

  // Modal state for viewing/editing
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    employee: Employee | null;
    action: 'view' | 'approve' | 'reject' | null;
  }>({ open: false, employee: null, action: null });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await employeesApi.getAll();

      // Add mock validation status if not present (for development)
      const employeesWithStatus = data.map((emp, index) => ({
        ...emp,
        validatieStatus: emp.validatieStatus || getDefaultValidatieStatus(index),
      }));

      setEmployees(employeesWithStatus);

      // Calculate stats from data
      const calculatedStats: ValidatieStatistieken = {
        nieuw: employeesWithStatus.filter(e => e.validatieStatus === 'Nieuw').length,
        inReview: employeesWithStatus.filter(e => e.validatieStatus === 'InReview').length,
        goedgekeurd: employeesWithStatus.filter(e => e.validatieStatus === 'Goedgekeurd').length,
        afgekeurd: employeesWithStatus.filter(e => e.validatieStatus === 'Afgekeurd').length,
        totaal: employeesWithStatus.length,
      };
      setStats(calculatedStats);

      // Auto-expand all sectors
      const sectors = new Set(employeesWithStatus.map(e => e.sectorNaam || 'Onbekend'));
      setExpandedSectors(sectors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen medewerkers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock function to assign validation status for development
  function getDefaultValidatieStatus(index: number): ValidatieStatusAPI {
    const statuses: ValidatieStatusAPI[] = ['Nieuw', 'InReview', 'Goedgekeurd', 'Afgekeurd'];
    // Make most employees 'Goedgekeurd', some 'Nieuw', few 'InReview', fewer 'Afgekeurd'
    const weights = [0.2, 0.15, 0.55, 0.1];
    const random = (index * 0.618033988749895) % 1; // Deterministic pseudo-random
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return statuses[i];
    }
    return 'Goedgekeurd';
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (filterSector) {
      result = result.filter(e => e.sectorNaam === filterSector);
    }
    if (filterStatus) {
      result = result.filter(e => e.validatieStatus === filterStatus);
    }
    return result;
  }, [employees, filterSector, filterStatus]);

  // Group by sector
  const perSector = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    filteredEmployees.forEach(emp => {
      const sector = emp.sectorNaam || 'Onbekend';
      if (!grouped[sector]) grouped[sector] = [];
      grouped[sector].push(emp);
    });
    // Sort sectors alphabetically
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [filteredEmployees]);

  // Get all unique sectors
  const allSectors = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.sectorNaam || 'Onbekend'))).sort();
  }, [employees]);

  // Count employees needing validation per sector
  const teValiderenPerSector = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      const sector = emp.sectorNaam || 'Onbekend';
      if (emp.validatieStatus === 'Nieuw' || emp.validatieStatus === 'InReview') {
        counts[sector] = (counts[sector] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  const toggleSector = (sector: string) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const toggleSelectAll = (_sector: string, employeeList: Employee[]) => {
    const sectorIds = employeeList.map(e => e.id);
    const allSelected = sectorIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        sectorIds.forEach(id => next.delete(id));
      } else {
        sectorIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAction = async (employee: Employee, action: 'view' | 'approve' | 'reject') => {
    if (action === 'view') {
      setDetailModal({ open: true, employee, action: 'view' });
    } else if (action === 'approve') {
      try {
        // Update locally for now (API call would go here)
        setEmployees(prev => prev.map(e =>
          e.id === employee.id ? { ...e, validatieStatus: 'Goedgekeurd' as ValidatieStatusAPI } : e
        ));
        // Recalculate stats
        loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fout bij goedkeuren');
      }
    } else if (action === 'reject') {
      try {
        setEmployees(prev => prev.map(e =>
          e.id === employee.id ? { ...e, validatieStatus: 'Afgekeurd' as ValidatieStatusAPI } : e
        ));
        loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fout bij afkeuren');
      }
    }
  };

  const handleStatusTabClick = (status: ValidatieStatusAPI | '') => {
    setFilterStatus(prev => prev === status ? '' : status);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Validatie</h1>
          <p className="page-subtitle">
            Controle en goedkeuring van personeelsgegevens door diensthoofden en sectormanagers
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} /> Vernieuwen
          </button>
        </div>
      </div>

      {/* Status tabs */}
      {stats && (
        <div className="validatie-status-tabs">
          <button
            className={`status-tab ${filterStatus === 'Nieuw' ? 'active' : ''}`}
            onClick={() => handleStatusTabClick('Nieuw')}
          >
            <AlertTriangle size={14} />
            <span>{stats.nieuw} Nieuw</span>
          </button>
          <button
            className={`status-tab ${filterStatus === 'InReview' ? 'active' : ''}`}
            onClick={() => handleStatusTabClick('InReview')}
          >
            <Eye size={14} />
            <span>{stats.inReview} In Review</span>
          </button>
          <button
            className={`status-tab ${filterStatus === 'Goedgekeurd' ? 'active' : ''}`}
            onClick={() => handleStatusTabClick('Goedgekeurd')}
          >
            <Check size={14} />
            <span>{stats.goedgekeurd} Goedgekeurd</span>
          </button>
          <button
            className={`status-tab ${filterStatus === 'Afgekeurd' ? 'active' : ''}`}
            onClick={() => handleStatusTabClick('Afgekeurd')}
          >
            <X size={14} />
            <span>{stats.afgekeurd} Afgekeurd</span>
          </button>
        </div>
      )}

      {/* Sector filter */}
      <div className="validatie-filters">
        <div className="form-group" style={{ minWidth: 200 }}>
          <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
            <option value="">Alle sectoren</option>
            {allSectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
        <Filter size={18} className="text-muted" />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="empty-state-card">
          <RefreshCw size={48} className="spinning text-primary" />
          <p>Medewerkers laden...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="empty-state-card">
          <AlertTriangle size={48} className="text-danger" />
          <h3>Fout bij laden</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredEmployees.length === 0 && (
        <div className="empty-state-card">
          <CheckCircle2 size={48} className="text-success" />
          <h3>Geen medewerkers gevonden</h3>
          <p>Er zijn geen medewerkers die aan de huidige filters voldoen.</p>
        </div>
      )}

      {/* Sector groups */}
      {!isLoading && !error && filteredEmployees.length > 0 && (
        <div className="validatie-sectors">
          {Object.entries(perSector).map(([sector, sectorEmployees]) => {
            const expanded = expandedSectors.has(sector);
            const teValideren = teValiderenPerSector[sector] || 0;
            const allSelected = sectorEmployees.every(e => selectedIds.has(e.id));

            return (
              <div key={sector} className="validatie-sector-card">
                <div
                  className="validatie-sector-header"
                  onClick={() => toggleSector(sector)}
                >
                  <div className="sector-header-left">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h3>{sector}</h3>
                  </div>
                  <div className="sector-header-right">
                    <span className="sector-count">{sectorEmployees.length} medewerkers</span>
                    {teValideren > 0 && (
                      <span className="badge badge-warning">{teValideren} te valideren</span>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="validatie-sector-body">
                    <table className="data-table validatie-table">
                      <thead>
                        <tr>
                          <th className="th-checkbox">
                            <input
                              type="checkbox"
                              checked={allSelected && sectorEmployees.length > 0}
                              onChange={() => toggleSelectAll(sector, sectorEmployees)}
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
                        {sectorEmployees.map(emp => {
                          const statusCfg = statusConfig[emp.validatieStatus] || statusConfig.Nieuw;
                          const needsValidation = emp.validatieStatus === 'Nieuw' || emp.validatieStatus === 'InReview';

                          return (
                            <tr key={emp.id} className={!emp.isActive ? 'row-inactive' : ''}>
                              <td className="td-checkbox">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(emp.id)}
                                  onChange={() => toggleSelect(emp.id)}
                                />
                              </td>
                              <td className="td-name">{emp.displayName}</td>
                              <td>{emp.dienstNaam || '-'}</td>
                              <td>{emp.jobTitle || '-'}</td>
                              <td>{regimeLabels[emp.arbeidsRegime] || emp.arbeidsRegime}</td>
                              <td>{typeLabels[emp.employeeType] || emp.employeeType}</td>
                              <td className="td-actief">
                                {emp.isActive ? 'Ja' : 'Nee'}
                              </td>
                              <td>
                                <span className={`validatie-status ${statusCfg.className}`}>
                                  {statusCfg.label}
                                </span>
                              </td>
                              <td className="td-actions">
                                <button
                                  className="icon-btn"
                                  title="Bekijken"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(emp, 'view');
                                  }}
                                >
                                  <Eye size={16} />
                                </button>
                                {needsValidation && (
                                  <>
                                    <button
                                      className="icon-btn icon-btn-success"
                                      title="Goedkeuren"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(emp, 'approve');
                                      }}
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      className="icon-btn icon-btn-danger"
                                      title="Afkeuren"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(emp, 'reject');
                                      }}
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.employee && (
        <div className="modal-overlay" onClick={() => setDetailModal({ open: false, employee: null, action: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Medewerker Details</h2>
            </div>
            <div className="modal-form">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Naam</span>
                  <span className="detail-value">{detailModal.employee.displayName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">E-mail</span>
                  <span className="detail-value">{detailModal.employee.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sector</span>
                  <span className="detail-value">{detailModal.employee.sectorNaam || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Dienst</span>
                  <span className="detail-value">{detailModal.employee.dienstNaam || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Functie</span>
                  <span className="detail-value">{detailModal.employee.jobTitle || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{typeLabels[detailModal.employee.employeeType] || detailModal.employee.employeeType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Regime</span>
                  <span className="detail-value">{regimeLabels[detailModal.employee.arbeidsRegime] || detailModal.employee.arbeidsRegime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Actief</span>
                  <span className="detail-value">{detailModal.employee.isActive ? 'Ja' : 'Nee'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Validatiestatus</span>
                  <span className={`validatie-status ${statusConfig[detailModal.employee.validatieStatus]?.className || ''}`}>
                    {statusConfig[detailModal.employee.validatieStatus]?.label || detailModal.employee.validatieStatus}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bron</span>
                  <span className="detail-value">{detailModal.employee.bron === 'AzureAD' ? 'Azure AD' : 'Handmatig'}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDetailModal({ open: false, employee: null, action: null })}
                >
                  Sluiten
                </button>
                {(detailModal.employee.validatieStatus === 'Nieuw' || detailModal.employee.validatieStatus === 'InReview') && (
                  <>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handleAction(detailModal.employee!, 'reject');
                        setDetailModal({ open: false, employee: null, action: null });
                      }}
                    >
                      <X size={16} /> Afkeuren
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleAction(detailModal.employee!, 'approve');
                        setDetailModal({ open: false, employee: null, action: null });
                      }}
                    >
                      <Check size={16} /> Goedkeuren
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
