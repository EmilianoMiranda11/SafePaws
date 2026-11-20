import { apiRequest } from './api/http.js'

export function createAdoptionRequest({ animal_id, observaciones }) {
  return apiRequest('/solicitudes', {
    method: 'POST',
    body: { animal_id, observaciones },
  })
}

export function getAdoptionRequests() {
  return apiRequest('/solicitudes')
}

export function updateAdoptionRequest(id, { estado, observaciones }) {
  return apiRequest(`/solicitudes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { estado, observaciones },
  })
}

export function cancelAdoptionRequest(id) {
  return apiRequest(`/solicitudes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
