# Tasks — `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`)

**Entradas:** `proposal.md`, `design.md`, `specs/{tickets-core,transitions-st,remisiones,zoho-sync,derivacion-avisos}/spec.md`
de esta misma carpeta. `strict_tdd` activo: cada tarea de implementación va precedida de su prueba en rojo y de un
«confirmar rojo natural». Las citas de este documento se leyeron hoy (2026-09-28) contra el árbol de `77b498c`:
por lectura directa `ticketService.ts` (`:5`, `:6`, `:96`, `:106`, `:134`, `:138-142`, `:143-152`), `remision.ts:220`,
`migrate.ts:73`, `migrate.test.ts:282-286` y los recuentos de líneas de la tabla de cada lote; el resto viene de
`design.md` §8 (medido por el diseño el mismo día) y lo re-verifica el cierre de cada lote (hipótesis hasta entonces).

**Matriz de amenazas de la skill:** N/A (`design.md` §Matriz de amenazas: sin shell, subprocesos ni automatización
de VCS). La matriz propia del diseño (rutas HTTP, CSV, aviso) SÍ genera RED explícitos: 401 (3.5, 4.16), 403 con
cuerpo inválido (3.9), fechas irreales (3.9), lote hostil (1.3, 3.9), cliente inexistente (3.9), carrera de dos altas
(3.9), `:id` no numérico (3.5, 4.16), fórmulas en CSV (5.1), fallo del aviso (5.6), lectura abierta a sesión (3.5).

## Alineación de planificación (hecha al escribir este documento)

- [x] A.1 `specs/tickets-core/spec.md`, RQ-TC-21, `:92`: «Crear y editar un contrato **SHALL** exigir» → «Crear un
  contrato **SHALL** exigir»; y al final del párrafo (`:97`) una frase: editar la fecha de fin es la ampliación, fuera
  por E-086 (`docs/sdd/ENTRADA.md:1222`). Mismo número de líneas. Cierra el riesgo «crear y editar» de `design.md` §Riesgos (S-13).
- [x] A.2 `proposal.md:141` (fila de riesgos) y el criterio de éxito (`:165` antes; **`:167` hoy**, por A.3): la
  afirmación «cuarentena + vencido» se sustituye por «vencido frente a la guarda C anterior y frente al 409 (D);
  cuarentena y vencido son excluyentes por construcción (`packages/shared/src/subOV.ts:36`)».
- [x] A.3 `proposal.md`, §Previsión de tamaño (`:144-155` antes): cuatro lotes → los seis de `design.md` §10, total
  ~3.300; la fila de riesgo «Cuatro lotes» (`:142`) dice «Seis lotes, cada uno bajo 800». La tabla gana 2 filas, así
  que lo posterior a `:153` baja **+2** (el criterio de A.2 pasa de `:165` a `:167`). Nadie cita `proposal.md` por
  encima de `:153` (comprobado: `design.md:181` cita `:26`, `design.md:186` cita `:118`, los dos antes de la tabla).

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | ~3.300 (`design.md` §10: 590+540+540+630+455+570; incluye pruebas y `apply-progress.md`, no `verify-report`/`archive-report`) |
| Techo de esta sesión | **800 por lote** (`review_budget_lines`) — seis lotes, el mayor (lote 4, ~630) deja 170 de margen; **ninguno se parte** |
| Riesgo de presupuesto | **Alto** en conjunto; **Bajo/Medio por lote** |
| PRs/commits encadenados | Sí — seis lotes en serie sobre el mismo árbol (regla del ciclo 2) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main — un commit por lote, integrado antes de abrir el siguiente |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

(La etiqueta literal de la guarda dice «400-line»; el techo real es 800 por lote. El riesgo es alto por el TOTAL.)

**Reestimación de cada lote contra las tareas listadas abajo** (sin cambios respecto al diseño; ninguno supera 800):

| Lote | Código | Pruebas | Artefactos | Total | Depende | Notas de la reestimación |
|---|---|---|---|---|---|---|
| 1 · Modelo y vigencia | ~210 | ~320 | ~60 | ~590 | — | +10 de pruebas en `migrate.test.ts:282-286` (en sitio), dentro del margen |
| 2 · Prioridad y guarda | ~60 | ~420 | ~60 | ~540 | 1 | tres puertas × (RED + posición); las pruebas caen al FINAL de tres ficheros de prueba |
| 3 · API y ticket de contrato | ~150 | ~330 | ~60 | ~540 | 1 | ruta informe queda en el lote 4 |
| 4 · Informe trimestral | ~200 | ~370 | ~60 | ~630 | 1, 3 | el mayor; margen 170 |
| 5 · Ritmo y CSV | ~125 (+40 `csvDelInforme`, S-23) | ~270 (+50) | ~60 | ~545 | 4 | S-23 sube el lote de ~455 a ~545 |
| 6 · Interfaz y cierre | ~480 | 0 | ~90 | ~570 | 3-5 | `.tsx` fuera de la red (F0-00) |
| **Total** | | | | **~3.415** | | |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | `public.contratos`, índice único y `CHECK`, `shared/contratos.ts` (vigencia, fechas, lote, prioridad), `db/contratos.ts` | PR 1 | `npx vitest run packages/shared/src/contratos.test.ts apps/desk/server/db/contratos.test.ts packages/zoho-sync/src/db/migrate.test.ts` | pg-mem (sin credenciales Zoho) | `git revert`; tabla nueva, vacía, nadie más la lee |
| 2 | `High` al nacer y guarda de vencido en las tres puertas, con pruebas de posición | PR 2 | `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/ordenVentaUnTicket.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/db/contratos.test.ts` | pg-mem + `appHarness` | `git revert`; puertas y prioridad vuelven a hoy |
| 3 | Rutas de contrato y marca derivada del ticket | PR 3 | `npx vitest run apps/desk/server/routes/contratos.test.ts apps/desk/server/routes/ovAsociaciones.test.ts apps/desk/server/db/contratos.test.ts` | `appHarness` | `git revert`; rutas nuevas, nada las llama aún |
| 4 | Informe trimestral (dominio, `creadasDelLote`, servicio, ruta) | PR 4 | `npx vitest run packages/shared/src/contratos.test.ts packages/zoho-sync/src/books/subOV.test.ts apps/desk/server/db/informeContrato.test.ts apps/desk/server/routes/contratos.test.ts` | pg-mem + `appHarness` | `git revert`; `saldoPorLote` intacto |
| 5 | Regla de ritmo, aviso periódico, `celdaCSV` y `csvDelInforme` | PR 5 | `npx vitest run packages/shared/src/contratos.test.ts apps/desk/server/services/avisoRitmoContrato.test.ts` | pg-mem | `git revert`; la columna de marca queda sin uso |
| 6 | Interfaz, texto para el expediente R08.3, barrido de citas | PR 6 | N/A — `apps/desk/src/**/*.tsx` fuera de la red (F0-00, `vitest.config.ts:16-20`) | Verificación manual en `ambientalia-desk.ambientalia.cloud` tras desplegar (P.6) | `git revert`; UI pura |

Una tanda SDD por árbol (regla del ciclo 2): los seis lotes van **en serie**. `verify` y `archive` son intentos aparte.

**Convenciones de todos los lotes.**
- Fixtures de fecha **relativos** a `hoyEnZona()` (helper `diaRelativo(n)` en la prueba): nada se escribe con fecha absoluta que caduque.
- «En sitio» = mismo número de líneas (una edición cuenta `+n −n`); «al final» = sólo inserciones, `−0`. El cierre de cada
  lote lo comprueba con `git diff --numstat HEAD -- <fichero>` y con el recuento de líneas de la tabla del lote.
- Medida de cada lote: `git add -N <ficheros nuevos del lote> && git diff --shortstat --no-renames HEAD` (se listan los
  nuevos, no `.`: hay ficheros sin trackear ajenos en `docs/sdd/`). Techo 800; si un lote se pasa, se para y se declara.
