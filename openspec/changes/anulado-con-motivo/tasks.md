# Tareas — `anulado-con-motivo` (F1C-01, `cierra: si`)

Cinco intentos (propuesta §5), cada uno con techo 800 y válvula 720, salvo el archive, que pide techo por la mudanza
(regla del archivo). Un intento sólo se asienta si sus códigos salen 0. Rojo antes de cada verde (`strict_tdd`).

## Intento 1a · Planificación

- [x] 1a.1 `proposal.md` con la medición, la partición y los supuestos S-1 a S-7.
- [x] 1a.2 `design.md` (D1-D10) y este `tasks.md`.

## Intento 1b · Specs

- [x] 1b.1 Deltas de `transitions-st`, `transitions-equipo-nuevo`, `transitions-soporte-remoto` y `tickets-core`. Los
  MODIFIED se copian del bloque vivo por script, y antes del commit se comparan con `diff` los títulos
  `#### Scenario` del bloque vivo y del delta.

## Intento 2 · Lote 1: motivos, estado, transiciones, guarda, cierre y vigilantes (D1-D5, D7)

- [x] 2.1 **Rojo.** `packages/shared/src/anulacion.test.ts` (nuevo): la lista de cinco, sin «creado por error» ni
  «duplicado»; motivo fuera de la lista; «Otro» sin detalle; la guarda se activa por el campo; los tres catálogos llevan
  su transición con área Comercial, sus orígenes y el campo obligatorio; `Anulado` es `ninguna` y terminal.
- [x] 2.2 **Rojo.** `apps/desk/server/anulacion.test.ts` (nuevo), con el molde de `liberacionSinFactura.test.ts`:
  sin motivo da `422`; motivo fuera de la lista da `422`; «Otro» sin detalle da `422`; motivo válido deja el ticket en
  `Anulado` con `status_type = 'Closed'`, la traza y el motivo en `values`; un usuario sin Comercial recibe `403`; la
  posición `403` antes de `422` con motivo malo (PL-1 bis); `409` desde `Solicitado` y desde `En espera de SKU
  inventario`; y una anulación por cada flujo.
- [x] 2.3 **Verde.** `anulacion.ts`, la línea `:99` de `estados.ts`, las tres transiciones (D3), `CLOSED_STATUSES`
  (D4), la guarda en `ticketService.ts:134` (D5) y el export en `index.ts`.
- [x] 2.4 **Vigilantes** de D7: cada uno, rojo primero y luego actualizado sólo si su mensaje lo ata a este cambio. Mapa
  regenerado. `cifras_ancladas` en `openspec/config.yaml` y `cifrasAncladas.test.ts`, en sitio.
- [x] 2.5 **Mutaciones** M0-M5 y M10 de D9, restauradas.
- [x] 2.6 **Cierre del intento:** test, typecheck, lint (165 avisos como máximo), commit y detector `--sha HEAD` en una
  cadena; medida `git diff --shortstat --no-renames` contra la partida más lo nuevo sin trackear.

## Intento 3 · Lote 2: métricas e histórico (D6, D8)

- [x] 3.0 **Partición del intento 2** (superaba la válvula: 870 líneas medidas). Entran aquí las pruebas HTTP del lote 1
  (`apps/desk/server/anulacion.test.ts`, en rojo antes del verde del intento 2, como consta en `apply-progress.md`) y
  `apply-progress.md`.

- [x] 3.1 **Rojo.** `packages/shared/src/analisisAnulados.test.ts` (nuevo): un anulado con `finalizadoAt` en el periodo
  no cuenta en finalizados, ni en el tiempo promedio, ni en el OTD, y sí cuenta como creado. Y un anulado no entra en la
  media de resolución de la ficha (S-5).
- [x] 3.2 **Rojo.** Guardián de `docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql`, que se pone rojo si el fichero
  no existe o escribe.
- [x] 3.3 **Verde.** `analisis.ts:59`, `cierreEnCifras.ts` y el `.sql`.
- [x] 3.4 **Mutaciones** M6-M9 de D9, restauradas.
- [x] 3.5 **Cierre del intento**, como el 2.6, más el build para medir el bundle.

## Intentos 4 y 5 · Verify y archive

- [x] 4.1 `verify-report.md`: escenarios → pruebas, rojo reproducido, M0-M10 reproducidas, regla 13 y regla de mutación
  4 sobre `estados.ts` y `transitions.ts`.
- [ ] 5.1 Archive: los deltas fusionados por script; parte revisable medida ANTES; `archive-report.md`;
  `git show --numstat` sólo del cambio; `RECONCILIACION.md` regenerado en la rama.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Ejecutar la consulta de candidatos en producción, confirmar cuáles se abandonaron y marcarlos | Alfonso y Servicio Técnico | `proposal.md` §6 · consecuencia 3 de `decision/c2-anulado` |
| P-2 | Revisar los supuestos S-1 a S-7 en la lista semanal | Gerencia | `proposal.md` §4 · `decision/supuestos-semanales-aceptacion` |
| P-3 | Pegar en el maestro las cifras 21 estados, 32 transiciones y 40 pasos (`toca_maestro: si`) | Gerencia | `proposal.md` §1 |
| P-4 | Comprobar a mano, tras el despliegue, que Comercial ve «Anulación» con el desplegable de motivos | quien despliegue | RQ de `transitions-st` de este cambio |
