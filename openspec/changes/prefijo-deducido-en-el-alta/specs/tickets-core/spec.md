# Delta: tickets-core — el prefijo del código de servicio se deduce y lo impone el servidor (`prefijo-deducido-en-el-alta`)

Delta sobre `openspec/specs/tickets-core/spec.md`. Tanda F1B-03 (segundo cambio, `cierra: si`). Propuesta:
`openspec/changes/prefijo-deducido-en-el-alta/proposal.md`. Decisión que construye: `decision/prefijo-de-que-se-deduce`
(Gerencia, 2026-10-14; `openspec/config.yaml:4707-4736`). «La deducción» es la función pura `prefijoDeducido` de
`packages/shared/src/ticketCreate.ts`; su nombre y firma los fija el diseño, aquí se exige su comportamiento. Las
líneas citadas de la spec viva son las de `968bb53`.

**Nota de fusión.** Los tres bloques de `## MODIFIED Requirements` (RQ-TC-03, RQ-TC-05 y RQ-TC-10) sustituyen
**entero** el bloque de la spec viva con la misma cabecera: son completos, con todos sus escenarios existentes
(RQ-TC-03 no tiene ninguno; RQ-TC-05 conserva sus 13; RQ-TC-10 sus 3). Los de `## ADDED Requirements`
(RQ-TC-61, -62 y -63) se añaden **al final**, tras RQ-TC-60 (`spec.md:3577-3617`). Las tres filas de tablas se
fusionan aparte (sección siguiente), sustituyendo la línea exacta.

**Edición en sitio.** Cada bloque modificado conserva su número de líneas: RQ-TC-03 `:73-92` (20), RQ-TC-05
`:126-249` (124) y RQ-TC-10 `:554-589` (36). Ver «Desplazamiento previsto».

## Filas de tablas

**Se sustituye** la fila de «Prefijos del Código Servicio» de la tabla «Las tres fuentes, enfrentadas»
(`spec.md:33`) —una línea por otra—:

Antigua:

| Prefijos del Código Servicio | Cinco: MT · CG · HV · SR · PRO (`design C:33-34`) | M1.1 `[DECIDIDO]`: «se elimina la nomenclatura CG / MT» (`:1043`), **cerrado en R08**: el prefijo «puede derivarse automáticamente» (`:1067`) | Los cinco, y **derivados** del tipo de servicio (`packages/shared/src/ticketCreate.ts:1`, `:47-49`) |

Nueva:

| Prefijos del Código Servicio | Cinco: MT · CG · HV · SR · PRO (`design C:33-34`) | M1.1 `[DECIDIDO]`: «se elimina la nomenclatura CG / MT» (`:1043`), **cerrado en R08**: el prefijo «puede derivarse automáticamente» (`:1067`) | Los cinco, **deducidos** de la clasificación y del tipo de servicio por `prefijoDeducido` e **impuestos por el servidor** (RQ-TC-61; `decision/prefijo-de-que-se-deduce`). Hasta `968bb53` se elegían en un desplegable y se derivaban sólo del tipo de servicio (`packages/shared/src/ticketCreate.ts:1`, `:47-49` en `968bb53`) |

**Se sustituye** la fila M-1 de §5.2 (`spec.md:1463`):

Antigua:

| M-1 | Anexo G col. 27 (`:4337-4338`): «Tipo de Servicio: Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro» — **seis** | **Siete**: añade `Reparación` (`ticketCreate.ts:4`) | El código lo declara y lo razona: `Reparación` viene del formulario de remisiones, y al heredar la remisión el tipo de servicio del ticket las dos listas se unificaron (`ticketCreate.ts:2-3`). **Corrección para el maestro**: el Anexo G va con seis valores y la lista real tiene siete |

Nueva:

| M-1 | Anexo G col. 27 (`:4337-4338`): «Tipo de Servicio: Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro» — **seis** | **Ocho**: añade `Reparación` (`ticketCreate.ts:4`) y `Protocolo` (`decision/prefijo-de-que-se-deduce`, RQ-TC-61) | `Reparación` viene del formulario de remisiones, y al heredar la remisión el tipo de servicio del ticket las dos listas se unificaron (`ticketCreate.ts:2-3`); `Protocolo` entra porque de él se deduce el prefijo `PRO`. **Corrección para el maestro**: el Anexo G va con seis valores y la lista real tiene ocho |

**Se sustituye** la fila M-3 de §5.2 (`spec.md:1465`):

Antigua:

| M-3 | M1.1 `[DECIDIDO]` (`:1043`): «Se elimina la nomenclatura CG (calibración) / MT (mantenimiento)» | Los cinco prefijos siguen (`ticketCreate.ts:1`), y `defaultPrefijoFor` **deriva** CG para Calibración y MT para el resto (`:47-49`) | **El código implementa el cierre de la R08, no el `[DECIDIDO]` original.** R08 resolvió el punto nº 37: el prefijo es formalidad, «puede derivarse automáticamente de la clasificación y del tipo de servicio en lugar de teclearse» (`:1067`). Eso es exactamente `defaultPrefijoFor`. Sin discrepancia real, pero el `[DECIDIDO]` de `:1043` sigue en el maestro contradiciendo su propio cierre — **conviene marcarlo como superado ahí mismo** |

Nueva:

| M-3 | M1.1 `[DECIDIDO]` (`:1043`): «Se elimina la nomenclatura CG (calibración) / MT (mantenimiento)»; y `[DECIDIDO 30/09/2026 — R08.4]` (`R08.4.md:1170`): los cinco prefijos «dejan de existir en el alta… no se genera automáticamente» | Los cinco prefijos siguen (`ticketCreate.ts:1`) y `prefijoDeducido` los **deduce** de clasificación y tipo de servicio (RQ-TC-61): HV, SR, CG, PRO, MT | **El código implementa la decisión de Gerencia del 14/10 (`decision/prefijo-de-que-se-deduce`), no el `[DECIDIDO]` de R08.4:** el prefijo se conserva —Drive nombra carpetas e informes con él— y deja de elegirse. **Corrección para el maestro**: marcar `R08.4.md:1170` como superado y reescribirlo con la tabla de deducción. El `[DECIDIDO]` de `:1043` y el cierre de R08 (`:1067`, «puede derivarse automáticamente») siguen siendo anteriores a esta decisión |

## MODIFIED Requirements

### Requirement: RQ-TC-03 · El Código Servicio y el asunto se construyen, no se teclean

Los dos **SHALL** derivarse de sus componentes con funciones puras de
`packages/shared/src/ticketCreate.ts`:

| Función | Forma | Línea |
|---|---|---|
| `buildCodigoServicio` | `PREFIJO_serie_modelo_AAMMDD`, omitiendo los vacíos; el AAMMDD es el día civil de `America/Bogota` (RQ-TC-61) | `:12-14` |
| `buildSubject` | `Servicio Técnico {cliente} {tipoEquipo} {codigo}`, colapsando espacios | `:16-18` |
| `prefijoDeducido` | clasificación + tipo de servicio → `HV`, `SR`, `CG`, `PRO` o `MT` (RQ-TC-61); sustituye a `defaultPrefijoFor` (`:47-49`), retirada | `:46-49` |

- Los prefijos válidos **SHALL** ser cinco: `MT`, `CG`, `HV`, `SR`, `PRO`
  (`ticketCreate.ts:1`).
- El alta **MUST NOT** aceptar `codigoServicio` ni `subject` del cuerpo: el servidor los construye siempre
  (RQ-TC-62; hoy se aceptan en `ticketService.ts:101-102`). Sustituye a la «vista previa editable» (`design C:25`).
- `extractServiceCode` **SHALL** tolerar **espacios pegados a los guiones bajos**
  (`ticketCreate.ts:38-44`), y **SHALL** reconstruir el código desde los grupos y no devolver la
  coincidencia entera: un lote del histórico de Zoho viene así, y el patrón anterior los rechazaba en
  silencio, dejando esos tickets sin serial y por tanto sin poder enlazarse nunca con su equipo
  (`ticketCreate.ts:26-37`).

### Requirement: RQ-TC-05 · Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:21-111`) **en este orden**, el que exige el
orden total de precedencia (`transitions-st` §3.8; entre la 3 y la 4 corre desde F1B-03 la guarda de cargo de la OVI, escalón B, `RQ-TC-42`, y antes de la 7 «Garantía sólo con OVI», escalón C, `RQ-TC-43`):

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | Falta el equipo (salvo rama «Equipo nuevo», RQ-TC-15) | A | `422 'Falta el equipo'` | `ticketService.ts:23-24` |
| 2 | El equipo no está en el catálogo | A | `422 'Equipo no registrado'` | `:26-27` |
| 3 | La orden de venta no existe en Books | A | `422 'Orden de venta no encontrada'` | `:37-39` |
| 4 | Discrepancia equipo↔cliente | C | `422`, nombrando al cliente del equipo | `:61-79` |
| 5 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones) | C | `422`, con **todos** en una lista | `:83-88` |
| 6 | El cliente no existe en Books | C | `422 'Cliente no encontrado'` | `:89-90` |
| 7 | La orden de venta ya está asociada a otro ticket | D | `409` | `:96-100` |

