# Tareas — Propagar el Top 5 a los tickets abiertos y lista de «Remisión creada»

Cambio `propagar-top5-lista-remision-creada` (`tanda: F1B-07`, `cierra: no`). Manda el diseño donde difiere de la
spec en CÓMO; las casillas marcadas «⚠ diferencia spec/diseño» esperan decisión del orquestador antes del apply.
Cada lote es un intento del registro (techo 800, válvula 720), con su propia fase de partida, sus rojos, su código,
sus mutaciones y su cierre, y deja el árbol en verde por sí solo. Se aplican **en orden**: L1, L2a, L2a-bis, L2b, L3
(L3 es independiente de L1 y L2; el orden sólo evita mezclar intentos).

## Review Workload Forecast

| Lote | Pruebas (líneas) | Estimación (pruebas × 1,8 + código + `apply-progress.md` + casillas) | Diseño decía | Riesgo frente a 800 |
|---|---|---|---|---|
| L1 | ~82 | ~220 | ~150 | Bajo |
| L2a (con el corte) | ~205 | ~545 | ~490 | Medio, bajo la válvula |
| L2a-bis | ~60 | ~160 | (parte de L2a) | Bajo |
| L2b | ~90 | ~250 | ~180 | Bajo |
| L3 | ~143 | ~385 | ~255 | Bajo |

**Corte de L2a aplicado.** Sin corte L2a mide ~265 líneas de prueba × 1,8 = ~477 + ~105 de código + ~50 de
`apply-progress.md` + ~30 casillas = **~660**, por encima de los ~550 que fija el encargo. Se saca la prueba **atómica**
(~35) y la de **recuento de lecturas** (~25) a **L2a-bis**. Consecuencia que el orquestador debe conocer: en L2a la
transacción de `fijarYPropagarPrioridadCliente` se escribe antes de que exista su prueba atómica (esa prueba nace
VERDE en L2a-bis y la mutación M4 demuestra que discrimina). Si se prefiere no romper el rojo-antes-que-verde para la
atomicidad, la alternativa es dejar la atómica en L2a (~+60) y aceptar ~600.

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

*Motivo de «Yes»:* las cuatro casillas «⚠ diferencia spec/diseño» (§Diferencias, D-1 y D-2) afectan al QUÉ y las
resuelve el orquestador, y hay que confirmar el corte L2a-bis. No hay encadenado de PR: la unidad es el intento del
registro en el worktree, fusionado a `main` al cerrar.

### Unidades de trabajo

| Unidad | Meta | Prueba enfocada | Harness real | Frontera de reversión |
|---|---|---|---|---|
| L1 | Marca `prioridad_en_app_at` frente al sync | `npx vitest run packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts packages/zoho-sync/src/db/migrate.test.ts` | pg-mem; sin servicios reales | `git revert` del lote; la columna puede quedarse |
| L2a | Propagación y reversión + `origen` + inversión TC24-14/15 | `npx vitest run packages/shared/src/prioridadPropagada.test.ts apps/desk/server/propagarTop5.test.ts apps/desk/server/prioridadTop5.test.ts` | pg-mem | `git revert`; `DROP NOT NULL` no se deshace con filas `a` NULL |
| L2a-bis | Atómica y recuento de lecturas | `npx vitest run apps/desk/server/propagarTop5Atomica.test.ts` | pg-mem | `git revert` (sólo pruebas) |
| L2b | Traza al nacer + origen en la lectura | `npx vitest run apps/desk/server/trazaTop5AlNacer.test.ts` | pg-mem | `git revert` |
| L3 | Lista de «Remisión creada» | `npx vitest run apps/desk/server/listaRemisionCreada.test.ts packages/shared/src/listaPorEntrada.test.ts apps/desk/src/lib/boardView.test.ts` | pg-mem; pantalla: sección de persona | `git revert`, independiente de L1/L2 |

## Diferencias spec/diseño (ver también `risks` del informe)

- **D-1 ⚠ Traza al nacer (QUÉ).** Spec RQ-TC-38: hay fila sólo si el Top 5 cambia el resultado frente a
  `prioridadAlNacer(pedida, contrato, null)`, y `de` lleva el contrato. Diseño D11/L2b: `de = baseAlNacer(pedida) =
  prioridadAlNacer(pedida, false, null)` (sin contrato) y fila si `de !== input.priority`. Difieren con contrato
  vigente + Top 5 + cuerpo ≠ `High`, p. ej. cuerpo `Low`, contrato y Top 5 `Low`: la spec NO deja fila, el diseño SÍ
  (`Low` → `High`, atribuyendo al Top 5 lo que hizo el contrato). Afecta L2b.
