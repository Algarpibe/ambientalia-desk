# Tareas: cierre de F0-04 por dictamen

Cambio documental, sin código de producción ni spec delta. Tres intentos del registro: planificación, verify y
archive. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir `openspec/changes/F0-04/proposal.md` (cabecera `:1-9`, pendiente en `:16`), `decision/e013b-copia-pruebas`
  y las filas F0-04 de la R01.4 (`:68`, `:347`) y de la R01.1 (`:128`, `:487`); escribirlo en `proposal.md` con ruta y línea.
- [x] 1.2 Cabecera de siete campos: `tanda: F0-04`, `cierra: si`, `maestro: ["M11.5"]` (la fuente de `…R01.1.md:487`).
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint` y el detector de citas `--sha HEAD` con código 0.

## 2. Verify

- [ ] 2.1 Contrastar cada cita de `proposal.md` contra el fichero (qué afirma, extremos inicial y final).
- [ ] 2.2 Comprobar que el cambio no toca código de producción, `openspec/specs/`, `openspec/changes/F0-04/` ni ficheros
  de Supervisión.
- [ ] 2.3 Escribir `verify-report.md` con veredicto; los cuatro códigos con código 0.

## 3. Archive

- [ ] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md`, las líneas de `registro.test.ts` y
  `RECONCILIACION.md`); si supera 800, parar.
- [ ] 3.2 Mover la carpeta a `openspec/changes/archive/2026-10-17-cierre-f0-04-por-dictamen/`.
- [ ] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en `:220` (F0-04 ya no
  está «en curso»).
- [ ] 3.4 Corregir en sitio `registro.test.ts:218-221` (SIETE, sin F0-04, y F0-04 por archivo), sin mover líneas; verde.
- [ ] 3.5 Regenerar `docs/sdd/RECONCILIACION.md`: F0-04 en «cerradas por archivo» (hipótesis: 22 por archivo, 7 en curso).
- [ ] 3.6 Barrido de la regla de mutación 4 sobre `registro.test.ts`.
- [ ] 3.7 Cuatro códigos con código 0; `git show --numstat` del commit de archivo con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Marcar F0-04 como cerrada en la fila del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:68`, y la nota de `:347`) | Supervisión | `archive-report.md` de este cambio |
| Anotar en la consecuencia (2) de `decision/e013b-copia-pruebas` que el registro ya está hecho | Supervisión | `archive-report.md` de este cambio |
