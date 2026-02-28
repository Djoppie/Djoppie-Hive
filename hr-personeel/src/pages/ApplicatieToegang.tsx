import { useState } from 'react';
import {
  AppWindow,
  Search,
  Filter,
  Plus,
  Users,
  Shield,
  ExternalLink,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface Application {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'microsoft' | 'intern' | 'extern';
  userCount: number;
  status: 'active' | 'maintenance' | 'inactive';
  ssoEnabled: boolean;
}

const demoApplications: Application[] = [
  {
    id: '1',
    name: 'SharePoint',
    description: 'Document management en samenwerking',
    icon: '📄',
    category: 'microsoft',
    userCount: 445,
    status: 'active',
    ssoEnabled: true,
  },
  {
    id: '2',
    name: 'Microsoft Teams',
    description: 'Chat, vergaderingen en samenwerking',
    icon: '💬',
    category: 'microsoft',
    userCount: 445,
    status: 'active',
    ssoEnabled: true,
  },
  {
    id: '3',
    name: 'Power BI',
    description: 'Business intelligence en rapportage',
    icon: '📊',
    category: 'microsoft',
    userCount: 25,
    status: 'active',
    ssoEnabled: true,
  },
  {
    id: '4',
    name: 'Djoppie Inventory',
    description: 'Asset en materiaal beheer',
    icon: '📦',
    category: 'intern',
    userCount: 15,
    status: 'active',
    ssoEnabled: true,
  },
  {
    id: '5',
    name: 'Personeelsbeheer',
    description: 'HR administratie systeem',
    icon: '👥',
    category: 'intern',
    userCount: 8,
    status: 'active',
    ssoEnabled: true,
  },
  {
    id: '6',
    name: 'Ticketing Systeem',
    description: 'IT helpdesk en support tickets',
    icon: '🎫',
    category: 'intern',
    userCount: 45,
    status: 'maintenance',
    ssoEnabled: false,
  },
];

export default function ApplicatieToegang() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredApps = demoApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge status-active"><CheckCircle size={12} /> Actief</span>;
      case 'maintenance':
        return <span className="status-badge status-warning"><Clock size={12} /> Onderhoud</span>;
      default:
        return <span className="status-badge status-inactive"><XCircle size={12} /> Inactief</span>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'microsoft':
        return 'Microsoft 365';
      case 'intern':
        return 'Interne Applicatie';
      case 'extern':
        return 'Externe Dienst';
      default:
        return category;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Applicatie Toegang</h1>
          <p className="page-subtitle">
            Beheer toegang tot applicaties en diensten
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Applicatie Toevoegen
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <AppWindow size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{demoApplications.length}</span>
            <span className="stat-label">Applicaties</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{demoApplications.filter(a => a.status === 'active').length}</span>
            <span className="stat-label">Actief</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{demoApplications.filter(a => a.ssoEnabled).length}</span>
            <span className="stat-label">SSO Enabled</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">445</span>
            <span className="stat-label">Gebruikers</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Zoek applicatie..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">Alle categorieën</option>
          <option value="microsoft">Microsoft 365</option>
          <option value="intern">Interne Applicaties</option>
          <option value="extern">Externe Diensten</option>
        </select>
        <button className="btn btn-secondary">
          <Filter size={16} />
          Meer Filters
        </button>
      </div>

      {/* Applications Grid */}
      <div className="apps-grid">
        {filteredApps.map(app => (
          <div key={app.id} className="app-card">
            <div className="app-card-header">
              <div className="app-icon">{app.icon}</div>
              <div className="app-info">
                <h3>{app.name}</h3>
                <span className="app-category">{getCategoryLabel(app.category)}</span>
              </div>
              {getStatusBadge(app.status)}
            </div>

            <p className="app-description">{app.description}</p>

            <div className="app-stats">
              <div className="app-stat">
                <Users size={14} />
                <span>{app.userCount} gebruikers</span>
              </div>
              {app.ssoEnabled && (
                <div className="app-stat sso-enabled">
                  <Shield size={14} />
                  <span>SSO</span>
                </div>
              )}
            </div>

            <div className="app-actions">
              <button className="btn btn-secondary btn-sm">
                <Users size={14} />
                Gebruikers
              </button>
              <button className="btn btn-secondary btn-sm">
                <Settings size={14} />
                Instellingen
              </button>
              <button className="btn btn-ghost btn-sm">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .app-card {
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .app-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .app-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .app-icon {
          width: 48px;
          height: 48px;
          background: var(--bg-main);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .app-info {
          flex: 1;
        }

        .app-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .app-category {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .app-description {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .app-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .app-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .app-stat.sso-enabled {
          color: var(--color-success);
        }

        .app-actions {
          display: flex;
          gap: 8px;
        }

        .app-actions .btn {
          flex: 1;
        }

        .app-actions .btn-ghost {
          flex: 0;
          padding: 8px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.status-active {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .status-badge.status-warning {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .status-badge.status-inactive {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .apps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
