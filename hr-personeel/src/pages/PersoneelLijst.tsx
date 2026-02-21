import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cloud,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import StatusBadge from '../components/StatusBadge';
import MedewerkerModal from '../components/MedewerkerModal';
import type { Medewerker, ArbeidsRegime, PersoneelType, ValidatieStatus } from '../types';
import { alleSectoren } from '../data/mockData';

type SortKey = 'volledigeNaam' | 'email' | 'sector' | 'dienst' | 'type' | 'arbeidsRegime' | 'validatieStatus';
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

export default function PersoneelLijst() {
  const { medewerkers, updateMedewerker, voegMedewerkerToe, verwijderMedewerker } = usePersoneel();

  const [zoekterm, setZoekterm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterType, setFilterType] = useState<PersoneelType | ''>('');
  const [filterRegime, setFilterRegime] = useState<ArbeidsRegime | ''>('');
  const [filterStatus, setFilterStatus] = useState<ValidatieStatus | ''>('');
  const [filterActief, setFilterActief] = useState<'' | 'ja' | 'nee'>('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('volledigeNaam');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [bewerkMedewerker, setBewerkMedewerker] = useState<Medewerker | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleSave = (data: Partial<Medewerker>) => {
    if (bewerkMedewerker) {
      updateMedewerker(bewerkMedewerker.id, data);
    } else {
      voegMedewerkerToe(data as Omit<Medewerker, 'id' | 'aanmaakDatum' | 'laatstGewijzigd'>);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Weet u zeker dat u deze medewerker wilt verwijderen?')) {
      verwijderMedewerker(id);
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

  const hasActiveFilters = filterSector || filterType || filterRegime || filterStatus || filterActief;

  return (
    <div className="page">
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
                {alleSectoren.map(s => (
                  <option key={s} value={s}>{s}</option>
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
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.size === gefilterd.length && gefilterd.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="sortable" onClick={() => handleSort('volledigeNaam')}>
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
              <th>Functie</th>
              <th className="sortable" onClick={() => handleSort('arbeidsRegime')}>
                Regime <SortIcon columnKey="arbeidsRegime" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="sortable" onClick={() => handleSort('type')}>
                Type <SortIcon columnKey="type" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th>Actief</th>
              <th className="sortable" onClick={() => handleSort('validatieStatus')}>
                Status <SortIcon columnKey="validatieStatus" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th>Bron</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.map(m => (
              <tr key={m.id} className={!m.actief ? 'row-inactive' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(m.id)}
                    onChange={() => toggleSelect(m.id)}
                  />
                </td>
                <td className="td-name">
                  <span className="name-text">{m.volledigeNaam}</span>
                  {m.opmerkingen && (
                    <span className="name-note" title={m.opmerkingen}>
                      *
                    </span>
                  )}
                </td>
                <td className="td-email">{m.email}</td>
                <td>{m.sector}</td>
                <td>{m.dienst}</td>
                <td>{m.functie}</td>
                <td>
                  <span className={`regime-tag regime-${m.arbeidsRegime}`}>
                    {m.arbeidsRegime === 'voltijds'
                      ? 'VT'
                      : m.arbeidsRegime === 'deeltijds'
                      ? 'DT'
                      : 'VW'}
                  </span>
                </td>
                <td>
                  <span className={`type-tag type-${m.type}`}>
                    {m.type === 'personeel'
                      ? 'Pers.'
                      : m.type === 'vrijwilliger'
                      ? 'Vrij.'
                      : m.type === 'interim'
                      ? 'Int.'
                      : 'Ext.'}
                  </span>
                </td>
                <td>
                  {m.actief ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <X size={16} className="text-danger" />
                  )}
                </td>
                <td>
                  <StatusBadge status={m.validatieStatus} />
                </td>
                <td>
                  {m.bronAD ? (
                    <span title="Azure AD"><Cloud size={16} className="text-info" /></span>
                  ) : (
                    <span title="Handmatig"><UserPlus size={16} className="text-muted" /></span>
                  )}
                </td>
                <td className="td-actions">
                  <button
                    className="icon-btn"
                    title="Bewerken"
                    onClick={() => {
                      setBewerkMedewerker(m);
                      setModalOpen(true);
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    title="Verwijderen"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {gefilterd.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-state">
                  Geen medewerkers gevonden met de huidige filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MedewerkerModal
        key={bewerkMedewerker?.id ?? "new"}
        medewerker={bewerkMedewerker}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBewerkMedewerker(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
