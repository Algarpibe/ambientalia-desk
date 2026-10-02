# Delta para zoho-sync — la vista `public.clients` incluye provisionales (F1B-15)

## ADDED Requirements

### RQ-ZS-16 · La tabla de clientes provisionales es de la App, con esquema calificado y en `PUBLIC_TABLES`

`public.clientes_provisionales` **SHALL** crearse con el esquema calificado, al final de `schema.sql`, y **SHALL**
figurar en `PUBLIC_TABLES` (`migrate.ts:70-73`). Las columnas nuevas de `equipos` **SHALL** añadirse por `ALTER TABLE`
**sin calificar**, porque `equipos` está en `DESK_TABLES`. Ninguna tabla de `books.*` se escribe desde la App y la
tabla provisional **MUST NOT** replicarse desde el hub (RQ-ZS-08).

#### Scenario: Guardianes de migración en verde
- GIVEN el `schema.sql` con la tabla nueva y las `ALTER` de `equipos`
- WHEN corre el guardián de `CREATE TABLE` y el de `ALTER TABLE` (RQ-ZS-13)
- THEN pasan, y `clientes_provisionales` figura en `PUBLIC_TABLES`

#### Scenario: Una `CREATE` sin calificar se rechaza
- GIVEN el `.sql` ensuciado con `CREATE TABLE clientes_provisionales`
- WHEN corre el guardián
- THEN se pone rojo

## MODIFIED Requirements

### RQ-ZS-09 · Las tablas «lite» de Books son hoy vistas, no tablas

`public.clients` y `public.sales_orders` **SHALL** ser **vistas** sobre `books.contacts` y
`books.sales_orders` (`packages/zoho-sync/src/db/schema.sql:169-182`), para que la App las lea sin cambiar sus consultas.
`public.clients` **SHALL** además incluir, con `UNION ALL`, las filas de `public.clientes_provisionales`, con las
mismas columnas y en el mismo orden que antes y **una columna nueva `provisional` al final** (`false` para Books,
`true` para provisionales). (Previously: la vista `clients` leía sólo `books.contacts`.)

- Una columna nueva **SHALL** añadirse **al final** de la lista, porque `CREATE OR REPLACE VIEW` sólo
  admite eso (`schema.sql:168` y `:175`).
- El `DROP` de las tablas lite originales **SHALL** ser una operación única del runbook de cutover y
  **MUST NOT** vivir en `schema.sql` (`:167`).
- Un id de Books **SHALL** resolverse con `getClient` exactamente igual que antes, con `provisional = false`.
- Un provisional **SHALL** dejar de figurar como provisional al enlazarse (RQ-TC-32), y sus tickets se resuelven
  por el contacto de Books.

#### Scenario: Las columnas previas no cambian
- GIVEN la vista nueva
- WHEN se comparan sus primeras columnas con las de la definición anterior
- THEN nombres, tipos y orden coinciden, y `provisional` es la última

#### Scenario: Un id de Books se resuelve igual
- GIVEN un contacto de Books existente
- WHEN se llama a `getClient` con su id
- THEN devuelve los mismos valores que antes del cambio y `provisional` es `false`

#### Scenario: Un provisional aparece en la vista
- GIVEN una fila en `clientes_provisionales`
- WHEN se consulta `public.clients` por su id
- THEN devuelve la razón social y `provisional = true`, y el listado de tickets (`LEFT JOIN clients`) muestra su nombre

#### Scenario: Una columna nueva no va en medio
- GIVEN la definición de la vista con `provisional` insertada antes de la última columna previa
- WHEN se aplica `CREATE OR REPLACE VIEW`
- THEN falla, por lo que la columna se exige al final
