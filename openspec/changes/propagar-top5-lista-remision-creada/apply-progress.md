# Progreso del apply — propagar-top5-lista-remision-creada

Cambio `propagar-top5-lista-remision-creada` (`tanda: F1B-07`, `cierra: no`). Modo: `strict_tdd`, `hybrid`.

## Lote L1 — marca por fila `prioridad_en_app_at` — COMPLETO

Commit de partida del intento: `27379a02c8a25a1635b870a259e001f2f3a16863`.

### Líneas antes y después

| Fichero | Antes | Después | Netas |
|---|---|---|---|
| `packages/zoho-sync/src/db/repo.ts` | 452 | 452 | **0** (`git diff --numstat`: 5 ins / 5 borr) |
| `packages/zoho-sync/src/db/schema.sql` | 707 | 710 | +3, al final |
| `packages/zoho-sync/src/db/migrate.test.ts` | 746 | 765 | +19 (3 en sitio, 1 en sitio más en `:652`, 19 nuevas al final) |
| `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts` | — | 81 | nuevo |

### Rojos observados (antes de tocar `schema.sql` y `repo.ts`)

`npx vitest run repoPrioridadEnApp.test.ts migrate.test.ts` → `7 failed | 50 passed`:

- `migrate.test.ts` › «son 51 ALTER: …» → `AssertionError: ALTER TABLE en schema.sql: expected 50 to be 51`.
- `migrate.test.ts` › «propagar-top5 (L1) · la ALTER de prioridad_en_app_at no rellena filas previas» →
  `sentencias de schema.sql que mencionan prioridad_en_app_at: expected [] to have a length of 1 but got +0`.
- `repoPrioridadEnApp.test.ts` › «con la marca, una prioridad distinta de Zoho no la cambia; subject sí; managed_by_app sigue false»,
  «las dos marcas a la vez protegen la orden de venta y la prioridad; subject cambia» y «una fila sólo con la marca de
  prioridad SÍ actualiza orden_venta» → `Error: Column "prioridad_en_app_at" not found` (x2) /
  `column "prioridad_en_app_at" does not exist`. **El fallo es la columna inexistente, no `priority` pisada**: el `UPDATE`
  que pone la marca falla antes de llegar al `upsertTicket`; el «`priority` pisada» sólo se observa tras añadir la columna
  (ver M2).
- Dos de las de caracterización también cayeron por la misma razón (la columna no existe) y no son rojos de
  comportamiento: «managed_by_app=true gana aunque la marca esté puesta» y «upsertTicket nunca escribe la marca».
  **Declaración:** las de caracterización (sin marca manda Zoho; `managed_by_app` gana; no escribe la marca; la marca no
  está en `TICKET_COLS`) son guardianes que nacen verdes en cuanto la columna existe; «sin marca manda Zoho» y «la marca
  no está en `TICKET_COLS`» pasaron en verde desde el principio.

**Hallazgo no previsto por `tasks.md`:** `migrate.test.ts` › «las seis sentencias nuevas van DETRÁS de prioridad_ajustes…»
(`:648-661`) fija por posición el número de sentencias tras `idx_prioridad_ajustes_ticket` (`ultima + 1 + 6 + 2 + 17`).
Quedó rojo (`expected 146 to be 145`) al añadir la `ALTER` al final; se actualizó en sitio en `:652` (`+ 1` y el mensaje),
cero líneas netas. Es el recuento «posicional» del guardián de `schema.sql`, el mismo molde que los otros.

### Verde

- `schema.sql:708-710`: dos líneas de comentario sin punto y coma y
  `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;` (sin calificar; `tickets` es de `DESK_TABLES`).
  Sin relleno.
- `repo.ts:67` (SELECT), `:70` (tipo), `:76-78` (tres líneas, mismo número que antes). `:71` intacta y primera.
  `ov_elegida_en_app_at` y la discrepancia de la OV no cambian.
- `npx vitest run` de los dos ficheros: `57 passed`.
- Conservada la terminación de línea CRLF de los tres ficheros editados (`file` lo confirma).

### Mutaciones (copias de seguridad en el directorio temporal del agente; revertidas con `cp`, no con `git checkout`)

| # | Cambio exacto | Qué cae (literal) |
|---|---|---|
| M1 (regla 1, posición) | `repo.ts`: la línea `if (prev?.managed_by_app === true) return null …` (`:71`) se borra de su sitio y se inserta justo antes de `return discrepancia` (tras el `await db.query` de `:89-93`) | `repoPrioridadEnApp.test.ts` › «managed_by_app=true gana aunque la marca esté puesta: el salto de la fila entera sigue PRIMERO» → `expected 'En Proceso' to be 'Ingresado'`; además `repo.test.ts` › «upsertTicket NO sobrescribe si managed_by_app=true» → `expected 'Ingresado' to be 'En Proceso'` y «managed_by_app=true gana aunque la marca esté puesta: el salto de :59 sigue PRIMERO» → `expected 'En Proceso' to be 'Ingresado'`. 3 caídas |
| M2 | `repo.ts:78`: `c === 'priority'` → `c === 'prioridad'` | Las TRES rojas de `repoPrioridadEnApp.test.ts` (no dos): «con la marca, una prioridad distinta…» → `expected 'Low' to be 'High'`; «las dos marcas a la vez…» → `expected 'Low' to be 'High'`; «una fila sólo con la marca de prioridad SÍ actualiza orden_venta» → `expected 'Low' to be 'High'` |
| M10 (regla 2, fichero vigilado) | `schema.sql`: se añade al final `UPDATE tickets SET prioridad_en_app_at = now();` | `migrate.test.ts` › «sólo hay UNA sentencia relacionada…» → `expected [ …(2) ] to have a length of 1 but got 2`; también «las seis sentencias nuevas van DETRÁS…» → `expected 147 to be 146` y «EN12-2 · un ticket Finalizado … idéntico tras un segundo migrate» → `expected [ …(2) ] to deeply equal [ …(2) ]` |
| M9 (regla 2, fichero vigilado) | `schema.sql`: se añade al final `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS x text;` | `migrate.test.ts` › «toda ALTER TABLE apunta a una tabla clasificada…» → `expected [ 'public.tickets' ] to deeply equal []`; «son 51 ALTER…» → `expected 52 to be 51`; «las seis sentencias nuevas van DETRÁS…» → `expected 147 to be 146`. **La que nombraba la tarea (`migrate.test.ts:332`) es la primera** |

Tras la última: `cmp` de `repo.ts` y `schema.sql` contra sus copias del verde da idéntico; `git diff --numstat` sólo muestra
el verde de L1.8-L1.9.

### Regla 13 (L1)

«Que el sincronizador no pise la prioridad» lo impone `upsertTicket` (`packages/zoho-sync/src/db/repo.ts:76-78`), en el
servidor y sin espejo en el cliente: es la única comprobación que hay, y está probada (`repoPrioridadEnApp.test.ts`). El
cliente no participa. El ajuste manual (`ajustarPrioridad`, `managed_by_app = true`) no cambia.

### Cierre (códigos de salida literales)

```
test exit=0
typecheck exit=0
lint exit=0
Test Files  189 passed | 1 skipped (190)
Tests  2962 passed | 2 skipped (2964)
✖ 165 problems (0 errors, 165 warnings)
```

Antes del lote: 2.954 y 2 omitidas en 188 + 1. Ahora +8 pruebas (7 del fichero nuevo, 1 de `migrate.test.ts`) y +1 fichero.
Una primera pasada dio 166 avisos: era un `as any` de mi `zTicket` copiado de `repo.test.ts`; sustituido por
`as unknown as Parameters<typeof ticketRowFromZoho>[0]`, vuelve a 165.

