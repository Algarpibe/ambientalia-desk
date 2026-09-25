# Tasks — `blueprint-equipo-nuevo` (F1B-06, primer cambio, `cierra: no`)

**Fase:** `sdd-tasks` · **Árbol:** `e8640d7` (limpio) · **Entradas:** `proposal.md`, `design.md` y los
cuatro `specs/` de esta misma carpeta (`transitions-equipo-nuevo`, delta de `tickets-core`,
`transitions-st`, `derivacion-avisos`). Verificado contra HEAD (spot-check, no re-verificación íntegra
de `design.md`, que llega VALIDADO): `transitions.ts` (280-334), `estados.ts` (1-174),
`ticketService.ts` (1-223), `index.ts` (1-21), `avisoArea.ts` (1-21), `db/sla.ts` (1-62),
`TransitionPanel.tsx` (1-65), `fasesBlueprint.ts` (1-68), `fasesBlueprint.test.ts` (1-30),
`mapaBlueprint.test.ts` (1-30), `permisos.test.ts` (1-50) — todas las líneas citadas coinciden byte a
byte con el árbol de hoy. `packages/shared/src/flujos.ts` y `flujos.test.ts` NO existen todavía (D2).

## Review Workload Forecast

### Estimación por lote (medida real esperada: `git diff --shortstat --no-renames <base del lote>` + `wc -l` de lo nuevo sin trackear — regla del ciclo 2 de `CLAUDE.md`; cifras de `design.md` §7)

| Lote | Contenido | Estimación (+/−) |
|---|---|---|
| 1 · dominio shared (intento de ledger 1, base `e8640d7`) | `transitions.ts` ~47, `estados.ts` ~26, `flujos.ts` (nuevo) ~110, `flujos.test.ts` (nuevo) ~190, `index.ts` 1, `fasesBlueprint.ts`/`.test.ts`, `mapaBlueprint.test.ts`, `scripts/generar-mapa-blueprint.ts` ~20, `invariantesGrafo.test.ts` ~76, `estados.test.ts` ~25, `apply-progress.md` ~120 | **~615** |
| 2 · servidor, guardianes y cliente (intento de ledger 2, base = commit de cierre del Lote 1) | `reentrancia.test.ts` ~29, `sla.test.ts` (shared) ~22, comentarios shared ~10, `ticketService.ts` +8 (función `exigirMismoFlujo` al final), `avisoArea.ts` 6, `db/sla.ts` 8, `flujoEquipoNuevo.test.ts` (nuevo) ~120, `db/sla.test.ts` ~25, `avisoArea.test.ts` ~15, `transicionesEjecucion.test.ts` ~84, `permisos.test.ts` ~62, `appHarness.ts` 2, `.tsx` ~8, `apply-progress.md` ~80 | **~480** |

El `.tsx` cabe en el Lote 2; no necesita intento propio. Aparte de los dos lotes: `verify-report.md`
~350 (intento SDD aparte, por instrucción del orquestador) y `archive-report.md` (≈2× la carpeta +
fusión de la delta — **se mide, no se estima**, regla del ciclo 2). Citas desplazadas previstas: **0**
en `transitions.ts`, `estados.ts` y `ticketService.ts` (todo lo nuevo va al final del fichero o en
línea, principio de inserción de `design.md` §1).

| Campo | Valor |
|---|---|
| Líneas estimadas, Lote 1 | ~615 |
| Líneas estimadas, Lote 2 | ~480 |
| 400-line budget risk | **High** — cada lote, tomado solo, ya supera el presupuesto genérico de revisión de 400 líneas de `sdd-tasks`; el techo real de este proyecto es el ledger de `sdd-attempt` (800 por intento, `openspec/config.yaml:22-30`), y cada lote queda por debajo de ese techo con margen (~185 y ~320) |
| Chained PRs recommended | **Yes** — dos lotes, cada uno en su propio intento de ledger (Regla del ciclo 2 de `CLAUDE.md`: una tanda SDD por árbol de trabajo), commit directo a `main` entre ambos |
| Chain strategy | **stacked-to-main** — este repositorio commitea directo a `main`, sin ramas de PR; el Lote 2 se apoya en el commit del Lote 1 ya en `main` |
| Decision needed before apply | **No** — resuelto por el orquestador en el encargo de esta fase: dos lotes en intentos de ledger separados (lote 1 shared; lote 2 servidor + guardianes + `.tsx`), `sdd-verify` como intento aparte |
| Delivery strategy | ask-on-risk |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · Lote shared (Fases 1-5) | Registro de estados con `Verificación`, catálogo `TRANSITIONS_EQUIPO_NUEVO`, registro de flujos `flujos.ts`, guardianes de invariantes/fases/mapa extendidos | Commit único (intento de ledger 1) | `npx vitest run packages/shared/src/flujos.test.ts packages/shared/src/invariantesGrafo.test.ts packages/shared/src/estados.test.ts packages/shared/src/fasesBlueprint.test.ts packages/shared/src/mapaBlueprint.test.ts` | `npm test` (entorno `node`, sin credenciales Zoho ni servicios reales — todo el lote es dominio puro) | `git revert`: catálogo y registro son aditivos, sin migración ni datos; sin el enrutado, todo vuelve a derivar sólo de `TRANSITIONS`/`ESTADOS` (reversión de `proposal.md`) |
| 2 · Lote servidor + guardianes + cliente (Fases 6-13) | Guarda 3 en `executeTransition`, filtro de flujo en avisos y SLA, panel `.tsx`, guardianes de reentrancia/escalado/ejecución/permisos extendidos | Commit único (intento de ledger 2), sobre el commit del Lote 1 | `npx vitest run apps/desk/server/flujoEquipoNuevo.test.ts apps/desk/server/db/sla.test.ts apps/desk/server/services/avisoArea.test.ts apps/desk/server/transicionesEjecucion.test.ts apps/desk/server/permisos.test.ts packages/shared/src/reentrancia.test.ts packages/shared/src/sla.test.ts` | `npm test` contra el arnés `appHarness.ts` (pg-mem, sin Zoho real); comprobación de persona en `ambientalia-desk.ambientalia.cloud` para el `.tsx` (F0-00, fuera de la red de pruebas) | `git revert`: la guarda 3 y el filtro de flujo son aditivos sobre código existente; revertir deja `executeTransition` y los avisos/SLA tal como hoy, sin tocar datos |

