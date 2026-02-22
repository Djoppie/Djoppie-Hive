import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { syncApi } from '../services/api';
import type { SyncStatusInfo, SyncResultaat } from '../types';

interface SyncKnopProps {
  onSyncComplete?: (resultaat: SyncResultaat) => void;
}

/**
 * Sync knop component voor handmatige synchronisatie vanuit Microsoft Graph.
 * Toont spinner tijdens sync en laatste sync tijdstip.
 */
export default function SyncKnop({ onSyncComplete }: SyncKnopProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<SyncStatusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<SyncResultaat | null>(null);

  // Haal initiële status op
  const laadStatus = useCallback(async () => {
    try {
      const syncStatus = await syncApi.getStatus();
      setStatus(syncStatus);
      setIsLoading(syncStatus.isSyncBezig);
    } catch (err) {
      console.error('Fout bij ophalen sync status:', err);
    }
  }, []);

  useEffect(() => {
    laadStatus();
  }, [laadStatus]);

  // Poll status als sync bezig is
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(async () => {
      try {
        const syncStatus = await syncApi.getStatus();
        setStatus(syncStatus);
        if (!syncStatus.isSyncBezig) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Fout bij ophalen sync status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSync = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setResultaat(null);

    try {
      const result = await syncApi.uitvoeren();
      setResultaat(result);
      onSyncComplete?.(result);
      await laadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronisatie mislukt');
      setIsLoading(false);
    }
  };

  const formatDatum = (dateString: string | null) => {
    if (!dateString) return 'Nooit';
    const date = new Date(dateString);
    return date.toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="sync-knop-container">
      <button
        className={`btn btn-primary sync-knop ${isLoading ? 'sync-bezig' : ''}`}
        onClick={handleSync}
        disabled={isLoading}
        title={isLoading ? 'Synchronisatie bezig...' : 'Synchroniseer met Microsoft Graph'}
      >
        <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        {isLoading ? 'Sync bezig...' : 'Sync nu'}
      </button>

      <div className="sync-status">
        {status && (
          <span className="sync-laatste" title={`Laatste sync: ${formatDatum(status.laatsteSyncOp)}`}>
            <Clock size={12} />
            {formatDatum(status.laatsteSyncOp)}
          </span>
        )}
      </div>

      {error && (
        <div className="sync-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {resultaat && !error && (
        <div className="sync-resultaat">
          <Check size={14} />
          <span>
            {resultaat.groepenVerwerkt} groepen, {resultaat.medewerkersToegevoegd} toegevoegd,{' '}
            {resultaat.medewerkersBijgewerkt} bijgewerkt
            {resultaat.validatieVerzoekenAangemaakt > 0 && (
              <>, {resultaat.validatieVerzoekenAangemaakt} validaties</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
