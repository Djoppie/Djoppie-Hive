import { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Key,
  AppWindow,
  Laptop,
  Network,
  Users,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface FunctieProfiel {
  id: string;
  name: string;
  description: string;
  department: string;
  employeeCount: number;
  licenses: string[];
  applications: string[];
  infrastructure: string[];
  hardware: string[];
}

const demoProfiles: FunctieProfiel[] = [
  {
    id: '1',
    name: 'Administratief Medewerker',
    description: 'Standaard profiel voor administratieve functies',
    department: 'Algemeen',
    employeeCount: 85,
    licenses: ['Microsoft 365 F3'],
    applications: ['SharePoint', 'Teams', 'Outlook'],
    infrastructure: ['WiFi Kantoor'],
    hardware: ['Laptop Standaard', 'Monitor 24"'],
  },
  {
    id: '2',
    name: 'ICT Medewerker',
    description: 'Profiel voor IT-afdeling met volledige toegang',
    department: 'ICT',
    employeeCount: 12,
    licenses: ['Microsoft 365 E3', 'Power BI Pro'],
    applications: ['SharePoint', 'Teams', 'Azure Portal', 'Admin Centers'],
    infrastructure: ['WiFi Kantoor', 'VPN Toegang', 'Server Toegang'],
    hardware: ['Laptop Pro', 'Monitor 27"', 'Headset Pro'],
  },
  {
    id: '3',
    name: 'Manager',
    description: 'Leidinggevende functies met uitgebreide rechten',
    department: 'Algemeen',
    employeeCount: 25,
    licenses: ['Microsoft 365 E3'],
    applications: ['SharePoint', 'Teams', 'Power BI', 'HR Systeem'],
    infrastructure: ['WiFi Kantoor', 'VPN Toegang'],
    hardware: ['Laptop Pro', 'Monitor 27"', 'Smartphone'],
  },
  {
    id: '4',
    name: 'Buitendienst',
    description: 'Medewerkers die voornamelijk extern werken',
    department: 'Technische Dienst',
    employeeCount: 45,
    licenses: ['Microsoft 365 F3'],
    applications: ['Teams', 'Outlook Mobile'],
    infrastructure: ['WiFi Kantoor', 'WiFi Gasten'],
    hardware: ['Smartphone', 'Tablet'],
  },
];

export default function Functieprofielen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<FunctieProfiel | null>(null);

  const filteredProfiles = demoProfiles.filter(
    profile =>
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Functieprofielen</h1>
          <p className="page-subtitle">
            Standaard configuraties voor verschillende functies
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Nieuw Profiel
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <ClipboardCheck size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{demoProfiles.length}</span>
            <span className="stat-label">Profielen</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {demoProfiles.reduce((sum, p) => sum + p.employeeCount, 0)}
            </span>
            <span className="stat-label">Medewerkers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Key size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">3</span>
            <span className="stat-label">Licentie Types</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <AppWindow size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">8</span>
            <span className="stat-label">Applicaties</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Zoek profiel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Profiles Layout */}
      <div className="profiles-layout">
        {/* Profiles List */}
        <div className="profiles-list">
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className={`profile-item ${selectedProfile?.id === profile.id ? 'selected' : ''}`}
              onClick={() => setSelectedProfile(profile)}
            >
              <div className="profile-item-content">
                <h3>{profile.name}</h3>
                <p>{profile.description}</p>
                <div className="profile-meta">
                  <span className="meta-badge">{profile.department}</span>
                  <span className="meta-count">{profile.employeeCount} medewerkers</span>
                </div>
              </div>
              <ChevronRight size={20} className="profile-chevron" />
            </div>
          ))}
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          {selectedProfile ? (
            <>
              <div className="profile-details-header">
                <div>
                  <h2>{selectedProfile.name}</h2>
                  <p>{selectedProfile.description}</p>
                </div>
                <div className="profile-actions">
                  <button className="btn btn-secondary btn-sm">
                    <Copy size={14} />
                    Dupliceren
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Edit size={14} />
                    Bewerken
                  </button>
                  <button className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="profile-sections">
                {/* Licenses */}
                <div className="profile-section">
                  <div className="section-title">
                    <Key size={18} />
                    <span>Licenties</span>
                  </div>
                  <div className="section-items">
                    {selectedProfile.licenses.map((license, i) => (
                      <div key={i} className="section-item">
                        <CheckCircle size={14} className="text-success" />
                        {license}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applications */}
                <div className="profile-section">
                  <div className="section-title">
                    <AppWindow size={18} />
                    <span>Applicaties</span>
                  </div>
                  <div className="section-items">
                    {selectedProfile.applications.map((app, i) => (
                      <div key={i} className="section-item">
                        <CheckCircle size={14} className="text-success" />
                        {app}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Infrastructure */}
                <div className="profile-section">
                  <div className="section-title">
                    <Network size={18} />
                    <span>Infrastructuur</span>
                  </div>
                  <div className="section-items">
                    {selectedProfile.infrastructure.map((infra, i) => (
                      <div key={i} className="section-item">
                        <CheckCircle size={14} className="text-success" />
                        {infra}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hardware */}
                <div className="profile-section">
                  <div className="section-title">
                    <Laptop size={18} />
                    <span>Hardware</span>
                  </div>
                  <div className="section-items">
                    {selectedProfile.hardware.map((hw, i) => (
                      <div key={i} className="section-item">
                        <CheckCircle size={14} className="text-success" />
                        {hw}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="profile-footer">
                <button className="btn btn-primary">
                  <Users size={16} />
                  Medewerkers met dit profiel bekijken
                </button>
              </div>
            </>
          ) : (
            <div className="profile-empty">
              <ClipboardCheck size={48} />
              <h3>Selecteer een profiel</h3>
              <p>Klik op een profiel om de details te bekijken</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profiles-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          min-height: 500px;
        }

        .profiles-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .profile-item {
          background: var(--bg-card);
          border-radius: var(--border-radius);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border: 2px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .profile-item:hover {
          border-color: var(--color-primary-light);
        }

        .profile-item.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }

        .profile-item-content {
          flex: 1;
        }

        .profile-item-content h3 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
        }

        .profile-item-content p {
          margin: 0 0 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .profile-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .meta-badge {
          background: var(--bg-main);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .meta-count {
          font-size: 11px;
          color: var(--text-muted);
        }

        .profile-chevron {
          color: var(--text-muted);
        }

        .profile-details {
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
        }

        .profile-details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .profile-details-header h2 {
          margin: 0 0 4px;
          font-size: 20px;
        }

        .profile-details-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .profile-sections {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .profile-section {
          background: var(--bg-main);
          border-radius: var(--border-radius);
          padding: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
          color: var(--color-primary);
        }

        .section-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .profile-footer {
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .profile-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
          color: var(--text-muted);
          text-align: center;
        }

        .profile-empty svg {
          opacity: 0.3;
          margin-bottom: 16px;
        }

        .profile-empty h3 {
          margin: 0 0 8px;
          color: var(--text-primary);
        }

        .profile-empty p {
          margin: 0;
          font-size: 14px;
        }

        .text-success {
          color: var(--color-success);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-danger {
          background: var(--color-danger);
          color: white;
        }

        @media (max-width: 1024px) {
          .profiles-layout {
            grid-template-columns: 1fr;
          }

          .profile-sections {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
