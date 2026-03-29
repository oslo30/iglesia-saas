import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Calendar, Clock, MapPin, X, Users, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { participacionesApi, ROLES, getLabelRol } from '../api/participaciones'

export default function Events({ showToast }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [expandedEvent, setExpandedEvent] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('fecha_hora', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al cargar eventos', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      const fecha_hora = `${formData.fecha} ${formData.hora}:00`
      const { error } = await supabase.from('servicios').insert([{
        nombre: formData.nombre,
        tipo: formData.tipo,
        fecha_hora,
        estado: 'programado',
        caracter: formData.lugar || null,
      }])

      if (error) throw error
      showToast('Evento creado correctamente')
      setShowModal(false)
      loadEvents()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      const { error } = await supabase.from('servicios').delete().eq('id', id)
      if (error) throw error
      showToast('Evento eliminado')
      loadEvents()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  function getEventStatus(event) {
    const now = new Date()
    const eventDate = new Date(event.fecha_hora)
    const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000)

    if (now < eventDate) {
      return { status: 'proximo', label: 'Próximo', class: 'badge-info' }
    } else if (now >= eventDate && now <= endDate) {
      return { status: 'actual', label: 'En Progreso', class: 'badge-success' }
    } else {
      return { status: 'pasado', label: 'Finalizado', class: 'badge-default' }
    }
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    return e.tipo === filter
  })

  const upcomingEvents = filteredEvents.filter(e => new Date(e.fecha_hora) > new Date())
  const pastEvents = filteredEvents.filter(e => new Date(e.fecha_hora) <= new Date())

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Eventos y Servicios</h1>
          <p>Programa y gestiona los eventos de tu iglesia</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Evento
          </button>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        <button className={`filter-chip ${filter === 'dominical_am' ? 'active' : ''}`} onClick={() => setFilter('dominical_am')}>Dominical AM</button>
        <button className={`filter-chip ${filter === 'dominical_pm' ? 'active' : ''}`} onClick={() => setFilter('dominical_pm')}>Dominical PM</button>
        <button className={`filter-chip ${filter === 'miercoles' ? 'active' : ''}`} onClick={() => setFilter('miercoles')}>Miércoles</button>
        <button className={`filter-chip ${filter === 'especial' ? 'active' : ''}`} onClick={() => setFilter('especial')}>Especial</button>
        <button className={`filter-chip ${filter === 'otro' ? 'active' : ''}`} onClick={() => setFilter('otro')}>Otro</button>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Próximos Eventos</h3>
            <span>{upcomingEvents.length} eventos</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {upcomingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  statusInfo={getEventStatus(event)}
                  isExpanded={expandedEvent === event.id}
                  onToggle={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                  onDelete={() => handleDelete(event.id)}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Eventos Pasados</h3>
            <span>{pastEvents.length} eventos</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {pastEvents.slice(0, 10).map(event => (
              <EventCard
                key={event.id}
                event={event}
                statusInfo={getEventStatus(event)}
                isExpanded={expandedEvent === event.id}
                onToggle={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                onDelete={() => handleDelete(event.id)}
                showToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No hay eventos</h3>
            <p>Crea tu primer evento</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Nuevo Evento
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <EventModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function EventCard({ event, statusInfo, isExpanded, onToggle, onDelete, showToast }) {
  const [participaciones, setParticipaciones] = useState([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [miembros, setMiembros] = useState([])
  const [formPart, setFormPart] = useState({ miembro_id: '', rol: 'director' })

  useEffect(() => {
    if (isExpanded) {
      loadParticipaciones()
      loadMiembros()
    }
  }, [isExpanded, event.id])

  async function loadParticipaciones() {
    setLoadingParts(true)
    try {
      const data = await participacionesApi.listarPorServicio(event.id)
      setParticipaciones(data)
    } catch (err) {
      console.error('Error loading participaciones:', err)
    } finally {
      setLoadingParts(false)
    }
  }

  async function loadMiembros() {
    try {
      const { data } = await supabase
        .from('miembros')
        .select('id, nombre, apellido')
        .order('nombre')
      setMiembros(data || [])
    } catch (err) {
      console.error('Error loading miembros:', err)
    }
  }

  async function handleAddParticipacion() {
    if (!formPart.miembro_id || !formPart.rol) return
    try {
      await participacionesApi.crear({
        miembro_id: formPart.miembro_id,
        servicio_id: event.id,
        rol: formPart.rol,
        fecha: event.fecha_hora.split('T')[0],
      })
      showToast('Participación agregada')
      setFormPart({ miembro_id: '', rol: 'director' })
      setShowAddPart(false)
      loadParticipaciones()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleRemoveParticipacion(id) {
    try {
      await participacionesApi.eliminar(id)
      showToast('Participación eliminada')
      loadParticipaciones()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      borderLeft: `4px solid ${statusInfo.status === 'proximo' ? 'var(--info)' : statusInfo.status === 'actual' ? 'var(--success)' : 'var(--text-muted)'}`,
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        alignItems: 'center',
        cursor: 'pointer',
        background: isExpanded ? 'var(--bg)' : 'transparent',
      }} onClick={onToggle}>
        <div style={{
          width: 60,
          height: 60,
          background: statusInfo.status === 'proximo' ? 'var(--info)' : statusInfo.status === 'actual' ? 'var(--success)' : 'var(--text-muted)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase' }}>
            {new Date(event.fecha_hora).toLocaleDateString('es-CO', { month: 'short' })}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {new Date(event.fecha_hora).getDate()}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h4 style={{ fontWeight: 600, margin: 0 }}>{event.nombre}</h4>
            <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
            <span className="badge badge-default">{event.tipo.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {new Date(event.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {event.caracter && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> {event.caracter}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isExpanded && participaciones.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} /> {participaciones.length} participación{participaciones.length !== 1 ? 'es' : ''}
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: 16, background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Participaciones del Servicio</h4>
            <button
              className="btn btn-sm btn-primary"
              onClick={(e) => { e.stopPropagation(); setShowAddPart(!showAddPart) }}
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {showAddPart && (
            <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 16 }} onClick={e => e.stopPropagation()}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Miembro</label>
                  <select
                    value={formPart.miembro_id}
                    onChange={e => setFormPart({ ...formPart, miembro_id: e.target.value })}
                  >
                    <option value="">Seleccionar miembro...</option>
                    {miembros.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Rol</label>
                  <select
                    value={formPart.rol}
                    onChange={e => setFormPart({ ...formPart, rol: e.target.value })}
                  >
                    {ROLES.map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPart(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddParticipacion} disabled={!formPart.miembro_id}>
                  <Check size={14} /> Guardar
                </button>
              </div>
            </div>
          )}

          {loadingParts ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Cargando...</div>
          ) : participaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0 }}>Sin participaciones registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {participaciones.map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {p.miembro?.nombre?.[0]}{p.miembro?.apellido?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {p.miembro?.nombre} {p.miembro?.apellido}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {getLabelRol(p.rol)} · {p.puntaje} pts
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleRemoveParticipacion(p.id) }}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'dominical_am',
    lugar: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Evento</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Nombre del Evento</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Servicio de Domingo"
                required
              />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={e => setForm({ ...form, hora: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="dominical_am">Servicio Dominical AM</option>
                  <option value="dominical_pm">Servicio Dominical PM</option>
                  <option value="miercoles">Miércoles</option>
                  <option value="especial">Evento Especial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-field">
                <label>Lugar (opcional)</label>
                <input
                  value={form.lugar}
                  onChange={e => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Ej: Templo Principal"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Evento</button>
          </div>
        </form>
      </div>
    </div>
  )
}
