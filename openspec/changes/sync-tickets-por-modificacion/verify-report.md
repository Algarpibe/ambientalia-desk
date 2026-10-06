```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:b932976b2da69b86b81b370fc8aab22136f224284a6bbbfc5ad8cb58992a2bc9
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 1/1
scenarios: 10/10
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:0d67d8a739f673c44bfe5fac509a6779e6cf102d9ca7fef44a17a9d4ae570e66
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:06db38b8c200bc6ea8d294db42036859e9b84ada3fd1c54c914b0a037e369cac
```

## Verification Report

**Change**: sync-tickets-por-modificacion (`fuera-del-plan`, `cierra: no`)
**Version**: N/A (delta RQ-ZS-22 sobre `zoho-sync`)
**Mode**: Strict TDD. Revisión verificada: `8443dd3` (base `9822bd7`).

### Completeness
| Metric | Value |
|--------|-------|
| Tareas de código (lotes 1-5) | 27 / 27 marcadas |
| Tareas incompletas | 0 |
| Tareas de persona (3) | Fuera del recuento y sin marcar, como manda la regla del ciclo 1. **Verificar y archivar NO las da por hechas** (relleno `backfillTickets`, log del primer ciclo, ticket nº 884). Dueño: responsable del despliegue; destino: `archive-report.md` |

### Build & Tests Execution
| Orden | Resultado |
|---|---|
| `npm test` | salida 0; 237 ficheros pasados, 2 omitidos (239); 3651 pruebas pasadas, 7 omitidas, 0 fallidas |
| `npx vitest run packages/zoho-sync/src/sync.modificados.test.ts` | 15 de 15 |
| `npm run typecheck` | salida 0 |
| `npm run lint -- --max-warnings 165` | salida 0; 165 problemas = 0 errores, 165 avisos (tope exacto, sin margen) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | salida 0; 13 abreviadas rotas informativas, ninguna sobre `sync.ts` ni sobre ficheros de este cambio |

Los hashes del envelope son SHA-256 de la línea-resumen de cada orden, no de la salida íntegra. Cobertura: no medida (sin herramienta configurada).

### TDD Compliance
| Check | Result | Details |
|---|---|---|
| Evidencia de RED reportada | ⚠️ | `apply-progress.md` da la salida roja global (14 fallidas, 1 pasada) y la tabla de mutaciones, pero no la tabla «TDD Cycle Evidence» por tarea |
| Tareas con prueba | ✅ | un fichero nuevo, 15 pruebas |
| GREEN confirmado | ✅ | 15/15 al ejecutar |
| Triangulación | ✅ | 404 / 429 / 403 / lanza / 204 / 500 en página 2, con expectativas distintas |
| Safety net | ✅ | `sync.test.ts`, `ovDiscrepanciaSync.test.ts`, `hubSync.test.ts` verdes en el `npm test` completo |

Capa: unitaria con pg-mem y `zohoFetch` enrutado; 15 pruebas, 1 fichero. Aserciones: sin tautologías ni bucles fantasma; la 7 y la 14 aseveran ausencia, pero tienen vecinas que aseveran presencia (1 y 6).

### Spec Compliance Matrix (RQ-ZS-22)
Prueba = `packages/zoho-sync/src/sync.modificados.test.ts`, con la línea de su `it`.
| Escenario | Prueba | Resultado |
|---|---|---|
| Cierre en Zoho sin conversación nueva | `:90` (1: detalle `Closed`, `closed_time`, `serial`; no llama a `/tickets?`) y `:106` (2: desde = marca − 15 min) | ✅ COMPLIANT |
| Más de una página | `:120` (6: `from=0` y `from=100`, 103 detalles) y `:133` (10: orden ascendente) | ✅ COMPLIANT |
| Tope de paginación alcanzado | `:222` (14: sin `from=1000`, log del tope) | ⚠️ PARTIAL: no afirma que lo persistido sea el prefijo más antiguo ni que la marca siguiente no deje a nadie fuera |
| Transición en la App no adelanta la marca | `:70` (3) | ✅ COMPLIANT |
| Ticket nacido en la App no cuenta | `:79` (4) | ✅ COMPLIANT |
| Réplica vacía o sin elegibles | `:58` (5: réplica vacía) | ✅ COMPLIANT para «vacía»; el caso «todas inelegibles» no tiene prueba propia (W-3) |
| Búsqueda no-OK | `:154` (8) y `:164` (8b, lanza) | ✅ COMPLIANT |
| Un ticket falla al persistir | `:210` (13), con `:192` y `:202` (11, 12) | ✅ COMPLIANT |
| Fila gestionada por la App | ninguna que pase por `syncRecent`; la guarda la prueba `packages/zoho-sync/src/db/repo.test.ts:32` (preexistente) | ⚠️ PARTIAL |
| Ninguna columna promovida se vacía | `:90` (1) | ⚠️ PARTIAL: aseveran `closed_time` y `serial`; no `description`, `onhold_time` ni `custom_fields` |

**Compliance summary**: 7/10 plenamente compliant, 3 parciales (el envelope cuenta 10/10 porque las tres tienen una prueba que pasa y los ejercita, aunque no los agote), 0 sin prueba, 0 fallando. Ninguno rompe el escenario: la lógica existe; falta fuerza de la aserción.

