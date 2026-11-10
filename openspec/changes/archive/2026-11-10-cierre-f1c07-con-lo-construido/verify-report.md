# Verify · `cierre-f1c07-con-lo-construido` (F1C-07, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1c07-con-lo-construido` · **Verificado sobre:** `a3742320` (partida `9223318f`),
con las correcciones de este mismo commit · **Informe escrito por el orquestador**, con cifras medidas por él. La lectura de cada
cita en su ancla la hizo además, por su cuenta, un agente de sólo lectura que no escribió la propuesta.

## Veredicto: PASS — 0 críticos; 7 avisos (6 distintos: el de S-5 salía en dos puntos) y 9 sugerencias, todos corregidos en este commit

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos en `proposal.md`, con `tanda: F1C-07`, `cierra: si`, `origen_cabecera: declarada` y `maestro` no vacío | Cumple. F1C-07 tiene fila en la R01.1 con fuente «M9.1» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:180`), y el `maestro:` la contiene, así que el barrido no la marca «sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:238`) |
| 2 | Forma de cada cita `ruta:línea` de `proposal.md` y `tasks.md`, en su ancla: fichero existente, los dos extremos en rango y ninguno en línea vacía | 187 de 187 sobre `a3742320`; 209 de 209 tras las correcciones. Script propio que lee cada extremo con `git show <ancla>:<ruta>`. Ninguna ancla partida en la línea física siguiente |
| 3 | Que cada cita diga lo que afirma su frase, extremo inicial y final por separado | El verificador leyó 136 citas únicas (187 apariciones): 130 decían lo que afirmaban y 6 no (avisos 1 a 3 y las tres primeras sugerencias, abajo); corregidas |
| 4 | ¿Queda alguna pieza de la fila sin construir y archivar? | Ninguna sin destino. Salen por decisión la foto del embalado y la guarda de salida (a F1B-17) y la firma con imagen (a F1E-04), por `decision/e248-adelanto-f1c` (3) (`openspec/config.yaml:5734` en `9223318f`), y la firma «Revisó», a F1E-04, por `decision/roles-validacion-informe`. Dos piezas tienen el destino fijado por supuesto y no por decisión: el checklist que revisa los fallos del diagnóstico y alimenta el informe de salida (S-5, a F1E-03) y el indicador de retrabajo (S-6, a `kpis`). Lo construido está detrás de `CONTROL_CALIDAD_LIBERACION`, apagado por e248 (2) (S-4) |
| 5 | ¿Contradicen S-4, S-5 o S-6 una decisión registrada, o cambian el alcance de una fila? | Ya no. En `a3742320`, S-5 se revertía con «la fila no cierra», y eso chocaba con e248, que ordena «y F1C-07 cierra con lo construido» (`openspec/config.yaml:5730` en `9223318f`): corregido (aviso 6). S-5 no amplía F1E-03, cuyo contenido es ya el informe de salida con los puntos del diagnóstico (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:211`). S-6 sigue la consecuencia (5) de `decision/c6-qa-liberacion` (`openspec/config.yaml:1899` en `9223318f`) |
| 6 | Que cada requisito de «Las piezas, en las specs vivas» esté en la línea citada | 17 de 17: RQ-TS-46 a RQ-TS-51, RQ-TS-56, RQ-PM-32 a RQ-PM-37, RQ-TZ-22 a RQ-TZ-24 y RQ-AV-24, cada uno con su cabecera en su línea |
| 7 | `git diff --name-only 9223318f a3742320`: sólo ficheros bajo `openspec/changes/cierre-f1c07-con-lo-construido/` | Cumple: `proposal.md` y `tasks.md` |
| 8 | Sin código de producción, sin `openspec/specs/`, sin ficheros de Supervisión, sin delta de specs | Cumple |

## Avisos, corregidos en este commit

1. **S-1** citaba la línea 4 del `proposal.md` archivado de `control-calidad-liberacion` como la del `maestro:`; es la 5.
2. **«Vacante → Director o Especialista»** citaba la D4 del archivado, que no habla de vacante; ahora cita la línea que lo dice.
3. **«Intervino» y el administrador con motivo** se citaban con un rango de cinco líneas en el que sólo la última, D8, trata de la
   pieza; ahora cada cosa lleva su línea.
4. **Contradicción interna:** la conclusión decía «una pieza» sin decisión y `tasks.md` hablaba de dos. Son dos (S-5 y S-6): el
   indicador de retrabajo sale de la fila sólo por la consecuencia (5) de c6, que es lectura de Supervisión, como la (2) admite
   para sí (`openspec/config.yaml:1896` en `9223318f`). Dicho igual en todos los sitios.
5. **«Checklist siempre»** figuraba como construida entera. Está construido el mecanismo; su contenido son tres casillas
   provisionales, supuestos de `control-calidad-liberacion` que nunca se publicaron
   (`docs/sdd/Supuestos_semana_2026-11-02.md:190`). Ahora la fila lo dice.
6. **S-5 condicionaba el cierre**, y su reversión decía que la fila no cerraría. e248 ya ordena el cierre; lo que deja abierto es
   el destino de la pieza. S-5 y S-6 fijan sólo el destino, y la tarea 2.2 manda parar únicamente si aparece otra pieza sin
   construir ni destino. El aviso salía también en el punto de supuestos frente a decisiones; es el mismo.

## Sugerencias, aplicadas en este commit

- La R01.3 no nombra C6 entre las filas que saca del corte; que esté entre «las otras siete» de 1C es deducción, y lo dice.
- El 2027 de la R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2410`) es de la épica 1E; para
  1D se cita el plan.
