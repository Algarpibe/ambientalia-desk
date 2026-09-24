# Apply progress — `alta-equipo-nuevo-en-ticket` (F1B-14, cambio 1)

**Fase:** `sdd-apply` · Ejecutado 2026-09-24 contra HEAD `817eba3` (planificación commiteada, sin
drift respecto a `ea23634`: `git diff ea23634 817eba3 -- <ficheros citados>` vacío). Modo: strict
TDD. 40/40 tareas de `tasks.md` marcadas `[x]`.

## T0 — sonda de atomicidad (Fase 0, bloqueante)

**Resultado: ROJO.** `apps/desk/server/db/transaccion.test.ts`: `BEGIN` + `INSERT` + `ROLLBACK`
sobre `pool.connect()` de pg-mem, comprobado fuera de esa conexión: `COUNT(*) = 1`, no 0. pg-mem no
revierte un `ROLLBACK` de verdad — confirma la hipótesis de `auth/users.ts:147`.

**Plan elegido: Plan B.** Rastreador de verbos (molde `salesRecords.test.ts:5-16`), usado en Fase 1
(`transaccion.test.ts`) y Fase 6 (`equipoNuevo.test.ts`) en vez de comprobar filas reales tras un
`ROLLBACK`. El propio T0 quedó como test de regresión, con la aserción invertida (`toBe(1)`, no
`toBe(0)`) y un comentario explicando el resultado — si una versión futura de pg-mem empezara a
revertir de verdad, este test se pondría en rojo y avisaría de que el Plan B ya no hace falta.

## TDD Cycle Evidence

| Fase | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 0 (T0) | `db/transaccion.test.ts` | Unit (pg-mem) | N/A (nuevo) | ✅ Escrito | ✅ Confirma rojo real | ➖ Sonda única | ➖ N/A |
| 1 | `db/transaccion.test.ts` | Unit (rastreador) | N/A (nuevo) | ✅ Escrito, módulo no existía | ✅ 3/3 pasan | ✅ 2 casos (éxito/fallo) | ✅ Limpio |
| 2 | `packages/zoho-sync/src/db/repo.test.ts` | Integration (pg-mem) | ✅ 19/19 previas | ✅ Escrito, `connect` fingido lanzaba | ✅ 20/20 | ➖ Single (flag booleano) | ➖ No hacía falta |
| 3 | `apps/desk/server/db/equipos.test.ts` | Integration (pg-mem) | ✅ 26/26 previas | ✅ Escrito, función no existía | ✅ 30/30 | ✅ 4 casos (normaliza, inexistente, dup-activo, dup-inactivo) | ✅ `trim()` SQL→JS (pg-mem no lo soporta, ver Hallazgo) |
| 4+5 (fusionadas) | `ticketService.test.ts` | Integration (pg-mem) | ✅ 24/24 previas | ✅ Escritos, rama no existía | ✅ 48/48 | ✅ Criterios 1-4, 6 | ✅ Limpio |
| 6 | `equipoNuevo.test.ts` | Unit (rastreador) | N/A (nuevo) | ✅ Escrito | ✅ 4/4 | ✅ 2 casos (éxito/fallo) | ✅ Limpio |
| 7 (P1-P7) | `ticketService.test.ts` + mutación temporal | Integration (pg-mem) | ✅ 48/48 previas | ✅ 6 `it` nuevos + reuso de «criterio 5» para P7 | ✅ verde con orden correcto | — | — |
| 9 | `CreateTicket.tsx` | N/A — fuera de la red de pruebas (F0-00) | N/A | N/A | N/A | N/A | N/A |

**Desviación Fase 4/5 (declarada):** las tareas 4.1-4.3 (RED/GREEN de `exigirEquipoNuevo`) y 5.1-5.3
(integración) se ejecutaron como UN SOLO ciclo RED→GREEN, no dos secuenciales. Razón técnica: los
criterios 3 («faltan datos del equipo nuevo») y 4 («campo opcional inválido») sólo son observables a
través de `createManagedTicket` completo — `exigirEquipoNuevo` en aislamiento no basta, porque la
validación C de campos opcionales corre APARTE, en `ticketService.ts`, no dentro de
`exigirEquipoNuevo` (ver «Hallazgo — dónde vive la validación C» más abajo). Escribir el RED de 4.1
exigía por tanto que 5.2 ya existiera. Las 5 tareas quedan marcadas `[x]`; el desglose de test/evidencia
de arriba las funde en la fila «4+5».

