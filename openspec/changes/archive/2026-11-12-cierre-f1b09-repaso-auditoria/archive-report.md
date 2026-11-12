# Archive · `cierre-f1b09-repaso-auditoria` (F1B-09, `cierra: si`)

**Fecha:** 2026-11-12 · **Rama:** `cierre-f1b09-repaso-auditoria` · **Partida:** `87510cbf` · **Informe escrito por el
orquestador**, con cifras medidas por él; no lo generó el agente de archivo. Sin fusionar a `main`.

**Qué cubrió la fila F1B-09 y qué dejó fuera, en una línea (R-1):** cubrió la auditoría de blueprint de los tres flujos del
05/10 y sus hallazgos, en cinco cambios con `cierra: no` —la auditoría, el mapa generado de los tres flujos, las cifras caducas,
la clase de espera y las áreas de equipo nuevo, y las áreas de soporte remoto— y, con este, el repaso de esa auditoría sobre
`main` (52 transiciones: 40 + 7 + 5) y las dos referencias de spec que aún remitían a F1B-09 trabajo hecho; deja fuera, por
`decision/f1b09-epica-1b-antes-del-corte`, la auditoría de las filas de 2027 (F1B-16, F1B-17 y F1B-20), que va en su hito, y la
corrección de las diecinueve discrepancias del repaso, que sólo se listan: diecisiete a la bandeja, D-15 a F1B-16 y D-17 a F1B-17.

## Qué decisión registra

`decision/f1b09-epica-1b-antes-del-corte` (Gerencia, 2026-11-12), citada por su clave: a la hora de archivar no está en
`origin/main`. Opción (a): «cerrar la épica 1B» son sus filas de antes del corte, todas cerradas salvo F1B-09; el encargo es el
repaso, las dos referencias de spec y la línea de prueba. No añade nada a `cierres_declarados_por_commit`.

## Qué quedó hecho

- **El repaso**, `docs/sdd/F1B-09_Repaso_auditoria_2026-11.md` (apply `6421592c`, corregido en el verify `72714e85`): las cifras
  medidas, el contraste apartado por apartado, lo que la auditoría declaró no haber hecho y diecinueve discrepancias, cada una con
  ruta y línea y UN destino. Ninguna sin destino; no hubo que parar.
- **La cifra de transiciones:** 40 + 7 + 5 = **52** hoy (54 con las dos que aplica el servidor), frente a 31 + 6 + 4 = 41 en el
  árbol auditado, `0d1a40b`. Medida con el mismo método en los dos árboles y contada otra vez por el verificador. Las once nuevas
  son de la épica 1C: F1C-01, F1C-02, F1C-03, F1C-07 y F1C-08.
- **Las dos referencias de spec (T-P4)**, fusionadas por script desde sus deltas, una línea por una línea:
  `openspec/specs/transitions-soporte-remoto/spec.md:322` (373 líneas antes y después) y
  `openspec/specs/transitions-equipo-nuevo/spec.md:553` (586 y 586). Todas CRLF; lo anterior y lo posterior, idéntico byte a byte.
  La columna propia la hizo F1B-08 con `columna-propia-dos-estados` (fusión `ae2e5223`, archivo `7de0e787`); el mapa de los tres
  flujos, F1B-09 con `mapa-blueprint-tres-flujos` (fusión `60b171fb`, archivo `b2882af5`). T-P4 está en la línea 274 del
  `tasks.md` archivado de ese cambio, no en la 273 que da el encargo (la 273 es T-P3).
- **El rojo, visto antes de corregir.** Con la carpeta en `archive/`, `apps/desk/server/reconciliacion/registro.test.ts` dio 1
  fallo de 23, la prueba 11f/05g, y la única diferencia era `'F1B-09'` en «en curso».
- **La corrección, en sitio:** líneas 218 y 220. El título pasa de CINCO a CUATRO, con F1B-09 delante en la lista de las que ya no
  están y su nota en el paréntesis; la 220 quita `'F1B-09'` de la lista y añade `toContain('F1B-09')` en «cerradas por archivo».
  248 líneas antes y después, todas CRLF, 0 `\r` sueltos; 23 de 23. Molde: `8b3c4bac`.
