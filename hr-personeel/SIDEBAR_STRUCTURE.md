# Sidebar Navigation Structure

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│  🐝 Djoppie Hive                    │  ← Logo & Branding
│     HR Admin Portal                 │
│  [🌙] [≡]                           │  ← Theme Toggle & Collapse
├─────────────────────────────────────┤
│                                     │
│  📊 Dashboard                       │  ← Standalone Item
│  ─────────────────────────────      │  ← Separator
│                                     │
│  👥 PERSONEEL            [▼]        │  ← Group Header (Expanded)
│    • Personeelslijst                │
│    • Vrijwilligers                  │
│    • Validatie                [5]   │  ← Badge indicator
│                                     │
│  📦 ORGANISATIE          [▼]        │  ← Group Header (Expanded)
│    • Sectoren                       │
│    • Distributiegroepen             │
│                                     │
│  ⚙️ BEHEER               [▶]        │  ← Group Header (Collapsed)
│                                     │
│  💾 SYSTEEM              [▶]        │  ← Group Header (Collapsed)
│                                     │
├─────────────────────────────────────┤
│  [JW] Jan Willem         [↗]       │  ← User Info & Logout
│      ICT Super Admin                │
└─────────────────────────────────────┘
```

## Expanded View (All Groups Open)

```
┌─────────────────────────────────────┐
│  🐝 Djoppie Hive                    │
│     HR Admin Portal                 │
│  [🌙] [≡]                           │
├─────────────────────────────────────┤
│                                     │
│  📊 Dashboard                       │
│  ─────────────────────────────      │
│                                     │
│  👥 PERSONEEL            [▼]        │
│    ◦ Personeelslijst                │
│    ◦ Vrijwilligers                  │
│    ◦ Validatie                [5]   │
│                                     │
│  📦 ORGANISATIE          [▼]        │
│    ◦ Sectoren                       │
│    ◦ Distributiegroepen             │
│                                     │
│  ⚙️ BEHEER               [▼]        │
│    ◦ Uitnodigingen                  │
│    ◦ Rollen & Rechten               │
│    ◦ Auto Roltoewijzing             │
│    ◦ Licenties                      │
│                                     │
│  💾 SYSTEEM              [▼]        │
│    ◦ Sync Geschiedenis              │
│    ◦ AD Import                      │
│    ◦ Audit Log                      │
│                                     │
├─────────────────────────────────────┤
│  [JW] Jan Willem         [↗]       │
│      ICT Super Admin                │
└─────────────────────────────────────┘
```

## Collapsed Sidebar View

```
┌──────┐
│  🐝  │
│      │
│ [🌙] │
│ [≡]  │
├──────┤
│      │
│  📊  │
│  ──  │
│      │
│  👥  │
│      │
│  📦  │
│      │
│  ⚙️  │
│      │
│  💾  │
│      │
│      │
│      │
│      │
├──────┤
│ [JW] │
└──────┘
```

## Menu Item States

### Default State
```
  • Item Name
```
- Gray text color
- Transparent background
- Subtle icon

### Hover State
```
  › Item Name ───────>
```
- Honey color text
- Soft background glow
- Scaled icon (110%)
- Translated right 2px (groups) or 4px (items)
- Honey-colored border

### Active State
```
  ● Item Name
```
- White text on honey gradient
- Bright glow shadow
- Bold font weight
- Left indicator dot (sub-items)

### Badge Indicator
```
  • Validatie        [5]
```
- Red gradient background
- White text
- Pulse animation
- Glow shadow

## Color Palette Reference

### Honey/Orange Tones
- **Hive Honey**: `#F5A623` - Primary accent
- **Hive Gold**: `#E8A524` - Secondary accent
- **Deep Orange**: `#E65100` - Strong accent
- **Golden Glow**: `rgba(245, 166, 35, 0.15)` - Hover overlay

### Functional Colors
- **Active Gradient**: Honey → Deep Orange
- **Badge**: Red gradient (#ef4444 → #dc2626)
- **Borders**: Semi-transparent honey
- **Text**: Honey for active/hover states

## Interaction Patterns

### Group Toggle
1. Click group header
2. Chevron rotates 90° smoothly
3. Items animate in/out using height transition
4. State persists to localStorage

### Navigation
1. Click any item
2. Active state highlights with gradient
3. Parent group header shows "has-active" state
4. Previous active item returns to default

### Collapse Sidebar
1. Click collapse button in header
2. Sidebar width animates to minimal
3. Text labels fade out
4. Icons center align
5. Group items hide completely
6. Badge switches to dot indicator

## Responsive Behavior

### Desktop (> 1024px)
- Sidebar open by default
- Full labels visible
- All animations enabled

### Tablet (768px - 1024px)
- Sidebar collapsed by default
- Can be toggled open
- Overlays content when open

### Mobile (< 768px)
- Sidebar as slide-out drawer
- Touch-optimized hit targets
- Swipe gestures supported

## Accessibility Features

### Keyboard Navigation
- `Tab` - Navigate through items
- `Enter/Space` - Activate item or toggle group
- `Escape` - Close sidebar (mobile)
- Focus indicators on all interactive elements

### Screen Readers
- Semantic HTML structure
- ARIA labels on buttons
- `aria-expanded` on collapsible groups
- `aria-current="page"` on active links

### Motion Preferences
- All animations respect `prefers-reduced-motion`
- Instant state changes when motion is reduced
- No loss of functionality

## Icon Set

Using Lucide React icons for consistency:

| Category | Icon |
|----------|------|
| Dashboard | `LayoutDashboard` |
| Personeel Group | `UserCog` |
| Organisatie Group | `Boxes` |
| Beheer Group | `Settings` |
| Systeem Group | `Database` |
| Personeelslijst | `Users` |
| Vrijwilligers | `Heart` |
| Validatie | `ClipboardCheck` |
| Sectoren | `Building2` |
| Distributiegroepen | `MailCheck` |
| Uitnodigingen | `Mail` |
| Rollen | `Shield` |
| Auto Roltoewijzing | `Wand2` |
| Licenties | `Key` |
| Sync | `RefreshCw` |
| AD Import | `CloudDownload` |
| Audit Log | `FileText` |
| Chevron | `ChevronDown` |

## Performance Metrics

### Animation Performance
- 60 FPS on all transitions
- GPU-accelerated transforms
- Minimal repaints/reflows
- < 300ms for all animations

### Bundle Impact
- Minimal CSS addition (~2KB gzipped)
- No additional JavaScript dependencies
- Icons tree-shaken by bundler
- LocalStorage for state persistence only
