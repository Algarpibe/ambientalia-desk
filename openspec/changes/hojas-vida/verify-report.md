# Verify report: hoja de vida -- seis campos comerciales (F1B-02)

**Cambio**: hojas-vida | **Tanda**: F1B-02 | **Modo**: Strict TDD | **Almacen**: hybrid
**Worktree verificado**: C:\dev\Desk_2_R1.023-worktrees\f1b-02-r1 (rama f1b-02-r1), git status limpio en el momento de este informe.
**Intento del ledger** (gentle-ai sdd-attempt status --change hojas-vida --cwd <worktree>, leido sin acquire/settle):
intento 1 (sdd-apply) -> outcome: passed, changed_lines: 528 contra techo 800; intento 2 (sdd-verify, este informe) -> running, next_action: finish. El settle lo hace el orquestador.

## Veredicto

**PASS WITH WARNINGS**

Las 26/26 tareas de tasks.md estan completas y verificadas contra el codigo; las ocho especificaciones
(RQ-HV-01..08) tienen prueba real que las cubre donde la red de pruebas alcanza (servidor, .ts); lint,
typecheck y la suite completa estan en verde con los comandos exactos del CI. El veredicto no es PASS
liso por dos motivos, ninguno bloqueante: (1) la evidencia RED del ciclo TDD es declarada por el propio
agente del apply, sin salida en bruto guardada -- GREEN si se reprodujo hoy, igual que la mutacion de
posicion; y (2) el artefacto de spec en Engram quedo desactualizado tras la decision de urlSegura en
ee0ed40. Ver seccion de Hallazgos abajo.

## Completitud de tareas

| Fase | Tareas | Estado |
|---|---|---|
| 1 - Esquema | 1.1 | 1/1 |
| 2 - Tipos | 2.1, 2.2 | 2/2 |
| 3 - db/equipos.ts | 3.1-3.6 | 6/6 |
| 4 - routes/equipos.ts | 4.1-4.3 | 3/3 |
| 5 - Pruebas de servidor | 5.1-5.10 | 10/10 |
| 6 - Cliente (.tsx) | 6.1-6.3 | 3/3 (RQ-07/08: comprobacion de persona pendiente, no bloquea) |
| 7 - Cierre | 7.1 | 1/1 |
| Total | 26 | 26/26 (100%) |

Todas las casillas de tasks.md estan [x] y coinciden con el estado real del arbol (comprobado por
inspeccion directa de cada fichero listado, no solo por la casilla).

## Evidencia de comandos (ejecutados en este verify, en el worktree)

| Comando | Exit | Resultado |
|---|---|---|
| npm run lint -- --max-warnings 165 | 0 | 165 problemas (0 errores, 165 avisos) -- el comando exacto del CI (.github/workflows/ci.yml:41, fijado en f7c9dc1). npm run lint a secas NO se uso como evidencia (no lleva --max-warnings, no discrimina). |
| npm run typecheck (tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit) | 0 | Sin salida, limpio |
| npm test (vitest run) | 0 | 132 ficheros pasan, 1 saltado (133); 1257 pruebas pasan, 2 saltadas (1259) |

Focalizado dentro de la suite completa: apps/desk/server/equipos.test.ts -> 24/24 (14 preexistentes +
10 nuevas de F1B-02); apps/desk/server/db/equipos.test.ts -> 26/26; el guardian
packages/zoho-sync/src/db/migrate.test.ts (test "son 35 ALTER...", linea 361-363) -> verde, recuento correcto tras
las seis ALTER nuevas de equipos.

Estas cifras coinciden EXACTAMENTE con las marcadas [REPRODUCIDO 23/09] en apply-progress.md
(mismo comando, misma cifra de ficheros/pruebas), lo que corrobora que esa seccion del apply-progress no
es solo declarativa sino verificable de forma independiente.

npm run test:coverage (@vitest/coverage-v8, package.json:24) esta disponible en el proyecto pero
NO se ejecuto en este cierre: el encargo fijo explicitamente tres comandos (lint con el flag del CI,
typecheck, test) y no coverage. Se deja constancia de que la herramienta existe, sin tratarlo como
carencia -- informativo, nunca bloqueante segun strict-tdd-verify.md.

## Matriz de cumplimiento RQ-HV-01..08

