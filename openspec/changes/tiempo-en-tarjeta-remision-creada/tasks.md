# Tareas: la tarjeta de «Remisión creada» muestra el tiempo en el estado, en días hábiles

Cambio `tiempo-en-tarjeta-remision-creada` (F1B-07, `cierra: si`). Un solo lote de apply. Orden estricto de `strict_tdd`: rojo, verde, mutaciones, cierre. Cada casilla se marca sólo con su resultado anotado en `apply-progress.md`. Las pruebas T-1…T-9 y RC-13…RC-18 y las mutaciones M1…M10 son las de `openspec/changes/tiempo-en-tarjeta-remision-creada/design.md` (D-7, D-8); no se reabren sus decisiones.

## Review Workload Forecast

Líneas estimadas (inserciones + borrados): código y pruebas unas **205** (`tiempoEnEstado.ts` ~16, su prueba ~80, `listaRemisionCreada.ts` 6+6, prueba del servidor ~72, `DistintivoTiempoEnEstado.tsx` ~8, tres `.tsx` 2+2 cada uno, `types.ts` 1+1, `index.ts` 1). Con el `apply-progress.md` (sumando obligatorio, ~120): unas **325**.

Riesgo: bajo frente a 800 (válvula 720). Partir: **no**. Decision needed before apply: No. La fusión del delta en `openspec/specs/vistas-tablero/spec.md` es del archive y se mide allí.

## 1. Rojo (D-7)

- [ ] 1.1 Crear `packages/shared/src/tiempoEnEstado.test.ts` con T-1…T-9 (instantes con desplazamiento explícito; T-9 enfrenta `horasHabilesEntre` y `slaVencido` con el distintivo). Aún sin módulo.
- [ ] 1.2 Ejecutar `npx vitest run packages/shared/src/tiempoEnEstado.test.ts` y anotar el rojo real (módulo inexistente), con el mensaje literal.
- [ ] 1.3 En `apps/desk/server/listaRemisionCreada.test.ts`: línea 7 en sitio (importar `listaRemisionCreada`) y, tras la línea 148, el `describe` «el tiempo en el estado (RQ-VT-16)» con RC-13…RC-18 (cierres sembrados como en `apps/desk/server/db/sla.test.ts:233`; espía de consultas como en `apps/desk/server/db/sla.test.ts:244-247`).
- [ ] 1.4 Ejecutar `npx vitest run apps/desk/server/listaRemisionCreada.test.ts` antes de tocar producto y anotar: RC-13 `undefined`, RC-14, RC-15, RC-16 rojos y RC-18 con 0 lecturas; RC-17 nace verde (caracteriza; su rojo es M6) y RC-1…RC-12 intactas, RC-11 (`apps/desk/server/listaRemisionCreada.test.ts:118`) verde.

## 2. Verde (D-1…D-4)

- [ ] 2.1 D-1: crear `packages/shared/src/tiempoEnEstado.ts` (`diasHabilesEnEstado`, `textoTiempoEnEstado`) y añadir la línea 42 al final de `packages/shared/src/index.ts`. Pruebas T-1…T-9 en verde.
- [ ] 2.2 D-3: en `packages/shared/src/types.ts:37` insertar `diasHabilesEnEstado?: number | null` en sitio y ajustar el comentario final.
- [ ] 2.3 D-2: editar en sitio `apps/desk/server/db/listaRemisionCreada.ts` (líneas 3, 5, 9, 13, 15, 16; conserva sus 17 líneas). `apps/desk/server/routes/prioridad.ts:92-93` no se edita. RC-13…RC-18 y RC-1…RC-12 en verde.
- [ ] 2.4 D-4: crear `apps/desk/src/components/DistintivoTiempoEnEstado.tsx` y engancharlo en sitio en `apps/desk/src/components/TicketCard.tsx:103`, `apps/desk/src/components/TicketList.tsx:29` y `apps/desk/src/components/TicketTable.tsx:34`, con la importación al final de la línea 4, 3 y 3 respectivamente. Sin prueba de `.tsx` (F0-00): no admite rojo previo.
- [ ] 2.5 Ejecutar `npm run typecheck` (hipótesis de D-2/D-4: pasa con las líneas largas) y anotar el resultado.

## 3. Mutaciones (D-8, reglas de mutación 1 y 2)

Una a una. Se parte de una copia de los ficheros tras la fase 2 en un directorio temporal **fuera del repositorio** (no se usa `git checkout --`). Tras cada mutación, correr las pruebas afectadas, anotar prueba a prueba qué se puso roja o verde, restaurar desde la copia y comprobar con `git diff`. Regla de mutación 1: no hay guarda nueva; el orden con efecto es `undefined` antes que `null` (M10). Regla de mutación 2: no aplica.

