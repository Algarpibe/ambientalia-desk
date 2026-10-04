# Tareas — `remision-creada-sin-salida` (F1B-03, `cierra: no`)

Un solo lote de aplicación. Orden fijado por `design.md` §4 y para `strict_tdd`: pruebas rojas, ejecutarlas y anotar el
fallo, predicado, rojo intermedio de P5, protección, comentarios, mutaciones, regla 13, cierre. Runner: `npm test`
(`vitest run`); un fichero: `npx vitest run <ruta>`. Los resultados observados van a `apply-progress.md`.

Las siglas P1-P8 y M1a-M3c son las de `design.md` §4 y §5.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~340 (rango 300-380) |
| 400-line budget risk | Low (válvula 720, techo 800) |
| Chained PRs recommended | No |
| Suggested split | Lote único |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (no aplica: lote único) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Cuenta: código 32 (`transitions.ts` 18, `botonRemision.ts` 8, `TransitionPanel.tsx` 6) + pruebas brutas 126 × 1,8 ≈ 227 +
casillas y `apply-progress.md` ≈ 80 = ~340.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Salida del ticket en `Remisión creada` sin entrada vigente | Único | `npx vitest run packages/shared/src/transitions.test.ts apps/desk/src/lib/botonRemision.test.ts apps/desk/server/remisionCreadaSinSalida.test.ts` | P7/P8 por HTTP con `instalarArnes`; la parte `.tsx` va a la sección de persona | Revertir el commit: `transitions.ts:164` y `botonRemision.ts:31` vuelven a su forma y las pruebas a su aserto anterior |

## Fase 0 — Punto de partida

- [x] 0.1 Anotar el commit de partida (`git rev-parse HEAD`) y `wc -l` de `transitions.ts` (397), `botonRemision.ts` (43),
  `TransitionPanel.tsx`, `transitions.test.ts` y `botonRemision.test.ts`. Sirven al cierre (7.2) y a la medida (7.6).
- [x] 0.2 Correr `npm test` una vez y anotar la cifra verde de partida (comparación al cierre).

## Fase 1 — Pruebas (rojo antes que verde)

- [x] 1.1 `packages/shared/src/transitions.test.ts` — **ROJA, P2**: `:102` pasa a `toBe(true)`; reescribir título y
  comentario `:95-98`. Import en la línea 5 existente (D5), sin línea nueva.
- [x] 1.2 `transitions.test.ts` — **ROJA, P1**: `describe` nuevo tras `:127`. Para cada estado de
  `transitionById('habilitar_servicio')!.from`, `true` con el estado en el mensaje; para cada estado de `ESTADOS` fuera
  del `from`, `false`. Recorre el catálogo, no una lista a mano (D2).
- [x] 1.3 `apps/desk/src/lib/botonRemision.test.ts` — `:15-20`: `:19` deja de afirmar `Remisión creada` y afirma otro
  estado posterior.
- [x] 1.4 `botonRemision.test.ts` — **ROJAS, P3** (`describe` nuevo tras `:68`), en `Remisión creada`: lista vacía,
  sólo anulada, sólo confirmada de `tipo: 'salida'`, pendiente (texto y `pendienteId`), sólo `error`.
- [x] 1.5 `botonRemision.test.ts` — **caracterización, nace verde, P4**: confirmada `ok` y `ok_con_avisos` → no visible.
- [x] 1.6 `botonRemision.test.ts` — **caracterización con rojo intermedio, P5**: `botonRemision(STATUS_REMISION_CREADA,
  null)` → no visible. Nace verde; se pondrá roja en 2.2 y volverá a verde en 2.3.
- [x] 1.7 `botonRemision.test.ts` — **caracterización, nace verde, P6**: `null` en `OV asignada` y `Ticket creado` →
  visible.
- [x] 1.8 Crear `apps/desk/server/remisionCreadaSinSalida.test.ts` (~58 líneas, D6/D7) con `instalarArnes`, `appWith` y
  `userCookie(['Comercial'])`. **Caracterización, nace verde, P7**: `it.each` de los tres orígenes sembrados con
  `INSERT INTO tickets (id, number, status, managed_by_app, serial)`: `422` con el texto único → `POST /api/remisiones`
  (`{ ticketId, fecha, incluye: [] }`) `201` → el ticket sigue en su origen → `habilitar_servicio` `200` → `Ingresado`.
- [x] 1.9 Mismo fichero — **caracterización, nace verde, P8** (variante del origen 3): `Remisión creada` con
  `remisionDePrueba(db, id, { tipo: 'salida' })`, mismo recorrido. Sin ninguna aserción sobre otros estados (H-1, S-4).
  Si `habilitar_servicio` pide algo más que orden de venta y serial (duda abierta de `design.md` §10), anotarlo.
