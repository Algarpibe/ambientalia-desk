---
tanda: F1F-01
motivo: ""
capacidad: [tickets-core]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `fecha-migracion-fuera-de-cifras`

## 1. Qué decisión construye

`decision/h1-fechas-migrados` (Gerencia, 2026-10-17; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`): «Los tickets
migrados cuentan en Análisis con sus fechas originales de Zoho: creación, transiciones y cierre. La fecha de la migración queda
sólo como marca, y no entra en ningún indicador.» Responde H-1 de `docs/sdd/TRASPASO_2026-10-08.md` (sección final del
2026-10-17). E-207 (`decision/migracion-e207-e212`, (1)) sigue en pie: la fecha de cierre de la migración se conserva en la base.

## 2. Qué hay hoy (medido en `73bd52f`)

La migración (`apps/desk/server/db/migracionTicketsAbiertos.ts:75`) deja en el marcador de `ticket_transitions`
(`transition_id = 'migracion_f1f01_abiertos'`, `packages/shared/src/migracionTickets.ts:14`) el `cierre_origen` y el
`closed_time_destino`, y escribe ese `closed_time` en `tickets` (`:85`). Nadie lee `cierre_origen`. Tres lectores meten hoy la
fecha de la migración en una cifra, y uno el marcador:

| Lector | Cifra | Cómo entra la migración |
|---|---|---|
| `apps/desk/server/analisis.ts:26` → `packages/shared/src/analisis.ts:59-68` | finalizados, tendencia, tiempo promedio, cumplimiento | `fecha_finalizacion_st ?? closed_time` cae al `closed_time` de la migración |
| `apps/desk/src/components/ClienteDetalle.tsx:123-128` | «Tiempo de resolución» de la ficha de cliente | resta `closedAt − createdAt` **en el `.tsx`**, con `closed_time` en crudo (`apps/desk/server/db/directory.ts:21-30`) |
| `apps/desk/server/db/informeContrato.ts:34` | fecha de ejecución de cada subOV y % ejecutado | la primera transición a «Finalizado» puede ser el marcador, con `performed_at` = migración |
| `apps/desk/server/indicadores.ts:76-84` → `packages/shared/src/indicadores.ts:134` | atributo `reentrante` de los nueve indicadores | el marcador cuenta como paso del historial y vuelve `reentrante` falso donde era «sin dato» |

No la meten (verificado): los nueve indicadores en sus valores (no leen `closed_time`; el marcador no lleva claves de hito), la
comparación con Zoho, la cola del taller, el tiempo en tarjeta y el SLA (`apps/desk/server/db/sla.ts:78-102`: los estados con SLA
llegan por identidad, `to_status` NULL).

## 3. Qué se construye

1. **Regla pura en `packages/shared`** (fichero nuevo `cierreEnCifras.ts`): reconocer el paso marcador, sacar de su `values` el
   cierre que puso la migración, decidir qué `closed_time` cuenta, qué llegada a «Finalizado» cuenta, y la media de resolución.
2. **Servidor:** Análisis, la ficha de cliente (la media pasa al servidor), el informe de contrato y la lectura de indicadores
   consumen esa regla. Una lectura nueva, `cierresPuestosPorMigracion`, da por ticket el instante que puso la migración.
3. **Cliente:** `ClienteDetalle.tsx` deja de calcular y sólo formatea la media que llega del servidor (regla invariable 13).

**Sin migración de base de datos**: ni tabla ni columna; la marca ya está en el marcador.

## 4. Fuera de alcance

- El SLA y el tiempo en estado: el marcador con `to_status` es una entrada real al estado dentro de la aplicación (D-6 de
  `migracion-tickets-abiertos`) y hoy no entra en ninguna cifra (S-4).
- **Hallazgos para la bandeja, no se corrigen:** la ficha de cliente rotula «Últimos 6 meses» sin filtrar por fecha
  (`ClienteDetalle.tsx:192`), y «Tiempo de primera respuesta» y «Tiempo de respuesta» van fijos a «00:00» (`:193-194`).

## 5. Supuestos reversibles — plazo: una semana desde que se publique

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | «La fecha que vino de la migración» es el `closed_time` IGUAL (mismo instante) al `closed_time_destino` de un marcador con `cierre_origen: 'migracion'`; si el ticket se cerrara después con otra fecha, ésa cuenta | Comparar sólo por la existencia del marcador |
| S-2 | Un migrado sin fecha de cierre de Zoho NO cuenta como finalizado en Análisis: ni en el mes, ni en el tiempo promedio, ni en el cumplimiento | Contarlo como finalizado sin fecha |
| S-3 | En el informe de contrato el marcador nunca fecha por su `performed_at`; con `cierre_origen: 'zoho'` fecha con el `closed_time_destino`, que es la de Zoho; con `'migracion'` queda sin fecha | Que el marcador no feche nunca |
| S-4 | El SLA y el tiempo en estado no cambian (§4) | Filtrar el marcador también en `entradasActuales` |
| S-5 | El marcador no cuenta como paso del historial de los indicadores: `reentrante` vuelve a «sin dato» | Volver a contarlo |
| S-6 | El listado de tickets de la ficha sigue enseñando `closedAt` tal cual: es marca, no cifra | Ocultarlo en los migrados |

## 6. Riesgo

`indicadores.ts` de shared (184 citas), `ClienteDetalle.tsx` (101) y `directory.ts` (52) son ficheros muy citados: se editan
en sitio o al final, sin insertar líneas, y se barre la regla de mutación 4 al cerrar.
