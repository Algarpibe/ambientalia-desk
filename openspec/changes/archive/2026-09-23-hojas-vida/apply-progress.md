# Apply progress: hoja de vida — seis campos comerciales (F1B-02)

**Escrito el 2026-09-23, DESPUÉS del apply, no durante.** El apply del 22/09 guardó su progreso sólo en
Engram (obs. #919, `sdd/hojas-vida/apply-progress`, 22/09 19:32) y nunca en este fichero; con
`artifact_store: hybrid` tenían que existir los dos, y el dispatcher daba `applyProgress: missing`.

**Cómo leer este fichero.** Hay dos tipos de afirmación, y cada una lleva su marca:

- **[REPRODUCIDO 23/09]**: lo he vuelto a ejecutar hoy sobre la rama y la cifra es la de esa ejecución.
- **[DECLARADO 22/09]**: lo afirma la obs. #919, escrita por el propio agente del apply. **No se
  guardaron las salidas en bruto de RED ni de GREEN**: no hay log, captura ni fichero de las ejecuciones
  en rojo. Esas filas son la palabra del ejecutor, no evidencia, y aquí no se inventan.

**Cambio**: hojas-vida · **Modo**: Strict TDD · **Estado**: 26/26 tareas (`tasks.md`), las 7 fases.
**Worktree**: `C:\dev\Desk_2_R1.023-worktrees\f1b-02-r1`, rama `f1b-02-r1`, base `acf2701`.

## Intento del ledger [REPRODUCIDO 23/09]

`gentle-ai sdd-attempt status --change hojas-vida`: intento 1, `outcome: passed`, `changed_lines: 528`,
árbol inicial `e63a98b` (= `0b5cf64`, tareas) y árbol final `067d6c0` (= `094eaa4`, cierre).
`git diff --shortstat --no-renames e63a98b 067d6c0` → **17 ficheros, 470+/58− = 528**, lo mismo que el
ledger. Techo del objetivo: 800.

## Commits

| Commit | Fases | Qué |
|---|---|---|
| `3793f87` | 1-5 | servidor: `schema.sql`, `types.ts`, `db/equipos.ts`, `routes/equipos.ts`, 10 pruebas |
| `a53969a` | 6 | cliente: `HojaDeVida.tsx`, `EquiposAdmin.tsx`, `client.ts` |
| `094eaa4` | 7 | barrido de la regla de mutación 4 y guardián de `ALTER` |

Posteriores al apply, fuera del intento: `3dc4eb0` (E-028), `0808fdf` (lint, ver abajo) y el
traslado de la spec al delta (2026-09-23).

## Fases [DECLARADO 22/09, salvo donde se marca]

- **1.1** `packages/zoho-sync/src/db/schema.sql`: 6 `ALTER TABLE equipos` sin calificar, al final.
- **2.1-2.2** `fechaSolo` exportada en `books/repo.ts`; `EquipoLite` + `codigoInterno`, `EquipoFull` + 6 campos.
- **3.1-3.6** `db/equipos.ts`: `EquipoInput`, alta, edición, `toLite`/`toFull`, `LEFT JOIN` para el
  nombre del mantenedor, búsqueda también por `codigo_interno`.
- **4.1-4.3** `routes/equipos.ts`: helper `camposHojaDeVida` al final del fichero, llamado en POST
  (`:60`) y PATCH (`:96`) antes de `updateEquipo` (`:99`) y `setEquipoActive` (`:100`).
- **5.1-5.10** diez pruebas en `apps/desk/server/equipos.test.ts`, contra la API HTTP (supertest + pg-mem).
- **6.1-6.3** cliente. Fuera de la red de pruebas por decisión F0-00 (`vitest.config.ts:17-20`).
- **7.1** barrido de la regla de mutación 4: 9 citas corregidas en 6 ficheros; dos (`types.ts:421` y
  `:472`) ya estaban rotas antes de la tanda.

## Evidencia TDD

| Qué | Fuente | Resultado |
|---|---|---|
| Red de seguridad: 24 pruebas previas en verde antes de tocar | DECLARADO 22/09 | sin salida guardada |
| RED: 9 de 10 pruebas nuevas en rojo por la razón correcta; 5.1 ya pasaba (regresión) | DECLARADO 22/09 | **sin salida guardada** |
| GREEN: pruebas focalizadas | REPRODUCIDO 23/09 | `npx vitest run apps/desk/server/equipos.test.ts apps/desk/server/db/equipos.test.ts` → **2 ficheros, 50/50** |
| Suite completa | REPRODUCIDO 23/09 | `npm test` → **132 ficheros pasan, 1 saltado; 1257 pruebas pasan, 2 saltadas**. La #919 decía «1257/1257, 1 skipped»: el 1 era el fichero, no las pruebas |
| Mutación de posición (regla 1) sobre la prueba 5.8 | REPRODUCIDO 23/09 | subir `setEquipoActive` de `routes/equipos.ts:100` por encima de la guarda de `:96` → `[posición] …` **roja**, `AssertionError: expected false to be true`; revertido con `git checkout` (0 cambios) → **verde** |

## Desviaciones respecto del diseño [DECLARADO 22/09]

1. `EquipoInput` nació con los 6 campos obligatorios; rompía ~15 llamadas de `db/equipos.test.ts`. Pasó a `?: string | null`.
2. El helper se colocó primero al principio del fichero, contra `design.md`; se movió al final.
3. Las 6 `ALTER` nuevas rompieron el recuento fijo del guardián de `migrate.test.ts` (29→35 en total, 11→17 sin calificar); se actualizó con comentario.
4. El barrido de la regla 4 salió más profundo de lo previsto en el diseño (ver 7.1).
5. E-028 de `docs/sdd/ENTRADA.md` no se tocó, por instrucción del encargo.

## Corrección de una afirmación del apply

La #919 y el `diagnosis` del ledger dicen «lint limpio, sólo avisos preexistentes». **Era falso**: se
comprobó con `npm run lint` a secas, que no lleva `--max-warnings`. Medido el 23/09: la rama daba
**168** avisos contra los 165 de `main`, y los 3 de más eran de esta tanda
(`apps/desk/server/equipos.test.ts:338-340`, `(e: any)`). Los cerró `0808fdf`; hoy la rama da
**165 con `npm run lint -- --max-warnings 165`, exit 0**, el comando del CI (`f7c9dc1`, `.github/workflows/ci.yml:41`).

## Comprobación de persona pendiente (no es tarea de esta tanda, y archivar no la da por hecha)

RQ-HV-07/08 (`HojaDeVida.tsx`, `EquiposAdmin.tsx`): verificación manual en staging. Dueño: Comercial/Gerencia.
