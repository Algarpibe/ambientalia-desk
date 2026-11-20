# Apply-progress — `pasada-en-seco-sin-fecha-zoho` (F1F-01, `cierra: no`)

Lote `L1`, intento único. Partida de la tanda `d2a735a4`; partida de este intento `7f5ed851`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd.
Commit del código y las pruebas: `2699c020` (1.13). Tareas 1.1 a 1.25 hechas; 1.26 y 1.27 las corre el orquestador.

## 1. Rojo previo (1.1 a 1.5)

Corrido SÓLO con los cuatro ficheros (más `apps/desk/server/db/migracionTicketsAbiertos.test.ts`), antes de tocar producción ni `DEPLOY.md`:

| Prueba | Fichero | Error exacto |
|---|---|---|
| lista de claves del informe (`seco`) | `apps/desk/server/db/migracionTicketsAbiertos.test.ts` | `expected [ 'abiertos', 'aplicado', …(13) ] to deeply equal [ 'abiertos', 'aplicado', …(14) ]` |
| U1, U2, U3, U4, U5, U7 | `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts` | `(0 , sinFechaDeZohoDeMigracion) is not a function` |
| U6 | ídem | `(0 , filaDelMarcadorDeMigracion) is not a function` |
| P1, P5 | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts` | `expected undefined to deeply equal { tickets: 2, porRegla: [ …(2) ] }` |
| P2 | ídem | `TypeError: Cannot read properties of undefined (reading 'porRegla')` |
| P3 | ídem | `expected -1 to be greater than -1` (no hay lectura de `ticket_history`) |
| P4 | ídem | `(0 , etapasDeZohoPorTicket) is not a function` |
| P6, P7 | ídem | `expected undefined to deeply equal { tickets: +0, porRegla: … }` |
| P8a | `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts` | `expected [ 'sinFechaDeZoho', …(2) ] to deeply equal []` |
| P8b | ídem | `expected '# Despliegue en EasyPanel (VPS)…' not to be '# Despliegue en EasyPanel (VPS)…'` (el fichero aún no trae el nombre) |
| P8c | ídem | `expected [ 'sinFechaDeZoho', …(2) ] to deeply equal [ 'sinFechaDeZoho' ]` |

**Nacen VERDES (caracterización):** C1 y C2 de `apps/desk/server/db/migracionSinFechaDeZoho.test.ts`, y las pruebas ya existentes de `migracionTicketsAbiertos.test.ts`, `migracionMarcadorLectores.test.ts` y `escritoresTransiciones.test.ts`.

## 2. Verde (1.6 a 1.13)

Código según design §3, sin insertar ni mover líneas en medio: ayudante de fila y regla pura al final de los dos ficheros de `shared`, import en sitio, `etapasDeZohoPorTicket` al final de `apps/desk/server/db/sla.ts` (cuatro líneas y una en sitio, mismo número), siete líneas en sitio del ejecutor y una frase al final de la línea de `DEPLOY.md`. Cada fichero existente sigue en CRLF y su `git diff -U0` sólo tiene hunks en sitio o de añadido al final.
Los seis ficheros de prueba (cuatro nuevos, lista de claves, P13 y el inventario de escritores): 63 pruebas verdes. `npm run typecheck` sale 0; `npm run lint -- --max-warnings 165` sale 0 con 165 avisos (ninguno nuevo; sin `any` ni `eslint-disable` añadidos).
1.11: los comentarios nuevos no llevan citas `ruta:línea`, ni el id del marcador ni la sentencia de alta en `ticket_transitions` (P13 y el inventario, verdes).

**Salida real del campo sobre el fixture (P1):**

```json
{"tickets":2,"porRegla":[{"regla":"entregado-a-finalizado","tickets":1,"numeros":[4100]},{"regla":"pendiente-servicio-a-en-proceso","tickets":1,"numeros":[4300]}]}
```

## 3. Mutaciones M1 a M8 (1.14 a 1.21), con el lote commiteado

Todas con `perl -i -pe '… if $. == N'`, copia previa a `antes-Mn` en el scratchpad y, tras restaurar copiando de vuelta: `cmp` sin salida, `file` igual y `git diff --exit-code` limpio (las ocho).

| M | Fichero y línea | Orden (resumen) | Rojas vistas | Resultado |
|---|---|---|---|---|
| M1 | ejecutor, línea 58 | el cálculo pasa a `{ tickets: 0, porRegla: [] }` | P1 P2 P3 P4 P5 P7 | como el diseño |
| M2 | `marcadorMigracion.ts`, línea 51 | `desde: desde ?? "M2"` | P1 P2 P4 P5 U2 U4 U5, P1 y P2 de L1, y seis más de `marcadorMigracion.test.ts`/`migracionMarcadorLectores.test.ts` | incluye lo previsto (P1 P2 U2 U4 y el P1 de L1) |
| M3 | `marcadorMigracion.ts`, línea 119 | `etapasPorTicket.get(t.id) ?? []` pasa a `[]` | P1 P4 P5 P7 U2 | como el diseño |
| M4 | `marcadorMigracion.ts`, línea 118 | sin `accion !== 'migrar'` | P1 P4 P5 P6 U1 | incluye lo previsto (P1 P5 P6 U1) |
| M5 | `migracionTickets.ts`, línea 152 | `to_status: eq.destino` | P1 P4 P5 U3 U6 | como el diseño |
| M6 | ejecutor, líneas 58 y 92 | el campo calculado tras el bucle, no con `aplicar` | SÓLO P3 y P5; P1 P2 P6 P7 verdes | la posición se detecta (regla de mutación 1) |
| M7 | `DEPLOY.md`, línea 673 | `sinFechaDeZoho` pasa a `sinFecha` | P8a P8b P8c (ver corrección) | fichero vigilado (regla de mutación 2) |
| M8 | `apps/desk/server/db/sla.ts`, línea 155 | sin la salida por `ids` vacío | P1 P3 P5 P7, C2 y el P1 de L1 | incluye lo previsto |

**Corrección registrada (M7):** la primera vez, M7 puso rojas SÓLO P8a y P8b: P8c quedaba verde porque trabaja sobre una copia que ya quita el nombre. Se le añadió la precondición `expect(deploy).toContain('sinFechaDeZoho')` (hay un nombre que sacar de la viñeta), se enmendó el commit del código y se repitió M7: ahora caen P8a, P8b y P8c.

## 4. Barrido de citas (1.22, regla de mutación 4)

Sobre el repositorio sin `node_modules`, `.git`, `dist` ni `.codegraph`, `grep -rnoE` de las seis rutas (949 resultados con las propias de este cambio excluidas); de ellos se leyeron TODOS los que caen sobre una línea editada (el resto apunta a líneas que no se movieron ni cambiaron). Segundo pase de abreviadas con `grep -rnE "<módulo>\.ts.*`:N"` sobre las mismas líneas editadas, y lectura humana. Nada se desplaza: sólo cambió el CONTENIDO de las líneas editadas.

| Cita | Línea editada | Qué afirma | Caso |
|---|---|---|---|
| `docs/sdd/TRASPASO_2026-10-08.md:395`, `openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/archive-report.md:36` y `:115`, y los tres del cambio `2026-10-11-rechazo-migracion-409` (`archive-report.md:119`, `proposal.md:120`, `tasks.md:81`) | `DEPLOY.md:663-693`, contiene la 673 | el procedimiento está en la §14 | A (sigue siendo cierto) |
| `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:59` | `DEPLOY.md:673` | que esa línea cita `:22` y `:24` del ejecutor | A |
| `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/verify-report.md:47` y `:48` | ejecutor `:66-67`, `:68-94`, `:67` | `opts.aplicar === true`; el seco pasa `db`, no `enTransaccion`; las escrituras están en ese bloque | A (la línea 67 sólo gana `ahora`) |
| `openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/design.md:5` y `proposal.md:27` | ejecutor `:63-95` | la función `migrarTicketsAbiertos` | A |
| `openspec/changes/archive/2026-10-11-rechazo-migracion-409/design.md:69` y `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:80` | `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` | la lista de claves no trae `motivo` ni `error`; ganó `'cierres'` en sitio | A (también sigue cierto) |
| `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/apply-progress.md:135`, `:288` y `design.md:241` | ejecutor `:5` | la línea importa `normalizarEstado` | A |
| abreviadas de `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/design.md:119` y `verify-report.md:36` | ejecutor `:5`, `:25`, `:58` | dónde editó aquella tanda, «en la misma línea» | A |
| las editadas de `apps/desk/server/db/sla.ts` (135 a 138 y 142) y la línea 3 de `packages/shared/src/marcadorMigracion.ts` | las editadas | — | ninguna cita externa (las que aparecen con `:137-141` son del otro `sla.ts`, el de `packages/shared`) |

Resultado: **ninguna B ni C**; no hizo falta añadir «en `d2a735a4`» a ninguna línea existente. No se tocaron `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`.

## 5. Regla 13 por escrito (1.23) y lint (1.24)

`git diff --stat d2a735a4 -- apps/desk/src` y `git diff --stat 7f5ed851 -- apps/desk/src`: vacíos (el cliente no toma ninguna decisión sobre el campo: la regla vive en `shared` y la impone el servidor). `git diff --exit-code 7f5ed851 -- .env.example packages/zoho-sync/src/db/schema.sql`: sin salida (sin interruptor, variable ni migración). Lint: 165 avisos, el techo.

## 6. Medida parcial (antes de este fichero)

`git diff --shortstat --no-renames 7f5ed851`: 9 ficheros, 369 inserciones, 15 borrados (384). Con este `apply-progress.md` y el `tasks.md` marcado, por debajo de 800.

## 7. Cinco comprobaciones y medida — las completa el orquestador

Las corre el orquestador sobre el commit final del intento (1.26 y 1.27) y quedan, con la memoria libre al arrancar `npm test`, la
duración, el bundle y la medida, en la evidencia del `settle` del registro y en el `archive-report.md` de este cambio.


## 8. Corrección del orquestador tras la suite entera (dentro de este intento)

La primera pasada de `npm test` sobre `21da9b73` salió 1: 8 rojas de 14 en `apps/desk/server/db/migracionTicketsF1F01.test.ts`, todas con
`relation "ticket_history" does not exist`. Ese fichero monta su propio esquema en pg-mem derivando de `packages/zoho-sync/src/db/schema.sql`
exactamente DOS tablas y su envoltorio sólo califica esas dos con `desk.`; el ejecutor ahora lee también la historia de Zoho. Es una guarda que
fija el árbol, no un fallo de producción: allí la tabla existe (`packages/zoho-sync/src/db/schema.sql:244`) y la prueba contra PostgreSQL real
(`apps/desk/server/db/migracionConcurrente.integration.test.ts:91`) monta el esquema entero con `migrate`. Se corrige EN SITIO, sin mover
líneas: el comentario, la expresión de los bloques, la expectativa (de dos a tres bloques) y el envoltorio de `califica` ganan
`ticket_history` en sus mismas líneas 14, 34, 35 y 43 (`git diff -U0`: cuatro hunks de una línea, CRLF conservado). Su única cita a esas
líneas, `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/verify-report.md:155`, dice que el envoltorio antepone `desk.` a las
sentencias del ejecutor, y sigue siendo cierto: caso A. Tras la corrección, el fichero da 14 de 14. La pasada fallida queda en la evidencia del
`settle`. No la cazó el apply porque corrió sólo los seis ficheros previstos en `openspec/changes/pasada-en-seco-sin-fecha-zoho/tasks.md`.
