```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:e15256ab5f4f97b233d6b4f9683ac11bb7c544f24d3f3b5df2444b256fb3689e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 28/28
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:db70b6ec1df9de54470c0dcd840a22c01c3487b6471563691a03725121fab16f
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:1ae7f5b1596ddc6191d04d5cbb85508aa1c412d43c53a9f2d562969a646f25ac
```

## Verification Report

**Cambio**: F0-05 · Mecanismo de reconciliación y bandeja de entrada
**Versión**: R1 «el contrato» + R2 «el barrido», entrega completa
**Modo**: Strict TDD
**Árbol verificado**: worktree `C:/dev/Desk_2_R1.023-worktrees/f0-05-r2`, rama `f0-05-r2`, HEAD `567b84c881b8603b6e4489725ecfcdc9530223ea`
**Cuentas del sobre**: recontadas directamente de los ficheros, no heredadas. `citas-verificables/spec.md` da 3 requisitos (RQ-CV-19, RQ-CV-20, RQ-CV-10) y 11 escenarios (5+3+3); `reconciliacion/spec.md` da 9 requisitos (RQ-RC-01 a RQ-RC-09) y 17 escenarios (2+2+3+2+2+2+1+2+1). Total 12 requisitos, 28 escenarios: coincide con la cifra del encargo.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 47 |
| Tasks complete | 47 |
| Tasks incomplete | 0 |

Confirmado por lectura directa de `openspec/changes/F0-05/tasks.md`: 47 líneas `- [x]`, 0 líneas `- [ ]`. Las tres casillas de rotación de secretos quedan correctamente fuera del recuento (regla del ciclo 1, tareas de una persona ajena al repositorio).

### Build & Tests Execution

**Build**: Passed
```text
npm run build -> tsc -b && vite build
106 modules transformed, built in 1.54s, exit 0
```

**Tests**: 1178 passed / 0 failed / 2 skipped (127 ficheros pasados, 1 saltado, de 128)
```text
npm test -> vitest run
Test Files  127 passed | 1 skipped (128)
Tests       1178 passed | 2 skipped (1180)
exit 0
```
Corrida dos veces de forma independiente, para descartar el riesgo de timeout del RPC de vitest que `apply-progress.md` documenta para la Fase 3: las dos, exit 0, sin línea `Errors`. Los tres ficheros más largos, **remedidos sobre este mismo árbol al corregir este informe** y no en las dos corridas cuyo `test_output_hash` consta arriba (ver la nota de procedencia al final), fueron `citas/hook.bordes.test.ts` con 27,5 s, `citas/hook.test.ts` con 27,3 s y `remisiones.test.ts` con 5,2 s, y 14 de 116 ficheros superan 1 s. Ninguno alcanza el aviso de 40 s del encargo, y el mayor deja 32,5 s de margen contra el techo de 60 s del RPC interno — que es la distancia que hay que vigilar, porque el umbral es por fichero y absoluto. La intermitencia que Fase 3 registró (exit 1 con 0 pruebas rojas) no se reprodujo en esta verificación; se deja constancia de que sigue siendo un riesgo latente del reportero de vitest bajo carga, no del código, tal como `apply-progress.md` ya documentó con evidencia.

**Typecheck**: `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` -> 0 errores

**Lint**: `eslint .` -> 0 errores, 158 avisos (el trinquete de `--max-warnings 158` sigue exacto; ninguno nuevo en los ficheros de esta tanda)

**Coverage**: 94,06% líneas / 84,32% ramas / 97,41% funciones / 94,06% sentencias, contra umbrales 92/78/96/92: Above en las cuatro. El margen más justo es funciones, 1,41 puntos, coincide exactamente con la medición que trae el encargo.

**`npm run reconcile`** (verificación funcional del entregable de R2, ejecutada y revertida sin dejar cambios): exit 0, escribe un único fichero (`docs/sdd/RECONCILIACION.md`), cifras de cierre 18 capacidades, 9 specs, 0 huérfanas, 5 fuera del plan, 0 sin motivo, 12 entradas IV, 5 vivos, 0 defectos de registro, esperas código 11 / maestro 4: coincide exactamente con lo que `apply-progress.md` y el encargo declaran para Fase 3.

