import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Request, Response, NextFunction } from 'express'
import type { UserPublic } from '@ambientalia/shared'
import { AREAS, TRANSITIONS, canExecuteTransition } from '@ambientalia/shared'
import { requireAuth, requireAdmin, requireArea } from './auth/middleware'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
// `valoresValidos` vive en el arnés: esta matriz y la de ejecución (`transicionesEjecucion.test.ts`)
// barren las mismas 34 transiciones, y dos copias del derivador de valores habrían divergido en la
// primera etapa con un `kind` nuevo.
import { db, instalarArnes, appWith, userCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * LA MATRIZ ÁREA × TRANSICIÓN COMPLETA, CONTRA EL SERVIDOR (§4 del proposal F0-04).
 *
 * Lo que había: `permissions.test.ts:13-26` con cuatro casos sintéticos sobre la función pura, y el
 * servidor probando UNA sola transición real (`transiciones.test.ts`, `aprobacion`). Cinco tandas de
 * la Fase 1 tocan `permissions.ts` y `transitions.ts` sin más red que ésa.
 *
 * ⚠️ LA MATRIZ SE DERIVA DEL GRAFO, no se escriben 34 casos a mano. Escritos a mano, la transición 35
 * que añada F1B-06 no tendría fila y nadie se enteraría; derivada, aparece sola en la matriz y el
 * servidor tiene que contestarle. Lo que sí va escrito a mano es el TOTAL —102 casos, 60 prohibidos y
 * 42 permitidos—, porque una matriz derivada de un grafo vacío también daría verde.
 *
 * ⚠️ Y SE PRUEBA CONTRA EL SERVIDOR, no contra `canExecuteTransition`. El 403 lo lanza
 * `ticketService.ts:89`, y entre la petición y esa línea hay dos guardas por delante —404 si el
 * ticket no existe, 409 si el estado de origen no aplica— que se comen la respuesta antes. Por eso
 * cada ticket se coloca en `t.from[0]`, un estado de origen VÁLIDO para su transición: con el estado
 * equivocado esta matriz estaría comprobando 409 y creyendo que comprueba permisos.
 *
 * EFECTO DE SEGUNDO ORDEN, que conviene dejar escrito: con esta matriz probada,
 * `TransitionPanel.tsx:56-57` —que filtra los botones por área en el navegador— deja de ser un espejo
 * sin comprobar y pasa a ser COMODIDAD LEGÍTIMA bajo la regla invariable 13 de `CLAUDE.md`: la
 * frontera está probada en el servidor, y la pantalla sólo evita ofrecer lo que va a ser rechazado.
 * Antes de esta tanda no lo era, y el filtro del navegador era la única comprobación que existía.
 */
describe('matriz área × transición, contra el servidor', () => {
  for (const area of AREAS) {
    it(`las 34 transiciones contestan lo mismo a un usuario de ${area}`, async () => {
      const cookie = await userCookie([area])
      const { app } = appWith()

      const observado: Record<string, number> = {}
      let n = 0
      for (const t of TRANSITIONS) {
        n += 1
        const id = `mtx-${n}`
        // El estado de origen: el primero de los `from` de ESTA transición. Con cualquier otro, el
        // 409 de `ticketService.ts:86` contesta antes y la casilla no llega a probar permisos.
        await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
          [id, 90000 + n, 'Matriz de permisos', t.from[0]])
        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        observado[t.id] = res.status
      }

      // El esperado sale de la regla, no de una lista copiada: el área del usuario cubre —o no— el
      // área de la transición. Un 404 o un 409 colado aquí revienta la comparación y se ve cuál.
      const esperado: Record<string, number> = {}
      for (const t of TRANSITIONS) esperado[t.id] = canExecuteTransition([area], false, t.area) ? 200 : 403
      expect(observado).toEqual(esperado)
    }, 60_000)
  }

  /**
   * EL TOTAL, escrito a mano, porque es lo único que la derivación no puede vigilarse a sí misma.
   *
   * 34 transiciones × 3 áreas = 102 casos. Las 26 de área simple prohíben a 2 áreas cada una y las 8
   * compartidas a 1: 26×2 + 8×1 = 60 prohibidos, y 42 permitidos. Si mañana una transición pasa de
   * simple a compartida —que es exactamente lo que F1C-05 va a tocar—, estos números se mueven y hay
   * que moverlos a propósito.
   */
  it('la matriz son 102 casos: 60 prohibidos y 42 permitidos', () => {
    const casos = TRANSITIONS.flatMap((t) => AREAS.map((a) => canExecuteTransition([a], false, t.area)))
    expect(casos).toHaveLength(102)
    expect(casos.filter((permitido) => !permitido)).toHaveLength(60)
    expect(casos.filter((permitido) => permitido)).toHaveLength(42)
  })

  /**
   * Y el admin, que es la otra mitad de `canExecuteTransition`: pasa por las 34 sin mirar el área.
   * Va contra el servidor por lo mismo que la matriz — el `isAdmin` que decide es el de la sesión,
   * no el del argumento.
   */
  it('un administrador pasa por las 34 sin que su área importe', async () => {
    // Su rol NO cubre ninguna transición: lo único que le abre las 34 es ser administrador.
    const u = await createUser(db, { email: 'jefa@x.co', name: 'Jefa', passwordHash: await hashPassword('password123'), isAdmin: true })
    const cookie = `sid=${await createSession(db, u.id)}`
    const { app } = appWith()

    const observado: Record<string, number> = {}
    let n = 0
    for (const t of TRANSITIONS) {
      n += 1
      const id = `adm-${n}`
      await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
        [id, 80000 + n, 'Matriz de permisos', t.from[0]])
      const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
        .send({ transitionId: t.id, values: valoresValidos(t, n) })
      observado[t.id] = res.status
    }
    const esperado: Record<string, number> = {}
    for (const t of TRANSITIONS) esperado[t.id] = 200
    expect(observado).toEqual(esperado)
  }, 60_000)
})

