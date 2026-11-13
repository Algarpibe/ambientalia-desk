# Diseño — `cliente-prestado-conexion-cortada`

Construye RQ-ZS-63 a RQ-ZS-67 (`specs/zoho-sync/spec.md`) con los hallazgos H-1 a H-4 y los supuestos S-1 a S-8 de `proposal.md`, y fija D-1 a D-14 (§13).
Todo lo citado por línea se comprobó leyendo el worktree sobre `4d7aad75`; lo demás lleva «hipótesis». La mecánica de `pg` 8.21.0 y `pg-pool` 3.14.0, que no está
versionada, va en prosa. Sin variable de entorno; sin tocar `pool.ts`, los seis sitios del §2.3 de la propuesta, `migrate.ts`, `schema.sql` ni `.env.example`. Ninguna
sentencia crea tablas: la regla de diseño de calificar el esquema (`openspec/config.yaml:3128`) no tiene a qué aplicarse. Regla 13: nada en `apps/desk/src`.

**Finales de línea, medidos.** Todos los ficheros que se tocan están en CRLF en el worktree, renglón a renglón: `conexionPerdida.ts` (45 de 45), `conexionPerdida.test.ts`
(210), la integración (187), el hijo (78), la guarda (68) y **también `DEPLOY.md` (1.186 de 1.186)**, contra lo que decía el encargo («`DEPLOY.md` es LF»): LF es su forma
en el índice (`.gitattributes:29`, `* text=auto`), no en el árbol. Lo editado y lo añadido conserva el CRLF de cada fichero; mutar y restaurar, con `perl -i -pe`, nunca `sed -i`.

## 1 · Enfoque en una línea

`escucharConexionPerdida` engancha, además del oyente del pool de E-285, una función nueva al final de su módulo que, desde los eventos `connect`, `acquire` y `release`
del pool, pone en cada cliente un oyente de `error` que sólo habla si el cliente está prestado y sólo una vez por cliente. Se prueba con unitarias sobre `EventEmitter`
falsos y con la integración en proceso hijo contra PostgreSQL 17, donde el hijo pasa a imitar `apps/desk/server/db/transaccion.ts:16-27` tras el corte.

## 2 · El módulo (RQ-ZS-63, RQ-ZS-64)

**Un solo cambio en sitio**, `packages/zoho-sync/src/db/conexionPerdida.ts:44`: `return pool` pasa a `return escucharClientePrestado(pool, registrar)`. **Lo demás, al final**,
detrás de la línea 45, la última hoy. Una pieza por línea física, para que cada mutación del §5 sea un `perl … if $. == N`:

```ts
// E-290: pg-pool quita su oyente de reposo al prestar un cliente, y un `error` sin oyente tumba el proceso.
export const TEXTO_CLIENTE_PRESTADO = 'Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue'

export function lineaClientePrestado(err: unknown): string {          // molde de lineaConexionPerdida: pura, nunca lanza
  try { return `${TEXTO_CLIENTE_PRESTADO} — ${mensajeDe(err)}${codigoDe(err)}` } catch { return `${TEXTO_CLIENTE_PRESTADO} — (sin detalle)` }
}

// Declaración, no `const`: el hoisting la hace visible en la línea 44.
function escucharClientePrestado<P extends EventEmitter>(pool: P, registrar: Registrar): P {
  const prestados = new WeakSet<object>()
  const registrados = new WeakSet<object>()
  pool.on('connect', (cliente: EventEmitter) => {
    cliente.on('error', (err: unknown) => {
      if (!prestados.has(cliente)) return   // filtro (H-3): en reposo habla el oyente del pool
      if (registrados.has(cliente)) return  // deduplicación (H-1): un corte da dos errores por cliente
      registrados.add(cliente)
      try { registrar(lineaClientePrestado(err)) } catch { /* un registro que lanzara dentro del emit tumbaría el proceso */ }
    })
  })
  pool.on('acquire', (cliente: object) => { prestados.add(cliente) })
  pool.on('release', (_err: unknown, cliente: object) => { prestados.delete(cliente) })
  return pool
}
```

- **Saneado (RQ-ZS-64):** `lineaClientePrestado` reutiliza `mensajeDe` y `codigoDe` (`packages/zoho-sync/src/db/conexionPerdida.ts:14-24`), que pasan por `sanear` (`:9-12`): sólo
  `message` y `code`, URL sustituidas, una línea física y el código sólo si es válido (`packages/zoho-sync/src/db/conexionPerdida.ts:6`). Nunca el objeto de error, al que `pg-pool` cuelga el cliente.
