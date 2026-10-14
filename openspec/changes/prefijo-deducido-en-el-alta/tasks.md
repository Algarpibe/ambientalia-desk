# Tareas — El prefijo del código de servicio se deduce y lo impone el servidor (`prefijo-deducido-en-el-alta`, F1B-03, `cierra: si`)

Propuesta: `proposal.md`. Delta: `specs/tickets-core/spec.md` (RQ-TC-03, -05 y -10 modificados; RQ-TC-61, -62 y -63 nuevos). Diseño canónico: `design.md` (DD-1 a DD-11, §3 a §9, mutaciones M-1 a M-17). El diseño manda sobre la propuesta. Supera a propósito el tope de 530 palabras de la skill: el encargo pide lotes, mutaciones y cierres por escrito.

**Reglas de todos los lotes.** Worktree `C:\dev\Desk_2_R1.023-worktrees\prefijo-deducido-en-el-alta`. Techo 800, válvula 720. No hay PR: la rama se fusiona a `main` tras verify, después del `settle`. Strict TDD: la prueba ROJA va antes que el código y el rojo se VE (se corre y se lee el fallo; no vale un error de sintaxis) y se anota en `apply-progress.md`. Cada mutación se reproduce, se ve el rojo, se RESTAURA y se anota la restauración (`git diff` limpio del fichero mutado). Los ficheros muy citados conservan su número de líneas (DD-4, DD-7, DD-9, §4, §5): si una tarea ve moverse una línea, para y lo anota. Una línea prevista o en blanco se nombra en prosa, nunca con forma de cita. Sin pruebas `.tsx` (F0-00, Gerencia). Sin migración, sin esquema, sin `.env.example`. Esta rama NO toca `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md` ni la spec viva.

## Review Workload Forecast

| Lote | Contenido | Ingenua | Estimado (x 1,8) | Riesgo vs. 800 |
|------|-----------|---------|------------------|----------------|
| 1 · `shared` | `prefijoDeducido`, «Protocolo», AAMMDD de Bogotá, pruebas, compilación mínima del cliente | 130 | ~235 | Low |
| 2 · Servidor | `ticketService.ts` (5 líneas), `ticketService.test.ts` en sitio, `prefijoDeducidoAlta.test.ts` | 175 | ~315 | Low |
| 3 · Cliente y retiradas | `CreateTicket.tsx`, DD-7, DD-9, borrado de pruebas, corrección del maestro | 85 | ~155 | Low |
| **Total** | | 390 | **~705** | |

`apply-progress.md` (~100 líneas: rojos, mutaciones, tabla de la regla 3, barridos) se reparte por lote (~30/~45/~25). Medida del ledger sobre `tasks.md`: sólo cuenta si este fichero queda SIN commitear al abrir el intento A; el orquestador debe commitear proposal, spec, design y tasks en la rama ANTES de abrir el intento (así el commit de partida los absorbe).

**Agrupación en intentos del registro (comprobada).** A = lotes 1+2: ~235 + ~315 + ~75 de `apply-progress.md` = **~625**, bajo 720 con ~95 de margen **sólo si `tasks.md` va commiteado de partida**; con `tasks.md` sin commitear (~200 líneas) serían ~825: sobre el techo. B = lote 3: ~155 + ~25 = **~180**. `verify` y `archive` van en intentos propios y aparte (el informe que cada fase genera es sumando obligatorio). **Punto de decisión en 2.1:** tras cerrar el lote 1 se mide; si lote 1 > 300 o la proyección de A pasa de 720, el lote 1 se asienta solo (intento A1) y el lote 2 abre otro (A2): un intento por lote. Los tres lotes juntos (~885) NO caben en uno.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High (total ~705, ~810 con informes; el presupuesto del proyecto es 800 por intento, no 400, y no hay PR)
800-line budget risk: Low (ningún lote pasa de ~315; A, ~625, queda bajo la válvula)

