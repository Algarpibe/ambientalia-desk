# Delta: KPIs — la comparación juzga el 95 % con la variante de Zoho (`comparacion-juzga-variante`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`). Propuesta:
`openspec/changes/comparacion-juzga-variante/proposal.md`. Decisión: `decision/f1f05-variante-juzga-el-95`
(`openspec/config.yaml:5301-5319`); relacionadas `decision/e009b-lista-indicadores` y
`decision/f1f05-referencia-semanal-indicadores`. «El GET» es `GET /api/indicadores`; «el POST» es
`POST /api/indicadores/comparacion` (RQ-KP-26). Las citas a la spec viva van por RQ-KP-NN.

**Nota de fusión.** Cada bloque `MODIFIED` conserva EXACTAMENTE el número de líneas de su bloque vivo (SP-6: 1 línea;
RQ-KP-16: 53) y TODOS sus escenarios, para que la fusión no desplace ninguna línea de la spec viva, muy citada por
`spec.md:NNNN`. Lo nuevo va en `ADDED`, al final, tras RQ-KP-39. RQ-KP-17, RQ-KP-18 y RQ-KP-28 siguen ciertos y no se tocan.

## MODIFIED Requirements

### Fila SP-6 de la tabla «0 · Procedencia y método» (1 línea)

| SP-6 | Se publican DOS lecturas del porcentaje, por indicador y por ticket; el 95 % se juzga con la variante de Zoho y la letra es informativa (`decision/f1f05-variante-juzga-el-95`; RQ-KP-40) | Spec |

### Requirement: RQ-KP-16 · Comparación por pares con tolerancia de un día

Una función pura **SHALL** recibir pares (valor de la aplicación, valor de Zoho) por ticket e indicador y
devolver, **por indicador** (SP-6), `comparados`, `coincidentes`, `diferentes`, `sinComparar` y
`porcentaje` (coincidentes entre comparados, ×100, un decimal), y lo mismo para la variante de la fórmula de
Zoho contra Zoho (S-8). Letra: coincidencia con diferencia máxima de un día, cada diferencia mayor
explicada por escrito (`openspec/config.yaml:2655`, `R08.4.md:2957`).
- Dos números **coinciden** si `|a − b| ≤ 1`; con 2 de diferencia **no** coinciden.
- Dos textos del 54 **coinciden** si son iguales sin distinguir mayúsculas ni espacios laterales
  (`No Cumple` = `No cumple`).
- Un par **sin comparar** es el que tiene «sin dato» en la aplicación o en la variante, o **no tiene valor
  de Zoho**: ausente, `null`, vacío, o no numérico (no `Cumple`/`No cumple` en el 54). **MUST NOT** contarse
  como coincidencia ni como diferencia.
- Con `comparados = 0`, `porcentaje` **SHALL** ser `null`, nunca `0` ni `100`.
- Cada **diferencia mayor** (diferencia de más de un día, o textos distintos) **SHALL** listarse con
  `ticketId`, `columna`, ambos valores, los hitos con su fuente, `reentrante` y, en 49 y 50·53, los días
  de lunes a viernes del intervalo que el calendario laboral descuenta (festivos y cierres).
- Además del porcentaje por indicador, el resumen **SHALL** dar el de **tickets** con las dos lecturas y el mismo criterio
  (comparado: al menos un par comparable; coincidente: todos esos pares coinciden): `ticketsVariante` (variante) y `tickets`
  (letra), cada una con `comparados`, `coincidentes`, `porcentaje` (`null` sin comparados; RQ-KP-40). El 95 % se juzga con la
  variante, por indicador y por ticket (`decision/f1f05-variante-juzga-el-95`); la letra es informativa y una `nota` lo dice.
- Las diferencias mayores de la letra van en `diferencias`; las de la variante, en `variante.diferencias`.
- El resumen **MUST NOT** llevar bandera de aprobado/suspenso, color ni meta: la aplicación no decide el aprobado.

