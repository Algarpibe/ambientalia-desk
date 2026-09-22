# Apply progress — F1A-06 (`generador-mapa-blueprint`)

## Unidad A · datos y motor (intento 1, base `7670f89`)

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| A.1.1-A.1.2 | `fasesBlueprint.test.ts` | Unit | N/A (new) | ✅ `Cannot find module` | ✅ 5/5 tras crear `fasesBlueprint.ts` | ✅ 5 casos: cobertura exacta, recuento 4/12/5, tres asignaciones no mecánicas | ➖ Dato puro |
| A.1.3 | `fasesBlueprint.ts` (guarda de compilación) | Compile-time | ✅ verde antes de mutar | ✅ Quitar `'Pendiente'` de `FASE_POR_ESTADO` | ✅ `tsc` falla `TS1360`; revertido, exit 0 | ➖ N/A | ➖ N/A |
| A.2.1-A.2.3 | `invariantesGrafo.test.ts` (5b) | Unit | ✅ 7/7 antes de tocar | ✅ 5b reescrito antes de `transitions.ts`, falla | ✅ 7/7 tras `transitions.ts:150-151` en sitio | ➖ Único escenario | ➖ Comentario reescrito con el `it` |
| A.3.1-A.3.2 | `estadoPorRemision.test.ts` | Integration (pg-mem) | ✅ 13/13 baseline | ➖ Refactor de fuente, sin cambio de conducta | ✅ 13/13 **sin tocar ninguna aserción** | ➖ Approval-testing | ✅ Cita de comentario `:17` corregida |

### Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test | `fasesBlueprint.test.ts` + `invariantesGrafo.test.ts` + `estadoPorRemision.test.ts` → **25/25 passed** |
| Runtime harness | `npm test` completo (pg-mem + `migrate()` real) → **1232/1235 passed, 1 pre-existente fuera de alcance, 2 skipped** |
| Rollback | `git revert` del commit de A; sin migración ni dato en base; delta de líneas cero en `transitions.ts`/`estadoPorRemision.ts` |

Detalle completo (mutación A.1.3, barrido A.4.1, diff exacto) en el historial de este mismo fichero al
commit `e864b7a`. Los dos hallazgos pre-existentes de cierre (`registro.test.ts`, avisos ESLint) no
tocaban ficheros de esta Unidad; el primero quedó cerrado por `54d00f1` antes de arrancar B.

---

## Unidad B · generador, CLI, artefactos (intento 2, base `54d00f1`)

Token `sha256:cbc246b7...`, `state: proceed` confirmado antes de tocar nada.

### TDD Cycle Evidence

| Task | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| B.1.1-B.1.2 | `mapaBlueprint.test.ts` | Unit | ✅ 13 pruebas contra esqueleto (`{}`); 4 pasaban en falso por bucle fantasma sobre `Object.values({})` — corregidas con `toHaveLength(4)` antes del `for`; **13/13 rojas** | ✅ 13/13 tras implementar `generarMapaBlueprint` (regex `/-->/g` contaba también el cierre del comentario HTML de cabecera; corregido a `/e\d{2} --> e\d{2}/g`) | ✅ +guarda de alias, +área desconocida; consolidado a 14 casos sin perder aserciones | ✅ Comentarios comprimidos en cierre, sin tocar lógica |
| B.1.3-B.1.4 | (guarda EJECUCIÓN D-1) | Unit | ✅ `fasePorEstado` sin `'Pendiente'` → esperar `throw` | ✅ `validarFasePorEstado` lanza con el nombre del estado | ✅ Segunda guarda: `aliasDe` lanza si un estado referenciado no está en `estados` | ➖ N/A |
| B.2.1-B.2.4 | CLI, sin prueba propia (RQ-MB-01) | N/A | ➖ Por diseño | ✅ `npm run generar-mapa-blueprint` escribe 4 ficheros; 2ª ejecución **byte a byte idéntica** (`sha256sum`) | ➖ N/A | ➖ N/A |
| B.3.1-B.3.4 | bloque RQ-MB-06 | Unit (diff vs disco) | ✅ Nace verde | ✅ 1/1 tras normalizar `\r\n`→`\n` (CRLF de Windows, ver hallazgo) | ➖ N/A | ➖ N/A |

### Dos hallazgos de implementación

1. **Regex de arista contaba el cierre del `<!-- -->`.** `/-->/g` daba 39, no 38: la cabecera cierra
   con un `-->` suelto. Corregido exigiendo alias a los dos lados: `/e\d{2} --> e\d{2}/g`.
2. **CRLF del árbol de trabajo en Windows.** `.gitattributes` fija LF en el índice pero deja CRLF en
   el árbol (`core.autocrlf`, confirmado con `cat -A`: `^M$` en cada línea). El generador produce LF
   siempre (D-5); la prueba normaliza al leer disco, comparando por contenido, no por terminador.

### Mutaciones B.3.2/B.3.3

**B.3.2 (fichero vigilado).** `sed -i` cambia una línea de `blueprint-completo.md` commiteado →
`npx vitest run … -t "igual al commiteado en disco"` → **1 failed**, diff señala exactamente la línea
mutada. `git checkout -- docs/artefactos/blueprint-completo.md` → diff vacío → **1 passed**.