`sdd-verify` no es un work unit de ningún lote: corre como intento SDD aparte sobre el commit ya
cerrado del Lote 2, por la razón de presupuesto ya explicada.

---

## Condición de despliegue — este cambio NO se despliega sin F1A-03

Con sólo 5 de las 6 filas del as-is de M1.4 (supuesto s4, `Verificación` sin transición de salida), un
ticket `Equipo nuevo` que llegue a `Verificación` queda sin ninguna transición ejecutable en el árbol.
**Qué decide:** el orden de despliegue entre este cambio y F1A-03 (las dos salidas de `Verificación`:
`Liberación` y la rechazada → `Notificado`, `plan:142`, `openspec/config.yaml:1981`). **A quién
corresponde:** a quien opere el despliegue — el CI de este repositorio no despliega, así que la
condición se cumple respetando el orden de los dos cambios al desplegar manualmente/por infraestructura,
no en el pipeline. **Qué desbloquea:** que un ticket `Equipo nuevo` en `Verificación` tenga salida real
en producción. F1A-03 es la tanda siguiente a ésta (decisión del orquestador registrada en
`proposal.md` §Riesgos). Esta condición se repite como tarea explícita del `archive-report.md` (ver
sección «Archive», más abajo) para que no se pierda al cerrar el cambio.

---

## LOTE 1 · dominio shared (intento de ledger 1, base `e8640d7`)

## Fase 1 · Registro de estados — `Verificación` en `CLASIFICACION_EN_ESPERA` (D1), mutación M11

- [x] 1.1 RED en `packages/shared/src/estados.test.ts` (D5, líneas de `44ce003`: `:15-17`, `:66-67`, `:71`): extender las
  aserciones de 21 a **22** estados; el conjunto `sin_clasificar` pasa de `['Pendiente']` a
  `['Pendiente', 'Verificación']`; añadir `enEsperaDe('Verificación') === 'sin_clasificar'` (RQ-EN-07,
  parcial — clasificación). Nace roja: hoy son 21/`['Pendiente']`.
- [x] 1.2 GREEN — `estados.ts:105`: añadir `'Verificación': 'sin_clasificar',` a continuación de
  `'Pendiente': 'sin_clasificar',`, en el mismo bloque «sin clasificar». Reescribir en línea el
  encabezado de ese bloque (`:101`, hoy «sin clasificar (1)») a «sin clasificar (2)».
- [x] 1.3 GREEN — `estados.ts:111`: reescribir en línea «Los 21 estados» → «Los 22 estados» (Caso A:
  sigue siendo cierto de `ESTADOS`, que pasa de 21 a 22 con este cambio).
- [x] 1.4 GREEN — al FINAL de `estados.ts` (tras la actual `:173`, cierre de `enEsperaDe`): añadir
  `ESTADOS_SOLO_EQUIPO_NUEVO = ['Verificación'] as const satisfies readonly Estado[]`; tipo
  `EstadoServicio = Exclude<Estado, (typeof ESTADOS_SOLO_EQUIPO_NUEVO)[number]>`; y
  `ESTADOS_SERVICIO: EstadoServicio[]` (= `ESTADOS` menos `ESTADOS_SOLO_EQUIPO_NUEVO`, mismo orden) —
  literal de `design.md` §2 D1.
- [x] 1.5 Confirmar `estados.test.ts` en verde. RQ: RQ-EN-07 (clasificación).
- [x] 1.6 **M11**: quitar `'Verificación': 'sin_clasificar',` de `1.2` (revertir sólo esa línea).
  Confirmar rojo: `tsc` falla en `ESTADOS_SOLO_EQUIPO_NUEVO satisfies readonly Estado[]` (`'Verificación'`
  deja de ser miembro de `Estado`). Revertir.

## Fase 2 · Catálogo `TRANSITIONS_EQUIPO_NUEVO` + invariantes de la unión (D1, D5) — mutaciones M3, M4, M5, M11 (confirmación cruzada); corrección (b)

- [x] 2.1 RED en `packages/shared/src/invariantesGrafo.test.ts`: (i) en línea, los invariantes 1-3
  existentes comparan contra `ESTADOS_SERVICIO` en vez de `ESTADOS` (`:5`, `:41`, `:50-53`, `:64` —
  siguen siendo «34 sobre 21» y «Finalizado único»); (ii) al FINAL, bloque nuevo de la UNIÓN:
  `derivados(TRANSITIONS ∪ TRANSITIONS_EQUIPO_NUEVO)` = `ESTADOS` (22); ids únicos en la unión; la
  unión tiene 39 entradas (34+5); sin salida en la unión = `['Finalizado', 'Verificación']`, con
  `Verificación` como excepción nombrada del invariante 1 (RQ-EN-01, RQ-TS-01); ninguna `from` de
  ningún catálogo queda fuera del registro de flujos; `ESTADOS_SOLO_EQUIPO_NUEVO` =
  `derivados(TRANSITIONS_EQUIPO_NUEVO) − derivados(TRANSITIONS)`. **Corrección (b):** cada una de las 5
  entradas del catálogo declara exactamente DOS campos (`comment()` + la casilla de derivación); ningún
  campo de negocio adicional (RQ-EN-07). Nace roja: `TRANSITIONS_EQUIPO_NUEVO` no existe.
