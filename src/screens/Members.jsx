import { useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Mail, Phone, MapPin, X, Plus } from 'lucide-react'
import { supabase } from '../supabase'
import './Members.css'

const statusColors = { activo: '#10B981', visitante: '#3B82F6', inactivo: '#94A3B8' }
const tipoColors = { miembro: '#1E3A5F', visitante: '#8B5CF6', 'servidor laico': '#C9A84C', pastor: '#EF4444' }

export default function Members() {
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const perPage = 5

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('miembros')
      .select('*')
      .order('apellido')

    if (!error) setMembers(data || [])
    setLoading(false)
  }

  async function handleAddMember(formData) {
    console.log('Guardando miembro:', formData)
    const { data, error } = await supabase.from('miembros').insert([{
      nombre: formData.nombre,
      apellido: formData.apellido,
      tipo: formData.tipo || 'miembro',
      estado: 'activo',
      telefono: formData.telefono || null,
      email: formData.email || null,
    }]).select()

    if (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar: ' + error.message)
    } else {
      console.log('Guardado exitoso:', data)
      loadMembers()
      setShowAddModal(false)
    }
  }

  async function handleDeleteMember(id) {
    if (!confirm('¿Desactivar este miembro?')) return
    await supabase.from('miembros').update({ estado: 'inactivo' }).eq('id', id)
    loadMembers()
    setSelected(null)
  }

  const filtered = members.filter(m => {
    const matchSearch =
      (m.nombre + ' ' + m.apellido).toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      m.estado === filter ||
      (m.tipo || '').toLowerCase() === filter
    return matchSearch && matchFilter
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))

  function getInitials(m) {
    return ((m.nombre?.[0] || '') + (m.apellido?.[0] || '')).toUpperCase() || '?'
  }

  return (
    <div className="members-screen">
      <div className="members-header">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(1) }}>Todos</button>
          <button className={filter === 'activo' ? 'active' : ''} onClick={() => { setFilter('activo'); setPage(1) }}>Activos</button>
          <button className={filter === 'visitante' ? 'active' : ''} onClick={() => { setFilter('visitante'); setPage(1) }}>Visitantes</button>
          <button className={filter === 'inactivo' ? 'active' : ''} onClick={() => { setFilter('inactivo'); setPage(1) }}>Inactivos</button>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Agregar Miembro
        </button>
      </div>

      <div className="card members-table-card">
        <table className="members-table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Cargando...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No se encontraron miembros</td></tr>
            ) : (
              paginated.map(m => (
                <tr key={m.id} onClick={() => setSelected(m)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="member-cell">
                      <div className="member-avatar" style={{ background: `linear-gradient(135deg, ${tipoColors[m.tipo] || '#1E3A5F'} 0%, #152942 100%)` }}>
                        {getInitials(m)}
                      </div>
                      <div>
                        <p className="member-name">{m.nombre} {m.apellido}</p>
                        <p className="member-email">{m.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge" style={{ background: `${tipoColors[m.tipo] || '#1E3A5F'}15`, color: tipoColors[m.tipo] || '#1E3A5F' }}>
                      {m.tipo || 'miembro'}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: `${statusColors[m.estado] || '#94A3B8'}15`, color: statusColors[m.estado] || '#94A3B8' }}>
                      <i style={{ background: statusColors[m.estado] || '#94A3B8' }} />
                      {m.estado || 'activo'}
                    </span>
                  </td>
                  <td className="text-muted">{m.telefono || '—'}</td>
                  <td>
                    <button className="more-btn" onClick={e => e.stopPropagation()}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <span className="results-count">
            Mostrando {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, filtered.length)} de {filtered.length} miembros
          </span>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} className={n === page ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="member-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><X size={20} /></button>
            <div className="modal-header">
              <div className="modal-avatar" style={{ background: `linear-gradient(135deg, ${tipoColors[selected.tipo] || '#1E3A5F'} 0%, #152942 100%)` }}>
                {getInitials(selected)}
              </div>
              <div>
                <h2>{selected.nombre} {selected.apellido}</h2>
                <span className="role-badge" style={{ background: `${tipoColors[selected.tipo] || '#1E3A5F'}15`, color: tipoColors[selected.tipo] || '#1E3A5F' }}>
                  {selected.tipo || 'miembro'}
                </span>
              </div>
            </div>
            <div className="modal-tabs">
              <button className="active">Información Personal</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <Mail size={16} />
                  <div>
                    <label>Email</label>
                    <p>{selected.email || '—'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={16} />
                  <div>
                    <label>Teléfono</label>
                    <p>{selected.telefono || '—'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={16} />
                  <div>
                    <label>Estado</label>
                    <p style={{ textTransform: 'capitalize' }}>{selected.estado || 'activo'}</p>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ background: '#EF4444' }} onClick={() => handleDeleteMember(selected.id)}>
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} onSubmit={handleAddMember} />
      )}
    </div>
  )
}

function AddMemberModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', tipo: 'miembro', telefono: '', email: '' })

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="member-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div className="modal-header" style={{ borderTopColor: '#10B981' }}>
          <h2>Agregar Miembro</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="login-field">
              <label>Nombre</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="login-field">
              <label>Apellido</label>
              <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
            </div>
          </div>
          <div className="login-field">
            <label>Tipo</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="miembro">Miembro</option>
              <option value="visitante">Visitante</option>
              <option value="servidor laico">Servidor Laico</option>
              <option value="pastor">Pastor</option>
            </select>
          </div>
          <div className="login-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="login-field">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
