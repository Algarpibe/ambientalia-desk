# Exploración — `columna-propia-dos-estados`

Hechos leídos en el worktree, rama `columna-propia-dos-estados`, nacida de `7a2b1c8`. Lo que no se
leyó va marcado como **hipótesis**.

## 1 · La decisión

- `openspec/config.yaml:4183-4205`, clave `decision/e225-columna-propia-dos-estados`, 2026-10-06.
  Respuesta textual (`:4189`): «Columna propia dentro de F1B-08 si cuesta menos de medio día; si
  no, después del corte.»
- Consecuencia 2 (`:4197`): va dentro de F1B-08 y no de F1B-09. Consecuencia 3 (`:4198-4199`):
  cambio propio, `tanda: F1B-08`, `cierra: no`. Consecuencia 4 (`:4200-4201`): el color de la
  tarjeta vive en un `.tsx`; si se toca, su comprobación es manual.

## 2 · El reparto de columnas hoy

- `packages/shared/src/columns.ts` tiene 47 líneas. `COLUMNS` ocupa `:10-35`; `'otros'` es su
  última entrada, `:34`; `FALLBACK_COLUMN_ID` en `:38`; `STATUS_TO_COLUMN` en `:40-42`;
  `columnForStatus` en `:45-47`. El comentario de `:4` declara que las columnas van «en orden de flujo».
- El reparto se deriva de la lista: `STATUS_TO_COLUMN` se construye con `COLUMNS.flatMap` (`:41`).
- Consumidores fuera de `packages/shared`: `apps/desk/src/board.ts:2`, `:7`, `:9` y
  `apps/desk/src/App.tsx:5`, `:120`. Los dos leen la lista; ninguno enumera ids.
- `ESTADOS` (`packages/shared/src/estados.ts:112`) tiene 23 estados: 5 + 6 + 9 + 3 según los cuatro
  bloques de `estados.ts:59-106`. De los 23, 20 tienen columna declarada en `columns.ts:14-33`; caen
  en `otros` exactamente tres: `Finalizado`, `Verificación` y `Solicitud Soporte`.

## 3 · Lo que hoy afirma lo contrario

| Dónde | Qué dice |
|---|---|
| `packages/shared/src/flujos.test.ts:125-128` | `describe` y prueba: `Verificación` → `'otros'` |
| `packages/shared/src/flujos.test.ts:204-206` | prueba S-10: `Solicitud Soporte` → `'otros'` |
| `packages/shared/src/columns.test.ts:5-12` | fija la lista ordenada de 21 ids; la decisión no la contó |
| `openspec/specs/transitions-equipo-nuevo/spec.md:256-272` | RQ-EN-07; el `MUST NOT` en `:264-267`, el escenario en `:269-272` |
| `openspec/specs/transitions-soporte-remoto/spec.md:108-109` | RQ-SR-03 (empieza en `:98`); `MUST NOT` |

- **El título de RQ-EN-07 también lo afirma**: `spec.md:256` termina en «y cae en `Otros` en el
  tablero». No basta con reescribir `:264-267` y `:269`.
- `packages/shared/src/columns.test.ts:36-39` (`Finalizado` y un estado desconocido → `'otros'`)
  sigue siendo cierta tras el cambio y no se toca.
- `apps/desk/src/board.test.ts:19-20` prueba el respaldo con un estado inventado; no se ve afectada.

## 4 · Posición en el flujo

- `Solicitud Soporte` es el estado de nacimiento del soporte remoto: `packages/shared/src/flujos.ts:139`
  devuelve `'Solicitud Soporte'` o `'Ticket creado'`. Su única salida va a `En Proceso`
  (`packages/shared/src/transitions.ts:389`).
- `Verificación` tiene como único origen `En Proceso` (`transitions.ts:357`) y sale a `Finalizado`
  (`:359`) o a `Notificado` (`:361`).

## 5 · Citas por línea a `columns.ts`

- Forma completa, fuera de `openspec/changes/archive/`: 12 líneas en 8 ficheros, entre ellos
  `docs/sdd/ENTRADA.md`, `openspec/config.yaml` y las dos specs vivas. La cifra de «unas 30» del
  encargo no se reprodujo: **hipótesis**, incluye el archivo y las formas abreviadas.
- Precedente de dos declaraciones en una misma línea física para no desplazar citas:
  `packages/shared/src/estados.ts:182`.

## 6 · Hallazgo que el encargo no traía

- `apps/desk/src/board.ts:26` oculta `'otros'` siempre que esté vacía; `:27` oculta las demás sólo
  con `hideEmpty`. **Una columna propia vacía se enseña** cuando `hideEmpty` es falso, cosa que
  hoy no ocurre con esos dos estados. Que `KanbanBoard` use `visibleColumns` es **hipótesis**: el
  `.tsx` no se leyó.
