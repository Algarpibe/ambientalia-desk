# Diseño · cerrar-hallazgos-revision-f1b-01

| Dato | Valor |
|---|---|
| Base | `main` en `56ff441` |
| Entradas | `exploration.md` · `proposal.md` · lectura directa del código citado |
| Modo | `strict_tdd` · `artifact_store: hybrid` · `delivery_strategy: ask-on-risk` |
| Alcance | P1–P5 de la propuesta, ninguna pieza más |

---

## 0 · Enmienda a la propuesta, declarada por delante

La propuesta §2 (P1) delimitó que la guarda **SHALL** evaluarse sobre el `clientId` del **cuerpo**
(`ticketService.ts:27`) y no sobre el ya completado por la OV (`:39`). **Este diseño cierra esa
decisión de borde al revés**, por instrucción de Gerencia y con el razonamiento del §1. Se deja
escrito porque una propuesta y su diseño diciendo cosas opuestas sin decirlo es exactamente el modo
de fallo que `CLAUDE.md` describe para sus propios registros.

Consecuencia declarada: el caso equipo↔OV, que la propuesta §3 dejaba fuera de alcance, **queda
parcialmente dentro** — no como comparación equipo↔OV explícita, sino porque el valor de la OV pasa a
estar sujeto a la misma invariante. El desvío del §3 (contraste `clientId` del cuerpo ↔ `ov.clientId`)
sigue anotado y sin cerrar.

---

## 1 · P1 · La guarda equipo↔cliente. La decisión y su porqué

### La decisión

Entre el bloque de la OV (`ticketService.ts:33-42`) y el bloque de obligatorios (`:50-58`), sobre el
valor **resuelto** de `clientId`:

| # | Condición | Efecto |
|---|---|---|
| (i) | `clientId` resuelto es nulo **y** `equipo.clientId` existe | `clientId = equipo.clientId` |
| (ii) | los dos existen **y** difieren | **422**, con el nombre del cliente del equipo en el mensaje |
| (iii) | `equipo.clientId` es NULL | no se toca nada — **INNEGOCIABLE** |

**Ubicación exacta: después del 409 de `:45-49` y antes de `:50`.** Dos razones, y la primera es
dura: la rama (i) tiene que correr **antes de `:54`** (`if (!clientId) missing.push('cliente')`), o un
cuerpo sin `clientId` cuyo equipo sí lo trae seguiría muriendo como «falta el cliente». La segunda es
de precedencia: meterla antes del 409 alteraría el tramo 409/422 que `ticketService.test.ts:295-306`
declara y que `:313-318` deja explícitamente **sin decidir** (`tickets-core` §4.1 con
`transitions-st` §3.8). Esta tanda no abre ese punto.

### 1.1 · Por qué contra el valor resuelto y no sólo contra el cuerpo

La invariante no es sobre de qué campo vino el dato: es sobre **lo que queda escrito en la fila**
(`:67`, `clientId: clientId!`). Guardar sólo el cuerpo dejaría la puerta de la OV abierta — `:39`
(`clientId = clientId ?? ov.clientId ?? null`) seguiría metiendo en el `INSERT` un cliente que nadie
contrastó con el equipo.

Y este repositorio ya tiene ese patrón registrado con nombre propio: el desvío de `CLAUDE.md` sobre
`apps/desk/server/routes/remision.ts:218-226` — «una OV, un ticket» tiene **tres** puertas y sólo
**dos** la comprueban. Cerrar un hueco de la regla invariable 13 abriendo, en la misma tanda, la
segunda mitad del mismo modo de fallo sería repetir el error con otro nombre.

Efecto declarado, que es lo que la propuesta quería proteger y sigue protegido: cuando el cuerpo no
manda `clientId`, **el equipo manda sobre la OV**. Es literalmente lo que dice M1.1
(`R08.1.md:1048`): el serial «pasa a ser la llave de entrada de todo el registro».

### 1.2 · El coste, sin maquillar

Una OV cuyo `client_id` difiera del `client_id` del equipo pasará a dar **422** donde hoy crea el
ticket en silencio. Eso puede bloquear trabajo legítimo. Dos precisiones de método:

- **Verificado**: `R08.1.md:2071-2079` lista tres variantes reales y habituales de la relación
  OV↔ticket y concluye que «ninguna de las tres encaja en un modelo de "una OV, un ticket"» (`:2079`,
  punto abierto nº 52).
- **Hipótesis**: que esas variantes impliquen **clientes distintos** entre OV y equipo. El maestro no
  lo dice; habla de cardinalidad, no de titularidad. Atribuirle esa afirmación sería una cita de
  segunda mano.

El mecanismo concreto de falso positivo que **sí** se puede nombrar sin hipótesis es otro:
`books.contacts` arrastra filas duplicadas y de procedencia desconocida —`searchClients` filtra por
`contact_type` y `getClient` **no** (`packages/zoho-sync/src/books/repo.ts:111-116`)—. Si la misma
empresa real existe como dos filas, el equipo apunta a una y la OV a la otra: mismo cliente, dos ids,
**422 injusto**.

**Señal a vigilar.** La guarda emite `logger.warn` con `equipoId`, `equipo.clientId` y el `clientId`
resuelto **antes** de lanzar el 422. Es la única forma de contar los rechazos sin acceso a la base, y
sin eso el falso positivo es invisible hasta que alguien se queja.

**Salida si ocurre.** Las ramas (i) y (ii) se escriben como **dos bloques independientes**, no como un
`if/else` entrelazado. La marcha atrás es **quitar la rama (ii)** —el 422— y conservar (i), que no
bloquea a nadie y es la mitad que M1.1 exige. No hace falta `git revert` de la pieza entera, y ninguna
fila escrita mientras estuvo activa necesita reparación.

### 1.3 · Por qué 422 y no imposición silenciosa

La propia función ya eligió ese patrón para el otro choque de datos: `:45-49` responde **409
explícito** cuando la OV ya está en uso, en vez de reasignarla en silencio. Imponer el cliente del
equipo (opción (b) de la exploración, `exploration.md:59`) tendría el precio que §1.4.3 nombra: un
dato de captura equivocado «no se detecta: se propaga en silencio» (`R08.1.md:504`), y el activo es
**del cliente** (M3, `R08.1.md:1940`).

Qué se pierde con cada una, sin adornos:

| Opción | Lo que cuesta |
|---|---|
| Imponer el del equipo | El usuario cree haber elegido X y el ticket queda a nombre de Y, sin aviso. Un error de datos se convierte en una fila que ya nadie va a revisar |
| **422 (elegida)** | Una creación bloqueada cuando el choque es legítimo (§1.2) y un viaje de ida y vuelta para el usuario |

La asimetría con `:39` es intencionada y conviene decirla: **rellenar un hueco** (cuerpo sin
`clientId`) no es lo mismo que **pisar un valor declarado**. La rama (i) hace lo primero; la (ii)
se niega a hacer lo segundo.

### 1.4 · Por qué el mensaje nombra al cliente del equipo

Se usa `equipo.clienteNombre ?? equipo.clientId` — `getEquipo` ya lo trae en la misma consulta
(`apps/desk/server/db/equipos.ts:76`), así que **no cuesta una consulta extra**, y es el mismo texto
que el navegador ya enseña al elegir el equipo (`CreateTicket.tsx:150`).

No filtra nada nuevo: cualquier sesión autenticada consulta el directorio de clientes sin más filtro
que el texto de búsqueda (`apps/desk/server/routes/directory.ts:15`), y el nombre del cliente del
equipo ya viaja al navegador en la propia ficha del equipo. Frente a un mensaje mudo («el cliente no
corresponde al equipo»), la casa ya tiene precedente escrito: el 409 de remisiones devuelve el id de
la que ya existe porque «sin él, lo único que puede hacer quien lo recibe es volver a intentarlo a
ciegas» (`apps/desk/server/routes/remision.ts:171-172`).

Forma del mensaje, alineada con el estilo de `:47-48`:
`El equipo {serial} es de «{nombre}» y el ticket se está creando para otro cliente. Corrige el cliente o el equipo.`

