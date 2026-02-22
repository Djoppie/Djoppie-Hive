import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Users,
  UserPlus,
  UserMinus,
  Edit3,
  FileWarning,
  Layers,
} from 'lucide-react';
import { syncApi, type SyncLogboekItem, type SyncStatusInfo } from '../services/api';

export default function SyncGeschiedenis() {
  const [geschiedenis, setGeschiedenis] = useState<SyncLogboekItem[]>([]);
  const [status, setStatus] = useState<SyncStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [historyData, statusData] = await Promise.all([
        syncApi.getGeschiedenis(20),
        syncApi.getStatus(),
      ]);
      setGeschiedenis(historyData);
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      await syncApi.uitvoeren();
      // Reload data after sync
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync mislukt');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Bezig...';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    const remainSec = diffSec % 60;
    return `${diffMin}m ${remainSec}s`;
  };

  const getStatusIcon = (syncStatus: string) => {
    switch (syncStatus) {
      case 'Voltooid':
        return <CheckCircle2 size={16} className="text-success" />;
      case 'Mislukt':
        return <XCircle size={16} className="text-danger" />;
      case 'GedeeltelijkVoltooid':
        return <AlertTriangle size={16} className="text-warning" />;
      case 'Bezig':
        return <RefreshCw size={16} className="spinning text-primary" />;
      default:
        return <Clock size={16} className="text-muted" />;
    }
  };

  const getStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case 'Voltooid':
        return 'badge-success';
      case 'Mislukt':
        return 'badge-danger';
      case 'GedeeltelijkVoltooid':
        return 'badge-warning';
      case 'Bezig':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Synchronisatie Geschiedenis</h1>
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
          <h1>Synchronisatie Geschiedenis</h1>
          <p className="page-subtitle">
            Overzicht van Microsoft Graph synchronisaties
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={16} /> Vernieuwen
          </button>
          <button
            className="btn btn-primary"
            onClick={startSync}
            disabled={isSyncing || status?.isSyncBezig}
          >
            {isSyncing || status?.isSyncBezig ? (
              <>
                <RefreshCw size={16} className="spinning" /> Bezig...
              </>
            ) : (
              <>
                <Play size={16} /> Nieuwe Sync
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Current status card */}
      {status && (
        <div className="card mb-4">
          <h2 className="card-title">
            <Clock size={18} /> Huidige Status
          </h2>
          <div className="sync-status-info">
            <div className="sync-status-item">
              <span className="sync-label">Sync actief:</span>
              <span className={`badge ${status.isSyncBezig ? 'badge-primary' : 'badge-secondary'}`}>
                {status.isSyncBezig ? 'Ja' : 'Nee'}
              </span>
            </div>
            <div className="sync-status-item">
              <span className="sync-label">Laatste sync:</span>
              <span className="sync-value">{formatDate(status.laatsteSyncOp)}</span>
            </div>
            <div className="sync-status-item">
              <span className="sync-label">Status:</span>
              <span className={`badge ${getStatusBadge(status.laatsteSyncStatus || '')}`}>
                {status.laatsteSyncStatus || 'Onbekend'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      {geschiedenis.length === 0 ? (
        <div className="empty-state-card">
          <Layers size={48} className="text-muted" />
          <h3>Geen synchronisaties</h3>
          <p>Er zijn nog geen synchronisaties uitgevoerd.</p>
          <button className="btn btn-primary" onClick={startSync}>
            <Play size={16} /> Start eerste sync
          </button>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">
            <Layers size={18} /> Synchronisatie Log
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Gestart</th>
                <th>Duur</th>
                <th>Door</th>
                <th>
                  <Layers size={14} /> Groepen
                </th>
                <th>
                  <UserPlus size={14} /> Toegevoegd
                </th>
                <th>
                  <Edit3 size={14} /> Bijgewerkt
                </th>
                <th>
                  <UserMinus size={14} /> Verwijderd
                </th>
                <th>
                  <FileWarning size={14} /> Validaties
                </th>
              </tr>
            </thead>
            <tbody>
              {geschiedenis.map(item => (
                <tr key={item.id}>
                  <td>
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span style={{ marginLeft: 4 }}>{item.status}</span>
                    </span>
                  </td>
                  <td>{formatDate(item.geStartOp)}</td>
                  <td>{formatDuration(item.geStartOp, item.voltooidOp)}</td>
                  <td>{item.gestartDoor || '-'}</td>
                  <td className="text-center">{item.groepenVerwerkt}</td>
                  <td className="text-center">
                    {item.medewerkersToegevoegd > 0 ? (
                      <span className="text-success">+{item.medewerkersToegevoegd}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.medewerkersBijgewerkt > 0 ? (
                      <span className="text-info">{item.medewerkersBijgewerkt}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.medewerkersVerwijderd > 0 ? (
                      <span className="text-danger">-{item.medewerkersVerwijderd}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="text-center">
                    {item.validatieVerzoekenAangemaakt > 0 ? (
                      <span className="badge badge-warning">{item.validatieVerzoekenAangemaakt}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
