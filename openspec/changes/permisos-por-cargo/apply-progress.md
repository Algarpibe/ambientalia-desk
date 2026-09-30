# apply-progress — `permisos-por-cargo` (F1C-05, `cierra: no`) — Lote 1 · `shared` (2026-09-30)

Modo: strict TDD, `hybrid`. Tareas hechas: 0.1-0.4 y 1.1-1.12 (Lote 1 completo). Sin commit: lo hace el orquestador.

## Línea base y medida
- HEAD `38eed82` (no `e591454`: los commits intermedios son sólo de `docs/`; `git diff --stat e591454 HEAD -- apps packages` vacío).
- Antes: 160 ficheros de prueba (159 pasan, 1 omitido), 1.992 pruebas, typecheck limpio, **165 avisos** de eslint.
- Después: 161 ficheros, 2.024 pruebas (+27 `cargos.test.ts`, +5 `permisos.test.ts`; 2 omitidas como antes), typecheck limpio, **165 avisos** (0 `any` nuevos).
- Estimado ~330; medido: `git diff --shortstat --no-renames HEAD` con los nuevos en `git add -N` sobre el código: 362 inserciones + 5 borrados = 367. Total del lote con este fichero, `tasks.md` y `design.md`: 432 inserciones + 21 borrados = **453**. Margen a 800: 347.

## Puntos medidos (0.3)
| Fichero | Largo hoy (diseño) | Cambio |
|---|---|---|
| `types.ts` | 810 | `:1`, `:220`, `:222` en sitio: `+3 −3` |
| `transitions.ts` | 397 (413) | `:52` en sitio: `+1 −1` |
| `index.ts` | 24 | `:25` nueva, al final: `+1 −0` |
| `permisos.test.ts` | 334 (335) | `:5` en sitio; +50 al final (384): `+51 −1` |
| `permissions.ts` | 7 | sin tocar |
Grep previo: `cargo_permiso|cargoPermiso` = 0 y `Director Comercial` en `*.ts(x)` = 0.

## Rojos previos y nacidos verdes
- Rojo natural: `./cargos` no existía (falla la importación de `cargos.test.ts`) y `puedeEjecutarTransicion` no estaba exportada (5 pruebas nuevas de `permisos.test.ts` en rojo).
- Nacen verdes (no se tocan): `permisos.test.ts:77-81` (102 = 60/42, sólo área, S19), la matriz HTTP y las gemelas de Equipo nuevo y Soporte remoto.
- Nacen verdes tras el GREEN por diseño: la comprobación de que la tabla no toca las otras dos matrices (sólo se prueba por mutación (f)).

## Correcciones del usuario (prevalecen sobre diseño y tasks)
- **C-8** Las tres primitivas se llaman `puedeLiberarSinFactura`, `puedeCrearOVIGarantia`, `puedeFijarPrioridadTop5`, reciben el `SujetoDePermiso` completo y exigen área Y cargo; el admin pasa. `puedeLiberarSinFactura(s)` = `puedeEjecutarTransicion(s, <liberacion_sin_factura de TRANSITIONS>)` (falla cerrado si la transición no existe).
- **C-9** Un cargo fuera de la lista o vacío (`''`, `'director comercial'`, `' Director Comercial'`, `undefined`, `null`, `7`, `{}`) es «sin cargo» en las cinco funciones (`cargoEfectivo` con `esCargo`, sin confiar en el tipo); probado.
- **C-10** «El cargo sólo restringe» en `cargos.test.ts`: 5 subconjuntos de `AREAS` × 10 valores de cargo (`CARGOS` ∪ `null`, `''`, `'Gerente comercial'`) × 37 acciones = **1.850** casos (a mano); ninguno concede con el área negada; además exige que alguno conceda. En `permisos.test.ts`: exactamente un caso difiere, 61/41 y 816 casos.
- **C-11** Guardián contra `openspec/config.yaml` (regla de mutación 2): lee el fichero, localiza `decision/c10b-gerente-director` y la frase «Los cargos son siete: … y …» (`config.yaml:2589`, comprobado), compara en orden y como conjunto, 7; si no encuentra bloque o frase, falla con mensaje claro.
- **C-12** `transitions.ts:52` tipado en sitio con `import('./cargos').Cargo`.
- **S-9** (supuesto reversible): el área de los dos actos sin llamador es Servicio Técnico (OVI de garantía) y Comercial (Top 5); lo fijan F1B-03 y F1B-07. También en `design.md` §1.

## Hipótesis de 1.5
Confirmada: los literales `'Director Técnico'` (`transitions.ts:276`) y `'Coordinador Comercial'` (`:278`) tipan contra `Cargo` sin cambio. Ninguna anotación extra.
Otras desviaciones: `cargoPermisoDelCuerpo('   ')` (sólo espacios) → `null`, como `''`; `cargoQueFaltaParaTransicion` usa `Object.hasOwn` para que `'toString'` no cuente como excepción.

## Mutaciones (todas revertidas; `git diff` de `config.yaml` vacío)
| # | Mutación | Rojo |
|---|---|---|
| g | `'Director comercial'` en `CARGOS` | 8: S1 «siete, a mano y en orden», guardián D, `esCargo`/tabla/compuesta |
| g2 | octavo cargo `'Gerente comercial'` | 6: guardián D, S1 (dos), barrido 1.850, 816 casos, `cargoPermisoDelCuerpo` |
| g3 | `config.yaml:2589` «Coordinador» → «Coordinadora» | 1: guardián D |
| f | clave `liberacion_sin_facturaX` | 15: «toda clave existe en TRANSITIONS», «un caso difiere», contenido exacto |
| l | `&&` → `\|\|` en la compuesta | 16: 816 «nunca amplía», barrido 1.850, «cargo sin el área» |
| i (pura) | quitar la salida del admin | 2: «admin nunca echa en falta un cargo», «admin pasa por las 34» |
| n | quitar el área de `puedeCrearOVIGarantia` | 2: barrido «sólo restringe», prueba de la primitiva |
| m | `'Director técnico'` en `transitions.ts:276` | `npm run typecheck`: TS2820 en `transitions.ts(276,41)` |

## Cierre 1.12
`npm test`, `npm run typecheck`, `npm run lint` verdes (arriba). Citas: sólo las de esta carpeta (`design.md`, `tasks.md`, `exploration.md`) apuntan a `types.ts:1`/`:220-222`, `transitions.ts:52` y `permisos.test.ts:5`; siguen acertando (caso A). Nada se desplaza: `types.ts` y `transitions.ts` `+n −n`, `index.ts` y `permisos.test.ts` sólo al final. Tiempo de `npm test`: ~110 s.
