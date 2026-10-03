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
