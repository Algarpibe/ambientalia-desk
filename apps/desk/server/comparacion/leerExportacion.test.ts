// F1F-05 (comparacion-exportacion-zoho), lote 1 · RQ-KP-23, -24 (lectura) y -27: el lector PURO de la exportación de Zoho.
// El fixture es sintético (`../testing/exportacionZoho`): ninguna fila real. Los textos de error se comparan contra las constantes.
import { describe, it, expect } from 'vitest'
import { closeSync, openSync, readFileSync, readSync } from 'node:fs'
import { NOMBRES_ZOHO, normalizarNombreZoho, valorDeZoho } from '@ambientalia/shared'
import { decodificarFichero, leerRegistros } from '../encuesta/analizarRespuestas'
import { CABECERA_MUESTRA, CENTINELA_CORREO, CENTINELA_NOMBRE, RELLENO_MUESTRA, csvMuestra, filaMuestra } from '../testing/exportacionZoho'
import { COLUMNAS_INDICADOR, COLUMNA_ID, COLUMNA_NUMERO, ERRORES_EXPORTACION, MOTIVOS_EXPORTACION, leerExportacion, type LecturaExportacion } from './leerExportacion'

type Opciones = Parameters<typeof csvMuestra>[1]
const fila = (id: string, sobre: Record<string, string> = {}) => filaMuestra({ ID: id, ...sobre })
const texto = (filas: Array<Record<string, string>>, o?: Opciones) => decodificarFichero(csvMuestra(filas, o))
const leer = (filas: Array<Record<string, string>>, o?: Opciones) => leerExportacion(texto(filas, o))
function leida(l: LecturaExportacion) {
  if (!l.ok) throw new Error(`se esperaba una lectura y falló: ${l.error}`)
  return l
}
const BOM = String.fromCharCode(0xfeff)
const DIEZ = COLUMNAS_INDICADOR.map((c) => c.nombre)
const SERVICIO = 'Tiempo de servicio', DIAGNOSTICO = 'Tiempo de diagnóstico', PROMESA = 'Cumplimiento del tiempo  promesa'

