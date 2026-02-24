import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
} from 'lucide-react';
import diepenbeekLogo from '../assets/diepenbeek-logo.svg';
import { useAuth } from '../auth/AuthProvider';
import { useUserRole } from '../context/UserRoleContext';
import { validatieVerzoekenApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import type { Rol } from '../types';
import { rolLabels } from '../types';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredRoles?: Rol[];
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/personeel', icon: Users, label: 'Personeelslijst' },
  { to: '/vrijwilligers', icon: Heart, label: 'Vrijwilligers' },
  { to: '/validatie', icon: ClipboardCheck, label: 'Validatie', requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'] },
  { to: '/sectoren', icon: Building2, label: 'Sectoren' },
  { to: '/distributiegroepen', icon: MailCheck, label: 'Distributiegroepen' },
  { to: '/uitnodigingen', icon: Mail, label: 'Uitnodigingen', requiredRoles: ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd'] },
  { to: '/rollen', icon: Shield, label: 'Rollen & Rechten', requiredRoles: ['ict_super_admin'] },
  { to: '/sync', icon: RefreshCw, label: 'Sync Geschiedenis', requiredRoles: ['ict_super_admin', 'hr_admin'] },
  { to: '/import', icon: CloudDownload, label: 'AD Import', requiredRoles: ['ict_super_admin', 'hr_admin'] },
  { to: '/audit', icon: FileText, label: 'Audit Log', requiredRoles: ['ict_super_admin', 'hr_admin'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teValideren, setTeValideren] = useState(0);
  const { user, logout } = useAuth();
  const { hasAnyRole, getHighestRole } = useUserRole();

  const handleLogout = () => {
    logout();
  };

  // Filter nav items based on user role
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (!item.requiredRoles) return true;
      return hasAnyRole(...item.requiredRoles);
    });
  }, [hasAnyRole]);

  // Get display label for user's highest role
  const userRoleLabel = useMemo(() => {
    const highestRole = getHighestRole();
    return highestRole ? rolLabels[highestRole] : 'Medewerker';
  }, [getHighestRole]);

  // Load validation count from API
  useEffect(() => {
    const loadValidatieCount = async () => {
      try {
        const count = await validatieVerzoekenApi.getAantal();
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
            <img src={diepenbeekLogo} alt="Diepenbeek" className="logo-img" />
            {sidebarOpen && (
              <div className="logo-text">
                <h1>Diepenbeek</h1>
                <span>HR Personeelsbeheer</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Sidebar inklappen' : 'Sidebar uitklappen'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <span className="nav-label">
                  {item.label}
                  {item.to === '/validatie' && teValideren > 0 && (
                    <span className="badge">{teValideren}</span>
                  )}
                </span>
              )}
              {!sidebarOpen && item.to === '/validatie' && teValideren > 0 && (
                <span className="badge-dot" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="theme-toggle-section">
            <ThemeToggle />
          </div>
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
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
