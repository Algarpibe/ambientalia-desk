# Informe de verificación: recepcion-rotulacion-foto-entrada (F1B-04, `cierra: no`)

Modo: `hybrid` · Strict TDD activo · Árbol verificado: rama `recepcion-rotulacion-foto-entrada`, HEAD `5385d81`, base `f55b7d9`.
Verificador independiente: todo lo de abajo se EJECUTÓ en este árbol; no se tomó nada de `apply-progress.md` sin contraste.

## Veredicto

**PASS WITH WARNINGS** — 0 CRITICAL · 4 WARNING · 5 SUGGESTION.

Las 55 casillas de `tasks.md` están marcadas (las tareas de persona están fuera del recuento, declaradas aparte). Los
cinco comandos de cierre salen con 0, las siete mutaciones reproducidas se ponen rojas con el árbol limpio después, y
el cero neto de `routes/remision.ts` se cumple. Los avisos son un escenario sin prueba por ejecución propia, una
carencia de entorno (pg-mem), el agujero declarado de la vía de legado y el margen justo del presupuesto del archive.

## 1. Comandos de cierre (código de salida comprobado con `$?`, no con la cola de la salida)

| Comando | Salida | Evidencia |
|---|---|---|
| `npm test` | **0** | 182 ficheros verdes + 1 omitido (`migrate.integration.test.ts`); 2.758 pruebas verdes, 2 omitidas; hash de la salida `e2ab5a8ff85bf09` |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` sin errores |
| `npm run build` | **0** | `built in 1.52s` |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`: exactamente las 165 de la línea base |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | sin citas rotas ni cabeceras inválidas (antes de este informe; se repite tras el commit) |

`git status` limpio tras las mutaciones (cada una revertida con `git checkout --`).

## 2. Cero líneas netas (medido)

| Fichero | Esperado | Medido |
|---|---|---|
| `apps/desk/server/routes/remision.ts` | 397 líneas | **397** (`wc -l`); `git diff --numstat` 14/14 |
| `apps/desk/src/components/CrearRemision.tsx` | sin desplazar por encima de la 271 | 368 a 394 (+26). Todos los hunks anteriores a la 271 son del mismo tamaño (`-3 +3`, `-51,2 +51,2`, `-97,5 +97,5`, …); la primera inserción es `-270,0 +271,2`. **Cumple** |
| `apps/desk/server/remisiones.test.ts`, `apps/desk/server/fotoNovedad.test.ts`, `apps/desk/server/remisionWebhook.ts`, `apps/desk/src/lib/envioRemision.ts` | sin diff | `git diff f55b7d9 HEAD` **vacío** en los cuatro |
| `app.ts`, `db/remisiones.ts`, `types.ts`, `migrate.ts`, `migrate.test.ts` | neto cero | `2/2`, `12/12`, `3/3`, `1/1`, `10/10` |
| `packages/zoho-sync/src/db/schema.sql` | sólo añade al final | `31/0`: el bloque va de la 677 a la 707 |

## 3. Matriz escenario → prueba (ejecutada en el `npm test` completo)

Delta: 12 requisitos (7 nuevos, RQ-RE-21 a 27; 5 modificados, 08, 13, 17, 18, 19) y **59 escenarios automáticos**, más
las 5 comprobaciones de persona de RQ-RE-19 (aparte). Todas las pruebas de la matriz pasaron.

