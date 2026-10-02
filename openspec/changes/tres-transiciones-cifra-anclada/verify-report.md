# Verify report: tres-transiciones-cifra-anclada (F1C-09, `cierra: si`)

Modo: hybrid, strict TDD (`npm test`). Partida `fd253aa`; lote A `ad1aaa0`; lote B `42f591e`. Verificado en el
worktree `C:\dev\Desk_2_R1.023-worktrees\tres-transiciones-cifra-anclada` sobre HEAD `42f591e`, árbol limpio al empezar.

## Veredicto: PASS WITH WARNINGS

0 CRITICAL · 4 WARNING · 3 SUGGESTION. Nada bloquea el archive.

## Completitud

Tareas: 1.1-10.4 todas `[x]`. Las cuatro tareas de persona (P-1, recuento previo, ejecutar el script, verificación
en la app) están fuera del recuento por la regla del ciclo 1 y **NO están hechas**: archivar no las da por hechas.
Artefactos presentes: proposal, exploration, 5 deltas, design, tasks, apply-progress.

Conteo de los deltas (recontado con `grep`, no copiado): **22 requisitos y 68 escenarios**
(transitions-st 14/39, transitions-soporte-remoto 3/12, mapa-blueprint 2/7, derivacion-avisos 2/5, permissions 1/5).
Coincide con la matriz de `tasks.md` (68/68).

## Evidencia de ejecución (hecha por este verify, no copiada)

| Comando | Salida | Exit |
|---|---|---|
| `npm test` | 170 ficheros pasan, 1 saltado (`migrate.integration`, requiere base real); **2416 verdes, 2 saltadas**, 0 rojas | 0 |
| `npm run typecheck` | `tsc -b` + servidor, limpio | 0 |
| `npm run lint` | 165 avisos, 0 errores (techo 165, sin subir) | 0 |
| `npm run build` | cliente construido | 0 |
| `npm run generar-mapa-blueprint` | reescribe 4 ficheros y `git status` queda **limpio**: el mapa commiteado coincide con el generador | 0 |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 4.502 comprobadas, 0 bloqueantes, 0 cabeceras inválidas, 11 abreviadas rotas informativas (las 11 previas) | 0 |

Hash de salida de test/build: no se calculó (ver SUGGESTION 3).

## Comprobaciones directas contra el código

| Punto pedido | Evidencia | Resultado |
|---|---|---|
| `TRANSITIONS` = 31 | invariante 2 de `invariantesGrafo.test.ts` y `cifrasAncladas.test.ts` verdes | OK |
| Ids retiradas | `marcar_pendiente`, `servicio_externo_pendiente`, `servicio_externo_notificado` ya no son entradas: `transitions.ts:206-207` y `:230-233` son comentarios; sólo se nombran en comentarios (`:386`, caso C) | OK |
| 400 para las tres ids | `transicionesEjecucion.test.ts`, «las tres ids retiradas dan 400 «Transición desconocida»»: verde (y rojo bajo la mutación M1) | OK |
| `diagnostico_complementario` | `transitions.ts:244` con origen En Proceso, destino `Continuación del proceso` | OK |
| `Pendiente` sólo en SR | `estados.ts:182` lista `Solicitud Soporte` y `Pendiente`; `ESTADOS_SERVICIO` = 20 (guardián verde) | OK |
| «Finalizado» único terminal | invariante 3 de `invariantesGrafo.test.ts` verde | OK |
| `cifras_ancladas` | `config.yaml:1361` pasos «35», `:1368` transiciones «31», `:1372` estados «20»; `cifrasAncladas.test.ts` lee el fichero vigilado (3 pruebas, triple coincidencia registro-literal-código) | OK |
| Mapa | 35 aristas, ninguna toca `Pendiente` (prueba nueva de `mapaBlueprint.test.ts`); anti-desfase verde | OK |
| Permisos | 93 = 54/39 y 55/38, 744 casos (`permisos.test.ts`, `cargoPermiso.test.ts`) verdes | OK |
| TS-29 | `Grep` de `Migracion_Pendiente_a_En_Proceso` en `apps/` y `packages/`: sólo `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts` | OK |
| Script calificado | toda tabla tras `FROM/INTO/UPDATE` es `desk.*` (caso d, con guarda contra bucle fantasma `>= 6`); sin `status_type`, sin `managed_by_app` en el `SET`, sin metacomandos de psql | OK |

## Mutaciones reproducidas por este verify (revertidas, `git status` limpio tras cada una)

