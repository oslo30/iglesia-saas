import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Search, Users, Calendar, X, Check, Minus } from 'lucide-react'

export default function Attendance({ showToast }) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [attendance, setAttendance] = useState({})
  const [counters, setCounters] = useState({ adultos: 0, ninos: 0, amigos: 0 })
  const [selectedService, setSelectedService] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0]

      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('*')
        .gte('fecha_hora', today + 'T00:00:00')
        .lt('fecha_hora', manana + 'T00:00:00')
        .order('fecha_hora')

      setServicios(serviciosData || [])

      if (serviciosData?.length > 0 && !selectedService) {
        setSelectedService(serviciosData[0])
        loadAttendanceForService(serviciosData[0])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAttendanceForService(servicio) {
    try {
      const { data } = await supabase
        .from('registros_asistencia')
        .select('*')
        .eq('servicio_id', servicio.id)
        .maybeSingle()

      if (data) {
        setCounters({
          adultos: data.adultos || 0,
          ninos: data.ninos || 0,
          amigos: data.amigos || 0,
        })
      } else {
        setCounters({ adultos: 0, ninos: 0, amigos: 0 })
      }
    } catch (err) {
      console.error('Error loading attendance:', err)
    }
  }

  async function saveAttendance() {
    if (!selectedService) return

    const total = counters.adultos + counters.ninos + counters.amigos

    try {
      const { error } = await supabase
        .from('registros_asistencia')
        .upsert({
          servicio_id: selectedService.id,
          adultos: counters.adultos,
          ninos: counters.ninos,
          amigos: counters.amigos,
          total,
        }, { onConflict: 'servicio_id' })

      if (error) throw error
      showToast('Asistencia guardada correctamente')
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  function updateCounter(type, delta) {
    setCounters(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }))
  }

  function handleServiceSelect(servicio) {
    setSelectedService(servicio)
    loadAttendanceForService(servicio)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Control de Asistencia</h1>
          <p>Registra la asistencia a los servicios</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Programar Servicio
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'rgba(30, 58, 95, 0.1)' }}>
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-label">Total Hoy</div>
          <div className="stat-value">{counters.adultos + counters.ninos + counters.amigos}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <Users size={24} />
          </div>
          <div className="stat-label">Adultos</div>
          <div className="stat-value">{counters.adultos}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--info)', '--stat-bg': 'rgba(59, 130, 246, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            <Users size={24} />
          </div>
          <div className="stat-label">Niños</div>
          <div className="stat-value">{counters.ninos}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'rgba(201, 168, 76, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(201, 168, 76, 0.1)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div className="stat-label">Visitantes</div>
          <div className="stat-value">{counters.amigos}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Servicios de Hoy</h3>
          <span>{new Date().toLocaleDateString('es-CO', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : servicios.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No hay servicios programados para hoy</h3>
            <p>Programa un servicio para registrar asistencia</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {servicios.map(servicio => (
                <button
                  key={servicio.id}
                  className={`filter-chip ${selectedService?.id === servicio.id ? 'active' : ''}`}
                  onClick={() => handleServiceSelect(servicio)}
                >
                  {servicio.nombre} - {new Date(servicio.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>

            {selectedService && (
              <div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
                  {['adultos', 'ninos', 'amigos'].map(type => (
                    <div key={type} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'capitalize' }}>
                        {type === 'adultos' ? 'Adultos' : type === 'ninos' ? 'Niños' : 'Visitantes'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => updateCounter(type, -1)}
                        >
                          <Minus size={18} />
                        </button>
                        <span style={{ fontSize: 32, fontWeight: 700, minWidth: 60 }}>{counters[type]}</span>
                        <button
                          className="btn btn-primary btn-icon"
                          onClick={() => updateCounter(type, 1)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button className="btn btn-primary btn-lg" onClick={saveAttendance}>
                    <Check size={20} /> Guardar Asistencia
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  )
}

function ServiceModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    tipo: 'domingo',
  })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const fecha_hora = `${form.fecha} ${form.hora}`
      const { error } = await supabase.from('servicios').insert([{
        nombre: form.nombre,
        tipo: form.tipo,
        fecha_hora,
        estado: 'programado',
      }])
      if (error) throw error
      onSave()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Programar Servicio</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Nombre del Servicio</label>
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
            <div className="form-field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="domingo">Domingo</option>
                <option value="estudio">Estudio Bíblico</option>
                <option value="jovenes">Jóvenes</option>
                <option value="comunitario">Comunitario</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
