# Tareas — sync-tickets-por-modificacion (`fuera-del-plan`, `cierra: no`)

Strict TDD: cada tarea de código empieza por su prueba roja, con la salida literal anotada en `apply-progress`.
Todas las pruebas nuevas van en `packages/zoho-sync/src/sync.modificados.test.ts` (diseño, punto 7); `sync.test.ts` no
se toca. Un intento, un worktree, sin rebasar con el intento abierto (regla del ciclo 3). Base de medida: `9822bd7`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Código (`sync.ts`) | ≈ 60 (3 líneas cambiadas en `:174-176` + bloque ≈ 55 tras `:358`) |
| Pruebas (`sync.modificados.test.ts`, nuevo) | ≈ 230 |
| Artefactos SDD ya escritos | 327 (proposal 90 + spec 96 + design 141) |
| Artefactos SDD por escribir en apply | ≈ 95 (`tasks.md`) + ≈ 40 (`apply-progress`) |
| Total esperado al cerrar apply | ≈ 750 (código+pruebas ≈ 290; artefactos ≈ 460). Riesgo Medio frente a 800 |
| Verify y archive | NO caben en este intento: `verify-report` (≈ 200-350) y `archive-report` (≈ 110-260) más la fusión del delta y el `git mv` (cuenta doble) superan 800. Van en intento propio (regla del archivo: revisable = fusión + informe ≤ 800) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High (presupuesto vigente del proyecto: 800 por intento, no 400; riesgo Medio frente a 800)

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Marca de agua, búsqueda, caída y persistencia (lotes 1-4) | Rama única | `npx vitest run packages/zoho-sync/src/sync.modificados.test.ts` | `zohoFetch` enrutado por ruta + pg-mem; real sólo tras desplegar (tareas de persona) | `sync.ts` (174-176 y bloque final) y el fichero de pruebas |
| 2 | Cierre: barrido de citas, medida, DEPLOY.md | Rama única | `npm test` | N/A: documental y de medida | Ediciones de citas y de `DEPLOY.md` |

## Lote 1 · marca de agua y camino sin marca

- [x] 1.1 RED `sync.modificados.test.ts`: andamiaje (pg-mem, `zohoFetch` enrutado por ruta que registra peticiones, espía de `console.error`). Prueba 5: sin marca, página 1 por `-recentThread`, sin búsqueda ni `console.error`. Escenario: Réplica vacía o sin filas elegibles.
- [x] 1.2 RED pruebas 3 y 4: fila `managed_by_app = true` y fila `app-…` más recientes no adelantan la marca. Escenarios: Una transición hecha en la App…; Un ticket nacido en la App….
- [x] 1.3 GREEN `sync.ts`: `syncRecent` en `:174-176` delega (`paginaReciente` en `:174`, comentario en `:175`, `return sincronizarModificados(...)` en `:176`); bloque tras `:358` con `SOLAPE_MODIFICADOS_MS`, `ModificadosDeps` y la consulta `max(modified_time) … NOT LIKE $1 AND managed_by_app = false`. Si pg-mem rechaza `max`, usar la forma de `:307-310`.
- [x] 1.4 MUTACIÓN: quitar `managed_by_app = false` (rojo 3), quitar `NOT LIKE` (rojo 4), tratar marca nula como fallo (rojo 5); restaurar tras cada una.

## Lote 2 · búsqueda, índice y detalle

- [x] 2.1 RED prueba 1: búsqueda devuelve ítem recortado (`id`, `modifiedTime`); el detalle trae el ticket cerrado; la fila queda `Closed` con `closed_time` y `serial`; no se llama a `/tickets?`. Escenarios: Cierre en Zoho…; Ninguna columna promovida se vacía.
- [x] 2.2 RED prueba 2: `departmentId`, `sortBy=modifiedTime`, `from=0`, `limit=100`, `desde` = marca − 15 min exacto, `hasta` ≥ marca.
- [x] 2.3 RED prueba 6: 100 + 3 resultados, `from=0` y `from=100`, 103 detalles. Escenario: Más de una página.
- [x] 2.4 RED prueba 10: ids repetidos y en orden descendente; un detalle por id, pedidos en orden ascendente.
- [x] 2.5 GREEN `sincronizarModificados`: recoger todos los ids por páginas, deduplicar, ordenar por `modifiedTime` ascendente estable, leer cada detalle (`include: 'contacts,assignee'`) y `persistTicket`.
- [x] 2.6 MUTACIÓN: persistir la respuesta de búsqueda (rojo 1), quitar solape o cambiar `sortBy` (rojo 2), quitar el bucle (rojo 6), quitar/invertir orden o deduplicación (rojo 10); restaurar.