Líneas estimadas totales: ~705 de código y pruebas más ~100 de `apply-progress.md` (~805); delivery strategy `ask-on-risk` fijado, resuelto aquí por la regla de medición de 2.1.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| L1 | Deducción pura en `shared` (~235) | commit L1 (intento A) | `npx vitest run packages/shared/src/ticketCreate.test.ts packages/shared/src/flujos.test.ts packages/shared/src/invariantesGrafo.test.ts` | N/A: función pura; la cubren las pruebas y el ciclo de importación lo confirma la suite | Revertir el commit: vuelve `defaultPrefijoFor`; `CreateTicket.tsx:3` y `:415` vuelven con él |
| L2 | El alta deduce e impone (~315) | commit L2 (intento A) | `npx vitest run apps/desk/server/services apps/desk/server/tickets.test.ts` | pg-mem real con `createManagedTicket` y `SELECT codigo_servicio, subject FROM tickets` (DD-11) | Revertir el commit: el alta vuelve a leer `b.prefijo`, `b.codigoServicio` y `b.subject` |
| L3 | Cliente sin desplegable, retiradas, maestro (~155) | commit L3 (intento B) | `npx vitest run packages/shared apps/desk/src` | N/A: los `.tsx` están fuera de la red (F0-00); `npm run typecheck` y `npm run build` cubren el cliente | Revertir el commit: vuelve el desplegable y el payload con tres campos; el servidor sigue ignorándolos |

Dependencias: L2 de L1; L3 de L1 y L2. Orden: L1 → L2 → L3 → cierre.

---

## Lote 1 · `shared` — la deducción (intento A)

**Ficheros:** `packages/shared/src/ticketCreate.ts` (líneas 2-4, la línea 6 en blanco, 8-9, 46-49 y el final), `packages/shared/src/ticketCreate.test.ts`, `apps/desk/src/components/CreateTicket.tsx` (sólo las líneas 3 y 415, mínimo para compilar).