**Rama «Equipo nuevo» — dos guardas nuevas, mismo escalón.** Cuando la guarda 1 no aplica por
`clasificaciones === 'Equipo nuevo'` (RQ-TC-15), el alta exige en su lugar:

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| Falta `serial`, `modeloId` o `fechaFacturaCompra` | A | `422` |
| Un campo opcional (fecha, Drive, mantenedor) es inválido | C | `422`, mensaje de F1B-02 |

**Modalidad — una guarda nueva, escalón C.** El alta valida `modalidad` (`transitions-soporte-remoto`
RQ-SR-07 y RQ-SR-09): un valor fuera de `remoto` / `en sitio` con clasificación `Soporte remoto`, o
cualquier `modalidad` enviada con otra clasificación, responde `422` nombrando el campo. Es contenido, así
que gana al `409` de unicidad de la OV (guarda 7, escalón D).

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| `modalidad` inválida, o enviada fuera de `Soporte remoto` | C | `422`, nombrando `modalidad` |

El orden relativo de estas guardas frente a las guardas 3-7 de la tabla de arriba, y entre sí, lo
fija `design.md`; esta spec sólo impone el escalón: existencia (A) antes que contenido (C), igual que
el resto de la tabla.

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno (probado en
  `services/ticketService.test.ts:273` en `ad65161`).
