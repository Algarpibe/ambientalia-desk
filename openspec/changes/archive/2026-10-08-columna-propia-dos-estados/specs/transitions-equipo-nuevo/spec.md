## MODIFIED Requirements

### Requirement: RQ-EN-07 · `Verificación` clasifica `sin_clasificar`, con dos campos, y tiene columna propia en el tablero

`Verificación` **SHALL** registrarse en `CLASIFICACION_EN_ESPERA` (`estados.ts:59-106`) con clase
`sin_clasificar` — valor válido del tipo (`estados.ts:40`) — porque ninguna fuente da su clase real;
es supuesto reversible s7 de la propuesta.

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
