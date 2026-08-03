/**
 * Perfiles de checklist "Incluye" de una remisión de ENTRADA.
 *
 * No hay uno por marca: `Grimm EDM180` y `Grimm EDM 280` comparten marca pero tienen listas distintas,
 * y Horiba se parte por modelo. Replican los perfiles del flujo n8n `Remisiones_ST_3.13_Desk`.
 * `kunak` existe a propósito aunque hoy no tenga ítems: su formulario nunca tuvo checklist.
 */
export const PERFILES_CHECKLIST = ['grimm_edm280', 'grimm_edm180', 'horiba_ap', 'environics', 'kunak', 'otro'] as const

export type PerfilChecklist = (typeof PERFILES_CHECKLIST)[number]

const norm = (v: string | null | undefined): string => (v ?? '').trim().toLowerCase()

/**
 * Perfil de checklist para un equipo, a partir de su marca y modelo.
 *
 * Replica las reglas del nodo `Switch Entrada - Marca` **en su mismo orden**, que evalúa el MODELO antes
 * que la marca: un equipo cuyo modelo contenga `EDM180` cae en ese perfil sea cual sea su marca. Hoy es
 * inocuo (esos modelos solo existen en Grimm) y se conserva para no divergir del flujo.
 *
 * Dos diferencias deliberadas respecto al original:
 * - **Comparación sin distinguir mayúsculas ni espacios sobrantes.** El Switch usa igualdad exacta, así que
 *   un `GRIMM` de la carga inicial no habría casado.
 * - **Fallback explícito a `otro`.** El Switch no define `options.fallbackOutput`, de modo que una marca
 *   desconocida se descartaba en silencio. `otro` es además el perfil con el checklist más completo.
 */
export function perfilChecklist(marca: string | null | undefined, modelo: string | null | undefined): PerfilChecklist {
  const ma = norm(marca)
  const mo = norm(modelo)

  if (mo === 'edm 280') return 'grimm_edm280'
  if (mo.includes('edm180')) return 'grimm_edm180'
  if (ma === 'horiba') return mo.startsWith('ap') ? 'horiba_ap' : 'otro'
  if (ma === 'environics') return 'environics'
  if (ma === 'kunak') return 'kunak'
  return 'otro'
}
