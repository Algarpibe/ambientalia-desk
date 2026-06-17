import { useCallback, useRef, useState } from 'react'

/** Ancho redimensionable (arrastre) persistido en localStorage. Devuelve el ancho actual y el handler de arrastre. */
export function useResizable(key: string, initial: number, min: number, max: number) {
  const [w, setW] = useState<number>(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    const n = s ? Number(s) : NaN
    return !isNaN(n) ? Math.min(max, Math.max(min, n)) : initial
  })
  const wRef = useRef(w)
  wRef.current = w

  const start = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = wRef.current
    const onMove = (ev: MouseEvent) => setW(Math.min(max, Math.max(min, startW + ev.clientX - startX)))
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      try { localStorage.setItem(key, String(wRef.current)) } catch { /* ignore */ }
    }
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [key, min, max])

  return { w, start }
}
