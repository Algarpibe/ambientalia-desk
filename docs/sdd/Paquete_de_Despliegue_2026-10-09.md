# Paquete de despliegue — 2026-10-09, consolidado

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe una
sesión que no despliega. La publicación es una acción manual: el CI **no despliega**, sólo verifica
(`DEPLOY.md:270-271`).

**Este paquete SUSTITUYE, para publicar, a tres documentos que NO se editan más:** el consolidado del 2026-10-05 (b)
(`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md`, medido sobre `36dc352`) y sus dos adendas, la del 2026-10-06
(`docs/sdd/Paquete_de_Despliegue_2026-10-06.md`) y la del 2026-10-08 (`docs/sdd/Paquete_de_Despliegue_2026-10-08.md`).
Los tres son registros fechados. Éste es **autosuficiente en lo que decide el corte**: condiciones de parada (§0),
esquema entero por orden de aplicación (§2), variables nuevas con su valor inicial (§3), procedimiento con sus
consultas (§4), cambios de comportamiento (§5) y tareas de persona por dueño y en orden (§6). Lo que remite a un
paquete anterior es sólo **detalle largo que no cambia** —el paso a paso de una verificación en la aplicación—,
siempre con ruta y línea.

Cada dato se contrastó en esta sesión contra el árbol de `473665b`, leyendo el código y no los paquetes anteriores
(§8). Lo que no se pudo contrastar desde el repositorio lleva la palabra **hipótesis** y está numerado en §9.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | **`473665b`**. Su código es el de la fusión `509b905`: de `509b905` a `473665b` sólo cambia documentación. Lo que entre en `main` después y sea sólo documentación no cambia este paquete |
| Base que consta en producción | `ae5aaf4` — **hipótesis 1** (§9): ningún commit registra un despliegue posterior y se comprueba con el bundle (§4.3) |
| Rango medido | **`ae5aaf4..473665b`**: **722** commits (`git rev-list --count`), **230** de ellos tocan `apps/` o `packages/` |
| `git diff --shortstat ae5aaf4 473665b` | 970 files changed, 186367 insertions(+), 2142 deletions(-) |
| Código (`-- apps packages`) | **401 ficheros, +44.327/−1.098**; desde `36dc352`, **148 ficheros, +11.201/−372** |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` desde `36dc352` | `CLAUDE.md`, `DEPLOY.md` (+253/−8: apartado 13 y seis comprobaciones de lectura) y `scripts/generar-mapa-blueprint.ts`. **El `Dockerfile` no cambia desde `36dc352`** |
| Bundle del cliente de `473665b` | `index-Tl4V5akM.js`, 408.060 bytes, sha256 `61e8c639a79bc4098d2c74ecd6fe90b8673a2a45709be940cd0b0c6d9f783cdf` (§4.3) |
| Pruebas, tipos y lint | Ejecutados el 2026-10-09 sobre el árbol de `473665b` con los documentos de este cierre, los tres con código de salida 0: `npm test` **4.327 en verde y 7 omitidas** (262 ficheros y 2 omitidos), `npm run typecheck` limpio y `npm run lint` 165 avisos y 0 errores. El detector de citas corre sobre el commit de este paquete, en el `pre-push`: sin su código 0 no se empuja |

**Las doce piezas desde `36dc352`, por orden de llegada a `main`** (cifras: `git diff --shortstat` de `apps` y
`packages` contra el primer padre de cada fusión):

| Pieza (`tanda`, `cierra`) | Fusión | Código | Esquema | Variables |
|---|---|---|---|---|
| `respaldo-semanal-drive` (**F1F-02**, `cierra: no`) | `cdfd0b0` | 21 ficheros, +1.489/−3 | No | **Cinco `RESPALDO_DRIVE_*`** |
| `ovi-garantia-por-cargo` (**F1B-03**, `cierra: no`) | `9822bd7` | 14 ficheros, +878/−31 | No | No |
| `sync-tickets-por-modificacion` (`fuera-del-plan`, `cierra: no`) | `f32f153` | 2 ficheros, +312/−3 | No | No |
| `ficha-garantia-proveedor` (**F1B-13**, `cierra: no`) | `9b48aa8` | 20 ficheros, +1.961/−20 | **Sí**: sentencias 62 a 64 | No |
| `reasignacion-con-motivo` (**F1B-05**, `cierra: si`) | `1bf414a` | 28 ficheros, +1.480/−38 | **Sí**: 65 y 66 | No |
| `accesorios-lista-por-modelo` (**F1B-04**, `cierra: no`) | `5ce4252` | 25 ficheros, +1.097/−66 | **Sí**: 67 (una fila sembrada) | No |
| `ampliacion-contrato` (**F1B-11**, `cierra: si`) | `73a7a5f` | 14 ficheros, +905/−29 | **Sí**: 68 y 69 | No |
| `indicadores-51-55` (**F1F-05**, `cierra: no`) | `2f208ce` | 18 ficheros, +1.419/−64 | **Sí**: 70 y 71 | No |
| `prioridad-tres-niveles` (**F1B-07**, `cierra: no`) | `ce4498c` | 22 ficheros, +514/−142 | No | No |
| `mapa-blueprint-tres-flujos` (**F1B-09**, `cierra: no`) | `60b171f` | 5 ficheros, +365/−18: nada en ejecución | No | No |
| `columna-propia-dos-estados` (**F1B-08**, `cierra: no`) | `ae2e522` | 3 ficheros, +28/−10 | No | No |
| `nit-exentos-aviso-provisional` (**F1B-19**, `cierra: si`) | `509b905` | 15 ficheros, +832/−27 | **Sí**: 72 a 74 | No |

Lo anterior a `36dc352` —F1A-03, F1C-09, F1C-10, F1B-15, `afa4252`, F1B-03 (dos cambios), F1C-11, F1B-04 (recepción y
lista de novedades), F1F-05 (nueve indicadores), F1B-07 (Top 5), F1B-08 (búsqueda), F1C-05, F1F-01, F1B-05 (trazas),
F1F-02 (nocturna) y lo que traía el paquete del 2026-10-01— entra entero en este rango y en este paquete.

---

## 0 · Condiciones de parada — leer antes que nada

**Si una de las once primeras no está cumplida, no se pulsa Deploy sobre `473665b`.** La duodécima es una fecha.

### (a) Copia comprobada de la base `desk` — F1C-09 y `decision/p55-backup`

`decision/f1c09-copia-antes-de-desplegar` (`openspec/config.yaml:3659-3680`), respuesta textual
(`openspec/config.yaml:3665`):

> «No despliegues F1C-09 sin copia previa de la base.»

Antes de desplegar y de ejecutar la migración de F1C-09 se hace una copia de `desk` **y se comprueba que existe**; es
tarea de Alfonso, dueño de `decision/p55-backup` (`openspec/config.yaml:3667-3670`).

**La copia de este corte es manual, aunque las tres copias automáticas vengan en este mismo código.** Nacen apagadas:
con `RESPALDO_HABILITADO` ausente no hay copia nocturna ni previa y su ruta responde `403`
(`apps/desk/server/respaldo/config.ts:31`, `apps/desk/server/routes/respaldo.ts:21`); con
`RESPALDO_DRIVE_HABILITADO` ausente no se programa la de Drive (`apps/desk/server/respaldo/configDrive.ts:31`,
`apps/desk/server/index.ts:112-113`). Encenderlas exige contratar y tareas de persona (§6.2). Procedimiento de la
copia manual —**hipótesis 12**, no está en `DEPLOY.md` ni verificado contra EasyPanel—:

```bash
# La cadena de conexión es la variable DATABASE_URL del servicio App: el NOMBRE, nunca su valor en un chat.
pg_dump --format=custom --file=desk_antes_de_473665b.dump "$DATABASE_URL"
```

**Criterio de hecho: existe un fichero de copia con fecha de hoy, fuera del servidor, y su tamaño no es cero.**
Sobre `zoho-hub`: si el barrido está activo y borrando (condición h), decidir antes si se copia también el hub.

### (b) F1C-09 — despliegue y migración EN EL MISMO CORTE

F1C-09 retira «Marcar como pendiente» y las dos «Servicio externo» hacia `Por Facturar`
(`packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`) y `Pendiente` pasa a
existir sólo en soporte remoto (`packages/shared/src/estados.ts:182`). Entre el Deploy y la migración, un ticket de
servicio en `Pendiente` se queda sin transiciones
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:66`).

Script: `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`. Paso 1, sólo lectura, **antes** del Deploy
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:32-42`); paso 2, traslado, **tras** el Deploy
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:44-53`); recuento posterior, con el grupo 1 a 0
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:55`). No se ha ejecutado nunca contra PostgreSQL real
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:3-5`): la copia de (a) es la red.

### (c) E-158 y los dos recuentos de F1B-03 — sin ellos no se despliega

Desde la guarda de F1B-03, «Habilitar Servicio» no pasa sin una remisión de entrada vigente. Se llama en
`apps/desk/server/services/ticketService.ts:131`, está en `apps/desk/server/services/ticketService.ts:273-277` y
responde 422 con el texto de `packages/shared/src/remision.ts:131-135`. Alcanza a los tres orígenes de la transición
(`packages/shared/src/transitions.ts:178`) y a toda clasificación que pase por ella, «Equipo nuevo» incluido. **No
tiene interruptor**: publicar `473665b` es publicarla.

Hacen falta, antes del Deploy:

1. **La confirmación de Gerencia a E-158** (`docs/sdd/ENTRADA.md:1782`). Está registrada como **pendiente, no como
   decisión** (`openspec/config.yaml:3889-3891`), con esta respuesta textual (`openspec/config.yaml:3897`):
   «[Pendiente de confirmar con Servicio Técnico.] Si equipo nuevo no lleva remisión de entrada: excepción por
   clasificación «Equipo nuevo», construida antes de publicar.» Si la confirmación es «no la lleva», hace falta código
   nuevo y **`473665b` deja de ser el commit a publicar**; si es «sí la lleva», se publica tal cual
   (`openspec/config.yaml:3901-3903`).
2. **Los dos recuentos ejecutados en producción**, de sólo lectura y ejecutables hoy (leen columnas que ya existen en
   `ae5aaf4`): `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`
   (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:33-59`; su columna `sin_remision_vigente`
   son los tickets que quedarán bloqueados) y `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`
   (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:29-77`).

Un ticket bloqueado tiene salida en la aplicación: el botón «Crear remisión» se ofrece en los tres orígenes
(`packages/shared/src/transitions.ts:163-165`; `apps/desk/src/lib/botonRemision.ts:31`).

### (d) Los cargos de permiso: lista y persona ANTES de publicar; asignación, lo primero del corte

**Los cargos no se pueden asignar antes del Deploy**: la columna `public.users.cargo_permiso` la crea este mismo
despliegue (sentencia 24, `packages/zoho-sync/src/db/schema.sql:601`) y la pantalla que la escribe viene en el mismo
código (`apps/desk/server/auth/routes.ts:99-100`). Lo que **sí** es condición previa: tener nombrada a la persona
administradora que asigna, la lista escrita de quién lleva cada cargo, y aceptado por escrito el intervalo en que
nadie los tiene. La comparación es exacta: un texto fuera de la lista de ocho es «sin cargo»
(`packages/shared/src/cargos.ts:12-15`, `packages/shared/src/cargos.ts:40-42`).

Lo que queda **sólo para un administrador** mientras un cargo no esté asignado:

| Cargo | Acto que exige | Ruta:línea |
|---|---|---|
| **Director Comercial** (con área Comercial) | «Liberación sin factura»; fijar la prioridad de un cliente y su Top 5 | `packages/shared/src/cargos.ts:32`, `packages/shared/src/cargos.ts:80-83` |
| **Director Técnico** | **Asociar una orden `OVI-`** en el alta, en una transición o en la remisión de entrada | `packages/shared/src/cargos.ts:71-74`, `apps/desk/server/services/ticketService.ts:44`, `apps/desk/server/routes/remision.ts:220` |
| **Director Técnico** | Responder, editar y avanzar la ficha de reclamación al fabricante | `packages/shared/src/garantiaProveedor.ts:89-92`, `apps/desk/server/routes/garantiaProveedor.ts:43` |
| **Director Técnico** | Ajustar la prioridad de un ticket sin ser de Comercial | `packages/shared/src/cargos.ts:101`, `packages/shared/src/cargos.ts:104-107` |
| **Director Técnico** (con área Servicio Técnico) | Mantener la lista de novedades y añadir accesorios a un modelo | `packages/shared/src/mantenimientoNovedades.ts:15-18`, `apps/desk/server/routes/accesoriosModelo.ts:25` |

**El efecto mayor es en los tickets de «Garantía»**: sólo admiten una orden OVI
(`packages/shared/src/ordenOVI.ts:61-64`), y la OVI sólo la asocia el Director Técnico. «Habilitar Servicio» es de área
Comercial y su orden es obligatoria (`packages/shared/src/transitions.ts:178`, `packages/shared/src/transitions.ts:189`);
reconfirmar la que el ticket ya trae no pide cargo (`apps/desk/server/services/guardasOVI.ts:44-48`). En la práctica,
el Director Técnico asocia la OVI antes —en el alta o en la remisión de entrada— y Comercial la reconfirma. **Sin el
cargo asignado, ningún ticket de garantía recibe orden salvo por un administrador.**

Orden del mismo día: **primero los cargos, después el Top 5** —marcar un Top 5 escribe en el acto sobre los tickets
abiertos del cliente (`apps/desk/server/routes/prioridad.ts:44`)—.

### (e) La ráfaga de avisos de provisionales (S-4 de F1B-19) y la lectura de todos los contactos de Books

