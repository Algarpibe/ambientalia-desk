```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:daf14080b69784a47a90d0e5dbc5f110f75a72febf90f71fb13dad5e37ec9451
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 15/15
scenarios: 84/84
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:01b11a14e49c41f28e2a70245f5b2b1fa534add19e13f72321c11625caee59fb
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:bbf94611934cd504bb38dc64f25eca8d024fe432f4eb0962ec8acf5fd7496752
```

## Verification Report

**Change**: `verificacion-gas-patron-certificado` (F1A-03, `cierra: si`)
**Version**: N/A (tres deltas: `transitions-equipo-nuevo`, `hojas-vida`, `gases-patron`)
**Mode**: Strict TDD, hybrid. Árbol de `5251896` (lotes `084875c`, `f644027`, `5251896`), rama `main`, sin cambios rastreados sin commitear (los sin trackear de la cabecera de sesión no son del cambio).

### Veredicto: PASS WITH WARNINGS

0 CRITICAL, 5 WARNING, 3 SUGGESTION. `evidence_revision` es el sha256 del sha de HEAD. `test_output_hash` es el sha256 de las dos líneas de resumen de vitest (Test Files 168 passed, 1 skipped, 169; Tests 2363 passed, 2 skipped, 2365), porque la salida completa lleva tiempos que cambian en cada corrida; `build_output_hash` es el del fichero de salida completo.

### Completitud

| Medida | Resultado |
|---|---|
| Casillas de `tasks.md` | 53/53 marcadas (0.1-0.7, 1.1-1.18, 2.1-2.13, 3.1-3.15); ninguna pendiente |
| Tareas de persona P.1-P.4 | Fuera del recuento por la regla del ciclo 1, con dueño, destino y dónde quedan escritas (`tasks.md:252-259`). **Archivar no las da por hechas**; su resultado sigue vacío |
| Requisitos / escenarios | Recontados de los tres `spec.md`: 15 / 84 (`gases-patron` 6/24, `hojas-vida` 3/19, `transitions-equipo-nuevo` 6/41) |

### Ejecución (esta fase, sobre `5251896`)

| Comando | Resultado |
|---|---|
| `npm test` | exit 0 · **168 ficheros pasan + 1 omitido (`migrate.integration.test.ts`, necesita BD real) · 2.363 pruebas pasan + 2 omitidas**. Coincide con el cierre del lote 3 del apply-progress |
| `npm run typecheck` | exit 0, limpio |
| `npm run lint` | exit 0 · **165 avisos, 0 errores** (techo 165 sin holgura: cero avisos nuevos) |
| `npm run build` | exit 0 |
| `git status` al final | sin cambios rastreados: las mutaciones se restauraron byte a byte (el aviso LF/CRLF de git sobre `schema.sql` es de la copia de trabajo, no un cambio) |

### TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | `apply-progress.md` lo da por lote: RED con rojo natural y su mensaje real, «Nacen verdes (declarados)» y mutaciones. No usa la tabla de siete columnas de la plantilla; la información equivalente está en prosa (SUGGESTION 2) |
| All tasks have tests | ✅ | Toda casilla de código lleva su RED en `tasks.md`; los `.tsx` quedan fuera de la red por F0-00 y se cubren con la casilla de la regla 13 |
| RED confirmed (tests exist) | ✅ | Existen los ficheros de prueba del cambio: `gasPatron.test.ts`, `migrate.test.ts`, `db/equipos.test.ts`, `equipos.test.ts`, `equipoNuevo.test.ts`, `guardaGasPatron.test.ts` (36), `certificadoFabrica.test.ts` (19), `invariantesGrafo.test.ts`, `historial.test.ts` |
| GREEN confirmed | ✅ | Todos pasan hoy (2.363 ejecutadas, 0 falladas) |
| Triangulation adequate | ✅ | Tablas de casos por requisito (el veredicto con siete casos, la escalera de la subida con seis posiciones) |
| Safety net for modified files | ✅ | Línea base del lote 1 (165 ficheros / 2.206 pruebas) y recuento de cierre por lote |

