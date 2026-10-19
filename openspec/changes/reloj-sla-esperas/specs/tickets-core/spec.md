# Delta de `tickets-core` — `reloj-sla-esperas` (F1C-06)

Los requisitos se añaden AL FINAL de la spec viva (`openspec/specs/tickets-core/spec.md`, cuyo último requisito es
RQ-TC-72). No hay MODIFIED ni REMOVED, para no desplazar citas.

## ADDED Requirements

### RQ-TC-73 · El reloj del SLA tiene su propia lista de estados que lo paran

Fuente: `decision/c7-reloj-sla` (`openspec/config.yaml:1909-1915`; la lista propia, `:1913`; Pendiente corre, `:1914`);
maestro M1.6 (`R08.4.md:1816-1818`), Anexo B.4 (`R08.4.md:4655`).

`packages/shared` **SHALL** exportar `ESTADOS_QUE_PARAN_EL_RELOJ`, declarada a mano con exactamente cinco estados, con el
nombre que tienen en el registro de estados: `Notificación cliente`, `Por Entregar`, `Por Entregar / Sin facturar`,
`En Espera de Repuestos` y `Servicio externo`. El reloj **SHALL** correr en todo otro estado abierto: las seis esperas
internas (`Notificación a Compras`, `Notificación Comercial`, `En espera de SKU inventario`, `Solicitado`,
`Liberación Comercial`, `Remisión creada`), `Pendiente` **[SUPUESTO S-6]** y `Pendiente de facturar` **[SUPUESTO S-1]**.

La lista **MUST NOT** derivarse de `CLASIFICACION_EN_ESPERA`, de `ESTADOS_EN_ESPERA` (`packages/shared/src/estados.ts:59`,
`:120`) ni de ninguna función de la vista: es propia del reloj para que un cambio en el tablero no mueva el SLA. Hoy las
dos listas coinciden salvo en `Pendiente`, que la vista clasifica `externa` (`packages/shared/src/estados.ts:103`) y el
reloj no para. Los comentarios de `estados.ts:26-30` y `:117-118` **SHALL** dejar de afirmar que el reloj para en los
tres bodegajes.

#### Scenario: las seis esperas internas corren — ROJO
- GIVEN los seis estados de espera interna de c7
- WHEN se pregunta si cada uno para el reloj
- THEN ninguno está en `ESTADOS_QUE_PARAN_EL_RELOJ`

#### Scenario: las cinco de c7 paran, con su nombre exacto — ROJO
- GIVEN la lista declarada
- WHEN se lee
- THEN contiene exactamente `Notificación cliente`, `Por Entregar`, `Por Entregar / Sin facturar`,
  `En Espera de Repuestos` y `Servicio externo`, y ningún otro

#### Scenario: Pendiente corre aunque la vista la haga externa — ROJO
- GIVEN `Pendiente`, que `CLASIFICACION_EN_ESPERA` marca `externa`
- WHEN se pregunta si para el reloj
- THEN no está en la lista (c7 `openspec/config.yaml:1914`)

#### Scenario: Pendiente de facturar corre — ROJO
- GIVEN `Pendiente de facturar` (S-1)
- WHEN se pregunta si para el reloj
- THEN no está en la lista

#### Scenario: el módulo no importa la clasificación de la vista — ROJO
- GIVEN el fichero `packages/shared/src/relojSla.ts`
- WHEN lo lee su guardián
- THEN no importa `CLASIFICACION_EN_ESPERA` ni `ESTADOS_EN_ESPERA`
- AND escribir ese `import` en el fichero pone el guardián en rojo (regla de mutación 2)

### RQ-TC-74 · Una sola función calcula los dos tiempos en horas hábiles

Fuente: `decision/c7-reloj-sla` (`openspec/config.yaml:1915`); maestro M1.7 (`R08.4.md:1877`, una sola función de días
hábiles); `horasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:174`).

`packages/shared` **SHALL** exportar una función pura que, dada una secuencia de `{ estado, desde }`, un instante `hasta`
y el conjunto de cierres, devuelva `{ slaHoras, totalHoras }` en horas hábiles. **MUST** medir cada tramo con
`horasHabilesEntre` y **MUST NOT** construir un cálculo propio de días hábiles.

- Cada tramo va desde su `desde` hasta el `desde` del siguiente; el último llega hasta `hasta`.
- `totalHoras` **SHALL** ser la suma de los tramos no terminales; `slaHoras`, `totalHoras` menos los tramos en un estado de
  `ESTADOS_QUE_PARAN_EL_RELOJ`.
