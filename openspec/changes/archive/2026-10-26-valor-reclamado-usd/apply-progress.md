# apply-progress — `valor-reclamado-usd` (F1B-13, `cierra: no`) — lote L1

Estado: L1.1 a L1.10 hechas; L1.c es del orquestador. Modo `strict_tdd`. Worktree `C:\dev\Desk_2_R1.023-worktrees\valor-reclamado-usd`, partida `c6147860`.

## L1.1 Línea base (antes de editar)
`garantiaProveedor.test.ts` (27), `medicionGarantias.test.ts` (25) y `routes/medicionGarantias.test.ts` (12): 3 ficheros, 64 pruebas, verdes.

## L1.5 Rojos (cada uno por la causa esperada)
| Fichero | Prueba | Aserción | Causa del rojo |
|---|---|---|---|
| `packages/shared/src/valorReclamado.test.ts` | todo el fichero (22 pruebas) | la importación `./valorReclamado` | el módulo no existe (`Cannot find module`) |
| `packages/shared/src/medicionGarantias.test.ts` | «cada grupo trae moneda USD y el cociente no lleva moneda» | `expect(g.moneda).toBe('USD')` | `expected undefined to be 'USD'`: el grupo no trae `moneda` |
| `packages/shared/src/medicionGarantias.test.ts` | «CARACTERIZACIÓN: sumas, recuentos y orden idénticos; sólo se añade moneda» | `every(g => g.moneda === 'USD')` y `toEqual` con `moneda` | `expected false to be true`: sin `moneda` en el grupo |
| `apps/desk/server/routes/medicionGarantias.test.ts` | «cada grupo trae moneda USD y la ruta devuelve exactamente lo de shared» | `expect(g.moneda).toBe('USD')` | `expected undefined to be 'USD'`: la ruta devuelve lo de `shared`, que aún no pone `moneda` |

Las pruebas de `valorReclamado.test.ts` cubren: constantes y `SIN_FOTO`; `lineasDeLaOVI` (objeto, texto JSON, `null` por raw inválido, `line_items` ausente/vacía/no lista, sin `item_id`, cantidad 0/negativa/no finita/`'2'`); `fotoValorReclamado` (311,08; repetido = 40; 3 × 0,004 = 0,01; ausente/0/null/negativo/no finito → `SIN_FOTO`; nunca parcial); `origenTrasEditar` (los cinco casos de S-5); `etiquetaOrigenValor` (S-7).

## L1.6-L1.8 Verde
- `garantiaProveedor.ts`: `:36` en sitio (texto exacto de §4, una línea; `:37` sigue siendo `ORIGEN_VALOR_MANUAL`); cuatro líneas al final (`:193-196`, tras una línea en blanco en `:192`).
- `valorReclamado.ts` nuevo (88 líneas) y `index.ts:55` (una línea tras `:54`).
- `medicionGarantias.ts`: `:1` (importación), `:26` (`moneda: MonedaGarantiaProveedor`), `:63` (`moneda: MONEDA_GARANTIA_PROVEEDOR`). **Desvío de numeración del diseño:** §4 dice `:62`; la línea real del grupo nuevo que lleva `cociente: null,` es la `:63` (la `:62` es la de `fabricante:`). Se editó la `:63`, sin cambio de longitud del fichero.
- No hizo falta tocar `medicionGarantias.test.ts:15`: el constructor de la prueba construye `GarantiaProveedor`, no `MedicionFabricante`; el `moneda` de `GarantiaProveedor` es de L2.
- Verde: 4 ficheros, 89 pruebas.

## L1.9 Mutaciones
**M0** (suite entera sin mutar): `npm test`, exit 0, 323 ficheros pasan (4 omitidos), 5614 pruebas pasan (26 omitidas). Log: `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-l1-m0-1216.log`.

| Mut. | Cambio | Cae | Aserción |
|---|---|---|---|
| (a) | `suma += costo` (sin `cantidad`) | `valorReclamado.test.ts` «2 × 150,54 + 1 × 10 = 311,08» | `expected { valorReclamado: 160.54 } to deeply equal { valorReclamado: 311.08 }` |
| (f) | saltar la línea sin costo (`continue`, suma parcial) | «un artículo ausente del mapa o con costo 0 da SIN_FOTO…» y «costo null, negativo o no finito da SIN_FOTO» | `valorReclamado: 100` en vez de `null`; `+0` en vez de `null` |
| (i) | redondear por línea | «el redondeo es uno solo… 0,01» | `expected +0 to be 0.01` |
| (d2) | quitar `moneda` del grupo (`medicionGarantias.ts:63`) | las tres de moneda: dos de `shared` y la de la ruta | `expected undefined to be 'USD'` (x2) y el `toEqual` del grupo |

Cada mutación se restauró desde copia (`cmp` idéntico) y la suite del lote volvió a verde (62 pruebas en los tres ficheros afectados). Ninguna queda en el árbol.

## Cierre del lote (cifras del aplicador)
- `npm run typecheck`: 0. `npm run lint -- --max-warnings 165`: 0 errores, **165** avisos (sin holgura, igual que `main`).
- Colocación (regla de mutación 4): `git diff -U0` — todos los hunks de ficheros existentes son `-N +N` (misma cuenta) o se añaden al final: `garantiaProveedor.ts` `-36 +36` y `+192,5` al final; `index.ts` `+55`; `medicionGarantias.ts` `-1 +1`, `-26 +26`, `-63 +63`; las dos pruebas, al final. Ninguna línea existente cambió de número.
- Medida ingenua (L1.10): `git diff --shortstat --no-renames` 53 inserciones y 4 borrados en 5 ficheros + nuevos sin trackear (`valorReclamado.ts` 88, `valorReclamado.test.ts` 116) = ~261. Bajo ~400; no hay aviso de división. Este `apply-progress.md` y el informe suman aparte.

