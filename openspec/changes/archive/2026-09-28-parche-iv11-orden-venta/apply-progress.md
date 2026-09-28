# Apply progress — `parche-iv11-orden-venta` (F1B-11, cambio 1 de 3, `cierra: no`)

**Estado:** 9/9 fases de código completas (Fases 1-9). P.1-P.3 son tareas de persona, fuera del
recuento (regla del ciclo 1). `npm test` 1471/1471 verde, `typecheck`/`lint`/`build` verdes.

## TDD Cycle Evidence (resumen; rojo natural confirmado en cada fase)

| Fase | RED (comando) | GREEN | REFACTOR |
|---|---|---|---|
| 1 · schema/migrate.test.ts | `expected 37 to be 39` | `schema.sql` +2 ALTER sin calificar | — |
| 2 · repo.ts marca+descriptor | 8/8 tests nuevos rojo (undefined vs esperado) | `upsertTicket` filtra cols si marcada, detecta discrepancia; `createTicket`/`writeTransition` marcan | Ajuste `toISOString()` en test |
| 3 · remisión marca | `ov_elegida_en_app_at` null inesperado | `UPDATE` añade `ov_elegida_en_app_at = now()` | — |
| 4 · avisoDiscrepanciaOV | módulo inexistente | servicio nuevo, transacción `enTransaccion` | — |
| 5 · sync.ts cableado | `recibidos` vacío | `Deps extends AvisoOVDeps`, invocación tras `upsertTicket` | — |
| 6 · e2e | roja por conteo (admin+coord=2, no 1) | corregido el cálculo de destinatarios en el test | — |

## Mutaciones (Fase 7) — todas revertidas, `git diff` limpio confirmado

R1 (posición managed_by_app→después de la escritura): rojo en 2 tests. R2a (`ov_elegida_en_app_at` en
`TICKET_COLS`): rojo en test de pertenencia + e2e (excepción por `undefined` param). R2b (`ALTER TABLE
desk.tickets`): rojo en guardián (2 tests). (a) quitar marca del UPDATE remisión: rojo. (b) quitar
filtro `updates`: rojo (2 tests). (c) quitar `<>$2` anti-ruido: rojo (repetición). (d) `crearAviso`
fuera de transacción: rojo (Plan B, secuencia de verbos). (e) marcar siempre en `writeTransition`:
**sobrevivió** a los tests existentes — cerrado el hueco con un test nuevo permanente
(`writeTransition NO marca cuando plan.columns.orden_venta viene vacía`), confirmado rojo, revertido.
(f) quitar comprobación Zoho vacío: **sobrevivió** igual — cerrado con test nuevo permanente
(`... aunque ov_zoho_avisada tenga otro valor`), confirmado rojo, revertido. Dos huecos reales de
cobertura encontrados y cerrados por la propia mutación (32→33 tests en repo.test.ts).

## Regla 13 (Fase 8)

Ningún fichero de `apps/desk/src` tocado. Única decisión de cliente de esta tanda —OV en gris del
formulario de remisión— sigue impuesta por `remision.ts:241` (`WHERE ... COALESCE(orden_venta,'') =
''`), sin cambios de lógica (sólo se sumó `ov_elegida_en_app_at = now()` al mismo `SET`).

## Cierre (Fase 9)

- 9.1: `npm test` 1471/1471 · `npm run typecheck` limpio · `npm run lint` 0 errores (165 warnings
  preexistentes; 3 `no-explicit-any` nuevos de esta tanda, retirados el 2026-09-28) · `npm run build` OK.
- 9.2 Barrido de citas: reparadas `CLAUDE.md` (fila IV-11 + `migrate.test.ts:404-406` en `17ddfec`→`migrate.test.ts:409-411`),
  `openspec/config.yaml` (ficha IV-11: `estado: REDUCIDO` + nota fechada; `registro:` de `e005c` a
  §11.1), `openspec/specs/zoho-sync/spec.md` (4 citas `index.ts:82-90`→`:85-93`, `:55`→`:58`),
  `openspec/specs/remisiones/spec.md` (2 citas), `openspec/specs/tickets-core/spec.md` y
  `transitions-st/spec.md` (`repo.ts:330-347` en `17ddfec`→`repo.ts:362-379`, `ticketConOrdenVenta`), delta propio
  (`specs/remisiones/spec.md:13`). Mapa de desplazamiento medido en `repo.ts` (vía hunks de
  `git diff`): líneas 1-52 sin cambio; 53-70 reescritas (upsertTicket+DiscrepanciaOV);
  71-273 +27 (ej. `:271`→`:298`); 274 reescrita (ahora 301-306); 275-380 +32 (ej.
  `:330-347`→`:362-379`); 381-390 reescritas (createTicket INSERT); 391-417 +35. `sync.ts` logró
  desplazamiento CERO en `:9`,`:62`,`:119` (ediciones en su sitio, como preveía el diseño).
  **Barrido cerrado el 2026-09-28; sustituye al «pendiente» que se declaraba aquí.** Las ~20 citas a
  `repo.ts` de `openspec/specs/transitions-st/spec.md` y `openspec/specs/trazas/spec.md` se repararon
  leyendo qué afirma cada frase: caso A (línea de hoy) o caso B (anclada «en `17ddfec`»). Los docs fechados
  (`F0-00_Baseline_as-built.md`, `Paquete_de_Despliegue_*.md`) SÍ se tocaron, pero sólo para anclar sus
  citas a la revisión que afirman (caso B), sin renumerarlas. Además, 15 citas en comentarios `.ts` a
  `repo.ts`, `remision.ts` y `remisiones.test.ts` se reapuntaron (caso A). `openspec/changes/archive/*` sigue fuera.