describe('cabecera y fichero (RQ-KP-23)', () => {
  it('fichero con las 59 columnas, BOM, CRLF, comas y saltos entre comillas: filas con clave, número y diez celdas', () => {
    const l = leida(leer([fila('111', { 'ID de la solicitud': '501', [SERVICIO]: '4' }), fila('222', { 'ID de la solicitud': '502' })]))
    expect(l.rechazadas).toEqual([])
    expect(l.ilegibles).toEqual([])
    expect(l.filas.map((f) => [f.fila, f.id, f.numero])).toEqual([[2, '111', 501], [3, '222', 502]])
    expect(l.filas[0].campos[SERVICIO]).toBe('4')
    expect(l.filas[1].campos[SERVICIO]).toBe('3')
  })

  it('celdas con comas y saltos de línea: las filas leídas son registros, no líneas físicas', () => {
    const filas = [fila('1'), fila('2'), fila('3')]
    expect(texto(filas).split(/\r\n|\n/).length).toBeGreaterThan(5)
    expect(leida(leerExportacion(texto(filas))).leidas).toBe(3)
  })

  it('falta una columna: falla nombrándola, sin resultado parcial', () => {
    expect(leer([fila('1')], { quitar: [SERVICIO] })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([SERVICIO]) })
    expect(leer([fila('1')], { quitar: [PROMESA] })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([PROMESA]) })
  })

  it('faltan dos: las nombra a las dos, en el orden de «ID», «ID de la solicitud» y las diez', () => {
    expect(leer([fila('1')], { quitar: [SERVICIO, COLUMNA_NUMERO] })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([COLUMNA_NUMERO, SERVICIO]) })
    expect(leer([fila('1')], { quitar: [DIAGNOSTICO, COLUMNA_ID, 'Tiempo permanecía'] })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([COLUMNA_ID, 'Tiempo permanecía', DIAGNOSTICO]) })
  })

  it('columna renombrada: falla nombrando la que falta; no adivina por parecido', () => {
    expect(leer([fila('1')], { renombrar: { [SERVICIO]: 'Tiempo del servicio' } })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([SERVICIO]) })
    expect(leer([fila('1')], { renombrar: { [COLUMNA_NUMERO]: 'ID solicitud' } })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([COLUMNA_NUMERO]) })
  })

  it('dos espacios en la cabecera de la promesa: se reconoce y «Cumple» / «No Cumple» llegan tal cual a valorDeZoho', () => {
    const l = leida(leer([fila('1', { [PROMESA]: 'Cumple' }), fila('2', { [PROMESA]: 'No Cumple' })]))
    expect(l.filas.map((f) => valorDeZoho('54', [f.campos]))).toEqual([{ valor: 'Cumple', campo: PROMESA }, { valor: 'No Cumple', campo: PROMESA }])
  })

  it('la cabecera casa por nombre normalizado: un espacio, mayúsculas y sin tildes; las claves de `campos` son las canónicas', () => {
    const l = leida(leer([fila('1')], { renombrar: { [PROMESA]: 'CUMPLIMIENTO DEL TIEMPO PROMESA', 'Calificación de satisfacción': 'calificacion de satisfaccion' } }))
    expect(Object.keys(l.filas[0].campos)).toEqual(DIEZ)
    expect(l.filas[0].campos[PROMESA]).toBe('Cumple')
  })

  it('valor no numérico en una columna de tiempo: las filas se conservan y cada una cuenta un ilegible con fila y columna, sin la celda', () => {
    const l = leida(leer([fila('1', { [DIAGNOSTICO]: 'abc' }), fila('2', { [DIAGNOSTICO]: '2.5' }), fila('3', { [DIAGNOSTICO]: ' 4 ' })]))
    expect(l.filas).toHaveLength(3)
    expect(l.rechazadas).toEqual([])
    expect(l.ilegibles).toEqual([{ fila: 2, columna: DIAGNOSTICO }, { fila: 3, columna: DIAGNOSTICO }])
    expect(JSON.stringify(l.ilegibles)).not.toMatch(/abc|2\.5/)
  })

  it('una celda vacía, un entero con signo o un texto en una columna textual NO son ilegibles', () => {
    const l = leida(leer([fila('1', { [DIAGNOSTICO]: '' }), fila('2', { [DIAGNOSTICO]: '-3' }), fila('3', { [PROMESA]: 'lo que sea' })]))
    expect(l.filas).toHaveLength(3)
    expect(l.ilegibles).toEqual([])
  })

  it('fichero vacío o de sólo blancos: error `vacio`', () => {
    expect(leerExportacion('')).toEqual({ ok: false, error: ERRORES_EXPORTACION.vacio })
    expect(leerExportacion(`${BOM} \r\n  \n`)).toEqual({ ok: false, error: ERRORES_EXPORTACION.vacio })
    expect(leerExportacion('""\r\n,,\r\n')).toEqual({ ok: false, error: ERRORES_EXPORTACION.vacio })
  })

  it('fichero con un NUL (un xlsx subido como csv): error `binario`, aunque la cabecera también falte', () => {
    expect(leerExportacion('PK\u0003\u0004\u0000\u0000xl/workbook.xml')).toEqual({ ok: false, error: ERRORES_EXPORTACION.binario })
    expect(leerExportacion(`${BOM}ID,otra\u0000\r\n1,2`)).toEqual({ ok: false, error: ERRORES_EXPORTACION.binario })
  })

  it('una columna exigida repetida: error `repetida`; una no exigida repetida no estorba', () => {
    const duplicada = (t: string, nombre: string) => t.replace('\r\n', `,${nombre}\r\n`)
    expect(leerExportacion(duplicada(texto([fila('1')]), SERVICIO))).toEqual({ ok: false, error: ERRORES_EXPORTACION.repetida(SERVICIO) })
    expect(leerExportacion(duplicada(texto([fila('1')]), COLUMNA_ID))).toEqual({ ok: false, error: ERRORES_EXPORTACION.repetida(COLUMNA_ID) })
    expect(leida(leerExportacion(duplicada(texto([fila('1')]), 'Asunto'))).filas).toHaveLength(1)
  })

  it('sin registros de datos: error `sinFilas`, también con líneas en blanco', () => {
    expect(leer([])).toEqual({ ok: false, error: ERRORES_EXPORTACION.sinFilas })
    expect(leerExportacion(`${texto([])}\r\n\r\n`)).toEqual({ ok: false, error: ERRORES_EXPORTACION.sinFilas })
  })

  it('orden de los errores de fichero: binario < faltan < repetida < sinFilas', () => {
    expect(leer([], { quitar: [SERVICIO] })).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan([SERVICIO]) })
    const faltaYRepetida = texto([fila('1')], { quitar: ['Tiempo total servicio'] }).replace('\r\n', `,${SERVICIO}\r\n`)
    expect(leerExportacion(faltaYRepetida)).toEqual({ ok: false, error: ERRORES_EXPORTACION.faltan(['Tiempo total servicio']) })
    expect(leerExportacion(`${faltaYRepetida}\u0000`)).toEqual({ ok: false, error: ERRORES_EXPORTACION.binario })
    expect(leerExportacion(texto([]).replace('\r\n', `,${SERVICIO}\r\n`))).toEqual({ ok: false, error: ERRORES_EXPORTACION.repetida(SERVICIO) })
  })
})

