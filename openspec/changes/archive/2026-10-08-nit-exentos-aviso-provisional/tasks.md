# Tareas: NIT genéricos exentos y aviso de provisional ya en Books (F1B-19)

Tres lotes, cada uno su intento del registro (`gentle-ai sdd-attempt`), techo 800 y válvula 720, partidos de antemano (reparto del orquestador sobre el §8 del diseño).
Requisitos: RQ-TC-30 (MODIFIED) y RQ-TC-57 (`tickets-core`), RQ-AV-21 (`derivacion-avisos`). Verify y archive no son casillas.
Cada lote es una sola unidad de apply: rojo, verde y cierre. Las citas de `design.md` §3, §4 y §6 son las líneas a editar DENTRO de línea.

## Lote 1 — exentos (RQ-TC-30, RQ-TC-57)

### 1. Rojo
- [x] 1.1 `packages/shared/src/nitExentos.test.ts` (nuevo): tabla de casos de `esNitExento` del diseño §7 (formatos, lista vacía, NIT sin dígitos, no texto, base más dígito sin guion). Rojo por módulo inexistente.
- [x] 1.2 `packages/zoho-sync/src/db/nitExentosEsquema.test.ts` (nuevo): fila `222222222222` activa tras `migrate`, migrar dos veces conserva `activo = false`, una sola siembra con `ON CONFLICT`, `CREATE` calificado y tras `idx_encuesta_respuestas_ticket` (orden relativo).
- [x] 1.3 `apps/desk/server/services/altaManual.test.ts`: `describe` nuevo AL FINAL con las `201` (sin formato y `it.each` de tres formatos), `409` no exento, fila inactiva, lista vacía, base más dígito sin guion, posición (serial `422`, A `422`, C `422`) y lectura (base espía propia).
- [x] 1.4 `packages/zoho-sync/src/db/migrate.test.ts`: cifras `[10, 33, 3]` y `46` (`:282-286`) y renumerar en sitio las siete aserciones por distancia (`:796`, `:798`, `:839`, `:840`, `:879`, `:880`, `:882`) con sus títulos (`:794`, `:837`, `:877`), el `describe` de `:864` y la cabecera de `:861` (diseño §4).
- [x] 1.5 Correr `npx vitest run` sobre los cuatro ficheros y ANOTAR en `apply-progress` qué falla: las `201`, las dos de «vuelve el `409`» (tabla inexistente), las de lectura, las de esquema y el recuento. Las tres de posición nacen verdes (son guardas). Si el fallo no coincide, parar y anotar.

### 2. Verde
- [x] 2.1 `packages/zoho-sync/src/db/schema.sql`: las once líneas del diseño §1 (`public.nit_exentos` y siembra) AL FINAL, tras la 796.
- [x] 2.2 `packages/zoho-sync/src/db/migrate.ts:73`: `'nit_exentos'` dentro de `PUBLIC_TABLES`, en la misma línea.
- [x] 2.3 `packages/shared/src/nitExentos.ts` (nuevo, `esNitExento` sobre `nitCoincide`) y su export en `packages/shared/src/index.ts:28`.
- [x] 2.4 `apps/desk/server/db/nitExentos.ts` (nuevo, `nitExentosActivos`, `WHERE activo = true ORDER BY nit`).
- [x] 2.5 `apps/desk/server/services/ticketService.ts`: líneas 6, 18 y 96 DENTRO de línea (diseño §3); comentario de `apps/desk/server/services/altaManual.ts:155-156` reescrito sin mover líneas.
- [x] 2.6 Repetir 1.5 en verde.

