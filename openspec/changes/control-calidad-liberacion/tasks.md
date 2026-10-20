# Tareas — `control-calidad-liberacion` (F1C-07, `cierra: no`)

`strict_tdd`: cada lote abre con su prueba en ROJO, vista y anotada en `apply-progress.md` con la salida y la causa; luego el VERDE.
D* son de `design.md`; RQ-* y CC-* de las deltas `specs/*/spec.md`. Las mutaciones se hacen con `herramientas/mut.mjs`, que
restaura y comprueba; nunca `git checkout` ni `git stash`. Cada lote cierra con los cuatro códigos (test, typecheck, lint con la
línea base, detector tras el commit), `apply-progress.md`, commit y la medida `git diff --shortstat --no-renames` más `wc -l`.

## Lote 1a — catálogo, estado, fase, columna, mapa (intento I3; ~250 × 1,8 = 450)

- [x] 1a.1 Línea base: `npx vitest run packages/shared apps/desk/server` en verde; `npm run typecheck` en 0.
- [x] 1a.2 ROJO: `packages/shared/src/controlCalidadCatalogo.test.ts` (RQ-TS-46, -50): estado, fase, columna, tres transiciones,
      campos coincidentes con `transitions.ts:223`. Rojo por módulo y estado inexistentes.
- [x] 1a.3 ROJO: ajustar los vigilantes en su línea (D6: `cifrasAncladas.test.ts:24`, `estados.test.ts:16-17`/`:226`,
      `invariantesGrafo.test.ts:51-53`/`:173-174`, `tipoEvento.test.ts:12-31`/`:44-55`, `decisionales.test.ts:17-23`,
      `transitions.test.ts:126`, `transitionsSoporteRemoto.test.ts:58`, `fasesBlueprint.test.ts:17-20`, `columns.test.ts:9`/`:46-47`,
      `mapaBlueprint.test.ts:46-54`/`:182-184`, `prioridad.test.ts:118-120`, `migracionTickets.test.ts:25-28`). Rojo por los conteos.
- [x] 1a.4 VERDE: `packages/shared/src/camposControlCalidad.ts` (D1) y `estados.ts:99`, `fasesBlueprint.ts:55`, `columns.ts:30`,
      `transitions.ts:262` (imports en `:74`), todo en su línea; `decisionales.ts:46` gana `|| IDS_FIRMA_CC.has(t.id)` (D2).
- [x] 1a.5 `cifras_ancladas`: sólo `openspec/config.yaml:1360-1383` (24→26, 21→23, conteos); nada más del fichero.
- [x] 1a.6 Regenerar el mapa con `scripts/generar-mapa-blueprint.ts` (`docs/artefactos/`); medir el desplazamiento (hipótesis ≈ 40).
- [x] 1a.7 Mutaciones: M12 (aprobación `to: 'Por Entregar'`: caen RQ-TS-46, `transicionesEjecucion.test.ts`, «aprobado lleva a Por
      Facturar») y M14 (quitar la exclusión de `decisionales.ts:46`: cae RQ-PM-35, «el 403 es el de firmante»). Rojas y restauradas.

## Lote 1b — regla pura (intento I4; ~340 × 1,8 = 612)

- [ ] 1b.1 ROJO: `packages/shared/src/controlCalidad.test.ts` (RQ-PM-33, -34 pura, -37 visibilidad, RQ-TZ-24, gas, prioridad, D2).
      Rojo por módulo inexistente.
- [ ] 1b.2 VERDE: `packages/shared/src/controlCalidad.ts` (firma de D2) y `export * from './controlCalidad'` al final de `index.ts`.
- [ ] 1b.3 Mutaciones en shared: M3 (sin `derivadoA`) y M4 (sin traza): «quien intervino no firma». M5 (`!== null`): «Decisional,
      Compras / Logístico y Administrativo no son intervención». M6 (vacante siempre): «con Coordinador activo, ni el Especialista ni
      el Director». M7 (Técnico habilitado): «vacante… no un Técnico». M8 (admin sin `quedaHabilitadoLibre`): «con un habilitado libre
      el administrador no firma». M9 (sin error de motivo): «sin motivo, 422». M11b (`contarRetrabajos` cuenta todas): «cuenta sólo los
      rechazos». M13 (siempre por nombre): «fila con id frente a fila sin id». M15 (gas siempre/nunca): «sin patrón vigente…» y «con
      patrón vigente se exige». Todas rojas y restauradas.

