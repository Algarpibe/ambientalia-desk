# Tareas: «Rechazo» desde Notificación cliente, sólo Comercial (F1C-10)

Cambio `rechazo-solo-comercial`, partida `0070ef1`. Un solo lote. Todo en sitio: ninguna línea citada se
desplaza (`design.md` D-1..D-4). Las pruebas nuevas van al final de sus ficheros.

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas del apply | ~210 (hipótesis, de `design.md` «Estimación») |
| Desglose | `transitions.ts` 2; `invariantesGrafo.test.ts` 8; `permisos.test.ts` ~57; `avisoArea.test.ts` ~15; mapa 6; `tasks.md` marcas; `apply-progress.md` ~100 |
| Medida real de partida | `git diff --shortstat --no-renames 0070ef1`: 0 líneas trackeadas modificadas (sólo hay carpeta de cambio sin trackear). No se pudo ejecutar `git` en esta fase (sin shell); la ejecuta `sdd-apply` al abrir y al cerrar el intento |
| Sin trackear de la carpeta del cambio | `wc -l` por lectura: `proposal.md` 103, `design.md` 104, `specs/permissions/spec.md` 95, `specs/transitions-st/spec.md` 210, `exploration.md` ~75, este `tasks.md` ~150; total ~740 (hipótesis para exploration) |
| Riesgo contra 800 | Bajo para el código; el intento de apply suma ~210 sobre lo ya hecho en fases previas del propio árbol, medido aparte por intento |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Preflight: `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd`. Una tanda SDD por árbol (regla del
ciclo 2). Al cerrar el intento: `git diff --shortstat --no-renames 0070ef1` más `wc -l` de lo nuevo sin
trackear, y registrar ESO.

### Suggested Work Units

| Unidad | Meta | PR | Prueba focal | Arnés real | Frontera de vuelta atrás |
|---|---|---|---|---|---|
| 1 | Catálogo + guardianes + mapa + specs | único (commit en `main`) | `npx vitest run apps/desk/server/permisos.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/services/avisoArea.test.ts apps/desk/server/mapaBlueprint.test.ts` | `403` escrito a mano con servidor de prueba (`permisos.test.ts`) | revertir el commit entero |

## Fase 1 · ROJO (strict TDD: nada de producción todavía)

- [x] 1.1 `apps/desk/server/permisos.test.ts:77`, `:80-81`: 54/39 → 55/38; comentarios `:26-27`, `:72-73`, `:338` (93 = 55/38; 24×2 + 7×1 = 55; mismos cortes de línea). Rojo esperado: la matriz de área da 54/39. (RQ-PM-03; escenarios PM-1, PM-4)
- [x] 1.2 `permisos.test.ts:349`, `:352-353`: compuesta sin cargo 55/38 → 56/37. Rojo esperado: da 55/38. (PM-5)
- [x] 1.3 `packages/shared/src/invariantesGrafo.test.ts:85` «ocho»→«siete», `:88` ejemplo `rechazo_comercial`, `:91` título «las siete compartidas», `:103` sustituida por el comentario de una línea de D-2. Rojo esperado: el literal de siete difiere del catálogo, que aún tiene ocho. (TS-07 «siete compartidas», TS-30 invariante 5)
- [x] 1.4 `permisos.test.ts`, tras `:384`: `describe('F1C-10 · rechazo_cliente sólo Comercial')`, tickets 96000+, resultado escrito a mano (D-5): Servicio Técnico → `403` en `rechazo_cliente` desde `Notificación cliente`, sin cambio de estado ni fila en `ticket_transitions`. Rojo esperado: responde `200`. (PM-6, TS-30 «Servicio Técnico no puede…»)
- [x] 1.5 Mismo `describe`: Comercial → `200` y el ticket pasa a `Por Facturar`; administrador → `200`; la traza registra el área `Comercial`. Verde ya hoy salvo la traza (rojo esperado: la traza guarda `Comercial / Servicio Técnico`). (PM-7, TS-30 «Comercial rechaza…»)
- [x] 1.6 Mismo `describe`: Servicio Técnico → `200` en `rechazo_comercial` (desde `Notificación Comercial`) y `rechazo_revision` (desde `Rev./Diagnostico`). Verde hoy; es el guardián de M-2. (PM-8)
- [x] 1.7 `permisos.test.ts`: afirmación de las tres áreas por id (`Comercial / Servicio Técnico`, `Comercial`, `Comercial / Servicio Técnico`) y destinos `Por Facturar`. Rojo esperado: la de `rechazo_cliente`. (TS-30 «el catálogo declara las tres Rechazo»)
- [x] 1.8 `permisos.test.ts`: afirmar que el barrido de cargo sigue en 744 y la única diferencia cargo/área (`liberacion_sin_factura`) sin cambio; comprobar las existentes `:341-347`, `:356-369`, sin editar si ya lo afirman. Verde. (PM-3, TS-30 «744»; PM-9 se cubre en 1.1)
- [x] 1.9 `apps/desk/server/services/avisoArea.test.ts`, tras `:97`: `areasSiguientes('Notificación cliente').sort()` = `['Comercial','Compras']` y `areasAAvisar('Notificación cliente', ['Comercial'])` = `['Compras']` (D-6; S-1). Rojo esperado: incluyen `Servicio Técnico`. (TS-31 los tres escenarios)
- [x] 1.10 Correr `npx vitest run` sobre los cuatro ficheros y anotar en `apply-progress.md` cada rojo con su mensaje. Debe fallar exactamente: 1.1, 1.2, 1.3, 1.4, 1.5 (traza), 1.7, 1.9.

