// Fixture SINTÉTICO de la exportación de Zoho Desk (F1F-05, D6). Las cabeceras son las 59 de `docs/analisis-tickets/Tickets.csv`
// (línea 1); NINGUNA fila ni dato de contacto se copia de ese fichero. Las celdas de contacto llevan un centinela para que
// las pruebas de privacidad (RQ-KP-27) vean si algo escapa.

/** Las 59 cabeceras de la muestra, en su orden. Un guardián de `leerExportacion.test.ts` las enfrenta a la línea 1 del fichero. */
export const CABECERA_MUESTRA: readonly string[] = [
  'ID', 'Nombre del Contact', 'Correo electrónico', 'Contact Name', 'Asunto', 'Estado', 'Hora de modificación', 'ID de la solicitud',
  'Prioridad', 'Tiempo de respuesta del cliente', 'Clasificaciones', 'Hora de actualización del estado', 'Hora de reapertura de la solicitud',
  'Hora de asignación', 'Modificado por', 'Número de comentarios', 'Tiempo de resolución en horario laboral', 'Ticket Age in Days',
  'Status Group', 'Completion Age Tier', 'Ticket handling Mode', 'Descripción', 'Nombre de Empresa', 'Tiempo en espera de Ticket',
  'Modelo de equipo', 'Serial', 'Tipo de Servicio', 'Ciudad', 'Encargado', 'Equipo', 'Marca', 'Código Servicio', 'Código Interno', 'NIT.',
  'Correo Encargado', 'Hora de creación', 'Fecha de vencimiento', 'Fecha creación ticket', 'Fecha Remisión Entrada', 'Fecha Revisión Informe',
  'Fecha de Cotización', 'Fecha Orden de Compra', 'Fecha Orden De Venta', 'Fecha Recepción de repuestos', 'Fecha Finalización ST',
  'Fecha De Factura', 'Tiempo permanecía', 'Tiempo inicio servicio // llegada equipo', 'Tiempo de diagnóstico', 'Tiempo de servicio',
  'Tiempo recogida del equipo', 'Días de entrega', 'Tiempo total servicio', 'Cumplimiento del tiempo  promesa', 'Calificación de satisfacción',
  'Tiempo bodegaje de Ingreso', 'Tiempo de cotización', 'Tiempo de orden de compra', 'Tiempo de orden de Venta',
]

export const CENTINELA_NOMBRE = 'Centinela Prueba'
export const CENTINELA_CORREO = 'centinela@ejemplo.invalid'
/** Relleno de las columnas que el lector no lee: si aparece en una salida, el lector dejó escapar una columna. */
export const RELLENO_MUESTRA = 'dato de prueba'

const POR_OMISION: Record<string, string> = {
  ID: '100000000000000001', 'ID de la solicitud': '1001',
  'Nombre del Contact': CENTINELA_NOMBRE, 'Contact Name': CENTINELA_NOMBRE,
  'Correo electrónico': CENTINELA_CORREO, 'Correo Encargado': CENTINELA_CORREO,
  Descripción: 'Primera línea, con coma y "comillas"\nsegunda línea',
  'Tiempo permanecía': '1', 'Tiempo de diagnóstico': '2', 'Tiempo de servicio': '3', 'Tiempo total servicio': '3',
  'Tiempo recogida del equipo': '1', 'Cumplimiento del tiempo  promesa': 'Cumple', 'Calificación de satisfacción': 'Excelente',
  'Tiempo de cotización': '1', 'Tiempo de orden de compra': '1', 'Tiempo de orden de Venta': '2',
}

/** Una fila de 59 campos inventados, por cabecera; `sobre` fija las celdas que interesan a cada prueba. */
export function filaMuestra(sobre: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(CABECERA_MUESTRA.map((c) => [c, sobre[c] ?? POR_OMISION[c] ?? RELLENO_MUESTRA]))
}

const celda = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** El fichero como lo escribe Zoho: BOM UTF-8, coma, comillas y CRLF. `quitar` y `renombrar` ensucian la cabecera (mutación sobre lo vigilado). */
export function csvMuestra(
  filas: ReadonlyArray<Record<string, string>>,
  { quitar = [], renombrar = {} }: { quitar?: readonly string[]; renombrar?: Record<string, string> } = {},
): Buffer {
  const columnas = CABECERA_MUESTRA.filter((c) => !quitar.includes(c))
  const lineas = [columnas.map((c) => celda(renombrar[c] ?? c)), ...filas.map((f) => columnas.map((c) => celda(f[c] ?? '')))]
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${lineas.map((l) => l.join(',')).join('\r\n')}\r\n`, 'utf8')])
}
