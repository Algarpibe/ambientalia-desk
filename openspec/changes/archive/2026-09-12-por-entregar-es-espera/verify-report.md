```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:6e9624914774ad25ee0af06625bea5ba140e65d490ce7c375f9be48e8dfe2ce3
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 14/14
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:174690560c6e0e25a2efca950a4370047b89c29402b64df7f8997217c0983ff3
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:dc2d8d5b30d5f2042b73ea2c9d5bb3c1bf99798823c9492085c865b0e65ee486
```

## Verification Report

**Change**: por-entregar-es-espera
**Version**: HEAD 5919b6e (rama main) + cambios sin commitear del apply (worktree)
**Mode**: Strict TDD

### Completeness

| Metrica | Valor |
|---|---|
| Tareas totales (recuento) | 18 |
| Tareas completas | 18 |
| Tareas incompletas | 0 |
| Tarea de PERSONA (fuera de recuento) | 1 - sin casilla, con dueno/destino/frase "archivar no la da por hecha" |

tasks.md confirma 18 casillas [x] repartidas en Fases 0-7 (0.1; 1.1; 2.1-2.4; 3.1-3.4; 4.1-4.5; 5.1; 6.1; 7.1). La tarea de persona no lleva casilla y no se conto -- correcto contra la regla del ciclo 1 de CLAUDE.md.

---

### Build and Tests Execution -- reproducido en esta sesion

**Build**: OK Passed
```
$ npm run build
tsc -b && vite build
built in 1.45s
exit code: 0
sha256(salida completa) = dc2d8d5b30d5f2042b73ea2c9d5bb3c1bf99798823c9492085c865b0e65ee486
```

**Tests**: OK 1017 passed / 0 failed / 2 skipped (113 archivos, 1 saltado)
```
$ npm test
Test Files  113 passed | 1 skipped (114)
     Tests  1017 passed | 2 skipped (1019)
exit code: 0
sha256(salida completa) = 174690560c6e0e25a2efca950a4370047b89c29402b64df7f8997217c0983ff3
```
Los 2 saltados son packages/zoho-sync/src/db/migrate.integration.test.ts (requiere TEST_DATABASE_URL), ajenos a este cambio.

**Typecheck**: OK tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit -- sin salida, exit 0.

**Lint**: OK npm run lint -- --max-warnings 158 (trinquete exacto de .github/workflows/ci.yml linea 41) -- 158 avisos, 0 errores. Coincide EXACTO con el techo, verificado que el trinquete es --max-warnings 158, no un valor libre.

**Coverage (focalizada en los ficheros que esta tanda toca)**: ejecutada con npx vitest run --coverage restringida a estados.ts, enEspera.ts, boardView.ts via sus 4 pruebas focalizadas -- 100% lineas / 100% ramas / 100% funciones en los tres. ClienteDetalle.tsx y TicketDetailView.tsx quedan fuera de cobertura por decision de Gerencia (vitest.config.ts linea 57, F0-00); no es una carencia de esta tanda.

---

### Detectores del barrido -- corridos, no leidos

| Detector | Comando | Resultado |
|---|---|---|
| Palabra (nueve) | grep -rniE "\bnueve\b" packages/shared/src apps/desk/src openspec/changes/por-entregar-es-espera | Cero aciertos sobre estados.ts / estados.test.ts / sla.test.ts como afirmacion viva de esta lista. Los aciertos que aparecen son otras nueves declaradas ajenas (reentrancia.*, CreateTicket.tsx linea 206) o prosa de los propios artefactos SDD que narran la correccion en pasado/contraste |
| Control positivo once | grep -niE "\bonce\b" packages/shared/src/estados.ts | 2 aciertos (linea 28, linea 115) -- confirma que el detector encuentra cuando existe |
| Numeral (9) | grep -rnE "\b9\b" estados.ts estados.test.ts sla.test.ts | Unico acierto real sobre la lista: estados.ts linea 88, comentario de rotulo ninguna (9), que es el rotulo CORRECTO tras la reclasificacion (era 11), no una afirmacion caduca. estados.test.ts lineas 22 y 71 citan 5/6/9/1, la cuenta correcta hoy |
| Enumeracion explicita | Lectura de titulos: estados.test.ts linea 25 dice estos cinco (era tres), linea 46 dice estos nueve (era once), linea 71 dice 5 + 6 + 9 + 1 = 21 (era 3 + 5 + 12 + 1), linea 176 dice la derivacion da ocho (era seis) | Los cuatro titulos llevan la cuenta correcta hoy, verificado leyendo el fichero, no por patron |

