# Capacidad `zoho-sync` — lo que llega de fuera, y la frontera que lo separa de lo nuestro

| Dato | Valor |
|---|---|
| Capacidad | `zoho-sync` (`openspec/config.yaml:114-116`) |
| Estado | **as-built.** `config.yaml:117` lo declara «as-built (cron cada 3 min)»: la cifra es correcta y **el mecanismo no es un cron**. Ver M-1 |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas. El código de `ad1875b` es idéntico al de `b6fb6d4`: `git diff --name-only ad1875b..HEAD` no devuelve ningún fichero fuera de `docs/`, `openspec/` y `CLAUDE.md` |
| Tanda que la escribe | F0-02 |
| Contenido | **13** requisitos (`RQ-ZS-01`…`RQ-ZS-13`, §§1–4) · **5** entradas de comportamiento actual (§5.1–§5.5) · **5** discrepancias diseño↔código (D-1…D-5) y **4** maestro↔código (M-1…M-4) |
| Diseños de procedencia | `docs/superpowers/specs/2026-06-06-zoho-hub-sp1-sync-service-design.md` (147 líneas) · `…-sp2-replica-referencia-design.md` (97 líneas, **«Implementado», con una corrección de alcance escrita en su propia cabecera**) · `2026-06-18-paquete-lectura-hub-design.md` (100 líneas). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | **M11.1** (`R08.1.md:2648-2654`) · M11.3 (`:2686-2693`) · M11.5 (`:2701-2707`) · M1.3.2 (`:1145-1149`) |
| Tandas que la tocan | **F1B-01** (serial, equipo↔cliente, ALTER TABLE, plan `:413`) · **F1B-08** (paridad de lectura y política de escritura, punto abierto **P44**) · **F1F-01** (migración de los tickets abiertos y fecha de corte) |
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
  al hub (`apps/hub-sync/src/hub-sync.ts`; `DEPLOY.md:186-192`).
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
| Cadencia | «`SYNC_INTERVAL_MS=180000`» como valor por omisión de `loadConfig` (`sp1:24`) | M11.1 (`:2650`): «se actualiza cada tres minutos»; (`:2652`) «el cron alimenta PostgreSQL» | `setInterval` **dentro del proceso**, con `syncIntervalMs` por omisión 180 000 ms (`packages/zoho-sync/src/config.ts:88`; los temporizadores, en `apps/desk/server/index.ts:85-93` y `apps/hub-sync/src/hubSync.ts:79-95`). **No hay ningún cron** |
| Tablas replicadas | SP2 corrige su propio alcance a **tres**: `activities`, `clients`, `sales_orders`, excluyendo `contacts` (`sp2:1-7`) | — | **Cuatro**: `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` (`DEPLOY.md:42`). `clients` ya no es tabla: es **vista** sobre `books.contacts` (`schema.sql:169-173`) |
| Escritura hacia Zoho | SP2: «no se tocan … ni las escrituras del app» (`sp2:20-21`) | M11.1 `[DECIDIDO]` (`:2651`): «Desk 2.0 lee la información de Zoho **sin permisos de edición ni de eliminación**» | Existe **una** ruta que escribe a Zoho, y está detrás de un interruptor que **nace cerrado**: `POST /api/tickets/:id/reply` con `guardWrites` (`apps/desk/server/routes/tickets.ts:27-30`, `:196`; `ENABLE_WRITES === 'true'` en `config.ts:84`) |
| El paquete de lectura | «`@algarpibe/zoho-sync`, repo **independiente**; el monorepo NO se toca» (`paquete:decisión R1`) | — | En este repositorio el paquete se llama `@ambientalia/zoho-sync` y es un **workspace privado** (`packages/zoho-sync/package.json:1`). Son dos cosas distintas con nombre parecido |
| Qué se ingiere | Desk + Books; «CRM = futuro (no hay código de sync de CRM aún)» (`sp1:16`) | M11.3 (`:2687-2689`): CRM, Books y Desk, los tres | CRM está construido: **9** módulos (`crmHub/modules.ts:18-66`) sobre **10** tablas `crm.*` (`crmHub/schema-crm.sql`) |

---

## 1 · La frontera: qué es de Zoho y qué es nuestro

### RQ-ZS-01 · `managed_by_app` es la frontera de escritura, no el discriminador de origen

Una fila con `managed_by_app = true` **MUST NOT** ser sobrescrita por el sync
(`packages/zoho-sync/src/db/repo.ts:66-71` para tickets, `:20-21` para contactos, `:14` para cuentas).

- En tickets, el `UPSERT` **SHALL** salir antes de escribir si la fila ya está gestionada por la app
  (`repo.ts:66-71`: `// no sobrescribir lo gestionado por la app`), y la columna **MUST NOT** estar
  entre las que el `ON CONFLICT` actualiza (`:88`).
- En cuentas, la exclusión **SHALL** ir en el propio `WHERE` del `ON CONFLICT` (`:14`).
- Lo que llega de Zoho **SHALL** nacer con `managed_by_app: false` y `source: 'zoho'`
  (`db/mappers.ts:53`, `:77`, `:85`).
- Lo que la app toca **SHALL** quedar marcado: `applyTransition` pone `managed_by_app=true` y
  `source='app'` en **cualquier** transición hecha desde Desk (`repo.ts:298`).

**Desde este cambio, dos columnas ganan una frontera propia, más fina que `managed_by_app`.** Cuando
la fila lleva la marca de fila `ov_elegida_en_app_at timestamptz` puesta (**supuesto S-1**, reversible:
nullable, fuera de `TICKET_COLS`, sin relleno de filas previas), `orden_venta` y `fecha_orden_venta`
**MUST NOT** ser sobrescritas por `upsertTicket`, aunque `managed_by_app` sea `false` en esa misma
fila. Es la excepción por columnas que reduce IV-11 para las filas marcadas.

- La marca **SHALL** ponerla, en la misma escritura, cualquiera de los **tres** escritores de la
  aplicación que fijan `orden_venta`: el alta de ticket (`repo.ts:420-421`), `writeTransition` cuando
  `plan.columns` incluye `orden_venta` —caso de `habilitar_servicio` (`transitions.ts:189`)—
  (`repo.ts:298`, `:301-306`), y el `UPDATE` de la remisión de entrada (capacidad `remisiones`, RQ-RE-16
  modificado, `apps/desk/server/routes/remision.ts:239-243`). `upsertTicket` **MUST NOT** ponerla
  nunca: es de lectura para el sync, nunca de escritura.
- Sin la marca, la fila **SHALL** seguir la regla de hoy sin cambios: `orden_venta` y
  `fecha_orden_venta` se sobrescriben con lo que traiga Zoho.
- `salesorder_id` **SHALL** seguir fuera de `TICKET_COLS` (`schema.sql:187`); su comportamiento
  **MUST NOT** cambiar por este parche.
- Una fila que ya tuviera su orden de venta elegida en la aplicación **antes** de este cambio
  **MUST NOT** recibir la marca de forma retroactiva: no hay relleno (supuesto S-1). Sigue expuesta al
  sync hasta que un escritor de la app vuelva a fijar su orden de venta.

**Y de ahí sale el matiz que importa:** por ese último punto, `managed_by_app` **MUST NOT** usarse
para saber si un ticket nació en la app. El guardia fiable es el prefijo `app-` del `id`, que es
inmutable. La regla completa es de `tickets-core` RQ-TC-01; aquí sólo se fija por qué esta columna no
sirve para eso.

(Previously: la excepción de escritura era sólo de fila entera, por `managed_by_app`. No existía
frontera por columna, así que una fila con `managed_by_app=false` perdía `orden_venta` y
`fecha_orden_venta` en cada pasada del sync aunque un escritor de la app las hubiera fijado — es el
desvío registrado como IV-11.)

**Y una segunda frontera por columna, para la prioridad** (`propagar-top5-lista-remision-creada`,
F1B-07). Cuando la fila lleva la marca de fila `prioridad_en_app_at timestamptz` puesta (**supuesto S-1
de ese cambio**, reversible: columna de `tickets` que admite NULL, fuera de `TICKET_COLS`, sin relleno de
filas previas; vaciarla devuelve el mando sobre `priority` a Zoho), `priority` **MUST NOT** ser
sobrescrita por `upsertTicket`, aunque `managed_by_app` sea `false` en esa misma fila. Aplica a la
prioridad la misma regla que Gerencia dio para la orden de venta: si se eligió en la aplicación manda la
aplicación; si no, manda Zoho (`decision/e005-iv4-iv11`).

- La marca **SHALL** ponerla, en la misma escritura que cambia `tickets.priority`, la propagación y la
  reversión del Top 5 (`tickets-core` RQ-TC-35 y RQ-TC-36), sobre cada ticket cuya prioridad escriban.
  Tras una reversión la marca **SHALL** conservarse (supuesto S-2 de ese cambio): la prioridad calculada
  la eligió la aplicación y se mantiene frente a Zoho.
- `upsertTicket` **MUST NOT** ponerla ni quitarla nunca.
- Sin la marca, la fila **SHALL** seguir la regla de hoy sin cambios: `priority` se sobrescribe con lo
  que traiga Zoho.
