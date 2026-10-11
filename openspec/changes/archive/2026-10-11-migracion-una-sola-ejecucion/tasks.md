# Tareas: la migración de tickets abiertos, una sola ejecución

Cabecera de la tanda: `tanda: F1F-01`, `cierra: no` (`proposal.md:2`, `:6`). Un solo lote de apply. Las pruebas son de
caracterización y nacen verdes (salvedad de `strict_tdd`, `proposal.md:77`): el rojo es el de las mutaciones de la tarea 4.
Ninguna tarea toca código de producto: ni el ejecutor, ni la ruta, ni el esquema.

## Review Workload Forecast

| Concepto | Valor |
|---|---|
| Líneas estimadas del apply | ~206 (`design.md:98`): prueba nueva ~160, `DEPLOY.md` ~44, aserción 1+1 |
| Riesgo frente a 400 / 800 (válvula 720) | Bajo en ambos: la mitad del primer umbral, ~510 líneas de holgura |
| ¿Hace falta partir? | **No** |
| Orden | Secuencial 1 → 7 (la 2 y la 5 podrían ir en paralelo, pero el lote y el worktree son uno) |

## Lote único
- [x] 1. **Comprobación previa de `pg` (D-1, hallazgo 1 del diseño, `design.md:13` y `:116`).** Crear un fichero provisional
  que haga `import { Pool } from 'pg'` bajo `apps/desk/server/db/` y correr `npm run typecheck`; comprobar el código de
  salida. Si pasa, el provisional pasa a ser el esqueleto de la tarea 3. Si no pasa: **alternativa**, crear el `Pool` con
  `createPoolFromUrl` (`packages/zoho-sync/src/db/pool.ts:9-11`), que no fija `search_path`, y fijarlo por la URL
  (`options=-c search_path=desk,public`); anotarlo en el apply.
- [x] 2. **D-2: texto del rechazo en pg-mem.** En `apps/desk/server/db/migracionTicketsAbiertos.test.ts:174`, cambiar
  `rejects.toThrow()` por `rejects.toThrow('pasó a estar gobernado')`, dentro de la línea. Comprobar que el fichero sigue en
  **187 líneas** (`wc -l`) y que la prueba pasa. Cubre RQ-ZS-23 «Solape…» en pg-mem (rechazo, `ROLLBACK`, sin `COMMIT`).
- [x] 3. **D-1: `apps/desk/server/db/migracionConcurrente.integration.test.ts` (nuevo).** Molde
  `packages/zoho-sync/src/db/liberacion.integration.test.ts:22-71`: se salta sin `TEST_DATABASE_URL`, base propia
  `migracion_it_<pid>_<ms>`, `beforeAll` de 120 s, `afterAll` con `DROP DATABASE … WITH (FORCE)`. Envoltorio con ganchos en
  `query` y en `connect` (`design.md:17-26`). Toda espera acotada y con texto propio. Casos:
  - [x] 3.1 **Solape forzado** (60 s; escenarios «Solape…» y «Un marcador por ticket» de RQ-ZS-23): A se detiene tras su
    `UPDATE tickets`; B espera un bloqueo (sondeo de `pg_stat_activity`, `wait_event_type = 'Lock'`, 50 ms, máx. 10 s); suelta
    A en `finally`. A: `aplicado: true`, `migrables: 3`; B se rechaza con «pasó a estar gobernado»; un marcador por ticket;
    `ejecutado_por` «Actor A» en todos y «Actor B» en ninguno; los tres con `managed_by_app = true`.
  - [x] 3.2 **Carrera libre tolerante** (10 rondas, 120 s; escenarios «Solape…» y «Un marcador…»): `Promise.allSettled`
    sobre el `Pool` sin envolver; vale «una cumple y otra se rechaza con el texto» o «las dos cumplen, `migrables: 4` y
    `migrables: 0`»; siempre un marcador por ticket, un solo `ejecutado_por`, los cuatro gobernados.
  - [x] 3.3 **Ejecución posterior** (30 s; escenario «Una ejecución posterior no es un rechazo»): una confirmada y después
    otra con actor distinto: no se rechaza, `migrables: 0`, sin marcadores nuevos, ninguno del segundo actor.
  - [x] 3.4 **Pasada en seco con una ejecución en curso** (escenario 4 de RQ-ZS-23 «La pasada en seco no participa»): con A
    retenida tras su `UPDATE`, lanzar una pasada sin `aplicar`; los ganchos no ven `BEGIN` ni escritura de la pasada, ésta no
    se rechaza, y A confirma después con `migrables: 3`.
  - [x] 3.5 Ejecutar con `TEST_DATABASE_URL` (PostgreSQL 17 local facilitado por el orquestador): verde, y mirar el código
    de salida. Ejecutar **sin** la variable: las pruebas se saltan (`skipped`) y no fallan.
