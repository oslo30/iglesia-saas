import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { Plus, Search, DollarSign, X, TrendingUp, TrendingDown, ChevronRight, ChevronLeft, Check, PieChart, Wallet, FileText, LayoutDashboard } from 'lucide-react'
import { ingresosApi } from '../api/finanzas'
import Egresos from './Egresos'

Chart.register(...registerables)

const PERIODOS = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
]

const CAJAS_PREDEFINIDAS = [
  { id: 'caja_general', nombre: 'Caja General', color: '#00519A' },
  { id: 'misiones', nombre: 'Misiones', color: '#10B981' },
  { id: 'construccion', nombre: 'Construcción', color: '#F59E0B' },
  { id: 'benevolencia', nombre: 'Benevolencia', color: '#8B5CF6' },
]

const SUB_SCREENS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { id: 'egresos', label: 'Egresos', icon: TrendingDown },
  { id: 'cajas', label: 'Cajas / Fondos', icon: Wallet },
  { id: 'reportes', label: 'Reportes', icon: FileText },
]

function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-CO')
}

export default function Finanzas({ showToast }) {
  const [currentSub, setCurrentSub] = useState('dashboard')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Finanzas</h1>
          <p>Gestión financiera de la iglesia</p>
        </div>
      </div>

      <div className="finanzas-tabs">
        {SUB_SCREENS.map(screen => {
          const Icon = screen.icon
          return (
            <button
              key={screen.id}
              className={`finanzas-tab ${currentSub === screen.id ? 'active' : ''}`}
              onClick={() => setCurrentSub(screen.id)}
            >
              <Icon size={18} />
              <span>{screen.label}</span>
            </button>
          )
        })}
      </div>

      {currentSub === 'dashboard' && <DashboardFinanzas showToast={showToast} />}
      {currentSub === 'ingresos' && <IngresosSection showToast={showToast} />}
      {currentSub === 'egresos' && <Egresos showToast={showToast} />}
      {currentSub === 'cajas' && <CajasSection showToast={showToast} />}
      {currentSub === 'reportes' && <ReportesSection showToast={showToast} />}
    </div>
  )
}