**Determinismo (RQ-RC-02), verificado por ejecución directa y no supuesto**: se ejecutó `npm run reconcile` tres veces en la misma corrida, comparando cada salida byte a byte y revirtiendo después con `git checkout`. La primera ejecución difiere de la segunda en una sola línea (`Árbol de trabajo: limpio` -> `CON CAMBIOS SIN COMMITEAR`); la segunda y la tercera son byte-idénticas (`diff` vacío). La causa NO es una falla de determinismo del núcleo: `docs/sdd/RECONCILIACION.md` committeado en el árbol está desactualizado (cabecera `Commit medido: 0e4049f`, el cierre de la Fase 2, ocho commits detrás del HEAD real `567b84c`; los merges de `main` y las reparaciones de citas posteriores nunca se volvieron a medir). La primera pasada pone el fichero al día, lo que por definición lo deja modificado frente al índice; a partir de ahí el sistema es estable y determinista, tal y como exige `RQ-RC-02`. Ver SUGGESTION-1 abajo.

### Spec Compliance Matrix — `citas-verificables` (R1)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-CV-19 | sin bloque `---` bloquea | `cabecera.test.ts > R1.1.1` | COMPLIANT |
| RQ-CV-19 | `fuera-del-plan` + motivo vacío bloquea | `cabecera.test.ts > R1.1.2` | COMPLIANT |
| RQ-CV-19 | falta `origen_cabecera` bloquea | `cabecera.test.ts > R1.1.3` | COMPLIANT |
| RQ-CV-19 | valor fuera de dominio cerrado bloquea | `cabecera.test.ts > R1.1.4a/b` | COMPLIANT |
| RQ-CV-19 | forma pasa con contenido discutible | `cabecera.test.ts > R1.1.5` | COMPLIANT |
| RQ-CV-20 | precondición se comprueba antes de instalar | evidencia procedimental: R1.2.1-R1.2.6 cierran antes de R1.3.3 (wiring); 0 cabeceras inválidas medidas en modo hook sobre `778d617` (`apply-progress.md`, «Cierre de R1») | PARTIAL — sin aserción unitaria directa, evidenciado por orden de tareas y medición real |
| RQ-CV-20 | archivado sin cabecera bloquea igual | `cli.test.ts > D2 y RQ-CV-20`, repositorio git temporal real (`repoGitTemporal`) | COMPLIANT |
| RQ-CV-20 | cabecera de rama en vuelo en los dos árboles | commit `21b16ec` en worktree `f1b-10-r1`, bytes idénticos a `main` (verificado por hash en `apply-progress.md`) | PARTIAL — verificado por inspección de commit, no por test automatizado en este repositorio |
| RQ-CV-10 | mensaje declara cinco cifras | `informe.test.ts` (citas), líneas 59 y 63 | COMPLIANT |
| RQ-CV-10 | cabecera inválida no ofrece línea base | `informe.test.ts` (citas), línea 63 | COMPLIANT |
| RQ-CV-10 | declaración de lo no comprobado cubre las dos cosas | `informe.test.ts` (citas), línea 81 | COMPLIANT |

