import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Clock, Plus, ChevronLeft, ChevronRight, Search, Filter, User, Check, X } from 'lucide-react'
import { supabase } from '../supabase'
import './Events.css'

const tipoColors = {
  domingo: '#1E3A5F',
  estudio: '#10B981',
  jovenes: '#8B5CF6',
  damas: '#EC4899',
  comunitario: '#F59E0B',
  especial: '#EF4444',
  otro: '#06B6D4',
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('calendar')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('servicios')
      .select('*')
      .order('fecha_hora')
    setEvents(data || [])
    setLoading(false)
  }

  async function handleCreateEvent(formData) {
    const fecha_hora = `${formData.fecha} ${formData.hora || '09:00'}`
    const { error } = await supabase.from('servicios').insert([{
      nombre: formData.nombre,
      tipo: formData.tipo || 'otro',
      estado: 'programado',
      fecha_hora,
      aforo_max: parseInt(formData.aforo) || 300,
      caracter: formData.caracter || null,
    }])
    if (!error) {
      loadEvents()
      setShowForm(false)
    }
  }

  // Calendar logic
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarDays = []

  // Fill leading empty cells
  for (let i = 0; i < firstDay; i++) {
    const d = new Date(year, month, -firstDay + i + 1)
    calendarDays.push({ day: d.getDate(), month: d.getMonth(), dateStr: null, events: [], isCurrentMonth: false })
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayEvents = events.filter(e => e.fecha_hora?.startsWith(dateStr))
    calendarDays.push({ day: d, month, dateStr, events: dayEvents, isCurrentMonth: true })
  }

  // Fill trailing cells to complete 6 rows
  while (calendarDays.length < 42) {
    const d = calendarDays.length - firstDay - daysInMonth + 1
    const nextMonth = new Date(year, month + 1, d)
    calendarDays.push({ day: nextMonth.getDate(), month: nextMonth.getMonth(), dateStr: null, events: [], isCurrentMonth: false })
  }

  const filteredEvents = filterType === 'all'
    ? events.filter(e => e.estado !== 'cancelado' && e.fecha_hora >= new Date().toISOString())
    : events.filter(e => (e.tipo || '').toLowerCase().includes(filterType.toLowerCase()) && e.estado !== 'cancelado')

  function getTypeColor(tipo) {
    return tipoColors[tipo] || tipoColors.otro
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  function formatTime(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  return (
    <div className="events-screen">
      <div className="events-header">
        <div>
          <h2>Eventos y Servicios</h2>
          <p className="text-muted">Gestionar eventos y servicios de la iglesia</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              <Calendar size={16} /> Calendario
            </button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              <Filter size={16} /> Lista
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Nuevo Evento</button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="calendar-view">
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h3>{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
          <div className="calendar-grid">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="cal-header-cell">{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <div key={i} className={`cal-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${day.events.length > 0 ? 'has-events' : ''}`}>
                <span className="cal-day-num">{day.day}</span>
                {day.events.slice(0, 2).map(evt => (
                  <div
                    key={evt.id}
                    className="cal-event-pill"
                    style={{ background: getTypeColor(evt.tipo) + '20', color: getTypeColor(evt.tipo) }}
                    onClick={() => setSelectedEvent(evt)}
                  >
                    {evt.nombre}
                  </div>
                ))}
                {day.events.length > 2 && <span className="cal-more">+{day.events.length - 2} más</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="list-view">
          <div className="event-filters">
            <button className={`filter-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>Todos</button>
            <button className={`filter-chip ${filterType === 'domingo' ? 'active' : ''}`} onClick={() => setFilterType('domingo')}>Domingo</button>
            <button className={`filter-chip ${filterType === 'estudio' ? 'active' : ''}`} onClick={() => setFilterType('estudio')}>Estudio</button>
            <button className={`filter-chip ${filterType === 'jovenes' ? 'active' : ''}`} onClick={() => setFilterType('jovenes')}>Jóvenes</button>
            <button className={`filter-chip ${filterType === 'comunitario' ? 'active' : ''}`} onClick={() => setFilterType('comunitario')}>Comunitario</button>
            <button className={`filter-chip ${filterType === 'especial' ? 'active' : ''}`} onClick={() => setFilterType('especial')}>Especial</button>
          </div>

          <div className="events-list">
            {loading ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</p>
            ) : filteredEvents.length === 0 ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay eventos</p>
            ) : (
              filteredEvents.map(evt => (
                <div key={evt.id} className="event-card" onClick={() => setSelectedEvent(evt)}>
                  <div className="event-color-bar" style={{ background: getTypeColor(evt.tipo) }} />
                  <div className="event-content">
                    <div className="event-top">
                      <div className="event-type-badge" style={{ background: getTypeColor(evt.tipo) + '15', color: getTypeColor(evt.tipo) }}>
                        {evt.tipo || 'otro'}
                      </div>
                      <span className={`status-badge-${evt.estado}`}>{evt.estado}</span>
                    </div>
                    <h4 className="event-title">{evt.nombre}</h4>
                    <div className="event-meta">
                      <span><Calendar size={14} /> {formatDate(evt.fecha_hora)}</span>
                      <span><Clock size={14} /> {formatTime(evt.fecha_hora)}</span>
                    </div>
                    <div className="event-footer">
                      <div className="attendance-progress">
                        <div className="progress-info">
                          <span><Users size={14} /> {evt.aforo_max || 300} máx</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderTopColor: getTypeColor(selectedEvent.tipo) }}>
              <div className="event-type-badge" style={{ background: getTypeColor(selectedEvent.tipo) + '15', color: getTypeColor(selectedEvent.tipo) }}>
                {selectedEvent.tipo || 'otro'}
              </div>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <h2>{selectedEvent.nombre}</h2>
              <div className="modal-details">
                <div className="detail-row"><Calendar size={16} /><span>{formatDate(selectedEvent.fecha_hora)}</span></div>
                <div className="detail-row"><Clock size={16} /><span>{formatTime(selectedEvent.fecha_hora)}</span></div>
                {selectedEvent.caracter && <div className="detail-row"><MapPin size={16} /><span>{selectedEvent.caracter}</span></div>}
                <div className="detail-row"><User size={16} /><span>Estado: {selectedEvent.estado}</span></div>
              </div>
              <div className="modal-actions">
                <button className="btn-primary">Registrar Asistencia</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <NewEventModal
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateEvent}
          defaultDate={currentMonth.toISOString().split('T')[0]}
        />
      )}
    </div>
  )
}

function NewEventModal({ onClose, onSubmit, defaultDate }) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'domingo',
    fecha: defaultDate,
    hora: '09:00',
    aforo: 300,
    caracter: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header" style={{ borderTopColor: '#1E3A5F' }}>
          <h2>Nuevo Servicio</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="login-field">
            <label>Nombre del servicio</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej: Servicio de Domingo" />
          </div>
          <div className="login-field">
            <label>Tipo</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="domingo">Domingo</option>
              <option value="estudio">Estudio Bíblico</option>
              <option value="jovenes">Jóvenes</option>
              <option value="damas">Damas</option>
              <option value="comunitario">Comunitario</option>
              <option value="especial">Especial</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="login-field">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div className="login-field">
              <label>Hora</label>
              <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} required />
            </div>
          </div>
          <div className="login-field">
            <label>Aforo máximo</label>
            <input type="number" value={form.aforo} onChange={e => setForm({ ...form, aforo: e.target.value })} />
          </div>
          <div className="login-field">
            <label>Descripción / Lugar</label>
            <input value={form.caracter} onChange={e => setForm({ ...form, caracter: e.target.value })} placeholder="Ej: Templo Principal" />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
