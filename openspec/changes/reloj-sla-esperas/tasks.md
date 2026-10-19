# Tareas — `reloj-sla-esperas` (F1C-06, `cierra: si`)

`strict_tdd`: cada tarea de código empieza por su prueba en rojo, vista y anotada en `apply-progress.md` con la salida. Las
referencias D* son de `design.md`; RQ-* de la delta. Las mutaciones se hacen con
`C:\dev\Desk_2_R1.023-worktrees\herramientas\mut.mjs`, que restaura y comprueba; nunca `git checkout` ni `git stash`.

## Lote 1 — packages/shared (intento 3)

- [x] 1.1 Línea base: `npx vitest run packages/shared apps/desk/server/analisis.test.ts` en verde; `npm run typecheck` en 0.
- [x] 1.2 ROJO: `packages/shared/src/relojSla.test.ts` (D7) con los escenarios de RQ-TC-73, RQ-TC-74 y RQ-TC-77 (guardián de
      imports y alarma de `Notificación cliente`). Rojo por módulo inexistente.
- [x] 1.3 VERDE: `packages/shared/src/relojSla.ts` (D1) y `export * from './relojSla'` al final de `index.ts` (tras `:48`).
- [x] 1.4 D2: `estados.ts:30-33` y `:117-118` reescritos en sitio; `git diff --numstat` con inserciones = borrados.
- [x] 1.5 Tipos D4 en sitio: `types.ts:571` y `:591`, sin insertar líneas (`:611` está citado).
- [x] 1.6 ROJO: `describe` nuevo al final de `packages/shared/src/analisis.test.ts` (RQ-TC-76, cinco escenarios). Rojo por medias
      ausentes.
- [x] 1.7 VERDE: D5 en `packages/shared/src/analisis.ts` (`:2`, `:19`, `:65`, `:83` en sitio; `mediasDelReloj` tras `:95`).
- [x] 1.8 Mutaciones M1-M7, M9-M12 y M15 contra las pruebas de shared: todas rojas y restauradas.
- [x] 1.9 Barrido de citas de la regla de mutación 4 sobre `estados.ts`, `analisis.ts`, `types.ts` e `index.ts`
      (`grep -rnoE`), comprobando cada resultado contra el fichero y leyendo qué afirma la frase.
- [x] 1.10 Los cuatro códigos (test, typecheck, lint con los 165 avisos de partida, `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`
      tras el commit), `apply-progress.md` del lote 1 y commit; medida `--no-renames` contra el commit de partida del intento.

## Lote 2 — servidor y cliente (intento 4)

- [ ] 2.1 ROJO: `apps/desk/server/relojSla.test.ts` (pg-mem, D7): RQ-TC-75, cuentas de consultas con 10 y 100 tickets y S-D2.
- [ ] 2.2 VERDE: `apps/desk/server/db/relojSla.ts` (D3), tres consultas fijas y `secuenciaDelReloj` pura.
- [ ] 2.3 VERDE: `apps/desk/server/analisis.ts` (D4: `:3`, `:11`, `:22`, `:30`); `apps/desk/server/analisis.test.ts` sigue verde con
      sus cuentas (`:31`, `:36`, `:41`).
- [ ] 2.4 Cliente D6: dos `Kpi` tras `:98` y `md:grid-cols-5` → `md:grid-cols-4 xl:grid-cols-7` en `Analisis.tsx:94`. Sin prueba
      (`.tsx` fuera de la red, F0-00); lo cubre `npm run typecheck` y la tabla de la regla 13.
- [ ] 2.5 Mutaciones M8, M13 y M14 contra la prueba del servidor: todas rojas y restauradas.
- [ ] 2.6 Barrido de citas sobre `apps/desk/server/analisis.ts` y `Analisis.tsx`; guarda de D4: inserciones = borrados salvo lo nuevo.
- [ ] 2.7 Paquete del cliente: `npm run build` contra la base `index-BOdjeBia.js` (420.931 bytes) y diferencia.
- [ ] 2.8 Los cuatro códigos, `apply-progress.md` del lote 2 con la tabla de la regla 13 (D9) cerrada línea a línea, commit y medida.

## Cierre

- [ ] 3.1 verify (intento 5) y archive (intento 6) con la regla del archivo; `RECONCILIACION.md` regenerado en la rama
      (`npm run reconcile`).

## Tareas de persona (no cuentan; regla del ciclo 1)

Las de `proposal.md` §10 y la revisión de los supuestos S-1 a S-9, S-D1 y S-D2. Dueños y destino en `proposal.md` §10.
**Archivar no las da por hechas.**

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | lote 1 ~250 (×1,8 = 450), lote 2 ~280 (×1,8 = 500) |
| 400-line budget risk | Low por intento (techo 800, válvula 720) |
| Chained PRs recommended | No: un intento por lote, en un worktree, una fusión |
| Decision needed before apply | No |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