- [x] 2.2 GREEN — al FINAL de `packages/shared/src/transitions.ts` (tras la actual `:334`, cierre de
  `areasSiguientes`): `export const TRANSITIONS_EQUIPO_NUEVO: Transition[]` con las 5 entradas de
  `design.md` §2 D1 (`ingreso_equipo_nuevo`, `producto_no_conforme`, `analisis_y_acciones`,
  `verificacion`, `liberacion`), reutilizando `comment()`/`derivacion()` ya privados del fichero, todas
  `area: 'Servicio Técnico'` (RQ-EN-02, supuesto s2).
- [x] 2.3 Confirmar verde. RQ: RQ-EN-01, RQ-EN-02, RQ-EN-07 (campos).
- [x] 2.4 **M3** (regla de mutación 2 — mutar el fichero VIGILADO): ensuciar temporalmente una entrada
  del catálogo con `from: ['Revisión']` (estado inexistente). Confirmar rojo en los invariantes 1 y 4
  de la unión. Revertir.
- [x] 2.5 **M4**: añadir temporalmente una salida desde `Verificación` (sexta entrada con
  `from: ['Verificación']`). Confirmar rojo en «ninguna sale de Verificación» y en el sin-salida de la
  unión. Revertir.
- [x] 2.6 **M5**: renombrar temporalmente el id de una entrada EN a `ingreso_a_servicio` (colisión con
  un id de servicio). Confirmar rojo en «ids únicos en la unión». Revertir.
- [x] 2.7 **M11, confirmación cruzada**: repetir la mutación de `1.6` (quitar `Verificación` de
  `CLASIFICACION_EN_ESPERA`) ahora que existe el invariante de la unión. Confirmar rojo A LA VEZ en
  `tsc` (como en `1.6`) y en el invariante 1 de la unión (`derivados(unión) ≠ ESTADOS`, 21 ≠ 22).
  Revertir.

## Fase 3 · Registro de flujos `flujos.ts` (D2) — mutaciones M6, M7; corrección (a); RQ-EN-07 tablero

- [x] 3.1 RED, fichero **nuevo** `packages/shared/src/flujos.test.ts`:
  - Normalización (M6, RQ-EN-02/RQ-EN-04): `esClasificacionEquipoNuevo('Equipo Nuevo')` (Zoho, mayúscula)
    → `true`; `esClasificacionEquipoNuevo('Equipo nuevo usado')` → `false` (igualdad, no `includes`).
  - Enrutado (RQ-EN-04): ticket EN en `Ingresado` → `flujoDelTicket` = `'equipo-nuevo'`.
  - **Corrección (a), RQ-TC-10:** ticket `clasificaciones = 'Soporte remoto'` (cualquier estado) →
    `flujoDelTicket` = `'servicio'` SIEMPRE — prueba explícita, no derivada de otra aserción.
  - Heredados (M7, RQ-EN-04, s5): ticket EN en `Rev./Diagnostico` (fuera del catálogo EN) →
    `flujoDelTicket` = `'servicio'`; `transicionesDelTicket` devuelve las de `TRANSITIONS` desde ese
    estado, no `[]`.
  - `transicionPorId` busca en TODOS los catálogos del registro; `flujoDeTransicion` devuelve el flujo
    de un id dado; `fueraDeFlujo(t, ticket)` devuelve el mensaje o `null`.
  - `areasSiguientes` con catálogo inyectado (verificar la firma nueva de `transitions.ts:327`, Fase 7).
  - **RQ-EN-07 (tablero):** `columnForStatus('Verificación') === 'otros'` (cae en `FALLBACK_COLUMN_ID`,
    `columns.ts:34`, `:45-46`).
  - Nace roja: `flujos.ts` no existe.
- [x] 3.2 GREEN — crear `packages/shared/src/flujos.ts` con la superficie de `design.md` §2 D2:
  `Flujo`, `CATALOGO_POR_FLUJO`, `esClasificacionEquipoNuevo`, `flujoDelTicket`, `catalogoDelTicket`,
  `transicionesDelTicket`, `transicionPorId`, `flujoDeTransicion`, `fueraDeFlujo`.
- [x] 3.3 GREEN — `packages/shared/src/index.ts`: `export * from './flujos'` al FINAL (tras la actual
  `:21`).
- [x] 3.4 Confirmar verde. RQ: RQ-EN-02, RQ-EN-03, RQ-EN-04, RQ-EN-07, RQ-TC-10.
- [x] 3.5 **M6**: cambiar la normalización a igualdad estricta sin `trim`/colapso de espacios/minúsculas.
  Confirmar rojo en el caso `'Equipo Nuevo'` (Zoho). Revertir.
- [x] 3.6 **M7**: quitar la condición «estado pertenece al catálogo EN» de `flujoDelTicket` (dejar sólo
  la clasificación). Confirmar rojo: el ticket heredado en `Rev./Diagnostico` pasaría a `'equipo-nuevo'`
  y vería `[]` transiciones en vez de las de servicio (varado, viola s5). Revertir.

## Fase 4 · `EstadoServicio`/`ESTADOS_SERVICIO` en fases y mapa (D1, consecuencia) — mutación M12; corrección (f) parte 1

