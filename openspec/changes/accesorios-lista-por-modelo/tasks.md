# Tareas — Accesorios de la remisión de entrada: lista del modelo con nombre oficial y SKU, sin texto libre (F1B-04, `cierra: no`)

Propuesta: `openspec/changes/accesorios-lista-por-modelo/proposal.md`. Diseño canónico: `openspec/changes/accesorios-lista-por-modelo/design.md`
(D1 módulo, D2 detalle, D3 catálogo, D4 ruta del Director Técnico, D5 siembra, D6 cliente y regla 13, D7 pruebas y mutaciones M1 a M10, D8 consulta, D9 lotes; el diseño manda sobre la propuesta).
Requisitos: RQ-RE-32, RQ-RE-33, RQ-RE-34, RQ-RE-35 y RQ-RE-36 (nuevos) y RQ-RE-21 (modificado) del delta `specs/remisiones/spec.md`. RQ-RE-03 no cambia de comportamiento.

**Reglas de todos los lotes.** Cada lote es un intento del registro (`gentle-ai sdd-attempt`) en el worktree `C:\dev\Desk_2_R1.023-worktrees\accesorios-lista-por-modelo`, techo 800, válvula 720.
Strict TDD: cada pieza va como pareja «prueba en rojo» → «implementación en verde», y el rojo se **ve** (se corre y se mira el fallo) antes de escribir el verde.
Las pruebas existentes que quedan rojas por contrato se editan **en sitio, después** del rojo de las nuevas, con el fichero y las líneas que se listan en cada lote.
Los textos de error se comparan contra `MENSAJES_ACCESORIOS`, no contra literales.
**Esta rama no toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`** (DD-10). Ningún fichero muy citado gana ni pierde líneas: todo se edita sobre la línea que ya existe, y lo nuevo va en ficheros nuevos o al final.
Cada lote se cierra, en este orden, con: `npm test`, `npm run typecheck` y `npm run lint` (165 avisos y 0 errores; no pueden subir de 165) con su código de salida MIRADO; la medida (`git diff --shortstat --no-renames` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear; los binarios, si los hubiera, aparte); el barrido de citas de la regla de mutación 4; el commit; y **después del commit** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` con código de salida 0 MIRADO; y asentar el intento. Antes de editar en sitio un fichero, anotar su `wc -l`: debe ser igual al terminar (salvo lo que se añade al final, que se declara).
Al fijar cada guarda nueva, anotar en `openspec/changes/accesorios-lista-por-modelo/apply-progress.md` la **línea real** (ruta y línea, leída del fichero ya editado): alimenta la tabla de la regla 13 de más abajo.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1.185 brutas (190 + 195 + 270 + 225 + 175 + 130), ×1,8 = 2.133, repartidas en seis intentos de 342, 351, 486, 405, 315 y 234 (más verify ~360 y archive ~180 + fusión, cada uno en su intento) |
| Budget risk | Low: ningún intento supera 800 ni la válvula de 720 (el mayor, el lote 2, 486) |
| Chained PRs recommended | No: este proyecto no usa PR. Cada lote es un commit en la rama del worktree bajo un intento con techo 800, y el analista verifica la rama entera antes de fusionar a `main` |
| Suggested split | 1a → 1b → 2 → 3 → 4 → 5 (secuencial; 2 y 3 no dependen entre sí; verify y archive aparte) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (no aplica: no hay cadena de PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

El presupuesto del proyecto es de 800 líneas POR INTENTO, no por cambio ni por PR; 400 es la guía genérica de la skill y aquí no es el techo. Los lotes 2 (486) y 3 (405) pasan de 400 y quedan bajo 720.
Si al medir un lote pasa de 720, se parte antes de asentar (salida prevista en la cabecera de cada lote).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1a | Regla pura en `shared` | commit 1a | `npx vitest run packages/shared/src/accesoriosLista.test.ts` | N/A: módulo puro sin I/O; lo cubre la prueba unitaria | Revertir el commit (módulo y exportación nuevos, sin consumidores) |
| 1b | Cierre del catálogo: alta, `PATCH`, copia | commit 1b | `npx vitest run apps/desk/server/accesoriosCatalogo.test.ts apps/desk/server/catalogo.test.ts apps/desk/server/db/catalogoArticulos.test.ts` | `appWith` y pg-mem reales de las pruebas | Revertir el commit del lote |
| 2 | Detalle `incluyeDetalle`, novedad sembrada, compatibilidad | commit 2 | `npx vitest run apps/desk/server/accesoriosRemision.test.ts apps/desk/server/db/checklistRemision.test.ts packages/zoho-sync/src/db/novedadesSiembra.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/recepcion.test.ts` | `appWith` y doble de n8n sobre pg-mem | Revertir el commit; la fila sembrada se retira con `activo = false` si ya se desplegó |
| 3 | Ruta del Director Técnico | commit 3 | `npx vitest run apps/desk/server/accesoriosModelo.test.ts` | `appWith` con tres sujetos sobre pg-mem | Revertir el commit (quita el registro de `apps/desk/server/app.ts`) |
| 4 | Cliente | commit 4 | `npm run build` (compilación; los `.tsx` no tienen pruebas) | N/A: los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00); se verifica en la aplicación (P-5) | Revertir el commit |
| 5 | Cierre documental | commit 5 | `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | N/A: sólo documentos; la consulta SQL no la corre ninguna sesión | Revertir el commit |

---

## Lote 1a · módulo de reglas en `shared`

**Ficheros:** `packages/shared/src/accesoriosLista.ts` y `packages/shared/src/accesoriosLista.test.ts` (nuevos); una línea al final de `packages/shared/src/index.ts`.
**Estimación:** 190 brutas (módulo 75, prueba 114, exportación 1) × 1,8 = **342**.
**Salida prevista si pasa de 720:** no aplica; es el lote más pequeño de los de código.

- [x] 1a.1 Anotar el commit de partida (`git rev-parse HEAD`), abrir el intento y anotar `wc -l` de `packages/shared/src/index.ts` (el diseño lo da en 38 líneas).
- [x] 1a.2 **Rojo** `packages/shared/src/accesoriosLista.test.ts`, núcleo y motivos: tabla de casos clase × `itemId` (con valor, vacío, `null`, `undefined`) para `accesorioSinBooks`, `motivoAltaAccesorio` y `motivoCambioAAccesorio` (la fila que **ya es** accesorio devuelve `null`; consumible sin `itemId` hacia accesorio da `cambioSinBooks`; con `itemId` da `null`); `CLASES_TEXTO_LIBRE` es `CLASES_ARTICULO` sin `accesorio`. El rojo inicial es el fallo de importación del módulo inexistente. Fija RQ-RE-33.
- [x] 1a.3 **Rojo** en la misma prueba, permiso y cuerpo: `puedeAnadirAccesorios(s)` igual a `puedeMantenerNovedades(s)` sobre una matriz de sujetos (administrador, Director Técnico de Servicio Técnico, técnico sin el cargo, Director Técnico de otra área, sujeto ausente); `accesorioDelCuerpo`: cuerpo no objeto, `itemId` ausente, no cadena o vacío tras recortar dan `faltaArticulo`; recorta el `itemId`; ignora `clase`, `nombre` y `sku` del cuerpo sin rechazarlos. Fija RQ-RE-35.
- [x] 1a.4 **Rojo** en la misma prueba, detalle: `detalleDeAccesorios` filtra la clase `accesorio`, deduplica por nombre exacto con la primera aparición ganadora, y da `sku: null` si falta o viene vacío; `detalleSinSku` deduplica igual y todo sale con `sku: null`; en los dos, el orden de entrada se conserva. Fija RQ-RE-32 («nombres duplicados», «ítem sin SKU», «origen perfil sin SKU»).
- [x] 1a.5 **Verde** crear `packages/shared/src/accesoriosLista.ts` con las firmas del diseño D1 (`CLASE_ACCESORIO`, `CLASES_TEXTO_LIBRE`, `MENSAJES_ACCESORIOS`, `accesorioSinBooks`, `motivoAltaAccesorio`, `motivoCambioAAccesorio`, `puedeAnadirAccesorios`, `CuerpoAccesorio`, `accesorioDelCuerpo`, `ItemChecklist`, `detalleDeAccesorios`, `detalleSinSku`). Consume `packages/shared/src/mantenimientoNovedades.ts:15-18`, `packages/shared/src/cargos.ts:37` y `packages/shared/src/types.ts:239-240`; no repite la lógica de permiso.
- [x] 1a.6 **Verde** añadir `export * from './accesoriosLista'` como línea nueva al final de `packages/shared/src/index.ts`; comprobar que el fichero pasó de 38 a 39 líneas y que ninguna línea anterior se movió.
- [x] 1a.7 **Mutación M3** `motivoCambioAAccesorio` sin mirar la clase actual: debe ponerse rojo el caso de la fila que ya es accesorio. Restaurar.
- [x] 1a.8 **Mutación M9 (parte `shared`)** quitar el deduplicado de `detalleDeAccesorios`, y por separado tomar el SKU de otro campo: debe ponerse roja la unitaria de dedupe y la de SKU. Restaurar.
- [x] 1a.9 **Mutación** `puedeAnadirAccesorios` siempre verdadero: debe ponerse roja la matriz de sujetos. Restaurar.
- [x] 1a.10 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [x] 1a.11 Medir: `git diff --shortstat --no-renames` contra el commit de 1a.1 más `wc -l` de los dos ficheros nuevos sin trackear; registrar la cifra. Si pasa de 720, parar y consultar.
- [x] 1a.12 **Barrido de citas, regla de mutación 4,** para `packages/shared/src/index.ts`: `grep -rnoE "shared/src/index\.ts:[0-9]+(-[0-9]+)?"` y comprobar CADA resultado contra el fichero (sólo se añadió una línea al final); segundo pase de las abreviadas en los ficheros que citan el módulo.
- [x] 1a.13 Commit del lote 1a (conventional commit, sin atribución de IA).
- [x] 1a.14 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [x] 1a.15 Asentar el intento.

---

## Lote 1b · cierre del catálogo

**Ficheros:** `apps/desk/server/accesoriosCatalogo.test.ts` (nuevo); en sitio `apps/desk/server/routes/catalogo.ts` (líneas 10, 12, 220 —hoy vacía— y 294), `apps/desk/server/db/catalogoArticulos.ts` (líneas 3, 165, 166, 190 y `getArticuloManual` al final), `apps/desk/server/catalogo.test.ts` y `apps/desk/server/db/catalogoArticulos.test.ts`.
**Estimación:** 195 brutas (prueba nueva 120, `catalogo.ts` 8, `catalogoArticulos.ts` 28, `catalogo.test.ts` 10, `catalogoArticulos.test.ts` 29) × 1,8 = **351**.
**Salida prevista si pasa de 720:** sacar la copia (S-9) —1b.5, parte de 1b.9 y las ediciones de `catalogoArticulos.test.ts`— a un intento 1c.

- [x] 1b.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/server/routes/catalogo.ts` (380 según el diseño), `apps/desk/server/db/catalogoArticulos.ts` (358), `apps/desk/server/catalogo.test.ts` y `apps/desk/server/db/catalogoArticulos.test.ts`. Leer `apps/desk/server/catalogo.test.ts` entero: es el molde del arnés y del sembrado de artículos de Books de la prueba nueva.
- [x] 1b.2 **Rojo** `apps/desk/server/accesoriosCatalogo.test.ts`, alta: accesorio sin `itemId` da `422` con `MENSAJES_ACCESORIOS.exigeBooks` y no crea fila; accesorio con `itemId` de Books da `201` con nombre y SKU de Books; `consumible_repuesto` sin `itemId` da `201`; clase desconocida da su propio `422` (par declarado como no activable a la vez). Fija RQ-RE-33 («alta sin artículo de Books», «con artículo de Books», «las demás clases siguen con texto libre», «clase desconocida, orden declarado»).
- [x] 1b.3 **Rojo, pruebas de POSICIÓN del alta** (regla de mutación 1), cada una con las **dos guardas activas a la vez**: (a) A frente a C nueva: modelo inexistente y accesorio sin `itemId` da `404`; (b) permiso frente a C nueva: sujeto no administrador y accesorio sin `itemId` da `403`; (c) C nueva frente a «El nombre es obligatorio»: accesorio sin `itemId` y nombre en blanco da `422` con `exigeBooks`; (d) C nueva frente al `409`: accesorio sin `itemId` cuyo nombre ya existe como fila de legado sembrada por SQL da `422` y no `409`. Fija las cuatro filas «Alta» de la tabla de RQ-RE-33.
- [x] 1b.4 **Rojo** `PATCH` en la misma prueba: consumible sin `itemId` hacia `accesorio` da `422` y la fila conserva clase; con `itemId` da `200` y pasa a `accesorio`; legado que repite la clase y pone `activo: false` da `200` y queda desactivado (nace verde: lo caza M3); id inexistente da `200` sin escribir (nace verde: caracteriza DD-7). **Prueba de POSICIÓN del `PATCH`:** C nueva frente a la escritura, con `{ clase: 'accesorio', activo: false }` sobre un consumible sin `itemId`: `422` y la fila conserva clase **y** `activo`.
- [x] 1b.5 **Rojo** copia por HTTP en la misma prueba: modelo con un accesorio con `itemId` y otro sin él, destino vacío, da `200`, `copiados` 1, `sinBooks` 1, `omitidos` 0 y el destino no gana ninguna fila sin `itemId`; con dos destinos `sinBooks` sigue en 1 (cuenta el origen una vez); un choque de nombre en el destino suma a `omitidos` y no a `sinBooks`; con la clase `consumible_repuesto` `sinBooks` vale 0 y la copia no cambia. Fija RQ-RE-33 («copia que no copia…», «`omitidos` conserva su significado»).
- [x] 1b.6 **Verde** `apps/desk/server/db/catalogoArticulos.ts` en sitio: línea 3 (importa `accesorioSinBooks`), 165 (el retorno gana `sinBooks: number`), 166 (`todos` y `fuente`), 190 (devuelve `sinBooks: todos.length - fuente.length`), y `getArticuloManual` al final del fichero (`SELECT id, clase, item_id, sku, nombre, orden, activo FROM catalogo_articulos WHERE id = $1`). Sin insertar líneas en mitad.
- [x] 1b.7 **Verde** `apps/desk/server/routes/catalogo.ts` en sitio: línea 10 (importa `getArticuloManual`), línea 12 (importa `motivoAltaAccesorio` y `motivoCambioAAccesorio`), la línea 220 hoy vacía (guarda del alta, tras la clase desconocida de la 219 y antes del comentario del `itemId`) y la línea 294 (`patch.clase = clase` seguido de la lectura por id y la guarda, todo en la misma línea). Confirmar que el fichero sigue en 380 líneas.
- [x] 1b.8 Correr las pruebas nuevas y ver el verde; correr la suite y **ver en rojo, por contrato,** las pruebas existentes de 1b.9 y 1b.10 (anotar cuáles lo están en `apply-progress.md`).
- [x] 1b.9 Editar **en sitio** `apps/desk/server/catalogo.test.ts` (después del rojo): líneas 151, 154, 166, 168-169 y 200 pasan la clase de `accesorio` a `consumible_repuesto`, para que sigan probando el texto libre que sigue abierto en esa clase. `apps/desk/server/catalogo.test.ts:180` y `apps/desk/server/catalogo.test.ts:199` siguen verdes y **no se tocan**.
- [x] 1b.10 Editar **en sitio** `apps/desk/server/db/catalogoArticulos.test.ts`: líneas 166-179 esperan `{ copiados: 2, omitidos: 0, sinBooks: 1 }` y sólo «Slides» en los destinos; líneas 183-184, 193, 201 y 217 ganan `itemId` y `sku` en la misma línea, y cada prueba sigue afirmando lo suyo.
- [x] 1b.11 **Mutación M1 (a)** mover la guarda del alta detrás de la rama del nombre: deben ponerse rojos los pares 1b.3 (c) y (d). Restaurar.
- [x] 1b.12 **Mutación M1 (b)** mover la guarda del alta detrás del `try` del `409`: debe ponerse rojo el par 1b.3 (d). Restaurar.
- [x] 1b.13 **Mutación M2** mover la guarda del `PATCH` detrás de `actualizarArticulo`: debe ponerse rojo el par de 1b.4 (conserva clase y `activo`). Restaurar.
- [x] 1b.14 **Mutación M4** quitar el filtro de `copiarArticulos`: debe ponerse roja la prueba de la copia con su `sinBooks`. Restaurar.
- [x] 1b.15 Anotar en `apply-progress.md` las líneas reales leídas de los ficheros editados: la guarda del alta y la del `PATCH` en `apps/desk/server/routes/catalogo.ts`, y el filtro de la copia en `apps/desk/server/db/catalogoArticulos.ts`.
- [x] 1b.16 Comprobar `wc -l`: `apps/desk/server/routes/catalogo.ts`, `apps/desk/server/catalogo.test.ts` y `apps/desk/server/db/catalogoArticulos.test.ts` iguales a los de 1b.1; `apps/desk/server/db/catalogoArticulos.ts` sólo crece por `getArticuloManual` al final.
- [x] 1b.17 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [x] 1b.18 Medir: `git diff --shortstat --no-renames` contra el commit de 1b.1 más `wc -l` de la prueba nueva sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera antes de asentar.
- [x] 1b.19 **Barrido de citas, regla de mutación 4,** `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` para `routes/catalogo.ts`, `db/catalogoArticulos.ts`, `catalogo.test.ts` y `db/catalogoArticulos.test.ts`; comprobar CADA resultado leyendo qué afirma la frase (el contenido de las líneas 220 y 294 cambió, y la línea 166 y la 190 también). Segundo pase de las abreviadas en los ficheros que ya citan esos módulos. Anotar para el `archive-report.md` los tres de `openspec/config.yaml` que el diseño marca como caso B o C (no se editan: esta rama no toca ese fichero).
- [x] 1b.20 Commit del lote 1b.
- [x] 1b.21 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [x] 1b.22 Asentar el intento.

