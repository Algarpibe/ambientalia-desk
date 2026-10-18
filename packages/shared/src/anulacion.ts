import type { Transition, TransitionField } from './transitions'

/**
 * anulado-con-motivo (F1C-01) · el estado `Anulado`, sus cinco motivos y la guarda de CONTENIDO (escalón C).
 *
 * Los motivos son los de `decision/c2-anulado` y los del maestro (`R08.4.md:2139-2144`). «Creado por error» y
 * «duplicado» NO son motivos: se borran, no se anulan (`R08.4.md:2145`). La lista vive aquí y la leen las tres
 * transiciones de `Anulación` (servicio, equipo nuevo y soporte remoto) a través de `camposAnulacion()`.
 *
 * `erroresAnulacion` es una función pura sobre la transición y los valores. Se activa por el CAMPO y no por el id
 * (diseño D1, como `liberacionSinFactura.ts`): si la transición no declara el campo del motivo, no hace nada. La lista
 * de motivos válidos es la de las `options` de ese mismo campo; este módulo sólo nombra el motivo que exige detalle.
 * La PRESENCIA no es suya: un valor vacío lo dice `buildTransitionPlan` (`apps/desk/server/transitionExec.ts:77`).
 *
 * Sólo importa TIPOS de `transitions.ts`: `transitions.ts` importa `camposAnulacion` de aquí, y un `import` de valores
 * en los dos sentidos sería un ciclo. Por eso `camposAnulacion` es una `function` (se eleva) y no un `const`.
 */
export const ESTADO_ANULADO = 'Anulado'
export const CLAVE_MOTIVO_ANULACION = 'Motivo de anulación'
export const CLAVE_DETALLE_ANULACION = 'Detalle del motivo de anulación'
/** «Otro» va el ÚLTIMO a propósito: el arnés de pruebas toma `options[0]` y no debe caer en el que exige detalle. */
export const MOTIVOS_ANULACION: readonly string[] = [
  'El cliente no aprueba o se echa atrás',
  'Sin solución técnica',
  'Repuesto no disponible',
  'Caducidad de espera: el cliente no responde ni retira el equipo',
  'Otro',
]
export const MOTIVO_QUE_EXIGE_DETALLE = 'Otro'

/** El motivo (select obligatorio) y el detalle (texto, obligatorio sólo con «Otro», lo impone `erroresAnulacion`). */
export function camposAnulacion(): TransitionField[] {
  return [
    { key: CLAVE_MOTIVO_ANULACION, label: 'Motivo', kind: 'select', required: true, target: 'customField', options: [...MOTIVOS_ANULACION] },
    { key: CLAVE_DETALLE_ANULACION, label: 'Detalle del motivo', kind: 'text', required: false, target: 'customField' },
  ]
}

const vacio = (x: unknown) => x === undefined || x === null || x === ''
const leer = (valores: unknown, clave: string): unknown =>
  typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>)[clave] : undefined

export function erroresAnulacion(t: Pick<Transition, 'fields'>, valores: unknown): string[] {
  const campo = t.fields.find((f) => f.key === CLAVE_MOTIVO_ANULACION)
  if (!campo) return []
  const opciones = campo.options ?? []
  const motivo = leer(valores, CLAVE_MOTIVO_ANULACION)
  const detalle = leer(valores, CLAVE_DETALLE_ANULACION)
  const errores: string[] = []
  if (!vacio(motivo) && !(typeof motivo === 'string' && opciones.includes(motivo))) errores.push(`El motivo debe ser uno de: ${opciones.join(' · ')}`)
  if (motivo === MOTIVO_QUE_EXIGE_DETALLE && !(typeof detalle === 'string' && detalle.trim() !== '')) {
    errores.push(`Falta el detalle del motivo: es obligatorio con el motivo «${MOTIVO_QUE_EXIGE_DETALLE}»`)
  }
  return errores
}

export function esAnulado(estado: string): boolean {
  return estado === ESTADO_ANULADO
}
