// F1B-12 — calendario laboral: jornada fija, festivos de Colombia calculados por año, y los cierres de
// empresa inyectados como parámetro. La ley vive en código; el dato de la empresa lo trae quien llama
// (design.md, enfoque + D1-D9). Mismo molde que `fechasDerivadas.ts`: apto para navegador, sin
// librerías de fechas, `ZONA_NEGOCIO` reutilizada (nunca redeclarada — D3).
//
// `decision/calendario-habil`: «ninguna otra tanda construye su propio cálculo de horas hábiles»
// (RQ-CL-11). Este módulo es la única fuente.
import { ZONA_NEGOCIO, diaEnZona } from './fechasDerivadas'

/** Día de calendario 'YYYY-MM-DD', sin zona: aritmética pura con `Date.UTC` (D2). */
export type DiaCivil = string

/** L-V, 08:00-17:00 en `America/Bogota`, 9 horas continuas, sin descuento de almuerzo (RQ-CL-01). */
export const JORNADA = { diasSemana: [1, 2, 3, 4, 5], inicioHora: 8, finHora: 17 } as const

/** Festivos que NUNCA se mueven, caigan en el día de la semana que caigan (RQ-CL-02). */
export const FESTIVOS_FIJOS: ReadonlyArray<{ mes: number; dia: number; nombre: string }> = [
  { mes: 1, dia: 1, nombre: 'Año Nuevo' },
  { mes: 5, dia: 1, nombre: 'Día del Trabajo' },
  { mes: 7, dia: 20, nombre: 'Independencia de Colombia' },
  { mes: 8, dia: 7, nombre: 'Batalla de Boyacá' },
  { mes: 12, dia: 8, nombre: 'Inmaculada Concepción' },
  { mes: 12, dia: 25, nombre: 'Navidad' },
]

/** Festivos que se trasladan al lunes siguiente si no caen ya en lunes (RQ-CL-02). */
export const FESTIVOS_TRASLADABLES: ReadonlyArray<{ mes: number; dia: number; nombre: string }> = [
  { mes: 1, dia: 6, nombre: 'Reyes Magos' },
  { mes: 3, dia: 19, nombre: 'San José' },
  { mes: 6, dia: 29, nombre: 'San Pedro y San Pablo' },
  { mes: 8, dia: 15, nombre: 'Asunción de la Virgen' },
  { mes: 10, dia: 12, nombre: 'Día de la Raza' },
  { mes: 11, dia: 1, nombre: 'Todos los Santos' },
  { mes: 11, dia: 11, nombre: 'Independencia de Cartagena' },
]

/**
 * Festivos que dependen del domingo de Pascua: desplazamiento en días desde ese domingo, y si el
 * resultado se traslada al lunes siguiente (RQ-CL-02). Jueves y Viernes Santo nunca se mueven;
 * Ascensión, Corpus y Sagrado Corazón sí (quedan en Pascua+43, +64 y +71).
 */