- Los tramos en `Finalizado` y `Anulado` **MUST NOT** contar en ninguno de los dos.
- Si el último tramo es una pausa, **SHALL** crecer sólo `totalHoras`.
- `totalHoras` **MUST** ser mayor o igual que `slaHoras`; la diferencia son exactamente las pausas.
- Una secuencia desordenada **SHALL** ordenarse por `desde` antes de medir. Una secuencia vacía **SHALL** dar «sin dato».

Los escenarios usan una semana sin festivos ni cierres: lunes 26/10/2026 a miércoles 28/10/2026, jornada de 8 a 17 h.

#### Scenario: una pausa no entra en el SLA — ROJO
- GIVEN `Ticket creado` desde el lunes 08:00, `Notificación cliente` desde el lunes 17:00 y `Finalizado` desde el martes 17:00
- WHEN se calculan los tiempos con `hasta` el miércoles 17:00
- THEN `totalHoras` es 18 y `slaHoras` es 9

#### Scenario: una espera interna sí entra en el SLA — ROJO
- GIVEN `Solicitado` desde el lunes 08:00 y `Finalizado` desde el martes 17:00
- WHEN se calculan los tiempos
- THEN `slaHoras` y `totalHoras` son 18

#### Scenario: sin pausas, el total es el SLA — ROJO
- GIVEN una secuencia sin ningún estado de la lista
- WHEN se calculan los tiempos
- THEN `totalHoras` es igual a `slaHoras`

#### Scenario: una pausa abierta sólo hace crecer el total — ROJO
- GIVEN `Notificación cliente` desde el lunes 08:00, sin cierre
- WHEN se calculan los tiempos con `hasta` el miércoles 17:00
- THEN `totalHoras` es 27 y `slaHoras` es 0
- AND con `hasta` el jueves 17:00, `totalHoras` crece a 36 y `slaHoras` sigue en 0

#### Scenario: los tramos terminales no cuentan — ROJO
- GIVEN un ticket que llega a `Finalizado` el lunes 17:00 y se calcula con `hasta` el miércoles 17:00
- WHEN se calculan los tiempos
- THEN `totalHoras` y `slaHoras` son 9, sin las horas posteriores al cierre

#### Scenario: una secuencia desordenada da lo mismo — ROJO
- GIVEN la secuencia del primer escenario con sus entradas en orden inverso
- WHEN se calculan los tiempos
- THEN el resultado es idéntico

#### Scenario: una secuencia vacía no tiene dato — ROJO
- GIVEN una secuencia sin entradas
- WHEN se calculan los tiempos
- THEN el resultado es «sin dato» y no `0`

### RQ-TC-75 · El servidor arma la secuencia de estados de cada ticket, y sin historia suficiente no hay dato

Fuente: `decision/c7-reloj-sla`; propuesta S-5, S-7. Precedente de juntar las dos épocas:
`apps/desk/server/db/equipos.ts:301-304`, `:317-325`.

El servidor **SHALL** armar, por ticket, la secuencia de `{ estado, desde }` juntando las transiciones de la aplicación
(`desk.ticket_transitions`) y las etapas de Zoho (`desk.ticket_history`, convertidas con `etapasDesdeHistoria`,
`packages/shared/src/etapasDesdeHistoria.ts:86`), ordenadas, e iniciándola en la creación del ticket con su estado inicial
**[SUPUESTO S-7]**. `hasta` **SHALL** ser el instante de la lectura.

Si el último estado de la secuencia no es el estado actual del ticket, o no hay ninguna entrada, el ticket **SHALL** quedar
sin dato (`null` en `slaHoras` y `totalHoras`) **[SUPUESTO S-5]**: el servidor **MUST NOT** inventar un tramo para cubrir
el hueco. La lectura **MUST NOT** escribir ni exigir migración, y **SHALL** usar consultas fijas, sin una consulta por
ticket.

#### Scenario: se juntan las dos épocas, ordenadas — ROJO
- GIVEN un ticket con una etapa de Zoho anterior y una transición de la aplicación posterior
- WHEN el servidor arma la secuencia
- THEN contiene la creación, la etapa y la transición, en ese orden

#### Scenario: una historia que no llega al estado actual no da dato — ROJO
- GIVEN un ticket cuyo estado actual es `Finalizado` y cuya última entrada de historia es `Servicio externo`
- WHEN el servidor calcula sus tiempos
- THEN `slaHoras` y `totalHoras` son `null`

#### Scenario: un ticket sin ninguna entrada no da dato — ROJO
- GIVEN un ticket sin transiciones ni historia
- WHEN el servidor calcula sus tiempos
- THEN `slaHoras` y `totalHoras` son `null`

