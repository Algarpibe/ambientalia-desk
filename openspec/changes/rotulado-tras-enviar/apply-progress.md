# Progreso de apply: rotulado-tras-enviar

## Lote 1a — retirada de las dos guardas, G2, S12, esquema, `enviado_por_id`

Partida `036a9e2`. Hechas 1a.1 a 1a.16 salvo lo que el orquestador cierra (commit, detector de citas). Sin tocar `apps/desk/src/components`, `openspec/specs/`, `CLAUDE.md`, `config.yaml` ni `ENTRADA.md`.

**Rojo literal (antes del producto), por grupo**
- `packages/shared/src/recepcion.test.ts` (`npx vitest run` sobre el fichero): 5 failed | 64 passed. «expected { ok: false, …(1) } to match object { ok: true }» (6), «'Confirma que el equipo quedó rotulado…' to be 'OK'» (PA-3), «'Falta confirmar que el equipo quedó r…' to match /Falta la foto de cada novedad marcada…/» y «…to match /Faltan fotos obligatorias/» (PE-3), «…to contain 'no admite accesorios marcados…'» (PI-7).
- `apps/desk/server/recepcion.test.ts`: 5 failed | 68 passed. «rotulado=false: expected 422 to be 201», «expected 'Admin' to be null», «expected 422 to be 200» (línea 370), «expected 'Falta confirmar que el equipo quedó r…' to match /Faltan fotos obligatorias/» (S3a), «expected '2026-10-13T00:03:24.329Z' to be null» (PT-1b).
- `apps/desk/src/lib/recepcionForm.test.ts`: 1 failed | 31 passed. «expected 'Confirma que el equipo quedó rotulado…' to be null» (línea 66). La 88 nace verde por construcción (pasa a un cuerpo con la lista vacía).
- `migrate.test.ts` (con el esquema ya ampliado, orden de trabajo: rojo = ajustes de D7 hechos antes que `schema.sql`): «ALTER TABLE en schema.sql: expected 64 to be 66» y tres «expected … to match /^CREATE TABLE IF NOT EXISTS public\.…/» (índices desplazados).
- `PS-12`: «1 failed | 11 passed» (columnas inexistentes), reconfirmado quitando las 4 líneas de `schema.sql`.
- `apps/desk/server/rotulado.test.ts` (R42-a, R42-b, R42-d): `column "enviado_por_id" does not exist` en las tres.

**Verde**: las mismas, tras `schema.sql` (+4 líneas, CRLF), `recepcion.ts` (5 líneas), `db/remisiones.ts`, `routes/remision.ts` y `types.ts`. R42-e (pg-mem con `enviado_por_id = $4` en `null`) nace verde.

**Mutaciones** (copia previa en el directorio temporal de la sesión; restauradas con `cmp`)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M1 guarda del alta en `recepcion.ts:101` | `packages/shared/src/recepcion.test.ts` «6 · retirado…», PA-3 «sin ningún defecto pasa…», PI-7; `apps/desk/server/recepcion.test.ts` «rotulado que no es exactamente true (false, "true", 1) → 201…» | sí |
| M2 guarda del envío en `recepcion.ts:155` | PE-3, «motivoNoEnviable: formulario nuevo…», S3a, «rotulado_at anulado por SQL… → 200» (línea 370) y 21 más del envío | sí |
| M14a `ALTER` de `enviado_por_id` sin `public.` | PS-12; `migrate.test.ts:345` («las ALTER sin calificar son exactamente…»), `migrate.test.ts:332` («toda ALTER TABLE apunta a una tabla clasificada…») y el recuento («son 66 ALTER…») | sí |
| M14b `ALTER` de `aviso_sin_etiqueta_at` sin `public.` | las mismas cuatro | sí |
| M15 el alta vuelve a escribir `rotulado_at`/`rotulado_por` | PT-1b, «el cuerpo no decide…» (157-162) y «rotulado que no es exactamente true…» (86-94) | sí |
| M16a `reclamarEnvio` sin `enviado_por_id` | R42-a, R42-b | sí |
| M16b `liberarEnvio` sin limpiarlo | R42-d | sí |
(La primera versión de M15 insertaba la sentencia dentro de los argumentos de `db.query` y no ponía nada rojo: era una mutación mal puesta, no una prueba floja; se repuso detrás del `INSERT`.)

