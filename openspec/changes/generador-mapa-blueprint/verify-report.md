```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:4312d9c7b628dc5c5697e25b1eac2b53ee0c25d1
verdict: pass
blockers: 0
critical_findings: 0
requirements: 7/7
scenarios: 11/15
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:fd5b677dcbfeb1edf1bf11d4c30dab6c97946500c45a3716e57f16ce3917333a
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:9f6123f3c016d60ec9c362eca94e9d4ac06ef710baef0e27ed4df8c8eb1dc1b0
```

## Verification Report

**Change**: `generador-mapa-blueprint` (F1A-06) · **Commit verificado**: `4312d9c` (worktree `f1a-06-r1`)
**Mode**: Strict TDD · **Artefactos**: `proposal.md`, `design.md`, `specs/mapa-blueprint/spec.md`,
`specs/transitions-st/spec.md` (delta), `tasks.md`, `apply-progress.md` (435 líneas, tres unidades)

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 38 |
| Tasks complete | 38 (confirmado leyendo `tasks.md`: cero casillas pendientes) |
| Tasks incomplete | 0 |

### Build & Tests Execution — los cuatro comandos, exit real, sobre `4312d9c` (medidos por este verify, no copiados del padre)

1. `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` → EXIT=0. 2029 comprobadas, 11
   abreviadas rotas (informativas; las 11 son pre-existentes a esta tanda: `F0-00`, `F1A-05`,
   `Puntos_para_Gerencia`, dos `plans/` de agosto, `F0-04/proposal.md` archivado y tres specs
   —`derivacion-avisos`, `permissions`, `transitions-st`— que citan `permissions.ts:1636` y
   `transitions.ts:1653,1671`; ninguna toca ficheros de esta tanda). 0 bloqueantes.
2. `npm test` → EXIT=0. 132 test files passed + 1 skipped (133); 1247 tests passed, 2 skipped
   (1249), 0 failed.
3. `npm run typecheck` → EXIT=0, sin salida.
4. `npm run lint` → EXIT=0, 0 errores, 165 avisos (idéntico a los tres cierres de unidad).

Adicionales, verificados por este verify (no en la lista de cuatro, pero exigidos por criterios de
la propuesta §14): `npm run build` → EXIT=0. `npm run test:coverage` → EXIT=0,
`packages/shared/src` en 97.68/89.86/98.87/97.68 (líneas/ramas/funciones/statements) sobre suelo
92/92/96/78; `fasesBlueprint.ts` 100/100/100/100; `mapaBlueprint.ts` 100/97.82/100/100 (única rama
sin ejercitar: L153, el fallback defensivo `MARCA_AREA[area] ?? area`, inalcanzable con `AREAS` real).
Cifras idénticas a las que `apply-progress.md` reporta para el cierre de B, remedidas, no copiadas.

### Reproducción independiente de la mutación RQ-MB-06 (regla de mutación 2)

Editado a mano `docs/artefactos/blueprint-completo.md` (línea 38, «Llegada de repuestos» →
«MUTADO A MANO») y corrido `npx vitest run packages/shared/src/mapaBlueprint.test.ts`: 1 failed / 13
passed, diff exacto señalando la línea. `git checkout --` sobre el fichero y re-corrida: 14/14
passed. `git status` limpio antes y después. Confirma por ejecución propia (no por lectura de
`apply-progress.md`) que el fichero vigilado, no sólo el generador, está bajo guardia.

