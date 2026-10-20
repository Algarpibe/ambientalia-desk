# Informe de archivo — `calibracion-directa` (F1C-08, `cierra: si`)

Fecha: 2026-10-20. Rama `calibracion-directa`, base `96e35cf9` (en `main`: `decision/f1c08-ov-calibracion`). Verify: **PASS con
avisos** (0 CRITICAL, 3 WARNING, 4 SUGGESTION), `verify-report.md`, con adenda de la remediación del intento 6b que cierra W-1 y
W-2. Informe escrito por el orquestador con cifras medidas, no por el agente de archivo.

**Qué cubre de la fila F1C-08 (R01.4:106) y qué deja fuera, en una línea:** cubre la calibración directa entera —atajo
`Ingresado` → `En Proceso` sólo para tickets de tipo «Calibración» con orden de venta asignada, escape a la ruta completa para
cotizar si aparece una falla y paso obligado por Control de calidad, impuestos por el servidor detrás de
`CONTROL_CALIDAD_LIBERACION`—; la ruta abreviada de equipo sin novedad no se construye por decisión (`R08.4.md:2286`, nº 59), y lo
que depende del checklist dinámico es de F1D. Por eso `cierra: si`.

## 1. Fusión en las specs vivas

Sólo ADDED, añadidos al FINAL de cada spec viva por script (`fusiona-cdi.mjs`, fuera del repositorio), con comprobación de
identidad bloque a bloque tras escribir. Las dos specs vivas titulan sin el prefijo «Requirement:» y la fusión lo quita, como hizo
F1C-07.

| Capacidad | Requisitos añadidos | Líneas |
|---|---|---|
| `transitions-st` | RQ-TS-52 a RQ-TS-59 | +209 |
| `permissions` | RQ-PM-38 a RQ-PM-41 | +96 |

**Cifras vivas sustituidas en su sitio, a igual número de líneas** (24 sustituciones en 24 líneas, con un script que exige una
sola coincidencia por sustitución y el mismo número de líneas antes y después, `sustituye-cdi.mjs`, fuera del repositorio):

- `transitions-st` RQ-TS-06: las filas 4 y 6 nombran la condición (1) de la calibración directa (RQ-TS-54) en el `409` de la misma
  línea y la descripción de la falla (RQ-TS-55) en el `422` agregado.
- `transitions-st` RQ-TS-26: 38 / 46 / 23, con «Previously, hasta F1C-08: 36 / 44 / 23, fijadas por F1C-07».
- `transitions-st` RQ-TS-44: 52 filas desde F1C-08 (38 de servicio); las dos nuevas, con su tipo y su fuente, en la línea de
  «Servicio», sin filas nuevas en la tabla.
- `transitions-st` RQ-TS-50: la línea de cifras remite a RQ-TS-58 desde F1C-08. El resto queda como registro de F1C-07.
- `transitions-st` RQ-TS-07 y RQ-TS-11, y `permissions` RQ-PM-03: **caso A falso que venía de antes**. Seguían diciendo 31
  transiciones, 93 casos (55/38) y 33 ejecuciones desde F1C-10, aunque F1C-01, F1C-02 y F1C-07 habían subido las cifras. Pasan a
  38 transiciones, 114 casos (69 prohibidos y 45 permitidos) y 44 ejecuciones, medidos por `permisos.test.ts` y
  `transicionesEjecucion.test.ts`, con un «Previously» que nombra la cifra de `96e35cf9` y dice que el texto se había quedado atrás.
- `openspec/config.yaml:110` (descripción de `transitions-st`): «38 transiciones y 23 estados». Lo cambió el lote 3 (`47368e68`),
  no este commit.
- **No se tocan** RQ-TS-05 (no hay estado nuevo: la alcanzabilidad no cambia) ni RQ-TS-27, registro fechado de F1C-09 (caso B).

**Parte con carga de revisión** (regla del archivo), proyectada antes de aplicar: fusión 305, sustituciones 24 + 24 e informe
≤ 160, unas 515 líneas, bajo 800. Medida final en la §3.

## 2. Intentos del registro (todos `passed`, medida `git diff --shortstat --no-renames` contra el commit de partida; 0 líneas
sin trackear en cada cierre; ningún binario)

