# apply-progress — respaldo-semanal-drive (F1F-02, `cierra: no`) · intento 1 · (a)

Strict TDD. Ejecutor: `sdd-apply`, worktree `respaldo-semanal-drive`, base `522da9f`. No se tocó ningún fichero existente.

## Tareas

- [x] 1.1 `configDrive.ts` · [x] 1.2 `tocaHoy` · [x] 2.1 `driveAuth.ts` · [x] 2.2 `driveApi.ts` listado · [x] 2.3 descarga/exportación
- [x] 3.1 `incremental.ts` · [x] 3.2 `marcarDesaparecidos` · [x] 4.1 cuatro códigos · [x] 4.2 medida
- (b) lotes 5-10 NO empezados.

## Rojos literales (vitest, antes de escribir el código)

- 1.1/1.2 `configDrive.test.ts` (un solo fichero de prueba, mismo rojo para las dos tareas):
  `Caused by: Error: Failed to load url ./configDrive (resolved id: ./configDrive) … Does the file exist?` · `Test Files  1 failed (1)` · `Tests  no tests`
- 2.1 `driveAuth.test.ts`: `Error: Cannot find module './driveAuth' imported from '…/driveAuth.test.ts'` · `Test Files  1 failed (1)` · `Tests  no tests`
- 2.2/2.3 `driveApi.test.ts`: `Error: Cannot find module './driveApi' imported from '…/driveApi.test.ts'` · `Test Files  1 failed (1)` · `Tests  no tests`
- 3.1/3.2 `incremental.test.ts`: `Error: Cannot find module './incremental' imported from '…/incremental.test.ts'` · `Test Files  1 failed (1)` · `Tests  no tests`

Rojos de aserción (tras el código): `driveApi.test.ts` falló una vez con `→ expected [ …(2) ] to have a length of 1 but got 2`
(error de la prueba: el doble pagina cada carpeta en dos; se corrigió la expectativa a 2, el código no cambió).

## Verdes

`configDrive` 6 · `driveAuth` 5 · `driveApi` 9 · `incremental` 11 = **31 pruebas**, todas en verde.

## Mutación (regla de mutación 1/2 aplicada a lo vigilado)

Se quitó `if (!listadoCompleto) return indice` de `marcarDesaparecidos`: `× marcarDesaparecidos > con listado INCOMPLETO no marca a nadie`
(`Tests  1 failed | 10 passed (11)`). Restaurado: `Tests  11 passed (11)`.

## Cierre (4.1) — cuatro códigos de salida

