# Informe de verify — accesorios-lista-por-modelo (F1B-04, `cierra: no`)

**Veredicto: PASS WITH WARNINGS** — 0 CRITICAL, 5 WARNING, 4 SUGGESTION.

Revisión verificada: rama `accesorios-lista-por-modelo` en `23cf1a9` (partida `f574d12`). Modo: hybrid. Strict TDD activo
(`npm test`, vitest). Todo lo de abajo lo ejecuté yo en el worktree; nada está copiado de `apply-progress.md`. No se
corrigió nada, no se hizo commit y no se tocó el registro de intentos.

**Qué parte de la fila F1B-04 cubre este cambio y qué deja fuera.** Cubre la mitad de «accesorios por modelo» de la
recepción: formulario con nombre y SKU, cierre del texto libre de accesorios en las tres vías (alta, cambio de clase y copia),
novedad sembrada «Accesorio fuera de lista», ruta y pantalla del Director Técnico para añadir y consulta de modelos sin
accesorios. Deja fuera la mitad de salida de E-123, la foto por accesorio, el número de parte (el SKU como número de parte
sigue siendo hipótesis, S-1) y E-163 a E-167; por eso `cierra: no`.

## 1. Ejecución (códigos de salida mirados)

| Comando | Salida | Resultado |
|---|---|---|
| `npm test` | **0** | 252 ficheros pasan y 2 saltados; 3971 pruebas pasan y 7 saltadas (176 s) |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | 165 problemas: 0 errores, 165 avisos (no suben de 165) |
| `npm run build` | **0** | `vite build` compila el cliente (`built in 3.93s`) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 6.604 comprobadas, línea base 0 informadas y 0 caducadas, cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas, ninguna en un fichero que esta rama toque |

Árbol limpio tras la verificación: `git status --short` vacío y `git diff 23cf1a9` vacío tras las 64 mutaciones.

## 2. Completitud

- `tasks.md`: **102 casillas, 102 marcadas, 0 pendientes**. Las tareas de personas P-1 a P-6 van como viñetas **sin casilla**,
  fuera del recuento, con dueño, destino y dónde queda escrito, y declaran que archivar no las da por hechas (regla del ciclo 1).
  Ninguna describe trabajo que una tanda pudiera hacer en el repositorio (la consulta, el texto de la corrección 31 y las
  secciones de `DEPLOY.md` y del paquete sí se entregan).
- Alcance: `git diff f574d12 23cf1a9 --name-status` da 34 ficheros: 21 editados, 13 nuevos. Todos son de este cambio
  (4 pruebas, ruta, panel, módulo de `shared`, consulta SQL, cinco artefactos del cambio). **`docs/sdd/ENTRADA.md` y
  `openspec/config.yaml` no aparecen en el diff.** Sin ficheros ajenos, sin binarios.
- Medida del cambio entero: 1.268 inserciones y 69 borrados fuera de `openspec/changes/accesorios-lista-por-modelo/`.
- `remision.ts` cambió **una sola línea** (`git diff f574d12 23cf1a9 -- apps/desk/server/routes/remision.ts` da +1 -1, la 68):
  el orden de las guardas del alta de remisión (IV-12) no se tocó. IV-12 no se amplía.

## 3. Matriz requisito → escenario → prueba

