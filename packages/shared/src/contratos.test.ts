import { describe, it, expect } from 'vitest'
import { esLote, ritmoInsuficiente, celdaCSV, csvDelInforme, diasEntre, porcentaje, estadoSubOV, fechaCalendario, estadoContrato, motivoVencido, prioridadAlNacer, hoyEnZona, trimestresDelContrato, trimestreEn } from '@ambientalia/shared'

/**
 * Contrato por lote (registro-contrato, lote 1; `tickets-core` RQ-TC-21, RQ-TC-22). Se importa desde
 * `@ambientalia/shared` a propósito: así la prueba comprueba también el export de `index.ts`.
 */
describe('fechaCalendario · sólo un día real en forma YYYY-MM-DD', () => {
  it.each(['2026-12-31', '2028-02-29', '  2026-10-01  '])('%s → el día, recortado', (v) => {
    expect(fechaCalendario(v)).toBe(v.trim())
  })
  it.each<unknown>(['2026-02-30', '2027-02-29', '31/12/2026', '', '   ', null, undefined, 20261231, '2026-12-31T00:00:00Z'])(
    '%s → null', (v) => {
      expect(fechaCalendario(v)).toBeNull()
    })
})

describe('esLote · la OV madre, nunca una subOV (casos del lote 1, antes sobre LOTE_OV)', () => {
  it.each(['OV-2026-170', 'OV-2026-1700'])('%s es un lote', (v) => expect(esLote(v)).toBe(true))
  it.each(['OV-2026-170-01', 'OVI-2026-170', 'OV-2026-17', 'OV-2026-17000', "OV-2026-170'; DROP TABLE contratos"])(
    '%s no es un lote', (v) => expect(esLote(v)).toBe(false))
})

describe('estadoContrato · las dos fechas incluidas (S-4, S-5)', () => {
  const c = { fechaInicio: '2026-10-01', fechaFin: '2026-12-31' }
  it.each([
    ['2026-09-30', 'no_iniciado'], // la víspera del inicio
    ['2026-10-01', 'vigente'], // inicio = hoy
    ['2026-11-15', 'vigente'],
    ['2026-12-31', 'vigente'], // fin = hoy
    ['2027-01-01', 'vencido'], // fin = ayer
  ])('hoy %s → %s', (hoy, estado) => expect(estadoContrato(c, hoy)).toBe(estado))
  it('un contrato de un solo día está vigente ese día y sólo ese', () => {
    const unDia = { fechaInicio: '2026-10-01', fechaFin: '2026-10-01' }
    expect([estadoContrato(unDia, '2026-09-30'), estadoContrato(unDia, '2026-10-01'), estadoContrato(unDia, '2026-10-02')])
      .toEqual(['no_iniciado', 'vigente', 'vencido'])
  })
})

describe('motivoVencido · sólo una subOV de un lote con contrato vencido (RQ-TC-25)', () => {
  const contrato = { id: 7, lote: 'OV-2026-170', fechaInicio: '2026-01-01', fechaFin: '2026-06-30' }
  it('subOV del lote y contrato vencido → texto que nombra lote, contrato y fin', () => {
    const m = motivoVencido('OV-2026-170-01', contrato, '2026-07-01')
    expect(m).toMatch(/OV-2026-170-01/)
    expect(m).toMatch(/lote OV-2026-170/)
    expect(m).toMatch(/contrato nº 7/)
    expect(m).toMatch(/2026-06-30/)
  })
  it.each<[string, string, typeof contrato | null]>([
    ['OV-2026-170', '2026-07-01', contrato], // la OV madre (ordinaria) no se bloquea
    ['OVI-2026-170', '2026-07-01', contrato],
    ['OV-2026-170-X9', '2026-07-01', contrato], // cuarentena: su guarda es otra
    ['OV-2026-170-01', '2026-06-30', contrato], // fin = hoy: sigue vigente
    ['OV-2026-170-01', '2025-12-31', contrato], // aún no iniciado: no está vencido
    ['OV-2026-170-01', '2026-07-01', null], // sin contrato
  ])('%s el %s → null', (numero, hoy, c) => expect(motivoVencido(numero, c, hoy)).toBeNull())
  it('un contrato de OTRO lote no bloquea la subOV', () => {
    expect(motivoVencido('OV-2026-171-01', contrato, '2026-07-01')).toBeNull()
  })
})

