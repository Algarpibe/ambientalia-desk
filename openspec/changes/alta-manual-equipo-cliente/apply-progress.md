# Apply-progress: alta-manual-equipo-cliente (F1B-15) — lote 1

Strict TDD · partida `cc76d98` · tareas 1.1-1.13 `[x]`. El orquestador commitea y mide. Sin cambios en la vista, `books/repo.ts` ni el hub.

## Ciclo TDD (rojo capturado antes del código)
| Tarea | Prueba | Rojo | Verde |
|---|---|---|---|
| 1.1-1.2 | `migrate.test.ts` | 7 rojas: «expected [10,26,3] to deeply equal [10,27,3]», «expected 43 to be 44» | 49/49 (era 44/44) |
| 1.4 | `shared/altaManual.test.ts` | «Cannot find module './altaManual'» | 4/4 |
| 1.5-1.6 | `services/clientes.test.ts` | «Cannot find module './clientes'» | 14/14 (HTTP rojo por `directory.ts`: «expected [[c1,undefined]]…», luego verde) |
| 1.8 | `db/ticketsConCliente.test.ts` | «Cannot find module './ticketsConCliente'» | 4/4 |
| 1.10 | `lectoresProvisionales.test.ts` | 4 rojas: «expected null to be 'Zeta Provisional'» (ticketFuentes, analisis), remisión, PATCH «expected 422 to be 200» | 4/4 |
| 1.12 | `registro.test.ts:220` | «F1B-15» sobraba en la lista | 23/23 |

## Mutaciones (aplicada → rojo → revertida → verde)
- m1 sin `public.` en el `CREATE`: 2 rojas (guardián de tablas y prueba de calificación). m2 `ALTER TABLE public.equipos`: 3 rojas (guardián de `ALTER`, recuento 44, calificación).
- m3 `false AS provisional` en `schema.sql:172`: 1 roja («la vista public.clients es idéntica a la de 132d25f»). m4 sin la entrada de `PUBLIC_TABLES`: 3 rojas.
- P4 consulta de provisionales antes de Books en `obtenerCliente`: 2 rojas («expected 1 to be +0», prioridad con espía). Todas con 49/49 y 14/14 tras revertir.

## Cierre (1.13)
- `npm test`: 174 ficheros pasan (1 omitido), 2455 pruebas pasan, 2 omitidas, 0 rojas. `typecheck` limpio; `lint` 165 avisos, 0 errores (techo 165, 0 nuevos: `aProvisional` tipado sin `any`); `build` verde.

## Barrido de citas (1.11)
- Sólo `analisis.ts` desplaza líneas (+1 import, +3 en la consulta: el `JOIN clients` pasa de `:16` a `:17`). El resto son añadidos al final o ediciones en la misma línea.
- Caso A: `equipos.ts:163` y `design.md:99` → `analisis.ts:17`. Caso B: `archive/2026-09-23-hojas-vida/design.md:15` → «en `cc76d98`».
- Cita errónea de la propia planificación: `types.ts:99` es `accountName` del ticket crudo de Zoho; el tipo `Ticket` lleva la marca en `:8` (corregido en `design.md:92` y `tasks.md:49`).
- Dos bloqueantes ya presentes en `design.md` (la ruta de `view.ts` de pg-mem y la línea vacía 28 de `ticketService.ts`) reescritos en prosa. Detector sobre una instantánea del árbol: 0 bloqueantes (sobre `HEAD` siguen esos dos hasta commitear). Medida: 626 inserciones y 58 borrados contra `cc76d98`, sin binarios.

## Desviaciones
- `HojaDeVida.tsx:153`: una línea (`as Record<string, string>` con respaldo al nombre del campo) porque ampliar `CambioEquipo['campo']` rompía `tsc`; la etiqueta propia es del lote 4.
- `mappers.ts:246` no se toca: `rowToTicketDetail` hereda la marca de `rowToTicket` (`:199`). `ticketService.ts:2` queda para el lote 2.
- La prueba existente «las seis sentencias nuevas» de `migrate.test.ts:648-652` pasa a contar las dos de F1B-15 (misma línea).

## Frontera de reversión
`git revert` del lote 1: la tabla y la columna quedan sin uso. Arnés real: `GET /api/clients`, `/api/clients/:id`, `POST /api/remisiones`, `PATCH /api/equipos/:id` contra pg-mem.