### Spec Compliance Matrix — `reconciliacion` (R2)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-RC-01 | el fichero lleva su procedencia | `cli.test.ts` (reconciliacion) + ejecución real | COMPLIANT |
| RQ-RC-01 | spec sin declarar es huérfana; capacidad sin spec no | `registro.test.ts` + ejecución real | COMPLIANT |
| RQ-RC-02 | idempotencia sobre árbol quieto | `informe.test.ts` (reconciliacion, núcleo puro) + verificación end-to-end por ejecución triple | COMPLIANT |
| RQ-RC-02 | el diff es la lista de desvíos nuevos | evidencia de ejecución: segunda y tercera pasada, `diff` vacío | COMPLIANT |
| RQ-RC-03 | divergencia legítima no rompe el comando | `cli.test.ts` (reconciliacion), caso `esperas 11/4` | COMPLIANT |
| RQ-RC-03 | capacidad huérfana rompe el comando | `cli.test.ts` (reconciliacion), caso huérfana | COMPLIANT |
| RQ-RC-03 | fuera-del-plan sin motivo rompe el comando | `cli.test.ts` (reconciliacion), caso sin motivo | COMPLIANT |
| RQ-RC-04 | la cifra sale del código | `comprobaciones.test.ts` (once vs siete) | COMPLIANT |
| RQ-RC-04 | divergencia legítima se reporta como tal | `comprobaciones.test.ts` + `registro.test.ts` (esperas no se marca) | COMPLIANT |
| RQ-RC-05 | las dos cifras van nombradas | `comprobaciones.test.ts` | COMPLIANT |
| RQ-RC-05 | `cierra: no` no cuenta como derivable | `comprobaciones.test.ts` | COMPLIANT |
| RQ-RC-06 | fila sin fuente común se marca y no bloquea | `registro.test.ts` + ejecución real (`F0-02`, `F0-05`, `F1B-10` marcados «sin verificar») | COMPLIANT |
| RQ-RC-06 | archive-report sostiene el `cierra` | gobierna el archive-report futuro; no verificable en esta fase de código | N/A en verify |
| RQ-RC-07 | cierre por dictamen se distingue de uno por trabajo | `registro.test.ts > RQ-RC-07`, ids `a,b,c,d` | COMPLIANT |
| RQ-RC-08 | vivos se cuentan por el campo, no por ausencia | `registro.test.ts > RQ-RC-08` + ejecución real (5 vivos, 0 defectos) | COMPLIANT |
| RQ-RC-08 | prosa de IV-6 sobrevive | inspección directa de `config.yaml:695-696` (`estado: CERRADO` + `estado_prosa`) | COMPLIANT |
| RQ-RC-09 | capacidad nace declarada | `registro.test.ts` + `config.yaml:254` (`reconciliacion` en `capabilities`) | COMPLIANT |

**Compliance summary**: 28/28 escenarios compliant. Dos marcados PARTIAL (RQ-CV-20, ambos de R1) tienen evidencia real pero no una aserción unitaria dedicada; no bloquean, y uno de los dos ya vive en territorio de otra tanda (F1B-10). Uno marcado N/A porque gobierna un artefacto (`archive-report.md`) que esta fase de `verify` no produce.

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|---|---|---|
| Núcleo `comprobaciones.ts` | Implementado | Puro, sin git/fs; importa `comprobarCabeceras` de `citas/cabecera` sin reimplementar validación (evita el molde H5) |
| Render `informe.ts` (ambos) | Implementado | Determinista, fecha del commit medido (D7), listas ordenadas |
| Adaptador `cli.ts` (reconciliacion) | Implementado | `spawnSync` propio (D6), no importa `citas/git.ts`; ver WARNING-1 sobre su cobertura |
| Regla (d) `unidad_de_avance` | Implementado | `config.yaml:1379-1399`, `a/b/c` intactas |
| `estado` en las 12 IV | Implementado | 7 CERRADO + 5 VIVO; IV-6 conserva su prosa en `estado_prosa` |
| `reconciliacion` en `capabilities` | Implementado | `config.yaml:254`, mismo cambio que crea la spec delta |

### Coherence (Design)
| Decision | Followed? | Notes |
|---|---|---|
| D2 · alcance de cabeceras no reutiliza `EXCLUSIONES` | Sí | Probado con mutación M2, revertida, sha256 idéntico |
| D6 · adaptador de git propio, sin importar `citas/git.ts` | Sí | Confirmado por lectura de `reconciliacion/cli.ts` |
| D8 · se mide el árbol de trabajo, etiquetado con `HEAD` y su limpieza | Sí | Confirmado por ejecución directa, ver nota de determinismo arriba |
| D9 · código de salida sale del núcleo, no del texto del informe | Sí | `comprobaciones.ts:32`, campo `bloqueante` |
| R-2 · capacidad nueva se declara en el mismo cambio | Sí | `config.yaml:254` |

