# Informe de verify — `facturar-dos-ramas` (F1C-02, `cierra: si`)

Verificado sobre `10ea400` (partida `37817ef`; diseño y tareas `97d6f6e`, lote 1 `8167a80`, lote 2 `10ea400`), en el worktree de la rama. **Veredicto: PASS WITH WARNINGS.**
0 CRITICAL · 5 WARNING · 5 SUGGESTION. Modo: strict TDD (`npm test`, vitest). Los 3 requisitos nuevos y los 4 modificados tienen prueba que pasó en tiempo de ejecución, salvo dos escenarios heredados sin prueba (W1, W2) y los declarados de persona.

## 1. Códigos (por separado, sobre `10ea400`)

| Código | Resultado |
|---|---|
| `npm test` | 0 · 295 ficheros pasan (3 omitidos), 4.954 pruebas pasan (11 omitidas) |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 · 0 errores, 165 avisos (el tope de partida; no son fallos nuevos) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 · 7.369 comprobadas, línea base 0, cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas (*hipótesis* de que ninguna es de este cambio: dos las atribuye a ficheros que no toca, `openspec/specs/transitions-st/spec.md` líneas 33 y 484) |

`git status --short` vacío antes y después de cada paso. El `npm run build` no se repitió: *hipótesis* de que sale 0.

## 2. Escenario → prueba

Rutas relativas a la raíz del repositorio. Estado: C = COMPLIANT, M = MISSING.

| Requisito · escenario | Evidencia | |
|---|---|---|
| RQ-TS-42 · el catálogo declara estado, rama y «Facturar» | `packages/shared/src/invariantesGrafo.test.ts:344-355` (id, from/to, área, claves y tipos obligatorios, clase `ninguna`, fase `cierre`, fuera de `ESTADOS_SIN_SALIDA`); `packages/shared/src/estados.test.ts:15`, `:225` | C |
| RQ-TS-42 · «Facturar» registra y cierra | `apps/desk/server/facturar.test.ts:39-50` (200, `Finalizado`, `Closed`, `fecha_factura`, número en `custom_fields` y en la traza); `:35-38` (la fecha va a `fecha_factura`, el número no tiene columna); M1 | C |
| RQ-TS-42 · sin factura o sin fecha, 422 | `apps/desk/server/facturar.test.ts:53-66` (seis casos: sin número, vacío, espacios, sin fecha, `2027-02-30`, `20/01/2027`; el ticket no se mueve); `packages/shared/src/facturar.test.ts:29-55`; M1, M7 | C |
| RQ-TS-42 · otra área no factura, 403 | `apps/desk/server/facturar.test.ts:70-76`; sin excepción de cargo `:77-82`; M4, M5 | C |
| RQ-TS-42 · orden de F1B-10 | `apps/desk/server/facturar.test.ts:85-90` (409), `:91-95` (403), `:96-100` (un solo 422, presencia de la fecha antes que el contenido del número); M6, M7 | C |
| RQ-TS-43 · sin ciclo entre estados de cierre | `packages/shared/src/invariantesGrafo.test.ts:357-359`; `packages/shared/src/reentrancia.test.ts:27` (dos ciclos), `:43` (C1 ya no existe); M2, M3 | C |
| RQ-TS-43 · el catálogo sucio se pone en rojo | `packages/shared/src/invariantesGrafo.test.ts:365-371` (ensucia el catálogo en memoria de dos formas y exige rojo) | C |
| RQ-TS-43 · de `Pendiente de facturar` sólo a `Finalizado` | `packages/shared/src/invariantesGrafo.test.ts:361-363` | C |
| RQ-TS-43 · la reentrancia pierde el ciclo | ocho casos `packages/shared/src/reentrancia.test.ts:83`; nueve campos, siete obligatorios `:92`; fila 47 fuera `:166-176`; conjunto exacto `packages/shared/src/invariantesGrafo.test.ts:137-148`; `packages/shared/src/bodegaje.test.ts:113` | C |
| RQ-TS-05 · alcanzabilidad 20 / 20 / 21 | **sin prueba** (W1). Cifras medidas por mí, §3 | M |
| RQ-TS-05 · sin huérfanos con el paso sin botón | **sin prueba** (W1) | M |
| 3.3 · nueve campos de fecha reentrantes | las mismas pruebas de RQ-TS-43 (`reentrancia.test.ts:92`, `invariantesGrafo.test.ts:137`) | C |
| RQ-TS-26 · 33 / 41 / 22 coinciden con el código | `packages/shared/src/cifrasAncladas.test.ts:58`, `:64`, `:70` (leen `openspec/config.yaml → cifras_ancladas`); §6 | C |
| RQ-TS-26 · `esperas` coherente con `Pendiente` | **sin prueba**; es lectura de la entrada `esperas` (W2) | M |
| RQ-TS-35 · re-liberación exige de nuevo y no hereda | `apps/desk/server/liberacionSinFactura.test.ts:97`, `:149` (verdes; el fichero no figura en el diff: S1) | C |
| RQ-TS-35 · la fecha prevista ya no es reentrante | `packages/shared/src/invariantesGrafo.test.ts:137-148`; `packages/shared/src/reentrancia.test.ts:92` | C |
| RQ-TS-35 · el cliente no bloquea ni prellena (re-liberación) | PERSONA (`.tsx` fuera de la red, F0-00) | — |
| RQ-AV-23 · vencida avisa al Director Comercial, sólo bandeja, con marca | `apps/desk/server/services/avisoFacturacionVencida.test.ts:46-55` (destinatario, `ticket_id`, `enviado_at` nulo, texto exacto, marca) | C |
| RQ-AV-23 · fecha no vencida no avisa | `apps/desk/server/services/avisoFacturacionVencida.test.ts:57-63` (día anterior y mismo día); `packages/shared/src/facturar.test.ts:67`; M8 | C |
| RQ-AV-23 · facturado no avisa | `apps/desk/server/services/avisoFacturacionVencida.test.ts:65-70` (otro estado `:72-76`, sin fecha `:78-82`) | C |
| RQ-AV-23 · dos pasadas, un aviso | `apps/desk/server/services/avisoFacturacionVencida.test.ts:86-93`; fecha nueva `:95-103`; carrera `:180-186`; M10b | C |
| RQ-AV-23 · sin Director Comercial, al área | `apps/desk/server/services/avisoFacturacionVencida.test.ts:106-111` | C |
| RQ-AV-23 · sin nadie, no marca y reintenta | `apps/desk/server/services/avisoFacturacionVencida.test.ts:113-123`; M11 | C |
| RQ-AV-23 · nunca mueve el ticket | `apps/desk/server/services/avisoFacturacionVencida.test.ts:126-132` | C |
| RQ-AV-23 · el sincronizador no pisa la marca | `packages/zoho-sync/src/db/repo.test.ts:559` (fuera de `TICKET_COLS` y de `PROMOTED_COLUMNS`); recuento de `ALTER` 67 en `packages/zoho-sync/src/db/migrate.test.ts:374-376`; M12 | C |
| RQ-AV-23 · una evaluación por día y no lanza | `apps/desk/server/services/avisoFacturacionVencida.test.ts:136-157` | C |
| Color de la tarjeta y columna del tablero | `packages/shared/src/columns.test.ts:46-47` (columna); color en `apps/desk/src/components/TicketCard.tsx:20` | PERSONA |