describe('hoyEnZona · el día en Bogotá, nunca el del proceso (S-11)', () => {
  it('las 23:30 de Bogotá del 31-dic son las 04:30Z del 1-ene: hoy es 31-dic, y el contrato que acaba ese día sigue vigente', () => {
    const hoy = hoyEnZona(new Date('2027-01-01T04:30:00Z'))
    expect(hoy).toBe('2026-12-31')
    expect(estadoContrato({ fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }, hoy)).toBe('vigente')
  })
  it('a las 00:00 de Bogotá del 1-ene (05:00Z) ya es 1-ene, y el mismo contrato está vencido', () => {
    const hoy = hoyEnZona(new Date('2027-01-01T05:00:00Z'))
    expect(hoy).toBe('2027-01-01')
    expect(estadoContrato({ fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }, hoy)).toBe('vencido')
  })
})

describe('prioridadAlNacer · High con contrato vigente; si no, exactamente lo de antes (ticketService.ts:106 en 9288779)', () => {
  it.each<[unknown, string]>([['Low', 'High'], [undefined, 'High'], ['', 'High'], ['High', 'High']])(
    'con contrato vigente, pedida %j → %s', (pedida, esperada) => expect(prioridadAlNacer(pedida, true, null)).toBe(esperada))
  it.each<[unknown, string | null]>([['Low', 'Low'], ['Medium', 'Medium'], [undefined, null], ['', null], [null, null]])(
    'sin contrato vigente, pedida %j → %j', (pedida, esperada) => expect(prioridadAlNacer(pedida, false, null)).toBe(esperada))
})

describe('trimestresDelContrato · desde el inicio, con recorte a fin de mes; el último acaba en el fin (S-12)', () => {
  it('un año desde el 1-oct: cuatro trimestres naturales', () => {
    expect(trimestresDelContrato('2026-10-01', '2027-09-30')).toEqual([
      { k: 1, inicio: '2026-10-01', fin: '2026-12-31' },
      { k: 2, inicio: '2027-01-01', fin: '2027-03-31' },
      { k: 3, inicio: '2027-04-01', fin: '2027-06-30' },
      { k: 4, inicio: '2027-07-01', fin: '2027-09-30' },
    ])
  })
  it('fin de mes: desde el 31-ene, 30-abr → 31-jul → 31-oct, calculado SIEMPRE desde el inicio (encadenar daría 30-jul)', () => {
    expect(trimestresDelContrato('2026-01-31', '2026-12-31').map((t) => [t.inicio, t.fin])).toEqual([
      ['2026-01-31', '2026-04-29'], ['2026-04-30', '2026-07-30'], ['2026-07-31', '2026-10-30'], ['2026-10-31', '2026-12-31'],
    ])
  })
  it('año bisiesto: desde el 30-nov, el trimestre 2 empieza el 29-feb en 2028 y el 28-feb en 2027', () => {
    expect(trimestresDelContrato('2027-11-30', '2028-11-29')[1]).toEqual({ k: 2, inicio: '2028-02-29', fin: '2028-05-29' })
    expect(trimestresDelContrato('2026-11-30', '2027-11-29')[1]).toEqual({ k: 2, inicio: '2027-02-28', fin: '2027-05-29' })
  })
  it('año bisiesto: desde el 29-feb, el trimestre 5 empieza el 28-feb del año siguiente', () => {
    expect(trimestresDelContrato('2028-02-29', '2029-06-30')[4]).toEqual({ k: 5, inicio: '2029-02-28', fin: '2029-05-28' })
  })
  it('el último trimestre se recorta en el fin del contrato', () => {
    expect(trimestresDelContrato('2026-10-01', '2026-11-15')).toEqual([{ k: 1, inicio: '2026-10-01', fin: '2026-11-15' }])
  })
})

describe('trimestreEn · el trimestre en curso, o null fuera de la vigencia', () => {
  const c = { fechaInicio: '2026-10-01', fechaFin: '2027-09-30' }
  it.each<[string, number | null]>([
    ['2026-09-30', null], ['2026-10-01', 1], // inicio = hoy
    ['2026-12-31', 1], ['2027-01-01', 2], // cambio de trimestre
    ['2027-09-30', 4], ['2027-10-01', null], // fin = hoy, fin = ayer
  ])('hoy %s → %j', (hoy, k) => expect(trimestreEn(c, hoy)).toBe(k))
})

// Lote 3 — la ruta decide el lote con `clasificarOV` (subOV.ts:32-36), no con una regex propia: un lote es la OV
// madre que `clasificarOV` devolvería para una subOV canónica suya. (`LOTE_OV`, su gemela, se retiró en el lote 4.)
describe('esLote · el lote que clasificarOV reconoce', () => {
  const casos: unknown[] = ['OV-2026-170', 'OV-2026-1700', 'OV-2026-170-01', 'OVI-2026-170', 'OV-2026-17', 'OV-2026-17000',
    "OV-2026-170'; DROP TABLE contratos", ' OV-2026-170', 'OV-2026-170 ', '', 'SO-00123', null, 170]
  it.each(['OV-2026-170', 'OV-2026-1700'])('%s es un lote', (v) => expect(esLote(v)).toBe(true))
  it.each(casos.slice(2))('%s no es un lote', (v) => expect(esLote(v)).toBe(false))
  it('el lote de toda subOV canónica es un lote para esLote (misma fuente: clasificarOV)', () => {
    for (const s of ['OV-2026-170-01', 'OV-2026-1700-99', 'OV-2099-001-00']) expect(esLote(s.slice(0, -3)), s).toBe(true)
  })
})

