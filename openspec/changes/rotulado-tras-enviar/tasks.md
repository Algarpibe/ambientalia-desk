# Tareas: el rotulado se confirma después de enviar, con traza y sin bloquear, y se avisa si la etiqueta no se generó

Cambio `rotulado-tras-enviar` (F1B-04, `cierra: no`). CUATRO lotes de apply (1a, 1b, 2, 3), cada uno un intento propio con su medida y su cierre, en una rama y una fusión. Orden de `strict_tdd` dentro de cada lote: rojo anotado, verde, mutaciones, cierre. Los identificadores (R40-a…f, R40-d1…d6, R41-a/b/c, R42-a/b/c/d, AV22-a…m, AV22-t, PS-12, PR-1, RV-1…4), los nombres y las mutaciones M1…M18 son los de `openspec/changes/rotulado-tras-enviar/design.md` (D1…D13); no se reabren. Todo fichero citado se edita EN SITIO o AL FINAL; las pruebas existentes de D10 se cambian EN SITIO y a propósito, diciéndolo en la propia prueba, y lo nuevo va AL FINAL de cada fichero. Cada casilla se marca sólo con su resultado anotado en `apply-progress.md`; las mutaciones anotan el nombre de la prueba que se puso roja.

> **Nota previa, sin casilla (la hace el orquestador ANTES del apply, no un lote):** ajustar los deltas de `specs/`: añadir R42-d y R41-c; quitar «hipótesis» de la ruta `POST /api/remisiones/:id/rotulado` y del nombre `pendienteRotular` en RQ-RE-40 y RQ-RE-41; añadir la variante «sin serial» y los espacios al texto de RQ-AV-22.

## Review Workload Forecast

Líneas estimadas (inserciones + borrados, D12) y ×1,8: lote 1a ~297 → **535**; lote 1b ~333 → **599**; lote 2 ~377 → **679**; lote 3 ~230 → **414**. Total ~1.237 → ~2.227 repartidas en cuatro intentos.
Chained PRs recommended: No. Cuatro intentos en una rama, una fusión (regla del ciclo 3).
Riesgo frente a 800: bajo en 1a, 1b y 3; **medio en el lote 2** (679, justo bajo la válvula de 720). Si la medida intermedia del lote 2 pasa de 600 antes de AV22-g a AV22-k, esos cinco pasan a un lote 2b.
Decision needed before apply: No.

## Lote 1a — retirada de las dos guardas, G2, S12, esquema, `enviado_por_id`