- [x] 1.10 **EJECUTAR el rojo.** `npx vitest run` sobre los tres ficheros. Anotar en `apply-progress.md` el fallo
  observado de P1, P2 y las cinco de P3 (mensaje y recuento), y confirmar que P4, P5, P6, P7 y P8 nacen verdes. Si una
  roja nace verde o una verde nace roja, parar y registrarlo antes de seguir.

## Fase 2 — Código (verde)

- [x] 2.1 Sin cambios en el orden: no tocar código antes de cerrar 1.10.
- [x] 2.2 `packages/shared/src/transitions.ts:164`: añadir `|| status === STATUS_REMISION_CREADA`. Reescribir en sitio
  el comentario `:154-161` (8 líneas; lista de lo permitido, tres orígenes). Correr `transitions.test.ts` (P1, P2 en
  verde) y `botonRemision.test.ts`: **anotar el ROJO INTERMEDIO de P5** (`botonRemision.ts:31` aún no protege).
- [x] 2.3 `apps/desk/src/lib/botonRemision.ts`: ampliar el import de `:2` con `STATUS_REMISION_CREADA`; en `:31`
  `if (!puedeCrearRemisionDeEntrada(status) || (status === STATUS_REMISION_CREADA && remisiones === null)) return {…}`,
  misma línea (D3, D4). Reescribir el comentario `:37-38` en sus 2 líneas. `:17-28` intacto. Correr el fichero: P3,
  P4, P5, P6 en verde; anotar que P5 volvió a verde.
- [x] 2.4 `apps/desk/src/components/TransitionPanel.tsx:18-20`: reescribir el comentario en sus 3 líneas (sólo texto).
  Es `.tsx`: sin prueba, va a la sección de persona.
- [x] 2.5 Correr los tres ficheros de prueba del lote y `ticketService.test.ts`, `invariantesGrafo`, `cifrasAncladas`,
  `mapaBlueprint`: todo verde y **sin haberlos editado** (criterio 8). Anotar el resultado.

## Fase 3 — Mutaciones (aplicar, ver qué cae, anotar el mensaje, REVERTIR)

Tras cada una, `git diff` del fichero mutado debe quedar vacío frente a lo escrito en la fase 2.

- [x] 3.1 **M1a** `transitions.ts:164`: quitar `|| status === STATUS_REMISION_CREADA`. Deben caer P1 (mensaje con
  «Remisión creada»), P2 y las cinco de P3; P7/P8 siguen verdes. Revertir.
- [x] 3.2 **M1b** `:164`: quitar `status === STATUS_OV_ASIGNADA ||`. Deben caer P1 («OV asignada»),
  `transitions.test.ts:99`, `botonRemision.test.ts:12` y P6. Revertir.
- [x] 3.3 **M1c** `:164`: quitar `status === STATUS_TICKET_CREADO ||`. Deben caer P1 («Ticket creado»),
  `transitions.test.ts:100`, P6 y el resto de `botonRemision.test.ts`. Revertir.
- [x] 3.4 **M2** `transitions.ts:178`: añadir `'Origen ficticio'` al `from`. Debe caer P1 con «Origen ficticio»;
  anotar si caen además `cifrasAncladas` o `invariantesGrafo` (hipótesis del diseño). Revertir.
- [x] 3.5 **M3a** `botonRemision.ts:31`: quitar el segundo operando. Debe caer P5. Revertir.
- [x] 3.6 **M3b** `:31`: dejar `remisiones === null` sin la condición de estado. Debe caer P6. Revertir.
- [x] 3.7 **M3c** `:31`: `remisiones === null` → `!remisiones?.length`. Debe caer P3, fila de lista vacía. Revertir.
- [x] 3.8 Escribir en `apply-progress.md` la **declaración de no mutación de posición** (regla de mutación 1): no
  existe par de guardas que ordenar. `null` implica `vigentes = []` (`botonRemision.ts:33`), así que con `null` ni la
  rama de pendiente (`:34-35`) ni la de confirmada (`:39-40`) pueden dispararse; y con el predicado en `false` las dos
  mitades del `||` devuelven el mismo objeto. M3-pos (protección en `if` propio tras `:40`, o operandos invertidos) es
  mutante equivalente, declarado. Lo observable es la condición, y la cubren 3.5-3.7.
- [x] 3.9 Tras la última reversión, `npx vitest run` de los tres ficheros en verde y `git diff --stat` igual al de 2.5.

## Fase 4 — Regla invariable 13 y regla de mutación 3

