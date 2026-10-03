# Tareas: recepción con rotulado, lista de novedades y foto obligatoria en la remisión de entrada (F1B-04, segundo cambio, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\recepcion-rotulacion-foto-entrada`. Preflight: auto · hybrid · ask-on-risk · 800 (válvula 720) · strict_tdd (`npm test`). Un intento de `gentle-ai sdd-attempt` por lote, en este worktree, uno a la vez; **sin fusión a `main` entre lotes** (una sola rama, cuatro commits; la fusión es al cerrar L4). Citas contra el árbol de `f55b7d9` (2026-10-03). Convención del diseño (§0): en ficheros citados, sólo **ediciones en la misma línea** (neto cero) o **añadidos al final**. Una edición en sitio cuenta 2 en el presupuesto.

## Contradicciones spec ↔ diseño (resueltas por regla: la letra de Gerencia primero, después la spec; la letra de Gerencia no habla de ninguna de ellas)

| # | Spec | Diseño | Manda | Lote |
|---|---|---|---|---|
| C1 | RQ-RE-22 (antes de corregirla): la ruta devolvía `clave`, `etiqueta`, `excluye_demas`, `exige_texto` (snake_case) | §2.1/2.2: `NovedadCatalogo` camelCase (`excluyeDemas`, `exigeTexto`) servida tal cual | **Decisión del orquestador (camelCase, convención de la API; ver `Remision` en `types.ts`)**: la ruta responde `NovedadCatalogo` en camelCase tal cual; se corrigió la spec (RQ-RE-22); sin función de conversión en el cliente | L1 |
| C2 | RQ-RE-23: `observaciones` une las etiquetas con `; ` («Rayón o daño estético; Otro: pantalla rota») | §2.1: las une con « · » | **Spec**: `; ` | L2 |
| C3 | RQ-RE-25: una subida sin `categoria` se acepta (201, `NULL`) en **cualquier** remisión | §5.1 L3: en formulario nuevo, categoría ausente → `422` | **Spec**: 201 con `NULL`; esa foto no cuenta para ninguna categoría | L3 |
| C4 | RQ-RE-25: `categoria` presente y fuera de las cuatro, o `novedad` sobre remisión de legado → `422` | §2.1 `categoriaDeFoto`: legado «ignora el cuerpo» → 201 | **Spec**: se valida también en legado | L3 |
| C5 | RQ-RE-26: las marcas de cada novedad se leen **del catálogo por su clave**, aunque esté inactiva | §2.1: `fotosQueFaltan`/`motivoNoEnviable` no reciben catálogo; deducen por `hayNovedad` y la instantánea | **Spec**: ambas reciben `catalogo` (R2 importa también `listNovedades`; R5 lo pasa en la misma línea) | L3 |

Hueco (no contradicción): RQ-RE-21 exige que quitar `catalogo_novedades` de `PUBLIC_TABLES` ponga rojo el guardián y §6 no lo lista; se añade como **M-F7** en L1. Las citas de la spec al serial (`:154-157`) y al `409` (`:174-183`) difieren de las del diseño (152/155 y 177/183): al aplicar M-P1 y M-P2 se leen contra el fichero.

## Review Workload Forecast

Fórmula: pruebas = código × 1,8 (en L3 se toma la enumeración del diseño, 220, por mayor); casillas = 2 por casilla marcada; `apply-progress.md` y ediciones de alineación aparte.

| Lote | Código | Pruebas | Casillas | apply-progress y docs | Total | Frente a 720 / 800 |
|---|---|---|---|---|---|---|
| L1 esquema + catálogo + lectura | 115 | 207 | 28 | 41 | **≈ 391** | margen 329 / 409 |
| L2 alta: novedades y rotulado | 130 | 234 | 26 | 51 | **≈ 441** | margen 279 / 359 |
| L3 fotos por categoría y puertas de `/enviar` | 94 | 220 | 28 | 53 | **≈ 395** | margen 325 / 405 |
| L4 cliente y cierre | 216 | 135 | 28 | 162 (regla 13 30, ENTRADA 45, correcciones 25, DEPLOY 12, barrido 20, progreso 30) | **≈ 541** | margen 179 / 259 |