- **D-2 ⚠ Autor y atomicidad de la fila de alta.** Spec: «un fallo posterior del alta no deja la fila». Diseño:
  el `INSERT` va tras `createTicket` en `equipoNuevo.ts:90`; **hipótesis** no comprobada de que corre dentro de la
  MISMA transacción que las guardas posteriores. Afecta L2b.
- **D-3 Tiempo transcurrido.** Spec RQ-VT-10: «si la pantalla lo enseña, lo trae el servidor». Diseño D13: la lista
  devuelve `enEstadoDesde` y NO pinta el tiempo. Compatible (condicional), pero la spec deja abierta una pantalla que el
  diseño cierra; E-nueva-5.
- **D-4 Flujo.** Ninguno de los dos filtra por flujo; la spec dice «estado actual = Remisión creada» y el diseño filtra
  sólo por `STATUS_REMISION_CREADA`. Sin diferencia, pero ninguna prueba exige que otro flujo con ese nombre de estado
  entre; no se añade.
- **D-5 Literales.** La spec no fija clave de vista, ruta, orígenes ni nombre de campo: manda el diseño
  (`remision_creada`, `GET /api/remision-creada`, `top5` / `top5_revertido` / `top5_al_nacer`, `enEstadoDesde`,
  `ticketsCambiados`, etiqueta «Equipos en Remisión creada»).
- **D-6 Escenarios de la spec sin prueba en la tabla del diseño** (se añaden casillas, no cambian el QUÉ): el cuerpo
  no dirige la propagación; `404`/`422` no propagan; recuento en la respuesta; no toca `ticket_transitions` ni SLA;
  Top 5 previo no propaga solo; N+1 de la lista; «Habilitar Servicio» desde la lista; el ajuste manual no pone la marca
  de prioridad; fila de ajuste manual con origen vacío; `INSERT` con `a` NULL.
- **D-7** Spec RQ-TC-36 cuenta como base «alta bajo Top 5 o propagación»; el diseño lo expresa como `ORIGENES_TOP5`
  (incluye `top5_al_nacer`). Equivalentes; `baseDeTop5` debe contar los dos y cortar en `top5_revertido`.

---

# LOTE L1 — Marca por fila de la prioridad frente al sincronizador (≈ 220)

Archivos: `schema.sql` (+3 al final), `repo.ts` (0 netas), `migrate.test.ts`, `repoPrioridadEnApp.test.ts` (nuevo).

**Fase de partida**
- [x] L1.1 Anotar `git rev-parse HEAD` del worktree (commit de partida de L1), abrir el intento del registro en el
  worktree, y medir `wc -l` de `repo.ts`, `schema.sql` (707), `migrate.test.ts`.
- [x] L1.2 Leer `repo.ts:64-95` y `migrate.test.ts:374-385`, `:432-443` para fijar los moldes.

**Rojo**
- [x] L1.3 En `migrate.test.ts`, en sitio (`:374`, `:376`, `:378`, título incluido): recuento 51 / 27 / 24. Cero netas.
- [x] L1.4 Prueba «sin relleno» al final de `migrate.test.ts` (tras `:444`, molde de `:432-443`): la `ALTER` no rellena
  filas previas y es la única sentencia que nombra `prioridad_en_app_at`.
- [x] L1.5 Crear `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts` con: (a) con la marca, `upsertTicket` con otra
  prioridad no la cambia, `subject` sí, `managed_by_app` sigue `false`; (b) las dos marcas a la vez protegen orden y
  prioridad y `subject` cambia; (c) una fila sólo con la de prioridad sí actualiza `orden_venta`.
- [x] L1.6 **Nacen verdes (caracterización):** sin marca manda Zoho; `managed_by_app = true` gana con la marca puesta
  (gemela de `repo.test.ts:318`); `upsertTicket` nunca escribe la marca; la marca no está en `TICKET_COLS`.
- [x] L1.7 **EJECUTAR** `npx vitest run` sobre los dos ficheros y anotar el fallo literal de cada rojo en
  `apply-progress.md` (esperado: recuento 50≠51, columna inexistente, `priority` pisada).

**Verde**
- [x] L1.8 Añadir al final de `schema.sql` (líneas 708-710) dos líneas de comentario SIN punto y coma y
  `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;` (sin calificar).
- [x] L1.9 Editar en sitio `repo.ts:67` (añade la columna al `SELECT`), `:70` (tipo) y `:76-78` (tres líneas, filtro
  de `priority` con `prev?.prioridad_en_app_at != null`). `:71` no se toca y sigue primera.
- [x] L1.10 **EJECUTAR** los dos ficheros: todo verde.

**Comprobación de cero netas**
- [x] L1.11 `git diff --numstat` de `repo.ts`: inserciones = borrados; `wc -l` antes y después idéntico. Anotar.