También corrido `npm run generar-mapa-blueprint` (regeneración real vía CLI, no sólo la prueba):
escribe los cuatro ficheros; `git diff --stat` tras la regeneración vuelve vacío (el aviso de CRLF
de `git status` es el hallazgo ya documentado por la Unidad B: `.gitattributes` normaliza a CRLF en
checkout, el generador escribe LF, no drift de contenido). Recuento independiente sobre el `.md`
commiteado con `grep -oE "e[0-9]{2} --> e[0-9]{2}"`: 38 aristas; `: Habilitar Servicio`: 3;
`(sin botón)`: 2 — coincide con RQ-MB-02 sin depender de la aserción de la prueba.

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-MB-01 | no importa `permissions.ts` | (ninguno — verificado por lectura: `mapaBlueprint.ts:1-9`, sin import de `permissions`) | WARNING — UNTESTED, correcto por inspección |
| RQ-MB-01 | CLI delega todo el cálculo | (ninguno — `scripts/generar-mapa-blueprint.ts` sólo invoca `generarMapaBlueprint` y escribe) | WARNING — UNTESTED, correcto por inspección |
| RQ-MB-02 | `habilitar_servicio` 3 aristas | `mapaBlueprint.test.ts:46-55` | COMPLIANT |
| RQ-MB-02 | 38 aristas totales | `mapaBlueprint.test.ts:46-55` + recuento independiente arriba | COMPLIANT |
| RQ-MB-03 | 4 ficheros exactos | `mapaBlueprint.test.ts:25-33` | COMPLIANT |
| RQ-MB-03 | cabecera generado/no-editar | `mapaBlueprint.test.ts:35-44` | COMPLIANT |
| RQ-MB-04 | frontera en las dos vistas | `mapaBlueprint.test.ts:101-107` | COMPLIANT |
| RQ-MB-04 | estado sin fase bloquea | `mapaBlueprint.test.ts:65-71` | COMPLIANT |
| RQ-MB-05 | leyenda 3 áreas + compuesta | `mapaBlueprint.test.ts:116-122` | COMPLIANT |
| RQ-MB-05 | sin fichas de hallazgos | `mapaBlueprint.test.ts:124-132` | COMPLIANT |
| RQ-MB-06 | edición a mano da rojo | `mapaBlueprint.test.ts:168-177` + reproducción propia arriba | COMPLIANT |
| RQ-MB-06 | transición sintética sin regenerar da rojo | (ninguno permanente — script `tsx` ad-hoc de B.3.3, no commiteado) | WARNING — UNTESTED, ver nota |
| RQ-TS-03 | constantes declaran `from`/`to` exacto | `invariantesGrafo.test.ts:120-127` | COMPLIANT |
| RQ-TS-03 | sin literales duplicados en `estadoPorRemision.ts` | (ninguno — verificado por lectura: `estadoPorRemision.ts:41,49` usan `.from`/`.to`, cero literales `Ticket creado`/`Remisión creada` fuera de comentarios) | WARNING — UNTESTED, correcto por inspección |
| RQ-TS-03 | sin regresión de comportamiento | `estadoPorRemision.test.ts` (13/13, dentro de los 1247) | COMPLIANT |

Compliance summary: 11/15 escenarios con prueba de ejecución pasante. 4/15 sin prueba automática
que los cubra, verificados en este verify por lectura directa del código con cita `ruta:línea` (no
hipótesis) — los cuatro son propiedades estructurales o de ausencia (no importa X, no hay literal
duplicado, la CLI no calcula) para las que ni `apply-progress.md` ni el código reportan un test
runtime. Ninguno de los cuatro está roto: todos se comprobaron verdaderos contra el árbol. Se
degradan a WARNING (no CRITICAL/FAILING) precisamente porque la comprobación directa, no la
ausencia de prueba, es la que sostiene el veredicto; queda como riesgo de regresión silenciosa, no
como defecto presente.

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|---|---|---|
| `transitions.ts:150-151` — P-2, `from`/`to` en sitio | Implementado | delta 0 líneas confirmado (`git diff --shortstat` histórico) |
| `estadoPorRemision.ts:41` — guarda derivada, sin literales | Implementado | usa `.from` de las dos constantes; ver hallazgo de tipos abajo |
| `mapaBlueprint.ts` — motor puro, D-1 a D-6 | Implementado | sin `fs`/`process`; alias `eNN`, orden determinista, guarda de ejecución `validarFasePorEstado` (L108-122) y `aliasDe` (L64-68) |
| `docs/artefactos/blueprint-*.md` ×4 | Implementado | existen, cabecera «generado» presente, 38/3/2 confirmados independientemente |
| `openspec/config.yaml` — `mapa-blueprint` en `capabilities` | Implementado | `:271-283`, escrita en `sdd-spec`, sin tocar por A/B/C |
| `docs/artefactos/NOTA.md` §3/§6 | Implementado | Caso B correcto: texto viejo intacto + bloque de precisión nuevo |
| `F0-01_Correcciones_para_el_maestro.md` entrada 17 | Implementado | citas M1.3.3 (`:1198`), Anexo F (`:4412-4413`) y M1.3.7 (`:1301-1458`) verificadas contra el maestro real, coinciden textualmente |

### Hallazgo verificado — regresión de tipos de Unidad A, corregida en Unidad B

`estadoPorRemision.ts:41` tenía `TS2345` (introducido por A, `.some(...)` sin descartar
`actual: string | undefined`). Confirmado en el código de hoy: corregido (`actual === undefined ||
...`, L41) y `npm run typecheck` da exit 0. `apply-progress.md` (Unidad B) documenta el hallazgo
como propio de A, corregido en B; no se declara como deuda pre-existente ajena a la tanda.
Afirmación correcta, sin drift.

