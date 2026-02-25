import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Medewerker, ArbeidsRegime, PersoneelType } from '../types';
import { distributionGroupsApi, type DistributionGroup, type NestedGroup } from '../services/api';
import { alleSectoren as fallbackSectoren, alleDiensten as fallbackDiensten } from '../data/mockData';

interface Props {
  medewerker?: Medewerker | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Medewerker>) => void;
  viewOnly?: boolean;
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

export default function MedewerkerModal({ medewerker, open, onClose, onSave, viewOnly = false }: Props) {
  // Initialize form data from medewerker prop - parent should use key prop to reset
  const [formData, setFormData] = useState(() => getInitialFormData(medewerker));

  // API-based sectors and diensten
  const [apiSectoren, setApiSectoren] = useState<DistributionGroup[]>([]);
  const [apiDiensten, setApiDiensten] = useState<NestedGroup[]>([]);
  const [sectorenLoading, setSectorenLoading] = useState(false);
  const [dienstenLoading, setDienstenLoading] = useState(false);
  const [useApiData, setUseApiData] = useState(false);

  // Fetch sectors from API on mount
  useEffect(() => {
    if (!open) return;

    const fetchSectoren = async () => {
      setSectorenLoading(true);
      try {
        const groups = await distributionGroupsApi.getAll();
        // Filter for MG-SECTOR-* groups
        const sectoren = groups.filter(g =>
          g.displayName.startsWith('MG-SECTOR-')
        );
        if (sectoren.length > 0) {
          setApiSectoren(sectoren);
          setUseApiData(true);
        }
      } catch (err) {
        console.error('Failed to fetch sectors from API, using fallback:', err);
        setUseApiData(false);
      } finally {
        setSectorenLoading(false);
      }
    };

    fetchSectoren();
  }, [open]);

  // Fetch diensten when sector changes (API mode)
  useEffect(() => {
    if (!useApiData || !formData.sector) {
      setApiDiensten([]);
      return;
    }

    // Find the sector group by display name
    const sectorGroup = apiSectoren.find(s =>
      formatSectorName(s.displayName) === formData.sector
    );

    if (!sectorGroup) {
      setApiDiensten([]);
      return;
    }

    const fetchDiensten = async () => {
      setDienstenLoading(true);
      try {
        const details = await distributionGroupsApi.getById(sectorGroup.id);
        setApiDiensten(details.nestedGroups || []);
      } catch (err) {
        console.error('Failed to fetch diensten from API:', err);
        setApiDiensten([]);
      } finally {
        setDienstenLoading(false);
      }
    };

    fetchDiensten();
  }, [formData.sector, useApiData, apiSectoren]);

  if (!open) return null;

  // Helper to format sector name (remove MG-SECTOR- prefix)
  function formatSectorName(displayName: string): string {
    return displayName.replace('MG-SECTOR-', '').replace(/-/g, ' ');
  }

  // Helper to format dienst name (remove MG- prefix)
  function formatDienstName(displayName: string): string {
    return displayName.replace('MG-', '').replace(/-/g, ' ');
  }

  // Get sectors list based on data source
  let sectoren = useApiData
    ? apiSectoren.map(s => formatSectorName(s.displayName))
    : fallbackSectoren;

  // Include current sector value if not in list (for API employees without sector hierarchy)
  if (formData.sector && !sectoren.includes(formData.sector)) {
    sectoren = [formData.sector, ...sectoren];
  }

  // Get diensten based on data source
  let beschikbareDiensten = useApiData
    ? apiDiensten.map(d => formatDienstName(d.displayName))
    : (formData.sector ? fallbackDiensten[formData.sector] || [] : []);

  // Include current dienst value if not in list (for API employees)
  if (formData.dienst && !beschikbareDiensten.includes(formData.dienst)) {
    beschikbareDiensten = [formData.dienst, ...beschikbareDiensten];
  }

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
          <h2>{viewOnly ? 'Medewerker Details' : medewerker ? 'Medewerker Bewerken' : 'Nieuwe Medewerker'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="voornaam">Voornaam {!viewOnly && '*'}</label>
              <input
                id="voornaam"
                type="text"
                required={!viewOnly}
                value={formData.voornaam}
                onChange={e => setFormData(prev => ({ ...prev, voornaam: e.target.value }))}
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="achternaam">Achternaam {!viewOnly && '*'}</label>
              <input
                id="achternaam"
                type="text"
                required={!viewOnly}
                value={formData.achternaam}
                onChange={e => setFormData(prev => ({ ...prev, achternaam: e.target.value }))}
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">E-mail {!viewOnly && '*'}</label>
              <input
                id="email"
                type="email"
                required={!viewOnly}
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefoon">Telefoon</label>
              <input
                id="telefoon"
                type="text"
                value={formData.telefoon}
                onChange={e => setFormData(prev => ({ ...prev, telefoon: e.target.value }))}
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
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
              disabled={viewOnly}
              className={viewOnly ? 'input-readonly' : ''}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sector">
                Sector {!viewOnly && '*'}
                {!viewOnly && sectorenLoading && <Loader2 size={14} className="inline-spinner" />}
              </label>
              <select
                id="sector"
                required={!viewOnly}
                value={formData.sector}
                onChange={e =>
                  setFormData(prev => ({ ...prev, sector: e.target.value, dienst: '' }))
                }
                disabled={viewOnly || sectorenLoading}
                className={viewOnly ? 'input-readonly' : ''}
              >
                <option value="">-- Kies sector --</option>
                {sectoren.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dienst">
                Dienst {!viewOnly && '*'}
                {!viewOnly && dienstenLoading && <Loader2 size={14} className="inline-spinner" />}
              </label>
              <select
                id="dienst"
                required={!viewOnly}
                value={formData.dienst}
                onChange={e => setFormData(prev => ({ ...prev, dienst: e.target.value }))}
                disabled={viewOnly || !formData.sector || dienstenLoading}
                className={viewOnly ? 'input-readonly' : ''}
              >
                <option value="">
                  {dienstenLoading ? 'Laden...' : '-- Kies dienst --'}
                </option>
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
              <label htmlFor="arbeidsRegime">Arbeidsregime {!viewOnly && '*'}</label>
              <select
                id="arbeidsRegime"
                required={!viewOnly}
                value={formData.arbeidsRegime}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    arbeidsRegime: e.target.value as ArbeidsRegime,
                  }))
                }
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
              >
                <option value="voltijds">Voltijds</option>
                <option value="deeltijds">Deeltijds</option>
                <option value="vrijwilliger">Vrijwilliger</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="type">Type {!viewOnly && '*'}</label>
              <select
                id="type"
                required={!viewOnly}
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    type: e.target.value as PersoneelType,
                  }))
                }
                disabled={viewOnly}
                className={viewOnly ? 'input-readonly' : ''}
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
                disabled={viewOnly}
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
              disabled={viewOnly}
              className={viewOnly ? 'input-readonly' : ''}
            />
          </div>

          <div className="modal-actions">
            {viewOnly ? (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Sluiten
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Annuleren
                </button>
                <button type="submit" className="btn btn-primary">
                  {medewerker ? 'Opslaan' : 'Toevoegen'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