### Medida del intento

- `git diff --shortstat --no-renames 27379a0`: 3 files changed, 31 insertions(+), 9 deletions(-) → **40**.
- Sin trackear: `repoPrioridadEnApp.test.ts` 81 + este `apply-progress.md` (ver el informe del apply para la cifra final).
- Binarios: ninguno.

## Lote L2a — propagación y reversión — COMPLETO (pendiente de commit, settle y fusión del orquestador)

Commit de partida del intento: `081e78ed624e625f9e8c38e7571d993a76eaefcb` (L1). El corte L2a-bis (atómica y recuento de lecturas)
queda fuera de este lote, tal como confirmó el orquestador.

### Líneas antes y después

| Fichero | Antes | Después | Netas |
|---|---|---|---|
| `apps/desk/server/routes/prioridad.ts` | 87 | 87 | **0** (`git diff --numstat`: 2 ins / 2 borr: import `:8` y llamada `:44`) |
| `apps/desk/server/db/prioridadCliente.ts` | 96 | 124 | +28 al final; 2 modificadas en sitio (imports `:2-3`, mismo número de líneas) |
| `packages/zoho-sync/src/db/schema.sql` | 710 | 714 | +4, al final |
| `packages/shared/src/index.ts` | 31 | 32 | +1, al final |
| `packages/zoho-sync/src/db/migrate.test.ts` | 765 | 765 | **0** (5 ins / 5 borr: título, `:376`, `:377`, `:385`, `:652`) |
| `apps/desk/server/prioridadTop5.test.ts` | 399 | 399 | **0** (10 / 10: bloque `:179-194` con 16 líneas y la consulta del helper `ajustes` `:210`, que añade `origen`) |
| `packages/shared/src/prioridadPropagada.ts` | — | 45 | nuevo |
| `packages/shared/src/prioridadPropagada.test.ts` | — | 79 | nuevo |
| `apps/desk/server/propagarTop5.test.ts` | — | 225 | nuevo |

CRLF conservado en todo el código y las pruebas (`file`). Un `sed -i` mío convirtió `prioridadTop5.test.ts` a LF; lo reconvertí y `file` lo confirma.

### Rojos observados (antes de tocar `schema.sql`, `shared` y el servidor)

- `prioridadPropagada.test.ts` → `Error: Cannot find module './prioridadPropagada' imported from …/prioridadPropagada.test.ts` (la función no existe).
- `migrate.test.ts` › «son 53 ALTER: …» → `AssertionError: ALTER TABLE en schema.sql: expected 51 to be 53`; «las seis sentencias nuevas van DETRÁS de prioridad_ajustes…»
  → rojo por el recuento posicional (el guardián que L1 ya había tocado; subido `+ 2` en sitio, `:652`).
- `prioridadTop5.test.ts` › **TC24-14** invertida → `AssertionError: expected [ 'Low', 'Low' ] to deeply equal [ 'High', 'High' ]`;
  **TC24-15** invertida → falla (por `column "origen" does not exist`: el helper `ajustes()` ya pide la columna nueva y cae antes de la aserción de prioridad).
  Nueve caídas en ese fichero: las dos invertidas y siete del bloque del ajuste manual, que caen por el mismo motivo (`column "origen" does not exist`)
  porque `ajustes()` ahora selecciona `origen`. Es consecuencia del helper y se cura con la `ALTER`.
- `propagarTop5.test.ts` → 22 de 22 rojas. Literales de las de comportamiento: «los cerrados y los de otro cliente quedan intactos…» →
  `expected [ 'Low', 'Low', 'Low', 'Low' ] to deeply equal [ 'High', 'Low', 'Low', 'Low' ]`; «las esperas (On Hold) y el status_type nulo…» →
  `expected [ 'Low', 'Low' ] to deeply equal [ 'High', 'High' ]`; «la exención va ANTES de nada más…» → `expected [ 'Low', 'Low', 'Low' ] to deeply equal [ 'Low', 'Low', 'High' ]`;
  «con contrato vigente y un Top 5 Low…» → `expected 'Low' to be 'High'`; «sin contrato, un Top 5 más bajo baja el ticket (S-5)» → `expected 'High' to be 'Low'`;
  «cambiar la prioridad de un Top 5 propaga (S-6)…» → `expected 'Low' to be 'Medium'`; «una prioridad escrita por una transición…» → `expected 'Medium' to be 'Low'`;
  «revertir a sin prioridad…» → `expected null to be 'High'`; «un Top 5 previo no se propaga solo» → `expected 'Low' to be 'High'`;
  «devuelve ticketsCambiados (2 de 3)» → `expected { clientId: 'cli-1', top5: true, …(3) } to match object …`;
  «el cuerpo no dirige la propagación» → `expected [ 'Low', 'Low' ] to deeply equal [ 'High', 'High' ]`.
  El resto (esquema `a` NULL, 403/422/404, H5, caracterización del `POST`, sin base, exentos de origen sucio) cayeron por `column "origen" does not exist`.
- **Nacen verdes (caracterización), declarado:** el ajuste manual (`POST`) fija `managed_by_app`, no pone `prioridad_en_app_at` y deja `origen` NULL (cae hoy sólo por la columna
  inexistente del helper y queda verde con ella); «403 con tickets que propagar» y «422 y 404 no propagan» sólo discriminan bajo la mutación M3; «ticket sin base no se toca»
  es verde por construcción y lo invierte L2b.
- **Hipótesis `DROP NOT NULL` (L2a.6): CONFIRMADA.** Tras la `ALTER`, pg-mem acepta una fila con `a` NULL y otra con `origen` NULL («esquema · prioridad_ajustes admite a NULL…» verde).
  **No hizo falta el plan B** (`''`).

### Verde

- `schema.sql:711-714`: dos líneas de comentario sin punto y coma, `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` y
  `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;`. Calificadas. Sin relleno.
- `packages/shared/src/prioridadPropagada.ts`: `ORIGENES_TOP5`, `MOTIVO_POR_ORIGEN`, `esAjusteManual`, `baseDeTop5`, `cambioPorTop5` (orden: manual, base, fórmula, igual) sobre `prioridadAlNacer`. Exportado al final de `index.ts`.
- `prioridadCliente.ts`: `fijarYPropagarPrioridadCliente(db, a, hoy?)` al final: `enTransaccion`, `fijarPrioridadCliente(q, …)`, tres lecturas fijas (abiertos, trazas, contratos) y por ticket cambiado un `UPDATE`
  (`priority`, `prioridad_en_app_at = now()`, `updated_at = now()`) y un `INSERT` de traza con `origen`. Devuelve `{ ...fila, ticketsCambiados }`.
- `routes/prioridad.ts`: `:8` importa la nueva función y `:44` la llama; la guarda de `:40` sigue antes.
- Los cuatro ficheros de L2a: `140 passed (140)`.

**Desviación menor del diseño:** `prioridadCliente.ts:3` lleva dos `import` en la misma línea (`import { enTransaccion } …; import { hayContratoVigente } …`) para no añadir una línea por encima de lo citado («nada por encima se mueve»).
**Límite conocido que L2b debe cubrir:** `ajustesDelTicket` (`prioridadCliente.ts:81`) hace `String(f.a)`: con `a` NULL (reversión a «sin prioridad») el `GET` del ticket devolvería la cadena `"null"`. Es el cambio `:76`, `:80` y `:81` de L2b; no se toca en L2a.

### Mutaciones (copias de seguridad en el directorio temporal del agente; restauradas con `cp` y comprobadas con `cmp`, no con `git checkout`)

