# Delta for zoho-sync

## ADDED Requirements

### Requirement: El guardián de `ALTER TABLE` distingue intención por esquema, no sólo por nombre pelado

`contacts` es la única tabla cuyo nombre pelado existe en más de una lista calificada
(`DESK_TABLES` y `BOOKS_TABLES`, `db/migrate.ts:63-64`, `:80`). El sub-test que fija qué `ALTER TABLE`
pueden ir sin calificar (`altersDelEsquema()`, `packages/zoho-sync/src/db/migrate.test.ts:337-343`)
filtra hoy por el nombre pelado (`a.tabla`), así que una `ALTER TABLE contacts` sin calificar cuya
intención sea `books.contacts` pasa como si fuera de `desk.contacts`.

El guardián **MUST NOT** clasificar en silencio como tabla de Desk ninguna `ALTER TABLE` sin
calificar cuyo nombre pelado colisione entre esquemas. **SHALL** señalarlas todas para que su esquema
se decida a mano.

**Se clasifica por NOMBRE ambiguo, no por contenido de columnas, y es deliberado.** Una redacción
anterior de este requisito exigía distinguir por «las columnas que añade o modifica». Se descarta:
las columnas no discriminan. `packages/zoho-sync/src/db/schema.sql:11` muestra que la tabla
`contacts` de **Desk** ya declara `raw jsonb`, la misma columna que tiene `books.contacts`
(`:149-152`), así que un clasificador por contenido daría falsos negativos sobre el caso más obvio.
El nombre sí discrimina: `contacts` es el único que aparece en dos listas
(`packages/zoho-sync/src/db/migrate.ts:63-64`, `:80`).

Consecuencia aceptada: el censo señala **también** la `ALTER` legítima de Desk
(`schema.sql:256`, `modified_time`). Eso no es un falso positivo, es el diseño: la cifra del censo es
el disparador que obliga a decidir el esquema de cualquier `ALTER` ambigua nueva antes de dejarla
pasar, en vez de subir un contador global sin pensar.

**No hay bug vivo, y esta spec no lo declara como tal.** `packages/zoho-sync/src/db/pool.ts:5` fija
`search_path=desk,public`, y `books` nunca entra en él: cualquier `ALTER` sin calificar aterriza
siempre en `desk.contacts`, nunca en `books.contacts`. Esto es blindaje de intención sobre el
guardián de pruebas, no la corrección de un defecto de producción.

#### Scenario: Una `ALTER TABLE contacts` sin calificar con intención de Books queda detectada
- GIVEN una `ALTER TABLE contacts` sin calificar en `schema.sql` cuyas columnas sólo existen en la
  definición de `books.contacts` (`booksHub/schema-books.sql`), no en `desk.contacts`
- WHEN corre el guardián de esquema
- THEN la prueba falla, señalando que esa `ALTER` no puede clasificarse como tabla de Desk

#### Scenario: Una `ALTER TABLE contacts` de Desk sigue pasando
- GIVEN una `ALTER TABLE contacts` sin calificar cuyas columnas pertenecen a `desk.contacts`
- WHEN corre el guardián de esquema
- THEN la prueba sigue en verde, igual que hoy