**Mutaciones (aplicar, ver qué cae, anotar mensaje literal, REVERTIR)**
- [x] L1.12 **M1 (regla 1, posición):** mover `repo.ts:71` debajo del `await db.query` de `:89-93`. Cae «`managed_by_app`
  gana con la marca de prioridad». Revertir.
- [x] L1.13 **M2:** en `repo.ts:78`, `c === 'priority'` → `c === 'prioridad'`. Caen las dos rojas de L1. Revertir.
- [x] L1.14 **M10 (regla 2, fichero vigilado):** añadir a `schema.sql` `UPDATE tickets SET prioridad_en_app_at = now();`.
  Cae «sin relleno» (dos sentencias en vez de una). Revertir.
- [x] L1.15 **M8/M9 de L1 (regla 2):** ensuciar `schema.sql` con `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS x text;`
  (cae `migrate.test.ts:332`). Revertir.
- [x] L1.16 `git diff` sobre `repo.ts` y `schema.sql`: no queda ninguna mutación (sólo el verde de L1.8-L1.9).

**Regla 13 y cierre**
- [x] L1.17 Escribir en `apply-progress.md` la regla 13 de L1: «que el sincronizador no pise la prioridad» lo impone
  `upsertTicket` (`repo.ts:76-78`), servidor, única comprobación; el cliente no participa.
- [x] L1.18 **CIERRE L1:** `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores); anotar el CÓDIGO DE
  SALIDA de cada uno (`${PIPESTATUS[0]}` si se canaliza).
- [x] L1.19 Medida del intento: `git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin trackear;
  registrarla. Binarios, aparte. Si supera 720, parar.
- (fuera del recuento, regla del ciclo 1) L1.20 **FIN DE L1.** Settle y fusión a `main` antes de abrir L2a (sin rebasar con el intento abierto).

---

# LOTE L2a — Propagación y reversión (≈ 545 con el corte)

Archivos: `schema.sql` (+4), `migrate.test.ts` (0), `shared/prioridadPropagada.ts` + prueba (nuevos), `shared/index.ts`
(+1), `prioridadCliente.ts` (al final), `routes/prioridad.ts` (0), `prioridadTop5.test.ts` (0), `propagarTop5.test.ts` (nuevo).

**Fase de partida**
- [x] L2a.1 Anotar `git rev-parse HEAD` (partida de L2a), abrir el intento y medir `wc -l` de `routes/prioridad.ts`,
  `prioridadCliente.ts`, `schema.sql`, `shared/src/index.ts`.
- [x] L2a.2 Leer `prioridadCliente.ts`, `routes/prioridad.ts:30-60`, `prioridadTop5.test.ts:170-200`, `:320-340`.

**Rojo (puro, `shared`)**
- [x] L2a.3 Crear `packages/shared/src/prioridadPropagada.test.ts`: tabla de `cambioPorTop5` (marcar, cambiar,
  desmarcar, contrato + `Low` → `High`, exento antes y después, **origen desconocido exime**, sin base al desmarcar,
  ciclo marcar-desmarcar-transición-marcar-desmarcar, igual a la actual → `null`, revertir a `null`) y de
  `baseDeTop5` / `esAjusteManual`.
- [x] L2a.4 **EJECUTAR** y anotar el fallo literal (la función no existe).

**Rojo (esquema y servidor)**
- [x] L2a.5 En `migrate.test.ts` en sitio (`:374`, `:376`, `:377`, `:385`, título): 53 / 29 (24 public + 5 books) / 24 /
  8 identidades (entra `public.prioridad_ajustes`). Cero netas. **EJECUTAR**: rojo (51≠53).
- [x] L2a.6 **Hipótesis `DROP NOT NULL`:** prueba que inserta en `prioridad_ajustes` una fila con `a` NULL y otra con
  `origen` NULL tras `migrate`. Si pg-mem falla, aplicar el plan B del diseño (D9: `''` leído como `null` en
  `ajustesDelTicket`) y anotarlo.
- [x] L2a.7 Crear `apps/desk/server/propagarTop5.test.ts` (rojas): cerrados y cliente ajeno intactos; ticket sin
  `client_id` intacto; esperas y `status_type` nulo cuentan como abiertos; contrato + Top 5 `Low` → `High`; sin
  contrato, Top 5 más bajo baja (S-5); misma prioridad ⇒ ni escritura ni traza; reversión a NULL; `managed_by_app` no
  cambia; sobrevive a `upsertTicket`; la marca se conserva tras revertir; el exento no recibe la marca; ticket sin
  base no se toca (invertido luego por L2b); «abierto» enfrentado a `getActiveTickets` sobre el mismo juego de datos
  (H5); posición de la exención frente al filtro de abiertos (cerrado con ajuste, abierto con ajuste, abierto sin ajuste).