- [ ] 3.1 M1 contar el día de entrada. Esperado rojo: T-1, T-2, T-3; RC-13.
- [ ] 3.2 M2 `new Set()` en vez de los cierres (línea 15 del servidor). Esperado rojo: RC-13 (10 en vez de 9); T-5.
- [ ] 3.3 M3 UTC en la entrada y luego en `ahora`. Esperado rojo: T-6 primera mitad y RC-14; T-6 segunda mitad.
- [ ] 3.4 M4 `0` en vez de `null` sin fecha. Esperado rojo: T-7, RC-15, RC-16.
- [ ] 3.5 M5 quitar el campo de la línea 16. Esperado rojo: RC-13…RC-16.
- [ ] 3.6 M6 añadir el campo a `apps/desk/server/routes/tickets.ts:115` y a `apps/desk/server/routes/prioridad.ts:85`, cada mitad por separado. Esperado rojo: RC-17 en cada una.
- [ ] 3.7 M7 invertir `desde` y `hasta`. Esperado rojo: T-2…T-5.
- [ ] 3.8 M8 leer los cierres dentro del `map`. Esperado rojo: RC-18 y RC-11.
- [ ] 3.9 M9 cuatro textos (0, 1, plural, `null`), una mutación por texto. Esperado rojo: la aserción de T-8 de cada uno.
- [ ] 3.10 M10 `== null` en `textoTiempoEnEstado`; y `dias <= 1` en la rama del 0. Esperado rojo: aserción de `undefined` de T-8; la del `1`.

## 4. Cierre del apply (reglas 13, mutación 3 y 4)

- [ ] 4.1 Regla de mutación 3: dejar en `apply-progress.md` la tabla de D-5 (decisión → línea del servidor → prueba), comprobada línea a línea contra el árbol; constatar que el cliente no bloquea, no rellena ni avisa (`grep` en `apps/desk/src` de `diasHabilesEnEstado`: sólo pinta).
- [ ] 4.2 Regla de mutación 4: `git diff --numstat` y `wc -l` por fichero editado; ninguna línea existente cambia de número (`apps/desk/server/db/listaRemisionCreada.ts` 17, el resto sólo en sitio o por el final).
- [ ] 4.3 Barrido de citas comprobado, no afirmado: `grep -rnoE "(listaRemisionCreada|types|index|TicketCard|TicketList|TicketTable)\.tsx?:[0-9]+(-[0-9]+)?"` sobre el repositorio, cada resultado leído contra el fichero; segundo pase de abreviadas y prosa; anotar cita a cita si sigue cierta (la tabla de D-6 es la hipótesis).
- [ ] 4.4 `npm test` en verde.
- [ ] 4.5 `npm run typecheck` en verde.
- [ ] 4.6 `npx eslint . --max-warnings 165` en verde (hipótesis de líneas largas a confirmar).
- [ ] 4.7 Tras el commit del orquestador, `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: anotar el resultado.
- [ ] 4.8 Medida del intento: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear; registrar esa cifra (techo 800, válvula 720). Binarios aparte.

## Mapa tarea → requisito o decisión

| Tarea | Escenario de RQ-VT-16 o decisión |
|---|---|
| 1.1, 2.1 | Escenarios de cuenta, festivo, cierre, zona, sin fecha, textos y los dos relojes (T-1…T-9) |
| 1.3, 1.4, 2.3 | Campo en la lista, orden intacto, sin N+1, otros listados sin el campo (RC-13…RC-18) |
| 2.2, 2.4 | D-3, D-4; escenarios manuales (T4, T5, T7) |
| 3.1 a 3.10 | D-8 (M1 a M10) |
| 4.1 a 4.8 | D-5, D-6, criterios de éxito de la propuesta |

## Tareas de persona — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1).

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Verificación manual en la aplicación tras desplegar: tarjeta, lista y tabla de «Remisión creada», distintivo gris, y que las demás vistas no lo muestran | Alfonso | `ambientalia-desk.ambientalia.cloud` | Escenarios manuales de RQ-VT-16 |
| Corregir, si procede, los supuestos T1 a T7 y responder E-188, E-189, E-190, E-191 y E-193 antes del 2026-10-18 (lo no corregido queda aceptado con esa fecha) | Gerencia | Lista semanal de supuestos (E-237) | Cada entrada de `docs/sdd/ENTRADA.md` |
| Versionar `decision/prioridad-clientes-sin-contrato` (el `cierra: si` descansa en ella) | Sesión de supervisión | Árbol del repositorio | `openspec/config.yaml` |