| # | Mutación | Resultado observado |
|---|---|---|
| M1 | Lote A: reponer `marcar_pendiente` (origen En Proceso, destino Pendiente) sustituyendo los dos comentarios de `transitions.ts:206-207` | **28 rojos en 7 ficheros**: invariantes 1 y 2, unión de 41, `ESTADOS_SOLO_SOPORTE_REMOTO`, «ninguna de las tres ids retiradas sigue», 4 de `transicionesEjecucion` (huérfanas, extremos, barrido 31, 400), `cifrasAncladas` (transiciones y pasos), 5 de `mapaBlueprint` incl. anti-desfase, `cargos.test.ts` |
| M2 | Script: UPDATE antes del INSERT (los dos bloques intercambiados dentro de `BEGIN…COMMIT`) | **3 rojos**: caso (a) sin filas marcador, (c) reversión, (f) orden estático; 4 verdes |

Tras revertir ambas: `git status --short` vacío; la prueba del script vuelve a 7/7. Las demás mutaciones del
`apply-progress` (3.2-3.6, 7.1, 7.2) no se repitieron; M1 ejercita la mayoría de los mismos guardianes.

## TDD (strict)

| Check | Resultado | Detalle |
|---|---|---|
| Tabla de evidencia TDD en apply-progress | OK | dos tablas (lote A y B), con RED/GREEN/TRIANGULATE/REFACTOR |
| Pruebas existen | OK | `cifrasAncladas.test.ts` y `migracionPendienteF1C09.test.ts` (nuevos) y los 15 ficheros ajustados |
| RED confirmado | OK | lote A: 30 rojos antes de tocar `transitions.ts` (anotados por fichero); lote B: 7/7 rojas por `ENOENT` |
| GREEN | OK | verde en la suite completa que corrí hoy |
| Triangulación | OK | tres cifras, tres ids retiradas, cinco tickets en tres grupos + control, segunda ejecución, reversión |
| Safety net | OK | suite completa antes de cada lote (según apply-progress; no verificable a posteriori) |

Pruebas sin rojo previo, investigadas por el propio apply: `fechasDerivadas.test.ts:82` (sólo mensaje), `flujos.test.ts`
y P5 (reapuntados a una id con el mismo origen); su rojo se prueba en 3.6.

**Calidad de aserciones**: sin tautologías ni bucles fantasma. El bucle de la prueba (d) del script lleva guarda de
mínimo `>= 6`; el barrido de `transicionesEjecucion` lleva su guarda de huérfanas. La atomicidad se prueba por
lectura estática (caso f), que el spec admite. Capas: pruebas unitarias y de servidor (vitest, pg-mem); no hay
pruebas de interfaz por decisión de Gerencia (F0-00). Cobertura por línea: no se midió (no hay herramienta).

## Cumplimiento de escenarios (68)

Los 68 escenarios tienen una prueba que los cubre y que **pasó hoy**:

| Requisito | Esc. | Prueba que lo cubre | Estado |
|---|---|---|---|
| RQ-TS-23 retiradas | 4 | `invariantesGrafo` (ids ausentes, 31), `transicionesEjecucion` (400, huérfanas) | COMPLIANT |
| RQ-TS-24 `diagnostico_complementario` | 4 | `invariantesGrafo` (origen), `transicionesEjecucion` (extremos), `flujoSoporteRemoto` P5 | COMPLIANT |
| RQ-TS-25 `Pendiente` sólo SR | 4 | `estados.test.ts`, invariante 1, `fasesBlueprint.test.ts` | COMPLIANT |
| RQ-TS-26 cifra anclada | 2 | `cifrasAncladas.test.ts` | COMPLIANT |
| RQ-TS-27 guardianes | 2 | las 15 pruebas ajustadas | COMPLIANT |
| RQ-TS-28 script | 6 | `migracionPendienteF1C09.test.ts` casos a-f | COMPLIANT (atomicidad por lectura estática; ver WARNING 1, 3 y 4) |
| RQ-TS-29 no se invoca | 1 | `Grep` TS-29 (ejecutado por mí) | COMPLIANT |
| RQ-TS-01/04/05/07/11/12/20 | 2+2+2+3+2+1+4 | `invariantesGrafo`, `estados`, `permisos`, `transicionesEjecucion`, `prioridad`, `reentrancia` | COMPLIANT |
| RQ-AV-01/02 | 2+3 | `reentrancia`, `prioridad`, `transitionsSoporteRemoto`, comentario `transitions.ts:289-290` | COMPLIANT |
| RQ-PM-03 | 5 | `permisos.test.ts`, `cargoPermiso.test.ts` (93 casos; 744) | COMPLIANT |
| RQ-MB-07/02 | 4+3 | `mapaBlueprint.test.ts`, `fasesBlueprint.test.ts`, anti-desfase | COMPLIANT |
| RQ-SR-12/05/06 | 3+6+3 | `invariantesGrafo`, `estados`, `transitionsSoporteRemoto`, `flujoSoporteRemoto`, `flujos` | COMPLIANT |