- El prefijo **MUST NOT** figurar entre los obligatorios ni validarse en el alta: se deduce (RQ-TC-61, RQ-TC-62); (Previously: «**SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:87`)»).
- El `409` de unicidad de la OV **SHALL** ser la **última** guarda antes de la primera escritura, sea
  el equipo o el ticket (`crearTicketConEquipo`, `:103`): cumple el orden total A/B/C/D de
  `transitions-st` §3.8.
- La guarda equipo↔cliente **SHALL** ejecutarse inmediatamente después de la existencia de la orden de
  venta en Books (`:39`) —que puede completar `clientId` cuando el cuerpo no lo trae (`:41`)— y antes
  de los obligatorios, del cliente y del `409` de unicidad.

(Previously: dos correcciones de citas por el desplazamiento de `9ed5635`, y las filas 4/5 —OV ya usada
antes que la discrepancia equipo↔cliente— en el orden que el código todavía ejecutaba.
`orden-precedencia-guardas` mueve el `409` de la OV al final: deja de ser la guarda 4 y pasa a ser la
7.)

(Previously, tras `orden-precedencia-guardas`: la columna de evidencia de las filas 4-7 apuntaba a
`:65-83`, `:87-92`, `:93-94` y `:45-49`; el rango de la función a `:20-105`; la nota del prefijo a
`:91`; y la del `createTicket` a `:97` — las siete desfasadas por el propio desplazamiento de líneas
de esa tanda, caso A de la regla de mutación 4 de `CLAUDE.md`. `alta-equipo-nuevo-en-ticket` repara
las siete contra el árbol de hoy y añade la subtabla de la rama «Equipo nuevo».)

#### Scenario: El alta sin discrepancia no cambia
- GIVEN un alta sin equipo con `clientId` propio, o con `clientId` igual al del equipo
- WHEN se crea el ticket
- THEN responde `201` y el comportamiento es idéntico al de hoy

#### Scenario: La orden de venta ya usada deja de ganar a los obligatorios que faltan
- GIVEN un alta con los obligatorios sin completar y una orden de venta ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (obligatorios, escalón C) y no `409` (OV, escalón D)

#### Scenario: La orden de venta ya usada deja de ganar al cliente no encontrado
- GIVEN un alta cuyo `clientId` no existe en Books y cuya orden de venta ya está asociada a otro
  ticket
- WHEN se crea el ticket
- THEN responde `422` (`'Cliente no encontrado'`, escalón C) y no `409` (OV, escalón D)

#### Scenario: La discrepancia equipo↔cliente gana a la orden de venta ya usada
- GIVEN un alta cuyo equipo es de un cliente distinto del solicitado, y cuya orden de venta ya está
  asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (equipo↔cliente, escalón C) y no `409` (OV, escalón D)

#### Scenario: Dentro del escalón C, la discrepancia equipo↔cliente se resuelve antes de contar los obligatorios
- GIVEN un alta sin `clientId` propio, con un equipo cuyo `clientId` sí resuelve al cliente correcto,
  y con los demás obligatorios sin completar
- WHEN se crea el ticket
- THEN responde `422` listando los obligatorios que faltan, sin incluir «cliente» entre ellos

#### Scenario: Rama «Equipo nuevo», datos obligatorios ausentes
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, y sin `serial` (o sin `modeloId`, o sin
  `fechaFacturaCompra`)
- WHEN se crea el ticket
- THEN responde `422` (escalón A) y no se escribe nada

#### Scenario: Rama «Equipo nuevo», dato opcional inválido
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, datos obligatorios completos, y un campo
  opcional con formato inválido (fecha o Drive)
- WHEN se crea el ticket
- THEN responde `422` con el mensaje de F1B-02 (`hojas-vida` RQ-HV-03/RQ-HV-04) y no se escribe nada

#### Scenario: Las otras dos clasificaciones no cambian
- GIVEN clasificaciones = 'Equipo para servicio de mantenimiento' o 'Soporte remoto', sin `equipoId`
- WHEN se crea el ticket
- THEN responde `422 'Falta el equipo'`, igual que hoy — la guarda 1 no cambia para estas dos ramas

#### Scenario: Modalidad inválida en un alta de soporte remoto
- GIVEN un alta `Soporte remoto` con equipo existente y `modalidad = 'presencial'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` (escalón C) y no se escribe nada

#### Scenario: Modalidad enviada con otra clasificación
- GIVEN un alta `Equipo nuevo` (datos válidos) con `modalidad = 'remoto'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` y no se escribe nada

#### Scenario: La guarda de modalidad gana a la orden de venta ya usada
- GIVEN un alta `Soporte remoto` con `modalidad` inválida y una OV ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (escalón C) y no `409` (escalón D)

**Bajo `strict_tdd`:** la prueba de «equipo↔cliente gana a la OV ya usada» nace **roja de forma
natural** —hoy el código contesta `409`—; la de «equipo↔cliente gana a los obligatorios» nace
**verde** —el código ya la cumple— y su rojo se obtiene **por mutación**: invertir el orden de las dos
guardas, correr la suite, confirmar el rojo, revertir. Las pruebas de la rama «Equipo nuevo» nacen
**rojas de forma natural**: la rama no existe hoy. Las de `modalidad` también: el campo no existe hoy;
su posición frente al `409` se fija por mutación (regla de mutación 1 de `CLAUDE.md`).

### Requirement: RQ-TC-10 · Las clasificaciones son el disparador de rama

`CLASIFICACIONES` **SHALL** ser exactamente tres, y **SHALL** ser obligatoria en el alta
(`packages/shared/src/ticketCreate.ts:5`; obligatoriedad en `ticketService.ts:56`):

`Equipo para servicio de mantenimiento` · `Equipo nuevo` · `Soporte remoto`

Es el campo que activa los distintos flujos de trabajo (maestro Anexo G col. 11, `:4325-4326`; M1.2
`[AS-IS — R05]`, `:1096`). El **tipo de servicio** es una segunda dimensión, distinta de la rama
(Anexo G col. 27, `:4337-4338`), y `TIPOS_SERVICIO` **SHALL** declararlo aparte, con ocho valores
—`Protocolo` en sexta posición, antes de los comodines (RQ-TC-61)— (`ticketCreate.ts:4`).

**Las tres ramas tienen grafo tras este cambio.** `Equipo para servicio de mantenimiento` usa el grafo de
servicio (`transitions-st`); `Equipo nuevo` tiene su propio catálogo, capacidad `transitions-equipo-nuevo`
(F1B-06, primer cambio, `blueprint-equipo-nuevo`); y `Soporte remoto` tiene el suyo, capacidad
`transitions-soporte-remoto` (F1B-06, segundo cambio, `blueprint-soporte-remoto`). El flujo aplicable de un
ticket lo decide su clasificación y su estado actual (`transitions-equipo-nuevo` RQ-EN-04); un ticket
heredado en un estado ajeno a su catálogo sigue en el grafo de servicio.

(Previously: «Dos de las tres ramas tienen grafo… `Soporte remoto` sigue sin grafo… y sus tickets siguen
cayendo en el grafo de servicio técnico.»)

#### Scenario: Un ticket `Equipo nuevo` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Equipo nuevo'` recién creado y llevado a `Ingresado`
- WHEN se listan las transiciones que puede ejecutar
- THEN son las del catálogo `transitions-equipo-nuevo`, nunca las de `TRANSITIONS`

#### Scenario: Un ticket `Soporte remoto` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Soporte remoto'` recién creado, en `Solicitud Soporte`
- WHEN se listan sus transiciones
- THEN son las del catálogo `transitions-soporte-remoto` (`Asignación`), nunca las de `TRANSITIONS`

#### Scenario: La prueba que fijaba «soporte remoto siempre enruta a servicio» se invierte
- GIVEN la prueba de `packages/shared/src/flujos.test.ts:42-45` en `66ab783` («SIEMPRE servicio»)
- WHEN se calcula `flujoDelTicket` para `Soporte remoto` en `Solicitud Soporte`
- THEN devuelve `soporte-remoto`; y para `Soporte remoto` en `Ticket creado` devuelve `servicio`

## ADDED Requirements

### Requirement: RQ-TC-61 · El prefijo del Código Servicio se deduce de la clasificación y del tipo de servicio, y lo impone el servidor

Fuente: `decision/prefijo-de-que-se-deduce` (Gerencia, 2026-10-14; `openspec/config.yaml:4707-4736`). Los cinco
prefijos se conservan porque Drive nombra carpetas e informes con ellos; lo que cambia es que ya no se **eligen**.

El sistema **SHALL** tener **una sola** función pura en `packages/shared` (`prefijoDeducido`, en
`packages/shared/src/ticketCreate.ts`; nombre y firma los fija el diseño) que, dados la clasificación y el tipo de
servicio, devuelve exactamente uno de los cinco valores de `PREFIJOS` (`ticketCreate.ts:1`), según esta tabla,
evaluada de arriba abajo:

| Clasificación | Tipo de servicio | Prefijo |
|---|---|---|
| `Equipo nuevo` | cualquiera | `HV` |
| `Soporte remoto` | cualquiera | `SR` |
| `Equipo para servicio de mantenimiento` | `Calibración` | `CG` |
| `Equipo para servicio de mantenimiento` | `Protocolo` | `PRO` |
| `Equipo para servicio de mantenimiento` | cualquier otro | `MT` |

- **Mismos predicados que el grafo.** `Equipo nuevo` y `Soporte remoto` **SHALL** reconocerse con
  `esClasificacionEquipoNuevo` y `esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:40-43`, `:116-118`),
  que comparan por igualdad tras recortar, plegar espacios y pasar a minúsculas. Toda otra clasificación,
  vacía o desconocida **SHALL** caer en la rama de mantenimiento (CG, PRO o MT según el tipo de servicio), igual
  que `estadoInicialDelAlta` (`flujos.ts:138-140`); **no** se rechaza (S-5). La deducción es **total**.
