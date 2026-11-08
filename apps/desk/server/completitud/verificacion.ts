import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS } from '@ambientalia/zoho-sync/conversaciones'
import { logger } from '../util/logger'
import { cargarConocidas, ENTIDADES, ErrorLista, leerLista as leerListaReal, type Entidad, type ListaConocidas } from './conocidas'
import { clasificar, conocidasSinUso, type Clasificacion, type FilaDiferencia } from './clasificar'
import { compararIds } from './comparar'
import { leerPaginas, leerPorId } from './lectores'
import { crearRegistroEscrituras, soloGet, soloSelect, type RegistroEscrituras } from './soloLectura'
import { veredictoEntidad, veredictoGlobal, type CorteVerificacion, type Estado } from './veredicto'

/**
 * verificacion-completitud (1G-03, D7, D10, D11, RQ-ZS-35, RQ-ZS-37) · el motor: estado en memoria, fase A (listas globales con re-verificación
 * por id), `lanzar`, `recuento` (`limite=0`) y `estado`. Molde: `apps/desk/server/adjuntos/rellenoAdjuntos.ts` (`enMarcha` antes del primer `await`,
 * `structuredClone`, una línea de log). Zoho, sólo por `soloGet`; PostgreSQL, sólo por `soloSelect`; el motor NO recibe `sync`, cuyas listas escriben
 * mientras leen. El estado, el informe y el log llevan sólo ids, números de ticket y recuentos (CA-11): nunca nombres, correos, asuntos ni `raw`.
 * Las fases B (por ticket) y C (volumen) las añaden L5 y L6: hasta entonces las tres entidades por ticket quedan «sin comparar» y la cobertura no es completa.
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export interface Fila { id: string; numero?: number; clase: 'conocida' | 'sin explicar'; causa?: string; entrada?: string; heredadaDe?: string; tamano?: { zoho: number | null; desk: number | null } }
export interface InformeEntidad {
  estado: Estado; motivo?: string; enZoho: number; enDesk: number; casan: number; sinExplicar: number; conocidas: number
  faltaEnDesk: Fila[]; faltaEnZoho: Fila[]; huecosDeLista: { id: string; numero?: number }[]; noEvaluados: Omit<Fila, 'id'>[]
  peticiones: number; vistos429: number
}
export interface Informe {
  esquema: 1; versionLista: number; departamento: string; veredicto: Exclude<Estado, 'sin comparar'>
  cobertura: { desde: number | null; hasta: number | null; completa: boolean; aComparar: number; comparados: number }
  cortadoEn: CorteVerificacion | null; motivoCorte?: '429' | 'limite'; entidades: Record<Entidad, InformeEntidad>
  errores: { entidad: Entidad; numero?: number; id?: string; motivo: string }[]; conocidasSinUso: { indice: number; entidad: Entidad; entrada: string }[]
  escriturasRechazadas: RegistroEscrituras; peticiones: number; vistos429: number
}
export interface EstadoVerificacion {
  enMarcha: boolean; terminado: boolean; fase: 'A' | 'B' | 'C' | null; desde: number | null; limite: number | null
  inicio?: string; fin?: string; error?: string; informe: Informe | null
}
export interface RecuentoVerificacion {
  lista: { version: number } | { error: string }; desde: number | null; desk: Record<Entidad, number>
  appNacidos: number; porComparar: number; bytesAdjuntos: number; peticionesMinimas: number
}
export interface DepsVerificacion {
  zohoFetch: ZohoFetch; db: Queryable; departmentId: string
  /** `dirAdjuntos(...)`: lo usa la fase C (L6). */
  dir: string | null
  leerLista?: () => string; pausaMs?: number; pausa429Ms?: number
  registrar?: (r: EstadoVerificacion) => void
}

const PAGINA = 100
const POR_TICKET: Entidad[] = ['conversaciones', 'adjuntos', 'historia']
const TABLAS = { tickets: 'tickets', conversaciones: 'conversations', adjuntos: 'attachments', historia: 'ticket_history', contactos: 'contacts', cuentas: 'accounts' } as const
/** Una entidad global: sus listas de Zoho, su consulta de Desk y la ruta para pedir un id suelto. */
interface Espec { entidad: Entidad; rutas: string[]; params: Record<string, string>; porId: string; sql: string }
interface FilaDesk { id: string; numero?: number; fuente?: string | null; managedByApp?: boolean }
interface Contexto { f: ZohoFetch; lee: Queryable; lista: ListaConocidas; informe: Informe; entidad: Entidad; pedidas: number; clases: Clasificacion[] }

