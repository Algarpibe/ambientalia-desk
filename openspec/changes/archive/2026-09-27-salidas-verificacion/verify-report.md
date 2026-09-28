```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:01592e1bb62b3822a3a6b2afaa717baee879137311af18e449029d755a195698
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 8/8
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:b50e775712b8c18f6c16c18dc85d0568e2e7051c3f7a32f51cbab7e4847f9b55
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:91937bc2c2ba2d089e75c6a481b5a3301a259e1dc5c8557f15289a572bd92e52
```

## Verification Report

**Cambio**: `salidas-verificacion` (F1A-03, `cierra: no`)
**Versión**: HEAD `1cb43c7` (rama `main`) — aplicado en `c373bcc`, base previa `f488c3d`
**Modo**: Strict TDD

### Completitud

| Métrica | Valor |
|---|---|
| Tareas totales (`tasks.md`, recontadas por casilla) | 26 |
| Tareas completas | 26 |
| Tareas incompletas | 0 |

`apply-progress.md:3` afirma «20/20» — recuento incorrecto del propio artefacto (26 casillas `[x]`
reales, `grep -c '^\- \[x\]' tasks.md` = 26, 0 sin marcar). No afecta al cierre: las 26 tareas están
hechas y verificadas una a una contra el código; queda como hallazgo de exactitud (WARNING-1).

### Build y pruebas (ejecución real de esta fase)

| Comando | Exit | Resultado |
|---|---|---|
| `npm test` | 0 | 143 ficheros pasados, 1 omitido por diseño (`migrate.integration.test.ts`); 1445 pruebas verdes, 2 omitidas — idéntico a `apply-progress.md:57` |
| `npm run typecheck` | 0 | sin salida |
| `npm run lint` | 0 | 0 errores, 165 warnings preexistentes (`no-explicit-any`, `zoho-sync`), ninguno en ficheros tocados |
| `npm run build` | 0 | `vite build` OK |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 0 bloqueantes; 12 abreviadas rotas — mismas 12 que en `f488c3d` (comprobado con `--sha f488c3d`), ninguna nueva |

**Cobertura** (acotada a `transitions.ts` vía los seis ficheros tocados, `--coverage.include`):
97.1% líneas, 100% ramas, 84.6% funciones — 74/74 pruebas de esos seis ficheros en verde, igual a
`apply-progress.md`. Las funciones sin cubrir (`transitionsForStatus`, `transitionById`) son ajenas a
este cambio y las ejercitan otros ficheros de la suite completa.

### Matriz de cumplimiento de la spec (delta `transitions-equipo-nuevo`)

| Requisito | Escenario | Prueba | Resultado |
|---|---|---|---|
| RQ-EN-01 | Seis transiciones, `sinSalida` = `['Finalizado']` | `invariantesGrafo.test.ts:172-181` | ✅ COMPLIANT |
| RQ-EN-01 | Invariante 1 sobre la unión | `invariantesGrafo.test.ts:163-170` | ✅ COMPLIANT |
| RQ-EN-01 | Quitar las DOS salidas pone el invariante 3 en rojo (M3) | `invariantesGrafo.test.ts:177-180` — **remutada de forma independiente en esta verificación**: quitar `Verificación` de `liberacion.from` y borrar `rechazo_verificacion` a la vez pone en rojo exactamente esa prueba (3 fallos en el fichero); revertido y `git diff` limpio | ✅ COMPLIANT |
| RQ-EN-01 | Quitar UNA sola salida la caza la prueba de pares, no el invariante (M1/M2) | `invariantesGrafo.test.ts:200-211`; confirmado por tabla de mutación de `apply-progress.md` (M1: 5 rojas: M2: 9 rojas, invariante 3 sigue verde en ambas) | ✅ COMPLIANT |
| RQ-EN-01 | Liberación ejecuta desde `Verificación` (E1) | `flujoEquipoNuevo.test.ts:115-125` (P7) | ✅ COMPLIANT |
| RQ-EN-01 | Rechazo de verificación ejecuta desde `Verificación` (E2) | `flujoEquipoNuevo.test.ts:127-133` (P7) | ✅ COMPLIANT |
| RQ-EN-01 | Ciclo de reentrancia incluye `Verificación`, cero fechas | `reentrancia.test.ts:191-199` | ✅ COMPLIANT |
| RQ-EN-02 | Las seis transiciones exigen `Servicio Técnico` | `permisos.test.ts:219-248` (matriz 6×3) + `flujoEquipoNuevo.test.ts:94-111` (P6, 7×403 por todos los `from`) | ✅ COMPLIANT |

