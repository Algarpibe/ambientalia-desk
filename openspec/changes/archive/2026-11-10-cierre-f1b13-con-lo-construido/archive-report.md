# Archive · `cierre-f1b13-con-lo-construido` (F1B-13, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1b13-con-lo-construido` · **Partida:** `93c29225` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubrió la fila F1B-13 y qué dejó fuera, en una línea (R-1):** cubrió la ficha de garantía con el proveedor entera en tres cambios con `cierra: no` —la pregunta «¿Se reclama al fabricante?» con sus tres motivos del «no», la ficha vinculada al ticket y a la OVI de garantía con sus tres estados, el permiso y el aviso a los 60 días del Director Técnico; las dos mediciones, por marca y de piezas con fallas repetidas, con su acceso por cargo; y el valor reclamado en USD desde el costo de catálogo, con la moneda en todos sus importes—; dejó fuera el envío físico de la pieza por remisión sin ticket, que pasa a F1B-16 por `decision/filas-que-no-cierran-antes-del-corte` (1), y la carga de las fallas repetidas en la ISO 14224, que queda fuera por el supuesto S-4, sin decisión, hacia `decision/anexo-56-taxonomia` (F1D-07) y sin destino escrito.

## Qué decisión registra

`decision/filas-que-no-cierran-antes-del-corte` (Gerencia, 2026-11-09; `openspec/config.yaml:5761-5778` en `93c29225`): «F1B-13:
la remisión sin ticket pasa a F1B-16 y la fila cierra con lo construido» (`openspec/config.yaml:5767` en `93c29225`). Su
consecuencia (1) pide el cierre sin código (`openspec/config.yaml:5769` en `93c29225`), y `decision/orden-tandas-tras-e266` (1) lo
pone detrás de E-266 (`openspec/config.yaml:5829` en `93c29225`). No añade nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- **El contraste pieza a pieza de la fila** con los tres cambios archivados y sus decisiones de respaldo, en `proposal.md`,
  «Contraste pieza a pieza». Ninguna pieza de la fila queda sin construir y archivar sin que la saque una decisión. La de la
  ISO 14224 no es de la fila sino de `decision/anexo-7-garantia-proveedor`, y queda fuera por S-4.
- **El verify** (`be251407`): PASS, 0 críticos. Leyó en su ancla las 165 citas de la propuesta y de `tasks.md` y comprobó los 16
  requisitos vivos. Corrigió en sitio cuatro avisos de redacción y aplicó cuatro sugerencias. Además, un agente de sólo lectura
  que no escribió la propuesta leyó cada cita por su cuenta.
- **El rojo, visto antes de corregir.** Con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio
  1 fallo de 23, la prueba 11f/05g, y la única diferencia era `"F1B-13"` en «en curso».
- **La corrección, en sitio:** líneas 218 y 220. La lista pasa de OCHO a SIETE, sin F1B-13; el título nombra F1B-13 entre las
  cerradas por archivo, y la 220 añade `toContain('F1B-13')` en «cerradas por archivo». El fichero sigue en 248 líneas, todas
  CRLF, con 0 `\r` sueltos: 23 de 23. Es la única línea de código del cambio, con el molde de `f275d5da`.
- **`npm run reconcile` sobre el árbol del archivo:**
  - F1B-13 pasa a «cerradas por archivo» (34) y «en curso» baja a 7.
  - F1B-13 entra en «cerradas sin fuente declarada en la R01.1» (13), porque no tiene fila en la R01.1.
  - Las 9 «marcadas sin verificar» son las mismas que en `main`, sin F1B-13.
  - El denominador sigue en 78: las tres filas nuevas del plan están en su §L, que el barrido no lee.
  - `docs/sdd/RECONCILIACION.md` se restauró sin commitear.
