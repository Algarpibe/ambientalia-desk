# Delta para transitions-soporte-remoto

## MODIFIED · «Fuera de alcance», una línea en sitio

No cambia ningún requisito. Cambia UNA línea de la sección «Fuera de alcance» de la spec viva, la
`openspec/specs/transitions-soporte-remoto/spec.md:322` en `87510cbf`, por UNA línea. Ninguna otra línea del fichero cambia
ni se mueve. Es la tarea de persona T-P4 de `mapa-blueprint-tres-flujos`
(`openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/tasks.md:274`): la línea remite a F1B-09 dos piezas que ya
están hechas.

Línea viva, en `87510cbf`:

    - **Columna propia de tablero para `Solicitud Soporte`** y mapa generado de los tres flujos → F1B-09.

Línea nueva:

    - **Columna propia de tablero para `Solicitud Soporte`** → hecha por F1B-08 (`columna-propia-dos-estados`, fusión `ae2e5223`); **mapa generado de los tres flujos** → hecho por F1B-09 (`mapa-blueprint-tres-flujos`, fusión `60b171fb`).

Lo que la sostiene: la columna `solicitud_soporte` está en `packages/shared/src/columns.ts:15`, y el mapa generado cubre los
tres flujos desde `CATALOGO_POR_FLUJO` (`packages/shared/src/mapaBlueprint.test.ts:298`).
