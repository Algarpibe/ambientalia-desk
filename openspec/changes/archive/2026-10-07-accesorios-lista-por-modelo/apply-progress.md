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

## Lote 2 · detalle del checklist, novedad sembrada y compatibilidad (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida: `466be1d`. Reanudado tras un corte de red: antes de seguir se comprobó `git diff 466be1d` fichero a fichero y que los ficheros mutados (checklistRemision.ts, remision.ts, schema.sql, accesoriosLista.ts, remisionWebhook.ts) eran idénticos (`cmp`) a la copia verde: ninguna mutación quedó a medio restaurar. `accesoriosLista.ts` y `remisionWebhook.ts` no tienen diff contra 466be1d.

### wc -l antes -> después (2.1, 2.15)
checklistRemision.ts 43 -> 43; types.ts 810 -> 810 (el diseño decía 773); remision.ts 397 -> 397; schema.sql 765 -> 768 (+3 al final: dos comentarios y el INSERT); novedadesSiembra.test.ts 100 -> 100; migrate.test.ts 819 -> 819; recepcion.test.ts 482 -> 482; checklistRemision.test.ts 70 -> 70; DEPLOY.md 523 -> 523. Nuevo: accesoriosRemision.test.ts (195, CRLF).

### Líneas reales para la tabla de la regla 13 (2.14)
- `apps/desk/server/routes/remision.ts:68`: `incluye: checklist.items, incluyeDetalle: checklist.detalle,` (fila 2). Siguen igual `:58`, `:158` y `:194-197` (filas 1 y 3).
- `packages/shared/src/types.ts:759`: `incluyeDetalle` obligatorio, tipo `import('./accesoriosLista').ItemChecklist[]` en la misma línea.
- `apps/desk/server/db/checklistRemision.ts:2`, `:13`, `:36`, `:41` (el detalle); `:40` (items) intacta.
- `packages/zoho-sync/src/db/schema.sql:768`: el INSERT de `accesorio_fuera_de_lista` (comentarios en :766-767).

### Hipótesis DD-4 (2.8)
Confirmada: `npm run lint` (0 errores, 165 avisos) y `npm run typecheck` (exit 0) admiten el tipo `import()` en línea. No hizo falta el respaldo ni la prueba de asignabilidad.

### Rojo (2.2 a 2.6), antes de escribir el verde
Con las pruebas editadas y nuevas y sin implementación: `checklistRemision.test.ts` 3 rojas (las tres de `toEqual` con `detalle`); `novedadesSiembra.test.ts` 5 rojas (pruebas 1 a 5; la 6 verde); `migrate.test.ts` 2 rojas (suma de :652 y las dos últimas sentencias); `recepcion.test.ts` 2 rojas (las de `/api/novedades-remision`); `accesoriosRemision.test.ts` 11 rojas de 13 (16 rojas en las tres suites medidas juntas). Nacen verdes y se declaran como caracterización: RQ-RE-36 (1) y (4). Dentro de las rojas, `incluye` y el alta 201 de RQ-RE-36 (2) y el `incluye` de las pruebas de RQ-RE-32 ya eran verdes; sólo caían por `incluyeDetalle`.

### Verde (2.7, 2.9, 2.10)
Con la implementación: las cinco suites tocadas pasan (129 pruebas); `accesoriosRemision.test.ts` 13 pasan. Un fallo propio de la prueba (dos `adminCookie` en la misma base por el correo repetido) se corrigió en la prueba. DEPLOY.md: líneas 241 y 256 «once»; la 261 se redactó «la lista de once (las diez de la recepción más «Accesorio fuera de lista»)» porque «la lista de» termina la línea 260 (desviación de forma, mismo número de líneas).

