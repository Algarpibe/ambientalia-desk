import { describe, it, expect } from 'vitest'
import {
  crearRegistroModoSinZoho,
  ErrorModoSinZohoDesk,
  esCorteModoSinZoho,
  llamadorDeLaPila,
  recursoDeRuta,
} from './modoSinZoho'

/**
 * 1G-04 · L1 (RQ-ZS-41, RQ-ZS-42): el error del corte, el origen (recurso reducido + llamador de la pila) y el registro.
 * Las horas las pone un reloj inyectado; los datos de clientes, marcadores únicos que no pueden salir en ninguna lectura.
 */
const MENSAJE = 'modo sin Zoho Desk: la petición a Zoho Desk no salió'
const T1 = new Date('2026-11-20T13:00:00.000Z')
const T2 = new Date('2026-11-20T13:05:30.250Z')
const ID = 'MARCA_ID_7731'
const QUERY = 'MARCA_QUERY_7731'
const CUERPO = 'MARCA_CUERPO_7731'

type Registro = ReturnType<typeof crearRegistroModoSinZoho>

/** Quien llama a la puerta. Su nombre es el que la pila REAL tiene que devolver. */
function llamarDesdeAqui(registro: Registro, path: string, init?: RequestInit): unknown {
  try {
    registro.cortar(path, init)
  } catch (e) {
    return e
  }
  return undefined
}
function llamarDesdeOtroLado(registro: Registro, path: string, init?: RequestInit): unknown {
  try {
    registro.cortar(path, init)
  } catch (e) {
    return e
  }
  return undefined
}
/** El llamador que se traga el error y sigue, como la cuenta o el contacto por id de la sincronización. */
function tragaYSigue(registro: Registro, path: string): string {
  try {
    registro.cortar(path)
  } catch {
    /* se traga */
  }
  return 'siguió'
}

const ORIGEN_AQUI = 'packages/zoho-sync/src/modoSinZoho.test.ts · llamarDesdeAqui'

describe('ErrorModoSinZohoDesk · esCorteModoSinZoho (RQ-ZS-41)', () => {
  it('lleva el mensaje FIJO, la marca y se reconoce como corte', () => {
    const e = new ErrorModoSinZohoDesk()
    expect(e.message).toBe(MENSAJE)
    expect(e.name).toBe('ErrorModoSinZohoDesk')
    expect((e as unknown as { modoSinZohoDesk: unknown }).modoSinZohoDesk).toBe(true)
    expect(e).toBeInstanceOf(Error)
    expect(esCorteModoSinZoho(e)).toBe(true)
  })

  it('acepta la marca aunque venga de otra copia del módulo, y rechaza lo que no es un corte', () => {
    const copiaAjena = Object.assign(new Error('otra copia'), { modoSinZohoDesk: true })
    expect(esCorteModoSinZoho(copiaAjena)).toBe(true)
    expect(esCorteModoSinZoho(new TypeError('fetch failed'))).toBe(false)
    expect(esCorteModoSinZoho(new Error('modo sin Zoho Desk'))).toBe(false)
    expect(esCorteModoSinZoho(new Response('x', { status: 503 }))).toBe(false)
    expect(esCorteModoSinZoho(Object.assign(new Error('x'), { modoSinZohoDesk: 'true' }))).toBe(false)
    expect(esCorteModoSinZoho(null)).toBe(false)
    expect(esCorteModoSinZoho(undefined)).toBe(false)
    expect(esCorteModoSinZoho('modo sin Zoho Desk')).toBe(false)
  })
})

