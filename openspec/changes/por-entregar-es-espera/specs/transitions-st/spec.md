# Delta for transitions-st

Contexto: `openspec/specs/transitions-st/spec.md`. La Pieza 1 de `por-entregar-es-espera` mueve
`Por Entregar` y `Por Entregar / Sin facturar` de `'ninguna'` a `'externa'` en `CLASIFICACION_EN_ESPERA`
(`packages/shared/src/estados.ts:87-88`), lo que sube `ESTADOS_EN_ESPERA` de **nueve** a **once** y
`externa` de tres a cinco. Eso cambia el conteo en tres sitios de este spec donde el número «nueve»
está escrito en prosa: `RQ-TS-15`, §3.2 y §3.7. Los tres bloques se copian completos y se editan, según
el flujo de requisitos MODIFICADOS. Se añade además `RQ-TS-17` para la parte que ningún requisito
formal cubría todavía: que los dos estados de entrega quedan clasificados `'externa'`.

**Las siete líneas que `proposal.md §3, Pieza 3` identifica** (`:366`, `:377`, `:378`, `:380`, `:481`,
`:590`, `:598`) quedan corregidas por los tres bloques MODIFICADOS de abajo.

**⚠️ `spec.md:723` NO SE TOCA.** Dice «el propio maestro lo dice **nueve líneas** más abajo de
pedirlo» — es un conteo de líneas de prosa, no una afirmación sobre `ESTADOS_EN_ESPERA`. `sdd-archive`
**MUST NOT** fundir ningún cambio sobre esa línea.

**Hallazgo de verificación, no heredado del encargo — corrige el alcance de `proposal.md §3, Pieza 3`
en un punto que esa pieza no cubría.** `spec.md:587` afirma también «**9** estados» en la tabla de los
tres criterios de §3.7 — la misma clase de afirmación numérica que `estados.ts:21` («9 estados — LO
QUE DECLARA ESTE») y que el detector por palabra (`\bnueve\b`) no caza, tal como `proposal.md §3,
Pieza 3` ya advierte para ese otro fichero. Como `:587` cae dentro del mismo bloque §3.7 que `:590` y
`:598`, se corrige en el mismo acto: no es alcance nuevo, es completar la misma copia-y-edición.

**Segundo hallazgo de verificación, más importante que el anterior.** El párrafo de §3.2 que cruza
«doce estados con salida única» contra `en_espera` no es una cuenta que sólo cambie de «nueve» a
«once»: **la cuenta cruzada en sí misma cambia**, porque `Por Entregar` y `Por Entregar / Sin
facturar` son DOS de los doce estados con salida única (`entrega_al_cliente`,
`packages/shared/src/transitions.ts:250-251`; `entrega_sin_factura`, `:248-249`) y los dos entran en
`en_espera` con esta tanda. Verificado en esta sesión tabulando los 34 `from` de `transitions.ts`
contra los 21 estados: el cruce pasa de **seis** elementos a **ocho**, y los que quedan fuera de
`ESTADOS_SIN_SALIDA` pasan de **dos** (`Liberación Comercial`, `Remisión creada`) a **cuatro** (esos
dos más `Por Entregar` y `Por Entregar / Sin facturar`). Sustituir sólo «nueve» por «once» en ese
párrafo sin recalcular el cruce dejaría el spec afirmando un dato falso — exactamente lo que la regla
de método de `CLAUDE.md` prohíbe.

## ADDED Requirements

### Requirement: RQ-TS-17 · Los dos estados de entrega pasan a espera externa

`Por Entregar` y `Por Entregar / Sin facturar` **SHALL** estar clasificados `'externa'` en
`CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59-100`), y sus dos entradas **SHALL**
vivir físicamente dentro del bloque `externa` del registro, no en el de `ninguna`: la lista **SHALL**
seguir agrupada por clase y no por orden alfabético, porque se lee para comprobar la clasificación
(`estados.ts:56-57`).