### Test Summary
- **Total tests nuevos**: 24, contados por `it(` en el diff contra HEAD (`git diff -U0 817eba3`):
  3 en `db/transaccion.test.ts` + 4 en `services/equipoNuevo.test.ts` + 4 en `db/equipos.test.ts`
  + 1 en `packages/zoho-sync/src/db/repo.test.ts` + 12 en `services/ticketService.test.ts`
  (criterios 1-6 + P1-P6)
- **Total tests pasando**: 1345/1345 (suite completa; HEAD tenía 1321, +24 de este cambio; 2
  `it.skip` preexistentes sin relación)
- **Layers**: Integration (pg-mem) 20, Unit (rastreador de verbos, sin BD) 4
- **Pure functions creadas**: `enTransaccion<T>` (genérica sobre `fn`), `getEquipoBySerial` (lectura
  pura); `exigirEquipoNuevo`, `validarCamposEquipoNuevo` y `crearTicketConEquipo` hacen I/O (DB) y no
  son puras — de los 5 módulos nuevos, 2 son funciones puras

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test enfocado | `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/services/equipoNuevo.test.ts apps/desk/server/db/equipos.test.ts apps/desk/server/db/transaccion.test.ts packages/zoho-sync/src/db/repo.test.ts` → 5 ficheros, 104 tests, 0 fallos |
| Arnés de runtime | `npm test` completo contra pg-mem (sin credenciales Zoho): 138 ficheros, 1345 tests, 2 skipped (preexistentes) |
| Rollback boundary | `git revert` de los 4 ficheros nuevos + 9 modificados; sin migración, sin estado persistido. Los equipos creados en producción antes del revert quedan como filas válidas de Registro de equipos |

## Hallazgo — dónde vive la validación C de campos opcionales

`design.md` §1 (fila 7) y `tasks.md` 4.2 son ambiguos sobre si la validación de los 4 campos
opcionales (mantenedor, 3 fechas, Drive) vive DENTRO de `exigirEquipoNuevo` o APARTE. Las pruebas de
posición P2 y P3 del propio `design.md` (§1) sólo tienen sentido si vive APARTE, después de la
guarda de la orden de venta:

- P2 (`validar los campos DENTRO de exigirEquipoNuevo, antes de resolver el modelo`) sólo es una
  mutación real si hoy NO vive ahí.
- P3 (`subir la validación C por encima de la guarda de OV — molde IV-12`) exige que hoy viva
  DESPUÉS de esa guarda.

**Implementación elegida:** `equipoNuevo.ts` exporta `exigirEquipoNuevo` (guarda 1 + guarda 2 +
resolución, llamada en `ticketService.ts:25`) y, por separado, `validarCamposEquipoNuevo` (llamada en
`ticketService.ts:91`, la última guarda del escalón C, justo antes del `409` de la OV). Las 7 pruebas
de posición (P1-P7) confirman este orden — ver tabla siguiente.

## Hallazgo — pg-mem no soporta `trim()` en SQL

`design.md` §3 proponía `WHERE lower(trim(serial)) = lower(trim($1))`. pg-mem no implementa
`trim()` («function trim(text) does not exist», verificado al ejecutar). El resto del repositorio ya
recorta en JS antes de escribir (`routes/equipos.ts:50`, `db/catalogo.ts:227`), así que
`getEquipoBySerial` sigue esa misma convención: `serial.trim().toLowerCase()` en JS, `lower(serial)`
en SQL (verificado: `lower()` sí funciona en pg-mem, ya usado en `searchEquipos`).

## Fase 7 — P1-P7, pruebas de posición (regla de mutación 1)

Cada mutación se aplicó, se corrió la suite completa de `ticketService.test.ts`, se confirmó el
resultado, y se revirtió por diff exacto (confirmado con `diff` contra una copia snapshot del fichero
antes de mutar — ver «Fase 8» abajo). Ninguna mutación quedó sin revertir.