- La guarda de fila entera por `managed_by_app` **SHALL** seguir siendo la primera: con
  `managed_by_app = true` el `upsertTicket` sale antes de escribir nada, marcas puestas o no.
- Las dos marcas **SHALL** ser independientes: `ov_elegida_en_app_at` protege `orden_venta` y
  `fecha_orden_venta`; `prioridad_en_app_at` protege sólo `priority`. Una fila con las dos puestas
  conserva las tres columnas y actualiza el resto de `TICKET_COLS`.
- El ajuste manual de la prioridad de un ticket (`tickets-core` RQ-TC-29) **SHALL** seguir marcando
  `managed_by_app`; no se migra a la marca nueva.
- Sobre la prioridad **no** hay aviso de discrepancia con Zoho: el aviso de la orden de venta no se replica.
- Una fila cuya prioridad ya se hubiera fijado en la aplicación **antes** de este cambio **MUST NOT**
  recibir la marca de forma retroactiva: no hay relleno.
- La columna se crea con `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz`,
  **sin calificar** (`tickets` es de `desk`, ver la topología de dos esquemas), al **final** de
  `packages/zoho-sync/src/db/schema.sql`, sin mover ninguna línea anterior.
- **Regla invariable 13:** que el sincronizador no pise la prioridad lo impone `upsertTicket` en el servidor
  y es la única comprobación que hay; el cliente no participa.

#### Scenario: Los tres escritores de la app ponen la marca al fijar la orden de venta
- GIVEN un alta de ticket con orden de venta, una transición cuyo `plan.columns` incluye
  `orden_venta` (p. ej. `habilitar_servicio`), o el `UPDATE` de una remisión de entrada que captura
  la orden
- WHEN cualquiera de los tres escribe `orden_venta` sobre la fila
- THEN esa misma escritura deja la marca `ov_elegida_en_app_at` puesta

#### Scenario: El sincronizador nunca escribe la marca
- GIVEN cualquier fila que `upsertTicket` procese, marcada o no
- WHEN corre `upsertTicket`
- THEN la marca no cambia por esa pasada

#### Scenario: Con la marca puesta, una pasada del sync no pisa las dos columnas
- GIVEN un ticket con la marca puesta y `orden_venta`/`fecha_orden_venta` distintas a las que trae
  Zoho en esta pasada
- WHEN `upsertTicket` procesa la fila
- THEN `orden_venta` y `fecha_orden_venta` quedan igual que antes de la pasada
- AND el resto de columnas de `TICKET_COLS` se actualiza con normalidad

#### Scenario: Sin la marca, Zoho sigue mandando
- GIVEN un ticket sin la marca puesta
- WHEN `upsertTicket` procesa una pasada con valores de Zoho distintos a los guardados
- THEN `orden_venta` y `fecha_orden_venta` se sobrescriben con los de Zoho, igual que hoy

#### Scenario: `salesorder_id` no cambia de comportamiento
- GIVEN cualquier fila, marcada o no
- WHEN el sync corre
- THEN `salesorder_id` sigue fuera de `TICKET_COLS` y su comportamiento no cambia por este parche

#### Scenario: Una fila existente no recibe la marca por sí sola
- GIVEN una fila cuya orden de venta ya se eligió en la aplicación antes de desplegar este cambio
- WHEN se despliega el cambio
- THEN esa fila no recibe la marca de forma retroactiva y sigue expuesta al sync hasta el siguiente
  escritor de la app que vuelva a fijar su orden de venta

#### Scenario: Con `prioridad_en_app_at` puesta, una pasada del sync no pisa `priority` y sí el resto
- GIVEN un ticket de Zoho con `managed_by_app = false` y la marca de prioridad puesta, con `priority`
  `High` en la base y `Low` en lo que trae Zoho, y otra columna de `TICKET_COLS` (p. ej. `subject`)
  distinta
- WHEN `upsertTicket` procesa la fila
- THEN `priority` sigue `High`
- AND `subject` y el resto de columnas de `TICKET_COLS` se actualizan con normalidad
- AND `managed_by_app` sigue `false`

#### Scenario: Sin `prioridad_en_app_at`, Zoho sigue mandando sobre `priority`
- GIVEN un ticket sin la marca de prioridad y con `priority` distinta a la que trae Zoho
- WHEN `upsertTicket` procesa la fila
- THEN `priority` se sobrescribe con la de Zoho, igual que hoy

#### Scenario: Una prioridad propagada sobrevive a la pasada siguiente del sync
- GIVEN un ticket de Zoho al que la propagación del Top 5 (`tickets-core` RQ-TC-35) cambió la prioridad
- WHEN corre `upsertTicket` con otra prioridad en el payload
- THEN `tickets.priority` conserva la propagada
- AND `managed_by_app` sigue `false`

#### Scenario: Tras revertir, la prioridad calculada también sobrevive al sync (S-2)
- GIVEN un ticket de Zoho propagado y luego revertido por la desmarcación del cliente
- WHEN corre `upsertTicket` con otra prioridad en el payload
- THEN `tickets.priority` conserva la calculada y la marca sigue puesta

#### Scenario: `upsertTicket` nunca escribe `prioridad_en_app_at`
- GIVEN una fila con la marca de prioridad y otra sin ella
- WHEN `upsertTicket` procesa las dos
- THEN la marca de ninguna cambia por esa pasada

#### Scenario: La guarda de `managed_by_app` sigue primera
- GIVEN una fila con `managed_by_app = true` y con las dos marcas (`ov_elegida_en_app_at` y
  `prioridad_en_app_at`) puestas
- WHEN `upsertTicket` procesa un payload con valores distintos en todo
- THEN no se escribe ninguna columna y no se avisa ninguna discrepancia

#### Scenario: Las dos marcas son independientes
- GIVEN una fila con las dos marcas puestas, `managed_by_app = false`, y un payload distinto en
  `orden_venta`, `fecha_orden_venta`, `priority` y `subject`
- WHEN `upsertTicket` procesa la fila
- THEN `orden_venta`, `fecha_orden_venta` y `priority` conservan lo guardado
- AND `subject` se actualiza
- AND una fila con sólo la marca de prioridad sí actualiza `orden_venta` y `fecha_orden_venta`

#### Scenario: El ajuste manual de prioridad sigue usando `managed_by_app`
- GIVEN un ticket al que un usuario con permiso ajusta la prioridad a mano (`tickets-core` RQ-TC-29)
- WHEN termina el ajuste
- THEN `managed_by_app` es `true` y la marca `prioridad_en_app_at` no se ha puesto por esa vía

#### Scenario: La columna nueva es sin calificar, va al final y no entra en `TICKET_COLS`
- GIVEN `schema.sql` y `TICKET_COLS`
- WHEN se recorren sus sentencias `ALTER TABLE` y la lista de columnas
- THEN la de `prioridad_en_app_at` es `ALTER TABLE tickets ...` sin calificar, va detrás de todas las anteriores,
  y `prioridad_en_app_at` no está en `TICKET_COLS`
- AND el guardián de calificación de `migrate.test.ts` sigue en verde

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
| App (`ambientalia-desk`) | 1 | `syncRecent` → `syncActivities` → `syncContacts`, encadenados | `apps/desk/server/index.ts:85-93` |
| Worker (`hub-sync`) | 1 | `syncRecent` → `syncActivities` → `syncContacts` | `apps/hub-sync/src/hubSync.ts:79-85` |
| Worker | 2 | Books rico, `booksHubSync.syncRecent` | `hubSync.ts:87-89` |
| Worker | 3 | CRM, `crmSync.syncRecent` | `hubSync.ts:91-94` |

- Los dos ciclos principales **SHALL** llevar un cerrojo `syncing` que impide solapar «si una tarda
  más que el intervalo» (`index.ts:84-87`; `hubSync.ts:88-95`).
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
`books.sales_orders` (`packages/zoho-sync/src/db/schema.sql:169-182`), para que la App las lea sin cambiar sus consultas.

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
  cuando `DB_SCHEMA === 'desk'` (`index.ts:26`; `hub-sync.ts:47`).
- El `search_path` **SHALL** fijarse en el pool y sólo con ese mismo interruptor
  (`db/pool.ts:5`; probado en `db/pool.test.ts:17`).

---

## 4 · Lo que se ingiere

### RQ-ZS-11 · Tres dominios, con alcances distintos

| Dominio | Qué se ingiere | Dónde | Evidencia |
|---|---|---|---|
| **Zoho Desk** | tickets, conversaciones, adjuntos, cuentas, contactos, agentes, actividades e historial | `desk.*` (y `public.*` antes del reorg) | `packages/zoho-sync/src/sync.ts:14-24` |
| **Zoho Books (rico)** | contactos, artículos, órdenes de venta, facturas, pagos, órdenes de compra y facturas de anticipo, con sus líneas | `books.*`, **9** tablas | `booksHub/sync.ts:8-18`; `booksHub/schema-books.sql` |
| **Zoho CRM** | **9** módulos: `leads`, `deals`, `tasks`, `events`, `calls`, `products`, `quotes`, `campaigns`, `visits` | `crm.*`, **10** tablas (los 9 más `quote_line_items`) | `crmHub/modules.ts:18-66`; `crmHub/schema-crm.sql` |