Desde el Deploy, en cada intervalo de sincronización —180000 ms por defecto (`packages/zoho-sync/src/config.ts:88`)—
la App evalúa qué clientes provisionales sin enlazar comparten NIT con un contacto de Books
(`apps/desk/server/index.ts:88`, `apps/desk/server/index.ts:93`). **Sin interruptor, sin tope y sin corte por fecha**:
cada pareja ya existente avisa una vez (`apps/desk/server/services/avisoProvisionalEnBooks.ts:91-97`), con un aviso de
bandeja por pareja **y por destinatario** (`apps/desk/server/services/avisoProvisionalEnBooks.ts:72`). Destinatarios:
los usuarios cuyo rol recibe avisos de Comercial **y todos los administradores activos**
(`apps/desk/server/services/avisoProvisionalEnBooks.ts:85`, `apps/desk/server/db/avisos.ts:79-90`). No sale correo.

Para cruzar, la pasada lee **todos** los contactos de Books, sin filtro ni paginación
(`apps/desk/server/db/provisionalEnBooks.ts:19`), y cruza en memoria
(`apps/desk/server/services/avisoProvisionalEnBooks.ts:44-48`). Sólo lo hace si hay algún provisional sin enlazar y
no exento (`apps/desk/server/services/avisoProvisionalEnBooks.ts:38`,
`apps/desk/server/services/avisoProvisionalEnBooks.ts:41`); en ese caso, **cada tres minutos**. Su coste con el
volumen real de contactos no está medido (hipótesis 20).

El supuesto S-4, literal
(`openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/archive-report.md:88`): «**Ráfaga al publicar
(S-4):** la primera pasada avisa una vez cada pareja que ya exista. Sin dato de cuántas hay.» Un corte que callase las
parejas previas **sólo es posible antes de publicar**
(`openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/proposal.md:110`).

**Lo que acota el riesgo, leído en el esquema:** `public.clientes_provisionales` la crea **este mismo despliegue**
(sentencia 34, `packages/zoho-sync/src/db/schema.sql:658`). Si producción sigue en `ae5aaf4` (hipótesis 1), la tabla
no existe, no hay provisionales anteriores y **la primera pasada no puede avisar nada**; la ráfaga sólo existiría si
el alta manual se hubiera usado ya en producción.

**Condición, antes del Deploy:** (1) ejecutar en `desk`, en sólo lectura,
`SELECT to_regclass('public.clientes_provisionales');`. Si devuelve `NULL`, no hay ráfaga posible y esta condición
queda cumplida. Si devuelve la tabla, contar `SELECT count(*) FROM public.clientes_provisionales WHERE enlazado_a IS
NULL;` y **no publicar sin la respuesta de Gerencia a S-4**. (2) En los dos casos, que Gerencia conozca que desde ese
día cada provisional nuevo que coincida avisa a Comercial y a los administradores.

### (f) Los tickets con prioridad ajustada antes del despliegue — siguen con `managed_by_app`

Desde `prioridad-tres-niveles`, el ajuste manual de prioridad protege **sólo la prioridad**: escribe la marca
`prioridad_en_app_at` y no toca `managed_by_app` (`apps/desk/server/db/prioridadCliente.ts:93`), y el sincronizador
deja de escribir sólo esa columna (`packages/zoho-sync/src/db/repo.ts:76-78`). Antes, el ajuste ponía
`managed_by_app`, que congela la fila **entera** frente a Zoho (`packages/zoho-sync/src/db/repo.ts:71`). **No hay
relleno**: un ticket ajustado con el código anterior seguiría congelado
(`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:54-58`).

**Lo que acota el riesgo:** `public.prioridad_ajustes` la crea este mismo despliegue (sentencia 26,
`packages/zoho-sync/src/db/schema.sql:613`). Si producción sigue en `ae5aaf4` (hipótesis 1), nadie ha podido ajustar
una prioridad y no hay tickets afectados.

**Condición, antes del Deploy:** `SELECT to_regclass('public.prioridad_ajustes');` en `desk`. Si devuelve `NULL`,
cumplida. Si devuelve la tabla, ejecutar la consulta de §4.5 (bloque 3) y llevar el resultado a Gerencia, que decide
si los afectados se liberan o se dejan (S-J; §6.4). No se publica con tickets congelados sin que Gerencia lo sepa.

### (g) El permiso de búsqueda de Zoho del sincronizador, y su relleno

Desde `sync-tickets-por-modificacion`, cada ciclo de los **dos** procesos pide a Zoho `/tickets/search` los tickets
modificados desde la marca de agua (`packages/zoho-sync/src/sync.ts:395-396`), que es el máximo `modified_time` de
las filas venidas de Zoho y se recalcula en cada ciclo (`packages/zoho-sync/src/sync.ts:381`). Si la búsqueda no
responde bien, el ciclo no se rompe: cae a la página reciente de siempre y deja en el log
`Zoho /tickets/search <estado>: el ciclo cae a la página 1 por -recentThread`
(`packages/zoho-sync/src/sync.ts:404-407`). Sin interruptor ni variable (`DEPLOY.md:470`).

1. **El permiso.** `DEPLOY.md:470` nombra el permiso `Desk.search.READ`. Que el token de producción lo tenga, y que
   ése sea su nombre exacto, es **hipótesis 21**: ningún fichero de código lo nombra. **Condición:** tras cada
   arranque —App y worker— mirar el log del primer ciclo. Si aparece la línea de caída en cada ciclo, el sistema
   queda como estaba antes del cambio (no peor) y hay que ampliar el permiso del token; no es motivo de reversión.
2. **El relleno NO tiene por dónde ejecutarse, y es un hallazgo de este paquete.** La tarea de persona del cambio
   pide «ejecutar `backfillTickets` una vez»
   (`openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/archive-report.md:57`), porque lo modificado
   antes de la marca y nunca traído no entra en ninguna ventana. Pero en `473665b` `backfillTickets` sólo se llama con
   la base vacía (`apps/desk/server/index.ts:63-65`, `apps/hub-sync/src/hubSync.ts:15-17`): **no hay ruta ni guion
   que lo lance a demanda**. Lo más parecido es `GET /api/admin/backfill-details`
   (`apps/desk/server/routes/admin.ts:53-58`), que relee el detalle de cada ticket que **ya está** en la base; que
   sirva de relleno para un ticket ya presente y desfasado es **hipótesis 22**. **Condición:** no dar el relleno por
   hecho; queda como tarea sin vehículo hasta que se decida (§6.10). No impide publicar: sin él, el sincronizador
   trae lo que se modifique desde hoy y deja como estaba lo anterior.
3. **Las filas `managed_by_app` no las corrige ningún relleno** (`packages/zoho-sync/src/db/repo.ts:71`).

### (h) `afa4252` — mirar `SWEEP_ENABLED` y `SWEEP_DRY_RUN` antes de redesplegar el worker

`afa4252` añade los pagos de clientes, con su tabla hija, al barrido de Books
(`packages/zoho-sync/src/booksHub/sync.ts:190-192`). Sólo tiene efecto al redesplegar el worker `hub-sync`. El barrido
se programa si `SWEEP_ENABLED` vale `true` (`packages/zoho-sync/src/config.ts:118`, `apps/hub-sync/src/hub-sync.ts:68`)
y sólo borra si además `SWEEP_DRY_RUN` vale `false` (`packages/zoho-sync/src/config.ts:119`,
`packages/zoho-sync/src/sweep/sweep.ts:77`).

> **Si el barrido está activo y borrando, borra las filas de `books.customer_payments` y
> `books.customer_payment_invoices` que Zoho ya no tenga. Una reversión de código no las recupera.**

Lo acota: re-verificación por id en Zoho (`packages/zoho-sync/src/sweep/sweep.ts:65-75`), tope de huérfanos
(`packages/zoho-sync/src/sweep/sweep.ts:62-64`, topes en `packages/zoho-sync/src/config.ts:121-122`) y la tabla hija
primero (`packages/zoho-sync/src/sweep/sweep.ts:81-84`). Su valor en producción no es verificable desde aquí
(hipótesis 6).

### (i) Las tres columnas de `tickets` que lee el sincronizador — si no entran, se revierte ese servicio

La sentencia 53 (`packages/zoho-sync/src/db/schema.sql:710`) crea `tickets.prioridad_en_app_at`, y `upsertTicket` la
lee en el `SELECT` previo que hace por **cada** ticket antes de escribirlo
(`packages/zoho-sync/src/db/repo.ts:66-69`), junto a `ov_elegida_en_app_at` y `ov_zoho_avisada` (sentencias 12 y 13).
`migrate` es tolerante por sentencia: si una falla, escribe `migrate: sentencia omitida` y sigue
(`packages/zoho-sync/src/db/migrate.ts:29-35`). **El proceso arranca igual.** Después, cada ticket falla en
`upsertTicket` y sólo deja `persistTicket(<id>) falló:` en el log (`packages/zoho-sync/src/sync.ts:125-133`): **el
sincronizador de esa base queda roto entero y en silencio**.

Pasa en **las dos bases**: `tickets` existe en `desk` y en `zoho-hub`, no es tabla replicada (`DEPLOY.md:42`), y cada
proceso migra la suya —la App en `apps/desk/server/index.ts:27`, el worker en `apps/hub-sync/src/hubSync.ts:13`—.

**Condición:** justo tras el Deploy de la App, el bloque 2 de §4.5 sobre `desk`; justo tras el redespliegue del
worker, el mismo bloque sobre `zoho-hub`. **Si falta una de las tres columnas, se revierte ese servicio (§4.6).**

### (j) Que `public.nit_exentos` exista, con su fila sembrada

La guarda de NIT del alta manual lee `public.nit_exentos` en **cada alta con cliente manual**, antes de decidir y sin
`try` (`apps/desk/server/services/ticketService.ts:96`, `apps/desk/server/db/nitExentos.ts:9-12`). Como `migrate`
tolera fallos por sentencia, el despliegue puede quedar «verde» con la tabla sin crear, y entonces:

- **Toda alta con cliente manual responde `500`** —sea o no exento el NIT—, porque la consulta lanza y sale por el
  manejador central (`apps/desk/server/app.ts:90-92`). Un alta sin cliente manual no la consulta.
- **La pasada del aviso falla entera** en cuanto haya un provisional sin enlazar
  (`apps/desk/server/services/avisoProvisionalEnBooks.ts:39`): registra `pasadaProvisionalesEnBooks falló` en cada
  intervalo y no avisa a nadie (`apps/desk/server/services/avisoProvisionalEnBooks.ts:107-111`). `DEPLOY.md:655-656`
  sólo nombra el alta.
- **Si la tabla existe pero falta la fila `222222222222`** (sentencia 73 omitida), nada falla: el consumidor final
  vuelve a dar el `409` de NIT en Books, que es justo lo que F1B-19 quita.

**Condición:** justo tras el Deploy de la App, el bloque 1 de §4.5; si `nit_exentos` sale `NULL`, **revertir** (§4.6)
o crear la tabla a mano con la sentencia 72 antes de dejar entrar a Comercial. Si falta sólo la fila, insertarla con
la sentencia 73 (`packages/zoho-sync/src/db/schema.sql:807`).

### (k) Los interruptores nuevos: ausentes al publicar

**Antes del Deploy, comprobar en el servicio App que no existe (o no vale `true`) ninguna de estas tres:**

- **`MIGRACION_TICKETS_HABILITADA`** (`packages/zoho-sync/src/config.ts:123`). Encendida, cualquier administrador
  puede pasar a gobierno de la aplicación todos los tickets abiertos con una llamada a
  `POST /api/admin/migrar-tickets-abiertos` (`apps/desk/server/routes/admin.ts:222`,
  `apps/desk/server/routes/admin.ts:250-255`), y volver al código anterior no lo deshace (`DEPLOY.md:350-353`). Se
  enciende sólo el día del corte de F1F-01, que **no es este despliegue**.
- **`RESPALDO_HABILITADO`** (`apps/desk/server/respaldo/config.ts:31`) y **`RESPALDO_DRIVE_HABILITADO`**
  (`apps/desk/server/respaldo/configDrive.ts:31`). Encendidas sin destino, clave ni credencial, cada pasada falla y
  avisa por correo (`DEPLOY.md:428-430`). Se encienden con las tareas de §6.2.

### (l) F1F-05 — en producción antes del viernes 13/11/2026

F1F-05 tiene que estar desplegada **antes del viernes 13/11/2026** para medir las cuatro semanas desde el 16/11
(`DEPLOY.md:270-271`; E-181, `docs/sdd/ENTRADA.md:1899`). Va en el mismo código que la guarda de F1B-03 y no puede
separarse (§7): **esa fecha queda atada a E-158**. Si E-158 no se confirma a tiempo, la única salida es código nuevo,
otro commit y otro paquete.

### Avisos que no son de parada pero se leen antes

1. **`DB_SCHEMA` tiene que valer `desk` en los DOS servicios** (§3). De ella depende dónde aterrizan las
   `ALTER TABLE tickets` y `ALTER TABLE equipos` sin calificar; ausente vale `public`
   (`packages/zoho-sync/src/config.ts:87`). Su valor en producción es hipótesis 4.
2. **`public.users.cargo_permiso`: si la columna falta, nadie entra en la aplicación**
   (`apps/desk/server/auth/sessions.ts:17`, `apps/desk/server/auth/middleware.ts:18`). §4.5 lo comprueba.
3. **Desde el Deploy, toda OVI vigente ya asociada a un ticket aparece «Pendiente de respuesta»** en el panel de
   garantía, sin relleno (`apps/desk/server/db/garantiaProveedor.ts:150-151`). Volumen sin medir.
4. **El alta de tickets deja de ofrecer la prioridad**: la pone el servidor
   (`apps/desk/server/services/ticketService.ts:106`), y «baja» deja de ser asignable
   (`packages/shared/src/prioridad.ts:13`). Un Top 5 guardado con `Low` deja de imponer hasta que se vuelva a guardar
   (`packages/shared/src/prioridad.ts:34-36`).
5. **La ráfaga de lo vencido de `alarmas-horas-habiles` se publica apagada**
   (`apps/desk/server/services/alarmasSla.ts:61`, `apps/desk/server/services/alarmasSla.ts:102-104`); si Gerencia la
   quiere encendida, `473665b` deja de servir.
