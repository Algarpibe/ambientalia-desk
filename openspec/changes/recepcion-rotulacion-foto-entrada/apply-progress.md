# apply-progress: recepcion-rotulacion-foto-entrada (F1B-04, `cierra: no`)

Modo: Strict TDD · auto · hybrid · una rama, un commit por lote. Partida del lote 1: `c873467`.

## Lote 1 — esquema, catálogo y lectura (hecho)

Línea base (antes de tocar): `npm test` 178 ficheros / 2.632 pruebas verdes (2 omitidas); `npm run typecheck` limpio; `npm run lint` 165 avisos, 0 errores. `registro.test.ts:220` no se puso rojo por la carpeta del cambio.

### Alineaciones (1.2)

- **C1**: decisión del orquestador, camelCase (`excluyeDemas`, `exigeTexto`) como el resto de la API. Corregida la delta de RQ-RE-22 (requisito y escenario; las columnas siguen en snake_case). El diseño §2.1-2.2 ya decía camelCase y no cambia. Sin `catalogoDeRespuesta` en L4 (ajustados 4.2 y 4.5).
- **Hueco M-F7** añadido a `design.md` §6.

### Evidencia TDD

| Casilla | Prueba | RED (salida literal, resumida) | GREEN |
|---|---|---|---|
| 1.3 | `migrate.test.ts` cifras en sitio | `expected [ 10, 27, 3 ] to deeply equal [ 10, 28, 3 ]`; `ALTER TABLE en schema.sql: expected 44 to be 50` | 140 verdes en `packages/zoho-sync/src/db` |
| 1.4 | `novedadesSiembra.test.ts` (6) | `relation "catalogo_novedades" does not exist` (siembra 1-4); `expected 0 to be greater than 0` (3); `expected [] to have a length of 10` (5); `remisiones.novedades existe: expected [] to have a length of 1` (6) | 6/6 |
| 1.5 | `recepcion.test.ts` (3) | `expected 404 to be 401`, `expected 404 to be 200` (ruta inexistente) | 3/3 |

Las tres nacen rojas; ninguna de caracterización. TRIANGULATE: la lectura se prueba con diez, con nueve (desactivada por SQL) y con marcas en los dos extremos.

**Efecto no previsto por el diseño.** Al añadir el bloque al final de `schema.sql` se puso rojo `migrate.test.ts` «las seis sentencias nuevas van DETRÁS de prioridad_ajustes…» (`expected 145 to be 128`), que fija cuántas sentencias hay tras `idx_prioridad_ajustes_ticket`. Se corrigió en sitio, en la misma línea (`ultima + 1 + 6 + 2 + 17`: un `CREATE`, diez `INSERT`, seis `ALTER`). Neto cero. Los lotes siguientes que añadan sentencias al final de `schema.sql` tendrán que volver a sumarse ahí.

### Hipótesis resueltas por ejecución

| # | Hipótesis | Resultado |
|---|---|---|
| 1 | pg-mem acepta `INSERT … VALUES (literales) ON CONFLICT (clave) DO NOTHING` | **Cierta**: siembra 1-4 verdes; no hizo falta la reserva `WHERE NOT EXISTS` |
| 2 | pg-mem acepta `ALTER TABLE public.… ADD COLUMN IF NOT EXISTS … jsonb` | **Cierta**: siembra 6 verde (las seis columnas en `information_schema.columns`) |
| 5 | ninguna ruta captura `/api/novedades-remision` antes | **Cierta**: de `404` (RED) a `200` con el registro nuevo, sin tocar el orden |

### Mutaciones (reproducidas, aplicadas, ejecutadas, revertidas; ficheros restaurados byte a byte)

