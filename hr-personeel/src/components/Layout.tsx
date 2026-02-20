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
  Building2,
  LogOut,
  User,
  MailCheck,
} from 'lucide-react';
import { usePersoneel } from '../context/PersoneelContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/personeel', icon: Users, label: 'Personeelslijst' },
  { to: '/validatie', icon: ClipboardCheck, label: 'Validatie' },
  { to: '/distributiegroepen', icon: MailCheck, label: 'Distributiegroepen' },
  { to: '/uitnodigingen', icon: Mail, label: 'Uitnodigingen' },
  { to: '/rollen', icon: Shield, label: 'Rollen & Rechten' },
  { to: '/import', icon: CloudDownload, label: 'AD Import' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { gebruiker, medewerkers } = usePersoneel();
  const teValideren = medewerkers.filter(
    m => m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review'
  ).length;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <Building2 size={28} />
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
                <span className="user-name">{gebruiker.naam}</span>
                <span className="user-role">
                  {gebruiker.rol === 'hr_admin'
                    ? 'HR Administrator'
                    : gebruiker.rol === 'diensthoofd'
                    ? 'Diensthoofd'
                    : gebruiker.rol === 'sectormanager'
                    ? 'Sectormanager'
                    : 'Medewerker'}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="logout-btn" title="Afmelden">
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
