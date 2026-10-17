# Tareas: fecha de cierre de «Entregado» en la migración, con marca de origen

`tanda: F1F-01` · `cierra: no` · `strict_tdd`: cada lote va en rojo y luego en verde. Criterio rector del diseño: **cero
líneas desplazadas** en los ficheros citados; lo nuevo va al final del fichero o dentro de una línea existente.
Referencias: D-n = `design.md`; RQ = deltas en `specs/`.

## Review Workload Forecast

| Lote | Fichero(s) | Líneas estimadas (inserciones + borrados) |
|---|---|---|
| 1 · shared | `migracionTickets.ts` (~30), `migracionTickets.test.ts` (~60), `index.ts` (0: ya es `export *`) | ~90 |
| 2 · servidor | `migracionTicketsAbiertos.ts` (~12, líneas editadas), `migracionTicketsAbiertos.test.ts` (~60) | ~72 |
| 3 · reversión | `.sql` (~4), `migracionTicketsF1F01.test.ts` (~35) | ~39 |
| Cierre | sin código; mutaciones se aplican y se revierten (no cuentan al final) | 0 |
| **Total apply** | | **~200 (rango 150-250)** |

No supera 400. Está bajo el techo de 800 y la válvula de 720 por intento. Los lotes 1-3 caben en UN solo intento; el
verify (~250-350 de informe) y el archive (informe ~150 + fusión, medida) abren intento propio.
Entre medias, `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear;
se registra ESO al cerrar cada intento. Worktree propio (regla del ciclo 3): ya es
`C:\Dev\Desk_2_R1.023-worktrees\fecha-cierre-migracion`.

Orden: 1 → 2 → 3 → Cierre, secuenciales (el 2 consume el export del 1; el 3 consume las claves del marcador del 2).
Dentro de cada lote, rojo antes que verde. Ninguna tarea es paralelizable (un solo escritor, un solo árbol).

---

## Lote 1 · `packages/shared` (regla pura, D-1, D-2)

- [x] 1.1 **Rojo.** Añadir al FINAL de `packages/shared/src/migracionTickets.test.ts` las pruebas de `cierreDeMigracion` y `cierresDeMigracion` (RQ-TC-64):
  - con `closedTimeZoho` no nulo en `entregado-a-finalizado` → `{ closedTime: <el de Zoho>, origen: 'zoho' }`;
  - sin fecha de Zoho → `{ closedTime: <instante>.toISOString(), origen: 'migracion' }`;
  - `null` en las otras tres reglas (`Pendiente` de servicio, `Pendiente` de soporte remoto, identidad), con y sin fecha de Zoho (S-4);
  - precedencia: con fecha de Zoho Y instante, gana Zoho (detector de la mutación de precedencia, D-7);
  - `instante` inválido (`new Date('x')`) lanza `RangeError`;
  - `cierresDeMigracion`: cuenta sólo planes `migrar` cuya regla cierra, separando `conFechaDeZoho` y `conFechaDeMigracion`; ignora `sin-equivalencia` y no-`migrar`;
  - `TicketParaMigrar` sin `closedTime` (fixture `:21`) se trata como `null`.
  Comprobar que falla por la ausencia de las funciones (`npm test -- packages/shared/src/migracionTickets.test.ts`). Satisface RQ-TC-64 (los cinco escenarios) y RQ-TC-40 regla 2.
- [x] 1.2 **Verde.** Añadir al FINAL de `packages/shared/src/migracionTickets.ts` (desde `:115`): `OrigenCierre`, `CierreMigracion`, `cierreDeMigracion` (con `RangeError` por instante inválido, sin leer el reloj), `CierresMigracion`, `cierresDeMigracion`.
- [x] 1.3 **Verde.** En la MISMA línea `:48` de `migracionTickets.ts` añadir `closedTime?: string | null` a `TicketParaMigrar` (A2: opcional, 0 líneas desplazadas).
- [x] 1.4 Confirmar que `packages/shared/src/index.ts:36` (`export *`) ya exporta lo nuevo; no se edita salvo que no sea así (entonces, al final del fichero). Correr la prueba del 1.1 en verde y `npm run typecheck`.
- [x] 1.5 Comprobar `git diff` de `migracionTickets.ts`: sólo `:48` modificada y líneas nuevas desde `:115`; ninguna inserción neta en medio.

## Lote 2 · Ejecutor del servidor (D-3, D-4, D-5, RQ-ZS-17)

- [x] 2.1 **Rojo.** Al FINAL de `apps/desk/server/db/migracionTicketsAbiertos.test.ts`, pruebas nuevas (RQ-ZS-17), con `ahora` inyectado:
  - un «Entregado» sin `closed_time` queda con `ahora` y marcador con `cierre_origen: 'migracion'`, `closed_time_previo: null`, `closed_time_destino`;
  - un «Entregado» con `closed_time` lo conserva y lleva `cierre_origen: 'zoho'` y `closed_time_previo`;
  - todos los cierres de una ejecución comparten el mismo instante;
  - un «Pendiente» y una identidad no tocan `closed_time` y su marcador NO lleva las tres claves nuevas (S-4);
  - en seco, `informe.cierres` cuenta las dos ramas y no se escribe nada; el informe es igual en seco y al aplicar.
  En la MISMA línea `:56` añadir `'cierres'` a la lista de claves del informe (queda rojo hasta 2.2). Comprobar que `:80` (`toEqual` de identidad) y `:85` (`closed` de `t1`, rama Zoho) siguen como están: NO se invierten (D-6).
- [x] 2.2 **Verde**, todas en la misma línea (cero desplazadas), `apps/desk/server/db/migracionTicketsAbiertos.ts`:
  - `:25` `cierres: CierresMigracion` en `InformeMigracion`; `:58` rellenar con `cierresDeMigracion(planes)`;
  - `:33` `closed_time` en el `SELECT`; `:37` `closedTime: iso(f.closed_time)`;
  - `:64` `ahora?: Date` en `opts`; `:66` `ahora = opts.ahora ?? new Date()` (uno por ejecución; la ruta `admin.ts:228` no cambia);
  - `:72` `const cierre = cierreDeMigracion(eq, t.closedTime ?? null, ahora)`;
  - `:75` `...(cierre && { closed_time_previo, closed_time_destino, cierre_origen })`;
  - `:85` `closed_time = COALESCE($4::timestamptz, closed_time)` y `:88` parámetro `cierre?.closedTime ?? null`.
- [x] 2.3 Correr `npm test -- apps/desk/server/db/migracionTicketsAbiertos.test.ts` y `migracionConcurrente.integration.test.ts` en verde; `npm run typecheck`.
- [x] 2.4 Comprobar con `git diff` que `migracionTicketsAbiertos.ts` no tiene inserciones netas (sólo líneas modificadas) y que `apps/desk/server/routes/admin.ts` y `apps/desk/src` quedan intactos.

## Lote 3 · Reversión SQL (D-6, RQ-ZS-18)

- [x] 3.1 **Rojo.** En `apps/desk/server/db/migracionTicketsF1F01.test.ts`:
  - `:93`: título pasa a «restaura closed_time» (misma línea); su cuerpo compara `closed_time` con `fotoTickets` y discrimina: `e2` (sin fecha) vuelve a NULL; un «Entregado» con fecha de Zoho recupera la suya;
  - `:191` (prueba (i)): `modified_time` sigue prohibido y `closed_time` sólo puede aparecer en la sentencia de `entregado-a-finalizado` (misma línea);
  - al FINAL del fichero: la restauración de `closed_time` aparece en UNA sola sentencia (la de `entregado-a-finalizado`); la reversión no toca `closed_time` en las reglas que no cierran; la reversión repetida no cambia nada.
  Comprobar el rojo (el `.sql` aún no restaura).
- [x] 3.2 **Verde**, mismas líneas de `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`: `:14` (las tres claves en la lista de `values`), `:65` (comentario corregido: sólo `entregado-a-finalizado` restaura `closed_time` desde `closed_time_previo`; no toca `modified_time`), `:76` (`closed_time = (m."values"->>'closed_time_previo')::timestamptz,`). La `:81` NO se toca.
- [x] 3.3 Correr `npm test -- apps/desk/server/db/migracionTicketsF1F01.test.ts` en verde. Hipótesis a anotar en el resultado: el cast sobre `NULL` se ejecuta en pg-mem, no en PostgreSQL real.

## Cierre (D-7, D-9)

- [x] 4.1 **Mutación, regla 1 (precedencia).** Invertir en `cierreDeMigracion` la precedencia (la migración gana a Zoho): deben ponerse rojas la prueba unitaria de la rama Zoho y `migracionTicketsAbiertos.test.ts:85`. Registrar el resultado por escrito en el informe y revertir la mutación.
- [x] 4.2 **Mutación, regla 1 (filtro «sólo la regla que cierra»).** Quitar la condición `statusTypeDestino === 'Closed'`: deben ponerse rojas `:80` (claves de más en identidad) y la prueba nueva «Pendiente e identidad no tocan closed_time». Registrar y revertir.
- [x] 4.3 **Mutación, regla 2 (fichero vigilado).** (a) Quitar la restauración de `closed_time` de `.sql:76`: rojas la (a) (`e2` queda con la fecha de la migración) y la (i) reescrita. (b) Poner la restauración también en `:81`: la (i) se pone roja. Registrar y revertir.
- [x] 4.4 **Regla 13 / mutación 3.** Comprobar `git diff --stat` sin ninguna ruta bajo `apps/desk/src`; dejar por escrito «sin decisiones nuevas del cliente».
- [x] 4.5 **Barrido, regla 4.** `git diff -U0` de `migracionTickets.ts`, `migracionTicketsAbiertos.ts`, el `.sql` y los dos `*.test.ts` citados: confirmar que no hay inserciones netas en medio (sólo líneas modificadas y adiciones al final). Si alguna línea se movió: `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` y segundo pase de la forma abreviada en `DEPLOY.md`, los dos `.test.ts` y el `.sql`. Comprobar además lo que AFIRMAN: `config.yaml:4749`/`:4759` (describen el `UPDATE` sin `closed_time`, ahora falso: caso B/C, se anota y lo corrige quien tenga permiso sobre `config.yaml`, no esta tanda) y zoho-sync `spec.md:1381` (lo reescribe el delta).
- [x] 4.6 **Los cinco códigos, todos 0** (se anotan en el informe):
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`
- [ ] 4.7 **Medida del intento.** `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear; registrar ESO en el intento (tope 800, válvula 720). Sin commit hasta que la orquestación lo pida.

---

## Tareas de personas (regla del ciclo 1) — FUERA del recuento

No son tareas de esta tanda: no las marca ningún apply. **Archivar NO las da por hechas.** Quedan escritas con dueño, destino y dónde constan.

| # | Qué | Dueño | Destino / qué desbloquea | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Pasada en seco en producción (E-211): ejecutar el informe con `aplicar=false`, leer `cierres.conFechaDeZoho` / `conFechaDeMigracion` antes de aplicar | Persona con rol de superadministrador (Gerencia designa) | Desbloquea la aplicación real de F1F-01 | `openspec/config.yaml:4761-4763` |
| P-2 | Nombrar al suplente del 12/12 | Gerencia | Desbloquea el cierre de F1F-01 (`cierra: no` hasta entonces) | `DEPLOY.md:693` («no nombra al suplente») |
| P-3 | Pregunta H-1: ¿se excluyen de Análisis y de la ficha de cliente las fechas con `cierre_origen: 'migracion'`? | Gerencia | Decide si hay una tanda para corregir los lectores (`apps/desk/server/analisis.ts:26`, `apps/desk/server/db/directory.ts:28`); la marca ya permite filtrarlos | `proposal.md` §Hallazgo H-1 y `design.md` §Preguntas abiertas; sube al panel (E-237: toca datos visibles al cliente) |
