```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:2de6d3aae14b0369e8c783a2f73fff4f8cd688ec06a4fc5b2bb059730bb8ee62
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 24/24
test_command: npx vitest run
test_exit_code: 0
test_output_hash: sha256:fc20d2582b7c8a1bc2f69f1cc4ef27dfc7b8a737b3cf6e209c9952117f5c2e9b
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

<!-- evidence_revision = sha256 del SHA completo de 3cc1c25 (3cc1c25375d76f76dcdac408ea641ff5edbb6390), el candidato con las dos pruebas de W1 y W2 (§11). test_output_hash es el de rse-v-run3.log: npx vitest run con salida 0, 301 ficheros y 5.054 pruebas en verde, sin errores. build_output_hash, el de npm run typecheck sobre 3cc1c25 (rse-v-build2.log, misma huella que sobre d2b530b). Las corridas anteriores que salieron 1 lo hicieron SIN ninguna asercion rota (§11). -->

# Informe de verificación — `reloj-sla-esperas` (F1C-06, `cierra: si`)

Verify INDEPENDIENTE, modo `hybrid`, `strict_tdd` activo. Worktree `C:\dev\Desk_2_R1.023-worktrees\reloj-sla-esperas`, HEAD
`d2b530b`, base `db73518`. Todo se comprobó de disco; nada de este informe se tomó de `apply-progress.md` sin contrastarlo.
Logs en `C:\dev\Desk_2_R1.023-worktrees\rse-v-*.log`.

**Veredicto: PASS WITH WARNINGS — 0 CRITICAL, 2 WARNING, 4 SUGGESTION.**

## 1. Completitud

Tareas 1.1-2.8 marcadas (`openspec/changes/reloj-sla-esperas/tasks.md:9-35`). Queda sin marcar `openspec/changes/reloj-sla-esperas/tasks.md:39`
(3.1, verify y archive): es esta fase y la siguiente, no trabajo de código; no cuenta como CRITICAL. La delta trae **5 requisitos
y 24 escenarios** (5 + 7 + 4 + 5 + 3, contados en `openspec/changes/reloj-sla-esperas/specs/tickets-core/spec.md`).

## 2. Ejecución

| Comando | Código | Resultado |
|---|---|---|
| `npx vitest run` (1.ª) | 1 | 300 ficheros en verde, 1 fallido; 5.051 pruebas, 1 fallida: `cli.test.ts`, «Test timed out in 5000ms» ×2. Sola: exit 0 |
| `npx vitest run` (2.ª) | 1 | 301 ficheros, 5.052 pruebas en verde, 11 omitidas; 1 error de trabajador «Timeout calling onTaskUpdate». **Cero aserciones rotas** |
| `npm run typecheck` | 0 | sin salida |
| `npx eslint .` | 0 | 0 errores, 165 avisos (los de partida; no cambia) |

Las dos salidas 1 son carga de la máquina (suite de ~300 s), sin una sola aserción rota; no se escala a CRITICAL. El sobre declara
`test_exit_code: 1` tal cual: no se maquilla. El orquestador decide si repite la corrida para obtener 0.

## 3. Matriz de cumplimiento (requisito → código → prueba)

Rutas desde la raíz del repositorio. Todas las pruebas pasaron en las dos corridas completas y en las 12 corridas de mutación.

| Requisito / escenario | Código | Prueba |
|---|---|---|
| RQ-TC-73 lista de cinco, nombre exacto | `packages/shared/src/relojSla.ts:24-26` | `packages/shared/src/relojSla.test.ts:30` |
| 73 · las seis internas corren | `packages/shared/src/relojSla.ts:38-40` | `packages/shared/src/relojSla.test.ts:35` |
| 73 · Pendiente corre | ídem | `packages/shared/src/relojSla.test.ts:43` |
| 73 · Pendiente de facturar corre | ídem | `packages/shared/src/relojSla.test.ts:48` |
| 73 · el módulo no importa la vista (regla de mutación 2) | `packages/shared/src/relojSla.ts:1` (sólo `import type`) | `packages/shared/src/relojSla.test.ts:58` (guardián que lee el fichero) |
| RQ-TC-74 una pausa no entra en el SLA | `packages/shared/src/relojSla.ts:50-64` | `packages/shared/src/relojSla.test.ts:79` |
| 74 · espera interna sí entra | ídem | `packages/shared/src/relojSla.test.ts:83` |
| 74 · sin pausas, total = SLA | ídem | `packages/shared/src/relojSla.test.ts:88`, `:95` |
| 74 · pausa abierta sólo crece el total | `packages/shared/src/relojSla.ts:58-61` | `packages/shared/src/relojSla.test.ts:104` |
| 74 · terminales no cuentan | `packages/shared/src/relojSla.ts:57` | `packages/shared/src/relojSla.test.ts:115` |
| 74 · desordenada da lo mismo | `packages/shared/src/relojSla.ts:54` | `packages/shared/src/relojSla.test.ts:122` |
| 74 · vacía = sin dato | `packages/shared/src/relojSla.ts:51` | `packages/shared/src/relojSla.test.ts:150` |
| RQ-TC-75 se juntan las dos épocas | `apps/desk/server/db/relojSla.ts:42-58` | `apps/desk/server/relojSla.test.ts:62`, `:94` |
| 75 · historia que no llega = `null` | `apps/desk/server/db/relojSla.ts:58` | `apps/desk/server/relojSla.test.ts:77`, `:110` |
| 75 · sin ninguna entrada = `null` | `apps/desk/server/db/relojSla.ts:47` | `apps/desk/server/relojSla.test.ts:81`, `:118` |
| 75 · número fijo de consultas | `apps/desk/server/db/relojSla.ts:75-85` | `apps/desk/server/relojSla.test.ts:160` (10 y 100) |
| RQ-TC-76 SLA y total en días de 9 h | `packages/shared/src/analisis.ts:99-103` | `packages/shared/src/analisis.test.ts`, describe nuevo desde `:54` |
| 76 · sin dato no entra | `packages/shared/src/analisis.ts:65` | ídem, «sin dato no entra… pero sí en tiempoPromedioDias» |
| 76 · ninguno con dato = `null` | `packages/shared/src/analisis.ts:99-103` | ídem, «ninguno con dato da null» |
| 76 · un anulado no entra | `packages/shared/src/analisis.ts:59` | ídem, «un anulado no entra… RQ-TC-71» |
| 76 · `tiempoPromedioDias` no cambia | `packages/shared/src/analisis.ts:82` | ídem, «valen lo que valían» + `apps/desk/server/analisis.test.ts` sin tocar |
| RQ-TC-77 la alarma sigue midiendo | `packages/shared/src/sla.ts:32-35` (no editado) | `packages/shared/src/relojSla.test.ts:161` |
| 77 · las alarmas no leen la lista | `packages/shared/src/sla.ts` y el cálculo de alarmas, sin el import | `packages/shared/src/relojSla.test.ts:171` (guardián; mutado en el apply, M11) |
| 77 · tablero e indicadores no cambian | **CARACTERIZACIÓN**: el diff no toca el tablero, la ficha de cliente ni los indicadores | sin prueba propia: las suites de hoy en verde |

Notas: `getAnalisisRows` se cablea en `apps/desk/server/analisis.ts:22` y `:30` (prueba `apps/desk/server/relojSla.test.ts:185`).
El tercer escenario de RQ-TC-77 es caracterización (verde de partida). **23 de 24 escenarios por prueba y 1 por caracterización.**

## 4. Cumplimiento TDD (strict)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Tabla de evidencia | OK | `openspec/changes/reloj-sla-esperas/apply-progress.md:10-15` y `:88-92` |
| Ficheros de prueba existen | OK | 3 de 3 (`relojSla.test.ts` en shared y en servidor, `analisis.test.ts` ampliado) |
| VERDE confirmado | OK | las tres suites pasan hoy (§2) |
| ROJO visto | WARNING | 2.3 (`getAnalisisRows`) sin rojo previo, declarado por el apply (`apply-progress.md:91`); 1.4 sin prueba (texto en sitio, vigilado por `comentariosVigilados.test.ts`) |
| Triangulación | OK | 22 + 9 + 18 pruebas con valores distintos (9/18, 27/27, 36, 10 h → 1,1) |
| Aserciones | OK | sin tautologías ni bucles fantasma: los `for` de `packages/shared/src/relojSla.test.ts:31` y `:36` recorren constantes no vacías |

Capas: unitarias sobre funciones puras y pg-mem; ninguna de integración HTTP ni E2E nueva (la ruta no cambia). `Analisis.tsx` queda
fuera de la red por F0-00: lo cubre `npm run typecheck`.

## 5. Mutaciones propias (distintas de las del apply) — `rse-v-mut.json` / `rse-v-mut.log`

Todas restauradas (`restaurado=true`; `git status` sin cambios de código al final).

| Id | Mutación | Resultado |
|---|---|---|
| V0 | sin cambio | verde, 55 pruebas |
| V1 | `paraElReloj` siempre `false` | ROJO, 10 |
| V2 | quitado el recorte a `hasta` | ROJO, 1 (tramo posterior a `hasta`) |
| V3 | el tramo terminal suma al total pero no al SLA | ROJO, 14 |
| V4 | `diasMedios` con `Math.floor` en vez de `Math.round` | **SOBREVIVIÓ** (12 verdes) |
| V5 | `&&` → `\|\|` al admitir un ticket en las medias | ROJO, 1 |
| V6 | `secuenciaDelReloj` acepta `hacia` nulo | **SOBREVIVIÓ** (18 verdes) |
| V7 | `getAnalisisRows` ignora `ahora` | ROJO, 1 |
| V8 | dividir entre 24 en vez de 9 | ROJO, 6 |
| V9 | ordenación invertida | ROJO, 14 |
| V10 | compara el estado actual con el PRIMER paso | ROJO, 10 |
| V11 | ignora la foto de creación | ROJO, 1 |

**Dos supervivientes, ninguno equivalente** (ver W1 y W2).

## 6. Regla invariable 13 — cliente, línea a línea

`git diff db73518 d2b530b -- apps/desk/src/components/Analisis.tsx` son tres líneas: `apps/desk/src/components/Analisis.tsx:94`
(rejilla, maquetación), `:99` y `:100` (dos `Kpi` que sólo pasan `data.tiempoSlaPromedioDias` y `data.tiempoTotalPromedioDias`).
`apps/desk/src/components/Analisis.tsx:19` pinta «—» ante `null` y es el único condicional: no filtra, no calcula, no decide.
Contrapartidas del servidor: lista y tiempos en `packages/shared/src/relojSla.ts:24` y `:50`; medias, contador y `null` en
`packages/shared/src/analisis.ts:65` y `:99`; acceso en `apps/desk/server/routes/analisis.ts:11` (`requireSuperAdmin`).
**Regla 13 cumplida.** El bundle lo midió el apply (principal con 0 bytes de diferencia); no se repitió aquí.

## 7. Regla de mutación 4 — barrido de citas

| Fichero | `git diff --numstat` | Lectura |
|---|---|---|
| `packages/shared/src/estados.ts` | 6 / 6 | en sitio |
| `packages/shared/src/types.ts` | 2 / 2 | en sitio |
| `apps/desk/server/analisis.ts` | 4 / 4 | en sitio |
| `packages/shared/src/analisis.ts` | 12 / 4 | 4 en sitio y 8 de `mediasDelReloj` al final; nada se desplaza |
| `packages/shared/src/index.ts` | 1 / 0 | añadido al final |

Citas vivas contrastadas con el fichero: `packages/shared/src/estados.ts:59` (`CLASIFICACION_EN_ESPERA`) y `:120` (`ESTADOS_EN_ESPERA`);
`packages/shared/src/types.ts:566` y `:580` (`Analisis`), `:581` y `:592` (`AnalisisRow`); `packages/shared/src/analisis.ts:17`
(`computeAnalisis`), `:59` (condición de cerrados) y `:95` (cierre); `apps/desk/server/analisis.ts:11` (`getAnalisisRows`) y `:17`
(`LEFT JOIN clients`); `apps/desk/server/routes/analisis.ts:11` y `:14`. Todas aciertan. Las del maestro
(`R08.4.md:1816`, `:1877`, `:1878`, `:4655`), `openspec/config.yaml:1909-1915` y `packages/shared/src/calendarioLaboral.ts:174` dicen lo que la delta
afirma. Un ejemplo de cita rota se escribe en prosa: «la línea 206 de este fichero» no es una cita.

## 8. Coherencia con el diseño

Sin desviaciones: D1 (lista propia, sólo `import type`), D2 (comentarios), D3 (tres consultas fijas, ninguna sin cerradas), D4 (cuatro
cambios en sitio), D5 (`mediasDelReloj`), D6 (dos `Kpi`), D9 (tabla de regla 13). Los supuestos S-D1 (sólo cerrados) y S-D2 (cerrado en
estado no terminal = `null`) están implementados y probados (`apps/desk/server/relojSla.test.ts:124` y `:131`).

## 9. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W1 — CERRADA en `3cc1c25` (V4 ya cae, ver §11). El sentido del redondeo de las medias no estaba fijado** (V4 sobrevivió). La única prueba de decimales usa 10 h / 9 = 1,11…
  (`packages/shared/src/analisis.test.ts`, «el resultado va a un decimal»), donde `Math.round` y `Math.floor` dan 1,1. Falta un caso como
  15 h (1,666…: 1,7 redondeado, 1,6 truncado). `tiempoPromedioDias` usa `Math.round` (`packages/shared/src/analisis.ts:82`), así que el
  reloj podría divergir en silencio. Una prueba más lo cierra.
- **W2 — CERRADA en `3cc1c25` (V6 ya cae, ver §11). La guarda `!e.hacia` de `secuenciaDelReloj` no tenía prueba** (V6 sobrevivió). La prueba de `apps/desk/server/relojSla.test.ts:84`
  pasa un `de` nulo, no un `hacia` nulo. Sin la guarda, un destino nulo en medio de la secuencia entra como estado `null`, que
  `paraElReloj` trata como «corre»: contaría como SLA. Probablemente inalcanzable (`to_status` de la app es obligatorio), pero es
  defensa sin vigilante.

### SUGGESTION
- **S1 (obs. a) — sin comprobación de continuidad** (`de` de una entrada = `hacia` de la anterior). Un hueco entre la historia de Zoho
  (traída una vez) y la de la app atribuye el intervalo al estado anterior. No viola RQ-TC-75, que sólo exige que el último estado sea
  el actual (`apps/desk/server/db/relojSla.ts:58`). Es calidad de dato en la costura; hacerlo estricto sería un cambio de alcance (S-5).
- **S2 (obs. b) — `[...arr, r]` es cuadrático por ticket** (`apps/desk/server/db/relojSla.ts:90` y `:95`). Los arreglos son de decenas
  de entradas por ticket y el total es lineal en tickets; irrelevante hoy. `push` lo evita sin riesgo.
- **S3 (obs. c) — citas a `estados.ts` de la propia carpeta del cambio.** `openspec/changes/reloj-sla-esperas/specs/tickets-core/spec.md:22`
  cita `estados.ts:26-30` y `:117-118` como el texto de ANTES (en `6a4f76e`); hoy el comentario nuevo ocupa `packages/shared/src/estados.ts:30-33`
  y `:117-118`. Al fusionar la delta en `openspec/specs/tickets-core/spec.md` conviene nombrar la revisión (caso B de la regla de mutación 4).
  Los comentarios de hoy ya no afirman que el reloj para en los tres bodegajes. **Atendida:** la delta cita ya `estados.ts:30-33` y `:117-118` en `db73518` (§11).
- **S4 — RQ-TC-77 tablero/indicadores es sólo caracterización:** vale mientras el diff no toque esos ficheros; es coherente con D7,
  pero un cambio futuro en esas vistas no tendrá aquí un vigilante.

## 10. Veredicto

**PASS WITH WARNINGS.** 5/5 requisitos, 24/24 escenarios cubiertos (23 por prueba y 1 por caracterización). 0 CRITICAL, 2 WARNING,
4 SUGGESTION. Siguiente: `sdd-archive`; W1 y W2 no bloquean, pero cada una se cierra con una sola prueba si el orquestador prefiere
endurecerlas antes. No se editó código, pruebas ni artefactos fuera de este informe y de los logs.

## 11. Corrección tras el verify (orquestador, `3cc1c25`)

- **W1:** prueba al final de `packages/shared/src/analisis.test.ts` («la media se redondea al decimal más cercano, no se trunca»,
  15 h ⇒ 1,7). V4 (`Math.floor`) repetida: `exit=1`, 1 roja, `restaurado=true`.
- **W2:** `describe` al final de `apps/desk/server/relojSla.test.ts` (una etapa intermedia sin `toStatus` deja el ticket sin dato).
  V6 (quitar `!e.hacia`) repetida: `exit=1`, 1 roja, `restaurado=true`. Registro fuera del repositorio: `rse-v-mut-b.log`.
- **S3:** `openspec/changes/reloj-sla-esperas/specs/tickets-core/spec.md:22` cita ya `estados.ts:30-33` y `:117-118` en `db73518`.
- **Las corridas de la suite completa.** Sobre `d2b530b` y `3cc1c25`, `npx vitest run` salió 1 diez veces SIN ninguna aserción
  rota: por «Test timed out in 5000ms» de `apps/desk/server/citas/cli.test.ts` (sola pasa) o por «[vitest-worker]: Timeout calling
  "onTaskUpdate"». **`main` (`db73518`, sin este cambio) sale igual ese mismo día** (5.003 en verde y 1 error del trabajador): es el
  entorno, no el cambio. La undécima, sobre `3cc1c25`, salió 0 con 5.054 en verde, y es la que fija el sobre. S1, S2 y S4 quedan como
  sugerencias, sin cambio.