- [x] L2a.8 Añadir en el mismo fichero: respuesta del `PUT` con `ticketsCambiados` (2 de 3); el cuerpo con lista de
  tickets o prioridad por ticket se ignora; `403` y `422` y `404` no propagan ni dejan traza (el `403` con tickets que
  propagar, caso de M3); no toca `ticket_transitions`, estado ni el instante del SLA; Top 5 previo no se propaga sin
  `PUT`; cambiar la prioridad de un Top 5 propaga (S-6); transición intermedia no exime (S-4).
- [x] L2a.9 **Nace verde (caracterización):** el ajuste manual (`ajustarPrioridad`) fija `managed_by_app = true`, NO
  pone `prioridad_en_app_at` y deja la fila con `origen` NULL.
- [x] L2a.10 **INVERTIR TC24-14** (`prioridadTop5.test.ts:180-185`): dos `Low` quedan `High`, una fila `top5` por ticket
  con `de`, `a`, autor y fecha. Cambiar el título del `describe` de `:179`.
- [x] L2a.11 **INVERTIR TC24-15** (`:187-193`) cambiando de JUEGO DE DATOS: ticket `Low`, marcar `High`, desmarcar → `Low`
  con fila `top5_revertido`. El caso de hoy (ya era `High`, sin cambio ni traza por D6) pasa a una prueba nueva en
  `propagarTop5.test.ts`. Conservar 16 líneas en `:179-194`, cero netas. NO tocar `ticketService.test.ts:1154` ni `:1160`.
- [x] L2a.12 **EJECUTAR** los tres ficheros y anotar el fallo literal de cada rojo, TC24-14/15 incluidos.

**Verde**
- [x] L2a.13 Añadir al final de `schema.sql` (711-714): comentario sin punto y coma,
  `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` y
  `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;`. Sin relleno.
- [x] L2a.14 Crear `packages/shared/src/prioridadPropagada.ts` (`ORIGENES_TOP5`, `MOTIVO_POR_ORIGEN`, `esAjusteManual`,
  `baseDeTop5`, `cambioPorTop5` en el orden (1) manual (2) base (3) fórmula (4) igual ⇒ `null`) y
  `export * from './prioridadPropagada'` al final de `shared/src/index.ts`.
- [x] L2a.15 Añadir **al final** de `apps/desk/server/db/prioridadCliente.ts` `fijarYPropagarPrioridadCliente(db, a, hoy?)`
  con las cinco consultas del diseño §5 sobre el `q` de `enTransaccion`. Nada por encima se mueve.
- [x] L2a.16 `routes/prioridad.ts`: `:8` cambia el import; `:44` llama a `fijarYPropagarPrioridadCliente` y responde con
  `ticketsCambiados`. Cero netas; la guarda de `:40` sigue antes.
- [x] L2a.17 **EJECUTAR** los ficheros de L2a: todo verde, TC24-14/15 incluidos.

**Cero netas**
- [x] L2a.18 `git diff --numstat` de `routes/prioridad.ts`: inserciones = borrados; `prioridadCliente.ts` sólo crece al
  final; `schema.sql` sólo crece al final. `wc -l` antes/después de cada uno.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] L2a.19 **M3 (regla 1):** subir la llamada de `routes/prioridad.ts:44` encima de la guarda de `:40` con valores
  fijos. Cae «403 con tickets que propagar» (dos condiciones a la vez). Revertir.
- [x] L2a.20 **M5 (regla 1):** en `baseDeTop5`, buscar en todas las filas en vez de tras la última reversión. Cae el
  ciclo (da `Low` en vez de `Medium`). Revertir.
- [x] L2a.21 **M6:** quitar el paso (1) de `cambioPorTop5`. Caen la exención antes y después. Revertir.
- [x] L2a.22 **M7 (regla 2, datos):** insertar en `prioridad_ajustes` una fila con `origen` NULL y otra con
  `origen = 'otro'`: ambos tickets quedan exentos sin tocar código; mutar `esAjusteManual` a `origen == null` y ver
  caer el segundo. Revertir.
- [x] L2a.23 **M8 (regla 2):** ensuciar `schema.sql` con `ALTER TABLE prioridad_ajustes ADD COLUMN IF NOT EXISTS x text;`
  sin calificar. Caen `migrate.test.ts:332` y `:345`. Revertir.
- [x] L2a.24 `git diff` de `schema.sql`, `shared/`, `prioridadCliente.ts` y `routes/prioridad.ts`: no queda ninguna mutación.

**Regla 13 y cierre**
- [x] L2a.25 Escribir en `apply-progress.md` la regla 13 decisión a decisión (diseño §8): qué tickets se tocan →
  consultas 2 y 3; qué prioridad toma cada uno → `cambioPorTop5` → `contratos.ts:66-69`; quién marca → `routes/prioridad.ts:40`.
  Comodidad del cliente: sólo el recuento.