- **Por qué la línea 44 y no la 43.** La M-1 de E-285 comenta la línea entera de `packages/zoho-sync/src/db/conexionPerdida.ts:43`, y así la citan los artefactos archivados
  (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:61`). Con el enganche en la 43, repetirla quitaría también el oyente nuevo; en la 44 la 43
  queda idéntica a `4d7aad75`, y la M-1 nueva es devolver la 44 a su texto de `4d7aad75`. Ninguna cita nombra la 44: las que hay son a `packages/zoho-sync/src/db/conexionPerdida.ts:3`, `:15`, `:27`, `:35` y `:43`.
- **El oyente de cliente se pone una vez y no se quita nunca.** Si un error llega tarde, con el cliente ya liberado, calla en vez de lanzar. `WeakSet` porque no retiene
  al cliente: el pool lo descarta y se recoge. `release` llega con `(err, client)` también en `release(true)` (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:86`).
- **Orden de eventos (lo medido, no un contrato):** `connect` sale antes de `acquire` para un cliente nuevo, así que el oyente existe antes del primer préstamo. En reposo,
  `pg-pool` conserva su oyente interno, que emite el `error` del pool (línea de E-285); el nuestro salta antes y calla por el filtro. Un `pool.query()` también presta
  (`acquire`/`release`) pero pone su propio oyente: H-4 no midió ningún evento de cliente, e I-3 lo fija.
- **Tipado:** `P extends EventEmitter`, como en `packages/zoho-sync/src/db/conexionPerdida.ts:35`. El `on` que se usa es el de `EventEmitter`, cuyo oyente admite cualquier
  argumento, así que anotar `cliente: EventEmitter` u `object` no pide aserciones; el `Client` de `pg` extiende `EventEmitter` en su tipo. **Hipótesis** que cierra el
  typecheck de L1, como en E-285. Cero `any`: el techo de 165 avisos del lint no tiene holgura (`eslint.config.js:15`, `:31`).
- **Lo que no hace:** no reintenta, no reconecta, no descarta; no toca `pool.ts` (`packages/zoho-sync/src/db/pool.ts:6` y `:10` ya pasan por `escucharConexionPerdida`);
  no añade oyente de `error` al pool, así que U-1 sigue contando uno (`packages/zoho-sync/src/db/conexionPerdida.test.ts:35`).

## 3 · Pruebas unitarias U-11 a U-19 (strict_tdd)

Al final del fichero de pruebas unitarias, detrás de su línea 210; sus citas (`packages/zoho-sync/src/db/conexionPerdida.test.ts:30`, `:44`, `:61`, `:66`, `:74`, `:93`, `:109`, `:165`,
`packages/zoho-sync/src/db/conexionPerdida.test.ts:184-209`) no se mueven. El import de `packages/zoho-sync/src/db/conexionPerdida.test.ts:7` gana en sitio `lineaClientePrestado, TEXTO_CLIENTE_PRESTADO`. Un ayudante `montar(registrar)`
envuelve un pool `EventEmitter` y crea clientes `EventEmitter` falsos que emiten `connect` y, si se pide, `acquire`. Sin base.

| Id | Qué fija | Escenario |
|---|---|---|
| U-11 | Prestado (`connect` + `acquire`): `cliente.emit('error', <57P01>)` no lanza; una llamada, un argumento, igual a `<TEXTO_CLIENTE_PRESTADO> — <mensaje> [57P01]`; `cliente.listenerCount('error')` es 1 | RQ-ZS-63.1, 64.1 |
| U-12 | En reposo (sólo `connect`): no lanza y ninguna llamada; si después el pool emite su `error`, como hace `pg-pool`, exactamente una, la de E-285 | RQ-ZS-63.2 |
| U-13 | Liberado (`acquire` y `release(undefined, cliente)`): no lanza, ninguna llamada | RQ-ZS-63.3 |
| U-14 | Dos errores del mismo prestado (`57P01` y «Connection terminated unexpectedly» sin `code`): una llamada, la del primero | RQ-ZS-63.4 |
| U-15 | Dos clientes prestados, un error cada uno: dos llamadas | RQ-ZS-63.5 |
| U-16 | Sin `code`, sin corchetes; ninguno de los dos textos fijos contiene al otro | RQ-ZS-64.1, 64.2 |
| U-17 | Mutación 2: `err.client` falso y mensaje con URL con contraseña-testigo; la línea no lleva testigos ni `postgres://`, con un solo argumento | RQ-ZS-64.3 |
| U-18 | `registrar` que lanza: `cliente.emit('error')` no lanza | RQ-ZS-64.4 |
| U-19 | Los tres pools reales (`createPool` desk y public, `createPoolFromUrl`; molde U-1): `connect` y `acquire` de un cliente falso, y su `error` no lanza | RQ-ZS-63.1 por `pool.ts` |

