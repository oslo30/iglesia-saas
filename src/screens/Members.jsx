import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Search, Pencil, Trash2, X, Users, Phone, Mail, Calendar } from 'lucide-react'

export default function Members({ showToast }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('miembros')
        .select('*')
        .order('apellido')

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al cargar miembros', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData) {
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('miembros')
          .update({
            nombre: formData.nombre,
            apellido: formData.apellido,
            tipo: formData.tipo,
            estado: formData.estado,
            telefono: formData.telefono || null,
            email: formData.email || null,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            direccion: formData.direccion || null,
          })
          .eq('id', editingMember.id)

        if (error) throw error
        showToast('Miembro actualizado correctamente')
      } else {
        const { error } = await supabase.from('miembros').insert([{
          nombre: formData.nombre,
          apellido: formData.apellido,
          tipo: formData.tipo,
          estado: formData.estado,
          telefono: formData.telefono || null,
          email: formData.email || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          direccion: formData.direccion || null,
        }])

        if (error) throw error
        showToast('Miembro agregado correctamente')
      }

      setShowModal(false)
      setEditingMember(null)
      loadMembers()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return

    try {
      const { error } = await supabase.from('miembros').delete().eq('id', id)
      if (error) throw error
      showToast('Miembro eliminado')
      loadMembers()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      `${m.nombre} ${m.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || m.estado === filter || m.tipo === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Miembros</h1>
          <p>Gestiona los miembros de tu iglesia</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingMember(null); setShowModal(true) }}>
            <Plus size={18} /> Agregar Miembro
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filters-bar" style={{ marginTop: 12 }}>
            <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
            <button className={`filter-chip ${filter === 'activo' ? 'active' : ''}`} onClick={() => setFilter('activo')}>Activos</button>
            <button className={`filter-chip ${filter === 'inactivo' ? 'active' : ''}`} onClick={() => setFilter('inactivo')}>Inactivos</button>
            <button className={`filter-chip ${filter === 'visitante' ? 'active' : ''}`} onClick={() => setFilter('visitante')}>Visitantes</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>No hay miembros</h3>
            <p>Comienza agregando tu primer miembro</p>
            <button className="btn btn-primary" onClick={() => { setEditingMember(null); setShowModal(true) }}>
              <Plus size={18} /> Agregar Miembro
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Contacto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar">{member.nombre?.[0]}{member.apellido?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{member.nombre} {member.apellido}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {member.fecha_nacimiento ? `Nac: ${member.fecha_nacimiento}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${member.tipo === 'visitante' ? 'badge-info' : 'badge-default'}`}>
                        {member.tipo || 'miembro'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${member.estado === 'activo' ? 'badge-success' : 'badge-warning'}`}>
                        {member.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {member.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {member.email}</div>}
                        {member.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {member.telefono}</div>}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingMember(member); setShowModal(true) }}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(member.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={16} />
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
        <MemberModal
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: member?.nombre || '',
    apellido: member?.apellido || '',
    tipo: member?.tipo || 'miembro',
    estado: member?.estado || 'activo',
    telefono: member?.telefono || '',
    email: member?.email || '',
    fecha_nacimiento: member?.fecha_nacimiento || '',
    direccion: member?.direccion || '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{member ? 'Editar' : 'Agregar'} Miembro</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Apellido</label>
                <input
                  value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="miembro">Miembro</option>
                  <option value="visitante">Visitante</option>
                  <option value="servidor">Servidor</option>
                </select>
              </div>
              <div className="form-field">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Dirección</label>
                <input
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
            </div>
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
