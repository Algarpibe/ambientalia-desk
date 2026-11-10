# Verify · `cierre-f1b13-con-lo-construido` (F1B-13, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1b13-con-lo-construido` · **Verificado sobre:** `2e9e287d` (partida `93c29225`),
con las correcciones de este mismo commit · **Informe escrito por el orquestador**, con cifras medidas por él. La lectura de
cada cita en su ancla la hizo además, por su cuenta, un agente de sólo lectura que no escribió la propuesta.

## Veredicto: PASS — 0 críticos; 4 avisos y 4 sugerencias, todos corregidos en este commit

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos en `proposal.md`, con `tanda: F1B-13`, `cierra: si`, `origen_cabecera: declarada` y `maestro` no vacío | Cumple. F1B-13 no tiene fila en la R01.1, así que el barrido no cruza su `maestro:` y la cuenta entre las «cerradas sin fuente declarada» (`apps/desk/server/reconciliacion/comprobaciones.ts:228-240`) |
| 2 | Forma de cada cita `ruta:línea` de `proposal.md` y `tasks.md`, en su ancla: fichero existente, los dos extremos en rango y ninguno en línea vacía | 165 de 165, ninguna abreviada. Script propio que lee cada extremo con `git show <ancla>:<ruta>` o en el árbol |
| 3 | Que cada cita diga lo que afirma su frase, extremo inicial y final por separado | Dos la sostenían a medias (avisos 1 y 2, abajo); corregidas. Las demás, sí |
| 4 | ¿Queda alguna pieza de la fila sin construir y archivar? | No. El envío físico sale por decisión a F1B-16; la carga en la ISO 14224 es de la decisión de respaldo, no de la fila, y queda fuera por el supuesto S-4, no por decisión (avisos 3 y 4) |
| 5 | Que cada requisito de «Las piezas, en las specs vivas» esté en la línea citada | 16 de 16: RQ-TC-44 a RQ-TC-49, RQ-TC-65 a RQ-TC-68, RQ-TC-78 a RQ-TC-80, RQ-PM-24, RQ-PM-26 y RQ-AV-19, cada uno en su línea |
| 6 | `git diff --name-only 93c29225 2e9e287d`: sólo ficheros bajo `openspec/changes/cierre-f1b13-con-lo-construido/` | Cumple: `proposal.md` y `tasks.md` |
| 7 | Sin código de producción, sin `openspec/specs/`, sin ficheros de Supervisión, sin delta de specs | Cumple |

## Avisos, corregidos en este commit

1. **`proposal.md`, fila «Ficha propia…» del contraste.** Citaba `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:19-24`
   para «tabla, capa de datos, cuatro rutas y panel», y el panel está en la línea 28. El rango pasa a ir de la línea 19 a la 28.
2. **`proposal.md`, «La bandeja».** Decía «siete líneas, todas en tres entradas» y debajo listaba cuatro: la cuarta, E-034, no
   nombra F1B-13. Ahora nombra las tres (E-105, E-157 y E-274) y dice por qué se añade E-034.
3. **`proposal.md`, «Conclusión de la medida».** Abría con «ninguna pieza queda sin construir sin que la saque una decisión» y
   después admitía una que no saca ninguna. Ahora separa las piezas de la fila de la de la decisión de respaldo, y dice que la
   ISO 14224 queda fuera por el supuesto S-4, no por decisión.
4. **`tasks.md`, tarea 2.2.** Agrupaba la ISO 14224 con las piezas que saca «una decisión o su propia fuente». Ahora la nombra
   aparte, como la que queda fuera por S-4.

## Sugerencias, aplicadas en este commit

- «Es la fila de E-104» lleva ahora su decisión: `decision/trabajo-del-30-09-sin-fila` (1), `openspec/config.yaml:3450` en `93c29225`.
- «Construida como S-7» lleva su línea: `openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/archive-report.md:35-36`.
- «La tabla de personas está entregada», en `tasks.md`, lleva su decisión: `openspec/config.yaml:4438` en `93c29225`.
- La tarea de persona de la ISO 14224 tenía dueño y no fecha (`CLAUDE.md`, R-3). Lleva ahora el plazo de la lista semanal de
  supuestos que publique S-4.

## Lo que la verificación no cierra, y se dice

- **S-4 es un supuesto, no una decisión.** La carga de las fallas repetidas en la ISO 14224 no tiene destino escrito: la decisión
  la engancha a `decision/anexo-56-taxonomia` (`openspec/config.yaml:2351` en `93c29225`), cuya tanda es F1D-07
  (`openspec/config.yaml:2486` en `93c29225`), y la fila F1D-07 del plan es «Formulario de falla nueva»
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:117`), que no la nombra. Va en la lista para Supervisión y en la
  semanal de supuestos.

## Códigos sobre el árbol de este informe

| Comando | Salida |
|---|---|
| `npm test` | 0 · 6.435 pasan, 26 omitidas (279 s; portátil en batería, 8,8 GB libres al arrancar) |
| `npm run typecheck` | 0 |
| `npm run lint -- --max-warnings 165` | 0 · 0 errores, 165 avisos |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit>` | Se corre sobre el commit de este informe, que no existe al escribirlo: su código y sus cifras van en el registro del intento |

## Lo que el archivo tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1B-13 sigue «en curso» y la prueba 11f/05g
(`apps/desk/server/reconciliacion/registro.test.ts:218` en `93c29225` y
`apps/desk/server/reconciliacion/registro.test.ts:220` en `93c29225`) está en verde. Al moverla a `openspec/changes/archive/` con `cierra: si`, el barrido la cuenta «por archivo» y esa
prueba tiene que ponerse roja. Si no se pone roja, la prueba no distingue y hay que parar.
