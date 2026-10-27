# Verify — `areas-soporte-remoto` (F1B-09, `cierra: no`)

**Veredicto: PASS CON AVISOS.** 0 CRITICAL, 2 WARNING, 3 SUGGESTION. Verificado sobre `836edc92` (partida `094196b9`, planificación `091c4f73`), en el worktree de la rama. No se ejecutó `npm test` entero, `build`, `lint` ni `typecheck`: los cinco códigos del cierre son del orquestador (ver §8). El modo es `strict_tdd` sin código nuevo: la evidencia exigible es mutación con control (`design.md` D5), y se reprodujo (§3).

## 1 · Diff contra contrato

- **Spec viva sin tocar:** `git diff --stat 094196b9 -- openspec/specs` vacío; el bloque de RQ-SR-02 sigue siendo el de `094196b9` en `openspec/specs/transitions-soporte-remoto/spec.md:78-94` (17 líneas, cabecera «Área por equivalencia con Servicio Técnico»). La delta lo sustituye entero con 17 líneas (`openspec/changes/areas-soporte-remoto/specs/transitions-soporte-remoto/spec.md:15-31`) y declara las dos ediciones fuera de bloque, que se aplican al archivar. Correcto: nada se fusiona en el apply.
- **`apps/desk/src` sin tocar:** `git diff --stat 094196b9 836edc92 -- apps/desk/src` vacío.
- **Numstat fuera de la carpeta del cambio** (`git diff --numstat 094196b9 836edc92`): inserciones = borrados en los siete ficheros: `permisos.test.ts` 2/2, `openspec/config.yaml` 2/2, los dos paquetes de despliegue, `invariantesGrafo.test.ts`, `transitions.ts` y `transitionsSoporteRemoto.test.ts` 1/1 cada uno. `wc -l` idéntico antes y después en los siete (397, 67, 482, 461, 5627, 1348, 1842). D1 cumplida.
- **Ningún `area` cambia:** `packages/shared/src/transitions.ts:389-396` sigue con las cuatro de trabajo en `Servicio Técnico` y `anulacion_soporte` en `Comercial`; el diff de `transitions.ts` contra `094196b9` es un solo hunk, el comentario.
- **D3 (a)–(g), letra a letra** (`git diff --word-diff=plain -U0`): (a) «equivalencia (S-1):» pasa a «decisión de Gerencia (`decision/e090-areas-soporte-remoto`, RQ-SR-02), que cerró el supuesto S-1:»; (b) título de la prueba (d); (c) mensaje de «corrección (b)»; (d) «por S-1» a «por `decision/e090-areas-soporte-remoto` (antes, S-1)»; (e) «(S-1),» a «(`decision/e090-areas-soporte-remoto`),»; (f) y (g) las dos anclas de `openspec/config.yaml`. Los siete textos coinciden con el diseño; sustituciones de subcadena, el resto de cada línea intacto.
- **Cabecera R-1** de `openspec/changes/areas-soporte-remoto/proposal.md:1-9`: siete campos (`tanda: F1B-09`, `motivo: ""` con tanda real, `capacidad`, `maestro`, `cierra: no`, `toca_maestro: si`, `origen_cabecera: declarada`). `toca_maestro: si` se sostiene con tres pasajes leídos hoy: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1765` («[ABIERTO — R08.4] Área de las cuatro transiciones…»), `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4542` («sigue abierta en el Anexo D») y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5565-5569` (nº 71, «ABIERTO — R08.4»).
- **Personas fuera del recuento:** P-1 y P-2 están en `openspec/changes/areas-soporte-remoto/tasks.md:44-51` (tabla aparte, «Archivar NO las da por hechas») y en `openspec/changes/areas-soporte-remoto/proposal.md:137-144`.

## 2 · Escenarios de RQ-SR-02

- **403 a Comercial:** `apps/desk/server/flujoSoporteRemoto.test.ts` › P2 («un usuario sólo de Comercial recibe 403 en las cuatro transiciones de trabajo») y la matriz de `apps/desk/server/permisos.test.ts` («las cuatro transiciones de Soporte remoto contestan lo mismo a un usuario de Comercial»). Verdes en M0.
- **200 a Servicio Técnico:** `apps/desk/server/flujoSoporteRemoto.test.ts` › P1 («SR en Solicitud Soporte, usuario de Servicio Técnico, asignacion_soporte → 200 y En Proceso») y la matriz con usuario de Servicio Técnico. Verdes en M0.
- Los dos escenarios de la delta son copia literal de los vivos. Los dos se ponen rojos con M1 (§3): las pruebas discriminan.

## 3 · Mutaciones con control (reproducidas por mí)

