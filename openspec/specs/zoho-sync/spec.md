# Capacidad `zoho-sync` — lo que llega de fuera, y la frontera que lo separa de lo nuestro

| Dato | Valor |
|---|---|
| Capacidad | `zoho-sync` (`openspec/config.yaml:114-116`) |
| Estado | **as-built.** `config.yaml:117` lo declara «as-built (cron cada 3 min)»: la cifra es correcta y **el mecanismo no es un cron**. Ver M-1 |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas. El código de `ad1875b` es idéntico al de `b6fb6d4`: `git diff --name-only ad1875b..HEAD` no devuelve ningún fichero fuera de `docs/`, `openspec/` y `CLAUDE.md` |
| Tanda que la escribe | F0-02 |
| Contenido | **12** requisitos (`RQ-ZS-01`…`RQ-ZS-12`, §§1–4) · **5** entradas de comportamiento actual (§5.1–§5.5) · **5** discrepancias diseño↔código (D-1…D-5) y **4** maestro↔código (M-1…M-4) |
| Diseños de procedencia | `docs/superpowers/specs/2026-06-06-zoho-hub-sp1-sync-service-design.md` (147 líneas) · `…-sp2-replica-referencia-design.md` (97 líneas, **«Implementado», con una corrección de alcance escrita en su propia cabecera**) · `2026-06-18-paquete-lectura-hub-design.md` (100 líneas). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | **M11.1** (`R08.1.md:2648-2654`) · M11.3 (`:2686-2693`) · M11.5 (`:2701-2707`) · M1.3.2 (`:1145-1149`) |
| Tandas que la tocan | **F1B-01** (serial único y autocompletado, plan `:413`; y el destino de **IV-6**) · **F1B-08** (paridad de lectura y política de escritura, punto abierto **P44**) · **F1F-01** (migración de los tickets abiertos y fecha de corte) |
| Depende de | `tickets-core` (lo que se escribe encima de lo sincronizado) · `transitions-st` (`managed_by_app` lo pone `writeTransition`) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, y la palabra **hipótesis** delante
de lo demás. Cuando el diseño discrepa del código, manda el código y la discrepancia se escribe (§6).

**Ninguna cifra de esta spec sale de `openspec/config.yaml`.** Es el aviso que el propio `CLAUDE.md`
deja escrito —«este fichero y `openspec/config.yaml` **pueden estar caducos**»— y esta capacidad es la
que lo demuestra por segunda vez: `config.yaml:117` la describe con una palabra que el código no
sostiene. Toda cifra de aquí la produjo un comando, y el comando queda escrito junto a ella.

### La arquitectura está IMPLEMENTADA y en producción, no «en diseño»

Los tres diseños de procedencia son de junio. Lo que describen ya corre:

- El worker `hub-sync` existe, es un servicio aparte del mismo repositorio y su `DATABASE_URL` apunta
  al hub (`apps/hub-sync/src/hub-sync.ts`; `DEPLOY.md:183-189`).
- La replicación lógica hub → desk lleva **cuatro** tablas, verificadas en producción el 2026-08-10
  con `pg_subscription_rel` en estado `r`: `desk.activities`, `books.contacts`,
  `books.sales_orders` y `books.items` (`DEPLOY.md:38-42`, que cita `debt.md:298-301`).
- Books y CRM ricos se ingieren en Node contra el hub (`packages/zoho-sync/src/booksHub/sync.ts:8-17`;
  `crmHub/modules.ts:18`).

Lo que **falta** es SP3, el write-back CQRS, y está registrado como diferido: `debt.md:558` lo lista
junto a la Opción A y SP4, y el baseline lo clasifica **NO-APLICA-AL-MVP**
(`docs/sdd/F0-00_Baseline_as-built.md:296`). No es un hueco de esta spec: es una decisión escrita.

### Las tres fuentes, enfrentadas

| Concepto | Diseños (06/06 y 18/06) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Cadencia | «`SYNC_INTERVAL_MS=180000`» como valor por omisión de `loadConfig` (`sp1:24`) | M11.1 (`:2650`): «se actualiza cada tres minutos»; (`:2652`) «el cron alimenta PostgreSQL» | `setInterval` **dentro del proceso**, con `syncIntervalMs` por omisión 180 000 ms (`packages/zoho-sync/src/config.ts:88`; los temporizadores, en `apps/desk/server/index.ts:82-90` y `apps/hub-sync/src/hubSync.ts:79-95`). **No hay ningún cron** |
| Tablas replicadas | SP2 corrige su propio alcance a **tres**: `activities`, `clients`, `sales_orders`, excluyendo `contacts` (`sp2:1-7`) | — | **Cuatro**: `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` (`DEPLOY.md:42`). `clients` ya no es tabla: es **vista** sobre `books.contacts` (`schema.sql:169-173`) |
| Escritura hacia Zoho | SP2: «no se tocan … ni las escrituras del app» (`sp2:20-21`) | M11.1 `[DECIDIDO]` (`:2651`): «Desk 2.0 lee la información de Zoho **sin permisos de edición ni de eliminación**» | Existe **una** ruta que escribe a Zoho, y está detrás de un interruptor que **nace cerrado**: `POST /api/tickets/:id/reply` con `guardWrites` (`apps/desk/server/routes/tickets.ts:27-30`, `:196`; `ENABLE_WRITES === 'true'` en `config.ts:84`) |
| El paquete de lectura | «`@algarpibe/zoho-sync`, repo **independiente**; el monorepo NO se toca» (`paquete:decisión R1`) | — | En este repositorio el paquete se llama `@ambientalia/zoho-sync` y es un **workspace privado** (`packages/zoho-sync/package.json:1`). Son dos cosas distintas con nombre parecido |
| Qué se ingiere | Desk + Books; «CRM = futuro (no hay código de sync de CRM aún)» (`sp1:16`) | M11.3 (`:2687-2689`): CRM, Books y Desk, los tres | CRM está construido: **9** módulos (`crmHub/modules.ts:18-66`) sobre **10** tablas `crm.*` (`crmHub/schema-crm.sql`) |

