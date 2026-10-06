# Progreso de aplicación — reasignacion-con-motivo (F1B-05)

## Lote 1 · dominio, esquema y datos

Commit de partida del intento: `821c348`. Worktree `C:\dev\Desk_2_R1.023-worktrees\reasignacion-con-motivo`. Modo: strict TDD, rojo visto antes de cada verde.

### Qué se hizo por tarea

- **1.2 / 1.3** `puedeReasignar` y `MENSAJES_REASIGNACION`: `packages/shared/src/reasignacion.ts:9-16` (los seis textos) y `packages/shared/src/reasignacion.ts:24-27` (el predicado, sobre `areasSiguientes` y `catalogoDelTicket`; sujeto ausente falla cerrado en `:25`).
- **1.4 / 1.5** `reasignacionDelCuerpo`: `packages/shared/src/reasignacion.ts:39-47`; el orden motivo, destino, igual al actual está en `:43-45`. Exportado con una línea nueva al final de `packages/shared/src/index.ts:38`.
- **1.6 / 1.7** Esquema: `CREATE TABLE IF NOT EXISTS public.reasignaciones` en `packages/zoho-sync/src/db/schema.sql:756` (CHECK nombrado en `:761`) e índice en `packages/zoho-sync/src/db/schema.sql:765`, ambos al final. `'reasignaciones'` añadido en sitio a `PUBLIC_TABLES`, `packages/zoho-sync/src/db/migrate.ts:73`. Recuentos movidos en sitio en `packages/zoho-sync/src/db/migrate.test.ts:282-286` (43 y 30) y `packages/zoho-sync/src/db/migrate.test.ts:652` (`+ 2` con su etiqueta); bloque nuevo al final desde `packages/zoho-sync/src/db/migrate.test.ts:785`.
- **1.8 / 1.9** Acceso a la traza: `apps/desk/server/db/reasignaciones.ts:15` (`ticketParaReasignar`), `:30-38` (`reasignar`, `UPDATE` condicionado más `INSERT` en `enTransaccion`), `:44` (`reasignacionesDelTicket`), `:50-52` (`usosEnReasignaciones`).
- **1.10 a 1.15** mutaciones: tabla de abajo.
- **1.17** medida: abajo. **1.1, 1.16 (detector de citas) y 1.18** quedan para el orquestador.

### Evidencia TDD (rojo → verde)

| Prueba | Rojo visto (razón) | Verde |
|---|---|---|
| `packages/shared/src/reasignacion.test.ts` bloque `puedeReasignar` + textos (9 pruebas) | `Failed to load url ./reasignacion`: el módulo no existía | 9 de 9 |
| mismo fichero, bloque `reasignacionDelCuerpo` (9 pruebas) | `reasignacionDelCuerpo is not a function` (9 fallos) | 18 de 18 |
| `migrate.test.ts`: recuentos (43, 30, `+2`) y 3 pruebas nuevas | 5 fallos: `expected [10, 29, 3] to deeply equal [10, 30, 3]`; `expected 157 to be 159`; tabla ausente en `information_schema`; la penúltima sentencia era un `CREATE UNIQUE INDEX`; el `INSERT` con motivo vacío no rechazaba | 54 de 54 |
| `apps/desk/server/db/reasignaciones.test.ts` (17 pruebas) | `Cannot find module './reasignaciones'` | 17 de 17 |

Pruebas nuevas: **38** (18 shared, 3 migrate, 17 datos), más 5 recuentos movidos en `migrate.test.ts`.

### Mutaciones (hechas una a una y restauradas; copia previa en un directorio temporal, verde confirmado al final)

| # | Mutación | Prueba que se puso roja | Mensaje |
|---|---|---|---|
| 1.10 | `CREATE TABLE IF NOT EXISTS reasignaciones` sin `public.` | guardián «toda tabla del esquema está clasificada…» y «el CREATE va calificado con public.…» | `expected [ 'reasignaciones' ] to deeply equal []`; `expected 'CREATE TABLE IF NOT EXISTS reasignaci…' to match /^CREATE TABLE IF NOT EXISTS public\.r…/` |
| 1.11 | quitar el `CHECK` del motivo | «el CHECK rechaza un motivo vacío con un INSERT directo…» | `promise resolved "{ rows: [], rowCount: 1 …}" instead of rejecting` |
| 1.12 | `puedeReasignar` siempre `true` | el barrido, «el barrido discrimina», «estado sin salida», «el cargo no abre la puerta», «sin áreas» | `servicio · OV asignada · Servicio Técnico: expected true to be false` |
| 1.13 | destino delante de motivo | «el motivo va antes que el destino», «…antes que cada falla del destino» y la de cuerpo no objeto (3 rojas) | `expected { ok: false, …(1) } to deeply equal { ok: false, …(1) }` |
| 1.14 | `INSERT` de la traza por `db` (fuera de la transacción) | «atómico: … BEGIN, UPDATE, INSERT, ROLLBACK» | `expected [ 'tx:BEGIN', 'tx:UPDATE', …(2) ] to deeply equal [ 'tx:BEGIN', 'tx:UPDATE', …(2) ]` |
| 1.15 | quitar `derivado_a = $3` y `IS NULL` del `UPDATE` | «dato viejo» (con `de` equivocado) y «dato viejo con `de: null`» | `expected true to be false // Object.is equality` |

Las seis cayeron en la prueba que el diseño §7 nombra; ninguna quedó sin detector.

### Comandos finales (código de salida mirado)

- `npm test`: 243 ficheros pasados, 2 saltados; 3.798 pruebas pasadas, 7 saltadas; salida **0**.
- `npm run typecheck`: salida **0**.
- `npm run lint`: salida **0**, 165 avisos, 0 errores (tope 165).
- Detector de citas (`cli.ts --sha HEAD`): no se corre aquí, es del orquestador.

### Cifras medidas (1.17)

`git diff --shortstat --no-renames 821c348`: 5 ficheros, 69 inserciones, 22 borrados (incluye `tasks.md`: 15 y 15). Sin trackear: `reasignacion.ts` 47, `reasignacion.test.ts` 133, `db/reasignaciones.ts` 53, `db/reasignaciones.test.ts` 157, este fichero. Código y pruebas sin `tasks.md` ni este informe: 54+7 trackeadas, 390 nuevas = **451**; con `tasks.md` (30) y este informe (56) suman **537**, por debajo de 720 (válvula no activada, el par `db/reasignaciones` se queda en el lote 1).

### Desviaciones del diseño

1. `reasignar` usa dos `UPDATE` (`IS NULL` y `= $3`, `apps/desk/server/db/reasignaciones.ts:32-34`) en vez de un solo texto con `$3` nulo: el diseño §3(c) lo permitía (DD-1 nombra las dos formas); evita depender de cómo pg-mem compara un parámetro nulo.
2. `usosEnReasignaciones` usa un solo `COUNT` con `de = $1 OR a = $1` (pg-mem admite el parámetro repetido, la hipótesis del diseño se confirma); una fila con la misma persona en origen y destino cuenta una vez.
3. `MENSAJES_REASIGNACION` se declara como objeto literal sin anotación de tipo (el diseño daba la forma del tipo); el tipo inferido es el mismo.
4. Texto añadido a la etiqueta de `migrate.test.ts:652` («y las dos de public.reasignaciones (F1B-05)») además de la suma, como pedía el diseño.
