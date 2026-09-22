# Tasks — `fechas-derivadas-servidor` (F1A-07 · IV-2)

**Fase:** `sdd-tasks` · **Árbol:** `f1a-07-r1`, HEAD `2b55272` · **Entradas:** `proposal.md`, `design.md`,
`specs/transitions-st/spec.md`, `specs/trazas/spec.md` de esta misma carpeta. Engram obs. #846.
**Toda cita `ruta:línea` de este documento se lee contra `4976787`** (regla de mutación 4, `CLAUDE.md`),
salvo las de `ticketService.ts:130`/`:132` tras la unidad A, que cambian de CONTENIDO sin moverse.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | Un solo intento no cabe: **770–1.115** (código+pruebas 540–705, cierre documental 80–110, `apply-progress.md`+marcas de `tasks.md` 150–300 — precedente 272). Repartido: **A** 540–710 · **B** 250–385 (`design.md` §10) |
| Riesgo de presupuesto (techo 800 por intento) | **Alto** en un solo intento; **Bajo/Medio** por unidad ya repartida |
| Intentos SDD encadenados recomendados | Sí — 2, en la MISMA rama (regla del ciclo 2) |
| Corte sugerido | Intento 1 «shared + servidor» → Intento 2 «cliente + cierre» |
| Delivery strategy | ask-on-risk |
| Chain strategy | **no aplica** — una sola rama `f1a-07-r1`; dos intentos SDD secuenciales del mismo cambio (regla del ciclo 2), no dos PR ni dos ramas |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| A · shared + servidor | El servidor impone las tres fechas derivadas en columna e historial; `transitionExec.ts`/`repo.ts`/`vitest.config.ts` sin diff; `ticketService.ts`/`bodegaje.ts` con desplazamiento neto 0 | Intento 1 (mismo cambio, mismo commit posterior) | `npx vitest run packages/shared/src/fechasDerivadas.test.ts packages/shared/src/bodegaje.test.ts apps/desk/server/services/valoresDeTransicion.test.ts` | `npm test` completo — arnés `instalarArnes()`/pg-mem existente, sin credenciales Zoho | `git revert` del commit de A: no hay migración; lo escrito son fechas `YYYY-MM-DD` válidas en columnas `date` |
| B · cliente + cierre | El cliente consume la fórmula compartida como comodidad probada; demostración de zona permanente; IV-2 CERRADO en `config.yaml` y `CLAUDE.md`; entrada 16 del maestro | Intento 2 (mismo cambio) | `npx vitest run apps/desk/src/lib/valoresTransicion.test.ts` | N/A — módulo puro sin arnés HTTP; `.tsx` fuera de la red de pruebas por F0-00 | `git revert` del commit de B: el cliente vuelve a `diaLocal` sin afectar al servidor, que ya impone desde A |

---

## Unidad A · shared + servidor

### Fase A.1 — `packages/shared/src/fechasDerivadas.ts` (nuevo)

- [x] A.1.1 **RED (esqueleto).** Crear el fichero con las firmas exportadas de `design.md` §4.1
  (`ZONA_NEGOCIO`, `FUENTE_DE_FECHA`, `EtiquetaFechaDerivada`, `FuenteDeFecha`, `FuentesDeFechas`,
  `diaEnZona`, `fechasDerivadas`, `fuentesQueNecesita`, `valoresEfectivos`), cada cuerpo devolviendo un
  valor trivialmente incorrecto (`null`, `{}`, `new Set()`) para que compile sin `any` (~35 líneas).
- [x] A.1.2 **RED (prueba).** Crear `fechasDerivadas.test.ts`: las **cinco ramas** de `diaEnZona` (A-5:
  `YYYY-MM-DD` real; `YYYY-MM-DD` irreal; instante con `Z`/`±hh:mm` o `Date`; fecha-hora sin
  desplazamiento; valor ilegible); `fechasDerivadas` (las tres fuentes); `valoresEfectivos` (D-1
  recalcula siempre, D-3 mensaje `Fecha inválida en el campo: <label>`, P-2 filtra las tres etiquetas)
  (~90 líneas). Correr `npx vitest run packages/shared/src/fechasDerivadas.test.ts`; confirmar rojo
  **por aserción** (p. ej. `expected '2026-09-09' to be null`), nunca por `Cannot find module`; registrar
  la salida exacta en `apply-progress.md`.