- Barrido de la regla de mutación 4 en cada cierre: `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio
  fuera de `openspec/changes/archive/`, más segundo pase para la forma abreviada en los ficheros que ya citan el módulo;
  se comprueban los DOS extremos de cada rango y se LEE qué afirma cada cita (A presente / B histórico / C superado).
- Tras cada cierre: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`, y `apply-progress.md` del lote.
- **Guarda «cuarentena + vencido»: NO hay tarea de mutación de posición y se dice a propósito.** Para un mismo número
  son excluyentes (`clasificarOV` devuelve un solo tipo; una subOV en cuarentena no tiene lote canónico,
  `packages/shared/src/subOV.ts:36`) y ninguna transición trae `Orden de Venta` y `OV adicional` a la vez
  (`transitions.ts:189`, `:199`, `:203`): mover una guarda por delante de la otra no cambia ninguna respuesta
  observable. Sí hay una prueba de contenido (2.10) que discrimina otra mutación: sacar el lote por prefijo en vez de por `clasificarOV`.

---

## Lote 1 · Modelo y vigencia

**Estimación:** código ~210 · pruebas ~320 · artefactos ~60 · **total ~590**. **Depende de:** — (primer lote).

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` (554 líneas hoy; 115 citas) | tras `:554`: `CREATE TABLE public.contratos` + 2 índices; comentario sin punto y coma (`schema.sql:520-521`) | FINAL DE FICHERO |
| `packages/zoho-sync/src/db/migrate.ts` (131; 41 citas) | `:73`: `'contratos'` al final de `PUBLIC_TABLES` | EN SU SITIO |
| `packages/zoho-sync/src/db/migrate.test.ts` (444) | `:282-286`: título y recuentos (`[10, 19, 3]` → `[10, 20, 3]`; `32` → `33`) | EN SU SITIO |
| `apps/desk/server/db/calendarioCierres.ts` (34) | `:18`: `function comoDiaCivil` → `export function comoDiaCivil` | EN SU SITIO |
| `packages/shared/src/index.ts` (23) | una línea `export * from './contratos'` tras `:23` | FINAL DE FICHERO |

Módulos nuevos, sin cita previa: `packages/shared/src/contratos.ts`, `apps/desk/server/db/contratos.ts`.
**Hallazgo al planificar:** `migrate.test.ts:282-286` fija 32 tablas y `[10, 19, 3]`; añadir `contratos` lo pone rojo por
diseño, y ese guardián (`:255-271`) es además el que cazaría una tabla sin clasificar o sin esquema (mutación 2, 1.24-1.25).

- [x] 1.1 RED — `migrate.test.ts:282-286` en su sitio: título «son 33 tablas: 10 de Desk, 20 de la app en public y 3…»,
  `[10, 20, 3]` y los tres `32` → `33`. RQ: soporte de RQ-TC-21 (tabla propia en `public`).
- [x] 1.2 Confirmar rojo natural (`PUBLIC_TABLES` tiene 19 y `schema.sql` 32 `CREATE TABLE`).
- [x] 1.3 RED — `packages/shared/src/contratos.test.ts` (nuevo), tablas de casos: `fechaCalendario` (`2026-02-30`,
  `31/12/2026`, vacío, `null` → `null`; `2026-12-31` → tal cual) y `LOTE_OV` (`OV-2026-170` y `OV-2026-1700` sí;
  `OV-2026-170-01`, `OVI-2026-170`, `OV-2026-17`, `OV-2026-170'; DROP TABLE contratos` no). RQ: RQ-TC-21 (formato de lote, fechas reales).
- [x] 1.4 Confirmar rojo natural (módulo inexistente).
- [x] 1.5 GREEN — crear `contratos.ts`: `LOTE_OV` (`/^OV-\d{4}-\d{3,4}$/`), `fechaCalendario` (sobre `diaEnZona`, `fechasDerivadas.ts:63-73`),
  tipos `Contrato`; exportar en `index.ts` tras `:23` (al final). La prueba importa desde `@ambientalia/shared` (prueba el export).
- [x] 1.6 Confirmar 1.3 en verde.
- [x] 1.7 RED — `contratos.test.ts`: `estadoContrato(c, hoy)` en los extremos (fin `2026-12-31`: hoy `12-31` → vigente,
  `2027-01-01` → vencido; inicio `2026-10-01`: hoy `10-01` → vigente, `09-30` → `no_iniciado`) y `motivoVencido(numero, contrato, hoy)`:
  subOV `OV-2026-170-01` + vencido → texto que nombra lote, contrato y fin; `null` con ordinaria, `OVI-2026-170`, cuarentena
  `OV-2026-170-X9`, contrato aún no iniciado, fin = hoy y sin contrato. RQ: RQ-TC-22 (3 escenarios), RQ-TC-25 (contenido de la guarda).
- [x] 1.8 Confirmar rojo natural.
- [x] 1.9 GREEN — `estadoContrato` (comparación de cadenas `YYYY-MM-DD`) y `motivoVencido` (usa `clasificarOV`, `subOV.ts:32-36`).
- [x] 1.10 Confirmar 1.7 en verde.
- [x] 1.11 RED — `contratos.test.ts`: `prioridadAlNacer(pedida, vigente)` (`true` → `'High'` aunque pida `'Low'`; `false` →
  `pedida ? String(pedida) : null`, con `'Low'`, `undefined`, `''`) y `hoyEnZona(ahora)` (las 23:30 de Bogotá del 31-dic caen a las
  04:30Z del 1-ene: «hoy» es 31-dic — S-11, nunca la zona del proceso).
- [x] 1.12 Confirmar rojo natural.
- [x] 1.13 GREEN — `prioridadAlNacer` y `hoyEnZona` (`diaEnZona`, `ZONA_NEGOCIO` de `fechasDerivadas.ts:13`).
- [x] 1.14 Confirmar 1.11 en verde. **Adelantado del lote 4 a petición de la supervisión (2026-09-28):** `trimestresDelContrato` y `trimestreEn` con RED propio (inicio = hoy, fin = hoy, fin = ayer, cambio de trimestre, fin de mes, bisiesto); `sumarDias` exportado en sitio (`calendarioLaboral.ts:66`).
- [x] 1.15 RED — `apps/desk/server/db/contratos.test.ts` (nuevo, pg-mem): ida y vuelta de `date` (`Date` y `string` los
  normaliza `comoDiaCivil`), `crearContrato`, `contratoDelLote`, `contratosDelCliente`, `listarContratos`; segundo contrato del
  mismo lote → `ContratoDuplicadoError` (`23505` traducido); `INSERT` directo con el lote repetido → `23505`; `INSERT`
  directo con `fecha_fin < fecha_inicio` → rechazado. RQ: RQ-TC-21 (unicidad por lote en la base, `CHECK`).
- [x] 1.16 Confirmar rojo natural (tabla y módulo inexistentes).
- [x] 1.17 GREEN — `schema.sql` AL FINAL (tras `:554`): `CREATE TABLE IF NOT EXISTS public.contratos (…)`,
  `CONSTRAINT contratos_fin_no_antes_de_inicio CHECK`, `idx_contratos_lote` (único) e `idx_contratos_cliente` (`design.md` §1).
- [x] 1.18 GREEN — `migrate.ts:73` en su sitio: `'contratos'` al final de `PUBLIC_TABLES`.
- [x] 1.19 GREEN — `calendarioCierres.ts:18` en su sitio: `export function comoDiaCivil` (S-18).
- [x] 1.20 GREEN — crear `db/contratos.ts`: `crearContrato` (traduce `23505`), `listarContratos`, `contratoPorId`, `contratoDelLote`, `contratosDelCliente`. Consultas sin calificar, como `ov_asociaciones`; sin `DELETE` ni `UPDATE` (S-13).
- [x] 1.21 Confirmar 1.1 y 1.15 en verde. **Si pg-mem no impone el `CHECK`** (hipótesis de `design.md` §1), 1.15 queda rojo en esa
  aserción: se declara en `apply-progress.md` y en un comentario de la prueba, y la aserción se sustituye por una guardián
  estructural que LEE `schema.sql` y exige la `CONSTRAINT`; la mutación 1.23 se hace igual sobre el fichero.
