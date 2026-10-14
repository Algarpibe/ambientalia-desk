import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

// F1F-05 (comparacion-exportacion-zoho), RQ-KP-25 y DD-9: el número de solicitud de los tickets de Desk que existen, por «ID».
// SOLO lectura, con parámetros ligados y `IN ($1,…)` por bloques (pg-mem no ejecuta `= ANY` con arrays ligados). Sin calificar
// `tickets`: la app conecta con `search_path=desk,public`, como `apps/desk/server/indicadores.ts`.

const marcadores = (n: number): string => Array.from({ length: n }, (_, i) => `$${i + 1}`).join(', ')

/** `id → tickets.number` de los ID que existen. Lista vacía: ninguna sentencia. Una consulta por bloque de `trozo` ID distintos. */
export async function numerosDeTickets(db: Queryable, ids: readonly string[], trozo = 5000): Promise<Map<string, number>> {
  const unicos = [...new Set(ids)]
  const numeros = new Map<string, number>()
  for (let i = 0; i < unicos.length; i += trozo) {
    const bloque = unicos.slice(i, i + trozo)
    const r = await db.query(`SELECT id, number FROM tickets WHERE id IN (${marcadores(bloque.length)})`, bloque)
    for (const t of r.rows as Array<{ id: unknown; number: unknown }>) numeros.set(String(t.id), Number(t.number))
  }
  return numeros
}