function DashboardFinanzas({ showToast }) {
  const [periodo, setPeriodo] = useState('mes')
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    loadResumen()
  }, [periodo])

  useEffect(() => {
    return () => {
      if (chartInstance.current) chartInstance.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (resumen?.por_dia?.length && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy()
      const ctx = chartRef.current.getContext('2d')
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: resumen.por_dia.map(d => {
            const [y, m, day] = d.fecha.split('-')
            return `${day}/${m}`
          }),
          datasets: [
            {
              label: 'Diezmos',
              data: resumen.por_dia.map(d => d.diezmos),
              backgroundColor: 'rgba(0, 81, 154, 0.7)',
            },
            {
              label: 'Ofrendas',
              data: resumen.por_dia.map(d => d.ofrendas),
              backgroundColor: 'rgba(201, 168, 76, 0.7)',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } },
        },
      })
    }
  }, [resumen])

  async function loadResumen() {
    setLoading(true)
    try {
      const params = {}
      const now = new Date()
      if (periodo === 'dia') params.fecha = now.toISOString().split('T')[0]
      if (periodo === 'mes') { params.anio = now.getFullYear(); params.mes = now.getMonth() + 1 }
      if (periodo === 'semana') { params.anio = now.getFullYear(); params.semana = getWeekNumber(now) }
      if (periodo === 'anio') params.anio = now.getFullYear()
      const data = await ingresosApi.resumen(periodo, params)
      setResumen(data)
    } catch (err) {
      showToast('Error al cargar resumen: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  const variacion = resumen?.comparativa?.variacion
  const variacionClass = variacion > 0 ? 'up' : variacion < 0 ? 'down' : ''

  return (
    <div>
      <div className="period-tabs" style={{ marginBottom: 20 }}>
        {PERIODOS.map(p => (
          <button
            key={p.key}
            className={`period-tab ${periodo === p.key ? 'active' : ''}`}
            onClick={() => setPeriodo(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-label">Total {periodo}</div>
          <div className="stat-value">{loading ? '...' : formatMoney(resumen?.total)}</div>
          {variacion != null && (
            <div className={`stat-variacion ${variacionClass}`}>
              {variacion > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(variacion)}% vs anterior</span>
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(0, 81, 154, 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Diezmos</div>
          <div className="stat-value">{loading ? '...' : formatMoney(resumen?.diezmos_total)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(201, 168, 76, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Ofrendas</div>
          <div className="stat-value">{loading ? '...' : formatMoney(resumen?.ofrendas_total)}</div>
        </div>
      </div>

      {!loading && resumen?.por_dia?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Detalle por {periodo === 'dia' ? 'día' : periodo === 'semana' ? 'semana' : periodo === 'mes' ? 'mes' : 'año'}</h3>
          </div>
          <div style={{ height: 250 }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      )}
    </div>
  )
}

function IngresosSection({ showToast }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [resumen, setResumen] = useState(null)

  useEffect(() => {
    loadDonations()
    loadResumen()
  }, [])

  async function loadResumen() {
    try {
      const data = await ingresosApi.resumen('mes', { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 })
      setResumen(data)
    } catch {}
  }

  async function loadDonations() {
    setLoading(true)
    try {
      const data = await ingresosApi.listar()
      setDonations(data || [])
    } catch (err) {
      showToast('Error al cargar ingresos', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      if (formData.type === 'Diezmo') {
        await ingresosApi.crearDiezmo({
          monto: Number(formData.monto),
          mes: formData.mes,
          metodo: formData.metodo,
        })
      } else {
        await ingresosApi.crearOfrenda({
          monto: Number(formData.monto),
          metodo: formData.metodo,
          descripcion: formData.descripcion,
        })
      }
      showToast(`${formData.type} registrado correctamente`)
      setShowModal(false)
      loadDonations()
      loadResumen()
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  const filtered = donations.filter(d =>
    d.tipo.toLowerCase().includes(search.toLowerCase()) ||
    (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Registrar Ingreso
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Registro de Ingresos</h3>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Total mes: <strong>{formatMoney(resumen?.total)}</strong>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={64} />
            <h3>Sin ingresos registrados</h3>
            <p>Registra el primer diezmo u ofrenda</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Método</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.created_at).toLocaleDateString('es-CO')}</td>
                    <td>
                      <span className={`badge ${d.tipo === 'Diezmo' ? 'badge-success' : 'badge-info'}`}>
                        {d.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(d.monto)}</td>
                    <td>{d.metodo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <IngresoModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function IngresoModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    type: 'Diezmo',
    monto: '',
    mes: new Date().toLocaleDateString('es-CO', { month: 'long' }),
    metodo: 'Efectivo',
    descripcion: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Ingreso</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Tipo de Ingreso</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="Diezmo">Diezmo</option>
                <option value="Ofrenda">Ofrenda</option>
              </select>
            </div>

            <div className="form-field">
              <label>Monto (COP)</label>
              <input
                type="number"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })}
                placeholder="100000"
                required
              />
            </div>

            {form.type === 'Diezmo' && (
              <div className="form-field">
                <label>Mes</label>
                <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label>Método de Pago</label>
              <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })}>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {form.type === 'Ofrenda' && (
              <div className="form-field">
                <label>Descripción</label>
                <input
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Ofrenda domingo"
                />
              </div>
            )}
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

function CajasSection({ showToast }) {
  const [selectedCaja, setSelectedCaja] = useState(CAJAS_PREDEFINIDAS[0].id)

  return (
    <div>
      <div className="cajas-grid">
        {CAJAS_PREDEFINIDAS.map(caja => (
          <div
            key={caja.id}
            className={`caja-card ${selectedCaja === caja.id ? 'active' : ''}`}
            onClick={() => setSelectedCaja(caja.id)}
            style={{ '--caja-color': caja.color }}
          >
            <div className="caja-header">
              <div className="caja-indicator" style={{ background: caja.color }}></div>
              <span className="caja-nombre">{caja.nombre}</span>
            </div>
            <div className="caja-saldo">
              <span className="caja-saldo-label">Saldo actual</span>
              <span className="caja-saldo-value">$0</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3>Movimientos - {CAJAS_PREDEFINIDAS.find(c => c.id === selectedCaja)?.nombre}</h3>
        </div>
        <div className="empty-state">
          <Wallet size={48} />
          <h3>Sin movimientos</h3>
          <p>Los ingresos y egresos pronto afectarán esta caja</p>
        </div>
      </div>
    </div>
  )
}

function ReportesSection({ showToast }) {
  const [reporteTipo, setReporteTipo] = useState('mensual')

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(0, 81, 154, 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Ingresos año</div>
          <div className="stat-value">$0</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-label">Egresos año</div>
          <div className="stat-value">$0</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-label">Balance año</div>
          <div className="stat-value">$0</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Reportes</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select value={reporteTipo} onChange={e => setReporteTipo(e.target.value)}>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div className="empty-state">
          <PieChart size={48} />
          <h3>Sin datos para Reportar</h3>
          <p>Genera ingresos y egresos para ver reportes</p>
        </div>
      </div>
    </div>
  )
}
