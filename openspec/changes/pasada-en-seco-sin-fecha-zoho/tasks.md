# Tareas: `pasada-en-seco-sin-fecha-zoho` (F1F-01, `cierra: no`)

Partida `d2a735a4`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Orden TDD: prueba en rojo, ver el rojo, código, verde.
Toda cita a una línea que esta tanda edita lleva «en `d2a735a4`»; las líneas nuevas no se citan con número (design §3, §7). `M<n>`, `P<n>`, `U<n>`, `C<n>` son los ids de design §4-§5; los RQ, los de `openspec/changes/pasada-en-seco-sin-fecha-zoho/specs/zoho-sync/spec.md`. Corrección a D-1 (S-8): la fila simulada va al final de `packages/shared/src/migracionTickets.ts`. No se tocan `openspec/config.yaml`, `docs/sdd/ENTRADA.md` ni `apps/desk/src`.

## Review Workload Forecast

| Fichero (design §6) | Bruto |
|---|---|
| `packages/shared/src/marcadorMigracion.ts` 28, `packages/shared/src/migracionTickets.ts` 14, `apps/desk/server/db/sla.ts` 26, ejecutor 14 | 82 |
| lista de claves 2, `DEPLOY.md` 2 | 4 |
| unitarias 65, servidor 115, guarda 40 | 220 |

Bruto ~306; × 1,8 ≈ 550; con `apply-progress.md` (~100) ≈ 650, bajo el techo de 800. Un solo lote `L1`, un intento.

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: High (bruto × 1,8 pasa de 400; cabe en 800 del registro)

## L1 · campo `sinFechaDeZoho` en el informe de la migración (intento único)

### Rojo (strict_tdd)
- [x] 1.1 `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` en `d2a735a4`, en sitio: la lista de claves gana `'sinFechaDeZoho'` entre `'sinEquivalencia'` y `'sinRemisionVigente'` (orden de `sort()`). `file` = CRLF y `git diff -U0` con un solo hunk de una línea.
- [x] 1.2 Crear `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts` (U1-U7, design §4a; ayudante de etapas del molde de `packages/shared/src/marcadorMigracion.test.ts`).
- [x] 1.3 Crear `apps/desk/server/db/migracionSinFechaDeZoho.test.ts` (P1-P7, C1, C2, design §4b; fixture t4100-t4800, espía con `verbos` y `escrituras`).
- [x] 1.4 Crear `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts` (P8a-P8c, design §4c; `faltasPasadaEnSeco` pura, `\r\n` normalizado).
- [x] 1.5 Correr SÓLO esos cuatro ficheros (`npx vitest run <los cuatro>`) y anotar en `apply-progress.md` qué pruebas cayeron ROJAS y con qué error (esperadas: lista de claves, U1-U7 por importación, P1-P7, P8a-P8c) y cuáles nacen VERDES (C1, C2).

### Código (design §3; fichero a fichero; tras cada edición `file <f>` = «with CRLF line terminators» y `git diff -U0 -- <f>` sin hunks que muevan líneas)
- [x] 1.6 `packages/shared/src/migracionTickets.ts`, AL FINAL tras la línea 142 (una en blanco y la función): `filaDelMarcadorDeMigracion` (§3.1). Sin importar nada del módulo del marcador.
- [x] 1.7 `packages/shared/src/marcadorMigracion.ts:3` en `d2a735a4`, en sitio: el import gana `filaDelMarcadorDeMigracion`. AL FINAL tras la línea 103: `SinFechaDeZoho` y `sinFechaDeZohoDeMigracion` (§3.2). Sin nombrar el id del marcador (RQ-TZ-28, P13).
- [x] 1.8 `apps/desk/server/db/sla.ts:135-138` en `d2a735a4` (cuatro líneas, comentario y llamada a `etapasDeZohoPorTicket`) y `apps/desk/server/db/sla.ts:142` en `d2a735a4` (una línea, `etapas.get(...)`), en sitio y a igual número de líneas; AL FINAL, `etapasDeZohoPorTicket` (§3.3).
- [x] 1.9 `apps/desk/server/db/migracionTicketsAbiertos.ts`, siete líneas en sitio, las de la tabla de §3.4: 5, 8, 25, 41, 58, 67 y 69 en `d2a735a4`. Ninguna línea nueva.
- [x] 1.10 `DEPLOY.md:673` en `d2a735a4`, en sitio: la frase de §3.6 antes del retorno de carro (`perl -i -pe 's/(Gerencia\.)(\r?)$/$1 <frase>$2/ if $. == 673'`); sin números de línea en la frase; `file DEPLOY.md` = CRLF.
- [x] 1.11 Comprobar que los comentarios nuevos de producción no llevan citas `ruta:línea`, ni el id del marcador ni la sentencia de alta en `ticket_transitions` (P13 y el inventario de `apps/desk/server/escritoresTransiciones.test.ts`).

### Verde
- [x] 1.12 Los cuatro ficheros nuevos y `apps/desk/server/db/migracionTicketsAbiertos.test.ts`, `apps/desk/server/migracionMarcadorLectores.test.ts` y `apps/desk/server/escritoresTransiciones.test.ts`: todo verde (P13 incluida).
- [x] 1.13 Commit del código y las pruebas (convencional, sin atribución de IA ni «Co-Authored-By»). El intento lo cierra el orquestador DESPUÉS de 1.27; sin casilla de `settle` ni de fusión.

