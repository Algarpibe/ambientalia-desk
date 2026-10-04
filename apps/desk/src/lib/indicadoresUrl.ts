// Enlace de descarga de los indicadores (F1F-05, RQ-KP-18). Lo único decidible del cliente vive aquí, en `.ts`,
// porque los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00).

/** Ruta relativa de `GET /api/indicadores`: mismo origen, la cookie de sesión viaja sola. */
export function urlIndicadores(formato: 'json' | 'csv', periodo?: { desde?: string; hasta?: string }): string {
  const q = new URLSearchParams({ formato })
  if (periodo?.desde) q.set('desde', periodo.desde)
  if (periodo?.hasta) q.set('hasta', periodo.hasta)
  return `/api/indicadores?${q.toString()}`
}

/**
 * ¿Se muestra el enlace? Es comodidad, no guarda: la ruta responde 403 a quien no es administrador
 * (`apps/desk/server/routes/indicadores.ts`, `requireAdmin`; regla invariable 13, punto 3).
 */
export function mostrarDescargaIndicadores(user: { isAdmin?: boolean } | null | undefined): boolean {
  return user?.isAdmin === true
}
