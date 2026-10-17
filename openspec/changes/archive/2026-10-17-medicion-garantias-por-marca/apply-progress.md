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

---

## Lote 2 · servidor y cliente (tareas 2.1 a 2.7) y CIERRE (3.1 a 3.13) — COMPLETO

Partida del intento: `6276080` (lote 1 commiteado). Mismo worktree.

| Tarea | Estado | Nota |
|---|---|---|
| 2.1 Rojo | [x] | `routes/medicionGarantias.test.ts` (6 pruebas) |
| 2.2 `fichasReclamadas` | [x] | `db/garantiaProveedor.ts:163-166`, `WHERE reclama = true ORDER BY id` |
| 2.3 Ruta | [x] | `routes/garantiaProveedor.ts:108-111`, sólo `requireAuth`; imports añadidos en sitio (`:5`, `:11`) |
| 2.4 Cliente | [x] | `getMedicionGarantias` al final de `client.ts`; `MedicionGarantias.tsx` nuevo; `Header.tsx`: `lazy`, estado, botón «Garantías» (icono `verified_user`) y `createPortal` en `UserMenu` |
| 2.5 Refactor | [x] | sin cambios de comportamiento; prueba y typecheck verdes |
| 2.6 Regla 3 | [x] | tabla abajo |
| 2.7 Cierre lote 2 | [x] | cifras abajo |
| 3.1 a 3.9 Mutaciones | [x] | tabla abajo; ninguna siguió verde, no hizo falta prueba extra |
| 3.10 Regla 1 | [x] | la ruta tiene UNA sola guarda (`requireAuth`, `routes/garantiaProveedor.ts:109`): no hay par que ordenar; la prueba «admin y no admin reciben el MISMO cuerpo» fija que no hay un segundo permiso |
| 3.11 Regla 2 | [x] | NO APLICA: ninguna guarda nueva vigila un fichero de datos |
| 3.12 Barrido regla 4 | [x] | abajo |
| 3.13 Cierre final | [x] | abajo |

### Rojo (antes del verde)
`npx vitest run apps/desk/server/routes/medicionGarantias.test.ts` -> exit 1: 5 fallan, 1 pasa. Los 5: `fichasReclamadas` no existe
(`TypeError: (0 , fichasReclamadas) is not a function`) y la ruta no existe (el cuerpo no es 200). El que pasa es «sin cookie da 401»:
sin la ruta el 401 lo da igualmente el resto del servidor; por eso M-7 se comprobó con la ruta ya escrita (ver tabla: rojo real).
Verde: mismo comando -> exit 0, 6 pruebas.

### Mutaciones (aplicadas en producción, prueba ejecutada, restaurado)
Comando: `npx vitest run packages/shared/src/medicionGarantias.test.ts apps/desk/server/routes/medicionGarantias.test.ts`.
Tras la última, los ficheros de producción se compararon byte a byte con la copia previa: sin mutación residual.
S = `medicionGarantias.test.ts` de shared; V = `routes/medicionGarantias.test.ts`.