Total ≈ 1.768. Ningún lote pasa de 720. Si la medida de L4 lo rozara, se parte: **4a** = 4.1-4.5 y **4b** = el resto. L1+L2 juntos serían ≈ 832: no se juntan. Medida real de cada lote: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; binarios aparte.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

(`size-exception` en el sentido del registro de intentos: no hay PR, una rama, cuatro commits; el techo operativo es 800, la válvula 720.)

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| L1 | Tabla, siembra, columnas y `GET /api/novedades-remision` (RQ-RE-21, RQ-RE-22) | `npx vitest run packages/zoho-sync/src/db/novedadesSiembra.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/recepcion.test.ts` | `migrate` contra pg-mem + `GET` con sesión | `git revert` de L1; tabla y columnas quedan sin uso |
| L2 | Alta: validación, instantánea, derivados, rotulado, legado (RQ-RE-23, 24, 27, 17) | `npx vitest run packages/shared/src/recepcion.test.ts apps/desk/server/recepcion.test.ts apps/desk/server/remisiones.test.ts` | `POST /api/remisiones` contra pg-mem | `git revert` de L2 (L3 depende de él: revertir L3 antes) |
| L3 | Categoría de foto y puertas de `/enviar` (RQ-RE-25, 26, 13, 08) | ídem + `apps/desk/server/fotoNovedad.test.ts` | subida multipart y `POST /:id/enviar` con n8n simulado | `git revert` de L3 |
| L4 | Formulario (RQ-RE-19) y cierre documental | `npx vitest run apps/desk/src/lib/recepcionForm.test.ts apps/desk/src/lib/envioRemision.test.ts` | `npm run build` y comprobación de persona en la app (`.tsx` fuera de la red, F0-00) | `git revert` de L4 deja el cliente viejo funcionando por la vía de legado |

## Lote 1 — esquema, catálogo y lectura (RQ-RE-21, RQ-RE-22)