| P | Mutación aplicada | Resultado |
|---|---|---|
| P1 | Bajar la guarda 1 (equipoId/`exigirEquipoNuevo`) por debajo de la guarda de la OV | Rojo el `it` de P1 nombrado, **y también** el preexistente «el equipo que falta gana a la orden de venta inexistente» — mismo par de guardas (guarda 1 vs OV), dos caminos de código (rama «Equipo nuevo» vs genérica) que la mutación mueve juntos por estar en el mismo bloque. Corroboración, no fuga: ningún `it` de un par DISTINTO se puso rojo |
| P2 | Mover `validarCamposEquipoNuevo` DENTRO de `exigirEquipoNuevo`, antes de `getModelo` | Rojo P2 **y también** P3, P4, P5 — hallazgo estructural: cualquier mutación que adelante la validación-C hasta el principio del todo la pone por delante de TODAS las guardas intermedias, no sólo de `getModelo`. Documentado, no es un fallo del test: revela que P2-P5 forman una cadena anidada de la MISMA guarda contra guardas sucesivas, y el desplazamiento grande de P2 activa las de más abajo de rebote |
| P3 | Subir `validarCamposEquipoNuevo` por encima de la guarda de la OV (molde IV-12) | Rojo P3, P4, P5 (mismo fenómeno de cadena anidada que P2, alcance menor porque el punto de inserción es más tardío). P1 y P6 NO se vieron afectados |
| P4 | Subir `validarCamposEquipoNuevo` por encima de la guarda equipo↔cliente | Rojo P4, P5 (cadena anidada, alcance aún menor). P3 NO se vio afectado, confirmando que la guarda de existencia de OV queda intacta |
| P5 | Intercambiar `validarCamposEquipoNuevo` con la guarda de cliente-existe (swap adyacente) | Rojo **sólo** P5 — aislamiento perfecto, el par de guardas elegido aísla exactamente lo que P5 afirma |
| P6 | Bajar `validarCamposEquipoNuevo` por debajo del `409` de la OV ya usada | Rojo **sólo** P6 — aislamiento perfecto |
| P7 | Mover la creación del equipo/ticket (`crearTicketConEquipo`) antes de la guarda de la OV ya usada | Rojo **sólo** el `it` de «criterio 5» (P1-P7 reutiliza ese `it`, mismo escenario) — aislamiento perfecto |

**Sobre P2-P4 (regla del ciclo — 8.2):** las tres rompieron más de un `it`. Se investigó cada caso: en
los tres, los `it` adicionales afectados comparten la MISMA guarda mutada (`validarCamposEquipoNuevo`)
contra guardas DISTINTAS que están, en el código correcto, más cerca del punto de destino de la
mutación que del punto de origen — es decir, mover la validación-C muy arriba la pone por delante de
TODO lo que había entre su posición original y la nueva, no sólo de la guarda nombrada por el P en
cuestión. No se ajustó el código de producción (el orden hoy es el que design.md pide y las pruebas
P5-P7, con mutaciones adyacentes/precisas, demuestran aislamiento perfecto). Se registra como hallazgo
en vez de forzar un P2-P4 con mutación adyacente, porque la mutación tal como la especifica
`design.md` (`:89` → dentro de `exigirEquipoNuevo`, y saltos de varias guardas) ya es la que el diseño
pide probar.

## Fase 8 — cierre de mutaciones

- **8.1**: cada mutación de las Fases 0 (T0, permanente por diseño — ver arriba), 1 (implícita, sin
  mutación aplicada aparte del RED natural) y 7 (P1-P7) se revirtió confirmando `diff` vacío contra una
  copia snapshot tomada inmediatamente antes de mutar. `git diff --stat` sobre `ticketService.ts` y
  `equipoNuevo.ts` al cierre de la Fase 7 coincide EXACTAMENTE con el diff de la Fase 5/6 (ninguna
  mutación sobrevivió).
- **8.2**: ver tabla de arriba — P1-P4 tuvieron colateral documentado y explicado; P5-P7 aislaron
  perfectamente.

## Fase 9 — Cliente (`CreateTicket.tsx`, sin red de pruebas por F0-00)

Bloque «Equipo nuevo» añadido: estado (serial, modelo, 3 fechas, código interno, Drive, mantenedor
con buscador `searchClients`), visible sólo con `clasificaciones === 'Equipo nuevo'` y sin `equipo`
elegido. Guarda de `submit` extendida para aceptar el bloque completo como alternativa a `equipo`.
`equipoNuevo?: {...}` añadido a `CreateTicketPayload` (`packages/shared/src/types.ts`), campo nuevo,
sin tocar los existentes. Vista previa de código/asunto usa la serie y el modelo del catálogo cuando
no hay `equipo` elegido — comodidad; el servidor sigue aceptando el valor recibido sin derivarlo.
Verificación de persona pendiente en `ambientalia-desk.ambientalia.cloud` (fuera del alcance de
`sdd-apply`, por F0-00).

