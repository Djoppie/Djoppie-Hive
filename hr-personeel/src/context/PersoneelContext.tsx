import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Medewerker,
  ValidatieVerzoek,
  Uitnodiging,
  GebruikerProfiel,
  ValidatieStatus,
  UitnodigingFilter,
} from '../types';
import {
  mockMedewerkers,
  mockValidatieVerzoeken,
  mockUitnodigingen,
  mockGebruiker,
} from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

interface PersoneelContextType {
  medewerkers: Medewerker[];
  validatieVerzoeken: ValidatieVerzoek[];
  uitnodigingen: Uitnodiging[];
  gebruiker: GebruikerProfiel;

  // Medewerker acties
  updateMedewerker: (id: string, updates: Partial<Medewerker>) => void;
  voegMedewerkerToe: (medewerker: Omit<Medewerker, 'id' | 'aanmaakDatum' | 'laatstGewijzigd'>) => void;
  verwijderMedewerker: (id: string) => void;
  importeerVanAD: (medewerkers: Partial<Medewerker>[]) => void;

  // Validatie acties
  updateValidatieStatus: (medewerkerId: string, status: ValidatieStatus, opmerkingen?: string) => void;
  bulkValidatie: (medewerkerIds: string[], status: ValidatieStatus, opmerkingen?: string) => void;

  // Uitnodiging acties
  maakUitnodiging: (uitnodiging: Omit<Uitnodiging, 'id'>) => void;
  updateUitnodiging: (id: string, updates: Partial<Uitnodiging>) => void;
  verstuurUitnodiging: (id: string) => void;
  getGefilterdeOntvangers: (filters: UitnodigingFilter) => Medewerker[];
}

const PersoneelContext = createContext<PersoneelContextType | undefined>(undefined);