Escenarios sin prueba que pase: **0**. (El mapeo escenario-prueba por requisito sale de `tasks.md` y de los nombres
de las pruebas que corrí; no se auditó cada uno de los 68 por separado.)

## Coherencia con el diseño (D1–D9)

| Decisión | Se siguió | Nota |
|---|---|---|
| D1 comentarios de relleno, sin mover líneas | Sí | M1 sustituyó las dos líneas sin desplazar nada |
| D2 `Pendiente` tras `Solicitud Soporte` en la misma línea | Sí | `estados.ts:182` |
| D3 `fasesBlueprint.ts:57` comentario | Sí | typecheck verde; la mutación 3.3 la fija |
| D4 mapa regenerado | Sí | confirmado por mi regeneración |
| D5 guardián de cifras | Sí | lee el fichero vigilado |
| D6/D7 traza marcador, sin `status_type`/`managed_by_app` | Sí | caso estático lo fija |
| D8 fixture derivado de `schema.sql` | Sí | la prueba exige exactamente dos bloques |
| D9 reapuntar a `diagnostico_complementario` + 400 | Sí | |
| Script: predicado, sentencias, `max(id)` | Con matiz | WARNING 1 y 3 |

## Los cuatro juicios pedidos

**(1) Las desviaciones del script frente a RQ-TS-28: SÍ cumplen, con WARNING.**
- *Por sentencias en pg-mem*: el spec lo admite («si pg-mem no admite una sentencia, el diseño declara qué parte se
  revisa por lectura») y el design traía esa salida. La atomicidad queda por lectura estática (un `BEGIN`, un
  `COMMIT`, INSERT antes que UPDATE dentro). Se pierde la prueba de un `ROLLBACK` real: aceptable.
- *Reversión con `max(id)`*: equivale a «ticket cuya fila marcador es su última transición». El caso (c) la ejecuta
  y restaura. Matiz: el `DELETE` borra **todas** las filas marcador, también las de tickets con transiciones
  posteriores (esos no vuelven a Pendiente y pierden su marcador). Coherente con «borra las filas marcador» del
  diseño, pero sin caso propio.
- *Predicado con `LIKE` sobre soporte y remoto* (`lower(coalesce(classification,''))`): el spec pide «clasificación
  normalizada distinta de «Soporte remoto»», que en el código es **igualdad** tras `trim`, colapso de espacios y
  minúsculas (`flujos.ts:116-119`). El `LIKE` es más amplio: una clasificación como «Soporte no remoto» se tomaría
  por soporte remoto y **no se movería**. El error va en el sentido seguro (no mueve de más, no puede tocar un ticket
  de SR), está anotado como hipótesis en la cabecera del script y el paso 1 lista las clasificaciones distintas para
  verlo antes de ejecutar. Hipótesis: hoy las clasificaciones de Zoho son una lista corta y el riesgo es bajo.
  Ningún escenario lo contradice: WARNING, no CRITICAL. `managed_by_app` es `NOT NULL DEFAULT false`
  (`schema.sql:4`), así que el grupo 2 no pierde filas por NULL.
- El spec remite a `flujos.ts:56-60` como el criterio; en HEAD esas líneas son `flujoDelTicket` y la igualdad está en
  `:116-119` (SUGGESTION 1).

**(2) `registro.test.ts` con F1C-09 en «en curso» (7): WARNING.** `apps/desk/server/reconciliacion/registro.test.ts`
(prueba «11f/05g») pasó de SEIS a SIETE con F1C-09 en la lista: la prueba lee el árbol real (`openspec/changes/`) y
depende del estado transitorio. **Acción al archivar:** revertir esa línea y el título a SEIS (F0-04, F1B-04,
F1B-07, F1B-08, F1B-11, F1C-05), porque el cambio sale de «en curso» al archivarse. Si se olvida, la prueba se pone
roja el día del archive. El apply-progress ya lo anota.

**(3) Citas reparadas: dicen lo que afirman** (muestra de 8 contra `git show fd253aa:<fichero>`).
- `transitions.ts:206` → `marcar_pendiente`; `:230` → `servicio_externo_pendiente`; `:232` →
  `servicio_externo_notificado`; `:244` → `diagnostico_complementario` con origen Pendiente. Correctas.
