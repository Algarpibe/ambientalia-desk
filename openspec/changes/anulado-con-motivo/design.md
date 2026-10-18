# Diseño — `anulado-con-motivo` (F1C-01, `cierra: si`)

## D1 · Los motivos viven en `packages/shared/src/anulacion.ts` (nuevo)

Sigue el molde de `liberacionSinFactura.ts` (F1C-05):

- `ESTADO_ANULADO = 'Anulado'`.
- `CLAVE_MOTIVO_ANULACION = 'Motivo de anulación'` y `CLAVE_DETALLE_ANULACION = 'Detalle del motivo de anulación'`.
- `MOTIVOS_ANULACION`, en este orden (`R08.4.md:2139-2144`):
  1. «El cliente no aprueba o se echa atrás»
  2. «Sin solución técnica»
  3. «Repuesto no disponible»
  4. «Caducidad de espera: el cliente no responde ni retira el equipo»
  5. «Otro»

  `MOTIVO_QUE_EXIGE_DETALLE = 'Otro'`. «Otro» va el último a propósito: el arnés toma `options[0]`
  (`apps/desk/server/testing/appHarness.ts:78`).
- `camposAnulacion()`: devuelve el campo `select` obligatorio con esas `options` (destino `customField`) y el campo
  de texto del detalle, no obligatorio para `buildTransitionPlan`. Es una `function`, y por tanto se eleva, para que
  `transitions.ts` la use en sus literales.
- `erroresAnulacion(t, valores)`: se activa por el CAMPO, no por el id (D4 de F1C-05). Da un error si el motivo viene y
  no está en las `options`, y otro si es «Otro» sin detalle no vacío. La PRESENCIA del motivo la dice
  `buildTransitionPlan` (`apps/desk/server/transitionExec.ts:77`).
- `esAnulado(estado)`: igualdad con `ESTADO_ANULADO`.

`anulacion.ts` sólo importa tipos de `transitions.ts`, así que no hay ciclo de valores. Se exporta desde
`packages/shared/src/index.ts`.

## D2 · El estado, en la misma línea, sin desplazar citas

`estados.ts` tiene 429 citas (`git grep -noE "estados\.ts:[0-9]+"`). `'Anulado': 'ninguna'` va en la MISMA línea de
`'Ticket creado': 'ninguna',` (`:99`), con un comentario corto detrás. Así:

- `ESTADOS` pasa a 24 y sigue terminando en `'Solicitud Soporte'` (`estados.test.ts:229`);
- `ESTADOS_SERVICIO` pasa a 21, con `Anulado` el último (alias `e21` del mapa): los alias de los demás no cambian;
- la comprobación 5 de la reconciliación no lo ve, porque sólo cuenta líneas `externa`/`interna`
  (`apps/desk/server/reconciliacion/comprobaciones.ts:162`).

Los comentarios con cifras (`:112` «Los 23», `:142` «DOCE», `:145` «OCHO», `:188` «los 20») se corrigen en sitio.
`ESTADOS_SIN_SALIDA` (`:151-160`) no cambia (S-4).

## D3 · Las tres transiciones, sin desplazar citas

`transitions.ts` tiene 931 citas.

| Catálogo | Id | Desde | Dónde va |
|---|---|---|---|
| servicio | `anulacion` | `En Espera de Repuestos`, `Servicio externo`, `Rev./Diagnostico`, `Notificación Comercial`, `Notificación cliente` | en la misma línea `:262`, detrás de `notif_recotizacion` |
| equipo nuevo | `anulacion_equipo_nuevo` | `Ingresado`, `En Proceso`, `Notificado`, `Verificación` (S-2) | en la misma línea `:362`, detrás de `rechazo_verificacion` |
| soporte remoto | `anulacion_soporte` | `En Proceso`, `Pendiente` (S-3) | línea nueva antes de `:397`: detrás no hay nada citado |

