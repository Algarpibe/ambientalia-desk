import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Los trece tickets cerrados en septiembre de 2026, ANONIMIZADOS (F1F-05, RQ-KP-38, S-10): sólo número, clasificación, estado, fechas y las columnas
 * 47 a 59 de Gerencia. Sin contacto, asunto, serial, `cf_codigo_servicio` ni tipo de servicio. Los ids (`sep-01`…`sep-13`) son sintéticos, nunca de Zoho.
 * `ordenCompra` sale de `cf_fecha_orden_de_compra` (no la `_final`) y `ordenVenta` de `cf_fecha_orden_de_venta` (no la de actualización).
 * `gerencia['50_53']` es la celda 50 de Gerencia, que en los trece coincide con la 53. El CSV de origen sigue sin trackear y no se copia.
 */
export interface TicketSeptiembre {
  id: string; numero: number; clasificacion: string; estado: string
  creado: string; cerrado: string
  remisionEntrada: string | null; remisionSalida: string | null; revisionInforme: string | null; cotizacion: string | null
  ordenCompra: string | null; ordenVenta: string | null; recepcionRepuestos: string | null; finalizacionSt: string | null
  diasEntrega: number | null
  gerencia: { '47': number | null; '49': number | null; '50_53': number | null; '51': number | null; '52': number | null; '53': number | null; '54': string | null; '57': number | null; '58': number | null; '59': number | null }
}

/** La lista cerrada de S-10: lo único que el fixture puede llevar. */
export const CLAVES_DEL_FIXTURE: readonly string[] = ['id', 'numero', 'clasificacion', 'estado', 'creado', 'cerrado', 'remisionEntrada', 'remisionSalida', 'revisionInforme', 'cotizacion', 'ordenCompra', 'ordenVenta', 'recepcionRepuestos', 'finalizacionSt', 'diasEntrega', 'gerencia']
export const CLAVES_DE_GERENCIA: readonly string[] = ['47', '49', '50_53', '51', '52', '53', '54', '57', '58', '59']

