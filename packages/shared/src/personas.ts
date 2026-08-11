/**
 * Una persona de la plataforma reducida a lo que hace falta para derivarle un ticket.
 *
 * Es deliberadamente más pobre que `UserPublic`: la lista de personas la puede pedir CUALQUIER usuario
 * autenticado, así que no lleva correo, ni áreas, ni si es administrador. Quien necesite eso sigue
 * pasando por `/api/users`, que es de administración.
 */
export interface PersonaLite {
  id: string
  nombre: string
  /** Texto libre y decorativo (`users.cargo`): sirve para reconocer a la persona, no da permisos. */
  cargo: string | null
}

/**
 * Cómo se nombra a una persona en toda la aplicación: «Johny Luna Roa · Director Técnico».
 *
 * El cargo viaja pegado al nombre para que se pueda buscar por él —«quién es el director técnico»—
 * aunque lo que se guarde sea siempre la persona concreta. Vive en un solo sitio porque lo usan el
 * desplegable de la transición, la ficha, la tarjeta y la tabla, y tres copias divergirían.
 */
export function etiquetaPersona(p: { nombre: string; cargo?: string | null }): string {
  const cargo = p.cargo?.trim()
  return cargo ? `${p.nombre} · ${cargo}` : p.nombre
}