- [ ] 1.1 Anotar el commit de partida (`968bb53` más los artefactos), abrir el intento A y anotar `wc -l` de `ticketCreate.ts` (49), `ticketCreate.test.ts`, `types.ts` y el recuento de avisos de `npm run lint` (línea base; el CI no tiene holgura, `eslint.config.js:14-15`).
- [ ] 1.2 **Rojo, S-4 (rojo natural primero)** en `ticketCreate.test.ts`: `buildCodigoServicio` con `2026-10-14T20:00:00-05:00` y con `2026-10-14T00:30:00-05:00` da `…_261014`, bajo `TZ=UTC` (`vitest.config.ts:7`). Ver el rojo con el código de hoy (getters locales dan `261015` y `261014` según la hora).
- [ ] 1.3 **Rojo** `describe('prefijoDeducido')` reemplazando `defaultPrefijoFor`: las cinco filas (HV, SR, CG, PRO, MT); los seis tipos a `MT`; tipo fuera de la lista (`Inspección`) a `MT`; la clasificación gana al tipo (`Equipo nuevo`+`Calibración`, `Soporte remoto`+`Protocolo`); desconocida y vacía con `Calibración`/`Protocolo`/`Garantía` a `CG`/`PRO`/`MT` sin lanzar; mismos predicados que el grafo (`equipo nuevo`, ` Equipo   Nuevo `, `soporte REMOTO`, y `Equipo nuevo usado` a `MT`); literal exacto (`calibracion`, `PROTOCOLO` a `MT`); los cinco alcanzables (el conjunto es exactamente `PREFIJOS`).
- [ ] 1.4 **Rojo** `TIPOS_SERVICIO` con orden exacto de ocho (`Calibración`, `Diagnóstico`, `Garantía`, `Mantenimiento`, `Reparación`, `Protocolo`, `No aplica`, `Otro`) e índice 5 de `Protocolo`; las aserciones de las líneas 14-19 se conservan.
- [ ] 1.5 **Rojo** AAMMDD con `process.env.TZ = 'America/Bogota'` restaurado en `finally` (hipótesis: Node relee `TZ` en caliente; si no, basta `UTC` y se anota).
- [ ] 1.6 **Ver el rojo:** `npx vitest run packages/shared/src/ticketCreate.test.ts`; leer cada fallo (import inexistente de `prefijoDeducido` incluido) y anotarlos en `apply-progress.md`.
- [ ] 1.7 **Verde, `ticketCreate.ts` en sitio (DD-1 a DD-6):** líneas 2-3 con «Protocolo» y línea 4 con ocho tipos; las dos importaciones de DD-4 en la línea 6 (hoy en blanco), sin insertar líneas; líneas 8-9 con `diaEnZona(d) ?? ''` y `slice(2).replace(/-/g, '')`; `prefijoDeducido` en el sitio de `defaultPrefijoFor` (cuerpo de una línea de §3); al final, comentario de una línea y las constantes `TIPO_CALIBRACION` y `TIPO_PROTOCOLO` tipadas contra `TIPOS_SERVICIO`. Confirmar `wc -l`: 49 + 3 = 52 y que ninguna línea existente se movió.
- [ ] 1.8 **Rojo natural de la fecha vieja:** correr la suite y ver que `ticketCreate.test.ts:24` (`new Date(2026, 5, 4)`, medianoche local, el 3 de junio en Bogotá bajo `TZ=UTC`) se pone roja sola; anotar el fallo. **Reescribirla** con el instante explícito `2026-06-04T12:00:00-05:00` (mismo esperado `…_260604`).
- [ ] 1.9 **Compilación mínima del cliente** (`CreateTicket.tsx`): línea 3 sin `defaultPrefijoFor` y con `prefijoDeducido`; línea 415 con `setPrefijo(prefijoDeducido(clasificaciones, e.target.value))`. El resto del cliente es del lote 3. Ajustar la línea 2 de `ticketCreate.test.ts` (importación de `defaultPrefijoFor` fuera, `prefijoDeducido` dentro; `parseCodigoFromPotential` se queda hasta el lote 3).
- [ ] 1.10 **Ver el verde:** `npx vitest run packages/shared/src/ticketCreate.test.ts packages/shared/src/flujos.test.ts packages/shared/src/invariantesGrafo.test.ts`. Esto confirma además la hipótesis del ciclo `ticketCreate ↔ flujos` (DD-3, R-1): si falla al cargar, anotar y aplicar el respaldo del diseño (mover `CLASIFICACIONES`) sólo con decisión del orquestador.
- [ ] 1.11 **Mutaciones M-1 a M-5** (cambiar el prefijo de cada fila: HV, SR, CG, PRO, MT): debe ponerse roja el escenario de esa fila en `ticketCreate.test.ts`. Mutar, ver rojo, RESTAURAR, anotar.
- [ ] 1.12 **M-6** (evaluar el tipo antes que la clasificación): rojo en «la clasificación gana al tipo». **M-7** (sustituir los predicados por `=== 'Equipo nuevo'`): rojo en «mismos predicados que el grafo» (` Equipo   Nuevo `). **M-8** (plegar caja/tilde del tipo): rojo en «literal exacto». Restaurar cada una.
- [ ] 1.13 **M-9, parte `shared`** (`yymmdd` con getters locales o `new Date()` sin zona): rojo en las dos fechas de 1.2 y 1.5. **M-14** (quitar «Protocolo» de la línea 4): rojo de `tsc` (`npm run typecheck`, por DD-5) y del orden exacto de ocho. **M-15** («Protocolo» tras los comodines): rojo en el orden exacto y en la aserción de las líneas 14-19. Restaurar.
- [ ] 1.14 Cierre, cada código MIRADO por separado: (1) `npm test`; (2) `npm run typecheck`; (3) `npm run lint` sin avisos nuevos frente a 1.1; (4) `node_modules/.bin/tsx apps/desk/server/citas/cli.ts`. Pruebas de otras suites que mandan `prefijo: 'CG'` con otra clasificación (`tickets.test.ts`, `remisiones.test.ts`, `flujoSoporteRemoto.test.ts`) deben seguir en verde.
- [ ] 1.15 **Medir** `git diff --shortstat --no-renames` contra el commit de 1.1 más `wc -l` de lo nuevo sin trackear; registrar. **Decisión de agrupación (2.1):** si lote 1 > 300 o proyección de A > 720, asentar el intento aquí y abrir otro para el lote 2.
- [ ] 1.16 Commit del lote 1 (conventional, sin atribución de IA); `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`, código MIRADO.

---

## Lote 2 · Servidor — el alta deduce e impone (intento A, o A2)

**Ficheros:** `apps/desk/server/services/ticketService.ts` (líneas 6, 82, 87, 101 y 102, en sitio), `apps/desk/server/services/ticketService.test.ts` (en sitio), `apps/desk/server/services/prefijoDeducidoAlta.test.ts` (nuevo, DD-10).