#### Scenario: Cuatro pares del 50·53
- GIVEN pares (app, Zoho): `(6, 7)`, `(6, 8)`, `(sin dato, 3)` y `(6, null)`
- WHEN se comparan
- THEN `comparados` es 2, `coincidentes` 1, `diferentes` 1, `sinComparar` 2 y `porcentaje` `50`

#### Scenario: La tolerancia es de un día
- GIVEN los pares `(6, 5)`, `(6, 7)` y `(6, 8)`
- WHEN se comparan
- THEN los dos primeros coinciden y el tercero es diferencia

#### Scenario: Un «sin dato» no coincide con nada
- GIVEN el par `(sin dato, 0)`
- WHEN se compara
- THEN cuenta como `sinComparar`, no como coincidente ni diferente

#### Scenario: Textos del 54
- GIVEN los pares `(Cumple, cumple)`, `(Cumple, No Cumple)` y `(sin dato, Cumple)`
- WHEN se comparan
- THEN hay 1 coincidente, 1 diferente y 1 sin comparar

#### Scenario: La diferencia mayor lleva su causa
- GIVEN el par del 50·53 `(6, 8)` de orden de venta `2026-12-24` a finalización `2027-01-05`
- WHEN se comparan
- THEN la diferencia lista los días `2026-12-25` y `2027-01-01`, ambos hitos con su fuente y `reentrante`

#### Scenario: Letra contra Zoho y fórmula de Zoho contra Zoho
- GIVEN el 50·53 con `valor 6`, `formulaZoho 8` y valor de Zoho `8`
- WHEN se comparan
- THEN la letra cuenta una diferencia y la variante, una coincidencia

## ADDED Requirements

### Requirement: RQ-KP-40 · Lectura por ticket de la variante y nota del 95 %

La función de comparación **SHALL** calcular la lectura por ticket para las DOS lecturas con el mismo criterio. El resumen
(`ResumenComparacion`, `packages/shared/src/indicadoresComparacion.ts:40-47`) **SHALL** llevar `ticketsVariante`
`{ comparados, coincidentes, porcentaje }`, la misma forma que `tickets` (S-1): un ticket es comparado si tiene al menos un
par comparable de la variante y coincidente si TODOS esos pares coinciden; `porcentaje` es `null` sin tickets comparados,
nunca `0` ni `100`. `tickets` **SHALL** seguir siendo la lectura de la letra y **MUST NOT** cambiar de valor. La `nota`
(`packages/shared/src/indicadoresComparacion.ts:10`) **SHALL** decir que el 95 % se juzga con la variante de Zoho, por indicador
y por ticket, y que la letra es informativa; **MUST NOT** decir que el 95 % no está precisado. La aplicación **MUST NOT**
decidir el aprobado: ni umbral, ni semáforo, ni veredicto (RQ-KP-18).
- En el `GET` y en el `POST` cambian sólo `comparacion.ticketsVariante` (nuevo, detrás de `tickets` y antes de `nota`) y
  `comparacion.nota` (texto). `tickets`, `porColumna`, `mensaje`, `comparable`, `tolerancia`, `periodo`, `flujo`, `fichero` y
  `cruce` no cambian. Con o sin `flujo` y periodo la regla es la misma (S-6).
- El CSV del `GET` **MUST NOT** cambiar: no lleva comparación y su sha256 (`apps/desk/server/routes/indicadores.test.ts:271`)
  se conserva.
- Las dos caracterizaciones sha256 de cuerpo JSON (`apps/desk/server/routes/indicadores.test.ts:263`;
  `apps/desk/server/routes/indicadoresComparacion.test.ts:326`) **SHALL** recalcularse, no borrarse, en el commit que nombra
  `decision/f1f05-variante-juzga-el-95` (S-5; molde RQ-KP-39). La prueba C13
  (`packages/shared/src/indicadoresComparacion.test.ts:136-141`), que exigía «no precisa» en la nota, se actualiza por la
  misma decisión.

#### Scenario: La variante y la letra difieren por ticket
- GIVEN un ticket cuya letra difiere de Zoho y cuya variante coincide, y otro en que ambas coinciden
- WHEN se compara
- THEN `tickets` da 2 comparados y 1 coincidente (50) y `ticketsVariante` da 2 comparados y 2 coincidentes (100)

