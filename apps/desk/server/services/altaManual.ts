import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { PREFIJO_PROVISIONAL, CAMPOS_COMERCIALES_RESTRINGIDOS, serialesCoinciden, type EquipoLite } from '@ambientalia/shared'
import { getModelo } from '../db/catalogo'
import { getEquipoBySerial, createEquipo } from '../db/equipos'
import { camposHojaDeVida } from '../routes/equipos'
import { HttpError } from '../util/httpError'
import type { EquipoAResolver } from './equipoNuevo'

/**
 * Alta manual de equipo y cliente desconocidos (F1B-15, RQ-TC-30, RQ-TC-31, RQ-HV-16, RQ-HV-17, C-1).
 * Módulo propio para no insertar líneas en `ticketService.ts` (regla de mutación 4): allí sólo hay llamadas en
 * líneas que ya existían. Escalones de la escalera A < B < C < D (F1B-10): `exigirEquipoManual` y
 * `exigirClienteProvisional` son A (presencia y existencia), `validarContenidoAltaManual` es C y la escritura
 * va al final, dentro de la transacción de `crearTicketConEquipo`. Nada de aquí escribe en Zoho ni en `books.*`.
 */

/** Los cinco datos del cliente provisional y el motivo (D1), ya recortados y con el id que tendrá. */
export interface ClienteProvisionalNuevo {
  id: string; razonSocial: string; nit: string; contacto: string; telefono: string; correo: string; motivo: string
}

/** `EquipoAResolver` del alta; `motivo` sólo viene en el equipo manual y es lo que lo distingue del de «Equipo nuevo». */
export type EquipoAResolverManual = EquipoAResolver & { motivo?: string }

/** Lo que `crearTicketConEquipo` escribe antes del ticket: el provisional y la traza del equipo manual. */
export interface AltaManual {
  cliente: ClienteProvisionalNuevo | null
  /** Motivo del equipo manual, o `null` si el equipo no es manual (o ya existía). */
  motivoEquipo: string | null
  actor: { id: string; nombre: string }
}

const texto = (v: unknown): string => (v === undefined || v === null ? '' : String(v).trim())
const objeto = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

/** Escalón A · el cliente provisional: los cinco datos y el motivo, todos o `422` listando los que faltan. `null` si no es modo manual. */
export function exigirClienteProvisional(b: Record<string, unknown>): ClienteProvisionalNuevo | null {
  if (b.clienteManual === undefined || b.clienteManual === null) return null
  const c = objeto(b.clienteManual)
  const etiquetas: Array<[string, string]> = [
    ['razonSocial', 'la razón social'], ['nit', 'el NIT'], ['contacto', 'el contacto'],
    ['telefono', 'el teléfono'], ['correo', 'el correo'], ['motivo', 'el motivo'],
  ]
  const faltan = etiquetas.filter(([k]) => !texto(c[k])).map(([, etiqueta]) => etiqueta)
  if (faltan.length) throw new HttpError(422, { error: `Faltan datos del cliente provisional: ${faltan.join(', ')}` })
  return {
    id: PREFIJO_PROVISIONAL + randomUUID(), razonSocial: texto(c.razonSocial), nit: texto(c.nit),
    contacto: texto(c.contacto), telefono: texto(c.telefono), correo: texto(c.correo), motivo: texto(c.motivo),
  }
}

/**
 * Escalón A · el equipo manual: serial, su confirmación, modelo del catálogo o («no catalogado») marca, texto y tipo,
 * y motivo; en «Equipo nuevo» también la fecha de factura (C-1). Si el serial ya existe se reutiliza ese equipo
 * (gesto de `equipoNuevo.ts:46-47`). La COMPARACIÓN del serial con su confirmación no es de aquí: es C.
 */
export async function exigirEquipoManual(db: Queryable, b: Record<string, unknown>): Promise<EquipoAResolverManual> {
  const em = objeto(b.equipoManual)
  const serial = texto(em.serial)
  const modeloId = texto(em.modeloId)
  const faltan: string[] = []
  if (!serial) faltan.push('el serial')
  if (!texto(em.confirmacionSerial)) faltan.push('la confirmación del serial')
  if (!modeloId) {
    if (!texto(em.marca)) faltan.push('la marca')
    if (!texto(em.modeloTexto)) faltan.push('el modelo (del catálogo o el texto de «no catalogado»)')
    if (!texto(em.tipo)) faltan.push('el tipo')
  }
  if (!texto(em.motivo)) faltan.push('el motivo')
  const enEquipoNuevo = b.clasificaciones === 'Equipo nuevo'
  if (enEquipoNuevo && !texto(em.fechaFacturaCompra)) faltan.push('la fecha de factura de compra')
  if (faltan.length) throw new HttpError(422, { error: `Faltan datos del equipo manual: ${faltan.join(', ')}` })

  const modelo = modeloId ? await getModelo(db, modeloId) : null
  if (modeloId && !modelo) throw new HttpError(422, { error: 'Modelo no encontrado' })
  const motivo = texto(em.motivo)
  const existente = await getEquipoBySerial(db, serial)
  if (existente) return { equipo: existente, datos: null, motivo }

  const marca = modelo ? modelo.marca : texto(em.marca)
  const nombre = modelo ? modelo.nombre : texto(em.modeloTexto)
  const tipo = modelo ? modelo.tipo : texto(em.tipo)
  const nuevo: EquipoLite = { id: '', serial, marca, modelo: nombre, tipo: tipo ?? undefined }
  return {
    equipo: nuevo, motivo,
    datos: { serial, marca, modelo: nombre, tipo, modeloId: modeloId || null, fechaFacturaCompra: enEquipoNuevo ? texto(em.fechaFacturaCompra) : null, pendienteValidar: true },
  }
}