| Id | Mutación | Pruebas rojas (mensaje) |
|---|---|---|
| M-F1 | quitar `public.` al `CREATE` | `migrate.test.ts` «toda tabla del esquema está clasificada»: `expected [ 'catalogo_novedades' ] to deeply equal []`. Las funcionales (siembra, ruta) siguen verdes: sólo la caza el guardián |
| M-F2 | quitar `public.` a la `ALTER` de `remision_fotos.categoria` | guardián «toda ALTER … clasificada» (`[ 'remision_fotos' ]`), «las ALTER sin calificar…», recuento (`expected 26 to be 27`) y siembra 6 |
| M-F7 | quitar `catalogo_novedades` de `PUBLIC_TABLES` | «toda tabla … clasificada» (`[ 'public.catalogo_novedades' ]`) y recuento (`expected [ 10, 27, 3 ] to deeply equal [ 10, 28, 3 ]`) |
| M-F5 | `UPDATE public.remisiones SET novedades = … ` al final | siembra 6 (`expected [ …(7) ] to have a length of 6 but got 7`) y la prueba de posición de F1A-03 (`expected 146 to be 145`) |
| M-F3 | borrar la fila `sello_roto` de la siembra | siembra 1, 2, 3, 4, 5, la prueba de posición de F1A-03 y la ruta (`expected 9 to be 10`) |
| M-F4a | `exige_texto` de `otro` a `false` | siembra 2 y ruta (`expected [] to deeply equal [ 'otro' ]`) |
| M-F4b | `excluye_demas` de `sin_novedad` a `false` | siembra 2 y ruta (`expected [] to deeply equal [ 'sin_novedad' ]`) |
| M-F6 | quitar `ON CONFLICT (clave) DO NOTHING` a `rayon_estetico` | siembra 3, 4 y 5 (`cada fila lleva su ON CONFLICT…`) |
| M-D2 | `novedadesActivas` sin filtrar `activo` | «una novedad desactivada por SQL no se sirve: quedan nueve» (`expected [ …(10) ] to have a length of 9 but got 10`) |

Ninguna mutación quedó sin cazar.

### Cierre verde

`npm test`: 180 ficheros / 2.641 pruebas verdes (2 omitidas) = 2.632 + 9 nuevas. `npm run typecheck` limpio. `npm run lint`: 165 avisos, 0 errores.

### `wc -l` y neto cero

| Fichero | Antes | Después | Numstat |
|---|---|---|---|
| `routes/remision.ts` | 397 | 397 | no tocado |
| `migrate.ts` | 131 | 131 | 1/1 |
| `migrate.test.ts` | 746 | 746 | 10/10 |
| `app.ts` | 96 | 96 | 2/2 |
| `schema.sql` | 676 | 707 | 31/0 |
| `shared/index.ts` | 28 | 29 | 1/0 (línea final) |

Citas que se desplazan: **ninguna** (todo en sitio con neto cero, o al final).

### Casillas de la responsabilidad del orquestador

1.1 (abrir el intento) y el `settle` de 1.14: hechos por el orquestador.

### Deuda declarada

- `novedadesActivas` se prueba por la ruta (y mutación M-D2); su prueba unitaria directa entra en `packages/shared/src/recepcion.test.ts` del lote 2.

## Lote 2 — alta: novedades y rotulado (RQ-RE-23, RQ-RE-24, RQ-RE-27, RQ-RE-17) — en curso

Partida del lote: `da9c740`. Intento 2 abierto y `settle` (casillas 2.1 parcial y 2.13): del orquestador.

### 2.1 Línea base y hipótesis 3

`npm test -- apps/desk/server/remisiones.test.ts apps/desk/server/fotoNovedad.test.ts`: 2 ficheros, 77 pruebas verdes (71 + 6) **sin editarlos**. `routes/remision.ts` 397 líneas, `db/remisiones.ts` 240, `types.ts` 810. **Hipótesis 3: cierta** a la partida; se recomprueba al cierre.

### 2.2 Alineación C2

Manda la spec: `observaciones` une las etiquetas con `; ` y «Otro» va como `{etiqueta}: {texto}`. Corregido `design.md` §2.1 (línea 144: « · » → `; `).

