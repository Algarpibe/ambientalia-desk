# Diseño — `persistencia-adjuntos` (1G-02, `cierra: si`)

Entradas: `proposal.md` (S-a a S-c, S-1 a S-15, CA-1 a CA-10, §10; vinculantes) y la delta `specs/zoho-sync/spec.md` (RQ-ZS-30 a RQ-ZS-33),
escrita en paralelo: si un nombre o un código de aquí choca con ella, manda la delta. Líneas medidas en este worktree, sobre `d26ef8a5`.
Adjunto: fila → ¿pendiente? (`stat`) → `zohoFetch(zoho_href)` → bytes contra `size` → temporal → `rename` → `storage_path`. Ruta: fila por
`zoho_href` → copia válida ⇒ disco; si no ⇒ Zoho y una línea de log.

## D1 · Lo nuevo, en `apps/desk/server/adjuntos/`; lo citado por número, sólo en sitio
Cuatro módulos nuevos en la App, la única con el volumen (S-a): `almacen.ts` (directorio, nombre, guarda de ruta, estado de la copia y
`guardarAdjunto`), `servir.ts` (lectura de la ruta), `rellenoAdjuntos.ts` (motor del relleno) y `guardadoAlSincronizar.ts` (gancho de la
pasada), y `apps/desk/server/routes/rellenoAdjuntos.ts`; entran en `apps/desk/tsconfig.server.json:12`, y el worker no los importa sin cruzar
de `apps/hub-sync` a `apps/desk`. Rechazados: `packages/zoho-sync/src/` (al alcance del worker) y las rutas dentro de
`apps/desk/server/routes/admin.ts` (desplaza citas, D1 de 1G-01). Ningún fichero muy citado inserta ni borra líneas (D14).

## D2 · La unidad común: `guardarAdjunto(d, fila)` (S-5, S-6)
Orden fijo, sin tocar el disco hasta (5): (1) `fila.id` contra `NOMBRE_ADJUNTO = /^\d+$/`, si no `fallido:id` sin pedir; (2) `zoho_href`
contra `RUTA_ADJUNTO_ZOHO`, copia literal de la guarda de `apps/desk/server/routes/attachment.ts:17`, si no `sinRuta` sin pedir; (3)
`zohoFetch(zoho_href)` (D4); (4) `Buffer.from(await res.arrayBuffer())` —cuerpo cortado ⇒ `fallido:red`— y tamaño: con `size`, distinto de
`Number(size)` ⇒ `fallido:tamano`; sin `size`, contra `Content-Length` si viene sin `Content-Encoding` (**hipótesis:** Zoho no comprime
este recurso); sin ninguno, se guarda con `comprobado: false`; (5) `writeFile(tmp, bytes, { flag: 'wx' })`, `tmp = .<id>.<pid>.<randomUUID>.tmp`
en `dir`, que nunca casa `^\d+$`; (6) `rename(tmp, join(dir, id))`; (7) sólo entonces `UPDATE attachments SET storage_path=$1 WHERE id=$2`.
`name` no interviene. Un fallo de (5) o (6) borra el temporal y lanza `ErrorDisco` con el `code` de Node (`ENOSPC`, `EACCES`, `ENOENT`),
que corta (S-8); uno de (7) es `fallido:base` y el fichero sin `storage_path` vuelve a ser pendiente. No crea el directorio: sin volumen,
`ENOENT` corta en vez de escribir donde se pierde al redesplegar. Rechazado volcar en flujo al temporal: ahorra hasta 35 MB de pico, pero
un error de `pipeline` mezcla red (sigue) y disco (corta). `fs` es inyectable sólo para provocar fallos a mitad en las pruebas (M2, P4).