---

## 2 · Las otras cuatro piezas

### P2 · `GET /api/clients/:id`

Ruta nueva en `apps/desk/server/routes/directory.ts`, calcada de `:62-67`: `requireAuth(db)`,
`getClient(db, String(req.params.id))` (`packages/zoho-sync/src/books/repo.ts:129`), `404 { error:
'No encontrado' }` cuando no hay fila. No hay colisión de rutas con `/api/clients` (`:15`) — no es el
caso de `/api/remisiones/nueva` vs `/:id` (`routes/remision.ts:108`).

Cliente: `apps/desk/src/api/client.ts` gana `getClient(id)` junto a `searchClients` (`:185-187`), y
`CreateTicket.tsx:154-157` sustituye `searchClients(e.clienteNombre ?? '').then(res => res.find(x =>
x.id === e.clientId))` por `getClient(e.clientId)`. Con eso el `LIKE` de `books/repo.ts:117-127`
—que no pliega acentos, puntuación ni formas societarias, al revés que `normalizarNombreCliente`
(`backfillClientId.ts:47-68`)— **deja de participar** en esa rama, y con él el `LIMIT 20` de `:117`
que podía dejar al cliente correcto fuera de página. La rama por nombre de `:167-175` **no se toca**:
es la vía del ~3,4 % con `client_id` NULL.

Autorización: el endpoint no amplía superficie. `searchClients` ya devuelve el mismo `ClientLite` a
cualquier sesión; por id sólo se resuelve más barato y sin el filtro `contact_type`, que es
precisamente lo que `books/repo.ts:115-116` documenta como deliberado.

### P3 · Blindaje de intención en el guardián del esquema

**No hay bug vivo**, y el diseño no lo vende como tal: `packages/zoho-sync/src/db/pool.ts:5` sólo
añade `search_path=desk,public` cuando `config.dbSchema === 'desk'`, y en cualquiera de los dos casos
**`books` nunca está en el `search_path`**. Una `ALTER` sin calificar no puede aterrizar en
`books.contacts`.

El hueco es de intención: `contacts` es el único nombre pelado que colisiona entre `DESK_TABLES`
(`migrate.ts:63`) y `BOOKS_TABLES` (`:80`), así que `ALTER TABLE contacts …` escrita para Books pasa
`migrate.test.ts:337-343` **y también** `:364-365`, donde `contacts` ya está en el conjunto esperado.

**Lo que no se puede hacer, y por qué.** Ninguna comprobación estática lee la intención de
`ALTER TABLE contacts`. Y **no se toca `schema.sql`** (criterio de aceptación nº 6 de la propuesta),
así que la vía del marcador en comentario queda descartada. Las `ALTER` sin calificar de `DESK_TABLES`
**siguen sin calificar**: calificarlas las rompe, porque `desk` sólo existe tras `reorgToDesk` y ése
no corre en los tests (`migrate.test.ts:304-309`).

**Lo que sí se puede: impedir que entre una nueva sin que nadie decida.** Se exporta desde
`migrate.ts` —donde ya viven las tres listas, por la razón que `migrate.test.ts:311-312` da: los dos
guardianes tienen que leer de la MISMA lista— un clasificador **puro y sin llamador en tiempo de
ejecución**:

```ts
export function nombresAmbiguos(): string[]                 // nombres pelados en más de una lista → ['contacts']
export function altersAmbiguas(statements: string[]): string[]  // ALTER sin calificar sobre un nombre ambiguo, normalizadas
```

Dos pruebas: una **con fixture sintético** (una `ALTER TABLE contacts` con intención de Books,
independiente de `schema.sql`) y otra sobre el `schema.sql` real, que fija el censo exacto — hoy una
sola sentencia, la de `schema.sql:256` (`modified_time`). Cualquier `ALTER TABLE contacts` nueva se
pone roja **con un mensaje que nombra la ambigüedad**, no con un contador que se sube de 29 a 30 sin
pensar (que es lo que hoy pasaría con `:358`).

### P4 · La precedencia 422/409, en prueba

