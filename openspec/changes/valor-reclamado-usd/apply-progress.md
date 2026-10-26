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

Pruebas que **nacen verdes por ser CARACTERIZACIÓN** (fijan lo que ya hay y deben seguir así): «sin foto» (la asociación sin orden da `null`/`manual`), «un hueco… nunca parcial» en la ruta, «la foto no es guarda: G1-G6 con una orden completa» y NULL→X / NULL→NULL de la ruta (manual→manual). Ediciones en sitio sin rojo propio (sólo tipos o cambio de expectativa): `medicionGarantias.test.ts:15` (`moneda` en el constructor; lo cubre `typecheck`), `avisoReclamacionProveedor.test.ts:26`, `db…test.ts:16/:51/:53/:108/:112/:115/:116`. Triangulación saltada en el constructor de `:15`: estructural, un solo resultado posible.

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
