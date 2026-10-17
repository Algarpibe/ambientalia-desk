# Apply-progress: medicion-garantias-por-marca (F1B-13, cierra: no)

## Lote 1 · packages/shared (tareas 1.1 a 1.6) — COMPLETO

Partida del intento: `1ec76ce`. Worktree `medicion-garantias-por-marca`.

| Tarea | Estado | Nota |
|---|---|---|
| 1.1 Rojo | [x] | `medicionGarantias.test.ts` (21 pruebas) |
| 1.2 Verde | [x] | `medicionGarantias.ts` según `design.md` §3 |
| 1.3 Export | [x] | una línea al final de `index.ts` (`:45`) |
| 1.4 Refactor | [x] | sin cambio de comportamiento; lint exigió quitar un desestructurado sin uso |
| 1.5 Diff | [x] | `index.ts` +1 línea; `garantiaProveedor.ts` de shared intacto |
| 1.6 Cierre | [x] | ver abajo |

### Rojo (antes del verde)
`npx vitest run packages/shared/src/medicionGarantias.test.ts` -> exit 1:
`Error: Cannot find module './medicionGarantias' imported from .../medicionGarantias.test.ts` (sin pruebas, 1 fichero fallido).

### Verde
Mismo comando -> exit 0, 21 pruebas pasan.

### Cierre del lote (cada código por separado)
- `npm test`: 0 (278 ficheros pasan, 3 omitidos; 4733 pruebas pasan, 11 omitidas)
- `npm run typecheck`: 0
- `npm run lint`: 0 (0 errores, 165 avisos: igual que la base). La primera pasada dio 1 error (`_clave` sin uso), corregido.
- `npm run build`: 0
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0 (13 abreviadas rotas informativas, ninguna de este cambio)

### Medida del intento
- `git diff --shortstat --no-renames 1ec76ce`: 1 fichero, 1 inserción (`index.ts`)
- `wc -l` sin trackear: `medicionGarantias.ts` 104 + `medicionGarantias.test.ts` 211 = 315
- Total de código: 316 (estimado ~390). Más `tasks.md` y este informe, que no son código de la tanda.

### Notas de diseño
- Sin choque entre spec y diseño. `resultados` cuenta las fichas resueltas por resultado.
- La etiqueta y la lista de `ticketIds` salen de ordenar la entrada por `id` antes de agrupar (D-5).
- Mutaciones M-1a a M-8 de la capa shared se ejecutan en el cierre del cambio (3.x), no en este lote.
