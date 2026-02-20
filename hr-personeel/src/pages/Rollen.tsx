import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Eye,
  Edit3,
  Trash2,
  Users,
  Settings,
  Lock,
  Unlock,
} from 'lucide-react';
import type { Rol } from '../types';

interface RolDefinitie {
  id: Rol;
  naam: string;
  beschrijving: string;
  rechten: string[];
  aantalGebruikers: number;
  kleur: string;
}

const rolDefinities: RolDefinitie[] = [
  {
    id: 'hr_admin',
    naam: 'HR Administrator',
    beschrijving: 'Volledige toegang tot alle HR-functionaliteiten. Kan medewerkers beheren, valideren, importeren uit AD en uitnodigingen versturen.',
    rechten: [
      'Personeelslijst bekijken',
      'Medewerkers toevoegen/bewerken/verwijderen',
      'Azure AD import uitvoeren',
      'Validaties uitvoeren',
      'Uitnodigingen beheren en versturen',
      'Rollen en rechten toekennen',
      'Rapporten genereren',
      'Alle sectoren en diensten bekijken',
    ],
    aantalGebruikers: 3,
    kleur: 'var(--color-primary)',
  },
  {
    id: 'sectormanager',
    naam: 'Sectormanager',
    beschrijving: 'Beheert de medewerkers binnen de toegewezen sector. Kan gegevens aanvullen en valideren voor de eigen sector.',
    rechten: [
      'Personeelslijst eigen sector bekijken',
      'Medewerkers eigen sector bewerken',
      'Validatie uitvoeren voor eigen sector',
      'Ontbrekende gegevens aanvullen',
      'Medewerkers markeren als inactief',
      'Vrijwilligers toevoegen',
    ],
    aantalGebruikers: 8,
    kleur: 'var(--color-info)',
  },
  {
    id: 'diensthoofd',
    naam: 'Diensthoofd',
    beschrijving: 'Verantwoordelijk voor de validatie van personeelsgegevens binnen de eigen dienst. Kan gegevens controleren en aanpassen.',
    rechten: [
      'Personeelslijst eigen dienst bekijken',
      'Gegevens eigen dienst valideren',
      'Ontbrekende informatie aanvullen',
      'Personen schrappen die niet meer actief zijn',
      'Opmerkingen toevoegen',
    ],
    aantalGebruikers: 15,
    kleur: 'var(--color-warning)',
  },
  {
    id: 'medewerker',
    naam: 'Medewerker',
    beschrijving: 'Kan eigen gegevens bekijken en beperkte informatie wijzigen.',
    rechten: [
      'Eigen profiel bekijken',
      'Eigen contactgegevens wijzigen',
      'Uitnodigingen ontvangen',
    ],
    aantalGebruikers: 120,
    kleur: 'var(--color-muted)',
  },
];

interface Toewijzing {
  id: string;
  naam: string;
  email: string;
  rol: Rol;
  sector?: string;
  dienst?: string;
}

const mockToewijzingen: Toewijzing[] = [
  { id: '1', naam: 'Admin HR', email: 'hr@diepenbeek.be', rol: 'hr_admin' },
  { id: '2', naam: 'Annelies Verhoeven', email: 'annelies.verhoeven@diepenbeek.be', rol: 'hr_admin' },
  { id: '3', naam: 'Jan Peeters', email: 'jan.peeters@diepenbeek.be', rol: 'sectormanager', sector: 'Algemene Zaken' },
  { id: '4', naam: 'Peter Janssen', email: 'peter.janssen@diepenbeek.be', rol: 'sectormanager', sector: 'Burgerzaken' },
  { id: '5', naam: 'Kris Mertens', email: 'kris.mertens@diepenbeek.be', rol: 'sectormanager', sector: 'Financiën' },
  { id: '6', naam: 'Dirk Jacobs', email: 'dirk.jacobs@diepenbeek.be', rol: 'sectormanager', sector: 'Grondgebiedzaken' },
  { id: '7', naam: 'Marc Vermeersch', email: 'marc.vermeersch@diepenbeek.be', rol: 'sectormanager', sector: 'Vrije Tijd' },
  { id: '8', naam: 'Frank Aerts', email: 'frank.aerts@diepenbeek.be', rol: 'sectormanager', sector: 'Welzijn' },
  { id: '9', naam: 'Pieter Vanhoef', email: 'pieter.vanhoef@diepenbeek.be', rol: 'sectormanager', sector: 'ICT' },
  { id: '10', naam: 'Geert Smeets', email: 'geert.smeets@diepenbeek.be', rol: 'sectormanager', sector: 'Technische Dienst' },
  { id: '11', naam: 'Marie Claes', email: 'marie.claes@diepenbeek.be', rol: 'diensthoofd', sector: 'Algemene Zaken', dienst: 'Communicatie' },
  { id: '12', naam: 'An Willems', email: 'an.willems@diepenbeek.be', rol: 'diensthoofd', sector: 'Burgerzaken', dienst: 'Bevolking' },
];