Conjunto: los cinco ficheros de `design.md` D5. Mutación con `perl -i -pe` (CRLF conservado). sha256 de `git diff -- packages/shared/src/transitions.ts` antes de cada mutación y tras restaurar: `e3b0c442…` (vacío, porque HEAD ya lleva (a); el diff contra `094196b9` es `fed3d9e0…`, el hunk de (a), igual que en `openspec/changes/areas-soporte-remoto/apply-progress.md`). Al final: `git status --short` vacío y `file` da CRLF.

- **M0:** 5 ficheros, **127 de 127 en verde** (7 + 45 + 35 + 26 + 14).
- **M1** (`asignacion_soporte` a `Comercial`): **9 rojas, 118 verdes.**
  1. `apps/desk/server/flujoSoporteRemoto.test.ts` › P1
  2. `apps/desk/server/flujoSoporteRemoto.test.ts` › P2
  3. `apps/desk/server/flujoSoporteRemoto.test.ts` › P8
  4. `apps/desk/server/permisos.test.ts` › matriz 4×3 › usuario de Comercial
  5. `apps/desk/server/permisos.test.ts` › matriz 4×3 › usuario de Servicio Técnico
  6. `apps/desk/server/services/avisoArea.test.ts` › `areasAAvisar(Solicitud Soporte, [Servicio Técnico], SR)…`
  7. `apps/desk/server/services/avisoArea.test.ts` › `areasSiguientes(Solicitud Soporte, SR) es Servicio Técnico`
  8. `packages/shared/src/invariantesGrafo.test.ts` › «corrección (b)»
  9. `packages/shared/src/transitionsSoporteRemoto.test.ts` › (d), ya con el título nuevo («por decisión de Gerencia (decision/e090-areas-soporte-remoto, RQ-SR-02)»)
- **M2** (`ejecutar_soporte` a `Comercial`): **7 rojas, 120 verdes.** `flujoSoporteRemoto.test.ts` › P2, P4, **P9**; `permisos.test.ts` › matriz (Comercial) y matriz (Servicio Técnico); `invariantesGrafo.test.ts` › «corrección (b)»; `transitionsSoporteRemoto.test.ts` › (d). `avisoArea.test.ts` en verde, como preveía el diseño.
- **Comparación con `apply-progress.md`:** las dos listas coinciden prueba a prueba (9 y 7, con P9 en M2). Sin diferencias. Que M1 ponga rojas (b) y (c) tras las ediciones demuestra que las dos reescrituras que llegan a una salida de prueba son visibles al mutar.
- **Valoración `strict_tdd`:** suficiente y proporcionada. No existe rojo previo posible (el comportamiento ya está); el control M0, las dos mutaciones y la restauración con sha256 prueban que las pruebas discriminan, y mutar las pruebas no añadiría nada (molde de la regla de mutación 2). Límite en S-1.

## 4 · Barrido de citas (regla de mutación 4)

Repetido el barrido de `design.md` D8 sobre el árbol de `836edc92`, archivo incluido.