- **Tipo de servicio por literal exacto.** `Calibración` y `Protocolo` **SHALL** compararse por igualdad con el
  literal, como `Garantía` en `ordenOVI.ts:13` (S-6): `calibracion` sin tilde o `PROTOCOLO` caen en `MT`. Un tipo
  fuera de la lista (el alta lo acepta mientras no esté vacío, `ticketService.ts:85`) también da `MT`.
- **La clasificación decide antes que el tipo.** Un ticket `Equipo nuevo` o `Soporte remoto` **MUST NOT** recibir
  `CG`, `PRO` ni `MT`, aunque su tipo sea `Calibración` o `Protocolo`.
- **Los cinco son alcanzables.** Cada valor de `PREFIJOS` **SHALL** salir de alguna fila de la tabla.
- **Imposición.** El alta (`createManagedTicket`, `ticketService.ts:21-111`) **SHALL** calcular el prefijo con
  esta función a partir de la clasificación y del tipo de servicio del cuerpo, y **SHALL** construir con él el
  código de servicio (`buildCodigoServicio`). El `422` de obligatorios **MUST NOT** nombrar «prefijo»
  (RQ-TC-05, guarda 5).
- **Día del código.** El segmento `AAMMDD` **SHALL** ser el día civil de `America/Bogota` (`ZONA_NEGOCIO`,
  `packages/shared/src/fechasDerivadas.ts:13`; `diaEnZona`, `:63`) del instante de creación, no el de la zona del
  proceso del servidor (S-4; precedente RQ-TC-58). `buildCodigoServicio` lo calcula hoy con los getters locales
  de `Date` (`ticketCreate.ts:7-10`).
- **«Protocolo» en la lista.** `TIPOS_SERVICIO` **SHALL** contener `Protocolo` en **sexta** posición, tras
  `Reparación` y antes de `No aplica` y `Otro`, de modo que los comodines sigan al final (S-7;
  `ticketCreate.ts:4`, `packages/shared/src/ticketCreate.test.ts:14-19`). La lista queda con ocho valores y
  `Garantía` sigue presente (`ordenOVI.ts:13`).
- **Sin migración.** Los tickets ya guardados **MUST NOT** cambiar: ni su `codigoServicio`, ni su `subject`, ni
  su tipo de servicio. Ningún código se recalcula.

#### Scenario: Equipo nuevo → HV
- GIVEN clasificación `Equipo nuevo` y tipo de servicio `Mantenimiento`
- WHEN se deduce el prefijo
- THEN es `HV`

#### Scenario: Soporte remoto → SR
- GIVEN clasificación `Soporte remoto` y tipo de servicio `Diagnóstico`
- WHEN se deduce el prefijo
- THEN es `SR`