class ErrorBase extends Error {}

const estadoInicial = (): EstadoVerificacion => ({ enMarcha: false, terminado: false, fase: null, desde: null, limite: null, informe: null })
const entidadInicial = (): InformeEntidad => ({
  estado: 'sin comparar', motivo: 'no alcanzada', enZoho: 0, enDesk: 0, casan: 0, sinExplicar: 0, conocidas: 0,
  faltaEnDesk: [], faltaEnZoho: [], huecosDeLista: [], noEvaluados: [], peticiones: 0, vistos429: 0,
})
const informeInicial = (lista: ListaConocidas, departamento: string): Informe => ({
  esquema: 1, versionLista: lista.version, departamento, veredicto: 'incompleto',
  cobertura: { desde: null, hasta: null, completa: false, aComparar: 0, comparados: 0 }, cortadoEn: null,
  entidades: Object.fromEntries(ENTIDADES.map((e) => [e, entidadInicial()])) as Record<Entidad, InformeEntidad>,
  errores: [], conocidasSinUso: [], escriturasRechazadas: crearRegistroEscrituras(), peticiones: 0, vistos429: 0,
})

const dormir = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())
const entero = (v: unknown): number | undefined => (Number.isInteger(Number(v)) && v !== null && v !== '' ? Number(v) : undefined)

/** Las lecturas de Desk: un fallo de la base se traduce a un código cerrado, sin el mensaje del driver. */
async function filas(lee: Queryable, sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
  try { return (await lee.query(sql, params)).rows as Record<string, unknown>[] } catch { throw new ErrorBase() }
}
const aFilaDesk = (r: Record<string, unknown>): FilaDesk => ({ id: String(r.id), numero: entero(r.number), fuente: r.source as string | null | undefined, managedByApp: r.managed_by_app === true })

/** El resumen de la pasada va al logger como UNA línea: estados, recuentos, corte y veredicto; ningún id. */
const registrarEnLog = (r: EstadoVerificacion) => {
  const i = r.informe
  const entidades = i ? Object.fromEntries(ENTIDADES.map((e) => [e, { estado: i.entidades[e].estado, enZoho: i.entidades[e].enZoho, enDesk: i.entidades[e].enDesk, sinExplicar: i.entidades[e].sinExplicar, conocidas: i.entidades[e].conocidas }])) : null
  logger.info({ resumen: { error: r.error, veredicto: i?.veredicto, cortadoEn: i?.cortadoEn, escriturasRechazadas: i?.escriturasRechazadas, peticiones: i?.peticiones, vistos429: i?.vistos429, entidades } },
    `verificacion-completitud: ${i?.veredicto ?? 'sin informe'}${i?.cortadoEn ? `, cortada en la fase ${i.cortadoEn.fase}` : ''}`)
}