### 2.3 RED `packages/shared/src/recepcion.test.ts` (nuevo, 31 pruebas)

Salida del rojo (antes de escribir `validarRecepcion` ni `componerObservaciones`):

    Test Files  1 failed (1)
         Tests  29 failed | 2 passed (31)
    TypeError: (0 , componerObservaciones) is not a function
    (y lo mismo con validarRecepcion: exports inexistentes)

Las **2 que nacen verdes** son las de `novedadesActivas` (deuda declarada del lote 1: el código ya existía y sólo se probaba por la ruta). Son de caracterización; la mutación que las detecta es **M-D2** (no filtrar `activo`): la primera, «descarta las inactivas». Ya estaba cazada por la ruta en L1; ahora también unitariamente.

Nota PA-3: el par (2,3) de `validarRecepcion` no se puede activar a la vez por construcción (una lista vacía no tiene claves desconocidas), así que permutarlos es mutación equivalente; se prueban los pares (1,2), (1,3), (3,4), (3,5), (4,5), (5,6), (2,6), (4,6), (3,6).

### 2.4 GREEN shared

`validarRecepcion`, `componerObservaciones`, `NovedadMarcada`, `RecepcionValidada` en `packages/shared/src/recepcion.ts`; `types.ts` en sitio (línea 1 gana el `import type`, línea 735 gana los cuatro campos; 810 líneas, neto cero). Verde: `recepcion.test.ts` 31/31.

### 2.5-2.6 RED servidor (`apps/desk/server/recepcion.test.ts`, bloque de alta)

Salida del rojo (antes de tocar `routes/remision.ts`, `db/remisiones.ts` ni el servicio):

    Tests  22 failed | 6 passed (28)     (3 de lote 1 + 3 nacidas verdes)
    AssertionError: expected 201 to be 422            (los seis 422, rotulado, D2, catálogo vacío)
    AssertionError: expected undefined to deeply equal [ …(2) ]   (instantánea ausente)
    AssertionError: expected { hay_novedad: null, …(2) } to deeply equal { hay_novedad: false, …(2) }
    AssertionError: expected { …(20) } to match object { hayNovedad: true, …(5) }   (legado: faltan los cuatro campos)

Nacen verdes y se declaran: **PA-1** (el serial ya gana hoy; su rojo es **M-P1**) y «con la remisión pendiente y novedades válidas el 409 sigue ganando» (caracterización: fija que la guarda nueva no desplaza al `409` cuando no hay nada que rechazar; sin mutación propia de posición, la protege PA-2). **PA-2** es rojo real.

### 2.7 GREEN servidor

Nuevo `apps/desk/server/services/recepcion.ts` (`resolverRecepcion`; `undefined` = legado sin leer la base). En sitio: `routes/remision.ts` R2 (línea 7), R3 (línea 158, antes vacía) y R4 (`:249-250`); `db/remisiones.ts` (`toRemision` `:25`, `CreateRemisionInput` `:40`, `INSERT` `:47-50`, `novedades` por `JSON.stringify`/`null` **sin `J`**, `rotulado_at = new Date()` sólo con recepción). Verdes 2.5 y 2.6; `remisiones.test.ts` y `fotoNovedad.test.ts` verdes sin editar.

### Evidencia TDD

| Casilla | Prueba | RED | GREEN |
|---|---|---|---|
| 2.3 | `shared/recepcion.test.ts` (31) | 29 rojas (`componerObservaciones is not a function`); 2 de `novedadesActivas` nacen verdes | 31/31 |
| 2.5 | `server/recepcion.test.ts` alta (25 nuevas) | 22 rojas (`expected 201 to be 422`, `expected undefined to deeply equal …`) | 28/28 |
| 2.6 | PA-1 / PA-2 | PA-1 nace verde (M-P1); PA-2 `expected 409 to be 422` | verdes |

