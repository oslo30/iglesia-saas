import { useState, useEffect } from 'react'
import { ArrowLeft, Edit2, TrendingUp, ExternalLink } from 'lucide-react'
import { proyectosApi } from '../api/proyectos'

function formatMoney(amount) {
  return '$' + Number(amount || 0).toLocaleString('es-CO')
}

export default function ProyectoDetail({ proyecto, onBack, onEdit, showToast, onRefresh }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    proyectosApi.estadisticas(proyecto.id)
      .then(setStats)
      .catch(err => showToast('Error: ' + err.message, 'error'))
      .finally(() => setLoading(false))
  }, [proyecto.id])

  const p = stats || proyecto
  const quantoFalta = p.presupuesto_proyectado
    ? Number(p.presupuesto_proyectado) - Number(p.inversion_actual || 0)
    : null

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-sm" onClick={onBack}><ArrowLeft size={18} /></button>
          <div>
            <h1>{p.nombre}</h1>
            {p.descripcion && <p style={{ margin: 0, color: '#6B7280' }}>{p.descripcion}</p>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={() => onEdit(p)}><Edit2 size={16} /> Editar</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Avance del Proyecto</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Meta: {p.meta_porcentaje || 0}%</span>
              {p.porcentaje_real != null && <span>Real: {p.porcentaje_real}%</span>}
            </div>
            <div style={{ background: '#E5E7EB', borderRadius: 8, height: 12 }}>
              <div style={{
                width: `${p.meta_porcentaje || 0}%`,
                background: 'var(--primary)',
                borderRadius: 8,
                height: 12,
              }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Fecha Inicio</div>
            <div>{p.fecha_inicio || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Fecha Fin Est.</div>
            <div>{p.fecha_fin_estimada || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Fecha Fin Real</div>
            <div>{p.fecha_fin_real || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Estado</div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.estado?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Budget */}
      {p.presupuesto_proyectado && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Presupuesto</div>
            <div className="stat-value">{formatMoney(p.presupuesto_proyectado)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inversión Actual</div>
            <div className="stat-value">{loading ? '...' : formatMoney(p.inversion_actual)}</div>
          </div>
          <div className="stat-card" style={{ '--stat-color': quantoFalta < 0 ? 'var(--danger)' : 'var(--success)', '--stat-bg': quantoFalta < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}>
            <div className="stat-label">{quantoFalta >= 0 ? 'Quanto Falta' : 'Sobre presupuesto'}</div>
            <div className="stat-value">{loading ? '...' : formatMoney(Math.abs(quantoFalta))}</div>
          </div>
        </div>
      )}

      {/* Cotización */}
      {p.cotizacion_url && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Documentos</h3>
          <a href={p.cotizacion_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
            <ExternalLink size={16} /> Ver Cotización
          </a>
        </div>
      )}

      {/* Notas */}
      {p.notas && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Notas</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{p.notas}</p>
        </div>
      )}

      {/* Egresos linked */}
      {p.egresos_linked?.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Egresos Vinculados ({p.egresos_linked.length})</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {p.egresos_linked.map(e => (
                  <tr key={e.id}>
                    <td>{new Date(e.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{e.categoria?.nombre || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(e.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