**Orden del rojo.** Toda U-n empieza por `expect(() => cliente.emit('error', …)).not.toThrow()`, así que el rojo previo es «lanza» —el defecto— y no un símbolo que falta.
**Hipótesis:** vitest deja en `undefined` un nombre importado que el módulo aún no exporta y el fichero carga; si no carga, el apply añade primero sólo la constante al final
del módulo, lo anota y repite el rojo.

## 4 · Integración (RQ-ZS-65): el hijo e I-1 a I-6

### 4.1 · El hijo: en sitio, y lo nuevo al final

**La cita encontrada.** Fuera de este cambio, una sola cita por línea: `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:37`, desde
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:122` (la lectura de `TEST_DATABASE_URL`). Insertar detrás de la 37 no la rompería; sí movería el
bloque `prestado` que citan la propuesta y la spec delta, que pasan a caso B de todos modos (§9). **Se elige en sitio y una función al final** (D-4): la regla del
repositorio es no insertar salvo al final, la cita de nuestros artefactos sigue apuntando al mismo bloque anclada en `4d7aad75`, y el coste son tres renglones con dos sentencias.

En sitio, sin mover ninguna línea:
- `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:2` gana `PoolClient`; `:12` y `:14` ganan `'prestado-en-curso'` y `'prestado-url'`; `:26` da `createPoolFromUrl` también a `prestado-url`.
- `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:50` gana `let tras: Promise<void> = Promise.resolve()`; `:51` abarca los tres modos prestados; `:67` pasa a `await cortado; await tras`.
- `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:54` sustituye su comentario («el cliente NO se libera») por `tras = comoEnTransaccion(modo, cliente, cortado)`.
- Al final, detrás de la línea 78, `async function comoEnTransaccion(modo, cliente: PoolClient, cortado)`: declaración, que el hoisting hace visible en la 54.

`comoEnTransaccion` imita `apps/desk/server/db/transaccion.ts:16-27` después del corte:
1. Nada más empezar (antes de «listo»): `terminado`, la promesa del evento `end` del cliente; en `prestado-en-curso`, además, `SELECT pg_sleep(30)` sin esperar, con sus
   dos ramas emitidas como paso `consulta` (molde de `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:60-65`).
2. `await cortado`; después, espera acotada (`ESPERA_BAJA_MS`) a `terminado` (D-11).
3. Salvo en `prestado-en-curso`, la siguiente consulta de la operación, `SELECT 1`, emitida como paso `siguiente` (`rechazada`, `codigo`, `mensaje`).
4. `ROLLBACK` con sus dos ramas, emitido como paso `rollback` (el `.catch` de `apps/desk/server/db/transaccion.ts:23`).
5. `cliente.release()`. Siguen `baja` y `despues`, comunes a todos los modos.

**Por qué esperar `end` (D-11).** `pg_terminate_backend` devuelve `true` al enviar la señal, no cuando el cliente ha leído el `57P01`, y `cortarOcupado` escribe «cortado»
sin esperar a que el backend desaparezca (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:155-157`). Sin la espera, `SELECT 1` podría salir antes de que llegara
el `57P01`; entonces ese error iría a la consulta y no al evento, la línea diría «Connection terminated unexpectedly» con un solo error, y M-3 no se distinguiría.
**Hipótesis:** `pg` emite `end` al cerrarse el socket, después de sus errores; si no llega en el plazo, el hijo sigue y las aserciones de I-4 lo enseñan.

### 4.2 · El padre