**Calidad de aserciones:** sin tautologías, sin bucles fantasma, sin pruebas que no llamen a código de producción. Los `toEqual([])` de `gasPatron.test.ts:157, 168, 171, 172` tienen su pareja con error no vacío en el mismo bloque. **0 CRITICAL, 0 WARNING.**

**Capas:** unitarias puras (`gasPatron.test.ts`, `invariantesGrafo.test.ts`) e integración con pg-mem + `executeTransition` o supertest (`guardaGasPatron`, `equipos`, `db/equipos`, `equipoNuevo`, `certificadoFabrica`, `migrate`). Sin E2E (no hay herramienta). Los `.tsx` sin prueba por decisión de Gerencia; no se propone `jsdom`.

### Mutaciones reproducidas por esta fase

Cada una se aplicó sobre la copia de trabajo, se corrió el fichero de pruebas y se restauró desde copia.

| Mutación | Qué se hizo | Resultado |
|---|---|---|
| **m-1a (posición, lote 2)** | `exigirVerificacion(...)` insertada ANTES del `403` de área (`ticketService.ts:129`) | **ROJO**: `guardaGasPatron.test.ts` · EN08-8 «el 403 de área gana a la guarda de Verificación» (1 de 36) |
| **m-1c (posición, lote 2)** | La misma llamada delante de `:126` (el `409` de origen) | **ROJO**: EN08-7 (por mensaje) y EN08-8 (2 de 36) |
| **m-10a (subida del PDF)** | Quitar la comprobación de `f.mimetype` en `certificadoFabrica.ts:38`, dejando la firma `%PDF-` | **ROJO**: sólo la prueba «m-10a · bytes de PDF declarados como image/png: 415». Confirma lo declarado por el apply: sin esa prueba, el tipo declarado no tenía detector |
| **m-10e (subida del PDF)** | Anular la guarda de `transicionId === null`: subir sin liberación | **ROJO**: «409 sin liberación registrada» y «409 gana a 415» (2 de 19) |
| m-7a (fichero vigilado, lote 1) | `CREATE TABLE IF NOT EXISTS gases_patron` sin `public.` en `schema.sql` | **ROJO**: `migrate.test.ts` · clasificación de tablas, «sentencias con compuesto» y «las seis nuevas van detrás de `prioridad_ajustes`» (3 de 44). Cubre GP02-5 |

Las cinco están revertidas; `git status` sin cambios rastreados.

### Matriz de cumplimiento (84/84)

Cada escenario se localizó por el identificador de la matriz de `tasks.md:232-248` en las pruebas del repositorio y la suite pasa entera. Un escenario es conforme sólo si una prueba que lo cubre pasó en ejecución: así ocurre en los 84.

| Requisito | Esc. | Prueba que lo cubre | Resultado |
|---|---|---|---|
| RQ-GP-01 | 4 | `gasPatron.test.ts` (GP01-1..4) | ✅ |
| RQ-GP-02 | 5 | `migrate.test.ts` (GP02-1..4); GP02-5 por el guardián de clasificación (m-7a reproducida: rojo) | ✅ |
| RQ-GP-03 | 6 | `gasPatron.test.ts` (GP03-1..6) y `guardaGasPatron.test.ts` (GP03-4 en servidor, con reloj simulado) | ✅ |
| RQ-GP-04 | 3 | `gasPatron.test.ts` (GP04-1, 2) y `guardaGasPatron.test.ts` (GP04-3: la consulta no escribe) | ✅ |
| RQ-GP-05 | 2 | `gasPatron.test.ts` (GP05-2) y `guardaGasPatron.test.ts` (GP05-1: `404` del comodín) | ✅ |
| RQ-GP-06 | 4 | `migrate.test.ts` (GP06-1, 2); GP06-3 y GP06-4 por los guardianes `:332-352` (m-7b y m-7c las reprodujo el orquestador en el lote 1) | ✅ |
| RQ-EN-08 | 10 | `guardaGasPatron.test.ts` (EN08-1..9, con las tres de posición); EN08-10 en `invariantesGrafo.test.ts` | ✅ |
| RQ-EN-09 | 7 | `guardaGasPatron.test.ts` (EN09-1..7) | ✅ |
| RQ-EN-10 | 9 | `guardaGasPatron.test.ts` (EN10-1..9; la 9 es de posición) | ✅ |
| RQ-EN-11 | 5 | EN11-1 en `guardaGasPatron.test.ts`; EN11-2..5 en `certificadoFabrica.test.ts` | ✅ |
| RQ-EN-12 | 2 | EN12-1 en `guardaGasPatron.test.ts`; EN12-2 en `migrate.test.ts` | ✅ |
| RQ-EN-01 (mod.) | 8 | EN01-5, 6 en `guardaGasPatron.test.ts`; EN01-8 en `invariantesGrafo.test.ts`; EN01-1..4, 7 son regresión de `invariantesGrafo.test.ts:62-66, :177-181, :200-211` (verdes) | ✅ |
| RQ-HV-13 | 4 | `equipos.test.ts`, `equipoNuevo.test.ts` (HV13-1..4) | ✅ |
| RQ-HV-14 | 7 | `db/equipos.test.ts`, `equipos.test.ts`, `equipoNuevo.test.ts` (HV14-1..7) | ✅ |
| RQ-HV-15 | 8 | `equipos.test.ts` (HV15-1..8; la 6 es de posición) | ✅ |

