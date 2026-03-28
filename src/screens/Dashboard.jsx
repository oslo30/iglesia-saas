import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Users, DollarSign, Calendar, TrendingUp, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard({ showToast }) {
  const [stats, setStats] = useState({ miembros: 0, diezmos: 0, ofrendas: 0, asistencia: 0 })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [
        miembrosRes,
        diezmosRes,
        ofrendasRes,
        asistenciaRes
      ] = await Promise.all([
        supabase.from('miembros').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('diezmos').select('monto'),
        supabase.from('ofrendas').select('monto'),
        supabase.from('registros_asistencia').select('total')
      ])

      const totalDiezmos = diezmosRes.data?.reduce((s, d) => s + Number(d.monto), 0) || 0
      const totalOfrendas = ofrendasRes.data?.reduce((s, d) => s + Number(d.monto), 0) || 0
      const avgAsistencia = asistenciaRes.data?.length
        ? Math.round(asistenciaRes.data.reduce((s, r) => s + (r.total || 0), 0) / asistenciaRes.data.length)
        : 0

      setStats({
        miembros: miembrosRes.count || 0,
        diezmos: totalDiezmos,
        ofrendas: totalOfrendas,
        asistencia: avgAsistencia
      })
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatMoney(amount) {
    if (amount >= 1000000) {
      return '$' + (amount / 1000000).toFixed(1) + 'M'
    }
    return '$' + amount.toLocaleString('es-CO')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Panel Principal</h1>
          <p>Resumen de actividad de tu iglesia</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'rgba(30, 58, 95, 0.1)' }}>
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-label">Total Miembros</div>
          <div className="stat-value">{loading ? '...' : stats.miembros}</div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>Activos</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-label">Diezmos Totales</div>
          <div className="stat-value">{loading ? '...' : formatMoney(stats.diezmos)}</div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>Este mes</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'rgba(201, 168, 76, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(201, 168, 76, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Ofrendas Totales</div>
          <div className="stat-value">{loading ? '...' : formatMoney(stats.ofrendas)}</div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>Este mes</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--info)', '--stat-bg': 'rgba(59, 130, 246, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-label">Asistencia Promedio</div>
          <div className="stat-value">{loading ? '...' : stats.asistencia}</div>
          <div className="stat-change up">
            <ArrowUpRight size={14} />
            <span>Por servicio</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Bienvenido al Sistema de Gestión</h3>
          <p>Usa el menú lateral para navegar entre las diferentes secciones</p>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: 16 }}>
            Este sistema te permite gestionar los miembros de tu iglesia, registrar diezmos y ofrendas,
            llevar control de asistencia y administrar eventos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = 'members' }} className="btn btn-primary">
              <Plus size={18} /> Agregar Miembro
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = 'donations' }} className="btn btn-secondary">
              <DollarSign size={18} /> Registrar Diezmo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
