# Diseño: la ejecución rechazada de la migración responde `409` con mensaje claro

## Enfoque técnico

El rechazo gana **tipo propio** en el ejecutor y la ruta lo traduce con un **manejador de error propio, último eslabón de su cadena**. No cambian el `UPDATE`, la transacción, el interruptor ni el manejador central (`apps/desk/server/app.ts:78`). Todo se edita **en sitio o al final** del fichero: ninguna línea existente cambia de número. Lo que aquí se dice de tipos, lint y mutaciones es **hipótesis** hasta ejecutarlo en el apply.

**Comprobado en `node_modules`** (Express 5.2.1, `@types/express` 5.0.6, `@types/express-serve-static-core` 5.1.1; `package.json:33`, `package.json:49`), citado en prosa porque no son ficheros versionados: en `node_modules/router/lib/route.js`, líneas 154 a 158, un error pasado a `next` se entrega con `handleError` a los eslabones **posteriores** de la misma ruta; en `node_modules/router/lib/layer.js`, líneas 106 a 112, `handleError` salta todo manejador cuya aridad no sea 4, y en las líneas 142 a 148 `handleRequest` salta en el flujo normal los de aridad mayor que 3. En los tipos, `RequestHandlerParams` incluye `ErrorRequestHandler` (líneas 85 a 94 de `node_modules/@types/express-serve-static-core/index.d.ts`) y `app.post` acepta `...handlers: Array<RequestHandlerParams>` (línea 153). **Los tipos lo admiten por lectura**; que `npm run typecheck` pase es hipótesis. Alternativa mínima si no pasara, sin añadir líneas por encima de la 255: en la línea 232, `}), rechazoDeMigracionAdelantada as unknown as RequestHandler)` (`RequestHandler` ya se importa en `apps/desk/server/routes/admin.ts:1`).

## Decisiones