El comentario de `routes/remision.ts:144-147` declara que el 422 del serial (`:152-157`) va antes del
409 de remisión pendiente (`:174-183`). Ninguna prueba lo fija: las del 409 siempre tienen serial y
las del 422 (`remisiones.test.ts:884-928`) nunca tienen remisión previa.

Montaje, por SQL directo como ya hace el resto del fichero: reutilizar `ticketDeZohoSinSerial`
(`remisiones.test.ts:884-888` — ticket `tz`, `equipo_id` NULL, `serial` NULL) y añadir una remisión
que cumpla las tres condiciones de `remisionPendienteDe` (`apps/desk/server/db/remisiones.ts:69`):
`ticket_id='tz'`, `estado='pendiente'`, `anulada_at IS NULL` — patrón de `remisiones.test.ts:694`.
`POST /api/remisiones` **sin** `permitirSegunda` → **422** y `error` casando `/serial/i`.

La afirmación sobre el mensaje no es adorno: sin ella, un 422 de otra guarda daría la prueba por
buena.

**Honestidad sobre la alcanzabilidad**, que va también en el commit: que el sync sobrescriba `serial`
está **verificado** (`packages/zoho-sync/src/db/repo.ts:62-65`, y la guarda de `:56-58` sólo protege
`managed_by_app = true`); que el campo llegue vacío desde Zoho es **hipótesis** — no hay acceso a esos
datos.

### P5 · `CrearRemision.tsx:195`

`{!data.equipo.serial && (` → `{!(data.equipo.serial ?? '').trim() && (`. Un serial de sólo espacios
es *truthy*, así que hoy el aviso no dispara y el servidor sí recorta antes de decidir
(`routes/remision.ts:153`) y responde 422 — caso ya fijado en `remisiones.test.ts:906-913`.

**Va sin prueba a propósito.** Es `.tsx`, y los 39 ficheros `.tsx` de `apps/desk/src` están fuera de
la red de pruebas **por decisión explícita de Gerencia** (F0-00, 2026-09-08; `vitest.config.ts:17-20`).
No se propone instalar `jsdom` ni `@testing-library`, ni ampliar `vitest.config.ts`. El comentario de
`:190-194` ya dice que el aviso es **comodidad, no guarda**, y bajo la regla invariable 13 eso es
legítimo porque la imposición del servidor está probada.

---

## 3 · Tabla de mutaciones — la prueba y lo que mata

| # | Pieza | Prueba roja | Mutación que mata |
|---|---|---|---|
| 1 | P1 | Cuerpo `clientId='cli-2'` + `equipo.client_id='cli-1'` → 422 y el mensaje nombra al cliente del equipo | Quitar la rama (ii); o comparar con `\|\|` en vez de `&&`; o un mensaje mudo |
| 2 | P1 · **M5** | Cuerpo **sin** `clientId` + `equipo.client_id='cli-1'` → **201** y `SELECT client_id FROM tickets` = `'cli-1'` | La guarda valida sobre un local resuelto pero `:67` sigue escribiendo `clientId!` (nulo) → **mismo 201**, fila con `client_id` NULL. Sólo muere afirmando sobre la fila |
| 3 | P1 | Cuerpo `clientId='cli-1'` + equipo **sin** `client_id` → 201 y fila con `'cli-1'` | Comparar sin comprobar nulo (`clientId !== equipo.clientId`) → rompe el ~3,4 % de `backfillClientId.ts` |
| 4 | P2 | 200 con el cliente por id · 404 sin fila · 401 sin sesión | Devolver 200 con cuerpo vacío en vez de 404; olvidar `requireAuth` |
| 5 | P3 | Fixture con `ALTER TABLE contacts` de intención Books → `altersAmbiguas` la señala | Clasificador que devuelve `[]`; o que lea de una lista propia en vez de `DESK_TABLES`/`BOOKS_TABLES` |
| 6 | P3 | Censo real: `altersAmbiguas(schemaStatements())` es exactamente la de `schema.sql:256` | Ampliar el censo sin decidir el esquema |
| 7 | P4 | Serial ausente **y** remisión pendiente → 422 con `/serial/i` | Mover la guarda del serial detrás del bloque de `:174-183` → 409 |