En sitio:
- `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:6` gana `TEXTO_CLIENTE_PRESTADO`; `:151` amplía el tipo de `modo` de `cortarOcupado` a los dos modos nuevos.
- `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:11` («I-3 e I-4 son caracterización») pasa a decir que I-3 lo es e I-4 a I-6 son requisito (E-290).
- `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:136`, `:145` y `:170` comprueban las dos clases a la vez: `expect([lineasDelRegistro(h), lineasPrestado(h)])`
  igual a `[[<línea de E-285>], []]` (I-3: `[[], []]`). Sin esto, quitar el filtro (M-2) no pondría rojas I-1 ni I-2: la línea de E-285 seguiría siendo una, y la de más
  llevaría el otro texto.

**I-4, en sitio en `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:176-186`**, las mismas once líneas: tres de comentario (E-290: el cliente prestado ya está
cubierto, y por qué espera `end`), el título («el proceso sigue»), seis de cuerpo y el cierre. El cuerpo:
- `const { h, codigo, pid } = await cortarOcupado('prestado', 'idle in transaction')`;
- salida 0, y el stderr sin «Unhandled 'error' event»;
- `[lineasDelRegistro(h), lineasPrestado(h)]` igual a `[[], ['<TEXTO_CLIENTE_PRESTADO> — terminating connection due to administrator command [57P01]']]`;
- la secuencia de pasos con su rechazo: `listo`, `siguiente` rechazada, `rollback` rechazada, `baja`, `despues`;
- `baja` con total 0, y `despues` con un pid numérico distinto del cortado.

**Al final del cuerpo del `describe`**, justo antes de su cierre (la línea 187, la única que se mueve; ninguna cita la nombra, ni completa ni abreviada: barrido en el
worktree), van I-5, I-6 y el ayudante `const lineasPrestado = (h: Hijo) => h.stderr().split(/\r?\n/).filter((l) => l.includes(TEXTO_CLIENTE_PRESTADO))`. Que se defina
después de las pruebas que lo usan no crea zona muerta temporal: vitest evalúa entero el cuerpo del `describe` al recoger y ejecuta los `it` después, y TypeScript no
objeta un `const` leído dentro de una función diferida.

| Id | Modo del hijo | Estado al cortar | Qué afirma |
|---|---|---|---|
| I-1, I-2 | `reposo-desk`, `reposo-url` | `idle` | Sin regresión (CA-5): una línea de E-285 y ninguna del texto nuevo. Verdes antes y después; rojas con M-2 |
| I-3 | `en-curso` | `active` | Ninguna de las dos (H-4) |
| I-4 | `prestado` | `idle in transaction` | §4.2 (CA-2). **Rojo previo:** salida 1 |
| I-5 | `prestado-en-curso` (H-2, CA-3) | `active` | Salida 0 sin «Unhandled…»; `consulta` rechazada con `57P01`; `rollback` rechazada; ninguna línea de E-285 y **una** del texto nuevo, **hipótesis** `<TEXTO_CLIENTE_PRESTADO> — Connection terminated unexpectedly`, sin código (se fija lo observado y se anota); `baja` 0; pid nuevo. **Rojo previo:** salida 1 |
| I-6 | `prestado-url` (CA-4; el molde de `apps/hub-sync/src/hub-sync.ts:53-55`) | `idle in transaction` | Lo de I-4 con `createPoolFromUrl`. **Rojo previo:** salida 1 |

Anti falso verde: los tres modos nuevos pasan por `cortarOcupado`, que conserva la espera acotada del estado y el `true` de `pg_terminate_backend`
(`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:155-156`). Cada `it` mantiene su plazo de 60 s; el peor caso dentro del hijo, contado desde su
temporizador (espera del estado, 10 s de `end` y 10 s de `baja`), cabe en su límite de 40 s, y lo que sigue a «cortado», en los 30 s que el padre da a la salida.

## 5 · Mutaciones (CA-6) y restauración

Antes de mutar: el fichero en verde se pasa al índice (`git add`) y se anota su sha256. Se muta una línea con `perl -i -pe '… if $. == N'`, se corre lo afectado (la
integración con el contenedor del §7) y se anota el rojo por prueba y aserción. Se restaura con la sustitución inversa y se comprueba `git diff --quiet -- <fichero>`
contra el índice, el mismo sha256 y CRLF en todos los renglones.

