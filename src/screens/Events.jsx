import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Calendar, Clock, MapPin, X } from 'lucide-react'

export default function Events({ showToast }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('fecha_hora')

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
    const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000) // Asume 3 horas de duracion

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

  const now = new Date()
  const upcomingEvents = filteredEvents.filter(e => new Date(e.fecha_hora) > now)
  const pastEvents = filteredEvents.filter(e => new Date(e.fecha_hora) <= now)

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
        <button className={`filter-chip ${filter === 'domingo' ? 'active' : ''}`} onClick={() => setFilter('domingo')}>Domingos</button>
        <button className={`filter-chip ${filter === 'estudio' ? 'active' : ''}`} onClick={() => setFilter('estudio')}>Estudio</button>
        <button className={`filter-chip ${filter === 'jovenes' ? 'active' : ''}`} onClick={() => setFilter('jovenes')}>Jóvenes</button>
        <button className={`filter-chip ${filter === 'comunitario' ? 'active' : ''}`} onClick={() => setFilter('comunitario')}>Comunitario</button>
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
              {upcomingEvents.map(event => {
                const statusInfo = getEventStatus(event)
                return (
                  <div key={event.id} style={{
                    display: 'flex',
                    gap: 16,
                    padding: 16,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    borderLeft: '4px solid var(--info)',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      background: 'var(--info)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
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
                        <h4 style={{ fontWeight: 600 }}>{event.nombre}</h4>
                        <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                        <span className="badge badge-default">{event.tipo}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} /> {formatTime(event.fecha_hora)}
                        </span>
                        {event.caracter && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={14} /> {event.caracter}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(event.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
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
            {pastEvents.slice(0, 10).map(event => {
              const statusInfo = getEventStatus(event)
              return (
                <div key={event.id} style={{
                  display: 'flex',
                  gap: 16,
                  padding: 12,
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius)',
                  alignItems: 'center',
                  opacity: 0.8
                }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    background: 'var(--text-muted)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase' }}>
                      {new Date(event.fecha_hora).toLocaleDateString('es-CO', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      {new Date(event.fecha_hora).getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <h4 style={{ fontWeight: 500, fontSize: 14 }}>{event.nombre}</h4>
                      <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDate(event.fecha_hora)} - {formatTime(event.fecha_hora)}
                    </div>
                  </div>
                </div>
              )
            })}
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

function EventModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'domingo',
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
                  <option value="domingo">Domingo</option>
                  <option value="estudio">Estudio Bíblico</option>
                  <option value="jovenes">Jóvenes</option>
                  <option value="comunitario">Comunitario</option>
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
