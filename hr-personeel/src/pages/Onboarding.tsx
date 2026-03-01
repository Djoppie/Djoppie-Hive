import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Calendar,
  Building2,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';
import NewProcessModal from '../components/NewProcessModal';
import type {
  OnboardingProcessSummaryDto,
  OnboardingStatisticsDto,
  OnboardingProcessFilter,
  OnboardingProcessStatus,
  OnboardingProcessType,
} from '../types/onboarding';

type TabType = 'onboarding' | 'offboarding' | 'lopend' | 'alle';

export default function Onboarding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('onboarding');
  const [searchQuery, setSearchQuery] = useState('');
  const [processes, setProcesses] = useState<OnboardingProcessSummaryDto[]>([]);
  const [statistics, setStatistics] = useState<OnboardingStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [defaultProcessType, setDefaultProcessType] = useState<OnboardingProcessType>('Onboarding');

  // Open modal with specific type based on active tab
  const handleOpenNewProcess = useCallback(() => {
    if (activeTab === 'offboarding') {
      setDefaultProcessType('Offboarding');
    } else {
      setDefaultProcessType('Onboarding');
    }
    setShowNewProcessModal(true);
  }, [activeTab]);

  // Build filter based on active tab
  const buildFilter = useCallback((): OnboardingProcessFilter => {
    const filter: OnboardingProcessFilter = {};

    if (searchQuery.trim()) {
      filter.search = searchQuery.trim();
    }

    switch (activeTab) {
      case 'onboarding':
        filter.type = 'Onboarding';
        break;
      case 'offboarding':
        filter.type = 'Offboarding';
        break;
      case 'lopend':
        filter.status = 'InProgress';
        break;
      // 'alle' has no filter
    }

    return filter;
  }, [activeTab, searchQuery]);

  // Fetch processes
  const fetchProcesses = useCallback(async () => {
    try {
      const filter = buildFilter();
      const data = await onboardingService.getProcesses(filter);
      setProcesses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kan processen niet laden');
      setProcesses([]);
    }
  }, [buildFilter]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const data = await onboardingService.getStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      // Don't show error for statistics, just use defaults
    }
  }, []);

  // Handle successful process creation
  const handleProcessCreated = useCallback(async () => {
    await Promise.all([fetchProcesses(), fetchStatistics()]);
  }, [fetchProcesses, fetchStatistics]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProcesses(), fetchStatistics()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProcesses, fetchStatistics]);

  // Refresh on tab/search change
  useEffect(() => {
    if (!loading) {
      fetchProcesses();
    }
  }, [activeTab, searchQuery, fetchProcesses, loading]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProcesses(), fetchStatistics()]);
    setRefreshing(false);
  };

  // Get status label
  const getStatusLabel = (status: OnboardingProcessStatus): string => {
    const labels: Record<OnboardingProcessStatus, string> = {
      Nieuw: 'Nieuw',
      InProgress: 'Bezig',
      Voltooid: 'Afgerond',
      Geannuleerd: 'Geannuleerd',
      OnHold: 'On Hold',
    };
    return labels[status] || status;
  };

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <Loader2 size={48} className="spinner" />
          <p>Processen laden...</p>
        </div>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--text-secondary);
          }
          .spinner {
            animation: spin 1s linear infinite;
            color: var(--color-primary);
            margin-bottom: 16px;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>On/Offboarding</h1>
          <p className="page-subtitle">
            Beheer het in- en uitdiensttreden van medewerkers
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Vernieuwen
          </button>
          <button className="btn btn-primary" onClick={handleOpenNewProcess}>
            <Plus size={16} />
            Nieuw Proces
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={handleRefresh}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics?.onboardingProcessen ?? 0}</span>
            <span className="stat-label">Onboarding processen</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <UserMinus size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics?.offboardingProcessen ?? 0}</span>
            <span className="stat-label">Offboarding processen</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics?.openTaken ?? 0}</span>
            <span className="stat-label">Openstaande taken</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics?.voltooideProcessen ?? 0}</span>
            <span className="stat-label">Afgeronde processen</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'onboarding' ? 'active' : ''}`}
          onClick={() => setActiveTab('onboarding')}
        >
          <UserPlus size={16} /> Onboarding
        </button>
        <button
          className={`tab ${activeTab === 'offboarding' ? 'active' : ''}`}
          onClick={() => setActiveTab('offboarding')}
        >
          <UserMinus size={16} /> Offboarding
        </button>
        <button
          className={`tab ${activeTab === 'lopend' ? 'active' : ''}`}
          onClick={() => setActiveTab('lopend')}
        >
          <Clock size={16} /> Lopend
        </button>
        <button
          className={`tab ${activeTab === 'alle' ? 'active' : ''}`}
          onClick={() => setActiveTab('alle')}
        >
          Alle
        </button>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Zoek op naam, email, afdeling..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <button className="btn btn-secondary">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Process Cards */}
      <div className="onboarding-grid">
        {processes.map(process => (
          <div
            key={process.id}
            className={`onboarding-card ${process.type.toLowerCase()}`}
          >
            <div className="onboarding-card-header">
              <div className="onboarding-user">
                <div className={`onboarding-avatar ${process.type.toLowerCase()}`}>
                  {process.type === 'Onboarding' ? (
                    <UserPlus size={20} />
                  ) : (
                    <UserMinus size={20} />
                  )}
                </div>
                <div>
                  <h3>{process.employeeNaam}</h3>
                  <span className="onboarding-email">{process.employeeEmail}</span>
                </div>
              </div>
              <span className={`status-badge status-${process.status.toLowerCase()}`}>
                {getStatusLabel(process.status)}
              </span>
            </div>

            <div className="onboarding-meta">
              <span className="meta-item">
                <Calendar size={14} />
                {new Date(process.geplandeStartdatum).toLocaleDateString('nl-BE')}
              </span>
              {process.verantwoordelijkeNaam && (
                <span className="meta-item">
                  <Building2 size={14} />
                  {process.verantwoordelijkeNaam}
                </span>
              )}
            </div>

            <div className="onboarding-progress">
              <div className="progress-header">
                <span>Voortgang</span>
                <span>{process.voortgangPercentage}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill progress-${process.type.toLowerCase()}`}
                  style={{ width: `${process.voortgangPercentage}%` }}
                />
              </div>
              <div className="progress-tasks">
                {process.aantalVoltooideTaken} / {process.totaalAantalTaken} taken
              </div>
            </div>

            <div className="onboarding-actions">
              <button
                className="btn btn-secondary btn-full"
                onClick={() => navigate(`/onboarding/${process.id}`)}
              >
                Details bekijken
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {processes.length === 0 && !error && (
          <div className="empty-state">
            <Clock size={48} />
            <h3>Geen processen gevonden</h3>
            <p>
              {activeTab === 'onboarding' && 'Er zijn momenteel geen actieve onboarding processen.'}
              {activeTab === 'offboarding' && 'Er zijn momenteel geen actieve offboarding processen.'}
              {activeTab === 'lopend' && 'Er zijn momenteel geen lopende processen.'}
              {activeTab === 'alle' && 'Er zijn nog geen processen aangemaakt.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenNewProcess}>
              <Plus size={16} />
              Nieuw proces starten
            </button>
          </div>
        )}
      </div>

      {/* New Process Modal */}
      <NewProcessModal
        open={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        onSuccess={handleProcessCreated}
        defaultType={defaultProcessType}
      />

      <style>{`
        .header-actions {
          display: flex;
          gap: 12px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        }

        .onboarding-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .onboarding-card {
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .onboarding-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .onboarding-card.onboarding {
          border-left: 4px solid var(--color-success);
        }

        .onboarding-card.offboarding {
          border-left: 4px solid var(--color-warning);
        }

        .onboarding-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .onboarding-user {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .onboarding-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .onboarding-avatar.onboarding {
          background: linear-gradient(135deg, var(--color-success), var(--color-success-light));
        }

        .onboarding-avatar.offboarding {
          background: linear-gradient(135deg, var(--color-warning), var(--color-warning-light));
        }

        .onboarding-user h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .onboarding-email {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .onboarding-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .onboarding-progress {
          margin-bottom: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .progress-tasks {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          text-align: right;
        }

        .progress-fill.progress-onboarding {
          background: linear-gradient(90deg, var(--color-success), var(--color-success-light));
        }

        .progress-fill.progress-offboarding {
          background: linear-gradient(90deg, var(--color-warning), var(--color-warning-light));
        }

        .onboarding-tasks {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-main);
          border-radius: var(--border-radius-sm);
          font-size: 13px;
        }

        .task-item.task-completed,
        .task-item.task-voltooid {
          color: var(--color-success);
        }

        .task-item.task-in_progress,
        .task-item.task-bezig,
        .task-item.task-inprogress {
          color: var(--color-warning);
        }

        .task-item.task-pending,
        .task-item.task-nietgestart {
          color: var(--text-muted);
        }

        .task-item.task-geblokkeerd,
        .task-item.task-mislukt {
          color: var(--color-danger);
        }

        .onboarding-actions {
          margin-top: 16px;
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.status-voltooid {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .status-badge.status-inprogress {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .status-badge.status-nieuw {
          background: var(--color-info-bg);
          color: var(--color-info);
        }

        .status-badge.status-geannuleerd,
        .status-badge.status-onhold {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-danger { color: var(--color-danger); }
        .text-muted { color: var(--text-muted); }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          border: 2px dashed var(--border-color);
          color: var(--text-secondary);
          text-align: center;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          color: var(--text-primary);
        }

        .empty-state p {
          margin: 0 0 20px;
          max-width: 400px;
        }

        @media (max-width: 768px) {
          .onboarding-grid {
            grid-template-columns: 1fr;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .header-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