// Lote 4 — informe trimestral (`zoho-sync` RQ-ZS-15). `trimestresDelContrato` es del lote 1: aquí es regresión.
describe('trimestres del informe · desde el inicio, nunca naturales (S-12, regresión)', () => {
  it('inicio 2026-02-10, fin 2027-02-09: t1 hasta 05-09, t2 desde 05-10, el último acaba el 2027-02-09', () => {
    const t = trimestresDelContrato('2026-02-10', '2027-02-09')
    expect(t[0]).toEqual({ k: 1, inicio: '2026-02-10', fin: '2026-05-09' })
    expect(t[1]!.inicio).toBe('2026-05-10')
    expect(t.at(-1)!.fin).toBe('2027-02-09')
  })
  it('inicio 31-ene: t2 el 30-abr y t3 el 31-jul, siempre desde el inicio (sin arrastrar el recorte)', () => {
    const t = trimestresDelContrato('2026-01-31', '2027-01-30')
    expect([t[1]!.inicio, t[2]!.inicio]).toEqual(['2026-04-30', '2026-07-31'])
  })
})

describe('diasEntre, porcentaje y estadoSubOV', () => {
  it('días hasta el fin: 30 con el contrato vigente, -5 con el vencido', () => {
    expect(diasEntre('2026-12-01', '2026-12-31')).toBe(30)
    expect(diasEntre('2027-01-05', '2026-12-31')).toBe(-5)
    expect(diasEntre('2026-02-28', '2026-03-01')).toBe(1)
  })
  it('porcentaje: 0 sin creadas; 3 de 10 → 30; redondeado como el consumido', () => {
    expect(porcentaje(0, 0)).toBe(0)
    expect(porcentaje(3, 10)).toBe(30)
    expect(porcentaje(1, 3)).toBe(33)
  })
  it('libre sin ticket; ejecutada sólo con el ticket HOY en Finalizado; cualquier otro estado, en curso (S-6)', () => {
    expect(estadoSubOV(null)).toBe('libre')
    expect(estadoSubOV('Finalizado')).toBe('ejecutada')
    expect(estadoSubOV('Por Facturar')).toBe('en_curso')
    expect(estadoSubOV('Ingresado')).toBe('en_curso')
  })
})

// Lote 5 — ritmo (RQ-AV-14, S-19) y CSV (S-17, S-23; amenaza «fórmulas en el CSV»).
describe('ritmoInsuficiente · proyección = ejecutadas + (ejecutadas / transcurridos) × restantes < creadas', () => {
  // Inicio 2026-02-01, fin 2026-07-30: el trimestre 1 acaba el 2026-04-30. Hoy 2026-05-01 → transcurridos 90
  // (diasEntre + 1, el de inicio cuenta) y restantes 90, ya en el trimestre 2.
  const c = { fechaInicio: '2026-02-01', fechaFin: '2026-07-30' }
  const HOY = '2026-05-01'
  it('90/90 con 3 de 10 → true (proyección 6)', () => expect(ritmoInsuficiente(c, 10, 3, HOY)).toBe(true))
  it('90/90 con 6 de 10 → false (proyección 12)', () => expect(ritmoInsuficiente(c, 10, 6, HOY)).toBe(false))
  it('dentro del trimestre 1 → false, aunque vaya a 0', () => expect(ritmoInsuficiente(c, 10, 0, '2026-04-30')).toBe(false))
  it('0 creadas → false', () => expect(ritmoInsuficiente(c, 0, 0, HOY)).toBe(false))
  it('contrato vencido con ritmo malo → false', () => expect(ritmoInsuficiente(c, 10, 1, '2026-07-31')).toBe(false))
  it('el último día del contrato, con 9 de 10 → true (restantes 0: proyección 9)', () => expect(ritmoInsuficiente(c, 10, 9, '2026-07-30')).toBe(true))
})

