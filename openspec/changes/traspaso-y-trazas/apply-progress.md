# Progreso de apply — traspaso-y-trazas (F1B-05, `cierra: no`)

Modo: Strict TDD. Partida del lote 1: `540f31c`. Intento abierto por el orquestador; el apply no lo asienta ni commitea.

## Lote 1 — hecho (1.1 a 1.32 y 1.34; 1.33 a falta del detector de citas, que corre el orquestador tras el commit)

### Rojos observados (antes del verde)
| Tarea | Rojo literal |
|---|---|
| 1.3 | Con la prueba sin editar y `proposal.md` presente: `expected [ 'F0-04', 'F1B-03', 'F1B-04', …(7) ] to deeply equal [ …(6) ]`. Tras editarla (DIEZ, `'F1B-05'`) queda verde: la cabecera ya cuenta |
| 1.4 | `ALTER TABLE en schema.sql: expected 55 to be 59` |
| 1.5-1.7, 1.9 | `column "restaurada_at" does not exist` (cinco de seis; la sexta, listado y panel tras restaurar, ya era verde: guarda de regresión) |
| 1.8, 1.9 | `Cannot find module './remisionRestaurada'` |
| 1.10, 1.11 | `expected [ [ null, 'Ticket eliminado' ], …(1) ] to deeply equal [ Array(2) ]` y `expected { ticket_id: 'app-1', …(10) } to match object { liberada_por: 'Beto', …(1) }` |
| 1.12-1.14 | `Cannot find module './testing/escritoresTransiciones'` |

### Hallazgos del apply
- **Una segunda prueba de `migrate.test.ts` cuenta las sentencias tras `idx_prioridad_ajustes`** (`'las seis sentencias nuevas van DETRÁS de prioridad_ajustes…'`, línea 648): cayó con `expected 154 to be 150`. El diseño (§4, §9) sólo nombraba los recuentos de `:376-377`. Se editó EN SITIO (`+ 2 + 2` pasa a `+ 2 + 2 + 4` y el texto del mensaje, línea 652), sin mover líneas. Verde.
- **pg-mem acepta el `UPDATE` de un solo paso** de `design.md` §5: no hizo falta el respaldo de dos sentencias con `enTransaccion`.
- **Sin nombre en la sesión:** `users.name` es `NOT NULL`, así que no se puede sembrar un usuario sin nombre. La prueba envuelve la base para que la consulta de sesión devuelva `name: null` y ejercita el respaldo `TRANSITION_ACTOR` de la ruta.
- El mensaje del título de `migrate.test.ts:374` también pasó a 59/33/28 de public (misma línea).

### Mutaciones (aplicadas, revertidas y comprobado con `git diff` que no queda ninguna)
| # | Mutación | Resultado |
|---|---|---|
| M1 | Quitar del `SET` las dos asignaciones de copia | Rojo, 4 pruebas: «anular y restaurar por la ruta deja las cuatro columnas…» → `expected null to be 'Admin'`; también «sin nombre…», «anulada, restaurada y anulada de nuevo…» y «un segundo ciclo pisa el primero…» |
| M2 | Vaciado delante de la copia en el `SET` | **Verde (6/6): mutación equivalente.** pg-mem evalúa el lado derecho sobre la fila vieja, como PostgreSQL. No es prueba que falte. No se forzó |
| M3 | Quitar `AND anulada_at IS NOT NULL` | Rojo: «restaurar una remisión vigente responde 200 y no escribe nada» → `expected 2026-10-05T16:30:40.603Z to be null` |
| M4 | `null` en vez del respaldo en la ruta | `npm run typecheck`: `remision.ts(344,37): error TS2345: Argument of type 'string \| null' is not assignable to parameter of type 'string'`. Con `as never`: rojo «sin nombre en la sesión se escribe TRANSITION_ACTOR y no NULL» → `expected null to be 'Equipo Técnico'` |
| M5 | Quitar `liberada_por = $3` (y el parámetro) | Rojo, 2: «dos vigentes quedan con `liberada_por`…» (`ovAsociaciones.test.ts`) y «con dos vigentes y una liberada por otra persona…» (`eliminarTicket.test.ts`) |
| M6a | Quitar `performed_by` del escritor real (`migracionTicketsAbiertos.ts:79`) | Rojo: `Escritor de ticket_transitions que no nombra performed_by en: apps/desk/server/db/migracionTicketsAbiertos.ts` |
| M6b | Quitar `performed_by` del `.sql` real de `docs/sdd/` (línea 46, en copia restaurada) | Rojo: «el inventario es exactamente uno, y nombra `performed_by`» → `…no nombra performed_by en: docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` |
| M7 | Quitar `public.` a `restaurada_por` en `schema.sql` | Rojo, 3 en `migrate.test.ts`: «toda ALTER TABLE apunta a una tabla clasificada…» (`expected [ 'remisiones' ] to deeply equal []`), «las ALTER sin calificar son exactamente las de DESK_TABLES…» y el recuento (`expected 32 to be 33`) |

