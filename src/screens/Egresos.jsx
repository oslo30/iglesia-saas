import { useState, useEffect } from 'react'
import { Plus, Search, TrendingDown, X, Trash2, Edit2 } from 'lucide-react'
import { egresosApi, categoriasApi } from '../api/finanzas'
import EgresoModal from '../components/EgresoModal'

const ESTADO_COLORS = {
  operativo: { bg: 'rgba(29, 90, 148, 0.1)', color: 'var(--primary)' },
  proyecto:   { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' },
}

function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-CO')
}

export default function Egresos({ showToast }) {
  const [egresos, setEgresos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [filtros, setFiltros] = useState({ tipo: '', categoria_id: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [filtros])

  async function loadData() {
    setLoading(true)
    try {
      const params = {}
      if (filtros.tipo) params.tipo = filtros.tipo
      if (filtros.categoria_id) params.categoria_id = filtros.categoria_id
      const [egresosData, categoriasData] = await Promise.all([
        egresosApi.listar(params),
        categoriasApi.listar(),
      ])
      setEgresos(egresosData || [])
      setCategorias(categoriasData || [])
    } catch (err) {
      showToast('Error al cargar egresos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      if (editData) {
        await egresosApi.actualizar(editData.id, formData)
        showToast('Egreso actualizado')
      } else {
        await egresosApi.crear(formData)
        showToast('Egreso registrado')
      }
      setShowModal(false)
      setEditData(null)
      loadData()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este egreso?')) return
    try {
      await egresosApi.eliminar(id)
      showToast('Egreso eliminado')
      loadData()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  const totalOperativo = egresos.filter(e => e.tipo === 'operativo').reduce((s, e) => s + Number(e.monto), 0)
  const totalProyecto  = egresos.filter(e => e.tipo === 'proyecto').reduce((s, e) => s + Number(e.monto), 0)
  const totalGeneral  = totalOperativo + totalProyecto

  const filtered = egresos.filter(e => {
    const matchSearch = !search ||
      (e.categoria?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.subcategoria?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.descripcion || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Egresos</h1>
          <p>Gastos administrativos y congregacionales</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowModal(true) }}>
            <Plus size={18} /> Registrar Egreso
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--danger)', '--stat-bg': 'rgba(239, 68, 68, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-label">Total General</div>
          <div className="stat-value">{loading ? '...' : formatMoney(totalGeneral)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(29, 90, 148, 0.1)', color: 'var(--primary)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-label">Operativos</div>
          <div className="stat-value">{loading ? '...' : formatMoney(totalOperativo)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-label">De Proyecto</div>
          <div className="stat-value">{loading ? '...' : formatMoney(totalProyecto)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos los tipos</option>
            <option value="operativo">Operativo</option>
            <option value="proyecto">De Proyecto</option>
          </select>
          <select value={filtros.categoria_id} onChange={e => setFiltros({ ...filtros, categoria_id: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <TrendingDown size={64} />
            <h3>Sin egresos registrados</h3>
            <p>Registra el primer egreso</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Subcategoría</th>
                  <th>Tipo</th>
                  <th>Proyecto</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>{new Date(e.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{e.categoria?.nombre || '—'}</td>
                    <td>{e.subcategoria?.nombre || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: ESTADO_COLORS[e.tipo]?.bg, color: ESTADO_COLORS[e.tipo]?.color }}>
                        {e.tipo}
                      </span>
                    </td>
                    <td>{e.proyecto?.nombre || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(e.monto)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => { setEditData(e); setShowModal(true) }}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(e.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <EgresoModal
          categorias={categorias}
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