describe('recursoDeRuta (D-2)', () => {
  it('reduce el verbo, quita la query y pasa a {x} lo que no es de los catorce segmentos', () => {
    expect(recursoDeRuta('/tickets/123456')).toBe('GET /tickets/{x}')
    expect(recursoDeRuta(`/tickets/${ID}/conversations?limit=50&q=${QUERY}`, { method: 'get' })).toBe('GET /tickets/{x}/conversations')
    expect(recursoDeRuta('/tickets/9/sendReply', { method: 'POST', body: CUERPO })).toBe('POST /tickets/{x}/sendReply')
    expect(recursoDeRuta('/nuevoRecurso/9?x=1')).toBe('GET /{x}/{x}')
  })

  it('el verbo se reduce a GET, POST, PUT, PATCH, DELETE u OTRO, sin importar mayúsculas', () => {
    expect(recursoDeRuta('/tickets', { method: 'post' })).toBe('POST /tickets')
    expect(recursoDeRuta('/tickets', { method: 'Put' })).toBe('PUT /tickets')
    expect(recursoDeRuta('/tickets', { method: 'patch' })).toBe('PATCH /tickets')
    expect(recursoDeRuta('/tickets', { method: 'DELETE' })).toBe('DELETE /tickets')
    expect(recursoDeRuta('/tickets', { method: 'OPTIONS' })).toBe('OTRO /tickets')
    expect(recursoDeRuta('/tickets', { method: 'MARCA_VERBO_7731' })).toBe('OTRO /tickets')
    expect(recursoDeRuta('/tickets', {})).toBe('GET /tickets')
  })

  it.each([
    'tickets', 'archivedTickets', 'search', 'History', 'conversations', 'contacts', 'accounts',
    'tasks', 'attachments', 'threads', 'comments', 'content', 'sendReply', 'mailReplyAddress',
  ])('el segmento %s del inventario se conserva', (segmento) => {
    expect(recursoDeRuta(`/${segmento}`)).toBe(`GET /${segmento}`)
  })

  it('un segmento que casi es del inventario (otra capitalización, un sufijo) pasa a {x}', () => {
    expect(recursoDeRuta('/Tickets')).toBe('GET /{x}')
    expect(recursoDeRuta('/ticketsViejos')).toBe('GET /{x}')
    expect(recursoDeRuta('/tickets/history')).toBe('GET /tickets/{x}')
  })
})

