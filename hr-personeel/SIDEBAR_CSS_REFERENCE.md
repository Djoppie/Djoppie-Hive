# Sidebar CSS Class Reference

## Quick Reference Guide

This document provides a quick reference for all CSS classes used in the sidebar navigation system.

## Component Hierarchy

```
.sidebar
├── .sidebar-header
│   ├── .logo-section
│   └── .header-actions
│       ├── .theme-toggle
│       └── .sidebar-toggle
│
├── .sidebar-nav
│   ├── .nav-item (Dashboard - standalone)
│   │
│   └── .nav-group (Repeating groups)
│       ├── .nav-group-header
│       │   ├── .nav-group-header-content
│       │   │   ├── .nav-group-icon
│       │   │   └── .nav-group-label
│       │   └── .nav-group-chevron
│       │
│       └── .nav-group-items
│           └── .nav-item.nav-sub-item (Multiple items)
│               ├── svg (icon)
│               ├── .nav-label
│               ├── .badge (optional)
│               └── .badge-dot (optional, collapsed mode)
│
└── .sidebar-footer
    └── .user-section
        ├── .user-info
        │   ├── .user-avatar
        │   └── .user-details
        │       ├── .user-name
        │       └── .user-role
        └── .logout-btn
```

## Core Container Classes

### `.sidebar`
Main sidebar container

**States:**
- `.sidebar.open` - Sidebar expanded (default desktop)
- `.sidebar.collapsed` - Sidebar minimized to icon-only

**Key Properties:**
```css
width: 260px;
background: var(--bg-sidebar);
border-right: 1px solid var(--border-color);
transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### `.sidebar-header`
Top section with logo and controls

**Key Properties:**
```css
padding: 20px 16px;
display: flex;
justify-content: space-between;
border-bottom: 1px solid var(--border-color-light);
```

### `.sidebar-nav`
Scrollable navigation container

**Key Properties:**
```css
flex: 1;
overflow-y: auto;
padding: 16px 10px;
gap: 4px;
```

**Scrollbar Styling:**
```css
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--hive-honey);
}
```

### `.sidebar-footer`
Bottom section with user info

**Key Properties:**
```css
padding: 16px;
border-top: 1px solid var(--border-color-light);
```

## Navigation Item Classes

### `.nav-item`
Individual navigation link (Dashboard + all sub-items)

**States:**
- `.nav-item.active` - Currently selected page
- `.nav-item:hover` - Mouse over state

**Key Properties:**
```css
display: flex;
align-items: center;
gap: 14px;
padding: 12px 14px;
border-radius: var(--border-radius);
font-size: 13px;
transition: all 0.2s ease;
```

**Hover Effect:**
```css
.nav-item:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-primary);
  border-color: rgba(245, 166, 35, 0.2);
  padding-left: 18px; /* Slides right */
}
```

**Active State:**
```css
.nav-item.active {
  background: linear-gradient(135deg, var(--hive-honey) 0%, var(--hive-deep-orange) 100%);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(245, 166, 35, 0.35);
}
```

### `.nav-sub-item`
Navigation items within groups (combined with `.nav-item`)

**Key Properties:**
```css
margin-left: 8px;
padding-left: 32px !important; /* Indentation */
font-size: 12.5px;
```

**Indicator Dot:**
```css
.nav-sub-item::before {
  content: '';
  position: absolute;
  left: 12px;
  width: 4px;
  height: 4px;
  background: var(--hive-honey);
  border-radius: 50%;
  opacity: 0;
}

.nav-sub-item:hover::before,
.nav-sub-item.active::before {
  opacity: 1;
}
```

### `.nav-label`
Text label within navigation items

**Key Properties:**
```css
display: flex;
align-items: center;
gap: 10px;
white-space: nowrap;
```

## Group Classes

### `.nav-group`
Container for a collapsible group

**Key Properties:**
```css
display: flex;
flex-direction: column;
margin-bottom: 8px;
```

### `.nav-group-header`
Clickable group header button

**States:**
- `.nav-group-header.has-active` - Contains active child item
- `.nav-group-header.collapsed` - Group is collapsed
- `.nav-group-header:hover` - Mouse over state

**Key Properties:**
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 10px 12px;
font-family: 'Outfit', sans-serif;
font-size: 11px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.8px;
cursor: pointer;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**Hover Effect with Glow:**
```css
.nav-group-header::before {
  /* Gradient overlay */
  background: linear-gradient(135deg, var(--hive-golden-glow) 0%, transparent 100%);
  opacity: 0;
}

