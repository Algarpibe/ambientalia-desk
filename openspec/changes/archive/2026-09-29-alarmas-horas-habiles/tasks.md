# Tasks — `alarmas-horas-habiles` (F1B-08, `cierra: no`)

**Entradas:** `proposal.md`, `exploration.md`, `design.md`, `specs/{transitions-st,derivacion-avisos,vistas-tablero}/spec.md` de esta carpeta. Preflight: `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd`.
`strict_tdd` activo: cada tarea de implementación va precedida de su prueba en rojo y de un «confirmar rojo natural»; lo que nace verde se declara en `apply-progress.md`.
Correcciones del orquestador que prevalecen sobre `proposal.md`: S-4 en su segunda revisión (2026-09-29: la marca se escribe SIEMPRE al vencer; sin nadie con el cargo, el aviso va al `areaRespaldo` de la alarma, `Comercial`, con `destinatariosDeArea` y un único `warn` «sin Coordinador Comercial»; sólo si tampoco el área da nadie, `avisos_creados = 0`), S-9 revisado
(se CONSERVA el filtro de flujo servicio de `apps/desk/server/db/sla.ts:49`; `sla.test.ts:141-145` no se invierte; no hay delta de `transitions-equipo-nuevo`), S-13 revisado el 2026-09-29 (corte persistente `public.alarmas_corte`: lo vencido en el corte se marca SIN avisar; lo posterior avisa) y RQ-TS-19 («la misma definición de tres vías, enfrentada por prueba con `ticketConOrdenVenta`»).

Las citas se leyeron el 2026-09-29 contra el árbol de `6516e5f` por lectura directa en `sla.ts` (`:1-109`), `sla.test.ts` (`:1-209`), `db/sla.ts` (`:1-63`), `db/sla.test.ts` (`:1-146`) e `index.ts` (`:10-99`). El resto viene de `design.md` §9 (medido en `4796aad`) y lo re-mide la tarea 0.3 (hipótesis hasta entonces).

**Matriz de amenazas de la skill:** N/A (`design.md` «Threat Matrix»: sin red nueva, shell, subprocesos ni automatización de VCS; SQL parametrizado). Los casos de contenido hostil que sí hay (cargo con mayúsculas y espacios, cargo vacío en la tabla, asociación liberada) son RED explícitos: 1.3, 2.8, 2.13.

## Alineación de planificación (antes del lote 1)

- [x] A.1 **Hallazgo al planificar: el lote 1 solo rompe el servidor.** `apps/desk/server/db/sla.ts:58` en `6516e5f` llama `slaVencido(estado, desde, ahora)` y la firma nueva exige `cierres`; sin puente, `npm run typecheck` (`tsc -p apps/desk/tsconfig.server.json`) falla al integrar el lote 1 (stacked-to-main: cada lote va verde a `main`).
  Solución: tarea 1.6, un puente EN SITIO (`slaVencido(estado, desde, ahora, [])`, mismas 63 líneas), que el lote 2 reemplaza por los cierres reales. Con cierres `[]` y `AHORA = 2026-09-10T12:00Z`, las siete pruebas de `db/sla.test.ts` siguen dando el mismo resultado (hipótesis: `t1` lleva dos días hábiles, `t2` cero; se confirma corriéndolas en 1.6).
  `venceSlaEn` y `destinatarioDelEscalado` no tienen otro consumidor: `Grep` sobre `apps/` y `packages/` (2026-09-29) sólo halla `db/sla.ts:2` en `6516e5f` (y su `:58`/`:59`), `sla.test.ts` y comentarios (`bodegaje.ts:27`, `bodegaje.test.ts:37`, `transitions.ts:340`).
- [x] A.2 **Recuento de escenarios: 46** (`transitions-st` 12 + 3 + 6 = 21; `derivacion-avisos` 6 + 8 + 4 = 18; `vistas-tablero` 6 + 1 = 7). Numerados S1-S46 en la matriz de abajo; S46 (el corte no se mueve con un reinicio) entró con la revisión de S-13 y va al final para no renumerar.
- [x] A.3 **Reparto en CUATRO lotes, no tres.** El encargo pedía tres; mi estimación del lote «servidor y BD» sale a ~1.100 (código ~320, pruebas ~720, `apply-progress` ~60), por encima de 800. Se parte en el lote 2 (BD y consulta, ~475) y el lote 3 (servicio y cableado, ~625).
  El lote 4 es «tablero y cierre» (~375). Cada uno cabe en 800 con margen.

## Fase 0 · Preparación (orquestador; sin código)

- [x] 0.1 `git rev-parse HEAD` (esperado `6516e5f`) y `git status --short` (sólo los sin trackear de la cabecera de sesión y `openspec/changes/alarmas-horas-habiles/`). `git diff --stat 4796aad HEAD -- apps packages` debe salir vacío: los commits posteriores a la medición de `design.md` son sólo de `docs/`.
- [x] 0.2 Línea base verde: (hecha DESPUÉS del GREEN del lote 1, no antes: desviación declarada en `apply-progress.md`, lote 1) `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`. Anotar nº de ficheros y de tests en `apply-progress.md` (si `auth/routes.test.ts` da timeout intermitente, es E-091: se relanza y se anota, no se corrige aquí).
- [x] 0.3 **Re-medir puntos de inserción y citas** en el HEAD de arranque (los valores entre paréntesis son los de `design.md` §9, contados con ripgrep e incluyen sin trackear; `git grep` sólo cuenta lo trackeado y puede salir MENOR). Regla: si un fichero sale **mayor**, alguien añadió citas: se leen.
  ```bash
  wc -l packages/shared/src/sla.ts packages/shared/src/sla.test.ts apps/desk/server/db/sla.ts apps/desk/server/db/sla.test.ts apps/desk/server/db/avisos.ts apps/desk/server/index.ts \
        packages/zoho-sync/src/db/schema.sql packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/migrate.test.ts packages/shared/src/types.ts \
        apps/desk/server/routes/tickets.ts apps/desk/src/components/TicketCard.tsx   # 109 210 63 146 93 99 576 131 464 810 223 102
  git grep -nE "sla\.ts:[0-9]+" | wc -l          # 87 (ambos homónimos)
  git grep -nE "sla\.test\.ts:[0-9]+" | wc -l    # 56
  git grep -nE "db/sla\.ts:[0-9]+" | wc -l       # 24
  git grep -nE "avisos\.ts:[0-9]+" | wc -l       # 23
  git grep -nE "index\.ts:[0-9]+" | wc -l        # 69 (29 a :84-99)
  git grep -nE "schema\.sql:[0-9]+" | wc -l      # 214 (la más alta :576)
  git grep -nE "migrate\.ts:[0-9]+" | wc -l      # 83
  git grep -nE "migrate\.test\.ts:[0-9]+" | wc -l # 60
  git grep -nE "types\.ts:[0-9]+" | wc -l        # 43 (hasta :713)
  git grep -nE "routes/tickets\.ts:[0-9]+" | wc -l # 67 (patrón `tickets.ts` mezcla homónimos)
  git grep -nE "TicketCard\.tsx:[0-9]+" | wc -l  # 49 (la más alta :83)
  ```
  Si algún `wc -l` difiere de su valor, los puntos de inserción se han movido: se para y se declara. Copiar la tabla de puntos de cada lote al `apply-progress.md` con los valores medidos.
- [x] 0.4 Confirmar que `schema.sql:576` es hoy la `ALTER` de `tickets.modalidad` y que el fichero termina ahí (la tabla nueva empieza en `:577`); es lo que cita la nota de despliegue.
- [x] 0.5 Leer antes de escribir código lo que el diseño da por sabido: `calendarioLaboral.ts:174-190` (firma de `horasHabilesEntre` y forma de `cierres`; ¿`DiaCivil` se exporta?), `calendarioLaboral.test.ts` (fixtures de festivo y de zona `ZONA_NEGOCIO` para reutilizarlos en 1.2),
  `db/transaccion.ts:13` (`enTransaccion`), `avisoRitmoContrato.ts:25-75` y `:185-195` de su prueba (molde y guardián de `index.ts`), `repo.ts:362-379` (`ticketConOrdenVenta`).
- [x] 0.6 Ledger: un intento de `gentle-ai sdd-attempt` por lote, **en serie** (regla del ciclo 2), cuatro en total. `verify` y `archive` son intentos aparte. Nada en paralelo sobre este árbol.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | ~1.845 en cuatro lotes (370 + 475 + 625 + 375); incluye pruebas y `apply-progress.md` (~60 por lote); NO incluye `verify-report` ni `archive-report` |
| Techo de esta sesión | **800 por lote** (`review_budget_lines`); el mayor (lote 3, ~625) deja ~175 de margen; el lote «servidor y BD» de la propuesta (~620) se parte porque mi estimación por tareas sube a ~1.100 |
| Riesgo de presupuesto | **Alto** en conjunto; **Bajo** por lote (1 y 4), **Medio** (2 y 3) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main — un commit por lote, en serie, integrado antes de abrir el siguiente |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

