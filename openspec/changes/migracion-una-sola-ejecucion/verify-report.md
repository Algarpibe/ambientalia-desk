# Informe de verificación: migracion-una-sola-ejecucion (F1F-01, `cierra: no`)

Intento 3 · verificación independiente sobre `git diff 7afba67 HEAD` (HEAD `4f233dc`), con PostgreSQL 17.5 real y desechable.

## Veredicto: PASS CON AVISOS
0 CRITICAL · 2 WARNING · 4 SUGGESTION. Nada bloquea el archivo.

## Matriz RQ-ZS-23: escenario → prueba → resultado (ejecutadas por mí)
| Escenario | Prueba | Resultado |
|---|---|---|
| Solape: una confirma, la otra se rechaza sin dejar nada | integración, caso «solape forzado» + pg-mem `migracionTicketsAbiertos.test.ts:168` (texto, ROLLBACK, sin COMMIT) | verde con PG real; verde pg-mem |
| Un marcador por ticket y de quién es | integración «solape forzado» y «carrera libre, 10 rondas» | verde |
| Ejecución posterior: no rechaza y no escribe | integración, caso «posterior»; antecedente pg-mem `:121-131` | verde |
| Pasada en seco no participa | integración, caso «pasada en seco con una en curso» | verde |

Ejecuciones: integración con la variable → 4/4, exit 0. Sin la variable → 4 skipped, exit 0. `migracionTicketsAbiertos.test.ts` → 13/13.

## Mutaciones reproducidas (restaurado con `git checkout --` tras cada una)
| Mutación | Qué se puso rojo | Qué NO |
|---|---|---|
| M1 quitar el `throw` (l.90) | integración «solape» («expected true to be false»), integración «carrera» («[4,4] vs [0,4]»), pg-mem l.168 («promise resolved … instead of rejecting») | casos «posterior» y «en seco» |
| M5 mía: `=== 0` → `> 1` (l.90) | las mismas tres que M1 | «posterior» y «en seco» |
| M4 mía: UPDATE antes del INSERT (marcador/UPDATE invertidos) | SÓLO pg-mem «marcador y UPDATE por ticket … en ese orden» | **toda la integración sigue verde** |
M2 y M3 los reprodujo el orquestador (apply-progress); yo no los repetí.

**Juicio sobre el rojo por mutación:** BASTA. Son pruebas de caracterización de un mecanismo ya existente; el rojo no es previo
pero queda demostrado con tres mutaciones propias o del apply, cada una cazada por al menos dos pruebas, y la integración caza
la ausencia del rechazo tanto en solape forzado como en carrera libre. Severidad: SUGGESTION (documentado y declarado en la propuesta).

## Alcance (punto 3)
`git diff --stat 7afba67 HEAD`: `DEPLOY.md` (+33 −1), la prueba nueva (243), una línea de `migracionTicketsAbiertos.test.ts`
y la carpeta del cambio. Ni ejecutor, ni ruta, ni esquema, ni `openspec/specs/` ni `config.yaml`. Conforme.

## DEPLOY.md (punto 4)
- `git diff -U0`: sólo `@@ -356` (texto, mismo número) y `@@ -661,0 +662,32`. Líneas 1-661 conservan número. Conforme.
- §14 (`:662-693`): Gerencia abre y lanza; suplente «POR NOMBRAR», sin nombre inventado; orden literal copia previa → abrir →
  UNA ejecución → comprobar → cerrar. Conforme con la decisión (`openspec/config.yaml:4536-4559`).
- Hechos comprobados abriendo el código: ruta con `requireSuperAdmin` (alias de `requireAdmin`, `admin.ts:17`) + interruptor
  (`admin.ts:222`); 409 con negativa (`admin.ts:231`); `403` al aplicar cerrado (`admin.ts:250-255`); `500` genérico
  (`app.ts:90-92`: log, `headersSent`, `500 «Error interno»`); informe `aplicado`/`negativa`/`numeracion` (`migracionTicketsAbiertos.ts:21,22,24`);
  E-208 (`ENTRADA.md:2047` es su cabecera); copia de EasyPanel (`Paquete_de_Despliegue_2026-10-10b.md:224-225`); script SQL de reversión existe.
  «La pasada en seco da `migrables: 0`» es cierto por `migracionTickets.ts:64` (gobernado → `ya-gobernado`).
