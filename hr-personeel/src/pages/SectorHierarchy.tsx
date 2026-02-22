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
} from 'lucide-react';
import type { DistributionGroupDetail, DistributionGroup, NestedGroup, EmployeeSummary } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5014/api';

interface SectorData {
  sector: DistributionGroup;
  details: DistributionGroupDetail | null;
  loading: boolean;
  expanded: boolean;
}

export default function SectorHierarchy() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDienst, setSelectedDienst] = useState<NestedGroup | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [dienstDetails, setDienstDetails] = useState<DistributionGroupDetail | null>(null);
  const [dienstLoading, setDienstLoading] = useState(false);

  // Helper to check if someone is a sectormanager based on jobTitle
  const isSectorManager = (member: EmployeeSummary): boolean => {
    const title = member.jobTitle?.toLowerCase() || '';
    return title.includes('sectormanager');
  };

  // Helper to check if someone is a teamcoördinator based on jobTitle
  const isTeamCoordinator = (member: EmployeeSummary): boolean => {
    const title = member.jobTitle?.toLowerCase() || '';
    return title.includes('teamcoördinator') || title.includes('teamcoach') || title.includes('coordinator');
  };

  // Get sector managers from direct members (by jobTitle)
  const getSectorManagers = (): EmployeeSummary[] => {
    if (!selectedSectorId) return [];
    const sector = sectors.find(s => s.sector.id === selectedSectorId);
    if (!sector?.details) return [];

    // Sectormanagers are members with "sectormanager" in their jobTitle
    return sector.details.members.filter(m => isSectorManager(m));
  };

  // Get sector manager IDs for filtering
  const getSectorManagerIds = (): Set<string> => {
    return new Set(getSectorManagers().map(m => m.id));
  };

  // Get teamcoördinatoren from dienst members (by jobTitle)
  const getTeamCoordinators = (): EmployeeSummary[] => {
    if (!dienstDetails) return [];
    const sectorManagerIds = getSectorManagerIds();

    // Teamcoördinators are members with coordinator titles, excluding sectormanagers
    return dienstDetails.members.filter(m =>
      isTeamCoordinator(m) && !sectorManagerIds.has(m.id)
    );
  };

  // Get regular team members (not sectormanager, not teamcoördinator)
  const getTeamMembers = (): EmployeeSummary[] => {
    if (!dienstDetails) return [];
    const sectorManagerIds = getSectorManagerIds();

    return dienstDetails.members.filter(m =>
      !isSectorManager(m) &&
      !isTeamCoordinator(m) &&
      !sectorManagerIds.has(m.id)
    );
  };

  // Get the sector name for display
  const getSelectedSectorName = (): string => {
    if (!selectedSectorId) return '';
    const sector = sectors.find(s => s.sector.id === selectedSectorId);
    return sector ? getSectorName(sector.sector.displayName) : '';
  };

  // Fetch all groups and filter sectors
  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the test endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/distributiongroups/test`);
      const data = await response.json();

      if (data.success && data.groups) {
        // Filter for SECTOR groups
        const sectorGroups = data.groups.filter((g: { id: string; displayName: string; email: string }) =>
          g.displayName.includes('SECTOR')
        );

        setSectors(sectorGroups.map((s: DistributionGroup) => ({
          sector: s,
          details: null,
          loading: false,
          expanded: false,
        })));
      }
    } catch (err) {
      setError('Kan sectoren niet laden: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSector = async (sectorId: string) => {
    setSectors(prev => prev.map(s => {
      if (s.sector.id !== sectorId) return s;

      // If collapsing, just toggle
      if (s.expanded) {
        return { ...s, expanded: false };
      }

      // If expanding and no details yet, fetch them
      if (!s.details) {
        fetchSectorDetails(sectorId);
      }

      return { ...s, expanded: true };
    }));
  };

  const fetchSectorDetails = async (sectorId: string) => {
    setSectors(prev => prev.map(s =>
      s.sector.id === sectorId ? { ...s, loading: true } : s
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/distributiongroups/test/${sectorId}`);
      const details = await response.json();

      setSectors(prev => prev.map(s =>
        s.sector.id === sectorId ? { ...s, details, loading: false } : s
      ));
    } catch (err) {
      console.error('Error fetching sector details:', err);
      setSectors(prev => prev.map(s =>
        s.sector.id === sectorId ? { ...s, loading: false } : s
      ));
    }
  };

  const selectDienst = async (dienst: NestedGroup, sectorId: string) => {
    setSelectedDienst(dienst);
    setSelectedSectorId(sectorId);
    setDienstLoading(true);
    setDienstDetails(null);

    try {
      const response = await fetch(`${API_BASE_URL}/distributiongroups/test/${dienst.id}`);
      const details = await response.json();
      setDienstDetails(details);
    } catch (err) {
      console.error('Error fetching dienst details:', err);
    } finally {
      setDienstLoading(false);
    }
  };

  const getSectorName = (displayName: string) => {
    return displayName.replace('MG-SECTOR-', '').replace('MG-', '');
  };

  const getDienstName = (displayName: string) => {
    return displayName.replace('MG-', '');
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Sectoren laden...</p>
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
          <button className="btn btn-primary" onClick={fetchSectors}>
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
          <h1>Sector Hierarchie</h1>
          <p className="page-subtitle">
            Overzicht van sectoren, diensten en medewerkers uit Microsoft 365
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchSectors}>
            <RefreshCw size={16} /> Vernieuwen
          </button>
        </div>
      </div>

      <div className="hierarchy-layout">
        {/* Left panel: Sector tree */}
        <div className="hierarchy-tree-panel">
          <div className="hierarchy-tree">
            {sectors.map(({ sector, details, loading: sectorLoading, expanded }) => (
              <div key={sector.id} className="sector-node">
                <div
                  className={`sector-header ${expanded ? 'expanded' : ''}`}
                  onClick={() => toggleSector(sector.id)}
                >
                  <span className="expand-icon">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <Building2 size={20} className="sector-icon" />
                  <div className="sector-info">
                    <span className="sector-name">{getSectorName(sector.displayName)}</span>
                    {details && (
                      <span className="sector-stats">
                        {details.nestedGroups.length} diensten
                        {details.owners.length > 0 && ` • ${details.owners.length} managers`}
                      </span>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="sector-content">
                    {sectorLoading ? (
                      <div className="loading-inline">
                        <RefreshCw className="spin" size={14} /> Laden...
                      </div>
                    ) : details ? (
                      <>
                        {/* Sector Managers */}
                        {details.owners.length > 0 && (
                          <div className="managers-section">
                            <div className="section-label">
                              <Crown size={14} /> Sectormanagers
                            </div>
                            {details.owners.map(owner => (
                              <div key={owner.id} className="manager-item">
                                <User size={14} />
                                <span>{owner.displayName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Direct members (if any) */}
                        {details.members.length > 0 && (
                          <div className="direct-members-section">
                            <div className="section-label">
                              <User size={14} /> Directe leden ({details.members.length})
                            </div>
                          </div>
                        )}

                        {/* Diensten */}
                        <div className="diensten-section">
                          {details.nestedGroups.map(dienst => (
                            <div
                              key={dienst.id}
                              className={`dienst-node ${selectedDienst?.id === dienst.id ? 'selected' : ''}`}
                              onClick={(e) => { e.stopPropagation(); selectDienst(dienst, sector.id); }}
                            >
                              <Users size={16} className="dienst-icon" />
                              <div className="dienst-info">
                                <span className="dienst-name">{getDienstName(dienst.displayName)}</span>
                                <span className="dienst-count">{dienst.memberCount} leden</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: Details */}
        <div className="hierarchy-detail-panel">
          {selectedDienst ? (
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
              </div>

              {dienstLoading ? (
                <div className="loading-state">
                  <RefreshCw className="spin" size={24} />
                  <p>Leden laden...</p>
                </div>
              ) : dienstDetails ? (
                <div className="dienst-hierarchy">
                  {/* Level 1: Sectormanager(s) */}
                  {getSectorManagers().length > 0 && (
                    <div className="hierarchy-level level-sector">
                      <div className="hierarchy-level-header">
                        <div className="hierarchy-level-badge sector-badge">
                          <Crown size={16} />
                          <span>Sectormanager{getSectorManagers().length > 1 ? 's' : ''}</span>
                        </div>
                        <span className="hierarchy-level-context">
                          Sector {getSelectedSectorName()}
                        </span>
                      </div>
                      <div className="hierarchy-members">
                        {getSectorManagers().map(manager => (
                          <div key={manager.id} className="hierarchy-member-card sector-manager">
                            <div className="member-avatar sector-avatar">
                              {manager.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="member-info">
                              <span className="member-name">{manager.displayName}</span>
                              {manager.jobTitle && (
                                <span className="member-title">
                                  <Briefcase size={12} /> {manager.jobTitle}
                                </span>
                              )}
                              <span className="member-email">
                                <Mail size={12} /> {manager.email}
                              </span>
                            </div>
                          </div>
                        ))}
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
              ) : null}
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