- [x] 1.22 MUTACIÓN (regla 2, fichero vigilado) — ensuciar `schema.sql` quitando `UNIQUE` de `idx_contratos_lote`; correr 1.15 y
  confirmar ROJO (la segunda alta del lote deja de chocar); revertir; `git diff` limpio.
- [x] 1.23 MUTACIÓN (regla 2) — quitar el `CHECK` de `schema.sql`; confirmar ROJO (o, si 1.21 declaró que pg-mem no lo impone, ROJO de la guardián estructural); revertir.
- [x] 1.24 MUTACIÓN (regla 2, guardián `migrate.test.ts:255-271`) — escribir `CREATE TABLE IF NOT EXISTS contratos` SIN `public.`; confirmar ROJO; revertir.
- [x] 1.25 MUTACIÓN (regla 2) — quitar `'contratos'` de `PUBLIC_TABLES` (`migrate.ts:73`); confirmar ROJO (tabla sin clasificar y recuento); revertir.
- [x] 1.26 Cierre del lote 1: `npx vitest run packages/shared/src/contratos.test.ts apps/desk/server/db/contratos.test.ts packages/zoho-sync/src/db/migrate.test.ts`;
  `npm test`; `npm run typecheck`; `eslint`; medir (nuevos: `contratos.ts`, `contratos.test.ts` ×2, `db/contratos.ts`);
  recuentos: `migrate.ts` 131, `migrate.test.ts` 444, `calendarioCierres.ts` 34 sin cambio (`+1 −1` / `+n −n`), `schema.sql` 554→554+N y
  `index.ts` 23→24 con `−0`; barrido de citas sobre `schema.sql` (0 citas tras el punto: `design.md` §8), `migrate.ts` (`tickets-core :794`
  cita `:70-73`: sigue cierto) y `migrate.test.ts` (citas a `:327`, `:409-411`: no se mueven); `apply-progress.md`.

---

## Lote 2 · Prioridad y guarda en las tres puertas

**Estimación:** código ~60 · pruebas ~420 · artefactos ~60 · **total ~540**. **Depende de:** Lote 1.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `apps/desk/server/services/ticketService.ts` (234; 151 citas) | `:5` segunda sentencia `import … from '../db/contratos'` en la misma línea | EN SU SITIO |
| `ticketService.ts` | `:6` el import de `shared` gana `prioridadAlNacer` | EN SU SITIO |
| `ticketService.ts` | `:96` entre `/* C antes que D */` y `const enUso`, en la MISMA línea: `const vencido = await motivoContratoVencido(db, ordenVenta); if (vencido) throw new HttpError(422, { error: vencido });` | EN SU SITIO |
| `ticketService.ts` | `:106` `priority: prioridadAlNacer(b.prioridad, await hayContratoVigente(db, clientId!)),` | EN SU SITIO |
| `ticketService.ts` | `:143-147` comentario de cinco líneas → cuatro; `:147` = `const errVencido = await erroresContratoVencido(db, [plan.columns.orden_venta, plan.ovAdicional]); if (errVencido.length) throw new HttpError(422, { errors: errVencido })` (**no** en `:134`, S-22) | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` (397; 114 citas) | `:5` segunda sentencia `import` en la misma línea | EN SU SITIO |
| `remision.ts` | `:220` tras el `return` del bloque A/C: `const vencido = await motivoContratoVencido(db, ov.number); if (vencido) { res.status(422).json({ error: vencido }); return }`; el comentario `// A y luego C…` pasa al final de la línea | EN SU SITIO |
| `ticketService.test.ts`, `ordenVentaUnTicket.test.ts`, `remisiones.test.ts`, `db/contratos.test.ts` | casos nuevos AL FINAL; `remisiones.test.ts:988` y las aserciones existentes **no se tocan** | FINAL DE FICHERO |

Ficheros sin cita previa: `db/contratos.ts` (gana `hayContratoVigente`, `motivoContratoVencido`, `erroresContratoVencido`, decidiendo con `motivoVencido` de `shared`, no en SQL).
Citas a releer en el cierre (el contenido cambia, el número no): `tickets-core :306, :647`, `config.yaml:1132`, `ordenVentaUnTicket.test.ts:19` (`:96`);
`proposal.md:26` (`:106`); `CLAUDE.md:349` ×2, `transitions-st :914`, `config.yaml:1204`, `remisiones.test.ts:1246` (`remision.ts:220`: sigue diciendo «Orden de venta no encontrada»).

- [x] 2.1 RED — `db/contratos.test.ts` (al final): `hayContratoVigente(db, clientId)` (vigente, vencido, no iniciado, fin = hoy, contrato de otro cliente);
  `motivoContratoVencido(db, numero, hoy?)` (subOV de lote vencido → texto; sin contrato, ordinaria, `OVI-`, cuarentena, no iniciado, fin = hoy → `null`);
  `erroresContratoVencido(db, [a, b])` → un texto por número vencido. RQ: RQ-TC-25.
- [x] 2.2 Confirmar rojo natural.
- [x] 2.3 GREEN — los tres ayudantes en `db/contratos.ts`.
- [x] 2.4 Confirmar 2.1 en verde.
- [x] 2.5 RED — `ticketService.test.ts` (al final), prioridad al nacer: cliente con contrato vigente y cuerpo `Low` → `High`; vigente y sin prioridad → `High`;
  sin contrato: `Low` → `Low` y sin prioridad → `null`; contrato vencido y contrato que empieza mañana, con `Low` → `Low`; fin = hoy → `High`; contrato vigente del
  cliente A y alta para el cliente B con subOV del lote de A → sin `High`. RQ: RQ-TC-24 (6 escenarios).
- [x] 2.6 Confirmar rojo natural: rojos los tres que esperan `High`; los otros tres **nacen verdes** (guardas de regresión, se declara en `apply-progress.md`).
- [x] 2.7 GREEN — `ticketService.ts:5`, `:6` y `:106` en su sitio.
- [x] 2.8 Confirmar 2.5 en verde.
- [x] 2.9 MUTACIÓN (prioridad, dos direcciones) — sustituir el argumento de `:106` por `false` (2.5 rojo en `High`) y por `true` (2.5 rojo en «sin contrato»); revertir; `git diff` limpio.
- [x] 2.10 RED — alta. `ticketService.test.ts` (al final; `ordenVentaUnTicket.test.ts` no hizo falta: la unidad cubre los mismos casos y no se toca): subOV `OV-2026-170-01` con contrato vencido → `422` de vencido, sin ticket ni asociación;
  **subOV vencida que además tiene asociación vigente a otro ticket → `422`, no `409`** (posición D); faltantes (sin tipo de servicio) + vencido → «Faltan campos obligatorios»; cliente
  inexistente + vencido → «Cliente no encontrado»; campos del equipo nuevo inválidos + vencido → el error del equipo nuevo; lote sin contrato, contrato que empieza mañana, fin = hoy y
  la madre ordinaria `OV-2026-170` de un lote vencido → `201`; `OV-2026-170-X9` con contrato vencido en `OV-2026-170` → `422` de **cuarentena** y el motivo no dice «contrato»
  (discrimina sacar el lote por prefijo). RQ: RQ-TC-08 (vencido, vencido gana al 409, faltantes ganan), RQ-TC-25 (alta, sin contrato, no iniciado, último día, ordinaria, unicidad, excluyentes).
- [x] 2.11 Confirmar rojo natural: rojos los dos que esperan `422` de vencido (incluida la de posición); los demás nacen verdes (regresión de guardas vecinas) y los prueba la mutación 2.14.
- [x] 2.12 GREEN — `ticketService.ts:5` y `:96` en su sitio (vencido tras la cuarentena, antes de `ticketConOrdenVenta`).
- [x] 2.13 Confirmar 2.10 en verde.
- [x] 2.14 MUTACIÓN (regla 1, posición) — en `ticketService.ts` mover la guarda de vencido (a) DESPUÉS de `ticketConOrdenVenta` (`:97`): debe ponerse ROJA la de vencido+`409`; (b) ANTES de `missing` (`:83`):
  la de faltantes; (c) ANTES de `getClient` (`:89`): la de cliente inexistente; (d) ANTES de `validarCamposEquipoNuevo` (`:91`): la del equipo nuevo. Revertir cada una; `git diff` limpio.