6. **E-162 y E-170** son condiciones de publicación de F1C-11 y de F1B-04 (§6.3, §6.7, §6.8).
7. **Antes del corte, la consulta de modelos sin accesorios**
   (`docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`): un modelo con la lista vacía deja al técnico sin
   casillas que marcar en la remisión de entrada (`apps/desk/src/components/CrearRemision.tsx:241-248`), y cualquier
   ítem enviado daría `422` (`apps/desk/server/routes/remision.ts:197`).

---

## 1 · Resumen para quien publica

**Veredicto: `473665b` es DESPLEGABLE sólo cuando se cumplan las condiciones de §0.** Hoy **no** lo es: falta la
confirmación de E-158 y faltan los dos recuentos de F1B-03 (§0 c), y no se puede esquivar apagando nada.

### 1.1 · El corte, en orden

1. **Antes, sin desplegar nada:** la confirmación de E-158 y los dos recuentos de F1B-03; las dos lecturas
   `to_regclass` de §0 (e) y (f); el paso 1 de F1C-09; las variables —`SWEEP_*` en el worker, los tres interruptores
   ausentes en la App, `DB_SCHEMA=desk` en los dos—; la lista de cargos y quién los asigna; E-162 (b); E-170 (1) y
   (2); la consulta de modelos sin accesorios; la consulta P-1 de F1F-05; los recuentos de F1A-03.
2. **Copia manual de `desk` y comprobación de que existe** (§0 a).
3. **Deploy de la App**, y en los minutos siguientes §4.5 entero sobre `desk`. Si falta una tabla o columna de las
   señaladas, se revierte (§4.6). Mirar el log del primer ciclo (§0 g).
4. **En el mismo corte:** paso 2 de F1C-09 y su recuento; asignar los cargos de permiso, **empezando por el Director
   Comercial y el Director Técnico**; después, el Top 5.
5. **Redespliegue del worker `hub-sync`**, con `SWEEP_*` ya mirados, y justo después el bloque 2 de §4.5 sobre
   `zoho-hub` y su log del primer ciclo.
6. **Después:** las verificaciones en la aplicación (§6), la siembra de F1A-03 cuando llegue el dato, la medición de
   F1F-05 desde el 16/11 y, contratado el proveedor, el encendido de las copias (§6.2).

**Lo que este corte NO hace:** encender ninguno de los tres interruptores, ejecutar la migración de tickets abiertos
de F1F-01, ni cargar respuestas de la encuesta.

### 1.2 · Lo que puede sorprender al equipo

Producción no tiene nada de esto. De las piezas hasta `36dc352`: la guarda de «Habilitar Servicio», el formulario de
recepción, «Derivado a», los ocho cargos, el CSV de indicadores, el Top 5 que propaga, la vista «Equipos en Remisión
creada», la caja de búsqueda, la liberación sin factura con motivo y fecha, la línea de traspaso en el historial y la
lista de novedades en Configuración. **Nuevo desde `36dc352`:**

1. **Asociar una orden `OVI-` pide el cargo Director Técnico**, y un ticket de «Garantía» sólo admite OVI (§0 d).
2. **El detalle del ticket gana el panel de garantía**: por cada OVI, la pregunta «¿Se reclama al fabricante?», y si
   es sí, la ficha con tres estados (`apps/desk/server/routes/garantiaProveedor.ts:31-36`). **La respuesta no se
   cambia una vez dada** (`apps/desk/server/routes/garantiaProveedor.ts:55`). A los 60 días naturales sin resolver,
   aviso de bandeja al Director Técnico (`packages/shared/src/garantiaProveedor.ts:39`).
3. **El detalle del ticket gana «Reasignar»**, con motivo obligatorio, traza y aviso por correo a quien lo recibe
   (`apps/desk/server/routes/reasignacion.ts:23`). Lo ve quien tenga el área de alguna transición que salga del
   estado del ticket, o un administrador (`packages/shared/src/reasignacion.ts:26`).
4. **La remisión de entrada enseña el SKU de cada accesorio**; «Añadir a mano» ya no ofrece la clase accesorio; hay
   novedad «Accesorio fuera de lista», con texto obligatorio; y Configuración gana «Accesorios por modelo» para el
   Director Técnico (`apps/desk/server/routes/accesoriosModelo.ts:22`).
5. **La ficha de un contrato gana «Ampliar»** para Comercial, hasta el 31/12 del año de su vencimiento
   (`apps/desk/server/routes/contratos.ts:74`, `packages/shared/src/contratos.ts:259`).
6. **El alta de tickets ya no pregunta la prioridad** y «baja» desaparece de las opciones; «Ajustar» la prioridad de
   un ticket lo pueden usar también el Director Técnico (`apps/desk/server/routes/prioridad.ts:62`).
7. **El tablero gana dos columnas**: `Solicitud Soporte`, tras `Ticket creado`, y `Verificación`, tras `En Proceso`
   (`packages/shared/src/columns.ts:15`, `packages/shared/src/columns.ts:20`). Vacías se ocultan por defecto
   (`apps/desk/src/boardSettings.ts:7-10`).
8. **El consumidor final (NIT `222222222222`) ya no frena el alta manual**, y Comercial recibe un aviso cuando un
   provisional coincide por NIT con un contacto de Books (§0 e).
9. **Los indicadores 51 y 55 dejan de salir vacíos por construcción**: el 51 sale para los tickets entregados por la
   aplicación; el 55 sale «sin dato» para todos hasta que se cargue un fichero de respuestas (`DEPLOY.md:623-624`).
10. **Nada visible por el mapa del blueprint, por la copia de Drive ni por el sincronizador.**

---

## 2 · Esquema, por orden de aplicación

### 2.1 · Cómo y dónde se aplica

- **App, base `desk`:** al arrancar, `reorgToDesk` si `DB_SCHEMA=desk` y después `migrate`
  (`apps/desk/server/index.ts:26-27`). `migrate` lee `packages/zoho-sync/src/db/schema.sql`, lo trocea por `;` a
  ciegas (`packages/zoho-sync/src/db/migrate.ts:19-21`) y ejecuta cada trozo **en el orden del fichero**, tolerando
  fallos (`packages/zoho-sync/src/db/migrate.ts:29-35`).
- **Worker, base `zoho-hub`:** `hub-sync.ts` llama a `hubBootstrap` (`apps/hub-sync/src/hub-sync.ts:48`), que ejecuta
  **el mismo** `migrate` en su primera línea (`apps/hub-sync/src/hubSync.ts:13`) y, si Books y CRM están
  configurados, `migrateBooks` (`apps/hub-sync/src/hubSync.ts:24`) y `migrateCrm` (`apps/hub-sync/src/hubSync.ts:80`).
  Sólo después programa sus ciclos (`apps/hub-sync/src/hub-sync.ts:49`). **Las 74 sentencias de §2.2 corren también
  en `zoho-hub`.**
- **El orden lo pone cada proceso, no una persona:** migración antes que sincronizador. Lo que sí es tarea de persona
  es **comprobar que entró** (§4.5), porque un fallo no tumba el arranque.
- **Ninguna sentencia toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`, `books.sales_orders`,
  `books.items`, `DEPLOY.md:42`), así que la regla «DDL primero en el suscriptor» de `DEPLOY.md:50-51` no aplica.

### 2.2 · `packages/zoho-sync/src/db/schema.sql` — 74 sentencias nuevas, todas al final, en este orden

`git diff ae5aaf4 473665b -- packages/zoho-sync/src/db/schema.sql` es **un solo bloque** (`@@ -446,3 +446,373 @@`):
370 líneas añadidas, ninguna borrada, de la 449 a la 818. De ellas, **74 caracteres `;`**, uno por sentencia y
ninguno en comentarios (contado por guion: cada sentencia termina en la línea de su `;`). Desde `36dc352` son **13
sentencias nuevas** (62 a 74) y un comentario cambiado dentro de la 18, que no altera la sentencia.

**Sin calificar a propósito** quiere decir: `tickets` y `equipos` son de `DESK_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:63-64`) y aterrizan donde diga el `search_path`, que con `DB_SCHEMA=desk` es
`desk,public` (`packages/zoho-sync/src/db/pool.ts:5`). Todas las demás van calificadas con `public`.

| # | Sentencia | Líneas | Cambio que la trae | Calificada |
|---|---|---|---|---|
| 1 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS history_synced_at timestamptz` | 453 | historia de Zoho del worker (`b7c1ba8`) | No, a propósito |
| 2–7 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS` `fecha_adquisicion`, `fecha_factura_compra`, `fin_garantia` (date), `codigo_interno`, `mantenedor_id`, `drive_url` (text) | 466–471 | `hojas-vida` (F1B-02) | No, a propósito |
| 8 | `CREATE TABLE IF NOT EXISTS public.calendario_cierres` | 478–483 | calendario laboral (F1B-12) | Sí |
| 9 | `CREATE TABLE IF NOT EXISTS public.equipos_cambios` | 496–505 | `edicion-comercial-equipo` (F1B-14) | Sí |
| 10 | `CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo` | 506 | ídem | Sí |
| 11 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean` | 509 | foto con novedad (F1B-04) | Sí |
| 12 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_elegida_en_app_at timestamptz` | 524 | `parche-iv11-orden-venta` (F1B-11) | No, a propósito |
| 13 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_zoho_avisada text` | 525 | ídem | No, a propósito |
| 14 | `CREATE TABLE IF NOT EXISTS public.ov_asociaciones` | 539–551 | `asociacion-ov-ticket` (F1B-11) | Sí |
| 15–17 | `CREATE UNIQUE INDEX` `idx_ov_asoc_numero_vigente`, `idx_ov_asoc_so_vigente`; `CREATE INDEX idx_ov_asoc_ticket` | 552–554 | ídem | Sí |
| 18 | `CREATE TABLE IF NOT EXISTS public.contratos` (con `CHECK contratos_fin_no_antes_de_inicio`) | 561–571 | `registro-contrato` (F1B-11) | Sí |
| 19–20 | `CREATE UNIQUE INDEX idx_contratos_lote`; `CREATE INDEX idx_contratos_cliente` | 572–573 | ídem | Sí |
| 21 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text` | 576 | `blueprint-soporte-remoto` (F1B-06) | No, a propósito |
| 22 | `CREATE TABLE IF NOT EXISTS public.alarmas_avisadas` | 582–589 | `alarmas-horas-habiles` | Sí |
| 23 | `CREATE TABLE IF NOT EXISTS public.alarmas_corte` | 593–596 | ídem | Sí |
| 24 | `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text` | 601 | `permisos-por-cargo` (F1C-05) | Sí |
| 25 | `CREATE TABLE IF NOT EXISTS public.cliente_prioridad` | 606–612 | `prioridad-top5-cliente` (F1B-07) | Sí |
| 26 | `CREATE TABLE IF NOT EXISTS public.prioridad_ajustes` (con `CHECK prioridad_ajustes_motivo`) | 613–621 | ídem | Sí |
| 27 | `CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket` | 622 | ídem | Sí |
| 28 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text` | 628 | `verificacion-gas-patron-certificado` (F1A-03) | No, a propósito |
| 29 | `ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text` | 629 | ídem | Sí |
| 30 | `CREATE TABLE IF NOT EXISTS public.gases_patron` | 632–640 | ídem | Sí |
| 31 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro` | 641 | ídem | Sí |
| 32 | `CREATE TABLE IF NOT EXISTS public.certificados_fabrica` | 644–653 | ídem | Sí |
| 33 | `CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket` | 654 | ídem | Sí |
| 34 | `CREATE TABLE IF NOT EXISTS public.clientes_provisionales` | 658–673 | `alta-manual-equipo-cliente` (F1B-15) | Sí |
| 35 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` | 676 | ídem | No, a propósito |
| 36 | `CREATE TABLE IF NOT EXISTS public.catalogo_novedades` | 682–689 | `recepcion-rotulacion-foto-entrada` (F1B-04) | Sí |
| 37–46 | Diez `INSERT INTO public.catalogo_novedades … ON CONFLICT (clave) DO NOTHING` | 690–699 | ídem | Sí |
| 47–50 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` `novedades` (jsonb), `novedad_otro` (text), `rotulado_at` (timestamptz), `rotulado_por` (text) | 702–705 | ídem | Sí |
| 51–52 | `ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS` `categoria`, `novedad` (text) | 706–707 | ídem | Sí |
| **53** | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz` | 710 | `propagar-top5-lista-remision-creada` (F1B-07) | No, a propósito |
| 54 | `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text` | 713 | ídem | Sí |
| 55 | `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL` | 714 | ídem | Sí |
| 56 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text` | 717 | `liberacion-sin-factura-motivo-fecha` (F1C-05) | No, a propósito |
| 57 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_prevista_facturacion date` | 718 | ídem | No, a propósito |
| 58–61 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` `restaurada_at` (timestamptz), `restaurada_por` (text), `anulacion_previa_at` (timestamptz), `anulacion_previa_por` (text) | 721–724 | `traspaso-y-trazas` (F1B-05) | Sí |
| **62** | `CREATE TABLE IF NOT EXISTS public.garantia_proveedor` (con `CHECK garantia_proveedor_si_o_no`) | 727–749 | `ficha-garantia-proveedor` (F1B-13) | Sí |
| 63–64 | `CREATE UNIQUE INDEX idx_garantia_proveedor_asociacion`; `CREATE INDEX idx_garantia_proveedor_ticket` | 750–751 | ídem | Sí |
| **65** | `CREATE TABLE IF NOT EXISTS public.reasignaciones` (con `CHECK reasignaciones_motivo`) | 756–764 | `reasignacion-con-motivo` (F1B-05) | Sí |
| 66 | `CREATE INDEX IF NOT EXISTS idx_reasignaciones_ticket` | 765 | ídem | Sí |
| 67 | `INSERT INTO public.catalogo_novedades … ('accesorio_fuera_de_lista', …, 65, false, true) ON CONFLICT (clave) DO NOTHING` | 768 | `accesorios-lista-por-modelo` (F1B-04) | Sí |
| **68** | `CREATE TABLE IF NOT EXISTS public.contrato_ampliaciones` | 773–781 | `ampliacion-contrato` (F1B-11) | Sí |
| 69 | `CREATE INDEX IF NOT EXISTS idx_contrato_ampliaciones_contrato` | 782 | ídem | Sí |
| **70** | `CREATE TABLE IF NOT EXISTS public.encuesta_respuestas` (con `CHECK encuesta_respuestas_calificacion` y `huella` única) | 787–795 | `indicadores-51-55` (F1F-05) | Sí |
| 71 | `CREATE INDEX IF NOT EXISTS idx_encuesta_respuestas_ticket` | 796 | ídem | Sí |
| **72** | `CREATE TABLE IF NOT EXISTS public.nit_exentos` | 801–806 | `nit-exentos-aviso-provisional` (F1B-19) | Sí |
| **73** | `INSERT INTO public.nit_exentos (nit, motivo) VALUES ('222222222222', 'Consumidor final') ON CONFLICT (nit) DO NOTHING` | 807 | ídem | Sí |
| 74 | `CREATE TABLE IF NOT EXISTS public.provisional_books_avisados` | 812–818 | ídem | Sí |

**Totales del rango:** **dieciocho** tablas nuevas, **29 columnas nuevas** sobre tablas existentes —todas anulables,
sin `DEFAULT` y sin relleno—, **catorce** índices sobre tablas nuevas, **cinco** `CHECK` en tablas nuevas, **un
`NOT NULL` retirado** (sentencia 55) y **doce** filas sembradas (once novedades y un NIT exento). Nada se borra ni se
renombra.

**Idempotencia:** 73 de 74 llevan `IF NOT EXISTS` u `ON CONFLICT DO NOTHING`. La 55 no lleva `IF`; que repetirla no
dé error en PostgreSQL es **hipótesis 9**. Las siembras no restauran una fila editada, pero **sí reinsertan una fila
borrada** en cada arranque (`packages/zoho-sync/src/db/schema.sql:677-681`,
`packages/zoho-sync/src/db/schema.sql:799`): una novedad o un NIT exento se retiran con `activo = false`, nunca
borrando.

### 2.3 · Esquemas que sólo aplica el worker, en `zoho-hub`

| Orden | Fichero | Sentencia | Cuándo corre |
|---|---|---|---|
| tras las 74 | `packages/zoho-sync/src/booksHub/schema-books.sql` | `CREATE TABLE IF NOT EXISTS books.retainer_invoices` (`a233e1d`) | Si Books está configurado (`apps/hub-sync/src/hubSync.ts:23-24`) |
| después | `packages/zoho-sync/src/crmHub/schema-crm.sql` | `ALTER TABLE crm.deals ADD COLUMN IF NOT EXISTS stage_detail_synced_at timestamptz` (`3fc4768`; ya no se usa, no se borra) y `… stage_history_synced_at timestamptz` (`030efa7`) | Si CRM está configurado (`apps/hub-sync/src/hubSync.ts:80`) |

Las tres son idempotentes, van calificadas y no tocan tablas replicadas. Ninguno de los dos ficheros cambia desde
`36dc352`.

### 2.4 · Qué se rompe si una sentencia se omite (las que rompen algo visible)

Leído en el código de `473665b`, **no ejecutado** (hipótesis 10).

| Si falta… | Se rompe | Por qué |
|---|---|---|
| 24 `users.cargo_permiso` | **Nadie entra en la aplicación** | La sesión se lee con esa columna en cada petición (`apps/desk/server/auth/sessions.ts:17`) |
| 12, 13 o **53** en `tickets` | **El sincronizador de esa base, entero y en silencio**; en `desk`, además, guardar un Top 5 y ajustar una prioridad | `packages/zoho-sync/src/db/repo.ts:66-69`, `packages/zoho-sync/src/sync.ts:125-133`, `apps/desk/server/db/prioridadCliente.ts:93`, `apps/desk/server/db/prioridadCliente.ts:118` |
| 25 `public.cliente_prioridad` | **Toda alta de ticket**: el servidor la consulta siempre para fijar la prioridad | `apps/desk/server/services/ticketService.ts:106`, `apps/desk/server/db/prioridadCliente.ts:35` |
| 35 o 28 en `equipos` | Leer cualquier equipo por su id: alta de ticket con equipo, «Habilitar Servicio», hoja de vida | `apps/desk/server/db/equipos.ts:78`, `apps/desk/server/db/equipos.ts:164-167` |
| 30 `public.gases_patron` | Toda «Liberación» de un ticket con equipo | `apps/desk/server/db/gasesPatron.ts:17` |
| 47 a 50 en `public.remisiones` | **Toda alta de remisión**, también la de legado | El `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`) |
| 36, 51 o 52 | La lista del formulario, la subida de fotos y **todo envío** de remisión | `apps/desk/server/db/novedades.ts:13`, `apps/desk/server/routes/remision.ts:289` |
| 54 `prioridad_ajustes.origen` | Guardar la prioridad de cualquier cliente y leer la de un ticket | `apps/desk/server/db/prioridadCliente.ts:80`, `apps/desk/server/db/prioridadCliente.ts:111` |
| 56 o 57 | **Toda «Liberación sin factura»** | Las dos claves van a columna (`packages/zoho-sync/src/db/rows.ts:131`) |
| 58 a 61 | Restaurar una remisión y leer el historial | `apps/desk/server/db/remisiones.ts:152`, `apps/desk/server/db/historial.ts:151` |
| 21 `tickets.modalidad` | Crear tickets desde la aplicación | El `INSERT` del alta nombra la columna (`packages/zoho-sync/src/db/repo.ts:420`) |
| 14 `public.ov_asociaciones` | Cada transición con campo de orden y cada remisión con orden: la guarda de OVI la consulta | `apps/desk/server/services/guardasOVI.ts:35`, `packages/zoho-sync/src/db/ovAsociaciones.ts:82` |
| **62** `public.garantia_proveedor` | El panel de garantía **cada vez que se abre el detalle de un ticket**; responder, editar y avanzar; el aviso de 60 días | `apps/desk/server/db/garantiaProveedor.ts:144`, `apps/desk/server/db/garantiaProveedor.ts:158-160` |
| **65** `public.reasignaciones` | **El historial de cualquier ticket**; reasignar; borrar un usuario; **eliminar un ticket y su vista previa** (esto último no lo dice `DEPLOY.md:516-519`) | `apps/desk/server/db/reasignaciones.ts:45`, `apps/desk/server/db/reasignaciones.ts:36`, `apps/desk/server/db/reasignaciones.ts:51`, `apps/desk/server/db/eliminarTicket.ts:54` |
| 67 (fila) | Nada falla: el formulario no ofrece «Accesorio fuera de lista», aunque su aviso de modelo sin lista la nombra | `apps/desk/server/db/novedades.ts:13`, `apps/desk/src/components/CrearRemision.tsx:246-247` |
| **68** `public.contrato_ampliaciones` | **La ficha de cualquier contrato**; ampliar | `apps/desk/server/db/contratos.ts:148`, `apps/desk/server/db/contratos.ts:138` |
| **70** `public.encuesta_respuestas` | **`GET /api/indicadores` entero, en cada petición** —JSON y CSV—, haya o no respuestas; la carga | `apps/desk/server/indicadores.ts:85`, `apps/desk/server/db/encuestaRespuestas.ts:57` |
| **72** `public.nit_exentos` | **Toda alta con cliente manual (`500`)** y la pasada del aviso (§0 j) | `apps/desk/server/db/nitExentos.ts:9-12`, `apps/desk/server/services/ticketService.ts:96` |
| 73 (fila) | Nada falla: el consumidor final vuelve a dar el `409` de NIT | `packages/shared/src/nitExentos.ts:12` |
| 74 `public.provisional_books_avisados` | La pasada del aviso registra un error por intervalo y no avisa; el alta y la sincronización siguen | `apps/desk/server/db/provisionalEnBooks.ts:27`, `apps/desk/server/services/avisoProvisionalEnBooks.ts:107-111` |

### 2.5 · Ficheros SQL que ejecuta una persona (no corren al desplegar)

`docs` no entra en la imagen (`Dockerfile:16-21`).

| Fichero | Quién y cuándo | ¿Escribe? |
|---|---|---|
| `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` | Gerencia, **antes** (§0 c) | No |
| `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Gerencia, **antes** (§0 c) | No |
| `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` | Persona con acceso a producción, **antes del corte**. Dos consultas, cada una entre `BEGIN TRANSACTION READ ONLY` y `ROLLBACK` (`docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql:42`, `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql:74`). Lee `catalogo_modelos` y `catalogo_articulos`, que ya existen en `ae5aaf4` (hipótesis 23: que PostgreSQL de producción la acepte tal cual) | No |
| `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` | Alfonso, en el corte (§0 b) | **Sí** |
| `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` | Alfonso, con el dato del Director Técnico (§6.1) | **Sí** |
| `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` | La persona con acceso a producción, el día del corte de F1F-01, **no en éste** (§6.2) | Lo que escribe es la ruta; el fichero trae la reversión comentada |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` | Alfonso, antes (§6.1) | No |
| `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` | Alfonso, antes del 24/12 (§6.1) | **Sí** |

Y dos consultas que no tienen fichero propio y van escritas en §4.5: la de tickets con prioridad ajustada antes del
despliegue (bloque 3) y la de NIT repetidos en Books para contabilidad (bloque 4).

---

## 3 · Variables de entorno

**Quince variables nuevas en el rango, y ninguna se pone a `true` al publicar.** Comprobado comparando los nombres que
el código lee en `ae5aaf4` y en `473665b` (`git grep` de `env.NOMBRE` sobre `apps` y `packages`, sin pruebas): salen
nuevas `MIGRACION_TICKETS_HABILITADA`, las nueve `RESPALDO_*` de la copia de la base y las cinco `RESPALDO_DRIVE_*`;
`DATABASE_URL` aparece sólo porque ahora la lee también el respaldo; ninguna se retira. Desde `36dc352` las únicas
nuevas son las cinco de Drive.

| Variable | Servicio | Valor inicial al publicar | Lee | Documentada |
|---|---|---|---|---|
| `MIGRACION_TICKETS_HABILITADA` | App | **Ausente** (apagada). `=== 'true'`. Se pone a `true` sólo el día del corte de F1F-01 y se quita al terminar | `packages/zoho-sync/src/config.ts:123` | `DEPLOY.md:345-361` |
| `RESPALDO_HABILITADO` | App | **Ausente** (apagado). `=== 'true'`. Se enciende tras las tareas de §6.2 | `apps/desk/server/respaldo/config.ts:31` | `DEPLOY.md:370-374` |
| `RESPALDO_HORA` | App | `3` por defecto (hora del contenedor) | `apps/desk/server/respaldo/config.ts:32` | `DEPLOY.md:378` |
| `RESPALDO_S3_ENDPOINT`, `RESPALDO_S3_REGION`, `RESPALDO_S3_BUCKET` | App | Vacías hasta contratar el proveedor | `apps/desk/server/respaldo/config.ts:33-35` | `DEPLOY.md:379-381` |
| `RESPALDO_S3_ACCESS_KEY_ID`, `RESPALDO_S3_SECRET_ACCESS_KEY` | App | Vacías; **sólo en el gestor de secretos** | `apps/desk/server/respaldo/config.ts:36-37` | `DEPLOY.md:382` |
| `RESPALDO_CLAVE_CIFRADO` | App | Vacía; 32 bytes en base64, en el gestor **y además fuera de él** | `apps/desk/server/respaldo/config.ts:38` | `DEPLOY.md:383` |
| `RESPALDO_AVISO_EMAIL` | App | Vacía; el correo del responsable | `apps/desk/server/respaldo/config.ts:39` | `DEPLOY.md:384` |
| **`RESPALDO_DRIVE_HABILITADO`** | App | **Ausente** (apagado). `=== 'true'`. No depende de `RESPALDO_HABILITADO` | `apps/desk/server/respaldo/configDrive.ts:31` | `DEPLOY.md:426-430` |
| **`RESPALDO_DRIVE_DIA`** | App | `0` por defecto (domingo) | `apps/desk/server/respaldo/configDrive.ts:32` | `DEPLOY.md:436` |
| **`RESPALDO_DRIVE_HORA`** | App | `5` por defecto (hora del contenedor) | `apps/desk/server/respaldo/configDrive.ts:33` | `DEPLOY.md:437` |
| **`RESPALDO_DRIVE_CREDENCIAL`** | App | Vacía; JSON de la cuenta de servicio en base64, **sólo en el gestor de secretos** | `apps/desk/server/respaldo/configDrive.ts:34` | `DEPLOY.md:434` |
| **`RESPALDO_DRIVE_CARPETA_ID`** | App | Vacía; id de la carpeta raíz | `apps/desk/server/respaldo/configDrive.ts:35` | `DEPLOY.md:435` |
| `DB_SCHEMA` (**no es nueva**) | App **y** worker | **`desk`** en los dos, con el mismo valor. Ausente vale `public` | `packages/zoho-sync/src/config.ts:87` | `DEPLOY.md:310-343` |

**El fichero de ejemplo de entorno.** Ninguna sesión lo lee (`DEPLOY.md:335-336`). Las líneas que hay que añadirle a
mano están en `DEPLOY.md:339-343` (`DB_SCHEMA`), `DEPLOY.md:358-361` (`MIGRACION_TICKETS_HABILITADA`),
`DEPLOY.md:388-399` (respaldo) y `DEPLOY.md:442-449` (Drive). Tarea de persona (§6.2). Que hoy no estén es
**hipótesis 5**.

**Las que no son nuevas pero el corte obliga a mirar:** `SWEEP_ENABLED` y `SWEEP_DRY_RUN` en el worker (§0 h);
`N8N_AVISOS_WEBHOOK_URL`, que lleva los correos de aviso —también el de la reasignación y el de fallo de las copias—,
y `AVISOS_COPIA_EMAIL`, que recibe copia si tiene valor; y `SYNC_INTERVAL_MS`, que desde este despliegue marca además
la cadencia de la pasada de provisionales (`packages/zoho-sync/src/config.ts:88`). Sus valores en producción son
**hipótesis 6**.

---

## 4 · Procedimiento

### 4.1 · Copia

§0 (a). Manual para este corte.

### 4.2 · Publicar

`DEPLOY.md` cubre el mecanismo: App en `DEPLOY.md:177-180`, worker en `DEPLOY.md:186-205`.

- **Publicar `473665b` entero**, no un commit intermedio (§7).
- **La imagen cambia respecto de `ae5aaf4`**: `RUN apk add --no-cache postgresql-client` (`Dockerfile:34`). App y
  worker usan **la misma imagen** (`Dockerfile:27-29`). Que construya en EasyPanel es **hipótesis 7**.
- **Orden:** copia comprobada → paso 1 de F1C-09 → Deploy de la App → §4.5 sobre `desk` y log del primer ciclo →
  paso 2 de F1C-09 y recuento → cargos → Top 5 → worker → bloque 2 de §4.5 sobre `zoho-hub` y su log.
- **App y worker no tienen que publicarse a la vez por el esquema:** cada uno migra su base y `tickets` no se replica.
  *Hipótesis 3:* que el worker escriba sólo en `zoho-hub` y la App sólo en `desk`, como dice `DEPLOY.md:33-36`.

### 4.3 · Comprobar que producción está en el commit publicado

1. Referencia local de `473665b`, construida el 2026-10-09 dos veces, con la salida fuera del repositorio:
   **`index-Tl4V5akM.js`, 408.060 bytes, sha256 `61e8c639a79bc4098d2c74ecd6fe90b8673a2a45709be940cd0b0c6d9f783cdf`**,
   iguales las dos veces.
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver qué `index-*.js` carga, descargarlo y
   calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `473665b` en el cliente.** Antes de publicar, la misma lectura dice desde
   dónde se parte.

*Límites:* construido en Windows con `vite build`, sin el `tsc -b` de `npm run build`; producción construye en
`node:22-alpine`. Que den los mismos bytes es **hipótesis 8**. Y el bundle sólo prueba el cliente.

### 4.4 · El log del primer ciclo — tras cada arranque

En el log de la App y en el del worker, buscar tres cadenas:

- `migrate: sentencia omitida` (`packages/zoho-sync/src/db/migrate.ts:33`): una sentencia del esquema no entró.
- `persistTicket(` seguido de `falló:` (`packages/zoho-sync/src/sync.ts:132`): el sincronizador no escribe (§0 i).
- `el ciclo cae a la página 1 por -recentThread` (`packages/zoho-sync/src/sync.ts:405`): falta el permiso de
  búsqueda (§0 g). No es motivo de reversión.

Y, sólo en la App: `pasadaProvisionalesEnBooks falló` (`apps/desk/server/services/avisoProvisionalEnBooks.ts:110`).

### 4.5 · Que la migración entró — obligatorio, justo tras cada arranque

**No se ha ejecutado** (hipótesis 10). Sólo lectura.

**Bloque 1, base `desk`, tras el Deploy de la App:**

```sql
BEGIN READ ONLY;

SELECT to_regclass('public.calendario_cierres')         AS cierres,
       to_regclass('public.equipos_cambios')            AS cambios,
       to_regclass('public.ov_asociaciones')            AS asociaciones,
       to_regclass('public.contratos')                  AS contratos,
       to_regclass('public.alarmas_avisadas')           AS alarmas_avisadas,
       to_regclass('public.alarmas_corte')              AS alarmas_corte,
       to_regclass('public.cliente_prioridad')          AS cliente_prioridad,
       to_regclass('public.prioridad_ajustes')          AS prioridad_ajustes,
       to_regclass('public.gases_patron')               AS gases_patron,
       to_regclass('public.certificados_fabrica')       AS certificados_fabrica,
       to_regclass('public.clientes_provisionales')     AS clientes_provisionales,
       to_regclass('public.catalogo_novedades')         AS catalogo_novedades,
       to_regclass('public.garantia_proveedor')         AS garantia_proveedor,
       to_regclass('public.reasignaciones')             AS reasignaciones,
       to_regclass('public.contrato_ampliaciones')      AS contrato_ampliaciones,
       to_regclass('public.encuesta_respuestas')        AS encuesta_respuestas,
       to_regclass('public.nit_exentos')                AS nit_exentos,
       to_regclass('public.provisional_books_avisados') AS provisional_books_avisados;
-- Deben salir los DIECIOCHO nombres, ninguno NULL.
-- Falta nit_exentos: toda alta con cliente manual da 500. Revertir o crear la tabla (§0 j).
-- Falta reasignaciones: no se lee el historial de ningún ticket. Revertir.
-- Falta cliente_prioridad: no se crea ningún ticket. Revertir.
-- Falta garantia_proveedor: falla el panel de garantía de cada ticket. Revertir.
-- Falta contrato_ampliaciones: no se abre la ficha de ningún contrato. Revertir.
-- Falta encuesta_respuestas: /api/indicadores falla entero. Revertir.

SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'),  ('desk','tickets','ov_zoho_avisada'),
        ('desk','tickets','modalidad'),             ('desk','tickets','prioridad_en_app_at'),
        ('desk','tickets','liberacion_motivo'),     ('desk','tickets','fecha_prevista_facturacion'),
        ('desk','equipos','fecha_adquisicion'),     ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),          ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),         ('desk','equipos','drive_url'),
        ('desk','equipos','compuesto'),             ('desk','equipos','pendiente_validar'),
        ('public','catalogo_modelos','compuesto'),  ('public','users','cargo_permiso'),
        ('public','prioridad_ajustes','origen'),
        ('public','remisiones','hay_novedad'),
        ('public','remisiones','novedades'),        ('public','remisiones','novedad_otro'),
        ('public','remisiones','rotulado_at'),      ('public','remisiones','rotulado_por'),
        ('public','remision_fotos','categoria'),    ('public','remision_fotos','novedad'),
        ('public','remisiones','restaurada_at'),    ('public','remisiones','restaurada_por'),
        ('public','remisiones','anulacion_previa_at'), ('public','remisiones','anulacion_previa_por'))
 ORDER BY 1, 2, 3;
