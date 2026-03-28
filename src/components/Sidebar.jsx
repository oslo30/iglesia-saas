import { Home, Users, DollarSign, LogOut } from 'lucide-react'

export default function Sidebar({ currentScreen, onNavigate, onLogout, user }) {
  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: Home },
    { id: 'members', label: 'Miembros', icon: Users },
    { id: 'donations', label: 'Finanzas', icon: DollarSign },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Iglesia</h2>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Sistema de Gestión</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
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
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div>
            <div style={{ fontWeight: 500 }}>{user?.email}</div>
            <div className="user-email">Usuario</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