describe('filas (RQ-KP-24 lectura, RQ-KP-27)', () => {
  it('«ID» vacío: fila rechazada con su número de fila y la columna «ID»; las demás se leen', () => {
    const l = leida(leer([fila('10'), fila(''), fila('30')]))
    expect(l.rechazadas).toEqual([{ fila: 3, columna: COLUMNA_ID, motivo: MOTIVOS_EXPORTACION.idVacio }])
    expect(l.filas.map((f) => f.id)).toEqual(['10', '30'])
    expect(l.leidas).toBe(3)
  })

  it('«ID» en notación científica o con otros caracteres: rechazada, sin cruzar aproximando', () => {
    const l = leida(leer([fila('1.23457E+17'), fila('#123'), fila('12 3'), fila('777')]))
    expect(l.rechazadas.map((r) => [r.fila, r.columna, r.motivo])).toEqual([2, 3, 4].map((n) => [n, COLUMNA_ID, MOTIVOS_EXPORTACION.idNoDigitos]))
    expect(l.filas.map((f) => f.id)).toEqual(['777'])
  })

  it('«ID» repetido: vale la primera (también con espacios) y la siguiente se rechaza con motivo', () => {
    const l = leida(leer([fila('555', { [SERVICIO]: '1' }), fila('666'), fila(' 555 ', { [SERVICIO]: '9' })]))
    expect(l.filas.map((f) => [f.fila, f.id, f.campos[SERVICIO]])).toEqual([[2, '555', '1'], [3, '666', '3']])
    expect(l.rechazadas).toEqual([{ fila: 4, columna: COLUMNA_ID, motivo: MOTIVOS_EXPORTACION.idRepetido }])
    expect(l.leidas).toBe(3)
  })

  it('el número de fila es el ordinal del registro (la cabecera es la 1), no la línea física ni los blancos', () => {
    const l = leida(leer([fila('1'), fila('')]))
    expect(l.rechazadas[0].fila).toBe(3)
    const conBlanco = leida(leerExportacion(texto([fila('1'), fila('')]).replace('\r\n', '\r\n\r\n')))
    expect(conBlanco.leidas).toBe(2)
    expect(conBlanco.rechazadas[0].fila).toBe(4)
  })

  it('«ID de la solicitud» no numérico, vacío o decimal: `numero` nulo y la fila NO se rechaza; recortado vale', () => {
    const l = leida(leer([fila('1', { [COLUMNA_NUMERO]: 'abc' }), fila('2', { [COLUMNA_NUMERO]: '' }), fila('3', { [COLUMNA_NUMERO]: '1.5' }), fila('4', { [COLUMNA_NUMERO]: ' 77 ' })]))
    expect(l.rechazadas).toEqual([])
    expect(l.filas.map((f) => f.numero)).toEqual([null, null, null, 77])
  })

  it('`campos` trae exactamente las diez claves, con la celda cruda y en el orden de COLUMNAS_INDICADOR', () => {
    const f = leida(leer([fila('1')])).filas[0]
    expect(Object.keys(f.campos)).toEqual(DIEZ)
    expect(Object.keys(f.campos).indexOf(SERVICIO)).toBeLessThan(Object.keys(f.campos).indexOf('Tiempo total servicio'))
    expect(f.campos['Tiempo de orden de Venta']).toBe('2')
  })

  it('una fila rechazada o un ilegible no citan ninguna celda: ni el «xyz», ni la clave, ni el contacto', () => {
    const l = leida(leer([fila('', { [DIAGNOSTICO]: 'xyz' }), fila('1.23457E+17'), fila('7', { [SERVICIO]: 'xyz' })]))
    expect(l.rechazadas).toHaveLength(2)
    expect(l.ilegibles).toEqual([{ fila: 4, columna: SERVICIO }])
    const dicho = JSON.stringify([l.rechazadas, l.ilegibles])
    for (const celda of ['xyz', '1.23457E+17', CENTINELA_NOMBRE, CENTINELA_CORREO, RELLENO_MUESTRA]) expect(dicho, celda).not.toContain(celda)
  })

  it('las 47 columnas restantes no salen: ni nombre, ni correo, ni relleno en filas, motivos ni errores', () => {
    const lectura = leer([fila('1'), fila('')])
    const dicho = JSON.stringify(lectura)
    for (const celda of [CENTINELA_NOMBRE, CENTINELA_CORREO, RELLENO_MUESTRA, 'Primera línea']) expect(dicho, celda).not.toContain(celda)
    const error = JSON.stringify(leer([fila('1')], { quitar: [SERVICIO] }))
    for (const celda of [CENTINELA_NOMBRE, CENTINELA_CORREO, RELLENO_MUESTRA]) expect(error, celda).not.toContain(celda)
  })
})

