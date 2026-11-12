# Diseño: cierre de F1B-09 con el repaso de la auditoría

Cambio documental con una sola edición de código, la prueba de (c). No toca código de producción.

## D1 · El repaso es un documento nuevo, y la auditoría no se edita

`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` es un registro fechado sobre `0d1a40b` y lo citan quince ficheros; editarlo
volvería falsas sus citas (caso B de la regla de mutación 4). El repaso va en `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`, con
esta forma:

1. **Cabecera:** commit medido (`87510cbf`), árbol auditado (`0d1a40b`), decisión de respaldo por su clave.
2. **Las cifras:** transiciones y estados por flujo, hoy y en el árbol auditado, con la prueba que fija cada una.
3. **El contraste, apartado por apartado** de la auditoría (§1 a §7 y el resumen de §9): qué afirmó, qué dice `main`, evidencia
   con ruta y línea, y si discrepa. Lo que coincide y lo superado con su registro al día se dicen en una fila y no pasan a la
   lista (supuesto S-1).
4. **Lo que la auditoría declaró no haber hecho** (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:323-339`), punto a punto:
   si el repaso lo hace, si sigue igual y por qué.
5. **La lista de discrepancias**, numerada D-1 a D-n. Cada una: qué discrepa, ruta y línea de hoy, y UN destino.
6. **La lista para Supervisión**, con el texto nuevo para M11.6.

## D2 · Cómo se mide, y qué lo fija

Un guion de `tsx` que importa los tres catálogos, las dos transiciones sin botón y `ESTADOS`, y calcula por flujo lo mismo que el
§0 de la auditoría: transiciones, estados derivados de `from`/`to`, estados sin salida, alcanzabilidad desde el nacimiento,
estados que no alcanzan un terminal, estados dentro de un ciclo, campos obligatorios y áreas. Se corre sobre el árbol de hoy y
sobre `0d1a40b` exportado con `git archive`, para comparar con el mismo método y no con las cifras escritas.

No se versiona, como el de la auditoría: los hechos los fijan ya pruebas del repositorio, y el repaso cita la prueba de cada
cifra. Las principales: `packages/shared/src/invariantesGrafo.test.ts:50` (40 de servicio sobre 23 estados),
`packages/shared/src/invariantesGrafo.test.ts:172` (52 en la unión), `packages/shared/src/invariantesGrafo.test.ts:200` (las
siete de equipo nuevo) y `packages/shared/src/invariantesGrafo.test.ts:240` (las cinco de soporte remoto).

## D3 · La pieza (b): una línea por una línea, por delta, fusionada por script

Cada delta escribe la línea viva y la nueva. Al archivar, un guion sustituye la línea N de la spec viva por la nueva y comprueba:

- que la línea N era exactamente la «viva» de la delta;
- que el fichero conserva su número de líneas y su final CRLF;
- que todo lo anterior y lo posterior a la línea N es idéntico byte a byte al de partida (`cmp` sobre `head` y `tail`).

Se hace con `perl -i`, no con `sed -i`, que en Git Bash pasa el fichero a LF.

## D4 · La pieza (c): rojo primero, en el archivo

El rojo sólo existe cuando la carpeta del cambio está en `openspec/changes/archive/` con `cierra: si`: hasta entonces F1B-09 sigue
«en curso» por sus cinco cambios con `cierra: no`, y la prueba está verde. Por eso el rojo se ve en el intento de archivo,
como en `cierre-f1b13-con-lo-construido`:

1. Mover la carpeta.
2. Correr `apps/desk/server/reconciliacion/registro.test.ts` y ver UN fallo, el de la prueba 11f/05g, con F1B-09 como única
   diferencia. Si no se pone roja, se para: la prueba no distingue.
3. Corregir en sitio la 218 (el título: de CINCO a CUATRO, y F1B-09 entre las cerradas por archivo) y la 220 (la lista sin
   `'F1B-09'` y `toContain('F1B-09')` en «cerradas por archivo»), sin mover líneas y conservando el CRLF; verde.

Es una guarda que cuenta el árbol: su cambio es por construcción, no un fallo, y por eso está previsto en `tasks.md`.

## D5 · `strict_tdd` y regla 13

- **`strict_tdd`:** la única pieza con código es (c), y su rojo lo produce el archivo, no una prueba escrita antes (D4). El
  repaso y las deltas son documentos: no tienen prueba que escribir primero, y el apply lo declara así en vez de fabricar una.
- **Regla 13:** el cambio no toca `apps/desk/src`, así que no hay decisiones del cliente que enumerar.

## D6 · Lo que se comprueba en cada intento

`npm test` (con su log entero en el scratchpad), `npm run typecheck`, `npm run lint -- --max-warnings 165`, el commit y el
detector de citas (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`), en una sola cadena con `set -o pipefail`
y `&&`. La medida del intento es `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin
trackear. El detector excluye `openspec/changes/archive/`, así que las citas del `archive-report.md` se contrastan con un guion
propio que lee cada extremo en su ancla.
