export const USER_ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Veterinario' },
  { id: 3, nombre: 'Adoptante' },
]

export function getRoleId(roleName) {
  return USER_ROLES.find((role) => role.nombre === roleName)?.id ?? null
}