---

# Lote L2 — la ficha en el servidor

Estado: L2.1 a L2.12 hechas; L2.c es del orquestador. Modo `strict_tdd`. Partida del intento: `eaeda6e5` (L1 cerrado). Sin commit, sin `git add`, sin `sdd-attempt`.

## L2.1 Línea base (antes de editar)
7 ficheros, 170 pruebas verdes: `db/garantiaProveedor.test.ts` (15), `routes/garantiaProveedor.test.ts` (42), `services/avisoReclamacionProveedor.test.ts` (24), `shared/garantiaProveedor.test.ts` (27), `shared/medicionGarantias.test.ts` (27), `routes/medicionGarantias.test.ts` (13) y `shared/valorReclamado.test.ts` (22). Las pruebas de posición POS-RS-1…7, POS-AV-1…3 y POS-ED-1…3 (G1-G14) quedan **sin tocar** y verdes en todo el lote.

## L2.6 Rojos (cada uno por la causa esperada)
| Fichero | Prueba | Aserción | Causa |
|---|---|---|---|
| `packages/shared/src/garantiaProveedor.test.ts` | «sí» con fabricante… (`:55`, `:58`) | `toEqual` sin la clave `valorReclamado` | `validarRespuesta` aún devuelve `valorReclamado` |
| ídem | `:174-175` «cadena numérica… (el «sí» lo ignora)» | `.ok` `toBe(true)` | `expected false to be true`: el «sí» aún valida el valor |
| ídem | bloque nuevo S-2 (negativo, no numérico, no finito, cadena, 800000) | `toEqual` del «sí» sin clave | los cuatro inválidos dan `ok: false`; el válido trae `valorReclamado: 800000` |
| `apps/desk/server/db/garantiaProveedor.test.ts` | `:39` y los de `moneda` | `expected undefined to be 'USD'` | `aGarantia` aún no pone `moneda` |
| ídem | 17 pruebas de `fotoDeLaOVI` (foto, repetido, asociación inexistente, **diez huecos**, nunca parcial, no recalcula, `Queryable` falsa) | `fotoDeLaOVI` | la función no existe (importación `undefined`) |
| ídem | `editarFicha escribe el origen…`, ficha previa en USD | `toMatchObject` | sin origen en `editarFicha` ni `moneda` |
| `apps/desk/server/routes/garantiaProveedor.test.ts` | `:67` «sí… origen manual» | `toMatchObject({ valorReclamado: null, moneda: 'USD' })` | falta `moneda` |
| ídem | foto 311,08; 999 y `Infinity` ignorados; sin foto con 999; X→X, X→Y, X→NULL, -1 al editar (sembrar la ficha con foto) | `valorReclamado: 311.08, origenValorReclamado: 'ovi'` | la ruta no calcula la foto |
| ídem | `-1` y `'abc'` en el «sí» | `status` `toBe(201)` | `expected 422 to be 201`: el «sí» aún valida el valor |
| ídem | moneda en lectura, «sí», «no», editar y avanzar | `moneda` `toBe('USD')` | `expected undefined to be 'USD'` |
| `apps/desk/server/routes/medicionGarantias.test.ts` | «el cuerpo es lo que da medirGarantias…» (siembra por `foto`) | `toMatchObject({ fichas: 2, reclamado: 1500, … })` | el importe sembrado por `foto` aún no se escribe |

Pruebas que **nacen verdes por ser CARACTERIZACIÓN** (fijan lo que ya hay y deben seguir así): «sin foto» (la asociación sin orden da `null`/`manual`), «un hueco… nunca parcial» en la ruta, «la foto no es guarda: G1-G6 con una orden completa» y NULL→X / NULL→NULL de la ruta (manual→manual). Ediciones en sitio sin rojo propio (sólo tipos o cambio de expectativa): `packages/shared/src/medicionGarantias.test.ts:15` (`moneda` en el constructor; lo cubre `typecheck`), `apps/desk/server/services/avisoReclamacionProveedor.test.ts:26`, `apps/desk/server/db/garantiaProveedor.test.ts:16`, `:51`, `:53`, `:108`, `:112`, `:115` y `:116`. Triangulación saltada en el constructor de la línea 15 del primero: estructural, un solo resultado posible.

## L2.7-L2.10 Verde
- `shared/garantiaProveedor.ts` en sitio: `:60` (`valorRecuperado: number | null; moneda: MonedaGarantiaProveedor`), `:70` (el «sí» sin `valorReclamado`), `:151` (`datosComunes({ ...cuerpo, valorReclamado: null })`), `:153` (el «sí» con los tres campos). `validarDatosFicha` y `:137-138` sin cambios.
- `db/garantiaProveedor.ts` en sitio: `:4-5` (imports), `:64` (`moneda`), `:89`, `:91`, `:99`, `:114`, `:116`, `:118`. Al final `fotoDeLaOVI` (`:180-201`): `ov_asociaciones` → `books.sales_orders` calificada → `books.items IN ($1,…)`, ids sin repetir, costo por `numero()`, sin `jsonb` en SQL, nunca rechaza.
- `routes/garantiaProveedor.ts` en sitio: `:5` (`origenTrasEditar`), `:10` (`fotoDeLaOVI`), `:57` (foto dentro del `try`, sólo si `reclama`), `:78` (`origenTrasEditar(ficha, datos.valor.valorReclamado)`).
- Verde: los 7 ficheros del lote y toda `packages/shared` (69 ficheros, 1867 pruebas). El primer intento de `fotoDeLaOVI` pasó las 20 pruebas rojas a la primera (pg-mem admite `books.*`, `IN ($1,…)` y el `jsonb` insertado como texto).
- `npm run typecheck`: 0. `apps/desk/src`: `git diff --stat` vacío (el cliente declara su propio tipo de cuerpo).

