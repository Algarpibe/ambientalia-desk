# Diseño — `verificacion-completitud` (1G-03, `cierra: si`)

Entradas: `proposal.md` (S-a a S-n, CA-1 a CA-13) y la delta `specs/zoho-sync/spec.md` (RQ-ZS-34 a RQ-ZS-39), que manda si un nombre choca.
Líneas medidas en este worktree, sobre `e9941944`. Flujo: lista de conocidas validada → fase A (listas globales, re-verificación por id) → fase B (por
ticket) → fase C (volumen) → clasificación → veredicto → estado en memoria y UNA línea de log. Zoho, sólo por `soloGet`; PostgreSQL, por `soloSelect`.

## D1 · Lo nuevo, en `apps/desk/server/completitud/`; lo citado por número, sólo en sitio
Ocho módulos nuevos en la App, que tiene el volumen y las rutas de administración: `conocidas.ts` (cargador de `conocidas.json`, datos),
`clasificar.ts`, `comparar.ts` y `veredicto.ts` (puros), `soloLectura.ts` y `lectores.ts` (Zoho y base, sólo lectura), `porTicket.ts` (la fase B de
un ticket) y `verificacion.ts` (motor: estado, fases A y C, continuación, `lanzar`/`recuento`/`estado`); y `apps/desk/server/routes/verificacionCompletitud.ts`.
Rechazados: `packages/zoho-sync/src/` (al alcance del worker, sin volumen ni rutas) y `apps/desk/server/routes/admin.ts` (desplaza citas). Nada en
`apps/desk/src`: el resultado es el `GET` y el cliente no decide nada (regla 13, D16).

