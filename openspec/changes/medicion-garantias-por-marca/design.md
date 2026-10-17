# Diseño — `medicion-garantias-por-marca`

Leído en el worktree `medicion-garantias-por-marca` el 2026-10-17. Los supuestos S-1…S-6 del `proposal.md` se toman
como fijados. Toda línea citada se leyó en ese árbol; lo que no, lleva «hipótesis». Los ficheros que este cambio CREA
se nombran sin línea: todavía no existen.

## 1 · Enfoque

Una función pura en `packages/shared` hace TODO el cómputo (filtro, normalización, agrupación, sumas, cociente, fallas
repetidas y orden). El servidor lee las fichas «sí» con una sola `SELECT` y devuelve el resultado de esa función; el
cliente sólo pinta. En los ficheros citados se añade **al final** o se edita **en sitio**: ninguna línea existente de
un fichero con citas vivas cambia de número (§8).

    GET /api/medicion-garantia-proveedor
      requireAuth (401) ─► fichasReclamadas(db)  [SELECT … WHERE reclama = true ORDER BY id]
                        ─► medirGarantias(fichas)  [shared, puro]
                        ─► res.json(MedicionGarantias)
    Header › UserMenu ─► botón «Garantías» ─► modal lazy MedicionGarantias ─► getMedicionGarantias() ─► pinta

## 2 · Decisiones

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D-1 | Módulo NUEVO `packages/shared/src/medicionGarantias.ts`, exportado con una línea nueva al final de `packages/shared/src/index.ts` (hoy termina en `:44`) | Añadirlo al final de `packages/shared/src/garantiaProveedor.ts` | Las dos opciones no desplazan líneas; el módulo nuevo deja `garantiaProveedor.ts` (la ficha, sus validadores y su escalera) sin mezclar con la medición, y su prueba es un fichero propio que no toca `garantiaProveedor.test.ts` |
| D-2 | La consulta es `fichasReclamadas(db)`, añadida al final de `apps/desk/server/db/garantiaProveedor.ts` (tras `:161`), con `${COLUMNAS}` (`:35-37`) y `filas` (`:71`), que aplica `aGarantia` (`:46-69`) | Mapear columnas en la función nueva; o una `SELECT` con `GROUP BY` | Un solo mapeo: `numero` (`:43`) ya normaliza `numeric` a `number` (H-2), y una suma en SQL sería una segunda implementación del cómputo (molde H5). `ORDER BY id` hace determinista la etiqueta del grupo (D-5) |
| D-3 | Ruta `GET /api/medicion-garantia-proveedor`, sin prefijo común con las rutas de la ficha | `GET /api/garantia-proveedor/medicion` | Hoy no hay ningún `GET /api/garantia-proveedor/:id`, sólo `PUT` (`apps/desk/server/routes/garantiaProveedor.ts:65`) y `POST …/:id/avanzar` (`:85`), así que el `GET` no chocaría; pero un `PUT /api/garantia-proveedor/medicion` sí casa con `:65` (daría `404` por `idNumerico`, `:26`) y un `GET /:id` futuro registrado antes lo taparía. Sin prefijo común no hay ambigüedad posible |
| D-4 | La ruta va dentro de `registerGarantiaProveedorRoutes`, justo antes de su `}` final (`:107`); los nombres nuevos se añaden EN SITIO a los `import` de `:3-6` y `:9-12` | Fichero de rutas nuevo | Un fichero nuevo obliga a registrarlo en `apps/desk/server/app.ts`; dentro de la función existente sólo baja la línea de cierre, que nadie cita (barrido: 0 citas a `routes/garantiaProveedor.ts:107`) |
| D-5 | Clave de grupo = `fabricante` recortado y en minúsculas (S-1); etiqueta = el `fabricante` recortado de la ficha de menor `id` del grupo; ficha «sí» sin fabricante → grupo de clave `''` y etiqueta `null` | Etiqueta = la forma más frecuente; descartar fichas sin fabricante | La de menor `id` es estable y no depende del volumen. `fabricante` es obligatorio en un «sí» (`packages/shared/src/garantiaProveedor.ts:131-132`, ya recortado en `:126`), así que el grupo `''` es defensivo: descartarla en silencio contradiría la regla de cómputo 4. Hipótesis: hoy no hay ninguna |
| D-6 | El filtro `reclama` está en DOS sitios, cada uno con su prueba: el `WHERE` de D-2 y un `filter` en `medirGarantias` | Sólo en SQL; sólo en `shared` | La función es pura y exportada: debe ser correcta para cualquier entrada. Con una prueba por capa, quitar cualquiera de los dos se pone rojo (M-1a, M-1b); sin prueba propia, el segundo sería un detector inexistente |
| D-7 | El acceso es un botón en `UserMenu` de `apps/desk/src/components/Header.tsx`, junto al de Equipos (`:143-145`); el estado del modal y el `lazy` viven en `Header.tsx`, y el modal se pinta con `createPortal` a `document.body` | Montarlo en `apps/desk/src/App.tsx` como los demás modales (`:156-178`); pestaña en `NAV_TABS` (`:63-71`) | `App.tsx` tiene citas vivas en `openspec/specs/vistas-tablero/spec.md:47`, `:521` y `:717` (a `App.tsx:138`, `:57` y `:98-110`): el `lazy` (`:21-30`) y el `useState` (`:36-45`) caen antes y las desplazarían. `Header.tsx` no tiene citas vivas en `openspec/specs`. `UserMenu` sólo se pinta con sesión (`:140`) y ya es lo que ve todo usuario (Equipos). Una pestaña cambiaría `SectionKey` y `activeSection` de `App.tsx`. Precedente de componente autocontenido en la cabecera: `Campana` (`:15-61`). El portal es porque `<header>` lleva `z-30` siendo hijo flex, y eso crea su propio contexto de apilamiento (hipótesis sobre el efecto visual: sin portal, el modal no taparía capas fijas de `z-index` mayor) |
| D-8 | `getMedicionGarantias()` al final de `apps/desk/src/api/client.ts`, con el `json<T>` de `:3` | Llamar a `fetch` dentro del `.tsx` | Molde de `apps/desk/src/api/client.ts:845`; el tipo de respuesta se importa de `@ambientalia/shared` |
| D-9 | El cociente lo calcula `shared` y vale `null` si lo reclamado es 0 (S-6) | Dividir en el `.tsx` | El `.tsx` no tiene red de pruebas (F0-00); así no decide ni divide |