- [x] L2a.26 **CIERRE L2a:** `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), con CÓDIGO DE SALIDA.
- [x] L2a.27 Medida: `git diff --shortstat --no-renames <partida L2a>` + `wc -l` de lo nuevo sin trackear. Si pasa de
  720, parar y consultar.
- (fuera del recuento, regla del ciclo 1) L2a.28 **FIN DE L2a.** Settle y fusión a `main`.

---

# LOTE L2a-bis — Atómica y recuento de lecturas (≈ 160) — SÓLO si se aplica el corte

- [x] L2abis.1 Anotar `git rev-parse HEAD` (partida), abrir el intento.
- [x] L2abis.2 Crear `apps/desk/server/propagarTop5Atomica.test.ts`, molde de `prioridadTop5.test.ts:333`: falla el
  `INSERT` de la traza ⇒ `BEGIN, INSERT, SELECT, SELECT, SELECT, UPDATE, INSERT, ROLLBACK`, todo con prefijo `tx:`.
  **Nace verde** (el código existe desde L2a); su discriminación la prueba M4.
- [x] L2abis.3 En el mismo fichero: mismas lecturas con 1 y con 5 tickets (nace verde). Y: tras el fallo no cambian la
  fila de `cliente_prioridad`, la prioridad de ningún ticket ni la traza.
- [x] L2abis.4 **EJECUTAR** y confirmar verde.
- [x] L2abis.5 **M4 (regla 1):** en `fijarYPropagarPrioridadCliente`, `fijarPrioridadCliente(q, …)` → `(db, …)` antes de
  `enTransaccion`. Debe caer la atómica con `pool:INSERT`. Anotar el mensaje. REVERTIR y confirmar con `git diff`.
- [x] L2abis.6 Regla 13: nada nuevo (sólo pruebas); anotarlo.
- [x] L2abis.7 **CIERRE L2a-bis:** `npm test`, `npm run typecheck`, `npm run lint`, con CÓDIGO DE SALIDA; medida del intento.
- (fuera del recuento, regla del ciclo 1) L2abis.8 **FIN DE L2a-bis.** Settle y fusión a `main`.

---

# LOTE L2b — Traza al nacer y lo que se enseña (≈ 250)

Archivos: `prioridadPropagada.ts` + prueba, `prioridadCliente.ts`, `services/equipoNuevo.ts` (0 netas),
`services/ticketService.ts` (0 netas, `:106` byte a byte), `trazaTop5AlNacer.test.ts` (nuevo), `src/api/client.ts`,
`Top5Panel.tsx`, `PanelPrioridad.tsx`.

- [x] L2b.1 Anotar `git rev-parse HEAD` (partida) y abrir el intento; medir `wc -l` de `equipoNuevo.ts`, `ticketService.ts`,
  `prioridadCliente.ts`, `client.ts`. Guardar la línea 106 de `ticketService.ts` para compararla byte a byte.
- [x] L2b.2 ⚠ **Resolver antes de redactar las pruebas: D-1 (¿`de` lleva el contrato? ¿hay fila cuando el contrato ya
  daba `High`?) y D-2 (¿el `INSERT` de `equipoNuevo.ts:90` está en la misma transacción que las guardas posteriores?).**
  Las casillas L2b.4 a L2b.7 dependen de la respuesta; hasta entonces siguen el diseño.

**Rojo**
- [x] L2b.3 En `prioridadPropagada.test.ts`: `baseAlNacer(pedida)` (+20). ⚠ diferencia spec/diseño D-1: si el
  orquestador decide la spec, la firma lleva el contrato.
- [x] L2b.4 Crear `apps/desk/server/trazaTop5AlNacer.test.ts`: nace bajo Top 5 con prioridad distinta de la pedida ⇒
  fila `top5_al_nacer`, `de` = la pedida, `a` = la escrita, autor del alta; desmarcar al cliente la devuelve a su
  calculada (criterio 8). ⚠ D-1.
- [x] L2b.5 Mismo fichero: nace sin Top 5 ⇒ sin fila; nace con Top 5 igual a la pedida ⇒ sin fila; con contrato y
  Top 5 `Low` y cuerpo `High` ⇒ sin fila (⚠ D-1: el caso cuerpo `Low` discrepa spec/diseño y queda sin escribir hasta
  decidir). `GET /api/tickets/:id/prioridad` trae `origen` en todas las filas, la manual con origen vacío.
- [x] L2b.6 Mismo fichero: un fallo posterior del alta (guarda posterior) no deja ticket ni traza (⚠ D-2).
- [x] L2b.7 **INVERTIR** la prueba de L2a «nacido bajo Top 5 sin base no se toca» al caso con traza (criterio 8); el
  caso «sin traza» se conserva para los tickets previos al despliegue (S-10).
- [x] L2b.8 **EJECUTAR** y anotar el fallo literal (`equipoNuevo.ts:90` no escribe traza).

**Verde**
- [x] L2b.9 `prioridadPropagada.ts`: añadir `baseAlNacer` (+8). `prioridadCliente.ts`: añadir al final
  `baseSiNaceBajoTop5(db, clientId, pedida)`; en sitio `:76`, `:80`, `:81` (`a: string | null`, `origen`). (+12)
- [x] L2b.10 `equipoNuevo.ts`: `:84` añade `alNacer?` y `:90` el `INSERT` con `origen 'top5_al_nacer'`, `a = input.priority`,
  `ajustado_por = input.actor`; cero netas.
- [x] L2b.11 `ticketService.ts`: `:5` añade el import y `:108` el argumento; `:106` intacta; cero netas.
- [x] L2b.12 `client.ts`: `:713` `ticketsCambiados?: number`; `:715` `a: string | null; origen?: string | null`. En
  `Top5Panel.tsx` (`:28`) enseñar el recuento y en `PanelPrioridad.tsx` (`:55`) `{a.a ?? 'sin prioridad'}` (~+3). Sin
  prueba (`.tsx` fuera de la red por decisión de Gerencia).
- [x] L2b.13 **EJECUTAR** los ficheros de L2b y `ticketService.test.ts`: verde; `:1154` y `:1160` intactas.

**Cero netas**
- [x] L2b.14 `git diff --numstat` de `equipoNuevo.ts` y `ticketService.ts`: inserciones = borrados. `git diff` de
  `ticketService.ts` muestra la línea 106 sin cambio byte a byte. `wc -l` antes/después.

**Mutaciones**
- [x] L2b.15 **Posición (regla 1):** mover el `INSERT` de `equipoNuevo.ts:90` antes del `createTicket`. Debe caer la
  prueba de fallo posterior o la de FK. Anotar y REVERTIR. `git diff`: ninguna mutación queda.

**Regla 13 y cierre**
- [x] L2b.16 `apply-progress.md`: la traza al nacer la escribe el servidor (`equipoNuevo.ts:90`); el cliente sólo enseña
  el recuento y el origen.
- [x] L2b.17 **CIERRE L2b:** `npm test`, `npm run typecheck`, `npm run lint`, con CÓDIGO DE SALIDA; medida del intento.
- (fuera del recuento, regla del ciclo 1) L2b.18 **FIN DE L2b.** Settle y fusión a `main`.

---

# LOTE L3 — Lista de «Remisión creada» (≈ 385) — ÚLTIMO LOTE

Archivos: `shared/listaPorEntrada.ts` + prueba (nuevos), `shared/index.ts` (+1), `db/listaRemisionCreada.ts` (nuevo),
`routes/prioridad.ts` (+8 al final), `listaRemisionCreada.test.ts` (nuevo), `boardView.ts` (0), `boardView.test.ts`
(+18 al final), `App.tsx` (0), `Sidebar.tsx` (0), `client.ts` (+5 al final).

- [x] L3.1 Anotar `git rev-parse HEAD` (partida) y abrir el intento; `wc -l` de `boardView.ts`, `App.tsx`, `Sidebar.tsx`,
  `routes/prioridad.ts`, `client.ts`.

**Rojo**
- [x] L3.2 Crear `packages/shared/src/listaPorEntrada.test.ts`: `ordenarPorEntrada` ascendente; `null` al final; empate
  y tramo sin entrada por `number` ascendente; no ordena por prioridad.
- [x] L3.3 Crear `apps/desk/server/listaRemisionCreada.test.ts`: orden del más antiguo al más reciente; cuenta la
  **última** entrada; una entrada posterior a otro estado no cuenta; sin entrada, al final y no se omite; con o sin
  orden de venta entran; sólo `Remisión creada` (no `Notificado`, no cerrado); la prioridad no cambia el orden; mismo
  instante que `ticketsConSlaVencido` (H5); `401` sin sesión y cualquier área lee; **sin N+1** con N y 2N.
- [x] L3.4 **Nace verde:** «Habilitar Servicio» desde la lista sigue rechazado por la guarda de `ticketService.ts:126-131`
  para un usuario sin el área (caracterización, escenario de la spec).
- [x] L3.5 En `boardView.test.ts` (tras `:145`): `applyBoardView(…, 'remision_creada')` no filtra ni reordena; etiqueta
  y `FUNCTIONAL_BY_LABEL`; las siete claves tienen `case` y ninguna cae al `default`.
- [x] L3.6 **EJECUTAR** y anotar los fallos literales (ruta inexistente; la vista cae en `default`, `boardView.ts:54`).

**Verde**
- [x] L3.7 `listaPorEntrada.ts` (~15) y un `export` al final de `shared/src/index.ts`.
- [x] L3.8 `db/listaRemisionCreada.ts` (~25): `getActiveTickets` filtrado por `STATUS_REMISION_CREADA` + `entradasActuales`
  (`db/sla.ts:78-102`), dos lecturas fijas, devuelve `enEstadoDesde`. `routes/prioridad.ts`: import en sitio en `:9` y
  `GET /api/remision-creada` al final tras `:86`, con `requireAuth`.
- [x] L3.9 Cliente, en sitio y con cero netas: `boardView.ts:15` (clave `remision_creada`, etiqueta «Equipos en Remisión
  creada») y `:53` (`case 'todos': case 'remision_creada': return tickets`); `App.tsx:16` import y `:69` rama; `Sidebar.tsx:10`
  etiqueta. `client.ts`: `fetchRemisionCreada()` al final (+5). Sin tarjeta nueva ni tiempo pintado (D13).
- [x] L3.10 **EJECUTAR** los ficheros de L3: verde.

**Cero netas**
- [x] L3.11 `git diff --numstat` de `boardView.ts`, `App.tsx` y `Sidebar.tsx`: inserciones = borrados. `wc -l` antes/después.

**Mutaciones**
- [x] L3.12 **M11:** invertir el signo de `ordenarPorEntrada`. Cae el orden. Revertir.
- [x] L3.13 **M12:** quitar `case 'remision_creada':` de `boardView.ts:53`. Cae `tsc` en `:59` y la prueba de la vista. Revertir.
- [x] L3.14 **Posición (regla 1):** en la consulta de la lista, ordenar antes de filtrar por estado o filtrar después
  de `entradasActuales` con el estado erróneo; ver qué prueba cae y revertir.
- [x] L3.15 `git diff`: no queda ninguna mutación.

**Regla 13**
- [x] L3.16 `apply-progress.md`: orden y contenido de la lista → `listaRemisionCreada` + `ordenarPorEntrada`; «Habilitar
  Servicio» → `ticketService.ts:126-131`; el cliente enseña sin reordenar (`boardView.test.ts:138-143`).

**Barrido de citas (regla de mutación 4) — sólo en L3**
- [x] L3.17 `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` para `repo.ts`, `boardView.ts`, `prioridadCliente.ts`,
  `routes/prioridad.ts`, `equipoNuevo.ts`, `ticketService.ts`, `App.tsx`, `Sidebar.tsx`, `client.ts`, más el segundo pase
  de abreviadas en los ficheros que ya citan cada módulo. Comprobar CADA resultado contra el fichero.
- [x] L3.18 LISTAR y clasificar A, B o C las citas que pasan a AFIRMAR algo falso: las que digan que `repo.ts:76-78` sólo
  filtra la orden de venta, o que `FUNCTIONAL_VIEWS` tiene seis claves. NO editar specs vivas ni documentos fechados;
  la lista va en `apply-progress.md`.

**Redacción para el orquestador (sólo en `apply-progress.md`)**
- [x] L3.19 Redactar el texto de la **corrección del maestro** (`toca_maestro: si`): M1.9.1 (`R08.4.md:1973`) sólo habla
  de la prioridad al nacer; ahora el Top 5 propaga a los abiertos con traza, revierte al desmarcar y no toca los
  ajustes manuales con motivo, y la lista de «Remisión creada» se ordena por la entrada al estado. Sin numerar: lo
  numera y lo pega el orquestador en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.
- [x] L3.20 Redactar sin número, marcadas «a numerar por el orquestador», las preguntas para la bandeja: E-nueva-1 a
  E-nueva-4 de la propuesta (§15) y E-nueva-5 y E-nueva-6 del diseño (§12), más la resolución de D-1 y D-2 si cambió algo.
  NO escribir en `docs/sdd/ENTRADA.md` ni en `openspec/config.yaml`.
- [x] L3.21 Línea única de cobertura para el `archive-report.md` (qué parte de F1B-07 cubre este cambio y qué deja fuera,
  la pregunta 3.b).

**Cierre**
- [x] L3.22 **CIERRE L3:** `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), con CÓDIGO DE SALIDA.
- [x] L3.23 Medida: `git diff --shortstat --no-renames <partida L3>` + `wc -l` de lo nuevo sin trackear (los `.tsx`,
  sin prueba por decisión de Gerencia). Si pasa de 720, parar.
