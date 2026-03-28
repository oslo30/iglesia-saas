import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Heart, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase } from '../supabase'
import './Dashboard.css'

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n?.toString() || '0'
}
function fmt(v) { return '$' + Number(v || 0).toLocaleString('es-CO') }
function fmtM(v) { return '$' + (Number(v || 0) / 1000000).toFixed(1) + 'M' }

export default function Dashboard(props) {
  const { setActiveScreen } = props
  const [kpis, setKpis] = useState({ miembros: 0, asistencia: 0, diezmos: 0, grupos: 0 })
  const [attendanceData, setAttendanceData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingServices, setUpcomingServices] = useState([])
  const [chartRange, setChartRange] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Miembros count
    const { count: miembrosCount } = await supabase
      .from('miembros')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo')

    // Asistencia promedio últimos 28 dias
    const hace28 = new Date()
    hace28.setDate(hace28.getDate() - 28)
    const { data: recentAttendances } = await supabase
      .from('registros_asistencia')
      .select('total')
      .gte('created_at', hace28.toISOString())

    const avgAttendance = recentAttendances?.length
      ? Math.round(recentAttendances.reduce((s, r) => s + (r.total || 0), 0) / recentAttendances.length)
      : 0

    // Servicios próximos
    const { data: services } = await supabase
      .from('servicios')
      .select('*')
      .in('estado', ['programado', 'en_curso'])
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora')
      .limit(5)

    // Actividad reciente
    const { data: activities } = await supabase
      .from('registros_asistencia')
      .select('*, servicios(nombre)')
      .order('created_at', { ascending: false })
      .limit(6)

    // Ingresos del mes
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const { data: diezmosData } = await supabase
      .from('diezmos')
      .select('monto')
      .gte('created_at', inicioMes.toISOString())
    const diezmosMes = (diezmosData || []).reduce((s, d) => s + Number(d.monto), 0)

    // Datos para gráfica de asistencia (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const { data: attendanceHistory } = await supabase
      .from('registros_asistencia')
      .select('adultos, ninos, amigos, created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at')

    // Agrupar por mes
    const byMonth = {}
    attendanceHistory?.forEach(r => {
      const mes = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short' })
      if (!byMonth[mes]) byMonth[mes] = { adultos: 0, ninos: 0, amigos: 0 }
      byMonth[mes].adultos += r.adultos || 0
      byMonth[mes].ninos += r.ninos || 0
      byMonth[mes].amigos += r.amigos || 0
    })
    const chartData = Object.entries(byMonth).sort((a, b) => {
      const order = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      return order.indexOf(a[0]) - order.indexOf(b[0])
    }).map(([name, data]) => ({ name, ...data }))

    // Ingresos por mes (diezmos)
    const { data: allDiezmos } = await supabase.from('diezmos').select('monto, created_at')
    const revByMonth = {}
    allDiezmos?.forEach(d => {
      const k = new Date(d.created_at).toLocaleDateString('es-ES', { month: 'short' })
      if (!revByMonth[k]) revByMonth[k] = { diezmos: 0, ofrendas: 0 }
      revByMonth[k].diezmos += Number(d.monto)
    })
    const revData = Object.entries(revByMonth).sort((a, b) => {
      const order = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      return order.indexOf(a[0]) - order.indexOf(b[0])
    }).map(([name, data]) => ({ name, ...data }))

    setKpis({
      miembros: miembrosCount || 0,
      asistencia: avgAttendance || 0,
      diezmos: diezmosMes || 0,
      grupos: 0,
    })
    setAttendanceData(chartData.length ? chartData : [])
    setRevenueData(revData.length ? revData : [{ name: '—', diezmos: 0, ofrendas: 0 }])
    setRecentActivity(activities || [])
    setUpcomingServices(services || [])
    setLoading(false)
  }

  const kpiCards = [
    { label: 'Total Miembros', value: formatNum(kpis.miembros), change: '+0', trend: 'up', icon: Users, color: '#1E3A5F' },
    { label: 'Asistencia Promedio', value: formatNum(kpis.asistencia), change: '+0', trend: 'up', icon: Calendar, color: '#10B981' },
    { label: 'Diezmos del Mes', value: fmtM(kpis.diezmos), change: '+0%', trend: 'up', icon: DollarSign, color: '#C9A84C' },
    { label: 'Grupos Activos', value: formatNum(kpis.grupos), change: '+0', trend: 'up', icon: Heart, color: '#8B5CF6' },
  ]

  const quickActions = [
    { label: 'Registrar Asistencia', icon: '01', color: '#1E3A5F', screen: 'attendance' },
    { label: 'Agregar Miembro', icon: '02', color: '#10B981', screen: 'members' },
    { label: 'Registrar Donación', icon: '03', color: '#C9A84C', screen: 'donations' },
    { label: 'Programar Evento', icon: '04', color: '#3B82F6', screen: 'events' },
  ]

  function handleQuickAction(screen) {
    if (setActiveScreen) {
      setActiveScreen(screen)
    }
  }

  const formatActivityTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    return `hace ${Math.floor(hours / 24)}d`
  }

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* KPI Cards */}
        <div className="kpi-row">
          {kpiCards.map((kpi, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">{kpi.label}</span>
                <div className="kpi-icon" style={{ background: kpi.color + '15', color: kpi.color }}>
                  <kpi.icon size={18} />
                </div>
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{loading ? '—' : kpi.value}</span>
                <div className={`kpi-change ${kpi.trend}`}>
                  {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div className="kpi-footer">
                <span>vs mes anterior</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="card chart-card attendance-chart">
            <div className="card-header">
              <div>
                <h3>Tendencia de Asistencia</h3>
                <p className="text-muted">Asistencia semanal en los últimos 6 meses</p>
              </div>
              <div className="chart-filters">
                <button className={chartRange === 'week' ? 'active' : ''} onClick={() => setChartRange('week')}>Semana</button>
                <button className={chartRange === 'month' ? 'active' : ''} onClick={() => setChartRange('month')}>Mes</button>
                <button className={chartRange === 'year' ? 'active' : ''} onClick={() => setChartRange('year')}>Año</button>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="adultos" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: '#1E3A5F' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="ninos" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                  <Line type="monotone" dataKey="amigos" stroke="#C9A84C" strokeWidth={2.5} dot={{ r: 4, fill: '#C9A84C' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span><i style={{ background: '#1E3A5F' }} />Adultos</span>
              <span><i style={{ background: '#10B981' }} />Niños</span>
              <span><i style={{ background: '#C9A84C' }} />Visitantes</span>
            </div>
          </div>

          <div className="card chart-card revenue-chart">
            <div className="card-header">
              <div>
                <h3>Resumen de Ingresos</h3>
                <p className="text-muted">Diezmos y ofrendas del período</p>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000000}M`} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(v) => fmt(v)} />
                  <Bar dataKey="diezmos" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ofrendas" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span><i style={{ background: '#1E3A5F' }} />Diezmos</span>
              <span><i style={{ background: '#C9A84C' }} />Ofrendas</span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          <div className="card activity-card">
            <div className="card-header">
              <h3>Actividad Reciente</h3>
              <button className="view-all-btn">Ver Todo</button>
            </div>
            <div className="activity-list">
              {loading ? (
                <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Cargando...</p>
              ) : recentActivity.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Sin actividad reciente</p>
              ) : (
                recentActivity.map(a => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-icon" data-type="attendance" />
                    <div className="activity-content">
                      <p>{a.servicios?.nombre || 'Registro de asistencia'} — {a.total} personas</p>
                      <span className="activity-time"><Clock size={12} /> {formatActivityTime(a.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card quick-actions-card">
            <div className="card-header">
              <h3>Acciones Rápidas</h3>
            </div>
            <div className="quick-actions">
              {quickActions.map((action, i) => (
                <button key={i} className="quick-action-btn" onClick={() => handleQuickAction(action.screen)}>
                  <div className="qa-icon" style={{ background: action.color }}>
                    <span>{action.icon}</span>
                  </div>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <div className="upcoming-events">
              <h4>Próximos Eventos</h4>
              {loading ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cargando...</p>
              ) : upcomingServices.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sin eventos próximos</p>
              ) : (
                upcomingServices.map(svc => (
                  <div key={svc.id} className="event-item">
                    <div className="event-date">
                      <span className="event-day">{new Date(svc.fecha_hora).getDate()}</span>
                      <span className="event-month">{new Date(svc.fecha_hora).toLocaleDateString('es-ES', { month: 'short' })}</span>
                    </div>
                    <div className="event-info">
                      <p className="event-name">{svc.nombre}</p>
                      <span className="event-meta">{svc.tipo} — {svc.estado}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