## 3. Alcanzabilidad de RQ-TS-05, medida (cierre transitivo sobre `TRANSITIONS`, script de sólo lectura fuera del repo)

`TRANSITIONS` 33, `ESTADOS_SERVICIO` 22. Desde `OV asignada`: **20**, no alcanza `Ticket creado` ni `Remisión creada`. Desde `Ticket creado` sólo por botones: **20**, no alcanza `OV asignada` ni `Remisión creada`. Sumando `TRANSICION_REMISION_CONFIRMADA`: **21**, no alcanza sólo `OV asignada`. `Pendiente de facturar` está entre los alcanzados. **El delta acierta en las tres cifras y en los no alcanzados**; lo que no existe es una prueba que las fije (W1).

## 4. Evidencia TDD

`apply-progress.md` no lleva una tabla «TDD Cycle Evidence» con columnas, sino tablas de rojo y verde por lote (W3, de forma). Contraste con la ejecución:
- Los ficheros que nombra existen y pasan hoy: `packages/shared/src/facturar.test.ts` (12 casos, como «12/12»), `apps/desk/server/facturar.test.ts` (13, como «13/13»), `apps/desk/server/services/avisoFacturacionVencida.test.ts` (15, como «15/15») y el bloque «las dos ramas de cierre» de `packages/shared/src/invariantesGrafo.test.ts:343-372` (4 pruebas, como «4/4»).
- Triangulación: seis casos de contenido en `apps/desk/server/facturar.test.ts:53-60`, tres posiciones de guarda `:85-100`, vencimiento con tres días en `packages/shared/src/facturar.test.ts:67-79`.
- **Excepción declarada al orden rojo-verde (W4):** las tres pruebas de «las dos capas, por separado» (`avisoFacturacionVencida.test.ts:161`, `:170`, `:180`) se escribieron después del código, por cuatro mutaciones supervivientes (M9, M9b, M10, M10b). `apply-progress.md` lo dice; su rojo es el de la mutación.
- Hallazgo del rojo de 1.8: una fecha imposible daba `500` antes de la guarda; la fija `apps/desk/server/facturar.test.ts:53-66`.

