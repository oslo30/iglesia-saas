import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import Layout from './layout/Layout'
import Dashboard from './screens/Dashboard'
import Members from './screens/Members'
import Donations from './screens/Donations'
import Events from './screens/Events'
import Attendance from './screens/Attendance'
import Reports from './screens/Reports'
import Login from './screens/Login'
import './App.css'

const SCREEN_TITLES = {
  dashboard: { title: 'Panel Principal', subtitle: 'Resumen de la iglesia' },
  members: { title: 'Miembros', subtitle: 'Gestionar miembros de la iglesia' },
  donations: { title: 'Donaciones y Diezmos', subtitle: 'Control financiero' },
  events: { title: 'Eventos y Servicios', subtitle: 'Calendario de servicios' },
  attendance: { title: 'Registro de Asistencia', subtitle: 'Control de asistencia' },
  reports: { title: 'Reportes y Análisis', subtitle: 'Estadísticas de la iglesia' },
}

function App() {
  const { user, loading } = useAuth()
  const [activeScreen, setActiveScreen] = useState('dashboard')

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(30, 58, 95, 0.2)',
          borderTopColor: '#1E3A5F',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />
      case 'members': return <Members />
      case 'donations': return <Donations />
      case 'events': return <Events />
      case 'attendance': return <Attendance />
      case 'reports': return <Reports />
      default: return <Dashboard />
    }
  }

  return (
    <RequireAuth>
      <Layout
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        title={SCREEN_TITLES[activeScreen]?.title}
        subtitle={SCREEN_TITLES[activeScreen]?.subtitle}
      >
        {renderScreen()}
      </Layout>
    </RequireAuth>
  )
}

export default App
