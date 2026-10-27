# Informe de archivo — `areas-soporte-remoto` (F1B-09, `cierra: no`)

**Qué parte de la fila cubre, en una línea:** la corrección de la spec que pide E-090 —el área de las cuatro transiciones de soporte remoto
pasa de supuesto S-1 a `decision/e090-areas-soporte-remoto`—; deja fuera el repaso al cerrar la épica 1B y E-223 a E-230
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`). Por eso `cierra: no`.

Rama `areas-soporte-remoto`, desde `094196b9`. Archivado el 2026-10-27 en `openspec/changes/archive/2026-10-27-areas-soporte-remoto/`. Este
informe lo escribe el orquestador con cifras medidas (los informes de las fases se contrastaron dato a dato antes de cada `settle`).

## 1 · Qué cambia, y qué no

- **Sin cambio de comportamiento.** Ningún `area` del catálogo cambia (`packages/shared/src/transitions.ts:389-396`); el bundle del cliente es
  el mismo en los cuatro intentos (`index-BFrlA0VZ.js`, 427,12 kB) y no hay migración, esquema ni interruptor.
- **Spec viva** `openspec/specs/transitions-soporte-remoto/spec.md`: RQ-SR-02 sustituido entero a igual longitud (17 líneas, 5 cambian) y dos
  ediciones fuera de bloques (§0, 2 líneas; título del §2, 1 línea). 374 → 374 líneas; numstat 8/8.
- **Código y pruebas** (la razón del área, nada más): comentario del catálogo, título de la prueba (d), mensaje de «corrección (b)» y dos
  comentarios de la matriz SR de `apps/desk/server/permisos.test.ts`.
- **Citas:** `openspec/config.yaml` (dos líneas) y dos paquetes de despliegue fechados (una línea cada uno), sólo anclas.

**Recuento completo de líneas tocadas fuera de esta carpeta (resuelve W-1 y W-2 del verify):** 9 en el apply, en 7 ficheros —
`packages/shared/src/transitions.ts`, `packages/shared/src/transitionsSoporteRemoto.test.ts` y `packages/shared/src/invariantesGrafo.test.ts`
1/1; `apps/desk/server/permisos.test.ts` 2/2; `openspec/config.yaml` 2/2; `docs/sdd/Paquete_de_Despliegue_2026-09-30.md` y
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md` 1/1 (supuesto S-H, añadido en el apply)— y 8 en el archivo, en la spec viva. El `design.md`
contaba siete ediciones y no nombraba los dos paquetes; aquí queda el recuento real.

## 2 · Fusión (regla del archivo)

- **Medida antes de aplicar:** parte revisable = fusión (8 + 8 = 16 en el diff, ensayada en copia dos veces: sobre `094196b9` y sobre `e8150602`)
  más este informe. Muy por debajo de 800.
- **Por script**, no por agente: sustituye el bloque `RQ-SR-02` casándolo por su ID y aplica las dos ediciones fuera de bloques sólo si el texto
  «Antes» de la delta es exactamente lo vivo. Al aplicar: «RQ-SR-02: líneas 78-94 (17), 5 cambian · edición 21-22: 2 de 2 · edición 76: 1 de 1 ·
  longitud 374 → 374; líneas distintas: 8; EOL CRLF».
- **Comprobado tras aplicar:** el bloque vivo de las líneas 78-94 es idéntico al de la delta; los 38 títulos `#### Scenario` de la spec, idénticos
  antes y después; fichero en CRLF.
- **Lo que no se tocó a propósito:** la línea de «Fuera de alcance» del F1B-06 que dice «confirmación del área (P.3)» (supuesto S-B; es la foto de
  lo que esa tanda dejó fuera, como su vecina sobre la columna propia, igual de desfasada).

## 3 · Intentos (registro nativo, techo 800, válvula 720)

| Intento | Commit | Contenido | Medida (`--shortstat --no-renames` + sin trackear) |
|---|---|---|---|
| i1 · planificación | `091c4f73` | propuesta, delta, diseño, tareas | 387 (387 + 0), 0 sin trackear |
| i2 · apply | `836edc92` | mutaciones, ediciones (a)–(g), paquetes, `apply-progress.md` | 149 (131 + 18) |
| i3 · verify | `e8150602` | `verify-report.md`, casillas L1.c y V.1 | 90 (88 + 2) |
| i4 · archivo | este commit | fusión, este informe, mudanza | techo 2.300 (2 × carpeta + 800); cifra en el `settle` |

## 4 · Los cinco códigos