**Auditoría de aserciones:** sin tautologías ni bucles fantasma (los recorridos son `it.each` y listas literales). Los `not.toEqual([])` de `invariantesGrafo.test.ts:367-370` son la contraparte de `:358` (`toEqual([])`), no huérfanos. Capas: unidad (shared) y servidor con `supertest` y pg-mem; sin E2E (los `.tsx` están fuera de la red, F0-00). Cobertura de los ficheros cambiados: no medida.

## 5. Mutaciones reproducidas por mí (copia previa, restauración byte a byte, `git status --short` vacío tras cada una)

| # | Mutación | Resultado |
|---|---|---|
| M6 | un `422` con `erroresFacturar` insertado delante de la guarda de área, antes de `apps/desk/server/services/ticketService.ts:129` | rojo: 2 de 13 en `apps/desk/server/facturar.test.ts` (`:91` «expected 422 to be 403» y `:96`) |
| M10b | quitar la condición de marca (`facturacion_avisada_para IS NULL OR … <> $2`) del `UPDATE` de `apps/desk/server/services/avisoFacturacionVencida.ts:38-40` | rojo: 1 de 15 (`avisoFacturacionVencida.test.ts:180`, carrera «dos pasadas»); la prueba de extremo a extremo sola sigue verde, como declara `apply-progress.md` |
| M10 (extra) | quitar la condición de marca de la consulta `apps/desk/server/db/facturacionVencida.ts:19` | rojo: 1 de 15 (`avisoFacturacionVencida.test.ts:161`) |

Ninguna sobrevivió. M1 a M5, M7 a M9b, M11 y M12 las declara `apply-progress.md`; no las repetí (*hipótesis* de que cada una cae como allí se anota).

## 6. Cifras ancladas 33 / 22 / 41

`openspec/config.yaml → cifras_ancladas` (`:1329`): `pasos_del_mapa` 41 (`:1361`), `transiciones` 33 (`:1368`), `estados` 22 (`:1372`); `capabilities → transitions-st` (`:110`): «Las 33 transiciones y 22 estados». `packages/shared/src/cifrasAncladas.test.ts:24` declara `{ transiciones: 33, estados: 22, pasos_del_mapa: 41 }` y las pruebas `:58`, `:64`, `:70` las cruzan con `TRANSITIONS.length` (33, medido §3), `ESTADOS_SERVICIO.length` (22) y las aristas del mapa generado (41); pasan. Coherentes en los cuatro sitios.

## 7. Regla invariable 13 (tabla D7 contra el código)

- #1 botón sólo en `Pendiente de facturar`: `409` en `apps/desk/server/services/ticketService.ts:126-128`; prueba `apps/desk/server/facturar.test.ts:85`.
- #2 sólo Comercial: `403` de área en `apps/desk/server/services/ticketService.ts:129-130`; prueba `apps/desk/server/facturar.test.ts:70`; barrido en `apps/desk/server/permisos.test.ts`.
- #3 número y fecha obligatorios: presencia en `apps/desk/server/transitionExec.ts:77`; contenido con `erroresFacturar` (`errFacturar`) sumado al `422` agregado, todo en `apps/desk/server/services/ticketService.ts:134`, detrás de los de presencia (`plan.errors` va primero); pruebas `apps/desk/server/facturar.test.ts:53-66`, `:96`.
- #4 la fecha es una fecha: la misma guarda, `packages/shared/src/facturar.ts:29` (`esFechaCalendarioReal`); sin ella el servidor sólo recorta (`apps/desk/server/transitionExec.ts:33`).
- #5 (S-12, no prellenar): comodidad sin contrapartida; `apps/desk/src/components/TransitionPanel.tsx:33` con `seRegistraEnCadaFactura` (`packages/shared/src/facturar.ts:34-36`, probado en `packages/shared/src/facturar.test.ts:58`).
- #6 color y columna: presentación (`apps/desk/src/components/TicketCard.tsx:20`).

**Coincide con D7: ninguna decisión vive sólo en el cliente.**

## 8. Diseño, líneas y citas (regla de mutación 4)

