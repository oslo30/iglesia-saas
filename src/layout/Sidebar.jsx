import { useState } from 'react';
import { Home, Users, Heart, Calendar, BarChart3, BarChart, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { icon: Home, label: 'Panel', id: 'dashboard' },
  { icon: Users, label: 'Miembros', id: 'members' },
  { icon: Heart, label: 'Donaciones', id: 'donations' },
  { icon: Calendar, label: 'Eventos', id: 'events' },
  { icon: BarChart3, label: 'Asistencia', id: 'attendance' },
  { icon: BarChart, label: 'Reportes', id: 'reports' },
];

export default function Sidebar({ activeScreen, setActiveScreen }) {
  const { user, perfil, signOut } = useAuth()
  const [hovered, setHovered] = useState(null)

  const initials = (perfil?.nombre || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const displayName = perfil?.nombre || user?.email || 'Usuario'
  const displayRole = perfil?.rol || 'portero'

  function handleLogout() {
    signOut()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#1E3A5F" />
              <path d="M20 8 L20 32 M12 16 L28 16" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" />
              <circle cx="20" cy="20" r="14" stroke="#2A4A73" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">Iglesia</span>
            <span className="logo-sub">Sistema de Gestión</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">Menú Principal</span>
          {navItems.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              className={`nav-item ${activeScreen === id ? 'active' : ''}`}
              onClick={() => setActiveScreen(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
            >
              <Icon size={20} strokeWidth={activeScreen === id ? 2 : 1.5} />
              <span>{label}</span>
              {activeScreen === id && <ChevronRight size={16} className="nav-arrow" />}
              {hovered === id && activeScreen !== id && <ChevronRight size={16} className="nav-arrow" />}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <span className="nav-section-label">Sistema</span>
          <button
            className={`nav-item ${activeScreen === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveScreen('settings')}
          >
            <Settings size={20} strokeWidth={activeScreen === 'settings' ? 2 : 1.5} />
            <span>Configuración</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
          <button className="logout-btn" title="Sign out" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
