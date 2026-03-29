import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Plus, Wallet, ArrowRight, Church } from 'lucide-react'
import { supabase } from '../supabase'
import { ingresosApi } from '../api/finanzas'

Chart.register(...registerables)

const CAJAS_PREDEFINIDAS = [
  { id: 'caja_general', nombre: 'Caja General', color: '#00519A', icon: Wallet },
  { id: 'misiones', nombre: 'Fondo Misiones', color: '#10B981', icon: Wallet },
  { id: 'construccion', nombre: 'Fondo Construcción', color: '#F59E0B', icon: Wallet },
]

function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-CO')
}

function formatMoneyShort(amount) {
  if (amount >= 1000000) {
    return '$' + (amount / 1000000).toFixed(1) + 'M'
  }
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K'
  }
  return '$' + amount.toLocaleString('es-CO')
}

export default function Dashboard({ showToast, onNavigate }) {
  const [stats, setStats] = useState({
    totalMiembros: 0,
    ingresosMes: 0,
    egresosMes: 0,
    balance: 0,
    asistenciaPromedio: 0,
  })
  const [loading, setLoading] = useState(true)
  const [cajas, setCajas] = useState([])
  const [chartData, setChartData] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    return () => {
      if (chartInstance.current) chartInstance.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (chartData && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy()
      const ctx = chartRef.current.getContext('2d')

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Ingresos',
              data: chartData.ingresos,
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderRadius: 6,
            },
            {
              label: 'Egresos',
              data: chartData.egresos,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: { boxWidth: 12, padding: 20, font: { size: 12 } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatMoneyShort(value)
              }
            },
            x: {
              grid: { display: false }
            }
          },
        },
      })
    }
  }, [chartData])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      const [
        miembrosRes,
        asistenciaRes,
        ingresosData,
      ] = await Promise.allSettled([
        supabase.from('miembros').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('registros_asistencia').select('total'),
        ingresosApi.resumen('mes', { anio: currentYear, mes: currentMonth }),
      ])

      const totalMiembros = miembrosRes.status === 'fulfilled' ? (miembrosRes.value.count || 0) : 0
      const avgAsistencia = asistenciaRes.status === 'fulfilled' && asistenciaRes.value.data?.length
        ? Math.round(asistenciaRes.value.data.reduce((s, r) => s + (r.total || 0), 0) / asistenciaRes.value.data.length)
        : 0
      const ingresosMes = ingresosData.status === 'fulfilled' ? (ingresosData.value?.total || 0) : 0

      const egresosRes = await supabase.from('egresos').select('monto').eq('tipo', 'operativo')
      const egresosMes = egresosRes.data?.reduce((s, e) => s + Number(e.monto), 0) || 0

      setStats({
        totalMiembros,
        ingresosMes,
        egresosMes,
        balance: ingresosMes - egresosMes,
        asistenciaPromedio: avgAsistencia,
      })

      await loadChartData(currentYear)
      loadCajasData()
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadChartData(year) {
    try {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const ingresos = []
      const egresos = []

      for (let mes = 1; mes <= 12; mes++) {
        try {
          const res = await ingresosApi.resumen('mes', { anio: year, mes })
          ingresos.push(res.total || 0)
        } catch {
          ingresos.push(0)
        }

        try {
          const startDate = `${year}-${String(mes).padStart(2, '0')}-01`
          const endDate = mes === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(mes + 1).padStart(2, '0')}-01`
          const egresosRes = await supabase
            .from('egresos')
            .select('monto')
            .eq('tipo', 'operativo')
            .gte('fecha', startDate)
            .lt('fecha', endDate)
          egresos.push(egresosRes.data?.reduce((s, e) => s + Number(e.monto), 0) || 0)
        } catch {
          egresos.push(0)
        }
      }

      setChartData({ labels: meses, ingresos, egresos })
    } catch (err) {
      console.error('Error loading chart:', err)
    }
  }

  async function loadCajasData() {
    const cajasConDatos = CAJAS_PREDEFINIDAS.map(caja => ({
      ...caja,
      ingresos: 0,
      egresos: 0,
      saldo: 0,
    }))
    setCajas(cajasConDatos)
  }

  const metricCards = [
    {
      label: 'Total Miembros',
      value: stats.totalMiembros,
      format: 'number',
      icon: Users,
      color: 'var(--primary)',
      bg: 'rgba(0, 81, 154, 0.1)',
      trend: null,
      context: 'Activos',
    },
    {
      label: 'Ingresos del Mes',
      value: stats.ingresosMes,
      format: 'money',
      icon: TrendingUp,
      color: 'var(--success)',
      bg: 'rgba(16, 185, 129, 0.1)',
      trend: stats.ingresosMes > 0 ? 'up' : null,
      context: new Date().toLocaleDateString('es-CO', { month: 'long' }),
    },
    {
      label: 'Egresos del Mes',
      value: stats.egresosMes,
      format: 'money',
      icon: TrendingDown,
      color: 'var(--danger)',
      bg: 'rgba(239, 68, 68, 0.1)',
      trend: null,
      context: new Date().toLocaleDateString('es-CO', { month: 'long' }),
    },
    {
      label: 'Balance General',
      value: stats.balance,
      format: 'money',
      icon: DollarSign,
      color: stats.balance >= 0 ? 'var(--success)' : 'var(--danger)',
      bg: stats.balance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      trend: stats.balance >= 0 ? 'up' : 'down',
      context: 'Este mes',
    },
    {
      label: 'Asistencia Promedio',
      value: stats.asistenciaPromedio,
      format: 'number',
      icon: Calendar,
      color: 'var(--info)',
      bg: 'rgba(59, 130, 246, 0.1)',
      trend: null,
      context: 'Por servicio',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Panel Principal</h1>
          <p>Resumen de actividad de tu iglesia</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        {metricCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="metric-card" style={{ '--metric-color': card.color, '--metric-bg': card.bg }}>
              <div className="metric-header">
                <div className="metric-icon" style={{ background: card.bg, color: card.color }}>
                  <Icon size={20} />
                </div>
                {card.trend && (
                  <div className={`metric-trend ${card.trend}`}>
                    {card.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                )}
              </div>
              <div className="metric-label">{card.label}</div>
              <div className="metric-value">
                {loading ? '...' : card.format === 'money' ? formatMoneyShort(card.value) : card.value}
              </div>
              <div className="metric-context">{card.context}</div>
            </div>
          )
        })}
      </div>

      {/* Financial Chart */}
      <div className="dashboard-row">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3>Ingresos vs Egresos</h3>
              <p>Comparativa mensual - {new Date().getFullYear()}</p>
            </div>
          </div>
          <div style={{ height: 280 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Cargando...</div>
            ) : (
              <canvas ref={chartRef} />
            )}
          </div>
        </div>

        {/* Cajas / Fondos */}
        <div className="card cajas-card">
          <div className="card-header">
            <h3>Cajas / Fondos</h3>
          </div>
          <div className="cajas-list">
            {cajas.map((caja) => {
              const Icon = caja.icon
              return (
                <div key={caja.id} className="caja-item" style={{ '--caja-color': caja.color }}>
                  <div className="caja-item-header">
                    <div className="caja-indicator" style={{ background: caja.color }}></div>
                    <span className="caja-item-nombre">{caja.nombre}</span>
                  </div>
                  <div className="caja-item-stats">
                    <div className="caja-item-stat">
                      <span className="stat-label-sm">Ingresos</span>
                      <span className="stat-value-sm income">{formatMoneyShort(caja.ingresos)}</span>
                    </div>
                    <div className="caja-item-stat">
                      <span className="stat-label-sm">Egresos</span>
                      <span className="stat-value-sm expense">{formatMoneyShort(caja.egresos)}</span>
                    </div>
                    <div className="caja-item-stat">
                      <span className="stat-label-sm">Saldo</span>
                      <span className={`stat-value-sm ${caja.saldo >= 0 ? 'income' : 'expense'}`}>
                        {formatMoneyShort(caja.saldo)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {cajas.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                <Wallet size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>Sin cajas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card quick-actions-card">
        <div className="card-header">
          <h3>Acciones Rápidas</h3>
        </div>
        <div className="quick-actions">
          <button
            className="quick-action-btn primary"
            onClick={() => onNavigate && onNavigate('members')}
          >
            <div className="quick-action-icon"><Users size={22} /></div>
            <div className="quick-action-text">
              <span className="quick-action-title">Agregar Miembro</span>
              <span className="quick-action-desc">Registrar nuevo miembro</span>
            </div>
            <ArrowRight size={18} className="quick-action-arrow" />
          </button>

          <button
            className="quick-action-btn success"
            onClick={() => onNavigate && onNavigate('finanzas')}
          }
          >
            <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><TrendingUp size={22} /></div>
            <div className="quick-action-text">
              <span className="quick-action-title">Registrar Ingreso</span>
              <span className="quick-action-desc">Diezmo, ofrenda u otro</span>
            </div>
            <ArrowRight size={18} className="quick-action-arrow" />
          </button>

          <button
            className="quick-action-btn danger"
            onClick={() => onNavigate && onNavigate('finanzas')}
          }
          >
            <div className="quick-action-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}><TrendingDown size={22} /></div>
            <div className="quick-action-text">
              <span className="quick-action-title">Registrar Egreso</span>
              <span className="quick-action-desc">Gasto u egreso</span>
            </div>
            <ArrowRight size={18} className="quick-action-arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}
