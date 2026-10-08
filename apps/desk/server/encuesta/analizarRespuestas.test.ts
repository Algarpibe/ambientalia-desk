// indicadores-51-55 (F1F-05), lote 2b · RQ-KP-20: el analizador del fichero de respuestas. Todo el formato es SUPUESTO (S-D, S-E):
// estas pruebas fijan lo que el diseño (D3) declara, no una muestra real (P-1).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { diaEnZona } from '@ambientalia/shared'
import { analizarRespuestasEncuesta, decodificarFichero, ERRORES_CABECERA, MOTIVOS_FILA, type AnalisisEncuesta } from './analizarRespuestas'
import { huellaRespuesta } from './respuesta'

const BOM = '\uFEFF'
const CAB = 'Marca temporal,Número de ticket,Calificación de satisfacción'
const fichero = (...lineas: string[]) => lineas.join('\n')

function leido(a: AnalisisEncuesta) {
  if (!a.ok) throw new Error(`se esperaba un análisis correcto y salió: ${a.error}`)
  return a
}
function error(a: AnalisisEncuesta): string {
  if (a.ok) throw new Error('se esperaba un error de cabecera')
  return a.error
}

describe('formato del texto (RQ-KP-20)', () => {
  const datos = ['2027-01-12 08:00:00,12345,Excelente', '2027-01-13 09:30:00,12346,Regular']

  it('separador `;` con BOM y separador `,` dan las mismas filas, y el BOM no forma parte del nombre de la primera columna', () => {
    const coma = leido(analizarRespuestasEncuesta(fichero(CAB, ...datos)))
    const puntoYComa = leido(analizarRespuestasEncuesta(BOM + fichero(CAB, ...datos).replace(/,/g, ';')))
    expect(coma.filas).toHaveLength(2)
    expect(puntoYComa.filas).toEqual(coma.filas)
  })

  it('el BOM se descarta antes de leer: una primera cabecera entre comillas con el separador dentro sigue siendo una sola columna', () => {
    const a = leido(analizarRespuestasEncuesta(BOM + fichero('"Marca; temporal";Ticket;Calificación', '2027-01-12 08:00:00;7;Bien')))
    expect(a.filas.map((f) => f.numeroTicket)).toEqual([7])
  })

  it('reconoce las columnas por nombre y no por posición, con otras mayúsculas y sin tildes', () => {
    const a = leido(analizarRespuestasEncuesta(fichero('CALIFICACIÓN;TICKET;Fecha de respuesta', 'Excelente;12345;2027-01-12 08:00:00')))
    expect(a.filas[0]).toMatchObject({ numeroTicket: 12345, calificacion: 'Excelente', respondidaAt: '2027-01-12T13:00:00.000Z' })
  })

  it('empate de separadores fuera de comillas: gana la coma', () => {
    const a = leido(analizarRespuestasEncuesta(fichero('ticket,fecha,calificacion;;', '12,2027-01-12 08:00,Bien')))
    expect(a.filas).toHaveLength(1)
    expect(a.filas[0].numeroTicket).toBe(12)
  })

  it('los separadores dentro de comillas no se cuentan para elegir el separador', () => {
    const a = leido(analizarRespuestasEncuesta(fichero('"Fecha y hora, , , ,";Ticket;Calificación', '2027-01-12 08:00;12;Bien')))
    expect(a.filas).toHaveLength(1)
  })

  it('comillas: separador dentro, comilla doblada y salto de línea dentro del campo', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,12,"Muy ""buena"", sí', 'muy"')))
    expect(a.filas[0].calificacion).toBe('Muy "buena", sí muy')
    expect(a.leidas).toBe(1)
  })

  it('el fin de registro puede ser \\r\\n, \\n o \\r', () => {
    for (const fin of ['\r\n', '\n', '\r']) {
      const a = leido(analizarRespuestasEncuesta([CAB, ...datos].join(fin) + fin))
      expect(a.filas.map((f) => f.numeroTicket)).toEqual([12345, 12346])
    }
  })

  it('una comilla sin cerrar al final no tira el fichero', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,12,"Bien')))
    expect(a.filas[0].calificacion).toBe('Bien')
  })
})