-- Deben salir 29 filas, todas con is_nullable = YES y column_default vacío.
-- Falta cargo_permiso: NADIE entra. Revertir ya.
-- Falta una de las tres de tickets del bloque 2: sincronizador roto. Revertir ya.
-- Falta una de public.remisiones o public.remision_fotos: no se crean, envían ni restauran remisiones. Revertir.
-- Falta liberacion_motivo o fecha_prevista_facturacion: ninguna «Liberación sin factura». Revertir.
-- Falta origen: no se guarda la prioridad de ningún cliente. Revertir.
-- Falta compuesto o pendiente_validar de equipos: no se lee ningún equipo. Revertir.

SELECT is_nullable FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'prioridad_ajustes' AND column_name = 'a';
-- Debe salir YES (sentencia 55).

SELECT count(*) AS indices FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente',
                     'idx_prioridad_ajustes_ticket', 'idx_gases_patron_cilindro', 'idx_certificados_fabrica_ticket',
                     'idx_garantia_proveedor_asociacion', 'idx_garantia_proveedor_ticket',
                     'idx_reasignaciones_ticket', 'idx_contrato_ampliaciones_contrato',
                     'idx_encuesta_respuestas_ticket');
-- Debe salir 14.

SELECT count(*) AS novedades, count(*) FILTER (WHERE activo) AS activas FROM public.catalogo_novedades;
-- Deben salir 11 y 11 justo tras el primer Deploy.

SELECT clave, orden, activo, exige_texto FROM public.catalogo_novedades WHERE clave = 'accesorio_fuera_de_lista';
-- Una fila: orden 65, activo = true, exige_texto = true.

SELECT nit, motivo, activo FROM public.nit_exentos ORDER BY nit;
-- Una fila activa: 222222222222, «Consumidor final». Si falta, insertarla con la sentencia 73.

SELECT (SELECT count(*) FROM public.cliente_prioridad)                           AS filas_top5,
       (SELECT count(*) FROM public.users WHERE cargo_permiso IS NOT NULL)       AS usuarios_con_cargo,
       (SELECT count(*) FROM desk.tickets WHERE prioridad_en_app_at IS NOT NULL) AS tickets_prioridad_en_app,
       (SELECT count(*) FROM public.remisiones WHERE restaurada_at IS NOT NULL)  AS remisiones_restauradas,
       (SELECT count(*) FROM public.clientes_provisionales)                      AS provisionales,
       (SELECT count(*) FROM public.provisional_books_avisados)                  AS parejas_avisadas,
       (SELECT count(*) FROM public.garantia_proveedor)                          AS fichas_garantia,
       (SELECT count(*) FROM public.reasignaciones)                              AS reasignaciones,
       (SELECT count(*) FROM public.contrato_ampliaciones)                       AS ampliaciones,
       (SELECT count(*) FROM public.encuesta_respuestas)                         AS respuestas_encuesta;
-- Justo tras el Deploy, las diez a 0. Si filas_top5 no es 0, hay Top 5 marcados antes: volver a guardarlos (§6.5).
-- Si provisionales no es 0, ver §0 (e) antes de que pasen tres minutos.

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después; 1 tras la primera pasada (unos 3 minutos). Anotar el corte.

SELECT (SELECT count(*) FROM desk.tickets) AS tickets, (SELECT count(*) FROM desk.equipos) AS equipos;
-- Dato que pide F1B-08: anotar y devolver al panel.

ROLLBACK;
```

**Bloque 2, «Sincronizador» — DOS veces: en `desk` tras la App y en `zoho-hub` tras el worker.** No nombra el
esquema a propósito: en qué esquema vive `tickets` dentro de `zoho-hub` es hipótesis 3.

```sql
BEGIN READ ONLY;
SELECT current_database() AS base, table_schema, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'tickets'
   AND column_name IN ('prioridad_en_app_at', 'ov_elegida_en_app_at', 'ov_zoho_avisada')
 ORDER BY table_schema, column_name;
-- TRES filas del mismo table_schema. Si falta una: ese sincronizador está roto. Revertir ESE servicio (§4.6).
-- Sin ninguna fila y con la tabla existente: comprobar el rol; information_schema sólo enseña lo que el rol ve.
ROLLBACK;
```

**Bloque 3, sólo si `to_regclass('public.prioridad_ajustes')` no era `NULL` ANTES del Deploy (§0 f).** Tickets venidos
de Zoho con un ajuste manual de prioridad que hoy no reciben nada de Zoho:

```sql
BEGIN READ ONLY;
SELECT t.id, t.number, t.status, t.priority, t.source, t.prioridad_en_app_at,
       MIN(a.ajustado_at) AS primer_ajuste,
       COUNT(*)           AS ajustes_manuales,
       EXISTS (SELECT 1 FROM desk.ticket_transitions x WHERE x.ticket_id = t.id) AS con_transiciones_en_la_app
  FROM desk.tickets t
  JOIN public.prioridad_ajustes a ON a.ticket_id = t.id
 WHERE a.origen IS NULL
   AND t.managed_by_app = true
   AND t.id NOT LIKE 'app-%'
 GROUP BY t.id, t.number, t.status, t.priority, t.source, t.prioridad_en_app_at
 ORDER BY primer_ajuste;
ROLLBACK;
```

`origen IS NULL` es lo que cuenta como ajuste manual (`packages/shared/src/prioridadPropagada.ts:24-26`). Si
`con_transiciones_en_la_app` es falsa, lo único que congeló el ticket fue el ajuste: ésos son los afectados. Lee
`prioridad_en_app_at` y `origen`, así que sólo corre **después** del Deploy; antes, basta el `to_regclass`.

**Bloque 4, sin prisa, para contabilidad (F1B-19).** NIT repetidos en Books por su base normalizada; se ejecuta
sobre la base donde viva `books.contacts` y el resultado se entrega a contabilidad
(`openspec/changes/archive/2026-10-08-nit-exentos-aviso-provisional/proposal.md:179-189`):

```sql
BEGIN READ ONLY;
SELECT regexp_replace(split_part(nit, '-', 1), '[^0-9]', '', 'g') AS nit_base,
       count(*)                                                   AS contactos,
       string_agg(contact_name, ' | ' ORDER BY contact_name)      AS nombres
  FROM books.contacts
 WHERE regexp_replace(split_part(coalesce(nit, ''), '-', 1), '[^0-9]', '', 'g') <> ''
 GROUP BY 1
HAVING count(*) > 1
 ORDER BY contactos DESC, nit_base;
ROLLBACK;
```

**Y que F1C-09 entró:** su recuento posterior, con el grupo 1 a 0 (§0 b).

### 4.6 · Reversión

**Volver atrás = redesplegar el commit anterior, por servicio.** Si producción estaba en `ae5aaf4`, es `ae5aaf4`. La
base no se toca: las 29 columnas nuevas son anulables y sin `DEFAULT`, las tablas nuevas no las nombra el código viejo
y el `NOT NULL` retirado es de una tabla que `ae5aaf4` no conoce. Si lo que falla es el bloque 2 sobre `zoho-hub`, se
revierte el worker, no la App.

**Lo que la reversión NO deshace:**

- Pagos borrados por el barrido (§0 h).
- La migración de F1C-09 ya ejecutada: tiene su propia reversión comentada
  (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`).
- Las prioridades propagadas por el Top 5 y las ajustadas a mano: tras revertir, el sincronizador vuelve a escribir la
  de Zoho sobre los tickets que no sean `managed_by_app`.
- Las reasignaciones, las ampliaciones de contrato y las respuestas de garantía ya escritas: los datos se quedan. Una
  fecha de contrato ampliada **sigue ampliada**; restaurarla es manual (`DEPLOY.md:588-590`).
