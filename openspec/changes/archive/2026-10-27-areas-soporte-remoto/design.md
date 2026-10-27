# Diseño — `areas-soporte-remoto` (F1B-09, `cierra: no`)

Cómo se construye lo que piden `proposal.md` y la delta `specs/transitions-soporte-remoto/spec.md`. **Sin comportamiento nuevo:** el
catálogo ya cumple (`packages/shared/src/transitions.ts:389-395`) y el servidor ya lo impone (`apps/desk/server/services/ticketService.ts:129-130`).
Se reescriben razones y anclas, nunca un `area`. Toda cita a una línea que este cambio reescribe lleva su revisión en la misma línea.

## Enfoque

Ediciones en sitio, una línea física por otra: cinco en código y pruebas (apply), dos en `openspec/config.yaml` (orquestador) y ocho en la
spec viva (script, al archivar). Bajo `strict_tdd`, mutación con control en vez de rojo previo. **Matriz de amenazas:** N/A — el producto no
gana enrutado, shell, subprocesos, automatización de VCS/PR ni integración de procesos.

## Decisiones

**D1 · Todo en sitio, sin desplazar líneas.** *Qué:* cada edición sustituye una línea por otra. *Por qué:* spec, catálogo y pruebas están
citados por línea en todo el repositorio (regla de mutación 4); no mover nada evita renumerar citas. *Comprobación:*
`git diff --numstat <partida>` con inserciones = borrados en cada fichero tocado, y `wc -l` igual antes y después. *Descartada:* reescribir con
longitud natural: desfasaría las citas a la spec desde `openspec/config.yaml` y desde el archivo.

**D2 · Delta y fusión.** *Qué:* MODIFIED de RQ-SR-02 entero (17 líneas, casado por el ID, S-E) sobre el bloque vivo
`openspec/specs/transitions-soporte-remoto/spec.md:78-94` en `094196b9`, más «Ediciones en sitio fuera de bloques» con «Antes» exacto y «Después»
de igual longitud (§0 y título del §2). Al archivar lo aplica un script del orquestador, fuera del repositorio, que **falla** si el «Antes» no
es exactamente lo vivo o si cambia una longitud, y que comprueba que el bloque fusionado es idéntico al de la delta. Ensayado en copia por el
orquestador (hipótesis en esta fase): 374 → 374 líneas, 8 distintas, títulos de escenario idénticos. *Descartada:* fusión a mano por un
agente, que en este repositorio ha perdido escenarios y añadido notas inventadas (hipótesis de proceso, sin cita).

**D3 · Texto exacto de las siete ediciones.** Comprobadas contra disco en esta fase: el texto viejo de cada una aparece **una sola vez** en su
línea y ninguna tiene error de hecho. Son sustituciones de subcadena; el resto de la línea no cambia.
- (a) `packages/shared/src/transitions.ts:384` en `094196b9` — la 385 no cambia («mapeo está vacía» sigue siendo cierto).
- (b) `packages/shared/src/transitionsSoporteRemoto.test.ts:34` en `094196b9`, título de la prueba (d); (c) `packages/shared/src/invariantesGrafo.test.ts:257` en `094196b9`, sólo el mensaje.
- (d) `apps/desk/server/permisos.test.ts:301` en `094196b9`, «(4 permitidos, 8 prohibidos)» se queda (S-C); (e) `apps/desk/server/permisos.test.ts:323` en `094196b9`.

```text
(a) por equivalencia (S-1):
 →  por decisión de Gerencia (`decision/e090-areas-soporte-remoto`, RQ-SR-02), que cerró el supuesto S-1:
(b) por equivalencia (S-1, RQ-SR-02)
 →  por decisión de Gerencia (decision/e090-areas-soporte-remoto, RQ-SR-02)
(c) Servicio Técnico (S-1)
 →  Servicio Técnico (RQ-SR-02, decision/e090-areas-soporte-remoto)
(d) por S-1 las cuatro son
 →  por `decision/e090-areas-soporte-remoto` (antes, S-1) las cuatro son
(e) pasa (S-1), salvo
 →  pasa (`decision/e090-areas-soporte-remoto`), salvo
```

