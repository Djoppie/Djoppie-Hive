import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  UserPlus,
  User,
  Briefcase,
  Building2,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileJson,
  Star,
  Clock,
  Clock3,
  Heart,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import MedewerkerModal from '../components/MedewerkerModal';
import type { Medewerker, ArbeidsRegime, PersoneelType, ValidatieStatus } from '../types';
import { employeeService } from '../services/employeeService';
import {
  mapEmployeeToMedewerker,
  mapMedewerkerToCreateDto,
  mapMedewerkerToUpdateDto,
} from '../utils/employeeMapper';
import { distributionGroupsApi, employeesApi, type Sector } from '../services/api';
import { useUserRole } from '../context/UserRoleContext';

type SortKey = 'volledigeNaam' | 'email' | 'sector' | 'dienst' | 'functie' | 'type' | 'arbeidsRegime' | 'validatieStatus';
type SortDir = 'asc' | 'desc';

interface SortIconProps {
  columnKey: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}

function SortIcon({ columnKey, sortKey, sortDir }: SortIconProps) {
  if (sortKey !== columnKey) return null;
  return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
}

// Utility function to strip MG- prefixes from group names
function stripMGPrefix(name: string): string {
  if (!name) return name;
  if (name.startsWith('MG-SECTOR-')) {
    return name.substring('MG-SECTOR-'.length);
  }
  if (name.startsWith('MG-')) {
    return name.substring('MG-'.length);
  }
  return name;
}

// Status display configuration with icons
const statusConfig: Record<ValidatieStatus, { label: string; className: string; Icon: typeof Star }> = {
  nieuw: { label: 'Nieuw', className: 'status-nieuw', Icon: Star },
  in_review: { label: 'In Review', className: 'status-review', Icon: Clock },
  goedgekeurd: { label: 'Goedgekeurd', className: 'status-goedgekeurd', Icon: CheckCircle },
  afgekeurd: { label: 'Afgekeurd', className: 'status-afgekeurd', Icon: XCircle },
  aangepast: { label: 'Aangepast', className: 'status-aangepast', Icon: RefreshCw },
};

// Regime display configuration with icons
const regimeConfig: Record<ArbeidsRegime, { label: string; className: string; Icon: typeof Clock }> = {
  voltijds: { label: 'Voltijds', className: 'regime-voltijds', Icon: Clock },
  deeltijds: { label: 'Deeltijds', className: 'regime-deeltijds', Icon: Clock3 },
  vrijwilliger: { label: 'Vrijwilliger', className: 'regime-vrijwilliger', Icon: Heart },
};

// Type display configuration with icons
const typeConfig: Record<PersoneelType, { label: string; className: string; Icon: typeof User }> = {
  personeel: { label: 'Personeel', className: 'type-personeel', Icon: User },
  vrijwilliger: { label: 'Vrijwilliger', className: 'type-vrijwilliger', Icon: Heart },
  interim: { label: 'Interim', className: 'type-interim', Icon: Briefcase },
  extern: { label: 'Extern', className: 'type-extern', Icon: Building2 },
};

