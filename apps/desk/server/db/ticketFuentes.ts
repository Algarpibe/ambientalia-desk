/**
 * Lo que comparten los dos compositores del ticket: `historial.ts` (el log) y `conversacion.ts` (el
 * relato). Vive aquí y no duplicado en cada uno porque la regla de la foto de creación es sutil —ya
 * se implementó mal una vez— y dos copias divergen en cuanto alguien toca una.
 */

/** Qué hacer con Zoho antes de responder. */
export type PlanSyncZoho = 'no' | 'ahora' | 'en-segundo-plano'

/**
 * Si el ticket nació en la app, Zoho no lo conoce y preguntarle por él es un 404 en cada apertura.
 *
 * Se mira el PREFIJO del id y no `managed_by_app` ni `source`: `writeTransition` pone las dos
 * columnas a "app" en CUALQUIER transición hecha aquí, incluidas las de un ticket que vino de Zoho,
 * así que ambas mienten. El id lo acuña `createTicket` como `app-<uuid>` y ningún UPDATE lo toca.
 */
export function nacidoEnLaApp(ticketId: string): boolean {
  return ticketId.startsWith('app-')
}

export function planSyncZoho(ticketId: string, hayDatosDeZoho: boolean): PlanSyncZoho {
  if (nacidoEnLaApp(ticketId)) return 'no'
  return hayDatosDeZoho ? 'en-segundo-plano' : 'ahora'
}

/** `timestamptz`: pg y pg-mem lo entregan como `Date`; el histórico puede traer texto. */
export const iso = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : v ? String(v) : null)

/** `jsonb`: pg lo entrega parseado, pg-mem como texto. */
export const json = (v: unknown): Record<string, unknown> =>
  typeof v === 'string' ? (JSON.parse(v) as Record<string, unknown>) : ((v as Record<string, unknown>) ?? {})

/** "Grimm EDM180C · serie 18A20070", saltándose lo que falte. */
export function textoEquipo(marca: unknown, modelo: unknown, serial: unknown): string {
  const nombre = [marca, modelo].filter((x) => x != null && String(x).trim() !== '').join(' ')
  const s = serial != null && String(serial).trim() !== '' ? `serie ${serial}` : ''
  return [nombre, s].filter(Boolean).join(' · ')
}

/**
 * Lector de los datos de creación. Hay foto o no la hay: se decide UNA vez, no campo a campo. Los
 * tickets anteriores a que `createTicket` guardara el payload completo dejaron en `values` solo
 * `orden_venta`, así que la presencia de cualquier otra clave es el discriminador. Mezclar con
 * `v[c] ?? ticket[col]` sería un error sutil: la foto guarda los `null` explícitos, de modo que un
 * campo que el técnico dejó vacío ese día caería a la columna y mostraría el estado ACTUAL — justo la
 * mentira que la foto evita.
 */
export function lectorCreacion(values: unknown, ticket: Record<string, unknown>) {
  const v = json(values)
  const hayFoto = Object.keys(v).some((k) => k !== 'orden_venta')
  return (clave: string, columna: string): unknown => (hayFoto ? v[clave] : ticket[columna])
}
