# Delta para transitions-st — salida de un ticket en `Remisión creada` sin remisión de entrada vigente (F1B-03, `cierra: no`)

Medido en el worktree del cambio, sobre `main` en `2a74fdc`. Numeración comprobada: 0 usos de RQ-TS-34 en `openspec/`
fuera de la propuesta de este cambio. El delta **no modifica** RQ-TS-02, RQ-TS-03 ni RQ-TS-33: el escenario de RQ-TS-33
sobre `Remisión creada` sin vigente sigue siendo cierto (la guarda sigue respondiendo `422`), y lo único que cambia es que
ese ticket deja de quedarse sin acción. Tampoco entra ninguna transición nueva: `TRANSITIONS`, las dos constantes sin
botón y las cifras ancladas no se tocan.

Marcas de los escenarios bajo `strict_tdd`: **ROJO** = nace rojo y es el rojo previo de la tanda; **CARACTERIZACIÓN** =
nace verde porque el código ya se comporta así, y fija lo que hoy nada fija.

## ADDED Requirements

### RQ-TS-34 · Desde cada origen de «Habilitar Servicio», un ticket sin remisión de entrada vigente tiene una acción que lo desbloquea

Para **cada** estado de `transitionById('habilitar_servicio').from` (hoy `OV asignada`, `Ticket creado` y
`Remisión creada`, `packages/shared/src/transitions.ts:178`), un ticket que no tenga una remisión de entrada vigente
(RQ-TS-33, RQ-RE-20) **SHALL** tener en la pantalla una acción que lo desbloquee: «Crear remisión». El predicado
compartido `puedeCrearRemisionDeEntrada` **SHALL** devolver `true` para cada uno de esos estados.

**Atado a los orígenes de la transición.** El conjunto de estados donde el predicado devuelve `true` **SHALL** ser un
**superconjunto** de `transitionById('habilitar_servicio').from`, recorrido desde el catálogo y no copiado a mano en la
prueba. Quitar cualquiera de esos tres estados del predicado, o añadir un cuarto origen a `habilitar_servicio` sin
tocar el predicado, **MUST** poner roja la prueba. Fuera de ese conjunto el predicado **SHALL** seguir devolviendo
`false` para el resto del blueprint; el predicado se mantiene como lista de lo PERMITIDO y no de lo prohibido.

**La guarda no cambia.** `exigirRemisionVigente` (RQ-TS-33) **SHALL** seguir respondiendo `422` en `habilitar_servicio`
sin una remisión de entrada vigente, desde los tres orígenes, con el mismo texto único; este requisito **MUST NOT**
introducir excepción alguna a ella ni un camino alternativo de habilitación.

**No hay transición nueva.** Ninguna transición se añade a `TRANSITIONS`, y `Remisión creada → Ticket creado` sigue sin
tener botón (RQ-TS-03): la salida del ticket atascado es **crear la remisión**, no volver de estado. Las cifras ancladas
y el mapa del blueprint **MUST NOT** cambiar.

**Regla invariable 13, decisión a decisión.**

- *Ofrecer «Crear remisión» en `Remisión creada`* (decisión del cliente, vía el predicado de `packages/shared`): la
  imposición del servidor es que el alta de remisión **acepta** el ticket en ese estado (RQ-RE-28, probado). El predicado
  es de `packages/shared` y el cliente lo consume sin reescribirlo.
- *Desactivar «Habilitar Servicio» sin vigente*: espejo de `exigirRemisionVigente`, con imposición probada (RQ-TS-33).
  Sin cambio.
- *No ofrecer «Crear remisión» fuera de los tres orígenes* (`false` del predicado): **el servidor no la impone**. Es un
  **hueco previo declarado** (H-1): el servidor no lee el estado del ticket en el alta (RQ-RE-28), así que el botón es la
  única guarda de «sólo se crea remisión en la fase inicial». **NO se corrige en este cambio**; queda como pregunta de
  Gerencia en la bandeja (E-184 en la propuesta; número a confirmar al escribirla). Es comportamiento actual sin decidir,
  no un requisito.

#### Scenario: El predicado admite cada origen de `habilitar_servicio` — ROJO
- GIVEN los estados de `transitionById('habilitar_servicio').from`, tomados del catálogo
- WHEN se evalúa `puedeCrearRemisionDeEntrada` sobre cada uno
- THEN devuelve `true` para los tres, y la prueba recorre el `from` del catálogo y no una lista escrita a mano (hoy falla para `Remisión creada`)

#### Scenario: El predicado sigue rechazando el resto del blueprint — CARACTERIZACIÓN
- GIVEN cada estado del blueprint que no está en el `from` de `habilitar_servicio` (incluido `Ingresado` y los posteriores)
- WHEN se evalúa `puedeCrearRemisionDeEntrada`
- THEN devuelve `false` en todos

#### Scenario: Quitar un origen del predicado pone roja la prueba (regla de mutación 2) — verificación por mutación
- GIVEN el fichero vigilado `packages/shared/src/transitions.ts` con el predicado ya admitiendo los tres orígenes
- WHEN se mutan tres veces, una por estado, quitando ese estado de la condición del predicado
- THEN la prueba del primer escenario se pone roja en cada una de las tres, y la mutación se anota en `apply-progress.md`

#### Scenario: Añadir un cuarto origen sin tocar el predicado pone roja la prueba — verificación por mutación
- GIVEN `habilitar_servicio` con un cuarto estado en su `from` y el predicado sin tocar
- WHEN corre la prueba del primer escenario
- THEN falla, porque el predicado no admite el estado nuevo

#### Scenario: Desde cada origen, sin vigente, hay una acción que desbloquea — ROJO para `Remisión creada`, CARACTERIZACIÓN para los otros dos
- GIVEN un ticket en cada uno de los tres orígenes, sin remisión de entrada vigente
- WHEN el cliente decide qué botón ofrecer (`botonRemision`, RQ-RE-28) y el usuario intenta `habilitar_servicio`
- THEN el servidor responde `422` con el texto único de RQ-TS-33 y el cliente ofrece «Crear remisión» en los tres (hoy no lo ofrece en `Remisión creada`)

#### Scenario: La guarda de RQ-TS-33 no cambia — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` sin remisión de entrada vigente
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` con el mismo texto, sin cambio de estado; las pruebas de la guarda, `invariantesGrafo`, `cifrasAncladas` y `mapaBlueprint` pasan **sin editarse**

#### Scenario: No se añade ninguna transición — CARACTERIZACIÓN
- GIVEN el catálogo `TRANSITIONS`, las dos constantes sin botón y las cifras ancladas
- WHEN termina el cambio
- THEN ninguno ha variado y no existe botón `Remisión creada` → `Ticket creado` (RQ-TS-03)

## Fuera de alcance — para el `archive-report`

- Una guarda de estado en el alta de remisión (enfoque a'): sumaría un punto a IV-12 y cambia alcance; pregunta aparte (H-1).
- Reconciliar tickets en producción y ejecutar recuentos; la transacción entre anulación y sincronización.
- Modificar `exigirRemisionVigente`, RQ-TS-02, RQ-TS-03 o RQ-TS-33.
