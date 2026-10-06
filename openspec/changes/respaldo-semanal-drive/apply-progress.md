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
