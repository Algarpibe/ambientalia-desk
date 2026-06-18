import { describe, it, expect, vi, afterEach } from 'vitest'
import { msUntilNextRun, scheduleDailyAt } from './schedule'

describe('msUntilNextRun', () => {
  it('si aún no pasó la hora hoy, apunta a hoy', () => {
    const now = new Date('2026-06-18T03:00:00')
    expect(msUntilNextRun(5, now)).toBe(2 * 3600 * 1000)
  })
  it('si ya pasó la hora, apunta a mañana', () => {
    const now = new Date('2026-06-18T06:00:00')
    expect(msUntilNextRun(5, now)).toBe(23 * 3600 * 1000)
  })
})

describe('scheduleDailyAt', () => {
  afterEach(() => vi.useRealTimers())
  it('ejecuta la tarea cuando llega la hora y stop() la cancela', async () => {
    vi.useFakeTimers({ now: new Date('2026-06-18T04:59:59') })
    const task = vi.fn().mockResolvedValue(undefined)
    const stop = scheduleDailyAt(5, task)
    await vi.advanceTimersByTimeAsync(1000)
    expect(task).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(24 * 3600 * 1000)
    expect(task).toHaveBeenCalledTimes(1)
  })
})
