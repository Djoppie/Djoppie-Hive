# Djoppie-Hive Logo Component

Professional SVG logo component for the Djoppie-Hive HR Administration system, featuring the Djoppie robot mascot with honeycomb theming.

## Features

- **SVG-based**: Scalable, crisp rendering at any size
- **Variants**: Full, icon-only, text-only layouts
- **Size options**: Small (40px), Medium (64px), Large (96px)
- **Theme support**: Light and dark themes
- **Neumorphic design**: Soft shadows and depth effects
- **Animations**: Subtle hover effects, eye pulse, bee float
- **Accessibility**: ARIA labels, keyboard focus, reduced motion support
- **Zero dependencies**: Pure React and CSS

## Quick Start

```tsx
import { DjoppieHiveLogo } from '@/components/Logo';

function App() {
  return <DjoppieHiveLogo variant="full" size="medium" theme="light" />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'full' \| 'icon' \| 'text'` | `'full'` | Logo layout variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Logo size |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

### Full Logo
Includes both the robot mascot icon and text. Best for primary branding.

```tsx
<DjoppieHiveLogo variant="full" size="large" />
```

**Use cases:**
- Login page hero
- Main navigation bar
- Application splash screen

### Icon Only
Just the Djoppie robot mascot. Ideal for compact spaces.

```tsx
<DjoppieHiveLogo variant="icon" size="medium" />
```

**Use cases:**
- Favicon
- Mobile navigation
- App icons
- Compact headers

### Text Only
Brand name without the icon. Good for footer and breadcrumbs.

```tsx
<DjoppieHiveLogo variant="text" size="small" />
```

**Use cases:**
- Page footers
- Breadcrumb trails
- Email signatures

## Sizes

### Small (40px height)
Compact version for tight spaces. Does not show bee companion.

```tsx
<DjoppieHiveLogo size="small" />
```

### Medium (64px height)
Standard size for most use cases. Shows all elements.

```tsx
<DjoppieHiveLogo size="medium" />
```

### Large (96px height)
Hero size for login pages and splash screens.

```tsx
<DjoppieHiveLogo size="large" />
```

## Themes

### Light Theme
Optimized for light backgrounds (#FAFAFA, #FFFFFF).

```tsx
<DjoppieHiveLogo theme="light" />
```

### Dark Theme
Optimized for dark backgrounds (#1A1A1A, #121212).

```tsx
<DjoppieHiveLogo theme="dark" />
```

## Design Elements

### Djoppie Robot Mascot
- **Golden helmet**: Gradient from light gold to deep orange
- **Glossy finish**: Shine overlay for depth
- **Dark visor**: Professional, mysterious look
- **Glowing eyes**: Amber glow with subtle pulse animation
- **Side "ears"**: Headphone-like elements

### Bee Companion
- Small bee flying near Djoppie (medium/large sizes only)
- Dotted flight trail
- Gentle floating animation
- Reinforces "hive" branding

### Honeycomb Elements
- Hexagonal background frame
- Small decorative hexagons
- Subtle gradient fills
- Professional structure metaphor

## Color Palette

The logo uses the official Diepenbeek color palette:

```css
--honey-gold: #F5A623;     /* Primary brand color */
--warm-orange: #E88A1A;    /* Secondary */
--deep-orange: #D97706;    /* Accent */
--honey-yellow: #FFC107;   /* Highlights */
--light-gold: #FFD54F;     /* Light accents */
--amber-glow: #FFAB00;     /* Eye glow */
--cream: #FFF8E1;          /* Soft backgrounds */
```

## Animations

All animations respect `prefers-reduced-motion` for accessibility.

### Hover Effects
- Icon subtle upward bounce
- Helmet shimmer effect

### Continuous Animations
- **Eye pulse**: 3s gentle opacity fade (1.0 → 0.85)
- **Bee float**: 4s circular floating motion
- **Shimmer**: 2s helmet shine on hover

## Accessibility

### ARIA Support
```tsx
<svg aria-label="Djoppie robot mascot">
```

### Keyboard Navigation
Focus outline with Diepenbeek orange color:
```css
.logo:focus-visible {
  outline: 2px solid var(--honey-gold);
  outline-offset: 4px;
}
```

### Reduced Motion
All animations disabled when user prefers reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  .djoppieIcon,
  .helmet,
  .eyes,
  .bee {
    animation: none;
    transition: none;
  }
}
```

### High Contrast
Text gradients converted to solid colors in high contrast mode.

## Examples

### Navigation Bar
```tsx
import { DjoppieHiveLogo } from '@/components/Logo';

function Navbar() {
  return (
    <nav>
      <DjoppieHiveLogo variant="full" size="medium" theme="light" />
      {/* ... other nav items */}
    </nav>
  );
}
```

### Login Page Hero
```tsx
import { DjoppieHiveLogo } from '@/components/Logo';

function LoginPage() {
  return (
    <div className="login-hero">
      <DjoppieHiveLogo variant="full" size="large" theme="light" />
      <h1>Welcome to Djoppie-Hive</h1>
      {/* ... login form */}
    </div>
  );
}
```

### With Theme Context
```tsx
import { DjoppieHiveLogo } from '@/components/Logo';
import { useTheme } from '@/context/ThemeContext';

function Header() {
  const { theme } = useTheme(); // 'light' | 'dark'

  return (
    <header>
      <DjoppieHiveLogo
        variant="full"
        size="medium"
        theme={theme}
      />
    </header>
  );
}
```

### Custom Styling
```tsx
import { DjoppieHiveLogo } from '@/components/Logo';
import styles from './MyComponent.module.css';

function MyComponent() {
  return (
    <div>
      <DjoppieHiveLogo
        variant="full"
        size="large"
        className={styles.myCustomLogo}
      />
    </div>
  );
}
```

```css
/* MyComponent.module.css */
.myCustomLogo {
  margin: 2rem auto;
  filter: drop-shadow(0 4px 12px rgba(245, 166, 35, 0.3));
}
```

## File Structure

```
Logo/
├── DjoppieHiveLogo.tsx           # Main component
├── DjoppieHiveLogo.module.css    # Styles
├── index.ts                      # Exports
└── README.md                     # This file
```

## Browser Support

- Modern browsers with SVG support
- CSS Modules support
- CSS custom properties (CSS variables)
- CSS gradients
- SVG filters

## Performance

- **No external dependencies**
- **Inline SVG**: No HTTP requests
- **CSS Modules**: Scoped styles, no conflicts
- **Lightweight**: ~4KB gzipped (component + styles)
- **Tree-shakeable**: Import only what you need

## Design Philosophy

The Djoppie-Hive logo embodies three core values:

1. **Warmth (Warmte)**: The golden robot with friendly eyes creates an approachable, human-centered feel
2. **Structure (Structuur)**: Hexagonal honeycomb patterns represent organized, systematic HR processes
3. **Reliability (Betrouwbaarheid)**: Professional typography and clean design convey trustworthiness for sensitive HR data

## Showcase

To view all variants and usage examples, see:
```
/src/pages/LogoShowcase.tsx
```

Run the showcase page to explore:
- All size variants
- Theme compatibility
- Background testing
- Usage guidelines
- Code examples

## License

Part of the Djoppie-Hive HR Administration system.
© 2026 Gemeente Diepenbeek
