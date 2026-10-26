# Diseño — `valor-reclamado-usd`

Leído en el worktree `valor-reclamado-usd` el 2026-10-26. Los supuestos S-1…S-11 del `proposal.md` se toman como fijados
y este diseño cierra S-8 (§3). Toda línea citada se leyó en ese árbol; lo que no, lleva «hipótesis». Los ficheros que el
cambio CREA se nombran sin línea. Va ANTES de la spec a propósito: §6 es la fuente del comportamiento observable.

## 1 · Enfoque

La foto, el origen al editar, la etiqueta del origen y la moneda viven en `packages/shared`, puros. La capa de datos lee
en TS el `raw` de la orden y los costos y entrega a `shared`; la ruta pasa la foto a la escritura. El cliente sólo pinta
lo que llega. En todo fichero citado se edita **en sitio** o se añade **al final**: ninguna línea cambia de número (§11).

    POST …/garantia-proveedor   G1…G6 (sin cambios) ─► fotoDeLaOVI(db, asociación)  [sólo «sí»]
        ov_asociaciones.salesorder_id ─► books.sales_orders.raw ─► lineasDeLaOVI(raw)          [shared]
        ─► books.items.purchase_rate  IN ($1,…) ─► fotoValorReclamado(líneas, costos)          [shared]
        ─► registrarRespuesta(…, foto) ─► INSERT (valor, origen 'ovi' | 'manual') ─► 201 con moneda
    PUT /api/garantia-proveedor/:id   G11…G14 ─► origenTrasEditar(ficha, valor) [shared] ─► editarFicha(…, origen)
    toda lectura ─► aGarantia ─► moneda: MONEDA_GARANTIA_PROVEEDOR     medirGarantias ─► cada grupo con moneda

## 2 · Decisiones

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D-1 | **S-8: moneda CONSTANTE en `shared`** (`MONEDA_GARANTIA_PROVEEDOR = 'USD'`); detalle en §3 | Columna en `public.garantia_proveedor` | La decisión fija USD en los dos lados y la conversión es manual al anotar (`openspec/config.yaml:5439`, `:5455`): la moneda es un invariante de la tabla, no un dato por fila |
| D-2 | Funciones en módulo NUEVO `packages/shared/src/valorReclamado.ts`, exportado con una línea al final de `packages/shared/src/index.ts` (hoy acaba en `:54`). Las dos constantes (`ORIGEN_VALOR_OVI`, `MONEDA_GARANTIA_PROVEEDOR`) y su tipo, al FINAL de `packages/shared/src/garantiaProveedor.ts` (hoy acaba en `:191`) | Todo al final de `garantiaProveedor.ts` | La interfaz `GarantiaProveedor` (`:43-64`) necesita el tipo de la moneda: declarado en el mismo fichero no hace falta una línea de `import` nueva (los tipos se elevan). El módulo nuevo importa de `garantiaProveedor.ts` y nunca al revés: sin ciclo. Molde D-1 de `medicion-garantias-por-marca` |
| D-3 | Dos funciones puras: `lineasDeLaOVI(raw)` y `fotoValorReclamado(líneas, costos)` | Una sola que reciba el `raw` | El servidor necesita los `item_id` ANTES de consultar costos: con una sola habría que analizar el `raw` dos veces (molde H5) |
| D-4 | La capa de datos lee (`fotoDeLaOVI`, al final de `apps/desk/server/db/garantiaProveedor.ts`, hoy acaba en `:179`) y la ruta pasa `foto` a `registrarRespuesta`, editando EN SITIO `apps/desk/server/routes/garantiaProveedor.ts:57`, sólo si `reclama` | (i) Calcularla DENTRO de `registrarRespuesta`; (ii) leer en la ruta con líneas nuevas | (i) ignoraría el valor de las siembras que ya fijan importes (`apps/desk/server/routes/medicionGarantias.test.ts:43-51` en `c6147860`): la medición necesitaría fixtures de Books. (ii) desplazaría las líneas 56 a 121 de la ruta, citadas en los archivados (`apps/desk/server/routes/garantiaProveedor.ts:57`, `:65`, `:80`, `:109`; p. ej. `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/verify-report.md:34`). La foto queda tras G6 (`apps/desk/server/routes/garantiaProveedor.ts:55`) y antes del `INSERT`, sin transacción propia (S-9) |
| D-5 | `RespuestaReclamacion` (`:68-70`) PIERDE `valorReclamado`; `validarRespuesta` deja de leerlo; `registrarRespuesta` gana `foto?: ValorReclamadoConOrigen`, por defecto `SIN_FOTO` | Conservar el campo, siempre `null` | Un campo que el cuerpo nunca llena es una puerta para saltarse la foto. Con `foto` opcional las ~20 llamadas de prueba siguen compilando y la medición siembra sus importes por `foto` |
| D-6 | `origenTrasEditar` en `shared`; la ruta la llama en `:78` (en sitio) y `editarFicha` escribe el origen que recibe | `CASE` en el `UPDATE`; decidirlo en la capa de datos | Un `CASE` sería una segunda implementación de S-5 (H5). La ruta ya tiene la ficha leída en `:67`; G11-G14 (`:68-77`) no se mueven |
| D-7 | UN campo `moneda` por objeto que lleva importes: `GarantiaProveedor.moneda` (cubre `valorReclamado` y `valorRecuperado`) y `MedicionFabricante.moneda` | Un campo por importe; uno global en la medición | La decisión fija la misma moneda para los dos importes. Por grupo, la medición sigue cumpliendo «con un solo cambio» (`openspec/specs/tickets-core/spec.md:4055-4058`), porque la moneda la pone `medirGarantias` |
| D-8 | `lineasDeLaOVI` acepta el `raw` como objeto o como texto JSON; el costo pasa por `numero()` (`apps/desk/server/db/garantiaProveedor.ts:43`) | Fiarse del tipo que da el controlador | `numeric` llega como texto de node-postgres y como número de pg-mem (H-2, `:42`); para el `jsonb`, precedentes que aceptan las dos formas: `apps/desk/server/db/directory.ts:32` y `packages/zoho-sync/src/booksHub/sync.test.ts:112`. Sin `numero()`, en producción todo costo sería texto y no habría foto nunca, con pg-mem en verde |
| D-9 | Redondeo: `Math.round(Σ × 100) / 100`, una vez | Por línea | S-6. Hipótesis: con costos de dos decimales no aparecen empates de medio centavo |
| D-10 | El formulario recibe `moneda?`: sin ella (el «sí») no hay campo de valor; con ella, la etiqueta la lleva | Reusar `conRma` | Son dos preguntas distintas; así la moneda del campo es la que llega en la ficha |

