# Tareas: `marcador-migracion-lectores` (F1F-01, `cierra: no`)

Partida `e728808d`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Orden TDD en cada bloque: prueba en rojo, ver el rojo, código, verde.
Las líneas citadas son las de `e728808d` y no se mueven (design §5). La rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`.
`M<n>` y `R<n>`, `P<n>` son los ids de design §6-§7; los RQ y escenarios, los de las deltas `specs/{trazas,hojas-vida,tickets-core}/spec.md`.

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas (bruto × 1,8) | L1 ~260 × 1,8 ≈ 470; L2 ~190 × 1,8 ≈ 340; total ≈ 810 |
| Riesgo frente a 400 líneas | High por tanda; cada lote queda bajo el techo de 800 del registro |
| ¿Partir? | Sí: dos lotes, dos intentos de `gentle-ai sdd-attempt`, UNA rama que se fusiona entera a `main` |
| Delivery strategy | ask-on-risk (preflight de `openspec/config.yaml:22-30`; una sola rama) |
| Chain strategy | size-exception (una fusión; los lotes son intentos, no PR encadenados) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

Si la medida de un lote pasa de 800, se para y se parte (no se cierra el intento).

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| L1 | módulo con la regla y los tres relojes | `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/migracionTicketsAbiertos.test.ts` | pg-mem de las pruebas (la escritura real de la migración en R4) | revertir el commit de L1 (L2 depende de él) |
| L2 | presentador, historial, conversación, hoja de vida, traspaso y barrido | misma orden más `apps/desk/server/db/traspaso.test.ts apps/desk/server/db/historialTipoEvento.test.ts` | pg-mem; P13 escanea el repositorio | revertir el commit de L2 |

## L1 · núcleo y relojes (intento 1)

### Rojo
- [ ] 1.1 Crear `packages/shared/src/marcadorMigracion.test.ts` con las unitarias de `entradaDelMarcador`/`resolverMarcador`: las cuatro ramas de D-4 (nulo, `entregado-a-finalizado`, `pendiente-servicio-a-en-proceso`, regla desconocida = S-13), normalización de D-2, `null` sin fecha (S-6/S-11) y orden de la etapa sintética al final (D-5). Cubre RQ-TC-84/85.
- [ ] 1.2 Reescribir en sitio R1: `apps/desk/server/migracionMarcadorLectores.test.ts:41-44` a `toEqual([])`, mismas 4 líneas (D-11); título sin cita desfasada. Escenario TC-84 «identidad» y S-13.
- [ ] 1.3 Reescribir en sitio R4: `apps/desk/server/db/migracionTicketsAbiertos.test.ts:142-147` a `toEqual([])` y título nuevo, mismas 6 líneas. TC-84 «sin fecha de Zoho».
- [ ] 1.4 Imports nuevos en las líneas 1, 2, 4 y 13 de `apps/desk/server/migracionMarcadorLectores.test.ts`, unidos con `;` (design §6).
- [ ] 1.5 Añadir al final de `apps/desk/server/migracionMarcadorLectores.test.ts` un `describe` de L1 con el ayudante del marcador (values reales) y el de `TicketUpdated` de `ticket_history` (`packages/zoho-sync/src/db/schema.sql:244-253`, con `id` propio): P1, P2, P3 (TC-84), P4, P5, P6, P7 (TC-85), P8, P9 (TC-86).
- [ ] 1.6 Ver el rojo con la orden exacta: `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/migracionTicketsAbiertos.test.ts`; anotar qué prueba cae y por qué (importación, valor) para `apply-progress.md`.

### Verde
- [ ] 1.7 Crear `packages/shared/src/marcadorMigracion.ts` (design §4): `FilaConMarcador`, `EntradaDelMarcador`, `entradaDelMarcador` (D-2, D-3, D-4, sólo con `esPasoDeMigracion`) y `resolverMarcador` (D-5). Sin DB ni reloj.
- [ ] 1.8 `packages/shared/src/index.ts`: línea 57 NUEVA `export * from './marcadorMigracion'` tras la 56.
- [ ] 1.9 `apps/desk/server/db/sla.ts:2` (import de `shared` más `import { json } from './ticketFuentes'`), `:88` (`SELECT` con `transition_id, from_status, values`) y `:93` (itera `conFechaDeZoho(...)`), en sitio.
- [ ] 1.10 `apps/desk/server/db/sla.ts`: añadir al final, tras la 125, `conFechaDeZoho` (D-6, consulta `IN ($1…$n)` sólo si hay marcadores; molde `:107-108`).
- [ ] 1.11 `apps/desk/server/db/relojSla.ts:3` (import), `:40` (`resolverMarcador` con `json(f.values)`, `null` si sin fecha), `:43` y `:45` (`resuelto.filasApp`, `resuelto.etapasZoho`), `:77` (`SELECT` con `transition_id, values`).
- [ ] 1.12 `apps/desk/server/db/esperasVencidas.ts:36`: `SELECT` con `transition_id, values`.
- [ ] 1.13 Ver el verde: la orden de 1.6 y `npx vitest run packages/shared apps/desk/server/db/sla` sin rojos; la suite que fijaba lo viejo se revisa por el log, no por memoria.

### Cierre del lote
- [ ] 1.14 Lint sin avisos nuevos: sin `any` nuevos, sin `eslint-disable` (`apps/desk/server/db/equipos.ts:278` no se toca en L1).
- [ ] 1.15 Cinco comprobaciones en una cadena: `npm run typecheck && npm run lint -- --max-warnings 165 && node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null && npm test > <scratchpad>/npmtest-<hora>.log 2>&1 && npm run build` (memoria libre anotada al arrancar `npm test`; duración y salida por pasada; si no sale 0, nombrar prueba y fichero del log). Anotar el bundle: `index-F1jDYjEU.js`, 427,51 kB (D-1/§10).
- [ ] 1.16 Medida del intento: `git diff --shortstat --no-renames e728808d` + `wc -l` de lo nuevo sin trackear; si pasa de 800, parar y partir.
- [ ] 1.17 Commit del código del lote (convencional, sin atribución de IA). El intento lo cierra el orquestador con `gentle-ai sdd-attempt settle` DESPUÉS de 1.26, con la medida remedida.

### Mutaciones de L1 (con el lote commiteado; `file <f>` antes; `perl -i -pe 's/\Qviejo\E/nuevo/ if $. == N' <f>`, nunca `sed -i`)
- [ ] 1.18 M1: `apps/desk/server/db/sla.ts:93` vuelve a `r.rows`; deben ponerse rojas P1, R1 y R4. Restaurar con el perl inverso; `file` igual y `git diff --numstat -- <f>` vacío.
- [ ] 1.19 M2: `apps/desk/server/db/sla.ts:88` sin `transition_id`; roja P1. Restaurar y comprobar igual.
- [ ] 1.20 M3: `apps/desk/server/db/relojSla.ts:43` con `filasApp` en vez de `resuelto.filasApp`; rojas P4, P7 y P8. Restaurar y comprobar.
- [ ] 1.21 M4: `apps/desk/server/db/relojSla.ts:45` con `etapasZoho` en vez de `resuelto.etapasZoho`; roja P5. Restaurar y comprobar.
- [ ] 1.22 M5: `apps/desk/server/db/relojSla.ts:77` sin `transition_id`; roja P7. Restaurar y comprobar.
- [ ] 1.23 M6: `apps/desk/server/db/esperasVencidas.ts:36` sin `transition_id`; roja P8. Restaurar y comprobar.
- [ ] 1.24 M7: en `packages/shared/src/marcadorMigracion.ts`, «sin fecha → `null`» pasa a «se descarta»; roja P6 y su unitaria. Restaurar y comprobar (línea localizada con `grep -n` antes de mutar).
- [ ] 1.25 M8: en el mismo fichero, la rama de D-3 usa la de D-2; roja P2 y su unitaria. Restaurar y comprobar.
- [ ] 1.26 Escribir `openspec/changes/marcador-migracion-lectores/apply-progress.md` (L1): hecho, rojos vistos (1.6), mutaciones con su salida, cinco comprobaciones, bundle y medida; el fichero cuenta en la medida (se mide otra vez tras escribirlo).

## L2 · pantallas y reconocimiento (intento 2, parte del commit de L1)

### Rojo
- [ ] 2.1 Ampliar `packages/shared/src/marcadorMigracion.test.ts`: `presentarMarcador` con `values` nulo, vacío y completo; título `TITULO_MARCADOR_MIGRACION`, textos de S-1, orden de detalles, omitir vacíos y ninguna etiqueta `Regla` (design §4).
- [ ] 2.2 Reescribir en sitio R2: `apps/desk/server/migracionMarcadorLectores.test.ts:62-71` (historial de z1 con título nuevo y «Estado en Zoho» = «En Proceso»; conversación de z1 sin mensajes), mismas 10 líneas. TZ-26 y TZ-27 «identidad».
- [ ] 2.3 Reescribir en sitio R3: `apps/desk/server/migracionMarcadorLectores.test.ts:73-77`, ninguna etapa con `NOMBRE_TRANSICION_MIGRACION` (z1 y z2), mismas 5 líneas. HV-20.
- [ ] 2.4 Añadir al final de `apps/desk/server/migracionMarcadorLectores.test.ts` un segundo `describe` (L2): P10 (TZ-26 «cambia el estado», `eventName` `AppTransition`), P11 (TZ-27, la fila sigue en la base), P12 (HV-20 y «no cambian», CAR) y P13 (RQ-TZ-28: escaneo de `.ts`/`.tsx` de `apps/` y `packages/` sin `*.test.ts`, `node_modules` ni `dist`, exactamente los cuatro ficheros de D-12).
- [ ] 2.5 Ver el rojo con la orden exacta: `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/traspaso.test.ts apps/desk/server/db/historialTipoEvento.test.ts`; P13 queda roja por `apps/desk/server/db/traspaso.ts:2` y `:26`. Anotar cada rojo.

### Verde
- [ ] 2.6 `packages/shared/src/marcadorMigracion.ts`: añadir al final `TITULO_MARCADOR_MIGRACION`, `TEXTO_REGLA_MIGRACION` (cuatro reglas de `packages/shared/src/migracionTickets.ts:18`) y `presentarMarcador` (S-1, S-12).
- [ ] 2.7 `apps/desk/server/db/historial.ts:3` (import de `esPasoDeMigracion, presentarMarcador`) y `:143` (rama con `eventoMigracion`), en sitio; al final, tras la 162, `eventoMigracion` (D-8, `eventName: 'AppTransition'`). `lineaTraspaso` se sigue llamando antes.
- [ ] 2.8 `apps/desk/server/db/conversacion.ts:1` (import), `:140` (`SELECT` con `transition_id`) y `:143` (`.filter((f) => !esPasoDeMigracion(f.transition_id))`), en sitio.
- [ ] 2.9 `apps/desk/server/db/equipos.ts:6` (import), `:274` (`SELECT` con `transition_id`) y `:278` (`(tr.rows as any[]).filter(...)`, sin sumar un segundo `as any[]`).
- [ ] 2.10 `apps/desk/server/db/traspaso.ts:2` (import de `esPasoDeMigracion` en vez de `ID_TRANSICION_MIGRACION`) y `:26` (`if (esPasoDeMigracion(fila.transition_id)) return []`), en sitio (S-9).
- [ ] 2.11 Ver el verde con la orden de 2.5, más CA-6: `apps/desk/server/migracionMarcadorLectores.test.ts:46-54` y `apps/desk/server/cierreMigracionEnCifras.test.ts:87` siguen verdes sin tocarlas.
- [ ] 2.12 Mutación 3 del cliente por escrito: confirmar que `git diff --stat e728808d -- apps/desk/src` está vacío (CA-9); sin decisión de cliente sobre el marcador (design §9).

### Barrido de citas (regla de mutación 4, design §8; sobre TODO el repositorio, archivo incluido)
- [ ] 2.13 Un comando por fichero, y cada resultado se lee contra el fichero editado: `grep -rnoE "db/sla\.ts:[0-9]+(-[0-9]+)?" .`, `db/relojSla\.ts`, `esperasVencidas\.ts`, `historial\.ts`, `conversacion\.ts`, `equipos\.ts`, `traspaso\.ts`, `shared/src/index\.ts`, `migracionMarcadorLectores\.test\.ts` y `migracionTicketsAbiertos\.test\.ts` (mismo patrón).
- [ ] 2.14 Segundo pase de abreviadas: en cada fichero que ya cita esos módulos, `grep -noE ':[0-9]+(-[0-9]+)?' <fichero>` y leer las que siguen a una cita completa en la misma línea física (p. ej. `openspec/config.yaml:6775`).
- [ ] 2.15 Por cada cita que cae en una línea editada (sla.ts 2/88/93, relojSla.ts 3/40/43/45/77, esperasVencidas.ts 36, historial.ts 3/143, conversacion.ts 1/140/143, equipos.ts 6/274/278, traspaso.ts 2/26 y los bloques R1-R4): clasificar A, B o C. A se apunta a hoy; B lleva `e728808d` sobre su misma línea física, sin moverla; C se conserva con su revisión.
- [ ] 2.16 NO editar `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`: listar sus impactos (`openspec/config.yaml:6775`, `docs/sdd/ENTRADA.md:2089`, `:2094`) en `apply-progress.md` como traza de E-215, E-216 y E-217, para el informe.
- [ ] 2.17 Detector tras el barrido: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null` verde; el nuevo `tasks.md` y `apply-progress.md` no llevan citas de rango que pasen del final de un fichero.