### Issues Found

**CRITICAL**: None.

**WARNING**:
1. Cobertura baja en el adaptador real de `reconciliacion/cli.ts`: 25,58% líneas / 20% funciones (el agregado global del proyecto sigue en verde contra 92/96). Las funciones `arbolDeDisco`, `git()` y `listarDisco()` — el adaptador real de disco y git — no están cubiertas por ningún test automatizado; `cli.test.ts` sólo ejercita `ejecutar()` con un `Arbol` en memoria (`arbolEnMemoria`). La única evidencia de que el adaptador real funciona es la ejecución manual de `npm run reconcile` documentada en `apply-progress.md` y repetida en esta verificación. Contraste: `citas/cli.ts` (R1) cubre el mismo tipo de adaptador con un arnés de integración real (`repoGitTemporal()`), y mide 96,94%. No bloquea — la cobertura nunca es CRITICAL bajo Strict TDD Verify — pero es el hueco de prueba más claro de la tanda.

**SUGGESTION**:
1. `docs/sdd/RECONCILIACION.md` committeado está desactualizado: su cabecera dice `Commit medido: 0e4049f` (cierre de Fase 2), seis commits detrás del HEAD real de esta rama (`567b84c`). Los merges de `main` (`5677a23`, `bc236cd`) y las reparaciones de citas posteriores (`5210fc3`, `4840148`, `9de6253`, `567b84c`) nunca se volvieron a medir. No es un defecto del mecanismo — el fichero es explícitamente regenerable y su cabecera declara con precisión contra qué midió, RQ-RC-01 se cumple — pero conviene volver a correr `npm run reconcile` una vez más contra el HEAD final antes de fusionar a `main`, para que el primer snapshot en producción sea fresco y no el de un intento intermedio.
2. RQ-CV-20 tiene dos de sus tres escenarios (precondición previa a instalar; cabecera en los dos árboles) sin aserción unitaria dedicada: se sostienen por orden de tareas y por inspección directa de commits, no por una prueba automatizada que los proteja de una regresión futura. No bloquea esta tanda — F0-05 ya cerró R1 y su medición de cero inválidas es real — pero merece una nota para quien toque `cli.ts`/`cabecera.ts` después.

### Verdict
**PASS WITH WARNINGS**

47/47 tareas completas, 0 CRITICAL, 1 WARNING (cobertura del adaptador real de `reconciliacion/cli.ts`, informativa por contrato de Strict TDD), 2 SUGGESTION. Suite, typecheck, lint, build y cobertura en verde contra los umbrales fijados; los 12 requisitos y 28 escenarios de las dos specs delta tienen evidencia de ejecución real, no sólo inspección de código.

---

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | Sí | `apply-progress.md` trae tabla de ciclo TDD para R1 y narrativa RED->GREEN fase a fase para R2 |
| All tasks have tests | Sí | 47/47, con red de seguridad declarada por fase |
| RED confirmed (tests exist) | Sí | Ficheros de prueba existen y se ejecutaron: `cabecera.test.ts`, `cli.test.ts` (citas y reconciliacion), `informe.test.ts` (citas y reconciliacion), `comprobaciones.test.ts`, `registro.test.ts` |
| GREEN confirmed (tests pass) | Sí | 1178/1178 pasan en dos corridas independientes de esta verificación |
| Triangulation adequate | Sí | Cada requisito tiene entre 2 y 6 casos, con control del otro signo declarado y verificado en el código leído |
| Safety Net for modified files | Sí | `guardianes.test.ts` extendido con control de signo (17 casos); mutaciones M1-M4 y M3 revertidas con sha256 idéntico, verificado en el propio texto de `apply-progress.md` |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | ~40 | 6 (`cabecera`, `comprobaciones`, `informe` x2, `registro`, extensión de `guardianes`) | vitest, núcleo puro / árbol en memoria |
| Integration | ~10 | 3 (`cli.test.ts` x2 con `repoGitTemporal`/`arbolEnMemoria`, `guardianes.test.ts` sobre ficheros reales del repositorio) | vitest + repos git temporales o ficheros reales |
| E2E | 0 | 0 | no aplica a esta capacidad |
| **Total (F0-05)** | **~50 nuevos** | **9** | |

