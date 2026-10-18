# Informe de archivo — `busqueda-cliente-y-codigo` (F1F-03, `cierra: no`)

**Cobertura de la fila:** de F1F-03 cubre la paridad de búsqueda de E-198 (`decision/e198-busqueda-cliente-y-codigo`:
cliente y código de servicio, sin contacto); deja fuera la aceptación con los cuatro servicios del 16/11 al 04/12, los tres
puntos incumplibles de `decision/f1f03-criterio-aceptacion` y lo que cada persona anote como ausente de Zoho Desk.

## 1. Lo que se archiva

| Commit | Qué |
|---|---|
| `2e5839a` | Planificación: medición B-1, delta de RQ-VT-11 (en sitio) y RQ-VT-17 (nuevo), diseño y tareas |
| `f73be04` | `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` en sitio: OCHO en curso, con F1F-03 (visto rojo antes) |
| `6b303b8` | Apply: cinco vías en `packages/zoho-sync/src/db/busquedaTickets.ts:21`, comentarios en sitio, caja, dos pruebas nuevas |
| `5e9fe92` | Verify PASS (0 críticos, 1 aviso, 3 sugerencias); W1 corregido en sitio en `apply-progress.md` |
| este commit | Fusión del delta en `openspec/specs/vistas-tablero/spec.md` y mudanza de la carpeta |

## 2. Fusión del delta

Por script (`herramientas/fusiona.mjs`), con comprobación de identidad: los dos bloques vivos son idénticos al delta.

- **RQ-VT-11, MODIFIED:** `openspec/specs/vistas-tablero/spec.md:484-664`, 181 líneas antes y después; cuatro líneas
  sustituidas en sitio (`:484`, `:512`, `:514`, `:542`). Ninguna cita a la spec se desplaza.
- **RQ-VT-17, ADDED:** al final, desde `:938`. La spec pasa de 936 a 1.030 líneas sin mover ninguna anterior.

**Parte revisable, medida antes de aplicar:** la fusión son 98 inserciones y 4 borrados (`git diff --shortstat
--no-renames -- openspec/specs/`), más este informe; por debajo de 800.

## 3. Estado al cerrar

- Códigos en `5e9fe92`, en una cadena: `npm test` 0 (284 ficheros, 4.787 pruebas pasan, 11 omitidas), `npm run typecheck`
  0, `npm run lint` 0 (0 errores, 165 avisos, igual que la partida), detector `--sha HEAD` 0 (13 abreviadas informativas,
  la línea base del día).
- Ninguna línea insertada en un fichero existente: `wc -l` igual en `e99f361` y en `6b303b8` para
  `packages/shared/src/busquedaTickets.ts` (37), `packages/zoho-sync/src/db/busquedaTickets.ts` (24),
  `apps/desk/src/components/BuscadorTickets.tsx` (27) y `apps/desk/server/reconciliacion/registro.test.ts`.
- Mutaciones: M0 a M7 en el apply (`apply-progress.md`), M0, M1 y M4 reproducidas por el verify. Todas en rojo salvo los
  controles.
- Intentos del registro: planificación 502, apply 290, verify 146, todos con techo 800.
- Bundle: `index-BcnKpGtZ.js` → `index-DUWvYLlB.js`, sólo por el texto y el ancho de la caja. Sin migración.

## 4. Lo que queda fuera, anotado

- **Supuestos S-1 a S-4** (`proposal.md` §4): no se pliegan acentos ni puntuación; casa cualquiera de los dos nombres del
  ticket; del cliente sólo cuenta el nombre; asunto fuera. A la lista semanal (`decision/supuestos-semanales-aceptacion`).
- **Dos diferencias del buscador de clientes, no de este cambio** (verify S1 y `apply-progress.md`): `searchClients` no
  recorta los extremos (`apps/desk/server/routes/directory.ts:16` pasa el texto tal cual) y filtra por tipo de contacto
  cliente (`packages/zoho-sync/src/books/repo.ts:121`), que la búsqueda de tickets no filtra. La confrontación fija la
  primera; la segunda no la ve, porque siembra sin tipo.
- **Avance:** con este cambio F1F-03 pasa a «en curso» en el barrido (ocho en curso), sin sumar: `cierra: no`.
- **Tareas de personas** (`tasks.md`): P-1, revisar los supuestos; P-2, verificación de la caja tras el despliegue.
  Archivar no las da por hechas.