- [x] 2.15 RED — transición. `ticketService.test.ts` (al final): `habilitar_servicio` con subOV de lote vencido → `422 { errors }` sin escribir `orden_venta` ni asociación; **vencido + asociación vigente a otro ticket → `422`, no `409`**;
  obligatorios faltantes + vencido → `422` de obligatorios; persona derivada dada de baja + vencido → `422` de persona; lote sin contrato y lote que empieza mañana → `200`; `Aprobación` con `ovAdicional` de lote vencido → `422` y sin asociación;
  `Aprobación y S. Repuestos` con `ovAdicional` vencida y ya asociada a otro ticket → `422`, no `409`. Si ninguna transición del catálogo real lleva a la vez OV y `derivado_a`, la prueba de persona usa un `Transition` sintético
  inyectado (patrón de las pruebas que ya fabrican catálogos); si tampoco cabe, se declara esa posición inobservable, como con cuarentena+vencido (hipótesis). RQ: RQ-TS-14 (3 nuevos + sin contrato), RQ-TS-18 (2 nuevos), RQ-TS-06 fila 9, RQ-TC-25.
- [x] 2.16 Confirmar rojo natural: rojos los `422` de vencido; obligatorios, persona y `200` sin contrato nacen verdes.
- [x] 2.17 GREEN — `ticketService.ts:143-147` en su sitio (comentario 5 → 4 líneas; `:147` = guarda de vencido). Sigue `:148` `const nuevaOrdenVenta` y `:148-152` (D) sin tocar.
- [x] 2.18 Confirmar 2.15 en verde.
- [x] 2.19 MUTACIÓN (regla 1) — mover la guarda de vencido (a) DESPUÉS del bloque D (`:149-152`): rojas las de vencido+`409` (`habilitar_servicio` y `Aprobación y S. Repuestos`); (b) ANTES de la persona derivada (`:138`): la de persona; (c) ANTES de `:134`: la de obligatorios. Revertir cada una.
- [x] 2.20 RED — remisión. `remisiones.test.ts` (al final, SIN tocar `:988`): subOV vencida con ticket destino con serial y sin remisión pendiente → `422`, sin las tres columnas, sin asociación y sin remisión; **vencida + asociación vigente a otro ticket → `422`, no `409`**;
  remisión pendiente + vencida → `409` de pendiente (`:177`, IV-12); ítems `incluye` fuera del checklist + vencida → `422` de ítems (`:197`); lote sin contrato y lote que empieza mañana → `201`. RQ: RQ-RE-16 (5 escenarios nuevos), RQ-TC-25.
- [x] 2.21 Confirmar rojo natural: rojos los dos `422` de vencido; pendiente, ítems y `201` nacen verdes.
- [x] 2.22 GREEN — `remision.ts:5` y `:220` en su sitio.
- [x] 2.23 Confirmar 2.20 en verde.
- [x] 2.24 MUTACIÓN (regla 1) — mover la guarda de vencido (a) DESPUÉS de `ticketConOrdenVenta` (`:230`): roja la de vencido+`409`; (b) ANTES del control de ítems (`:197`): la de ítems; (c) ANTES de la remisión pendiente (`:177`): la de pendiente. Para (b) y (c) se copia el bloque con su propio `getSalesOrder`, porque `ov` se lee en `:219`. Revertir; `git diff` limpio.
- [x] 2.25 Verificación de regresión (sin RED nuevo) — `remisiones.test.ts:988` y todo `ordenVentaUnTicket.test.ts` en verde con `git diff` que muestre sólo inserciones al final de esos ficheros. RQ: RQ-TC-08 «Las pruebas de posición existentes no cambian».
- [x] 2.26 Verificación de regresión — `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/ordenVentaUnTicket.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/transitionExec.test.ts`: los 15 escenarios heredados del cambio 2 (matriz, «regresión») siguen en verde sin cambiar aserciones.
- [x] 2.27 Cierre del lote 2: `npm test`; `npm run typecheck`; `eslint`; medir (nuevo: ninguno de código; `db/contratos.ts` ya medido en el lote 1); recuentos `ticketService.ts` 234 y `remision.ts` 397 **sin cambio** (`+n −n`); barrido de citas sobre `ticketService.ts` (151: las 5 de la tabla de arriba, y `transitions-st :902-903` «C antes que D» sigue cierto) y `remision.ts` (114: `CLAUDE.md:349` ×2, IV-12 `:220`); `apply-progress.md`.

---

## Lote 3 · API y ticket de contrato

**Estimación:** código ~150 · pruebas ~330 · artefactos ~60 · **total ~540**. **Depende de:** Lote 1.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `apps/desk/server/app.ts` (96; 12 citas) | `:22` el import de `registerContratosRoutes` se añade al FINAL de la línea existente; `:61` la llamada al final de la línea `registerOvAsociacionesRoutes(app, { db })` — **ninguna línea nueva** | EN SU SITIO |
| `apps/desk/server/routes/ovAsociaciones.ts` (57; 6 citas) | `:5` importa `LOTE_OV` de `shared`; `:21` deja de declararlo (mismo formato, ahora importado) | EN SU SITIO |

Módulos nuevos: `apps/desk/server/routes/contratos.ts`, `apps/desk/server/routes/contratos.test.ts`. `db/contratos.ts` gana `contratoDelTicket` (fichero nuevo del lote 1).
Cita a releer: `tickets-core` delta `:86` (`ovAsociaciones.ts:21`).

- [x] 3.1 RED — `db/contratos.test.ts` (al final): `contratoDelTicket(db, ticketId, hoy)`: asociación vigente a `OV-2026-170-01` + contrato vigente → de contrato, con lote `OV-2026-170`; contrato vencido → no, sin que cambie ninguna columna de `tickets` ni fila de `ov_asociaciones`;
  asociación liberada → no; asociación a ordinaria `OV-2026-170` con contrato registrado y a `OV-2026-180-01` sin contrato → no; contrato del cliente A y ticket del cliente B → sí, sin rechazo. RQ: RQ-TC-23 (5 escenarios).
- [x] 3.2 Confirmar rojo natural.
- [x] 3.3 GREEN — `contratoDelTicket` en `db/contratos.ts`: asociaciones vigentes → `clasificarOV` → contrato del lote → `estadoContrato === 'vigente'`; calculado al leer (S-3), sin comparar clientes (S-9).
- [x] 3.4 Confirmar 3.1 en verde.
- [x] 3.5 RED — `routes/contratos.test.ts` (nuevo, `appHarness`), lecturas: `401` sin sesión en `GET /api/contratos`, `GET /api/contratos/:id` y `GET /api/tickets/:id/contrato`; las tres devuelven `200` a un usuario con sesión sin Comercial; la ficha trae contrato, estado y `saldoPorLote`;
  `:id` = `abc` → `404` **sin consultar** (se cuentan las consultas); id inexistente → `404`; `GET /api/tickets/:id/contrato` → `{ deContrato, contrato?, subOV? }`. RQ: RQ-TC-21 (lectura abierta), RQ-TC-23 (exposición en la lectura del ticket).
- [x] 3.6 Confirmar rojo natural (rutas inexistentes).
- [x] 3.7 GREEN — crear `routes/contratos.ts`, `registerContratosRoutes(app, { db })` con las tres lecturas (`requireAuth`); registrar en `app.ts:22` y `:61` **al final de las líneas existentes**.
- [x] 3.8 Confirmar 3.5 en verde.
- [x] 3.9 RED — `routes/contratos.test.ts`, alta: Comercial `POST /api/contratos` (`OV-2026-170`, `2026-01-15`–`2026-12-31`) → éxito con `creado_por` y `created_at`; sin Comercial → `403` con datos válidos **y** con cuerpo inválido, sin fila; administrador sin área → éxito;
  segundo contrato del mismo lote de otro cliente → `409` y fila intacta; `422` en tabla: `OV-2026-170-01`, `OV-2026-170'; DROP TABLE contratos`, fin < inicio, sin fecha de fin, `2026-02-30`, `31/12/2026`, vacío, cliente inexistente (`getClient` nulo);
  **posición:** usuario sin Comercial + inválido + lote ya registrado → `403`; Comercial + inválido + lote ya registrado → `422`, no `409`; carrera: el `SELECT` previo se oculta con un envoltorio de `Queryable` y la base responde `23505` → `409`, no `500`. RQ: RQ-TC-21 (6 escenarios de escritura).
