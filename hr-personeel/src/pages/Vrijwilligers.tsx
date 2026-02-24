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
  Heart,
  Check,
  X,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import VrijwilligerModal from '../components/VrijwilligerModal';
import { volunteerService } from '../services/volunteerService';
import type { Employee } from '../services/api';

type SortKey = 'displayName' | 'email' | 'dienstNaam' | 'beschikbaarheid' | 'vogGeldigTot';
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

// VOG Status helper functions
function getVOGStatus(vogGeldigTot: string | null | undefined): 'valid' | 'warning' | 'expired' | 'none' {
  if (!vogGeldigTot) return 'none';

  const expiryDate = new Date(vogGeldigTot);
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  if (expiryDate < today) return 'expired';
  if (expiryDate < threeMonthsFromNow) return 'warning';
  return 'valid';
}

function getVOGStatusLabel(status: 'valid' | 'warning' | 'expired' | 'none'): string {
  switch (status) {
    case 'valid':
      return 'Geldig';
    case 'warning':
      return 'Verloopt binnenkort';
    case 'expired':
      return 'Verlopen';
    case 'none':
      return 'Geen VOG';
  }
}

function VOGBadge({ vogGeldigTot }: { vogGeldigTot: string | null | undefined }) {
  const status = getVOGStatus(vogGeldigTot);
  const label = getVOGStatusLabel(status);

  const className =
    status === 'valid' ? 'vog-valid' :
    status === 'warning' ? 'vog-warning' :
    status === 'expired' ? 'vog-expired' : 'vog-none';

  return (
    <span className={`vog-badge ${className}`}>
      {label}
    </span>
  );
}

