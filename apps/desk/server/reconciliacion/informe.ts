/**
 * Render del barrido de reconciliación (capacidad `reconciliacion`, RQ-RC-01 y RQ-RC-02).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * `npm run reconcile` bajo `tsx`. NADA de producción lo importa — `guardianes.test.ts` recorre el
 * grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * DETERMINISTA POR CONSTRUCCIÓN (RQ-RC-02): el texto sale de un único array de líneas unido al
 * final, el orden de las comprobaciones lo fija el núcleo y cada lista se ordena antes de entrar.
 * No hay aquí ninguna lectura de reloj, ninguna aleatoriedad y ningún recorrido de `Map`/`Set`.
 *
 * D7 · LA FECHA ES LA DEL COMMIT MEDIDO, NO LA DEL RELOJ. Con el reloj, dos pasadas sobre el mismo
 * árbol en días distintos difieren en una línea, y el `git diff` deja de ser «la lista de desvíos
 * nuevos» para ser «la lista más un ruido diario».
 */
import type { Comprobacion } from './comprobaciones'

const SALTO = String.fromCharCode(10)
const ANCHO = 46

export interface CabeceraInforme {
  sha: string
  fecha: string
  limpio: boolean
}

/** Etiqueta rellenada con puntos hasta una columna fija, como el informe del detector de citas. */
function cifra(texto: string): string {
  const [etiqueta, ...resto] = texto.split(': ')
  if (resto.length === 0) return '  ' + texto
  const puntos = '.'.repeat(Math.max(2, ANCHO - etiqueta!.length))
  return '  ' + etiqueta + ' ' + puntos + ' ' + resto.join(': ')
}

function seccion(c: Comprobacion): string[] {
  const lineas = ['## ' + String(c.id) + ' · ' + c.titulo, '']
  for (const texto of c.cifras) lineas.push(cifra(texto))
  if (c.hallazgos.length > 0) {
    lineas.push('')
    lineas.push(c.bloqueante ? 'Hallazgos (BLOQUEAN el comando):' : 'Hallazgos (informativos, no bloquean):')
    for (const h of c.hallazgos) lineas.push('  - `' + h.clave + '` — ' + h.detalle)
  }
  lineas.push('')
  return lineas
}

/**
 * El fichero entero. `RQ-RC-01`: empieza por la fecha y el commit medido, y ninguna cifra del cuerpo
 * queda sin decir contra qué se midió — por eso la cabecera declara también si el árbol estaba limpio
 * (D8: lo medido es el ÁRBOL DE TRABAJO, etiquetado con `HEAD`).
 */
export function informe(comprobaciones: readonly Comprobacion[], cabecera: CabeceraInforme): string {
  const bloquean = comprobaciones.filter((c) => c.bloqueante && c.hallazgos.length > 0)
  const lineas: string[] = [
    '# Reconciliación',
    '',
    '**Commit medido:** `' + cabecera.sha + '` · **Fecha del commit:** ' + cabecera.fecha,
    '**Árbol de trabajo:** ' + (cabecera.limpio ? 'limpio' : 'CON CAMBIOS SIN COMMITEAR'),
    '',
    'La fecha es la del commit medido, no la del reloj: dos pasadas sobre un árbol quieto producen',
    'este fichero IDÉNTICO, y su `git diff` es la lista de desvíos nuevos desde la pasada anterior.',
    '',
    '---',
    '',
  ]
  for (const c of comprobaciones) lineas.push(...seccion(c))
  lineas.push('---')
  lineas.push('')
  lineas.push(
    bloquean.length === 0
      ? 'Ninguna comprobación bloqueante trae hallazgos: el comando sale con código 0.'
      : 'Bloquean el comando: ' + bloquean.map((c) => String(c.id)).join(', ') + '.',
  )
  lineas.push('')
  lineas.push('Este barrido NO arregla ningún desvío: los hace visibles. Corregirlos es trabajo aparte,')
  lineas.push('y de quien decida el alcance.')
  lineas.push('')
  return lineas.join(SALTO)
}