**Pruebas existentes cambiadas a propósito (en sitio, mismo número de línea)**: `packages/shared/src/recepcion.test.ts` 79-84, 99, 117, 120, 123, 126, 129, 131, 264, 272-273, 365, 374; `apps/desk/server/recepcion.test.ts` 65, 73, 86, 89-91, 93, 144, 157-162, 273, 370, 375, 463, 468-469, 570, 578; `apps/desk/src/lib/recepcionForm.test.ts` 66, 88; `packages/zoho-sync/src/db/migrate.test.ts` 374 (título), 376, 377, 794, 796, 798, 837, 839, 840, 877, 879, 880, 882 y **652** (no estaba en D7). El antes y el después están en `git diff 036a9e2`.

**Hipótesis resueltas**
- pg-mem acepta `enviado_por_id = $4` con `null` (R42-e) y con un id (R42-a).
- `novedadesSiembra.test.ts:97` sigue en seis: la expresión de `:94` no casa con los nombres nuevos (verde sin tocarlo).
- `migrate.test.ts:652` cuenta sentencias de `schema.sql` (`.toBe(ultima + 1 + … + 6)`; 173 → 175): el diseño no lo había visto. Se subió `+ 2` en sitio, con el texto del mensaje.
- `migrate.test.ts:385` (conjunto de identidades) no cambia, como decía D7.

**Códigos de salida**: `npm test` 0 (268 ficheros pasan | 3 omitidos; 4473 pruebas pasan | 11 omitidas); `npm run typecheck` 0; `npx eslint . --max-warnings 165` 0 (165 avisos, 0 errores).

**Regla de mutación 4**: `wc -l` igual que en la partida salvo `schema.sql` (828 → 832, al final): `recepcion.ts` 206, `routes/remision.ts` 397, `db/remisiones.ts` 240, `types.ts` 810, `migrate.test.ts` 911. Ninguna línea existente cambió de número. Citas que dejan de ser ciertas, sin editar: `openspec/specs/remisiones/spec.md:170` (cita el texto de `db/remisiones.ts:129-131`, el comentario viejo; lo sustituye el delta al archivar); `DEPLOY.md:254` (el `INSERT` de `createRemision` ya no nombra `rotulado_at` ni `rotulado_por`, `apps/desk/server/db/remisiones.ts:47`); `docs/sdd/ENTRADA.md:1828` (línea 101 pedía confirmar antes de crear; E-167); `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:210` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:255` (ídem, caso B); rangos `recepcion.ts:97-101` y `:151-162` en `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:585` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:863` (caso B); en `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/` las citas a `recepcion.ts:101` (`verify-report.md:148`) y a `db/remisiones.ts:47-50` y `routes/remision.ts:250` (`design.md:193`, `design.md:244`, `design.md:246`, `verify-report.md:89`, `verify-report.md:101`, `verify-report.md:136`, `verify-report.md:158`): caso B, archivo. Las demás citas a esas líneas siguen ciertas (el `INSERT` conserva `'entrada'` y `'pendiente'` en la 48; la 250 conserva `hayNovedad`).

**Medida**: `git diff --shortstat --no-renames 036a9e2`: 10 ficheros, 97 inserciones, 76 borrados = 173; más `apps/desk/server/rotulado.test.ts` nuevo, 84 líneas; más este fichero. Con `tasks.md` (16+16) el diff queda en 11 ficheros, 113 inserciones y 92 borrados = 205; más 84 y 43 = **332** en total, muy bajo la válvula de 720.

