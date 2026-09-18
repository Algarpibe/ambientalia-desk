---
tanda: fuera-del-plan
motivo: "Cierra los hallazgos de la revisión adversaria de F1B-01 (H1-H4): posición de guardas, guardián de ALTER TABLE, guarda equipo-cliente y el .trim() del serial"
capacidad: [remisiones, tickets-core, zoho-sync]
maestro: ["M1.1", "§1.4.3", "M3"]
cierra: no
toca_maestro: no
origen_cabecera: derivada-17/09
---

# cerrar-hallazgos-revision-f1b-01 · Cerrar los hallazgos de la revisión adversaria de F1B-01

| Dato | Valor |
|---|---|
| Estado | **Propuesta — pendiente de visto bueno** |
| Base | `main` en `56ff441` |
| Entradas | `openspec/changes/cerrar-hallazgos-revision-f1b-01/exploration.md` · revisión adversaria de `git diff c45bcb1 607e26a` |
| Fuente en el maestro | **M1.1** (`R08.1.md:1045`, `:1048`) · **§1.4.3** (`R08.1.md:504`) · **M3** (`R08.1.md:1940`) |
| Modo | `strict_tdd` · `artifact_store: hybrid` · `delivery_strategy: ask-on-risk` |

---

## 1 · El problema, y por qué ahora

F1B-01 hizo del serial la llave de entrada. La revisión adversaria de su diff encontró cinco cosas
que la tanda dejó abiertas, y **cuatro de las cinco son huecos de imposición o de prueba, no de
funcionalidad**: el código hace lo correcto y nada lo obliga a seguir haciéndolo.

El maestro dice por qué eso importa aquí y no en abstracto. M1.1 `[DECIDIDO 21/08]`: *«al introducir
el número de serie, el sistema trae automáticamente la información de cliente y modelo […] El serial
deja de ser sólo un identificador y pasa a ser la llave de entrada de todo el registro»*
(`R08.1.md:1048`). Si el equipo trae el cliente, el servidor no puede aceptar un cliente que
contradiga al del equipo sin decir nada. Y §1.4.3: un dato de captura equivocado *«no se detecta: se
propaga en silencio»* (`R08.1.md:504`), con el activo que es **del cliente** (M3, `R08.1.md:1940`).

**Ahora** porque el hueco lo abrió la tanda anterior y todavía se sabe por qué: `getEquipo` empezó a
devolver `clientId` en F1B-01 (`apps/desk/server/db/equipos.ts:41`) y nadie lo usa para decidir nada.
Cuanto más tarde, más filas escritas sobre las que ya no se puede afirmar nada.

---

## 2 · Alcance — cinco piezas, ninguna más

### P1 · La guarda equipo↔cliente, en el servidor

`apps/desk/server/services/ticketService.ts:24` trae el equipo, `:27` toma el `clientId` del cuerpo,
`:59` sólo comprueba que ese cliente exista y `:67` escribe los dos en el `INSERT`. **Entre `:24` y
`:67` no se comparan.** El navegador sí decide por identidad (`CreateTicket.tsx:148-151`), y eso es
la regla invariable 13, punto 2: una guarda en el cliente no es una guarda.

**Diseño decidido, opción (c) de la exploración:** si el cuerpo no manda `clientId` y
`equipo.clientId` existe, manda el del equipo; si los dos existen y difieren, **422**; si
`equipo.clientId` es NULL, **no se toca nada** y sigue la vía actual. El criterio lo puso Gerencia:
*cualquier guarda que rompa el ~3,4 % de equipos con `client_id` NULL está mal* — ese resto vive de
la vía por nombre (`CreateTicket.tsx:163-176`) y una guarda por coincidencia lo bloquearía de raíz.

**Severidad honesta: integridad de datos, NO autorización.** `tickets.client_id` no autoriza ni
filtra; los listadores sólo lo usan en `LEFT JOIN` para el nombre a mostrar. Hay que decirlo así en
el commit y no heredar el marco de la revisión.

**Decisión de borde — CERRADA POR GERENCIA DESPUÉS DE ESCRIBIR ESTE PÁRRAFO.** `:38` completa hoy
`clientId` desde la OV (`clientId ?? ov.clientId`). Esta propuesta proponía evaluar la guarda sólo
sobre el valor del cuerpo (`:27`) para no tocar el caso equipo↔OV. **Gerencia decidió lo contrario:
la guarda evalúa el valor FINAL de `clientId`, venga del cuerpo o de la OV, y se cierran las dos
puertas.**