## L2.11 Mutaciones
**M0** (suite entera sin mutar, sola, en primer plano): `npm test`, exit 0, 323 ficheros pasan (4 omitidos), 5655 pruebas pasan (26 omitidas), 277,9 s. Log: `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-l2-m0-1258.log`.

| Mut. | Cambio | Cae | Aserción |
|---|---|---|---|
| (b1) | `origenTrasEditar` devuelve siempre el anterior (`valorReclamado.ts`) | shared: X→Y, NULL→X y X→NULL; ruta: PUT X→Y y X→NULL | `expected 'ovi' to be 'manual'` (x3); `toMatchObject({ valorReclamado: 300, origenValorReclamado: 'manual' })` |
| (b2) | `editarFicha` sin `$7` ni el parámetro `origen` (`db/garantiaProveedor.ts`) | db «editarFicha escribe el origen que recibe»; ruta PUT X→Y y X→NULL | `toMatchObject({ valorReclamado: 300, … 'manual' })` |
| (c) | regla de mutación 2: una línea sin `item_id` en el FIXTURE de `books.sales_orders` (`LINEAS_BASE` de db y `LINEAS_FOTO` de la ruta) | db: «2 × 150,54 + 1 × 10 = 311,08» y «la foto no se recalcula»; ruta: la foto positiva, 999/-1/abc/Infinity y las cuatro de editar | `expected { valorReclamado: null, …(1) } to deeply equal { valorReclamado: 311.08, …(1) }`; 11 caen |
| (d1) | quitar `moneda` de `aGarantia` (`:64`) | db: `:39`, aGarantia, ficha previa y la positiva; ruta: `:67`, la positiva, X→X y «toda ficha devuelta lleva su moneda» (lectura, «sí», «no», editar y avanzar) | `expected undefined to be 'USD'` |
| (g) | `validarRespuesta` vuelve a leer el valor (`datosComunes(cuerpo)` y la clave en el resultado) | shared: los 5 casos S-2 más `:55`/`:58`/`:174-175`; ruta: `-1` y `'abc'` | `expected 422 to be 201`; `expected false to be true`. **El 999 de la ruta NO cae**: la capa de datos escribe la foto y no el valor de la respuesta (defensa doble); lo que impide el 999 es la prueba de shared |
| (h) | quitar `numero()` del costo (`r.purchase_rate as number \| null`) | db: la `Queryable` falsa con `'150.54'` (única que cae: pg-mem entrega número) | `expected { valorReclamado: null, …(1) } to deeply equal { valorReclamado: 301.08, … }` |

Cada mutación se restauró desde copia y `cmp` idéntico; la suite del lote volvió a verde (1867 pruebas). Ninguna queda en el árbol.

**Debilidad anotada de (c):** los diez huecos de S-4 que dependen de la base (sin `salesorder_id`, sin fila de la orden, artículo ausente, costo NULL, costo 0) esperan `SIN_FOTO`; con la base sucia siguen en verde por la razón equivocada. Los protege la prueba POSITIVA que comparte esa base (la que cae en (c)), no ellos mismos.

## L2.12 Regla de mutación 1
Mutación: `const fotoAntes = … await fotoDeLaOVI(…)` insertada ANTES de la guarda G6 (`const yaRespondida`) y pasada a `registrarRespuesta`. Resultado: las 91 pruebas de las dos suites (ruta y db) **siguen verdes**, incluidas POS-RS-1…7, POS-AV, POS-ED y la nueva «la foto no es guarda: con una orden completa, los rechazos de G1 a G6 siguen dando lo mismo y no escriben». Moverla no cambia ninguna respuesta de rechazo: la foto no es guarda. Restaurada y `cmp` idéntico.

## Cierre del lote (cifras del aplicador)
- `npm run typecheck`: 0. `npm run lint -- --max-warnings 165`: 0 errores, **165** avisos (igual que `main`; el código nuevo no lleva `any`).
- Colocación (regla de mutación 4), `git diff -U0 --no-renames` fichero a fichero:
  - `shared/garantiaProveedor.ts`: `-60 +60`, `-70 +70`, `-151 +151`, `-153 +153`.
  - `db/garantiaProveedor.ts`: `-4,2 +4,2`, `-64 +64`, `-89 +89`, `-91 +91`, `-99 +99`, `-114 +114`, `-116 +116`, `-118 +118` y `+180,22` al final (tras la línea 179). `DEPLOY.md:490` sigue citando la 144, que no se movió.
  - `routes/garantiaProveedor.ts`: `-5 +5`, `-10 +10`, `-57 +57`, `-78 +78`. Ninguna línea citada (`:55`, `:57`, `:65`, `:80`, `:107`, `:108-111`, `:109`, `:110`) cambió de número.
  - Pruebas: `shared/garantiaProveedor.test.ts` `-55 +55`, `-58 +58`, `-65,3 +65,3` (tres filas → comentario de tres líneas), `-174,2 +174,2`, y `+179,33` al final; `shared/medicionGarantias.test.ts` `-15 +15`; `db/…test.ts` `-10 +10`, `-16 +16`, `-33`, `-39`, `-51`, `-53`, `-108`, `-112`, `-115,2` (todos N→N) y `+197,122` al final; `routes/…test.ts` `-32 +32`, `-67 +67` y `+443,141` al final; `routes/medicionGarantias.test.ts` `-37`, `-41`, `-43,2` (N→N); `services/avisoReclamacionProveedor.test.ts` `-26 +26`.
  - Ningún fichero existente cambió de longitud salvo por lo añadido al final.
- Medida ingenua del lote: `git diff --shortstat --no-renames` contra `eaeda6e5`: 9 ficheros, 360 inserciones y 42 borrados = **402**; sin ficheros nuevos sin trackear en L2. Con este informe y `tasks.md`, aparte. Bajo la válvula de 720.
- `git diff --stat -- apps/desk/src`: vacío.