- [x] 4.1 Confirmar la regresión natural que trae la Fase 1: `tsc` falla en `fasesBlueprint.ts:68`
  (`FASE_POR_ESTADO … satisfies Record<Estado, FaseId>`, falta la clave `'Verificación'`) y
  `fasesBlueprint.test.ts:14` se pone roja (`Object.keys(FASE_POR_ESTADO)` = 21 claves ≠ `[...ESTADOS]`
  = 22). Esto ES el RED de esta fase — no hace falta otra mutación.
- [x] 4.2 GREEN — `fasesBlueprint.ts:11`: `import type { EstadoServicio } from './estados'` (sustituye
  a `Estado`). `:68`: `} satisfies Record<EstadoServicio, FaseId>`.
- [x] 4.3 **Corrección (f), parte 1** — GREEN en línea, `fasesBlueprint.ts:29`: reescribir el comentario
  que dice «`satisfies Record<Estado, FaseId>`» para que nombre `Record<EstadoServicio, FaseId>`, que
  es lo que la declaración dice literalmente tras `4.2` (mismo número de líneas).
- [x] 4.4 GREEN — `fasesBlueprint.test.ts:3`: el import gana `ESTADOS_SERVICIO` (junto a
  `ESTADOS_SIN_SALIDA`; comprobar si `ESTADOS` sigue haciendo falta en este fichero antes de retirarlo
  del import). `:14`: `[...ESTADOS_SERVICIO].sort()` en vez de `[...ESTADOS].sort()`.
- [x] 4.5 GREEN — `mapaBlueprint.test.ts:5`: el import gana `ESTADOS_SERVICIO`. `:17` (`entradaReal()`,
  campo `estados`) y `:113` pasan a `ESTADOS_SERVICIO`.
- [x] 4.6 GREEN — `scripts/generar-mapa-blueprint.ts:18`/`:31`: `ESTADOS_SERVICIO` en vez de `ESTADOS`.
- [x] 4.7 Confirmar `tsc` y las suites de `fasesBlueprint`/`mapaBlueprint` en verde. RQ: protege
  RQ-MB-06 (anti-desfase, sin regenerar artefactos — el orden y el conteo de `ESTADOS_SERVICIO`
  coinciden con los 21 de antes).
- [x] 4.8 **M12**: dejar `'Verificación'` DENTRO de `ESTADOS_SERVICIO` (no excluirlo al construir el
  array de la Fase 1.4). Confirmar rojo: `tsc` falla en `fasesBlueprint.ts:68` (clave de más) o el
  anti-desfase RQ-MB-06 se pone rojo (el mapa generado incluiría `Verificación` en el Blueprint de
  servicio). Revertir.

## Fase 5 · Cierre de calidad e intento del Lote 1

- [x] 5.1 `npm test` en verde; registrar el recuento (pasadas/ficheros) en `apply-progress.md`.
- [x] 5.2 `npm run typecheck` en verde.
- [x] 5.3 `npm run lint` en verde; confirmar 0 warnings nuevos sobre la base preexistente.
- [x] 5.4 `npm run build` en verde.
- [x] 5.5 `git add -N packages/shared/src/flujos.ts packages/shared/src/flujos.test.ts` (únicos
  ficheros nuevos del Lote 1, medida E-078 de `docs/sdd/ENTRADA.md`), y cualquier otro fichero nuevo sin
  trackear que resulte de las Fases 1-4.
- [x] 5.6 Medir `git diff --shortstat --no-renames e8640d7` con lo anterior ya indexado (`-N`).
  Registrar el número en `apply-progress.md` y contrastarlo contra la estimación de ~615.
- [ ] 5.7 Commit del Lote 1 — hecho por el orquestador.

---

## LOTE 2 · servidor, guardianes y cliente (intento de ledger 2, base = commit de cierre del Lote 1)

## Fase 6 · Guarda 3 en `executeTransition` (D3, cambio del orquestador sobre el diseño) — mutaciones M1, M2

- [x] 6.1 RED, fichero **nuevo** `apps/desk/server/flujoEquipoNuevo.test.ts` (arnés `appHarness.ts`,
  patrón de `remisiones.test.ts:1-5`):
  - P1: ticket EN en `Ingresado`, ejecuta `ingreso_equipo_nuevo` → `200`, pasa a `En Proceso`.
  - P2: el mismo ticket intenta `ingreso_a_servicio` (catálogo de servicio, mismo origen) → `409` con
    mensaje que nombra los dos flujos (RQ-EN-05, escenario 1).
  - P3 (posición, regla de mutación 1): ticket de SERVICIO en `Rev./Diagnostico` (estado ausente del
    catálogo EN) ejecuta `Ingreso equipo nuevo` (`from: [Ingresado]`, catálogo EN) → `409` con el
    mensaje de FLUJO, NO «no aplica desde el estado» (RQ-EN-05 escenario 2, RQ-TS-06 escenario).
  - P4 (RQ-EN-03): ticket EN en `Ticket creado` ejecuta `habilitar_servicio` (compartido) → pasa a
    `Ingresado`, igual que las otras dos clasificaciones.
  - P5 (RQ-EN-04, s5, heredado): ticket EN en `Rev./Diagnostico` sigue viendo/ejecutando las
    transiciones de `TRANSITIONS` desde ese estado (p. ej. `servicio_externo_pendiente`), sin `409`.
  - P6 (RQ-EN-02): usuario de área `Comercial` ejecuta cualquiera de las 5 EN → `403`.
  - Nace roja: `transitionById` sólo busca en `TRANSITIONS`, no existe guarda de flujo.