| Id | Mutación, en una línea | Se ponen rojas | Siguen verdes |
|---|---|---|---|
| M-1 | `packages/zoho-sync/src/db/conexionPerdida.ts:44` vuelve a `return pool` (su texto en `4d7aad75`) | U-11 a U-19; I-4, I-5 e I-6 (salida 1) | U-1 a U-10; I-1 a I-3 |
| M-2 | comentar la línea del filtro `!prestados.has(cliente)` | U-12 y U-13; I-1 e I-2 (una línea del texto nuevo de más) | U-11, U-14, U-15 |
| M-3 | comentar la línea `registrados.has(cliente)` | U-14; I-4 e I-6 (dos líneas) | I-5 (un solo error) |
| M-4 | comentar la línea `pool.on('release', …)` | U-13 | la integración: el cliente liberado se descarta |
| M-5 | la línea del `try` pasa a `registrar(lineaClientePrestado(err))` a secas | U-18 | — |
| M-6 | en `lineaClientePrestado`, `JSON.stringify(err)` en lugar de `mensajeDe(err)` | U-17 (la prevista) y las de línea exacta | — |
| M-7 | el oyente de cliente llama a `lineaConexionPerdida` | U-11 y U-16; I-4 e I-6 (línea de E-285 donde no toca) | — |
| DEPLOY-1 | devolver «sigue muriendo» a `DEPLOY.md:1183` (texto en un solo renglón; la forma partida la cubre una copia de la guarda) | la guarda: `sin «sigue muriendo»` | — |
| DEPLOY-2 | cambiar el texto fijo en la línea medida del bloque final de la §27 | la guarda: el texto y su línea medida | — |
| DEPLOY-3 | quitar «no se corta» de `DEPLOY.md:1186` | la guarda: `no se corta` | — |

M-1 a M-7 van en L1; DEPLOY-1 a DEPLOY-3, en L2, sobre el `DEPLOY.md` real (regla de mutación 2).

## 6 · `DEPLOY.md` §27 y su guarda (RQ-ZS-67)

**En sitio, `DEPLOY.md:1179-1186`: ocho renglones que siguen siendo ocho.** Cambian la 1179, la 1182, la 1183, la 1185 y la 1186; la 1180, la 1181 (la consulta en curso, sin línea: H-4) y la 1184, no.
- `DEPLOY.md:1179`: el oyente del pool cubre lo que está en reposo y, desde E-290, un oyente por cliente cubre el prestado por `pool.connect()` (su línea, al final de la sección).
- `DEPLOY.md:1182-1183`: la viñeta pasa a lo que sigue sin cubrirse del cliente prestado, **su operación**: si el servidor corta esa conexión el proceso ya no muere, pero
  «**su operación falla**: su transacción no se confirma» y quien la pidió recibe el error de base de siempre (**hipótesis** para las rutas de la App); nada la reintenta.
  Conserva `pool.connect()` y la cita a `apps/desk/server/db/transaccion.ts:16-26`. No usa la frase «sigue muriendo» en ninguna forma, tampoco negada.
- `DEPLOY.md:1185-1186`: la precaución de la §26 **sigue vigente** con su razón corregida (ya no que el proceso muera, sino que la operación de un usuario falla y su
  transacción no se confirma); conserva el `application_name`, la medición en el contenedor y «**no se corta**: se pasa al analista».

**Al final del fichero**, detrás de la 1186, sin título `## ` nuevo (la §27 sigue siendo la última): `### La línea del cliente prestado (E-290)`, que dice que sale por el
mismo canal, una por cliente aunque el cliente dé dos errores, distinta de la de E-285; la línea medida por I-4 en un bloque de código, como `DEPLOY.md:1163-1165`; y qué
hacer: nada, salvo que se repita, y si alguien informa de una operación fallida a esa hora, esa es la causa. Unas diez líneas.

