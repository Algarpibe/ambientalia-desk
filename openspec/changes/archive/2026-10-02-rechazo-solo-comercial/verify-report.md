```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:5a0ac349824745eb22c9febc29ab08d6dba499e1198afb1a699630bb193456c1
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 32/32
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:2c193d310bd04f4fca66a31f831e2ae993260493656407e12a885b2ea05f632b
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:b216d4610a36a68cbf1b968b4d72bb48644213db2e1bcf9b9d8f1a08fc6d23a7
```

## Verification Report

**Cambio**: `rechazo-solo-comercial` (F1C-10, `cierra: si`)
**Modo**: Strict TDD (`npm test`, vitest)
**Rama / commits**: worktree `rechazo-solo-comercial`; planificación `06d1fa1`, apply `2277e3e` y `8bae67a`
**Veredicto**: **PASS WITH WARNINGS** — 0 CRITICAL, 5 WARNING, 3 SUGGESTION

### Completitud

| Métrica | Valor |
|---|---|
| Tareas con casilla (fases 1 a 6.2) | 41, todas marcadas |
| Incompletas | 0 |
| Instrucción para el archivo (6.3, sin casilla) | 1 (ver juicio 2) |
| Requisitos de los deltas (`grep '^### Requirement'`) | 5 (permissions 1, transitions-st 4) |
| Escenarios de los deltas (`grep '^#### Scenario'`) | 32 (permissions 10, transitions-st 22) |

### Build y pruebas (ejecutadas por mí, en el worktree)

| Comando | Resultado |
|---|---|
| `npm test` | exit 0 · 170 ficheros pasan, 1 omitido · **2424 pasan**, 2 omitidos (integración de migración) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 · **165 avisos, 0 errores** (en el techo, no por debajo) |
| `npm run build` | exit 0 |
| `npm run generar-mapa-blueprint` | escribe 4 ficheros; ningún contenido cambia (ver W-3) |
| `cli.ts --sha HEAD` (detector de citas) | exit 0 · 0 bloqueantes · línea base 0 · cabeceras R-1 inválidas 0 · 10 abreviadas rotas ajenas, informativas |

El rojo previo que `apply-progress.md:54` declaraba (`registro.test.ts`, «en curso») lo resuelve `8bae67a`: hoy 2424 verdes y 0 rojos.

### Catálogo e imposición (comprobado contra el código)

- `packages/shared/src/transitions.ts:234` `rechazo_comercial` → `Comercial / Servicio Técnico`; `:236` `rechazo_cliente` → **`Comercial`**; `:238` `rechazo_revision` → `Comercial / Servicio Técnico`. Orígenes, destinos (`Por Facturar`) y `fields` intactos. La producción cambia en un único hunk (`@@ -236 +236 @@`).
- El servidor no cambia: `ticketService.ts:129-130` lanza el `403` leyendo `t.area`; `:155` pasa el área vigente a `applyTransition`, así que las trazas históricas conservan la suya.
- El `403` a Servicio Técnico está **escrito a mano**: `permisos.test.ts:410` fija `403`, estado intacto y cero filas en `ticket_transitions`, sin derivar el esperado del catálogo (D-5). La matriz HTTP existente deriva el esperado de `puedeEjecutarTransicion`; sola no habría detectado M-1.
- Ninguna línea citada se desplazó: los hunks `-U0` de los ficheros de prueba y del catálogo tienen el mismo número de líneas antes y después; lo nuevo va al final.

### Cumplimiento de escenarios (prueba que lo cubre, pasada en esta ejecución)

