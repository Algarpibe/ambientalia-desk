# Archive · `fecha-migracion-fuera-de-cifras` (F1F-01, `cierra: no`)

**Fecha:** 2026-10-17 · **Rama:** `fecha-migracion-fuera-de-cifras` · **Partida:** `73bd52f` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1F-01 cubre, en una línea:** H-1 —la fecha de cierre que puso la migración, y su marcador, no entran en
ninguna cifra (`decision/h1-fechas-migrados`)—; **deja fuera** la ejecución real de la migración, la pasada en seco y las tareas de
persona de `decision/migracion-e207-e212`, así que la fila NO se cierra.

## Qué decisión construye

`decision/h1-fechas-migrados` (Gerencia, 2026-10-17; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`, commit `73bd52f`).
E-207 sigue en pie: la fecha se conserva en `tickets.closed_time`.

## Qué quedó construido

- Regla pura `packages/shared/src/cierreEnCifras.ts` (`esPasoDeMigracion`, `cierrePuestoPorMigracion`, `cierreQueCuenta`,
  `llegadaQueCuenta`, `resolucionPromedioMs`), exportada al final de `packages/shared/src/index.ts`.
- Lectura `apps/desk/server/db/cierresDeMigracion.ts`: por ticket, el cierre que puso la migración.
- Análisis (`apps/desk/server/analisis.ts:26`): un cierre puesto por la migración deja de ser `finalizadoAt`; el ticket no cuenta
  como finalizado, ni en el tiempo promedio ni en el cumplimiento. El cierre de Zoho de un migrado sí cuenta.
- Ficha de cliente: la media de resolución pasa del `.tsx` al servidor (`conResolucion`, al final de
  `apps/desk/server/db/directory.ts`), sin el cierre de la migración; `ClienteDetalle.tsx` sólo formatea.
- Informe de contrato (`apps/desk/server/db/informeContrato.ts:35`): el marcador no fecha por su `performedAt`; con
  `cierre_origen: 'zoho'` fecha con la de Zoho.
- Indicadores y comparación con Zoho (`apps/desk/server/indicadores.ts:81`): el marcador no es paso del historial; `reentrante`
  vuelve a «sin dato».
- RQ-TC-69 nuevo, fusionado por script al final de `openspec/specs/tickets-core/spec.md` (bloque idéntico al del delta).
- **Sin migración de base de datos.** **Cambia el bundle**, porque cambia `ClienteDetalle.tsx`.

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) |
|---|---|---|
| Planificación | `9c14a7f` | 223 (+223) |
| Aplicación | `5f3d036` | 433 (+379 −54) |
| Verify | `3f09d42` | 51 (+50 −1) |
| Archive | este commit | mudanza más la parte revisable: fusión 54 + este informe, medida antes de aplicar, bajo 800 |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

S-1 «la fecha que vino de la migración» es el `closed_time` igual al `closed_time_destino` de un marcador `'migracion'` · S-2 un
migrado sin fecha de cierre de Zoho no cuenta como finalizado en Análisis · S-3 el marcador nunca fecha el informe de contrato por
su `performedAt`; con «zoho» fecha con la de Zoho · S-4 el SLA y el tiempo en estado no cambian · S-5 el marcador no es paso del
historial de indicadores · S-6 el listado de la ficha sigue enseñando `closedAt` tal cual. Cómo se revierte cada uno:
`proposal.md` §5.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Tras la migración real, comprobar en Análisis que los «Entregado» sin fecha de Zoho no salen como finalizados del día de la migración | Quien despliega, con Gerencia |
| P-2 | Revisar S-1 a S-6 en la lista semanal (E-237) | Gerencia |
| P-3 | Decidir los dos hallazgos de la ficha de cliente («Últimos 6 meses» sin filtro; dos tiempos fijos a «00:00») | Gerencia |
