# Informe de archivo — `poblacion-cierre-variante-47-51` (F1F-05, `cierra: no`)

Archivado el 2026-10-23 en la rama `poblacion-cierre-variante-47-51` (worktree hermano, base `f0eb92c4`), **sin fusionar a `main`**: la
tanda para antes de fusionar. Lo escribe el orquestador con cifras medidas; `apply-progress.md` y `verify-report.md` son instantáneas de su
momento.

**Fila F1F-05:** cubre la población por defecto de los indicadores (`decision/e224b-poblacion-indicadores`: cerrados en el periodo, sin
anulados, en los dos endpoints) y la variante de Zoho del 47 y del 51 contra el cierre (`decision/e224c-formulas-47-51-y-contraste`), con
los migrados por la fecha de Zoho (`decision/h1-fechas-migrados`); deja fuera la encuesta de satisfacción (55), que depende de la salida de
correo de 1H-01. Por eso `cierra: no`.

## 1. Qué queda construido

- **Día de cierre** `diaDeCierreDelTicket` en `packages/shared/src/diaDeCierre.ts` (D1): la última transición a «Finalizado» manda; sin
  ella, `closed_time`; el cierre de la migración no cuenta; día civil de Bogotá. `TRANSICIONES_A_FINALIZADO` se deriva del catálogo
  compartido y un guardián fija que son las cinco de D1 (S-7).
- **Variantes de Zoho** del 47 (cierre − remisión de entrada) y del 51 (cierre − finalización ST) en `packages/shared/src/indicadores.ts`,
  en sus líneas 238 y 241 y con `contraCierre` al final; «sin dato» nombra el hito que falta (`MOTIVO_CIERRE`, en la línea 88).
- **Lectura por cierre** en `apps/desk/server/indicadores.ts`: sólo `status_type = 'Closed'` en SQL, corte por día de cierre en memoria
  (`fueraDelPeriodo`, `apps/desk/server/indicadores.ts:60`) y `poblacionPorCierre` al final, que poda historial, vistos y clasificaciones.
  Cuatro consultas, sólo lectura (S-2). El `POST` de comparación hereda la lectura (D5).
- **Aceptación de septiembre**: fixture anonimizado de trece tickets (`apps/desk/server/testing/septiembre2026.ts`, sólo las claves de
  S-10) y una prueba por indicador contra las celdas de Gerencia, ±1 en números e igualdad en el 54.
- **Sin cambios en `apps/desk/src`** (regla 13): `git diff --stat f0eb92c4 HEAD -- apps/desk/src` vacío.

## 2. Spec viva

Fusión por script del delta en `openspec/specs/kpis/spec.md` (1.475 → 1.650 líneas), ensayada en el scratchpad antes de tocar el árbol:

- **MODIFIED en sitio, a igual longitud:** RQ-KP-11 (51 líneas), RQ-KP-13 (22), RQ-KP-22 (40), RQ-KP-25 (31) y la fila SP-5 de la tabla
  «0 · Procedencia y método» (1). Ninguna línea de la spec viva se desplaza: el `git diff -U0` sólo trae trozos de igual tamaño y uno
  añadido tras la línea 1.475.
- **ADDED al final:** RQ-KP-34 a RQ-KP-39, de `openspec/specs/kpis/spec.md:1477` a `openspec/specs/kpis/spec.md:1634` y siguientes.
- **Comprobación:** cada uno de los diez bloques y la fila SP-5 de la spec viva es idéntico al del delta (salida 0); 45 de 45 escenarios.
  En los MODIFIED se conservan los títulos de escenario vivos salvo dos, **reescritos, no perdidos**: en RQ-KP-11, «El 51 calculado sigue
  sin variante de Zoho» pasa a «El 51 de Zoho cuenta hasta el cierre» (con `decision/e224c` el 51 ya tiene variante y el título viejo
  sería falso); en RQ-KP-22, «Respuestas de tickets fuera del periodo» pasa a «… fuera de la población».
- **Cita reapuntada (caso A, L3.13):** la línea 1447 de la spec viva citaba la 70 de `apps/desk/server/indicadores.ts` para «sin parámetro
  el único corte es el periodo»; hoy ese corte es la 60. Misma línea, sin desplazar nada.
- **W1 del verify, decidido al archivar:** la spec no se toca. `design.md` D4 ya lo declaraba
  (`openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/design.md:113-117`): la consulta de la encuesta
  (`apps/desk/server/indicadores.ts:85`) trae las respuestas de todos los cerrados y `vistos` las poda en memoria
  (`apps/desk/server/indicadores.ts:87`); lo observable —sólo cuentan y sólo viajan las de la población— es lo que dice RQ-KP-22, y lo
  fijan las pruebas de `poblacionPorCierre.test.ts`. Supuesto reversible: si se prefiere que el texto describa la sentencia, se precisa
  en sitio en otra tanda.

## 3. Mudanza

`cp -R` de la carpeta a `openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51` y `diff -r` origen/destino **vacío (salida
0)**, seis ficheros; después `git rm -r` del origen. Git los registra como seis `R100`. `reviewGate` ausente (RDD apagado): delivery bajo la
política ordinaria del repositorio.

## 4. Registro de intentos (`gentle-ai sdd-attempt`), medida = `git diff --shortstat --no-renames` + sin trackear

