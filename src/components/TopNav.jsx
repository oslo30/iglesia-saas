import { useState } from 'react';
import { Bell, Search, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TopNav.css';

export default function TopNav({ title, subtitle }) {
  const { user, perfil } = useAuth()
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);

  const displayName = perfil?.nombre || user?.email || 'Usuario'
  const initials = (displayName).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const notifications = [
    { id: 1, text: 'Maria Santos se registró para el Servicio del Domingo', time: 'Hace 5 min', unread: true },
    { id: 2, text: 'Reporte mensual de donaciones listo', time: 'Hace 1 hora', unread: true },
    { id: 3, text: 'Carlos Rivera marcó presente en Estudio Bíblico', time: 'Hace 2 horas', unread: false },
    { id: 4, text: 'Nuevo miembro Juan Torres se unió', time: 'Ayer', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="topnav">
      <div className="topnav-left">
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <span className="page-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="topnav-center">
        {showSearch ? (
          <div className="search-expanded">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar miembros, eventos, donaciones..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button className="search-close" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button className="search-trigger" onClick={() => setShowSearch(true)}>
            <Search size={18} />
            <span>Búsqueda rápida...</span>
            <kbd>Ctrl K</kbd>
          </button>
        )}
      </div>

      <div className="topnav-right">
        <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={20} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>

        {showNotifs && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <span>Notificaciones</span>
              <button className="notif-markread">Marcar todo como leído</button>
            </div>
            <div className="notif-list">
              {notifications.map(n => (
                <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                  <div className="notif-dot" />
                  <div className="notif-content">
                    <p>{n.text}</p>
                    <span className="notif-time">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="topnav-divider" />

        <button className="profile-btn">
          <div className="profile-avatar">{initials}</div>
          <span className="profile-name">{displayName}</span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
