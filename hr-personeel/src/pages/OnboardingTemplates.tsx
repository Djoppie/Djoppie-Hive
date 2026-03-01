import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Star,
  UserPlus,
  UserMinus,
  Loader2,
  RefreshCw,
  Check,
  X,
  Copy,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';
import type {
  OnboardingTemplateDto,
  CreateOnboardingTemplateDto,
  UpdateOnboardingTemplateDto,
  OnboardingProcessType,
  OnboardingTaskType,
  TemplateTaskDefinitionDto,
} from '../types/onboarding';

// Task type options grouped by department
const taskTypeOptions: { value: OnboardingTaskType; label: string; afdeling: string }[] = [
  // ICT tasks
  { value: 'EmailAccountAanmaken', label: 'Email account aanmaken', afdeling: 'ICT' },
  { value: 'AccountAanmaken', label: 'Account aanmaken (AD)', afdeling: 'ICT' },
  { value: 'WachtwoordGenereren', label: 'Wachtwoord genereren', afdeling: 'ICT' },
  { value: 'M365Licentie', label: 'Microsoft 365 licentie', afdeling: 'ICT' },
  { value: 'LaptopToewijzen', label: 'Laptop toewijzen', afdeling: 'ICT' },
  { value: 'IntunePrimaryUser', label: 'Intune registratie', afdeling: 'ICT' },
  { value: 'ToegangsRechten', label: 'Toegangsrechten', afdeling: 'ICT' },
  { value: 'AccountDeactiveren', label: 'Account deactiveren', afdeling: 'ICT' },
  // Medewerker tasks
  { value: 'MfaSetup', label: 'MFA configureren', afdeling: 'Medewerker' },
  { value: 'CompanyPortalApps', label: 'Company Portal apps', afdeling: 'Medewerker' },
  { value: 'Training', label: 'Training', afdeling: 'Medewerker' },
  // HR tasks
  { value: 'SyntegroRegistratie', label: 'Syntegro registratie', afdeling: 'HR' },
  { value: 'SyntegroVerwijderen', label: 'Syntegro verwijderen', afdeling: 'HR' },
  { value: 'Werkplek', label: 'Werkplek inrichten', afdeling: 'HR' },
  // Preventie tasks
  { value: 'BadgeRegistratie', label: 'Badge registratie', afdeling: 'Preventie' },
  { value: 'BadgeIntrekken', label: 'Badge intrekken', afdeling: 'Preventie' },
  // Management tasks
  { value: 'DataValidatie', label: 'Gegevens validatie', afdeling: 'Management' },
  // Offboarding tasks
  { value: 'Overdracht', label: 'Overdracht taken', afdeling: 'HR' },
  { value: 'MateriaalInleveren', label: 'Materiaal inleveren', afdeling: 'HR' },
  { value: 'ExitInterview', label: 'Exit interview', afdeling: 'HR' },
  // General
  { value: 'Algemeen', label: 'Algemeen', afdeling: 'HR' },
];

const emptyTaskDefinition: TemplateTaskDefinitionDto = {
  taskType: 'Algemeen',
  titel: '',
  beschrijving: '',
  volgorde: 1,
  isVerplicht: false,
  verwachteDuurDagen: 1,
};

