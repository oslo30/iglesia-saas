import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Edit2, Trash2, ChevronRight, TrendingUp } from 'lucide-react'
import { proyectosApi } from '../api/proyectos'
import ProyectoModal from '../components/ProyectoModal'
import ProyectoDetail from '../components/ProyectoDetail'

const ESTADOS = ['por_iniciar', 'en_progreso', 'en_pausa', 'completado']
const ESTADO_LABELS = {
  por_iniciar: 'Por Iniciar',
  en_progreso: 'En Progreso',
  en_pausa: 'En Pausa',
  completado: 'Completado',
}
const ESTADO_COLORS = {
  por_iniciar: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280', border: '#6B7280' },
  en_progreso: { bg: 'rgba(29, 90, 148, 0.1)', color: 'var(--primary)', border: 'var(--primary)' },
  en_pausa:   { bg: 'rgba(201, 168, 76, 0.1)',  color: 'var(--accent)', border: 'var(--accent)' },
  completado: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: 'var(--success)' },
}

function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-CO')
}

export default function Proyectos({ showToast }) {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [selectedProyecto, setSelectedProyecto] = useState(null)
  const [filterEstado, setFilterEstado] = useState('')

  useEffect(() => { loadProyectos() }, [filterEstado])

  async function loadProyectos() {
    setLoading(true)
    try {
      const params = {}
      if (filterEstado) params.estado = filterEstado
      const data = await proyectosApi.listar(params)
      setProyectos(data || [])
    } catch (err) {
      showToast('Error al cargar proyectos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      if (editData) {
        await proyectosApi.actualizar(editData.id, formData)
        showToast('Proyecto actualizado')
      } else {
        await proyectosApi.crear(formData)
        showToast('Proyecto creado')
      }
      setShowModal(false)
      setEditData(null)
      loadProyectos()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este proyecto?')) return
    try {
      await proyectosApi.eliminar(id)
      showToast('Proyecto eliminado')
      loadProyectos()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleCambiarEstado(id, estado) {
    try {
      await proyectosApi.cambiarEstado(id, estado)
      showToast(`Proyecto movido a ${ESTADO_LABELS[estado]}`)
      loadProyectos()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  // Si hay proyecto seleccionado, mostrar detalle
  if (selectedProyecto) {
    return (
      <ProyectoDetail
        proyecto={selectedProyecto}
        onBack={() => setSelectedProyecto(null)}
        onEdit={(p) => { setEditData(p); setShowModal(true) }}
        showToast={showToast}
        onRefresh={loadProyectos}
      />
    )
  }

  const grouped = {}
  for (const est of ESTADOS) grouped[est] = proyectos.filter(p => p.estado === est)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Proyectos</h1>
          <p>Proyectos locativos y metas de la congregación</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowModal(true) }}>
            <Plus size={18} /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${filterEstado === '' ? 'btn-primary' : ''}`}
            onClick={() => setFilterEstado('')}
          >
            Todos
          </button>
          {ESTADOS.map(e => (
            <button
              key={e}
              className={`btn btn-sm ${filterEstado === e ? 'btn-primary' : ''}`}
              onClick={() => setFilterEstado(e)}
              style={filterEstado === e ? {} : { background: ESTADO_COLORS[e].bg, color: ESTADO_COLORS[e].color, borderColor: ESTADO_COLORS[e].border }}
            >
              {ESTADO_LABELS[e]} ({grouped[e].length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {ESTADOS.map(estado => (
            <div key={estado}>
              <div style={{
                fontWeight: 600,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: ESTADO_COLORS[estado].color,
                marginBottom: 8,
                padding: '4px 8px',
                background: ESTADO_COLORS[estado].bg,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {ESTADO_LABELS[estado]}
                <span style={{ marginLeft: 'auto', fontSize: 11 }}>{grouped[estado].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {grouped[estado].length === 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF', fontSize: 13 }}>
                    Sin proyectos
                  </div>
                )}
                {grouped[estado].map(p => (
                  <div key={p.id} className="card" style={{ padding: 16, cursor: 'pointer' }}
                    onClick={() => setSelectedProyecto(p)}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.nombre}</div>
                    {p.descripcion && (
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                        {p.descripcion.substring(0, 60)}{p.descripcion.length > 60 ? '...' : ''}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span>Meta</span>
                        <span>{p.meta_porcentaje || 0}%</span>
                      </div>
                      <div style={{ background: '#E5E7EB', borderRadius: 4, height: 6 }}>
                        <div style={{
                          width: `${p.meta_porcentaje || 0}%`,
                          background: ESTADO_COLORS[estado].color,
                          borderRadius: 4,
                          height: 6,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>

                    {/* Presupuesto */}
                    {p.presupuesto_proyectado && (
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        <TrendingUp size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {formatMoney(p.inversion_actual || 0)} / {formatMoney(p.presupuesto_proyectado)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {estado !== 'completado' && estado !== 'en_progreso' && (
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={(e) => { e.stopPropagation(); handleCambiarEstado(p.id, estado === 'por_iniciar' ? 'en_progreso' : estado === 'en_pausa' ? 'en_progreso' : 'completado') }}
                        >
                          {estado === 'por_iniciar' ? 'Iniciar' : 'Reanudar'}
                        </button>
                      )}
                      <button
                        className="btn btn-sm"
                        style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }}
                        onClick={(e) => { e.stopPropagation(); setEditData(p); setShowModal(true) }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProyectoModal
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