- **`npm run reconcile` sobre el árbol del archivo:** 37 cerradas por archivo, con F1B-09; 9 por commit; 4 en curso (F1F-01,
  F1F-02, F1F-03 y F1F-05); denominador 78. Las 13 «sin fuente declarada en la R01.1» y las 9 «sin verificar» son las mismas que
  en `main`: F1B-09 no entra en ninguna, porque su fila de la R01.1 nombra M11.6 en la columna que lee el barrido. La propuesta
  y el verify preveían que entraría «sin fuente declarada»; era falso y se corrigió en este commit. `docs/sdd/RECONCILIACION.md`
  se restauró sin commitear.
- **Barrido de la regla de mutación 4**, sin excluir `archive/`:
  - `apps/desk/server/reconciliacion/registro.test.ts`: ninguna línea movida. 130 citas a sus líneas 215 a 223. Las de este
    cambio, siete, van ancladas en `87510cbf` (una tenía el ancla en la línea física siguiente y se juntó en este commit). Fuera
    de `archive/` hay dos, las dos de caso B: la traza de E-256 en `docs/sdd/ENTRADA.md` y la auditoría del 05/10, que habla de
    cuando la lista contaba diez. Las demás están en carpetas de `archive/`, sin ancla: es la clase que ya registra E-256.
  - Las dos specs: ninguna línea movida. A sus líneas 322 y 553 las citan las deltas y la propuesta de este cambio, ancladas, y
    `openspec/changes/archive/2026-10-08-mapa-blueprint-tres-flujos/proposal.md:88`, que dice que la 322 «sigue remitiendo» a
    F1B-09: cierto en su revisión, caso B. Ninguna abreviada.
- **Sin código de producción, sin migración y sin cambio de bundle.**

## Intentos del registro

| Intento | Commit | Medida (`git diff --shortstat --no-renames`) | Registro |
|---|---|---|---|
| Planificación | `4594beb0` | 345 (+345), contra `87510cbf`; 0 sin trackear | `passed` |
| Apply | `6421592c` | 285 (+279 −6), contra `4594beb0`; 0 sin trackear | `passed` |
| Verify | `72714e85` | 125 (+107 −18), contra `6421592c`; 0 sin trackear | `passed` |
| Archivo | este commit | se mide al cerrar el intento, contra `72714e85` | techo 1.712 (dos veces la carpeta, 456, más 800) |

Los cuatro con `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165`, el commit y el detector en una cadena con
salida 0. `npm test`: 6.462 pasan y 30 omitidas en cada uno; lint, 165 avisos contra 165.

## Las discrepancias, con su destino

El detalle, con ruta y línea, está en §4 del repaso. Aquí, el resumen.

| # | Qué | Destino |
|---|---|---|
| D-1 | E-223 da por pendiente la anulación, construida por F1C-01 | bandeja |
| D-2 | E-226 da por pendiente la clase de espera y las áreas de equipo nuevo, construidas | bandeja |
| D-3 | E-090 dice «nueva» y «sin fusionar»; se fusionó el 27/10 | bandeja |
| D-4 | E-224 no dice que el filtro por flujo está construido | bandeja |
| D-5 | El bodegaje sin llamador tiene destino F1C-06, cerrada | bandeja |
| D-6 | `puedeLiberarSinFactura`, sin llamador ni destino | bandeja |
| D-7 | `transitionsForStatus` y `transitionById`, sin decisión de Gerencia | bandeja |
| D-8 | A-1 de F1A-05 sigue, asignado a F1C-02, cerrada | bandeja |
| D-9 | El ciclo reentrante sigue; sus cuatro indicadores no tienen dueño | bandeja |
| D-10 | Un comentario del motor niega el checkbox obligatorio que hoy existe | bandeja |
| D-11 | Títulos de prueba con cifras caducas | bandeja |
| D-12 | Un comentario pone `Ingresado` de ejemplo de salida única | bandeja |
| D-13 | Cuatro líneas de «Fuera de alcance» con destinos ya cumplidos | bandeja |
| D-14 | M11.6 y el texto del expediente para la R08.5 ya no son ciertos | bandeja |
| D-15 | El envío del flujo de la remisión, sin auditar; F1B-16 lo cambia | F1B-16 |
| D-16 | «Cliente sin ruta», sin buscar y sin dueño | bandeja |
| D-17 | Anular, restaurar y el callback de la remisión, sin auditar; F1B-17 pasará por ellos | F1B-17 |
| D-18 | Comentarios del código con cifras de 31 o 33 transiciones | bandeja |
| D-19 | Comentarios de pruebas con totales viejos | bandeja |