.nav-group-header::after {
  /* Honeycomb pattern */
  background-image:
    radial-gradient(circle at 20% 50%, var(--hive-golden-glow) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, var(--hive-golden-glow) 0%, transparent 50%);
  opacity: 0;
}

.nav-group-header:hover::before,
.nav-group-header:hover::after {
  opacity: 1;
}

.nav-group-header:hover {
  color: var(--hive-honey);
  transform: translateX(2px);
}
```

**Active State:**
```css
.nav-group-header.has-active {
  color: var(--hive-honey);
  border-color: rgba(245, 166, 35, 0.25);
  background: var(--bg-sidebar-hover);
}
```

### `.nav-group-header-content`
Inner wrapper for icon and label

**Key Properties:**
```css
display: flex;
align-items: center;
gap: 10px;
position: relative;
z-index: 1; /* Above pseudo-elements */
```

### `.nav-group-icon`
Icon in group header

**Key Properties:**
```css
flex-shrink: 0;
opacity: 0.8;
transition: all 0.25s ease;
```

**Hover:**
```css
.nav-group-header:hover .nav-group-icon {
  opacity: 1;
  transform: scale(1.1);
}
```

### `.nav-group-label`
Text label in group header

**Key Properties:**
```css
white-space: nowrap;
```

### `.nav-group-chevron`
Expand/collapse indicator

**Key Properties:**
```css
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
opacity: 0.6;
flex-shrink: 0;
```

**Collapsed State:**
```css
.nav-group-header.collapsed .nav-group-chevron {
  transform: rotate(-90deg);
}
```

**Hover:**
```css
.nav-group-header:hover .nav-group-chevron {
  opacity: 1;
  color: var(--hive-honey);
}
```

### `.nav-group-items`
Container for collapsible group items

**Key Properties:**
```css
display: grid;
grid-template-rows: 1fr;
transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
overflow: hidden;
```

**Collapsed State:**
```css
.nav-group-items.collapsed {
  grid-template-rows: 0fr;
}
```

**Why Grid?** Grid allows smooth height animations without knowing exact pixel height.

## Badge Classes

### `.badge`
Notification count badge (expanded sidebar)

**Key Properties:**
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
color: #fff;
font-size: 10px;
font-weight: 700;
padding: 2px 7px;
border-radius: 10px;
min-width: 20px;
box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
animation: badgePulse 2s ease-in-out infinite;
```

**Animation:**
```css
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### `.badge-dot`
Notification dot indicator (collapsed sidebar)

**Key Properties:**
```css
position: absolute;
top: 8px;
right: 8px;
width: 8px;
height: 8px;
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
border-radius: 50%;
box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
animation: dotPulse 1.5s ease-in-out infinite;
```

**Animation:**
```css
@keyframes dotPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
  50% { opacity: 0.7; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); }
}
```

## User Section Classes

### `.user-section`
User info container in footer

**Key Properties:**
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 10px 12px;
background: var(--color-primary-bg);
border-radius: var(--border-radius);
```

### `.user-info`
User avatar and details wrapper

**Key Properties:**
```css
display: flex;
align-items: center;
gap: 12px;
```

### `.user-avatar`
User avatar icon container

**Key Properties:**
```css
width: 36px;
height: 36px;
border-radius: 50%;
background: linear-gradient(135deg, var(--hive-honey) 0%, var(--hive-deep-orange) 100%);
display: flex;
align-items: center;
justify-content: center;
```

### `.user-details`
User name and role container

**Key Properties:**
```css
display: flex;
flex-direction: column;
gap: 2px;
```

### `.user-name`
User display name

**Key Properties:**
```css
font-size: 13px;
font-weight: 600;
color: var(--text-primary);
```

### `.user-role`
User role label