describe('guardianes de las listas y contrato del lector de registros', () => {
  it('las diez cabeceras de COLUMNAS_INDICADOR las acepta valorDeZoho y cubren las nueve columnas de NOMBRES_ZOHO', () => {
    expect(COLUMNAS_INDICADOR).toHaveLength(10)
    for (const { nombre, columna } of COLUMNAS_INDICADOR) expect(valorDeZoho(columna, [{ [nombre]: '1' }]), nombre).not.toBeNull()
    expect([...new Set(COLUMNAS_INDICADOR.map((c) => c.columna))].sort()).toEqual(Object.keys(NOMBRES_ZOHO).sort())
    for (const nombre of [COLUMNA_ID, COLUMNA_NUMERO, ...DIEZ]) expect(CABECERA_MUESTRA, nombre).toContain(nombre)
  })

  it('normalizarNombreZoho es la normalización de valorDeZoho: tildes, mayúsculas y espacios', () => {
    expect(normalizarNombreZoho('Cumplimiento del tiempo  promesa')).toBe('cumplimiento del tiempo promesa')
    expect(normalizarNombreZoho(' Tiempo de DIAGNÓSTICO ')).toBe('tiempo de diagnostico')
  })

  it('la primera línea de docs/analisis-tickets/Tickets.csv es CABECERA_MUESTRA (hipótesis 1 del diseño; sólo se lee la línea 1)', () => {
    const fd = openSync(new URL('../../../../docs/analisis-tickets/Tickets.csv', import.meta.url), 'r')
    const bytes = Buffer.alloc(4096)
    const leidos = readSync(fd, bytes, 0, bytes.length, 0)
    closeSync(fd)
    const linea1 = bytes.subarray(0, leidos).toString('utf8')
    const primera = (linea1.startsWith(BOM) ? linea1.slice(1) : linea1).split(/\r?\n/)[0]
    expect(CABECERA_MUESTRA).toHaveLength(59)
    expect(primera).toBe(CABECERA_MUESTRA.join(','))
  })

  it('contrato de leerRegistros: coma entre comillas, comilla doblada, salto interno y CRLF', () => {
    const esperado = [['a', 'b,c', 'd"e', 'f\ng'], ['h', 'i', 'j', 'k']]
    expect(leerRegistros('a,"b,c","d""e","f\ng"\r\nh,i,j,k\r\n', ',')).toEqual(esperado)
    expect(leerRegistros('a,"b,c","d""e","f\ng"\nh,i,j,k', ',')).toEqual(esperado)
  })
})

