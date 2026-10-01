# Capacidad `gases-patron` — lista de gases patrón y compuesto de cada equipo

| Dato | Valor |
|---|---|
| Capacidad | `gases-patron` — **nueva**; el MISMO cambio la añade a `openspec/config.yaml → capabilities` (R-2 de `CLAUDE.md`; no lo hace esta fase) |
| Estado | nueva — primer contenido: F1A-03, cambio `verificacion-gas-patron-certificado` (`cierra: si`) |
| Decisión de Gerencia | `decision/f1a03-familia-y-gas-patron` (`openspec/config.yaml:2887-2902`): la lista es «una tabla en la base con compuesto, disponibilidad y fecha de vencimiento del certificado del cilindro; la mantiene el Director Técnico, al principio por alta directa» (`:2892`) |
| Maestro | M1.4 y Anexo D nº 38 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1520`) |
| La usa | `transitions-equipo-nuevo` RQ-EN-08 y RQ-EN-09 (guarda y motivo) · `hojas-vida` RQ-HV-13 a RQ-HV-15 (el compuesto del equipo) |

## 0 · Qué es esta capacidad

Dos datos que hoy no existen (`openspec/config.yaml:2895`): la **lista cerrada de compuestos** y su grafía canónica,
y la **tabla de gases patrón** con su predicado de vigencia. Esta spec dice **qué** es cierto de esos datos; la guarda
que los consume es de `transitions-equipo-nuevo`. La regla de método rige: ruta y línea para el código, línea del
`.md` para el maestro, «hipótesis» para lo demás.

## ADDED Requirements

### Requirement: RQ-GP-01 · Lista cerrada de compuestos y grafía canónica, una sola fuente en `packages/shared`

El sistema **SHALL** definir en `packages/shared` una lista cerrada de compuestos —`SO₂`, `NOₓ`, `CO`, `O₃`, `H₂S`,
`TRS`, `NH₃`— con una grafía canónica por compuesto, y una resolución que lleve toda grafía equivalente (mayúsculas o
minúsculas, espacios alrededor, y la forma sin subíndice: `SO2`, `NOx`, `O3`, `H2S`, `NH3`) a la canónica, o a «no
reconocido» si no pertenece a la lista. Esa única fuente **SHALL** ser la que consuman la guarda, el alta y la
corrección del equipo, y la siembra: no se reescribe en el cliente ni en el servidor (regla invariable 13, punto 1).
Dos grafías del mismo compuesto **MUST NOT** ser dos nociones distintas al comparar (molde H5 de `CLAUDE.md`: dos
implementaciones de la misma noción, ninguna rota por separado). Un compuesto nuevo **SHALL** exigir tocar la lista;
su disponibilidad no, porque sigue en la tabla (`config.yaml:2896`).

#### Scenario: Las grafías equivalentes resuelven al mismo compuesto
- GIVEN las entradas `SO2`, ` so₂ `, `SO₂`, `NOx`, `O3`, `H2S`, `NH3`
- WHEN se resuelven
- THEN dan `SO₂`, `SO₂`, `SO₂`, `NOₓ`, `O₃`, `H₂S` y `NH₃` respectivamente

#### Scenario: Lo que no pertenece a la lista no se reconoce
- GIVEN las entradas `metano`, `SO3`, cadena vacía y sólo espacios
- WHEN se resuelven
- THEN ninguna resuelve a un compuesto

#### Scenario: La lista es exactamente estos siete (mutación)
- GIVEN la lista cerrada
- WHEN se enumera
- THEN son exactamente `SO₂`, `NOₓ`, `CO`, `O₃`, `H₂S`, `TRS` y `NH₃`; añadir o quitar uno pone la prueba en rojo

#### Scenario: Comparar texto crudo en vez de canónico se detecta
- GIVEN un equipo con compuesto `SO₂` y una fila de `gases_patron` con compuesto `SO2`, disponible y vigente
- WHEN se evalúa si el equipo tiene patrón vigente
- THEN la fila cuenta (una guarda que compare las cadenas tal cual no la ve y pone esta prueba en rojo)

### Requirement: RQ-GP-02 · La tabla `public.gases_patron`: calificada, en `PUBLIC_TABLES`, idempotente, sin dato obligatorio vacío

El esquema **SHALL** crear `public.gases_patron` con `CREATE TABLE IF NOT EXISTS` **calificado** (`public.`), con al
menos: `compuesto`, `disponible` y `vence` —los tres no nulos— más la traza de alta (quién y cuándo). Varias
filas por compuesto **SHALL** ser posibles (varios cilindros). El nombre **SHALL** figurar en `PUBLIC_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:70-73`) para que el guardián de `migrate.test.ts` lo reconozca. Aplicar el
esquema dos veces **MUST NOT** fallar ni duplicar nada. Las sentencias nuevas **SHALL** ir **al final** de
`packages/zoho-sync/src/db/schema.sql` (hoy termina en `:622`), sin desplazar ninguna sentencia existente: lo
comprueba el barrido de la regla de mutación 4 al cerrar —`git diff` del fichero sin líneas borradas ni movidas—, no
una prueba automática.

#### Scenario: Tras migrar, la tabla existe en `public` y no en `desk`
- GIVEN una base vacía
- WHEN se aplica `migrate`
- THEN existe `public.gases_patron` y no existe `desk.gases_patron`

#### Scenario: Migrar dos veces es inocuo
- GIVEN la base ya migrada con una fila en `gases_patron`
- WHEN se aplica `migrate` otra vez
- THEN no falla y la fila sigue siendo una sola

#### Scenario: Una fila sin vencimiento, sin compuesto o sin disponibilidad no entra
- GIVEN la tabla migrada
- WHEN se inserta una fila sin `vence`, otra sin `compuesto` y otra con `disponible` nulo
- THEN las tres inserciones fallan

#### Scenario: Quitar la tabla de `PUBLIC_TABLES` pone rojo el guardián (mutación 2)
- GIVEN `gases_patron` creada en `schema.sql` y presente en `PUBLIC_TABLES`
- WHEN se borra `'gases_patron'` de la lista
- THEN el guardián de `migrate.test.ts` falla

#### Scenario: Un `CREATE TABLE` sin calificar en el fichero vigilado pone rojo el guardián (mutación 2)
- GIVEN `schema.sql` con `CREATE TABLE IF NOT EXISTS gases_patron` escrito sin `public.`
- WHEN corre `migrate.test.ts`
- THEN el guardián de esquema falla (se prueba ensuciando el `.sql`, no el guardián)

### Requirement: RQ-GP-03 · Vigencia: disponible y vencimiento no anterior a hoy en la zona de negocio

Un gas patrón **SHALL** contar como **vigente** si y sólo si `disponible` es verdadero y su `vence` es igual o
posterior a **hoy** en `America/Bogota` (`packages/shared/src/fechasDerivadas.ts:13`, `ZONA_NEGOCIO`; el día civil de
hoy en esa zona lo da `hoyEnZona`, `packages/shared/src/contratos.ts:61`). Un compuesto **SHALL** tener patrón
vigente si **alguna** de sus filas lo es: varios cilindros no se anulan entre sí. Una fila vencida, no disponible, o de
otro compuesto **MUST NOT** contar. Hipótesis a fijar en `design`: el predicado vive en `packages/shared` junto a la
lista, como una sola fuente.

#### Scenario: Vence hoy — cuenta
- GIVEN un gas de `SO₂`, disponible, con vencimiento igual a hoy en Bogotá
- WHEN se evalúa si `SO₂` tiene patrón vigente
- THEN sí

#### Scenario: Venció ayer — no cuenta
- GIVEN un gas de `SO₂`, disponible, con vencimiento de ayer en Bogotá
- WHEN se evalúa
- THEN no

#### Scenario: No disponible — no cuenta
- GIVEN un gas de `SO₂` con `disponible = false` y vencimiento futuro
- WHEN se evalúa
- THEN no

#### Scenario: El día es el de Bogotá, no el de UTC
- GIVEN el instante 2026-10-02T03:00:00Z (el 1 de octubre a las 22:00 en Bogotá) y un gas de `SO₂` disponible con vencimiento 2026-10-01
- WHEN se evalúa con ese instante
- THEN sí cuenta (comparar contra la fecha UTC del instante lo descartaría y pone la prueba en rojo)

#### Scenario: Varios cilindros del mismo compuesto — basta uno vigente
- GIVEN dos filas de `CO`: una vencida y otra disponible con vencimiento futuro
- WHEN se evalúa si `CO` tiene patrón vigente
- THEN sí

#### Scenario: El patrón de otro compuesto no cuenta
- GIVEN una única fila vigente, de `SO₂`
- WHEN se evalúa si `CO` tiene patrón vigente
- THEN no

### Requirement: RQ-GP-04 · La ausencia de patrón vigente es un resultado normal; la tabla vacía no es un error

Consultar si un compuesto tiene patrón vigente **SHALL** devolver «no» —no un error, no una excepción— cuando la tabla
está vacía, cuando todas las filas del compuesto están vencidas o no disponibles, y cuando no hay filas de ese
compuesto. La consulta **MUST NOT** escribir en la tabla. Por sí sola, la ausencia de patrón **MUST NOT** bloquear
nada: lo que el servidor hace con ella lo fija `transitions-equipo-nuevo` RQ-EN-09 (la liberación pasa y queda el
motivo).

#### Scenario: Tabla vacía — no, sin error
- GIVEN `public.gases_patron` sin ninguna fila
- WHEN se consulta si `SO₂` tiene patrón vigente
- THEN el resultado es «no» y no se lanza error

#### Scenario: Sólo filas vencidas o no disponibles — no
- GIVEN dos filas de `SO₂`, una vencida y otra no disponible
- WHEN se consulta
- THEN el resultado es «no»

#### Scenario: La consulta no escribe
- GIVEN la tabla vacía
- WHEN se consulta cualquier compuesto
- THEN la tabla sigue sin filas

### Requirement: RQ-GP-05 · Sin superficie de escritura en la aplicación; una fila fuera de lista no es vigente de nada

La aplicación **MUST NOT** exponer, en este cambio, ninguna pantalla ni endpoint para crear, editar o borrar gases
patrón: el Director Técnico los da de alta directamente en base (`openspec/config.yaml:2892`, «al principio por alta
directa»; supuesto s7). Como la base no valida la lista —el guardián de esquema vigila ficheros, no valores—, una fila
cuyo `compuesto` no resuelve a la lista cerrada **SHALL** no ser vigente para ningún compuesto.

#### Scenario: No hay endpoint de escritura
- GIVEN la aplicación arrancada con sesión de administrador
- WHEN se envía `POST`, `PATCH` y `DELETE` a una ruta de gases patrón (`/api/gases-patron`)
- THEN las tres responden `404`

#### Scenario: Una fila con compuesto fuera de lista no cuenta
- GIVEN una fila `XYZ`, disponible y con vencimiento futuro, insertada directamente en la tabla
- WHEN se consulta si cada uno de los siete compuestos tiene patrón vigente
- THEN para ninguno

### Requirement: RQ-GP-06 · Columnas `compuesto` en `equipos` y en `catalogo_modelos`, aditivas y al final del esquema

El esquema **SHALL** añadir una columna `compuesto` (texto, nula por defecto) a `equipos` y a `public.catalogo_modelos`,
con `ADD COLUMN IF NOT EXISTS`: la de `equipos` **sin calificar** —`equipos` está en `DESK_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:63-64`) y aterriza en `desk` por el `search_path`, como las demás `ALTER` de
esa tabla, p. ej. `schema.sql:354`— y la de `catalogo_modelos` **calificada** (`public.`; la tabla se crea en
`schema.sql:339-348`). Las sentencias van al final del fichero, sin desplazar las existentes. Aplicar el esquema sobre
datos existentes **MUST NOT** rellenar ni modificar ninguna fila: el relleno es de la siembra, tarea de persona. La
herencia del compuesto del modelo en el alta es de `hojas-vida` RQ-HV-14.

#### Scenario: Tras migrar, ambas columnas existen y las filas previas quedan nulas
- GIVEN una base con un equipo y un modelo ya existentes
- WHEN se aplica `migrate`
- THEN `equipos.compuesto` y `catalogo_modelos.compuesto` existen y valen nulo para esas filas

#### Scenario: Migrar dos veces es inocuo
- GIVEN la base ya migrada con un equipo cuyo compuesto es `CO`
- WHEN se aplica `migrate` otra vez
- THEN no falla y el compuesto sigue siendo `CO`

#### Scenario: Una `ALTER TABLE` sin calificar sobre `catalogo_modelos` pone rojo el guardián (mutación 2)
- GIVEN `schema.sql` con `ALTER TABLE catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text` escrita sin `public.`
- WHEN corre `migrate.test.ts`
- THEN el guardián de `ALTER TABLE` falla

#### Scenario: La `ALTER` de `equipos` sin calificar es la correcta
- GIVEN `schema.sql` con `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text`
- WHEN corre `migrate.test.ts`
- THEN el guardián pasa (calificarla con `public.` lo pondría en rojo, porque `equipos` es de `desk`)

## Notas fuera de bloques Requirement

- **Contadores fijados que cambian con este cambio** (medidos sobre `f5255d2`): `packages/zoho-sync/src/db/migrate.test.ts:283`
  fija `[DESK_TABLES.length, PUBLIC_TABLES.length, BOOKS_TABLES.length]` en `[10, 24, 3]` (pasa a 26 en `public`: `gases_patron` y `certificados_fabrica`, `design.md` §2; corrección C-6 de `tasks.md`) y
  `:376` fija el número de `ALTER TABLE` del esquema en 41 (pasan a 43 con las dos de RQ-GP-06). Añadir la tabla o las
  columnas sin actualizar esos números pone el guardián en rojo: es el efecto buscado, y la actualización forma parte
  del cambio. `:523` fija por índice una sentencia de `schema.sql` (`limpias[116]`): por eso las sentencias nuevas van
  al final y no desplazan ningún índice.

## Fuera de alcance de esta spec

- Pantalla o endpoint de mantenimiento de gases patrón (supuesto s7) y la edición del compuesto del modelo como
  pantalla → F1D-01.
- La guarda de Verificación, el motivo registrado y el certificado de fábrica → `transitions-equipo-nuevo`
  RQ-EN-08 a RQ-EN-12.
- Siembra de compuestos por modelo, de equipos existentes y de gases actuales en producción: tarea de persona
  (`openspec/config.yaml:2897`); el script lo prepara este cambio y lo ejecuta Alfonso. Qué compuesto mide cada
  serial del lote AP-370 de 2024 y qué cilindros hay lo entrega el Director Técnico.
