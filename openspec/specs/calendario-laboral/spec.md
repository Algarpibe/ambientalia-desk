# Especificación: Calendario laboral — Jornada hábil y festivos de Colombia

| Dato | Valor |
|---|---|
| Capacidad | `calendario-laboral`, **nueva** — sin código construido a la fecha de esta spec |
| Tanda | F1B-12 |
| Procedencia | Anexo D nº 3 del maestro, por dependencia (`maestro_revision: pendiente`) — decisión `decision/calendario-habil`, que nace como consecuencia no anticipada de `decision/anexo-3-alerta` |
| Decisiones de Gerencia | `decision/anexo-3-alerta` — «un día hábil va de lunes a viernes, de 8 a 17 h (9 horas), sin festivos de Colombia» · `decision/calendario-habil` — jornada, festivos calculados por año, cierres inyectados, función única; «ninguna otra tanda construye su propio cálculo de horas hábiles» |
| Depende de | Ninguna pieza existente — módulo puro nuevo |
| La usan (fuera de esta tanda) | `SLA_HORAS_POR_ESTADO` (F1B-08/F1C-06), el reloj del SLA (c7), el tiempo promesa, la fecha prevista de facturación (Anexo D nº 33) y el indicador «tiempo de servicio» de `e009b-lista-indicadores` |

## 0 · Procedencia y método

Rigen las reglas de `CLAUDE.md`: **ruta y línea** en toda afirmación sobre código o diseño ya escrito,
**apartado y línea del `.md`** en toda afirmación sobre el maestro, la **clave** en toda cita de una
decisión de Gerencia (instrucción del lanzamiento de esta fase), **hipótesis** delante de lo demás. Esta
spec describe una capacidad nueva: las citas a `design.md` son los contratos **ya fijados** por esa fase
—escrita antes que esta spec en este cambio—, y esta spec se alinea con ellos para no introducir deriva
entre los dos artefactos.

Los festivos de 2026 y 2027 de los Requisitos RQ-CL-03/04 están **calculados según la Ley 51 de 1983**
(*hipótesis*: no hay texto legal en el repositorio) con el algoritmo anónimo gregoriano (Gauss/Meeus) para
el domingo de Pascua — 2026-04-05 y 2027-03-28 — y las reglas de traslado de RQ-CL-02. **Quedan marcados
para contraste contra el calendario oficial de Colombia antes de `sdd-apply`**; esa verificación es
responsabilidad del orquestador, no de esta fase.

## ADDED Requirements

### Requirement: RQ-CL-01 · Jornada hábil fija, 9 horas continuas en `America/Bogota`

El sistema **SHALL** definir la jornada hábil como lunes a viernes, 08:00 a 17:00, en la zona
`America/Bogota` (UTC−5 todo el año, sin horario de verano), 9 horas continuas y sin descuento de
almuerzo — `decision/anexo-3-alerta` fija literalmente «de 8 a 17 h (9 horas)» y «de lunes a viernes». El
tiempo fuera de ese intervalo, incluidos sábado y domingo, **MUST NOT** contar como hábil.

#### Scenario: Un lunes sin festivo cuenta la jornada completa
- GIVEN el intervalo entre `2026-06-01T08:00` y `2026-06-01T17:00` (lunes, sin festivo ni cierre)
- WHEN se calculan las horas hábiles
- THEN el resultado es 9 horas

#### Scenario: Un sábado no cuenta
- GIVEN el intervalo entre `2026-06-06T10:00` y `2026-06-06T14:00` (sábado)
- WHEN se calculan las horas hábiles
- THEN el resultado es 0 horas

### Requirement: RQ-CL-02 · Reglas de cálculo de los 18 festivos de Colombia, por año

El sistema **SHALL** calcular los festivos de cualquier año mediante tres reglas — no una lista estática
cargada una vez — per el diseño ya fijado (`design.md:32-45`, tres tablas + `domingoDePascua`):

