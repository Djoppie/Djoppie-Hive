# Sidebar Navigation Design Documentation

## Overview
The Djoppie Hive HR Admin sidebar has been redesigned with a modern, grouped navigation structure that improves information hierarchy, usability, and visual appeal while maintaining the distinctive Hive branding.

## Navigation Structure

### Logical Grouping
The navigation is organized into 5 logical sections:

#### 1. Dashboard (Standalone)
- **Dashboard** - Always visible, quick access to overview

#### 2. Personeel (Personnel Management)
- **Personeelslijst** - Main employee list
- **Vrijwilligers** - Volunteers management
- **Validatie** - Validation requests (with badge indicator)

*Rationale:* Groups all employee-related data management in one section. The validation feature naturally belongs here as it validates personnel data.

#### 3. Organisatie (Organization Structure)
- **Sectoren** - Department/sector hierarchy
- **Distributiegroepen** - Distribution groups

*Rationale:* Organizational structure elements that define how the company is organized and how information flows.

#### 4. Beheer (Administration)
- **Uitnodigingen** - User invitations
- **Rollen & Rechten** - Roles and permissions
- **Auto Roltoewijzing** - Automatic role assignment
- **Licenties** - License management

*Rationale:* Administrative functions that control access, permissions, and system resources. These are typically used by ICT admins.

#### 5. Systeem (System Operations)
- **Sync Geschiedenis** - Synchronization history
- **AD Import** - Active Directory import
- **Audit Log** - System audit trail

*Rationale:* Technical system operations and monitoring tools primarily for ICT administrators.

## Design Features

### 1. Collapsible Menu Groups
- **Smooth animations** using CSS Grid and cubic-bezier easing
- **Persistent state** stored in localStorage
- **Default states** configured per group:
  - Personeel & Organisatie: Open by default (frequently accessed)
  - Beheer & Systeem: Collapsed by default (admin-focused)

### 2. Visual Hierarchy

#### Group Headers
- **Uppercase labels** with increased letter spacing for clear distinction
- **Outfit font** for headers (brand consistency)
- **Group icons** that represent the category
- **Animated chevron** rotates smoothly on collapse/expand
- **Active state indicator** when any child item is active
- **Hover effects** with honey-colored glow

#### Sub-items
- **Indented layout** (32px left padding) for clear parent-child relationship
- **Smaller icons** (18px) compared to main items
- **Subtle indicator dots** on hover and active states
- **Badge support** for notification counts (Validatie)

### 3. Animations & Micro-interactions

#### Group Toggle Animation
```css
transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```
- Smooth height animation using CSS Grid
- Easing curve provides natural, professional feel

#### Chevron Rotation
```css
transform: rotate(-90deg);
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```
- 90-degree rotation when collapsed
- Matches the expand/collapse animation timing

#### Hover States
- **Group headers**: Translate 2px to the right with honey glow
- **Sub-items**: Display indicator dot, scale icon
- **All items**: Smooth color transitions (0.3s)

#### Badge Animations
- **Pulse effect** on validation badge (2s cycle)
- **Badge dot** (collapsed state) with glow animation
- Red gradient background with drop shadow

### 4. Neumorphic Design Integration

The sidebar maintains the neumorphic (soft UI) aesthetic:

- **Soft shadows** on active items with inset highlights
- **Gradient backgrounds** using hive honey colors
- **Subtle borders** that respond to interaction
- **Layered effects** with pseudo-elements for depth

### 5. Collapsed Sidebar Support

When sidebar is collapsed:
- Group headers show only icons (centered)
- Sub-items are hidden entirely
- Chevron arrows hidden
- Badge indicator switches to dot style
- Dashboard separator line remains visible

### 6. Color System

#### Primary Colors (from Hive palette)
- `--hive-honey`: #F5A623 (primary accent)
- `--hive-gold`: #E8A524 (secondary accent)
- `--hive-deep-orange`: #E65100 (strong accent)
- `--hive-golden-glow`: rgba(245, 166, 35, 0.15) (soft highlight)