## 3 · `packages/shared/src/medicionGarantias.ts` (nuevo)

    export const UMBRAL_FALLA_REPETIDA = 2                     // S-2
    export function claveMedicion(v: string | null): string    // (v ?? '').trim().toLowerCase(); sin plegar acentos (S-1)
    export interface MedicionFabricante {
      fabricante: string | null; fichas: number; sinResolver: number; sinValorReclamado: number
      reclamado: number; recuperado: number; cociente: number | null
      resultados: Record<ResultadoReclamacion, number>
    }
    export interface FallaRepetida { fabricante: string | null; piezaReferencia: string; fichas: number; ticketIds: string[] }
    export interface MedicionGarantias { porFabricante: MedicionFabricante[]; fallasRepetidas: FallaRepetida[] }
    export function medirGarantias(fichas: readonly GarantiaProveedor[]): MedicionGarantias

- Sólo `reclama === true` (regla 1). `reclamado` suma `valorReclamado` no nulo de toda ficha (regla 2); un nulo suma
  1 a `sinValorReclamado` y nada a `reclamado` (regla 4). `recuperado` suma `valorRecuperado` sólo con
  `estado === 'resuelta'` (regla 3). `sinResolver` = `estado !== 'resuelta'`; `resultados` cuenta los tres resultados
  de `RESULTADOS_RECLAMACION` (`garantiaProveedor.ts:14`), siempre con las tres claves (regla 5).
- Falla repetida: clave `claveMedicion(fabricante)` + `claveMedicion(piezaReferencia)`; referencia vacía tras recortar no
  cuenta; sale si `fichas >= UMBRAL_FALLA_REPETIDA` (regla 6). `piezaReferencia` mostrada = la de menor `id`.
