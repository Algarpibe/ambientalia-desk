# Verify report — `blueprint-equipo-nuevo` (F1B-06, primer cambio, `cierra: no`)

**Fase:** `sdd-verify` · **Modo:** Strict TDD · **Árbol verificado:** HEAD = `230d433` (limpio, sin
staged/unstaged fuera de 4 ficheros `docs/sdd/*` sin trackear, previos a este cambio). Entradas:
`proposal.md`, `design.md`, `tasks.md` (94/94), `apply-progress.md` (Lote 1 + Lote 2), los cuatro
`specs/` de la carpeta. Regla de método: toda afirmación de código lleva ruta y línea; se verificó
por lectura directa, no sólo por lo que dice `apply-progress.md`.

## Veredicto: PASS WITH WARNINGS — 0 CRITICAL, 4 WARNING, 2 SUGGESTION

Ningún hallazgo bloquea el archivado de este `cierra: no`. Las advertencias son o bien ya declaradas
y resueltas por el orquestador, o informativas por diseño del propio detector de citas.

## 1 · Comandos ejecutados por esta fase (salida real)

| Comando | Exit | Recuento |
|---|---|---|
| `npm test` | 0 | 143 ficheros pasados, 1 omitido por diseño (`migrate.integration.test.ts`, Postgres real); 1442 pruebas en verde, 2 omitidas — igual a `apply-progress.md:353-354` |
| `npm run typecheck` | 0 | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin salida |
| `npm run lint` | 0 | 0 errores, 165 warnings (`@typescript-eslint/no-explicit-any`, todos preexistentes en `packages/zoho-sync/src/db/*`, `sweep/*`; ninguno en ficheros tocados por este cambio) |
| `npm run build` | 0 | `tsc -b && vite build`, 112 módulos, sin error |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` (re-ejecutado por esta fase) | 0 | 2346 comprobadas, 0 bloqueantes, 15 abreviadas rotas (informativas) — mismo recuento que reporta el orquestador para `6f31ae0` |

Los cuatro comandos y el detector citan exactamente los mismos recuentos que `apply-progress.md`
(Lote 1: `:96-102`; Lote 2: `:353-359`) y que el encargo del orquestador. Ninguna divergencia entre
lo reportado y lo re-ejecutado.

## 2 · Tareas — 94/94, ninguna de persona colada en el recuento

`grep -c '^\s*- \[x\]' tasks.md` da 94; `grep -c '^\s*- \[ \]'` da 0. Incluye 5.7, 13.7 y 14.8
(orquestador, cerradas por `230d433`). Las tres «Comprobaciones de persona» (Persona-1/2/3,
`tasks.md:411-421`) están correctamente fuera del recuento de 94 (regla del ciclo 1 de `CLAUDE.md`)
y siguen sin ejecutarse — no las da por hechas este verify, quedan para la app.

## 3 · Matriz de cumplimiento — 11 requisitos, 17 escenarios, los 17 con prueba en verde

| Requisito | Escenarios | Evidencia de código (verificada por lectura directa) | Evidencia de prueba (ejecutada, en verde) |
|---|---|---|---|
| RQ-EN-01 (catálogo separado, 5×5) | 2/2 ✅ | `transitions.ts:350-361` (5 entradas, área única, 2 campos cada una) | `invariantesGrafo.test.ts` 14/14 (bloque unión de catálogos) |
| RQ-EN-02 (área Servicio Técnico, 403 a Comercial) | 1/1 ✅ | `transitions.ts:351-360` (`area: 'Servicio Técnico'` en las 5) | `flujoEquipoNuevo.test.ts` P6 (bucle 5/5, 403); `permisos.test.ts` matriz 5×3, 20/20 |
| RQ-EN-03 (entrada por `habilitar_servicio` compartido) | 1/1 ✅ | `flujos.ts` no declara transición de entrada propia; `transitions.ts:178` sin cambio | `flujoEquipoNuevo.test.ts` P4 (200, `Ticket creado` a `Ingresado`) |
| RQ-EN-04 (routing por clasificación+estado, heredados s5) | 2/2 ✅ | `flujos.ts:56-61` (`flujoDelTicket`, exige clasificación normalizada y estado en catálogo EN) | `flujos.test.ts` 25/25 (incl. heredado `Rev./Diagnostico` a servicio); `flujoEquipoNuevo.test.ts` P5 |
| RQ-EN-05 (409 guarda 3, posición A<B) | 2/2 ✅ | `ticketService.ts:125` (segunda sentencia, misma línea, tras el 404) llama `exigirMismoFlujo` (`:231-234`) | `flujoEquipoNuevo.test.ts` P1/P2/P3, M1 (posición) y M2 (ausencia) confirmados rojo por separado |
| RQ-EN-06 (filtro por flujo: panel/avisos/SLA) | 1/1 ✅ | `TransitionPanel.tsx:56` (`transicionesDelTicket`); `ticketService.ts:196` (catálogo del estado de llegada); `db/sla.ts:49` (`continue` si flujo≠servicio) | `avisoArea.test.ts` 8/8 (catálogo sintético); `db/sla.test.ts` 8/8; `npm run typecheck` verde para los `.tsx` |
| RQ-EN-07 (`Verificación`: sin_clasificar, 2 campos, Otros) | 1/1 ✅ | `estados.ts:105` (`'Verificación': 'sin_clasificar'`); `transitions.ts:357-358` (2 campos) | `estados.test.ts` 12/12; `flujos.test.ts` (`columnForStatus('Verificación') === 'otros'`) |
| RQ-TC-10 (dos de tres ramas con grafo) | 2/2 ✅ | `flujos.ts` enruta `Equipo nuevo` a catálogo propio, `Soporte remoto` siempre a servicio | `flujoEquipoNuevo.test.ts` P1; `flujos.test.ts` (corrección a, Soporte remoto) |
| RQ-TS-06 (orden 9 filas, guarda 3 en B) | 2/2 ✅ | `ticketService.ts:122-152` (orden A·A·B·B·B·C·C·C·D, verificado línea por línea) | Misma suite que RQ-EN-05; `permisos.test.ts:29-33` (comentario de tres guardas, corregido Fase 12) |
| RQ-TS-15 (SLA excluye flujo≠servicio) | 2/2 ✅ | `db/sla.ts:2,45,48,49` (import, columna `classification`, tipo, `continue`) | `db/sla.test.ts` 8/8, incl. M8 (quitar el `continue`) confirmado rojo |
| RQ-AV-04 (`areasSiguientes` sobre catálogo del ticket) | 1/1 ✅ | `transitions.ts:327` (`transiciones: readonly Transition[] = TRANSITIONS`); `avisoArea.ts:15-16`; `ticketService.ts:196` | `avisoArea.test.ts` (catálogo sintético `Compras` distinto de `Servicio Técnico`, RED a GREEN confirmado) |

17/17 escenarios con prueba que pasa en tiempo de ejecución. Ninguna spec scenario queda cubierta
sólo por lectura estática — la regla del skill (compliant only when a covering test passed at
runtime) se cumple en las 17.

## 4 · Regla invariable 13 — los dos `.tsx` tocados

| Decisión del cliente | Línea del servidor que la impone | Punto 3 (espejo probado) |
|---|---|---|
| `TransitionPanel.tsx:56` ofrece sólo las transiciones del flujo del ticket | `ticketService.ts:125` (guarda 3, `exigirMismoFlujo`) | ✅ probado en `flujoEquipoNuevo.test.ts` P1-P3 |
| `TransitionPanel.tsx:56` filtra además por estado actual (`from`) | `ticketService.ts:126-128` | ✅ preexistente, sin cambio de este lote |
| `TransitionPanel.tsx:57` filtra por área del usuario | `ticketService.ts:129-131` | ✅ preexistente, sin cambio de este lote |
| `TicketDetailView.tsx:324` pasa `clasificacion` al panel | Ninguna decisión propia — sólo transporta el dato que `ticketService.ts:196` ya usa para calcular avisos | N/A (transporte, no decisión) |

Ninguna decisión nueva del cliente queda sin línea del servidor. M14 (Fase 9.6) queda correctamente
declarada no detectable — `.tsx` fuera de `vitest.config.ts:17-20` por F0-00 — y cubierta por la
guarda 3, no por un arnés de interfaz que la propia Gerencia decidió no construir.

## 5 · Cumplimiento TDD (Strict TDD, `strict-tdd-verify.md`)

| Check | Resultado | Detalle |
|---|---|---|
| TDD Evidence reportado | ✅ | Tablas RED/GREEN/TRIANGULATE en `apply-progress.md` Lote 1 y Lote 2 |
| Todas las tareas con test | ✅ | 94/94; sólo 9.1-9.6 (`.tsx`) sin RED/GREEN automático, por F0-00, declarado |
| RED confirmado (ficheros existen) | ✅ | `flujos.test.ts`, `flujoEquipoNuevo.test.ts` verificados por lectura directa (Sección 3) |
| GREEN confirmado (pasan hoy) | ✅ | 1442/1442 en la ejecución real de esta fase |
| Triangulación | ✅ | `flujos.test.ts` 25 casos; matriz 5×3 en `permisos.test.ts`; ver WARNING-1 |
| Red de seguridad en ficheros modificados | ✅ | Todas las suites tocadas tenían baseline verde antes de mutar (documentado por fase en `apply-progress.md`) |

TDD Compliance: 6/6 checks pasados.

### Distribución por capa
| Capa | Pruebas nuevas | Ficheros | Arnés |
|---|---|---|---|
| Unit (dominio puro) | 32 (Lote 1) + 6 (Lote 2: reentrancia/sla/avisoArea) = 38 | `packages/shared/src/*` | Ninguno (funciones puras) |
| Integración HTTP | 6 (`flujoEquipoNuevo.test.ts`) + 3 (`transicionesEjecucion.test.ts`) + 5 (`permisos.test.ts`) = 14 | `apps/desk/server/*` | `appHarness.ts` (pg-mem, sin Zoho real) |
| Integración DB directa | 1 (`db/sla.test.ts`) | `apps/desk/server/db` | pg-mem + `migrate()` |
| Total pruebas nuevas | 53 | — | — |

### Auditoría de calidad de aserciones
Revisados por lectura directa: `flujoEquipoNuevo.test.ts` (completo), `flujos.test.ts` (primeras 60
líneas + patrón repetido), bloque nuevo de `permisos.test.ts` (matriz 5×3, líneas 209-265). Ningún
patrón vetado: sin tautologías, sin bucles-fantasma (los bucles de P6 y de la matriz recorren
`TRANSITIONS_EQUIPO_NUEVO`, 5 entradas conocidas, nunca vacío), cada `it` llama código de producción
real vía `request(app)` o una función pura, con valores esperados distintos entre casos (200/403/409,
no sólo huecos). Assertion quality: sin hallazgos.

### Métricas de calidad
Linter: 0 errores nuevos (165 warnings preexistentes, ninguno en ficheros de este cambio).
Type Checker: 0 errores.
Coverage: no ejecutado en esta fase (`npm run test:coverage` existe pero el encargo del orquestador
acotó los cuatro comandos de la Sección 1; no es bloqueante — regla del skill: coverage es
informativo, nunca crítico —, y la evidencia RED/GREEN por tarea de `apply-progress.md` es señal más
fuerte que un porcentaje de líneas para este dominio).

## 6 · Hallazgos

### WARNING

1. M9 no lo detecta la matriz nueva de `permisos.test.ts` (declarado por la propia fase de apply,
   `apply-progress.md:499-507`). El total 10/5 escrito a mano deriva de `t.area` dinámicamente y no
   distingue identidad de área. La red global SÍ detecta la mutación (`flujoEquipoNuevo.test.ts` P6 +
   `invariantesGrafo.test.ts` corrección b), así que no hay comportamiento sin probar — sólo
   triangulación subóptima en un fichero. Sin acción requerida para este cambio.
2. Cita informal no reconocida por el detector: `tasks.md:75` usa «líneas de `44ce003`» en vez de
   «en `44ce003`» para anclar una cita histórica (Caso B). El detector de citas (`cosecha.ts:60`) sólo
   reconoce el conector «en», así que la marca como abreviada rota informativa — confirmado en la
   re-ejecución de esta fase (Sección 1). No bloquea (`cli.ts` la clasifica como informativa) y no
   afecta a ningún requisito de esta spec; es una imprecisión de redacción, no de contenido — la línea
   `44ce003:71` sí decía lo que la tarea afirma en su momento.
3. Tres citas caducadas por el import nuevo de la Fase 7, ya repartidas entre Caso A y Caso B
   (`apply-progress.md:464-469`): `derivacion-avisos/spec.md:119,139` y
   `transitions-st/spec.md:474,733,743` se desplazaron +1 por el import de
   `avisoArea.test.ts:2`/`sla.test.ts:5`; el orquestador ya las remidió tras el reset y confirmó Caso A
   (dos) y Caso B anclado en `3b7d89c` (una, `Paquete_de_Despliegue_2026-09-10.md:321`). Verificado
   presente en el estado actual de `apply-progress.md` — no queda pendiente para esta fase.
4. Imprecisión preexistente en `ticketService.ts:123-125` (citada por `transitions-st/spec.md:33,975`
   y `derivacion-avisos/spec.md:212`): el rango cubre hoy sólo «transición existe» + «ticket existe»,
   no el permiso ni la llamada a n8n. Ya señalada por `design.md` D3 antes de este lote; no la
   introdujo este cambio. Corregirla es trabajo de fusión de delta en `sdd-archive`, no de este verify.

### SUGGESTION

1. `npm run test:coverage` no se ejecutó en esta fase (ver Sección 5) — si una fase futura quiere el
   dato por fichero, está disponible sin cambios de configuración.
2. La condición de despliegue («este cambio NO se despliega a producción sin F1A-03», `tasks.md:56-67`)
   sigue vigente: `Verificación` no tiene transición de salida en el catálogo `equipo-nuevo` hasta esa
   tanda siguiente. No es un defecto de este cambio — es el supuesto s4 declarado desde `proposal.md` —
   pero debe repetirse literalmente en el `archive-report.md`, como ya pide `tasks.md` sección Archive.

## 7 · Diseño — desviaciones, todas declaradas

- D3 (guarda 3 inline vs. función nombrada): el orquestador movió `exigirMismoFlujo` a una función al
  final de `ticketService.ts` en vez de la sentencia inline que decía `design.md` D3. Verificado: cero
  citas desplazadas (`:125` sigue siendo el 404; la función nueva va tras la `:223` original).
- `readonly Transition[]` en `areasSiguientes`/`areasAAvisar` en vez de `Transition[]`: exigido por
  `tsc` porque `catalogoDelTicket` devuelve `readonly`. Sin impacto de comportamiento.
- Ninguna desviación rompe un escenario de spec ni un invariante de `transitions-st`/`derivacion-avisos`.

## 8 · Comprobaciones de persona — repetidas, no dadas por hechas

| # | Comprobación | Dueño |
|---|---|---|
| Persona-1 | Ticket `Equipo nuevo` en `Ingresado` sólo ve «Ingreso equipo nuevo» | Servicio Técnico, en la app |
| Persona-2 | Ticket en `Verificación` cae en columna «Otros» | Servicio Técnico, en la app |
| Persona-3 | El 409 de la guarda 3 se entiende sin explicación | Servicio Técnico, en la app |

Regla del ciclo 1: no son casillas contables, no cuentan en el 94/94, y este verify no las certifica.

## Conclusión

0 CRITICAL. Los 11 requisitos y 17 escenarios de las 4 specs tienen prueba en verde ejecutada por esta
misma fase, no sólo reportada. Los 4 comandos exigidos por el encargo terminan en verde con recuentos
idénticos a `apply-progress.md`. Regla invariable 13 satisfecha en los dos `.tsx`. Único punto que el
archive tiene que repetir explícitamente: la condición de despliegue ligada a F1A-03.