describe('cabecera (RQ-KP-20)', () => {
  it('reconoce por palabra la pregunta entera como cabecera', () => {
    const a = leido(analizarRespuestasEncuesta(fichero('Marca temporal,¿Cuál es el número de su ticket de servicio?,¿Qué tan satisfecho quedó con el servicio?', '2027-01-12 08:00:00,12,Muy satisfecho')))
    expect(a.filas[0]).toMatchObject({ numeroTicket: 12, calificacion: 'Muy satisfecho' })
  })

  it('el sinónimo exacto gana a la palabra: una columna exacta y otra que sólo contiene la palabra no son ambiguas', () => {
    const a = leido(analizarRespuestasEncuesta(fichero('Marca temporal,Ticket,Calificación,Comentario sobre la satisfacción', '2027-01-12 08:00:00,12,Bien,Todo bien')))
    expect(a.filas[0].calificacion).toBe('Bien')
  })

  it('cabecera ambigua: dos columnas candidatas a la calificación dan un error que nombra la columna, y ninguna fila', () => {
    const a = analizarRespuestasEncuesta(fichero('Marca temporal,Ticket,Calificación,Satisfacción', '2027-01-12 08:00:00,12,Bien,Bien'))
    expect(a.ok).toBe(false)
    expect(error(a)).toBe(ERRORES_CABECERA.ambigua('calificación'))
    expect(a).not.toHaveProperty('filas')
  })

  it('cabecera ambigua por palabra: dos preguntas que contienen «ticket»', () => {
    const a = analizarRespuestasEncuesta(fichero('Marca temporal,Ticket del servicio,Ticket de la compra,Calificación', '2027-01-12 08:00:00,1,2,Bien'))
    expect(error(a)).toBe(ERRORES_CABECERA.ambigua('ticket'))
  })

  it('cabecera irreconocible: el error nombra TODAS las columnas que faltan y no hay filas', () => {
    const a = analizarRespuestasEncuesta(fichero('a,b,c', '1,2,3'))
    expect(error(a)).toBe(ERRORES_CABECERA.faltan(['ticket', 'marca de tiempo', 'calificación']))
    expect(a).not.toHaveProperty('filas')
    expect(a).not.toHaveProperty('rechazadas')
  })

  it('con una sola columna reconocida, nombra las otras dos', () => {
    expect(error(analizarRespuestasEncuesta(fichero('Ticket,x', '1,2')))).toBe(ERRORES_CABECERA.faltan(['marca de tiempo', 'calificación']))
  })

  it('fichero vacío, de blancos o sólo con BOM: error de cabecera y ninguna fila', () => {
    for (const vacio of ['', '   \r\n \n  ', BOM]) {
      const a = analizarRespuestasEncuesta(vacio)
      expect(error(a)).toBe(ERRORES_CABECERA.vacio)
      expect(a).not.toHaveProperty('filas')
    }
  })
})

describe('filas y motivos (RQ-KP-20)', () => {
  it('una fila mala no tira las demás: su fila es la 3 (la cabecera es la 1) y leídas es 3', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,1,Bien', '2027-01-12 09:00:00,2,', '2027-01-12 10:00:00,3,Mal')))
    expect(a.filas.map((f) => [f.fila, f.numeroTicket])).toEqual([[2, 1], [4, 3]])
    expect(a.rechazadas).toEqual([{ fila: 3, motivo: MOTIVOS_FILA.sinCalificacion }])
    expect(a.leidas).toBe(3)
  })

  it('cada fila leída lleva su huella, la de huellaRespuesta', () => {
    const f = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,12,Bien'))).filas[0]
    expect(f.huella).toBe(huellaRespuesta({ numeroTicket: 12, calificacion: 'Bien', respondidaAt: '2027-01-12T13:00:00.000Z' }))
  })

  it('ticket: vacío, no numérico, `#123` válido, cero y fuera de rango', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB,
      '2027-01-12 08:00,,Bien', '2027-01-12 08:00,abc,Bien', '2027-01-12 08:00,#123,Bien', '2027-01-12 08:00,2147483647,Bien',
      '2027-01-12 08:00,2147483648,Bien', '2027-01-12 08:00,0,Bien', '2027-01-12 08:00,12.5,Bien')))
    expect(a.filas.map((f) => f.numeroTicket)).toEqual([123, 2147483647])
    expect(a.rechazadas).toEqual([
      { fila: 2, motivo: MOTIVOS_FILA.sinTicket }, { fila: 3, motivo: MOTIVOS_FILA.ticketNoNumerico },
      { fila: 6, motivo: MOTIVOS_FILA.ticketNoNumerico }, { fila: 7, motivo: MOTIVOS_FILA.ticketNoNumerico }, { fila: 8, motivo: MOTIVOS_FILA.ticketNoNumerico },
    ])
  })

  it('un motivo por fila, en el orden ticket, marca, calificación (pares de posición, regla de mutación 1)', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB,
      '2027-01-12 08:00,abc,', // ticket y calificación fallan: manda el ticket
      'no es fecha,12,', // marca y calificación fallan: manda la marca
      'no es fecha,abc,Bien', // ticket y marca fallan: manda el ticket
      ',,', // todos los campos vacíos: no es una fila
      ',12,', // marca y calificación ausentes: manda la marca
      ',abc,Bien', // ticket malo y marca VACÍA: manda el ticket (W-1)
      ',,Bien'))) // sin ticket y marca vacía: manda la falta de ticket (W-1)
    expect(a.rechazadas).toEqual([
      { fila: 2, motivo: MOTIVOS_FILA.ticketNoNumerico }, { fila: 3, motivo: MOTIVOS_FILA.marcaIlegible },
      { fila: 4, motivo: MOTIVOS_FILA.ticketNoNumerico }, { fila: 6, motivo: MOTIVOS_FILA.sinMarca },
      { fila: 7, motivo: MOTIVOS_FILA.ticketNoNumerico }, { fila: 8, motivo: MOTIVOS_FILA.sinTicket },
    ])
  })

  it('marca ausente: se rechaza con su fila y «falta la marca de tiempo»', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, ',12,Bien')))
    expect(a.rechazadas).toEqual([{ fila: 2, motivo: 'falta la marca de tiempo' }])
  })

  it('fila corta: los campos que faltan valen vacío y dan su motivo', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,12')))
    expect(a.rechazadas).toEqual([{ fila: 2, motivo: MOTIVOS_FILA.sinCalificacion }])
  })

  it('una línea en blanco entre dos filas no cuenta ni como leída ni como rechazada, pero la numeración sigue la posición del registro', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,1,Bien', '', '  ', ',,', '2027-01-12 09:00:00,2,Mal', '')))
    expect(a.leidas).toBe(2)
    expect(a.rechazadas).toEqual([])
    expect(a.filas.map((f) => f.fila)).toEqual([2, 6])
  })

  it('la calificación se guarda recortada y con los espacios colapsados, sin otra transformación', () => {
    const a = leido(analizarRespuestasEncuesta(fichero(CAB, '2027-01-12 08:00:00,1,"  Muy   buena  "', '2027-01-12 08:00:00,2,EXCELENTE', '2027-01-12 08:00:00,3,5')))
    expect(a.filas.map((f) => f.calificacion)).toEqual(['Muy buena', 'EXCELENTE', '5'])
  })

  it('es pura: el mismo contenido da el mismo resultado', () => {
    const c = fichero(CAB, '2027-01-12 08:00:00,1,Bien', 'x,y,z')
    expect(analizarRespuestasEncuesta(c)).toEqual(analizarRespuestasEncuesta(c))
  })
})