| M | Mutación | Pruebas que se pusieron rojas |
|---|---|---|
| M-1a | `filter(f => f.reclama)` fuera de `medirGarantias` | S «una ficha “no” no entra en ninguna cifra (M-1a)»; S «una ficha “no” no cuenta» (fallas). 2 rojas |
| M-1b | `WHERE reclama = true` fuera (M-1a viva) | V «fichasReclamadas no devuelve el “no” sembrado (M-1b)». 1 roja; el `GET` sigue verde porque el `filter` de shared lo tapa: es justo por lo que D-6 pide una prueba por capa |
| M-2 | cualquier estado suma a `recuperado` | S «una enviada con recuperado sintético 999 no suma (M-2)», S «abierta y enviada…», S «suma de cuatro estados…», V «el cuerpo es lo que da medirGarantias…». 4 rojas |
| M-3 | la rechazada suma su reclamado a `recuperado` | S «rechazada: reclamado 500, recuperado 0 y cociente 0 (M-3)», S «suma de cuatro estados…». 2 rojas |
| M-4 | ficha sin valor como 0 sin contar `sinValorReclamado` | S «sin valor reclamado se cuenta aparte… (M-4)», V «el cuerpo es lo que da medirGarantias…». 2 rojas |
| M-5 | `UMBRAL_FALLA_REPETIDA` 2 -> 1 | S «el umbral de falla repetida es 2», S «frontera: una ficha no es repetida (M-5)…», S «la misma referencia de otro fabricante no se junta», S «una ficha “no” no cuenta», V «el cuerpo es lo que da…». 5 rojas |
| M-6 | `claveMedicion` sin `trim`/`toLowerCase` | S «recorta y pasa a minúsculas…», S «Acme y “  ACME ” forman un grupo… (M-6)», S «mayúsculas y espacios no parten la clave (M-6)», V «el cuerpo es lo que da…». 4 rojas |
| M-7 | `requireAuth` fuera de la ruta | V «sin cookie da 401 (M-7)». 1 roja |
| M-8 | cociente sin la guarda de 0 | S «sin reclamado, o con reclamado 0, el cociente es null y no NaN (M-8)». 1 roja |

Ninguna SIGUE VERDE. Sin pruebas añadidas por las mutaciones.

### Regla de mutación 3 — cada decisión del `.tsx` frente a la línea que la impone (leída línea a línea)
`MedicionGarantias.tsx` no contiene `reduce`, `filter`, `sort`, `toLowerCase`, divisiones ni sumas sobre los datos; sólo `map`, `join`,
comprobaciones de `length` y `toLocaleString` (formato).

| # | Decisión del cliente | Línea que la impone |
|---|---|---|
| C-1 | Botón «Garantías» a todo usuario con sesión (`Header.tsx:150-152`, dentro de `UserMenu`, que no pinta nada sin `user`, `:144`) | `requireAuth(db)` en `apps/desk/server/routes/garantiaProveedor.ts:109`; sin sesión el servidor da 401 igual (M-7) |
| C-2 | Qué fichas cuentan (sólo «sí») | `apps/desk/server/db/garantiaProveedor.ts:165` (`WHERE reclama = true`) y `packages/shared/src/medicionGarantias.ts:54` (`filter`) |
| C-3 | Agrupar por fabricante y la etiqueta del grupo | `packages/shared/src/medicionGarantias.ts:13-15` (`claveMedicion`), `:47-50` (`etiqueta`), `:54` (orden por `id`), `:58-67` |
| C-4 | Reclamado, recuperado, sin valor, sin resolver, desglose | `packages/shared/src/medicionGarantias.ts:68-76` |
| C-5 | Cociente, o «—» ante `null` (`MedicionGarantias.tsx:17`) | `packages/shared/src/medicionGarantias.ts:80` (`g.reclamado > 0 ? … : null`) |
| C-6 | Qué es una falla repetida | `packages/shared/src/medicionGarantias.ts:10` (`UMBRAL_FALLA_REPETIDA`) y `:99` (`filter`) |
| C-7 | Orden de filas | `packages/shared/src/medicionGarantias.ts:81` (por reclamado y clave) y `:100` |
| C-8 | Lista vacía -> «Sin reclamaciones» (`MedicionGarantias.tsx:37-39`) | arrays vacíos que devuelve `routes/garantiaProveedor.ts:110`; el `.tsx` sólo mira `length`; la prueba V «un usuario sin cargo ni admin recibe éxito» fija `{ porFabricante: [], fallasRepetidas: [] }` |

### Barrido regla 4 (todo el repositorio, sin `node_modules`)
Qué desplazó este cambio: `routes/garantiaProveedor.ts` (imports editados EN SITIO; la ruta nueva va antes del cierre, que pasa de `:107` a `:112`),
`db/garantiaProveedor.ts` (función tras `:161`), `shared/src/index.ts` (línea nueva `:45`): NO desplazan ninguna línea citada.
`Header.tsx` SÍ: orig `:1` pasa a 2 líneas (+1); el `lazy` tras orig `:4` (orig `:5` en adelante, +3); el estado tras orig `:139` (orig `:140` en adelante, +4); el botón tras orig `:145` (orig `:146` en adelante, +7).