- [ ] 2.1 Si 1.15 decidió partir, abrir intento A2 y anotar el commit de partida; si no, seguir en A. Anotar `wc -l` de `ticketService.ts` y `ticketService.test.ts`.
- [ ] 2.2 **Rojo** `prefijoDeducidoAlta.test.ts` (nuevo; molde del arnés de `ticketService.test.ts`; día fijado con `vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime`; lectura de `SELECT codigo_servicio, subject FROM tickets`, DD-11): las cuatro ramas (`HV_`, `SR_`, `CG_`, mantenimiento+`Reparación` a `MT_`); `PRO_S1_M1_261014` con equipo serial `S1`, modelo `M1`; día de Bogotá a las `20:00-05:00` y `00:30-05:00` bajo `TZ=UTC`.
- [ ] 2.3 **Rojo, RQ-TC-62 completo** en el mismo fichero: el prefijo del cuerpo se ignora (`Equipo nuevo` con `prefijo: 'CG'` da `HV_`); el código del cuerpo se ignora; el asunto del cuerpo se ignora (el guardado no contiene el texto tecleado); `prefijo: 'XX'` crea (`201`); sin `prefijo` crea; sin cliente, tipo ni clasificaciones: `422 'Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones'` sin la palabra «prefijo»; cliente viejo con los tres campos sobre `Soporte remoto` crea con `SR_`.
- [ ] 2.4 **Rojo, pruebas de POSICIÓN (regla de mutación 1) para M-17:** tres pruebas que activan dos guardas a la vez con `prefijo: 'XX'`: (a) equipo↔cliente discrepante: `422` de equipo↔cliente; (b) obligatorios que faltan: `422` exacto sin «prefijo»; (c) OV ya asociada a otro ticket con el resto válido: `409`. Nacen verdes (la guarda del prefijo no existe): su rojo sale por mutación en 2.12.
- [ ] 2.5 **Rojo, en sitio en `ticketService.test.ts`:** invertir las seis líneas que fijaban `prefijo: 'XXX'` a `422` (prefijo `'XXX'` crea, código `MT_…`); las demás aserciones que nombran «prefijo» pierden «, prefijo» (líneas 278, 353, 367 y 428 del diseño). La línea 252 conserva `prefijo: 'MT'` (cuerpo viejo, se ignora).
- [ ] 2.6 **Ver el rojo:** `npx vitest run apps/desk/server/services`; leer cada fallo y anotarlo.
- [ ] 2.7 **Verde, `ticketService.ts` en sitio (§4):** línea 6 importa `prefijoDeducido` en lugar de `PREFIJOS`; línea 82 `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)` con su comentario RQ-TC-61/62; línea 87 comentario de una línea en lugar de empujar «prefijo»; línea 101 `buildCodigoServicio` siempre; línea 102 `buildSubject` siempre con el código construido. Confirmar `wc -l` igual que en 2.1 y que no queda importación sin uso.
- [ ] 2.8 **Ver el verde:** `npx vitest run apps/desk/server/services apps/desk/server/tickets.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/flujoSoporteRemoto.test.ts`.
- [ ] 2.9 **Mutaciones M-1 a M-5 en el alta:** cambiar el prefijo de cada fila en `prefijoDeducido` y ver rojo también en `prefijoDeducidoAlta.test.ts`. **M-9, parte alta:** `yymmdd` con getters locales: rojo en las dos fechas del alta. Restaurar.
- [ ] 2.10 **M-10** (la línea 82 vuelve a leer `b.prefijo`): rojo en «el prefijo del cuerpo se ignora» y «cliente viejo crea igual». **M-11** (la línea 101 vuelve a leer `b.codigoServicio`): rojo en «el código del cuerpo se ignora». **M-12** (la línea 102 vuelve a leer `b.subject`): rojo en «el asunto del cuerpo se ignora». Restaurar cada una.
- [ ] 2.11 **M-13** (la línea 87 vuelve a empujar «prefijo» si falta en el cuerpo): rojo en el `422` exacto sin «prefijo» y en la inversión de las seis líneas de 2.5. Restaurar.
- [ ] 2.12 **M-17, regla de mutación 1 (posición):** insertar `if (b.prefijo && !PREFIJOS.includes(b.prefijo)) throw 422` en tres sitios, uno a uno: antes de equipo↔cliente (debe caer 2.4 a), entre obligatorios y cliente (2.4 b) y antes del `409` (2.4 c). Cada una debe poner roja la prueba que le corresponde; si alguna sigue verde, la posición no está probada: anotarlo como hallazgo y reforzar la prueba. Restaurar.
- [ ] 2.13 **Mutante equivalente de posición:** mover la llamada a `prefijoDeducido` antes de cualquier guarda (p. ej. antes de la línea 24) y correr la suite; el resultado ESPERADO es verde (pura, total, sin `throw`). Anotar «equivalente, sigue verde» y restaurar.
- [ ] 2.14 **Regla de mutación 3, parte servidor (por escrito en `apply-progress.md`):** abrir la tabla «decisión del cliente → línea del servidor → prueba `.ts`» del diseño §5 y rellenar con las líneas REALES leídas del fichero ya editado: prefijo mostrado (línea 82), código mostrado (101), asunto mostrado (102), código y asunto no editables (101-102 dejan de leer `b`), cliente viejo (RQ-TC-62), y las dos filas SIN contrapartida (lista de tipos, lista de clasificaciones: líneas 85 y 86, declaradas como carencia preexistente, fuera de alcance). Comprobar decisión a decisión que cada línea DICE lo que la fila afirma.
- [ ] 2.15 Cierre, cada código MIRADO por separado: (1) `npm test`; (2) `npm run typecheck`; (3) `npm run lint` sin avisos nuevos frente a 1.1; (4) `node_modules/.bin/tsx apps/desk/server/citas/cli.ts`.
- [ ] 2.16 **Medir** (`git diff --shortstat --no-renames` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear); si el intento A pasa de 720, parar y partir.
- [ ] 2.17 Barrido de la regla de mutación 4 de `ticketService.ts`, con los comandos del diseño §4 (primer y segundo comando: citas a las líneas 6, 82, 87, 101, 102 y rangos que las cubren). Las cinco líneas cambiaron lo que dicen aunque no se movieron: leer cada resultado y clasificar A/B/C (4.3). Resultado por fichero en `apply-progress.md`. Segundo pase de las abreviadas en los ficheros que ya citan el módulo.
- [ ] 2.18 Commit del lote 2; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`, código MIRADO; **asentar el intento A** (o A2).

---

## Lote 3 · Cliente y retiradas (intento B)

**Ficheros:** `apps/desk/src/components/CreateTicket.tsx` (§5, en sitio), `packages/shared/src/types.ts` (líneas 322-326), `packages/shared/src/ticketCreate.ts` (líneas 20-24), `packages/shared/src/ticketCreate.test.ts` (borrado de `parseCodigoFromPotential`), `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (sección nueva AL FINAL).

