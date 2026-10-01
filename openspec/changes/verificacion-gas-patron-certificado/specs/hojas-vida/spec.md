# Delta for `hojas-vida`

Cambio `verificacion-gas-patron-certificado` (F1A-03, `cierra: si`). El equipo gana un atributo, el **compuesto** que
mide, que se hereda del modelo al darlo de alta y se corrige a mano
(`decision/f1a03-familia-y-gas-patron`, `openspec/config.yaml:2892`: «El compuesto medido vive en cada equipo (hoja de
vida) y se hereda del modelo al darlo de alta»). Es el dato que la guarda de `transitions-equipo-nuevo` RQ-EN-08 lee.

Numeración: el último requisito vivo es RQ-HV-12 (`openspec/specs/hojas-vida/spec.md:289`); aquí se añaden RQ-HV-13 a
RQ-HV-15. Todos son **ADDED**: ningún requisito vivo cambia de contenido —RQ-HV-01 a RQ-HV-12 hablan de los seis
campos comerciales, y el compuesto es un séptimo atributo con su propio contrato—. Se comprobó con grep que ningún
requisito vivo menciona `compuesto`.

## ADDED Requirements

### Requirement: RQ-HV-13 · El equipo guarda un `compuesto` opcional, de la lista cerrada, en grafía canónica; el alta nunca lo toma del cuerpo

El sistema **SHALL** guardar por equipo un `compuesto` opcional (nulo por defecto). Sólo hay dos maneras de que se
escriba por la aplicación: la herencia del modelo al dar de alta (RQ-HV-14) y la corrección por `PATCH /api/equipos/:id`
de un administrador (RQ-HV-15, `apps/desk/server/routes/equipos.ts:73-119`); en las dos se resuelve contra la lista
cerrada de `gases-patron` RQ-GP-01 y se guarda en su **forma canónica**. Las dos vías de alta —`POST /api/equipos`
(`routes/equipos.ts:48-71`) y el equipo provisional dentro de `POST /api/tickets` con `clasificaciones = 'Equipo nuevo'`
(`apps/desk/server/services/equipoNuevo.ts:80-99`)— **MUST NOT** leer `compuesto` del cuerpo: lo ignoran, sin error
(`design.md` D-7: un compuesto tecleado al alta es la vía corta para esquivar la guarda de `transitions-equipo-nuevo`
RQ-EN-08). El campo **MUST NOT** ser obligatorio en ninguna vía: el alta sigue exigiendo sólo `serial`, `clientId` y
`modeloId` (RQ-HV-01), y un equipo sin compuesto sigue operando igual que hoy. La respuesta del equipo y su hoja de vida
**SHALL** devolver el compuesto.

#### Scenario: Alta sin compuesto en el cuerpo ni en el modelo — queda nulo
- GIVEN un modelo del catálogo sin compuesto
- WHEN se envía `POST /api/equipos` con `serial`, `modeloId` y `clientId`
- THEN responde `201` y el equipo tiene `compuesto` nulo

#### Scenario: El alta directa ignora un compuesto del cuerpo
- GIVEN un modelo sin compuesto y un cuerpo de alta cuyo `compuesto` es `'H₂S'`
- WHEN se envía `POST /api/equipos`
- THEN responde `201` y el equipo tiene `compuesto` nulo

#### Scenario: El alta desde el ticket ignora `equipoNuevo.compuesto`
- GIVEN `clasificaciones = 'Equipo nuevo'`, sin `equipoId`, un modelo sin compuesto y `equipoNuevo.compuesto = 'metano'`
- WHEN se envía `POST /api/tickets`
- THEN responde `201` (no `422`) y el equipo provisional tiene `compuesto` nulo

#### Scenario: La respuesta devuelve el compuesto
- GIVEN un equipo con compuesto `CO`
- WHEN se pide `GET /api/equipos/:id/historial` o la ficha completa del equipo
- THEN la respuesta incluye `compuesto = 'CO'`

### Requirement: RQ-HV-14 · Al dar de alta un equipo hereda el compuesto de su modelo y el alta no acepta otro; no se re-hereda después

