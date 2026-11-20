import { apiRequest } from './api/http.js'

export function getUsers() {
  return apiRequest('/usuarios/usuarios')
}

export function createUser({ nombre, correo, password, rol_id }) {
  return apiRequest('/usuarios', {
    method: 'POST',
    body: { nombre, correo, password, rol_id },
  })
}

export function updateUserRole(id, rol_id) {
  return apiRequest(`/usuarios/${encodeURIComponent(id)}/rol`, {
    method: 'PUT',
    body: { rol_id },
  })
}

export function deactivateUser(id) {
  return apiRequest(`/usuarios/${encodeURIComponent(id)}/desactivar`, {
    method: 'PUT',
  })
}