| Cita | Veredicto |
|---|---|
| `DEPLOY.md:490` `db/garantiaProveedor.ts:144`; `docs/sdd/Paquete_de_Despliegue_2026-10-06.md:161-162`; `…2026-10-09.md:138,307,356-357,500,815`; `…2026-10-09b.md:164`; `Preguntas_Gerencia_2026-10-09.md:152` | intacta (todas ≤ `:161` en `db` y ≤ `:106` en `routes`: líneas que no se movieron) |
| `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/verify-report.md:53,69,70,72,159,161,166` | intacta (mismas razones) |
| `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:111` y las citas `shared/src/index.ts:3…42` de archive (todas ≤ `:42`) | intacta (el export nuevo es `:45`, tras la última línea citada) |
| `openspec/changes/medicion-garantias-por-marca/design.md:26,63,134`, `proposal.md:25,36,72,84`, `spec.md:155` | intacta |
| `design.md:27` (`routes/garantiaProveedor.ts:107` en `ea9cb82`, el cierre ANTES del cambio) | caso B: describe el punto de inserción previo. ANCLADA en `ea9cb82` por el orquestador |
| `openspec/changes/archive/2026-09-30-permisos-por-cargo/apply-progress.md:122` y `verify-report.md:106` -> `Header.tsx:146` en `ea9cb82` («el cliente lo decide en…», `user.isAdmin`) | caso B: era `{user.isAdmin && (` antes del cambio; hoy es la línea 153. ANCLADAS en `ea9cb82` por el orquestador, sin renumerar |
| `openspec/changes/archive/2026-10-03-continuidad-indicadores/design.md:235`, `exploration.md:61`, `proposal.md:162` -> `Header.tsx:90` en `ea9cb82` (molde `user?.isAdmin ? onOpenAnalisis`) | caso B: hoy es la línea 93. ANCLADAS en `ea9cb82` por el orquestador, sin renumerar |
| `openspec/changes/medicion-garantias-por-marca/design.md:69` -> la línea 140 de `Header.tsx` (C-1) | caso A: `if (!user) return null` está hoy en la 144. REAPUNTADA por el orquestador |

Segundo pase (abreviadas) en `openspec/specs`, `docs/sdd`, `openspec/config.yaml`, `DEPLOY.md`, `CLAUDE.md`: 0 citas a `Header` con línea.
Detector sobre `HEAD`: no marca las seis citas de archive porque el cambio aún no está commiteado; **tras el commit saldrán rotas en `pre-push`**
y hay que repararlas (anclar a `6276080`) en el mismo commit o antes del push.

### Cierre (cada código por separado)
- `npm test`: 0 (279 ficheros pasan, 3 omitidos; 4739 pruebas pasan, 11 omitidas)
- `npm run typecheck`: 0
- `npm run lint`: 0 (0 errores, 165 avisos: igual que la base)
- `npm run build`: 0; bundle principal `assets/index-BNJMbWTa.js`
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0 (13 abreviadas rotas informativas, ninguna de este cambio; línea base 0)

### Medida del intento (lote 2)
- `git diff --shortstat --no-renames 6276080`: 4 ficheros, 30 inserciones, 3 borrados = 33
- `wc -l` sin trackear: `routes/medicionGarantias.test.ts` 101 + `MedicionGarantias.tsx` 101 = 202
- Total de código: 235 (estimado ~460; muy por debajo de 720/800). Sin binarios.
- `git diff --stat`: sólo rutas de `design.md` §7; `App.tsx`, `app.ts`, `openspec/config.yaml` y `ENTRADA.md` intactos.

### Notas
- Sin choque entre spec y diseño. Moneda: `toLocaleString('es-CO')` como `PanelGarantiaProveedor.tsx:26`. El cociente se enseña con `toLocaleString('es-CO', { style: 'percent' })` sobre el número que llega (formato, no cálculo).
- No hay `python` en el entorno: las ediciones de `Header.tsx` se hicieron con `sed` y se restauró CRLF.
