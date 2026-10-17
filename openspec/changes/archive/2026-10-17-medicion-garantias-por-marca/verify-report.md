# Verify-report: medicion-garantias-por-marca (F1B-13, cierra: no)

Rama `medicion-garantias-por-marca`, HEAD `fbc9da3`, partida `ea9cb82`. Modo: strict_tdd. Runner `npx vitest run`. Verificado por ejecución en el worktree.

**Veredicto: PASS** (0 CRITICAL, 0 WARNING, 2 SUGERENCIAS).

## 1. Matriz requisito -> escenario -> prueba
S = `packages/shared/src/medicionGarantias.test.ts`; V = `apps/desk/server/routes/medicionGarantias.test.ts`.

| Requisito · escenario | Prueba |
|---|---|
| RQ-TC-65 · suma de cuatro estados (1000/250) | S:32 |
| · rechazada 500/0, cociente 0 | S:51 |
| · abierta y enviada reclamadas, no recuperadas | S:59 (y S:66, recuperado sintético 999) |
| · una ficha «no» no cuenta | S:71 |
| · sin valor reclamado aparte | S:82 |
| · agrupación recortada y sin mayúsculas, etiqueta determinista | S:95 (permutación) |
| · acentos no se pliegan | S:107 (y S:21) |
| · sin reclamado el cociente es `null` | S:120 |
| · sin fichas, vacía y sin error | S:128 |
| RQ-TC-66 · frontera 1 vs 2 fichas | S:147 |
| · mayúsculas y espacios no parten la clave | S:158 |
| · cualquier estado cuenta, sin ventana | S:168 (ver S1) |
| · sin referencia no cuenta | S:176 |
| · otro fabricante no se junta | S:184 |
| · una «no» no cuenta | S:192 |
| RQ-TC-67 · sin sesión, 401 | V:54 |
| · usuario con sesión, sin cargo ni rol, recibe éxito | V:58 |
| · dos usuarios reciben lo mismo | V:64 |
| · el servidor sirve lo de `shared` sin recalcular | V:73 (y V:84 para el `WHERE`) |
| · la lectura no escribe | V:92 |
| RQ-TC-68 · los 5 escenarios (acceso, no calcula, sin semáforos, sin escrituras, vacío) | **por lectura**: `.tsx` fuera de la red (F0-00, `vitest.config.ts:16`); ver §4 |

Por lectura también: «no consulta las fichas» del 401 (V:54 sólo asevera el estado; el middleware corta antes, `routes/garantiaProveedor.ts:109` en `4e6a99d`) y «en la capa de servidor no existe suma ni agrupación propia» (la spec ya lo remite a la revisión de código; confirmado: la ruta es una línea, `:109-111`).

## 2. Evidencia TDD (apply-progress)
| Lote | Rojo registrado | Verde | Triangulación |
|---|---|---|---|
| 1 shared | `Cannot find module './medicionGarantias'` (`apply-progress.md:17-18`), exit 1 | 21 pruebas | 21 casos con valores distintos (1000/250, 500/0, 300, 150, null, ...) |
| 2 servidor | 5 rojas y 1 verde (`:62-65`); la verde es el 401, que sin ruta lo daba el resto del servidor | 6 pruebas | 6 casos; M-7 se comprobó con la ruta escrita (rojo real) |
| `.tsx` | sin rojo, F0-00 (exento) | n/a | n/a |

Tabla de tareas completa (1.1-3.13 todas `[x]`, coherente con el código). Ficheros de prueba existen y pasan (27/27 en el paso ejecutado por mí). Safety net: ficheros modificados (`routes/garantiaProveedor.ts`, `db/garantiaProveedor.ts`, `index.ts`, `Header.tsx`, `client.ts`) cubiertos por `npm test` completo antes y después (4733 -> 4739).

**Auditoría de aserciones:** 0 tautologías; 0 bucles fantasma salvo S:125 (`for ... of m.porFabricante` con `toBeNull`), cuya colección es no vacía por construcción (dos fichas «Sin» y «Cero») y M-8 lo pone rojo. `toEqual([])` en S:149, 181, 189, 197 y V:61 tienen compañera no vacía (S:151, S:163, S:173; V:73). Sin mocks. Todas verifican valores.

## 3. Regla de cómputo (verificada en `medicionGarantias.ts`)
- Rechazada = reclamada con 0 recuperado: `:70` suma `valorReclamado` de toda ficha «sí» en cualquier estado; `:71-73` sólo `resuelta` suma `valorRecuperado ?? 0` (una rechazada se resuelve con 0, `garantiaProveedor.ts:175-185` de la ficha).
- Abierta/enviada reclamadas y no recuperadas: `:70` las suma al reclamado; `:74-75` van a `sinResolver` y no pasan por `:72`.
- Sin valor aparte: `:69` incrementa `sinValorReclamado` y `:70` (rama `else`) no suma un 0; el `valorRecuperado` de una resuelta sin reclamado sí suma (`:72`; S:82).
- «No» fuera: `:54`. Cociente `null` si reclamado no es > 0: `:80`. Umbral `:10`, `:99`. Clave `:13-15`, `:88`.

