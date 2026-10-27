# Progreso del apply — `areas-soporte-remoto` (F1B-09, `cierra: no`)

Lote L1, intento 2. Partida: `091c4f73` (planificación cerrada; intento 1 asentado). Lo ejecuta el orquestador en el worktree
`C:\dev\Desk_2_R1.023-worktrees\areas-soporte-remoto`; la casilla L1.7 toca además el fichero de trabajo de `main`. Modo `strict_tdd`
sin código nuevo: la evidencia es mutación con control (`design.md` D5). Conjunto de ejecución:
`npx vitest run packages/shared/src/transitionsSoporteRemoto.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/permisos.test.ts apps/desk/server/flujoSoporteRemoto.test.ts apps/desk/server/services/avisoArea.test.ts`.

## L1.1 · M0 — control

Sin mutar nada: **5 ficheros, 127 pruebas, 127 en verde** (`transitionsSoporteRemoto.test.ts` 7, `invariantesGrafo.test.ts` 45,
`avisoArea.test.ts` 14, `flujoSoporteRemoto.test.ts` 26, `permisos.test.ts` 35). sha256 de `git diff -- packages/shared/src/transitions.ts`:
`e3b0c442…` (vacío).

## L1.2 · M1 — `asignacion_soporte` → `'Comercial'`, antes de editar

Mutación en la línea 389 de `packages/shared/src/transitions.ts`. **9 rojas, 118 verdes (127)**, exactamente las que preveía `design.md` D5:

- `packages/shared/src/transitionsSoporteRemoto.test.ts` › (d) «… del área Servicio Técnico por equivalencia (S-1, RQ-SR-02); …» (título viejo)
- `packages/shared/src/invariantesGrafo.test.ts` › «corrección (b)»; aserción: «asignacion_soporte no es de Servicio Técnico (S-1)» (mensaje viejo)
- `apps/desk/server/permisos.test.ts` › matriz SR, «… a un usuario de Comercial» y «… a un usuario de Servicio Técnico»
- `apps/desk/server/flujoSoporteRemoto.test.ts` › P1, P2 y P8
- `apps/desk/server/services/avisoArea.test.ts` › `areasSiguientes(Solicitud Soporte, SR)` y `areasAAvisar(Solicitud Soporte, …)`

Restaurada: sha256 del diff de `transitions.ts` otra vez `e3b0c442…`. *Incidencia:* `sed -i` de Git Bash dejó el fichero en LF (diff vacío,
estado `M`); se devolvió a su checkout CRLF con `git checkout` ANTES de cualquier edición. Desde ahí las mutaciones se hacen con `perl -pi`,
que conserva CRLF.

## L1.3 · M2 — `ejecutar_soporte` → `'Comercial'`

Mutación en la línea 391. **7 rojas, 120 verdes (127)**: (d), «corrección (b)», la matriz SR con Comercial y con Servicio Técnico, y P2, P4 y
**P9** de `flujoSoporteRemoto.test.ts` (P9, la que la propuesta omitía y `design.md` D5 añadió). `avisoArea.test.ts` sigue en verde, como
preveía el diseño (sólo lee la salida de `Solicitud Soporte`). Restaurada: sha256 `e3b0c442…`.

## L1.4 · Ediciones (a)–(e), en sitio

Sustituciones de subcadena de `design.md` D3, cada una en su línea; `wc -l` idéntico antes y después en los cuatro ficheros (397, 67, 482, 461):

| Edición | Fichero | numstat |
|---|---|---|
| (a) comentario del catálogo | `packages/shared/src/transitions.ts` | 1/1 |
| (b) título de la prueba (d) | `packages/shared/src/transitionsSoporteRemoto.test.ts` | 1/1 |
| (c) mensaje de «corrección (b)» | `packages/shared/src/invariantesGrafo.test.ts` | 1/1 |
| (d) y (e) comentarios de la matriz SR | `apps/desk/server/permisos.test.ts` | 2/2 |

Ningún `area` cambia. Las cifras «4×3» y «(4 permitidos, 8 prohibidos)» se quedan (S-C).

## L1.5 · M1 otra vez, tras las ediciones

sha256 del diff de `transitions.ts` antes de mutar: `fed3d9e0…` (sólo el hunk de (a)). **Las mismas 9 rojas**, y ahora enseñan el texto nuevo:
el título «(d) … por decisión de Gerencia (decision/e090-areas-soporte-remoto, RQ-SR-02); …» y la aserción «asignacion_soporte no es de
Servicio Técnico (RQ-SR-02, decision/e090-areas-soporte-remoto)». Restaurada: sha256 `fed3d9e0…`, fichero en CRLF. Verde final del
conjunto: **127/127**.

## L1.6 · `openspec/config.yaml` de la rama — (f) y (g)

