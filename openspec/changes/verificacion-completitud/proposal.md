---
tanda: 1G-03
motivo: ""
capacidad: [zoho-sync]
maestro: ["M11.3"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `verificacion-completitud`

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`), citada
por clave. Consecuencia (3) (`openspec/config.yaml:5586-5588`): 1G-03 va tras 1G-01 y 1G-02, ya archivadas. Consecuencia (5)
(`openspec/config.yaml:5591-5592`): lo que escriba en producción va tras un interruptor cerrado; ésta sólo lee y aun así va tras uno (S-a).

*Sobre la cabecera.* `tanda: 1G-03`: es el contenido de su fila, «Verificación de completitud, entidad por entidad, Zoho contra
PostgreSQL. **Es la prueba de que el corte se puede hacer**, y se repite el día del corte»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:25`), con el alcance del plan de independencia: «tickets, conversaciones,
adjuntos por cantidad y bytes, historia, contactos y cuentas» (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:71`), repetido en el
paso 2 del corte (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:98`). `maestro: ["M11.3"]`, como 1G-01 y 1G-02: la fila
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3455-3457` cae en ese apartado, que empieza en `:3427`. El reconciliador no
impone literal: el patrón de `apps/desk/server/reconciliacion/comprobaciones.ts:136` sólo reconoce IDs que empiezan por `F0` o `F1`, y su
«sin verificar» (`apps/desk/server/reconciliacion/comprobaciones.ts:239`) no alcanza a `1G-03`. `cierra: si`: el informe cubre las seis
entidades (§3); correrlo en producción y el día del corte es de persona (§7, S-n). `toca_maestro: no`: el cambio hace lo que el pasaje
describe, y «Sin empezar» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:4079-4083`) es cierto de su fecha;
lo que puede desmentirlo es la primera MEDIDA, no el código (§9). R-2 no aplica: `zoho-sync` ya está en `openspec/config.yaml:137`.

## 1 · Intención

Una prueba repetible de que Desk tiene lo que Zoho Desk sabe del pasado. Al terminar, una persona lanza una pasada de sólo lectura que
compara por ids Zoho con PostgreSQL y con el volumen de adjuntos; cada diferencia sale «conocida», con causa y entrada, o «sin explicar»;
y el resultado es un veredicto por entidad y uno global, comparable entre pasadas, que el día del corte tiene que salir verde.

## 2 · Lo que hay hoy (medido en `03ab82c2`, salvo §2.4)

**2.1 · Leer Zoho sin escribir no existe.** Las listas de tickets del departamento y de archivados escriben mientras leen
(`packages/zoho-sync/src/sync.ts:151`, `packages/zoho-sync/src/sync.ts:166`) y filtran por `departmentId`
(`packages/zoho-sync/src/sync.ts:139`); la de contactos también escribe (`packages/zoho-sync/src/sync.ts:278-279`). La historia va de 50
en 50 y lanza ante cualquier `!res.ok`, sin tratar el `429` (`packages/zoho-sync/src/sync.ts:31`, `packages/zoho-sync/src/sync.ts:76-77`).
Sí es de sólo lectura `leerConversaciones`, con reintento de `429` (`packages/zoho-sync/src/conversaciones.ts:67-93`). No hay lista de
cuentas de Zoho —sólo la lectura por id de `packages/zoho-sync/src/sync.ts:86-93`— ni de adjuntos por ticket (búsqueda de `/accounts?` y
`/attachments?` en `apps/` y `packages/`: ninguna llamada a Zoho).

**2.2 · Lo que Desk guarda.** Los adjuntos salen sólo del cuerpo de cada conversación, con `size`
(`packages/zoho-sync/src/db/mappers.ts:113-120`). La historia lleva un id derivado, `h-` y un sha1 de ticket, instante, evento y detalle,
en una función no exportada (`packages/zoho-sync/src/db/history.ts:8-11`). Lo que Zoho ya no devuelve queda con `ausente_en_zoho_at`
(`packages/zoho-sync/src/db/schema.sql:852`; `DEPLOY.md:854-858`). Un ticket de la app lleva el prefijo `app-`
(`apps/desk/server/db/ticketFuentes.ts:40-42`); `accounts` y `contacts` tienen `source` y `managed_by_app`
(`packages/zoho-sync/src/db/schema.sql:4`, `packages/zoho-sync/src/db/schema.sql:10`) y sólo los escribe el upsert desde Zoho
(`packages/zoho-sync/src/db/repo.ts:10`, `packages/zoho-sync/src/db/repo.ts:23`; búsqueda de `INSERT INTO` y `UPDATE` fuera de pruebas).
`desk.accounts` es parcial por construcción: sólo entra la cuenta que nombra un contacto o un ticket (`packages/zoho-sync/src/sync.ts:86-93`).
`estadoCopia` ya juzga la copia: sin copia, ausente, otro tamaño o presente (`apps/desk/server/adjuntos/almacen.ts:107-119`).

