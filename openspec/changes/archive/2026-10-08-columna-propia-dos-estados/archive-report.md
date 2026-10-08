# Archive · `columna-propia-dos-estados` (F1B-08, `cierra: no`)

**Fecha:** 2026-10-08 · **Rama:** `columna-propia-dos-estados` · **Partida:** `7a2b1c8` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-08 cubre, en una línea:** los estados `Verificación` y `Solicitud Soporte` ganan columna propia en el tablero
y dejan de caer en `Otros`. **Deja fuera** la paridad de vistas de listado y ficha con Zoho Desk, que tiene plazo 2026-10-16
(`decision/p4-vistas-equivalentes-zoho`), y con ella el cierre de la fila; por eso declara `cierra: no`.

## Qué decisión construye

`decision/e225-columna-propia-dos-estados` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06: «Columna propia
dentro de F1B-08 si cuesta menos de medio día; si no, después del corte.» **La condición se cumple, medida:** el apply fueron 109 líneas
y no se tocó ningún `.tsx`.

## Qué quedó construido

- **Dos entradas en `COLUMNS`**: `solicitud_soporte` (`packages/shared/src/columns.ts:15`) y `verificacion`
  (`packages/shared/src/columns.ts:20`). Cada una va en la misma línea física que su vecina anterior, con un comentario al final de la
  línea: el fichero conserva sus 47 líneas y ninguna cita por línea se desplaza.
- **Posición, supuesto S-1** (la decisión no la fija): `Solicitud Soporte` junto a `Ticket creado`, porque los dos son estados de
  nacimiento (`packages/shared/src/flujos.ts:139`); `Verificación` tras `En Proceso`, su único origen
  (`packages/shared/src/transitions.ts:357`).
- **Pruebas invertidas en sitio**: `packages/shared/src/flujos.test.ts:125-128` y `packages/shared/src/flujos.test.ts:204-206`, y la
  lista ordenada de ids de `packages/shared/src/columns.test.ts:6-11`. `flujos.test.ts` conserva 258 líneas.
- **Prueba exhaustiva nueva**, al final de `packages/shared/src/columns.test.ts` (líneas 42 a 58): una tabla con la columna de los 23
  estados antes del cambio y siete aserciones, de la (a) a la (g). La (b) fija que sólo esos dos estados cambian de columna; la (e), que
  el único estado del registro que cae en `Otros` es `Finalizado`.
- **Dos requisitos MODIFIED**, RQ-EN-07 y RQ-SR-03, reescritos en sitio: 17 y 38 líneas, las mismas que tenían.
- No se tocó `apps/desk/src`, ni `packages/shared/src/estados.ts`, ni esquema, ni variables de entorno. El cliente deriva de la lista
  (`apps/desk/src/board.ts:7`, `apps/desk/src/board.ts:9`), así que no hay decisión nueva en el navegador y la tabla de la regla 13 no aplica.

## Intentos

| # | Unidad | Commits | git | registro |
|---|---|---|---|---|
| — | Planificación (fuera de intento) | `3ac1b91` | 451 | — |
| 1 | Apply, lote único | `61b251b` | 109 | 109 |
| 2 | Verify (PASS con avisos) | `0782596` | 83 | 83 |
| 3 | Remediación de supervivientes | `7727557` | 8 | 8 |
| 4 | Archivo | el commit de este informe | 1.287 (parte revisable: 125) | se lee al asentar |

Medida de cada intento: `git diff --shortstat --no-renames` contra el commit anterior, más lo nuevo sin trackear. Sin binarios.

## Fusión de los deltas

Por script (`fusiona.mjs`), casando por identificador. Dos bloques MODIFIED, los dos idénticos al delta tras fusionar, comprobado además
con `diff` bloque a bloque. `openspec/specs/transitions-equipo-nuevo/spec.md` sigue en 552 líneas y
`openspec/specs/transitions-soporte-remoto/spec.md` en 349: ninguna cita por línea a esas dos specs se desplaza. El título de RQ-EN-07
cambia («tiene columna propia en el tablero»); su identificador no.

## Verificación

- **Cuatro códigos sobre `7727557`**, en una sola cadena: `npm test` 0 (4.258 pasan, 7 saltadas), `npm run typecheck` 0, `npm run lint` 0
  (0 errores, 165 avisos), detector de citas 0.
- **Mapa estado → columna, independiente de la prueba** (agente de verify, sobre `7a2b1c8` y `61b251b`): de los 23 estados sólo difieren
  `Verificación` y `Solicitud Soporte`.
- **Mutaciones:** 4 del apply, 16 del verify y 6 del orquestador sobre el apply, todas restauradas. De las 16 del verify sobrevivieron
  dos, las etiquetas de las columnas nuevas; las cierra la aserción (g), y el orquestador repitió las dos contra ella: en rojo.
- **El verify formal es sobre `61b251b`.** Después sólo cambió una prueba (`7727557`), no producción; está en la adenda del informe.

## Citas

Ninguna línea citada se movió, así que el barrido fue de comprobación. Lo que queda, sin tocar:

- **Texto que deja de ser cierto en ficheros que la rama no toca** (para Supervisión, apartado 5.3 del paquete de despliegue de hoy):
  la consecuencia (1) de `decision/e225-columna-propia-dos-estados` en `openspec/config.yaml`, la entrada E-225 de `docs/sdd/ENTRADA.md`
  y el hallazgo B-4 de `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`.
- **Hipótesis, dato del agente de verify que el orquestador no releyó:** dos citas del cambio archivado
  `2026-09-29-blueprint-soporte-remoto` (en su `design.md` y su `tasks.md`) apuntan a la línea 15 de `columns.ts` para decir que
  `Solicitud Soporte` cae en `Otros`. Son registros fechados (caso B) y no se tocan.

## Tareas de personas — fuera del recuento

Archivar no las da por hechas.

| Qué | Dueño | Destino |
|---|---|---|
| Comprobación visual en la aplicación desplegada: un ticket en cada uno de los dos estados aparece en su columna | Persona con acceso a la aplicación | Apartado 5.3 del paquete de despliegue de hoy |
| Respuesta a S-1 (posición), S-2 (etiqueta) y S-3 (columnas vacías visibles si se desactiva «ocultar vacías») | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Poner al día los tres textos del apartado «Citas» | Supervisión | Los propios ficheros, en `main` |
