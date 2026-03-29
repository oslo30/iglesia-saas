import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Search, Pencil, Trash2, X, Users, Phone, Mail, Calendar, ChevronRight, ChevronLeft, Heart, Briefcase, FileText, Home, Church, User, Check, Eye, Clock, MapPin, Star, TrendingUp } from 'lucide-react'
import { participacionesApi, getLabelRol, getClasificacion } from '../api/participaciones'

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
  const [selectedMember, setSelectedMember] = useState(null)

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
      const dateFields = ['fecha_nacimiento', 'fecha_conversion', 'fecha_bautismo_agua', 'fecha_bautismo_espiritu', 'fecha_ingreso']
      const cleanedData = {}
      for (const key in formData) {
        if (dateFields.includes(key) && formData[key] === '') {
          cleanedData[key] = null
        } else {
          cleanedData[key] = formData[key] || null
        }
      }

      if (editingMember) {
        const { error } = await supabase
          .from('miembros')
          .update(cleanedData)
          .eq('id', editingMember.id)

        if (error) throw error
        showToast('Miembro actualizado correctamente')
      } else {
        const { error } = await supabase.from('miembros').insert([cleanedData])

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
      setSelectedMember(null)
      loadMembers()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  const filteredMembers = members.filter(m => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchLower) ||
      (m.email || '').toLowerCase().includes(searchLower) ||
      (m.celular || '').toLowerCase().includes(searchLower) ||
      (m.numero_documento || '').toLowerCase().includes(searchLower)

    let matchesFilter = true
    if (filter === 'activo') matchesFilter = m.estado === 'activo'
    else if (filter === 'inactivo') matchesFilter = m.estado === 'inactivo'
    else if (filter === 'visitante') matchesFilter = m.tipo_miembro === 'visitante_frecuente'

    return matchesSearch && matchesFilter
  })

  const filterCounts = {
    all: members.length,
    activo: members.filter(m => m.estado === 'activo').length,
    inactivo: members.filter(m => m.estado === 'inactivo').length,
    visitante: members.filter(m => m.tipo_miembro === 'visitante_frecuente').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Miembros</h1>
          <p>{members.length} miembros registrados</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingMember(null); setShowModal(true) }}>
            <Plus size={18} /> Agregar Miembro
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="members-toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos <span className="chip-count">{filterCounts.all}</span>
          </button>
          <button
            className={`filter-chip ${filter === 'activo' ? 'active' : ''}`}
            onClick={() => setFilter('activo')}
          >
            Activos <span className="chip-count">{filterCounts.activo}</span>
          </button>
          <button
            className={`filter-chip ${filter === 'inactivo' ? 'active' : ''}`}
            onClick={() => setFilter('inactivo')}
          >
            Inactivos <span className="chip-count">{filterCounts.inactivo}</span>
          </button>
          <button
            className={`filter-chip ${filter === 'visitante' ? 'active' : ''}`}
            onClick={() => setFilter('visitante')}
          >
            Visitantes <span className="chip-count">{filterCounts.visitante}</span>
          </button>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="members-loading">
          <div className="spinner" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={64} />
            <h3>No hay miembros</h3>
            <p>{search ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer miembro'}</p>
            {!search && (
              <button className="btn btn-primary" onClick={() => { setEditingMember(null); setShowModal(true) }}>
                <Plus size={18} /> Agregar Miembro
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="members-grid">
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onView={() => setSelectedMember(member)}
              onEdit={() => { setEditingMember(member); setShowModal(true) }}
              onDelete={() => handleDelete(member.id)}
            />
          ))}
        </div>
      )}

      {/* Member Drawer */}
      {selectedMember && (
        <MemberDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onEdit={() => { setEditingMember(selectedMember); setShowModal(true); setSelectedMember(null) }}
          onDelete={() => handleDelete(selectedMember.id)}
        />
      )}

      {/* Modal */}
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

