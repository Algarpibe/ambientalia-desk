---
tanda: F1B-08
motivo: ""
capacidad: [transitions-equipo-nuevo, transitions-soporte-remoto]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: columna propia para `Verificación` y `Solicitud Soporte`

## Intención

Los tickets en `Verificación` (equipo nuevo) y en `Solicitud Soporte` (soporte remoto) caen hoy en
la columna de seguridad `Otros` (`packages/shared/src/columns.ts:34`, `:45-47`), mezclados con los
`Finalizado`. Gerencia decidió el 2026-10-06 darles columna propia
(`decision/e225-columna-propia-dos-estados`, `openspec/config.yaml:4189`): «Columna propia dentro de
F1B-08 si cuesta menos de medio día; si no, después del corte.»

**Cobertura de la fila:** de F1B-08 este cambio cubre las dos columnas del tablero; deja fuera la
paridad de vistas con Zoho Desk, que por `decision/p4-vistas-equivalentes-zoho`
(`openspec/config.yaml:3940`, `:3942-3947`) se mide por escrito con plazo 2026-10-16 y no se
construye antes. Por eso `cierra: no`.

**Maestro:** ningún pasaje; la propia decisión registra `maestro_pasaje: "ninguno (tablero)"`
(`openspec/config.yaml:4203`).

## Alcance

### Dentro

- Dos entradas nuevas en `COLUMNS`: `solicitud_soporte` y `verificacion`, con etiqueta igual al
  nombre del estado.
- Inversión de las tres pruebas que hoy afirman lo contrario
  (`packages/shared/src/flujos.test.ts:125-128`, `:204-206`; `packages/shared/src/columns.test.ts:5-12`).
- Prueba exhaustiva nueva sobre los 23 estados, al final de `columns.test.ts`.
- Delta `MODIFIED` de RQ-EN-07 y de RQ-SR-03.

### Fuera

- `apps/desk/src` entero, incluidos todos los `.tsx`.
- El color de la tarjeta de esos dos estados (`TicketCard.tsx`): siguen con el color de respaldo
  (consecuencia 4 de la decisión, `openspec/config.yaml:4200-4201`).
- `packages/shared/src/estados.ts`: su clase de espera sigue `sin_clasificar` (`estados.ts:105`).
- `Finalizado`: sigue sin columna propia (`columns.ts:6-7`).
- La paridad de vistas de F1B-08 y cualquier otra vista del tablero.
- `docs/sdd/ENTRADA.md` y `openspec/config.yaml`: no se editan en la rama.

## Capacidades

### Nuevas

Ninguna.

### Modificadas

- `transitions-equipo-nuevo`: RQ-EN-07 deja de prohibir la columna propia de `Verificación`
  (`openspec/specs/transitions-equipo-nuevo/spec.md:264-267`, escenario `:269-272`).
- `transitions-soporte-remoto`: RQ-SR-03 deja de prohibir la de `Solicitud Soporte`
  (`openspec/specs/transitions-soporte-remoto/spec.md:108-109`).

## Enfoque

1. **Datos, no lógica.** `STATUS_TO_COLUMN` se deriva de `COLUMNS` (`columns.ts:40-42`), y los dos
   consumidores leen la lista (`apps/desk/src/board.ts:7`, `:9`; `apps/desk/src/App.tsx:120`).
   Añadir dos entradas basta.
2. **Posición (D-a).** `solicitud_soporte` inmediatamente después de `ticket_creado`;
   `verificacion` inmediatamente después de `proceso`. Razón: `columns.ts:4` declara orden de
   flujo; `Solicitud Soporte` es estado de nacimiento junto a `Ticket creado`
   (`packages/shared/src/flujos.ts:139`) y `Verificación` sólo se alcanza desde `En Proceso`
   (`packages/shared/src/transitions.ts:357`).
3. **Cero desplazamiento de líneas (D-b).** Cada entrada nueva se escribe en la misma línea física
   que su vecina anterior (`columns.ts:15` y `:20`), con un comentario al final de la línea que
   diga por qué. El fichero conserva sus 47 líneas. Precedente del mismo idioma:
   `packages/shared/src/estados.ts:182`.
4. **Pruebas invertidas en sitio (D-c).** Mismo número de líneas en `flujos.test.ts` y en la lista
   de `columns.test.ts`; lo nuevo, al final de `columns.test.ts`.
5. **Specs en sitio (D-d).** Los dos bloques `MODIFIED` conservan su número de líneas.
6. **Prueba exhaustiva (D-e).** Tabla literal con la columna de cada uno de los 23 estados ANTES
   del cambio. La prueba comprueba que las claves de la tabla son exactamente `ESTADOS`
   (`estados.ts:112`) y que `columnForStatus` difiere de la tabla sólo en los dos estados.

### Regla invariable 13

No se toca `apps/desk/src`: el cliente no gana ninguna decisión nueva y no hay tabla que rellenar.
El reparto vive en `packages/shared` y el cliente lo consume (`apps/desk/src/board.ts:2`).

## Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `packages/shared/src/columns.ts` | Modificado | dos entradas, en `:15` y `:20`; 47 líneas |
| `packages/shared/src/columns.test.ts` | Modificado | lista de ids en sitio; prueba exhaustiva al final |
| `packages/shared/src/flujos.test.ts` | Modificado | `:125-128` y `:204-206`, en sitio |
| `openspec/specs/transitions-equipo-nuevo/spec.md` | Delta | RQ-EN-07 |
| `openspec/specs/transitions-soporte-remoto/spec.md` | Delta | RQ-SR-03 |