49 escenarios en 6 requisitos (RQ-RE-21 modificado: 6; RQ-RE-32: 6; RQ-RE-33: 14; RQ-RE-34: 5; RQ-RE-35: 13; RQ-RE-36: 5).
Todas las pruebas citadas **pasaron** en la ejecución de `npm test` (252 ficheros verdes). Abreviaturas de fichero:
`AC` = `apps/desk/server/accesoriosCatalogo.test.ts`, `AM` = `apps/desk/server/accesoriosModelo.test.ts`,
`AR` = `apps/desk/server/accesoriosRemision.test.ts`, `SH` = `packages/shared/src/accesoriosLista.test.ts`,
`NS` = `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, `MG` = `packages/zoho-sync/src/db/migrate.test.ts`,
`RC` = `apps/desk/server/recepcion.test.ts`.

### RQ-RE-32 · detalle del formulario
| Escenario | Prueba | Estado |
|---|---|---|
| Accesorio con SKU | AR «accesorio con SKU: incluye el nombre e incluyeDetalle nombre y SKU» | COMPLIANT |
| Accesorio sin SKU / fila sin artículo | AR «artículo sin SKU y fila sin artículo de Books salen con sku null…»; SH «sku ausente, nulo o vacío sale null» | COMPLIANT |
| `incluye` no cambia | mismo test de AR (nombres y orden) y el `toEqual` de `incluye` en los tres casos de AR | COMPLIANT |
| Origen perfil sin SKU | AR «origen perfil (ticket sin equipo): todas las entradas sin SKU» y RQ-RE-36 (3) | COMPLIANT |
| Nombres duplicados | AR «dos artículos con el mismo nombre dan una sola entrada»; SH «deduplica por nombre exacto…» | COMPLIANT |
| Nombres de `incluyeDetalle` = los de `incluye` sin repetidos | AR «INVARIANTE items↔detalle…» y `invariante()` en cada `leer()` | COMPLIANT |

### RQ-RE-33 · accesorio exige Books
| Escenario | Prueba | Estado |
|---|---|---|
| Alta sin artículo de Books | AC «accesorio sin itemId da 422 con exigeBooks y no crea fila» | COMPLIANT |
| Alta con artículo de Books | AC «accesorio con itemId de Books da 201 con nombre y SKU de Books» | COMPLIANT |
| Modelo inexistente gana | AC «A frente a C nueva» | COMPLIANT |
| Permiso gana | AC «permiso frente a C nueva» (403 y sin fila) | COMPLIANT |
| Posición frente a «El nombre es obligatorio» | AC «C nueva frente a «El nombre es obligatorio»» | COMPLIANT |
| Posición frente al 409 | AC «C nueva frente al 409…» | COMPLIANT |
| Clase desconocida, orden declarado | AC «clase desconocida da su propio 422»; el par no se prueba, declarado y **equivalente** (P-alta-2, P-patch-2) | COMPLIANT |
| Las demás clases siguen libres | AC «consumible_repuesto sigue admitiendo texto libre» | COMPLIANT |
| PATCH a accesorio sin `item_id` | AC «consumible sin itemId hacia accesorio da 422 y la fila conserva su clase» | COMPLIANT |
| PATCH a accesorio con `item_id` | AC «consumible con itemId hacia accesorio da 200 y pasa a accesorio» | COMPLIANT |
| PATCH repite la clase de un legado | AC «legado accesorio que repite la clase y pone activo false…» | COMPLIANT |
| PATCH de id inexistente | AC «id inexistente da 200 sin escribir» | COMPLIANT |
| Copia que no copia los sin `item_id` | AC «copia el accesorio con itemId, deja el legado y lo cuenta en sinBooks»; «con dos destinos, sinBooks sigue en 1» | COMPLIANT |
| `omitidos` conserva su significado | AC «un choque de nombre en el destino suma a omitidos y no a sinBooks»; «con consumible_repuesto sinBooks vale 0» | COMPLIANT |
| Tabla de pares (5 filas) | las cinco filas de la tabla de la spec: A, permiso, nombre, 409 y escritura del PATCH, cada una con ambas guardas activas | COMPLIANT |

### RQ-RE-34 · novedad sembrada
| Escenario | Prueba | Estado |
|---|---|---|
| La novedad existe tras migrar | NS «1», «2»; RC «con sesión devuelve las once en orden…» | COMPLIANT |
| Migrar dos veces no duplica ni pisa | NS «3» (once filas) y «5» (cada sentencia `ON CONFLICT (clave) DO NOTHING`); NS «4» **no edita la fila nueva** (edita otras tres) | PARTIAL (ver W4) |
| Marcada sin texto | AR «marcada sin texto → 422 con el mensaje «exige describir la novedad»…» | COMPLIANT |
| Marcada con texto | AR «marcada con texto «Cable de red» → 201, hay_novedad en verdad…» | COMPLIANT |
| Exige foto como toda novedad marcada | AR «una remisión guardada con esa novedad y sin su foto → 422 en /enviar» | COMPLIANT |

### RQ-RE-35 · ruta del Director Técnico
| Escenario | Prueba | Estado |
|---|---|---|
| El DT añade un artículo de Books | AM «el Director Técnico añade un artículo de Books: 201 { id }…»; AM «aparece en GET /api/remisiones/nueva…» | COMPLIANT |
| Otro cargo no puede | AM «un técnico de Servicio Técnico SIN el cargo recibe 403…»; «el cargo Director Técnico SIN el área…» | COMPLIANT |
| Modelo inexistente gana al permiso | AM «A↔B» | COMPLIANT |
| Modelo inexistente gana al contenido | AM «A↔C» | COMPLIANT |
| Permiso gana a «falta el artículo» | AM «B↔C-falta» | COMPLIANT |
| Permiso gana a «no está en Books» | AM «B↔C-no-en-Books» | COMPLIANT |
| Permiso gana a la unicidad | AM «B↔D» (403 y una sola fila) | COMPLIANT |
| Falta el artículo | AM «cuerpo sin itemId: 422 faltaArticulo y sin fila» (4 cuerpos) | COMPLIANT |
| Artículo que no está en Books | AM «itemId que no está en Books: 422 noEnBooks y sin fila» | COMPLIANT |
| Artículo repetido | AM «artículo repetido: 409 y sin fila nueva» | COMPLIANT |
| Orden declarado, no probado como par | comentario de AM; los dos pares quedan declarados (C con C, C con D) | COMPLIANT (declarativo) |
| Clase y nombre no vienen del navegador | AM «un cuerpo con clase y nombre inventados no los manda…» | COMPLIANT |
| Sólo añade | AM «el Director Técnico no administrador sólo AÑADE…» (cuatro 403) | COMPLIANT |

### RQ-RE-36 · compatibilidad
| Escenario | Prueba | Estado |
|---|---|---|
| Remisión guardada con ítem de texto libre | AR «(1) remisión con un ítem de texto libre…» | COMPLIANT |
| Fila `item_id NULL` ya existente | AR «(2) fila item_id NULL…: sale en incluye y en incluyeDetalle con sku null, y el alta… 201» | COMPLIANT |
| Gestión de una fila `item_id NULL` | AC «legado… activo false» cubre **desactivar**; reactivar, reordenar y borrar no tienen prueba HTTP sobre una fila sin `item_id` (las rutas no cambian; capa de datos en `apps/desk/server/db/catalogoArticulos.test.ts`) | PARTIAL (ver S1) |
| Lista por perfil intacta | AR «(3) ticket sin equipo recibe la lista del perfil…» | COMPLIANT |
| El payload a n8n conserva sus claves | AR «(4) el payload a n8n conserva sus diez claves…» | COMPLIANT |

### RQ-RE-21 (modificado) · once novedades
| Escenario | Prueba | Estado |
|---|---|---|
| Tras migrar quedan las once, en orden y con marcas | NS «1» y «2»; RC «con sesión devuelve las once…» | COMPLIANT |
| Reaplicar `migrate` no duplica ni pisa lo editado | NS «3» y «4» (tres filas editadas); la fila nueva sólo por NS «5» | PARTIAL (ver W4) |
| El guardián conoce la tabla y sus sentencias calificadas | `migrate.test.ts` «toda ALTER TABLE apunta a una tabla clasificada…» y NS «5»; mutaciones SQL-4 y SQL-10 en rojo | COMPLIANT |
| Una sentencia de relleno pone en rojo el guardián | NS «6»; mutación SQL-9 en rojo (2 pruebas de `migrate.test.ts`) | COMPLIANT |
| Cambiar una marca cambia lo que el servidor acepta | RC «D1a · `exige_texto` apagada en «Otro» por SQL…» (preexistente, verde) | COMPLIANT |

Resumen: 46 COMPLIANT, 3 PARTIAL (W4 dos veces, S1), 0 MISSING, 0 FAILING.

## 4. Mutaciones propias (64, diseñadas por mí; la herramienta restaura y comprueba byte a byte)

Se ejecutaron con `mut.mjs` sobre el worktree; las 64 dieron `restaurado=true` y el árbol quedó limpio. **Resultado: 60 ROJAS,
2 EQUIVALENTES, 2 SUPERVIVIENTES REALES.** Ninguna coincide por construcción con la tabla de `apply-progress.md`: reutilizan
la idea sólo en la POSICIÓN del alta (P-alta-1 y P-alta-7), con otra forma. «N» es el número de pruebas que caen.

### Regla de mutación 1 — POSICIÓN
| Id | Mutación | Resultado |
|---|---|---|
| P-alta-1 | guarda del alta tras la rama del nombre (antes de crear) | ROJO N=1: par «C nueva frente a «El nombre es obligatorio»». El par 409 sobrevive: con nombre válido sigue precediendo al 409 |
| P-alta-7 | guarda del alta tras `crearArticulo` | ROJO N=3: «no crea fila», par nombre y par 409 (es la forma que discrimina el 409) |
| P-alta-3 | guarda del alta antes de «Modelo no encontrado» (A) | ROJO N=4: par A frente a C, par nombre, par 409 y la de «no crea fila» |
| P-alta-2 | guarda del alta antes de «Clase desconocida» | EQUIVALENTE N=0: con clase desconocida la guarda no se activa; es el par que la spec declara no probable |
| P-alta-4 | quitar `requireSuperAdmin` del alta | ROJO N=2: par permiso y «escribir exige super administrador» |
| P-alta-5 | predicado de la guarda invertido | ROJO N=10 |
| **P-alta-6** | la guarda trata cualquier `itemId` definido (también `''` o `null`) como artículo | **SUPERVIVIENTE REAL** N=0 (W1) |
| P-patch-1 | guarda del `PATCH` lee antes pero responde 422 tras escribir | ROJO N=2: «consumible sin itemId hacia accesorio» y el par de posición (clase y `activo`) |
| P-patch-2 | guarda del `PATCH` antes de «Clase desconocida» | EQUIVALENTE N=0: con clase desconocida `motivoCambioAAccesorio` da `null`; par declarado en la spec |
| P-patch-3 | guarda del `PATCH` sólo cuando `activo` no viene | ROJO N=1: el par de posición |
| P-patch-4 | id inexistente deja de dar 200 (guarda con `actual` nulo) | ROJO N=1: «id inexistente da 200» |
| P-patch-5 | el `PATCH` ignora la clase ACTUAL | ROJO N=1: legado que repite clase |
| P-patch-6 | el `PATCH` ignora el `item_id` de la fila | ROJO N=2 |
| P-patch-7 | quitar `requireSuperAdmin` del `PATCH` | ROJO N=1: sólo añade (403 del DT en `PATCH`) |
| P-mod-1 | A↔B permutados (403 antes del 404) | ROJO N=1: par A↔B |
| P-mod-2 | A↔C aislado: el 404 cede con cuerpo vacío | ROJO N=1: par A↔C |
| P-mod-3 | B↔C-falta aislado | ROJO N=1: par B↔C-falta |
| P-mod-4 | B↔C-no-en-Books aislado (403 cede si Books no conoce el artículo) | ROJO N=2: B↔C-no-en-Books y, de rebote, B↔C-falta |
| P-mod-5 | B↔D aislado (403 cede si el artículo ya está en la lista) | ROJO N=1: par B↔D |
| P-mod-6 | quitar la guarda 422 «falta el artículo» | ROJO N=1 |
| P-mod-7 | 409 de `ArticuloRepetido` devuelto como 422 | ROJO N=1 |
| P-mod-8 | quitar `requireAuth` de la ruta | ROJO N=15 |

Los cinco pares de `accesoriosModelo.ts:24-35` quedan fijados **cada uno por una mutación aislada** (P-mod-1 a P-mod-5), no
sólo por permutaciones: cada par cae por su propia prueba. Los pares C-falta con C-no-en-Books y C con D no se activan a la vez
(dependencia de datos, `accesoriosModelo.ts:27` y `:29`), como declara la spec.

### Permiso y contenido de la ruta del Director Técnico
| Id | Mutación | Resultado |
|---|---|---|
| PERM-1 | cualquier área (sólo cargo) | ROJO N=2: «Director Técnico de otra área» (SH y AM) |
| PERM-2 | sólo administrador | ROJO N=9 |
| PERM-3 | predicado invertido | ROJO N=19 |
| PERM-4 | cualquier cargo (sólo área) | ROJO N=6 |
| CONT-1 | clase tomada del cuerpo | ROJO N=1 |
| CONT-2 | nombre tomado del cuerpo | ROJO N=1 |
| CONT-3 | SKU tomado del cuerpo | ROJO N=1 |
| CONT-4 | `itemId` sin recortar (`accesorioDelCuerpo`) | ROJO N=3 (SH x2, AM x1) |
| **CONT-5** | la ruta guarda `itemId` del cuerpo en vez de `art.id` de Books | **SUPERVIVIENTE REAL** N=0 (W2) |

### `checklistRemision.ts`, `remision.ts` y compatibilidad
| Id | Mutación | Resultado |
|---|---|---|
| CHK-1 | `detalle` sin deduplicar | ROJO N=2 (duplicados e INVARIANTE) |
| CHK-2 | `detalle` con ítems de otra clase | ROJO N=1 (INVARIANTE) |
| CHK-3 | `items` alterado (orden invertido) | ROJO N=3 |
| CHK-4 | `items` sin filtrar la clase | ROJO N=2 |
| CHK-5 | detalle del perfil vacío | ROJO N=3 |
| CHK-6 | `detalle` ignora filas `item_id NULL` | ROJO N=4 |
| CHK-7 | `items` ignora filas `item_id NULL` | ROJO N=7 (la lista, el alta 201 y `remisiones.test.ts`) |
| CHK-8 | `sku` vacío no se normaliza a `null` | ROJO N=1 (SH) |
| CHK-9 | dedupe sensible a minúsculas | ROJO N=3 |
| REM-1 | quitar `incluyeDetalle` de `remision.ts:68` | ROJO N=7 (pruebas del `GET`) |
| REM-2 | quitar la guarda «Ítems fuera del checklist» (`remision.ts:197`) | ROJO N=3 (incluida la de posición con la subOV vencida) |
| REM-3 | el payload a n8n gana `incluyeDetalle` | ROJO N=1: RQ-RE-36 (4) |
| REM-4 | `incluyeDetalle` desde otra fuente (SKU inventado) | ROJO N=7 |
| COMP-1 | el reenvío a n8n filtra ítems de texto libre guardados | ROJO N=2: RQ-RE-36 (1) y (4) |
| COMP-2 | el alta rechaza filas `item_id NULL` (valida contra el detalle con SKU) | ROJO N=8: RQ-RE-36 (2) y siete de `remisiones.test.ts` |

`remision.ts:194-197` sigue rechazando un ítem fuera de lista (REM-2 lo demuestra) y el orden de las guardas existentes no
cambió (diff de una línea, la 68).

### Copia (`catalogoArticulos.ts:166` y `:190`)
| Id | Mutación | Resultado |
|---|---|---|
| COP-1 | `sinBooks` multiplicado por destinos | ROJO N=2 |
| COP-2 | `sinBooks` = todos | ROJO N=5 |
| COP-3 | `omitidos` suma `sinBooks` | ROJO N=4 |
| COP-4 | `omitidos` duplica el choque | ROJO N=2 |
| COP-5 | el filtro ignora la clase | ROJO N=1 (`consumible_repuesto`) |
| COP-6 | filtro nulo (se copia el legado) | ROJO N=4 |
| COP-7 | `sinBooks` de otras clases distinto de 0 | ROJO N=1 |

### Regla de mutación 2 — fichero vigilado `schema.sql` (INSERT en la línea 768)
| Id | Mutación | Resultado |
|---|---|---|
| SQL-1 | otra clave | ROJO N=7 |
| SQL-2 / SQL-3 | otro orden (55 / 95) | ROJO N=2 cada una: NS «1» y RC «once en orden» |
| SQL-4 | sin `public.` | ROJO N=2: NS «5» y `migrate.test.ts` (última sentencia). Sólo la cazan las pruebas de texto: pg-mem resuelve igual por `search_path` |
| SQL-5 | `exige_texto` falso | ROJO N=4 |
| SQL-6 | `excluye_demas` verdadero | ROJO N=4 |
| SQL-7 | `ON CONFLICT … DO UPDATE` (pisa lo editado) | ROJO N=2, **sólo por texto** (NS «5» y `migrate.test.ts`); ninguna prueba de comportamiento sobre la fila nueva (W4) |
| SQL-8 | etiqueta distinta | ROJO N=6 |
| SQL-9 | `UPDATE public.remisiones` de relleno | ROJO N=2 (`migrate.test.ts`) |
| SQL-10 | `ALTER TABLE` sin calificar | ROJO N=5 |
| SQL-11 | una fila extra sembrada | ROJO N=9 |

**Recuento: 64 mutaciones = 60 rojas + 2 equivalentes (P-alta-2, P-patch-2: los pares declarados que no se pueden activar
a la vez) + 2 supervivientes reales (P-alta-6, CONT-5).** Ninguno se maquilla: son huecos de prueba, no defectos del código
(el código es correcto en ambos casos; lo que falta es la prueba que lo ate).

## 5. Regla invariable 13 (regla de mutación 3), decisión a decisión

Contrasté la tabla de `tasks.md` (nueve filas) y la del lote 4 de `apply-progress.md` (doce) contra el fichero en `23cf1a9`,
línea por línea. **Todas las líneas del servidor dicen lo que la fila afirma**, y cada guarda tiene una mutación mía en rojo:

| Decisión del cliente | Línea del servidor, leída | Imposición probada |
|---|---|---|
| Sólo casillas de la lista (`CrearRemision.tsx:261`) | `apps/desk/server/routes/remision.ts:194-197` | REM-2 en rojo |
| Pinta nombre y SKU (`CrearRemision.tsx:264`) | no decide; llega de `apps/desk/server/routes/remision.ts:68` | REM-1 y REM-4 en rojo |
| Lo no listado se anota como novedad que exige texto | `apps/desk/server/routes/remision.ts:158` con `packages/shared/src/recepcion.ts:97-99` | AR RQ-RE-34; SQL-5 en rojo |
| «Añadir a mano» no ofrece accesorio (`CatalogoEquipos.tsx:1018`) | `apps/desk/server/routes/catalogo.ts:220` | P-alta-1, 3, 5, 7 en rojo |
| La ficha no cambia la clase por fila | `apps/desk/server/routes/catalogo.ts:294` (antes de la escritura `:298`) | P-patch-1, 3, 5, 6 en rojo |
| Aviso de la copia | no decide; `apps/desk/server/db/catalogoArticulos.ts:166` y `:190` | COP-1 a COP-7 en rojo |
| Controles sólo a quien puede (`AccesoriosModeloPanel.tsx:21`) | `apps/desk/server/routes/accesoriosModelo.ts:25` | PERM-1 a PERM-4 en rojo |
| Sólo artículos de Books, sin clase ni nombre | `apps/desk/server/routes/accesoriosModelo.ts:27`, `:29`, `:31` | P-mod-6, CONT-1 a CONT-3 en rojo; CONT-5 sobrevive (W2) |
| No ofrece lo que ya está en la lista | `apps/desk/server/db/catalogoArticulos.ts:74` y `apps/desk/server/routes/accesoriosModelo.ts:33` | P-mod-7 en rojo |

**Ninguna decisión del cliente que BLOQUEE queda sin imposición probada en el servidor.** Hallazgos de lectura que la tabla no
traía: (a) el cliente sólo puede añadir artículos que el buscador devuelve, y el buscador **excluye los de Books sin SKU**
(`packages/zoho-sync/src/books/repo.ts:30`, servido por `apps/desk/server/routes/directory.ts:33`), mientras que el servidor
los acepta; es comodidad más estrecha que la regla, no una guarda que falte, pero no está declarada (W3); (b) el paso 1 de
la ruta (`apps/desk/server/routes/accesoriosModelo.ts:24`) no rechaza un modelo inactivo que la pantalla sí oculta; ya lo
declara `apply-progress.md` (fila 11), inocuo (S3).

## 6. Compatibilidad (RQ-RE-36)

- Remisión guardada con texto libre: AR (1) lee con `GET /api/remisiones/:id` y reenvía a n8n `['Maletín de lujo']` tal cual.
  COMP-1 (filtrar el reenvío) cae en rojo.
- Filas `item_id NULL`: AR (2) las ofrece en `incluye` y en `incluyeDetalle` con `sku: null` y el alta responde 201.
  CHK-6, CHK-7 y COMP-2 caen en rojo (COMP-2 con siete pruebas preexistentes de `remisiones.test.ts`).
- Lista por perfil: AR (3) y CHK-5 en rojo. Payload a n8n: AR (4) y REM-3 en rojo, sin `incluyeDetalle` ni SKU.
- Sin migración y sin relleno: ningún `UPDATE` ni `DELETE` nuevo en `packages/zoho-sync/src/db/schema.sql:766-768`
  (comentarios y una siembra con `ON CONFLICT (clave) DO NOTHING`); SQL-9 prueba que un relleno se detectaría.

## 7. Regla de mutación 4 — líneas y citas

`wc -l` (`git show <rev>:<ruta> | wc -l`), `f574d12` → `23cf1a9`. **Iguales (14):** `apps/desk/server/app.ts` 96,
`catalogo.test.ts` 462, `db/catalogoArticulos.test.ts` 389, `db/checklistRemision.test.ts` 70, `db/checklistRemision.ts` 43,
`recepcion.test.ts` 482, `routes/catalogo.ts` 379, `routes/remision.ts` 397, `CatalogoEquipos.tsx` 1271,
`Configuracion.tsx` 244, `CrearRemision.tsx` 394, `types.ts` 810, `migrate.test.ts` 819, `novedadesSiembra.test.ts` 100.
**Crecieron (7), todas sólo al final** (comprobado con `git diff -U0`, un único hunk de adición cada una):
`catalogoArticulos.ts` 358→364 (hunk en `:359`), `client.ts` 871→878 (`:872`), `shared/src/index.ts` 38→39 (`:39`),
`schema.sql` 765→768 (`:766`), `DEPLOY.md` 523→560 (`:524`), `F0-01_Correcciones_para_el_maestro.md` 1522→1560 y
`Paquete_de_Despliegue_2026-10-06.md` 251→325 (0 borrados). `DEPLOY.md` además cambió tres líneas en sitio (241, 256 y 261).

Barrido propio: leí cada cita `<fichero>:<línea>` del repositorio (fuera de la carpeta del cambio) cuyo rango cubre una línea
que cambió de contenido: 94 aciertos por nombre de fichero (alguno es de otro fichero homónimo), 55 en `openspec/changes/archive/`. Clasificación:

- **Caso A (siguen ciertas, contenido añadido al final de la misma línea):** las de `Configuracion.tsx` (líneas 2, 127, 165),
  `app.ts` (22 y 61), `remision.ts:66-71` en el plan de agosto y las de `checklistRemision.ts` en
  `openspec/specs/remisiones/spec.md:33`, `:81` y `:727` y en `openspec/config.yaml:4034` (el `detalle` es aditivo).
- **Caso B (históricas, no se renumeran):** las de las carpetas archivadas a
  `novedadesSiembra.test.ts` (40 y 55) y a `migrate.test.ts:652` (cuentan «diez» novedades y la sentencia de su fecha), y las de
  `CrearRemision.tsx:264` de `foto-solo-con-novedad`.
- **Caso C (superadas):** `openspec/config.yaml:4036` («El formulario hoy enseña sólo el nombre») y `openspec/config.yaml:4050`
  («qué pasa con los que ya existen así»), que cita `catalogo.ts` y describen el estado de partida. Esta rama no toca ese
  fichero: **van al `archive-report.md`**. `openspec/config.yaml:4054` (la ruta del super administrador) sigue cierta.
- El detector da 0 citas rotas nuevas (exit 0). Lo que el detector no ve (la forma abreviada) quedó sin segundo pase en los
  lotes; ninguna de las 13 abreviadas rotas informativas cae en un fichero de esta rama.

## 8. Consulta `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` (leída, no ejecutada)

Leí las dos consultas contra `schema.sql` y contra `listarArticulosDeModelo` (`apps/desk/server/db/catalogoArticulos.ts:302-358`).
Sólo lectura: cada una va entre `BEGIN TRANSACTION READ ONLY` y `ROLLBACK`. No se ejecutó contra ninguna base.

- Tablas y columnas, todas existen con ese esquema: `public.catalogo_modelos` (`id, marca_id, nombre, tipo_id, activo`,
  `schema.sql:339-347`), `public.catalogo_marcas` y `public.catalogo_tipos` (`id, nombre`), `public.catalogo_articulos`
  (`modelo_id, clase, item_id, activo`, `:392-402`), `public.catalogo_modelo_categorias` (`modelo_id, clase, categoria`,
  `:410-416`), `public.catalogo_articulos_ocultos` (`modelo_id, item_id`), `books.items` (`item_id, name, category_name,
  status, sku`, `:380-384`) y `desk.equipos.modelo_id` (`:354`, `ALTER TABLE equipos` sin calificar: aterriza en `desk`).
- Criterio contra `listarArticulosDeModelo`: derivados = `catalogo_modelo_categorias` + `books.items` activos
  (`COALESCE(status,'active')`), menos los ocultos (`:307-317`); manuales activos (`:348-356`). Replica ambos, restringido a la clase
  `accesorio`. El empate «gana el derivado» no cambia si hay al menos uno, así que no hace falta replicarlo. La segunda consulta
  (accesorios con `item_id IS NULL`) es coherente con RQ-RE-36.
- Sin defecto. Reservas: es **hipótesis** que PostgreSQL de producción la acepte tal cual (declarado en su encabezado); y la cita
  de la línea 17 del propio fichero (`catalogoArticulos.ts:302-356`) recorta las dos últimas líneas de la función (`return out`
  y el cierre en 357 y 358): cosmético (S2).

## 9. Coherencia con el diseño y strict TDD

| Decisión | Código | Estado |
|---|---|---|
| DD-1 un núcleo y dos `motivo…` | `packages/shared/src/accesoriosLista.ts:27`, `:32`, `:40` | OK |
| DD-2 la guarda en las rutas, no en `crearArticulo` | `apps/desk/server/routes/catalogo.ts:220` y `:294` | OK (la materialización sigue escribiendo con y sin `itemId`) |
| DD-3 y DD-5 un solo `checklistDeRemision`, `incluyeDetalle` obligatorio | `apps/desk/server/db/checklistRemision.ts:36` y `:41`; `packages/shared/src/types.ts:759` | OK (REM-1 rompe `typecheck` y las pruebas) |
| DD-4 tipo `import()` en la misma línea | `packages/shared/src/types.ts:759` | OK: lint y typecheck lo admiten |
| DD-7 id inexistente sigue en 200 | `apps/desk/server/routes/catalogo.ts:294` | OK (P-patch-4 en rojo) |
| DD-8 ruta propia sin `requireSuperAdmin` | `apps/desk/server/routes/accesoriosModelo.ts:22-24` | OK |
| DD-9 siembra al final de `schema.sql` | `packages/zoho-sync/src/db/schema.sql:766-768` | OK |
| DD-10 no tocar `ENTRADA.md` ni `config.yaml` | ausentes del diff | OK |

Desviaciones menores ya declaradas por apply: `wc -l` de `catalogo.ts` es 379 y no 380; la ayuda del formulario va en la línea 240
de `CrearRemision.tsx`; `DEPLOY.md` línea 261 con otra redacción. Ninguna rompe la spec.

Strict TDD: las pruebas nuevas hacen afirmaciones de comportamiento (estado HTTP, fila resultante, mensaje contra
`MENSAJES_ACCESORIOS`), no de existencia. Los `.tsx` del lote 4 no tienen prueba por decisión de Gerencia (F0-00,
`vitest.config.ts:16`); su comprobación es `npm run build` (exit 0). **Que el rojo se viera antes del verde en cada lote es
lo que dice `apply-progress.md`: para mí es una hipótesis, no lo ejecuté**; lo que sí demuestran las 60 mutaciones rojas es que
las pruebas actuales discriminan.

## 10. Hallazgos

### CRITICAL
Ninguno. Todas las pruebas pasan, los cinco comandos salen en 0, ningún escenario queda sin prueba y ninguna guarda del
servidor falta frente a una decisión del cliente.

### WARNING
1. **W1 · Hueco de prueba, superviviente P-alta-6.** Ninguna prueba envía el alta de un accesorio con `itemId: ''` o
   `itemId: null` (sólo ausente). Si alguien cambiara la lectura `b.itemId ? … : null` de `apps/desk/server/routes/catalogo.ts:220`
   por una comparación con `undefined`, un accesorio sin artículo de Books se crearía por la rama del nombre
   (`apps/desk/server/routes/catalogo.ts:231`) con 201. El código actual es correcto; falta la prueba HTTP (la unitaria de
   `shared` ya cubre `''` y `null` en `accesorioSinBooks`, pero no el paso por la ruta).
2. **W2 · Hueco de prueba, superviviente CONT-5.** La ruta del Director Técnico guarda `art.id` de Books
   (`apps/desk/server/routes/accesoriosModelo.ts:31`). Si guardara el `itemId` del cuerpo, un `itemId` con espacios
   (` i1 `, que la ruta recorta para buscar) quedaría guardado sin recortar y ninguna prueba HTTP lo vería: la prueba de clase
   y nombre inventados manda un `itemId` limpio. Efecto posible: fila con `item_id` que no casa con Books.
3. **W3 · Límite no declarado del buscador.** El panel sólo puede añadir lo que devuelve `GET /api/articulos`, que descarta los
   artículos de Books **sin SKU** (`packages/zoho-sync/src/books/repo.ts:30`). El servidor acepta uno sin SKU (AM «un artículo de
   Books sin SKU entra con sku null») y RQ-RE-32 prevé accesorios sin SKU, pero el Director Técnico no puede añadir ese caso
   desde la pantalla; sólo llega por categoría. No viola ningún escenario; conviene declararlo en el paquete (S-4) y a Gerencia.
4. **W4 · Escenario sólo cubierto por texto.** «Migrar dos veces no duplica ni pisa» para la fila nueva: NS «4» edita tres filas
   de las diez antiguas, no `accesorio_fuera_de_lista`. La mutación SQL-7 (`DO UPDATE`, que pisaría la etiqueta editada) la matan
   sólo las pruebas de texto (NS «5» y `migrate.test.ts`), no una de comportamiento. Es protección real, pero indirecta.
5. **W5 · Afirmación inexacta en `apply-progress.md`, lote 2.** Dice que fuera del cambio no hay citas a `migrate.test.ts:652`
   ni a `migrate.test.ts:794-798`; hay siete en carpetas archivadas a la línea 652 (una es el rango 648-652; caso B, no se corrigen). Y el segundo pase de
   abreviadas quedó «no hecho» en cada lote. No hay efecto en el detector (exit 0), pero el barrido declarado era incompleto.

### SUGGESTION
1. **S1.** Añadir una prueba HTTP de reactivar, reordenar y borrar una fila de legado `item_id NULL` (RQ-RE-36, «Gestión»); hoy
   sólo se prueba desactivar.
2. **S2.** Corregir en la consulta (línea 17) el rango a la función completa; cosmético.
3. **S3.** Decidir si el paso 1 de la ruta debe rechazar un modelo inactivo (hoy la pantalla lo oculta y el servidor no lo impide;
   inocuo, ya anotado por apply).
4. **S4.** El `archive-report.md` debe llevar la línea de `cierra: no` (qué cubre y qué deja fuera, arriba), la medición de cada
   intento, y los casos C de `openspec/config.yaml:4036` y `openspec/config.yaml:4050`; y la fusión del delta debe mover
   `openspec/specs/remisiones/spec.md:859` y `openspec/specs/remisiones/spec.md:875-884` («diez» pasa a «once»).

## 11. Veredicto

**PASS WITH WARNINGS.** El cambio cumple los 49 escenarios (46 con prueba directa que pasa, 3 parciales sin incumplimiento), no
toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`, deja el alta de remisión con una sola línea cambiada (IV-12 intacta) y
las 64 mutaciones propias dan 60 rojas, 2 equivalentes (los pares que la spec declara no activables a la vez) y 2 supervivientes
reales, ambos huecos de prueba sin defecto de código (W1, W2). Nada bloquea el archivo; W1 a W3 pueden entrar como pruebas o como
nota en el paquete, a decisión de quien archive.
