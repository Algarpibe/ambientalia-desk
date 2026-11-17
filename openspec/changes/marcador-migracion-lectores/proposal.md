---
tanda: F1F-01
motivo: ""
capacidad: [trazas, hojas-vida, tickets-core]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `marcador-migracion-lectores`

## 1. Qué decisión construye

`decision/marcador-migracion-en-pantallas` (Gerencia, 17/11/2026; `openspec/config.yaml:6766-6782`): la fila marcador que la
migración deja en `ticket_transitions` (`packages/shared/src/migracionTickets.ts:14`) se conserva como rastro en la base, no
cuenta ni se muestra como etapa y, donde se enseñe, va con un texto en español. Se aplica junto a `decision/h1-fechas-migrados`
(`openspec/config.yaml:4863-4880`): los migrados cuentan con sus fechas de Zoho y la fecha de la migración queda sólo como marca.
Es el destino de E-215, E-216 y E-217 (`docs/sdd/ENTRADA.md:2083-2096`). Sin pasaje del maestro (`openspec/config.yaml:6780`).
Tiene que estar fusionada y desplegada antes de la migración del 12/12.

## 2. Inventario de los lectores de `ticket_transitions`

Medido sobre el árbol del worktree, partida `e728808d`. Las citas a ficheros que esta tanda modificará llevan ese ancla.
**Orden de la medida:** (1) ripgrep `ticket_transitions` en `*.ts` sin `*.test.ts`: los 15 del analista y el 16.º; (2) el mismo
patrón en `*.sql`, `*.tsx` y `*.js`: sólo `docs/sdd/*.sql` y `packages/zoho-sync/src/db/schema.sql`, ningún lector de la
aplicación; (3) `ID_TRANSICION_MIGRACION|esPasoDeMigracion`: los que ya lo reconocen; (4) `entradasActuales`,
`secuenciaDelReloj(`, `etapasDesdeHistoria(` y `PasoDelHistorial`: los lectores indirectos; (5) en `apps/desk/src`,
`transitionName|toStatus|eventName` y `.details|.content`: lo que pinta el cliente. Cada fila se clasificó leyendo el código.

Clases: **(a)** ya lo aparta · **(b)** no lo ve por construcción · **(c)** lo toma como paso.