**La guarda.** Su lista de cadenas está en `apps/desk/server/deployPoolConexionCortada.test.ts:31-32`, no en `:34-35` como decía el encargo: `:34` cierra el `for` y `:35` es el `return`.
- `apps/desk/server/deployPoolConexionCortada.test.ts:4`, en sitio: el import gana `TEXTO_CLIENTE_PRESTADO` y `lineaClientePrestado`. `:11` (comentario), en sitio: «el límite» pasa a «la cobertura» del cliente prestado y la precaución de la §26.
- `apps/desk/server/deployPoolConexionCortada.test.ts:32`, en sitio: gana `'su transacción no se confirma'`, `'no se corta'`, `TEXTO_CLIENTE_PRESTADO` y `LINEA_MEDIDA_PRESTADO`.
- `apps/desk/server/deployPoolConexionCortada.test.ts:35`, en sitio: el `return` añade la falta `sin «sigue muriendo»` si la sección, con los espacios colapsados (`replace(/\s+/g, ' ')`), contiene «sigue muriendo».
- Al final, detrás de la línea 68: `export const LINEA_MEDIDA_PRESTADO = lineaClientePrestado(<Error 57P01 con el mensaje de I-4>)`, construida con el código (molde de
  `apps/desk/server/deployPoolConexionCortada.test.ts:18-20`); sin zona muerta, porque `faltasSeccion27` sólo se llama dentro de los `it`. Y un `describe` con copias ensuciadas:
  «sigue\n  muriendo» devuelta y **partida** por un salto de línea → `['sin «sigue muriendo»']`; sin el texto fijo → `[TEXTO_CLIENTE_PRESTADO, LINEA_MEDIDA_PRESTADO]`;
  sin «su transacción no se confirma» y sin «no se corta» → cada una, su falta.

**Por qué esas cadenas (D-14).** «Su operación falla» no discrimina: va dentro del texto fijo (S-1). «Sigue muriendo» está partida hoy entre `DEPLOY.md:1182` y `:1183`, así que
un `includes` sobre el texto crudo no la vería nunca: se colapsan los espacios en vez de buscar «muriendo» a secas, que prohibiría cualquier uso legítimo y no resiste mejor
un reajuste de renglones. Las pruebas de hoy siguen verdes: `apps/desk/server/deployPoolConexionCortada.test.ts:46-50`, `:52-56`, `:58-62` y `:64-67`, porque el texto nuevo no contiene
`salvo que se repita`, `pool.connect()` ni el texto de E-285, y la `## 28.` de `apps/desk/server/deployPoolConexionCortada.test.ts:65` sigue dando sólo su falta. La guarda
de la §26 corta en la `## 27. ` (`apps/desk/server/deployArranqueEstricto.test.ts:23`) y no se ve afectada.

## 7 · Medición y la pregunta de la §26

**Contenedor (S-5).** El del orquestador, `postgres:17-alpine` en el puerto 55432:
`TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/postgres npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`. El arnés crea y borra su
base propia (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:114` y `:129`) y anota `SHOW server_version` (`:113`). El apply no para ese contenedor; si no está, levanta
otro desechable en otro puerto con `--rm`. Nunca producción. En el CI la integración corre porque fija la variable (`.github/workflows/ci.yml:47`).

**Rojo previo, antes de tocar `conexionPerdida.ts`:** con el hijo y el padre ya cambiados, I-4, I-5 e I-6 en rojo por salida 1, e I-1 a I-3 en verde; después, U-11 a U-19
en rojo por «lanza». Se anotan prueba, aserción y valor recibido. Luego el módulo, y todo en verde.

**La pregunta de la §26** (§7 de la propuesta). El diseño fija qué se mide; la respuesta la escribe el verify y la traslada Supervisión a E-285:
- **La razón escrita deja de ser cierta:** I-4 (cliente prestado con transacción abierta, en `idle in transaction`: la forma del pid raíz de la §26 cuando es de la App), I-5
  (con una consulta en curso) e I-6 (pool del worker) salen con 0 y el pool vuelve a servir con otro pid.
- **La razón corregida, medida y no supuesta:** en los tres, la siguiente consulta y el `ROLLBACK` rechazan: la transacción del usuario no se confirma.
- **Sin medir, y queda dicho:** que la ruta de la App responda su error de siempre (hipótesis); el arranque, si el pid raíz es la puesta al día
  (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`), que la §26 da por detenido con salida 1; PostgreSQL 17.11 de producción, el `application_name` de la App allí y
  que EasyPanel enseñe stderr.

## 8 · Ficheros

| Fichero | Acción | Lote |
|---|---|---|
| `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts` | En sitio las líneas 2, 12, 14, 26, 50, 51, 54 y 67; `comoEnTransaccion` al final | L1 |
| `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` | En sitio las 6, 11, 136, 145, 151, 170 y 176 a 186; I-5, I-6 y `lineasPrestado` antes del cierre | L1 |
| `packages/zoho-sync/src/db/conexionPerdida.test.ts` | En sitio la 7; U-11 a U-19 al final | L1 |
| `packages/zoho-sync/src/db/conexionPerdida.ts` | En sitio la 44; lo del §2 al final | L1 |
| `apps/desk/server/deployPoolConexionCortada.test.ts` | En sitio las 4, 11, 32 y 35; constante y copias al final | L2 |
| `DEPLOY.md` | En sitio las 1179, 1182, 1183, 1185 y 1186; el bloque del §6 al final | L2 |
| Propuesta y spec delta de este cambio | Anclajes en sitio del barrido (§9) | L2 |
| `pool.ts`, los seis sitios, `pool.test.ts`, `migrate.ts`, `schema.sql`, `.env.example`, los seis ficheros de Supervisión | Sin cambios | — |