## Fase 10 — Cierre

- **10.1** `npm test`: **138 ficheros, 1345 tests pasando, 2 `it.skip` preexistentes** (sin relación
  con este cambio, en `packages/zoho-sync/src/db/migrate.integration.test.ts`).
- **10.2** `npm run typecheck`: verde, sin salida.
- **10.3** `npm run lint -- --max-warnings 165`: verde, **165 warnings, 0 errores**. Medido el
  baseline REAL contra HEAD limpio (`git stash -u` + lint + `git stash pop`): también 165. **0
  warnings nuevos.** Nota de método: `tasks.md:202` citaba una base de 158 de un precedente anterior;
  la base HOY, medida de verdad, es 165 — el número de `tasks.md` está desfasado (regla de método:
  verificar, no citar de memoria), pero la comparación que importa (antes/después de este cambio) da
  0 nuevos en los dos casos.
- **10.4** Barrido de citas — ver sección propia abajo.
- **10.5** Esta sección.

## Barrido de citas (regla de mutación 4)

**`repo.ts`, `db/equipos.ts`, `routes/equipos.ts`: VERIFICADO sin desplazamiento**, confirmado con
`git diff --no-color -U0 817eba3 -- <fichero>`: `repo.ts` sólo cambia contenido en `:380` y `:404`
(mismas líneas); `db/equipos.ts` sólo AÑADE al final (tras `:380`, cero impacto en líneas previas);
`routes/equipos.ts` sólo cambia contenido en `:144` (misma línea). Ninguna cita a estos tres ficheros
necesita reparación.

**`ticketService.ts`: desplazamiento real, mapa de líneas verificado contra el fichero (no
calculado a ciegas):**

| Rango original | Rango nuevo | Motivo |
|---|---|---|
| `:1-17` | sin cambio | imports, sólo contenido de `:2` cambia |
| `:18-23` | `+1` | `:18` pasa de blanco a `import ./equipoNuevo` |
| `:24-88` | `+2` | inserción de `const nuevo = ...` en `:25` |
| `:89-93` (comentario de 5 líneas) | `:92-95` (reescrito, 4 líneas) + `:91` nueva llamada | contenido reescrito, no sólo desplazado |
| `:94-`fin | `+2` | neto de las dos inserciones anteriores |

Reparadas contra el árbol de hoy (Caso A, verificado línea a línea contra el fichero real, no sólo
calculado):

- `openspec/changes/alta-equipo-nuevo-en-ticket/specs/tickets-core/spec.md` (la propia delta de este
  cambio): 9 citas — RQ-TC-04 (`:22-25`→`:23-27`, `:102-103`→`:104-105`), RQ-TC-05 (rango de función
  `:20-109`→`:21-111`, las 7 filas de la tabla de precedencia, `:85`→`:87`, `:101`→`:103` con cambio
  de nombre `createTicket`→`crearTicketConEquipo`, `:37`/`:39`→`:39`/`:41`).
- `CLAUDE.md`: 9 citas (`:43-77`→`:45-79`, cuatro `:39`→`:41`, `:59-71`→`:61-73`,
  `:59-77`→`:61-79`, `:148`→`:150`, `:130`/`:132`→`:132`/`:134`).
- `openspec/config.yaml`: 9 citas (mismo patrón: `:39`→`:41` ×3, `:59-71`→`:61-73`,
  `:59-77`→`:61-79`, `:148`→`:150`, `:94-98`→`:96-100`, `:130`→`:132`).
- Ficheros de código/test que citan `ticketService.ts` en comentarios: `contratoErrores.test.ts` (2),
  `ordenVentaUnTicket.test.ts` (2, dejando `:45`/`:134` en `b99d47a` como Caso B histórico sin tocar),
  `remisiones.test.ts` (1), `routes/remision.ts` (1), `valoresTransicion.ts` (1),
  `fechasDerivadas.ts` (1), `services/ticketService.test.ts` (el propio, `:87-92`→`:83-90`).

**NO reparadas — declaradas, no silenciadas:**

