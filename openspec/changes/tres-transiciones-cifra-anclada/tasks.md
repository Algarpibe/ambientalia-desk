# Tareas: tres transiciones menos y la cifra anclada a 31 (F1C-09)

Rutas y líneas: `design.md` (D1–D9) y `exploration.md`. Todo se hace **sustituyendo líneas en su sitio**, nunca
insertando ni borrando en `transitions.ts`, `estados.ts` ni `fasesBlueprint.ts`. Cada rojo se corre y se anota en
`apply-progress.md` ANTES de tocar producción. Comandos desde el worktree
`C:\dev\Desk_2_R1.023-worktrees\tres-transiciones-cifra-anclada`.

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas (diseño, no medidas) | Lote A ~480 · Lote B ~295 · total ~775 en dos intentos |
| Techo / válvula | 800 por intento / 720 |
| Medida real | `git diff --shortstat --no-renames` contra el commit de partida + `wc -l` de lo nuevo sin trackear; se mide al cerrar cada lote. **No se pudo medir en esta fase** (sin shell): las cifras son las del diseño |
| Riesgo contra el techo | Bajo en B; Medio en A (válvula 720; si la pasa se parte: guardianes de `packages/shared` / `apps/desk/server` + `config.yaml`; nunca código sin sus guardianes) |
| Binarios | ninguno |
| Estrategia de entrega | ask-on-risk; dos lotes dentro del techo, sin PRs encadenados |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