#### Scenario: `tickets` sigue siendo la letra
- GIVEN los mismos pares del escenario anterior
- WHEN se leen las dos claves
- THEN `tickets.porcentaje` es `50` y `ticketsVariante.porcentaje` es `100`; si se intercambian, la prueba se pone roja

#### Scenario: Un ticket coincide sólo si coinciden todos sus pares
- GIVEN un ticket con dos pares comparables de la variante, uno que coincide y otro que difiere en más de un día
- WHEN se compara
- THEN cuenta como comparado y NO como coincidente en `ticketsVariante`

#### Scenario: Sin tickets comparados en la variante
- GIVEN pares donde ninguno tiene variante comparable
- WHEN se compara
- THEN `ticketsVariante.comparados` es 0 y `ticketsVariante.porcentaje` es `null`, nunca `0` ni `100`

#### Scenario: La nota dice quién juzga
- GIVEN cualquier comparación
- WHEN se lee `nota`
- THEN dice que el 95 % se juzga con la variante de Zoho y que la letra es informativa, y no contiene «no precisa»

#### Scenario: Sin bandera de aprobado
- GIVEN el resumen devuelto por el `GET` y por el `POST`
- WHEN se inspeccionan sus claves
- THEN no hay bandera de aprobado/suspenso, color, meta ni veredicto

#### Scenario: El cuerpo del GET y del POST cambia sólo en dos claves
- GIVEN la respuesta del `GET` y la del `POST` antes y después del cambio
- WHEN se comparan campo a campo
- THEN difieren sólo `comparacion.ticketsVariante` (nuevo) y `comparacion.nota`; y los sha256 de cuerpo JSON recalculados llevan en su comentario `decision/f1f05-variante-juzga-el-95`

#### Scenario: El CSV del GET no cambia (mutación)
- GIVEN la comparación metida en el CSV del `GET`
- WHEN corre la caracterización de `indicadores.test.ts:271`
- THEN se pone roja; con el CSV intacto, el hash se conserva

### Requirement: RQ-KP-41 · La vista juzga con la variante: variante primero, letra informativa

La vista del cliente (`apps/desk/src/lib/comparacionExportacion.ts`) **SHALL** armar DOS tablas a partir de lo que devuelve
el servidor, la de la VARIANTE primero, rotulada «Variante de la fórmula de Zoho · cuenta para el 95 %», y la de la letra
después, rotulada «Letra de la aplicación · informativa» (S-3). Cada tabla **SHALL** mostrar por indicador `comparados`,
`coincidentes`, `diferentes`, `sinComparar` y `porcentaje`, y una fila de tickets: la de la variante lee `ticketsVariante` y la
de la letra lee `tickets`. La fila de tickets pinta comparados, coinciden y porcentaje; «Difieren» y «Sin comparar» por
ticket quedan vacíos, porque el cliente no resta (regla invariable 13; S-7). Los rótulos son texto: la vista **MUST NOT**
llevar color, meta, semáforo ni veredicto (RQ-KP-28). El `.tsx` sólo pinta lo que la vista le da; sus decisiones se prueban en
`apps/desk/src/lib/*.ts`, nunca en el `.tsx` (F0-00).
- En la tabla de la variante, un `porcentaje` `null` (indicador o tickets) **SHALL** pintarse con `MENSAJE_SIN_PARES`
  (`packages/shared/src/indicadoresComparacion.ts:9`), **importado** de `@ambientalia/shared` y no reescrito (S-2). En la tabla
  de la letra, un `porcentaje` `null` sigue pintándose «—» (`apps/desk/src/lib/comparacionExportacion.test.ts:93-98`).
- Cada número de la tabla de la variante **SHALL** leerse de `k.variante` y la fila de tickets de `ticketsVariante`; los de
  la letra, de `k` y de `tickets`. La vista **MUST NOT** recalcular porcentajes.

#### Scenario: La variante va primero con su rótulo
- GIVEN una respuesta con las dos lecturas
- WHEN la vista la procesa
- THEN la primera tabla lleva el rótulo de la variante («cuenta para el 95 %») y la segunda el de la letra («informativa»)

