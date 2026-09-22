# Delta for trazas

Contexto: `openspec/specs/trazas/spec.md`. `fechas-derivadas-servidor` (F1A-07 · IV-2) hace que el
servidor imponga las tres fechas derivadas (`Fecha creación ticket`, `Fecha Remisión Entrada`,
`Fecha Revisión Informe`) cuando tiene fuente, en la columna **y** en el historial. **Toda cita
`ruta:línea` se lee contra `4976787`** (regla de mutación 4, `CLAUDE.md`). Citas verificadas en esta
tanda contra el fichero: `bodegaje.ts:59-65`, `:129-133`; `fechasTicket.ts:18-20`, `:22-35`;
`remisiones.ts:14`, `:76-79`; `transitions.ts:190-191`, `:218-221`; `transitionExec.ts:37-99` — ninguna
caducada.

**MODIFICA:** `RQ-TZ-03` (`values` guarda el efectivo, no el crudo, para las tres fechas) y `RQ-TZ-11`
(de proponer a imponer). **AÑADE:** `RQ-TZ-12` (la derivación en sí, con sus dos huecos residuales con
dueño) y `RQ-TZ-13` (el día de un valor en zona de negocio fija, no en la del proceso).

## MODIFIED Requirements

### Requirement: RQ-TZ-03 · El `values` de cada fila es el rastro completo

`values` **SHALL** guardar **todos** los valores diligenciados en la transición
(`repo.ts:285`, con `JSON.stringify(values)`). **Para las tres fechas derivadas** (`Fecha creación
ticket`, `Fecha Remisión Entrada`, `Fecha Revisión Informe`) **SHALL** guardar el valor EFECTIVO —el
derivado cuando hay fuente, lo tecleado y validado cuando no la hay— y **MUST NOT** guardar lo que
mandó el navegador si difiere del derivado. El resto de `values` **SHALL** seguir siendo lo que llegó
del cliente, sin cambios: el mismo canal para los demás operandos del bodegaje queda fuera de esta
tanda, registrado en E-022 (`docs/sdd/ENTRADA.md`).

Una de las tres etiquetas **SHALL** excluirse de `values` cuando la transición ejecutada no la declara
entre sus campos: no llega ni cruda ni derivada, y por tanto ningún paso del bodegaje puede leerla
fuera de la transición que la declara (RQ-TS-09 de `transitions-st`).

De aquí sale la regla que gobierna los indicadores, y **SHALL** quedar escrita en esta spec porque
sin ella F1C-06 la pierde:

> **Las columnas de `tickets` guardan el ÚLTIMO valor; el historial guarda TODOS.**
> **Los KPIs de G.6 SHALL calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`.**

(`packages/shared/src/reentrancia.ts:14-32`, en especial `:19` y `:24`.) No se pierde ningún dato por
reentrancia; lo que se pierde es el dato **si se lee por la columna**. El detalle de los diez campos
reentrantes es de `transitions-st` §3.3.
(Previously: «con `JSON.stringify(values)` sobre lo que llegó del cliente», sin distinguir las tres
fechas derivadas ni las transiciones que no las declaran.)

#### Scenario: El historial guarda el derivado, no lo que mandó el navegador
- GIVEN una transición que declara `Fecha Remisión Entrada`, con una remisión de entrada vigente cuya
  `fecha` es `2026-09-05`, y el navegador manda `2026-09-01` para ese mismo campo
- WHEN se ejecuta la transición
- THEN `ticket_transitions.values` guarda `2026-09-05`, no `2026-09-01`

#### Scenario: Una fecha derivada fuera de su transición no llega al historial
- GIVEN una transición que NO declara `Fecha Remisión Entrada` entre sus campos, con esa clave incluida
  igualmente en el cuerpo de la petición
- WHEN se ejecuta la transición
- THEN `ticket_transitions.values` no contiene la clave `Fecha Remisión Entrada`

### Requirement: RQ-TZ-11 · Las fechas ya anotadas: el servidor las impone, no las propone

`instanteUltimaTransicion` **SHALL** devolver cuándo se ejecutó por **última** vez una etapa sobre un
ticket (`apps/desk/server/db/fechasTicket.ts:22-34`).

**Desde `fechas-derivadas-servidor`, el servidor consume este instante para IMPONER** `Fecha creación
ticket` y `Fecha Revisión Informe` cuando la transición tiene fuente — no para proponerlo y dejar que el
cliente decida: `executeTransition` (`apps/desk/server/services/ticketService.ts:132`) lee la fuente
antes de construir el plan y descarta lo que mande el navegador (`RQ-TS-08`, `transitions-st`). El
prellenado del cliente (`apps/desk/src/lib/valoresTransicion.ts`) pasa a ser espejo legítimo bajo la
regla invariable 13, punto 3: la imposición queda probada en el servidor.
(Previously: título «se proponen, no se preguntan»; el único consumidor era la pantalla, que sólo
sugería sin que el servidor comprobara nada.)

- La **última** y no la primera: un informe devuelto a corrección se vuelve a escalar, así que la
  primera describe una revisión que quedó anulada (`fechasTicket.ts:11-12`).
- **SHALL** devolver el **instante** en ISO y **MUST NOT** recortarlo al día: `performed_at` es
  `timestamptz` en UTC, y recortarlo daría un día de más a cualquier cosa hecha después de las 19:00
  en Colombia (`fechasTicket.ts:14-16`).
- Cero filas **SHALL** significar «no consta» y **MUST NOT** significar «no ocurrió»: un ticket
  escalado en Zoho no tiene fila y la pantalla deja el campo vacío para teclearlo
  (`fechasTicket.ts:18-20`). Es uno de los dos huecos residuales de la derivación, sin fuente: el
  servidor acepta lo tecleado si es válido (`RQ-TZ-12`).

`primerDerivado` **SHALL** recorrer las filas de la más vieja a la más nueva y parar en la primera que
derive a alguien, saltándose las que no lo hicieron: el ticket nace y pasa por «Habilitar Servicio»
sin responsable, así que mirar sólo la fila más antigua daría `null` en todos los tickets del mundo
real (`apps/desk/server/db/primerDerivado.ts:23-33`, en especial `:12-15`). Una cadena vacía **MUST
NOT** contarse como persona (`:17-18`, `:30`).

#### Scenario: El servidor impone la fecha derivada aunque el navegador no la mande
- GIVEN una transición que declara `Fecha Revisión Informe`, con un `instanteUltimaTransicion` para
  `escalado_a_revision` ya registrado, y el cuerpo de la petición SIN esa clave
- WHEN se ejecuta la transición
- THEN se ejecuta igual: el servidor deriva el valor de la fuente y lo escribe en la columna y en
  `ticket_transitions.values`, sin exigir el campo en el cuerpo

## ADDED Requirements

### Requirement: RQ-TZ-12 · El servidor impone las tres fechas derivadas

Al ejecutar `ingreso_a_servicio`, `reporte_por_garantia` o `escalado_a_comercial`
(`packages/shared/src/transitions.ts:190-191`, `:218-221`), el servidor **SHALL** calcular el valor de
cada fecha derivada que la transición declare, a partir de su fuente cuando exista, y **SHALL**
escribirlo en la columna promovida **y** en `ticket_transitions.values`, ignorando lo que mande el
navegador para ese campo (`RQ-TS-08`, `transitions-st`).

| Etiqueta | Fuente |
|---|---|
| `Fecha creación ticket` | `current.row.created_time` |
| `Fecha Remisión Entrada` | `fecha` de la remisión de **entrada** vigente más reciente (`listRemisionesByTicket`, `apps/desk/server/db/remisiones.ts:76-79`), tal cual, sin recalcular el día |
| `Fecha Revisión Informe` | `instanteUltimaTransicion(db, id, 'escalado_a_revision')` (`apps/desk/server/db/fechasTicket.ts:22-35`), reducido al día en zona de negocio (`RQ-TZ-13`) |

**Recalcular es SIEMPRE**: con fuente disponible, el servidor **MUST NOT** conservar ni el valor del
navegador ni el que ya hubiera en la columna.

Sin fuente, el servidor **SHALL** aceptar lo tecleado si es una fecha real `YYYY-MM-DD`, y **SHALL**
responder `422 { errors }` si no lo es —incluido un día que no existe, p. ej. `2026-02-30`—, en el mismo
`422` que los obligatorios y detrás de ellos (`RQ-TS-06`, `transitions-st`).

Dos huecos quedan fuera de este requisito, con dueño declarado: `Fecha Remisión Entrada` tecleada sin
remisión de entrada en Desk → **F1B-03**
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:158`); `Fecha Revisión Informe` tecleada en un
ticket escalado en Zoho, sin fila en `ticket_transitions` (`fechasTicket.ts:18-20`) → sin destino.

#### Scenario: Con fuente, el valor derivado gana aunque el navegador mande otro distinto
- GIVEN una transición con las tres fechas declaradas, cada una con fuente disponible y distinta del
  valor que manda el navegador
- WHEN se ejecuta la transición
- THEN las tres columnas y `ticket_transitions.values` guardan el valor DERIVADO, no el del navegador

#### Scenario: `Fecha Remisión Entrada` es la de la remisión de entrada vigente más reciente
- GIVEN dos remisiones de entrada vigentes para el ticket, creadas en momentos distintos
- WHEN se ejecuta `ingreso_a_servicio`
- THEN `Fecha Remisión Entrada` toma el valor `fecha` de la más reciente, sin transformarlo