---

## Lote 2 · detalle del checklist, novedad sembrada y compatibilidad

**Depende de:** 1a (usa `detalleDeAccesorios`, `detalleSinSku` e `ItemChecklist`).
**Ficheros:** `apps/desk/server/accesoriosRemision.test.ts` (nuevo); en sitio `apps/desk/server/db/checklistRemision.ts` (líneas 2, 13, 36, 41), `packages/shared/src/types.ts` (línea 759), `apps/desk/server/routes/remision.ts` (línea 68), `packages/zoho-sync/src/db/schema.sql` (al final), y las pruebas y el documento que se editan en sitio: `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, `packages/zoho-sync/src/db/migrate.test.ts`, `apps/desk/server/recepcion.test.ts`, `apps/desk/server/db/checklistRemision.test.ts`, `DEPLOY.md`.
**Estimación:** 270 brutas (prueba nueva 150, `checklistRemision.ts` 8, `types.ts` 2, `remision.ts` 2, `schema.sql` 3, `novedadesSiembra.test.ts` 22, `migrate.test.ts` 10, `recepcion.test.ts` 14, `checklistRemision.test.ts` 6, `DEPLOY.md` 6, más lo que añada el helper del doble de n8n 47) × 1,8 = **486**.
**Salida prevista si pasa de 720:** sacar las cuatro pruebas de compatibilidad (2.5) a un intento 2b.

- [x] 2.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/server/db/checklistRemision.ts` (43), `packages/shared/src/types.ts` (773), `apps/desk/server/routes/remision.ts`, `packages/zoho-sync/src/db/schema.sql` (765), `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, `packages/zoho-sync/src/db/migrate.test.ts`, `apps/desk/server/recepcion.test.ts`, `apps/desk/server/db/checklistRemision.test.ts` y `DEPLOY.md`.
- [x] 2.2 **Rojo** `apps/desk/server/db/checklistRemision.test.ts` en sitio: las expectativas de las líneas 28-29, 57-58 y 67-68 (`toEqual` exacto sobre `{ items, origen }`) ganan `detalle` (con SKU o `null` según el sembrado de cada caso; en el origen `perfil`, sin SKU). Se editan **antes** del verde y deben quedar rojas.
- [x] 2.3 **Rojo** `apps/desk/server/accesoriosRemision.test.ts`, formulario: `GET /api/remisiones/nueva` trae `incluyeDetalle` con nombre y SKU («Cable USB»/«CB-100»); un artículo sin SKU o una fila sin artículo de Books sale con `sku: null`; `incluye` conserva los mismos nombres y el mismo orden; origen `perfil` con todas las entradas sin SKU; dos artículos con el mismo nombre dan una sola entrada; **invariante:** en todos los casos anteriores, los nombres de `incluyeDetalle` son los de `incluye` sin repetidos y en el mismo orden (enfrenta los dos filtros de «accesorio», `apps/desk/server/db/checklistRemision.ts:40` y `detalleDeAccesorios`). Fija RQ-RE-32.
- [x] 2.4 **Rojo** en la misma prueba, novedad sembrada por el alta de remisión (molde de `apps/desk/server/recepcion.test.ts`): `accesorio_fuera_de_lista` marcada sin texto da `422` con el mensaje de «exige describir la novedad» tomado de la etiqueta; con texto «Cable de red» el alta se acepta, `hay_novedad` queda en verdad y el texto entra en las observaciones; marcada junto con «Otro» comparten un solo texto (S-10); una remisión guardada con esa novedad y sin su foto responde `422` en `/enviar` (RQ-RE-26). Fija RQ-RE-34.
- [x] 2.5 **Rojo/caracterización** en la misma prueba, las cuatro de compatibilidad (RQ-RE-36), declarando cuáles nacen verdes: (1) una remisión guardada con un `incluye` que hoy no está en ninguna lista se lee por `GET /api/remisiones/:id` y se envía sin error, con el doble de n8n `conN8n` copiado (local) de `apps/desk/server/recepcion.test.ts` —nace verde—; (2) una fila `item_id NULL` de clase `accesorio` sembrada por SQL sale en `incluye` y en `incluyeDetalle` con `sku: null`, y el alta que la marca responde `201` —roja sólo por `incluyeDetalle`—; (3) ticket sin equipo recibe la lista del perfil con `origen: 'perfil'` y detalle sin SKU —roja sólo por el detalle—; (4) el payload a n8n conserva sus claves y no lleva `incluyeDetalle` ni SKU —nace verde: lo caza M10 por el lado de los tipos y la prueba del `GET`—.
- [x] 2.6 **Rojo** guardianes de la siembra, en sitio y antes del `schema.sql`: `packages/zoho-sync/src/db/novedadesSiembra.test.ts` línea 27 (gana `['accesorio_fuera_de_lista', 'Accesorio fuera de lista', 65]` en la misma línea), títulos de las líneas 40, 46, 55 y 78 («diez» a «once»), `toHaveLength` de las líneas 49, 71 y 80 (10 a 11), línea 52 (`['accesorio_fuera_de_lista', 'otro']`) y línea 61 (`toBe(11)`); `packages/zoho-sync/src/db/migrate.test.ts` línea 652 (la suma gana `+ 1` con su etiqueta en el mensaje) y líneas 794-798 (`reasignaciones` pasa de penúltima a antepenúltima y su índice de última a penúltima, con `- 3` y `- 2`, y el título nombra la siembra nueva como última); `apps/desk/server/recepcion.test.ts` línea 14 (`ETIQUETAS` gana `'Accesorio fuera de lista'` tras `'Falta un accesorio'`), 25 («las once»), 32 (`r.body[10]`), 36 («quedan diez») y 42 (`toHaveLength(10)`). **No se toca** `apps/desk/server/recepcion.test.ts:419` (las «diez claves» son del payload a n8n). Ver rojo.
- [x] 2.7 **Verde** detalle: `apps/desk/server/db/checklistRemision.ts` líneas 2, 13, 36 y 41 (según la tabla del diseño D2; la línea 40 `items` no se toca); `packages/shared/src/types.ts` línea 759 (`incluyeDetalle` obligatorio, con `import('./accesoriosLista').ItemChecklist[]` en la misma línea, DD-4 y DD-5); `apps/desk/server/routes/remision.ts` línea 68 (`incluyeDetalle: checklist.detalle`). Las líneas 58 y 194-197 de `remision.ts` no cambian.
- [x] 2.8 Comprobar la **hipótesis DD-4** corriendo `npm run lint` y `npm run typecheck` sobre lo anterior: si el lint rechaza el tipo `import()` en línea, aplicar el respaldo del diseño (literal `{ nombre: string; sku: string | null }[]` en esa línea) y añadir a `packages/shared/src/accesoriosLista.test.ts` una prueba de asignabilidad mutua con `ItemChecklist`; anotar el resultado en `apply-progress.md`.
- [x] 2.9 **Verde** siembra: añadir al final de `packages/zoho-sync/src/db/schema.sql`, tras la línea 765, el comentario (sin punto y coma ni tildes) y el `INSERT INTO public.catalogo_novedades … ON CONFLICT (clave) DO NOTHING` de D5 (orden 65, `exige_texto` verdadero, `excluye_demas` falso). Nada se inserta junto a las diez.
- [x] 2.10 **Verde documental** `DEPLOY.md` en sitio: líneas 241 y 256 («diez» a «once») y 261 («la lista (las diez de la recepción más «Accesorio fuera de lista»)»). Sin prueba posible: va después del verde.
- [x] 2.11 **Mutación M10** quitar `incluyeDetalle` de la respuesta de `apps/desk/server/routes/remision.ts` (línea 68): deben ponerse rojos `typecheck` y la prueba del `GET`. Restaurar.
- [x] 2.12 **Mutación M9 (parte servidor)** en `detalleDeAccesorios`, quitar el dedupe: debe ponerse roja la invariante `items`↔`detalle` de `apps/desk/server/accesoriosRemision.test.ts`. Restaurar.
- [x] 2.13 **Mutación M8** sobre el fichero vigilado `schema.sql`, una variante cada vez y restaurando tras cada una: (a) borrar la fila nueva; (b) quitarle `ON CONFLICT`; (c) poner `exige_texto` en falso; (d) quitarle `public.`. Deben ponerse rojas las pruebas 1, 2, 3 y 5 de `packages/zoho-sync/src/db/novedadesSiembra.test.ts` y la suma de `packages/zoho-sync/src/db/migrate.test.ts` línea 652.
- [x] 2.14 Anotar en `apply-progress.md` la línea real de `incluyeDetalle` en `apps/desk/server/routes/remision.ts` y del `INSERT` nuevo de `schema.sql`.
- [x] 2.15 Comprobar `wc -l`: iguales a los de 2.1 en `checklistRemision.ts` (43), `types.ts` (773), `remision.ts`, las cuatro pruebas y `DEPLOY.md`; `schema.sql` sólo crece por lo añadido al final (declarar cuántas líneas).
- [x] 2.16 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [x] 2.17 Medir: `git diff --shortstat --no-renames` contra el commit de 2.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera.
- [x] 2.18 **Barrido de citas, regla de mutación 4,** `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` para `db/checklistRemision.ts`, `types.ts`, `routes/remision.ts`, `novedadesSiembra.test.ts`, `migrate.test.ts`, `recepcion.test.ts` y `db/checklistRemision.test.ts`, más `schema\.sql:[0-9]+` y `DEPLOY\.md:[0-9]+`; comprobar CADA resultado leyendo qué afirma. Atención a lo que cambia de **contenido** sin moverse: `types.ts` línea 759, `remision.ts` línea 68, `migrate.test.ts` líneas 652 y 794-798. Segundo pase de las abreviadas. `openspec/specs/remisiones/spec.md:859` y `openspec/specs/remisiones/spec.md:875-884` («diez») no se tocan: los mueve la fusión del delta al archivar.
- [x] 2.19 Commit del lote 2.
- [x] 2.20 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [x] 2.21 Asentar el intento.

---

## Lote 3 · ruta del Director Técnico

**Depende de:** 1a (usa `puedeAnadirAccesorios`, `accesorioDelCuerpo` y `MENSAJES_ACCESORIOS`). No depende del lote 2.
**Ficheros:** `apps/desk/server/routes/accesoriosModelo.ts` y `apps/desk/server/accesoriosModelo.test.ts` (nuevos); en sitio `apps/desk/server/app.ts` (línea 22 el `import`, línea 61 la llamada).
**Estimación:** 225 brutas (ruta 40, prueba 180, `app.ts` 2, helper local de segundo sujeto 3) × 1,8 = **405**.
**Salida prevista si pasa de 720:** no aplica; el margen es amplio.

- [x] 3.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/server/app.ts`. Leer `apps/desk/server/testing/appHarness.ts` y `apps/desk/server/novedadesMantenimiento.test.ts` (molde de sujetos) antes de escribir la prueba.
- [x] 3.2 **Rojo** `apps/desk/server/accesoriosModelo.test.ts`, éxito y permiso: el Director Técnico (`['Servicio Técnico']`, `'Director Técnico'`) añade un artículo de Books y recibe `201 { id }`, queda `accesorio` activo con nombre y SKU de Books y se ve en la lista del modelo; el administrador pasa; sin sesión `401`; técnico de Servicio Técnico sin el cargo `403` y la lista no cambia; Director Técnico con área `['Comercial']` `403`. Fija RQ-RE-35 («añade un artículo», «otro cargo no puede»).
- [x] 3.3 **Rojo, pruebas de POSICIÓN de la ruta** (regla de mutación 1), cada una con las **dos guardas activas a la vez**, con un helper local del fichero para el segundo sujeto no administrador (`createRole`/`createUser`/`createSession`, sin tocar el arnés): (a) A frente a B: modelo inexistente y técnico sin cargo da `404`; (b) A frente a C: modelo inexistente y cuerpo vacío da `404`; (c) B frente a C-falta: técnico sin cargo y cuerpo vacío da `403`; (d) B frente a C-no-en-Books: técnico sin cargo y `itemId` inexistente da `403`; (e) B frente a D: técnico sin cargo y artículo ya en la lista da `403` y sin fila nueva. Fija los cinco pares de RQ-RE-35.
- [x] 3.4 **Rojo** contenido, unicidad y límites en la misma prueba: cuerpo sin `itemId` da `422` con `faltaArticulo` y sin fila; `itemId` que no está en Books da `422` con `noEnBooks` y sin fila; artículo repetido da `409` y sin fila; el cuerpo trae `clase: 'consumible_repuesto'` y un `nombre` inventado junto a un `itemId` válido y la fila queda `accesorio` con el nombre de Books (caza M7); el Director Técnico no administrador sigue recibiendo `403` en retirar, reordenar, copiar y borrar de las rutas del super administrador (sólo añade). Dejar escrito en un comentario de la prueba los pares que **no** se activan a la vez (C-falta con C-no-en-Books, y C con D) y que su orden lo fija la dependencia de datos.
- [x] 3.5 **Verde** crear `apps/desk/server/routes/accesoriosModelo.ts` con `registerAccesoriosModeloRoutes(app, { db })`: `requireAuth(db)` sin `requireSuperAdmin`; pasos 404 (`getModelo`), 403 (`puedeAnadirAccesorios`), 422 (`accesorioDelCuerpo`), 422 (`getArticuloPorId`), `crearArticulo` con clase fijada y nombre y SKU de Books, `409` por `ArticuloRepetido`, `201 { id }` (D4). Molde: `apps/desk/server/routes/novedades.ts:39-48` y `apps/desk/server/routes/reasignacion.ts:23-43`.
- [x] 3.6 **Verde** registro en sitio en `apps/desk/server/app.ts`: el `import` al final de la línea 22 y `registerAccesoriosModeloRoutes(app, { db })` al final de la línea 61; confirmar que el fichero conserva su número de líneas.
- [x] 3.7 **Mutación M5** permutar los pasos de la ruta, una permutación cada vez y restaurando: (a) 1 y 2; (b) 2 y 3; (c) 2 y 4. Deben ponerse rojos, respectivamente, el par (a), los pares (c) y (e), y el par (d) de 3.3.
- [x] 3.8 **Mutación M6** abrir el permiso a cualquier área (sólo cargo) y, por separado, a cualquier cargo (sólo área): debe ponerse rojo el Director Técnico con área Comercial y el técnico de Servicio Técnico, respectivamente. Restaurar.
- [x] 3.9 **Mutación M7** tomar clase y nombre del cuerpo en `crearArticulo`: debe ponerse roja la prueba de 3.4. Restaurar.
- [x] 3.10 Anotar en `apply-progress.md` las líneas reales leídas de `apps/desk/server/routes/accesoriosModelo.ts`: el `403` (paso 2), las guardas de los pasos 3 a 5 y la fijación de la clase.
- [x] 3.11 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [x] 3.12 Medir: `git diff --shortstat --no-renames` contra el commit de 3.1 más `wc -l` de los dos ficheros nuevos sin trackear; registrar la cifra. Si pasa de 720, parar y consultar.
- [x] 3.13 **Barrido de citas, regla de mutación 4,** para `apps/desk/server/app.ts` (`grep -rnoE "server/app\.ts:[0-9]+(-[0-9]+)?"`; en la tanda anterior eran 42): `wc -l` igual antes y después y CADA resultado comprobado contra el fichero; las líneas 22 y 61 cambian de **contenido** y hay que releer lo que afirma la frase que las cita. Segundo pase de las abreviadas.
- [x] 3.14 Commit del lote 3.
- [x] 3.15 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [x] 3.16 Asentar el intento.