---

## 1 · La frontera: qué es de Zoho y qué es nuestro

### RQ-ZS-01 · `managed_by_app` es la frontera de escritura, no el discriminador de origen

Una fila con `managed_by_app = true` **MUST NOT** ser sobrescrita por el sync
(`packages/zoho-sync/src/db/repo.ts:58-59` para tickets, `:20-21` para contactos, `:14` para cuentas).

- En tickets, el `UPSERT` **SHALL** salir antes de escribir si la fila ya está gestionada por la app
  (`repo.ts:58-59`: `// no sobrescribir lo gestionado por la app`), y la columna **MUST NOT** estar
  entre las que el `ON CONFLICT` actualiza (`:62`).
- En cuentas, la exclusión **SHALL** ir en el propio `WHERE` del `ON CONFLICT` (`:14`).
- Lo que llega de Zoho **SHALL** nacer con `managed_by_app: false` y `source: 'zoho'`
  (`db/mappers.ts:53`, `:77`, `:85`).
- Lo que la app toca **SHALL** quedar marcado: `applyTransition` pone `managed_by_app=true` y
  `source='app'` en **cualquier** transición hecha desde Desk (`repo.ts:271`).

**Y de ahí sale el matiz que importa:** por ese último punto, `managed_by_app` **MUST NOT** usarse
para saber si un ticket nació en la app. El guardia fiable es el prefijo `app-` del `id`, que es
inmutable. La regla completa es de `tickets-core` RQ-TC-01; aquí sólo se fija por qué esta columna no
sirve para eso.

### RQ-ZS-02 · Un ticket venido de Zoho no entra en las fases propias de la app

La regla vive en `apps/desk/server/db/estadoPorRemision.ts:41` y su motivo está escrito allí: mover un
ticket de Zoho «lo marcaría `managed_by_app` —lo hace `writeTransition`— y lo sacaría del sync de Zoho
sin que nadie lo haya pedido» (`:32-34`).

Es la contrapartida operativa de RQ-ZS-01, y el maestro la desarrolla en M1.3.2 (`:1145-1149`),
incluida su consecuencia para los indicadores: «cualquier indicador que mida tiempo en `Ticket creado`
o en `Remisión creada` está midiendo sólo los tickets nacidos en la app» (`:1149`).

**La regla completa, con las dos constantes y la prueba, es de `transitions-st` RQ-TS-02.** Aquí sólo
está por qué el sync la necesita.

### RQ-ZS-03 · La escritura hacia Zoho es una sola ruta, y nace apagada

`ENABLE_WRITES` **SHALL** nacer cerrada (`config.ts:84`, `env.ENABLE_WRITES === 'true'`), y `guardWrites`
**SHALL** responder `403` con el motivo nombrando la variable
(`apps/desk/server/routes/tickets.ts:27-30`).

**Verificado por comando:** `grep -n "guardWrites" apps/desk/server/routes/*.ts` devuelve **una sola**
ruta protegida, `POST /api/tickets/:id/reply` (`routes/tickets.ts:196`). El borrado de ticket **no**
lleva el guardián, y el fichero explica por qué: «`ENABLE_WRITES` protege las escrituras hacia ZOHO, y
esto es local» (`:86`).

**Su alcance es esa ruta y sólo esa.** `apps/hub-sync` no lee la variable en ninguna línea, así que la
ingesta del worker escribe con el interruptor apagado. Es correcto —la ingesta escribe en PostgreSQL,
no en Zoho— pero el nombre no lo dice y nada más lo dice tampoco: §5.3.

---

## 2 · La cadencia y quién la ejecuta

### RQ-ZS-04 · No hay cron: hay temporizadores dentro de dos procesos

El intervalo **SHALL** salir de `syncIntervalMs`, con **180 000 ms** por omisión
(`config.ts:88`), y **SHALL** ejecutarse con `setInterval` dentro del proceso. Hay **dos** procesos y
**cuatro** temporizadores incrementales:

| Proceso | Temporizador | Qué corre | Evidencia |
|---|---|---|---|
| App (`ambientalia-desk`) | 1 | `syncRecent` → `syncActivities` → `syncContacts`, encadenados | `apps/desk/server/index.ts:82-90` |
| Worker (`hub-sync`) | 1 | `syncRecent` → `syncActivities` → `syncContacts` | `apps/hub-sync/src/hubSync.ts:79-85` |
| Worker | 2 | Books rico, `booksHubSync.syncRecent` | `hubSync.ts:87-89` |
| Worker | 3 | CRM, `crmSync.syncRecent` | `hubSync.ts:91-94` |