## D3 · Pendientes, orden y comprobación de la copia (S-4)
`SELECT a.id, a.size, a.zoho_href, a.storage_path, t.number FROM attachments a JOIN tickets t ON t.id = a.ticket_id ORDER BY t.number, a.id`
(columnas en `packages/zoho-sync/src/db/schema.sql:51-55`; `size` es `bigint`: siempre `Number(size)`); sin ticket no se ve y queda fuera.
`estadoCopia(dir, fila)`: `storage_path` nulo o distinto del id ⇒ `sinCopia` (un `../secreto` nunca se une a una ruta); si no,
`stat(join(dir, id))`: `ENOENT` o no fichero ⇒ `ausente`; con `size` y otro tamaño ⇒ `otroTamano`; si no, `presente`; otro error, `ErrorDisco`.
Pendiente = no `presente`; sin directorio válido, todo. Sólo se abre `join(dir, <id ^\d+$>)`: nada fuera del directorio, nunca un temporal.
La lista se fija al lanzar y el `stat` va justo antes de pedir: lo guardado entretanto por otra vía cuenta «ya presente».

## D4 · `429`, pausas, cortes y orden de las guardas (S-7, S-8)
Por respuesta: `429` ⇒ espera `pausa429Ms` (`PAUSA_429_MS`, `packages/zoho-sync/src/conversaciones.ts:23`) y repite la MISMA petición hasta
`REINTENTOS_429` (`:24`), agotados ⇒ `corte`; `404` ⇒ `ausente`; `!res.ok` ⇒ `fallido:http`; `zohoFetch` que lanza ⇒ `fallido:red`. Molde
`apps/desk/server/rellenoConversaciones.ts:87-97`, no `apps/desk/server/measure.ts:39`, que reintenta sin tope. `429` y `404` son disjuntos:
su orden relativo no es observable y no se declara probado; sí que los dos van antes de `!res.ok`, que los incluye (P3). Pausa `pausaMs`
(`PAUSA_ENTRE_TICKETS_MS`, `:26`) antes de cada petición salvo la primera (molde `:159-160`). `corte` y `ErrorDisco` cortan con `cortadoEn`
y `motivoCorte` (`'429'` o `'disco'`); antes del primero, `stat(dir)`: si falla, corte sin llamar a Zoho. `motivoPrimerFallo` sólo lleva
rutas de la API con ids numéricos o el `code` de Node, nunca la ruta de disco.

## D5 · El gancho al sincronizar: `trasGuardar`, una función que sólo pasa la App (S-9)
La pasada periódica gana `trasGuardar(ticketIds)`, opcional, llamado AL FINAL con los ids cuyas conversaciones acaba de guardar; lo añade
`conGuardadoDeAdjuntos(op, config, { zohoFetch, db })` (nuevo) SÓLO si `guardarAdjuntosAlSincronizar === true` y hay directorio válido:

| Línea | Hoy | Queda |
|---|---|---|
| `packages/zoho-sync/src/conversaciones.ts:34` | `conversaciones?: { …; pausa429Ms?: number }` | añade `; trasGuardar?: (ticketIds: string[]) => Promise<void>` |
| `:149`, `:150`; `:154` | parámetros de `crearPasadaConversaciones`; `let pedidoAlguno = false` | añaden `trasGuardar`; `…; const guardados: string[] = []` |
| `:163` | `await guardarYReflejar(…)` | `…; guardados.push(id)` (si guardar lanza, el id no entra) |
| `:173` | `    }` (cierre del `for`) | `    } if (guardados.length > 0) await trasGuardar?.(guardados)?.catch(…)`, `catch` de `sync.ts:433` |
| `packages/zoho-sync/src/sync.ts:66` | `crearPasadaConversaciones({ …, pausa429Ms: … })` | añade `, trasGuardar: conversaciones.trasGuardar` |
| `apps/desk/server/index.ts:15`; `:23` | importaciones; `conversaciones: opcionesConversaciones(config)` | añade la de `./adjuntos/guardadoAlSincronizar`; `conGuardadoDeAdjuntos(opcionesConversaciones(config), config, { zohoFetch, db: pool })` |

- **Worker:** `apps/hub-sync/src/hub-sync.ts:21` no pasa `conversaciones`: sin pasada no hay gancho; ya lo fija
  `apps/hub-sync/src/hubSyncSinConversaciones.test.ts:43-48`. **Apertura:** `syncConversations` (`packages/zoho-sync/src/sync.ts:183-191`)
  llama a `guardarYReflejar` sin pasar por la pasada y nunca lee `trasGuardar`. **Interruptor:** lo lee la App; `createSync` sólo reenvía la
  función y sigue sin leer interruptores de `config` (S-1b, `packages/zoho-sync/src/conversaciones.ts:28-32`); sin la periódica no hay pasada.