| # | Cambio exacto (fichero: original → mutado) | Qué cae (literal) |
|---|---|---|
| M3 (regla 1, posición) | `routes/prioridad.ts`: justo antes de la guarda `if (!puedeFijarPrioridadTop5(user)) …` (`:40`) se inserta `await fijarYPropagarPrioridadCliente(db, { clientId, top5: true, prioridad: 'High', por: user.name })` | `propagarTop5.test.ts` › «403 con tickets que propagar: siguen Low y sin traza» → `expected 'High' to be 'Low'`; «422 y 404 no propagan ni dejan traza» → `expected 'High' to be 'Low'`; «devuelve ticketsCambiados (2 de 3)» → `expected { clientId: 'cli-1', top5: true, …(4) } to match object …`; «cambiar la prioridad de un Top 5 propaga (S-6)…» → `expected [ [ 'Low', 'High', 'top5' ], …(3) ] to deeply equal [ …(2) ]`. En `prioridadTop5.test.ts` caen TC27-3, TC27-5 y TC27-6 (`expected [ { client_id: 'cli-1', …(4) } ] to deeply equal []`). 4 + 3 caídas |
| M5 (regla 1) | `prioridadPropagada.ts` `baseDeTop5`: `const tras = filas.slice(filas.map((f) => f.origen).lastIndexOf('top5_revertido') + 1)` → `const tras = filas.slice(0)` | `prioridadPropagada.test.ts` › «corta en la última reversión» → `expected { de: 'Low' } to deeply equal { de: 'Medium' }`; «ciclo marcar, desmarcar, transición a Medium, marcar, desmarcar…» → `expected { de: 'High', a: 'Low', …(1) } to deeply equal { de: 'High', a: 'Medium', …(1) }` |
| M6 | `prioridadPropagada.ts` `cambioPorTop5`: se borra la línea `if (x.filas.some((f) => esAjusteManual(f.origen))) return null` | `propagarTop5.test.ts` › «la exención va ANTES de nada más…» → `expected [ 'Low', 'High', 'High' ] to deeply equal [ 'Low', 'Low', 'High' ]`; «con un ajuste manual el ticket no cambia al marcar…» → `expected 'High' to be 'Medium'`; «un origen desconocido y un origen vacío eximen» → `expected [ 'High', 'High' ] to deeply equal [ 'Low', 'Low' ]`; `prioridadPropagada.test.ts` › «un ajuste manual, antes o después de propagar, exime al ticket» y «un origen desconocido exime» → `expected { Object (de, a, ...) } to be null`. 5 caídas |
| M7 (regla 2, datos) | Los datos sucios (una fila con `origen` NULL y otra con `origen = 'otro'`) los inserta la prueba «un origen desconocido y un origen vacío eximen» sin tocar código: ambos tickets quedan en `Low`. Después `esAjusteManual`: `return !(typeof origen === 'string' && (ORIGENES_TOP5 as readonly string[]).includes(origen))` → `return origen == null` | `propagarTop5.test.ts` › «un origen desconocido y un origen vacío eximen (falla cerrado)» → `expected [ 'High', 'Low' ] to deeply equal [ 'Low', 'Low' ]` (cae sólo el de `'otro'`); `prioridadPropagada.test.ts` › `"" es manual`, `"otro" es manual`, `"TOP5" es manual`, `7 es manual`, `{} es manual` → `expected false to be true`; «sin filas, o sólo manuales» → `expected { de: 'Low' } to be null`; «un origen desconocido exime» → `expected { Object (de, a, ...) } to be null`. 8 caídas |
| M8 (regla 2, fichero vigilado) | `schema.sql`: se añade al final `ALTER TABLE prioridad_ajustes ADD COLUMN IF NOT EXISTS x text;` (sin calificar) | `migrate.test.ts` › «toda ALTER TABLE apunta a una tabla clasificada…» → `ALTER TABLE cuya identidad calificada no está en DESK_TABLES, public.* ni books.*: expected [ 'prioridad_ajustes' ] to deeply equal []`; «las ALTER sin calificar son exactamente las de DESK_TABLES…» → `ALTER TABLE sin calificar sobre una tabla que no es de Desk…: expected [ 'prioridad_ajustes' ] to deeply equal []`; «son 53 ALTER…» → `expected 54 to be 53`; «las seis sentencias nuevas van DETRÁS…» cae también. 4 caídas |

Ficheros de prueba para reproducirlas: M3 `apps/desk/server/propagarTop5.test.ts apps/desk/server/prioridadTop5.test.ts`; M5, M6 y M7 `packages/shared/src/prioridadPropagada.test.ts apps/desk/server/propagarTop5.test.ts`; M8 `packages/zoho-sync/src/db/migrate.test.ts`.
Tras la última, `cmp` de `routes/prioridad.ts`, `prioridadCliente.ts`, `schema.sql` y `prioridadPropagada.ts` contra las copias del verde da idéntico; `git diff --numstat` sólo muestra el verde.
M4 (atómica) es de L2a-bis y no se ejecuta aquí.

### Regla 13 (L2a), decisión a decisión

| Decisión | Quién la impone | Línea del servidor |
|---|---|---|
| Quién marca o desmarca | Servidor, probado | `apps/desk/server/routes/prioridad.ts:40` (la mutación M3 prueba que la guarda va antes) |
| Qué tickets se tocan | Servidor; el cliente no envía tickets (probado: el cuerpo se ignora) | las consultas de abiertos y de trazas de `fijarYPropagarPrioridadCliente` (`apps/desk/server/db/prioridadCliente.ts:110-111`) |
| Qué prioridad toma cada uno | `shared`, consumida | `cambioPorTop5` (`packages/shared/src/prioridadPropagada.ts:36`) → `prioridadAlNacer` (`packages/shared/src/contratos.ts:66-69`) |
| Que el sincronizador no la pise | Servidor | `packages/zoho-sync/src/db/repo.ts:76-78` (L1) y el `UPDATE` que pone `prioridad_en_app_at` (`prioridadCliente.ts:118`) |
| Qué ajustes eximen | Servidor, en `shared` | `esAjusteManual` (`prioridadPropagada.ts:24`), falla cerrado |

Comodidad del cliente: **ninguna en L2a**. El cliente no se toca; el recuento `ticketsCambiados` que devuelve el `PUT` lo enseñará L2b.

### Cierre (códigos de salida literales)

```
test exit=0
typecheck exit=0
lint exit=0
Test Files  191 passed | 1 skipped (192)
Tests  3011 passed | 2 skipped (3013)
✖ 165 problems (0 errors, 165 warnings)
```

Antes del lote: 2.962 y 2 omitidas en 189 + 1. Ahora +49 pruebas y +2 ficheros.

### Medida del intento

- `git diff --shortstat --no-renames 081e78e`: 6 files changed, 52 insertions(+), 19 deletions(-) → **71**.
- Sin trackear: `propagarTop5.test.ts` 225 + `prioridadPropagada.ts` 45 + `prioridadPropagada.test.ts` 79 = **349**.
- Código y pruebas: **420**; con esta sección de `apply-progress.md` (~85) y las casillas de `tasks.md`: ~510 (techo 800, válvula 720).
- Binarios: ninguno.

## Lote L2a-bis — atómica y recuento de lecturas — COMPLETO (pendiente de commit, settle y fusión del orquestador)

Commit de partida del intento (L2a-bis y L2b, un solo intento): `98e97f6`. Sólo pruebas: ningún fichero de producción tocado.

### Pruebas nuevas, todas VERDES DESDE EL PRINCIPIO (caracterización, declarado)

