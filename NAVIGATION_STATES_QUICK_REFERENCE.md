# Navigation States - Quick Visual Reference

## State Matrix

### Navigation Items (.nav-item)

| State | Background | Border | Text Color | Icon | Shadow | Animation |
|-------|-----------|--------|-----------|------|--------|-----------|
| **Default** | Transparent | 1px transparent | var(--text-sidebar) | Default | None | - |
| **Hover** | var(--bg-sidebar-hover) | 1px gold | var(--text-primary) | Dark red, scale 1.15, rotate -3deg | Gold glow + subtle depth | goldenPulse |
| **Active** | Dark red gradient | 2px gold | White | White + gold glow | Multi-layer (depth + glow + inset) | shimmer |
| **Focus** | As default/hover | As default | As default | As default | Gold outline ring | - |

### Group Headers (.nav-group-header)

| State | Background | Border | Text Color | Icon | Chevron | Animation |
|-------|-----------|--------|-----------|------|---------|-----------|
| **Default** | Transparent | 1px transparent | var(--text-secondary) | Opacity 0.8 | Opacity 0.6, down | - |
| **Hover** | var(--bg-sidebar-hover) | 1px dark red | Gold | Scale 1.15, rotate -5deg | Dark red, translate down | slideGlow, radialPulse |
| **Has Active** | Dark red gradient | 2px gold | White | White + gold glow | Gold + glow, down | iconBounce |
| **Collapsed** | As above | As above | As above | As above | Rotate -90deg | - |

### Sub-Items (.nav-sub-item)

| State | Dot Indicator | Background | Border | Icon | Shadow |
|-------|--------------|-----------|--------|------|--------|
| **Default** | Hidden (opacity 0) | Transparent | 1px transparent | Default | None |
| **Hover** | Dark red, 7px, glow | var(--bg-sidebar-hover) | 1px gold | Dark red, scaled | Gold glow |
| **Active** | Gold, 8px, pulsing glow | Dark red gradient | 2px gold | Gold + animated glow | Multi-layer + dotGlow |

### Badges

| Type | Size | Colors | Border | Shadow | Animation |
|------|------|--------|--------|--------|-----------|
| **Badge** | 22x16px min | Red gradient | 1px white 20% | Multi-layer red glow | badgePulse, badgeShimmer |
| **Badge Dot** | 9x9px | Red gradient | 2px card bg | Strong red glow | dotPulse |

---

## Color Quick Reference

### Gold Family (Accents)
```css
--hive-gold: #E8A524          /* Primary gold - borders, icons */
--hive-honey: #F5A623         /* Highlights, scrollbar */
--hive-amber: #D4920A         /* Gradient depth */
--hive-golden-glow: rgba(245, 166, 35, 0.15)  /* Hover backgrounds */
```

### Dark Red Family (Brand)
```css
--hive-dark-red: #8B2500      /* Active backgrounds (light theme) */
--hive-dark-red: #A83200      /* Active backgrounds (dark theme) */
#6B1A00                       /* Gradient end point */
```

### Shadow Presets

#### Gold Glow (Hover)
```css
box-shadow:
  0 0 16px rgba(232, 165, 36, 0.4),
  0 2px 8px rgba(139, 37, 0, 0.15),
  inset 0 0 20px rgba(245, 166, 35, 0.08);
```

#### Active Item Premium Shadow
```css
box-shadow:
  0 6px 20px rgba(139, 37, 0, 0.45),     /* Depth */
  0 0 20px rgba(232, 165, 36, 0.4),      /* Glow */
  inset 0 1px 0 rgba(255, 255, 255, 0.2), /* Top highlight */
  inset 0 -1px 0 rgba(0, 0, 0, 0.3);     /* Bottom shadow */
```

---

## Transition Timing

### Standard Easing
```css
transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
```
Creates a bouncy, premium feel with slight overshoot.

### Icon Transforms
```css
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```
Slightly longer for more pronounced playful movement.

---

## Animation Durations

| Animation | Duration | Loop | Purpose |
|-----------|----------|------|---------|
| goldenPulse | 2s | Infinite | Hover glow breathing |
| shimmer | 3s | Infinite | Active item luxury sweep |
| slideGlow | 2s | Infinite | Header hover background |
| radialPulse | 3s | Infinite | Header hover atmosphere |
| iconBounce | 2s | Infinite | Active header playfulness |
| dotGlow | 2s | Infinite | Sub-item connection pulse |
| iconGlow | 2.5s | Infinite | Active sub-item emphasis |
| badgePulse | 2.5s | Infinite | Badge attention |
| badgeShimmer | 3s | Infinite | Badge premium detail |
| dotPulse | 2s | Infinite | Notification dot |

---

## Spacing System

### Padding
- Nav item: `12px 14px` (vertical, horizontal)
- Hover state: `12px 18px` (shifts left padding)
- Group header: `10px 12px`
- Sub-item base: `32px` left (for indentation)

### Gaps
- Icon to label: `14px`
- Group header content: `10px`
- Group margin bottom: `8px`
- Sub-item margin top: `4px`
- Sub-item margin left: `8px`