| Regla | Festivos | Traslado |
|---|---|---|
| Fijos (6) | Año Nuevo (1 ene), Trabajo (1 may), Independencia (20 jul), Boyacá (7 ago), Inmaculada (8 dic), Navidad (25 dic) | Nunca se mueven |
| Trasladables (7) | Reyes (6 ene), San José (19 mar), San Pedro y Pablo (29 jun), Asunción (15 ago), Raza (12 oct), Todos los Santos (1 nov), Cartagena (11 nov) | Si no caen en lunes se mueven al lunes siguiente; si ya caen en lunes, no se mueven |
| De Pascua, sin traslado (2) | Jueves Santo (Pascua−3), Viernes Santo (Pascua−2) | Nunca se mueven |
| De Pascua, trasladados (3) | Ascensión (Pascua+39, jueves), Corpus Christi (Pascua+60, jueves), Sagrado Corazón (Pascua+68, viernes) | Se mueven al lunes siguiente (quedan en Pascua+43, +64, +71) |

#### Scenario: Un trasladable que no cae en lunes se mueve
- GIVEN Reyes Magos 2026 cae el `2026-01-06` (martes)
- WHEN se calcula el festivo trasladado
- THEN el resultado es `2026-01-12` (lunes)

#### Scenario: Un trasladable que ya cae en lunes no se mueve
- GIVEN San Pedro y San Pablo 2026 cae el `2026-06-29`, que ya es lunes
- WHEN se calcula el festivo trasladado
- THEN el resultado sigue siendo `2026-06-29`

#### Scenario: Un festivo fijo no se mueve aunque no sea lunes
- GIVEN Navidad 2026 cae el `2026-12-25` (viernes)
- WHEN se calcula el festivo
- THEN el resultado sigue siendo `2026-12-25`

### Requirement: RQ-CL-03 · Festivos de Colombia 2026, fecha a fecha (18)

El sistema **SHALL** calcular exactamente estos 18 festivos para 2026 (Pascua 2026 = `2026-04-05`,
domingo), aplicando RQ-CL-02:

| Fecha | Día | Festivo | Tipo |
|---|---|---|---|
| 2026-01-01 | jueves | Año Nuevo | Fija |
| 2026-01-12 | lunes | Reyes Magos | Trasladada desde 01-06 (martes) |
| 2026-03-23 | lunes | San José | Trasladada desde 03-19 (jueves) |
| 2026-04-02 | jueves | Jueves Santo | Pascua−3, sin traslado |
| 2026-04-03 | viernes | Viernes Santo | Pascua−2, sin traslado |
| 2026-05-01 | viernes | Día del Trabajo | Fija |
| 2026-05-18 | lunes | Ascensión del Señor | Pascua+43, trasladada desde 05-14 (jueves) |
| 2026-06-08 | lunes | Corpus Christi | Pascua+64, trasladada desde 06-04 (jueves) |
| 2026-06-15 | lunes | Sagrado Corazón | Pascua+71, trasladada desde 06-12 (viernes) |
| 2026-06-29 | lunes | San Pedro y San Pablo | Ya cae en lunes |
| 2026-07-20 | lunes | Independencia de Colombia | Fija |
| 2026-08-07 | viernes | Batalla de Boyacá | Fija |
| 2026-08-17 | lunes | Asunción de la Virgen | Trasladada desde 08-15 (sábado) |
| 2026-10-12 | lunes | Día de la Raza | Ya cae en lunes |
| 2026-11-02 | lunes | Todos los Santos | Trasladada desde 11-01 (domingo) |
| 2026-11-16 | lunes | Independencia de Cartagena | Trasladada desde 11-11 (miércoles) |
| 2026-12-08 | martes | Inmaculada Concepción | Fija |
| 2026-12-25 | viernes | Navidad | Fija |

#### Scenario: La tabla de 2026 tiene exactamente 18 fechas, sin repetidos
- GIVEN el año 2026
- WHEN se calculan los festivos
- THEN el resultado es la lista de arriba, en ese orden, sin fechas duplicadas