- `transitions.ts:171-256`: `:171` es `const TRANSICIONES_BASE`, `:256` línea de comentario no vacía.
- `transitions.ts:267-276`: bloque de `DERIVACION_POR_DEFECTO` (`:276` es `escalado_a_revision`). Correcta.
- `transitions.ts:290`: «garantizaría olvidarla en la 35.ª» (caso C); hoy `:290` dice «32.ª». Correcta como caso C.
- `permisos.test.ts:41-110`: el `describe` de la matriz área × transición contra el servidor, hasta su cierre. Correcta.
- `permisos.test.ts:77-82`: la prueba «la matriz son 102 casos: 60 prohibidos y 42 permitidos». Correcta.
- `invariantesGrafo.test.ts:50-54` y `:91-106`: invariante 2 («34 transiciones sobre 21 estados») e invariante 5
  (ocho compartidas). Correctas.
El detector sale con 0 bloqueantes (4.502). Las 11 abreviadas rotas son las previas y ajenas; una cae en
`transitions-st/spec.md:396` (rango `:1670-1671`), spec que el archive reescribe.

**(4) ¿Deja F1C-09 su fila entera (`cierra: si`)? SÍ, con la parte humana declarada aparte.** La fila de la R01.4
(`:173`) y `decision/tres-transiciones-y-la-cifra-anclada` piden: quitar las tres, `diagnostico_complementario` desde
En Proceso, mapa regenerado, cifra 34→31 y 38→35 en el mismo commit, y los tickets de «Pendiente» pasan a En Proceso
sin reescribir el historial. Todo lo construible está construido y probado: catálogo, mapa, cifras (más `estados` 20,
supuesto S-1, que la decisión no contradice) y script. La decisión dice que la migración la ejecuta quien construye el
cambio; aquí queda escrita y **NO ejecutada** (el repositorio no tiene acceso a producción), y las tareas de persona
(recuento previo, ejecución, recuento posterior, P-1) están declaradas fuera del recuento con dueño y destino. Encaja
en la regla del ciclo 1 y no maquilla el contador: ninguna se puede hacer desde el repositorio. El
`archive-report.md` debe decir en UNA línea qué parte de la fila cubrió y que **la migración está sin ejecutar**.

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
1. **Predicado `LIKE`** más amplio que la regla de la aplicación (igualdad normalizada): no mueve de más, pero puede
   dejar en `Pendiente` un ticket de servicio con clasificación inesperada. Mitigado por el paso 1 (lista de
   clasificaciones): Alfonso debe leerlo antes de ejecutar.
2. **`registro.test.ts` depende del estado transitorio del árbol** (F1C-09 en «en curso» = 7): revertir al archivar
   (SEIS) o la suite se pone roja.
3. **La reversión borra todas las filas marcador**, también las de tickets con transiciones posteriores. Sin caso propio.
4. **El script nunca se ha ejecutado contra PostgreSQL real**: pg-mem no tiene `btrim`/`replace`, `GROUP BY 1` sobre
   `CASE`, subconsulta correlacionada ni `ROLLBACK` real, y `migrate.integration` está saltada. La corrección en
   PostgreSQL real descansa en sintaxis estándar y en el recuento previo.

### SUGGESTION
1. La cita de RQ-TS-28 a `flujos.ts:56-60` apunta a `flujoDelTicket`; el criterio de igualdad está en `:116-119`.
   Corregir al fusionar el delta.
2. `docs/artefactos/blueprintserviciotecnico.html` (`:765`, `:770-771`) sigue pintando las tres transiciones
   retiradas; no lo genera ni lo vigila nada. Anotado fuera de alcance, necesita destino.
3. El validador nativo `gentle-ai sdd-verify-validate` no se ejecutó en esta sesión. El orquestador debe correrlo si
   el `settle` lo exige.

## Medida del intento (regla del ciclo 2)

`git diff --shortstat --no-renames HEAD` antes de añadir este informe: 0 ficheros, 0 líneas (árbol limpio; las
mutaciones se revirtieron). Más `wc -l` de lo nuevo sin trackear: este `verify-report.md`, **198 líneas**.
Total del intento: **198 líneas**. Sin binarios. Muy por debajo del techo de 800.
Acumulado de F1C-09 contra `fd253aa` (dato del árbol): 42 ficheros, +651 −212 = 863 en dos commits de código.

## Siguiente paso

`sdd-archive`: al archivar, revertir `registro.test.ts` a SEIS, fusionar los 5 deltas (corrigiendo la cita de
SUGGESTION 1), declarar la migración como sin ejecutar y las cuatro tareas de persona en el `archive-report.md`.
