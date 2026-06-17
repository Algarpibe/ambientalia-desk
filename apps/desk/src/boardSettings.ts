import { useEffect, useState } from 'react'

// Preferencias de visualización del tablero (por navegador, vía localStorage).
const KEY_HIDE_EMPTY = 'board.hideEmptyColumns'
const EVENT = 'board-settings'

/** Por defecto se OCULTAN las columnas vacías (el usuario puede activarlas en Configuración). */
export function getHideEmptyColumns(): boolean {
  try {
    return localStorage.getItem(KEY_HIDE_EMPTY) !== 'false'
  } catch {
    return true
  }
}

export function setHideEmptyColumns(value: boolean): void {
  try {
    localStorage.setItem(KEY_HIDE_EMPTY, String(value))
  } catch {
    /* ignora si localStorage no está disponible */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Hook reactivo: se actualiza cuando cambia la preferencia (misma pestaña u otra). */
export function useHideEmptyColumns(): boolean {
  const [value, setValue] = useState(getHideEmptyColumns)
  useEffect(() => {
    const refresh = () => setValue(getHideEmptyColumns())
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return value
}