| # | Unidad | Base → final | Líneas | Registro |
|---|---|---|---|---|
| 1 | propuesta + spec | `f0eb92c4` → `7e01ffc2` | 512 | 512 |
| 2 | diseño + tareas | `7e01ffc2` → `afe2a1eb` | 363 | 363 |
| 3 | apply L1 (shared) | `afe2a1eb` → `33f5ef91` | 280 | 280 |
| 4 | apply L2 (servidor) y cita de `design.md` | `33f5ef91` → `95f93c13` | 357 | 357 |
| 5 | apply L3 (aceptación y barrido) | `95f93c13` → `bd66704f` | 236 | 236 |
| 6 | verify | `bd66704f` → `37fd84bf` | 175 | 175 |
| 7 | archive | `37fd84bf` → este commit | mudanza + revisable 348 (fusión 225, informe 123) | al asentar, con la reconciliación |

Ninguno pasa de la válvula de 720 salvo el archive, cuyo techo (3.300 ≈ 2 × 1.229 de la carpeta + 800) cubre la mudanza; su parte
revisable —fusión de 225 líneas (200 añadidas y 25 borradas, medida en el ensayo antes de aplicar) más este informe— queda por debajo de
800 (regla del archivo).

## 5. Verify y ejecución

Verify **PASS CON AVISOS**: 0 CRITICAL, 1 WARNING (W1, §2), 3 SUGGESTION; 10/10 requisitos, 45/45 escenarios, 39/39 tareas; validado por
`gentle-ai sdd-verify-validate`. Mutaciones M1-M8, G1 y las ocho M7 por indicador registradas en apply, con el mismo `sha256` del fichero
antes y después.

- En cada intento de código el orquestador repitió la cadena sobre el HEAD final, con `npm test` solo y en primer plano: L1 0 (314 ficheros,
  5.452 pruebas), L2 0 (315, 5.471), L3 0 (316, 5.482), verify 0 (316, 5.482). Typecheck 0, lint 0 con 165 avisos y detector 0 en todos.
- `npm test` en segundo plano llegó a morir por memoria del sistema (intento 2); en primer plano no ha vuelto a pasar.
- Las sugerencias S1 (escenarios literales del 47 y del 51 sin sus números), S2 (O-1 y O-2 abreviaban los rangos) y S3 (segundo escenario
  de RQ-KP-39 sin mutación propia) quedan registradas; S2 se recoge en §7.

## 6. Bundle

`dist/assets/index-DSTLJ8Eq.js`, 426.563 B (antes `index-eZJekTNg.js`, 426.466 B), sin tocar `apps/desk/src`. Los 97 B son la construcción
de `TRANSICIONES_A_FINALIZADO` (un `new Set(...)` de nivel superior en `packages/shared/src/diaDeCierre.ts`), que el empaquetador no
elimina porque se ejecuta al cargar el módulo; el cliente no la usa. Hojas de estilo sin cambio (`index-BXv9vVDm.css`). Build 0.

## 7. Pendiente fuera de la rama — lo hace el orquestador en `main` tras la fusión (la rama no toca `openspec/config.yaml`)

- **O-1 (caso B):** `openspec/config.yaml:4096` cita `packages/shared/src/indicadores.ts:88-89` (el motivo de entonces): anclarla «en
  `f0eb92c4`» y decir que hoy es `MOTIVO_CIERRE`.
- **O-2 (caso B):** `openspec/config.yaml:5199-5200` citan los rangos 59-60 y 67-70 de `apps/desk/server/indicadores.ts`: anclarlas «en
  `f0eb92c4`».
- **Siete citas de caso C** en `docs/sdd/` y en archivos de cambios anteriores, que esta tanda deja superadas: la lista, fichero a fichero,
  está en la sección 7 de `verify-report.md`.

## 8. Supuestos reversibles — a la lista semanal, bajo F1F-05

S-1 el cierre es la última transición a «Finalizado», si no `closed_time` · S-2 sólo lectura · S-3 los migrados por la fecha de Zoho, nunca
la de la migración · S-4 sin cierre que cuente: con periodo no entra, sin periodo sí · S-5 sin periodo, todos los cerrados no anulados · S-6
sin filtro de departamento · S-7 transición «a Finalizado» por el catálogo compartido · S-8 el cubo «fuera del periodo» conserva su nombre
para lo que queda fuera de la población · S-9 tolerancia ±1 día en la aceptación · S-10 fixture con sólo número, clasificación, estado,
fechas y columnas 47-59 · S-11 negativos del 47 y del 51 sin tope, con `orden_invertido`. Y dos de esta sesión: W1 sin tocar la spec (§2) y
el parámetro `formula` de `natural` que queda sin uso y no se retiró, para no mover líneas.

## 9. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Corregir, si procede, S-1 a S-11 | Gerencia | lista semanal de supuestos (regla E-237) |
| P-2 | Probar en la app los indicadores de septiembre por cierre | Gerencia / analista | lista acumulada de pruebas en la app |

## 10. Para la bandeja (la rama no toca `docs/sdd/ENTRADA.md`)

- Código muerto en el cliente: `TRANSICIONES_A_FINALIZADO` entra en el bundle sin uso (§6).
- `npm test` completo tarda entre 300 y 600 s en esta máquina y roza el plazo de 600 s de la herramienta de órdenes.

## 11. Qué se verá en «Análisis» (sólo administradores; P-2)

Los indicadores de un periodo cuentan los tickets **cerrados** en ese periodo, no los creados: septiembre pasa de un ticket a trece. Los
anulados y los abiertos no entran. El 47 y el 51 de Zoho dejan de salir «sin dato» y se calculan contra el día de cierre. La descarga y la
comparación con la exportación de Zoho usan la misma población.

Engram leído: propuesta 1820, spec 1821, diseño 1822, tareas 1823, apply-progress 1825, verify 1831.
