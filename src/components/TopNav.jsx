import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import './TopNav.css';

export default function TopNav({ title, subtitle }) {
  const { user, perfil } = useAuth()
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const displayName = perfil?.nombre || user?.email || 'Usuario'
  const initials = (displayName).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    if (perfil?.id) {
      loadNotifications()
    }
  }, [perfil])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', perfil.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifications(data || [])
  }

  async function markAllRead() {
    if (!perfil?.id) return
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', perfil.id)
      .eq('leida', false)
    loadNotifications()
  }

  async function markAsRead(id) {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
    loadNotifications()
  }

  const unreadCount = notifications.filter(n => !n.leida).length;

  function formatTime(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

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
              {unreadCount > 0 && <button className="notif-markread" onClick={markAllRead}>Marcar todo como leído</button>}
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <p style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin notificaciones</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.leida ? 'unread' : ''}`}
                    onClick={() => { markAsRead(n.id); if (n.enlace) window.location.href = n.enlace }}
                    style={{ cursor: n.enlace ? 'pointer' : 'default' }}
                  >
                    <div className="notif-dot" />
                    <div className="notif-content">
                      <p>{n.mensaje || n.titulo}</p>
                      <span className="notif-time">{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
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