### Requirement: RQ-CL-04 · Festivos de Colombia 2027, fecha a fecha (18)

El sistema **SHALL** calcular exactamente estos 18 festivos para 2027 (Pascua 2027 = `2027-03-28`,
domingo), aplicando RQ-CL-02:

| Fecha | Día | Festivo | Tipo |
|---|---|---|---|
| 2027-01-01 | viernes | Año Nuevo | Fija |
| 2027-01-11 | lunes | Reyes Magos | Trasladada desde 01-06 (miércoles) |
| 2027-03-22 | lunes | San José | Trasladada desde 03-19 (viernes) |
| 2027-03-25 | jueves | Jueves Santo | Pascua−3, sin traslado |
| 2027-03-26 | viernes | Viernes Santo | Pascua−2, sin traslado |
| 2027-05-01 | sábado | Día del Trabajo | Fija |
| 2027-05-10 | lunes | Ascensión del Señor | Pascua+43, trasladada desde 05-06 (jueves) |
| 2027-05-31 | lunes | Corpus Christi | Pascua+64, trasladada desde 05-27 (jueves) |
| 2027-06-07 | lunes | Sagrado Corazón | Pascua+71, trasladada desde 06-04 (viernes) |
| 2027-07-05 | lunes | San Pedro y San Pablo | Trasladada desde 06-29 (martes) |
| 2027-07-20 | martes | Independencia de Colombia | Fija |
| 2027-08-07 | sábado | Batalla de Boyacá | Fija |
| 2027-08-16 | lunes | Asunción de la Virgen | Trasladada desde 08-15 (domingo) |
| 2027-10-18 | lunes | Día de la Raza | Trasladada desde 10-12 (martes) |
| 2027-11-01 | lunes | Todos los Santos | Ya cae en lunes |
| 2027-11-15 | lunes | Independencia de Cartagena | Trasladada desde 11-11 (jueves) |
| 2027-12-08 | miércoles | Inmaculada Concepción | Fija |
| 2027-12-25 | sábado | Navidad | Fija |

#### Scenario: La tabla de 2027 tiene exactamente 18 fechas, sin repetidos
- GIVEN el año 2027
- WHEN se calculan los festivos
- THEN el resultado es la lista de arriba, en ese orden, sin fechas duplicadas

### Requirement: RQ-CL-05 · Los cierres de empresa son días completos, inyectados como parámetro

El sistema **SHALL** representar cada cierre de empresa como un día completo de calendario en
`America/Bogota`, y **MUST NOT** admitir cierres de medio día — pregunta 3 de la ronda de preguntas del
proposal, contestada por el usuario el 2026-09-24. Las funciones de RQ-CL-07/RQ-CL-08 **SHALL** recibir la
lista de cierres como parámetro de entrada (`ReadonlySet<DiaCivil>`, `design.md:41-42`), nunca leída
directamente por el módulo puro — mismo molde de inyección que `fechasDerivadas.ts:25-31`
(`FuentesDeFechas`).

#### Scenario: Un cierre inyectado resta su día completo
- GIVEN un cierre inyectado para `2026-12-31` (jueves, sin ser festivo legal)
- WHEN se calculan los días hábiles entre `2026-12-29` y `2027-01-04` con ese cierre
- THEN `2026-12-31` no cuenta como día hábil

#### Scenario: Sin cierres inyectados, el resultado depende sólo de la ley
- GIVEN la misma consulta sin ningún cierre inyectado
- WHEN se calculan los días hábiles entre `2026-12-29` y `2027-01-04`
- THEN `2026-12-31` sí cuenta como día hábil, porque no es festivo legal

### Requirement: RQ-CL-06 · Los cierres se persisten en `public.calendario_cierres`, sin pantalla de alta