export const FESTIVOS_DE_PASCUA: ReadonlyArray<{ desplazamiento: number; trasladable: boolean; nombre: string }> = [
  { desplazamiento: -3, trasladable: false, nombre: 'Jueves Santo' },
  { desplazamiento: -2, trasladable: false, nombre: 'Viernes Santo' },
  { desplazamiento: 39, trasladable: true, nombre: 'Ascensión del Señor' },
  { desplazamiento: 60, trasladable: true, nombre: 'Corpus Christi' },
  { desplazamiento: 68, trasladable: true, nombre: 'Sagrado Corazón' },
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Construye un `DiaCivil` a partir de componentes de calendario, normalizando desbordes (`Date.UTC`). */
function diaCivil(anio: number, mesIndiceCero: number, dia: number): DiaCivil {
  const f = new Date(Date.UTC(anio, mesIndiceCero, dia))
  return `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())}`
}

function partesDe(dia: DiaCivil): [number, number, number] {
  const [anio, mes, d] = dia.split('-').map(Number)
  return [anio!, mes!, d!]
}

/** Suma (o resta, con `n` negativo) días de calendario a un `DiaCivil`, por aritmética pura. */
function sumarDias(dia: DiaCivil, n: number): DiaCivil {
  const [anio, mes, d] = partesDe(dia)
  return diaCivil(anio, mes - 1, d + n)
}

/** Día de la semana ISO de un `DiaCivil`: 1 = lunes … 7 = domingo. */
function diaSemanaISO(dia: DiaCivil): number {
  const [anio, mes, d] = partesDe(dia)
  const dow = new Date(Date.UTC(anio, mes - 1, d)).getUTCDay() // 0 = domingo … 6 = sábado
  return dow === 0 ? 7 : dow
}

/**
 * Domingo de Pascua de `anio` — algoritmo anónimo gregoriano (Meeus/Jones/Butcher).
 * *Hipótesis*: base legal Ley 51 de 1983 (no hay texto legal en el repositorio, `proposal.md`).
 */
export function domingoDePascua(anio: number): DiaCivil {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return diaCivil(anio, mes - 1, dia)
}

/** Traslada `dia` al lunes siguiente si no cae ya en lunes (RQ-CL-02). */
export function trasladarALunes(dia: DiaCivil): DiaCivil {
  const dow = diaSemanaISO(dia)
  if (dow === 1) return dia
  return sumarDias(dia, 8 - dow) // dow ∈ {2..7}: días que faltan hasta el próximo lunes
}

/** Los 18 festivos de Colombia de `anio`, ordenados y sin repetidos (RQ-CL-02/03/04). */
export function festivosDeColombia(anio: number): DiaCivil[] {
  const fechas = new Set<DiaCivil>()
  for (const f of FESTIVOS_FIJOS) fechas.add(diaCivil(anio, f.mes - 1, f.dia))
  for (const f of FESTIVOS_TRASLADABLES) fechas.add(trasladarALunes(diaCivil(anio, f.mes - 1, f.dia)))
  const pascua = domingoDePascua(anio)
  for (const f of FESTIVOS_DE_PASCUA) {
    const base = sumarDias(pascua, f.desplazamiento)
    fechas.add(f.trasladable ? trasladarALunes(base) : base)
  }
  return [...fechas].sort()
}

// Festivos por año, calculados una sola vez por año consultado (A-7: el módulo no recalcula en cada
// llamada, pero tampoco carga una lista estática — sigue siendo «generados por año según la ley»).
const CACHE_FESTIVOS = new Map<number, ReadonlySet<DiaCivil>>()

function festivosComoConjunto(anio: number): ReadonlySet<DiaCivil> {
  let s = CACHE_FESTIVOS.get(anio)
  if (!s) {
    s = new Set(festivosDeColombia(anio))
    CACHE_FESTIVOS.set(anio, s)
  }
  return s
}

/**
 * ¿`dia` es hábil? Lunes a viernes (RQ-CL-01), ni festivo legal (RQ-CL-02) ni cierre de empresa
 * (RQ-CL-05). Las tres comprobaciones son independientes entre sí — es una intersección de conjuntos,
 * no una cadena de guardas con distinto mensaje — así que su orden es irrelevante (regla de mutación 1
 * de `CLAUDE.md`, comprobado y revertido en Fase 3 del cierre).
 */
export function esDiaHabil(dia: DiaCivil, cierres: ReadonlySet<DiaCivil>): boolean {
  const anio = Number(dia.slice(0, 4))
  if (!(JORNADA.diasSemana as readonly number[]).includes(diaSemanaISO(dia))) return false
  if (festivosComoConjunto(anio).has(dia)) return false
  if (cierres.has(dia)) return false
  return true
}

// A-7 (`fechasDerivadas.ts:44-48`): formateador de hora/minuto construido UNA VEZ a nivel de módulo,
// que MIDE el desplazamiento real de `ZONA_NEGOCIO` para cada día en vez de fijar «-5 h» a mano (D3):
// Bogotá no tiene horario de verano, pero una constante sería una segunda definición de la zona.
const FORMATEADOR_HORA_ZONA_NEGOCIO = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_NEGOCIO, hour: 'numeric', minute: 'numeric', hour12: false,
})

/** El instante UTC que corresponde a `hora:minuto` del `dia` civil dado, en `ZONA_NEGOCIO`. */
function instanteDeJornada(dia: DiaCivil, hora: number, minuto = 0): Date {
  const [anio, mes, d] = partesDe(dia)
  const aproximado = Date.UTC(anio, mes - 1, d, hora, minuto)
  // `aproximado` trata la hora deseada COMO SI fuera UTC. Formatearla en la zona de negocio enseña
  // cuánto se desvía esa lectura de la hora deseada, y esa diferencia ES el desplazamiento real del
  // día — sin parsear el texto «GMT-5» y sin fijar el número a mano.
  const partes = FORMATEADOR_HORA_ZONA_NEGOCIO.formatToParts(new Date(aproximado))
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value)
  const horaLeida = valor('hour') % 24
  const minutoLeido = valor('minute')
  const diffMin = (hora * 60 + minuto) - (horaLeida * 60 + minutoLeido)
  return new Date(aproximado + diffMin * 60_000)
}

/**
 * Horas hábiles entre dos instantes (RQ-CL-07). Recorre los días civiles de `desde` a `hasta` en
 * `ZONA_NEGOCIO` (RQ-CL-10, reutiliza `diaEnZona` de `fechasDerivadas.ts` — D2, no se reescribe) y
 * suma, por cada día hábil, la intersección de `[desde, hasta]` con su ventana 08:00-17:00.
 */
export function horasHabilesEntre(desde: Date, hasta: Date, cierres: ReadonlySet<DiaCivil>): number {
  if (hasta.getTime() <= desde.getTime()) return 0 // RQ-CL-09: fin <= inicio, sin excepción
  const diaFin = diaEnZona(hasta)!
  let total = 0
  let dia = diaEnZona(desde)!
  while (dia <= diaFin) {
    if (esDiaHabil(dia, cierres)) {
      const inicioJornada = instanteDeJornada(dia, JORNADA.inicioHora).getTime()
      const finJornada = instanteDeJornada(dia, JORNADA.finHora).getTime()
      const ini = Math.max(inicioJornada, desde.getTime())
      const fin = Math.min(finJornada, hasta.getTime())
      if (fin > ini) total += (fin - ini) / (60 * 60 * 1000)
    }
    dia = sumarDias(dia, 1)
  }
  return total
}

/**
 * Días hábiles estrictamente posteriores a `desde` y hasta `hasta` inclusive: `(desde, hasta]`
 * (RQ-CL-08). `desde` y `hasta` son días civiles, no instantes.
 */
export function diasHabilesEntre(desde: DiaCivil, hasta: DiaCivil, cierres: ReadonlySet<DiaCivil>): number {
  let total = 0
  let dia = sumarDias(desde, 1)
  while (dia <= hasta) {
    if (esDiaHabil(dia, cierres)) total++
    dia = sumarDias(dia, 1)
  }
  return total
}
