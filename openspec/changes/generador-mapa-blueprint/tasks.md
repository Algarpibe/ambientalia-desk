# Tasks — `generador-mapa-blueprint` (F1A-06)

**Fase:** `sdd-tasks` · **Árbol:** worktree `f1a-06-r1`, base `main` en `125ae3e`. **Toda cita
`ruta:línea` de este documento se lee contra `125ae3e`** (regla de mutación 4, `CLAUDE.md`); en cuanto
la Unidad B añada líneas a `package.json`/`index.ts`, las citas de ese fichero pasan a leerse contra el
árbol de cierre de B, no contra `125ae3e` (se anota en cada tarea afectada). **Entradas:**
`proposal.md`, `design.md`, `specs/mapa-blueprint/spec.md`, `specs/transitions-st/spec.md` de esta misma
carpeta.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (autoría, additions+deletions) | A ~230–290 · B ~480–560 · C ~150–180 — R-2/`capabilities` ya escrita en `sdd-spec`, C sólo NOTA.md + entrada 17; `apply-progress.md` de cada unidad ya incluido. Un solo intento fusionando las tres rozaría **~860–1.030**, pero el plan ya las separa en tres intentos SDD distintos, así que la cifra relevante es la de cada intento, no la suma. Los cuatro `.md` generados (~200–260) **no cuentan** en este presupuesto de revisión — excluidos por convención (`sdd-phase-common.md` §E); sí cuentan en el ledger de `sdd-attempt` vía `wc -l` |
| Riesgo de presupuesto de revisión (techo **800** — `openspec/config.yaml:29`, `session_preflight.review_budget_lines`, NO 400; corregido tras señalarlo el analista, mismo incidente que `CLAUDE.md` ya documenta con fecha 2026-09-10) | **Bajo** en las tres unidades por separado: A (~230–290), B (~480–560) y C (~150–180) quedan todas por debajo de 800, individualmente y en cualquier combinación de dos. Sólo la suma de las TRES en un solo intento (~860–1.030) rozaría el techo, y el plan no propone eso |
| Intentos SDD encadenados recomendados | No hace falta decisión de troceo ni `size:exception` — cada unidad (A, B, C) cabe sola bajo 800 |
| Corte sugerido | Intento 1 «datos y motor» (A) → Intento 2 «generador, CLI y artefactos» (B) → Intento 3 «cierre documental» (C), tal como ya separa este `tasks.md` |
| Delivery strategy | ask-on-risk — no se dispara: ningún intento excede el techo real |
| Chain strategy | N/A — no son PRs encadenados, son intentos SDD secuenciales en la MISMA rama `f1a-06-r1` (regla del ciclo 2, `CLAUDE.md`), mismo molde que `fechas-derivadas-servidor` (F1A-07) |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A
800-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Likely intento | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| A · datos y motor | `fasesBlueprint.ts` (D-1) + P-2 en `transitions.ts` (en sitio) + derivación en `estadoPorRemision.ts` (delta 0) + invariante 5b invertido; verificable sin B | Intento 1 | `npx vitest run packages/shared/src/fasesBlueprint.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/db/estadoPorRemision.test.ts` | `npm test` completo — arnés `pg-mem` + `migrate()` (`estadoPorRemision.test.ts:1-3`), sin credenciales Zoho | `git revert` del commit de A — sin migración ni dato en base; `transitions.ts:150-151` y `estadoPorRemision.ts` vuelven a su forma de hoy con delta de líneas cero (propuesta §12) |
| B · generador, CLI, artefactos | `mapaBlueprint.ts` puro, `scripts/generar-mapa-blueprint.ts`, los cuatro `.md` y la prueba anti-desfase con sus dos mutaciones | Intento 2 | `npx vitest run packages/shared/src/mapaBlueprint.test.ts` | N/A — módulo puro sin `fs`/proceso (RQ-MB-01); la CLI es la única I/O y queda sin prueba propia por decisión de diseño (`design.md` §9, «Dónde vive la prueba») | `git revert` del commit de B — borra `mapaBlueprint.ts`, la CLI, los cuatro `.md` y la entrada de `package.json`; no toca A |
| C · cierre documental | `NOTA.md` §3/§6, entrada 17 del maestro; `mapa-blueprint` en `capabilities` (R-2) YA escrita en `sdd-spec` — sólo verificación (C.3.1) | Intento 3 (o fusionado con B) | N/A — cambios de documentación, sin prueba automática | N/A — documentación, no código ejecutable | `git revert` del commit de C — no toca código ni specs vivas |