| Requisito · escenario | Prueba (ruta:línea) | Veredicto |
|---|---|---|
| RQ-RE-21 · diez filas, orden, marcas únicas | `packages/zoho-sync/src/db/novedadesSiembra.test.ts:40`, `:46` | Cubierto |
| RQ-RE-21 · reaplicar no duplica ni pisa | `packages/zoho-sync/src/db/novedadesSiembra.test.ts:55`, `:64` | Cubierto |
| RQ-RE-21 · el guardián conoce tabla y ALTER; relleno en rojo | `packages/zoho-sync/src/db/novedadesSiembra.test.ts:84` y el guardián de `packages/zoho-sync/src/db/migrate.test.ts` (M-F2, M-F5, M-F7 reproducidas, §5) | Cubierto |
| RQ-RE-21 · cambiar una marca cambia lo que el servidor acepta | `apps/desk/server/recepcion.test.ts:199`, `:209`, `:221`, `:230` (D1a, D1b, D3a, D3b) | Cubierto |
| RQ-RE-22 · activas en orden con marcas; sin sesión 401 | `apps/desk/server/recepcion.test.ts:19`, `:25`, `:36` | Cubierto |
| RQ-RE-23 · los seis `422`; instantánea y derivados; «Sin novedad» | `apps/desk/server/recepcion.test.ts:65`, `:96`, `:119`, `:135` y `packages/shared/src/recepcion.test.ts:42` | Cubierto |
| RQ-RE-23 · la instantánea no cambia al editar el catálogo | `apps/desk/server/recepcion.test.ts:165` | Cubierto |
| RQ-RE-23 · A<C, C<D, novedades antes que rotulado | `apps/desk/server/recepcion.test.ts:245`, `:254`, `:265`, `:273` | Cubierto (mutación de posición reproducida) |
| RQ-RE-23 · catálogo sin filas activas | `apps/desk/server/recepcion.test.ts:107` | Cubierto |
| RQ-RE-24 · sin confirmación; persona y hora del servidor; legado sin rotulado | `apps/desk/server/recepcion.test.ts:86`, `:144`, `:177` | Cubierto |
| RQ-RE-25 · categoría válida, desconocida, de novedad, legado, sin categoría | `apps/desk/server/recepcion.test.ts:304`, `:317`, `:324` | Cubierto |
| RQ-RE-25 · el 415 gana a la categoría | `apps/desk/server/recepcion.test.ts:334` | Cubierto (nace verde; su rojo es la mutación de posición de la subida, no repetida aquí) |
| RQ-RE-26 · sin rotulado; faltan mínimas y las nombra; foto por novedad; novedad retirada; «Sin novedad» → 200 | `apps/desk/server/recepcion.test.ts:370`, `:378`, `:391`, `:399` | Cubierto |
| RQ-RE-26 · una foto sin categoría no cuenta («tres fotos sin categoría → 422 mínimas») | `apps/desk/server/recepcion.test.ts:378` (las tres mínimas más una sin categoría) y `packages/shared/src/recepcion.test.ts:231` | **Parcial**: la variante literal «sólo tres sin categoría» se prueba en la función compartida, no por la ruta |
| RQ-RE-26 · orden interno rotulado, mínimas, novedad | `packages/shared/src/recepcion.test.ts:272` (PE-3) | Cubierto en la función que la ruta ejecuta; la ruta no repite las permutaciones |
| RQ-RE-26 y RQ-RE-08 · anulada y «ya enviada» ganan; el 422 no reclama | `apps/desk/server/recepcion.test.ts:351`, `:360` | Cubierto (mutación de posición reproducida) |
| RQ-RE-27 · legado: alta como hoy; bloqueo con cero fotos; sin novedad pasa | `apps/desk/server/recepcion.test.ts:177`, `:409`; `apps/desk/server/fotoNovedad.test.ts:61`, `:117` | Cubierto |
| RQ-RE-27 · `novedades` nulo o que no es lista → 422 | `apps/desk/server/recepcion.test.ts:65` (casos 2 y 3 de la tabla) | Cubierto |
| RQ-RE-27 · **remisión con origen histórico no queda sujeta** | ninguna prueba nueva nombra `historico` | **SÓLO POR LECTURA** (W1) |
| RQ-RE-13 · listado con `categoria`/`novedad` sin base64; el payload no gana la categoría | `apps/desk/server/recepcion.test.ts:324`, `:419` | Cubierto |
| RQ-RE-17 · legado persiste; no declarado; el cuerpo no manda; payload sin campos nuevos | `apps/desk/server/fotoNovedad.test.ts:28`, `:137`; `apps/desk/server/recepcion.test.ts:144`, `:419` | Cubierto |
| RQ-RE-18 · predicados: legado, selección, derivación, lo que falta | `packages/shared/src/recepcion.test.ts:42`, `:135`, `:190`, `:224`, `:245` | Cubierto |
| RQ-RE-19 · lógica del formulario (excluyente, plan de fotos, motivo, continuar) | `apps/desk/src/lib/recepcionForm.test.ts:15`, `:37`, `:57`, `:92`, `:109` | Cubierto (lógica pura; el `.tsx` queda fuera de la red por decisión de Gerencia) |
| RQ-RE-19 · Persona-1 a Persona-5 | — | Tarea de PERSONA (Servicio Técnico); archivar no las da por hechas |