`ESTADOS_EN_ESPERA` **SHALL** tener **once** entradas tras la reclasificación: `externa` pasa de tres
a **cinco** (`En Espera de Repuestos`, `Servicio externo`, `Notificación cliente`, `Por Entregar`,
`Por Entregar / Sin facturar`) e `interna` se queda en **seis**. El array que fije la prueba **SHALL**
comprobarse contra la salida real de `ESTADOS.filter(...)` (`estados.ts:114`), nunca al revés: mover
las dos entradas cambia su POSICIÓN dentro de `ESTADOS_EN_ESPERA`, y un `toEqual` escrito de memoria
fijaría el orden equivocado.

Es fundamento nuevo, no la modificación de un requisito existente: `transitions-st` no declaraba antes
un requisito formal sobre la composición de `CLASIFICACION_EN_ESPERA`; sólo la mencionaba en prosa
(`RQ-TS-15`, §3.2, §3.7).

#### Scenario: los dos estados de entrega entran en el bloque `externa`
- GIVEN el registro `CLASIFICACION_EN_ESPERA` tras esta tanda
- WHEN se inspeccionan las entradas `'Por Entregar'` y `'Por Entregar / Sin facturar'`
- THEN las dos valen `'externa'` y están dentro del bloque rotulado `externa`, no del bloque `ninguna`

#### Scenario: `ESTADOS_EN_ESPERA` pasa de nueve a once, con el orden fijado contra el filtro
- GIVEN el registro reclasificado
- WHEN se calcula `ESTADOS_EN_ESPERA` (`ESTADOS.filter(...)`, `estados.ts:114`)
- THEN el resultado tiene **once** entradas, en el orden que produce el filtro sobre el registro
  agrupado por clase — no en el orden que tenía la lista de nueve con las dos añadidas al final

## MODIFIED Requirements

### Requirement: RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** declararse como **dato**, no derivarse del grafo
(`packages/shared/src/sla.ts`, `SLA_HORAS_POR_ESTADO`). De las 34 transiciones no se deduce que
`Notificado` merezca un día y `Pendiente` no: es una decisión de negocio, igual que
`ESTADOS_SIN_SALIDA`.

- Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h. Es el único que el maestro decidió
  (M1.7, `R08.1.md:1570`; punto abierto nº 40), y venía del blueprint de Zoho, que sí lo tiene.
- La unidad **SHALL** ser la **hora**, no el día: el maestro deja abierto en «24/48 h» el plazo de la
  otra regla por tiempo que tiene pensada (`:1586`), y declarar días obligaría a cambiar la unidad el
  día que Gerencia elija 48.
