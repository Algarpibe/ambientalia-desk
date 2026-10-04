# Delta para remisiones — el alta acepta el ticket atascado y el botón lo ofrece en `Remisión creada` (F1B-03, `cierra: no`)

Medido en el worktree del cambio, sobre `main` en `2a74fdc`. Numeración comprobada: 0 usos de RQ-RE-28 en `openspec/`
fuera de la propuesta de este cambio. El delta **no modifica** ningún requisito vivo (la propuesta nombra RQ-RE-06, RQ-RE-11 y RQ-RE-20 como intactos; sólo el
último se conoce por su delta archivado). Las citas se hacen por
nombre de función y no por número de línea en los ficheros que este cambio edita (`botonRemision.ts`, `transitions.ts`).

Marcas de los escenarios bajo `strict_tdd`: **ROJO** = nace rojo y es el rojo previo de la tanda; **CARACTERIZACIÓN** =
nace verde porque el código ya se comporta así, y fija lo que hoy nada fija.

## ADDED Requirements

### Requirement: RQ-RE-28 · El alta de remisión de entrada acepta los tres orígenes de «Habilitar Servicio», y el botón la ofrece en `Remisión creada`

**Servidor (imposición).** `POST /api/remisiones` **SHALL** crear la remisión de entrada y responder `201` para un ticket
en cada uno de los tres estados de origen de `habilitar_servicio` (`OV asignada`, `Ticket creado` y `Remisión creada`)
que no tenga una remisión de entrada vigente (RQ-RE-20), incluido el ticket en `Remisión creada` cuya única confirmada
es de `tipo` distinto de `entrada` (origen 3 del ticket atascado). Tras crearla, `habilitar_servicio` **SHALL** dejar de
responder `422` por falta de remisión y el ticket **SHALL** llegar a `Ingresado`. Esto se fija por prueba de servidor,
por HTTP, sin `INSERT` directo de la remisión que se crea.

**Hueco previo declarado, NO corregido.** El alta **no lee el estado del ticket**: acepta cualquier estado, no sólo los
tres orígenes. Que «sólo se crea remisión en la fase inicial» no tenga contrapartida en el servidor es el hueco H-1
(regla invariable 13, punto 2): el botón es hoy la única guarda de esa restricción y ya lo era antes de este cambio. Este
requisito **MUST NOT** añadir esa guarda ni afirmar que el servidor rechaza otros estados; que el alta responda `201`
fuera de los tres orígenes es comportamiento actual sin decidir, no un requisito, y la prueba de servidor **MUST NOT**
fijarlo en ningún sentido.

**Cliente (comodidad).** `botonRemision` **SHALL** consumir `puedeCrearRemisionDeEntrada` (RQ-TS-34) y, en
`Remisión creada`, **SHALL** comportarse así:

| Situación en `Remisión creada` | Resultado de `botonRemision` |
|---|---|
| Remisiones sin cargar (`null`) | no visible |
| Sin entrada vigente (lista vacía, sólo anuladas, o sólo de tipo distinto de entrada) | visible, «Crear remisión», sin `pendienteId` |
| Entrada vigente pendiente | visible, «Remisión pendiente de envío», con su `pendienteId` |
| Entrada vigente confirmada (`ok` u `ok_con_avisos`) | no visible |
| Entrada vigente sólo en `error` | visible, «Crear remisión» (la guarda ya pasa; es inocuo) |

**Protección de la carga.** En `Remisión creada`, con las remisiones sin cargar (`null`: mientras carga, o de forma
permanente si la primera carga falla), el botón **SHALL** quedar no visible. Sin ella, todo ticket sano en ese estado
enseñaría «Crear remisión» durante la carga. La protección **SHALL** ser **sólo de `Remisión creada`**: en `OV asignada`
y `Ticket creado`, con `null`, el botón **SHALL** seguir visible como hasta ahora.

**Regla invariable 13, decisión a decisión.**

- *Ofrecer «Crear remisión» en los tres orígenes*: la imposición del servidor es que el alta acepta (primer párrafo,
  probado); el predicado vive en `packages/shared` (RQ-TS-34).
- *No ofrecerlo en `Remisión creada` sin cargar*: **sin contrapartida en el servidor y no la necesita**. Es presentación
  pura: no impide nada, el servidor crearía igual.
- *No ofrecerlo con una confirmada vigente*: sin contrapartida en el servidor; era así antes de este cambio; presentación.
- *Reetiquetar con una pendiente*: imposición existente, el `409` de remisión pendiente del alta; sin cambio.
- *No ofrecerlo fuera de los tres orígenes*: sin contrapartida, hueco H-1 (arriba), no corregido.

**Qué no cambia.** El bloque de `botonRemision` que documenta el caso de la remisión pendiente y su salida no se toca. Los
comentarios que afirmaban que el botón no cabe en `Remisión creada` se reescriben **en sitio**, sin alterar el número de
líneas de los ficheros citados.

