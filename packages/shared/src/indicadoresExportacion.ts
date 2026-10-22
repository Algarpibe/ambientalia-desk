// La comparación de los indicadores con la exportación de Zoho (F1F-05, RQ-KP-26): la FORMA de la respuesta de
// `POST /api/indicadores/comparacion`. Sólo tipos: el servidor la arma y el cliente la pinta, sin segunda definición.
import type { DiaCivil } from './calendarioLaboral'
import type { ResumenComparacion } from './indicadoresComparacion'

/** Un ticket nombrado por «ID» y número de solicitud (`null` si el fichero trae un número ilegible). Ningún otro dato. */
export interface TicketRef { id: string; numero: number | null }
/** Una fila del fichero que no se lee: su ordinal, la columna y un motivo que NUNCA cita la celda (RQ-KP-27). */
export interface FilaRechazadaExportacion { fila: number; columna: string; motivo: string }
/** Una celda de indicador que `valorDeZoho` no acepta: dónde está, nunca qué dice. */
export interface ValorIlegible { fila: number; columna: string }
/** El «ID» cruza y el número de solicitud del fichero no es el de Desk (RQ-KP-24). */
export interface NumeroDistinto { id: string; numeroFichero: number | null; numeroDesk: number }

export interface ComparacionExportacion {
  periodo: { desde: DiaCivil | null; hasta: DiaCivil | null }; flujo?: import('./flujos').Flujo
  fichero: { leidas: number; rechazadas: FilaRechazadaExportacion[] }
  cruce: {
    cruzados: number
    soloEnFichero: { total: number; tickets: TicketRef[] }
    fueraDelPeriodo: { total: number; tickets: TicketRef[] }; deOtroFlujo?: { total: number; tickets: TicketRef[] }
    soloEnDesk: { total: number; tickets: TicketRef[] }
    numeroDistinto: { total: number; tickets: NumeroDistinto[] }
    valoresIlegibles: { total: number; porColumna: Record<string, number>; valores: ValorIlegible[] }
  }
  /** La misma forma que la del `GET`, sin veredicto (RQ-KP-16). */
  comparacion: ResumenComparacion
}