- **Tope `TOPE_ADJUNTOS_POR_CICLO = 20` peticiones.** 1,07 MB por adjunto (2.602 MB / 2.422, propuesta §2.4, dato de persona) y 3,5 por
  ticket con adjuntos (2.422 / 684): ~6 tickets, ~21 MB y 3 s de pausas frente a 180.000 ms (`packages/zoho-sync/src/config.ts:88`). El peor
  caso, 20 × 35 MB, alarga el ciclo (**hipótesis:** decenas de segundos); `apps/desk/server/index.ts:86` evita el solape, y en la cadena de
  `apps/desk/server/index.ts:88` las alarmas van antes que `syncRecent`.
- **El ciclo no se rompe:** `crearGuardadoAlSincronizar` nunca rechaza (todo en `try`/`catch`) y la llamada lleva su `catch`; `429` o
  `ErrorDisco` cortan sólo ese guardado. Tras un corte por `429` de conversaciones, `conversaciones.ts:166` salta la `:173`: no se descarga.
- **Relleno en marcha:** sin cerrojo; temporal con `randomUUID`, `rename` atómico en el mismo directorio (**hipótesis** en el Linux del
  contenedor), `UPDATE` idempotente y `stat` antes de pedir: como mucho, una descarga duplicada. Rechazado un cerrojo común (pasar una
  instancia de `index.ts` a `createApp`, `apps/desk/server/app.ts:27-32`). **Memoria (S-7):** un `Set` de ids con `404` o `fallido:tamano` en
  el cierre de `crearGuardadoAlSincronizar`, creado una vez en `index.ts:23`. Rechazados: el gancho por ticket (sin borde de ciclo no hay
  tope) y recoger los ids en `apps/desk/server/index.ts:88` (línea citada; la App no sabe qué guardó la pasada).

## D6 · `GET /api/attachment`: la copia local primero (S-10, S-11)
`requireAuth` (`apps/desk/server/routes/attachment.ts:14`) y la guarda (`:17-20`) quedan idénticas y antes de todo (P1). Tras la `:20`:
`const copia = await buscarCopia(db, dir, path)` y `if (copia.tipo === 'local') return servirCopia(res, copia)`; la petición a Zoho
(`:21` en `d26ef8a5`) pasa a `try { zres = await zohoFetch(path) } catch (e) { registrarCaida(copia, 'sin respuesta'); throw e }`, seguida de
`registrarCaida(copia, zres.status)`; `:22-30` en `d26ef8a5` no cambian. `buscarCopia` busca `WHERE a.zoho_href = $1` con `LEFT JOIN` a
`tickets` para el número (`ORDER BY a.id LIMIT 1`); motivos, en orden: `sin fila` (id: el último número del `path`), `sin directorio` y los
de D3. `servirCopia`: tipo base de `content_type` en minúsculas si casa `^[a-z0-9.+-]+\/[a-z0-9.+-]+$`, si no `application/octet-stream`
(un salto de línea haría lanzar a `setHeader`); `inline` sólo para `image/png|jpeg|gif|webp|bmp` y `application/pdf`, `attachment` el resto
(HTML y SVG incluidos), con `filename="<ASCII; comillas, barras y no ASCII a _>"` y `filename*=UTF-8''<encodeURIComponent, más ' ( ) *>`
(RFC 5987); `nosniff` explícito aunque `helmet` lo ponga (`apps/desk/server/app.ts:37`); `Content-Length` del `stat` y `pipeline(…, res)`
con `createReadStream`, sin cargar 35 MB (un fallo a mitad llega al manejador, que mira `headersSent`, `apps/desk/server/app.ts:91`).
`registrarCaida`: UNA línea `logger.warn({ adjunto, ticket, motivo, estadoZoho }, …)`, sin `name` ni `path`. La ruta no llama a nada que
escriba. En sitio, en la ruta: `:4` (importación), `:8` (`dir: string | null` en `deps`) y `:10`; y `apps/desk/server/app.ts:58`.

