import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { areasSiguientes, catalogoDelTicket, FROM_STATUS_CREACION, ID_TRANSICION_MIGRACION, TRANSITIONS } from '@ambientalia/shared'
import { areasAAvisar } from '../services/avisoArea'
import { getHistorialTicket } from './historial'
import { lineaTraspaso } from './traspaso'

const NOMBRES = new Map([['u-ana', 'Ana'], ['u-beto', 'Beto']])
const T = '2026-08-02T10:00:00Z'
/** Una fila de `ticket_transitions` tal como la devuelve la consulta del historial. */
const fila = (extra: Record<string, unknown> = {}) => ({
  transition_id: 'habilitar', transition_name: 'Habilitar Servicio', from_status: 'OV asignada', to_status: 'Ingresado',
  performed_by: 'Ana', performed_at: new Date(T), values: {}, ...extra,
})
const servicio = { classification: 'Servicio' }
const linea = (extra: Record<string, unknown> = {}, ticket: { classification?: unknown } = servicio) => lineaTraspaso(fila(extra), NOMBRES, ticket)

describe('lineaTraspaso · destino (RQ-TZ-18)', () => {
  it('con persona: «Traspaso: Ana → Beto» con De, A, Por la etapa y la hora de la transición', () => {
    const [ev, ...resto] = linea({ values: { derivado_a: 'u-beto' } })
    expect(resto).toEqual([])
    expect(ev).toEqual({
      eventName: 'AppTraspaso', time: new Date(T).toISOString(), actor: 'Ana', title: 'Traspaso: Ana → Beto',
      details: [{ label: 'De', value: 'Ana' }, { label: 'A', value: 'Beto' }, { label: 'Por la etapa', value: 'Habilitar Servicio' }],
    })
  })

  it('sin persona: el destino es lo que devuelven `areasSiguientes` y `areasAAvisar` (con un actor sin áreas), llamadas aquí', () => {
    const esperado = areasSiguientes('Ingresado', catalogoDelTicket({ classification: 'Servicio', status: 'Ingresado' }))
    expect(esperado.length).toBeGreaterThan(0)
    expect(areasAAvisar('Ingresado', [], catalogoDelTicket({ classification: 'Servicio', status: 'Ingresado' }))).toEqual(esperado)
    const [ev] = linea()
    expect(ev.details).toContainEqual({ label: 'A', value: esperado.join(', ') })
    expect(ev.title).toBe(`Traspaso: Ana → ${esperado.join(', ')}`)
  })

  it('una sola área, sin restar nada: «Comercial → Comercial» también sale (S-4)', () => {
    const [ev] = linea({ from_status: 'Ticket creado', to_status: 'OV asignada', performed_by: 'Luz' })
    expect(ev.title).toBe('Traspaso: Luz → Comercial')
    expect(areasSiguientes('OV asignada', catalogoDelTicket({ classification: 'Servicio', status: 'OV asignada' }))).toEqual(['Comercial'])
  })

  it('clave `derivado_a` vacía: se trata como ausente y va por área', () => {
    const [ev] = linea({ values: { derivado_a: '  ' } })
    expect(ev.details).toContainEqual({ label: 'A', value: 'Servicio Técnico' })
  })

  it('id que no resuelve: se enseña crudo, sin «desconocido»', () => {
    expect(linea({ values: { derivado_a: 'u-fantasma' } })[0].title).toBe('Traspaso: Ana → u-fantasma')
  })

  it('persona igual al origen: hay línea (S-4)', () => {
    expect(linea({ values: { derivado_a: 'u-ana' } })[0].title).toBe('Traspaso: Ana → Ana')
  })

  it('values como texto (pg-mem) y sin quien actuó: el origen y el actor caen a «App»', () => {
    const [ev] = linea({ performed_by: null, values: JSON.stringify({ derivado_a: 'u-beto' }) })
    expect(ev.actor).toBe('App')
    expect(ev.details[0]).toEqual({ label: 'De', value: 'App' })
  })

  it('estado terminal sin persona: no hay línea; con persona sí', () => {
    expect(linea({ to_status: 'Finalizado' })).toEqual([])
    expect(linea({ to_status: 'Finalizado', values: { derivado_a: 'u-beto' } })).toHaveLength(1)
  })

  it('«Equipo nuevo» usa su catálogo y no TRANSITIONS', () => {
    // «Verificación» tiene área siguiente sólo en el catálogo de equipo nuevo.
    expect(areasSiguientes('Verificación', TRANSITIONS)).toEqual([])
    const en = linea({ from_status: 'Ingresado', to_status: 'Verificación' }, { classification: 'Equipo nuevo' })
    expect(en[0].title).toBe('Traspaso: Ana → Servicio Técnico')
    expect(linea({ from_status: 'Ingresado', to_status: 'Verificación' })).toEqual([])
  })

  it('las etiquetas son «De» y «A», nunca «Derivado a» (historial.test.ts filtra por esa etiqueta)', () => {
    const etiquetas = linea({ values: { derivado_a: 'u-beto' } })[0].details.map((d) => d.label)
    expect(etiquetas).toEqual(['De', 'A', 'Por la etapa'])
    expect(etiquetas).not.toContain('Derivado a')
  })
})

