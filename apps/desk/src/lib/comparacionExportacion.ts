// Cliente de la comparación con la exportación de Zoho (F1F-05, RQ-KP-28). Lo único decidible del cliente vive aquí, en `.ts`,
// porque los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00). Regla invariable 13: el cliente NO lee el
// fichero, NO cruza, NO calcula porcentajes ni valida el periodo; sólo arma la petición y repite lo que el servidor devolvió.
import { MENSAJE_SIN_PARES, NOMBRES_ZOHO, NOMBRE_FLUJO, type Conteo, type ComparacionExportacion as RespuestaComparacion } from '@ambientalia/shared'

/** Ruta relativa de `POST /api/indicadores/comparacion`: mismo origen, la cookie de sesión viaja sola. */
const RUTA = '/api/indicadores/comparacion'

/** Valor del atributo `accept` del selector. Comodidad: la cabecera incompleta o un binario los rechaza el servidor con `400`. */
export const ACEPTA_EXPORTACION = '.csv'

/** `desde` y `hasta` tal como se escribieron, sin validarlos (los valida `validarPeriodo` en el servidor); sólo se omiten los vacíos. */
export function urlComparacion(periodo: { desde?: string; hasta?: string }, flujo?: string): string {
  const q = new URLSearchParams()
  if (periodo.desde) q.set('desde', periodo.desde)
  if (periodo.hasta) q.set('hasta', periodo.hasta); if (flujo) q.set('flujo', flujo)
  const texto = q.toString()
  return texto ? `${RUTA}?${texto}` : RUTA
}

/** ¿Se habilita «Comparar»? Comodidad: sin fichero el servidor responde `400`; el doble envío no escribe nada. */
export function puedeComparar(hayFichero: boolean, enviando: boolean): boolean {
  return hayFichero && !enviando
}

/** El `error` del servidor tal cual; sin él, `HTTP nnn`. No sustituye ni resume ningún mensaje. */
export function mensajeDeError(estado: number, cuerpo: unknown): string {
  const e = (cuerpo as { error?: unknown } | null | undefined)?.error
  return typeof e === 'string' && e !== '' ? e : `HTTP ${estado}`
}

export interface FilaCifra { etiqueta: string; valor: string }
export interface FilaColumnaVista { nombre: string; comparados: string; coincidentes: string; diferentes: string; sinComparar: string; porcentaje: string }
export interface ListaVista { titulo: string; total: string; lineas: string[] }
export interface VistaComparacion {
  periodo: string
  recuentos: FilaCifra[]
  mensaje: string | null
  /** Dos tablas en orden: la variante de Zoho primero (cuenta para el 95 %) y la letra después (informativa). */
  tablas: TablaVista[]
  listas: ListaVista[]
  nota: string
}

const SIN_DATO = '—'
const n = (x: number): string => String(x)
/** El porcentaje es del servidor; aquí sólo se escribe con coma decimal. `null` es `vacio` («—» por omisión), nunca 0. */
const pct = (p: number | null, vacio = SIN_DATO): string => (p === null ? vacio : `${String(p).replace('.', ',')} %`)

