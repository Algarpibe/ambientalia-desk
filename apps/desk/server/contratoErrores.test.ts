import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { HttpError } from './util/httpError'
import { executeTransition } from './services/ticketService'

/**
 * EL CONTRATO DE ERRORES `404`/`422` (P3, `orden-precedencia-guardas` F1B-10, design §5.2).
 *
 * LA REGLA, escrita y fijada por prueba: el sujeto que la petición DIRECCIONA por la URL —el `id` con
 * el que se llama al servicio— responde `404` cuando no existe. La entidad que la petición sólo
 * REFERENCIA desde el cuerpo, o que se resuelve contra datos ya guardados, responde `422` cuando esa
 * referencia no resuelve. Son dos preguntas distintas —«¿existe lo que pido?» frente a «¿es válido lo
 * que aporto?»— y el código HTTP es la única señal que el cliente tiene para distinguirlas.
 *
 * LOS DOS LADOS, EN `executeTransition`:
 *
 *   · N3 — el `id` de la URL no existe → `404` (`ticketService.ts:123`, el ticket es el sujeto
 *     direccionado).
 *   · N4 — el `id` de la URL existe, pero `derivado_a` (referencia dentro del cuerpo) no resuelve a
 *     nadie activo → `422` (`ticketService.ts:139`).
 *
 * LAS DOS NACEN VERDES: el comportamiento ya existe, cada una por su propia guarda, y hasta esta tanda
 * ninguna prueba fijaba las dos JUNTAS como dos caras de la MISMA regla. Bajo `strict_tdd` el rojo se
 * obtiene MUTANDO el código —invirtiendo el código de la guarda correspondiente—, corriendo la suite y
 * viendo caer el `it` NUEVO por su propio nombre, no sólo la prueba vecina que ya existía y que la
 * misma mutación también tumba. La evidencia de la mutación y su reversión queda en el
 * `apply-progress`, no en este fichero: las dos mutaciones son temporales y no dejan rastro aquí.
 *
 * **P3 no toca producción** (`proposal.md` §5.6, `design.md` §5.2.3): ningún código, texto ni guarda
 * de `ticketService.ts` ni de `remision.ts` cambia por este fichero.
 */

let db: Queryable

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const ADMIN = { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }

/** El `HttpError` que lanzó la llamada, con su código y su cuerpo. Falla si NO lanzó. */
async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    await fn()
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}

async function ticket(id: string, estado: string, numero = 8200): Promise<void> {
  await db.query(
    'INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
    [id, numero, 'Unidad de contratoErrores', estado],
  )
}

/**
 * `escalado_a_revision`: `Rev./Diagnostico` → `Notificado`, área **Servicio Técnico** (`ADMIN` la
 * salta), con `Prioridad` y `Días de entrega` como únicos obligatorios. Deja pasar las guardas A y B
 * sin rozarlas, para que N4 llegue limpia hasta la guarda de derivación.
 */
const ESCALADO = 'escalado_a_revision'
const VALORES_ESCALADO = { priority: 'High', 'Días de entrega': 5 }

describe('contrato de errores · el sujeto de la URL responde 404, la referencia del cuerpo responde 422', () => {
  it('N3 · el sujeto direccionado por la URL (id inexistente) responde 404, no 422', async () => {
    const r = await fallo(() => executeTransition(db, 'no-existe', { transitionId: ESCALADO, values: VALORES_ESCALADO }, ADMIN))
    expect(r.status).toBe(404)
    expect(r.body.error).toBe('Ticket no encontrado')
  })

  it('N4 · la entidad referenciada desde el cuerpo (derivado_a inexistente) responde 422, no 404', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: ESCALADO,
      values: { ...VALORES_ESCALADO, derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['La persona a la que se deriva no existe o está dada de baja'])
  })
})