- [x] 1a.1 ROJO · `packages/shared/src/recepcion.test.ts`, EN SITIO: líneas 79-85 («6 · retirado»: `rotulado` ausente, `false`, `'true'`, `1` dan `ok`), 99 (`MSG6` se sustituye por comentario), títulos de 117, 120, 123 y 126, 129-131, 264, 272-273 (PE-3), 365 y 374 (PI-7). Rojo esperado: las de 79-85, 129-131, 264, 272-273 y 374 fallan porque `validarRecepcion` y `motivoNoEnviable` aún devuelven el error del rotulado. Anotar el fallo literal.
- [x] 1a.2 ROJO · `apps/desk/server/recepcion.test.ts`, EN SITIO: 65 y 73 (el caso «sin rotulado» pasa a «un elemento que no es texto»), 86-94, 144 y 157-162, título de 273, 370 y 375, 463 y 466-469 (S3a), 570 y 578 (PT-1b: `rotuladoAt` y `rotuladoPor` en `null`). Rojo esperado: `422` donde se espera `201`/`200`, y `rotulado_at` no nulo donde se espera `NULL`.
- [x] 1a.3 ROJO · `apps/desk/src/lib/recepcionForm.test.ts`, EN SITIO, sólo las líneas 66 y 88 (el motivo que precede es el de la lista vacía); el resto de ese fichero (65, 111, 115, 119, 124, 127, 129) va en el lote 3 con `recepcionForm.ts`.
- [x] 1a.4 ROJO · `packages/zoho-sync/src/db/migrate.test.ts`, EN SITIO (D7): índices 796 `16→18`; 798 `15→17` y `14→16`; 839 `13→15`; 840 `12→14`; 879 y 882 `11→13`; 880 `10→12`; ordinales de los títulos de 794 y de las otras dos pruebas; recuento 374, 376 y 377 de 64→**66**, calificadas 38→**40**. Rojo esperado: el recuento y los índices fallan mientras `schema.sql` no tenga las dos sentencias.
- [x] 1a.5 ROJO · `packages/zoho-sync/src/db/novedadesSiembra.test.ts`, AL FINAL: PS-12 (R42-c), por comportamiento (las dos columnas existen y nacen `NULL`) y por el fichero (exactamente dos sentencias `^ALTER TABLE public\.remisiones ADD COLUMN IF NOT EXISTS (enviado_por_id text|aviso_sin_etiqueta_at timestamptz)$`). Rojo esperado: columnas inexistentes.
- [x] 1a.6 ROJO · `apps/desk/server/rotulado.test.ts` (NUEVO): R42-a (envío ganador guarda y reenvío sobrescribe), R42-b (quien pierde y el `422` de contenido no escriben), R42-d (`liberarEnvio` limpia `enviado_por_id` si el disparo no sale). Rojo esperado: columna `enviado_por_id` inexistente / valor `null`.
- [x] 1a.7 VERDE · `packages/zoho-sync/src/db/schema.sql`, AL FINAL (tras la línea 828): el comentario de dos líneas y las dos `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` de D7. Verdes 1a.4, 1a.5 y la parte de esquema de 1a.6.
- [x] 1a.8 VERDE · `packages/shared/src/recepcion.ts`, cinco líneas EN SITIO (65, 72, 101, 148, 155) con los textos de D1; el paso (7) y las letras (b) y (c) conservan su número. `RemisionRecepcion` y `CuerpoRecepcion` no cambian. Verdes 1a.1 y 1a.3.
- [x] 1a.9 VERDE · `apps/desk/server/db/remisiones.ts` EN SITIO: 40, 45, 47-48 (`$1…$19`) y 50 (D2); 170, 174 y 179 (cuarto parámetro `enviadoPorId`) y 186 (`liberarEnvio` limpia) (D5); comentario de 129-130 (S12, D8). `apps/desk/server/routes/remision.ts` EN SITIO: 250 (`por:`), 288 (comentario) y 297 (`reclamarEnvio(db, id, undefined, req.user!.id)`). `packages/shared/src/types.ts:699-701` EN SITIO (D8). Verdes 1a.2 y 1a.6.
- [x] 1a.10 MUTACIÓN M1 (reponer la guarda del alta en la línea 101 de `packages/shared/src/recepcion.ts`): rojas esperadas `packages/shared/src/recepcion.test.ts:79-85` y `apps/desk/server/recepcion.test.ts:86-94`. Copia previa fuera del repositorio; restaurar y comprobar con `git diff`.
- [x] 1a.11 MUTACIÓN M2 (reponer la guarda del envío en la línea 155): rojas esperadas PE-3, S3a y `apps/desk/server/recepcion.test.ts:370`.
- [x] 1a.12 MUTACIÓN M14 (regla 2, sobre el FICHERO VIGILADO): quitar `public.` a una de las dos `ALTER` de `schema.sql`; rojas esperadas PS-12, `packages/zoho-sync/src/db/migrate.test.ts:332`, `packages/zoho-sync/src/db/migrate.test.ts:345` y el recuento. Repetir con la otra sentencia.
- [x] 1a.13 MUTACIÓN M15 (el alta vuelve a escribir `rotulado_at` con `rotulado: true`): rojas esperadas `apps/desk/server/recepcion.test.ts:157-162` y PT-1b. MUTACIÓN M16 (`reclamarEnvio` sin `enviado_por_id`; `liberarEnvio` sin limpiarlo): rojas esperadas R42-a y R42-d.
- [x] 1a.14 CIERRE · `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165` (165 avisos hoy; no puede subir), MIRANDO cada código de salida y anotándolo. El detector de citas lo corre el orquestador tras su commit, no es casilla de agente.
- [x] 1a.15 CIERRE · Regla de mutación 4: barrido `grep -rnoE "(recepcion|remision|remisiones|types|schema|migrate\.test)(\.test)?\.(ts|sql):[0-9]+(-[0-9]+)?"` sin excluir `openspec/changes/archive`, cada resultado leído contra `packages/shared/src/recepcion.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/server/db/remisiones.ts`, `packages/shared/src/types.ts`, `packages/zoho-sync/src/db/schema.sql` y `packages/zoho-sync/src/db/migrate.test.ts`; confirmar con `wc -l` y `git diff` que ninguna línea existente cambió de número (`recepcion.ts` sigue en 206 líneas). Segundo pase de abreviadas (`:NNN`) en los ficheros que citan esos módulos.
- [x] 1a.16 CIERRE · Medida: `git diff --shortstat --no-renames <commit de partida del lote 1a>` más `wc -l` de lo nuevo sin trackear (techo 800, válvula 720; binarios aparte). Escribir el trozo 1a de `apply-progress.md`: rojos literales, verdes, M1, M2, M14, M15, M16, hipótesis resueltas (pg-mem con `enviado_por_id = $4` en `null`; recuento de `novedadesSiembra.test.ts:97`).

