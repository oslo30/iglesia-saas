import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [data, setData] = useState({
    miembros: [],
    servicios: [],
    diezmos: [],
    ofrendas: [],
    donaciones_especiales: [],
    registros_asistencia: [],
    loading: true,
    error: null
  })

  const loadAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))

    try {
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      sixMonthsAgo.setHours(0, 0, 0, 0)

      const [
        miembrosRes,
        serviciosRes,
        diezmosRes,
        ofrendasRes,
        donacionesRes,
        asistenciaRes
      ] = await Promise.all([
        supabase.from('miembros').select('*').order('apellido'),
        supabase.from('servicios').select('*').order('nombre'),
        supabase.from('diezmos').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('ofrendas').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('donaciones_especiales').select('*').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('registros_asistencia').select('*').order('created_at', { ascending: false }).limit(100)
      ])

      setData({
        miembros: miembrosRes.data || [],
        servicios: serviciosRes.data || [],
        diezmos: diezmosRes.data || [],
        ofrendas: ofrendasRes.data || [],
        donaciones_especiales: donacionesRes.data || [],
        registros_asistencia: asistenciaRes.data || [],
        loading: false,
        error: null
      })
    } catch (err) {
      console.error('Error loading data:', err)
      setData(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const refresh = useCallback(() => {
    loadAllData()
  }, [loadAllData])

  return (
    <DataContext.Provider value={{ data, refresh }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