`apps/desk/server/propagarTop5Atomica.test.ts` (69 líneas, nuevo). El código de `fijarYPropagarPrioridadCliente` ya era transaccional desde L2a, así que **no hay rojo previo**: nacen verdes y su discriminación la prueba la mutación M4. pg-mem no revierte, por eso la atomicidad se observa con un pool falso que anota `pool:` o `tx:` por sentencia (molde de `apps/desk/server/prioridadTop5.test.ts:333`).
- Falla el `INSERT` de la traza: `tx:BEGIN, tx:INSERT, tx:SELECT, tx:SELECT, tx:SELECT, tx:UPDATE, tx:INSERT, tx:ROLLBACK`.
- Tras el fallo ninguna sentencia va por el pool, no hay `COMMIT` y la última es `ROLLBACK`: ni la fila del cliente ni ningún ticket ni ninguna traza llegan a quedar. **Límite honesto:** con un pool falso se prueba que las escrituras están dentro de la transacción y que ésta se revierte, no el efecto sobre filas reales (pg-mem no revierte).
- Sin fallo cierra en `COMMIT`.
- Recuento de lecturas: con 1 y con 5 tickets las lecturas son 3 y 3; las escrituras crecen (5 `UPDATE`, 6 `INSERT`).

### Mutación M4 (copia de seguridad en el directorio temporal; restaurada con `cp` y `cmp`)

| # | Cambio exacto | Qué cae (literal) |
|---|---|---|
| M4 (regla 1) | `apps/desk/server/db/prioridadCliente.ts`, dentro de `fijarYPropagarPrioridadCliente`: `const fila = await fijarPrioridadCliente(q, a)` → `const fila = await fijarPrioridadCliente(db, a)` | Las 3 pruebas de fondo: `expected [ 'tx:BEGIN', 'pool:INSERT', …(6) ] to deeply equal [ 'tx:BEGIN', 'tx:INSERT', …(6) ]`; `expected [ 'pool:INSERT' ] to deeply equal []`; y, en el recuento, `expected [ 'tx:INSERT', 'tx:INSERT', …(3) ] to have a length of 6 but got 5` |

Prueba para reproducirla: `npx vitest run apps/desk/server/propagarTop5Atomica.test.ts`.

### Regla 13 (L2a-bis)

Nada nuevo: sólo pruebas. La atomicidad y el recuento de lecturas son del servidor y no tienen espejo en el cliente.

## Lote L2b — traza al nacer bajo Top 5 y lo que se enseña — COMPLETO (pendiente de commit, settle y fusión del orquestador)

### Resoluciones aplicadas

- **D-1 (manda el diseño), delta alineado.** `specs/tickets-core/spec.md`, RQ-TC-38: la fila `top5_al_nacer` existe cuando el cliente es Top 5 y la prioridad con la que nace difiere de la PEDIDA; `de` = `prioridadAlNacer(pedida, false, null)` (sin contrato). El requisito lleva escrito, en el propio texto, que es un **supuesto del orquestador del 2026-10-04, no letra de Gerencia**. El escenario «si el Top 5 no cambia el resultado, no hay fila» pasa a «si nace con la prioridad pedida, no hay fila» (mismo caso) y se añade el escenario «la base es la pedida aunque el salto lo cause el contrato» (contrato vigente, Top 5 `Low`, cuerpo `Low`: nace `High`, fila con `de` `Low`). No se tocó ninguna otra línea del delta.
- **D-2 (manda la spec).** El `INSERT` de la traza está en `crearTicketConEquipo`, sobre el `q` de la MISMA transacción del ticket, justo después de `createTicket` y ANTES de `asociarOV` (`apps/desk/server/services/equipoNuevo.ts:90`). El único paso posterior dentro de esa transacción es la asociación de la orden de venta; tras ella `createManagedTicket` ya no tiene más guardas (sólo lee el ticket creado), así que **no hizo falta cambiar ni una línea de `ticketService.ts` ni reordenar guardas**. Prueba: pool falso con la asociación de la OV caída: `tx:BEGIN, tx:SELECT, tx:INSERT tickets, tx:INSERT ticket_transitions, tx:INSERT public.prioridad_ajustes, tx:SELECT, tx:INSERT ov_asociaciones, tx:ROLLBACK`, sin `COMMIT` ni nada por el pool. **Límite:** pg-mem no revierte, así que el «no queda ni ticket ni traza» se demuestra por la secuencia, como en L2a-bis.

### Líneas antes y después

| Fichero | Antes | Después | Netas |
|---|---|---|---|
| `apps/desk/server/services/ticketService.ts` | 277 | 277 | **0** (`git diff --numstat`: 2 ins / 2 borr: el import de `:5` y el argumento de `:108`). `:106` **byte a byte** (`cmp` contra la línea guardada antes de empezar) |
| `apps/desk/server/services/equipoNuevo.ts` | 99 | 99 | **0** (3 ins / 3 borr: import de `:3`, firma de `:84`, `:90`) |
| `apps/desk/server/db/prioridadCliente.ts` | 124 | 132 | +8 al final (`baseSiNaceBajoTop5`) y 4 modificadas en sitio (import, tipo, `SELECT` y mapeo de `ajustesDelTicket`) |
| `packages/shared/src/prioridadPropagada.ts` | 45 | 50 | +5 (`baseAlNacer`) |
| `packages/shared/src/prioridadPropagada.test.ts` | 79 | 88 | +9 |
| `apps/desk/src/api/client.ts` | 803 | 803 | 0 (2 ins / 2 borr) |
| `apps/desk/src/components/Top5Panel.tsx` | 130 | 133 | +3 |
| `apps/desk/src/components/PanelPrioridad.tsx` | 82 | 82 | 0 |
| `apps/desk/server/propagarTop5.test.ts` | — | — | 0 (sólo el título de la prueba «sin traza», que ya no dice «L2b lo invierte») |
| `apps/desk/server/trazaTop5AlNacer.test.ts` | — | 143 | nuevo |

CRLF conservado en todo (`file`). Un `sed -i` mío convirtió `prioridadPropagada.test.ts` a LF; lo reconvertí y `file` lo confirma. En `client.ts` los tipos son los de `:713` (`PrioridadDelCliente`, gana `ticketsCambiados?`) y `:715` (`AjusteDePrioridad`, gana `a: string | null` y `origen?`).

### Rojos observados (antes de tocar el código)

`npx vitest run apps/desk/server/trazaTop5AlNacer.test.ts packages/shared/src/prioridadPropagada.test.ts`:

- `baseAlNacer` (8 pruebas, nuevas): `(0 , baseAlNacer) is not a function`.
- Servidor (`6 failed | 6 passed`):
  - «nace bajo Top 5 con prioridad distinta de la pedida…» → `expected [] to match object [ { …(5) } ]`.
  - «criterio 8 · desmarcar al cliente devuelve el ticket nacido bajo Top 5 a su calculada…» → `expected +0 to be 1 // Object.is equality` (`ticketsCambiados` 0: sin traza no hay base).
  - «sin pedida: de es NULL…» → `expected [] to match object [ { de: null, a: 'Medium', …(1) } ]`.
  - «con contrato vigente y Top 5 Low, cuerpo Low…» → `expected [] to match object [ { de: 'Low', a: 'High', …(1) } ]`.
  - `GET` del ticket → `expected [ [ 'Low', undefined ], …(1) ] to deeply equal [ [ 'Medium', 'top5_al_nacer' ], …(2) ]`.
  - atomicidad del alta → `expected [ 'tx:BEGIN', 'tx:SELECT', …(5) ] to deeply equal [ 'tx:BEGIN', 'tx:SELECT', …(6) ]` (falta la traza).
