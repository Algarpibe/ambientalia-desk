import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS } from '@ambientalia/zoho-sync/conversaciones'
import { logger } from '../util/logger'
import { ErrorDisco, estadoCopia } from '../adjuntos/almacen'
import { cargarConocidas, ENTIDADES, ErrorLista, leerLista as leerListaReal, type Entidad, type ListaConocidas } from './conocidas'
import { clasificar, conocidasSinUso, type Clasificacion, type FilaDiferencia, type Lado, type Padre } from './clasificar'
import { compararIds } from './comparar'
import { leerPaginas, leerPorId } from './lectores'
import { ErrorBase, filas, hijosSoloDesk, porTicket, type DiferenciaHijo, type ResultadoPorTicket } from './porTicket'
import { crearRegistroEscrituras, soloGet, soloSelect, type RegistroEscrituras } from './soloLectura'
import { peorEstado, veredictoEntidad, veredictoGlobal, type CorteVerificacion, type Estado } from './veredicto'

/**
 * verificacion-completitud (1G-03, D7, D10, D11, RQ-ZS-35, RQ-ZS-37) · el motor: estado en memoria, fase A (listas globales con re-verificación
 * por id), `lanzar`, `recuento` (`limite=0`) y `estado`. Molde: `apps/desk/server/adjuntos/rellenoAdjuntos.ts` (`enMarcha` antes del primer `await`,
 * `structuredClone`, una línea de log). Zoho, sólo por `soloGet`; PostgreSQL, sólo por `soloSelect`; el motor NO recibe `sync`, cuyas listas escriben
 * mientras leen. El estado, el informe y el log llevan sólo ids, números de ticket y recuentos (CA-11): nunca nombres, correos, asuntos ni `raw`.
 * Fase B (por ticket, `porTicket.ts`), fase C (el volumen, con `estadoCopia`, sin descargar) y continuación del corte de la B (D9, D10, RQ-ZS-36, RQ-ZS-38).
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export interface Fila { id: string; numero?: number; clase: 'conocida' | 'sin explicar'; causa?: string; entrada?: string; heredadaDe?: string; tamano?: { zoho: number | null; desk: number | null } }
export interface InformeEntidad {
  estado: Estado; motivo?: string; enZoho: number; enDesk: number; casan: number; sinExplicar: number; conocidas: number
  faltaEnDesk: Fila[]; faltaEnZoho: Fila[]; huecosDeLista: { id: string; numero?: number }[]; noEvaluados: Omit<Fila, 'id'>[]
  peticiones: number; vistos429: number
  /** Sólo en adjuntos (fase B): los de otro `size` y los bytes por lado de lo comparado. */
  distintoTamano?: Fila[]; bytes?: { zoho: number; desk: number }
  /** Sólo en adjuntos (fase C): `desk.attachments` frente al volumen. */
  volumen?: { estado: Estado; motivo?: string; filas: number; sinCopia: Fila[]; ausente: Fila[]; otroTamano: Fila[] }
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
  /** `dirAdjuntos(...)`: lo usa la fase C; nulo ⇒ el volumen queda «sin comparar». `fs`, sólo para las pruebas. */
  dir: string | null; fs?: Parameters<typeof estadoCopia>[2]
  leerLista?: () => string; pausaMs?: number; pausa429Ms?: number
  registrar?: (r: EstadoVerificacion) => void
}

const PAGINA = 100
const POR_TICKET: Entidad[] = ['conversaciones', 'adjuntos', 'historia']
const TABLAS = { tickets: 'tickets', conversaciones: 'conversations', adjuntos: 'attachments', historia: 'ticket_history', contactos: 'contacts', cuentas: 'accounts' } as const
/** Una entidad global: sus listas de Zoho, su consulta de Desk y la ruta para pedir un id suelto. */
interface Espec { entidad: Entidad; rutas: string[]; params: Record<string, string>; porId: string; sql: string }
interface FilaDesk { id: string; numero?: number; fuente?: string | null; managedByApp?: boolean }
/** `paraB`: los tickets de los dos lados por número; `distintos`: los de un solo lado, con su clase (los pasa la A a la B). */
interface Contexto {
  f: ZohoFetch; lee: Queryable; lista: ListaConocidas; informe: Informe; entidad: Entidad; pedidas: number; clases: Clasificacion[]
  paraB: { id: string; numero: number }[]; distintos: { id: string; numero?: number; lado: Lado; k: Clasificacion }[]
  /** El `desde` con que ARRANCÓ la pasada (una continuación hereda el de la original) y si los tickets de un solo lado ya se procesaron. */
  desdeInicial: number | null; sinParHecho: boolean
}
/** Lo que se guarda de la última pasada cortada en la B: su contexto (listas de la A, tickets por comparar, informe parcial) y el ticket por el que seguir. */
interface Retenida { numero: number; ctx: Contexto }

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