### Mutaciones (cada una restaurada y comprobada con `cmp` contra la copia verde)
| Mutación | Resultado |
|---|---|
| M10 quitar `incluyeDetalle` de remision.ts:68 | ROJO: 7 pruebas del GET; `typecheck` TS2741 en remision.ts:59 |
| M9 servidor: quitar `vistos.has` en `detalleDeAccesorios` | ROJO: «dos artículos con el mismo nombre» e INVARIANTE |
| M8a borrar la fila de schema.sql | ROJO: pruebas 1 a 5 de novedadesSiembra, migrate (últimas sentencias), 4 de RQ-RE-34 y 2 de recepcion.test.ts |
| M8b quitar `ON CONFLICT` | ROJO: novedadesSiembra 3, 4 y 5 y migrate (últimas sentencias). No cae la suma de :652 (cuenta sentencias, no su contenido) |
| M8c `exige_texto` en falso | ROJO: novedadesSiembra 2 y 3 pruebas de RQ-RE-34 |
| M8d quitar `public.` | ROJO: novedadesSiembra 5 y migrate (últimas sentencias). Las pruebas 1 y 2 no caen: sin calificar, pg-mem resuelve igual por search_path; las caza el patrón `^INSERT INTO public` |
| `incluye` invertido (caracterización) | ROJO: 3 (orden, perfil, invariante) |
| RQ-RE-36 (1) revalidar `incluye` en /enviar | ROJO: (1) y (4) |
| RQ-RE-36 (4) clave `incluyeDetalle` en el payload | ROJO: (4) |
| RQ-RE-36 (2) filtrar `item_id` en el checklist | ROJO: 3 (sin SKU, invariante, (2)) |
| `items` sin filtrar la clase (divergencia entre los dos filtros) | ROJO: INVARIANTE |
| perfil con SKU inventado | ROJO: perfil de RQ-RE-32 y (3) |

Ninguna sobrevivió. La suma de `migrate.test.ts:652` sólo se pone roja si cambia el número de sentencias (M8a); las otras variantes las cazan novedadesSiembra y la prueba de las últimas sentencias de :794-799.

### Grep de recuentos «diez/nueve/10» (fuera de la lista del diseño)
Pruebas: ninguna otra con recuento de novedades (`novedadesMantenimiento.test.ts` cuenta relativo y pasa). Documentos vivos que dicen «diez» y NO se tocaron: `docs/sdd/ENTRADA.md:1813,1843`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1231,1249`, `docs/sdd/Paquete_de_Despliegue_2026-10-04.md` y `2026-10-04b.md` (varias, históricos fechados: caso B), `Paquete_de_Despliegue_2026-10-05b.md:299,609`, `openspec/specs/remisiones/spec.md:875` (lo mueve el archivo). Ninguno es de este lote.

### Cierre (2.16, 2.17)
- `npm test`: exit 0, 251 ficheros pasan y 2 saltados, 3954 pruebas pasan y 7 saltadas. `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Medida: `git diff --shortstat --no-renames 466be1d` = 9 ficheros, 35 inserciones, 32 borrados (67); más `wc -l` de lo nuevo sin trackear (accesoriosRemision.test.ts) 195: total 262 (válvula 720). Sin binarios.
- Barrido de citas (2.18): ninguna línea se movió (todos los editados conservan `wc -l`; schema.sql sólo crece al final); fuera de `openspec/changes/accesorios-lista-por-modelo/` no hay citas a `remision.ts:68`, `types.ts:759`, `migrate.test.ts:652/794-798` ni `DEPLOY.md:241/256/261`. `DEPLOY.md:500` cita `schema.sql:756`, sin afectar. Segundo pase de abreviadas NO hecho (queda para el cierre del orquestador).

### Desviaciones respecto al diseño
- types.ts mide 810 líneas y no 773; no afecta (línea 759 intacta).
- DEPLOY.md:261: redacción ajustada por el salto de línea (ver arriba).
- Se añadió a `migrate.test.ts:798` (en la misma línea) la comprobación de que la última sentencia es la siembra.

## Lote 3 · ruta del Director Técnico (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida `7cd4c15`. `wc -l apps/desk/server/app.ts`: 96 antes y 96 después.

### Rojo y verde
- Rojo (3.2 a 3.4): `apps/desk/server/accesoriosModelo.test.ts` con la ruta sin escribir: 17 pruebas, 17 en rojo (la ruta no existía).
- Verde (3.5, 3.6): `apps/desk/server/routes/accesoriosModelo.ts` y registro en sitio en `app.ts` (`import` al final de la línea 22, llamada al final de la línea 61): 17 de 17 en verde.
- Los fuentes son CRLF; los dos ficheros nuevos se normalizaron a CRLF.

