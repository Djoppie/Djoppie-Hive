import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Mail,
  Briefcase,
  RefreshCw,
  AlertCircle,
  User,
  Crown,
  Network,
} from 'lucide-react';
import {
  distributionGroupsApi,
  type OrganizationHierarchy,
  type Sector,
  type Dienst,
  type EmployeeSummary,
} from '../services/api';

export default function SectorHierarchy() {
  const [hierarchy, setHierarchy] = useState<OrganizationHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [selectedDienst, setSelectedDienst] = useState<Dienst | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  // Fetch hierarchy on mount
  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await distributionGroupsApi.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekende fout';
      setError('Kan organisatie hiërarchie niet laden: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId);
      } else {
        newSet.add(sectorId);
      }
      return newSet;
    });
  };

  const selectDienst = (dienst: Dienst, sector: Sector) => {
    setSelectedDienst(dienst);
    setSelectedSector(sector);
  };

  const getSectorName = (displayName: string) => {
    return displayName.replace('MG-SECTOR-', '').replace('MG-', '');
  };

  const getDienstName = (displayName: string) => {
    return displayName.replace('MG-', '');
  };

  // Helper to check if someone is a teamcoördinator based on jobTitle
  const isTeamCoordinator = (member: EmployeeSummary): boolean => {
    const title = member.jobTitle?.toLowerCase() || '';
    return title.includes('teamcoördinator') || title.includes('teamcoach') || title.includes('coordinator');
  };

  // Get teamcoördinatoren from dienst members
  const getTeamCoordinators = (): EmployeeSummary[] => {
    if (!selectedDienst) return [];
    return selectedDienst.medewerkers.filter(m => isTeamCoordinator(m));
  };

  // Get regular team members (not teamcoördinator)
  const getTeamMembers = (): EmployeeSummary[] => {
    if (!selectedDienst) return [];
    return selectedDienst.medewerkers.filter(m => !isTeamCoordinator(m));
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Organisatie hiërarchie laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchHierarchy}>
            <RefreshCw size={16} /> Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="page">
        <div className="error-state">
          <Network size={32} />
          <p>MG-iedereenpersoneel groep niet gevonden in Entra ID</p>
          <button className="btn btn-primary" onClick={fetchHierarchy}>
            <RefreshCw size={16} /> Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sector Hiërarchie</h1>
          <p className="page-subtitle">
            Overzicht van {hierarchy.totalSectors} sectoren, {hierarchy.totalDiensten} diensten en {hierarchy.totalMedewerkers} medewerkers
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchHierarchy}>
            <RefreshCw size={16} /> Vernieuwen
          </button>
        </div>
      </div>

      <div className="hierarchy-layout">
        {/* Left panel: Sector tree */}
        <div className="hierarchy-tree-panel">
          <div className="hierarchy-tree">
            {hierarchy.sectors.map((sector) => {
              const isExpanded = expandedSectors.has(sector.id);

              return (
                <div key={sector.id} className="sector-node">
                  <div
                    className={`sector-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleSector(sector.id)}
                  >
                    <span className="expand-icon">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <Building2 size={20} className="sector-icon" />
                    <div className="sector-info">
                      <span className="sector-name">{getSectorName(sector.displayName)}</span>
                      <span className="sector-stats">
                        {sector.diensten.length} diensten • {sector.totalMedewerkers} medewerkers
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="sector-content">
                      {/* Sector Manager */}
                      {sector.sectorManager && (
                        <div className="managers-section">
                          <div className="section-label">
                            <Crown size={14} /> Sectormanager
                          </div>
                          <div className="manager-item">
                            <User size={14} />
                            <span>{sector.sectorManager.displayName}</span>
                          </div>
                        </div>
                      )}

                      {/* Diensten */}
                      <div className="diensten-section">
                        {sector.diensten.map(dienst => (
                          <div
                            key={dienst.id}
                            className={`dienst-node ${selectedDienst?.id === dienst.id ? 'selected' : ''}`}
                            onClick={(e) => { e.stopPropagation(); selectDienst(dienst, sector); }}
                          >
                            <Users size={16} className="dienst-icon" />
                            <div className="dienst-info">
                              <span className="dienst-name">{getDienstName(dienst.displayName)}</span>
                              <span className="dienst-count">{dienst.memberCount} leden</span>
                            </div>
                          </div>
                        ))}
                        {sector.diensten.length === 0 && (
                          <div className="no-diensten">Geen diensten</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Details */}
        <div className="hierarchy-detail-panel">
          {selectedDienst && selectedSector ? (
            <div className="dienst-detail">
              <div className="dienst-detail-header">
                <Users size={24} />
                <div>
                  <h2>{getDienstName(selectedDienst.displayName)}</h2>
                  {selectedDienst.email && (
                    <span className="dienst-email">
                      <Mail size={14} /> {selectedDienst.email}
                    </span>
                  )}
                </div>
              </div>

              {selectedDienst.description && (
                <p className="dienst-description">{selectedDienst.description}</p>
              )}

              <div className="dienst-stats-row">
                <div className="stat-badge">
                  <Users size={16} />
                  <span>{selectedDienst.memberCount} leden</span>
                </div>
                <div className="stat-badge">
                  <Building2 size={16} />
                  <span>Sector: {getSectorName(selectedSector.displayName)}</span>
                </div>
              </div>

              <div className="dienst-hierarchy">
                {/* Level 1: Sectormanager */}
                {selectedSector.sectorManager && (
                  <div className="hierarchy-level level-sector">
                    <div className="hierarchy-level-header">
                      <div className="hierarchy-level-badge sector-badge">
                        <Crown size={16} />
                        <span>Sectormanager</span>
                      </div>
                      <span className="hierarchy-level-context">
                        Sector {getSectorName(selectedSector.displayName)}
                      </span>
                    </div>
                    <div className="hierarchy-members">
                      <div className="hierarchy-member-card sector-manager">
                        <div className="member-avatar sector-avatar">
                          {selectedSector.sectorManager.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{selectedSector.sectorManager.displayName}</span>
                          {selectedSector.sectorManager.jobTitle && (
                            <span className="member-title">
                              <Briefcase size={12} /> {selectedSector.sectorManager.jobTitle}
                            </span>
                          )}
                          <span className="member-email">
                            <Mail size={12} /> {selectedSector.sectorManager.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hierarchy-connector" />
                  </div>
                )}

                {/* Level 2: Teamcoördinator(s) */}
                {getTeamCoordinators().length > 0 && (
                  <div className="hierarchy-level level-coordinator">
                    <div className="hierarchy-level-header">
                      <div className="hierarchy-level-badge coordinator-badge">
                        <User size={16} />
                        <span>Teamcoördinator{getTeamCoordinators().length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="hierarchy-members">
                      {getTeamCoordinators().map(coordinator => (
                        <div key={coordinator.id} className="hierarchy-member-card coordinator">
                          <div className="member-avatar coordinator-avatar">
                            {coordinator.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="member-info">
                            <span className="member-name">{coordinator.displayName}</span>
                            {coordinator.jobTitle && (
                              <span className="member-title">
                                <Briefcase size={12} /> {coordinator.jobTitle}
                              </span>
                            )}
                            <span className="member-email">
                              <Mail size={12} /> {coordinator.email}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hierarchy-connector" />
                  </div>
                )}

                {/* Level 3: Teamleden */}
                <div className="hierarchy-level level-members">
                  <div className="hierarchy-level-header">
                    <div className="hierarchy-level-badge members-badge">
                      <Users size={16} />
                      <span>Teamleden ({getTeamMembers().length})</span>
                    </div>
                  </div>
                  <div className="hierarchy-members members-grid">
                    {getTeamMembers().map(member => (
                      <div key={member.id} className="hierarchy-member-card team-member">
                        <div className="member-avatar">
                          {member.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.displayName}</span>
                          {member.jobTitle && (
                            <span className="member-title">
                              <Briefcase size={12} /> {member.jobTitle}
                            </span>
                          )}
                          <span className="member-email">
                            <Mail size={12} /> {member.email}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getTeamMembers().length === 0 && (
                      <p className="no-members">Geen teamleden gevonden</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <Building2 size={48} className="text-muted" />
              <h3>Selecteer een dienst</h3>
              <p>Klik op een sector om de diensten te bekijken, en selecteer een dienst om de leden te zien.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
