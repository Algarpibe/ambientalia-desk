```yaml
schema: gentle-ai.archive-result/v1
change: tercera-puerta-orden-venta
archived_at: 2026-09-17
verify_evidence_revision: sha256:9694e61c26e7657d42c105b671bfca96fecb01f1451fd2f9a23a1161f912d9ab
verify_verdict: pass
requirements_merged: 2
scenarios: 4/4
tasks: 28/28
capabilities:
  - remisiones
  - tickets-core
```

# Informe de archivo — tercera-puerta-orden-venta (desvío IV-4)

**Fase**: `sdd-archive` · **Rama**: `main` · **Capacidades**: `remisiones`, `tickets-core`
**Convención de este informe**: las citas a código van contra la revisión que se nombra en cada una.
Las rutas de los artefactos de esta tanda se dan ya en su ubicación de archivo.

---

## 1 · Qué cerró la tanda

La tercera puerta de «una OV, un ticket». La regla tiene tres puntos de comprobación, y dos estaban
ciegos: `apps/desk/server/services/ticketService.ts:45-49` (alta del ticket, `409` si existe) y
`:132-136` (habilitar servicio, `409` si existe) comprobaban ambas; `apps/desk/server/routes/remision.ts:218-226` (remisión de entrada) **no comprobaba nada y escribía sin guardias**.

**El daño está medido, no conjeturado.** `apps/desk/server/ordenVentaUnTicket.test.ts` en `14b45ee`
fijaba en positivo el modo de fallo: remisión con una orden que **ya pertenece a otro ticket** resultaba en
`201` y la orden en **ambos tickets** por sus dos vías (`:158`). La corrección: `POST /api/remisiones`
ahora comprueba con `ticketConOrdenVenta` por las **DOS vías** (`salesorder_id` y número), **excluyendo
el propio ticket**, **después** del `422` «Orden de venta no encontrada» (`:220`) y **antes** del
`UPDATE` (`:235-239`). Si la orden está en otro ticket, responde `409` y **no escribe nada**.

**Requisito nuevo: `RQ-RE-16`** en `openspec/specs/remisiones/spec.md` en `0f5f49c` (línea 320).
**Commit de construcción: `79cf09b`** (R1, la guarda).

---

## 2 · Fusión de los dos deltas

Dos deltas de esta tanda, medida haciéndola contra el árbol final (commit `0f5f49c` en `main`):

| Fichero | Inserciones | Borrados | Motivo |
|---|---|---|---|
| `openspec/specs/remisiones/spec.md` en `0f5f49c` | 58 | 65 | ADDED `RQ-RE-16` en `§3` (línea 320); REMOVED `§5.1` entera |
| `openspec/specs/tickets-core/spec.md` en `0f5f49c` | 13 | 9 | MODIFIED narrativa `§4.2` para contar IV-4 junto con las dos puertas anteriores |
| **Total** | **71** | **74** | **145 líneas** |

**Coste de aritmética vs. coste real:** estimado por tamaño de bloque, `tickets-core` daba ~80 líneas
(bloque viejo 38, nuevo 42). El coste real es **22** porque git casa muchas líneas idénticas entre el
requisito vivo y su versión del delta. Hacer la fusión y medirla cuesta un minuto.

---

## 3 · HALLAZGO: el detector verde falso de las zonas excluidas

`openspec/changes/archive/` es **una de las SEIS exclusiones** del detector (`apps/desk/server/citas/cli.ts`,
constante `EXCLUSIONES`). Eso genera un riesgo estructural: cuando una carpeta entra en exclusión, citas
que anteriormente se verificaban dejan de contabilizarse de golpe.

**Medido corriendo el detector en los TRES estados del intento, no estimado:**

| Métrica | Punta `67a90c1` | Reparado y fusionado `0f5f49c` | Tras el traslado `fd0d17b` |
|---|---|---|---|
| Citas comprobadas | 1.949 | **1.963** | **1.741** |
| Abreviadas rotas informativas | 12 | 13 | 11 |
| Bloqueantes | 0 | 0 | 0 |
| Línea base | 0 · 0 | 0 · 0 | 0 · 0 |

**Las dos mitades cuentan historias opuestas, y el hook las resume con el mismo 0.** Reparar SUBIÓ las
comprobadas de 1.949 a 1.963: juntar los dos spans partidos hizo verificables diez citas que el regex
nunca había mirado, y eso sacó a la luz una abreviada rota más (12 → 13) que llevaba ahí desde siempre.
El traslado las BAJÓ de 1.963 a 1.741: **−222 de golpe**, ninguna por haberse arreglado.

