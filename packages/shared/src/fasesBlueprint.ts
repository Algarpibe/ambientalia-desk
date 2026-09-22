// Partición del Blueprint en las tres fases del recorrido (P-3 del proposal
// `generador-mapa-blueprint`, M1.3.1 del maestro, `R08.2.md:1187-1191`). Es un dato de negocio,
// igual que `CLASIFICACION_EN_ESPERA` y `ESTADOS_SIN_SALIDA` (`estados.ts:59-160`): ningún grafo
// puede derivarla solo, porque el grafo no sabe qué fase representa una notificación o una espera
// — eso lo decide el maestro, no la topología.
//
// La transición SÍ se deriva: pertenece a la fase de su `from` y, si su `to` cae en otra fase,
// aparece también ahí, marcada como frontera (`mapaBlueprint.ts`, Unidad B). Sólo el ESTADO se
// declara a mano.

import type { Estado } from './estados'

/** Las tres fases del recorrido, en el orden de M1.3.1. */
export type FaseId = 'entrada' | 'diagnostico' | 'cierre'

export interface Fase {
  id: FaseId
  /** Título tal como lo nombra el maestro (`R08.2.md:1188`, `:1190`, `:1191`). */
  nombre: string
}

export const FASES: Fase[] = [
  { id: 'entrada', nombre: 'Entrada y remisión' },
  { id: 'diagnostico', nombre: 'Diagnóstico, cotización y ejecución' },
  { id: 'cierre', nombre: 'Cierre administrativo y entrega' },
]

/**
 * La fase de cada uno de los 21 estados. `satisfies Record<Estado, FaseId>` es la guarda de
 * COMPILACIÓN de las dos que pide D-1 del diseño: una clave que falte o que sobre es error de
 * `tsc` en esta misma declaración, antes de que el generador (Unidad B) llegue a ejecutarse. La
 * otra guarda —el `throw` de `mapaBlueprint.ts` ante una tabla inyectada e incompleta— es la que
 * una prueba puede poner en rojo, y vive en la Unidad B: las dos hacen falta y no son la misma.
 *
 * Tres asignaciones NO son mecánicas y se citan aparte:
 * - `Ingresado` → `entrada`: `R08.2.md:1188` lo nombra en la fase 1 («… convergen en Ingresado»);
 *   no aparece en `:1190`, que arranca en Rev./Diagnostico. `ingreso_a_servicio` es la frontera
 *   1→2.
 * - `Pendiente` → `diagnostico`: no está en M1.3.1 (nació el 11/09, posterior a esa redacción);
 *   deriva de sus dos únicas salidas, las dos de vuelta a Servicio Técnico (`estados.ts:101-105`).
 * - Los cuatro de `ESTADOS_SIN_SALIDA` (`estados.ts:151-160`) → `diagnostico`: `R08.2.md:1190` los
 *   nombra en bloque como «los cuatro estados de espera» de esa fase.
 */
export const FASE_POR_ESTADO = {
  'OV asignada': 'entrada',
  'Ticket creado': 'entrada',
  'Remisión creada': 'entrada',
  'Ingresado': 'entrada',

  'Rev./Diagnostico': 'diagnostico',
  'Notificado': 'diagnostico',
  'Notificación a Compras': 'diagnostico',
  'Notificación Comercial': 'diagnostico',
  'Notificación cliente': 'diagnostico',
  'En Proceso': 'diagnostico',
  'Continuación del proceso': 'diagnostico',
  'Pendiente': 'diagnostico',
  'En Espera de Repuestos': 'diagnostico',
  'Solicitado': 'diagnostico',
  'Servicio externo': 'diagnostico',
  'En espera de SKU inventario': 'diagnostico',

  'Por Facturar': 'cierre',
  'Liberación Comercial': 'cierre',
  'Por Entregar': 'cierre',
  'Por Entregar / Sin facturar': 'cierre',
  'Finalizado': 'cierre',
} satisfies Record<Estado, FaseId>