---

## Lote 4 · cliente

**Depende de:** 1a, 1b, 2 y 3.
**Ficheros:** `apps/desk/src/components/AccesoriosModeloPanel.tsx` (nuevo); en sitio `apps/desk/src/components/Configuracion.tsx` (líneas 2, 33, 127, 165), `apps/desk/src/components/CrearRemision.tsx` (líneas 245-248, 261, 264), `apps/desk/src/components/CatalogoEquipos.tsx` (líneas 3, 561, 638-639, 1018) y `apps/desk/src/api/client.ts` (línea 590 y función al final).
**Estimación:** 175 brutas (panel 110, `Configuracion.tsx` 8, `CrearRemision.tsx` 22, `CatalogoEquipos.tsx` 12, `client.ts` 8, más `lib/` si hiciera falta 15) × 1,8 = **315**.
**Salida prevista si pasa de 720:** no aplica.
**Sin rojo previo, declarado:** los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00; `vitest.config.ts:16`, `vitest.config.ts:17-20`); no se propone `jsdom` ni `@testing-library`. La comprobación es `npm run build` y la verificación en la aplicación (P-5). Si el panel necesita lógica pura (por ejemplo, filtrar lo que ya está en la lista), va en `apps/desk/src/lib/` con su `.test.ts` en rojo **antes**; si no, no hay prueba nueva.