- Los avisos de bandeja ya creados.
- Los tickets liberados por la vía nueva se quedan sin la casilla marcada.

**No son motivo de reversión:** el 422 de la guarda de F1B-03; el 403 de asociar una OVI sin el cargo y el 422 de
«Garantía sólo con OVI»; los 422 del formulario de recepción, de la liberación y de la búsqueda; el 403 de
`/api/indicadores` a quien no es administrador; el 403 de la migración de F1F-01 y el de las copias mientras sus
interruptores estén apagados; la línea de caída de la búsqueda de Zoho (§0 g); y un ticket que **baja** de prioridad
al marcar su cliente Top 5 (E-190).

---

## 5 · Cambios de comportamiento y riesgos

**Hasta `36dc352`**, lo que ya describía el consolidado anterior, que no cambia: la tabla de comportamiento, la de
rutas y la de la regla 13 de `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:857-935`, los riesgos R39 a R51 de
`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:956-1032` y los R52 a R55 de
`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:575-586`. Dos cosas de aquello **cambian con este rango**: el alta ya
no admite prioridad pedida y «baja» no es asignable (pieza de prioridad, abajo), y el proveedor de las copias ya está
decidido —Backblaze B2, con bloqueo contra borrado (`openspec/config.yaml:3911-3919`)—, aunque `DEPLOY.md:423-424` lo
siga dando por pendiente.

**Desde `36dc352`:**

| Pieza | Qué hace | Ruta:línea |
|---|---|---|
| F1B-03, OVI | Dos guardas en las cuatro entradas de una orden (alta, dos transiciones con orden y remisión de entrada): `403` si entra una OVI sin el cargo Director Técnico; `422` si a un ticket de tipo exactamente `Garantía` le entra una orden que no es OVI. Es OVI todo número que empiece por `OVI-` | `packages/shared/src/ordenOVI.ts:54-64`, `packages/shared/src/subOV.ts:63-67`, `apps/desk/server/services/guardasOVI.ts:15-18` |
| F1B-13, ficha | Cuatro rutas. Leer, cualquier sesión; responder, editar y avanzar, el cargo o un administrador. Segunda respuesta, `409`. Aviso diario de bandeja a los 60 días naturales desde la respuesta «sí» | `apps/desk/server/routes/garantiaProveedor.ts:31-36`, `apps/desk/server/routes/garantiaProveedor.ts:55`, `apps/desk/server/services/avisoReclamacionProveedor.ts:72-79` |
| F1B-05, reasignación | `POST /api/tickets/:id/reasignar`: 404 → 403 → 422 → 409. Cambia sólo `derivado_a`, con traza en la misma transacción y aviso por correo con copia al destino | `apps/desk/server/routes/reasignacion.ts:23-42`, `apps/desk/server/db/reasignaciones.ts:33-36`, `apps/desk/server/services/avisoReasignacion.ts:36-39` |
| F1B-04, accesorios | `POST /api/catalogo/modelos/:id/accesorios` para el Director Técnico de Servicio Técnico; un accesorio sin artículo de Books ya no se puede dar de alta ni convertir, y la copia entre modelos los omite. Los que ya existían se conservan | `apps/desk/server/routes/accesoriosModelo.ts:22-33`, `apps/desk/server/routes/catalogo.ts:220`, `apps/desk/server/routes/catalogo.ts:294`, `apps/desk/server/db/catalogoArticulos.ts:166` |
| F1B-11, ampliación | `POST /api/contratos/:id/ampliar`, área Comercial: fecha posterior a la vigente y no más allá del 31/12 del año del vencimiento; motivo obligatorio; caben varias. No reinicia la marca del aviso de ritmo | `apps/desk/server/routes/contratos.ts:74-87`, `packages/shared/src/contratos.ts:266-270`, `packages/shared/src/contratos.ts:287-288`, `apps/desk/server/db/contratos.ts:133` |
| F1F-05, 51 y 55 | `POST /api/indicadores/encuesta`, sólo administrador, sin pantalla: carga un CSV de respuestas; filas inválidas se rechazan una a una. El 51 sale de la última transición de entrega. **El formato del fichero es un supuesto sin validar** | `apps/desk/server/routes/encuestaRespuestas.ts:19-26`, `apps/desk/server/encuesta/analizarRespuestas.ts:1-2`, `packages/shared/src/indicadores.ts:257-261` |
| F1B-07, prioridad | Tres niveles al nacer: alta con contrato vigente, la del Top 5, media el resto; el servidor ignora la pedida. Ajuste por ticket para el Director Comercial, un administrador o el Director Técnico, en cualquier ticket. El ajuste marca sólo la prioridad | `packages/shared/src/contratos.ts:66-69`, `apps/desk/server/routes/prioridad.ts:62-77`, `apps/desk/server/db/prioridadCliente.ts:93` |
| F1B-08, columnas | Dos columnas nuevas en el tablero por estado; `Otros` queda para `Finalizado` y desconocidos | `packages/shared/src/columns.ts:15`, `packages/shared/src/columns.ts:20` |
| F1B-19, NIT | Un NIT de `public.nit_exentos` no consulta Books en el alta manual. Pasada periódica de avisos, una vez por pareja | `apps/desk/server/services/ticketService.ts:96`, `apps/desk/server/services/avisoProvisionalEnBooks.ts:106-112` |
| Sincronizador | `syncRecent` pide a `/tickets/search` lo modificado desde la marca menos 15 minutos y relee el detalle de cada ticket; hasta 1.000 por ciclo. Si falla, la página reciente de antes | `packages/zoho-sync/src/sync.ts:377-407`, `packages/zoho-sync/src/sync.ts:415` |
| F1F-02, Drive | Con su interruptor: copia semanal cifrada de una carpeta de Drive, sin disco, incremental, con retención de 12 meses. Apagada no hace nada | `apps/desk/server/index.ts:111-118`, `apps/desk/server/respaldo/copiaDrive.ts:102` |
| F1B-09, mapa | Nada en ejecución: un guion y dos documentos generados | `packages/shared/src/mapaPorFlujo.ts:25-51` |

**Riesgos nuevos** (numeración que sigue a la del consolidado anterior):

- **R56 · Quién puede reasignar no es lo que dice el maestro.** El código deja reasignar a cualquier persona del área
  de alguna transición saliente, o a un administrador, sin mirar cargo ni si es la persona a cargo; el maestro dice
  «la persona a cargo y el Director o el Coordinador del área», entre técnicos de la misma área
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`). Y el destino puede ser cualquier
  persona activa (`apps/desk/server/routes/reasignacion.ts:34-35`). Está en la lista de Gerencia.
- **R57 · Si falla el alta del aviso, la reasignación queda hecha y la respuesta es `500`**
  (`apps/desk/server/routes/reasignacion.ts:41`): quien reintente recibe `422` «ya está a cargo de esa persona» y el
  destino queda sin aviso.
- **R58 · El formato del fichero de la encuesta no se ha probado con una exportación real.** Si el formulario no
  recoge el número de ticket, todas las filas se rechazan
  (`openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:51-52`). La tabla no tiene borrado: una
  carga equivocada sólo se deshace a mano (`DEPLOY.md:627-628`).
- **R59 · Con marca de agua, el ciclo ya no relee la página por conversación reciente.** Si una conversación nueva en
  Zoho no actualizase la fecha de modificación del ticket, dejaría de refrescarse por esta vía (hipótesis 24). Y cada
  ciclo cuesta al menos una búsqueda y un detalle en cada proceso, aun con Zoho quieto (hipótesis 25, la cuota).
- **R60 · Un ticket de «Garantía» venido de Zoho con otra grafía en el tipo de servicio no activa la guarda**
  (`packages/shared/src/ordenOVI.ts:62`), y los que ya tienen una orden de cobro no se revisan: no hay relleno.
- **R61 · Un contrato que vence el 31/12, o que venció en un año anterior, no se puede ampliar**
  (`packages/shared/src/contratos.ts:267-270`).
- **R62 · `instanteDeJornada` devuelve el día anterior para las horas 0 a 4**
  (`packages/shared/src/calendarioLaboral.ts:155`). Leído, no ejecutado: hoy no afecta a ningún llamador, porque
  usan el inicio y el fin de jornada (`packages/shared/src/calendarioLaboral.ts:181-182`). Sigue abierto
  (`openspec/changes/archive/2026-10-07-indicadores-51-55/archive-report.md:129-132`).
- **R63 · La bandeja de avisos enseña 50 como máximo** (`apps/desk/server/db/avisos.ts:26`): una ráfaga mayor (§0 e)
  taparía avisos anteriores.
- **R64 · El último cambio de producción de la prioridad no pasó por un verify entero.** El veredicto es sobre
  `e47a3a0`, y `a220757` cambió después la sentencia del ajuste; se cubrió con seis mutaciones y los cuatro códigos
  (`openspec/changes/archive/2026-10-08-prioridad-tres-niveles/archive-report.md:50`).

---

## 6 · Tareas de persona — por dueño y en orden de ejecución

Todas las tareas de persona de los cambios archivados del rango que no tienen resultado. **Archivar no las dio por
hechas** (regla del ciclo 1 de `CLAUDE.md`). Una tarea se nombra con su cambio, porque las P.n chocan. Donde el paso a
paso es largo y no ha cambiado, se remite a él con ruta y línea; la tarea, su dueño y su orden están aquí.

### 6.0 · La lista entera, en orden

| # | Cuándo | Dueño | Tarea (con su cambio) | Desbloquea |
|---|---|---|---|---|
| 1 | **Antes — PARADA** | Gerencia (con Servicio Técnico) | **Confirmar E-158** | Publicar (§0 c) |
| 2 | **Antes — PARADA** | Gerencia / Alfonso | **Los dos recuentos de F1B-03** en producción, y con ellos leer **E-185** | Publicar (§0 c) |
| 3 | **Antes — PARADA** | Persona con acceso a producción | **Las dos lecturas `to_regclass`** de §0 (e) y (f) | Saber si hay ráfaga o tickets congelados |
| 4 | **Antes — PARADA** | Gerencia | **S-4 de F1B-19**, sólo si la tarea 3 encuentra provisionales | Publicar con o sin corte de la ráfaga |
| 5 | **Antes — PARADA** | Gerencia y un administrador | **La lista de cargos y quién la asigna** (P.1 de `permisos-por-cargo`, P-3 de `ficha-garantia-proveedor`, la de `ovi-garantia-por-cargo`); aceptar por escrito el intervalo | Que el hueco dure minutos (§0 d) |
| 6 | **Antes — PARADA** | Quien administra el despliegue | **Los tres interruptores ausentes** en el servicio App | §0 (k) |
| 7 | **Antes** | Quien administra el despliegue | **`DB_SCHEMA=desk`** en App y worker | Que las `ALTER` sin calificar aterricen en `desk` |
| 8 | **Antes** | Alfonso (o quien administre EasyPanel) | **`SWEEP_ENABLED` y `SWEEP_DRY_RUN`** del worker | Saber si el worker borrará pagos (§0 h) |
| 9 | **Antes** | Alfonso | **Paso 1 de F1C-09** | La migración del corte |
| 10 | **Antes** | Persona con acceso a producción | **P-1 de `accesorios-lista-por-modelo`**: la consulta de modelos sin accesorios; y con el resultado, **P-2**, el Director Técnico completa las listas vacías tras el Deploy | Que el técnico tenga casillas que marcar |
| 11 | **Antes** | Administrador de la aplicación | **E-162 (b)**: el cargo de firma del Director Técnico escrito «Director Técnico» | Que la derivación de F1C-11 proponga a alguien |
| 12 | **Antes — PARADA de F1B-04** | Servicio Técnico | **E-170 (1)**: confirmar la lista de novedades (hoy once, con «Accesorio fuera de lista») | Lo que ve el técnico desde el primer minuto |
| 13 | **Antes — PARADA de F1B-04** | Quien administra n8n | **E-170 (2)**: la etiqueta lleva el código del ticket | Que «Rotulado y guardado» signifique algo |
| 14 | **Antes** | Alfonso | **P-1 de `continuidad-indicadores`**; **P.3 de `verificacion-gas-patron-certificado`** (recuentos) y avisar a Servicio Técnico y Calidad | Lo que dice cada una |
| 15 | **Antes** | Alfonso | P.1 de `blueprint-soporte-remoto`; P.1 de `alarmas-horas-habiles`; preparar el paso 6 de P.2 de `alarmas-horas-habiles`; P.1 y P.4 de F1B-11 (recomendado); mirar `AVISOS_COPIA_EMAIL` y `N8N_AVISOS_WEBHOOK_URL` (recomendado) | Lo que dice cada una |
| 16 | **Antes** | Quien tenga la consola de producción | **Lectura de E-206**: `jsonb_typeof(custom_fields)` | Cerrar E-206 |
| 17 | **Antes** (recomendado) | Director Comercial | Preparar la lista Top 5 fuera de la aplicación, con prioridad «alta» o «media» | Que marcarla sea teclear |
| 18 | **Antes** | Quien publica | Bundle de producción (§4.3) | Saber desde dónde se publica |
| 19 | **Antes — PARADA** | Alfonso | **Copia manual de `desk` y comprobar que existe** | El Deploy (§0 a) |
| 20 | **Corte** | Quien publica | **Deploy de la App; §4.5 entero sobre `desk`; log del primer ciclo (§4.4)** | Seguir o revertir |
| 21 | **Corte** | Alfonso | **Paso 2 de F1C-09 y recuento posterior**; paso 6 de P.2 de `alarmas-horas-habiles` | Que ningún ticket quede sin botones |
| 22 | **Corte, lo primero tras 20 y 21** | Administrador de la aplicación | **Asignar los cargos**: Director Comercial, **Director Técnico**, «Especialista técnico» a Johny Luna (E-162 a) | Comercial recupera la liberación; hay quien asocie OVI, responda fichas y mantenga listas |
| 23 | **Corte, tras 22** | Director Comercial | **P.1 de `prioridad-top5-cliente`**; si `filas_top5` no era 0, volver a guardar esos clientes; **P-2 de `prioridad-tres-niveles`**: volver a guardar con alta o media cada Top 5 que tuviera «baja» | El Top 5 propagado |
| 24 | **Corte** | Quien publica | **Redespliegue del worker**, bloque 2 de §4.5 sobre `zoho-hub` y su log | Que el sincronizador del hub no esté roto |
| 25 | **Corte** | Quien publica | Devolver el tamaño de `desk.tickets` y `desk.equipos` | Dato de F1B-08 |
| 26 | **Después** | Persona con acceso a producción | **P-1 de `prioridad-tres-niveles`**: los tres `SELECT` de prioridades (`docs/sdd/Paquete_de_Despliegue_2026-10-08.md:106-121`); bloque 3 de §4.5 si procede; bloque 4 para contabilidad | Saber qué Top 5 dejan de imponer; la lista de contabilidad |
| 27 | **Después** | Alfonso / Servicio Técnico | Verificación en la aplicación de F1C-09 | Verificación de F1C-09 |
| 28 | **Después**, cuando llegue el dato | Alfonso, con el Director Técnico | **P.2 de `verificacion-gas-patron-certificado`** (siembra) | La guarda de Verificación |
| 29 | **Después, antes del 24/12** | Alfonso | `INSERT` de los cierres de fin de año (F1B-12) | Que las alarmas no cuenten esos días |
| 30 | **Después** | Comercial | P.7 y P.6 de `registro-contrato`; **P.8 de `ampliacion-contrato`**: ampliar un contrato real y comprobar traza, desbloqueo y rechazo fuera del tope; P.3 de `parche-iv11-orden-venta`; P.3 de `asociacion-ov-ticket`; P.2 de `permisos-por-cargo`; F1B-15 (cuatro); F1C-10; RQ-HV-12 y `hojas-vida` | Verificaciones de esas tandas |
| 31 | **Después** | Comercial y Servicio Técnico | Las siete de F1B-07 (Top 5) y **P-6 de `prioridad-tres-niveles`** | Verificación de F1B-07 |
| 32 | **Después, en la primera liberación real** | Gerencia o quien opere con cargo Director Comercial | **Las cinco de F1C-05** | Verificación de F1C-05 |
| 33 | **Después** | El analista | **P-1 de `reasignacion-con-motivo`** (panel, aviso y línea del historial); **P-5 de `accesorios-lista-por-modelo`** (formulario, panel y novedad); la comprobación visual de las dos columnas nuevas; mirar los dos diagramas nuevos del mapa | Verificaciones de esas tandas |
| 34 | **Después** | Quien verifica en la aplicación | Caso sin salida de F1B-03; F1B-03 (Comercial); F1B-08 (seis escenarios); F1B-05 (anular y restaurar una remisión) | Verificaciones de esas tandas |
| 35 | **Después** | Servicio Técnico y Calidad | **E-170 (3)** (nueve pasos); P.4 de `verificacion-gas-patron-certificado`; la lista de novedades desde Configuración | Verificaciones de F1B-04 y F1A-03 |
| 36 | **Después** | Administrador | P-4 de `continuidad-indicadores`; verificación de F1C-11 | Verificaciones |
| 37 | **Después** | Gerencia, con acceso a producción | **P-1 de `ficha-garantia-proveedor`**: si las líneas de una OVI traen costo en Books y en qué moneda | El valor reclamado automático |
| 38 | **Después**, contratado el proveedor | Ver §6.2 | **Encendido de las copias** (base y Drive) | Las copias automáticas |
| 39 | **Después**, el día que fije Gerencia | Ver §6.2 | **Migración de tickets abiertos de F1F-01**, con su interruptor | La migración |
| 40 | **Antes de la primera carga real** | Comercial | **P-1 de `indicadores-51-55`**: una muestra real de la exportación del formulario de la encuesta | Validar el analizador |
| 41 | **Enero de 2027** | Administrador | **P-2 de `indicadores-51-55`**: cargar las respuestas reales | El indicador 55 |
| 42 | **Desde el 16/11** | Gerencia, con Servicio Técnico y Comercial | **P-3 de `continuidad-indicadores`** | Dar los nueve indicadores por buenos |
| 43 | Sin fecha; no bloquea | Contabilidad | Decidir qué NIT repetidos de Books son genéricos (con el bloque 4) | Ampliar `public.nit_exentos` por SQL (`DEPLOY.md:651-654`) |
| 44 | Sin orden | Gerencia | Las decisiones de §6.4 | Lo que dice cada una |

### 6.1 · Alfonso (Gerencia) y quien administra el despliegue

**Antes, en este orden: 2, 3, 6, 7, 8, 9, 10, 14, 15, 16 y 19.** Paso a paso:

- **Los dos recuentos de F1B-03 (tarea 2).** Conectarse a `desk` como siempre —**sin pegar la cadena de conexión
  ni la contraseña en ningún chat, captura ni documento**—, ejecutar enteros los dos ficheros de §0 (c) y devolver: de
  la primera, el total de `sin_remision_vigente` y, aparte, las filas de «Equipo nuevo» y las de `Remisión creada`
  (esta última es E-185, `docs/sdd/ENTRADA.md:1921`, informativa); de la segunda, `llegaron` y
  `sin_remision_al_llegar` (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:68-75`).
