import { useState } from 'react';
import {
  Network,
  Wifi,
  Server,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Settings,
  Key,
} from 'lucide-react';

interface AccessType {
  id: string;
  name: string;
  description: string;
  icon: typeof Network;
  userCount: number;
  status: 'active' | 'limited' | 'inactive';
  requiresApproval: boolean;
}

const accessTypes: AccessType[] = [
  {
    id: '1',
    name: 'VPN Toegang',
    description: 'Externe toegang tot het gemeentelijke netwerk',
    icon: Shield,
    userCount: 125,
    status: 'active',
    requiresApproval: true,
  },
  {
    id: '2',
    name: 'WiFi Kantoor',
    description: 'Draadloos netwerk op de werklocaties',
    icon: Wifi,
    userCount: 380,
    status: 'active',
    requiresApproval: false,
  },
  {
    id: '3',
    name: 'WiFi Gasten',
    description: 'Gastnetwerk voor bezoekers',
    icon: Wifi,
    userCount: 50,
    status: 'limited',
    requiresApproval: false,
  },
  {
    id: '4',
    name: 'Server Toegang',
    description: 'Directe toegang tot server resources',
    icon: Server,
    userCount: 12,
    status: 'active',
    requiresApproval: true,
  },
  {
    id: '5',
    name: 'Beveiligd Netwerk',
    description: 'Toegang tot gevoelige systemen',
    icon: Key,
    userCount: 8,
    status: 'active',
    requiresApproval: true,
  },
];

export default function Infrastructuur() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="status-badge status-active">
            <CheckCircle size={12} /> Actief
          </span>
        );
      case 'limited':
        return (
          <span className="status-badge status-warning">
            <AlertTriangle size={12} /> Beperkt
          </span>
        );
      default:
        return (
          <span className="status-badge status-inactive">
            <XCircle size={12} /> Inactief
          </span>
        );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Infrastructuur Toegang</h1>
          <p className="page-subtitle">
            Beheer netwerk- en infrastructuurtoegang
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Toegang Aanvragen
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Network size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{accessTypes.length}</span>
            <span className="stat-label">Toegangstypes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">125</span>
            <span className="stat-label">VPN Gebruikers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Wifi size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">380</span>
            <span className="stat-label">WiFi Connecties</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">3</span>
            <span className="stat-label">Openstaande Aanvragen</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Zoek toegangstype..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Access Types Grid */}
      <div className="infra-grid">
        {accessTypes.map(access => {
          const Icon = access.icon;
          return (
            <div key={access.id} className="infra-card">
              <div className="infra-card-header">
                <div className="infra-icon">
                  <Icon size={24} />
                </div>
                <div className="infra-info">
                  <h3>{access.name}</h3>
                  {getStatusBadge(access.status)}
                </div>
              </div>

              <p className="infra-description">{access.description}</p>

              <div className="infra-stats">
                <div className="infra-stat">
                  <Users size={14} />
                  <span>{access.userCount} gebruikers</span>
                </div>
                {access.requiresApproval && (
                  <div className="infra-stat approval-required">
                    <Shield size={14} />
                    <span>Goedkeuring vereist</span>
                  </div>
                )}
              </div>

              <div className="infra-actions">
                <button className="btn btn-secondary">
                  <Users size={14} />
                  Gebruikers Beheren
                </button>
                <button className="btn btn-ghost">
                  <Settings size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Requests Section */}
      <div className="section-header">
        <h2>Openstaande Aanvragen</h2>
      </div>

      <div className="requests-list">
        <div className="request-item">
          <div className="request-user">
            <div className="request-avatar">JP</div>
            <div>
              <strong>Jan Peeters</strong>
              <span>jan.peeters@diepenbeek.be</span>
            </div>
          </div>
          <div className="request-type">
            <Shield size={14} />
            VPN Toegang
          </div>
          <div className="request-date">Aangevraagd: 25 feb 2026</div>
          <div className="request-actions">
            <button className="btn btn-success btn-sm">Goedkeuren</button>
            <button className="btn btn-danger btn-sm">Weigeren</button>
          </div>
        </div>
      </div>

      <style>{`
        .infra-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .infra-card {
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .infra-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .infra-card-header {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .infra-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .infra-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .infra-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .infra-description {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .infra-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .infra-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .infra-stat.approval-required {
          color: var(--color-warning);
        }

        .infra-actions {
          display: flex;
          gap: 8px;
        }

        .infra-actions .btn-secondary {
          flex: 1;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .request-item {
          background: var(--bg-card);
          border-radius: var(--border-radius);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid var(--border-color);
        }

        .request-user {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .request-avatar {
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .request-user strong {
          display: block;
          font-size: 14px;
        }

        .request-user span {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .request-type {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .request-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .request-actions {
          display: flex;
          gap: 8px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          width: fit-content;
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

        .btn-success {
          background: var(--color-success);
          color: white;
        }

        .btn-danger {
          background: var(--color-danger);
          color: white;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .infra-grid {
            grid-template-columns: 1fr;
          }

          .request-item {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
