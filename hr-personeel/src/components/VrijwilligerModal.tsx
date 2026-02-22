import { useState, useEffect } from 'react';
import { X, Heart, Save, Calendar, Phone, User, Mail, Briefcase } from 'lucide-react';
import type { Employee } from '../services/api';

interface VrijwilligerModalProps {
  vrijwilliger: Employee | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Employee>) => void;
}

export default function VrijwilligerModal({ vrijwilliger, open, onClose, onSave }: VrijwilligerModalProps) {
  // Basic info
  const [displayName, setDisplayName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [telefoonnummer, setTelefoonnummer] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [dienstId, setDienstId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Dates
  const [startDatum, setStartDatum] = useState('');
  const [eindDatum, setEindDatum] = useState('');

  // Vrijwilliger-specific fields
  const [beschikbaarheid, setBeschikbaarheid] = useState('');
  const [specialisaties, setSpecialisaties] = useState('');
  const [noodContactNaam, setNoodContactNaam] = useState('');
  const [noodContactTelefoon, setNoodContactTelefoon] = useState('');
  const [vogDatum, setVogDatum] = useState('');
  const [vogGeldigTot, setVogGeldigTot] = useState('');

  // Availability checkboxes
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  useEffect(() => {
    if (vrijwilliger) {
      // Split full name into given name and surname if not provided
      const nameParts = vrijwilliger.displayName.split(' ');
      const gName = vrijwilliger.givenName || nameParts[0] || '';
      const sName = vrijwilliger.surname || nameParts.slice(1).join(' ') || '';

      setDisplayName(vrijwilliger.displayName);
      setGivenName(gName);
      setSurname(sName);
      setEmail(vrijwilliger.email);
      setTelefoonnummer(vrijwilliger.telefoonnummer || '');
      setJobTitle(vrijwilliger.jobTitle || '');
      setDienstId(vrijwilliger.dienstId || '');
      setIsActive(vrijwilliger.isActive);
      setStartDatum(vrijwilliger.startDatum || '');
      setEindDatum(vrijwilliger.eindDatum || '');

      // Vrijwilliger details
      setBeschikbaarheid(vrijwilliger.vrijwilligerDetails?.beschikbaarheid || '');
      setSpecialisaties(vrijwilliger.vrijwilligerDetails?.specialisaties || '');
      setNoodContactNaam(vrijwilliger.vrijwilligerDetails?.noodContactNaam || '');
      setNoodContactTelefoon(vrijwilliger.vrijwilligerDetails?.noodContactTelefoon || '');
      setVogDatum(vrijwilliger.vrijwilligerDetails?.vogDatum || '');
      setVogGeldigTot(vrijwilliger.vrijwilligerDetails?.vogGeldigTot || '');

      // Parse availability days
      if (vrijwilliger.vrijwilligerDetails?.beschikbaarheid) {
        const days = vrijwilliger.vrijwilligerDetails.beschikbaarheid.split(',').map(d => d.trim());
        setAvailabilityDays(days);
      }
    } else {
      // Reset form for new volunteer
      setDisplayName('');
      setGivenName('');
      setSurname('');
      setEmail('');
      setTelefoonnummer('');
      setJobTitle('');
      setDienstId('');
      setIsActive(true);
      setStartDatum('');
      setEindDatum('');
      setBeschikbaarheid('');
      setSpecialisaties('');
      setNoodContactNaam('');
      setNoodContactTelefoon('');
      setVogDatum('');
      setVogGeldigTot('');
      setAvailabilityDays([]);
    }
  }, [vrijwilliger, open]);

  // Update beschikbaarheid when availability days change
  useEffect(() => {
    setBeschikbaarheid(availabilityDays.join(', '));
  }, [availabilityDays]);

  // Update display name when given name or surname changes
  useEffect(() => {
    if (givenName || surname) {
      setDisplayName(`${givenName} ${surname}`.trim());
    }
  }, [givenName, surname]);

  const toggleAvailabilityDay = (day: string) => {
    setAvailabilityDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Employee> = {
      displayName: displayName.trim(),
      givenName: givenName.trim(),
      surname: surname.trim(),
      email: email.trim(),
      telefoonnummer: telefoonnummer.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      dienstId: dienstId || undefined,
      isActive,
      startDatum: startDatum || undefined,
      eindDatum: eindDatum || undefined,
      employeeType: 'Vrijwilliger',
      arbeidsRegime: 'Vrijwilliger',
      vrijwilligerDetails: vrijwilliger?.vrijwilligerDetails ? {
        ...vrijwilliger.vrijwilligerDetails,
        beschikbaarheid: beschikbaarheid.trim() || undefined,
        specialisaties: specialisaties.trim() || undefined,
        noodContactNaam: noodContactNaam.trim() || undefined,
        noodContactTelefoon: noodContactTelefoon.trim() || undefined,
        vogDatum: vogDatum || undefined,
        vogGeldigTot: vogGeldigTot || undefined,
      } : undefined,
    };

    onSave(data);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Heart size={20} style={{ color: 'var(--color-danger)' }} />
            {vrijwilliger ? 'Vrijwilliger Bewerken' : 'Nieuwe Vrijwilliger'}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <h3 className="form-section-title">
            <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Basisgegevens
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label>Voornaam *</label>
              <input
                type="text"
                value={givenName}
                onChange={e => setGivenName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Achternaam *</label>
              <input
                type="text"
                value={surname}
                onChange={e => setSurname(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>E-mailadres *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input
                type="tel"
                value={telefoonnummer}
                onChange={e => setTelefoonnummer(e.target.value)}
                placeholder="+32 123 45 67 89"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Functie / Rol</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="bijv. Jeugdmonitor, Evenementenhelper"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                Actief
              </label>
            </div>
          </div>

          {/* Availability */}
          <h3 className="form-section-title">
            <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Beschikbaarheid & Periode
          </h3>

          <div className="form-group">
            <label>Beschikbare dagen</label>
            <div className="chip-list">
              {weekDays.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`chip ${availabilityDays.includes(day) ? 'chip-active' : ''}`}
                  onClick={() => toggleAvailabilityDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <span className="form-hint">Selecteer de dagen waarop de vrijwilliger beschikbaar is</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Startdatum</label>
              <input
                type="date"
                value={startDatum}
                onChange={e => setStartDatum(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Einddatum</label>
              <input
                type="date"
                value={eindDatum}
                onChange={e => setEindDatum(e.target.value)}
              />
            </div>
          </div>

          {/* Skills and Specializations */}
          <h3 className="form-section-title">
            <Briefcase size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Specialisaties & Vaardigheden
          </h3>

          <div className="form-group">
            <label>Specialisaties</label>
            <textarea
              value={specialisaties}
              onChange={e => setSpecialisaties(e.target.value)}
              rows={3}
              placeholder="bijv. Eerste hulp, kinderanimatie, technische ondersteuning, ..."
            />
            <span className="form-hint">Komma-gescheiden lijst van vaardigheden</span>
          </div>

          {/* Emergency Contact */}
          <h3 className="form-section-title">
            <Phone size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Noodcontact
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label>Noodcontact Naam</label>
              <input
                type="text"
                value={noodContactNaam}
                onChange={e => setNoodContactNaam(e.target.value)}
                placeholder="Naam van noodcontactpersoon"
              />
            </div>
            <div className="form-group">
              <label>Noodcontact Telefoon</label>
              <input
                type="tel"
                value={noodContactTelefoon}
                onChange={e => setNoodContactTelefoon(e.target.value)}
                placeholder="+32 123 45 67 89"
              />
            </div>
          </div>

          {/* VOG (Verklaring Omtrent Gedrag) */}
          <h3 className="form-section-title">
            <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
            VOG (Verklaring Omtrent Gedrag)
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label>VOG Datum</label>
              <input
                type="date"
                value={vogDatum}
                onChange={e => setVogDatum(e.target.value)}
              />
              <span className="form-hint">Datum van afgifte</span>
            </div>
            <div className="form-group">
              <label>VOG Geldig Tot</label>
              <input
                type="date"
                value={vogGeldigTot}
                onChange={e => setVogGeldigTot(e.target.value)}
              />
              <span className="form-hint">Vervaldatum (waarschuwing na 3 maanden)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              {vrijwilliger ? 'Opslaan' : 'Aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