## 3 · S-8 por escrito: constante frente a columna

| Aspecto | (a) Constante en `shared` — ELEGIDA | (b) Columna `moneda` |
|---|---|---|
| Migración | Ninguna | `ALTER TABLE public.garantia_proveedor ADD COLUMN IF NOT EXISTS moneda text` al final de `schema.sql` (hoy `:848`); los recuentos del guardián pasan de 69 a 70 y de 40 a 41 (`packages/zoho-sync/src/db/migrate.test.ts:376-377`); mutación (e); nota en `DEPLOY.md` |
| Fichas previas (P-1) | `moneda: 'USD'`, valor y origen intactos: si alguna se anotó en pesos, se pinta mal hasta que Gerencia la corrija | `moneda: null`: exacto, pero la API devuelve importes sin moneda, que es justo lo que la regla prohíbe |
| Una columna, dos importes | No aplica | Una ficha previa que se resuelve ahora tendría el reclamado sin moneda y el recuperado en USD: harían falta DOS columnas |
| Medición | Suma como hoy, con la moneda al lado | Tiene que decidir qué hace con un importe NULL (excluirlo, contarlo aparte o agrupar por moneda): regla nueva en `shared` |
| Regla «sin moneda no se admite en adelante» (`CLAUDE.md:693`) | Todo importe sale con moneda desde el despliegue | Las fichas previas saldrían sin moneda indefinidamente |

**Marcha atrás de (a):** si algún día hace falta otra moneda, la columna se añade con `DEFAULT 'USD'` y es verdad para
toda fila, siempre que P-1 se haya resuelto (lo previo corregido a mano a USD, consecuencia (3) de la decisión) y el tipo
se ensanche. Por eso P-1 conviene antes de publicar (§12).

## 4 · `packages/shared`