**2.3 · El molde.** `/api/admin/relleno-adjuntos`: superadministrador (`apps/desk/server/auth/middleware.ts:26-29`), interruptor tras el
rol y antes de validar, `limite=0` libre (`apps/desk/server/routes/rellenoAdjuntos.ts:17-30`), `GET` que nunca lanza
(`apps/desk/server/routes/rellenoAdjuntos.ts:53-55`), peticiones contadas (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:89`); `429` con
2.000 ms, tres repeticiones y 150 ms entre tickets (`packages/zoho-sync/src/conversaciones.ts:23-26`); `404` o borrado como «no está en
Zoho» (`apps/desk/server/rellenoConversaciones.ts:96`, `apps/desk/server/rellenoConversaciones.ts:99`); re-verificar por id antes de dar
algo por borrado, porque las listas de Zoho tienen huecos (`packages/zoho-sync/src/sweep/sweep.ts:65-75`).

**2.4 · Producción a 07/11** (dato de persona de Alfonso; la terminal no lo ha medido). Relleno de 1G-01 (03/11): 783 tickets, 731
completos, 51 descuadrados, siempre con más conversaciones en Desk que en el recuento de Zoho, que no cuenta los hilos `FEEDBACK` (E-266,
`docs/sdd/ENTRADA.md:2410`); el #1017 está en Desk y Zoho no lo devuelve (E-267). Adjuntos (1G-02, 05/11 a 07/11): 2.424 ficheros en
`/data/adjuntos`; 2 ausentes en Zoho con `404`, el `495552000061185001` del #881 y el `495552000057838002` del #925; 8 pendientes del 06/11,
entrados con `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` cerrado, sin ids. Tickets: 784 en `desk.tickets` frente a ≈986, que es el número más alto y
no un recuento (`openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:95`, «1G-03 lo comprueba»); de los no recorridos
por el primer relleno, 523 estaban archivados en Zoho (E-257).

## 3 · Alcance y enfoque

**Dentro.**
1. **Una pasada de sólo lectura** que compara por ids en las dos direcciones (qué falta en Desk, qué falta en Zoho): **tickets**, lista
   del departamento más archivados frente a `desk.tickets` (S-k, S-l); **conversaciones** por ticket comparando LISTAS, con el recuento
   declarado sólo como dato si viene en la lista de tickets (**hipótesis**), nunca como juez (E-266); **adjuntos** por cantidad y bytes,
   Zoho (S-e) frente a `desk.attachments` por id y `size`, y `desk.attachments` frente al volumen con `estadoCopia`, sin descargar nada;
   **historia** frente a `desk.ticket_history` con el mismo id derivado; **contactos** y **cuentas** (S-f) frente a sus tablas.
2. **Clasificación**: cada diferencia, «conocida» con causa y entrada, o «sin explicar». Las conocidas son DATOS editables, un fichero
   versionado que el servidor valida al cargar, no constantes en el código (S-j).
3. **Veredicto** por entidad y global; verde es cero «sin explicar» con cobertura completa (S-c).
4. **Ruta de superadministrador**: `POST` lanza y `GET` da el estado, como `/api/admin/relleno-adjuntos`; reanudable con `desde`, corte
   por `429` agotado que deja dónde seguir, y `limite=0`, que cuenta sin llamar a Zoho (S-a, S-i). Comparable entre pasadas (S-m).
5. **`DEPLOY.md` §23** al final: pasos de persona y la variable con «Qué enciende» y «Qué se rompe si se pone mal»; la línea de
   `.env.example`, redactada en el informe de cierre (P-5). **Spec:** ADDED al final de `zoho-sync`, desde RQ-ZS-34; ningún MODIFIED.

**Límites (datos de clientes).** Contra Zoho, sólo `GET`. Contra PostgreSQL, sólo lectura de datos de negocio; si el informe se guarda,
en su sitio y con esquema calificado (`CREATE TABLE … public.x`), sin tocar `tickets`, `conversations` ni `attachments`. Informe, `GET` y
log llevan sólo ids, números de ticket y recuentos; nunca nombres, correos, asuntos, contenido ni secretos. La pasada nunca repara.

**Fuera.** E-261 (S-d); el volcado de Zoho (S-b); descargar adjuntos o compararlos por hash; corregir lo encontrado (rellenos, marcas,
el criterio de E-266, el #1017); otros departamentos (S-k); agentes, actividades y el hub; `apps/desk/src`, porque el resultado es el
`GET`; 1G-04; en la rama, `.env.example` y los seis de Supervisión (`CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los dos
`F0-05_*` y `docs/sdd/R08.4_Expediente_de_cambios.md`).

