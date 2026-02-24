import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Edit3,
  Trash2,
  Users,
  Unlock,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  userRolesApi,
  distributionGroupsApi,
  type UserRole,
  type RoleDefinition,
  type UserSearchResult,
  type CreateUserRoleDto,
  type UpdateUserRoleDto,
  type Sector,
  type Dienst,
} from '../services/api';

interface RolDefinitie {
  id: string;
  naam: string;
  beschrijving: string;
  rechten: string[];
  aantalGebruikers: number;
  kleur: string;
  scope: string;
}

export default function Rollen() {
  const [activeTab, setActiveTab] = useState<'rollen' | 'toewijzingen'>('rollen');
  const [selectedRol, setSelectedRol] = useState<RolDefinitie | null>(null);

  // Data states
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [formRole, setFormRole] = useState('');
  const [formSectorId, setFormSectorId] = useState<string>('');
  const [formDienstId, setFormDienstId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, definitionsData, hierarchyData] = await Promise.all([
        userRolesApi.getAll(),
        userRolesApi.getDefinitions(),
        distributionGroupsApi.getHierarchy(),
      ]);
      setUserRoles(rolesData);
      setRoleDefinitions(definitionsData);
      setSectors(hierarchyData.sectors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij het laden van gegevens');
    } finally {
      setLoading(false);
    }
  };

  // Map role definitions to display format
  const rolDefinities: RolDefinitie[] = roleDefinitions.map(def => {
    const count = userRoles.filter(r => r.role === def.id && r.isActive).length;
    return {
      id: def.id,
      naam: def.displayName,
      beschrijving: def.description,
      rechten: def.permissions,
      aantalGebruikers: count,
      scope: def.scope,
      kleur:
        def.id === 'ict_super_admin'
          ? 'var(--color-error)'
          : def.id === 'hr_admin'
          ? 'var(--color-primary)'
          : def.id === 'sectormanager'
          ? 'var(--color-info)'
          : def.id === 'diensthoofd'
          ? 'var(--color-warning)'
          : 'var(--color-muted)',
    };
  });

  // Get diensten for selected sector
  const getDienstenForSector = (sectorId: string): Dienst[] => {
    const sector = sectors.find(s => s.id === sectorId);
    return sector?.diensten || [];
  };

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await userRolesApi.searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Zoeken mislukt:', err);
    } finally {
      setSearching(false);
    }
  };

  // Open modal for new assignment
  const handleNewAssignment = () => {
    setEditingRole(null);
    setSelectedUser(null);
    setFormRole('');
    setFormSectorId('');
    setFormDienstId('');
    setSearchQuery('');
    setSearchResults([]);
    setFormError(null);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (role: UserRole) => {
    setEditingRole(role);
    setSelectedUser({
      entraObjectId: role.entraObjectId,
      displayName: role.displayName,
      email: role.email,
      jobTitle: null,
      department: null,
      hasExistingRole: true,
      existingRoles: [role.role],
    });
    setFormRole(role.role);
    setFormSectorId(role.sectorId || '');
    setFormDienstId(role.dienstId || '');
    setFormError(null);
    setShowModal(true);
  };

  // Select user from search
  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Save assignment
  const handleSave = async () => {
    if (!selectedUser) {
      setFormError('Selecteer een gebruiker');
      return;
    }
    if (!formRole) {
      setFormError('Selecteer een rol');
      return;
    }

    // Check if sector/dienst is required
    const roleDef = roleDefinitions.find(r => r.id === formRole);
    if (roleDef?.scope === 'sector' && !formSectorId) {
      setFormError('Selecteer een sector voor deze rol');
      return;
    }
    if (roleDef?.scope === 'dienst' && !formDienstId) {
      setFormError('Selecteer een dienst voor deze rol');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingRole) {
        // Update existing
        const dto: UpdateUserRoleDto = {
          role: formRole,
          sectorId: formSectorId || undefined,
          dienstId: formDienstId || undefined,
        };
        await userRolesApi.update(editingRole.id, dto);
        setSuccessMessage('Rol succesvol bijgewerkt');
      } else {
        // Create new
        const dto: CreateUserRoleDto = {
          entraObjectId: selectedUser.entraObjectId,
          email: selectedUser.email,
          displayName: selectedUser.displayName,
          role: formRole,
          sectorId: formSectorId || undefined,
          dienstId: formDienstId || undefined,
        };
        await userRolesApi.create(dto);
        setSuccessMessage('Rol succesvol toegekend');
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Delete assignment
  const handleDelete = async (id: string) => {
    try {
      await userRolesApi.delete(id);
      setSuccessMessage('Rol succesvol verwijderd');
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ict_super_admin':
        return 'role-badge-ict';
      case 'hr_admin':
        return 'role-badge-hr_admin';
      case 'sectormanager':
        return 'role-badge-sectormanager';
      case 'diensthoofd':
        return 'role-badge-diensthoofd';
      default:
        return 'role-badge-medewerker';
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Rollen & Rechten</h1>
          <p className="page-subtitle">
            Beheer profielen, rollen en rechten binnen de organisatie
          </p>
        </div>
        {activeTab === 'toewijzingen' && (
          <button className="btn btn-primary" onClick={handleNewAssignment}>
            <Plus size={16} /> Nieuwe Toewijzing
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          {error}
          <button className="alert-close" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'rollen' ? 'active' : ''}`}
          onClick={() => setActiveTab('rollen')}
        >
          <Shield size={16} /> Rollen Overzicht
        </button>
        <button
          className={`tab ${activeTab === 'toewijzingen' ? 'active' : ''}`}
          onClick={() => setActiveTab('toewijzingen')}
        >
          <UserCog size={16} /> Toewijzingen ({userRoles.filter(r => r.isActive).length})
        </button>
      </div>

      {activeTab === 'rollen' && (
        <div className="roles-grid">
          {rolDefinities.map(rol => (
            <div
              key={rol.id}
              className={`role-card ${selectedRol?.id === rol.id ? 'role-card-selected' : ''}`}
              onClick={() => setSelectedRol(selectedRol?.id === rol.id ? null : rol)}
            >
              <div className="role-card-header" style={{ borderLeftColor: rol.kleur }}>
                <div className="role-icon" style={{ color: rol.kleur }}>
                  {rol.id === 'ict_super_admin' ? (
                    <ShieldAlert size={28} />
                  ) : rol.id === 'hr_admin' ? (
                    <ShieldCheck size={28} />
                  ) : rol.id === 'sectormanager' ? (
                    <Shield size={28} />
                  ) : rol.id === 'diensthoofd' ? (
                    <Shield size={28} />
                  ) : (
                    <Users size={28} />
                  )}
                </div>
                <div>
                  <h3 className="role-name">{rol.naam}</h3>
                  <span className="role-users">
                    <Users size={14} /> {rol.aantalGebruikers} gebruikers
                  </span>
                </div>
              </div>

              <p className="role-description">{rol.beschrijving}</p>

              <div className="role-scope">
                <span className="scope-label">Bereik:</span>
                <span className="scope-value">
                  {rol.scope === 'all'
                    ? 'Volledige organisatie'
                    : rol.scope === 'sector'
                    ? 'Eigen sector'
                    : rol.scope === 'dienst'
                    ? 'Eigen dienst'
                    : 'Eigen gegevens'}
                </span>
              </div>

              {selectedRol?.id === rol.id && rol.rechten.length > 0 && (
                <div className="role-permissions">
                  <h4>Rechten:</h4>
                  <ul className="permissions-list">
                    {rol.rechten.map((recht, i) => (
                      <li key={i}>
                        <Unlock size={14} className="text-success" />
                        {recht}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'toewijzingen' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Rol</th>
                <th>Sector</th>
                <th>Dienst</th>
                <th>Status</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {userRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Geen roltoewijzingen gevonden
                  </td>
                </tr>
              ) : (
                userRoles.map(t => (
                  <tr key={t.id} className={!t.isActive ? 'row-inactive' : ''}>
                    <td className="td-name">{t.displayName}</td>
                    <td className="td-email">{t.email}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(t.role)}`}>
                        {t.roleDisplayName}
                      </span>
                    </td>
                    <td>{t.sectorNaam || '-'}</td>
                    <td>{t.dienstNaam || '-'}</td>
                    <td>
                      <span className={`status-badge ${t.isActive ? 'status-active' : 'status-inactive'}`}>
                        {t.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        className="icon-btn"
                        title="Bewerken"
                        onClick={() => handleEdit(t)}
                      >
                        <Edit3 size={16} />
                      </button>
                      {deleteConfirm === t.id ? (
                        <div className="delete-confirm">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(t.id)}
                          >
                            Bevestig
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Annuleer
                          </button>
                        </div>
                      ) : (
                        <button
                          className="icon-btn icon-btn-danger"
                          title="Verwijderen"
                          onClick={() => setDeleteConfirm(t.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding/editing role assignments */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Rol Bewerken' : 'Nieuwe Roltoewijzing'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              {/* User search (only for new assignments) */}
              {!editingRole && !selectedUser && (
                <div className="form-group">
                  <label>Zoek gebruiker</label>
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Zoek op naam of e-mail..."
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      className="form-input"
                    />
                    {searching && <Loader2 size={16} className="spinner" />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(user => (
                        <div
                          key={user.entraObjectId}
                          className="search-result-item"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="search-result-info">
                            <span className="search-result-name">{user.displayName}</span>
                            <span className="search-result-email">{user.email}</span>
                          </div>
                          {user.hasExistingRole && (
                            <span className="search-result-badge">
                              Heeft al rollen
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected user display */}
              {selectedUser && (
                <div className="form-group">
                  <label>Geselecteerde gebruiker</label>
                  <div className="selected-user">
                    <div className="selected-user-info">
                      <span className="selected-user-name">{selectedUser.displayName}</span>
                      <span className="selected-user-email">{selectedUser.email}</span>
                    </div>
                    {!editingRole && (
                      <button
                        className="btn btn-sm"
                        onClick={() => setSelectedUser(null)}
                      >
                        Wijzig
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Role selection */}
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formRole}
                  onChange={e => {
                    setFormRole(e.target.value);
                    // Reset sector/dienst when role changes
                    setFormSectorId('');
                    setFormDienstId('');
                  }}
                  className="form-select"
                >
                  <option value="">Selecteer een rol...</option>
                  {roleDefinitions.map(def => (
                    <option key={def.id} value={def.id}>
                      {def.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector selection (for sectormanager/diensthoofd) */}
              {formRole && ['sectormanager', 'diensthoofd'].includes(formRole) && (
                <div className="form-group">
                  <label>Sector</label>
                  <select
                    value={formSectorId}
                    onChange={e => {
                      setFormSectorId(e.target.value);
                      setFormDienstId('');
                    }}
                    className="form-select"
                  >
                    <option value="">Selecteer een sector...</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dienst selection (for diensthoofd) */}
              {formRole === 'diensthoofd' && formSectorId && (
                <div className="form-group">
                  <label>Dienst</label>
                  <select
                    value={formDienstId}
                    onChange={e => setFormDienstId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Selecteer een dienst...</option>
                    {getDienstenForSector(formSectorId).map(dienst => (
                      <option key={dienst.id} value={dienst.id}>
                        {dienst.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !selectedUser || !formRole}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Opslaan...
                  </>
                ) : (
                  'Opslaan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