En los cuatro intentos: `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0 con **165 avisos contra 165**; detector
`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` 0 (13 abreviadas rotas informativas, las mismas que `main`; 0 cabeceras R-1
inválidas; 0 anclas sin resolver); `npm run build` 0 con `index-BFrlA0VZ.js`. `npm test`, siempre solo, con el log entero en el scratchpad y el
cargador conectado:

- i1: 1.ª pasada **1** (5.655/5.655 en verde; vitest sale 1 por un error del worker, «Timeout calling "onTaskUpdate"», 363 s); 2.ª pasada **0** (285 s).
- i2: **0** a la primera (218 s).
- i3: 1.ª y 2.ª pasada **1**, mismo error del worker con 5.655/5.655 en verde (354 y 339 s); 3.ª pasada **0** (368 s).

Ninguna prueba roja en ninguna pasada. La causa del error del worker queda **sin identificar**: con el cargador conectado salió tres veces de
siete; la idea de que coincidía con las pasadas lentas la desmintió la 3.ª del i3 (368 s, sin error). Sólo se asentó cada intento con un 0.

## 5 · `strict_tdd`: mutación con control

No hay código nuevo y no cabe rojo previo: la evidencia es mutación con control (`design.md` D5), sobre los cinco ficheros del conjunto (127 pruebas).

| Mutación | Rojas | Cuáles |
|---|---|---|
| M0 (sin mutar) | 0 / 127 | — |
| M1 · `asignacion_soporte` → `'Comercial'` | 9 | (d), «corrección (b)», matriz SR con Comercial y con Servicio Técnico, P1, P2, P8, y las dos de `avisoArea.test.ts` |
| M2 · `ejecutar_soporte` → `'Comercial'` | 7 | (d), «corrección (b)», matriz SR ×2, P2, P4, P9 |
| M1 tras editar | 9 | las mismas, ya con el título nuevo de (d) y el mensaje nuevo de (c) |

Cada restauración, con el sha256 del diff de `packages/shared/src/transitions.ts` idéntico al de antes de mutar. El verify las reprodujo por su
cuenta y sus listas coinciden prueba a prueba.

## 6 · Barrido de citas (regla de mutación 4)

- **Apply:** 1.582 citas completas a la spec y a los cuatro módulos; 31 tocan una línea reescrita. Las 23 de esta carpeta, ancladas en `094196b9` o
  sólo de ubicación (A). En `openspec/config.yaml`, tres anclas: dos en `3ec3703e` (caso B que ya existía: esos requisitos decían «**MUST NOT** ganar
  columna propia») y una en `094196b9` (caso B que crea este cambio). En los dos paquetes, dos B ancladas en su revisión de escritura
  (`c2b28880` y `f5255d2b`) y dos A. Tres de otros cambios archivados, A. Segundo pase de abreviadas: 0 atribuidas; 77 huérfanas leídas, todas
  de otros módulos.
- **Archivo:** tras la fusión, el patrón de citas a la spec da 14 resultados que tocan las líneas que cambian (21-22, 76, 78, 80, 82-84): 12 en esta
  carpeta (dos de ellos son a deltas, no a la spec viva), el de `openspec/config.yaml` (anclado en `094196b9`) y el de `tres-transiciones-cifra-anclada`,
  a la delta de su propio cambio. Las que describen el texto viejo van ancladas en `094196b9`; las dos que dan el bloque de RQ-SR-02 en las líneas
  78-94 sin ancla (S-2 del verify) siguen siendo ciertas: el bloque no se mueve (A). **Un caso B que creó la propia fusión:** la línea 7 del
  `verify-report.md` decía que ese bloque «sigue siendo el de `094196b9`», con su cabecera vieja; se ancla en `094196b9`, en sitio. Las rutas
  propias de esta carpeta (8, todas en el `verify-report.md`) se reescriben a la del archivo, en sitio y sin cambiar ninguna longitud.
- **Nota sobre el verify:** su §4 cuenta como A «los cuatro de los paquetes»; dos son B ancladas, como el propio informe dice unas líneas más abajo.

## 7 · Fuera de la rama: `openspec/config.yaml` de Supervisión

La rama **toca un fichero con cambios de Supervisión sin commitear en `main`**: `openspec/config.yaml` (2 líneas). En el fichero de trabajo de
`main` el orquestador hizo la misma edición, sin tocar el índice: `git status --porcelain` y `git diff --cached` iguales antes y después; las dos
líneas que cambian son idénticas a las de la rama; deshacerlas devuelve byte a byte la copia previa de Supervisión (detalle y sha256 en
`openspec/changes/archive/2026-10-27-areas-soporte-remoto/apply-progress.md`, L1.7). Ningún otro fichero de la rama está modificado en `main`.

## 8 · Estado nativo

`gentle-ai sdd-status` cuenta 12 tareas; hasta este archivo daba A.1 pendiente y, por eso, `apply` como siguiente y `archive` bloqueado. Es
circular —A.1 sólo se marca archivando— y se resuelve como en `valor-reclamado-usd`, cuyo `tasks.md` se marcó en su commit de archivo.

## 9 · Tareas de persona — fuera del recuento

**Archivar NO las da por hechas.**

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Poner al día M1.5 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1765`) y el Anexo B.1 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4542`) y cerrar el Anexo D nº 71 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5565-5569`): las cuatro son de Servicio Técnico por decisión del 2026-10-25 | Gerencia | Próxima revisión del maestro, por el expediente R08.x |
| P-2 | El `maestro_pasaje: "ninguno"` de la decisión (`openspec/config.yaml:5380` en `094196b9`) no casa con esos tres pasajes | Supervisión | La ficha de la decisión |

## 10 · Hallazgos para Supervisión (no se corrigen en esta rama)

- El de P-2.
- `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1761` dice que la rama de soporte remoto «no tiene salida de anulación»,
  y la tiene desde F1C-01 (`anulacion_soporte`, `packages/shared/src/transitions.ts:396`). Candidata para el expediente R08.x junto a P-1.
- El error del worker de vitest de §4, que ya no se explica sólo por la batería: medido aquí con el cargador conectado.
