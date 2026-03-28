import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Search, DollarSign, X, Download, TrendingUp } from 'lucide-react'

export default function Donations({ showToast }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, diezmos: 0, ofrendas: 0 })

  useEffect(() => {
    loadDonations()
  }, [])

  async function loadDonations() {
    try {
      const [diezmosRes, ofrendasRes] = await Promise.all([
        supabase.from('diezmos').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('ofrendas').select('*').order('created_at', { ascending: false }).limit(100),
      ])

      const dz = diezmosRes.data || []
      const of = ofrendasRes.data || []

      const allDonations = [
        ...dz.map(d => ({ ...d, type: 'Diezmo' })),
        ...of.map(o => ({ ...o, type: 'Ofrenda' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setDonations(allDonations)

      const totalDz = dz.reduce((s, d) => s + Number(d.monto || 0), 0)
      const totalOf = of.reduce((s, o) => s + Number(o.monto || 0), 0)

      setStats({
        total: totalDz + totalOf,
        diezmos: totalDz,
        ofrendas: totalOf,
      })
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al cargar donaciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      if (formData.type === 'Diezmo') {
        const { error } = await supabase.from('diezmos').insert([{
          miembro_id: formData.miembro_id || null,
          monto: Number(formData.monto),
          mes: formData.mes,
          ano: new Date().getFullYear(),
          metodo: formData.metodo,
        }])
        if (error) throw error
      } else {
        const { error } = await supabase.from('ofrendas').insert([{
          monto: Number(formData.monto),
          metodo: formData.metodo,
          descripcion: formData.descripcion,
        }])
        if (error) throw error
      }

      showToast(`${formData.type} registrado correctamente`)
      setShowModal(false)
      loadDonations()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  function formatMoney(amount) {
    return '$' + Number(amount || 0).toLocaleString('es-CO')
  }

  const filteredDonations = donations.filter(d =>
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Finanzas</h1>
          <p>Gestiona diezmos y ofrendas</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Registrar Contribución
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-label">Total General</div>
          <div className="stat-value">{formatMoney(stats.total)}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'rgba(30, 58, 95, 0.1)' }}>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Diezmos</div>
          <div className="stat-value">{formatMoney(stats.diezmos)}</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'rgba(201, 168, 76, 0.1)' }}>
          <div className="stat-icon" style={{ '--stat-bg': 'rgba(201, 168, 76, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-label">Ofrendas</div>
          <div className="stat-value">{formatMoney(stats.ofrendas)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Registro de Contribuciones</h3>
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
        ) : filteredDonations.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={64} />
            <h3>Sin contribuciones registradas</h3>
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
                {filteredDonations.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.created_at).toLocaleDateString('es-CO')}</td>
                    <td>
                      <span className={`badge ${d.type === 'Diezmo' ? 'badge-success' : 'badge-info'}`}>
                        {d.type}
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
        <DonationModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function DonationModal({ onClose, onSave }) {
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
          <h2>Registrar Contribución</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Tipo de Contribución</label>
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