### 3. Cierre del lote 1
- [x] 3.1 Mutaciones ejecutadas y RESTAURADAS, con el rojo esperado anotado: M1 (quitar `!esNitExento(…)`), M2 (regla 1, exención antes de `validarContenidoAltaManual`), M3 (quitar `WHERE activo = true`), M4 (regla 2, borrar la siembra), M5 (quitar `public.` del `CREATE`), M6 (`some` por `every`), M7 (quitar `'nit_exentos'` de `PUBLIC_TABLES`).
- [x] 3.2 `wc -l`: `ticketService.ts`, `altaManual.ts`, `migrate.ts`, `migrate.test.ts` y `packages/shared/src/index.ts` conservan su número de líneas; `schema.sql` = 807.
- [x] 3.3 Barrido de la regla de mutación 4: `grep -rnoE "(ticketService|altaManual|migrate|migrate\.test|index)\.ts:[0-9]+(-[0-9]+)?"` y sobre `schema.sql`, cada cita contrastada con el fichero (qué AFIRMA, extremos inicial y final); segundo pase de abreviadas; incluir `openspec/specs/tickets-core/spec.md`.
- [x] 3.4 `npm test`, `npm run typecheck`, `npm run lint` en verde y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` con código 0; los cuatro códigos anotados.
- [x] 3.5 Medida: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear, por debajo de 720; `git diff --stat` sin ningún fichero bajo `apps/desk/src`.

## Lote 2 — aviso sin cablear, inerte (RQ-AV-21)

### 4. Rojo
- [x] 4.1 `packages/zoho-sync/src/db/nitExentosEsquema.test.ts`: la tabla `provisional_books_avisados` existe y nace vacía, pareja repetida da `23505`, `avisos_creados` nulo se rechaza, `CREATE` calificado y tras la siembra de `nit_exentos`.
- [x] 4.2 `packages/zoho-sync/src/db/migrate.test.ts`: cifras `[10, 34, 3]` y `47` y segunda renumeración en sitio de las siete aserciones (diseño §4, columna «Tras lote 2»).
- [x] 4.3 `apps/desk/server/services/avisoProvisionalEnBooks.test.ts` (nuevo): casos a a j del diseño §7 (una vez por pareja, no repite, enlazado no avisa, exento por lado, sin destinatarios no marca y reintenta, estructura de la transacción, un fallo en una pareja no para las demás).
- [x] 4.4 Correr `npx vitest run` sobre los tres ficheros y ANOTAR qué falla (módulos y tabla inexistentes, recuento). Si no coincide, parar y anotar.

### 5. Verde
- [x] 5.1 `schema.sql`: las once líneas de `public.provisional_books_avisados` (diseño §1) AL FINAL, de la 808 a la 818; `'provisional_books_avisados'` en `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:73`).
- [x] 5.2 `apps/desk/server/db/provisionalEnBooks.ts` (nuevo): `provisionalesSinEnlazar`, `contactosDeBooks`, `parejasYaAvisadas`.
- [x] 5.3 `apps/desk/server/services/avisoProvisionalEnBooks.ts` (nuevo): `textoAvisoProvisionalEnBooks`, `parejasPorAvisar`, `marcarYAvisarPareja`, `avisarProvisionalesEnBooks`. SIN `pasadaProvisionalesEnBooks` y sin tocar `apps/desk/server/index.ts`.
- [x] 5.4 Repetir 4.4 en verde.

### 6. Cierre del lote 2
- [x] 6.1 Mutaciones ejecutadas y RESTAURADAS: N1, N2 (las dos guardas), N3, N5 (regla 1), N6, N7 (cada lado), N8, N9 (cada salida corta), N10 (clave primaria y `public.`); N4 y la mitad de N11 (la del `try/catch` de la pasada) pasan al lote 3.
- [x] 6.2 Barrido de la regla de mutación 4 sobre `schema.sql`, `migrate.ts`, `migrate.test.ts` y `apps/desk/server/index.ts` (sin tocar), cada cita contrastada con el fichero.
- [x] 6.3 Los cuatro códigos (`npm test`, `npm run typecheck`, `npm run lint`, detector de citas) anotados.
- [x] 6.4 Medida del intento (`--no-renames` más `wc -l` de lo nuevo sin trackear) por debajo de 720; sin ningún fichero bajo `apps/desk/src`.

## Lote 3 — pasada y despliegue (RQ-AV-21)

### 7. Rojo
- [x] 7.1 `apps/desk/server/services/avisoProvisionalEnBooks.test.ts`: caso k (la pasada resuelve con la base caída y la sincronización encadenada corre; dos pasadas consultan las dos veces) y caso l (`index.ts` como fichero vigilado: `pasadaReclamaciones(pool)` < `pasadaProvisionalesEnBooks(pool)` < `pasadaRitmoContratos(pool)` < `sync.syncRecent()`).
- [x] 7.2 Correr `npx vitest run` sobre ese fichero y ANOTAR qué falla (k y l; a a j siguen verdes).

### 8. Verde
- [x] 8.1 `pasadaProvisionalesEnBooks` en `apps/desk/server/services/avisoProvisionalEnBooks.ts` (envuelta en `try/catch`, nunca lanza, sin cerrojo diario).
- [x] 8.2 `apps/desk/server/index.ts:15` y `:88` DENTRO de línea (diseño §6); el fichero conserva su número de líneas.
- [x] 8.3 `DEPLOY.md`: apartado «Comprobación de lectura tras desplegar F1B-19» tras `DEPLOY.md:628`, con lo que enumera el diseño §9, sin variables ni interruptor.
- [x] 8.4 Repetir 7.2 en verde y comprobar que siguen verdes las tres pruebas de texto: `apps/desk/server/services/avisoRitmoContrato.test.ts:194`, `apps/desk/server/services/avisoReclamacionProveedor.test.ts:258-259` y `apps/desk/server/services/alarmasSla.test.ts:260-262`.

### 9. Cierre del lote 3
- [x] 9.1 Mutaciones ejecutadas y RESTAURADAS: N4 (quitar la pasada de `index.ts` → l) y N11 (quitar el `try/catch` por pareja → j, y el de la pasada → k).
- [x] 9.2 Barrido de la regla de mutación 4 sobre `apps/desk/server/index.ts`, `DEPLOY.md` y los ficheros del lote 2, cada cita contrastada con el fichero.
- [x] 9.3 Los cuatro códigos (`npm test`, `npm run typecheck`, `npm run lint`, detector de citas) anotados.
- [x] 9.4 Medida del intento (`--no-renames` más `wc -l` de lo nuevo sin trackear) por debajo de 720; `git diff --stat` de los tres lotes sin ningún fichero bajo `apps/desk/src` (criterio 10).

## Regla invariable 13

| Decisión del cliente sobre el NIT | Línea del servidor que la impone |
|---|---|
| Ninguna: `apps/desk/src` sólo envía el NIT recortado (`apps/desk/src/lib/altaManualEstado.ts:30`) y enseña los candidatos del `409`; no se toca ese árbol | `apps/desk/server/services/ticketService.ts:96` |

## Tareas de personas — fuera del recuento

No son casillas y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Destino y dónde queda escrito |
|---|---|---|
| (i) Decidir qué NIT repetidos son genéricos y deben entrar en la lista | Contabilidad | `openspec/config.yaml` → `decisiones_de_gerencia`; la fila se añade por SQL en producción |
| (ii) Ejecutar la consulta de sólo lectura de la propuesta y entregarla a contabilidad; ninguna sesión la ejecuta | Persona con acceso a producción | `docs/sdd/ENTRADA.md` → E-154 |
| (iii) Responder a las preguntas S-1 a S-6 (S-4 antes de desplegar) | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| (iv) Corregir los textos que dejan de ser ciertos: comentario de E-154 y E-155 y `tanda_que_abre` de las dos decisiones | Supervisión (no se editan en la rama) | `docs/sdd/ENTRADA.md` y `openspec/config.yaml`, al fusionar; el `archive-report.md` lo declara |

## Review Workload Forecast

| Lote | Contenido | Líneas estimadas | Techo con margen |
|---|---|---|---|
| 1 · exentos | schema 11, guardián 34, shared 51, lector 14, ediciones 10, pruebas del alta 75, esquema 50, casillas y `apply-progress.md` 90 | ~335 | ~430 |
| 2 · aviso inerte | schema 11, guardián 34, lectores 40, servicio ~80, prueba a a j ~190, esquema ~30, casillas y `apply-progress.md` ~70 | ~455 | ~560 |
| 3 · pasada y despliegue | pasada ~15, `index.ts` 4, casos k y l ~50, `DEPLOY.md` ~30, casillas y `apply-progress.md` ~60 | ~160 | ~250 |

Total del cambio ~950 (reparto del §8 del diseño, ~930, en tres lotes). El techo de 800 se aplica por intento, no al cambio entero; cada lote queda por debajo de 720.
Es estimación, no medida; la medida se ejecuta al cerrar cada intento (3.5, 6.4, 9.4). Sin `.tsx`.

- Chained PRs recommended: Yes (tres lotes encadenados; el proyecto fusiona por rama, no por PR).
- Decision needed before apply: No.
