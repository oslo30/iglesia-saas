import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus } from 'lucide-react'

export default function Donations() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadDonations()
  }, [])

  async function loadDonations() {
    try {
      const { data, error } = await supabase
        .from('diezmos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setDonations(data || [])
    } catch (err) {
      console.error('Error loading donations:', err)
      showToast('Error al cargar donaciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      const { error } = await supabase.from('diezmos').insert([{
        miembro_id: formData.miembro_id || null,
        monto: Number(formData.monto),
        mes: formData.mes,
        ano: new Date().getFullYear(),
        metodo: formData.metodo,
      }])

      if (error) throw error
      showToast('Donación registrada')
      setShowModal(false)
      loadDonations()
    } catch (err) {
      console.error('Error saving:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Finanzas - Diezmos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Registrar Diezmo
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
        ) : donations.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No hay diezmos registrados
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Mes</th>
                <th>Monto</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString('es-CO')}</td>
                  <td>{d.mes}</td>
                  <td>{formatMoney(d.monto)}</td>
                  <td>{d.metodo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <DonationModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

function DonationModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    monto: '',
    mes: new Date().toLocaleDateString('es-CO', { month: 'long' }),
    metodo: 'Transferencia',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Diezmo</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Monto (COP)</label>
            <input
              type="number"
              value={form.monto}
              onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="100000"
              required
            />
          </div>

          <div className="login-field">
            <label>Mes</label>
            <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}>
              <option value="Enero">Enero</option>
              <option value="Febrero">Febrero</option>
              <option value="Marzo">Marzo</option>
              <option value="Abril">Abril</option>
              <option value="Mayo">Mayo</option>
              <option value="Junio">Junio</option>
              <option value="Julio">Julio</option>
              <option value="Agosto">Agosto</option>
              <option value="Septiembre">Septiembre</option>
              <option value="Octubre">Octubre</option>
              <option value="Noviembre">Noviembre</option>
              <option value="Diciembre">Diciembre</option>
            </select>
          </div>

          <div className="login-field">
            <label>Método de Pago</label>
            <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
