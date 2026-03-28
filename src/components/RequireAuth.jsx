import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg, #f8f9fa)'
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
    window.location.href = '/login'
    return null
  }

  return children
}