**Al final de `garantiaProveedor.ts` (tras `:191`):**

    export const ORIGEN_VALOR_OVI = 'ovi'
    export type OrigenValorReclamado = typeof ORIGEN_VALOR_MANUAL | typeof ORIGEN_VALOR_OVI
    export const MONEDA_GARANTIA_PROVEEDOR = 'USD'
    export type MonedaGarantiaProveedor = typeof MONEDA_GARANTIA_PROVEEDOR

**En sitio en `garantiaProveedor.ts`, misma cuenta de líneas:**

- `:36` (S-4 corregido, una línea; `:37` sigue siendo `ORIGEN_VALOR_MANUAL`):
  `/** Origen del valor que escribe una persona o que queda sin foto de la OVI (valor-reclamado-usd, S-3 y S-5); importe en USD. */`
- `:60`: `valorRecuperado: number | null; moneda: MonedaGarantiaProveedor`.
- `:70`: el «sí» queda `{ reclama: true; fabricante; piezaReferencia; piezaSerial }`, sin `valorReclamado` (S-2).
- `:151`: `datosComunes({ ...cuerpo, valorReclamado: null })`: el valor del cuerpo ni se valida ni se guarda, así que un
  cliente en caché que lo mande, válido o no, recibe `201`. `:153` construye el «sí» con los tres campos, sin el valor.
  `validarDatosFicha` (`:157-164`) sigue validándolo con `:137-138`: editar sí lo admite.

**Nuevo `valorReclamado.ts`:**

    export interface LineaOVI { itemId: string; cantidad: number }
    export interface ValorReclamadoConOrigen { valorReclamado: number | null; origenValorReclamado: OrigenValorReclamado }
    export const SIN_FOTO: ValorReclamadoConOrigen                        // { null, 'manual' } (S-3)
    export function lineasDeLaOVI(raw: unknown): LineaOVI[] | null
    export function fotoValorReclamado(lineas: readonly LineaOVI[] | null, costos: ReadonlyMap<string, number | null>): ValorReclamadoConOrigen
    export function origenTrasEditar(antes: Pick<GarantiaProveedor, 'valorReclamado' | 'origenValorReclamado'>, nuevo: number | null): string | null
    export const ETIQUETA_ORIGEN_VALOR: Record<OrigenValorReclamado, string>   // ovi: 'calculado de la OVI', manual: 'a mano'
    export function etiquetaOrigenValor(valor: number | null, origen: unknown): string | null

- `lineasDeLaOVI` (S-4, mitad de la orden): `raw` objeto, o texto que parsea a objeto; si no, `null`. `null` también si
  `line_items` no es una lista, está vacía, o alguna línea no trae `item_id` texto no vacío o `quantity` número finito > 0.
  Una cantidad en texto (`'2'`) es hueco.
- `fotoValorReclamado` (S-4, mitad del catálogo; S-6): `null` → `SIN_FOTO`. Si el costo de ALGUNA línea falta en el mapa,
  es `null`, no es finito o es ≤ 0 → `SIN_FOTO`. Si no, `{ Math.round(Σ cantidad × costo × 100) / 100, 'ovi' }`. Un
  artículo repetido en dos líneas cuenta dos veces. Nunca una suma parcial.
- `origenTrasEditar` (S-5): igual por `===` (NULL→NULL, X→X) → el origen anterior; X→NULL, NULL→X, X→Y → `'manual'`.
- `etiquetaOrigenValor` (S-7): `null` si el valor es `null` o el origen no es de la lista; si no, su etiqueta.

**`medicionGarantias.ts`, en sitio:** `:1` importa `MONEDA_GARANTIA_PROVEEDOR` y su tipo; `:26`
`recuperado: number; moneda: MonedaGarantiaProveedor`; `:63` añade `moneda: MONEDA_GARANTIA_PROVEEDOR` al grupo nuevo.
`conNumerosDeTicket` (`:117-122`) pasa `porFabricante` tal cual (`:119`): la moneda viaja sin tocarla.

## 5 · Servidor

`apps/desk/server/db/garantiaProveedor.ts`, en sitio: `:4-5` (imports: sale `ORIGEN_VALOR_MANUAL`, que deja de usarse);
`:64` `…, moneda: MONEDA_GARANTIA_PROVEEDOR,` en `aGarantia`; `:89` gana `foto?: ValorReclamadoConOrigen`; `:91`
`const { asociacion, respuesta, foto = SIN_FOTO } = a`; `:99` escribe `foto.valorReclamado, foto.origenValorReclamado`;
`:114` gana `origen: string | null`; `:116` añade `, origen_valor_reclamado = $7`; `:118` añade `origen`. Al final:

- `fotoDeLaOVI(db, asociacionId): Promise<ValorReclamadoConOrigen>`: `SELECT salesorder_id FROM ov_asociaciones WHERE id = $1`
  (`asociacionPorId`, `:73-76`, no lo trae, y `apps/desk/server/db/garantiaProveedor.test.ts:69` fija su forma con `toEqual`); si
  hay id, `SELECT raw FROM books.sales_orders WHERE salesorder_id = $1` (calificada: la vista `public.sales_orders`,
  `packages/zoho-sync/src/db/schema.sql:176-182`, no expone `raw`; precedente de `books.` calificado:
  `apps/desk/server/db/materializarAccesorios.ts:60`); `lineasDeLaOVI`; si no es `null`,
  `SELECT item_id, purchase_rate FROM books.items WHERE item_id IN ($1,…)` con los ids sin repetir (molde `:176-177`) y
  el costo por `numero()`; devuelve `fotoValorReclamado`. Sin funciones `jsonb` en SQL. Nunca rechaza (S-9).

`apps/desk/server/routes/garantiaProveedor.ts`, en sitio: `:5` y `:10` (imports); `:57`
`registrarRespuesta(db, { asociacion, respuesta: respuesta.valor, por: user.name, foto: respuesta.valor.reclama ? await fotoDeLaOVI(db, asociacion.id) : undefined })`
(dentro del `try`: un fallo de lectura es un `500` como cualquier otra consulta); `:78`
`editarFicha(db, ficha.id, datos.valor, origenTrasEditar(ficha, datos.valor.valorReclamado))`. G1-G14 no cambian.

## 6 · Comportamiento observable (fuente para la spec)

- **«Sí»:** `201` con la ficha. Con `salesorder_id`, orden y catálogo completos: `valorReclamado` = Σ cantidad × costo a
  2 decimales y `origenValorReclamado: 'ovi'`. Ante cualquier hueco de §4, o `salesorder_id` NULL: `null` y `'manual'`.
  Un `valorReclamado` en el cuerpo, sea cual sea, no cambia nada ni da `422`. G1-G6, sus códigos y su orden, intactos.
- **Editar:** el origen sale de S-5; la respuesta trae valor, origen y moneda. Valor inválido: `422` como hoy.
- **Toda ficha devuelta** (GET del ticket, «sí», «no», editar y avanzar) lleva `moneda: 'USD'`; el recuperado se anota
  en esa moneda. Las fichas **previas** salen con `moneda: 'USD'` y su valor y su origen (`'manual'`) intactos: no se
  reescribe ningún dato.
- **Medición:** cada grupo de `porFabricante` lleva `moneda: 'USD'`; nada más cambia, y la ruta sigue devolviendo lo de
  `shared` con un solo cambio. `cociente` es un cociente, no un importe: sin moneda.
- **Pantalla:** cada importe con su moneda al lado y su origen junto al reclamado; el «sí» no pide valor.

## 7 · Cliente (`.tsx` fuera de la red de pruebas, F0-00: sin rojo previo; lo respalda §9)

`apps/desk/src/components/PanelGarantiaProveedor.tsx`, en sitio: `:4` importa `etiquetaOrigenValor`; `:26`
`fmtValor(v, moneda)` = `'—'` o el número con la moneda; `:47-48` el formulario gana `moneda?: string`; `:61` el campo de
valor sólo con `moneda`, etiquetado «Valor reclamado (moneda)»; `:85` el «sí» no pasa `moneda`; `:87` el cuerpo deja de
llevar el valor; `:118` valor con `f.moneda` y la etiqueta del origen; `:120` recuperado con `f.moneda`; `:132` pasa
`moneda={f.moneda}`; `:146` marcador «Valor recuperado (moneda)». `MedicionGarantias.tsx`, en sitio: `:16`
`fmtValor(v, moneda)`; `:66-67` con `g.moneda`. `apps/desk/src/api/client.ts:848` deja de declarar `valorReclamado` en el
cuerpo del «sí». **Ningún `.tsx` contiene el literal `USD`**: `grep -rn "USD" apps/desk/src` da 0 al cerrar.

## 8 · Regla 13 — casilla (regla de mutación 3)

