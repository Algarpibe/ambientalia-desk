import { useEffect, useState } from 'react'

export type ViewMode = 'estado' | 'prioridad' | 'cuenta-regresiva' | 'clasica' | 'compacta' | 'tabla'
const KEY = 'view.mode'
const EVENT = 'view-settings'
const VALID: ViewMode[] = ['estado', 'prioridad', 'cuenta-regresiva', 'clasica', 'compacta', 'tabla']

export function getViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(KEY) as ViewMode | null
    return v && VALID.includes(v) ? v : 'estado'
  } catch {
    return 'estado'
  }
}

export function setViewMode(m: ViewMode): void {
  try { localStorage.setItem(KEY, m) } catch { /* sin localStorage */ }
  window.dispatchEvent(new Event(EVENT))
}

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState(getViewMode)
  useEffect(() => {
    const refresh = () => setMode(getViewMode())
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return [mode, setViewMode]
}
