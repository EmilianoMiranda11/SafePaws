import { ApiError, apiRequest } from './api/http.js'
import { clearAuthSession, setAuthSession } from './api/tokenStorage.js'

export function registerAdopter({ nombre, correo, password }) {
  return apiRequest('/usuarios/registro', {
    method: 'POST',
    body: { nombre, correo, password },
    auth: false,
  })
}

export async function login({ correo, password }) {
  const response = await apiRequest('/usuarios/login', {
    method: 'POST',
    body: { correo, password },
    auth: false,
  })

  if (
    !response ||
    typeof response.token !== 'string' ||
    !response.token ||
    !response.usuario ||
    typeof response.usuario.rol !== 'string' ||
    !response.usuario.rol
  ) {
    throw new ApiError('La respuesta de inicio de sesión no contiene el JWT y rol esperados.', {
      status: 200,
      payload: response,
    })
  }

  setAuthSession(response.token, response.usuario)
  return response
}

export function logout() {
  clearAuthSession()
}