- Orden: `porFabricante` por `reclamado` descendente y, a igualdad, por clave; `fallasRepetidas` por `fichas`
  descendente y luego por clave. El cliente no ordena.

## 4 · Servidor

- `fichasReclamadas(db): Promise<GarantiaProveedor[]>` —
  `SELECT ${COLUMNAS} FROM garantia_proveedor WHERE reclama = true ORDER BY id`, vía `filas`.
- `app.get('/api/medicion-garantia-proveedor', requireAuth(db), asyncHandler(async (_req, res) => {
  res.json(medirGarantias(await fichasReclamadas(db))) }))`. Única guarda: la sesión (`401`,
  `apps/desk/server/auth/middleware.ts:17` y `:19`). Sin `requireAdmin` (S-4): mismo permiso que la lectura de la
  ficha (`routes/garantiaProveedor.ts:31`). Sin migración: la tabla ya existe.

## 5 · Regla invariable 13 — decisiones del cliente, una a una (regla de mutación 3)

| # | Decisión del `.tsx` | Quién la impone |
|---|---|---|
| C-1 | Enseñar el botón a todo usuario con sesión | `requireAuth` de la ruta nueva (D-4); `UserMenu` sólo existe con sesión (`Header.tsx:140`) y `App.tsx:88` no pinta la cabecera sin usuario. Comodidad: sin sesión el servidor da `401` igual |
| C-2 | Qué fichas cuentan (sólo «sí») | `fichasReclamadas` (`WHERE reclama = true`) y `medirGarantias` (D-6) |
| C-3 | Agrupar por fabricante y la etiqueta del grupo | `medirGarantias` / `claveMedicion` (D-5) |
| C-4 | Reclamado, recuperado, sin valor, sin resolver, desglose | `medirGarantias` (§3) |
| C-5 | Cociente, o «—» si no hay | `medirGarantias` devuelve `null` (D-9); el `.tsx` pinta «—» ante `null`, sin comparar nada |
| C-6 | Qué es falla repetida | `medirGarantias` y `UMBRAL_FALLA_REPETIDA` |
| C-7 | Orden de filas | `medirGarantias` (§3) |
| C-8 | Lista vacía → «Sin reclamaciones» | Arrays vacíos del servidor; el `.tsx` mira `length === 0`, no filtra |

El `.tsx` no contiene `reduce`, `filter`, `sort`, `toLowerCase` ni divisiones sobre los datos: el verify lo comprueba por
lectura (criterio de éxito 5). El formato de importes (`toLocaleString('es-CO')`) es presentación.

## 6 · Pruebas y mutaciones

Prueba primero (strict TDD) en ficheros NUEVOS: `packages/shared/src/medicionGarantias.test.ts` (puro) y
`apps/desk/server/routes/medicionGarantias.test.ts`, con el arnés pg-mem de `apps/desk/server/testing/appHarness.ts`
(`instalarArnes`, `appWith`; molde `apps/desk/server/routes/garantiaProveedor.test.ts:1-58`: siembra con
`registrarRespuesta` y `avanzarFicha`, y cookie de usuario sin cargo ni admin). La vista queda fuera de la red de
pruebas por decisión de Gerencia (F0-00): sin rojo previo.

| M | Mutación | Prueba que se pone roja |
|---|---|---|
| M-1a | Quitar el `filter` de `reclama` en `medirGarantias` | shared: una ficha `reclama: false` con `fabricante` y valor no aparece en ninguna cifra |
| M-1b | Quitar `WHERE reclama = true` de `fichasReclamadas` | servidor: un «no» sembrado no sale en `fichasReclamadas` ni en el `GET` (con M-1a viva, la de la capa de datos) |
| M-2 | Contar abiertas/enviadas como recuperadas (quitar la condición `resuelta`) | shared: una `enviada` con `valorRecuperado` sintético 999 no suma a `recuperado` |
| M-3 | Sumar a `recuperado` el `valorReclamado` de las rechazadas | shared: `rechazada` con reclamado 500 y recuperado 0 deja `recuperado = 0` y `resultados.rechazada = 1` |
| M-4 | Contar la ficha sin valor como 0 (`?? 0` sin incrementar `sinValorReclamado`) | shared: `sinValorReclamado = 1` y `fichas` la incluye |
| M-5 | `UMBRAL_FALLA_REPETIDA` 2 → 1 | shared: una referencia con UNA ficha no sale en `fallasRepetidas` |
| M-6 | Quitar `trim`/`toLowerCase` de `claveMedicion` | shared: «Acme» y « ACME » forman un solo grupo y una sola falla repetida |
| M-7 | Quitar `requireAuth` de la ruta | servidor: sin cookie → `401` |
| M-8 | Cociente sin la guarda de 0 | shared: grupo con reclamado 0 → `cociente: null` (no `NaN`) |