### Coherence (Design)
| Decision | Followed? | Notes |
|---|---|---|
| D-1 doble guarda (compilación + ejecución) | Sí | `satisfies` en `fasesBlueprint.ts` + `throw` en `mapaBlueprint.ts:108-122` |
| D-4 `conBoton` derivado, no declarado | Sí | `construirAristas` (L92-105) fija `conBoton` por el array de origen, no por campo |
| D-5 determinismo | Sí | confirmado por regeneración + `sha256sum` (Unidad B) y por mi propia regeneración (arriba) |
| D-6 alias Mermaid + área en etiqueta | Sí | `MARCA_AREA`, `marcasArea` (L76-81) |
| Regla invariable 13 — NO APLICA | Confirmado | `git diff --stat -- apps/desk/src` vacío entre `125ae3e` y `4312d9c` |

### TDD Compliance
| Check | Result | Details |
|---|---|---|
| TDD Evidence reportada | Sí | tabla completa en `apply-progress.md`, tres unidades |
| Todas las tareas de código tienen test | Sí | A/B con RED/GREEN; C es documental, `strict_tdd` no aplica (declarado y correcto) |
| RED confirmado | Sí | ficheros de test existen y contienen los casos descritos |
| GREEN confirmado | Sí | cruzado con la ejecución real de este verify (1247/1249) |
| Triangulación | Sí | 5b usa `for` sobre 2 tuplas; `fasesBlueprint.test.ts` cubre las 3 asignaciones no mecánicas por separado |
| Guardas contra bucle fantasma | Sí | `toHaveLength(4)` o `.toBeGreaterThan(0)` antes de cada `for` sobre colección potencialmente vacía (`mapaBlueprint.test.ts:37,60,127,129,137,144,171`) |

TDD Compliance: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files |
|---|---|---|
| Unit | 5+7+14 = 26 | `fasesBlueprint.test.ts`, `invariantesGrafo.test.ts`, `mapaBlueprint.test.ts` |
| Integration (pg-mem+migrate) | 13 | `estadoPorRemision.test.ts` |
| E2E | 0 | — |

### Assertion Quality

Assertion quality: sin tautologías, sin bucle fantasma sin guarda, sin aserciones que no ejecuten
código de producción. Todas las llamadas `for`/`Object.values` sobre colecciones potencialmente
vacías llevan guarda de longitud previa (ver tabla TDD arriba).

### Issues Found

CRITICAL: Ninguno.

WARNING:
1. RQ-MB-01 (`mapaBlueprint.ts` no importa `permissions.ts`; la CLI no calcula grafo) — sin prueba
   runtime que lo proteja de regresión; verdadero hoy por inspección directa (`mapaBlueprint.ts:1-9`,
   `scripts/generar-mapa-blueprint.ts` completo, cero coincidencias de `permissions` o
   `canExecuteTransition`).
2. RQ-MB-06, segundo escenario (transición sintética sin regenerar) — sólo verificado una vez con
   un script `tsx` ad-hoc durante el apply (Unidad B), no preservado como prueba. El mecanismo de
   la prueba permanente (`mapaBlueprint.test.ts:168-177`, igualdad estricta bidireccional) cubre en
   la práctica el mismo modo de fallo — confirmado por mi propia mutación por el lado del disco —
   pero el escenario literal del spec no tiene un artefacto reproducible propio.
3. RQ-TS-03 (`estadoPorRemision.ts` sin literales duplicados) — sin prueba runtime que impida
   reintroducir el defecto P-2 (la tercera copia) por refactor futuro; verdadero hoy por inspección
   directa (`estadoPorRemision.ts:41,49`, cero literales `Ticket creado`/`Remisión creada` fuera de
   comentarios).

SUGGESTION: Ninguna adicional a las tres de arriba. Considerarlas para una tanda de cierre de
huecos de prueba; no bloquean este archive.

### Verdict
PASS WITH WARNINGS

Los 38/38 criterios de tareas están cumplidos y coinciden con el código; los cuatro comandos
exigidos más `build` y `test:coverage` corren en verde con las mismas cifras que reportan las tres
unidades; la mutación de la regla 2 se reprodujo de forma independiente (rojo, revertido, verde);
la regresión de tipos de Unidad A está confirmada corregida; la regla invariable 13 correctamente
no aplica. Las tres WARNING son huecos de prueba automática sobre propiedades que hoy son ciertas,
verificadas por lectura directa con cita exacta — no defectos activos. No hay CRITICAL ni
bloqueadores; listo para `sdd-archive` en lo funcional, con la recomendación de cerrar las tres
WARNING en cualquier tanda que vuelva a tocar `mapaBlueprint.ts` o `estadoPorRemision.ts`.