| Requisito | Implementacion (ruta:linea) | Prueba que lo cubre (ruta:linea) | Estado |
|---|---|---|---|
| RQ-HV-01 -- seis campos opcionales, alta minima sigue igual | schema.sql (tail, 6x ALTER TABLE equipos ADD COLUMN IF NOT EXISTS, todas nullable); routes/equipos.ts:50-59 (alta sigue exigiendo solo serial/clientId/modeloId) | equipos.test.ts:214-231 (POST minimo -> 201, seis undefined, PATCH {active} sigue) y :233-249 (POST con los seis -> 201 + valores) | CUMPLE -- paso en ejecucion |
| RQ-HV-02 -- extiende POST/PATCH existentes, sin endpoint nuevo | routes/equipos.ts:48 (POST existente), :73 (PATCH existente), sin ruta nueva; db/equipos.ts:119-131 createEquipo, :133-151 updateEquipo con add() condicional | equipos.test.ts:251-264 (PATCH solo codigoInterno -> resto intacto) | CUMPLE -- paso en ejecucion |
| RQ-HV-03 -- fechas validadas en servidor, rechazo antes de escribir | routes/equipos.ts:128-131 (esFechaIso, regex + ida-vuelta UTC), :144-189 (camposHojaDeVida corre entero antes de createEquipo/updateEquipo) | equipos.test.ts:266-280 (fecha invalida en POST -> 422, 0 creados; fecha imposible en PATCH -> 422, campo sigue undefined) | CUMPLE -- paso en ejecucion |
| RQ-HV-04 -- Drive validado con urlSegura, solo https sin comillas | routes/equipos.ts:4 (import urlSegura de @ambientalia/shared, no reescrita -- regla 13.1), :181-186 (rama Drive); packages/shared/src/remision.ts:100-102 (startsWith https y sin comilla doble) | equipos.test.ts:282-289 (http:// -> 422) y :291-301 (https con comilla doble -> 422, distingue de un startsWith desnudo) | CUMPLE -- los DOS escenarios de la spec pasaron en ejecucion |
| RQ-HV-05 -- mantenedor validado contra Books (getClient) | routes/equipos.ts:3 (import getClient), :147-155 (misma forma que el clientId de :56/:80) | equipos.test.ts:303-310 (mantenedor inexistente -> 422) | CUMPLE -- paso en ejecucion |
| RQ-HV-06 -- codigo_interno como identificador secundario de busqueda | db/equipos.ts:69 (searchEquipos, OR sobre codigo_interno), :180 (mismo OR en listEquiposManage) | equipos.test.ts:329-341 (busqueda por codigo interno en mayus/minus devuelve el mismo id que por serial) | CUMPLE -- paso en ejecucion |
| RQ-HV-07 -- hoja de vida ensena los seis campos, vacios o poblados | HojaDeVida.tsx:163-178 (rejilla de seis pares, guion largo si vacio; boton Ver en Google Drive solo si urlSegura(eq.driveUrl) no es null, target=_blank rel=noopener noreferrer) | Parte servidor: equipos.test.ts:343-359 (/historial trae los seis; driveUrl vacio -> undefined) paso. Parte UI (.tsx, dos escenarios de la spec): fuera de la red de pruebas por decision de Gerencia F0-00 (vitest.config.ts:16-20, solo *.test.ts) -- comprobacion manual en staging PENDIENTE, dueno Comercial/Gerencia, declarada en apply-progress.md y tasks.md, no cuenta como tarea de esta tanda | CUMPLE en servidor; UI con comprobacion de persona pendiente (no bloquea) |
| RQ-HV-08 -- alta/edicion piden los seis campos en el mismo payload | EquiposAdmin.tsx:119-128 (estado de los seis campos), :246-279 (tres type=date, codigo interno, Drive, SelectorMantenedor), :170-174 (payload de submit incluye los seis); apps/desk/src/api/client.ts:301-306 (EquipoInput con los seis opcionales) | Sin prueba automatica -- mismo motivo que RQ-HV-07 (.tsx fuera de la red, F0-00). Comprobacion manual en staging PENDIENTE, dueno Comercial/Gerencia | Implementacion presente y coherente con el diseno; UI con comprobacion de persona pendiente (no bloquea) |

8/8 requisitos cumplidos en lo que la red de pruebas alcanza a probar; 2 de 8 (RQ-HV-07/08) tienen su
mitad de interfaz pendiente de comprobacion manual por decision explicita de Gerencia (F0-00), no por
carencia de esta tanda -- declarado como comprobacion de persona en proposal.md y no cuenta como tarea.

## Regla invariable 13 / regla de mutacion 3 -- decisiones del cliente y su imposicion en servidor

La tanda toca apps/desk/src (HojaDeVida.tsx, EquiposAdmin.tsx). Enumeracion obligatoria:

| Decision del cliente | Donde (ruta:linea) | Linea del servidor que la impone | Probada |
|---|---|---|---|
| Oculta el boton Ver en Google Drive si urlSegura(eq.driveUrl) es null | HojaDeVida.tsx:174 | routes/equipos.ts:184 (urlSegura(v) === null -> 422, mensaje sobre https y comillas) | equipos.test.ts:282-301 |
| Tres input type=date restringen el formato en el navegador | EquiposAdmin.tsx:249,252,255 | routes/equipos.ts:128-131 (esFechaIso) | equipos.test.ts:266-280 |
| Selector de mantenedor solo permite escoger de searchClients; no se puede teclear un id a mano | EquiposAdmin.tsx:260-278 | routes/equipos.ts:147-155 (getClient, mismo patron que clientId) | equipos.test.ts:303-310 |

Las tres son guarda legitima en cliente bajo la regla invariable 13 punto 3: la imposicion del
servidor esta probada por ejecucion real (HTTP via supertest), no supuesta. No se encontro ninguna
decision del cliente sin contrapartida probada en servidor dentro de esta tanda.

## Coherencia con design.md

| Decision de diseno | Se siguio | Evidencia |
|---|---|---|
| ALTER al final de schema.sql, sin desplazar citas 3xx-4xx | Si | schema.sql (tail), confirmado por inspeccion |
| Nombre del mantenedor por LEFT JOIN clients, sin septima columna propia | Si | db/equipos.ts:164-167 (SELECT_EQUIPO_FULL, mantenedor_nombre) |
| fechaSolo exportada y reusada, no toISOString().slice(0,10) | Si | books/repo.ts:94 export function fechaSolo; db/equipos.ts:3,113-115 la consume en toFull |
| Validar Drive con urlSegura, no startsWith | Si | routes/equipos.ts:4,184; probado a distinguirlo de un startsWith desnudo (equipos.test.ts:291-301) |
| Validar fecha con regex + ida-vuelta UTC (esFechaIso), no solo regex | Si | routes/equipos.ts:128-131; probado con fecha imposible (equipos.test.ts:276) |
| Vaciar con vacio o null da NULL; undefined no toca | Si | routes/equipos.ts:144-189 (camposHojaDeVida, cada rama distingue undefined de vacio); probado (equipos.test.ts:356-358) |
| Helper camposHojaDeVida al final del fichero, llamado ANTES de updateEquipo Y setEquipoActive | Si (con una desviacion corregida en el propio apply, documentada abajo) | routes/equipos.ts:60 (POST, antes de :63 createEquipo), :96 (PATCH, antes de :99 updateEquipo y :100 setEquipoActive) |
| Orden interno del helper: mantenedor -> fechas -> Drive | Si | routes/equipos.ts:147-186 |

Desviaciones declaradas por el propio apply (apply-progress.md, seccion "Desviaciones respecto del
diseno"), verificadas contra el estado final del arbol -- las cinco quedaron corregidas antes del cierre:
EquipoInput nacio con los seis campos obligatorios y se corrigio a opcionales (confirmado:
db/equipos.ts:99-104, todos opcionales); el helper se coloco primero al principio del fichero por error y
se movio al final (confirmado: camposHojaDeVida es la ultima funcion de routes/equipos.ts, lineas
144-189 de 189); el guardian de migrate.test.ts se actualizo de 29 a 35 (confirmado, prueba en verde);
el barrido de la regla de mutacion 4 salio mas profundo de lo previsto (ver abajo); docs/sdd/ENTRADA.md:455
(E-028) no se toco a proposito, por instruccion explicita del encargo -- no verificable como defecto,
es alcance declarado.

## Barrido de la regla de mutacion 4 (tarea 7.1) -- comprobacion por muestreo

tasks.md 7.1 declara 9 citas corregidas en 6 ficheros tras el desplazamiento de db/equipos.ts. Se
comprobaron por inspeccion directa 5 de las 9:

| Cita | Afirma | Correcta hoy |
|---|---|---|
| types.ts:342 -> db/equipos.ts:46-54 | comportamiento de searchEquipos acotado solo por client_id | Si |
| CreateTicket.tsx:166 -> db/equipos.ts:46-54 | mismo apano abandonado el 2026-08-09 | Si |
| db/equipos.test.ts:453 -> equipos.ts:46-54 | mismo apano | Si |
| bodegaje.ts:99 -> types.ts:441 | HistorialTransition no se reutiliza | Si, types.ts:441 es exactamente la declaracion de esa interfaz |
| remisiones/spec.md:417 -> types.ts:492 | la rama de salida esta en el roadmap, no se da por supuesto | Si, cita literal |
| remisiones.test.ts:880 -> db/equipos.ts:253-256 | el enlace ticket-equipo del historial se hace por serial, no por codigo de servicio | Parcial -- :253-256 da el contexto, pero la condicion literal de emparejamiento por serial esta un poco mas abajo, :260-261. No es una cita rota, pero es mas contextual que exacta |

Las 4 restantes (openspec/specs/tickets-core/spec.md, dos puntos abreviados incluidos) no se
re-verificaron en este pase por alcance/tiempo del cierre; quedan como declaradas por tasks.md, no como
comprobadas de forma independiente en este informe.

## TDD Compliance

| Check | Resultado | Detalle |
|---|---|---|
| TDD Evidence reportada | Si | apply-progress.md, seccion "Evidencia TDD", con marcas REPRODUCIDO/DECLARADO explicitas |
| Todas las tareas tienen prueba | Si | 10/10 pruebas nuevas en equipos.test.ts cubren las 10 sub-tareas de la fase 5 |
| RED confirmado (ficheros de prueba existen) | Si | Las 10 pruebas existen en el arbol, en equipos.test.ts:214-359 |
| RED confirmado (ejecucion en rojo antes de implementar) | NO VERIFICABLE de forma independiente | apply-progress.md lo marca [DECLARADO 22/09] y dice explicitamente que no hay log ni captura de las ejecuciones en rojo -- es la palabra del agente del apply, no evidencia guardada |
| GREEN confirmado (pasan ahora) | REPRODUCIDO en este verify | npx vitest run sobre equipos.test.ts y db/equipos.test.ts -> 2 ficheros, 50/50 (cifra igual a la de apply-progress.md); npm test completo -> 1257/1257 |
| Mutacion de posicion (regla 1) | REPRODUCIDA (en apply-progress.md, 23/09) | Mover setEquipoActive por encima de la guarda puso roja la prueba de posicion con AssertionError, revertido con git checkout (0 cambios). Este informe no repitio la mutacion de nuevo, ya esta reproducida y documentada con el mensaje de error exacto |
| Triangulacion | Si | 10 escenarios distintos, cada uno con su propia mutacion documentada en design.md |
| Red de seguridad | Si (declarada) | 24 pruebas preexistentes en verde antes de tocar -- [DECLARADO 22/09], sin salida guardada, pero consistente con que hoy equipos.test.ts tiene 24 (14+10) y todas pasan |

TDD Compliance: 7/8 checks en verde, 1 con evidencia declarada no verificable (RED en bruto).

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|---|---|---|---|
| Integration (HTTP real via supertest + pg-mem) | 10 nuevas (+ 14 preexistentes en el mismo fichero) | 1 (equipos.test.ts) | supertest, pg-mem |
| Unit | resto de la suite (no tocado por esta tanda) | -- | vitest |
| E2E | 0 | 0 | no instalado |

Las 10 pruebas nuevas corren contra la API HTTP real (POST/PATCH/GET), nunca contra camposHojaDeVida
directamente -- cumple la regla de mutacion 2 del CLAUDE.md del proyecto (probar lo vigilado, no el
guardian en aislado).

## Assertion Quality

Revisadas las 10 pruebas nuevas (equipos.test.ts:214-359) y los cambios en db/equipos.test.ts. Sin
hallazgos: no hay tautologias, no hay bucles fantasma sobre colecciones potencialmente vacias, no hay
aserciones sin llamada a codigo de produccion, no hay smoke-tests sin asercion de comportamiento. Todas
las aserciones comprueban valores concretos (status HTTP, campos devueltos, ausencia/presencia tras
lectura) contra la API real, no contra mocks.

Assertion quality: sin aserciones triviales.

## Quality Metrics

Linter: 165 avisos (0 errores) -- igual al techo de main, exit 0 con --max-warnings 165.
Type Checker: sin errores.

## Hallazgos

### CRITICAL

Ninguno.

### WARNING

1. Evidencia RED no verificable de forma independiente. apply-progress.md declara que 9 de las 10
   pruebas nuevas se pusieron rojas por la razon correcta antes de implementar, pero no guardo la salida
   en bruto de esas ejecuciones -- es la palabra del agente del apply, marcada [DECLARADO 22/09] por el
   propio fichero. GREEN si se reprodujo de forma independiente en este verify (mismas cifras: 50/50
   focalizado, 1257/1257 completo), y la mutacion de posicion (regla 1) tambien quedo reproducida y
   documentada con su mensaje de error exacto (ver apply-progress.md). El riesgo residual es acotado: los
   tests ejercitan codigo de produccion real contra HTTP, no hay aserciones triviales, y la guarda de
   posicion si demostro discriminar al moverla. No bloquea el veredicto, pero es un hueco real de
   evidencia strict-TDD que archive no debe dar por cerrado sin mas.

2. El artefacto de spec en Engram (sdd/hojas-vida/spec, obs. 909, guardado 2026-09-22 18:33:04) quedo
   desactualizado. El commit ee0ed40 (18:38:06, cinco minutos despues) corrigio RQ-HV-04 de una hipotesis
   abierta (si el enlace admitia http ademas de https, decision pendiente de sdd-design) a la decision
   final (urlSegura, solo https, filtro de comilla, dos escenarios) -- y ese cambio SI llego al fichero en
   disco (openspec/changes/hojas-vida/specs/hojas-vida/spec.md:80-107, que es el que uso este verify y el
   que la implementacion cumple), pero NUNCA se volvio a guardar en Engram. En modo hybrid los dos
   deberian decir lo mismo; hoy no lo dicen. No afecta el veredicto de esta tanda -- el disco es la fuente
   que la implementacion siguio y la que gobierna -- pero una sesion futura que lea solo Engram para
   hojas-vida veria la spec vieja. Correctivo sugerido: re-guardar la spec vigente en Engram con el mismo
   topic_key.

3. Cita de la regla de mutacion 4 parcialmente laxa. apps/desk/server/remisiones.test.ts:880 cita
   db/equipos.ts:253-256 para el enlace ticket-equipo del historial por serial; la linea existe y es del
   bloque correcto, pero la condicion literal de emparejamiento por serial esta en :260-261, no en el
   rango citado. No es una cita rota (la regla de mutacion 4 no la marcaria en rojo), pero es mas
   contextual que exacta. Informativo.

### SUGGESTION

1. Las 4 citas restantes del barrido de la regla de mutacion 4 (openspec/specs/tickets-core/spec.md,
   dos puntos abreviados incluidos) no se re-verificaron en este pase por alcance del cierre; quedan
   como declaradas por tasks.md, no confirmadas de forma independiente en este verify.
2. npm run test:coverage esta disponible pero no se ejecuto -- el encargo no lo pidio. Si una tanda
   futura quiere cifra de cobertura de equipos.ts/routes/equipos.ts, el comando ya existe.

## Comprobaciones de persona -- no cuentan para este veredicto

Registradas en proposal.md (Comprobaciones de persona) y tasks.md/apply-progress.md. Archivar
esta tanda NO las da por hechas:

| Que | Dueno | Donde queda escrito |
|---|---|---|
| RQ-HV-07/08: verificacion manual en staging de HojaDeVida.tsx y EquiposAdmin.tsx (fuera de la red de pruebas por F0-00) | Comercial/Gerencia | tasks.md (6.2, 6.3), apply-progress.md |
| Carga retroactiva del parque ya sembrado con los seis campos | Comercial/Gerencia | proposal.md |
| Apuntar el mantenedor del caso conocido (config.yaml:1687-1688) | Comercial | proposal.md |

## Fuera de esta tanda (confirmado, no defecto)

La guarda del mantenedor sobre la orden de venta es F1B-11, no F1B-02 -- IV-8 no se cierra aqui
(openspec/config.yaml:1677-1679, confirmado en decision/titularidad-mantenedor). docs/sdd/ENTRADA.md:455
(E-028) se dejo intacta a proposito, por instruccion explicita del encargo del apply.

## Key Learnings

1. El comando de lint del CI (--max-warnings 165) y el comando a secas dan exit 0 con cifras distintas; solo el primero es evidencia valida de cierre.
2. La reproduccion independiente de GREEN y de la mutacion de posicion en verify compensa parcialmente la falta de salida RED guardada del apply, pero no la sustituye, son afirmaciones distintas.
3. En modo hybrid, un artefacto en disco puede avanzar por un commit posterior de correccion sin que su copia en Engram se vuelva a guardar, dejando los dos backends en desacuerdo silencioso.
4. La regla de mutacion 4 puede dar una cita por no rota, linea existe y bloque correcto, aunque el rango citado sea mas contextual que exacto respecto a lo que la frase afirma literalmente.
5. Verificar la regla invariable 13 exige enumerar cada decision del cliente una a una con su linea de servidor; en esta tanda las tres encontradas, Drive, fecha, mantenedor, estan todas probadas, sin espejo huerfano.