- [x] 4. **D-3: mutaciones M1, M2, M3** sobre `apps/desk/server/db/migracionTicketsAbiertos.ts`, **una a una**: M1 quitar el
  `throw` (línea 90); M2 quitar `AND managed_by_app = false` (línea 87); M3 quitar `enTransaccion` (línea 68). Para cada una:
  correr el fichero de pg-mem y la integración con `TEST_DATABASE_URL`; **restaurar siempre** el fichero
  (`git checkout -- <fichero>`) y comprobar con `git diff --stat` que `migracionTicketsAbiertos.ts` queda intacto antes de la
  siguiente. Anotar prueba a prueba, en pg-mem y en integración (casos 3.1 a 3.4), qué se puso rojo y qué no, contra las
  hipótesis de `design.md:54-58`; si una no se cumple, se anota el resultado real sin retocar la prueba. M3 debe fallar con
  mensaje, no colgarse. Salvedad: pruebas de caracterización que nacen verdes.
- [x] 5. **D-4: `DEPLOY.md`.** Añadir al final (tras la línea 661) una línea en blanco y la sección
  `## 14. Migración de tickets abiertos: quién la ejecuta y en qué orden (F1F-01)` con el contenido de `design.md:68-74`:
  quién (Gerencia; suplente «POR NOMBRAR»), requisitos previos (E-208 sin respuesta, pasada en seco), los cinco pasos, qué ve
  la segunda ejecución (`500`, lectura de código, no medido por HTTP; `409` con negativa) y qué no hace el procedimiento.
  Puntero dentro de `DEPLOY.md:356`, sin añadir líneas (`design.md:66`). Comprobar que las líneas 1-661 conservan su número:
  `git diff --no-renames -U0 -- DEPLOY.md` sólo debe mostrar un cambio en la 356 y adiciones tras la 661.
- [x] 6. **Reglas de mutación 3 y 4 (D-6).** Tabla de la regla 3, decisión a decisión: decisiones del cliente, **ninguna**;
  `grep migrar-tickets-abiertos apps/desk` sólo debe dar `apps/desk/server/routes/admin.ts:222` y
  `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:10` y `:15`, abriendo el fichero para comprobar cada línea. Barrido
  de la regla 4: `git grep -noE "DEPLOY\.md:[0-9]+(-[0-9]+)?"` y
  `git grep -noE "migracionTicketsAbiertos\.test\.ts:[0-9]+(-[0-9]+)?"`; comprobar cada resultado contra el fichero y su
  frase, más el segundo pase de la forma abreviada en los ficheros que ya citan el módulo. Resultado esperado: ninguna cita
  desplazada; **se comprueba, no se afirma**.
- [x] 7. **Cierre del lote.** Correr y mirar el código de salida de cada uno: `npm test`; `npm run typecheck`;
  `npm run lint -- --max-warnings 165`; `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`. Medida del ledger:
  `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear; registrar ESO
  (válvula 720, techo 800). Sin commit en esta fase.

## Mapa tarea → escenario o decisión
| Tarea | RQ-ZS-23 / decisión |
|---|---|
| 1 | D-1 (hallazgo 1), pregunta abierta de `design.md:116` |
| 2 | D-2; escenario «Solape…» en pg-mem |
| 3.1, 3.2 | Escenarios «Solape…» y «Un marcador por ticket» |
| 3.3 | Escenario «Una ejecución posterior…» |
| 3.4 | Escenario «La pasada en seco no participa» |
| 4 | D-3 |
| 5 | D-4 (y `proposal.md:54`, alcance 3) |
| 6, 7 | D-6, reglas de mutación 3 y 4, cierre del lote |

## Tareas de personas — fuera del recuento

Archivar este cambio **no las da por hechas** (regla del ciclo 1). No son casillas.
| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Nombrar al suplente | Gerencia | `DEPLOY.md`, sección nueva, como «suplente por nombrar» |
| Responder E-208: quién lanza la última sincronización completa | Gerencia | `docs/sdd/ENTRADA.md:2047` |
| Decidir si la perdedora debe recibir un `409` con mensaje claro | Gerencia | `proposal.md`, «Hallazgo»; el orquestador la sube a la bandeja |
| Ejecución del 12/12 en producción | Gerencia o su suplente | `DEPLOY.md`, sección nueva |