Intactos, confirmados por git diff contra 2e6b4d8 (base de la propuesta), no por lectura:

| Sitio | Comprobacion | Resultado |
|---|---|---|
| openspec/specs/transitions-st/spec.md linea 723 | git diff 2e6b4d8 sobre el fichero completo | Sin diff -- el spec de record no se toca hasta sdd-archive |
| openspec/config.yaml lineas 931 y 933 | Lectura directa -- hablan de "una clave es un hecho duradero" y "la clave nombra el hecho, no la tanda", nada sobre ESTADOS_EN_ESPERA | Confirmado ajenas al barrido |
| docs/sdd/Paquete_de_Despliegue_2026-09-10.md lineas 65 y 309 | git diff --stat sobre el fichero | Sin diff -- sigue afirmando el numero 9 como registro fechado del despliegue del 10/09, intacto |
| apps/desk/src/components/TicketDetailView.tsx (linea 245, color) | git diff 2e6b4d8 sobre el fichero completo | Diff vacio, CERO cambios, confirmado por ejecucion |

---

### El detector M6 (recuento exacto de supervivientes de color) -- corrido en esta sesion

Comando estricto (cuenta llamadas): grep -rnE "/espera(\|hold)?/i\.test\(" apps/desk/src

Resultado: 2 aciertos exactos -- ClienteDetalle.tsx linea 41 (codigo real de badgeClass) y TicketDetailView.tsx linea 245 (codigo real del className).

Comando laxo (cuenta tambien menciones en prosa): grep -rnE "/espera(\|hold)?/i" apps/desk/src

Resultado: 5 aciertos -- los mismos 2 de codigo, mas 3 menciones en prosa (ClienteDetalle.tsx linea 25, ancla A que nombra el patron entre comillas; boardView.test.ts linea 27, describe de RQ-VT-04; enEspera.test.ts linea 11, describe de la mutacion M4).