const RESERVADOS: Record<string, string> = { fechaFacturaCompra: 'la fecha de factura de compra', finGarantia: 'el fin de garantía', mantenedorId: 'el mantenedor' }

/**
 * Escalón C · contenido del alta manual, tras los obligatorios y el cliente (`ticketService.ts:91`) y antes de la
 * cuarentena, el vencido y el `409` de la OV (`:96`, D). Serial ≠ confirmación; los tres campos reservados a Comercial
 * (RQ-HV-17), salvo la fecha de factura en «Equipo nuevo», que sigue obligatoria (C-1) y debe ser una fecha válida; y
 * el provisional nuevo junto con `clientId` o con orden de venta.
 */
export async function validarContenidoAltaManual(
  db: Queryable, b: Record<string, unknown>, prov: ClienteProvisionalNuevo | null, nuevo: EquipoAResolverManual | null, clasificaciones: string,
): Promise<void> {
  if (nuevo?.motivo) {
    const em = objeto(b.equipoManual)
    if (!serialesCoinciden(em.serial, em.confirmacionSerial)) throw new HttpError(422, { error: 'El serial y su confirmación no coinciden' })
    const enEquipoNuevo = clasificaciones === 'Equipo nuevo'
    const reservados = CAMPOS_COMERCIALES_RESTRINGIDOS.filter((k) => texto(em[k]) && !(enEquipoNuevo && k === 'fechaFacturaCompra'))
    if (reservados.length) {
      throw new HttpError(422, { error: `El alta manual no admite ${reservados.map((k) => RESERVADOS[k]).join(', ')}: los completa Comercial después` })
    }
    if (enEquipoNuevo) {
      const fecha = await camposHojaDeVida(db, { fechaFacturaCompra: texto(em.fechaFacturaCompra) })
      if ('error' in fecha) throw new HttpError(422, { error: fecha.error })
    }
  }
  if (prov && b.clientId) throw new HttpError(422, { error: 'Un cliente provisional no se combina con un cliente existente' })
  if (prov && (b.ordenVenta || b.salesOrderId)) throw new HttpError(422, { error: 'Un cliente provisional no se combina con una orden de venta' })
}

/** El `manual` que recibe `crearTicketConEquipo`: `null` si no hay provisional ni equipo manual que escribir. */
export function altaManualDe(prov: ClienteProvisionalNuevo | null, nuevo: EquipoAResolverManual | null, actorId: string | undefined, actorNombre: string): AltaManual | null {
  const motivoEquipo = nuevo?.motivo ?? null
  if (!prov && !motivoEquipo) return null
  return { cliente: prov, motivoEquipo, actor: { id: actorId ?? '', nombre: actorNombre } }
}

/**
 * Las escrituras previas al ticket, DENTRO de la transacción de `crearTicketConEquipo` (RQ-TC-31): el provisional, el
 * equipo (pendiente de validar) y su fila de traza `altaManual` en `equipos_cambios` (D6). Devuelve el `equipoId` que
 * lleva el ticket. Con equipo registrado o reutilizado no escribe equipo ni traza.
 */
export async function escribirAltaManual(
  q: Queryable, manual: AltaManual, nuevo: EquipoAResolver | null, clienteNombre: string | null, clientId: string, equipoIdActual: string | null,
): Promise<string | null> {
  const { cliente, motivoEquipo, actor } = manual
  if (cliente) {
    await q.query(
      `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo, creado_por_id, creado_por_nombre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [cliente.id, cliente.razonSocial, cliente.nit, cliente.contacto, cliente.telefono, cliente.correo, cliente.motivo, actor.id, actor.nombre],
    )
  }
  if (!nuevo || nuevo.equipo.id) return equipoIdActual
  const equipoId = await createEquipo(q, { ...nuevo.datos!, clienteNombre, clientId })
  if (motivoEquipo) {
    await q.query(
      `INSERT INTO public.equipos_cambios (equipo_id,campo,valor_anterior,valor_nuevo,usuario_id,usuario_nombre) VALUES ($1,'altaManual',NULL,$2,$3,$4)`,
      [equipoId, motivoEquipo, actor.id, actor.nombre],
    )
  }
  return equipoId
}
