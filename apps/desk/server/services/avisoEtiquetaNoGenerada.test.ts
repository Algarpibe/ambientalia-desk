import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'
import { createRemision } from '../db/remisiones'
import * as avisosDb from '../db/avisos'
import { logger } from '../util/logger'
import { db, instalarArnes, appWith } from '../testing/appHarness'
import { textoAvisoSinEtiqueta } from './avisoEtiquetaNoGenerada'

vi.mock('../db/avisos', async (original) => {
  const orig = await original<typeof import('../db/avisos')>()
  return { ...orig, crearAviso: vi.fn(orig.crearAviso) }
})
instalarArnes()

/**
 * F1B-04 (`rotulado-tras-enviar`) · lote 2 · RQ-AV-22 (AV22-a…m, AV22-t): el aviso de «la etiqueta no se generó».
 * Todo por la ruta del callback de n8n. Regla (datos del analista leídos en el flujo el 2026-10-12, segunda mano,
 * hipótesis): estado `ok`/`ok_con_avisos` Y `resultado.dymoId` vacío; nunca por el texto de `avisos[].paso`.
 * pg-mem no revierte un ROLLBACK (`apps/desk/server/db/transaccion.test.ts:25`), así que «no queda marca» de AV22-l se
 * afirma por la estructura (marca y avisos en la misma transacción), no por filas.
 */
const TOKEN = 'secreto-cb'
let n = 0
const usuario = async (o: { cargoPermiso?: 'Director Técnico'; area?: boolean; admin?: boolean; activo?: boolean } = {}) => {
  n++
  const rol = o.area ? await createRole(db, { name: `ST-${n}`, areas: ['Servicio Técnico'] }) : null
  if (rol) await actualizarRecibeAvisos(db, rol.id, true)
  const u = await createUser(db, { email: `u${n}@x.co`, name: `U${n}`, passwordHash: 'h', roleId: rol?.id ?? null, cargoPermiso: o.cargoPermiso ?? null, isAdmin: o.admin ?? false })
  if (o.activo === false) await db.query('UPDATE users SET active = false WHERE id = $1', [u.id])
  return u.id
}
const ticket = (id = 't1', num = 1234) => db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, num, 's', 'Ingresado'])
const remision = async (o: { enviadoPor?: string | null; serial?: string | null; ticketId?: string | null } = {}) => {
  const id = await createRemision(db, { ticketId: 't1', fecha: '2026-10-12', tipoServicio: null, perfil: null, equipoId: null, serial: o.serial === undefined ? 'ABC123' : o.serial, incluye: [], observaciones: null, creadoPor: null, empresa: null, personaContacto: null, hayNovedad: null, recepcion: null })
  if (o.ticketId === null) await db.query('UPDATE remisiones SET ticket_id = NULL WHERE id = $1', [id])
  if (o.enviadoPor) await db.query('UPDATE remisiones SET enviado_por_id = $2 WHERE id = $1', [id, o.enviadoPor])
  return id
}
const cb = (app: import('express').Express, id: string, body: object) => request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', TOKEN).send(body)
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at, id')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marca = async (id: string) => (await db.query('SELECT aviso_sin_etiqueta_at AS m FROM remisiones WHERE id = $1', [id])).rows[0].m
const app = () => appWith({ remisionCallbackToken: TOKEN }).app

describe('AV22-a · las formas de vacío avisan', () => {
  it('ok_con_avisos con dymoId ausente, null y cadena vacía, y ok sin resultado: cada una crea su aviso con el ticket y enviado_at NULL', async () => {
    const dt = await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app()
    const cuerpos: object[] = [{ estado: 'ok_con_avisos', resultado: { pdfId: 'p' } }, { estado: 'ok_con_avisos', resultado: { dymoId: null } }, { estado: 'ok_con_avisos', resultado: { dymoId: '' } }, { estado: 'ok' }]
    for (const c of cuerpos) { const id = await remision(); expect((await cb(a, id, c)).status).toBe(200); expect(await marca(id), JSON.stringify(c)).not.toBeNull() }
    const v = await avisos()
    expect(v).toHaveLength(4)
    for (const x of v) { expect(x.user_id).toBe(dt); expect(x.ticket_id).toBe('t1'); expect(x.enviado_at).toBeNull() }
  })
  it('un dymoId de sólo espacios también es etiqueta ausente', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    await cb(a, id, { estado: 'ok', resultado: { dymoId: '   ' } })
    expect(await avisos()).toHaveLength(1)
  })
})

describe('AV22-b · un dymoId presente no avisa', () => {
  it('ok con id de Drive: ni aviso ni marca', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    expect((await cb(a, id, { estado: 'ok', resultado: { dymoId: 'drive-etq-1' } })).status).toBe(200)
    expect(await avisos()).toHaveLength(0); expect(await marca(id)).toBeNull()
  })
})

