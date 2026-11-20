import { useState } from 'react'
import { USER_ROLES } from './userRoles.js'

function UserForm({ loading, onCancel, onSubmit }) {
  const [values, setValues] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol_id: '',
  })

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      nombre: values.nombre.trim(),
      correo: values.correo.trim(),
      password: values.password,
      rol_id: Number(values.rol_id),
    })
  }

  return (
    <section aria-labelledby="user-form-title" className="user-form-panel">
      <div className="animal-form-heading">
        <div>
          <p className="eyebrow">Nueva cuenta</p>
          <h3 id="user-form-title">Crear usuario</h3>
        </div>
        <button
          aria-label="Cerrar formulario"
          className="icon-button"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <form className="user-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            autoFocus
            autoComplete="name"
            maxLength={100}
            name="nombre"
            onChange={updateField}
            pattern=".*\S.*"
            required
            value={values.nombre}
          />
        </label>

        <label>
          Correo electrónico
          <input
            autoComplete="email"
            maxLength={150}
            name="correo"
            onChange={updateField}
            required
            type="email"
            value={values.correo}
          />
        </label>

        <label>
          Contraseña
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={updateField}
            required
            type="password"
            value={values.password}
          />
          <span className="form-hint">Debe tener al menos 8 caracteres.</span>
        </label>

        <label>
          Rol
          <select
            name="rol_id"
            onChange={updateField}
            required
            value={values.rol_id}
          >
            <option disabled value="">Selecciona un rol</option>
            {USER_ROLES.filter((role) => role.nombre !== 'Adoptante').map((role) => (
              <option key={role.id} value={role.id}>{role.nombre}</option>
            ))}
          </select>
        </label>

        <p className="form-hint user-form-note">
          La contraseña se envía al servidor para crear la cuenta y no se muestra en el listado.
        </p>
        <div className="form-actions user-form-actions">
          <button
            className="form-cancel-button"
            disabled={loading}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default UserForm