- [ ] 3.1 Abrir el intento B; anotar el commit de partida y `wc -l` de `CreateTicket.tsx`, `types.ts`, `ticketCreate.ts` (52), `ticketCreate.test.ts` y `F0-01_Correcciones_para_el_maestro.md`.
- [ ] 3.2 **Rojo, M-16 por construcción (DD-9):** primero mutar a propósito, para ver el rojo que prueba la retirada: devolver `prefijo` al literal de `createTicket` en `CreateTicket.tsx` (propiedad sobrante) con el tipo ya recortado; `npm run typecheck` debe fallar. Anotar la hipótesis de DD-9 como CONFIRMADA o REFUTADA. Restaurar y seguir.
- [ ] 3.3 **`types.ts` en sitio (DD-9):** `CreateTicketPayload` pierde `prefijo`, `codigoServicio` y `subject`; las líneas 322-323 pasan a `ordenVenta` y `prioridad`, y 324-326 a un comentario de tres líneas. Mismo recuento.
- [ ] 3.4 **`CreateTicket.tsx` en sitio (§5):** línea 3 sin `PREFIJOS`, `parseCodigoFromPotential` ni `defaultPrefijoFor`; línea 46 `const prefijo = prefijoDeducido(clasificaciones, tipoServicio)`; líneas 83-84 los estados `subjectOverride`/`codigoOverride` se van, dos líneas de comentario; 154-156 comentario de vista previa; 157 y 161-162 sin overrides (también de las dependencias del `useMemo`); 172-173 dos líneas de comentario (la oportunidad de CRM ya no fija el prefijo, S-3); 230 y 232 fuera `prefijo`, `subject` y `codigoServicio: codigo` del cuerpo; 415 sólo `setTipoServicio`; 423-425 el `select` pasa a un `span` de tres líneas «Prefijo: {prefijo} · lo deduce el sistema»; 434 y 436 `readOnly`, sin `onChange`, con `bg-slate-50`. Confirmar `wc -l` igual que en 3.1. Sin prueba `.tsx` (F0-00).
- [ ] 3.5 **Retirada DD-7:** `parseCodigoFromPotential` (líneas 20-24 de `ticketCreate.ts`) se sustituye por un comentario de CINCO líneas que dice qué hubo, por qué se fue y en qué revisión está (`968bb53`); borrar su bloque de `ticketCreate.test.ts` (líneas 36-45) y su importación. Confirmar que `extractServiceCode` y `prefijoDeducido` no se movieron (`wc -l` igual que en 3.1).
- [ ] 3.6 **Ver el verde:** `npx vitest run packages/shared apps/desk/server apps/desk/src` y, aparte, `grep -rn "defaultPrefijoFor\|parseCodigoFromPotential" apps packages --include=*.ts --include=*.tsx` sólo debe nombrar el comentario de 3.5.
- [ ] 3.7 **Regla de mutación 3, cierre por escrito (M-21 en espíritu):** completar en `apply-progress.md` la tabla de §5 con las líneas del cliente (46, 154-157, 230, 232, 415, 423-425, 434-436) frente a la línea REAL del servidor de 2.14; mutar cada línea de imposición del servidor (mover o quitar) y ver que alguna prueba de L2 se queja; si ninguna, la fila es «hipótesis» y se anota así. Las dos filas sin contrapartida van declaradas.
- [ ] 3.8 **Corrección para el maestro (tarea de la rama, no de persona):** leer `R08.4.md:1170` y la fila del Anexo G col. 27 contra el maestro vigente ANTES de citarlas (regla de método). Añadir AL FINAL de `F0-01_Correcciones_para_el_maestro.md` la sección «La de F1B-03, prefijo deducido (24)»: M1.1 `R08.4.md:1170` marcado como superado y reescrito con la tabla de deducción de RQ-TC-61 (los cinco prefijos se conservan porque Drive nombra carpetas e informes con ellos); Anexo G col. 27 con ocho valores (añade `Reparación` y `Protocolo`). Sin menciones a reuniones. Confirmar que ninguna línea previa del fichero se movió.
- [ ] 3.9 Cierre, cada código MIRADO por separado: (1) `npm test`; (2) `npm run typecheck`; (3) `npm run lint` sin avisos nuevos frente a 1.1; (4) `node_modules/.bin/tsx apps/desk/server/citas/cli.ts`; (5) `npm run build` (cubre los `.tsx`).
- [ ] 3.10 **Medir** (`git diff --shortstat --no-renames` contra el commit de 3.1 más `wc -l` de lo nuevo sin trackear); si pasa de 720, parar y partir (cliente / maestro).
- [ ] 3.11 Barrido de citas de `CreateTicket.tsx`, `types.ts`, `ticketCreate.ts` y `ticketCreate.test.ts` con los comandos del diseño §4 (tercer y cuarto comando), segundo pase de las abreviadas, clasificación A/B/C (4.3). Resultado en `apply-progress.md`.
- [ ] 3.12 Commit del lote 3; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`, código MIRADO; asentar el intento B.

---

## Cierre de apply

- [ ] 4.1 Sobre `HEAD` de la rama: `npm test`, `npm run typecheck`, `npm run lint` (sin avisos nuevos), `npm run build`, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts`; CADA código de salida MIRADO por separado.
- [ ] 4.2 Comprobar con `git diff --stat <partida>..HEAD` que NO tienen diff: `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `.env.example`, `openspec/specs/` y `packages/zoho-sync/src/db/schema.sql` (sin migración).
- [ ] 4.3 **Barrido de la regla de mutación 4, completo,** sobre `ticketService.ts`, `ticketCreate.ts`, `types.ts` y `CreateTicket.tsx` (más `ticketCreate.test.ts` y `ticketService.test.ts`): ejecutar los cuatro `git grep` del diseño §4 y, además, `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre `apps/`, `packages/`, `openspec/` (incluido `changes/archive/`) y `docs/`; CADA resultado contra el fichero y contra lo que la frase afirma. Revisar a mano las conocidas del diseño: `openspec/config.yaml:4714` y `:4726`, `openspec/specs/tickets-core/spec.md:564`, `:1463`, `:2371`, `docs/sdd/ENTRADA.md:296`, `docs/sdd/F0-00_Baseline_as-built.md:314`, y `debt.md:765-771` (M-7, M-8). Clasificar: **A** (afirma algo que sigue cierto: reapuntar a hoy), **B** (histórico: anclar a `968bb53`, no renumerar), **C** (superado: conservar con su revisión y anotar que lo cerró este cambio; caso de `debt.md:765-771`). Las que viven en ficheros que esta rama no toca (`ENTRADA.md`, `config.yaml`, la spec viva, `debt.md`) se LISTAN para Supervisión, no se editan. Segundo pase de la forma abreviada (`:82`, `:87`, `:101-102`) en los ficheros que ya citan estos módulos.
- [ ] 4.4 Rellenar `apply-progress.md`: rojos vistos por pieza, tabla M-1 a M-17 (mutada, rojo visto, restaurada), regla 1 (M-17 y el equivalente), regla 3 (tabla completa), hipótesis resueltas (DD-3, DD-9, TZ en caliente) y medidas por intento.