- **Nacen verdes (caracterización), declarado:** nace sin Top 5; nace con Top 5 igual a la pedida; contrato vigente, Top 5 `Low` y cuerpo `High`; el ticket previo al despliegue sin traza no se toca (S-10); y las dos pruebas del pool falso que dicen que, sin base o con la misma prioridad, no se escribe traza.
- **Error mío al redactar, corregido tras el primer verde:** esperaba `baseAlNacer('Alta')` igual a `null`; `prioridadAlNacer` deja pasar el valor del cuerpo cuando no aplica contrato ni Top 5 (`'Alta'`). La prueba dice ahora `'Alta'`.
- **La prueba que L2a dejó verde por construcción y «se invierte»:** la de `propagarTop5.test.ts` («un ticket sin traza…») se conserva, con título nuevo, para los tickets previos al despliegue (`tasks.md` L2b.7); su inversión es «criterio 8» de `trazaTop5AlNacer.test.ts`: con la traza al nacer, el ticket SÍ vuelve a `Low`.

### Verde

- `baseAlNacer(pedida)` en `packages/shared/src/prioridadPropagada.ts` (misma fórmula del alta: `prioridadAlNacer(pedida, false, null)`).
- `baseSiNaceBajoTop5(db, clientId, pedida)` al final de `apps/desk/server/db/prioridadCliente.ts:130`: `{ de }` si el cliente es Top 5 (`prioridadTop5` falla cerrado ante un dato sucio), `null` si no. En sitio: `AjustePrioridad.a: string | null`, `origen`, el `SELECT` y el mapeo (`apps/desk/server/db/prioridadCliente.ts:81`): `a` NULL sale `null`, no la cadena `"null"`.
- `crearTicketConEquipo` gana el sexto argumento `alNacer?` y, tras `createTicket`, inserta la fila si `alNacer && alNacer.de !== input.priority`, con autor `input.actor`.
- `ticketService.ts` importa `baseSiNaceBajoTop5` y lo pasa en `:108`; `:106` intacta.
- Cliente: `ticketsCambiados?` y `origen?` en los tipos; `Top5Panel.tsx` enseña «N tickets abiertos actualizados» tras guardar; `PanelPrioridad.tsx` enseña «sin prioridad» cuando `a` es nulo. **Sin prueba por decisión de Gerencia** (`.tsx` fuera de la red).
- `ticketService.test.ts` (con `:1154` y `:1160` intactas), `propagarTop5.test.ts`, `prioridadTop5.test.ts` y los ficheros de L2b y L2a-bis: verdes.

### Mutaciones de L2b (copias en el directorio temporal; restauradas con `cp` y comprobadas con `cmp`)

Prueba para reproducirlas: `npx vitest run apps/desk/server/trazaTop5AlNacer.test.ts packages/shared/src/prioridadPropagada.test.ts`.

| # | Cambio exacto (fichero: original → mutado) | Qué cae (literal) |
|---|---|---|
| ML1 (regla 1, posición) | `services/equipoNuevo.ts`: la sentencia `; if (alNacer && alNacer.de !== input.priority) await q.query(…)` se quita de `:90` y se pega justo antes de `return id`, DESPUÉS de `asociarOV` | atomicidad del alta → `expected [ 'tx:BEGIN', 'tx:SELECT', …(5) ] to deeply equal [ 'tx:BEGIN', 'tx:SELECT', …(6) ]` (la asociación falla antes de llegar a la traza). **La mutación que nombraba `tasks.md` —mover el `INSERT` ANTES del `createTicket`— no se puede escribir tal cual: la traza necesita el `id` que devuelve `createTicket`; se probó la posición contraria.** No hay clave foránea entre `prioridad_ajustes.ticket_id` y `tickets`, así que la «prueba de FK» no existe; la secuencia es el único detector, y cae |
| ML2 (D-2) | `equipoNuevo.ts:90`: `await q.query('INSERT INTO public.prioridad_ajustes` → `await db.query('INSERT INTO public.prioridad_ajustes` (fuera de la transacción) | atomicidad del alta → `expected [ 'tx:BEGIN', 'tx:SELECT', …(6) ] to deeply equal [ 'tx:BEGIN', 'tx:SELECT', …(6) ]` (en esa posición aparece `pool:INSERT public.prioridad_ajustes`) |
| ML3 | `equipoNuevo.ts:90`: `alNacer && alNacer.de !== input.priority` → `alNacer` | `nace con Top 5 y la misma prioridad que la pedida: sin traza` y `con contrato vigente, Top 5 Low y cuerpo High…` → `expected [ { …(7) } ] to deeply equal []`; y `con la misma prioridad que la base no se escribe ninguna traza` → `expected [ Array(1) ] to deeply equal []` |
| ML4 (D-1) | `prioridadPropagada.ts`, `baseAlNacer`: `prioridadAlNacer(pedida, false, null)` → `prioridadAlNacer(pedida, true, null)` | seis de las siete de `baseAlNacer`, p. ej. `pedida "Low" → "Low"`: `expected 'High' to be 'Low'`; `pedida undefined → null`: `expected 'High' to be null` |
| ML5 | `prioridadCliente.ts`, `ajustesDelTicket`: `a: f.a == null ? null : String(f.a)` → `a: String(f.a)` | `GET` del ticket → `expected [ [ 'Medium', 'top5_al_nacer' ], …(2) ] to deeply equal [ [ 'Medium', 'top5_al_nacer' ], …(2) ]` (la cadena `"null"` frente a `null`) |
| ML6 | `prioridadCliente.ts`, `ajustesDelTicket`: `origen: f.origen == null ? null : String(f.origen) }))` → `origen: null }))` | `GET` del ticket → `expected [ [ 'Medium', null ], …(2) ] to deeply equal [ [ 'Medium', 'top5_al_nacer' ], …(2) ]` |
| ML7 | `prioridadCliente.ts`, `baseSiNaceBajoTop5`: `return (await prioridadTop5DelCliente(db, clientId)) ? { de: baseAlNacer(pedida) } : null` → `return { de: baseAlNacer(pedida) }` | **sobrevivió la primera vez** (47 de 47): ninguna prueba tenía un cliente sin Top 5 cuya prioridad final difiriera de la pedida. Se añadió «con contrato vigente y SIN Top 5, cuerpo Low: nace High por el contrato y NO hay traza» y cae: `expected [ { …(7) } ] to deeply equal []` |

Tras la última, `cmp` de `equipoNuevo.ts`, `prioridadPropagada.ts` y `prioridadCliente.ts` contra las copias del verde da idéntico; `git status` sólo muestra el verde.

### Regla 13 (L2b), decisión a decisión

| Decisión | Quién la impone | Línea del servidor |
|---|---|---|
| Que un ticket nacido bajo Top 5 deja traza, y con qué base | Servidor, en la misma transacción del ticket | `apps/desk/server/services/equipoNuevo.ts:90` (la base la calcula `baseSiNaceBajoTop5`, `apps/desk/server/db/prioridadCliente.ts:130`, sobre `baseAlNacer` de `shared`) |
| Que desmarcar lo devuelve a su calculada | Servidor, `shared` consumida | `cambioPorTop5` (L2a); probado por «criterio 8» |
| Qué origen lleva cada fila de la lectura | Servidor | `ajustesDelTicket` (`apps/desk/server/db/prioridadCliente.ts:81`) |

Comodidad del cliente: **sólo enseña** el recuento de tickets cambiados (`Top5Panel.tsx`) y «sin prioridad» para un `a` nulo (`PanelPrioridad.tsx`). Ninguna de las dos decide ni bloquea nada.

### Cierre de los dos lotes (códigos de salida literales)

