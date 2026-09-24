```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:eb92055d18899284b2c07d217eacd5f2bc1009b3feabef676be5ca37d5070070
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 18/18
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:4766363f55b7e4dc80649c1058e8fe328e5ea2990639a2f58f001f2d9a26fbfa
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:759a5ba24b24f3a4faed0683ff6033c9c89b09ecb99cd6ff62da33e6d57b3171
```

## Verification Report

**Cambio**: calendario-laboral (F1B-12)
**Version**: HEAD 5e450c9
**Modo**: Strict TDD

### Completeness
| Metrica | Valor |
|---|---|
| Tareas totales | 17 |
| Tareas completas | 17 |
| Tareas incompletas | 0 |
| Datos de persona (fuera del recuento, regla del ciclo 1) | 1 - cierres 2026/2027, dueno Alfonso, INSERT directo, sin fecha; no se da por hecho |

### Build & Tests Execution
**Build**: Pasa - npm run typecheck (tsc -b y tsc -p apps/desk/tsconfig.server.json --noEmit), exit 0, sin salida.

**Tests focales** (los cuatro ficheros del work unit): 65/65
```
npx vitest run packages/shared/src/calendarioLaboral.test.ts apps/desk/server/db/calendarioCierres.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/reconciliacion/registro.test.ts
Test Files  4 passed (4) - Tests  65 passed (65)
```

**Suite completa**: 1321 passed, 2 skipped, 137 ficheros (136 passed, 1 skipped), 0 fallos - npm test, exit 0.

**Lint**: npm run lint -- --max-warnings 165 da 165 problems (0 errors, 165 warnings), exit 0. Los 165 avisos son preexistentes (zoho-sync/src/db, sweep.ts); ningun fichero de esta tanda aparece en la lista.

**Coverage**: no disponible - no se pidio --coverage en el lanzamiento de esta fase.

### Spec Compliance Matrix
| Requisito | Escenario | Prueba | Resultado |
|---|---|---|---|
| RQ-CL-01 | Lunes completo / sabado no cuenta | calendarioLaboral.test.ts, describe horasHabilesEntre, casos 1 y 2 | COMPLIANT |
| RQ-CL-02 | Trasladable no-lunes se mueve | calendarioLaboral.test.ts, describe traslados al lunes, Reyes 2027 | COMPLIANT |
| RQ-CL-02 | Trasladable ya-lunes no se mueve | idem, 29-jun-2026 | COMPLIANT |
| RQ-CL-02 | Fijo no se mueve | idem, 20-jul-2027 | COMPLIANT |
| RQ-CL-03 | 18 fechas de 2026, sin repetidos | calendarioLaboral.test.ts, describe festivosDeColombia 2026 | COMPLIANT |
| RQ-CL-04 | 18 fechas de 2027, sin repetidos | idem, describe 2027 | COMPLIANT |
| RQ-CL-05 | Cierre inyectado resta el dia | calendarioLaboral.test.ts, describe cierres inyectados, caso 1 | COMPLIANT |
| RQ-CL-05 | Sin cierres, solo la ley decide | idem, caso 2 | COMPLIANT |
| RQ-CL-06 | Alta directa en BD aparece en el computo | calendarioCierres.test.ts (listarCierres, orden) mas guardian migrate.test.ts (tabla y calificacion) | COMPLIANT, ver nota |
| RQ-CL-07 | Fin de semana sin festivo = 2h | calendarioLaboral.test.ts, caso viernes-lunes | COMPLIANT |
| RQ-CL-07 | Fin de semana con lunes festivo = 1h | idem, caso Corpus Christi | COMPLIANT |
| RQ-CL-08 | (06-04,06-10] = 3 dias habiles | calendarioLaboral.test.ts, describe diasHabilesEntre | COMPLIANT |
| RQ-CL-09 | Fin menor o igual al inicio da 0 | calendarioLaboral.test.ts, caso fin anterior al inicio | COMPLIANT |
| RQ-CL-09 | Instante fuera de jornada no amplia | idem, caso antes de la jornada | COMPLIANT |
| RQ-CL-10 | UTC de madrugada, dia anterior en Bogota | calendarioLaboral.test.ts, caso 03:00Z | COMPLIANT |
| RQ-CL-11 | Exclusividad, barrido sin coincidencia | verificacion estructural: grep -rniE de habil/festivo fuera del modulo, 0 resultados, ejecutado por esta fase | COMPLIANT estructural |
| RQ-CL-12 | Alta en capabilities y fila F1B-12 en R01.3 | verificacion estructural: config.yaml linea 312, R01.3 seccion G | COMPLIANT estructural |

**Compliance summary**: 18/18 escenarios conformes (16 con prueba en runtime, 2 documentales verificados por lectura, segun lo previsto por la propia spec).

