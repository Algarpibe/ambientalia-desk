import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Request, Response, NextFunction } from 'express'
import type { UserPublic } from '@ambientalia/shared'
import { AREAS, TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, canExecuteTransition, puedeEjecutarTransicion, CARGOS, EXCEPCIONES_POR_CARGO } from '@ambientalia/shared'
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
 * ⚠️ LA MATRIZ SE DERIVA DEL GRAFO, no se escriben 34 casos a mano. Escritos a mano, una transición
 * nueva de cualquier catálogo del registro no tendría fila y nadie se enteraría; derivada, aparece
 * servidor tiene que contestarle. Lo que sí va escrito a mano es el TOTAL —102 casos, 60 prohibidos y
 * 42 permitidos—, porque una matriz derivada de un grafo vacío también daría verde.
 *
 * ⚠️ Y SE PRUEBA CONTRA EL SERVIDOR, no contra `canExecuteTransition`. El 403 lo lanza
 * `ticketService.ts:130`, con TRES guardas por delante —404 si el ticket no existe, 409 de flujo
 * (guarda 3, F1B-06, RQ-EN-05) y 409 si el estado de origen no aplica— que se comen la respuesta
 * antes. Por eso cada ticket se coloca en `t.from[0]`, un estado de origen VÁLIDO para su transición:
 * con el estado equivocado esta matriz estaría comprobando 409 y creyendo que comprueba permisos.
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
        // 409 de `ticketService.ts:126-128` contesta antes y la casilla no llega a probar permisos.
        await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
          [id, 90000 + n, 'Matriz de permisos', t.from[0]])
        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        observado[t.id] = res.status
      }

      // El esperado sale de la regla, no de una lista copiada: el área del usuario cubre —o no— el
      // área de la transición. Un 404 o un 409 colado aquí revienta la comparación y se ve cuál.
      const esperado: Record<string, number> = {}
      for (const t of TRANSITIONS) esperado[t.id] = puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso: null }, t) ? 200 : 403
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

/**
 * F1B-06/F1A-03 — LA MATRIZ 6×3 DEL CATÁLOGO `TRANSITIONS_EQUIPO_NUEVO`, CONTRA EL SERVIDOR.
 *
 * Escrita A MANO y no derivada: con seis transiciones el total esperado (12 prohibidos, 6
 * permitidos) es más claro escrito que calculado, y por s2 las seis son `Servicio Técnico`, así que
 * el resultado es uniforme.
 *
 * ⚠️ MISMA CORRECCIÓN (c) que `transicionesEjecucion.test.ts`: cada ticket se siembra con
 * `classification: 'Equipo nuevo'` EXPLÍCITA y en `t.from[0]` de su transición, para que la
 * respuesta observada sea el 403/200 de PERMISO y no el 409 de flujo (Fase 6) ni el 409 de estado.
 */
describe('matriz 6×3 · área × transición de Equipo nuevo, contra el servidor (F1B-06/F1A-03)', () => {
  for (const area of AREAS) {
    it(`las cinco transiciones de Equipo nuevo contestan lo mismo a un usuario de ${area}`, async () => {
      const cookie = await userCookie([area])
      const { app } = appWith()

      const observado: Record<string, number> = {}
      let n = 0
      for (const t of TRANSITIONS_EQUIPO_NUEVO) {
        n += 1
        const id = `mtx-en-${n}`
        await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
          [id, 92000 + n, 'Matriz de permisos EN', t.from[0], 'Equipo nuevo'])
        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        observado[t.id] = res.status
      }

      const esperado: Record<string, number> = {}
      for (const t of TRANSITIONS_EQUIPO_NUEVO) esperado[t.id] = canExecuteTransition([area], false, t.area) ? 200 : 403
      expect(observado).toEqual(esperado)
    }, 60_000)
  }

  it('la matriz EN son 18 casos: 12 prohibidos y 6 permitidos', () => {
    const casos = TRANSITIONS_EQUIPO_NUEVO.flatMap((t) => AREAS.map((a) => canExecuteTransition([a], false, t.area)))
    expect(casos).toHaveLength(18)
    expect(casos.filter((permitido) => !permitido)).toHaveLength(12)
    expect(casos.filter((permitido) => permitido)).toHaveLength(6)
  })

  it('un administrador pasa por las cinco sin que su área importe', async () => {
    const u = await createUser(db, { email: 'jefa-en@x.co', name: 'Jefa', passwordHash: await hashPassword('password123'), isAdmin: true })
    const cookie = `sid=${await createSession(db, u.id)}`
    const { app } = appWith()

    const observado: Record<string, number> = {}
    let n = 0
    for (const t of TRANSITIONS_EQUIPO_NUEVO) {
      n += 1
      const id = `adm-en-${n}`
      await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
        [id, 93000 + n, 'Matriz de permisos EN', t.from[0], 'Equipo nuevo'])
      const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
        .send({ transitionId: t.id, values: valoresValidos(t, n) })
      observado[t.id] = res.status
    }
    const esperado: Record<string, number> = {}
    for (const t of TRANSITIONS_EQUIPO_NUEVO) esperado[t.id] = 200
    expect(observado).toEqual(esperado)
  }, 60_000)
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