const porId = (a: string, b: string): number => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)
const aFilaDesk = (r: Record<string, unknown>): FilaDesk => ({ id: String(r.id), numero: entero(r.number), fuente: r.source as string | null | undefined, managedByApp: r.managed_by_app === true })

/** El resumen de la pasada va al logger como UNA línea: estados, recuentos, corte y veredicto; ningún id. */
const registrarEnLog = (r: EstadoVerificacion) => {
  const i = r.informe
  const entidades = i ? Object.fromEntries(ENTIDADES.map((e) => [e, { estado: i.entidades[e].estado, enZoho: i.entidades[e].enZoho, enDesk: i.entidades[e].enDesk, sinExplicar: i.entidades[e].sinExplicar, conocidas: i.entidades[e].conocidas }])) : null
  logger.info({ resumen: { error: r.error, veredicto: i?.veredicto, cortadoEn: i?.cortadoEn, escriturasRechazadas: i?.escriturasRechazadas, peticiones: i?.peticiones, vistos429: i?.vistos429, entidades } },
    `verificacion-completitud: ${i?.veredicto ?? 'sin informe'}${i?.cortadoEn ? `, cortada en la fase ${i.cortadoEn.fase}` : ''}`)
}

export function crearVerificacionCompletitud({
  zohoFetch, db, departmentId, dir, fs, leerLista = leerListaReal, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS, registrar = registrarEnLog,
}: DepsVerificacion) {
  let estado = estadoInicial()
  let retenida: Retenida | null = null
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
      lista, informe, entidad: 'tickets', pedidas: 0, clases: [], lee: soloSelect(db, informe.escriturasRechazadas), paraB: [], distintos: [], desdeInicial: e.desde, sinParHecho: false,
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
      if (s.entidad === 'tickets') ctx.distintos.push({ id: d.id, numero: d.numero, lado: d.lado, k })
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
    if (s.entidad !== 'tickets') return
    informe.cobertura.aComparar = c.casan + huecos.length
    const presentes = new Set([...zoho.keys()].concat(huecos))
    ctx.paraB = desk.filter((d) => presentes.has(d.id)).map((d) => ({ id: d.id, numero: d.numero ?? 0 })).sort((a, b) => a.numero - b.numero || porId(a.id, b.id))
  }

  /** Fase A (D7): tickets (departamento y archivados), contactos y cuentas. Un `429` agotado corta; se reanuda relanzando sin `desde`, que la rehace entera. */
  async function faseA(e: EstadoVerificacion, ctx: Contexto = abrirContexto(e, cargarConocidas(leerLista()))): Promise<void> {
    for (const s of ESPECS) {
      if (await entidadA(ctx, s) === 'corte') { ctx.informe.cortadoEn = { fase: 'A', numero: null }; ctx.informe.motivoCorte = '429'; return }
    }
  }

  /** Clasifica los hijos de un ticket (D3): la conversación «falta en Zoho» pasa su clase a sus adjuntos y el ticket de un solo lado, la suya a todos. */
  function clasificarHijos(ctx: Contexto, numero: number | undefined, difs: DiferenciaHijo[], padreTicket?: Padre): void {
    const convs = new Map<string, Padre>()
    for (const d of difs) {
      const padres = [convs.get(d.conversacionId ?? ''), padreTicket].filter((p): p is Padre => p !== undefined)
      const k = clasificar(ctx.lista, { entidad: d.entidad, lado: d.lado, id: d.id, numero, fuente: d.fuente, ausenteEnZoho: d.ausenteEnZoho, padres }) as Clasificacion
      ctx.clases.push(k)
      const en = ctx.informe.entidades[d.entidad]
      if (k.clase === 'conocida') en.conocidas++; else en.sinExplicar++
      const fila: Fila = { id: d.id, numero, clase: k.clase, causa: k.causa, entrada: k.entrada, heredadaDe: k.heredadaDe, tamano: d.tamano }
      if (d.lado === 'faltaEnDesk') en.faltaEnDesk.push(fila); else if (d.lado === 'faltaEnZoho') en.faltaEnZoho.push(fila); else en.distintoTamano?.push(fila)
      if (d.entidad === 'conversaciones' && d.lado === 'faltaEnZoho') convs.set(d.id, { etiqueta: `conversaciones:${d.id}`, lado: 'faltaEnZoho', clasificacion: k })
    }
  }

  /** Los tickets de un solo lado, sin pedir nada a Zoho: los hijos del que sólo está en Desk heredan su clase; del que sólo está en Zoho, `noEvaluados`. */
  async function sinPar(ctx: Contexto): Promise<void> {
    for (const d of ctx.distintos) {
      if (d.lado === 'faltaEnDesk') {
        for (const x of POR_TICKET) {
          const en = ctx.informe.entidades[x]
          en.noEvaluados.push({ numero: d.numero, clase: d.k.clase, causa: d.k.causa, entrada: d.k.entrada, heredadaDe: `tickets:${d.numero ?? d.id}` })
          if (d.k.clase === 'conocida') en.conocidas++; else en.sinExplicar++
        }
        continue
      }
      const difs = await hijosSoloDesk(ctx.lee, d.id)
      for (const x of difs) ctx.informe.entidades[x.entidad].enDesk++
      clasificarHijos(ctx, d.numero, difs, { etiqueta: `tickets:${d.numero ?? d.id}`, lado: 'faltaEnZoho', clasificacion: d.k })
    }
  }

  /** Suma el resultado de un ticket terminado al informe: errores, recuentos, bytes y diferencias. Sólo se llama si `porTicket` no cortó. */
  function volcar(ctx: Contexto, numero: number, r: Extract<ResultadoPorTicket, { tipo: 'ok' }>): void {
    const { informe: i } = ctx
    for (const x of r.errores) i.errores.push({ entidad: x.entidad, numero, motivo: x.motivo })
    for (const x of POR_TICKET) {
      const c = r.conteo[x as keyof typeof r.conteo]; const en = i.entidades[x]
      if (c) Object.assign(en, { enZoho: en.enZoho + c.enZoho, enDesk: en.enDesk + c.enDesk, casan: en.casan + c.casan })
    }
    if (i.entidades.adjuntos.bytes) { i.entidades.adjuntos.bytes.zoho += r.bytes.zoho; i.entidades.adjuntos.bytes.desk += r.bytes.desk }
    clasificarHijos(ctx, numero, r.difs)
  }

  /** Fase B (D8): por cada ticket de los dos lados desde `desde`, hasta `limite` tickets; un `429` agotado corta y deja ese ticket entero sin publicar. */
  async function faseB(e: EstadoVerificacion, ctx: Contexto): Promise<void> {
    const i = ctx.informe
    i.cobertura.desde = ctx.desdeInicial; i.cortadoEn = null; delete i.motivoCorte
    if (!ctx.sinParHecho) { Object.assign(i.entidades.adjuntos, { bytes: { zoho: 0, desk: 0 }, distintoTamano: [] }); await sinPar(ctx); ctx.sinParHecho = true }
    const antes = i.cobertura.comparados
    const acceso = { f: ctx.f, lee: ctx.lee, pausa429Ms, entidad: (x: Entidad) => { ctx.entidad = x } }
    for (const t of ctx.paraB.filter((x) => x.numero >= (e.desde ?? 0))) {
      if (e.limite !== null && i.cobertura.comparados - antes >= e.limite) { i.cortadoEn = { fase: 'B', numero: t.numero }; i.motivoCorte = 'limite'; break }
      const r = await porTicket(acceso, t)
      if (r.tipo === 'corte') { i.cortadoEn = { fase: 'B', numero: t.numero }; i.motivoCorte = '429'; break }
      i.cobertura.comparados++
      volcar(ctx, t.numero, r)
      i.cobertura.hasta = t.numero
    }
    for (const x of POR_TICKET) {
      const en = i.entidades[x]
      en.estado = veredictoEntidad({ sinComparar: false, errores: i.errores.filter((y) => y.entidad === x).length, completa: i.cortadoEn === null && ctx.desdeInicial === null, sinExplicar: en.sinExplicar })
      delete en.motivo
    }
  }

  /** Fase C (D9): cada fila de `desk.attachments` frente al volumen con `estadoCopia` (sólo `stat`, nada se descarga). Sin `dir` o con un fallo de disco, «sin comparar». */
  async function faseC(ctx: Contexto): Promise<boolean> {
    const a = ctx.informe.entidades.adjuntos
    const v = (a.volumen = { estado: 'sin comparar' as Estado, filas: 0, sinCopia: [], ausente: [], otroTamano: [] } as NonNullable<InformeEntidad['volumen']>)
    try {
      if (dir === null) v.motivo = 'ADJUNTOS_DIR'
      else await volumen(ctx, dir, v)
    } catch (e) {
      if (!(e instanceof ErrorDisco)) throw e
      Object.assign(v, { motivo: `disco ${e.code}`, filas: 0, sinCopia: [], ausente: [], otroTamano: [] })
    }
    a.estado = peorEstado([a.estado, v.estado])
    return v.estado !== 'sin comparar'
  }

  /** Sólo publica si TODAS las filas se pudieron mirar: un `ErrorDisco` a mitad deja el volumen sin filas parciales y sin sus clases. */
  async function volumen(ctx: Contexto, dir: string, v: NonNullable<InformeEntidad['volumen']>): Promise<void> {
    const clases: Clasificacion[] = []
    const lista = await filas(ctx.lee, 'SELECT a.id, a.size, a.storage_path, t.number FROM attachments a JOIN tickets t ON t.id = a.ticket_id ORDER BY t.number, a.id')
    for (const r of lista) {
      const fila = { id: String(r.id), size: r.size as number | string | null, storage_path: r.storage_path as string | null }
      const e = await estadoCopia(dir, fila, fs)
      if (e === 'presente') continue
      const k = clasificar(ctx.lista, { entidad: 'adjuntos', lado: 'volumen', id: fila.id, numero: entero(r.number) }) as Clasificacion
      clases.push(k)
      v[e].push({ id: fila.id, numero: entero(r.number), clase: k.clase, causa: k.causa, entrada: k.entrada, heredadaDe: k.heredadaDe })
    }
    ctx.clases.push(...clases)
    Object.assign(v, { filas: lista.length, estado: veredictoEntidad({ sinComparar: false, errores: 0, completa: true, sinExplicar: clases.filter((k) => k.clase === 'sin explicar').length }) })
    delete v.motivo
  }

  /** Orden fijo (D11): errores por entidad, número e id; hijos por id (longitud y luego texto); `noEvaluados` por número. */
  function ordenar(i: Informe): void {
    i.errores.sort((a, b) => ENTIDADES.indexOf(a.entidad) - ENTIDADES.indexOf(b.entidad) || (a.numero ?? Infinity) - (b.numero ?? Infinity) || porId(a.id ?? '', b.id ?? ''))
    for (const x of POR_TICKET) {
      const en = i.entidades[x]
      for (const l of [en.faltaEnDesk, en.faltaEnZoho, en.distintoTamano ?? []]) l.sort((a, b) => porId(a.id, b.id))
      en.noEvaluados.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    }
    const vol = i.entidades.adjuntos.volumen
    if (vol) for (const l of [vol.sinCopia, vol.ausente, vol.otroTamano]) l.sort((a, b) => porId(a.id, b.id))
  }

  /** Con `previa` (D10) CONTINÚA la pasada cortada en la B: sin repetir la A, sigue por el ticket del corte, corre la C y funde las filas en el mismo informe. */
  async function pasada(lista: ListaConocidas, previa: Retenida | null): Promise<void> {
    estado.inicio = new Date().toISOString(); estado.fase = 'A'
    let ctx = previa?.ctx; let hechaA = false; let hechaB = false; let hechaC = false
    try {
      if (ctx) estado.informe = ctx.informe
      else { ctx = abrirContexto(estado, lista); await faseA(estado, ctx) }
      hechaA = previa !== null || ctx.informe.cortadoEn === null
      if (hechaA && ctx.informe.entidades.tickets.estado !== 'sin comparar') { estado.fase = 'B'; await faseB(estado, ctx); hechaB = ctx.informe.cortadoEn === null }
      if (ctx.informe.cortadoEn === null) { estado.fase = 'C'; hechaC = await faseC(ctx) }
      if (ctx.informe.cortadoEn === null && ctx.desdeInicial === null) ctx.informe.conocidasSinUso = conocidasSinUso(ctx.lista, ctx.clases)
    } catch (e) {
      estado.error = e instanceof ErrorBase ? 'base' : 'interno'
    } finally {
      const i = estado.informe
      if (i) {
        ordenar(i)
        const desdeInicial = ctx ? ctx.desdeInicial : estado.desde
        Object.assign(i.cobertura, { completa: hechaA && desdeInicial === null && hechaB && hechaC })
        i.veredicto = veredictoGlobal(ENTIDADES.map((x) => i.entidades[x].estado), { completa: i.cobertura.completa, cortadoEn: i.cortadoEn, escriturasRechazadas: i.escriturasRechazadas.total })
        if (i.escriturasRechazadas.total > 0) estado.error ??= 'escritura'
        if (ctx && !estado.error && i.cortadoEn?.fase === 'B' && i.cortadoEn.numero !== null) retenida = { numero: i.cortadoEn.numero, ctx }
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
      const previa = desde !== undefined && retenida?.numero === desde ? retenida : null; retenida = null /* sin `desde` o con otro, la parte guardada se descarta */
      estado = { ...estadoInicial(), enMarcha: true, desde: desde ?? null, limite: limite ?? null }
      void pasada(lista, previa)
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