Cuando el modelo del catálogo **tiene** compuesto por defecto, el equipo **SHALL** nacer con el compuesto del modelo.
Esto vale para las DOS vías de alta que existen hoy: `POST /api/equipos` (`routes/equipos.ts:63`, `createEquipo`,
`apps/desk/server/db/equipos.ts:119-131`) y la creación del equipo provisional dentro del ticket (`equipoNuevo.ts:88`).
El cuerpo del alta **MUST NOT** prevalecer sobre el del modelo (RQ-HV-13): el AP-370 configurado para H₂S, TRS o NH₃
(`config.yaml:2892`) se corrige después, por la siembra (excepciones del lote de 2024) o por el `PATCH` de un
administrador (RQ-HV-15). `createEquipo` sólo admite un compuesto explícito de un llamador del servidor
(`design.md` §5), nunca de un cuerpo HTTP. La herencia es una **copia en el
momento del alta** (supuesto s9): cambiar después el compuesto del modelo, o el modelo del equipo, **MUST NOT**
reescribir el del equipo. Un equipo sin `modelo_id`, o cuyo modelo no tiene compuesto, nace sin compuesto. La
columna del modelo existe y la rellena la siembra; no hay en este cambio pantalla ni endpoint que la edite
(F1D-01). El alta de un equipo **ya registrado por serial** (reutilizado, `equipoNuevo.ts:46-47`) **MUST NOT** tocar
su compuesto.

#### Scenario: Alta directa hereda el compuesto del modelo
- GIVEN un modelo con compuesto `CO` y un cuerpo de alta sin `compuesto`
- WHEN se envía `POST /api/equipos`
- THEN responde `201` y el equipo guarda `CO`

#### Scenario: Un compuesto del cuerpo no gana al del modelo
- GIVEN un modelo con compuesto `SO₂` y un cuerpo de alta con `compuesto = 'H₂S'`
- WHEN se envía `POST /api/equipos`
- THEN el equipo guarda `SO₂`

#### Scenario: El alta desde el ticket hereda igual
- GIVEN un modelo con compuesto `NOₓ`, `clasificaciones = 'Equipo nuevo'`, sin `equipoId` y sin `equipoNuevo.compuesto`
- WHEN se crea el ticket
- THEN el equipo provisional creado en la misma transacción guarda `NOₓ`

#### Scenario: Modelo sin compuesto o equipo sin modelo — nulo
- GIVEN un alta con un modelo sin compuesto
- WHEN se crea el equipo
- THEN `compuesto` es nulo, sin error

#### Scenario: Cambiar el compuesto del modelo no reescribe equipos existentes
- GIVEN un equipo creado con el compuesto heredado `CO` y un modelo cuyo compuesto pasa después a `O₃`
- WHEN se lee el equipo
- THEN sigue con `CO`

#### Scenario: Cambiar el modelo del equipo con PATCH no re-hereda
- GIVEN un equipo con compuesto `CO` y un `PATCH` que sólo cambia `modeloId` a un modelo con compuesto `O₃`
- WHEN responde `200`
- THEN el compuesto del equipo sigue siendo `CO`

#### Scenario: Reutilizar un equipo existente no toca su compuesto
- GIVEN un equipo registrado con compuesto `H₂S` y un alta de ticket `Equipo nuevo` con ese serial y un modelo de compuesto `SO₂`
- WHEN se crea el ticket
- THEN el equipo sigue con `H₂S` y no se crea otro

### Requirement: RQ-HV-15 · El compuesto lo corrige sólo un administrador por `PATCH`, con lista blanca y sin entrar en el registro de los seis campos

`PATCH /api/equipos/:id` **SHALL** aceptar `compuesto` siguiendo el patrón de campos opcionales ya construido
(`routes/equipos.ts:79-96`, `updateEquipo` en `db/equipos.ts:133-151`): la clave **ausente** no toca el campo; la clave
presente y **vacía o nula** lo deja en nulo; la presente con un valor lo valida contra la lista cerrada (RQ-HV-13) y
lo guarda canónico. **Sólo un administrador puede mandar la clave** (corrección C-1 de `tasks.md`; `design.md` D-8,
supuesto reversible d-1): el compuesto gobierna una guarda de calidad (`transitions-equipo-nuevo` RQ-EN-08) y vaciarlo la
desactiva, así que una sesión que no es administrador —tenga o no el área Comercial o un cargo— recibe `403`
(escalón B) y no se escribe nada del cuerpo; un cargo propio sería una cuarta excepción que no está dada
(`decision/c10-permisos-cargo`). Un valor fuera de lista **SHALL** responder `422` (escalón C) sin escribir nada del
cuerpo, ni los otros campos que vinieran; el `403` gana al `422` cuando compiten. El compuesto **no** es uno de los
tres campos restringidos de RQ-HV-09 (su restricción es propia y más estricta), y su cambio **no** genera fila en el
registro de RQ-HV-10, que sigue siendo de los seis campos comerciales: queda sin traza y es punto abierto para
F1B-02, que es quien edita el compuesto desde la ficha (fuera de alcance aquí).