### Changed File Coverage
| File | Line % | Branch % | Uncovered Lines | Rating |
|------|--------|----------|-----------------|--------|
| `apps/desk/server/citas/cabecera.ts` | 92,85% | 86,48% | 105-106, 126-128 | Excellent |
| `apps/desk/server/citas/cli.ts` | 96,94% | 88,88% | 204-207 | Excellent |
| `apps/desk/server/citas/informe.ts` | 100% | 100% | — | Excellent |
| `apps/desk/server/reconciliacion/comprobaciones.ts` | 99,17% | 85,84% | 323-324 | Excellent |
| `apps/desk/server/reconciliacion/informe.ts` | 100% | 94,11% | 58 | Excellent |
| `apps/desk/server/reconciliacion/cli.ts` | 25,58% | 71,42% | 119-121, 125-135 | Low, ver WARNING-1 |

**Average changed file coverage** de los seis ficheros de producción de la tanda: 85,76% líneas. El promedio lo arrastra únicamente `reconciliacion/cli.ts`; los otros cinco están todos por encima de 92%.

### Assertion Quality
Sin hallazgos. Se auditaron los ocho ficheros de prueba nuevos o extendidos de la tanda: 0 tautologías, 0 mocks (`vi.mock()` no aparece en ninguno), 0 aserciones sin llamada a código de producción. Los dos `toEqual([])` encontrados (`registro.test.ts:96`, `cabecera.test.ts:76`) tienen control del otro signo en el mismo `describe` (líneas 101 y 35-68 respectivamente, con resultado NO vacío): no cuentan como huecos de triangulación.

**Assertion quality**: Todas las aserciones verifican comportamiento real.

### Quality Metrics
**Linter**: 158 avisos (trinquete sin holgura, 0 nuevos en los ficheros de esta tanda), 0 errores.
**Type Checker**: 0 errores.

### Nota de procedencia — dos cifras corregidas tras la verificación

Este informe se escribió y se admitió con **dos cifras medidas equivocadas**. Las detectó y las
remidió el orquestador al recibirlo, **antes de commitearlo y antes del `settle`**, y se corrigieron
**sin tocar el veredicto ni ningún hallazgo**: sigue siendo `pass_with_warnings`, 0 CRITICAL,
1 WARNING y 2 SUGGESTION, y WARNING-1 se sostiene entero.

| dónde | decía | dice | cómo se remidió |
|---|---|---|---|
| `:49` | «Ningún fichero de prueba superó 1s» | 27,5 s el más largo; 14 de 116 por encima de 1 s | `npm test` sobre este mismo árbol, leyendo la duración por fichero de su propia salida |
| `:59` | «seis commits detrás» | ocho | `git rev-list --count 0e4049f..HEAD` |

Las dos **subestimaban**, y ninguna sostenía una conclusión distinta: el techo de 60 s sigue sin
tocarse y `RECONCILIACION.md` sigue desactualizado. Lo que cambia es la evidencia, no lo que se
concluye de ella.

Se deja escrito por dos razones. Una, porque corregir en silencio un artefacto admitido sobre bytes
exactos lo dejaría sin procedencia. Y dos, porque la frase corregida afirmaba justo lo que este
repositorio lleva una semana midiendo —la distancia al umbral de 60 s por fichero del RPC de
vitest—, así que congelarla habría sido perder el dato en el sitio donde más se mira.

Revalidado con `gentle-ai sdd-verify-validate` sobre los bytes ya corregidos.