- [x] 1.1 (hecho por el orquestador; línea base ejecutada y anotada en `apply-progress.md`) Abrir el intento 1 (partida: commit de planificación con estos artefactos; si hay algo sin commitear de la carpeta, se commitea antes). Línea base: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores) y `wc -l` de `routes/remision.ts` (397), `db/remisiones.ts`, `types.ts`, `migrate.ts`, `migrate.test.ts`, `app.ts`, `schema.sql` (676). Si `registro.test.ts:220` se pone rojo por la carpeta del cambio, se anota (hipótesis: F1B-04 ya figura en esa lista).
- [x] 1.2 Alinear spec y diseño (C1 y hueco M-F7): C1 se resuelve por decisión del orquestador (camelCase: se corrige la delta de RQ-RE-22; el diseño §2.1-2.2 ya lo decía) y añadir M-F7 a §6. Anotar en `apply-progress.md`.
- [x] 1.3 RED `packages/zoho-sync/src/db/migrate.test.ts`, cifras del §1.3 **en sitio** (`:282-286` → 41 tablas y 28 de la app; `:374-377` → 50 ALTER y 27 calificadas; `:385` → siete identidades con `'public.remision_fotos'`). Confirmar rojo con `npx vitest run packages/zoho-sync/src/db/migrate.test.ts`.
- [x] 1.4 RED nuevo `packages/zoho-sync/src/db/novedadesSiembra.test.ts` (`freshDb` local): siembra 1-6 del §5.1 (diez filas en orden y etiquetas · marcas únicas · reejecutar con `schemaStatements()` · lo editado se conserva · exactamente diez sentencias · seis columnas y sólo seis `ALTER`, sin relleno). Rojo: tabla inexistente.
- [x] 1.5 RED nuevo `apps/desk/server/recepcion.test.ts`, bloque de lectura: sin sesión `401`; con sesión, diez en orden con `clave`, `etiqueta`, `excluyeDemas`, `exigeTexto`; una desactivada por SQL → nueve. Rojo: ruta inexistente.
- [x] 1.6 GREEN `packages/zoho-sync/src/db/schema.sql`: bloque al final desde la 677 (§1.1; sin `;` en comentarios, `public.` en todo) y `migrate.ts:73` en sitio (`'catalogo_novedades'`). Verdes 1.3 y 1.4. Anotar las hipótesis 1 y 2 (pg-mem acepta `ON CONFLICT … DO NOTHING` con literales y `ADD COLUMN IF NOT EXISTS … jsonb`); si falla la primera, reserva del §1.2 con literales.
- [x] 1.7 GREEN `packages/shared/src/recepcion.ts` (nuevo: `NovedadCatalogo`, `novedadesActivas`, constantes de categorías), una línea final en `packages/shared/src/index.ts` y `apps/desk/server/db/novedades.ts` (`listNovedades`, sin filtrar `activo`).
- [x] 1.8 GREEN `apps/desk/server/routes/novedades.ts` (`GET /api/novedades-remision`, `requireAuth`, responde camelCase tal cual) y `apps/desk/server/app.ts` en sitio (importación tras `:22`, registro tras `:61`). Verde 1.5; comprobar la hipótesis 5 (ninguna ruta captura la nueva antes).
- [x] 1.9 Mutaciones del fichero vigilado (regla 2), una a una, revertidas con `git diff`: **M-F1** quitar `public.` al `CREATE` → roja «toda tabla del esquema está clasificada» (`migrate.test.ts:266`; las funcionales siguen verdes); **M-F2** quitar `public.` a una `ALTER` de `remision_fotos` → roja la de `:345` y el recuento; **M-F7** quitar el nombre de `PUBLIC_TABLES` → roja el mismo guardián; **M-F5** añadir un `UPDATE public.remisiones SET novedades = …` → roja siembra 6.
- [x] 1.10 Mutaciones de dato sobre el catálogo, revertidas: **M-F3** borrar una fila de la siembra → rojas siembra 1 y 5; **M-F4** cambiar `exige_texto` de `otro` (o `excluye_demas` de `sin_novedad`) → roja siembra 2; **M-F6** quitar `ON CONFLICT (clave) DO NOTHING` a una fila → roja siembra 3; **M-D2** (lectura) no filtrar `activo` en `novedadesActivas` → roja «nueve».
- [x] 1.11 Cierre verde: `npm test`, `npm run typecheck`, `npm run lint` con **exactamente 165 avisos y 0 errores**.
- [x] 1.12 `wc -l` antes/después y `git diff --numstat`: `migrate.ts`, `migrate.test.ts` y `app.ts` a **cero netas** (inserciones = borrados); `schema.sql` = 676 + bloque (≈ 31), sin borrados; `index.ts` sólo añade al final.
- [x] 1.13 Medida del lote antes de commitear contra la válvula de 720 (`git diff --shortstat --no-renames <partida>` más `wc -l` de `novedadesSiembra.test.ts`, `recepcion.test.ts`, `recepcion.ts`, `novedades.ts` ×2). Si va a pasar, parar y partir.
- [x] 1.14 Commit `feat(remisiones): catálogo de novedades de entrada y su ruta de lectura (F1B-04, cierra: no)`; detector `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con salida 0; cerrar el intento (`settle`: hecho por el orquestador), sin fusionar a `main`.

## Lote 2 — alta: novedades y rotulado (RQ-RE-23, RQ-RE-24, RQ-RE-27, RQ-RE-17)

- [x] 2.1 (intento abierto por el orquestador; hipótesis 3 anotada en `apply-progress.md`) Abrir el intento 2 desde el commit de L1; línea base (`npm test`, typecheck, lint 165) y `wc -l` de `routes/remision.ts` (397), `db/remisiones.ts`, `types.ts`. Hipótesis 3: `remisiones.test.ts` y `fotoNovedad.test.ts` verdes **sin editarlos**; anotar.
- [x] 2.2 Alinear spec y diseño (C2): manda la spec; en `design.md` §2.1 `componerObservaciones` une con `; `. Anotar en `apply-progress.md`.
- [x] 2.3 RED `packages/shared/src/recepcion.test.ts` (nuevo): los seis rechazos de `validarRecepcion` con su texto, **PA-3** (cada par vecino de pasos activos a la vez → el primero del orden), deduplicado y orden por `orden`, `hayNovedad` en los dos sentidos, `componerObservaciones` (una, varias, con texto, «Sin novedad») con separador `; `. Rojo: exports inexistentes.
- [x] 2.4 GREEN `packages/shared/src/recepcion.ts`: `validarRecepcion` (orden interno fijo del §2.1), `componerObservaciones`, `RecepcionValidada`; `packages/shared/src/types.ts:735` en sitio (`Remision` gana los cuatro campos en la misma línea).
- [x] 2.5 RED `apps/desk/server/recepcion.test.ts`, bloque de alta: los seis `422` y `novedades: null`/`'x'` → `422`; catálogo vacío (`DELETE`) → `422` «no está cargada»; `201` con instantánea, `observaciones` compuesta y `hay_novedad` derivado; cuerpo con `observaciones`, `hayNovedad: false`, `rotuladoPor` y `rotuladoAt` falsos **no** se guardan; `rotulado_por` = usuario de la sesión y `rotulado_at` entre el antes y el después; alta de legado deja `novedades IS NULL`; instantánea intacta al editar una etiqueta; **D1-D3** por SQL (`exige_texto` apagada en «Otro» → `201`; `exige_texto` en otra fila la exige; `excluye_demas` en otra fila da `422`). Rojo.
- [x] 2.6 RED posición, mismo fichero, cada una con las dos guardas activas: **PA-1** (sin serial y `novedades: []` → «Falta el serial»; **nace verde**, su rojo es M-P1) y **PA-2** (remisión pendiente previa sin `permitirSegunda` y `novedades: []` → `422` de novedades, no `409`; RED real).
- [x] 2.7 GREEN servidor: `apps/desk/server/services/recepcion.ts` (`resolverRecepcion`; `undefined` = legado sin leer la base); `routes/remision.ts` en sitio: R2 (import, línea 7), R3 (línea 158, la guarda del alta) y R4 (`:249-250`, derivados); `db/remisiones.ts` en sitio (`toRemision` `:25`, `CreateRemisionInput` `:40`, `INSERT` `:47-50` con `novedades` por `JSON.stringify`/`null` **sin `J`**, `rotulado_at = new Date()` solo con recepción). Verdes 2.5 y 2.6.
- [x] 2.8 Mutaciones de posición, revertidas con `git diff`: **M-P1** línea 158 por encima de la guarda del serial → roja PA-1; **M-P2** por debajo del `409` de pendiente → roja PA-2; **M-P6** permutar dos pasos de `validarRecepcion` → roja PA-3.
- [x] 2.9 Mutaciones de dato y de legado, revertidas: **M-D1** decidir por `clave === 'otro'` → roja D1 (en los dos sentidos); **M-D2** no filtrar `activo` → roja D2; **M-D3** decidir por `clave === 'sin_novedad'` → roja D3; **M-D4** lista constante → roja «catálogo vacío»; **M-L1** escribir `novedades` con `J` → roja «legado deja `novedades IS NULL`».
- [x] 2.10 Cierre verde: `remisiones.test.ts` y `fotoNovedad.test.ts` verdes sin editar (`git diff` de ambos vacío); `npm test`, `npm run typecheck`, `npm run lint` con exactamente 165 avisos y 0 errores.
- [x] 2.11 `wc -l` antes/después y `git diff --numstat`: `routes/remision.ts` = **397**, `db/remisiones.ts` y `types.ts` a cero netas.
- [x] 2.12 Medida del lote contra la válvula de 720 (misma fórmula; nuevos: `recepcion.ts` shared, `recepcion.test.ts` shared, `services/recepcion.ts`). Si va a pasar, parar y partir.
- [x] 2.13 (el `settle` lo hace el orquestador) Commit `feat(remisiones): el alta valida y compone las novedades y exige el rotulado (F1B-04, cierra: no)`; detector con salida 0; cerrar el intento.

## Lote 3 — fotos por categoría y puertas de `/enviar` (RQ-RE-25, RQ-RE-26, RQ-RE-13, RQ-RE-08)

- [ ] 3.1 Abrir el intento 3 desde el commit de L2; línea base y `wc -l` (`routes/remision.ts` 397, `db/remisiones.ts`, `types.ts`); `remisiones.test.ts` y `fotoNovedad.test.ts` verdes sin editar. La hipótesis 4 (multer deja los campos de texto en `req.body`) la comprueba la prueba 3.5; anotar.
- [ ] 3.2 Alinear spec y diseño (C3, C4, C5): manda la spec. En `design.md` §2.1 y §3: `categoriaDeFoto` valida también en legado; sin categoría → 201 `NULL`; `fotosQueFaltan` y `motivoNoEnviable` reciben `catalogo` (marcas por clave, aunque inactiva); R2 importa `listNovedades` y R5 lo pasa en la misma línea (neto cero). Anotar en `apply-progress.md`.
- [ ] 3.3 RED `packages/shared/src/recepcion.test.ts`, al final: `fotosQueFaltan`; `motivoNoEnviable` (legado con `MOTIVO_FOTO_LEGADO` literal; **PE-3**: sin rotulado y sin fotos → rotulado; sin embalaje y sin foto de novedad → mínimas; nombra **todas** las que faltan; foto sin categoría no cuenta; novedad inactiva sigue exigiendo; `excluye_demas` no exige foto); `categoriaDeFoto` (legado y nuevo: inválida → error, `novedad` no marcada → error, sin categoría → `null`, otra categoría descarta `novedad`). Rojo.
- [ ] 3.4 GREEN `packages/shared/src/recepcion.ts` (`fotosQueFaltan`, `motivoNoEnviable`, `categoriaDeFoto`, `ETIQUETA_CATEGORIA_FOTO`, `MOTIVO_FOTO_LEGADO`; `faltaFotoPorNovedad` se importa de `remision.ts`, que **no se edita**) y `packages/shared/src/types.ts:622` en sitio (`RemisionFoto` gana `categoria` y `novedad`).
- [ ] 3.5 RED `apps/desk/server/recepcion.test.ts`, bloque de subida: categoría fuera de las cuatro → `422` y sin foto (también en legado); `categoria = 'novedad'` con clave no marcada o ausente → `422`; sobre legado → `422`; sin categoría → `201` con `NULL` (nuevo y legado); categoría válida se guarda; `GET /api/remisiones/:id` trae `categoria` y `novedad` sin base64; **PS-1** (SVG y categoría inválida → `415`; **nace verde**, su rojo es M-P7).
- [ ] 3.6 RED mismo fichero, bloque `/enviar`: **PE-1** (anulada y `ok` → `409`; **nace verde**, su rojo es M-P3); **PE-2** (sin fotos → `422`, sin n8n, `enviado_at` nulo; se suben y se reenvía **de inmediato** → `200`; RED real); `rotulado_at` anulado por SQL → `422` de rotulado; faltan mínimas y nombra categorías; falta la foto de una de dos novedades y la nombra; foto sin categoría no cuenta; novedad retirada después sigue exigiendo; «Sin novedad» con las tres mínimas → `200`; completo → `200`; legado con `hay_novedad` y cero fotos → `422` con el texto literal de hoy.
- [ ] 3.7 Caracterización del payload hacia n8n (**nace verde**, como `fotoNovedad.test.ts:155-156`): `Object.keys(cuerpo).sort()` = las diez claves de `RemisionWebhookPayload`; `fotos[0]` con `data`, `fileName`, `mimeType`; `observaciones` compuesta. La detecta M-N1 (3.10).
- [ ] 3.8 GREEN servidor: `db/remisiones.ts` en sitio (`addFoto` `:189-199`, `listFotos` `:202-211`; `listFotosConContenido` no se toca); `routes/remision.ts` en sitio: R1 (import, `:4`), R2 (import de `listNovedades`), R5 (`:287-293`, puerta única con `motivoNoEnviable`) y R6 (`:380` guarda `rem`; `:384` categoría; `:385-387` `addFoto`). Verdes 3.5-3.7.
- [ ] 3.9 Mutaciones de posición, revertidas con `git diff`: **M-P3** puerta de `/enviar` por encima de «anulada» (`:279`) → roja PE-1; **M-P4** por debajo de `reclamarEnvio` (`:299`) → roja PE-2 (el reintento da `409`); **M-P5** permutar ramas de `motivoNoEnviable` → roja PE-3; **M-P7** guarda de categoría por encima del `415` (`:383`) → roja PS-1.
- [ ] 3.10 **M-N1** añadir `novedades: r.novedades` a `buildRemisionPayload` (`remisionWebhook.ts:40-65`) → roja la prueba del payload; revertir y comprobar `git diff -- apps/desk/server/remisionWebhook.ts` vacío.
- [ ] 3.11 Cierre verde: `remisiones.test.ts` y `fotoNovedad.test.ts` verdes sin editar; `npm test`, `npm run typecheck`, `npm run lint` con exactamente 165 avisos y 0 errores.
- [ ] 3.12 `wc -l` antes/después y `git diff --numstat`: `routes/remision.ts` = **397**, `db/remisiones.ts` y `types.ts` a cero netas.
- [ ] 3.13 Medida del lote contra la válvula de 720. Si va a pasar, parar y partir.
- [ ] 3.14 Commit `feat(remisiones): foto por categoría y puertas de envío del formulario nuevo (F1B-04, cierra: no)`; detector con salida 0; cerrar el intento.

## Lote 4 — cliente y cierre (RQ-RE-19, RQ-RE-18)

- [ ] 4.1 Abrir el intento 4 desde el commit de L3; línea base y `wc -l` de `client.ts` y `CrearRemision.tsx` (antes).
- [ ] 4.2 RED nuevo `apps/desk/src/lib/recepcionForm.test.ts` (objetos en lugar de `File`): `alternarNovedad` por marca y no por clave, en los dos sentidos; `planDeFotos` (orden equipo, accesorios, embalaje, novedades; descarta las desmarcadas); `motivoNoCreable` (cada motivo, con las funciones compartidas); `puedeContinuarSinPendientes` (prefijo insuficiente y suficiente). Rojo: módulo inexistente. (Sin `catalogoDeRespuesta`: C1 resuelto en camelCase.)
- [ ] 4.3 GREEN `apps/desk/src/lib/recepcionForm.ts` (nuevo; consume `packages/shared`, sin copia de reglas; `File` sólo como tipo).
- [ ] 4.4 Mutaciones, revertidas: `alternarNovedad` por `clave === 'sin_novedad'` → roja; permutar el orden de `planDeFotos` → roja; `puedeContinuarSinPendientes` siempre `true` → roja; `motivoNoCreable` sin mirar el plan → roja.
- [ ] 4.5 `apps/desk/src/api/client.ts`: en sitio `:534-535` (`CrearRemisionPayload`) y `:554-555` (`subirFotoRemision` con `meta`); `fetchNovedadesRemision` **al final**, devuelve la respuesta tal cual (camelCase). Sin prueba propia (la lógica está en 4.2); se declara.
- [ ] 4.6 `apps/desk/src/components/CrearRemision.tsx` según la tabla del §8.4 (cero netas hasta la 270). Sin rojo previo: `.tsx` fuera de la red por decisión de Gerencia (F0-00); no se propone jsdom. `envioRemision.ts` y `envioRemision.test.ts` intactos (`git diff` vacío).
- [ ] 4.7 Cierre verde: `npm run build`, `npm test`, `npm run typecheck`, `npm run lint` con exactamente 165 avisos y 0 errores.
- [ ] 4.8 `wc -l` antes/después: `client.ts` cero netas en lo existente (más la función final); `routes/remision.ts` sigue en **397**; `CrearRemision.tsx` con su diferencia declarada.
- [ ] 4.9 Regla 13 por escrito en `apply-progress.md`: las once decisiones del §7 una a una, con la línea del servidor fijada contra el árbol de ese día; declarar que el aviso de lista no cargada y «Continuar sin fotos» son comodidad probada por PE-2, y lo que sigue abierto (E-081: omitir `novedades` entra por legado).
- [ ] 4.10 Barrido de citas (regla 4) **sin excluir `openspec/changes/archive/`** sobre todos los ficheros editados: `grep -rnoE "<fichero>\.(ts|tsx):[0-9]+(-[0-9]+)?"` para `routes/remision`, `db/remisiones`, `types`, `migrate`, `migrate.test`, `app`, `client`, `CrearRemision`, más `git diff --numstat` de neto cero; patrones del §10 (`routes/remision\.ts:(28[7-9]|29[0-3])` ×12, `CrearRemision\.tsx:[0-9]+` ×49, `migrate\.test\.ts:(28[2-7]|37[4-9]|38[0-6])`). Cada resultado leído contra el fichero, principio y final del rango por separado.
- [ ] 4.11 Pase de abreviadas a mano (`openspec/specs/remisiones/spec.md`, `CLAUDE.md`, comentarios de los ficheros editados) y reparación por casos: A (a la línea de hoy), B (nombrar la revisión: los cuatro `Paquete_de_Despliegue_*.md`, la cita de `ENTRADA.md` a la línea 273, propuesta y exploración de este cambio), C (se conserva y se añade qué lo cerró). No se toca `archive/2026-09-25-foto-solo-con-novedad/` ni ningún otro archivado.
- [ ] 4.12 `docs/sdd/ENTRADA.md`, **al final**, desde **E-163** (otra rama usa E-160 a E-162): E-163 foto por cada novedad o basta una · E-164 quién edita la lista y dónde · E-165 «Falta un accesorio» y foto · E-166 equipo sin accesorios o sin embalaje · E-167 momento del rotulado · E-168 hallazgo: la mitad de entrada de E-123 no tiene clave `decision/` en `openspec/config.yaml` · E-169 ampliación de IV-12 (las guardas nuevas del alta corren antes de «Orden de venta no encontrada», `routes/remision.ts:220`). Nada de reuniones.
- [ ] 4.13 Texto de corrección para el maestro, **al final** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (el `.docx` no se toca; pasajes M1.2/M2.1 y los de `R08.4.md:1239-1241` y `:2278-2279`); y `DEPLOY.md`: comprobación de lectura tras desplegar, antes de dar el cambio por publicado (diez filas en `public.catalogo_novedades` y las seis columnas en `information_schema.columns`; sin interruptores nuevos, `.env.example` no cambia).
- [ ] 4.14 Medida del lote contra la válvula de 720 (si va a pasar, partir en 4a = 4.1-4.5 y 4b); commit `feat(remisiones): formulario de recepción con novedades, rotulado y fotos por categoría (F1B-04, cierra: no)`; detector con salida 0; cerrar el intento.

## De personas — no son casillas; archivar NO las da por hechas

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Confirmar la lista de diez novedades antes de publicarla | Servicio Técnico | Condición de **publicación**, no de construcción ni de fusión | `docs/sdd/ENTRADA.md` (E-164) y paquete de despliegue |
| Comprobar que la etiqueta que imprime n8n lleva el código del ticket | Quien administra n8n | Condición de publicación | `archive-report.md` y paquete de despliegue |
| Comprobar el formulario en la app (Persona-1 a Persona-5 de RQ-RE-19; el `.tsx` no tiene pruebas por decisión F0-00) | Servicio Técnico | Tras publicar L4 | `archive-report.md` y la sección de personas de `openspec/specs/remisiones/spec.md` |

## Instrucciones para `verify` y `archive` (SIN casilla)

- `verify`: re-ejecutar M-P1 a M-P7, M-F1 a M-F7, M-D1 a M-D4, M-N1 y M-L1 contra el árbol de ese día; contrastar dato a dato los informes de los subagentes; comprobar `routes/remision.ts` = 397 líneas y las cinco alineaciones C1-C5 reflejadas en `design.md`. El `verify-report.md` es un sumando del presupuesto.
- `archive`: medir antes de aplicar la parte revisable (fusión del delta de `remisiones` más `archive-report.md`) ≤ 800; commit de archivo sólo con este cambio (`git show --numstat`); `cierra: no`, F1B-04 sigue «en curso»; segundo barrido de citas tras fusionar en `openspec/specs/remisiones/spec.md`. `archive-report.md` en una línea: cubre rotulado, lista de novedades como dato y foto por categoría; deja fuera accesorios (E-100) y la mitad de salida de E-123.

**Recuento de casillas ejecutables:** L1 14 · L2 13 · L3 14 · L4 14 = **55**. Las tareas de persona quedan fuera.
