# Apply-progress — ampliacion-contrato (F1B-11, `cierra: si`)

## Lote 1 · regla pura en `shared` (tareas 1.1 a 1.10 hechas; 1.11 a 1.16 son del orquestador)

Partida: `6d42654`. `wc -l` de partida: `packages/shared/src/contratos.ts` 242, `packages/shared/src/contratos.test.ts` 236.
Final: 298 y 367. Sólo se añadió al final (+56 y +131); `git diff -U0` muestra dos hunks de pura adición, ninguna línea previa movida.

**Rojo → verde (strict TDD).** Se escribió primero todo el bloque de pruebas (1.2 a 1.7) y se corrió: `35 failed | 111 passed`
(`TypeError: ... is not a function`, funciones inexistentes). Después el código (1.8): `146 passed`. Con la prueba de TZ de M10, `147 passed`.
Pruebas añadidas: 36 (111 → 147).

| Tarea | Rojo visto | Verde |
|---|---|---|
| 1.2 `topeAmpliacion` (4 bordes) | fallo de función inexistente | verde |
| 1.3 `motivoNoAmpliable` (tabla, reloj 03:00Z/05:00Z) | idem | verde |
| 1.4 pares de posición + par no activable comentado | idem | verde |
| 1.5 `cabeAmpliacion` + propiedad contra `motivoNoAmpliable` | idem | verde |
| 1.6 `ampliacionDelCuerpo` (motivo recortado, 5.000 caracteres) | idem | verde |
| 1.7 `fechaFinOriginal` (primera fila) | idem | verde |

**Mutaciones (1.9), cada una restaurada.** Todas ponen rojo salvo la nota de M10b.
M4a `plazoCerrado` primero: 3 rojas. M4b motivo antes que la fecha: 6. M9a tope `-12-30`: 10. M9b tope 01/01 siguiente: 11.
M10a año de `hoy`: 1. M11 `<=`→`<`: 5. M12 `>`→`>=` tope: 5. M13 `>`→`>=` plazo: 2. M19 `cabeAmpliacion` siempre `true`: 1. M17 original desde la última fila: 1.
**M10b** (`new Date(fechaFin).getFullYear()`) **sobrevivió**: `vitest.config.ts` fija `TZ=UTC` y en UTC es equivalente. Se añadió una prueba que
cambia `process.env.TZ` a `America/Bogota` y restaura; con ella M10b da 1 roja.

**Líneas reales** (leídas del fichero editado, `packages/shared/src/contratos.ts`): `motivoNoAmpliable` en `:264`, `cabeAmpliacion` en `:275`,
`ampliacionDelCuerpo` en `:283`, `fechaFinOriginal` en `:296`, `MENSAJES_AMPLIACION` en `:247`, `topeAmpliacion` en `:259`.

**Desviaciones del diseño:** ninguna en firmas, mensajes u orden. Dos menores: (1) el segundo `import` de `@ambientalia/shared` va en el bloque
final del fichero de pruebas (para no tocar la línea 2); (2) prueba extra de zona horaria (arriba), no listada en las tareas.
Comprobado: `npx eslint` sobre los dos ficheros sin avisos.

## Lote 2 · esquema, `PUBLIC_TABLES`, guardianes y capa de datos (tareas 2.1 a 2.11 hechas; 2.12 a 2.17 son del orquestador)

Partida: `695ed23`. `wc -l` de partida y final: `schema.sql` 768 → 782 (+14, todo al final salvo la línea 559 en sitio); `migrate.ts` 131 → 131;
`migrate.test.ts` 819 → 858 (+39, sólo el bloque nuevo al final); `db/contratos.ts` 115 → 158 (+43 al final; líneas 2, 3 y 8 en sitio); `db/contratos.test.ts` 163 → 244 (+81 al final; las líneas 5 y 9 ganan nombres de importación en sitio).
Ninguna inserción en medio de `migrate.test.ts`: los hunks por encima de la línea 819 son todos de una línea (o cinco líneas sustituidas por cinco en 282-286).

**Rojo → verde (strict TDD).** Primero 2.2 (bloque nuevo), 2.3 (guardianes en sitio) y 2.4 (pruebas de datos): `14 failed | 71 passed`
(4 del bloque nuevo, 3 guardianes en sitio, 7 de la capa de datos con funciones inexistentes). Después `schema.sql`, `migrate.ts` y `db/contratos.ts`: `85 passed`
(un ajuste de la prueba: pg-mem devuelve `contrato_id` como número, no cadena). El guardián de clasificación sólo se pone rojo por mutación (con la tabla aún sin crear nada la contradice).