### Líneas reales de las guardas de `apps/desk/server/routes/accesoriosModelo.ts` (para la tabla de la regla 13, lote 5)
| Paso | Escalón | Línea | Respuesta |
|---|---|---|---|
| 1 | A · modelo | `:24` | `404` |
| 2 | B · permiso (`puedeAnadirAccesorios`) | `:25` | `403` |
| 3 | C · falta el artículo (`accesorioDelCuerpo`) | `:26-27` (guarda en `:27`) | `422` |
| 4 | C · no está en Books (`getArticuloPorId`) | `:28-29` (guarda en `:29`) | `422` |
| 5 | D · repetido (`ArticuloRepetido`) | `:30-35` (`409` en `:33`) | `409` |
| — | clase fijada por el servidor, nombre y SKU de Books | `:31` | `201 { id }` |
Registro: `apps/desk/server/app.ts:22` (import) y `apps/desk/server/app.ts:61` (llamada), sin mover líneas.

### Mutaciones (cada una restaurada y comprobada con `cmp` contra la copia verde; `git status` sin restos)
| Mutación | Resultado |
|---|---|
| M5a pasos 1 y 2 (403 antes del 404) | ROJO: par A↔B |
| M5b pasos 2 y 3 (403 detrás de la falta) | ROJO: par B↔C-falta |
| M5c pasos 2 y 4 (Books en 2, 403 en 4) | ROJO: B↔C-falta, B↔C-no-en-Books y la de «cuerpo sin itemId» |
| permiso detrás de todo el contenido (tras Books) | ROJO: B↔C-falta y B↔C-no-en-Books |
| permiso detrás de la escritura (D antes que B) | ROJO: 5, entre ellas B↔D |
| M6a sólo cargo (cualquier área) | ROJO: el cargo sin el área Servicio Técnico |
| M6b sólo área (cualquier cargo) | ROJO: 4, entre ellas el técnico sin cargo y los tres pares B↔ |
| M6c predicado `true` | ROJO: 5 |
| M7a clase del cuerpo | ROJO: la del cuerpo con clase y nombre inventados |
| M7b nombre del cuerpo | ROJO: la misma |
| M7c SKU del cuerpo | ROJO: la misma y la del SKU null |
| quitar la guarda de Books | ROJO: 5 |

Ninguna sobrevivió. Se añadió M5f (404 detrás de la falta, con 403 y cuerpo delante): ROJO, pares A↔B y A↔C. El par B↔D sólo cae cuando el permiso va detrás de la escritura (las permutaciones M5a a M5c dejan el 403 delante de `crearArticulo`); por eso se añadió esa mutación. Los pares C-falta↔C-no-en-Books y C↔D no se activan a la vez y van declarados en el comentario de la prueba.