**La prueba es el RECUENTO, no la anécdota — y el ejemplo que parecía probarlo era FALSO.** La primera
versión de este informe sostuvo que la abreviada de `design.md:124` seguía rota contra
`packages/shared/src/types.ts:224`, una línea vacía. **No lo está, y la corrección queda escrita porque
el error es instructivo.** `design.md:3` lleva `**Árbol:** 14b45ee` y `:13-14` declara que **todas** sus
citas se leen contra esa revisión. Contra ella, `remision.ts:224` es
`[ticketId, ov.number, ov.date ?? null, ov.id],` —el array de parámetros del `UPDATE`— y las dos filas
que lo citan **aciertan**: `:123` dice que `ov.id` es el `$4` y `:124` que `ov.number` es el `$2`.

El detector se equivoca ahí por **DOS motivos a la vez**: atribuye la abreviada a `types.ts` porque
`types.ts:306` es la última cita completa de esa misma línea física, y la lee contra el sha local
ignorando el ancla de cabecera. Es **la misma clase de falso positivo** que este informe ya caza en
`§3a` para `F0-03`, y la lección se repite: una anécdota no prueba un recuento.

**El hallazgo no depende de ese ejemplo y se sostiene solo con las cifras:** 222 citas dejan de
comprobarse de golpe, y en la salida del hook eso es indistinguible de 222 citas reparadas.
**Toda próxima tanda que archive sin reparar antes tendrá el mismo verde engañoso**, sin advertencia.

**La mitigación para esta tanda:** las citas se repararon en este mismo intento de archivo (commit
`fcfd502`, §3a), ANTES del traslado y mientras el detector aún las barría. El traslado las llevó a la
zona muerta ya en buen estado. **Eso mitiga el problema para estas citas concretas; no lo cierra.** Es un riesgo
estructural del detector.

---

## 3a · La reparación de citas (commit `fcfd502`)

**Medida (25 inserciones + 22 borrados = 47 líneas):**

1. **25 citas ancladas por Caso B** a la revisión donde fueron ciertas (con `` en `67a90c1` ``), sin renumerarse.
   La única que queda sin anclar es `openspec/changes/F0-03/decisiones-para-carga.md:187` — correctamente,
   porque su `:478` es del acta, no de `tickets-core`. Es un falso positivo de la regla de atribución.