El motivo de la decisión: la invariante es sobre lo que se ESCRIBE en la fila (`:67`), no sobre de
qué campo vino, y guardar sólo el cuerpo repetiría el patrón que `CLAUDE.md` ya tiene registrado como
**IV-4** —«una OV, un ticket» tiene tres puertas y sólo dos la comprueban— en la misma tanda que
cierra un hueco de la regla invariable 13.

Consecuencia aceptada, y que el `design.md` razona: **una OV del cliente B con un equipo del cliente A
pasará a dar 422 donde hoy crea el ticket en silencio.** El punto abierto nº 52 del maestro
(`R08.1.md:2071-2079`) dice que existen variantes reales y habituales donde no coinciden, así que
esta guarda puede bloquear trabajo legítimo mientras nº 52 siga sin resolver. El `design.md` fija qué
señal vigilar y cómo se revierte.

*Este párrafo sustituye a la redacción anterior, que decía «SHALL evaluarse sobre el valor del
cuerpo». Se deja constancia del cambio en vez de reescribir la propuesta en silencio.*

### P2 · `GET /api/clients/:id`

`apps/desk/server/routes/directory.ts:15` sólo registra la búsqueda; el lookup por identidad
`getClient(db, id)` ya existe (`packages/zoho-sync/src/books/repo.ts:129`) y no se expone. Con él,
`CreateTicket.tsx` resuelve el cliente por id y deja de depender del `LIKE` de `searchClients`
(`books/repo.ts:117-127`), que no pliega acentos, puntuación ni formas societarias y además pagina a
20. La forma ya está en la casa: `directory.ts:62-67` hace justo eso para contactos y cuentas, con
404 cuando no hay fila.

### P3 · Blindaje de intención en el guardián del esquema

`packages/zoho-sync/src/db/migrate.test.ts:337-343` filtra por el **nombre pelado**, así que una
`ALTER TABLE contacts` escrita para `books.contacts` pasa como tabla de Desk. **No hay bug vivo**:
`packages/zoho-sync/src/db/pool.ts:5` fija `search_path=desk,public` y `books` nunca está dentro. Es
blindaje de intención, y la propuesta no lo vende como otra cosa.

### P4 · La precedencia 422 antes de 409, en prueba

`apps/desk/server/routes/remision.ts:144-147` declara en comentario que el 422 del serial (`:152-157`)
va **antes** del 409 de remisión pendiente (`:174-183`). Ninguna prueba lo fija: las del 409 siempre
tienen serial y las del 422 nunca tienen remisión previa. Una prueba en
`apps/desk/server/remisiones.test.ts` con las dos condiciones a la vez.

### P5 · Una línea en `CrearRemision.tsx:195`

`{!data.equipo.serial && (` no dispara con un serial de sólo espacios, que es *truthy*; el servidor
sí recorta (`routes/remision.ts:153`) y responde 422. Arreglo: `!(data.equipo.serial ?? '').trim()`.
**Sin prueba, a propósito**: es `.tsx`, fuera de la red de pruebas por decisión de Gerencia (F0-00).
No se propone ampliarla.

### Capacidades (contrato con `sdd-spec`)

| Nuevas | — **Ninguna** |
|---|---|
| Modificadas | `tickets-core` (P1: nueva guarda y nuevo 422 en el alta; P2: resolución del cliente por identidad) · `remisiones` (P4: la precedencia 422/409 pasa a ser requisito, no comentario) · `zoho-sync` (P3: el guardián afirma también la intención de esquema de las `ALTER`) |

---

## 3 · Qué NO hace

- **No** cierra la invariante OV↔cliente. Ojo al matiz, porque la decisión de Gerencia sobre P1 la
  roza sin cerrarla: cuando el cuerpo **sí** trae su propio `clientId`, `ticketService.ts:38`
  (`clientId ?? ov.clientId`) deja ganar al del cuerpo y el de la OV no se mira nunca. La guarda nueva
  compara el valor final contra `equipo.clientId`, no contra `ov.clientId`, así que un ticket puede
  seguir llevando una OV del cliente B con cliente y equipo del cliente C. **Se anota como desvío**,
  con destino a decidir; cerrarlo tocaría la cardinalidad OV↔ticket, que el maestro deja en el punto
  abierto nº 52 (`R08.1.md:2079`).
- **No** toca ninguno de los cinco incumplimientos vivos de `CLAUDE.md`.
- **No** modifica el `.docx` maestro ni propone corregirlo.
- **No** cambia el comportamiento del 3,4 % de equipos con `client_id` NULL: siguen por la vía actual.

