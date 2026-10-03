import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { STATUS_TICKET_CREADO, STATUS_REMISION_CREADA, motivoSinRemisionVigente } from '@ambientalia/shared'
import { sincronizarEstadoPorRemision } from './estadoPorRemision'
import { vigenciaDeRemisiones, remisionPendienteDe, listRemisionesByTicket } from './remisiones'
import { remisionDePrueba } from '../testing/remisionDePrueba'

/**
 * RQ-RE-20 (F1B-03, parte L) · la GUARDA de `habilitar_servicio` frente al RECUENTO de `Remisión creada`,
 * fila a fila, con sus dos divergencias AFIRMADAS. Molde H5: dos implementaciones de nociones vecinas, ninguna rota
 * por separado, y una prueba que las enfrenta.
 *
 * - La GUARDA (`vigenciaDeRemisiones` + `motivoSinRemisionVigente`): cuenta toda remisión de ENTRADA no anulada, sea
 *   cual sea su estado de envío («vigente», Gerencia, `docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`).
 * - El RECUENTO (`sincronizarEstadoPorRemision`, `estadoPorRemision.ts`): cuenta sólo las CONFIRMADAS (`ok`, `ok_con_avisos`),
 *   no anuladas, y no filtra `tipo`; es lo que mueve el ticket a `Remisión creada` (RQ-TS-03, RQ-RE-11).
 *
 * DIVERGEN A PROPÓSITO, y la prueba lo nombra (no es un defecto que arreglar; cambiarlo pide una decisión):
 * - en `estado`: con una entrada `pendiente` o en `error` la guarda HABILITA y el recuento NO pasa el ticket a
 *   `Remisión creada` — un ticket sigue en `Ticket creado` y se habilita desde ahí;
 * - en `tipo`: una fila `ok` no anulada de tipo distinto de entrada, la guarda NO la cuenta y el recuento SÍ.
 *
 * Si alguien alinea una con otra sin decisión —filtra `estado` en el predicado, lo quita del recuento o filtra
 * `tipo` en el recuento—, esta prueba se pone roja.
 */

let db: Queryable

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', ['t-rv', 9300, 'RQ-RE-20', STATUS_TICKET_CREADO])
})

type Over = NonNullable<Parameters<typeof remisionDePrueba>[2]>

/** ¿La guarda habilita este ticket? Lo que hace `exigirRemisionVigente`: la lectura sin filtros y el predicado compartido. */
async function guardaHabilita(id: string): Promise<boolean> {
  return motivoSinRemisionVigente(await vigenciaDeRemisiones(db, id)) === null
}

/** ¿El recuento pasa el ticket a `Remisión creada`? Se observa por su efecto, como `estadoPorRemision.test.ts`. */
async function recuentoPasaARemisionCreada(id: string): Promise<boolean> {
  await sincronizarEstadoPorRemision(db, id, 'RQ-RE-20')
  return (await db.query('SELECT status FROM tickets WHERE id = $1', [id])).rows[0].status === STATUS_REMISION_CREADA
}

const COINCIDEN: [string, Over[], boolean][] = [
  ['entrada ok, no anulada', [{}], true],
  ['entrada ok_con_avisos, no anulada', [{ estado: 'ok_con_avisos' }], true],
  ['entrada histórica ok, no anulada', [{ origen: 'historico' }], true],
  ['entrada ok, anulada', [{ anulada: true }], false],
  ['entrada anulada y otra entrada ok posterior', [{ anulada: true }, {}], true],
]

describe('RQ-RE-20 · la guarda y el recuento COINCIDEN donde deben', () => {
  it.each(COINCIDEN)('%s', async (_, filas, cuentan) => {
    for (const f of filas) await remisionDePrueba(db, 't-rv', f)
    expect(await guardaHabilita('t-rv'), 'veredicto de la guarda').toBe(cuentan)
    expect(await recuentoPasaARemisionCreada('t-rv'), 'veredicto del recuento').toBe(cuentan)
  })
})

describe('RQ-RE-20 · DIVERGENCIA DECLARADA en `estado`: pendiente o error → la guarda habilita y el recuento NO pasa a «Remisión creada»', () => {
  it.each(['pendiente', 'error'])('entrada %s, no anulada: la guarda HABILITA y el ticket sigue en «Ticket creado»', async (estado) => {
    await remisionDePrueba(db, 't-rv', { estado })
    expect(await guardaHabilita('t-rv'), 'la guarda cuenta toda entrada no anulada').toBe(true)
    expect(await recuentoPasaARemisionCreada('t-rv'), 'el recuento sólo cuenta las confirmadas').toBe(false)
    expect((await db.query('SELECT status FROM tickets WHERE id = $1', ['t-rv'])).rows[0].status).toBe(STATUS_TICKET_CREADO)
  })
})

describe('RQ-RE-20 · DIVERGENCIA DECLARADA en `tipo`: una fila ok no anulada de tipo distinto de entrada → la guarda NO la cuenta y el recuento SÍ', () => {
  it('tipo «salida», ok, no anulada', async () => {
    await remisionDePrueba(db, 't-rv', { tipo: 'salida' })
    expect(await guardaHabilita('t-rv'), 'la guarda sólo cuenta entradas').toBe(false)
    expect(await recuentoPasaARemisionCreada('t-rv'), 'el recuento no filtra tipo').toBe(true)
  })
})

describe('RQ-RE-20 · lo que NO cambia', () => {
  it('una pendiente sigue bloqueando la creación de otra (RQ-RE-06) y la guarda dice que SÍ hay una vigente', async () => {
    const id = await remisionDePrueba(db, 't-rv', { estado: 'pendiente' })
    expect(await remisionPendienteDe(db, 't-rv')).toBe(id)
    expect(await guardaHabilita('t-rv')).toBe(true)
  })

  it('sin pendiente (una ok), remisionPendienteDe no devuelve nada y la guarda sigue habilitando', async () => {
    await remisionDePrueba(db, 't-rv', { estado: 'ok' })
    expect(await remisionPendienteDe(db, 't-rv')).toBeNull()
    expect(await guardaHabilita('t-rv')).toBe(true)
  })

  it('listRemisionesByTicket devuelve las no anuladas de cualquier estado, como antes', async () => {
    const ok = await remisionDePrueba(db, 't-rv', { estado: 'ok' })
    const pendiente = await remisionDePrueba(db, 't-rv', { estado: 'pendiente' })
    const error = await remisionDePrueba(db, 't-rv', { estado: 'error' })
    await remisionDePrueba(db, 't-rv', { estado: 'ok', anulada: true })
    expect((await listRemisionesByTicket(db, 't-rv')).map((r) => r.id).sort()).toEqual([ok, pendiente, error].sort())
  })
})
