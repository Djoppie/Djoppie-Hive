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
  X,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';
import type { Medewerker } from '../types';

interface ADUser {
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  accountEnabled: boolean;
  id: string;
}

// Simulated AD users for demo
const simulatedADUsers: ADUser[] = [
  {
    id: 'ad-001',
    displayName: 'Lotte Van den Berg',
    givenName: 'Lotte',
    surname: 'Van den Berg',
    mail: 'lotte.vandenberg@diepenbeek.be',
    jobTitle: 'Communicatiemedewerker',
    department: 'Algemene Zaken',
    mobilePhone: '0477 12 34 56',
    accountEnabled: true,
  },
  {
    id: 'ad-002',
    displayName: 'Thomas Schepers',
    givenName: 'Thomas',
    surname: 'Schepers',
    mail: 'thomas.schepers@diepenbeek.be',
    jobTitle: 'ICT Helpdesk',
    department: 'ICT',
    accountEnabled: true,
  },
  {
    id: 'ad-003',
    displayName: 'Elke Vandeweyer',
    givenName: 'Elke',
    surname: 'Vandeweyer',
    mail: 'elke.vandeweyer@diepenbeek.be',
    jobTitle: 'Administratief Bediende',
    department: 'Burgerzaken',
    accountEnabled: true,
  },
  {
    id: 'ad-004',
    displayName: 'Ruben Gorissen',
    givenName: 'Ruben',
    surname: 'Gorissen',
    mail: 'ruben.gorissen@diepenbeek.be',
    jobTitle: 'Technisch Assistent',
    department: 'Technische Dienst',
    accountEnabled: true,
  },
  {
    id: 'ad-005',
    displayName: 'Veerle Puts',
    givenName: 'Veerle',
    surname: 'Puts',
    mail: 'veerle.puts@diepenbeek.be',
    jobTitle: 'Maatschappelijk Werker',
    department: 'Welzijn',
    mobilePhone: '0478 56 78 90',
    accountEnabled: true,
  },
  {
    id: 'ad-006',
    displayName: 'Filip Driesen',
    givenName: 'Filip',
    surname: 'Driesen',
    mail: 'filip.driesen@diepenbeek.be',
    jobTitle: 'Boekhouder',
    department: 'Financiën',
    accountEnabled: false,
  },
];

type ImportStep = 'connect' | 'preview' | 'mapping' | 'result';

