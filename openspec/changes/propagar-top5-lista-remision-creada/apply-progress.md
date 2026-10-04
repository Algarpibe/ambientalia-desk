# Progreso del apply — propagar-top5-lista-remision-creada

Cambio `propagar-top5-lista-remision-creada` (`tanda: F1B-07`, `cierra: no`). Modo: `strict_tdd`, `hybrid`.

## Lote L1 — marca por fila `prioridad_en_app_at` — COMPLETO

Commit de partida del intento: `27379a02c8a25a1635b870a259e001f2f3a16863`.

### Líneas antes y después

| Fichero | Antes | Después | Netas |
|---|---|---|---|
| `packages/zoho-sync/src/db/repo.ts` | 452 | 452 | **0** (`git diff --numstat`: 5 ins / 5 borr) |
| `packages/zoho-sync/src/db/schema.sql` | 707 | 710 | +3, al final |
| `packages/zoho-sync/src/db/migrate.test.ts` | 746 | 765 | +19 (3 en sitio, 1 en sitio más en `:652`, 19 nuevas al final) |
| `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts` | — | 81 | nuevo |

### Rojos observados (antes de tocar `schema.sql` y `repo.ts`)

`npx vitest run repoPrioridadEnApp.test.ts migrate.test.ts` → `7 failed | 50 passed`:

- `migrate.test.ts` › «son 51 ALTER: …» → `AssertionError: ALTER TABLE en schema.sql: expected 50 to be 51`.
- `migrate.test.ts` › «propagar-top5 (L1) · la ALTER de prioridad_en_app_at no rellena filas previas» →
  `sentencias de schema.sql que mencionan prioridad_en_app_at: expected [] to have a length of 1 but got +0`.
- `repoPrioridadEnApp.test.ts` › «con la marca, una prioridad distinta de Zoho no la cambia; subject sí; managed_by_app sigue false»,
  «las dos marcas a la vez protegen la orden de venta y la prioridad; subject cambia» y «una fila sólo con la marca de
  prioridad SÍ actualiza orden_venta» → `Error: Column "prioridad_en_app_at" not found` (x2) /
  `column "prioridad_en_app_at" does not exist`. **El fallo es la columna inexistente, no `priority` pisada**: el `UPDATE`
  que pone la marca falla antes de llegar al `upsertTicket`; el «`priority` pisada» sólo se observa tras añadir la columna
  (ver M2).
- Dos de las de caracterización también cayeron por la misma razón (la columna no existe) y no son rojos de
  comportamiento: «managed_by_app=true gana aunque la marca esté puesta» y «upsertTicket nunca escribe la marca».
  **Declaración:** las de caracterización (sin marca manda Zoho; `managed_by_app` gana; no escribe la marca; la marca no
  está en `TICKET_COLS`) son guardianes que nacen verdes en cuanto la columna existe; «sin marca manda Zoho» y «la marca
  no está en `TICKET_COLS`» pasaron en verde desde el principio.

**Hallazgo no previsto por `tasks.md`:** `migrate.test.ts` › «las seis sentencias nuevas van DETRÁS de prioridad_ajustes…»
(`:648-661`) fija por posición el número de sentencias tras `idx_prioridad_ajustes_ticket` (`ultima + 1 + 6 + 2 + 17`).
Quedó rojo (`expected 146 to be 145`) al añadir la `ALTER` al final; se actualizó en sitio en `:652` (`+ 1` y el mensaje),
cero líneas netas. Es el recuento «posicional» del guardián de `schema.sql`, el mismo molde que los otros.

### Verde

- `schema.sql:708-710`: dos líneas de comentario sin punto y coma y
  `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;` (sin calificar; `tickets` es de `DESK_TABLES`).
  Sin relleno.
- `repo.ts:67` (SELECT), `:70` (tipo), `:76-78` (tres líneas, mismo número que antes). `:71` intacta y primera.
  `ov_elegida_en_app_at` y la discrepancia de la OV no cambian.
- `npx vitest run` de los dos ficheros: `57 passed`.
- Conservada la terminación de línea CRLF de los tres ficheros editados (`file` lo confirma).