**Recuentos por comando:** `grep -cE "^CREATE TABLE" schema-books.sql` = 9;
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

### RQ-ZS-13 · El guardián de `ALTER TABLE` distingue intención por esquema, no sólo por nombre pelado

`contacts` es la única tabla cuyo nombre pelado existe en más de una lista calificada
(`DESK_TABLES` y `BOOKS_TABLES`, `db/migrate.ts:63-64`, `:80`). El sub-test que fija qué `ALTER TABLE`
pueden ir sin calificar (`altersDelEsquema()`, `packages/zoho-sync/src/db/migrate.test.ts:345-351`)
filtra hoy por el nombre pelado (`a.tabla`), así que una `ALTER TABLE contacts` sin calificar cuya
intención sea `books.contacts` pasa como si fuera de `desk.contacts`.

El guardián **MUST NOT** clasificar en silencio como tabla de Desk ninguna `ALTER TABLE` sin
calificar cuyo nombre pelado colisione entre esquemas. **SHALL** señalarlas todas para que su esquema
se decida a mano.

**Se clasifica por NOMBRE ambiguo, no por contenido de columnas, y es deliberado.** Una redacción
anterior de este requisito exigía distinguir por «las columnas que añade o modifica». Se descarta:
las columnas no discriminan. `packages/zoho-sync/src/db/schema.sql:11` muestra que la tabla
`contacts` de **Desk** ya declara `raw jsonb`, la misma columna que tiene `books.contacts`
(`:149-152`), así que un clasificador por contenido daría falsos negativos sobre el caso más obvio.
El nombre sí discrimina: `contacts` es el único que aparece en dos listas
(`packages/zoho-sync/src/db/migrate.ts:63-64`, `:80`).

Consecuencia aceptada: el censo señala **también** la `ALTER` legítima de Desk
(`schema.sql:256`, `modified_time`). Eso no es un falso positivo, es el diseño: la cifra del censo es
el disparador que obliga a decidir el esquema de cualquier `ALTER` ambigua nueva antes de dejarla
pasar, en vez de subir un contador global sin pensar.

**No hay bug vivo, y esta spec no lo declara como tal.** `packages/zoho-sync/src/db/pool.ts:5` fija
`search_path=desk,public`, y `books` nunca entra en él: cualquier `ALTER` sin calificar aterriza
siempre en `desk.contacts`, nunca en `books.contacts`. Esto es blindaje de intención sobre el
guardián de pruebas, no la corrección de un defecto de producción.

#### Scenario: Una `ALTER TABLE contacts` sin calificar con intención de Books queda detectada
- GIVEN una `ALTER TABLE contacts` sin calificar en `schema.sql` cuyas columnas sólo existen en la
  definición de `books.contacts` (`booksHub/schema-books.sql`), no en `desk.contacts`
- WHEN corre el guardián de esquema
- THEN la prueba falla, señalando que esa `ALTER` no puede clasificarse como tabla de Desk

#### Scenario: Una `ALTER TABLE contacts` de Desk sigue pasando
- GIVEN una `ALTER TABLE contacts` sin calificar cuyas columnas pertenecen a `desk.contacts`
- WHEN corre el guardián de esquema
- THEN la prueba sigue en verde, igual que hoy

### RQ-ZS-14 · `soloLibres` excluye asociaciones vigentes y cuarentena; saldo por lote

`searchSalesOrders` con `soloLibres` **SHALL** excluir toda OV con asociación vigente en
`public.ov_asociaciones` (`tickets-core` RQ-TC-17), además de las que hoy excluye por columna, y
**SHALL** excluir toda OV en cuarentena (`tickets-core` RQ-TC-18), sin excepción por cliente.

El sistema **SHALL** exponer el saldo de un lote de subOV sobre `books.sales_orders`: creadas,
consumidas (con asociación vigente) y libres, y el porcentaje consumido (consumidas / creadas; el «% ejecutado» de `decision/anexo-53-contratos` es del cambio 3 de F1B-11). Las subOV en cuarentena
**MUST NOT** contarse en ninguna de las tres categorías del saldo: se listan aparte
(`tickets-core` RQ-TC-18).

#### Scenario: Una OV con asociación vigente no aparece en `soloLibres`

- GIVEN una OV cuya única traza de uso es una fila vigente en `ov_asociaciones`, sin coincidir por
  columna con ningún ticket
- WHEN se pide el buscador con `soloLibres`
- THEN esa OV no aparece en el resultado

#### Scenario: Una subOV en cuarentena no aparece en el buscador ni en el saldo

- GIVEN una subOV con sufijo no canónico
- WHEN se piden `soloLibres` y el saldo del lote
- THEN la subOV no aparece en ninguno de los dos, y sí en la lista de cuarentena

#### Scenario: El saldo del lote cuenta correctamente

- GIVEN un lote con cinco subOV canónicas —dos con asociación vigente y tres libres— y una sexta en cuarentena
- WHEN se calcula el saldo del lote
- THEN reporta 5 creadas, 2 consumidas, 3 libres y 40 % consumido; la de cuarentena, fuera del
  recuento y en la lista de cuarentena (supuesto del orquestador, 2026-09-28: Gerencia fija sólo la fórmula, `Decisiones_Gerencia_2026-09-10.md:472`, y que la cuarentena no suma ni resta, `:459-461`)

### RQ-ZS-15 · Informe trimestral por contrato: estado de cada subOV, % ejecutado y servicios

El sistema **SHALL** calcular en el servidor, para un contrato (`tickets-core` RQ-TC-21), una tabla de
informe que el cliente **SHALL** poder exportar a CSV con el patrón existente
(`apps/desk/src/components/RemisionesPage.tsx:107-115`); la versión con formato para el cliente queda
fuera. Leerlo **SHALL** estar abierto a cualquier usuario con sesión (supuesto reversible, como las
lecturas de `routes/ovAsociaciones.ts:13-14`).

**Estado de cada subOV.** Las «creadas» del contrato **SHALL** ser las mismas que cuenta el saldo del lote
(`packages/zoho-sync/src/books/subOV.ts:36-40`: subOV canónicas del lote, sin borrador ni anulada;
las literales `draft`/`void` son hipótesis pendiente de P.4). Cada subOV creada **SHALL** estar en
exactamente uno de tres estados:

- **libre**: sin asociación vigente (`tickets-core` RQ-TC-17);
- **en curso**: con asociación vigente a un ticket cuyo `status` **no** es `Finalizado`;
- **ejecutada**: con asociación vigente a un ticket en `status = 'Finalizado'` (supuesto S-6: el único
  estado sin salida del motor, `apps/desk/server/transitionExec.ts:5`).

Las subOV en cuarentena **MUST NOT** contarse (`tickets-core` RQ-TC-18).

**Trimestres del contrato.** El trimestre 1 **SHALL** empezar en la fecha de inicio del contrato y cada
trimestre siguiente **SHALL** empezar tres meses después del anterior; **no son trimestres naturales**
(`decision/anexo-53-contratos`, `openspec/config.yaml:2465`). El último trimestre **SHALL** terminar en la
fecha de fin. La tabla **SHALL** incluir cada trimestre ya iniciado hoy, hasta el que contiene a hoy o, si
el contrato ya venció, hasta el último.

**Por cada trimestre**, la tabla **SHALL** dar:

1. **% ejecutado** = ejecutadas / creadas, **acumulado al cierre del trimestre** (supuesto S-7):
   ejecutadas cuyo ticket llegó a `Finalizado` en o antes del último día del trimestre. Sin subOV creadas,
   el porcentaje es 0. La fecha de llegada a `Finalizado` sale de `ticket_transitions.performed_at` con
   `to_status = 'Finalizado'` (`packages/zoho-sync/src/db/schema.sql:57-60`).
2. **Servicios del trimestre**: los tickets asociados al contrato que llegaron a `Finalizado` dentro del
   trimestre, cada uno con **equipo, serial, tipo de servicio y fecha** de finalización.
3. **SubOV libres** hoy.
4. **Días hasta el vencimiento** = fecha de fin menos hoy, en días; **negativo** si el contrato ya venció
   (supuesto del diseño de esta spec, reversible).

**Hueco declarado, no inventado.** El maestro pide además el «informe» de cada servicio. Del informe sólo
existe `fecha_revision_informe` (`schema.sql:32`); el documento no está en los datos y la capacidad
`informes` no tiene spec (`openspec/config.yaml:230-234`). La tabla **SHALL** llevar una columna «informe»
que diga explícitamente que **no disponible** en lugar de dejarla vacía o inventar un valor.

**Distinto de `consumido` (RQ-ZS-14).** Este requisito **MUST NOT** cambiar `saldoPorLote`
(`packages/zoho-sync/src/books/subOV.ts:34-49`): el `consumido` de `RQ-ZS-14` cuenta asociaciones
vigentes, de modo que una subOV **en curso** está consumida y **no** ejecutada. El % ejecutado y el
`consumido` **SHALL** poder valer cosas distintas a la vez sobre el mismo lote (el maestro,
`R08.2.md:2182`, dice «consumidas / creadas»; Gerencia lo definió como ejecutadas / creadas,
`openspec/config.yaml:2457`).