- Los dos ciclos principales **SHALL** llevar un cerrojo `syncing` que impide solapar «si una tarda
  más que el intervalo» (`index.ts:81-84`; `hubSync.ts:77-84`).
- Los tres temporizadores del worker **SHALL** compartir el mismo `intervalMs`
  (`hub-sync.ts:49`).

*Hipótesis:* en producción el temporizador de la App y el del worker corren contra bases distintas
—`desk` y `zoho-hub` (`DEPLOY.md:28-29`, `:189`)—, así que no se pisan. No se ha inspeccionado la
consola de EasyPanel para confirmarlo, y el propio `DEPLOY.md` declara ese punto sin verificar
(`:54-56`, `:200-202`).

### RQ-ZS-05 · Dos tareas diarias, y las dos nacen en el lado seguro

`scheduleDailyAt` **SHALL** rearmarse tras cada ejecución y **MUST NOT** dejar que un fallo de la
tarea mate el ciclo (`packages/zoho-sync/src/booksHub/schedule.ts:13-20`).

| Tarea | Hora por omisión | Interruptor | Evidencia |
|---|---|---|---|
| Derivación de `sales_records` | 5:00 | `DERIVE_SALES_RECORDS`, **nace encendido** | `config.ts:93-94`; `hub-sync.ts:52-63` |
| Mark-and-sweep de Books y CRM | 4:00 | `SWEEP_ENABLED`, **nace apagado**; `SWEEP_DRY_RUN`, **nace encendido** | `config.ts:118-120`; `hub-sync.ts:68-75` |

El *sweep* **SHALL** nacer apagado y en simulacro, y **SHALL** llevar guardas de volumen —200 filas o
el 10 %— antes de borrar nada (`config.ts:121-122`; pasadas en `hub-sync.ts:69`). Es la forma correcta
bajo la regla de secretos: el interruptor que enciende un borrador nace cerrado.

La derivación **SHALL** escribir en una **tercera** base, la del *sales tracker*
(`hub-sync.ts:53-58`, con `SALES_TRACKER_DATABASE_URL` en `config.ts:93`). `DEPLOY.md` la nombra en
`:143` pero su §0 sigue titulando «**dos** bases de datos» (`:22`). Ver §5.5.

---

## 3 · El hub y la réplica

### RQ-ZS-06 · Quién escribe cada base, y en qué dirección

`hub-sync` **SHALL** escribir sólo en `zoho-hub`; la App **SHALL** escribir sólo en `desk`
(`DEPLOY.md:33-36`). El sentido de la replicación **SHALL** ser hub → desk, con `zoho_ref_pub` como
publicación y `zoho_ref_sub` como suscripción (`:38-40`).

### RQ-ZS-07 · La replicación no crea la tabla: el DDL tiene que ir por delante, y en orden

La definición del suscriptor **SHALL** ser idéntica a la del hub, porque «la replicación lógica NO
crea la tabla en el suscriptor: sólo copia filas a una que ya exista, emparejando por nombre de
columna» (`packages/zoho-sync/src/db/schema.sql:376-377`; `DEPLOY.md:46-48`).

- Una columna que falte **SHALL** dejar de llegar **en silencio** (`schema.sql:377`). No hay error, no
  hay log: por eso la regla se escribe junto a la tabla y no sólo en el documento de despliegue.
- El DDL **SHALL** desplegarse **primero en el suscriptor (`desk`) y después en el hub**: al revés, el
  apply del suscriptor se atasca, «comprobado en el spike de replicación» (`schema.sql:378`;
  `DEPLOY.md:49-50`).

### RQ-ZS-08 · Sólo es replicable lo que nadie escribe del otro lado

Una tabla **MUST NOT** ser suscriptora si la App también la escribe. El motivo está escrito con su
mecánica exacta en `DEPLOY.md:104-108`: `upsertActivity` usa `ON CONFLICT (id) DO UPDATE` y por eso
nunca falla, «pero el apply de la replicación hace un `INSERT` crudo y sí falla. El escritor local
gana la carrera sin dar error y la réplica se para detrás» — y no sólo esa tabla, **la suscripción
entera**.

- `books.items` **SHALL** ser replicable precisamente porque nadie en `apps/desk` la escribe: «la
  puebla solo el worker contra el hub. Por eso es replicable sin el choque que dejó a `books.contacts`
  fuera en su momento» (`schema.sql:379`).
- `desk.contacts` **MUST NOT** confundirse con `books.contacts`: son tablas distintas, y sólo la
  segunda está en `zoho_ref_pub` (`DEPLOY.md:113-118`).

### RQ-ZS-09 · Las tablas «lite» de Books son hoy vistas, no tablas

`public.clients` y `public.sales_orders` **SHALL** ser **vistas** sobre `books.contacts` y
`books.sales_orders` (`schema.sql:169-183`), para que la App las lea sin cambiar sus consultas.

- Una columna nueva **SHALL** añadirse **al final** de la lista, porque `CREATE OR REPLACE VIEW` sólo
  admite eso (`schema.sql:168` y `:175`).
