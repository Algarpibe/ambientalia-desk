// Enlace de descarga de los indicadores (F1F-05, RQ-KP-18). Lo único decidible del cliente vive aquí, en `.ts`,
// porque los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00).
import { FLUJOS, NOMBRE_FLUJO, type Flujo } from '@ambientalia/shared'
/** Ruta relativa de `GET /api/indicadores`: mismo origen, la cookie de sesión viaja sola. */
export function urlIndicadores(formato: 'json' | 'csv', periodo?: { desde?: string; hasta?: string }, flujo?: string): string {
  const q = new URLSearchParams({ formato })
  if (periodo?.desde) q.set('desde', periodo.desde)
  if (periodo?.hasta) q.set('hasta', periodo.hasta); if (flujo) q.set('flujo', flujo)
  return `/api/indicadores?${q.toString()}`
}

/**
 * ¿Se muestra el enlace? Es comodidad, no guarda: la ruta responde 403 a quien no es administrador
 * (`apps/desk/server/routes/indicadores.ts`, `requireAdmin`; regla invariable 13, punto 3).
 */
export function mostrarDescargaIndicadores(user: { isAdmin?: boolean } | null | undefined): boolean {
  return user?.isAdmin === true
}

/** Opciones del selector de flujo: «Todos» (`''`, no envía `flujo`) y `FLUJOS` con el rótulo de `NOMBRE_FLUJO`. Comodidad: lo impone el `400` de `validarFlujo` (regla invariable 13, punto 3). */
export function opcionesFlujo(): Array<{ valor: '' | Flujo; etiqueta: string }> {
  return [{ valor: '', etiqueta: 'Todos' }, ...FLUJOS.map((f) => ({ valor: f, etiqueta: NOMBRE_FLUJO[f].charAt(0).toUpperCase() + NOMBRE_FLUJO[f].slice(1) }))]
}