describe('AV22-c · el estado error sin dymoId no avisa', () => {
  it('error: ni aviso ni marca, y el resultado queda guardado', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    expect((await cb(a, id, { estado: 'error', resultado: { fallos: [{ paso: 'el PDF' }] } })).status).toBe(200)
    expect(await avisos()).toHaveLength(0); expect(await marca(id)).toBeNull()
    expect((await db.query('SELECT estado FROM remisiones WHERE id = $1', [id])).rows[0].estado).toBe('error')
  })
})

describe('AV22-d · la condición no depende del texto del paso', () => {
  it('con un paso de nombre distinto avisa y copia lo que informó n8n; sin avisos no lleva esa frase; con dymoId presente y el paso «la etiqueta .dymo» no avisa', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app()
    await cb(a, await remision(), { estado: 'ok_con_avisos', resultado: { dymoId: null, avisos: [{ paso: 'un paso con otro nombre', mensaje: 'falló' }] } })
    await cb(a, await remision(), { estado: 'ok_con_avisos', resultado: { dymoId: null } })
    const v = await avisos()
    expect(v).toHaveLength(2)
    expect(v[0].texto).toContain('Lo que informó n8n: un paso con otro nombre — falló.')
    expect(v[1].texto).not.toContain('Lo que informó n8n')
    await cb(a, await remision(), { estado: 'ok_con_avisos', resultado: { dymoId: 'drive-1', avisos: [{ paso: 'la etiqueta .dymo' }] } })
    expect(await avisos()).toHaveLength(2)
  })
})

describe('AV22-e · un callback repetido no repite el aviso', () => {
  it('con la marca puesta, dos callbacks a la vez no crean ningún aviso más', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    await cb(a, id, { estado: 'ok' })
    expect(await avisos()).toHaveLength(1)
    await Promise.all([cb(a, id, { estado: 'ok' }), cb(a, id, { estado: 'ok' })])
    expect(await avisos()).toHaveLength(1)
  })
  it('con la marca libre, dos callbacks simultáneos crean un solo juego de avisos', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    await Promise.all([cb(a, id, { estado: 'ok' }), cb(a, id, { estado: 'ok' })])
    expect(await avisos()).toHaveLength(1)
  })
})

describe('AV22-f · un reenvío tras el aviso no lo repite', () => {
  it('tras avisar, la remisión pasa a error, se reenvía y llega otro callback sin dymoId: sigue habiendo un solo aviso', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    await cb(a, id, { estado: 'ok' })
    await db.query("UPDATE remisiones SET estado = 'error', resuelto_at = now(), enviado_at = NULL WHERE id = $1", [id])
    await cb(a, id, { estado: 'ok_con_avisos', resultado: { dymoId: null } })
    expect(await avisos()).toHaveLength(1)
  })
})

describe('AV22-g · quien envió y es Director Técnico recibe uno solo', () => {
  it('el remitente es el cargo y hay otro: dos avisos, una persona cada uno', async () => {
    const yo = await usuario({ cargoPermiso: 'Director Técnico' }); const otro = await usuario({ cargoPermiso: 'Director Técnico' })
    await ticket(); await cb(app(), await remision({ enviadoPor: yo }), { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id).sort()).toEqual([yo, otro].sort())
  })
  it('el remitente es el único con el cargo: un solo aviso', async () => {
    const yo = await usuario({ cargoPermiso: 'Director Técnico' }); await ticket()
    await cb(app(), await remision({ enviadoPor: yo }), { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id)).toEqual([yo])
  })
})

describe('AV22-h · quien envió y quien lleva el cargo son personas distintas', () => {
  it('reciben el aviso las dos personas y nadie del área', async () => {
    const yo = await usuario(); const dt = await usuario({ cargoPermiso: 'Director Técnico' }); await usuario({ area: true }); await ticket()
    await cb(app(), await remision({ enviadoPor: yo }), { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id).sort()).toEqual([yo, dt].sort())
  })
})

describe('AV22-i · sin enviado_por_id, o con una persona dada de baja, sólo el cargo', () => {
  it('sin remitente y con remitente inactivo: el aviso va sólo al Director Técnico', async () => {
    const dt = await usuario({ cargoPermiso: 'Director Técnico' }); const baja = await usuario({ activo: false }); await ticket(); const a = app()
    await cb(a, await remision(), { estado: 'ok' })
    await cb(a, await remision({ enviadoPor: baja }), { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id)).toEqual([dt, dt])
  })
})

describe('AV22-j · sin nadie con el cargo, cae al área Servicio Técnico', () => {
  it('avisa a quien envió y a cada persona del área, sin repetir a quien está en las dos', async () => {
    const yo = await usuario({ area: true }); const otro = await usuario({ area: true }); await ticket()
    await cb(app(), await remision({ enviadoPor: yo }), { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id).sort()).toEqual([yo, otro].sort())
  })
})