- **Regla 1 (posición):** la ruta tiene UNA sola guarda; no hay par que ordenar. La prueba de igualdad «mismo cuerpo para
  un usuario sin cargo y para admin» fija además que no hay un segundo permiso.
- **Regla 2 (fichero vigilado):** no aplica; ninguna guarda nueva lee un fichero de datos.
- **Regla 3:** tabla del §5, por escrito.
- **Regla 4:** §8.

## 7 · Ficheros y estimación

| Fichero | Acción | Ingenua |
|---|---|---|
| `packages/shared/src/medicionGarantias.ts` | crear | 75 |
| `packages/shared/src/medicionGarantias.test.ts` | crear | 140 |
| `packages/shared/src/index.ts` | +1 línea al final | 1 |
| `apps/desk/server/db/garantiaProveedor.ts` | función al final | 7 |
| `apps/desk/server/routes/garantiaProveedor.ts` | ruta antes de `:107` + imports en sitio | 5 |
| `apps/desk/server/routes/medicionGarantias.test.ts` | crear | 95 |
| `apps/desk/src/api/client.ts` | función al final | 6 |
| `apps/desk/src/components/MedicionGarantias.tsx` | crear | 125 |
| `apps/desk/src/components/Header.tsx` | `lazy`, `createPortal`, estado y botón en `UserMenu` | 16 |

Ingenua ≈ 470; con ×1,8 ≈ 846 > 720. **Dos intentos de apply:**

- **Lote 1 — `shared`** (módulo, prueba, `index.ts`): 216 × 1,8 ≈ **390**.
- **Lote 2 — servidor y cliente** (capa de datos, ruta, prueba de servidor, `client.ts`, vista, `Header.tsx`):
  254 × 1,8 ≈ **460**.

Cada intento mide con `git diff --shortstat --no-renames` contra su commit de partida más `wc -l` de lo nuevo sin
trackear.

## 8 · Citas (regla de mutación 4)

- **No desplazan ninguna línea:** `packages/shared/src/index.ts` (línea nueva tras `:44`),
  `apps/desk/server/db/garantiaProveedor.ts` (tras `:161`; las citas vivas llegan hasta `:158-160`),
  `apps/desk/src/api/client.ts` (al final), los `import` editados en sitio de `routes/garantiaProveedor.ts:3-6` y `:9-12`.
- **Desplazan, sin citas que caigan detrás:** `routes/garantiaProveedor.ts` (sólo baja la línea de cierre `:107`) y
  `Header.tsx` (inserciones en la cabecera de `import` y en `UserMenu`; 0 citas vivas en `openspec/specs`).
- **No se toca:** `App.tsx`, `app.ts`, `garantiaProveedor.ts` de `shared`.
- El cierre repite el barrido de `Header.tsx`, `routes/garantiaProveedor.ts` y `db/garantiaProveedor.ts` contra el
  fichero, incluidas las abreviadas, y deja como caso B las de documentos fechados (`docs/sdd/Paquete_de_Despliegue_*`).

## 9 · Amenazas, migración y preguntas

- Matriz de amenazas: N/A — sin enrutado de procesos, shell, subprocesos, automatización de VCS ni clasificación de
  ejecutables; una ruta HTTP de lectura más tras `requireAuth`.
- Migración: no. Interruptor: no (no enciende ningún escritor). Marcha atrás: revertir los commits.
- Preguntas abiertas: ninguna que bloquee. D-5 (etiqueta de grupo y grupo sin fabricante) y D-7 (botón en `UserMenu`)
  van a la lista semanal de supuestos con S-1…S-6.