2. **Dos spans de cita partidos por salto de línea** en `tasks.md` (casillas 2.2 y 2.4). El regex de
   cosecha (`` /`([^`\n]+)`/g ``) no cruza saltos de línea, así que esas **diez citas eran INVISIBLES**
   al detector. Se juntaron en línea física y se partieron en un span por cita.

3. **Una afirmación FALSA en el delta de `remisiones/spec.md:18`**: decía que «`tickets-core` no lleva
   delta». **Los DOS deltas nacieron en el MISMO commit `b99d47a`.** Nació falsa y sobrevivió dos verify.
   Corregida antes de congelarse en el archivo.

4. **Una referencia de ruta ciega**: `apps/desk/server/ordenVentaUnTicket.test.ts:52` nombraba la carpeta
   del cambio como ruta pelada (sin número de línea); `cosecha.ts` la clasifica como `mencion` y una
   mención no se comprueba. Actualizada a la ruta del archivo en `openspec/changes/archive/`.

**Y un TERCER hueco del detector que esto destapa, y que esta tanda NO cierra.** El ancla sólo se lee
**por línea física**: `apps/desk/server/citas/cosecha.ts:63`, `` REVISION_RE = /^s+ens+`([w.-]+)`/ ``,
busca la revisión inmediatamente detrás de la cita. **Un documento que declara su ancla en la CABECERA
queda leído contra el sha local**, cita por cita, como si no tuviera ancla. Los dos artefactos grandes de
esta tanda usan justo esa forma —`design.md:3` (`**Árbol:** 14b45ee`, declarado en `:13-14`) y
`tasks.md:3` (`**Árbol de referencia:** 14b45ee`, declarado en `:4-5`)—, y es lo que produjo el falso
positivo de `§3`. Es hermano de los otros dos ya registrados: el span partido (punto 2 de esta sección) y
el `REVISION_RE` que acepta cualquier palabra detrás de «en» como revisión. **SIN DESTINO ASIGNADO**, y
se dice a propósito: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A.

---

## 4 · La historia del ciclo — cinco intentos, ninguno con reset

| Intento | Objetivo | Resultado | Cambios |
|---|---|---|---|
| 1 · R1-guarda | Construir la tercera puerta + fusión D1 | `passed` | 237 líneas |
| 2 · R2-barrido | Barrido de citas + cierre IV-4 + IV-11 | `passed` | 340 líneas |
| 3 · verify-informe | Verificar R1+R2 | **`failed`** CRITICAL | 0 líneas (sin apply) |
| 4 · R3-corrección | Prueba del escenario 3 de RQ-RE-16 + cita rota | `passed` | 132 líneas |
| 5 · verify-2 | Verificar R1+R2+R3 | **`passed`** | 0 líneas (sin apply) |

**R1, la guarda:** la tercera puerta se construyó siguiendo `design.md` §5 (secuencia de rojos) bajo
`strict_tdd`. Mutaciones M-a y M-b ejecutadas y revertidas. 1131 tests verdes. Commit `79cf09b`.

**R2, el barrido:** 13 líneas de `remisiones/spec.md` recalculadas contra el `remision.ts` real, más las
de `trazas`, `transitions-st`, `F0-01_Correcciones_para_el_maestro`, `F0-00_Baseline_as-built`,
`Puntos_para_Gerencia_2026-09-11`, el plan, `ficha-tecnica-modelo`, `ticketService.ts` y `config.yaml`
(`apply-progress.md`, casilla 2.2). El bloque de la OV creció **14 líneas, no 11 estimadas**, y varias
citas venían ya desfasadas **+29 desde F1B-01**: sólo se vio comparando contenido, no por aritmética. IV-4 cerrado en `CLAUDE.md` (tabla de desvíos, párrafo dedicado) y `openspec/config.yaml` (estado CERRADO, destino de cierre). Detector en 0 bloqueantes. Commit `f367186`.

**El verify de R1+R2, primera pasada, salió `fail` con 1 CRITICAL:** el delta `openspec/specs/remisiones/spec.md:74` declaraba con `SHALL` el escenario «Reenviar la misma orden al propio ticket no se rechaza a sí mismo» (escenario 3 de RQ-RE-16) y **ninguna prueba lo ejercitaba**. El hueco era **de la planificación, no de la ejecución**: las casillas `1.1`–`1.6` de `tasks.md` nunca pidieron una prueba para ese escenario, así que R1/R2 no la saltaron — nunca se les pidió. Commit del verify: `f9c85de`.

**R3, la remediación:** se añadió la casilla que faltaba. Un `it` nuevo en `ordenVentaUnTicket.test.ts`
(líneas 178-205 en `f2a3555`): un ticket cuya orden YA es la que llega la remisión. Afirma `201`, sin
`409`, y el `UPDATE` es no-op (comparación antes/después, no sólo estado). La prueba nace verde porque la
exclusión ya la construyó R1; se verifica por **mutación M-c** (quitar el tercer argumento de
`ticketConOrdenVenta` en `remision.ts:230` → rojo `expected 409 to be 201`). Una cita del delta
(`specs/remisiones/spec.md:79`) estaba incoherente (decía `:223` cuando debería decir `:237`) y se
corrigió. Commit `f2a3555`.

**El verify de R1+R2+R3, segunda pasada:** requisitos 2/2, escenarios 4/4 (antes 3/4), bloqueantes 0,
critical 0. **VEREDICTO: PASS**.

---

## 5 · El presupuesto

Gerencia aprobó `--max-changed-lines 5200` el 2026-09-17, sobre medición en worktree aislado. De las
~4.700 esperadas:

- **4.216 líneas son el `git mv` verbatim** (OCHO artefactos de 2.108 líneas: `apply-progress.md` 261,
  `design.md` 539, `exploration.md` 271, `proposal.md` 283, `specs/remisiones/spec.md` 98,
  `specs/tickets-core/spec.md` 67, `tasks.md` 335, `verify-report.md` 254).
  `git diff --shortstat` da 0; `git diff --shortstat --no-renames` da 4.216. **Carga de revisión: CERO**.
- **422 líneas realmente revisables**: la fusión de los dos deltas (145), la reparación de citas (47) y
  este informe (230). Todo lo demás del intento es traslado verbatim.
- **Gasto real del intento, medido al cerrar:** `git diff --shortstat --no-renames 67a90c1 fd0d17b` =
  2.383 inserciones + 2.180 borrados = **4.563 líneas** contra el techo de 5.200. **Quedan 637 de
  margen**, y el ledger registró esa misma cifra. El commit del traslado por sí solo cuesta **4.421**
  (2.312 + 2.109, medido con `git show --shortstat --no-renames fd0d17b`).
- **Las correcciones POSTERIORES a este cierre no cuentan en esa cifra**, y por eso no la mueven: el
  intento quedó `passed` y `complete` en `fd0d17b`. Las de este informe son trabajo documental directo,
  fuera del ledger.

**Precedente que valida la aritmética:** `detector-citas-extremos` (2026-09-16), fusión commit `8db663c`
(176 líneas reales) + archive commit `2dcb901` (4.326 líneas con `--no-renames`) = **4.502**, exactamente
lo que el ledger registró. Las mismas dos cifras: `--shortstat` dice 0 en traslado puro, `--no-renames`
dice el doble de líneas movidas.

---

## 6 · Evidencia de cierre

| Comprobación | Resultado |
|---|---|
| Detector sobre el sha final `fd0d17b` | **1.741 citas comprobadas**, **0 bloqueantes**, 11 abreviadas rotas informativas, línea base **0 informadas · 0 caducadas**. Sobre `0f5f49c`, antes del traslado: 1.963 comprobadas, 0 bloqueantes (ver §3) |
| `npm test` (concurrencia default) | 1.132 passed / 2 skipped / 0 failed, **pero exit 1** por timeout IPC de workers (`[vitest-worker]: Timeout calling "onTaskUpdate"`) |
| `npm test --maxWorkers=2` | 1.132 passed / 2 skipped / 0 failed, **exit 0** — el timeout es de infraestructura, no defecto de pruebas |
| `npm run typecheck` | exit 0, sin errores |
| `npm run lint` | exit 0, 0 errores, 158 warnings preexistentes `@typescript-eslint/no-explicit-any` (ficheros no tocados) |
| Requisitos cerrados | 2/2 (RQ-RE-16 nuevo, tickets-core 4.2 narrativa) |
| Escenarios cubiertos | 4/4 (antes 3/4; RQ-RE-16 escenario 3 de UNTESTED a COMPLIANT) |
| Tareas completadas | 28/28 (R1: 1.1–1.9; R2: 2.1–2.15; R3: 3.1–3.4) |

---

## 7 · Lo que esta tanda NO cierra

| Qué | Destino | Por qué |
|---|---|---|
| **IV-11** — el sync desasocia a medias (`orden_venta`/`fecha_orden_venta` en `TICKET_COLS`, `salesorder_id` no) | SIN DESTINO ASIGNADO | Es el molde de **H5** (dos implementaciones de la misma noción, ninguna rota por separado). Las cuatro reglas de mutación no lo cazan |
| **IV-8** — `ticketService.ts:39`, el `clientId` de la OV nunca se contrasta | SIN DESTINO ASIGNADO, a propósito | La pregunta viva es TITULARIDAD, no cardinalidad. Nº 52 ya está decidido (`Decisiones_Gerencia_2026-09-10.md:176-181`). IV-8 sigue abierto |
| **El caso (c)** — OV libre + ticket con orden propia distinta, hoy no-op silencioso con `201` | — | Sin requisito a propósito. Cambiar su respuesta es una decisión de UX que nadie pidió |
| **El patrón de `cosecha.ts`** — acepta cualquier palabra como revisión | — | Sigue vivo. Un nombre de función detrás de «en» se lee como ancla |
| **El ancla de CABECERA no se lee** — `cosecha.ts:63`, `REVISION_RE` sólo mira la misma línea física | SIN DESTINO ASIGNADO | Un documento anclado por su encabezado se lee contra el sha local, cita por cita. `design.md:3` y `tasks.md:3` de esta tanda usan esa forma; produjo el falso positivo de `§3`. Detalle en `§3a` y en `openspec/config.yaml` |
| **La medición de Gerencia en producción el 2026-09-16** — divergencia 0 sobre población 1 | F1F-03 (`plan:214`, aceptación con servicios reales) | Con población 1 un duplicado es aritméticamente imposible; ese 0 **no refuta nada**. La remedición natural cae donde la población crece |

---

## Notas de archivamiento

1. **Citas ancladas por Caso B/C no se renumeran.** Van contra revisiones históricas porque afirman lo que
   fue cierto entonces, no hoy. Renumerarlas a la línea de hoy las volvería FALSAS. Ver regla de mutación 4
   de `CLAUDE.md`.

2. **La historia de cinco intentos sin reset.** Gerencia ordenó cambios de alcance (rescope en R2, decisión
   de anclar 6 bloqueantes) pero ninguno fue un `reset` que devolviera contadores a cero. El incremento
   de intentos refleja el trabajo real: planificación incompleta (faltaba escenario 3), hallazgos en
   ejecución (block +14 no +11), y remediación (la prueba que faltaba).
