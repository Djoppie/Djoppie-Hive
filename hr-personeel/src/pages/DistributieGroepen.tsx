import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Mail,
  Users,
  UserPlus,
  UserMinus,
  Edit3,
  Trash2,


  Cloud,
  FolderPlus,
  X,

  Shield,
  Globe,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import type { DistributieGroep, DistributieGroepType } from '../types';

const typeLabels: Record<DistributieGroepType, string> = {
  distributionGroup: 'Distribution Group',
  mailEnabledSecurity: 'Mail-enabled Security',
  microsoft365: 'Microsoft 365 Group',
};

const typeIcons: Record<DistributieGroepType, typeof Mail> = {
  distributionGroup: Mail,
  mailEnabledSecurity: Shield,
  microsoft365: Globe,
};

export default function DistributieGroepen() {
  const {
    distributieGroepen,
    medewerkers,
    voegDistributieGroepToe,
    updateDistributieGroep,
    verwijderDistributieGroep,
    voegLidToeAanGroep,
    verwijderLidUitGroep,
    getGroepLeden,
  } = usePersoneel();

  const [zoekterm, setZoekterm] = useState('');
  const [selectedGroep, setSelectedGroep] = useState<DistributieGroep | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bewerkGroep, setBewerkGroep] = useState<DistributieGroep | null>(null);
  const [ledenModalOpen, setLedenModalOpen] = useState(false);
  const [ledenZoekterm, setLedenZoekterm] = useState('');

  const gefilterd = useMemo(() => {
    if (!zoekterm) return distributieGroepen;
    const term = zoekterm.toLowerCase();
    return distributieGroepen.filter(
      g =>
        g.displayName.toLowerCase().includes(term) ||
        g.emailAddress.toLowerCase().includes(term) ||
        g.beschrijving.toLowerCase().includes(term)
    );
  }, [distributieGroepen, zoekterm]);

  const geselecteerdeLeden = selectedGroep ? getGroepLeden(selectedGroep.id) : [];

  const beschikbareLeden = useMemo(() => {
    if (!selectedGroep) return [];
    const ledenSet = new Set(selectedGroep.ledenIds);
    let beschikbaar = medewerkers.filter(m => !ledenSet.has(m.id) && m.actief);
    if (ledenZoekterm) {
      const term = ledenZoekterm.toLowerCase();
      beschikbaar = beschikbaar.filter(
        m =>
          m.volledigeNaam.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.sector.toLowerCase().includes(term)
      );
    }
    return beschikbaar;
  }, [medewerkers, selectedGroep, ledenZoekterm]);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    emailAddress: '',
    beschrijving: '',
    type: 'distributionGroup' as DistributieGroepType,
  });

  const openCreateModal = () => {
    setBewerkGroep(null);
    setFormData({
      displayName: '',
      emailAddress: '',
      beschrijving: '',
      type: 'distributionGroup',
    });
    setModalOpen(true);
  };

  const openEditModal = (groep: DistributieGroep) => {
    setBewerkGroep(groep);
    setFormData({
      displayName: groep.displayName,
      emailAddress: groep.emailAddress,
      beschrijving: groep.beschrijving,
      type: groep.type,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (bewerkGroep) {
      updateDistributieGroep(bewerkGroep.id, formData);
    } else {
      voegDistributieGroepToe({
        ...formData,
        ledenIds: [],
        eigenaarIds: [],
        bronExchange: false,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (groep: DistributieGroep) => {
    if (window.confirm(`Weet u zeker dat u "${groep.displayName}" wilt verwijderen?`)) {
      verwijderDistributieGroep(groep.id);
      if (selectedGroep?.id === groep.id) setSelectedGroep(null);
    }
  };

  const handleVoegLidToe = (medewerkerId: string) => {
    if (selectedGroep) {
      voegLidToeAanGroep(selectedGroep.id, medewerkerId);
      // Refresh selected groep reference
      setSelectedGroep(prev => {
        if (!prev) return null;
        return { ...prev, ledenIds: [...prev.ledenIds, medewerkerId] };
      });
    }
  };

  const handleVerwijderLid = (medewerkerId: string) => {
    if (selectedGroep) {
      verwijderLidUitGroep(selectedGroep.id, medewerkerId);
      setSelectedGroep(prev => {
        if (!prev) return null;
        return { ...prev, ledenIds: prev.ledenIds.filter(id => id !== medewerkerId) };
      });
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      displayName: value,
      emailAddress: bewerkGroep
        ? prev.emailAddress
        : `${value.toLowerCase().replace(/[^a-z0-9]/g, '')}@diepenbeek.be`,
    }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Distributiegroepen</h1>
          <p className="page-subtitle">
            Mailgroepen (MG-) uit MS365 / Exchange Admin &mdash; {distributieGroepen.length} groepen
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Nieuwe Groep
          </button>
        </div>
      </div>

      <div className="dg-layout">
        {/* Linker panel: groepen lijst */}
        <div className="dg-list-panel">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ maxWidth: 'none' }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Zoek groep op naam of e-mail..."
                value={zoekterm}
                onChange={e => setZoekterm(e.target.value)}
              />
              {zoekterm && (
                <button className="search-clear" onClick={() => setZoekterm('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="dg-groups">
            {gefilterd.map(groep => {
              const Icon = typeIcons[groep.type];
              const isSelected = selectedGroep?.id === groep.id;
              return (
                <div
                  key={groep.id}
                  className={`dg-group-card ${isSelected ? 'dg-group-selected' : ''}`}
                  onClick={() => setSelectedGroep(groep)}
                >
                  <div className="dg-group-icon">
                    <Icon size={20} />
                  </div>
                  <div className="dg-group-info">
                    <div className="dg-group-name">{groep.displayName}</div>
                    <div className="dg-group-email">{groep.emailAddress}</div>
                    <div className="dg-group-meta">
                      <span className="dg-group-type-tag">{typeLabels[groep.type]}</span>
                      <span className="dg-group-members">
                        <Users size={12} /> {groep.ledenIds.length}
                      </span>
                      {groep.bronExchange && (
                        <span className="dg-group-source" title="Uit Exchange">
                          <Cloud size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="dg-group-actions" onClick={e => e.stopPropagation()}>
                    <button className="icon-btn" title="Bewerken" onClick={() => openEditModal(groep)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="icon-btn icon-btn-danger" title="Verwijderen" onClick={() => handleDelete(groep)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {gefilterd.length === 0 && (
              <div className="dg-empty">
                <Mail size={32} className="text-muted" />
                <p>Geen groepen gevonden.</p>
              </div>
            )}
          </div>
        </div>

        {/* Rechter panel: leden */}
        <div className="dg-detail-panel">
          {selectedGroep ? (
            <>
              <div className="dg-detail-header">
                <div>
                  <h2>{selectedGroep.displayName}</h2>
                  <span className="dg-detail-email">{selectedGroep.emailAddress}</span>
                  <p className="dg-detail-desc">{selectedGroep.beschrijving}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setLedenZoekterm(''); setLedenModalOpen(true); }}>
                  <UserPlus size={14} /> Lid Toevoegen
                </button>
              </div>

              <div className="dg-detail-stats">
                <div className="dg-stat">
                  <Users size={16} />
                  <strong>{geselecteerdeLeden.length}</strong> leden
                </div>
                <div className="dg-stat">
                  <span className="dg-group-type-tag">{typeLabels[selectedGroep.type]}</span>
                </div>
                <div className="dg-stat text-muted">
                  Laatst gewijzigd: {selectedGroep.laatstGewijzigd}
                </div>
              </div>

              <div className="dg-members-table">
                <table className="data-table data-table-compact">
                  <thead>
                    <tr>
                      <th>Naam</th>
                      <th>E-mail</th>
                      <th>Sector</th>
                      <th>Dienst</th>
                      <th>Type</th>
                      <th style={{ width: 60 }}>Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geselecteerdeLeden.map(m => (
                      <tr key={m.id} className={!m.actief ? 'row-inactive' : ''}>
                        <td className="td-name">{m.volledigeNaam}</td>
                        <td className="td-email">{m.email}</td>
                        <td>{m.sector}</td>
                        <td>{m.dienst}</td>
                        <td>
                          <span className={`type-tag type-${m.type}`}>
                            {m.type === 'personeel' ? 'Pers.' : m.type === 'vrijwilliger' ? 'Vrij.' : m.type === 'interim' ? 'Int.' : 'Ext.'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Verwijder uit groep"
                            onClick={() => handleVerwijderLid(m.id)}
                          >
                            <UserMinus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {geselecteerdeLeden.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Deze groep heeft nog geen leden. Klik op &quot;Lid Toevoegen&quot; om leden toe te voegen.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="dg-no-selection">
              <FolderPlus size={48} className="text-muted" />
              <h3>Selecteer een groep</h3>
              <p>Klik op een distributiegroep in de lijst om de leden te bekijken en te beheren.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit groep modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{bewerkGroep ? 'Groep Bewerken' : 'Nieuwe Distributiegroep'}</h2>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="dg-name">Naam *</label>
                <input
                  id="dg-name"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="bijv. MG-AllePersoneel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dg-email">E-mailadres *</label>
                <input
                  id="dg-email"
                  type="email"
                  required
                  value={formData.emailAddress}
                  onChange={e => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                  placeholder="bijv. mg-allepersoneel@diepenbeek.be"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dg-type">Type *</label>
                <select
                  id="dg-type"
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as DistributieGroepType }))}
                >
                  <option value="distributionGroup">Distribution Group</option>
                  <option value="mailEnabledSecurity">Mail-enabled Security Group</option>
                  <option value="microsoft365">Microsoft 365 Group</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="dg-desc">Beschrijving</label>
                <textarea
                  id="dg-desc"
                  rows={3}
                  value={formData.beschrijving}
                  onChange={e => setFormData(prev => ({ ...prev, beschrijving: e.target.value }))}
                  placeholder="Korte beschrijving van de groep..."
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuleren</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!formData.displayName || !formData.emailAddress}
                >
                  {bewerkGroep ? 'Opslaan' : 'Aanmaken'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lid toevoegen modal */}
      {ledenModalOpen && selectedGroep && (
        <div className="modal-overlay" onClick={() => setLedenModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={20} /> Lid toevoegen aan {selectedGroep.displayName}
              </h2>
              <button className="icon-btn" onClick={() => setLedenModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className="search-box" style={{ maxWidth: 'none', marginBottom: 16 }}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Zoek medewerker op naam, e-mail of sector..."
                  value={ledenZoekterm}
                  onChange={e => setLedenZoekterm(e.target.value)}
                  autoFocus
                />
                {ledenZoekterm && (
                  <button className="search-clear" onClick={() => setLedenZoekterm('')}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="dg-add-members-list">
                <table className="data-table data-table-compact">
                  <thead>
                    <tr>
                      <th>Naam</th>
                      <th>E-mail</th>
                      <th>Sector</th>
                      <th>Dienst</th>
                      <th style={{ width: 100 }}>Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beschikbareLeden.slice(0, 20).map(m => (
                      <tr key={m.id}>
                        <td className="td-name">{m.volledigeNaam}</td>
                        <td className="td-email">{m.email}</td>
                        <td>{m.sector}</td>
                        <td>{m.dienst}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVoegLidToe(m.id)}
                          >
                            <UserPlus size={12} /> Toevoegen
                          </button>
                        </td>
                      </tr>
                    ))}
                    {beschikbareLeden.length === 0 && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          Geen beschikbare medewerkers gevonden.
                        </td>
                      </tr>
                    )}
                    {beschikbareLeden.length > 20 && (
                      <tr>
                        <td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 12 }}>
                          ... en {beschikbareLeden.length - 20} anderen. Gebruik de zoekbalk om te filteren.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
