import { clearAuthSession, getToken } from './tokenStorage.js'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/+$/, '')
export const AUTH_UNAUTHORIZED_EVENT = 'safepaws:unauthorized'

export class ApiError extends Error {
  constructor(message, { status = null, payload = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function readResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload, status) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.mensaje === 'string' && payload.mensaje) {
      return payload.mensaje
    }

    if (typeof payload.message === 'string' && payload.message) {
      return payload.message
    }
  }

  return `La API respondió con HTTP ${status}.`
}

export async function apiRequest(
  path,
  { method = 'GET', body, headers = {}, auth = true } = {},
) {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()

    if (!token) {
      throw new ApiError('Inicia sesión para continuar.', { status: 401 })
    }

    requestHeaders.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (cause) {
    throw new ApiError('No se pudo conectar con la API de SafePaws.', {
      cause,
    })
  }

  let payload

  try {
    payload = await readResponse(response)
  } catch (cause) {
    throw new ApiError('No se pudo leer la respuesta de la API.', {
      status: response.status,
      cause,
    })
  }

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearAuthSession()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      }
    }

    throw new ApiError(getErrorMessage(payload, response.status), {
      status: response.status,
      payload,
    })
  }

  return payload
}