**B.3.3 (transición sintética sin regenerar).** Script `tsx` aparte (no queda como prueba permanente
que mute disco): `EntradaMapa` con una transición sintética extra, comparado contra el `.md` YA
commiteado (sin tocarlo) → mismatch confirmado, contiene la sintética el regenerado y no el commiteado.

### Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test | `mapaBlueprint.test.ts` → **14/14 passed** |
| Runtime harness | `npm run generar-mapa-blueprint` × 2 → `sha256sum` idéntico (determinismo D-5, criterio 1 §14) |
| Rollback | `git revert` del commit de B; borra los 3 ficheros nuevos + los 4 `.md` + entrada de `package.json`; no toca A |

### Hallazgo fuera de asignación, corregido por bloquear el cierre — `estadoPorRemision.ts:41`

`npm run typecheck` fallaba (`TS2345`, `actual: string | undefined` pasado a `applyTransition`).
Verificado con `git stash`/`git stash pop`: **pre-existente a TODA la tanda**, confirmado contra
`git show 125ae3e:...` (antes de la Unidad A). Falso negativo de tipos, no de comportamiento — el
`.some(...)` de la línea 41 ya excluía `undefined` en ejecución, pero no es un type guard. Corrección
de una línea, delta cero:

```diff
- if (![...CONFIRMADA.from, ...RETIRADA.from].some((s) => s === actual)) return
+ if (actual === undefined || ![...CONFIRMADA.from, ...RETIRADA.from].some((s) => s === actual)) return
```

Sin regresión: `estadoPorRemision.test.ts` → 13/13 antes y después, ninguna aserción tocada. Cita del
comentario `:17` (regla de mutación 4) actualizada en sitio, delta cero. Se corrige y no sólo se
reporta porque B.4.3 exige typecheck verde y la corrección es de una línea, cero riesgo, verificada —
mismo precedente que el barrido extendido de la Unidad A (A.4.1).

### Repaso de citas (regla de mutación 4)

- `package.json` (+1 línea, `:57`→`:58` para `@vitest/coverage-v8`): reparadas `config.yaml:60` y
  `F1A-05...md:221`. `Parte_2026-09-21.md:4` (`:20`) y las citas de esta tanda a `:43` — sin cambio,
  siguen ciertas (caso B, `125ae3e`).
- `index.ts` (+1 línea EOF, `:19`): `tasks.md:55,136` ya la anticipaban, confirmadas sin reparar.
- `estadoPorRemision.ts:41` (contenido cambia, línea no se mueve): cita literal de
  `estadoPorRemision.test.ts:17` reparada; `remisiones/spec.md:277`, `transitions-st/spec.md:81,106`,
  `zoho-sync/spec.md:79` describen comportamiento — sigue siendo cierto, sin reparar.
- `transitions.ts` (sin tocar en B): `grep` sobre el árbol final — sin roturas nuevas.

### Presupuesto

```
$ git diff --shortstat --no-renames 54d00f1 HEAD
15 files changed, 847 insertions(+), 143 deletions(-)
```

Incluye los cuatro `.md` generados (~187 líneas, excluidos del presupuesto de **revisión** por
convención de `sdd-phase-common.md` §E, pero contados en el ledger) y el propio `apply-progress.md`
como sumando obligatorio (lección de `CLAUDE.md`, regla del ciclo 2: el informe que la fase genera
no es un extra). Autoría de código+prueba+CLI: `mapaBlueprint.ts` 231 + su prueba 178 + la CLI 44 =
453 líneas nuevas, dentro del rango estimado por `tasks.md` (~480-560) y del techo de revisión de 800
del proyecto (`openspec/config.yaml:29`).

### Resultado de los comandos de cierre (B.4.1-B.4.3)

- `npm run test:coverage`: **exit 0**. `packages/shared/src/**` → 97,68 % líneas / 89,86 % ramas /
  98,87 % funciones / 97,68 % statements (suelo `92/92/96/78`). `mapaBlueprint.ts` → 100/97,82/100/100
  (única rama sin ejercitar: el fallback defensivo `MARCA_AREA[area] ?? area` de la leyenda —
  inalcanzable con datos reales porque `AREAS` es una constante cerrada de tres elementos).
- **38 aristas fijadas por aserción** (`RQ-MB-02`), 3 desde `habilitar_servicio`, 2 `(sin botón)`.
- `npm test`: **exit 0**, 1247/1249 passed, 2 skipped (2 menos que A por consolidar 2 pares de pruebas
  en 1 cada uno, sin perder aserciones).
- `npm run typecheck`: **exit 0** (tras la corrección declarada arriba).
- `npm run lint`: **exit 0**, 0 errores, 165 avisos — idéntico al recuento que dejó la Unidad A.
- `npm run build`: **exit 0**.

Criterio 1 de propuesta §14 (regeneración e idempotencia): `npm run generar-mapa-blueprint` × 2,
`sha256sum` de los cuatro ficheros idéntico entre ejecuciones.