/**
 * LAS TRES GUARDAS DE `auth/middleware.ts`, PROBADAS DIRECTAMENTE.
 *
 * El fichero no se importaba en ningún test: sus tres funciones sólo se ejercitaban de refilón, por
 * las rutas que las montan, y ninguna prueba nombraba lo que hacen. Aquí se prueban como lo que son
 * —tres middlewares de Express— con un `res` de mentira que apunta el estado y el cuerpo.
 *
 * Se comprueba SIEMPRE que `next` NO se llamó cuando se rechaza: un middleware que responde 403 y
 * además deja pasar la petición es exactamente el fallo que no se ve en una prueba de estado.
 */
describe('guardas de autenticación', () => {
  describe('requireAuth', () => {
    it('401 sin cookie de sesión', async () => {
      const { req, res, next, llamadas } = arnesMiddleware({ cookies: {} })
      await requireAuth(db)(req, res, next)
      expect(res.estado).toBe(401)
      expect(res.cuerpo).toEqual({ error: 'No autenticado' })
      expect(llamadas.next).toBe(0)
    })

    it('401 con una cookie que no corresponde a ninguna sesión', async () => {
      const { req, res, next, llamadas } = arnesMiddleware({ cookies: { sid: 'sesion-inventada' } })
      await requireAuth(db)(req, res, next)
      expect(res.estado).toBe(401)
      expect(res.cuerpo).toEqual({ error: 'Sesión inválida o expirada' })
      expect(llamadas.next).toBe(0)
    })

    it('con sesión válida deja pasar y adjunta el usuario a la petición', async () => {
      const u = await createUser(db, { email: 'op@x.co', name: 'Op', passwordHash: await hashPassword('password123') })
      const sid = await createSession(db, u.id)
      const { req, res, next, llamadas } = arnesMiddleware({ cookies: { sid } })
      await requireAuth(db)(req, res, next)
      expect(llamadas.next).toBe(1)
      expect(res.estado).toBe(0)
      // Es lo que hace que `requireAdmin` y `requireArea` puedan decidir después.
      expect(req.user?.id).toBe(u.id)
    })
  })

  describe('requireAdmin', () => {
    it('403 si no hay usuario en la petición', () => {
      const { req, res, next, llamadas } = arnesMiddleware({})
      requireAdmin(req, res, next)
      expect(res.estado).toBe(403)
      expect(res.cuerpo).toEqual({ error: 'Requiere permisos de administrador' })
      expect(llamadas.next).toBe(0)
    })

    it('403 a un usuario con áreas pero sin ser administrador', () => {
      const { req, res, next, llamadas } = arnesMiddleware({ user: usuario({ areas: ['Comercial', 'Servicio Técnico', 'Compras'] }) })
      requireAdmin(req, res, next)
      expect(res.estado).toBe(403)
      expect(llamadas.next).toBe(0)
    })

    it('deja pasar al administrador aunque no tenga ningún área', () => {
      const { req, res, next, llamadas } = arnesMiddleware({ user: usuario({ isAdmin: true, areas: [] }) })
      requireAdmin(req, res, next)
      expect(llamadas.next).toBe(1)
      expect(res.estado).toBe(0)
    })
  })

  describe('requireArea', () => {
    it('403 si no hay usuario en la petición', () => {
      const { req, res, next, llamadas } = arnesMiddleware({})
      requireArea(req, res, next)
      expect(res.estado).toBe(403)
      expect(res.cuerpo).toEqual({ error: 'Tu rol no tiene un área asignada para responder' })
      expect(llamadas.next).toBe(0)
    })

    it('403 a un usuario cuyo rol no tiene ningún área', () => {
      const { req, res, next, llamadas } = arnesMiddleware({ user: usuario({ areas: [] }) })
      requireArea(req, res, next)
      expect(res.estado).toBe(403)
      expect(llamadas.next).toBe(0)
    })

    it('deja pasar con un área cualquiera: no mira CUÁL, sólo que haya', () => {
      const { req, res, next, llamadas } = arnesMiddleware({ user: usuario({ areas: ['Compras'] }) })
      requireArea(req, res, next)
      expect(llamadas.next).toBe(1)
      expect(res.estado).toBe(0)
    })

    it('deja pasar al administrador sin área: la suya es la excepción escrita en la guarda', () => {
      const { req, res, next, llamadas } = arnesMiddleware({ user: usuario({ isAdmin: true, areas: [] }) })
      requireArea(req, res, next)
      expect(llamadas.next).toBe(1)
      expect(res.estado).toBe(0)
    })
  })
})

/** Un usuario de mentira, con lo justo que las tres guardas miran. */
function usuario(over: Partial<UserPublic> = {}): UserPublic {
  return { id: 'u1', email: 'x@x.co', name: 'X', isAdmin: false, areas: [], ...over } as UserPublic
}

/**
 * Petición, respuesta y `next` de mentira para un middleware de Express.
 *
 * `estado` arranca en 0 y no en `undefined` para que «no contestó» sea un valor comprobable: una
 * guarda que deja pasar no debe tocar la respuesta, y eso hay que poder afirmarlo.
 */
function arnesMiddleware(req: { cookies?: Record<string, string>; user?: UserPublic }) {
  const llamadas = { next: 0 }
  const res = {
    estado: 0,
    cuerpo: undefined as unknown,
    status(c: number) { this.estado = c; return this },
    json(b: unknown) { this.cuerpo = b; return this },
  }
  return {
    req: req as unknown as Request,
    res: res as unknown as Response & typeof res,
    next: (() => { llamadas.next += 1 }) as NextFunction,
    llamadas,
  }
}