## D7 · Configuración y directorio (S-1)
`packages/zoho-sync/src/config.ts:66`, antes del `}`: `rellenoAdjuntosHabilitado: boolean`, `guardarAdjuntosAlSincronizar: boolean` y
`adjuntosDir: string`, con su nota; `:125`, antes del comentario: `rellenoAdjuntosHabilitado: env.RELLENO_ADJUNTOS_HABILITADO === 'true'`,
`guardarAdjuntosAlSincronizar: env.GUARDAR_ADJUNTOS_AL_SINCRONIZAR === 'true'` y `adjuntosDir: env.ADJUNTOS_DIR || ''`. No se valida en
`loadConfig`, que carga también el worker (`apps/hub-sync/src/hub-sync.ts:17`): `dirAdjuntos(valor, dist = path.resolve(process.cwd(), 'dist'))`,
con la `dist` de `apps/desk/server/index.ts:52`, da la ruta resuelta, o `null` si está vacía, no es absoluta o `path.relative(dist, valor)`
es `''` o no empieza por `..` ni es absoluta. La llaman `app.ts:50` y `conGuardadoDeAdjuntos`; arnés, `appHarness.ts:46` y `:49`: `false`, `false`, `''`.

## D8 · Motor del relleno: estado y resumen (contrato, S-2, S-3, S-12)
```ts
type Motivo = 'id' | 'tamano' | 'http' | 'red' | 'base'
interface EstadoRellenoAdjuntos { enMarcha: boolean; terminado: boolean; cortadoEn: number | null; motivoCorte?: '429' | 'disco'; error?: string
  desde: number | null; limite: number | null; aRecorrer: number; pedidos: number; peticiones: number; vistos429: number; bytes: number
  cuentas: { guardados: number; yaPresentes: number; ausentes: number; sinRuta: number; sinTamanoComprobable: number; fallidos: Record<Motivo, number> }
  ausentes: { adjunto: string; numero: number }[]; fallidos: { adjunto: string; numero: number; motivo: Motivo }[]
  motivoPrimerFallo?: string; inicio?: string; fin?: string }   // ids y números de ticket; nunca datos de cliente
crearRellenoAdjuntos(d: { zohoFetch; db: Queryable; dir: string | null; pausaMs?; pausa429Ms?; fs?; registrar? }) ⇒ { lanzar({ desde?, limite? }):
  { lanzada: boolean; estado }; estado(): EstadoRellenoAdjuntos; recuento({ desde? }): Promise<{ pendientes; bytes; mb; sinTamano; sinRuta; yaPresentes }> }
```
Molde `apps/desk/server/rellenoConversaciones.ts:139-153`: uno por `createApp`; `enMarcha` ANTES del primer `await`; con una pasada en marcha,
o con `dir` nulo (deja `error` nombrando `ADJUNTOS_DIR`: defensa bajo la ruta), `{ lanzada: false }`. Por adjunto, desde `number >= desde`:
`fallido:id`, `sinRuta`, `yaPresentes` o pedirlo; `limite` cuenta adjuntos PEDIDOS; un `zohoFetch` envuelto cuenta `peticiones` y `vistos429`
(molde `:65-70`); `registrar` (`logger.info`, molde `:48`) deja UNA línea al final; `mb` = bytes / 1.048.576. El gancho, una por ciclo.

## D9 · Rutas de administración y cableado
`apps/desk/server/routes/rellenoAdjuntos.ts`, molde exacto de `apps/desk/server/routes/rellenoConversaciones.ts`: el `POST` lleva `requireAuth(db)`,
`requireSuperAdmin` (`apps/desk/server/auth/middleware.ts:26-29`) e `interruptorAdjuntos(habilitado, hayDir)`: con `limite` distinto de `'0'`,
cerrado ⇒ `403` que nombra `RELLENO_ADJUNTOS_HABILITADO`, y abierto sin directorio ⇒ `403` que nombra `ADJUNTOS_DIR`, los dos antes de validar
(B antes que C, P2); después, `entero` (molde `:26`) o `400`, `limite=0` ⇒ `recuento` (molde `:39`) y si no, `lanzar`. El `GET`: rol y
`estado()`, nunca lanza ni depende del interruptor (molde `:46-48`). `apps/desk/server/app.ts`, en sitio: `:9` y `:22`, importaciones; `:50`,
`adjuntosDir = dirAdjuntos(config.adjuntosDir)` y `crearRellenoAdjuntos({ zohoFetch, db, dir: adjuntosDir })`; `:57`, el registro con
`habilitado: config.rellenoAdjuntosHabilitado === true` y `hayDir: adjuntosDir !== null`; `:58`, el `dir` de D6.