describe('AV22-k · sin destinatarios no se marca y se reintenta', () => {
  it('sin remitente, sin cargo y sin área (el administrador dado de baja): no hay avisos, la marca queda libre y se registra una advertencia; al aparecer un destinatario el siguiente callback avisa', async () => {
    await usuario({ admin: true, activo: false }); await ticket(); const a = app(); const id = await remision()
    const advertencia = vi.spyOn(logger, 'warn')
    expect((await cb(a, id, { estado: 'ok' })).status).toBe(200)
    expect(await avisos()).toHaveLength(0); expect(await marca(id)).toBeNull(); expect(advertencia).toHaveBeenCalled()
    const dt = await usuario({ cargoPermiso: 'Director Técnico' })
    await cb(a, id, { estado: 'ok' })
    expect((await avisos()).map((x) => x.user_id)).toEqual([dt]); expect(await marca(id)).not.toBeNull()
    advertencia.mockRestore()
  })
})

describe('AV22-l · si el aviso falla, el callback responde igual', () => {
  it('un fallo al crear los avisos: 200, resultado guardado, ningún aviso y el fallo se registra', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket(); const a = app(); const id = await remision()
    vi.mocked(avisosDb.crearAviso).mockRejectedValueOnce(new Error('fallo de base'))
    const error = vi.spyOn(logger, 'error')
    const r = await cb(a, id, { estado: 'ok', resultado: { pdfId: 'p-1' } })
    expect(r.status).toBe(200); expect(r.body).toEqual({ ok: true })
    expect(await avisos()).toHaveLength(0)
    const fila = (await db.query('SELECT estado, resultado FROM remisiones WHERE id = $1', [id])).rows[0]
    expect(fila.estado).toBe('ok'); expect(JSON.stringify(fila.resultado)).toContain('p-1')
    expect(error).toHaveBeenCalled(); error.mockRestore()
  })
})

describe('AV22-m · el aviso sólo va a la bandeja', () => {
  it('enviado_at queda NULL y el canal de correo no se invoca', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket()
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetchMock)
    try {
      const { app: a } = appWith({ remisionCallbackToken: TOKEN, avisosWebhookUrl: 'https://n8n/webhook/avisos' })
      await cb(a, await remision(), { estado: 'ok' })
      const v = await avisos()
      expect(v).toHaveLength(1); expect(v[0].enviado_at).toBeNull(); expect(fetchMock).not.toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
})

describe('AV22-t · el texto, en sus cuatro variantes', () => {
  const COLA = 'sigue sin etiqueta para rotular: hay que generarla a mano.'
  it('con ticket', () => {
    expect(textoAvisoSinEtiqueta({ ticketNumber: 1234, fecha: '2026-10-12', serial: 'ABC123', avisos: undefined })).toBe(
      `Ticket #1234: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial ABC123) ${COLA}`)
  })
  it('sin ticket', () => {
    expect(textoAvisoSinEtiqueta({ ticketNumber: null, fecha: '2026-10-12', serial: 'ABC123', avisos: undefined })).toBe(
      `La remisión de entrada del 2026-10-12 se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial ABC123) ${COLA}`)
  })
  it('sin serial (nulo, vacío o de espacios)', () => {
    for (const s of [null, '', '  ']) expect(textoAvisoSinEtiqueta({ ticketNumber: 7, fecha: '2026-10-12', serial: s, avisos: undefined })).toBe(
      `Ticket #7: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (sin serial registrado) ${COLA}`)
  })
  it('con avisos: cada entrada tal cual, el mensaje sólo si viene, unidas por «; »; las que no traen paso de texto no cuentan', () => {
    expect(textoAvisoSinEtiqueta({ ticketNumber: 7, fecha: '2026-10-12', serial: 'S', avisos: [{ paso: 'subir etiqueta', mensaje: 'timeout' }, { paso: 'correo' }, { mensaje: 'sin paso' }, 'basura'] })).toBe(
      `Ticket #7: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial S) ${COLA} Lo que informó n8n: subir etiqueta — timeout; correo.`)
    expect(textoAvisoSinEtiqueta({ ticketNumber: 7, fecha: '2026-10-12', serial: 'S', avisos: [] })).not.toContain('Lo que informó n8n')
  })
  it('por el callback, con ticket hallado y sin serial', async () => {
    await usuario({ cargoPermiso: 'Director Técnico' }); await ticket('t1', 4321)
    await cb(app(), await remision({ serial: null }), { estado: 'ok' })
    expect((await avisos())[0].texto).toBe(`Ticket #4321: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (sin serial registrado) ${COLA}`)
  })
})