### Cierre (3.11, 3.12, 3.13)
- `npm test`: exit 0, 252 ficheros pasan y 2 saltados, 3971 pruebas pasan y 7 saltadas (+17 de este lote). `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Medida: `git diff --shortstat --no-renames 7cd4c15` = 3 ficheros, 62 inserciones, 15 borrados (77; incluye este informe y las 13 casillas de tasks.md); más `wc -l` de lo nuevo sin trackear: 187 + 37 = 224; total 301 (válvula 720). Sin binarios. (Ficheros de `openspec/` de este cambio se editaron además: `tasks.md` y este informe.)
- Barrido de citas (3.13): `app.ts` conserva sus 96 líneas, ninguna se movió; sólo cambia el contenido de las líneas 22 y 61, por AÑADIDO al final (lo anterior sigue donde estaba). El grep `server/app.ts:NNN` da 56 resultados en el repositorio; las líneas 22 y 61 se citan como «el import / la llamada de …» de tandas anteriores y siguen siendo ciertas de lo que afirman. Sin renumeraciones.

### Desviaciones respecto al diseño
- Ninguna de comportamiento. La prueba del `GET /api/remisiones/nueva` se hizo con un ticket y un equipo del modelo (el arnés lo permitió con coste bajo).
- Se añadió una prueba extra: `itemId` no cadena o sólo espacios también da `422 faltaArticulo`.

## Lote 4 · cliente (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida `1867a22`. Intento abierto por el orquestador. `wc -l` antes -> después: `Configuracion.tsx` 244 -> 244, `CrearRemision.tsx` 394 -> 394, `CatalogoEquipos.tsx` 1271 -> 1271, `client.ts` 871 -> 878 (+7, sólo al final: línea en blanco, comentario y `anadirAccesorioModelo`). Nuevo: `AccesoriosModeloPanel.tsx` (128, CRLF como los vecinos).

### Sin rojo previo, declarado
Los `.tsx` están fuera de la red de pruebas (F0-00; `vitest.config.ts:16`, `:17-20`). No hay lógica pura nueva que justifique un `.ts` en `apps/desk/src/lib/`: el rótulo «SKU · nombre» y el filtro de accesorios activos son una expresión de JSX/una línea, y la regla (qué es accesorio, el permiso, la clase fijada) vive en `shared` y se consume. Por tanto, ninguna prueba nueva. Comprobación: `npm run build`.

### Líneas cuyo CONTENIDO cambió (ninguna se movió)
- `client.ts:590` (`sinBooks: number` en el tipo de la copia); añadido al final `:872-878`.
- `CatalogoEquipos.tsx:3` (importa `CLASES_TEXTO_LIBRE`), `:561` (valor inicial `'consumible_repuesto'`), `:638` (el aviso suma «N sin artículo de Books no se copiaron»; `:639` intacta), `:1018` (el desplegable itera `CLASES_TEXTO_LIBRE`). Desviación de línea: tasks.md decía 638-639; sólo cambia la 638.
- `Configuracion.tsx:2` (import), `:33` (unión), `:127` (entrada), `:165` (`if`), todas por AÑADIDO al final de la misma línea.
- `CrearRemision.tsx:240` (texto de ayuda breve tras la etiqueta «Incluye»; desviación: la ayuda va en la línea de la etiqueta para no insertar líneas), `:246-247` (aviso de lista vacía), `:261` (itera `data.incluyeDetalle`), `:264` (SKU en gris si lo hay). La clave y `marcados[item]` siguen siendo el nombre; `incluye: string[]` de nombres no cambia.

### Decisiones del cliente (regla de mutación 3, regla invariable 13)
Líneas del servidor releídas en el fichero el 2026-10-07 (árbol del lote 4).
| # | Decisión del cliente (qué bloquea, rellena, avisa u oculta) | Línea del servidor que la impone |
|---|---|---|
| 1 | BLOQUEA escribir un accesorio: sólo hay casillas de la lista, sin campo de texto (`CrearRemision.tsx:261`) | `apps/desk/server/routes/remision.ts:194` (la lista válida sale de `checklistDeRemision`), `:195-196` (pedidos y desconocidos) y `:197` (422 «Ítems fuera del checklist»); existe y está probada |
| 2 | PINTA nombre y SKU (`CrearRemision.tsx:264`) | No decide. Llegan de `apps/desk/server/routes/remision.ts:68` (`incluyeDetalle: checklist.detalle`) |
| 3 | AVISA que lo no listado se anota como novedad «Accesorio fuera de lista» (`CrearRemision.tsx:240`, `:246-247`) | Texto informativo, no decide. Que la novedad exija texto la impone `apps/desk/server/routes/remision.ts:158` (`resolverRecepcion`, 422) con `packages/shared/src/recepcion.ts:97-99` |
| 4 | OCULTA la clase accesorio en «Añadir a mano» y RELLENA el valor inicial con `consumible_repuesto` (`CatalogoEquipos.tsx:561`, `:1018`) | `apps/desk/server/routes/catalogo.ts:220` (`motivoAltaAccesorio`, 422) |
| 5 | La ficha del modelo no ofrece cambiar la clase de una fila (comentario `apps/desk/src/components/CatalogoEquipos.tsx:671-673`, sin selector por fila) | `apps/desk/server/routes/catalogo.ts:294` (`motivoCambioAAccesorio`, 422) |
| 6 | AVISA cuántos no se copiaron por no tener artículo de Books (`CatalogoEquipos.tsx:638`) | No decide: lo calcula `apps/desk/server/db/catalogoArticulos.ts:166` (filtro) y lo devuelve `:190` (`sinBooks`) |
| 7 | OCULTA los controles a quien no cumple `puedeAnadirAccesorios` (`AccesoriosModeloPanel.tsx:21`) | `apps/desk/server/routes/accesoriosModelo.ts:25` (403) |
| 8 | OFRECE sólo artículos de Books y no pide clase ni nombre (`AccesoriosModeloPanel.tsx`, buscador y `anadir`) | `apps/desk/server/routes/accesoriosModelo.ts:27` (422 falta el artículo), `:29` (422 no está en Books) y `:31` (clase, nombre y SKU fijados desde Books) |
| 9 | DESHABILITA lo que ya está en la lista (`AccesoriosModeloPanel.tsx`, `yaEnLista`) | `apps/desk/server/db/catalogoArticulos.ts:74` (`ArticuloRepetido`), traducido a 409 en `apps/desk/server/routes/accesoriosModelo.ts:33` |
| 10 | (fuera de la tabla de D6) MUESTRA los errores del servidor tal cual (`erroresDelServidor`) | No decide nada; 403 `:25`, 422 `:27` y `:29`, 409 `:33` |
| 11 | (fuera de la tabla de D6) OCULTA en el selector los modelos inactivos, y en la lista las filas que no son accesorio activo | Comodidad de lectura; no impone nada. HALLAZGO menor, no es guarda: el paso 1 (`accesoriosModelo.ts:24`, `getModelo`) NO rechaza un modelo inactivo, así que el servidor aceptaría añadir a uno que la pantalla no ofrece. No es riesgo (añadir a un modelo inactivo es inocuo); queda anotado, sin cambio |
| 12 | (fuera de la tabla de D6) Busca desde 2 caracteres | Comodidad; la lectura es `GET /api/articulos`, sin regla de dominio |

Ninguna decisión que BLOQUEE queda sin línea de servidor. Las filas 2, 3 (texto), 6, 10 y 12 no deciden.

### Cierre
- `npm run build`: exit 0. `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos), ninguno del fichero nuevo. `npm test`: exit 0, 252 ficheros pasan y 2 saltados, 3971 pruebas pasan y 7 saltadas (sin cambios: este lote no añade pruebas).
- Barrido de citas (4.12): ninguna línea se movió. Citas vivas que caen sobre líneas de contenido cambiado: `Configuracion.tsx:2`, `:33`, `:127`, `:165` (15 resultados entre Paquetes de despliegue y archivos archivados de `openspec/changes/archive/`): todas siguen ciertas, porque el cambio es un añadido al final de la misma línea y lo que afirman (entradas de menú y paneles, import, sección) se conserva. `CrearRemision.tsx:264` aparece en dos sitios (`2026-09-25-foto-solo-con-novedad/apply-progress.md:114` y `proposal.md:23`): afirman cosas sobre `observaciones`, ya falsas antes de este lote (caso B, histórico); no se tocan. Ninguna cita a `CatalogoEquipos.tsx` cae en `:3`, `:561`, `:638`, `:1018`; a `client.ts:590` ninguna; a `client.ts` más allá de `:871`, ninguna. La del CLAUDE.md `CrearRemision.tsx:204` sigue en su línea. Segundo pase de abreviadas NO hecho (queda para el cierre del orquestador).