- [x] A.1.3 **GREEN.** Implementar la lógica real: `diaEnZona` con `Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_NEGOCIO, … })` construido **una vez** a nivel de módulo (A-7) y `formatToParts`;
  `fechasDerivadas`/`fuentesQueNecesita`/`valoresEfectivos` por §4.1 (~75 líneas netas sobre el
  esqueleto).
- [x] A.1.4 Correr la prueba de A.1.2, confirmar verde.
- [x] A.1.5 **GREEN (demostración de zona, criterios 6-7).** Añadir a `fechasDerivadas.test.ts` un
  bloque `describe.each(['UTC', 'America/Bogota'])` para el caso `2026-09-10T00:30:00Z` → `2026-09-09`,
  con las **tres condiciones del analista** (obs. #846): (1) autocomprobación propia por bloque —
  `new Date('2026-09-10').getDate()` vale `9` en Bogotá y `10` en UTC —; (2) `vi.stubEnv('TZ', zona)` en
  `beforeAll` y `vi.unstubAllEnvs()` en `afterAll` del bloque; (3) la fase roja de ESTE fichero no puede
  salir aquí —el módulo ya está en verde—: la da la mutación **A.5.5** (la noción vieja de `diaLocal`),
  con comando y salida en `apply-progress.md` (~35 líneas). Correr
  `npx vitest run packages/shared/src/fechasDerivadas.test.ts -t zona`, confirmar verde en los dos bloques.
- [x] A.1.6 Añadir `export * from './fechasDerivadas'` como `packages/shared/src/index.ts:17` (+1 línea).

### Fase A.2 — `packages/shared/src/bodegaje.ts` consume `diaEnZona` (P-3, A-9)

- [x] A.2.1 **RED.** Añadir al final de `bodegaje.test.ts` el caso de `design.md` §6.1: `'Fecha Remisión
  Entrada': '2026-02-02T02:00:00Z'` abre el periodo `2026-02-01` vía `periodosDeBodegaje` (con su
  `paso()`) (~18 líneas). Correr `npx vitest run packages/shared/src/bodegaje.test.ts`, confirmar rojo por
  aserción (`2026-02-02` en vez de `2026-02-01`, día UTC de `toISOString().slice(0,10)`).
- [x] A.2.2 **GREEN, en sitio (A-9).** `bodegaje.ts:19` (línea en blanco) pasa a
  `import { diaEnZona } from './fechasDerivadas'`; `bodegaje.ts:130-132` pasan a dos líneas de comentario
  citando `RQ-TZ-13` + `return diaEnZona(valor)`, borrando el cuerpo viejo de `dia()` (~8 líneas, neto 0
  en el fichero: la cabecera `:1-18` y el resto no se tocan).
- [x] A.2.3 Correr la prueba, confirmar verde.

### Fase A.3 — `valoresDeTransicion.test.ts`: RED contra el `executeTransition` de HOY

- [x] A.3.1 **RED.** Crear `apps/desk/server/services/valoresDeTransicion.test.ts` con `instalarArnes()`
  y `db` (`appHarness.ts:25`, `:34-40`), montaje de precedente leído (§6.1 del diseño: `created_time`
  literal, `INSERT INTO remisiones (…)`, `INSERT INTO ticket_transitions (…, performed_at)`), llamando a
  `executeTransition` **directo**, sin importar el módulo nuevo (aún no existe). Cubrir los **cinco
  criterios de `design.md` §6.2**: (1) navegador ≠ derivado en las tres (`ingreso_a_servicio` desde
  `Ingresado`; `reporte_por_garantia` desde `Notificado`; `created_time`/escalado en
  `2026-09-10T00:30:00Z` → `2026-09-09`) → columna **y** `ticket_transitions.values` con el derivado; (2)
  dos remisiones de entrada vigentes + una anulada + una de salida → `fecha` de la entrada vigente más
  reciente, tal cual; (3) con fuente y sin mandar las fechas → `200`; (4) sin fuente: `2026-02-28` pasa,
  `2026-02-30`/`10/09/2026`/`2026-09-10T00:30` → `422` con el mensaje; (5) P-2: `Fecha Remisión Entrada`
  enviada en `escalado_a_revision` y en `reporte_por_garantia` no llega al historial (~130 líneas).
- [x] A.3.2 **RED — posición (regla de mutación 1, casos naturales).** Añadir **P-a**: `ingreso_a_servicio`
  sin remisión, `Fecha Remisión Entrada: '2026-02-30'` **y** `derivado_a: 'no-existe'` → `errors =
  ['Fecha inválida en el campo: Fecha Remisión Entrada']` (sin el error de derivación). **P-b**: lo mismo
  sin `Código Servicio` → `errors = ['Falta el campo obligatorio: Código Servicio', 'Fecha inválida en el
  campo: Fecha Remisión Entrada']`, en ese orden exacto (~25 líneas).
- [x] A.3.3 Correr `npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts`, confirmar rojo
  **por aserción contra el código de hoy** en los 5 criterios y en P-a/P-b (el servidor de hoy no deriva
  nada); registrar cada salida exacta en `apply-progress.md`. **Excepción declarada:** en el criterio 4,
  `2026-02-28` sin fuente ya pasa hoy; ese caso nace VERDE y se registra como no regresión, no como rojo.

### Fase A.4 — GREEN: módulo servidor + `ticketService.ts` en sitio

- [x] A.4.1 Crear `apps/desk/server/services/valoresDeTransicion.ts` (`design.md` §4.2):
  `valoresConFechasDerivadas(db, current, t, recibidos)` — `fuentesQueNecesita(t)` vacío →
  `valoresEfectivos(t, recibidos, {})` sin consultas; si no, `iso(current.row.created_time)`,
  `listRemisionesByTicket` (`remisiones.ts:76-79`) si pide `remisionEntrada`,
  `instanteUltimaTransicion(db, id, 'escalado_a_revision')` (`fechasTicket.ts:22-35`) si pide
  `escaladoARevisionAt` (~35 líneas).
- [x] A.4.2 Editar `apps/desk/server/services/ticketService.ts` **en sitio**, texto exacto de `design.md`
  §3: `:6` funde los dos imports de `@ambientalia/shared` en una línea; `:7` nuevo,
  `import { valoresConFechasDerivadas } from './valoresDeTransicion'`; `:130` pasa a
  `const { values, erroresFecha } = await valoresConFechasDerivadas(db, current, t, b.values)`; `:132`
  pasa a `if (plan.errors.length || erroresFecha.length) throw new HttpError(422, { errors:
  [...plan.errors, ...erroresFecha] })`. `:131` y `:153` no se tocan (~8 líneas, neto 0).
- [x] A.4.3 Correr `npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts`, confirmar verde
  en los 5 criterios y en P-a/P-b.

### Fase A.5 — Mutaciones de comprobación (evidencia obligatoria en `apply-progress.md`)

**Antes de mutar:** `git add` de todos los ficheros de la unidad A, nuevos y modificados, para fijar el
estado verde en el índice. `git diff` no ve un fichero nuevo sin trackear, y un «diff vacío» sobre
`ticketService.ts` sería falso con los cambios de A.4.2 sin commitear. Cada mutación se revierte con
`git checkout -- <fichero>` (restaura desde el índice) y se confirma con `git diff -- <fichero>` vacío.

- [x] A.5.1 **Mutación P-a (regla de mutación 1).** Mover temporalmente la comprobación de `erroresFecha`
  de `ticketService.ts:132` a **después** de la guarda de derivación (`:136-140`) — p. ej., separar el
  `throw` de fecha inválida en un bloque propio tras esas líneas. Correr P-a; confirmar que se pone rojo
  (la respuesta pasa a ser la de derivación, no la de fecha). Revertir y confirmar como dice el preámbulo.
- [x] A.5.2 **Mutación P-b.** Invertir el `spread` de `:132` a `[...erroresFecha, ...plan.errors]`. Correr
  P-b; confirmar rojo (el orden de `errors` cambia). Revertir y confirmar.
- [x] A.5.3 **Mutación P-2.** Quitar temporalmente el filtro de las tres etiquetas en `valoresEfectivos`
  (dejar que `recibidos` se copie entero). Correr el criterio 5; confirmar rojo. Revertir y confirmar
  sobre `fechasDerivadas.ts`.
- [x] A.5.4 **Mutación `diaEnZona`, día UTC.** Sustituir temporalmente la conversión de instantes por
  `toISOString().slice(0, 10)` (día UTC puro, ignorando `ZONA_NEGOCIO`). Correr el bloque de zona de A.1.5;
  confirmar rojo en **los dos bloques** (dan `2026-09-10`, no `2026-09-09`, porque el día UTC no depende de
  la zona del proceso). Revertir y confirmar.
- [x] A.5.5 **Mutación `diaEnZona`, la noción vieja — fase roja de la demostración de zona de shared
  (condición 3 del analista).** Sustituir temporalmente la conversión de instantes por los getters locales
  de `diaLocal` (`getFullYear`/`getMonth`/`getDate`, la zona del proceso). Correr
  `npx vitest run packages/shared/src/fechasDerivadas.test.ts -t zona`; confirmar **bloque UTC rojo**
  (`'2026-09-10'`) y **bloque Bogotá verde EN FALSO**, con las dos autocomprobaciones en verde. Registrar
  comando y salida en `apply-progress.md`. Revertir y confirmar.

### Fase A.6 — Invariantes (verificación, no código)

- [x] A.6.1 `git diff --stat -- apps/desk/server/transitionExec.ts` → vacío.
- [x] A.6.2 `git diff --stat -- packages/zoho-sync/src/db/repo.ts` → vacío.
- [x] A.6.3 `git diff --stat -- vitest.config.ts` → vacío (P-4 retirada).
- [x] A.6.4 `ticketService.ts` con desplazamiento neto 0: `git diff --stat -- apps/desk/server/services/ticketService.ts`
  sin líneas añadidas netas (`+N -N` con `N` igual) y `wc -l` del fichero idéntico antes/después.
- [x] A.6.5 `bodegaje.ts` con desplazamiento neto 0: mismo método sobre
  `packages/shared/src/bodegaje.ts`.

### Fase A.7 — Cierre de la unidad A

- [x] A.7.1 **Tarea docker** (`design.md` §6.5):
  `docker run --rm node:22-alpine node -e "…"` (script literal del diseño), esperando `2026-09-09`. Si la
  máquina no tiene docker, escribir «no ejecutable» en `apply-progress.md`, nunca «verde».
- [x] A.7.2 `npm test` completo, **en solitario** (sin otros procesos en paralelo), verde.
- [x] A.7.3 `npm run typecheck`, en solitario, verde.
- [x] A.7.4 `npm run lint`, en solitario, verde.
- [x] A.7.5 Cerrar el `apply-progress.md` de A: evidencia RED/GREEN de A.1.2/A.1.5/A.2.1/A.3.3, las
  cinco mutaciones de A.5 con su reversión confirmada, resultado de A.7.1, y medida
  `git diff --shortstat --no-renames` contra el commit base del intento 1 (el que añade este `tasks.md`) +
  `wc -l` de lo nuevo sin trackear (~110–150 líneas de informe).
- [x] A.7.6 **Commit de la unidad A** (conventional commit), **antes** del `sdd-attempt settle` del
  intento 1.

---

## Unidad B · cliente + cierre

### Fase B.1 — `apps/desk/src/lib/valoresTransicion.ts` + demostración de zona

- [x] B.1.1 **RED — invertir pruebas viejas.** `valoresTransicion.test.ts:33-40` («lo que el ticket ya
  guarda gana sobre lo derivado») y `:117-123` (misma afirmación para `Fecha Revisión Informe`): cambiar
  la expectativa a que gane **lo derivado**, no lo ya guardado. Nombrarlas explícitamente como
  inversiones en el comentario del `it`. Correr, confirmar rojo contra el código actual (~15 líneas
  modificadas).
- [x] B.1.2 **RED — caso nuevo.** Añadir «sin fuente, la columna se prellena»: sin remisión ni
  `createdAt`/`escaladoARevisionAt`, el valor ya presente en `customFields` se conserva para teclear (~12
  líneas). Correr, confirmar rojo.
- [x] B.1.3 **RED — repropósito de `:100-104` como demostración de zona.** `:100-104` («el día es el
  local, no el recorte del instante en UTC»), tautológica desde que el cálculo deja de depender de la
  zona del navegador, se reescribe como el bloque `describe.each(['UTC', 'America/Bogota'])` para
  `2026-09-10T00:30:00Z` → `2026-09-09`, con las **mismas tres condiciones del analista** que A.1.5
  (autocomprobación propia, `vi.stubEnv`/`vi.unstubAllEnvs` por bloque, fase roja con comando y salida en
  `apply-progress.md`) (~40 líneas). Correr `npx vitest run apps/desk/src/lib/valoresTransicion.test.ts -t
  zona`; confirmar rojo **natural**: bloque UTC rojo (`'2026-09-10'`), bloque Bogotá verde **en falso**
  (todavía usa `diaLocal`, que depende de la zona del proceso, no de `ZONA_NEGOCIO`); registrar la salida
  exacta.
- [x] B.1.4 **GREEN.** Reescribir `valoresTransicion.ts` en sitio (`design.md` §4.3): `:1` añade los
  nombres importados dentro de sus llaves; cabecera `:3-17` reescrita; `valoresConocidos` pasa a
  `derivadas[etiqueta] ?? (yaEsta(cf[etiqueta]) ? cf[etiqueta] : null)` con
  `derivadas = fechasDerivadas({ createdAt, remisiones, escaladoARevisionAt })`; se borra `diaLocal`
  (`:22-36`) (≈ −20 líneas netas desde `:21`, ≈ +8 nuevas; `:3` no se mueve).
- [x] B.1.5 Correr `npx vitest run apps/desk/src/lib/valoresTransicion.test.ts`, confirmar verde: las dos
  inversiones (B.1.1), el caso sin fuente (B.1.2) y los dos bloques de zona (B.1.3).

### Fase B.2 — Regla de mutación 3, por escrito

- [x] B.2.1 Transcribir y verificar contra el código final la tabla de `design.md` §9 (qué decide el
  cliente — prellena, bloquea, deja teclear — y la línea del servidor que lo impone, o «ninguna, a
  propósito» cuando corresponda) en `apply-progress.md` de B, sección `## Regla de mutación 3`.

### Fase B.3 — Regla de mutación 4, barrido

- [x] B.3.1 `grep -rnoE "valoresTransicion\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio + segundo pase de
  forma abreviada en los ficheros que ya citan el módulo; comprobar los dos extremos de cada rango.
  Reapuntar `openspec/config.yaml:434` (ficha IV-2) y `docs/sdd/F0-00_Baseline_as-built.md:147`, `:574`;
  reapuntar las abreviadas de la fila IV-2 de `CLAUDE.md` (`:3-17`, `:49-79`) con las líneas de después de
  editar.
- [x] B.3.2 Barrido de `bodegaje.ts`: los **cuatro** rangos desplazados una línea de `design.md` §8
  (`openspec/config.yaml:468`, `openspec/specs/trazas/spec.md:274`, `CLAUDE.md:338`,
  `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:224`; el bloque real es `:59-65`). Clasificar
  caso a caso A/presente, B/histórico o C/superado y reparar según el caso (nunca renumerar en bloque).
- [x] B.3.3 Comprobación dirigida de `ticketService.ts:130` y `:132`: confirmar que toda cita viva que los
  nombre describe el contenido **nuevo** (`valoresConFechasDerivadas`; el `422` con
  `[...plan.errors, ...erroresFecha]`), no el viejo (`transitions-st/spec.md:162`, fila 5 de RQ-TS-06,
  entre otras).
- [x] B.3.4 **Barrido de los tres documentos que la propia unidad B mueve**, DESPUÉS de B.4, B.5 y B.6:
  `CLAUDE.md` (B.4.2 quita una fila de la tabla e inserta un párrafo; B.4.3 añade otro),
  `openspec/config.yaml` (B.4.1 añade campos a la ficha IV-2) y `docs/sdd/ENTRADA.md` (B.6.1 alarga
  E-021 y desplaza E-022 y E-023). `grep -rnoE` de `CLAUDE\.md:[0-9]+`, `config\.yaml:[0-9]+` y
  `ENTRADA\.md:[0-9]+` sobre el repositorio, más el segundo pase de abreviadas; cada resultado se
  comprueba LEYENDO qué afirma, y se repara por caso A/B/C. `F0-01_Correcciones_para_el_maestro.md` sólo
  crece al final (B.5.1): confirmar que ninguna cita apunta más allá de su última línea de hoy.

### Fase B.4 — IV-2 → CERRADO

- [x] B.4.1 `openspec/config.yaml`: ficha IV-2 (`:423-477`) — `estado: VIVO` → `CERRADO`, con campo nuevo
  citando la fecha/tanda que cierra (F1A-07, 2026-09-21) y la evidencia (`fechasDerivadas.ts` +
  `valoresConFechasDerivadas` + los criterios 1-5/P-a/P-b/mutaciones en verde).
- [x] B.4.2 `CLAUDE.md`: quitar la fila de la regla 1 (`valoresTransicion.ts`, hoy `:338`) de la tabla de
  incumplimientos vivos, e insertar el párrafo «**IV-2 está CERRADO…**» en su lugar en la secuencia ya
  usada (tras «IV-1 está CERRADO…», orden ascendente de ID), citando qué lo cierra.
- [x] B.4.3 `CLAUDE.md`: actualizar el numeral superior «**Cinco**» → «**Cuatro**» (`:308`) y **añadir** un
  párrafo nuevo (no reescribir los anteriores, caso B de la regla de mutación 4 aplicada al propio
  recuento) — «Y un cuarto movimiento, el 2026-09-21, que devuelve el encabezado a CUATRO» — con su
  propia lista «Los cuatro de hoy son: `ticketService.ts:39` (clientId), `por-entregar-es-espera`
  (color), IV-11 e IV-12». Las narraciones de 2026-09-16 y 2026-09-17 quedan intactas.

### Fase B.5 — Maestro: entrada 16

- [x] B.5.1 Redactar la entrada 16 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, formato de las
  entradas 14/15 (`## La de F1A-07 (16)` con nota de contexto, `### 16 · <título> *(F1A-07)*`): texto
  actual de M1.10 (`R08.2.md:1756-1757`, con la regla de fondo «no admite excepciones» en `:1755`) frente
  al texto propuesto, que documenta la vía sin fuente (D-3: el servidor acepta lo tecleado si es una
  fecha real cuando no hay fuente, en vez de ignorar sin más lo que llegue del navegador).

### Fase B.6 — E-021

- [x] B.6.1 Actualizar E-021 en `docs/sdd/ENTRADA.md` (`:279-287`) con el resultado de la tarea docker
  de A.7.1: estado del hallazgo, si la hipótesis de ICU completo en `node:22-alpine` quedó respondida por
  el `node -e` local, y remitir la comprobación de producción (§ comprobaciones de persona) como
  pendiente aparte.

### Fase B.7 — Cierre de la unidad B

- [x] B.7.1 `npm test` completo, en solitario, verde.
- [x] B.7.2 `npm run typecheck`, en solitario, verde.
- [x] B.7.3 `npm run lint`, en solitario, verde.
- [x] B.7.4 Cerrar el `apply-progress.md` de B: evidencia roja de B.1.3 (bloque UTC rojo, Bogotá verde en
  falso), la tabla de B.2.1, el barrido de B.3, la medida del intento 2 (`git diff --shortstat
  --no-renames` contra el commit de la unidad A + `wc -l` de lo nuevo sin trackear) y la acumulada A+B
  contra el commit base de la tanda (~60–100 líneas de informe).
- [x] B.7.5 **Commit de la unidad B** (conventional commit), **antes** del `sdd-attempt settle` del
  intento 2.

---

## Comprobaciones de persona — fuera del recuento (regla del ciclo 1)

Archivar esta tanda **no las da por hechas**. Ninguna de las dos describe trabajo que una tanda pueda
hacer en este repositorio: la (a) exige acceso a la consola de EasyPanel del contenedor real; la (b)
exige acceso a la base de producción, que este repositorio no tiene (`MCP de Zoho Books roto`: sin
`psql` ni `DATABASE_URL` local).

- **(a) Zona horaria en el contenedor real.** Qué: el mismo `node -e` de A.7.1 y
  `node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"`, ejecutados en el
  contenedor de producción. Dueño: quien tenga la consola de EasyPanel. Dónde queda escrito: E-021 de
  `docs/sdd/ENTRADA.md` y el `archive-report.md`.
- **(b) Operandos de bodegaje fuera del formato esperado (P-3, `design.md` §12.2).** Qué: contar en
  `ticket_transitions.values` los valores de las seis etiquetas de `BODEGAJES` que no casen
  `^\d{4}-\d{2}-\d{2}$`, para confirmar o descartar la hipótesis de que P-3 no mueve ningún bodegaje
  real. Dueño: quien tenga acceso a la base de producción. Dónde queda escrito: nueva entrada en
  `docs/sdd/ENTRADA.md` y el `archive-report.md`.

## Para el archive — no es trabajo de `sdd-apply`

- **Anclas de los bloques `MODIFIED`/`ADDED` de los dos deltas** (`specs/transitions-st/spec.md`,
  `specs/trazas/spec.md`) se comprueban contra el árbol **del momento del archive**, no contra `4976787`
  ni contra el estado tras B.7.5: `ticketService.ts:130` y `:132` cambian de contenido sin moverse, y toda
  cita que los nombre en los deltas fusionados tiene que describir ese contenido nuevo. Es lo que falló
  en F1B-10 (E-023).
- **La línea de `cierra` del `archive-report.md`** nombra el hueco residual de `Fecha Remisión Entrada`
  tecleada sin remisión de entrada en Desk → dueño **F1B-03** (`plan:158`); no es un desvío vivo nuevo
  (`proposal.md` §4).

## Riesgos de dependencia entre fases

- A.4 (GREEN del servidor) depende de que A.3 (RED) esté commiteado en rojo genuino primero: escribir
  el módulo antes que la prueba dejaría sin demostrar que el servidor de HOY ignora las fuentes.
- Las cuatro mutaciones de A.5 dependen de A.4 en verde; mutar antes daría un rojo que no prueba nada
  sobre la posición o el filtro.
- B.1.3 (demostración de zona del cliente) depende de que A.1.5 exista primero, como precedente de
  forma: reutiliza el mismo patrón `describe.each` + tres condiciones ya probado en shared.
- B.3 (barrido) depende de que B.1, B.4, B.5 y B.6 estén terminados —se ejecuta DESPUÉS de ellas aunque
  vaya numerada antes—: los números finales de línea sólo se leen del fichero después de editar, nunca
  de un mapa de renumeración previo (regla de mutación 4).
- El intento 2 (B) no puede lanzarse mientras el intento 1 (A) tenga un `sdd-attempt acquire` abierto sin
  `settle`: una tanda SDD por árbol de trabajo (regla del ciclo 2).