| Comando | Código | Resultado |
|---|---|---|
| `npm test` | **0** | `Test Files 228 passed | 2 skipped (230)`, `Tests 3471 passed | 7 skipped (3478)` (1.ª pasada: 1 rojo, ver abajo) |
| `npm run typecheck` | **0** | sin errores |
| `npx eslint .` | **0** | `165 problems (0 errors, 165 warnings)`; los míos: 0 |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null` | **0** | corre sobre HEAD, que aún no incluye estos ficheros: el detector definitivo lo corre el orquestador tras commitear |

## Medida (4.2)

`git diff --shortstat --no-renames 522da9f`: 2 files changed, 12 insertions(+), 10 deletions(-) (`superficieSaliente.test.ts` 3/1; `tasks.md` 9 casillas marcadas). Sin trackear (`wc -l`): configDrive 58+60, driveAuth 40+73, driveApi 87+126, incremental 44+88, apply-progress 60 = **636**. **Total ≈ 658** (techo 680, válvula 720). Sin binarios.

## Ficheros (todos nuevos, bajo `apps/desk/server/respaldo/`)

`configDrive.ts` · `configDrive.test.ts` · `driveAuth.ts` · `driveAuth.test.ts` · `driveApi.ts` · `driveApi.test.ts` · `incremental.ts` ·
`incremental.test.ts` · y este `apply-progress.md`.

## Decisiones menores (supuestos reversibles)

- `huella` vive en `incremental.ts` y `driveApi.ts` la importa (una sola definición); `ArchivoDrive` vive en `driveApi.ts`.
- Los nativos exportados llevan la extensión en `nombre` y `ruta` (`Acta.docx`), para que la restauración sepa qué abre.
- `faltantesDrive(d, base)` recibe también la `ConfigRespaldo`; nombra la credencial mala sin volcar su valor.
- Ningún módulo importa `fs`/`os`; el guardián estático llega en (b).

## Hallazgo: fichero existente tocado (imprescindible)

`npm test` dio 1 rojo a la primera: `apps/desk/server/superficieSaliente.test.ts` (`las llamadas no-GET que salen de la casa son exactamente estas ocho`),
`AssertionError: salientes encontradas: … apps/desk/server/respaldo/driveAuth.ts:29 POST → TOKEN_URL … expected [ …(9) ] to deeply equal [ …(8) ]`.
La invariante exige que cada saliente no-GET se añada a propósito con etiqueta. Se añadió la de `driveAuth.ts · POST` (+2 líneas tras `:58`, `ocho`→`nueve` en el título; 0 citas `superficieSaliente.test.ts:N` en el repo, regla de mutación 4 sin efecto). (b) añadirá aquí las de `multiparte.ts` (POST/PUT/DELETE).

---

# Intento 2 · (b1) — lotes 5 y 6 (retención, `descifrarBuffer`, multiparte, índice)

Strict TDD. Base `288ae0d`. Lotes 7-10 (orquestador, `sinDisco.test.ts`, `index.ts`, `DEPLOY.md`, `drive_url`) NO empezados: van en un intento posterior.
Tareas marcadas en `tasks.md`: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3.

## Rojos literales (vitest, antes del código)

- 5.1/5.2 `retencion.test.ts`: `Caused by: Error: Failed to load url ./retencion (resolved id: ./retencion) … Does the file exist?` · `Test Files  1 failed (1)` · `Tests  no tests`
- 5.3 `cifrado.test.ts`: `TypeError: (0 , descifrarBuffer) is not a function` (×2) · `Test Files  1 failed (1)` · `Tests  2 failed | 6 passed (8)`
- 6.1/6.2 `multiparte.test.ts`: `Error: Cannot find module './multiparte' imported from '…/multiparte.test.ts'` · `Test Files  1 failed (1)` · `Tests  no tests`
- 6.3 `indiceDrive.test.ts`: `Error: Cannot find module './indiceDrive' imported from '…/indiceDrive.test.ts'` · `Test Files  1 failed (1)` · `Tests  no tests`
- Guardián de superficie (`superficieSaliente.test.ts`), tras `multiparte.ts`: `AssertionError: salientes encontradas: … multiparte.ts:33 POST → url.toString() … :38 PUT … :42 DELETE` (1 rojo). Se etiquetaron las tres y el título pasó de «nueve» a «doce».
- Rojo de aserción propio: la 1.ª versión de `retencion.test.ts` tenía un dato mal puesto (una versión superada en 2024 dentro de un documento «desaparecido hace menos de 12 meses» sí es candidata por superada): `1 failed | 6 passed (7)`; se corrigió el dato de la prueba, no el código.
- Tras el cableado, `npm test` dio 1 rojo: la lista de etiquetas se compara con los hallazgos en orden de línea y las claves van ordenadas por nombre (`DELETE, POST, PUT`); se reordenaron las tres funciones de `multiparte.ts` en ese orden.

## Verdes

`retencion` 7 · `cifrado` 8 (6 + 2 nuevas) · `multiparte` 9 · `indiceDrive` 3 = **21 pruebas nuevas** (19 en ficheros nuevos + 2 en `cifrado.test.ts`).

## Mutaciones (regla de mutación 1/2)

1. **Propiedad «nunca la última de un vivo»**: en `aRetirar` se quitó la guarda `!ultimaDeVivo &&` (la versión final quedaba candidata si el índice traía `superadaEn` en ella). Rojo: `× aRetirar > PROPIEDAD: la última versión de un documento vivo nunca es candidata…` · `Tests  1 failed | 6 passed (7)`. Se pone en rojo porque la prueba genera 300 índices con semilla fija e INCLUYE `superadaEn` en la última versión a propósito (dato absurdo que por construcción no existe): sin esa guarda explícita, sólo la construcción protegería a la última. Restaurado: `7 passed`.
2. **Ignorar `desaparecidoEn`**: `if (desaparecido) return` → `if (false) return`. Rojo: `× aRetirar > documento desaparecido hace más de 12 meses…` · `Tests  1 failed | 6 passed (7)`. Restaurado: `7 passed`.

## Decisiones menores (supuestos reversibles)

- `subirMultiparte` y `escribirIndice` LANZAN si la subida falla (tras Abort de mejor esfuerzo); `borrarVersion` devuelve `{ ok:false, error }` sin lanzar; `leerObjeto` da `null` en `404`. `leerIndice` lanza `IndiceIlegible` (clase exportada de `indiceDrive.ts`) en cualquier otro fallo: red, estado ≠ 200/404, descifrado, JSON o forma (`formato !== 1`, `documentos` no objeto).
- Interfaz: `AlmacenS3 { cfg, fetchImpl, ahora }`; `aRetirar(indice, ahora: Date | string)` devuelve `Retirada { id, clave, versionId?, motivo }`; `quitarRetirados(indice, [{clave}])` suelta el documento que se queda sin versiones. El orquestador debe pasarle sólo las que `borrarVersion` dio por `ok`.
- Una fuente vacía sube UNA parte vacía (S3 no cierra sin partes). Una fuente de exactamente 8 MiB sube una sola parte (sin parte final vacía).
- Un verbo literal por función (`borrar`, `post`, `put`), porque el barrido de superficie sólo lee `method: '…'` literal; `Create` y `Complete` comparten `post`, `Abort` y `DELETE ?versionId=` comparten `borrar`. `GET` no lleva `method`.
- Ni `node:fs` ni `fs` ni `node:os` en ningún módulo nuevo (el guardián estático llega en el lote 7).
- `cifrado.ts`: sólo +8 líneas AL FINAL (0 borradas; `cifrado.ts:12` y `:23-52` intactas). En `cifrado.test.ts` cambia 1 línea (el import) y se añaden 15 al final.

## Cierre — cuatro códigos de salida

| Comando | Código | Resultado |
|---|---|---|
| `npm test` (completo, solo) | **0** | `Test Files 231 passed | 2 skipped (233)`, `Tests 3492 passed | 7 skipped (3499)` (la 1.ª pasada dio 1 rojo, el del guardián de superficie, ver arriba) |
| `npm run typecheck` | **0** | sin errores |
| `npx eslint .` | **0** | `165 problems (0 errors, 165 warnings)`; los míos: 0 |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null` | **0** | sobre HEAD (aún sin estos ficheros); el definitivo lo corre el orquestador tras commitear |

## Medida

`git diff --shortstat --no-renames 288ae0d` (medido con esta sección ya escrita): 5 files changed, 89 insertions(+), 8 deletions(-) (`apply-progress.md` +53, `tasks.md` 6 casillas, `cifrado.ts` +8, `cifrado.test.ts` +15/-1, `superficieSaliente.test.ts` +5/-1 con la línea de comentario). Sin trackear (`wc -l`): indiceDrive 32+55, multiparte 103+109, retencion 36+65 = **400**. Total = 97 + 400 = **497**, bajo 680. Sin binarios.

## Ficheros

Nuevos (`apps/desk/server/respaldo/`): `retencion.ts`, `retencion.test.ts`, `multiparte.ts`, `multiparte.test.ts`, `indiceDrive.ts`, `indiceDrive.test.ts`.
Modificados: `cifrado.ts` (al final), `cifrado.test.ts`, `apps/desk/server/superficieSaliente.test.ts` (+3 etiquetas, «nueve»→«doce»), `openspec/changes/respaldo-semanal-drive/tasks.md`, este `apply-progress.md`.