## D2 · La lista de conocidas: un fichero de datos y un conjunto CERRADO de reglas en el código (S-j, RQ-ZS-34)
```json
{
  "version": 1,
  "entradas": [
    { "entidad": "tickets", "numeros": [1017], "causa": "…", "entrada": "E-267" },
    { "entidad": "conversaciones", "regla": "conversacionAusenteEnZoho", "causa": "…", "entrada": "DEPLOY.md §19" }
  ]
}
```
**Disposición fija** (la exigen M6 y M7): `{`, `"version": N,` y `"entradas": [` en sus líneas; UNA entrada por línea, con las claves en el orden
`entidad`, `ids`|`numeros`|`regla`, `causa`, `entrada`; `]` y `}` en las suyas. El #1017 va en medio, nunca el último: su coma viaja con su línea, y
borrarla deja JSON válido. `cargarConocidas(texto)` lanza `ErrorLista` con índice, entidad, entrada y campo («entrada 4 (tickets, E-267): falta
`causa`»), sin eco de otro valor que ids. Validez, toda ella: `version` entero ≥ 1; `entidad` de las seis; sólo las claves `entidad`, `causa`,
`entrada` y EXACTAMENTE una de `ids` (cadenas no vacías y sin espacios), `numeros` (enteros > 0, sólo en `tickets`) o `regla`; `causa` no vacía;
`entrada` con la forma `E-<n>` o `DEPLOY.md §<n>`; la pareja `regla`×`entidad` en `REGLAS`, escrito con UNA pareja por línea (`nacidoEnLaApp` ×
tickets, conversaciones, contactos y cuentas; `conversacionAusenteEnZoho` × conversaciones); un id o un número en dos entradas ⇒ inválida, nombrando
las dos. `leerLista: () => string` es SÍNCRONA (`readFileSync` de `new URL('./conocidas.json', import.meta.url)`, molde `apps/desk/server/testing/superficieSaliente.ts:32`),
porque `lanzar` es síncrono y con la lista inválida devuelve `{ lanzada: false }` con el `error`; se lee en cada `lanzar` y `recuento`, nunca al arrancar
(una lista rota no tumba la App). Viaja con `COPY apps ./apps` (`Dockerfile:18`) y corre en fuente con `tsx` (`Dockerfile:29`).
**Contenido inicial, siete entradas.** El #1017 por número, con E-267 (`docs/sdd/ENTRADA.md:2416`). Los adjuntos `495552000057838002` (#925) y
`495552000061185001` (#881), «Zoho responde 404 al pedir su contenido en el relleno de 1G-02», con `DEPLOY.md §22`: ninguna entrada de la bandeja
los nombra (búsqueda del id: sólo este cambio), el dato es de persona (`openspec/changes/verificacion-completitud/proposal.md:64-65`) y la §22 es la
pasada que los dio por ausentes (`DEPLOY.md:983-984`). `nacidoEnLaApp`, una por entidad, con `DEPLOY.md §23`, que la describe (D13);
`conversacionAusenteEnZoho` con `DEPLOY.md §19` (`DEPLOY.md:854-858`). Rechazados: constantes (S-j); una tabla (escribe en producción, propuesta §8); reglas libres.

## D3 · Clasificación: ids, luego herencia, luego reglas
`clasificar` es pura y decide en UNA línea, `return porId(f) ?? porHerencia(f) ?? porRegla(f) ?? SIN_EXPLICAR` (M9, P5, P6). Para cada fila de
diferencia (falta en Desk, falta en Zoho, otro tamaño, volumen): (1) una entrada de su entidad con su id, o con su número en tickets; (2) **herencia**:
si su padre es diferencia del mismo lado —para un adjunto, su conversación y si no su ticket; para conversación e historia, su ticket— copia clase,
causa y entrada y anota `heredadaDe`; (3) una regla: `nacidoEnLaApp` es el ticket con prefijo `app-` (`apps/desk/server/db/ticketFuentes.ts:40-42`;
nunca `source` ni `managed_by_app` del ticket, `apps/desk/server/db/ticketFuentes.ts:32-34`), la conversación con `source <> 'zoho'` (el filtro de
`apps/desk/server/rellenoConversaciones.ts:76`) y el contacto o la cuenta con `managed_by_app` o `source <> 'zoho'`
(`packages/zoho-sync/src/db/schema.sql:4`, `:10`); `conversacionAusenteEnZoho` es la conversación con `ausente_en_zoho_at` no nulo
(`packages/zoho-sync/src/db/schema.sql:852`), y sus adjuntos por herencia; (4) si no, «sin explicar». Las reglas sólo explican «falta en Zoho»; lo que falta en Desk, el otro tamaño y el volumen sólo los explica
un id. Lo concreto gana: con las reglas primero, una regla taparía la causa escrita para un caso y dejaría su entrada «sin uso». La entrada que no
explica ninguna fila sale en `conocidasSinUso` y no toca el veredicto. Un hueco de lista no es diferencia: va aparte, sin clase, y no cuenta.

## D4 · Sólo lectura por construcción, y cada intento de escribir queda contado (CA-10)
`soloLectura.ts`: `soloSelect(db)` rechaza toda sentencia que no empiece por `SELECT` o que lleve un segundo `;`; `soloGet(zohoFetch)`, todo `init`
con `method` distinto de `GET`, con la comprobación en UNA línea. Cada rechazo se REGISTRA —un total y el tipo: la primera palabra en mayúsculas,
`VARIAS` o el verbo; nunca la sentencia ni los parámetros— y después lanza `ErrorEscritura`. El registro es lo que se prueba, no la excepción:
`persistEach` (`packages/zoho-sync/src/sync.ts:126-134`), `ensureAccount` y `ensureContact` (`:89-92`, `:99-107`) se la tragan, y un camino que escribe
por ahí no rompería nada. El informe lleva `escriturasRechazadas` (también en el `GET`) y, con total > 0, el veredicto global es «incompleto» y
`error` vale `escritura`. El motor NO recibe `sync`, cuyas listas escriben mientras leen (`packages/zoho-sync/src/sync.ts:151`, `:166`, `:278-279`).
Los lectores llaman a `zohoFetch(ruta)` sin `init`: ni `method:` literal ni `{ method,`, que clasificaría el barrido de
`apps/desk/server/testing/superficieSaliente.ts:55-57`. El volumen sólo ve `stat`, vía `estadoCopia` (`apps/desk/server/adjuntos/almacen.ts:107-119`).

## D5 · Lectores de Zoho: `429`, luego `404`, luego `!res.ok` (S-i, RQ-ZS-37)
`lectores.ts`: `leerPaginas(f, ruta, params, limite)` y `leerPorId(f, ruta)`, que nunca lanzan (molde `packages/zoho-sync/src/conversaciones.ts:67-93`),
con cada guarda en SU línea y en este orden (P3): `429` ⇒ espera `PAUSA_429_MS` y repite la MISMA petición hasta `REINTENTOS_429`
(`packages/zoho-sync/src/conversaciones.ts:23`, `:24`), agotados ⇒ `corte`; `404` ⇒ `noEsta` por id, error en una lista; `!res.ok` ⇒ error
`<recurso> http <n>`. `zohoFetch` que lanza ⇒ `red`, con el `catch` en una línea; cuerpo que no es JSON ⇒ `json`; `200` vacío o `204`, página vacía.
Por id, vivo con `isDeleted` o `isTrashed` ⇒ `noEsta` (molde `apps/desk/server/rellenoConversaciones.ts:45`, `:99`). `429` y `404` son disjuntos y su
orden relativo no es observable: lo probado es que los dos van antes de `!res.ok`, que los incluye. Los motivos son de un conjunto cerrado y NUNCA
llevan `e.message`: el de `JSON.parse` cita el cuerpo, y `leerConversaciones` mete el mensaje en su error (`packages/zoho-sync/src/conversaciones.ts:91`),
que aquí se traduce a `conversaciones red`. A `leerConversaciones` se le pasa SIEMPRE `{ reintentos429: REINTENTOS_429, pausa429Ms }`: por omisión
no reintenta (`packages/zoho-sync/src/conversaciones.ts:70`, `reintentos429 = 0`).

| Recurso | Ruta y paginación | Lector |
|---|---|---|
| Tickets | `/tickets` y `/tickets/archivedTickets` con `departmentId`, `from=1`, `limit=100`, `from += 100` (`packages/zoho-sync/src/sync.ts:139`, `:146-157`, `:161`) | `leerPaginas` |
| Contactos, cuentas | `/contacts` (`packages/zoho-sync/src/sync.ts:271`) y `/accounts` (**hipótesis**, S-f), igual | `leerPaginas` |
| Por id | `/tickets/{id}`, `/contacts/{id}`, `/accounts/{id}` | `leerPorId` |
| Conversaciones | tal cual: `from=0`, que Zoho trata como 1 y repite la última de cada página (`docs/sdd/ENTRADA.md:2333`); se cuenta por id único | `leerConversaciones` |
| Adjuntos del ticket | `/tickets/{id}/attachments`, `from=1`, `limit=100` (**hipótesis**, S-e) | `leerPaginas` |
| Historia | `/tickets/{id}/History`, `from=1`, `limit=50` (`packages/zoho-sync/src/sync.ts:31`, `:74-83`) | `leerPaginas` |

Tope de 200 páginas por lista (molde `TOPE_PAGINAS_CONVERSACIONES`), error `tope`; toda lista se deduplica por id. Pausa `PAUSA_ENTRE_TICKETS_MS`
(`packages/zoho-sync/src/conversaciones.ts:26`) antes de cada petición salvo la primera (molde `:159`, aquí por petición: ~2.350, unos 6 min de pausas).
Un `zohoFetch` envuelto cuenta `peticiones` y `vistos429` POR ENTIDAD (molde `apps/desk/server/adjuntos/rellenoAdjuntos.ts:89-94`).

## D6 · El id de la historia: se exporta en sitio, no se copia (CA-4)
En `packages/zoho-sync/src/db/history.ts:8`, `function eventId(` pasa a `export function eventId(` (L3): 1/1, ninguna línea se mueve; se importa de
`@ambientalia/zoho-sync/db/history` (`packages/zoho-sync/package.json:2`). Cada evento de Zoho se compara por `eventId(ticketId, evento)`, el mismo
que escribe `upsertHistoryEvent` (`packages/zoho-sync/src/db/history.ts:17`). Rechazada la copia: dos implementaciones de la misma noción (molde H5)
pedirían una prueba que las enfrente y seguirían pudiendo divergir.

## D7 · Fase A: listas globales y re-verificación por id (RQ-ZS-35)
Tickets (departamento ∪ archivados, por id, con `ticketNumber` como número), contactos y cuentas, frente a `SELECT id, number FROM tickets` y
`SELECT id, source, managed_by_app` de `contacts` y de `accounts`. Lo que está en Zoho y no en Desk ⇒ «falta en Desk». Cada id de Desk que la lista
no trae se pide por id ANTES de clasificarlo, en un bucle de UNA línea (P4; molde `packages/zoho-sync/src/sweep/sweep.ts:65-75`): `noEsta` ⇒ «falta
en Zoho»; vivo ⇒ «hueco de lista»; error ⇒ `errores` y la entidad «incompleto». Un ticket `app-` NO se pide por id, por la excepción de RQ-ZS-35
(`openspec/changes/verificacion-completitud/specs/zoho-sync/spec.md:54`): su id no es de Zoho (`apps/desk/server/db/ticketFuentes.ts:30`); sale
«falta en Zoho» y sólo lo explica la regla, sin la que es «sin explicar». Una lista que falla (no `429`) deja su entidad «sin comparar»; la de
tickets, además, las tres por ticket: sin ella no se sabe qué ticket está en los dos lados. Un `429` agotado corta con `cortadoEn: { fase: 'A',
numero: null }` y se reanuda relanzando sin `desde`, que rehace la A entera (`openspec/changes/verificacion-completitud/specs/zoho-sync/spec.md:127`).

## D8 · Fase B: por ticket, sólo los que están en los dos lados (RQ-ZS-36)
Los tickets de Desk presentes en Zoho (en la lista o como hueco), por `number` y desde `desde`; `limite` cuenta tickets y, alcanzado, corta con
`motivoCorte: 'limite'` en el siguiente. Por ticket, sus tres lecturas de Zoho y, justo después, sus filas de `conversations` (`id, source,
ausente_en_zoho_at`), `attachments` (`id, size, conversation_id`) y `ticket_history` (`id`). **Conversaciones**: `compararIds(zohoConv, deskConv)`,
en una línea (M2); el recuento declarado no se lee (E-266). **Adjuntos**: `unirPorId(deConversaciones, deSegunda)`, en una línea (M12), contado una
vez; tamaño normalizado como el *mapper* (`a.size ? Number(a.size) : null`, `packages/zoho-sync/src/db/mappers.ts:117`), el de la conversación primero;
casados con otro tamaño ⇒ `distintoTamano` con los dos; `bytes` por lado, la suma de lo comparado. **Historia**, por `eventId`. El error de una fuente
es error del ticket en esa entidad (`{ entidad, numero, motivo }`) y esa comparación no se hace; el de conversaciones arrastra a adjuntos.
`porTicket` acumula en local y sólo devuelve filas si termina: un `429` agotado da `{ tipo: 'corte' }`, nada de ese ticket entra en el informe y
`desde=<numero>` lo pide entero. En el bucle, la línea del corte va antes de la de `comparados++` (P8). **Tickets de un solo lado.** Del que sólo
está en Desk (el `app-`, el #1017) no se pide nada: sus hijos de Desk salen por id en «falta en Zoho» de su entidad y heredan su clase. Del que sólo
está en Zoho no se piden los hijos: cada entidad por ticket lo lista en `noEvaluados`, con su número y la clase del ticket, y cuenta «sin explicar»
si el ticket lo es. Rechazado pedirlos: tres peticiones o más por ticket para enumerar lo que ya se sabe que falta.

## D9 · Fase C: `desk.attachments` frente al volumen
Tras la B, cada fila de `SELECT a.id, a.size, a.storage_path, t.number FROM attachments a JOIN tickets t ON t.id = a.ticket_id ORDER BY t.number, a.id`
(molde de `apps/desk/server/adjuntos/rellenoAdjuntos.ts:69`, que además lee `zoho_href`) pasa por `estadoCopia(dir, fila, fs)`, en una línea (M12):
`sinCopia`, `ausente` y `otroTamano` son diferencias de `adjuntos.volumen`, sin descargar nada. `dir` nulo (`apps/desk/server/adjuntos/almacen.ts:125-131`)
⇒ volumen «sin comparar», motivo `ADJUNTOS_DIR`; un `ErrorDisco` (`apps/desk/server/adjuntos/almacen.ts:114`) ⇒ «sin comparar» con el `code` de Node,
nunca la ruta. No se acota por `desde` (es local y barato) y no corre con `limite=0`: el recuento no da veredictos sueltos (S-m).

## D10 · Informe en memoria; corte, `desde` y `limite` (S-m, CA-7)
Sin tabla: nada que migrar, `packages/zoho-sync/src/db/migrate.test.ts` intacto, ninguna copia previa. El motor guarda la última pasada cortada en la
B (`'429'` o `'limite'`) con las listas de la A, los tickets por comparar y el informe parcial. `lanzar({ desde })` con `desde` igual a su
`cortadoEn.numero` la CONTINÚA: sin repetir la A, sigue la B, corre la C y funde las filas en el mismo informe, con su `cobertura.desde`. Otro `desde`
—o el mismo tras un redespliegue, que vacía la memoria— es una pasada nueva y parcial: repite la A, hace la B desde `desde` y es «incompleto», nunca
verde; lo decide UNA línea, `completa: faseA && desdeInicial === null && faseB && faseC` (M10). Un `lanzar` sin `desde` descarta la parte guardada.
Así, `?limite=20` y luego `?desde=<cortadoEn>` dan UNA pasada completa. Rechazada la tabla: escribiría en producción lo que ya va al analista (P-3).

## D11 · Veredicto y forma del informe (RQ-ZS-38)
Una sola precedencia, para cada entidad, para las dos partes de adjuntos y para el global: **sin comparar > incompleto > rojo > verde**. «Sin
comparar» si falló su fuente; «incompleto» si tiene errores o su cobertura no es completa; «rojo» si hay algún «sin explicar»; si no, «verde».
Adjuntos es el peor, con esa precedencia, de su parte frente a Zoho y de su volumen. El global no tiene «sin comparar»: en su lugar es «incompleto»,
y lo es también si `cobertura.completa` es falsa, si hay `cortadoEn` o si `escriturasRechazadas.total > 0`, en UNA línea de `veredicto.ts` (M5).
`sinExplicar` se publica siempre. `cobertura.completa` = A sin corte, B desde el principio (o continuada) hasta el último ticket y C corrida. Orden
fijo: entidades en el orden del tipo; ids por longitud y luego texto (`'9'` antes que `'10'`); filas de ticket por número; errores por entidad,
número e id; sin uso, por índice. Dos pasadas iguales difieren sólo en `inicio`, `fin`, `peticiones` y `vistos429` (CA-12).

```ts
type Entidad = 'tickets' | 'conversaciones' | 'adjuntos' | 'historia' | 'contactos' | 'cuentas'; type Estado = 'verde' | 'rojo' | 'incompleto' | 'sin comparar'
interface Fila { id: string; numero?: number; clase: 'conocida' | 'sin explicar'; causa?: string; entrada?: string; heredadaDe?: string; tamano?: { zoho: number | null; desk: number | null } }
interface InformeEntidad { estado: Estado; motivo?: string; enZoho: number; enDesk: number; casan: number; sinExplicar: number; conocidas: number
  faltaEnDesk: Fila[]; faltaEnZoho: Fila[]; huecosDeLista: { id: string; numero?: number }[]; noEvaluados: Omit<Fila, 'id'>[]
  peticiones: number; vistos429: number; distintoTamano?: Fila[]; bytes?: { zoho: number; desk: number }   // estos dos y `volumen`, sólo adjuntos
  volumen?: { estado: Estado; motivo?: string; filas: number; sinCopia: Fila[]; ausente: Fila[]; otroTamano: Fila[] } }
interface Informe { esquema: 1; versionLista: number; departamento: string; veredicto: Exclude<Estado, 'sin comparar'>
  cobertura: { desde: number | null; hasta: number | null; completa: boolean; aComparar: number; comparados: number }
  cortadoEn: { fase: 'A' | 'B'; numero: number | null } | null; motivoCorte?: '429' | 'limite'; entidades: Record<Entidad, InformeEntidad>
  errores: { entidad: Entidad; numero?: number; id?: string; motivo: string }[]; conocidasSinUso: { indice: number; entidad: Entidad; entrada: string }[]
  escriturasRechazadas: { total: number; tipos: string[] }; peticiones: number; vistos429: number }
interface EstadoVerificacion { enMarcha: boolean; terminado: boolean; fase: 'A' | 'B' | 'C' | null; desde: number | null; limite: number | null
  inicio?: string; fin?: string; error?: string; informe: Informe | null }   // sólo ids, números de ticket y recuentos (CA-11)
crearVerificacionCompletitud({ zohoFetch, db, departmentId, dir, leerLista?, pausaMs?, pausa429Ms?, fs?, registrar? })
  ⇒ { lanzar({ desde?, limite? }): { lanzada: boolean; estado }; recuento({ desde? }): Promise<RecuentoVerificacion>; estado(): EstadoVerificacion }
```
Molde `apps/desk/server/adjuntos/rellenoAdjuntos.ts:165-174` (`:171-172`, `:189`), uno por `createApp`: en `lanzar`, la línea de `estado` con `enMarcha: true`
y en la siguiente `void pasada(…)`, ANTES de todo `await` (P7); `estado()` con `structuredClone`. Con una en marcha o la lista inválida, `{ lanzada: false }`; sin
pasada, `{ enMarcha: false, terminado: false, informe: null }`. `error` es un código cerrado (`lista: <mensaje de ErrorLista>`, `escritura`, `base`,
`interno`). `registrar` deja UNA línea al final (molde `apps/desk/server/adjuntos/rellenoAdjuntos.ts:56-59`): estados, recuentos, corte y veredicto, sin ids.
`recuento` (`limite=0`), sin Zoho: recuentos de Desk por entidad (con los `app-` y los tickets por comparar desde `desde`), bytes de adjuntos, la
lista (versión o error) y `peticionesMinimas`: páginas mínimas de las cuatro listas más tres por ticket (**hipótesis**, S-i).

## D12 · Ruta, interruptor y cableado (RQ-ZS-39)
`apps/desk/server/routes/verificacionCompletitud.ts`, molde de `apps/desk/server/routes/rellenoAdjuntos.ts:43-55`, `:19` y `:33`, con la validación
como middleware para que el orden quede en UNA línea (P1, P2): `app.post(RUTA, requireAuth(db), requireSuperAdmin, interruptorVerificacion(habilitado),
validarParametros, asyncHandler(…))`, con `requireSuperAdmin` = `requireAdmin` (`apps/desk/server/auth/middleware.ts:26-29`); el interruptor, con
`limite` distinto de `'0'` y cerrado, da `403` nombrando `VERIFICACION_COMPLETITUD_HABILITADA`; `validarParametros`, `entero` o `400`; el manejador,
`limite=0` ⇒ `recuento` y si no `lanzar`. El `GET`: rol y `estado()`, nunca lanza. En sitio, 1/1: `packages/zoho-sync/src/config.ts:66`, antes del `}`,
`; verificacionCompletitudHabilitada: boolean`; `packages/zoho-sync/src/config.ts:125`, antes del comentario, `verificacionCompletitudHabilitada: env.VERIFICACION_COMPLETITUD_HABILITADA === 'true',`;
`apps/desk/server/testing/appHarness.ts:46` (tipo) y `:49` (`false`, antes de `...overrides`); al final de `apps/desk/server/app.ts:22`, las dos importaciones;
de `apps/desk/server/app.ts:50`, `; const verificacion = crearVerificacionCompletitud({ zohoFetch, db, departmentId: config.departmentId, dir: dirAdj })`;
de `apps/desk/server/app.ts:57`, `; registerVerificacionCompletitudRoutes(app, { db, verificacion, habilitado: config.verificacionCompletitudHabilitada === true })`.
Las subcadenas de `apps/desk/server/opcionesConversaciones.test.ts:39-41` y `:46-47` siguen ahí; con su molde se vigila el literal de `habilitado` (M8).

## D13 · `DEPLOY.md` §23 y las guardas del árbol (CA-13)
Tras `DEPLOY.md:987`, `## 23. Verificación de completitud contra Zoho Desk (1G-03, …)`: un párrafo (sólo lee; informe en memoria; qué es «conocida»;
las dos reglas por su nombre; la lista se cambia con commit y despliegue); UN apartado `### \`VERIFICACION_COMPLETITUD_HABILITADA\`` con **Qué
enciende:**, **Qué se rompe si se pone mal:** (cuota diaria de Zoho Desk compartida con la sincronización; un `429` corta y deja dónde seguir; no
escribe nada; `TRUE`, `1` o vacía la dejan cerrada), **Nace cerrado** (`=== 'true'`, `packages/zoho-sync/src/config.ts:125`) y su línea de entorno
vacía; y `### Pasos`: abrir y redesplegar (sin copia previa); `?limite=0`; `?limite=20` y `GET` hasta `terminado: true`; `?desde=<cortadoEn>` sin
redesplegar entre medias (un corte en la A se relanza sin `desde`); resumen al analista y cerrar con redespliegue; repetir el día del corte (P-1 a
P-4). La fija `apps/desk/server/deployVerificacionCompletitud.test.ts` (L1), a la que L2 añade al final que cada `entrada` del fichero real exista
como `## E-<n> ·` en `docs/sdd/ENTRADA.md` (sólo lectura) o `## <n>. ` en `DEPLOY.md`.
**Guarda que cuenta el árbol.** La §23 pone en rojo `apps/desk/server/deployRellenoAdjuntos.test.ts:37` y `:38` (`seccion` llega al final: dos `##`
y cuatro `###`). Se mide ese rojo antes de editar y se corrige en sitio con el molde de `apps/desk/server/deployRellenoConversaciones.test.ts:19` y `:25`:
`apps/desk/server/deployRellenoAdjuntos.test.ts:22` acota hasta `## 23. `; `:37` añade que la §23 va detrás; `:11` y `:34` dejan de decir «es la última».
`apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` ya cuentan 1G-03 «en curso» y cambian en el archivo. `.env.example` no se toca (P-5).

## D14 · Pruebas (strict TDD: rojo antes de cada línea de producción)
pg-mem + `migrate`; `zohoFetch` falsa que registra ruta e `init`; `setTimeout` falso; `fs` inyectado. Las de `completitud/` viven en `apps/desk/server/completitud/`.

| Fichero (nuevo salvo que se diga) | Lote | Qué fija |
|---|---|---|
| `comparar.test.ts`, `veredicto.test.ts`; `apps/desk/server/deployVerificacionCompletitud.test.ts`; al final, `packages/zoho-sync/src/config.test.ts`; en sitio, `apps/desk/server/deployRellenoAdjuntos.test.ts` | L1 | CA-1, CA-2, CA-3 (unión, tamaño); la precedencia de D11; sólo `'true'` abre; D13 |
| `conocidas.test.ts`, `clasificar.test.ts`; al final, `deployVerificacionCompletitud.test.ts` | L2 | el fichero REAL carga y sus copias ensuciadas en memoria (sin causa, sin entrada, entrada mal formada, regla o entidad desconocida, clave de más, `ids` y `regla` juntas, `numeros` fuera de tickets, id repetido) no cargan y nombran la entrada (CA-6); con el real, el #1017 sale conocida con E-267 (CA-5); orden de D3; sin uso; entradas que existen |
| `soloLectura.test.ts`, `lectores.test.ts` | L3 | rechazos registrados con total y tipo, sin parámetros; `429` ×3 antes de `404` y `!res.ok`; corte; `from=1`; vacío y `204`; tope; motivos cerrados; `reintentos429`; CA-4 con el `upsertHistoryEvent` real |
| `verificacionGlobal.test.ts` | L4 | fase A: CA-1, S-l, archivados, lista que falla, `app-` sin petición, corte en A; `limite=0` sin Zoho; dos `lanzar`; lista inválida ⇒ `lanzada: false`; `escriturasRechazadas` |
| `verificacionPorTicket.test.ts` | L5 | fase B: CA-2, CA-3, CA-4, herencia, `noEvaluados`, error por ticket, corte en B, CA-10 (grabadora), CA-11 (marcadores en el Zoho falso) |
| `verificacionContinuacion.test.ts`, `verificacionRutas.test.ts` | L6 | fase C; CA-7 (corte, error, parte perdida); continuación; CA-9; CA-12; CA-8, P1, P2, `GET` sin lanzar, literal de `habilitado` |

## D15 · Mutaciones y posiciones (M0 = suite verde; `perl -i -pe '… if $. == N'` por CRLF; restaurar con `git diff` vacío y `file`)
Sobre las construcciones de una línea de D3 a D12; el lote que escribe cada fichero anota sus N en `apply-progress.md`. El rojo sale de lo vigilado, no del arnés.

| Id | Línea (N) y edición | Rojo esperado |
|---|---|---|
| M1 | `packages/zoho-sync/src/config.ts:125`: `s/_HABILITADA === 'true'/_HABILITADA !== 'false'/` sólo en el campo nuevo | `config.test.ts` (ausente abre); `deployVerificacionCompletitud.test.ts` |
| M2 | la de `compararIds(zohoConv, deskConv)` → `(zohoConv.length === deskConv.length ? { faltaEnDesk: [], faltaEnZoho: [], casan: zohoConv.length } : compararIds(zohoConv, deskConv))` | CA-2: igual número e ids distintos ⇒ diferencia |
| M3 | (a) anteponer a la de la lista de tickets de la A `await createSync({ zohoFetch: f, db: lee, config: { departmentId } as AppConfig }).backfillTickets(); `, más su importación (dos N); (b) además, la de `const lee = soloSelect(db)` → `const lee = db`; (c) vaciar la comprobación de `soloGet` | (a) `escriturasRechazadas.total` > 0 —la aserción `toBe(0)`—, no un fallo: `persistEach` se traga la excepción; (b) la grabadora de la prueba ve un `INSERT`; (c) «un `init` con `POST` se rechaza y se cuenta» |
| M4 | (a) la que arma la fila de ticket en la A: añadir `asunto: t.subject, `; (b) el `catch` de una línea de un lector → `catch (e) { return falla(String(e)) }` | CA-11: marcadores en informe, `GET` o `registrar` |
| M5 | vaciar la línea del «incompleto» global de `veredicto.ts` | CA-7: corte, error por ticket y parte perdida salen verdes |
| M6 | `conocidas.json`, la del #1017: `s/"causa": "[^"]*", //`; aparte, la de una regla: `s/nacidoEnLaApp/nacidoEnApp/` | «el fichero real carga» |
| M7 | `conocidas.json`: borrar la del #1017 (`$_ = '' if $. == N`), que no es la última; aparte, vaciar en `REGLAS` la de `conversacionAusenteEnZoho` | con el fichero real, el #1017 sale «sin explicar» (no un error de lectura); sin la regla, el real deja de cargar |
| M8 | `apps/desk/server/app.ts:57`: `s/habilitado: config\.verificacionCompletitudHabilitada === true/habilitado: true/` | el literal de la línea; «cerrado ⇒ `403`» por `appWith` |
| M9 | la de `clasificar`: quitar `porHerencia(f) ?? ` | «un ticket ausente transmite su clase» |
| M10 | la de `completa:`: quitar `desdeInicial === null && ` | «parte previa perdida ⇒ incompleto» |
| M11 | anteponer a la primera de `recuento` `await faseA(estadoInicial()); ` | «`limite=0`: cero llamadas a Zoho» |
| M12 | la de `unirPorId(…)` → `[...deConversaciones, ...deSegunda]`; aparte, la de `estadoCopia` de la C → `const e = fila.storage_path ? 'presente' : 'sinCopia'` | «`4001` cuenta una vez»; «otro tamaño es diferencia» |
| P1 | la del `app.post`: `s/interruptorVerificacion\(habilitado\), validarParametros/validarParametros, interruptorVerificacion(habilitado)/` | cerrado y `limite=abc` ⇒ `403` que nombra la variable, no `400` |
| P2 | la del `app.post`: `s/requireSuperAdmin, interruptorVerificacion\(habilitado\)/interruptorVerificacion(habilitado), requireSuperAdmin/` | sin rol y cerrado ⇒ el `403` de rol, no el del interruptor |
| P3 | en cada lector, una vez por lector: anteponer a la del `429` una copia de la de `!res.ok`; aparte, en `leerPorId`, a la del `404` | `429, 429, 404` ⇒ «falta en Zoho» tras dos pausas; `429, 500` ⇒ error tras la pausa; `404` ⇒ «falta», no error |
| P4 | la del bucle de re-verificación: `await leerPorId(f, ruta(id))` → `({ estado: 'noEsta' })` | contacto vivo por id ⇒ «hueco»; la falsa registra la petición de cada id |
| P5 | la de `clasificar` → `porRegla(f) ?? porId(f) ?? porHerencia(f) ?? SIN_EXPLICAR` | un `app-` con entrada propia sale con la causa de la regla y su entrada «sin uso» |
| P6 | la de `clasificar` → `porId(f) ?? porRegla(f) ?? porHerencia(f) ?? SIN_EXPLICAR` | una conversación `source <> 'zoho'` del #1017 sale con `nacidoEnLaApp`, no con E-267 |
| P7 | la de `estado` en `lanzar`: `enMarcha: true` → `enMarcha: false`, y anteponer a la primera de `pasada` `await Promise.resolve(); estado.enMarcha = true; ` (dos N) | de dos `lanzar` seguidos, lanzan los dos |
| P8 | anteponer a la del corte del bucle B `estado.informe.cobertura.comparados++; ` y vaciar la de `comparados++` (dos N) | corte en el 20 con 10, 20 y 30: `comparados` debe ser 1; tras `desde=20`, 3 |

## D16 · Contabilidad de líneas (regla de mutación 4) y regla invariable 13
Sólo en sitio (inserciones = borrados, `git diff --numstat`): `packages/zoho-sync/src/config.ts:66` y `:125` (2/2); `apps/desk/server/app.ts:22`, `:50` y `:57` (3/3);
`packages/zoho-sync/src/db/history.ts:8` (1/1); `apps/desk/server/testing/appHarness.ts:46` y `:49` (2/2); `apps/desk/server/deployRellenoAdjuntos.test.ts:11`, `:22`, `:34` y `:37` (4/4).
Al final: `DEPLOY.md`, `packages/zoho-sync/src/config.test.ts`. Nuevos: ocho módulos, el JSON, la ruta y once pruebas. Sin tocar: `sync.ts`, `conversaciones.ts`,
`repo.ts`, `mappers.ts`, `schema.sql`, `migrate.test.ts`, `index.ts`, `apps/hub-sync`, `apps/desk/src`, `.env.example` y los seis de Supervisión.
**Barrido de cierre.** `packages/zoho-sync/src/config.ts:125`, `apps/desk/server/app.ts:57` y `packages/zoho-sync/src/db/history.ts:8-11` siguen diciendo
lo que se cita de ellos. Al exportar `eventId`, `openspec/changes/verificacion-completitud/proposal.md:47` («en una función no exportada») pasa a caso B:
L3 la anota en sitio, 1/1, como `packages/zoho-sync/src/db/history.ts:8-11` «en `03ab82c2`». **Regla 13:** el cliente no gana ninguna decisión.

## D17 · Partición y tamaño
i1 planificación · i2-i7 L1-L6 · i8 verify · i9 archive. Medida: `git diff --shortstat --no-renames` más `wc -l` de lo nuevo, con ~80 de `apply-progress.md`
por lote; ×1,8 (molde `openspec/changes/archive/2026-11-04-persistencia-adjuntos/design.md:185-191`) ≤ 800 en todos. Cada lote cierra con `npm run typecheck`
y su prueba focal (`npx vitest run`); en verify, `npm test` entero y `npm run lint -- --max-warnings 165`.

| Lote | Producción | Prueba focal | Estimado | ×1,8 |
|---|---|---|---|---|
| L1 | `comparar.ts`, `veredicto.ts`; `config.ts` (2/2), `appHarness.ts` (2/2), §23, `deployRellenoAdjuntos.test.ts` (4/4) | `comparar.test.ts veredicto.test.ts config.test.ts deployVerificacionCompletitud.test.ts deployRellenoAdjuntos.test.ts deployRellenoConversaciones.test.ts` | ~415 | ~750 |
| L2 | `conocidas.json`, `conocidas.ts`, `clasificar.ts` | `conocidas.test.ts clasificar.test.ts deployVerificacionCompletitud.test.ts` | ~410 | ~740 |
| L3 | `soloLectura.ts`, `lectores.ts`, `packages/zoho-sync/src/db/history.ts:8` (1/1), `openspec/changes/verificacion-completitud/proposal.md:47` (1/1) | `soloLectura.test.ts lectores.test.ts` | ~425 | ~765 |
| L4 | `verificacion.ts`: estado, fase A, `lanzar`, `recuento`, `estado` | `verificacionGlobal.test.ts` | ~430 | ~775 |
| L5 | `porTicket.ts`; el bucle de la fase B en `verificacion.ts` | `verificacionPorTicket.test.ts` | ~430 | ~775 |
| L6 | fase C y continuación en `verificacion.ts`; la ruta; `app.ts` (3/3) | `verificacionContinuacion.test.ts verificacionRutas.test.ts opcionesConversaciones.test.ts` | ~425 | ~765 |

**Matriz de amenazas:** las cinco filas, N/A (sin documentación ejecutable, repositorio, commit, push ni PR); el límite real va en D4, D5, D11, M3 y M4.

## Riesgos y puntos abiertos
- Hipótesis de API: `/accounts` (S-f), `/tickets/{id}/attachments` (S-e), su `from=1` y `limit=100`, y el detalle por id de un archivado; si todos
  los tickets dan `adjuntos http 404`, la segunda fuente se quita (S-e). Cuentas puede salir roja: `desk.accounts` es parcial (propuesta §2.2, §9).
- Ruido de la sincronización cada 180.000 ms (`packages/zoho-sync/src/config.ts:88`), salvo el día del corte; `eventId` hashea `JSON.stringify(eventInfo)`
  (**hipótesis:** Zoho no reordena sus claves); lo colgado del ticket fuera de una conversación y los 8 pendientes del 06/11 saldrán «sin explicar» (S-h).
- Márgenes de ×1,8 estrechos (740 a 775): si un lote se desvía, `tasks.md` lo parte. Propuesta (191), delta (228) y diseño suman unas 680 líneas:
  `tasks.md` debe dejar su intento bajo 800. Ninguna causa de parada de la «Regla de ejecución»; S-c sigue como pregunta del apartado 06.
