import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'

/**
 * Guardián de `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` (RQ-TS-28). El script NO se ejecuta contra
 * ninguna base real: lo ejecuta Alfonso tras desplegar. Esta prueba lo corre sobre pg-mem con un fixture DERIVADO de
 * `schema.sql` (calificando `desk.`, porque pg-mem no ejecuta SET SCHEMA y `migrate()` dejaría las tablas en public).
 *
 * pg-mem se ejecuta POR SENTENCIAS: el script se parte en sentencias y cada una va a `db.public.none`. La
 * atomicidad (BEGIN/COMMIT) se comprueba por lectura estática (caso f), no por rollback real.
 */
const DIR = path.dirname(fileURLToPath(import.meta.url))
const RUTA_SQL = path.join(DIR, '../../../../docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql')
const RUTA_SCHEMA = path.join(DIR, 'schema.sql')
const MARCADOR = 'migracion_f1c09_pendiente'

const leerScript = (): string => readFileSync(RUTA_SQL, 'utf8').replace(/\r\n/g, '\n')

/** Líneas activas: sin comentarios; con `reversion` se les quita el prefijo `-- REV ` antes. */
function sentencias(texto: string, reversion: boolean): string[] {
  const lineas = texto.split('\n').map((l) => (reversion ? l.replace(/^-- REV /, '') : l))
  const activas = lineas.filter((l) => !/^\s*--/.test(l)).join('\n')
  return activas.split(';').map((s) => s.trim()).filter(Boolean)
}

function ddlDerivado(): string[] {
  const schema = readFileSync(RUTA_SCHEMA, 'utf8').replace(/\r\n/g, '\n')
  const bloques = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (tickets|ticket_transitions) \(([\s\S]*?)\n\);/g)]
  expect(bloques.map((b) => b[1]), 'el fixture deriva de DOS bloques de schema.sql').toEqual(['tickets', 'ticket_transitions'])
  return ['CREATE SCHEMA desk', ...bloques.map((b) => `CREATE TABLE desk.${b[1]} (${b[2]}\n)`)]
}

type Db = ReturnType<typeof newDb>['public']
let db: Db

async function sembrar(): Promise<void> {
  const t = (id: string, n: number, status: string, cls: string | null, app: boolean) =>
    db.none(
      `INSERT INTO desk.tickets (id, number, status, classification, managed_by_app, modified_time, updated_at)
       VALUES ('${id}', ${n}, '${status}', ${cls === null ? 'NULL' : `'${cls}'`}, ${app}, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z')`,
    )
  await t('t1', 101, 'Pendiente', 'Servicio Técnico', true) // grupo 1, con traza previa
  await t('t2', 102, 'Pendiente', null, true) // grupo 1, classification NULL
  await t('t3', 103, 'Pendiente', 'Servicio Técnico', false) // grupo 2, gobierna Zoho
  await t('t4', 104, 'Pendiente', ' Soporte  Remoto'.replace('  ', ' '), true) // grupo 3, soporte remoto
  await t('t5', 105, 'En Proceso', 'Servicio Técnico', true) // control
  await db.none(
    `INSERT INTO desk.ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by)
     VALUES ('t1', 'previa', 'Traza previa', 'Ingresado', 'Pendiente', 'Servicio Técnico', 'tester')`,
  )
}

async function ejecutar(lista: string[]): Promise<void> {
  for (const s of lista) await db.none(s)
}

const estados = async () =>
  Object.fromEntries((await db.many('SELECT id, status FROM desk.tickets ORDER BY id')).map((r: { id: string; status: string }) => [r.id, r.status]))
const marcadores = async () =>
  (await db.many(`SELECT ticket_id FROM desk.ticket_transitions WHERE transition_id = '${MARCADOR}' ORDER BY ticket_id`)).map((r: { ticket_id: string }) => r.ticket_id)

beforeEach(async () => {
  db = newDb().public
  await ejecutar(ddlDerivado())
  await sembrar()
})

