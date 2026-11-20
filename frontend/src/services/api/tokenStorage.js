let authSession = null

export function getToken() {
  return authSession?.token ?? null
}

export function getCurrentUser() {
  return authSession?.user ?? null
}

export function setAuthSession(token, user) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new TypeError('El token de autenticación debe ser un texto no vacío.')
  }

  if (!user || typeof user !== 'object' || typeof user.rol !== 'string') {
    throw new TypeError('La respuesta de autenticación no contiene el rol del usuario.')
  }

  authSession = { token, user }
}

export function clearAuthSession() {
  authSession = null
}