- [x] 4.1 `apply-progress.md`: tabla decisión a decisión, cada fila con la línea del servidor leída en el árbol de hoy
  (no copiada de la propuesta): (1) ofrecer «Crear remisión» en los tres orígenes → `remision.ts:120-264`, `201` en
  `:263`, fijado por P7/P8; (2) no ofrecerlo en los demás estados → **ninguna**, hueco H-1 previo, no corregido, E-184;
  (3) no ofrecerlo en `Remisión creada` con `null` → ninguna y no la necesita (presentación); (4) no ofrecerlo con una
  confirmada → ninguna, ya era así; (5) reetiquetar con pendiente → `remision.ts:174-183`, `409` en `:177`;
  (6) desactivar «Habilitar Servicio» → `ticketService.ts:131`, `:273-277`. Releer cada línea antes de escribirla.

## Fase 5 — Cierre

- [x] 5.1 `npm test`. Anotar el código de salida y las cifras (comparar con 0.2).
- [x] 5.2 `npm run typecheck`. Anotar el código de salida.
- [x] 5.3 `npm run lint`. Debe dar **165 avisos y 0 errores**; anotar el código de salida y las cifras reales.
- [x] 5.4 Detector de citas sobre el commit: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`. Anotar el
  código de salida. Si el commit aún no existe, anotar que se corre tras el commit del orquestador y quién lo corre.
- [x] 5.5 Regla de mutación 4, `wc -l` de `transitions.ts` (397), `botonRemision.ts` (43) y `TransitionPanel.tsx`: iguales
  a los de 0.1. Barrido `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` y el de `botonRemision.ts` sobre el
  repositorio; segundo pase de las abreviadas (`:154-165`, `:31`, `:33-40`) en los ficheros que ya citan el módulo.
  Leer qué AFIRMA cada frase que cita lo cambiado (`:154-165` de `transitions.ts`; `:31` y `:37-38` de `botonRemision.ts`).
- [x] 5.6 Caso C declarado: `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:141` cita `transitions.ts:163-165` y
  `botonRemision.ts:31` para afirmar el caso sin salida; la línea sigue existiendo y la frase deja de ser cierta. Es un
  registro fechado: **no se edita**; se anota en `apply-progress.md` junto con qué lo cerró. Comprobar también que las
  del archivo de `blueprint-soporte-remoto` (`design.md:102`, `:216`, `tasks.md:304`) siguen ciertas, y que
  `openspec/specs/remisiones/spec.md:185`, `:791`, `:802` siguen acertando por contenido.
- [x] 5.7 Preguntas para `docs/sdd/ENTRADA.md`, a **numerar por el orquestador** (no se escriben en la bandeja desde
  este cambio): (a) pregunta a Gerencia, H-1: ¿debe el servidor impedir crear una remisión de entrada fuera de la fase
  inicial?; (b) pendiente de persona con acceso a producción: ¿existe algún ticket en `Remisión creada` sin entrada
  vigente?; (c) hallazgo de supervisión: anulación y sincronización no comparten transacción (`remision.ts:333`,
  `:336`); (d) hallazgo de supervisión: con la remisión de salida, el origen 3 deja de ser hipotético. Dejarlas en
  `apply-progress.md` con su destino.
- [x] 5.8 Medida del intento: `git diff --shortstat --no-renames <commit de partida>` más `wc -l` de lo nuevo sin
  trackear (`remisionCreadaSinSalida.test.ts`, `tasks.md`, `apply-progress.md`). Registrar ESO y compararlo con ~340.
  Binarios: ninguno esperado; si hay, anotarlos aparte.

## Fuera del recuento — comprobaciones de PERSONA (Regla del ciclo 1)

Estas no son tareas de la tanda: ninguna tanda puede marcarlas, porque su dueño está fuera del repositorio. **Archivar
el cambio NO las da por hechas.** Cada una queda escrita en el `archive-report.md` bajo «Pendientes de persona».

| # | Comprobación | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|---|
| H-A | En la aplicación (`ambientalia-desk.ambientalia.cloud`, tras el despliegue), el botón «Crear remisión» aparece en un ticket en `Remisión creada` sin remisión vigente, y NO en uno sano (con confirmada) ni durante la carga. Incluye releer el comentario de `TransitionPanel.tsx:18-20` (`.tsx`, fuera de la red de pruebas por F0-00) | Persona con acceso a la aplicación (Gerencia o quien despliega) | Verificación en la app tras el despliegue | `archive-report.md` y la bandeja |
| H-B | Recuento en producción: ¿hay tickets en `Remisión creada` sin entrada vigente? (no cambia el arreglo, sólo su urgencia) | Persona con acceso a producción | Pregunta de la bandeja (5.7 b) | `docs/sdd/ENTRADA.md`, número que asigne el orquestador |
| H-C | Decidir H-1: guarda de estado en el alta de remisión | Gerencia | Pregunta de la bandeja (5.7 a); cambio aparte si procede | `docs/sdd/ENTRADA.md` |
