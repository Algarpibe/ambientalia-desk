# Delta: tickets-core — «Entregado» cierra con la fecha de Zoho o con la de la migración, marcada (`fecha-cierre-migracion`)

Delta sobre `openspec/specs/tickets-core/spec.md`. Tanda F1F-01 (`cierra: no`). Propuesta:
`openspec/changes/fecha-cierre-migracion/proposal.md`. Decisión que construye: `decision/migracion-e207-e212`
(Gerencia; `openspec/config.yaml:4737-4770`, consecuencia (1) en `:4747-4751`): «"Entregado" → "Finalizado", cerrado
con la fecha de cierre de Zoho o, si no tiene, la de la migración marcada como tal». Esa decisión **sustituye** el
supuesto S-2 de la tanda anterior («`closed_time` no se toca»), que la spec viva fija en `spec.md:2111` y `:2149`.
Las líneas citadas de la spec viva son las del worktree en `main`. La función pura nueva se nombra
`cierreDeMigracion` por la propuesta; su firma y su ubicación exacta las fija el diseño, aquí se exige su
comportamiento.

**Nota de fusión.** El bloque de `## MODIFIED Requirements` (RQ-TC-40) sustituye **entero** el bloque vivo con la misma
cabecera (`spec.md:2096-2180`): es completo, con sus **nueve** escenarios existentes. Cambian la regla 2 y el escenario
«`Entregado` va a `Finalizado` y cierra el ticket»; se añade un párrafo tras la lista de reglas y un escenario (el
décimo) al final. El bloque de `## ADDED Requirements` (RQ-TC-64) se añade **al final** de la spec, tras RQ-TC-63
(`spec.md:3803`; comprobado que es el último número usado).

## MODIFIED Requirements

### Requirement: RQ-TC-40 · Tabla de equivalencias Zoho → aplicación: identidad para los 23 estados, dos reglas propias y todo lo demás «sin equivalencia»

El núcleo puro de la migración de tickets abiertos (fichero nuevo en `packages/shared`, sin acceso a base de datos,
sin reloj y sin red) **SHALL** exponer una función que, dado el estado de Zoho de un ticket y su clasificación, devuelve
su estado equivalente en la aplicación o el resultado «sin equivalencia». El resultado lleva el estado `destino`, la
`regla` aplicada —una de `identidad`, `entregado-a-finalizado`, `pendiente-servicio-a-en-proceso` y
`pendiente-soporte-se-conserva`— y `statusTypeDestino` (`null` = no se cambia el `status_type`). «Pendiente» y
«Entregado» se deciden **antes** que la identidad. Las reglas son exactamente estas, y ninguna otra:

1. **Identidad.** Un estado que es uno de los 23 de `ESTADOS` (`packages/shared/src/estados.ts:112`, clasificados en
   `packages/shared/src/estados.ts:59-106`) **SHALL** devolverse tal cual, con `statusTypeDestino` nulo, **salvo
   «Pendiente»**, que está en `ESTADOS` y se decide por las reglas 3 y 4. La tabla **MUST** consumir `ESTADOS`
   y **MUST NOT** duplicar la lista de nombres (regla invariable 13, punto 1).
2. **`Entregado` → `Finalizado`.** `Entregado` no es uno de los 23. Su equivalente **SHALL** ser `Finalizado`
   (`docs/sdd/ENTRADA.md:1349`, `docs/sdd/ENTRADA.md:1385`), y la regla **SHALL** declarar que el `status_type`
   destino es `Closed` y que **cierra** el ticket: su `closed_time` se decide con la fecha de Zoho si el ticket la
   tiene o, si no, con el instante de la migración, marcada como tal (RQ-TC-64; `decision/migracion-e207-e212`).
   Esto sustituye al supuesto S-2 anterior («`closed_time` no se toca»).
3. **`Pendiente` de servicio técnico → `En Proceso`.** Un ticket en `Pendiente` cuya clasificación **no** es
   «Soporte remoto» **SHALL** pasar a `En Proceso` con `statusTypeDestino = 'Open'` (D-10; supuesto S-3, el mismo que ya escribió
   `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/proposal.md:116-121`). Una clasificación
   `null`, vacía o ausente cuenta como servicio, no como soporte remoto.
4. **`Pendiente` de soporte remoto se conserva.** Un ticket en `Pendiente` cuya clasificación **es** «Soporte remoto»
   **SHALL** devolver `Pendiente`, con la regla `pendiente-soporte-se-conserva` y `statusTypeDestino` nulo.
5. **Todo lo demás es «sin equivalencia».** Un estado que no es uno de los 23, que no es `Entregado` y que no es
   `Pendiente` **SHALL** devolver «sin equivalencia», con el estado de origen nombrado. La tabla **MUST NOT**
   adivinar un destino.