## D10 · `DEPLOY.md` §22 y sus pruebas
Tras `DEPLOY.md:912`, `## 22. Adjuntos en el volumen propio (1G-02, …)` con tres apartados `###` (`ADJUNTOS_DIR`, `RELLENO_ADJUNTOS_HABILITADO`,
`GUARDAR_ADJUNTOS_AL_SINCRONIZAR`), cada uno con **Qué enciende:**, **Qué se rompe si se pone mal:** y su línea de entorno vacía; los
interruptores, **Nace cerrado** (`=== 'true'`, `packages/zoho-sync/src/config.ts:125`); el directorio, sin valor por defecto y rechazado en
`dist/`. Pasos P-1 (volumen montado), P-2 (`df -h`; si no alcanza, se para: cuesta dinero) y P-3 (Copia previa de `desk-db`; abrir;
`?limite=0`; `?limite=20` y `GET` hasta `terminado`; la completa; `?desde=<cortadoEn>`; resumen al analista). La fija
`apps/desk/server/deployRellenoAdjuntos.test.ts` (nuevo). La §22 pone en rojo `apps/desk/server/deployRellenoConversaciones.test.ts:25`
(`seccion` llega al final): en sitio, `:19` acota hasta `## 22. ` (molde `apps/desk/server/deployConversaciones.test.ts:20`), `:25` añade que
la §22 va tras la §21 y `:10` y `:22` dejan de decir «es la última»; así, quitar «Copia previa de `desk-db`» de la §21 sigue en rojo aunque la
§22 la lleve (regla de mutación 2). `.env.example` no se toca (P-5).

## D11 · `debt.md` §1, cerrado en sitio (S-13)
`debt.md:572` añade «— CERRADO por `persistencia-adjuntos` (1G-02)»; `:582` (hoy «no lo guarda») dice que sirve primero lo local, más allá de
S-13 por la regla de mutación 4; `:585`, de «❌ Falta» a «✅ Hecho»; `:597-598` remiten al relleno, al guardado periódico y a la §22. Mismas líneas.

## D12 · Pruebas (strict TDD: rojo antes de cada línea de producción)
pg-mem + `migrate` (rutas con `apps/desk/server/testing/appHarness.ts`), `fs.mkdtemp` en `os.tmpdir()` por prueba, `zohoFetch` falsa.

| Fichero (nuevo salvo que se diga) | Lote | Qué fija |
|---|---|---|
| `apps/desk/server/adjuntos/almacen.test.ts` y `rutaAdjunto.test.ts` | L1 | D2, D3: CA-1 a CA-4, sin `size`, `ErrorDisco`, `dirAdjuntos`; H5: una tabla de rutas contra `RUTA_ADJUNTO_ZOHO` y contra el literal leído de `attachment.ts` |
| `apps/desk/server/adjuntos/servirLocal.test.ts`; `packages/zoho-sync/src/config.test.ts` (al final) | L2 | D6: sin Zoho, cabeceras, HTML/SVG, cinco motivos con log sin `name`, `../secreto`, temporal, no escribe, P1; D7: sólo `'true'` abre |
| `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` | L3 | D4, D8: orden, `desde`, `limite`, `404`, `429`, `500`, disco, dos `lanzar`, `dir` nulo, resumen; esperas con `setTimeout` falso |
| `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts`; `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` | L4 | `createSync` real: tope, ticket no tocado, interruptores, memoria, corte por `429`, gancho que lanza; la apertura no llama a `trasGuardar` |
| `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts`; `apps/desk/server/deployRellenoAdjuntos.test.ts` | L5 | `401`/`403` de rol, los dos `403`, `limite=0` libre y sin Zoho, `400`, el `GET` no lanza; D10 |

## D13 · Mutaciones y posiciones (M0 = suite verde; `perl -i -pe '… if $. == N'` por CRLF; restaurar con `git diff` vacío y `file`)