### Cierre del lote
- [ ] 2.18 Lint sin avisos nuevos (`apps/desk/server/db/equipos.ts:278` conserva su único `as any[]`; sin `eslint-disable`).
- [ ] 2.19 Cinco comprobaciones, la misma cadena de 1.15 (typecheck, lint con 165, detector, `npm test` con log entero y memoria libre al arrancar, `npm run build`); el bundle debe seguir siendo `index-F1jDYjEU.js` de 427,51 kB. Si cambia, el parte dice que el cliente también se despliega (D-1, §10).
- [ ] 2.20 Medida del intento 2: `git diff --shortstat --no-renames <commit de L1>` + `wc -l` de lo nuevo sin trackear; si pasa de 800, parar y partir.
- [ ] 2.21 Commit del código del lote (el orquestador cierra el intento tras 2.28); `git show --numstat` del commit: sólo ficheros de esta tanda.

### Mutaciones de L2 (con el lote commiteado; mismo protocolo que 1.18)
- [ ] 2.22 M9: `apps/desk/server/db/historial.ts:143` sólo con `eventoTransicion(f, nombres)`; rojas P10 y R2. Restaurar y comprobar `file` y `git diff --numstat`.
- [ ] 2.23 M10: `apps/desk/server/db/conversacion.ts:143` sin `.filter(...)`; rojas P11 y R2. Restaurar y comprobar.
- [ ] 2.24 M11: `apps/desk/server/db/equipos.ts:278` sin `.filter(...)`; rojas P12 y R3. Restaurar y comprobar.
- [ ] 2.25 M12: `apps/desk/server/db/traspaso.ts:26` sustituida por un comentario; roja `apps/desk/server/db/traspaso.test.ts:139-144`. Restaurar y comprobar.
- [ ] 2.26 M13: líneas 2 y 26 de `apps/desk/server/db/traspaso.ts` a su texto de `e728808d` (`git show e728808d:apps/desk/server/db/traspaso.ts`); roja P13. Restaurar y comprobar.
- [ ] 2.27 M14 (regla de mutación 2): ensuciar el fichero vigilado, `apps/desk/server/db/equipos.ts:278` con `f.transition_id !== 'migracion_f1f01_abiertos'`; P13 roja, R3 y P12 verdes. Restaurar y comprobar.
- [ ] 2.28 `apply-progress.md` (L2, suma a la medida): hecho, rojos de 2.5, mutaciones con su salida, barrido con caso A/B/C por cita, cinco comprobaciones, bundle y medida; remedir tras escribirlo.

## Tareas de persona (fuera del recuento)

Regla del ciclo 1 de `CLAUDE.md`: no se cuentan como tareas de la tanda, y **archivar no las da por hechas**.

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Desplegar el servidor (sin migración ni variables nuevas) antes del 12/12 | Alfonso | EasyPanel, tras fusionar a `main`; medir antes el bundle y la base, no suponerlos | parte del corte y paquete de despliegue; el `archive-report.md` sólo anota que está pendiente |
| Decidir sobre los supuestos S-1…S-13 (proposal §5, design §12) | Gerencia | lista semanal de supuestos (`decision/preguntas-de-detalle-sin-llegar`); lo no corregido en una semana queda aceptado, con fecha | la lista semanal y `openspec/config.yaml` (lo registra la supervisión al resolver E-215 a E-217) |
