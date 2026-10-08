---
tanda: F1B-09
motivo: ""
capacidad: [mapa-blueprint]
maestro: ["M11.6"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: el mapa generado del blueprint cubre los tres flujos

## 1. Intención

El mapa del blueprint se genera desde el código y una prueba impide que se desfase, pero sólo para el
flujo de servicio técnico: el guion pasa `TRANSITIONS` y `ESTADOS_SERVICIO`
(`scripts/generar-mapa-blueprint.ts:29`, `scripts/generar-mapa-blueprint.ts:31`) y la prueba vigila cuatro
ficheros (`packages/shared/src/mapaBlueprint.test.ts:168`). Equipo nuevo y soporte remoto, que ya son
catálogos del registro (`packages/shared/src/flujos.ts:19-22`), no tienen mapa: quien los quiera ver los
dibuja a mano, que es justo lo que la fila del plan daba por superado
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:166`).

Gerencia respondió «Ahora, en F1B-09» (`openspec/config.yaml` → `decisiones_de_gerencia_adenda` →
`decision/e222-mapa-equipo-nuevo-soporte-remoto`). Este cambio extiende el generador y su prueba a los dos
flujos nuevos. Pasaje del maestro: M11.6
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`).

**Resultado esperado:** un `blueprint-*.md` generado por cada flujo sin fases, vigilado igual que los cuatro
de servicio; añadir un cuarto flujo al registro sin su mapa pone la suite roja.

## 2. ¿Cierra F1B-09? No

`cierra: no` no es opinable: lo fija la consecuencia (5) de `decision/e222-mapa-equipo-nuevo-soporte-remoto`
—F1B-09 sigue abierta mientras lo esté la épica 1B (`decision/orden-tres-tandas-04-10`)—.

