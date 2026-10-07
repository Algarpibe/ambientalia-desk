# Progreso de apply — accesorios-lista-por-modelo (F1B-04, cierra: no)

## Lote 1a · módulo de reglas en `shared` (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida: `0e8ea70`. `wc -l packages/shared/src/index.ts`: 38 antes, 39 después (una línea nueva al final; ninguna anterior se movió, `git diff` lo confirma).

### Rojo (1a.2 a 1a.4)
- `npx vitest run packages/shared/src/accesoriosLista.test.ts` con la prueba escrita y sin módulo: `Failed to load url ./accesoriosLista ... Does the file exist?`, `Test Files 1 failed`, `Tests no tests`. Rojo por la razón prevista (módulo inexistente).

### Verde (1a.5, 1a.6)
- Tras crear `packages/shared/src/accesoriosLista.ts` y la exportación: `Test Files 1 passed (1)`, `Tests 56 passed (56)`.

### Mutaciones (1a.7 a 1a.9), cada una restaurada y comprobada con `cmp` contra la copia previa
| Mutación | Resultado |
|---|---|
| M3: quitar `if (actual.clase === CLASE_ACCESORIO) return null` de `motivoCambioAAccesorio` | ROJO: 1 falla, «la fila que YA es accesorio da null aunque no tenga itemId» |
| M9a: quitar `vistos.has(a.nombre)` (sin dedupe) en `detalleDeAccesorios` | ROJO: 1 falla, «deduplica por nombre exacto y gana la primera aparición» |
| M9b: SKU tomado de otro campo (`codigo`) | ROJO: 3 fallas (SKU en el orden de entrada, dedupe con SKU, duplicado de otra clase) |
| `puedeAnadirAccesorios` siempre `true` | ROJO: 4 fallas (técnico sin el cargo, sin cargo alguno, DT de otra área, sujeto ausente) |

Nota: el primer intento de M3 no se aplicó (el patrón no casaba por el CRLF del fichero) y por eso no dio rojo; se repitió con `\r\n` y sí. Ninguna mutación sobrevivió.

### Cierre (1a.10, 1a.11)
- `npm test`: exit 0, 249 ficheros pasan y 2 saltados, 3924 pruebas pasan y 7 saltadas.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Medida: `git diff --shortstat --no-renames 0e8ea70` = 1 fichero, 1 inserción; más `wc -l` de lo nuevo sin trackear: `accesoriosLista.ts` 80, `accesoriosLista.test.ts` 132. Total de código del lote: 213 (válvula 720).
- Barrido de citas (1a.12): todas las citas `shared/src/index.ts:N` del repositorio fuera de este cambio apuntan a líneas 3 a 38; sólo se añadió la 39 al final, así que ninguna se desplazó y la 38 sigue siendo `export * from './reasignacion'`.

### Desviaciones respecto al diseño
- Ninguna en las firmas de D1. Detalle de implementación: `CLASES_TEXTO_LIBRE` se calcula con `CLASES_ARTICULO.filter`; `sku` vacío o ausente sale `null` con `a.sku || null`.
- «Sujeto ausente» en la matriz de `puedeAnadirAccesorios`: `puedeMantenerNovedades(undefined)` lanza `TypeError` (no devuelve `false`); la prueba fija que `puedeAnadirAccesorios` se comporta igual (no abre el permiso), sin añadir una guarda que el diseño no pide.

## Lote 1b · cierre del catálogo (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida: `42bcdf9`. `wc -l` antes -> después: `apps/desk/server/routes/catalogo.ts` 379 -> 379 (el «380» del diseño cuenta la línea final de otra forma; `wc -l` da 379 antes y después), `apps/desk/server/db/catalogoArticulos.ts` 358 -> 364 (sólo crece por `getArticuloManual` al final: +6), `apps/desk/server/catalogo.test.ts` 462 -> 462, `apps/desk/server/db/catalogoArticulos.test.ts` 389 -> 389. Nuevo: `apps/desk/server/accesoriosCatalogo.test.ts` (178, CRLF como los vecinos).

### Líneas reales de las guardas (para la tabla de la regla 13 del lote 5)
- Guarda del alta: `apps/desk/server/routes/catalogo.ts:220` (tras «Modelo no encontrado» `:215` y «Clase de artículo desconocida» `:219`; antes del comentario del `itemId` y de «El nombre es obligatorio» `:231`).
- Guarda del `PATCH`: `apps/desk/server/routes/catalogo.ts:294` (`patch.clase = clase` + lectura por id + guarda en la misma línea; la escritura `actualizarArticulo` es `:298`).
- Filtro de la copia: `apps/desk/server/db/catalogoArticulos.ts:166` (`todos` y `fuente`); el retorno con `sinBooks` en `:190`; `getArticuloManual` en `:361`. Imports: `catalogo.ts:10` y `:12`, `catalogoArticulos.ts:3`.