## Lote 3 · caída, vacío y fallos de detalle

- [x] 3.1 RED prueba 7: `204` sin cuerpo devuelve 0, sin caída ni `console.error`.
- [x] 3.2 RED prueba 8: búsqueda `403` y variante con excepción; `console.error` con `/tickets/search` y `403`; se pide y persiste la página 1; no lanza. Escenario: La búsqueda responde no-OK.
- [x] 3.3 RED prueba 9 (POSICIÓN, regla de mutación 1): página 2 responde `500`; ningún detalle pedido y hay caída.
- [x] 3.4 RED pruebas 11, 12, 13: detalle `429` en el 2.º de 3 corta (el 3.º no se pide); `404` en el 2.º sigue (el 3.º persiste); colisión de número en uno no aborta y el recuento incluye a los dos. Escenarios: Un ticket falla al persistir; Fila gestionada por la App (`repo.ts:71`).
- [x] 3.5 RED prueba 14: diez páginas llenas (detalles `404`, sin escrituras); no hay `from=1000`; `console.error` del tope. Escenario: Tope de paginación.
- [x] 3.6 GREEN: caída con `console.error('Zoho /tickets/search <estado>: el ciclo cae a la página 1 por -recentThread')`, vacío como 0, corte por `429`/`≥ 500`/red, siguiente por otro `4xx` o fallo de persistencia, tope de 1.000.
- [x] 3.7 MUTACIÓN: tratar vacío como fallo (rojo 7), quitar la caída (rojo 8), leer el detalle dentro del bucle de paginación (rojo 9), aislar el `429` (rojo 11), cortar ante cualquier fallo (rojo 12), dejar salir la excepción (rojo 13), quitar el tope (rojo 14); restaurar tras cada una y anotar la salida roja.

## Lote 4 · comprobación de lo existente

- [x] 4.1 Correr sin tocarlas `sync.test.ts`, `apps/desk/server/ovDiscrepanciaSync.test.ts` y `apps/hub-sync/src/hubSync.test.ts`: deben seguir verdes (marca nula, camino de hoy).

## Lote 5 · cierre (documental y de medida)

- [x] 5.1 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` (cifra de `.github/workflows/ci.yml:41`): anotar los códigos de salida y 0 errores.
- [x] 5.2 Barrido de citas (regla de mutación 4): `grep -rnoE "sync\.ts:[0-9]+(-[0-9]+)?"` y comprobar CADA resultado contra el fichero, leyendo qué afirma la frase. Reparar por casos A/B/C, nunca renumerar a ciegas: `docs/sdd/ENTRADA.md:2048` (caso C: anclar a la revisión de partida y añadir qué lo cerró) y `proposal.md:15`, `:65` (anclar a la revisión de partida). `F0-00_Baseline_as-built.md:121` ya anclada a `17ddfec`: no se toca.
- [x] 5.3 Segundo pase: rangos que contienen 173-177 con otros extremos, formas abreviadas (`:173-177` sin fichero en ficheros que ya citan `sync.ts`) y las líneas largas que nombran `syncRecent` sin cita (`openspec/specs/zoho-sync/spec.md:743`, `docs/sdd/ENTRADA.md:1270`). Confirmar ciertas `spec.md:264-265` y `hubSync.test.ts:154`. Correr el detector de citas y anotar su código de salida.
- [x] 5.4 Documental pequeña (propuesta, no obligatoria): una frase en `DEPLOY.md` (al final, sin desplazar líneas citadas) sobre el permiso de búsqueda `Desk.search.READ` del token y el aviso del log `/tickets/search`. Sin flag, sin `.env.example`.
- [x] 5.5 Medir el intento: `git diff --shortstat --no-renames 9822bd7` más `wc -l` de lo nuevo sin trackear; registrar ESO en el ledger. Tope 800; si lo supera, el intento se parte.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas

Archivar NO las da por hechas. No modelan trabajo que una tanda pueda hacer en este repositorio: dependen del despliegue y del acceso a producción.

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Ejecutar `backfillTickets` una vez tras desplegar (la marca no recupera lo perdido: el máximo de la réplica ya pasó del 2 de octubre) | Responsable del despliegue | Tras desplegar | `archive-report.md` de este cambio |
| Revisar el log del primer ciclo: que la búsqueda no caiga; si cae por permisos, ampliar el scope del token | Responsable del despliegue | Tras desplegar | `archive-report.md` de este cambio |
| Comprobar que el ticket nº 884 figura cerrado | Responsable del despliegue | Tras el relleno | `archive-report.md` de este cambio |