- En el instante **exacto** del vencimiento el SLA **MUST NOT** estar vencido: un plazo de «un día»
  que saltara a las 23:59:59.999 no sería un día. La comparación es estricta
  (`sla.ts`, `slaVencido`; probado en `packages/shared/src/sla.test.ts`).
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). No la primera: `Notificado` está en un ciclo
  con `Rev./Diagnostico` —componente C3 de la tabla de reentrancia— y con la primera, un ticket que
  acaba de volver saldría vencido por una espera que ya terminó.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** reportarse como vencido: no se
  sabe cuándo entró en su estado, y un SLA sobre una fecha desconocida no es un SLA.
  `tickets.created_time` dice cuándo nació el ticket, que es otra cosa. **Esto acota la regla a los
  tickets que la aplicación ha movido**, y en producción los replicados de Zoho no lo están.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA`. El único estado con SLA está clasificado `ninguna`
  (`estados.ts:83`), así que no es ninguno de los **once** de la vista ni de los cuatro sin salida.
  Probado.

**Lo que este requisito NO incluye, y sigue abierto — ver §3.10.** Nada de esto **dispara**: no hay
planificador. El destinatario del escalado sí está resuelto, y es `RQ-TS-16`.

(Previously, hasta el archivado de `por-entregar-es-espera`: la última viñeta decía «no es ninguno de
los **nueve** de la vista». `ESTADOS_EN_ESPERA` pasa de 9 a 11 con `Por Entregar` y
`Por Entregar / Sin facturar` reclasificadas a `externa`; `Notificado` no cambia de clase, sigue fuera
de las dos listas.)

#### Scenario: el estado con SLA sigue fuera de las dos clasificaciones tras el reparto a once
- GIVEN que `ESTADOS_EN_ESPERA` pasa a tener once entradas (`Por Entregar` y
  `Por Entregar / Sin facturar` incluidas)
- WHEN se comprueba la clasificación de `Notificado`, el único estado con SLA declarado
- THEN sigue siendo `'ninguna'` y no pertenece ni a las once de la vista ni a las cuatro de
  `ESTADOS_SIN_SALIDA` — `packages/shared/src/sla.test.ts:52` sigue verde, comprobado corriendo la
  suite, no razonado

### Requirement: 3.2 · C3 — cuatro estados de espera sin salida de emergencia · destino F1C-03

**Comportamiento actual, a corregir en C3** (maestro M1.3.4, `:1162-1189`, punto abierto nº 31). Los
cuatro **SHALL** estar declarados como dato, no derivados (`estados.ts:145-154`):

| Estado | Única salida | De qué depende |
|---|---|---|
| `En Espera de Repuestos` | `llegada_repuestos` | Que el proveedor entregue |
| `Solicitado` | `entrega_repuestos` | Que almacén entregue la pieza |
| `Servicio externo` | `retorno_servicio_externo` | Que el laboratorio externo devuelva el sensor |
| `En espera de SKU inventario` | `notif_cliente_sku` | Que se cree el SKU en inventario |

El discriminador **SHALL** ir escrito, no sobreentendido: «el suceso del que depende la única salida
ocurre **fuera** de la aplicación» (`estados.ts:123-127`).

**La lección de método, que vale más que la lista:** «salida única» no es proxy de nada. Hay **doce**
estados con una sola salida, entre ellos `Ingresado` y `Ticket creado`, que son trabajo corriente; y
cruzarlo con `en_espera` da **ocho**, con `Liberación Comercial`, `Remisión creada`, `Por Entregar` y
`Por Entregar / Sin facturar` dentro. Por eso los cuatro se declaran y no se derivan
(`estados.ts:136-141`). Los cuatro sobrantes quedan fuera porque su única salida **es un acto que se
ejecuta en la aplicación**: `Liberación Comercial` por `habilitado_para_entrega`, área Comercial
(`estados.ts:129-134`); `Remisión creada` por `habilitar_servicio`, área Comercial
(`transitions.ts:178`); `Por Entregar` por `entrega_al_cliente`, área Servicio Técnico
(`transitions.ts:250-251`); `Por Entregar / Sin facturar` por `entrega_sin_factura`, área Servicio
Técnico (`transitions.ts:248-249`) — los cuatro comparten la misma razón: hay una persona que todavía
no ha entrado, no un suceso del mundo que esperar.

(Previously, hasta el archivado de `por-entregar-es-espera`: «cruzarlo con `en_espera` da **seis**,
con `Liberación Comercial` y `Remisión creada` dentro». La cifra cambia porque `Por Entregar` y
`Por Entregar / Sin facturar` son dos de los doce estados con salida única y entran en `en_espera` con
esta tanda — verificado tabulando los 34 `from` de `transitions.ts`, no por sustitución de «nueve» por
«once».)

#### Scenario: la derivación mal hecha da ocho, no cuatro, y las cuatro que sobran comparten razón
- GIVEN los doce estados con una sola transición de salida y los once estados `en_espera` (tras
  reclasificar `Por Entregar` y `Por Entregar / Sin facturar` a `externa`)
- WHEN se cruzan las dos listas
- THEN el resultado tiene **ocho** elementos, y los **cuatro** que no son de `ESTADOS_SIN_SALIDA` son
  `Liberación Comercial`, `Remisión creada`, `Por Entregar` y `Por Entregar / Sin facturar` — el
  `toEqual` de `packages/shared/src/estados.test.ts` que hoy fija «seis» y dos sobrantes se recalibra
  contra la salida real del cruce, no al revés

### Requirement: 3.7 · La vista y el reloj no leen la misma lista

**No es un defecto: es la regla, y si no queda escrita F1C-06 la pierde** (`estados.ts:26-33`). Tres
criterios distintos usan la palabra «espera» y **MUST** nombrarse distinto:

| Nombre | Criterio | Fuente | Alcance |
|---|---|---|---|
| `sin_salida` | Su única salida depende de algo que la aplicación no controla | M1.3.4 (`:1162`) | **4 estados** |
| `en_espera` | El ticket está parado esperando el acto de un tercero y el área dueña no puede hacer nada por su cuenta | Vista del tablero | **11 estados** |
| `bodegaje` | El tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente | M1.10 `[DEFINIDO — R08]` (`:1686`) | **3 periodos entre fechas**, no estados |

> **La vista muestra las once. El reloj del SLA NO lee esta clasificación** (`estados.ts:28`).

El reloj para en los tres bodegajes, que son periodos entre fechas. Un estado **MAY** estar
`en_espera` sin parar ningún reloj, y un bodegaje **MAY** transcurrir sin pasar por ningún estado de
la lista.

**Y desde F1A-02 esa regla tiene un caso que la demuestra, no sólo una advertencia.** El único
estado con SLA declarado es `Notificado`, y está clasificado `ninguna` (`estados.ts:83`), así que no
es ninguno de los once de la vista ni de los cuatro sin salida. La primera regla por tiempo que el
código tiene lee una lista **distinta** de la que enseña el tablero, exactamente como §3.7 anticipaba
cuando todavía era hipótesis. Probado en `packages/shared/src/sla.test.ts` — si alguien «arreglara»
el reloj haciéndolo leer `ESTADOS_EN_ESPERA`, se pone rojo. Ver `RQ-TS-15`.

`Pendiente` **SHALL** quedar como `sin_clasificar`, que es valor válido y no un hueco: obligar a
clasificar forzaría a inventar la respuesta (`estados.ts:53-54`, `:92-96`). Lo decide Servicio
Técnico.

(Previously, hasta el archivado de `por-entregar-es-espera`: la tabla declaraba `en_espera` con
**9 estados**, y el texto decía «la vista muestra las nueve»; «no es ninguno de los **nueve** de la
vista».)

⚠️ **Riesgo abierto, no resuelto por esta tanda (R-1 de `vista-todos-y-estados-en-espera`).**
`packages/shared/src/sla.test.ts:50-54` afirma que ningún estado con SLA está en `ESTADOS_EN_ESPERA`
— más fuerte que la regla escrita arriba, que sólo exige independencia, no exclusión mutua. Si una
tanda futura declara SLA para `Remisión creada` (la otra mitad de P21,
`Decisiones_Gerencia_2026-09-10.md:331-337`), esa prueba se pondrá roja sin que nada esté mal; se
reformula entonces, no se toca preventivamente aquí. Detalle en
`sdd/vista-todos-y-estados-en-espera/archive-report`.

#### Scenario: Remisión creada entra en la vista sin mover el reloj
- GIVEN que `Remisión creada` pasa a clase `interna` (P21) y por tanto entra en `ESTADOS_EN_ESPERA`
- WHEN se consulta `sla.ts` para ese estado
- THEN no tiene SLA declarado, y `packages/shared/src/sla.test.ts:50-54` sigue verde: la vista muestra
  un noveno estado en espera sin que el reloj se entere

#### Scenario: los dos estados de entrega entran en la vista sin mover el reloj
- GIVEN que `Por Entregar` y `Por Entregar / Sin facturar` pasan a clase `externa` y por tanto entran
  en `ESTADOS_EN_ESPERA`
- WHEN se consulta `sla.ts` para los dos estados
- THEN ninguno tiene SLA declarado, y `packages/shared/src/sla.test.ts:52` sigue verde: la vista
  muestra dos estados en espera más sin que el reloj se entere
