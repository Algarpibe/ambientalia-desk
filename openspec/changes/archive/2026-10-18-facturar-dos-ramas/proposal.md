---
tanda: F1C-02
motivo: ""
capacidad: [transitions-st, derivacion-avisos]
maestro: ["M1.3.5", "Anexo D nº 34", "Anexo D nº 33"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `facturar-dos-ramas`

## 1. Qué fila atiende

F1C-02 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:100`): «C4 facturar ↔ entregar en dos ramas, y alarma de
la fecha prevista de facturación (E-102)». Respaldo: `decision/c4-dos-ramas` (`openspec/config.yaml:1849-1862`) y
`decision/anexo-33-checkbox` (`openspec/config.yaml:2373-2386`). `cierra: si`: la fila son las dos ramas y la alarma, y
las dos se construyen aquí. `toca_maestro: si`: el maestro dice 31 transiciones, 20 estados y 35 pasos (R08.4, sin la
corrección P-3), y al terminar el código dirá 33, 22 y 41.

## 2. La letra que manda

`decision/c4-dos-ramas`, `respuesta_textual` (`openspec/config.yaml:1854`), entera:

> «Facturado es un atributo del ticket, no un estado. Adoptamos las dos ramas que propone la R08 para eliminar el ciclo
> facturar↔entregar, con un cambio: en la rama sin factura, Pendiente de facturar sí es estado —ahí vive el equipo
> entregado y no facturado, y su antigüedad se mide—, pero de ahí se sale con la transición Facturar, que registra la
> factura y su fecha, directamente a Finalizado, sin un estado «Facturado» intermedio. El hecho de estar facturado vive en
> el campo fecha_factura, que ya existe, y así no hay dos sitios que puedan decir cosas distintas. El ticket termina al
> facturar; el cobro se sigue en contabilidad, no en el ticket.»

`decision/anexo-33-checkbox`, `respuesta_textual` (`openspec/config.yaml:2378`), la parte que queda para esta tanda:

> «[…] Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa al Director Comercial. Las
> liberaciones registradas antes del arreglo del 09/09 conservan su casilla tal como se guardó y se marcan según el
> criterio ya decidido para el histórico (c2); no se reescriben.»

El maestro vigente lo recoge en M1.3.5 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1343-1361`):
la tabla de las dos vías (`:1347-1352`), «Pendiente de facturar sí es estado» (`:1354`), la fecha de remisión de salida
escrita una sola vez (`:1356`) y la alarma «después del corte, con F1C-02» (`:1360`). El Anexo D nº 34 queda resuelto en
`:5756-5760`, y el nº 33 en `:5751-5755`.

## 3. Medición (antes de proponer), sobre `37817ef`

**El ciclo.** `liberacion_sin_factura` baja de `Por Facturar` a `Por Entregar / Sin facturar`
(`packages/shared/src/transitions.ts:246`) y `entrega_sin_factura` vuelve a `Por Facturar` (`:248`). Ése es todo el
ciclo: la rama con factura ya avanza sin volver (`facturado` → `Liberación Comercial`, `:240`; `habilitado_para_entrega`
→ `Por Entregar`, `:259`; `entrega_al_cliente` → `Finalizado`, `:250`; o `facturado_cierre` → `Finalizado`, `:242`).
`reentrancia.ts` lo detecta como componente fuertemente conexo y lo declara: `INDICADORES_G6` lleva la columna 47
(`Fecha Remisión de Salida`) con `alcance: 'C4'` (`packages/shared/src/reentrancia.ts:79`), y `bodegaje.test.ts:113`
cuenta 11 campos de fecha reentrantes.

**Lo que dejó F1C-05** (`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/`). El motivo de lista
cerrada y la fecha prevista ya se exigen (`transitions.ts:247`; guarda `packages/shared/src/liberacionSinFactura.ts:23-37`)
y se guardan en dos columnas propias, fuera de `TICKET_COLS`: `liberacion_motivo` y `fecha_prevista_facturacion`
(`packages/zoho-sync/src/db/schema.sql:718`; `packages/zoho-sync/src/db/rows.ts:131`). La restricción al Director
Comercial también está: `EXCEPCIONES_POR_CARGO` (`packages/shared/src/cargos.ts:32`). No se rehace nada: se consume.

**`fecha_factura`.** Columna de `tickets` (`schema.sql:34`), en `PROMOTED_COLUMNS` con la etiqueta «Fecha De Factura»
(`rows.ts:111`). La escriben hoy `facturado` y `facturado_cierre` (`transitions.ts:241`, `:243`) por el enrutado de
`buildTransitionPlan` (`apps/desk/server/transitionExec.ts:90-91`). Está también en `TICKET_COLS`
(`packages/zoho-sync/src/db/repo.ts:50`), así que el sincronizador la reescribe desde Zoho, **salvo** en las filas que la
aplicación movió: `writeTransition` pone `managed_by_app=true` (`repo.ts:298`) y `upsertTicket` sale antes (`repo.ts:71`).
Un ticket llega a `Pendiente de facturar` sólo por una transición de la aplicación, así que su `fecha_factura` no la pisa
el sincronizador. **No existe ningún campo de número de factura** en el código.