export default function Rollen() {
  const [activeTab, setActiveTab] = useState<'rollen' | 'toewijzingen'>('rollen');
  const [selectedRol, setSelectedRol] = useState<RolDefinitie | null>(null);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Rollen & Rechten</h1>
          <p className="page-subtitle">
            Beheer profielen, rollen en rechten binnen de organisatie
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'rollen' ? 'active' : ''}`}
          onClick={() => setActiveTab('rollen')}
        >
          <Shield size={16} /> Rollen Overzicht
        </button>
        <button
          className={`tab ${activeTab === 'toewijzingen' ? 'active' : ''}`}
          onClick={() => setActiveTab('toewijzingen')}
        >
          <UserCog size={16} /> Toewijzingen
        </button>
      </div>

      {activeTab === 'rollen' && (
        <div className="roles-grid">
          {rolDefinities.map(rol => (
            <div
              key={rol.id}
              className={`role-card ${selectedRol?.id === rol.id ? 'role-card-selected' : ''}`}
              onClick={() => setSelectedRol(selectedRol?.id === rol.id ? null : rol)}
            >
              <div className="role-card-header" style={{ borderLeftColor: rol.kleur }}>
                <div className="role-icon" style={{ color: rol.kleur }}>
                  {rol.id === 'hr_admin' ? (
                    <ShieldAlert size={28} />
                  ) : rol.id === 'sectormanager' ? (
                    <ShieldCheck size={28} />
                  ) : rol.id === 'diensthoofd' ? (
                    <Shield size={28} />
                  ) : (
                    <Users size={28} />
                  )}
                </div>
                <div>
                  <h3 className="role-name">{rol.naam}</h3>
                  <span className="role-users">
                    <Users size={14} /> {rol.aantalGebruikers} gebruikers
                  </span>
                </div>
              </div>

              <p className="role-description">{rol.beschrijving}</p>

              {selectedRol?.id === rol.id && (
                <div className="role-permissions">
                  <h4>Rechten:</h4>
                  <ul className="permissions-list">
                    {rol.rechten.map((recht, i) => (
                      <li key={i}>
                        <Unlock size={14} className="text-success" />
                        {recht}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'toewijzingen' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Rol</th>
                <th>Sector</th>
                <th>Dienst</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {mockToewijzingen.map(t => (
                <tr key={t.id}>
                  <td className="td-name">{t.naam}</td>
                  <td className="td-email">{t.email}</td>
                  <td>
                    <span className={`role-badge role-badge-${t.rol}`}>
                      {t.rol === 'hr_admin'
                        ? 'HR Admin'
                        : t.rol === 'sectormanager'
                        ? 'Sectormanager'
                        : t.rol === 'diensthoofd'
                        ? 'Diensthoofd'
                        : 'Medewerker'}
                    </span>
                  </td>
                  <td>{t.sector || '-'}</td>
                  <td>{t.dienst || '-'}</td>
                  <td className="td-actions">
                    <button className="icon-btn" title="Bewerken">
                      <Edit3 size={16} />
                    </button>
                    <button className="icon-btn icon-btn-danger" title="Verwijderen">
                      <Trash2 size={16} />
                    </button>
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
