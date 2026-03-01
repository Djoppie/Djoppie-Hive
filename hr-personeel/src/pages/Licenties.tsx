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
  const [permissionError, setPermissionError] = useState(false);

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
    setPermissionError(false);
    try {
      const overview = await licensesApi.getOverview(filter);
      setSummary(overview.summary);
      setSubscriptions(overview.subscriptions);
      setUsers(overview.users);
      setRecommendations(overview.recommendations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fout bij het laden van licenties';
      // Check for permission/privilege errors from Microsoft Graph API
      // The API returns ProblemDetails JSON which may contain various error indicators
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('insufficient privileges') ||
          lowerMessage.includes('privileges') ||
          lowerMessage.includes('authorization') ||
          lowerMessage.includes('forbidden') ||
          lowerMessage.includes('internal server error') ||
          lowerMessage.includes('odata') ||
          errorMessage.includes('500')) {
        setPermissionError(true);
      } else {
        setError(errorMessage);
      }
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

  if (permissionError) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Microsoft 365 Licenties</h1>
            <p className="page-subtitle">
              Overzicht van licentiegebruik en optimalisatie-aanbevelingen
            </p>
          </div>
        </div>
        <div className="permission-error-container">
          <div className="permission-error-card">
            <div className="permission-error-icon">
              <Key size={48} />
            </div>
            <h2>Licentiebeheer niet beschikbaar</h2>
            <p className="permission-error-description">
              De Microsoft Graph API-machtigingen zijn nog niet geconfigureerd voor het ophalen van licentie-informatie.
            </p>
            <div className="permission-error-steps">
              <h3>Om dit op te lossen:</h3>
              <ol>
                <li>Ga naar <strong>Azure Portal</strong> &rarr; <strong>App registrations</strong></li>
                <li>Selecteer de app registratie van deze applicatie</li>
                <li>Ga naar <strong>API permissions</strong> &rarr; <strong>Add a permission</strong></li>
                <li>Voeg toe: <strong>Microsoft Graph</strong> &rarr; <strong>Application permissions</strong>:
                  <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <li><strong>AuditLog.Read.All</strong> (voor login-activiteit)</li>
                    <li><strong>Organization.Read.All</strong> (voor licentie-info)</li>
                    <li><strong>User.Read.All</strong> (voor gebruikersgegevens)</li>
                  </ul>
                </li>
                <li>Klik op <strong>Grant admin consent</strong></li>
                <li>Herstart de backend na het toevoegen van permissions</li>
              </ol>
            </div>
            <button className="btn btn-primary" onClick={loadData}>
              <RefreshCw size={16} />
              Opnieuw proberen
            </button>
          </div>
        </div>
        <style>{`
          .permission-error-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
          }
          .permission-error-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 2.5rem;
            max-width: 600px;
            text-align: center;
            box-shadow: var(--shadow-md);
          }
          .permission-error-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: var(--color-warning);
          }
          .permission-error-card h2 {
            margin: 0 0 1rem;
            color: var(--color-text-primary);
          }
          .permission-error-description {
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
          }
          .permission-error-steps {
            background: var(--color-background);
            border-radius: 8px;
            padding: 1.25rem;
            text-align: left;
            margin-bottom: 1.5rem;
          }
          .permission-error-steps h3 {
            margin: 0 0 0.75rem;
            font-size: 0.95rem;
            color: var(--color-text-primary);
          }
          .permission-error-steps ol {
            margin: 0;
            padding-left: 1.25rem;
            color: var(--color-text-secondary);
          }
          .permission-error-steps li {
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          .permission-error-steps strong {
            color: var(--color-text-primary);
          }
        `}</style>
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
        /* ========================================
           Microsoft 365 Licenties Page Styles
           Matches Djoppie Hive Design System
           ======================================== */

        /* Summary Cards Grid */
        .license-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          box-shadow:
            6px 6px 16px var(--neu-shadow-dark),
            -4px -4px 12px var(--neu-shadow-light),
            inset 0 1px 0 rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--hive-honey) 0%, var(--hive-deep-orange) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .summary-card:hover::before {
          opacity: 1;
        }

        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow:
            8px 8px 20px var(--neu-shadow-dark),
            -6px -6px 16px var(--neu-shadow-light),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }

        [data-theme="dark"] .summary-card {
          background: linear-gradient(145deg, #2d2d2d 0%, #252525 100%);
          box-shadow:
            6px 6px 16px rgba(0,0,0,0.5),
            -4px -4px 12px rgba(60,60,60,0.15),
            inset 0 1px 0 rgba(255,255,255,0.03);
        }

        [data-theme="dark"] .summary-card:hover {
          box-shadow:
            8px 8px 24px rgba(0,0,0,0.6),
            -6px -6px 18px rgba(60,60,60,0.2),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .summary-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-family: 'Outfit', 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-card-header svg {
          padding: 6px;
          border-radius: var(--border-radius-sm);
        }

        .license-card-e3 .summary-card-header {
          color: var(--color-primary);
        }

        .license-card-e3 .summary-card-header svg {
          background: var(--color-primary-bg);
          color: var(--color-primary);
        }

        .license-card-f3 .summary-card-header {
          color: var(--color-info);
        }

        .license-card-f3 .summary-card-header svg {
          background: var(--color-info-bg);
          color: var(--color-info);
        }

        .license-card-recommendations .summary-card-header {
          color: var(--color-warning);
        }

        .license-card-recommendations .summary-card-header svg {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        .summary-stat-large {
          font-family: 'Outfit', sans-serif;
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--hive-deep-orange) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        [data-theme="dark"] .summary-stat-large {
          background: linear-gradient(135deg, #ffffff 0%, var(--hive-honey) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .summary-stat-label {
          color: var(--text-secondary);
          margin-top: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .summary-stat-available {
          margin-top: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .summary-stat-savings {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          color: var(--color-success);
          font-size: 13px;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          background: var(--bg-main);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 14px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .progress-fill {
          height: 100%;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.2) 50%,
            transparent 100%
          );
          animation: progressShimmer 2s infinite;
        }

        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-e3, .progress-healthy {
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
        }

        .progress-f3 {
          background: linear-gradient(90deg, var(--color-info) 0%, var(--color-info-light) 100%);
        }

        .progress-warning {
          background: linear-gradient(90deg, var(--color-warning) 0%, var(--color-warning-light) 100%);
        }

        .progress-critical {
          background: linear-gradient(90deg, var(--color-danger) 0%, var(--color-danger-light) 100%);
        }

        /* Subscriptions Grid */
        .subscriptions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .subscription-card {
          background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border-radius: var(--border-radius);
          padding: 18px;
          box-shadow:
            5px 5px 14px var(--neu-shadow-dark),
            -3px -3px 10px var(--neu-shadow-light);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .subscription-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .subscription-card.status-critical::before {
          background: linear-gradient(180deg, var(--color-danger) 0%, var(--color-danger-light) 100%);
          opacity: 1;
        }

        .subscription-card.status-warning::before {
          background: linear-gradient(180deg, var(--color-warning) 0%, var(--color-warning-light) 100%);
          opacity: 1;
        }

        .subscription-card.status-healthy::before {
          background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-light) 100%);
          opacity: 1;
        }

        .subscription-card:hover {
          transform: translateY(-2px);
          box-shadow:
            8px 8px 20px var(--neu-shadow-dark),
            -5px -5px 14px var(--neu-shadow-light);
        }

        [data-theme="dark"] .subscription-card {
          background: linear-gradient(145deg, #2a2a2a 0%, #232323 100%);
          box-shadow:
            5px 5px 14px rgba(0,0,0,0.45),
            -3px -3px 10px rgba(55,55,55,0.12);
        }

        .subscription-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .subscription-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .subscription-stats {
          margin-bottom: 14px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .subscription-progress {
          margin-top: 12px;
        }

        .progress-label {
          display: block;
          text-align: right;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 6px;
          font-weight: 500;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .filter-bar .search-input-wrapper {
          flex: 1;
        }

        .filter-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 18px;
          background: var(--bg-card);
          border-radius: var(--border-radius);
          margin-bottom: 16px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 180px;
        }

        .filter-group label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        /* License Badges */
        .license-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: var(--color-primary-bg);
          color: var(--color-primary);
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid var(--color-primary-light);
          transition: all 0.2s ease;
        }

        .license-badge:hover {
          background: var(--color-primary-light);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
        }

        /* Last Login Display */
        .last-login {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .days-ago {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 500;
        }

        /* Status Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .status-badge.status-active {
          background: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid var(--color-success);
        }

        .status-badge.status-inactive {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
        }

        .status-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }

        /* Row Warning for Users with Recommendations */
        .row-warning {
          background: rgba(245, 166, 35, 0.04) !important;
        }

        .row-warning:hover {
          background: rgba(245, 166, 35, 0.08) !important;
        }

        /* Recommendations List */
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .recommendation-card {
          background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border-radius: var(--border-radius);
          padding: 18px;
          box-shadow:
            5px 5px 14px var(--neu-shadow-dark),
            -3px -3px 10px var(--neu-shadow-light);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .recommendation-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          opacity: 1;
        }

        .recommendation-card.severity-high::before {
          background: linear-gradient(180deg, var(--color-danger) 0%, var(--color-danger-light) 100%);
        }

        .recommendation-card.severity-medium::before {
          background: linear-gradient(180deg, var(--color-warning) 0%, var(--color-warning-light) 100%);
        }

        .recommendation-card.severity-low::before {
          background: linear-gradient(180deg, var(--color-info) 0%, var(--color-info-light) 100%);
        }

        .recommendation-card:hover {
          transform: translateY(-2px);
          box-shadow:
            8px 8px 20px var(--neu-shadow-dark),
            -5px -5px 14px var(--neu-shadow-light);
        }

        [data-theme="dark"] .recommendation-card {
          background: linear-gradient(145deg, #2a2a2a 0%, #232323 100%);
          box-shadow:
            5px 5px 14px rgba(0,0,0,0.45),
            -3px -3px 10px rgba(55,55,55,0.12);
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .recommendation-user {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recommendation-user strong {
          font-weight: 600;
          color: var(--text-primary);
        }

        .recommendation-email {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .severity-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .severity-badge.severity-high {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
        }

        .severity-badge.severity-medium {
          background: var(--color-warning-bg);
          color: var(--color-warning);
          border: 1px solid var(--color-warning);
        }

        .severity-badge.severity-low {
          background: var(--color-info-bg);
          color: var(--color-info);
          border: 1px solid var(--color-info);
        }

        .recommendation-body {
          padding-left: 4px;
        }

        .recommendation-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .recommendation-description {
          color: var(--text-secondary);
          margin-bottom: 12px;
          font-size: 13px;
          line-height: 1.6;
        }

        .recommendation-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .meta-savings {
          color: var(--color-success);
          font-weight: 600;
        }

        /* Utility Text Colors */
        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .text-error { color: var(--color-danger); }
        .text-info { color: var(--color-info); }
        .text-muted { color: var(--text-muted); }

        /* Empty State - Enhanced */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px !important;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state svg {
          opacity: 0.4;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 18px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .license-summary-grid {
            grid-template-columns: 1fr;
          }

          .subscriptions-grid {
            grid-template-columns: 1fr;
          }

          .recommendation-header {
            flex-direction: column;
            gap: 10px;
          }

          .severity-badge {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
