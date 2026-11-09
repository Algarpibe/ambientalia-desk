import type { AppConfig } from '@ambientalia/zoho-sync/config'

type Paso = () => Promise<unknown>

/** Las siete pasadas del temporizador (1G-04, D-4): las seis evaluaciones y la variante de la sexta con la sincronización reciente. */
export interface EvaluacionesDelCiclo {
  alarmas: Paso
  reclamaciones: Paso
  facturacionVencida: Paso
  salidasEsperas: Paso
  provisionalesEnBooks: Paso
  ritmoContratos: Paso
  ritmoYSincronizacion: Paso
}

export interface PasosDeDesk {
  syncActivities: Paso
  syncContacts: Paso
}

export type ConfigDelCiclo = Pick<AppConfig, 'modoSinZohoDesk' | 'syncActivities' | 'syncContacts'>

/**
 * Encadena las evaluaciones del temporizador (RQ-ZS-44.1). Las cinco primeras corren siempre y en este orden; la sexta es UNA de dos por ciclo:
 * con el modo sin Zoho Desk abierto, `ritmoContratos` sola; cerrado, `ritmoYSincronizacion` (el ritmo y, detrás, la sincronización reciente).
 * Cerrado, después van actividades y contactos según sus flags; abierto, nada de Desk. Devuelve la promesa encadenada.
 */
export function cadenaDelCiclo(ev: EvaluacionesDelCiclo, desk: PasosDeDesk, config: ConfigDelCiclo): Promise<unknown> {
  let p: Promise<unknown> = ev.alarmas()
    .then(() => ev.reclamaciones())
    .then(() => ev.facturacionVencida())
    .then(() => ev.salidasEsperas())
    .then(() => ev.provisionalesEnBooks())
    .then(() => (config.modoSinZohoDesk ? ev.ritmoContratos() : ev.ritmoYSincronizacion()))
  if (!config.modoSinZohoDesk) {
    if (config.syncActivities) p = p.then(() => desk.syncActivities())
    if (config.syncContacts) p = p.then(() => desk.syncContacts())
  }
  return p
}
