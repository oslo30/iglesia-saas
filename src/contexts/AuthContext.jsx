import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setUser(null)
        setPerfil(null)
      }
    }, 8000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else { setLoading(false); clearTimeout(timeout) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchPerfil(session.user.id)
        } else {
          setPerfil(null)
        }
        setLoading(false)
        clearTimeout(timeout)
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function fetchPerfil(userId) {
    const { data } = await supabase
      .from('usuarios_sistema')
      .select('*, miembros(nombre, apellido)')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      setPerfil({
        ...data,
        nombre:
          data.miembros
            ? data.miembros.nombre + ' ' + data.miembros.apellido
            : data.nombre_display || user?.email,
      })
    } else {
      setPerfil({ rol: 'portero', nombre: user?.email, nuevo: true })
    }
    setLoading(false)
  }

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