## Fase 2 · VERDE

- [x] 2.1 `packages/shared/src/transitions.ts:236`: `area: 'Comercial / Servicio Técnico'` → `area: 'Comercial'`; una cadena, sin mover líneas (D-1). `:234` y `:238` intactas.
- [x] 2.2 Correr los cuatro ficheros: todo verde salvo `mapaBlueprint.test.ts` (anti-desfase, rojo natural por las tres aristas de los `.md`). Anotarlo.
- [x] 2.3 `npm run generar-mapa-blueprint`. `git diff --stat docs/artefactos` debe tocar exactamente tres líneas en tres ficheros: `blueprint-completo.md:54`, `blueprint-fase-2-diagnostico.md:44`, `blueprint-fase-3-cierre.md:22`, de `[C][ST]` a `[C]`; `blueprint-fase-1-entrada.md` sin cambio. (TS-30 «el mapa regenerado»)
- [x] 2.4 Re-correr el anti-desfase: verde. Sin tocar `blueprintserviciotecnico.html` ni ningún `.tsx` (regla 13 ya cumplida, `design.md` «Regla 13»).
- [x] 2.5 Escenarios de hecho sin código nuevo: RQ-TS-30 «invariante 6 no cambia» (diez reentrantes, `invariantesGrafo.test.ts` sin editar) y «traza histórica conserva su área» (`ticketService.ts:155` sin tocar; se afirma por lectura en `apply-progress.md`). RQ-TS-23 y PM-10 «retiradas»: las pruebas existentes de 31 entradas y de ids retiradas siguen verdes.

## Fase 3 · Mutaciones (reproducir, anotar el rojo, revertir)

- [x] 3.1 M-1: devolver `:236` a `Comercial / Servicio Técnico`. Rojo en `:80-81`, `:352-353`, invariante 5, `403` nuevo, `areasSiguientes`/`areasAAvisar`, anti-desfase (`mapaBlueprint.test.ts:154-…`). Revertir. (PM-11, TS-30 mutación 1, TS-31 mutación)
- [x] 3.2 M-2: `Comercial` en `:234`, revertir; luego en `:238`, revertir. Rojo en invariante 5 (seis), cifras y el `200` de Servicio Técnico de 1.6. (TS-30 mutación 2)
- [x] 3.3 M-3: escribir `[C][ST]` a mano en cada una de las tres aristas de los `.md`, una por vez. Anti-desfase rojo en cada fichero. Revertir regenerando y comprobar `git diff` vacío contra 2.3.
- [x] 3.4 M-4: restaurar la entrada de `rechazo_cliente` en el literal de `invariantesGrafo.test.ts:103`. Rojo en invariante 5. Revertir.
- [x] 3.5 Tras revertir todo: `git diff` idéntico al de 2.3 más 1.x; suite verde. Regla de mutación 1 (posición): no aplica, no se mueve ninguna guarda.

## Fase 4 · Barrido de citas (regla de mutación 4) y detector