### Desviaciones respecto al diseño
- `CatalogoEquipos.tsx:638` y no `638-639`; la ayuda de `CrearRemision.tsx` va en la línea 240 (no se añaden líneas).
- El panel filtra `getArticulosModelo` en cliente a `clase === 'accesorio' && activo` (esa ruta devuelve todas las clases y las desactivadas).

### Medida (4.11)
`git diff --shortstat --no-renames 1867a22` = 6 ficheros, 73 inserciones, 26 borrados (99; incluye este informe y las casillas de tasks.md; el código de producción son 4 ficheros, 21 inserciones y 14 borrados = 35); más `wc -l` de lo nuevo sin trackear: `AccesoriosModeloPanel.tsx` 128. Total: 227 (válvula 720). Sin binarios.

## Lote 5 · cierre documental (hecho; commit, detector y asiento los hace el orquestador)

Commit de partida `3100093`. Sólo documentos: **no hay prueba posible en este lote** (strict TDD no aplica; no se escribió código de producción ni de prueba). Comprobación: citas verificadas línea a línea y la suite completa en verde, sin cambios.

### `wc -l` antes -> después (5.1; los tres sólo crecen al final, `git diff --numstat` da 0 borrados en cada uno)
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` 1522 -> 1560 (+38, corrección 31); `DEPLOY.md` 523 -> 560 (+37); `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` 251 -> 325 (+74, §11). Nuevo: `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` (96, CRLF). Todo con CRLF; sin `sed -i` sobre los tres.

### Consulta (5.2): criterio contrastado
Cada tabla y columna contra `packages/zoho-sync/src/db/schema.sql` (`catalogo_modelos` `:339-347`, `catalogo_marcas` `:330-335`, `catalogo_tipos` `:323-328`, `catalogo_articulos` `:392-402`, `catalogo_modelo_categorias` `:410-416`, `catalogo_articulos_ocultos` `:423-427`, `books.items` `:380-384`, `equipos.modelo_id` `:354`) y el criterio contra `apps/desk/server/db/catalogoArticulos.ts:307-314` (derivados), `:316-317` (ocultos) y `:348-356` (manuales activos). Dos consultas: modelos activos sin accesorio activo (texto de D8) y accesorios de legado con `item_id IS NULL`. Declarada como hipótesis que PostgreSQL de producción las acepte tal cual.

### Tabla de la regla 13 (5.6), cerrada en `tasks.md` con líneas releídas en `3100093`
Fila 1 `remision.ts:194-197`; 2 `remision.ts:68`; 3 `remision.ts:158` y `shared/src/recepcion.ts:97-99`; 4 `catalogo.ts:220`; 5 `catalogo.ts:294`; 6 `catalogoArticulos.ts:166` y `:190`; 7 `accesoriosModelo.ts:25`; 8 `accesoriosModelo.ts:27`, `:29` y `:31`; 9 `catalogoArticulos.ts:74` y `accesoriosModelo.ts:33`. Coinciden con lo anotado por 1b, 2, 3 y 4; sin desviaciones.

### Barrido de citas (5.7)
- Las 36 citas `ruta:línea` que escribió este lote: principio y final de cada rango comprobados por script contra su fichero, ninguno vacío ni fuera de rango.
- `grep -rnoE "DEPLOY\.md:[0-9]+(-[0-9]+)?"`: 215 resultados; ninguno apunta más allá de la línea 523, y las líneas 241, 256 y 261 (únicas cuyo contenido cambió, lote 2) sólo las alcanzan citas de dos paquetes fechados y de este cambio: `Paquete_de_Despliegue_2026-10-04.md` (`:214`, `:338`, `:442`, `:684`) y `Paquete_de_Despliegue_2026-10-04b.md` (`:259`, `:514`, `:645`, `:1067`) afirman el estado «diez filas» de esa fecha (caso B, histórico: no se renumeran ni se editan aquí), y las de `proposal.md`, `design.md` y este informe describen el estado de partida. El resto no se movió. Segundo pase de abreviadas: no hay abreviadas que dependan de `DEPLOY.md`.
- Los ficheros muy citados no ganaron ni perdieron líneas fuera del final.

### Cierre (5.8 a 5.10)
- `git diff --stat 3100093` sobre `docs/sdd/ENTRADA.md` y `openspec/config.yaml`: vacío (sin tocar).
- `npm test`: exit 0, 252 ficheros pasan y 2 saltados, 3971 pruebas pasan y 7 saltadas (sin cambios). `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).

