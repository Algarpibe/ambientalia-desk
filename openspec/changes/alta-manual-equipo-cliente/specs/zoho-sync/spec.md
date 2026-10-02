# Delta para zoho-sync — la tabla de clientes provisionales, sin tocar la vista `public.clients` (F1B-15)

## ADDED Requirements

### RQ-ZS-16 · La tabla de clientes provisionales es de la App, con esquema calificado y en `PUBLIC_TABLES`

`public.clientes_provisionales` **SHALL** crearse con el esquema calificado, al final de `schema.sql`, y **SHALL**
figurar en `PUBLIC_TABLES` (`migrate.ts:70-73`). Las columnas nuevas de `equipos` **SHALL** añadirse por `ALTER TABLE`
**sin calificar**, porque `equipos` está en `DESK_TABLES`. Ninguna tabla de `books.*` se escribe desde la App y la
tabla provisional **MUST NOT** replicarse desde el hub (RQ-ZS-08). La vista `public.clients` **MUST NOT** cambiar en
este cambio (ni su definición ni sus columnas: no existe columna `provisional` en la vista), y
`packages/zoho-sync/src/books/repo.ts` y el worker del hub **MUST NOT** modificarse: los provisionales se resuelven en
la capa de servicio de `apps/desk/server` (RQ-TC-34), por decisión de Gerencia del 02/10
(`decision/f1b15-clientes-provisionales-sin-tocar-la-vista`).

#### Scenario: Guardianes de migración en verde
- GIVEN el `schema.sql` con la tabla nueva y las `ALTER` de `equipos`
- WHEN corre el guardián de `CREATE TABLE` y el de `ALTER TABLE` (RQ-ZS-13)
- THEN pasan, y `clientes_provisionales` figura en `PUBLIC_TABLES`

#### Scenario: Una `CREATE` sin calificar se rechaza
- GIVEN el `.sql` ensuciado con `CREATE TABLE clientes_provisionales`
- WHEN corre el guardián
- THEN se pone rojo

#### Scenario: La vista de clientes queda intacta
- GIVEN el `schema.sql` tras el cambio
- WHEN se compara la definición de `public.clients` con la anterior al cambio
- THEN es idéntica, no contiene `clientes_provisionales` ni columna `provisional`, y `books/repo.ts` no figura en el diff del cambio