## Lote 2a — interruptor, traza y envío (intento I5; ~200 × 1,8 = 360)

- [ ] 2a.1 ROJO: `packages/zoho-sync/src/config.test.ts` (RQ-PM-32: literales `'true'`) y la prueba de `performed_by_id` en
      `repo.test.ts`/`migrate.test.ts` (columna, sin calificar, `actorId` por defecto `null`). Rojo por `undefined` y columna ausente.
- [ ] 2a.2 ROJO: `apps/desk/server/controlCalidad.test.ts`, primera parte: caracterización apagada (verde: anotar), RQ-TS-47, CC-1
      (`409` del interruptor antes del de estado), CC-2 (antes del `403` de área).
- [ ] 2a.3 VERDE: `config.ts:66` y línea tras `:124` (`=== 'true'`); `appHarness.ts:46`/`:49`; `schema.sql` (`ADD COLUMN IF NOT EXISTS
      performed_by_id text`, al final); `repo.ts:283`, `:315-317`, `:329`, `:333`, `:339`; guarda `ticketService.ts:128` y envoltorio `exigirInterruptorControlCalidad`.
- [ ] 2a.4 Barrido HTTP del envío: `permisos.test.ts:43-109` y `transicionesEjecucion.test.ts:250-286` con la app encendida; vigilantes `permisos.test.ts:77-81`/`:349-356`, `transicionesEjecucion.test.ts:185`/`:285`.
- [ ] 2a.5 Mutaciones: M1 (`!== 'false'`) cae en `config.test.ts`; M2 (`=== true` → `true`) cae en la caracterización apagada y «apagado, el
      envío da 409»; P1 (`409` antes del de estado) cae en CC-1; P2 (tras el `403` de área) cae en CC-2.

## Lote 2b — servicio de firma (intento I6; ~380 × 1,8 = 684; si mide > 720, RQ-TS-48 sale a un intento propio)

- [ ] 2b.1 ROJO: `controlCalidad.test.ts` HTTP, segunda parte: RQ-PM-34..36, RQ-TS-48, RQ-TZ-23, CC-3..CC-6 (cada prueba de posición
      activa las dos guardas a la vez), M3/M4 por HTTP. Rojo por `403` y `422` ausentes.
- [ ] 2b.2 VERDE: `apps/desk/server/services/controlCalidad.ts` (`contextoFirma`, `veredictoFirmaControlCalidad`, `erroresControlCalidad`,
      `leerContextoGas` con `hoyEnZona()`); guardas `ticketService.ts:131`, `:133` (claves de QA fuera de `custom_fields`), `:134` (`422`
      agregado) y envoltorio `exigirFirmaControlCalidad` al final; imports en `:6`/`:7`.
- [ ] 2b.3 Barrido HTTP de las de firma: esperado `403` sin cargo en `permisos.test.ts:43-109`; `appHarness.ts:74` rellena
      `CLAVE_MOTIVO_FIRMA_ADMIN` para que el administrador firme de respaldo (`transicionesEjecucion.test.ts:250-286`).
- [ ] 2b.4 Mutaciones: P3 (firma antes del área) cae en CC-3; P4 (tras `valoresConFechasDerivadas`) cae en CC-4; P5 (`errCC` tras la
      persona derivada `:138-142`) cae en CC-5/CC-6. Confirmar de nuevo M3/M4 contra «quien intervino no firma» por HTTP.

## Lote 2c — prioridad, aviso y ruta (intento I7; ~200 × 1,8 = 360)