- [x] L3.24 `git diff --numstat` global: `repo.ts`, `boardView.ts`, `ticketService.ts`, `equipoNuevo.ts`, `App.tsx`,
  `Sidebar.tsx` con inserciones = borrados (cero netas acumuladas).
- (fuera del recuento, regla del ciclo 1) L3.25 **FIN DE L3.** Settle y fusión a `main`.

---

# Comprobaciones de PERSONA — fuera del recuento

*Regla del ciclo 1: no son casillas ni trabajo de una tanda; **archivar este cambio no las da por hechas**.*

| # | Comprobación | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|---|
| 1 | Marcar un cliente Top 5 y ver sus tickets abiertos con la prioridad nueva y su traza | Comercial | Paquete de despliegue | `apply-progress.md` (texto) y el parte del paquete |
| 2 | Desmarcarlo y ver los tickets volver | Comercial | ídem | ídem |
| 3 | Un ticket con ajuste manual no cambió | Comercial | ídem | ídem |
| 4 | Tras una pasada del sync (3 min), un ticket venido de Zoho conserva la prioridad propagada | Comercial | ídem | ídem |
| 5 | Abrir la lista de «Remisión creada» y ver el más antiguo arriba | Comercial | ídem | ídem |
| 6 | Un ticket creado para un cliente Top 5 vuelve a su prioridad al desmarcarlo | Comercial | ídem | ídem |
| 7 | Tras propagar, los tickets del cliente NO aparecen como no leídos | Comercial | ídem | ídem |
| 8 | Respuestas de Gerencia a E-nueva-1 a E-nueva-6 | Gerencia | Bandeja, a numerar por el orquestador | `docs/sdd/ENTRADA.md` (lo escribe el orquestador, no el apply) |