## Lote 1b — la acción de confirmar y `pendienteRotular`

- [ ] 1b.1 ROJO · `packages/shared/src/rotulado.test.ts` (NUEVO): R41-a (las siete filas de la tabla) y PR-1 (`puedeConfirmarRotulado` por área y administrador). Rojo esperado: módulo inexistente.
- [ ] 1b.2 ROJO · `apps/desk/server/rotulado.test.ts`, AL FINAL: R40-a, R40-b, R40-c (repetida y dos simultáneas con `Promise.all`), R40-d1…d6 (una por par vecino, con las dos guardas activas, afirmando código y texto de D3), R40-e, R40-f, R41-b y R41-c (por cada fila de RQ-RE-41, `pendienteRotular` verdadero si y sólo si la acción responde `200` a un usuario autorizado). Rojo esperado: `404` de ruta inexistente y `pendienteRotular` indefinido.
- [ ] 1b.3 VERDE · `packages/shared/src/rotulado.ts` (NUEVO) con `pendienteDeRotular` y `puedeConfirmarRotulado`; `packages/shared/src/index.ts`, una línea AL FINAL; `packages/shared/src/types.ts:735` gana `; pendienteRotular: boolean`; `apps/desk/server/db/remisiones.ts:12` y `:26` EN SITIO (D4). Verdes 1b.1, R41-b y R41-c. Anotar cuántos literales de `Remision` rompe `npm run typecheck`; si son más de cinco, el campo pasa a opcional y se anota.
- [ ] 1b.4 VERDE · `confirmarRotulado` AL FINAL de `apps/desk/server/db/remisiones.ts` (`UPDATE … WHERE id = $1 AND rotulado_at IS NULL RETURNING *`); handler AL FINAL de `registerRemisionRoutes`, tras la línea 396 de `apps/desk/server/routes/remision.ts`, con las siete guardas de D3 y sus textos; imports EN SITIO en las líneas 4 y 9. Verdes R40-a…f.
- [ ] 1b.5 MUTACIÓN M3 (quitar `requireAuth`): roja R40-d1. M4 a M8 (intercambiar guardas (1,2), (2,3), (3,4), (4,5), (5,6)): rojas R40-d2, R40-d3, R40-d4, R40-d5, R40-d6, una por una.
- [ ] 1b.6 MUTACIÓN M9 (quitar `AND rotulado_at IS NULL` del `UPDATE` y la guarda 6): roja R40-c. M10 (`pendienteDeRotular` sin mirar `anuladaAt`; sin mirar `novedades`; sin mirar el estado, las tres por separado): rojas R41-a y R41-c.
- [ ] 1b.7 CIERRE · `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`, mirando cada código de salida. El detector de citas lo corre el orquestador tras su commit.
- [ ] 1b.8 CIERRE · Regla de mutación 4 sobre `apps/desk/server/routes/remision.ts`, `apps/desk/server/db/remisiones.ts`, `packages/shared/src/types.ts` y `packages/shared/src/index.ts` (mismo `grep`, sin excluir el archivo), con `wc -l` y `git diff` confirmando que sólo cambió la llave de cierre de `registerRemisionRoutes` y los EN SITIO previstos.
- [ ] 1b.9 CIERRE · Medida contra el commit de partida del lote 1b (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear) y trozo 1b de `apply-progress.md`: M3 a M10, hipótesis resueltas (`RETURNING *`, `Promise.all` en pg-mem).

## Lote 2 — aviso de etiqueta no generada

