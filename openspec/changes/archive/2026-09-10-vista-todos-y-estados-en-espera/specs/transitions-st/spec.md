# Delta for transitions-st

Contexto: `openspec/specs/transitions-st/spec.md`. Esta tanda cierra IV-1 (§3.6) y ejecuta P21
(`Remisión creada` pasa de `ninguna` a `interna`), lo que cambia el conteo de `en_espera` de 8 a 9 en
tres sitios donde ese número está escrito en prosa: `RQ-TS-15`, §3.2 y §3.7. Los cuatro bloques se
copian completos y se editan, según el flujo de requisitos MODIFICADOS.

**Nota de verificación.** §3.2 no estaba en la lista de «Capacidades modificadas» de `proposal.md §9`,
pero su párrafo «cruzarlo con `en_espera` da cinco, con `Liberación Comercial` dentro» cita el mismo
hecho que rompen `packages/shared/src/estados.test.ts:176-185` y el comentario de cabecera de
`estados.ts:132-136`: verificado de disco en esta sesión, no heredado del encargo. Se incluye aquí para
que el spec no quede citando una cifra caduca.

## MODIFIED Requirements

### Requirement: RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** declararse como **dato**, no derivarse del grafo (`packages/shared/src/sla.ts`,
`SLA_HORAS_POR_ESTADO`). De las 34 transiciones no se deduce que `Notificado` merezca un día y
`Pendiente` no: es una decisión de negocio, igual que `ESTADOS_SIN_SALIDA`.

- Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h. Es el único que el maestro decidió
  (M1.7, `R08.1.md:1570`; punto abierto nº 40), y venía del blueprint de Zoho, que sí lo tiene.
- La unidad **SHALL** ser la **hora**, no el día: el maestro deja abierto en «24/48 h» el plazo de la
  otra regla por tiempo que tiene pensada (`:1586`), y declarar días obligaría a cambiar la unidad el
  día que Gerencia elija 48.