export function PersoneelProvider({ children }: { children: ReactNode }) {
  const [medewerkers, setMedewerkers] = useState<Medewerker[]>(mockMedewerkers);
  const [validatieVerzoeken, setValidatieVerzoeken] = useState<ValidatieVerzoek[]>(mockValidatieVerzoeken);
  const [uitnodigingen, setUitnodigingen] = useState<Uitnodiging[]>(mockUitnodigingen);
  const [gebruiker] = useState<GebruikerProfiel>(mockGebruiker);

  const updateMedewerker = useCallback((id: string, updates: Partial<Medewerker>) => {
    setMedewerkers(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, ...updates, laatstGewijzigd: new Date().toISOString().split('T')[0] }
          : m
      )
    );
  }, []);

  const voegMedewerkerToe = useCallback(
    (medewerker: Omit<Medewerker, 'id' | 'aanmaakDatum' | 'laatstGewijzigd'>) => {
      const nieuw: Medewerker = {
        ...medewerker,
        id: uuidv4(),
        aanmaakDatum: new Date().toISOString().split('T')[0],
        laatstGewijzigd: new Date().toISOString().split('T')[0],
      };
      setMedewerkers(prev => [...prev, nieuw]);
    },
    []
  );

  const verwijderMedewerker = useCallback((id: string) => {
    setMedewerkers(prev => prev.filter(m => m.id !== id));
    setValidatieVerzoeken(prev => prev.filter(v => v.medewerkerId !== id));
  }, []);

  const importeerVanAD = useCallback((importData: Partial<Medewerker>[]) => {
    const nieuweMedewerkers: Medewerker[] = importData.map(data => ({
      id: uuidv4(),
      adId: data.adId || '',
      voornaam: data.voornaam || '',
      achternaam: data.achternaam || '',
      volledigeNaam: data.volledigeNaam || `${data.voornaam || ''} ${data.achternaam || ''}`,
      email: data.email || '',
      telefoon: data.telefoon,
      functie: data.functie || '',
      afdeling: data.afdeling || '',
      dienst: data.dienst || '',
      sector: data.sector || '',
      arbeidsRegime: data.arbeidsRegime || 'voltijds',
      type: data.type || 'personeel',
      actief: data.actief ?? true,
      opmerkingen: data.opmerkingen || 'Geïmporteerd uit Azure AD',
      validatieStatus: 'nieuw',
      bronAD: true,
      handmatigToegevoegd: false,
      aanmaakDatum: new Date().toISOString().split('T')[0],
      laatstGewijzigd: new Date().toISOString().split('T')[0],
    }));
    setMedewerkers(prev => [...prev, ...nieuweMedewerkers]);
  }, []);

  const updateValidatieStatus = useCallback(
    (medewerkerId: string, status: ValidatieStatus, opmerkingen?: string) => {
      setMedewerkers(prev =>
        prev.map(m =>
          m.id === medewerkerId
            ? {
                ...m,
                validatieStatus: status,
                validatieOpmerkingen: opmerkingen || m.validatieOpmerkingen,
                gevalideerdDoor: gebruiker.naam,
                validatieDatum: new Date().toISOString().split('T')[0],
                laatstGewijzigd: new Date().toISOString().split('T')[0],
              }
            : m
        )
      );
      setValidatieVerzoeken(prev =>
        prev.map(v =>
          v.medewerkerId === medewerkerId
            ? {
                ...v,
                status,
                opmerkingen: opmerkingen || v.opmerkingen,
                afgerondDatum: status === 'goedgekeurd' || status === 'afgekeurd' ? new Date().toISOString().split('T')[0] : undefined,
              }
            : v
        )
      );
    },
    [gebruiker.naam]
  );

  const bulkValidatie = useCallback(
    (medewerkerIds: string[], status: ValidatieStatus, opmerkingen?: string) => {
      medewerkerIds.forEach(id => updateValidatieStatus(id, status, opmerkingen));
    },
    [updateValidatieStatus]
  );

  const maakUitnodiging = useCallback((uitnodiging: Omit<Uitnodiging, 'id'>) => {
    setUitnodigingen(prev => [...prev, { ...uitnodiging, id: uuidv4() }]);
  }, []);

  const updateUitnodiging = useCallback((id: string, updates: Partial<Uitnodiging>) => {
    setUitnodigingen(prev =>
      prev.map(u => (u.id === id ? { ...u, ...updates } : u))
    );
  }, []);

  const verstuurUitnodiging = useCallback((id: string) => {
    setUitnodigingen(prev =>
      prev.map(u =>
        u.id === id
          ? { ...u, status: 'verstuurd' as const, verstuurdOp: new Date().toISOString().split('T')[0] }
          : u
      )
    );
  }, []);

  const getGefilterdeOntvangers = useCallback(
    (filters: UitnodigingFilter): Medewerker[] => {
      return medewerkers.filter(m => {
        if (filters.alleenActief && !m.actief) return false;
        if (filters.sectoren?.length && !filters.sectoren.includes(m.sector)) return false;
        if (filters.diensten?.length && !filters.diensten.includes(m.dienst)) return false;
        if (filters.types?.length && !filters.types.includes(m.type)) return false;
        if (filters.regimes?.length && !filters.regimes.includes(m.arbeidsRegime)) return false;
        return true;
      });
    },
    [medewerkers]
  );

  return (
    <PersoneelContext.Provider
      value={{
        medewerkers,
        validatieVerzoeken,
        uitnodigingen,
        gebruiker,
        updateMedewerker,
        voegMedewerkerToe,
        verwijderMedewerker,
        importeerVanAD,
        updateValidatieStatus,
        bulkValidatie,
        maakUitnodiging,
        updateUitnodiging,
        verstuurUitnodiging,
        getGefilterdeOntvangers,
      }}
    >
      {children}
    </PersoneelContext.Provider>
  );
}

export function usePersoneel() {
  const context = useContext(PersoneelContext);
  if (!context) {
    throw new Error('usePersoneel moet binnen PersoneelProvider gebruikt worden');
  }
  return context;
}
