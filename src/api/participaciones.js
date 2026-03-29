import { supabase } from '../supabase'

const ROLES = [
  { key: 'director', label: 'Director del culto', peso: 4 },
  { key: 'predicador', label: 'Predicador', peso: 5 },
  { key: 'himnos', label: 'Himno congregacional', peso: 3 },
  { key: 'coros', label: 'Coros', peso: 3 },
  { key: 'ofrenda', label: 'Recolector de ofrenda', peso: 2 },
  { key: 'oracion', label: 'Oración', peso: 1 },
  { key: 'testimonio', label: 'Testimonio', peso: 1 },
  { key: 'otro', label: 'Otro', peso: 1 },
]

const PESO_POR_ROL = Object.fromEntries(ROLES.map(r => [r.key, r.peso]))

export function getPesoRol(rol) {
  return PESO_POR_ROL[rol] || 1
}

export function getLabelRol(rol) {
  return ROLES.find(r => r.key === rol)?.label || rol
}

export function getClasificacion(score) {
  if (score >= 20) return { label: 'Alto', color: '#10B981' }
  if (score >= 10) return { label: 'Medio', color: '#F59E0B' }
  if (score >= 1) return { label: 'Bajo', color: '#EF4444' }
  return { label: 'Inactivo', color: '#94A3B8' }
}

export const participacionesApi = {
  listarPorServicio: async (servicioId) => {
    const { data, error } = await supabase
      .from('participaciones')
      .select(`
        *,
        miembro:miembros(id, nombre, apellido)
      `)
      .eq('servicio_id', servicioId)
      .order('created_at')
    if (error) throw error
    return data || []
  },

  crear: async (participacion) => {
    const puntaje = getPesoRol(participacion.rol)
    const { data, error } = await supabase
      .from('participaciones')
      .insert([{ ...participacion, puntaje }])
      .select()
    if (error) throw error
    return data[0]
  },

  eliminar: async (id) => {
    const { error } = await supabase.from('participaciones').delete().eq('id', id)
    if (error) throw error
  },

  getEstadisticasMiembro: async (miembroId) => {
    const { data, error } = await supabase
      .from('participaciones')
      .select('rol, puntaje, fecha')
      .eq('miembro_id', miembroId)
      .order('fecha', { ascending: false })

    if (error) throw error

    if (!data || data.length === 0) {
      return { score: 0, total: 0, clasificacion: getClasificacion(0), ultimoRol: null, rolFrecuente: null, participaciones: [] }
    }

    const score = data.reduce((s, p) => s + (p.puntaje || 0), 0)
    const rolCount = {}
    data.forEach(p => {
      rolCount[p.rol] = (rolCount[p.rol] || 0) + 1
    })
    const rolFrecuente = Object.entries(rolCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      score,
      total: data.length,
      clasificacion: getClasificacion(score),
      ultimoRol: data[0]?.rol || null,
      rolFrecuente,
      participaciones: data,
    }
  },

  getTopMiembros: async (limit = 5) => {
    const { data, error } = await supabase
      .from('participaciones')
      .select('miembro_id, puntaje')

    if (error) throw error

    if (!data || data.length === 0) return []

    const scoreMap = {}
    data.forEach(p => {
      if (!scoreMap[p.miembro_id]) {
        scoreMap[p.miembro_id] = { miembro_id: p.miembro_id, score: 0, total: 0 }
      }
      scoreMap[p.miembro_id].score += p.puntaje || 0
      scoreMap[p.miembro_id].total += 1
    })

    const sorted = Object.values(scoreMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const miembroIds = sorted.map(s => s.miembro_id)
    const { data: miembros } = await supabase
      .from('miembros')
      .select('id, nombre, apellido')
      .in('id', miembroIds)

    const miembrosMap = Object.fromEntries(miembros.map(m => [m.id, m]))

    return sorted.map(s => ({
      ...s,
      miembro: miembrosMap[s.miembro_id],
      clasificacion: getClasificacion(s.score),
    }))
  },

  getDistribucionRoles: async () => {
    const { data, error } = await supabase
      .from('participaciones')
      .select('rol')

    if (error) throw error
    if (!data || data.length === 0) return []

    const count = {}
    data.forEach(p => {
      count[p.rol] = (count[p.rol] || 0) + 1
    })

    return Object.entries(count)
      .map(([rol, cantidad]) => ({
        rol,
        label: getLabelRol(rol),
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
  },
}

export { ROLES }
