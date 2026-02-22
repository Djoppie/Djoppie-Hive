import { useState } from 'react';
import { X } from 'lucide-react';
import type { Medewerker, ArbeidsRegime, PersoneelType } from '../types';
import { alleSectoren, alleDiensten } from '../data/mockData';

interface Props {
  medewerker?: Medewerker | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Medewerker>) => void;
}

const defaultFormData = {
  voornaam: '',
  achternaam: '',
  email: '',
  telefoon: '',
  functie: '',
  sector: '',
  dienst: '',
  arbeidsRegime: 'voltijds' as ArbeidsRegime,
  type: 'personeel' as PersoneelType,
  actief: true,
  opmerkingen: '',
};

// Helper to compute initial form data from medewerker prop
function getInitialFormData(medewerker: Medewerker | null | undefined) {
  if (medewerker) {
    return {
      voornaam: medewerker.voornaam,
      achternaam: medewerker.achternaam,
      email: medewerker.email,
      telefoon: medewerker.telefoon || '',
      functie: medewerker.functie || '',
      sector: medewerker.sector,
      dienst: medewerker.dienst,
      arbeidsRegime: medewerker.arbeidsRegime,
      type: medewerker.type,
      actief: medewerker.actief,
      opmerkingen: medewerker.opmerkingen,
    };
  }
  return defaultFormData;
}

export default function MedewerkerModal({ medewerker, open, onClose, onSave }: Props) {
  // Initialize form data from medewerker prop - parent should use key prop to reset
  const [formData, setFormData] = useState(() => getInitialFormData(medewerker));

  if (!open) return null;

  const beschikbareDiensten = formData.sector
    ? alleDiensten[formData.sector] || []
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      volledigeNaam: `${formData.voornaam} ${formData.achternaam}`,
      bronAD: medewerker?.bronAD ?? false,
      handmatigToegevoegd: !medewerker ? true : medewerker.handmatigToegevoegd,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{medewerker ? 'Medewerker Bewerken' : 'Nieuwe Medewerker'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="voornaam">Voornaam *</label>
              <input
                id="voornaam"
                type="text"
                required
                value={formData.voornaam}
                onChange={e => setFormData(prev => ({ ...prev, voornaam: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="achternaam">Achternaam *</label>
              <input
                id="achternaam"
                type="text"
                required
                value={formData.achternaam}
                onChange={e => setFormData(prev => ({ ...prev, achternaam: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">E-mail *</label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefoon">Telefoon</label>
              <input
                id="telefoon"
                type="text"
                value={formData.telefoon}
                onChange={e => setFormData(prev => ({ ...prev, telefoon: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="functie">Functie</label>
            <input
              id="functie"
              type="text"
              value={formData.functie}
              onChange={e => setFormData(prev => ({ ...prev, functie: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sector">Sector *</label>
              <select
                id="sector"
                required
                value={formData.sector}
                onChange={e =>
                  setFormData(prev => ({ ...prev, sector: e.target.value, dienst: '' }))
                }
              >
                <option value="">-- Kies sector --</option>
                {alleSectoren.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dienst">Dienst *</label>
              <select
                id="dienst"
                required
                value={formData.dienst}
                onChange={e => setFormData(prev => ({ ...prev, dienst: e.target.value }))}
                disabled={!formData.sector}
              >
                <option value="">-- Kies dienst --</option>
                {beschikbareDiensten.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="arbeidsRegime">Arbeidsregime *</label>
              <select
                id="arbeidsRegime"
                required
                value={formData.arbeidsRegime}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    arbeidsRegime: e.target.value as ArbeidsRegime,
                  }))
                }
              >
                <option value="voltijds">Voltijds</option>
                <option value="deeltijds">Deeltijds</option>
                <option value="vrijwilliger">Vrijwilliger</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    type: e.target.value as PersoneelType,
                  }))
                }
              >
                <option value="personeel">Personeel</option>
                <option value="vrijwilliger">Vrijwilliger</option>
                <option value="interim">Interim</option>
                <option value="extern">Extern</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.actief}
                onChange={e =>
                  setFormData(prev => ({ ...prev, actief: e.target.checked }))
                }
              />
              Actief
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="opmerkingen">Opmerkingen</label>
            <textarea
              id="opmerkingen"
              rows={3}
              value={formData.opmerkingen}
              onChange={e =>
                setFormData(prev => ({ ...prev, opmerkingen: e.target.value }))
              }
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary">
              {medewerker ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