#### Scenario: La letra no lleva el rótulo de la variante (mutación)
- GIVEN una vista que pinta la letra primero, o la letra con el rótulo de la variante
- WHEN corre la prueba de la vista
- THEN se pone roja

#### Scenario: La tabla de la variante lee la variante (mutación)
- GIVEN una respuesta en que la variante da 11/11 y la letra 4/11 en el 47
- WHEN la vista la procesa
- THEN la tabla de la variante muestra 11 comparados y 11 coinciden, y la de la letra 11 y 4; si la de la variante lee los números de la letra, la prueba se pone roja

#### Scenario: Los tickets de cada tabla salen de su clave
- GIVEN `tickets` 3/12 y `ticketsVariante` 13/13
- WHEN la vista la procesa
- THEN la fila de tickets de la variante dice 13, 13 y 100 y la de la letra dice 12, 3 y 25

#### Scenario: Difieren y Sin comparar por ticket quedan vacíos
- GIVEN la fila de tickets de cualquiera de las dos tablas
- WHEN la vista la procesa
- THEN «Difieren» y «Sin comparar» van vacíos, no `0` ni una resta del cliente

#### Scenario: La 55 de la variante dice «sin pares comparables»
- GIVEN la 55 con `variante.porcentaje` `null`
- WHEN la vista procesa la tabla de la variante
- THEN la celda dice «sin pares comparables», el texto de `MENSAJE_SIN_PARES`, no «—» ni `0` ni `100`

#### Scenario: La letra sigue pintando «—» (mutación)
- GIVEN un indicador de la letra con `porcentaje` `null`
- WHEN la vista procesa la tabla de la letra
- THEN la celda dice «—»; si pinta «sin pares comparables», o si la tabla de la variante pinta «—», la prueba se pone roja

#### Scenario: La frase se importa, no se reescribe (mutación)
- GIVEN la vista con la frase de `MENSAJE_SIN_PARES` redefinida con otro texto en el cliente
- WHEN corre la prueba de la tabla de la variante
- THEN se pone roja, porque el texto esperado sale de la constante de shared

#### Scenario: Sin color, meta, semáforo ni veredicto
- GIVEN la vista armada
- WHEN se inspeccionan sus claves
- THEN no hay color, meta, semáforo, bandera ni veredicto de aprobado

### Requirement: RQ-KP-42 · Aceptación de septiembre por la ruta de comparación

Una prueba **SHALL** sembrar el fixture de septiembre (`apps/desk/server/testing/septiembre2026.ts:55-63`) y llamar al `POST`
con un CSV generado EN MEMORIA desde las celdas de Gerencia, con las doce cabeceras que lee
`apps/desk/server/comparacion/leerExportacion.ts:5-19` (las dos de 50·53 con la misma celda; la 55 vacía), y periodo
`2026-09-01` a `2026-09-30` (S-4). **No se escribe a disco** y el CSV de Gerencia **MUST NOT** copiarse al repositorio (está
sin trackear y lleva clientes). La respuesta **SHALL** dar, en `ticketsVariante`, 13 comparados y 13 coincidentes (100 %), y
100 % de la variante por indicador en 47 (11 comparados), 49 (9), 50·53 (11), 51 (12), 54, 57, 58 y 59 (9 cada uno); la 55
sin pares comparables (`porcentaje` `null`). La letra sólo se publica como información: la prueba **MUST NOT** exigirle un
porcentaje.

#### Scenario: Septiembre da 13/13 por ticket con la variante
- GIVEN el fixture sembrado y el CSV en memoria
- WHEN un administrador llama al `POST` con el periodo de septiembre
- THEN `ticketsVariante` es `{ comparados: 13, coincidentes: 13, porcentaje: 100 }`

#### Scenario: Septiembre da 100 % por indicador con la variante
- GIVEN la misma respuesta
- WHEN se leen los indicadores de tiempo
- THEN la variante es 100 % con 11 comparados en el 47, 9 en el 49, 11 en el 50·53, 12 en el 51 y 9 en el 54, el 57, el 58 y el 59

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
