import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  KeyRound,
  Key,
  AppWindow,
  Network,
  Laptop,
  UserCog,
  ClipboardCheck,
  Wand2,
  ArrowRight,
  Database,
  Boxes,
} from 'lucide-react';
import { statisticsApi, employeeValidatieApi, type DashboardStatistics } from '../services/api';
import SyncKnop from '../components/SyncKnop';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mijnValidaties, setMijnValidaties] = useState<number>(0);

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

  // Load validation count (backend filters by user's sector)
  const loadMijnValidaties = async () => {
    try {
      const aantal = await employeeValidatieApi.getAantal();
      setMijnValidaties(aantal);
    } catch (err) {
      console.error('Error loading validation count:', err);
      setMijnValidaties(0);
    }
  };

  useEffect(() => {
    loadStats();
    loadMijnValidaties();
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
          <button className="btn btn-secondary" onClick={() => { loadStats(); loadMijnValidaties(); }}>
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

      {/* Quick Access Categories */}
      <div className="quick-access-section">
        <h2 className="section-title">Snel Navigeren</h2>
        <div className="quick-access-grid">
          {/* Medewerkers */}
          <div className="quick-access-card category-medewerkers">
            <div className="quick-access-header">
              <div className="quick-access-icon">
                <UserCog size={24} />
              </div>
              <h3>Medewerkers</h3>
            </div>
            <p className="quick-access-description">
              Beheer personeel, vrijwilligers en on/offboarding processen
            </p>
            <div className="quick-access-links">
              <Link to="/personeel" className="quick-link">
                <Users size={14} /> Personeelslijst
                <ArrowRight size={14} />
              </Link>
              <Link to="/vrijwilligers" className="quick-link">
                <HeartHandshake size={14} /> Vrijwilligers
                <ArrowRight size={14} />
              </Link>
              <Link to="/validatie" className="quick-link">
                <ClipboardCheck size={14} /> Validatie
                {mijnValidaties > 0 && (
                  <span className="quick-link-badge">{mijnValidaties}</span>
                )}
                <ArrowRight size={14} />
              </Link>
              <Link to="/onboarding" className="quick-link">
                <UserPlus size={14} /> On/Offboarding
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Toegang & Licenties */}
          <div className="quick-access-card category-toegang">
            <div className="quick-access-header">
              <div className="quick-access-icon">
                <KeyRound size={24} />
              </div>
              <h3>Toegang & Licenties</h3>
            </div>
            <p className="quick-access-description">
              Microsoft 365, applicaties, infrastructuur en materiaal
            </p>
            <div className="quick-access-links">
              <Link to="/licenties" className="quick-link">
                <Key size={14} /> Microsoft 365 Licenties
                <ArrowRight size={14} />
              </Link>
              <Link to="/applicaties" className="quick-link">
                <AppWindow size={14} /> Applicatie Toegang
                <ArrowRight size={14} />
              </Link>
              <Link to="/infrastructuur" className="quick-link">
                <Network size={14} /> Infrastructuur
                <ArrowRight size={14} />
              </Link>
              <Link to="/materiaal" className="quick-link">
                <Laptop size={14} /> Materiaal
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Rollen & Rechten */}
          <div className="quick-access-card category-rollen">
            <div className="quick-access-header">
              <div className="quick-access-icon">
                <Shield size={24} />
              </div>
              <h3>Rollen & Rechten</h3>
            </div>
            <p className="quick-access-description">
              Gebruikersrollen, automatische toewijzing en functieprofielen
            </p>
            <div className="quick-access-links">
              <Link to="/rollen" className="quick-link">
                <UserCheck size={14} /> Gebruikersrollen
                <ArrowRight size={14} />
              </Link>
              <Link to="/auto-roltoewijzing" className="quick-link">
                <Wand2 size={14} /> Auto Roltoewijzing
                <ArrowRight size={14} />
              </Link>
              <Link to="/functieprofielen" className="quick-link">
                <ClipboardCheck size={14} /> Functieprofielen
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Organisatie */}
          <div className="quick-access-card category-organisatie">
            <div className="quick-access-header">
              <div className="quick-access-icon">
                <Boxes size={24} />
              </div>
              <h3>Organisatie</h3>
            </div>
            <p className="quick-access-description">
              Sectoren, diensten en distributiegroepen beheren
            </p>
            <div className="quick-access-links">
              <Link to="/sectoren" className="quick-link">
                <Building2 size={14} /> Sectoren & Diensten
                <ArrowRight size={14} />
              </Link>
              <Link to="/distributiegroepen" className="quick-link">
                <Users size={14} /> Distributiegroepen
                <span className="quick-link-count">{stats.totaalGroepen}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Systeem */}
          <div className="quick-access-card category-systeem">
            <div className="quick-access-header">
              <div className="quick-access-icon">
                <Database size={24} />
              </div>
              <h3>Systeem</h3>
            </div>
            <p className="quick-access-description">
              AD synchronisatie, import en audit logging
            </p>
            <div className="quick-access-links">
              <Link to="/sync" className="quick-link">
                <RefreshCw size={14} /> AD Sync
                <ArrowRight size={14} />
              </Link>
              <Link to="/import" className="quick-link">
                <Cloud size={14} /> Import
                <ArrowRight size={14} />
              </Link>
              <Link to="/audit" className="quick-link">
                <Briefcase size={14} /> Audit Log
                <ArrowRight size={14} />
              </Link>
            </div>
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
          {mijnValidaties > 0 && (
            <div className="alert alert-warning mt-3">
              <AlertTriangle size={16} />
              <span>{mijnValidaties} medewerker(s) te valideren</span>
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