```
test exit=0
typecheck exit=0
lint exit=0
Test Files  193 passed | 1 skipped (194)
Tests  3036 passed | 2 skipped (3038)
✖ 165 problems (0 errors, 165 warnings)
```

Antes: 3.011 y 2 omitidas en 191 + 1. Ahora +25 pruebas (4 de L2a-bis, 13 de `trazaTop5AlNacer.test.ts`, 8 de `baseAlNacer`) y +2 ficheros.

### Medida del intento (L2a-bis y L2b, partida `98e97f6`)

- `git diff --shortstat --no-renames 98e97f6`: 10 files changed, 54 insertions(+), 22 deletions(-) → **76**.
- Sin trackear: `propagarTop5Atomica.test.ts` 69 + `trazaTop5AlNacer.test.ts` 143 = **212**.
- Código y pruebas: **288**. Con esta parte de `apply-progress.md` (~75) y las casillas de `tasks.md` (~25): ~390 (techo 800, válvula 720). En el punto de decisión tras L2a-bis la suma proyectada era ~360.
- Binarios: ninguno.

## Lote L3 — lista de «Remisión creada» y cierre documental — COMPLETO (pendiente de commit, settle y fusión del orquestador)

Commit de partida del intento: `74aadd5`. Independiente de L1 y L2.

### Líneas antes y después

| Fichero | Antes | Después | Netas |
|---|---|---|---|
| `apps/desk/src/lib/boardView.ts` | 59 | 59 | **0** (`git diff --numstat`: 2 ins / 2 borr: la fila de `FUNCTIONAL_VIEWS` y el `case` de `todos`) |
| `apps/desk/src/App.tsx` | 183 | 183 | **0** (2 / 2: el import de `:16` y la rama de `:69`) |
| `apps/desk/src/components/Sidebar.tsx` | 151 | 151 | **0** (1 / 1: la etiqueta de `:10`) |
| `apps/desk/server/routes/prioridad.ts` | 87 | 96 | +9 al final (la ruta); el import de `:9` en sitio, en la misma línea. Nada por encima se mueve |
| `apps/desk/src/api/client.ts` | 803 | 808 | +5 al final (`fetchRemisionCreada`); `:713` y `:715` siguen donde estaban |
| `packages/shared/src/index.ts` | 32 | 33 | +1 al final |
| `apps/desk/src/lib/boardView.test.ts` | 145 | 174 | +29 al final y el import de `:3` en sitio |
| `packages/shared/src/listaPorEntrada.ts` | — | 16 | nuevo |
| `packages/shared/src/listaPorEntrada.test.ts` | — | 36 | nuevo |
| `apps/desk/server/db/listaRemisionCreada.ts` | — | 17 | nuevo |
| `apps/desk/server/listaRemisionCreada.test.ts` | — | 148 | nuevo |

CRLF conservado en todo (`file`). Las ediciones en sitio se hicieron con un guion de Node que sustituye cadenas únicas, no con `sed -i`; un `sed -i` mío sobre `boardView.test.ts` lo dejó en LF y lo reconvertí a CRLF. Literales de L3 tal como fija el diseño: clave `remision_creada`, ruta `/api/remision-creada`, campo `enEstadoDesde`, etiqueta «Equipos en Remisión creada».

### Rojos observados (antes de escribir el código)

`npx vitest run` de los tres ficheros de prueba de L3: `14 failed | 28 passed`, tres ficheros rojos.

- `listaPorEntrada.test.ts` → `Error: Cannot find module './listaPorEntrada' imported from …/listaPorEntrada.test.ts` (la función no existe).
- Servidor (RC-1 a RC-11): `AssertionError: expected 404 to be 200` (RC-10: `expected 404 to be 401`; la ruta no existe y cae en el comodín de `/api`), `TypeError: res.body.map is not a function` (x7) y `TypeError: Cannot read properties of undefined (reading 'enEstadoDesde')` (RC-9).
- Cliente: «no filtra ni reordena…» → `AssertionError: expected [] to deeply equal [ 'z', 'c', 'a', 'm' ]` (la clave nueva cae en el `default` de `boardView.ts:54`); «la etiqueta es…» → `expected 'Vista no reconocida' to be 'Equipos en Remisión creada'`; «son siete» → `expected [ 'todos', 'abiertos', …(4) ] to deeply equal [ 'todos', 'abiertos', …(5) ]`.
- **Nacen verdes (caracterización), declarado:** RC-12, «Habilitar Servicio» desde un ticket en «Remisión creada» con un usuario de Servicio Técnico → `403` y el ticket no se mueve (la guarda de `apps/desk/server/services/ticketService.ts:129-131` ya existía); y las pruebas por clave de RQ-VT-03 de las seis claves que ya tenían `case`.

### Verde

- `packages/shared/src/listaPorEntrada.ts:10-16`: `ordenarPorEntrada` — instante ascendente, sin entrada o ilegible al final, empate y tramo sin entrada por el número (acepta `#123`). Exportada al final de `index.ts`.
- `apps/desk/server/db/listaRemisionCreada.ts:13-16`: `getActiveTickets` filtrado por `STATUS_REMISION_CREADA` más `entradasActuales` (`apps/desk/server/db/sla.ts:78-102`): dos lecturas fijas sea cual sea N; `enEstadoDesde` es el ISO de la última entrada o `null`.
- `apps/desk/server/routes/prioridad.ts:92-94`: `GET /api/remision-creada` con `requireAuth`; cualquier área la lee.
- Cliente: la clave en `apps/desk/src/lib/boardView.ts:15` y su `case` en `:53` (junto a `todos`, devuelve lo recibido); `App.tsx` la pide con `fetchRemisionCreada` y el Sidebar ofrece la etiqueta. **Sin tarjeta nueva ni tiempo pintado (D13).** `.tsx` sin prueba por decisión de Gerencia.
- Los ficheros de L3 más `misTickets.test.ts`: `62 passed (62)`.

### Mutaciones de L3 (copias en el directorio temporal; restauradas con `cp` y comprobadas con `cmp`, no con `git checkout`)

Pruebas para reproducirlas: `npx vitest run packages/shared/src/listaPorEntrada.test.ts apps/desk/server/listaRemisionCreada.test.ts apps/desk/src/lib/boardView.test.ts`.

| # | Cambio exacto (fichero: original → mutado) | Qué cae (literal) |
|---|---|---|
| M11 | `packages/shared/src/listaPorEntrada.ts`: `ia === null ? 1 : ib === null ? -1 : ia - ib` → `… : ib - ia` | 8 caídas: `expected [ 'c', 'b', 'a' ] to deeply equal [ 'a', 'b', 'c' ]`; `expected [ 'b', 'a' ] to deeply equal [ 'a', 'b' ]`; `expected [ 'a', 'b', 'sin' ] to deeply equal [ 'b', 'a', 'sin' ]`; y RC-1 (`expected [ 'd2', 'd5', 'd9' ] to deeply equal [ 'd9', 'd5', 'd2' ]`), RC-2, RC-3, RC-4, RC-6 |
| M12 | `apps/desk/src/lib/boardView.ts`: `case 'todos': case 'remision_creada': return tickets` → `case 'todos': return tickets` | `tsc -b` → `apps/desk/src/lib/boardView.ts(54,39): error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'`; en pruebas: «no filtra ni reordena…» → `expected [] to deeply equal [ 'z', 'c', 'a', 'm' ]` y «RQ-VT-03 … remision_creada» → `expected [] to deeply equal [ 'k' ]` |
| P1 (posición, estado erróneo) | `apps/desk/server/db/listaRemisionCreada.ts`: en la llamada a `entradasActuales`, `status: String(row.status)` → `status: 'Notificado'` | 7 caídas: RC-1 (`expected [ 'd5', 'd2', 'd9' ] to deeply equal [ 'd9', 'd5', 'd2' ]`), RC-2, RC-3, RC-4, RC-5 (`expected [ 's5', 'v10', 'v20', 's30' ] to deeply equal [ 'v10', 'v20', 's5', 's30' ]`), RC-6 y RC-9 (H5) |
| P2 (posición, ordenar antes de filtrar) | mismo fichero: quitar el `.filter` por estado de la primera línea del cuerpo y aplicarlo tras `ordenarPorEntrada` | **SOBREVIVE (49 de 49), y es un equivalente, no un hueco de prueba**: filtrar y ordenar conmutan. Se anota para que nadie lo busque como defecto |