- [x] 6.2 GREEN — `apps/desk/server/services/ticketService.ts:6`: sustituir `transitionById` por
  `transicionPorId, fueraDeFlujo, catalogoDelTicket` en el import de `@ambientalia/shared`.
- [x] 6.3 GREEN — `:122`: `const t = transicionPorId(String(b.transitionId))`.
- [x] 6.4 GREEN — al FINAL de `ticketService.ts` (tras la actual `:223`, cierre de `executeTransition`):
  añadir la función local `exigirMismoFlujo(t, row)` que llama a `fueraDeFlujo(t, row)` y, si devuelve
  mensaje, lanza `HttpError(409, { error: motivo })` (cambio del orquestador sobre D3 — legibilidad, sin
  desplazar citas; tipos exactos de la fila contra `packages/zoho-sync/src/db/rows.ts:23` durante el
  apply).
- [x] 6.5 GREEN — `:125`: sustituir la sentencia única del `404` por DOS sentencias cortas en la MISMA
  línea: `if (!current) throw new HttpError(404, { error: 'Ticket no encontrado' }); exigirMismoFlujo(t, current.row)`.
  **Cero líneas nuevas**: `:126-128` (estado) y `:129-131` (permiso) no se desplazan.
- [x] 6.6 Confirmar P1-P6 en verde A LA VEZ (verificación cruzada, regla de mutación 1). RQ: RQ-EN-02,
  RQ-EN-03, RQ-EN-04, RQ-EN-05, RQ-TS-06 (guarda 3 y su posición).
- [x] 6.7 **M1** (posición): mover la llamada a `exigirMismoFlujo` DESPUÉS del bloque de estado
  (`:126-128`). Confirmar rojo: P3 pasa a responder «no aplica desde el estado» en vez del mensaje de
  flujo. Revertir.
- [x] 6.8 **M2**: quitar la llamada a `exigirMismoFlujo` de `:125`. Confirmar rojo: P2 (equipo nuevo +
  `ingreso_a_servicio`) responde `200` en vez de `409`. Revertir.

## Fase 7 · Avisos por área desde el catálogo del flujo (D4) — mutación M13; corrección (e)

- [x] 7.1 RED en `apps/desk/server/services/avisoArea.test.ts`: ticket EN en `Notificado`, tras ejecutar
  `Análisis y acciones` (catálogo EN, `from: Notificado`, `to: Ingresado`) → `areasAAvisar`/
  `areasSiguientes` calculado sobre el catálogo EN, no sobre `TRANSITIONS` (RQ-AV-04). Añadir un caso
  con catálogo SINTÉTICO cuyas áreas difieran de las de servicio, para que M13 (7.6) sea detectable.
  Nace roja: `areasSiguientes` hoy sólo recorre `TRANSITIONS`.
- [x] 7.2 GREEN — `packages/shared/src/transitions.ts:327`: `areasSiguientes(estado: string, transiciones: Transition[] = TRANSITIONS): string[]`
  (segundo parámetro con valor por defecto, en línea; `:329-334` recorre `transiciones`).
- [x] 7.3 GREEN — `apps/desk/server/services/avisoArea.ts:1`: importar `catalogoDelTicket` de
  `@ambientalia/shared`. `:15`/`:16`: `areasAAvisar` gana tercer parámetro opcional `catalogo?: Transition[]`
  que pasa a `areasSiguientes(estado, catalogo)`.
- [x] 7.4 GREEN — `apps/desk/server/services/ticketService.ts:196`:
  `const areasAvisar = areasAAvisar(t.to, user.areas, catalogoDelTicket({ classification: current.row.classification, status: t.to }))`.
  **Corrección (e), RQ-AV-04:** el flujo se evalúa con el ESTADO DE LLEGADA (`t.to`), ya documentado en
  `design.md` §2 D4 (líneas 135-136 de ese fichero); repetir esta misma anotación al comprobar RQ-AV-04
  en `verify-report.md`.
- [x] 7.5 Confirmar verde. RQ: RQ-AV-04 (delta `derivacion-avisos`), RQ-EN-06.
- [x] 7.6 **M13 — declarada NO detectable con datos reales.** Quitar el tercer parámetro de la llamada
  de `:196`. Por s2 las cinco áreas EN son `Servicio Técnico` y coinciden con las salidas de servicio de
  los cuatro estados homónimos, así que con datos reales el resultado NO cambia y la prueba no se pone
  roja. Lo cubre la prueba UNITARIA de `areasAAvisar` con catálogo sintético de `7.1` (esa sí se pone
  roja); el cableado real de `:196` se comprueba LEYENDO, en `sdd-verify`, no por una prueba automática.
  Revertir tras dejar constancia en `apply-progress.md`.

## Fase 8 · SLA de `Notificado` excluye el flujo `equipo-nuevo` (D4) — mutación M8

- [x] 8.1 RED en `apps/desk/server/db/sla.test.ts`: ticket `classification = 'Equipo nuevo'`,
  `status = 'Notificado'`, última entrada a ese estado hace más de 24 h → `ticketsConSlaVencido` NO lo
  incluye (RQ-TS-15, RQ-EN-06). Nace roja: hoy el filtro es sólo por `status`.
- [x] 8.2 GREEN — `apps/desk/server/db/sla.ts:2`: importar `flujoDelTicket` de `@ambientalia/shared`.
- [x] 8.3 GREEN — `:45`: `SELECT id, number, status, classification FROM tickets WHERE status IN (...)`.
- [x] 8.4 GREEN — `:48`: el tipo del array de filas gana `classification: string | null`.
- [x] 8.5 GREEN — `:49`, antes de `const estado = fila.status as Estado`: insertar
  `if (flujoDelTicket({ classification: fila.classification, status: fila.status }) !== 'servicio') continue`.