describe('lineaTraspaso · exclusiones (RQ-TZ-19)', () => {
  it('la creación con derivación no produce línea', () => {
    expect(linea({ from_status: FROM_STATUS_CREACION, to_status: 'OV asignada', values: { derivado_a: 'u-beto' } })).toEqual([])
  })

  it('marcador con `to_status` nulo: ninguna', () => {
    expect(linea({ transition_id: ID_TRANSICION_MIGRACION, to_status: null })).toEqual([])
  })

  it('marcador con destino relleno y área siguiente: ninguna', () => {
    expect(areasSiguientes('Ingresado', TRANSITIONS).length).toBeGreaterThan(0)
    expect(linea({ transition_id: ID_TRANSICION_MIGRACION, from_status: 'Pendiente', to_status: 'Ingresado' })).toEqual([])
    expect(linea({ transition_id: ID_TRANSICION_MIGRACION, to_status: 'Ingresado', values: { derivado_a: 'u-beto' } })).toEqual([])
  })

  it('otra transición con `to_status` nulo y persona derivada sí da línea: el criterio es el identificador', () => {
    const r = linea({ to_status: null, values: { derivado_a: 'u-beto' } })
    expect(r).toHaveLength(1)
    expect(r[0].title).toBe('Traspaso: Ana → Beto')
    expect(linea({ to_status: null })).toEqual([])
  })
})