#### Scenario: El instante se reduce al día de la zona de negocio, no al día UTC
- GIVEN `instanteUltimaTransicion` devolviendo `2026-09-10T00:30:00Z` para `escalado_a_revision`
- WHEN se ejecuta `reporte_por_garantia` o `escalado_a_comercial`
- THEN `Fecha Revisión Informe` vale `2026-09-09`; lo mismo vale `Fecha creación ticket` cuando
  `created_time` cae en esa misma ventana

#### Scenario: Con fuente, la transición pasa aunque el navegador no mande el campo
- GIVEN una transición con fuente disponible para sus fechas derivadas
- WHEN el cuerpo de la petición NO incluye esas claves
- THEN la transición se ejecuta igual, sin `422` por campo obligatorio

#### Scenario: Recalcular siempre ignora también lo que ya hubiera en la columna
- GIVEN un ticket cuya columna de fecha derivada ya tiene un valor, distinto del que la fuente da hoy
- WHEN se ejecuta de nuevo una transición que declara ese campo y la fuente sigue disponible
- THEN el valor final es el derivado de la fuente actual, no el que ya estaba en la columna

#### Scenario: Sin fuente, lo tecleado válido pasa y lo inválido responde 422
- GIVEN una transición cuya fecha derivada no tiene fuente
- WHEN se teclea `2026-09-09` (fecha real)
- THEN la transición se ejecuta con ese valor
- GIVEN el mismo caso sin fuente
- WHEN se teclea `2026-02-30` (día que no existe)
- THEN el servidor responde `422 { errors }`, detrás de los obligatorios

#### Scenario: Una fecha derivada enviada en una transición que no la declara no llega al historial
- GIVEN una transición que no declara ninguna de las tres fechas
- WHEN el cuerpo de la petición incluye igualmente una de ellas
- THEN ni la columna ni `ticket_transitions.values` la reciben

### Requirement: RQ-TZ-13 · El día de un valor se calcula en la zona de negocio fijada, no en la del proceso

El día en zona de un valor de fecha **SHALL** calcularse con la zona de negocio fijada
(`'America/Bogota'`; precedente de servidor: `packages/zoho-sync/src/db/mappers.ts:164-176`) y **MUST
NOT** depender de la zona del proceso que ejecuta el cálculo.

- Una cadena solo-fecha `YYYY-MM-DD` **SHALL** pasar tal cual, en cualquier zona del proceso: es una
  fecha de calendario, no un instante. `new Date('2026-09-09')` es medianoche UTC, que en Bogotá es el
  día 8 — la trampa que el cálculo **MUST NOT** cometer.
- Un instante con desplazamiento **SHALL** reducirse al día en la zona de negocio.
- Una fecha-hora **SIN** desplazamiento **SHALL** devolver `null`: leerla con la zona del proceso es
  justo la dependencia que se retira.
- Un valor ilegible **SHALL** devolver `null`.
- `dia()` (`packages/shared/src/bodegaje.ts:129-133`) **SHALL** consumir esta misma noción: hoy usa
  `toISOString().slice(0, 10)`, día UTC. Una `YYYY-MM-DD` no cambia de resultado; un instante en la
  ventana 00:00–04:59 UTC sí, porque hoy cae en el día UTC y con la zona de negocio cae en el día
  anterior en Bogotá.

(Previously: no existía como requisito propio. `diaLocal`
(`apps/desk/src/lib/valoresTransicion.ts:30-36`) era la única noción de «día de un valor», con la zona
del navegador, y desaparece con esta tanda.)

#### Scenario: Una fecha de calendario nunca se desplaza de día
- GIVEN el valor `'2026-09-09'`
- WHEN se calcula su día en zona, en cualquier zona del proceso que ejecute la prueba
- THEN el resultado es `'2026-09-09'`

#### Scenario: Un instante se reduce al día de la zona de negocio, no al día UTC
- GIVEN el instante `'2026-09-10T00:30:00Z'`
- WHEN se calcula su día en zona
- THEN el resultado es `'2026-09-09'`

#### Scenario: Una fecha-hora sin desplazamiento no produce día
- GIVEN el valor `'2026-09-10T00:30:00'` (sin `Z` ni offset)
- WHEN se calcula su día en zona
- THEN el resultado es `null`

#### Scenario: `dia()` de bodegaje consume la misma noción, y una `YYYY-MM-DD` no cambia
- GIVEN el valor `'2026-09-09'` pasado a `dia()` (`bodegaje.ts:129-133`)
- WHEN se calcula
- THEN el resultado sigue siendo `'2026-09-09'`, igual que antes de consumir la función compartida
