import { useEffect, useState } from 'react'
import { Users, UserCheck, UserPlus, TrendingUp, Calendar, Clock, ChevronLeft, ChevronRight, Play, Square, RefreshCw, Download, BarChart3, Plus, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import './Attendance.css'

export default function Attendance() {
  const { user } = useAuth()
  const [servicios, setServicios] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [currentAttendance, setCurrentAttendance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkInMode, setCheckInMode] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [counters, setCounters] = useState({ adultos: 0, ninos: 0, amigos: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Today's services
    const today = new Date().toISOString().split('T')[0]
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const mananaStr = manana.toISOString().split('T')[0]

    const { data: svcs } = await supabase
      .from('servicios')
      .select('*')
      .gte('fecha_hora', today + 'T00:00:00')
      .lt('fecha_hora', mananaStr + 'T00:00:00')
      .order('fecha_hora')

    const serviciosList = svcs || []
    setServicios(serviciosList)

    if (serviciosList.length > 0 && !selectedService) {
      selectService(serviciosList[0])
    }

    // All attendance records for charts
    const { data: records } = await supabase
      .from('registros_asistencia')
      .select('*, servicios(nombre)')
      .order('created_at', { ascending: false })
      .limit(30)

    setAttendanceRecords(records || [])
    setLoading(false)
  }

  async function selectService(svc) {
    setSelectedService(svc)

    // Get existing attendance for this service
    const { data: existing } = await supabase
      .from('registros_asistencia')
      .select('*')
      .eq('servicio_id', svc.id)
      .maybeSingle()

    if (existing) {
      setCurrentAttendance(existing)
      setCounters({ adultos: existing.adultos || 0, ninos: existing.ninos || 0, amigos: existing.amigos || 0 })
    } else {
      setCurrentAttendance(null)
      setCounters({ adultos: 0, ninos: 0, amigos: 0 })
    }
  }

  async function saveAttendance() {
    if (!selectedService) return

    const total = counters.adultos + counters.ninos + counters.amigos
    const { data, error } = await supabase
      .from('registros_asistencia')
      .upsert({
        servicio_id: selectedService.id,
        adultos: counters.adultos,
        ninos: counters.ninos,
        amigos: counters.amigos,
        total,
        notas: null,
        registrado_por: user?.id || null,
      }, { onConflict: 'servicio_id' })
      .select()
      .single()

    if (!error && data) {
      setCurrentAttendance(data)
    }
  }

  async function updateCounter(type, delta) {
    setCounters(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }))
    // Auto-save after update
    await saveAttendance()
  }

  // Weekly distribution from attendance records
  const weeklyData = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => {
    const dayRecords = attendanceRecords.filter(r => {
      const d = new Date(r.created_at).toLocaleDateString('es-ES', { weekday: 'short' })
      return d === day
    })
    const totalAdultos = dayRecords.reduce((s, r) => s + (r.adultos || 0), 0)
    const totalNinos = dayRecords.reduce((s, r) => s + (r.ninos || 0), 0)
    const totalAmigos = dayRecords.reduce((s, r) => s + (r.amigos || 0), 0)
    return { day, adultos: totalAdultos, ninos: totalNinos, amigos: totalAmigos }
  })

  // Monthly trend
  const monthlyByMonth = {}
  attendanceRecords.forEach(r => {
    const mes = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short' })
    if (!monthlyByMonth[mes]) monthlyByMonth[mes] = 0
    monthlyByMonth[mes] += r.total || 0
  })
  const monthlyData = Object.entries(monthlyByMonth).map(([name, total]) => ({ name, total }))

  const totalToday = servicios.reduce((s, svc) => {
    const rec = attendanceRecords.find(r => r.servicio_id === svc.id)
    return s + (rec?.total || 0)
  }, 0)

  function getServiceStatus(svc) {
    if (svc.estado === 'finalizado') return 'past'
    if (svc.estado === 'en_curso') return 'active'
    return 'upcoming'
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="attendance-screen">
      <div className="attendance-header">
        <div>
          <h2>Control de Asistencia</h2>
          <p className="text-muted">Sistema de registro y análisis de asistencia</p>
        </div>
        <div className="header-actions">
          <button className="btn-export"><Download size={16} /> Exportar</button>
          <button className="btn-export"><BarChart3 size={16} /> Reporte Completo</button>
          <button
            className={`btn-checkin ${checkInMode ? 'active' : ''}`}
            onClick={() => setCheckInMode(!checkInMode)}
          >
            {checkInMode ? <><Square size={16} /> Detener Registro</> : <><Play size={16} /> Iniciar Registro</>}
          </button>
        </div>
      </div>

      {/* Live Counters */}
      <div className="live-counters">
        <div className="live-banner">
          <div className="live-indicator">
            <span className="live-dot" /> Contadores en Vivo
          </div>
          <span className="live-service">{selectedService?.nombre || 'Ningún servicio seleccionado'}</span>
          <button className="counter-refresh" onClick={loadData} style={{ marginLeft: 'auto' }}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="counters-row">
          {[
            { key: 'adultos', label: 'Adultos', icon: Users },
            { key: 'ninos', label: 'Niños', icon: Users },
            { key: 'amigos', label: 'Visitantes', icon: UserPlus },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className={`counter-card counter-${key}`}>
              <div className="counter-icon"><Icon size={24} /></div>
              <div className="counter-info">
                <span className="counter-label">{label}</span>
                <span className="counter-value">{counters[key]}</span>
              </div>
              {checkInMode && (
                <div className="counter-buttons">
                  <button className="counter-btn minus" onClick={() => updateCounter(key, -1)}><Minus size={14} /></button>
                  <button className="counter-btn plus" onClick={() => updateCounter(key, 1)}><Plus size={14} /></button>
                </div>
              )}
            </div>
          ))}
          <div className="counter-card counter-total">
            <div className="counter-icon"><UserCheck size={24} /></div>
            <div className="counter-info">
              <span className="counter-label">Total</span>
              <span className="counter-value">{counters.adultos + counters.ninos + counters.amigos}</span>
            </div>
            {checkInMode && selectedService && (
              <button className="btn-primary" style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.875rem' }} onClick={saveAttendance}>
                Guardar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Services */}
      <div className="card services-card">
        <div className="card-header">
          <h3>Servicios de Hoy</h3>
          <span className="services-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="services-list">
          {loading ? (
            <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Cargando...</p>
          ) : servicios.length === 0 ? (
            <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>No hay servicios programados para hoy</p>
          ) : (
            servicios.map(svc => {
              const rec = attendanceRecords.find(r => r.servicio_id === svc.id)
              const status = getServiceStatus(svc)
              return (
                <div
                  key={svc.id}
                  className={`service-row ${selectedService?.id === svc.id ? 'selected' : ''} ${status}`}
                  onClick={() => selectService(svc)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="service-status-indicator" data-status={status} />
                  <div className="service-info">
                    <span className="service-name">{svc.nombre}</span>
                    <span className="service-time"><Clock size={12} /> {formatTime(svc.fecha_hora)}</span>
                  </div>
                  <div className="service-attendance">
                    <span className={`attendance-count ${status === 'active' ? 'active' : ''}`}>
                      {rec?.total || '—'}
                    </span>
                    <span className="attendance-label">asistiendo</span>
                  </div>
                  {status === 'past' && <span className="service-badge past">Finalizado</span>}
                  {status === 'active' && <span className="service-badge live">En Progreso</span>}
                  {status === 'upcoming' && <span className="service-badge upcoming">Próximo</span>}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="charts-row">
        {/* Weekly Distribution */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3>Distribución Semanal</h3>
              <p className="text-muted">Asistencia por día esta semana</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="adultos" name="Adultos" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ninos" name="Niños" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="amigos" name="Visitantes" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><i style={{ background: '#1E3A5F' }} />Adultos</span>
            <span><i style={{ background: '#10B981' }} />Niños</span>
            <span><i style={{ background: '#C9A84C' }} />Visitantes</span>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3>Tendencia Mensual</h3>
              <p className="text-muted">Total de asistencia en el tiempo</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData.length ? monthlyData : [{ name: '—', total: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }} />
                <Area type="monotone" dataKey="total" name="Total" fill="#1E3A5F20" stroke="#1E3A5F" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="card checkins-card">
        <div className="card-header">
          <h3>Registros de Asistencia</h3>
          <span className="checkins-count">{attendanceRecords.length} registros</span>
        </div>
        <div className="checkins-list">
          {attendanceRecords.length === 0 ? (
            <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>No hay registros</p>
          ) : (
            attendanceRecords.slice(0, 10).map((rec, i) => (
              <div key={rec.id || i} className="checkin-row">
                <div className="checkin-avatar adultos">{rec.servicios?.nombre?.[0] || '?'}</div>
                <div className="checkin-info">
                  <span className="checkin-name">{rec.servicios?.nombre || 'Servicio'}</span>
                  <span className="checkin-service">
                    {new Date(rec.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="type-badge type-adultos">A: {rec.adultos || 0}</span>
                <span className="type-badge type-ninos">N: {rec.ninos || 0}</span>
                <span className="type-badge type-amigos">V: {rec.amigos || 0}</span>
                <span className="checkin-time">{rec.total || 0}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