## Desvíos del diseño (con su razón)
1. `routes/medicionGarantias.test.ts`: el diseño nombra `:37`, `:41`, `:43`; hubo que editar también `:44` (segunda línea del mismo `const sub`), en sitio y sin cambiar la cuenta. `sembrar` y `sub` pasan el importe como `valor` junto a la respuesta (`RespuestaReclamacion & { valor }`) y `sembrar` lo entrega por `foto`; así no se tocan `sembrarVarias` ni sus llamadas.
2. S-2 del bloque de shared: el diseño dice que 800000 «sigue siendo error al editar»; no lo es (es un valor válido). La prueba nueva afirma que al editar 800000 SE CONSERVA, y que -1, `'abc'`, `Infinity` y `'800'` siguen siendo error. Lo que 800000 prueba en el «sí» es que se ignora.
3. En la ruta, `Infinity` viaja como `null` por JSON: el caso llega como «sin valor» y el resultado es el mismo; se deja comentado en la prueba.
4. La prueba de «la foto no es guarda» (L2.4) se escribió por RESPUESTA (estados y filas escritas), no por consultas registradas, para que sea cierta de lo que la spec afirma («no cambia ninguna respuesta de rechazo») y no un candado de posición sobre algo que el diseño declara irrelevante (ver L2.12).

---

# Lote L3 — cliente y cierre

Estado: L3.1 a L3.9 hechas; L3.c es del orquestador. Modo `strict_tdd`. Partida del intento: `2bf0c72b` (L2 cerrado). Sin commit, sin `git add`, sin `sdd-attempt`.

## L3.1 Línea base (antes de editar)
5 ficheros, 160 pruebas verdes: `packages/shared/src/valorReclamado.test.ts`, `packages/shared/src/garantiaProveedor.test.ts`, `apps/desk/server/db/garantiaProveedor.test.ts`, `apps/desk/server/routes/garantiaProveedor.test.ts` y `apps/desk/server/routes/medicionGarantias.test.ts`. Los `.tsx` no admiten rojo previo (F0-00, `vitest.config.ts:16`, `:17-20`): lo respalda L2. Rojo y triangulación no aplican a los dos `.tsx` ni a `client.ts` (declaración de tipo): nota de TDD, sin prueba nueva.

## L3.2-L3.4 Verde del cliente (edición EN SITIO)
- `apps/desk/src/components/PanelGarantiaProveedor.tsx`: `:4` (importa `etiquetaOrigenValor`), `:26` (`fmtValor(v, moneda)`), `:47-48` (`moneda?: string`), `:61` (campo de valor sólo con `moneda`, etiqueta «Valor reclamado (moneda)»), `:87` (el cuerpo del «sí» sin valor), `:118` (valor con `f.moneda` y, si hay valor y el origen es de la lista, su etiqueta entre paréntesis), `:120` (recuperado con `f.moneda`), `:132` (`moneda={f.moneda}`), `:146` (marcador «Valor recuperado (moneda)»). La `:85` no se tocó: el «sí» ya no pasa `moneda` (es opcional), así que su formulario no pide valor.
- `apps/desk/src/components/MedicionGarantias.tsx`: `:16` (`fmtValor(v, moneda)`), `:66` y `:67` con `g.moneda`.
- `apps/desk/src/api/client.ts:848`: el cuerpo del «sí» deja de declarar `valorReclamado`.
- `grep -rn "USD" apps/desk/src` = **0** (ni literales ni comentarios). `npm run typecheck` = 0, `npm run build` = 0, `npm run lint -- --max-warnings 165` = 0 errores y **165** avisos.
- Colocación, `git diff -U0 --no-renames`: `client.ts` `-848 +848`; `MedicionGarantias.tsx` `-16 +16`, `-66,2 +66,2`; `PanelGarantiaProveedor.tsx` `-4 +4`, `-26 +26`, `-47,2 +47,2`, `-61 +61`, `-87 +87`, `-118 +118`, `-120 +120`, `-132 +132`, `-146 +146`. Todo N→N: ninguna línea se movió (los archivados citan `PanelGarantiaProveedor.tsx:25`, `:26`, `:158` y `MedicionGarantias.tsx:17`, `:37`).

## L3.5 Casilla de regla invariable 13 (regla de mutación 3), leída al cerrar L3

Cada línea se leyó hoy en el árbol del worktree (`2bf0c72b` más L3).