(La etiqueta literal dice «400-line»; el techo real es 800 por lote. El riesgo es alto por el TOTAL. Bajo modo `auto` la cadena `stacked-to-main` se aplica como supuesto reversible: no es ninguna de las cinco condiciones de parada de `CLAUDE.md`.)

**Estimación por lote** (`+n −n` cuenta doble en las ediciones en sitio; «final» = sólo inserciones):

| Lote | Código | Pruebas | `apply-progress.md` | Total | Margen a 800 | Depende |
|---|---|---|---|---|---|---|
| 1 · `shared` | ~115 (`sla.ts`: docblock `:4-31` ±20, tabla ±8, retirada ±12, `slaVencido` ±20, comentarios ±6, `ALARMAS_SLA` y `estadosConAlarmaSinCargo` +45; puente `db/sla.ts` ±2) | ~195 (`sla.test.ts`: en sitio ~90, al final ~105) | ~60 | **~370** | ~430 | — |
| 2 · BD y consulta | ~160 (`schema.sql` +14, `migrate.ts` ±2, `avisos.ts` +12, `db/sla.ts` reescritura ~+85 −45) | ~255 (`migrate.test.ts` ±10 y +25, `avisos.test.ts` +45, `db/sla.test.ts` ±10 y ~+130 más el enfrentamiento ~+60) | ~60 | **~475** | ~325 | 1 |
| 3 · Servicio y cableado | ~165 (`alarmasSla.ts` ~160, `index.ts` ±4) | ~400 (`alarmasSla.test.ts` nuevo: series M, P, correo y guardián de `index.ts`) | ~60 | **~625** | ~175 | 2 |
| 4 · Tablero y cierre | ~65 (`alarmasAvisadas.ts` ~45, `types.ts` ±2, `tickets.ts` ±4, `TicketCard.tsx` +9) + ~30 de texto para R08.3 | ~220 (`alarmasAvisadas.test.ts` ~150, `tickets.test.ts` +70) | ~60 (incluye la casilla de la regla 13) | **~375** | ~425 | 3 |
| **Total** | | | | **~1.845** | | |

*Revisión de S-4 y S-13 (2026-09-29), sobre la tabla de arriba, que se conserva como la estimación de partida:* lote 1 +~10 (`areaRespaldo` y su invariante) → **~380**; lote 2 +~20 (`public.alarmas_corte` y su clave) → **~495**; lote 3 +~80 (corte, reinicio y los dos caminos del destinatario) → **~705**, con **~95** de margen y rozando la válvula de 720: si el lote 3 la pasa, se para y se declara. Total **~1.955**.

**Válvula:** si tras el GREEN de un lote el acumulado medido (`git diff --shortstat --no-renames HEAD` + nuevos sin trackear) supera **90 % del techo (720)**, se para y se declara antes de las mutaciones; las mutaciones no añaden líneas (se revierten), pero `apply-progress.md` sí.

**Previsión de `verify`** (intento aparte): **~350 líneas de `verify-report.md`**, sumando OBLIGATORIO (precedentes: 358 en `detector-citas-extremos`; aquí la matriz tiene 45 filas y cuatro lotes que contrastar). `verify` no toca código. Contra un techo de 800 cabe, pero el informe no es opcional ni «extra».

**Previsión de `archive`** (intento aparte): el ledger mide SIN detección de renombrado, así que **la carpeta cuenta dos veces** (borrada y reinsertada; `CLAUDE.md`, regla del ciclo 2).

| Concepto | Líneas |
|---|---|
| Carpeta que se mueve: `proposal` 162, `exploration` 41, `design` 202, tres specs 434, `tasks` ~390, `apply-progress` ~240 (4 × ~60), `verify-report` ~350, `archive-report` ~190 | ~2.010 |
| Contada dos veces (`git mv` sin `-M`) | ~4.020 |
| Fusión de los tres deltas en `openspec/specs/` (RQ-TS-15 y RQ-TS-16 modificados, RQ-TS-19, RQ-AV-15..17, RQ-VT-07..08) | ~400 (**se mide, no se estima**: hacerla en un worktree cuesta un minuto) |
| **Total previsto** | **~4.400** (± 400) |

**El archive NO cabe en 800 y necesitará un techo de mantenedor: se pide 5.000** (precedente: 5.000 aprobados para 4.502 medidas; aquí ~600 de margen sobre lo previsto). La justificación no es el tamaño: ~4.020 de esas líneas son un `git mv` verbatim de carga de revisión cero; lo revisable son ~400 de fusión más el `archive-report`.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Tabla `SLA_HORAS_POR_ESTADO` 9/27/36 en horas hábiles, `ALARMAS_SLA`, `slaVencido` con cierres, retirada de `venceSlaEn`, puente en `db/sla.ts:58` en `55eac92` | PR 1 | `npx vitest run packages/shared/src/sla.test.ts apps/desk/server/db/sla.test.ts` | node puro (vitest, `vitest.config.ts:16`) | `git revert` del lote 1 después de revertir 2-4. Sin efecto vivo: `ticketsConSlaVencido` no tiene llamador hasta el lote 3 |
| 2 | `public.alarmas_avisadas`, `destinatariosDeCargo`, `tieneOrdenVenta`, `ticketsConSlaVencido` sin N+1 | PR 2 | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/db/avisos.test.ts apps/desk/server/db/sla.test.ts` | pg-mem (`newDb().adapters.createPg()`, molde de `db/sla.test.ts:7`) | `git revert` del lote 2; la tabla queda (aditiva, sin relleno, sólo la lee este código) |
| 3 | `services/alarmasSla.ts`, marca+aviso transaccional, correo posterior, cableado en `index.ts:15` y `:88` | PR 3 | `npx vitest run apps/desk/server/services/alarmasSla.test.ts apps/desk/server/services/avisoRitmoContrato.test.ts apps/desk/server/db/sla.test.ts` | pg-mem con `fetch` falso; el guardián lee `index.ts` como texto | `git revert` del lote 3: sin la llamada en `index.ts` no hay avisos ni marca. **Es el primer lote con efecto vivo** (y con la ráfaga de S-13) |
| 4 | Campo `esperandoAprobacionCliente`, `db/alarmasAvisadas.ts`, `TicketCard.tsx`, regla 13 y 4, R08.3 | PR 4 | `npx vitest run apps/desk/server/db/alarmasAvisadas.test.ts apps/desk/server/tickets.test.ts` | N/A para `.tsx` (fuera de la red, F0-00); sustituto `npm run typecheck && npm run build`; verificación manual en P.2 | `git revert`; UI y documentación, el servidor sigue avisando |

**Convenciones de todos los lotes.**
- «En su sitio» = mismo número de líneas (una edición cuenta `+n −n`); «al final» = sólo inserciones, `−0`. El cierre de cada lote lo comprueba con `git diff --numstat HEAD -- <fichero>` y con `wc -l`.
- **Medida de cada lote** (techo 800; si se pasa, se para y se declara): `git add -N <ficheros nuevos>`, luego `git diff --shortstat --no-renames HEAD -- <ficheros del lote>` (que ya incluye los nuevos), **más** el delta de
  `wc -l openspec/changes/alarmas-horas-habiles/apply-progress.md` (se lista por ruta: hay sin trackear ajenos en `docs/sdd/`). El resultado va en `apply-progress.md`.
- **Barrido de la regla de mutación 4 al cierre de cada lote** (sobre los ficheros del lote; el barrido completo es 4.10): `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`,
  más segundo pase para la forma abreviada en los ficheros que ya citan el módulo; se comprueban los DOS extremos de cada rango y se LEE qué afirma cada cita (A presente / B histórico / C superado).
- Tras cada cierre: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165` y `apply-progress.md` del lote (≤ 60 líneas).
- **Toda edición de un fichero muy citado es EN SU SITIO o AL FINAL** (`design.md` §9). Un comentario nuevo no se pone por encima de `migrate.test.ts:409-411` (`CLAUDE.md` lo cita): va en el título de la prueba o en el docblock del `describe` FINAL.

---

## Lote 1 · `shared`: tabla, vencimiento hábil y `ALARMAS_SLA`

**Estimación:** código ~115 · pruebas ~195 · artefactos ~60 · **total ~370**. **Depende de:** — (primer lote; tras A.1-A.3 y la fase 0).

**Puntos de inserción (medidos en `4796aad`; la 0.3 los re-mide)**

| Fichero (líneas; citas) | Puntos | Tipo | Desplaza |
|---|---|---|---|
| `packages/shared/src/sla.ts` (109; 87 con homónimos, 28 con `shared/src/`) | `:2` se añade `; import { horasHabilesEntre, type DiaCivil } from './calendarioLaboral'` tras el `;` (precedente `index.ts:15`); `:4-31` docblock; `:32-35` tabla (4→4); `:39-44` `venceSlaEn` → comentario de retirada de 6 líneas; `:46-55` `slaVencido` (10→10); comentarios `:68-70`; `ALARMAS_SLA` y `estadosConAlarmaSinCargo` al final | EN SU SITIO + FINAL | −0 |
| `packages/shared/src/sla.test.ts` (210; 56) | `:2` importación; `:33` tabla; `:51-55` exclusión → independencia; `:57-81` reloj → borde hábil; `:129-130` comentario («no tiene SLA» deja de ser cierto); `:184-192` conexión con el reloj; pruebas nuevas al final | EN SU SITIO + FINAL | −0 |
| `apps/desk/server/db/sla.ts` (63; 24) | sólo `:58` (puente, 1 token) | EN SU SITIO | −0 |