El sistema **SHALL** persistir los cierres de empresa en la tabla `public.calendario_cierres`
(`fecha date PRIMARY KEY`, `motivo`, `registrado_por`, `created_at` — `design.md:58-63`), con su sentencia
de creación calificada (`CREATE TABLE public.calendario_cierres …`) — regla dura de `CLAUDE.md` sobre la
topología de dos esquemas. El sistema **MUST NOT** exigir una pantalla de administración para dar de alta
un cierre: el alta es directa en la base de datos, a cargo de una persona — pregunta 1 del proposal,
contestada «Alfonso» el 2026-09-24. El servidor **SHALL** leer esa tabla (`design.md:44`,
`listarCierres`) para construir el parámetro que consumen RQ-CL-07/RQ-CL-08.

#### Scenario: Un cierre dado de alta directamente en la base aparece en el cómputo
- GIVEN una fila insertada por `INSERT` directo en `public.calendario_cierres` para una fecha futura
- WHEN el servidor calcula horas o días hábiles que cruzan esa fecha
- THEN esa fecha se descuenta del resultado, sin que exista ninguna ruta HTTP de alta

### Requirement: RQ-CL-07 · Una única función calcula las horas hábiles entre dos instantes

El sistema **SHALL** exponer una única función en `packages/shared` (`horasHabilesEntre`, `design.md:41`)
que reciba dos instantes y la lista de cierres, y devuelva las horas hábiles entre ellos, combinando
jornada (RQ-CL-01), festivos (RQ-CL-02/03/04) y cierres (RQ-CL-05).

#### Scenario: Fin de semana sin festivo — 2 horas hábiles
- GIVEN el intervalo entre `2026-05-22T16:00` (viernes) y `2026-05-25T09:00` (lunes, sin festivo)
- WHEN se calculan las horas hábiles
- THEN el resultado es 2 horas (1 h del viernes 16-17h, 1 h del lunes 8-9h)

#### Scenario: Fin de semana con el lunes festivo — 1 hora hábil
- GIVEN el intervalo entre `2026-06-05T16:00` (viernes) y `2026-06-08T09:00` (lunes, Corpus Christi)
- WHEN se calculan las horas hábiles
- THEN el resultado es 1 hora — sólo la del viernes; el lunes es festivo (RQ-CL-03)

### Requirement: RQ-CL-08 · Una única función calcula los días hábiles entre dos días civiles

El sistema **SHALL** exponer una única función en `packages/shared` (`diasHabilesEntre`, `design.md:42`)
que, dados dos días civiles en `America/Bogota` y la lista de cierres, devuelva el número de días
hábiles estrictamente posteriores al primer día y hasta el segundo inclusive — `(desde, hasta]`.

#### Scenario: Un festivo dentro del rango se descuenta del recuento
- GIVEN el rango `(2026-06-04, 2026-06-10]` (jueves excluido, miércoles incluido), que cruza `2026-06-08`
  (Corpus Christi)
- WHEN se calculan los días hábiles
- THEN el resultado cuenta viernes 05, martes 09 y miércoles 10 (3 días) — el jueves 04 queda fuera por
  ser el extremo abierto, el fin de semana no cuenta y el lunes 08 es festivo

### Requirement: RQ-CL-09 · Bordes: fin anterior o igual al inicio, e instante fuera de jornada

Si el instante de fin es **anterior o igual** al de inicio, el sistema **SHALL** devolver 0 horas y 0
días hábiles, sin lanzar excepción (`design.md:41`, «0 si hasta <= desde»). Un instante anterior a las
08:00 o posterior a las 17:00 **MUST NOT** ampliar el resultado más allá de las horas realmente
contenidas en la ventana 08:00-17:00 del día que le corresponda.

#### Scenario: El fin es anterior al inicio
- GIVEN un fin `2026-06-01T08:00` propuesto antes que un inicio `2026-06-05T17:00`
- WHEN se calculan las horas hábiles entre ese inicio y ese fin
- THEN el resultado es 0 horas

#### Scenario: Un instante antes de la jornada no amplía el resultado
- GIVEN el intervalo entre `2026-06-01T05:00` (antes de jornada) y `2026-06-01T17:00`
- WHEN se calculan las horas hábiles
- THEN el resultado es 9 horas, no 12