- [ ] 2.1 BARRIDO OBLIGATORIO antes de escribir nada: en `apps/desk/server/remisiones.test.ts` listar una a una las once llamadas al callback que mandan `ok` sin `resultado` (por ejemplo `apps/desk/server/remisiones.test.ts:383-384` y `apps/desk/server/remisiones.test.ts:408`) y marcar cuáles cuentan filas de `avisos`; las que cuenten se cambian EN SITIO y a propósito (con G1 ya crean avisos). Anotar la lista en `apply-progress.md`.
- [ ] 2.2 ROJO · `packages/shared/src/rotulado.test.ts`, AL FINAL: AV22-a a AV22-d sobre `etiquetaNoGenerada` (formas de vacío, `dymoId` presente, `error`, independencia del texto del paso). Rojo esperado: `etiquetaNoGenerada is not a function`.
- [ ] 2.3 ROJO · `apps/desk/server/services/avisoEtiquetaNoGenerada.test.ts` (NUEVO, por la ruta del callback): AV22-a a AV22-f, y medir; si pasa de 600, AV22-g a AV22-k pasan a un lote 2b. AV22-g a AV22-m y AV22-t (cuatro variantes del texto: con ticket, sin ticket, sin serial, con `avisos`). AV22-k desactiva al administrador (`destinatariosDeArea` lo incluye, `apps/desk/server/db/avisos.ts:89`). Rojo esperado: ningún aviso creado.
- [ ] 2.4 VERDE · `etiquetaNoGenerada` AL FINAL de `packages/shared/src/rotulado.ts`; `apps/desk/server/services/avisoEtiquetaNoGenerada.ts` (NUEVO) con `avisarEtiquetaNoGenerada` y `textoAvisoSinEtiqueta` (D6); llamada EN SITIO en la línea 374 de `apps/desk/server/routes/remision.ts`, DESPUÉS de `sincronizarEstadoPorRemision`, e import en la línea 16. Verdes 2.2 y 2.3 y las existentes cambiadas en 2.1.
- [ ] 2.5 MUTACIÓN M11 (`etiquetaNoGenerada` acepta `error`; decide por el texto de `avisos[].paso`): rojas AV22-c y AV22-d. M12 (quitar `AND aviso_sin_etiqueta_at IS NULL`): rojas AV22-e y AV22-f.
- [ ] 2.6 MUTACIÓN M13 (quitar el `try`/`catch` del servicio): roja AV22-l. M17 (marcar antes de mirar destinatarios): roja AV22-k.
- [ ] 2.7 CIERRE · `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`, mirando cada código de salida. El detector de citas lo corre el orquestador tras su commit.
- [ ] 2.8 CIERRE · Regla de mutación 4 sobre `apps/desk/server/routes/remision.ts` (sin excluir el archivo; sólo cambian la línea 374 y el import de la 16, EN SITIO, confirmado con `wc -l` y `git diff`), medida contra el commit de partida del lote 2 y trozo 2 de `apply-progress.md` (incluida la lista de 2.1).

## Lote 3 — cliente

- [ ] 3.1 ROJO · `apps/desk/src/lib/recepcionForm.test.ts`, EN SITIO: 65, 111, 115, 119, 124, 127 y 129 (D10). `apps/desk/src/lib/rotuladoVista.test.ts` (NUEVO): RV-1 (nada: legado, sin enviar, anulada), RV-2 (pendiente con y sin permiso), RV-3 (confirmado con persona y hora), RV-4 (no recalcula). Rojo esperado: argumentos sobrantes y módulo inexistente.
- [ ] 3.2 VERDE · `apps/desk/src/lib/recepcionForm.ts` EN SITIO (65, 82, 90, 94); `apps/desk/src/lib/rotuladoVista.ts` (NUEVO); `confirmarRotulado` en `apps/desk/src/api/client.ts` (y fuera `rotulado?` en 534-535); componente `apps/desk/src/components/ConfirmarRotulado.tsx` (NUEVO).
- [ ] 3.3 VERDE · Los `.tsx`, EN SITIO, sin desplazar: `apps/desk/src/components/CrearRemision.tsx` (60, 116 y 295-300 sustituido por seis líneas), `apps/desk/src/components/ResultadoRemision.tsx` (línea 170, import en la 4, y el texto de la 152 de D8), `apps/desk/src/components/PanelRemisiones.tsx` (71, 12, 130 y import en la 5). Los `.tsx` no admiten rojo previo (F0-00).
- [ ] 3.4 MUTACIÓN M18 (regla 3: `vistaRotulado` recalcula en vez de leer el campo): roja RV-4.
- [ ] 3.5 CIERRE · Regla invariable 13 / regla de mutación 3 POR ESCRITO en `apply-progress.md`: la tabla «decisión del cliente → línea del servidor que la impone» de D9 (siete filas), con la línea REAL de cada guarda nacida en los lotes 1b y 2 (la de la guarda 2 era hipótesis). Y `git diff --stat` de `apps/desk/src` mostrando que sólo se tocó lo previsto.
- [ ] 3.6 CIERRE · `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`, mirando cada código de salida; barrido de la regla de mutación 4 sobre `apps/desk/src/api/client.ts`, `apps/desk/src/lib/recepcionForm.ts` y los tres `.tsx` (sin excluir el archivo); medida contra el commit de partida del lote 3 y trozo 3 de `apply-progress.md`. El detector de citas lo corre el orquestador tras su commit.

