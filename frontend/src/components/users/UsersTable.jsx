import { useState } from 'react'
import { USER_ROLES, getRoleId } from './userRoles.js'

function formatDate(value) {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function UserRow({
  adminId,
  onDeactivate,
  onRoleChange,
  processing,
  processingAction,
  processingId,
  user,
}) {
  const currentRoleId = getRoleId(user.rol)
  const [selectedRoleId, setSelectedRoleId] = useState(
    currentRoleId === null ? '' : String(currentRoleId),
  )
  const isCurrentAdmin = String(user.id) === String(adminId)
  const isProcessing = String(processingId) === String(user.id)
  const roleChanged = selectedRoleId !== '' && selectedRoleId !== String(currentRoleId ?? '')

  return (
    <tr>
      <td>
        <strong className="user-table-name">{user.nombre}</strong>
        {isCurrentAdmin && <span className="current-user-label">Cuenta actual</span>}
      </td>
      <td className="user-table-email">{user.correo}</td>
      <td>
        {isCurrentAdmin ? (
          <span>{user.rol}</span>
        ) : (
          <div className="user-role-control">
            <select
              aria-label={`Rol de ${user.nombre}`}
              disabled={processing}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              value={selectedRoleId}
            >
              {currentRoleId === null && <option value="">{user.rol}</option>}
              {USER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.nombre}</option>
              ))}
            </select>
            {roleChanged && (
              <button
                className="text-button"
                disabled={processing}
                onClick={() => onRoleChange(user, Number(selectedRoleId))}
                type="button"
              >
                {isProcessing && processingAction === 'role' ? 'Guardando…' : 'Guardar'}
              </button>
            )}
          </div>
        )}
      </td>
      <td>
        <span className={`user-account-status ${user.activo ? 'user-active' : 'user-inactive'}`}>
          {user.activo ? 'Activo' : 'Desactivado'}
        </span>
      </td>
      <td>{formatDate(user.fecha_creacion)}</td>
      <td>
        {isCurrentAdmin ? (
          <span className="user-no-actions">Sin acciones</span>
        ) : user.activo ? (
          <button
            className="text-button danger-button"
            disabled={processing}
            onClick={() => onDeactivate(user)}
            type="button"
          >
            {isProcessing && processingAction === 'deactivate' ? 'Desactivando…' : 'Desactivar'}
          </button>
        ) : (
          <span className="user-no-actions">Sin acciones</span>
        )}
      </td>
    </tr>
  )
}

function UsersTable({
  adminId,
  onDeactivate,
  onRoleChange,
  processing,
  processingAction,
  processingId,
  users,
}) {
  return (
    <div className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Correo</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col">Creado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              adminId={adminId}
              key={`${user.id}-${user.rol}`}
              onDeactivate={onDeactivate}
              onRoleChange={onRoleChange}
              processing={processing}
              processingAction={processingAction}
              processingId={processingId}
              user={user}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UsersTable