- **Las dos lecturas (tarea 3).** En `desk`, sólo lectura:
  `SELECT to_regclass('public.clientes_provisionales'), to_regclass('public.prioridad_ajustes');`. Devolver «las dos
  NULL» o qué tabla existe.
- **Variables (tareas 6, 7 y 8).** En EasyPanel, pestaña de variables de cada servicio. **Mirar sólo si existen y
  qué valor tienen; no copiar ningún valor a ningún sitio.** Devolver: App — `MIGRACION_TICKETS_HABILITADA`,
  `RESPALDO_HABILITADO` y `RESPALDO_DRIVE_HABILITADO` «ausente» o «presente» (si alguna está presente, **quitarla
  antes de publicar**), `DB_SCHEMA` «desk» u «otra cosa»; worker — `DB_SCHEMA`, y `SWEEP_*` como «activo y borrando»,
  «activo en simulacro» o «apagado». Si `DB_SCHEMA` no vale `desk` en alguno, **no publicar** y consultar:
  `DEPLOY.md:324-329` dice qué se rompe.
- **F1C-09 (tareas 9 y 21):** `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:657-668`. Si una clasificación de la
  tercera consulta del paso 1 no se reconoce, parar y consultar.
- **Modelos sin accesorios (tarea 10):** ejecutar el fichero entero; devolver la lista de modelos de la primera
  consulta y el recuento de la segunda.
- **P-1 de F1F-05 (tarea 14):** el bloque de `DEPLOY.md:276-298`; devolver si aparecen, y dónde, los nombres de los
  nueve indicadores y de la satisfacción. **P.3 de F1A-03:** `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:680-683`.
- **Tarea 15:** `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1264-1408`.
- **E-206 (tarea 16):** en sólo lectura, `SELECT jsonb_typeof(custom_fields) AS forma, count(*) FROM desk.tickets
  GROUP BY 1;`. Se espera una sola fila, `object` (`docs/sdd/ENTRADA.md:2037-2038`). No condiciona el despliegue.
- **Copia (tarea 19):** §0 (a).

**Después (tareas 27 a 29):** verificación de F1C-09 en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:670-678`;
siembra en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:697-718`; cierres en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1550-1567`.

### 6.2 · Las tareas posteriores con interruptor: las copias y la migración de F1F-01

**Encendido de las copias (F1F-02).** Ninguna sesión las hace; ninguna copia se ha lanzado contra producción. El
proveedor está decidido: **Backblaze B2, con bloqueo contra borrado**; Gerencia comprueba precio y medio de pago al
contratar (`openspec/config.yaml:3917`).

| Paso | Dueño | Qué |
|---|---|---|
| 1 | **Gerencia** — **cuesta dinero** | Contratar Backblaze B2 |
| 2 | La persona con acceso al proveedor | Crear el almacenamiento **versionado** y con bloqueo de borrado; reglas por prefijo: `diaria/` 7 días, `semanal/` 28, `mensual/` 365; `previa/`, a decidir (`DEPLOY.md:401-404`); para Drive, bloqueo de 12 meses y la regla `AbortIncompleteMultipartUpload` (`DEPLOY.md:462-468`) |
| 3 | La persona que publica | Guardar credenciales y `RESPALDO_CLAVE_CIFRADO` (`openssl rand -base64 32`) en el gestor de secretos, la clave **además fuera de él**, y añadir las líneas al fichero de ejemplo (`DEPLOY.md:388-399`, `DEPLOY.md:442-449`) |
| 4 | La persona con acceso a producción | `SELECT version();` en el servidor frente a `pg_dump --version` en la imagen publicada: la de `pg_dump`, igual o mayor |
| 5 | La persona con acceso a producción | `RESPALDO_HABILITADO=true` y redesplegar la App |
| 6 | La persona con acceso a producción | Primera copia: con sesión de administrador, `fetch('/api/admin/respaldo', { method: 'POST' })` desde la consola del navegador; responde `202` y el objeto aparece bajo `previa/` (`DEPLOY.md:406-407`) |
| 7 | La persona con acceso a producción | Primera restauración en una base **aparte**, nunca sobre `desk` (`DEPLOY.md:409-411`) |
| 8 | La persona con acceso a Google | Crear la cuenta de servicio con **lectura** de la carpeta de Drive y guardar su credencial en el gestor de secretos (`DEPLOY.md:462-463`) |
| 9 | La persona con acceso a producción | `RESPALDO_DRIVE_HABILITADO=true`, con `RESPALDO_DRIVE_CREDENCIAL` y `RESPALDO_DRIVE_CARPETA_ID`, y redesplegar. No hay lanzamiento manual: la primera pasada es la del primer día programado (`apps/desk/server/index.ts:116`) |
| 10 | La persona con acceso a producción, **cada mes** | Prueba de restauración, que incluye recuperar un documento de la carpeta (`DEPLOY.md:467-468`) |

Desde el paso 6, la copia previa se lanza **antes de cada publicación** y sustituye a la copia manual de §0 (a). Que
Backblaze B2 acepte la subida multiparte con `Content-MD5` bajo bloqueo de borrado, y el límite de exportación de
Drive, son **hipótesis 26**
(`openspec/changes/archive/2026-10-06-respaldo-semanal-drive/archive-report.md:58`).

**Migración de tickets abiertos (F1F-01), el día del corte que fije Gerencia — NO en este despliegue.**

| Paso | Dueño | Qué |
|---|---|---|
| 0 | Gerencia | Responder E-207 a E-212, que condicionan la ejecución, y fijar la fecha de corte |
| 1 | La persona con acceso a producción | Copia de la base antes de aplicar |
| 2 | La que Gerencia designe (E-208) | Sincronización completa y reciente justo antes |
| 3 | La persona con acceso a producción | Pasada en seco (sin `aplicar`), con un `corte` con desfase: `negativa` nula y `numeracion.arrastra` falso (`apps/desk/server/db/migracionTicketsAbiertos.ts:52-54`). Si no, no se aplica y se consulta. En un `+hh:mm` el signo se escribe `%2B` (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:31`) |
| 4 | La persona con acceso a producción | Añadir al fichero de ejemplo la línea de `DEPLOY.md:358-361`; **encender** `MIGRACION_TICKETS_HABILITADA=true` y redesplegar |
| 5 | La persona con acceso a producción | Pasada con `aplicar=true`, con la aplicación en reposo |
| 6 | La persona con acceso a producción | **Apagar** la variable y redesplegar en cuanto termine |
| 7 | Gerencia (E-218) | Averiguación de la hoja de Google y cotejo una a una |

Fuentes: `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:63-71` y
`openspec/changes/archive/2026-10-05-interruptor-migracion-tickets/archive-report.md:37-42`.

### 6.3 · Administrador de la aplicación

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | **E-162 (b)** — el cargo de firma del Director Técnico | Pantalla de usuarios: leer el cargo de firma de esa persona; un texto distinto («Director de Servicio Técnico») no casa con la propuesta (`apps/desk/src/lib/personas.ts:74-79`) |
| **Antes** (con Gerencia) | La lista de cargos (tarea 5) | Una fila por persona: nombre, cargo de permiso de entre los ocho (`packages/shared/src/cargos.ts:12-15`) y área. El Director Técnico necesita además el área Servicio Técnico para mantener novedades y accesorios (`packages/shared/src/mantenimientoNovedades.ts:15-18`) |
| **Corte, lo primero** | **Asignar los cargos** (tarea 22), empezando por el Director Comercial y el Director Técnico | Pantalla de usuarios; el servidor lo guarda en `apps/desk/server/auth/routes.ts:99-100`. Paso a paso anterior, válido: `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1462-1496` |
| **Después** | P-4 de `continuidad-indicadores` y verificación de F1C-11 | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1123-1139` |
| **Enero de 2027** | P-2 de `indicadores-51-55`: cargar las respuestas | `DEPLOY.md:616-620` |

### 6.4 · Gerencia (decisiones)

La lista completa, pregunta a pregunta y con sus opciones, está en `docs/sdd/Preguntas_Gerencia_2026-10-09.md`. Aquí
sólo lo que toca al corte:

| Cuándo | Decisión | Qué desbloquea |
|---|---|---|
| **Antes — PARADA** | **E-158** (confirmación con Servicio Técnico) | Publicar `473665b` |
| **Antes — PARADA**, si hay provisionales | **S-4 de F1B-19** (la ráfaga) | Publicar con o sin corte |
| **Antes — PARADA** | La lista de cargos y el intervalo aceptado | §0 (d) |
| **Antes**, si hay tickets congelados | **S-J de la prioridad**: liberar o dejar los ajustados antes | §0 (f) |
| **Antes del encendido** | Contratar Backblaze B2 (cuesta dinero) | §6.2 |
| **Antes de la migración de F1F-01** | E-207 a E-212 y la fecha de corte; E-218 | §6.2 |
| **Antes del 16/10** | Que cada persona que usa Zoho Desk envíe sus vistas (`openspec/config.yaml:3940`) | El resto de F1B-08 |
| **Desde el 16/11** | P-3 de `continuidad-indicadores` | Dar los indicadores por buenos |

### 6.5 · Director Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** (recomendado) | Preparar la lista Top 5 con prioridad alta o media («baja» ya no vale) | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1446-1453` |
| **Corte, tras los cargos** | Marcar el Top 5, **sabiendo que cada guardado cambia en el acto la prioridad de los tickets abiertos del cliente** | El panel dice «N tickets abiertos actualizados» |
| **Corte, sólo si `filas_top5` no era 0** | Volver a guardar cada cliente Top 5 marcado antes del Deploy | — |