- [x] 8.6 Confirmar verde. RQ: RQ-TS-15 (delta `transitions-st`), RQ-EN-06.
- [x] 8.7 **M8**: quitar el `continue` de `8.5`. Confirmar rojo: el ticket EN en `Notificado` >24 h
  vuelve a aparecer en `ticketsConSlaVencido`. Revertir.

## Fase 9 · Panel de transiciones filtra por flujo (D4, `.tsx`) — mutación M14

Sin RED/GREEN automático: `TransitionPanel.tsx`/`TicketDetailView.tsx` son `.tsx` y quedan fuera de la
red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`). Verificado por
`npm run typecheck` y comprobación de persona (sección aparte, más abajo).

- [x] 9.1 `apps/desk/src/components/TransitionPanel.tsx:2`: importar `transicionesDelTicket` de
  `@ambientalia/shared`, junto a lo ya importado.
- [x] 9.2 `:38`/`:40`: el componente gana la prop `clasificacion: string | null` en su firma.
- [x] 9.3 `:56`: `const transitions = transicionesDelTicket({ classification: clasificacion, status }).filter(...)`
  (conserva el filtro de área ya existente).
- [x] 9.4 `apps/desk/src/components/TicketDetailView.tsx:324`: pasar `clasificacion={ticket.classification}`
  al `<TransitionPanel>`.
- [x] 9.5 `npm run typecheck` en verde para estos dos ficheros. RQ: RQ-EN-06 (espejo legítimo, regla
  invariable 13 punto 3 — impuesto y probado por la guarda 3 del servidor, Fase 6).
- [x] 9.6 **M14 — declarada NO detectable.** Volver a `transitionsForStatus(status)` sin filtrar por
  flujo, en `:56`. Ninguna prueba automática lo detecta (`.tsx` fuera de `vitest.config.ts:17-20`,
  F0-00). Lo cubre la guarda 3 del servidor (Fase 6): el botón equivocado se vería en pantalla, pero al
  pulsarlo el servidor responde `409`. Cubierto por comprobación de persona (ver sección aparte) y por
  lectura en `sdd-verify`. Revertir tras dejar constancia en `apply-progress.md`.

## Fase 10 · Guardianes extendidos: reentrancia, escalado, ejecución, permisos (D5) — mutaciones M9, M10; corrección (c)

- [x] 10.1 RED en `packages/shared/src/reentrancia.test.ts` (al final): `tablaDeReentrancia(TRANSITIONS_EQUIPO_NUEVO)`
  produce un ciclo `{Ingresado, En Proceso, Notificado}`; `camposFechaReentrantes(TRANSITIONS_EQUIPO_NUEVO)` = `[]`.
- [x] 10.2 GREEN: confirmar que `tablaDeReentrancia`/`camposFechaReentrantes` (ya genéricas sobre
  cualquier `Transition[]`) no necesitan cambio de producción — sólo el fichero de prueba. Confirmar
  verde.
- [x] 10.3 RED en `packages/shared/src/sla.test.ts` (al final): ningún ambiguo de escalado en NINGÚN
  catálogo del registro de flujos (extender el guardián existente más allá de `TRANSITIONS`).
- [x] 10.4 GREEN: extender el guardián de escalado para iterar sobre los catálogos del registro de
  flujos. Confirmar verde.
- [x] 10.5 RED en `apps/desk/server/transicionesEjecucion.test.ts` (al final): `CASOS_EQUIPO_NUEVO`
  escrita a mano (5 casos), huérfanas en los dos sentidos, extremos contra el grafo EN, barrido HTTP de
  las 5 con `classification = 'Equipo nuevo'`.
  **Corrección (c), OBLIGATORIA antes de escribir estos casos:** cada ticket sembrado en el arnés
  (`appHarness.ts`) para este barrido **DEBE** llevar `classification: 'Equipo nuevo'` explícito y
  colocarse en `t.from[0]` de su transición EN — si no, la guarda 3 (Fase 6) responde `409` de flujo
  ANTES de llegar al `200`/`400` que este barrido comprueba, y la prueba estaría comprobando la guarda 3
  en vez de la ejecución (mismo riesgo que ya advierte el comentario de `permisos.test.ts:29-33` sobre
  el estado de origen).
- [x] 10.6 GREEN: extender `transicionesEjecucion.test.ts` con `CASOS_EQUIPO_NUEVO`. Confirmar verde.
  RQ: RQ-EN-01, RQ-EN-05.
- [x] 10.7 RED en `apps/desk/server/permisos.test.ts` (al final): matriz 5×3 de `Equipo nuevo` — 10
  casos prohibidos, 5 permitidos, escrita a mano (admin pasa las 5). **Misma corrección (c):** los 5
  tickets de la matriz se siembran con `classification: 'Equipo nuevo'` y cada uno en `t.from[0]` de su
  transición (mismo criterio que la matriz de servicio existente, `permisos.test.ts:24-27`), para que la
  respuesta observada sea el `403`/`200` de PERMISO y no el `409` de flujo ni el `409` de estado.
- [x] 10.8 GREEN: añadir la matriz al final de `permisos.test.ts`. Confirmar verde. RQ: RQ-EN-02.
- [x] 10.9 **M9**: cambiar temporalmente `liberacion` a área `Comercial` en `TRANSITIONS_EQUIPO_NUEVO`.
  Confirmar rojo: el total escrito a mano de la matriz EN (10 prohibidos/5 permitidos) cambia —
  Comercial pasa a poder ejecutarla y Servicio Técnico deja de poder. Revertir.
- [x] 10.10 **M10**: en `flujos.ts`, mutar temporalmente `transicionPorId` para que busque SÓLO en
  `TRANSITIONS` (ignorando el catálogo EN). Confirmar rojo: el barrido HTTP de las 5 EN de
  `transicionesEjecucion.test.ts` responde `400` («Transición desconocida») en vez de `200`. Revertir.

## Fase 11 · Comentarios de previsión, en su sitio (D5)

Reescribir EN SU SITIO (mismo número de líneas cada vez, sin desplazar nada — son las 17 líneas en 9
ficheros que `design.md` §2 D5 identifica prediciendo «F1B-06 entra en `TRANSITIONS`»):

- [x] 11.1 `invariantesGrafo.test.ts:11-12`, `:73-74`: de «F1B-06 entra en `TRANSITIONS`» a «F1B-06
  añade catálogos al registro de flujos; la red cubre la unión».
- [x] 11.2 `reentrancia.test.ts:16`, `:24`; `sla.test.ts:166`; `transicionesEjecucion.test.ts:193`;
  `permisos.test.ts:25`: de «dos grafos» (previsión) a «cualquier catálogo del registro».
- [x] 11.3 `transicionesEjecucion.test.ts:135-136`: de «la transición 35» a «una transición nueva de
  cualquier catálogo».
- [x] 11.4 `reentrancia.ts:5`, `:91`, `:142`; `sla.ts:83` (shared); `bodegaje.ts:218`;
  `apps/desk/server/testing/appHarness.ts:62`: de «dos grafos» (previsión) a «catálogos del registro de
  flujos (`flujos.ts`)».
- [x] 11.5 Confirmar `npm test` sigue en verde (edición de comentarios, cero cambio de comportamiento).

## Fase 12 · Corrección (f), parte 2 — `permisos.test.ts:29-33` y su cita caducada

- [x] 12.1 Editar EN LÍNEA (mismo número de líneas) `apps/desk/server/permisos.test.ts:29-33`: «dos
  guardas por delante» → «tres guardas por delante», enumerando las tres: `404` (ticket no existe),
  `409` de flujo (Fase 6, RQ-EN-05, nueva desde este cambio) y `409` de estado.
- [x] 12.2 En el mismo bloque, corregir la cita caducada `ticketService.ts:89` a `ticketService.ts:130`
  (línea real del `403` hoy). Regla de mutación 4, Caso A: el `403` NO se desplaza por este cambio
  (`design.md` D3 confirma «0 líneas desplazadas»); la cita a `:89` ya estaba rota ANTES de este cambio
  y se corrige de paso, al tocar el mismo comentario por `12.1`.
- [x] 12.3 Confirmar `npm test` sigue verde.

## Fase 13 · Cierre de calidad e intento del Lote 2

- [x] 13.1 `npm test` en verde; registrar el recuento (pasadas/ficheros) en `apply-progress.md`.
- [x] 13.2 `npm run typecheck` en verde.
- [x] 13.3 `npm run lint` en verde; confirmar 0 warnings nuevos sobre la base preexistente.
- [x] 13.4 `npm run build` en verde.
- [x] 13.5 `git add -N apps/desk/server/flujoEquipoNuevo.test.ts` (único fichero nuevo del Lote 2), y
  cualquier otro fichero nuevo sin trackear que resulte de las Fases 6-12.
- [x] 13.6 Medir `git diff --shortstat --no-renames <commit de cierre del Lote 1>` con lo anterior ya
  indexado (`-N`). Registrar el número en `apply-progress.md` y contrastarlo contra la estimación de
  ~480.
- [ ] 13.7 Commit del Lote 2 — hecho por el orquestador.

---

## Fase 14 · Barrido de citas (regla de mutación 4, OBLIGATORIO) — sobre los dos lotes

- [x] 14.1 `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio (fuera de `archive/`).
  Comprobar los dos extremos de cada rango por separado contra el árbol final. Predicción de
  `design.md`: **0 desplazadas** (todo lo nuevo va al final, tras `:334`, o en línea en `:327`).