**Rojos deliberados** (los cuatro reescritos EN SITIO, `design.md` D-1): `sla.test.ts:33`, `:51-55`, `:57-81` y `:188-191`. Nada más sale rojo fuera de `shared`: si algo lo hace, es hallazgo y se declara.

### Bloque A · RED

- [x] 1.1 RED — `sla.test.ts` **en su sitio**: `:2` quita `venceSlaEn` y añade `ALARMAS_SLA`; `:33` afirma el objeto entero `{ 'Notificado': 9, 'Remisión creada': 27, 'Notificación cliente': 36 }` (S1);
  `:51-55` pasa de «exclusión» a **independencia**: al menos un estado con alarma dentro de `ESTADOS_EN_ESPERA` (`Remisión creada`, `Notificación cliente`) y al menos uno de `ESTADOS_EN_ESPERA` sin alarma (S11); `:57-81` deja de probar `venceSlaEn` (`:62`, `:66` se retiran) y pasa a probar `slaVencido` con cierres;
  `:129-130` reescribe el comentario («no cambia nada para C11 — `Notificación cliente` no tiene SLA»: falso desde hoy; caso B, se nombra la revisión `6516e5f`); `:188-191` → «todo estado con alarma tiene cargo no vacío y, si el grafo propone cargo, coincide con el declarado» (`destinatarioDelEscalado` se conserva como comprobación de coherencia, D-1; S-3 pasa a hecho probado).
- [x] 1.2 RED — `sla.test.ts` **al final** (fixtures en `ZONA_NEGOCIO`, reutilizando las de `calendarioLaboral.test.ts`; las fechas son propuesta, se confirman contra ese fichero): `slaVencido(estado, desde, ahora, cierres)` estricta.
  `Notificado` entrado lunes 8:00: no vencido el lunes 17:00 ni el lunes 23:00 (9 h hábiles exactas, fuera de jornada no suma) y vencido el martes 8:00:00.001 (S2, S3);
  viernes 16:00 → lunes 16:00 no, lunes 16:00:00.001 sí (S4); viernes 8:00 con lunes festivo → martes 8:00 no, 8:00:00.001 sí (festivo Colombia: hipótesis de fecha, `2026-10-09` → lunes `2026-10-12`) (S5); lunes 8:00 con cierre el martes → miércoles 8:00 no, 8:00:00.001 sí (S6);
  `Remisión creada` lunes 8:00 → miércoles 17:00 no (27 h exactas), jueves 8:00:00.001 sí (S7); `Notificación cliente` lunes 8:00 → jueves 17:00 no (36 h exactas), viernes 8:00:00.001 sí (S8); estado sin alarma (`En Proceso`) nunca vence;
  **borde fraccionario** (entra 8:20, evalúa al día siguiente 8:20 = 9 h exactas sumando tramos de 0,333… h: no vencido; +1 ms sí) que es lo único que distingue el `Math.round` de D-1 (hipótesis de coma flotante, `calendarioLaboral.ts:185`).
- [x] 1.3 RED — `sla.test.ts` **al final**, invariantes de `ALARMAS_SLA`: mismas claves que `SLA_HORAS_POR_ESTADO`; las tres con `cargo: 'Coordinador Comercial'` (S13) y `areaRespaldo: 'Comercial'`, dentro de `AREAS` (`transitions.ts:310`; S-4 segunda revisión); sólo `Remisión creada` con `soloSinOrdenVenta` y sólo `Notificación cliente` con `marcaTablero`;
  `estadosConAlarmaSinCargo(tablaSintetica)` con una entrada de cargo vacío o sólo espacios devuelve ese estado y el mensaje lo nombra (S14).
- [x] 1.4 Confirmar rojo natural: `ALARMAS_SLA`/`estadosConAlarmaSinCargo` no existen; `:33` da `{ Notificado: 24 }`; `slaVencido` ignora `cierres`. **Nacen verdes y se declaran:** `packages/shared/src/sla.test.ts:106-182` (`destinatarioDelEscalado` no se toca) y `:194-209` (guardián de ambigüedad).

### Bloque B · GREEN

- [x] 1.5 GREEN — `sla.ts` en sitio (`:2`, `:4-31`, `:32-35`, `:39-44`, `:46-55`, `:68-70`) y al final: `ALARMAS_SLA: Partial<Record<Estado, { cargo: string; areaRespaldo: (typeof AREAS)[number]; soloSinOrdenVenta?: boolean; marcaTablero?: boolean }>>` y `estadosConAlarmaSinCargo(alarmas = ALARMAS_SLA)`.
  `slaVencido` = `Math.round(horasHabilesEntre(desde, ahora, cierres) * HORA_EN_MS) > horas * HORA_EN_MS` (`HORA_EN_MS` `:37` se reutiliza; estricta). `:39-44` deja un comentario de retirada de 6 líneas que dice por qué no hay fecha de vencimiento (D-2: `sumarHorasHabiles` no se construye).
  Confirmar que la importación no crea ciclo con `calendarioLaboral.ts` (`npm test` sin `ReferenceError`).
- [x] 1.6 **Puente** — `apps/desk/server/db/sla.ts:58` en `55eac92`, en sitio: `slaVencido(estado, desde, ahora, [])`, con comentario de una línea «puente; el lote 2 pasa los cierres de `listarCierres`» en la MISMA línea. `wc -l` sigue en 63. Correr `db/sla.test.ts` en verde (A.1).
- [x] 1.7 Confirmar 1.1-1.3 en verde y `npm run typecheck` limpio; `git diff --numstat -- packages/shared/src/sla.ts` = `+n −n` en sitio y sólo `+` al final; `sla.test.ts` 210 → 210+N con `−` sólo en las líneas de sitio.

### Bloque C · Mutaciones (regla 2: se ensucia lo vigilado)

- [x] 1.8 MUTACIÓN — `>` → `>=` en `slaVencido`: ROJO en 1.2 (el borde exacto de S2, S7 y S8); revertir.
- [x] 1.9 MUTACIÓN — quitar `Math.round`: ROJO en el borde fraccionario de 1.2. **Si nace verde, se declara** en `apply-progress.md` («la hipótesis de coma flotante no se reproduce con estos fixtures; el redondeo se conserva por seguridad») y no se maquilla; revertir.
- [x] 1.10 MUTACIÓN — `slaVencido` devuelve `false` si `estado ∈ ESTADOS_EN_ESPERA`: ROJO en S7, S8 y en la independencia de `:51-55` (S11); revertir.
- [x] 1.11 MUTACIÓN — (a) cargo `''` en una entrada de `ALARMAS_SLA`: ROJO en 1.3 (S13, S14); (b) `marcaTablero: true` en `Notificado`: ROJO en 1.3; (c) borrar la clave `Notificado` de `ALARMAS_SLA`: ROJO en «mismas claves»; (d) añadir una clave fuera de `SLA_HORAS_POR_ESTADO` (`'En Proceso'` con cargo): ROJO en «mismas claves»; (e) `areaRespaldo` fuera de `AREAS` (con `as never` para pasar el tipo): ROJO en 1.3; revertir todas.
- [x] 1.12 Cierre del lote 1: comando enfocado de la tabla; `npm test`; `npm run typecheck`; `eslint`; medir (sin ficheros nuevos); recuentos `sla.ts` 109 → 109+N, `sla.test.ts` 210 → 210+N, `db/sla.ts` 63 sin cambio;
  barrido de citas sobre `sla.ts` y `sla.test.ts` (relee las que cambian de contenido: `sla.ts:32-35`, `:39-44`, `:52-55` —caso B si alguna afirma «24 h de reloj»—, `:69-70`, `sla.test.ts:33`, `:51-55`, `:57-81`, `:188-191`; las de `bodegaje.ts:27` y `openspec/config.yaml` a `sla.ts:32` siguen en caso A) y `db/sla.ts:58`; `apply-progress.md` (~60 líneas, con el puente declarado).

---

## Lote 2 · BD y consulta: `alarmas_avisadas`, destinatarios, OV, candidatos

**Estimación:** código ~160 · pruebas ~255 · artefactos ~60 · **total ~475**. **Depende de:** Lote 1.

**Puntos de inserción (medidos en `4796aad`)**