### 6.6 · Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Después, el mismo día** | P.7 de `registro-contrato` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1533-1548` |
| **Después** | **P.8 de `ampliacion-contrato`** | Ficha de un contrato real → «Ampliar» con fecha y motivo; comprobar «Vencimiento original», la lista de ampliaciones, que un ticket bloqueado por contrato vencido se desbloquea y que una fecha posterior al 31/12 se rechaza (`DEPLOY.md:585-587`) |
| **Después** | F1B-15 (cuatro comprobaciones) y F1C-10 | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:767-791` |
| **Después** | F1B-03 (Comercial) | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1174-1183` |
| **Después** | Las siete de F1B-07 y P-6 de `prioridad-tres-niveles` | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1197-1212` |
| **Después, en la primera liberación real** | Las cinco de F1C-05 | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1214-1251` |
| **Antes de la primera carga** | P-1 de `indicadores-51-55`: una muestra real del fichero de la encuesta | Entregarla sin datos de clientes en un chat; `DEPLOY.md:625-626` |
| **Después** | P.3 de `parche-iv11-orden-venta`, P.3 de `asociacion-ov-ticket`, P.6 de `registro-contrato`, P.2 de `permisos-por-cargo`, RQ-HV-12 y `hojas-vida` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1569-1712` |

### 6.7 · Servicio Técnico, Director Técnico y Calidad

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes — PARADA de F1B-04** | **E-170 (1)**: confirmar la lista de novedades (`packages/zoho-sync/src/db/schema.sql:690-699` y `packages/zoho-sync/src/db/schema.sql:768`) | Si hay que cambiarla, se hace en Configuración tras el Deploy, sin SQL |
| **Antes** | Enterarse de los cambios visibles | §1.2 |
| **Corte, tras recibir el cargo** | Director Técnico: completar la lista de accesorios de los modelos que salieron vacíos (P-2 de `accesorios-lista-por-modelo`) | Configuración → «Accesorios por modelo» |
| **Desde el Deploy** | Director Técnico: responder «¿Se reclama al fabricante?» en las OVI que aparezcan «Pendiente de respuesta», **sabiendo que la respuesta no se cambia** | Detalle del ticket, panel de garantía |
| **Después** | **E-170 (3)**, nueve pasos | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1267-1281` |
| **Después** | P.4 de `verificacion-gas-patron-certificado` y las arrastradas | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:793-813` |

### 6.8 · Quien administra n8n

**Antes — PARADA de F1B-04:** E-170 (2), la etiqueta lleva el código del ticket (`docs/sdd/ENTRADA.md:1842`).

### 6.9 · Quien publica

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | Bundle de producción | §4.3 |
| **Corte** | Deploy de la App; §4.5 entero sobre `desk`; log del primer ciclo; avisar a Alfonso para el paso 2 de F1C-09 | §4.2, §4.4, §4.5 |
| **Corte** | Worker **sólo después** de mirar `SWEEP_*`; bloque 2 de §4.5 sobre `zoho-hub`; su log | §0 (h), §0 (i) |
| **Corte** | Devolver el tamaño de `desk.tickets` y `desk.equipos` | §4.5 |
| **Después** | Si la línea de caída de la búsqueda sale en cada ciclo: ampliar el permiso del token de Zoho | §0 (g) |
| **Después** | F1B-05 (anular y restaurar una remisión de prueba), seis escenarios de F1B-08 y el caso sin salida de F1B-03 | `docs/sdd/Paquete_de_Despliegue_2026-10-05.md:145-167`, `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1185-1195`, `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1299-1311` |

### 6.10 · Sin dueño con nombre, o sin vehículo

- **El relleno del sincronizador** (§0 g, punto 2): la tarea existe y no tiene por dónde ejecutarse. Necesita que
  alguien decida el vehículo; este paquete no lo inventa.
- **Comprobar que el ticket nº 884 figura cerrado**, que depende de ese relleno
  (`openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/archive-report.md:59`).
- **La comprobación de lectura de `public.contrato_ampliaciones`**: `DEPLOY.md:568` la atribuye a una tarea «P.8, del
  Mantenedor» que en el informe del cambio es otra y de Comercial
  (`openspec/changes/archive/2026-10-07-ampliacion-contrato/archive-report.md:153`). Aquí queda cubierta por el
  bloque 1 de §4.5, que hace quien publica.
- Alta con serie nueva y con serie registrada, pestaña «EN ESPERA» y zona `America/Bogota` en el contenedor
  (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1664-1680`); la comprobación de Drive y n8n sobre los prefijos
  (E-094, `openspec/config.yaml:4114-4116`).
- **De Supervisión**, por los textos que estos cambios dejan desfasados y no tocan: E-154, E-155, E-222, E-225, E-086
  y las entradas de bandeja sin número de las tandas de prioridad, accesorios, ampliación e indicadores.

---

## 7 · Lo que NO es desplegable, y por qué no se puede partir

**`473665b` no es desplegable hoy**, por §0 (c). Cumplido §0, nada más lo impide:

| Condición | Resultado |
|---|---|
| Migración no idempotente | 73 de 74 con `IF NOT EXISTS` u `ON CONFLICT`; la 55, hipótesis 9 |
| Restricción nueva que rompa datos existentes | No: columnas anulables y sin `DEFAULT`; los `NOT NULL` y `CHECK` son de tablas nuevas; la única que se toca se relaja |
| Sentencia sin calificar en el esquema equivocado | No, si `DB_SCHEMA=desk` (§0, aviso 1) |
| Un interruptor de escritor sin documentar | No: las tres variables nuevas que encienden algo nacen cerradas y están en `DEPLOY.md` §11, §12 y §13 |
| Algo nuevo que escribe sin interruptor | **Sí, y se declara:** la pasada de avisos de provisionales (§0 e), el aviso de 60 días de la ficha y la búsqueda de Zoho del sincronizador (§0 g) están activos desde que se publica |

**No se puede publicar una parte.** Una sola imagen para los dos servicios (`Dockerfile:27-29`); la guarda de F1B-03
se llama sin condición (`apps/desk/server/services/ticketService.ts:131`); y en `main` la fusión de F1B-03 (`a4bfc85`)
es la primera después de `5f68822`, así que **todo lo posterior va detrás de ella**, las doce piezas de este paquete
incluidas. El único punto publicable sin esperar a E-158 sigue siendo `5f68822`, con su paquete
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md`), y no lleva F1F-05.

El worker sí: con `473665b`, sólo espera a `SWEEP_*` (§0 h) y a la comprobación del bloque 2 (§0 i). No carga la
guarda de F1B-03.

---

## 8 · Nota de método

- **Las citas `ruta:línea` se leyeron contra `473665b`**, con un guion que imprime el texto de cada extremo, y además
  pasaron por el detector de `pre-push` sobre el commit de este paquete. Las citas a los paquetes anteriores apuntan
  a su texto fechado, que no cambia.
- **Lo heredado del consolidado anterior no se copió: se comparó.** De las 190 citas distintas de aquel documento, 188
  dicen byte a byte lo mismo en `36dc352` y en `473665b` (comparación por guion de cada extremo); una cambió de texto
  sin cambiar de función (la línea 131 de `ticketService.ts`, que sigue llamando a la guarda) y la otra es de un
  paquete fechado. Las que este paquete reutiliza se volvieron a leer.
- **Las doce piezas nuevas se contrastaron contra el código**, no contra las adendas del 06/10 y del 08/10: tres
  lecturas independientes, cambio a cambio, de su `archive-report.md`, su `proposal.md` y los ficheros que tocó cada
  fusión; y esta sesión leyó después, una a una, las líneas que sostienen las condiciones de parada.
- **El esquema se contó por guion** (sentencia = `;`, con su línea de inicio y fin), no a mano.
- **Las variables se compararon por nombre** entre `ae5aaf4` y `473665b`.
- **Lo que se cita de los informes y no se reprodujo:** veredictos, mutaciones y recuentos de escenarios de los
  cambios archivados.
- **Cuatro afirmaciones de documentos vigentes resultaron incompletas o falsas al contrastarlas**, y se corrigen
  aquí sin editar aquéllos: que sin `public.reasignaciones` sólo fallen reasignar, el historial y el borrado de
  usuarios (`DEPLOY.md:516-519`; falla también eliminar un ticket); que sin `public.nit_exentos` sólo falle el alta
  (`DEPLOY.md:655-656`; falla también la pasada); que el proveedor de las copias esté por elegir
  (`DEPLOY.md:423-424`); y que el relleno del sincronizador sea ejecutable
  (`openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/archive-report.md:57`).

---

## 9 · Hipótesis de este paquete

Lo que no está en esta lista se leyó en el árbol de `473665b`, con ruta y línea.

1. **Que producción siga en `ae5aaf4`.** Lo dice el bundle (§4.3), no el repositorio. De ella dependen §0 (e) y §0
   (f): si es cierta, no hay provisionales ni prioridades ajustadas anteriores.
2. **Qué versión corre el worker** y cómo lo arranca EasyPanel (`APP_ENTRYPOINT`, `Dockerfile:27-29`, o el comando de
   `DEPLOY.md:188-190`).
3. **Que el worker escriba sólo en `zoho-hub` y la App sólo en `desk`** (`DEPLOY.md:33-36`), y en qué esquema vive
   `tickets` dentro de `zoho-hub`.
4. **El valor de `DB_SCHEMA` en los dos servicios.**
5. **El contenido del fichero de ejemplo de entorno**: ninguna sesión lo lee.
6. **Los valores en producción de `SWEEP_ENABLED`, `SWEEP_DRY_RUN`, `N8N_AVISOS_WEBHOOK_URL`, `AVISOS_COPIA_EMAIL`,
   `SYNC_INTERVAL_MS` y de los tres interruptores nuevos.**
7. **Que la imagen de `473665b` construya en EasyPanel**, con `postgresql-client` de Alpine.
8. **Que el bundle de Windows y el de `node:22-alpine` sean idénticos**, y que anteponer `tsc -b` no lo cambie.
9. **Que repetir `ALTER COLUMN a DROP NOT NULL` no dé error** en PostgreSQL.
10. **Que las 74 sentencias corran sin error contra la base de producción**, que las consultas de §4.5 devuelvan lo
    dicho con el rol con que se ejecuten, y las consecuencias de §2.4 de omitir cada una: leídas en el código, no
    ejecutadas.
11. **Que la versión de `pg_dump` de la imagen sea igual o mayor que la del servidor.**
12. **El procedimiento de copia manual con `pg_dump`** de §0 (a).
13. **Que no haya Top 5 marcados en producción** y que el panel deje volver a guardar sin cambiar nada.
14. **Que no exista en producción ninguna fila con `custom_fields` igual al `null` de JSON** (E-206).
15. **Cuántos tickets bloqueará la guarda de F1B-03**, cuántos son de «Equipo nuevo» y si hay alguno en `Remisión
    creada` sin remisión vigente (E-185).
16. **Que la consulta P-1 de F1F-05, la etiqueta de n8n y el cargo de firma del Director Técnico** sean como se
    describen.
17. **Todo lo que «ve el usuario»** de §1.2 y de las verificaciones de §6: leído en el código; los `.tsx` están fuera
    de la red de pruebas por decisión de Gerencia.
18. **El comportamiento de los commits intermedios**: no se mide ninguno; sólo `473665b`.
19. **Lo que los paquetes del 2026-10-01, 2026-10-03, 2026-10-04 (b) y 2026-10-05 (b) dejaron sin comprobar en los
    pasos a los que este paquete remite** (§5, §6).
20. **El coste de leer todos los contactos de Books en cada pasada** y cuántos contactos hay; cuántas parejas
    avisaría la primera pasada si hubiera provisionales.
21. **Que el token de Zoho de producción tenga permiso de búsqueda, y que su nombre sea `Desk.search.READ`**: sólo lo
    nombra `DEPLOY.md:470`.
22. **Que `GET /api/admin/backfill-details` sirva de relleno** para un ticket ya presente y desfasado, y que el
    listado de Zoho traiga los campos personalizados que `backfillTickets` persiste.
23. **Que PostgreSQL de producción acepte tal cual la consulta de modelos sin accesorios**, y la de NIT repetidos.
24. **Que toda conversación nueva en Zoho actualice la fecha de modificación del ticket.**
25. **Que una búsqueda y un detalle por ciclo y por proceso no comprometan la cuota de Zoho**, y que la latencia del
    índice de búsqueda sea inferior a 15 minutos.
26. **Que Backblaze B2 acepte la subida multiparte con `Content-MD5` bajo bloqueo de borrado y el borrado por
    versión**, y el límite de exportación de Drive.
27. **Que existan en producción tickets de «Garantía» con otra grafía o con orden de cobro ya asociada**, y cuántas
    OVI aparecerán «Pendiente de respuesta» el día de publicar.
28. **Que el formulario de la encuesta recoja el número de ticket y exporte un CSV con las tres columnas esperadas.**
29. **Que `instanteDeJornada` falle con las horas 0 a 4**: leído en el código, no ejecutado.
