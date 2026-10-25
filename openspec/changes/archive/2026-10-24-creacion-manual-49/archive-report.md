# Informe de archivo — `creacion-manual-49` (F1F-05, `cierra: no`)

Archivado el 2026-10-24 en la rama `creacion-manual-49` (worktree hermano, base `186c2fe4`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe.

**Fila F1F-05.** Este cambio cubre la consecuencia (3) de `decision/f1f05-creacion-del-49-campo-manual`
(`openspec/config.yaml:5321-5344`): el fixture de septiembre separa el campo manual «Fecha creación ticket» de la creación del ticket, y
el 49 pasa a 8 celdas comparables.

Deja fuera tres cosas, por lo que sigue `cierra: no`:
- la encuesta (55);
- la medición en paralelo;
- la revisión futura de la definición del 49 por campo vacío o retrasado (consecuencia (4), fuera de F1F-05).

## 1. Qué queda construido

Sólo pruebas y su fixture. No cambia código de producción: `git diff --stat 186c2fe4 -- packages apps/desk/src` sale vacío.

**El fixture** (`apps/desk/server/testing/septiembre2026.ts`), editado en su sitio:
- `fechaCreacionTicket: string | null` va detrás de `creado`: en el tipo (`:11`), en `CLAVES_DEL_FIXTURE` (`:19`) y en los trece tickets.
- Las siete celdas de la referencia regenerada:

  | Ticket | `fechaCreacionTicket` | 49 |
  |---|---|---|
  | 940 | `2026-05-20` | 6 |
  | 941 | `2026-05-21` | 5 |
  | 957 | `null` | ya era `null` |
  | 972 | `null` | `null` |

- En los otros nueve, `fechaCreacionTicket` es igual a `creado`.
- La siembra lleva `t.fechaCreacionTicket` a `fecha_creacion_ticket` (`:60`, 9.º valor). `created_time` sigue saliendo de `creado`.

**Las dos aceptaciones:**
- `apps/desk/server/routes/indicadoresSeptiembre.test.ts:43` (RQ-KP-38): el 49 pasa de 9 a 8.
- `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:23` (RQ-KP-42): el 49 pasa de 9 a 8.

**Colocación.** Ningún fichero cambia de longitud: el fixture tiene 63 líneas, `indicadoresSeptiembre.test.ts` 64 e
`indicadoresComparacionSeptiembre.test.ts` 109. Ningún hunk inserta ni borra líneas, así que toda cita a esos ficheros sigue cayendo
donde caía. Entre ellas está `openspec/specs/kpis/spec.md:1776`, que cita `septiembre2026.ts:55-63`.

## 2. Rojo, verde y mutaciones

- **Rojo:** con las celdas nuevas y la siembra todavía en `t.creado`, fallaron 11 de 33, exactamente lo que preveía el diseño.
  - En RQ-KP-38 el 49 dio `sep-03: Gerencia 6, Desk 15` y `sep-04: Gerencia 5, Desk 15`.
  - En RQ-KP-42, `ticketsVariante` dio `{13, 11, 84.6}` y el 49 dio 8 comparados con 6 coincidentes.
- **Verde:** con la siembra de `t.fechaCreacionTicket`, 33 de 33.
- **M1** (volver a sembrar `t.creado`): rojo otra vez en el 49 de 940 y 941. La reprodujo también el verificador. El 972 no la caza: su
  celda de Gerencia es `null` y no se compara.
- **M2** (quitar la clave de `CLAVES_DEL_FIXTURE`): rojo en la prueba de claves.
- Las dos mutaciones se restauraron byte a byte (`cmp` idéntico).

## 3. Spec viva

La fusión se hizo por script, comparando bloques, y se ensayó en seco antes de aplicarla. Afecta a `openspec/specs/kpis/spec.md`, que
sigue en 1.808 líneas:

- **RQ-KP-38** (`:1607-1632`) y **RQ-KP-42** (`:1774-1808`) se modificaron en sitio, a igual longitud. Cada bloque ha quedado idéntico al
  del delta, salvo el fin de línea, que conserva el de la spec viva.
- Cambian tres líneas:
  - `:1612`: «49 → 8» con la cita de la decisión;
  - `:1781`: «49 (8, …)» con la misma cita;
  - `:1793`: «8 en el 49».
- La medida antes de aplicar fue de 3 inserciones y 3 borrados (`git diff --no-index --shortstat`), muy por debajo de 800 (regla del
  archivo).
- La decisión se cita por clave, no por línea, así que no la desplaza ningún commit de `openspec/config.yaml`.

## 4. Antes de la mudanza

- **A.1:** `proposal.md:26`, que describía la siembra vieja, quedó anclada «en `186c2fe4`» en su misma línea (caso B).
- Las tres citas completas a la ruta vieja de la carpeta se reapuntaron en su línea a la ruta archivada, que es donde viven tras el
  `git mv`: dos en `design.md` y una en `verify-report.md`.
- Las citas archivadas que describen el fixture viejo (la siembra de `t.creado` y «49 → 9») son caso B y no se tocan.
  - De `comparacion-juzga-variante`: `proposal.md`, `design.md`, `verify-report.md` y su delta.
  - De `poblacion-cierre-variante-47-51`: `verify-report.md`.

## 5. Registro de intentos (`gentle-ai sdd-attempt`)

La medida es `git diff --shortstat --no-renames` más las líneas de lo nuevo sin trackear.

| # | Unidad | Base → final | Líneas | Registro |
|---|---|---|---|---|
| 1 | propuesta + spec | `186c2fe4` → `5919c5b2` | 210 | 210 |
| 2 | diseño + tareas | `5919c5b2` → `f0df7ebf` | 175 | 175 |
| 3 | apply L1 | `f0df7ebf` → `9572518b` | 142 | 142 |
| 4 | verify | `9572518b` → `d770e5ef` | 87 | 87 |
| 5 | archive | `d770e5ef` → este commit | la mudanza más lo revisable 153 (fusión 6, informe 133, anclas y casillas 14) | al asentar |

- Ningún intento pasó de la válvula de 720.
- En el intento 2, `npm test` salió 1 en tres pasadas por timeouts de 30 s en las pruebas del hook de citas, con la máquina cargada. Las
  pruebas fallidas eran distintas en cada pasada, y `hook.test.ts` pasaba 17 de 17 cuando se corría solo. Liberada la máquina, salió 0
  (`npmtest-211744.log`) y se asentó.

## 6. Verify y ejecución

- **Verify: PASS con avisos.** Cero críticos, un aviso y una sugerencia.
  - El aviso, `proposal.md:26`, quedó resuelto por A.1.
  - La sugerencia es que M1 no caza el 972, como ya decía la propuesta.
- El verificador recalculó los 49 con lunes a viernes hasta el 28/05 y salen 15, 6 y 5.
- **Detector.** Bloqueó cuatro rutas abreviadas del propio `verify-report.md` («fichero inexistente»), que se completaron en su línea
  (`33949d3d`). Al completarlas, las abreviadas de esas filas pasaban a atribuirse al fichero archivado; se escribieron con la ruta del
  fixture (`d770e5ef`). Después, detector 0 con 13 abreviadas rotas, las mismas que en la base.
- **Cadena del intento 4:** typecheck 0, lint 0 (165 avisos, los de siempre) y `npm test` 0 en primer plano, con 317 ficheros y 5.520
  pruebas (`npmtest-220227.log`).
- **Bundle:** sin cambio de cliente, no hay bundle nuevo.

## 7. Pendiente fuera de la rama (la rama no toca `openspec/config.yaml`)

Supervisión tiene en `main`, sin commitear, +9 líneas en `openspec/config.yaml` tras la 4733 y +385 tras la 5454. Cuando se commiteen,
la cita `openspec/config.yaml:5321-5344` de este cambio pasará a la 5330-5353. Esa cita aparece en `proposal.md`, en `design.md`, en
`tasks.md` (P-2) y en este informe, y se repara con el barrido de la regla de mutación 4 de ese commit.

## 8. Supuestos reversibles — a la lista semanal, bajo F1F-05

- **S-1:** el escenario de `:1793` pasa también a 8.
- **S-2:** los MODIFIED conservan su número de líneas.
- **S-3:** `fechaCreacionTicket: string | null` va detrás de `creado`, con `null` en 957 y 972.
- **S-4:** el fixture se edita sin desplazar líneas.
- **S-5:** la prueba del 998 mira `creado` y no cambia.

## 9. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Corregir, si procede, S-1 a S-5 | Gerencia | Lista semanal de supuestos (regla E-237) |
| P-2 | Revisión futura de la definición del 49 por campo vacío o retrasado | Gerencia | `decision/f1f05-creacion-del-49-campo-manual` |

## 10. Qué se verá en la aplicación

Nada nuevo. La aplicación ya calculaba el 49 desde el campo manual, así que este cambio sólo corrige la prueba que lo juzga. Con la
referencia regenerada, la comparación de septiembre debería dar 8 de 8 en el 49 y 13 de 13 tickets con la variante.

Engram: propuesta 1864, spec 1865, diseño 1866, tareas 1867, apply-progress 1870, verify 1871.