describe('marca de tiempo (RQ-KP-20)', () => {
  const marca = (texto: string): string | null => {
    const a = leido(analizarRespuestasEncuesta(`${CAB}\n"${texto}",1,Bien`))
    return a.filas[0]?.respondidaAt ?? null
  }
  const motivo = (texto: string): string | undefined => leido(analizarRespuestasEncuesta(`${CAB}\n"${texto}",1,Bien`)).rechazadas[0]?.motivo

  it('sin zona es hora de pared de Bogotá: 08:00 son las 13:00Z, no las 08:00Z', () => {
    expect(marca('2027-01-12 08:00:00')).toBe('2027-01-12T13:00:00.000Z')
    expect(marca('2027-01-12T08:00')).toBe('2027-01-12T13:00:00.000Z')
    expect(marca('2027/01/12 08:00:30')).toBe('2027-01-12T13:00:30.000Z')
  })

  it('DD/MM/AAAA: el día va primero', () => {
    expect(marca('03/02/2027 08:00')).toBe('2027-02-03T13:00:00.000Z')
    expect(marca('13/01/2027 08:00')).toBe('2027-01-13T13:00:00.000Z')
    expect(motivo('01/13/2027 08:00')).toBe(MOTIVOS_FILA.marcaIlegible)
  })

  it('sufijos a. m. / p. m. / AM / PM', () => {
    expect(marca('12/01/2027 8:00 p. m.')).toBe('2027-01-13T01:00:00.000Z')
    expect(marca('12/01/2027 8:00:15 PM')).toBe('2027-01-13T01:00:15.000Z')
    expect(marca('12/01/2027 8:00 a. m.')).toBe('2027-01-12T13:00:00.000Z')
    expect(marca('12/01/2027 12:00 a. m.')).toBe('2027-01-12T05:00:00.000Z')
    expect(marca('12/01/2027 12:30 p. m.')).toBe('2027-01-12T17:30:00.000Z')
    expect(motivo('12/01/2027 13:00 p. m.')).toBe(MOTIVOS_FILA.marcaIlegible)
  })

  it('con zona escrita se usa esa zona', () => {
    expect(marca('2027-01-12 08:00:00 GMT-5')).toBe('2027-01-12T13:00:00.000Z')
    expect(marca('2027-01-12 08:00:00 GMT+2')).toBe('2027-01-12T06:00:00.000Z')
    expect(marca('2027-01-12 08:00 UTC-3')).toBe('2027-01-12T11:00:00.000Z')
    expect(marca('2027-01-12T08:00:00Z')).toBe('2027-01-12T08:00:00.000Z')
    expect(marca('2027-01-12T08:00:00+01:00')).toBe('2027-01-12T07:00:00.000Z')
    expect(marca('2027-01-12T08:00:00-05:30')).toBe('2027-01-12T13:30:00.000Z')
  })

  it('fecha sin hora: las 00:00 de Bogotá', () => {
    expect(marca('2027-01-12')).toBe('2027-01-12T05:00:00.000Z')
    expect(marca('12/01/2027')).toBe('2027-01-12T05:00:00.000Z')
  })

  it('ilegible: fecha inexistente, hora fuera de rango y cadenas que no son fecha', () => {
    for (const t of ['31/02/2027 08:00', '2027-02-31', '2027-01-12 24:00', '2027-01-12 25:00', '2027-01-12 08:60', '2027-01-12 08:00:61', 'ayer', '12-01-2027', '2027-13-01']) {
      expect(motivo(t), t).toBe(MOTIVOS_FILA.marcaIlegible)
    }
  })

  it('propiedad: el día de respondida_at en la zona de negocio (diaEnZona) es el día escrito en el fichero', () => {
    for (const dia of ['2027-01-01', '2027-02-28', '2027-03-14', '2027-12-31']) {
      const [y, m, d] = dia.split('-')
      for (const hora of ['00:00', '00:01', '04:59', '05:00', '12:00', '19:00', '23:00', '23:59']) {
        expect(diaEnZona(marca(`${dia} ${hora}`)), `${dia} ${hora}`).toBe(dia)
        expect(diaEnZona(marca(`${d}/${m}/${y} ${hora}`)), `${d}/${m}/${y} ${hora}`).toBe(dia)
      }
    }
  })
})