- [ ] 4.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `apps/desk/src/components/Configuracion.tsx`, `apps/desk/src/components/CrearRemision.tsx`, `apps/desk/src/components/CatalogoEquipos.tsx` y `apps/desk/src/api/client.ts` (el diseño da 871 en el último).
- [ ] 4.2 `apps/desk/src/api/client.ts`: línea 590 (el tipo de la respuesta de la copia gana `sinBooks: number`) y, al final del fichero, `anadirAccesorioModelo(modeloId, itemId): Promise<{ id: string }>` hacia `POST /api/catalogo/modelos/:id/accesorios`. Sin rojo previo.
- [ ] 4.3 `apps/desk/src/components/CatalogoEquipos.tsx` en sitio: línea 3 (importa `CLASES_TEXTO_LIBRE`), línea 561 (valor inicial `'consumible_repuesto'`), línea 1018 (el desplegable itera `CLASES_TEXTO_LIBRE`) y líneas 638-639 (el aviso de la copia añade «, N sin artículo de Books no se copiaron» cuando `r.sinBooks > 0`). Sin rojo previo. La línea 1017 y el listado por `CLASES_ARTICULO` de la línea 917 no se tocan.
- [ ] 4.4 Crear `apps/desk/src/components/AccesoriosModeloPanel.tsx` con `AccesoriosModeloPanel({ onVolver })`: molde `apps/desk/src/components/NovedadesPanel.tsx:17-20` (`puede = !!user && puedeAnadirAccesorios(user)`); elige modelo (`getCatalogo`, `apps/desk/src/api/client.ts:317`), enseña sus accesorios activos con SKU (`getArticulosModelo`, `apps/desk/src/api/client.ts:227`), busca en Books (`buscarArticulos`, `apps/desk/src/api/client.ts:222`) y añade; sin campo de nombre ni de clase, ni botones de retirar o reordenar; muestra el error del servidor, no uno propio.
- [ ] 4.5 `apps/desk/src/components/Configuracion.tsx` en sitio: línea 2 (`import`), línea 33 (`'accesorios'` en la unión de `section`), línea 127 (entrada «Accesorios por modelo» junto a la de novedades) y línea 165 (`if (section === 'accesorios') return …`). La línea 100 no se toca. Releer cada línea antes de editar: sin insertar líneas.
- [ ] 4.6 `apps/desk/src/components/CrearRemision.tsx` en sitio: líneas 261 y 264 (itera `data.incluyeDetalle` y pinta `{item}` más el SKU en gris cuando lo hay; la clave y `marcados[item]` siguen siendo el nombre, así que lo que se envía no cambia) y líneas 245-248 (el aviso de lista vacía se reescribe en esas mismas cuatro líneas: la completa el Director Técnico en Configuración, Accesorios por modelo, y lo que llegue sin estar en la lista se anota como novedad).
- [ ] 4.7 Correr `npm run build` y mirar su código de salida (comprobación del cliente, en lugar de prueba).
- [ ] 4.8 **Regla de mutación 3, por escrito:** releer el código ya escrito de los cuatro ficheros, **enumerar** lo que el cliente bloquea, rellena o avisa y nombrar para cada decisión la línea del servidor que la impone, contra la tabla de nueve filas de D6; si aparece una decisión que la tabla no tiene, se añade con su línea o se declara guarda. Escribir el resultado en `apply-progress.md`, sección «Decisiones del cliente»; la tabla de este `tasks.md` se cierra en 5.6.
- [ ] 4.9 Comprobar `wc -l` de los cuatro ficheros editados contra los de 4.1: deben ser iguales (el cliente sólo crece al final de `apps/desk/src/api/client.ts`, y se declara).
- [ ] 4.10 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 4.11 Medir: `git diff --shortstat --no-renames` contra el commit de 4.1 más `wc -l` del panel nuevo sin trackear; registrar la cifra. Si pasa de 720, parar y consultar.
- [ ] 4.12 **Barrido de citas, regla de mutación 4,** `grep -rnoE "<fichero>\.tsx?:[0-9]+(-[0-9]+)?"` para `Configuracion.tsx`, `CrearRemision.tsx`, `CatalogoEquipos.tsx` y `client.ts`; comprobar CADA resultado leyendo qué afirma la frase, en especial las líneas cuyo **contenido** cambia (`CrearRemision.tsx` 245-248, 261 y 264; `CatalogoEquipos.tsx` 561, 638-639 y 1018; `client.ts` 590). Segundo pase de las abreviadas.
- [ ] 4.13 Commit del lote 4.
- [ ] 4.14 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 4.15 Asentar el intento.

