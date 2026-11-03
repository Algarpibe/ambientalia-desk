# Tareas: cierre de F1B-04 con lo construido

Cambio documental, sin código de producción ni delta de specs. Tres intentos del registro: planificación, verify y
archivo. Cada intento se asienta sólo con TODOS sus códigos en 0.

## 1. Planificación

- [x] 1.1 Medir la fila F1B-04 (R01.1 y R01.4), los siete cambios archivados con `tanda: F1B-04` y las decisiones de
  respaldo; escribir en `proposal.md` el contraste pieza a pieza, con ruta y línea.
- [x] 1.2 Cabecera de siete campos: `tanda: F1B-04`, `cierra: si`, `origen_cabecera: declarada`, y `maestro` con la fuente
  de la fila en la R01.1.
- [x] 1.3 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y el detector de citas
  (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) con código 0.

## 2. Verify

- [x] 2.1 Contrastar cada cita de `proposal.md` contra el fichero, en su ancla: qué afirma, extremo inicial y final.
- [x] 2.2 Comprobar que ninguna pieza de la fila queda sin construir y archivar; si queda alguna, parar sin archivar.
- [x] 2.3 Comprobar que el cambio no toca código de producción, `openspec/specs/` ni ficheros de Supervisión.
- [x] 2.4 Escribir `verify-report.md` con veredicto; los cuatro códigos con código 0.

## 3. Archivo

- [ ] 3.1 Medir antes de aplicar la parte revisable (`archive-report.md` y las líneas de `registro.test.ts`); si supera 800,
  parar.
- [ ] 3.2 Mover la carpeta a `openspec/changes/archive/<fecha>-cierre-f1b04-con-lo-construido/`.
- [ ] 3.3 Correr `apps/desk/server/reconciliacion/registro.test.ts` y ANOTAR el rojo esperado en `:220` (F1B-04 ya no está
  «en curso»).
- [ ] 3.4 Corregir en sitio `registro.test.ts:218` y `:220` (OCHO, sin F1B-04), sin mover líneas; verde.
- [ ] 3.5 Correr `npm run reconcile` para comprobar que F1B-04 pasa a «cerradas por archivo» y no queda «sin verificar»;
  restaurar `docs/sdd/RECONCILIACION.md` sin commitearlo.
- [ ] 3.6 Barrido de la regla de mutación 4 sobre `registro.test.ts` y pase de abreviadas.
- [ ] 3.7 Cuatro códigos con código 0; `git show --numstat` del commit con sólo este cambio.

## Tareas de personas — fuera del recuento

No son casillas, y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Completar la lista de accesorios de Kunak AIR Pro (el único de los 29 modelos activos sin ninguno) | Director Técnico | Configuración → «Accesorios por modelo» | `decision/f1b04-recuento-no-retiene` (3) y `archive-report.md` de este cambio |
| Decidir qué se hace con los 106 accesorios escritos a mano sin artículo en Books, en 34 modelos («siguen funcionando sin SKU») | Director Técnico (supuesto S-5; la decisión no nombra dueño) | Configuración → «Accesorios por modelo», artículo a artículo | `decision/f1b04-recuento-no-retiene` (2) y `archive-report.md` de este cambio |
| Cambiar el nodo «Verifica Incluye Entrada» de n8n con `docs/sdd/Cambio_n8n_Aplica_2026-10-12.md` | Alfonso | El flujo de n8n | `docs/sdd/TRASPASO_2026-10-08.md`, «Pendiente de Alfonso, sin fecha» |
| Hacer la prueba de aceptación de F1B-04 con la primera remisión real (candidato: el ticket nº 996) | Servicio Técnico | La aplicación, con la lista de seis puntos | `docs/sdd/TRASPASO_2026-10-08.md`, «Pendiente: la prueba de aceptación de F1B-04» |
| Las tres comprobaciones de E-170: lista de novedades, código del ticket en la etiqueta y formulario | Servicio Técnico; quien administra n8n | La aplicación y el flujo de n8n | `docs/sdd/ENTRADA.md` → E-170 |
| Revisar S-1 a S-5 en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal | `proposal.md`, «Supuestos reversibles» |