- `openspec/specs/tickets-core/spec.md` y el resto de `openspec/specs/*.md` (`permissions`,
  `transitions-st`, `trazas`, `derivacion-avisos`, `remisiones`): decenas de citas a
  `ticketService.ts` desplazadas por el mismo shift (incluye TODO el rango de `executeTransition`,
  `:111` en adelante, aunque su contenido no cambió). **Fuera de alcance de `sdd-apply` a propósito**:
  `CLAUDE.md` mismo declara que «Fusión del delta de tickets-core en `openspec/specs/`: trabajo de
  `sdd-archive`» — fusionar y reparar la spec viva es tarea de esa fase, no de ésta.
- `openspec/config.yaml:545` (`ticketService.ts:89`, «El 403 lo lanza») y `:579`/`:602`
  (`ticketService.ts:45-48`/`:134-135`), `permisos.test.ts:30` (`:89`) y `:53` (`:86`),
  `transicionesEjecucion.test.ts:115` (`:86`), `remisiones.test.ts:903` (`:53-58`): **hallazgo
  independiente de esta tanda** — estas citas NO corresponden a ninguna línea de `ticketService.ts`
  que exista hoy NI en el árbol previo a este cambio (verificado: el contenido real de esas líneas es
  otro, con un desfase de decenas de líneas, muy superior al `+2` que este cambio introduce). Son
  citas ya rotas ANTES de `alta-equipo-nuevo-en-ticket` — mutación de una tanda anterior no detectada
  en su momento. No se reparan aquí por incertidumbre del destino real (repararlas mal sería peor que
  dejarlas), y porque no las rompió este cambio (regla de mutación 4 protege contra el daño de ESTA
  tanda). Quedan registradas para que `sdd-verify` o una tanda de citas decida su destino real.
- El resto de citas en `docs/sdd/*.md` (documentos fechados: `Decisiones_Gerencia_2026-09-10.md`,
  `Puntos_para_Gerencia_2026-09-11.md`, `F0-00_Baseline_as-built.md`, `Paquete_de_Despliegue…`, etc.)
  y en `openspec/specs/*` no listadas arriba: **Caso B por convención de fecha** (documentos
  fechados/cerrados que registran el estado en su momento) o fuera del rango `:24-`fin (sin impacto).
  No revisadas una a una por presupuesto de la fase; ningún indicio de que compartan el patrón roto
  de la lista anterior.

## Desviaciones de diseño (resumen)

1. **Legibilidad sobre desplazamiento cero** (decisión del orquestador, ya declarada en `tasks.md`):
   `:24-25` se escriben como dos `const` naturales, no comprimidos. Aceptado, motivó el barrido
   completo de la Fase 10.4.
2. **Fases 4 y 5 fusionadas** en un solo ciclo RED→GREEN (ver «TDD Cycle Evidence»).
3. **`trim()` SQL → JS** en `getEquipoBySerial` (pg-mem no soporta `trim()`; ver Hallazgo).
4. **Validación C separada de `exigirEquipoNuevo`**, no incluida en ella (ver Hallazgo) — necesario
   para que P2/P3 de `design.md` §1 tengan sentido como mutaciones.

## Medida final

```
git diff --numstat --no-renames (19 ficheros trackeados, incluye tasks.md y este informe NO —
apply-progress.md es nuevo, sin trackear):
  456 insertions(+), 100 deletions(-) = 556

wc -l de lo nuevo sin trackear:
  apps/desk/server/db/transaccion.test.ts                                  100
  apps/desk/server/db/transaccion.ts                                        28
  apps/desk/server/services/equipoNuevo.test.ts                             93
  apps/desk/server/services/equipoNuevo.ts                                  92
  openspec/changes/alta-equipo-nuevo-en-ticket/apply-progress.md (este)    233
  ------------------------------------------------------------------------------
  total nuevo sin trackear                                                 546
```

**GRAN TOTAL: 556 + 546 = 1102 líneas — por encima del techo de 800.**

Desglose: implementación + tests + barrido de citas = 789 (medido antes de este cierre). `tasks.md`
(40 casillas `[ ]`→`[x]`, sin texto nuevo) = 80. Este informe = 233. Los últimos dos son el sumando
obligatorio de cierre que `CLAUDE.md` (regla del ciclo 2) exige contar, no un extra — pero llevan el
total un 38 % por encima del techo. Reportado sin maquillar: la implementación por sí sola (789) ya
estaba pegada al límite, y el cierre (313 más) lo cruza. El orquestador decide con
`gentle-ai sdd-attempt`; esta fase NO ejecuta `settle`.