### Correctness (Static Evidence)
| Requisito | Estado | Nota |
|---|---|---|
| Festivos de Colombia 2026/2027, 36 fechas | Implementado | Recalculadas de forma independiente con el algoritmo de Gauss (distinto del Meeus-Jones-Butcher del modulo) en un script del scratchpad: las 36 fechas coinciden exactamente con spec, codigo y pruebas |
| CREATE TABLE public.calendario_cierres | Implementado | schema.sql, calificado; confirmado por lectura |
| Regla 13, modulo unico | Implementado | grep de habil/festivo fuera de calendarioLaboral y calendarioCierres (ts y test.ts): 0 coincidencias |
| Mutacion regla 1, posicion | Confirmado en apply | Orden cierre/festivo/fin de semana invertido, sigue 27/27; interseccion de conjuntos, orden irrelevante |
| Mutacion regla 2, fichero vigilado | Confirmado de forma independiente por esta fase | Copia mutada de schema.sql en scratchpad, quitando el calificador public, mas replica de la logica del guardian: calendario_cierres sale sin clasificar y public.calendario_cierres sale como fantasma; el guardian real (migrate.test.ts) lo detecta |
| Regla de mutacion 4, desplazamiento | Cero desplazamiento | git diff --numstat 9658944 HEAD confirmado por esta fase: schema.sql 12/0, index.ts 1/0, R01.3 20/0 (apendices puros); config.yaml 1/1, migrate.ts 1/1, migrate.test.ts 5/5, registro.test.ts 1/1 (ediciones en su sitio) |

### Coherence (Design)
| Decision | Seguida | Nota |
|---|---|---|
| D1-D4, modulo, DiaCivil, zona, festivos | Si | calendarioLaboral.ts |
| D5, tabla al final, calificada | Si | schema.sql |
| D6, lector sin endpoint | Si | Sin ruta HTTP; grep sin resultados fuera del modulo |
| D7, exclusividad documental | Si | Sin prueba automatica por nombre, por diseno |
| D8, alta en capabilities sin desplazar | Si | config.yaml linea 312, 1/1 |
| D9, fila F1B-12 en R01.3 | Si | Seccion G, apendice puro |
| Hipotesis fecha::text en pg-mem | Falsa, corregida | listarCierres no castea en SQL; normaliza en JS con comoDiaCivil. Ver Issues |

### Issues Found

**CRITICAL**: Ninguno.

**WARNING**:
1. Desviacion de diseno documentada: la hipotesis de design.md sobre fecha::text en pg-mem resulto falsa por ejecucion (cannot cast type date to text). listarCierres se implemento leyendo fecha sin castear y normalizando en JS con getters UTC. No rompe ningun requisito, las dos pruebas de calendarioCierres.test.ts cubren el comportamiento real, pero es una desviacion del diseno original y no solo un detalle de implementacion.

**SUGGESTION**:
1. RQ-CL-06 esta cubierto en sus dos mitades por separado (persistencia y lectura en calendarioCierres.test.ts, calculo con cierres inyectados en calendarioLaboral.test.ts), pero ningun test compone listarCierres directamente como Set de entrada a diasHabilesEntre o horasHabilesEntre; es asi por diseno (D6, YAGNI, sin consumidor en esta tanda). Se recomienda que la primera tanda consumidora (F1B-08) anada esa prueba de composicion.
2. El pie de la spec marca los 36 festivos para contraste contra el calendario oficial de Colombia antes de sdd-apply, responsabilidad del orquestador. Esta fase recalculo las 36 fechas con un algoritmo de Pascua independiente (Gauss) y coinciden exactamente con spec, codigo y pruebas, lo que reduce el riesgo de un error aritmetico, pero no sustituye un contraste contra el decreto oficial colombiano, que sigue pendiente de confirmacion explicita del orquestador.

### TDD Compliance
| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | Si | Tabla completa en apply-progress |
| Todas las tareas tienen pruebas | Si | 5 de 5 filas de la tabla TDD |
| RED confirmado | Si | Ficheros de prueba existen y preceden al codigo (nuevos) o editan el recuento in situ |
| GREEN confirmado | Si | 65/65 focales, 1321/1321 suite completa, cruzado por esta fase |
| Triangulacion | Si | 27 casos en calendarioLaboral.test.ts (recontados por esta fase), 2 en calendarioCierres.test.ts |
| Safety net en ficheros modificados | Si | migrate.test.ts, 21/21 base antes de la tarea 4.1 |

**Assertion quality**: todas las aserciones verifican comportamiento real, sin tautologias, sin bucles fantasma, sin aserciones huerfanas sin caso complementario (el toEqual de lista vacia en calendarioCierres.test.ts tiene su complemento no vacio en el mismo describe).

### Verdict
**PASS WITH WARNINGS** - 12/12 requisitos y 18/18 escenarios conformes, 0 CRITICAL, suite completa y focal en verde, mutaciones de las reglas 1, 2 y 4 confirmadas (la de la regla 2 de forma independiente en esta fase); la unica WARNING es una desviacion de diseno ya corregida y probada, sin impacto en los requisitos.