Tras la última, `cmp` de `listaPorEntrada.ts`, `boardView.ts` y `listaRemisionCreada.ts` contra las copias del verde da idéntico; `git status` sólo muestra el verde.

### Regla 13 (L3), decisión a decisión

| Decisión | Quién la impone | Línea |
|---|---|---|
| Qué tickets entran | Servidor | `apps/desk/server/db/listaRemisionCreada.ts:14` (estado actual igual a Remisión creada, abiertos; sin filtro de flujo ni de orden de venta, S-7) |
| Desde cuándo está en el estado | Servidor, el MISMO reloj que la alarma | `entradasActuales` (`apps/desk/server/db/sla.ts:78-102`), enfrentado a `ticketsConSlaVencido` por RC-9 (H5) |
| En qué orden se enseñan | Servidor, `shared` | `ordenarPorEntrada` (`packages/shared/src/listaPorEntrada.ts:10-16`) |
| Quién la lee | Servidor | `apps/desk/server/routes/prioridad.ts:92-94` (`requireAuth`; cualquier área, `401` sin sesión) |
| «Habilitar Servicio» desde la lista | Servidor, probado | `apps/desk/server/services/ticketService.ts:129-131` (área); RC-12 |

**La lista es una VISTA, no una guarda:** no concede ni quita permiso. El cliente sólo enseña: `applyBoardView` devuelve lo recibido sin reordenar ni filtrar (precedente de `mios` en `apps/desk/src/lib/boardView.test.ts:138-145`, y las pruebas nuevas para esta vista). El tiempo transcurrido no se calcula ni se pinta en el cliente (D13, E-nueva-5).

### Barrido de citas (regla de mutación 4), sobre todo el cambio (L1 a L3)

Grep SIN excluir `openspec/changes/archive/`. **Los ficheros muy citados no cambiaron de tamaño** (`repo.ts` 452, `boardView.ts` 59, `ticketService.ts` 277, `equipoNuevo.ts` 99, `App.tsx` 183, `Sidebar.tsx` 151, `client.ts` 803 antes de L3), así que ninguna cita a ellos se desplaza por inserción; lo que cambia es qué AFIRMAN. Sólo se lista; no se edita nada fuera del cambio. Fichero y línea van en columnas separadas a propósito.

| Fichero que cita | Línea | Qué afirma | Clase |
|---|---|---|---|
| `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/design.md` | 94 | que las líneas 76 a 78 de `repo.ts` filtran la orden de venta | B: cierta entonces; hoy esas tres líneas filtran también `priority` |
| `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/archive-report.md` | 14 | «frontera por columna para las dos columnas de la orden» (líneas 76 a 78 de `repo.ts`) | B |
| `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/proposal.md` | 71 | `ov_elegida_en_app_at` en las líneas 73 a 81 de `repo.ts` «se queda intacta» | A: el rango ahora incluye también la cláusula de prioridad |
| `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/verify-report.md` | 240 | el sincronizador (línea 71 de `repo.ts`) pisa la prioridad: «fuera de alcance declarado» | C: superada por L1 (la marca `prioridad_en_app_at` la protege) |
| `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/exploration.md` | 28 y 34 | «el sync pisa `priority` de tickets no gestionados» | C: superada por L1 |
| `CLAUDE.md` | 348 (fila IV-11) | `repo.ts`, líneas 71 y 73 a 81 | A: habla de la orden de venta y sigue cierta; falta decir que la misma zona protege ya la prioridad (lo anota el orquestador al archivar) |
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 604 y 951 | `repo.ts`, línea 71 (`managed_by_app`) | A: la línea 71 no se movió |
| `openspec/specs/transitions-st/spec.md` y `openspec/config.yaml` | 1641 y 3198 | `repo.ts`, línea 71 | A |
| `apps/desk/server/prioridadTop5.test.ts` | 180 y 187 | TC24-14 y TC24-15 | A: invertidas por L2a; son lo que hoy fijan |
| `apps/desk/server/services/ticketService.test.ts` | 1154 y 1160 | otras dos pruebas con el mismo nombre (prioridad al nacer) | A: intactas |
| `docs/sdd/ENTRADA.md` | 1426 | «ninguna consulta toca `tickets.priority`; lo fijan TC24-14 y TC24-15» | C: superada por este cambio (hoy sí la toca, con traza) |
| `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/` (`apply-progress.md` 4 menciones, `tasks.md` 3, `verify-report.md` 2) | varias | TC24-14 y TC24-15 en su forma de entonces | B: fechadas |
| `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md` | 174 | F1B-07 ampliación: describe (3) como trabajo por hacer | B (documento fechado); lo cierra la reconciliación |
| `openspec/specs/tickets-core/spec.md` | 870 | «este requisito aplica sólo al nacer: no reevalúa tickets existentes» | C: superada por RQ-TC-36 a RQ-TC-38 del delta (lo reescribe el archivo) |
| `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/specs/tickets-core/spec.md` y `2026-09-29-registro-contrato/specs/tickets-core/spec.md` | 120 y 233 | el mismo «sólo al nacer» | B: fechadas |
| `openspec/changes/archive/2026-09-10-vista-todos-y-estados-en-espera/specs/vistas-tablero/spec.md` | 90 y 97 | `FUNCTIONAL_VIEWS` «con sus seis claves» | B: cierta entonces; hoy son siete. El vivo de `vistas-tablero` lo corrige el archivo con el delta de RQ-VT-03 |
| `openspec/changes/archive/2026-09-10-vista-todos-y-estados-en-espera/` (`design.md` 183, `tasks.md` 203) | 183 y 203 | «las seis vistas» | B |

**`Top5Panel.tsx` (+3 líneas netas declaradas en L2b):** los cambios en sitio son las líneas 21, 26 y 28 y la única inserción cae en la línea 52. Las citas a líneas anteriores no se mueven; las posteriores se desplazan en +1.

| Fichero que cita | Línea | Cita a Top5Panel | Veredicto |
|---|---|---|---|
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 744 y 773 | línea 20 | A, por debajo de la inserción |
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 1489 | línea 46 | A, por debajo de la inserción |
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 1490 | líneas 60 a 68 (`tbody` y `lista.map`) | B: histórica; hoy el bloque está en 61 a 69 |
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 774 | línea 86 (prioridades ofrecidas) | B: hoy es la 87 |
| `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` | 1450 | línea 112 (buscador por nombre o NIT) | B: hoy es la 113 |
| `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/verify-report.md` | 185 | línea 20 | A |

Resumen: tabla principal **A 6, B 7, C 4**; `Top5Panel.tsx` **A 3, B 3** (6 filas, 7 citas). Las B de `Top5Panel.tsx` viven en un paquete fechado contra `ae5aaf4`: no hay que renumerarlas a ciegas.

### Texto de la corrección del maestro (`toca_maestro: si`, M1.9.1) — sin número, lo numera y pega el orquestador