**Cómo se avisa hoy.** Tres mecanismos. (1) Alarmas de SLA por horas hábiles en un estado: `SLA_HORAS_POR_ESTADO`
(`packages/shared/src/sla.ts:32-35`), que se evalúa con la hora de ENTRADA al estado (`slaVencido`, `:52-55`) y se marca
una vez por entrada en `public.alarmas_avisadas` (`apps/desk/server/services/alarmasSla.ts:37-57`). (2) Avisos de
transición (derivación y área). (3) Avisos por fecha, una vez por fila: la reclamación al fabricante a los 60 días
(`apps/desk/server/services/avisoReclamacionProveedor.ts`), que marca la fila con un `UPDATE … WHERE aviso_60_at IS NULL
RETURNING` y avisa al cargo de permiso, con el área de respaldo, en la misma transacción. **Por qué la alarma de
facturación no cabe en `SLA_HORAS_POR_ESTADO`** (consecuencia 3 de anexo-33): ese registro es `estado → horas hábiles` y
mide desde la entrada; esta alarma compara una FECHA PROMETIDA, escrita en otra transición anterior, contra el día de hoy.
No hay horas que declarar. El molde es el (3).

**El cargo «Director Comercial» ya existe.** La consecuencia 5 de anexo-33 (`openspec/config.yaml:2384`, «sigue sin
existir») está caducada: `CARGOS` lo declara (`packages/shared/src/cargos.ts:12-15`), y hay destinatarios por cargo de
permiso (`apps/desk/server/db/avisos.ts:121-127`).

**Lo que cuenta o vigila estados y transiciones**, con su movimiento: `cifras_ancladas` (`openspec/config.yaml:1329`) y
`packages/shared/src/cifrasAncladas.test.ts:24`, 32/21/40 → **33/22/41**; `invariantesGrafo.test.ts:51-52` (32, 21);
`estados.test.ts:16` (24 → 25) y `:226` (21 → 22); `migracionTickets.test.ts:27` (24 → 25, identidad); `prioridad.test.ts:119`
(32); `mapaBlueprint.test.ts:52`, `:184` (40) y sus artefactos generados; `apps/desk/server/permisos.test.ts:245` (21);
`reentrancia.test.ts`, `bodegaje.test.ts:113` e `invariantesGrafo.test.ts:138` (los campos reentrantes); `indicadores.test.ts:146`
(guardián K14 contra `INDICADORES_G6`); `fasesBlueprint.ts:63-68` (`satisfies Record<EstadoServicio, FaseId>`);
`columns.ts:31-34`; la descripción de `transitions-st` en `capabilities` (`openspec/config.yaml:110`); y los barridos de
permisos y cargos por transición (`permisos.test.ts`, `cargos.test.ts`, `transicionesEjecucion.test.ts`).

**Datos de producción: no hace falta parar.** El cambio no quita ni renombra ningún estado ni ninguna transición:
`entrega_sin_factura` conserva su id y cambia de destino, y nacen un estado y una transición. Ningún ticket queda en un
estado que deje de existir. La migración F1F-01 trata por identidad todo estado de `ESTADOS`
(`packages/shared/src/migracionTickets.test.ts:25-32`); `Pendiente de facturar` no existe en Zoho, así que ningún ticket
migrado cae en él.

## 4. Qué se construye

1. **Estado `Pendiente de facturar`** (servicio), de clase `ninguna`, fase `cierre`, con columna propia en el tablero.
2. **`entrega_sin_factura`** pasa a llevar a `Pendiente de facturar` en lugar de a `Por Facturar`. Mismo id, mismos campos.
3. **Transición `facturar`**, «Facturar», de `Pendiente de facturar` a `Finalizado` (cerrado), área `Comercial`, con
   dos campos obligatorios: «Número de factura» (texto) y «Fecha De Factura» (fecha, que va a `tickets.fecha_factura`).
   Guarda de servidor en el `422` del escalón C: número no vacío tras recortar y fecha de calendario real.
4. **Las dos ramas avanzan y no vuelven:** un invariante del grafo prueba que no hay ciclo entre los estados de cierre, y que
   de `Pendiente de facturar` sólo se sale a `Finalizado`. `Fecha Remisión de Salida` deja de ser reentrante y la columna
   47 sale de `INDICADORES_G6`, que es lo que C4 tenía que cerrar.
5. **Alarma de facturación vencida:** una pasada diaria avisa al Director Comercial (área Comercial de respaldo) de cada
   ticket en `Pendiente de facturar` cuya `fecha_prevista_facturacion` ya pasó. Una sola vez por ticket y fecha, con la
   marca en la propia fila (columna nueva fuera de `TICKET_COLS`). Nunca mueve el ticket.
6. **Histórico:** no se toca ninguna fila. Las liberaciones anteriores al 09/09 no tienen fecha prevista y no generan
   alarma; su casilla sigue como se guardó.
7. **Cifras ancladas** 32/21/40 → 33/22/41 en `openspec/config.yaml → cifras_ancladas`, en la descripción de la capacidad
   y en `cifrasAncladas.test.ts`, en el mismo commit que el código.

