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
