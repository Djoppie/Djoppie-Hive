import { useState } from 'react';
import {
  CloudDownload,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Info,
  ArrowRight,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { syncApi } from '../services/api';
import type { ADUserPreview, SyncPreview, SyncResultaat } from '../types';

type ImportStep = 'connect' | 'preview' | 'result';

export default function ADImport() {
  const [step, setStep] = useState<ImportStep>('connect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [syncResult, setSyncResult] = useState<SyncResultaat | null>(null);

  // CSV upload state (fallback for when Graph is not available)
  const [csvMode, setCsvMode] = useState(false);
  const [csvUsers, setCsvUsers] = useState<ADUserPreview[]>([]);

  const handleConnectAD = async () => {
    setLoading(true);
    setError(null);

    try {
      const previewData = await syncApi.getPreview();
      setPreview(previewData);

      // Select all active users that don't already exist
      const activeNewUsers = previewData.gebruikers
        .filter(u => u.accountEnabled && !u.bestaatAl)
        .map(u => u.id);
      setSelectedUsers(new Set(activeNewUsers));

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon geen verbinding maken met Azure AD');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
      const users: ADUserPreview[] = lines.slice(1).map((line, i) => {
        const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
        const get = (header: string) => {
          const idx = headers.findIndex(
            h => h.toLowerCase() === header.toLowerCase()
          );
          return idx >= 0 ? values[idx] : '';
        };

        const displayName = get('displayName') || get('naam') ||
          `${get('givenName') || get('voornaam')} ${get('surname') || get('achternaam')}`;

        return {
          id: `csv-${i}`,
          displayName,
          givenName: get('givenName') || get('voornaam') || null,
          surname: get('surname') || get('achternaam') || null,
          email: get('mail') || get('email') || '',
          jobTitle: get('jobTitle') || get('functie') || null,
          department: get('department') || get('afdeling') || null,
          mobilePhone: get('mobilePhone') || get('telefoon') || null,
          accountEnabled: (get('accountEnabled') || get('actief') || 'true').toLowerCase() !== 'false',
          bestaatAl: false,
          bestaandeMedewerkerId: null,
        };
      });

      setCsvUsers(users);
      setSelectedUsers(new Set(users.filter(u => u.accountEnabled).map(u => u.id)));
      setCsvMode(true);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      // For real sync, use the sync API to perform the actual import
      const result = await syncApi.uitvoeren();
      setSyncResult(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import mislukt');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setStep('connect');
    setPreview(null);
    setCsvUsers([]);
    setSelectedUsers(new Set());
    setSyncResult(null);
    setError(null);
    setCsvMode(false);
  };

  // Get the users to display (from preview or CSV)
  const displayUsers = csvMode ? csvUsers : (preview?.gebruikers || []);
  const displayStats = preview?.statistieken;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Azure AD / Entra Import</h1>
          <p className="page-subtitle">
            Importeer gebruikers uit Azure AD of een CSV-export
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stappen indicator */}
      <div className="steps-indicator">
        <div className={`step ${step === 'connect' ? 'step-active' : 'step-done'}`}>
          <span className="step-number">1</span>
          <span className="step-label">Verbinden</span>
        </div>
        <ArrowRight size={16} className="step-arrow" />
        <div className={`step ${step === 'preview' ? 'step-active' : step === 'result' ? 'step-done' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Voorbeeld</span>
        </div>
        <ArrowRight size={16} className="step-arrow" />
        <div className={`step ${step === 'result' ? 'step-active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Resultaat</span>
        </div>
      </div>

      {/* Stap 1: Verbinden */}
      {step === 'connect' && (
        <div className="import-connect">
          <div className="import-options">
            <div
              className={`import-option ${!csvMode ? 'import-option-active' : ''}`}
              onClick={() => setCsvMode(false)}
            >
              <CloudDownload size={48} />
              <h3>Azure AD / Entra</h3>
              <p>
                Verbind rechtstreeks met Azure AD om gebruikers op te halen.
                Haalt automatisch alle leden van MG- distributiegroepen op.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleConnectAD}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Verbinden...
                  </>
                ) : (
                  <>
                    <CloudDownload size={16} /> Verbind met Azure AD
                  </>
                )}
              </button>
            </div>

            <div
              className={`import-option ${csvMode ? 'import-option-active' : ''}`}
              onClick={() => setCsvMode(true)}
            >
              <FileSpreadsheet size={48} />
              <h3>CSV Import</h3>
              <p>
                Upload een CSV-export uit Azure AD of een andere bron.
                Het bestand moet kolommen bevatten voor naam, e-mail, etc.
              </p>
              <label className="btn btn-secondary upload-btn">
                <Upload size={16} /> CSV Uploaden
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="import-info">
            <Info size={18} />
            <div>
              <h4>Verwachte CSV-kolommen</h4>
              <p>
                displayName (of naam), givenName (of voornaam), surname (of achternaam),
                mail (of email), jobTitle (of functie), department (of afdeling),
                mobilePhone (of telefoon), accountEnabled (of actief)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stap 2: Preview */}
      {step === 'preview' && (
        <div className="import-preview">
          {/* Summary stats */}
          <div className="import-summary">
            <div className="import-summary-item">
              <Users size={18} />
              <span>
                <strong>{displayStats?.totaalGebruikers || displayUsers.length}</strong> gebruikers gevonden
              </span>
            </div>
            <div className="import-summary-item">
              <CheckCircle2 size={18} className="text-success" />
              <span>
                <strong>{displayStats?.actieveGebruikers || displayUsers.filter(u => u.accountEnabled).length}</strong> actief
              </span>
            </div>
            <div className="import-summary-item">
              <AlertTriangle size={18} className="text-warning" />
              <span>
                <strong>{displayStats?.inactieveGebruikers || displayUsers.filter(u => !u.accountEnabled).length}</strong> inactief
              </span>
            </div>
            {!csvMode && displayStats && (
              <>
                <div className="import-summary-item">
                  <Users size={18} className="text-info" />
                  <span>
                    <strong>{displayStats.nieuweGebruikers}</strong> nieuw
                  </span>
                </div>
                <div className="import-summary-item">
                  <Building2 size={18} />
                  <span>
                    <strong>{displayStats.totaalGroepen}</strong> groepen
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Groups preview (for real API) */}
          {!csvMode && preview?.groepen && preview.groepen.length > 0 && (
            <div className="import-groups-preview">
              <h3>MG- Distributiegroepen</h3>
              <div className="groups-grid">
                {preview.groepen.slice(0, 8).map(group => (
                  <div key={group.id} className={`group-card ${group.bestaatAl ? 'group-existing' : 'group-new'}`}>
                    <div className="group-name">{group.displayName}</div>
                    <div className="group-meta">
                      <span className="group-level">{group.niveau}</span>
                      <span className="group-members">{group.aantalLeden} leden</span>
                    </div>
                    {group.bestaatAl ? (
                      <span className="badge-status badge-aangepast">Bestaat al</span>
                    ) : (
                      <span className="badge-status badge-goedgekeurd">Nieuw</span>
                    )}
                  </div>
                ))}
                {preview.groepen.length > 8 && (
                  <div className="group-card group-more">
                    +{preview.groepen.length - 8} meer groepen
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === displayUsers.filter(u => !u.bestaatAl).length}
                      onChange={() => {
                        const newUsers = displayUsers.filter(u => !u.bestaatAl);
                        if (selectedUsers.size === newUsers.length) {
                          setSelectedUsers(new Set());
                        } else {
                          setSelectedUsers(new Set(newUsers.map(u => u.id)));
                        }
                      }}
                    />
                  </th>
                  <th>Naam</th>
                  <th>E-mail</th>
                  <th>Functie</th>
                  <th>Afdeling</th>
                  <th>Telefoon</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map(u => (
                  <tr
                    key={u.id}
                    className={`${!u.accountEnabled ? 'row-inactive' : ''} ${u.bestaatAl ? 'row-duplicate' : ''}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        disabled={u.bestaatAl}
                      />
                    </td>
                    <td className="td-name">{u.displayName}</td>
                    <td className="td-email">{u.email}</td>
                    <td>{u.jobTitle || '-'}</td>
                    <td>{u.department || '-'}</td>
                    <td>{u.mobilePhone || '-'}</td>
                    <td>
                      {u.bestaatAl ? (
                        <span className="badge-status badge-aangepast">Bestaat al</span>
                      ) : u.accountEnabled ? (
                        <span className="badge-status badge-goedgekeurd">Actief</span>
                      ) : (
                        <span className="badge-status badge-afgekeurd">Inactief</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="import-actions">
            <button className="btn btn-secondary" onClick={reset}>
              Annuleren
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Synchroniseren...
                </>
              ) : (
                <>
                  <CloudDownload size={16} /> Synchronisatie starten
                </>
              )}
            </button>
          </div>

          <div className="import-note">
            <Info size={16} />
            <span>
              De synchronisatie importeert alle gebruikers uit de MG- distributiegroepen.
              Gebruikers die al bestaan worden bijgewerkt met de nieuwste gegevens.
            </span>
          </div>
        </div>
      )}

      {/* Stap 3: Resultaat */}
      {step === 'result' && syncResult && (
        <div className="import-result">
          <div className={`result-card ${syncResult.foutmelding ? 'result-warning' : 'result-success'}`}>
            {syncResult.foutmelding ? (
              <AlertTriangle size={64} />
            ) : (
              <CheckCircle2 size={64} />
            )}
            <h2>{syncResult.foutmelding ? 'Synchronisatie voltooid met waarschuwingen' : 'Synchronisatie voltooid'}</h2>

            <div className="result-stats">
              <div className="result-stat">
                <span className="result-stat-value text-info">{syncResult.groepenVerwerkt}</span>
                <span className="result-stat-label">Groepen verwerkt</span>
              </div>
              <div className="result-stat">
                <span className="result-stat-value text-success">{syncResult.medewerkersToegevoegd}</span>
                <span className="result-stat-label">Toegevoegd</span>
              </div>
              <div className="result-stat">
                <span className="result-stat-value text-warning">{syncResult.medewerkersBijgewerkt}</span>
                <span className="result-stat-label">Bijgewerkt</span>
              </div>
              <div className="result-stat">
                <span className="result-stat-value text-danger">{syncResult.medewerkersVerwijderd}</span>
                <span className="result-stat-label">Verwijderd</span>
              </div>
            </div>

            {syncResult.validatieVerzoekenAangemaakt > 0 && (
              <div className="result-validations">
                <AlertTriangle size={18} />
                <span>
                  Er zijn <strong>{syncResult.validatieVerzoekenAangemaakt}</strong> validatieverzoeken aangemaakt
                  die moeten worden beoordeeld.
                </span>
              </div>
            )}

            {syncResult.foutmelding && (
              <div className="result-error">
                <AlertCircle size={18} />
                <span>{syncResult.foutmelding}</span>
              </div>
            )}

            <p className="result-note">
              De geïmporteerde medewerkers hebben de status "Nieuw" en moeten nog
              gevalideerd worden door de verantwoordelijke diensthoofden of sectormanagers.
            </p>

            <div className="result-actions">
              <button className="btn btn-secondary" onClick={reset}>
                Nieuwe Import
              </button>
              <button
                className="btn btn-primary"
                onClick={() => (window.location.href = '/validatie')}
              >
                Naar Validatie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