| Intento | Contenido | Commit | Líneas |
|---|---|---|---|
| I1 | propuesta y deltas | `6e8319e3` | 519 |
| I2 | diseño y tareas, RQ-TS-56 reescrito (S-14) | `98b4f2f6` | 348 |
| I3 | lote 1a: catálogo, regla pura, interruptor, reentrancia, cifras y vigilantes | `4f835bd0` | 577 |
| I3b | lote 1b: condición (3) como propiedad del grafo | `0f33d25a` | 100 |
| I4 | lote 2: guardas del servidor | `5e47b33b` | 398 |
| I5 | lote 3: cliente, `DEPLOY.md` §16, regla 13, barrido de citas, corrección 36 del maestro | `47368e68` | 143 |
| I6 | verify | `ac1abd65` | 153 |
| I6b | remediación del verify (W-1, W-2, S-1) | `8e869803` | 132 |
| I7 | archive (este) | ver §3 | ver §3 |

Ningún intento superó la válvula de 720. Techo del archive: 3.400 (2 × 1.300 de la carpeta + 800).

## 3. Códigos y medida del commit de archivo

Cadena de cierre del I7, en serie y en primer plano, el 2026-10-20, sobre el árbol del archive con este informe ya escrito salvo
esta sección:

| Código | Resultado |
|---|---|
| `npm run typecheck` | 0 |
| `npm run lint` | 0, con 165 avisos (la cifra de partida) |
| Detector de citas | 0 sobre un commit temporal con el árbol del archive (`git commit-tree`, sin mover la rama), y 0 otra vez con `--sha HEAD` tras el commit de archivo. Las mismas 13 abreviadas rotas informativas que en `main` |
| `npm test` | 0: 307 ficheros pasan y 3 se saltan (310); 5.212 pruebas pasan y 11 se saltan (5.223) |
| `npm run build`, aparte | 0; `index-C4Y09m4Y.js`, 424.619 bytes (121,80 kB gzip): el mismo del lote 3, el archive no toca el cliente. Frente a `main` (`index-CVU9N07K.js`, 422,92 kB), +1,7 kB |

La primera pasada de `npm test` dio 1 fallo esperado: `apps/desk/server/reconciliacion/registro.test.ts` (11f/05g) fija la lista
real de tandas, y F1C-08, al archivarse con `cierra: si`, sale de «en curso» y entra en «cerradas por archivo». Se corrigió dentro
de sus dos líneas (molde de F1C-06) y la cadena se repitió entera desde el typecheck.

**Medida del commit de archivo** (`git diff --shortstat --no-renames 8e869803`): 18 ficheros, 1772 inserciones y 1326 borrados;
0 líneas sin trackear; ningún binario. Con detección de renombrado son 472 y 26. **Parte con carga de revisión** (regla del
archivo): 353 en las dos specs vivas (329 inserciones y 24 borrados, que son las líneas sustituidas), 4 en `registro.test.ts` y 141
de este informe: 498, bajo 800.

## 4. Lo que la tanda deja al encender

- **Interruptor:** el mismo `CONTROL_CALIDAD_LIBERACION` (`packages/zoho-sync/src/config.ts:125`), que nace cerrado; no hay
  variable nueva. Apagado, todo como hoy: las dos transiciones dan `409` y el panel no las enseña. Encendido, el atajo se ofrece a
  los tickets «Calibración» con OV en `Ingresado` y el escape a los «Calibración» en `En Proceso`. `DEPLOY.md` §16 lo explica con
  sus dos frases (`DEPLOY.md:803-810`). Se enciende en enero, junto con `DECISIONALES_POR_CARGO`.
- **Sin migración.** Ningún estado nuevo; ninguna columna nueva.
- **Regla 13:** tabla de nueve decisiones del cliente, cada una con la línea del servidor que la impone, en `apply-progress.md`
  (lote 3); el verify la contrastó fila a fila contra el árbol, sin desvíos.

## 5. Mutaciones

Las obligatorias del encargo, todas cazadas en el apply y REPRODUCIDAS en el verify (18, con `restaurado=true`): el atajo sin OV de
calibración; el atajo con el interruptor apagado; el atajo que se salta Control de calidad (destino `Por Facturar`, y el interruptor
que deja de quitar `finalizacion_servicio`); sin escape y un escape que no lleva a cotizar (destino `Por Facturar` o `Finalizado`);
el atajo y el escape ofrecidos a un tipo que no es Calibración; y la POSICIÓN de la guarda nueva (antes del interruptor, tras el
`403` de área, tras el `422` agregado: P1, P2 y P3, regla de mutación 1). Más M7 (descripción), M8 (traza) y PM-41 (tipo de
evento). En la remediación, dos más reproducidas por el orquestador (autor que firma y servidor que no lee la asociación).
**Declarado:** CD-1, CD-2, CD-5 y CD-6 no tuvieron rojo previo, porque la cláusula del interruptor del lote 1a ya existía; su rojo
lo dan P1 y M2.

