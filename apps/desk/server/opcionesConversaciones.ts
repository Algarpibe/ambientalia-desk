import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { ConversacionesDeps } from '@ambientalia/zoho-sync/conversaciones'

/**
 * sync-conversaciones-zoho (1G-01, S-1b). La ÚNICA lectura de los dos interruptores de conversaciones, que `index.ts` pasa a
 * `createSync`. Vive aquí, y no en la línea de `index.ts`, para que una prueba la vea: nadie importa el fichero de entrada.
 * No fija `pausaMs` ni `pausa429Ms`: la App usa las esperas de por omisión (`PAUSA_ENTRE_TICKETS_MS`, `PAUSA_429_MS`).
 */
export function opcionesConversaciones(
  config: Pick<AppConfig, 'syncConversacionesPeriodica' | 'marcarConversacionesAusentes'>,
): NonNullable<ConversacionesDeps['conversaciones']> {
  return { periodica: config.syncConversacionesPeriodica, marcarAusentes: config.marcarConversacionesAusentes }
}