| Parte de la fila F1B-09 | Estado tras este cambio |
|---|---|
| Auditoría de los tres flujos, primera pasada | Hecha por `audit-f1b` (archivado el 2026-10-05, `cierra: no`) |
| Extensión del mapa generado a equipo nuevo y soporte remoto | **La cubre este cambio** |
| Repaso de la auditoría al cerrar la épica 1B | **Queda.** Es lo que mantiene abierta la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`) |

**Hallazgos de la auditoría (bandeja, E-222 a E-230).** Estado leído el 2026-10-08 en `docs/sdd/ENTRADA.md`
y contrastado con `openspec/config.yaml`: sólo E-222 y E-225 tienen decisión registrada.

| Entrada | Asunto | Estado verificado | Destino |
|---|---|---|---|
| E-222 | El mapa sólo cubre servicio | **Lo resuelve este cambio.** La bandeja la sigue marcando abierta y sin destino: caduco frente a la decisión; lo anota Supervisión (§10) | F1B-09 (decidido) |
| E-223 | ¿La anulación alcanza a los flujos nuevos? | Abierta, sin decisión | Propuesto: punto abierto; F1C-01 si la respuesta es sí |
| E-224 | Los indicadores no distinguen el flujo | Abierta, sin decisión | Propuesto: F1F-05, a confirmar |
| E-225 | `Verificación` y `Solicitud Soporte` caen en «Otros» | Decidida: `decision/e225-columna-propia-dos-estados` | F1B-08, cambio propio. **Fuera de este cambio** |
| E-226 | Clase de espera y áreas sin decidir | Abierta, sin decisión | Propuesto: punto abierto con dueño |
| E-227 | Piezas exportadas sin llamador | Abierta | Parcial: sin destino para los dos lectores del catálogo |
| E-228 | Cifras y comentarios caducos | Abierta | Sin destino asignado |
| E-229 | `CLAUDE.md` y `config.yaml` caducos | Corregida como trabajo documental (adenda del 2026-10-05); la entrada original sigue marcada abierta | Punto abierto con dueño |
| E-230 | El maestro dice «F1B-09, sin empezar» | Abierta | Propuesto: expediente del maestro |

Este cambio no cierra, ni toca, E-223 a E-230.

## 3. Alcance

### Dentro

1. **Motor** (`packages/shared/src/mapaBlueprint.ts`): parámetros **opcionales** sobre `EntradaMapa`
   (enfoque A) para el nombre del flujo y el nombre del fichero completo; una sola función, sin duplicado.
   Con `fases` vacío no se generan vistas por fase ni se exige fase por estado.
2. **Registro por flujo**, función pura de `packages/shared`: para cada clave de `CATALOGO_POR_FLUJO`
   construye la entrada del generador. Los estados de equipo nuevo y de soporte remoto **se derivan del
   catálogo** (orígenes y destinos, por primera aparición). Ninguna lista nueva de transiciones ni de
   estados escrita a mano.
3. **Guion** (`scripts/generar-mapa-blueprint.ts`): escribe también los ficheros de los flujos nuevos,
   delegando todo el cálculo en `packages/shared`.
4. **Dos ficheros generados nuevos** en `docs/artefactos/`, uno por flujo nuevo.
5. **Pruebas**: anti-desfase de todos los ficheros de los tres flujos, exhaustiva sobre las claves de
   `CATALOGO_POR_FLUJO`.
6. **Documentación de cierre** (regla de mutación 4): anclas en la auditoría de F1B-09, la nota de
   `docs/artefactos/NOTA.md` y el comentario de `packages/shared/src/estados.ts:176-180`, todo en sitio y
   sin mover líneas.

### Fuera, expresamente

- La columna propia de `Verificación` y `Solicitud Soporte`: es otro cambio, con `tanda: F1B-08`
  (`decision/e225-columna-propia-dos-estados`; regla R-4, un cambio lleva un solo `tanda:`).
- F1A-10, el mapa dentro de la aplicación (consecuencia (4) de la decisión).
- `apps/desk/src`, `jsdom` y pruebas `.tsx`.
- `openspec/config.yaml` y `docs/sdd/ENTRADA.md`: la rama no los toca (§10).
- Fases para los flujos nuevos, y la marca `·espera·` en ellos (depende de E-226).
- Las notas de pendientes de `openspec/specs/transitions-equipo-nuevo/spec.md:548` y
  `openspec/specs/transitions-soporte-remoto/spec.md:322`, que siguen remitiendo el mapa y la columna a
  F1B-09: son de otras dos capacidades; se anotan para Supervisión.

## 4. Restricciones duras (son criterios de aceptación)

| Nº | Restricción | Cómo se comprueba |
|---|---|---|
| R1 | Los catálogos salen de `CATALOGO_POR_FLUJO`, el mismo registro que usa `catalogoDelTicket` (`packages/shared/src/flujos.ts:64-66`) | Prueba: el registro por flujo recorre `Object.keys(CATALOGO_POR_FLUJO)`; mutaciones (a) |
| R2 | Parámetros opcionales, sin función duplicada. `packages/shared/src/cifrasAncladas.test.ts:45-55` llama al generador con los seis campos de hoy: un campo obligatorio nuevo lo rompería | `npm run typecheck` y `cifrasAncladas.test.ts` pasan **sin editarse** |
| R3 | Los cuatro ficheros de servicio quedan **byte a byte** como están | `git diff --stat a26ed48 -- docs/artefactos/blueprint-completo.md docs/artefactos/blueprint-fase-*.md` vacío; la prueba de `packages/shared/src/mapaBlueprint.test.ts:168` sigue verde sin editarse |
| R4 | Las pruebas nuevas van **al final** de `packages/shared/src/mapaBlueprint.test.ts` (tras `packages/shared/src/mapaBlueprint.test.ts:188`), sin mover nada anterior | `git diff` de ese fichero sin líneas borradas |
| R5 | Las líneas 26 a 35 de `scripts/generar-mapa-blueprint.ts` siguen existiendo, no vacías y diciendo lo mismo: la llamada de servicio se conserva en su sitio (`scripts/generar-mapa-blueprint.ts:26-35`) y lo nuevo va después. El bloque de importación (`scripts/generar-mapa-blueprint.ts:14-24`) no gana líneas | `git diff` sin cambios antes de la línea 36; detector de citas en verde |
| R6 | Presupuesto: 800 líneas por intento, medidas con `git diff --shortstat --no-renames` más lo nuevo sin trackear; válvula en 720 | Medida registrada antes de cada `settle` |
| R7 | Strict TDD: cada prueba nueva se ve roja antes de escribir el código | `apply-progress.md` registra el rojo |

## 5. Enfoque

Enfoque A de la exploración, sin cambios de fondo.

- `EntradaMapa` (`packages/shared/src/mapaBlueprint.ts:23-30` en `a26ed48`) gana campos opcionales. Sin ellos, el
  comportamiento es el de hoy: mismos nombres (`packages/shared/src/mapaBlueprint.ts:32-37` en `a26ed48`), mismos
  títulos (`packages/shared/src/mapaBlueprint.ts:161` en `a26ed48`, `packages/shared/src/mapaBlueprint.ts:209` en `a26ed48`).
- La guarda D-1 (`packages/shared/src/mapaBlueprint.ts:108-122` en `a26ed48`, llamada desde
  `packages/shared/src/mapaBlueprint.ts:219` en `a26ed48`) se aplica **sólo si hay fases declaradas**. Leído el código:
  hoy, con `fases: []` y `fasePorEstado: {}`, lanza para el primer estado; no se ha ejecutado.
- El registro por flujo vive en `packages/shared` para que el guion y la prueba consuman **la misma**
  función: dos construcciones paralelas de la entrada serían el molde H5 de `CLAUDE.md`.
- Servicio conserva `ESTADOS_SERVICIO`, los dos pasos sin botón y `FASES`: es lo que garantiza R3.

## 6. Impacto por capacidad — `mapa-blueprint`

| Requisito | Cambio |
|---|---|
| RQ-MB-01 | **Modificado.** La CLI vuelca los ficheros de los tres flujos; sigue sin construir datos del grafo |
| RQ-MB-02 | Sin cambio: las 35 aristas son de servicio |
| RQ-MB-03 | **Modificado.** Cuatro ficheros de servicio más uno completo por cada flujo sin fases: seis |
| RQ-MB-04 | **Modificado.** La guarda de fase rige cuando hay fases declaradas; un flujo sin fases no lleva vistas por fase |
| RQ-MB-05 | **Modificado.** La leyenda va en el diagrama completo de cada flujo |
| RQ-MB-06 | **Modificado.** El anti-desfase cubre todos los ficheros de los tres flujos y es exhaustivo sobre `CATALOGO_POR_FLUJO` |
| RQ-MB-07 | **Modificado, sólo redacción:** «los cuatro `blueprint-*.md`» pasa a nombrar los cuatro de servicio |
| RQ-MB-08 | **Nuevo.** Un mapa por flujo desde `CATALOGO_POR_FLUJO`, con estados derivados; equipo nuevo, 5 estados y 7 aristas; soporte remoto, 4 y 4, fijados por aserción |

Capacidades nuevas: ninguna (no aplica R-2). `transitions-st`, `transitions-equipo-nuevo` y
`transitions-soporte-remoto`: sin delta.

Cifras verificadas en `packages/shared/src/transitions.ts:350-363` (seis transiciones; `liberacion`, en
`packages/shared/src/transitions.ts:359`, tiene dos orígenes: 7 aristas, 5 estados) y
`packages/shared/src/transitions.ts:388-397` (cuatro transiciones, 4 aristas, 4 estados). Las diez son de
Servicio Técnico.

## 7. Plan de pruebas (rojo previo)

| Nº | Prueba nueva | Rojo previo esperado |
|---|---|---|
| P1 | Con `fases` vacío el generador no lanza y devuelve un solo fichero | Lanza por la guarda D-1 |
| P2 | Con nombre de flujo y de fichero, el título y la clave de salida son los pedidos | Devuelve `blueprint-completo.md` y el título de servicio |
| P3 | Sin parámetros opcionales, la salida de servicio es la de hoy: cuatro claves | Verde desde el principio; es la guarda de R3, no una prueba con rojo |
| P4 | El registro por flujo tiene exactamente las claves de `CATALOGO_POR_FLUJO` | La función no existe |
| P5 | Los estados de equipo nuevo y soporte remoto son los derivados del catálogo: 5 y 4; 7 y 4 aristas | La función no existe |
| P6 | Anti-desfase: todos los ficheros de los tres flujos, regenerados, son iguales a los commiteados; cada flujo aporta al menos uno | Faltan los dos ficheros en disco |
| P7 | Exhaustividad: un registro con un cuarto flujo sintético deja un fichero sin pareja en disco y falla | La comprobación no existe |

### Mutaciones obligatorias

| Nº | Mutación | Debe poner rojo |
|---|---|---|
| (a) | Para **cada uno** de los tres flujos, por separado: añadir, quitar o cambiar una transición de **su catálogo** sin regenerar. Tres ejecuciones, registradas | P6, en el fichero de ese flujo |
| (b) | Ensuciar a mano el fichero vigilado de **cada** flujo —los seis ficheros, uno por ejecución— (regla de mutación 2) | P6 para los nuevos; la prueba de `packages/shared/src/mapaBlueprint.test.ts:168` para los de servicio |
| (c) | Quitar la guarda de fases cuando hay fases declaradas | La prueba de `packages/shared/src/mapaBlueprint.test.ts:65` |
| (d) | La inversa de (c): aplicar la guarda también sin fases | P1 |
| (e) | Añadir una clave a `CATALOGO_POR_FLUJO` sin fichero | P7 (y `tsc`, por los `Record<Flujo, …>`) |

Las mutaciones que ensucian disco se ejecutan a mano y se registran en `apply-progress.md`, como fijó
F1A-06; (a) lleva además, por flujo, una prueba permanente que inyecta un catálogo mutado.

## 8. Supuestos aplicados (razonables y reversibles)

| Nº | Supuesto | Qué cambia si la respuesta es otra |
|---|---|---|
| S-A | Ficheros nuevos: `blueprint-equipo-nuevo.md` y `blueprint-soporte-remoto.md`, con el prefijo de RQ-MB-03 | Dos nombres en el registro por flujo y en la prueba; se regenera |
| S-B | La leyenda lista las tres áreas de `AREAS` aunque el flujo sólo use una (`packages/shared/src/mapaBlueprint.ts:150-157` en `a26ed48` no cambia) | Filtrar por áreas usadas: unas 5 líneas y una prueba; cambia el fichero de los dos flujos nuevos, nunca los de servicio |
| S-C | Un flujo sin fases lleva sólo el diagrama completo | Declarar fases para un flujo es dato de negocio: pide decisión y otro cambio |
| S-D | Sin marca `·espera·` en los flujos nuevos: los cuatro `ESTADOS_SIN_SALIDA` son de servicio y la clase de `Pendiente` está sin decidir (`packages/shared/src/estados.ts:105`, E-226) | Se pasa la lista al registro por flujo y se regenera |
| S-E | Orden de estados de un flujo nuevo: primera aparición en su catálogo, orígenes antes que destino | Cambian los alias `eNN` y el orden de nodos; se regenera |
| S-F | Servicio no se deriva del catálogo: conserva `ESTADOS_SERVICIO` (`packages/shared/src/estados.ts:188`) | Derivarlo reordenaría los alias y rompería R3: no es reversible sin decisión |
| S-G | La cabecera de «generado» de los flujos nuevos nombra sus fuentes reales y no `fasesBlueprint.ts` (`packages/shared/src/mapaBlueprint.ts:54-61` en `a26ed48`); la de servicio no cambia | Reutilizar la misma cabecera ahorra unas 10 líneas y deja una frase inexacta |
| S-H | El comentario de `packages/shared/src/estados.ts:176-180` («no debe aparecer en el mapa generado») se precisa en sitio —mapa de servicio—, sin cambiar el número de líneas | Dejarlo: queda una afirmación falsa en presente, del molde de E-228 |
| S-I | El registro por flujo va en fichero nuevo de `packages/shared/src/` | Ponerlo en `mapaBlueprint.ts` obliga a importar `flujos.ts`, dependencia que hoy no existe |
| S-J | `toca_maestro: si`. M11.6 dice hoy «F1B-09, sin empezar» y no dice qué flujos cubre el mapa: al terminar, la corrección pendiente (E-230) tiene que decir además que el mapa cubre los tres. La decisión lleva `maestro_revision: "no aplica"`, que se refiere a la decisión, no al pasaje | Con `no`, nada cambia en el código; sólo la cabecera y la tarea de persona T-P2 |

## 9. Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Un `import` nuevo en el guion desplaza sus líneas citadas | Media | R5: los nombres nuevos caben en líneas existentes del bloque, o la importación va tras la línea 35. Hipótesis: `eslint` acepta la segunda forma; se comprueba en apply |
| Un cambio del motor altera los ficheros de servicio | Media | R3 y P3; la prueba existente no se edita |
| Renumerar citas de la auditoría las vuelve falsas | Media | Caso B: se **anclan** a `a26ed48`, no se renumeran. Son seis, en `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:30`, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:31`, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:33`, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:249` y `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:283`, más la de `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:35` si se aplica S-H |
| `exploration.md` reproduce citas abreviadas y sin ruta que el detector puede leer como rotas | Media | Pasar el detector antes del primer commit; si bloquea, anclar o reescribir en prosa |
| La prueba permanente de (a) pasa por diferir en algo trivial | Baja | Aserción sobre el nombre de la transición inyectada, no sólo desigualdad |
| Conflicto de fusión con `main` | Baja | La rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md` |

## 10. Citas que la rama no puede reparar — para Supervisión

`openspec/config.yaml` y `docs/sdd/ENTRADA.md` citan **sin ancla** líneas del guion (de la 28 a la 31) y de
la prueba (la 168). R4 y R5 garantizan que esas líneas sigan existiendo y diciendo lo mismo, así que el
detector no bloquea. Lo que sí caduca es la **frase**: «el generador recibe sólo el catálogo de servicio»
deja de ser cierta del presente (caso C). Corresponde a Supervisión, en `main`: marcar E-222 como resuelta
con su destino, y anclar esas citas a `a26ed48`.

## 11. Áreas afectadas

| Ruta | Impacto |
|---|---|
| `packages/shared/src/mapaBlueprint.ts` | Modificado |
| `packages/shared/src/` (registro por flujo, fichero nuevo) y `packages/shared/src/index.ts` | Nuevo / una línea al final |
| `packages/shared/src/mapaBlueprint.test.ts` | Añadido al final |
| `scripts/generar-mapa-blueprint.ts` | Modificado desde la línea 36 |
| `docs/artefactos/blueprint-equipo-nuevo.md`, `docs/artefactos/blueprint-soporte-remoto.md` | Nuevos, generados |
| `docs/artefactos/NOTA.md` (`docs/artefactos/NOTA.md:135-138`) | Modificado en sitio |
| `packages/shared/src/estados.ts`, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` | Modificados en sitio |
| `openspec/specs/mapa-blueprint/spec.md` | Delta en este cambio; fusión al archivar |

