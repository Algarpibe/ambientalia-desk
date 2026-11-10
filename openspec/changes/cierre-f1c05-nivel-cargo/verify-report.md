# Verify · `cierre-f1c05-nivel-cargo` (F1C-05, `cierra: si`)

**Fecha:** 2026-11-10 · **Rama:** `cierre-f1c05-nivel-cargo` · **Verificado sobre:** `bf8de7ea` (partida `0e2b609b`), con
las correcciones de este mismo commit · **Informe escrito por el orquestador**, con cifras medidas por él. La lectura de cada
cita en su ancla la hizo además, por su cuenta, un agente de sólo lectura que no escribió la propuesta.

## Veredicto: PASS — 0 críticos; 6 avisos y 4 sugerencias, todos corregidos en este commit

## Qué se comprobó

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Cabecera de siete campos en `proposal.md`, con `tanda: F1C-05`, `cierra: si`, `origen_cabecera: declarada` y `maestro` no vacío | Cumple. F1C-05 tiene fila en la R01.1 con fuente «M1.9.1» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:178`), y el `maestro:` la contiene, así que el barrido no la marca «sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:237-239`) |
| 2 | Forma de cada cita `ruta:línea` de `proposal.md` y `tasks.md`, en su ancla: fichero existente, los dos extremos en rango y ninguno en línea vacía | 193 de 193 sobre `bf8de7ea`, 4 de ellas abreviadas; 198 de 198 tras las correcciones. Script propio que lee cada extremo con `git show <ancla>:<ruta>` o en el árbol |
| 3 | Que cada cita diga lo que afirma su frase, extremo inicial y final por separado | Una caducada y una que atribuía de más (avisos 1 y 6, abajo); corregidas. Las demás, sí |
| 4 | ¿Queda alguna pieza de la fila sin construir y archivar? | No. El propietario del registro sale por la consecuencia (2) a F1C-13, y con él las dos restricciones que sus propias fuentes llaman nivel propietario (S-5). Los Decisionales están construidos detrás del interruptor que `decision/e248-adelanto-f1c` (2) mantiene apagado (S-4) |
| 5 | ¿Contradicen S-4 o S-5 una decisión registrada, o cambian el alcance de una fila? | No. S-4 lo ordena `openspec/config.yaml:5086` en `0e2b609b`, y e248 (1) cuenta igual F1C-03 (`openspec/config.yaml:5732` en `0e2b609b`). S-5 se apoya en «LA RESTRICCIÓN POR PROPIETARIO» (`openspec/config.yaml:4011` en `0e2b609b`) y en «es el nivel «propietario del registro», aplazado» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2037`); ninguna decisión sitúa esas dos piezas en otra fila |
| 6 | Que cada requisito de «Las piezas, en las specs vivas» esté en la línea citada | 23 de 23: RQ-PM-12 a RQ-PM-24, RQ-PM-28 a RQ-PM-31, RQ-TS-06, RQ-TS-08, RQ-TS-09, RQ-TS-35, RQ-TS-36 y RQ-AV-23, cada uno con su cabecera en su línea |
| 7 | `git diff --name-only 0e2b609b bf8de7ea`: sólo ficheros bajo `openspec/changes/cierre-f1c05-nivel-cargo/` | Cumple: `proposal.md` y `tasks.md` |
| 8 | Sin código de producción, sin `openspec/specs/`, sin ficheros de Supervisión, sin delta de specs | Cumple |

## Avisos, corregidos en este commit

1. **`proposal.md`, «Fuera de la fila», E-098.** Decía que su pieza nueva «está sin destino», citando `docs/sdd/ENTRADA.md:1359`
   en `0e2b609b`. Esa línea lo dice, pero el encabezado de la entrada la da por decidida en E-142
   (`docs/sdd/ENTRADA.md:1355` en `0e2b609b`), y E-142 la manda a 2027 (`docs/sdd/ENTRADA.md:1689` en `0e2b609b`). Ahora dice
   las dos cosas.
2. **`proposal.md`, «Riesgos».** La cita en prosa a las líneas 218 y 220 de `registro.test.ts` iba sin revisión, y ese fichero
   cambia al archivar. Ahora dice que están contadas en `0e2b609b`.
3. **`proposal.md`, «Lo que sigue abierto», y `tasks.md`.** Daban por hipótesis que el fichero de ejemplo de entorno llevara
   `DECISIONALES_POR_CARGO`. Lo lleva (`.env.example:40-41`). La frase lo dice, y la tarea de persona sale de la tabla y pasa a
   las ya hechas.
4. **`proposal.md`, «Para Supervisión», punto 2.** Nombraba sólo `openspec/config.yaml:4019` en `0e2b609b` entre las menciones
   que siguen poniendo el propietario en F1C-05. Faltaban el título de la (4) de la misma decisión
   (`openspec/config.yaml:4011` en `0e2b609b`) y `decision/orden-ocho-tandas-06-10` (3) (`openspec/config.yaml:4302` en
   `0e2b609b`).
5. **`proposal.md`, S-6.** «Ni la fila ni sus decisiones de respaldo los nombran» era cierto, pero callaba que E-092 y el Anexo D
   nº 75 sí atan los dos campos de cargo a F1C-05. Ahora lo dice, que es lo que hace de S-6 un supuesto.
6. **`tasks.md`, primera tarea de persona.** Atribuía a la P.2 de `permisos-por-cargo` «el botón y el `403`», y la línea citada
   sólo habla del botón (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:110`). Ahora copia lo que dice.