---

## Lote 5 · cierre documental

**Depende de:** 2 y 3 (y de las líneas anotadas por 1b y 4). Sólo documentos; sin código de producción ni prueba posible.
**Ficheros:** `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` (nuevo); al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (la última es la 30; la siguiente libre es la **31**); sección nueva al final de `DEPLOY.md`; apartado nuevo al final de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (el vigente: es el último por fecha y el que ya recibió las adendas de F1B-03, F1B-13 y F1B-05; su último apartado es el §10, por lo que el nuevo es el §11); la tabla de la regla 13 de este `tasks.md`.
**Estimación:** 130 brutas (consulta 40, corrección 31 en 30, `DEPLOY.md` 25, paquete 25, tabla de la regla 13 10) × 1,8 = **234**.
**Salida prevista si pasa de 720:** no aplica.

- [ ] 5.1 Anotar el commit de partida del intento y abrirlo. Anotar `wc -l` de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, `DEPLOY.md` y `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`: los tres sólo crecen al final.
- [ ] 5.2 Crear `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` con el envoltorio de `docs/sdd/Consultas_Recuentos_2026-09-25.sql:70-103` (leerlo antes) y la consulta de D8 (`BEGIN TRANSACTION READ ONLY` … `ROLLBACK`). Antes de escribir, **comprobar cada nombre de tabla y columna contra `schema.sql`** (`catalogo_articulos`, `catalogo_modelo_categorias`, `catalogo_articulos_ocultos`, `books.items`, `desk.equipos.modelo_id`, `catalogo_modelos`, `catalogo_marcas`, `catalogo_tipos`) y el criterio contra `apps/desk/server/db/catalogoArticulos.ts:307-317` y `apps/desk/server/db/catalogoArticulos.ts:348-356`. Declarar en el encabezado que ninguna sesión la ejecuta y que es **hipótesis** que PostgreSQL de producción la acepte tal cual.
- [ ] 5.3 Añadir la corrección **31** al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, con el molde de la 30 (encabezado de capítulo «La de F1B-04, accesorios por modelo (31)», aviso de que cita la R08.4, «Dónde», «Texto actual», «Texto propuesto», «Lo que esta entrada NO pide»): M1.2 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1236-1237`) pasa a decir que el accesorio fuera de lista es una novedad y que lo añade el Director Técnico, y la lista de novedades (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1240`) gana «Accesorio fuera de lista». **Releer ambos rangos contra el `.md` antes de citarlos.** Declarar que el SKU como número de parte sigue siendo hipótesis (S-1) y que la fila F1B-04 no se cierra (`cierra: no`).
- [ ] 5.4 Añadir al final de `DEPLOY.md` una sección «Comprobación de lectura tras desplegar F1B-04 (accesorios por modelo)», con el molde de `DEPLOY.md:472` y `DEPLOY.md:496`: sin interruptor nuevo y `.env.example` sin cambios (dos frases); la novedad `accesorio_fuera_de_lista` existe tras el arranque (consulta de lectura) y qué se rompe si falta; la consulta de modelos sin accesorios, a ejecutar por una persona **antes del corte**; y cómo retirar la novedad (`activo = false`, nunca borrarla).
- [ ] 5.5 Añadir al final de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` el §11 «Añadido por `accesorios-lista-por-modelo` (F1B-04, `cierra: no`)»: qué entra (formulario con SKU, cierre del texto libre en las tres vías, novedad sembrada, ruta y pantalla del Director Técnico, consulta), los supuestos S-1, S-3, S-4, S-9 y S-10 para confirmar por Gerencia, y las tareas de persona P-1 a P-6 de este documento **sin casillas**. Leer antes el §10 para copiar su forma.
- [ ] 5.6 **Cerrar la tabla de la regla 13** de este `tasks.md`: sustituir cada «a fijar» por la ruta y la línea REAL, leída del fichero en el último commit de código (apoyándose en lo anotado en `apply-progress.md` por 1b.15, 2.14, 3.10 y 4.8), y comprobar que cada línea dice lo que la fila afirma. Las nueve filas.
- [ ] 5.7 **Barrido de citas, regla de mutación 4:** `grep -rnoE "DEPLOY\.md:[0-9]+(-[0-9]+)?"` y comprobar CADA resultado (las líneas 241, 256 y 261 cambiaron de contenido en el lote 2 y las nuevas se añadieron al final); comprobar que `DEPLOY.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` y el paquete sólo crecieron al final (`wc -l` contra 5.1); verificar cada `ruta:línea` escrita en 5.2 a 5.5 contra su fichero. Ningún ejemplo de cita rota con forma de cita.
- [ ] 5.8 Comprobar con `git diff --stat` contra el commit de partida de la rama que `docs/sdd/ENTRADA.md` y `openspec/config.yaml` siguen sin tocar.
- [ ] 5.9 Correr `npm test`, `npm run typecheck` y `npm run lint` (165 avisos, 0 errores); los tres con código de salida MIRADO.
- [ ] 5.10 Medir: `git diff --shortstat --no-renames` contra el commit de 5.1 más `wc -l` del `.sql` nuevo sin trackear; registrar la cifra.
- [ ] 5.11 Commit del lote 5.
- [ ] 5.12 Correr `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit; código de salida 0 MIRADO.
- [ ] 5.13 Asentar el intento.