- En el instante **exacto** del vencimiento el SLA **MUST NOT** estar vencido: un plazo de «un día»
  que saltara a las 23:59:59.999 no sería un día. La comparación es estricta (`sla.ts`, `slaVencido`;
  probado en `packages/shared/src/sla.test.ts`).
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). No la primera: `Notificado` está en un ciclo con
  `Rev./Diagnostico` y con la primera, un ticket que acaba de volver saldría vencido por una espera ya
  terminada.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** reportarse como vencido: no se
  sabe cuándo entró en su estado. Esto acota la regla a los tickets que la aplicación ha movido.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA`. El único estado con SLA está clasificado `ninguna`
  (`estados.ts:79`), así que no es ninguno de los **nueve** de la vista ni de los cuatro sin salida.
  Probado.

**Lo que este requisito NO incluye, y sigue abierto — ver §3.10.** Nada de esto dispara: no hay
planificador. El destinatario del escalado es `RQ-TS-16`.

(Previously: la última viñeta decía «no es ninguno de los **ocho** de la vista». `ESTADOS_EN_ESPERA`
pasa de 8 a 9 con `Remisión creada` reclasificada a `interna`; `Notificado` no cambia de clase, sigue
fuera de las dos listas)

#### Scenario: el estado con SLA sigue fuera de las dos clasificaciones tras el reparto a nueve
- GIVEN que `ESTADOS_EN_ESPERA` pasa a tener nueve entradas (`Remisión creada` incluida)
- WHEN se comprueba la clasificación de `Notificado`, el único estado con SLA declarado
- THEN sigue siendo `'ninguna'` y no pertenece ni a las nueve de la vista ni a las cuatro de
  `ESTADOS_SIN_SALIDA` — `packages/shared/src/sla.test.ts:50-54` sigue verde sin tocarse

### Requirement: 3.2 · C3 — cuatro estados de espera sin salida de emergencia · destino F1C-03

**Comportamiento actual, a corregir en C3** (maestro M1.3.4, `:1162-1189`, punto abierto nº 31). Los
cuatro **SHALL** estar declarados como dato, no derivados (`estados.ts:140-149`):

| Estado | Única salida | De qué depende |
|---|---|---|
| `En Espera de Repuestos` | `llegada_repuestos` | Que el proveedor entregue |
| `Solicitado` | `entrega_repuestos` | Que almacén entregue la pieza |
| `Servicio externo` | `retorno_servicio_externo` | Que el laboratorio externo devuelva el sensor |
| `En espera de SKU inventario` | `notif_cliente_sku` | Que se cree el SKU en inventario |

El discriminador **SHALL** ir escrito, no sobreentendido: «el suceso del que depende la única salida
ocurre **fuera** de la aplicación» (`estados.ts:120-124`).

**La lección de método, que vale más que la lista:** «salida única» no es proxy de nada. Hay **doce**
estados con una sola salida, entre ellos `Ingresado` y `Ticket creado`, que son trabajo corriente; y
cruzarlo con `en_espera` da **seis**, con `Liberación Comercial` **y `Remisión creada`** dentro. Por
eso los cuatro se declaran y no se derivan (`estados.ts:132-136`). Las dos quedan fuera porque su
única salida **es un acto que se ejecuta en la aplicación**: `Liberación Comercial` por
`habilitado_para_entrega`, área Comercial (`estados.ts:126-130`); `Remisión creada` por
`habilitar_servicio`, área Comercial (`transitions.ts:178`) — la misma razón, un segundo caso que la
confirma.

(Previously: «cruzarlo con `en_espera` da **cinco**, con `Liberación Comercial` dentro»)

#### Scenario: la derivación mal hecha da seis, no cuatro, y las dos que sobran comparten razón
- GIVEN los doce estados con una sola transición de salida y los nueve estados `en_espera`
- WHEN se cruzan las dos listas
- THEN el resultado tiene seis elementos, y los dos que no son de `ESTADOS_SIN_SALIDA` son
  `Liberación Comercial` y `Remisión creada` — `packages/shared/src/estados.test.ts:176-185`, que hoy
  fija «cinco» y una única sobrante, se pone rojo y pasa a fijar «seis» y dos sobrantes con la misma
  derivación

### Requirement: 3.6 · IV-1 — la vista consumía el nombre del estado por regex · CERRADO en `vista-todos-y-estados-en-espera`

**Esta entrada ya no describe el comportamiento actual.** El requisito vive ahora en la capacidad
`vistas-tablero`, requisito RQ-VT-04; lo que queda aquí es el histórico del defecto y su cierre, con el
mismo patrón que §3.1 (C1).

**Qué era** (comportamiento a corregir, destino F1B-08 antes de esta tanda). `boardView.ts:35`
clasificaba las esperas con `/espera/i` sobre el nombre del estado, usado en `:43` y `:44`. El registro
declaraba ocho estados en espera (`estados.ts:59-114`); la regex casaba con exactamente **dos**:
`En Espera de Repuestos` y `En espera de SKU inventario`. Cero falsos positivos entre los 13 estados
restantes. Defecto **por defecto**, no por exceso.

**Cómo se cerró.** `boardView.ts:35` consume `enEsperaDe` de `packages/shared/src/estados.ts:158-162`
en vez de la regex. Cubierto por el tripwire real que importa `applyBoardView` y afirma sobre su salida
(`vistas-tablero` RQ-VT-04), verificado por mutación contra el tripwire falso que reimplementaba la
regex localmente (`estados.test.ts:113-121`, que se **retira**: sus imports nunca incluían `boardView`
y por tanto nunca podía ponerse rojo al arreglar el fichero que decía vigilar).

F0-04 dejó el registro que lo cierra (`ESTADOS_EN_ESPERA`, `estados.ts:111`); consumirlo era F1A y se
hizo en esta tanda.

(Previously: «destino REASIGNADO: F1B-08», sección clasificada como comportamiento actual a corregir)

#### Scenario: el registro reemplaza la regex, y el tripwire real lo demuestra
- GIVEN el registro `ESTADOS_EN_ESPERA`, existente desde F0-04
- WHEN `boardView.ts:35` consume `enEsperaDe` en vez de `/espera/i`
- THEN el tripwire de `vistas-tablero` RQ-VT-04 se mantiene verde tras el cambio, y el tripwire falso
  de `estados.test.ts:113-121` deja de existir

### Requirement: 3.7 · La vista y el reloj no leen la misma lista

**No es un defecto: es la regla, y si no queda escrita F1C-06 la pierde** (`estados.ts:26-33`). Tres
criterios distintos usan la palabra «espera» y **MUST** nombrarse distinto:

| Nombre | Criterio | Fuente | Alcance |
|---|---|---|---|
| `sin_salida` | Su única salida depende de algo que la aplicación no controla | M1.3.4 (`:1162`) | **4 estados** |
| `en_espera` | El ticket está parado esperando el acto de un tercero y el área dueña no puede hacer nada por su cuenta | Vista del tablero | **9 estados** |
| `bodegaje` | El tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente | M1.10 `[DEFINIDO — R08]` (`:1686`) | **3 periodos entre fechas**, no estados |

> **La vista muestra las nueve. El reloj del SLA NO lee esta clasificación** (`estados.ts:28`).

El reloj para en los tres bodegajes, que son periodos entre fechas. Un estado **MAY** estar
`en_espera` sin parar ningún reloj, y un bodegaje **MAY** transcurrir sin pasar por ningún estado de la
lista.

El único estado con SLA declarado es `Notificado`, clasificado `ninguna` (`estados.ts:79`): no es
ninguno de los nueve de la vista ni de los cuatro sin salida. Probado en
`packages/shared/src/sla.test.ts` — ver `RQ-TS-15`.

`Pendiente` **SHALL** quedar como `sin_clasificar`, que es valor válido y no un hueco. Lo decide
Servicio Técnico.

⚠️ **Riesgo abierto, no resuelto por esta tanda (R-1 de `vista-todos-y-estados-en-espera`).**
`packages/shared/src/sla.test.ts:50-54` afirma hoy que ningún estado con SLA está en
`ESTADOS_EN_ESPERA` — más fuerte que la regla escrita, que sólo exige independencia, no exclusión
mutua. Si una tanda futura declara SLA para `Remisión creada` (la otra mitad de P21,
`Decisiones_Gerencia_2026-09-10.md:331-337`), esa prueba se pone roja sin que nada esté mal. Queda
como pregunta Q3 para el orquestador; esta tanda no toca `sla.test.ts`.

(Previously: la tabla declaraba `en_espera` con **8 estados**, y el texto decía «la vista muestra las
ocho»)

#### Scenario: Remisión creada entra en la vista sin mover el reloj
- GIVEN que `Remisión creada` pasa a clase `interna` (P21) y por tanto entra en `ESTADOS_EN_ESPERA`
- WHEN se consulta `sla.ts` para ese estado
- THEN no tiene SLA declarado, y `packages/shared/src/sla.test.ts:50-54` sigue verde: la vista muestra
  un noveno estado en espera sin que el reloj se entere