#### Scenario: Mantenimiento + Calibración → CG
- GIVEN clasificación `Equipo para servicio de mantenimiento` y tipo de servicio `Calibración`
- WHEN se deduce el prefijo
- THEN es `CG`

#### Scenario: Mantenimiento + Protocolo → PRO
- GIVEN clasificación `Equipo para servicio de mantenimiento` y tipo de servicio `Protocolo`
- WHEN se deduce el prefijo
- THEN es `PRO`

#### Scenario: Mantenimiento + cualquier otro tipo → MT
- GIVEN clasificación `Equipo para servicio de mantenimiento` y cada uno de los tipos `Diagnóstico`, `Garantía`, `Mantenimiento`, `Reparación`, `No aplica` y `Otro`
- WHEN se deduce el prefijo
- THEN es `MT` en los seis casos

#### Scenario: Un tipo fuera de la lista da MT
- GIVEN clasificación `Equipo para servicio de mantenimiento` y tipo de servicio `Inspección` (texto no vacío que el alta acepta, `ticketService.ts:85`)
- WHEN se deduce el prefijo
- THEN es `MT`

#### Scenario: La clasificación gana al tipo
- GIVEN clasificación `Equipo nuevo` con tipo `Calibración`, y clasificación `Soporte remoto` con tipo `Protocolo`
- WHEN se deduce el prefijo
- THEN es `HV` en el primer caso y `SR` en el segundo, nunca `CG` ni `PRO`

#### Scenario: Clasificación desconocida o vacía cae en la rama de mantenimiento
- GIVEN clasificación `Otra cosa`, o la cadena vacía, con tipo `Calibración`, con tipo `Protocolo` y con tipo `Garantía`
- WHEN se deduce el prefijo
- THEN es `CG`, `PRO` y `MT` respectivamente, y no se lanza ningún error

#### Scenario: La clasificación se reconoce con los mismos predicados que el grafo
- GIVEN clasificaciones `equipo nuevo`, ` Equipo   Nuevo ` y `soporte REMOTO` (variantes de caja y espacios que `flujos.ts:40-43` y `:116-118` aceptan), y `Equipo nuevo usado`, que no es igualdad
- WHEN se deduce el prefijo con tipo `Mantenimiento`
- THEN las tres primeras dan `HV`, `HV` y `SR`, y `Equipo nuevo usado` da `MT`

#### Scenario: El tipo de servicio se compara por literal exacto
- GIVEN clasificación `Equipo para servicio de mantenimiento` y tipos `calibracion`, `PROTOCOLO` y `Calibración`
- WHEN se deduce el prefijo
- THEN los dos primeros dan `MT` y el tercero `CG`

#### Scenario: Cada prefijo del catálogo es alcanzable
- GIVEN las cinco filas de la tabla de deducción
- WHEN se recogen los prefijos que producen
- THEN el conjunto es exactamente `PREFIJOS` (`MT`, `CG`, `HV`, `SR`, `PRO`)

#### Scenario: El alta guarda el código con el prefijo deducido
- GIVEN un alta válida de clasificación `Equipo para servicio de mantenimiento`, tipo `Protocolo`, y un equipo con serial `S1` y modelo `M1`, creada el día `261014` en Bogotá
- WHEN se crea el ticket
- THEN responde `201` y el `codigoServicio` guardado es `PRO_S1_M1_261014`

#### Scenario: Una alta por rama guarda su prefijo
- GIVEN cuatro altas válidas: `Equipo nuevo`, `Soporte remoto`, mantenimiento con `Calibración` y mantenimiento con `Reparación`
- WHEN se crean los cuatro tickets
- THEN sus códigos guardados empiezan por `HV_`, `SR_`, `CG_` y `MT_`

#### Scenario: «Protocolo» en la lista, sexta, con los comodines al final
- GIVEN `TIPOS_SERVICIO`
- WHEN se lee
- THEN contiene exactamente `Calibración`, `Diagnóstico`, `Garantía`, `Mantenimiento`, `Reparación`, `Protocolo`, `No aplica`, `Otro`, en ese orden, y `Protocolo` ocupa el índice 5 (sexta posición)

#### Scenario: El día del código es el de Bogotá, no el del proceso
- GIVEN un alta creada el `2026-10-14T20:00:00-05:00` (ya es el 15/10 en UTC) y otra el `2026-10-14T00:30:00-05:00`
- WHEN se crean los tickets, con el proceso en `TZ=UTC` y con `TZ=America/Bogota`
- THEN el segmento `AAMMDD` de los dos códigos es `261014` en ambas zonas del proceso