- [x] 3.10 Confirmar rojo natural.
- [x] 3.11 GREEN — `POST /api/contratos`: `403` con `canExecuteTransition(areas, isAdmin, 'Comercial')` antes de leer el cuerpo; `422` con `LOTE_OV`, `fechaCalendario`, fin ≥ inicio y `getClient`; `409` por consulta previa y por `ContratoDuplicadoError`; SQL siempre parametrizado; registra `creado_por` con el nombre de sesión.
- [x] 3.12 Confirmar 3.9 en verde.
- [x] 3.13 GREEN — `ovAsociaciones.ts:5` y `:21` en su sitio (consume `esLote` de `shared`, no `LOTE_OV`: petición de la supervisión, «usa clasificarOV, no una regex nueva»; `:36` aplica el criterio); verificar `routes/ovAsociaciones.test.ts` en verde sin cambios.
- [x] 3.14 MUTACIÓN (regla 1, posición) — en `routes/contratos.ts` mover el `403` DESPUÉS de la validación de contenido (3.9 rojo); mover la consulta de unicidad ANTES de la validación (3.9 rojo). Revertir.
- [x] 3.15 MUTACIÓN — en `contratoDelTicket` sacar el lote por prefijo del número en vez de por `clasificarOV`; 3.1 debe ponerse ROJO (la ordinaria `OV-2026-170` con contrato registrado pasaría a ser de contrato). Revertir.
- [x] 3.16 Cierre del lote 3: `npm test`; `npm run typecheck`; `eslint`; medir (nuevos: `routes/contratos.ts`, `routes/contratos.test.ts`); recuentos `app.ts` 96 y `ovAsociaciones.ts` 57 sin cambio; barrido de citas sobre `app.ts` (12, todas ancladas en `1d030d5` o históricas: comprobar por lectura que `Triaje_Linea_Base_Citas_2026-09-15.md:71-73` no cambia) y `ovAsociaciones.ts`; `apply-progress.md`.

---

## Lote 4 · Informe trimestral

**Estimación:** código ~200 · pruebas ~370 · artefactos ~60 · **total ~630**. **Depende de:** Lotes 1 y 3.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `packages/zoho-sync/src/books/subOV.ts` (49; 6 citas mezcladas con `shared/src/subOV.ts`) | `creadasDelLote` tras `:49`; `saldoPorLote` (`:34-49`) **no se toca** | FINAL DE FICHERO |
| `packages/zoho-sync/src/books/subOV.test.ts` | casos nuevos | FINAL DE FICHERO |

Módulos nuevos: `apps/desk/server/db/informeContrato.ts` y su prueba. `shared/contratos.ts` y `routes/contratos.ts` (ficheros nuevos de los lotes 1 y 3) ganan funciones y la ruta.

- [x] 4.1 RED — `contratos.test.ts` (al final): `trimestresDelContrato` YA EXISTE desde el lote 1: su caso aquí es regresión, sin rojo previo (inicio `2026-02-10`, fin `2027-02-09` → t1 `2026-02-10`–`2026-05-09`, t2 desde `2026-05-10`, el último acaba en `2027-02-09`; inicio `2026-01-31` → t2 `2026-04-30`, t3 `2026-07-31`, siempre desde el inicio, S-12);
  `diasEntre` (fin `2026-12-31`: hoy `12-01` → 30; `2027-01-05` → −5); `porcentaje` (0 sin creadas; 3/10 → 30); `estadoSubOV` (libre / en curso / ejecutada con `Finalizado`, S-6). RQ: RQ-ZS-15 (trimestres, días, sin creadas).
- [x] 4.2 Confirmar rojo natural.
- [x] 4.3 GREEN — `diasEntre` (`trimestresDelContrato` hecho en el lote 1) (`Date.UTC`, como `calendarioLaboral.ts:10`, `:54-57`), `porcentaje`, `estadoSubOV`.
- [x] 4.4 Confirmar 4.1 en verde.
- [x] 4.5 MUTACIÓN — calcular cada trimestre a partir del anterior (deriva) en vez de desde el inicio; 4.1 (caso `31-ene`) debe ponerse ROJO. Revertir.
- [x] 4.6 RED — `books/subOV.test.ts` (al final): `creadasDelLote(db, lote)` excluye cuarentena, borrador y anulada; **enfrentamiento (molde H5):** `creadasDelLote(l).length` = `saldoPorLote(l).creadas` sobre un lote con cuarentena, `draft` y `void`. RQ: RQ-ZS-15 «no cuentan».
- [x] 4.7 Confirmar rojo natural (función inexistente).
- [x] 4.8 GREEN — `creadasDelLote` AL FINAL de `books/subOV.ts` con el mismo `ESTADOS_FUERA_DEL_SALDO` (`:18`) y `clasificarOV` (S-20).
- [x] 4.9 Confirmar 4.6 en verde; `git diff HEAD -- packages/zoho-sync/src/books/subOV.ts` no toca `:34-49`.
- [x] 4.10 MUTACIÓN (molde H5) — quitar `'void'` del filtro de `creadasDelLote`; el enfrentamiento debe ponerse ROJO. Revertir.
- [x] 4.11 RED — `db/informeContrato.test.ts` (nuevo, pg-mem): 10 creadas, 3 con ticket `Finalizado`, 2 con ticket abierto, 5 sin asociación → 3 / 2 / 5 y 30 %, y `saldoPorLote` sigue dando 5 consumidas y 50 %; asociación liberada → libre; 3 válidas + cuarentena + `draft` + `void` → creadas 3;
  2 finalizadas en t1 y 3 más en t2 → 20 % y 50 %, servicios de t2 = los 3; cada servicio con equipo, serial, tipo, fecha e `informe: 'No disponible en los datos'`; lote sin subOV → 0 %, 0 libres, días; ticket `Finalizado` sin fila de `ticket_transitions` → `sinFecha`, fuera de los acumulados;
  ticket reabierto y vuelto a finalizar → cuenta la PRIMERA llegada (S-15); `huecos[]` declarado. RQ: RQ-ZS-15 (7 escenarios de datos).
- [x] 4.12 Confirmar rojo natural.
- [x] 4.13 GREEN — `db/informeContrato.ts`, `informeContrato(db, contrato, hoy)` (`design.md` §6, pasos 1-5; agregación en TS, subconsulta no correlacionada de la tercera vía).
- [x] 4.14 Confirmar 4.11 en verde.
- [x] 4.15 MUTACIÓN — (a) cambiar «acumulado al cierre» por «sólo los del trimestre»: 4.11 (20/50) ROJO; (b) tomar la ÚLTIMA llegada a `Finalizado` en vez de la primera: ROJO. Revertir.
- [x] 4.16 RED — `routes/contratos.test.ts` (al final): `GET /api/contratos/:id/informe`: `401` sin sesión, `404` con `abc` (sin consultar) y con id inexistente, `200` con la forma de `design.md` §6 (`contrato`, `estado`, `hoy`, `creadas`, `ejecutadas`, `enCurso`, `libres`, `porcentajeEjecutado`, `consumido`, `subOV[]`, `trimestres[]`, `sinFecha[]`, `huecos[]`), abierto a sesión sin Comercial.
- [x] 4.17 Confirmar rojo natural.
- [x] 4.18 GREEN — ruta del informe en `routes/contratos.ts` (`requireAuth`, `404` antes de consultar).
- [x] 4.19 Confirmar 4.16 en verde.
- [x] 4.20 Cierre del lote 4: `npm test`; `npm run typecheck`; `eslint`; medir (nuevos: `db/informeContrato.ts`, `informeContrato.test.ts`); recuento `books/subOV.ts` 49→49+N con `−0`; barrido de citas sobre `books/subOV.ts` y `shared/src/subOV.ts` (mezcladas: separar cuál de los dos ficheros cita cada una); `apply-progress.md`.