| Escenario | Prueba | Estado |
|---|---|---|
| PM-1 matriz 93 = 55/38 | `permisos.test.ts:77` «la matriz son 93 casos: 55 prohibidos y 38 permitidos» | ✅ |
| PM-2 prohibición por área | matriz HTTP existente (`:41-67`) | ✅ |
| PM-3 un caso difiere | «exactamente un caso difiere…» y «barrido de cargo sigue en 744» | ✅ |
| PM-4 siete compartidas (24×2+7) | matriz 55/38 + invariante 5 | ✅ |
| PM-5 compuesta 56/37 | «con la compuesta y sin cargo… 56… 37» (`:349-353`) | ✅ |
| PM-6 Servicio Técnico `403` | «un usuario sólo de Servicio Técnico recibe 403…» (`:410`) | ✅ |
| PM-7 Comercial y admin `200` | dos pruebas (Comercial con traza; administrador) | ✅ |
| PM-8 otras dos Rechazo `200` | «las otras dos «Rechazo» siguen admitiendo a Servicio Técnico» | ✅ |
| PM-9 retirada sin fila | total escrito a mano 93 + `invariantesGrafo.test.ts:314` | ✅ |
| PM-10 mutación en la matriz | reproducida (M-1) | ✅ |
| TS-07 ×4 (93 casos, prohibición, admin 31, siete compartidas) | matriz, prohibición, `permisos.test.ts:89-109`, invariante 5 | ✅ |
| TS-23 31 entradas / id retirada rechazada | invariante 2 (`:50-51`), `invariantesGrafo.test.ts:314`, `transicionesEjecucion.test.ts` | ✅ (de F1C-09, sin retocar) |
| TS-23 ticket en `Pendiente` sin transiciones | `estados.test.ts:225-228`, `fasesBlueprint.test.ts:28` (indirecto) | ✅ indirecto (W-4) |
| TS-23 mutación reponer retirada | no reproducida; la cubren las pruebas de F1C-09 | ✅ existente |
| TS-23 retirar no movió el emparejamiento (rev. F1C-09) | texto fechado, caso B; hoy lo fija el invariante 5 | ✅ por diseño |
| TS-30 catálogo declara las tres Rechazo | «el catálogo declara las tres «Rechazo»…, escritos a mano» | ✅ |
| TS-30 ST no puede / Comercial rechaza | las dos pruebas de arriba | ✅ |
| TS-30 invariante 5 siete / invariante 6 diez | `invariantesGrafo.test.ts:91`, `:137` | ✅ |
| TS-30 barrido 744 | prueba nueva de barrido | ✅ |
| TS-30 mapa en `[C]` | anti-desfase `mapaBlueprint.test.ts` (RQ-MB-06) + diff de tres líneas | ✅ |
| **TS-30 traza histórica conserva su área** | **ninguna** (lectura de `ticketService.ts:155` y diff sin esquema ni migración) | ⚠️ por inspección, sin prueba automática (W-1) |
| TS-30 mutación devolver `rechazo_cliente` | reproducida (M-1) | ✅ |
| TS-30 mutación otra Rechazo | reproducida (M-2) | ✅ |
| TS-31 ×3 (áreas siguientes, ST sin aviso, mutación) | `avisoArea.test.ts:104`, `:108` y M-1 | ✅ |

**Total: 31 de 32 con prueba pasada en ejecución; el 32.º (traza histórica) es una propiedad de «no se cambia nada»: se da por cumplido por inspección y se declara como WARNING W-1. Si el orquestador exige prueba automática, el envelope pasaría a 31/32 y el veredicto quedaría en su mano.**

### Mutaciones reproducidas por mí (todas revertidas)

| Mut. | Qué hice | Rojo observado |
|---|---|---|
| M-1 | `:236` devuelto a `Comercial / Servicio Técnico` | **9 rojos**: matriz 55/38, compuesta 56/37, invariante 5, catálogo a mano, `403`, traza `Comercial`, `areasSiguientes`, `areasAAvisar`, anti-desfase. Coincide con RQ-TS-30 y RQ-TS-31 |
| M-2a | `Comercial` en `:234` | **6 rojos**: catálogo a mano, `200` de Servicio Técnico en las otras dos, compuesta, invariante 5, anti-desfase, matriz 55/38 |
| M-2b | `Comercial` en `:238` | **los mismos 6** |
| M-3 | `[C][ST]` a mano en `blueprint-completo.md:54`, `blueprint-fase-2-diagnostico.md:44`, `blueprint-fase-3-cierre.md:22`, una por vez | anti-desfase rojo **en cada uno de los tres** (1 fallo, 14 pasan) |

Tras revertir (`git checkout -- <fichero>` el catálogo; copia restaurada los `.md`), `git diff` de producción y de mapa quedó vacío. Ninguna mutación sobrevivió.

### Cumplimiento TDD (strict)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD en `apply-progress.md` | ✅ | tabla «Evidencia del ciclo TDD» con el rojo textual por tarea |
| Toda tarea de código tiene prueba | ✅ | 1.1-1.9 en 4 ficheros; todos existen |
| ROJO confirmado | ✅ | «expected length 55 but got 54», «expected 200 to be 403»…; 1.6 y 1.8 verdes de origen **por diseño** (guardianes de M-2 y del 744), validados por mutación |
| VERDE confirmado | ✅ | los cuatro ficheros pasan hoy |
| Triangulación | ✅ | `403` ST frente a `200` Comercial, administrador y otras dos Rechazo; avisos con dos aserciones distintas |
| Safety net de ficheros modificados | ⚠️ | la tabla no trae columnas de triangulación ni de safety net (W-2) |