**Qué cubre de la fila, en una línea:** el informe de las seis entidades con veredicto, repetible y comparable; deja fuera su ejecución en
producción y su repetición el día del corte (P-1 a P-4).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync`, verificación de completitud frente a Zoho y al volumen (RQ-ZS-34 en adelante, ADDED
al final; el último vivo es RQ-ZS-33, `openspec/specs/zoho-sync/spec.md:2062`).

## 5 · Supuestos

S-a a S-i los fija el encargo; S-j a S-n, esta propuesta.

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-a | La pasada completa va tras un interruptor que nace cerrado (`=== 'true'`), al final de `packages/zoho-sync/src/config.ts:66` y `packages/zoho-sync/src/config.ts:125`, en sitio, aunque sólo lee: gasta cuota diaria de Zoho Desk, sin medir (E-254 d). Nombre propuesto, a confirmar en el diseño: `VERIFICACION_COMPLETITUD_HABILITADA`. Cerrado ⇒ `403` que la nombra, tras el rol y antes de validar; `limite=0` no la necesita | Quitar la variable |
| S-b | Vía API; el volcado «Copia de seguridad de datos» (`docs/sdd/Inventario_ZohoDesk_Configuracion.md:95`) es un contraste opcional, fuera de esta tanda | — |
| S-c | Verde = cero «sin explicar» en las seis entidades, con todos los tickets comparados y sin errores por ticket; cortada, parcial o con errores es «incompleto», nunca verde. **Posible pregunta para el apartado 06:** decide si el corte se puede hacer | Cambiar la regla |
| S-d | E-261 (`books.contacts`, `books.sales_orders`) queda FUERA: la fila habla de entidades de Zoho Desk, y E-261 es «candidato a 1G-03» sin decisión (`docs/sdd/ENTRADA.md:2382`). El informe de cierre lo dice; no se inventa destino | Ampliar con una decisión |
| S-e | Adjuntos en Zoho = unión por id de los `attachments` de cada conversación de la lista del ticket (la única vía por la que Desk los guarda, con `size`) MÁS `GET /tickets/{id}/attachments`. **Hipótesis:** existe y puede traer adjuntos que Desk nunca guarda; una petición por ticket; un `404` o un fallo es error de ese ticket, no ausencia | Quitar la segunda fuente |
| S-f | Cuentas: `GET /accounts` por páginas. **Hipótesis:** existe, con `from` y `limit` hasta 100. Como `desk.accounts` es parcial por construcción (§2.2), lo probable es que salgan cuentas «sin explicar»: es lo honesto, y no es de esta tanda inventarles una clase conocida (§9) | — |
| S-g | Lo nacido en la app (tickets `app-`, conversaciones con `source` distinto de `'zoho'` —el filtro de `apps/desk/server/rellenoConversaciones.ts:76`—, contactos y cuentas con `managed_by_app` o `source` de app) sale de «falta en Zoho» por una regla escrita en la lista editable: quitarla los vuelve «sin explicar» | Quitar la regla |
| S-h | Los 8 adjuntos pendientes del 06/11 no tienen ids y no se precargan: si salen sin copia, son «sin explicar» hasta volver a correr el relleno de adjuntos | — |
| S-i | Peticiones a Zoho y `429` se cuentan por entidad y van en el informe: la primera pasada mide el coste en cuota (E-254 d). `limite=0` da el mínimo estimado (**hipótesis:** tres por ticket, conversaciones, historia y adjuntos, más las páginas de las listas) | — |
| S-j | Cada entrada de la lista lleva entidad, causa y entrada de la bandeja (o apartado de `DEPLOY.md`), y o ids concretos (#1017, E-267; los dos adjuntos del #881 y el #925, 1G-02) o el nombre de una regla de un conjunto cerrado del código (nacido en la app, S-g; conversación marcada ausente y sus adjuntos, §19 de `DEPLOY.md`). Lo de un ticket conocido como ausente hereda su clase. Lista inválida (sin causa, sin entrada, regla o entidad desconocida) ⇒ no se lanza y el error nombra la entrada; una entrada que no explica nada sale «conocida sin uso» | Cambiar el formato |
| S-k | Tickets del mismo `departmentId` que la sincronización (`packages/zoho-sync/src/sync.ts:161`); el informe declara el departamento. **Hipótesis:** no hay tickets de Ambientalia en otro | Listar departamentos |
| S-l | Un ticket, contacto o cuenta de Desk ausente de la lista de Zoho se pide por id antes de clasificarlo: `404`, borrado o en papelera ⇒ «falta en Zoho»; vivo ⇒ «hueco de lista», que no es ausencia | Quitar la re-verificación |
| S-m | Dos pasadas sobre los mismos datos dan el mismo informe salvo instantes y peticiones: ids ordenados, orden fijo, versión de esquema y de la lista aplicada. Memoria o tabla propia lo decide el diseño, con un requisito: un corte o un redespliegue entre pasada y reanudación nunca da verde sobre cobertura parcial | — |
| S-n | `cierra: si`: la fila queda construida; correr la pasada es de persona (CLAUDE.md, «Regla del ciclo 1»), como S-14 de 1G-02. Si Supervisión entiende que exige el verde en producción, pasa a `no` antes de archivar | Cambiar la cabecera |

**Ronda de preguntas:** no aplica. El preflight es `auto` y no se da ninguna causa de parada de la «Regla de ejecución»: no cuesta dinero,
sólo lee y la lanza Alfonso. S-c queda como posible pregunta para el apartado 06 (§9).

## 6 · Criterios de aceptación

- **CA-1** Con Zoho falso y pg-mem, un id que falta a cada lado de cada entidad sale en su lado, ordenado; con datos idénticos, cero.
- **CA-2** Conversaciones: igual número y distintos ids ⇒ diferencia; recuento declarado distinto con listas iguales ⇒ ninguna (E-266).
- **CA-3** Adjuntos: el que llega por las dos vías de S-e cuenta una vez; `size` distinto, sin copia, ausente u otro tamaño ⇒ diferencia.
- **CA-4** Historia: un evento guardado casa por el mismo id que escribe `packages/zoho-sync/src/db/history.ts:8-11`; uno no guardado falta.
- **CA-5** Lo cubierto por la lista sale «conocida» con causa y entrada; quitada su entrada, la misma diferencia sale «sin explicar».
- **CA-6** Una copia ensuciada del fichero real (sin causa, sin entrada o con regla desconocida) impide lanzar y nombra la entrada; el real carga.
- **CA-7** Verde sólo con cero «sin explicar» y cobertura completa; cortada, con error por ticket o con parte previa perdida ⇒ «incompleto».
- **CA-8** Cerrado (`TRUE`, `1` o vacío) ⇒ `403` tras el rol y antes de validar; `limite=0` no llama a Zoho; `GET` nunca lanza; una a la vez.
- **CA-9** `429` tres veces ANTES del `404` y de `!res.ok`; agotado, `cortadoEn` y `desde` reanuda; por id, `404` ⇒ falta y vivo ⇒ hueco.
- **CA-10** Toda petición a Zoho es `GET`; ninguna sentencia escribe en tablas de negocio (`Queryable` que sólo admite `SELECT` en ellas).
- **CA-11** Ni informe, ni `GET`, ni log llevan nombres, correos, asuntos, contenido ni secretos (fixtures con marcadores).
- **CA-12** Dos pasadas iguales dan el mismo informe salvo instantes y peticiones; lleva versiones, bytes por lado y peticiones por entidad.
- **CA-13** `DEPLOY.md` §23 y su prueba; guardas del árbol en sitio (§11); `npm test`, typecheck y `npm run lint -- --max-warnings 165`.

## 7 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Abrir el interruptor (`true`) en la App y redesplegar; si el diseño guarda el informe en tabla, copia previa de `desk-db` antes | Alfonso | `DEPLOY.md` §23 |
| P-2 | `limite=0` primero (cuenta y estima, sin Zoho); después la pasada completa y el `GET` hasta `terminado: true`; si se corta, `desde=<cortadoEn>` | Alfonso | `DEPLOY.md` §23 |
| P-3 | Pasar el resumen del `GET` final al analista y cerrar el interruptor, con redespliegue | Alfonso | `DEPLOY.md` §23 |
| P-4 | Repetir la pasada el día del corte, tras congelar Zoho y la sincronización final (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:97-98`) | Alfonso | `DEPLOY.md` §23 |
| P-5 | Añadir a `.env.example` la línea de la variable: la terminal no puede leer ese fichero | Alfonso | informe de cierre |

