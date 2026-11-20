const navigationByRole = {
  Administrador: [
    { id: 'dashboard', label: 'Panel principal', icon: '⌂' },
    { id: 'animals-management', label: 'Gestión de animales', icon: '♥' },
    { id: 'users-management', label: 'Gestión de usuarios', icon: '♙' },
    { id: 'adoption-requests', label: 'Solicitudes de adopción', icon: '◷' },
  ],
  Veterinario: [
    { id: 'dashboard', label: 'Panel principal', icon: '⌂' },
    { id: 'animals-catalog', label: 'Consulta de animales', icon: '⌕' },
    { id: 'animals-management', label: 'Gestión de animales', icon: '♥' },
  ],
  Adoptante: [
    { id: 'dashboard', label: 'Panel principal', icon: '⌂' },
    { id: 'animals-catalog', label: 'Catálogo de animales', icon: '♥' },
    { id: 'my-requests', label: 'Mis solicitudes', icon: '◷' },
  ],
}

export function getNavigationForRole(role) {
  return navigationByRole[role] ?? []
}

export function canAccessView(role, viewId) {
  return getNavigationForRole(role).some((item) => item.id === viewId)
}

export function getDefaultViewForRole(role) {
  return getNavigationForRole(role)[0]?.id ?? null
}
