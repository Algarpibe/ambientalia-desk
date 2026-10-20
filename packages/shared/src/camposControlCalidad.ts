import type { TransitionField } from './transitions'

/**
 * control-calidad-liberacion (F1C-07) · datos del estado `Control de calidad` y de sus dos transiciones de firma.
 *
 * Módulo de DATOS, sin lógica de firma (esa vive en `controlCalidad.ts`, lote 1b). Sólo importa TIPOS de
 * `transitions.ts`: `transitions.ts` importa de aquí `camposAprobacionCC` y `camposRechazoCC`, y un `import` de valores
 * en los dos sentidos sería un ciclo; por eso las dos son `function` (se elevan) y no un `const`. Tampoco importa
 * `tipoEvento.ts`, que importa `transitions.ts`. Mismo molde que `anulacion.ts`.
 */
export const ESTADO_CONTROL_CALIDAD = 'Control de calidad'
export const ID_ENVIO_CC = 'envio_control_calidad'
export const ID_APROBACION_CC = 'aprobacion_control_calidad'
export const ID_RECHAZO_CC = 'rechazo_control_calidad'
/** Las dos transiciones que firma una persona habilitada (RQ-PM-33). El envío no firma: es Operativo y cuenta como intervención. */
export const IDS_FIRMA_CC: ReadonlySet<string> = new Set([ID_APROBACION_CC, ID_RECHAZO_CC])

/** Las tres casillas obligatorias de la aprobación (S-1), en el orden en que se muestran. */
export const CHECKLIST_CC: readonly string[] = [
  'Puntos que fallaron en el diagnóstico revisados',
  'Funcionamiento verificado',
  'Equipo completo, limpio y listo para embalar',
]
export const CLAVE_GAS_CC = 'Verificación con gas patrón realizada'
export const CLAVE_MOTIVO_FIRMA_ADMIN = 'Motivo de la firma del administrador'
export const CLAVE_MOTIVO_RECHAZO_CC = 'Motivo del rechazo'
/** Claves del acto que viven sólo en `values` de la traza: no se escriben en `tickets.custom_fields` (S-17). */
export const CLAVES_SOLO_TRAZA_CC: readonly string[] = [...CHECKLIST_CC, CLAVE_GAS_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC]

/** Campos de la aprobación, sin el comentario: tres casillas obligatorias, la del gas y el motivo del administrador, ambos opcionales en el catálogo. */
export function camposAprobacionCC(): TransitionField[] {
  return [
    ...CHECKLIST_CC.map((label): TransitionField => ({ key: label, label, kind: 'checkbox', required: true, target: 'customField' })),
    { key: CLAVE_GAS_CC, label: CLAVE_GAS_CC, kind: 'checkbox', required: false, target: 'customField' },
    { key: CLAVE_MOTIVO_FIRMA_ADMIN, label: CLAVE_MOTIVO_FIRMA_ADMIN, kind: 'text', required: false, target: 'customField' },
  ]
}

/** Campos del rechazo, sin el comentario: el motivo, obligatorio. */
export function camposRechazoCC(): TransitionField[] {
  return [{ key: CLAVE_MOTIVO_RECHAZO_CC, label: CLAVE_MOTIVO_RECHAZO_CC, kind: 'text', required: true, target: 'customField' }]
}
