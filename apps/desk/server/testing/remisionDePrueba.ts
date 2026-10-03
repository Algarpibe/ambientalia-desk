import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Remisión de prueba para la guarda de `habilitar_servicio` (RQ-TS-33, F1B-03 parte L).
 *
 * Inserta directo en `public.remisiones` (columnas de `packages/zoho-sync/src/db/schema.sql:271-287`, más
 * `origen` y `anulada_at`). Recibe `db` porque `ticketService.test.ts` levanta la suya y no usa el arnés.
 *
 * POR OMISIÓN `tipo 'entrada'`, `estado 'ok'`, sin anular, aunque CUALQUIER estado habilite:
 * - un `INSERT` directo no llama a `sincronizarEstadoPorRemision` (sólo lo llaman las rutas de anular,
 *   restaurar y confirmar el envío de `routes/remision.ts`), así que la `ok` NO mueve el ticket a
 *   `Remisión creada` y los asertos de «el ticket sigue en `Ticket creado`» no cambian;
 * - una `pendiente` rompería la puerta 3 de `routes/ovAsociaciones.test.ts` con el `409` de remisión
 *   pendiente (`remisionPendienteDe`).
 * `pendiente`, `error` y demás los inserta a propósito, con `over`, quien afirma que también habilitan.
 *
 * Sin prueba propia: lo ejercen las pruebas de RQ-TS-33 y RQ-RE-20 que lo usan.
 */
export async function remisionDePrueba(
  db: Queryable,
  ticketId: string,
  over?: { id?: string; tipo?: string; estado?: string; anulada?: boolean; origen?: string },
): Promise<string> {
  const id = over?.id ?? `rem-prueba-${randomUUID()}`
  await db.query(
    `INSERT INTO remisiones (id, ticket_id, tipo, fecha, estado, origen, anulada_at)
     VALUES ($1,$2,$3,'2026-03-01',$4,$5,$6)`,
    [id, ticketId, over?.tipo ?? 'entrada', over?.estado ?? 'ok', over?.origen ?? 'app', over?.anulada ? new Date() : null],
  )
  return id
}

/** El caso normal: una remisión de entrada confirmada y vigente. */
export const conRemisionVigente = (db: Queryable, ticketId: string) => remisionDePrueba(db, ticketId)