(El presupuesto vigente es 800, no 400. «Medium» se refiere a la válvula de 720 del lote A. Una cadena de PRs no
aplica: se commitea a `main` por lote, regla del repositorio.)

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| A | Catálogo, registro, fases, guardianes, mapa, `config.yaml`, `cifrasAncladas.test.ts` | `npx vitest run packages/shared apps/desk/server` | `npm run generar-mapa-blueprint` + anti-desfase | revert del commit A (código y guardianes juntos) |
| B | Script SQL + prueba pg-mem + barrido de citas | `npx vitest run packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts` | detector `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | revert del commit B; el script nunca se ejecutó |

## Lote A (apply 1)

### Fase 1 · ROJO (todo antes de `transitions.ts`)

- [ ] 1.1 Crear `packages/shared/src/cifrasAncladas.test.ts` (D5): lee `openspec/config.yaml` (molde `mapaBlueprint.test.ts:156`); exige `transiciones` = 31 = `TRANSITIONS.length`, `estados` = 20 = `ESTADOS_SERVICIO.length`, `pasos_del_mapa` = 35 = aristas del completo. Rojo natural: config dice 34/21/38.
- [ ] 1.2 `invariantesGrafo.test.ts`: `:45`, `:50-53` 34/21→31/20; `:117`; `:172-174` 44→41; `:237` `['Solicitud Soporte','Pendiente']`; citas `:16-18` caso A. Añadir ids retiradas ausentes y `diagnostico_complementario.from=['En Proceso']`. Rojo: invariantes 1 y 2.
- [ ] 1.3 `estados.test.ts`: `:225-228` 21→20 (filtro excluye `Pendiente`); `:232-233` lista SR de dos. Rojo: recuentos.
- [ ] 1.4 `mapaBlueprint.test.ts`: `:46`, `:52` 38→35; `:65-70` D-1 usa `'Continuación del proceso'`; `:111` 20. Añadir: ninguna arista toca `Pendiente`. Rojo: 38≠35.
- [ ] 1.5 `fasesBlueprint.test.ts`: `:8`, `:17`, `:20` 4·11·5; `:28-30` invertido. Rojo.
- [ ] 1.6 `reentrancia.test.ts` (`:29`, `:31`, `:54`, `:57`), `prioridad.test.ts` (`:92`, `:104-105`, `:118-119`), `cargos.test.ts` (`:112`, `:204-205` 1.850→1.700), `fechasDerivadas.test.ts:82` (28). Rojo en recuentos.
- [ ] 1.7 `transitionsSoporteRemoto.test.ts` (`:57-58` 41; `:61-66` a `diagnostico_complementario`) y `flujos.test.ts:186-196` (D9). Añadir caso: las tres ids retiradas → 400 «Transición desconocida». Rojo: id aún existe.
- [ ] 1.8 `permisos.test.ts` (`:26-27`, `:43`, `:72-90`, `:338`, `:349-353`, `:368` 744, `:371`) → 93 = 54/39 y 55/38; `cargoPermiso.test.ts:250`, `:266` → 93. Rojo.
- [ ] 1.9 `transicionesEjecucion.test.ts` (`:165`, `:175-176` a comentario de una línea, `:182` `['En Proceso']`, cifras 31/33) y `flujoSoporteRemoto.test.ts` (`:73-76` P5, `:112` 41). Rojo.
- [ ] 1.10 Correr `npm test`; anotar en `apply-progress.md` qué da rojo y por qué es el rojo esperado (cada archivo de 1.1–1.9). Un guardián que ya salga verde es falso verde: investigarlo.

### Fase 2 · VERDE

- [ ] 2.1 `transitions.ts` (D1): `:206-207`, `:230-231`, `:232-233` → 2 comentarios no vacíos y sin cita `ruta:línea` cada uno; `:244` `from:['En Proceso']`; comentarios `:67`, `:167`, `:269`, `:272`, `:289-290`, `:293`, `:386` (caso C).
- [ ] 2.2 `estados.ts`: `:102-104` reescritas (3 líneas); `:182` `['Solicitud Soporte', 'Pendiente']` en la misma línea; `:187` «20 desde F1C-09».
- [ ] 2.3 `fasesBlueprint.ts`: `:57` → comentario; `:29`, `:35`, `:39-40` en su sitio. `mapaBlueprint.ts:63` `e20`, `:139` 20/35. `reentrancia.ts:141` 20 nodos.
- [ ] 2.4 `npm run generar-mapa-blueprint`; revisar que el diff sólo quita líneas de `e21` y mueve una arista a `e15 --> e16` (D4); no editar los `.md` a mano.
- [ ] 2.5 `openspec/config.yaml`: `:1360-1370` (35, 31, `codigo`, `divergencia`), `:1371-1375` (20, `ESTADOS_SERVICIO`), `:1344-1345`, `:1355-1359` (caso B + frase de F1C-09), `:110`.
- [ ] 2.6 `npm test` y `npm run typecheck` en verde. Sin REFACTOR previsto: sólo datos y comentarios.

### Fase 3 · Mutaciones del lote A (cada una se revierte y se anota)

- [ ] 3.1 Reponer `marcar_pendiente` en `transitions.ts:206-207` → rojo: invariantes 1 y 2, huérfanas de `transicionesEjecucion`, caso 400.
- [ ] 3.2 `diagnostico_complementario.from` vuelve a `['Pendiente']` → rojo: invariante 1 y `CASOS` contra el grafo.
- [ ] 3.3 Regla 2: quitar `'Pendiente'` de `estados.ts:182` → rojo: `tsc` en `fasesBlueprint.ts:68`, invariante 1, `estados.test.ts`.
- [ ] 3.4 Regla 2: ensuciar `cifras_ancladas` en `config.yaml` (`maestro: "34"`, `"38"`, `"21"`, una por una) → rojo en `cifrasAncladas.test.ts`.
- [ ] 3.5 Regla 2: reponer `e15 --> e21 : Marcar como pendiente [ST]` en `docs/artefactos/blueprint-completo.md` → rojo anti-desfase; y reponer la clave `Pendiente` en `fasesBlueprint.ts` → rojo `tsc`.
- [ ] 3.6 Regla 1: no hay guarda del servidor que cambie de sitio; confirmar que P6 (`flujoSoporteRemoto.test.ts:82-90`) sigue fijando flujo→estado y que quitar la guarda de flujo con P5 reapuntado da 200 y rojo. Anotarlo.

### Fase 4 · Cierre del lote A

- [ ] 4.1 `npm test`, `npm run typecheck`, `npm run lint` (techo 165 avisos, sin subir).
- [ ] 4.2 Medir líneas (`--shortstat --no-renames` + `wc -l`); si >720, partir según el forecast. Crear `apply-progress.md` (rojos, mutaciones, medida, anotar `blueprintserviciotecnico.html:765`, `:770-771` fuera de alcance).

## Lote B (apply 2)

### Fase 5 · ROJO

- [ ] 5.1 Crear `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts`: fixture derivado de `schema.sql` (`:20-43`, `:57-61`) calificando `desk.` (D8); cinco tickets (servicio-app con traza previa; servicio-app `classification` NULL; servicio-Zoho; SR en Pendiente; control En Proceso).
- [ ] 5.2 Casos: (a) desenlace por grupo y una fila marcador por movido, traza previa intacta; (b) segunda ejecución sin cambios; (c) reversión quitando `-- REV ` restaura; (d) estático: toda tabla tras `FROM|INTO|UPDATE|JOIN` calificada; (e) recuento previo no escribe y lista número de los gobernados por Zoho; (f) atomicidad por lectura estática (`BEGIN`/`COMMIT`). Rojo: el script no existe. Si pg-mem no admite `BEGIN`, `CASE` o `GROUP BY 1`, ejecutar por sentencias y anotar la decisión.

### Fase 6 · VERDE

- [ ] 6.1 Crear `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` según D6/D7 y el SQL del diseño: cabecera de `Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:1-27` («lo ejecuta Alfonso; NO ejecutado»), recuento previo, `BEGIN`, INSERT **antes** del UPDATE, sin `status_type` ni `managed_by_app`, REVERSIÓN con prefijo `-- REV `. Sin metacomandos de psql.
- [ ] 6.2 `npx vitest run packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts` en verde.

### Fase 7 · Mutaciones del lote B

- [ ] 7.1 Regla 2: quitar `managed_by_app` del filtro del `.sql` → rojo caso (a); escribir `UPDATE tickets` sin calificar → rojo caso (d).
- [ ] 7.2 Regla 1: UPDATE antes del INSERT en el `.sql` → rojo caso (a) (faltan filas marcador).

### Fase 8 · Comentarios «34» fuera de guardianes

- [ ] 8.1 Presentes → caso A (31/20/35); fechados → caso B (se quedan, p. ej. `estados.ts:3-4`, `transitions.ts:368`), según `exploration.md` §3, último párrafo.

### Fase 9 · Barrido de citas (regla de mutación 4)

- [ ] 9.1 Pase 1, forma completa: `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` para `transitions.ts`, `estados.ts`, `fasesBlueprint.ts`, `mapaBlueprint.ts`, `reentrancia.ts`, `invariantesGrafo.test.ts`, `transicionesEjecucion.test.ts`, `permisos.test.ts`; quedarse con rangos que tocan las líneas sustituidas (lista en `design.md` §Barrido), comprobando principio y final por separado.
- [ ] 9.2 Pase 2, forma abreviada (`:NNN`) en los ficheros que citan esos módulos, incluidos `openspec/specs/**` (forma corta de specs), `openspec/config.yaml`, `CLAUDE.md`. Leer qué AFIRMA cada frase, no sólo que la línea exista.
- [ ] 9.3 Clasificar cada resultado A/B/C y repararlo; las rotas ajenas a esta tanda en ficheros que no se editan, listarlas sin corregir. Anotar el barrido en `apply-progress.md`.

### Fase 10 · Cierre del lote B

- [ ] 10.1 `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [ ] 10.2 `npm test`, `npm run typecheck`, `npm run lint` (techo 165), `npm run build`.
- [ ] 10.3 TS-29: `Grep` de `Migracion_Pendiente_a_En_Proceso` en `apps/` y `packages/` (sólo la prueba lo nombra); anotarlo.
- [ ] 10.4 Medir líneas del lote B y totales; completar `apply-progress.md`.

## Tareas de persona (fuera del recuento; archivar NO las da por hechas)

| Tarea | Dueño | Destino / dónde queda escrita |
|---|---|---|
| P-1: tickets de servicio en `Pendiente` gobernados por Zoho | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia_adenda`; antes de F1F-01 |
| Recuento previo (sólo lectura) | Alfonso | antes de desplegar; parte del corte + `archive-report.md` |
| Ejecutar el script tras desplegar y recuento posterior | Alfonso | mismo corte; ídem |
| Verificación en la app (ambientalia-desk.ambientalia.cloud) tras desplegar | Alfonso | parte del corte |

## Matriz de cobertura: escenario → tarea (68/68)

Los deltas contienen **68** escenarios, no 69 (`Grep` de `Scenario` por fichero: 39+12+5+5+7). Cobertura:

| Requisito (escenarios) | Tareas |
|---|---|
| RQ-TS-23 (4) | 1.2, 1.7, 1.9, 2.1, 3.1 |
| RQ-TS-24 (4) | 1.2, 1.7, 1.9, 2.1, 3.2 |
| RQ-TS-25 (4) | 1.2, 1.3, 2.2, 3.3, 2.5 (SLA: S-4, 10.3 no, ver `sla.ts:15` sin cambio) |
| RQ-TS-26 (2) | 1.1, 2.5, 3.4 |
| RQ-TS-27 (2) | 1.2–1.9, 3.6 |
| RQ-TS-28 (6) | 5.1, 5.2 (a–f), 6.1, 6.2, 7.1, 7.2 |
| RQ-TS-29 (1) | 10.3 |
| RQ-TS-01 (2) | 1.2, 2.1 |
| RQ-TS-04 (2) | 1.2, 2.1 |
| RQ-TS-05 (2) | 1.2, 2.2 |
| RQ-TS-07 (3) | 1.8, 2.1 |
| RQ-TS-11 (2) | 1.9, 5.2(a) |
| RQ-TS-12 (1) | 1.6, 1.9 |
| RQ-TS-20 (4) | 1.6 (`prioridad.test.ts`), 2.1; sin cambio de comportamiento |
| RQ-AV-01 (2) | 1.6, 1.7, 2.1 |
| RQ-AV-02 (3) | 1.6, 2.1 (comentario `:289-290`, `:293`) |
| RQ-PM-03 (5) | 1.8, 2.1 |
| RQ-MB-07 (4) | 1.4, 1.5, 2.3, 2.4, 3.5 |
| RQ-MB-02 (3) | 1.4, 2.4 |
| RQ-SR-12 (3) | 1.2, 1.3, 1.7, 3.3 |
| RQ-SR-05 (6) | 1.7, 1.9, 3.6 |
| RQ-SR-06 (3) | 1.2, 1.7, 3.1 |

Suma: 4+4+4+2+2+6+1+2+2+2+3+2+1+4+2+3+5+4+3+3+6+3 = 68.