| # | Lector | Qué hace con el marcador | Clase |
|---|---|---|---|
| 1 | `apps/desk/server/auth/users.ts:138` | cuenta por `values->>'derivado_a'`; el marcador no lleva esa clave (`apps/desk/server/db/migracionTicketsAbiertos.ts:73-76`) | b |
| 2 | `apps/desk/server/db/certificadosFabrica.ts:16` | filtra `transition_id='liberacion'` | b |
| 3 | `apps/desk/server/db/cierresDeMigracion.ts:10` | lee SÓLO el marcador, para apartar el cierre que puso la migración | a |
| 4 | `apps/desk/server/db/colaTaller.ts:14` | filtra `transition_id='habilitar_servicio'` | b |
| 5 | `apps/desk/server/db/conversacion.ts:140` en `e728808d` | toda fila que no es la creación pasa a `entradaTransicion` (`apps/desk/server/db/conversacion.ts:64-67` en `e728808d`), con las claves de `values` | **c** · E-215 |
| 6 | `apps/desk/server/db/equipos.ts:275` en `e728808d` | toda fila que no es la creación es una etapa (`apps/desk/server/db/equipos.ts:284-290` en `e728808d`); el `SELECT` ni trae `transition_id` (`apps/desk/server/db/equipos.ts:274` en `e728808d`) | **c** · E-216 |
| 7 | `apps/desk/server/db/esperasVencidas.ts:36` | pasa las filas a `secuenciaDelReloj` (`apps/desk/server/db/esperasVencidas.ts:54`): el marcador de identidad, con `to_status` nulo, anula la secuencia (`apps/desk/server/db/relojSla.ts:48` en `e728808d`) y el ticket en espera migrado deja de medirse (`apps/desk/server/db/esperasVencidas.ts:56`) | **c** · hallazgo |
| 8 | `apps/desk/server/db/fechasTicket.ts:28` | filtra por `transition_id` (`apps/desk/server/db/fechasTicket.ts:29`) | b |
| 9 | `apps/desk/server/db/historial.ts:137` en `e728808d` | toda fila que no es la creación pasa a `eventoTransicion` (`apps/desk/server/db/historial.ts:143` en `e728808d`); sólo el traspaso la aparta (`apps/desk/server/db/traspaso.ts:26`) | **c** · E-215 |
| 10 | `apps/desk/server/db/informeContrato.ts:34` | lee `to_status='Finalizado'` pero fecha con `llegadaQueCuenta` (`apps/desk/server/db/informeContrato.ts:35`) | a · E-213 |
| 11 | `apps/desk/server/db/primerDerivado.ts:26` | busca `derivado_a` en `values` (`apps/desk/server/db/primerDerivado.ts:30`) | b |
| 12 | `apps/desk/server/db/relojSla.ts:77` en `e728808d` | `secuenciaDelReloj`: el de identidad anula la secuencia (`apps/desk/server/db/relojSla.ts:48` en `e728808d`), y el migrado que luego cierre queda sin reloj en Análisis (`apps/desk/server/analisis.ts:22`); el de «Entregado» → «Finalizado» entra en «Finalizado» con el instante de la migración (`apps/desk/server/db/relojSla.ts:44` en `e728808d`) | **c** · hallazgo |
| 13 | `apps/desk/server/db/sla.ts:88` en `e728808d` | `entradasActuales`: el marcador con destino cuenta como entrada (`apps/desk/server/db/sla.ts:93-98` en `e728808d`). Hoy sin efecto visible: ningún estado con alarma (`packages/shared/src/sla.ts:34`, `packages/shared/src/sla.ts:137-141`) es destino de una regla que cambia el estado (`packages/shared/src/migracionTickets.ts:34`, `packages/shared/src/migracionTickets.ts:36`). Lo heredan `apps/desk/server/db/alarmasAvisadas.ts:22` y `apps/desk/server/db/listaRemisionCreada.ts:15` | **c** latente · E-217 |
| 14 | `apps/desk/server/indicadores.ts:76` | lo aparta en `apps/desk/server/indicadores.ts:81` | a · E-214 |
| 15 | `apps/desk/server/services/controlCalidad.ts:19` | `intervino` sólo cuenta filas «Operativo» (`packages/shared/src/controlCalidad.ts:41`) y el marcador no tiene tipo (`packages/shared/src/tipoEvento.ts:11-15`) | b |
| 16 | `apps/desk/server/db/eliminarTicket.ts:53` | cuenta (`apps/desk/server/db/eliminarTicket.ts:63-69`) y borra filas por tabla: el rastro entra en «Transiciones» porque se borra con el ticket. Cuenta filas, no pasos (S-7) | b |
| 17 | `apps/desk/server/db/traspaso.ts:26` en `e728808d` | indirecto, recibe la fila del historial: la aparta, pero con comparación propia del id y no con `esPasoDeMigracion`; es la ÚNICA otra comparación fuera de pruebas (`git grep -n ID_TRANSICION_MIGRACION -- '*.ts' '*.tsx' ':!*.test.ts'`; `apps/desk/server/db/cierresDeMigracion.ts:10` filtra en SQL y `apps/desk/server/db/migracionTicketsAbiertos.ts:81` escribe) | a · se corrige (S-9) |
| 18 | `packages/shared/src/diaDeCierre.ts:31`, `packages/shared/src/diaDeCierre.ts:35` | indirecto: lo aparta con `esPasoDeMigracion` | a |
| 19 | `packages/shared/src/bodegaje.ts:97` | indirecto: sus pasos salen de `apps/desk/server/indicadores.ts:76`, que ya aparta el marcador | a |
| 20 | `apps/desk/server/db/ticketFuentes.ts:25-27`, `apps/desk/server/db/ticketFuentes.ts:82-85`, `apps/desk/server/db/ticketFuentes.ts:95-106` | ayudantes de las filas 5, 6 y 9: `esCreacion` no lo distingue y `etiquetaCampo` produce «Managed by app previo» | parte de c |
| 21 | `packages/shared/src/etapasDesdeHistoria.ts:86` | lee la historia de Zoho, no `ticket_transitions` | b |
| 22 | `apps/desk/src/components/HistoriaPanel.tsx:41`, `apps/desk/src/components/TicketDetailView.tsx:268`, `apps/desk/src/components/TicketDetailView.tsx:271`, `apps/desk/src/components/HojaDeVida.tsx:101-102` | pintan lo que devuelve el servidor; no deciden nada | — |