/** Repite la respuesta del servidor en filas listas para pintar: no suma, no divide, no compara y no lleva color, meta ni veredicto. */
export function vistaComparacion(r: RespuestaComparacion): VistaComparacion {
  const c = r.cruce
  const solicitud = (x: number | null): string => (x === null ? 'solicitud ilegible' : `solicitud ${x}`)
  const refs = (ts: { id: string; numero: number | null }[]): string[] => ts.map((t) => `${t.id} · ${solicitud(t.numero)}`)
  return {
    periodo: (r.periodo.desde === null && r.periodo.hasta === null ? 'Sin periodo' : `Periodo: ${r.periodo.desde ?? '…'} a ${r.periodo.hasta ?? '…'}`) + (r.flujo ? ` · Flujo: ${NOMBRE_FLUJO[r.flujo]}` : ''),
    recuentos: [
      { etiqueta: 'Filas leídas', valor: n(r.fichero.leidas) },
      { etiqueta: 'Filas rechazadas', valor: n(r.fichero.rechazadas.length) },
      { etiqueta: 'Tickets cruzados', valor: n(c.cruzados) },
      { etiqueta: 'Sólo en el fichero', valor: n(c.soloEnFichero.total) },
      { etiqueta: 'Fuera del periodo', valor: n(c.fueraDelPeriodo.total) }, ...(c.deOtroFlujo ? [{ etiqueta: 'De otro flujo', valor: n(c.deOtroFlujo.total) }] : []),
      { etiqueta: 'Sólo en Desk', valor: n(c.soloEnDesk.total) },
      { etiqueta: 'Número de solicitud distinto', valor: n(c.numeroDistinto.total) },
      { etiqueta: 'Valores ilegibles', valor: n(c.valoresIlegibles.total) },
    ],
    mensaje: r.comparacion.mensaje,
    // La variante (la que se juzga) va antes que la letra (informativa); cada tabla lee SU clave del servidor.
    tablas: [
      tablaVista(ROTULO_VARIANTE, r.comparacion.porColumna, (k) => k.variante, r.comparacion.ticketsVariante, MENSAJE_SIN_PARES),
      tablaVista(ROTULO_LETRA, r.comparacion.porColumna, (k) => k, r.comparacion.tickets, SIN_DATO),
    ],
    listas: [
      { titulo: 'Filas rechazadas', total: n(r.fichero.rechazadas.length), lineas: r.fichero.rechazadas.map((f) => `Fila ${f.fila} · ${f.columna} · ${f.motivo}`) },
      { titulo: 'Sólo en el fichero', total: n(c.soloEnFichero.total), lineas: refs(c.soloEnFichero.tickets) },
      { titulo: 'Fuera del periodo', total: n(c.fueraDelPeriodo.total), lineas: refs(c.fueraDelPeriodo.tickets) }, ...(c.deOtroFlujo ? [{ titulo: 'De otro flujo', total: n(c.deOtroFlujo.total), lineas: refs(c.deOtroFlujo.tickets) }] : []),
      { titulo: 'Sólo en Desk', total: n(c.soloEnDesk.total), lineas: refs(c.soloEnDesk.tickets) },
      { titulo: 'Número de solicitud distinto', total: n(c.numeroDistinto.total), lineas: c.numeroDistinto.tickets.map((t) => `${t.id} · fichero ${t.numeroFichero ?? 'ilegible'}, Desk ${t.numeroDesk}`) },
      { titulo: 'Valores ilegibles', total: n(c.valoresIlegibles.total), lineas: c.valoresIlegibles.valores.map((v) => `Fila ${v.fila} · ${v.columna}`) },
    ],
    nota: r.comparacion.nota,
  }
}

export interface TablaVista { titulo: string; columnas: FilaColumnaVista[]; tickets: { comparados: string; coincidentes: string; porcentaje: string } }
/** Rótulos de las dos tablas (S-3): la regla del 95 % la dice la nota del servidor; aquí sólo se nombra cada lectura. */
export const ROTULO_VARIANTE = 'Variante de la fórmula de Zoho · cuenta para el 95 %'
export const ROTULO_LETRA = 'Letra de la aplicación · informativa'

/** Una tabla ya en texto: la cifra es del servidor (`conteo` elige la lectura); sin dato se escribe `vacio`, nunca 0. No suma ni divide. */
function tablaVista(titulo: string, porColumna: RespuestaComparacion['comparacion']['porColumna'], conteo: (k: RespuestaComparacion['comparacion']['porColumna'][number]) => Conteo, tickets: RespuestaComparacion['comparacion']['tickets'], vacio: string): TablaVista {
  return {
    titulo,
    columnas: porColumna.map((k) => {
      const c = conteo(k)
      return { nombre: NOMBRES_ZOHO[k.columna][0], comparados: n(c.comparados), coincidentes: n(c.coincidentes), diferentes: n(c.diferentes), sinComparar: n(c.sinComparar), porcentaje: pct(c.porcentaje, vacio) }
    }),
    tickets: { comparados: n(tickets.comparados), coincidentes: n(tickets.coincidentes), porcentaje: pct(tickets.porcentaje, vacio) },
  }
}