**Resumen**: 8/8 escenarios conformes, 2/2 requisitos.

### Corrección (evidencia estática) — decisiones de `design.md`

| Decisión | Estado | Nota |
|---|---|---|
| D1 · `liberacion.from` amplía en su sitio | ✅ Implementada | `transitions.ts:359` |
| D2 · `rechazo_verificacion` al final del array | ✅ Implementada | `transitions.ts:361-362` |
| D3 · comentario reescrito en 3 líneas, sin invariante 3 | ✅ Implementada | `transitions.ts:343-345` |
| D4 · sin cambio en `flujos.ts`/`estados.ts`/`ticketService.ts` | ✅ Confirmada | `git diff f488c3d c373bcc` vacío en los tres |
| D5 · barridos recorren todos los `from`, no `t.from[0]` | ✅ Implementada | `transicionesEjecucion.test.ts:338-340`, `flujoEquipoNuevo.test.ts:98-101` — la matriz de `permisos.test.ts` sigue con `t.from[0]` a propósito (no la exige D5) |
| M4 (desviación documentada) — matriz 18/12/6 no se pone roja al mover el área de `rechazo_verificacion` | ✅ Cobertura equivalente confirmada | 4 pruebas independientes sí detectan el cambio: `corrección (b)`, P6, caso nuevo de `avisoArea.test.ts` — el conteo agregado es simétrico ante el intercambio de una única área, tal como documenta `apply-progress.md` |

### Coherencia (diseño ↔ código)

Cero decisiones nuevas en `apps/desk/src`: `git diff --stat f488c3d c373bcc -- apps/desk/src` vacío.
Tabla de la regla 13 (`design.md`) confirmada línea a línea: flujo/origen en `ticketService.ts:125-128`,
área en `:129-131` (probado por la matriz 6×3), campos en `buildTransitionPlan` `:133-134`/`:138-142`.

### Cumplimiento TDD (Strict TDD)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | ✅ | Tabla en `apply-progress.md`, una fila para el lote de 6 ficheros |
| RED confirmado | ✅ | Los 6 ficheros existen y contienen las pruebas descritas |
| GREEN confirmado | ✅ | 74/74 al ejecutar hoy los 6 ficheros; 1445/1445 en la suite completa |
| Triangulación | ✅ | P7 (2 salidas por separado) + M1-M4 (4 mutaciones independientes) |
| Red de seguridad | ✅ | Baseline 71/71 antes de tocar los 6 ficheros (consistente: 71 + 3 pruebas nuevas = 74) |

**Auditoría de aserciones**: sin tautologías, sin bucles fantasma (los bucles sobre `TRANSITIONS_EQUIPO_NUEVO`
llevan aserción de recuento fuera del bucle, p. ej. `transicionesEjecucion.test.ts:365` y
`flujoEquipoNuevo.test.ts:110`), sin acoplamiento a detalle de implementación. ✅ Todas las aserciones
ejercitan código de producción (HTTP real contra `appWith()`, o las funciones puras del catálogo).

### Regla invariable 13 y bloqueo de despliegue

- Regla 13: sin ediciones en `apps/desk/src` — confirmado.
- El bloqueo de `archive-report.md:32` («Este cambio NO se despliega a producción sin F1A-03») queda
  **LEVANTADO**: `main` (`c373bcc`) ya trae las dos salidas de `Verificación`, y la suite completa,
  `typecheck`, `lint` y `build` pasan en verde sobre el árbol resultante. Sin migración de datos.
- Nada más encontrado que bloquee despliegue.

### Hallazgos

**CRITICAL**: Ninguno.

**WARNING**:
1. `apply-progress.md:3` cuenta «20/20 tareas» cuando `tasks.md` tiene 26 casillas `[x]` (7+5+5+2+7 por
   fase). No afecta al cierre — las 26 están completas y verificadas — pero es un recuento propio
   incorrecto del artefacto.

**SUGGESTION**:
1. Comentarios/títulos de prueba desactualizados: dicen «las cinco transiciones» sobre un catálogo que
   ya tiene seis — `permisos.test.ts:221`, `transicionesEjecucion.test.ts:290,311`. Cosmético, no afecta
   ninguna aserción.

### Veredicto

**PASS WITH WARNINGS** — 0 CRITICAL, 1 WARNING (recuento de tareas, sustancia intacta), 1 SUGGESTION (títulos
desactualizados). El criterio de cierre de F1A-03 (E1+E2, invariante 3 = `['Finalizado']`) está
cumplido y probado con ejecución real, incluida una remutación independiente de M3 durante esta fase.