- Ninguna mención a reuniones en `DEPLOY.md`, artefactos ni prueba (búsqueda «reuni», 0 resultados).
- Ninguna afirmación de la §14 sin respaldo. El `500` está marcado «lectura de código, no medido por HTTP».

## Citas de los artefactos (punto 5)
Abiertas y leídas: `app.ts:90-92`, `admin.ts:222-232/231/250-255`, `transaccion.ts:13-28`, `migracionTicketsAbiertos.ts:21-24,32-34,63-95,84-90`,
`.test.ts:13-15` (pg-mem no revierte), `:121-131`, `:168-177`, `ci.yml:12,45-47`, `liberacion.integration.test.ts:22-23`,
`config.ts:123`, `repo.ts:71`, `migrate.ts:43,126`, `pool.ts:9-11`, `spec.md:1275` (RQ-ZS-22), `DEPLOY.md:363/418/406-407/413-416`,
`ENTRADA.md:2047`, `migracionTicketsAbiertosRuta.test.ts:10,15`. Todas dicen lo que la frase afirma salvo lo anotado en W2.

## Cabecera, tareas y ciclo (punto 6)
Cabecera R-1 de siete campos presente. `cierra: no` es correcto: la fila `Plan…R01.4.md:125` sigue «en curso» y quedan
tareas de persona (suplente, E-208, cotejo de la hoja, ejecución del 12/12). `tasks.md`: 0 casillas pendientes; las tareas de
persona están en tabla aparte, sin casilla y con «archivar no las da por hechas» (regla del ciclo 1). Conforme.

## Códigos de salida (cada uno mirado por separado)
- `npm test` (con `TEST_DATABASE_URL`): **exit 0** · 269 ficheros, 4398 pruebas, nada saltado.
- `npm run typecheck`: **exit 0**.
- `npm run lint -- --max-warnings 165`: **exit 0** · 165 avisos, 0 errores.
- `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: **exit 0** (abreviadas informativas ajenas al cambio, no bloquean).
- `git status --short` tras restaurar: vacío.

## Probado SÓLO con PostgreSQL real (CI; `ci.yml:45-47`)
Que la perdedora ESPERA el bloqueo de fila, que el ROLLBACK real deja 0 marcadores suyos, la carrera libre y la ausencia de
doble escritura. pg-mem sólo fija texto del rechazo, ROLLBACK y ausencia de COMMIT por el espía.

## NO probado en absoluto
- La respuesta HTTP de la ejecución rechazada (`500`): lectura de código, ninguna prueba la ejecuta.
- La ejecución en producción y su comprobación en seco con el mismo `corte`.
- Aislamiento distinto del `READ COMMITTED` por defecto; reversión SQL; que el rechazo ocurra con `pg` Pool de producción (la prueba usa `Pool` propio).

## Hallazgos
**WARNING**
- W1. Integración y orden: M4 (invertir marcador/UPDATE) sólo lo caza pg-mem; la integración con PG real no fija el orden. Aceptable
  porque el espía lo cubre, pero conviene saberlo si algún día se retira pg-mem.
- W2. `DEPLOY.md` paso 4 cita `migracionTickets.ts:103-104` para «lo ya gobernado no se vuelve a elegir»: esas líneas son la
  rama `eq`/`migrables++`, no la exclusión de gobernados (esa es `:64`). La frase es cierta, la segunda cita no la respalda.
**SUGGESTION**
- S1. `apply-progress.md` dice «tarea 7 sin marcar»; `tasks.md` ya la tiene marcada: texto caduco tras el contraste del orquestador.
- S2. `proposal.md` «Criterios de éxito» sigue con casillas sin marcar; no son tareas, pero conviene cerrarlas al archivar.
- S3. M3 en el caso de carrera libre depende del azar de la carrera (lo anota el apply); el caso de solape forzado lo cubre de forma determinista.
- S4. La pregunta a Gerencia sobre el `409` con mensaje claro debe subir a la bandeja; no está en ningún destino versionado todavía.

## Siguiente
Recomendado: `sdd-archive` (el cambio no cierra la fila; tareas de persona declaradas aparte).