- El `DROP` de las tablas lite originales **SHALL** ser una operación única del runbook de cutover y
  **MUST NOT** vivir en `schema.sql` (`:167`).

### RQ-ZS-10 · El esquema del hub y el de `desk` se separan por lista, no por convención

`schema.sql` **SHALL** repartir sus **29** tablas en tres listas, y toda tabla **SHALL** estar en
exactamente una: `DESK_TABLES` (10), `PUBLIC_TABLES` (16) y `BOOKS_TABLES` (3)
(`db/migrate.ts:63-64`, `:70-74`, `:80`).

- El guardián **SHALL** comprobar en la dirección «toda tabla del esquema está clasificada» y no al
  revés, porque «"las declaradas existen" sería trivialmente verde y no cazaría nada, que es justo lo
  que faltó cuando `catalogo_articulos` aterrizó en el esquema equivocado por un `CREATE` sin
  calificar» (`migrate.ts:53-56`; el guardián, en `migrate.test.ts:266`; el reparto, en `:282`).
- `reorgToDesk` **SHALL** mover las 10 de `DESK_TABLES` de `public` a `desk`, más la secuencia de
  numeración, y **SHALL** ser tolerante por sentencia (`migrate.ts:83-88`, `:95-98`). Sólo corre
  cuando `DB_SCHEMA === 'desk'` (`index.ts:23`; `hub-sync.ts:47`).
- El `search_path` **SHALL** fijarse en el pool y sólo con ese mismo interruptor
  (`db/pool.ts:5`; probado en `db/pool.test.ts:17`).

---

## 4 · Lo que se ingiere

### RQ-ZS-11 · Tres dominios, con alcances distintos

| Dominio | Qué se ingiere | Dónde | Evidencia |
|---|---|---|---|
| **Zoho Desk** | tickets, conversaciones, adjuntos, cuentas, contactos, agentes, actividades e historial | `desk.*` (y `public.*` antes del reorg) | `packages/zoho-sync/src/sync.ts:14-24` |
| **Zoho Books (rico)** | contactos, artículos, órdenes de venta, facturas, pagos y órdenes de compra, con sus líneas | `books.*`, **8** tablas | `booksHub/sync.ts:8-17`; `booksHub/schema-books.sql` |
| **Zoho CRM** | **9** módulos: `leads`, `deals`, `tasks`, `events`, `calls`, `products`, `quotes`, `campaigns`, `visits` | `crm.*`, **10** tablas (los 9 más `quote_line_items`) | `crmHub/modules.ts:18-66`; `crmHub/schema-crm.sql` |

**Recuentos por comando:** `grep -cE "^CREATE TABLE" schema-books.sql` = 8;
`grep -cE "^CREATE TABLE" schema-crm.sql` = 10; los 9 módulos salen de `grep -oE "table: '[a-z_]+'"
crmHub/modules.ts | sort -u`.

- El backfill inicial **SHALL** correr **sólo si la tabla está vacía**, y **SHALL** ser idempotente
  entre reinicios (`apps/hub-sync/src/hubSync.ts:10-20`).
- Cada guard **SHALL** ir por separado, porque «los pagos pueden faltar aunque el resto de Books ya
  esté cargado» (`hubSync.ts:45-48`, `:57-58`), y cada backfill **SHALL** ir en su propio `try/catch`
  para que un fallo «NUNCA tumbe el worker» (`:46-47`).
- El histórico de tickets **SHALL** paginarse de 50 en 50 y no de 100, porque el endpoint acota
  `limit` a 1-50 y «con 100 responde 422», y saltárselo «no fallaba de forma visible, porque quien
  llama a `syncTicketHistory` se traga el error y enseña lo que tenga» (`sync.ts:26-30`).

### RQ-ZS-12 · Los recuentos de un backfill distinguen intentar de conseguir

`ResultadoBackfillHistoria` **SHALL** separar `intentados`, `poblados`, `fallidos` y `restantes`, y
**SHALL** llevar el motivo del **primer** fallo (`sync.ts:38-52`).

La razón es un caso real: «contar los fallos no basta: "747 fallidos" no se distingue de "Zoho no
tiene esos datos", y esa ambigüedad ya costó una tarde» (`:46-49`). Y sólo el primero, «si falla el
barrido entero, falla por lo mismo, y 747 líneas iguales en el log no informan más que una» (`:50-51`).

---

## 5 · Comportamiento actual, a corregir

*(La numeración de esta sección va aparte de la de requisitos: aquí se registra lo que hay, no lo que
debe haber.)*

### 5.1 · Seis interruptores de escritor nacen abiertos · **destino: una decisión que nadie ha tomado por escrito**

**Comportamiento actual. No se anota como incumplimiento**, y el motivo de no hacerlo es parte del
hallazgo: aquí hay una tensión real, no un descuido.

La regla dura de `CLAUDE.md` es literal: «un interruptor que enciende un escritor **nace cerrado**
(`=== 'true'`)». **Recuento por comando** sobre `packages/zoho-sync/src/config.ts`:
`grep -nE "env\.[A-Z_]+ !== 'false'"` da **siete** que nacen abiertos y
`grep -nE "env\.[A-Z_]+ === 'true'"` da **tres** que nacen cerrados.

