# Tareas: aviso «En garantía» y «Garantía sin dato» (F1B-18)

Dos lotes, cada uno su intento del registro (`gentle-ai sdd-attempt`), techo 800 y válvula 720 (reparto del orquestador sobre el §10 del diseño).
Requisitos: RQ-TC-58, RQ-TC-59, RQ-TC-60 (`tickets-core`) y RQ-VT-14, RQ-VT-15 (`vistas-tablero`). Verify y archive no son casillas.
Cada lote es una sola unidad de apply: rojo, verde y cierre. Las líneas de `design.md` §4 y §5 se editan DENTRO de línea (sin mover el resto del fichero).
Rutas relativas al worktree `C:\dev\Desk_2_R1.023-worktrees\aviso-en-garantia`. Comando base de pruebas: `npx vitest run <ficheros>`.

## Lote 1 — shared + servidor + `registro.test.ts` (RQ-TC-58, RQ-TC-59, RQ-VT-14)

### 1. Rojo
- [x] 1.1 `apps/desk/server/reconciliacion/registro.test.ts:218-220`: «ONCE» → «DOCE» y `'F1B-18'` entre `'F1B-13'` y `'F1C-05'` (orden léxico de `ordenar`, `comprobaciones.ts:59`). Correr `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`: con el `proposal.md` presente la prueba 11f/05g ya está roja (devuelve DOCE con F1B-18); tras el ajuste debe quedar VERDE. Anotar ambos estados en `apply-progress`. Las demás pruebas del fichero y las de `comprobaciones.test.ts` usan árboles sintéticos y no cuentan «cerradas por archivo» reales (barrido del 2026-10-10): no hay cifra 17 → 18 que ajustar; si al correr alguna cae, parar y anotar.
- [x] 1.2 `packages/shared/src/garantia.test.ts` (nuevo): G1-G9 del diseño §7 (frontera `01:00Z`/`05:30Z`, igualdad de día, fin vencido, fin `null`/`undefined`/`''`/`'  '`/`2026-02-30` → `sin_dato`, ISO con hora → `sin_dato`, `Date` equivalente, creación ilegible o sin desplazamiento → `null`, `sugerenciaPorGarantia` y `TRANSITIONS` con `reporte_por_garantia` desde Notificado).
- [x] 1.3 `packages/shared/src/garantia.test.ts`, caso de zona (observación a): un `it.each` sobre los dos instantes frontera con `process.env.TZ = 'America/Bogota'` y luego `'UTC'`, restaurando `TZ` en `finally`/`afterEach`, que demuestra que el resultado no depende de la zona del proceso (escenario «la frontera no depende de la zona», RQ-TC-58). Nota: `diaEnZona` es independiente de la zona por construcción (`fechasDerivadas.ts:63-69`); el caso fija esa propiedad. Rojo por módulo inexistente.
- [x] 1.4 `apps/desk/server/db/garantiaTickets.test.ts` (nuevo, `Queryable` falso): S1 (fin `new Date(2026, 2, 15)` + creación G1 → `en_garantia`), S2 (sin `equipo_id`, equipo ausente → sin entrada; fin `null` → `sin_dato`), S3 (una consulta para N tickets, cero sin equipos), S4 (`query` lanza → mapa vacío y `logger.warn`), S5 (`TZ` temporal `Asia/Tokyo`, restaurada). Rojo por módulo inexistente.
- [x] 1.5 `apps/desk/server/db/garantiaTickets.test.ts`, caso de sólo lectura (observación b): el `Queryable` falso registra cada sentencia y la prueba afirma que todas empiezan por `SELECT` y que ninguna es `INSERT`/`UPDATE`/`DELETE` (RQ-TC-59, «calcular la marca no escribe nada»). Rojo por módulo inexistente.
- [x] 1.6 `apps/desk/server/garantiaListas.test.ts` (nuevo, `testing/appHarness.ts`): R1 `GET /api/tickets` (en_garantia, sin_dato, vencida, sin equipo, instante frontera), R2 `?scope=closed`, R3 `GET /api/tickets/:id`, R4 `GET /api/remision-creada`, R5 `GET /api/mis-tickets`; más el caso de no escritura de RQ-TC-59 sobre el detalle (cuenta de `ticket_transitions` y estado sin cambios tras el GET).
- [x] 1.7 `apps/desk/server/garantiaListas.test.ts`, prueba de ruta (observación c): con la lectura de `equipos` forzada a fallar (espía sobre la consulta de garantías), `GET /api/tickets/:id` y al menos una lista (`GET /api/tickets`) responden `200`, mismos tickets y orden, sin la marca.
- [x] 1.8 `apps/desk/server/db/equipos.test.ts` (al final): `searchEquipos` devuelve `finGarantia` `YYYY-MM-DD` exacto para un equipo con fin; y para un equipo con `fin_garantia` `NULL` el campo está AUSENTE (observación d): `expect('finGarantia' in resultado).toBe(false)` o `toStrictEqual` sin la clave, no `null`.
- [x] 1.9 Correr `npx vitest run packages/shared/src/garantia.test.ts apps/desk/server/db/garantiaTickets.test.ts apps/desk/server/garantiaListas.test.ts apps/desk/server/db/equipos.test.ts` y ANOTAR en `apply-progress` qué falla: los tres primeros por módulos inexistentes; R1-R5, la ruta de fallo y `equipos.test.ts` por marca ausente / `finGarantia` no devuelto. Si el fallo no coincide, parar y anotar.

