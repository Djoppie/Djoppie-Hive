import { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Euro,
  Clock,
  Info,
} from 'lucide-react';
import { licensesApi } from '../services/api';
import type {
  LicenseSubscriptionDto,
  LicenseUserDto,
  LicenseRecommendationDto,
  LicenseSummaryDto,
  LicenseFilterDto,
} from '../types';

type TabType = 'overzicht' | 'gebruikers' | 'aanbevelingen';

export default function Licenties() {
  const [activeTab, setActiveTab] = useState<TabType>('overzicht');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<LicenseSummaryDto | null>(null);
  const [subscriptions, setSubscriptions] = useState<LicenseSubscriptionDto[]>([]);
  const [users, setUsers] = useState<LicenseUserDto[]>([]);
  const [recommendations, setRecommendations] = useState<LicenseRecommendationDto[]>([]);

  // Filter states
  const [filter, setFilter] = useState<LicenseFilterDto>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await licensesApi.getOverview(filter);
      setSummary(overview.summary);
      setSubscriptions(overview.subscriptions);
      setUsers(overview.users);
      setRecommendations(overview.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij het laden van licenties');
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      user =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query) ||
        user.jobTitle?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Apply filters
  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const usersData = await licensesApi.getUsers(filter);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij filteren');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({});
    setSearchQuery('');
    loadData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-success" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-warning" />;
      case 'critical':
        return <XCircle size={16} className="text-error" />;
      default:
        return <Info size={16} />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading && !summary) {
    return (
      <div className="page">
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Licentie-overzicht laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Microsoft 365 Licenties</h1>
          <p className="page-subtitle">
            Overzicht van licentiegebruik en optimalisatie-aanbevelingen
          </p>
        </div>
        <button className="btn btn-primary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          Vernieuwen
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          {error}
          <button className="alert-close" onClick={() => setError(null)}>
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="license-summary-grid">
          <div className="summary-card license-card-e3">
            <div className="summary-card-header">
              <Key size={24} />
              <span>Microsoft 365 E3</span>
            </div>
            <div className="summary-card-content">
              <div className="summary-stat-large">{summary.usedE3Licenses}</div>
              <div className="summary-stat-label">van {summary.totalE3Licenses} in gebruik</div>
              <div className="summary-stat-available">
                <span className={summary.availableE3Licenses < 5 ? 'text-error' : 'text-success'}>
                  {summary.availableE3Licenses} beschikbaar
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-e3"
                  style={{
                    width: `${summary.totalE3Licenses > 0 ? (summary.usedE3Licenses / summary.totalE3Licenses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="summary-card license-card-f3">
            <div className="summary-card-header">
              <Key size={24} />
              <span>Microsoft 365 F3</span>
            </div>
            <div className="summary-card-content">
              <div className="summary-stat-large">{summary.usedF3Licenses}</div>
              <div className="summary-stat-label">van {summary.totalF3Licenses} in gebruik</div>
              <div className="summary-stat-available">
                <span className={summary.availableF3Licenses < 5 ? 'text-error' : 'text-success'}>
                  {summary.availableF3Licenses} beschikbaar
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-f3"
                  style={{
                    width: `${summary.totalF3Licenses > 0 ? (summary.usedF3Licenses / summary.totalF3Licenses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="summary-card license-card-recommendations">
            <div className="summary-card-header">
              <TrendingDown size={24} />
              <span>Aanbevelingen</span>
            </div>
            <div className="summary-card-content">
              <div className="summary-stat-large">{summary.totalRecommendations}</div>
              <div className="summary-stat-label">optimalisaties mogelijk</div>
              {summary.potentialSavings > 0 && (
                <div className="summary-stat-savings">
                  <Euro size={16} />
                  <span>
                    Potentiële besparing: <strong>{formatCurrency(summary.potentialSavings)}/maand</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overzicht' ? 'active' : ''}`}
          onClick={() => setActiveTab('overzicht')}
        >
          <Key size={16} /> Abonnementen
        </button>
        <button
          className={`tab ${activeTab === 'gebruikers' ? 'active' : ''}`}
          onClick={() => setActiveTab('gebruikers')}
        >
          <Users size={16} /> Gebruikers ({users.length})
        </button>
        <button
          className={`tab ${activeTab === 'aanbevelingen' ? 'active' : ''}`}
          onClick={() => setActiveTab('aanbevelingen')}
        >
          <TrendingDown size={16} /> Aanbevelingen ({recommendations.length})
        </button>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'overzicht' && (
        <div className="subscriptions-grid">
          {subscriptions.map(sub => (
            <div key={sub.skuId} className={`subscription-card status-${sub.status}`}>
              <div className="subscription-header">
                {getStatusIcon(sub.status)}
                <h3>{sub.displayName}</h3>
              </div>
              <div className="subscription-stats">
                <div className="stat-row">
                  <span className="stat-label">Totaal:</span>
                  <span className="stat-value">{sub.totalLicenses}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">In gebruik:</span>
                  <span className="stat-value">{sub.usedLicenses}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Beschikbaar:</span>
                  <span className={`stat-value ${sub.availableLicenses < 5 ? 'text-error' : 'text-success'}`}>
                    {sub.availableLicenses}
                  </span>
                </div>
              </div>
              <div className="subscription-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-fill progress-${sub.status}`}
                    style={{ width: `${sub.percentageUsed}%` }}
                  />
                </div>
                <span className="progress-label">{sub.percentageUsed}% in gebruik</span>
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <div className="empty-state">
              <Key size={48} className="text-muted" />
              <p>Geen licentie-abonnementen gevonden</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'gebruikers' && (
        <>
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
            <button
              className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-group">
                <label>Licentietype</label>
                <select
                  value={filter.licenseType || ''}
                  onChange={e => setFilter({ ...filter, licenseType: e.target.value || undefined })}
                  className="form-select"
                >
                  <option value="">Alle</option>
                  <option value="e3">E3</option>
                  <option value="f3">F3</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Activiteitsstatus</label>
                <select
                  value={filter.activityStatus || ''}
                  onChange={e => setFilter({ ...filter, activityStatus: e.target.value || undefined })}
                  className="form-select"
                >
                  <option value="">Alle</option>
                  <option value="Actief">Actief</option>
                  <option value="Inactief (30+ dagen)">Inactief 30+ dagen</option>
                  <option value="Inactief (60+ dagen)">Inactief 60+ dagen</option>
                  <option value="Inactief (90+ dagen)">Inactief 90+ dagen</option>
                  <option value="Nooit ingelogd">Nooit ingelogd</option>
                </select>
              </div>
              <div className="filter-group">
                <label>
                  <input
                    type="checkbox"
                    checked={filter.onlyWithRecommendations || false}
                    onChange={e => setFilter({ ...filter, onlyWithRecommendations: e.target.checked || undefined })}
                  />
                  Alleen met aanbevelingen
                </label>
              </div>
              <div className="filter-actions">
                <button className="btn btn-primary" onClick={handleApplyFilter}>
                  Toepassen
                </button>
                <button className="btn" onClick={clearFilters}>
                  Wissen
                </button>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>E-mail</th>
                  <th>Afdeling</th>
                  <th>Licentie</th>
                  <th>Laatste login</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Geen gebruikers gevonden
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.userId} className={user.hasRecommendation ? 'row-warning' : ''}>
                      <td className="td-name">{user.displayName}</td>
                      <td className="td-email">{user.email}</td>
                      <td>{user.department || '-'}</td>
                      <td>
                        <span className="license-badge">{user.primaryLicense}</span>
                      </td>
                      <td>
                        <div className="last-login">
                          <Clock size={14} />
                          {user.lastSignInDate
                            ? new Date(user.lastSignInDate).toLocaleDateString('nl-BE')
                            : 'Nooit'}
                          {user.daysSinceLastSignIn > 0 && (
                            <span className="days-ago">({user.daysSinceLastSignIn} dagen geleden)</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.activityStatus === 'Actief' ? 'active' : 'inactive'}`}>
                          {user.activityStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'aanbevelingen' && (
        <div className="recommendations-list">
          {recommendations.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} className="text-success" />
              <h3>Geen aanbevelingen</h3>
              <p>Alle licenties worden effectief gebruikt</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div key={`${rec.userId}-${index}`} className={`recommendation-card ${getSeverityBadgeClass(rec.severity)}`}>
                <div className="recommendation-header">
                  <div className="recommendation-user">
                    <strong>{rec.userDisplayName}</strong>
                    <span className="recommendation-email">{rec.userEmail}</span>
                  </div>
                  <span className={`severity-badge ${getSeverityBadgeClass(rec.severity)}`}>
                    {rec.severity === 'high' && <AlertTriangle size={14} />}
                    {rec.severity === 'medium' && <AlertCircle size={14} />}
                    {rec.severity === 'low' && <Info size={14} />}
                    {rec.severity === 'high' ? 'Hoog' : rec.severity === 'medium' ? 'Gemiddeld' : 'Laag'}
                  </span>
                </div>
                <div className="recommendation-body">
                  <div className="recommendation-title">
                    {rec.recommendationType === 'REMOVE_LICENSE' && <TrendingDown size={18} className="text-error" />}
                    {rec.recommendationType === 'DOWNGRADE_TO_F3' && <TrendingDown size={18} className="text-warning" />}
                    {rec.recommendationType === 'REVIEW_USAGE' && <AlertCircle size={18} className="text-info" />}
                    {rec.recommendationType === 'UPGRADE_TO_E3' && <TrendingUp size={18} className="text-success" />}
                    <span>{rec.recommendationTitle}</span>
                  </div>
                  <p className="recommendation-description">{rec.recommendationDescription}</p>
                  <div className="recommendation-meta">
                    <span className="meta-item">
                      <Key size={14} />
                      Huidige licentie: {rec.currentLicense}
                    </span>
                    <span className="meta-item">
                      <Clock size={14} />
                      {rec.daysSinceActivity === 999
                        ? 'Nooit ingelogd'
                        : `${rec.daysSinceActivity} dagen inactief`}
                    </span>
                    {rec.estimatedMonthlySavings && (
                      <span className="meta-item meta-savings">
                        <Euro size={14} />
                        Besparing: {formatCurrency(rec.estimatedMonthlySavings)}/maand
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .license-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: var(--color-surface);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }

        .summary-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          color: var(--color-text-secondary);
        }

        .summary-card-header span {
          font-weight: 500;
        }

        .license-card-e3 .summary-card-header {
          color: var(--color-primary);
        }

        .license-card-f3 .summary-card-header {
          color: var(--color-info);
        }

        .license-card-recommendations .summary-card-header {
          color: var(--color-warning);
        }

        .summary-stat-large {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1;
        }

        .summary-stat-label {
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
        }

        .summary-stat-available {
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .summary-stat-savings {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          color: var(--color-success);
          font-size: 0.9rem;
        }

        .progress-bar {
          height: 8px;
          background: var(--color-border);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 1rem;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-e3, .progress-healthy {
          background: var(--color-primary);
        }

        .progress-f3 {
          background: var(--color-info);
        }

        .progress-warning {
          background: var(--color-warning);
        }

        .progress-critical {
          background: var(--color-error);
        }

        .subscriptions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .subscription-card {
          background: var(--color-surface);
          border-radius: 8px;
          padding: 1.25rem;
          border: 1px solid var(--color-border);
        }

        .subscription-card.status-critical {
          border-left: 4px solid var(--color-error);
        }

        .subscription-card.status-warning {
          border-left: 4px solid var(--color-warning);
        }

        .subscription-card.status-healthy {
          border-left: 4px solid var(--color-success);
        }

        .subscription-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .subscription-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .subscription-stats {
          margin-bottom: 1rem;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
        }

        .stat-label {
          color: var(--color-text-secondary);
        }

        .stat-value {
          font-weight: 500;
        }

        .subscription-progress {
          margin-top: 0.75rem;
        }

        .progress-label {
          display: block;
          text-align: right;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
        }

        .filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .filter-bar .search-input-wrapper {
          flex: 1;
        }

        .filter-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-surface);
          border-radius: 8px;
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .license-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .last-login {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .days-ago {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        .row-warning {
          background: var(--color-warning-light, rgba(255, 152, 0, 0.05));
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-card {
          background: var(--color-surface);
          border-radius: 8px;
          padding: 1.25rem;
          border: 1px solid var(--color-border);
        }

        .recommendation-card.severity-high {
          border-left: 4px solid var(--color-error);
        }

        .recommendation-card.severity-medium {
          border-left: 4px solid var(--color-warning);
        }

        .recommendation-card.severity-low {
          border-left: 4px solid var(--color-info);
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .recommendation-user {
          display: flex;
          flex-direction: column;
        }

        .recommendation-email {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .severity-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .severity-badge.severity-high {
          background: var(--color-error-light, rgba(244, 67, 54, 0.1));
          color: var(--color-error);
        }

        .severity-badge.severity-medium {
          background: var(--color-warning-light, rgba(255, 152, 0, 0.1));
          color: var(--color-warning);
        }

        .severity-badge.severity-low {
          background: var(--color-info-light, rgba(33, 150, 243, 0.1));
          color: var(--color-info);
        }

        .recommendation-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .recommendation-description {
          color: var(--color-text-secondary);
          margin-bottom: 0.75rem;
        }

        .recommendation-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .meta-savings {
          color: var(--color-success);
          font-weight: 500;
        }

        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-error { color: var(--color-error); }
        .text-info { color: var(--color-info); }
        .text-muted { color: var(--color-text-secondary); }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem;
          color: var(--color-text-primary);
        }

        .empty-state p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