/**
 * F1B-06 (cambio 2, `blueprint-soporte-remoto`) — LA MATRIZ 4×3 DE `TRANSITIONS_SOPORTE_REMOTO`, CONTRA EL SERVIDOR.
 * A mano: por S-1 las cuatro son `Servicio Técnico`, así que sólo ese usuario pasa (4 permitidos, 8 prohibidos). Cada
 * ticket es `Soporte remoto` y está en `t.from[0]`: lo observado es el 403/200 de PERMISO, no un 409 de flujo o de estado.
 */
describe('matriz 4×3 · área × transición de Soporte remoto, contra el servidor (F1B-06, cambio 2)', () => {
  for (const area of AREAS) {
    it(`las cuatro transiciones de Soporte remoto contestan lo mismo a un usuario de ${area}`, async () => {
      const cookie = await userCookie([area])
      const { app } = appWith()
      const observado: Record<string, number> = {}
      let n = 0
      for (const t of TRANSITIONS_SOPORTE_REMOTO) {
        n += 1
        const id = `mtx-sr-${n}`
        await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
          [id, 94000 + n, 'Matriz de permisos SR', t.from[0], 'Soporte remoto'])
        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        observado[t.id] = res.status
      }
      const esperado: Record<string, number> = {}
      for (const t of TRANSITIONS_SOPORTE_REMOTO) esperado[t.id] = canExecuteTransition([area], false, t.area) ? 200 : 403
      expect(observado).toEqual(esperado)
      // A mano, independiente de `canExecuteTransition`: sólo Servicio Técnico pasa (S-1).
      expect(Object.values(observado).every((s) => s === (area === 'Servicio Técnico' ? 200 : 403))).toBe(true)
    }, 60_000)
  }

  it('la matriz SR son 12 casos: 8 prohibidos y 4 permitidos', () => {
    const casos = TRANSITIONS_SOPORTE_REMOTO.flatMap((t) => AREAS.map((a) => canExecuteTransition([a], false, t.area)))
    expect(casos).toHaveLength(12)
    expect(casos.filter((permitido) => !permitido)).toHaveLength(8)
    expect(casos.filter((permitido) => permitido)).toHaveLength(4)
  })
})

/**
 * F1C-05, nivel CARGO, parte pura: el cargo SÓLO restringe (RQ-PM-03, RQ-PM-21). Van al final del
 * fichero y no tocan la matriz HTTP de arriba, cuyo suelo (102 = 60/42, sólo área) sigue intacto.
 */
describe('cargo · la compuesta contra el área (puro)', () => {
  it('exactamente un caso difiere del área: liberacion_sin_factura × Comercial (S21)', () => {
    const difieren = TRANSITIONS.flatMap((t) => AREAS.flatMap((area) => {
      const conCompuesta = puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso: null }, t)
      return conCompuesta === canExecuteTransition([area], false, t.area) ? [] : [{ transicion: t.id, area }]
    }))
    expect(difieren).toEqual([{ transicion: 'liberacion_sin_factura', area: 'Comercial' }])
  })

  it('con la compuesta y sin cargo, la matriz son 102 casos: 61 prohibidos y 41 permitidos', () => {
    const casos = TRANSITIONS.flatMap((t) => AREAS.map((a) => puedeEjecutarTransicion({ areas: [a], isAdmin: false, cargoPermiso: null }, t)))
    expect(casos).toHaveLength(102)
    expect(casos.filter((p) => !p)).toHaveLength(61)
    expect(casos.filter((p) => p)).toHaveLength(41)
  })

  it('cargo × área × transición: 816 casos, ninguno concede lo que el área niega (S17)', () => {
    const cargos = [...CARGOS, null]
    let casos = 0
    for (const t of TRANSITIONS) {
      for (const area of AREAS) {
        for (const cargoPermiso of cargos) {
          casos += 1
          const compuesta = puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso }, t)
          if (compuesta) expect(canExecuteTransition([area], false, t.area)).toBe(true)
        }
      }
    }
    expect(casos).toBe(816) // 34 transiciones × 3 áreas × (7 cargos + sin cargo), a mano
  })

  it('con Director Comercial la compuesta coincide con el área en las 102 celdas', () => {
    for (const t of TRANSITIONS) {
      for (const area of AREAS) {
        expect(puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso: 'Director Comercial' }, t))
          .toBe(canExecuteTransition([area], false, t.area))
      }
    }
  })

  it('la tabla de excepciones no toca las otras dos matrices: sus claves no están en sus catálogos', () => {
    const ids = [...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO].map((t) => t.id)
    for (const id of Object.keys(EXCEPCIONES_POR_CARGO.transiciones)) expect(ids).not.toContain(id)
  })
})
