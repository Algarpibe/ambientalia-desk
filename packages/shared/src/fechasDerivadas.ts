// F1A-07 · IV-2 — las tres fechas derivadas, calculadas UNA sola vez para servidor y cliente.
//
// Antes se calculaban sólo en el navegador (`valoresTransicion.ts`), con la zona del PROCESO. Bajo la
// regla invariable 13 punto 2, eso no era un espejo: era la guarda, y vivía donde no se puede confiar
// en ella. Este módulo es la fórmula única; `ticketService.ts` la aplica de verdad (design.md §3) y el
// cliente la consume para prellenar (regla 13 punto 3: espejo legítimo porque la imposición del
// servidor queda probada).
//
// Apto para navegador: sin dependencias de Node, sólo el tipo de `Transition`.
import type { Transition } from './transitions'

/** La zona de negocio fija (`RQ-TZ-13`). Nunca la del proceso que ejecuta el cálculo. */
export const ZONA_NEGOCIO = 'America/Bogota'

/** El mapa etiqueta → fuente de las tres fechas derivadas (design.md §4.1). */
export const FUENTE_DE_FECHA = {
  'Fecha creación ticket': 'createdAt',
  'Fecha Remisión Entrada': 'remisionEntrada',
  'Fecha Revisión Informe': 'escaladoARevisionAt',
} as const

export type EtiquetaFechaDerivada = keyof typeof FUENTE_DE_FECHA
export type FuenteDeFecha = (typeof FUENTE_DE_FECHA)[EtiquetaFechaDerivada]

export interface FuentesDeFechas {
  /** Instante: ISO con desplazamiento o `Date`. */
  createdAt?: unknown
  /** Remisiones VIGENTES, la más reciente primero. */
  remisiones?: ReadonlyArray<{ tipo: string; fecha: string }> | null
  escaladoARevisionAt?: unknown
}

const FORMA_FECHA = /^\d{4}-\d{2}-\d{2}$/
const CON_DESPLAZAMIENTO = /(?:Z|[+-]\d{2}:?\d{2})$/

/** Si una `YYYY-MM-DD` describe un día real del calendario (rechaza p. ej. `2026-02-30`). */
function esFechaCalendarioReal(texto: string): boolean {
  if (!FORMA_FECHA.test(texto)) return false
  const [anio, mes, dia] = texto.split('-').map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

// A-7: construido UNA VEZ a nivel de módulo. Si el runtime no conociera la zona, el proceso cae al
// arrancar (visible en el despliegue), en vez de dar 500 en tres transiciones sueltas.
const FORMATEADOR_ZONA_NEGOCIO = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_NEGOCIO, year: 'numeric', month: '2-digit', day: '2-digit',
})

function diaDesdeInstante(instante: Date): string {
  const partes = FORMATEADOR_ZONA_NEGOCIO.formatToParts(instante)
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)!.value
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}

/**
 * A-5: el día en `ZONA_NEGOCIO` de un valor, o `null` si no es una fecha legible.
 *
 * La trampa que evita: `new Date('2026-09-09')` es medianoche UTC, que en Bogotá es el día 8. Por eso
 * una `YYYY-MM-DD` pasa DIRECTA —es una fecha de calendario, no un instante— y sólo un valor CON
 * desplazamiento (`Z`/`±hh:mm`) o un `Date` se reduce vía `Intl.DateTimeFormat`.
 */
export function diaEnZona(valor: unknown): string | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : diaDesdeInstante(valor)
  }
  if (typeof valor !== 'string') return null
  const texto = valor.trim()
  if (FORMA_FECHA.test(texto)) return esFechaCalendarioReal(texto) ? texto : null
  if (!CON_DESPLAZAMIENTO.test(texto)) return null // fecha-hora sin desplazamiento: Date.parse la leería en la zona del proceso
  const instante = Date.parse(texto)
  return Number.isNaN(instante) ? null : diaDesdeInstante(new Date(instante))
}

/** `Fecha Remisión Entrada` deriva de la PRIMERA remisión de tipo `entrada` (la más reciente, `remisiones.ts:76-79`). */
export function fechasDerivadas(f: FuentesDeFechas): Record<EtiquetaFechaDerivada, string | null> {
  const entrada = f.remisiones?.find((r) => r.tipo === 'entrada') ?? null
  return {
    'Fecha creación ticket': diaEnZona(f.createdAt),
    'Fecha Remisión Entrada': entrada ? diaEnZona(entrada.fecha) : null,
    'Fecha Revisión Informe': diaEnZona(f.escaladoARevisionAt),
  }
}

function esEtiquetaFechaDerivada(label: string): label is EtiquetaFechaDerivada {
  return label in FUENTE_DE_FECHA
}

/** Qué fuentes hay que leer para esta transición. Vacío para las 31 que no declaran ninguna (P-2). */
export function fuentesQueNecesita(t: Pick<Transition, 'fields'>): Set<FuenteDeFecha> {
  const fuentes = new Set<FuenteDeFecha>()
  for (const campo of t.fields) {
    if (esEtiquetaFechaDerivada(campo.label)) fuentes.add(FUENTE_DE_FECHA[campo.label])
  }
  return fuentes
}

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Los valores que de verdad se escriben: `recibidos`, con las tres etiquetas SIEMPRE filtradas (P-2)
 * y sustituidas por la derivada cuando hay fuente (D-1, pisa navegador y columna). Sin fuente, lo
 * tecleado se valida (D-3): inválido se queda en `values` —para que el plan no lo cuente además como
 * ausente— y entra en `erroresFecha`, que el `422` de `ticketService.ts:134` impide que se escriba.
 */
export function valoresEfectivos(
  t: Pick<Transition, 'fields'>,
  recibidos: unknown,
  fuentes: FuentesDeFechas,
): { values: Record<string, unknown>; erroresFecha: string[] } {
  const entrada = esObjetoPlano(recibidos) ? recibidos : {}
  const values: Record<string, unknown> = {}
  for (const [clave, valor] of Object.entries(entrada)) {
    if (!esEtiquetaFechaDerivada(clave)) values[clave] = valor
  }

  const erroresFecha: string[] = []
  const derivadas = fechasDerivadas(fuentes)
  for (const campo of t.fields) {
    if (!esEtiquetaFechaDerivada(campo.label)) continue
    const derivada = derivadas[campo.label]
    if (derivada !== null) { values[campo.label] = derivada; continue }
    const raw = entrada[campo.label]
    const vacio = raw === undefined || raw === null || raw === ''
    if (vacio) continue
    values[campo.label] = raw
    if (typeof raw !== 'string' || !esFechaCalendarioReal(raw)) {
      erroresFecha.push(`Fecha inválida en el campo: ${campo.label}`)
    }
  }
  return { values, erroresFecha }
}
