import type { Queryable } from '../db/migrate'

// Núcleo del mark-and-sweep: dado el set de IDs vivos en Zoho y los de la réplica,
// borra de la réplica los que ya no existen. Puro + un ejecutor por entidad.

export interface SweepGuard { maxRows: number; maxPct: number }
export interface SweepOpts { dryRun: boolean; guard: SweepGuard }

export interface SweepReport {
  table: string
  live: number
  replica: number
  orphans: number     // réplica − vivos (candidatos)
  confirmed: number   // candidatos re-verificados por id como AUSENTES en Zoho
  liveGaps: number    // candidatos que resultaron VIVOS (hueco de lista) → NO borrados
  uncertain: number   // no se pudo verificar (error) → NO borrados
  deleted: number
  dryRun: boolean
  skipped?: string    // motivo si se abortó (lista incompleta) o el tope lo frenó
}

export interface SweepEntity {
  schema: string          // 'books' | 'crm'
  table: string
  pk: string
  childTable?: string     // tabla hija a limpiar primero (ej. invoice_line_items)
  childFk?: string        // FK de la hija hacia el padre (ej. invoice_id)
  /** Recolecta TODOS los IDs vivos en Zoho. DEBE lanzar si alguna página falla (→ abortar, no borrar). */
  collectLive: () => Promise<Set<string>>
  /** Re-verifica por id: true = Zoho ya NO lo tiene (borrar); false = sigue vivo (NO borrar). Lanza si es indeterminado. */
  confirmDeleted: (id: string) => Promise<boolean>
}

/** IDs de la réplica que ya no están vivos en Zoho. */
export function orphanIds(live: Set<string>, replica: string[]): string[] {
  return replica.filter((id) => !live.has(id))
}

/** ¿Seguro borrar? false si supera el tope absoluto o el % de la tabla. */
export function guardOk(orphans: number, replicaTotal: number, g: SweepGuard): boolean {
  if (orphans > g.maxRows) return false
  if (replicaTotal > 0 && orphans / replicaTotal > g.maxPct) return false
  return true
}

/**
 * Barre una entidad: recolecta vivos → candidatos huérfanos → tope → **re-verifica cada candidato por id
 * en Zoho** → borra SOLO los confirmados ausentes (hijas y luego cabecera). La re-verificación corre
 * también en dry-run (es de solo lectura). Si `collectLive` lanza (página fallida), propaga → el llamador
 * reporta `skipped` (completo-o-abortar).
 */
export async function sweepEntity(db: Queryable, e: SweepEntity, opts: SweepOpts): Promise<SweepReport> {
  const live = await e.collectLive() // lanza → abortar entidad
  const res = await db.query(`SELECT ${e.pk} AS id FROM ${e.schema}.${e.table}`)
  const replica = res.rows.map((r: { id: unknown }) => String(r.id))
  const orphans = orphanIds(live, replica)
  const base: SweepReport = {
    table: `${e.schema}.${e.table}`, live: live.size, replica: replica.length,
    orphans: orphans.length, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun,
  }
  if (orphans.length === 0) return base
  if (!guardOk(orphans.length, replica.length, opts.guard)) {
    return { ...base, skipped: `tope: ${orphans.length} huérfanos sobre ${replica.length} filas` }
  }
  // ── Red de seguridad: re-verificar cada candidato por id en Zoho (solo lectura) ──
  const confirmed: string[] = []
  let liveGaps = 0, uncertain = 0
  for (const id of orphans) {
    try {
      if (await e.confirmDeleted(id)) confirmed.push(id)
      else { liveGaps++; console.warn(`sweep: ${e.schema}.${e.table} ${id} sigue VIVO en Zoho (hueco de lista) — NO se borra`) }
    } catch (err: any) {
      uncertain++; console.warn(`sweep: ${e.schema}.${e.table} ${id} no verificable (${String(err?.message ?? err)}) — NO se borra`)
    }
  }
  const rep: SweepReport = { ...base, confirmed: confirmed.length, liveGaps, uncertain }
  if (opts.dryRun || confirmed.length === 0) return rep
  // pg-mem no ejecuta el DELETE con `= ANY($1::text[])` (deja las filas intactas), así que usamos
  // una lista de placeholders `IN ($1,$2,…)`. Equivalente en Postgres real.
  const placeholders = confirmed.map((_, i) => `$${i + 1}`).join(',')
  if (e.childTable && e.childFk) {
    await db.query(`DELETE FROM ${e.schema}.${e.childTable} WHERE ${e.childFk} IN (${placeholders})`, confirmed)
  }
  await db.query(`DELETE FROM ${e.schema}.${e.table} WHERE ${e.pk} IN (${placeholders})`, confirmed)
  return { ...rep, deleted: confirmed.length }
}