**Calidad de aserciones:** sin tautologías ni bucles fantasma; cada prueba nueva llama a código de producción (servidor con `supertest` o funciones puras); las comparaciones de longitud tienen contrapartida no vacía. **Capa:** pruebas de unidad e integración con servidor de prueba; UI excluida por decisión de Gerencia (F0-00). Sin herramienta de cobertura: omitida.

### Coherencia con el diseño

| Decisión | ¿Seguida? |
|---|---|
| D-1 editar en sitio `:236` | ✅ un hunk |
| D-2/D-3 invariante 5: comentario de una línea en `:103`, «siete» en `:85`, `:88`, `:91` | ✅ |
| D-4 pruebas al final de `permisos.test.ts` y `avisoArea.test.ts` | ✅ (`@@ -384,0 +385,77`, `@@ -97,0 +98,14`) |
| D-5 `403` escrito a mano | ✅ |
| D-6 S-1 fijado con prueba | ✅ |
| Regla 13 (casilla) | ✅ cliente `TransitionPanel.tsx:56-58` ↔ servidor `ticketService.ts:129-130`, probado; ningún `.tsx` cambia |
| Mapa: tres líneas en tres ficheros, `fase-1` sin cambio | ✅ el diff de apply toca 1+1 en cada uno de los tres |

### Supuesto S-1

Las áreas siguientes de «Notificación cliente» son exactamente Comercial y Compras, y las áreas a avisar con actor Comercial son sólo Compras. Las dos aserciones están en `avisoArea.test.ts:104` y `:108` y se ponen rojas con M-1. RQ-TS-31 lo registra con su «Previously».

### Los cuatro juicios

1. **`registro.test.ts:220` incluye F1C-10 en «en curso»: WARNING con acción (W-1b).** Es correcto mientras la carpeta esté en `changes/` (la prueba lee los proposals reales) y era la única forma de dejar `npm test` en verde. Pero la lista es una fotografía: **al archivar, F1C-10 pasa a «cerradas» y esa prueba se pone roja**. Acción para `sdd-archive`: quitar F1C-10 de `:220` y corregir el título de `:218`, que dice «exactamente SEIS» y hoy lista siete (F0-04 incluida). Comprobar con `npm test` tras la fusión.
2. **Tarea 6.3 como instrucción para el archivo (`tasks.md:78`): legítima, con una salvedad (W-5).** No es una tarea de persona: es trabajo de repositorio, de modo que el reverso de la regla del ciclo 1 **sí** le aplica. No se ha sacado del recuento para maquillar el contador, por una razón concreta: **depende de la fusión de los deltas en las specs vivas, que sólo existe en `sdd-archive`**; antes no hay nada que barrer. Una casilla sin marcar habría bloqueado `verify` y `archive` (contrato de estado: todas completas) sin que el apply pudiera cerrarla. La salvedad: queda sin dueño en el recuento y sólo la sostiene la disciplina. Acción: que el encargo de `sdd-archive` la nombre, que `archive-report.md` registre el resultado de repetir 4.1-4.3 y que el orquestador lo compruebe antes del `settle`.
3. **S-1 frente a las decisiones registradas: no contradice ninguna.** En `openspec/config.yaml`, «Notificación cliente» sólo aparece en la alerta de 4 días hábiles (`:2329`, que va al Coordinador Comercial, no a Servicio Técnico) y la revisión nocturna (`:2395`) recalcula «estado de llegada menos las áreas de quien ejecutó», la misma regla. RQ-AV-04 es genérico y deriva del grafo (M1.9.3). Sin salida para Servicio Técnico desde ese estado, avisarle sería ruido. Reversible con el mismo cambio de catálogo. Único efecto visible: la campana de Servicio Técnico no suena al entrar en Notificación cliente; queda en la tarea de persona.
4. **`cierra: si` frente a la fila de la R01.4 y E-114: sostenible.** La fila (`R01.4.md:178`) pide el área de `rechazo_cliente` y dice que no mueve cifras ancladas. E-114 pide además actualizar M1.3 y el mapa: el maestro vigente ya lo dice (`R08.4.md:1523-1527`, `:1616`, `:1945`, comprobados), así que `toca_maestro: no` es cierto; el mapa está regenerado y coincide con el generador; las specs se fusionan en el archivo. Lo único que queda es la verificación en la app: tarea de persona, fuera del recuento, con dueño, destino y lugar escrito. `blueprintserviciotecnico.html` no lleva áreas en las aristas (`:342`), sin contradicción. R-4 se cumple (un solo `tanda:`).

