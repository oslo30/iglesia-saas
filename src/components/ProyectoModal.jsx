import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ProyectoModal({ editData, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    estado: 'por_iniciar',
    meta_porcentaje: 0,
    fecha_inicio: '',
    fecha_fin_estimada: '',
    presupuesto_proyectado: '',
    cotizacion_url: '',
    notas: '',
  })

  useEffect(() => {
    if (editData) {
      setForm({
        nombre: editData.nombre || '',
        descripcion: editData.descripcion || '',
        estado: editData.estado || 'por_iniciar',
        meta_porcentaje: editData.meta_porcentaje || 0,
        fecha_inicio: editData.fecha_inicio || '',
        fecha_fin_estimada: editData.fecha_fin_estimada || '',
        presupuesto_proyectado: editData.presupuesto_proyectado || '',
        cotizacion_url: editData.cotizacion_url || '',
        notas: editData.notas || '',
      })
    }
  }, [editData])

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
    if (payload.presupuesto_proyectado) payload.presupuesto_proyectado = Number(payload.presupuesto_proyectado)
    else payload.presupuesto_proyectado = null
    payload.meta_porcentaje = Number(payload.meta_porcentaje) || 0
    onSave(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editData ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Construcción de oficina" required />
            </div>

            <div className="form-field">
              <label>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del proyecto" rows={2} />
            </div>

            <div className="form-field">
              <label>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="por_iniciar">Por Iniciar</option>
                <option value="en_progreso">En Progreso</option>
                <option value="en_pausa">En Pausa</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div className="form-field">
              <label>Meta de Avance (%)</label>
              <input type="number" min="0" max="100" value={form.meta_porcentaje} onChange={e => setForm({ ...form, meta_porcentaje: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Fecha Inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Fecha Fin Estimada</label>
                <input type="date" value={form.fecha_fin_estimada} onChange={e => setForm({ ...form, fecha_fin_estimada: e.target.value })} />
              </div>
            </div>

            <div className="form-field">
              <label>Presupuesto Proyectado (COP)</label>
              <input type="number" value={form.presupuesto_proyectado} onChange={e => setForm({ ...form, presupuesto_proyectado: e.target.value })} placeholder="Ej: 5000000" />
            </div>

            <div className="form-field">
              <label>URL de Cotización</label>
              <input type="url" value={form.cotizacion_url} onChange={e => setForm({ ...form, cotizacion_url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="form-field">
              <label>Notas</label>
              <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
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
