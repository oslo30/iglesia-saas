import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Users, Calendar, TrendingUp } from 'lucide-react'

export default function Attendance({ showToast }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, promedio: 0, registros: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from('registros_asistencia')
        .select('*, servicios(nombre)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setRecords(data || [])

      const total = data?.reduce((s, r) => s + (r.total || 0), 0) || 0
      const promedio = data?.length ? Math.round(total / data.length) : 0

      setStats({
        total,
        promedio,
        registros: data?.length || 0
      })
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al cargar asistencia', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Control de Asistencia</h1>
          <p>Registro de asistencia a los servicios</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'rgba(30, 58, 95, 0.1)' }}>
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-label">Total Asistentes</div>
          <div className="stat-value">{loading ? '...' : stats.total}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Promedio por Servicio</div>
          <div className="stat-value">{loading ? '...' : stats.promedio}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--info)', '--stat-bg': 'rgba(59, 130, 246, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-label">Total Registros</div>
          <div className="stat-value">{loading ? '...' : stats.registros}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Historial de Asistencia</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>Sin registros de asistencia</h3>
            <p>Los registros aparecerán aquí cuando se registren desde la aplicación de portería</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>Adultos</th>
                  <th>Niños</th>
                  <th>Visitantes</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{new Date(record.created_at).toLocaleDateString('es-CO')}</td>
                    <td>{record.servicios?.nombre || 'Servicio'}</td>
                    <td>{record.adultos || 0}</td>
                    <td>{record.ninos || 0}</td>
                    <td>{record.amigos || 0}</td>
                    <td style={{ fontWeight: 600 }}>{record.total || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
