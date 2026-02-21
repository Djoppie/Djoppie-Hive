import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  HeartHandshake,
  Timer,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const { medewerkers } = usePersoneel();

  const stats: DashboardStats = {
    totaalMedewerkers: medewerkers.length,
    actiefPersoneel: medewerkers.filter(m => m.actief && m.type === 'personeel').length,
    vrijwilligers: medewerkers.filter(m => m.type === 'vrijwilliger').length,
    interimmers: medewerkers.filter(m => m.type === 'interim').length,
    teValideren: medewerkers.filter(
      m => m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review'
    ).length,
    goedgekeurd: medewerkers.filter(m => m.validatieStatus === 'goedgekeurd').length,
    afgekeurd: medewerkers.filter(m => m.validatieStatus === 'afgekeurd').length,
    perSector: medewerkers.reduce(
      (acc, m) => {
        acc[m.sector] = (acc[m.sector] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    perRegime: medewerkers.reduce(
      (acc, m) => {
        acc[m.arbeidsRegime] = (acc[m.arbeidsRegime] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    perType: medewerkers.reduce(
      (acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  const inactiefCount = medewerkers.filter(m => !m.actief).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">
          Overzicht personeelsbeheer &mdash; Gemeente Diepenbeek
        </p>
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
            <span className="stat-value">{inactiefCount}</span>
            <span className="stat-label">Inactief</span>
          </div>
        </div>
      </div>

      {/* Validatie overzicht */}
      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Validatiestatus</h2>
          <div className="validation-summary">
            <div className="validation-item">
              <Clock size={18} className="text-warning" />
              <span className="validation-count">{stats.teValideren}</span>
              <span className="validation-label">Te valideren</span>
            </div>
            <div className="validation-item">
              <CheckCircle2 size={18} className="text-success" />
              <span className="validation-count">{stats.goedgekeurd}</span>
              <span className="validation-label">Goedgekeurd</span>
            </div>
            <div className="validation-item">
              <XCircle size={18} className="text-danger" />
              <span className="validation-count">{stats.afgekeurd}</span>
              <span className="validation-label">Afgekeurd</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill progress-success"
                style={{
                  width: `${(stats.goedgekeurd / stats.totaalMedewerkers) * 100}%`,
                }}
              />
              <div
                className="progress-fill progress-warning"
                style={{
                  width: `${(stats.teValideren / stats.totaalMedewerkers) * 100}%`,
                }}
              />
              <div
                className="progress-fill progress-danger"
                style={{
                  width: `${(stats.afgekeurd / stats.totaalMedewerkers) * 100}%`,
                }}
              />
            </div>
            <span className="progress-text">
              {Math.round((stats.goedgekeurd / stats.totaalMedewerkers) * 100)}% gevalideerd
            </span>
          </div>
        </div>

        {/* Per sector */}
        <div className="card">
          <h2 className="card-title">Medewerkers per Sector</h2>
          <div className="sector-list">
            {Object.entries(stats.perSector)
              .sort(([, a], [, b]) => b - a)
              .map(([sector, count]) => (
                <div key={sector} className="sector-item">
                  <div className="sector-info">
                    <Briefcase size={16} />
                    <span className="sector-name">{sector}</span>
                  </div>
                  <div className="sector-bar-wrapper">
                    <div className="sector-bar">
                      <div
                        className="sector-bar-fill"
                        style={{
                          width: `${(count / stats.totaalMedewerkers) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="sector-count">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Arbeidsregime & Type verdeling */}
      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Arbeidsregime</h2>
          <div className="distribution-list">
            {Object.entries(stats.perRegime).map(([regime, count]) => (
              <div key={regime} className="distribution-item">
                <span className="distribution-label">
                  {regime === 'voltijds'
                    ? 'Voltijds'
                    : regime === 'deeltijds'
                    ? 'Deeltijds'
                    : 'Vrijwilliger'}
                </span>
                <span className="distribution-value">{count}</span>
                <span className="distribution-pct">
                  {Math.round((count / stats.totaalMedewerkers) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Type Medewerker</h2>
          <div className="distribution-list">
            {Object.entries(stats.perType).map(([type, count]) => (
              <div key={type} className="distribution-item">
                <span className="distribution-label">
                  {type === 'personeel'
                    ? 'Personeel'
                    : type === 'vrijwilliger'
                    ? 'Vrijwilliger'
                    : type === 'interim'
                    ? 'Interim'
                    : 'Extern'}
                </span>
                <span className="distribution-value">{count}</span>
                <span className="distribution-pct">
                  {Math.round((count / stats.totaalMedewerkers) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