- [ ] 2c.1 ROJO: `controlCalidad.test.ts` HTTP, tercera parte: RQ-TS-49 (el rechazo sube a `High`, no baja `Urgent`), RQ-AV-24 (aviso a
      administradores, sólo bandeja; fallo del aviso no rompe el envío), RQ-PM-37 (ruta `GET /api/permisos/control-calidad`). Rojo por
      `404` de la ruta y aviso ausente.
- [ ] 2c.2 VERDE: `prioCC` en `ticketService.ts:133`; `avisarSinFirmanteLibre` en `:155`; `destinatariosAdministradores` al final de
      `db/avisos.ts`; `routes/permisosControlCalidad.ts` y registro en `app.ts:22`/`:61`.
- [ ] 2c.3 Mutaciones: M10 (aviso a `destinatariosDeCargoPermiso('Director Técnico')` / sin llamada) cae en «no va al Director Técnico» /
      «avisa a los administradores»; M11a (sin `prioCC`) cae en «el rechazo sube la prioridad».

## Lote 3 — cliente, DEPLOY.md y cierre de citas (intento I8; ~70 × 1,8 = 126)

- [ ] 3.1 Cliente (D4): `getContextoControlCalidad` al final de `api/client.ts`; `TransitionPanel.tsx:3`, `:8`, `:55`, `:57`. Sin prueba
      (`.tsx` fuera de la red, F0-00); lo cubre `npm run typecheck`.
- [ ] 3.2 `DEPLOY.md` §16 al final, tras `:754-774`: qué enciende `CONTROL_CALIDAD_LIBERACION` y qué se rompe; y su prueba de presencia.
- [ ] 3.3 Tabla de la regla 13 (D5) cerrada decisión a decisión, con línea del servidor, en `apply-progress.md`.
- [ ] 3.4 Barrido de la regla de mutación 4: `git diff --numstat` con inserciones = borrados en `estados.ts`, `transitions.ts`,
      `fasesBlueprint.ts`, `columns.ts`, `decisionales.ts`, `ticketService.ts` (salvo el final), `repo.ts`, `app.ts`, `appHarness.ts`,
      `TransitionPanel.tsx`, `schema.sql`, `avisos.ts` y los que se toquen; `config.ts` mueve sólo `:125-126`. Para cada uno,
      `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` con cada resultado leído contra el fichero, más el pase de las abreviadas.
- [ ] 3.5 Caso A: `estados.ts:111` («24»→26), `:187` («21»→23), `fasesBlueprint.ts:29` («21»→23); releer las citas a `ticketService.ts:128`,
      `:131`, `:133-134`, `:155` y `repo.ts:315-317`, `:322-330`.
- [ ] 3.6 `npm run build` y diferencia del paquete del cliente; cuatro códigos y commit; verify (I9) y archive (I10) con la regla del archivo.

## Fuera del recuento (Regla del ciclo 1; **archivar no las da por hechas**)

- Encender `CONTROL_CALIDAD_LIBERACION` en enero, junto con `DECISIONALES_POR_CARGO` — Gerencia; destino: `proposal.md` §10.
- Asignar `cargo_permiso` a los usuarios antes de encender — administrador.
- Añadir la línea de `CONTROL_CALIDAD_LIBERACION` a `.env.example` — Supervisión.
- Lista semanal de supuestos S-1..S-18 para que Gerencia corrija en una semana — Gerencia.
- D11 (foto del equipo embalado, firma con imagen, checklist alimentado): fuera de alcance, sostiene `cierra: no`.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (×1,8) | 1a 450 · 1b 612 · 2a 360 · 2b 684 · 2c 360 · 3 126 = 2.592 |
| 400-line budget risk | Medium (todos los lotes bajo 800; 2b cerca de la válvula 720) |
| Chained PRs recommended | No: un intento por lote en un worktree, una fusión al cerrar |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Cada lote cabe bajo 800. Si 2b mide más de 720 antes de cerrar, RQ-TS-48 sale a un intento propio.