- 9.3/9.4: IV-11 → `REDUCIDO` (no cerrado) en `CLAUDE.md` y `config.yaml` (detalle en `adendas_incumplimientos_vivos` → IV-11): filas marcadas desde ahora
  protegidas + avisan a Comercial; filas previas sin marca siguen expuestas (sin relleno, decisión de
  persona sobre datos de producción, S-1); cura de raíz = cambio 2 de F1B-11. Narrativa histórica
  (`la_cadena`/`las_dos_mitades`) conservada sin reescribir (Caso B), con qualificador fechado.
- 9.5: `docs/sdd/R08.3_Expediente_de_cambios.md:514` (§11.1) corregido: la discrepancia se enseña con
  aviso a Comercial (`decision/e005c-discrepancia-sin-espejo`), no en el espejo de Zoho. `registro:`
  de `e005c` en `config.yaml` apunta a §11.1.

## Medida final

`git diff --shortstat --no-renames HEAD` (2026-09-28, tras el barrido): **53 files changed, 904 insertions(+), 274 deletions(-)** =
**1.178** líneas reales. Techo del preflight 800; **Gerencia aprobó 1.250** el 2026-09-28. La medida de 695 era anterior al
barrido de citas (bloque 1: 15 citas en `.ts`; docs y specs), que es lo que la subió.

## Deviations from Design

`upsertTicket` creció más de lo estimado por el diseño (objetivo "0 desplazamiento" en `repo.ts` no se
cumplió: desplazamientos +27/+32/+35 según segmento, medidos exactos vía hunks). `sync.ts` sí cumplió
el objetivo exacto. Dos mutaciones del diseño (e, f) sobrevivieron a la primera pasada de tests y
exigieron tests nuevos — no estaba previsto en el diseño pero es exactamente para lo que sirve la
Fase 7.

## Remediación del verify (2026-09-28)

Cierra los 3 escenarios PARTIAL del verify-report (WARNING 1-3), sólo tests, sin tocar código de
producción; todas las líneas nuevas van al FINAL de sus ficheros (regla de mutación 4).

| Requisito | Test | Mutación real ejecutada | RED | Revertido |
|---|---|---|---|---|
| RQ-ZS-01 salesorder_id no cambia | `packages/zoho-sync/src/db/repo.test.ts:429-438` | Añadida `'salesorder_id'` a `TICKET_COLS` (`repo.ts`) | `expected null to be 'SO-APP'` | `git checkout -- repo.ts`, diff limpio |
| RQ-ZS-01 sin relleno retroactivo | `packages/zoho-sync/src/db/migrate.test.ts:432-444` | Añadido `UPDATE tickets SET ov_elegida_en_app_at=now() WHERE ...` tras la ALTER (`schema.sql`) | `expected [ …(2) ] to have a length of 1 but got 2` | `git checkout -- schema.sql`, diff limpio |
| RQ-AV-13 el hub nunca avisa | `apps/hub-sync/src/hub-sync.guardian.test.ts:17-20` (nuevo) | Añadido `alDiscrepanciaOV: async () => {}` a `createSync({...})` en `hub-sync.ts:21` | `expected ... not to contain 'alDiscrepanciaOV'` falló | `git checkout -- hub-sync.ts`, diff limpio |

Verificación final, re-ejecutada por el orquestador: `npm test` 1474 pasan, 2 skip (+3 sobre 1471);
`typecheck` limpio; `eslint --max-warnings 165` 165 warnings, 0 nuevos; `build` OK. El orquestador retiró
un cuarto test en memoria del guardián de hub-sync: comprobaba su propia sustitución y era tautológico.