describe('celdaCSV · neutraliza fórmulas, escapa comillas, entrecomilla si hace falta', () => {
  it.each<[string, string | number | null, string]>([
    ['= fórmula', '=SUM(A1:A9)', "'=SUM(A1:A9)"],
    ['+ fórmula', '+1+1', "'+1+1"],
    ['- fórmula', '-2+3', "'-2+3"],
    ['@ fórmula', '@SUM(A1)', "'@SUM(A1)"],
    ['TAB inicial', '\t=1', "'\t=1"],
    ['CR inicial (se neutraliza y, por llevar CR, se entrecomilla)', '\r=1', "\"'\r=1\""],
    ['texto con «-» en medio', 'Equipo - sin cable', 'Equipo - sin cable'],
    ['texto que empieza por «- »', '- Sin cable', "'- Sin cable"],
    ['-5 como NÚMERO: pasa tal cual (lo calcula el servidor, no es texto de nadie)', -5, '-5'],
    ['"-5" como TEXTO: se neutraliza (en texto libre no se distingue de «-5+cmd»)', '-5', "'-5"],
    ['número positivo', 30, '30'],
    ['texto normal', 'Mantenimiento', 'Mantenimiento'],
    ['comillas → duplicadas y entrecomillado', 'Equipo "A"', '"Equipo ""A"""'],
    ['coma → entrecomillado', 'Bogotá, D.C.', '"Bogotá, D.C."'],
    ['LF → entrecomillado', 'línea 1\nlínea 2', '"línea 1\nlínea 2"'],
    ['null → vacío', null, ''],
  ])('%s', (_n, entrada, salida) => expect(celdaCSV(entrada)).toBe(salida))
})

describe('csvDelInforme · una fila por trimestre y por servicio (S-23)', () => {
  const servicio = (fecha: string, equipo: string) => ({
    subOV: 'OV-2026-170-01', ticketId: 't1', ticketNumber: 12, equipo, serial: 'S1', tipoServicio: 'Mantenimiento', fecha,
    informe: 'No disponible en los datos' as const,
  })
  const inf = {
    libres: 4, diasHastaFin: -5,
    trimestres: [
      { k: 1, inicio: '2026-01-01', fin: '2026-03-31', ejecutadasAlCierre: 1, porcentajeEjecutado: 20, servicios: [servicio('2026-02-10', '=HYPERLINK("x")')] },
      { k: 2, inicio: '2026-04-01', fin: '2026-06-30', ejecutadasAlCierre: 1, porcentajeEjecutado: 20, servicios: [] },
    ],
  }
  it('cabecera, fila de trimestre, sus servicios, y el hueco del informe; la fórmula del equipo, neutralizada', () => {
    const lineas = csvDelInforme(inf).split('\r\n')
    expect(lineas[0]).toBe('Fila,Trimestre,Desde,Hasta,% ejecutado acumulado,SubOV libres hoy,Días hasta el fin,SubOV,Ticket,Equipo,Serial,Tipo de servicio,Fecha,Informe')
    expect(lineas[1]).toBe('Trimestre,1,2026-01-01,2026-03-31,20,4,-5,,,,,,,')
    expect(lineas[2]).toBe('Servicio,1,,,,,,OV-2026-170-01,12,"\'=HYPERLINK(""x"")",S1,Mantenimiento,2026-02-10,No disponible en los datos')
    expect(lineas[3]).toBe('Trimestre,2,2026-04-01,2026-06-30,20,4,-5,,,,,,,')
    expect(lineas).toHaveLength(4)
  })
})

describe('prioridadAlNacer · manda la más alta entre contrato y Top 5 (RQ-TC-24, cuatro combinaciones)', () => {
  const sinContrato = false
  const conContrato = true
  // contrato {no, sí} × Top 5 {null, Low, Medium, High} × pedida {Low, undefined, Urgent}
  it.each<[boolean, string | null, unknown, string | null]>([
    // 1 · ni contrato ni Top 5: exactamente la regla de hoy
    [sinContrato, null, 'Low', 'Low'], [sinContrato, null, undefined, null], [sinContrato, null, 'Urgent', 'Urgent'],
    // 2 · sólo contrato: High
    [conContrato, null, 'Low', 'High'], [conContrato, null, undefined, 'High'], [conContrato, null, 'Urgent', 'High'],
    // 3 · sólo Top 5: el del Top 5, la pedida se ignora
    [sinContrato, 'Low', 'High', 'Low'], [sinContrato, 'Medium', 'Low', 'Medium'], [sinContrato, 'High', undefined, 'High'],
    [sinContrato, 'Medium', 'Urgent', 'Medium'], [sinContrato, 'Low', 'Urgent', 'Low'],
    // 4 · los dos: la más alta
    [conContrato, 'Low', 'Low', 'High'], [conContrato, 'Medium', undefined, 'High'], [conContrato, 'High', 'Urgent', 'High'],
  ])('contrato %j · Top 5 %j · pedida %j → %j', (contrato, top5, pedida, esperada) => {
    expect(prioridadAlNacer(pedida, contrato, top5)).toBe(esperada)
  })
})