#### Scenario: Los tickets existentes no cambian
- GIVEN un ticket guardado antes de este cambio con `codigoServicio = 'CG_S1_M1_260101'` y tipo de servicio `Mantenimiento`
- WHEN se lee, o se ejecuta sobre él una transición
- THEN su `codigoServicio`, su `subject` y su tipo de servicio son los mismos que antes, y ninguna sentencia de migración los reescribe

### Requirement: RQ-TC-62 · El cuerpo del alta no decide prefijo, código ni asunto

Fuente: `decision/prefijo-de-que-se-deduce`, consecuencia (2); supuestos S-1 y S-2 de la propuesta (reversibles).

El alta **SHALL** **ignorar** los campos `prefijo`, `codigoServicio` y `subject` del cuerpo, no rechazarlos:
el servidor **SHALL** construir siempre el código con `buildCodigoServicio` (prefijo deducido, serial y modelo del
equipo, día de Bogotá) y el asunto con `buildSubject` a partir de ese código. Hoy el servidor acepta
`codigoServicio` y `subject` del cuerpo tal cual (`ticketService.ts:101-102`) y exige `prefijo`
(`ticketService.ts:82`, `:87`).

- **Sin guarda nueva.** Como la deducción es total sobre los obligatorios ya comprobados, ignorar los tres campos
  **MUST NOT** añadir ningún `422` ni `409` ni mover ninguna guarda: la escalera A < B < C < D de RQ-TC-05 no
  cambia salvo que «prefijo» deja de figurar en la guarda 5.
- **Un cliente viejo crea igual.** Un cuerpo que todavía manda los tres campos (pestaña con el cliente anterior en
  caché) **SHALL** dar `201` con el prefijo deducido; un cuerpo que no los manda, también.
- **`CreateTicketPayload`.** Los tres campos **SHALL** salir del tipo `CreateTicketPayload`
  (`packages/shared/src/types.ts:322`, `:325-326`).
- **`parseCodigoFromPotential`** (`ticketCreate.ts:20-24`) **SHALL** retirarse: su único consumidor es
  `CreateTicket.tsx:172`, y la oportunidad de CRM deja de fijar el prefijo (S-3).

#### Scenario: El prefijo del cuerpo se ignora
- GIVEN un alta `Equipo nuevo` válida con `prefijo: 'CG'`
- WHEN se crea el ticket
- THEN responde `201` y el `codigoServicio` guardado empieza por `HV_`

#### Scenario: El código del cuerpo se ignora
- GIVEN un alta `Equipo nuevo` válida con `codigoServicio: 'CG_X_Y_260101'`
- WHEN se crea el ticket
- THEN el `codigoServicio` guardado es `HV_{serial}_{modelo}_{AAMMDD}`, el construido por el servidor, y no el del cuerpo

#### Scenario: El asunto del cuerpo se ignora
- GIVEN un alta válida con `subject: 'Asunto tecleado a mano'` y `codigoServicio: 'CG_X_Y_260101'`
- WHEN se crea el ticket
- THEN el `subject` guardado es `Servicio Técnico {cliente} {tipoEquipo} {codigo}` con el código construido, y no contiene el texto tecleado

#### Scenario: Un prefijo inválido en el cuerpo ya no se rechaza
- GIVEN un alta válida con `prefijo: 'XX'`
- WHEN se crea el ticket
- THEN responde `201` con el prefijo deducido, y no `422` (hoy: `ticketService.ts:87`)

#### Scenario: Sin prefijo, el alta ya no lo echa en falta
- GIVEN un alta con cliente, tipo de servicio y clasificaciones, y sin `prefijo`
- WHEN se crea el ticket
- THEN responde `201`; y un alta sin cliente ni tipo ni clasificaciones responde `422 'Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones'`, sin la palabra «prefijo»

#### Scenario: La fila 5 de RQ-TC-05 deja de listar «prefijo»
- GIVEN la tabla de guardas de RQ-TC-05
- WHEN se lee la guarda 5 («Faltan obligatorios»)
- THEN enumera cliente, tipo de servicio y clasificaciones, y ninguna viñeta de RQ-TC-05 exige validar el prefijo contra `PREFIJOS`

#### Scenario: La deducción no mueve la escalera de guardas
- GIVEN un alta con equipo↔cliente discrepante, y otra con una OV ya asociada a otro ticket y los obligatorios sin completar
- WHEN se crean los tickets
- THEN responden `422` (equipo↔cliente, escalón C) y `422` (obligatorios, escalón C) respectivamente, y no `409`, exactamente como antes de este cambio

#### Scenario: Un cliente con los tres campos viejos crea igual
- GIVEN un cuerpo con `prefijo: 'MT'`, `codigoServicio: 'MT_a_b_260101'` y `subject: 'x'` sobre una clasificación `Soporte remoto`
- WHEN se crea el ticket
- THEN responde `201` y el código guardado empieza por `SR_`

