import { useState } from 'react';
import {
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Calendar,
  Mail,
  Key,
  Laptop,
  Building2,
} from 'lucide-react';

type TabType = 'onboarding' | 'offboarding' | 'lopend';

interface OnboardingTask {
  id: string;
  label: string;
  icon: typeof Mail;
  status: 'pending' | 'in_progress' | 'completed';
}

interface OnboardingProcess {
  id: string;
  employeeName: string;
  employeeEmail: string;
  type: 'onboarding' | 'offboarding';
  startDate: string;
  department: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: OnboardingTask[];
}

// Demo data
const demoProcesses: OnboardingProcess[] = [
  {
    id: '1',
    employeeName: 'Jan Janssen',
    employeeEmail: 'jan.janssen@diepenbeek.be',
    type: 'onboarding',
    startDate: '2026-03-15',
    department: 'ICT',
    status: 'in_progress',
    progress: 60,
    tasks: [
      { id: 't1', label: 'Account aanmaken', icon: Mail, status: 'completed' },
      { id: 't2', label: 'Microsoft 365 licentie', icon: Key, status: 'completed' },
      { id: 't3', label: 'Laptop toewijzen', icon: Laptop, status: 'in_progress' },
      { id: 't4', label: 'Toegangsrechten', icon: Building2, status: 'pending' },
    ],
  },
  {
    id: '2',
    employeeName: 'Marie Peeters',
    employeeEmail: 'marie.peeters@diepenbeek.be',
    type: 'offboarding',
    startDate: '2026-03-01',
    department: 'HR',
    status: 'in_progress',
    progress: 25,
    tasks: [
      { id: 't1', label: 'Overdracht taken', icon: ArrowRight, status: 'completed' },
      { id: 't2', label: 'Licenties intrekken', icon: Key, status: 'pending' },
      { id: 't3', label: 'Materiaal inleveren', icon: Laptop, status: 'pending' },
      { id: 't4', label: 'Account deactiveren', icon: Mail, status: 'pending' },
    ],
  },
];

export default function Onboarding() {
  const [activeTab, setActiveTab] = useState<TabType>('onboarding');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProcesses = demoProcesses.filter(p => {
    if (activeTab === 'onboarding') return p.type === 'onboarding';
    if (activeTab === 'offboarding') return p.type === 'offboarding';
    return p.status === 'in_progress';
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-success" />;
      case 'in_progress':
        return <Clock size={16} className="text-warning" />;
      default:
        return <AlertCircle size={16} className="text-muted" />;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>On/Offboarding</h1>
          <p className="page-subtitle">
            Beheer het in- en uitdiensttreden van medewerkers
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Nieuw Proces
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">3</span>
            <span className="stat-label">Nieuwe medewerkers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <UserMinus size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">1</span>
            <span className="stat-label">Vertrekkend</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">4</span>
            <span className="stat-label">Lopende processen</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">12</span>
            <span className="stat-label">Afgerond deze maand</span>
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
        {filteredProcesses.map(process => (
          <div key={process.id} className={`onboarding-card ${process.type}`}>
            <div className="onboarding-card-header">
              <div className="onboarding-user">
                <div className={`onboarding-avatar ${process.type}`}>
                  {process.type === 'onboarding' ? (
                    <UserPlus size={20} />
                  ) : (
                    <UserMinus size={20} />
                  )}
                </div>
                <div>
                  <h3>{process.employeeName}</h3>
                  <span className="onboarding-email">{process.employeeEmail}</span>
                </div>
              </div>
              <span className={`status-badge status-${process.status}`}>
                {process.status === 'completed' ? 'Afgerond' :
                 process.status === 'in_progress' ? 'Bezig' : 'Wachtend'}
              </span>
            </div>

            <div className="onboarding-meta">
              <span className="meta-item">
                <Calendar size={14} />
                {new Date(process.startDate).toLocaleDateString('nl-BE')}
              </span>
              <span className="meta-item">
                <Building2 size={14} />
                {process.department}
              </span>
            </div>

            <div className="onboarding-progress">
              <div className="progress-header">
                <span>Voortgang</span>
                <span>{process.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill progress-${process.type}`}
                  style={{ width: `${process.progress}%` }}
                />
              </div>
            </div>

            <div className="onboarding-tasks">
              {process.tasks.map(task => (
                <div key={task.id} className={`task-item task-${task.status}`}>
                  {getStatusIcon(task.status)}
                  <span>{task.label}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary btn-full">
              Details bekijken
              <ArrowRight size={16} />
            </button>
          </div>
        ))}

        {filteredProcesses.length === 0 && (
          <div className="empty-state">
            <Clock size={48} />
            <h3>Geen processen gevonden</h3>
            <p>Er zijn momenteel geen {activeTab} processen actief.</p>
          </div>
        )}
      </div>

      <style>{`
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

        .task-item.task-completed {
          color: var(--color-success);
        }

        .task-item.task-in_progress {
          color: var(--color-warning);
        }

        .task-item.task-pending {
          color: var(--text-muted);
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

        .status-badge.status-completed {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .status-badge.status-in_progress {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .status-badge.status-pending {
          background: var(--color-info-bg);
          color: var(--color-info);
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-muted { color: var(--text-muted); }

        @media (max-width: 768px) {
          .onboarding-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
