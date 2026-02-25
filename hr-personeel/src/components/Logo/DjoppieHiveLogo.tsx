import React from 'react';
import styles from './DjoppieHiveLogo.module.css';

interface DjoppieHiveLogoProps {
  variant?: 'full' | 'icon' | 'text' | 'compact';
  size?: 'xs' | 'small' | 'medium' | 'large' | 'hero';
  theme?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const DjoppieHiveLogo: React.FC<DjoppieHiveLogoProps> = ({
  variant = 'full',
  size = 'medium',
  theme = 'auto',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  const sizeConfig = {
    xs: { fontSize: 14, subtitleSize: 8 },
    small: { fontSize: 17, subtitleSize: 9 },
    medium: { fontSize: 22, subtitleSize: 10 },
    large: { fontSize: 28, subtitleSize: 12 },
    hero: { fontSize: 42, subtitleSize: 14 },
  };

  const { fontSize, subtitleSize } = sizeConfig[size];

  // Clean text-based logo
  const LogoText = () => (
    <div className={styles.logoText} style={{ fontSize: `${fontSize}px` }}>
      <div className={styles.mainText}>
        <span className={styles.djoppie}>Djoppie</span>
        <span className={styles.separator}>•</span>
        <span className={styles.hive}>Hive</span>
      </div>
      {showSubtitle && (
        <div className={styles.subtitle} style={{ fontSize: `${subtitleSize}px` }}>
          HR administration
        </div>
      )}
    </div>
  );

  const containerClasses = [
    styles.logo,
    styles[`logo--${size}`],
    styles[`logo--${theme}`],
    styles[`logo--${variant}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <LogoText />
    </div>
  );
};

export default DjoppieHiveLogo;