Las tres son `name: 'Anulación'`, `to: 'Anulado'`, `area: 'Comercial'` y
`fields: [comment(), ...camposAnulacion()]`, sin `derivacion()`: no hay trabajo a partir de aquí. Los ids son distintos
en los tres catálogos (`invariantesGrafo.test.ts:174`; `transicionPorId` devuelve el primero, `flujos.ts:74-80`).
Los docblocks de `:347-348` («las seis son `Servicio Técnico`», «Campos:») y de `:384` se corrigen en sitio.

## D4 · Cerrado

`apps/desk/server/transitionExec.ts:5`: `CLOSED_STATUSES = new Set(['Finalizado', ESTADO_ANULADO])`, en sitio. Un
anulado pasa a `status_type = 'Closed'` y sale de «abiertos» y de «activos», porque todas las vistas leen `statusType`
(`apps/desk/src/lib/boardView.ts:41`, `:47`, `:48`, `:50`).

## D5 · La guarda del motivo, en el `422` del escalón C, detrás del `403` de área

`apps/desk/server/services/ticketService.ts:134`, en sitio: `const errAnulacion = erroresAnulacion(t, values)`, que
entra en la condición y en la lista del único `422` agregado. Así queda detrás del `403` de área (`:129-130`) y del de
cargo (`:131`), y delante de la persona derivada (`:138-142`) y del `409` de la orden de venta (`:148-152`), que es el
orden total de F1B-10 (A < B < C < D). Las pruebas de posición siguen el molde PL-1 y PL-1 bis de
`apps/desk/server/liberacionSinFactura.test.ts:121-135`: un usuario sin Comercial con motivo fuera de la lista recibe
`403`, no `422`.

## D6 · Las métricas excluyen los anulados (lote 2)

- `packages/shared/src/analisis.ts:59`: `if (cerrado && !esAnulado(r.status) && inRange(fin, from, to))`. Cubre las tres
  métricas y la tendencia de finalizados. Los anulados siguen contando como creados (S-7) y no cuentan como activos.
- `packages/shared/src/cierreEnCifras.ts`: `resolucionPromedioMs` salta los anulados (S-5). El tipo de sus tickets gana
  `status`; `TicketLite` ya lo trae (`apps/desk/server/db/directory.ts:23`).
- No se filtra en el SQL de `getAnalisisRows` (`apps/desk/server/analisis.ts:13`): sacaría al anulado también de
  «creados».

## D7 · Vigilantes y cifras que se mueven en el mismo commit (lote 1)

Las cifras salen de la medición de la propuesta y se comprueban al aplicar: el `apply` corre cada fichero y lee su
mensaje antes de tocarlo.

- `packages/shared/src/estados.test.ts`: 23 → 24; la lista `ninguna` gana `'Anulado'`; 21 → 20 en `:226`; y las
  cifras de salida única (`:147`, `:179`).
- `packages/shared/src/comentariosVigilados.test.ts`: (a) «DOCE»/«OCHO» de `estados.ts:142`/`:145`; (c) el «40» de
  `ticketService.ts:238`; (d) la línea «Campos:» de `transitions.ts:348`.
- `packages/shared/src/invariantesGrafo.test.ts`: 31/20 → 32/21; terminales `['Finalizado','Anulado']`; los pares y las
  áreas de equipo nuevo y de soporte remoto (`:200-218`, `:240-259`).
- `packages/shared/src/transitionsSoporteRemoto.test.ts`, `packages/shared/src/transitions.test.ts`,
  `packages/shared/src/cargos.test.ts`, `packages/shared/src/columns.test.ts` y `packages/shared/src/fasesBlueprint.ts`
  (más su prueba).
- `apps/desk/server/permisos.test.ts` y `apps/desk/server/transicionesEjecucion.test.ts`.
- `packages/shared/src/mapaBlueprint.test.ts` y los seis `docs/artefactos/blueprint-*.md`, regenerados con
  `scripts/generar-mapa-blueprint.ts`.