## 8 · Riesgos

- **Cuota (E-254 d, sin medir).** **Hipótesis:** unas 2.350 peticiones para 783 tickets más las listas; la acotan pausa, corte y `limite` (S-i).
- **Recursos sin probar** (S-e, S-f): si una lista falla, esa entidad queda «sin comparar» y nunca verde. **Huecos de lista** (E-263): S-l.
- **Datos que se mueven:** la sincronización corre cada 180.000 ms (`packages/zoho-sync/src/config.ts:88`) y en un ensayo lo creado tras
  el inicio puede salir «sin explicar»; el día del corte Zoho está congelado (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:97`).
- **Una lista que explica de más** oculta un hueco: ids antes que reglas, reglas cerradas, entrada obligatoria. Editarla pide commit y
  despliegue; una tabla lo evitaría a costa de escribir en producción y de una vía de edición: se descarta aquí.
- **Sin `ADJUNTOS_DIR` o sin volumen**, adjuntos queda «sin comparar». **Presupuesto:** `tasks.md` parte en lotes lo que pase de 800.

## 9 · Notas para Supervisión (lo que sólo Supervisión escribe en los seis ficheros)

- **S-c al apartado 06:** la definición de verde decide si el corte se puede hacer (`decision/preguntas-de-detalle-sin-llegar`).
- **Cuentas (S-f):** si salen «sin explicar», Gerencia decide si importan para el corte y con qué clase. **E-261 (S-d):** sin destino.
- **E-254 (d):** las peticiones por entidad de la primera pasada son la medida de la cuota.
- **E-266:** comparar por ids saca esos 51 tickets de la prueba del corte; el criterio de marcado no cambia y sigue sin destino.
- **Maestro:** si la primera medida da cuentas o historia incompletas, queda desmentida desde esa fecha la frase de
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3445` («… las cuentas … ya están en la base propia»), y
  «unos 986» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3450`) si Zoho cuenta otra cifra: al expediente.
- **Datos de §2.4:** los ids de los dos adjuntos entran en la lista como datos; su traza en la bandeja es de Supervisión.

## 10 · Vuelta atrás

Cerrar el interruptor impide lanzar; `limite=0` sigue porque sólo lee. Revertir el commit retira ruta, motor, lista y §23; una tabla
propia, si la hay, queda inocua o se retira con copia previa, por decisión de persona. No hay datos de negocio que restaurar.

## 11 · Método y cierre

Worktree propio desde `03ab82c2`; `strict_tdd` con rojo previo; vitest, pg-mem y supertest con Zoho falso. Lo nuevo, en ficheros nuevos
de la App, que tiene el volumen; los muy citados (`config.ts`, `app.ts`, `history.ts` si se exporta el id, `DEPLOY.md`) sólo en sitio o
al final; si el diseño copia el id de la historia, una prueba enfrenta las dos (molde H5). **Mutaciones:** `!== 'false'`; comparar por
recuento; leer con las listas de `createSync`, que escriben; un asunto en el log; un corte informado verde. **Posición:** rol, interruptor,
validación; `429` antes del `404` y de `!res.ok`; re-verificar por id antes de «falta en Zoho». **Fichero vigilado:** ensuciar la lista
real. **Clasificación:** quitar una entrada conocida la vuelve «sin explicar». **Guardas que cuentan el árbol**, en `tasks.md`:
`apps/desk/server/reconciliacion/registro.test.ts:218` y `apps/desk/server/reconciliacion/registro.test.ts:220` (fuera de `archive/`,
1G-03 entra en «en curso»; al archivar, en «cerradas por archivo»; en sitio, mismas líneas); `apps/desk/server/deployRellenoAdjuntos.test.ts:37`
fija la §22 como última; `packages/zoho-sync/src/db/migrate.test.ts:282`, sólo si se crea tabla. Regla 13: el cliente no decide nada
nuevo. Barrido de la regla de mutación 4 al cerrar; intentos ≤ 800 con `git diff --shortstat --no-renames` más `wc -l` de lo no trackeado.