**Hallazgos que no están en la bandeja: las filas 7 y 12.** Son el defecto más visible a la fecha. La pasada en seco del 12/11 dio
28 migrables con los 8 estados por identidad (`openspec/config.yaml:5646`), así que los 28 llevarían el marcador de destino nulo.
Todos quedarían sin reloj al cerrarse, y los que estén en una de las cuatro esperas (`packages/shared/src/estados.ts:151`)
saldrían de la alarma de esperas (`apps/desk/server/services/avisoSalidasEsperas.ts:49`) el mismo 12/12. Hipótesis: no está
medido en qué estados están. Ninguna caracterización fija hoy esas dos filas.

## 3. Alcance

### Dentro

| Lector | Qué pasará |
|---|---|
| `apps/desk/server/db/historial.ts:137` en `e728808d` | **enseñado con texto en español**: un evento propio, sin «Transición:», con estado en Zoho, estado en Desk, regla traducida, corte y quién la ejecutó; sin claves técnicas (S-1) |
| `apps/desk/server/db/conversacion.ts:140` en `e728808d` | **oculto** (S-2) |
| `apps/desk/server/db/equipos.ts:275` en `e728808d` | **oculto**: no es una etapa (S-3) |
| `apps/desk/server/db/sla.ts:88` en `e728808d` | **no cuenta** su instante: el que cambia el estado entra en el destino con la fecha de Zoho, como manda `decision/marcador-migracion-en-pantallas` (4) (`openspec/config.yaml:6777`) (S-4, S-6) |
| `apps/desk/server/db/relojSla.ts:77` en `e728808d` y `apps/desk/server/db/esperasVencidas.ts:36`, vía `secuenciaDelReloj` | **no cuenta** como paso: el de identidad deja de anular la secuencia y el que cambia el estado toma la fecha de Zoho (S-5, S-6) |
| `apps/desk/server/db/traspaso.ts:26` en `e728808d` | **misma conducta**, pero reconoce el marcador con `esPasoDeMigracion` en vez de su comparación propia (S-9) |

La regla —qué hace cada lector con el marcador y su texto en español— vive en `packages/shared`, pura, y reconoce el marcador
SÓLO con `esPasoDeMigracion` (`packages/shared/src/cierreEnCifras.ts:19`): no se escribe otra comparación con el id (regla
invariable 13).

Se reescriben EN SITIO, en rojo primero (`strict_tdd`), las caracterizaciones que fijan lo contrario:
`apps/desk/server/migracionMarcadorLectores.test.ts:41` en `e728808d`, `apps/desk/server/migracionMarcadorLectores.test.ts:62` en `e728808d`,
`apps/desk/server/migracionMarcadorLectores.test.ts:73` en `e728808d` y, hallazgo, `apps/desk/server/db/migracionTicketsAbiertos.test.ts:142-147` en `e728808d`
(«el de Pendiente de servicio sí»). Si el historial conserva `eventName` (S-1), siguen valiendo sin tocarlas
`apps/desk/server/db/traspaso.test.ts:139-144` y `apps/desk/server/db/historialTipoEvento.test.ts:31-36`.

### Fuera