| Id | Mutación | Rojo esperado |
|---|---|---|
| M1 | `=== 'true'` → `!== 'false'` en `config.ts:125`, un interruptor cada vez | `config.test.ts`; `deployRellenoAdjuntos.test.ts` |
| M2 | nombre desde `name`; aparte, `writeFile` directo al nombre final | «`name` con `../` no influye»; `writeFile` inyectado que escribe la mitad y lanza deja final |
| M3 | sin comparar con `size`; servir sin comparar tamaño; la ruta guarda lo que trae de Zoho | «bytes de menos»; «`4004` cae a Zoho»; «la ruta no escribe» |
| M4 | `syncConversations` llama a `trasGuardar`; aparte, `hub-sync.ts:21` pasa `conversaciones` | «la apertura no descarga»; `hubSyncSinConversaciones.test.ts:43-48` |
| M5 | no cortar ante `429` agotado (relleno; aparte, gancho) | «`429` siempre corta y no pide el siguiente» |
| M6 | `name` en la línea de caída; aparte, en el resumen | CA-9 en `servirLocal.test.ts` y `rellenoAdjuntos.test.ts` |
| M7 | ficheros vigilados: quitar «**Qué se rompe si se pone mal:**» de un apartado de la §22; aparte, `\d+` → `\w+` en `attachment.ts:17` o en la copia de `almacen.ts` (divergen) | `deployRellenoAdjuntos.test.ts`; `rutaAdjunto.test.ts` |
| M8 | sin tope; sin memoria; `sync.ts:66` sin `trasGuardar` | «hasta el tope»; «no se repite»; «la pasada trae los pendientes» |
| M9 | fichero vigilado: `index.ts:23` vuelve a `conversaciones: opcionesConversaciones(config)` (sin el gancho) | `apps/desk/server/opcionesConversaciones.test.ts:25` |
| P1 | buscar la copia antes de `requireAuth` o de la guarda | sin sesión y copia válida ⇒ `401` sin consultar `attachments`; `zoho_href` `/tickets/1/x` con copia ⇒ `400` |
| P2 | el interruptor después de validar | cerrado y `limite=abc` ⇒ `403`, no `400`; abierto sin directorio, igual |
| P3 | el `429` después de `!res.ok`; aparte, el `404` | `429`, `200` ⇒ guardado; `404` ⇒ ausente, no `fallido:http` |
| P4 | `storage_path` antes del `rename` | `rename` inyectado que falla ⇒ `storage_path` nulo |
| P5 | `enMarcha` tras el primer `await`; aparte, `guardados.push` antes de `guardarYReflejar` | de dos `lanzar`, uno lanza; ticket cuyo guardado lanza no llega a `trasGuardar` |

## D14 · Contabilidad de líneas (regla de mutación 4) y regla invariable 13
Sólo en sitio (inserciones = borrados, `git diff --numstat`): `packages/zoho-sync/src/conversaciones.ts` (`:34`, `:149`, `:150`, `:154`,
`:163`, `:173`; 6/6), `packages/zoho-sync/src/sync.ts` (`:66`; 1/1), `packages/zoho-sync/src/config.ts` (`:66`, `:125`; 2/2),
`apps/desk/server/index.ts` (`:15`, `:23`; 2/2), `apps/desk/server/app.ts` (`:9`, `:22`, `:50`, `:57`, `:58`; 5/5), `appHarness.ts` (`:46`,
`:49`; 2/2), `deployRellenoConversaciones.test.ts` (`:10`, `:19`, `:22`, `:25`; 4/4) y `debt.md` (`:572`, `:582`, `:585`, `:597`, `:598`; 5/5).
*Añadido por el orquestador:* `apps/desk/server/opcionesConversaciones.test.ts:25` exige hoy `conversaciones: opcionesConversaciones(config)` en `index.ts:23` y D5 lo rompe por construcción: en L4 se edita en sitio (1/1) para exigir `conversaciones: conGuardadoDeAdjuntos(opcionesConversaciones(config), config,` (fichero vigilado; M9).
Al final: `DEPLOY.md`, `config.test.ts`. Con inserción, `apps/desk/server/routes/attachment.ts` (≈ +7/−4; nada la cita por número fuera de
esta tanda, y lo de esta tanda tras la `:20` lleva `en d26ef8a5`). Nuevos: cinco módulos y siete pruebas. Sin tocar: `repo.ts`, `mappers.ts`,
`rows.ts`, `schema.sql`, `opcionesConversaciones.ts`, `routes/admin.ts`, `admin.test.ts` (su guarda SSRF, `apps/desk/server/admin.test.ts:436-444`,
sigue en verde), `migrate.test.ts`, `apps/hub-sync`, `.env.example`; `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` ya cuentan
1G-02 «en curso» y cambian en el archive. Barrido por lote: `conversaciones.ts:163` sigue siendo la llamada de la pasada a `guardarYReflejar`,
y `config.ts:125`, la lectura `=== 'true'` de §18 a §22. **Regla 13:** nada toca `apps/desk/src`; el cliente sigue pidiendo `/api/attachment`
con el `zoho_href` de `rowToMessage` (`apps/desk/src/components/Adjuntos.tsx:21`, `packages/zoho-sync/src/db/mappers.ts:251-254`); local o
Zoho, cabeceras, rol e interruptores los decide el servidor: cero decisiones nuevas del cliente.