### Desviaciones respecto al diseño
- La corrección 31 añade un tercer punto (la foto por accesorio no está construida; la línea 1237 no cambia) que `tasks.md` no pedía; es una aclaración, no un cambio de alcance.
- En el §11 los supuestos a confirmar son S-1, S-2, S-3, S-4, S-5, S-7, S-9 y S-10 (ocho); S-6 y S-8 se declaran de implementación, sin respuesta de Gerencia.

## Cierre tras el verify (remediación de W1 a W5 y S1)

Commit de partida `47c3368`. Sólo pruebas y documentos: **ningún cambio de código de producción** (la herramienta de mutación restauró cada fichero, `restaurado=true` en las 7, y `git diff 47c3368` no toca nada fuera de pruebas, el paquete y este informe). Las pruebas nuevas **NACEN VERDES** porque el código ya era correcto: el rojo previo no existe como tal; lo que las acredita es que la mutación que antes sobrevivía ahora cae. Todas van AL FINAL de su fichero.

| Hallazgo | Prueba añadida (fichero · nombre) | Mutación | Antes | Después |
|---|---|---|---|---|
| W1 | `apps/desk/server/accesoriosCatalogo.test.ts` · «alta con itemId vacío o nulo (RQ-RE-33, W1)» > «accesorio con itemId vacío o null, aun con nombre, da 422 con exigeBooks y no crea fila» | P-alta-6: `b.itemId !== undefined` en `apps/desk/server/routes/catalogo.ts:220` | superviviente (N=0) | ROJO (1 prueba cae) |
| W2 | `apps/desk/server/accesoriosModelo.test.ts` · «POST …/accesorios · itemId con espacios (W2)» > «el item_id guardado es el de Books, recortado, y el 201 devuelve el id de esa fila» | CONT-5b: guardar `String(req.body.itemId)` en vez de `art.id` | superviviente (N=0) | ROJO (1 prueba cae) |
| W2 (matiz) | la misma | CONT-5a: guardar `cuerpo.itemId` en vez de `art.id` | n/a | **VERDE: es EQUIVALENTE**, porque `accesorioDelCuerpo` ya devuelve el `itemId` recortado (`packages/shared/src/accesoriosLista.ts:56-60`); sólo el valor crudo del cuerpo es distinguible, y ése cae |
| W4 | `packages/zoho-sync/src/db/novedadesSiembra.test.ts` · «F1B-04 · accesorio_fuera_de_lista tras migrar dos veces (RQ-RE-34)» > «7 · volver a migrar conserva la etiqueta, el activo y las marcas editadas de la fila nueva» (edita la fila en la base, vuelve a llamar a `migrate`, comprueba que la edición sobrevive y que siguen once filas) | SQL-7: `ON CONFLICT (clave) DO UPDATE SET …` en `packages/zoho-sync/src/db/schema.sql:768` | sólo caía por texto (N=2: la 5 y `migrate.test.ts`) | ROJO por comportamiento: cae la 7 nueva (y la 5 por texto) |
| S1 reactivar | `accesoriosCatalogo.test.ts` · «gestión de una fila de legado item_id NULL (RQ-RE-36, S1)» > «reactivar: …» (con y sin repetir la clase) | `UPDATE … WHERE id=$1 AND item_id IS NOT NULL` en `actualizarArticulo` | sobrevivía | ROJO (2 caen: la nueva y la de desactivar) |
| S1 reordenar | misma sección > «reordenar: la fila sin item_id entra en el orden pedido» | `reordenarArticulos` filtra las filas sin `itemId` | sobrevivía | ROJO (1) |
| S1 borrar | misma sección > «borrar: la fila sin item_id se borra con 204 y deja las demás» | `DELETE … AND item_id IS NOT NULL` en `borrarArticulo` | sobrevivía | ROJO (1) |