### Incidencias

**CRITICAL**: ninguna.

**WARNING**
- **W-1 · Escenario «una traza histórica conserva su área» sin prueba.** Cumplido por inspección: `ticketService.ts:155` pasa el área vigente al ejecutar y `git diff 0070ef1 HEAD` no toca ningún fichero de esquema ni migración. Es el único escenario sin prueba que pase en ejecución; la regla estricta lo marcaría UNTESTED, y aquí se acepta por el diseño (tarea 2.5). Si se quiere cubrir: una prueba que siembre una fila con el área vieja y compruebe que nada la reescribe. Sin acción obligatoria.
- **W-1b · `registro.test.ts:220` y título `:218`**: ver juicio 1. Acción en el archivo.
- **W-2 · Tabla TDD sin triangulación ni safety net.** El formato del apply no trae esas columnas; la suite previa se corrió (`apply-progress.md:54`) pero no queda por fichero.
- **W-3 · `git status` no queda limpio tras `npm run generar-mapa-blueprint`**: `docs/artefactos/blueprint-fase-1-entrada.md` figura ` M`, pero su blob es **idéntico** al de HEAD (`git hash-object` = `git rev-parse HEAD:…` = `60a5aa1d…`), no tiene `CR` y `git diff` no da contenido: es el aviso LF/CRLF del generador con `core.autocrlf=true` (el apply ya lo anotó). El criterio «`git status` limpio» no se cumple literalmente; no hay cambio de contenido. No incluir ese fichero en commits.
- **W-4 · Escenarios heredados de F1C-09 (RQ-TS-23)**: el delta los repite sin cambio y su cobertura es de F1C-09, con pruebas indirectas (`estados.test.ts:225-228`, `invariantesGrafo.test.ts:314`); no hay una prueba por escenario. Sin acción.
- **W-5 · Tarea 6.3 sin casilla**: ver juicio 2.
- Informativo: lint en 165, exactamente el techo; cualquier aviso nuevo de la tanda siguiente lo rompe.

**SUGGESTION**
- S-a · El delta de `transitions-st` mezcla un «MODIFIED» de RQ-TS-23 con tres escenarios sin cambio. Al fusionar, comprobar que la revisión `011f6ea` nombrada no se pierde.
- S-b · Al archivar, comprobar con `git show --numstat` que el commit contiene **sólo** el cambio archivado (regla del archivo, E-150).
- S-c · En `archive-report.md`, la línea R-1 de qué parte de la fila cubrió y qué dejó fuera (`cierra: si`), más la tarea de persona aparte.

### Barrido de citas (regla de mutación 4)

Ninguna línea de `transitions.ts`, `invariantesGrafo.test.ts`, `permisos.test.ts` ni `avisoArea.test.ts` se movió (hunks `-U0` simétricos; lo nuevo, al final). Las ediciones en sitio (`permisos.test.ts:26-27`, `:72-73`, `:77`, `:80-81`, `:338`, `:349`, `:352-353`; `invariantesGrafo.test.ts:85`, `:88`, `:91`, `:103`; `transitions-st/spec.md:63` en `4984c3b`, `:1630`) conservan el número de línea. Detector en `HEAD`: exit 0 y 0 bloqueantes. El barrido completo de 372 citas lo hizo el apply; yo repetí detector y comprobación de hunks, no releí las 372.

### Medida del intento de verify

`git diff --shortstat --no-renames HEAD` antes de escribir este informe: 0 líneas trackeadas (el único ` M` es el efecto LF/CRLF de W-3, sin diff). Lo nuevo sin trackear: este fichero. La cifra final va en el resultado.

### Próximo paso

`sdd-archive`: fusionar los dos deltas, repetir 4.1-4.3 sobre las specs vivas, quitar F1C-10 del test de «en curso» y arreglar su título, escribir `archive-report.md` con la sección de personas y comprobar `npm test` tras la fusión.