### Requirement: RQ-CL-10 · Los instantes en UTC se interpretan en `America/Bogota`

El sistema **SHALL** interpretar todo instante recibido en UTC (o con cualquier desplazamiento)
reduciéndolo primero a su día civil en `America/Bogota` — mismo patrón que `diaEnZona`
(`fechasDerivadas.ts:63-73`) y el formateador `Intl.DateTimeFormat` construido una vez a nivel de módulo
(`fechasDerivadas.ts:46-48`) — antes de aplicar jornada, festivos y cierres.

#### Scenario: Un instante UTC de madrugada pertenece al día anterior en Bogotá
- GIVEN el instante `2026-06-08T03:00:00Z` (fecha UTC: 8 de junio)
- WHEN se interpreta en `America/Bogota` (UTC−5)
- THEN corresponde a `2026-06-07T22:00` (domingo por la noche) — no al lunes 8, que es festivo
  (RQ-CL-03), y esa hora no cuenta como hábil en ninguno de los dos días

### Requirement: RQ-CL-11 · Exclusividad: ninguna otra pieza calcula horas o días hábiles por su cuenta

Ninguna otra ruta de código del monorepo **SHALL** implementar su propia aritmética de horas o días
hábiles: toda pieza que necesite ese cómputo **MUST** consumir RQ-CL-07/RQ-CL-08. Es requisito de
arquitectura de `decision/calendario-habil` («ninguna otra tanda construye su propio cálculo de horas
hábiles»), verificado por barrido documental de cierre, no por detector automático por nombre
(`design.md:21`, D7 — un detector por patrón sólo caza el nombre, no la noción, molde H5 de
`CLAUDE.md`). `sla.ts:37-43` (reloj de SLA, horas de calendario) queda fuera de esta tanda a propósito y
se reabre en F1B-08/F1C-06, que consumirán RQ-CL-07.

#### Scenario: El barrido de cierre no encuentra una segunda implementación fuera del módulo
- GIVEN el módulo de calendario laboral ya construido en `packages/shared/src/calendarioLaboral.ts`
- WHEN se barre `packages/` y `apps/` en busca de aritmética hábil propia, excluyendo ese módulo, sus
  pruebas y los consumidores futuros ya declarados fuera de esta tanda
- THEN no aparece ninguna coincidencia nueva

### Requirement: RQ-CL-12 · Trazabilidad: alta en `capabilities` y fila F1B-12 en la R01.3

El sistema documental **SHALL** declarar `calendario-laboral` en `openspec/config.yaml → capabilities`
(R-2 de `CLAUDE.md`, mecanismo ya fijado en `design.md:22`, D8) y **SHALL** escribir la fila F1B-12 en
una sección de catálogo nueva al final de la R01.3 (mecanismo fijado en `design.md:23`, D9). Las dos
son obligaciones documentales de cierre, no comportamiento del módulo: se ejecutan como tarea de
`sdd-apply`/`sdd-archive`, y esta spec sólo fija que el resultado final sea comprobable.

#### Scenario: La capacidad queda declarada al archivar el cambio
- GIVEN el cambio `calendario-laboral` archivado
- WHEN se inspecciona `openspec/config.yaml → capabilities`
- THEN aparece una entrada `calendario-laboral`

## Fuera de alcance de esta spec

- **`SLA_HORAS_POR_ESTADO` de horas de reloj a horas hábiles** (`sla.ts:32-35`) y las otras dos alarmas de
  `decision/anexo-3-alerta` → F1B-08/F1C-06.
- **El reloj del SLA (c7)** y los **indicadores** de `e009b-lista-indicadores` → F1C-06, F1F-05.
- **La fecha prevista de facturación** (Anexo D nº 33) y **el planificador periódico** que recalcule
  tickets abiertos — ninguno tiene fila propia hoy.
- **Una pantalla de administración de cierres** — descartada por la respuesta a la pregunta 1 del
  proposal.