#### Scenario: Un administrador corrige el compuesto y se escribe sólo ese campo
- GIVEN un equipo con compuesto `SO₂` y una sesión de administrador
- WHEN se envía un `PATCH` con sólo `compuesto = 'H₂S'`
- THEN responde `200`, el equipo guarda `H₂S` y el resto de campos no cambia

#### Scenario: Una grafía equivalente se guarda en forma canónica
- GIVEN un equipo y una sesión de administrador
- WHEN se envía un `PATCH` con `compuesto = 'so2'`
- THEN responde `200` y el equipo guarda `SO₂`

#### Scenario: Fuera de la lista — 422 y nada escrito
- GIVEN un equipo con compuesto `SO₂` y una sesión de administrador
- WHEN se envía un `PATCH` con `compuesto = 'xyz'` y además un `codigoInterno` nuevo
- THEN responde `422` y ni el compuesto ni el código interno quedan escritos

#### Scenario: La clave ausente no toca el compuesto; vacía lo limpia
- GIVEN un equipo con compuesto `CO` y una sesión de administrador
- WHEN un `PATCH` sin la clave `compuesto` cambia `codigoInterno`, y otro `PATCH` manda `compuesto = ''`
- THEN tras el primero sigue `CO`, y tras el segundo es nulo

#### Scenario: Quien no es administrador no corrige el compuesto — 403 y nada escrito
- GIVEN una sesión que no es administrador, con el área Comercial y con el área Servicio Técnico en dos casos
- WHEN envía un `PATCH` con `compuesto` de la lista (y además un `codigoInterno` nuevo)
- THEN responde `403` en los dos casos y ni el compuesto ni el código interno quedan escritos (quitar el `403` o dejar pasar al Director Técnico pone esta prueba en rojo)

#### Scenario: Posición — el 403 gana al 422 de la lista blanca
- GIVEN una sesión que no es administrador
- WHEN envía un `PATCH` con `compuesto = 'xyz'`
- THEN responde `403`, no `422` (poner el `422` delante del `403` pone esta prueba en rojo, regla de mutación 1)

#### Scenario: Un `PATCH` sin la clave `compuesto` no se ve afectado por la restricción
- GIVEN una sesión de Servicio Técnico que no es administrador y un equipo con compuesto `CO`
- WHEN envía un `PATCH` que sólo cambia `codigoInterno`
- THEN responde `200` y el compuesto sigue siendo `CO`

#### Scenario: Cambiar el compuesto no genera fila de registro
- GIVEN un equipo, el registro de cambios de RQ-HV-10 vacío y una sesión de administrador
- WHEN se corrige sólo el compuesto
- THEN no se inserta ninguna fila de registro

## Notas fuera de bloques Requirement

- Procedencia: el compuesto va en el equipo por `decision/f1a03-familia-y-gas-patron` (`openspec/config.yaml:2887-2902`);
  la edición del compuesto desde la ficha de la hoja de vida y el compuesto del catálogo de modelos como pantalla son de
  F1B-02 y F1D-01 (`config.yaml:2902`).
- Correcciones del orquestador en la fase `tasks` (2026-10-01), que prevalecen sobre el texto previo: **C-1** RQ-HV-15
  pasa de «cualquier sesión» a «sólo administrador» (el diseño manda); **C-5** RQ-HV-13 y RQ-HV-14 dejan de aceptar un
  compuesto del cuerpo del alta, porque `design.md` D-7 lo rechaza por ser la vía corta para esquivar la guarda.
- Los requisitos RQ-HV-13 a RQ-HV-15 no cambian la sección «Fuera de alcance de esta spec» de la spec viva
  (`openspec/specs/hojas-vida/spec.md:313-326`): ninguna de sus viñetas queda contradicha.

## Fuera de alcance de este delta

- Edición del compuesto desde la ficha y su registro de cambios → F1B-02.
- Pantalla del catálogo de modelos con compuesto → F1D-01.
- Relleno del compuesto de los equipos ya existentes: lo hace el script de siembra, tarea de persona
  (`openspec/config.yaml:2897`), no el esquema.
