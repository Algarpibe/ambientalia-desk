import type { RemisionPasoFallido } from '@ambientalia/shared'

/**
 * `resultado` llega de n8n y se guarda tal cual, sin validar. Una remisión anterior al contrato
 * actual, o un flujo modificado, pueden traer cualquier cosa donde el tipo promete una lista, así
 * que se filtra aquí: un dato raro no puede tumbar la pantalla que le da el resultado al técnico.
 *
 * Vive en `lib/` y no dentro de `ResultadoRemision.tsx` porque `PanelRemisiones` necesita el mismo
 * criterio y un archivo de componente solo puede exportar componentes (fast refresh de Vite se queja
 * si no); moverla aquí evita reimplementarla dos veces.
 */
export function pasos(v: RemisionPasoFallido[] | undefined): RemisionPasoFallido[] {
  return Array.isArray(v) ? v.filter((p) => typeof p?.paso === 'string') : []
}

/**
 * `carpetaUrl` también llega de n8n sin validar y se pinta como `href`. El callback está detrás de
 * un secreto compartido, así que el riesgo es bajo, pero es la única entrada de estos paneles que
 * acaba en un atributo peligroso: si el secreto se filtrara algún día, un `javascript:` colado ahí se
 * ejecutaría al clic. Exigir `https://` cierra esa puerta sin coste — mejor sin enlace que con uno malo.
 */
export function urlSegura(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.startsWith('https://') ? v : null
}