| # | Decisión del cliente | Regla en `shared` (línea y lo que afirma) | Imposición en el servidor (línea exacta y lo que afirma) |
|---|---|---|---|
| C-1 | No ofrecer ni mandar el valor en el «sí» | `packages/shared/src/garantiaProveedor.ts:151` `datosComunes({ ...cuerpo, valorReclamado: null })`: el valor del cuerpo no se valida ni se guarda; `:153` el «sí» sale con tres campos, sin valor | `apps/desk/server/routes/garantiaProveedor.ts:57` pasa `foto: respuesta.valor.reclama ? await fotoDeLaOVI(db, asociacion.id) : undefined` a `registrarRespuesta`; `apps/desk/server/db/garantiaProveedor.ts:99` escribe `foto.valorReclamado, foto.origenValorReclamado` y no lee el cuerpo. Un valor mandado por un cliente en caché (999, `-1`, `'abc'`) da `201` y el valor de la foto: lo prueban los casos S-2 de `shared` y de la ruta |
| C-2 | Moneda junto a cada importe y en los campos de captura | `MONEDA_GARANTIA_PROVEEDOR` (`packages/shared/src/garantiaProveedor.ts:195`) | `apps/desk/server/db/garantiaProveedor.ts:64` `moneda: MONEDA_GARANTIA_PROVEEDOR` en `aGarantia` (toda ficha devuelta: lectura, «sí», «no», editar, avanzar) y `packages/shared/src/medicionGarantias.ts:63` `moneda: MONEDA_GARANTIA_PROVEEDOR` en el grupo de `medirGarantias`. El `.tsx` pinta lo que llega (`f.moneda`, `g.moneda`) y no escribe la moneda en ningún sitio |
| C-3 | Pintar el origen junto al valor reclamado | `etiquetaOrigenValor` (`packages/shared/src/valorReclamado.ts:83`): `null` si el valor es `null` o el origen no es de la lista | El origen lo escribe el servidor: `apps/desk/server/db/garantiaProveedor.ts:99` (origen de la foto en el «sí») y `:116` `origen_valor_reclamado = $7` con `:118` pasando `origen` (editar). El `.tsx` no decide el origen, sólo lo traduce a texto |
| C-4 | Mandar el valor editado tal cual | `origenTrasEditar` (`packages/shared/src/valorReclamado.ts`, S-5) y la validación `packages/shared/src/garantiaProveedor.ts:137-138` | `apps/desk/server/routes/garantiaProveedor.ts:78` `editarFicha(db, ficha.id, datos.valor, origenTrasEditar(ficha, datos.valor.valorReclamado))` decide el origen; `:77` rechaza con `422` el valor inválido (`validarDatosFicha`, `packages/shared/src/garantiaProveedor.ts:157-164`) |

**Otras decisiones que toman los dos `.tsx`** (fuera de la tabla del diseño), una por una:

| Decisión (fichero y línea) | Qué es | Línea del servidor que la impone, o «sin contrapartida» |
|---|---|---|
| `PanelGarantiaProveedor.tsx:176` con `:122`, `:129`, `:141` | Pregunta, formularios y botones sólo se enseñan a quien `puedeGestionarReclamacion` (consumido de `shared`) | `apps/desk/server/routes/garantiaProveedor.ts:43` (responder), `:71` (editar), `:92` (avanzar): `403`. Espejo legítimo, imposición probada por las pruebas de G2, G8 y G12 |
| `PanelGarantiaProveedor.tsx:122` `f.estado !== 'resuelta'` | No ofrece Editar en una ficha resuelta | `apps/desk/server/routes/garantiaProveedor.ts:74`: `409` |
| `PanelGarantiaProveedor.tsx:111`, `:125`, `:126` (`siguienteEstado`) | Sólo ofrece el paso siguiente | `apps/desk/server/routes/garantiaProveedor.ts:95`: `409` ante cualquier otro paso |
| `PanelGarantiaProveedor.tsx:146` `resultado !== 'rechazada'` y `:147` | No pide valor recuperado si el resultado es «rechazada» y manda `undefined` | `packages/shared/src/garantiaProveedor.ts:175-179` (rechazada: valor 0, `422` ante otro valor), invocado por `apps/desk/server/routes/garantiaProveedor.ts:97-98` |
| `PanelGarantiaProveedor.tsx:27` `numeroDelCampo`, con `:87`, `:135`, `:147` | No valida: vacío viaja como `null`, no numérico como texto; el servidor rechaza | `packages/shared/src/garantiaProveedor.ts:137-138` y `:182-183` (`422`) por `apps/desk/server/routes/garantiaProveedor.ts:77` y `:98`. El cliente no es guarda |
| `PanelGarantiaProveedor.tsx:84` `fabricantePropuesto ?? ''` | Rellena solo el fabricante propuesto | Lo calcula el servidor (`apps/desk/server/db/garantiaProveedor.ts:153`); lo escrito se valida en el servidor (`datosComunes`, fabricante obligatorio). Comodidad |
| `PanelGarantiaProveedor.tsx:166` `o.pendiente && puede` y `:167` `r?.reclama` | Pinta según `pendiente`, `liberada` y `respuesta` que ENVÍA el servidor | `apps/desk/server/db/garantiaProveedor.ts:150-151` (`pendiente: !liberada && respuesta === null`; una liberada sin respuesta no sale). La imposición de «liberada»: `apps/desk/server/routes/garantiaProveedor.ts:45` (`409`) |
| `PanelGarantiaProveedor.tsx:178` | Oculta el panel si no hay OVI | **Sin contrapartida:** presentación pura, no impide ni permite ninguna acción |
| `MedicionGarantias.tsx:38-41` y `:60-67` | Sólo pinta lo que `medirGarantias` calcula | Cálculo en `packages/shared/src/medicionGarantias.ts`; acceso: `apps/desk/server/routes/garantiaProveedor.ts:110` (`requireAuth`) y `:119` (`403`, `puedeVerMedicionGarantias`) |
| `MedicionGarantias.tsx:18` `fmtCociente` y `:16` `fmtValor` | Formato (`toLocaleString`), `null` → «—» | Presentación; el cociente llega calculado (`packages/shared/src/medicionGarantias.ts`, `cociente: null` en `:63` si nada reclamado) |

Ninguna decisión del cliente queda sin línea de servidor salvo la de `PanelGarantiaProveedor.tsx:178` (presentación pura).

## L3.6 Barrido de citas (regla de mutación 4, §11)

**Método.** `grep -rnoE` de `<fichero>:NN(-NN)?` sobre `*.md`, `*.ts`, `*.tsx`, `*.yaml`, `*.json` (archivados incluidos) para los nueve ficheros de producción tocados por el cambio y las siete pruebas, más un script que resuelve cada cita a su fichero y la cruza con las líneas de contenido cambiado (`git diff -U0` contra `eaeda6e5~1`). **Ninguna línea se movió** (todo cambio es N→N o va al final), así que una cita cuyo número no toca una línea con contenido cambiado sigue siendo tan cierta como antes. Se leyó entonces CADA cita cuyo principio, final o interior cae en una línea cambiada.
**Cifras:** 362 citas con nombre de fichero tocado (las de `index.ts` y `client.ts` se cuentan por nombre base e incluyen homónimos de otros paquetes); **46** tocan una línea cambiada.

