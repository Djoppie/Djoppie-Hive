import { useState } from 'react';
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
} from 'lucide-react';
import diepenbeekLogo from '../assets/diepenbeek-logo.svg';
import { usePersoneel } from '../context/PersoneelContext';
import { useAuth } from '../auth/AuthProvider';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/personeel', icon: Users, label: 'Personeelslijst' },
  { to: '/validatie', icon: ClipboardCheck, label: 'Validatie' },
  { to: '/sectoren', icon: Building2, label: 'Sectoren' },
  { to: '/distributiegroepen', icon: MailCheck, label: 'Distributiegroepen' },
  { to: '/uitnodigingen', icon: Mail, label: 'Uitnodigingen' },
  { to: '/rollen', icon: Shield, label: 'Rollen & Rechten' },
  { to: '/import', icon: CloudDownload, label: 'AD Import' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { medewerkers } = usePersoneel();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  const teValideren = medewerkers.filter(
    m => m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review'
  ).length;

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
          {navItems.map(item => (
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
          <div className="user-info">
            <div className="user-avatar">
              <User size={18} />
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.name || 'Gebruiker'}</span>
                <span className="user-role">
                {user?.email || ""}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="logout-btn" title="Afmelden" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
