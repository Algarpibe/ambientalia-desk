# Delta para `tickets-core`

## ADDED Requirements

### RQ-TC-40 · Tabla de equivalencias Zoho → aplicación: identidad para los 23 estados, dos reglas propias y todo lo demás «sin equivalencia»

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
   destino es `Closed` y que `closed_time` no se toca (supuesto S-2, reversible: una línea del plan por ticket).
3. **`Pendiente` de servicio técnico → `En Proceso`.** Un ticket en `Pendiente` cuya clasificación **no** es
   «Soporte remoto» **SHALL** pasar a `En Proceso` con `statusTypeDestino = 'Open'` (D-10; supuesto S-3, el mismo que ya escribió
   `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/proposal.md:116-121`). Una clasificación
   `null`, vacía o ausente cuenta como servicio, no como soporte remoto.
4. **`Pendiente` de soporte remoto se conserva.** Un ticket en `Pendiente` cuya clasificación **es** «Soporte remoto»
   **SHALL** devolver `Pendiente`, con la regla `pendiente-soporte-se-conserva` y `statusTypeDestino` nulo.
5. **Todo lo demás es «sin equivalencia».** Un estado que no es uno de los 23, que no es `Entregado` y que no es
   `Pendiente` **SHALL** devolver «sin equivalencia», con el estado de origen nombrado. La tabla **MUST NOT**
   adivinar un destino.

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
- AND `closed_time` no se toca (lo respeta el ejecutor, RQ-ZS-17)

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

### RQ-TC-41 · Plan por ticket: qué es «abierto», la fecha de corte como parámetro y lo que sólo se lista

El mismo núcleo **SHALL** exponer `planDeTicket(t, corte)`, que dado un ticket (con `status`, `status_type`,
`classification`, `managed_by_app`, `created_time` y `number`) y una **fecha de corte** devuelve su acción
(`migrar`, `ya-gobernado`, `tras-el-corte` o `sin-equivalencia`) y su equivalencia; `resumenDeMigracion(planes)`, que
agrega los planes en el informe; y `esperaRemisionDeEntrada(estado)`. La vigencia de la remisión **no** entra en el
núcleo: la decide el ejecutor con `vigenciaDeRemisiones` y `motivoSinRemisionVigente`, y el núcleo sólo dice qué
estados destino la esperan. Ninguna función **MUST** escribir nada. **Precedencia fija (D-8):** ya-gobernado →
tras-el-corte → sin-equivalencia → migrar.

- **«Abierto».** Un ticket es abierto cuando su `status_type` es distinto de `Closed`; `On Hold` cuenta como abierto
  (supuesto S-4, como la aplicación: `apps/desk/src/lib/boardView.ts:47-48`). Un ticket con `status_type` `Closed`
  **MUST NOT** aparecer en el plan de cambios.
- **La fecha de corte es un parámetro obligatorio.** Rechazar un `corte` ausente o sin forma de fecha es de la ruta
  (`400`, D-11). El núcleo recibe un `Date` y, como **supuesto reversible no escrito en el diseño**, lanza
  `RangeError` si es inválido (sin él, una fecha inválida volvería todo «migrar»). **MUST NOT** llevar ninguna fecha
  fija en el código (el plan A puede moverla al 01/02/2027: `openspec/config.yaml:3613`).
- **Nacidos tras el corte.** Un ticket abierto cuyo `created_time` es posterior a la fecha de corte **SHALL** quedar
  fuera de los cambios y **SHALL** listarse aparte (supuesto S-5). Un `created_time` `null` **SHALL** tratarse como
  anterior al corte. La fecha de corte es un instante; la zona horaria la fija quien llama (hipótesis, sin medir).
- **Ya gobernados por la aplicación.** Un ticket abierto con `managed_by_app = true` **SHALL** quedar fuera de los
  cambios y **SHALL** listarse aparte: es la frontera de escritura
  (`packages/zoho-sync/src/db/repo.ts:71`) y la razón de la idempotencia.
- **Qué se cambia.** Un ticket abierto, no nacido tras el corte, con `managed_by_app = false` y con equivalencia
  (RQ-TC-40) **SHALL** entrar en el plan con: estado de origen y de destino, `status_type` previo y destino, y
  `managed_by_app` previo. El destino de `managed_by_app` es siempre `true`. El `status_type` destino es el de la
  equivalencia: `null` (no se toca) en la identidad, `'Closed'` para «Entregado» y `'Open'` para «Pendiente» de
  servicio (D-10).
- **Sin equivalencia.** Un ticket abierto con estado sin equivalencia que se migraría (no gobernado y no nacido tras
  el corte) **SHALL** listarse aparte con su número y su estado de origen, agrupado por estado, y su sola presencia
  **SHALL** marcar el plan como «bloqueado» (D-8; ya está en el escenario «no bloquea»).
- **Sin remisión de entrada vigente.** Un ticket a migrar cuyo destino cumple `esperaRemisionDeEntrada` (`OV asignada`
  o `Ticket creado`) sin remisión de entrada vigente **SHALL** contarse y listarse, con el número del ticket. No se le
  crea remisión (supuesto S-6): quedará bloqueado en «Habilitar Servicio»
  (`apps/desk/server/services/ticketService.ts:273-277`). La vigencia **SHALL** decidirla el ejecutor con el mismo
  predicado compartido que usa esa guarda, no una reimplementación.