- [x] 4.1 Completas, fuera de `openspec/changes/archive/**`: `grep -rnoE "(transitions|invariantesGrafo\.test|permisos\.test|avisoArea\.test)\.ts:[0-9]+(-[0-9]+)?"` y `blueprint-(completo|fase-[123]-[a-z]+)\.md:[0-9]+`. Comprobar CADA resultado contra el fichero, inicio y final por separado y leyendo lo que afirma.
- [x] 4.2 Abreviadas (`:NNN`) en los ficheros que ya citan esos módulos, y forma corta de specs: `RQ-TS-07`, `RQ-PM-03`, «ocho compartidas», `54/39`, `55/38`. Casos: A (presente, se corrige vía delta), B (fechadas: `transitions-st/spec.md:1545`, `archive/**`, `docs/sdd/Estado_As-Built_2026-09-09.md`, no se tocan), C (ninguno esperado).
- [x] 4.3 `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0 bloqueantes. Anotar el informe y el barrido en `apply-progress.md`.

## Fase 5 · Verificación completa

- [x] 5.1 `npm test` verde (anotar recuento).
- [x] 5.2 `npm run typecheck` verde.
- [x] 5.3 `npm run lint`: sin superar el techo de 165 avisos (medir antes y después).
- [x] 5.4 `npm run build` verde.
- [x] 5.5 `apply-progress.md`: rojos, verdes, mutaciones M-1..M-4, barrido, medida del ledger (`git diff --shortstat --no-renames 0070ef1` + `wc -l` de lo nuevo) y marcar todas las casillas de este fichero. Sin commit en esta fase.

## Fase 6 · Cierre para el archive (a mano, caso B, sin renumerar)

- [x] 6.1 En `openspec/specs/transitions-st/spec.md`, fila 5 de la tabla de invariantes (`:63`): «Las ocho transiciones compartidas…» pasa a siete, con `(Previously: ocho, hasta F1C-10)`, sin desplazar líneas. (Notas de fusión, RQ-TS-07)
- [x] 6.2 Mismo fichero, escenario «los invariantes 5 y 6 no cambian» (`:1627-1630`): conservar con revisión nombrada («en F1C-09, siguen en ocho compartidas y diez campos reentrantes») y añadir que RQ-TS-30 los lleva a siete. `:1545` y `archive/**` no se tocan.
- [ ] 6.3 Tras la fusión de los dos deltas con `sdd-archive`, repetir 4.1-4.3 sobre las specs vivas.

## Fuera del recuento (regla del ciclo 1): tareas de persona

Archivar **no** las da por hechas.

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Verificación en la app tras desplegar: un usuario sólo de Servicio Técnico no ve «Rechazo» en un ticket en Notificación cliente; Comercial sí; las otras dos «Rechazo» siguen visibles para Servicio Técnico; la campana de Servicio Técnico no avisa al entrar en Notificación cliente | quien despliega / Gerencia | `ambientalia-desk.ambientalia.cloud` | `archive-report.md` (sección de personas) |

## Matriz de cobertura: escenario → tarea

Abreviaturas: PM = `permissions` (RQ-PM-03, 10 escenarios en orden del delta); TS = `transitions-st`.

| Escenario | Tareas |
|---|---|
| PM-1 la matriz de área tiene 93 casos | 1.1, 2.1 |
| PM-2 prohibición por área | 1.1 (matriz); prueba existente verde |
| PM-3 exactamente un caso difiere | 1.8 |
| PM-4 siete compartidas (24×2+7=55) | 1.1, 1.3 |
| PM-5 compuesta 56/37 | 1.2, 2.1 |
| PM-6 Servicio Técnico `403` en `rechazo_cliente` | 1.4, 2.1 |
| PM-7 Comercial y administrador `200` | 1.5 |
| PM-8 las otras dos Rechazo admiten a Servicio Técnico | 1.6, 3.2 |
| PM-9 una retirada sin fila de matriz | 2.5 (prueba existente), 1.1 |
| PM-10 mutación `rechazo_cliente` en matriz | 3.1 |
| TS-07 la matriz tiene 93 casos | 1.1 |
| TS-07 prohibición por área | prueba existente, 2.2 |
| TS-07 el administrador ejecuta las 31 | prueba existente `permisos.test.ts:89-109`, 2.2 |
| TS-07 hay siete compartidas | 1.3, 2.1 |
| TS-23 31 entradas, ninguna retirada | 2.5 |
| TS-23 id retirada rechazada, no escribe | 2.5 |
| TS-23 ticket en `Pendiente` sin transiciones | 2.5 |
| TS-23 mutación reponer una retirada | 2.5 (sin reproducir; sin cambio en esta tanda) |
| TS-23 retirar no movió el emparejamiento (rev. F1C-09) | 6.1, 6.2 (caso B, texto fechado) |
| TS-30 catálogo declara las tres Rechazo | 1.7, 2.1 |
| TS-30 Servicio Técnico no puede rechazar | 1.4 |
| TS-30 Comercial rechaza | 1.5 |
| TS-30 invariante 5 fija siete | 1.3, 3.4 |
| TS-30 invariante 6 no cambia | 2.5 |
| TS-30 barrido de cargo 744 | 1.8 |
| TS-30 mapa regenerado en `[C]` | 2.3, 2.4, 3.3 |
| TS-30 traza histórica conserva su área | 2.5 |
| TS-30 mutación devolver `rechazo_cliente` | 3.1 |
| TS-30 mutación otra Rechazo | 3.2 |
| TS-31 áreas siguientes Comercial y Compras | 1.9 |
| TS-31 Servicio Técnico no recibe aviso | 1.9 |
| TS-31 mutación devolver la arista | 3.1 |

Total: 32 escenarios (10 + 22), 5 requisitos (RQ-PM-03, RQ-TS-07, RQ-TS-23, RQ-TS-30, RQ-TS-31).