| Dónde | Citas | Caso | Qué se hizo |
|---|---|---|---|
| Documentos de ESTE cambio (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/*`) | 34 | **A**: prescriptivas («edita EN SITIO `:57`», la casilla de `design.md` §8, «`:848` deja de declarar…», «`:36` ya no dice…»), ciertas hoy | Sin tocar |
| ídem | 8: `proposal.md:32`, `:33` (dos), `:41`, `:43`, `:44`, `:65`, `:106`; y `design.md:27` (`apps/desk/server/routes/medicionGarantias.test.ts:43-51`) | **B**: describen el estado ANTERIOR («`registrarRespuesta` escribe…», «el «sí» lleva `valorReclamado`…», «como quedan hoy todas las fichas») | **Ancladas** con `en c6147860`; comprobado que en esa revisión las líneas existen y dicen lo que la frase afirma |
| ídem | 5: `design.md:89` (abreviada `:62`) y `:140`; `tasks.md:16` (abreviada `:62`), `:17` y `:43` | **A, desfasadas desde L1**: el diseño decía `medicionGarantias.ts:62`; la línea de la moneda es la `:63` (la `:62` es `fabricante:`) | **Corregidas** a `:63` |
| Archivados de OTROS cambios | 10: `2026-10-06-ficha-garantia-proveedor` (`apply-progress.md:222`, `verify-report.md:159`, `:166` ×2) y `2026-10-17-medicion-garantias-por-marca` (`apply-progress.md:135`, `design.md:85` y `:134`, `proposal.md:30`, `specs/tickets-core/spec.md:14`, `tasks.md:43`) | **B** (registro fechado) o **A** sin cambio de significado (`garantiaProveedor.ts:43-64`: la interfaz sigue ahí) | Sin tocar, por la regla |
| `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` | 2 (`:161` `db:116-117`, `:162` `db:99`) | **B** | Sin tocar |
| `DEPLOY.md`, `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/*` | 0 intersecciones. `DEPLOY.md:490` cita `apps/desk/server/db/garantiaProveedor.ts:144`: esa línea sigue siendo la consulta de lectura `SELECT ${COLUMNAS} FROM garantia_proveedor WHERE ticket_id = $1` | **A** | Sin tocar; no queda falsa ninguna cita viva de `DEPLOY.md` |

**Rangos** (citas de otros documentos, nombradas en prosa para que el detector no las tome por citas de hoy). Principio y final por separado: la 51-54 de `apps/desk/server/db/garantiaProveedor.test.ts` (ini), la 1-58 de `apps/desk/server/routes/garantiaProveedor.test.ts` (interior), las 116-117 (ini), 114-121 (ini) y 95-100 (interior) de `apps/desk/server/db/garantiaProveedor.ts`, las 68-70 (fin), 36-37 (ini) y 43-64 (interior) de `packages/shared/src/garantiaProveedor.ts`, la 84-87 de `apps/desk/src/components/PanelGarantiaProveedor.tsx` (fin), la 43-51 de `apps/desk/server/routes/medicionGarantias.test.ts` (ini). Todos B, o A sin cambio de significado, como arriba.

**Segundo pase (abreviadas `:NN`).** En los tres documentos de este cambio las abreviadas que apuntan a líneas cambiadas son prescriptivas (`:57`, `:78`, `:99`, `:116`, `:151`, `:153`, «en sitio») y ciertas hoy; las dos desfasadas eran las `:62`, ya corregidas. En los `Paquete_de_Despliegue` y los archivados las abreviadas son B y no se tocan.

**Citas que escribe este lote:** todas con ruta completa desde la raíz, sin ejemplo de cita rota. Las comprobé a mano contra el árbol (`:151`, `:153`, `:57`, `:99`, `:64`, `:63`, `:116`, `:118`, `:78`, `:77`, `:137-138`, `:157-164`, `:175-179`, `:182-183`, `:95`, `:97-98`, `:110`, `:119`, `:150-151`, `:153`, `:83`, `:195`). El detector real lee lo commiteado y lo pasa el orquestador en el cierre.

## L3.7 Inventario de importes de Desk sin moneda (R-3: entrada para la bandeja; no se corrige ninguno)

Medido el 2026-10-26 en `apps/` y `packages/`, por nombre de campo y de columna (`total`, `sub_total`, `bcy_*`, `rate`, `purchase_rate`, `amount`, `unit_price`, `price`, `costo`, `importe`, `monto`, `tarifa`, `valor`), descartando lo que no es dinero: `total` de paginación, de filas borradas o de conteos; `rate` de «rate limit»; `valor_anterior` y `valor_nuevo` de `public.equipos_cambios` (texto de auditoría); `quantity`; `tax_percentage` (porcentaje). **Hipótesis:** una búsqueda por nombres puede perder un importe con un nombre que no figura en esa lista. **Resultado: 33 importes sin moneda en tres superficies** (1 por la API, 15 en `books.*`, 17 en CRM), más 1 anotado. Ninguno lo captura una persona en pantalla: todos llegan por replicación desde Zoho Books o Zoho CRM.

**A. Lo que la API de Desk devuelve sin moneda (1)**
1. `total` de la orden de venta: la vista `public.sales_orders` expone `total` y no `currency_code` (`packages/zoho-sync/src/db/schema.sql:178`; la columna de moneda existe en la tabla base, `:162`) → `packages/zoho-sync/src/books/repo.ts:106` (`total: Number(r.total)`) y las consultas de `:169` y `:180` → `packages/shared/src/types.ts:310` (`SalesOrderLite.total?: number`) → `GET /api/sales-orders` (`apps/desk/server/routes/directory.ts:53`; cliente `apps/desk/src/api/client.ts:272-276`). Ningún componente lo pinta hoy (`BuscadorOrdenVenta.tsx`, `CrearRemision.tsx` y `CreateTicket.tsx` no leen `total`).

**B. `books.*` en la base `desk` (réplica) y su hub: 15 columnas en 5 tablas sin columna de moneda**
2. `books.items`: `rate`, `purchase_rate` — `packages/zoho-sync/src/db/schema.sql:382` (hub: `packages/zoho-sync/src/booksHub/schema-books.sql:5`). `purchase_rate` es el costo del que F1B-13 hace la foto; su moneda es el supuesto S-10.
3. `books.salesorder_line_items`: `rate`, `bcy_rate`, `item_total` — `packages/zoho-sync/src/booksHub/schema-books.sql:10-11`.
4. `books.invoice_line_items`: `rate`, `bcy_rate`, `item_total` — `packages/zoho-sync/src/booksHub/schema-books.sql:23-24`.
5. `books.purchase_order_line_items`: `rate`, `bcy_rate`, `item_total` — `packages/zoho-sync/src/booksHub/schema-books.sql:52-53`.
6. `books.customer_payment_invoices`: `amount_applied`, `tax_amount_withheld`, `total`, `balance` — `packages/zoho-sync/src/booksHub/schema-books.sql:38` (la moneda está en el padre, `books.customer_payments`, `:30`, y no en esta fila).
Con moneda en la propia fila y por tanto NO contados: `books.sales_orders` (`packages/zoho-sync/src/db/schema.sql:162-163`), `books.invoices` (`schema-books.sql:17-18`), `books.customer_payments` (`:30-32`), `books.purchase_orders` (`:46`), `books.retainer_invoices` (`:59-60`).

**C. Calculado y escrito hacia fuera (1, anotado, no contado)**
7. `amount_usd` — `packages/zoho-sync/src/booksHub/salesRecords.ts:3` (`AggRow.amount_usd`), `:41` (la agregación) y `:44-48` (la escritura en `sales_records`). La moneda va en el NOMBRE de la columna y suma `bcy_rate × quantity` (moneda base): no es un importe sin moneda, pero `bcy_rate` (3, 4, 5) no la dice por sí mismo.

**D. CRM replicado por `hub-sync` en el hub `zoho-hub` (no es la base `desk`): 17 columnas en 6 tablas sin moneda**
8. `crm.deals`: `amount`, `expected_revenue` — `packages/zoho-sync/src/crmHub/schema-crm.sql:11-12` (mapeo `packages/zoho-sync/src/crmHub/modules.ts:27`).
9. `crm.products`: `unit_price` — `schema-crm.sql:38` (`modules.ts:47`).
10. `crm.quotes`: `sub_total`, `tax`, `discount`, `grand_total` — `schema-crm.sql:45` (`modules.ts:52`).
11. `crm.campaigns`: `expected_revenue`, `budgeted_cost`, `actual_cost` — `schema-crm.sql:51-52`.
12. `crm.visits`: `revenue` — `schema-crm.sql:60`.
13. `crm.quote_line_items`: `list_price`, `total`, `discount`, `total_after_discount`, `tax`, `net_total` — `schema-crm.sql:67` (`modules.ts:68`).

**E. Ya con moneda por F1B-13, no cuenta:** `valor_reclamado` y `valor_recuperado` (`packages/zoho-sync/src/db/schema.sql:740`, `:744`), con `moneda` en toda respuesta.

**Para la bandeja:** lo que Desk devuelve por API sin moneda es el único importe de A; el resto es dato replicado al que ninguna ruta de Desk llega hoy. La decisión de si Desk debe guardar la moneda junto a cada uno corresponde a Gerencia.

## L3.8 Corrección 29 — enmienda en sitio
`docs/sdd/F0-01_Correcciones_para_el_maestro.md`: **cupo en sitio, sin mover una sola línea** (`git diff -U0`: `@@ -1454`, `@@ -1474,6 +1474,6`, `@@ -1482,2 +1482,2`; 9 inserciones y 9 borrados). Punto 2 (`:1474-1476`, tres líneas): «valor reclamado, en USD: foto al abrir la ficha, cantidad × costo de catálogo de cada línea de la OVI, sumado por línea; se puede editar a mano y la ficha guarda su origen; el valor recuperado se anota en USD», y suma `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1232` (el costo lo conserva el catálogo del artículo, no la línea). Punto 3 (`:1477-1480`, cuatro líneas, la `:1480` sin cambio): construidos el valor automático y las dos mediciones (línea 2666); queda fuera el envío físico (línea 2667); retira «Cierra el punto 7 del Anexo D». Además `:1454` añade en la misma línea la procedencia de la enmienda (`valor-reclamado-usd`, `decision/f1b13-valor-reclamado-usd`) y `:1482-1483` («Lo que esta entrada NO pide») deja abierto sólo el envío por remisión, porque el valor automático y las mediciones ya no lo están. Las citas por línea a ese fichero (`:1456`, `:1474-1476`, `:1477-1480` y las de otras entradas) siguen apuntando a lo que dicen. P-2 (pegarlo en el maestro) sigue siendo de Gerencia.

## L3.9 Registro final de mutaciones (L1 y L2) y criterios de §14

**Todas las mutaciones, M0 incluida (cada una restaurada byte a byte con `cmp` y la suite del lote vuelta a verde):**

| M | Mutación | Lote | Cae | Aserción / causa |
|---|---|---|---|---|
| M0 | ninguna | L1 | nada: `npm test`, 323 ficheros, 5614 pruebas verdes | — |
| M0 | ninguna | L2 | nada: `npm test`, 323 ficheros, 5655 pruebas verdes | — |
| (a) | quitar `cantidad` de la suma | L1 | `valorReclamado.test.ts` «2 × 150,54 + 1 × 10 = 311,08» | `160.54` en vez de `311.08` |
| (d2) | quitar `moneda` del grupo (`packages/shared/src/medicionGarantias.ts:63`) | L1 | las tres de moneda: dos de `shared`, una de la ruta | `expected undefined to be 'USD'` |
| (f) | suma parcial: saltar la línea sin costo | L1 | «artículo ausente / costo 0 da SIN_FOTO», «costo null, negativo o no finito» | `valorReclamado: 100` en vez de `null` |
| (i) | redondear por línea | L1 | «tres de 0,004 dan 0,01» | `expected +0 to be 0.01` |
| (b1) | `origenTrasEditar` devuelve siempre el anterior | L2 | shared X→Y, NULL→X, X→NULL; ruta PUT X→Y y X→NULL | `expected 'ovi' to be 'manual'` |
| (b2) | `editarFicha` sin `$7` | L2 | db «escribe el origen que recibe»; ruta PUT X→Y y X→NULL | `toMatchObject(… 'manual')` |
| (c) | regla 2: línea sin `item_id` en el fixture de `books.sales_orders` | L2 | db: 311,08 y «no se recalcula»; ruta: foto positiva, 999/-1/abc/Infinity y las cuatro de editar (11 caen) | foto `null` en vez de `311.08` |
| (d1) | quitar `moneda` de `aGarantia` (`apps/desk/server/db/garantiaProveedor.ts:64`) | L2 | db `:39`, aGarantia, ficha previa, positiva; ruta `:67`, positiva, X→X, «toda ficha devuelta lleva su moneda» | `expected undefined to be 'USD'` |
| (g) | `validarRespuesta` vuelve a leer el valor | L2 | shared: S-2 y `:55`/`:58`/`:174-175`; ruta: `-1` y `'abc'` | `expected 422 to be 201` (el 999 sólo lo cierra `shared`, ver L2.11) |
| (h) | quitar `numero()` del costo | L2 | db: la `Queryable` falsa con `'150.54'` | `valorReclamado: null` en vez de `301.08` |
| (e) | no aplica: D-1 no añade DDL | — | — | — |
| regla 1 | mover `fotoDeLaOVI` antes de G6 | L2 | ninguna (91 pruebas verdes): la foto no es guarda | — |

**L3: sin mutación nueva.** Los dos `.tsx` están fuera de la red de pruebas (F0-00); lo observable que pintan lo prueban las de servidor de L2 (moneda en las respuestas, origen guardado, valor del cuerpo ignorado).

**Criterios de éxito (§14 de la propuesta):**
- [x] «Sí» con líneas completas guarda Σ cantidad × costo a 2 decimales, origen `ovi`: `packages/shared/src/valorReclamado.test.ts` (311,08; 40; 0,01), `apps/desk/server/db/garantiaProveedor.test.ts` y `apps/desk/server/routes/garantiaProveedor.test.ts` (foto 311,08 `ovi`); mutaciones (a), (i).
- [x] Cualquier hueco de S-4, o `salesorder_id` NULL → `null` y `manual`, nunca parcial: los diez casos de `apps/desk/server/db/garantiaProveedor.test.ts`, «nunca parcial», (f), y (c) para los que dependen de la base (debilidad anotada en L2.11).
- [x] El valor del cuerpo del «sí» no cambia nada; los cinco casos de S-5 al editar: bloque S-2 de `packages/shared/src/garantiaProveedor.test.ts`, 999/`-1`/`'abc'` de la ruta; X→X, X→Y, NULL→X, X→NULL, NULL→NULL; (b1), (b2), (g).
- [x] Las cuatro respuestas de la ficha y la de la medición llevan la moneda; la pantalla la pinta: «toda ficha devuelta lleva su moneda» y la medición (L2), (d1), (d2); la pantalla, desde `f.moneda` y `g.moneda`, con `grep -rn "USD" apps/desk/src` = 0 (comprobación de L3.4; los `.tsx` no tienen prueba).
- [x] `packages/shared/src/garantiaProveedor.ts:36` ya no dice «mientras no se calcule solo» y la constante sigue en la `:37`: `git diff` de L1 (`-36 +36`).
- [x] M0 verde y (a) a (d) rojas, registradas; las pruebas de posición de G1 a G14, sin tocar y verdes: tabla de arriba.
- [ ] La spec viva conserva sus líneas hasta RQ-TC-77 y lo nuevo empieza en RQ-TC-78: **del archive** (la spec viva no se toca aquí). Barrido de citas de L3.6: hecho.
- [ ] Typecheck, lint (165), detector, `npm test` y build salen 0: typecheck, lint (165) y build, medidos en L3 (0); detector y `npm test` son del cierre del orquestador (L3.c).
- [ ] El `archive-report.md` dice qué parte de F1B-13 cubre y lleva el inventario de §13: **del archive**; el inventario está en L3.7.

## Cierre del lote (cifras del aplicador)
- `npm run typecheck`: 0. `npm run build`: 0. `npm run lint -- --max-warnings 165`: 0 errores y **165** avisos (sin `any` nuevo). `grep -rn "USD" apps/desk/src`: 0.
- Medida (`git diff --shortstat --no-renames 2bf0c72b`, sin ficheros nuevos sin trackear): 8 ficheros, 175 inserciones y 44 borrados = **219**, de los cuales 131 inserciones son este informe, y el código de cliente son 14 y 14 (28). Muy por debajo de la válvula de 720.
- Tareas: L3.1 a L3.9 marcadas `[x]` en `tasks.md`; L3.c queda para el orquestador.