### Barrido de citas (regla de mutación 4, tarea 1.32)
Método: `git grep -noE` con la ruta completa de las siete formas de `.ts` y de `schema.sql`, sin `openspec/changes/archive/` ni este cambio (376 y 294 citas), cruzadas por script con las líneas editadas; segundo pase de la forma abreviada (`:NN`) en los ficheros que ya citan cada módulo.
- **Desplazamiento: cero, confirmado.** `wc -l` idéntico a 1.1 en `remisiones.ts` (240), `routes/remision.ts` (397), `historial.ts` (162), `ovAsociaciones.ts` (184), `eliminarTicket.ts` (189), `routes/tickets.ts` (223) y `migrate.test.ts` (765). `schema.sql` pasa de 718 a 724 sólo por el final; ninguna cita apunta más allá de la 718 salvo las ya existentes hasta `:718`.
- **Citas cuyo texto cambió:** `eliminarTicket.ts:154` ×4 (`Paquete_de_Despliegue_2026-09-29.md:454`, `:728`; `…-09-30.md:632`; `…-10-01.md:853`): la llamada ahora lleva actor — **caso B**, paquetes fechados, no se tocan. `migrate.test.ts:374-376` ×1 (`Paquete_de_Despliegue_2026-10-04b.md:474`): recuentos 55/29 hoy 59/33 — **caso B**, no se toca.
- **Caso A, siguen ciertas:** `openspec/specs/trazas/spec.md:141` (`historial.ts:131-161`) y `:471` (`historial.ts:66-121`, tres eventos de remisión: lo sigue siendo la función).
- **Abreviadas:** ninguna apunta a las líneas editadas. `openspec/specs/remisiones/spec.md:277` ya trae su revisión (`a0a2935`, caso B). El resto de coincidencias de `:NN` son de otros ficheros (ruido del segundo pase, leído una a una). `registro.test.ts` no tiene citas.
- Ninguna cita de `ovAsociaciones.ts` apunta a `:132` o posterior, como afirmaba el diseño §9.

### Cierre (códigos de salida literales)
- `npm test`: **exit 0** — 214 ficheros pasan, 2 saltados; 3325 pruebas pasan, 7 saltadas.
- `npm run typecheck`: **exit 0**.
- `npm run lint -- --max-warnings 165`: **exit 0** — 0 errores, 165 avisos (no suben).
- Detector de citas tras el commit: lo corre el orquestador.

### Medida (1.34), sin commitear, partida `540f31c`
`git diff --shortstat --no-renames 540f31c`: 12 ficheros, 130 inserciones y 62 borrados (192); más `wc -l` de lo nuevo sin trackear: 436 (cinco ficheros de código y prueba, 383, y este fichero, 53). **Total 628** (techo 800, objetivo 720). Ficheros binarios: ninguno.

## Lote 2
Pendiente.