### 2. Verde
- [x] 2.1 `packages/shared/src/garantia.ts` (nuevo): `EstadoGarantia`, `estadoGarantia` (D1: sólo `YYYY-MM-DD` real por `esFechaCalendarioReal`, `diaEnZona`, `<=` de cadenas; `null` si creación ilegible) y `sugerenciaPorGarantia`; `export * from './garantia'` en la ÚLTIMA línea de `packages/shared/src/index.ts`.
- [x] 2.2 `packages/shared/src/types.ts:37` (campo `garantia`) y `:362` (`finGarantia`), EN SITIO, sin líneas nuevas (diseño §3).
- [x] 2.3 `apps/desk/server/db/garantiaTickets.ts` (nuevo): `marcasDeGarantia` con `IN ($1..$n)`, `fechaSolo`, una consulta, cero si no hay equipos, nunca lanza.
- [x] 2.4 `apps/desk/server/db/equipos.ts:66` (`,fin_garantia` en el `SELECT`) y `:42` (`finGarantia: fechaSolo(r.fin_garantia)` sólo si hay valor, de modo que el campo quede ausente y no `null`), EN SITIO.
- [x] 2.5 Adjuntos en sitio (diseño §4): `apps/desk/server/db/colaTaller.ts:5`, `:23`, `:24`; `apps/desk/server/db/listaRemisionCreada.ts:5`, `:15`, `:16`; `apps/desk/server/routes/tickets.ts:9`, `:110` (cerrados), `:143`, `:144` (detalle).
- [x] 2.6 Repetir 1.9 y 1.1 en verde; correr además `npx vitest run apps/desk/server/misTickets.test.ts apps/desk/server/busquedaConfrontacion.test.ts` (VT09-9 sigue siendo una consulta fija; `finGarantia: undefined` no rompe `toEqual`).

### 3. Cierre del lote 1
- [x] 3.1 Mutaciones ejecutadas y RESTAURADAS (cada una: aplicar → correr la prueba indicada → debe ponerse ROJA → revertir → verde), resultado de cada una anotado en `apply-progress`:
  - M1 `<=` → `<` en `estadoGarantia` → rojo en G3.
  - M2 `diaEnZona(creadoEn)` → `new Date(creadoEn).toISOString().slice(0,10)` → rojo en G1.
  - M3 fin por `diaEnZona` en vez de `esFechaCalendarioReal` → rojo en G6.
  - M4 `fechaSolo(fin)` → `diaEnZona(fin)` en `garantiaTickets.ts` → rojo en S1.
  - M5 `fechaSolo` → `toISOString().slice(0,10)` → rojo en S5; si Node no aplica `TZ` en caliente en el worker, anotar «no cazable» (diseño §13), no bloquea.
  - M6 invertir `sin_dato`/`vencida` → rojo en G4 y G5.
  - M7a-d quitar el adjunto de cada productor (cola, cerrados, detalle, `listaRemisionCreada`) → rojo en R1/R5, R2, R3, R4 respectivamente.
  - M8 quitar `fin_garantia` del `SELECT` de `searchEquipos` → rojo en la prueba de `equipos.test.ts`.
  - M9 mover el cálculo dentro del bucle (N+1) → rojo en S3 y `misTickets.test.ts:121`.
  - M10 hacer que `marcasDeGarantia` propague el error → rojo en S4 y en la prueba de ruta 1.7.
  - Reglas de mutación 1 y 2: no aplican (sin guarda nueva ni fichero de datos vigilado); anotarlo.