---

## Tabla de la regla 13 — decisión del cliente → línea del servidor

Se cierra en 5.6. Una fila «a fijar» es una guarda que esta tanda construye; no se da por hecha hasta tener su línea real.

| # | Decisión del cliente | Servidor |
|---|---|---|
| 1 | Sólo se marcan accesorios de la lista; no hay campo para escribir uno | `apps/desk/server/routes/remision.ts:194-197` (existe, probada) |
| 2 | Pinta nombre y SKU | No decide: llegan de `apps/desk/server/routes/remision.ts:68`, que gana el campo nuevo en la misma línea (línea real a releer en 5.6) |
| 3 | El fuera de lista se marca como novedad y exige texto | `apps/desk/server/routes/remision.ts:158`, con `packages/shared/src/recepcion.ts:97-99` (existen) |
| 4 | «Añadir a mano» no ofrece la clase accesorio | a fijar en 5.6: guarda del alta de `apps/desk/server/routes/catalogo.ts` (lote 1b) |
| 5 | La pantalla del catálogo no ofrece cambiar de clase (`apps/desk/src/components/CatalogoEquipos.tsx:671-673`) | a fijar en 5.6: guarda del `PATCH` de `apps/desk/server/routes/catalogo.ts` (lote 1b) |
| 6 | El aviso de la copia cuenta los no copiados | No decide: a fijar en 5.6, el filtro de la copia de `apps/desk/server/db/catalogoArticulos.ts` (lote 1b) |
| 7 | El panel sólo enseña controles a quien puede | a fijar en 5.6: paso 2 (`403`) de `apps/desk/server/routes/accesoriosModelo.ts` (lote 3) |
| 8 | El panel sólo ofrece artículos de Books y no pide clase | a fijar en 5.6: pasos 3 a 5 de `apps/desk/server/routes/accesoriosModelo.ts` (lote 3) |
| 9 | El panel no ofrece lo que ya está en la lista | `apps/desk/server/db/catalogoArticulos.ts:74`, traducido a `409` en el paso 5 de la ruta (línea del paso a fijar en 5.6) |