| Interruptor | Nace | ¿Enciende un escritor? | Qué escribe |
|---|---|---|---|
| `SYNC_CONTACTS` (`:89`) | **abierto** | Sí | `desk.contacts` (`db/repo.ts:20-28`) |
| `SYNC_ACTIVITIES` (`:90`) | **abierto** | Sí | `desk.activities` (`db/activities.ts:12`) |
| `SYNC_BOOKS` (`:91`) | **abierto** | **No: nadie lo consume** | nada — ver §5.2 |
| `SYNC_BOOKS_RICH` (`:92`) | **abierto** | Sí | `books.*` en el hub (`hub-sync.ts:24`) |
| `DERIVE_SALES_RECORDS` (`:94`) | **abierto** | Sí | una **tercera** base (`hub-sync.ts:52-58`) |
| `SYNC_CRM` (`:109`) | **abierto** | Sí | `crm.*` en el hub (`hub-sync.ts:31`) |
| `ENABLE_WRITES` (`:84`) | cerrado | Sí, **hacia Zoho** | `POST /tickets/:id/sendReply` (`routes/tickets.ts:203-208`) |
| `BACKFILL_CONTACTS` (`:110`) | cerrado | Sí, ~615 GET contra Books | `books.contacts` (`hubSync.ts:38-43`) |
| `SWEEP_ENABLED` (`:118`) | cerrado | Sí, **borra** | `books.*` y `crm.*` (`hub-sync.ts:68-75`) |
| `SWEEP_DRY_RUN` (`:119`) | abierto | **Al revés**: abierto significa *no borrar* | — |

Seis encienden escritores y nacen abiertos. `SWEEP_DRY_RUN` también nace abierto, pero abierto **es**
su lado seguro, así que no cuenta.

**Por qué esto no se anota como incumplimiento.** La regla existe para que un interruptor mal puesto
falle del lado seguro, y **cuál es el lado seguro no es el mismo para las dos clases de escritor**:

- Con `ENABLE_WRITES` mal puesto en abierto, sale un **correo a un cliente**
  (`apps/desk/server/routes/tickets.ts:196`, con el comentario que lo dice: «a partir de aquí el correo
  YA SALIÓ», `:211`). Irreversible.
- Con `SWEEP_ENABLED` mal puesto en abierto, se **borran filas**. Por eso nace cerrado y además en
  simulacro, con guardas de volumen (`config.ts:118-122`).
- Con `SYNC_CRM` mal puesto en **cerrado**, la réplica deja de refrescarse y **nadie se entera**: no
  hay error, no hay log de fallo, el tablero simplemente enseña datos viejos. Un worker de ingesta
  cuyo interruptor nace cerrado no sincroniza nada al desplegar, y el fallo es silencioso.

Es decir: para el escritor saliente, cerrado es el lado seguro; para el escritor de réplica, **cerrado
puede ser el lado peligroso**. Y de esa distinción no hay una sola línea escrita en el repositorio.
`DEPLOY.md` roza el asunto con dos de los seis —«no están fijados aquí a propósito: cambiar su valor
depende del diagnóstico de la replicación» (`:96-99`)— y eso es lo más cerca que hay de una razón,
para dos de seis.

**La pregunta que hay que responder, y que esta spec no responde:**

> ¿La regla de `CLAUDE.md` cubre **cualquier** escritor, o sólo el que sale del sistema y no se puede
> deshacer? Si cubre cualquiera, los seis tienen que invertirse y el despliegue necesita un paso
> explícito de encendido —con lo que un despliegue nuevo arranca sin sincronizar hasta que alguien lo
> pulse—. Si sólo cubre el saliente, la regla necesita decirlo, porque hoy no lo dice, y entonces
> estos seis dejan de estar en tensión con ella.

No es una pregunta de código: es de Gerencia, igual que lo fue la de las pruebas de interfaz. **Se
propone anotarla como punto abierto nuevo del Anexo D.** Lo que sí es de código, decida lo que decida,
es que la razón quede escrita junto a cada interruptor: hoy sólo la tienen `BACKFILL_CONTACTS`
(`config.ts:36-38`), `AVISOS_COPIA_EMAIL` (`:54-58`) y los dos del *sweep* (`:118-119`).

### 5.2 · `SYNC_BOOKS` es un interruptor muerto · **destino F1B-01**

**Comportamiento actual, a corregir en F1B-01.** **Verificado por comando:** `grep -rnw "syncBooks"`
sobre `apps` y `packages` devuelve **cuatro** apariciones y ninguna es un uso: la declaración del tipo
(`config.ts:16`), la lectura (`:91`) y dos aserciones de su propia prueba (`config.test.ts:52` y
`:56`).

Es peor que un flag no documentado: es un flag que **parece** apagar el sync de Books y no apaga nada.
Quien lo ponga a `false` creyendo que detiene una ingesta seguirá ingiriendo, y su prueba estará en
verde. El que sí manda es `SYNC_BOOKS_RICH` (`hub-sync.ts:24`).

Y tiene un efecto de segundo orden sobre §5.1: `SYNC_BOOKS` figura entre los siete que nacen abiertos,
pero **no enciende ningún escritor**, así que su posición de nacimiento no significa nada. Cuando se
responda la pregunta de §5.1, éste no entra: son **cinco** escritores vivos y un flag muerto.

