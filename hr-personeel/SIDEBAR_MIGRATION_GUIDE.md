# Sidebar Navigation Migration Guide

## Changes Overview

The sidebar navigation has been refactored from a flat list to a grouped, collapsible menu structure. This guide helps you understand the changes and how to work with the new system.

## What Changed

### Before (Flat Navigation)
```typescript
const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/personeel', icon: Users, label: 'Personeelslijst' },
  { to: '/validatie', icon: ClipboardCheck, label: 'Validatie' },
  // ... more items
];
```

### After (Grouped Navigation)
```typescript
const dashboardItem: NavItem = {
  to: '/', icon: LayoutDashboard, label: 'Dashboard'
};

const menuGroups: MenuGroup[] = [
  {
    id: 'personeel',
    label: 'Personeel',
    icon: UserCog,
    defaultOpen: true,
    items: [
      { to: '/personeel', icon: Users, label: 'Personeelslijst' },
      { to: '/validatie', icon: ClipboardCheck, label: 'Validatie', hasBadge: true },
      // ... more items
    ]
  },
  // ... more groups
];
```

## Adding New Menu Items

### Step 1: Determine the Group
Decide which logical group your new item belongs to:
- **Personeel**: Employee/volunteer management
- **Organisatie**: Organization structure
- **Beheer**: Administrative functions
- **Systeem**: System operations

### Step 2: Add the Item
Add your item to the appropriate group in `Layout.tsx`:

```typescript
{
  id: 'personeel',
  label: 'Personeel',
  icon: UserCog,
  defaultOpen: true,
  items: [
    // ... existing items
    {
      to: '/new-feature',
      icon: NewIcon,
      label: 'New Feature',
      requiredRoles: ['ict_super_admin'], // optional
      hasBadge: false, // optional
    },
  ],
}
```

### Step 3: Import the Icon
```typescript
import {
  // ... existing imports
  NewIcon,
} from 'lucide-react';
```

### Step 4: Add the Route
Don't forget to add the corresponding route in `App.tsx`:

```typescript
<Route path="/new-feature" element={<NewFeature />} />
```

## Creating a New Menu Group

If you need to add an entirely new category:

### Step 1: Define the Group
```typescript
const menuGroups: MenuGroup[] = [
  // ... existing groups
  {
    id: 'reporting',           // Unique ID
    label: 'Rapportage',       // Display name
    icon: BarChart3,           // Group icon
    defaultOpen: false,        // Initially collapsed
    items: [
      {
        to: '/reports/monthly',
        icon: Calendar,
        label: 'Maandrapport',
      },
      {
        to: '/reports/annual',
        icon: FileSpreadsheet,
        label: 'Jaarrapport',
      },
    ],
  },
];
```

### Step 2: Choose Appropriate Icons

