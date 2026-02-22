import { Cloud, UserPlus } from 'lucide-react';
import type { GegevensBron } from '../types';

interface BronIndicatorProps {
  bron: GegevensBron;
  showLabel?: boolean;
  size?: number;
}

/**
 * Indicator component die de bron van gegevens toont.
 * Cloud icoon voor Azure AD, User icoon voor handmatig toegevoegde gegevens.
 */
export default function BronIndicator({ bron, showLabel = false, size = 14 }: BronIndicatorProps) {
  const isAzure = bron === 'AzureAD';

  return (
    <span
      className={`bron-indicator ${isAzure ? 'bron-azure' : 'bron-handmatig'}`}
      title={isAzure ? 'Gesynchroniseerd vanuit Azure AD' : 'Handmatig toegevoegd'}
    >
      {isAzure ? <Cloud size={size} /> : <UserPlus size={size} />}
      {showLabel && <span className="bron-label">{isAzure ? 'Azure' : 'Handmatig'}</span>}
    </span>
  );
}