Condición de despliegue (dato, no tarea): los Top 5 marcados antes del despliegue no se propagan solos; se propaga al
volver a guardarlos. Sin relleno, sin escritura sobre datos de producción.

**Las cinco líneas «FIN DE Lx. Settle y fusión a `main`» (L1.20, L2a.28, L2abis.8, L2b.18, L3.25) también están fuera
del recuento** (2026-10-04, antes del verify). Comprobado antes de sacarlas: el asiento de cada lote ESTÁ hecho —los
cuatro intentos constan como `passed` en el registro (248, 578, 455 y 480 líneas)— y lo único que les queda es la
fusión a `main`, que no es trabajo de la tanda: la hace el orquestador sólo cuando el analista da la rama por
verificada, una vez archivado el cambio. **Archivar este cambio no da la fusión por hecha.** Dueño: el analista
(verificación) y el orquestador (fusión autorizada). Dónde queda escrito: aquí y en el `archive-report.md`.

---

## Review Workload Forecast por lote (resumen)

| Lote | Líneas estimadas | Riesgo frente a 800 | Decision needed before apply |
|---|---|---|---|
| L1 | ~220 | Bajo | No |
| L2a | ~545 (con el corte; ~660 sin él) | Medio, bajo la válvula 720 | Sí: confirmar el corte L2a-bis |
| L2a-bis | ~160 | Bajo | No |
| L2b | ~250 | Bajo | Sí: resolver D-1 y D-2 |
| L3 | ~385 | Bajo | No |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Resoluciones del orquestador (2026-10-04) — cierran las marcas «⚠ diferencia spec/diseño»