---

## Lote 5 · Ritmo y CSV

**Estimación:** código ~125 (+40 de S-23) · pruebas ~270 (+50) · artefactos ~60 · **total ~545**. **Depende de:** Lote 4.

**Supuesto nuevo, reversible — S-23 (tasks):** `csvDelInforme(informe)` en `shared/contratos.ts` arma el texto CSV completo con `celdaCSV`; el cliente sólo añade BOM y `Blob`. Motivo: el escenario «El informe se exporta como tabla» sería, si no, imposible de probar (`.tsx` fuera de la red, F0-00), y la regla 13 pide que el cliente no calcule. Si se rechaza, se borran 5.1 (su parte) y 5.3, y ese escenario queda cubierto por 4.11-4.14 más la verificación manual P.6.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `apps/desk/server/index.ts` (99; 10 citas) | `:15` import de `pasadaRitmoContratos` al final de la línea; `:88` `let p: Promise<unknown> = pasadaRitmoContratos(pool).then(() => sync.syncRecent())` | EN SU SITIO |
| `apps/desk/src/components/RemisionesPage.tsx` (336; 3 citas) | `:2` import de `celdaCSV`; `:85-88` tres líneas de comentario y `const csvCampo = celdaCSV` | EN SU SITIO |

Módulos nuevos: `apps/desk/server/services/avisoRitmoContrato.ts` y su prueba. `db/avisos.ts` **no se toca**. Cita a releer: `:85` de `index.ts` (`zoho-sync :48, :177`; `proposal.md:118`) sigue siendo el `setInterval`.

- [x] 5.1 RED — `contratos.test.ts` (al final): `ritmoInsuficiente` (10 creadas, 3 ejecutadas, 90 transcurridos y 90 restantes → `true`; 6 ejecutadas → `false`; dentro del trimestre 1 → `false`; 0 creadas → `false`; contrato vencido → `false`; transcurridos = `diasEntre(inicio, hoy) + 1`, S-19);
  `celdaCSV` (`=`, `+`, `-`, `@`, TAB y CR al inicio → prefijo `'`; comillas, coma y LF → entrecomillada; texto normal intacto; mismas salidas que `csvCampo` de `RemisionesPage.tsx:86` en `5d93eb7` para comillas, coma y LF); `csvDelInforme` (una fila por trimestre y por servicio, columnas del escenario, «informe» con el hueco, una fórmula en `equipo` neutralizada). RQ: RQ-AV-14 (regla), RQ-ZS-15 (exportación), amenaza «fórmulas en el CSV».
- [x] 5.2 Confirmar rojo natural.
- [x] 5.3 GREEN — `ritmoInsuficiente`, `celdaCSV`, `csvDelInforme` (S-17, S-19, S-23).
- [x] 5.4 Confirmar 5.1 en verde.
- [x] 5.5 MUTACIÓN — quitar TAB y CR de los prefijos de `celdaCSV`; 5.1 ROJO. Revertir.
- [x] 5.6 RED — `services/avisoRitmoContrato.test.ts` (nuevo, pg-mem): 3 de 10 con 90/90 tras t1 → un aviso a cada destinatario Comercial, con lote, cliente, 3, 10 y fecha de fin; segunda evaluación en el mismo trimestre (ahora 4 ejecutadas) → cero; trimestre siguiente → otro; 6 de 10 → cero; dentro de t1 → cero; 0 creadas y vencido con ritmo malo → cero;
  `enviado_at` `NULL` y sin canal de correo; **fallo forzado de `crearAviso` → la marca se revierte y no lanza**; `pasadaRitmoContratos` evalúa como mucho una vez por día civil y proceso y nunca lanza. RQ: RQ-AV-14 (7 escenarios), amenaza «un fallo del aviso tumba la sincronización».
- [x] 5.7 Confirmar rojo natural.
- [x] 5.8 GREEN — `avisoRitmoContrato.ts`: `avisarRitmoContratos(db, hoy)` con `UPDATE contratos SET ritmo_avisado_trimestre = $2 WHERE id = $1 AND COALESCE(ritmo_avisado_trimestre,0) < $2 RETURNING id` y `crearAviso` en la misma transacción (patrón de `avisoDiscrepanciaOV.ts:24-46`); `pasadaRitmoContratos`.
- [x] 5.9 Confirmar 5.6 en verde.
- [x] 5.10 MUTACIÓN — (a) quitar `AND COALESCE(…) < $2` del `UPDATE`: «segunda evaluación» ROJA; (b) sacar `crearAviso` de la transacción: «fallo forzado» ROJA. Revertir.
- [x] 5.11 GREEN (sin prueba de unidad del arranque; SÍ una del fichero vigilado, `avisoRitmoContrato.test.ts`, que lee `:15` y `:88`) — `index.ts:15` y `:88` en su sitio; se comprueba por lectura y `npm run typecheck`. La pasada corre antes de `sync.syncRecent()` y no depende de que éste tenga éxito. Hipótesis: `index.ts:85` registra el `setInterval` siempre; la comprueba P.6.
- [x] 5.12 GREEN (sin prueba: `.tsx` fuera de la red, F0-00) — `RemisionesPage.tsx:2` y `:85-88` en su sitio: `const csvCampo = celdaCSV`; la equivalencia queda probada en 5.1.
- [x] 5.13 Cierre del lote 5: `npm test`; `npm run typecheck`; `eslint`; medir (nuevos: `avisoRitmoContrato.ts` y su prueba); recuentos `index.ts` 99 y `RemisionesPage.tsx` 336 sin cambio; barrido de citas sobre `index.ts` (10) y `RemisionesPage.tsx` (3: `:107`, `:119`, `:132`); `apply-progress.md`.

---

## Lote 6 · Interfaz y cierre

**Estimación:** código ~480 · pruebas 0 · artefactos ~90 · **total ~570**. **Depende de:** Lotes 3-5. `apps/desk/src` queda fuera de la red de pruebas (F0-00): sin RED/GREEN para `.tsx`.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `apps/desk/src/components/Configuracion.tsx` (244; 6 citas) | `:2` import; `:33` la unión gana `'contratos'`; `:127` segunda entrada del menú en la misma línea; `:165` segunda sentencia | EN SU SITIO |
| `apps/desk/src/components/TicketDetailView.tsx` (420; 9 citas) | `:15` import; `:320` segundo componente (`MarcaContrato`) en la misma línea | EN SU SITIO |
| `apps/desk/src/api/client.ts` (670) | funciones nuevas | FINAL DE FICHERO |
| `docs/sdd/R08.3_Expediente_de_cambios.md` (657) | texto para el expediente | FINAL DE FICHERO |

Ficheros nuevos: `ContratosPanel.tsx`, `ContratoFicha.tsx`, `MarcaContrato.tsx` (en `apps/desk/src/components/`). Citas a releer: `TicketDetailView.tsx` `:245`, `:208`, `:37`; `Configuracion.tsx` `:118`, `:24`, `:25`. `CLAUDE.md` y `openspec/config.yaml` **no se tocan** (S-10, S-21).

