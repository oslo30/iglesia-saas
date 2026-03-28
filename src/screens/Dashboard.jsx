import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ miembros: 0, diezmos: 0, ofrendas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [miembrosRes, diezmosRes, ofrendasRes] = await Promise.all([
        supabase.from('miembros').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('diezmos').select('monto'),
        supabase.from('ofrendas').select('monto'),
      ])

      const totalDiezmos = diezmosRes.data?.reduce((s, d) => s + Number(d.monto), 0) || 0
      const totalOfrendas = ofrendasRes.data?.reduce((s, d) => s + Number(d.monto), 0) || 0

      setStats({
        miembros: miembrosRes.count || 0,
        diezmos: totalDiezmos,
        ofrendas: totalOfrendas,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Panel Principal</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Miembros</div>
          <div className="value">{loading ? '...' : stats.miembros}</div>
        </div>
        <div className="stat-card">
          <div className="label">Diezmos Totales</div>
          <div className="value">{loading ? '...' : formatMoney(stats.diezmos)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Ofrendas Totales</div>
          <div className="value">{loading ? '...' : formatMoney(stats.ofrendas)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Bienvenido</h3>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>
          Este es el sistema de gestión de tu iglesia. Usa el menú lateral para navegar entre las diferentes secciones.
        </p>
      </div>
    </div>
  )
}