Coherencia con `design.md`: D1 cumplido (estado, columna, fase y `facturar` en sus líneas; `facturar.ts` nuevo). D3 en `packages/shared/src/facturar.ts:23-31`. D6 en `apps/desk/server/db/facturacionVencida.ts:15-28` y `apps/desk/server/services/avisoFacturacionVencida.ts:29-81`: destinatarios, luego `UPDATE … RETURNING`, luego `crearAviso`, dentro de una `enTransaccion`; sin `dispararAvisos` (sólo bandeja). La pasada está en `apps/desk/server/index.ts:88`, detrás de `pasadaReclamaciones`. Migración: una `ALTER` sin calificar en `packages/zoho-sync/src/db/schema.sql:836`, al final.

`git diff --numstat 37817ef HEAD`: inserciones = borrados en `estados.ts` (2/2), `transitions.ts` (7/7), `reentrancia.ts` (1/1), `columns.ts`, `fasesBlueprint.ts`, `ticketService.ts` (3/3), `index.ts` del servidor (2/2), `TicketCard.tsx`, `TransitionPanel.tsx` (4/4) y `openspec/config.yaml` (9/9); `schema.sql` sólo crece al final (4/0). Nada se desplazó en esos ficheros y el detector da 0 bloqueos (§1). Las abreviadas no las barre el detector: *hipótesis* de que ninguna relevante se desplazó.

## 9. Cabecera R-1

`openspec/changes/facturar-dos-ramas/proposal.md:1-9`: siete campos (`tanda: F1C-02`, `motivo: ""`, `capacidad: [transitions-st, derivacion-avisos]`, `maestro` de tres, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`). Ninguna capacidad nueva (R-2 no aplica). El detector da 0 cabeceras inválidas.

## 10. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- W1 · **RQ-TS-05 sin prueba** (heredado): las cifras 20 / 20 / 21 son correctas (§3) pero ninguna prueba las fija; dos escenarios sin cobertura en tiempo de ejecución. Mismo hueco que el verify de F1C-01.
- W2 · **RQ-TS-26 «`esperas` coherente»** sin prueba, y la entrada `esperas` (`openspec/config.yaml:1330` y siguientes) conserva narración fechada del 2026-09-24 («`CLASIFICACION_EN_ESPERA` tiene 21 claves») que hoy no coincide con las 25 de `ESTADOS` (`packages/shared/src/estados.test.ts:15`). Es un registro fechado (caso B); este cambio no lo toca.
- W3 · `apply-progress.md` sin tabla «TDD Cycle Evidence» con columnas; el rojo está contrastado (§4). De forma.
- W4 · Tres pruebas de capas escritas después del código (§4); declarado. No hay rojo previo, sí el de la mutación.
- W5 · **Dos hallazgos prometidos a la bandeja que esta rama no escribe** (`docs/sdd` no cambia en el diff de la rama): (a) `facturado` y `facturado_cierre` (`packages/shared/src/transitions.ts:241-243`) escriben la misma «Fecha De Factura» sin guarda de contenido, y una fecha imposible daría `500` (*hipótesis*: lo midió el apply sobre «Facturar»; yo no lo probé en esas dos); (b) un punto y coma dentro de un comentario de `schema.sql` parte la sentencia y `migrate` la traga con un `console.error` (según `apply-progress.md`; *hipótesis*, no lo reproduje). Deben viajar como texto para Supervisión (R-3).

**SUGGESTION**
- S1 · `tasks.md` 1.7 menciona `liberacionSinFactura.test.ts` entre las pruebas editadas, pero no figura en el diff y pasa sin tocarlo (§2). Aclararlo en el archive.
- S2 · Ninguna prueba fija el eslabón de `apps/desk/server/index.ts:88` (el orden de la cadena); la pasada en sí sí está probada.
- S3 · Quedan «31» de comentario en `valoresDeTransicion.ts:10`, `bodegaje.ts:28`, `sla.ts:14` y `sla.test.ts:22` (E-246, declarado por el apply; *hipótesis*, no releídos).
- S4 · Los deltas llevan «— ROJO» en títulos de escenario; quitar al fusionar o conservar por convención, como en F1C-01.
- S5 · Cobertura de los ficheros cambiados no medida.

## 11. Tareas de personas (no se dan por hechas al archivar)

Pruebas en la app por Gerencia; publicar en producción y aplicar la migración al arrancar; pegar 33 / 22 / 41 en el maestro (P-3); comprobar a mano el panel «Facturar» y el aviso en la bandeja del Director Comercial. Las casillas 3.1 (este verify) y 3.2 (archive) de `tasks.md` siguen sin marcar, a propósito.