**Escenarios sin cobertura: ninguno.** Ocho escenarios no llevan su identificador literal en una prueba (GP02-5, GP06-3, GP06-4, EN01-1..4, EN01-7): son de guardián o de regresión de un invariante preexistente y los cubren `migrate.test.ts:266-275` y `:332-352` e `invariantesGrafo.test.ts`. GP02-5 se discriminó aquí con m-7a; los otros los respalda la suite verde y la reproducción del orquestador en el lote 1. Es lectura de la correspondencia, no una prueba por escenario.

### Los cinco criterios de éxito de `proposal.md:204-208`

| Criterio | Evidencia |
|---|---|
| Compuesto con patrón vigente: `409` desde `En Proceso`, pasa desde `Verificación` | EN08-1, EN08-2 |
| Sin patrón vigente (tabla vacía, vencido, no disponible): pasa y `values` guarda el motivo | EN09-1, 2, 3 |
| Desde `Verificación` sin número `422`, con número `200`, sin PDF `200` | EN10-1, EN10-3, EN11-1 |
| Mover la guarda de familia de escalón pone la suite en rojo | m-1a y m-1c reproducidas aquí: rojo |
| `Finalizado` único estado sin salida | `invariantesGrafo.test.ts:65`, `sinSalida` igual a la lista con sólo `Finalizado`, verde |

### Juicio de las tres desviaciones frente a los specs

1. **El número del certificado no se copia a `tickets.custom_fields`** (`ticketService.ts:133`). **CUMPLE.** RQ-EN-10 pide guardarlo «recortado en la transición (`values` de `ticket_transitions`), porque es el certificado de **esa** liberación, no un dato del equipo»; ningún escenario habla de `custom_fields`. Consecuencia ya declarada: el campo del panel no queda bloqueado por `yaLoTraeElTicket`. WARNING (reversible, una sentencia), no defecto. La causa citada, que pg-mem no ejecuta la concatenación jsonb de `repo.ts:307-308`, es una limitación del simulador; que en Postgres real funcionaría es **hipótesis**, no se ejecutó contra una base real.
2. **Tipo del PDF servido fijo; la tabla no guarda `content_type`.** **CUMPLE.** RQ-EN-11 sólo exige la lista blanca `application/pdf`, el `415` y el límite; no pide conservar el tipo. Servir `application/pdf` fijo con `attachment` y `nosniff` (`certificadoFabrica.ts:57-59`) es más seguro que reflejar un tipo guardado, y la firma `%PDF-` se mira en el servidor (`:38`). Se aparta del diseño (servir el tipo guardado) a favor de la matriz de amenazas. WARNING menor.
3. **`gasPatron.ts:83` exige el certificado también con veredicto que bloquea.** **NO CONTRADICE ningún requisito.** El `409` (`ticketService.ts:131`) sale ANTES de calcular `erroresCertificado` (`:134`), así que con veredicto que bloquea el `422` nunca llega a la respuesta: es inobservable. Existe para que la prueba de posición active las dos guardas a la vez (regla de mutación 1), y lo explica el comentario de `:81`. Coherente con RQ-EN-10, que exige el número para «un equipo con compuesto». SUGGESTION 1.

