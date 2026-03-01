import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  Play,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Wand2,
  Target,
  Hash,
  FileText,
  Users,
} from 'lucide-react';
import {
  jobTitleRoleMappingsApi,
  userRolesApi,
  type JobTitleRoleMapping,
  type CreateJobTitleRoleMappingDto,
  type UpdateJobTitleRoleMappingDto,
  type AutoRoleAssignmentSummary,
  type RoleDefinition,
  type ScopeDeterminationType,
  type ScopeDeterminationTypeDto,
} from '../services/api';

export default function AutoRoltoewijzing() {
  const [activeTab, setActiveTab] = useState<'mappings' | 'uitvoeren'>('mappings');

  // Data states
  const [mappings, setMappings] = useState<JobTitleRoleMapping[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [scopeTypes, setScopeTypes] = useState<ScopeDeterminationTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<JobTitleRoleMapping | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [formPattern, setFormPattern] = useState('');
  const [formExactMatch, setFormExactMatch] = useState(false);
  const [formRole, setFormRole] = useState('');
  const [formScopeDetermination, setFormScopeDetermination] = useState<ScopeDeterminationType>('None');
  const [formPriority, setFormPriority] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-assignment states
  const [previewResult, setPreviewResult] = useState<AutoRoleAssignmentSummary | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executingAssignment, setExecutingAssignment] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AutoRoleAssignmentSummary | null>(null);

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
      const [mappingsData, definitionsData, scopeTypesData] = await Promise.all([
        jobTitleRoleMappingsApi.getAll(),
        userRolesApi.getDefinitions(),
        jobTitleRoleMappingsApi.getScopeTypes(),
      ]);
      setMappings(mappingsData);
      setRoleDefinitions(definitionsData);
      setScopeTypes(scopeTypesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij het laden van gegevens');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new mapping
  const handleNew = () => {
    setEditingMapping(null);
    setFormPattern('');
    setFormExactMatch(false);
    setFormRole('');
    setFormScopeDetermination('None');
    setFormPriority(0);
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (mapping: JobTitleRoleMapping) => {
    setEditingMapping(mapping);
    setFormPattern(mapping.jobTitlePattern);
    setFormExactMatch(mapping.exactMatch);
    setFormRole(mapping.role);
    setFormScopeDetermination(mapping.scopeDetermination);
    setFormPriority(mapping.priority);
    setFormDescription(mapping.description || '');
    setFormIsActive(mapping.isActive);
    setFormError(null);
    setShowModal(true);
  };

  // Save mapping
  const handleSave = async () => {
    if (!formPattern.trim()) {
      setFormError('Functietitel patroon is verplicht');
      return;
    }
    if (!formRole) {
      setFormError('Selecteer een rol');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingMapping) {
        const dto: UpdateJobTitleRoleMappingDto = {
          jobTitlePattern: formPattern.trim(),
          exactMatch: formExactMatch,
          role: formRole,
          scopeDetermination: formScopeDetermination,
          priority: formPriority,
          description: formDescription || undefined,
          isActive: formIsActive,
        };
        await jobTitleRoleMappingsApi.update(editingMapping.id, dto);
        setSuccessMessage('Mapping succesvol bijgewerkt');
      } else {
        const dto: CreateJobTitleRoleMappingDto = {
          jobTitlePattern: formPattern.trim(),
          exactMatch: formExactMatch,
          role: formRole,
          scopeDetermination: formScopeDetermination,
          priority: formPriority,
          description: formDescription || undefined,
        };
        await jobTitleRoleMappingsApi.create(dto);
        setSuccessMessage('Mapping succesvol aangemaakt');
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Delete mapping
  const handleDelete = async (id: string) => {
    try {
      await jobTitleRoleMappingsApi.delete(id);
      setSuccessMessage('Mapping succesvol verwijderd');
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen');
    }
  };

  // Toggle active status
  const handleToggleActive = async (mapping: JobTitleRoleMapping) => {
    try {
      await jobTitleRoleMappingsApi.update(mapping.id, { isActive: !mapping.isActive });
      setSuccessMessage(`Mapping ${!mapping.isActive ? 'geactiveerd' : 'gedeactiveerd'}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij wijzigen status');
    }
  };

  // Preview auto-assignment
  const handlePreview = async (onlyNew: boolean = false) => {
    setLoadingPreview(true);
    setPreviewResult(null);
    setAssignmentResult(null);
    try {
      const result = await jobTitleRoleMappingsApi.previewAutoAssignment(onlyNew);
      setPreviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Execute auto-assignment
  const handleExecute = async (onlyNew: boolean = false) => {
    setExecutingAssignment(true);
    setAssignmentResult(null);
    try {
      const result = await jobTitleRoleMappingsApi.assignRolesForAll(onlyNew);
      setAssignmentResult(result);
      setSuccessMessage(`${result.rolesAssigned} rollen succesvol toegekend`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij uitvoeren');
    } finally {
      setExecutingAssignment(false);
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
          <h1>
            <Wand2 size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Automatische Roltoewijzing
          </h1>
          <p className="page-subtitle">
            Configureer automatische roltoewijzing op basis van functietitels
          </p>
        </div>
        {activeTab === 'mappings' && (
          <button className="btn btn-primary" onClick={handleNew}>
            <Plus size={16} /> Nieuwe Mapping
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
          className={`tab ${activeTab === 'mappings' ? 'active' : ''}`}
          onClick={() => setActiveTab('mappings')}
        >
          <Settings size={16} /> Mappings Configuratie
        </button>
        <button
          className={`tab ${activeTab === 'uitvoeren' ? 'active' : ''}`}
          onClick={() => setActiveTab('uitvoeren')}
        >
          <Play size={16} /> Uitvoeren
        </button>
      </div>

      {activeTab === 'mappings' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Functietitel Patroon</th>
                <th>Match Type</th>
                <th>Rol</th>
                <th>Scope Bepaling</th>
                <th>Prioriteit</th>
                <th>Status</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Geen mappings geconfigureerd. Klik op "Nieuwe Mapping" om te beginnen.
                  </td>
                </tr>
              ) : (
                mappings.map(m => (
                  <tr key={m.id} className={!m.isActive ? 'row-inactive' : ''}>
                    <td className="td-name">
                      <code>{m.jobTitlePattern}</code>
                    </td>
                    <td>
                      <span className={`badge ${m.exactMatch ? 'badge-primary' : 'badge-secondary'}`}>
                        {m.exactMatch ? 'Exact' : 'Bevat'}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(m.role)}`}>
                        {m.roleDisplayName}
                      </span>
                    </td>
                    <td>{m.scopeDeterminationDisplayName}</td>
                    <td>
                      <span className="priority-badge">{m.priority}</span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${m.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(m)}
                        title={m.isActive ? 'Deactiveren' : 'Activeren'}
                      >
                        {m.isActive ? 'Actief' : 'Inactief'}
                      </button>
                    </td>
                    <td className="td-actions">
                      <button
                        className="icon-btn"
                        title="Bewerken"
                        onClick={() => handleEdit(m)}
                      >
                        <Edit3 size={16} />
                      </button>
                      {deleteConfirm === m.id ? (
                        <div className="delete-confirm">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(m.id)}
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
                          onClick={() => setDeleteConfirm(m.id)}
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

      {activeTab === 'uitvoeren' && (
        <div className="auto-assignment-panel">
          <div className="info-card">
            <h3>
              <Wand2 size={20} /> Automatische Roltoewijzing
            </h3>
            <p>
              Op basis van de geconfigureerde mappings kunnen rollen automatisch worden toegekend
              aan medewerkers. U kunt eerst een preview bekijken voordat u de toewijzing uitvoert.
            </p>
            <p>
              <strong>Let op:</strong> Medewerkers die al de betreffende rol hebben worden overgeslagen.
              Handmatige roltoewijzingen blijven mogelijk naast automatische toewijzingen.
            </p>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => handlePreview(false)}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <><Loader2 size={16} className="spinner" /> Preview laden...</>
              ) : (
                <><Eye size={16} /> Preview (Alle medewerkers)</>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePreview(true)}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <><Loader2 size={16} className="spinner" /> Preview laden...</>
              ) : (
                <><Eye size={16} /> Preview (Alleen zonder rollen)</>
              )}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleExecute(true)}
              disabled={executingAssignment || mappings.filter(m => m.isActive).length === 0}
            >
              {executingAssignment ? (
                <><Loader2 size={16} className="spinner" /> Uitvoeren...</>
              ) : (
                <><Play size={16} /> Uitvoeren (Alleen zonder rollen)</>
              )}
            </button>
          </div>

          {/* Preview/Result display */}
          {(previewResult || assignmentResult) && (
            <div className="assignment-result">
              <h4>
                {assignmentResult ? 'Resultaat Roltoewijzing' : 'Preview Roltoewijzing'}
              </h4>

              {(previewResult || assignmentResult) && (
                <>
                  <div className="result-summary">
                    <div className="summary-stat">
                      <Users size={20} />
                      <span className="stat-value">
                        {(previewResult || assignmentResult)?.totalProcessed}
                      </span>
                      <span className="stat-label">Verwerkt</span>
                    </div>
                    <div className="summary-stat success">
                      <CheckCircle size={20} />
                      <span className="stat-value">
                        {(previewResult || assignmentResult)?.rolesAssigned}
                      </span>
                      <span className="stat-label">
                        {assignmentResult ? 'Toegekend' : 'Zou worden toegekend'}
                      </span>
                    </div>
                    <div className="summary-stat warning">
                      <Target size={20} />
                      <span className="stat-value">
                        {(previewResult || assignmentResult)?.rolesSkipped}
                      </span>
                      <span className="stat-label">Overgeslagen</span>
                    </div>
                    {((previewResult || assignmentResult)?.errors ?? 0) > 0 && (
                      <div className="summary-stat error">
                        <AlertCircle size={20} />
                        <span className="stat-value">
                          {(previewResult || assignmentResult)?.errors}
                        </span>
                        <span className="stat-label">Fouten</span>
                      </div>
                    )}
                  </div>

                  <div className="result-table-container">
                    <table className="data-table result-table">
                      <thead>
                        <tr>
                          <th>Medewerker</th>
                          <th>Functietitel</th>
                          <th>Rol</th>
                          <th>Scope</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(previewResult || assignmentResult)?.results.map((r, i) => (
                          <tr key={i} className={r.roleAssigned ? '' : 'row-skipped'}>
                            <td>
                              <div className="employee-info">
                                <span className="employee-name">{r.employeeDisplayName}</span>
                                <span className="employee-email">{r.employeeEmail}</span>
                              </div>
                            </td>
                            <td>{r.jobTitle || '-'}</td>
                            <td>
                              {r.assignedRole ? (
                                <span className={`role-badge ${getRoleBadgeClass(r.assignedRole)}`}>
                                  {r.assignedRoleDisplayName}
                                </span>
                              ) : '-'}
                            </td>
                            <td>{r.scopeName || '-'}</td>
                            <td>
                              <span className={`status-badge ${r.roleAssigned ? 'status-success' : 'status-skipped'}`}>
                                {r.message}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal for adding/editing mappings */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMapping ? 'Mapping Bewerken' : 'Nieuwe Mapping'}</h2>
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

              <div className="form-group">
                <label>
                  <Target size={16} /> Functietitel Patroon
                </label>
                <input
                  type="text"
                  placeholder="bijv. Sectormanager"
                  value={formPattern}
                  onChange={e => setFormPattern(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">
                  Het patroon waarmee de functietitel wordt vergeleken
                </span>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formExactMatch}
                    onChange={e => setFormExactMatch(e.target.checked)}
                  />
                  Exacte match
                </label>
                <span className="form-hint">
                  {formExactMatch
                    ? 'Functietitel moet exact overeenkomen (bijv. "Sectormanager" matcht alleen "Sectormanager")'
                    : 'Functietitel moet het patroon bevatten (bijv. "Sectormanager" matcht ook "Senior Sectormanager")'}
                </span>
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  className="form-select"
                >
                  <option value="">Selecteer een rol...</option>
                  {roleDefinitions
                    .filter(def => def.id !== 'medewerker') // Exclude medewerker as it's the default
                    .map(def => (
                      <option key={def.id} value={def.id}>
                        {def.displayName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Scope Bepaling</label>
                <select
                  value={formScopeDetermination}
                  onChange={e => setFormScopeDetermination(e.target.value as ScopeDeterminationType)}
                  className="form-select"
                >
                  {scopeTypes.map(st => (
                    <option key={st.name} value={st.name}>
                      {st.displayName}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Bepaalt hoe de sector/dienst scope automatisch wordt afgeleid
                </span>
              </div>

              <div className="form-group">
                <label>
                  <Hash size={16} /> Prioriteit
                </label>
                <input
                  type="number"
                  value={formPriority}
                  onChange={e => setFormPriority(parseInt(e.target.value) || 0)}
                  className="form-input form-input-sm"
                  min={0}
                  max={100}
                />
                <span className="form-hint">
                  Hogere waarde = hogere prioriteit bij meerdere matches (0-100)
                </span>
              </div>

              <div className="form-group">
                <label>
                  <FileText size={16} /> Beschrijving (optioneel)
                </label>
                <textarea
                  placeholder="Optionele notities over deze mapping..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="form-textarea"
                  rows={2}
                />
              </div>

              {editingMapping && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                    />
                    Mapping is actief
                  </label>
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
                disabled={saving || !formPattern.trim() || !formRole}
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

      <style>{`
        .priority-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 24px;
          padding: 0 8px;
          border-radius: 12px;
          background: var(--color-surface-alt);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .status-toggle {
          padding: 4px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .status-toggle.active {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .status-toggle.inactive {
          background: var(--color-muted-light);
          color: var(--color-text-muted);
        }

        .status-toggle:hover {
          opacity: 0.8;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge-primary {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .badge-secondary {
          background: var(--color-surface-alt);
          color: var(--color-text-muted);
        }

        .auto-assignment-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .info-card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 1rem;
          font-size: 1.1rem;
          color: var(--color-primary);
        }

        .info-card p {
          margin: 0.5rem 0;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .assignment-result {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .assignment-result h4 {
          margin: 0 0 1rem;
          font-size: 1rem;
        }

        .result-summary {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 1rem 1.5rem;
          background: var(--color-surface-alt);
          border-radius: 8px;
        }

        .summary-stat svg {
          color: var(--color-text-muted);
        }

        .summary-stat.success svg {
          color: var(--color-success);
        }

        .summary-stat.warning svg {
          color: var(--color-warning);
        }

        .summary-stat.error svg {
          color: var(--color-error);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .result-table-container {
          max-height: 400px;
          overflow-y: auto;
        }

        .result-table .employee-info {
          display: flex;
          flex-direction: column;
        }

        .result-table .employee-name {
          font-weight: 500;
        }

        .result-table .employee-email {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .row-skipped {
          opacity: 0.6;
        }

        .status-badge.status-success {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .status-badge.status-skipped {
          background: var(--color-muted-light);
          color: var(--color-text-muted);
        }

        .form-input-sm {
          max-width: 100px;
        }

        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        code {
          padding: 2px 6px;
          background: var(--color-surface-alt);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