| # | Decisión del cliente | `shared` | La impone el servidor (línea exacta al cerrar el lote) |
|---|---|---|---|
| C-1 | No ofrecer el valor en el «sí» | `validarRespuesta` (`packages/shared/src/garantiaProveedor.ts:151`) | `apps/desk/server/routes/garantiaProveedor.ts:57` → `registrarRespuesta` con `fotoDeLaOVI` |
| C-2 | Moneda junto a cada importe y en la captura | `MONEDA_GARANTIA_PROVEEDOR` | `aGarantia` (`apps/desk/server/db/garantiaProveedor.ts:64`) y `medirGarantias` (`packages/shared/src/medicionGarantias.ts:63`) |
| C-3 | Pintar el origen | `etiquetaOrigenValor` | El origen que guardan `registrarRespuesta` (`apps/desk/server/db/garantiaProveedor.ts:99`) y `editarFicha` (`:116`) |
| C-4 | Mandar el valor editado tal cual | `origenTrasEditar` | `apps/desk/server/routes/garantiaProveedor.ts:78` |

El formato (`toLocaleString`) es presentación. El `.tsx` no compara valores ni decide el origen.

## 9 · Pruebas y mutaciones

Rojo antes de cada verde. Lo nuevo va en ficheros nuevos o AL FINAL; lo que S-2 y D-5 vuelven falso se edita en sitio:

- `packages/shared/src/valorReclamado.test.ts` (nuevo): los casos de S-4, S-5, S-6 y S-7, con cantidades ≠ 1 y decimales.
- `packages/shared/src/garantiaProveedor.test.ts`: en sitio `:55`, `:58` (sin la clave), `:65-67` (las tres filas pasan
  a UN comentario de tres líneas que remite al bloque del final), `:174-175` (título y aserción del «sí»); al final, el
  bloque S-2: `-1`, `'abc'`, `Infinity`, `'800'` y `800000` se ignoran en el «sí» y siguen siendo error al editar.
- `packages/shared/src/medicionGarantias.test.ts`: en sitio `:15` (`moneda` en el constructor); al final, la moneda por grupo.
- `apps/desk/server/db/garantiaProveedor.test.ts`: en sitio `:16`, `:33`, `:39`, `:51`, `:53` y el cuarto argumento en
  `:108`, `:112`, `:115`, `:116`; al final, `fotoDeLaOVI` con fixtures pg-mem (`raw` por `JSON.stringify`, molde
  `packages/zoho-sync/src/books/subOV.test.ts:31-32`; `asociarOV` con `salesorderId`), `editarFicha` escribiendo el
  origen, y una `Queryable` falsa con `purchase_rate` y `raw` como TEXTO (molde `:76-91`).
- `apps/desk/server/routes/garantiaProveedor.test.ts`: en sitio `:32`, `:67`; al final, «sí» con foto y sin ella,
  valor del cuerpo ignorado, PUT X→X y X→Y sobre una ficha `ovi`, y `moneda` en GET, «sí», PUT y avanzar.
- `apps/desk/server/routes/medicionGarantias.test.ts`: en sitio `:37`, `:41`, `:43` (la siembra pasa el importe por
  `foto`); al final, `moneda` en cada grupo. `apps/desk/server/services/avisoReclamacionProveedor.test.ts:26`, en sitio.

| M | Mutación | Prueba que se pone roja |
|---|---|---|
| M0 | Ninguna | Toda la suite, verde |
| (a) | Quitar la `cantidad` de la suma | shared: 2 × 150,54 + 1 × 10 = 311,08; db: la foto del fixture con cantidad 2 |
| (b) | Dejar el origen en `ovi` al editar: `origenTrasEditar` devuelve siempre el anterior, o `editarFicha` sin `$7` | shared: X→Y y NULL→X dan `manual`; ruta: PUT X→Y sobre `ovi` |
| (c) | Regla 2: el fixture de `books.sales_orders` con una línea sin `item_id` | db y ruta: la prueba POSITIVA de la foto deja de dar `ovi` |
| (d) | Quitar la moneda: de `aGarantia` (d1) o del grupo de `medirGarantias` (d2) | (d1) ruta: las cuatro respuestas; (d2) shared y ruta de la medición |
| (e) | No aplica: D-1 no añade DDL | — |
| (f) | Suma parcial: saltar la línea sin costo | shared: un artículo ausente o con costo 0 da `SIN_FOTO` |
| (g) | `validarRespuesta` vuelve a leer el valor | shared S-2; ruta: cuerpo con 999 no cambia la ficha y `-1` no da `422` |
| (h) | Quitar `numero()` del costo | db: la `Queryable` falsa con `'150.54'` |
| (i) | Redondear por línea | shared: tres líneas de 1 × 0,004 dan 0,01 |