describe('Migracion_Pendiente_a_En_Proceso_F1C-09.sql (pg-mem, por sentencias)', () => {
  it('(a) mueve sólo el grupo 1, deja una fila marcador por ticket movido y la traza previa intacta', async () => {
    await ejecutar(sentencias(leerScript(), false))
    expect(await estados()).toEqual({ t1: 'En Proceso', t2: 'En Proceso', t3: 'Pendiente', t4: 'Pendiente', t5: 'En Proceso' })
    expect(await marcadores()).toEqual(['t1', 't2'])
    const previa = await db.many(`SELECT * FROM desk.ticket_transitions WHERE transition_id = 'previa'`)
    expect(previa).toHaveLength(1)
    expect(previa[0]).toMatchObject({ ticket_id: 't1', from_status: 'Ingresado', to_status: 'Pendiente', performed_by: 'tester' })
    const marca = await db.one(`SELECT * FROM desk.ticket_transitions WHERE transition_id = '${MARCADOR}' AND ticket_id = 't1'`)
    expect(marca).toMatchObject({ from_status: 'Pendiente', to_status: 'En Proceso', area: 'Servicio Técnico', performed_by: 'Migración F1C-09' })
  })

  it('(b) una segunda ejecución no cambia nada', async () => {
    await ejecutar(sentencias(leerScript(), false))
    const tras1 = { e: await estados(), m: await marcadores(), n: (await db.many('SELECT id FROM desk.ticket_transitions')).length }
    await ejecutar(sentencias(leerScript(), false))
    expect({ e: await estados(), m: await marcadores(), n: (await db.many('SELECT id FROM desk.ticket_transitions')).length }).toEqual(tras1)
  })

  it('(c) la reversión (quitando «-- REV ») devuelve los tickets a Pendiente y borra las filas marcador', async () => {
    const antes = await estados()
    await ejecutar(sentencias(leerScript(), false))
    const reversion = sentencias(leerScript(), true).slice(sentencias(leerScript(), false).length)
    expect(reversion.length, 'el script trae un bloque de reversión').toBeGreaterThan(0)
    await ejecutar(reversion)
    expect(await estados()).toEqual(antes)
    expect(await db.many(`SELECT id FROM desk.ticket_transitions WHERE transition_id = '${MARCADOR}'`)).toHaveLength(0)
    expect(await db.many(`SELECT id FROM desk.ticket_transitions WHERE transition_id = 'previa'`)).toHaveLength(1)
  })

  it('(d) toda tabla tras FROM|INTO|UPDATE|JOIN va calificada por esquema (también la reversión)', () => {
    const todo = sentencias(leerScript(), true).join(';\n')
    const refs = [...todo.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+([^\s(]+)/gi)].map((m) => m[1])
    expect(refs.length, 'guarda contra el bucle fantasma').toBeGreaterThanOrEqual(6)
    for (const r of refs) expect(r, `tabla sin calificar: ${r}`).toMatch(/^(desk|public)\.[a-z_]+$/)
  })

  it('(e) el recuento previo es de sólo lectura y lista los tres grupos y el número de los gobernados por Zoho', async () => {
    const todas = sentencias(leerScript(), false)
    const iBegin = todas.findIndex((s) => /^BEGIN$/i.test(s))
    expect(iBegin, 'el recuento va antes de BEGIN').toBeGreaterThan(0)
    const previo = todas.slice(0, iBegin)
    for (const s of previo) expect(s, `el recuento sólo lee: ${s.slice(0, 40)}`).toMatch(/^SELECT\b/i)
    const antes = await estados()
    const grupos = await db.many(previo[0])
    expect(grupos.map((g: { grupo: string; tickets: number | string }) => [g.grupo.charAt(0), Number(g.tickets)])).toEqual([['1', 2], ['2', 1], ['3', 1]])
    const zoho = await db.many(previo[1])
    expect(zoho.map((r: { number: number }) => r.number)).toEqual([103])
    expect(await estados()).toEqual(antes)
    expect(await db.many(`SELECT id FROM desk.ticket_transitions WHERE transition_id = '${MARCADOR}'`)).toHaveLength(0)
  })

  it('(f) atomicidad por lectura estática: un solo BEGIN…COMMIT con el INSERT antes del UPDATE dentro', () => {
    const s = sentencias(leerScript(), false)
    const idx = (re: RegExp) => s.findIndex((x) => re.test(x))
    const iB = idx(/^BEGIN$/i), iI = idx(/^INSERT INTO desk\.ticket_transitions/i), iU = idx(/^UPDATE desk\.tickets/i), iC = idx(/^COMMIT$/i)
    expect(s.filter((x) => /^BEGIN$/i.test(x))).toHaveLength(1)
    expect(s.filter((x) => /^COMMIT$/i.test(x))).toHaveLength(1)
    expect(iB).toBeGreaterThanOrEqual(0)
    expect(iB).toBeLessThan(iI)
    expect(iI).toBeLessThan(iU)
    expect(iU).toBeLessThan(iC)
  })

  it('no toca status_type ni managed_by_app, no reescribe filas existentes y no lleva metacomandos ni secretos', () => {
    const texto = leerScript()
    const activo = sentencias(texto, false).join(';\n')
    expect(activo).not.toMatch(/status_type/i)
    const setDelUpdate = /UPDATE\s+desk\.tickets\s+SET([\s\S]*?)\bWHERE/i.exec(activo)
    expect(setDelUpdate, 'el UPDATE de desk.tickets existe').not.toBeNull()
    expect(setDelUpdate![1]).not.toMatch(/managed_by_app|status_type/i)
    expect(activo).not.toMatch(/UPDATE\s+desk\.ticket_transitions/i)
    expect(texto).not.toMatch(/^\\/m)
    expect(texto).not.toMatch(/password|secret|token|postgres(ql)?:\/\//i)
  })
})