**Dónde:** `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1973`, párrafo «Prioridad.» de M1.9.1.

**Texto actual:** «Prioridad. [DECIDIDO 21/09/2026 y 23/09/2026 — R08.4] La prioridad se fija en el cliente, no en cada ticket: se fija una vez y todos sus tickets la heredan. Al nacer un ticket manda la más alta entre la del contrato y la del Top 5; sin ninguna de las dos, se aplica la regla general.»

**Texto propuesto:** «Prioridad. [DECIDIDO 21/09/2026, 23/09/2026 y 01/10/2026] La prioridad se fija en el cliente, no en cada ticket: se fija una vez y todos sus tickets la heredan. Al nacer un ticket manda la más alta entre la del contrato y la del Top 5; sin ninguna de las dos, se aplica la regla general. Al marcar un cliente como Top 5, o al cambiar su prioridad, sus tickets abiertos toman la nueva prioridad y cada cambio deja su traza; al desmarcarlo, vuelven a la prioridad calculada. Los tickets con un ajuste manual con motivo conservan el suyo en todo caso, y el sincronizador con Zoho no sobrescribe la prioridad que la aplicación ha fijado. La lista de equipos en «Remisión creada» para Comercial se ordena por el tiempo transcurrido desde que el ticket entró en ese estado, el más antiguo primero, que es el mismo reloj de la alarma de 3 días hábiles; los tickets sin entrada registrada van al final.»

### Preguntas para la bandeja (a numerar por el orquestador; NO se escribe en `docs/sdd/ENTRADA.md` ni en `openspec/config.yaml`)

| # | Qué se pregunta | Dueño | Qué desbloquea | Destino |
|---|---|---|---|---|
| E-nueva-1 (a numerar) | Sobre la prioridad propagada a un ticket venido de Zoho, ¿manda la aplicación (S-1)? Y tras desmarcar, ¿sigue mandando la aplicación o vuelve a mandar Zoho (S-2)? | Gerencia | Si no, la marca por fila `prioridad_en_app_at` se retira o se vacía al revertir | Punto abierto con dueño; supuesto aplicado: manda la aplicación y la marca se conserva |
| E-nueva-2 (a numerar) | Una prioridad cambiada por el Director Comercial en una transición, sin motivo escrito, ¿cuenta como «ajuste manual con motivo» (S-4)? | Gerencia | Si cuenta, la transición pasa a eximir al ticket; hoy no exime | Punto abierto con dueño |
| E-nueva-3 (a numerar) | Si el Top 5 es más bajo que la prioridad que el ticket ya tenía, ¿el ticket baja (S-5)? | Gerencia | Si el Top 5 sólo sube o también baja; hoy baja, a la letra de la decisión | Punto abierto con dueño |
| E-nueva-4 (a numerar) | ¿La lista trae todos los equipos en «Remisión creada» o sólo los que no tienen orden de venta, como la alarma (S-7)? | Gerencia | El contenido de la lista; hoy trae todos | Punto abierto con dueño |
| E-nueva-5 (a numerar) | ¿La lista debe enseñar el tiempo transcurrido en cada tarjeta (D13)? | Gerencia | Tocar `TicketCard.tsx` (citado y `.tsx` sin red de pruebas) y calcularlo en el servidor con el calendario de cierres; hoy no se pinta | Punto abierto con dueño |
| E-nueva-6 (a numerar) | Una prioridad escrita por una transición entre marcar y desmarcar se pierde al revertir, que vuelve a la base (S-4, D5). ¿Es lo querido? | Gerencia | Si la reversión debe respetar lo escrito por transiciones | Punto abierto con dueño |
| D-1 (a numerar) | Qué base se guarda al nacer bajo Top 5, y si la fila debe existir cuando el salto lo causa sólo el contrato. Aplicado: la base es la prioridad PEDIDA (sin contrato) y hay fila si la final difiere de ella; la spec original guardaba el resultado sin Top 5, contrato incluido | Gerencia | Si se prefiere la letra original, cambia `baseAlNacer` y un escenario de RQ-TC-38 | Punto abierto con dueño; supuesto reversible del orquestador del 2026-10-04 |

(La resolución D-2, que la fila de alta no queda si el alta falla después, sigue la spec y no cambia nada; no necesita pregunta. Su verificación, por secuencia de transacción, está en el lote L2b.)

### Cobertura de F1B-07 (línea única para el `archive-report.md`)

Este cambio (`cierra: no`) cubre del contenido ampliado de F1B-07 los puntos (3) y (4) de `decision/cola-del-taller-los-tres-cabos` —propagar el Top 5 a los tickets abiertos con traza y revertirlo al desmarcar, sin tocar los ajustes manuales, y la lista de «Remisión creada» ordenada por la entrada al estado— y deja fuera la pregunta 3.b de `docs/sdd/Preguntas_Gerencia_2026-09-29.md` (calificación del cliente sin contrato ni Top 5 y quién ajusta a mano fuera de los Top 5), que es lo que mantiene la fila abierta.

### Lo que este cambio añade al paquete de despliegue

- **Esquema** (lo aplica la migración al arrancar; sin relleno ni escritura sobre datos de producción): `packages/zoho-sync/src/db/schema.sql:710` (`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;`), `:713` (`ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;`) y `:714` (`ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;`). L3 no añade ninguna.
- **Variables de entorno: ninguna nueva.** El diff contra `2a74fdc` sobre `apps` y `packages` no añade ninguna línea con `process.env` (grep vacío).
- **Condición (dato, no tarea):** los Top 5 marcados antes del despliegue no se propagan solos; se propaga al volver a guardarlos.
- **Comprobaciones de persona en la aplicación** (dueño Comercial; fuera del recuento, archivar no las da por hechas): (1) marcar un cliente Top 5 y ver sus tickets abiertos con la prioridad nueva y su traza; (2) desmarcarlo y ver los tickets volver; (3) un ticket con ajuste manual no cambió; (4) tras una pasada del sincronizador (3 minutos), un ticket venido de Zoho conserva la prioridad propagada; (5) abrir la vista «Equipos en Remisión creada» y ver el más antiguo arriba; (6) un ticket creado para un cliente Top 5 vuelve a su prioridad al desmarcarlo; (7) tras propagar, los tickets del cliente NO aparecen como no leídos.

### Cierre de L3 (códigos de salida literales)

```
test exit=0
typecheck exit=0
lint exit=0
Test Files  195 passed | 1 skipped (196)
Tests  3064 passed | 2 skipped (3066)
✖ 165 problems (0 errors, 165 warnings)
```

Antes: 3.036 y 2 omitidas en 193 + 1. Ahora +28 pruebas y +2 ficheros. Sin `as any` en las pruebas nuevas.

### Cero netas acumuladas (L1 a L3)

`repo.ts`, `boardView.ts`, `ticketService.ts`, `equipoNuevo.ts`, `App.tsx` y `Sidebar.tsx`: inserciones iguales a borrados (tabla de cada lote y numstat de L3 arriba).

### Medida del intento (L3, partida `74aadd5`)

- `git diff --shortstat --no-renames 74aadd5`: 7 files changed, 51 insertions(+), 7 deletions(-) → **58** (antes de esta sección y de las casillas).
- Sin trackear: `listaPorEntrada.ts` 16 + `listaPorEntrada.test.ts` 36 + `listaRemisionCreada.ts` 17 + `listaRemisionCreada.test.ts` 148 = **217**.
- Código y pruebas: **275**. Con esta sección de `apply-progress.md` y las casillas: ~400 (techo 800, válvula 720).
- Binarios: ninguno.
