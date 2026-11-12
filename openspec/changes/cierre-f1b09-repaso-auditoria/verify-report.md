# Verify · `cierre-f1b09-repaso-auditoria` (F1B-09, `cierra: si`)

**Fecha:** 2026-11-12 · **Rama:** `cierre-f1b09-repaso-auditoria` · **Verificado sobre:** `6421592c` (partida `87510cbf`), con
las correcciones de este mismo commit · **Informe escrito por el orquestador**, con cifras medidas por él. Además, un agente de
sólo lectura que no escribió el repaso lo contrastó por su cuenta contra el código; cada dato suyo se volvió a comprobar antes de
usarlo, y uno se descartó.

## Veredicto: PASS — 0 críticos; 8 avisos, todos corregidos en este commit

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos, con `tanda: F1B-09`, `cierra: si`, `toca_maestro: si` y `origen_cabecera: declarada` | Cumple. La fuente de la fila en la R01.1 es «—» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:166`), así que el barrido la contará entre las «cerradas sin fuente declarada» (`apps/desk/server/reconciliacion/comprobaciones.ts:231-234`) |
| 2 | Forma de cada cita de `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, las deltas y el repaso, en su ancla | 232 de 232, con un guion propio que lee cada extremo con `git show <ancla>:<ruta>` o en el árbol |
| 3 | Que cada cita de la lista de discrepancias diga lo que se le atribuye | Leídas una a una. Una no lo decía (aviso 1) |
| 4 | Las cifras, contadas otra vez por el verificador | 40 + 7 + 5 = 52 hoy y 31 + 6 + 4 = 41 en `0d1a40b`; las once ids nuevas, exactamente las del repaso, con los mismos commits de origen |
| 5 | Destinos: ninguna sin destino, y las de 2027 sólo si caen en el alcance de su fila | Diecinueve: diecisiete a «bandeja», D-15 a F1B-16 y D-17 a F1B-17 (aviso 4) |
| 6 | Cobertura: ninguna afirmación de estado de la auditoría sin contrastar que hoy sea falsa | Dos sin contrastar del todo (avisos 5 y 6), corregidas |
| 7 | `git diff --name-only 87510cbf`: sólo el repaso nuevo y la carpeta del cambio; nada de código de producción, `openspec/specs/`, la auditoría del 05/10 ni ficheros de Supervisión | Cumple |
| 8 | Las dos deltas: la «línea viva» de cada una es la de la spec viva, y la fusión cambia sólo esa línea | Ensayo sobre copias: las dos líneas casan; tras fusionar, mismo número de líneas, todas CRLF, el resto idéntico byte a byte. Control: una línea que no casa se rechaza con salida 1 |

## Avisos, corregidos en este commit

1. **D-13 citaba `openspec/specs/transitions-soporte-remoto/spec.md:320`** para la guarda de remisión, y esa línea es «Rama de
   servicio en sitio → 2027 T2». La guarda está en la 321. Lo enseñó el control del ensayo de fusión y lo confirmó el verificador.
2. **§2.4 daba a `puedeCrearOVIGarantia` tres llamadores**, entre ellos el mantenimiento de novedades. Son dos,
   `packages/shared/src/garantiaProveedor.ts:91` y `packages/shared/src/ordenOVI.ts:55`; `packages/shared/src/mantenimientoNovedades.ts:10`
   sólo la nombra en un comentario.
3. **D-11 citaba como caducos dos títulos correctos** (`apps/desk/server/permisos.test.ts:243` y `apps/desk/server/permisos.test.ts:328`,
   que dicen bien 21 y 15 casos) y le faltaban dos caducos: `apps/desk/server/permisos.test.ts:250` («pasa por las cinco») y
   `packages/shared/src/invariantesGrafo.test.ts:302` («`Finalizado` es el único sin salida» en equipo nuevo, que tiene también
   `Anulado`). Las dos correctas pasan a ser la evidencia de la cifra real.
4. **El supuesto S-2 no se sostenía.** Daba el flujo de la remisión que la auditoría no revisó por cosa de la remisión de entrada.
   Es común: el envío a n8n rechaza la remisión sin ticket (`apps/desk/server/routes/remision.ts:302`), y anular, restaurar y el
   callback no distinguen el tipo (`apps/desk/server/db/estadoPorRemision.ts:43-46`). D-15 se parte en dos: la mitad del envío va
   a F1B-16 y la nueva D-17, la del callback y la anulación, a F1B-17. S-2 queda corregido en `proposal.md`.
5. **§2.5 decía «Coincide» de los incumplimientos vivos sin decir que IV-12 tiene hoy cuatro puntos** y la auditoría contó tres
   (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:227`). `CLAUDE.md` ya registra el cuarto, así que es superado con el registro
   al día; ahora se dice.
6. **§2.1 decía «Igual» de `Pendiente`**, y la auditoría afirmaba que de él «sólo sale `continuacion_soporte`»
   (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:105-106`). Hoy sale también `anulacion_soporte`
   (`packages/shared/src/transitions.ts:396`). El heredado de servicio sigue sin transición, que es lo que importaba.
7. **Faltaban cifras caducas de la clase de B-7.** El verificador encontró comentarios con cifras de un catálogo de 31 o 33
   transiciones y comentarios de pruebas con totales viejos. Comprobados uno a uno, entran como D-18 (código) y D-19 (pruebas). El
   repaso dice ahora que esa clase no sale de un barrido exhaustivo.
8. **La cabecera del repaso remitía a «la lista de §5»**, que es la de Supervisión; la de discrepancias es §4.

## Descartado del informe del verificador

- **`packages/shared/src/estados.test.ts:142`** no dice «entre ellos `Ingresado`», como afirmaba: dice que F1C-08 le dio una segunda
  salida. Está bien. No entra en D-12.
- **Rutas bajo `/api/admin/`:** el verificador cuenta 19 y 18 sin cliente, porque da por cliente de `/api/admin/respaldo` un
  comentario de `apps/desk/src/components/Adjuntos.tsx:8`. Esa ruta no tiene cliente: la palabra sólo aparece en comentarios. La
  cifra del repaso, 20 rutas sin cliente de 122, 18 de ellas bajo `/api/admin/`, se mantiene; las dos son heurísticas.

## Lo que la verificación no cierra, y se dice

- **D-11, D-18 y D-19 no son un barrido completo** de cifras caducas en comentarios: son lo que encontraron dos lectores. Un barrido
  completo sería trabajo de la entrada que abra Supervisión.
- **D-15 y D-17 llevan destino de 2027 por un supuesto (S-2), no por decisión.** Si Gerencia lo corrige, van a «bandeja».

## Códigos sobre el árbol de este informe

| Comando | Salida |
|---|---|
| `npm test` | Se corre en la cadena de cierre del intento, con el commit de este informe |
| `npm run typecheck` | ídem |
| `npm run lint -- --max-warnings 165` | ídem |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit>` | ídem; sus códigos y cifras van en el registro del intento |

## Lo que el archivo tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1B-09 sigue «en curso» y la prueba 11f/05g
(`apps/desk/server/reconciliacion/registro.test.ts:218` en `87510cbf` y `apps/desk/server/reconciliacion/registro.test.ts:220` en `87510cbf`)
está en verde. Al moverla a `openspec/changes/archive/` con `cierra: si`, tiene que ponerse roja. Si no, la prueba no distingue y
hay que parar.