- (f) `openspec/config.yaml:4195` en `094196b9` — insertar « en `3ec3703e`» tras el acento grave de cierre de cada una de sus dos citas (S-D, S-G).
  El paréntesis queda: (`openspec/specs/transitions-equipo-nuevo/spec.md:264-267` en `3ec3703e`, `openspec/specs/transitions-soporte-remoto/spec.md:108-109` en `3ec3703e`).
- (g) `openspec/config.yaml:5375` en `094196b9` — insertar « en `094196b9`» tras su cita. El paréntesis queda:
  (`openspec/specs/transitions-soporte-remoto/spec.md:83` en `094196b9`, §2, RQ-SR-02).

Ancla que lee el detector: ruta completa, « en » y revisión (`apps/desk/server/citas/cosecha.ts:62-63`). *Descartada:* reformular líneas enteras (S-A).

**D4 · `openspec/config.yaml` en dos sitios, por el orquestador.** *Qué:* (f) y (g) en un commit de la rama; y la misma edición en el fichero
de trabajo de `C:\dev\Desk_2_R1.023`, donde Supervisión tiene +394/−0 sin commitear y la línea de (g) está desplazada nueve más abajo (medida
del orquestador; la de (f) no se mueve). *Comprobación:* antes y después, `git status --porcelain` igual y `git diff --cached` igual (el índice
de `main` NO se toca); copia previa del fichero y `git diff --no-index --numstat <copia> openspec/config.yaml` = `2 2`, con exactamente los dos
hunks de (f) y (g); `wc -l` igual; sha256 del `git diff` de antes, del de después y de los dos hunks, en el informe. *Por qué:* con la misma
edición a los dos lados, la fusión tres vías de esas dos líneas no conflictúa (hipótesis). *Descartada:* que un agente haga `stash` o commit del
trabajo de Supervisión: es trabajo ajeno.

**D5 · `strict_tdd` sin código nuevo: mutación con control.** No hay rojo previo posible: el comportamiento existe. Conjunto de ejecución,
válido como filtros posicionales sobre el `include` de `vitest.config.ts:17-20`:
`npx vitest run packages/shared/src/transitionsSoporteRemoto.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/permisos.test.ts apps/desk/server/flujoSoporteRemoto.test.ts apps/desk/server/services/avisoArea.test.ts`.
El quinto fichero lo añade esta fase: `apps/desk/server/services/avisoArea.test.ts:89-96` lee el área de `asignacion_soporte` a través de
`areasSiguientes` y `areasAAvisar`. No es exhaustivo (otros ficheros nombran el catálogo); la suite entera corre sin mutar, en los cinco códigos.
1. **M0:** verde sin mutar.
2. **M1:** `area` de `asignacion_soporte` (`packages/shared/src/transitions.ts:389`) → `'Comercial'`. Rojas esperadas (hipótesis): (d),
   «corrección (b)» (`packages/shared/src/invariantesGrafo.test.ts:254-260` en `094196b9`), la matriz SR por la comparación «a mano»
   (`apps/desk/server/permisos.test.ts:324`) con usuario de Comercial y de Servicio Técnico, P1, P2, P8 y las dos de `avisoArea.test.ts`.
   Verdes (hipótesis): la comparación con `canExecuteTransition` (`apps/desk/server/permisos.test.ts:321-322`, mismo catálogo) y la cuenta
   (`apps/desk/server/permisos.test.ts:328-333`). Restaurar.
