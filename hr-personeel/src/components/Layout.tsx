import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Mail,
  Shield,
  CloudDownload,
  Menu,
  X,
  LogOut,
  User,
  MailCheck,
  Building2,
  Heart,
  RefreshCw,
  FileText,
  Wand2,
  Key,
  ChevronDown,
  UserCog,
  Boxes,
  Database,
  UserPlus,
  AppWindow,
  Laptop,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useUserRole } from '../context/UserRoleContext';
import { employeeValidatieApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import { DjoppieHiveLogo } from './Logo';
import type { Rol } from '../types';
import { rolLabels } from '../types';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredRoles?: Rol[];
  hasBadge?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Standalone dashboard item
const dashboardItem: NavItem = {
  to: '/',
  icon: LayoutDashboard,
  label: 'Dashboard',
};

// Grouped navigation structure
const menuGroups: MenuGroup[] = [
  {
    id: 'medewerkers',
    label: 'Medewerkers',
    icon: UserCog,
    defaultOpen: true,
    items: [
      { to: '/personeel', icon: Users, label: 'Personeelslijst' },
      { to: '/vrijwilligers', icon: Heart, label: 'Vrijwilligers' },
      {
        to: '/validatie',
        icon: ClipboardCheck,
        label: 'Validatie',
        requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'],
        hasBadge: true,
      },
      {
        to: '/onboarding',
        icon: UserPlus,
        label: 'On/Offboarding',
        requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'],
      },
    ],
  },
  {
    id: 'applicaties',
    label: 'Applicaties',
    icon: AppWindow,
    defaultOpen: true,
    items: [
      {
        to: '/applicaties',
        icon: AppWindow,
        label: 'Toegangsbeheer',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
    ],
  },
  {
    id: 'licenties',
    label: 'Licenties & Materiaal',
    icon: KeyRound,
    defaultOpen: false,
    items: [
      {
        to: '/licenties',
        icon: Key,
        label: 'Microsoft 365',
        requiredRoles: ['ict_super_admin'],
      },
      {
        to: '/materiaal',
        icon: Laptop,
        label: 'Materiaal',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
    ],
  },
  {
    id: 'rollen',
    label: 'Rollen & Rechten',
    icon: Shield,
    defaultOpen: false,
    items: [
      {
        to: '/rollen',
        icon: UserCheck,
        label: 'Gebruikersrollen',
        requiredRoles: ['ict_super_admin'],
      },
      {
        to: '/auto-roltoewijzing',
        icon: Wand2,
        label: 'Auto Roltoewijzing',
        requiredRoles: ['ict_super_admin'],
      },
      {
        to: '/functieprofielen',
        icon: ClipboardCheck,
        label: 'Functieprofielen',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
    ],
  },
  {
    id: 'organisatie',
    label: 'Organisatie',
    icon: Boxes,
    defaultOpen: false,
    items: [
      { to: '/sectoren', icon: Building2, label: 'Sectoren & Diensten' },
      { to: '/distributiegroepen', icon: MailCheck, label: 'Distributiegroepen' },
      {
        to: '/uitnodigingen',
        icon: Mail,
        label: 'Uitnodigingen',
        requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'],
      },
    ],
  },
  {
    id: 'systeem',
    label: 'Systeem',
    icon: Database,
    defaultOpen: false,
    items: [
      {
        to: '/sync',
        icon: RefreshCw,
        label: 'AD Sync',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
      {
        to: '/import',
        icon: CloudDownload,
        label: 'Import',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
      {
        to: '/audit',
        icon: FileText,
        label: 'Audit Log',
        requiredRoles: ['ict_super_admin', 'hr_admin'],
      },
    ],
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teValideren, setTeValideren] = useState(0);
  const { user, logout } = useAuth();
  const { hasAnyRole, getHighestRole } = useUserRole();
  const location = useLocation();

  // Initialize collapsed groups from localStorage or defaults
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('sidebar-collapsed-groups');
    if (stored) {
      return new Set(JSON.parse(stored));
    }
    // Initially collapse groups that have defaultOpen: false
    return new Set(
      menuGroups.filter(g => !g.defaultOpen).map(g => g.id)
    );
  });

  const handleLogout = () => {
    logout();
  };

  // Toggle group collapse state
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      // Persist to localStorage
      localStorage.setItem('sidebar-collapsed-groups', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Filter menu groups based on user role - only show groups with at least one visible item
  const visibleMenuGroups = useMemo(() => {
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!item.requiredRoles) return true;
          return hasAnyRole(...item.requiredRoles);
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [hasAnyRole]);

  // Get display label for user's highest role
  const userRoleLabel = useMemo(() => {
    const highestRole = getHighestRole();
    return highestRole ? rolLabels[highestRole] : 'Medewerker';
  }, [getHighestRole]);

  // Load validation count from API (backend filters by user's sector)
  useEffect(() => {
    const loadValidatieCount = async () => {
      try {
        const count = await employeeValidatieApi.getAantal();
        setTeValideren(count);
      } catch (error) {
        console.error('Failed to load validation count:', error);
      }
    };

    loadValidatieCount();

    // Refresh count every 30 seconds
    const interval = setInterval(loadValidatieCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <DjoppieHiveLogo
              size={sidebarOpen ? 'small' : 'xs'}
              theme="auto"
              showSubtitle={sidebarOpen}
            />
          </div>
          <div className="header-actions">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Sidebar inklappen' : 'Sidebar uitklappen'}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard - standalone item */}
          <NavLink
            to={dashboardItem.to}
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <dashboardItem.icon size={20} />
            {sidebarOpen && <span className="nav-label">{dashboardItem.label}</span>}
          </NavLink>

          {/* Menu groups with collapsible sections */}
          {visibleMenuGroups.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            const hasActiveItem = group.items.some(item =>
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))
            );

            return (
              <div key={group.id} className="nav-group">
                <button
                  className={`nav-group-header ${hasActiveItem ? 'has-active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  <div className="nav-group-header-content">
                    <group.icon size={18} className="nav-group-icon" />
                    {sidebarOpen && <span className="nav-group-label">{group.label}</span>}
                  </div>
                  {sidebarOpen && (
                    <ChevronDown
                      size={16}
                      className="nav-group-chevron"
                    />
                  )}
                </button>

                <div className={`nav-group-items ${isCollapsed ? 'collapsed' : ''}`}>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `nav-item nav-sub-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <item.icon size={18} />
                      {sidebarOpen && (
                        <span className="nav-label">
                          {item.label}
                          {item.hasBadge && teValideren > 0 && (
                            <span className="badge">{teValideren}</span>
                          )}
                        </span>
                      )}
                      {!sidebarOpen && item.hasBadge && teValideren > 0 && (
                        <span className="badge-dot" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                <User size={18} />
              </div>
              {sidebarOpen && (
                <div className="user-details">
                  <span className="user-name">{user?.name || 'Gebruiker'}</span>
                  <span className="user-role">{userRoleLabel}</span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button className="logout-btn" title="Afmelden" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            )}
          </div>
          <div className="theme-toggle-section">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
