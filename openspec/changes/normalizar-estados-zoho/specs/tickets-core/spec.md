# Delta: tickets-core — RQ-TC-40 compara por igualdad exacta sobre el estado ya normalizado (`normalizar-estados-zoho`)

Delta sobre `openspec/specs/tickets-core/spec.md`. Tanda F1F-01 (`cierra: no`). Propuesta:
`openspec/changes/normalizar-estados-zoho/proposal.md`. Decisión que se construye: `decision/e249-normalizar-al-leer` (Gerencia;
`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, citada por clave): normalizar al leer y al sincronizar con la misma
función de `packages/shared`. Desde este cambio la sincronización ya no copia el estado tal cual y el lector de la migración
normaliza antes de llamar al núcleo, así que el párrafo de la igualdad exacta (`openspec/specs/tickets-core/spec.md:2128-2130` en `f5465799`) deja de ser cierto.

**Nota de fusión.** Un solo bloque `## MODIFIED Requirements`, RQ-TC-40, que sustituye **entero** al bloque vivo de la misma
cabecera (`openspec/specs/tickets-core/spec.md:2096-2202` en `f5465799`). Es copia literal del vivo salvo el párrafo de la
igualdad exacta, reescrito en las mismas tres líneas: el bloque conserva sus 107 líneas, sus escenarios y su orden, y la fusión
no mueve ninguna línea de la spec viva. El escenario «Una variante de mayúsculas de `Entregado` es «sin equivalencia»» sigue
siendo cierto tal cual: pide el equivalente al núcleo puro, que no normaliza.

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

La comparación del estado **SHALL** ser por igualdad exacta con el registro, sobre el valor que el lector ya normalizó con
la regla única de `zoho-sync` RQ-ZS-24 (`decision/e249-normalizar-al-leer`): el núcleo no normaliza por su cuenta, que sería
una segunda implementación de la misma noción. Pasados tal cual al núcleo, `entregado` y `Entregado ` (espacio final) son «sin equivalencia».

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