describe('pureza del lector (RQ-KP-23)', () => {
  const fuente = readFileSync(new URL('./leerExportacion.ts', import.meta.url), 'utf8')
  const importaciones = [...fuente.matchAll(/\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)]
  const nombres = (de: string) => importaciones.filter((i) => i[2] === de).flatMap((i) => i[1].split(',').map((x) => x.trim().replace(/^type\s+/, '')).filter(Boolean))

  it('importa SÓLO el lector de registros de la encuesta y, de @ambientalia/shared, la lectura de valorDeZoho y tipos', () => {
    expect([...new Set(importaciones.map((i) => i[2]))].sort()).toEqual(['../encuesta/analizarRespuestas', '@ambientalia/shared'])
    expect(nombres('../encuesta/analizarRespuestas')).toEqual(['leerRegistros'])
    const permitidos = ['valorDeZoho', 'normalizarNombreZoho', 'ColumnaIndicador', 'FilaRechazadaExportacion', 'ValorIlegible']
    expect(nombres('@ambientalia/shared').every((n) => permitidos.includes(n))).toBe(true)
    expect(nombres('@ambientalia/shared')).toContain('valorDeZoho')
  })

  it('no hay otra forma de importar ni de salir al disco, la red, el entorno o la consola', () => {
    const otras = fuente.split(/\bfrom\s*['"]|\bimport\s*\(|\brequire\s*\(|\bimport\s*['"]/).length - 1 - importaciones.length
    expect(otras).toBe(0)
    for (const prohibida of [/node:/, /\bfetch\s*\(/, /process\.env/, /\bconsole\b/]) expect(prohibida.test(fuente), String(prohibida)).toBe(false)
  })
})

describe('remediación del verify (W1 · R15, S1 · R21)', () => {
  it('W1 · BOM delante de una primera cabecera «ID» entrecomillada: se quita y la fila se lee', () => {
    const t = texto([fila('777')])
    const sinBom = t.startsWith(BOM) ? t.slice(1) : t
    const contenido = `${BOM}"${COLUMNA_ID}"${sinBom.slice(sinBom.indexOf(','))}`
    expect(contenido.startsWith(`${BOM}"ID",`)).toBe(true)
    const l = leida(leerExportacion(contenido))
    expect(l.rechazadas).toEqual([])
    expect(l.filas.map((x) => x.id)).toEqual(['777'])
  })

  it('S1 · una celda de indicador con sólo espacios no es «valor ilegible» y la fila se conserva', () => {
    const l = leida(leer([fila('1', { [SERVICIO]: '   ' })]))
    expect(l.ilegibles).toEqual([])
    expect(l.filas.map((x) => x.id)).toEqual(['1'])
  })
})
