# Delta para reconciliacion

## MODIFIED Requirements

### Requirement: RQ-RC-04 · La comprobación 5 lee `packages/shared`, NUNCA la documentación

La comprobación 5 **SHALL** obtener la cifra del código leyendo `packages/shared` —`estados.ts` y
`transitions.ts`— y compararla contra `cifras_ancladas` (`openspec/config.yaml:1197` en `ce93480`).
**MUST NOT** derivar la cifra del código de ningún documento, incluido el propio `config.yaml`.

Cada entrada de `cifras_ancladas` **SHALL** declarar si divergir es un **error** o una **diferencia
legítima de criterio**, y el barrido **SHALL** reproducir esa clasificación sin reinterpretarla.

**Por qué está escrito como requisito y no como nota de diseño:** el 2026-09-17 un hallazgo del informe
de brechas salió **falso** por leer `config.yaml` en vez del código, y la propia entrada `esperas` lo
deja escrito. Leer el registro para comprobar el registro es el molde del fallo.

#### Scenario: la cifra sale del código
- GIVEN `ESTADOS_EN_ESPERA` con doce entradas en `packages/shared/src/estados.ts` (once hasta E-226, `RQ-RC-13`)
- WHEN corre la comprobación 5
- THEN reporta 12 frente a los 4 del maestro, leídos del código y no de `config.yaml`

#### Scenario: la divergencia legítima se reporta como tal
- GIVEN la entrada `esperas`, cuya clave `divergencia` la declara legítima
- WHEN corre la comprobación 5
- THEN el fichero la presenta como divergencia legítima y no como error, y el código de salida no cambia

## ADDED Requirements

### Requirement: RQ-RC-13 · El recuento de esperas del barrido coincide con `ESTADOS_EN_ESPERA`

La comprobación 5 lee `estados.ts` como TEXTO (`apps/desk/server/reconciliacion/comprobaciones.ts:154-165`) y cuenta
sólo las líneas `'X': 'externa'` o `'X': 'interna'` que van solas (`:162`); la vista cuenta con `ESTADOS_EN_ESPERA`. Son
dos implementaciones de la misma cifra (molde H5). El recuento del barrido sobre el `estados.ts` real **SHALL** coincidir
con `ESTADOS_EN_ESPERA.length`, y `apps/desk/server/reconciliacion/esperasContraRegistro.test.ts` lo enfrenta
(`espera-y-areas-equipo-nuevo`, E-226). `esperasDelCodigo` **SHALL** exportarse para esa prueba.

#### Scenario: el texto y el registro cuentan lo mismo
- GIVEN el `estados.ts` real
- WHEN se cuenta con `esperasDelCodigo` y con `ESTADOS_EN_ESPERA`
- THEN las dos cifras son iguales (12 desde E-226)

#### Scenario: un comentario detrás de una entrada `externa` se pone rojo (mutación)
- GIVEN `'Pendiente': 'externa', // …`
- WHEN corre `esperasContraRegistro.test.ts`
- THEN falla: el barrido cuenta once y el código doce