## Supuestos reversibles — plazo de corrección: una semana desde que se publique

- **S-1:** qué es discrepancia: lo que no coincide con `main`, en la auditoría o en un registro vivo, y lo abierto con un destino
  que ya no lo es.
- **S-2:** D-15 a F1B-16 y D-17 a F1B-17, porque las dos filas cambian el flujo común de la remisión; corregido en el verify.
- **S-3:** la corrección de (b) va por delta aunque las dos líneas no son requisitos.
- **S-4:** los commits citados para la columna y el mapa son las fusiones en `main`.
- **S-5:** las otras cuatro líneas desfasadas de «Fuera de alcance» no se tocan; son D-13.
- **S-6:** el repaso no rehace lo que la auditoría no hizo y sigue fuera de una lectura del árbol.

Cómo se revierte cada uno: `proposal.md`, «Supuestos reversibles».

## Para Supervisión — no se editan en la rama

- **La bandeja.** Las diecisiete con destino «bandeja» (repaso, §4). En particular:
  - las trazas de E-223 (D-1), E-226 (D-2) y E-090 (D-3) dicen algo que ya no es cierto;
  - la de E-224 (D-4) se queda a medias;
  - de E-227 queda sin destino lo de D-5, D-6 y D-7;
  - E-256 crece con este cierre: la 218 y la 220 de `registro.test.ts` vuelven a cambiar.
- **Las filas de 2027.** D-15 queda como entrada de la auditoría de hito de F1B-16, y D-17 de la de F1B-17.
- **`openspec/config.yaml`.** La nota fechada 12/11 en las tres decisiones que mantenían el `cierra: no`:
  `decision/orden-tres-tandas-04-10` (2), `decision/e222-mapa-equipo-nuevo-soporte-remoto` (5) y
  `decision/f1b04-recuento-no-retiene` (5). Y el registro de `decision/f1b09-epica-1b-antes-del-corte`, que este cambio cita por
  su clave.
- **T-P4 de `mapa-blueprint-tres-flujos`**, hecha por este cambio en sus dos líneas.
- **El maestro.** M11.6 dice «sin empezar»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`), y el texto del expediente para la R08.5,
  «en curso» (`docs/sdd/R08.4_Expediente_de_cambios.md:318` en `87510cbf`). El texto nuevo está en el repaso, §5; su fecha de
  archivo es la de la fusión. Pegarlo en el `.docx` es de Gerencia.
- **El plan y el avance.** Tras fusionar, en `main`: las notas al final de
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`,
  y `docs/sdd/RECONCILIACION.md` regenerada: 37 por archivo, 9 por commit, 4 en curso, denominador 78.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Anotar las tres decisiones de `openspec/config.yaml` con fecha 12/11, sin reescribirlas | Supervisión | `openspec/config.yaml`, en `main` |
| P-2 | Registrar en la bandeja las diecisiete discrepancias con destino «bandeja» y poner al día las trazas de E-223, E-226, E-090, E-224 y E-227 | Supervisión | `docs/sdd/ENTRADA.md` |
| P-3 | Anotar D-15 y D-17 en las filas de F1B-16 y F1B-17, como entrada de su auditoría de hito | Supervisión | El plan R01.4 |
| P-4 | Llevar al expediente el texto nuevo de M11.6 y pegarlo en el `.docx` | Supervisión, y Gerencia para el `.docx` | El expediente y el maestro |
| P-5 | Revisar S-1 a S-6 de este cambio en la lista semanal de supuestos (E-237) | Gerencia | La lista semanal |