describe('llamadorDeLaPila (D-2)', () => {
  const pila = (...marcos: string[]): string => ['Error', ...marcos.map((m) => `    at ${m}`)].join('\n')

  it('salta los marcos del propio módulo, de zohoClient y de node: y devuelve fichero · función', () => {
    const p = pila(
      'Object.cortar (file:///app/packages/zoho-sync/src/modoSinZoho.ts:80:15)',
      'Object.zohoFetch (file:///app/packages/zoho-sync/src/zohoClient.ts:29:44)',
      'node:internal/process/task_queues:95:5',
      'fetchTicket (file:///app/packages/zoho-sync/src/sync.ts:179:31)',
    )
    expect(llamadorDeLaPila(p)).toBe('packages/zoho-sync/src/sync.ts · fetchTicket')
  })

  it('en Windows, con Object. delante y barras invertidas, da el mismo resultado', () => {
    const p = pila('Object.fetchTicket (C:\\dev\\Desk_2_R1.023\\packages\\zoho-sync\\src\\sync.ts:179:31)')
    expect(llamadorDeLaPila(p)).toBe('packages/zoho-sync/src/sync.ts · fetchTicket')
  })

  it('toma la función del último tramo tras el punto y reconoce apps/ y scripts/', () => {
    expect(llamadorDeLaPila(pila('Sync.syncTicket (/app/packages/zoho-sync/src/sync.ts:10:5)'))).toBe('packages/zoho-sync/src/sync.ts · syncTicket')
    expect(llamadorDeLaPila(pila('tick (/app/apps/hub-sync/src/hubSync.ts:90:9)'))).toBe('apps/hub-sync/src/hubSync.ts · tick')
    expect(llamadorDeLaPila(pila('async main (file:///C:/dev/x/scripts/migrar.mjs:3:1)'))).toBe('scripts/migrar.mjs · main')
  })

  it('un marco anónimo da (anónima)', () => {
    expect(llamadorDeLaPila(pila('file:///app/apps/desk/server/routes/tickets.ts:140:20'))).toBe('apps/desk/server/routes/tickets.ts · (anónima)')
  })

  it('un marco de node_modules da dependencia, y sin ningún marco propio, desconocido', () => {
    expect(llamadorDeLaPila(pila('handle (/app/node_modules/express/lib/router/layer.js:95:5)'))).toBe('dependencia')
    expect(llamadorDeLaPila(pila('otra (C:\\Users\\persona\\otra\\cosa.ts:1:1)'))).toBe('desconocido')
    expect(llamadorDeLaPila('Error')).toBe('desconocido')
    expect(llamadorDeLaPila(undefined)).toBe('desconocido')
  })

  it('ignora las líneas sin posición (async Promise.all) y sigue buscando', () => {
    const p = pila('async Promise.all (index 0)', 'run (/app/packages/zoho-sync/src/sync.ts:7:3)')
    expect(llamadorDeLaPila(p)).toBe('packages/zoho-sync/src/sync.ts · run')
  })

  it('ninguna salida lleva una ruta absoluta del disco, C: ni file:', () => {
    const salidas = [
      llamadorDeLaPila(pila('f (file:///app/packages/zoho-sync/src/sync.ts:1:1)')),
      llamadorDeLaPila(pila('f (C:\\dev\\Desk\\packages\\zoho-sync\\src\\sync.ts:1:1)')),
      llamadorDeLaPila(pila('f (file:///C:/dev/Desk/apps/desk/server/a.ts:1:1)')),
      llamadorDeLaPila(pila('f (/app/node_modules/x/y.js:1:1)')),
      llamadorDeLaPila(pila('f (C:\\Users\\persona\\fuera.ts:1:1)')),
    ]
    expect(salidas.every((s) => s.length > 0)).toBe(true)
    for (const s of salidas) {
      expect(s).not.toContain('/app/')
      expect(s).not.toContain('C:')
      expect(s).not.toContain('file:')
      expect(s).not.toContain('\\')
    }
  })

  it('la pila REAL bajo vitest nombra este fichero y la función que llama', () => {
    let pilaReal: string | undefined
    function llamarDesdeAquiConPila(): void {
      pilaReal = new Error().stack
    }
    llamarDesdeAquiConPila()
    expect(llamadorDeLaPila(pilaReal)).toBe('packages/zoho-sync/src/modoSinZoho.test.ts · llamarDesdeAquiConPila')
  })
})