- `packages/shared/src/cifrasAncladas.test.ts:24` y `openspec/config.yaml → cifras_ancladas`: 31/20/35 → 32/21/40, en
  sitio, con el mismo cambio en las dos copias. ⚠️ `openspec/config.yaml` lleva cambios de Supervisión sin commitear en
  `main`: la fusión tendrá que aplicar este hunk con el molde de la parte A (`hash-object` + `update-index`).

Toda cifra de una prueba se cambia **sólo** si su mensaje la ata a lo que este cambio mueve. Una prueba que se ponga roja
por otra razón es un hallazgo, no una cifra que actualizar.

## D8 · Histórico: una consulta de lectura, sin escribir marcas (lote 2)

`docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql`, con el molde de `docs/sdd/Consultas_Recuentos_2026-09-25.sql:1-54`:
`BEGIN TRANSACTION READ ONLY … ROLLBACK`. Reutiliza las dos fuentes del bloque A —`desk.ticket_transitions` (ids
`rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`) y `desk.ticket_history` (la transición «Rechazo» de Zoho)—,
pero LISTA los candidatos: número, fecha del Rechazo, fecha de llegada a `Finalizado` y origen. Un guardián de texto
(regla de mutación 2: se ensucia el fichero vigilado) exige el `READ ONLY` y el `ROLLBACK`, y ningún `INSERT`,
`UPDATE`, `DELETE`, `ALTER` ni `CREATE`.

## D9 · Mutaciones (cada una en rojo y restaurada)

| # | Mutación | Debe caer |
|---|---|---|
| M0 | control | nada |
| M1 | un motivo fuera de la lista pasa (`erroresAnulacion` no mira las `options`) | pruebas de la guarda, en shared y en el servidor |
| M2 | transición sin motivo: el campo deja de ser `required` | la del motivo ausente |
| M3 | un área distinta de Comercial pasa: `area: 'Servicio Técnico'` en una de las tres | permisos y la prueba del área |
| M4 | la guarda del motivo antes del `403` de área (regla de mutación 1) | la de posición |
| M5 | `Anulado` fuera de `CLOSED_STATUSES` | cerrado y vistas |
| M6 | un anulado cuenta en finalizados (se quita `!esAnulado` de `analisis.ts:59`) | las de las tres métricas |
| M7 | un anulado cuenta en el tiempo promedio (la exclusión sólo en el contador) | la del tiempo promedio |
| M8 | un anulado cuenta en el OTD (la exclusión sólo en el contador y el tiempo) | la del OTD |
| M9 | la consulta del histórico escribe (`UPDATE` en el `.sql`) | el guardián del `.sql` |
| M10 | «Otro» sin detalle pasa | la del detalle |

M6, M7 y M8 exigen que la exclusión sea una sola condición: si se parte en tres, cada métrica tiene que tener su prueba.

## D10 · Regla invariable 13, decisión a decisión

El cliente no tiene ninguna decisión propia sobre la anulación: pinta lo que el catálogo de `shared` declara.

| Decisión | Dónde se impone |
|---|---|
| Desde qué estados se anula | `from` del catálogo (`shared`); el servidor responde `409` si no aplica (`ticketService.ts:126-128`) |
| Quién anula | `area: 'Comercial'` del catálogo; el servidor responde `403` (`ticketService.ts:129-130`) |
| Que el motivo sea obligatorio | `required` del campo; el servidor responde `422` (`buildTransitionPlan`, `transitionExec.ts:77`) |
| Que el motivo sea de la lista y el detalle de «Otro» | `erroresAnulacion` (`shared`), sumado al `422` de `ticketService.ts:134` |
| Que `Anulado` sea cerrado | `CLOSED_STATUSES` (`transitionExec.ts:5`), en el servidor |
| Que no cuente en las métricas | `computeAnalisis` (`shared`), que llama el servidor; la pantalla `Analisis.tsx` sólo pinta |
| El desplegable de motivos | el panel de transición pinta las `options` del catálogo (comodidad: lo impone `ticketService.ts:134`) |