export default function ADImport() {
  const { medewerkers, importeerVanAD } = usePersoneel();
  const [step, setStep] = useState<ImportStep>('connect');
  const [loading, setLoading] = useState(false);
  const [adUsers, setAdUsers] = useState<ADUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<{
    success: number;
    skipped: number;
    errors: number;
  } | null>(null);

  // CSV upload
  const [csvMode, setCsvMode] = useState(false);

  const handleConnectAD = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAdUsers(simulatedADUsers);
      setSelectedUsers(
        new Set(simulatedADUsers.filter(u => u.accountEnabled).map(u => u.id))
      );
      setLoading(false);
      setStep('preview');
    }, 1500);
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
      const users: ADUser[] = lines.slice(1).map((line, i) => {
        const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
        const get = (header: string) => {
          const idx = headers.findIndex(
            h => h.toLowerCase() === header.toLowerCase()
          );
          return idx >= 0 ? values[idx] : '';
        };

        return {
          id: `csv-${i}`,
          displayName: get('displayName') || get('naam') || `${get('givenName') || get('voornaam')} ${get('surname') || get('achternaam')}`,
          givenName: get('givenName') || get('voornaam') || '',
          surname: get('surname') || get('achternaam') || '',
          mail: get('mail') || get('email') || '',
          jobTitle: get('jobTitle') || get('functie') || undefined,
          department: get('department') || get('afdeling') || undefined,
          mobilePhone: get('mobilePhone') || get('telefoon') || undefined,
          accountEnabled: (get('accountEnabled') || get('actief') || 'true').toLowerCase() !== 'false',
        };
      });

      setAdUsers(users);
      setSelectedUsers(new Set(users.filter(u => u.accountEnabled).map(u => u.id)));
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setLoading(true);
    const toImport = adUsers.filter(u => selectedUsers.has(u.id));

    const bestaandeEmails = new Set(medewerkers.map(m => m.email.toLowerCase()));
    let success = 0;
    let skipped = 0;

    const nieuweMedewerkers: Partial<Medewerker>[] = [];
    toImport.forEach(u => {
      if (bestaandeEmails.has(u.mail.toLowerCase())) {
        skipped++;
        return;
      }
      nieuweMedewerkers.push({
        adId: u.id,
        voornaam: u.givenName,
        achternaam: u.surname,
        volledigeNaam: u.displayName,
        email: u.mail,
        telefoon: u.mobilePhone,
        functie: u.jobTitle || '',
        afdeling: u.department || '',
        sector: u.department || '',
        dienst: '',
        arbeidsRegime: 'voltijds',
        type: 'personeel',
        actief: u.accountEnabled,
        opmerkingen: 'Geïmporteerd uit Azure AD',
        bronAD: true,
        handmatigToegevoegd: false,
      });
      success++;
    });

    setTimeout(() => {
      importeerVanAD(nieuweMedewerkers);
      setImportResult({ success, skipped, errors: 0 });
      setLoading(false);
      setStep('result');
    }, 1000);
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
    setAdUsers([]);
    setSelectedUsers(new Set());
    setImportResult(null);
    setCsvMode(false);
  };

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

      {/* Stappen indicator */}
      <div className="steps-indicator">
        <div className={`step ${step === 'connect' ? 'step-active' : step !== 'connect' ? 'step-done' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Verbinden</span>
        </div>
        <ArrowRight size={16} className="step-arrow" />
        <div className={`step ${step === 'preview' ? 'step-active' : step === 'mapping' || step === 'result' ? 'step-done' : ''}`}>
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
                Haalt automatisch actieve en inactieve accounts op.
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
          <div className="import-summary">
            <div className="import-summary-item">
              <Users size={18} />
              <span>
                <strong>{adUsers.length}</strong> gebruikers gevonden
              </span>
            </div>
            <div className="import-summary-item">
              <CheckCircle2 size={18} className="text-success" />
              <span>
                <strong>{adUsers.filter(u => u.accountEnabled).length}</strong> actief
              </span>
            </div>
            <div className="import-summary-item">
              <AlertTriangle size={18} className="text-warning" />
              <span>
                <strong>{adUsers.filter(u => !u.accountEnabled).length}</strong> inactief
              </span>
            </div>
            <div className="import-summary-item">
              <CheckCircle2 size={18} className="text-info" />
              <span>
                <strong>{selectedUsers.size}</strong> geselecteerd voor import
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === adUsers.length}
                      onChange={() => {
                        if (selectedUsers.size === adUsers.length) {
                          setSelectedUsers(new Set());
                        } else {
                          setSelectedUsers(new Set(adUsers.map(u => u.id)));
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
                {adUsers.map(u => {
                  const bestaand = medewerkers.some(
                    m => m.email.toLowerCase() === u.mail.toLowerCase()
                  );
                  return (
                    <tr
                      key={u.id}
                      className={`${!u.accountEnabled ? 'row-inactive' : ''} ${bestaand ? 'row-duplicate' : ''}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(u.id)}
                          onChange={() => toggleUser(u.id)}
                          disabled={bestaand}
                        />
                      </td>
                      <td className="td-name">{u.displayName}</td>
                      <td className="td-email">{u.mail}</td>
                      <td>{u.jobTitle || '-'}</td>
                      <td>{u.department || '-'}</td>
                      <td>{u.mobilePhone || '-'}</td>
                      <td>
                        {bestaand ? (
                          <span className="badge-status badge-aangepast">Bestaat al</span>
                        ) : u.accountEnabled ? (
                          <span className="badge-status badge-goedgekeurd">Actief</span>
                        ) : (
                          <span className="badge-status badge-afgekeurd">Inactief</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              disabled={selectedUsers.size === 0 || loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Importeren...
                </>
              ) : (
                <>
                  <CloudDownload size={16} /> {selectedUsers.size} gebruikers importeren
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stap 3: Resultaat */}
      {step === 'result' && importResult && (
        <div className="import-result">
          <div className="result-card result-success">
            <CheckCircle2 size={64} />
            <h2>Import voltooid</h2>
            <div className="result-stats">
              <div className="result-stat">
                <span className="result-stat-value text-success">{importResult.success}</span>
                <span className="result-stat-label">Geïmporteerd</span>
              </div>
              <div className="result-stat">
                <span className="result-stat-value text-warning">{importResult.skipped}</span>
                <span className="result-stat-label">Overgeslagen (bestaan al)</span>
              </div>
              <div className="result-stat">
                <span className="result-stat-value text-danger">{importResult.errors}</span>
                <span className="result-stat-label">Fouten</span>
              </div>
            </div>
            <p className="result-note">
              De geïmporteerde medewerkers hebben de status &ldquo;Nieuw&rdquo; en moeten nog
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