#### Scenario: Lote de 10 subOV con 3 finalizadas y 2 en curso

- GIVEN un lote con 10 subOV creadas, 3 con ticket en `Finalizado`, 2 con ticket abierto y 5 sin asociación
- WHEN se consulta el informe del contrato y el saldo del lote
- THEN el informe da 3 ejecutadas, 2 en curso, 5 libres y 30 % ejecutado; el saldo (`RQ-ZS-14`) sigue
  dando 5 consumidas y 50 % `consumido`, sin cambios

#### Scenario: Una asociación liberada devuelve la subOV a libre

- GIVEN una subOV cuya única asociación fue liberada
- WHEN se calcula su estado
- THEN es libre, no en curso ni ejecutada

#### Scenario: Las subOV en cuarentena, borrador y anuladas no cuentan

- GIVEN un lote con una subOV en cuarentena, una anulada y una en borrador además de tres válidas
- WHEN se calcula el informe
- THEN «creadas» es 3 y ninguna de las tres excluidas aparece en los estados

#### Scenario: Los trimestres se cuentan desde el inicio del contrato

- GIVEN un contrato con inicio `2026-02-10` y fin `2027-02-09`
- WHEN se calculan sus trimestres
- THEN el trimestre 1 es `2026-02-10` a `2026-05-09`, el 2 empieza el `2026-05-10`, y el último termina el
  `2027-02-09`, no el 31 de diciembre ni al cierre de un trimestre natural

#### Scenario: El % ejecutado es acumulado al cierre del trimestre

- GIVEN un contrato de 10 subOV, 2 finalizadas en el trimestre 1 y 3 más en el trimestre 2
- WHEN se calcula el informe al final del trimestre 2
- THEN el trimestre 1 da 20 % y el trimestre 2 da 50 %, y los servicios del trimestre 2 son los 3 que
  llegaron a `Finalizado` dentro de él

#### Scenario: Cada servicio lleva equipo, serial, tipo de servicio, fecha, y el hueco del informe

- GIVEN un ticket que llegó a `Finalizado` dentro del trimestre
- WHEN se calcula el informe
- THEN su fila trae equipo, serial, tipo de servicio y fecha de finalización, y la columna «informe» dice
  que el documento no está disponible

#### Scenario: Sin subOV creadas, el informe sigue existiendo con 0 %

- GIVEN un contrato cuyo lote no tiene subOV en Books
- WHEN se calcula su informe
- THEN reporta 0 creadas, 0 ejecutadas, 0 % ejecutado y días hasta el vencimiento

#### Scenario: Un servicio sin equipo registrado sigue listándose

- GIVEN un ticket finalizado cuyo equipo no está en el catálogo de `desk.equipos`
- WHEN se calcula el informe
- THEN el servicio aparece con equipo `(no registrado)` y sus datos (serial, tipo, fecha)

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
| `apps/desk/server/index.ts:58` | Sólo lo **imprime** en el log de arranque |
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
  `desk` (`index.ts:26`; `hub-sync.ts:47`) y si el pool fija `search_path=desk,public`
  (`db/pool.ts:5`). Es la variable de la que depende toda la topología de dos esquemas que
  `CLAUDE.md` describe, y no está en el documento de despliegue.