export default function OnboardingTemplates() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<OnboardingTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplateDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    naam: string;
    processType: OnboardingProcessType;
    beschrijving: string;
    standaardDuurDagen: number;
    tasks: TemplateTaskDefinitionDto[];
  }>({
    naam: '',
    processType: 'Onboarding',
    beschrijving: '',
    standaardDuurDagen: 14,
    tasks: [],
  });

  // Expanded template for viewing tasks
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await onboardingService.getTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan templates niet laden');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTemplates();
      setLoading(false);
    };
    loadData();
  }, [fetchTemplates]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      naam: '',
      processType: 'Onboarding',
      beschrijving: '',
      standaardDuurDagen: 14,
      tasks: [{ ...emptyTaskDefinition, volgorde: 1 }],
    });
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (template: OnboardingTemplateDto) => {
    setEditingTemplate(template);
    // Parse tasks from JSON
    let tasks: TemplateTaskDefinitionDto[] = [];
    try {
      tasks = JSON.parse(template.takenDefinitie || '[]');
    } catch {
      tasks = [];
    }
    setFormData({
      naam: template.naam,
      processType: template.processType,
      beschrijving: template.beschrijving || '',
      standaardDuurDagen: template.standaardDuurDagen,
      tasks: tasks.length > 0 ? tasks : [{ ...emptyTaskDefinition, volgorde: 1 }],
    });
    setShowModal(true);
  };

  // Duplicate template
  const handleDuplicate = (template: OnboardingTemplateDto) => {
    setEditingTemplate(null);
    let tasks: TemplateTaskDefinitionDto[] = [];
    try {
      tasks = JSON.parse(template.takenDefinitie || '[]');
    } catch {
      tasks = [];
    }
    setFormData({
      naam: `${template.naam} (kopie)`,
      processType: template.processType,
      beschrijving: template.beschrijving || '',
      standaardDuurDagen: template.standaardDuurDagen,
      tasks: tasks.length > 0 ? tasks : [{ ...emptyTaskDefinition, volgorde: 1 }],
    });
    setShowModal(true);
  };

  // Save template
  const handleSave = async () => {
    if (!formData.naam.trim()) return;

    setSaving(true);
    try {
      const takenDefinitie = JSON.stringify(formData.tasks.filter(t => t.titel.trim()));

      if (editingTemplate) {
        const dto: UpdateOnboardingTemplateDto = {
          naam: formData.naam.trim(),
          beschrijving: formData.beschrijving || undefined,
          standaardDuurDagen: formData.standaardDuurDagen,
          takenDefinitie,
        };
        await onboardingService.updateTemplate(editingTemplate.id, dto);
      } else {
        const dto: CreateOnboardingTemplateDto = {
          naam: formData.naam.trim(),
          processType: formData.processType,
          beschrijving: formData.beschrijving || undefined,
          standaardDuurDagen: formData.standaardDuurDagen,
          takenDefinitie,
        };
        await onboardingService.createTemplate(dto);
      }

      await fetchTemplates();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan template niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) return;

    try {
      await onboardingService.deleteTemplate(id);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan template niet verwijderen');
    }
  };

  // Set as default
  const handleSetDefault = async (id: string) => {
    try {
      await onboardingService.setTemplateDefault(id);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan standaard niet instellen');
    }
  };

  // Add task to form
  const handleAddTask = () => {
    const maxOrder = Math.max(0, ...formData.tasks.map(t => t.volgorde));
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { ...emptyTaskDefinition, volgorde: maxOrder + 1 }],
    });
  };

  // Update task in form
  const handleUpdateTask = (index: number, updates: Partial<TemplateTaskDefinitionDto>) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setFormData({ ...formData, tasks: newTasks });
  };

  // Remove task from form
  const handleRemoveTask = (index: number) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    // Reorder
    newTasks.forEach((t, i) => {
      t.volgorde = i + 1;
    });
    setFormData({ ...formData, tasks: newTasks });
  };

  // Move task up/down
  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.tasks.length - 1) return;

    const newTasks = [...formData.tasks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]];
    // Update volgorde
    newTasks.forEach((t, i) => {
      t.volgorde = i + 1;
    });
    setFormData({ ...formData, tasks: newTasks });
  };

  // Loading state
  if (loading) {
    return (
      <div className="templates-page">
        <div className="loading-container">
          <Loader2 size={32} className="spinning" />
          <p>Templates laden...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="templates-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/onboarding')}>
            <ArrowLeft size={20} />
            Terug
          </button>
          <div className="header-title">
            <h1>Onboarding Templates</h1>
            <p className="subtitle">Beheer templates voor onboarding en offboarding processen</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={18} />
            Nieuwe Template
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Templates list */}
      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <h3>Geen templates</h3>
            <p>Maak een template aan om processen sneller te starten</p>
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={18} />
              Eerste Template Aanmaken
            </button>
          </div>
        ) : (
          templates.map((template) => {
            const isExpanded = expandedId === template.id;
            let tasks: TemplateTaskDefinitionDto[] = [];
            try {
              tasks = JSON.parse(template.takenDefinitie || '[]');
            } catch {
              tasks = [];
            }

            return (
              <div key={template.id} className={`template-card ${template.isDefault ? 'is-default' : ''}`}>
                <div className="template-header" onClick={() => setExpandedId(isExpanded ? null : template.id)}>
                  <div className="template-icon">
                    {template.processType === 'Onboarding' ? (
                      <UserPlus size={24} />
                    ) : (
                      <UserMinus size={24} />
                    )}
                  </div>
                  <div className="template-info">
                    <div className="template-name">
                      {template.naam}
                      {template.isDefault && (
                        <span className="default-badge">
                          <Star size={12} />
                          Standaard
                        </span>
                      )}
                    </div>
                    <div className="template-meta">
                      <span className={`type-badge ${template.processType.toLowerCase()}`}>
                        {template.processType}
                      </span>
                      <span className="task-count">
                        <FileText size={14} />
                        {tasks.length} taken
                      </span>
                      <span className="duration">
                        <Clock size={14} />
                        {template.standaardDuurDagen} dagen
                      </span>
                    </div>
                  </div>
                  <div className="template-expand">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="template-details">
                    {template.beschrijving && (
                      <p className="template-description">{template.beschrijving}</p>
                    )}

                    {tasks.length > 0 && (
                      <div className="tasks-preview">
                        <h4>Taken in template:</h4>
                        <ol className="tasks-list">
                          {tasks.map((task, idx) => (
                            <li key={idx} className="task-item">
                              <span className="task-title">{task.titel}</span>
                              {task.isVerplicht && <span className="required">Verplicht</span>}
                              <span className="task-duration">{task.verwachteDuurDagen}d</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="template-actions">
                      {!template.isDefault && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={(e) => { e.stopPropagation(); handleSetDefault(template.id); }}
                        >
                          <Star size={14} />
                          Als standaard instellen
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}
                      >
                        <Copy size={14} />
                        Dupliceren
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
                      >
                        <Edit3 size={14} />
                        Bewerken
                      </button>
                      <button
                        className="btn btn-sm btn-ghost btn-danger-text"
                        onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                      >
                        <Trash2 size={14} />
                        Verwijderen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? 'Template Bewerken' : 'Nieuwe Template'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Algemene informatie</h3>
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label>Naam *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.naam}
                      onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                      placeholder="Bijv. Standaard Onboarding IT"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      className="form-control"
                      value={formData.processType}
                      onChange={(e) => setFormData({ ...formData, processType: e.target.value as OnboardingProcessType })}
                      disabled={!!editingTemplate}
                    >
                      <option value="Onboarding">Onboarding</option>
                      <option value="Offboarding">Offboarding</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Beschrijving</label>
                  <textarea
                    className="form-control"
                    value={formData.beschrijving}
                    onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
                    placeholder="Optionele beschrijving van de template"
                    rows={2}
                  />
                </div>

                <div className="form-group" style={{ maxWidth: '200px' }}>
                  <label>Standaard doorlooptijd (dagen)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    value={formData.standaardDuurDagen}
                    onChange={(e) => setFormData({ ...formData, standaardDuurDagen: parseInt(e.target.value) || 14 })}
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Taken ({formData.tasks.length})</h3>
                  <button className="btn btn-sm btn-ghost" onClick={handleAddTask}>
                    <Plus size={14} />
                    Taak Toevoegen
                  </button>
                </div>

                <div className="tasks-editor">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="task-editor-item">
                      <div className="task-order">
                        <button
                          className="btn btn-ghost btn-icon btn-xs"
                          onClick={() => handleMoveTask(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span>{task.volgorde}</span>
                        <button
                          className="btn btn-ghost btn-icon btn-xs"
                          onClick={() => handleMoveTask(index, 'down')}
                          disabled={index === formData.tasks.length - 1}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className="task-fields">
                        <div className="task-row-1">
                          <select
                            className="form-control task-type"
                            value={task.taskType}
                            onChange={(e) => handleUpdateTask(index, { taskType: e.target.value as OnboardingTaskType })}
                          >
                            {taskTypeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="form-control task-title"
                            value={task.titel}
                            onChange={(e) => handleUpdateTask(index, { titel: e.target.value })}
                            placeholder="Titel van de taak"
                          />
                        </div>
                        <div className="task-row-2">
                          <input
                            type="text"
                            className="form-control task-desc"
                            value={task.beschrijving || ''}
                            onChange={(e) => handleUpdateTask(index, { beschrijving: e.target.value })}
                            placeholder="Beschrijving (optioneel)"
                          />
                          <input
                            type="number"
                            className="form-control task-duration"
                            min={1}
                            value={task.verwachteDuurDagen}
                            onChange={(e) => handleUpdateTask(index, { verwachteDuurDagen: parseInt(e.target.value) || 1 })}
                            title="Verwachte duur in dagen"
                          />
                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={task.isVerplicht}
                              onChange={(e) => handleUpdateTask(index, { isVerplicht: e.target.checked })}
                            />
                            Verplicht
                          </label>
                        </div>
                      </div>

                      <button
                        className="btn btn-ghost btn-icon btn-danger-text"
                        onClick={() => handleRemoveTask(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {formData.tasks.length === 0 && (
                    <div className="no-tasks">
                      <p>Geen taken toegevoegd</p>
                      <button className="btn btn-sm btn-ghost" onClick={handleAddTask}>
                        <Plus size={14} />
                        Eerste Taak Toevoegen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !formData.naam.trim()}
              >
                {saving ? <Loader2 size={16} className="spinning" /> : <Check size={16} />}
                {editingTemplate ? 'Opslaan' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .templates-page {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px;
    color: var(--text-secondary);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
  }

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .header-title h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .subtitle {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .alert-danger {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .alert-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: inherit;
  }

  .templates-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 2px dashed var(--border-color);
  }

  .empty-icon {
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  .empty-state h3 {
    margin: 0 0 8px;
    color: var(--text-primary);
  }

  .empty-state p {
    margin: 0 0 20px;
    color: var(--text-secondary);
  }

  .template-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .template-card:hover {
    border-color: var(--color-primary);
  }

  .template-card.is-default {
    border-color: var(--color-warning);
  }

  .template-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    cursor: pointer;
  }

  .template-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-bg);
    color: var(--color-primary);
  }

  .template-info {
    flex: 1;
  }

  .template-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .default-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--color-warning);
    color: white;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }

  .template-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .type-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .type-badge.onboarding {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .type-badge.offboarding {
    background: var(--color-danger-bg);
    color: var(--color-danger);
  }

  .task-count, .duration {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .template-expand {
    color: var(--text-muted);
  }

  .template-details {
    padding: 0 16px 16px;
    border-top: 1px solid var(--border-color);
    margin-top: 0;
    padding-top: 16px;
  }

  .template-description {
    margin: 0 0 16px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .tasks-preview h4 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .tasks-list {
    margin: 0;
    padding-left: 20px;
  }

  .task-item {
    padding: 4px 0;
    font-size: 13px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .task-item .task-title {
    flex: 1;
  }

  .task-item .required {
    font-size: 10px;
    padding: 1px 4px;
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border-radius: 3px;
  }

  .task-item .task-duration {
    font-size: 11px;
    color: var(--text-muted);
  }

  .template-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: var(--bg-secondary);
    border-radius: 16px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 24px;
  }

  .form-section h3 {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-header h3 {
    margin: 0;
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  .form-row .flex-2 {
    flex: 2;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-main);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .tasks-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .task-editor-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--bg-main);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    align-items: flex-start;
  }

  .task-order {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding-top: 4px;
  }

  .task-order span {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .task-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .task-row-1, .task-row-2 {
    display: flex;
    gap: 8px;
  }

  .task-type {
    width: 180px;
    flex-shrink: 0;
  }

  .task-title {
    flex: 1;
  }

  .task-desc {
    flex: 1;
  }

  .task-duration {
    width: 60px;
    flex-shrink: 0;
    text-align: center;
  }

  .checkbox-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
    cursor: pointer;
  }

  .no-tasks {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
  }

  .no-tasks p {
    margin: 0 0 12px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--bg-main);
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-xs {
    padding: 2px;
    font-size: 10px;
  }

  .btn-icon {
    padding: 8px;
  }

  .btn-danger-text {
    color: var(--color-danger) !important;
  }

  .btn-danger-text:hover:not(:disabled) {
    background: var(--color-danger-bg) !important;
  }
`;
