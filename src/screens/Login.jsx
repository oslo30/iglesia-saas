import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Church } from 'lucide-react'
import './Login.css'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')
  const [nombre, setNombre] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        const data = await signUp(email, password, nombre)
        if (data.user && !data.session) {
          setError('Revisa tu correo para confirmar el enlace de verificación.')
          setMode('login')
        }
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Church />
          </div>
          <h1 className="login-title">Iglesia</h1>
          <p className="login-subtitle">Sistema de Gestión Pastoral</p>
        </div>

        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'registro' && (
            <div className="login-field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading
              ? <span className="spinner" />
              : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'
            }
          </button>
        </form>

        {mode === 'login' ? (
          <div className="login-register">
            ¿No tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setMode('registro'); setError('') }}>
              Regístrate
            </a>
          </div>
        ) : (
          <div className="login-register">
            ¿Ya tienes cuenta?{' '}
            <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError('') }}>
              Inicia sesión
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
