import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/** Lo que hace falta de un pool para abrir una transacción. `Queryable` no lo declara. */
interface ConPool { connect?: () => Promise<{ query: Queryable['query']; release: () => void }> }

/**
 * Envuelve `fn` en una transacción cuando `db` es un pool de verdad, y devuelve lo que `fn` devuelva.
 *
 * Mismo molde que `eliminarTicket.ts:175-189` y el bloque try/catch de `repo.ts:403-415`, con dos
 * diferencias: es genérico en `T` (para poder devolver, por ejemplo, el id del equipo recién creado
 * a quien la llama) y el cliente se libera SIEMPRE, con o sin error (regla RQ-TC-16).
 */
export async function enTransaccion<T>(db: Queryable, fn: (q: Queryable) => Promise<T>): Promise<T> {
  const pool = db as unknown as ConPool
  if (typeof pool.connect !== 'function') return fn(db)
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN', [])
    const resultado = await fn(cliente as unknown as Queryable)
    await cliente.query('COMMIT', [])
    return resultado
  } catch (e) {
    await cliente.query('ROLLBACK', []).catch(() => {})
    throw e
  } finally {
    cliente.release()
  }
}
