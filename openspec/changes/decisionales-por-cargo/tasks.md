# Tareas — `decisionales-por-cargo` (F1C-05, `cierra: no`)

`strict_tdd`: cada tarea de código empieza por su prueba en rojo, vista y anotada en `apply-progress.md` con la salida. Las
referencias D* son de `design.md`; RQ-* de la delta. Las mutaciones se hacen con `herramientas/mut.mjs`, que restaura y
comprueba; nunca `git checkout` ni `git stash`.

## Lote 1 — packages/shared y el interruptor (intento 3)

- [x] 1.1 Línea base: `npx vitest run packages/shared packages/zoho-sync/src/config.test.ts` en verde; `npm run typecheck` en 0.
- [x] 1.2 ROJO: `packages/shared/src/decisionales.test.ts` (D6) con la tabla de las 14 y los escenarios de RQ-PM-29. Rojo por
      módulo inexistente.
- [x] 1.3 VERDE: `packages/shared/src/decisionales.ts` (D1) y `export * from './decisionales'` al final de `index.ts`.
- [x] 1.4 ROJO: `describe` nuevo al final de `packages/zoho-sync/src/config.test.ts` (RQ-PM-28). Rojo por `undefined`.
- [x] 1.5 VERDE: `decisionalesPorCargo` en `config.ts` (D2): interfaz en la línea 66, carga tras `:123`.
- [x] 1.6 Mutaciones M1a, M1b, M3, M4a, M4b, M5a, M5b y M6 sobre la prueba de shared y la de config: todas rojas y restauradas.
- [x] 1.7 Los cuatro códigos (test, typecheck, lint con los 165 avisos de partida, detector tras el commit), `apply-progress.md`
      del lote 1 y commit; medida `--no-renames` contra el commit de partida del intento.

## Lote 2 — servidor, ruta, cliente y DEPLOY.md (intento 4)

- [x] 2.1 ROJO: `apps/desk/server/decisionalesPorCargo.test.ts` (D6): la caracterización apagada (verde: anotar), los
      escenarios de RQ-PM-30 y los de la ruta de RQ-PM-31. Rojo por `403` ausente y `404` de la ruta.
- [x] 2.2 VERDE servidor: `services/decisionales.ts`, la guarda en `ticketService.ts:131` y los imports en `:6`/`:7` (D3);
      `appHarness.ts:46`/`:49`.
- [x] 2.3 VERDE ruta: `routes/permisosDecisionales.ts` y su registro en `app.ts:61` (D3).
- [x] 2.4 Cliente (D4): `getContextoDecisionales` al final de `api/client.ts`; `TransitionPanel.tsx:3`, `:8`, `:55`, `:57`.
      Sin prueba (`.tsx` fuera de la red, F0-00); lo cubre `npm run typecheck` y la tabla de la regla 13.
- [x] 2.5 `DEPLOY.md` §15 al final (D5).
- [x] 2.6 Mutaciones M2, M3, M4a, M4b, M7a, M7b, M7c y M8 contra la prueba del servidor: todas rojas y restauradas.
- [x] 2.7 Guarda de D9: `git diff --numstat` con inserciones = borrados en `ticketService.ts`, `app.ts`, `appHarness.ts` y
      `TransitionPanel.tsx`; barrido de citas `config.ts:12[0-9]`.
- [x] 2.8 Paquete del cliente: `npm run build` (base `index-a-eCb2uc.js`, 419.482 bytes) y diferencia.
- [x] 2.9 Los cuatro códigos, `apply-progress.md` del lote 2 con la tabla de la regla 13 cerrada línea a línea, y commit; medida.

## Cierre

- [ ] 3.1 verify (intento 5) y archive (intento 6) con la regla del archivo; RECONCILIACION.md regenerado en la rama.

## Tareas de persona (no cuentan; regla del ciclo 1)

Asignar `cargo_permiso` antes de encender; añadir la línea a `.env.example`; encender no antes del 14/12; actualizar M1.9 del
maestro al encender; revisar S-1 a S-6. Dueños y destino en `proposal.md` §10. **Archivar no las da por hechas.**

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | lote 1 ~260 (×1,8 = 470), lote 2 ~320 (×1,8 = 580) |
| 400-line budget risk | Low por intento (techo 800, válvula 720) |
| Chained PRs recommended | No: un intento por lote, en un worktree, una fusión |
| Decision needed before apply | No |
