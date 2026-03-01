import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
  User,
  Plus,
  Play,
  Pause,
  Check,
  X,
  SkipForward,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Users,
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';
import type {
  OnboardingProcessDto,
  OnboardingProcessStatus,
  OnboardingTaskStatus,
  OnboardingTaskType,
  CreateOnboardingTaskDto,
  UpdateOnboardingTaskDto,
  OnboardingTaskDto,
} from '../types/onboarding';

// Task type labels and icons
const taskTypeConfig: Record<OnboardingTaskType, { label: string; icon: typeof Mail }> = {
  AccountAanmaken: { label: 'Account aanmaken', icon: Mail },
  M365Licentie: { label: 'Microsoft 365 licentie', icon: Mail },
  LaptopToewijzen: { label: 'Laptop toewijzen', icon: Mail },
  ToegangsRechten: { label: 'Toegangsrechten', icon: Mail },
  Training: { label: 'Training', icon: Users },
  Werkplek: { label: 'Werkplek inrichten', icon: Mail },
  Overdracht: { label: 'Overdracht taken', icon: Mail },
  MateriaalInleveren: { label: 'Materiaal inleveren', icon: Mail },
  AccountDeactiveren: { label: 'Account deactiveren', icon: Mail },
  ExitInterview: { label: 'Exit interview', icon: Users },
  Algemeen: { label: 'Algemeen', icon: Mail },
};

// Status configurations
const processStatusConfig: Record<OnboardingProcessStatus, { label: string; color: string }> = {
  Nieuw: { label: 'Nieuw', color: 'info' },
  InProgress: { label: 'Bezig', color: 'warning' },
  Voltooid: { label: 'Voltooid', color: 'success' },
  Geannuleerd: { label: 'Geannuleerd', color: 'danger' },
  OnHold: { label: 'On Hold', color: 'danger' },
};

const taskStatusConfig: Record<OnboardingTaskStatus, { label: string; color: string; icon: typeof Clock }> = {
  NietGestart: { label: 'Niet gestart', color: 'muted', icon: Clock },
  Bezig: { label: 'Bezig', color: 'warning', icon: Play },
  Voltooid: { label: 'Voltooid', color: 'success', icon: CheckCircle },
  Geblokkeerd: { label: 'Geblokkeerd', color: 'danger', icon: Pause },
  Overgeslagen: { label: 'Overgeslagen', color: 'muted', icon: SkipForward },
  Mislukt: { label: 'Mislukt', color: 'danger', icon: AlertTriangle },
};