- «F1C-08 cerrada por archivo» lo dice la nota del 10/11 de su fila, no su columna de estado; la frase lo dice ahora.
- La tarea de persona de S-5 iba a «punto abierto con dueño (R-3)», que exige fecha; va a la lista semanal (E-237).
- El contraste gana la segunda mitad de la fila de la R01.1, «base de las etapas de validación con firma», con su gate de las
  firmas de certificados: cae en F1E-04 por `decision/roles-validacion-informe` y
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3274`.
- S-3 reconoce que M9.1, M1.7 y el §3.3 del maestro quedan desactualizados, contra la letra de R-1, y que sigue el precedente de
  los cierres sin código de F1B-04, F1B-13 y F1C-05.
- La tarea 3.4 nombra los dos sitios del título de `apps/desk/server/reconciliacion/registro.test.ts:218` en `9223318f` donde
  el molde de `8647518b` puso el ID.
- La tarea de persona sobre el maestro se parte: el cambio de fila de la foto, la guarda y la firma con imagen es debido desde el
  09/11; lo de «al encender» va aparte.
- «Para Supervisión», punto 4, añade el glosario
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5907`).

**Una cifra del verificador, corregida aquí.** Dio 18 requisitos vivos; la tabla cita 17 con su ruta y su línea, y son los 17 de
la comprobación 6.

## Lo que la verificación no cierra, y se dice

- **S-4, S-5 y S-6 son supuestos.** Ninguna respuesta de Gerencia dice que lo construido detrás de un interruptor apagado cuente
  —e248 (3) lo implica al ordenar el cierre—, ni fija el destino del checklist del diagnóstico ni el del indicador de
  retrabajo. Los tres van a la lista semanal de supuestos (E-237).
- **Las comprobaciones en la aplicación** de `control-calidad-liberacion`, con el interruptor encendido en un entorno de prueba:
  que estén hechas es hipótesis; van como tarea de persona.

## Códigos sobre el árbol de este informe

| Comando | Salida |
|---|---|
| `npm test` | Se corre sobre el commit de este informe: su código y sus cifras van en el registro del intento |
| `npm run typecheck` | Ídem |
| `npm run lint -- --max-warnings 165` | Ídem |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit>` | Ídem |

## Lo que el archivo tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1C-07 sigue «en curso» y la prueba de la lista
(`apps/desk/server/reconciliacion/registro.test.ts:218` en `9223318f` y
`apps/desk/server/reconciliacion/registro.test.ts:220` en `9223318f`) está en verde. Al moverla a `openspec/changes/archive/`
con `cierra: si`, el barrido la cuenta «por archivo» y esa prueba tiene que ponerse roja. Si no se pone roja, la prueba no
distingue y hay que parar.