El helper `equipo()` de `ticketService.test.ts:233-235` **nunca fija `client_id`**, así que ninguna
prueba viva puebla el par y ninguna se rompe. Las pruebas 1–3 necesitan una variante del helper que
acepte `client_id` (`INSERT INTO equipos (…, client_id)`, la columna existe —`db/equipos.ts:76` la
selecciona—). P2 va en `apps/desk/server/admin.test.ts`, dentro del `describe` de `:135-194`.

---

## 4 · Orden de implementación

1. **P1** — primero, y a propósito: es la única pieza que cierra un hueco de la regla invariable 13.
   Si la tanda se interrumpe, lo demás es blindaje.
2. **P4** — sólo prueba, sin acoplamiento con P1.
3. **P3** — clasificador puro + dos pruebas; no cambia comportamiento.
4. **P2** — endpoint y consumidor **en el mismo commit** (el §6 de la propuesta obliga: revertir el
   endpoint sin el consumidor deja `CreateTicket.tsx` roto).
5. **P5** — una línea, al final.

Cada pieza es un ciclo rojo→verde→commit propio. Presupuesto de revisión: estimación ~250 líneas
autoras entre las cinco, por debajo del umbral de 400; `sdd-tasks` confirma la cifra.

---

## 5 · Plan de reversión

| Pieza | Reversión |
|---|---|
| **P1** | Preferente: quitar **sólo la rama (ii)** (el 422) y conservar el relleno (i). Total: `git revert` devuelve el alta a `56ff441`. Ninguna fila escrita necesita reparación — son *más* correctas, no menos |
| **P2** | Se revierte **con su consumidor** o no se revierte |
| **P3 · P4** | Sólo pruebas y un clasificador sin llamador: revertir no cambia comportamiento |
| **P5** | Una línea de aviso en el navegador; el servidor ya impone el 422 |

Sin migración de esquema, sin dato escrito que deshacer, sin cambio de contrato de salida.

---

## 6 · Matriz de amenazas

`references/threat-matrix.md` cubre frontera de shell, subprocesos, selección de repositorio Git,
estado de commit/push y automatización de PR. **Ninguna fila aplica**: esta tanda no ejecuta comandos,
no lanza subprocesos, no automatiza Git ni PR, y no clasifica ficheros ejecutables.

| Frontera | Aplicabilidad |
|---|---|
| Rutas tipo documentación | N/A — no se clasifica ni ejecuta ningún fichero |
| Selección de repositorio Git | N/A — no hay invocación de Git en el código de la tanda |
| Estado del índice / commit | N/A |
| Estado de push | N/A |
| Comandos de PR | N/A |

La única frontera real es **HTTP**, y no es la de esta matriz: P2 añade `GET /api/clients/:id` bajo
`requireAuth(db)`, sin ampliar lo que una sesión ya podía leer por `/api/clients` (`directory.ts:15`).
Se cubre con las tres pruebas de la fila 4 del §3.

---

## 7 · Preguntas abiertas

- [ ] **Punto abierto nº 52 del maestro** (`R08.1.md:2079`). Mientras no se resuelva, la rama (ii) de
      P1 puede rechazar trabajo legítimo. El `logger.warn` del §1.2 es la instrumentación que lo
      convertiría en dato en vez de sospecha. **No bloquea esta tanda.**
- [ ] **Duplicados en `books.contacts`.** Si la misma empresa existe como dos filas, el 422 es
      injusto. No se mide desde aquí (sin acceso a la base) y no se cierra en esta tanda.
- [ ] **Precedencia 409/422 del alta** (`ticketService.test.ts:313-318`, `tickets-core` §4.1 con
      `transitions-st` §3.8). Sigue **sin decidir**; este diseño la esquiva colocando la guarda
      después del 409 y no la resuelve.
- [ ] **El desvío `ticketService.ts:39`** (cuerpo ↔ `ov.clientId`) queda anotado en `CLAUDE.md` y
      `openspec/config.yaml`, sin destino inventado (criterio de aceptación nº 8).