---

## En el archivo

No van en los lotes; los hace el `sdd-archive`, con la regla del archivo (la parte con carga de revisión, fusión del delta más `archive-report.md`, se mide antes de aplicar y no supera 800):

- Fusionar el delta de `remisiones` por script comparando bloques: RQ-RE-32 a RQ-RE-36 añadidos y RQ-RE-21 modificado; comprobar los códigos de salida antes de asentar. `openspec/specs/remisiones/spec.md:859` y `openspec/specs/remisiones/spec.md:875-884` («diez») los mueve esa fusión; barrer las citas a esa spec.
- Escribir el `archive-report.md` con **una línea** sobre qué parte del contenido de la fila F1B-04 cubrió (sostiene `cierra: no`) y qué dejó fuera (mitad de salida de E-123, foto por accesorio, número de parte, E-163 a E-167), e incluir la medición de cada intento y de los tres `openspec/config.yaml` que afirman el estado de partida (caso B o C).
- Verificar con `git show --numstat` que el commit de archivo contiene sólo el cambio archivado.

## Tareas de personas — fuera del recuento, archivar no las da por hechas

Sin casillas: son decisiones o comprobaciones de personas, no trabajo de una tanda en este repositorio. **Archivar este cambio no las da por hechas.** La tanda entrega lo que sí puede hacer en el repositorio (la consulta, 5.2; el texto de la corrección, 5.3; las secciones de `DEPLOY.md` y del paquete, 5.4 y 5.5); lo de abajo sólo lo puede hacer quien tiene el acceso o la autoridad. Se comprobó que ninguna describe trabajo que una tanda pudiera hacer en el repositorio.