- Las siete credenciales y dominios de Books y CRM que no son el `refresh_token`
  (`ZOHO_BOOKS_CLIENT_ID`, `ZOHO_BOOKS_CLIENT_SECRET`, `ZOHO_BOOKS_API_DOMAIN`,
  `ZOHO_BOOKS_ACCOUNTS_DOMAIN`, `ZOHO_CRM_CLIENT_ID`, `ZOHO_CRM_CLIENT_SECRET`,
  `ZOHO_CRM_API_DOMAIN`, `ZOHO_CRM_ACCOUNTS_DOMAIN`).
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`, que siembran el primer administrador (`index.ts:43-45`).
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
| M-1 | M11.1 (`:2650`): «se actualiza **cada tres minutos**». Y (`:2652`): «el **cron** alimenta PostgreSQL». `openspec/config.yaml:117` lo repite: «as-built (**cron** cada 3 min)» | Tres minutos es correcto: `syncIntervalMs` vale 180 000 ms por omisión (`config.ts:88`). **Pero no hay ningún cron**: son `setInterval` dentro de dos procesos Node (`index.ts:85-93`; `hubSync.ts:79-95`), y el valor es configurable con `SYNC_INTERVAL_MS` (`DEPLOY.md:91`) | **La cifra resiste; la palabra no.** Y la diferencia tiene consecuencia operativa: un cron sobrevive al reinicio del proceso y se puede inspeccionar desde fuera; un `setInterval` muere con el proceso y no deja rastro. Además son **cuatro** temporizadores, no uno. **Corrección para el maestro**, y también para `config.yaml`: es un temporizador en proceso, con intervalo configurable |
| M-2 | M11.1 `[LOGRADO 21/08]` (`:2650`): la información sincronizada es «tickets, órdenes de venta y contactos». Y (`:2654`): «bases de datos de referencia en Zoho: clientes, artículos y tickets, más órdenes de venta y contactos» | Mucho más: de Desk, ocho entidades (`sync.ts:14-24`); de Books, seis con sus líneas sobre 8 tablas; de CRM, 9 módulos sobre 10 tablas | **Quedó corto por crecimiento, no por error.** La frase describía el estado del 21/08. **Corrección para el maestro**: el inventario real son tres dominios y ~30 tablas de referencia, y la lista de M11.1 se lee hoy como el alcance completo cuando es el punto de partida |
| M-3 | M11.1 `[DECIDIDO]` (`:2651`): «Desk 2.0 lee la información de Zoho **sin permisos de edición ni de eliminación**». M11.3 (`:2689`) lo repite: «conexión de solo lectura durante la transición» | Cierto **por configuración, no por ausencia de capacidad**: existe una ruta que escribe a Zoho (`POST /api/tickets/:id/reply`, `routes/tickets.ts:196`), y lo que la cierra es `ENABLE_WRITES`, que nace en `false` (`config.ts:84`) y `DEPLOY.md` documenta apagada (`:89`, con el §6 «Activar escrituras» en `:125`) | **Sin discrepancia de hecho, sí de lectura.** Hoy no se escribe. Pero el maestro lo enuncia como propiedad del sistema y el código lo tiene como interruptor, con un apartado del despliegue dedicado a encenderlo. **Importa para F1B-08**, que es la tanda de la política de escritura (punto abierto **P44**): la decisión que P44 tiene que tomar no es «¿construimos la escritura?» sino «¿encendemos la que ya está?» |
| M-4 | M11.5 `[CORREGIDO — R08]` (`:2702`): «se trabaja únicamente con PostgreSQL en la VPS propia de Hostinger» | `DEPLOY.md` describe **dos** servicios Postgres en EasyPanel —`desk-db` y `zoho-hub-db` (`:28-29`)— y el worker abre un tercer pool contra `SALES_TRACKER_DATABASE_URL` (`hub-sync.ts:53`) | Sin discrepancia sobre el motor —es PostgreSQL en las tres— pero sí sobre el número. «Únicamente PostgreSQL» resuelve la pregunta de Supabase y deja abierta la de cuántas instancias. **Corrección menor para el maestro**, relevante porque M11.5 es el apartado donde vive la decisión de «una sola instancia» (`:2701`) |

---



### RQ-ZS-16 · La tabla de clientes provisionales es de la App, con esquema calificado y en `PUBLIC_TABLES`

`public.clientes_provisionales` **SHALL** crearse con el esquema calificado, al final de `schema.sql`, y **SHALL**
figurar en `PUBLIC_TABLES` (`migrate.ts:70-73`). Las columnas nuevas de `equipos` **SHALL** añadirse por `ALTER TABLE`
**sin calificar**, porque `equipos` está en `DESK_TABLES`. Ninguna tabla de `books.*` se escribe desde la App y la
tabla provisional **MUST NOT** replicarse desde el hub (RQ-ZS-08). La vista `public.clients` **MUST NOT** cambiar en
este cambio (ni su definición ni sus columnas: no existe columna `provisional` en la vista), y
`packages/zoho-sync/src/books/repo.ts` y el worker del hub **MUST NOT** modificarse: los provisionales se resuelven en
la capa de servicio de `apps/desk/server` (RQ-TC-34), por decisión de Gerencia del 02/10
(`decision/f1b15-clientes-provisionales-sin-tocar-la-vista`).

#### Scenario: Guardianes de migración en verde
- GIVEN el `schema.sql` con la tabla nueva y las `ALTER` de `equipos`
- WHEN corre el guardián de `CREATE TABLE` y el de `ALTER TABLE` (RQ-ZS-13)
- THEN pasan, y `clientes_provisionales` figura en `PUBLIC_TABLES`

#### Scenario: Una `CREATE` sin calificar se rechaza
- GIVEN el `.sql` ensuciado con `CREATE TABLE clientes_provisionales`
- WHEN corre el guardián
- THEN se pone rojo

#### Scenario: La vista de clientes queda intacta
- GIVEN el `schema.sql` tras el cambio
- WHEN se compara la definición de `public.clients` con la anterior al cambio

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

### RQ-ZS-17 · Ejecutor de la migración de tickets abiertos: seco por defecto, negativa total, marcador antes del `UPDATE`, idempotente

Un ejecutor (fichero nuevo bajo `apps/desk/server/db/`) **SHALL** aplicar el plan de `tickets-core` RQ-TC-41 sobre
`desk.tickets` y `desk.ticket_transitions`. Se expone por un endpoint de superadministrador **añadido al final** de
`apps/desk/server/routes/admin.ts`, sin mover ninguna línea existente. Recibe la fecha de corte y el parámetro
`aplicar`.

**Seco por defecto.** El ejecutor **MUST** escribir sólo con `aplicar=true` explícito (el literal `'true'` en la
petición, como los demás interruptores del proyecto). `aplicar` ausente o `false` **SHALL** ejecutar la pasada en
seco: calcula el plan e informa, no abre transacción (D-2) y **MUST NOT** escribir ninguna fila; **cualquier otro valor
(`1`, `TRUE`…) es `400`** (D-12), también en seco y sin leer nada. Esto **invierte** el convenio de los endpoints
actuales, donde lo opcional es `?dryRun=true` (`apps/desk/server/routes/admin.ts:83-84`).

**Fecha de corte obligatoria.** El `corte` es un instante ISO **con desfase** (`2026-12-01T00:00:00-05:00`); una fecha
pelada es `400` (D-11). Una petición sin `corte` o con un `corte` inválido **SHALL** rechazarse con `400` antes de
leer o escribir nada, también en seco.

**Sólo superadministrador.** El endpoint **SHALL** ir tras `requireAuth` y `requireSuperAdmin`, igual que sus
vecinos (`apps/desk/server/routes/admin.ts:17`, `apps/desk/server/routes/admin.ts:83`; `requireSuperAdmin` es el
alias local de `requireAdmin`). Un usuario autenticado que no lo sea **SHALL** recibir `403` y **MUST NOT** provocar
lectura del plan ni escritura; sin sesión, `401`. Lo impone el servidor: el cliente no participa.

**Negativa total.** Con `aplicar=true`, si el plan está bloqueado (algún ticket abierto, que se cambiaría, tiene un
estado sin equivalencia, `tickets-core` RQ-TC-40), el ejecutor **SHALL** no escribir **nada** —ni un marcador ni un
`UPDATE`—, y responder `409` con el informe completo, cuyo campo `negativa` es
`{ motivo: 'estados-sin-equivalencia', estados }` (D-13). En seco, los mismos estados salen con `200` y `negativa`
rellena. La comprobación **MUST** ir antes de cualquier escritura.

**Marcador antes del `UPDATE`, en una transacción.** Por cada ticket del plan, en la misma transacción, el ejecutor
**SHALL**:

1. insertar una fila en `ticket_transitions` (`packages/zoho-sync/src/db/schema.sql:57-61`) con
   `transition_id = 'migracion_f1f01_abiertos'`, `from_status` el estado previo, `area = 'Servicio Técnico'`,
   `performed_by` el actor de la migración, `transition_name` y `to_status` según la regla (D-6): **`NULL` en las
   reglas de identidad**, con el destino en `"values"`, y el destino en las dos reglas que cambian el estado.
   `"values"` lleva `estado_previo`, `estado_destino`, `status_type_previo`, `managed_by_app_previo`, `regla`,
   `corte` y `ejecutado_por`; y **después**
2. hacer el `UPDATE` de `desk.tickets … WHERE id = $1 AND managed_by_app = false RETURNING id`: `status` al destino,
   `status_type` sólo cuando D-10 lo cambia, `managed_by_app = true` y `updated_at = now()`. **No** toca
   `modified_time` (D-5), `closed_time` ni `source` (D-4). Si el `UPDATE` no devuelve fila, se lanza error y se
   deshace todo (D-3).

En seco no se abre transacción (D-2); al aplicar, la lectura del plan va **dentro** de la transacción, por el mismo
cliente (D-1). El orden marcador → `UPDATE` es deliberado, como en el molde de
`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`, y **SHALL** quedar fijado por una prueba que ponga
roja su inversión (regla de mutación 1). Si cualquier escritura falla, la transacción entera **SHALL** deshacerse:
no puede quedar un ticket marcado sin cambiar, ni cambiado sin marcador. El ejecutor **MUST NOT** usar
`applyTransition` (`packages/zoho-sync/src/db/repo.ts:322`): no es una transición del blueprint y no debe pasar por
sus guardas. Las sentencias **SHALL** ir con el esquema calificado donde corran fuera de la conexión de la aplicación
(en el procedimiento de RQ-ZS-18); en el ejecutor rige el `search_path` de la aplicación.

**Idempotencia.** Una segunda pasada con los mismos datos **SHALL** no cambiar nada: ningún `UPDATE` y ningún marcador
nuevo. Lo garantiza la frontera: tras la primera pasada los tickets tienen `managed_by_app = true` y el plan los
lista como ya gobernados (RQ-TC-41).

**Frontera ante el sincronizador.** Un ticket migrado queda con `managed_by_app = true`, así que `upsertTicket` sale
antes de escribir (`packages/zoho-sync/src/db/repo.ts:71`) y no sobrescribe ni el estado, ni el `status_type`, ni
ninguna otra columna. Supuesto S-1: la sincronización sigue corriendo y no hay interruptor para pararla; el
ejecutor **MUST NOT** añadir ninguno, ni tabla, ni columna, ni flag.

**El informe** es el mismo en seco y al aplicar, y **SHALL** contener:

- `corte`, `aplicar` y `aplicado` (no un «modo seco/aplicado»), y `negativa` (nula si no la hay);
- `abiertos` y `migrables`;
- `porEstado`: por pareja (estado de origen, estado de destino), con la regla, `cambiaEstado` y el recuento;
- `sinEquivalencia`, agrupado por estado, con recuento y números;
- `yaGobernados`, dos recuentos: `nacidosEnLaApp` y `deZoho`;
- `trasElCorte`, con número, estado y `created_time`;
- `sinRemisionVigente`: los que migran a `OV asignada` o `Ticket creado` sin remisión de entrada vigente, con número;
- `pendientes`, por ticket: número, clasificación y destino;
- `numeracion`: `masAltoAMarcar` (número más alto que se marcaría), `base` (`APP_TICKET_NUMBER_BASE`) y `arrastra`
  (`masAltoAMarcar` ≥ `base`; se informa y no bloquea, D-7);
- `avisos`, con el recordatorio de que la sincronización completa y reciente antes de marcar es requisito de persona
  (S-7). La línea «en `avisos`» de D-7 se lee como este campo del informe, no como la tabla `avisos`
  (**hipótesis**; no hay tabla nueva).

El informe **SHALL** ir además al log, porque quien lo dispara desde una consola no siempre conserva el cuerpo
(como `apps/desk/server/routes/admin.ts:88-92`).

**Alcance.** El ejecutor **MUST NOT** crear remisiones, ni tocar tickets cerrados, ni tickets nacidos tras el corte, ni
tickets de la aplicación con prefijo `app-` que ya estén gobernados. **Ningún código ejecuta esta herramienta contra
producción**: lo hace una persona.

#### Scenario: Sin `aplicar` no se escribe nada
- GIVEN una base con tickets abiertos que tienen equivalencia y la petición no trae `aplicar`
- WHEN corre el endpoint
- THEN responde el informe con `aplicar` y `aplicado` en `false`
- AND no se emite `BEGIN` y `desk.tickets` y `desk.ticket_transitions` quedan idénticas a como estaban

#### Scenario: `aplicar=false` es seco y cualquier otro valor es `400`
- GIVEN la misma base y `aplicar=false`, y por otro lado `aplicar=1` o `aplicar=TRUE`
- WHEN corre el endpoint
- THEN `aplicar=false` no escribe nada y responde en seco
- AND `aplicar=1` y `aplicar=TRUE` responden `400`, también en seco y sin leer nada

#### Scenario: Un `corte` sin desfase es `400`
- GIVEN un `corte` `2026-12-01`, o `2026-12-01T00:00:00` sin desfase
- WHEN corre el endpoint
- THEN responde `400` y no se lee ni se escribe nada

#### Scenario: `modified_time` y `source` intactos
- GIVEN un ticket que se migra con `aplicar=true`
- WHEN se compara la fila antes y después
- THEN `modified_time`, `source` y `closed_time` son los mismos y `updated_at` cambia

#### Scenario: El marcador de identidad no mueve `entradasActuales`
- GIVEN un ticket migrado por una regla de identidad, con `to_status` nulo en su marcador y el destino en `"values"`
- WHEN se calcula `entradasActuales` (`apps/desk/server/db/sla.ts:88-95`)
- THEN el marcador no cuenta como entrada al estado actual

#### Scenario: `numeracion.arrastra` a un lado y otro de 10000
- GIVEN tickets a marcar cuyo número más alto es 9999, y otra base donde es 10000
- WHEN corre el endpoint en seco
- THEN `numeracion.arrastra` es `false` en la primera y `true` en la segunda, y ninguna bloquea

#### Scenario: Un `UPDATE` sin fila deshace todo
- GIVEN un ticket que pasó a `managed_by_app = true` entre la lectura y la escritura
- WHEN se aplica la migración
- THEN el `UPDATE … RETURNING id` no devuelve fila, se lanza error y la transacción entera se deshace

#### Scenario: Con `aplicar=true` se marca y se cambia
- GIVEN un ticket `Entregado` con `status_type` distinto de `Closed` y `managed_by_app = false`, y un `Pendiente` de servicio
- WHEN corre el endpoint con `aplicar=true` y una fecha de corte
- THEN el primero queda `Finalizado` con `status_type = 'Closed'`, `managed_by_app = true` y `closed_time` intacto
- AND el segundo queda `En Proceso` con `managed_by_app = true`
- AND cada uno tiene exactamente una fila marcador en `ticket_transitions`

#### Scenario: El marcador guarda los tres valores previos
- GIVEN un ticket `Pendiente` con `status_type = 'On Hold'` y `managed_by_app = false`
- WHEN se aplica la migración
- THEN su marcador lleva `from_status = 'Pendiente'`, `to_status = 'En Proceso'` y en `"values"` `estado_previo`, `status_type_previo` y `managed_by_app_previo`, además de `estado_destino`, `regla`, `corte` y `ejecutado_por`

#### Scenario: Un solo estado sin equivalencia detiene todo
- GIVEN diez tickets con equivalencia y uno abierto con estado «En revisión externa»
- WHEN corre el endpoint con `aplicar=true`
- THEN responde `409` con el informe completo, cuya `negativa` nombra ese estado y `sinEquivalencia` ese ticket
- AND no se inserta ningún marcador y no se hace ningún `UPDATE`, ni siquiera sobre los diez que sí tenían equivalencia

#### Scenario: La negativa va antes de cualquier escritura
- GIVEN un plan bloqueado donde el ticket sin equivalencia es el último de la lista
- WHEN corre `aplicar=true` y se inspecta la base tras el error
- THEN ninguna fila cambió, de modo que mover la comprobación después del primer ticket pone roja la prueba

#### Scenario: El marcador va antes del `UPDATE`
- GIVEN un conector de pruebas que registra el orden de las sentencias
- WHEN se aplica la migración a un ticket
- THEN el `INSERT` en `ticket_transitions` precede al `UPDATE` de `desk.tickets` y ambos van dentro de la misma transacción
- AND invertir el orden pone roja una prueba

#### Scenario: Un fallo en mitad deshace todo
- GIVEN un fallo forzado en el `UPDATE` del segundo ticket
- WHEN se aplica la migración
- THEN el primer ticket no queda marcado ni cambiado, y no hay marcadores huérfanos

#### Scenario: Una segunda pasada no cambia nada
- GIVEN una base ya migrada con `aplicar=true`
- WHEN corre otra vez el endpoint con `aplicar=true` y los mismos datos
- THEN no se inserta ningún marcador y no cambia ninguna fila
- AND los tickets aparecen en la lista de ya gobernados

#### Scenario: Un ticket migrado no lo pisa el sincronizador
- GIVEN un ticket migrado, con `managed_by_app = true`, y un payload de Zoho con otro estado, otro `status_type` y otro asunto
- WHEN corre `upsertTicket`
- THEN no se escribe ninguna columna de `desk.tickets`

#### Scenario: Un ticket sin migrar sí lo pisa el sincronizador
- GIVEN un ticket con `managed_by_app = false` que el plan no cambió (p. ej. nacido tras el corte) y un payload de Zoho con otro estado
- WHEN corre `upsertTicket`
- THEN el estado se sobrescribe con el de Zoho, igual que hoy

#### Scenario: Cerrados, nacidos tras el corte y gobernados no se tocan
- GIVEN un ticket `Closed`, un abierto nacido tras el corte y un abierto con `managed_by_app = true`
- WHEN se aplica la migración
- THEN los tres quedan idénticos y sin marcador

#### Scenario: Sin fecha de corte, `400`, también en seco
- GIVEN una petición sin fecha de corte, y otra con fecha inválida
- WHEN corren el endpoint
- THEN las dos responden `400` y no se lee ni se escribe ninguna fila

#### Scenario: Quien no es superadministrador se rechaza
- GIVEN un usuario autenticado sin rol de administrador, y una petición sin sesión
- WHEN llaman al endpoint con `aplicar=true`
- THEN el primero recibe `403` y la segunda `401`
- AND no se escribe nada y no se calcula el plan

#### Scenario: El informe es igual en seco y al aplicar
- GIVEN la misma base
- WHEN corre el endpoint en seco y luego se prepara una copia idéntica y se aplica
- THEN los totales por pareja, los sin equivalencia, los ya gobernados, los nacidos tras el corte, los sin remisión vigente y el número más alto a marcar son los mismos en las dos respuestas

#### Scenario: El informe da el número más alto que se marcaría
- GIVEN tickets a marcar con números 4100 y 4300 y un ticket nacido tras el corte con 9500
- WHEN corre el endpoint en seco
- THEN el informe dice 4300

#### Scenario: El informe lista los abiertos sin remisión de entrada vigente y no crea ninguna
- GIVEN un ticket abierto en `OV asignada` sin remisión de entrada vigente
- WHEN se aplica la migración
- THEN el informe lo lista, sigue migrándose y no se inserta ninguna fila en las tablas de remisiones

#### Scenario: El endpoint se añade al final de `admin.ts`
- GIVEN `apps/desk/server/routes/admin.ts` antes y después del cambio
- WHEN se compara
- THEN las líneas existentes conservan su número y la ruta nueva va detrás de todas las anteriores

#### Scenario: No hay esquema nuevo ni flag nuevo
- GIVEN `packages/zoho-sync/src/db/schema.sql`, `.env.example` y `DEPLOY.md` tras el cambio
- WHEN se comparan con los de antes
- THEN no hay tabla, columna ni variable de entorno añadidas por este cambio

### RQ-ZS-18 · Reversión por marcador: sólo donde el marcador sigue siendo la última transición, restaurando los tres valores previos

El cambio **SHALL** entregar el procedimiento `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` con la reversión de
RQ-ZS-17 prefijada `-- REV ` (D-14): una sentencia por cada regla que cambia el estado **más una para las filas de
identidad**, que restaura sólo `managed_by_app`; el filtro es por la clave `"values"->>'regla'` del marcador y `status_type_previo` se RESTAURA. El diseño §8 sólo
nombra las reglas que cambian el estado: la de identidad es un **hueco del diseño** que se cierra aquí, porque sin
ella los marcadores de identidad no se borrarían. Las sentencias van **calificadas por esquema** (`desk.tickets`, `desk.ticket_transitions`), porque en `psql` el `search_path`
no es el de la aplicación, como en `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`. La reversión
**SHALL**, en una sola transacción:

1. restaurar, en cada ticket cuyo marcador `migracion_f1f01_abiertos` sea su **última** transición (el `id` máximo de
   `ticket_transitions` para ese ticket), los tres valores guardados en el marcador: `status`, `status_type` y
   `managed_by_app`;
2. borrar únicamente los marcadores de los tickets restaurados.

Un ticket que tenga transiciones **posteriores** al marcador (alguien lo movió desde la aplicación) **MUST NOT**
revertirse ni perder su marcador, y el procedimiento **SHALL** listarlo para decisión de una persona. La reversión
**MUST NOT** tocar `closed_time` (la migración tampoco lo tocó).

La copia previa de la base y la sincronización completa son requisitos de persona y quedan escritos en el
procedimiento. Tras revertir, `managed_by_app` vuelve a `false` en los tickets que lo tenían así, de modo que el
sincronizador vuelve a sobrescribirlos; el procedimiento **SHALL** decirlo. La reversión está **probada sobre pg-mem**
con una prueba que ejecuta el texto del procedimiento. **Hipótesis:** pg-mem puede no soportar toda sintaxis de
extracción de `jsonb` que use la reversión; si no, la forma de restaurar se decide en el diseño sin cambiar lo que
exige este requisito, y la primera lectura real es la pasada en seco de la persona.

#### Scenario: La reversión devuelve las filas a como estaban
- GIVEN una base migrada con `aplicar=true`, con tickets `Entregado` y `Pendiente` de servicio
- WHEN se ejecuta la reversión del procedimiento
- THEN cada ticket recupera su `status`, `status_type` y `managed_by_app` previos, iguales a los de antes de migrar
- AND los marcadores de esos tickets desaparecen

#### Scenario: Un ticket movido después del marcador no se revierte
- GIVEN un ticket migrado al que luego se le añadió otra fila en `ticket_transitions`
- WHEN se ejecuta la reversión
- THEN su `status`, `managed_by_app` y su marcador quedan como estaban
- AND el procedimiento lo lista para decisión de una persona

#### Scenario: La reversión sólo borra marcadores de lo restaurado
- GIVEN dos tickets migrados, uno movido después y otro no
- WHEN se ejecuta la reversión
- THEN queda el marcador del primero y no el del segundo

#### Scenario: La reversión es una sola transacción
- GIVEN el texto del procedimiento
- WHEN se inspecta
- THEN el `UPDATE` y el `DELETE` van entre un único `BEGIN` y un único `COMMIT`

#### Scenario: Las sentencias van calificadas
- GIVEN el texto del procedimiento
- WHEN se recorre
- THEN toda sentencia nombra `desk.tickets` o `desk.ticket_transitions`, ninguna sin esquema

#### Scenario: Una reversión repetida no cambia nada
- GIVEN una base ya revertida
- WHEN se ejecuta otra vez la reversión
- THEN no cambia ninguna fila, porque ya no hay marcadores

#### Scenario: La reversión no toca `closed_time`
- GIVEN un ticket `Entregado` con `closed_time` fijado, migrado y luego revertido
- WHEN se compara `closed_time` antes y después
- THEN es el mismo valor

### RQ-ZS-19 · Interruptor de entorno para APLICAR la migración de tickets abiertos (E-231)

`POST /api/admin/migrar-tickets-abiertos` (RQ-ZS-17) **MUST** rechazar `aplicar=true` con `403` mientras la variable
`MIGRACION_TICKETS_HABILITADA` no valga exactamente `true`. La variable **nace cerrada**: ausente o con cualquier otro valor
(`TRUE`, `1`, vacía…) está apagada, y se lee en `packages/zoho-sync/src/config.ts` como los demás interruptores.

El interruptor **SHALL** gobernar sólo `aplicar=true`: la pasada en seco (sin `aplicar` o con `aplicar=false`) sigue
respondiendo igual, y un `aplicar` inválido sigue siendo `400`. En el orden total de F1B-10 es escalón **B** (permiso):
corre detrás de la sesión y del rol, y **delante** de la validación de `corte` (C) y de cualquier lectura de la base.

#### Scenario: Apagado, aplicar=true no lee ni escribe
- GIVEN la variable apagada y un ticket abierto migrable
- WHEN un administrador llama con un `corte` válido y `aplicar=true`
- THEN responde `403` con un mensaje que nombra `MIGRACION_TICKETS_HABILITADA`
- AND no consulta `tickets` ni escribe en `tickets` ni en `ticket_transitions`

#### Scenario: Apagado, la pasada en seco sigue disponible
- GIVEN la variable apagada
- WHEN un administrador llama sin `aplicar` o con `aplicar=false`
- THEN responde `200` con el informe en seco, sin escribir

#### Scenario: El interruptor va antes del contenido y de la negativa
- GIVEN la variable apagada
- WHEN un administrador llama con `aplicar=true` y un `corte` inválido, o con un estado sin equivalencia en la base
- THEN responde `403`, no `400` ni `409`

#### Scenario: Encendido, el comportamiento de RQ-ZS-17
- GIVEN `MIGRACION_TICKETS_HABILITADA=true`
- WHEN un administrador llama con un `corte` válido y `aplicar=true`
- THEN la migración se aplica como describe RQ-ZS-17

### RQ-ZS-20 · Respaldo: copia nocturna y previa a cada cambio, cifrada, a un destino S3 compatible

La App **SHALL** volcar la base `desk` con `pg_dump` (formato `custom`), cifrar el volcado en el servidor con
AES-256-GCM y subirlo a un almacenamiento de objetos S3 compatible configurado sólo con variables de entorno
(`decision/p55-backup`, `decision/p55b-destino-copia`). Nada se vuelca ni se sube mientras `RESPALDO_HABILITADO` no
valga exactamente `true`.

**Dos disparos.** Una copia nocturna a la hora `RESPALDO_HORA` (por defecto, las 3) y una copia previa a cada cambio,
que un administrador lanza con `POST /api/admin/respaldo`. La ruta **MUST** responder `403` sin volcar nada con el
interruptor apagado, y `409` si ya hay una copia en curso.

**Retención por prefijo.** La copia nocturna del día 1 del mes **SHALL** ir a `mensual/`, la del domingo a `semanal/`
y el resto a `diaria/`; la previa, a `previa/`. Borrar lo caducado no lo hace la aplicación: lo hacen las reglas de
ciclo de vida del almacenamiento, con el bloqueo de borrado durante la retención.

**Fallo con aviso.** Si una copia falla, la App **MUST** mandar un correo al responsable (`RESPALDO_AVISO_EMAIL`) por el
canal de avisos, y no lanzar: un respaldo que falla no tumba la aplicación. El temporal del volcado **MUST** borrarse
siempre, también al fallar.

#### Scenario: Interruptor apagado
- GIVEN `RESPALDO_HABILITADO` ausente
- WHEN toca la copia nocturna o un administrador llama a la ruta
- THEN no se ejecuta `pg_dump` ni se sube nada; la ruta responde `403`

#### Scenario: Copia correcta
- GIVEN el interruptor encendido y el destino configurado
- WHEN corre la copia nocturna de un martes
- THEN se sube un objeto cifrado bajo `diaria/` con `Content-MD5`, firmado con SigV4, y el temporal se borra

#### Scenario: Copia que falla
- GIVEN el interruptor encendido y una subida que responde con error
- WHEN corre la copia
- THEN se manda un aviso al responsable con el motivo, el temporal se borra y no se lanza ninguna excepción

#### Scenario: Configuración incompleta
- GIVEN el interruptor encendido y falta el destino, las credenciales o la clave de cifrado
- WHEN toca una copia
- THEN no se vuelca nada y se avisa al responsable de qué variable falta

### RQ-ZS-21 · Respaldo: copia semanal, incremental y cifrada de la carpeta de documentación de servicio de Drive

La App **SHALL** copiar una vez por semana la carpeta raíz de Google Drive configurada por variable de entorno (y sus
subcarpetas) al mismo almacenamiento de objetos S3 compatible de RQ-ZS-20, cifrada y sin pasar por el disco del
servidor (`decision/p55b-destino-copia`, `openspec/config.yaml:2621`; adelantada con el interruptor cerrado por
`decision/f1f02-copia-semanal-drive-adelantada`, `openspec/config.yaml:3865-3881`). RQ-ZS-20 no se modifica.

**Interruptor.** Nada se lista, descarga ni sube mientras `RESPALDO_DRIVE_HABILITADO` no valga exactamente `true`
(`=== 'true'`; ausente, vacío o cualquier otro valor equivale a apagado). Apagado, la App **MUST NOT** pedir token a
Google.

**Alcance.** La copia **MUST** alcanzar sólo la carpeta raíz configurada y sus subcarpetas: «la carpeta de documentación
de servicio a la que enlaza Desk 2.0», no el resto del Drive de la empresa. Se ejecuta una vez por semana.

**Sin disco.** Cada documento viaja de Drive al almacenamiento en flujo. La App **MUST NOT** escribir en el disco del
servidor, ni siquiera temporales, durante la copia.

**Cifrado.** Cada objeto **MUST** cifrarse con el mismo esquema y la misma clave que la copia nocturna (`DESKR1`,
AES-256-GCM, `apps/desk/server/respaldo/cifrado.ts:12`), de modo que la herramienta de restauración existente los
descifra sin cambios.

**Incremental.** La primera pasada **SHALL** copiar todo. Las siguientes **SHALL** subir sólo los documentos nuevos o
cambiados según el criterio de cambio que declare el diseño; un documento sin cambios **MUST NOT** volver a subirse.

**Retención de 12 meses, por la aplicación.** La App **SHALL** borrar una versión superada hace más de 12 meses y la copia
de un documento desaparecido de Drive hace más de 12 meses. La última copia de un documento vivo **MUST NEVER** borrarse,
por antigua que sea. El bloqueo de borrado durante la retención lo configura una persona en el almacenamiento y no lo
verifica este requisito. Si un borrado falla, la App **MUST** avisar y continuar la pasada.

**Fallo con aviso.** Si la pasada falla (credencial, listado, descarga, subida, configuración incompleta), la App **MUST**
mandar un correo al responsable (`RESPALDO_AVISO_EMAIL`) por el canal de avisos y no lanzar. **MUST** haber una sola
pasada a la vez.

**Equipos fuera de la raíz.** Cada pasada **SHOULD** avisar, sin copiarlos, de los `drive_url` de equipos que no caen
dentro de la carpeta raíz configurada. El diseño puede diferirlo.

**Fuera de este requisito.** La prueba mensual de restauración (incluye recuperar un documento de la carpeta) es tarea de
persona y este requisito no la exige.

#### Scenario: Interruptor apagado
- GIVEN `RESPALDO_DRIVE_HABILITADO` ausente o distinto de `true`
- WHEN toca la pasada semanal
- THEN no se pide token a Google, no se lista ni descarga nada y no se sube nada

#### Scenario: Primera pasada
- GIVEN el interruptor encendido, el destino configurado y una carpeta raíz con tres documentos, uno en una subcarpeta
- WHEN corre la primera pasada
- THEN se suben los tres documentos, cifrados en `DESKR1` con la clave de la nocturna

#### Scenario: Pasada incremental
- GIVEN una pasada previa y, desde entonces, un documento nuevo, uno cambiado y uno sin cambios
- WHEN corre la pasada siguiente
- THEN se suben el nuevo y el cambiado, y el que no cambió no se vuelve a subir

#### Scenario: Fuera de la carpeta raíz
- GIVEN documentos de Drive fuera de la carpeta raíz configurada
- WHEN corre la pasada
- THEN no se listan ni se copian

#### Scenario: Sin escritura en disco
- GIVEN una pasada que copia un documento
- WHEN se observan las escrituras al sistema de ficheros del servidor
- THEN no hay ninguna (ni temporales); y una prueba que introduzca una escritura temporal en el camino de copia se pone en rojo

#### Scenario: Restauración con la herramienta existente
- GIVEN un objeto subido por esta copia
- WHEN la herramienta de restauración existente lo descifra con la misma clave
- THEN recupera el contenido original del documento

#### Scenario: Retención de versión superada
- GIVEN un documento vivo con una versión superada hace más de 12 meses y otra superada hace menos
- WHEN corre la retención
- THEN se borra la primera, se conserva la segunda y se conserva la última copia

#### Scenario: Última copia de un documento vivo
- GIVEN un documento vivo que no cambia desde hace más de 12 meses
- WHEN corre la retención
- THEN su única copia no se borra

#### Scenario: Documento desaparecido de Drive
- GIVEN un documento que desapareció de Drive hace más de 12 meses
- WHEN corre la retención
- THEN se borran todas sus copias; si hace menos de 12 meses, se conservan

#### Scenario: Listado incompleto
- GIVEN un listado de Drive que falla a media pasada (la raíz o cualquier página)
- WHEN corre la pasada
- THEN ningún documento se marca como desaparecido de Drive y se avisa al responsable

#### Scenario: Índice ilegible
- GIVEN un índice de lo ya copiado que existe pero no se puede leer ni descifrar
- WHEN corre la pasada
- THEN no se copia ni se borra nada y se avisa al responsable; sólo un índice inexistente equivale a la primera pasada

#### Scenario: Borrado que falla
- GIVEN el almacenamiento rechaza un borrado por el bloqueo de retención
- WHEN corre la retención
- THEN se avisa al responsable y la pasada sigue con el resto

#### Scenario: Pasada que falla
- GIVEN el interruptor encendido y una descarga o subida que responde con error
- WHEN corre la pasada
- THEN se manda un aviso al responsable con el motivo y no se lanza ninguna excepción

#### Scenario: Pasada ya en curso
- GIVEN una pasada en curso
- WHEN se dispara otra
- THEN la segunda no arranca

#### Scenario: Configuración incompleta
- GIVEN el interruptor encendido y falta la credencial de Drive, la carpeta raíz, el destino o la clave de cifrado
- WHEN toca la pasada
- THEN no se copia nada y se avisa al responsable de qué variable falta

#### Scenario: `drive_url` fuera de la raíz
- GIVEN un equipo cuyo `drive_url` no cae dentro de la carpeta raíz
- WHEN corre la pasada
- THEN se avisa de ese `drive_url` y no se copia su contenido

### RQ-ZS-22 · El incremental de tickets se guía por la fecha de modificación, con marca de agua y caída explícita

El incremental de tickets (`syncRecent`) **SHALL** traer de Zoho los tickets modificados desde una marca de agua, por la
búsqueda de tickets con rango de fecha de modificación, en orden **ascendente** por fecha de modificación y paginado hasta
agotar. Un cierre o un cambio de estado hecho en Zoho sin conversación nueva **MUST** llegar a la réplica en el ciclo
siguiente, aunque el ticket haya salido de la ventana de los 100 con actividad de conversación más reciente.

**Marca de agua.** Es el máximo de `modified_time` de los tickets de origen Zoho de la réplica, **excluyendo** los nacidos
en la App (prefijo `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`) y las filas con
`managed_by_app = true`, **menos un solape de 15 minutos**. La exclusión es obligatoria: la App escribe `modified_time`
con su propio reloj (`packages/zoho-sync/src/db/repo.ts:298`, `apps/desk/server/db/prioridadCliente.ts:93`) y una
transición hecha en la App **MUST NOT** adelantar la marca por encima de cambios de Zoho aún sin traer.

**Orden ascendente.** Lo persistido en un ciclo **MUST** ser un prefijo de lo pendiente: si se alcanza el tope de
paginación de la búsqueda o falla una página intermedia, la marca avanza hasta lo persistido y el ciclo siguiente
continúa desde ahí, sin hueco.

**Sin marca de agua.** Si la réplica no tiene tickets o ninguno es elegible, el ciclo **MUST** conservar el
comportamiento anterior: la primera página por conversación reciente (`-recentThread`). La carga inicial sigue siendo
de `backfillTickets`.

**Fallo de la búsqueda.** Si la búsqueda responde no-OK (o lanza), la App **MUST** escribir en el log un error explícito
que nombre la búsqueda y el código de estado, y **ese ciclo MUST** caer al comportamiento anterior. El ciclo **MUST NOT**
lanzar por ello.

**Lo que no cambia.** La guarda de `upsertTicket` sobre filas gestionadas por la App (`packages/zoho-sync/src/db/repo.ts:71`)
**MUST** seguir igual: el incremental por modificación no reescribe lo que la guarda protege. Un ticket que falla al
persistir **MUST NOT** abortar el lote (ya es así, `persistEach`, `packages/zoho-sync/src/sync.ts:126-136`).

**Datos completos.** Ninguna columna que hoy se puebla desde el detalle del ticket (`customFields`, `description`,
`closedTime`, `onholdTime`; `packages/zoho-sync/src/db/mappers.ts:43-57`) **MUST** quedar vaciada por venir de la
búsqueda. Si la respuesta de búsqueda no las trae, el diseño decide si relee el detalle o persiste otra forma; la
especificación sólo exige el resultado.

#### Scenario: Cierre en Zoho sin conversación nueva, fuera de la ventana de 100
- GIVEN una réplica con el ticket T abierto y `modified_time` M
- AND Zoho tiene T cerrado con `modifiedTime` > M, sin hilo nuevo, y más de 100 tickets con conversación más reciente
- WHEN corre el incremental de tickets
- THEN la búsqueda se pide con rango de modificación desde M menos 15 minutos
- AND la réplica queda con T en estado cerrado y su `closed_time` poblado

#### Scenario: Más de una página de modificados
- GIVEN más modificados que el tamaño de una página de la búsqueda
- WHEN corre el incremental
- THEN se piden páginas sucesivas en orden ascendente por `modifiedTime` hasta agotar
- AND todos quedan persistidos

#### Scenario: Tope de paginación alcanzado
- GIVEN más modificados de los que la búsqueda permite recorrer en un ciclo
- WHEN corre el incremental
- THEN se persiste el prefijo más antiguo
- AND el ciclo siguiente parte de una marca que no deja fuera a ninguno de los pendientes

#### Scenario: Una transición hecha en la App no adelanta la marca
- GIVEN una fila con `managed_by_app = true` y `modified_time` posterior al de todas las filas de origen Zoho
- WHEN se calcula la marca de agua
- THEN la marca ignora esa fila
- AND vale el máximo `modified_time` de las filas elegibles menos 15 minutos

#### Scenario: Un ticket nacido en la App no cuenta para la marca
- GIVEN una fila cuyo identificador lleva el prefijo `PREFIJO_TICKET_APP` y el `modified_time` más alto
- WHEN se calcula la marca de agua
- THEN esa fila se excluye

#### Scenario: Réplica vacía o sin filas elegibles
- GIVEN una réplica sin tickets, o cuyos tickets son todos nacidos en la App o con `managed_by_app = true`
- WHEN corre el incremental
- THEN no se llama a la búsqueda por modificación
- AND se pide la primera página por `-recentThread`, como antes

#### Scenario: La búsqueda responde no-OK
- GIVEN una marca de agua válida y una búsqueda que responde con un código distinto de OK
- WHEN corre el incremental
- THEN el log recibe un error que nombra la búsqueda y el código de estado
- AND ese ciclo pide la primera página por `-recentThread`
- AND el ciclo no lanza

#### Scenario: Un ticket falla al persistir
- GIVEN un lote de modificados donde uno falla al persistir
- WHEN corre el incremental
- THEN el fallo se registra y el resto del lote se persiste

#### Scenario: Fila gestionada por la App
- GIVEN Zoho devuelve como modificado un ticket cuya fila tiene `managed_by_app = true`
- WHEN el incremental lo persiste
- THEN `upsertTicket` se abstiene como hoy y la fila no cambia

#### Scenario: Ninguna columna promovida se vacía
- GIVEN un ticket con `customFields`, `description`, `closedTime` y `onholdTime` poblados en la réplica
- AND la respuesta de la búsqueda lo trae sin alguno de esos campos
- WHEN el incremental lo persiste
- THEN esas columnas conservan sus valores del detalle del ticket