- [x] 14.2 `grep -rnoE "estados\.ts:[0-9]+(-[0-9]+)?"` — comprobar los dos extremos. Predicción: 0
  desplazadas (todo en línea o al final, tras `:173`).
- [x] 14.3 `grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"` — comprobar los dos extremos. Predicción: 0
  desplazadas (`:125` gana una sentencia en la misma línea; `exigirMismoFlujo` se añade al final, tras
  la actual `:223`).
- [x] 14.4 Releer sin buscar desplazamiento (el contenido cambia, la línea no — Caso A a confirmar):
  `ticketService.ts:125` (`contratoErrores.test.ts:18`; `transitions-st/spec.md:33`, `:975`;
  `derivacion-avisos/spec.md:212`), `transitions.ts:327-334`, `estados.ts:101-105`/`:111`,
  `TransitionPanel.tsx:56-58`, `db/sla.ts:40-45`.
- [x] 14.5 `grep -rni "21 estados"` fuera de `archive/`: clasificar cada resultado. Las que hablan de
  TODOS los estados del Blueprint (`ESTADOS`) pasan a **22** (Caso A si no citan revisión, Caso B si
  citan una fechada); las que hablan de la partición de FASES (`FASE_POR_ESTADO`/`ESTADOS_SERVICIO`)
  siguen en **21**, Caso A, sin tocar.
- [x] 14.6 Segundo pase por la forma ABREVIADA (sin nombre de fichero) en los ficheros que ya citan
  `transitions.ts`, `estados.ts` y `ticketService.ts`: `CLAUDE.md`, specs archivadas. **NO editar
  `openspec/config.yaml`** (decisiones de Gerencia): si una cita suya queda afectada, anotarlo en
  `apply-progress.md` para que el orquestador decida.
