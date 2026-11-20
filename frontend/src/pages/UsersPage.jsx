import { useCallback, useEffect, useState } from 'react'
import UserForm from '../components/users/UserForm.jsx'
import UsersTable from '../components/users/UsersTable.jsx'
import { ApiError } from '../services/api/http.js'
import {
  createUser,
  deactivateUser,
  getUsers,
  updateUserRole,
} from '../services/userService.js'

async function fetchUsers() {
  const response = await getUsers()
  if (!Array.isArray(response?.usuarios)) {
    throw new Error('La respuesta de usuarios no tiene el formato esperado.')
  }

  return response.usuarios
}

function getErrorMessage(error, action) {
  if (!(error instanceof ApiError)) {
    return error?.message || `No se pudo completar la operación: ${action}.`
  }

  if (error.status === 401) {
    return `La sesión no es válida. Inicia sesión nuevamente. ${error.message}`
  }

  if (error.status === 403) {
    return `No tienes permiso para ${action}. ${error.message}`
  }

  if (error.status === 400) {
    return `Revisa los datos ingresados. ${error.message}`
  }

  if (error.status === 404) {
    return `El usuario ya no existe o no se encontró. ${error.message}`
  }

  if (error.status === 409) {
    return `La operación no puede completarse por una restricción del sistema. ${error.message}`
  }

  if (error.status) {
    return `No se pudo ${action} (HTTP ${error.status}). ${error.message}`
  }

  return error.message
}

function UsersPage({ adminId, role }) {
  const authorized = role === 'Administrador'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(authorized)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [processingAction, setProcessingAction] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [notice, setNotice] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const currentUsers = await fetchUsers()
      setUsers(currentUsers)
      return currentUsers
    } catch (error) {
      setLoadError(getErrorMessage(error, 'consultar los usuarios'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    if (authorized) {
      fetchUsers()
        .then((result) => {
          if (active) setUsers(result)
        })
        .catch((error) => {
          if (active) setLoadError(getErrorMessage(error, 'consultar los usuarios'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    return () => {
      active = false
    }
  }, [authorized])

  function openCreateForm() {
    if (!authorized || processingId !== null) return
    setOperationError('')
    setNotice('')
    setIsFormOpen(true)
  }

  function closeCreateForm() {
    if (saving) return
    setIsFormOpen(false)
  }

  async function handleCreate(payload) {
    if (!authorized) return

    setSaving(true)
    setOperationError('')
    setNotice('')

    try {
      const response = await createUser(payload)
      setIsFormOpen(false)
      const updatedUsers = await loadUsers()

      if (updatedUsers) {
        setNotice(response?.mensaje || 'El usuario se creó correctamente.')
      } else {
        setOperationError(
          'El usuario se creó correctamente, pero no se pudo actualizar la lista. Intenta actualizarla.',
        )
      }
    } catch (error) {
      setOperationError(getErrorMessage(error, 'crear el usuario'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(user, rolId) {
    if (!authorized || String(user.id) === String(adminId)) return

    setProcessingId(user.id)
    setProcessingAction('role')
    setOperationError('')
    setNotice('')

    try {
      const response = await updateUserRole(user.id, rolId)
      const updatedUsers = await loadUsers()

      if (updatedUsers) {
        setNotice(response?.mensaje || `El rol de ${user.nombre} se actualizó correctamente.`)
      } else {
        setOperationError(
          'El rol se actualizó correctamente, pero no se pudo actualizar la lista. Intenta actualizarla.',
        )
      }
    } catch (error) {
      setOperationError(getErrorMessage(error, 'actualizar el rol'))
    } finally {
      setProcessingId(null)
      setProcessingAction(null)
    }
  }

  async function handleDeactivate(user) {
    if (
      !authorized ||
      String(user.id) === String(adminId) ||
      !user.activo
    ) {
      return
    }

    const confirmed = window.confirm(
      `¿Desactivar la cuenta de ${user.nombre}? Esta acción no se puede deshacer desde esta aplicación.`,
    )
    if (!confirmed) return

    setProcessingId(user.id)
    setProcessingAction('deactivate')
    setOperationError('')
    setNotice('')

    try {
      const response = await deactivateUser(user.id)
      const updatedUsers = await loadUsers()

      if (updatedUsers) {
        setNotice(response?.mensaje || `La cuenta de ${user.nombre} se desactivó correctamente.`)
      } else {
        setOperationError(
          'La cuenta se desactivó correctamente, pero no se pudo actualizar la lista. Intenta actualizarla.',
        )
      }
    } catch (error) {
      setOperationError(getErrorMessage(error, 'desactivar el usuario'))
    } finally {
      setProcessingId(null)
      setProcessingAction(null)
    }
  }

  if (!authorized) {
    return (
      <section aria-labelledby="users-title" className="content-card">
        <p className="eyebrow">Acceso restringido</p>
        <h2 id="users-title">Gestión de usuarios</h2>
        <p className="error-message" role="alert">
          Esta sección está disponible únicamente para Administradores.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="users-title" className="content-card">
      <div className="page-heading users-page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h2 id="users-title">Gestión de usuarios</h2>
          <p>Administra las cuentas y sus permisos dentro de SafePaws.</p>
        </div>
        <div className="users-heading-actions">
          {!loading && !loadError && (
            <span className="count-badge">
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          )}
          <button
            className="form-cancel-button"
            disabled={loading || saving || processingId !== null}
            onClick={loadUsers}
            type="button"
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          {!isFormOpen && (
            <button
              className="primary-button users-create-button"
              disabled={saving || processingId !== null}
              onClick={openCreateForm}
              type="button"
            >
              Crear usuario
            </button>
          )}
        </div>
      </div>

      {notice && <p className="success-message" role="status">{notice}</p>}
      {operationError && <p className="error-message" role="alert">{operationError}</p>}

      {isFormOpen && (
        <UserForm
          loading={saving}
          onCancel={closeCreateForm}
          onSubmit={handleCreate}
        />
      )}

      {loadError && (
        <div className="load-error">
          <p className="error-message" role="alert">{loadError}</p>
          <button
            className="form-cancel-button"
            disabled={loading}
            onClick={loadUsers}
            type="button"
          >
            Reintentar consulta
          </button>
        </div>
      )}
      {loading && <p className="status-message" role="status">Cargando usuarios…</p>}
      {!loading && !loadError && users.length === 0 && (
        <p className="empty-state">No hay usuarios registrados.</p>
      )}
      {!loading && !loadError && users.length > 0 && (
        <UsersTable
          adminId={adminId}
          onDeactivate={handleDeactivate}
          onRoleChange={handleRoleChange}
          processing={processingId !== null}
          processingAction={processingAction}
          processingId={processingId}
          users={users}
        />
      )}
    </section>
  )
}

export default UsersPage
