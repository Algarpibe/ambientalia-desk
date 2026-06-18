/** ms desde `now` hasta la próxima ocurrencia de `hour`:00 local (hoy si aún no pasó, si no mañana). */
export function msUntilNextRun(hour: number, now: Date): number {
  const next = new Date(now)
  next.setHours(hour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Programa `task` cada día a `hour`:00. Devuelve stop() que cancela el próximo disparo. */
export function scheduleDailyAt(hour: number, task: () => Promise<void>): () => void {
  let timer: ReturnType<typeof setTimeout>
  let stopped = false
  function arm() {
    if (stopped) return
    timer = setTimeout(async () => {
      try { await task() } catch (e) { console.error('Job diario falló:', e) }
      arm()
    }, msUntilNextRun(hour, new Date()))
  }
  arm()
  return () => { stopped = true; clearTimeout(timer) }
}
