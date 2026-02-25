import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Download,
  Send,
  ShieldOff,
  Database,
  X,
} from 'lucide-react';
import { auditApi } from '../services/api';
import type { AuditLogDTO, AuditLogPagedResponse, AuditLogFilter, AuditAction, AuditEntityType } from '../types';

const actionIcons: Record<AuditAction, typeof Plus> = {
  Create: Plus,
  Update: Edit3,
  Delete: Trash2,
  View: Eye,
  Login: LogIn,
  Logout: LogOut,
  Export: Download,
  Sync: Database,
  Send: Send,
  AccessDenied: ShieldOff,
};

const actionLabels: Record<AuditAction, string> = {
  Create: 'Aangemaakt',
  Update: 'Bijgewerkt',
  Delete: 'Verwijderd',
  View: 'Bekeken',
  Login: 'Ingelogd',
  Logout: 'Uitgelogd',
  Export: 'Geëxporteerd',
  Sync: 'Gesynchroniseerd',
  Send: 'Verstuurd',
  AccessDenied: 'Toegang geweigerd',
};

const entityLabels: Record<AuditEntityType, string> = {
  Employee: 'Medewerker',
  DistributionGroup: 'Distributiegroep',
  EmployeeGroupMembership: 'Groepslidmaatschap',
  UserRole: 'Gebruikersrol',
  Event: 'Evenement',
  EventParticipant: 'Evenement Deelnemer',
  ValidatieVerzoek: 'Validatieverzoek',
  SyncLogboek: 'Sync Logboek',
  System: 'Systeem',
};

const actionColors: Record<AuditAction, string> = {
  Create: 'badge-success',
  Update: 'badge-info',
  Delete: 'badge-danger',
  View: 'badge-secondary',
  Login: 'badge-primary',
  Logout: 'badge-secondary',
  Export: 'badge-warning',
  Sync: 'badge-primary',
  Send: 'badge-success',
  AccessDenied: 'badge-danger',
};

export default function AuditLog() {
  const [response, setResponse] = useState<AuditLogPagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);

  const [filter, setFilter] = useState<AuditLogFilter>({
    pageNumber: 1,
    pageSize: 25,
  });

  useEffect(() => {
    loadData();
  }, [filter.pageNumber, filter.pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditApi.getLogs(filter);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setFilter(prev => ({ ...prev, pageNumber: 1 }));
    loadData();
  };

  const clearFilters = () => {
    setFilter({
      pageNumber: 1,
      pageSize: 25,
    });
    loadData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatJson = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  if (loading && !response) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Audit Log</h1>
        </div>
        <div className="empty-state-card">
          <RefreshCw size={48} className="spinning text-primary" />
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p className="page-subtitle">
            GDPR-compliant overzicht van alle systeemwijzigingen
          </p>
        </div>
        <div className="page-actions">
          <button
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Vernieuwen
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning">
          <span>{error}</span>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-4">
          <h2 className="card-title">
            <Filter size={18} /> Filters
          </h2>
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="fromDate">Van datum</label>
              <input
                type="date"
                id="fromDate"
                value={filter.fromDate?.split('T')[0] || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    fromDate: e.target.value ? `${e.target.value}T00:00:00` : undefined,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="toDate">Tot datum</label>
              <input
                type="date"
                id="toDate"
                value={filter.toDate?.split('T')[0] || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    toDate: e.target.value ? `${e.target.value}T23:59:59` : undefined,
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="action">Actie</label>
              <select
                id="action"
                value={filter.action || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    action: e.target.value as AuditAction | undefined,
                  }))
                }
              >
                <option value="">Alle acties</option>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="entityType">Entiteit type</label>
              <select
                id="entityType"
                value={filter.entityType || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    entityType: e.target.value as AuditEntityType | undefined,
                  }))
                }
              >
                <option value="">Alle types</option>
                {Object.entries(entityLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="userId">Gebruiker ID</label>
              <input
                type="text"
                id="userId"
                placeholder="Object ID..."
                value={filter.userId || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    userId: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>
              Wissen
            </button>
            <button className="btn btn-primary" onClick={applyFilters}>
              <Search size={16} /> Zoeken
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      {response && (
        <div className="results-info">
          <span>
            {response.totalCount} resultaten gevonden
            {response.totalPages > 1 && ` (pagina ${response.pageNumber} van ${response.totalPages})`}
          </span>
        </div>
      )}

      {/* Audit log table */}
      {response && response.items.length > 0 ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <Calendar size={14} /> Tijdstip
                </th>
                <th>
                  <User size={14} /> Gebruiker
                </th>
                <th>Actie</th>
                <th>
                  <FileText size={14} /> Entiteit
                </th>
                <th>Beschrijving</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {response.items.map(log => {
                const ActionIcon = actionIcons[log.action];
                return (
                  <tr key={log.id}>
                    <td className="text-nowrap">{formatDateShort(log.timestamp)}</td>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{log.userDisplayName || 'System'}</span>
                        {log.userEmail && (
                          <span className="user-email text-muted">{log.userEmail}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${actionColors[log.action]}`}>
                        <ActionIcon size={12} />
                        <span style={{ marginLeft: 4 }}>{actionLabels[log.action]}</span>
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {entityLabels[log.entityType]}
                      </span>
                    </td>
                    <td className="truncate-cell">
                      {log.entityDescription || log.entityId || '-'}
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        title="Details bekijken"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {response.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm"
                disabled={response.pageNumber <= 1}
                onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber! - 1 }))}
              >
                <ChevronLeft size={16} /> Vorige
              </button>
              <span className="pagination-info">
                Pagina {response.pageNumber} van {response.totalPages}
              </span>
              <button
                className="btn btn-sm"
                disabled={response.pageNumber >= response.totalPages}
                onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber! + 1 }))}
              >
                Volgende <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state-card">
          <FileText size={48} className="text-muted" />
          <h3>Geen audit logs gevonden</h3>
          <p>Er zijn geen logs die voldoen aan de huidige filters.</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Audit Log Details</h2>
              <button className="icon-btn" onClick={() => setSelectedLog(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="audit-detail-grid">
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Tijdstip</span>
                  <span className="audit-detail-value">{formatDate(selectedLog.timestamp)}</span>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Gebruiker</span>
                  <span className="audit-detail-value">
                    {selectedLog.userDisplayName || 'System'}
                    {selectedLog.userEmail && <br />}
                    {selectedLog.userEmail && (
                      <span className="text-muted">{selectedLog.userEmail}</span>
                    )}
                  </span>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Actie</span>
                  <span className={`badge ${actionColors[selectedLog.action]}`}>
                    {actionLabels[selectedLog.action]}
                  </span>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Entiteit Type</span>
                  <span className="badge badge-secondary">
                    {entityLabels[selectedLog.entityType]}
                  </span>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Entiteit ID</span>
                  <code className="audit-detail-value">{selectedLog.entityId || '-'}</code>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">Beschrijving</span>
                  <span className="audit-detail-value">{selectedLog.entityDescription || '-'}</span>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-label">IP Adres</span>
                  <code className="audit-detail-value">{selectedLog.ipAddress || '-'}</code>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div className="audit-values-section">
                  <h3>Oude waarden</h3>
                  <pre className="json-viewer">{formatJson(selectedLog.oldValues)}</pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div className="audit-values-section">
                  <h3>Nieuwe waarden</h3>
                  <pre className="json-viewer">{formatJson(selectedLog.newValues)}</pre>
                </div>
              )}

              {selectedLog.additionalInfo && (
                <div className="audit-values-section">
                  <h3>Extra informatie</h3>
                  <p>{selectedLog.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
