import React, { useState } from 'react';
import { DjoppieHiveLogo } from '../components/Logo';
import styles from './LogoShowcase.module.css';

/**
 * DJOPPIE HIVE Brand Showcase
 *
 * A comprehensive display of the Djoppie-Hive brand identity,
 * featuring the golden robot mascot, honeycomb design elements,
 * and neumorphic UI patterns.
 */
const LogoShowcase: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  const sizes = ['xs', 'small', 'medium', 'large', 'hero'] as const;
  const variants = ['full', 'icon', 'text', 'compact'] as const;

  const colorPalette = [
    { name: 'Honey Light', hex: '#FFE082', category: 'primary' },
    { name: 'Honey', hex: '#FFD54F', category: 'primary' },
    { name: 'Gold', hex: '#F5A623', category: 'primary' },
    { name: 'Amber', hex: '#FFB300', category: 'primary' },
    { name: 'Orange', hex: '#E88A1A', category: 'primary' },
    { name: 'Deep Orange', hex: '#D97706', category: 'primary' },
    { name: 'Burnt', hex: '#C45C00', category: 'primary' },
    { name: 'Brown Light', hex: '#8D6E63', category: 'accent' },
    { name: 'Brown', hex: '#5D4037', category: 'accent' },
    { name: 'Brown Dark', hex: '#3E2723', category: 'accent' },
    { name: 'Dark Red', hex: '#8B2500', category: 'accent' },
    { name: 'Cream', hex: '#FFF8E1', category: 'neutral' },
  ];

  return (
    <div className={`${styles.showcase} ${styles[`showcase--${activeTheme}`]}`}>
      {/* Animated Honeycomb Background */}
      <div className={styles.honeycombBg}>
        <svg className={styles.honeycombPattern} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="honeycombPatternBg" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
              <polygon
                points="15,0 30,7.5 30,22.5 15,30 0,22.5 0,7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                transform="translate(0, -2)"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycombPatternBg)" />
        </svg>
      </div>

      {/* Floating Hex Decorations */}
      <div className={styles.floatingHexes}>
        <div className={`${styles.floatingHex} ${styles.hex1}`} />
        <div className={`${styles.floatingHex} ${styles.hex2}`} />
        <div className={`${styles.floatingHex} ${styles.hex3}`} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <DjoppieHiveLogo variant="full" size="large" theme={activeTheme} />
          <p className={styles.tagline}>Brand Identity & Design System</p>
        </div>

        {/* Theme Toggle */}
        <div className={styles.themeToggle}>
          <button
            className={`${styles.themeBtn} ${activeTheme === 'light' ? styles.active : ''}`}
            onClick={() => setActiveTheme('light')}
            aria-label="Light theme"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Light
          </button>
          <button
            className={`${styles.themeBtn} ${activeTheme === 'dark' ? styles.active : ''}`}
            onClick={() => setActiveTheme('dark')}
            aria-label="Dark theme"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            Dark
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Hero Display
          </h2>
          <div className={styles.heroDisplay}>
            <div className={styles.heroCard}>
              <DjoppieHiveLogo variant="full" size="hero" theme={activeTheme} />
            </div>
          </div>
        </section>

        {/* Size Variants */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Size Variants
          </h2>
          <div className={styles.sizeGrid}>
            {sizes.map((size) => (
              <div key={size} className={styles.sizeItem}>
                <span className={styles.sizeLabel}>{size.toUpperCase()}</span>
                <div className={styles.logoContainer}>
                  <DjoppieHiveLogo variant="full" size={size} theme={activeTheme} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Layout Variants */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Layout Variants
          </h2>
          <div className={styles.variantGrid}>
            {variants.map((variant) => (
              <div key={variant} className={styles.variantItem}>
                <span className={styles.variantLabel}>{variant}</span>
                <div className={styles.logoContainer}>
                  <DjoppieHiveLogo variant={variant} size="medium" theme={activeTheme} />
                </div>
                <span className={styles.variantCode}>variant="{variant}"</span>
              </div>
            ))}
          </div>
        </section>

        {/* Neumorphic Cards */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Neumorphic Containers
          </h2>
          <div className={styles.neumorphicGrid}>
            <div className={styles.neumorphicCard}>
              <span className={styles.cardLabel}>Raised</span>
              <DjoppieHiveLogo variant="full" size="medium" theme={activeTheme} />
            </div>
            <div className={`${styles.neumorphicCard} ${styles.neumorphicPressed}`}>
              <span className={styles.cardLabel}>Pressed</span>
              <DjoppieHiveLogo variant="icon" size="large" theme={activeTheme} />
            </div>
            <div className={styles.neumorphicCard}>
              <span className={styles.cardLabel}>Compact</span>
              <DjoppieHiveLogo variant="compact" size="medium" theme={activeTheme} />
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Hive Color Palette
          </h2>
          <div className={styles.colorGrid}>
            {colorPalette.map((color) => (
              <div
                key={color.name}
                className={`${styles.colorItem} ${styles[`colorItem--${color.category}`]}`}
              >
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className={styles.colorCategory}>{color.category}</span>
                </div>
                <div className={styles.colorInfo}>
                  <span className={styles.colorName}>{color.name}</span>
                  <span className={styles.colorHex}>{color.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Usage Examples
          </h2>
          <div className={styles.usageGrid}>
            {/* Navigation Bar Example */}
            <div className={styles.usageExample}>
              <h3 className={styles.usageTitle}>Navigation Bar</h3>
              <div className={styles.mockNavbar}>
                <DjoppieHiveLogo variant="full" size="small" theme={activeTheme} />
                <div className={styles.mockNavLinks}>
                  <span>Dashboard</span>
                  <span>Medewerkers</span>
                  <span>Groepen</span>
                </div>
              </div>
            </div>

            {/* Login Screen Example */}
            <div className={styles.usageExample}>
              <h3 className={styles.usageTitle}>Login Screen</h3>
              <div className={styles.mockLogin}>
                <DjoppieHiveLogo variant="full" size="large" theme={activeTheme} />
                <div className={styles.mockLoginForm}>
                  <div className={styles.mockInput}>
                    <span>E-mailadres</span>
                  </div>
                  <div className={styles.mockInput}>
                    <span>Wachtwoord</span>
                  </div>
                  <button className={styles.mockButton}>
                    Inloggen met Microsoft
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Sidebar Example */}
            <div className={styles.usageExample}>
              <h3 className={styles.usageTitle}>Mobile Sidebar</h3>
              <div className={styles.mockMobile}>
                <div className={styles.mockMobileHeader}>
                  <DjoppieHiveLogo
                    variant="compact"
                    size="small"
                    theme={activeTheme === 'light' ? 'dark' : 'light'}
                  />
                </div>
                <div className={styles.mockMobileContent}>
                  <div className={styles.mockMenuItem}>
                    <span className={styles.menuIcon}>&#x2B22;</span>
                    Dashboard
                  </div>
                  <div className={styles.mockMenuItem}>
                    <span className={styles.menuIcon}>&#x2B22;</span>
                    Medewerkers
                  </div>
                  <div className={styles.mockMenuItem}>
                    <span className={styles.menuIcon}>&#x2B22;</span>
                    Groepen
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Design Philosophy */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Design Philosophy
          </h2>
          <div className={styles.philosophyGrid}>
            <div className={styles.philosophyCard}>
              <div className={styles.philosophyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <h3>Warmte</h3>
              <p>Golden amber tones create a welcoming, approachable HR environment</p>
            </div>
            <div className={styles.philosophyCard}>
              <div className={styles.philosophyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22,8.5 12,15.5 2,8.5" />
                </svg>
              </div>
              <h3>Structuur</h3>
              <p>Hexagonal geometry reflects organized, efficient HR administration</p>
            </div>
            <div className={styles.philosophyCard}>
              <div className={styles.philosophyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9,12 11,14 15,10" />
                </svg>
              </div>
              <h3>Betrouwbaarheid</h3>
              <p>Solid design with neumorphic depth conveys trust and security</p>
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.hexIcon}>&#x2B22;</span>
            Implementation
          </h2>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span>React Component Usage</span>
              <span className={styles.codeLanguage}>TSX</span>
            </div>
            <pre className={styles.codeContent}>
{`import { DjoppieHiveLogo } from '@/components/Logo';

// Full logo in navigation
<DjoppieHiveLogo variant="full" size="medium" theme="light" />

// Icon only for mobile
<DjoppieHiveLogo variant="icon" size="small" theme="dark" />

// Hero display on login page
<DjoppieHiveLogo variant="full" size="hero" animated />

// Compact version for sidebar
<DjoppieHiveLogo variant="compact" size="small" />`}
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <DjoppieHiveLogo variant="icon" size="small" theme={activeTheme} />
        <div className={styles.footerText}>
          <p className={styles.footerTitle}>DJOPPIE HIVE Brand Guidelines</p>
          <p className={styles.footerSubtitle}>Gemeente Diepenbeek | HR Administration</p>
        </div>
      </footer>
    </div>
  );
};

export default LogoShowcase;
