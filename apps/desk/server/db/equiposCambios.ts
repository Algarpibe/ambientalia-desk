import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { CambioComercial, CambioEquipo } from '@ambientalia/shared'
import { enTransaccion } from './transaccion'

/**
 * Registro de cambios de los seis campos comerciales del equipo (RQ-HV-10, D3, D5).
 *
 * Módulo aparte de `equipos.ts` a propósito: importa SÓLO `enTransaccion`, sin ciclo. `db/equipos.ts`
 * re-exporta `registrarEdicion` y `listarCambiosEquipo` al final del fichero (D5) para que
 * `routes/equipos.ts` los siga importando desde `../db/equipos` sin desplazar ninguna de sus citas.
 */

/** El `iso()` de `ticketFuentes.ts` no se importa a propósito (misma razón de arriba: sin más imports). */
const isoLocal = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v))

/**
 * Inserta una fila de registro por cada campo de `cambios`, en la MISMA transacción que `escribir`
 * (el `UPDATE`/`active` del `PATCH`). `escribir` corre PRIMERO (D5, Fase 6): si falla, `enTransaccion`
 * hace `ROLLBACK` y ninguna fila de registro queda escrita.
 */
export async function registrarEdicion(
  db: Queryable,
  equipoId: string,
  cambios: CambioComercial[],
  persona: { id: string; nombre: string },
  escribir: (q: Queryable) => Promise<void>,
): Promise<void> {
  await enTransaccion(db, async (q) => {
    await escribir(q)
    for (const c of cambios) {
      await q.query(
        `INSERT INTO public.equipos_cambios (equipo_id,campo,valor_anterior,valor_nuevo,usuario_id,usuario_nombre)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [equipoId, c.campo, c.anterior, c.nuevo, persona.id, persona.nombre],
      )
    }
  })
}

/**
 * El registro del equipo, del cambio más reciente al más antiguo. El nombre del mantenedor se
 * resuelve al leer —no se persiste— con dos `LEFT JOIN clients` acotados a `campo = 'mantenedorId'`,
 * uno para el valor anterior y otro para el nuevo (Contratos de `design.md`).
 */
export async function listarCambiosEquipo(db: Queryable, equipoId: string): Promise<CambioEquipo[]> {
  const r = await db.query(
    `SELECT c.campo, c.valor_anterior, c.valor_nuevo, c.usuario_nombre, c.created_at,
            ca.name AS anterior_nombre, cn.name AS nuevo_nombre
       FROM public.equipos_cambios c
       LEFT JOIN clients ca ON c.campo = 'mantenedorId' AND ca.id = c.valor_anterior
       LEFT JOIN clients cn ON c.campo = 'mantenedorId' AND cn.id = c.valor_nuevo
      WHERE c.equipo_id = $1
      ORDER BY c.created_at DESC, c.id DESC`,
    [equipoId],
  )
  return (r.rows as Array<Record<string, unknown>>).map((row) => ({
    campo: row.campo as CambioEquipo['campo'],
    anterior: (row.valor_anterior as string | null) ?? null,
    nuevo: (row.valor_nuevo as string | null) ?? null,
    anteriorTexto: (row.anterior_nombre as string | null) ?? undefined,
    nuevoTexto: (row.nuevo_nombre as string | null) ?? undefined,
    usuarioNombre: row.usuario_nombre as string,
    fecha: isoLocal(row.created_at),
  }))
}