export function crearVerificacionCompletitud({
  zohoFetch, db, departmentId, leerLista = leerListaReal, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS, registrar = registrarEnLog,
}: DepsVerificacion) {
  let estado = estadoInicial()
  const ESPECS: Espec[] = [
    { entidad: 'tickets', rutas: ['/tickets', '/tickets/archivedTickets'], params: { departmentId }, porId: '/tickets/', sql: 'SELECT id, number FROM tickets' },
    { entidad: 'contactos', rutas: ['/contacts'], params: {}, porId: '/contacts/', sql: 'SELECT id, source, managed_by_app FROM contacts' },
    { entidad: 'cuentas', rutas: ['/accounts'], params: {}, porId: '/accounts/', sql: 'SELECT id, source, managed_by_app FROM accounts' },
  ]

  /** La lista de conocidas, o el texto de por qué no vale. Se lee en cada `lanzar` y `recuento`, nunca al arrancar (una lista rota no tumba la App). */
  function listaValida(): ListaConocidas | string {
    try { return cargarConocidas(leerLista()) } catch (e) { return `lista: ${e instanceof ErrorLista ? e.message.replace(/^lista: /, '') : 'no se pudo leer'}` }
  }

  /** Abre el informe de la pasada y los accesos de sólo lectura. El registro de escrituras ES el del informe; las peticiones se cuentan por entidad. */
  function abrirContexto(e: EstadoVerificacion, lista: ListaConocidas): Contexto {
    const informe = (e.informe = informeInicial(lista, departmentId))
    const get = soloGet(zohoFetch, informe.escriturasRechazadas)
    const ctx: Contexto = {
      lista, informe, entidad: 'tickets', pedidas: 0, clases: [], lee: soloSelect(db, informe.escriturasRechazadas),
      f: async (path, init) => {
        if (ctx.pedidas++ > 0) await dormir(pausaMs)
        const en = informe.entidades[ctx.entidad]
        en.peticiones++; informe.peticiones++
        const res = await get(path, init)
        if (res.status === 429) { en.vistos429++; informe.vistos429++ }
        return res
      },
    }
    return ctx
  }

  /** Una entidad global (D7): sus listas contra Desk en las dos direcciones, y cada ausente de Desk pedido por id antes de clasificarlo. */
  async function entidadA(ctx: Contexto, s: Espec): Promise<'corte' | void> {
    const { f, lee, informe, lista } = ctx
    const en = informe.entidades[s.entidad]
    ctx.entidad = s.entidad
    const zoho = new Map<string, number | undefined>()
    for (const ruta of s.rutas) {
      const r = await leerPaginas(f, ruta, s.params, PAGINA, { pausa429Ms })
      if (r.estado === 'corte') return 'corte'
      if (r.estado === 'error') { en.motivo = r.motivo; if (s.entidad === 'tickets') for (const x of POR_TICKET) informe.entidades[x].motivo = 'sin lista de tickets'; return }
      for (const it of r.items) zoho.set(String(it.id), s.entidad === 'tickets' ? entero(it.ticketNumber) : undefined)
    }
    const desk = (await filas(lee, s.sql)).map(aFilaDesk)
    const delDesk = new Map(desk.map((d) => [d.id, d]))
    const c = compararIds([...zoho.keys()], [...delDesk.keys()])
    const esApp = (id: string) => s.entidad === 'tickets' && id.startsWith('app-')
    const noEsta = new Set<string>(); const huecos: string[] = []
    // Un ticket `app-` no tiene id de Zoho: no se pide por id; sólo lo explica la regla (RQ-ZS-35).
    for (const id of c.faltaEnZoho.filter((x) => !esApp(x))) { const r = await leerPorId(f, `${s.porId}${id}`, { pausa429Ms }); if (r.estado === 'corte') return 'corte'; if (r.estado === 'noEsta') noEsta.add(id); else if (r.estado === 'vivo') huecos.push(id); else informe.errores.push({ entidad: s.entidad, numero: delDesk.get(id)?.numero, id, motivo: r.motivo }) }
    const filaDe = (d: FilaDiferencia): Fila => {
      const k = clasificar(lista, d) as Clasificacion
      ctx.clases.push(k)
      if (k.clase === 'conocida') en.conocidas++; else en.sinExplicar++
      return { id: d.id, numero: d.numero, clase: k.clase, causa: k.causa, entrada: k.entrada, heredadaDe: k.heredadaDe }
    }
    en.faltaEnDesk = c.faltaEnDesk.map((id) => filaDe({ entidad: s.entidad, lado: 'faltaEnDesk', id, numero: zoho.get(id) }))
    en.faltaEnZoho = c.faltaEnZoho.filter((id) => esApp(id) || noEsta.has(id)).map((id) => {
      const d = delDesk.get(id)
      return filaDe({ entidad: s.entidad, lado: 'faltaEnZoho', id, numero: d?.numero, fuente: d?.fuente, managedByApp: d?.managedByApp })
    })
    en.huecosDeLista = huecos.map((id) => ({ id, numero: delDesk.get(id)?.numero }))
    Object.assign(en, { enZoho: zoho.size, enDesk: desk.length, casan: c.casan })
    en.estado = veredictoEntidad({ sinComparar: false, errores: informe.errores.filter((x) => x.entidad === s.entidad).length, completa: true, sinExplicar: en.sinExplicar })
    delete en.motivo
    if (s.entidad === 'tickets') informe.cobertura.aComparar = c.casan + huecos.length
  }

  /** Fase A (D7): tickets (departamento y archivados), contactos y cuentas. Un `429` agotado corta; se reanuda relanzando sin `desde`, que la rehace entera. */
  async function faseA(e: EstadoVerificacion, ctx: Contexto = abrirContexto(e, cargarConocidas(leerLista()))): Promise<void> {
    for (const s of ESPECS) {
      if (await entidadA(ctx, s) === 'corte') { ctx.informe.cortadoEn = { fase: 'A', numero: null }; ctx.informe.motivoCorte = '429'; return }
    }
    ctx.informe.conocidasSinUso = conocidasSinUso(ctx.lista, ctx.clases)
  }

  async function pasada(lista: ListaConocidas): Promise<void> {
    estado.inicio = new Date().toISOString(); estado.fase = 'A'
    try {
      await faseA(estado, abrirContexto(estado, lista))
    } catch (e) {
      estado.error = e instanceof ErrorBase ? 'base' : 'interno'
    } finally {
      const i = estado.informe
      if (i) {
        i.veredicto = veredictoGlobal(ENTIDADES.map((x) => i.entidades[x].estado), { completa: i.cobertura.completa, cortadoEn: i.cortadoEn, escriturasRechazadas: i.escriturasRechazadas.total })
        if (i.escriturasRechazadas.total > 0) estado.error ??= 'escritura'
      }
      estado.fase = null; estado.enMarcha = false; estado.terminado = true; estado.fin = new Date().toISOString()
      try { registrar(structuredClone(estado)) } catch { /* el resumen no puede tumbar la pasada */ }
    }
  }

  return {
    /** Lanza la pasada en segundo plano y devuelve ya. `enMarcha` va ANTES del primer `await`; con una en marcha o la lista inválida, no lanza. */
    lanzar({ desde, limite }: { desde?: number; limite?: number } = {}): { lanzada: boolean; estado: EstadoVerificacion } {
      if (estado.enMarcha) return { lanzada: false, estado: structuredClone(estado) }
      const lista = listaValida()
      if (typeof lista === 'string') { estado = { ...estadoInicial(), error: lista }; return { lanzada: false, estado: structuredClone(estado) } }
      estado = { ...estadoInicial(), enMarcha: true, desde: desde ?? null, limite: limite ?? null }
      void pasada(lista)
      return { lanzada: true, estado: structuredClone(estado) }
    },
    /** `limite=0`: lo que hay en Desk y las peticiones mínimas, sin Zoho ni escritura. No da veredictos. */
    async recuento({ desde }: { desde?: number } = {}): Promise<RecuentoVerificacion> {
      const sel = soloSelect(db)
      const lista = listaValida()
      const n = async (sql: string, params?: unknown[]) => Number((await filas(sel, sql, params))[0]?.n ?? 0)
      const desk = Object.fromEntries(await Promise.all(ENTIDADES.map(async (e) => [e, await n(`SELECT COUNT(*) AS n FROM ${TABLAS[e]}`)]))) as Record<Entidad, number>
      const porComparar = await n("SELECT COUNT(*) AS n FROM tickets WHERE id NOT LIKE 'app-%' AND number >= $1", [desde ?? 0])
      const paginas = (total: number) => Math.max(1, Math.ceil(total / PAGINA))
      return {
        lista: typeof lista === 'string' ? { error: lista } : { version: lista.version }, desde: desde ?? null, desk,
        appNacidos: await n("SELECT COUNT(*) AS n FROM tickets WHERE id LIKE 'app-%'"), porComparar,
        bytesAdjuntos: await n('SELECT COALESCE(SUM(size), 0) AS n FROM attachments'),
        peticionesMinimas: paginas(desk.tickets) + 1 + paginas(desk.contactos) + paginas(desk.cuentas) + 3 * porComparar,
      }
    },
    estado(): EstadoVerificacion { return structuredClone(estado) },
  }
}