describe('getHistorialTicket · traspaso en la línea de tiempo (RQ-TZ-18, RQ-AV-18)', () => {
  let db: Queryable
  beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })
  const ticket = (id: string) => db.query("INSERT INTO tickets (id,number,subject,status,classification) VALUES ($1,1,'A','Ingresado','Servicio')", [id])
  const trans = (id: string, extra: { tid?: string | null; to?: string | null; values?: object; at?: string; name?: string } = {}) =>
    db.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,performed_by,performed_at,values)
       VALUES ($1,$2,$3,'OV asignada',$4,'Ana',$5,$6)`,
      [id, extra.tid ?? 'habilitar', extra.name ?? 'Habilitar Servicio', extra.to === undefined ? 'Ingresado' : extra.to, extra.at ?? T, JSON.stringify(extra.values ?? {})],
    )
  const espiar = () => {
    const sqls: string[] = []
    return { sqls, espia: { query: (sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ').trim()); return db.query(sql, p) } } as unknown as Queryable }
  }

  it('con la misma hora, el traspaso queda en el índice anterior al de su transición (D-13)', async () => {
    await ticket('t1'); await trans('t1')
    const { eventos } = await getHistorialTicket(db, 't1')
    const titulos = eventos.map((e) => e.title)
    expect(titulos).toEqual(['Traspaso: Ana → Servicio Técnico', 'Transición: Habilitar Servicio'])
    expect(titulos.indexOf('Traspaso: Ana → Servicio Técnico')).toBeLessThan(titulos.indexOf('Transición: Habilitar Servicio'))
  })

  it('resuelve el nombre de la persona derivada con la misma traducción que el campo', async () => {
    await ticket('t2')
    await db.query("INSERT INTO users (id,email,name,password_hash) VALUES ('u-b','b@x.co','Beto','h')")
    await trans('t2', { values: { derivado_a: 'u-b' } })
    const { eventos } = await getHistorialTicket(db, 't2')
    expect(eventos.map((e) => e.title)).toEqual(['Traspaso: Ana → Beto', 'Transición: Habilitar Servicio'])
  })

  it('el marcador de F1F-01 no da traspaso, ni con destino ni sin él', async () => {
    await ticket('t3')
    await trans('t3', { tid: ID_TRANSICION_MIGRACION, name: 'Migración', to: null })
    await trans('t3', { tid: ID_TRANSICION_MIGRACION, name: 'Migración', to: 'Ingresado', at: '2026-08-03T10:00:00Z' })
    expect((await getHistorialTicket(db, 't3')).eventos.map((e) => e.eventName)).toEqual(['AppTransition', 'AppTransition'])
  })

  it('abrir el historial dos veces no emite INSERT, UPDATE ni DELETE y no crea avisos (RQ-AV-18)', async () => {
    await ticket('t4'); await trans('t4')
    const avisos = async () => (await db.query('SELECT * FROM avisos')).rows
    const antes = await avisos()
    const { espia, sqls } = espiar()
    await getHistorialTicket(espia, 't4'); await getHistorialTicket(espia, 't4')
    expect(sqls.length).toBeGreaterThan(0)
    expect(sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s))).toEqual([])
    expect(await avisos()).toEqual(antes)
  })
})

// RQ-TZ-17 · límite declarado: mira ESTOS cuatro ficheros como texto, no lo que importan.
describe('excepciones de traza (RQ-TZ-17) · los registros propios no entran en el historial', () => {
  it('un ajuste de `prioridad_ajustes` no genera ningún evento', async () => {
    const pg = newDb().adapters.createPg(); const db: Queryable = new pg.Pool(); await migrate(db)
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t5',5,'A','Ingresado')")
    const sin = (await getHistorialTicket(db, 't5')).eventos
    await db.query("INSERT INTO prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, ajustado_at) VALUES ('t5','Normal','Alta','x','Ana','2026-08-02T10:00:00Z')")
    expect((await db.query('SELECT * FROM prioridad_ajustes')).rows).toHaveLength(1)
    expect((await getHistorialTicket(db, 't5')).eventos).toEqual(sin)
  })

  it('historial.ts, ticketFuentes.ts, remisionRestaurada.ts y traspaso.ts no nombran esos registros', () => {
    for (const f of ['historial', 'ticketFuentes', 'remisionRestaurada', 'traspaso']) {
      const texto = readFileSync(fileURLToPath(new URL(`./${f}.ts`, import.meta.url)), 'utf8')
      for (const tabla of ['prioridad_ajustes', 'ov_asociaciones', 'equipos_cambios']) expect(texto, `${f}.ts nombra ${tabla}`).not.toContain(tabla)
    }
  })
})

describe('lineaTraspaso · el destino por área sigue al catálogo (W-1 y W-2 del verify)', () => {
  const areasDe = (estado: string) => areasSiguientes(estado, catalogoDelTicket({ classification: 'Servicio', status: estado }))

  it('varias áreas: «En Espera de Repuestos» da más de una y salen todas, unidas con coma', () => {
    const areas = areasDe('En Espera de Repuestos')
    expect(areas.length).toBeGreaterThan(1)
    const [ev] = linea({ to_status: 'En Espera de Repuestos' })
    expect(ev.details).toContainEqual({ label: 'A', value: areas.join(', ') })
    expect(ev.title).toBe(`Traspaso: Ana → ${areas.join(', ')}`)
  })

  it('para cada estado de llegada del catálogo, el destino es lo que da `areasSiguientes`: un área nueva llega sola', () => {
    const estados = [...new Set(TRANSITIONS.map((t) => t.to))]
    expect(estados.length).toBeGreaterThan(5)
    for (const estado of estados) {
      const areas = areasDe(estado)
      const eventos = linea({ to_status: estado })
      if (areas.length === 0) expect(eventos, estado).toEqual([])
      else expect(eventos[0].details, estado).toContainEqual({ label: 'A', value: areas.join(', ') })
    }
  })
})
