import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Briefcase,
  HeartHandshake,
  Timer,
  Cloud,
  UserPlus,
  RefreshCw,
  Building2,
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
} from 'lucide-react';
import { statisticsApi, type DashboardStatistics } from '../services/api';
import SyncKnop from '../components/SyncKnop';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await statisticsApi.getDashboard();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden statistieken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div className="empty-state-card">
          <RefreshCw size={48} className="spinning text-primary" />
          <p>Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div className="empty-state-card">
          <AlertTriangle size={48} className="text-danger" />
          <h3>Fout bij laden</h3>
          <p>{error || 'Onbekende fout'}</p>
          <button className="btn btn-primary" onClick={loadStats}>
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nooit';
    return new Date(dateStr).toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Overzicht personeelsbeheer &mdash; Gemeente Diepenbeek
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadStats}>
            <RefreshCw size={16} /> Vernieuwen
          </button>
        </div>
      </div>

      {/* Hoofdstatistieken */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totaalMedewerkers}</span>
            <span className="stat-label">Totaal Medewerkers</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.actiefPersoneel}</span>
            <span className="stat-label">Actief Personeel</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <HeartHandshake size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.vrijwilligers}</span>
            <span className="stat-label">Vrijwilligers</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <Timer size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.interimmers}</span>
            <span className="stat-label">Interim</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.inactiefPersoneel}</span>
            <span className="stat-label">Inactief</span>
          </div>
        </div>
      </div>

      {/* Sync & Validatie status */}
      <div className="dashboard-grid">
        <div className="card sync-card-prominent">
          <h2 className="card-title">
            <RefreshCw size={18} /> Synchronisatie
          </h2>
          <div className="sync-action-section">
            <SyncKnop onSyncComplete={() => loadStats()} />
          </div>
          <div className="sync-status-info">
            <div className="sync-status-item">
              <span className="sync-label">Laatste sync:</span>
              <span className="sync-value">{formatDate(stats.laatseSyncOp)}</span>
            </div>
            <div className="sync-status-item">
              <span className="sync-label">Status:</span>
              <span className={`badge ${stats.laatseSyncStatus === 'Voltooid' ? 'badge-success' : 'badge-warning'}`}>
                {stats.laatseSyncStatus || 'Onbekend'}
              </span>
            </div>
            <div className="sync-status-item">
              <span className="sync-label">Totaal syncs:</span>
              <span className="sync-value">{stats.totaalSyncs}</span>
            </div>
          </div>
          {stats.openValidaties > 0 && (
            <div className="alert alert-warning mt-3">
              <AlertTriangle size={16} />
              <span>{stats.openValidaties} openstaande validatie(s)</span>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">
            <Building2 size={18} /> Distributiegroepen
          </h2>
          <div className="distribution-list">
            <div className="distribution-item">
              <span className="distribution-label">Totaal groepen</span>
              <span className="distribution-value">{stats.totaalGroepen}</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Sectoren</span>
              <span className="distribution-value">{stats.totaalSectoren}</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Diensten</span>
              <span className="distribution-value">{stats.totaalDiensten}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data bronnen & Arbeidsregime */}
      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Data Bronnen</h2>
          <div className="distribution-list">
            <div className="distribution-item">
              <span className="distribution-label">
                <Cloud size={14} className="inline-icon" /> Vanuit Azure AD
              </span>
              <span className="distribution-value">{stats.vanuitAzure}</span>
              <span className="distribution-pct">
                {stats.totaalMedewerkers > 0
                  ? Math.round((stats.vanuitAzure / stats.totaalMedewerkers) * 100)
                  : 0}%
              </span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">
                <UserPlus size={14} className="inline-icon" /> Handmatig toegevoegd
              </span>
              <span className="distribution-value">{stats.handmatigToegevoegd}</span>
              <span className="distribution-pct">
                {stats.totaalMedewerkers > 0
                  ? Math.round((stats.handmatigToegevoegd / stats.totaalMedewerkers) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Arbeidsregime</h2>
          <div className="distribution-list">
            <div className="distribution-item">
              <span className="distribution-label">Voltijds</span>
              <span className="distribution-value">{stats.voltijds}</span>
              <span className="distribution-pct">
                {stats.totaalMedewerkers > 0
                  ? Math.round((stats.voltijds / stats.totaalMedewerkers) * 100)
                  : 0}%
              </span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Deeltijds</span>
              <span className="distribution-value">{stats.deeltijds}</span>
              <span className="distribution-pct">
                {stats.totaalMedewerkers > 0
                  ? Math.round((stats.deeltijds / stats.totaalMedewerkers) * 100)
                  : 0}%
              </span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Vrijwilliger</span>
              <span className="distribution-value">{stats.vrijwilligersRegime}</span>
              <span className="distribution-pct">
                {stats.totaalMedewerkers > 0
                  ? Math.round((stats.vrijwilligersRegime / stats.totaalMedewerkers) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VOG Status & Type verdeling */}
      <div className="dashboard-grid">
        {stats.vogStatistieken.totaalVrijwilligers > 0 && (
          <div className="card">
            <h2 className="card-title">
              <Shield size={18} /> VOG Status Vrijwilligers
            </h2>
            <div className="vog-status-grid">
              <div className="vog-status-item vog-valid">
                <Shield size={20} />
                <span className="vog-count">{stats.vogStatistieken.metGeldigeVog}</span>
                <span className="vog-label">Geldig</span>
              </div>
              <div className="vog-status-item vog-warning">
                <ShieldAlert size={20} />
                <span className="vog-count">{stats.vogStatistieken.vogVerlooptBinnenkort}</span>
                <span className="vog-label">Verloopt binnenkort</span>
              </div>
              <div className="vog-status-item vog-expired">
                <ShieldX size={20} />
                <span className="vog-count">{stats.vogStatistieken.vogVerlopen}</span>
                <span className="vog-label">Verlopen</span>
              </div>
              <div className="vog-status-item vog-missing">
                <ShieldQuestion size={20} />
                <span className="vog-count">{stats.vogStatistieken.zonderVog}</span>
                <span className="vog-label">Ontbreekt</span>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">Type Medewerker</h2>
          <div className="distribution-list">
            <div className="distribution-item">
              <span className="distribution-label">Personeel</span>
              <span className="distribution-value">
                {stats.totaalMedewerkers - stats.vrijwilligers - stats.interimmers - stats.externen - stats.stagiairs}
              </span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Vrijwilliger</span>
              <span className="distribution-value">{stats.vrijwilligers}</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Interim</span>
              <span className="distribution-value">{stats.interimmers}</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Extern</span>
              <span className="distribution-value">{stats.externen}</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Stagiair</span>
              <span className="distribution-value">{stats.stagiairs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per sector */}
      {stats.perSector.length > 0 && (
        <div className="card">
          <h2 className="card-title">Medewerkers per Sector</h2>
          <div className="sector-list">
            {stats.perSector.map(sector => (
              <div key={sector.sectorNaam} className="sector-item">
                <div className="sector-info">
                  <Briefcase size={16} />
                  <span className="sector-name">{sector.sectorNaam}</span>
                  <span className="sector-diensten text-muted">
                    ({sector.aantalDiensten} diensten)
                  </span>
                </div>
                <div className="sector-bar-wrapper">
                  <div className="sector-bar">
                    <div
                      className="sector-bar-fill"
                      style={{
                        width: `${stats.totaalMedewerkers > 0
                          ? (sector.aantalMedewerkers / stats.totaalMedewerkers) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <span className="sector-count">{sector.aantalMedewerkers}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
