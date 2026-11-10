# Tareas: cierre de F1B-13 con lo construido

Cambio documental, sin código de producción ni delta de specs. Tres intentos del registro: planificación, verify y
archivo. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir la fila F1B-13 (R01.2, R01.4, su remanente y la nota 4), los tres cambios archivados con `tanda: F1B-13` y las
  decisiones de respaldo; escribir en `proposal.md` el contraste pieza a pieza, con ruta y línea, y el requisito vivo de cada
  pieza construida.
- [x] 1.2 Cabecera de siete campos: `tanda: F1B-13`, `cierra: si`, `origen_cabecera: declarada`, y `maestro` con el de los
  cambios archivados de la fila (S-1).
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y el detector de citas
  (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) con código 0.

## 2. Verify

- [x] 2.1 Contrastar cada cita de `proposal.md` y de este fichero contra su fichero, en su ancla: qué afirma, extremo inicial y
  final.
- [x] 2.2 Comprobar que ninguna pieza de la fila queda sin construir y archivar salvo la que saca una decisión (el envío
  físico, a F1B-16) y la que queda fuera por el supuesto S-4, no por decisión (la carga en la ISO 14224); si queda alguna
  más, parar sin archivar.
- [x] 2.3 Comprobar que cada requisito de «Las piezas, en las specs vivas» existe en la línea citada y dice lo que la tabla le
  atribuye.
- [x] 2.4 Comprobar que el cambio no toca código de producción, `openspec/specs/` ni ficheros de Supervisión
  (`git diff --name-only` contra `93c29225`).
- [x] 2.5 Escribir `verify-report.md` con veredicto; los cuatro códigos con código 0.

## 3. Archivo

- [ ] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md` y las líneas de
  `apps/desk/server/reconciliacion/registro.test.ts`) con `git diff --shortstat --no-renames`; si supera 800, parar. Abrir el
  intento con un techo de dos veces la carpeta más 800.
- [ ] 3.2 Mover la carpeta a `openspec/changes/archive/<fecha>-cierre-f1b13-con-lo-construido/` y reescribir las rutas a la
  propia carpeta en el mismo commit.
- [ ] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en la prueba 11f/05g
  (`apps/desk/server/reconciliacion/registro.test.ts:220` en `93c29225`: F1B-13 ya no está «en curso»). Si no se pone roja,
  parar: la prueba no distingue.
- [ ] 3.4 Corregir en sitio, sin mover líneas y conservando sus finales de línea:
  `apps/desk/server/reconciliacion/registro.test.ts:218` en `93c29225` (de OCHO a SIETE, con F1B-13 entre las cerradas por
  archivo del título) y `apps/desk/server/reconciliacion/registro.test.ts:220` en `93c29225` (la lista sin `'F1B-13'` y
  `toContain('F1B-13')` en «cerradas por archivo»); verde. Molde: `f275d5da`.
- [ ] 3.5 Correr `npm run reconcile` y comprobar que F1B-13 pasa a «cerradas por archivo» y a «cerradas sin fuente declarada en
  la R01.1», no a «marcadas sin verificar», y que «en curso» baja de ocho a siete; restaurar `docs/sdd/RECONCILIACION.md`
  sin commitearlo.
- [ ] 3.6 Barrido de la regla de mutación 4 sobre `apps/desk/server/reconciliacion/registro.test.ts` y pase de abreviadas; las
  citas de este cambio a las líneas de antes de corregir quedan ancladas en `93c29225`.
- [ ] 3.7 Escribir `archive-report.md` con la línea de R-1 (qué parte de la fila cubrió y qué dejó fuera), los intentos y la
  lista para Supervisión.
- [ ] 3.8 Cuatro códigos con código 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas, y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Confirmar los 60 días del aviso y que son naturales (P-2 de `ficha-garantia-proveedor`) | Gerencia | `decision/anexo-7-garantia-proveedor`, consecuencia (4) | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:93` |
| Asignar el cargo Director Técnico en producción, condición de publicación (P-3 de `ficha-garantia-proveedor`); la tabla de personas está entregada (`decision/tabla-de-cargos-y-personas-10-10`, `openspec/config.yaml:4438` en `93c29225`), y que esté asignado es hipótesis | Gerencia | La pantalla de usuarios | `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:94` y `openspec/config.yaml:6081` en `93c29225` |
| Pegar en el maestro la corrección 29 enmendada (P-4 de `ficha-garantia-proveedor`, P-2 de `valor-reclamado-usd`) | Gerencia | El `.docx` del maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456` |
| Contar con SQL de sólo lectura las fichas previas con algún importe, por si alguna se anotó en pesos (P-1 de `valor-reclamado-usd`; S-5) | Alfonso | Si alguna está en pesos, punto abierto con dueño en la bandeja | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:126` |
| Verificar en la aplicación la vista «Garantías» y que la ficha y la medición enseñan «USD» y el origen del valor (P-1 de `medicion-garantias-por-marca`, P-3 de `valor-reclamado-usd`) | Quien despliega, con Gerencia | La aplicación, en la lista acumulada de pruebas | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:88` y `openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:128` |
| Situar la fila de la carga de las fallas repetidas en la ISO 14224 (P-3 de `medicion-garantias-por-marca`; S-4) | Gerencia; plazo, la semana de corrección de la lista semanal que publique S-4 (E-237) | La fila que abra `decision/anexo-56-taxonomia` | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:90` |
| Decidir en qué lista entran los supuestos de la fila sin lista aceptada: los de `medicion-garantias-por-marca` y los S-1 a S-12 de `ficha-garantia-proveedor` | Supervisión | La lista semanal (E-237) | `docs/sdd/Supuestos_semana_2026-11-02.md:217` y `proposal.md`, «Lo que sigue abierto» |
| Revisar S-1 a S-5 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal | `proposal.md`, «Supuestos reversibles» |