- [ ] 6.1 `client.ts` AL FINAL: `listarContratos`, `crearContrato`, `contratoPorId`, `informeDeContrato`, `contratoDelTicket`.
- [ ] 6.2 `ContratosPanel.tsx` (nuevo): lista y alta; el `403`/`422`/`409` del servidor se enseñan, no se duplican (regla 13, punto 1).
- [ ] 6.3 `ContratoFicha.tsx` (nuevo): datos, saldo, informe por trimestre y botón CSV (`csvDelInforme` de `shared`, BOM y `text/csv;charset=utf-8;`, patrón de `RemisionesPage.tsx:107-115`); el cliente no calcula ninguna cifra.
- [ ] 6.4 `MarcaContrato.tsx` (nuevo): la marca sale sólo de `GET /api/tickets/:id/contrato`.
- [ ] 6.5 `Configuracion.tsx` `:2`, `:33`, `:127`, `:165` en su sitio (entrada «Contratos»).
- [ ] 6.6 `TicketDetailView.tsx` `:15` y `:320` en su sitio.
- [ ] 6.7 Regla de mutación 3 (checklist escrito en `apply-progress.md`, sin código): para cada decisión del cliente, la línea del servidor que la impone, con la línea real (no la del diseño): «Nuevo contrato» sólo Comercial/admin ↔ `routes/contratos.ts` (`403`); formato de lote, fechas, fin ≥ inicio ↔ misma ruta (`422`) y `CHECK`; un contrato por lote ↔ `409` e índice único;
  marca de ticket ↔ `contratoDelTicket`; cifras del informe ↔ ruta del informe; `High` ↔ `ticketService.ts:106`; CSV ↔ ninguna, a propósito (regla en `shared`, probada en node). Sin línea, la decisión es la guarda: se para y se declara.
- [ ] 6.8 Texto para el expediente R08.3, AL FINAL de `docs/sdd/R08.3_Expediente_de_cambios.md` (`toca_maestro: si`, sin tocar el `.docx`): `R08.2.md:2182` define % ejecutado como «consumidas / creadas» y Gerencia lo definió ejecutadas / creadas (`config.yaml:2457`); `:2185` sigue diciendo que no hay dónde guardar el fin de contrato; la prioridad `High` por contrato; el hueco del informe.
- [ ] 6.9 Barrido completo de la regla de mutación 4 sobre los catorce ficheros de `design.md` §8 (`ticketService.ts`, `remision.ts`, `schema.sql`, `migrate.ts`, `app.ts`, `index.ts`, `books/subOV.ts`, `ovAsociaciones.ts`, `calendarioCierres.ts`, `shared/index.ts`, `TicketDetailView.tsx`, `Configuracion.tsx`, `RemisionesPage.tsx`, `client.ts`), con las tres reglas del cierre: dos extremos, forma abreviada, lectura de lo que afirma cada cita. Ninguna edición desplaza líneas, así que es verificación de contenido.
- [ ] 6.10 Comprobar que `git diff --stat HEAD -- CLAUDE.md openspec/config.yaml` está vacío.
- [ ] 6.11 Cierre general: `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; medir el lote (nuevos: tres `.tsx`); recuentos de los ficheros en sitio; confirmar uno a uno los siete criterios de éxito de `proposal.md`; `apply-progress.md`. Para el `archive-report`: una línea con qué parte de la fila F1B-11 cubre (`cierra: no`; la ampliación queda fuera, E-086).

---

## Matriz de cobertura de escenarios (74/74)

«Regresión» = escenario heredado del cambio 2 (ya cubierto por sus tareas 2.x, 4.x, 5.x de `asociacion-ov-ticket`); aquí se comprueba que sigue en verde (2.25-2.26). Los demás (59) son nuevos.

| # | Requisito | Escenario | Lote | Tarea(s) |
|---|---|---|---|---|
| 1 | RQ-TC-08 | El alta sin cambios sigue igual | 2 | regresión; 2.10-2.13, 2.26 |
| 2 | RQ-TC-08 | La asociación vigente por la tercera vía bloquea el alta | 2 | regresión; 2.26 |
| 3 | RQ-TC-08 | Las pruebas de posición existentes no cambian | 2 | 2.25 |
| 4 | RQ-TC-08 | Una subOV de contrato vencido bloquea el alta | 2 | 2.10-2.13 |
| 5 | RQ-TC-08 | El vencido gana al 409 — posición | 2 | 2.10-2.14(a) |
| 6 | RQ-TC-08 | Los faltantes ganan al vencido | 2 | 2.10-2.14(b) |
| 7 | RQ-TC-21 | Comercial registra un contrato | 3 | 3.9-3.12 (base: 1.15-1.21) |
| 8 | RQ-TC-21 | Sin Comercial ni administración, 403 | 3 | 3.9-3.12 |
| 9 | RQ-TC-21 | Un administrador puede crear | 3 | 3.9-3.12 |
| 10 | RQ-TC-21 | Segundo contrato del mismo lote, 409 | 3 | 3.9-3.12 (índice: 1.15, 1.22) |
| 11 | RQ-TC-21 | Contenido inválido, 422 | 3 | 3.9-3.12 (`CHECK`: 1.15, 1.23) |
| 12 | RQ-TC-21 | El permiso gana al contenido, y el contenido a la unicidad | 3 | 3.9-3.14 |
| 13 | RQ-TC-21 | Cualquier usuario con sesión lee, sin sesión no | 3 | 3.5-3.8 |
| 14 | RQ-TC-22 | El día del fin, sigue vigente | 1 | 1.7-1.10 |
| 15 | RQ-TC-22 | El día siguiente al fin, vencido | 1 | 1.7-1.10 |
| 16 | RQ-TC-22 | El día del inicio vigente; el anterior, no iniciado | 1 | 1.7-1.10 |
| 17 | RQ-TC-23 | Asociación vigente a subOV de contrato vigente | 3 | 3.1-3.4 |
| 18 | RQ-TC-23 | Con el contrato vencido, deja de serlo sin escribir | 3 | 3.1-3.4 |
| 19 | RQ-TC-23 | Una asociación liberada no cuenta | 3 | 3.1-3.4 |
| 20 | RQ-TC-23 | OV ordinaria o lote sin contrato no lo convierten | 3 | 3.1-3.4, 3.15 |
| 21 | RQ-TC-23 | Contrato y ticket de clientes distintos | 3 | 3.1-3.4 |
| 22 | RQ-TC-24 | Contrato vigente → `High` aunque el cuerpo traiga `Low` | 2 | 2.5-2.9 |
| 23 | RQ-TC-24 | Contrato vigente y cuerpo sin prioridad → `High` | 2 | 2.5-2.9 |
| 24 | RQ-TC-24 | Sin contrato, todo queda como hoy | 2 | 2.5-2.9 |
| 25 | RQ-TC-24 | Vencido o no iniciado no da prioridad | 2 | 2.5-2.9 |
| 26 | RQ-TC-24 | El día del fin todavía cuenta | 2 | 1.7-1.10, 2.5-2.9 |
| 27 | RQ-TC-24 | Manda el cliente del ticket, no el del contrato | 2 | 2.5-2.9 |
| 28 | RQ-TC-25 | Un lote vencido se rechaza en cada puerta | 2 | 2.10-2.13, 2.15-2.18, 2.20-2.23 |
| 29 | RQ-TC-25 | Un lote sin contrato se consume como hoy | 2 | 2.10, 2.15, 2.20 |
| 30 | RQ-TC-25 | Un contrato aún no iniciado no bloquea | 2 | 2.10, 2.15, 2.20 |
| 31 | RQ-TC-25 | El último día de vigencia todavía se consume | 2 | 1.7-1.10, 2.10 |
| 32 | RQ-TC-25 | Una OV ordinaria u `OVI-` no la activa | 1, 2 | 1.7-1.10, 2.10 |
| 33 | RQ-TC-25 | Vencido y unicidad a la vez — el vencido gana | 2 | 2.14(a), 2.19(a), 2.24(a) |
| 34 | RQ-TC-25 | Cuarentena y vencido, excluyentes | 2 | 2.10-2.13 (sin mutación de posición, declarado arriba) |
| 35 | RQ-TS-14 | `habilitar_servicio` sin OV en cuarentena sigue igual | 2 | regresión; 2.15, 2.26 |
| 36 | RQ-TS-14 | OV en cuarentena bloquea antes de la unicidad | 2 | regresión; 2.26 |
| 37 | RQ-TS-14 | Una subOV de contrato vencido bloquea `habilitar_servicio` | 2 | 2.15-2.18 |
| 38 | RQ-TS-14 | El vencido gana al 409 — posición | 2 | 2.15-2.19(a) |
| 39 | RQ-TS-14 | La persona derivada inválida gana al vencido | 2 | 2.15-2.19(b) |
| 40 | RQ-TS-14 | Lote sin contrato o no iniciado no bloquea | 2 | 2.15-2.18 |
| 41 | RQ-TS-18 | Tras `Aprobación` con OV nueva, la de entrada no cambia | 2 | regresión; 2.26 |
| 42 | RQ-TS-18 | La fecha de OC vive en la asociación nueva | 2 | regresión; 2.26 |
| 43 | RQ-TS-18 | OV adicional de contrato vencido se rechaza en `Aprobación` | 2 | 2.15-2.18 |
| 44 | RQ-TS-18 | El vencido gana al 409 en `Aprobación y S. Repuestos` | 2 | 2.15-2.19(a) |
| 45 | RQ-TS-06 | La fecha derivada inválida responde 422, tras los obligatorios | 2 | regresión; 2.26 |
| 46 | RQ-TS-06 | La guarda de flujo (3) gana a la de estado (4) | 2 | regresión; 2.26 |
| 47 | RQ-TS-06 | El vencido (9) tras los obligatorios (6) y antes de la unicidad (10) | 2 | 2.15-2.19(a)(c) |
| 48 | RQ-RE-16 | Una orden ya asociada a otro ticket se rechaza | 2 | regresión; 2.26 |
| 49 | RQ-RE-16 | El 422 del serial gana al 409 nuevo | 2 | regresión; 2.25 (`remisiones.test.ts:988`) |
| 50 | RQ-RE-16 | Reenviar la misma orden al propio ticket | 2 | regresión; 2.26 |
| 51 | RQ-RE-16 | El UPDATE deja la orden protegida del sincronizador | 2 | regresión; 2.26 |
| 52 | RQ-RE-16 | Una OV en cuarentena bloquea la remisión | 2 | regresión; 2.26 |
| 53 | RQ-RE-16 | El UPDATE también crea la fila de asociación | 2 | regresión; 2.26 |
| 54 | RQ-RE-16 | Una subOV de contrato vencido bloquea la remisión | 2 | 2.20-2.23 |
| 55 | RQ-RE-16 | El vencido gana al 409 de unicidad — posición | 2 | 2.20-2.24(a) |
| 56 | RQ-RE-16 | La remisión pendiente (`:177`) gana al vencido | 2 | 2.20-2.24(c) |
| 57 | RQ-RE-16 | Los ítems fuera del checklist ganan al vencido | 2 | 2.20-2.24(b) |
| 58 | RQ-RE-16 | Lote sin contrato o no iniciado no bloquea la remisión | 2 | 2.20-2.23 |
| 59 | RQ-ZS-15 | Lote de 10 subOV con 3 finalizadas y 2 en curso | 4 | 4.11-4.14 |
| 60 | RQ-ZS-15 | Una asociación liberada devuelve la subOV a libre | 4 | 4.1-4.4, 4.11-4.14 |
| 61 | RQ-ZS-15 | Cuarentena, borrador y anuladas no cuentan | 4 | 4.6-4.10, 4.11 |
| 62 | RQ-ZS-15 | Los trimestres se cuentan desde el inicio | 4 | 4.1-4.5 |
| 63 | RQ-ZS-15 | El % ejecutado es acumulado al cierre | 4 | 4.11-4.15 |
| 64 | RQ-ZS-15 | Cada servicio lleva equipo, serial, tipo, fecha y el hueco | 4 | 4.11-4.14 |
| 65 | RQ-ZS-15 | Sin subOV creadas, 0 % | 4 | 4.11-4.14 |
| 66 | RQ-ZS-15 | Días hasta el vencimiento, vigente y vencido | 4 | 4.1-4.4, 4.11 |
| 67 | RQ-ZS-15 | El informe se exporta como tabla | 5, 6 | 5.1-5.4 (`csvDelInforme`), 6.3 (botón; manual P.6) |
| 68 | RQ-AV-14 | Ritmo insuficiente genera un aviso a Comercial | 5 | 5.1, 5.6-5.9 |
| 69 | RQ-AV-14 | Una segunda evaluación en el mismo trimestre no repite | 5 | 5.6-5.10(a) |
| 70 | RQ-AV-14 | El trimestre siguiente puede avisar de nuevo | 5 | 5.6-5.9 |
| 71 | RQ-AV-14 | Ritmo suficiente no avisa | 5 | 5.1, 5.6-5.9 |
| 72 | RQ-AV-14 | Antes del fin del primer trimestre no se evalúa | 5 | 5.1, 5.6-5.9 |
| 73 | RQ-AV-14 | Sin subOV creadas o con el contrato vencido, no hay aviso | 5 | 5.1, 5.6-5.9 |
| 74 | RQ-AV-14 | El aviso no dispara correo | 5 | 5.6-5.9 |

**74/74 escenarios cubiertos** (34 `tickets-core`, 13 `transitions-st`, 11 `remisiones`, 9 `zoho-sync`, 7 `derivacion-avisos`).
Nota de spec: `RQ-AV-14` define `díasTranscurridos` = hoy − inicio y el diseño (S-19) lo define con +1; con el ejemplo 90/90 no cambia el resultado (proyección 5,97 < 10 en un caso, 12 ≥ 10 en otro), y 5.1 lo fija con `+ 1`.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Cada una con dueño, destino y dónde queda escrita. **Archivar este cambio NO las da por hechas.** Ninguna describe trabajo que una tanda pueda hacer en este repositorio.

- **P.1 · Alfonso** (heredada del cambio 2): ejecuta `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) sobre producción y devuelve la salida; dice cuántas OV caen en cuarentena el día uno. Destino: confirmar el clasificador de subOV. Escrita en: este documento, `proposal.md` §Tareas de persona y `openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket` (ya existe; no se toca).
- **P.4 · Alfonso** (heredada del cambio 2): ejecuta la consulta 5 del mismo `.sql` (valores y recuento de `order_status` y `status` de `books.sales_orders`) y dice qué literales significan borrador y anulada. Destino: confirmar S-11, de la que dependen las «creadas» del % ejecutado (`draft`/`void` siguen como hipótesis). Escrita en los mismos tres sitios.
- **P.5 · Gerencia**: responder E-086 (año y tope de la ampliación de contrato, `docs/sdd/ENTRADA.md:1222`). Destino: desbloquea la ampliación y el cierre de la fila F1B-11. Escrita en: `docs/sdd/ENTRADA.md` (E-086), este documento y `proposal.md` §Fuera.
- **P.6 · Comercial**: tras desplegar el lote 6, registrar un contrato real y comprobar en `ambientalia-desk.ambientalia.cloud`: ticket nuevo en `High`, subOV de contrato vencido rechazada, marca de contrato en la ficha, informe por trimestre y CSV; y que la pasada de ritmo corre (hipótesis de 5.11). Destino: verificación en la app. Escrita en: este documento y `proposal.md`.
- **P.7 · Comercial**: dar de alta los contratos vigentes hoy (dato de producción, sin relleno automático). Destino: sin ellos, prioridad y bloqueo no actúan el día uno (riesgo «Alta» de `proposal.md`). Escrita en: este documento y `proposal.md`.

## Dependencias entre lotes

Lote 1 es la base (tabla, índices, dominio de vigencia, acceso a datos): todo depende de él. Lote 2 (prioridad y guarda en las tres puertas) depende sólo del 1: usa `db/contratos.ts` y `shared/contratos.ts`, no las rutas. Lote 3 (rutas y ticket de contrato) depende del 1 y crea `routes/contratos.ts`, que el lote 4 amplía con la ruta del informe; por eso el 4 depende de 1 y 3. Lote 5 (ritmo, CSV) depende del 4: usa las «creadas» y los estados de `informeContrato`/`estadoSubOV`, y `csvDelInforme` consume la forma del informe. Lote 6 (interfaz y cierre) depende de las rutas del 3, del informe del 4 y de `csvDelInforme` del 5. Una tanda SDD por árbol (regla del ciclo 2): los seis lotes van **en serie**; `verify` y `archive` son intentos aparte del ledger (el archive suma el `git mv` y supera 800 por eso).