### Mutaciones M1-M8 (design §5; con el lote commiteado). Por cada una: `file <f>`, `cp <f> <scratchpad>/antes-Mn`, la orden con `perl`, `npx vitest run` y ver el rojo; restaurar con el `perl` inverso, `cmp` sin salida, `file` igual y `git diff --exit-code -- <f>`. Nunca `sed -i`. Anotar el resultado en `apply-progress.md`.
- [x] 1.14 M1: quitar el cálculo en el ejecutor (línea 58); rojas P1 P2 P3 P4 P5 P7.
- [x] 1.15 M2: `entradaDelMarcador` siempre con fecha (línea 51 de `packages/shared/src/marcadorMigracion.ts`); rojas P1 P2 U2 U4 y el P1 de L1 de `apps/desk/server/migracionMarcadorLectores.test.ts`.
- [x] 1.16 M3: la regla ignora la historia (línea localizada con `grep -n`); rojas P1 P4 P5 P7 U2.
- [x] 1.17 M4: sin el filtro `migrar` (línea localizada con `grep -n`); rojas P1 P5 P6 U1.
- [x] 1.18 M5: `to_status` simulado siempre el destino, en `packages/shared/src/migracionTickets.ts` (línea localizada con `grep -n`); rojas P1 P4 P5 U3 U6.
- [x] 1.19 M6 (POSICIÓN, regla de mutación 1): el campo calculado tras el bucle y no con `aplicar`; roja P3 (y P5); P1, P2, P6 y P7 siguen verdes. Las dos órdenes de design §5.
- [x] 1.20 M7 (FICHERO VIGILADO, regla de mutación 2): `sinFechaDeZoho` pasa a `sinFecha` en `DEPLOY.md:673` en `d2a735a4`; rojas P8a, P8b y P8c.
- [x] 1.21 M8: la lectura devuelve el mapa vacío en `apps/desk/server/db/sla.ts` (línea localizada con `grep -n`); rojas P1 P5 P7 C2 y el P1 de L1 de `apps/desk/server/migracionMarcadorLectores.test.ts`.

### Cierre
- [x] 1.22 Barrido de citas (regla de mutación 4, design §7; sobre el repositorio sin `node_modules`): `grep -rnoE` de `migracionTicketsAbiertos\.ts`, `db/sla\.ts`, `marcadorMigracion\.ts`, `shared/src/migracionTickets\.ts`, `migracionTicketsAbiertos\.test\.ts` y `DEPLOY\.md`; segundo pase de abreviadas con ``grep -rnE "<módulo>\.ts.*`:[0-9]+"`` y lectura humana. Cada resultado se lee contra el fichero. Tabla de casos A/B/C en `apply-progress.md` (previsto: todos A; uno B recibe «en `d2a735a4`» en su misma línea física).
- [x] 1.23 Regla 13 por escrito: `git diff --stat d2a735a4 -- apps/desk/src` vacío; `git diff --exit-code d2a735a4 -- .env.example packages/zoho-sync/src/db/schema.sql` sin salida.
- [x] 1.24 Lint sin avisos nuevos: sin `any` nuevos ni `eslint-disable`.
- [x] 1.25 Escribir `openspec/changes/pasada-en-seco-sin-fecha-zoho/apply-progress.md` completo (rojos de 1.5, verde, mutaciones con su salida, barrido, regla 13, cinco comprobaciones, bundle y medida) y commitearlo; el fichero cuenta en la medida.
- [x] 1.26 Cinco comprobaciones sobre el commit final, en cadena: `npm run typecheck && npm run lint -- --max-warnings 165 && node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null && npm test > <scratchpad>/npmtest-<hora>.log 2>&1 && npm run build`. Memoria libre anotada al arrancar `npm test`; duración y salida por pasada; si no sale 0, nombrar prueba y fichero del log. Lint contra 165. El bundle debe seguir siendo `index-F1jDYjEU.js`; si cambia, el parte dice que el cliente también se despliega.
- [x] 1.27 Medida del intento: `git diff --shortstat --no-renames <commit de partida del intento>` + `wc -l` de lo nuevo sin trackear; si pasa de 800, parar y partir.

## Tareas de persona — fuera del recuento, archivar NO las da por hechas

Regla del ciclo 1 de `CLAUDE.md`: no son trabajo de este repositorio y no llevan casilla.

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Desplegar el servidor antes del 12/12 (el campo sólo existe en el servidor; el cliente no cambia) | Alfonso | EasyPanel, App | `archive-report.md` del cambio y el parte del corte |
| Leer `sinFechaDeZoho` en la pasada en seco inmediatamente anterior a aplicar (S-7) y responder `s11-migrados-sin-fecha-de-zoho` | Gerencia | decisión en el panel, recogida en `openspec/config.yaml` → `decisiones_de_gerencia_adenda_2` | proposal.md §6 y `DEPLOY.md` §14 |
| Revisar los supuestos S-1..S-10 | Gerencia | lista semanal de supuestos (una semana; lo no corregido queda aceptado, con fecha) | proposal.md §6 y design.md §8 |