- **Citas a la spec** (patrón de `design.md` D8, 29 en total): 13 tocan una línea reescrita (21-22, 76, 78-84). Las de la carpeta del cambio van ancladas en `094196b9`, salvo dos que sólo dicen dónde vive el bloque de RQ-SR-02 (`openspec/changes/areas-soporte-remoto/proposal.md:52` y `openspec/changes/areas-soporte-remoto/apply-progress.md:85`): A, el bloque no se mueve y la fusión conserva longitud. La única de fuera es `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/apply-progress.md:89`, que cita la delta de su propio cambio: A, no se toca.
- **Citas a los cuatro módulos de código** (cinco líneas reescritas): 6 resultados fuera de la carpeta del cambio. Los cuatro de los paquetes de despliegue y los dos `verify-report.md` archivados (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/verify-report.md:67` y `openspec/changes/archive/2026-10-18-anulado-con-motivo/verify-report.md:46`) dicen qué leyeron y dónde hay una prueba: A, lo que afirman sigue cierto.
- **Anclas, leídas con `git show <rev>:<ruta>`:**
  - `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:720` ancla `c2b28880`. En esa revisión la línea 384 de `transitions.ts` dice «las cuatro son `Servicio Técnico` por equivalencia (S-1)» y la 389 es `asignacion_soporte` con `Servicio Técnico`: dice lo que la frase afirma («por equivalencia, no por decisión»). Caso B correcto.
  - `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1008` ancla `f5255d2b`, mismas líneas con el mismo texto en esa revisión. Correcto.
  - `openspec/config.yaml:4195` en `094196b9`: la frase dice que dos requisitos «hoy lo prohíben»; `openspec/specs/transitions-soporte-remoto/spec.md:108-109` en `3ec3703e` y `openspec/specs/transitions-equipo-nuevo/spec.md:264-267` en `3ec3703e` dicen «El tablero **MUST NOT** ganar columna propia…». Correcto.
  - `openspec/config.yaml:5375` en `094196b9`: la frase dice que la spec viva llama S-1 «*Hipótesis*, no cerrada»; `openspec/specs/transitions-soporte-remoto/spec.md:83` en `094196b9` contiene «*Hipótesis*, no cerrada: `Asignación` podría ser de Comercial». Correcto.
  - Las tres revisiones (`3ec3703e`, `c2b28880`, `f5255d2b`) son commits que existen.
- **Detector** (`tsx apps/desk/server/citas/cli.ts --sha HEAD`, antes de añadir este fichero): **exit 0**; comprobadas 7569; saltadas 2583 (anclas sin resolver 0, no legibles 0); abreviadas rotas 13 (informativas; las que leí son de `CLAUDE.md`, `openspec/specs/permissions/spec.md` y `openspec/specs/transitions-st/spec.md`, ninguna de este cambio); cabeceras R-1 inválidas 0; línea base 0 informadas, 0 caducadas. Se corre otra vez tras escribir este informe (resultado en el parte de fase).

## 5 · Casilla de la regla 13 (mutación 3)

El cliente no toma decisión nueva: `apps/desk/src` sin cambios. La única decisión en juego, quién ejecuta las cuatro, la impone el servidor en `apps/desk/server/services/ticketService.ts:129-130` (`canExecuteTransition` y `403` con el área), sobre `packages/shared/src/permissions.ts:4-7`, leídas hoy. Está además probada (P1, P2 y la matriz; rojas en M1 y M2), así que se cumple el punto 3 de la regla.

## 6 · Edición fuera de la rama (L1.7)

**Contrastado por mí, leyendo:** el `git diff -U0 -- openspec/config.yaml` del fichero de trabajo de `C:\dev\Desk_2_R1.023` contiene las dos líneas de (f) y (g), y el sha256 de esas líneas `-`/`+` es idéntico al de la rama (`612f2857…` en los dos lados). **Evidencia sólo del orquestador, no reproducida aquí:** `git status --porcelain` y `git diff --cached` iguales antes y después, `wc -l` 6021 en LF, sha256 del `git diff` de antes y de después, y la reversión byte a byte. No escribí nada en `main`.

## 7 · Medida

`git diff --shortstat --no-renames 094196b9` en el worktree antes de este informe: 509 inserciones y 9 borrados (518), frente al techo de 720 de `openspec/changes/areas-soporte-remoto/tasks.md:11`. Con este informe, hipótesis: unas 640; la cifra final es del orquestador.

## 8 · Casillas

- `L1.c`: marcada **sólo en lo verificable aquí** (mutaciones, diff, barrido, detector 0). Los cinco códigos, el bundle frente a `index-BFrlA0VZ.js` y el `settle` **no los comprobé**: son del orquestador y su resultado debe quedar en el registro de intentos. Si alguno sale distinto de 0, se desmarca.
- `V.1`: marcada. Repetir los cinco códigos queda a cargo del orquestador, para no correr dos `npm test` a la vez.

## Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- **W-1 · Desvío documentado sólo en la propuesta.** Los dos paquetes de despliegue (1/1 cada uno) los añadió el apply como S-H (`openspec/changes/areas-soporte-remoto/proposal.md:89`), pero la tabla «Ficheros» y D1 de `openspec/changes/areas-soporte-remoto/design.md:98-104` no los cuentan, y L1.4 de `tasks.md` tampoco los nombra. Es una reparación caso B legítima y está declarada en `openspec/changes/areas-soporte-remoto/apply-progress.md:87`, pero diseño y tareas quedan cortos en dos ficheros. Se resuelve con una línea en el `archive-report.md`; no bloquea.
- **W-2 · Recuento de ediciones.** El diseño habla de siete ediciones (a)–(g); el diff real toca nueve líneas en siete ficheros ajenos a la carpeta del cambio, contando las dos de los paquetes. Quien cuente en el archive «cinco de código y dos de config» se dejará los paquetes. Riesgo bajo, de contabilidad.

**SUGGESTION**
- **S-1 · Alcance del conjunto de mutación.** `design.md` D5 ya admite que no es exhaustivo (otros ficheros nombran el catálogo); la suite entera la corre el orquestador sin mutar. Aceptable.
- **S-2 · Anclar en `094196b9`** las dos citas «78-94» sin ancla (`openspec/changes/areas-soporte-remoto/proposal.md:52` y `openspec/changes/areas-soporte-remoto/apply-progress.md:85`) en el archive-report, por si una revisión futura mueve el bloque.
- **S-3 · `maestro_pasaje: "ninguno"`** de la decisión sigue siendo hallazgo para Supervisión (P-2): los tres pasajes del maestro están abiertos. Ya registrado.

## Contrato de fase

`status: done` · 0 CRITICAL, 2 WARNING, 3 SUGGESTION · siguiente: `sdd-archive`, cuando el orquestador confirme los cinco códigos en 0.