## Trazabilidad escenario → tarea y prueba

| Escenario | Tarea | Prueba |
|---|---|---|
| RQ-RE-40 · R40-a, R40-b, R40-c | 1b.2, 1b.4, 1b.6 | las del mismo nombre en `apps/desk/server/rotulado.test.ts` |
| RQ-RE-40 · R40-d1 a R40-d6 | 1b.2, 1b.5 | R40-d1…d6 (M3 a M8) |
| RQ-RE-40 · R40-e, R40-f | 1b.2 | R40-e, R40-f |
| RQ-RE-41 · R41-a, R41-b | 1b.1, 1b.2 | R41-a (`packages/shared/src/rotulado.test.ts`), R41-b |
| RQ-RE-41 · MANUAL (técnico antes y después) | — | de persona |
| RQ-RE-42 · R42-a, R42-b | 1a.6 | R42-a, R42-b |
| RQ-RE-42 · R42-c | 1a.5, 1a.12 | PS-12, `packages/zoho-sync/src/db/migrate.test.ts:332` y `:345` |
| RQ-AV-22 · AV22-a a AV22-d | 2.2, 2.3, 2.5 | AV22-a…d (shared y servicio) |
| RQ-AV-22 · AV22-e, AV22-f | 2.3, 2.5 | AV22-e, AV22-f |
| RQ-AV-22 · AV22-g a AV22-k | 2.3, 2.6 | AV22-g…k |
| RQ-AV-22 · AV22-l, AV22-m, texto | 2.3, 2.6 | AV22-l, AV22-m, AV22-t |
| RQ-AV-22 · MANUAL (etiqueta en Drive) | — | de persona |
| RQ-RE-05 · definición de `ok_con_avisos` | 1a.9 | **sin prueba**: comentario; lectura contra `packages/shared/src/types.ts:699-701` |
| RQ-RE-08 · puerta de contenido (cambio: orden 4) | 1a.2, 1a.11 | `apps/desk/server/recepcion.test.ts:370` y 375; los escenarios restantes no cambian |
| RQ-RE-19 · Persona-1 a Persona-5 | 3.3 | de persona (`.tsx` fuera de la red) |
| RQ-RE-23 · «El rotulado del cuerpo se ignora» | 1a.1, 1a.2 | `apps/desk/server/recepcion.test.ts:86-94`, `packages/shared/src/recepcion.test.ts:79-85` |
| RQ-RE-24 · tres escenarios | 1a.2, 1a.13 | `apps/desk/server/recepcion.test.ts:86-94`, 144, 157-162 y PT-1b |
| RQ-RE-26 · «Sin rotulado, se envía» y orden interno | 1a.1, 1a.2, 1a.11 | PE-3, S3a, `apps/desk/server/recepcion.test.ts:370` |
| RQ-RE-38 · «Cada casilla se guarda con su traza» (G2) | 1a.2 | PT-1b (`apps/desk/server/recepcion.test.ts:570` y 578) |

## Tareas de personas — FUERA DEL RECUENTO

Archivar este cambio **no las da por hechas** (regla del ciclo 1). Ninguna describe trabajo que una tanda pueda hacer en este repositorio: n8n y producción los toca una persona, lo demás es decisión o versionado de supervisión.

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Contrastar los datos de n8n con una ejecución real: qué llega en `dymoId` cuando la etiqueta sale y cuando no | Quien administra n8n | `openspec/changes/rotulado-tras-enviar/proposal.md`, «Medición previa» |
| Verificar en la aplicación, tras desplegar, los puntos de D13 (columnas, ninguna anterior pendiente, crear-enviar-confirmar una vez, ticket avanza sin confirmar, primer envío real sin aviso) | Servicio Técnico | Informe de archivo |
| Pegar la corrección del maestro | Gerencia | `openspec/changes/rotulado-tras-enviar/correccion-maestro.md` |
| Decidir si el recuento de modelos sin accesorios retiene la fila F1B-04, y hacerlo | Gerencia · Servicio Técnico, contra producción | `docs/sdd/TRASPASO_2026-10-08.md` |
| Marcar E-167 como cerrada y actualizar E-163 a E-166 | Sesión de supervisión | `docs/sdd/ENTRADA.md` |
| Corregir, si procede, S1 a S12 antes del 2026-10-19 | Gerencia | Lista semanal de supuestos (E-237) |