### Requirement: RQ-TC-63 · Regla 13 del prefijo: la vista previa del cliente es comodidad, probada contra el servidor

Fuente: regla invariable 13, punto 3, de `CLAUDE.md`; la comparación decisión a decisión de la propuesta §4.

El formulario `CreateTicket` **SHALL** dejar de ofrecer un desplegable de prefijo, y **SHALL** mostrar el código y
el asunto como **vista previa de sólo lectura** calculada con la **misma** función de `packages/shared`
(`prefijoDeducido`, `buildCodigoServicio`, `buildSubject`). El cliente **MUST NOT** reescribir la tabla de
deducción ni dejar teclear el código o el asunto (hoy: `CreateTicket.tsx:46`, `:423-425`, `:434`, `:436`).

- **Por qué es comodidad y no guarda.** La decisión del cliente (qué prefijo, código y asunto se muestran) tiene
  contrapartida en el servidor: `createManagedTicket` deduce y construye aquí el prefijo, el código y el
  asunto (`ticketService.ts:101-102`, hoy), probado por RQ-TC-61 y RQ-TC-62. Si la vista previa difiere del
  guardado, manda el servidor.
- **La lista de tipos del desplegable** (`CreateTicket.tsx:417`) **no** tiene contrapartida: el servidor acepta
  cualquier texto no vacío (`ticketService.ts:85`). Es una carencia preexistente, **fuera de alcance** de este
  cambio, y se declara, no se oculta.
- **Verificación manual.** Los puntos del cliente tocan `.tsx`, que queda **fuera de la red de pruebas** por
  decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este requisito **no admite escenario automatizado** y
  **no** se propone `jsdom` ni `@testing-library` (mismo precedente que RQ-TC-60 y `RQ-VT-13`). Lo que sí es `.ts`
  se prueba en RQ-TC-61 y RQ-TC-62. La verificación la hace una persona **tras el despliegue** y no cuenta como
  tarea de la tanda (regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — el formulario no pide prefijo
- GIVEN el formulario de alta en `ambientalia-desk.ambientalia.cloud`, tras el despliegue
- WHEN se abre «Crear ticket»
- THEN no hay desplegable de prefijo, y el código y el asunto se ven sin poder editarse

#### Scenario: manual — la vista previa sigue a la clasificación y al tipo
- GIVEN el formulario con un equipo elegido
- WHEN se cambia la clasificación a «Equipo nuevo» y luego a mantenimiento con tipo «Calibración» y con tipo «Protocolo»
- THEN el código previsualizado empieza por `HV_`, `CG_` y `PRO_` respectivamente

#### Scenario: manual — el ticket creado conserva lo previsualizado
- GIVEN un alta enviada desde el formulario
- WHEN se abre el ticket creado
- THEN su código de servicio coincide con la vista previa (salvo el día, si cambió entre medias)

#### Scenario: la regla 13 del prefijo la impone el servidor y está probada
- GIVEN la vista previa del cliente y las pruebas de RQ-TC-61 y RQ-TC-62
- WHEN se enfrentan decisión a decisión (prefijo, código, asunto)
- THEN cada una nombra una línea del servidor que la impone y una prueba `.ts` que la fija

## Desplazamiento previsto

Ninguno. Los tres bloques modificados se editan en sitio y **conservan sus líneas vivas**:

| Bloque | Líneas vivas | Saldo |
|---|---|---|
| RQ-TC-03 | `spec.md:73-92` | ±0 (la fila de la tabla y la viñeta de `:86-87`, de dos líneas, se reescriben en sitio) |
| RQ-TC-05 | `spec.md:126-249` | ±0 (la fila 5, `:138`, y la viñeta del prefijo, `:165`, son una línea cada una; el «Previously» va dentro de la propia viñeta) |
| RQ-TC-10 | `spec.md:554-589` | ±0 (`:563-564` siguen siendo dos líneas) |
| Filas de §0 (`:33`), M-1 (`:1463`) y M-3 (`:1465`) | una línea cada una | ±0 |
| RQ-TC-61, -62 y -63 | al final, tras `:3617` | 0 sobre lo existente |

**Saldo total sobre las líneas vivas: 0.** Las citas a `spec.md:NNN` no se desplazan. Las **citas a código** de la
columna «Evidencia» de la guarda 5 (`:83-88`) y la nota `:87` se refieren a `968bb53`; el cambio moverá líneas de
`ticketService.ts` y `ticketCreate.ts`, y el barrido de la regla de mutación 4 al cierre las repara.