describe('crearRegistroModoSinZoho · cortar (RQ-ZS-42)', () => {
  it('cortar CUENTA y después lanza el error tipado', () => {
    const registro = crearRegistroModoSinZoho({ ahora: () => T1 })
    const e = llamarDesdeAqui(registro, '/tickets/1')
    expect(e).toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(registro.leer().cortes).toHaveLength(1)
    expect(registro.leer().cortes[0].cuenta).toBe(1)
  })

  it('dos cortes del mismo recurso y llamador, a horas distintas, son UN origen con primera y última', () => {
    let ahora = T1
    const registro = crearRegistroModoSinZoho({ ahora: () => ahora })
    llamarDesdeAqui(registro, '/tickets/1')
    ahora = T2
    llamarDesdeAqui(registro, '/tickets/2')
    expect(registro.leer().cortes).toEqual([
      { recurso: 'GET /tickets/{x}', llamador: ORIGEN_AQUI, cuenta: 2, primera: T1.toISOString(), ultima: T2.toISOString() },
    ])
  })

  it('un llamador distinto o un recurso distinto es otro origen, y la lectura sale ordenada por código', () => {
    const registro = crearRegistroModoSinZoho({ ahora: () => T1 })
    llamarDesdeOtroLado(registro, '/tickets/1')
    llamarDesdeAqui(registro, '/tickets/1')
    llamarDesdeAqui(registro, '/contacts/1')
    llamarDesdeAqui(registro, '/accounts/1', { method: 'POST' })
    const { cortes } = registro.leer()
    expect(cortes.map((c) => [c.recurso, c.llamador.split(' · ')[1], c.cuenta])).toEqual([
      ['GET /contacts/{x}', 'llamarDesdeAqui', 1],
      ['GET /tickets/{x}', 'llamarDesdeAqui', 1],
      ['GET /tickets/{x}', 'llamarDesdeOtroLado', 1],
      ['POST /accounts/{x}', 'llamarDesdeAqui', 1],
    ])
  })

  it('un corte que el llamador se traga también suma', () => {
    const registro = crearRegistroModoSinZoho({ ahora: () => T1 })
    expect(tragaYSigue(registro, '/contacts/55')).toBe('siguió')
    expect(tragaYSigue(registro, '/contacts/56')).toBe('siguió')
    expect(registro.leer().cortes).toEqual([
      {
        recurso: 'GET /contacts/{x}',
        llamador: 'packages/zoho-sync/src/modoSinZoho.test.ts · tragaYSigue',
        cuenta: 2,
        primera: T1.toISOString(),
        ultima: T1.toISOString(),
      },
    ])
  })

  it('un llamador sin etiqueta aparece igual, con su recurso, y el llamador lo da la pila REAL', () => {
    const registro = crearRegistroModoSinZoho({ ahora: () => T1 })
    llamarDesdeAqui(registro, '/tickets/9/threads/3/content')
    expect(registro.leer().cortes).toHaveLength(1)
    const [corte] = registro.leer().cortes
    expect(corte.recurso).toBe('GET /tickets/{x}/threads/{x}/content')
    expect(corte.llamador).toBe(ORIGEN_AQUI)
  })

  it('leer devuelve una copia: tocarla no cambia el registro', () => {
    const registro = crearRegistroModoSinZoho({ ahora: () => T1 })
    llamarDesdeAqui(registro, '/tickets/1')
    registro.rechazar('GET /api/attachment')
    const lectura = registro.leer()
    expect(lectura.cortes).toHaveLength(1)
    lectura.cortes[0].cuenta = 99
    lectura.cortes.push({ recurso: 'x', llamador: 'y', cuenta: 1, primera: '', ultima: '' })
    lectura.rechazos.length = 0
    expect(registro.leer().cortes).toHaveLength(1)
    expect(registro.leer().cortes[0].cuenta).toBe(1)
    expect(registro.leer().rechazos).toHaveLength(1)
  })

  it('un registro vacío lee listas vacías', () => {
    expect(crearRegistroModoSinZoho().leer()).toEqual({ cortes: [], rechazos: [] })
  })

  it('el reloj por omisión da una hora ISO válida', () => {
    const registro = crearRegistroModoSinZoho()
    llamarDesdeAqui(registro, '/tickets/1')
    const antes = Date.now()
    llamarDesdeAqui(registro, '/tickets/2')
    expect(registro.leer().cortes).toHaveLength(1)
    const { primera, ultima } = registro.leer().cortes[0]
    expect(new Date(primera).toISOString()).toBe(primera)
    expect(new Date(ultima).toISOString()).toBe(ultima)
    expect(Date.parse(ultima)).toBeGreaterThanOrEqual(antes)
    expect(Date.parse(ultima)).toBeGreaterThanOrEqual(Date.parse(primera))
  })
})