*Destino F1B-01*, junto con IV-6 y §5.4: es la tanda que abre este paquete.

### 5.3 · `ENABLE_WRITES` es global de nombre y local de efecto · **destino F1B-08**

**Comportamiento actual. Tampoco es automáticamente defecto**, y por la misma razón que §5.1: lo que
falla no es el comportamiento, es que el nombre promete un alcance que no tiene y nada lo dice por
escrito.

`enableWrites` vive en la configuración **compartida** por los dos procesos
(`packages/zoho-sync/src/config.ts:9` y `:84`). **Verificado por comando** —`grep -rn
"enableWrites\|ENABLE_WRITES" apps packages --include=*.ts --include=*.tsx | grep -v "\.test\.ts"`—
son ocho apariciones fuera de pruebas, y **una sola** es una guarda:

| Aparición | Qué hace |
|---|---|
| `packages/zoho-sync/src/config.ts:9`, `:84` | Lo declara y lo lee |
| **`apps/desk/server/routes/tickets.ts:28`** | **Lo honra**: `guardWrites` responde `403` |
| `apps/desk/server/index.ts:55` | Sólo lo **imprime** en el log de arranque |
| `apps/desk/server/routes/tickets.ts:86` | Un comentario que explica por qué el borrado no lo lleva |
| `apps/desk/server/testing/appHarness.ts:46`, `:49` | Andamiaje de pruebas |

Y el dato que cierra el punto: **`grep -rn "enableWrites\|ENABLE_WRITES\|guardWrites" apps/hub-sync/`
no devuelve ninguna coincidencia.** El worker ingiere —y por tanto escribe en el hub— con el
interruptor apagado, todos los días.

**Por qué esto tampoco se anota como incumplimiento sin más.** Las dos escrituras no son de la misma
clase, y el propio código lo declara en el único sitio donde alguien se hizo la pregunta:
«`ENABLE_WRITES` protege las escrituras **hacia ZOHO**, y esto es local» (`routes/tickets.ts:86`). La
ingesta es mantenimiento de réplica: escribe en PostgreSQL, no en Zoho, y lo que produce se puede
volver a producir. **Verificado por comando:** los únicos `POST` salientes del paquete de sync son los
tres refrescos de token OAuth (`tokenManager.ts:25`, `books/booksClient.ts:32`,
`crmHub/crmClient.ts:13`); la única escritura de **datos** hacia Zoho de todo el repositorio es
`sendReply` (`routes/tickets.ts:203-208`), y está detrás de la guarda.

Así que el comportamiento es correcto. Lo que no lo es:

1. **El nombre.** `ENABLE_WRITES`, sin adjetivo, en una configuración compartida por dos procesos.
   Quien lo lea en la pestaña Environment del worker concluirá que allí también manda, y no manda.
2. **El silencio.** La distinción entre las dos clases de escritura vive en **un comentario de una
   ruta** (`routes/tickets.ts:86`): no está en el nombre, ni en el tipo (`config.ts:9`), ni en
   `DEPLOY.md`, cuyo §6 se titula «Activar escrituras» sin decir cuáles (`:125-127`).
3. **La consecuencia práctica**, que es la que le da destino: **F1B-08** es la tanda de la política de
   escritura, con el punto abierto **P44** delante (plan `:157`). La decisión que P44 tiene que tomar
   no es «¿construimos la escritura?» sino «¿encendemos la que ya está, y qué alcance le damos al
   interruptor que la enciende?». Con el nombre actual, esa conversación empieza con un malentendido.

*Se propone*, sin corregir nada aquí: renombrarlo a algo que diga su alcance —`ZOHO_WRITES_ENABLED` o
equivalente— y documentar en `DEPLOY.md` que la ingesta del worker no depende de él. Es cambio de
código y de despliegue: no es de F0-02.

### 5.4 · 27 de las 42 variables de entorno no están en `DEPLOY.md` · **destino F1B-01**

**Comportamiento actual, a corregir en F1B-01.** **Recuento por comando:** `grep -oE
"env\.[A-Z][A-Z0-9_]*" packages/zoho-sync/src/config.ts | sort -u` da **42** variables; comprobando
cada una con `grep -qF` contra `DEPLOY.md`, **15** aparecen y **27** no.

Las ausentes incluyen las que más consecuencia tienen:

- **`DB_SCHEMA`**, que decide dos cosas a la vez: si `reorgToDesk` mueve las diez tablas de `public` a
  `desk` (`index.ts:23`; `hub-sync.ts:47`) y si el pool fija `search_path=desk,public`
  (`db/pool.ts:5`). Es la variable de la que depende toda la topología de dos esquemas que
  `CLAUDE.md` describe, y no está en el documento de despliegue.
