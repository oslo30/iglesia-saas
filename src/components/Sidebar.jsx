import { Home, Users, DollarSign, Calendar, LogOut, Church, TrendingDown, FolderOpen } from 'lucide-react'

const menuItems = [
  { id: 'dashboard',  label: 'Panel Principal', icon: Home },
  { id: 'members',    label: 'Miembros',        icon: Users },
  { id: 'finanzas',   label: 'Finanzas',        icon: DollarSign },
  { id: 'egresos',    label: 'Egresos',          icon: TrendingDown },
  { id: 'proyectos',  label: 'Proyectos',       icon: FolderOpen },
  { id: 'attendance', label: 'Asistencia',     icon: Calendar },
  { id: 'events',     label: 'Eventos',         icon: Calendar },
]

export default function Sidebar({ currentScreen, onNavigate, onLogout, user }) {
  const initials = user?.email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Church size={22} />
          </div>
          <div>
            <h1>Iglesia</h1>
            <span>Sistema de Gestión</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Principal</div>
          {menuItems.slice(0, 3).map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Gestión</div>
          {menuItems.slice(3).map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.email}</div>
            <div className="user-role">Administrador</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