#### Scenario: la lectura es de número fijo de consultas — ROJO
- GIVEN diez tickets y luego cien
- WHEN el servidor arma sus secuencias
- THEN el número de consultas a la base es el mismo

### RQ-TC-76 · Análisis enseña los dos tiempos, y los calcula el servidor

Fuente: `decision/c7-reloj-sla` (`openspec/config.yaml:1915`); maestro M1.6 (`R08.4.md:1816-1818`); RQ-TC-71.

`computeAnalisis` (`packages/shared/src/analisis.ts:17`) **SHALL** añadir a su resultado la media del tiempo del SLA y la
del tiempo total, **en días hábiles de 9 horas a un decimal** **[SUPUESTO S-2]**, más cuántos tickets entraron en ellas.
Las medias **SHALL** calcularse sobre los MISMOS tickets que `tiempoPromedioDias` (cerrados, no anulados, con fin en el
periodo; condición de `packages/shared/src/analisis.ts:59`) y que además tengan dato. Si ninguno lo tiene, las dos medias
**SHALL** ser `null`. Un anulado **MUST NOT** entrar, igual que en las tres métricas de RQ-TC-71.

`tiempoPromedioDias` **MUST NOT** cambiar: sigue en días naturales **[SUPUESTO S-3]**. La pantalla
(`apps/desk/src/components/Analisis.tsx:98`) **SHALL** pintar los dos valores que reciba, con «—» ante un `null`, y
**MUST NOT** calcular, filtrar ni decidir nada (regla invariable 13). La ruta sigue siendo sólo de superadministrador.

#### Scenario: el SLA y el total se promedian en días de 9 horas — ROJO
- GIVEN un finalizado en el periodo con `slaHoras` 9 y `totalHoras` 18, y otro con 27 y 27
- WHEN se calcula el análisis
- THEN la media del SLA es 2 días, la del total es 2,5 días, y entraron 2

#### Scenario: un ticket sin dato no entra en las medias — ROJO
- GIVEN un finalizado con dato y otro finalizado sin dato
- WHEN se calcula el análisis
- THEN las medias son las del primero, entró 1, y `tiempoPromedioDias` cuenta a los dos

#### Scenario: ninguno con dato da null — ROJO
- GIVEN finalizados del periodo, todos sin dato
- WHEN se calcula el análisis
- THEN las dos medias son `null`

#### Scenario: un anulado no entra en los dos tiempos — ROJO
- GIVEN un anulado con dato en el periodo y un finalizado con dato
- WHEN se calcula el análisis
- THEN las medias y el contador son los del finalizado

#### Scenario: el tiempo promedio de servicio no cambia — ROJO
- GIVEN los mismos tickets que antes del cambio
- WHEN se calcula el análisis
- THEN `tiempoPromedioDias` vale lo que valía

### RQ-TC-77 · El reloj no toca las alarmas ni otras superficies

Fuente: maestro M1.7 (`R08.4.md:1878`: «La alarma y el reloj son independientes»); `decision/c7-reloj-sla`.

Las alarmas de permanencia **SHALL** seguir midiendo el tiempo en su estado, corra o no el reloj del SLA: las horas de
`Notificación cliente` siguen alimentando su alarma (`packages/shared/src/sla.ts:32-35`) aunque ese estado pare el reloj.
`ESTADOS_QUE_PARAN_EL_RELOJ` **MUST NOT** consultarse desde `sla.ts` ni desde el cálculo de alarmas, y los umbrales
`SLA_HORAS_POR_ESTADO` **MUST NOT** cambiar. El cambio **MUST NOT** alterar el distintivo ni las vistas del tablero, la
ficha de cliente ni `/api/indicadores`. Quedan fuera de esta capacidad el OTD global que descontará las esperas y la fecha
de aviso al cliente del bodegaje de salida.

#### Scenario: la alarma de Notificación cliente sigue midiendo — ROJO
- GIVEN un ticket en `Notificación cliente`, estado que para el reloj, que supera su umbral de 36 horas hábiles
- WHEN se evalúan las alarmas
- THEN la alarma salta igual que antes del cambio

#### Scenario: las alarmas no leen la lista del reloj — ROJO
- GIVEN el fichero del cálculo de alarmas
- WHEN lo lee su guardián
- THEN no importa `ESTADOS_QUE_PARAN_EL_RELOJ`

#### Scenario: el tablero y los indicadores no cambian — ROJO
- GIVEN los mismos tickets antes y después del cambio
- WHEN se calcula la vista del tablero, la ficha de cliente y `/api/indicadores`
- THEN los resultados son idénticos