---

## Cobertura: escenario → tarea

| Requisito | Escenarios | Tarea |
|---|---|---|
| RQ-TC-61 | Cinco ramas, un tipo fuera de la lista, la clasificación gana, desconocida o vacía, mismos predicados, literal exacto, alcanzables | 1.3 |
| | «Protocolo» sexta con comodines al final | 1.4 |
| | El día es el de Bogotá | 1.2, 1.5, 2.2 |
| | El alta guarda el código; una alta por rama | 2.2 |
| | Los tickets existentes no cambian | 4.2 (sin migración, sin diff de esquema) |
| RQ-TC-62 | Prefijo, código y asunto del cuerpo ignorados; prefijo inválido; sin prefijo; cliente viejo | 2.3 |
| | La deducción no mueve la escalera; fila 5 sin «prefijo» | 2.4, 2.5 |
| RQ-TC-63 | Regla 13 la impone el servidor y está probada | 2.14, 3.7 |
| | Tres escenarios manuales (formulario) | P-1 (persona) |
| RQ-TC-03 / -05 / -10 | Delta editado en sitio; spec viva no se toca en esta rama | 4.2 |

Escenarios sin asignar: ninguno.

---

## Tareas de persona — archivar no las da por hechas

Fuera del recuento y sin casillas: ninguna describe trabajo que una tanda pueda hacer en este repositorio (comprobado). Archivar el cambio NO las da por hechas.

