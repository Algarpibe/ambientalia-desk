// anulado-con-motivo (F1C-01, lote 2) · RQ-TC-72: la consulta del histórico lista los candidatos y NO escribe.
// Guardián de TEXTO: pg-mem no ejecuta esta consulta (no soporta `CROSS JOIN LATERAL` con `jsonb_array_elements(h.raw …)` ni `LEAST`),
// así que lo que se vigila es el fichero (regla de mutación 2: se ensucia el .sql, no el guardián).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const RUTA = path.resolve(__dirname, '../../../docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql')
const existe = fs.existsSync(RUTA)
const texto = existe ? fs.readFileSync(RUTA, 'utf8') : ''
// Sin comentarios `--`: la cabecera nombra «marca» y «escribir» y no es sentencia.
const sentencias = texto.split(/\r?\n/).map((l) => l.replace(/--.*$/, '')).join('\n')

describe('Consulta_Candidatos_Anulado_2026-10-18.sql (RQ-TC-72)', () => {
  it('el fichero existe', () => { expect(existe).toBe(true) })
  it('va envuelta en una transacción de sólo lectura que se deshace', () => {
    expect(sentencias).toMatch(/^\s*BEGIN TRANSACTION READ ONLY;/i)
    expect(sentencias).toMatch(/ROLLBACK;\s*$/i)
    expect(sentencias.search(/BEGIN TRANSACTION READ ONLY/i)).toBeLessThan(sentencias.search(/\bSELECT\b/i))
    expect(sentencias.search(/\bSELECT\b/i)).toBeLessThan(sentencias.search(/ROLLBACK/i))
    expect(sentencias).not.toMatch(/\bCOMMIT\b/i)
  })
  it('no escribe: ninguna sentencia INSERT, UPDATE, DELETE, ALTER, CREATE, DROP ni TRUNCATE', () => {
    expect(sentencias.match(/\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE)\b/gi)).toBeNull()
  })
  it('lee las dos fuentes del bloque A: los tres ids de Desk y el «Rechazo» del historial de Zoho', () => {
    for (const id of ['rechazo_comercial', 'rechazo_cliente', 'rechazo_revision']) expect(sentencias).toContain(`'${id}'`)
    expect(sentencias).toContain('desk.ticket_transitions')
    expect(sentencias).toContain('desk.ticket_history')
    expect(sentencias).toContain("= 'Rechazo'")
    expect(sentencias).toMatch(/t\.status = 'Finalizado'/)
  })
  it('lista (número, fecha del Rechazo, fecha de llegada a Finalizado, origen) y no cuenta', () => {
    for (const col of ['numero', 'fecha_rechazo', 'fecha_finalizado', 'origen']) expect(sentencias).toMatch(new RegExp(`AS ${col}(?![a-z_])`))
    expect(sentencias).not.toMatch(/\bCOUNT\s*\(/i)
  })
})
