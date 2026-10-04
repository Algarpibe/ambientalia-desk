/**
 * El orden de la lista de «Remisión creada» (F1B-07, L3; `vistas-tablero` RQ-VT-10). Función pura: la consume el servidor
 * y el cliente NO la usa para reordenar (regla invariable 13). El instante de entrada ascendente pone primero al ticket que
 * más tiempo lleva en el estado; sin entrada (o ilegible) va al final; el empate, y el tramo sin entrada, por número (SP-3).
 * La prioridad no interviene: es el reloj de la alarma, no la cola del taller.
 */
const numeroDe = (n: string | number): number => Number(String(n).replace(/\D/g, ''))
const instanteDe = (s: string | null): number | null => { const ms = Date.parse(s ?? ''); return Number.isNaN(ms) ? null : ms }

export function ordenarPorEntrada<T extends { enEstadoDesde: string | null; number: string | number }>(xs: readonly T[]): T[] {
  return [...xs].sort((a, b) => {
    const ia = instanteDe(a.enEstadoDesde), ib = instanteDe(b.enEstadoDesde)
    if (ia !== ib) return ia === null ? 1 : ib === null ? -1 : ia - ib
    return numeroDe(a.number) - numeroDe(b.number)
  })
}