- **Regla 1:** la foto no es guarda y no rechaza; moverla no cambia ninguna respuesta. Las pruebas de posición de G1-G14,
  sin tocar y verdes.
- **Lint:** `npm run lint -- --max-warnings 165` no tiene holgura (`eslint.config.js:15`) y `no-explicit-any` avisa
  (`:31`): el código nuevo no lleva `any`.

## 10 · Lotes y estimación (válvula 720; real ≈ ×1,8)

| Lote | Contenido | Ingenua | ×1,8 |
|---|---|---|---|
| L1 · `shared` aditivo | `valorReclamado.ts` y su prueba; constantes al final y `:36` de `garantiaProveedor.ts`; `index.ts`; moneda de la medición con su prueba de `shared` y la de la ruta; mutaciones (a), (d2), (f), (i) | ~205 | ~370 |
| L2 · la ficha en el servidor | S-2 y `moneda` en `shared` (`:60`, `:70`, `:151`, `:153`, sus pruebas, `:15` de la medición); capa de datos; ruta; pruebas de servidor y siembras en sitio; mutaciones (b), (c), (d1), (g), (h) | ~266 | ~480 |
| L3 · cliente y cierre | Los dos `.tsx`, `client.ts`; casilla del §8 con sus líneas; registro de mutaciones; barrido del §11 | ~98 | ~175 |

L1 no rompe tipos (todo aditivo); L2 trae junto todo lo que el cambio de tipos arrastra, para cerrar en verde. Juntar L2 y
L3 daría ~655, a 65 de la válvula: no se recomienda. La propuesta estimaba un lote de ~460 (`proposal.md` §9); la
diferencia son las ediciones en sitio de las siembras y las pruebas H-2. Cada intento mide con
`git diff --shortstat --no-renames` contra su partida más `wc -l` de lo nuevo sin trackear.

## 11 · Citas (regla de mutación 4)

- **Sin desplazar ninguna línea:** `packages/shared/src/garantiaProveedor.ts` (citas vivas en `:36-37`, `:68-70`,
  `:137-138`), `medicionGarantias.ts`, `apps/desk/server/db/garantiaProveedor.ts` (`DEPLOY.md:490` cita su línea 144),
  `apps/desk/server/routes/garantiaProveedor.ts` (`:31`, `:43`, `:55`, `:57`, `:67`, `:108-111`, citadas en `docs/sdd`,
  en la propuesta y en los archivados), los dos `.tsx` (archivados citan `PanelGarantiaProveedor.tsx:25`, `:26`, `:158` y
  `MedicionGarantias.tsx:17`, `:37`), `client.ts` y los ficheros de prueba. Lo nuevo, al final; `index.ts`, tras `:54`.
- **Cambia lo que dice la línea, no su número:** `:36`, `:57`, `:78`, `:99`, `:116` y otras. Las citas a ellas en
  documentos fechados (`docs/sdd/Paquete_de_Despliegue_*`, archivados) son caso B: no se renumeran.
- **Al cerrar L3:** `grep -rnoE "<fichero>\.(ts|tsx):[0-9]+(-[0-9]+)?"` por cada fichero tocado, más el pase de las
  abreviadas en los que ya los citan, comprobando cada cita contra lo que afirma; la spec viva, en su propio intento.

## 12 · Amenazas, migración y preguntas

- Matriz de amenazas: N/A — sin enrutado de procesos, shell, subprocesos, automatización de VCS ni clasificación de
  ejecutables; una lectura más de tablas ya replicadas.
- Migración: **no** (D-1). Interruptor: no (no enciende ningún escritor externo). Marcha atrás: revertir los commits; las
  fichas con origen `ovi` conservan su valor.
- Despliegue: recomendado correr P-1 (`proposal.md` §12) ANTES de publicar, porque desde ese día toda ficha previa se
  pinta en USD.
- Preguntas que bloqueen: ninguna. D-1…D-10 van a la lista semanal de supuestos con S-1…S-11.
