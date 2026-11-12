# Tareas: cierre de F1B-09 con el repaso de la auditoría

Cambio documental con una edición de código, la de (c). Cuatro intentos del registro: planificación, apply, verify y archivo.
Cada intento se asienta sólo con TODOS sus códigos en 0 (`design.md`, D6) y con su medida por debajo de su techo.

## 1. Planificación

- [x] 1.1 Medir la fila (R01.1, R01.4, su remanente y M11.6), los cinco cambios archivados con `tanda: F1B-09` y la condición de
  la decisión (todas las filas de 1B de antes del corte cerradas salvo F1B-09); escribirlo en `proposal.md` con ruta y línea.
- [x] 1.2 Cabecera de siete campos con `tanda: F1B-09`, `cierra: si`, `toca_maestro: si` y `origen_cabecera: declarada`.
- [x] 1.3 Las dos deltas de (b), una línea por una línea, y comprobar que la «línea viva» de cada una es la de la spec viva.
- [x] 1.4 `design.md` y este fichero, con la guarda de `registro.test.ts` prevista en el archivo (tarea 4.3).
- [x] 1.5 Cinco códigos en 0: `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165`, commit y detector.

## 2. Apply — el repaso

- [x] 2.1 Medir con el guion de `design.md` (D2) las transiciones y los estados por flujo, sobre `main` y sobre `0d1a40b`, y
  escribir las dos cifras con la prueba que fija cada una.
- [x] 2.2 Contrastar con `main` cada afirmación de estado de la auditoría, de §1 a §7 y su resumen de §9, con evidencia en ruta y
  línea de hoy.
- [x] 2.3 Contrastar punto a punto lo que la auditoría declaró no haber hecho
  (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:323-339`).
- [x] 2.4 Escribir la lista de discrepancias, cada una con ruta y línea y UN destino (bandeja, F1B-16, F1B-17 o F1B-20). **Si
  alguna no cabe en ninguno, parar y decirlo: es una pregunta de alcance.**
- [x] 2.5 Escribir la lista para Supervisión, con el texto nuevo para M11.6.
- [x] 2.6 `apply-progress.md` con la evidencia; cinco códigos en 0.

## 3. Verify

- [x] 3.1 Contrastar cada cita de `proposal.md`, `design.md`, las deltas, este fichero y el repaso contra su fichero, en su
  ancla: qué afirma, extremo inicial y final por separado.
- [x] 3.2 Que un agente de sólo lectura, que no escribió el repaso, compruebe por su cuenta cada discrepancia y cada fila del
  contraste contra `main`.
- [x] 3.3 Comprobar que ninguna discrepancia queda sin destino y que el cambio no toca código de producción, `openspec/specs/`,
  la auditoría del 05/10 ni ficheros de Supervisión (`git diff --name-only` contra `87510cbf`).
- [x] 3.4 Escribir `verify-report.md` con veredicto; cinco códigos en 0.

## 4. Archivo

- [ ] 4.1 Medir antes de aplicar la parte revisable (la fusión de las deltas, las líneas de `registro.test.ts` y
  `archive-report.md`); si supera 800, parar. Abrir el intento con un techo de dos veces la carpeta más 800.
- [ ] 4.2 Mover la carpeta a `openspec/changes/archive/<fecha>-cierre-f1b09-repaso-auditoria/`.
- [ ] 4.3 **Guarda que cuenta el árbol.** Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en
  la prueba 11f/05g (`apps/desk/server/reconciliacion/registro.test.ts:220` en `87510cbf`: F1B-09 ya no está «en curso»). Si no
  se pone roja, parar: la prueba no distingue.
- [ ] 4.4 Corregir en sitio, sin mover líneas y conservando sus finales de línea,
  `apps/desk/server/reconciliacion/registro.test.ts:218` en `87510cbf` (de CINCO a CUATRO, con F1B-09 entre las cerradas por
  archivo del título) y `apps/desk/server/reconciliacion/registro.test.ts:220` en `87510cbf` (la lista sin `'F1B-09'` y
  `toContain('F1B-09')` en «cerradas por archivo»); verde. Molde: `8b3c4bac`.
- [ ] 4.5 Fusionar las dos deltas por script (`design.md`, D3): una línea por una línea, mismo número de líneas, CRLF, y `cmp`
  de lo anterior y lo posterior.
- [ ] 4.6 Correr `npm run reconcile` y comprobar que F1B-09 pasa a «cerradas por archivo» y a «cerradas sin fuente declarada en
  la R01.1», no a «marcadas sin verificar», y que «en curso» baja de cinco a cuatro; restaurar `docs/sdd/RECONCILIACION.md`
  sin commitearlo.
- [ ] 4.7 Barrido de la regla de mutación 4 sobre `apps/desk/server/reconciliacion/registro.test.ts`,
  `openspec/specs/transitions-soporte-remoto/spec.md` y `openspec/specs/transitions-equipo-nuevo/spec.md`, con pase de
  abreviadas y sin excluir `archive/`.
- [ ] 4.8 Escribir `archive-report.md` con la línea de R-1, los intentos, la lista de discrepancias y la lista para Supervisión.
- [ ] 4.9 Cinco códigos en 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas, y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Anotar con fecha 12/11, sin reescribirlas, las tres decisiones que mantenían el `cierra: no`: `decision/orden-tres-tandas-04-10` (2), `decision/e222-mapa-equipo-nuevo-soporte-remoto` (5) y `decision/f1b04-recuento-no-retiene` (5) | Supervisión | `openspec/config.yaml`, en `main` | `decision/f1b09-epica-1b-antes-del-corte`; `proposal.md`, «Intención» |
| Registrar en la bandeja las discrepancias del repaso con destino «bandeja» y poner al día las trazas de E-223, E-226, E-090 y E-227 | Supervisión | `docs/sdd/ENTRADA.md` | `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`, lista para Supervisión |
| Llevar al expediente el texto nuevo de M11.6 y pegarlo en el `.docx` | Supervisión, y Gerencia para el `.docx` | `docs/sdd/R08.4_Expediente_de_cambios.md` y el maestro | `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md`, lista para Supervisión |
| Poner al día el plan R01.4 al final de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`, y regenerar `docs/sdd/RECONCILIACION.md` | La sesión de construcción, en `main`, tras fusionar | `main` | Encargo de la tanda |
| Revisar los supuestos S-1 a S-6 de este cambio en la lista semanal (E-237) | Gerencia | La lista semanal | `proposal.md`, «Supuestos reversibles» |
