import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('miembros')
        .select('id, nombre, apellido, tipo, estado, telefono, email')
        .order('apellido')

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error loading members:', err)
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
          })
          .eq('id', editingMember.id)

        if (error) throw error
        showToast('Miembro actualizado')
      } else {
        const { error } = await supabase.from('miembros').insert([{
          nombre: formData.nombre,
          apellido: formData.apellido,
          tipo: formData.tipo || 'miembro',
          estado: formData.estado || 'activo',
          telefono: formData.telefono || null,
          email: formData.email || null,
        }])

        if (error) throw error
        showToast('Miembro agregado')
      }

      setShowModal(false)
      setEditingMember(null)
      loadMembers()
    } catch (err) {
      console.error('Error saving:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este miembro?')) return

    try {
      const { error } = await supabase.from('miembros').delete().eq('id', id)
      if (error) throw error
      showToast('Miembro eliminado')
      loadMembers()
    } catch (err) {
      console.error('Error deleting:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Miembros</h1>
        <button className="btn btn-primary" onClick={() => { setEditingMember(null); setShowModal(true) }}>
          <Plus size={18} /> Agregar Miembro
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
        ) : members.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No hay miembros registrados
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.nombre} {member.apellido}</td>
                  <td>
                    <span className="badge badge-success">{member.tipo || 'miembro'}</span>
                  </td>
                  <td>
                    <span className={`badge ${member.estado === 'activo' ? 'badge-success' : 'badge-warning'}`}>
                      {member.estado}
                    </span>
                  </td>
                  <td>{member.telefono || '—'}</td>
                  <td>{member.email || '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => { setEditingMember(member); setShowModal(true) }}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(member.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <MemberModal
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null) }}
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

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: member?.nombre || '',
    apellido: member?.apellido || '',
    tipo: member?.tipo || 'miembro',
    estado: member?.estado || 'activo',
    telefono: member?.telefono || '',
    email: member?.email || '',
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
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="login-field">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="login-field">
              <label>Apellido</label>
              <input
                value={form.apellido}
                onChange={e => setForm({ ...form, apellido: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="login-field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="miembro">Miembro</option>
                <option value="visitante">Visitante</option>
                <option value="servidor">Servidor</option>
              </select>
            </div>
            <div className="login-field">
              <label>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="login-field">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
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