## Sugerencias, aplicadas en este commit

- La fila «El área es la base…» del contraste citaba, para el administrador, el S-1 de `permisos-por-cargo`, que trata de otra
  cosa: lo estricto mientras nadie tenga cargo. Ahora cita RQ-PM-19 (`openspec/specs/permissions/spec.md:464`).
- Las tres «Anulación» no tienen requisito vivo con escenario propio. La tabla de requisitos lo dice ahora, y dice que las cubre la
  regla general de RQ-PM-29 con el área Comercial que les da `decision/f1c04-tabla-tipos-validada` (4).
- RQ-PM-12 dice hoy «Ocho cargos». La tabla de requisitos aclara que el octavo es de F1C-11.
- S-3 se apoyaba en «los precedentes de F1B-04 y F1B-13». Otros cambios de F1B-04 llevan `toca_maestro: si`, así que ahora dice
  «los cierres sin código de F1B-04 y F1B-13».

**Una cifra del verificador, corregida aquí.** Dio 27 requisitos vivos, y la tabla tiene 23. Para E-142 citó su encabezado; la
línea que dice «E-098 → 2027» es la 1689, y es la que va citada.

## Lo que la verificación no cierra, y se dice

- **S-4 y S-5 son supuestos.** Ninguna decisión dice con esas palabras que lo construido detrás de un interruptor apagado cuente,
  ni que las dos restricciones viajen con el propietario. Los dos van en la lista semanal de supuestos (E-237) y en la de
  Supervisión, punto 1, para que la fila F1C-13 pueda nombrarlas.
- **Las comprobaciones en la aplicación** de `permisos-por-cargo` y `liberacion-sin-factura-motivo-fecha`: que estén hechas sigue
  siendo hipótesis; van como tarea de persona.

## Códigos sobre el árbol de este informe

| Comando | Salida |
|---|---|
| `npm test` | 0 · 6.435 pasan, 26 omitidas (263 s; 8,2 GB libres al arrancar) |
| `npm run typecheck` | 0 |
| `npm run lint -- --max-warnings 165` | 0 · 0 errores, 165 avisos |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit>` | Se corre sobre el commit de este informe, que no existe al escribirlo: su código y sus cifras van en el registro del intento |

## Lo que el archivo tiene que ver en rojo

Con la carpeta fuera de `archive/`, F1C-05 sigue «en curso» y la prueba 11f/05g
(`apps/desk/server/reconciliacion/registro.test.ts:218` en `0e2b609b` y
`apps/desk/server/reconciliacion/registro.test.ts:220` en `0e2b609b`) está en verde. Al moverla a `openspec/changes/archive/` con
`cierra: si`, el barrido la cuenta «por archivo» y esa prueba tiene que ponerse roja. Si no se pone roja, la prueba no distingue y
hay que parar.