## 9 · Barrido de citas (regla de mutación 4, en L2)

Ninguna línea citada se mueve: sólo la de cierre del `describe` de la integración, que nadie cita. Lo que cambia es **lo que afirman** algunas, y se decide caso a caso:
- **Caso A, siguen ciertas:** las que nombran un sitio que conserva su papel, entre ellas las del archivo a la I-4 como lugar
  (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/archive-report.md:21`) y a la línea 43 como la del oyente del pool.
- **Caso B, ciertas en `4d7aad75` y falsas desde este cambio, en nuestros artefactos:** `openspec/changes/cliente-prestado-conexion-cortada/proposal.md:15` (la I-4 «fija» que
  el proceso muere), `openspec/changes/cliente-prestado-conexion-cortada/proposal.md:58` («hoy sólo pone el oyente del pool»), `:148` (la razón escrita de la §26) y `:168`,
  y `openspec/changes/cliente-prestado-conexion-cortada/specs/zoho-sync/spec.md:98` (el modo `prestado` no libera el cliente). Se les añade «en `4d7aad75`» en la misma
  línea física, sin moverla. Las que piden el cambio, como `openspec/changes/cliente-prestado-conexion-cortada/specs/zoho-sync/spec.md:91` y `:161`, son caso A.
- **El archivo de `pool-conexion-cortada`** son informes fechados y el detector no lo recorre (molde §10): se listan en `apply-progress.md`, no se editan.
- **Supervisión:** el barrido no encontró citas de los seis ficheros a estas líneas; si aparecieran en `main`, se listan, no se editan.
- **Segundo pase humano** de la forma abreviada en los ficheros que citan los seis tocados: el detector no la bloquea.

## 10 · Lotes para `sdd-tasks`

| Lote | Contenido | Estimado bruto (ledger) | Con ×1,8 sobre el código |
|---|---|---|---|
| L1 | Hijo y padre de la integración, con su rojo; U-11 a U-19, con su rojo; módulo; verde; typecheck y lint; M-1 a M-7 | código ~250 (hijo ~44, integración ~57, unitarias ~117, módulo ~30) + `apply-progress.md` ~130 = **~380** | **~580** |
| L2 | Guarda, con su rojo contra el `DEPLOY.md` de hoy; §27 con lo medido en L1; DEPLOY-1 a DEPLOY-3; barrido §9; las cinco comprobaciones de CA-10 | ~80 (guarda ~46, `DEPLOY.md` ~20, anclajes ~12) + progreso ~90 = **~170** | **~235** |

Cada cambio en sitio cuenta dos en el ledger (borrado e inserción); por eso el código sale en ~330 y no en las ~200 de la propuesta. Orden obligado: L2 escribe en la §27 lo
medido en L1. Cada lote cierra con `git diff --shortstat --no-renames` contra su partida más `wc -l` de lo nuevo sin trackear, y registra esa cifra.

## 11 · Matriz de amenazas

El producto no cambia enrutado, órdenes de shell, subprocesos, VCS/PR ni clasificación de ejecutables. Sólo la prueba lanza un subproceso, con el arnés de E-285 sin
cambios: argv fijo, sin shell, `cwd` y `env` controlados, URL de una base desechable creada por la propia prueba.

| Frontera | Aplicabilidad |
|---|---|
| Rutas con aspecto de documentación | N/A: no se clasifica ni ejecuta ningún fichero por su nombre |
| Selección de repositorio Git | N/A: ningún `git` en código ni en pruebas (los del §5 son del protocolo manual) |
| Estado de commit, de push y órdenes de PR | N/A: sin automatización de VCS ni de PR |

## 12 · Despliegue, vuelta atrás y riesgos

Sin migración, columna ni variable; cambia el servidor (App y worker), no el bundle del cliente. P-1 de la propuesta: mismo despliegue que E-285. Vuelta atrás: revertir el commit.
- **Mecánica de `pg-pool`** (orden de eventos, oyente de reposo, `end` del cliente): lo medido, no un contrato. I-1 a I-6 lo cazan si una versión lo cambia.
- **Carrera del corte** en el hijo: la cubre D-11; si `end` no llegara, I-4 se pondría roja con su motivo, no verde en falso.
- **El lint no tiene holgura** (165 contra 165): cualquier aviso nuevo rompe CA-10.
- **El texto de I-5 es hipótesis** hasta medirlo; se fija lo observado.
- **El encargo decía `DEPLOY.md` LF y las líneas 34-35 para la lista de la guarda**: medido CRLF y las líneas 31-32 (cabecera y §6). Si el orquestador midió otra cosa, manda la medida en el apply.
- Sin preguntas que bloqueen.

## 13 · Decisiones y supuestos del diseño (a la lista semanal)

| Id | Decisión o supuesto | Por qué, y lo descartado | Cómo se deshace |
|---|---|---|---|
| D-1 | Lógica al final del módulo y un solo enganche en sitio, en la línea 44 | Fijada por el orquestador; la 44 y no la 43 para no cambiar la M-1 archivada de E-285. Descartado: tocar los seis sitios o `pool.ts` (todos los pools salen de `pool.ts`) | Devolver la 44 a `return pool` y borrar el bloque final |
| D-2 | U-11 a U-19 al final de la prueba unitaria, con pool y clientes `EventEmitter` falsos | Fijada; sin base, rojo «lanza» | Borrarlas |
| D-3 | I-4 reescrita en sitio con sus once líneas; I-1, I-2 e I-3 cuentan las dos clases en sitio; I-5, I-6 y el ayudante, antes del cierre | Fijada; sin la doble cuenta, M-2 no pone rojas I-1 ni I-2 | Devolver I-4 a caracterización (S-7) |
| D-4 | Hijo en sitio y `comoEnTransaccion` al final | Regla de no insertar; la única cita externa (la 37) no se toca. Descartado: un segundo hijo (duplicaría el protocolo) | Otro hijo (S-8) |
| D-5 | La guarda: import y lista en sitio, constante y copias al final | Fijada; la lista está en las líneas 31-32 de la guarda, no en las 34-35 | Otra forma de la guarda |
| D-6 | `DEPLOY.md` en sitio en sus ocho renglones y un bloque `###` al final, en CRLF | Fijada; un `## ` nuevo rompería la «última sección» | Otro reparto del texto |
| D-7 | M-1 a M-7 y DEPLOY-1 a DEPLOY-3, una línea cada una, con `perl` y sha256 | Fijada; una pieza por línea para mutar sin tocar las vecinas | — |
| D-8 | Medición en el contenedor del orquestador (55432); rojo de integración antes del módulo | Fijada (S-5) | Otro contenedor u otra imagen |
| D-9 | **Lotes reordenados:** la integración pasa a L1, delante del módulo | **Cambia la decisión 9 del orquestador**: la decisión 8 pide el rojo de I-4 e I-5 antes de tocar el módulo, y el módulo es de L1. Descartado: medir ese rojo en L2 devolviendo la 44 a `4d7aad75`, porque sería un rojo escrito después del código | Volver al reparto del encargo y medir el rojo con la 44 devuelta |
| D-10 | La §26 se responde con I-4 a I-6 y los rechazos de la operación | Fijada; mide la razón vieja y la nueva | — |
| D-11 | El hijo espera, acotado, el `end` del cliente antes de la siguiente consulta | Sin ella, la línea y el número de errores dependen de una carrera y M-3 no se distingue | Quitar la espera y fijar sólo «una línea, la que salga» |
| D-12 | Dos `WeakSet` y un oyente por cliente que no se quita | No retiene clientes descartados; un error tardío calla | `Set` con borrado en `remove` |
| D-13 | Nombres: `escucharClientePrestado`, `lineaClientePrestado`, `comoEnTransaccion`, `lineasPrestado`, `LINEA_MEDIDA_PRESTADO`; pasos `siguiente` y `rollback` | Paralelos a los de E-285 | Renombrar (nadie los cita) |
| D-14 | La guarda exige «su transacción no se confirma» y «no se corta», y prohíbe «sigue muriendo» con los espacios colapsados | «Su operación falla» va dentro del texto fijo; la frase prohibida está partida en dos renglones | Otras cadenas |
