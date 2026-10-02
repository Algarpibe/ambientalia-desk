# Delta para hojas-vida — equipo manual y validación (F1B-15)

## ADDED Requirements

### Requirement: RQ-HV-16 · Alta manual del equipo en cualquier clasificación: serial doble comparado en el servidor

El alta del ticket **SHALL** admitir un equipo manual en **cualquier** clasificación, con serial, confirmación del
serial, marca, modelo del catálogo **o** «modelo no catalogado» con texto, tipo y **motivo escrito obligatorio**. El
servidor **SHALL** comparar el serial con su confirmación (recortados) y responder `422` si no coinciden, sin escribir
nada (escalón C). Si el serial ya existe en `equipos`, el servidor **SHALL** reutilizar ese equipo y **MUST NOT** crear
otro (como `equipoNuevo.ts:46-47`). El equipo creado nace con la marca «pendiente de validar», autor, fecha y motivo.
Con «no catalogado», el texto **SHALL** ser obligatorio y conservarse tal cual.

#### Scenario: Serial que no coincide
- GIVEN un alta manual con serial `ABC123` y confirmación `ABC124`
- WHEN se envía el alta
- THEN responde `422` y no se crea ticket, equipo ni cliente

#### Scenario: Serial existente
- GIVEN un serial ya registrado
- WHEN el alta manual lo envía dos veces iguales
- THEN el ticket queda ligado al equipo existente y `equipos` no gana ninguna fila

#### Scenario: Modelo no catalogado
- GIVEN un alta manual con «modelo no catalogado» y el texto `X-200 prototipo`
- WHEN se crea el equipo
- THEN el equipo guarda `X-200 prototipo`, nace pendiente de validar y lleva autor, fecha y motivo

#### Scenario: Modelo no catalogado sin texto
- GIVEN un alta manual con «no catalogado» y texto vacío
- WHEN se envía
- THEN responde `422` y no se escribe nada

### Requirement: RQ-HV-17 · El alta manual rechaza los tres campos reservados a Comercial

El alta manual **MUST NOT** aceptar `fechaFacturaCompra`, `finGarantia` ni `mantenedorId` (los tres restringidos de
RQ-HV-09): si el cuerpo trae cualquiera, el servidor **SHALL** responder `422` (escalón C) sin escribir nada. Esos
campos los completa después Comercial por el `PATCH` ya restringido (`routes/equipos.ts:73`). Esta es una tercera vía
de alta, distinta de las dos de RQ-HV-11, que no se modifican.

#### Scenario: Cada campo reservado se rechaza
- GIVEN un alta manual válida salvo que trae, una por una, fecha de factura, fin de garantía o mantenedor
- WHEN se envía
- THEN cada una responde `422` y no queda ninguna fila escrita

#### Scenario: Comercial tampoco los puede mandar en el alta manual
- GIVEN una sesión de Comercial y un alta manual con `finGarantia`
- WHEN se envía
- THEN responde `422`

#### Scenario: Después se completan por el PATCH
- GIVEN un equipo manual pendiente y una sesión de Comercial
- WHEN envía un `PATCH` con `finGarantia`
- THEN responde `200` y se genera su fila de registro (RQ-HV-10)

### Requirement: RQ-HV-18 · Validar el equipo: sólo Comercial o administrador, con traza

Un endpoint de validación **SHALL** quitar la marca «pendiente de validar» de un equipo. Sólo un usuario del área
Comercial o un administrador **SHALL** poder usarlo; otro recibe `403` sin escribir nada. Las respuestas siguen el orden:
`404` si el equipo no existe (A); `403` (B); `409` si el equipo no está pendiente (B). Validar **MUST NOT** exigir un
modelo del catálogo (supuesto Q4): un texto de «no catalogado» se conserva. La validación **SHALL** insertar una fila en
`equipos_cambios` (quién, cuándo, valor anterior «pendiente», valor nuevo «validado»). La hoja de vida **SHALL** mostrar
el aviso de pendiente mientras dure la marca y la acción de validar sólo a quien puede usarla.

#### Scenario: Validación correcta
- GIVEN un equipo pendiente y una sesión de Comercial
- WHEN valida
- THEN responde `200`, la marca desaparece y `equipos_cambios` gana una fila con autor y fecha

#### Scenario: Sin permiso
- GIVEN una sesión que no es de Comercial ni administradora
- WHEN valida
- THEN responde `403`, el equipo sigue pendiente y no se inserta traza

#### Scenario: Modelo no catalogado se valida sin catálogo
- GIVEN un equipo pendiente con «no catalogado» y su texto
- WHEN Comercial valida
- THEN responde `200` y el texto del modelo no cambia

#### Scenario: Equipo ya validado
- GIVEN un equipo sin marca de pendiente
- WHEN se valida
- THEN responde `409` sin insertar traza