Las toma el orquestador como supuestos razonables y reversibles (regla de ejecución de `CLAUDE.md`); ninguna
contradice una decisión registrada. Van también a la bandeja como pregunta, sin parar la cadena.

- **Corte de L2a: confirmado.** La prueba atómica y la de recuento de lecturas van en L2a-bis. La atómica nace verde
  y se declara como caracterización; la mutación M4 demuestra que discrimina.
- **D-1 · Traza al nacer: manda el DISEÑO.** La base que se guarda es la prioridad PEDIDA en el cuerpo
  (`baseAlNacer = prioridadAlNacer(pedida, false, null)`), y hay fila cuando el cliente es Top 5 y la prioridad final
  difiere de la pedida. Razón: «volver a la calculada» exige recalcular con el contrato vigente EL DÍA de la
  reversión; si la base ya llevara dentro el contrato del día del alta, un contrato vencido entre medias dejaría el
  ticket más alto de lo que le corresponde. La spec (RQ-TC-38) guardaba el resultado sin Top 5, contrato incluido.
  **La primera casilla de L2b alinea el delta de `tickets-core` con esta resolución** antes de escribir pruebas.
  Queda como pregunta para la bandeja: qué base se guarda al nacer bajo Top 5, y si la fila debe existir cuando el
  salto lo causa sólo el contrato.
- **D-2 · Atomicidad de la fila de alta: manda la SPEC.** Un fallo posterior del alta no deja ni ticket ni traza. Si
  la prueba L2b.6 demuestra que el `INSERT` no comparte transacción con las guardas posteriores, el apply lo mete en
  la misma transacción; si para ello hiciera falta cambiar el número de líneas de `ticketService.ts` o reordenar
  guardas del alta, PARA y lo devuelve como bloqueo.