### D-1 · `apps/desk/server/db/migracionTicketsAbiertos.ts` (95 líneas; crece sólo por el final)
**(b) En sitio**, `apps/desk/server/db/migracionTicketsAbiertos.ts:90` pasa a (misma sangría de seis espacios): `if (r.rows.length === 0) throw new MigracionAdelantadaError(t.number)`
**(a) Tras la línea 95, una línea en blanco y:**
```ts
/**
 * rechazo-migracion-409 (F1F-01), `zoho-sync` RQ-ZS-23 · el rechazo de la ejecución a la que otra se adelantó, con tipo propio: la ruta lo distingue por
 * `instanceof`, nunca por el texto. El mensaje es el de siempre y va al registro, no a la respuesta. Va al final para no desplazar ninguna línea citada.
 */
export class MigracionAdelantadaError extends Error {
  constructor(readonly numero: number) {
    super(`El ticket ${numero} pasó a estar gobernado entre la lectura y la escritura: se deshace la migración entera`)
    this.name = 'MigracionAdelantadaError'
  }
}
```
Molde: `apps/desk/server/auth/users.ts:118-123`. **Lint:** `eslint.config.js:19-24` extiende sólo los conjuntos recomendados y `eslint.config.js:29-32` añade una única regla (`no-explicit-any`); `no-use-before-define` no está en ninguno de ellos, así que la clase usada dentro de una función anterior no la dispara (**hipótesis** hasta `npm run lint`, cuyo margen es 0). TypeScript sólo rechaza el uso previo de una clase cuando no está diferido, y aquí lo está: la línea 90 corre dentro de la función que recibe `enTransaccion`.
### D-2 · `apps/desk/server/routes/admin.ts` (255 líneas; crece sólo por el final)
- **(a)** `apps/desk/server/routes/admin.ts:1` → `import type { Express, RequestHandler, ErrorRequestHandler } from 'express'`
- **(b)** `apps/desk/server/routes/admin.ts:234` → `import { migrarTicketsAbiertos, MigracionAdelantadaError } from '../db/migracionTicketsAbiertos'`
- **(c)** `apps/desk/server/routes/admin.ts:232` → `}), rechazoDeMigracionAdelantada)` (misma sangría de dos espacios)
- **(d)** Tras la línea 255, una línea en blanco y:
```ts
/**
 * rechazo-migracion-409 (F1F-01), `zoho-sync` RQ-ZS-23 · manejador de error PROPIO de la ruta de la migración, y su último eslabón: Express entrega el error a los
 * eslabones posteriores, así que delante del manejador principal no caza nada. Sólo traduce `MigracionAdelantadaError` (por tipo, nunca por texto) a `409`; cualquier
 * otro error sigue al manejador central. Es un aviso, no un fallo del servidor: como no llega al manejador central, sin esta línea de registro no quedaría rastro.
 */
const rechazoDeMigracionAdelantada: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof MigracionAdelantadaError)) { next(err); return }
  logger.warn({ numero: err.numero }, `Migración de tickets abiertos rechazada (409): ${err.message}`)
  res.status(409).json({ error: `Otra ejecución de la migración está en curso o acaba de confirmarse (o el ticket ${err.numero} cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió nada. Compruébalo con una pasada en seco —la misma llamada sin \`aplicar\`— antes de volver a lanzarla.`, motivo: 'otra-ejecucion' })
}
```
Los acentos graves de `aplicar` van **escapados** dentro de la plantilla. `_req` no dispara `no-unused-vars` (por defecto sólo mira los argumentos posteriores al último usado): hipótesis hasta el lint. **`const`, no `function`:** la zona muerta temporal sólo mordería si `registerAdminRoutes` se llamara mientras se evalúa el módulo, y se llama en `apps/desk/server/app.ts:57`, dentro de `createApp`, con el módulo ya evaluado (`admin.ts` no importa `app.ts`: sin ciclo); la `const` tipada deja la línea 1 con un solo tipo nuevo. `interruptorMigracion` (`apps/desk/server/routes/admin.ts:250-255`) es `function` izada porque es una fábrica de parámetros tipados; hacer lo mismo aquí exige importar `Request`, `Response` y `NextFunction` y anotar `err: unknown`. Es la **alternativa** si el typecheck marcara el uso previo: mismo cuerpo, misma posición. El tipo **no** obliga a declarar los cuatro parámetros: quitar `next` compila y deja el manejador sin efecto (M7).
### D-3 · Pruebas de ruta, al final de `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` (tras la línea 196; sin importaciones nuevas)
El arnés existente (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:21-27`) no deja intervenir: va un ayudante propio, con el molde de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:34-42` y la intervención de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:168-177`.
```ts
const mensajeRechazo = (n: number) => `Otra ejecución de la migración está en curso o acaba de confirmarse (o el ticket ${n} cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió nada. Compruébalo con una pasada en seco —la misma llamada sin \`aplicar\`— antes de volver a lanzarla.`
const esUpdate = (sql: string) => /^UPDATE tickets SET status/i.test(sql.trim())
function conGancho(antes: (sql: string, p: unknown[]) => Promise<void> | void, habilitada = true) {
  const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  const env = (q: Queryable['query']): Queryable['query'] => (async (sql: string, p: unknown[] = []) => { await antes(sql, p); return q(sql, p) }) as Queryable['query']
  const espia = { query: env(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: env(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
  return appWith({ migracionTicketsHabilitada: habilitada }, espia).app
}
// dentro del `describe`: `cookie` de administrador, `disparos = 0` y `tk('t1', 4100, 'Entregado')` en `beforeEach`
const adelantar = (id: string) => async (sql: string, p: unknown[]) => { if (esUpdate(sql) && p[0] === id) { disparos++; await db.query('UPDATE tickets SET managed_by_app = true WHERE id = $1', [id]) } }
const lanzar = (app: ReturnType<typeof conGancho>) => request(app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })
```

| Caso | Preparación | Aserciones exactas | Nace |
|---|---|---|---|
| 1 · rechazo | además `tk('t2', 4200, 'OV asignada')`; `conGancho(adelantar('t2'))` | `status` 409; `body` `toEqual({ error: mensajeRechazo(4200), motivo: 'otra-ejecucion' })`; `not.toHaveProperty('aplicado')` y `('negativa')`; `disparos` 1 | **ROJO: `500` y `{ error: 'Error interno' }`** |
| 2 · otro error | `conGancho((sql) => { if (esUpdate(sql)) throw new Error('fallo forzado') })` | `status` 500; `body` `toEqual({ error: 'Error interno' })` | Verde |
| 3 · posición, interruptor | `conGancho(adelantar('t1'), false)` | `status` 403; `body.error` casa `/MIGRACION_TICKETS_HABILITADA/`; `not.toHaveProperty('motivo')`; `disparos` 0 | Verde |
| 4 · posición, negativa | además `tk('t9', 4900, 'Estado raro')`; `conGancho(adelantar('t1'))` | `status` 409; `body.negativa` `toEqual({ motivo: 'estados-sin-equivalencia', estados: ['Estado raro'] })`; `not.toHaveProperty('motivo')` y `('error')`; `disparos` 0 | Verde |
| 5 · registro | como el caso 1, con `vi.spyOn(logger, 'warn')` y `vi.spyOn(logger, 'error')` (molde: `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:130-143`) | una sola llamada a `warn`, con primer argumento `toEqual({ numero: 4200 })` y el segundo conteniendo «pasó a estar gobernado»; `error` sin llamadas; se restauran los dos | **ROJO: `warn` sin llamadas y `error` con una** |

**Rojo previo (`strict_tdd`):** los casos 1 y 5 se ejecutan y se anotan rojos **antes** de tocar producto; después D-1 y por último D-2. Los casos 2, 3 y 4 nacen verdes —caracterizan lo que no debe cambiar— y su rojo, donde lo hay, se demuestra por mutación (D-5). El informe no tiene claves `motivo` ni `error` de primer nivel (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:56`): por eso el caso 4 discrimina. pg-mem no revierte de verdad, así que ningún caso afirma el estado de las filas tras el rechazo; «no escribió nada» lo sostiene la integración.
### D-4 · Integración, en sitio (el fichero conserva 243 líneas)
- `apps/desk/server/db/migracionConcurrente.integration.test.ts:6` → `import { migrarTicketsAbiertos, MigracionAdelantadaError, type InformeMigracion } from './migracionTicketsAbiertos'`
- `apps/desk/server/db/migracionConcurrente.integration.test.ts:162` → `if (!rb.ok) { expect(rb.error).toBeInstanceOf(MigracionAdelantadaError); expect(rb.error.message).toContain(TEXTO_RECHAZO) }` (misma sangría). Sólo corre con `TEST_DATABASE_URL`: su rojo previo se observa con el PostgreSQL del orquestador o en el CI.
### D-5 · Mutaciones del apply (se restaura siempre; resultado anotado prueba a prueba) — HIPÓTESIS
| Mutación | Prueba que debe ponerse roja |
|---|---|
| **M1** quitar el manejador de la cadena (línea 232) | Casos 1 y 5: `500` |
| **M2** POSICIÓN: ponerlo delante del manejador principal | Casos 1 y 5: `500` (el error ya no encuentra eslabones posteriores) |
| **M3** sin `instanceof`: caza cualquier error | Caso 2: `409` en vez de `500` |
| **M4** no llamar a `next(err)` con los demás | Caso 2, **por agotar el plazo**: la petición queda sin respuesta |
| **M5** devolver la línea 90 a `new Error` | Casos 1 y 5: `500`; y D-4, sólo con `TEST_DATABASE_URL` |
| **M6** otro estado en vez de `409` | Caso 1 |
| **M7** (añadida) quitar el parámetro `next`: aridad 3 | Casos 1 y 5: `500` |

Las seis pedidas tienen prueba. **Los casos 3 y 4 no los pone rojos ninguna, y se dice:** un manejador de error no corre en el flujo normal, así que no puede adelantarse ni al interruptor ni a la negativa; fijan los dos escenarios de la especificación, no una guarda nueva.
### D-6 · `DEPLOY.md:687-691`, en sitio (el fichero conserva 693 líneas)
La línea 687 queda **idéntica**; las otras cuatro, tal cual (se retiran «Lectura de código, no medido por HTTP» y la pregunta abierta a Gerencia):
```text
sin dejar marcadores (RQ-ZS-23; lo fija `apps/desk/server/db/migracionConcurrente.integration.test.ts`, que corre contra PostgreSQL real). La ruta responde `409` con el cuerpo `{ error, motivo: 'otra-ejecucion' }`: `error` dice que otra ejecución
está en curso o acaba de confirmarse y que ésta no escribió nada (lo fija una prueba de ruta, `apps/desk/server/migracionTicketsAbiertosRuta.test.ts`; `decision/migracion-rechazada-responde-409-11-10`). El mensaje interno («pasó a estar gobernado…») queda en el registro del servidor, como aviso.
**Un `409` de éstos no significa que la migración haya fallado**: se comprueba con el paso 4. No es el `409` de la negativa, que trae el informe completo, con `negativa` rellena y `aplicado: false`, sin `error` ni `motivo`, y tampoco escribe (`apps/desk/server/routes/admin.ts:231`).
Si la ejecución llega después de otra ya confirmada, no se rechaza: no encuentra nada que migrar y no escribe. Cualquier otro fallo de la ruta sigue respondiendo `500` con «Error interno» (`apps/desk/server/app.ts:90-92`).
```
### D-7 · Especificación
RQ-ZS-23 MODIFIED sustituye el último bloque de la spec viva (`openspec/specs/zoho-sync/spec.md:1368-1419` en `a1fb802`) por el delta ya escrito (`openspec/changes/rechazo-migracion-409/specs/zoho-sync/spec.md`, 86 líneas): crece por el final y no desplaza a nadie. No hay capacidad nueva (R-2 no aplica). Los casos 1 a 4 de D-3 son sus cuatro escenarios nuevos.
### D-8 · Reglas
- **Regla 13 / mutación 3.** Decisiones del cliente: **ninguna**; `apps/desk/src` no llama a la ruta. El `409` lo impone el servidor en el último eslabón de `apps/desk/server/routes/admin.ts:232` y lo prueba D-3. **Mutación 1:** la posición del eslabón nuevo es M2.
- **Mutación 4.** Cinco ficheros en el apply, todos en sitio o al final (tabla de estimación). Barrido hecho en el worktree por nombre completo, con un segundo pase de abreviadas y de «línea N» en prosa:

| Cita | Dónde | Caso | ¿Sigue siendo cierto? |
|---|---|---|---|
| `apps/desk/server/db/migracionTicketsAbiertos.ts:90` | `openspec/specs/zoho-sync/spec.md:1371` en `a1fb802`, `:1399` (VIVO) | A | Sí: la línea 90 sigue lanzando ese error. **Matiz:** el texto ya no está escrito en la línea 90 sino en la clase del final; el delta conserva la redacción. Lo valora el verify |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:84-90` | `openspec/specs/zoho-sync/spec.md:1380` en `a1fb802` (VIVO) y el delta | A | Sí: `UPDATE` y comprobación siguen en 84 a 90 |
| «la línea 90», en prosa | `apps/desk/server/db/migracionConcurrente.integration.test.ts:185` (VIVO, comentario) | A | Mismo matiz. No se edita: el encargo fija sólo las líneas 6 y 162 |
| La línea 90, los rangos que acaban en ella o la cruzan (84 a 90, 63 a 95, 68 a 94) y «línea 90» en prosa | Archivo `2026-10-11-migracion-una-sola-ejecucion` (`proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, `archive-report.md`, su delta) y el `verify-report.md` de `2026-10-04-migracion-tickets-abiertos` | B | Ciertas de su fecha, incluida «M1 quitar el `throw`»; no se tocan |
| `apps/desk/server/routes/admin.ts:222-232` | `DEPLOY.md:680` (VIVO) | A | Sí: la ruta sigue ocupando 222 a 232 |
| `apps/desk/server/routes/admin.ts:222-232`, `:234`, y el rango 214 a 232 | Archivados: `design.md` y `verify-report.md` de `2026-10-11-migracion-una-sola-ejecucion`; `verify-report.md` de `2026-10-04-migracion-tickets-abiertos` | B | Y siguen ciertos: ni el rango ni la importación tardía se mueven. A `apps/desk/server/routes/admin.ts:1` no la cita nadie |
| `DEPLOY.md:688-690` | `docs/sdd/TRASPASO_2026-10-08.md:405` (VIVO) | C al fusionar | «Hasta que se fusione… describe el `500`»: caduca por su propia condición. **No se edita aquí**; lo actualiza quien fusione |
| `apps/desk/server/db/migracionConcurrente.integration.test.ts:162` | Sólo la propuesta de este cambio | A | Sí |

**Ficheros vivos que hoy dicen `500` o «genérico» y este cambio NO edita:** `docs/sdd/TRASPASO_2026-10-08.md:403-405` (fila de arriba) y `openspec/config.yaml:4565-4566` y `:4570` (pregunta y consecuencia de una decisión fechada el 2026-10-11: caso B). Los que dejan de decirlo los reescribe el propio cambio: `DEPLOY.md:688-690` (D-6) y la nota de `openspec/specs/zoho-sync/spec.md:1391-1393` (D-7, al archivar). El comentario de cabecera de la ruta (`apps/desk/server/routes/admin.ts:219`) nombra sólo el `409` de la negativa: no pasa a ser falso, y el nuevo lo documenta el comentario del manejador.

## Cambios por fichero y estimación
Inserciones + borrados, y longitud final: `apps/desk/server/db/migracionTicketsAbiertos.ts`, 1 + 1 en sitio y 11 nuevas al final → 106 líneas · `apps/desk/server/routes/admin.ts`, 3 + 3 en sitio y 11 nuevas al final → 266 · `apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, ~62 nuevas al final → ~258 · `apps/desk/server/db/migracionConcurrente.integration.test.ts`, 2 + 2 en sitio → 243 · `DEPLOY.md`, 4 + 4 en sitio → 693 · `openspec/specs/zoho-sync/spec.md`, al archivar: se mide, no se estima (el delta tiene 86 líneas y el bloque vivo 52).
Apply: unas **104** líneas contra el techo de 800; no se parte. **Capas de prueba:** ruta sobre pg-mem (D-3), integración con PostgreSQL real (D-4) y la unitaria que ya fija el texto (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:174`, sin tocar).

## Matriz de amenazas, despliegue y preguntas abiertas
N/A — no hay shell, subprocesos, automatización de VCS ni integración de procesos; no se añade ni se mueve ninguna ruta, sólo cambia el estado de una respuesta. Sin migración: revertir el commit devuelve el `500`.
- [ ] ¿Pasan `npm run typecheck` y `npm run lint` (margen 0) con el manejador en la cadena, la `const` tras su uso y la clase tras el suyo? Hipótesis: sí; alternativas en el enfoque, D-1 y D-2.
- [ ] ¿Devuelve `vi.spyOn(logger, 'warn')` las llamadas con el registro en silencio (`apps/desk/server/util/logger.ts:5-6`)? Hipótesis: sí, como ya ocurre con `info` (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:132`).