- Corregir los lectores (a) y (b). E-213 y E-214 están resueltas (`openspec/config.yaml:6776`): sólo entran como regresión.
- El marcador de F1C-09 (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:47`): otro id, de tickets que ya gobernaba la
  aplicación (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:12-14`); que se ejecutara en producción es hipótesis
  (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:3`).
- Medir en las alarmas de `entradasActuales` a los migrados por identidad: sin fila propia no se miden, igual que cualquier ticket
  de Zoho (`apps/desk/server/db/sla.ts:28-32` en `e728808d`).
- Unificar `entradasActuales` y el último paso de `secuenciaDelReloj`, dos implementaciones de «desde cuándo está en su estado» (molde H5).
- Borrar o reescribir filas marcador: el rastro se conserva.
- Tocar `apps/desk/src`, `docs/sdd/ENTRADA.md` u `openspec/config.yaml`.

## 4. E-217 — de dónde sale la entrada al estado

Las dos reglas que cambian el estado son «Pendiente» de servicio → «En Proceso» y «Entregado» → «Finalizado»
(`packages/shared/src/migracionTickets.ts:31-36`). Fuentes que existen de verdad en el esquema:

| Fuente | Ruta | Qué da | Valoración |
|---|---|---|---|
| `ticket_history` (`TicketUpdated`) vía `etapasDesdeHistoria` | `packages/zoho-sync/src/db/schema.sql:244-253`, `packages/shared/src/etapasDesdeHistoria.ts:86-127` | la última entrada en Zoho a `estado_previo` | **recomendada**: es la de RQ-TC-75 (`openspec/specs/tickets-core/spec.md:4429-4432`) y ya la leen `apps/desk/server/db/relojSla.ts:80-82` en `e728808d` y `apps/desk/server/db/esperasVencidas.ts:40-44` |
| `closed_time_destino` con `cierre_origen: 'zoho'` | `apps/desk/server/db/migracionTicketsAbiertos.ts:75`, `packages/shared/src/cierreEnCifras.ts:39-42` | el cierre de Zoho | sólo «Finalizado»; es lo que usa el informe de contrato |
| `tickets.modified_time` | `packages/zoho-sync/src/db/schema.sql:26`; la migración no lo toca (`apps/desk/server/db/migracionTicketsAbiertos.ts:83`) | el último cambio de cualquier campo | descartada (`apps/desk/server/db/sla.ts:18-20` en `e728808d`) |
| `tickets.created_time` | `packages/zoho-sync/src/db/schema.sql:26` | el nacimiento del ticket | descartada (`apps/desk/server/db/sla.ts:30-31` en `e728808d`) |
| `performed_at` del marcador y `values.corte` | `apps/desk/server/db/migracionTicketsAbiertos.ts:73-81` | la migración y su corte | excluida por h1 (`openspec/config.yaml:4870`) |

**Recomendación** (elige el diseño): el marcador que cambia el estado no es una entrada; **renombra** el estado en que Zoho ya
tenía el ticket, desde su última entrada en Zoho a `estado_previo`. Para «Finalizado» el diseño decide entre esa fecha y
`llegadaQueCuenta`, por coherencia con `apps/desk/server/db/informeContrato.ts:35`. Sin fecha de Zoho, sin dato (S-6). En
`entradasActuales` no hay efecto visible hoy (fila 13), pero la decisión (4) manda la fecha de Zoho y no basta con apartarlo: la
misma regla pura sirve a los dos lectores (S-4), y se prueba llamando a `entradasActuales` con un estado de destino, como ya hace
`apps/desk/server/migracionMarcadorLectores.test.ts:42` en `e728808d`. El 12/11 había 0 tickets con regla que cambia el estado; el 12/12 puede variar.

## 5. Supuestos reversibles

- **S-1** Historial: un evento con título en español (propuesto «Migración desde Zoho Desk»), estado en Zoho, estado en Desk,
  regla traducida, corte y quién la ejecutó; oculta `status_type_previo` y `managed_by_app_previo`. Conserva `eventName` para no
  tocar el cliente ni las dos pruebas de §3. El texto es un presentador propio y no se añade a `ETIQUETA_CLAVE_PROPIA`, que fija
  `packages/shared/src/gasPatron.test.ts:106`. *Lo deshace:* cambiar el presentador.
- **S-2** Conversación: oculto; el hilo es el relato de lo que le pasó al equipo (`apps/desk/server/db/conversacion.ts:158-161` en `e728808d`)
  y la migración no le pasó al equipo. *Lo deshace:* pintarlo con el presentador de S-1.
- **S-3** Hoja de vida: oculto. *Lo deshace:* quitar el filtro o pintarlo con S-1.
- **S-4** `entradasActuales` no toma el instante del marcador: el de identidad sigue sin entrada (D-6) y el que cambia el estado
  entra en el destino con la fecha de Zoho de S-5, leyendo `ticket_history` sólo de los tickets con ese marcador. *Lo deshace:* la regla pura.
- **S-5** `secuenciaDelReloj`: el de identidad no es entrada; el que cambia el estado renombra con la fecha de Zoho. *Lo deshace:*
  la regla pura de `packages/shared`.
- **S-6** Sin fecha de Zoho, sin dato: nunca la de la migración ni `created_time`, como S-5 de RQ-TC-75
  (`openspec/specs/tickets-core/spec.md:4434-4436`). Hipótesis: la historia de Zoho de los migrados está completa; si no, esos
  quedan sin dato. *Lo deshace:* otra fuente de §4.
- **S-7** El borrado de un ticket cuenta el rastro, porque lo borra. *Lo deshace:* excluirlo del recuento.
- **S-8** La regla va en un módulo nuevo de `packages/shared`, para no mover líneas citadas; el cliente no lo importa, así que el
  bundle no cambia (hipótesis, se mide). *Lo deshace:* mover la regla.
- **S-9** `apps/desk/server/db/traspaso.ts:26` en `e728808d` pasa a `esPasoDeMigracion`, en sitio (la importación en su misma línea 2): lo pide la fuente única
  del encargo y es la única comparación propia que queda. *Lo deshace:* volver a la comparación.

## 6. Criterios de aceptación

- **CA-1** Historial: el evento del marcador sale con el texto de S-1; ninguna etiqueta es una clave de `values` en crudo.
- **CA-2** Conversación y hoja de vida: sin rastro del marcador, para los dos destinos (nulo y relleno).
- **CA-3** `entradasActuales`: el de identidad no da entrada; el que cambia el estado da la fecha de Zoho, nunca el instante de la
  migración; sin fecha de Zoho, sin entrada.
- **CA-4** `secuenciaDelReloj`: con marcador de identidad, la misma secuencia que sin él; con el que cambia el estado, la entrada al
  destino lleva la fecha de Zoho; sin fecha de Zoho, `null`. `ticketsEnEspera` mide a un migrado en espera con historia de Zoho.
- **CA-5** Las cuatro caracterizaciones de §3 se reescriben en sitio y se ven en rojo antes del cambio.
- **CA-6** Regresión de E-213/E-214 intacta: `apps/desk/server/db/informeContrato.ts:35`, `apps/desk/server/indicadores.ts:81` y
  la prueba de `apps/desk/server/migracionMarcadorLectores.test.ts:54` en `e728808d`, más los (b) de `apps/desk/server/migracionMarcadorLectores.test.ts:46-52` en `e728808d`.
- **CA-7** Reconocimiento único: fuera de pruebas, ninguna comparación en TS con `ID_TRANSICION_MIGRACION` ni con su literal salvo
  `esPasoDeMigracion` (S-9); el filtro SQL de `apps/desk/server/db/cierresDeMigracion.ts:10` y la escritura se quedan.
- **CA-8** Mutación por lector corregido: quitar su filtro pone roja su prueba; se restaura byte a byte, con su final de línea.
- **CA-9** Sin cambios en `apps/desk/src`; si el diseño lo tocara, la comparación de la regla de mutación 3 va por escrito.
- **CA-10** Barrido de la regla de mutación 4 en el cierre de todo fichero citado al que se inserten o muevan líneas, incluidos
  los títulos de prueba que citan líneas y las citas ancladas de esta propuesta.
- **CA-11** Suite, `typecheck` y lint con el umbral del CI en verde; la medida del intento no pasa de 800.

## 7. Qué hay que desplegar

Sólo el servidor, sin migración de base ni variables nuevas (hipótesis: con S-8 el bundle del cliente no cambia; se comprueba
tras compilar). Fusionar y desplegar antes del 12/12. No hay datos que tocar: los marcadores aún no existen en producción
(hipótesis: `openspec/config.yaml:5646` es una pasada en seco).

## 8. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Historia de Zoho incompleta en algún migrado | Media (hipótesis) | S-6: sin dato, nunca una fecha inventada |
| Tocar `entradasActuales` altera la marca del tablero o la lista de «Remisión creada» | Baja | sólo se apartan filas del marcador; sus pruebas siguen en verde |
| Otras pruebas fijan el comportamiento viejo | Media | suite entera; reescritura en sitio con rojo previo |
| Insertar líneas en `apps/desk/server/db/sla.ts`, muy citado | Media | editar en la misma línea o al final; CA-10 |
| Pasar de 800 líneas en el intento | Media | medir antes de cerrar; partir si excede |
| No llegar al 12/12 | Baja | tanda corta, sólo servidor |

## 9. Vuelta atrás

Revertir la fusión y redesplegar el servidor. Sin migración ni escritura: las filas marcador no se tocan, así que la lectura
anterior vuelve sin pérdida.

## 10. Ronda de preguntas

No se hace: `execution_mode: auto` (`openspec/config.yaml:26`) y ninguna duda cumple los cinco motivos de parada. Lo que
Gerencia puede corregir en la lista semanal de supuestos: (1) si el historial enseña el marcador o lo oculta (S-1); (2) si la
conversación lo oculta (S-2); (3) qué fecha de Zoho cuenta para «Finalizado» (§4); (4) si sin fecha de Zoho queda sin dato (S-6).
*Corrección del orquestador sobre la primera redacción:* S-4 apartaba el marcador sin leer la fecha de Zoho, contra la consecuencia (4)
de la decisión; y S-9 dejaba fuera la comparación propia de `apps/desk/server/db/traspaso.ts:26` en `e728808d`. Las dos se corrigieron antes del commit.
