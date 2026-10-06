# Delta para permissions — responder y gestionar la reclamación al fabricante pide el mismo cargo que asociar la OVI (F1B-13, `cierra: no`)

Numeración comprobada contra `openspec/specs/permissions/spec.md`: el último requisito vivo es RQ-PM-25; el nuevo es
RQ-PM-26. El delta **no modifica** ningún requisito vivo: RQ-PM-20 y RQ-PM-24 **no quedan falsos**. RQ-PM-20 afirma que
`puedeCrearOVIGarantia` tiene llamadores (los de RQ-PM-24); ganar más llamadores no lo contradice. Supuestos S-1…S-12:
los de `proposal.md` §6, todos reversibles, aceptados. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

## ADDED Requirements

### RQ-PM-26 · Responder, editar y avanzar la ficha de garantía pide el cargo Director Técnico; leer, cualquier sesión

Responder «¿Se reclama al fabricante?», editar los datos de la ficha y avanzar su estado (`tickets-core` RQ-TC-44,
RQ-TC-46 y RQ-TC-47) **SHALL** exigir el cargo Director Técnico o ser administrador, el **mismo** predicado que asociar la
OVI (RQ-PM-24): `puedeCrearOVIGarantia` (`packages/shared/src/cargos.ts:71-74`) (SUPUESTO S-2, reversible). Servidor y
cliente lo consumen a través de un envoltorio con nombre propio en `packages/shared`, `puedeGestionarReclamacion`, que
sólo llama a `puedeCrearOVIGarantia`: así la lista de ficheros que contienen esa llamada (la fija
`packages/shared/src/cargos.test.ts`, prueba PM20-2) pasa a **dos**, ambos de `shared` (`ordenOVI.ts` y
`garantiaProveedor.ts`), y no crece con cada ruta. PM20-2 se edita en sitio con esa lista. El permiso **MUST NOT**
reescribirse: se consume el predicado de `packages/shared` (regla invariable 13) y **MUST NOT** escribirse por segunda
vez (molde H5). Como en RQ-PM-24, el acto **MUST NOT**
exigir un área: un Director Técnico sin el área Servicio Técnico pasa, y el administrador pasa sin tener cargo. Quien no
pasa recibe `403`, en el escalón **B** del orden total (existencia < estado y permiso < contenido < unicidad), detrás del
`404` de existencia y delante del estado y del contenido (guardas G2, G8 y G12 de `tickets-core`).

**Leer** las respuestas y fichas de un ticket no pide cargo ni área: cualquier usuario con sesión (SUPUESTO S-2), porque
leer no decide nada. El cliente consume el predicado para mostrar u ocultar las acciones; esa decisión es comodidad
legítima porque la imposición del servidor está probada (regla invariable 13, punto 3). Si el sujeto no llega al
predicado, se trata como «sin cargo» (falla cerrado, como en RQ-PM-24); y una petición sin sesión no llega a ninguna
guarda: las cuatro rutas dan `401`.

#### Scenario: Director Técnico sin área pasa en las tres rutas — ROJO
- GIVEN un usuario con cargo `Director Técnico` y sólo el área `Comercial`
- WHEN responde la pregunta, edita una ficha y avanza una ficha
- THEN ninguna de las tres rutas lo detiene por permiso

#### Scenario: administrador sin cargo pasa — ROJO
- GIVEN un administrador sin `cargo_permiso`
- WHEN responde, edita o avanza
- THEN el permiso no lo detiene

#### Scenario: sin cargo y sin ser administrador, en las tres rutas — ROJO
- GIVEN un usuario sin cargo, o con otro cargo (por ejemplo Director Comercial), que no es administrador
- WHEN responde la pregunta, edita una ficha y avanza una ficha
- THEN en las tres responde `403`

#### Scenario: leer no pide cargo — ROJO
- GIVEN un usuario sin cargo, sin área Servicio Técnico y que no es administrador, con sesión
- WHEN lee las respuestas y fichas de un ticket
- THEN recibe la lista, con éxito

#### Scenario: sujeto ausente falla cerrado — ROJO
- GIVEN una llamada a `puedeGestionarReclamacion` de `shared` sin sujeto
- WHEN se evalúa
- THEN devuelve `false`

#### Scenario: sin sesión, las cuatro rutas dan 401 — ROJO
- GIVEN una petición sin sesión
- WHEN llama a leer, responder, editar o avanzar
- THEN en las cuatro responde `401`, antes de cualquier guarda

#### Scenario: un solo predicado, sin segunda copia — CARACTERIZACIÓN
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan las comprobaciones de «Director Técnico» de las rutas de la ficha
- THEN todas pasan por `puedeGestionarReclamacion` de `shared`, que sólo llama a `puedeCrearOVIGarantia`, y ninguna reescribe el cargo