### Icon Sizes
- Dashboard: `20px`
- Group icons: `18px`
- Sub-item icons: `18px`
- Chevron: `16px`

---

## Interactive Transform Values

### Hover Effects
```css
/* Nav item hover */
transform: translateY(-1px);
padding-left: 18px;  /* from 14px */

/* Icon hover */
transform: scale(1.15) rotate(-3deg);

/* Group header hover */
transform: translateX(3px);

/* Group icon hover */
transform: scale(1.15) rotate(-5deg);

/* Chevron hover */
transform: translateY(2px);  /* when expanded */
transform: rotate(-90deg) translateX(2px);  /* when collapsed */
```

### Active State Indicators
```css
/* Sub-item dot scale */
transform: translateY(-50%) scale(1.6);

/* Icon animations bounce */
transform: translateY(-2px);  /* at peak */
```

---

## Accessibility Overrides

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations removed */
  animation: none !important;

  /* Fast transitions */
  transition-duration: 0.1s !important;

  /* No movement transforms */
  transform: none !important;

  /* Minimal scale only */
  .icon:hover { transform: scale(1.05) !important; }
}
```

### Focus Visible
```css
outline: 3px solid var(--hive-gold);
outline-offset: 2px;
box-shadow:
  0 0 0 3px rgba(232, 165, 36, 0.3),
  0 0 20px rgba(232, 165, 36, 0.4);
```

### High Contrast
```css
@media (prefers-contrast: high) {
  /* Thicker borders */
  border-width: 2px;  /* default items */
  border-width: 3px;  /* active items */
}
```

---

## Component Class Reference

### Primary Classes
- `.nav-item` - Main navigation link
- `.nav-item.active` - Currently active page
- `.nav-group` - Collapsible section container
- `.nav-group-header` - Group header button
- `.nav-group-header.has-active` - Header with active child
- `.nav-group-header.collapsed` - Collapsed group
- `.nav-group-items` - Container for group children
- `.nav-group-items.collapsed` - Hidden children
- `.nav-sub-item` - Child navigation item
- `.nav-sub-item.active` - Active child item

### Supporting Classes
- `.nav-label` - Text label wrapper
- `.nav-group-icon` - Group icon element
- `.nav-group-chevron` - Expand/collapse indicator
- `.badge` - Notification counter
- `.badge-dot` - Collapsed notification indicator

### State Modifiers
- `.collapsed` - Applied to collapsed groups/sidebar
- `.active` - Applied to current page items
- `.has-active` - Applied to parents of active items
- `:hover` - Mouse hover state
- `:focus-visible` - Keyboard focus state

---

## Quick Copy-Paste Snippets

### Custom Golden Border on Element
```css
border: 2px solid var(--hive-gold);
box-shadow: 0 0 20px rgba(232, 165, 36, 0.4);
```

### Premium Shadow Stack
```css
box-shadow:
  0 6px 20px rgba(139, 37, 0, 0.45),
  0 0 20px rgba(232, 165, 36, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.2),
  inset 0 -1px 0 rgba(0, 0, 0, 0.3);
```

### Dark Red to Deep Red Gradient
```css
background: linear-gradient(135deg, var(--hive-dark-red) 0%, #6B1A00 100%);
```

### Bouncy Transition
```css
transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Golden Drop Shadow on Icon
```css
filter: drop-shadow(0 0 8px rgba(232, 165, 36, 0.8))
        drop-shadow(0 2px 4px rgba(139, 37, 0, 0.3));
```

### Pulsing Glow Animation
```css
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(232, 165, 36, 0.8);
  }
  50% {
    box-shadow: 0 0 20px rgba(232, 165, 36, 1);
  }
}
animation: glow 2s ease-in-out infinite;
```

---

## Browser DevTools Inspection Tips

1. **Find active animations:** Filter Elements by `.nav-item.active` or `.badge`
2. **Test reduced motion:** DevTools > Rendering > Emulate CSS media prefers-reduced-motion
3. **Test focus states:** Use Tab key or DevTools > Accessibility > Show tabbing order
4. **View pseudo-elements:** Computed > Filter `:before` or `:after`
5. **Performance:** Performance tab > Record > Interact > Check for 60fps
6. **Layer visualization:** Rendering > Layer borders (shows GPU acceleration)

---

## Common Customizations

### Change Animation Speed
Find animation name, adjust duration:
```css
/* Current */
animation: shimmer 3s ease-in-out infinite;

/* Faster */
animation: shimmer 1.5s ease-in-out infinite;

/* Slower */
animation: shimmer 5s ease-in-out infinite;
```

### Adjust Glow Intensity
Modify rgba opacity values:
```css
/* Subtle */
box-shadow: 0 0 12px rgba(232, 165, 36, 0.2);

/* Standard */
box-shadow: 0 0 12px rgba(232, 165, 36, 0.4);

/* Intense */
box-shadow: 0 0 12px rgba(232, 165, 36, 0.8);
```

### Modify Hover Movement Distance
```css
/* Subtle */
transform: translateX(2px);

/* Standard */
transform: translateX(3px);

/* Pronounced */
transform: translateX(5px);
```

---

This quick reference provides instant access to all key navigation styling values and patterns for rapid development and customization.