TRIANGULATE: D1-D3 en los dos sentidos (apagar la marca de la fila «obvia» y encender la de otra), seis rechazos más variantes (`null`, texto, `rotulado` `false`/`"true"`/`1`), legado con y sin `rotulado` en el cuerpo.

### Mutaciones (aplicadas, ejecutadas, revertidas con `cmp` contra copia byte a byte; ninguna sobrevivió)

| Id | Mutación | Prueba roja (mensaje) |
|---|---|---|
| M-P1 | línea 158 por encima de la guarda del serial (antes de `const eq`) | PA-1: `expected 'Marca al menos una novedad, o «Sin no…' to match /Falta el serial/` |
| M-P2 | línea 158 por debajo del bloque del `409` (tras la 183) | PA-2: `expected 409 to be 422` |
| M-P6 | permutar pasos 4↔5 de `validarRecepcion` | PA-3 (4,5): `expected '«Otro» exige describir la novedad.' to contain 'no se puede marcar junto con otra nov…'` |
| M-P6b | permutar pasos 5↔6 | PA-3 (5,6): `expected 'Confirma que el equipo quedó rotulado…' to contain 'exige describir la novedad'` |
| M-D1 | decidir por `clave === 'otro'` | D1a (`expected 422 to be 201`) y D1b (`expected 201 to be 422`) y sus dos unitarias |
| M-D2 | `novedadesActivas` sin filtrar `activo` | D2 servidor, lectura «nueve», dos de `novedadesActivas` y dos de `validarRecepcion` |
| M-D3 | decidir por `clave === 'sin_novedad'` | D3a, D3b, `hayNovedad` y tres unitarias |
| M-D4 | lista constante en vez de leer la tabla | «catálogo vacío»: `expected 201 to be 422`; también D1 y D3 |
| M-L1 | `novedades` con `J` | «legado deja `novedades IS NULL`»: `expected { n_nulo: false, … } to deeply equal { n_nulo: true, … }` |

Pares de PA-3 no probados: (2,3) es equivalente por construcción (una lista vacía no tiene claves desconocidas).

### Cierre verde, `wc -l` y neto cero

`npm test`: 181 ficheros / 2.696 pruebas verdes (2 omitidas) = 2.641 + 55 nuevas. `npm run typecheck` limpio. `npm run lint`: 165 avisos, 0 errores. `git diff` de `remisiones.test.ts` y `fotoNovedad.test.ts` vacío.

| Fichero | Antes | Después | Numstat |
|---|---|---|---|
| `routes/remision.ts` | 397 | 397 | 4/4 (R2, R3, R4 ×2) |
| `db/remisiones.ts` | 240 | 240 | 6/6 |
| `types.ts` | 810 | 810 | 2/2 |

Citas que se desplazan: **ninguna** (neto cero). Las líneas 7, 158, 249 y 250 de `routes/remision.ts` cambian de TEXTO: la 158 no la cita nadie; la 249 y la 250 siguen asignando `observaciones` y `hayNovedad` (cierto de la vía de legado).

### Orden final de guardas del alta (`routes/remision.ts`)

123/125 ticket (A) → 127 fecha (C, IV-12 punto 1) → 154 serial (A) → **158 recepción (C, nueva)** → 174-183 `409` pendiente (D) → 197 ítems (C) → 220 OV (IV-12 punto 2) → 232 `409` OV (D). Intactas todas salvo la nueva.

### Deviaciones del diseño

Ninguna de comportamiento. La guarda del serial está en `:154-157` (el diseño decía 152/155); la 158 era, en efecto, la línea vacía siguiente. C2 alineada en `design.md` §2.1.

### Casillas del orquestador

2.1 (abrir el intento) y el `settle` de 2.13: del orquestador.

### Medida del lote (2.12)

`git diff --shortstat --no-renames da9c740`: 8 ficheros, 439 inserciones, 28 borrados (467), más sin trackear `services/recepcion.ts` 19 y `shared/recepcion.test.ts` 218 = **704** antes de esta nota (válvula 720; techo 800). Sin binarios.