export const TICKETS_SEPTIEMBRE: readonly TicketSeptiembre[] = [
  { id: 'sep-01', numero: 932, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-04-27', cerrado: '2026-09-18', remisionEntrada: '2026-04-27', remisionSalida: '2026-09-18', revisionInforme: '2026-05-12', cotizacion: '2026-05-13', ordenCompra: '2026-05-19', ordenVenta: '2026-05-19', recepcionRepuestos: '2026-07-21', finalizacionSt: '2026-07-29', diasEntrega: 5,
    gerencia: { '47': 144, '49': 11, '51': 51, '52': 5, '53': 6, '54': 'No cumple', '57': 1, '58': 6, '59': 6, '50_53': 6 } },
  { id: 'sep-02', numero: 939, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-05-07', cerrado: '2026-09-08', remisionEntrada: '2026-05-12', remisionSalida: '2026-08-12', revisionInforme: '2026-05-28', cotizacion: '2026-05-19', ordenCompra: '2026-05-26', ordenVenta: '2026-05-19', recepcionRepuestos: null, finalizacionSt: '2026-07-28', diasEntrega: 15,
    gerencia: { '47': 119, '49': 15, '51': 42, '52': 15, '53': 50, '54': 'No cumple', '57': -9, '58': 7, '59': 0, '50_53': 50 } },
  { id: 'sep-03', numero: 940, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-05-07', cerrado: '2026-09-08', remisionEntrada: '2026-05-12', remisionSalida: '2026-08-12', revisionInforme: '2026-05-28', cotizacion: '2026-05-19', ordenCompra: '2026-05-19', ordenVenta: '2026-05-19', recepcionRepuestos: null, finalizacionSt: '2026-07-28', diasEntrega: 20,
    gerencia: { '47': 119, '49': 15, '51': 42, '52': 20, '53': 50, '54': 'No cumple', '57': -9, '58': 0, '59': 0, '50_53': 50 } },
  { id: 'sep-04', numero: 941, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-05-07', cerrado: '2026-09-08', remisionEntrada: '2026-05-12', remisionSalida: '2026-08-12', revisionInforme: '2026-05-28', cotizacion: '2026-05-19', ordenCompra: '2026-05-19', ordenVenta: '2026-05-19', recepcionRepuestos: null, finalizacionSt: '2026-07-28', diasEntrega: 20,
    gerencia: { '47': 119, '49': 15, '51': 42, '52': 20, '53': 50, '54': 'No cumple', '57': -9, '58': 0, '59': 0, '50_53': 50 } },
  { id: 'sep-05', numero: 957, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-06-11', cerrado: '2026-09-07', remisionEntrada: '2026-06-12', remisionSalida: '2026-09-02', revisionInforme: null, cotizacion: '2026-06-16', ordenCompra: '2026-06-16', ordenVenta: '2026-06-16', recepcionRepuestos: null, finalizacionSt: '2026-06-30', diasEntrega: null,
    gerencia: { '47': 87, '49': null, '51': 69, '52': null, '53': 10, '54': null, '57': null, '58': 0, '59': 0, '50_53': 10 } },
  { id: 'sep-06', numero: 969, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-07-22', cerrado: '2026-09-07', remisionEntrada: '2026-07-17', remisionSalida: '2026-07-27', revisionInforme: null, cotizacion: '2026-06-19', ordenCompra: '2026-07-17', ordenVenta: '2026-07-17', recepcionRepuestos: null, finalizacionSt: '2026-07-27', diasEntrega: 2,
    gerencia: { '47': 52, '49': null, '51': 42, '52': 2, '53': 6, '54': 'No cumple', '57': null, '58': 28, '59': 28, '50_53': 6 } },
  { id: 'sep-07', numero: 970, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-07-24', cerrado: '2026-09-07', remisionEntrada: '2026-07-16', remisionSalida: '2026-08-19', revisionInforme: '2026-07-27', cotizacion: '2026-07-27', ordenCompra: '2026-03-31', ordenVenta: '2026-03-31', recepcionRepuestos: null, finalizacionSt: '2026-08-19', diasEntrega: 15,
    gerencia: { '47': 53, '49': 1, '51': 19, '52': 15, '53': 101, '54': 'No cumple', '57': 0, '58': -118, '59': -118, '50_53': 101 } },
  { id: 'sep-08', numero: 971, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-07-31', cerrado: '2026-09-08', remisionEntrada: '2026-07-24', remisionSalida: '2026-09-08', revisionInforme: '2026-08-20', cotizacion: '2026-08-21', ordenCompra: '2026-07-31', ordenVenta: '2026-07-31', recepcionRepuestos: null, finalizacionSt: '2026-09-07', diasEntrega: 1,
    gerencia: { '47': 46, '49': 14, '51': 1, '52': 1, '53': 26, '54': 'No cumple', '57': 1, '58': -21, '59': -21, '50_53': 26 } },
  { id: 'sep-09', numero: 972, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-08-03', cerrado: '2026-09-15', remisionEntrada: '2026-07-24', remisionSalida: '2026-09-15', revisionInforme: '2026-08-05', cotizacion: '2026-08-06', ordenCompra: '2026-07-24', ordenVenta: '2026-07-27', recepcionRepuestos: null, finalizacionSt: '2026-09-15', diasEntrega: 15,
    gerencia: { '47': 53, '49': 2, '51': 0, '52': 15, '53': 36, '54': 'No cumple', '57': 1, '58': -13, '59': -10, '50_53': 36 } },
  { id: 'sep-10', numero: 973, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-08-12', cerrado: '2026-09-30', remisionEntrada: '2026-08-11', remisionSalida: '2026-09-18', revisionInforme: '2026-08-28', cotizacion: '2026-08-31', ordenCompra: null, ordenVenta: null, recepcionRepuestos: null, finalizacionSt: '2026-09-19', diasEntrega: 16,
    gerencia: { '47': 50, '49': 12, '51': 11, '52': 16, '53': null, '54': null, '57': 3, '58': null, '59': null, '50_53': null } },
  { id: 'sep-11', numero: 979, clasificacion: 'Equipo Nuevo', estado: 'Finalizado', creado: '2026-08-13', cerrado: '2026-09-07', remisionEntrada: null, remisionSalida: '2026-09-07', revisionInforme: null, cotizacion: null, ordenCompra: null, ordenVenta: null, recepcionRepuestos: null, finalizacionSt: '2026-08-28', diasEntrega: null,
    gerencia: { '47': null, '49': null, '51': 10, '52': null, '53': null, '54': null, '57': null, '58': null, '59': null, '50_53': null } },
  { id: 'sep-12', numero: 980, clasificacion: 'Equipo Para Servicio', estado: 'Finalizado', creado: '2026-08-14', cerrado: '2026-09-11', remisionEntrada: '2026-08-13', remisionSalida: '2026-09-10', revisionInforme: '2026-08-14', cotizacion: '2026-08-19', ordenCompra: null, ordenVenta: null, recepcionRepuestos: '2026-09-01', finalizacionSt: '2026-09-04', diasEntrega: 3,
    gerencia: { '47': 29, '49': 0, '51': 7, '52': 3, '53': 3, '54': 'Cumple', '57': 5, '58': null, '59': null, '50_53': 3 } },
  { id: 'sep-13', numero: 998, clasificacion: 'Equipo Nuevo', estado: 'Finalizado', creado: '2026-09-24', cerrado: '2026-09-24', remisionEntrada: null, remisionSalida: null, revisionInforme: null, cotizacion: null, ordenCompra: null, ordenVenta: null, recepcionRepuestos: null, finalizacionSt: null, diasEntrega: null,
    gerencia: { '47': null, '49': null, '51': null, '52': null, '53': 0, '54': null, '57': null, '58': null, '59': null, '50_53': 0 } },
]

/**
 * Siembra los trece en `tickets`: creación y cierre a mediodía de Bogotá (17:00Z, el día no depende de la zona), `status_type = 'Closed'`, `fecha_creacion_ticket` = creación
 * y cada fecha en su columna de `COLUMNA_DE_HITO` (`apps/desk/server/indicadores.ts`). Sin transiciones: el cierre sale de `closed_time` (S-1, caso b).
 */
export async function sembrarSeptiembre(db: Queryable): Promise<void> {
  for (const t of TICKETS_SEPTIEMBRE) {
    await db.query(
      `INSERT INTO tickets (id, number, status, status_type, classification, created_time, closed_time, dias_entrega, fecha_creacion_ticket, fecha_remision_entrada, fecha_remision_salida, fecha_revision_informe, fecha_cotizacion, fecha_orden_compra, fecha_orden_venta, fecha_recepcion_repuestos, fecha_finalizacion_st)
       VALUES ($1, $2, $3, 'Closed', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [t.id, t.numero, t.estado, t.clasificacion, `${t.creado}T17:00:00Z`, `${t.cerrado}T17:00:00Z`, t.diasEntrega, t.creado, t.remisionEntrada, t.remisionSalida, t.revisionInforme, t.cotizacion, t.ordenCompra, t.ordenVenta, t.recepcionRepuestos, t.finalizacionSt],
    )
  }
}
