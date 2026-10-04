import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate } from './migrate'
import { CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION, CLAVE_TEXTO_AUTORIZACION } from '@ambientalia/shared'
import { PROMOTED_COLUMNS } from './rows'
import { rowToTicketDetail } from './mappers'

/**
 * liberacion-sin-factura-motivo-fecha (F1C-05) · añadido por la verificación. Cierra dos escenarios sin prueba:
 * el mapa de `PROMOTED_COLUMNS` (42 entradas, las dos nuevas al final, la histórica presente, el texto fuera) y
 * el extremo de lectura de la ficha: `customFieldsFromRow` resuelve la etiqueta promovida desde la COLUMNA.
 */
describe('liberacion-sin-factura-motivo-fecha · el mapa y la ficha', () => {
  it('PROMOTED_COLUMNS: 42 entradas, motivo y fecha las dos últimas, la histórica sigue y el texto NO está', () => {
    const labels = PROMOTED_COLUMNS.map((p) => p.label)
    expect(labels).toHaveLength(42)
    expect(labels.slice(-2)).toEqual([CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION])
    expect(labels).toContain('Liberación del ticket sin facturar')
    expect(labels).not.toContain(CLAVE_TEXTO_AUTORIZACION)
  })

  it('el detalle del ticket enseña motivo y fecha desde sus columnas, y null si están vacías', () => {
    const base = { id: 't', number: 1, subject: 's', status: 'Por Entregar / Sin facturar', custom_fields: {} }
    const lleno = rowToTicketDetail({ ...base, liberacion_motivo: 'Fecha de corte de facturación del cliente', fecha_prevista_facturacion: new Date(2026, 9, 10) } as never)
    expect(lleno.customFields[CLAVE_MOTIVO_LIBERACION]).toBe('Fecha de corte de facturación del cliente')
    expect(lleno.customFields[CLAVE_FECHA_PREVISTA_FACTURACION]).toBe('2026-10-10')
    const vacio = rowToTicketDetail({ ...base, liberacion_motivo: null, fecha_prevista_facturacion: null } as never)
    expect(vacio.customFields[CLAVE_MOTIVO_LIBERACION]).toBeNull()
  })

  it('aplicar el esquema otra vez no toca las filas, las dos columnas nacen en NULL y la fecha es de tipo date', async () => {
    const db = new (newDb().adapters.createPg().Pool)()
    await migrate(db)
    await db.query("INSERT INTO tickets (id, number, subject, status, liberacion_sin_facturar) VALUES ('t', 1, 'Asunto', 'Por Facturar', true)")
    await migrate(db)
    const antes = (await db.query("SELECT subject, status, liberacion_sin_facturar, liberacion_motivo, fecha_prevista_facturacion FROM tickets WHERE id='t'")).rows[0]
    expect(antes).toEqual({ subject: 'Asunto', status: 'Por Facturar', liberacion_sin_facturar: true, liberacion_motivo: null, fecha_prevista_facturacion: null })
    await db.query("UPDATE tickets SET fecha_prevista_facturacion = '2026-10-10T10:00:00Z' WHERE id='t'")
    const tipo = (await db.query("SELECT fecha_prevista_facturacion AS f FROM tickets WHERE id='t'")).rows[0].f
    expect(tipo).toBeInstanceOf(Date)
  })
})