**Hipótesis pg-mem (2.8): confirmada.** `fecha_fin = $3` con texto `YYYY-MM-DD` funciona sin `::date`: el caso de carrera lanza el error y el normal escribe. No hizo falta el respaldo.

**Mutaciones (2.9), cada una restaurada (`cmp` de los tres ficheros contra la copia).** M5 quitar `public.` del `CREATE` de `schema.sql`: 2 rojas (clasificación, posición del bloque nuevo).
M6 mover el `CREATE` antes de la siembra de accesorios: 2 rojas (bloque nuevo y el guardián de las líneas 794-798 de `migrate.test.ts`). M7a sin `NOT NULL` en `fecha_anterior`: 1 roja. M7b sin `NOT NULL` en `ampliado_por`: 1 roja.
M8 fuera de `PUBLIC_TABLES`: 3 rojas (clasificación, recuento, contiene). M15 sin `AND fecha_fin = $3`: 1 roja (carrera). M16a sin `INSERT`: 5 rojas. M16b `INSERT` antes del `UPDATE`: 3 rojas (carrera, estructura). M17 `ORDER BY id DESC`: 2 rojas.
Ningún superviviente.

**Líneas reales** (leídas de `apps/desk/server/db/contratos.ts` ya editado): el `UPDATE` condicionado en `:133` y `throw new ContratoCambiadoError` en `:136` (alimentan la fila 5 de la regla 13). `ampliarContrato` abre en `:130` y `ampliacionesDelContrato` en `:146`.

**Desviaciones del diseño:** ninguna en SQL, firmas ni orden. Menores: (1) el comentario nuevo de `schema.sql` ocupa 14 líneas, no 16; (2) en `contratos.test.ts` el import de `@ambientalia/shared` va en la línea 5 tras `;` para no insertar líneas; (3) aviso de eslint heredado en `migrate.ts:6` (`any`), no es de este lote.

## Lote 3 · ruta y lectura ampliada (tareas 3.1 a 3.10 hechas; 3.11 a 3.16 son del orquestador)

Partida: `e75ed5c`. `wc -l` de `apps/desk/server/routes/contratos.ts`: 71 → 91 (+20, sólo la ruta nueva tras el informe; las líneas 5, 9, 21-22 y 33 en sitio, mismo número).
Fichero nuevo `apps/desk/server/routes/contratosAmpliar.test.ts`: 209 líneas (sin trackear). Hunks: `-5`, `-9`, `-21,2`, `-33` y `+71,20`. `routes/contratos.test.ts` NO se tocó y sigue verde (la ficha usa `toMatchObject`; el espía no se rompe).

**Rojo → verde (strict TDD).** Primero el fichero de pruebas completo (21 casos): `18 failed | 3 passed` (la ruta no existía; los 3 verdes son coincidencias de 401/404). Después el código: `21 passed`.
Dos ajustes de la prueba, no del código: pg-mem devuelve `fecha_fin` como `Date` en SQL directo (se lee con `contratoPorId`) y el título de la matriz.

**Mutaciones (3.8), cada una restaurada (`cmp` contra la copia; `git diff --stat` igual antes y después).**
M1 el `403` antes del `404`: 2 rojas (A↔B e id no numérico). M2 el cuerpo antes del permiso: 1 roja (B↔C). M3 escribir antes de validar: 3 rojas (C↔D, fecha antes que motivo, bordes de año).
Mperm sin permiso: 5 rojas. M14 `hoy` por defecto con `new Date().toISOString()`: 1 roja. M18 `ampliadoPor` del cuerpo: 1 roja. M20 sin `ampliaciones` o sin `fechaFinOriginal` en la ficha: 2 rojas cada una.
Una primera M3 mal escrita (validaba ANTES de escribir) no era mutación y dio verde: se rehízo y quedó roja. Ningún superviviente.

**Líneas reales** (`apps/desk/server/routes/contratos.ts` ya editado): `404` paso 1 en `:78`, `403` paso 2 en `:79`, `422` paso 3 en `:81` (guarda; la llamada a `ampliacionDelCuerpo` en `:80`),
`409` paso 4 en `:87` (el `catch` de `ContratoCambiadoError`; el `ampliarContrato` en `:83`); la ficha en `:33`. La ruta abre en `:74` (comentario en `:72-73`).
`DELETE` sobre `contrato_ampliaciones`: ninguna sentencia; sólo dos comentarios que dicen «sin DELETE» (`db/contratos.ts:8` y `:119`).

**Desviaciones del diseño:** ninguna en escalera, mensajes ni éxito `200`. Menor: la ficha sirve las ampliaciones con una consulta más (`ampliacionesDelContrato`).
Comprobado por mí: `npx vitest run apps/desk/server/routes` exit 0 (264 pruebas); `npm run typecheck` exit 0.