3. **M2:** lo mismo con `ejecutar_soporte` (`packages/shared/src/transitions.ts:391`). Rojas (hipótesis): (d), «corrección (b)», la matriz
   por `apps/desk/server/permisos.test.ts:324`, P2, P4 y **P9** (`apps/desk/server/flujoSoporteRemoto.test.ts:117-123`: un usuario de
   Servicio Técnico ejecuta `ejecutar_soporte` y espera `200`). **Corrige la propuesta, §7, que omite P9.** No P1 (es de `asignacion_soporte`),
   ni P8 (su `409` de estado, `apps/desk/server/services/ticketService.ts:126-128`, precede al área), ni `avisoArea.test.ts`. Restaurar.
4. Ediciones (a)–(e). Después, **M1 una sola vez más**, y verde final. *Por qué basta M1:* de las cinco, sólo (b) —título— y (c)
   —mensaje— llegan a la salida de una prueba, y las dos se ponen rojas con M1; (a), (d) y (e) son comentarios. M2 enseñaría los mismos dos.

Antes de cada mutación, sha256 de `git diff -- packages/shared/src/transitions.ts` (vacío antes de las ediciones; sólo el hunk de (a)
después); tras restaurar, el mismo sha256. Cada lista de rojas (fichero › nombre) va al `apply-progress.md`. Mutar antes de editar enseña el
texto viejo en el rojo; repetir después, el nuevo. *Descartada:* mutar las pruebas: sólo demuestra que se ejecutan (molde de la regla de mutación 2).

**D6 · Bundle y migración.** `npm run build` debe emitir el mismo `index-BFrlA0VZ.js` (hipótesis): lo único que llega al cliente es el JSDoc
de (a), que la minificación quita; las pruebas no se empaquetan. Si cambia, se explica. Sin migración, sin esquema (`desk`/`public`), sin interruptor.

**D7 · Casilla de la regla 13 (mutación 3).** No se toca `apps/desk/src`: el cliente no toma ninguna decisión nueva. La única en juego,
quién ejecuta las cuatro, la impone `apps/desk/server/services/ticketService.ts:129-130` con `canExecuteTransition`
(`packages/shared/src/permissions.ts:4-7`) sobre el `area` del catálogo compartido (`apps/desk/server/services/ticketService.ts:122`).

**D8 · Barrido de citas al cerrar cada intento.** (1) `git grep -noE "transitions-soporte-remoto/spec\.md:[0-9]+(-[0-9]+)?"`;
(2) `git grep -noE "(transitions|transitionsSoporteRemoto\.test|invariantesGrafo\.test|permisos\.test)\.ts:[0-9]+(-[0-9]+)?"`. De cada
resultado cuyo rango toque una línea reescrita (spec: 21-22, 76, 78, 80, 82-84; código: 384, 34, 257, 301, 323) se lee qué afirma la frase y
se clasifica A/B/C. (3) Segundo pase de abreviadas en los ficheros que ya citan esos módulos. Incluye `openspec/changes/archive/`, que el
detector excluye (`apps/desk/server/citas/cli.ts:49`) y el barrido humano no. Como nada se desplaza, ninguna se renumera: sólo caben B o C.

## Ficheros

| Fichero | Líneas (+/−) | Quién |
|---|---|---|
| `packages/shared/src/transitions.ts` | 1/1 | apply |
| `packages/shared/src/transitionsSoporteRemoto.test.ts` · `packages/shared/src/invariantesGrafo.test.ts` | 1/1 cada uno | apply |
| `apps/desk/server/permisos.test.ts` | 2/2 | apply |
| `openspec/config.yaml` | 2/2, en la rama y en el fichero de trabajo de `main` | orquestador |
| `openspec/specs/transitions-soporte-remoto/spec.md` | 8/8, al archivar | script del orquestador |

## Riesgos y preguntas

- **Fusión a `main` con `openspec/config.yaml` sucio:** git rechaza fusionar una rama que cambia un fichero con cambios locales (hipótesis,
  no ensayada aquí). El orden (commit de Supervisión antes de fusionar) lo fija el orquestador; con la edición idéntica a los dos lados, sin conflicto.
- El ancla `3ec3703e` de (f) exige esas líneas no vacías en esa revisión: lo comprueba el detector. Ninguna pregunta abierta bloquea.