**Desvíos del diseño**: (1) `migrate.test.ts:652` (arriba). (2) R42-e, prueba extra. (3) Nada más: `recepcion.ts` quedó en 206 líneas y el alta no reordena guardas (IV-12 intacto).

## Lote 1b — la acción de confirmar y `pendienteRotular`

Partida `38ffbeb`. Hechas 1b.1 a 1b.9 salvo lo que cierra el orquestador (commit, detector de citas). Sin tocar `apps/desk/src`, `openspec/specs/`, `CLAUDE.md`, `config.yaml` ni `ENTRADA.md`. Nombres finales: ruta `POST /api/remisiones/:id/rotulado`; campo `pendienteRotular` (obligatorio); `pendienteDeRotular` y `puedeConfirmarRotulado` en `packages/shared/src/rotulado.ts` (`etiquetaNoGenerada` queda para el lote 2); `confirmarRotulado` en `apps/desk/server/db/remisiones.ts:247`.

**Rojo literal (antes del producto)**
- `packages/shared/src/rotulado.test.ts` (R41-a, PR-1): `Failed to load url ./rotulado … Does the file exist?` (módulo inexistente).
- `apps/desk/server/rotulado.test.ts` (`npx vitest run` sobre el fichero): 19 failed | 5 passed. `expected 404 to be 200` (R40-a, R40-c), `expected 404 to be 403` (R40-b, R40-d3), `expected 404 to be 401` (R40-d1), `expected 'Ruta de API no encontrada' to be 'Remisión no encontrada'` (R40-d2), `expected 404 to be 409` (R40-d4); R41-b y las ocho R41-c por `pendienteRotular` indefinido. **R40-e nace verde** (el callback ya avanza el ticket sin mirar el rotulado: es una prueba de no-regresión, no de producto) y R42-* siguen verdes.

**Verde**: 11 pruebas de `packages/shared/src/rotulado.test.ts`; 24 de `apps/desk/server/rotulado.test.ts` (4 del 1a + 20 nuevas: R40-a/b/c, R40-d1…d6, R40-e, R40-f, R41-b y ocho R41-c, una por fila de la tabla).

**Tabla de guardas tal como quedó** (`apps/desk/server/routes/remision.ts`; el handler ocupa `apps/desk/server/routes/remision.ts:398-419`, la llave de cierre pasa a `:420`)
| Orden | Línea | Guarda | Código | Texto |
|---|---|---|---|---|
| 0 | `:406` | `requireAuth(db)` | 401 | los de `auth/middleware.ts` |
| 1 | `:409` | remisión inexistente | 404 | Remisión no encontrada |
| 2 | `:410` | `!puedeConfirmarRotulado(req.user!)` | 403 | Confirmar el rotulado requiere el área Servicio Técnico |
| 3 | `:411` | `rem.anuladaAt` | 409 | Esta remisión fue anulada: no admite confirmar el rotulado |
| 4 | `:412` | `!rem.novedades` | 422 | Esta remisión es anterior al registro de recepción y no lleva confirmación de rotulado |
| 5 | `:413` | estado ∉ {`ok`, `ok_con_avisos`} | 422 | El rotulado se confirma después de enviar: esta remisión todavía no se envió con éxito |
| 6 | `:415` y `:417` | `rem.rotuladoAt`, o el `UPDATE` sin fila | 409 | El rotulado de esta remisión ya estaba confirmado |