| # | Tarea | Dueño | Qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Verificar en la aplicación tras el despliegue los tres escenarios manuales de RQ-TC-63 (sin desplegable de prefijo; la vista previa sigue a clasificación y tipo; el código del ticket creado coincide) | Quien despliega, con Gerencia | Dar por visto lo que ningún `.ts` prueba | RQ-TC-63 y `archive-report.md` |
| P-2 | Pegar en el maestro (`.docx`) la corrección de M1.1 y del Anexo G col. 27 ya escrita en la rama | Gerencia | Que el maestro deje de contradecir la decisión del 14/10 | Sección (24) de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-3 | Decidir si «Ingreso a Servicio» puede seguir reescribiendo el código con cualquier prefijo (H-1 de la propuesta) | Gerencia | Cerrar la segunda vía de escritura | Entrada de bandeja que registra Supervisión al cierre (esta rama no toca `ENTRADA.md`) |
| P-4 | Confirmar que n8n trata «Protocolo» como texto libre (hipótesis heredada) y revisar los avisos de la lista semanal de supuestos S-1 a S-7 | Quien administra n8n; Gerencia | Que S-1 a S-7 dejen de ser supuestos reversibles | Lista semanal de supuestos |

---

## Key Learnings

- El agrupamiento A (lotes 1+2) sólo cabe bajo 720 (~625) si `tasks.md` y los artefactos van commiteados de partida; sin eso son ~825. Por eso 1.15 mide y decide.
- El único rojo natural es la fecha: `ticketCreate.test.ts:24` se pone roja sola con `TZ=UTC` al adoptar `diaEnZona`; hay que verla roja antes de reescribirla.
- La regla de mutación 1 aquí es una ausencia: M-17 prueba que NO existe guarda del prefijo en ningún escalón, y mover la llamada pura a `prefijoDeducido` es un mutante equivalente que debe seguir verde.
- Casi todo el cambio es «en sitio»: el riesgo real son las citas que cambian de significado sin moverse (cinco líneas de `ticketService.ts`), que sólo el barrido de 4.3 caza.