### Coherencia con el diseño

| Decisión | Resultado |
|---|---|
| D-1/D-4 campo `certificado_fabrica` `required: false`, `customField`, `transitions.ts:360` | ✅ `invariantesGrafo.test.ts`, m-5e |
| D-7 el alta ignora el `compuesto` del cuerpo | ✅ HV13-2, HV14-2, m-9d |
| D-8 sólo administrador corrige el compuesto (`403` gana al `422`) | ✅ HV15-5, HV15-6 |
| Una consulta a `gases_patron`, sólo en `liberacion` | ✅ m-11 (recuento de consultas) |
| Escalera de la subida 404 < 400 < 403 < 409 < 415 | ✅ seis posiciones en `certificadoFabrica.test.ts`; m-10e reproducida |
| Regla 13 del cliente decisión a decisión (`apply-progress.md:126-137`) | ✅ ocho filas, cada una con línea de servidor; las líneas citadas existen (`ticketService.ts:131, :133, :134, :155`; `certificadoFabrica.ts:33-38`) |
| Siembra calificada y sin valores inventados | ✅ por lectura (no ejecutada): ningún `UPDATE`/`INSERT`/`ALTER` sin calificar; bloques C y D comentados y marcados `-- [P.1]` |
| Etiquetas del historial (`ETIQUETA_CLAVE_PROPIA`) | ✅ prueba de historial; `Object.hasOwn` evita una clave `constructor` |

### Medida del intento de verify

`git diff --shortstat --no-renames HEAD` antes de escribir este informe: **vacío (0 líneas en ficheros rastreados)**. Lo único nuevo sin trackear de este intento es este fichero: `verify-report.md`, **149 líneas** (`wc -l`). Total del intento: **149**. Sin binarios. Previsión: ~340; techo 800.

### Issues

**CRITICAL:** ninguno.

**WARNING**
1. **Siembra NO ejecutada** (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql`): sin `psql` local; verificada por lectura. Hasta que se ejecute (P.2) con los datos de P.1, ningún equipo tiene compuesto y la guarda no alcanza a nadie.
2. **`.tsx` sin prueba automatizada** (`CertificadoFabricaPdf.tsx`, `TransitionPanel.tsx`): decisión de Gerencia F0-00; cubiertos sólo por la casilla de la regla 13 y por P.4 (manual, tras desplegar).
3. **El lote 1 midió 733**, por encima de la válvula de 720 (`tasks.md:38`) y bajo el techo de 800: se declaró y no se partió. Lotes 2 (594) y 3 (535) dentro.
4. **El camino de producción de la escritura jsonb de `custom_fields` no se ejercitó** contra Postgres real: la desviación 1 lo evita; que funcionaría queda como hipótesis.
5. **Detectores flojos declarados por el apply, confirmados aquí:** la comprobación de `mimetype` no tenía detector hasta añadir una prueba tras la mutación (hoy cubierta, reproducida en m-10a), y `X-Content-Type-Options` en la ruta sobrevive a su mutación porque `helmet` (`app.ts:37`) lo pone igual: defensa en profundidad sin detector.

**SUGGESTION**
1. Aclarar en el comentario de `gasPatron.ts:81` que el `422` con veredicto que bloquea es un invariante de prueba y no comportamiento observable.
2. Que el próximo apply escriba además la tabla de siete columnas de TDD que pide la plantilla.
3. El `archive-report` debe repetir P.1-P.4 como pendientes y decir que archivar no las da por hechas.

### Para el archive

Líneas del `archive-report`: (a) cobertura de `proposal.md:213-216` tal cual; (b) `cierra: si` se sostiene: ninguna exigencia de la fila queda sin destino salvo lo ya declarado fuera (siembra, F1B-02); (c) el compuesto sin traza en `equipos_cambios` (`types.ts:551`) → F1B-02; (d) correcciones C-1, C-5 y C-6; (e) las dos desviaciones de diseño, reversibles; (f) P.1-P.4 sin resultado; (g) nota de despliegue literal de `tasks.md:214-224`. El archive excede 800 y necesita el techo (~6.000) de un mantenedor; la fusión del delta se mide en un worktree, no se estima.