| Fichero (líneas; citas) | Puntos | Tipo | Desplaza |
|---|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` (576; 214, la más alta `:576`) | tras `:576`: comentario SIN el carácter `;` (`migrate.ts:20` trocea por él) + `CREATE TABLE IF NOT EXISTS public.alarmas_avisadas` (`design.md` D-4) | FINAL | −0 |
| `packages/zoho-sync/src/db/migrate.ts` (131; 83) | `:73` (`PUBLIC_TABLES`): `alarmas_avisadas` al final de la lista | EN SU SITIO | −0 |
| `packages/zoho-sync/src/db/migrate.test.ts` (464; 60) | `:282` título (34 tablas, 21 de la app); `:283` `[10, 21, 3]`; `:284-286` `33` → `34`; `describe` de la clave primaria al FINAL tras `:464`. Los recuentos de `ALTER` (`:376-378`, 40/19/21) NO cambian | EN SU SITIO + FINAL | −0 |
| `apps/desk/server/db/avisos.ts` (93; 23) | `destinatariosDeCargo` al final (tras `:93`) | FINAL | −0 |
| `apps/desk/server/db/avisos.test.ts` | casos nuevos al final | FINAL | −0 |
| `apps/desk/server/db/sla.ts` (63; 24) | reescritura con `:40` fija (`export async function ticketsConSlaVencido(`); ≥64 líneas y sin vacías en `:2`, `:28`, `:48`, `:49`, `:58`; crece por el final (`tieneOrdenVenta`, `entradasActuales`) | EN SU SITIO + FINAL | 0 en `:1-40`; `:49` y `:58` cambian de contenido (caso B) |
| `apps/desk/server/db/sla.test.ts` (146) | en sitio: firma y `escalarA` → `alarma` (`:42-51`); `:141-145` sin tocar; `:118-133` sin tocar (ahora vigila el N+1); nuevas al final | EN SU SITIO + FINAL | −0 |

### Bloque A · Tabla (regla de mutación 2: se ensucia el fichero vigilado)

- [x] 2.1 RED — `migrate.test.ts`: en sitio `:282-286` (35 tablas, 22 de la app, `[10, 22, 3]`, `33` → `35`: `alarmas_avisadas` y `alarmas_corte`); al final, `describe` de la clave primaria de `alarmas_corte` (un segundo `id = 1` rechazado) y de la de `alarmas_avisadas`: una segunda inserción de la misma terna `(ticket_id, estado, entrada_at)` es rechazada, y otra `entrada_at` o otro `estado` para el mismo ticket entran (`avisos_creados` 0 y 2).
- [x] 2.2 Confirmar rojo natural (hay 33 tablas y las tablas no existen). El guardián `:266-275` (todo `CREATE TABLE` califica esquema) nace verde y se declara.
- [x] 2.3 GREEN — `schema.sql` tras `:576` (dos comentarios sin `;` + dos `CREATE TABLE`, `design.md` D-4) y `migrate.ts:73` en sitio.
- [x] 2.4 Confirmar 2.1 en verde y `migrate.integration.test.ts` sin cambios; `schema.sql` 576 → 576+N con `−0`; `migrate.ts` 131 sin cambio de largo.
- [x] 2.5 MUTACIÓN (regla 2) — escribir `public.` fuera del nombre: `CREATE TABLE IF NOT EXISTS alarmas_avisadas (…`: ROJO en el guardián `migrate.test.ts:266-275`; revertir; `git diff` limpio.
- [x] 2.6 MUTACIÓN (regla 2) — quitar `alarmas_avisadas` (y, aparte, `alarmas_corte`) de `migrate.ts:73`: ROJO en `:282-286`; revertir.
- [x] 2.7 MUTACIÓN (regla 2) — quitar `PRIMARY KEY (…)` de `schema.sql`: ROJO en el `describe` final de 2.1 (dos inserciones, una fila); revertir.

### Bloque B · `destinatariosDeCargo`

- [x] 2.8 RED — `avisos.test.ts` al final: dos usuarios activos con `cargo = 'Coordinador Comercial'`, uno inactivo con el mismo cargo y uno activo con otro cargo → exactamente dos (S22); `'  coordinador comercial '` coincide (`lower(trim())`); un administrador sin ese cargo NO aparece (a diferencia de `destinatariosDeArea`, `avisos.ts:74-93`); un cargo sin nadie → `[]`.
- [x] 2.9 **Comprobación de hipótesis H2 antes del GREEN:** el RED de 2.8 se ejecuta con `SELECT id, email, name FROM users WHERE active = true AND lower(trim(cargo)) = lower(trim($1))`. Si pg-mem lo rechaza, **plan B** escrito: `SELECT id, email, name, cargo FROM users WHERE active = true` y filtro en TS
  (`cargo?.trim().toLowerCase() === objetivo.trim().toLowerCase()`); se declara en `apply-progress.md`.
- [x] 2.10 GREEN — `destinatariosDeCargo(db, cargo)` al final de `avisos.ts` (tras `:93`), `−0`. Confirmar 2.8 en verde.
- [x] 2.11 MUTACIÓN — (a) quitar `active = true`: ROJO (inactivo aparece); (b) quitar `lower(trim(…))`: ROJO (normalización); (c) añadir administradores de oficio: ROJO (admin sin cargo); revertir las tres.

### Bloque C · `tieneOrdenVenta` y `ticketsConSlaVencido` sin N+1

- [x] 2.12 **Comprobación de hipótesis H3 y H5 antes del GREEN** (sondeos en `db/sla.test.ts`, se dejan como pruebas): (H3) insertar `performed_at` con microsegundos (`'2026-09-14 13:00:00.123456+00'` como literal) y comprobar qué devuelve pg-mem: si conserva µs, el `Date` de JS trunca a ms y la comparación de la marca debe ir **en TS por `getTime()`**, nunca en SQL contra `performed_at` (D-4);
  si pg-mem ya trunca, la hipótesis queda **sin demostrar en pg-mem**, se declara, y la comparación en TS se mantiene igual (ambos lados pasan por `Date`). (H5) `ticket_id IN (SELECT id FROM tickets WHERE status IN (…))` resuelto por pg-mem; **plan B:** pasar los ids de los candidatos con marcadores generados.
- [x] 2.13 RED — `db/sla.test.ts`: en sitio, `:42-51` espera `alarma: { cargo: 'Coordinador Comercial', soloSinOrdenVenta: undefined, … }` en vez de `escalarA` y `horas: 9`; al final:
  última entrada por `(performed_at, id)` máximos incluso con `performed_at` idéntico (S9 con empate; la prueba `:78-84` cubre la separación en el tiempo); ticket sin foto en cualquiera de los tres estados no se devuelve (S10, nace verde por `:95-104`);
  `Notificado` de `Equipo nuevo` con 9 h hábiles no se devuelve (S12, es `:141-145` sin tocar, nace verde); `Remisión creada` con 28 h hábiles y (a) sin OV por ninguna vía → devuelto (S16), (b) `orden_venta` → no (S17), (c) sólo `salesorder_id` → no (S18), (d) sólo asociación vigente → no (S19), (e) sólo asociación con `liberada_at` → devuelto (S20);
  `Notificado` y `Notificación cliente` vencidos con OV → devueltos (S21); **sin N+1:** con 1 y con 5 candidatos, el número de consultas a `ticket_transitions` y a `ov_asociaciones` es el mismo (≤ 1 y ≤ 1); los cierres se pasan por parámetro y se descuentan (un cierre entre medias evita el vencimiento).
- [x] 2.14 RED — `db/sla.test.ts` al final (enfrentamiento, molde de H5): para cada vía (`orden_venta`, `salesorder_id`, asociación vigente) y para una asociación liberada, `ticketConOrdenVenta` (`packages/zoho-sync/src/db/repo.ts:362-379`) encuentra el ticket ⇔ `tieneOrdenVenta` dice que tiene OV. Una definición, dos implementaciones, una prueba que las enfrenta.
- [x] 2.15 Confirmar rojo natural (la firma nueva, `alarma`, `horas` y `tieneOrdenVenta` no existen; con el puente el resultado sigue siendo `escalarA`). **Nacen verdes y se declaran:** S10, S12, y el conteo de `:118-133` con una sola consulta al historial.
- [x] 2.16 GREEN — `db/sla.ts`: nueva firma `(db, ahora, cierres)` y retorno `{ id, number, estado, desde, horas, alarma }`; tres consultas fijas (tickets con `status IN (…)` de `ALARMAS_SLA` con `orden_venta` y `salesorder_id`; `ticket_transitions` con `to_status IN (…) AND ticket_id IN (SELECT …)`; `ov_asociaciones WHERE liberada_at IS NULL AND ticket_id IN (…)` sólo si hay candidatos de `Remisión creada`);
  el filtro de flujo servicio se CONSERVA (objetivo: que siga en `:49`); `entradasActuales` y `tieneOrdenVenta` al final (con la misma definición de tres vías que `repo.ts:369-371`); `:58` deja de ser el puente. Comparación de la marca **por `getTime()` en TS** (2.12). Este lote no toca `index.ts`: `ticketsConSlaVencido` sigue sin llamador.
- [x] 2.17 Confirmar 2.13-2.14 en verde; **comprobar las líneas citadas:** `sed -n '2p;28p;40p;48p;49p;58p' apps/desk/server/db/sla.ts` sin ninguna vacía y `:40` = `export async function ticketsConSlaVencido(`; `db/sla.ts` ≥ 64 líneas; `git diff --numstat` de `avisos.ts` = sólo `+`.
- [x] 2.18 MUTACIONES — (a) quitar la vía `salesorder_id` de `tieneOrdenVenta`: ROJO en 2.14 y S18; (b) quitar `liberada_at IS NULL`: ROJO en S20 y 2.14; (c) quitar el filtro de flujo: ROJO en `:141-145` (S12); (d) tomar la primera entrada en vez de la última: ROJO en `:78-84` y S9; (e) volver a una consulta por ticket: ROJO en «sin N+1»;
  (f) **posición (regla 1):** evaluar la condición de OV antes o después del vencimiento: **nada se pone rojo, y se declara** — es intersección, como `calendarioLaboral.ts:134-137`; no hay orden que probar. Revertir todas.
- [x] 2.19 Cierre del lote 2: comando enfocado; `npm test`; `npm run typecheck`; `eslint`; medir; recuentos (`schema.sql` 576 → 576+N `−0`; `migrate.ts` 131; `migrate.test.ts` 464 → 464+N; `avisos.ts` 93 → 93+N; `db/sla.ts` ≥ 64); barrido de citas sobre `db/sla.ts` (24: `:2`, `:28`, `:48`, `:49`, `:58` cambian de contenido → caso B con revisión `6516e5f`),
  `schema.sql`, `migrate.ts`, `migrate.test.ts` (`:327`, `:409-411` no se mueven) y `avisos.ts`; `apply-progress.md` (~60 líneas, con los resultados de H2, H3, H5).

---

## Lote 3 · Servicio y cableado: `alarmasSla.ts` y `index.ts`

**Estimación:** código ~165 · pruebas ~400 · artefactos ~60 · **total ~625**. **Depende de:** Lote 2. Es el lote que activa las alarmas en vivo.

**Puntos de inserción (medidos en `4796aad`)**

| Fichero (líneas; citas) | Puntos | Tipo | Desplaza |
|---|---|---|---|
| `apps/desk/server/index.ts` (99; 69 con homónimos, 29 a `:84-99`) | `:15` se añade `; import { pasadaAlarmas } from './services/alarmasSla'` tras `;`; `:88` pasa a `let p: Promise<unknown> = pasadaAlarmas(pool, config).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))` (anidado: el guardián `avisoRitmoContrato.test.ts:194` exige la subcadena `pasadaRitmoContratos(pool).then(() => sync.syncRecent())`) | EN SU SITIO | −0 |

Ficheros nuevos: `apps/desk/server/services/alarmasSla.ts` y `apps/desk/server/services/alarmasSla.test.ts` (molde `avisoRitmoContrato.ts:25-75`). Ningún otro fichero muy citado se toca.

### Bloque A · Marca y aviso

- [x] 3.1 **H1, corregida el 2026-09-29** (H1 salió FALSA en el lote 2 y el `SELECT` previo deja ventana): `marcarYAvisarAlarma` abre con el `INSERT` de la marca SIN `ON CONFLICT`; `23505` → revertir, «ya avisado», `null` sin avisos y sin error hacia fuera; si entra, avisos en la misma transacción (`design.md` D-6).
  Pruebas: (a) dos llamadas seguidas → una marca y un solo juego de avisos; (b) marca ya presente → 0 avisos y sin error; (E) estructura: mismo cliente `BEGIN` → `INSERT` marca → avisos → `COMMIT`. Mutación: avisos ANTES del `INSERT` de la marca → rojo en (a) o en (E).
- [x] 3.2 RED — `alarmasSla.test.ts` (nuevo), **serie M** (`marcarYAvisarAlarma(db, v, destinatarios, texto)` llamada directa): doble llamada saltando el prefiltro → un aviso por destinatario y la segunda devuelve `null` (S28); dos llamadas en `Promise.all` → una gana, la otra no crea nada (S29);
  reentrar (otro `entrada_at`, mismo ticket y estado) → marca y aviso nuevos (S30); mismo ticket avisado en `Notificado` y luego vencido en `Remisión creada` → aviso nuevo (S31); sin destinatarios → marca con `avisos_creados = 0`, cero avisos, y la segunda llamada directa no crea nada (la marca devolvió fila una sola vez);
  **atomicidad por estructura (E):** el registro de consultas del cliente muestra `BEGIN` → `INSERT` marca → `INSERT` aviso → `COMMIT` sobre el MISMO cliente, y un `crearAviso` que lanza produce `ROLLBACK` sin `COMMIT` (S32; pg-mem no honra el `ROLLBACK`: **hipótesis** H4, según `avisoRitmoContrato.ts:18`, cita de segunda mano); texto con `#N`, el estado y las horas hábiles (S23).
- [x] 3.3 RED — `alarmasSla.test.ts`, **serie P** (`pasadaAlarmas(db, config, ahora)`): dos usuarios con el cargo → un aviso por usuario (S22); **corte (S-13 revisado):** primera pasada con un ticket ya vencido → marca con `avisos_creados = 0`, cero avisos, cero `fetch`, fila en `alarmas_corte` con ese `ahora`; un ticket que vence DESPUÉS del corte → aviso normal en la pasada siguiente (S33);
  reinicio simulado (el corte ya escrito, `ahora` posterior) → el corte no cambia y un vencido posterior sin marca avisa (S46); segunda pasada → cero consultas a `users` (espía) y ningún aviso nuevo;
  **los dos caminos del destinatario (S-4 segunda revisión):** sin nadie con el cargo y un receptor del área `Comercial` → aviso a los de `destinatariosDeArea` (incluye administradores de oficio), marca con ese recuento y UN `logger.warn` que contiene «sin Coordinador Comercial», aun con una segunda pasada (S24); con alguien en el cargo y un receptor del área → sólo el del cargo, sin `warn` (S25); sin cargo ni área (sin administradores) → marca con `avisos_creados = 0` y el mismo `warn`; `Remisión creada` con OV por cada vía → sin aviso ni marca (S17-S19, nivel pasada); con asociación liberada o sin OV → aviso y marca (S16, S20); `Notificado` y `Notificación cliente` con OV → avisan (S21);
  con OV que luego se pierde y sigue vencido → la pasada siguiente avisa (S34); un error de lectura en el primer ticket no impide el segundo (S35); un fallo global (`listarCierres` lanza) → `pasadaAlarmas` devuelve sin lanzar y queda `logger.error` (S36);
  un cierre añadido entre dos pasadas se descuenta en la segunda (S37); ticket sin foto → sin marca ni aviso (S38); **cargo declarado como dato (S15):** se cambia el cargo de `ALARMAS_SLA['Remisión creada']` dentro de `try/finally` y sólo reciben aviso los usuarios de ese cargo, no los de `Coordinador Comercial`
  (si el tipo hace la tabla de sólo lectura, `avisarAlarmasVencidas` gana un último parámetro `alarmas = ALARMAS_SLA`; decisión del apply, se declara).
- [x] 3.4 RED — `alarmasSla.test.ts`, **correo:** con un `fetch` falso que rechaza o agota tiempo → aviso y marca escritos, `enviado_at` `NULL`, la pasada no lanza (S26); con la configuración de correo vacía → el aviso entra y `fetch` no se llama (S27, nace verde si `dispararAvisos`, `avisosWebhook.ts:53`, ya lo hace: se declara);
  **posición (regla 1):** registro de eventos donde `fetch` ocurre DESPUÉS del `COMMIT` y en un solo lote al final de la pasada; `marcarEnviados` sólo si `disparado`; `conCopia: true`.
- [x] 3.5 RED — `alarmasSla.test.ts`, **guardián de `index.ts`** (molde `avisoRitmoContrato.test.ts:185-195`): lee `index.ts` y exige la línea `pasadaAlarmas(pool, config).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))` y el `import` de `:15` (S36, parte estructural); el guardián de ritmo `:194` sigue verde con la línea nueva.
- [x] 3.6 Confirmar rojo natural (el módulo no existe: todo rojo). Declarar los que nacen verdes: S27 y el guardián `avisoRitmoContrato.test.ts:194` (que se comprueba antes y después del GREEN).

### Bloque B · GREEN

- [x] 3.7 GREEN — `services/alarmasSla.ts`: `marcarYAvisarAlarma` dentro de `enTransaccion` (`db/transaccion.ts:13`); `avisarAlarmasVencidas(db, config, ahora)` con `listarCierres` → `ticketsConSlaVencido(db, ahora, cierres)` → una consulta de marcas existentes (prefiltro) → por vencido nuevo, `try/catch` propio;
  destinatarios resueltos ANTES de la transacción y memorizados por cargo dentro de la pasada; `logger.warn({ cargo, estado, ticketId })` sólo cuando la marca devolvió fila; correo tras todas las transacciones en un solo lote (`dispararAvisos` + `marcarEnviados` en `try/catch`, molde `ticketService.ts:215-219`);
  `pasadaAlarmas(db, config, ahora = new Date())` NUNCA lanza; texto de D-6. El prefiltro de marcas vive aquí; `db/alarmasAvisadas.ts` (lote 4) lee marcas por su cuenta.
- [x] 3.8 GREEN — `index.ts` en sitio: `:15` y `:88` como en la tabla. `wc -l` sigue en 99.
- [x] 3.9 Confirmar 3.2-3.5 en verde y `avisoRitmoContrato.test.ts` entero en verde; `git diff --numstat -- apps/desk/server/index.ts` = `+2 −2` (o `+1 −1` por línea); `index.ts` 99 sin cambio.

### Bloque C · Mutaciones del diseño (reglas 1 y 2)

- [x] 3.10 MUTACIÓN (regla 1) — `crearAviso` ANTES del `INSERT` de la marca: ROJO en S28 (dos avisos en vez de uno con la doble llamada directa); revertir.
- [x] 3.11 MUTACIÓN (regla 1) — `dispararAvisos` DENTRO de la transacción: ROJO en el registro de eventos de 3.4 (el `fetch` debe ir detrás del `COMMIT`); revertir.
- [x] 3.12 MUTACIÓN (regla 1) — (a) `logger.warn` ANTES del `INSERT` de la marca: ROJO en S24 (dos pasadas sin nadie en el cargo: un solo `warn`); (b) consultar el área antes del cargo o sumar las dos listas: ROJO en S25; revertir.
- [x] 3.13 MUTACIÓN (regla 1) — quitar el prefiltro de marcas: ROJO en 3.3 (la segunda pasada consulta `users`, el espía cuenta una); revertir.
- [x] 3.14 MUTACIÓN (regla 1) — condición de OV antes o después del vencimiento: **nada rojo, declarado** (intersección; ya cubierto en 2.18-f); no se repite aquí.
- [x] 3.15 MUTACIÓN (regla 2) — quitar `pasadaAlarmas(pool, config)` de `index.ts:88`: ROJO en el guardián de 3.5 (S36); y el de ritmo `:194` sigue VERDE (demuestra que el guardián nuevo discrimina y que el viejo no lo hacía por la nueva línea); revertir.
- [x] 3.16 MUTACIÓN (regla 2) — forma plana `pasadaAlarmas(pool, config).then(() => pasadaRitmoContratos(pool)).then(() => sync.syncRecent())`: ROJO en `avisoRitmoContrato.test.ts:194` (prueba que el anidamiento no es estético); revertir.
- [x] 3.17 MUTACIONES — (a) cargo `'Coordinador Comercial'` literal en la pasada en vez de `alarma.cargo`: ROJO en S15; (b) quitar el `try/catch` por ticket: ROJO en S35; (c) leer los cierres una sola vez (variable de módulo): ROJO en S37; (d) corte = `ahora` de cada pasada, sin leer la tabla: ROJO en S46; (e) comparar el vencimiento contra `ahora` en vez de contra el corte: ROJO en S33; (f) quitar `ON CONFLICT (id) DO NOTHING` de la escritura del corte: ROJO en S46; revertir.
- [x] 3.18 Cierre del lote 3: comando enfocado; `npm test`; `npm run typecheck`; `eslint`; medir (nuevos: `alarmasSla.ts`, `alarmasSla.test.ts`); recuentos `index.ts` 99 sin cambio; barrido de citas sobre `index.ts` (69; las 29 a `:84-99`: `:88` cambia de contenido → caso B para las que afirmen «`pasadaRitmoContratos` es lo primero» o «`:88`» como línea del ritmo);
  `apply-progress.md` (~60 líneas, con H1 y H4 y la lista de nacidos verdes).

---

## Lote 4 · Tablero y cierre

**Estimación:** código ~65 · texto R08.3 ~30 · pruebas ~220 · artefactos ~60 · **total ~375**. **Depende de:** Lote 3. `apps/desk/src` está fuera de la red de pruebas (F0-00, `vitest.config.ts:16-20`): sin RED/GREEN para `.tsx`; **no se propone `jsdom`**.

**Puntos de inserción (medidos en `4796aad`)**

| Fichero (líneas; citas) | Puntos | Tipo | Desplaza |
|---|---|---|---|
| `packages/shared/src/types.ts` (810; 43, hasta `:713`) | `:37` gana `esperandoAprobacionCliente?: boolean` EN LA MISMA LÍNEA (`read?: boolean; esperandoAprobacionCliente?: boolean`) | EN SU SITIO | −0 |
| `apps/desk/server/routes/tickets.ts` (223; 67) | `:9` importación de `ticketsEsperandoAprobacionCliente` tras `;`; `:115` una sola línea que añade `esperandoAprobacionCliente: marcados.has(row.id)` a `rowToTicket`; el listado de cerrados (`:110`) no lleva el campo | EN SU SITIO | −0 |
| `apps/desk/src/components/TicketCard.tsx` (102; 49, la más alta `:83`) | bloque nuevo TRAS `:96` que pinta «Esperando aprobación del cliente» sólo si el campo es `true` | INSERCIÓN | +N sólo en `:97-102`, sin citas |
| `docs/sdd/R08.3_Expediente_de_cambios.md` (~657) | texto para el expediente (`toca_maestro: si`, sin tocar el `.docx`) | FINAL | −0 |

Ficheros nuevos: `apps/desk/server/db/alarmasAvisadas.ts` y `apps/desk/server/db/alarmasAvisadas.test.ts`. `apps/desk/server/tickets.test.ts` gana pruebas al final.

### Bloque A · Marca de tablero (servidor)

- [x] 4.1 RED — `alarmasAvisadas.test.ts` (nuevo): `ticketsEsperandoAprobacionCliente(db)` devuelve el ticket en `Notificación cliente` con marca de su entrada actual (S39, y sin escribir en `ticket_transitions`: conteo antes y después); sin marca (36 h hábiles exactas) → no (S40); tras ejecutar una transición y salir, con la fila de marca intacta → no (S41);
  reentra y aún no vence → no, la marca es de la entrada anterior (S42, comparación por `getTime()`); ticket marcado en `Notificado` o `Remisión creada` → no (S43, el estado sin `marcaTablero`); ante un `db` que lanza → `logger.warn` y conjunto vacío, nunca lanza.
- [x] 4.2 RED — `tickets.test.ts` al final (`appHarness`): `GET` del listado trae `esperandoAprobacionCliente: true` para el ticket marcado y `false` para los demás (S39, nivel ruta); el listado de cerrados no trae el campo.
- [x] 4.3 Confirmar rojo natural (módulo y campo no existen). **Nacen verdes y se declaran:** «el listado de cerrados no lleva el campo» (`undefined` hoy) y S43 a nivel ruta si el conjunto vacío ya lo produce.
- [x] 4.4 GREEN — `db/alarmasAvisadas.ts`: `ticketsEsperandoAprobacionCliente(db)` cruza `entradasActuales` (de `db/sla.ts`, lote 2) de los estados con `marcaTablero` con sus marcas por `getTime()`; `try/catch` con `logger.warn` y `new Set()`.
- [x] 4.5 GREEN — `types.ts:37`, `routes/tickets.ts:9` y `:115` en sitio (D-8). Confirmar 4.1-4.2 en verde; `git diff --numstat` de `types.ts` y `routes/tickets.ts` = `+n −n` con 810 y 223 sin cambio.
- [x] 4.6 MUTACIÓN — (a) comparar la marca sólo por `(ticket_id, estado)` sin `entrada_at`: ROJO en S42; (b) no exigir que el estado actual sea `Notificación cliente`: ROJO en S41; (c) `marcaTablero: true` en `Notificado` de `ALARMAS_SLA`: ROJO en S43 (y en 1.3); (d) quitar el `try/catch`: ROJO en «nunca lanza»; revertir.

### Bloque B · Cliente

- [x] 4.7 `TicketCard.tsx`: bloque tras `:96` con el texto «Esperando aprobación del cliente» (español, capa de presentación) sólo si `ticket.esperandoAprobacionCliente === true`. El cliente no lee calendario, no compara horas, no calcula vencimiento (RQ-VT-08).
- [x] 4.8 Sin prueba posible (F0-00): `npm run typecheck`, `npm run build` y `npx eslint . --max-warnings 165` en verde. La imposición está probada en node: 4.1-4.2.

### Bloque C · Cierre

- [x] 4.9 **Regla de mutación 3 — casilla de la regla 13, decisión a decisión de `TicketCard.tsx`** (se escribe en `apply-progress.md`, con la línea REAL leída al cerrar, no la del diseño). Se lee el fichero entero (102 líneas) y se enumera lo que el cliente bloquea, rellena solo o avisa:
  | Decisión del cliente | Línea del servidor que la impone (a confirmar) |
  |---|---|
  | Pintar la marca sólo si el campo es `true` | `db/alarmasAvisadas.ts` (línea real) y `routes/tickets.ts:115`; pruebas S39-S43 |
  | No bloquear ni cambiar de estado | ninguna ruta lo hace; 4.1 prueba que `ticket_transitions` no cambia |
  | No calcular el vencimiento ni el calendario | `db/sla.ts` (`slaVencido` con cierres) y `alarmasSla.ts`; S1-S8 |
  | Cualquier otra decisión que aparezca al leer el fichero | — |
  Sin línea, la decisión es la guarda: se para y se declara. S44 se verifica por lectura: `grep -nE "horasHabiles|calendario|cierres|venc" apps/desk/src/components/TicketCard.tsx` sin resultados y el campo consumido sólo en el bloque de 4.7.
- [x] 4.10 **Barrido de la regla de mutación 4 sobre CADA fichero muy citado tocado** (`sla.ts`, `sla.test.ts`, `db/sla.ts`, `db/sla.test.ts`, `avisos.ts`, `index.ts`, `schema.sql`, `migrate.ts`, `migrate.test.ts`, `types.ts`, `routes/tickets.ts`, `TicketCard.tsx`, y los `*.test.ts` ampliados al final).
  Comando por fichero: `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`, y un segundo pase con la forma abreviada (`` `:NN` ``) en los ficheros que ya citan el módulo.
  Tres reglas: los DOS extremos de cada rango; lo que AFIRMA la frase y no sólo que la línea exista; A/B/C para reparar. Como ninguna edición desplaza líneas, es verificación de contenido. Se releen a mano las que cambian de contenido:
  `sla.ts:32-35`, `:39-44`, `:52-55`, `:69-70`; `sla.test.ts:33`, `:51-55`, `:57-81`, `:188-191`; `db/sla.ts:40-63` (en particular `:49` y `:58`, que citan las specs vivas de `transitions-st` y `transitions-equipo-nuevo`); `index.ts:88`; `TicketCard.tsx:96-102`.
  Después, el detector de `hook-citas-pre-push` sobre el diff: 0 rotas nuevas (no se salta con `--no-verify`).
- [x] 4.11 Texto para el expediente R08.3, AL FINAL de `docs/sdd/R08.3_Expediente_de_cambios.md` (~30 líneas, sin tocar el `.docx`): Anexo D nº 3 y M1.7 construidos (tres alarmas en horas hábiles: 9, 27 y 36); el maestro sigue diciendo «24 o 48 h» (`R08.2.md:3744`, `:4011`) y «SLA de 1 día» (`:1648`): esas líneas se RELEEN contra `R08.2.md` antes de citarlas;
  el destinatario de `Notificado` es un supuesto (S-3, P.4); la marca de tablero es de vista, no un estado (`decision/anexo-3-alerta`, `openspec/config.yaml:2329`, consecuencia 4); las «vistas equivalentes a Zoho» (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:93-111`) siguen abiertas.
- [x] 4.12 Comprobar que `git diff --stat HEAD -- CLAUDE.md openspec/config.yaml` está vacío (R-2 no aplica: no hay capacidad nueva).
- [x] 4.13 **Para el `archive-report`** (se redacta aquí, en `apply-progress.md`; lo inserta el archive, no este apply): (a) **adenda a E-087** — las alarmas son el segundo dependiente de la pasada que hoy es la de la sincronización con Zoho; al retirarla sin trasladar la llamada, callarían sin que nada se ponga rojo (RQ-AV-17);
  (b) una línea con qué parte de la fila F1B-08 cubre (alarma en horas hábiles, aviso y marca) y qué deja fuera (vistas equivalentes a Zoho, pregunta 4; `cierra: no`); (c) corrección documental de §3.7 y §3.10 de la spec viva `transitions-st` («no hay planificador», «destinatario derivado del grafo»); (d) resultado de P.1 y P.3 si ya existe; (e) la nota de despliegue literal de abajo.
- [x] 4.14 Cierre general: `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; medir el lote (nuevos: `alarmasAvisadas.ts`, `alarmasAvisadas.test.ts`); confirmar uno a uno los ocho criterios de éxito de `proposal.md:164-173`; `apply-progress.md` (~60 líneas, con la casilla de 4.9).

---

## Nota para el cierre — paquete de despliegue (literal)

Antes de desplegar hace falta un paquete de despliegue NUEVO (`docs/sdd/Paquete_de_Despliegue_2026-09-29.md` es un registro fechado y no se edita). Recoge `tickets.modalidad` (`packages/zoho-sync/src/db/schema.sql:576`) y S-6 de `blueprint-soporte-remoto` con el recuento de su P.1 (o «sin medir»), y de esta tanda:

1. **Dos tablas nuevas**, sin relleno: `public.alarmas_avisadas` (marca anti-duplicado; clave primaria ticket, estado, instante de entrada) y `public.alarmas_corte` (una fila: el corte de la primera pasada).
2. **Cambio visible de `Notificado`:** pasa de 24 h de reloj a 9 h HÁBILES (jornada 08:00-17:00, sin fines de semana, festivos ni cierres). En días laborables avisa antes; en fin de semana, más tarde.
3. **Dos alarmas nuevas:** `Remisión creada` a las 27 h hábiles (sólo si el ticket no tiene orden de venta por ninguna vía) y `Notificación cliente` a las 36 h hábiles (además, marca el ticket en el tablero «Esperando aprobación del cliente»).
4. **El día del despliegue (corte de S-13):** la primera pasada fija el corte; lo que YA estaba vencido se marca y NO se avisa (sale la marca del tablero, no el correo). Lo que venza después avisa normal. Un reinicio o un redespliegue no mueven el corte.
5. **A quién:** al usuario activo con cargo `Coordinador Comercial`; si no hay ninguno, al área Comercial, con un `warn` «Alarma de SLA sin Coordinador Comercial» en el log.
6. **Pendientes de persona que acompañan al paquete:** P.1 (que exista en producción el cargo `Coordinador Comercial`; no bloquea); P.3 (Gerencia: si quiere la ráfaga de lo vencido antes del despliegue; por defecto, apagada); P.4 (Gerencia: confirmar que `Notificado` escala al Coordinador Comercial).

Se despliegan los cuatro lotes juntos. Rollback: revertir; las tablas son nuevas y sólo las lee este código (el corte ya escrito no se reescribe al volver a desplegar), y sin la llamada en `index.ts:88` no hay avisos ni marca. La pasada de alarmas depende de la sincronización con Zoho (adenda a E-087).

---

## Matriz de cobertura de escenarios (46/46)

21 en `transitions-st` (S1-S21: RQ-TS-15 S1-S12, RQ-TS-16 S13-S15, RQ-TS-19 S16-S21), 18 en `derivacion-avisos` (S22-S38 y S46: RQ-AV-15 S22-S27, RQ-AV-16 S28-S34 y S46, RQ-AV-17 S35-S38), 7 en `vistas-tablero` (S39-S45: RQ-VT-07 S39-S44, RQ-VT-08 S45). **Total 46.**
`(V)` = nace VERDE y se prueba su discriminación por mutación o como regresión; `(E)` = probado por estructura porque pg-mem no honra `ROLLBACK`; `(M)` = manual. Todo se declara en `apply-progress.md`.

| # | Requisito | Escenario | Lote | Tarea(s) |
|---|---|---|---|---|
| S1 | RQ-TS-15 | La tabla tiene exactamente tres alarmas, en horas hábiles | 1 | 1.1, 1.4-1.5 |
| S2 | RQ-TS-15 | Exactamente en el umbral no vence, ni fuera de jornada | 1 | 1.2, 1.8 |
| S3 | RQ-TS-15 | Un milisegundo después del umbral, vence | 1 | 1.2, 1.8 |
| S4 | RQ-TS-15 | El fin de semana no cuenta | 1 | 1.2 |
| S5 | RQ-TS-15 | Un festivo no cuenta | 1 | 1.2 |
| S6 | RQ-TS-15 | Un cierre de `public.calendario_cierres` no cuenta | 1 | 1.2 |
| S7 | RQ-TS-15 | `Remisión creada` vence pasadas 27 h hábiles exactas | 1 | 1.2, 1.10 |
| S8 | RQ-TS-15 | `Notificación cliente` vence pasadas 36 h hábiles exactas | 1 | 1.2, 1.10 |
| S9 | RQ-TS-15 | Reentrar reinicia el reloj, se mide desde la última entrada | 2 | 2.13, 2.18-d |
| S10 | RQ-TS-15 | Un ticket sin foto de entrada no se mide | 2, 3 | 2.13 (V: `db/sla.test.ts:95-104`), 3.3 |
| S11 | RQ-TS-15 | La alarma no lee la clasificación de espera | 1 | 1.1, 1.10 |
| S12 | RQ-TS-15 | `Notificado` de `Equipo nuevo` no se mide | 2 | 2.13 (V: `db/sla.test.ts:141-145`), 2.18-c |
| S13 | RQ-TS-16 | Toda alarma declara un cargo | 1 | 1.3, 1.11 |
| S14 | RQ-TS-16 | Una alarma sin cargo pone en rojo la prueba | 1 | 1.3, 1.11 |
| S15 | RQ-TS-16 | Cambiar el cargo no depende del grafo | 3 | 3.3, 3.17-a |
| S16 | RQ-TS-19 | Sin OV por ninguna vía y vencido, alarma | 2, 3 | 2.13, 3.3 |
| S17 | RQ-TS-19 | Con `orden_venta`, sin alarma | 2, 3 | 2.13-2.14, 3.3 |
| S18 | RQ-TS-19 | Con `salesorder_id`, sin alarma | 2, 3 | 2.13-2.14, 2.18-a, 3.3 |
| S19 | RQ-TS-19 | Con asociación vigente, sin alarma | 2, 3 | 2.13-2.14, 3.3 |
| S20 | RQ-TS-19 | Una asociación liberada no cuenta como OV | 2, 3 | 2.13-2.14, 2.18-b, 3.3 |
| S21 | RQ-TS-19 | Las otras dos alarmas no miran la OV | 2, 3 | 2.13, 3.3 |
| S22 | RQ-AV-15 | Un aviso por cada usuario con el cargo | 2, 3 | 2.8, 2.10-2.11, 3.3 |
| S23 | RQ-AV-15 | El texto nombra ticket, estado y plazo | 3 | 3.2 |
| S24 | RQ-AV-15 | Sin nadie con el cargo, el aviso va al área de respaldo con un warn | 3 | 3.3, 3.12-a |
| S25 | RQ-AV-15 | Con alguien en el cargo, el área no recibe el aviso | 3 | 3.3, 3.12-b |
| S26 | RQ-AV-15 | Un fallo del correo no tumba nada | 3 | 3.4 |
| S27 | RQ-AV-15 | Config de correo vacía es un no-op explícito | 3 | 3.4 (V) |
| S28 | RQ-AV-16 | Dos pasadas no duplican | 3 | 3.2, 3.10, 3.13 |
| S29 | RQ-AV-16 | Dos pasadas concurrentes no duplican | 3 | 3.1, 3.2 |
| S30 | RQ-AV-16 | Reentrar vuelve a avisar | 3 | 3.2 |
| S31 | RQ-AV-16 | La marca distingue estados | 3 | 3.2 |
| S32 | RQ-AV-16 | Marca y aviso van en la misma transacción | 3 | 3.2 (E), 3.11 |
| S33 | RQ-AV-16 | Lo vencido antes del corte se marca sin avisar; lo posterior avisa | 3 | 3.3, 3.17-e |
| S34 | RQ-AV-16 | `Remisión creada` con OV no deja marca | 2, 3 | 2.13, 3.3 |
| S35 | RQ-AV-17 | Un error en un ticket no detiene el resto | 3 | 3.3, 3.17-b |
| S36 | RQ-AV-17 | La pasada no bloquea la sincronización | 3 | 3.3, 3.5, 3.15-3.16 |
| S37 | RQ-AV-17 | Los cierres se leen en cada pasada | 3 | 3.3, 3.17-c |
| S38 | RQ-AV-17 | La pasada ignora tickets sin foto de entrada | 2, 3 | 2.13 (V), 3.3 |
| S39 | RQ-VT-07 | Vencido con marca, el listado lo señala | 4 | 4.1-4.2, 4.4-4.5 |
| S40 | RQ-VT-07 | En `Notificación cliente` sin vencer, no | 4 | 4.1 |
| S41 | RQ-VT-07 | Al salir del estado deja de traerla | 4 | 4.1, 4.6-b |
| S42 | RQ-VT-07 | Al reentrar no hereda la marca anterior | 4 | 4.1, 4.6-a |
| S43 | RQ-VT-07 | Otro estado vencido no produce la marca | 4 | 4.1, 4.6-c |
| S44 | RQ-VT-07 | El cliente no decide | 4 | 4.9 (lectura del `.tsx`) |
| S45 | RQ-VT-08 | Manual: la tarjeta muestra la marca | 4 | 4.7, P.2 (M) |
| S46 | RQ-AV-16 | El corte no se mueve con un reinicio | 3 | 3.3, 3.17-d, 3.17-f |

**46/46 escenarios cubiertos.** Los `(V)` nacen verdes porque el comportamiento ya existe (`db/sla.test.ts:95-104`, `:141-145`) o porque el lote anterior lo entrega; su rojo lo dan las mutaciones 2.18, 3.10-3.17 y 4.6, no un RED natural.
`.tsx` (tarjeta): sin escenario automatizable (F0-00); cubierto por la casilla de la regla 13 (4.9) y por P.2.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Cada una con dueño, destino y dónde queda escrita. **Archivar este cambio NO las da por hechas.** Ninguna describe trabajo que una tanda pueda hacer en este repositorio (se comprobó al sacarlas: el apply no puede consultar producción ni desplegar).

- **P.1 · Alfonso / administración — cargo `Coordinador Comercial` activo en producción (NO bloqueante desde la segunda revisión de S-4, 2026-09-29).** Verificar que al menos un usuario activo tiene `cargo = 'Coordinador Comercial'` (texto libre de firma de la remisión, `apps/desk/server/auth/routes.ts:67-68`; un «Coord. Comercial» no casa).
  Destino: sin él, las tres alarmas avisan al área Comercial (`destinatariosDeArea`) y dejan un `logger.warn` «sin Coordinador Comercial»; nada queda mudo. Escrita en: este documento, `proposal.md` (§Tareas de persona) y el `archive-report`. Consulta de sólo lectura (hipótesis de nombres de tabla: `public.users`):
  ```sql
  SELECT id, email, active FROM public.users WHERE lower(trim(cargo)) = 'coordinador comercial';
  ```
  Resultado (a rellenar): `_________`.
- **P.2 · Alfonso / Comercial — verificación en la app tras desplegar los cuatro lotes**, en `ambientalia-desk.ambientalia.cloud`: (1) el Coordinador Comercial ve en la campana el aviso de un ticket vencido en `Notificado`; (2) un ticket vencido en `Notificación cliente` muestra «Esperando aprobación del cliente» en su tarjeta y uno no vencido no la muestra;
  (3) un ticket en `Remisión creada` con orden de venta no genera aviso; (4) al sacar el ticket de `Notificación cliente`, la marca desaparece; (5) el correo llega o, si no, `enviado_at` queda vacío sin romper nada. Destino: verificación en la app (S45). Escrita en: este documento, `proposal.md` y el `archive-report`.
- **P.3 · Gerencia — ¿se enciende la ráfaga de lo vencido antes del despliegue? (S-13 revisado, 2026-09-29; NO bloqueante).** Por defecto está APAGADA: la primera pasada fija el corte y marca SIN avisar lo que ya estaba vencido (sale la marca de tablero, no el correo), porque el correo enviado no se recupera. Si Gerencia la quiere encendida, se cambia en código ANTES de desplegar (sólo tiene efecto en la primera pasada; si hiciera falta un interruptor, nace cerrado, `=== 'true'`, en `.env.example` y `DEPLOY.md` con sus dos frases). Tamaño de lo que se marca en silencio, cota superior de sólo lectura (no aplica horas hábiles ni la condición de OV, así que sobreestima):
  ```sql
  SELECT t.status, count(*) FROM desk.tickets t
  WHERE t.status IN ('Notificado', 'Remisión creada', 'Notificación cliente')
    AND EXISTS (SELECT 1 FROM desk.ticket_transitions tt WHERE tt.ticket_id = t.id AND tt.to_status = t.status)
  GROUP BY t.status;
  ```
  Destino: la respuesta de Gerencia (encender o no) se registra en `openspec/config.yaml` → `decisiones_de_gerencia`; sin respuesta, se despliega apagada. Escrita en: la nota de despliegue, el `archive-report` y este documento. Sin medir, el paquete dice «sin medir».
- **P.4 · Gerencia — confirmar que `Notificado` escala al `Coordinador Comercial` (S-3).** Ninguna decisión lo nombra; coincide con la derivación viva. Destino: si la respuesta es otro cargo, se cambia UN literal de `ALARMAS_SLA` y su prueba (1.3). La PREGUNTA se registra en la bandeja al cerrar (documentación directa del orquestador, no cuenta); la RESPUESTA es de Gerencia.

## Dependencias entre lotes

Lote 1 es la base: `ALARMAS_SLA`, el umbral hábil y `slaVencido` con cierres viven en `packages/shared` (regla 13: una sola fuente), con un puente en `db/sla.ts:58` en `55eac92` para no romper el servidor (A.1). Lote 2 depende sólo del 1: tabla, destinatarios, `tieneOrdenVenta` y la consulta sin N+1 consumen `shared`. Lote 3 depende del 2 y es el que activa las alarmas.
Lote 4 depende del 3: el campo del tablero lee `entradasActuales` (lote 2) y las marcas que escribe el lote 3; el cierre (regla 4, regla 13) sólo tiene sentido con todo el código dentro. Una tanda SDD por árbol (regla del ciclo 2): los cuatro lotes van **en serie**; `verify` y `archive` son intentos aparte del ledger, y el archive suma el `git mv` y supera 800 por eso.
