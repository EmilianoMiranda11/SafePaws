import { apiRequest } from './api/http.js'

export function getAnimals() {
  return apiRequest('/animales')
}

export function createAnimal(animal) {
  return apiRequest('/animales', {
    method: 'POST',
    body: animal,
  })
}

export function updateAnimal(id, animal) {
  return apiRequest(`/animales/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: animal,
  })
}

export function deleteAnimal(id) {
  return apiRequest(`/animales/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
