import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Members from './screens/Members'
import Finanzas from './screens/Finanzas'
import Proyectos from './screens/Proyectos'
import Attendance from './screens/Attendance'
import Events from './screens/Events'
import Sidebar from './components/Sidebar'

export const AuthContext = createContext(null)
export function useAuth() {
  return useContext(AuthContext)
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState('dashboard')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={signIn} />
  }

  const screens = {
    dashboard: <Dashboard showToast={showToast} onNavigate={setCurrentScreen} />,
    members: <Members showToast={showToast} />,
    finanzas: <Finanzas showToast={showToast} />,
    proyectos: <Proyectos showToast={showToast} />,
    attendance: <Attendance showToast={showToast} />,
    events: <Events showToast={showToast} />,
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      <div className="app-layout">
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onLogout={signOut}
          user={user}
        />
        <main className="main-content">
          {screens[currentScreen]}
        </main>
      </div>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckIcon />}
            {toast.type === 'error' && <XIcon />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}