#### Scenario: Desde `OV asignada`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `OV asignada` sin remisión de entrada vigente, con el resto de requisitos de `habilitar_servicio` cumplidos
- WHEN Comercial ejecuta `habilitar_servicio` y responde `422` con el texto único de RQ-TS-33; luego se hace `POST /api/remisiones` para ese ticket; y se vuelve a ejecutar `habilitar_servicio`
- THEN el alta responde `201` y la segunda ejecución ya no responde `422` y el ticket llega a `Ingresado`

#### Scenario: Desde `Ticket creado`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `Ticket creado` sin remisión de entrada vigente, con el resto de requisitos cumplidos
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio` del escenario anterior
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: Desde `Remisión creada`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` sin remisión de entrada vigente (sembrado por la ruta de la prueba, sin pasar por la sincronización), con el resto de requisitos cumplidos
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio`
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: Origen 3 — `Remisión creada` con una confirmada de tipo distinto de entrada — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` cuya única remisión confirmada tiene `tipo` distinto de `entrada` (insertada a mano en la prueba; hoy ningún código escribe otro tipo)
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio`
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: La prueba de servidor no fija el comportamiento fuera de los tres orígenes — CARACTERIZACIÓN (límite)
- GIVEN la prueba de servidor de este requisito
- WHEN se lee su conjunto de casos
- THEN sólo cubre los tres orígenes y la variante del origen 3, y no contiene ninguna aserción de que el alta responde `201` (ni de que rechaza) en otros estados; ese hueco (H-1) queda documentado y sin corregir

#### Scenario: `Remisión creada` con lista vacía ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', [])`
- WHEN se evalúa
- THEN `visible` es `true`, `texto` es «Crear remisión» y `pendienteId` es `null`

#### Scenario: `Remisión creada` con sólo remisiones anuladas ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada anulada
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión» (una anulada no cuenta como vigente)

#### Scenario: `Remisión creada` con sólo una confirmada de otro tipo ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión confirmada de `tipo` distinto de `entrada`
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión» (la salida no depende de que no haya ninguna confirmada)

#### Scenario: `Remisión creada` con una entrada pendiente reetiqueta — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada vigente en `pendiente`
- WHEN se evalúa
- THEN `visible` es `true`, `texto` es «Remisión pendiente de envío» y `pendienteId` es el de esa remisión

#### Scenario: `Remisión creada` con una entrada confirmada no ofrece nada — CARACTERIZACIÓN
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada vigente en `ok` (y otra con `ok_con_avisos`)
- WHEN se evalúa
- THEN `visible` es `false` (el ticket sano no ve el botón)

#### Scenario: `Remisión creada` con una entrada vigente sólo en `error` ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` cuya única remisión de entrada vigente está en `error`
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión»

#### Scenario: Sin cargar, `Remisión creada` no muestra el botón — CARACTERIZACIÓN (protección; se vuelve significativa con el cambio)
- GIVEN `botonRemision('Remisión creada', null)`
- WHEN se evalúa
- THEN `visible` es `false`; nace verde porque hoy el predicado ya devuelve `false` en ese estado, y la mutación de retirar la condición de «sin cargar» **MUST** ponerla roja una vez el predicado admite `Remisión creada`

#### Scenario: Retirar la protección de la carga pone roja la prueba — verificación por mutación
- GIVEN el predicado ya admitiendo `Remisión creada` y la protección en `botonRemision`
- WHEN se retira la condición de «sin cargar» de `botonRemision`
- THEN la prueba del escenario anterior se pone roja

#### Scenario: Retirar `Remisión creada` del predicado pone rojas las filas visibles — verificación por mutación
- GIVEN la protección en `botonRemision` y el predicado admitiendo `Remisión creada`
- WHEN se retira `Remisión creada` del predicado
- THEN se ponen rojos los escenarios de lista vacía, anuladas, otro tipo, pendiente y `error`

#### Scenario: La protección es sólo de `Remisión creada` — CARACTERIZACIÓN
- GIVEN `botonRemision('OV asignada', null)` y `botonRemision('Ticket creado', null)`
- WHEN se evalúan
- THEN ambas devuelven `visible: true`, «Crear remisión»

#### Scenario: Fuera de los tres orígenes el botón sigue oculto — CARACTERIZACIÓN
- GIVEN `botonRemision('Ingresado', [])` y cualquier otro estado fuera del `from` de `habilitar_servicio`
- WHEN se evalúa
- THEN `visible` es `false`

#### Scenario: Los comentarios se reescriben sin desplazar líneas — verificación de cierre
- GIVEN `transitions.ts`, `botonRemision.ts` y `TransitionPanel.tsx` con sus comentarios reescritos en sitio
- WHEN se compara el número de líneas de `transitions.ts` y de `botonRemision.ts` con el de partida, y se barren las citas completas y abreviadas a esos dos ficheros
- THEN el número de líneas es el mismo y ninguna cita queda rota; el comentario de `TransitionPanel.tsx` (`.tsx`, fuera de la red de pruebas por F0-00) se comprueba por persona

## Fuera de alcance — para el `archive-report`

- Una guarda de estado en el alta (H-1), E-158 e IV-12; mover guardas de `POST /api/remisiones`.
- La transacción entre anulación y sincronización; reconciliar datos de producción.
- Modificar requisitos vivos de `remisiones`.