- **P-1** · Ejecutar en producción la consulta de modelos sin accesorios activos, **antes del corte**. Dueño: quien tenga acceso a la base de producción. Destino: el resultado se lleva a la lista de pendientes del Director Técnico. Queda escrito en: `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (§11), `DEPLOY.md` (sección de F1B-04) y el `archive-report.md`.
- **P-2** · Completar la lista de los modelos que salgan vacíos de P-1. Dueño: Director Técnico. Destino: pantalla Configuración, Accesorios por modelo, ya desplegada. Queda escrito en: el `archive-report.md`.
- **P-3** · Confirmar o corregir S-1 (el SKU hace de número de parte), S-3 (el Director Técnico sólo añade), S-4 (un accesorio que no es artículo de Books ya no se puede añadir), S-9 (la copia omite los accesorios sin artículo) y S-10 (un solo texto por remisión). Dueño: Gerencia. Destino: panel. Queda escrito en: `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (§11); `docs/sdd/ENTRADA.md` no se toca, porque la entrada la abre Supervisión.
- **P-4** · Pegar la corrección 31 en el maestro. Dueño: Gerencia. Destino: maestro (M1.2 y la lista de novedades). Queda escrito en: `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.
- **P-5** · Verificar en la aplicación, tras desplegar: el formulario de entrada enseña nombre y SKU; la pantalla Accesorios por modelo sólo la ve quien puede; «Añadir a mano» ya no ofrece accesorio; «Accesorio fuera de lista» aparece como novedad y pide texto y foto. Dueño: quien verifica la aplicación. Destino: tras el despliegue. Queda escrito en: `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (§11) y el `archive-report.md`.
- **P-6** · Desplegar y comprobar que la novedad `accesorio_fuera_de_lista` existe en producción tras el arranque. Dueño: mantenedor. Destino: producción. Queda escrito en: `DEPLOY.md` (sección de F1B-04).
