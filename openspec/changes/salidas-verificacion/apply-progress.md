# Apply progress: las dos salidas de `Verificación` (F1A-03)

**Modo**: Strict TDD. **Estado**: 20/20 tareas completas (Fases 1-5). Ver `tasks.md` para el detalle
tarea a tarea (todas `[x]`).

## TDD Cycle Evidence

| Fase | Test file(s) | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1→2 | invariantesGrafo.test.ts, reentrancia.test.ts, permisos.test.ts, transicionesEjecucion.test.ts, flujoEquipoNuevo.test.ts, avisoArea.test.ts | Unit + integración (supertest/pg-mem) | ✅ 71/71 (baseline) | ✅ Escrito primero, contra `transitions.ts` sin tocar | ✅ 74/74 tras el dato en `transitions.ts:359-362` | ✅ P7 (dos salidas por separado), M1-M4 | ➖ No aplica (dato, no lógica) |

## Red (Fase 1.7)

Baseline previo (sin editar tests): 6 ficheros, 71 pruebas verdes. Tras escribir las 7 expectativas
nuevas/modificadas (P7 y el caso de avisos incluidos), contra el catálogo de 5 transiciones sin tocar:
**11 pruebas rojas, 63 verdes, 74 totales** — exactamente las que dependen de las dos salidas nuevas.
Nombres rojos: `la unión tiene 40 entradas…`, `3 · sin salida en la unión es exactamente Finalizado`,
`RQ-EN-01 · las seis transiciones…`, `el catálogo EN tiene exactamente un ciclo…Verificación`,
`areasSiguientes(Verificación, EN) es Servicio Técnico`, `P6…` (recuento 7), `P7…`, `la matriz EN son
18 casos…`, `ninguna transición del catálogo EN se queda sin caso…`, `cada caso EN declara los mismos
extremos…`, `las seis salen de su origen…`.

## Green (Fase 2.5)

`transitions.ts:359` editado en su sitio (`liberacion.from` → `['En Proceso','Verificación']`);
`rechazo_verificacion` añadida tras `:360`; comentario `:343-345` reescrito en 3 líneas; `:347`
cinco→seis. Resultado: **74/74 verdes** en los seis ficheros objetivo.

## Mutation Table (Fase 3, regla de mutación 2)

| # | Mutación | Resultado (rojo) | Revertida |
|---|---|---|---|
| M1 | Quitar `'Verificación'` de `liberacion.from` | 5 rojas: pares RQ-EN-01, P6 (recuento), P7, `cada caso EN declara…`, `las seis salen de su origen…` | ✅ `git diff --stat` limpio tras revertir |
| M2 | Borrar `rechazo_verificacion` | 9 rojas: recuento 40, pares RQ-EN-01, reentrancia (ciclo con Verificación), P6, P7, `ninguna transición…sin caso`, `cada caso EN…`, `las seis salen…`, matriz 18/12/6 | ✅ |
| M3 | M1+M2 a la vez | 11 rojas — **incluye el invariante 3** (`3 · sin salida en la unión es exactamente Finalizado`), la única mutación que lo alcanza, tal como predice `design.md` | ✅ |
| M4 | Área de `rechazo_verificacion` → `'Comercial'` | 4 rojas: `corrección (b)` (área≠Servicio Técnico), `areasSiguientes`/`areasAAvisar` (avisoArea F1A-03), P6 (Comercial ya no recibe 403 en `rechazo_verificacion`). **Desviación de lo anotado en `design.md`/`tasks.md`**: la matriz `permisos.test.ts` (18/12/6) NO se pone roja — el total 12/6 es simétrico ante el intercambio de un área única por otra, así que el conteo agregado no distingue **cuál** área es la exclusiva. La detección real la dan `corrección (b)`, P6 y el nuevo caso de `avisoArea.test.ts`, con cobertura equivalente (4 pruebas independientes en rojo) | ✅ |

Todas las mutaciones se revirtieron y `git diff -- packages/shared/src/transitions.ts` contra `HEAD`
quedó exactamente en el estado GREEN de la Fase 2 (verificado con `git diff` tras cada revert).

## Rule 13 check (Fase 4)

`git diff --stat -- apps/desk/src` → vacío. Decisiones del cliente, todas impuestas en servidor:

| Decisión en cliente | Línea servidor (verificada hoy) |
|---|---|
| Qué transiciones ofrece en `Verificación` (`TransitionPanel.tsx:56`) | `ticketService.ts:125` (flujo, `exigirMismoFlujo`) y `:126-128` (origen) |
| Filtro por área (`TransitionPanel.tsx:57`) | `ticketService.ts:129-131`, probado por matriz 6×3 (`permisos.test.ts`) |
| Campos del formulario | `buildTransitionPlan`, `ticketService.ts:133-134`/`:138-142` |

Cero decisiones nuevas en el cliente.

## Comandos de cierre (Fase 5)

| Comando | Resultado |
|---|---|
| `npm test` | 143 test files passed, 1 skipped · 1445 tests passed, 2 skipped · exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 errors, 165 warnings preexistentes (`no-explicit-any` en `zoho-sync`, sin relación con este cambio) · exit 0 |
| `npm run build` | exit 0 (vite build OK) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | exit 0 · 0 bloqueantes · 12 abreviadas rotas preexistentes (informativas, no bloquean) — medido contra `HEAD` porque el cambio no está commiteado |

## Barrido de citas (regla de mutación 4)

`transitions.ts` creció de 361 a 363 líneas (`:350-361`→`:350-363`, como predijo `design.md`). Barrido
completo (`grep -rnoE`) de `transitions.ts` y los seis ficheros de prueba tocados. Clasificación:

- **Caso A (reparadas, 4)**: `proposal.md:60` (`invariantesGrafo.test.ts:211-214`→`:213-216`, corrección
  (b) desplazada +2 por la fila nueva de pares); `proposal.md:33` (`invariantesGrafo.test.ts:200-208`→
  `:200-210`, rango del test RQ-EN-01 crecido); `proposal.md:37` (`transicionesEjecucion.test.ts:302-308`
  →`:302-309`, +1 por `rechazo_verificacion`); `openspec/specs/derivacion-avisos/spec.md:119,154`
  (`avisoArea.test.ts:29`→`:30`, `:19`→`:20` — el import nuevo desplaza +1 todo desde la línea 3).
- **Caso B (histórico, correctamente fechado, sin tocar)**: todas las citas a `transitions.ts:343-361`
  desde `openspec/changes/salidas-verificacion/{proposal,design,tasks}.md` propias (describen el estado
  PRE-cambio a propósito, incluida la nota de migración que ya anticipa el desplazamiento); las citas
  archivadas de `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/*` (tanda anterior, ligadas a
  su propio cierre); `proposal.md:40` (`transitions.ts:345`) — describe el comentario VIEJO que ya no
  menciona el invariante 3; el propio texto dice «se resuelve sola, porque el delta retira esa frase».
- **Caso C (superado por esta misma tanda)**: la discrepancia de numeración de `proposal.md:39-41`
  (invariante 1 vs 3) — cerrada al retirar la frase, tal como el proposal predijo.
- `docs/sdd/ENTRADA.md:1197` (`transitions.ts:359`): línea NO se movió, contenido SÍ cambió (ahora
  `from` incluye `Verificación`) — confirmado, cita sigue apuntando a la fila correcta (`liberacion`).
- E-082 (`:1187-1192`) y E-083 (`:1194-1199`) siguen escritas en `ENTRADA.md`, confirmado.

## Measure

`git add -N` ejecutado para el único fichero nuevo creado por esta tanda (`apply-progress.md`); los
cuatro `??` preexistentes en `git status` (`docs/sdd/Evidencia_Transporte_Tarea_Programada_2026-09-18.txt`,
`Parte_2026-09-18.md`, `Parte_2026-09-22.md`, `Parte_2026-09-24.md`) son de sesiones anteriores, no de
este cambio, y no se tocan.

`git diff --shortstat --no-renames HEAD`: ver salida del comando en el reporte de retorno.

## Deviations

- M4 no puso roja la matriz agregada 18/12/6 de `permisos.test.ts` (el conteo es simétrico ante el
  intercambio de área única); la detecta `corrección (b)`, P6 y el caso nuevo de `avisoArea.test.ts` —
  cobertura equivalente, ninguna mutación queda sin guardián. Documentado arriba.
- Comentario `:343-345` de `transitions.ts` reescrito con referencia a D1/D2/s3 en vez de citar D3 por su
  nombre explícito (D3 es la decisión de reescribir el comentario en sí); se conserva la restricción de
  tres líneas y cero mención al invariante 3, que era el punto exigido por la tarea 2.3.