### Rojo (1b.2 a 1b.5)
- `npx vitest run apps/desk/server/accesoriosCatalogo.test.ts` sin implementación: `Tests 9 failed | 8 passed (17)`. Rojas por la razón prevista: alta sin `itemId` (201 en vez de 422), pares (c) y (d) del alta, `PATCH` a accesorio sin `itemId` y su par de posición, y las cuatro de la copia (sin `sinBooks`, copiados de más). Nacen verdes, como declara `tasks.md`: legado que repite clase, id inexistente (DD-7), alta con `itemId`, consumible de texto libre, clase desconocida, los pares A y permiso.

### Verde (1b.6, 1b.7) y rojo por contrato (1b.8)
- Con la implementación: `accesoriosCatalogo.test.ts` 17 passed.
- `npm test` completo antes de editar las pruebas viejas: exit 1, `Tests 8 failed | 3933 passed | 7 skipped`. Rojas por contrato: `catalogo.test.ts` («acepta ítems de texto libre…», «rechaza clase desconocida, nombre vacío…», «leer exige sesión; escribir exige super administrador») y `db/catalogoArticulos.test.ts` («copia los artículos de una clase a varios destinos…», «no copia los desactivados…», «omite lo que el destino ya tenía…», «copia solo la clase pedida», «ignora el propio origen…»).

### Ediciones en sitio (1b.9, 1b.10), sin cambiar el número de líneas
- `catalogo.test.ts` líneas 151, 154, 166, 168, 169 y 200: `accesorio` -> `consumible_repuesto`. `:180` y `:199` intactas.
- `db/catalogoArticulos.test.ts`: `:172` espera `{ copiados: 2, omitidos: 0, sinBooks: 1 }`, `:175` sólo `['Slides']`; `:183`, `:184`, `:193`, `:201` y `:217` ganan `itemId` y `sku`. `:194` (destino de texto libre sembrado) y `:168` (legado que ahora se filtra) quedan igual.

### Mutaciones (todas restauradas; `cmp` contra la copia previa, `git diff` sin restos)
| Mutación | Resultado |
|---|---|
| M1 (a) guarda del alta movida tras la rama del nombre | ROJO: 1 falla, el par (c). **El par (d) sobrevive**: con nombre no vacío la guarda sigue precediendo al `409`. No es hueco de prueba: (d) lo mata M1 (b) |
| M1 (b) guarda del alta movida tras el `try` (antes del `crearArticulo`) | ROJO: sólo el par (c), igual que M1 (a). (d) sigue verde porque la guarda aún precede al `409` que lanza `crearArticulo`. Forma que sí discrimina (d): guarda DESPUÉS de `crearArticulo` (la fila se crea y luego se responde 422) -> ROJO 3 fallas: alta sin `itemId` («no crea fila»), (c) y (d) |
| M2 guarda del `PATCH` detrás de `actualizarArticulo` | ROJO: 2 fallas, «consumible sin itemId hacia accesorio» y el par de posición (conserva clase y `activo`). (Un primer intento mal formado dio 500 por `clase` fuera de ámbito y se descartó) |
| M4 quitar el filtro de `copiarArticulos` | ROJO: 3 fallas de la copia (con su `sinBooks`) |
| Clase tomada de otro lado (la guarda del alta con clase fija `consumible_repuesto`) | ROJO: 3 fallas (alta sin Books, (c), (d)) |
| Quitar la guarda del alta | ROJO: 3 fallas (alta sin Books, (c), (d)) |

### Cierre (1b.16 a 1b.18)
- `npm test`: exit 0, 250 ficheros pasan y 2 saltados, 3941 pruebas pasan y 7 saltadas. `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Medida: `git diff --shortstat --no-renames 42bcdf9` = 4 ficheros, 27 inserciones, 21 borrados (48); más `wc -l` de lo nuevo sin trackear (`accesoriosCatalogo.test.ts`) 178: total 226 (válvula 720). Sin binarios.
- Barrido de citas (1b.19): ninguna línea se movió en los cuatro ficheros (`catalogo.ts` y las pruebas conservan su `wc -l`; `catalogoArticulos.ts` sólo crece al final), así que ninguna cita se desplaza. Citas vivas a `routes/catalogo.ts` en `openspec/config.yaml:4036`, `:4050` y `:4054` afirman el estado de partida («el formulario hoy enseña sólo el nombre», «qué pasa con los que ya existen así»): caso B o C para el `archive-report.md`, no se editan. `:4046`, `:193`, `:197` y las dos de `ENTRADA.md` no se ven afectadas. Segundo pase de abreviadas no hecho (queda para el cierre del orquestador).

### Desviaciones respecto al diseño
- M1 (a) y (b) como están escritas en `tasks.md` no ponen rojo el par (d) (ver tabla); el hueco está cubierto por la forma «guarda después de crear». Sin cambios de código por ello.
- `wc -l` de `catalogo.ts` es 379, no 380: el diseño cuenta de otro modo; no se desplazó ninguna línea.