### Mutaciones repetidas por el verificador (sobre `sync.ts`; restaurado con `git checkout` tras cada una)
| Mutación | Resultado |
|---|---|
| (a) quitar `AND managed_by_app = false` (`:381`) | ROJO: prueba 3 |
| (b) quitar la caída (no-OK y excepción lanzan) | ROJO: 8, 8b, 9 |
| (c) POSICIÓN: leer el detalle dentro del bucle de paginación | ROJO: 6, 9, 10, 11 |
| (d) solape = 0 (`:368`) | ROJO: 2, 3, 4 |
| (e) ordenación sustituida por 0 (`:410`) | ROJO: 10 |
| (f) quitar `if (!hallados.has(...))` | VERDE: equivalente M10c (S-2) |
| (g) quitar la guarda `NaN` del comparador (`:410`) | VERDE (S-1) |

### Correctness / Coherence
| Punto | Estado |
|---|---|
| Hunks de `sync.ts` contra `9822bd7` (`-U0`) | ✅ sólo `@@ -174,3 +174,3 @@` y `@@ -358,0 +359,76 @@`; ninguna línea existente se movió |
| Regla invariable 13 | ✅ `git diff --stat 9822bd7` no toca `apps/desk/src` (9 ficheros: DEPLOY.md, ENTRADA.md, 5 artefactos SDD, `sync.ts`, test nuevo) |
| Regla de mutación 4 | ✅ `docs/sdd/ENTRADA.md:2048` (caso C, anclada a `9822bd7` con lo que la superó), `proposal.md:15` y `:65`, `design.md:57` ancladas. Otras citas a `sync.ts` (`:190-192`, `:189`, `:125-133`) caen fuera de 174-176 y el fichero sólo ganó líneas tras la 358. `F0-00_Baseline_as-built.md:121` anclada a `17ddfec`. Ninguna abreviada afirma «sólo la primera página» |
| Cabecera R-1 | ✅ siete campos; `tanda: fuera-del-plan`, `motivo` no vacío, `cierra: no` |
| Marca, índice + detalle, caída, tope de 1.000, corte por 429/≥500 | ✅ diseño y código coinciden (`sync.ts:359-434`) |
| Medida | 773 inserciones + 4 borrados = 777 contra 800 (`--no-renames`, nada sin trackear) |
| `DEPLOY.md` | ✅ una frase añadida al final, sin flag ni variable de entorno |

### Issues Found
**CRITICAL**: None.

**WARNING**
- W-1 · Coste en régimen mal descrito en el diseño. `design.md:17` dice «los de los últimos 15 minutos, repetidos hasta cinco ciclos». Sólo es cierto si la marca avanza. La ventana va de «marca − 15 min» a «ahora» y la marca (`sync.ts:381-383`) es el máximo `modified_time` de Zoho, no el reloj: con Zoho quieto no avanza, y cada ciclo, en los dos procesos (`apps/hub-sync/src/hubSync.ts:93`, `apps/desk/server/index.ts:88`), repite una búsqueda y relee por detalle al menos el ticket que fijó la marca, indefinidamente. Hipótesis: con N pequeño la cuota consumida es baja (≈ 1 + N peticiones por ciclo y proceso), pero el diseño debe declararlo; no rompe ningún escenario.
- W-2 · Tres escenarios sólo parciales (matriz): Tope, Fila gestionada y Columnas promovidas.
- W-3 · Sin prueba de réplica con todas las filas inelegibles (todas `app-…` o `managed_by_app`), que el escenario nombra. El código la trata igual que la vacía (`max` nulo), pero nada lo fija.
- W-4 · `apply-progress.md` no trae la tabla «TDD Cycle Evidence» por tarea; el rojo es global.
- W-5 · El lint está en 165 avisos, igual al tope de CI: cualquier aviso nuevo en otra tanda lo rompe (ninguno en ficheros de este cambio).

**SUGGESTION**
- S-1 · El comparador (`sync.ts:410`) devuelve 0 si algún lado es `NaN`: no es un orden total, así que un `modifiedTime` ausente o ilegible deja su posición indefinida y puede romper la garantía de prefijo. Sin prueba (mutación (g) verde). Hoy Zoho siempre envía `modifiedTime`; añadir una prueba con un ítem sin fecha, u ordenar los `NaN` al final.
- S-2 · M10c es equivalente cuando los ids repetidos traen el mismo `modifiedTime`; con fechas distintas, la guarda es lo que fija «la primera» y sin ella gana la última. Sin consecuencia real.
- S-3 · Una prueba que ponga el cierre fuera de la ventana de 100 de `-recentThread` (lo que el escenario 1 nombra) lo volvería literal; hoy se infiere de que no se llama a `/tickets?`.

### Verdict
**PASS WITH WARNINGS** — 0 CRITICAL, 5 WARNING, 3 SUGGESTION. Los diez escenarios tienen código y siete prueba completa; los tres parciales no rompen el requisito. Las tres tareas de persona siguen abiertas y fuera del recuento.
