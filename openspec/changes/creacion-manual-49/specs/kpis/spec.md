# Delta: KPIs — la creación del 49 en el fixture de septiembre es el campo manual (`creacion-manual-49`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`); la propuesta es la de este mismo cambio.
Decisión: `decision/f1f05-creacion-del-49-campo-manual` (`openspec/config.yaml:5321-5344`), consecuencia (3): «creación»
en el 49 es el campo manual «Fecha creación ticket», y con la referencia regenerada de Gerencia el 972 queda sin 49, así que
las celdas del 49 con valor en septiembre pasan de 9 a 8. Las citas a la spec viva van por RQ-KP-NN.

**Nota de fusión.** Cada bloque `MODIFIED` conserva EXACTAMENTE el número de líneas de su bloque vivo (RQ-KP-38: 26;
RQ-KP-42: 35) y TODOS sus escenarios, para que la fusión no desplace ninguna línea de la spec viva. Cambian tres líneas: la
del texto de RQ-KP-38 que fija las celdas con valor, la del texto de RQ-KP-42 que fija los comparados por indicador y el
segundo escenario de RQ-KP-42. No hay `ADDED` ni `REMOVED`.

## MODIFIED Requirements

### Requirement: RQ-KP-38 · Aceptación con los trece tickets de septiembre

Una prueba **SHALL** cargar un fixture anonimizado de los trece tickets de la exportación de septiembre y pedir a la
ruta septiembre. El fixture **SHALL** llevar SÓLO número, clasificación, estado, fechas y las columnas 47 a 59 (S-10),
y **MUST NOT** llevar contacto, asunto, serial, `cf_codigo_servicio` ni tipo de servicio. Se compara con tolerancia de
±1 día (S-9) en las celdas con valor: 47 → 11, 49 → 8 (`decision/f1f05-creacion-del-49-campo-manual`), 50·53 → 11, 51 → 12, 54 → 9, 57 → 9, 58 → 9, 59 → 9.

#### Scenario: Septiembre por cierre son trece
- GIVEN el fixture y el periodo `2026-09-01` a `2026-09-30`
- WHEN llama un administrador
- THEN salen los trece tickets; por creación salía uno, el 998

#### Scenario: Las celdas coinciden con Gerencia
- GIVEN el fixture cargado
- WHEN se compara `formulaZoho` con la celda de Gerencia
- THEN cada una de las ocho celdas con valor coincide dentro de ±1 día

#### Scenario: Un valor alterado de cada indicador (mutación por indicador)
- GIVEN el fixture con una celda alterada fuera de ±1, probando por separado 47, 49, 50·53, 51, 54, 57, 58 y 59
- WHEN corre la aceptación
- THEN se pone rojo en cada una de las ocho alteraciones

#### Scenario: El fixture no lleva datos personales
- GIVEN el fixture versionado
- WHEN se revisa campo a campo
- THEN todo campo pertenece a la lista de S-10 y el CSV de origen no está copiado

### Requirement: RQ-KP-42 · Aceptación de septiembre por la ruta de comparación

Una prueba **SHALL** sembrar el fixture de septiembre (`apps/desk/server/testing/septiembre2026.ts:55-63`) y llamar al `POST`
con un CSV generado EN MEMORIA desde las celdas de Gerencia, con las doce cabeceras que lee
`apps/desk/server/comparacion/leerExportacion.ts:5-19` (las dos de 50·53 con la misma celda; la 55 vacía), y periodo
`2026-09-01` a `2026-09-30` (S-4). **No se escribe a disco** y el CSV de Gerencia **MUST NOT** copiarse al repositorio (está
sin trackear y lleva clientes). La respuesta **SHALL** dar, en `ticketsVariante`, 13 comparados y 13 coincidentes (100 %), y
100 % de la variante por indicador en 47 (11 comparados), 49 (8, `decision/f1f05-creacion-del-49-campo-manual`), 50·53 (11), 51 (12), 54, 57, 58 y 59 (9 cada uno); la 55
sin pares comparables (`porcentaje` `null`). La letra sólo se publica como información: la prueba **MUST NOT** exigirle un
porcentaje.

#### Scenario: Septiembre da 13/13 por ticket con la variante
- GIVEN el fixture sembrado y el CSV en memoria
- WHEN un administrador llama al `POST` con el periodo de septiembre
- THEN `ticketsVariante` es `{ comparados: 13, coincidentes: 13, porcentaje: 100 }`

#### Scenario: Septiembre da 100 % por indicador con la variante
- GIVEN la misma respuesta
- WHEN se leen los indicadores de tiempo
- THEN la variante es 100 % con 11 comparados en el 47, 8 en el 49, 11 en el 50·53, 12 en el 51 y 9 en el 54, el 57, el 58 y el 59

#### Scenario: La 55 queda sin pares comparables
- GIVEN la columna 55 vacía en el CSV
- WHEN se lee la respuesta
- THEN la 55 trae `comparados` 0 y `porcentaje` `null` en la variante

#### Scenario: Un valor alterado rompe el 100 % por ticket (mutación)
- GIVEN el CSV en memoria con una celda alterada fuera de ±1, probando por separado cada uno de los ocho indicadores
- WHEN corre la aceptación
- THEN `ticketsVariante` deja de ser 13/13 y la prueba se pone roja en cada una de las ocho alteraciones

#### Scenario: El CSV no se escribe ni se copia
- GIVEN la prueba terminada
- WHEN se revisan el disco y el repositorio
- THEN no hay fichero CSV escrito por la prueba ni copia del de Gerencia, y las celdas salen del fixture anonimizado
