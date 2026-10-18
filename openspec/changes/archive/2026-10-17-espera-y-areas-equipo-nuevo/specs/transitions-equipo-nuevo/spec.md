# Delta para transitions-equipo-nuevo

## MODIFIED Requirements

### Requirement: RQ-EN-02 · Área de las seis: Servicio Técnico, por decisión de Gerencia

Las seis transiciones **SHALL** ser de área `Servicio Técnico` (`decision/e226-espera-y-areas-equipo-nuevo`, 17/10): la
regla es Servicio Técnico salvo las de entrega o facturación al cliente, que son de Comercial, y ninguna de las seis lo es.
El docblock de `TRANSITIONS_EQUIPO_NUEVO` (`packages/shared/src/transitions.ts:347-348`) **SHALL** citar esa decisión.

`Liberación` **SHALL** ser de Servicio Técnico (supuesto S-2, lista semanal): es la liberación técnica tras el control, con
el certificado de fábrica (`transitions.ts:359-360`; M1.4, `R08.4.md:1698`), no una entrega ni una facturación. La analogía
con `liberacion_sin_factura` (`transitions.ts:246`), de Comercial porque depende de la factura, **SHALL NOT** aplicarse.

(Previously: área por equivalencia, supuesto s2, con la hipótesis de que `Liberación` fuera de Comercial. Ver `RQ-EN-13`.)

#### Scenario: Las seis transiciones exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial`
- WHEN intenta ejecutar cualquiera de las seis transiciones del catálogo de `Equipo nuevo`
- THEN el servidor responde `403`, incluidas `Liberación` desde `Verificación` y `Rechazo de
  verificación`

### Requirement: RQ-EN-07 · `Verificación` no es espera, con dos campos, y tiene columna propia en el tablero

`Verificación` **SHALL** registrarse en `CLASIFICACION_EN_ESPERA` (`estados.ts:59-106`) con clase `ninguna`
(`decision/e226-espera-y-areas-equipo-nuevo`: «Verificación: no es espera»): es trabajo propio de Servicio Técnico y el
tablero la enseña en «Abiertos». Hasta E-226 era `sin_clasificar` (supuesto s7).

- La transición `Verificación` **SHALL** declarar sólo dos campos: comentario y la casilla de
  derivación; ninguna fuente da otros.
- El tablero **SHALL** tener columna propia `verificacion` para `Verificación`, inmediatamente después
  de `proceso` (`columns.ts:20`); `Otros` sigue siendo la última columna y la red de seguridad
  (`columns.ts:34`, `FALLBACK_COLUMN_ID`, `:38`, `columnForStatus`, `:45-46`). Decisión:
  `decision/e225-columna-propia-dos-estados`. Ningún otro estado del registro cambia de columna.

#### Scenario: Un ticket en Verificación aparece en su columna propia
- GIVEN un ticket cuyo estado es `Verificación`
- WHEN se calcula su columna de tablero (`columnForStatus`)
- THEN devuelve `'verificacion'`, no `'otros'`

#### Scenario: Verificación no es espera
- GIVEN el registro `CLASIFICACION_EN_ESPERA`
- WHEN se consulta `Verificación`
- THEN devuelve `ninguna`, y no está en `ESTADOS_EN_ESPERA`

## ADDED Requirements

### Requirement: RQ-EN-13 · El área de las seis la vigila una prueba (E-226)

La aserción de área de `packages/shared/src/invariantesGrafo.test.ts:215` **SHALL** exigir `Servicio Técnico` en las seis
transiciones de `TRANSITIONS_EQUIPO_NUEVO` y nombrar E-226 en su mensaje. Ningún área cambia con E-226, así que ningún
permiso cambia: la matriz de `apps/desk/server/permisos.test.ts` sigue igual.

#### Scenario: Pasar `liberacion` a Comercial se pone rojo (mutación)
- GIVEN `liberacion` con `area: 'Comercial'`
- WHEN corre `invariantesGrafo.test.ts`
- THEN falla la aserción de área de las seis
