import { useState, useMemo, useEffect } from 'react';
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
  Zap,
  User,
  FolderPlus,
  X,
  RefreshCw,
  ExternalLink,
  Loader2,
  Check,
  Filter,
} from 'lucide-react';
import SyncKnop from '../components/SyncKnop';
import { unifiedGroupsApi, employeesApi } from '../services/api';
import type {
  UnifiedGroup,
  UnifiedGroupDetail,
  GroupSource,
  DynamicGroupFilterCriteria,
  EmployeeSummary,
  CreateDynamicGroupRequest,
  CreateLocalGroupRequest,
} from '../types';

type TabFilter = 'all' | GroupSource;

const sourceIcons: Record<GroupSource, typeof Cloud> = {
  Exchange: Cloud,
  Dynamic: Zap,
  Local: User,
};

const sourceLabels: Record<GroupSource, string> = {
  Exchange: 'Exchange',
  Dynamic: 'Dynamisch',
  Local: 'Lokaal',
};

const sourceColors: Record<GroupSource, string> = {
  Exchange: '#0078D4',
  Dynamic: '#7C3AED',
  Local: '#059669',
};

export default function DistributieGroepen() {
  // Main state
  const [groups, setGroups] = useState<UnifiedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [zoekterm, setZoekterm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Selection & detail
  const [selectedGroup, setSelectedGroup] = useState<UnifiedGroup | null>(null);
  const [groupDetail, setGroupDetail] = useState<UnifiedGroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [createLocalModalOpen, setCreateLocalModalOpen] = useState(false);
  const [createDynamicModalOpen, setCreateDynamicModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editDynamicModalOpen, setEditDynamicModalOpen] = useState(false);

  // Employees for member management
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Form states
  const [localFormData, setLocalFormData] = useState({ displayName: '', description: '', email: '' });
  const [dynamicFormData, setDynamicFormData] = useState<{
    displayName: string;
    description: string;
    email: string;
    filterCriteria: DynamicGroupFilterCriteria;
  }>({
    displayName: '',
    description: '',
    email: '',
    filterCriteria: { alleenActief: true }
  });

  // Load groups from API
  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await unifiedGroupsApi.getAll();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Kon groepen niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Load group detail when selection changes
  useEffect(() => {
    if (!selectedGroup) {
      setGroupDetail(null);
      return;
    }

    setDetailLoading(true);
    unifiedGroupsApi.getById(selectedGroup.id)
      .then(detail => {
        setGroupDetail(detail);
      })
      .catch(err => {
        console.error('Failed to load group details:', err);
        setGroupDetail(null);
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [selectedGroup?.id]);

  // Load employees when add member modal opens
  useEffect(() => {
    if (!addMemberModalOpen) return;

    setEmployeesLoading(true);
    employeesApi.getAll({ isActive: true })
      .then(data => {
        // Convert Employee to EmployeeSummary format
        setEmployees(data.map(e => ({
          id: e.id,
          displayName: e.displayName,
          email: e.email,
          jobTitle: e.jobTitle,
          employeeType: e.employeeType,
          arbeidsRegime: e.arbeidsRegime,
          isActive: e.isActive,
          dienstNaam: e.department,
        })));
      })
      .catch(err => {
        console.error('Failed to load employees:', err);
        setEmployees([]);
      })
      .finally(() => {
        setEmployeesLoading(false);
      });
  }, [addMemberModalOpen]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    let result = groups;

    // Filter by tab
    if (activeTab !== 'all') {
      result = result.filter(g => g.source === activeTab);
    }

    // Filter by search term
    if (zoekterm) {
      const term = zoekterm.toLowerCase();
      result = result.filter(g =>
        g.displayName.toLowerCase().includes(term) ||
        (g.email?.toLowerCase().includes(term) ?? false) ||
        (g.description?.toLowerCase().includes(term) ?? false)
      );
    }

    return result;
  }, [groups, activeTab, zoekterm]);

  // Available employees (exclude current members)
  const availableEmployees = useMemo(() => {
    if (!groupDetail) return [];

    const memberIds = new Set(groupDetail.members.map(m => m.id));
    let available = employees.filter(e => !memberIds.has(e.id));

    if (memberSearchTerm) {
      const term = memberSearchTerm.toLowerCase();
      available = available.filter(e =>
        e.displayName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        (e.dienstNaam?.toLowerCase().includes(term) ?? false)
      );
    }

    return available;
  }, [employees, groupDetail, memberSearchTerm]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: groups.length,
    Exchange: groups.filter(g => g.source === 'Exchange').length,
    Dynamic: groups.filter(g => g.source === 'Dynamic').length,
    Local: groups.filter(g => g.source === 'Local').length,
  }), [groups]);

  // Handlers
  const handleCreateLocalGroup = async () => {
    try {
      const request: CreateLocalGroupRequest = {
        displayName: localFormData.displayName,
        description: localFormData.description || undefined,
        email: localFormData.email || undefined,
      };
      await unifiedGroupsApi.createLocal(request);
      setCreateLocalModalOpen(false);
      setLocalFormData({ displayName: '', description: '', email: '' });
      loadGroups();
    } catch (err) {
      console.error('Failed to create local group:', err);
      alert('Kon groep niet aanmaken');
    }
  };

  const handleCreateDynamicGroup = async () => {
    try {
      const request: CreateDynamicGroupRequest = {
        displayName: dynamicFormData.displayName,
        description: dynamicFormData.description || undefined,
        email: dynamicFormData.email || undefined,
        filterCriteria: dynamicFormData.filterCriteria,
      };
      await unifiedGroupsApi.createDynamic(request);
      setCreateDynamicModalOpen(false);
      setDynamicFormData({ displayName: '', description: '', email: '', filterCriteria: { alleenActief: true } });
      loadGroups();
    } catch (err) {
      console.error('Failed to create dynamic group:', err);
      alert('Kon groep niet aanmaken');
    }
  };

  const handleUpdateDynamicGroup = async () => {
    if (!selectedGroup) return;

    // Extract the GUID from "dynamic:{guid}"
    const guidMatch = selectedGroup.id.match(/^dynamic:(.+)$/);
    if (!guidMatch) return;

    try {
      await unifiedGroupsApi.updateDynamic(guidMatch[1], {
        displayName: dynamicFormData.displayName,
        description: dynamicFormData.description || undefined,
        email: dynamicFormData.email || undefined,
        filterCriteria: dynamicFormData.filterCriteria,
      });
      setEditDynamicModalOpen(false);
      loadGroups();
      // Refresh detail
      setSelectedGroup(prev => prev ? { ...prev, displayName: dynamicFormData.displayName } : null);
    } catch (err) {
      console.error('Failed to update dynamic group:', err);
      alert('Kon groep niet bijwerken');
    }
  };

  const handleDeleteGroup = async (group: UnifiedGroup) => {
    if (!window.confirm(`Weet u zeker dat u "${group.displayName}" wilt verwijderen?`)) {
      return;
    }

    try {
      if (group.source === 'Dynamic') {
        const guidMatch = group.id.match(/^dynamic:(.+)$/);
        if (guidMatch) {
          await unifiedGroupsApi.deleteDynamic(guidMatch[1]);
        }
      } else if (group.source === 'Local') {
        const guidMatch = group.id.match(/^local:(.+)$/);
        if (guidMatch) {
          await unifiedGroupsApi.deleteLocal(guidMatch[1]);
        }
      }

      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
      loadGroups();
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert('Kon groep niet verwijderen');
    }
  };

  const handleAddMember = async (employeeId: string) => {
    if (!selectedGroup || selectedGroup.source !== 'Local') return;

    const guidMatch = selectedGroup.id.match(/^local:(.+)$/);
    if (!guidMatch) return;

    try {
      await unifiedGroupsApi.addMemberToLocal(guidMatch[1], employeeId);
      // Refresh group detail
      const detail = await unifiedGroupsApi.getById(selectedGroup.id);
      setGroupDetail(detail);
      // Update group count in list
      setGroups(prev => prev.map(g =>
        g.id === selectedGroup.id
          ? { ...g, memberCount: detail.members.length }
          : g
      ));
    } catch (err) {
      console.error('Failed to add member:', err);
      alert('Kon lid niet toevoegen');
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!selectedGroup || selectedGroup.source !== 'Local') return;

    const guidMatch = selectedGroup.id.match(/^local:(.+)$/);
    if (!guidMatch) return;

    try {
      await unifiedGroupsApi.removeMemberFromLocal(guidMatch[1], employeeId);
      // Refresh group detail
      const detail = await unifiedGroupsApi.getById(selectedGroup.id);
      setGroupDetail(detail);
      // Update group count in list
      setGroups(prev => prev.map(g =>
        g.id === selectedGroup.id
          ? { ...g, memberCount: detail.members.length }
          : g
      ));
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Kon lid niet verwijderen');
    }
  };

  const handleEvaluateDynamic = async () => {
    if (!selectedGroup || selectedGroup.source !== 'Dynamic') return;

    const guidMatch = selectedGroup.id.match(/^dynamic:(.+)$/);
    if (!guidMatch) return;

    try {
      await unifiedGroupsApi.evaluateDynamic(guidMatch[1]);
      // Refresh
      const detail = await unifiedGroupsApi.getById(selectedGroup.id);
      setGroupDetail(detail);
      loadGroups();
    } catch (err) {
      console.error('Failed to evaluate dynamic group:', err);
    }
  };

  const openEditDynamicModal = () => {
    if (!selectedGroup || !groupDetail) return;
    setDynamicFormData({
      displayName: selectedGroup.displayName,
      description: groupDetail.filterCriteria ? '' : (selectedGroup.description || ''),
      email: selectedGroup.email || '',
      filterCriteria: groupDetail.filterCriteria || { alleenActief: true },
    });
    setEditDynamicModalOpen(true);
  };

  // Render group source icon
  const GroupSourceIcon = ({ source }: { source: GroupSource }) => {
    const Icon = sourceIcons[source];
    return (
      <span
        className="dg-source-icon"
        style={{ color: sourceColors[source] }}
        title={sourceLabels[source]}
      >
        <Icon size={14} />
      </span>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Distributiegroepen</h1>
          <p className="page-subtitle">
            Exchange, Dynamische en Lokale groepen &mdash; {groups.length} groepen totaal
          </p>
        </div>
        <div className="page-actions">
          <SyncKnop />
          <div className="dropdown">
            <button className="btn btn-primary">
              <Plus size={16} /> Nieuwe Groep
            </button>
            <div className="dropdown-menu">
              <button onClick={() => setCreateDynamicModalOpen(true)}>
                <Zap size={14} /> Dynamische Groep
              </button>
              <button onClick={() => setCreateLocalModalOpen(true)}>
                <User size={14} /> Lokale Groep
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dg-tabs">
        <button
          className={`dg-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Alle <span className="dg-tab-count">{tabCounts.all}</span>
        </button>
        <button
          className={`dg-tab ${activeTab === 'Exchange' ? 'active' : ''}`}
          onClick={() => setActiveTab('Exchange')}
        >
          <Cloud size={14} /> Exchange <span className="dg-tab-count">{tabCounts.Exchange}</span>
        </button>
        <button
          className={`dg-tab ${activeTab === 'Dynamic' ? 'active' : ''}`}
          onClick={() => setActiveTab('Dynamic')}
        >
          <Zap size={14} /> Dynamisch <span className="dg-tab-count">{tabCounts.Dynamic}</span>
        </button>
        <button
          className={`dg-tab ${activeTab === 'Local' ? 'active' : ''}`}
          onClick={() => setActiveTab('Local')}
        >
          <User size={14} /> Lokaal <span className="dg-tab-count">{tabCounts.Local}</span>
        </button>
      </div>

      <div className="dg-layout">
        {/* Left panel: groups list */}
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
            {loading ? (
              <div className="dg-loading">
                <Loader2 size={24} className="spin" />
                <span>Groepen laden...</span>
              </div>
            ) : error ? (
              <div className="dg-error">
                <span>{error}</span>
                <button className="btn btn-sm" onClick={loadGroups}>Opnieuw proberen</button>
              </div>
            ) : (
              <>
                {filteredGroups.map(group => {
                  const isSelected = selectedGroup?.id === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`dg-group-card ${isSelected ? 'dg-group-selected' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="dg-group-icon" style={{ backgroundColor: `${sourceColors[group.source]}15` }}>
                        <GroupSourceIcon source={group.source} />
                      </div>
                      <div className="dg-group-info">
                        <div className="dg-group-name">{group.displayName}</div>
                        <div className="dg-group-email">{group.email || 'Geen e-mail'}</div>
                        <div className="dg-group-meta">
                          <span
                            className="dg-group-source-tag"
                            style={{
                              backgroundColor: `${sourceColors[group.source]}15`,
                              color: sourceColors[group.source]
                            }}
                          >
                            {sourceLabels[group.source]}
                          </span>
                          <span className="dg-group-members">
                            <Users size={12} /> {group.memberCount}
                          </span>
                          {group.isReadOnly && (
                            <span className="dg-badge dg-badge-readonly" title="Alleen-lezen">
                              <ExternalLink size={10} /> Read-only
                            </span>
                          )}
                          {group.isSystemGroup && (
                            <span className="dg-badge dg-badge-system" title="Systeemgroep">
                              Systeem
                            </span>
                          )}
                        </div>
                      </div>
                      {!group.isReadOnly && (
                        <div className="dg-group-actions" onClick={e => e.stopPropagation()}>
                          {group.source === 'Dynamic' && (
                            <button
                              className="icon-btn"
                              title="Bewerken"
                              onClick={() => {
                                setSelectedGroup(group);
                                setTimeout(openEditDynamicModal, 100);
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {!group.isSystemGroup && (
                            <button
                              className="icon-btn icon-btn-danger"
                              title="Verwijderen"
                              onClick={() => handleDeleteGroup(group)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredGroups.length === 0 && (
                  <div className="dg-empty">
                    <Mail size={32} className="text-muted" />
                    <p>Geen groepen gevonden.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        <div className="dg-detail-panel">
          {selectedGroup ? (
            <>
              <div className="dg-detail-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2>{selectedGroup.displayName}</h2>
                    <GroupSourceIcon source={selectedGroup.source} />
                  </div>
                  <span className="dg-detail-email">{selectedGroup.email || 'Geen e-mail'}</span>
                  {selectedGroup.description && (
                    <p className="dg-detail-desc">{selectedGroup.description}</p>
                  )}
                </div>
                <div className="dg-detail-actions">
                  {selectedGroup.source === 'Dynamic' && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleEvaluateDynamic}
                        title="Herbereken leden"
                      >
                        <RefreshCw size={14} /> Herberekenen
                      </button>
                      {!selectedGroup.isSystemGroup && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={openEditDynamicModal}
                        >
                          <Edit3 size={14} /> Filters
                        </button>
                      )}
                    </>
                  )}
                  {selectedGroup.source === 'Local' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setMemberSearchTerm(''); setAddMemberModalOpen(true); }}
                    >
                      <UserPlus size={14} /> Lid Toevoegen
                    </button>
                  )}
                  {selectedGroup.source === 'Exchange' && (
                    <a
                      className="btn btn-secondary btn-sm"
                      href="https://admin.exchange.microsoft.com/#/groups"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} /> Beheer in Exchange
                    </a>
                  )}
                </div>
              </div>

              <div className="dg-detail-stats">
                <div className="dg-stat">
                  <Users size={16} />
                  <strong>{groupDetail?.members.length ?? selectedGroup.memberCount}</strong> leden
                </div>
                <div className="dg-stat">
                  <span
                    className="dg-group-source-tag"
                    style={{
                      backgroundColor: `${sourceColors[selectedGroup.source]}15`,
                      color: sourceColors[selectedGroup.source]
                    }}
                  >
                    {sourceLabels[selectedGroup.source]}
                  </span>
                </div>
                {selectedGroup.lastEvaluatedAt && (
                  <div className="dg-stat text-muted">
                    Laatst geëvalueerd: {new Date(selectedGroup.lastEvaluatedAt).toLocaleString('nl-BE')}
                  </div>
                )}
              </div>

              {/* Filter criteria for dynamic groups */}
              {selectedGroup.source === 'Dynamic' && groupDetail?.filterCriteria && (
                <div className="dg-filter-info">
                  <div className="dg-filter-header">
                    <Filter size={14} /> Actieve Filters
                  </div>
                  <div className="dg-filter-tags">
                    {groupDetail.filterCriteria.alleenActief && (
                      <span className="dg-filter-tag">Alleen actief</span>
                    )}
                    {groupDetail.filterCriteria.employeeTypes?.map(t => (
                      <span key={t} className="dg-filter-tag">Type: {t}</span>
                    ))}
                    {groupDetail.filterCriteria.arbeidsRegimes?.map(r => (
                      <span key={r} className="dg-filter-tag">Regime: {r}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="dg-members-table">
                {detailLoading ? (
                  <div className="dg-loading">
                    <Loader2 size={24} className="spin" />
                    <span>Leden laden...</span>
                  </div>
                ) : (
                  <table className="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Naam</th>
                        <th>E-mail</th>
                        <th>Functie</th>
                        <th>Type</th>
                        {selectedGroup.source === 'Local' && (
                          <th style={{ width: 60 }}>Acties</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {groupDetail?.members.map(m => (
                        <tr key={m.id}>
                          <td className="td-name">{m.displayName}</td>
                          <td className="td-email">{m.email}</td>
                          <td>{m.jobTitle || '-'}</td>
                          <td>{m.employeeType}</td>
                          {selectedGroup.source === 'Local' && (
                            <td>
                              <button
                                className="icon-btn icon-btn-danger"
                                title="Verwijder uit groep"
                                onClick={() => handleRemoveMember(m.id)}
                              >
                                <UserMinus size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {(!groupDetail?.members || groupDetail.members.length === 0) && (
                        <tr>
                          <td colSpan={selectedGroup.source === 'Local' ? 5 : 4} className="empty-state">
                            Deze groep heeft nog geen leden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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

      {/* Create Local Group Modal */}
      {createLocalModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateLocalModalOpen(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><User size={20} /> Nieuwe Lokale Groep</h2>
              <button className="icon-btn" onClick={() => setCreateLocalModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <p className="text-muted" style={{ marginBottom: 16 }}>
                Lokale groepen worden handmatig beheerd. U kunt na het aanmaken leden toevoegen.
              </p>
              <div className="form-group">
                <label htmlFor="local-name">Naam *</label>
                <input
                  id="local-name"
                  type="text"
                  required
                  value={localFormData.displayName}
                  onChange={e => setLocalFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="bijv. Politie Diepenbeek"
                />
              </div>
              <div className="form-group">
                <label htmlFor="local-email">E-mailadres (optioneel)</label>
                <input
                  id="local-email"
                  type="email"
                  value={localFormData.email}
                  onChange={e => setLocalFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="bijv. politie@diepenbeek.be"
                />
              </div>
              <div className="form-group">
                <label htmlFor="local-desc">Beschrijving</label>
                <textarea
                  id="local-desc"
                  rows={3}
                  value={localFormData.description}
                  onChange={e => setLocalFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Korte beschrijving van de groep..."
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setCreateLocalModalOpen(false)}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateLocalGroup}
                  disabled={!localFormData.displayName}
                >
                  Aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Dynamic Group Modal */}
      {createDynamicModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateDynamicModalOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Zap size={20} /> Nieuwe Dynamische Groep</h2>
              <button className="icon-btn" onClick={() => setCreateDynamicModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <p className="text-muted" style={{ marginBottom: 16 }}>
                Dynamische groepen berekenen automatisch hun leden op basis van filters.
              </p>
              <div className="form-group">
                <label htmlFor="dynamic-name">Naam *</label>
                <input
                  id="dynamic-name"
                  type="text"
                  required
                  value={dynamicFormData.displayName}
                  onChange={e => setDynamicFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="bijv. Alle Deeltijds Personeel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dynamic-email">E-mailadres (optioneel)</label>
                <input
                  id="dynamic-email"
                  type="email"
                  value={dynamicFormData.email}
                  onChange={e => setDynamicFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="bijv. deeltijds@diepenbeek.be"
                />
              </div>

              <div className="form-group">
                <label>Filter Criteria</label>
                <div className="dg-filter-builder">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={dynamicFormData.filterCriteria.alleenActief ?? true}
                      onChange={e => setDynamicFormData(prev => ({
                        ...prev,
                        filterCriteria: { ...prev.filterCriteria, alleenActief: e.target.checked }
                      }))}
                    />
                    Alleen actieve medewerkers
                  </label>

                  <div className="filter-section">
                    <label>Type medewerker:</label>
                    <div className="checkbox-grid">
                      {['Personeel', 'Vrijwilliger', 'Interim', 'Extern', 'Stagiair'].map(type => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={dynamicFormData.filterCriteria.employeeTypes?.includes(type) ?? false}
                            onChange={e => {
                              const current = dynamicFormData.filterCriteria.employeeTypes || [];
                              const updated = e.target.checked
                                ? [...current, type]
                                : current.filter(t => t !== type);
                              setDynamicFormData(prev => ({
                                ...prev,
                                filterCriteria: {
                                  ...prev.filterCriteria,
                                  employeeTypes: updated.length > 0 ? updated : undefined
                                }
                              }));
                            }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <label>Arbeidsregime:</label>
                    <div className="checkbox-grid">
                      {['Voltijds', 'Deeltijds', 'Vrijwilliger'].map(regime => (
                        <label key={regime} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={dynamicFormData.filterCriteria.arbeidsRegimes?.includes(regime) ?? false}
                            onChange={e => {
                              const current = dynamicFormData.filterCriteria.arbeidsRegimes || [];
                              const updated = e.target.checked
                                ? [...current, regime]
                                : current.filter(r => r !== regime);
                              setDynamicFormData(prev => ({
                                ...prev,
                                filterCriteria: {
                                  ...prev.filterCriteria,
                                  arbeidsRegimes: updated.length > 0 ? updated : undefined
                                }
                              }));
                            }}
                          />
                          {regime}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setCreateDynamicModalOpen(false)}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateDynamicGroup}
                  disabled={!dynamicFormData.displayName}
                >
                  Aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dynamic Group Modal */}
      {editDynamicModalOpen && selectedGroup && (
        <div className="modal-overlay" onClick={() => setEditDynamicModalOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Zap size={20} /> Dynamische Groep Bewerken</h2>
              <button className="icon-btn" onClick={() => setEditDynamicModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-dynamic-name">Naam *</label>
                <input
                  id="edit-dynamic-name"
                  type="text"
                  required
                  value={dynamicFormData.displayName}
                  onChange={e => setDynamicFormData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-dynamic-email">E-mailadres (optioneel)</label>
                <input
                  id="edit-dynamic-email"
                  type="email"
                  value={dynamicFormData.email}
                  onChange={e => setDynamicFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Filter Criteria</label>
                <div className="dg-filter-builder">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={dynamicFormData.filterCriteria.alleenActief ?? true}
                      onChange={e => setDynamicFormData(prev => ({
                        ...prev,
                        filterCriteria: { ...prev.filterCriteria, alleenActief: e.target.checked }
                      }))}
                    />
                    Alleen actieve medewerkers
                  </label>

                  <div className="filter-section">
                    <label>Type medewerker:</label>
                    <div className="checkbox-grid">
                      {['Personeel', 'Vrijwilliger', 'Interim', 'Extern', 'Stagiair'].map(type => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={dynamicFormData.filterCriteria.employeeTypes?.includes(type) ?? false}
                            onChange={e => {
                              const current = dynamicFormData.filterCriteria.employeeTypes || [];
                              const updated = e.target.checked
                                ? [...current, type]
                                : current.filter(t => t !== type);
                              setDynamicFormData(prev => ({
                                ...prev,
                                filterCriteria: {
                                  ...prev.filterCriteria,
                                  employeeTypes: updated.length > 0 ? updated : undefined
                                }
                              }));
                            }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <label>Arbeidsregime:</label>
                    <div className="checkbox-grid">
                      {['Voltijds', 'Deeltijds', 'Vrijwilliger'].map(regime => (
                        <label key={regime} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={dynamicFormData.filterCriteria.arbeidsRegimes?.includes(regime) ?? false}
                            onChange={e => {
                              const current = dynamicFormData.filterCriteria.arbeidsRegimes || [];
                              const updated = e.target.checked
                                ? [...current, regime]
                                : current.filter(r => r !== regime);
                              setDynamicFormData(prev => ({
                                ...prev,
                                filterCriteria: {
                                  ...prev.filterCriteria,
                                  arbeidsRegimes: updated.length > 0 ? updated : undefined
                                }
                              }));
                            }}
                          />
                          {regime}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setEditDynamicModalOpen(false)}>
                  Annuleren
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateDynamicGroup}
                  disabled={!dynamicFormData.displayName}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal (for Local groups) */}
      {addMemberModalOpen && selectedGroup && (
        <div className="modal-overlay" onClick={() => setAddMemberModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={20} /> Lid toevoegen aan {selectedGroup.displayName}
              </h2>
              <button className="icon-btn" onClick={() => setAddMemberModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className="search-box" style={{ maxWidth: 'none', marginBottom: 16 }}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Zoek medewerker op naam, e-mail of dienst..."
                  value={memberSearchTerm}
                  onChange={e => setMemberSearchTerm(e.target.value)}
                  autoFocus
                />
                {memberSearchTerm && (
                  <button className="search-clear" onClick={() => setMemberSearchTerm('')}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="dg-add-members-list">
                {employeesLoading ? (
                  <div className="dg-loading">
                    <Loader2 size={24} className="spin" />
                    <span>Medewerkers laden...</span>
                  </div>
                ) : (
                  <table className="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th>Naam</th>
                        <th>E-mail</th>
                        <th>Type</th>
                        <th>Dienst</th>
                        <th style={{ width: 100 }}>Actie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableEmployees.slice(0, 20).map(m => (
                        <tr key={m.id}>
                          <td className="td-name">{m.displayName}</td>
                          <td className="td-email">{m.email}</td>
                          <td>{m.employeeType}</td>
                          <td>{m.dienstNaam || '-'}</td>
                          <td>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAddMember(m.id)}
                            >
                              <Check size={12} /> Toevoegen
                            </button>
                          </td>
                        </tr>
                      ))}
                      {availableEmployees.length === 0 && !employeesLoading && (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            Geen beschikbare medewerkers gevonden.
                          </td>
                        </tr>
                      )}
                      {availableEmployees.length > 20 && (
                        <tr>
                          <td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 12 }}>
                            ... en {availableEmployees.length - 20} anderen. Gebruik de zoekbalk om te filteren.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dg-tabs {
          display: flex;
          gap: 4px;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 16px;
        }

        .dg-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s ease;
        }

        .dg-tab:hover {
          color: var(--text-primary);
          background: var(--surface-hover);
        }

        .dg-tab.active {
          color: var(--primary-main);
          border-bottom-color: var(--primary-main);
        }

        .dg-tab-count {
          background: var(--surface-elevated);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        .dg-tab.active .dg-tab-count {
          background: var(--primary-light);
          color: var(--primary-main);
        }

        .dg-source-icon {
          display: inline-flex;
          align-items: center;
        }

        .dg-group-source-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .dg-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .dg-badge-readonly {
          background: var(--warning-light);
          color: var(--warning-dark);
        }

        .dg-badge-system {
          background: var(--info-light);
          color: var(--info-dark);
        }

        .dg-detail-actions {
          display: flex;
          gap: 8px;
        }

        .dg-filter-info {
          background: var(--surface-elevated);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .dg-filter-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .dg-filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .dg-filter-tag {
          background: var(--primary-light);
          color: var(--primary-main);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .dg-filter-builder {
          background: var(--surface-elevated);
          border-radius: 8px;
          padding: 16px;
        }

        .filter-section {
          margin-top: 16px;
        }

        .filter-section > label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .dropdown {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          padding: 4px;
          display: none;
          min-width: 180px;
          z-index: 100;
        }

        .dropdown:hover .dropdown-menu {
          display: block;
        }

        .dropdown-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
        }

        .dropdown-menu button:hover {
          background: var(--surface-hover);
        }
      `}</style>
    </div>
  );
}