export default function OnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [process, setProcess] = useState<OnboardingProcessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CreateOnboardingTaskDto>>({
    taskType: 'Algemeen',
    titel: '',
    beschrijving: '',
    isVerplicht: false,
    verwachteDuurDagen: 1,
  });
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Partial<UpdateOnboardingTaskDto>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch process data
  const fetchProcess = useCallback(async () => {
    if (!id) return;

    try {
      const data = await onboardingService.getProcess(id);
      setProcess(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan proces niet laden');
      setProcess(null);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProcess();
      setLoading(false);
    };
    loadData();
  }, [fetchProcess]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProcess();
    setRefreshing(false);
  };

  // Change task status
  const handleChangeTaskStatus = async (taskId: string, newStatus: OnboardingTaskStatus) => {
    if (!process) return;

    setUpdatingTaskId(taskId);
    try {
      await onboardingService.changeTaskStatus(taskId, newStatus);
      await fetchProcess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan status niet wijzigen');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Change process status
  const handleChangeProcessStatus = async (newStatus: OnboardingProcessStatus) => {
    if (!process) return;

    setRefreshing(true);
    try {
      await onboardingService.changeProcessStatus(process.id, newStatus);
      await fetchProcess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan status niet wijzigen');
    } finally {
      setRefreshing(false);
    }
  };

  // Add new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process || !newTask.titel?.trim()) return;

    setAddingTask(true);
    try {
      const dto: CreateOnboardingTaskDto = {
        onboardingProcessId: process.id,
        taskType: newTask.taskType as OnboardingTaskType,
        titel: newTask.titel.trim(),
        beschrijving: newTask.beschrijving || undefined,
        isVerplicht: newTask.isVerplicht,
        verwachteDuurDagen: newTask.verwachteDuurDagen || 1,
      };
      await onboardingService.createTask(dto);
      await fetchProcess();
      setShowAddTask(false);
      setNewTask({
        taskType: 'Algemeen',
        titel: '',
        beschrijving: '',
        isVerplicht: false,
        verwachteDuurDagen: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan taak niet toevoegen');
    } finally {
      setAddingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!process || !confirm('Weet je zeker dat je deze taak wilt verwijderen?')) return;

    setUpdatingTaskId(taskId);
    try {
      await onboardingService.deleteTask(taskId);
      await fetchProcess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan taak niet verwijderen');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Start editing a task
  const handleStartEdit = (task: OnboardingTaskDto) => {
    setEditingTaskId(task.id);
    setEditTask({
      titel: task.titel,
      beschrijving: task.beschrijving || '',
      isVerplicht: task.isVerplicht,
      verwachteDuurDagen: task.verwachteDuurDagen,
      deadline: task.deadline || undefined,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTask({});
  };

  // Save edited task
  const handleSaveEdit = async () => {
    if (!editingTaskId || !editTask.titel?.trim()) return;

    setSavingEdit(true);
    try {
      const dto: UpdateOnboardingTaskDto = {
        titel: editTask.titel.trim(),
        beschrijving: editTask.beschrijving || undefined,
        isVerplicht: editTask.isVerplicht,
        verwachteDuurDagen: editTask.verwachteDuurDagen,
        deadline: editTask.deadline,
      };
      await onboardingService.updateTask(editingTaskId, dto);
      await fetchProcess();
      setEditingTaskId(null);
      setEditTask({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan taak niet bijwerken');
    } finally {
      setSavingEdit(false);
    }
  };

  // Get available status transitions for a task
  const getAvailableTaskTransitions = (currentStatus: OnboardingTaskStatus): OnboardingTaskStatus[] => {
    switch (currentStatus) {
      case 'NietGestart':
        return ['Bezig', 'Overgeslagen'];
      case 'Bezig':
        return ['Voltooid', 'Geblokkeerd', 'Mislukt'];
      case 'Geblokkeerd':
        return ['Bezig', 'Overgeslagen'];
      case 'Mislukt':
        return ['Bezig', 'Overgeslagen'];
      case 'Voltooid':
      case 'Overgeslagen':
        return []; // Final states
      default:
        return [];
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <Loader2 size={48} className="spinner" />
          <p>Proces laden...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error && !process) {
    return (
      <div className="page">
        <div className="error-container">
          <AlertTriangle size={48} />
          <h2>Fout bij laden</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/onboarding')}>
              <ArrowLeft size={16} />
              Terug naar overzicht
            </button>
            <button className="btn btn-primary" onClick={handleRefresh}>
              <RefreshCw size={16} />
              Opnieuw proberen
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!process) return null;

  const statusConfig = processStatusConfig[process.status];
  const isOnboarding = process.type === 'Onboarding';

  return (
    <div className="page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-ghost" onClick={() => navigate('/onboarding')}>
          <ArrowLeft size={20} />
          Terug
        </button>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Process Info Card */}
      <div className={`process-card ${isOnboarding ? 'onboarding' : 'offboarding'}`}>
        <div className="process-header">
          <div className="process-avatar">
            {isOnboarding ? <UserPlus size={32} /> : <UserMinus size={32} />}
          </div>
          <div className="process-info">
            <h1>{process.titel}</h1>
            <div className="process-meta">
              <span className="meta-item">
                <User size={16} />
                {process.employeeNaam}
              </span>
              <span className="meta-item">
                <Mail size={16} />
                {process.employeeEmail}
              </span>
              <span className="meta-item">
                <Calendar size={16} />
                {new Date(process.geplandeStartdatum).toLocaleDateString('nl-BE')} - {new Date(process.gewensteEinddatum).toLocaleDateString('nl-BE')}
              </span>
            </div>
          </div>
          <div className="process-status-section">
            <span className={`status-badge status-${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {process.status !== 'Voltooid' && process.status !== 'Geannuleerd' && (
              <div className="status-actions">
                {process.status === 'InProgress' && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleChangeProcessStatus('Voltooid')}
                    disabled={refreshing}
                  >
                    <Check size={14} />
                    Voltooien
                  </button>
                )}
                {process.status === 'OnHold' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleChangeProcessStatus('InProgress')}
                    disabled={refreshing}
                  >
                    <Play size={14} />
                    Hervatten
                  </button>
                )}
                {process.status === 'InProgress' && (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handleChangeProcessStatus('OnHold')}
                    disabled={refreshing}
                  >
                    <Pause size={14} />
                    Pauzeren
                  </button>
                )}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleChangeProcessStatus('Geannuleerd')}
                  disabled={refreshing}
                >
                  <X size={14} />
                  Annuleren
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="process-progress">
          <div className="progress-header">
            <span>Voortgang</span>
            <span>{process.voortgangPercentage}% ({process.aantalVoltooideTaken}/{process.totaalAantalTaken} taken)</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${isOnboarding ? 'onboarding' : 'offboarding'}`}
              style={{ width: `${process.voortgangPercentage}%` }}
            />
          </div>
        </div>

        {/* Description */}
        {process.beschrijving && (
          <div className="process-description">
            <p>{process.beschrijving}</p>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <div className="tasks-header">
          <h2>Taken ({process.tasks.length})</h2>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
            <Plus size={16} />
            Taak Toevoegen
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="add-task-card">
            <h3>Nieuwe Taak</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskType">Type</label>
                  <select
                    id="taskType"
                    value={newTask.taskType}
                    onChange={e => setNewTask(prev => ({ ...prev, taskType: e.target.value as OnboardingTaskType }))}
                  >
                    {Object.entries(taskTypeConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskDuur">Verwachte duur (dagen)</label>
                  <input
                    id="taskDuur"
                    type="number"
                    min="1"
                    value={newTask.verwachteDuurDagen}
                    onChange={e => setNewTask(prev => ({ ...prev, verwachteDuurDagen: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="taskTitel">Titel *</label>
                <input
                  id="taskTitel"
                  type="text"
                  required
                  placeholder="Titel van de taak"
                  value={newTask.titel}
                  onChange={e => setNewTask(prev => ({ ...prev, titel: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskBeschrijving">Beschrijving</label>
                <textarea
                  id="taskBeschrijving"
                  rows={2}
                  placeholder="Optionele beschrijving..."
                  value={newTask.beschrijving}
                  onChange={e => setNewTask(prev => ({ ...prev, beschrijving: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTask.isVerplicht}
                    onChange={e => setNewTask(prev => ({ ...prev, isVerplicht: e.target.checked }))}
                  />
                  Verplichte taak
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>
                  Annuleren
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingTask}>
                  {addingTask ? <Loader2 size={16} className="spinning" /> : <Plus size={16} />}
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="tasks-list">
          {process.tasks.length === 0 ? (
            <div className="empty-tasks">
              <AlertCircle size={32} />
              <p>Geen taken voor dit proces.</p>
              <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
                <Plus size={16} />
                Eerste taak toevoegen
              </button>
            </div>
          ) : (
            process.tasks
              .sort((a, b) => a.volgorde - b.volgorde)
              .map(task => {
                const taskStatus = taskStatusConfig[task.status];
                const StatusIcon = taskStatus.icon;
                const isExpanded = expandedTaskId === task.id;
                const isUpdating = updatingTaskId === task.id;
                const transitions = getAvailableTaskTransitions(task.status);

                return (
                  <div
                    key={task.id}
                    className={`task-card ${task.status.toLowerCase()} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div className="task-main" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                      <div className="task-status-icon">
                        {isUpdating ? (
                          <Loader2 size={20} className="spinning" />
                        ) : (
                          <StatusIcon size={20} className={`text-${taskStatus.color}`} />
                        )}
                      </div>
                      <div className="task-info">
                        <div className="task-title">
                          <span className="task-order">#{task.volgorde}</span>
                          {task.titel}
                          {task.isVerplicht && <span className="required-badge">Verplicht</span>}
                        </div>
                        <div className="task-meta">
                          <span className={`task-status-label text-${taskStatus.color}`}>
                            {taskStatus.label}
                          </span>
                          {task.toegewezenAanNaam && (
                            <span className="task-assignee">
                              <User size={12} />
                              {task.toegewezenAanNaam}
                            </span>
                          )}
                          {task.deadline && (
                            <span className="task-deadline">
                              <Calendar size={12} />
                              {new Date(task.deadline).toLocaleDateString('nl-BE')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="task-expand">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="task-details">
                        {task.beschrijving && (
                          <div className="detail-section">
                            <h4>Beschrijving</h4>
                            <p>{task.beschrijving}</p>
                          </div>
                        )}

                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{taskTypeConfig[task.taskType]?.label || task.taskType}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Verwachte duur</span>
                            <span className="detail-value">{task.verwachteDuurDagen} dag(en)</span>
                          </div>
                          {task.gestartOp && (
                            <div className="detail-item">
                              <span className="detail-label">Gestart op</span>
                              <span className="detail-value">{new Date(task.gestartOp).toLocaleString('nl-BE')}</span>
                            </div>
                          )}
                          {task.voltooidOp && (
                            <div className="detail-item">
                              <span className="detail-label">Voltooid op</span>
                              <span className="detail-value">{new Date(task.voltooidOp).toLocaleString('nl-BE')}</span>
                            </div>
                          )}
                          {task.voltooidDoor && (
                            <div className="detail-item">
                              <span className="detail-label">Voltooid door</span>
                              <span className="detail-value">{task.voltooidDoor}</span>
                            </div>
                          )}
                        </div>

                        {task.voltooiingNotities && (
                          <div className="detail-section">
                            <h4>Notities</h4>
                            <p>{task.voltooiingNotities}</p>
                          </div>
                        )}

                        {/* Task actions */}
                        <div className="task-actions">
                          {transitions.length > 0 && (
                            <div className="status-transitions">
                              {transitions.map(newStatus => {
                                const transitionConfig = taskStatusConfig[newStatus];
                                const TransitionIcon = transitionConfig.icon;
                                return (
                                  <button
                                    key={newStatus}
                                    className={`btn btn-sm btn-${transitionConfig.color}`}
                                    onClick={() => handleChangeTaskStatus(task.id, newStatus)}
                                    disabled={isUpdating}
                                  >
                                    <TransitionIcon size={14} />
                                    {transitionConfig.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="task-edit-actions">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleStartEdit(task)}
                              disabled={isUpdating || editingTaskId === task.id}
                            >
                              <Edit3 size={14} />
                              Bewerken
                            </button>
                            <button
                              className="btn btn-sm btn-ghost btn-danger-text"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={isUpdating}
                            >
                              <Trash2 size={14} />
                              Verwijderen
                            </button>
                          </div>
                        </div>

                        {/* Edit form */}
                        {editingTaskId === task.id && (
                          <div className="task-edit-form">
                            <h4>Taak bewerken</h4>
                            <div className="form-group">
                              <label>Titel *</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editTask.titel || ''}
                                onChange={(e) => setEditTask({ ...editTask, titel: e.target.value })}
                                placeholder="Titel van de taak"
                              />
                            </div>
                            <div className="form-group">
                              <label>Beschrijving</label>
                              <textarea
                                className="form-control"
                                value={editTask.beschrijving || ''}
                                onChange={(e) => setEditTask({ ...editTask, beschrijving: e.target.value })}
                                placeholder="Optionele beschrijving"
                                rows={3}
                              />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Verwachte duur (dagen)</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  min={1}
                                  value={editTask.verwachteDuurDagen || 1}
                                  onChange={(e) => setEditTask({ ...editTask, verwachteDuurDagen: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                              <div className="form-group">
                                <label>Deadline</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={editTask.deadline?.split('T')[0] || ''}
                                  onChange={(e) => setEditTask({ ...editTask, deadline: e.target.value || undefined })}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editTask.isVerplicht || false}
                                  onChange={(e) => setEditTask({ ...editTask, isVerplicht: e.target.checked })}
                                />
                                Verplichte taak
                              </label>
                            </div>
                            <div className="form-actions">
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                              >
                                Annuleren
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editTask.titel?.trim()}
                              >
                                {savingEdit ? <Loader2 size={14} className="spinning" /> : <Check size={14} />}
                                Opslaan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: var(--text-secondary);
    text-align: center;
  }

  .error-container h2 {
    margin: 16px 0 8px;
    color: var(--text-primary);
  }

  .error-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .spinner, .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .btn-ghost {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--border-radius-md);
    transition: all 0.2s ease;
  }

  .btn-ghost:hover {
    background: var(--bg-main);
    color: var(--text-primary);
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
  }

  .alert-error {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .alert .btn {
    margin-left: auto;
    padding: 4px;
  }

  .process-card {
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
  }

  .process-card.onboarding {
    border-left: 4px solid var(--color-success);
  }

  .process-card.offboarding {
    border-left: 4px solid var(--color-warning);
  }

  .process-header {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .process-avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .process-card.onboarding .process-avatar {
    background: linear-gradient(135deg, var(--color-success), var(--color-success-light));
  }

  .process-card.offboarding .process-avatar {
    background: linear-gradient(135deg, var(--color-warning), var(--color-warning-light));
  }

  .process-info {
    flex: 1;
  }

  .process-info h1 {
    margin: 0 0 8px;
    font-size: 1.5rem;
  }

  .process-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .process-status-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .status-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge.status-success { background: var(--color-success-bg); color: var(--color-success); }
  .status-badge.status-warning { background: var(--color-warning-bg); color: var(--color-warning); }
  .status-badge.status-info { background: var(--color-info-bg); color: var(--color-info); }
  .status-badge.status-danger { background: var(--color-danger-bg); color: var(--color-danger); }
  .status-badge.status-muted { background: var(--bg-main); color: var(--text-muted); }

  .process-progress {
    margin-bottom: 16px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 8px;
    background: var(--bg-main);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-fill.onboarding {
    background: linear-gradient(90deg, var(--color-success), var(--color-success-light));
  }

  .progress-fill.offboarding {
    background: linear-gradient(90deg, var(--color-warning), var(--color-warning-light));
  }

  .process-description {
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .tasks-section {
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
  }

  .tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .tasks-header h2 {
    margin: 0;
  }

  .add-task-card {
    background: var(--bg-main);
    border-radius: var(--border-radius-md);
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
  }

  .add-task-card h3 {
    margin: 0 0 16px;
    font-size: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-secondary);
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 14px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-label input {
    width: auto;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }

  .tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-tasks {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-secondary);
    text-align: center;
  }

  .empty-tasks p {
    margin: 12px 0 20px;
  }

  .task-card {
    background: var(--bg-main);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-color);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .task-card:hover {
    border-color: var(--color-primary);
  }

  .task-card.expanded {
    box-shadow: var(--shadow-md);
  }

  .task-card.voltooid {
    opacity: 0.7;
  }

  .task-card.voltooid:hover {
    opacity: 1;
  }

  .task-main {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    cursor: pointer;
  }

  .task-status-icon {
    flex-shrink: 0;
  }

  .task-info {
    flex: 1;
    min-width: 0;
  }

  .task-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .task-order {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: normal;
  }

  .required-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border-radius: 4px;
    font-weight: 600;
  }

  .task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
  }

  .task-status-label {
    font-weight: 500;
  }

  .task-assignee,
  .task-deadline {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-secondary);
  }

  .task-expand {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .task-details {
    padding: 0 16px 16px;
    border-top: 1px solid var(--border-color);
    margin-top: 0;
    padding-top: 16px;
  }

  .detail-section {
    margin-bottom: 16px;
  }

  .detail-section h4 {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 8px;
    text-transform: uppercase;
  }

  .detail-section p {
    margin: 0;
    color: var(--text-primary);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .detail-value {
    font-size: 14px;
    color: var(--text-primary);
  }

  .task-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .status-transitions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .task-edit-actions {
    display: flex;
    gap: 8px;
  }

  .task-edit-form {
    margin-top: 16px;
    padding: 16px;
    background: var(--bg-main);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .task-edit-form h4 {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .task-edit-form .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .task-edit-form .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .btn-danger-text {
    color: var(--color-danger) !important;
  }

  .btn-danger-text:hover {
    background: var(--color-danger-bg) !important;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-success { background: var(--color-success); color: white; border: none; }
  .btn-success:hover { filter: brightness(1.1); }
  .btn-warning { background: var(--color-warning); color: white; border: none; }
  .btn-warning:hover { filter: brightness(1.1); }
  .btn-danger { background: var(--color-danger); color: white; border: none; }
  .btn-danger:hover { filter: brightness(1.1); }
  .btn-muted { background: var(--bg-main); color: var(--text-secondary); border: 1px solid var(--border-color); }
  .btn-muted:hover { background: var(--border-color); }

  .text-success { color: var(--color-success); }
  .text-warning { color: var(--color-warning); }
  .text-danger { color: var(--color-danger); }
  .text-info { color: var(--color-info); }
  .text-muted { color: var(--text-muted); }

  @media (max-width: 768px) {
    .process-header {
      flex-direction: column;
    }

    .process-status-section {
      align-items: flex-start;
      width: 100%;
    }

    .status-actions {
      justify-content: flex-start;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .task-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .status-transitions,
    .task-edit-actions {
      justify-content: center;
    }
  }
`;