Confirma exactamente lo que pedia el encargo: el detector laxo da 5, el estricto (cuenta llamadas) da 2. Ninguna prosa nueva de esta tanda reproduce la forma de llamada literal del patron seguido de .test( -- el unico acierto de esa forma exacta es el codigo real de ClienteDetalle.tsx linea 41, no un comentario. La restriccion de higiene de design.md seccion 4.3 se cumple.

---

### Anclas de la divergencia deliberada en ClienteDetalle.tsx -- verificadas por lectura mas git diff

Diff real (contra 2e6b4d8), resumido:
- Se anade un bloque de comentario (ancla A) inmediatamente encima de la linea que define esEspera, con los 4 puntos exigidos por design.md seccion 4.2: es deliberado; por que (color y clasificacion son nociones distintas, Por Entregar no es un atasco, el tablero ya lo pinta azul en TicketCard.tsx linea 21); autoridad (decision de Gerencia Q1, 2026-09-12); y el arreglo de verdad pendiente (una sola fuente de color, otra tanda).
- La linea que antes decia test de la expresion regular espera contra t.status pasa a llamar esEstadoEnEspera(t.status), consumiendo el modulo compartido.
- Dentro de la funcion badgeClass, justo antes de la linea que conserva la expresion regular de color, se anade una linea de comentario (ancla B): "Divergencia deliberada: ver la nota de esEspera, arriba. NO unificar."

Ancla A (lineas 19 a 35 del fichero actual, encima de esEspera) y ancla B (linea 40, dentro del cuerpo de badgeClass, lineas 38 a 43): la B es visible SIN salir de la funcion, tal y como exige el encargo. Las dos existen, confirmado por lectura directa del fichero y por el diff.

Verificacion por ejecucion del escenario "el limite se mantiene, el color no se mueve" (vistas-tablero/spec.md), corrida en esta sesion con node:

Entrada: se evaluo la expresion regular de ClienteDetalle.tsx (color) y la de TicketDetailView.tsx (color) contra los dos estados reclasificados.
Salida: false en las 4 combinaciones (las dos expresiones contra los dos estados). Los dos regex de color NO casan con los dos estados reclasificados: el badge sigue azul (respaldo por omision), no ambar.

---

### IV-9 -- REDUCIDA, no cerrada (verificado en las dos ubicaciones)

| Ubicacion | Estado |
|---|---|
| CLAUDE.md linea 206 | Dice REDUCIDO, no cerrado; enumera 2 supervivientes, los dos de color; mide "acertando 2" contra "los ONCE" y "se les escapan NUEVE" |
| openspec/config.yaml, bloque id IV-9 (hoy en las lineas aproximadas 715 a 794; las citas de tasks.md, lineas 738/740/755/784, se desplazaron por ediciones previas del propio bloque, contenido verificado igual) | descripcion dice "REDUCIDO por por-entregar-es-espera, sobreviven DOS"; alcance_exacto dice "REMEDIDO el 2026-09-12 contra la lista, ONCE entradas, casan con EXACTAMENTE 2"; se_escapan dice "los NUEVE que estos dos predicados no tratarian como espera" y explica que los ultimos dos subieron el escape de 7 a 9. YAML validado con js-yaml: sin errores de sintaxis tras la reescritura de 103 lineas |

Ni cerrada ni con el texto viejo de tres supervivientes. Coincide con el criterio de aceptacion.

---

### El cruce derivado (estados.test.ts linea 176) -- razonado, no solo renumerado

Verificado leyendo el cuerpo completo del test y su comentario (lineas 151 a 175): la prosa distingue explicitamente las dos parejas por razones distintas, no se limita a cambiar 6 por 8:
- Liberacion Comercial y Remision creada quedan fuera porque su unica salida es un acto que se ejecuta en la aplicacion (area Comercial, alguien pulsa un boton).
- Por Entregar y Por Entregar Sin facturar NO comparten esa razon: sus unicas salidas son area Servicio Tecnico y lo que las cierra es que el cliente venga a recoger el equipo, un suceso fuera de la aplicacion, no un boton interno.

Y deja anotada, dentro del propio comentario del test, la pregunta abierta: hallazgo 3, sin decidir aqui, la pregunta queda para Gerencia, sin destino asignado. El mismo hallazgo esta tambien en design.md seccion 9 y en el delta spec 3.2/C3. Cumple el criterio: la prosa razona, no renumera; y la pregunta queda abierta y sin destino, como exige el encargo.

El aserto se ejecuto y paso: estados.test.ts (12 tests, incluido este) verde en la corrida completa de npm test.

---

### Regla 13 (tabla de design.md seccion 6, D6) -- comparada linea a linea

Las 4 filas verificadas contra el codigo citado en esta sesion:
1. boardView.ts lineas 47-48 -- sin guarda de servidor (filtro de vista, boardView.ts lineas 33-36 lo declara).
2. ClienteDetalle.tsx lineas 96 y 98 -- mismo caso, filtra sobre lo que el servidor ya entrego entero.
3. El criterio externa/interna vive en estados.ts lineas 114-117; el cliente importa, no decide.
4. Estado desconocido retorna false (D1.3): no oculta, cae en abiertos, visible; el invariante 1 (invariantesGrafo.test.ts) es quien vigila estados no declarados.

Conclusion: 4 decisiones, 0 guardas. Confirmado, no de memoria: las cuatro lineas de codigo citadas existen tal como se describen.

---

### Las seis mutaciones (tasks.md seccion 6, design.md seccion 8) -- verificacion parcial por restriccion de alcance

Limite declarado de este verify: el encargo de esta fase prohibe modificar codigo ("NO MODIFIQUES CODIGO. Verificas, no arreglas"). Las mutaciones M1 a M6 son ediciones deliberadas y reversion del codigo de produccion, asi que NO se re-ejecutaron M1 a M5 en esta sesion -- se contrasto el reporte de apply-progress (que declara las 6 ejecutadas y revertidas, con el arbol hoy limpio de residuos) contra la estructura real del codigo:

| # | Reclamo de apply-progress | Contraste estructural hecho en este verify |
|---|---|---|
| M1 | El rojo b se pone rojo si Por Entregar vuelve a la clase ninguna | Confirmado por diseno: boardView.test.ts lineas 85-95 afirma la salida de applyBoardView para ese estado exacto; si estados.ts no lo clasificara externa, el toEqual fallaria necesariamente |
| M2 | La linea 71 (suma) sigue verde ante un reordenamiento; las lineas 25 y 85 (orden) no | Confirmado por estructura: la linea 71 suma longitudes -- insensible al orden por construccion; las lineas 25, 85 y 88-102 son toEqual de arrays -- sensibles al orden por construccion |
| M3 | Quitar el filtro Closed de la linea 48 pone rojo el caso de los 2 estados nuevos | Confirmado por estructura: boardView.test.ts lineas 64-70 fija el resultado en vacio para 2 tickets Closed; sin el filtro, esos tickets pasarian el filtro de clasificacion y el resultado no seria vacio |
| M4 | Sustituir el registro por una expresion regular en enEspera.ts rompe el aserto 1 | Confirmado por estructura: el aserto 1 de enEspera.test.ts lineas 16-20 itera TODO ESTADOS_EN_ESPERA, que incluye Servicio externo, Solicitado, etc -- ninguno contiene la palabra espera ni hold en su nombre, asi que una regex los fallaria |
| M5 | El detector de solo palabra deja escapar estados.ts linea 21 | REPRODUCIDO de forma independiente en este verify: el detector de palabra sobre estados.ts no toca la linea 21 (que hoy dice 11 estados, numeral puro); el hallazgo original es estructuralmente cierto y se comprobo con el estado actual del fichero |
| M6 | El detector estricto da exactamente 2, y romperlo (retirar o anadir una expresion) rompe el criterio | REPRODUCIDO por ejecucion en este verify (seccion anterior): el detector da exactamente 2 HOY. No se retiro ni anadio una expresion real para no modificar codigo, pero el conteo exacto exigido por el criterio de aceptacion esta confirmado por ejecucion directa |

Ninguna mutacion quedo sin evidencia, pero M1 a M4 se validan por contraste estructural (lectura razonada del codigo y del test reales, no por rojo-verde ejecutado en esta sesion) en vez de por re-ejecucion, debido a la restriccion explicita de no tocar codigo durante verify. Se marca como WARNING por esta razon metodologica, no porque haya indicio de que las mutaciones fallaran.

---

### Spec Compliance Matrix

#### Capacidad transitions-st

| Requisito | Escenario | Test / evidencia | Resultado |
|---|---|---|---|
| RQ-TS-17 | Los dos estados de entrega entran en el bloque externa | estados.ts lineas 60-73 (codigo, verificado por lectura) mas estados.test.ts lineas 25-33 | COMPLIANT |
| RQ-TS-17 | ESTADOS_EN_ESPERA pasa de nueve a once, orden fijado contra el filtro | estados.test.ts lineas 88-102 | COMPLIANT |
| RQ-TS-15 | El estado con SLA sigue fuera de las dos clasificaciones tras el reparto a once | sla.test.ts lineas 50-54 | COMPLIANT |
| 3.2/C3 | La derivacion mal hecha da ocho, y las cuatro que sobran comparten razon por parejas | estados.test.ts lineas 176-197 | COMPLIANT |
| 3.7 | Remision creada entra en la vista sin mover el reloj | sla.test.ts lineas 50-54, test generico parametrizado sobre TODO ESTADOS_EN_ESPERA, incluye Remision creada | COMPLIANT via test generico, no un caso nombrado |
| 3.7 | Los dos estados de entrega entran en la vista sin mover el reloj | sla.test.ts lineas 50-54, mismo test generico, incluye los 2 nuevos | COMPLIANT via test generico |

#### Capacidad vistas-tablero

| Requisito | Escenario | Test / evidencia | Resultado |
|---|---|---|---|
| RQ-VT-04 | Los seis estados que la regex vieja no reconocia | boardView.test.ts lineas 31-45 | COMPLIANT, heredado, sigue verde |
| RQ-VT-04 | Mutacion, el fichero vigilado, no una copia | Declarado explicitamente en el propio spec como registro de evidencia no repetible tal cual hoy | COMPLIANT como registro historico declarado, no una conducta viva a probar |
| RQ-VT-04 | Fixture corregido, prueba por la razon correcta | boardView.test.ts linea 11 usa el nombre real del estado; lineas 20-21 verdes | COMPLIANT |
| RQ-VT-04 | Los dos estados de entrega entran en espera y no en abiertos | boardView.test.ts lineas 85-95 | COMPLIANT |
| RQ-VT-04 | La ficha de cliente cuenta un ticket en Por Entregar bajo espera | Ninguno automatizado, ClienteDetalle.tsx es tsx, fuera de la red de pruebas F0-00 | FUERA DEL RECUENTO FORMAL (ver nota bajo la tabla) -- declarado como tarea de PERSONA en proposal.md seccion 12 y tasks.md, no cuenta como defecto ni como escenario incumplido |
| RQ-VT-04 | El limite se mantiene, el color no se mueve | Ejecucion directa en este verify: las dos expresiones regulares contra los dos estados dan false en las 4 combinaciones | COMPLIANT, verificado por ejecucion directa |
| RQ-VT-04 | El comentario que declara la divergencia deliberada existe | ClienteDetalle.tsx lineas 19-35 (ancla A) y linea 40 (ancla B), verificado por lectura mas git diff, tal como el propio spec exige | COMPLIANT |
| RQ-VT-05 | Cerrado en un estado de espera no aparece en espera | boardView.test.ts lineas 53-58 | COMPLIANT |
| RQ-VT-05 | Los dos estados de entrega, cerrados, tampoco aparecen en espera | boardView.test.ts lineas 64-70 | COMPLIANT |

Resumen de cumplimiento: 14 de 14 escenarios del recuento formal (los verificables por ejecucion, sea vitest, ejecucion directa, o lectura mas git diff donde el propio spec asi lo exige) son COMPLIANT. Un decimoquinto escenario de RQ-VT-04 (la ficha de cliente cuenta un Por Entregar bajo espera) queda FUERA del recuento formal, por la misma razon y con el mismo tratamiento que la tarea de persona de tasks.md: no describe trabajo que esta verificacion pueda ejecutar en este repositorio, ya que ClienteDetalle.tsx es tsx y esta fuera de la red de pruebas por decision de Gerencia (F0-00). Se sigue el mismo principio que la regla del ciclo 1 de CLAUDE.md aplica a tasks.md: no se cuenta como escenario verificado, y no se cuenta tampoco como escenario incumplido; se registra aparte, con dueno y fecha pendientes.

---

### Coherencia de diseno

| Decision de design.md | Seguida | Evidencia |
|---|---|---|
| D1, firma esEstadoEnEspera con status opcional string o null, retorna boolean | Si | enEspera.ts linea 14 |
| D1.3, desconocido retorna false | Si | enEspera.ts linea 15, enEspera.test.ts lineas 36-38 |
| D1.4, modulo en apps/desk/src/lib, no en packages/shared | Si | Ubicacion confirmada |
| D2, no reabrir enEsperaDe, envolver el includes existente | Si | enEspera.ts linea 15 es exactamente ese includes |
| D3, el orden del registro manda, arrays fijados leyendo el filtro | Si | estados.test.ts lineas 88-102 coincide con la prediccion de design.md seccion 3.2, posiciones 4 y 5 |
| D4, dos anclas en ClienteDetalle.tsx | Si | Confirmado arriba |
| D5, orden de escritura por fases bajo strict_tdd | Si | apply-progress documenta RED, GREEN, REFACTOR por fase, cruzado contra el estado final del codigo |
| D6, regla 13, 4 filas, cero guardas | Si | Confirmado arriba |
| D7, barrido con 2 detectores mas 1 de enumeracion | Si | Confirmado arriba |
| D8, 6 mutaciones ejecutadas y revertidas | Parcial | M6 y el hallazgo estructural de M5 reproducidos en este verify; M1 a M4 aceptadas por contraste estructural, no re-ejecutadas por la restriccion de no modificar codigo |

---

### Auditoria de calidad de aserciones (Strict TDD, paso 5f)

Ficheros de prueba nuevos o modificados revisados: enEspera.test.ts, boardView.test.ts, estados.test.ts, sla.test.ts.

- Sin tautologias.
- Sin aserciones huerfanas sobre colecciones vacias sin contraparte.
- Los bucles sobre colecciones (enEspera.test.ts lineas 17-19 y 23-27; estados.test.ts lineas 124-126) iteran sobre ESTADOS_EN_ESPERA (11 elementos), ESTADOS menos ESTADOS_EN_ESPERA (10 elementos) y ESTADOS_SIN_SALIDA (4 elementos) -- ninguna de las tres colecciones puede estar vacia por construccion del registro, no son bucles fantasma.
- Todas las aserciones llaman codigo de produccion real (esEstadoEnEspera, applyBoardView, ESTADOS_EN_ESPERA, SLA_HORAS_POR_ESTADO).
- Sin acoplamiento a detalles de implementacion (clases CSS, conteo de llamadas a mocks).
- Ratio mocks/aserciones: 0 mocks en los 4 ficheros.

Calidad de aserciones: todas las aserciones verifican comportamiento real.

### Distribucion por capa (Strict TDD, paso 5 expandido)

| Capa | Tests | Ficheros | Herramienta |
|---|---|---|---|
| Unidad | 52 (12 estados.test.ts, 15 sla.test.ts, 5 enEspera.test.ts, 20 boardView.test.ts) | 4 | vitest |
| Integracion | 0 | 0 | no aplica, tsx fuera de la red, F0-00 |
| E2E | 0 | 0 | no instalado |

### Cobertura de ficheros cambiados (Strict TDD, paso 5d expandido)

| Fichero | Lineas | Ramas | Funciones | No cubierto |
|---|---|---|---|---|
| packages/shared/src/estados.ts | 100% | 100% | 100% | ninguna |
| apps/desk/src/lib/enEspera.ts | 100% | 100% | 100% | ninguna |
| apps/desk/src/lib/boardView.ts | 100% | 100% | 100% | ninguna |
| apps/desk/src/components/ClienteDetalle.tsx | no aplica | no aplica | no aplica | excluido de cobertura por decision de Gerencia, vitest.config.ts linea 57 |

Cobertura media de ficheros cambiados evaluables: 100%.

### Metricas de calidad

Linter: 158 avisos, 0 errores -- exactamente en el trinquete de CI, sin margen.
Type Checker: sin errores.

---

### Issues Found

**CRITICAL**: Ninguno.

**WARNING**:
1. Las mutaciones M1 a M4 (de las 6 exigidas por el criterio de aceptacion) se validaron por contraste estructural del codigo y test actuales, no por re-ejecucion rojo-verde-rojo en esta sesion de verify, debido a la restriccion explicita de no modificar codigo durante esta fase. M5 y M6 si se reprodujeron por ejecucion directa. Si se requiere evidencia de ejecucion literal de M1 a M4, hace falta una sesion de apply o mutacion dedicada, no este verify.
2. El escenario "la ficha de cliente cuenta un ticket en Por Entregar bajo espera" (vistas-tablero spec) sigue sin verificacion en el despliegue real: es la tarea de persona de proposal.md seccion 12, correctamente declarada fuera del recuento de tasks.md, pero archivar este cambio NO la da por hecha (regla del ciclo 1). Debe registrarse con dueno, resultado y fecha antes de darla por buena.

**SUGGESTION**:
1. Las lineas citadas en tasks.md (738, 740, 755, 784 para el bloque IV-9 de config.yaml; estados.ts linea 109) se desplazaron por ediciones previas del propio bloque o fichero (hoy el bloque IV-9 vive alrededor de las lineas 715 a 794, y el comentario equivalente de estados.ts esta en la linea 115). El contenido es correcto y fue verificado linea a linea contra el fichero real, no contra la cita; es una deriva de citas ya anotada como tal en apply-progress bajo Deviations from Design, no un defecto.
2. openspec/config.yaml cambio 103 lineas frente a la estimacion de diseno de 20 a 35 lineas (compartida con CLAUDE.md). El contenido se reviso completo y es correcto (medicion remedida, redaccion sin cerrar IV-9), pero conviene que futuras tandas actualicen la estimacion de design.md si reabren este bloque, para no repetir la subestimacion.

---

### Verdict

**PASS WITH WARNINGS**

Los 18 de 18 elementos de tasks.md estan completos y verificados contra el codigo real, no de memoria. npm test, npm run typecheck, npm run lint (158 de 158, en el trinquete exacto) y npm run build pasan, reproducidos en esta sesion con hashes de evidencia. Los tres detectores del barrido, el detector M6 y el escenario de color se ejecutaron y dieron el resultado exigido. Los ficheros que debian quedar intactos (spec.md linea 723, config.yaml lineas 931 y 933, el paquete de despliegue, TicketDetailView.tsx) se confirmaron sin diff. IV-9 quedo reducida, no cerrada, con medicion al dia en las dos ubicaciones. El cruce derivado razona el cambio, no solo lo renumera, y deja la pregunta de negocio abierta y sin destino, como exige el encargo. Las dos anclas de ClienteDetalle.tsx existen y son visibles donde tienen que serlo.

Las dos advertencias no bloquean: una es una limitacion metodologica de esta fase (no se puede mutar codigo en verify, y las mutaciones mas sensibles a esa restriccion ya estaban ademas cubiertas por contraste estructural directo), y la otra es la tarea de persona que la propia propuesta ya declaro explicitamente pendiente y fuera del recuento. Ninguna de las dos es un defecto de implementacion.