Pick icons that represent your group and items from [Lucide Icons](https://lucide.dev/icons/):

**Good Group Icons:**
- Data-related: `Database`, `HardDrive`, `Server`
- Reports: `BarChart3`, `PieChart`, `TrendingUp`
- Settings: `Settings`, `Sliders`, `Wrench`
- Communication: `MessageSquare`, `Bell`, `Send`

**Icon Selection Tips:**
- Use solid, filled icons for active states
- Maintain visual weight consistency (all icons ~same thickness)
- Prefer simple, recognizable symbols

## Adding Badge Indicators

Badges show notification counts on menu items:

### Step 1: Mark Item as Having a Badge
```typescript
{
  to: '/notifications',
  icon: Bell,
  label: 'Notificaties',
  hasBadge: true,  // Enable badge support
}
```

### Step 2: Update the Component Logic
In `Layout.tsx`, add your count logic:

```typescript
const [notificationCount, setNotificationCount] = useState(0);

// Load count from API
useEffect(() => {
  const loadCount = async () => {
    const count = await notificatiesApi.getAantal();
    setNotificationCount(count);
  };
  loadCount();
  const interval = setInterval(loadCount, 30000);
  return () => clearInterval(interval);
}, []);
```

### Step 3: Display the Badge
Update the JSX where badges are rendered:

```typescript
{item.hasBadge && (
  <>
    {item.to === '/validatie' && teValideren > 0 && (
      <span className="badge">{teValideren}</span>
    )}
    {item.to === '/notifications' && notificationCount > 0 && (
      <span className="badge">{notificationCount}</span>
    )}
  </>
)}
```

## Configuring Default Open/Closed State

Control which groups are expanded by default:

```typescript
{
  id: 'systeem',
  label: 'Systeem',
  icon: Database,
  defaultOpen: false,  // Collapsed by default (admin/advanced features)
  items: [...]
}

{
  id: 'personeel',
  label: 'Personeel',
  icon: UserCog,
  defaultOpen: true,   // Open by default (frequently used)
  items: [...]
}
```

**Guidelines:**
- `defaultOpen: true` → Frequently accessed features
- `defaultOpen: false` → Admin tools, advanced settings

User preferences are saved to localStorage and will override defaults after first interaction.

## Role-Based Access Control

### Item-Level Restrictions
```typescript
{
  to: '/admin-panel',
  icon: Shield,
  label: 'Admin Panel',
  requiredRoles: ['ict_super_admin'], // Only ICT admins see this
}
```

### Multiple Allowed Roles
```typescript
{
  to: '/validatie',
  icon: ClipboardCheck,
  label: 'Validatie',
  requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager'], // Any of these
}
```

### Group Visibility
Groups automatically hide if all items are filtered out by role restrictions. No need to add group-level role checks.

## Customizing Styles

### Changing Group Header Colors
In `index.css`:

```css
.nav-group-header {
  color: var(--your-custom-color);
}

.nav-group-header:hover {
  color: var(--your-hover-color);
  background: var(--your-bg-color);
}
```

### Adjusting Animation Speed
```css
.nav-group-items {
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Change 0.3s to your preferred duration */
}

.nav-group-chevron {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Match the duration above */
}
```

### Changing Indent Level
```css
.nav-sub-item {
  padding-left: 32px !important; /* Adjust this value */
}
```

## Troubleshooting

### Issue: Group won't expand/collapse
**Solution:** Check that the group ID is unique and matches the state management:
```typescript
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
  // Ensure your group ID is in this logic
});
```

### Issue: Icons not showing
**Solution:** Verify the icon is imported from lucide-react:
```typescript
import { YourIcon } from 'lucide-react';
```

### Issue: Item not visible despite being added
**Solution:** Check role restrictions:
```typescript
// Remove requiredRoles temporarily to test
{ to: '/test', icon: TestIcon, label: 'Test' }
```

### Issue: Badge not appearing
**Solution:** Ensure three things:
1. `hasBadge: true` on the item
2. Count state is populated
3. JSX checks for correct path and count > 0

### Issue: Animation looks choppy
**Solution:** Ensure GPU acceleration:
```css
.nav-group-items {
  will-change: grid-template-rows;
}
```

## Best Practices

### 1. Keep Groups Focused
Each group should have a clear, single purpose. Don't mix unrelated features.

**Good:**
- Personeel: All employee-related management
- Systeem: All system operations

**Bad:**
- Mixed: Employees, Reports, and Settings in one group

### 2. Limit Group Size
Aim for 3-6 items per group. Too many items defeats the purpose of grouping.

**Too many items?** Consider splitting into two groups:
```typescript
// Instead of one "Rapportage" group with 10 items:
{ id: 'rapportage-hr', label: 'HR Rapporten', items: [/*5 items*/] }
{ id: 'rapportage-financieel', label: 'Financiële Rapporten', items: [/*5 items*/] }
```

### 3. Logical Ordering
Order items within groups by:
1. **Frequency of use** (most used first)
2. **Workflow order** (if items are used in sequence)
3. **Alphabetically** (as last resort)

### 4. Consistent Icon Style
All icons should feel cohesive:
- Same visual weight (stroke width)
- Same level of detail
- Same style (outlined vs. filled)

### 5. Performance Considerations
- Don't add expensive operations in render loops
- Memoize filtered groups with `useMemo`
- Debounce API calls for badge counts
- Use `localStorage` for persistence, not repeated API calls

## Migration Checklist

If migrating from old sidebar code:

- [ ] Move all navigation items into appropriate groups
- [ ] Update icon imports to include group icons
- [ ] Test role-based filtering still works
- [ ] Verify badge indicators appear correctly
- [ ] Check all routes are still registered in App.tsx
- [ ] Test collapsed sidebar mode
- [ ] Verify localStorage state persistence works
- [ ] Test keyboard navigation
- [ ] Ensure dark theme colors are correct
- [ ] Check mobile responsive behavior

## Examples from Real Implementation

### Example 1: Personnel Group (Most Common)
```typescript
{
  id: 'personeel',
  label: 'Personeel',
  icon: UserCog,
  defaultOpen: true, // Frequently used
  items: [
    { to: '/personeel', icon: Users, label: 'Personeelslijst' },
    { to: '/vrijwilligers', icon: Heart, label: 'Vrijwilligers' },
    {
      to: '/validatie',
      icon: ClipboardCheck,
      label: 'Validatie',
      requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'],
      hasBadge: true, // Shows pending validations
    },
  ],
}
```

### Example 2: Admin Group (Restricted Access)
```typescript
{
  id: 'beheer',
  label: 'Beheer',
  icon: Settings,
  defaultOpen: false, // Collapsed by default (admin features)
  items: [
    {
      to: '/rollen',
      icon: Shield,
      label: 'Rollen & Rechten',
      requiredRoles: ['ict_super_admin'], // Only super admins
    },
    {
      to: '/licenties',
      icon: Key,
      label: 'Licenties',
      requiredRoles: ['ict_super_admin'],
    },
  ],
}
```

## Future Enhancement Ideas

Ideas for extending the sidebar functionality:

1. **Search/Filter**: Add search bar to filter items
2. **Favorites**: Star items to pin them to top
3. **Recently Accessed**: Show last 3 visited pages
4. **Keyboard Shortcuts**: Alt+1 for Dashboard, etc.
5. **Custom Ordering**: Drag-and-drop group reordering
6. **Nested Groups**: Sub-groups within groups
7. **Tooltips**: Enhanced descriptions on hover
8. **Mini Mode**: Ultra-compact icon-only mode
9. **Quick Actions**: Right-click context menu
10. **Analytics**: Track which items are used most

## Support

For questions or issues with the sidebar implementation:

1. Check this guide first
2. Review `SIDEBAR_DESIGN.md` for design rationale
3. Review `SIDEBAR_STRUCTURE.md` for visual reference
4. Check the Layout.tsx component code
5. Inspect the CSS in index.css (search for `.nav-group`)

Remember: The sidebar is designed to be flexible and maintainable. When in doubt, follow the existing patterns!
