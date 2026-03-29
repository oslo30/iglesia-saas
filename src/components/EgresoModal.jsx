import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { proyectosApi } from '../api/proyectos'

export default function EgresoModal({ categorias, editData, onClose, onSave }) {
  const [form, setForm] = useState({
    categoria_id: '',
    subcategoria_id: '',
    monto: '',
    descripcion: '',
    tipo: 'operativo',
    proyecto_id: '',
    fecha: new Date().toISOString().split('T')[0],
  })
  const [proyectos, setProyectos] = useState([])

  useEffect(() => {
    if (editData) {
      setForm({
        categoria_id: editData.categoria_id || '',
        subcategoria_id: editData.subcategoria_id || '',
        monto: editData.monto || '',
        descripcion: editData.descripcion || '',
        tipo: editData.tipo || 'operativo',
        proyecto_id: editData.proyecto_id || '',
        fecha: editData.fecha || new Date().toISOString().split('T')[0],
      })
    }
  }, [editData])

  useEffect(() => {
    if (form.tipo === 'proyecto') {
      proyectosApi.listar({ estado: 'en_progreso' }).then(setProyectos).catch(() => setProyectos([]))
    }
  }, [form.tipo])

  const selectedCategoria = categorias.find(c => c.id === form.categoria_id)
  const subcategorias = selectedCategoria?.subcategorias_egresos || []

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      monto: Number(form.monto),
      categoria_id: form.categoria_id,
      subcategoria_id: form.subcategoria_id || null,
      proyecto_id: form.proyecto_id || null,
    }
    onSave(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editData ? 'Editar Egreso' : 'Registrar Egreso'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value, proyecto_id: '' })}>
                <option value="operativo">Operativo</option>
                <option value="proyecto">De Proyecto</option>
              </select>
            </div>

            <div className="form-field">
              <label>Categoría</label>
              <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value, subcategoria_id: '' })} required>
                <option value="">Seleccionar...</option>
                {categorias.filter(c => c.tipo === form.tipo || (form.tipo === 'operativo')).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {subcategorias.length > 0 && (
              <div className="form-field">
                <label>Subcategoría</label>
                <select value={form.subcategoria_id} onChange={e => setForm({ ...form, subcategoria_id: e.target.value })}>
                  <option value="">Ninguna</option>
                  {subcategorias.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {form.tipo === 'proyecto' && (
              <div className="form-field">
                <label>Proyecto</label>
                <select value={form.proyecto_id} onChange={e => setForm({ ...form, proyecto_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label>Monto (COP)</label>
              <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="50000" required />
            </div>

            <div className="form-field">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            </div>

            <div className="form-field">
              <label>Descripción</label>
              <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del egreso" />
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