export default function PersoneelLijst() {
  const { hasAnyRole } = useUserRole();
  const canExportGdpr = hasAnyRole('ict_super_admin', 'hr_admin');

  // State for employee data from API
  const [medewerkers, setMedewerkers] = useState<Medewerker[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Filter and search state
  const [zoekterm, setZoekterm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterType, setFilterType] = useState<PersoneelType | ''>('');
  const [filterRegime, setFilterRegime] = useState<ArbeidsRegime | ''>('');
  const [filterStatus, setFilterStatus] = useState<ValidatieStatus | ''>('');
  const [filterActief, setFilterActief] = useState<'' | 'ja' | 'nee'>('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('volledigeNaam');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Modal and selection state
  const [modalOpen, setModalOpen] = useState(false);
  const [bewerkMedewerker, setBewerkMedewerker] = useState<Medewerker | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const itemsPerPageOptions = [10, 25, 50, 100];

  // Fetch employees and sectors on mount
  useEffect(() => {
    loadEmployees();
    loadSectors();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError(null);
      const employees = await employeeService.getEmployees();
      const mapped = employees.map(mapEmployeeToMedewerker);
      setMedewerkers(mapped);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err instanceof Error ? err.message : 'Kan medewerkers niet laden');
    } finally {
      setLoading(false);
    }
  }

  async function loadSectors() {
    try {
      const hierarchy = await distributionGroupsApi.getHierarchy();
      setSectors(hierarchy.sectors);
    } catch (err) {
      console.error('Failed to load sectors:', err);
      // Don't show error for sectors, just use empty list
    }
  }

  const gefilterd = useMemo(() => {
    let result = medewerkers;

    if (zoekterm) {
      const term = zoekterm.toLowerCase();
      result = result.filter(
        m =>
          m.volledigeNaam.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.dienst.toLowerCase().includes(term) ||
          (m.functie?.toLowerCase().includes(term) ?? false)
      );
    }

    if (filterSector) result = result.filter(m => m.sector === filterSector);
    if (filterType) result = result.filter(m => m.type === filterType);
    if (filterRegime) result = result.filter(m => m.arbeidsRegime === filterRegime);
    if (filterStatus) result = result.filter(m => m.validatieStatus === filterStatus);
    if (filterActief === 'ja') result = result.filter(m => m.actief);
    if (filterActief === 'nee') result = result.filter(m => !m.actief);

    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'nl');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [medewerkers, zoekterm, filterSector, filterType, filterRegime, filterStatus, filterActief, sortKey, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [zoekterm, filterSector, filterType, filterRegime, filterStatus, filterActief]);

  // Pagination calculations
  const totalPages = Math.ceil(gefilterd.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = gefilterd.slice(startIndex, endIndex);

  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Naam', 'E-mail', 'Telefoon', 'Sector', 'Dienst', 'Functie',
      'Arbeidsregime', 'Type', 'Actief', 'Validatiestatus', 'Opmerkingen',
    ];
    const rows = gefilterd.map(m => [
      m.volledigeNaam,
      m.email,
      m.telefoon || '',
      m.sector,
      m.dienst,
      m.functie || '',
      m.arbeidsRegime,
      m.type,
      m.actief ? 'Ja' : 'Nee',
      m.validatieStatus,
      m.opmerkingen,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personeelslijst_diepenbeek_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === gefilterd.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(gefilterd.map(m => m.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (data: Partial<Medewerker>) => {
    try {
      setError(null);
      if (bewerkMedewerker) {
        const updateDto = mapMedewerkerToUpdateDto(data);
        const updated = await employeeService.updateEmployee(bewerkMedewerker.id, updateDto);
        setMedewerkers(prev =>
          prev.map(m => (m.id === bewerkMedewerker.id ? mapEmployeeToMedewerker(updated) : m))
        );
      } else {
        const createDto = mapMedewerkerToCreateDto(data);
        const created = await employeeService.createEmployee(createDto);
        setMedewerkers(prev => [...prev, mapEmployeeToMedewerker(created)]);
      }
      setModalOpen(false);
      setBewerkMedewerker(null);
    } catch (err) {
      console.error('Failed to save employee:', err);
      setError(err instanceof Error ? err.message : 'Kan medewerker niet opslaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Weet u zeker dat u deze medewerker wilt verwijderen?')) {
      return;
    }

    try {
      setError(null);
      await employeeService.deleteEmployee(id);
      setMedewerkers(prev => prev.filter(m => m.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete employee:', err);
      setError(err instanceof Error ? err.message : 'Kan medewerker niet verwijderen');
    }
  };

  const resetFilters = () => {
    setFilterSector('');
    setFilterType('');
    setFilterRegime('');
    setFilterStatus('');
    setFilterActief('');
    setZoekterm('');
  };

  const handleExportGdpr = async (id: string) => {
    try {
      setExportingId(id);
      setError(null);
      await employeesApi.exportGdprData(id);
    } catch (err) {
      console.error('Failed to export GDPR data:', err);
      setError(err instanceof Error ? err.message : 'Kan GDPR export niet uitvoeren');
    } finally {
      setExportingId(null);
    }
  };

  const hasActiveFilters = filterSector || filterType || filterRegime || filterStatus || filterActief;

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Personeelslijst</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '12px' }}>
          <Loader2 size={24} className="spin" />
          <span>Medewerkers laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Error banner */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Personeelslijst</h1>
          <p className="page-subtitle">
            {gefilterd.length} van {medewerkers.length} medewerkers
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Exporteer CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setBewerkMedewerker(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Nieuwe Medewerker
          </button>
        </div>
      </div>

      {/* Zoek- en filterbalk */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Zoek op naam, e-mail, dienst of functie..."
            value={zoekterm}
            onChange={e => setZoekterm(e.target.value)}
          />
          {zoekterm && (
            <button className="search-clear" onClick={() => setZoekterm('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`btn btn-outline ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Filters
          {hasActiveFilters && <span className="filter-dot" />}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="form-group">
              <label>Sector</label>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                <option value="">Alle sectoren</option>
                {sectors.map(s => (
                  <option key={s.id} value={stripMGPrefix(s.displayName)}>
                    {stripMGPrefix(s.displayName)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value as PersoneelType | '')}>
                <option value="">Alle types</option>
                <option value="personeel">Personeel</option>
                <option value="vrijwilliger">Vrijwilliger</option>
                <option value="interim">Interim</option>
                <option value="extern">Extern</option>
              </select>
            </div>
            <div className="form-group">
              <label>Arbeidsregime</label>
              <select value={filterRegime} onChange={e => setFilterRegime(e.target.value as ArbeidsRegime | '')}>
                <option value="">Alle regimes</option>
                <option value="voltijds">Voltijds</option>
                <option value="deeltijds">Deeltijds</option>
                <option value="vrijwilliger">Vrijwilliger</option>
              </select>
            </div>
            <div className="form-group">
              <label>Validatiestatus</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ValidatieStatus | '')}>
                <option value="">Alle statussen</option>
                <option value="nieuw">Nieuw</option>
                <option value="in_review">In Review</option>
                <option value="goedgekeurd">Goedgekeurd</option>
                <option value="afgekeurd">Afgekeurd</option>
              </select>
            </div>
            <div className="form-group">
              <label>Actief</label>
              <select value={filterActief} onChange={e => setFilterActief(e.target.value as '' | 'ja' | 'nee')}>
                <option value="">Alles</option>
                <option value="ja">Actief</option>
                <option value="nee">Inactief</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button className="btn btn-link" onClick={resetFilters}>
              Filters wissen
            </button>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className="table-container">
        <table className="data-table personeel-table">
          <thead>
            <tr>
              <th className="th-checkbox th-checkbox-sticky">
                <input
                  type="checkbox"
                  checked={selectedIds.size === gefilterd.length && gefilterd.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="sortable th-name-sticky" onClick={() => handleSort('volledigeNaam')}>
                Naam <SortIcon columnKey="volledigeNaam" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('email')}>
                E-mail <SortIcon columnKey="email" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('sector')}>
                Sector <SortIcon columnKey="sector" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('dienst')}>
                Dienst <SortIcon columnKey="dienst" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('functie')}>
                Functie <SortIcon columnKey="functie" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable th-symbol" onClick={() => handleSort('arbeidsRegime')}>
                Regime <SortIcon columnKey="arbeidsRegime" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable th-symbol" onClick={() => handleSort('type')}>
                Type <SortIcon columnKey="type" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="th-symbol">Actief</th>
              <th className="sortable th-symbol" onClick={() => handleSort('validatieStatus')}>
                Status <SortIcon columnKey="validatieStatus" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="th-symbol">Bron</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(m => {
              const statusCfg = statusConfig[m.validatieStatus] || statusConfig.nieuw;

              return (
                <tr key={m.id} className={!m.actief ? 'row-inactive' : ''}>
                  <td className="td-checkbox td-checkbox-sticky">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="td-name td-name-sticky">
                    <span className="employee-name">{m.volledigeNaam}</span>
                  </td>
                  <td className="td-email">{m.email}</td>
                  <td>{stripMGPrefix(m.sector)}</td>
                  <td>{stripMGPrefix(m.dienst)}</td>
                  <td>{m.functie || '-'}</td>
                  <td className="td-symbol">
                    {(() => {
                      const config = regimeConfig[m.arbeidsRegime];
                      const IconComponent = config.Icon;
                      return (
                        <span className={`regime-icon ${config.className}`} title={config.label}>
                          <IconComponent size={18} />
                        </span>
                      );
                    })()}
                  </td>
                  <td className="td-symbol">
                    {(() => {
                      const config = typeConfig[m.type];
                      const IconComponent = config.Icon;
                      return (
                        <span className={`type-icon ${config.className}`} title={config.label}>
                          <IconComponent size={18} />
                        </span>
                      );
                    })()}
                  </td>
                  <td className="td-symbol">
                    {m.actief ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-danger" />
                    )}
                  </td>
                  <td className="td-symbol">
                    <span
                      className={`status-icon ${statusCfg.className}`}
                      title={statusCfg.label}
                    >
                      <statusCfg.Icon size={14} />
                    </span>
                  </td>
                  <td className="td-symbol">
                    {m.bronAD ? (
                      <span title="Azure AD"><Cloud size={18} className="bron-icon bron-azure" /></span>
                    ) : (
                      <span title="Handmatig"><UserPlus size={18} className="bron-icon bron-manual" /></span>
                    )}
                  </td>
                  <td className="td-actions">
                    <button
                      className="icon-btn"
                      title="Bekijken"
                      onClick={() => {
                        setBewerkMedewerker(m);
                        setViewOnly(true);
                        setModalOpen(true);
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Bewerken"
                      onClick={() => {
                        setBewerkMedewerker(m);
                        setViewOnly(false);
                        setModalOpen(true);
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    {canExportGdpr && (
                      <button
                        className="icon-btn"
                        title="GDPR Export"
                        onClick={() => handleExportGdpr(m.id)}
                        disabled={exportingId === m.id}
                      >
                        {exportingId === m.id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <FileJson size={16} />
                        )}
                      </button>
                    )}
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Verwijderen"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-state">
                  Geen medewerkers gevonden met de huidige filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginatie */}
      {gefilterd.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              {startIndex + 1}-{Math.min(endIndex, gefilterd.length)} van {gefilterd.length}
            </span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pagination-select"
            >
              {itemsPerPageOptions.map(n => (
                <option key={n} value={n}>{n} per pagina</option>
              ))}
            </select>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Eerste pagina"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Vorige pagina"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="pagination-pages">
              Pagina {currentPage} van {totalPages || 1}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              title="Volgende pagina"
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              title="Laatste pagina"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}

      <MedewerkerModal
        key={bewerkMedewerker?.id ?? "new"}
        medewerker={bewerkMedewerker}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBewerkMedewerker(null);
          setViewOnly(false);
        }}
        onSave={handleSave}
        viewOnly={viewOnly}
      />
    </div>
  );
}