**Sólo la regla que cierra toca `closed_time`.** De las cuatro reglas, únicamente `entregado-a-finalizado`
(`statusTypeDestino === 'Closed'`) cierra el ticket y por tanto toca `closed_time`; la identidad y las dos de
`Pendiente` **MUST NOT** tocarlo (S-4 de `fecha-cierre-migracion`).

La comparación del estado **SHALL** ser por igualdad exacta con el registro: Zoho copia el estado verbatim
(`packages/zoho-sync/src/db/mappers.ts:47`) y la normalización de mayúsculas o espacios sería una segunda
implementación de la misma noción. Un `entregado` en minúsculas o con un espacio final es «sin equivalencia».

**Nota — divergencia con el script de F1C-09, declarada y no resuelta en silencio.** Soporte remoto se reconoce con
`esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:116-119`), que es igualdad normalizada, y **MUST NOT**
reescribirse como el `LIKE '%soporte%remoto%'` del script
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:17-19`), más tolerante. Una clasificación como
«Soporte remoto urgente» cae por tanto como servicio aquí y como soporte remoto allí. Por eso el informe de la
herramienta (RQ-ZS-17) lista los `Pendiente` por ticket, con su clasificación y su destino, para que una persona vea
si alguno cae mal. Confirmado por el orquestador: se usa el predicado compartido.

#### Scenario: Los 23 estados de la aplicación son identidad
- GIVEN cada uno de los 23 nombres de `ESTADOS`, con cualquier clasificación que no afecte a `Pendiente`
- WHEN se pide su equivalente
- THEN el resultado es ese mismo estado

#### Scenario: La tabla no duplica el registro
- GIVEN un nombre de estado añadido a `CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59`)
- WHEN se pide el equivalente de ese nombre sin tocar el fichero nuevo
- THEN el resultado es identidad

#### Scenario: `Entregado` va a `Finalizado` y cierra el ticket
- GIVEN un ticket de Zoho en `Entregado`
- WHEN se pide su equivalente
- THEN el estado destino es `Finalizado`
- AND `statusTypeDestino` es `'Closed'` y la regla es `entregado-a-finalizado`
- AND la regla cierra el ticket: su `closed_time` lo decide RQ-TC-64 (fecha de Zoho o instante de la migración, marcada) y lo escribe el ejecutor (RQ-ZS-17)

#### Scenario: `Pendiente` de servicio va a `En Proceso`
- GIVEN un ticket en `Pendiente` con clasificación «Reparación»
- WHEN se pide su equivalente
- THEN el estado destino es `En Proceso` y `statusTypeDestino` es `'Open'`

#### Scenario: `Pendiente` sin clasificación cuenta como servicio
- GIVEN un ticket en `Pendiente` con clasificación `null`, y otro con clasificación vacía
- WHEN se pide su equivalente
- THEN los dos van a `En Proceso`

#### Scenario: `Pendiente` de soporte remoto se conserva
- GIVEN un ticket en `Pendiente` con clasificación «Soporte remoto»
- WHEN se pide su equivalente
- THEN el estado destino es `Pendiente`

#### Scenario: La mayúscula variable de Zoho no cambia el reconocimiento de soporte remoto
- GIVEN un ticket en `Pendiente` con clasificación «soporte REMOTO»
- WHEN se pide su equivalente
- THEN el estado destino es `Pendiente`, porque `esClasificacionSoporteRemoto` normaliza

#### Scenario: Una clasificación tolerada por el `LIKE` pero no por el predicado cae como servicio
- GIVEN un ticket en `Pendiente` con clasificación «Soporte remoto urgente»
- WHEN se pide su equivalente
- THEN el estado destino es `En Proceso`
- AND no se reescribe ningún `LIKE` en el núcleo

#### Scenario: Un estado desconocido es «sin equivalencia» y se nombra
- GIVEN un ticket cuyo estado de Zoho es «En revisión externa», que no está en `ESTADOS`
- WHEN se pide su equivalente
- THEN el resultado es «sin equivalencia» con el estado de origen «En revisión externa»

#### Scenario: Una variante de mayúsculas de `Entregado` es «sin equivalencia»
- GIVEN un ticket con estado `entregado`, y otro con `Entregado ` (espacio final)
- WHEN se pide su equivalente
- THEN los dos son «sin equivalencia»

#### Scenario: El núcleo es puro
- GIVEN el fichero nuevo del núcleo en `packages/shared`
- WHEN se inspeccionan sus importaciones
- THEN no importa acceso a base de datos, red, sistema de ficheros ni reloj

#### Scenario: Sólo `Entregado` cierra; las otras reglas no tocan `closed_time`
- GIVEN un ticket por cada regla: `Entregado`, un estado de identidad, `Pendiente` de servicio y `Pendiente` de soporte remoto
- WHEN se pide su equivalente y su cierre (RQ-TC-64)
- THEN sólo el de `Entregado` produce un cierre
- AND los otros tres no producen cierre y su `closed_time` no se toca

## ADDED Requirements

### Requirement: RQ-TC-64 · El cierre de un «Entregado» migrado: fecha de Zoho si existe, si no el instante de la migración, con el origen marcado

Fuente: `decision/migracion-e207-e212` (Gerencia; `openspec/config.yaml:4737-4770`, consecuencia (1) en
`:4747-4751`). Supuestos reversibles de `fecha-cierre-migracion`: S-1 (el instante de la migración es uno por
ejecución), S-2 (la marca es un dato del marcador, no una columna ni una etiqueta visible), S-3 (la fecha de Zoho se
conserva tal cual) y S-4 (sólo la regla que cierra toca `closed_time`).

El núcleo puro de la migración (el mismo fichero de RQ-TC-40 en `packages/shared`, sin base de datos, **sin reloj**
y sin red; regla invariable 13, punto 1) **SHALL** exponer una función `cierreDeMigracion` que, dados la
equivalencia ya calculada (RQ-TC-40), el `closed_time` actual del ticket en Zoho y el instante de la migración,
devuelve el cierre que corresponde. El instante **SHALL** llegar como argumento: la función no lee el reloj. Su
resultado **SHALL** ser exactamente uno de:

1. **`null`**, cuando la equivalencia **no** cierra, es decir, cuando su `statusTypeDestino` no es `'Closed'`
   (identidad, `pendiente-servicio-a-en-proceso`, `pendiente-soporte-se-conserva`). Un resultado `null` significa
   «no tocar `closed_time`».
2. **`{ closedTime, origen: 'zoho' }`**, cuando la equivalencia cierra y el `closed_time` de Zoho **no es nulo**:
   `closedTime` es ese mismo instante, sin alterar (S-3).
3. **`{ closedTime, origen: 'migracion' }`**, cuando la equivalencia cierra y el `closed_time` de Zoho **es nulo**:
   `closedTime` es el instante de la migración recibido.

La precedencia **MUST** ser: la fecha de Zoho, si existe, gana sobre el instante de la migración. `origen` toma
**sólo** los dos valores `'zoho'` y `'migracion'`, y es el dato con que se marca el cierre (S-2). La función
**MUST NOT** dar `origen: 'migracion'` cuando hay fecha de Zoho, ni `origen: 'zoho'` cuando no la hay.

El **mismo** instante de migración **SHALL** aplicarse a todos los tickets de una misma ejecución con
`aplicar=true` (S-1); el recuento de cierres por origen del informe (RQ-ZS-17) **SHALL** salir de esta misma función,
no de una segunda implementación de la regla.

#### Scenario: Con fecha de cierre de Zoho, se conserva y se marca `zoho`
- GIVEN una equivalencia `entregado-a-finalizado` y un `closed_time` de Zoho `2026-08-14T15:30:00Z`
- AND un instante de migración `2026-12-01T10:00:00-05:00`
- WHEN se calcula el cierre
- THEN el resultado es `{ closedTime: 2026-08-14T15:30:00Z, origen: 'zoho' }`
- AND `closedTime` no es el instante de la migración

#### Scenario: Sin fecha de Zoho, cierra con el instante de la migración, marcado
- GIVEN una equivalencia `entregado-a-finalizado` y un `closed_time` de Zoho nulo
- AND un instante de migración `2026-12-01T10:00:00-05:00`
- WHEN se calcula el cierre
- THEN el resultado es `{ closedTime: 2026-12-01T15:00:00Z, origen: 'migracion' }`

#### Scenario: Una regla que no cierra devuelve `null`
- GIVEN una equivalencia de identidad, otra `pendiente-servicio-a-en-proceso` y otra `pendiente-soporte-se-conserva`, cada una con y sin `closed_time` de Zoho
- WHEN se calcula el cierre de cada una
- THEN las seis combinaciones devuelven `null`
- AND ninguna provoca escritura de `closed_time`

#### Scenario: La precedencia es Zoho antes que migración
- GIVEN dos tickets `entregado-a-finalizado` en la misma ejecución, uno con `closed_time` de Zoho y otro sin él
- WHEN se calculan sus cierres con el mismo instante de migración
- THEN el primero lleva su fecha de Zoho y `origen: 'zoho'`
- AND el segundo lleva el instante de la migración y `origen: 'migracion'`
- AND invertir la precedencia (preferir la migración cuando hay fecha de Zoho) pone roja una prueba

#### Scenario: La función no lee el reloj
- GIVEN dos llamadas con los mismos argumentos separadas en el tiempo
- WHEN se comparan sus resultados
- THEN son idénticos, porque el instante de la migración es un argumento y no se lee `Date.now()` ni `new Date()` dentro de la función
