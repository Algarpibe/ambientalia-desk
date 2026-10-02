# Delta para `derivacion-avisos` — 31 transiciones, 28 heredan (F1C-09)

## MODIFIED Requirements

### Requirement: RQ-AV-01 · Todas las etapas ofrecen la casilla, y ninguna la exige

La casilla `derivado_a` **SHALL** añadirse a las 31 transiciones **en un solo sitio** y **MUST NOT**
declararse una a una (`packages/shared/src/transitions.ts:288-291`). La razón está escrita en el código:
repetirla entrada por entrada garantizaría olvidarla en la siguiente que se añada.
(Previously: «las 34 transiciones».)

- **SHALL** ser `required: false` siempre: «derivar no puede frenar un ticket»
  (`packages/shared/src/transitions.ts:96-98`; el maestro lo dice igual en M1.9.2).
- **SHALL** ir la última del formulario «para no colarse entre los campos de negocio».
- Si alguna etapa dejara de ofrecerla, la salida **SHALL** ser un conjunto de excepciones en ese mismo
  punto, nunca volver a repetirla en cada entrada.
- La clave **SHALL** ser a la vez la clave en `values` y el **nombre de la columna**, y por eso va en
  `snake_case`: «no es un campo de Zoho, es nuestro» (`packages/shared/src/transitions.ts:90-92`).

#### Scenario: las 31 transiciones terminan en la casilla y ninguna la exige
- GIVEN `TRANSITIONS` tras retirar tres transiciones
- WHEN se inspeccionan los campos de cada una
- THEN las 31 terminan en `derivado_a` con `required: false`

#### Scenario: `diagnostico_complementario` conserva la casilla al cambiar de origen
- GIVEN `diagnostico_complementario` con `from: ['En Proceso']`
- WHEN se lee su último campo
- THEN es `derivado_a`, no obligatorio

### Requirement: RQ-AV-02 · Tres etapas proponen destinatario; las otras 28 heredan

`DERIVACION_POR_DEFECTO` **SHALL** llevar exactamente **tres** entradas
(`packages/shared/src/transitions.ts:267-276`), y proponer **SHALL** ser la excepción: en una lista de tres
líneas se ve de un vistazo cuáles pisan lo heredado.
(Previously: «las otras 31 heredan»; con 34 transiciones, 34 − 3 = 31.)

| Etapa | Propone | Por qué |
|---|---|---|
| `escalado_a_revision` | Cargo · `Director Técnico` | Escalar una revisión es subirla al inmediato superior |
| `escalado_a_comercial` | Cargo · `Coordinador Comercial` | Sale de Servicio Técnico y pasa a Comercial |
| `aprobacion` | `primerDerivado` | El cliente aprobó y el trabajo vuelve al taller |

**Recuento por comando:** `grep -cE "^  \{ id: '" transitions.ts` da **31** transiciones y el bloque declara
**3** entradas, así que las que heredan son **28** (31 − 3). El maestro vigente R08.4 dice 31 transiciones
(`R08.4.md:1250-1254`); el «treinta y una heredan» de M1.9.2 de la R08.1 queda histórico.

- Las dos primeras **SHALL** nombrar un **cargo y no una persona**: un id ataría el Blueprint a que esa
  persona siga en la empresa (`transitions.ts:45-46`; maestro M1.9.2).

#### Scenario: tres proponen, 28 heredan
- GIVEN `TRANSITIONS` y `DERIVACION_POR_DEFECTO`
- WHEN se cuentan las ids con entrada propia y las que no
- THEN hay 3 con propuesta y 28 sin ella, sobre 31 transiciones

#### Scenario: las tres retiradas no tenían propuesta de derivación
- GIVEN `DERIVACION_POR_DEFECTO`
- WHEN se buscan `marcar_pendiente`, `servicio_externo_pendiente` y `servicio_externo_notificado`
- THEN ninguna figura, y las tres entradas siguen siendo `escalado_a_revision`, `escalado_a_comercial` y `aprobacion`

#### Scenario: el comentario de recuento del código dice la cifra nueva
- GIVEN el bloque de comentario sobre la herencia en `transitions.ts`
- WHEN se lee su recuento de transiciones que heredan
- THEN dice 28, coherente con las 31 transiciones y las tres propuestas, y ningún comentario del fichero conserva la cuenta antigua

## REMOVED Requirements

Ninguno. La nota §4.2 de esta spec (comentario con la cuenta «32») queda histórica: su recuento por comando
se actualiza por el de `RQ-AV-02` y no se reescribe (caso B de la regla de mutación 4).
