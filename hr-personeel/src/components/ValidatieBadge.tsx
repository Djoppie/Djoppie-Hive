import { useState, useEffect } from 'react';
import { validatieVerzoekenApi } from '../services/api';

interface ValidatieBadgeProps {
  groepId?: string;
  refreshInterval?: number;
}

/**
 * Badge component die het aantal openstaande validatieverzoeken toont.
 * Haalt het aantal op van de API en ververst periodiek.
 */
export default function ValidatieBadge({
  groepId,
  refreshInterval = 30000,
}: ValidatieBadgeProps) {
  const [aantal, setAantal] = useState<number | null>(null);

  useEffect(() => {
    const laadAantal = async () => {
      try {
        const count = await validatieVerzoekenApi.getAantal(groepId);
        setAantal(count);
      } catch (err) {
        console.error('Fout bij ophalen validatie aantal:', err);
        setAantal(null);
      }
    };

    laadAantal();
    const interval = setInterval(laadAantal, refreshInterval);

    return () => clearInterval(interval);
  }, [groepId, refreshInterval]);

  if (aantal === null || aantal === 0) {
    return null;
  }

  return <span className="validatie-badge">{aantal > 99 ? '99+' : aantal}</span>;
}