## Supuestos

| # | Supuesto aplicado | Reversible | Pregunta para Gerencia |
|---|---|---|---|
| S-1 | Posición de las dos columnas según D-a; la decisión no la fija | Sí: mover una entrada de línea | ¿`Solicitud Soporte` va junto a `Ticket creado` y `Verificación` tras `En Proceso`, o en otro sitio? |
| S-2 | Etiqueta igual al nombre del estado | Sí | ¿Se quiere otro rótulo en la cabecera de la columna? |
| S-3 | Una columna propia vacía se enseña cuando no se ocultan las vacías, como las demás (`apps/desk/src/board.ts:26-27`) | Sí, pero exigiría tocar `apps/desk/src` | ¿Es aceptable ver esas dos columnas vacías en el tablero? |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El título de RQ-EN-07 (`transitions-equipo-nuevo/spec.md:256`) dice «y cae en `Otros` en el tablero»: reescribir sólo el cuerpo lo deja falso, y cambiarlo altera el nombre por el que se casa el bloque | Media | Lo decide `sdd-spec`: renombrado más modificación, sin cambiar el número de líneas |
| Las dos columnas aparecen vacías en casi todas las vistas (S-3). **Hipótesis**: depende de que el tablero use `visibleColumns`; el `.tsx` no se leyó | Media | Comprobación visual de personas; no se corrige aquí |
| Citas por línea a `columns.ts` desfasadas | Baja | D-b: cero desplazamiento; barrido de la regla de mutación 4 al cerrar, igualmente |
| Una línea larga en `columns.ts:15` y `:20` incumple una regla de `eslint` | Baja | **Hipótesis**; `npm run lint` en el apply. `estados.ts:182` ya convive con ese idioma |
| El comentario de `columns.ts:4` habla del Blueprint de Servicio Técnico y los dos estados no son de ese flujo (`estados.ts:176`) | Baja | El comentario de fin de línea de cada entrada nombra su flujo |

## Reversión

Revertir el commit del apply: quitar las dos entradas devuelve los dos estados a `otros` sin
migración ni dato persistido; las pruebas y las specs vuelven con el mismo revert. No hay esquema,
ni sincronización, ni interruptor implicados.

## Condición de Gerencia — coste

Estimación del apply: unas 130 líneas de diff (código 4, pruebas ~45, `tasks.md` y
`apply-progress` ~80); con factor 1,8, unas 235, por debajo de 300. Sin `.tsx`. **Es estimación, no
medida**: la medida se ejecuta al cerrar el intento (`git diff --shortstat --no-renames` más
`wc -l` de lo nuevo sin trackear).

## Dependencias

Ninguna externa. No depende de la respuesta a `decision/p4-vistas-equivalentes-zoho`.

## Criterios de aceptación

1. `columnForStatus('Verificación')` devuelve `'verificacion'` y
   `columnForStatus('Solicitud Soporte')` devuelve `'solicitud_soporte'`.
2. De los 23 estados de `ESTADOS`, sólo esos dos cambian de columna respecto a `7a2b1c8`; lo fija
   la prueba exhaustiva, cuya tabla tiene por claves exactamente `ESTADOS`.
3. `Finalizado` sigue cayendo en `otros`, y un estado desconocido también.
4. `Otros` sigue siendo la última entrada de `COLUMNS`; `solicitud_soporte` va justo después de
   `ticket_creado` y `verificacion` justo después de `proceso`.
5. `packages/shared/src/columns.ts` sigue teniendo 47 líneas, y `'otros'`, `FALLBACK_COLUMN_ID`,
   `STATUS_TO_COLUMN` y `columnForStatus` siguen en `:34`, `:38`, `:40-42` y `:45-47`.
6. `flujos.test.ts` conserva su número de líneas; en `columns.test.ts`, las líneas `:1-40` de hoy
   conservan su posición y lo nuevo empieza después.
7. Los dos bloques `MODIFIED` de las specs conservan su número de líneas.
8. **Mutación 1:** quitar la entrada `verificacion` devuelve `Verificación` a `otros` y pone en
   rojo la prueba exhaustiva.
9. **Mutación 2:** quitar la entrada `solicitud_soporte` devuelve `Solicitud Soporte` a `otros` y
   pone en rojo la prueba exhaustiva.
10. **Mutación 3 (posición):** mover cualquiera de las dos entradas a otro punto de la lista pone
    en rojo la prueba de la lista ordenada de ids.
11. `git diff --stat` del apply no contiene ningún fichero bajo `apps/desk/src`.
12. `npm test`, `npm run typecheck` y `npm run lint` en verde.
13. Barrido de citas de la regla de mutación 4 sobre `columns.ts`, `columns.test.ts`,
    `flujos.test.ts` y las dos specs, comprobado contra el fichero.

## Tareas de personas — fuera del recuento

No son casillas de `tasks.md` y **archivar no las da por hechas**.

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Comprobación visual en la aplicación: un ticket en `Verificación` y otro en `Solicitud Soporte` aparecen en su columna, en la posición de S-1, y `Otros` deja de enseñarlos | Una persona con acceso a la aplicación desplegada | `archive-report.md` de este cambio, como pendiente declarado |
| Respuesta a las preguntas de S-1, S-2 y S-3 | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia`, por la sesión que la recoja |