describe('crearRegistroModoSinZoho · rechazos y datos de clientes (RQ-ZS-42)', () => {
  it('un rechazo suma a su ruta, aparte de los cortes, con primera y última', () => {
    let ahora = T1
    const registro = crearRegistroModoSinZoho({ ahora: () => ahora })
    registro.rechazar('POST /api/tickets/:id/reply')
    ahora = T2
    registro.rechazar('POST /api/tickets/:id/reply')
    registro.rechazar('GET /api/admin/measure-attachments')
    expect(registro.leer()).toEqual({
      cortes: [],
      rechazos: [
        { ruta: 'GET /api/admin/measure-attachments', cuenta: 1, primera: T2.toISOString(), ultima: T2.toISOString() },
        { ruta: 'POST /api/tickets/:id/reply', cuenta: 2, primera: T1.toISOString(), ultima: T2.toISOString() },
      ],
    })
  })

  it('ni el id, ni la query, ni el cuerpo, ni el verbo raro salen en NINGÚN valor de la lectura, del error ni de los avisos', () => {
    const lineas: string[] = []
    const registro = crearRegistroModoSinZoho({ ahora: () => T1, avisar: (l) => lineas.push(l) })
    const e = llamarDesdeAqui(registro, `/tickets/${ID}/conversations?q=${QUERY}`, { method: 'POST', body: CUERPO })
    llamarDesdeAqui(registro, `/contacts/${ID}?campo=${QUERY}`, { method: 'MARCA_VERBO_7731', body: CUERPO })
    registro.rechazar('POST /api/tickets/:id/reply')
    const volcado = JSON.stringify(registro.leer()) + (e as Error).message + lineas.join('\n')
    for (const marca of [ID, QUERY, CUERPO, 'MARCA_VERBO_7731', '7731']) expect(volcado).not.toContain(marca)
    expect(JSON.parse(JSON.stringify(registro.leer())).cortes.map((c: { recurso: string }) => c.recurso)).toEqual([
      'OTRO /contacts/{x}',
      'POST /tickets/{x}/conversations',
    ])
  })
})

describe('crearRegistroModoSinZoho · avisar (D-3)', () => {
  it('avisa UNA vez por origen nuevo: tres cortes de un origen y uno de otro dan dos líneas', () => {
    const lineas: string[] = []
    const registro = crearRegistroModoSinZoho({ ahora: () => T1, avisar: (l) => lineas.push(l) })
    llamarDesdeAqui(registro, '/tickets/1')
    llamarDesdeAqui(registro, '/tickets/2')
    llamarDesdeAqui(registro, '/tickets/3')
    llamarDesdeAqui(registro, '/contacts/3')
    expect(lineas).toEqual([
      `modo sin Zoho Desk: primer corte de GET /tickets/{x} ← ${ORIGEN_AQUI}`,
      `modo sin Zoho Desk: primer corte de GET /contacts/{x} ← ${ORIGEN_AQUI}`,
    ])
  })

  it('avisa una vez por ruta rechazada nueva', () => {
    const lineas: string[] = []
    const registro = crearRegistroModoSinZoho({ avisar: (l) => lineas.push(l) })
    registro.rechazar('POST /api/tickets/:id/reply')
    registro.rechazar('POST /api/tickets/:id/reply')
    registro.rechazar('GET /api/attachment')
    expect(lineas).toEqual([
      'modo sin Zoho Desk: primer rechazo en POST /api/tickets/:id/reply',
      'modo sin Zoho Desk: primer rechazo en GET /api/attachment',
    ])
  })

  it('un avisar que lanza no impide el error tipado ni la cuenta, ni el rechazo', () => {
    const registro = crearRegistroModoSinZoho({
      ahora: () => T1,
      avisar: () => {
        throw new Error('el log se cayó')
      },
    })
    const e = llamarDesdeAqui(registro, '/tickets/1')
    expect(e).toBeInstanceOf(ErrorModoSinZohoDesk)
    expect((e as Error).message).toBe(MENSAJE)
    expect(() => registro.rechazar('GET /api/attachment')).not.toThrow()
    const lectura = registro.leer()
    expect(lectura.cortes[0].cuenta).toBe(1)
    expect(lectura.rechazos[0].cuenta).toBe(1)
  })

  it('sin avisar inyectado no pasa nada', () => {
    const registro = crearRegistroModoSinZoho()
    expect(llamarDesdeAqui(registro, '/tickets/1')).toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(() => registro.rechazar('GET /api/attachment')).not.toThrow()
  })
})