function MemberCard({ member, onView, onEdit, onDelete }) {
  const initials = `${member.nombre?.[0] || ''}${member.apellido?.[0] || ''}`.toUpperCase()
  const displayContact = member.celular || member.email || 'Sin contacto'

  function getEstadoBadge(estado) {
    const map = {
      activo: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', label: 'Activo' },
      inactivo: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', label: 'Inactivo' },
      suspendido: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', label: 'Suspendido' },
    }
    return map[estado] || { bg: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', label: estado }
  }

  function getCompromisoBadge(compromiso) {
    const map = {
      'Líder': { bg: 'rgba(0, 81, 154, 0.1)', color: '#00519A' },
      'Activo': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
      'En formación': { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
      'Nuevo': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
    }
    return map[compromiso] || null
  }

  const estadoBadge = getEstadoBadge(member.estado)
  const compromisoBadge = getCompromisoBadge(member.nivel_compromiso)

  return (
    <div className="member-card" onClick={onView}>
      <div className="member-card-header">
        <div className="member-avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          {initials}
        </div>
        <div className="member-card-actions" onClick={e => e.stopPropagation()}>
          <button className="member-action-btn" onClick={onView} title="Ver perfil">
            <Eye size={16} />
          </button>
          <button className="member-action-btn" onClick={onEdit} title="Editar">
            <Pencil size={16} />
          </button>
          <button className="member-action-btn danger" onClick={onDelete} title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="member-card-body">
        <h3 className="member-name">{member.nombre} {member.apellido}</h3>
        <p className="member-contact">{displayContact}</p>

        <div className="member-badges">
          <span className="member-badge" style={{ background: estadoBadge.bg, color: estadoBadge.color }}>
            {estadoBadge.label}
          </span>
          {compromisoBadge && (
            <span className="member-badge" style={{ background: compromisoBadge.bg, color: compromisoBadge.color }}>
              {member.nivel_compromiso}
            </span>
          )}
          {member.estado_civil && (
            <span className="member-badge" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#64748B' }}>
              {member.estado_civil}
            </span>
          )}
          {member.ministerio && (
            <span className="member-badge" style={{ background: 'rgba(201, 168, 76, 0.15)', color: '#B8860B' }}>
              {member.ministerio}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MemberDrawer({ member, onClose, onEdit, onDelete }) {
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const initials = `${member.nombre?.[0] || ''}${member.apellido?.[0] || ''}`.toUpperCase()

  useEffect(() => {
    loadStats()
  }, [member.id])

  async function loadStats() {
    setLoadingStats(true)
    try {
      const data = await participacionesApi.getEstadisticasMiembro(member.id)
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const clasificacion = stats?.clasificacion || { label: 'Sin datos', color: '#94A3B8' }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <div className="member-avatar-xl" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
              {initials}
            </div>
            <div>
              <h2>{member.nombre} {member.apellido}</h2>
              <p>{member.email || member.celular || 'Sin contacto'}</p>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="drawer-content">
          {/* Datos Personales */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Datos Personales</h4>
            <div className="drawer-field">
              <span className="drawer-label">Documento</span>
              <span className="drawer-value">{member.tipo_documento} {member.numero_documento}</span>
            </div>
            <div className="drawer-field">
              <span className="drawer-label">Fecha de nacimiento</span>
              <span className="drawer-value">{member.fecha_nacimiento || 'No registrada'}</span>
            </div>
            <div className="drawer-field">
              <span className="drawer-label">Sexo</span>
              <span className="drawer-value">{member.sexo || 'No registrado'}</span>
            </div>
          </div>

          {/* Contacto */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Contacto</h4>
            {member.celular && <div className="drawer-field"><span className="drawer-label">Celular</span><span className="drawer-value">{member.celular}</span></div>}
            {member.telefono_fijo && <div className="drawer-field"><span className="drawer-label">Teléfono</span><span className="drawer-value">{member.telefono_fijo}</span></div>}
            {member.email && <div className="drawer-field"><span className="drawer-label">Email</span><span className="drawer-value">{member.email}</span></div>}
            {member.direccion && <div className="drawer-field"><span className="drawer-label">Dirección</span><span className="drawer-value">{member.direccion}</span></div>}
            {member.ciudad_barrio && <div className="drawer-field"><span className="drawer-label">Ciudad/Barrio</span><span className="drawer-value">{member.ciudad_barrio}</span></div>}
          </div>

          {/* Estado Familiar */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Estado Familiar</h4>
            {member.estado_civil && <div className="drawer-field"><span className="drawer-label">Estado civil</span><span className="drawer-value">{member.estado_civil}</span></div>}
            {member.nombre_conyuge && <div className="drawer-field"><span className="drawer-label">Cónyuge</span><span className="drawer-value">{member.nombre_conyuge}</span></div>}
            {member.cantidad_hijos && <div className="drawer-field"><span className="drawer-label">Hijos</span><span className="drawer-value">{member.cantidad_hijos}</span></div>}
          </div>

          {/* Información Espiritual */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Información Espiritual</h4>
            {member.fecha_conversion && <div className="drawer-field"><span className="drawer-label">Conversión</span><span className="drawer-value">{member.fecha_conversion}</span></div>}
            {member.esta_bautizado && <div className="drawer-field"><span className="drawer-label">Bautizado en agua</span><span className="drawer-value">{member.esta_bautizado}</span></div>}
            {member.fecha_bautismo_agua && <div className="drawer-field"><span className="drawer-label">Fecha bautismo</span><span className="drawer-value">{member.fecha_bautismo_agua}</span></div>}
            {member.bautizado_por && <div className="drawer-field"><span className="drawer-label">Bautizado por</span><span className="drawer-value">{member.bautizado_por}</span></div>}
            {member.recibio_espiritu_santo && <div className="drawer-field"><span className="drawer-label">Espíritu Santo</span><span className="drawer-value">{member.recibio_espiritu_santo}</span></div>}
            {member.fecha_bautismo_espiritu && <div className="drawer-field"><span className="drawer-label">Fecha Espíritu Santo</span><span className="drawer-value">{member.fecha_bautismo_espiritu}</span></div>}
            {member.ministerio && <div className="drawer-field"><span className="drawer-label">Ministerio</span><span className="drawer-value">{member.ministerio}</span></div>}
            {member.nivel_compromiso && <div className="drawer-field"><span className="drawer-label">Nivel compromiso</span><span className="drawer-value">{member.nivel_compromiso}</span></div>}
          </div>

          {/* Membresía */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Membresía</h4>
            {member.fecha_ingreso && <div className="drawer-field"><span className="drawer-label">Fecha ingreso</span><span className="drawer-value">{member.fecha_ingreso}</span></div>}
            {member.tipo_miembro && <div className="drawer-field"><span className="drawer-label">Tipo</span><span className="drawer-value">{member.tipo_miembro.replace('_', ' ')}</span></div>}
            {member.estado && <div className="drawer-field"><span className="drawer-label">Estado</span><span className="drawer-value">{member.estado}</span></div>}
            {member.iglesia_anterior && <div className="drawer-field"><span className="drawer-label">Iglesia anterior</span><span className="drawer-value">{member.iglesia_anterior}</span></div>}
          </div>

          {/* Participación */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Participación Ministerial</h4>
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Cargando...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: clasificacion.color }}>{stats?.score || 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Puntos</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: clasificacion.color + '20',
                      color: clasificacion.color
                    }}>
                      {clasificacion.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>Nivel</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="drawer-field" style={{ padding: '6px 0' }}>
                    <span className="drawer-label">Participaciones</span>
                    <span className="drawer-value">{stats?.total || 0}</span>
                  </div>
                  <div className="drawer-field" style={{ padding: '6px 0' }}>
                    <span className="drawer-label">Último rol</span>
                    <span className="drawer-value">{stats?.ultimoRol ? getLabelRol(stats.ultimoRol) : '-'}</span>
                  </div>
                  <div className="drawer-field" style={{ padding: '6px 0', gridColumn: 'span 2' }}>
                    <span className="drawer-label">Rol más frecuente</span>
                    <span className="drawer-value">{stats?.rolFrecuente ? getLabelRol(stats.rolFrecuente) : '-'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Laboral */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Información Laboral</h4>
            {member.profesion && <div className="drawer-field"><span className="drawer-label">Profesión</span><span className="drawer-value">{member.profesion}</span></div>}
            {member.empresa && <div className="drawer-field"><span className="drawer-label">Empresa</span><span className="drawer-value">{member.empresa}</span></div>}
            {member.nivel_estudios && <div className="drawer-field"><span className="drawer-label">Estudios</span><span className="drawer-value">{member.nivel_estudios}</span></div>}
          </div>

          {/* Extra */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Información Adicional</h4>
            {member.enfermedades && <div className="drawer-field"><span className="drawer-label">Enfermedades</span><span className="drawer-value">{member.enfermedades}</span></div>}
            {member.discapacidad && <div className="drawer-field"><span className="drawer-label">Discapacidad</span><span className="drawer-value">{member.discapacidad}</span></div>}
            {member.contacto_emergencia_nombre && <div className="drawer-field"><span className="drawer-label">Contacto emergencia</span><span className="drawer-value">{member.contacto_emergencia_nombre} - {member.contacto_emergencia_telefono}</span></div>}
            {member.observaciones && <div className="drawer-field"><span className="drawer-label">Observaciones</span><span className="drawer-value">{member.observaciones}</span></div>}
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={onEdit}><Pencil size={16} /> Editar</button>
        </div>
      </div>
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