**Mutaciones** (copia previa en el directorio temporal de la sesión; restauradas con `cmp`)
| Mutación | Prueba roja | Restaurada |
|---|---|---|
| M3 quitar `requireAuth` (`:406`) | R40-d1 (y R40-a, b, c, d3 a d6, f, R41-b, dos R41-c: `req.user` indefinido) | sí |
| M4 intercambiar (1,2): `:409`↔`:410` | R40-d2 (única) | sí |
| M5 intercambiar (2,3): `:410`↔`:411` | R40-d3 (única) | sí |
| M6 intercambiar (3,4): `:411`↔`:412` | R40-d4 (única) | sí |
| M7 intercambiar (4,5): `:412`↔`:413` | R40-d5 (única) | sí |
| M8 intercambiar (5,6): estado↔`rotuladoAt` (`const ya` subido para no caer en zona muerta temporal) | R40-d6 (única) | sí |
| M9a quitar `AND rotulado_at IS NULL` del `UPDATE` y las dos guardas 6 | R40-c, y R41-c con `rotulado_at` (×2) | sí |
| M9b sólo el `AND` del `UPDATE` (conserva las guardas) | R40-c (única): la rama de las dos simultáneas pasa las dos la lectura previa y sólo el `UPDATE` condicional las separa | sí |
| M10a `pendienteDeRotular` sin `anuladaAt` | R41-a «`ok` anulada → falso» y R41-c «`ok` anulada» | sí |
| M10b sin `novedades` | R41-a «`ok` de legado → falso» y R41-c «`ok` de legado» | sí |
| M10c sin estado | R41-a «`pendiente` o `error` → falso» y R41-c «`error`», «`pendiente`» | sí |
Cada intercambio de vecinas pone roja exactamente su R40-dN: las pruebas de posición valen.

**Hipótesis resueltas**
- pg-mem acepta `UPDATE … WHERE id = $1 AND rotulado_at IS NULL RETURNING *` con `now()` y el parámetro de persona; `toRemision` lee la fila devuelta.
- Dos confirmaciones simultáneas: `Promise.all` sobre la ruta basta; sale exactamente `[200, 409]`. M9b demuestra que pg-mem las entrelaza lo bastante para que la prueba muerda.
- `pendienteRotular` obligatorio rompió **0** literales de `Remision` en `npm run typecheck`: se queda obligatorio.
- `userCookie` fija el correo `op@x.co`: sólo un usuario de esa familia por prueba (por eso R40-b y R40-d3 usan uno y el administrador).

**Códigos de salida**: `npm test` 0 (269 ficheros pasan | 3 omitidos; 4504 pruebas pasan | 11 omitidas); `npm run typecheck` 0; `npx eslint . --max-warnings 165` 0 (165 avisos, 0 errores).

**Regla de mutación 4**: `wc -l` partida→ahora: `routes/remision.ts` 397→420 (handler en `apps/desk/server/routes/remision.ts:398-419`, llave en `:420`; imports EN SITIO en `:4` y `:9`), `db/remisiones.ts` 240→253 (EN SITIO `:4`, `:12`, `:26`; función AL FINAL `:242-253`), `types.ts` 810→810 (EN SITIO `:735`), `index.ts` 42→43 (AL FINAL), `recepcion.ts` 206→206. `git diff -U0 38ffbeb` no muestra ningún otro hunk: ninguna línea existente cambió de número. Citas a `toRemision` (`:12`, `:26`) y a `types.ts:735` (archivo: `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/design.md:169`, `openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/design.md:30`, `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/design.md:41`): siguen ciertas, la línea conserva su contenido y gana un campo. Ninguna cita a la llave de cierre de `routes/remision.ts` (`:397` antes). Segundo pase de abreviadas `:396-399` en los ficheros que citan `routes/remision.ts`: ninguna se refiere a ese fichero. Citas que dejan de ser ciertas: ninguna.

**Medida**: `git diff --shortstat --no-renames 38ffbeb` sobre lo trackeado, 239 (más este fichero); nuevos sin trackear: `packages/shared/src/rotulado.ts` 22 y `packages/shared/src/rotulado.test.ts` 34. Suma en los datos del informe, muy bajo la válvula de 720.

**Desvíos del diseño**: (1) R40-e nace verde (no hay producto que lo haga rojo). (2) M8 necesitó mover `const ya` para no medir una zona muerta temporal, no una posición. (3) Nada más: `rotulado: true` sigue en el `nueva()` del 1a (se ignora) y no se quitó.