## 12. Estimación de líneas por lote

| Lote | Contenido | Líneas (estimación) |
|---|---|---|
| 1 | Motor: campos opcionales, guarda condicionada; P1 a P3 | ~150 |
| 2 | Registro por flujo, guion, dos ficheros generados; P4 a P7 y mutaciones | ~260 |
| 3 | Cierre documental: anclas, `NOTA.md`, comentario de `estados.ts` | ~40 |
| — | `apply-progress.md` | ~90 |
| | **Total de apply** | **~540**, bajo la válvula de 720 |

Aparte, en sus propios intentos: delta de spec (~130), diseño (~150), tareas (~90), `verify-report.md`
(~250) y el archivo, cuya parte revisable —fusión más informe— se mide antes de aplicar.

## 13. Reversión

`git revert` del commit de fusión. No hay esquema, datos ni configuración de despliegue: los dos ficheros
nuevos desaparecen, el motor vuelve a su firma y la prueba vuelve a vigilar cuatro ficheros. Los ficheros
de servicio no cambian en ningún momento, así que no hay nada que restaurar en ellos.

## 14. Criterios de aceptación

- [ ] R1 a R7 cumplidas y comprobadas como dice su tabla.
- [ ] `docs/artefactos/` tiene seis `blueprint-*.md`; los cuatro de servicio, idénticos a `a26ed48`.
- [ ] Equipo nuevo: 5 estados y 7 aristas; soporte remoto: 4 y 4; fijado por aserción.
- [ ] P1 a P7 verdes, cada una con su rojo previo registrado (salvo P3).
- [ ] Mutaciones (a) ×3, (b) ×6, (c), (d) y (e) ejecutadas, rojas y registradas.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; `cifrasAncladas.test.ts` sin editar.
- [ ] Detector de citas en verde; las seis citas de la auditoría, ancladas.
- [ ] El `archive-report.md` dice en una línea qué parte de F1B-09 cubrió y qué dejó fuera.