export default function Vrijwilligers() {
  // State for volunteer data from API
  const [vrijwilligers, setVrijwilligers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [zoekterm, setZoekterm] = useState('');
  const [filterDienst, setFilterDienst] = useState('');
  const [filterVOG, setFilterVOG] = useState<'valid' | 'warning' | 'expired' | 'none' | ''>('');
  const [filterActief, setFilterActief] = useState<'' | 'ja' | 'nee'>('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Modal and selection state
  const [modalOpen, setModalOpen] = useState(false);
  const [bewerkVrijwilliger, setBewerkVrijwilliger] = useState<Employee | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const itemsPerPageOptions = [10, 25, 50, 100];

  // Fetch volunteers on mount
  useEffect(() => {
    loadVolunteers();
  }, []);

  async function loadVolunteers() {
    try {
      setLoading(true);
      setError(null);
      const volunteers = await volunteerService.getVolunteers();
      setVrijwilligers(volunteers);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      setError(err instanceof Error ? err.message : 'Kan vrijwilligers niet laden');
    } finally {
      setLoading(false);
    }
  }

  // Get unique diensten for filter dropdown
  const diensten = useMemo(() => {
    const unique = new Set(vrijwilligers.map(v => v.dienstNaam).filter(Boolean));
    return Array.from(unique).sort();
  }, [vrijwilligers]);

  const gefilterd = useMemo(() => {
    let result = vrijwilligers;

    if (zoekterm) {
      const term = zoekterm.toLowerCase();
      result = result.filter(
        v =>
          v.displayName.toLowerCase().includes(term) ||
          v.email.toLowerCase().includes(term) ||
          v.dienstNaam?.toLowerCase().includes(term) ||
          v.vrijwilligerDetails?.specialisaties?.toLowerCase().includes(term)
      );
    }

    if (filterDienst) result = result.filter(v => v.dienstNaam === filterDienst);
    if (filterVOG) {
      result = result.filter(v => getVOGStatus(v.vrijwilligerDetails?.vogGeldigTot) === filterVOG);
    }
    if (filterActief === 'ja') result = result.filter(v => v.isActive);
    if (filterActief === 'nee') result = result.filter(v => !v.isActive);

    result = [...result].sort((a, b) => {
      let aVal: string | undefined;
      let bVal: string | undefined;

      if (sortKey === 'vogGeldigTot') {
        aVal = a.vrijwilligerDetails?.vogGeldigTot || '';
        bVal = b.vrijwilligerDetails?.vogGeldigTot || '';
      } else if (sortKey === 'beschikbaarheid') {
        aVal = a.vrijwilligerDetails?.beschikbaarheid || '';
        bVal = b.vrijwilligerDetails?.beschikbaarheid || '';
      } else {
        aVal = a[sortKey] || '';
        bVal = b[sortKey] || '';
      }

      const cmp = String(aVal).localeCompare(String(bVal), 'nl');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [vrijwilligers, zoekterm, filterDienst, filterVOG, filterActief, sortKey, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [zoekterm, filterDienst, filterVOG, filterActief]);

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
      'Naam', 'E-mail', 'Telefoon', 'Groep', 'Beschikbaarheid', 'Specialisaties',
      'Noodcontact Naam', 'Noodcontact Telefoon', 'VOG Datum', 'VOG Geldig Tot', 'Actief',
    ];
    const rows = gefilterd.map(v => [
      v.displayName,
      v.email,
      v.telefoonnummer || '',
      v.dienstNaam || '',
      v.vrijwilligerDetails?.beschikbaarheid || '',
      v.vrijwilligerDetails?.specialisaties || '',
      v.vrijwilligerDetails?.noodContactNaam || '',
      v.vrijwilligerDetails?.noodContactTelefoon || '',
      v.vrijwilligerDetails?.vogDatum || '',
      v.vrijwilligerDetails?.vogGeldigTot || '',
      v.isActive ? 'Ja' : 'Nee',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vrijwilligers_diepenbeek_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === gefilterd.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(gefilterd.map(v => v.id)));
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

  const handleSave = async (data: Partial<Employee>) => {
    try {
      setError(null);
      if (bewerkVrijwilliger) {
        // Update existing volunteer - map to UpdateVolunteerDto
        const updateDto: any = {
          givenName: data.givenName,
          surname: data.surname,
          email: data.email,
          jobTitle: data.jobTitle,
          telefoonnummer: data.telefoonnummer,
          dienstId: data.dienstId,
          isActive: data.isActive,
          startDatum: data.startDatum,
          eindDatum: data.eindDatum,
          employeeType: data.employeeType,
          arbeidsRegime: data.arbeidsRegime,
          vrijwilligerDetails: data.vrijwilligerDetails ? {
            beschikbaarheid: data.vrijwilligerDetails.beschikbaarheid || undefined,
            specialisaties: data.vrijwilligerDetails.specialisaties || undefined,
            noodContactNaam: data.vrijwilligerDetails.noodContactNaam || undefined,
            noodContactTelefoon: data.vrijwilligerDetails.noodContactTelefoon || undefined,
            vogDatum: data.vrijwilligerDetails.vogDatum || undefined,
            vogGeldigTot: data.vrijwilligerDetails.vogGeldigTot || undefined,
          } : undefined,
        };
        const updated = await volunteerService.updateVolunteer(bewerkVrijwilliger.id, updateDto);
        setVrijwilligers(prev =>
          prev.map(v => (v.id === bewerkVrijwilliger.id ? updated : v))
        );
      } else {
        // Create new volunteer
        const createDto: any = {
          givenName: data.givenName!,
          surname: data.surname!,
          email: data.email!,
          jobTitle: data.jobTitle,
          telefoonnummer: data.telefoonnummer,
          dienstId: data.dienstId,
          isActive: data.isActive,
          startDatum: data.startDatum,
          eindDatum: data.eindDatum,
          employeeType: 'Vrijwilliger' as const,
          arbeidsRegime: 'Vrijwilliger' as const,
          vrijwilligerDetails: data.vrijwilligerDetails ? {
            beschikbaarheid: data.vrijwilligerDetails.beschikbaarheid || undefined,
            specialisaties: data.vrijwilligerDetails.specialisaties || undefined,
            noodContactNaam: data.vrijwilligerDetails.noodContactNaam || undefined,
            noodContactTelefoon: data.vrijwilligerDetails.noodContactTelefoon || undefined,
            vogDatum: data.vrijwilligerDetails.vogDatum || undefined,
            vogGeldigTot: data.vrijwilligerDetails.vogGeldigTot || undefined,
          } : undefined,
        };
        const created = await volunteerService.createVolunteer(createDto);
        setVrijwilligers(prev => [...prev, created]);
      }
      setModalOpen(false);
      setBewerkVrijwilliger(null);
    } catch (err) {
      console.error('Failed to save volunteer:', err);
      setError(err instanceof Error ? err.message : 'Kan vrijwilliger niet opslaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Weet u zeker dat u deze vrijwilliger wilt verwijderen?')) {
      return;
    }

    try {
      setError(null);
      await volunteerService.deleteVolunteer(id);
      setVrijwilligers(prev => prev.filter(v => v.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
      setError(err instanceof Error ? err.message : 'Kan vrijwilliger niet verwijderen');
    }
  };

  const resetFilters = () => {
    setFilterDienst('');
    setFilterVOG('');
    setFilterActief('');
    setZoekterm('');
  };

  const hasActiveFilters = filterDienst || filterVOG || filterActief;

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Vrijwilligers</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '12px' }}>
          <Loader2 size={24} className="spin" />
          <span>Vrijwilligers laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#FEE',
          border: '1px solid #F44336',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={20} style={{ color: '#F44336', flexShrink: 0 }} />
          <span style={{ color: '#D32F2F', flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} style={{ color: '#D32F2F' }} />
          </button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>
            <Heart size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-danger)' }} />
            Vrijwilligers
          </h1>
          <p className="page-subtitle">
            {gefilterd.length} van {vrijwilligers.length} vrijwilligers
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Exporteer CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setBewerkVrijwilliger(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Nieuwe Vrijwilliger
          </button>
        </div>
      </div>

      {/* Zoek- en filterbalk */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Zoek op naam, e-mail, groep of specialisaties..."
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
              <label>Groep</label>
              <select value={filterDienst} onChange={e => setFilterDienst(e.target.value)}>
                <option value="">Alle groepen</option>
                {diensten.map(d => (
                  <option key={d || ''} value={d || ''}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>VOG Status</label>
              <select value={filterVOG} onChange={e => setFilterVOG(e.target.value as any)}>
                <option value="">Alle statussen</option>
                <option value="valid">Geldig</option>
                <option value="warning">Verloopt binnenkort</option>
                <option value="expired">Verlopen</option>
                <option value="none">Geen VOG</option>
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
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-checkbox th-checkbox-sticky">
                <input
                  type="checkbox"
                  checked={selectedIds.size === gefilterd.length && gefilterd.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="sortable th-name-sticky" onClick={() => handleSort('displayName')}>
                Naam <SortIcon columnKey="displayName" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('email')}>
                E-mail <SortIcon columnKey="email" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('dienstNaam')}>
                Groep <SortIcon columnKey="dienstNaam" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('beschikbaarheid')}>
                Beschikbaarheid <SortIcon columnKey="beschikbaarheid" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th>Specialisaties</th>
              <th className="sortable" onClick={() => handleSort('vogGeldigTot')}>
                VOG Status <SortIcon columnKey="vogGeldigTot" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="th-symbol">Actief</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(v => (
              <tr key={v.id} className={!v.isActive ? 'row-inactive' : ''}>
                <td className="td-checkbox-sticky">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => toggleSelect(v.id)}
                  />
                </td>
                <td className="td-name td-name-sticky">
                  <span className="name-text">{v.displayName}</span>
                </td>
                <td className="td-email">{v.email}</td>
                <td>{v.dienstNaam || '-'}</td>
                <td>
                  {v.vrijwilligerDetails?.beschikbaarheid ? (
                    <div className="availability-chips">
                      {(v.vrijwilligerDetails.beschikbaarheid || '').split(',').map((day, idx) => (
                        <span key={idx} className="chip chip-sm">{day.trim()}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td>
                  {v.vrijwilligerDetails?.specialisaties ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {v.vrijwilligerDetails.specialisaties}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <VOGBadge vogGeldigTot={v.vrijwilligerDetails?.vogGeldigTot} />
                  {v.vrijwilligerDetails?.vogGeldigTot && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Calendar size={10} style={{ display: 'inline', marginRight: '2px' }} />
                      {new Date(v.vrijwilligerDetails.vogGeldigTot).toLocaleDateString('nl-NL')}
                    </div>
                  )}
                </td>
                <td className="td-symbol">
                  {v.isActive ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <X size={16} className="text-danger" />
                  )}
                </td>
                <td className="td-actions">
                  <button
                    className="icon-btn"
                    title="Bekijken"
                    onClick={() => {
                      setBewerkVrijwilliger(v);
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
                      setBewerkVrijwilliger(v);
                      setViewOnly(false);
                      setModalOpen(true);
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="Verwijderen"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  Geen vrijwilligers gevonden met de huidige filters.
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

      <VrijwilligerModal
        key={bewerkVrijwilliger?.id ?? "new"}
        vrijwilliger={bewerkVrijwilliger}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBewerkVrijwilliger(null);
          setViewOnly(false);
        }}
        onSave={handleSave}
        viewOnly={viewOnly}
      />
    </div>
  );
}