### Mutaciones (copias de seguridad en el directorio temporal del agente; revertidas con `cp`, no con `git checkout`)

| # | Cambio exacto | Qué cae (literal) |
|---|---|---|
| M1 (regla 1, posición) | `repo.ts`: la línea `if (prev?.managed_by_app === true) return null …` (`:71`) se borra de su sitio y se inserta justo antes de `return discrepancia` (tras el `await db.query` de `:89-93`) | `repoPrioridadEnApp.test.ts` › «managed_by_app=true gana aunque la marca esté puesta: el salto de la fila entera sigue PRIMERO» → `expected 'En Proceso' to be 'Ingresado'`; además `repo.test.ts` › «upsertTicket NO sobrescribe si managed_by_app=true» → `expected 'Ingresado' to be 'En Proceso'` y «managed_by_app=true gana aunque la marca esté puesta: el salto de :59 sigue PRIMERO» → `expected 'En Proceso' to be 'Ingresado'`. 3 caídas |
| M2 | `repo.ts:78`: `c === 'priority'` → `c === 'prioridad'` | Las TRES rojas de `repoPrioridadEnApp.test.ts` (no dos): «con la marca, una prioridad distinta…» → `expected 'Low' to be 'High'`; «las dos marcas a la vez…» → `expected 'Low' to be 'High'`; «una fila sólo con la marca de prioridad SÍ actualiza orden_venta» → `expected 'Low' to be 'High'` |
| M10 (regla 2, fichero vigilado) | `schema.sql`: se añade al final `UPDATE tickets SET prioridad_en_app_at = now();` | `migrate.test.ts` › «sólo hay UNA sentencia relacionada…» → `expected [ …(2) ] to have a length of 1 but got 2`; también «las seis sentencias nuevas van DETRÁS…» → `expected 147 to be 146` y «EN12-2 · un ticket Finalizado … idéntico tras un segundo migrate» → `expected [ …(2) ] to deeply equal [ …(2) ]` |
| M9 (regla 2, fichero vigilado) | `schema.sql`: se añade al final `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS x text;` | `migrate.test.ts` › «toda ALTER TABLE apunta a una tabla clasificada…» → `expected [ 'public.tickets' ] to deeply equal []`; «son 51 ALTER…» → `expected 52 to be 51`; «las seis sentencias nuevas van DETRÁS…» → `expected 147 to be 146`. **La que nombraba la tarea (`migrate.test.ts:332`) es la primera** |

Tras la última: `cmp` de `repo.ts` y `schema.sql` contra sus copias del verde da idéntico; `git diff --numstat` sólo muestra
el verde de L1.8-L1.9.

### Regla 13 (L1)

«Que el sincronizador no pise la prioridad» lo impone `upsertTicket` (`packages/zoho-sync/src/db/repo.ts:76-78`), en el
servidor y sin espejo en el cliente: es la única comprobación que hay, y está probada (`repoPrioridadEnApp.test.ts`). El
cliente no participa. El ajuste manual (`ajustarPrioridad`, `managed_by_app = true`) no cambia.

### Cierre (códigos de salida literales)

```
test exit=0
typecheck exit=0
lint exit=0
Test Files  189 passed | 1 skipped (190)
Tests  2962 passed | 2 skipped (2964)
✖ 165 problems (0 errors, 165 warnings)
```

Antes del lote: 2.954 y 2 omitidas en 188 + 1. Ahora +8 pruebas (7 del fichero nuevo, 1 de `migrate.test.ts`) y +1 fichero.
Una primera pasada dio 166 avisos: era un `as any` de mi `zTicket` copiado de `repo.test.ts`; sustituido por
`as unknown as Parameters<typeof ticketRowFromZoho>[0]`, vuelve a 165.

### Medida del intento

- `git diff --shortstat --no-renames 27379a0`: 3 files changed, 31 insertions(+), 9 deletions(-) → **40**.
- Sin trackear: `repoPrioridadEnApp.test.ts` 81 + este `apply-progress.md` (ver el informe del apply para la cifra final).
- Binarios: ninguno.