describe('decodificarFichero (hipótesis 5 del diseño)', () => {
  it('el TextDecoder del entorno conoce windows-1252 (si no, el respaldo es latin1 de Buffer)', () => {
    expect(new TextDecoder('windows-1252').decode(Uint8Array.of(0x80, 0xf3))).toBe('€ó')
  })

  it('UTF-8 válido se lee como UTF-8, y el BOM se conserva para que lo descarte el analizador', () => {
    expect(decodificarFichero(new TextEncoder().encode('Calificación ✓'))).toBe('Calificación ✓')
    expect(decodificarFichero(Uint8Array.of(0xef, 0xbb, 0xbf, 0x61))).toBe(`${BOM}a`)
  })

  it('bytes que no son UTF-8 se leen como windows-1252', () => {
    expect(decodificarFichero(Uint8Array.of(0x43, 0x61, 0x6c, 0x69, 0x66, 0x69, 0x63, 0x61, 0x63, 0x69, 0xf3, 0x6e, 0x20, 0x80))).toBe('Calificación €')
  })

  it('un fichero windows-1252 entero llega hasta el analizador', () => {
    const bytes = Uint8Array.from(Buffer.from(fichero('Marca temporal;Ticket;Calificación', '2027-01-12 08:00:00;5;Excelente atención'), 'latin1'))
    const a = leido(analizarRespuestasEncuesta(decodificarFichero(bytes)))
    expect(a.filas[0].calificacion).toBe('Excelente atención')
  })
})

describe('pureza del analizador (RQ-KP-20)', () => {
  const fuente = readFileSync(new URL('./analizarRespuestas.ts', import.meta.url), 'utf8')
  const importaciones = [...fuente.matchAll(/\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)]

  it('importa SÓLO ./respuesta y, de @ambientalia/shared, instanteDeJornada', () => {
    const nombres = (de: string) => importaciones.filter((i) => i[2] === de).flatMap((i) => i[1].split(',').map((x) => x.trim().replace(/^type\s+/, '')).filter(Boolean)).sort()
    expect([...new Set(importaciones.map((i) => i[2]))].sort()).toEqual(['./respuesta', '@ambientalia/shared'])
    expect(nombres('@ambientalia/shared')).toEqual(['instanteDeJornada'])
    expect(nombres('./respuesta').every((n) => ['FilaEncuesta', 'FilaRechazada', 'huellaRespuesta'].includes(n))).toBe(true)
  })

  it('no hay otra forma de importar ni de salir al servidor, la base, la red o el disco', () => {
    const otras = fuente.split(/\bfrom\s*['"]|\bimport\s*\(|\brequire\s*\(|\bimport\s*['"]/).length - 1 - importaciones.length
    expect(otras).toBe(0)
    for (const prohibida of [/express/, /\bpg\b/, /\bfetch\s*\(/, /node:fs/, /node:http/, /process\.env/, /\.\.\//]) expect(prohibida.test(fuente), String(prohibida)).toBe(false)
  })
})