- [x] 14.7 Confirmar el resultado de `14.5`/`14.6` contra `openspec/config.yaml`: sólo LECTURA.
- [ ] 14.8 `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` tras el commit del Lote 2 —
  **lo ejecuta el orquestador**, no esta fase.

## Archive (no es de `sdd-apply` — registrado, no ejecutado aquí)

- Copiar entera `openspec/changes/blueprint-equipo-nuevo/specs/transitions-equipo-nuevo/spec.md` a
  `openspec/specs/transitions-equipo-nuevo/spec.md` (capacidad nueva).
- Fusionar por ID los deltas `MODIFIED`, sustituyendo el bloque ENTERO de cada requisito vigente:
  RQ-TC-10 (`tickets-core`), RQ-TS-06 (`transitions-st`, orden de guardas 8→9 filas), RQ-TS-15
  (`transitions-st`, filtro de flujo en el SLA), RQ-AV-04 (`derivacion-avisos`, catálogo del flujo).
- `tickets-core` §4.3: reescribir por TÍTULO DE SECCIÓN («Dos ramas de `Clasificaciones` sin grafo ·
  destino F1B-06» pasa a describir sólo `Soporte remoto`, con la disciplina «Previously» — no se borra).
- **Repetir como tarea explícita del `archive-report.md`**: «Este cambio no se despliega a producción
  sin F1A-03» (ver sección «Condición de despliegue», arriba) — el archive-report deja constancia de que
  el estado `Verificación` queda sin salida hasta esa tanda siguiente.
- Pruebas de interfaz (`jsdom`) para `TransitionPanel.tsx`/`TicketDetailView.tsx` — no se propone, por
  F0-00.
- Las tres preguntas abiertas de `proposal.md` (F1A-03 adelantado, área de `Liberación`, heredados) — se
  quedan abiertas, son reversibles.

## Comprobaciones de persona (regla del ciclo 1 — NO son casillas contables)

M14 (Fase 9) sólo se puede comprobar en el DOM de `TransitionPanel.tsx`/`TicketDetailView.tsx`, fuera
de la red de pruebas (F0-00). **No se cuentan en el recuento de tareas y archivar este cambio NO las da
por hechas.**

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | Un ticket `Equipo nuevo` en `Ingresado` sólo ve el botón «Ingreso equipo nuevo» en el panel | Servicio Técnico, en la app | `specs/transitions-equipo-nuevo/spec.md` (RQ-EN-06, tras fusión) |
| Persona-2 | Un ticket `Equipo nuevo` en `Verificación` aparece en la columna «Otros» del tablero, sin columna propia | Servicio Técnico, en la app | ídem (RQ-EN-07) |
| Persona-3 | El mensaje del `409` de la guarda 3 (Fase 6) se entiende sin explicación adicional (nombra los dos flujos) | Servicio Técnico, en la app | `specs/transitions-equipo-nuevo/spec.md` (RQ-EN-05, tras fusión) |

## Riesgos de dependencia entre fases

- Fase 1 (estados) y Fase 3 (flujos.ts, salvo el import de `ESTADOS_SERVICIO` que no usa) son
  parcialmente independientes; Fase 2 (catálogo + invariantes de la unión) depende de la Fase 1
  (necesita `ESTADOS` en 22 para que el invariante de la unión tenga sentido).
- Fase 3 (`flujos.ts`) depende de la Fase 2 (importa `TRANSITIONS_EQUIPO_NUEVO`).
- Fase 4 (`EstadoServicio`) depende de la Fase 1 (necesita `ESTADOS_SERVICIO`/`EstadoServicio`
  declarados) — su RED es una regresión natural de la Fase 1, no una mutación aparte.
- El Lote 2 completo depende de que el Lote 1 esté commiteado: `flujos.ts` (Fase 3) es import directo de
  `ticketService.ts` (Fase 6), `transitions.ts` (Fase 7) y `db/sla.ts` (Fase 8).
- Fase 6 (guarda 3) depende de la Fase 3 (`transicionPorId`, `fueraDeFlujo`, `catalogoDelTicket`).
- Fase 7 (avisos) depende de la Fase 6 (usa `current.row.classification`, ya cargado por la guarda) y de
  la Fase 3 (`catalogoDelTicket`).
- Fase 8 (SLA) depende de la Fase 3 (`flujoDelTicket`) pero NO de la Fase 6 ni de la Fase 7.
- Fase 9 (`.tsx`) depende de la Fase 3 (`transicionesDelTicket`) y de que la Fase 6 esté terminada para
  que M14 (9.6) tenga sentido como «declarada no detectable, cubierta por el servidor».
- Fase 10 (guardianes) depende de las Fases 2, 3 y 6 (necesita el catálogo EN, el registro de flujos y
  la guarda 3 ya funcionando, para que los barridos HTTP sembrados con `classification = 'Equipo nuevo'`
  lleguen a comprobar lo que dicen comprobar — corrección (c)).
- Fase 11 (comentarios de previsión) y Fase 12 (corrección f, parte 2) no tienen dependencia de código;
  pueden hacerse en cualquier momento tras la Fase 6 (Fase 12 cita la guarda 3).
- Fases 6.7-6.8 (mutaciones de posición) dependen de que `6.6` esté en verde — mutar antes de tiempo no
  prueba nada (regla de mutación 1).
- Fase 14 depende de TODAS las anteriores de los dos lotes — es la única forma de saber si los
  desplazamientos reales coinciden con lo que predijo `design.md` (predicción: 0 en los tres ficheros
  más citados).