**Migración de base de datos:** una sola sentencia, aditiva: `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS
facturacion_avisada_para date` (sin calificar, `tickets` es de `DESK_TABLES`). Sin relleno.

## 5. Supuestos reversibles (para la lista semanal)

| # | Supuesto | Cómo se revierte |
|---|---|---|
| S-1 | «Registra la factura» es su número: campo de texto obligatorio «Número de factura», guardado en `tickets.custom_fields` y en la traza. No hay columna porque nadie la lee | Promoverlo a columna con su `ALTER` y su entrada en `PROMOTED_COLUMNS` |
| S-2 | «Facturar» es de área `Comercial`, como `facturado` y `facturado_cierre`, y no tiene excepción de cargo: no está en la lista corta de `c10-permisos-cargo` | El `area` de `facturar`, o una entrada en `EXCEPCIONES_POR_CARGO.transiciones` |
| S-3 | `Pendiente de facturar` es de clase `ninguna`, igual que `Por Facturar`: espera un acto de Comercial dentro de la aplicación, no un suceso de fuera, así que tampoco es `sin_salida` | Su clase en `CLASIFICACION_EN_ESPERA` |
| S-4 | «Si esa fecha pasa»: vence el día SIGUIENTE a la fecha prevista, en día civil de Bogotá; el mismo día todavía no | La comparación de la regla pura |
| S-5 | La alarma se evalúa una vez al día por proceso, dentro de la pasada periódica, como la de reclamaciones | La puerta de día de la pasada |
| S-6 | Una sola alarma por ticket y fecha prevista: si algún día se regulariza la fecha (p64-historico-c1), la fecha nueva puede volver a avisar | La condición del `UPDATE` de la marca |
| S-7 | Si nadie tiene el cargo Director Comercial, avisa al área Comercial; si tampoco hay nadie, no marca y reintenta al día siguiente | El respaldo del servicio |
| S-8 | La fecha de factura no tiene que ser pasada ni futura (como SP-1 de F1C-05) | Una condición más en la guarda |
| S-9 | Los tickets que ya volvieron a `Por Facturar` por el ciclo antes de este cambio se quedan donde están: no se mueven (datos de producción). Pueden cerrar por `facturado_cierre`, que ya existe | Una migración de persona, con consulta previa |
| S-10 | «Su antigüedad se mide» se cumple con lo que ya hay —el historial fecha la entrada al estado— y con la alarma; un indicador propio no está decidido | Una fila nueva cuando Gerencia fije el indicador |
| S-12 | El cliente pide siempre vacíos «Número de factura» y «Fecha De Factura», en cualquier transición, aunque el ticket ya traiga una fecha de factura de Zoho: son los de la factura que se registra ahora (`design.md` D7) | La condición de `TransitionPanel.tsx:33` |
| S-11 | El aviso es sólo de bandeja, sin correo, como el de reclamaciones (RQ-AV-19): no nace ningún escritor externo ni interruptor | Añadirlo al lote de `dispararAvisos`, con su interruptor |

## 6. Partición (el cambio no cabe en un intento de 800)

| Intento | Contenido | Estimación |
|---|---|---|
| 1 | `proposal.md` y deltas de spec (`transitions-st`: ADDED RQ-TS-42 y RQ-TS-43, MODIFIED RQ-TS-05, §3.3, RQ-TS-26 y RQ-TS-35; `derivacion-avisos`: ADDED RQ-AV-23) | ~700 |
| 2 | `design.md` y `tasks.md` | ~300 |
| 3 | lote 1: estado, transición, guarda, ramas sin ciclo, vigilantes, mapa y cifras ancladas | ~550 |
| 4 | lote 2: regla pura de vencimiento, marca, servicio de alarma, pasada y migración | ~500 |
| 5 · 6 | verify · archive (parte revisable ≤ 800) | ~350 · mudanza |

## 7. Fuera de alcance

- **La guarda de remisión de salida vigente en las dos entregas** (`R08.4.md:1830`, M1.7): no es de esta fila; hoy
  `exigirRemisionVigente` sólo mira `habilitar_servicio` (`apps/desk/server/services/ticketService.ts:273-277`).
- **Marcar el histórico** de liberaciones con casilla y regularizarlo hacia adelante (`p64-historico-c1`): datos de
  producción y tarea de persona; este cambio no escribe ninguna fila vieja.
- **Mover a `Pendiente de facturar`** los tickets que ya entregaron sin factura y volvieron a `Por Facturar` (S-9).
- **El cobro:** «se sigue en contabilidad, no en el ticket» (c4).
- **Decisionales y propietario del registro:** resto de F1C-05.
- **RQ-TS-01 ya está caduco y no se toca aquí:** dice 31 entradas sobre 20 estados y «diez» campos reentrantes en el
  invariante 6 (`openspec/specs/transitions-st/spec.md:43`, `:64`), cifras de antes de F1C-01 y F1C-05. La cifra viva
  es RQ-TS-26, que sí se modifica. Se anota para la bandeja.