**Key Properties:**
```css
font-size: 11px;
color: var(--text-secondary);
```

### `.logout-btn`
Logout button

**Key Properties:**
```css
padding: 8px;
border-radius: var(--border-radius);
background: transparent;
color: var(--hive-deep-orange);
cursor: pointer;
transition: all 0.2s ease;
```

**Hover:**
```css
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}
```

## Collapsed Sidebar Modifiers

All collapsed sidebar styles use the `.sidebar.collapsed` parent selector:

### Header
```css
.sidebar.collapsed .sidebar-header {
  flex-direction: column;
  padding: 12px;
}
```

### Navigation
```css
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .nav-sub-item {
  justify-content: center;
  padding: 12px !important;
  margin-left: 0;
}
```

### Groups
```css
.sidebar.collapsed .nav-group-header {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .nav-group-items {
  display: none; /* Hide all sub-items */
}
```

### Main Content Adjustment
```css
.sidebar.collapsed ~ .main-content {
  margin-left: 60px; /* Adjust content area */
}
```

## Special Features

### Dashboard Separator
```css
.sidebar-nav > .nav-item:first-child::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--border-color-light) 50%,
    transparent 100%
  );
}
```

### Sticky Positioning (if needed)
```css
.sidebar-header,
.sidebar-footer {
  position: sticky;
  top: 0; /* Header */
  bottom: 0; /* Footer */
  z-index: 10;
}
```

## CSS Variables Used

### Color Variables
```css
--hive-honey: #F5A623
--hive-gold: #E8A524
--hive-deep-orange: #E65100
--hive-golden-glow: rgba(245, 166, 35, 0.15)
```

### Background Variables
```css
--bg-sidebar: (theme-dependent)
--bg-sidebar-hover: (theme-dependent)
--color-primary-bg: (theme-dependent)
```

### Text Variables
```css
--text-primary: (theme-dependent)
--text-secondary: (theme-dependent)
--text-sidebar: (theme-dependent)
```

### Border Variables
```css
--border-color: (theme-dependent)
--border-color-light: (theme-dependent)
--border-radius: 8px
```

## Customization Examples

### Change Group Header Color
```css
.nav-group-header {
  color: #your-color;
}

.nav-group-header:hover {
  color: var(--hive-honey); /* Or your color */
}
```

### Adjust Animation Speed
```css
.nav-group-items {
  transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  /* Changed from 0.3s to 0.5s */
}

.nav-group-chevron {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  /* Match the duration */
}
```

### Change Indent Level
```css
.nav-sub-item {
  padding-left: 40px !important;
  /* Changed from 32px */
}

.nav-sub-item::before {
  left: 16px;
  /* Adjust dot position accordingly */
}
```

### Custom Badge Color
```css
.badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  /* Blue instead of red */
}
```

### Add Group Dividers
```css
.nav-group:not(:last-child)::after {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--border-color-light) 50%,
    transparent 100%
  );
  margin: 12px 0;
}
```

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 60px; /* Collapsed by default */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .sidebar {
    width: 260px; /* Expanded by default */
  }
}
```

## Debug Classes (Add if needed)

```css
/* Visual debugging */
.nav-group {
  outline: 1px solid red; /* See group boundaries */
}

.nav-group-items {
  outline: 1px solid blue; /* See items container */
}

/* Log state changes */
.nav-group-header.collapsed::before {
  content: 'COLLAPSED';
  position: absolute;
  top: 0;
  right: 0;
  background: red;
  color: white;
  padding: 2px 4px;
  font-size: 8px;
}
```

## Performance Tips

### Use `will-change` sparingly
```css
.nav-group-chevron {
  will-change: transform;
}

/* Remove after animation completes */
.nav-group-chevron:not(:hover) {
  will-change: auto;
}
```

### GPU Acceleration
```css
/* Triggers GPU acceleration */
.nav-item {
  transform: translateZ(0);
}
```

### Contain Layout
```css
.nav-group {
  contain: layout style;
}
```

---

**Last Updated**: 2026-02-27
**CSS Location**: `src/index.css` (lines ~500-680)
**Related Components**: `src/components/Layout.tsx`
