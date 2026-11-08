/**
 * modo-sin-zoho (1G-04, RQ-ZS-40 a RQ-ZS-42) · el error del corte y el registro en memoria de cortes por origen y rechazos por ruta.
 *
 * Vive en el paquete y no en `apps/desk` porque el worker `hub-sync` también lo usa. Nada de lo que guarda lleva datos de clientes:
 * el recurso se reduce a un conjunto cerrado de segmentos (D-2), el llamador sale de la pila como `fichero · función` (nunca una ruta
 * absoluta del disco) y la ruta rechazada llega ya como patrón de Express. El verbo HTTP se lee de `init` por acceso, sin clave literal:
 * el barrido de `apps/desk/server/testing/superficieSaliente.ts` clasificaría un literal.
 */

/** El mensaje es FIJO a propósito: ni ruta, ni ids, ni query. */
const MENSAJE_CORTE = 'modo sin Zoho Desk: la petición a Zoho Desk no salió'

export class ErrorModoSinZohoDesk extends Error {
  /** La marca permite reconocerlo aunque haya dos copias del módulo (`instanceof` no cruzaría). */
  readonly modoSinZohoDesk = true

  constructor() {
    super(MENSAJE_CORTE)
    this.name = 'ErrorModoSinZohoDesk'
  }
}

export function esCorteModoSinZoho(e: unknown): boolean {
  if (e instanceof ErrorModoSinZohoDesk) return true
  return typeof e === 'object' && e !== null && (e as { modoSinZohoDesk?: unknown }).modoSinZohoDesk === true
}

/** Las rutas que hoy recibe `zohoFetch` (D-2). Un recurso nuevo sale como `{x}` y lo identifica el llamador. */
const SEGMENTOS: ReadonlySet<string> = new Set([
  'tickets', 'archivedTickets', 'search', 'History', 'conversations', 'contacts', 'accounts',
  'tasks', 'attachments', 'threads', 'comments', 'content', 'sendReply', 'mailReplyAddress',
])
const VERBOS: ReadonlySet<string> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/** `GET /tickets/{x}/conversations`: verbo reducido, sin query, y `{x}` por todo segmento fuera del inventario. */
export function recursoDeRuta(path: string, init?: RequestInit): string {
  const pedido = String(init?.method ?? 'GET').toUpperCase()
  const verbo = VERBOS.has(pedido) ? pedido : 'OTRO'
  const ruta = path.split('?')[0].split('/').map((s) => (s === '' || SEGMENTOS.has(s) ? s : '{x}')).join('/')
  return `${verbo} ${ruta}`
}

const MARCO = /^\s*at\s+(?:(.*?)\s+\((.*):(\d+):(\d+)\)|(.*):(\d+):(\d+))\s*$/
const MARCO_PROPIO = /(?:^|\/)(?:modoSinZoho|zohoClient)\.ts$/
const RUTA_DEL_REPOSITORIO = /^.*(?:^|\/)((?:apps|packages|scripts)\/.*)$/

function nombreDeFuncion(crudo: string | undefined): string {
  if (!crudo) return '(anónima)'
  const limpio = crudo.replace(/^async\s+/, '').replace(/^new\s+/, '').replace(/\s+\[as [^\]]*\]$/, '')
  const ultimo = limpio.split('.').pop() ?? ''
  return ultimo === '' || ultimo.startsWith('<') ? '(anónima)' : ultimo
}

/** El primer marco que no sea del propio módulo, de `zohoClient.ts` ni de `node:`; `fichero · función`, `dependencia` o `desconocido`. */
export function llamadorDeLaPila(pila: string | undefined): string {
  for (const linea of (pila ?? '').split('\n')) {
    const m = MARCO.exec(linea)
    if (!m) continue
    const funcion = m[1]
    const ubicacion = (m[2] ?? m[5] ?? '')
      .replace(/\\/g, '/')
      .replace(/^async\s+/, '')
      .replace(/^file:\/+/, '/')
      .replace(/\?[^/]*$/, '')
    if (/^node:/.test(ubicacion) || MARCO_PROPIO.test(ubicacion)) continue
    if (ubicacion.includes('/node_modules/')) return 'dependencia'
    const propia = RUTA_DEL_REPOSITORIO.exec(ubicacion)
    return propia ? `${propia[1]} · ${nombreDeFuncion(funcion)}` : 'desconocido'
  }
  return 'desconocido'
}

export interface CorteLeido { recurso: string; llamador: string; cuenta: number; primera: string; ultima: string }
export interface RechazoLeido { ruta: string; cuenta: number; primera: string; ultima: string }
export interface LecturaModoSinZoho { cortes: CorteLeido[]; rechazos: RechazoLeido[] }

export interface RegistroModoSinZoho {
  /** Cuenta el intento y DESPUÉS lanza `ErrorModoSinZohoDesk`: un llamador que se traga el error también suma. */
  cortar(path: string, init?: RequestInit): never
  /** Un `503` que una persona recibió, por el patrón de su ruta. Va aparte de los cortes. */
  rechazar(ruta: string): void
  /** Una copia ordenada por código; no lanza. */
  leer(): LecturaModoSinZoho
}

export interface OpcionesRegistro {
  ahora?: () => Date
  /** Una línea por origen nuevo y por ruta rechazada nueva. Si lanza, no se nota. */
  avisar?: (linea: string) => void
}

interface Rastro { cuenta: number; primera: string; ultima: string }

const porCodigo = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

export function crearRegistroModoSinZoho({ ahora = () => new Date(), avisar }: OpcionesRegistro = {}): RegistroModoSinZoho {
  const cortes = new Map<string, Rastro & { recurso: string; llamador: string }>()
  const rechazos = new Map<string, Rastro & { ruta: string }>()

  const decir = (linea: string): void => {
    try {
      avisar?.(linea)
    } catch {
      /* el log no frena al corte */
    }
  }

  return {
    cortar(path, init) {
      const recurso = recursoDeRuta(path, init)
      const llamador = llamadorDeLaPila(new Error().stack)
      const hora = ahora().toISOString()
      const clave = `${recurso}\u0000${llamador}`
      const previo = cortes.get(clave)
      if (previo) {
        previo.cuenta++
        previo.ultima = hora
      } else {
        cortes.set(clave, { recurso, llamador, cuenta: 1, primera: hora, ultima: hora })
        decir(`modo sin Zoho Desk: primer corte de ${recurso} ← ${llamador}`)
      }
      throw new ErrorModoSinZohoDesk()
    },
    rechazar(ruta) {
      const hora = ahora().toISOString()
      const previo = rechazos.get(ruta)
      if (previo) {
        previo.cuenta++
        previo.ultima = hora
      } else {
        rechazos.set(ruta, { ruta, cuenta: 1, primera: hora, ultima: hora })
        decir(`modo sin Zoho Desk: primer rechazo en ${ruta}`)
      }
    },
    leer() {
      return {
        cortes: [...cortes.values()]
          .map(({ recurso, llamador, cuenta, primera, ultima }) => ({ recurso, llamador, cuenta, primera, ultima }))
          .sort((a, b) => porCodigo(a.recurso, b.recurso) || porCodigo(a.llamador, b.llamador)),
        rechazos: [...rechazos.values()]
          .map(({ ruta, cuenta, primera, ultima }) => ({ ruta, cuenta, primera, ultima }))
          .sort((a, b) => porCodigo(a.ruta, b.ruta)),
      }
    },
  }
}
