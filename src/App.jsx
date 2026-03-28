import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Members from './screens/Members'
import Donations from './screens/Donations'
import Sidebar from './components/Sidebar'
import './App.css'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth:', event)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>
  }

  if (!user) {
    return <Login onLogin={signIn} />
  }

  const screens = {
    dashboard: <Dashboard />,
    members: <Members />,
    donations: <Donations />,
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      <div className="app-layout">
        <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} onLogout={signOut} user={user} />
        <main className="main-content">
          {screens[currentScreen]}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
