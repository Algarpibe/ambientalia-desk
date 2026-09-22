# Exploración — `fechas-derivadas-servidor` (F1A-07 · IV-2)

**Fecha**: 2026-09-21 · **Árbol**: `f1a-07-r1`, base `4976787` · **Engram**: `sdd/fechas-derivadas-servidor/explore`

Decisión aplicable: `decision/iv2-fechas-derivadas`, 10/09, opción (a)
(`docs/sdd/Decisiones_Gerencia_2026-09-10.md:225-279`). El maestro ya la recoge en M1.10
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1756-1757`), y la regla de
fondo, «no admite excepciones», está en `:1755`.

---

## 1 · Camino del servidor hoy

- `POST /api/tickets/:id/transition` → `apps/desk/server/routes/tickets.ts:192-194` →
  `executeTransition` (`apps/desk/server/services/ticketService.ts:112`).
- Orden de guardas en `executeTransition`: transición conocida (`:120-121`) → ticket existe
  (`:122-123`) → `from` válido, 409 (`:124-126`) → permiso de área, 403 (`:127-129`) →
  `buildTransitionPlan`, 422 si hay errores (`:130-132`) → derivado válido (`:136-140`) → OV no
  duplicada, 409 (`:146-150`) → `applyTransition` (`:153`).
- `buildTransitionPlan` (`apps/desk/server/transitionExec.ts:37-99`) sólo exige que el campo
  **llegue** (`:76-77`), convierte la fecha con `slice(0, 10)` (`:33`) y la lleva a su columna por
  `PROMOTED_COLUMNS` (`:90-91`). No recalcula ni contrasta nada.
- `writeTransition` (`packages/zoho-sync/src/db/repo.ts:249-287`) hace tres escrituras: comentario,
  `UPDATE tickets` con `plan.columns` y `managed_by_app=true` (`:271`), e `INSERT` en
  `ticket_transitions` con el **`values` crudo** que mandó el navegador, no con el plan
  (`JSON.stringify(values)`, `:285`).
- Lo que el servidor ya tiene a mano en `executeTransition`: `current.row.created_time`
  (`getTicketWithRefs`). Lo que **no** tiene y tendría que pedir:
  - el instante del último «Escalado a Revisión»: hoy sólo lo calcula el GET del detalle
    (`routes/tickets.ts:142`) con `instanteUltimaTransicion` (`apps/desk/server/db/fechasTicket.ts:22-35`);
  - la remisión de entrada vigente: `listRemisionesByTicket` (`apps/desk/server/db/remisiones.ts:76-79`,
    `anulada_at IS NULL ORDER BY created_at DESC`); el filtro `tipo === 'entrada'` lo hace hoy el
    cliente (`apps/desk/src/lib/valoresTransicion.ts:56`); `fecha` sale como `YYYY-MM-DD`
    (`remisiones.ts:14`).

## 2 · Transiciones afectadas

| Transición | Campo | Obligatorio | Columna |
|---|---|---|---|
| `ingreso_a_servicio` (`packages/shared/src/transitions.ts:190-191`) | `Fecha creación ticket` | sí (`cfDate`, `:75`) | `fecha_creacion_ticket` (`packages/zoho-sync/src/db/rows.ts:103`) |
| `ingreso_a_servicio` (`:190-191`) | `Fecha Remisión Entrada` | sí | `fecha_remision_entrada` (`rows.ts:104`) |
| `reporte_por_garantia` (`:218-219`) | `Fecha Revisión Informe` | sí | `fecha_revision_informe` (`rows.ts:105`) |
| `escalado_a_comercial` (`:220-221`) | `Fecha Revisión Informe` | sí | `fecha_revision_informe` (`rows.ts:105`) |

Las tres columnas son `date` (`packages/zoho-sync/src/db/schema.sql:32`).

## 3 · Otros escritores de las tres columnas

Sólo uno: la sincronización de Zoho. `TICKET_COLS` incluye las tres (`packages/zoho-sync/src/db/repo.ts:49`)
y `upsertTicket` se abstiene sólo si `managed_by_app === true` (`:59`). Como `writeTransition` fija esa
bandera en la misma escritura (`:271`), tras la primera transición ejecutada en la app el sync ya no
las pisa. **Antes** de esa primera transición, un valor tecleado a mano en Zoho entra por sync, y es el
que `yaEsta` (`valoresTransicion.ts:22`) respeta como «ya está». Ninguna ruta de remisión, callback de
n8n, backfill ni script escribe esas columnas (barrido sobre `apps/` y `packages/`).

## 4 · Barrido de consumidores (Decisiones 10/09 `:276-279`)

- **`Fecha Remisión Entrada` — operando del KPI.** Abre el bodegaje de entrada
  (`packages/shared/src/bodegaje.ts:59-65`), y `periodosDeBodegaje` lo lee de **`paso.values[def.abre]`**
  (`bodegaje.ts:186`), o sea de `ticket_transitions.values`, **no** de la columna. Es regla escrita:
  «Los KPIs de G.6 se calculan sobre `ticket_transitions.values`, no sobre `tickets.*`»
  (`packages/shared/src/reentrancia.ts:24`). `bodegaje.ts` no tiene todavía consumidor en ruta ni en
  pantalla (destino F1C-06).
- **`Fecha creación ticket`** — no es ancla de ningún indicador, y a propósito:
  `marcaIngresoAServicio` ancla los indicadores 48 y 49 en `performedAt` de `ingreso_a_servicio`, y
  `bodegaje.ts:221-223` advierte que NO devuelve `Fecha creación ticket` porque es justo la avería.
- **`Fecha Revisión Informe`** — sin consumidor de KPI.
- `INDICADORES_G6` (`reentrancia.ts:78-83`) no incluye ninguna de las tres.
- Lectura en pantalla: `apps/desk/src/components/TicketProperties.tsx:61-63`, sólo muestra la columna.

**Consecuencia:** corregir sólo `plan.columns` deja la columna bien y el historial —que es lo que lee el
KPI— con lo que mandó el navegador. Cerrar el hueco exige que el `values` que se guarda en
`ticket_transitions` lleve también el valor derivado.

## 5 · Zona horaria hoy

- `diaLocal` (`valoresTransicion.ts:30-36`) usa `getFullYear/getMonth/getDate`: la zona del proceso.
- No hay helper de fechas en `packages/shared`. El único precedente con zona fijada es de servidor:
  `TZ_VISUALIZACION = 'America/Bogota'` con `Intl.DateTimeFormat(..., { timeZone })`
  (`packages/zoho-sync/src/db/mappers.ts:164-176`).
- `packages/shared` se empaqueta también para el navegador (`valoresTransicion.ts:1` lo importa), así
  que lo que viva ahí tiene que ser apto para navegador; `Intl` con `timeZone` lo es.

## 6 · Pruebas y entorno

- `vitest.config.ts:7` fija `process.env.TZ = 'UTC'` para toda la suite (comentario `:4-6`).
- CI: `ubuntu-latest` (`.github/workflows/ci.yml:9`). Las pruebas HTTP montan `pg-mem`
  (`apps/desk/server/testing/appHarness.ts:34-40`).

## 7 · Cliente

`TicketDetailView.tsx:329` pasa `valoresConocidos(ticket, remisiones)` a `TransitionPanel`, que bloquea
todo campo con valor (`yaLoTraeElTicket`, `TransitionPanel.tsx:32-36`) y lo **manda** al servidor.
`api/client.ts:51-60` hace el `POST { transitionId, values }`.

## 8 · Fuente ausente

Si el campo llega vacío, `buildTransitionPlan` da «Falta el campo obligatorio» y el servidor responde
422 (`transitionExec.ts:77`, `ticketService.ts:132`). Pero la pantalla **no** lo deja vacío por diseño:
`fechasTicket.ts:18-20` dice que un ticket escalado en Zoho no tiene fila en `ticket_transitions`,
devuelve `null` y «la pantalla deja el campo vacío para teclearlo». Hoy, sin fuente, la fecha se
teclea a mano.

## 9 · Regla de mutación 4 (medido, no reparado)

`valoresTransicion\.ts:NNN` → 3 citas en 2 ficheros. `transitionExec\.ts:NNN` → 38 citas en 14
ficheros. 41 en total, en 15 ficheros distintos.

## 10 · Especificación viva

- `openspec/specs/transitions-st/spec.md`: RQ-TS-08 (obligatorios), RQ-TS-09 (campo → columna),
  RQ-TS-10 (tres escrituras, `values` crudo en el historial), RQ-TS-11 (M1.10). Candidatas a MODIFY.
- `openspec/specs/trazas/spec.md` §3.4 documenta el bodegaje de entrada.

---

## Contraste del orquestador (2026-09-21)

Todas las citas anteriores se releyeron en `f1a-07-r1` antes de escribir este fichero. Dos cosas que
el informe del sub-agente no traía, o traía mal:

1. **`TZ=America/Bogota npx vitest` NO corre en Bogotá.** `vitest.config.ts:7` asigna `TZ` al cargar la
   configuración y pisa la variable externa. Comprobado ejecutando una prueba sonda con y sin
   `TZ=America/Bogota` delante: las dos veces `process.env.TZ` vale `UTC` y `getTimezoneOffset()` vale
   0. Consecuencia para el criterio de aceptación: la mitad «roja con TZ=UTC contra la implementación
   vieja» la da la suite tal cual; la mitad «verde con TZ=America/Bogota contra la nueva» **no se puede
   obtener con una variable de entorno** y necesita otro mecanismo (ejecución fuera de vitest con `tsx`,
   o una configuración alternativa sólo para esa comprobación).
2. **`yaEsta` sólo protege valores venidos de Zoho.** El único escritor previo de las tres columnas es
   el sync (§3), y en la app el campo con valor sale bloqueado (§7): no existe hoy una «corrección a
   mano» dentro de Desk que recalcular siempre pudiera pisar.

## Enfoques (sin elegir: los decide la ronda de preguntas)

1. **Dónde vive la derivación.** En `packages/shared`, consumida por cliente y servidor (una sola
   fórmula; regla invariable 13, punto 1), o sólo en el servidor (cambio más corto; deja dos
   implementaciones de la misma noción, el molde de H5).
2. **Recalcular siempre o respetar lo escrito** (Decisiones 10/09 `:272-274`).
3. **Fuente ausente**: aceptar lo tecleado, rechazar con 422, o conservar lo que ya hubiera.
4. **Alcance del historial**: sólo la columna, o también el `values` de `ticket_transitions` (§4).

## Riesgos

- Dejar el historial con el valor del navegador si el arreglo se limita a `plan.columns` (§4); ninguna
  prueba de columnas lo detectaría.
- Dos consultas nuevas dentro de `executeTransition` y su posición respecto de la escalera de
  precedencia de `transitions-st` §3.8.
- 41 citas cruzadas: barrido obligatorio al cierre.
- La prueba de zona horaria puede pasar en falso si no se elige un instante entre las 00:00 y las
  04:59 UTC, y la mitad «Bogotá» no se puede correr con `TZ=` (contraste, punto 1).

## Estimación grosera

300-550 líneas de código y pruebas, dentro del techo de 800. Sin contar los informes de fase.