- **El número más alto.** El plan **SHALL** dar el número (`number`) más alto entre los tickets que se marcarían,
  o `null` si no hay ninguno. Es el dato para la hipótesis de que un número de Zoho muy alto arrastre la numeración
  propia, que lee el máximo de las filas gobernadas
  (`packages/zoho-sync/src/db/repo.ts:245`, `packages/zoho-sync/src/db/migrate.ts:47`).
- **Ya gobernados.** `resumenDeMigracion` **SHALL** darlos como dos recuentos, `nacidosEnLaApp` (id con
  `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`) y `deZoho`, no como lista de números.
- **Totales por estado.** El resumen **SHALL** contar por pareja (estado de origen, estado de destino), con
  `cambiaEstado`, y **SHALL** listar los `pendientes` por ticket (número, clasificación y destino).

La regla **MUST NOT** añadir ninguna decisión al cliente (`apps/desk/src`): todo lo anterior vive en `packages/shared`
y lo impone el servidor (regla invariable 13).

#### Scenario: Un ticket cerrado no entra en el plan
- GIVEN un ticket con `status_type = 'Closed'` y estado `Finalizado`
- WHEN se calcula el plan
- THEN no figura entre los cambios ni entre las listas de sin equivalencia o sin remisión

#### Scenario: `On Hold` cuenta como abierto
- GIVEN un ticket con `status_type = 'On Hold'`, estado `En Espera de Repuestos` y `managed_by_app = false`
- WHEN se calcula el plan
- THEN figura entre los cambios con destino `En Espera de Repuestos` y `managed_by_app` destino `true`

#### Scenario: Un corte inválido lanza `RangeError`
- GIVEN una llamada a `planDeTicket` con un `Date` inválido (el rechazo de un `corte` ausente o sin forma de fecha es de la ruta, `400`)
- WHEN se calcula el plan
- THEN se lanza `RangeError` y no se devuelve plan

#### Scenario: La precedencia es ya-gobernado, tras-el-corte, sin-equivalencia, migrar
- GIVEN un ticket gobernado y sin equivalencia, y otro nacido tras el corte y sin equivalencia
- WHEN se calcula el plan
- THEN el primero es `ya-gobernado` y el segundo `tras-el-corte`

#### Scenario: La fecha de corte manda, no una constante
- GIVEN un ticket abierto con `created_time` 2027-01-20 y dos llamadas, una con corte 2027-01-15 y otra con 2027-02-01
- WHEN se calcula el plan en cada una
- THEN con el primer corte el ticket se lista como nacido tras el corte y no se cambia
- AND con el segundo entra en los cambios

#### Scenario: Un nacido tras el corte sólo se lista
- GIVEN un ticket abierto, con equivalencia, `managed_by_app = false` y `created_time` posterior al corte
- WHEN se calcula el plan
- THEN figura en la lista de nacidos tras el corte y no entre los cambios

#### Scenario: `created_time` nulo se trata como anterior al corte
- GIVEN un ticket abierto con `created_time = null`
- WHEN se calcula el plan
- THEN entra en los cambios y no en la lista de nacidos tras el corte

#### Scenario: Un ticket ya gobernado por la aplicación sólo se lista
- GIVEN un ticket abierto con `managed_by_app = true`
- WHEN se calcula el plan
- THEN figura en la lista de ya gobernados y no entre los cambios

#### Scenario: Un estado sin equivalencia bloquea el plan
- GIVEN un ticket abierto con un estado sin equivalencia, entre otros tickets con equivalencia
- WHEN se calcula el plan
- THEN el plan está bloqueado
- AND el ticket figura agrupado por su estado de origen, con recuento y número, en `sinEquivalencia`

#### Scenario: Un sin equivalencia ya gobernado o nacido tras el corte no bloquea
- GIVEN un ticket abierto con estado sin equivalencia pero `managed_by_app = true`, y otro con estado sin equivalencia nacido tras el corte
- WHEN se calcula el plan
- THEN el plan no está bloqueado, porque ninguno de los dos se cambiaría
- AND ambos figuran en su lista de «sólo listados»

#### Scenario: Sólo `OV asignada` y `Ticket creado` esperan remisión de entrada
- GIVEN los estados `OV asignada`, `Ticket creado` y `En Proceso`
- WHEN se llama a `esperaRemisionDeEntrada`
- THEN es verdadero para los dos primeros y falso para `En Proceso`
- AND la vigencia de cada ticket la decide el ejecutor, no el núcleo

#### Scenario: El número más alto a marcar excluye lo que no se marca
- GIVEN tickets a marcar con números 4100 y 4300, un ticket ya gobernado con 9000 y otro nacido tras el corte con 9500
- WHEN se calcula el plan
- THEN el número más alto a marcar es 4300

#### Scenario: Sin nada que marcar, el número más alto es nulo
- GIVEN una lista en la que ningún ticket entra en los cambios
- WHEN se calcula el plan
- THEN el número más alto a marcar es `null`

#### Scenario: Totales, pendientes y ya gobernados
- GIVEN tres tickets `Pendiente` (dos «Reparación», uno «Soporte remoto»), uno `Entregado`, un gobernado de la app (id `app-…`) y otro de Zoho
- WHEN se resume el plan
- THEN los totales dicen: `Pendiente → En Proceso` 2, `Pendiente → Pendiente` 1, `Entregado → Finalizado` 1, cada pareja con su `cambiaEstado`
- AND `pendientes` lista los tres por ticket con número, clasificación y destino
- AND `yaGobernados` dice `nacidosEnLaApp` 1 y `deZoho` 1

#### Scenario: Calcular el plan no escribe
- GIVEN una lista de tickets
- WHEN se calcula el plan
- THEN la lista de entrada no se muta
