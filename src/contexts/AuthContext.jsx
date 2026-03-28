import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingPerfil = useRef(false)

  useEffect(() => {
    let isMounted = true

    // Timeout de seguridad
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth timeout - proceeding without perfil')
        setLoading(false)
      }
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Auth init error:', err)
      if (isMounted) {
        setLoading(false)
        setUser(null)
        setPerfil(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        console.log('Auth state change:', event)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchPerfil(session.user.id)
        } else {
          setPerfil(null)
          setLoading(false)
        }
      }
    )

    async function fetchPerfil(userId) {
      if (fetchingPerfil.current) return
      fetchingPerfil.current = true

      try {
        const { data, error } = await supabase
          .from('usuarios_sistema')
          .select('*, miembros(nombre, apellido)')
          .eq('user_id', userId)
          .maybeSingle()

        if (!isMounted) return

        if (error) {
          console.warn('Error fetching perfil, using default:', error.message)
          // Nothrow - usar default
          setPerfil({
            rol: 'portero',
            nombre: user?.email || 'Usuario',
            nuevo: true
          })
        } else if (data) {
          setPerfil({
            ...data,
            nombre:
              data.miembros
                ? data.miembros.nombre + ' ' + data.miembros.apellido
                : data.nombre_display || user?.email,
          })
        } else {
          // No existe registro en usuarios_sistema, crear default
          setPerfil({
            rol: 'portero',
            nombre: user?.email || 'Usuario',
            nuevo: true
          })
        }
      } catch (err) {
        console.error('fetchPerfil error:', err)
        if (isMounted) {
          setPerfil({
            rol: 'portero',
            nombre: user?.email || 'Usuario',
            nuevo: true
          })
        }
      } finally {
        fetchingPerfil.current = false
        if (isMounted) setLoading(false)
      }
    }

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, nombre_display) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