- (f) en la línea de `openspec/config.yaml:4195` en `094196b9`: « en `3ec3703e`» tras sus dos citas (S-D y S-G).
- (g) en la línea de `openspec/config.yaml:5375` en `094196b9`: « en `094196b9`» tras su cita a la spec.
- numstat 2/2; `wc -l` 5627 antes y después. Las tres anclas resuelven: `openspec/specs/transitions-soporte-remoto/spec.md:108-109` en `3ec3703e`
  y `openspec/specs/transitions-equipo-nuevo/spec.md:264-267` en `3ec3703e` decían «**MUST NOT** ganar columna propia»;
  `openspec/specs/transitions-soporte-remoto/spec.md:83` en `094196b9` dice «*Hipótesis*, no cerrada».

## L1.7 · La misma edición en el fichero de trabajo de `main` (hunks)

En `C:\dev\Desk_2_R1.023`, con Supervisión a +394/−0 sin commitear en `openspec/config.yaml` (fichero en LF, 6021 líneas). La línea de (f)
estaba en la 4195 y la de (g), desplazada, en la 5384. Edición con la herramienta de edición, sin tocar el índice.

| Comprobación | Antes | Después |
|---|---|---|
| `git status --porcelain` (sha256) | `b86b0b36…` | igual (`cmp` sin diferencias) |
| `git diff --cached` | vacío (`e3b0c442…`) | vacío |
| `git diff` (sha256) | `ae957762…` | `d62967d1…` |
| `git diff --no-index --numstat <copia previa> openspec/config.yaml` | — | `2 2` |
| `wc -l` y finales de línea | 6021, LF | 6021, LF |

- Las dos líneas que cambian son **idénticas** a los dos hunks de la rama (sha256 de la lista normalizada: `636cd664…`).
- Deshacer esas dos ediciones sobre una copia del fichero de después devuelve **byte a byte** la copia previa de Supervisión: su trabajo
  queda intacto salvo los dos hunks.

## L1.8 · Barrido de citas (regla de mutación 4)

Patrón completo sobre spec y los cuatro módulos (`design.md` D8), archivo incluido: **1.582** citas; **31** tocan una línea reescrita —23 de este cambio, 1 de `openspec/config.yaml`, 4 de dos paquetes y 3 archivadas— (spec
21-22, 76, 78, 80, 82-84; código 384, 34, 257, 301, 323). Leída cada frase:

- **23 de este mismo cambio** (`proposal.md`, `design.md`, la delta): o ya ancladas en `094196b9`, o sólo dan dónde vive algo que no se mueve
  (el bloque de RQ-SR-02 en `openspec/specs/transitions-soporte-remoto/spec.md:78-94`, la prueba «corrección (b)», la matriz SR): **A**.
- **`openspec/config.yaml` (g)**: anclada en este lote: **B**.
- **Dos paquetes de despliegue fechados, cuatro citas: dos B, reparadas en sitio (supuesto S-H, desvío del diseño), y dos A.** Los dos dicen «por equivalencia, no por
  decisión» citando el comentario del catálogo, que tras (a) dice lo contrario. Se anclan en su revisión de escritura, donde las líneas 384-385
  decían «por equivalencia (S-1)» y la 389 tenía `asignacion_soporte` en Servicio Técnico: `docs/sdd/Paquete_de_Despliegue_2026-09-30.md` en
  `c2b28880` y `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` en `f5255d2b` (1/1 cada uno). La abreviada de la línea 389 que les sigue en la
  misma línea física hereda el ancla. La cita siguiente de cada uno, a la matriz de `apps/desk/server/permisos.test.ts:300-306`, afirma que
  un usuario de Comercial recibe 403: sigue siendo cierto (**A**).
- **Tres de otros cambios archivados: A, no se tocan.** `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/verify-report.md:67` y
  `openspec/changes/archive/2026-10-18-anulado-con-motivo/verify-report.md:46` dicen qué leyeron y dónde está una prueba; y
  `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/apply-progress.md:89` cita la delta de su propio cambio, no la spec viva.

**Segundo pase, abreviadas** (script que atribuye cada `:N` a la última cita completa de su misma línea física, en los 431 ficheros que nombran
esos módulos, sin `docs/artefactos/`): **0** atribuidas a una línea reescrita. **77** huérfanas cuyo número coincide, todas leídas: por su
contexto son de otros módulos (`prioridad.ts`, `flujos.ts`, `schema.sql`, `permissions/spec.md`, `salidasEsperas.test.ts`…) o registros
archivados que sólo dan una ubicación. Nada que reparar.

## L1.9 · Casilla de la regla 13 (mutación 3)

`git diff --stat 091c4f73 -- apps/desk/src` vacío: el cliente no gana ni pierde ninguna decisión. La única en juego, quién ejecuta las cuatro,
la impone el servidor en `apps/desk/server/services/ticketService.ts:129-130` (`canExecuteTransition` con el `area` del catálogo compartido),
leída al cerrar.

## Medida y cierre

Antes del commit: `git diff --numstat 091c4f73` = 7 ficheros con inserciones = borrados (9/9 en total), más este informe y las casillas de
`tasks.md`; ningún fichero nuevo fuera de esta carpeta. L1.c (commit, los cinco códigos, bundle y `settle`) es del orquestador y queda en el
registro de intentos y en `verify-report.md`.