## 4. Cumplimiento TDD estricto

| Comprobación | Resultado |
|---|---|
| Tabla de evidencia TDD en `apply-progress.md` | Presente por lote (L1, L2, L3, L4a) con RED literal |
| Ficheros de prueba existen y pasan | Cuatro nuevos (`apps/desk/server/recepcion.test.ts`, `packages/shared/src/recepcion.test.ts`, `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, `apps/desk/src/lib/recepcionForm.test.ts`) más `migrate.test.ts` editado en sitio: **verdes** |
| Triangulación | D1-D3 en los dos sentidos, seis rechazos con variantes de tipo, `it.each` de nuevo y legado |
| Calidad de aserciones | Sin tautologías ni bucles fantasma: los bucles de `apps/desk/server/recepcion.test.ts:86` y de `subirTodas` recorren literales no vacíos; los `toEqual([])` de `packages/shared/src/recepcion.test.ts:242` y `:251` tienen compañera con contenido en `:240` |
| Capas | Unitaria e integración con pg-mem y supertest; ninguna de interfaz (decisión F0-00, no es carencia) |

## 5. Mutaciones reproducidas por el verificador (aplicadas, ejecutadas, revertidas con `git checkout --`, árbol limpio)

| Mutación | Cambio | Rojo observado |
|---|---|---|
| Posición del alta | línea 158 de `apps/desk/server/routes/remision.ts` por debajo del `409` de pendiente | **1 roja**: PA-2 (`apps/desk/server/recepcion.test.ts:254`) |
| Posición de `/enviar` | puerta de contenido por debajo de `reclamarEnvio` | **5 rojas**: PE-2, mínimas, foto por novedad, foto sin categoría, legado (el reintento da `409` y `enviado_at` queda fijado) |
| Fichero vigilado (M-F2) | quitar `public.` a la `ALTER` de `remision_fotos.categoria` en `packages/zoho-sync/src/db/schema.sql` | **4 rojas**: siembra 6 y tres del guardián (clasificación de ALTER, sin calificar igual a DESK_TABLES, recuento 50/27/23) |
| Fichero vigilado (M-F7) | quitar `catalogo_novedades` de `PUBLIC_TABLES` | **2 rojas** del guardián (tabla clasificada, recuento 41/28) |
| Fichero vigilado (M-F5) | añadir un `UPDATE public.remisiones …` al `.sql` | **2 rojas**: siembra 6 y «sentencias DETRÁS de prioridad_ajustes» |
| Dato | `exige_texto` de «Otro» apagado en la siembra | **4 rojas**: siembra 2, lectura del catálogo, «Otro sin texto → 422» (el servidor pasa a aceptarlo: lee la marca) y el 201 compuesto |
| M-L1 | escribir `novedades` con `J(…)` en `apps/desk/server/db/remisiones.ts:50` | **1 roja**: «legado deja `novedades` en NULL de SQL» (`J(null)` escribiría el JSON `null`) |

## 6. Contraste con la letra de Gerencia

Letra: `openspec/config.yaml:2920` (`decision/f1b04-rotulacion`) y su hermana de desplegables;
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`, `:1240` y `:1241`.

| Punto | Resultado |
|---|---|
| Diez tipos, textos exactos y orden | **Coinciden** carácter a carácter con el bloque que empieza en `packages/zoho-sync/src/db/schema.sql:677` (órdenes 10 a 100) y con el maestro |
| «Otro» con texto obligatorio | Marca `exige_texto` leída del catálogo (`packages/shared/src/recepcion.ts:99`); mutación de dato en rojo |
| «Sin novedad» excluyente | Marca `excluye_demas` (`packages/shared/src/recepcion.ts:93`) |
| Rotulado: persona, fecha y hora del servidor | `rotulado_por` = usuario de sesión (`apps/desk/server/routes/remision.ts:250`); `rotulado_at = new Date()` (`apps/desk/server/db/remisiones.ts:50`); `apps/desk/server/recepcion.test.ts:144` prueba que el cuerpo falso se ignora |
| Sin ubicación | Ninguna columna ni campo de ubicación (búsqueda `ubicaci` en el código nuevo: 0) |
| Foto siempre obligatoria (equipo, accesorios, embalaje) más la de cada novedad | `packages/shared/src/recepcion.ts:134` y `:151`; maestro `:1241` |
| Nada fuera de alcance | Sin lista de accesorios (E-100), sin remisión de salida, sin pantalla de mantenimiento (la lista se edita por SQL: E-164) |
| Payload a n8n | `apps/desk/server/remisionWebhook.ts` sin diff; `apps/desk/server/recepcion.test.ts:419` fija las diez claves y las tres de cada foto |

## 7. Regla invariable 13 (tabla del lote 4b contra el árbol de HEAD)

Revisadas las once decisiones una a una. **Ninguna decisión del cliente queda sin línea de servidor.** Las líneas de la
tabla de `apply-progress.md` siguen ciertas en HEAD: guarda del alta en `apps/desk/server/routes/remision.ts:158` hacia
`packages/shared/src/recepcion.ts:75`; puertas de `/enviar` en `apps/desk/server/routes/remision.ts:289`; categoría en
`apps/desk/server/routes/remision.ts:384`; lectura en `apps/desk/server/routes/novedades.ts:16`. El cliente **no
reescribe** ninguna regla: `apps/desk/src/lib/recepcionForm.ts` importa `validarRecepcion`, `motivoNoEnviable` y
`novedadesActivas` de `packages/shared`, y la marca excluyente la decide `excluyeDemas` del catálogo, no la clave. En
`apps/desk/src/components/CrearRemision.tsx` no quedan `hayNovedad`, `observaciones` ni lógica de reglas.

- La corrección de la fila 11 es cierta: el botón sólo se deshabilita con `!data || !!busy`
  (`apps/desk/src/components/CrearRemision.tsx:376`) y el aviso de lista no cargada no bloquea.
- Una decisión que la tabla no nombra y que también cumple: esconder la casilla de foto de la novedad excluyente
  (`apps/desk/src/components/CrearRemision.tsx:307`) es comodidad respaldada por
  `packages/shared/src/recepcion.ts:141` (la excluyente no exige foto) y por «Sin novedad → 200»
  (`apps/desk/server/recepcion.test.ts:399`).
- **Agujero declarado (omitir `novedades` entra por legado y evita las guardas nuevas):** está **bien declarado**, en
  `apply-progress.md` (4.9), en E-169 de `docs/sdd/ENTRADA.md` y en la corrección 21 de
  `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, y es consecuencia buscada de RQ-RE-27 (compatibilidad con el
  cliente anterior), no un descuido. Lo que no se dice con igual claridad es el reverso para la letra (W3).

## 8. Seguridad y robustez de lo nuevo en servidor

| Punto | Resultado |
|---|---|
| Tipos inesperados en `novedades` | Elemento que no es texto, objeto o cadena suelta → `422` (`packages/shared/src/recepcion.ts:83`); duplicados se pliegan |
| `novedadOtro` no cadena | Se trata como vacío (`packages/shared/src/recepcion.ts:97`): `422` si la novedad lo exige; si no, se descarta (`NULL`) |
| `novedadOtro` larguísimo | Sin tope propio; lo acota el `express.json()` por defecto (`apps/desk/server/app.ts:38`, 100 kB). Igual que `observaciones` de legado (S1) |
| `categoria`/`novedad` en multipart | Repetidos (array) u otros tipos → `422` (`packages/shared/src/recepcion.ts:174`, `:179`); `novedad` sólo vale con clave marcada en la remisión |
| Consultas | Todas parametrizadas (`apps/desk/server/db/remisiones.ts:47`, `:50`); la lectura del catálogo no recibe entrada de usuario |
| Sesión | `GET /api/novedades-remision` va con `requireAuth` (`apps/desk/server/routes/novedades.ts:16`); `apps/desk/server/recepcion.test.ts:19` prueba el 401 |
| Catálogo vacío | Alta → `422` «no está cargada» (`apps/desk/server/recepcion.test.ts:107`); lectura → lista vacía; `/enviar` de una remisión nueva exige la foto de cada novedad (lado estricto) |

## 9. Barrido de citas (muestra de 21 leídas contra el fichero, además del detector con salida 0)

Ciertas: `openspec/specs/remisiones/spec.md:100` y `:104` (serial, `apps/desk/server/routes/remision.ts:153` con
`.trim()`), `openspec/specs/remisiones/spec.md:392`, `CLAUDE.md:222` (`CrearRemision.tsx:204`: el recorte sigue en la
204), `CLAUDE.md:176` (caso B, nombra `607e26a`), las de IV-12 de `CLAUDE.md` (127 fecha, 155 serial, 177 el `409`, 197
ítems, 220 orden de venta: leídas hoy y dicen lo mismo) y `openspec/config.yaml:2946` (la línea 250 de `routes/remision.ts`
como «guarda null»: cierta sólo de la vía de legado, ya señalada por el apply). Entradas nuevas de `docs/sdd/ENTRADA.md`:
E-163 (`packages/shared/src/recepcion.ts:151`), E-164 (`packages/zoho-sync/src/db/schema.sql:677`), E-166
(`packages/shared/src/recepcion.ts:26`), E-167 (`packages/shared/src/recepcion.ts:101`), E-169 (158, 197, 220, 154 y
174 de `apps/desk/server/routes/remision.ts`), y la corrección 21 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`
(158, 249, 289, 384, maestro `:1239`, `:2279`, `:2280`): **todas dicen lo que afirman**. E-168 es correcta:
`openspec/config.yaml` sólo registra la mitad de salida de E-123 (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`).
`openspec/specs/remisiones/spec.md:66` y `:74` citan rangos cuyo texto hoy vive en otras líneas: **falsas desde antes de
esta tanda**, ya listadas por el apply para el archive.

**Sección nueva de `DEPLOY.md`:** las dos consultas son `SELECT` puros, sin efecto. La 1 (`public.catalogo_novedades`) y
la 2 (`information_schema.columns` con el esquema `public`) son correctas para el reparto de esquemas: tabla y seis
columnas viven en `public` (`remisiones`, `remision_fotos`). La advertencia «toda alta falla si falta una columna» es
cierta: el `INSERT` de `apps/desk/server/db/remisiones.ts:47` las nombra todas.

## 10. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W1 · Escenario sin prueba por ejecución propia: remisión de origen histórico (RQ-RE-27).** Se cumple por
  construcción (histórico implica `novedades` NULL, que es legado: `apps/desk/server/services/recepcion.ts:16` y
  `packages/shared/src/recepcion.ts:154`), pero ninguna prueba nueva crea una fila `historico` y llama a `/enviar` o la
  lee. Cubierto por lectura, no por ejecución. Los escenarios de legado con `hay_novedad` en `false` o `null` sí pasan
  (`apps/desk/server/fotoNovedad.test.ts:117`).
- **W2 · Compatibilidad real con PostgreSQL no ejecutada.** El esquema nuevo (`ON CONFLICT (clave) DO NOTHING`,
  `ADD COLUMN IF NOT EXISTS … jsonb`) se probó sólo contra pg-mem; `migrate.integration.test.ts` queda omitido sin base
  real. Es SQL estándar y de bajo riesgo; la comprobación de lectura de `DEPLOY.md` lo cubre tras desplegar. Es
  condición de publicación, no de fusión.
- **W3 · La letra «la foto es SIEMPRE obligatoria» sólo se impone al formulario nuevo.** Omitir `novedades` entra por
  legado y se envía con una sola foto (o con ninguna si no declara novedad). Declarado y aceptado en el diseño (E-081,
  E-169); no se propone corregirlo aquí. Se anota porque separa «la regla está construida» de «la regla se cumple
  contra cualquier cliente».
- **W4 · El presupuesto del archive queda justo.** Se simuló la fusión de la delta en
  `openspec/specs/remisiones/spec.md` (779 a 1.213 líneas) y `git diff --no-index --shortstat --no-renames` midió **496
  inserciones y 62 borrados = 558**. Con el techo de 800 para la parte revisable, el `archive-report.md` no puede pasar
  de unas **240 líneas** (los cinco precedentes miden entre 110 y 264): estimación total entre 670 y 820; conviene
  mantenerlo en 150-200.

### SUGGESTION
- **S1 · Sin tope de longitud en `novedadOtro`:** sólo lo acota el límite por defecto de `express.json()` (100 kB), y ese
  texto acaba en `observaciones` y viaja a n8n. Un tope de unos cientos de caracteres sería razonable más adelante;
  no bloquea (el `observaciones` de legado tampoco lo tiene).
- **S2 · El `422` de clave desconocida refleja la clave recibida** (`packages/shared/src/recepcion.ts:89`): inocuo en
  JSON y React, pero acotarlo evitaría devolver hasta 100 kB.
- **S3 · Prueba por ruta del orden interno de `/enviar` y de «tres fotos sin categoría»:** hoy sólo en la función
  compartida (`packages/shared/src/recepcion.test.ts:231`, `:272`); la ruta sí fija la posición de la puerta.
- **S4 · Listar en el archive las citas ya falsas de `openspec/specs/remisiones/spec.md:66` y `:74`, y el segundo
  barrido:** la fusión inserta unas 434 líneas netas en ese fichero, así que toda cita a él desde otros documentos hay
  que remedirla.
- **S5 · `openspec/config.yaml:2946` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:424`** citan la línea
  250 de `routes/remision.ts` como «guarda null»: sigue cierto sólo para legado. Reapuntar al cerrar, por la supervisión.

## 11. Cabecera R-1 y qué trata el archive

- **Cabecera del `proposal.md`:** siete campos válidos (`tanda: F1B-04`, `motivo` vacío, `capacidad: [remisiones]`,
  `maestro: ["M1.2","M2.1"]`, `cierra: no`, `toca_maestro: si`, `origen_cabecera: declarada`). **`cierra: no` es
  coherente** con la fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:84`: sigue «en curso» porque suma
  los accesorios desde el catálogo (E-100) y la mitad de salida de E-123, que esta tanda no construye.
- **Capacidad (R-2):** `remisiones` ya está en `capabilities` de `openspec/config.yaml` y en `openspec/specs/remisiones/`:
  **no es capacidad nueva**, no hay que declarar nada. Los cinco `MODIFIED` existen en la spec viva
  (`openspec/specs/remisiones/spec.md:218`, `:345`, `:485`, `:517`, `:534`); RQ-RE-21 a 27 no chocan (el último es
  RQ-RE-20, en `openspec/specs/remisiones/spec.md:708`).
- **Fusión:** delta de 579 líneas, unas 558 revisables medidas (W4). Insertar los siete requisitos nuevos antes de la
  sección «4 · El histórico importado» y reemplazar en sitio los cinco modificados; repetir el barrido de citas sobre
  `openspec/specs/remisiones/spec.md` y reparar por casos A, B y C.
- **`apps/desk/server/reconciliacion/registro.test.ts`:** hoy está verde con la carpeta del cambio en
  `openspec/changes/`. Al archivar con `cierra: no`, `numerador()` de
  `apps/desk/server/reconciliacion/comprobaciones.ts` sólo saca de «en curso» las tandas archivadas con `cierra: si`:
  F1B-04 seguirá «en curso» y la lista de siete de `apps/desk/server/reconciliacion/registro.test.ts:220` no cambia.
  Es lectura del código, **hipótesis** hasta correr la prueba: ejecutarla justo después del archive.
- **Tareas de persona (no son casillas):** lista de diez novedades por Servicio Técnico (condición de publicación),
  etiqueta con el código del ticket en n8n (condición de publicación) y Persona-1 a 5 en la app. Archivar NO las da por
  hechas; el `archive-report.md` las lleva con dueño, destino y dónde quedan escritas.
- **Reglas del ciclo:** commit de archivo sólo con este cambio (`git show --numstat`), `cierra: no`, y no se toca
  `openspec/changes/archive/`.
