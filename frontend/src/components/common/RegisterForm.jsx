import { useState } from 'react'

function RegisterForm({
  error,
  loading,
  onBackToLogin,
  onSubmit,
  successMessage,
}) {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    const registered = await onSubmit({
      nombre: nombre.trim(),
      correo: correo.trim(),
      password,
    })

    setPassword('')
    return registered
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="brand-mark brand-mark-large" aria-hidden="true">🐾</div>
        <p className="eyebrow">SafePaws · cuidado que encuentra hogar</p>
        {successMessage ? (
          <>
            <h1 id="register-title">Cuenta creada</h1>
            <p className="success-message" role="status">{successMessage}</p>
            <p className="intro">
              Ya puedes iniciar sesión con tu correo y contraseña. Tu cuenta tiene el rol Adoptante.
            </p>
            <button className="primary-button auth-submit-button" onClick={onBackToLogin} type="button">
              Ir al inicio de sesión
            </button>
          </>
        ) : (
          <>
            <h1 id="register-title">Crear cuenta</h1>
            <p className="intro">
              Regístrate para explorar animales y gestionar tus solicitudes de adopción.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="register-name">Nombre</label>
              <input
                autoComplete="name"
                id="register-name"
                maxLength={100}
                onChange={(event) => setNombre(event.target.value)}
                pattern=".*\S.*"
                required
                type="text"
                value={nombre}
              />

              <label htmlFor="register-email">Correo electrónico</label>
              <input
                autoComplete="email"
                id="register-email"
                maxLength={150}
                onChange={(event) => setCorreo(event.target.value)}
                required
                type="email"
                value={correo}
              />

              <label htmlFor="register-password">Contraseña</label>
              <input
                autoComplete="new-password"
                id="register-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <span className="auth-form-hint">Debe tener al menos 8 caracteres.</span>

              {error && <p className="error-message" role="alert">{error}</p>}

              <button className="primary-button auth-submit-button" disabled={loading} type="submit">
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>
            <div className="auth-footnote">
              <button className="auth-navigation-button" onClick={onBackToLogin} type="button">
                Ya tengo una cuenta. Iniciar sesión
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default RegisterForm