---

## Unidad A · datos y motor

### Fase A.1 — `packages/shared/src/fasesBlueprint.ts` (nuevo, D-1/P-3)

- [ ] A.1.1 **RED.** Crear `fasesBlueprint.test.ts`: (a) `Object.keys(FASE_POR_ESTADO)` ordenado ===
  `[...ESTADOS].sort()` (`estados.ts:112`); (b) recuento 4/12/5 de `design.md` §7; (c) las tres
  asignaciones no mecánicas citadas por línea (`Ingresado`→`entrada`; `Pendiente`→`diagnostico`,
  `estados.ts:101-105`; los cuatro de `ESTADOS_SIN_SALIDA`→`diagnostico`, `estados.ts:151-160`) (~35
  líneas). Confirmar rojo, registrar en `apply-progress.md`.
- [ ] A.1.2 **GREEN.** Crear `fasesBlueprint.ts`: `FaseId`, `Fase`, `FASES` (M1.3.1, `R08.2.md:1187-1191`)
  y `FASE_POR_ESTADO = {...} satisfies Record<Estado, FaseId>` (contratos de `design.md` §3), tabla de
  §7 (~55 líneas). Correr A.1.1, confirmar verde.
- [ ] A.1.3 **Mutación del guarda de COMPILACIÓN (D-1, riesgo #5 — la primera de las dos guardas).**
  Quitar temporalmente una clave de `FASE_POR_ESTADO`, correr `npm run typecheck` en solitario, confirmar
  error de `tsc` por `satisfies` incompleto. Revertir, confirmar verde. Registrar comando y salida. **La
  guarda de EJECUCIÓN (`throw` del generador) es tarea de la Unidad B (B.1.2): vive en `mapaBlueprint.ts`,
  no aquí — las dos hacen falta y no son la misma (`design.md` D-1).**
- [ ] A.1.4 Añadir `export * from './fasesBlueprint'` a `packages/shared/src/index.ts:18` (EOF, +1 línea,
  no desplaza `:1-17`).

### Fase A.2 — P-2: `transitions.ts:150-151` gana `from`/`to`

- [ ] A.2.1 **RED.** Reescribir `invariantesGrafo.test.ts:120-127` (el `it` de 5b) con el texto exacto de
  `design.md` §6 (8 líneas, cita textual, no rederivar), y `:108-119` (comentario, 12 líneas) con la
  explicación de qué deja de afirmar 5b y qué gana — total **20 líneas exactas** para no mover `:137` y
  lo que sigue. Añadir `STATUS_TICKET_CREADO, STATUS_REMISION_CREADA` a `:3` (lista ya multi-nombre, sin
  insertar línea). Correr `npx vitest run packages/shared/src/invariantesGrafo.test.ts -t 5b`, confirmar
  rojo contra el código de hoy.
- [ ] A.2.2 **GREEN.** Editar `transitions.ts:150-151` en sitio, texto ANTES/DESPUÉS exacto de
  `design.md` §4 (orden `id · name · from · to · area`). Confirmar `wc -l transitions.ts` idéntico antes/
  después.
- [ ] A.2.3 Correr A.2.1, confirmar verde; correr `invariantesGrafo.test.ts` completo, confirmar
  invariantes 1-6 en verde.

### Fase A.3 — `estadoPorRemision.ts` deriva de la declaración (delta 0)

- [ ] A.3.1 Editar `apps/desk/server/db/estadoPorRemision.ts` en sitio, las siete líneas exactas de
  `design.md` §5 (10, 11, 41, 49, 50, 56, 57 — incluido `.some(...)` en `:41`, no `.includes` por el
  tipado de `actual`). Confirmar `wc -l` idéntico antes/después.
- [ ] A.3.2 Correr `estadoPorRemision.test.ts` (arnés `pg-mem`+`migrate()`), confirmar las **mismas
  aserciones de hoy, sin tocar ninguna**, en verde — criterio 6 de la propuesta §7.

### Fase A.4 — Cierre de la Unidad A

- [ ] A.4.1 **Barrido de la regla de mutación 4 sobre `invariantesGrafo.test.ts` (riesgo #1, ausente en
  la propuesta).** `grep -rnoE "invariantesGrafo\.test\.ts:[0-9]+(-[0-9]+)?"` sobre todo el árbol final,
  excluyendo `openspec/changes/archive/`; comprobar cada resultado leyendo qué afirma. Reparar por caso
  A/B/C, nunca renumerar en bloque. El orquestador midió ~28-36 ocurrencias antes de esta tanda; remedir,
  no copiar.
- [ ] A.4.2 `npm run test:coverage`: confirmar `packages/shared/src/**` sobre `92/92/96/78`
  (líneas/statements/funciones/ramas, `vitest.config.ts:58-63`) con `fasesBlueprint.ts` incluido.
- [ ] A.4.3 `npm test`, `npm run typecheck`, `npm run lint`, en solitario, verdes.
- [ ] A.4.4 Cerrar `apply-progress.md` de A: evidencia RED/GREEN de A.1.1/A.2.1, mutación A.1.3 con su
  reversión, resultado de A.4.1, `git diff --shortstat --no-renames` contra el commit base del intento 1
  + `wc -l` de lo nuevo sin trackear.
- [ ] A.4.5 Commit de la Unidad A (conventional commit), antes del `sdd-attempt settle` del intento 1.

---

## Unidad B · generador, CLI, artefactos

### Fase B.1 — `packages/shared/src/mapaBlueprint.ts` (nuevo, motor puro)

- [ ] B.1.1 **RED (esqueleto).** Crear `mapaBlueprint.ts` con las firmas exactas de `design.md` §3
  (`PasoSinBoton`, `EntradaMapa`, `generarMapaBlueprint`), cuerpo trivialmente incorrecto. Crear
  `mapaBlueprint.test.ts` con los escenarios puros de `spec.md`: RQ-MB-02 (38 aristas, 3 desde
  `habilitar_servicio`), RQ-MB-03 (`Object.keys(...)` con 4 claves), RQ-MB-04 (frontera en las dos vistas
  cuando `fasePorEstado[from] !== fasePorEstado[to]`), RQ-MB-05 (leyenda, 3 áreas base + 1 compartida con
  dos marcas) (~150 líneas). Confirmar rojo por aserción.
- [ ] B.1.2 **RED — guarda de EJECUCIÓN de D-1 (riesgo #5, la segunda guarda).** Escenario RQ-MB-04 "un
  estado sin fase bloquea la generación": invocar `generarMapaBlueprint` con `fasePorEstado` **inyectado**
  al que falta una clave real de `ESTADOS`, esperar `throw` — es la única de las dos guardas de D-1 que
  una prueba puede poner en rojo, y vive aquí porque el `throw` está en el generador (~15 líneas).
  Confirmar rojo (el esqueleto de B.1.1 aún no lanza).
- [ ] B.1.3 **GREEN.** Implementar `generarMapaBlueprint` completo (`design.md` D-3/D-4/D-5/D-6): una
  arista por elemento de `from` (P-1); `conBoton` derivado, nunca declarado (D-4); orden determinista —
  nodos por `ESTADOS`, aristas por orden de `TRANSITIONS` + las 2 sin botón (D-5)—; alias `eNN` por
  posición; `state "Nombre" as eNN` para los seis estados con espacio/tilde/`.`/`/` (D-6); marca de área
  por `areasForTransition` (`transitions.ts:313-315`) en la etiqueta; vistas por fase con frontera
  anotada (§7); leyenda de área en el completo; cabecera "generado, no editar" en los cuatro (~200-230
  líneas).
- [ ] B.1.4 Correr B.1.1 y B.1.2 completos, confirmar verde en los escenarios puros y en el `throw` de la
  guarda de ejecución.

### Fase B.2 — CLI + primer volcado a disco

- [ ] B.2.1 Crear `scripts/generar-mapa-blueprint.ts`: importa `generarMapaBlueprint` y sus fuentes,
  itera `Object.entries(...)`, `writeFileSync` bajo `docs/artefactos/`. Sin lógica de grafo, sin prueba
  propia (RQ-MB-01) — la CLI vive fuera de `vitest.config.ts:17-20`, no se ejecutaría nunca en silencio
  (~20 líneas).
- [ ] B.2.2 `package.json`: añadir el script como **última entrada de `scripts`**, tras `"test:coverage"`
  (hoy `:24`) (+1 línea). Ejecutar `npm run <script>`, confirmar los cuatro
  `docs/artefactos/blueprint-*.md` creados y árbol limpio en una segunda ejecución (criterio 1, propuesta
  §14).
- [ ] B.2.3 **Reparación de citas (riesgo #2).** El `+1` desplaza `package.json:57`→`:58`. Reapuntar
  `openspec/config.yaml:60` y `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:221`, comprobando primero
  qué afirman (regla de mutación 4). `proposal.md:128` (cita `package.json:43`) es caso B: no se
  renumera, sigue siendo cierta de `125ae3e`.
- [ ] B.2.4 Añadir `export * from './mapaBlueprint'` a `packages/shared/src/index.ts:19` (EOF, +1 línea).

### Fase B.3 — RQ-MB-06: prueba anti-desfase, mutación sobre el fichero vigilado

- [ ] B.3.1 Añadir a `mapaBlueprint.test.ts` el diff de cadenas contra disco —
  `new URL('../../../docs/artefactos/…', import.meta.url)`, regenerar desde el import real, comparar con
  los cuatro `.md` commiteados tras B.2.2 (~30 líneas). Nace VERDE (B.2.2 ya generó los ficheros
  correctos); el rojo lo dan las dos mutaciones siguientes.
- [ ] B.3.2 **Mutación (regla de mutación 2, `CLAUDE.md`): ensuciar el fichero VIGILADO.** Editar a mano
  una línea de `docs/artefactos/blueprint-completo.md` commiteado, correr B.3.1, confirmar rojo con la
  diferencia señalada. Revertir (`git checkout -- docs/artefactos/blueprint-completo.md`), confirmar
  `git diff` vacío. Mutar sólo el generador **no** vale como esta prueba (RQ-MB-06).
- [ ] B.3.3 **Mutación — transición añadida sin regenerar.** En la prueba, construir un `EntradaMapa` con
  una transición sintética añadida y comparar contra los `.md` commiteados (no contra la salida fresca),
  confirmar rojo.
- [ ] B.3.4 Registrar en `apply-progress.md` las dos salidas rojas de B.3.2/B.3.3 con comando exacto.

### Fase B.4 — Cierre de la Unidad B

- [ ] B.4.1 `npm run test:coverage`: confirmar `packages/shared/src/**` sobre `92/92/96/78` con
  `mapaBlueprint.ts` incluido; si una rama de las vistas por fase o la leyenda compuesta queda sin
  ejercitar, añadir el caso que falte antes de cerrar.
- [ ] B.4.2 Verificar por aserción, no por lectura: el diagrama completo tiene exactamente **38**
  aristas, **3** con origen `habilitar_servicio`, **2** marcadas sin botón (criterio 2, propuesta §14).
- [ ] B.4.3 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, en solitario, verdes
  (criterio 4, propuesta §14).
- [ ] B.4.4 Cerrar `apply-progress.md` de B: evidencia RED/GREEN de B.1.1/B.1.2, mutaciones B.3.2/B.3.3
  con salidas exactas, resultado de B.4.1/B.4.2, `git diff --shortstat --no-renames` contra el commit de
  cierre de A + `wc -l` de lo nuevo sin trackear (los cuatro `.md` generados entran aquí, no en el
  presupuesto de revisión).
- [ ] B.4.5 Commit de la Unidad B (conventional commit), antes del `sdd-attempt settle` del intento
  correspondiente.

---

## Unidad C · cierre documental

### Fase C.1 — `docs/artefactos/NOTA.md`

- [ ] C.1.1 Reescribir §3 (`:32-46`, "NO HAY GENERADOR") declarando que el generador existe desde esta
  tanda, con la ruta del módulo y la CLI. No retirar la evidencia histórica de que no existía antes de
  F1A-06 (regla de mutación 4, caso B para la frase que fue cierta).
- [ ] C.1.2 Reescribir §6 (`:107-111`, "Cómo actualizarlo hoy") describiendo el procedimiento nuevo:
  `npm run <script>` regenera los cuatro ficheros; el `.html` viejo sigue congelado (propuesta §6). El
  aviso de caducidad del §7 **no se retira** (sigue siendo cierto del `.html`).

### Fase C.2 — Maestro: entrada 17 de `F0-01_Correcciones_para_el_maestro.md`

- [ ] C.2.1 Añadir `## La de F1A-06 (17)` / `### 17 · <título> (F1A-06)`, mismo formato que la entrada 16
  (`:853-857` en adelante), con dos partes (propuesta §8): (a) M1.3.3 (`:1198`) y Anexo F (`:4413`) dicen
  "Faltan dos y no se sabe cuáles" — cerrado por M1.3.7 (`:1301-1458`) y el recuento de la propuesta §3
  (33×1 + 1×3 = 36 + 2 = 38); (b) M1.3.3 (`:1198`) dice de los dos pasos "Lo que no tienen es `from` ni
  `to`" — falso tras P-2/Unidad A. Apéndice **sólo al final** del fichero: no desplaza ninguna entrada
  anterior.

### Fase C.3 — `openspec/config.yaml` (R-2, YA SATISFECHA — verificación, no edición)

- [ ] C.3.1 **Verificado contra el árbol, no re-hacer.** `mapa-blueprint` ya está en `capabilities`
  (`config.yaml:271-281`), escrita en la fase `sdd-spec` de esta misma tanda —R-2 de F0-05 exige que el
  MISMO cambio que crea la spec añada la capacidad, y así ocurrió—. Confirmar en el cierre de C que la
  entrada sigue presente y sin editar, y que ninguna tarea de A/B la tocó por accidente.

### Fase C.4 — Cierre de la Unidad C / de la tanda

- [ ] C.4.1 Marcar en `apply-progress.md` de C los ocho criterios de éxito de `proposal.md` §14 uno a
  uno, con evidencia o remisión a la unidad que la produjo (A/B).
- [ ] C.4.2 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, en solitario, verdes —
  confirmación final tras C.1-C.3 (no deberían tocar código).
- [ ] C.4.3 Commit de la Unidad C (conventional commit), antes del `sdd-attempt settle` del último
  intento.

---

## Para el archive — no es trabajo de `sdd-apply`

- Anclas de los bloques `MODIFIED` del delta `specs/transitions-st/spec.md` se comprueban contra el
  árbol **del momento del archive**, no contra `125ae3e`: `transitions.ts:150-151` y
  `estadoPorRemision.ts:41`/`:49` cambian de CONTENIDO sin moverse (delta 0), así que toda cita viva que
  los nombre en los deltas fusionados describe el contenido nuevo — comprobación dirigida, mismo molde
  que E-023 de F1B-10.
- La línea de `cierra` del `archive-report.md` nombra qué parte de la fila F1A-06 cubrió y declara
  explícitamente que el hueco 38/36 quedó cerrado con la cuenta de la propuesta §3 (criterio final de
  §14).
- Barrido final de `transitions.ts` (~180 citas en ~41 ficheros, propuesta §8): dado que A.2.2 edita
  `:150-151` en sitio con delta 0 confirmado en A.2.2/A.4.4, no debería haber roturas nuevas de este
  fichero por esta tanda — confirmar con `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` igual, como
  cierre de higiene y no porque se esperen hallazgos.
- `remisiones/spec.md:285-286` y `zoho-sync/spec.md:79` se **recomprueban**, no se reescriben (propuesta
  §4): siguen cediendo las dos constantes a `transitions-st` y siguen citando `estadoPorRemision.ts:41`
  como el corte — sigue siendo cierto tras la Unidad A.

## Riesgos de dependencia entre fases

- B depende de que A esté commiteada: `mapaBlueprint.ts` importa `FASE_POR_ESTADO` de `fasesBlueprint.ts`
  (A.1) y las dos constantes de `transitions.ts` ya con `from`/`to` (A.2) para construir
  `sinBoton: PasoSinBoton[]`.
- B.1.2 (guarda de ejecución) depende de B.1.1 (esqueleto) para existir el punto de inyección, pero es
  independiente de B.1.3 (GREEN completo): debe quedar en rojo ANTES de implementar el resto del
  generador, o no demuestra nada sobre el `throw`.
- B.3 (anti-desfase) depende de B.2.2 (primer volcado a disco): no puede escribirse el diff contra unos
  ficheros que aún no existen.
- C.2 (entrada 17) depende de que A y B estén cerradas: cita el recuento 38 fijado por aserción en B.4.2,
  no una cifra provisional.
- Ninguna unidad puede lanzarse con otro intento `sdd-attempt` abierto sin `settle` sobre el mismo
  worktree (regla del ciclo 2, `CLAUDE.md`).