---

## 4 · TDD

| Pieza | Prueba roja primero | Nota |
|---|---|---|
| P1 | **Sí** | Dos rojas: la del 422 en discrepancia, y **una de tipo M5 — la mutación que NO cambia el código de respuesta, sólo qué queda escrito en la fila** (cuerpo sin `clientId` + equipo con `clientId` → 201, y la fila con el del equipo). Sin ella el relleno por defecto no está probado |
| P2 | **Sí** | 200 con el cliente, 404 sin él, 401 sin sesión |
| P3 | **Sí** | Una `ALTER` con intención de Books que hoy pasa el sub-test de `:337-343` |
| P4 | **Sí** | Serial vacío **y** remisión pendiente a la vez → 422, no 409 |
| P5 | **No, a propósito** | `.tsx` excluido por decisión de Gerencia (F0-00) |

---

## 5 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| P1 rompe pruebas vivas | Baja | El helper `equipo()` de `ticketService.test.ts:215-317` nunca fija `client_id`: hoy ninguna prueba puebla el par. La guarda no se activa en ninguna |
| P1 cambia el orden equipo/OV sin que nadie lo note | Media | Queda **escrito** como efecto declarado (§2, P1) y con prueba M5 propia; `sdd-design` cierra dónde va la guarda |
| P4 fija intención sobre un camino cuya alcanzabilidad tiene una mitad en **hipótesis** | Media | El sync reescribe `serial` en cada pasada (`packages/zoho-sync/src/db/repo.ts:62-65`) y la guarda de `:56-58` sólo protege `managed_by_app = true`: verificado. Que el campo llegue vacío desde Zoho es **hipótesis** — no hay acceso a esos datos. Se dice en el commit y no se vende más |
| P2 se lee como el arreglo del 3,4 % | Baja | No lo es y va escrito: la regresión del `LIKE` sólo ocurre cuando `e.clientId` existe |
| P3 se lee como corrección de un bug vivo | Baja | §2 dice «no hay bug vivo» con la cita de `pool.ts:5` |
| El artefacto de una fase se pierde por falta de herramientas de escritura | Media | Ya pasó en `sdd-explore`. Cada fase declara en su resultado si `Write` estuvo disponible |

---

## 6 · Rollback

Cinco piezas independientes, sin migración de esquema, sin dato escrito que haya que deshacer y sin
cambio de contrato de salida. Se revierten por separado con `git revert` del commit de la pieza:

- **P1** — revertir devuelve el alta al comportamiento de `56ff441`. Las filas escritas mientras
  estuvo activa son *más* correctas, no menos: ninguna necesita reparación.
- **P2** — el endpoint es aditivo. Revertirlo obliga a `CreateTicket.tsx` a volver al `LIKE`, así que
  P2 se revierte con su consumidor o no se revierte.
- **P3 · P4** — sólo pruebas: revertir no cambia comportamiento.
- **P5** — una línea de aviso en el navegador. El servidor ya impone el 422.

---

## 7 · Criterio de aceptación, y cómo se mide

**Se mide con `npm test` y `npm run typecheck` sobre el árbol, no con una afirmación.** Baseline
verificado en `56ff441`: **112 ficheros pasan + 1 omitido (113), 988 pruebas pasan + 2 omitidas
(990), código de salida 0.**

1. La suite queda en verde con **más** pruebas que el baseline, y **cero** pruebas del baseline
   rotas o borradas. Las 2 omitidas siguen siendo 2 y las mismas.
2. Existe una prueba que falla con el código de `56ff441` por cada una de P1 (dos), P2, P3 y P4, y se
   deja constancia de que se vio en rojo antes de escribir el arreglo.
3. La prueba **M5** de P1 afirma sobre la fila escrita, no sobre el código de respuesta.
4. `GET /api/clients/:id` responde 200/404/401 y `CreateTicket.tsx` resuelve el cliente por id.
5. `CrearRemision.tsx:195` recorta antes de decidir, y el commit dice por qué va sin prueba.
6. Ningún cambio en `packages/zoho-sync/src/db/schema.sql`, ni en el `.docx`, ni en los cinco
   incumplimientos vivos.
7. `npm run typecheck` en verde y `npm run lint` sin avisos nuevos.
8. El desvío `ticketService.ts:39` queda **anotado** —en `CLAUDE.md` y en `openspec/config.yaml`, que
   es donde viven— con su porqué y sin destino inventado.