## 15. Tareas de personas — fuera del recuento

Archivar el cambio **no las da por hechas**.

| Nº | Qué | Dueño | Destino |
|---|---|---|---|
| T-P1 | Marcar E-222 como resuelta y anclar las citas sin ancla de `openspec/config.yaml` y `docs/sdd/ENTRADA.md` (§10) | Supervisión | `docs/sdd/ENTRADA.md` y `openspec/config.yaml`, en `main` |
| T-P2 | Añadir a la corrección de M11.6 (E-230) que el mapa generado cubre los tres flujos | Gerencia | Expediente del maestro |
| T-P3 | Situar E-223, E-224, E-226, E-227 y E-228, que siguen sin decisión | Gerencia | `docs/sdd/ENTRADA.md` (regla R-3) |
| T-P4 | Actualizar las notas de pendientes de las specs de equipo nuevo y soporte remoto que remiten a F1B-09 | Supervisión, con el cambio de F1B-08 | Ese cambio |
| T-P5 | Revisar a la vista los dos mapas nuevos renderizados | Analista, antes de fusionar | Parte de la tanda |

## 16. Exploración contrastada

| Afirmación de la exploración | Resultado |
|---|---|
| Equipo nuevo 6/7/5; soporte remoto 4/4/4 | Confirmado, §6 |
| Ningún flujo nuevo tiene pasos sin botón, estados sin salida ni fases | Confirmado por lectura |
| `fases: []` con `fasePorEstado: {}` lanza hoy | Confirmado por lectura, no ejecutado |
| Segundo consumidor en `cifrasAncladas.test.ts` | Confirmado, `packages/shared/src/cifrasAncladas.test.ts:45-55` |
| Diez citas fuera de `archive`; ninguna a `mapaBlueprint.ts` | Total confirmado. **El reparto difiere:** son siete al guion y tres a la prueba, no seis y tres |
| 41 citas en `archive`, excluido del detector | Hipótesis: no comprobado |
| La bandeja sigue marcando E-222 abierta y sin destino | Confirmado |
| *(no figuraba)* | El comentario de `packages/shared/src/estados.ts:176-180` afirma que `Verificación` no debe aparecer en el mapa generado, y la auditoría lo cita: S-H |
| *(no figuraba)* | `docs/artefactos/NOTA.md:135-138` y dos specs ajenas hablan de «cuatro ficheros» o remiten a F1B-09 |