- Las siete credenciales y dominios de Books y CRM que no son el `refresh_token`
  (`ZOHO_BOOKS_CLIENT_ID`, `ZOHO_BOOKS_CLIENT_SECRET`, `ZOHO_BOOKS_API_DOMAIN`,
  `ZOHO_BOOKS_ACCOUNTS_DOMAIN`, `ZOHO_CRM_CLIENT_ID`, `ZOHO_CRM_CLIENT_SECRET`,
  `ZOHO_CRM_API_DOMAIN`, `ZOHO_CRM_ACCOUNTS_DOMAIN`).
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`, que siembran el primer administrador (`index.ts:40-42`).
- `BACKFILL_CONTACTS`, que nace apagada correctamente (`config.ts:110`) pero cuesta «~615 GET de
  detalle contra Books» cuando se enciende (`config.ts:36-38`), y que hay que acordarse de volver a
  apagar (`hubSync.ts:40`).
- Las cinco de remisiones y avisos, que ya se anotan en `remisiones` §5.3 y `derivacion-avisos` §4.3.

*No verificado en esta tanda:* la otra mitad de la regla, `.env.example`. El fichero queda fuera del
alcance de lectura de esta sesión, así que **no se afirma nada sobre él**.

### 5.5 · `DEPLOY.md` §0 dice «dos bases de datos» y hay tres · **destino F1B-01**

**Comportamiento actual, a corregir cuando alguien toque el despliegue.** El §0 se titula «Topología:
**dos** bases de datos y dos servicios de este repo» (`DEPLOY.md:22`) y su tabla lista `desk-db` y
`zoho-hub-db` (`:28-29`).

Hay una tercera: el worker abre un pool contra `SALES_TRACKER_DATABASE_URL` y **escribe** en ella la
derivación diaria de `sales_records` (`apps/hub-sync/src/hub-sync.ts:52-58`, con `deriveSalesRecords`
en `packages/zoho-sync/src/booksHub/salesRecords.ts:59`). El propio `DEPLOY.md` la nombra —pero en
`:143`, dentro del §7 y como una tarea diaria más, no en la topología.

No es un defecto de código: es que el mapa de despliegue no incluye una base a la que el worker
escribe todos los días a las 5:00.

---

## 6 · Discrepancias

### 6.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | SP2, ya corregido en su propia cabecera: el alcance real es de **tres** tablas —`activities`, `clients`, `sales_orders`—, y «`contacts` se **EXCLUYÓ**» porque `syncRecent` la escribe (`sp2:1-7`) | **Cuatro** tablas, y el conjunto no coincide: `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` (`DEPLOY.md:42`) | **Superado dos veces.** `clients` dejó de ser tabla y pasó a **vista** sobre `books.contacts` (`schema.sql:169-173`), `books.items` entró después (`schema.sql:379-380`), y la exclusión de contactos se resolvió por otra vía: la tabla replicada no es `desk.contacts` sino `books.contacts`, que nadie en `apps/desk` escribe (`DEPLOY.md:113-118`). El diseño de junio, incluso con su corrección de junio, ya no describe la réplica de hoy |
| D-2 | SP1: «**CRM = futuro** (no hay código de sync de CRM aún)» (`sp1:16`) | CRM construido: 9 módulos sobre 10 tablas, con cliente, mapeadores, repo, sync y sweep propios (`crmHub/`) | **Construido después.** Se anota para que nadie lea el «futuro» de SP1 como estado actual |
| D-3 | SP1: el hub corre «el `schema.sql` completo existente (crea las tablas Zoho que usa, y unas tablas de app **vacías que quedan sin uso**). La separación fina se hará en SP2» (`sp1:12-14`) | Sigue así: `hubBootstrap` llama a `migrate(db)`, que aplica el `schema.sql` entero (`hubSync.ts:13`). La separación es por **listas** en `migrate.ts:63-80`, no por fichero | **La separación fina que SP2 iba a hacer no llegó como fichero, llegó como guardián.** Es mejor solución —el guardián se pone rojo, un fichero aparte no— pero conviene no leer SP1 esperando dos `schema.sql` |
| D-4 | El paquete de lectura: «`@algarpibe/zoho-sync`… **el monorepo NO se toca**» (`paquete:decisión R1`) | En el monorepo el paquete se llama `@ambientalia/zoho-sync` y es un workspace **privado** (`packages/zoho-sync/package.json:1`) | **No es discrepancia: son dos artefactos distintos con nombres parecidos**, y por eso se anota. El del diseño es un paquete público en otro repositorio para apps lectoras futuras; el de aquí es el motor interno, el que el propio diseño decidió **no** sacar. Confundirlos lleva a buscar en npm lo que está en `packages/` |
| D-5 | SP2 deja explícitamente fuera «write-back, esquema `zoho`/vistas-contrato, Opción A (diferida)» (`sp2:91`) | Sigue fuera, y está registrado como deuda deliberada (`debt.md:558`), clasificado **NO-APLICA-AL-MVP** en el baseline (`docs/sdd/F0-00_Baseline_as-built.md:296`) | **Sin discrepancia.** Se anota porque «falta SP3» se lee como hueco y es una **decisión**: la Opción A tenía disparadores escritos —«hacerla solo si (1) otra app necesita leer tickets creados por la Desk app, o (2) la doble sincronización causa problemas medibles» (`sp2:21-23`)— y ninguno se ha cumplido |

### 6.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M11.1 (`:2650`): «se actualiza **cada tres minutos**». Y (`:2652`): «el **cron** alimenta PostgreSQL». `openspec/config.yaml:117` lo repite: «as-built (**cron** cada 3 min)» | Tres minutos es correcto: `syncIntervalMs` vale 180 000 ms por omisión (`config.ts:88`). **Pero no hay ningún cron**: son `setInterval` dentro de dos procesos Node (`index.ts:82-90`; `hubSync.ts:79-95`), y el valor es configurable con `SYNC_INTERVAL_MS` (`DEPLOY.md:91`) | **La cifra resiste; la palabra no.** Y la diferencia tiene consecuencia operativa: un cron sobrevive al reinicio del proceso y se puede inspeccionar desde fuera; un `setInterval` muere con el proceso y no deja rastro. Además son **cuatro** temporizadores, no uno. **Corrección para el maestro**, y también para `config.yaml`: es un temporizador en proceso, con intervalo configurable |
| M-2 | M11.1 `[LOGRADO 21/08]` (`:2650`): la información sincronizada es «tickets, órdenes de venta y contactos». Y (`:2654`): «bases de datos de referencia en Zoho: clientes, artículos y tickets, más órdenes de venta y contactos» | Mucho más: de Desk, ocho entidades (`sync.ts:14-24`); de Books, seis con sus líneas sobre 8 tablas; de CRM, 9 módulos sobre 10 tablas | **Quedó corto por crecimiento, no por error.** La frase describía el estado del 21/08. **Corrección para el maestro**: el inventario real son tres dominios y ~30 tablas de referencia, y la lista de M11.1 se lee hoy como el alcance completo cuando es el punto de partida |
| M-3 | M11.1 `[DECIDIDO]` (`:2651`): «Desk 2.0 lee la información de Zoho **sin permisos de edición ni de eliminación**». M11.3 (`:2689`) lo repite: «conexión de solo lectura durante la transición» | Cierto **por configuración, no por ausencia de capacidad**: existe una ruta que escribe a Zoho (`POST /api/tickets/:id/reply`, `routes/tickets.ts:196`), y lo que la cierra es `ENABLE_WRITES`, que nace en `false` (`config.ts:84`) y `DEPLOY.md` documenta apagada (`:89`, con el §6 «Activar escrituras» en `:125`) | **Sin discrepancia de hecho, sí de lectura.** Hoy no se escribe. Pero el maestro lo enuncia como propiedad del sistema y el código lo tiene como interruptor, con un apartado del despliegue dedicado a encenderlo. **Importa para F1B-08**, que es la tanda de la política de escritura (punto abierto **P44**): la decisión que P44 tiene que tomar no es «¿construimos la escritura?» sino «¿encendemos la que ya está?» |
| M-4 | M11.5 `[CORREGIDO — R08]` (`:2702`): «se trabaja únicamente con PostgreSQL en la VPS propia de Hostinger» | `DEPLOY.md` describe **dos** servicios Postgres en EasyPanel —`desk-db` y `zoho-hub-db` (`:28-29`)— y el worker abre un tercer pool contra `SALES_TRACKER_DATABASE_URL` (`hub-sync.ts:53`) | Sin discrepancia sobre el motor —es PostgreSQL en las tres— pero sí sobre el número. «Únicamente PostgreSQL» resuelve la pregunta de Supabase y deja abierta la de cuántas instancias. **Corrección menor para el maestro**, relevante porque M11.5 es el apartado donde vive la decisión de «una sola instancia» (`:2701`) |

---

## 7 · Fuera de alcance de esta spec

- **El grafo de estados, las 34 transiciones y las dos entradas que no se cruzan** → `transitions-st`
  (RQ-TS-02). Aquí sólo está por qué el sync necesita esa regla (RQ-ZS-02).
- **El ticket, su identidad, el prefijo `app-` y por qué `managed_by_app` no sirve para saber dónde
  nació** → `tickets-core` (RQ-TC-01). Aquí sólo está que esa columna es la frontera de **escritura**
  (RQ-ZS-01).
- **La numeración de tickets y el bug #954** → `tickets-core` (RQ-TC-02). Aquí sólo está que
  `reseedTicketNumber` corre en el arranque del worker (`hubSync.ts:14`, `:19`).
- **Las guardas de sesión y el modelo de roles** → `permissions`. Aquí sólo está que `ENABLE_WRITES`
  es un guardián de ruta y no un permiso de usuario (RQ-ZS-03).
- **El historial del ticket y su composición** → `trazas`. Aquí sólo está que `backfillTicketHistory`
  lo puebla y cómo cuenta sus fallos (RQ-ZS-12).
- **Los webhooks de remisiones y avisos**, que también son integraciones salientes → `remisiones` y
  `derivacion-avisos`. No pasan por este paquete.
- **Las 23 `ALTER TABLE` sin calificar de `schema.sql`** → registradas como **IV-6** en
  `openspec/config.yaml` y en `CLAUDE.md`, analizadas en `tickets-core` §5.3. El fichero es de esta
  capacidad y el guardián también (RQ-ZS-10), pero el desvío se anota una sola vez y allí.
- **Los indicadores derivados de `sales_records`** → `kpis` (no es de F0-02). Aquí sólo está que la
  derivación existe, cuándo corre y contra qué base escribe (RQ-ZS-05, §5.5).
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). Esta capacidad no
  tiene componentes: todo lo que describe está cubierto por pruebas de nodo, salvo lo que vive en la
  consola de EasyPanel y en la replicación lógica, que ninguna prueba del repositorio alcanza.
