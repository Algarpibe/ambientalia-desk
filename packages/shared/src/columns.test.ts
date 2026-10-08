import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'; import { ESTADOS } from './estados'

describe('columns', () => {
  it('define las columnas del Blueprint en orden de flujo + Otros al final', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ov_asignada', 'ticket_creado', 'solicitud_soporte', 'remision_creada', 'ingresado', 'revision', 'notificado',
      'proceso', 'verificacion', 'solicitado', 'espera_repuestos', 'espera_sku', 'notif_compras', 'continuacion',
      'servicio_externo', 'pendiente', 'notif_cliente', 'notif_comercial', 'comercial',
      'por_facturar', 'entregar_sin_facturar', 'por_entregar', 'otros',
    ])
  })

  // Las dos primeras columnas son la MISMA fase con dos nombres: 'OV asignada' es el de Zoho y
  // llega así en todo lo que sincroniza, 'Ticket creado' es el de los tickets nacidos en la app.
  // Sin columna propia, lo que venga de Zoho caería en "Otros" y desaparecería del tablero.
  it('la fase inicial tiene columna para el nombre de Zoho y para el de la app', () => {
    expect(columnForStatus('OV asignada')).toBe('ov_asignada')
    expect(columnForStatus('Ticket creado')).toBe('ticket_creado')
    expect(columnForStatus('Remisión creada')).toBe('remision_creada')
  })

  it('mapea estados del Blueprint a su columna', () => {
    expect(columnForStatus('Ingresado')).toBe('ingresado')
    expect(columnForStatus('Rev./Diagnostico')).toBe('revision')
    expect(columnForStatus('Solicitado')).toBe('solicitado')
    expect(columnForStatus('Servicio externo')).toBe('servicio_externo')
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('En Espera de Repuestos')).toBe('espera_repuestos')
  })

  it('distingue Notificación Comercial de Liberación Comercial', () => {
    expect(columnForStatus('Notificación Comercial')).not.toBe(columnForStatus('Liberación Comercial'))
  })

  it('lleva estados sin columna propia (cierre/desconocidos) a "otros"', () => {
    expect(columnForStatus('Finalizado')).toBe('otros')
    expect(columnForStatus('Cualquier Cosa')).toBe('otros')
  })
})

// Columna de cada uno de los 23 estados ANTES del cambio (medida sobre 7a2b1c8).
const COLUMNA_ANTES: Record<string, string> = {"En Espera de Repuestos":"espera_repuestos","Servicio externo":"servicio_externo","Notificación cliente":"notif_cliente","Por Entregar":"por_entregar","Por Entregar / Sin facturar":"entregar_sin_facturar","Notificación a Compras":"notif_compras","Notificación Comercial":"notif_comercial","En espera de SKU inventario":"espera_sku","Solicitado":"solicitado","Liberación Comercial":"comercial","Remisión creada":"remision_creada","Ingresado":"ingresado","Rev./Diagnostico":"revision","Notificado":"notificado","En Proceso":"proceso","Continuación del proceso":"continuacion","Por Facturar":"por_facturar","Finalizado":"otros","OV asignada":"ov_asignada","Ticket creado":"ticket_creado","Pendiente":"pendiente","Verificación":"otros","Solicitud Soporte":"otros"}

describe('columna propia de Verificación y Solicitud Soporte (decision/e225-columna-propia-dos-estados)', () => {
  it('(a) la tabla tiene por claves exactamente ESTADOS, en los dos sentidos', () => { expect(Object.keys(COLUMNA_ANTES).sort()).toEqual([...ESTADOS].sort()) })
  it('(b) sólo esos dos estados cambian de columna', () => { expect(ESTADOS.filter((e) => columnForStatus(e) !== COLUMNA_ANTES[e]).sort()).toEqual(['Solicitud Soporte', 'Verificación']) })
  it('(c) sus columnas son verificacion y solicitud_soporte, con ese único estado cada una', () => {
    expect(columnForStatus('Verificación')).toBe('verificacion')
    expect(columnForStatus('Solicitud Soporte')).toBe('solicitud_soporte')
    expect(COLUMNS.find((c) => c.id === 'verificacion')?.statuses).toEqual(['Verificación'])
    expect(COLUMNS.find((c) => c.id === 'solicitud_soporte')?.statuses).toEqual(['Solicitud Soporte'])
  })
  it('(d) otros sigue siendo la última columna y no declara estados', () => { expect(COLUMNS[COLUMNS.length - 1]).toEqual({ id: 'otros', label: 'Otros', statuses: [] }) })
  it('(e) el único estado del registro que cae en otros es Finalizado', () => { expect(ESTADOS.filter((e) => columnForStatus(e) === 'otros')).toEqual(['Finalizado']) })
  it('(f) ningún estado está declarado en dos columnas', () => { const declarados = COLUMNS.flatMap((c) => c.statuses); expect(new Set(declarados).size).toBe(declarados.length) })
})