## 6. Barrido de citas (regla de mutación 4)

Sobre todo lo que tocó la rama (lote 3, `apply-progress.md`): ningún fichero existente desplaza líneas (las inserciones van al
final y el resto es igual número de inserciones y borrados). 899 citas a líneas cuyo texto cambió: 744 en
`openspec/changes/archive/` (caso B, no se tocan) y 155 fuera; de ellas, 63 casos A ciertos, 2 casos A falsos reparados
(`packages/shared/src/bodegaje.test.ts:105` y `packages/shared/src/bodegaje.ts:12`) y 90 casos B. El archive añade al final de las
specs vivas (no desplaza) y sustituye a igual longitud.

## 7. Supuestos para la lista semanal de Gerencia (reversibles)

S-1 el mismo interruptor que Control de calidad; S-2 la condición (1) es una declaración (tipo y OV asignada), no se lee la OV;
S-3 el atajo es Operativo y lleva los campos de `ingreso_a_servicio`; S-4 el escape lo ve cualquier ticket «Calibración» en
`En Proceso`; S-5 el escape vuelve a `Rev./Diagnostico`; S-6 ninguna propone derivación; S-7 nombres «Calibración directa» y
«Falla en calibración»; S-8 `409` para lo que quita el interruptor; S-9 quien ejecuta el atajo «intervino» y no firma el Control de
calidad; S-10 «OV asignada» por las tres vías; S-11 el tipo se compara exacto («calibración» en minúscula no toma el atajo); S-12 el
cliente mira una sola vía de OV y oculta de más, nunca de menos; S-13 alternativa al destino del escape: `Notificación Comercial`;
**S-14 la condición (3) se lee como «el trabajo terminado pasa por Control de calidad»: con el interruptor encendido, los tres
rechazos Decisionales (`rechazo_comercial`, `rechazo_cliente`, `rechazo_revision`) siguen llegando a `Por Facturar` sin pasar por
él, como ya ocurría con F1C-07**; S-15 la descripción de la falla vive sólo en la traza; S-16 el atajo no es marca de ingreso: el
indicador 49 queda sin dato para esos tickets.

## 8. Fuera del recuento — de personas, no de esta tanda (regla del ciclo 1; archivar NO los da por hechos)

| Pendiente | Dueño | Dónde queda escrito |
|---|---|---|
| Supuestos S-1 a S-16, en especial S-14 (matiza la condición (3)) y S-5/S-13 (destino del escape) | Gerencia (lista semanal) | §7 |
| Pegar en el maestro la corrección 36 (M2.1: el tipo de servicio de F1B-03 no oculta pasos) | Gerencia | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| Encender el interruptor en enero, junto con `DECISIONALES_POR_CARGO` (enciende también el atajo y el escape) | Gerencia | `DEPLOY.md` §16 |
| Línea `CONTROL_CALIDAD_LIBERACION=` en `.env.example` (la sesión no puede editar ese fichero; ya pendiente desde F1C-07) | Supervisión | este informe |
| Pruebas en la app con el interruptor apagado y encendido (escenario MANUAL de RQ-PM-39) | Gerencia (ronda final) | lista de pruebas pendientes |

## 9. Avisos del verify y hallazgos

- W-1 y W-2: cerrados en el intento 6b (adenda del `verify-report.md`). W-3 sigue como aviso: RQ-TS-55 y RQ-TS-56 se ajustaron a lo
  medido durante el apply y sus mutaciones caen.
- SUGGESTION S-2: el cliente no tiene prueba (decisión F0-00); S-3: recogido en la §5.
- **Para la bandeja (S-4 del verify), anteriores a esta rama:** `openspec/specs/transitions-st/spec.md:44` («exactamente 31
  entradas») y las «otras 32» de `transitions.ts:262` en `derivacion-avisos` y `transitions-st` siguen con cifras viejas.
