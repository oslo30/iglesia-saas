import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Search, Pencil, Trash2, X, Users, Phone, Mail, Calendar, ChevronRight, ChevronLeft, Heart, Briefcase, FileText, Home, Church, User, Check } from 'lucide-react'

const steps = [
  { id: 1, label: 'Datos Personales', icon: User },
  { id: 2, label: 'Contacto', icon: Phone },
  { id: 3, label: 'Estado Familiar', icon: Home },
  { id: 4, label: 'Espiritual', icon: Church },
  { id: 5, label: 'Membresía', icon: FileText },
  { id: 6, label: 'Laboral', icon: Briefcase },
  { id: 7, label: 'Extra', icon: Heart },
]

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
          .update(formData)
          .eq('id', editingMember.id)

        if (error) throw error
        showToast('Miembro actualizado correctamente')
      } else {
        const { error } = await supabase.from('miembros').insert([formData])

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
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.numero_documento || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || m.estado === filter || m.tipo_miembro === filter
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
              placeholder="Buscar por nombre, correo o documento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filters-bar" style={{ marginTop: 12 }}>
            <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
            <button className={`filter-chip ${filter === 'activo' ? 'active' : ''}`} onClick={() => setFilter('activo')}>Activos</button>
            <button className={`filter-chip ${filter === 'inactivo' ? 'active' : ''}`} onClick={() => setFilter('inactivo')}>Inactivos</button>
            <button className={`filter-chip ${filter === 'visitante_frecuente' ? 'active' : ''}`} onClick={() => setFilter('visitante_frecuente')}>Visitantes</button>
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
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th>Ministerio</th>
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
                      <div style={{ fontSize: 13 }}>
                        <div>{member.tipo_documento} {member.numero_documento}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {member.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {member.email}</div>}
                        {member.celular && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {member.celular}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${member.estado === 'activo' ? 'badge-success' : member.estado === 'inactivo' ? 'badge-warning' : 'badge-default'}`}>
                        {member.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{member.ministerio || '-'}</div>
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

const emptyForm = {
  nombre: '',
  apellido: '',
  tipo_documento: 'Cédula',
  numero_documento: '',
  fecha_nacimiento: '',
  sexo: '',
  celular: '',
  telefono_fijo: '',
  email: '',
  direccion: '',
  ciudad_barrio: '',
  estado_civil: '',
  nombre_conyuge: '',
  cantidad_hijos: '',
  nombres_hijos: '',
  fecha_conversion: '',
  esta_bautizado: '',
  fecha_bautismo_agua: '',
  bautizado_por: '',
  recibio_espiritu_santo: '',
  fecha_bautismo_espiritu: '',
  bautismo_espiritu_por: '',
  ministerio: '',
  nivel_compromiso: '',
  fecha_ingreso: '',
  tipo_miembro: 'miembro_activo',
  iglesia_anterior: '',
  estado: 'activo',
  profesion: '',
  empresa: '',
  nivel_estudios: '',
  enfermedades: '',
  discapacidad: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  observaciones: '',
}

function MemberModal({ member, onClose, onSave }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(member ? { ...emptyForm, ...member } : emptyForm)

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="form-grid">
              <div className="form-field">
                <label>Nombres</label>
                <input value={form.nombre} onChange={e => updateField('nombre', e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Apellidos</label>
                <input value={form.apellido} onChange={e => updateField('apellido', e.target.value)} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Tipo de documento</label>
                <select value={form.tipo_documento} onChange={e => updateField('tipo_documento', e.target.value)}>
                  <option value="Cédula">Cédula</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="RUC">RUC</option>
                  <option value="DNI">DNI</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-field">
                <label>Número de documento</label>
                <input value={form.numero_documento} onChange={e => updateField('numero_documento', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Fecha de nacimiento</label>
                <input type="date" value={form.fecha_nacimiento} onChange={e => updateField('fecha_nacimiento', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Sexo / Género</label>
                <select value={form.sexo} onChange={e => updateField('sexo', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <div className="form-grid">
              <div className="form-field">
                <label>Celular</label>
                <input value={form.celular} onChange={e => updateField('celular', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Teléfono fijo</label>
                <input value={form.telefono_fijo} onChange={e => updateField('telefono_fijo', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label>Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Dirección de residencia</label>
                <input value={form.direccion} onChange={e => updateField('direccion', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Ciudad / Barrio</label>
                <input value={form.ciudad_barrio} onChange={e => updateField('ciudad_barrio', e.target.value)} />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <div className="form-grid">
              <div className="form-field">
                <label>Estado civil</label>
                <select value={form.estado_civil} onChange={e => updateField('estado_civil', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="Soltero">Soltero</option>
                  <option value="Casado">Casado</option>
                  <option value="Unión libre">Unión libre</option>
                  <option value="Viudo">Viudo</option>
                  <option value="Divorciado">Divorciado</option>
                </select>
              </div>
              <div className="form-field">
                <label>Nombre del cónyuge</label>
                <input value={form.nombre_conyuge} onChange={e => updateField('nombre_conyuge', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Cantidad de hijos</label>
                <input type="number" min="0" value={form.cantidad_hijos} onChange={e => updateField('cantidad_hijos', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Nombres de hijos</label>
                <input value={form.nombres_hijos} onChange={e => updateField('nombres_hijos', e.target.value)} placeholder="Separados por coma" />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <div className="form-field">
              <label>Fecha de conversión</label>
              <input type="date" value={form.fecha_conversion} onChange={e => updateField('fecha_conversion', e.target.value)} />
            </div>

            <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Bautismo en agua</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>¿Está bautizado?</label>
                  <input value={form.esta_bautizado} onChange={e => updateField('esta_bautizado', e.target.value)} placeholder="Ej: Sí, bautizado / No / Sellado / Lleno" />
                </div>
                <div className="form-field">
                  <label>Fecha de bautismo</label>
                  <input type="date" value={form.fecha_bautismo_agua} onChange={e => updateField('fecha_bautismo_agua', e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Nombre de quien le bautizó</label>
                <input value={form.bautizado_por} onChange={e => updateField('bautizado_por', e.target.value)} />
              </div>
            </div>

            <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Bautismo con el Espíritu Santo</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>¿Recibió el Espíritu Santo?</label>
                  <input value={form.recibio_espiritu_santo} onChange={e => updateField('recibio_espiritu_santo', e.target.value)} placeholder="Ej: Sí / No / Sellado y Lleno" />
                </div>
                <div className="form-field">
                  <label>Fecha</label>
                  <input type="date" value={form.fecha_bautismo_espiritu} onChange={e => updateField('fecha_bautismo_espiritu', e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Nombre de quien ministró</label>
                <input value={form.bautismo_espiritu_por} onChange={e => updateField('bautismo_espiritu_por', e.target.value)} />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Ministerio / Área</label>
                <input value={form.ministerio} onChange={e => updateField('ministerio', e.target.value)} placeholder="Ej: Música, Evangelismo, Niños" />
              </div>
              <div className="form-field">
                <label>Nivel de compromiso</label>
                <select value={form.nivel_compromiso} onChange={e => updateField('nivel_compromiso', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="En formación">En formación</option>
                  <option value="Activo">Activo</option>
                  <option value="Líder">Líder</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <div className="form-field">
              <label>Fecha de ingreso a la iglesia</label>
              <input type="date" value={form.fecha_ingreso} onChange={e => updateField('fecha_ingreso', e.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Tipo de miembro</label>
                <select value={form.tipo_miembro} onChange={e => updateField('tipo_miembro', e.target.value)}>
                  <option value="miembro_activo">Miembro activo</option>
                  <option value="visitante_frecuente">Visitante frecuente</option>
                  <option value="nuevo_convertido">Nuevo convertido</option>
                </select>
              </div>
              <div className="form-field">
                <label>Iglesia anterior</label>
                <input value={form.iglesia_anterior} onChange={e => updateField('iglesia_anterior', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label>Estado</label>
              <select value={form.estado} onChange={e => updateField('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="step-content">
            <div className="form-field">
              <label>Profesión / Oficio</label>
              <input value={form.profesion} onChange={e => updateField('profesion', e.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Empresa</label>
                <input value={form.empresa} onChange={e => updateField('empresa', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Nivel de estudios</label>
                <input value={form.nivel_estudios} onChange={e => updateField('nivel_estudios', e.target.value)} />
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="step-content">
            <div className="form-grid">
              <div className="form-field">
                <label>Enfermedades relevantes</label>
                <input value={form.enfermedades} onChange={e => updateField('enfermedades', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Discapacidad</label>
                <input value={form.discapacidad} onChange={e => updateField('discapacidad', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Contacto de emergencia - Nombre</label>
                <input value={form.contacto_emergencia_nombre} onChange={e => updateField('contacto_emergencia_nombre', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Contacto de emergencia - Teléfono</label>
                <input value={form.contacto_emergencia_telefono} onChange={e => updateField('contacto_emergencia_telefono', e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label>Observaciones pastorales</label>
              <textarea value={form.observaciones} onChange={e => updateField('observaciones', e.target.value)} rows={4} />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{member ? 'Editar' : 'Agregar'} Miembro</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="stepper">
          {steps.map(step => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`stepper-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="stepper-icon">
                  {currentStep > step.id ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className="stepper-label">{step.label}</span>
              </div>
            )
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {renderStepContent()}
          </div>
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              style={{ opacity: currentStep === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={18} /> Anterior
            </button>
            {currentStep < 7 ? (
              <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                Siguiente <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                <Check size={18} /> Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
