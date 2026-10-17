# Informe de archivo — `cierre-f0-04-por-dictamen` (F0-04, `cierra: si`)

**Cobertura de la fila:** F0-04 queda cerrada con lo que ya estaba hecho —pruebas del motor y CI con `test`, `typecheck`
y `lint`—, y el staging sobre la VPS quedó retirado por dictamen de Gerencia (`decision/e013b-copia-pruebas`, 2026-09-21).

## 1. Lo que se archiva

| Commit | Qué |
|---|---|
| `1bac53e` | Planificación: medición de la fila, de la decisión y de las dos formas posibles |
| `3b51b91` | Verify PASS (0 críticos, 1 aviso, 2 sugerencias); W1 y S1 corregidos en sitio en la propuesta |
| este commit | Mudanza de la carpeta, `registro.test.ts:218-221` corregido en sitio y este informe |

Forma: un cambio nuevo, archivado con `tanda: F0-04` y `cierra: si`. `openspec/changes/F0-04/` se queda como está, con
su `cierra: no` (caso B: cierto de su fecha), porque dieciocho ficheros citan su ruta y cuatro de esas citas están en
`openspec/config.yaml`. R-4: este es el único cambio archivado con `tanda: F0-04` y `cierra: si`.

## 2. La prueba del recuento

`apps/desk/server/reconciliacion/registro.test.ts:218-221` fija la lista real de «en curso». Con la carpeta ya en
`archive/`, el caso `11f/05g` salió en rojo (1 de 23) porque esperaba OCHO con F0-04. Corregido en sitio: SIETE, sin
F0-04, y F0-04 entre las «cerradas por archivo»; el fichero conserva sus 248 líneas, y 23 de 23 en verde.
**Mutación del fichero vigilado** (regla de mutación 2): con `cierra: no` en la cabecera archivada, la prueba vuelve a
rojo; restaurada.

**Parte revisable, medida antes de aplicar:** las 3 líneas de `registro.test.ts` (3 inserciones y 3 borrados) más este
informe; por debajo de 800. No hay fusión de delta: el cambio no toca `openspec/specs/`.

## 3. Estado al cerrar

- Los cuatro códigos en una cadena, en este commit: test, typecheck, lint (165 avisos, igual que la partida) y
  detector de citas `--sha HEAD`.
- Barrido de la regla de mutación 4 sobre `registro.test.ts`: ninguna línea se movió; las citas a `:218-221` de otros
  cambios archivados son registros fechados (caso B).
- Sin código de producción, sin `openspec/specs/`, sin el maestro (M11.5 ya lo recoge,
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3503`) y sin ficheros de Supervisión.

## 4. Tareas de personas — archivar NO las da por hechas

| Qué | Dueño |
|---|---|
| Marcar F0-04 como cerrada en la fila del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:68`) y actualizar la nota de `:347` | Supervisión |
| Anotar en la consecuencia (2) de `decision/e013b-copia-pruebas` que el registro está hecho por este cambio | Supervisión |