## D15 · Partición y tamaño
i1 planificación · i2-i6 L1-L5 · i7 verify · i8 archive. Medida: `git diff --shortstat --no-renames` contra la partida más `wc -l` de lo
nuevo sin trackear, `apply-progress.md` incluido (≈30 por lote). Cada lote cierra con `npm run typecheck` y su prueba focal (`npx vitest run`
con los ficheros de la tabla); en verify, `npm test` entero y `npm run lint -- --max-warnings 165`.

| Lote | Producción | Ficheros de la prueba focal | Estimado | ×1,8 |
|---|---|---|---|---|
| L1 | `almacen.ts` | `apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` | ~390 | ~700 |
| L2 | `servir.ts`, `attachment.ts`, `config.ts`, `app.ts` (`:9`, `:50`, `:58`), `appHarness.ts` | `apps/desk/server/adjuntos/servirLocal.test.ts apps/desk/server/admin.test.ts packages/zoho-sync/src/config.test.ts` | ~330 | ~595 |
| L3 | `rellenoAdjuntos.ts` | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` | ~380 | ~685 |
| L4 | `conversaciones.ts`, `sync.ts`, `index.ts`, `guardadoAlSincronizar.ts` | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts packages/zoho-sync/src/conversacionesTrasGuardar.test.ts packages/zoho-sync/src/conversaciones.test.ts apps/hub-sync/src/hubSyncSinConversaciones.test.ts` | ~350 | ~630 |
| L5 | `routes/rellenoAdjuntos.ts`, `app.ts` (`:22`, `:50`, `:57`), §22, `debt.md`, `deployRellenoConversaciones.test.ts` | `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts apps/desk/server/deployRellenoAdjuntos.test.ts apps/desk/server/deployRellenoConversaciones.test.ts apps/desk/server/deployConversaciones.test.ts` | ~300 | ~540 |

**Matriz de amenazas:** las cinco filas, N/A: sin rutas tipo documentación, selección de repositorio, estado de commit o push ni órdenes
de PR. El límite real, sistema de ficheros y guarda anti-SSRF, va en D2, D3, D6, M7 y P1.

## Riesgos y puntos abiertos
- Delta en paralelo: rutas, módulos, motivos y tope son propuesta del diseño; si la delta dice otra cosa, `sdd-tasks` alinea con ella. i1:
  propuesta (170) + delta (157) + este diseño rondan 530 líneas; `tasks.md` debe dejar el intento de planificación bajo 800.
- Pico de 35 MB en memoria por adjunto (**hipótesis:** holgura del contenedor); `size` inexacto ⇒ todo `fallido:tamano` (S-6); lo que la
  pasada no trae (corte, tope) espera al relleno; en Windows, `rename` sobre un fichero abierto puede dar `EPERM` (**hipótesis**).
- Ningún criterio de parada de la «Regla de ejecución» de `CLAUDE.md`: el alcance no cambia; dinero (P-2) y datos de producción (P-3) quedan
  en pasos de persona tras interruptores cerrados; no se contradice ninguna decisión registrada.
