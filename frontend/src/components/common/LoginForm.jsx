import { useState } from 'react'

function getErrorMessage(error) {
  if (error?.status === 401) {
    return error.message || 'Credenciales incorrectas o sesión expirada.'
  }

  if (error?.status === 403) {
    return error.message || 'No tienes permiso para realizar esta operación.'
  }

  return error?.message || 'No fue posible iniciar sesión. Inténtalo nuevamente.'
}

function LoginForm({ error, loading, onRegister, onSubmit }) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ correo, password })
    setPassword('')
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark brand-mark-large" aria-hidden="true">🐾</div>
        <p className="eyebrow">SafePaws · cuidado que encuentra hogar</p>
        <h1 id="login-title">Bienvenido</h1>
        <p className="intro">Inicia sesión para continuar a tu espacio de SafePaws.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="correo">Correo electrónico</label>
          <input
            autoComplete="username"
            id="correo"
            onChange={(event) => setCorreo(event.target.value)}
            required
            type="email"
            value={correo}
          />

          <label htmlFor="password">Contraseña</label>
          <input
            autoComplete="current-password"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {error && <p className="error-message" role="alert">{getErrorMessage(error)}</p>}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Conectando…' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="auth-footnote">
          <p>Un lugar seguro para cada historia.</p>
          <button className="auth-navigation-button" onClick={onRegister} type="button">
            ¿Aún no tienes cuenta? Crear cuenta de Adoptante
          </button>
        </div>
      </section>
    </main>
  )
}

export default LoginForm
