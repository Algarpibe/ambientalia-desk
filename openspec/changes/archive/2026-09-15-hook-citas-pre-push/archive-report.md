# Informe de archivado — hook-citas-pre-push

## Resumen

Cambio archivado el 2026-09-15 tras completar verificación, implementación y validación. Capacidad nueva `citas-verificables` integrada: 18 requisitos, 64 escenarios, 102 tareas. Tercer verify: PASS. Spec sincronizado a `openspec/specs/citas-verificables/spec.md`. Carpeta movida a `openspec/changes/archive/2026-09-15-hook-citas-pre-push/`. Dos tareas de PERSONA pendientes tras archivado (fuera del recuento de tareas de implementación); IV-10 sin destino asignado hasta que Gerencia decida.

## Capacidad sincronizada

**Nombre:** `citas-verificables`  
**Tipo:** capacidad nueva (no existía en main antes)  
**Requisitos:** 18 (RQ-CV-01 a RQ-CV-18)  
**Escenarios:** 64 (50 con prueba automática, 14 con evidencia manual)  
**Tareas de implementación:** 102, todas completadas  

## Recorrido — 7 cortes y 11 generaciones del ledger

| Gen. | Unidad | Resultado | Líneas (ledger) | Commits |
|---|---|---|---|---|
| 1 | corte 1a-i: núcleo puro y pruebas en memoria (tareas 1.1-1.27 de 1.1-1.42) | interrumpido: presupuesto superado con 27/42, re-troceo | 55 | `7625921` |
| 2 | corte 1a-ii: guardián de binarios, resolución, informe y RQ-CV-18 (tareas 1.0 y 1.28-1.42) | pasado | 144 (git: 247 trackeadas + 248 nuevas) | `69bc3a9` |
| 3 | corte 1b-i: defecto D6, adaptador git, CLI y pruebas sintéticas (tareas 2.0-2.11) | pasado | 238 (git: 529) | `56a0095` |
| 4 | corte 1b-ii: anclas por índice local, invariante de conservación, exclusiones, D12, anclaje, escalada y binarios (tareas 2.12-2.26) | pasado, presupuesto de 800 superado (843), settle por decisión de Gerencia | 843 | `36e5a2d` |
| 5 | corte 2: coste por revisión, RQ-CV-03 en ancladas, modos `--sha` y `--generar-base`, línea base, IV-10 y regla de mutación 4 (tareas 3.8-3.10 y 3.1-3.7) | pasado | 618 (+37 sin trackear = 655) | `73a9acb`, `35f2698` |
| 6 | corte 3: hook versionado, instalador, `.gitattributes`, `DEPLOY.md`, arreglo del `Dockerfile` (tareas 4.1-4.14 y añadidos) | pasado | 426 (+165 sin trackear = 591) | `f962e81` |
| 7 | corte 4 (fase 5): verificación final (tareas 5.1-5.6) | pasado | 356 | `53c6fc5`, `a4d5b81` |
| 8 | primer verify | pasado (PASS WITH WARNINGS, 2 WARNING) | 288 | `b861065` |
| 9 | segundo verify: sobre `verify-result/v1` y matriz por escenario | FALLIDO: 62/64 escenarios, el validador nativo rechaza un veredicto aprobatorio con escenarios incompletos; 3 WARNING | 155 | `fac7709` |
| 10 | remediación del verify fallido (WARNING-1, 2, 3 y SUGGESTION) | pasado | 273 | `dabc2db` |
| 11 | tercer verify sobre el árbol remediado | pasado (PASS) | 541 | `e1de15a` |

**Total del ledger:** 11 intentos, 3.937 líneas.  
**Planificación previa** (propuesta, spec, diseño, tareas): `cb39778` … `2f1aeda`, 2026-09-13, fuera del ledger.

## Firmas de mantenedor — 7: 6 resets y 1 rescope

Las siete son del actor «Alfonso» (registros del ledger):

- **reset gen 1→2:** re-troceo del corte 1a en 1a-ii por presupuesto; decisión de Gerencia 2026-09-13
- **reset gen 2→3:** corte 1b-i tras cerrar 1a-ii; decisión de Gerencia 2026-09-13
- **reset gen 3→4:** corte 1b-ii tras cerrar 1b-i; decisión de Gerencia 2026-09-14
- **reset gen 4→5:** corte 2 tras cerrar 1b-ii; decisión de Gerencia 2026-09-14
- **reset gen 5→6:** corte 3 tras cerrar corte 2; decisión de Gerencia 2026-09-14
- **reset gen 6→7:** fase 5 de verificación final tras cerrar corte 3; decisión de Gerencia 2026-09-14
- **rescope gen 9→10:** remediación del verify fail `sha256:400a38b9` por decisión de Gerencia 2026-09-15: WARNING-1/2/3 y SUGGESTION, un solo intento restante. Hizo falta porque el candidato no había derivado: el ledger rechazó el reset por electivo y ofreció `rescope`, que arrastra los acumulados del objetivo anterior (1 intento y 155 líneas).

Tres avances automáticos (gen 7→8, 8→9 y 10→11) sin firma, porque el objetivo anterior estaba completo.

## Las dos cegueras del ledger

Medidas (regla del ciclo 2 de `CLAUDE.md`):

1. **Lo nuevo sin trackear no cuenta:** el intento 1 registró 55 con 928 líneas nuevas sin trackear, y el corte 1b-i registró 238 frente a 529 con git porque 291 eran ficheros nuevos.
2. **Binarios en el árbol de partida:** el intento 2 registró 144 frente a 247 trackeadas, y las 103 que faltaban eran de `detector.ts`, que en `ef08129` llevaba un byte NUL.

Con todo trackeado y sin binarios (corte 1b-ii) el ledger contó 843, lo mismo que git. La medida real es `git diff --shortstat` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

## Verificación final y remediación

**Tercer verify** (commit `e1de15a`): **PASS**, 18/18 requisitos, 64/64 escenarios (50 con prueba automática y 14 con evidencia manual), 0 CRITICAL, 0 WARNING, 1 SUGGESTION abierta.

Sobre `gentle-ai.verify-result/v1` validado por `gentle-ai sdd-verify-validate`; evidencia `sha256:724e4c5d21959f247ecee51af8d93c76433002658f2d99da0e0f6ed7b4c01ce9`.

**Tareas:** 102/102 completadas.

**Pruebas:** `npm test` 1111 pasan y 2 saltadas; `typecheck` exit 0; `lint` 0 errores y 158 avisos; `build` exit 0.

**Detector:** `--sha e1de15a` con 0 bloqueantes, 37 informadas y 0 caducadas. **CI:** success.

### Remediación del segundo verify

El segundo verify (gen 9) falló porque el validador nativo rechaza un veredicto aprobatorio con escenarios incompletos: 62/64 cubiertos, y dos de RQ-CV-06 sólo en parte. La remediación (gen 10) cerró:

- **WARNING-1:** 25 citas por línea entre artefactos → prosa, 0 restantes.
- **WARNING-2:** salida del hook del push de `f962e81` → copia literal parcial con procedencia y recorte declarados.
- **WARNING-3:** dos escenarios de RQ-CV-06 probados sólo a nivel de cosecha → tres pruebas por `detectar()` y segundo signo del control de cosecha, con rojo por mutación (MUT-b 5/39, MUT-d1 5/39, MUT-d2 4/39).

- **SUGGESTION:** «cuatro exclusiones» de la propuesta conservado como caso C, con las seis nombradas; ramas del corte 4 corregidas a 83,96.

### Varianza de la cobertura

**Medido:** tres tomas de `npm run test:coverage` sobre el mismo árbol remediado, sin cambiar ningún fuente, dan ramas global 83,94 · 83,94 · 83,93, y el tercer verify midió 83,93. La cifra global de ramas varía entre ejecuciones. Por eso la diferencia 83,95/83,96 que el segundo verify llamó redondeo es esta misma varianza. Las ramas de `apps/desk/server/citas` bajaron de 95,42 a 95,39, estables en todas las tomas, sin cambiar ningún fuente del módulo.

**Hipótesis, no medidas:** la variación global vendría de la cobertura de bloques de v8 fuera de `apps/desk/server/citas`; la bajada de `citas`, de que las pruebas nuevas hacen que v8 informe más bloques de rama. Ningún umbral en riesgo (ramas ≥ 78).

## Abiertos tras el archivado

### SUGGESTION de `Dockerfile:14` en `5f05466` — CERRADA después del archivado

No es sólo de redacción: el comentario falso invita a mover `tsx` a `devDependencies`, y con eso `npm ci` en producción dejaría de instalarlo.

**Ubicación:** `Dockerfile:14` en `5f05466` dice «tsx es devDep», pero `package.json:42` declara `tsx` dentro de `dependencies` (bloque que abre en `:25`; `devDependencies` en `:44`).

**Tarea:** 4.13-A1 lo declaró falso y fuera de alcance.

**Cierre (caso C, 2026-09-15):** lo cerró el commit «docs(docker): el comentario de tsx dice la verdad», posterior a este archivado, sustituyendo las tres líneas de comentario por otras tres (mismo número de líneas, ninguna instrucción tocada). El comentario nuevo dice que `tsx` va en `dependencies` a propósito porque el `CMD` lo usa en runtime. Medido en `node:22-alpine` sin TTY: sin `tsx` instalado, `npx tsx` lo descarga del registro y arranca con red, y falla sin red (`EAI_AGAIN`). Por eso el comentario no dice que el arranque se rompa siempre, sino que depende de la red.

**Archivar:** no lo corrige. La tanda no asigna destino. Queda como SUGGESTION.

### Tareas de PERSONA, fuera del recuento (regla del ciclo 1)

**Archivar no las da por hechas.**

#### P.1 — Leer lo semántico de la línea base

**Qué:** cada línea citada de la línea base de `apps/desk/server/citas/lineaBase.jsonl` debe DECIR lo que su frase afirma.

**Medida:** tarea escrita con las 51 entradas medidas sobre `773ad75`. La base vigente tiene 37 entradas (28 claves), generada por el detector sobre `73a9acb` el 2026-09-14. El detector no lo comprueba y su mensaje lo dice.

**Dueño:** quien decida el alcance de la reparación (casos A/B/C de la regla de mutación 4 de `CLAUDE.md`).

**Registro:** dueño, resultado y fecha.

**Estado:** pendiente.

#### P.2 — Asignar destino a IV-10 y decidir quién repara la base

**Qué:** asignar destino a IV-10 y decidir quién repara la línea base.

**Por qué sigue abierta:** la decisión Q4 de la tanda dejó IV-10 sin asignar a propósito: «la base no encoge hasta que Gerencia asigne quién la repara».

**Dueño:** Gerencia.

**Registro:** la propia fila IV-10 de `CLAUDE.md` y de `openspec/config.yaml`, con la frase de Q4 mientras siga sin decidir.

**Estado:** pendiente, IV-10 SIN ASIGNAR.

## Barrido de destinos al cerrar

**Regla:** un destino es una promesa, y hay que barrerla al cerrar la épica.

**Resultado:** ningún desvío vivo tiene como destino esta tanda. IV-10 nació en ella (corte 2), con destino «SIN ASIGNAR» decidido explícitamente en Q4, y así sigue. No se reasigna nada.

## Disposición

**Spec sincronizado:** `openspec/specs/citas-verificables/spec.md` (copia mecánica byte a byte).

**Cambio archivado:** `openspec/changes/archive/2026-09-15-hook-citas-pre-push/`

**Contenidos del archivo:**

- ✅ `proposal.md`
- ✅ `specs/citas-verificables/spec.md`
- ✅ `design.md`
- ✅ `tasks.md` (102/102 tareas completadas)
- ✅ `apply-progress.md`
- ✅ `verify-report.md`

Se archiva con 102/102 tareas y el verify en PASS. **Archivar no da por hechas** P.1 ni P.2, que siguen pendientes con sus dueños. Tampoco corrige la SUGGESTION de `Dockerfile:14` en `5f05466` (cerrada después, ver arriba) ni explica la varianza de la cobertura: las tres cosas quedan registradas arriba.