- [x] 3.2 Regla de mutación 3 en `apply-progress`: tabla escrita decisión del cliente → línea del servidor (distintivo → `colaTaller.ts:23-24`, `routes/tickets.ts:110`, `:143-144`, `listaRemisionCreada.ts:15-16`; aviso de `CreateTicket` y resaltado en Notificado → «ninguna, a propósito: avisan»; no pintar con vencida o sin equipo → el servidor omite o manda `vencida`), con las líneas REALES tras editar, no las del diseño.
- [x] 3.3 `wc -l`: `types.ts`, `equipos.ts`, `colaTaller.ts`, `routes/tickets.ts` y `listaRemisionCreada.ts` conservan su número de líneas; `packages/shared/src/index.ts` gana exactamente una.
- [x] 3.4 Barrido de la regla de mutación 4: `grep -rnoE "(types|equipos|colaTaller|tickets|listaRemisionCreada|index)\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio SIN excluir `openspec/changes/archive/`, cada cita de los ficheros tocados contrastada con el fichero (qué AFIRMA, extremos inicial y final por separado), más el segundo pase de abreviadas (`:NN`, `:NN-MM`) en los ficheros que ya citan esos módulos; `routes/tickets.ts` se barre como `routes/tickets\.ts`.
- [x] 3.5 `npm test` (código de salida MIRADO y anotado).
- [x] 3.6 `npm run typecheck` (código MIRADO y anotado).
- [x] 3.7 `npm run lint -- --max-warnings 165` (código MIRADO y anotado).
- [x] 3.8 `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` (código MIRADO, debe ser 0, y anotado).
- [x] 3.9 Medida: `git diff --shortstat --no-renames` contra el commit de partida DEL INTENTO del lote (el `HEAD` al abrirlo) más `wc -l` de lo nuevo sin trackear, por debajo de 720; `git diff --stat` sin `repo.ts`, `schema.sql`, `transitions.ts`, `estados.ts` ni `ticketService.ts`, y sin ningún fichero bajo `apps/desk/src`.

## Lote 2 — cliente (RQ-VT-15, RQ-TC-60)

### 4. Rojo
- [x] 4.1 `apps/desk/src/lib/distintivoGarantia.test.ts` (nuevo): `en_garantia` → «En garantía» (clase verde, no ámbar); `sin_dato` → «Garantía sin dato», gris, título que remite a Comercial y a la hoja de vida; `vencida`, `undefined` y `null` → `null`. Rojo por módulo inexistente (`npx vitest run apps/desk/src/lib/distintivoGarantia.test.ts`; `apps/**/*.test.ts` entra en la red, los `.tsx` no).
- [x] 4.2 Anotar en `apply-progress` el fallo (módulo inexistente). Los `.tsx` NO admiten rojo previo bajo `strict_tdd` (fuera de la red por decisión de Gerencia, F0-00; `vitest.config.ts:16-20`); su lógica ya está probada en `garantia.test.ts` (`sugerenciaPorGarantia`) y aquí.

### 5. Verde
- [x] 5.1 `apps/desk/src/lib/distintivoGarantia.ts` (nuevo): `distintivoGarantia(estado)` → `{ texto, clase, titulo } | null`. Repetir 4.1 en verde.
- [x] 5.2 `apps/desk/src/components/DistintivoGarantia.tsx` (nuevo, sin prueba: `.tsx`): pinta lo anterior, tamaños `sm`/`md`.
- [x] 5.3 `apps/desk/src/components/TicketDetailView.tsx:183` (cabecera, tras «Hoja de vida del equipo») y `:335` (`garantia={ticket.garantia}` al panel), EN SITIO (implementación sin prueba, `.tsx`).
- [x] 5.4 `apps/desk/src/components/TicketCard.tsx:103`, `TicketList.tsx:29` y `TicketTable.tsx:34`, EN SITIO (implementación sin prueba, `.tsx`).
- [x] 5.5 `apps/desk/src/components/CreateTicket.tsx:345`: aviso informativo con `estadoGarantia(new Date(), equipo.finGarantia)`, sólo `en_garantia` y `sin_dato`, sin bloquear ni rellenar; sin aviso para equipo nuevo (S5). Imports al final de una línea existente (implementación sin prueba, `.tsx`).
- [x] 5.6 `apps/desk/src/components/TransitionPanel.tsx:52` (prop `garantia`), `:133` (resaltado si `t.id === sugerenciaPorGarantia(status, garantia)`, sin `disabled`, sin ocultar ni preseleccionar), `:137` (línea «Equipo en garantía: se sugiere Reporte por garantía») (implementación sin prueba, `.tsx`).

### 6. Cierre del lote 2
- [x] 6.1 Mutaciones ejecutadas y RESTAURADAS, resultado en `apply-progress`: M11 `en_garantia` → `null` en `distintivoGarantia` (rojo en 4.1); M12 clase ámbar en `sin_dato` o `en_garantia` (rojo en 4.1, aserción de no ámbar). Las mutaciones sobre `.tsx` no son cazables por la red y se anotan como tales.
- [x] 6.2 Regla de mutación 3 en `apply-progress` para el cliente: cada decisión de `apps/desk/src` (distintivo, aviso, resaltado) con su línea real y «avisa / sin contrapartida a propósito»; confirmar que ninguna bloquea ni rellena y que el cliente no recalcula la marca del servidor (sólo `CreateTicket` usa el predicado compartido).
- [x] 6.3 Barrido de la regla de mutación 4 sobre `TicketCard.tsx`, `TicketDetailView.tsx`, `TransitionPanel.tsx`, `CreateTicket.tsx`, `TicketList.tsx`, `TicketTable.tsx`: `grep -rnoE "(TicketCard|TicketDetailView|TransitionPanel|CreateTicket|TicketList|TicketTable)\.tsx:[0-9]+(-[0-9]+)?"` sin excluir `openspec/changes/archive/` ni `openspec/specs/`, cada cita contrastada, más el pase de abreviadas; repetir el barrido de los `.ts` del lote 1 si el lote 2 los tocó.
- [x] 6.4 `npm test` (código MIRADO y anotado).
- [x] 6.5 `npm run typecheck` (código MIRADO y anotado).
- [x] 6.6 `npm run lint -- --max-warnings 165` (código MIRADO y anotado).
- [x] 6.7 `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` (código MIRADO, 0, y anotado).
- [x] 6.8 Medida del intento (`--no-renames` más `wc -l` de lo nuevo sin trackear) por debajo de 720; `git diff --stat` de los dos lotes sin `repo.ts`, `schema.sql`, `transitions.ts`, `estados.ts` ni `ticketService.ts`.

## Ajuste final de `registro.test.ts` (en el archivo)

Paso del commit de `sdd-archive`, no de apply: NO es casilla y queda fuera del recuento (si fuera casilla abierta, bloquearía el verify). Se lista aquí para que no se olvide.
- 7.1 En el commit de archivo (el cambio pasa a `archive/` con `cierra: si`, `comprobaciones.ts:217`), `apps/desk/server/reconciliacion/registro.test.ts:218-220` vuelve a «ONCE» y retira `'F1B-18'` de la lista «en curso» (F1B-18 pasa a cerrada por archivo; el denominador sigue en 78, `:215`, `:232`). No hay aserción sobre el recuento de cerradas por archivo en ese fichero ni en `comprobaciones.test.ts` (sintéticos); correr `npx vitest run apps/desk/server/reconciliacion` y anotar el código. Comprobar con `git show --numstat` que el commit contiene sólo el cambio archivado.

## Regla invariable 13

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Distintivo en tarjeta, lista, tabla y cabecera: avisa | `colaTaller.ts:23-24`, `routes/tickets.ts:110`, `:143-144`, `listaRemisionCreada.ts:15-16` (vía `garantiaTickets.ts`); el cliente no calcula. Líneas finales se fijan en 3.2 |
| Aviso en `CreateTicket`: avisa | Ninguna, a propósito (consume `shared`, punto 1) |
| Resaltar «Reporte por garantía»: avisa | Ninguna: no impone (S7); las tres salidas siguen bajo `canExecuteTransition` |

## Verificación manual en la aplicación — fuera del recuento

No son casillas y **archivar no las da por hechas** (regla del ciclo 1). Las hace una persona tras el despliegue, en `ambientalia-desk.ambientalia.cloud`.

1. Tablero: un ticket de equipo con fin de garantía igual o posterior a su día de creación muestra «En garantía» en verde; uno de equipo sin fin registrado, «Garantía sin dato» en gris; uno de garantía vencida o sin equipo, ninguno.
2. Lista y tabla: mismos tickets, mismo resultado; comparar con un ticket en espera y confirmar que el distintivo no es ámbar.
3. Cabecera del ticket: aparece el distintivo tras «Hoja de vida del equipo»; el de «Garantía sin dato» muestra al pasar el título que remite a Comercial.
4. Un ticket cerrado, en la vista «Todos» y en su detalle, conserva el distintivo.
5. Alta: elegir un equipo en garantía muestra el aviso «En garantía» y deja crear el ticket sin cambiar otros campos; un equipo sin fin muestra «Garantía sin dato»; uno vencido, nada; «Equipo nuevo» con fecha tecleada, sin aviso, y el ticket creado trae la marca en su cabecera.
6. Notificado con marca `en_garantia`: «Reporte por garantía» destacado con su línea de texto; «Devolución a corrección» y «Escalado a Comercial» visibles y habilitadas, ninguna preseleccionada. Con `sin_dato`, `vencida` o sin equipo, sin destacado.
7. Con un usuario sin permiso para «Reporte por garantía», el intento de ejecutarla responde lo mismo que antes del cambio.
8. Anotar el resultado de cada paso en el parte de la tanda.

## Tareas de personas — fuera del recuento

| Qué | Dueño | Destino y dónde queda escrito |
|---|---|---|
| Corregir S1-S9 si no se aceptan (plazo de una semana, E-237) | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Confirmar que el fin de garantía de las hojas de vida está bien registrado | Comercial | Hoja de vida del equipo |
| Recoger en el expediente R08.5 que `R08.4.md:1611-1614` está construido y corregir `:1628` | Supervisión | Expediente R08.5 |

## Review Workload Forecast

| Lote | Contenido | Líneas estimadas | Techo con margen |
|---|---|---|---|
| 1 · shared + servidor + registro | `garantia.ts` 35, `index.ts` 1, `types.ts` 4, `garantia.test.ts` ~100 (con caso TZ), `garantiaTickets.ts` 35, su prueba ~110 (con sólo lectura), `garantiaListas.test.ts` ~130 (con ruta de fallo), edits en sitio ~26, `equipos.test.ts` ~15, `registro.test.ts` 4, casillas y `apply-progress.md` ~80 | ~540 | ~650 |
| 2 · cliente | `distintivoGarantia.ts` 25, su prueba 30, `DistintivoGarantia.tsx` 25, seis `.tsx` 24, casillas y `apply-progress.md` ~40 | ~145 | ~220 |

Total del cambio ~685 (diseño §10, ~595, más las cuatro observaciones). El techo de 800 se aplica por intento; cada lote queda por debajo de 720.
Es estimación, no medida; la medida se ejecuta al cerrar cada intento (3.9, 6.8). El lote 1 es el cercano a la válvula: si la medida parcial pasa de ~650, mover `garantiaListas.test.ts` R5 y la ruta de fallo no es opción (son del lote 1); en ese caso parar y consultar.

- Chained PRs recommended: Yes (dos lotes encadenados; el proyecto fusiona por rama, no por PR).
- Decision needed before apply: No.