Mutaciones ejecutadas con `mut.mjs` y un JSON fuera del repositorio. La S1 se prueba por la capa de datos porque las rutas de reordenar y borrar no leen el `item_id`: la mutación plausible es un filtro futuro que proteja el legado.

### Documentos
`docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, §11.2: añadidos (d) (W3: el buscador descarta los artículos de Books sin SKU, `packages/zoho-sync/src/books/repo.ts:30` servido por `apps/desk/server/routes/directory.ts:33`; no se corrige en esta tanda) y (e) (W5: citas archivadas a `migrate.test.ts` cuyo contenido cambió en sitio, nombradas en prosa y sin forma de cita). +12 líneas, 0 borrados, CRLF. Antes de insertar se comprobó que ninguna cita del repositorio apunta al §11.3 ni a líneas de ese paquete mayores que 250 (el §11.3 se desplaza 12 líneas sin romper nada). El encabezado del §11 sigue diciendo «tres límites» y ahora son cinco; no se tocó porque la orden era sólo añadir (lo corrige quien archive).

### Cierre
- `npm test`: exit 0, 252 ficheros pasan y 2 saltados, 3977 pruebas pasan y 7 saltadas (+6 sobre las 3971 del verify). `npm run typecheck`: exit 0. `npm run lint`: exit 0, 165 problemas (0 errores, 165 avisos).
- Detector de citas (`tsx apps/desk/server/citas/cli.ts --sha HEAD`): exit 0, 0 rotas bloqueantes. Las abreviadas rotas informativas son 14 y no 13: la nueva es la `:524` del propio `verify-report.md` (atribuida a `DEPLOY.md`, línea vacía), ajena a esta remediación.
- Medida (`git diff --shortstat --no-renames 47c3368`): 5 ficheros, 93 inserciones y 5 borrados; de ellos, 4 inserciones y 5 borrados son de `specs/remisiones/spec.md`, que **no toqué yo** (aparecía modificado durante la sesión; lo ajeno a esta remediación lo asienta quien lo editó). Lo mío: 89 inserciones en tres ficheros de prueba y el paquete, más este informe. Sin binarios.