#### Application
- **Group labels**: Secondary text color, honey on hover/active
- **Active items**: Honey-to-orange gradient background
- **Hover states**: Golden glow overlay
- **Indicators**: Honey-colored dots with glow
- **Borders**: Semi-transparent honey color

### 7. Typography

- **Group headers**: Outfit, 11px, 600 weight, 0.8px letter-spacing, uppercase
- **Nav items**: DM Sans, 13px, 500 weight (600 when active)
- **Sub-items**: DM Sans, 12.5px, 500 weight

### 8. Accessibility Features

- **ARIA attributes**: `aria-expanded` on collapsible groups
- **Keyboard navigation**: Full keyboard support via native button/link elements
- **Focus indicators**: Maintained from base styles
- **Color contrast**: WCAG AA compliant
- **Semantic HTML**: Proper nav/button/link structure

## Implementation Details

### State Management

```typescript
// Collapsed groups tracked in Set for O(1) lookup
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(...)

// Persisted to localStorage
localStorage.setItem('sidebar-collapsed-groups', JSON.stringify([...newSet]))
```

### Role-Based Filtering

```typescript
// Filters groups AND items based on user roles
const visibleMenuGroups = useMemo(() => {
  return menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasAnyRole(...item.requiredRoles))
    }))
    .filter(group => group.items.length > 0);
}, [hasAnyRole]);
```

### Active State Detection

```typescript
// Highlights group header when any child is active
const hasActiveItem = group.items.some(item =>
  location.pathname === item.to ||
  (item.to !== '/' && location.pathname.startsWith(item.to))
);
```

## CSS Architecture

### Naming Convention
- `.nav-group` - Group container
- `.nav-group-header` - Clickable header button
- `.nav-group-items` - Collapsible items container
- `.nav-sub-item` - Individual navigation items within groups

### Performance Optimizations
- **GPU-accelerated animations**: transform and opacity
- **Containment**: Isolated layout calculations
- **Efficient selectors**: Low specificity, minimal nesting
- **Hardware acceleration**: will-change hints where needed

## Future Enhancements

### Potential Additions
1. **Search/Filter**: Quick filter for navigation items
2. **Favorites**: Pin frequently used items to top
3. **Keyboard shortcuts**: Hotkeys for common navigation
4. **Tooltips**: Enhanced descriptions in collapsed mode
5. **Custom ordering**: User-configurable group order
6. **Badge customization**: Different badge styles for different notification types

### Responsive Considerations
- Mobile devices automatically show collapsed sidebar
- Touch-friendly hit targets (minimum 44x44px)
- Swipe gestures could toggle sidebar
- Bottom navigation alternative for mobile

## Testing Checklist

- [ ] All menu items render correctly
- [ ] Groups collapse/expand smoothly
- [ ] State persists after page reload
- [ ] Role-based filtering works correctly
- [ ] Badge displays on Validatie item
- [ ] Active states highlight properly
- [ ] Hover effects work on all items
- [ ] Collapsed sidebar mode functions
- [ ] Keyboard navigation works
- [ ] Animations respect prefers-reduced-motion
- [ ] Dark theme colors are correct
- [ ] Logo/branding displays properly

## Design Rationale Summary

The new sidebar design achieves several key goals:

1. **Improved Scannability**: Group headers help users locate features faster
2. **Reduced Clutter**: Collapsible sections hide less-used admin features
3. **Better Information Architecture**: Logical grouping reflects user mental models
4. **Professional Aesthetic**: Neumorphic design with honey branding creates distinctive look
5. **Smooth Interactions**: Quality animations provide premium feel
6. **Accessibility**: Maintains keyboard and screen reader support
7. **Performance**: Optimized CSS animations maintain 60fps
8. **Flexibility**: Easy to add new items or groups as features expand

The design balances visual appeal with usability, creating a sidebar that is both beautiful and highly functional for daily HR administration tasks.