## 4. Regla 13: C-1..C-8 rehechos contra el código
`MedicionGarantias.tsx` (101 líneas): `grep` de `reduce|filter|sort|toLowerCase|Math\.|/`-división sobre datos: 0. Sólo `.map` de columnas y filas (`:53,57,66,86`), `join` (`:91`), `length` (`:37,40,73`), `toLocaleString` (`:15,17`, formato). Sin `bg-red/green`, sin semáforo, sin `<form>`, `<input>` ni botón de acción salvo «Cerrar» (`:30`).
| # | Decisión del cliente | Línea que la impone | Resultado |
|---|---|---|---|
| C-1 | Botón «Garantías» a todo usuario con sesión (`Header.tsx:150-152` en `4e6a99d`; `if (!user) return null` `:144`; sin `isAdmin`) | `requireAuth` `routes/garantiaProveedor.ts:109` en `4e6a99d`; V:54, V:58, V:64 | confirmada |
| C-2 | Qué fichas cuentan | `db/garantiaProveedor.ts:165` y `medicionGarantias.ts:54` | confirmada |
| C-3 | Agrupar y etiquetar | `medicionGarantias.ts:13-15,47-50,54,58-67` | confirmada |
| C-4 | Sumas, sin resolver, desglose | `:68-76` | confirmada |
| C-5 | «—» ante `null` (`.tsx:17`) | `:80` | confirmada: el `.tsx` sólo compara con `null` |
| C-6 | Falla repetida | `:10`, `:99` | confirmada |
| C-7 | Orden de filas | `:81`, `:100` | confirmada (el `.tsx` no ordena) |
| C-8 | Vacío -> «Sin reclamaciones» (`.tsx:37-39`) | ambos arrays vacíos desde `routes/garantiaProveedor.ts:110` en `4e6a99d`; V:58 | confirmada |
Hallazgo: ninguna decisión sin línea. Los espejos son legítimos: la única imposición es la sesión y está probada (V:54).

## 5. Mutaciones reproducidas por mí (aplicar, correr las dos pruebas, restaurar)
| M | Mutación | Rojas |
|---|---|---|
| M-2 | cualquier estado suma a `recuperado` (`:71`) | 5: S:66 (M-2), S:32, S:59, S:168, V:73 |
| M-3 | rechazada suma su reclamado a `recuperado` (`:72`) | 2: S:51 (M-3), S:32 |
| M-5 | `UMBRAL_FALLA_REPETIDA` 2 -> 1 (`:10`) | 5: S:26, S:147 (M-5), S:184, S:192, V:73 |
| M-8 | cociente sin guarda de 0 (`:80`) | 1: S:120 (M-8) |
Ninguna siguió verde; coincide con `apply-progress.md:72-82`. Restaurado por copia y `diff` vacío; `git status --short` limpio antes y después de los pasos de §6.

## 6. Códigos (cada uno por separado, sobre `fbc9da3`)
- `npm test`: 0 (279 ficheros pasan, 3 omitidos; 4739 pruebas pasan, 11 omitidas)
- `npm run typecheck`: 0
- `npm run lint`: 0 (0 errores, 165 avisos: igual que la base)
- `npm run build`: 0 (`index-BNJMbWTa.js`, igual que el cierre del apply)
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0 (13 abreviadas rotas informativas; ninguna menciona `Header` ni este cambio; línea base 0)

Cobertura: sin herramienta de cobertura en las capacidades; omitida (no es fallo). Capas: 27 pruebas unitarias/de ruta (pg-mem + supertest, integración ligera de servidor), 0 E2E.

## 7. Hallazgos
- CRITICAL: ninguno.
- WARNING: ninguno.
- SUGERENCIA S1: S:168 («cualquier estado cuenta, sin ventana») no usa fechas; «sin ventana» se cumple por ausencia de código (`medicionGarantias.ts:84-96` no lee fechas), no por una prueba. Reversible con S-2.
- SUGERENCIA S2: V:54 no demuestra «no consulta las fichas» (spec RQ-TC-67); por lectura es cierto (`requireAuth` corta antes del handler).

Pendiente de personas, no de verify: P-1 (verificar la vista en la aplicación tras desplegar), P-2, P-3 (`tasks.md:92-94`). Archivar NO las da por hechas.

**Siguiente: sdd-archive** (`cierra: no`; el `archive-report.md` debe decir qué parte del contenido de F1B-13 cubrió y qué dejó fuera).
