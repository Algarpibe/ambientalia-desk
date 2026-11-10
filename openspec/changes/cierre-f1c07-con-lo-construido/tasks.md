# Tareas: cierre de F1C-07 con lo construido

Cambio documental, sin código de producción ni delta de specs. Tres intentos del registro: planificación, verify y
archivo. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir la fila F1C-07 (R01.1 con sus dos filas del §4.5, R01.2, R01.3 y R01.4, sin remanente ni nota numerada), el
  cambio archivado con `tanda: F1C-07`, la pieza que construyó F1C-08 y las decisiones de respaldo; escribir en `proposal.md`
  el contraste pieza a pieza, con ruta y línea, y el requisito vivo de cada pieza construida.
- [x] 1.2 Cabecera de siete campos: `tanda: F1C-07`, `cierra: si`, `origen_cabecera: declarada`, y `maestro` con «M9.1», la
  fuente de la fila de la R01.1 que el barrido cruza (S-1).
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y el detector de citas
  (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) con código 0.

## 2. Verify

- [ ] 2.1 Contrastar cada cita de `proposal.md` y de este fichero contra su fichero, en su ancla: qué afirma, extremo inicial y
  final.
- [ ] 2.2 Comprobar que ninguna pieza de la fila queda sin construir y archivar salvo las que saca una decisión (la foto del
  embalado y la guarda de salida, a F1B-17; la firma con imagen, a F1E-04; la firma «Revisó», a F1E-04 por
  `decision/roles-validacion-informe`) y las dos que quedan fuera por supuesto, no por decisión: el checklist que revisa los
  puntos del diagnóstico y alimenta el informe de salida (S-5) y el indicador de retrabajo (S-6); y que lo construido está
  detrás del interruptor que `decision/e248-adelanto-f1c` (2) mantiene apagado (S-4). **Si S-5 no se acepta, o queda alguna
  pieza más, parar sin archivar.**
- [ ] 2.3 Comprobar que cada requisito de «Las piezas, en las specs vivas» existe en la línea citada y dice lo que la tabla le
  atribuye.
- [ ] 2.4 Comprobar que el cambio no toca código de producción, `openspec/specs/` ni ficheros de Supervisión
  (`git diff --name-only` contra `9223318f`).
- [ ] 2.5 Escribir `verify-report.md` con veredicto; los cuatro códigos con código 0.

## 3. Archivo

- [ ] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md` y las líneas de
  `apps/desk/server/reconciliacion/registro.test.ts`) con `git diff --shortstat --no-renames`; si supera 800, parar. Abrir el
  intento con un techo de dos veces la carpeta más 800.
- [ ] 3.2 Mover la carpeta a `openspec/changes/archive/<fecha>-cierre-f1c07-con-lo-construido/`; las rutas a la propia carpeta que
  sean históricas se conservan (caso B).
- [ ] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en la prueba 11f/05g
  (`apps/desk/server/reconciliacion/registro.test.ts:220` en `9223318f`: F1C-07 ya no está «en curso»). Si no se pone roja,
  parar: la prueba no distingue.
- [ ] 3.4 Corregir en sitio, sin mover líneas y conservando el CRLF (con `perl`, no con `sed`):
  `apps/desk/server/reconciliacion/registro.test.ts:218` en `9223318f` (de SEIS a CINCO; F1C-07 sale de «con» y entra entre las
  cerradas por archivo del título, «por cierre-f1c07-con-lo-construido, cierra: si, tras control-calidad-liberacion, cierra: no»)
  y `apps/desk/server/reconciliacion/registro.test.ts:220` en `9223318f` (la lista queda `['F1B-09', 'F1F-01', 'F1F-02',
  'F1F-03', 'F1F-05']` y se añade `toContain('F1C-07')` en «cerradas por archivo»); verde. Molde: `8647518b`.
- [ ] 3.5 Correr `npm run reconcile` y comprobar que F1C-07 pasa a «cerradas por archivo», que no entra en «cerradas sin fuente
  declarada en la R01.1» (tiene fila) ni en «marcadas sin verificar» (S-1), y que «en curso» baja de seis a cinco; restaurar
  `docs/sdd/RECONCILIACION.md` sin commitearlo.
- [ ] 3.6 Barrido de la regla de mutación 4 sobre `apps/desk/server/reconciliacion/registro.test.ts` y pase de abreviadas; las
  citas de este cambio a las líneas de antes de corregir quedan ancladas en `9223318f`.
- [ ] 3.7 Escribir `archive-report.md` con la línea de R-1 (qué parte de la fila cubrió y qué dejó fuera, con S-5 dicho en ella),
  los intentos y la lista para Supervisión de `proposal.md`.
- [ ] 3.8 Cuatro códigos con código 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas, y **archivar no las da por hechas** (regla del ciclo 1). Las ya hechas no se listan: la línea de
`CONTROL_CALIDAD_LIBERACION` en el fichero de ejemplo de entorno, que pedía W-1
(`openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:129`), la añadió `812ec0c4`; quién firma con el
Coordinador Técnico vacante lo respondió `decision/f1c07-firma-control-calidad` (`openspec/config.yaml:5113` en `9223318f`); y el
destino de la foto, la guarda y la imagen de firma de D11
(`openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:133`) lo fijó `decision/e248-adelanto-f1c` (3)
(`openspec/config.yaml:5734` en `9223318f`); la rama está fusionada (`afccdcf0`).

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Situar el checklist que revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida, o confirmar S-5 (F1E-03) | Gerencia | Punto abierto con dueño (R-3) hasta que lo confirme | `proposal.md`, «Conclusión de la medida» y S-5; `openspec/config.yaml:1891` en `9223318f` |
| Asignar el cargo de permiso al Coordinador Técnico o, mientras no lo haya, comprobar el del Director Técnico y el Especialista técnico, antes de encender | Administrador de la aplicación | Antes de encender | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:131` y `DEPLOY.md:795-796` |
| Encender `CONTROL_CALIDAD_LIBERACION`, junto con `DECISIONALES_POR_CARGO` y no antes del 14/12/2026 | Persona con acceso a producción, por orden de Gerencia | Enero de 2027 (`openspec/config.yaml:5733` en `9223318f`) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:130` y `DEPLOY.md:794-795` |
| Probar en la aplicación con el interruptor apagado y encendido; que esté hecho es hipótesis | Gerencia (ronda final) | La lista acumulada de pruebas en la aplicación | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:134` |
| Decidir en qué lista entran los S-1 a S-18 de `control-calidad-liberacion` | Supervisión | La lista semanal (E-237) | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:132` y `docs/sdd/Supuestos_semana_2026-11-02.md:226` |
| Actualizar M9.1, M1.7 y el §3.3 del maestro al encender, y la fila de la foto y la guarda | Supervisión → Gerencia | El expediente siguiente | `proposal.md`, «Para Supervisión — no se editan en la rama», punto 4 |
| Revisar S-1 a S-7 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal | `proposal.md`, «Supuestos reversibles» |