- **Barrido de la regla de mutación 4 sobre `registro.test.ts`:** no se movió ninguna línea. En el repositorio hay 106 citas a sus
  líneas 215 a 223.
  - Las de este cambio, siete, van ancladas en `93c29225`.
  - Casi todas las demás están en carpetas de `archive/`, sin ancla: es la clase que ya registra E-256, y este cierre vuelve a
    cambiar lo que dicen la 218 y la 220.
  - Fuera de `archive/` hay dos, y las dos son de caso B: la traza de E-256 en `docs/sdd/ENTRADA.md` y el informe de F1B-09
    (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:292`), que habla de cuando la lista contaba diez.
- **Un ancla partida, corregida en este commit.** En `verify-report.md`, el ancla de la cita a la línea 220 de `registro.test.ts` había quedado en la línea física siguiente; ahora va en la misma. El detector no la habría visto, porque no lee `archive/`.
- **Sin código de producción, sin `openspec/specs/`, sin migración y sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `2e9e287d` | 304 (+304), contra `93c29225`; 0 sin trackear | `passed` |
| Verify | `be251407` | 100 (+82 −18), contra `2e9e287d`; 0 sin trackear | `passed` |
| Archivo | este commit | se mide al cerrar el intento, contra `be251407` | techo 1.800 (dos veces la carpeta más 800) |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

- **S-1:** `maestro: ["M4.4", "Anexo D nº 7"]`, el del primer cambio de la fila.
- **S-2:** `capacidad: [reconciliacion]`.
- **S-3:** `toca_maestro: no`, como el precedente de F1B-04.
- **S-4:** la carga de las fallas repetidas en la ISO 14224 no es contenido de la fila.
- **S-5:** la P-1 de `valor-reclamado-usd` sigue abierta aunque S-8 esté aceptado.

Cómo se revierte cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **El plan.**
  - La fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`) lleva desde `93c29225` la nota del 09/11 con este
    cambio, pero su celda de estado sigue diciendo «en curso».
  - Su remanente (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217`) da por pendientes el valor reclamado y las dos
    mediciones, construidos desde el 17/10 y el 26/10.
- **S-4, sin destino escrito.** La carga de las fallas repetidas en la ISO 14224 va, según la decisión, a
  `decision/anexo-56-taxonomia` (`openspec/config.yaml:2351` en `93c29225`). Esa decisión abre F1D-07
  (`openspec/config.yaml:2486` en `93c29225`), pero la fila F1D-07 del plan es «Formulario de falla nueva» y no la nombra
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:117`). Si Gerencia no corrige S-4, la pieza necesita fila o punto
  abierto con dueño y fecha (R-3).
- **La bandeja.**
  - La P-1 de `valor-reclamado-usd` iba a tener entrada «en `main` al fusionar»
    (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:192`) y no la tiene.
  - Ninguna entrada tiene F1B-13 por destino: no hay ninguna que cerrar por este cierre.
  - E-256 crece con este cierre: la 218 y la 220 de `registro.test.ts` vuelven a cambiar.
- **Los supuestos de la fila sin lista aceptada.** Los S-1 a S-12 de `ficha-garantia-proveedor` no aparecen en ninguna lista
  semanal (`docs/sdd/Supuestos_semana_2026-11-02.md:192`). Los de `medicion-garantias-por-marca` están en el anexo de supuestos
  nunca publicados (`docs/sdd/Supuestos_semana_2026-11-02.md:217`).
- **`openspec/config.yaml`.** `decision/filas-que-no-cierran-antes-del-corte` lleva en `tanda_que_abre` «dos cambios de cierre
  sin código (F1B-13 y el nivel cargo de F1C-05)» (`openspec/config.yaml:5778` en `93c29225`): el de F1B-13 es este.
- **El avance.** Medido con `npm run reconcile` sobre el árbol del archivo: 34 cerradas por archivo, 9 por commit, 7 en curso,
  denominador 78. `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión.
- **El maestro.** La tabla del §3.3 marca F1B-13 «Sin empezar»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3894-3898`); va con S-3. La corrección 29
  (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456`) sigue sin pegar, y su punto 3 no dice todavía que el envío físico pasa
  a F1B-16.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Confirmar los 60 días del aviso y que son naturales (P-2 de `ficha-garantia-proveedor`) | Gerencia | `decision/anexo-7-garantia-proveedor`, consecuencia (4) |
| P-2 | Asignar el cargo Director Técnico en producción, condición de publicación (P-3 de `ficha-garantia-proveedor`) | Gerencia | La pantalla de usuarios |
| P-3 | Pegar en el maestro la corrección 29 enmendada (P-4 de `ficha-garantia-proveedor`, P-2 de `valor-reclamado-usd`) | Gerencia | El `.docx` del maestro |
| P-4 | Contar con SQL de sólo lectura las fichas previas con algún importe, por si alguna se anotó en pesos (P-1 de `valor-reclamado-usd`; S-5) | Alfonso | Si alguna está en pesos, punto abierto con dueño en la bandeja |
| P-5 | Verificar en la aplicación la vista «Garantías» y que la ficha y la medición enseñan «USD» y el origen del valor | Quien despliega, con Gerencia | La lista acumulada de pruebas en la aplicación |
| P-6 | Situar la fila de la carga de las fallas repetidas en la ISO 14224 (S-4) | Gerencia; plazo, la semana de corrección de la lista que publique S-4 | La fila que abra `decision/anexo-56-taxonomia` |
| P-7 | Decidir en qué lista entran los supuestos de la fila sin lista aceptada | Supervisión | La lista semanal (E-237) |
| P-8 | Revisar S-1 a S-5 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal |
