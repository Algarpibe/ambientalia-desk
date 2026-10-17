# Informe de verify — `cifras-caducas-y-lectores-de-servicio` (F1B-09, `cierra: no`)

Revisión verificada: rama en `87ea391` (base del cambio `3187e42`). Modo: strict TDD.

**Veredicto: PASS. 0 críticos, 2 avisos, 2 sugerencias.**

## 1. Tareas 1.1-2.3 contra `git diff 3187e42 87ea391`

| Tarea | Evidencia | Estado |
|---|---|---|
| 1.1 cinco casos | `packages/shared/src/comentariosVigilados.test.ts:30,40,48,54,67` (casos a-e) | OK |
| 1.2 mutación del guardián de llamadores | reproducida: `void transitionById('x')` en `fechasDerivadas.ts` y `void transitionsForStatus('x')` en `transitionActor.ts` ponen (e) en rojo | OK |
| 1.3 sustituciones | `estados.ts:83`, `:145`; `ticketService.ts:238`; `transitions.ts:67`, `:300`, `:348` | OK |
| 1.4 mutaciones del detector | reproducidas SEIS, 43, «sólo comment()» (ver §5) | OK |
| 2.1 ocho frases | remisiones:752, tickets-core:1753, zoho-sync:789, derivacion-avisos:732, trazas:516, transitions-st:1360/:1367/:1385 dicen 31 | OK |
| 2.2 «cinco»→«seis» | `transicionesEjecucion.test.ts:290`, `:292`, `:311` | OK |
| 2.3 cierre del intento | códigos de §6, todos 0 | OK |

3.1-3.3 pendientes por diseño.

## 2. Diseño D1-D5

- **D1** cumplido: las cinco cifras vigiladas y la de `transitions.ts:67` ("todas las etapas", sin guardián, supuesto S-1).
- **D2** cumplido. `wc -l` en `3187e42` y `87ea391`, idénticos: estados.ts 190/190, transitions.ts 397/397,
  ticketService.ts 277/277, transicionesEjecucion.test.ts 453/453, remisiones 2183/2183, tickets-core 4200/4200,
  zoho-sync 1519/1519, derivacion-avisos 1172/1172, trazas 823/823, transitions-st 2573/2573. El diff de código y specs
  son sólo líneas sustituidas en sitio (`-U0`), más el fichero nuevo (92 líneas).
- **D3** cumplido salvo matiz (aviso W-1). El guardián recorre `apps`, `packages`, `scripts`, excluye pruebas,
  `transitions.ts` e `index.ts` (`comentariosVigilados.test.ts:74-90`).
- **D4** cumplido: delta MODIFIED sólo de RQ-TZ-01; las frases del caso B (`tickets-core:546`, `transitions-st:376`,
  `derivacion-avisos:227`, `:726`, "Previously") conservan el 34 fechado.
- **D5** cumplido: sin cambios en `apps/desk/src`.

## 3. Cifras medidas hoy (script tsx contra el catálogo)

12 estados de servicio con una sola salida; 8 en el cruce con `ESTADOS_EN_ESPERA` (11 `en_espera`); 31+6+4 = 41
transiciones; ejecuciones 33/7/4 = 44; `TRANSICION_REMISION_CONFIRMADA` = `remision_confirmada` → `Remisión creada`
(`transitions.ts:150`); `liberacion` declara `certificado_fabrica` (`transitions.ts:360`). `cfOrdenVenta` se usa una sola vez
en el catálogo, en `habilitar_servicio` (`transitions.ts:189`), sin fecha derivada combinada: la afirmación del escenario de
`transitions-st` sigue cierta en los tres catálogos.

## 4. Delta RQ-TZ-01

Citas del delta contra `apps/desk/server/transicionesEjecucion.test.ts`: `:105-117` (comentario, 31 transiciones y 33
ejecuciones), `:272-285` (cierra en `toBe(33)`, `:285`), `:365` (`toBe(7)`), `:419` (`toBe(4)`): dicen lo que el delta
afirma. El bloque del delta ocupa 18 líneas (`specs/trazas/spec.md:5-22`) y el vivo `openspec/specs/trazas/spec.md:38-55` también 18.

## 5. El guardián discrimina (mutaciones reproducidas, restauradas con edición inversa exacta)

| Mutación en el fichero vigilado | Resultado |
|---|---|
| `estados.ts:145` «da OCHO,» → «da SEIS,» | (a) rojo: «debe decir «da OCHO,»» |
| `ticketService.ts:238` «otras 40» → «otras 43» | (c) rojo |
| `transitions.ts:348` quitar `liberacion` | (d) rojo |
| `estados.ts:83` `remision_confirmada` → `facturado` | (b) rojo |
| `void transitionById('x')` en `fechasDerivadas.ts` | (e) rojo |
| `void transitionsForStatus('x')` en `transitionActor.ts` | (e) rojo |

Tras restaurar, 5 de 5 en verde y `git status --short` vacío. Nota: en este entorno (autocrlf) los ficheros sobrescritos
quedaron con estado "M" sin diferencia de contenido; se normalizaron con `git checkout --` sólo de ficheros sin otros cambios.

## 6. Códigos de salida (HEAD `87ea391`)

| Comando | Código | Detalle |
|---|---|---|
| `npm test` | 0 | 282 ficheros pasan, 3 omitidos; 4769 pruebas pasan, 11 omitidas |
| `npm run typecheck` | 0 | sin errores |
| `npm run lint` | 0 | 0 errores, 165 avisos (tope 165) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 7242 comprobadas, 13 abreviadas rotas informativas (no bloquean), 0 cabeceras inválidas |

## 7. TDD (strict-tdd-verify)

| Comprobación | Resultado |
|---|---|
| Evidencia reportada | ⚠️ en prosa (`apply-progress.md`, lotes 1-2), sin la tabla "TDD Cycle Evidence" |
| Fichero de prueba existe | ✅ |
| Rojo visto | ✅ 5 de 5 con mensaje (apply-progress 1.1) |
| Verde confirmado | ✅ 5 de 5 hoy |
| Triangulación | ✅ cada cifra se compara con el cálculo del catálogo; 6 mutaciones distintas rojas |
| Safety net de ficheros modificados | ➖ sólo comentarios y specs |

Auditoría de aserciones: sin tautologías, bucles fantasma ni humo. El bucle de (d) está protegido por
`conNegocio.length > 0`; (e) llama a código real de lectura y compara con `[]` con prueba de mutación que lo vuelve no vacío.

## 8. Matriz RQ-TZ-01

| Requisito (delta) | Evidencia | Estado |
|---|---|---|
| Nueve columnas y `performed_at` | sin cambio de texto; `repo.ts:314-318` | conforme |
| Sin actor, nunca | sin cambio | conforme |
| Actor de sesión | sin cambio | conforme |
| Cobertura de 41 transiciones, 44 ejecuciones (33/7/4), destino y fila | `transicionesEjecucion.test.ts:285`, `:365`, `:419`, con la comparación `observado` vs `esperado`; catálogo medido 31/6/4 y 33/7/4 | conforme |
| Atomicidad | sin cambio | conforme |

## 9. Hallazgos

- **CRITICAL:** ninguno.
- **WARNING W-1:** D3 pide que el comentario de `transitions.ts:300` "cubra las dos funciones", pero el JSDoc
  (`:300`) está sólo sobre `transitionsForStatus` (`:301`), no nombra `transitionById` y esta (`:305`) no tiene comentario; el
  guardián comprueba sólo el primero. Las dos siguen vigiladas por el recuento de llamadores.
- **WARNING W-2:** `apply-progress.md` no trae la tabla "TDD Cycle Evidence" formal (la evidencia está en prosa).
- **SUGERENCIA S-1:** 1.2 se hizo después de 1.3 (desviación declarada y justificada en apply-progress); sin efecto.
- **SUGERENCIA S-2:** `apply-progress.md` dice "Ocho frases" para 2.1; la tarea cuenta siete (cinco punteros más tres de
  transitions-st son ocho: la tarea las llama siete por un error de cuenta en `tasks.md` 2.1 y el diseño D4). Corregir el texto
  en el archivo.

Nota para el archive: los avisos no bloquean. 3.1 (barrido de citas) sigue pendiente; el detector sale 0.

## 10. Estado posterior al informe (orquestador)

- **W-1 corregido en sitio** en el mismo commit que este informe: `packages/shared/src/transitions.ts:300` nombra ya `transitionsForStatus` y `transitionById` (`:305`); el fichero conserva sus 397 líneas y el guardián (caso e) sigue en verde. W-2, S-1 y S-2 quedan como están: la evidencia TDD está en prosa en `apply-progress.md`, y «siete» cuenta frases por fichero (las tres de `transitions-st` son un mismo escenario).
