# Tareas: cierre de F1B-08 con lo construido

Cambio documental, sin código de producción ni spec delta. Tres intentos del registro: planificación,
verify y archive. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir la fila F1B-08 del plan R01.4, los cinco cambios archivados con `tanda: F1B-08` y las cuatro
  decisiones de respaldo; escribirlo en `proposal.md` con ruta y línea.
- [x] 1.2 Cabecera de siete campos: `tanda: F1B-08`, `cierra: si`, `maestro` con los pasajes de la fila.
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint` y el detector de citas
  (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) con código 0.

## 2. Verify

- [x] 2.1 Contrastar cada cita de `proposal.md` contra el fichero (qué afirma, extremos inicial y final).
- [x] 2.2 Comprobar que el cambio no toca código de producción, `openspec/specs/` ni ficheros de Supervisión.
- [x] 2.3 Escribir `verify-report.md` con veredicto; los cuatro códigos y el detector con código 0.

## 3. Archive

- [ ] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md`, la línea de `registro.test.ts` y
  `RECONCILIACION.md`); si supera 800, parar.
- [ ] 3.2 Mover la carpeta a `openspec/changes/archive/2026-10-17-cierre-f1b08-con-lo-construido/`.
- [ ] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en `:220`
  (F1B-08 ya no está «en curso»).
- [ ] 3.4 Corregir en sitio `registro.test.ts:218-220` (OCHO, sin F1B-08), sin mover líneas; verde.
- [ ] 3.5 Regenerar `docs/sdd/RECONCILIACION.md` con `npm run reconcile`: F1B-08 en «cerradas por archivo».
- [ ] 3.6 Barrido de la regla de mutación 4 sobre `registro.test.ts` y pase de abreviadas.
- [ ] 3.7 Cuatro códigos y detector con código 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Situar el destino de E-198 («un cambio posterior dentro de F1B-08»), que deja de existir con la fila cerrada | Gerencia, por Supervisión | `archive-report.md` de este cambio |
| Marcar F1B-08 como cerrada en la fila del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:88`) y quitar «pendiente: vía de registro del cierre de F1B-08» de `decision/f1b08-cierre-sin-capturas` | Supervisión | `archive-report.md` de este cambio |
| Anotar en F1F-03 cada vista, columna o filtro de Zoho Desk que falte, y corregirlo antes del 09/12 | Cada persona que usa Zoho Desk | `decision/f1b08-cierre-sin-capturas` (1) |
