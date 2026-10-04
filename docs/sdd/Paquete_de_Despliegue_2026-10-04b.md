# Paquete de despliegue — 2026-10-04 (b)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe un
agente que no despliega ni commitea. La publicación es una acción manual: el CI **no despliega**, sólo verifica
(`DEPLOY.md:270-271`).

**Este paquete SUSTITUYE al del 2026-10-04 para publicar, y está medido sobre `f619d04`.** Aquél
(`docs/sdd/Paquete_de_Despliegue_2026-10-04.md`) cubría `ae5aaf4..24a14eb`, es un registro fechado y **no se toca**.
Después de él entraron en `main`, el mismo 2026-10-04, cuatro tandas más —el caso sin salida de F1B-03, F1B-07,
la búsqueda de F1B-08 y la paridad de F1C-05—, así que `24a14eb` ya no es la cabeza y aquel paquete se queda corto
en esquema (cinco sentencias más), en comportamiento y en tareas de persona. Éste es **autosuficiente**: recoge
todo lo que aquél decía y sigue siendo cierto, con cada cita `ruta:línea` vuelta a leer contra `f619d04`, y añade
lo nuevo. Los dos anteriores (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md`, que cubría `ae5aaf4..5f68822`, y el
del 2026-10-04) fijaban como base en producción `ae5aaf4` (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:25`), y
ningún commit de `5f68822..f619d04` registra un despliegue hecho: `git log --oneline -i --grep="despleg"
5f68822..f619d04` no devuelve nada, y los cinco que casan con «despliegue» (`1093f98`, `5385d81`, `3c669e7`,
`61f0ee3`, `2a74fdc`) son paquetes y condiciones de despliegue, no despliegues. Por eso todo se mide otra vez desde
`ae5aaf4`. **Hipótesis:** que producción siga hoy en `ae5aaf4`; no es comprobable desde el repositorio y se
comprueba con el método del bundle de §4.4 antes de empezar (§9).

Cómo se lee: lo que arrastra del 2026-10-03 y **no ha cambiado** se recoge aquí resumido y remite, con ruta y
línea, a aquel paquete para el detalle largo. Lo nuevo desde `5f68822` —ocho piezas: las cuatro del paquete del
2026-10-04 y las cuatro posteriores— va completo. Las citas de código de este documento se leyeron contra
`f619d04`. Las del paquete del 2026-10-03 se revalidaron de una vez (§8): de sus 289 citas completas, ninguna
apunta hoy a una línea inexistente o vacía y 268 dicen hoy, byte a byte, lo mismo que en `5f68822`.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `f619d04` (HEAD de `main` el 2026-10-04). **Está en `origin/main`** (`git rev-parse origin/main` da `f619d04`) |
| Base que consta en producción | `ae5aaf4` (hipótesis, arriba) |
| Rango medido | **`ae5aaf4..f619d04`** |
| `git diff --shortstat ae5aaf4 f619d04` | **704 files changed, 138353 insertions(+), 2006 deletions(-)** |
| Commits del rango | **534** (`git rev-list --count ae5aaf4..f619d04`); **97** posteriores a `5f68822`, de ellos **45** posteriores a `24a14eb` |
| De ellos, tocan `apps/` o `packages/` | **156**; **38** posteriores a `5f68822`, de ellos **18** posteriores a `24a14eb` |
| Código tocado | **282 ficheros**, +30.129/−978 (`git diff --shortstat ae5aaf4 f619d04 -- apps packages`); desde `5f68822`: **110 ficheros, +6.297/−353**; desde `24a14eb`: **63 ficheros, +2.523/−174** |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` desde `5f68822` | Sólo `CLAUDE.md`, `DEPLOY.md` (+76 líneas, dos secciones nuevas) y `debt.md` (una línea). Desde `24a14eb`, sólo una línea de `CLAUDE.md` y una de `debt.md`: **`DEPLOY.md` no cambia desde el paquete anterior**. **Ni `Dockerfile`, ni `package.json`, ni `package-lock.json`, ni `.github`, ni el fichero de ejemplo de variables** |
| Ficheros `.sql` que cambian desde `5f68822` | Dos: `packages/zoho-sync/src/db/schema.sql` (+42: +31 hasta `24a14eb` y +11 después) y `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` (+59, nuevo) |
| Bundle del cliente de `f619d04` | `index-DjybFcf5.js`, 395.394 bytes, sha256 `c57013def55628bf998398fd263b07a69b169b645127cfe6b84e699e3c2158be` (§4.4; construido el 2026-10-04 con `vite build`, sin `tsc -b`, con la salida fuera del repositorio) |
| Tipos, lint y pruebas | Ejecutados el 2026-10-04 sobre el árbol de `f619d04`, los tres con código de salida 0: `npm test` **3.218 pruebas en verde y 2 omitidas** (206 ficheros y 1 omitido), `npm run typecheck` limpio, `npm run lint` 165 avisos y 0 errores. CI en verde sobre `f619d04` (run 37228526847), y antes sobre `90477b8` (37213641188), `93e6741` (37217630741) y `59d02da` (37226532279) |

`git diff --name-only 32e5df3 f619d04 -- apps packages` sale vacío: los tres commits posteriores a la última
fusión (`373401e`, `fed9532`, `f619d04`) son sólo documentación.

**Las ocho piezas nuevas desde `5f68822`, por orden de llegada a `main`** (cada SHA comprobado con `git log`; las
cifras de «Qué toca» son `git diff --shortstat` de `apps` y `packages` contra el primer padre de su fusión):

| Pieza (`tanda`, `cierra`) | Fusión a `main` | Código | Verify | Archivo | Qué toca |
|---|---|---|---|---|---|
| `tipo-servicio-ticket-sin-ov` (**F1B-03** parte L, `cierra: no`) | `a4bfc85` | `6dbae98`, `613669b` | `b34cf8d` | `560f60f` | 20 ficheros, +652/−57: la guarda en `ticketService.ts`, su lectura en `db/remisiones.ts`, el predicado en `packages/shared/src/remision.ts` y el botón (`TransitionPanel.tsx`, `habilitarServicio.ts`). Sin esquema |
| `derivacion-repuestos-director-tecnico` (**F1C-11**, `cierra: si`) | `5797c65` | `d179c12` (+ `8f91947`, pruebas) | `79180e6` | `920b304` | 11 ficheros, +229/−45: `transitions.ts`, `cargos.ts`, `sla.ts` (comentario) y pruebas. Sin esquema |
| `recepcion-rotulacion-foto-entrada` (**F1B-04** sin accesorios, `cierra: no`) | `4c35661` | `da9c740`, `231f7e3`, `e24d490`, `8f8506f`, `1b289f3` (+ `4c778b0`, pruebas) | `4649306` | `9e2ebdf` | 20 ficheros, +1.526/−89: **esquema** (+31 líneas), ruta y servicio nuevos, `routes/remision.ts`, `CrearRemision.tsx`, y `DEPLOY.md` (+29) |
| `continuidad-indicadores` (**F1F-05**, `cierra: no`) | `85d6018` | `24e636a`, `e252518`, `d25ecda`, `d0a7c85`, `37bd97f` (+ `17cdf05`, remediación) | `710a34e` | `c6d25ae` | 17 ficheros, +1.459/−4: ruta nueva de sólo lectura, cálculo en `packages/shared`, enlace en `Analisis.tsx`, y `DEPLOY.md` (+47). Sin esquema |
| **Nueva** · `remision-creada-sin-salida` (**F1B-03**, el caso sin salida, `cierra: no`) | `90477b8` | `55a4cba` | `3cf017e` (+ `af6dd0c`, una cita) | `ff92db2` | 6 ficheros, +131/−22: el predicado `puedeCrearRemisionDeEntrada` de `packages/shared/src/transitions.ts`, `apps/desk/src/lib/botonRemision.ts`, un comentario de `TransitionPanel.tsx` y pruebas. Sin esquema |
| **Nueva** · `propagar-top5-lista-remision-creada` (**F1B-07**, `cierra: no`) | `93e6741` | `081e78e`, `9c4498f`, `74aadd5`, `021f363` (+ `49582af`) | `a29efe8` (+ `f593515`) | `b5015a6`, `8fd977d` | 26 ficheros, +1.038/−46: **esquema** (+7 líneas, tres sentencias), `upsertTicket` de `packages/zoho-sync/src/db/repo.ts`, `db/prioridadCliente.ts`, `routes/prioridad.ts`, la lista nueva `db/listaRemisionCreada.ts` y su vista |
| **Nueva** · `busqueda-ticket-serial` (**F1B-08**, la búsqueda, `cierra: no`) | `59d02da` | `4bc8196`, `09f622c` | `69d94b6` (+ `a55326b`) | `44d0ff5`, `223b229` | 19 ficheros, +767/−47: `packages/shared/src/busquedaTickets.ts`, `packages/zoho-sync/src/db/busquedaTickets.ts`, las rutas de tickets y de «Mis tickets», y la caja `BuscadorTickets.tsx`. Sin esquema |
| **Nueva** · `liberacion-sin-factura-motivo-fecha` (**F1C-05**, la paridad, `cierra: no`) | `32e5df3` | `0f3cafc`, `ffc3bea`, `7c43479` | `d044c35` | `522b5fc`, `579f932` | 23 ficheros, +592/−64: **esquema** (+4 líneas, dos sentencias), una línea del catálogo en `transitions.ts`, la guarda `packages/shared/src/liberacionSinFactura.ts`, `ticketService.ts`, `rows.ts` y el panel |

Las cuatro ramas nuevas iban apiladas (F1B-07 lleva dentro la de F1B-03; F1B-08 y F1C-05 llevan dentro las dos
anteriores), así que la cifra de cada fusión es lo que **entró en `main`** con ella, no el tamaño de la rama. Los
demás commits que tocan `apps` o `packages` son fusiones entre ramas (`76225c0`, `61f0ee3`, `989bd4e`, `33f08a5`)
y commits de archivo o de informe que llevan una prueba.

*Correcciones a los paquetes anteriores, halladas al revalidarlos contra `f619d04`* (ninguno de los dos se toca):

- **El caso sin salida que el paquete del 2026-10-04 anotaba ya no existe.** Aquél afirmaba, en el apartado (b) de
  sus condiciones de parada y en su riesgo R39, que un ticket en `Remisión creada` sin remisión de entrada vigente
  no tenía botón para crearla. Era cierto de `24a14eb`; lo cierra `remision-creada-sin-salida` (§0 b). Es el caso C
  de la regla de mutación 4, y lo deja escrito el informe de archivo de ese cambio
  (`openspec/changes/archive/2026-10-04-remision-creada-sin-salida/archive-report.md:71-73`).
- **Las sentencias nuevas de `schema.sql` pasan de cincuenta y dos a cincuenta y siete** (§2.1), y las columnas
  nuevas sobre tablas existentes, de veintiuna a veinticinco.
- **Las pruebas pasan de 2.954 a 3.218**, y el bundle de referencia es otro (cabecera).
- **`f619d04` sí está empujado y tiene CI**; `24a14eb` no lo estaba.
- **Las importaciones de `packages/shared` desde `packages/zoho-sync` ganan un tipo**, `BusquedaTickets` (§10).
- **«Las dos consultas de recuento» de F1B-03 no están en un solo fichero.** La nota final del paquete del
  2026-10-03 las sitúa en `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`
  (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:921-922`). Ese fichero trae **una** consulta y dice de sí mismo
  que es la segunda; la primera es `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`
  (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:3-7`). Son dos ficheros (§0 b).
- **Los cargos de permiso pasan de siete a ocho** respecto del 2026-10-03 (`packages/shared/src/cargos.ts:12-15`).
- **El mapa de derivación por defecto pasa de tres a cinco entradas** respecto del 2026-10-03
  (`packages/shared/src/transitions.ts:274-282`).
- **Siete citas de código del paquete del 2026-10-03 apuntan a líneas que cambiaron de contenido sin moverse**, y
  lo que afirmaba de ellas sigue siendo cierto: la línea 131 de `ticketService.ts` (dos veces; gana la llamada a la
  guarda de F1B-03), la 134 (dos veces; gana la guarda de contenido de F1C-05), la 73 de `migrate.ts` (gana
  `catalogo_novedades`), la 61 de `app.ts` (gana dos registros de rutas) y la 70 de `TransitionPanel.tsx`. Detalle
  en §8.

---

## 0 · Condiciones de parada y avisos — leer antes que nada

Las cinco primeras son **condiciones de parada**: si una no está cumplida, no se pulsa Deploy sobre `f619d04`.
Son las mismas del paquete del 2026-10-04 —E-158 y los recuentos, F1C-09, `afa4252` y la fecha del 13/11—, con sus
citas releídas contra `f619d04`; ninguna de las cuatro tandas nuevas las cumple ni las relaja. El apartado (g) es
nuevo: **no añade ninguna condición de parada**, pero sí una comprobación de lectura obligatoria justo después del
Deploy, en las **dos** bases, y tres avisos.

### (a) F1C-09 — CONDICIÓN DE PARADA: sin copia comprobada de la base, no se despliega; y migración en el mismo corte

Decisión de Gerencia del 2026-10-02, `decision/f1c09-copia-antes-de-desplegar` (`openspec/config.yaml:3659-3680`).
Respuesta textual (`openspec/config.yaml:3665`):

> «No despliegues F1C-09 sin copia previa de la base.»

Sus consecuencias escritas (`openspec/config.yaml:3667-3670`): antes de desplegar y de ejecutar la migración se
hace una copia de la base `desk` **y se comprueba que existe**; es tarea de persona de Alfonso. **F1C-09 está
dentro de `f619d04`, así que la condición alcanza a este paquete entero.**

**Despliegue y migración van EN EL MISMO CORTE.** F1C-09 retira «Marcar como pendiente» y las dos «Servicio
externo» hacia `Por Facturar` (`packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`),
y `Pendiente` pasa a existir sólo en soporte remoto (`packages/shared/src/estados.ts:182`). Entre el Deploy y la
migración, un ticket de servicio en `Pendiente` se queda sin transiciones
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:66`).

El script es `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`: paso 1 de sólo lectura **antes** de desplegar
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:32-42`), paso 2 de traslado **tras** desplegar
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:44-53`) y recuento posterior
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:55`). Ni el script ni las líneas de código de F1C-09 citadas
aquí cambian desde `5f68822`: la tabla de pasos y los cinco avisos del cambio (nunca ejecutado contra PostgreSQL real, predicado de
soporte remoto más amplio, grupo 2 sin mover, reversión que borra todas las filas marcador, idempotencia) siguen
valiendo tal como están en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:92-113`.

### (b) F1B-03 — CONDICIÓN DE PARADA: sin la respuesta a E-158 y sin los dos recuentos, no se despliega

**Qué pasa el día que se publique.** «Habilitar Servicio» deja de pasar para todo ticket que no tenga una remisión
de entrada vigente. La guarda se llama en `apps/desk/server/services/ticketService.ts:131` y está en
`apps/desk/server/services/ticketService.ts:273-277`: sólo mira que la transición sea `habilitar_servicio`
(`apps/desk/server/services/ticketService.ts:274`) y responde 422 con un único texto
(`packages/shared/src/remision.ts:131-135`). «Vigente» es de tipo entrada y no anulada, con cualquier estado de
envío (`packages/shared/src/remision.ts:126-128`); lo que lee de la base es `tipo` y `anulada_at` de todas las
remisiones del ticket (`apps/desk/server/db/remisiones.ts:237-240`).

**A quién alcanza.** A los tres orígenes de la transición —`OV asignada`, `Ticket creado` y `Remisión creada`—
(`packages/shared/src/transitions.ts:178`) y **a todas las clasificaciones que pasan por ella, incluidos los
tickets de «Equipo nuevo»**: el catálogo de equipo nuevo no contiene ninguno de esos tres estados
(`packages/shared/src/transitions.ts:350-363`), así que un ticket «Equipo nuevo» que esté en uno de ellos sigue el
flujo de servicio (`packages/shared/src/flujos.ts:56-61`) y pasa por la misma transición y la misma guarda, que no
tiene excepción por clasificación. El flujo de soporte remoto no contiene la transición
(`packages/shared/src/transitions.ts:388-397`).

**No hay interruptor.** La guarda no lee ninguna variable de entorno y va en el mismo código que el resto de la
App: publicar `f619d04` es publicarla (§10).

**Antes de desplegar hacen falta dos cosas, las dos de personas:**

1. **La respuesta de Gerencia a E-158** (`docs/sdd/ENTRADA.md:1782`): si la guarda alcanza a los tickets de
   «Equipo nuevo». Lo construido aplica el supuesto «sí, sin excepciones», **no decidido**. Si la respuesta es
   «no alcanza», hace falta un cambio de código nuevo (una excepción por clasificación) y **`f619d04` deja de ser
   el commit a publicar**. El 2026-10-04 no hay respuesta registrada (`grep -n "E-158" openspec/config.yaml` → 0).
2. **Los dos recuentos ejecutados en producción, con sus cifras entregadas.** Son de sólo lectura y van envueltos
   en una transacción de sólo lectura que se deshace:
   - `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:33-59`):
     los tickets que **hoy** esperan en los tres orígenes, por estado, clasificación y `managed_by_app`. La columna
     `sin_remision_vigente` es **los que quedarán bloqueados al publicar**
     (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:25`).
   - `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:29-77`):
     el histórico de llegadas a `Ingresado` sin remisión, que la guarda no repara.

   Las dos leen tablas y columnas que ya existen en el esquema de `ae5aaf4` (comprobado con `git grep` sobre
   `packages/zoho-sync/src/db/schema.sql` en `ae5aaf4`: `anulada_at`, `ticket_history`, `managed_by_app`,
   `classification`, `from_status`), así que **se pueden ejecutar hoy, sin desplegar nada**. Ninguna de las dos se
   ha ejecutado nunca (`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:130`).

**Qué hacer con los bloqueados — y aquí cambia lo que decía el paquete del 2026-10-04.** El texto del 422 dice
«Crea la remisión de entrada desde el ticket». En `24a14eb` la pantalla sólo ofrecía «Crear remisión» en `OV
asignada` y `Ticket creado`, y un ticket en `Remisión creada` sin remisión de entrada vigente se quedaba sin
botón: recibía el 422 y no tenía cómo cumplirlo. **`remision-creada-sin-salida` (F1B-03, `90477b8`) cierra ese
caso.** En `f619d04` el predicado admite los tres orígenes de «Habilitar Servicio»
(`packages/shared/src/transitions.ts:163-165`) y el botón se ofrece también en `Remisión creada`, salvo mientras
las remisiones del ticket no han cargado (`apps/desk/src/lib/botonRemision.ts:31`) y salvo que ya haya una de
entrada confirmada (`apps/desk/src/lib/botonRemision.ts:39-40`). El servidor ya aceptaba el alta desde cualquier
estado —el alta de remisión no lee el estado del ticket (`apps/desk/server/routes/remision.ts:120-264`; es la
pregunta E-184, `docs/sdd/ENTRADA.md:1916`)—; ahora una prueba fija que desde los tres orígenes el recorrido completo funciona —422 de la guarda, alta
`201`, y «Habilitar Servicio» `200`— (`apps/desk/server/remisionCreadaSinSalida.test.ts:31-39`), también con una
remisión de salida o con la única de entrada anulada (`apps/desk/server/remisionCreadaSinSalida.test.ts:42-59`).

De dónde sale un ticket así sigue siendo **hipótesis sin recuento**: por las rutas de la App no se produce, porque
anular la última remisión confirmada devuelve el ticket a `Ticket creado`
(`apps/desk/server/routes/remision.ts:334-336`); quedan escrituras directas en la base, una petición caída entre
la anulación y su sincronización (E-186, `docs/sdd/ENTRADA.md:1926`) y, cuando exista, una remisión confirmada que
no sea de entrada (E-187, `docs/sdd/ENTRADA.md:1931`)
(`openspec/changes/archive/2026-10-04-remision-creada-sin-salida/archive-report.md:38-41`). El recuento del
2026-10-03 reparte por estado y por `managed_by_app`, así que dirá cuántos hay: es E-185
(`docs/sdd/ENTRADA.md:1921`), **informativo**, ya no motivo de consulta previa —si la fila de `Remisión creada`
trae `sin_remision_vigente` mayor que cero, esos tickets tienen ahora el botón—.

**Lo que este cambio NO toca:** la condición de parada. La guarda es la misma, sigue sin interruptor y sigue
esperando la respuesta a E-158 y los dos recuentos
(`openspec/changes/archive/2026-10-04-remision-creada-sin-salida/archive-report.md:81`).

Lo habilitado desde Zoho no pasa por la App y la guarda no lo ve
(`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:31`).

### (c) `afa4252` — CONDICIÓN DE PARADA del worker: mirar `SWEEP_ENABLED` y `SWEEP_DRY_RUN` antes de redesplegarlo

`afa4252` añade los pagos de clientes, con su tabla hija, a la lista de entidades del barrido de Books
(`packages/zoho-sync/src/booksHub/sync.ts:190-192`). Es código del worker: **no tiene efecto hasta que se
redespliegue el servicio `hub-sync`**; redesplegar la App no lo activa.

El barrido sólo se programa si `SWEEP_ENABLED` vale `true` (`packages/zoho-sync/src/config.ts:118`,
`apps/hub-sync/src/hub-sync.ts:68`), y sólo borra si además `SWEEP_DRY_RUN` vale `false`
(`packages/zoho-sync/src/config.ts:119`, `packages/zoho-sync/src/sweep/sweep.ts:77`). `DEPLOY.md:200-201` dice lo
mismo: el primero «nace apagado» y el segundo «nace encendido».

**Tarea de persona ANTES de desplegar el worker:** comprobar esos dos valores en el gestor de secretos de
producción (§6.1). **Su valor en producción no es verificable desde el repositorio.**

> **Si el barrido está activo, borra las filas de `books.customer_payments` (y de `customer_payment_invoices`) que
> Zoho ya no tenga.**

Qué acota ese borrado: cada candidato se vuelve a comprobar por id en Zoho (`packages/zoho-sync/src/sweep/sweep.ts:65-75`);
si los huérfanos superan el tope, la entidad se salta (`packages/zoho-sync/src/sweep/sweep.ts:62-64`, topes en
`packages/zoho-sync/src/config.ts:121-122`); se borra primero la tabla hija (`packages/zoho-sync/src/sweep/sweep.ts:81-84`).
Ocurre en `zoho-hub`; `books.customer_payments` no está entre las cuatro tablas replicadas (`DEPLOY.md:42`). **Una
reversión de código no recupera filas borradas.** Nada de esto cambia desde `5f68822`; el detalle está en
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:115-141`.

### (d) F1F-05 — CONDICIÓN CON FECHA: en producción antes del viernes 13/11/2026

F1F-05 tiene que estar desplegada **antes del viernes 13/11/2026** para medir las cuatro semanas desde el 16/11
(`DEPLOY.md:270-271`; E-181, `docs/sdd/ENTRADA.md:1899`). Como va en el mismo código que la guarda de F1B-03 (§10),
**esa fecha queda atada a la respuesta de E-158**: si E-158 no está respondida a tiempo, F1F-05 tampoco llega.

Con ella va la **consulta de sólo lectura P-1** (`DEPLOY.md:272-298`): dice si los valores de Zoho de las columnas
47 a 59 y la calificación de satisfacción llegan sincronizados en `desk.tickets`. Lee `custom_fields` y `raw`, que
ya existen en el esquema de `ae5aaf4`, así que **se puede ejecutar hoy**. No se ha probado contra el PostgreSQL de
producción (`DEPLOY.md:300-302`). Si ninguna consulta trae los nombres de los indicadores, la comparación no tiene
con qué comparar y se abre E-173 (`docs/sdd/ENTRADA.md:1859`); no es un fallo del despliegue.

### (e) E-162 y E-170 — condiciones de publicación de F1C-11 y de F1B-04

**E-162 (F1C-11)** (`docs/sdd/ENTRADA.md:1802`). Dos tareas en producción, de Gerencia o de un administrador:

- **(b) Confirmar que el cargo de quien es Director Técnico está escrito «Director Técnico».** Condiciona que la
  derivación haga efecto: la propuesta busca a la persona por el texto de su cargo de firma
  (`apps/desk/src/lib/personas.ts:74-79`). **Si no casa, la casilla «Derivado a» no propone a nadie y el ticket
  conserva el derivado que traía, sin ningún aviso.** Se puede mirar hoy, antes de desplegar.
- **(a) Asignar el cargo «Especialista técnico» a Johny Luna.** Es el octavo de la lista cerrada de cargos de
  permiso (`packages/shared/src/cargos.ts:8-15`), y la columna `cargo_permiso` nace con el Deploy (§0 f, punto 1):
  **sólo se puede hacer después del Deploy**, con los demás cargos (§6.3). No condiciona la derivación, que va al
  Director Técnico (`packages/shared/src/transitions.ts:276`); el respaldo al Especialista técnico no está
  construido (`openspec/changes/archive/2026-10-03-derivacion-repuestos-director-tecnico/archive-report.md:8-10`).

**E-170 (F1B-04)** (`docs/sdd/ENTRADA.md:1842`). Tres comprobaciones; las dos primeras son **antes de publicar**:

1. **Servicio Técnico confirma la lista de diez novedades** (`packages/zoho-sync/src/db/schema.sql:690-699`).
   Condiciona lo que el técnico ve en el formulario desde el primer minuto. La lista es dato: se corrige por SQL
   sin redesplegar (`apps/desk/server/services/recepcion.ts:10-11`), y una novedad se retira con `activo = false`,
   **nunca borrando la fila**, porque la siembra la volvería a insertar en el siguiente arranque
   (`packages/zoho-sync/src/db/schema.sql:677-681`).
2. **Quien administra n8n comprueba que la etiqueta que imprime lleva el código del ticket.** Condiciona que la
   casilla «Rotulado y guardado» signifique algo: el formulario la exige antes de crear la remisión
   (`packages/shared/src/recepcion.ts:101`) y la etiqueta sale —hipótesis, no verificada contra el flujo de n8n—
   al enviar (E-167, `docs/sdd/ENTRADA.md:1827`).
3. Servicio Técnico comprueba el formulario en la aplicación, **tras publicar** (§6.7).

Y, de quien despliega, la **comprobación de lectura** de `DEPLOY.md:234-261`: diez filas en el catálogo y las seis
columnas (§4.4 la incluye).

### (f) Lo que ya traían los paquetes anteriores y sigue en pie

Los siete puntos de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:143-173` siguen valiendo sin cambios de
contenido. En una línea cada uno, con las citas críticas releídas en `f619d04`:

1. **`public.users.cargo_permiso`: si la columna falta, nadie puede usar la aplicación** (`apps/desk/server/auth/sessions.ts:17`,
   `apps/desk/server/auth/middleware.ts:18`). La consulta de §4.4 es obligatoria justo después del Deploy.
2. **Desde el Deploy, un usuario de Comercial que no sea administrador deja de poder hacer la «Liberación sin
   factura»** hasta que se le asigne el cargo `Director Comercial` (`packages/shared/src/cargos.ts:32`,
   `packages/shared/src/cargos.ts:49`). Hay que nombrar quién asigna y aceptar por escrito ese intervalo.
3. **El orden del mismo día:** primero los cargos de permiso, después la lista Top 5 (`packages/shared/src/cargos.ts:80-83`).
4. **El cargo de las alarmas no es el cargo de permiso** (`apps/desk/server/db/avisos.ts:109`). Tampoco lo es el
   de la derivación de F1C-11: las dos leen el cargo de firma.
5. **La ráfaga de lo vencido de `alarmas-horas-habiles` sigue sin decisión** (`grep -c -i "r.faga"
   openspec/config.yaml` → 0 el 2026-10-04). Sin respuesta se publica apagada (`apps/desk/server/services/alarmasSla.ts:61`,
   `apps/desk/server/services/alarmasSla.ts:102-104`). Si Gerencia la quiere encendida, `f619d04` deja de ser el
   commit a publicar.
6. **`migrate` es tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:29-35`). Por eso §4.4 no es
   opcional.
7. **Los tickets «Soporte remoto» y «Equipo nuevo» ya abiertos cambian de botones el día del Deploy**, sin medir
   cuántos.

### (g) Lo nuevo de este paquete — una comprobación obligatoria en las dos bases y tres avisos

Ninguno de los cuatro es condición de parada. El primero **es obligatorio justo después de cada arranque** y, si
falla, obliga a actuar.

**1 · F1B-07: la migración tiene que entrar antes de que corra el sincronizador, y si no entra nadie lo dice.**
Desde `081e78e`, `upsertTicket` lee la columna nueva `prioridad_en_app_at` en su `SELECT` previo, el que hace por
**cada** ticket antes de escribirlo (`packages/zoho-sync/src/db/repo.ts:66-69`; la columna, en
`packages/zoho-sync/src/db/repo.ts:67`). Esa columna la crea la sentencia 53 del esquema
(`packages/zoho-sync/src/db/schema.sql:710`).

- **El orden lo garantiza el código, en cada proceso:** la App hace `await migrate(pool)`
  (`apps/desk/server/index.ts:27`) antes de crear la aplicación y de programar la pasada periódica que llama a
  `sync.syncRecent()` (`apps/desk/server/index.ts:85-93`); el worker migra el hub en la primera línea de su
  arranque (`apps/hub-sync/src/hubSync.ts:13`), y sólo después programa sus ciclos
  (`apps/hub-sync/src/hub-sync.ts:48-49`). No hay nada que ordenar a mano.
- **Lo que el código NO garantiza es que la `ALTER` haya funcionado.** `migrate` es tolerante por sentencia: si
  una falla, escribe `migrate: sentencia omitida` en el log y sigue con la siguiente
  (`packages/zoho-sync/src/db/migrate.ts:29-35`). El proceso **arranca igual**, la aplicación abre y el tablero
  enseña tickets.
- **Qué pasa entonces:** el `SELECT` de `upsertTicket` falla en cada ticket. La persistencia aísla los fallos uno a
  uno —«uno malo no aborta el lote»— y sólo deja una línea `persistTicket(<id>) falló:` por ticket en el log
  (`packages/zoho-sync/src/sync.ts:125-133`). Resultado: **el sincronizador queda roto entero y en silencio**
  —ningún ticket nuevo ni modificado en Zoho llega a la base—, sin error en pantalla y sin que el proceso caiga.
  Además falla la propagación del Top 5, que escribe esa misma columna
  (`apps/desk/server/db/prioridadCliente.ts:118`).
- **En qué bases:** en **las dos**. La tabla `tickets` existe en `desk` y en `zoho-hub` y **no es una tabla
  replicada**: la replicación hub→desk lleva sólo `desk.activities`, `books.contacts`, `books.sales_orders` y
  `books.items` (`DEPLOY.md:42`). Cada base la sincroniza su propio proceso —la App escribe sólo en `desk` y el
  worker sólo en `zoho-hub` (`DEPLOY.md:33-36`)—, cada uno con su propio `migrate` y su propio `upsertTicket`. Por
  eso la comprobación de §4.4 (bloque «F1B-07») se hace **en `desk` tras el Deploy de la App y en `zoho-hub` tras
  el redespliegue del worker**. En `zoho-hub` la marca no la escribe nadie —quien la pone es la App, sobre `desk`
  (`apps/desk/server/db/prioridadCliente.ts:118`)—, pero el `SELECT` la nombra igual: allí la columna tiene que
  existir aunque esté siempre vacía.
- **Si la comprobación no devuelve la columna:** buscar `migrate: sentencia omitida` en el log del servicio, y
  revertir ese servicio (§4.5). No es un fallo que se arregle esperando: cada pasada volverá a fallar.

Lo mismo vale para `ov_elegida_en_app_at` y `ov_zoho_avisada`, que ese `SELECT` también nombra y que también son
columnas nuevas de este rango (`packages/zoho-sync/src/db/schema.sql:524-525`; `ae5aaf4` no las nombra). Son, por
tanto, **tres columnas de las que depende todo el sincronizador**, en las dos bases, y ninguna de las tres es
inerte en el worker (§2.2). La comprobación de §4.4 mira las tres.

**2 · F1B-07: los clientes Top 5 marcados ANTES del despliegue no se propagan solos.** La propagación ocurre sólo
al guardar la prioridad de un cliente (`apps/desk/server/routes/prioridad.ts:44`, que llama a
`fijarYPropagarPrioridadCliente`, `apps/desk/server/db/prioridadCliente.ts:106-124`); no hay relleno al arrancar ni
sentencia de esquema que toque filas. Lo dice el cambio como condición de despliegue
(`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/archive-report.md:87`,
`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/tasks.md:368-369`). **Tarea de persona
(Director Comercial): volver a guardar cada cliente Top 5 que estuviera marcado antes de este código** (§6.5).
*Matiz, comprobado:* si producción está de verdad en `ae5aaf4`, **no hay ninguno**, porque `ae5aaf4` no tiene ni
la tabla `cliente_prioridad` (`git grep -c "cliente_prioridad" ae5aaf4 -- apps packages` no devuelve nada) y la
lista Top 5 se marca por primera vez tras este Deploy, ya con la propagación. La tarea sólo muerde si entre tanto
se hubiera publicado `5f68822` o `24a14eb` y se hubiera marcado algún Top 5 con ellos; la consulta de §4.4 lo dice
(`filas_top5` distinto de cero justo después del Deploy).

**3 · F1C-05: las liberaciones NUEVAS no marcan `liberacion_sin_facturar`.** «Liberación sin factura» ya no
declara la casilla: declara motivo, fecha prevista y texto de la autorización
(`packages/shared/src/transitions.ts:246-247`). El motivo y la fecha van a las dos columnas nuevas
(`packages/zoho-sync/src/db/rows.ts:131`, por la regla de `apps/desk/server/transitionExec.ts:90-92`) y el texto, a
`custom_fields` (`apps/desk/server/services/ticketService.ts:133`). Nada escribe ya la columna
`liberacion_sin_facturar` desde la App: una liberación nueva **ni la marca ni la desmarca**, la deja como
estuviera (una prueba fija que queda vacía en un ticket que no la traía,
`apps/desk/server/liberacionSinFactura.test.ts:94`). Es la pregunta E-203 (`docs/sdd/ENTRADA.md:2011`). **Quién
lee hoy ese dato, y qué deja de ver** — tabla completa en §5.1; en corto: **la ficha del ticket**, que enseña la
casilla «Liberación del ticket sin facturar» sin marcar en los tickets liberados por la vía nueva
(`apps/desk/src/components/TicketProperties.tsx:88`). No hay ningún informe, indicador, guarda ni alarma en el
código que lea la columna. **Quien cuente liberaciones por esa columna —en SQL, en una exportación o en Zoho—
verá que deja de crecer el día del Deploy:** desde entonces se cuentan por `liberacion_motivo`.

**4 · F1C-05, aviso W2 del verify: la escritura del texto de la autorización no está probada contra PostgreSQL
real.** El texto se mezcla en `custom_fields` con el operador `jsonb || jsonb`
(`packages/zoho-sync/src/db/repo.ts:307-310`), y con este cambio la liberación usa esa mezcla **siempre**, con el
texto o con `null`. El motor de las pruebas no soporta ese operador, así que el arnés lo **emula**
(`apps/desk/server/testing/appHarness.ts:105-117`, enganchado en `apps/desk/server/testing/appHarness.ts:37`): lo
probado es la emulación, no el operador. Que en PostgreSQL una segunda liberación sin texto deje la clave vacía y
no herede el texto de la primera es **hipótesis**
(`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/verify-report.md:298-301`); está
registrado como E-206 (`docs/sdd/ENTRADA.md:2026`). **Es una comprobación a hacer en la primera liberación real
tras desplegar** (§6.6, paso P3, con su consulta).

---

## 1 · Resumen para quien publica

**Veredicto: `f619d04` es DESPLEGABLE sólo cuando se cumplan las condiciones de §0.** Hoy **no** lo es: falta la
respuesta a E-158 y faltan los dos recuentos de F1B-03 (§0 b), y eso no se puede esquivar apagando nada, porque no
hay interruptor (§10). Lo único desplegable hoy sin esperar ninguna respuesta es `5f68822`, con el paquete del
2026-10-03 y sus propias condiciones (§10).

Las migraciones de esquema son todas aditivas e idempotentes (§2), no hay ninguna variable de entorno nueva (§3) y
no queda ningún «no se despliega sin X» fuera de este documento (§7).

**El corte, en orden** (detalle en §4 y §6):

1. **Antes, sin desplegar nada:** los dos recuentos de F1B-03 y la respuesta a E-158; la confirmación de la lista
   de novedades y de la etiqueta de n8n (E-170); el cargo del Director Técnico (E-162 b); la consulta P-1 de
   F1F-05; el paso 1 del script de F1C-09; los recuentos P.3 de F1A-03; `SWEEP_ENABLED` y `SWEEP_DRY_RUN`; la
   decisión de la ráfaga; y nombrar quién asigna los cargos.
2. **Copia de la base y comprobación de que existe** (§4.1).
3. **Deploy de la App**, y en los minutos siguientes la consulta de §4.4 sobre `desk`, **incluido su bloque
   «F1B-07»** (las tres columnas de las que depende el sincronizador, §0 g). Si falta una tabla o columna, se
   revierte (§4.5).
4. **En el mismo corte:** paso 2 del script de F1C-09 y su recuento posterior; después, asignar los cargos de
   permiso (incluido «Especialista técnico») y marcar el Top 5, en ese orden. Si §4.4 dio `filas_top5` distinto de
   cero, volver a guardar esos clientes (§0 g, punto 2).
5. **Redespliegue del worker `hub-sync`**, con los dos valores de `SWEEP_*` ya mirados, y justo después el bloque
   «F1B-07» de §4.4 **sobre `zoho-hub`**.
6. **Después:** las verificaciones en la aplicación (§6) —entre ellas la primera liberación sin factura real, que
   es la comprobación de E-206—, la siembra de F1A-03 cuando llegue el dato, y la medición de F1F-05 desde el
   16/11.

**Lo que puede sorprender al equipo, nuevo desde el 2026-10-03** (lo anterior, en
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:200-210`):

1. **«Habilitar Servicio» sale desactivado en todo ticket sin remisión de entrada**, con el texto «No se puede
   habilitar el servicio: falta una remisión de entrada vigente…». Con la remisión creada pero sin confirmar, el
   botón está activo y aparece el aviso «Remisión de entrada sin confirmar» (F1B-03).
2. **El formulario de la remisión de entrada cambia entero**: lista de diez novedades en lugar del campo libre,
   casilla obligatoria «Rotulado y guardado», y fotos obligatorias de equipo, accesorios y embalaje, más una por
   cada novedad marcada. Ya no se ofrece enviar sin fotos si falta algo exigido (F1B-04).
3. **En «Solicitud repuestos» la casilla «Derivado a» abre con el Director Técnico**, y en «Entrega de Repuestos»,
   con el técnico que tomó el ticket. Quien ejecuta puede cambiarla (F1C-11).
4. **Aparece un octavo cargo de permiso, «Especialista técnico»**, que no concede ni quita nada por sí mismo (F1C-11).
5. **Los administradores ven en «Análisis» el enlace «Descargar indicadores (CSV)»**; el resto no lo ve (F1F-05).
6. **Un ticket en «Remisión creada» sin remisión de entrada vigente enseña el botón «Crear remisión»**; uno con la
   remisión confirmada, no (F1B-03, el caso sin salida).
7. **Marcar, cambiar o desmarcar un cliente Top 5 cambia en el acto la prioridad de sus tickets abiertos**, y el
   panel lo dice («N tickets abiertos actualizados»). Los tickets con un ajuste manual no se tocan. Si el Top 5 es
   más bajo que la prioridad que el ticket tenía, **el ticket baja** (E-190) (F1B-07).
8. **Aparece en la barra lateral la vista «Equipos en Remisión creada»**, con el que más tiempo lleva en ese estado
   arriba (F1B-07).
9. **El listado gana una caja «Buscar por número o serial»**; no se enseña en «Equipos en Remisión creada» (F1B-08).
10. **«Liberación sin factura» ya no pide una casilla: pide motivo (lista de tres), fecha prevista de facturación
    y, con la autorización excepcional, su texto**, y los pide de nuevo en cada liberación. En la ficha, la casilla
    «Liberación del ticket sin facturar» de los tickets liberados desde ahora **sale sin marcar** (F1C-05).

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — cincuenta y siete sentencias nuevas, todas al final

`git diff --shortstat ae5aaf4 f619d04 -- packages/zoho-sync/src/db/schema.sql` → «1 file changed, 270
insertions(+)», ninguna línea borrada: ninguna sentencia existente cambia. El diff es **un solo bloque**
(`@@ -446,3 +446,273 @@`): las 270 líneas nuevas son de la 449 a la 718, el final del fichero.

**Cómo se contó.** `schemaStatements` trocea el fichero por `;` a ciegas (`packages/zoho-sync/src/db/migrate.ts:19-21`),
así que una sentencia es un `;`. De la línea 449 a la 718 hay **57 caracteres `;`**, repartidos en **57 líneas**,
una por sentencia, y **ningún comentario lleva `;`**. Las **treinta y cinco** primeras (hasta la línea 676) son las
del paquete del 2026-10-03 y no se han movido: las 27 primeras están en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:157-180` y las ocho siguientes en
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:224-233`. Desde `5f68822` se añaden **42 líneas**
(`packages/zoho-sync/src/db/schema.sql:677-718`) con **veintidós** sentencias: diecisiete de F1B-04, que ya traía
el paquete del 2026-10-04, y **cinco nuevas**, tres de F1B-07 y dos de F1C-05.

| # | Sentencia | Línea | Esquema | ¿Calificada? | ¿Idempotente? |
|---|---|---|---|---|---|
| **36** | `CREATE TABLE IF NOT EXISTS public.catalogo_novedades (clave text PRIMARY KEY, etiqueta, orden, activo, excluye_demas, exige_texto)` | `packages/zoho-sync/src/db/schema.sql:682-689` | `public` | **Sí** | Sí |
| **37 a 46** | Diez `INSERT INTO public.catalogo_novedades … ON CONFLICT (clave) DO NOTHING`, una por novedad: `sin_novedad`, `golpe_carcasa`, `rayon_estetico`, `pantalla_danada`, `conector_danado`, `falta_accesorio`, `embalaje_inadecuado`, `humedad_suciedad`, `sello_roto`, `otro` | `packages/zoho-sync/src/db/schema.sql:690-699` | `public` | **Sí** | Sí: no pisa una fila existente |
| **47** | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS novedades jsonb` | `packages/zoho-sync/src/db/schema.sql:702` | `public` | **Sí** | Sí |
| **48** | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS novedad_otro text` | `packages/zoho-sync/src/db/schema.sql:703` | `public` | **Sí** | Sí |
| **49** | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS rotulado_at timestamptz` | `packages/zoho-sync/src/db/schema.sql:704` | `public` | **Sí** | Sí |
| **50** | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS rotulado_por text` | `packages/zoho-sync/src/db/schema.sql:705` | `public` | **Sí** | Sí |
| **51** | `ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS categoria text` | `packages/zoho-sync/src/db/schema.sql:706` | `public` | **Sí** | Sí |
| **52** | `ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS novedad text` | `packages/zoho-sync/src/db/schema.sql:707` | `public` | **Sí** | Sí |
| **53** · F1B-07 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz` | `packages/zoho-sync/src/db/schema.sql:710` | el de `tickets` (`desk`) | No, y es lo correcto: `tickets` es de `DESK_TABLES` | Sí |
| **54** · F1B-07 | `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text` | `packages/zoho-sync/src/db/schema.sql:713` | `public` | **Sí** | Sí |
| **55** · F1B-07 | `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL` | `packages/zoho-sync/src/db/schema.sql:714` | `public` | **Sí** | *Hipótesis:* sí —quitar un `NOT NULL` que ya no está no da error en PostgreSQL—; no lleva `IF`, y no se ha ejecutado dos veces contra una base real (§9) |
| **56** · F1C-05 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text` | `packages/zoho-sync/src/db/schema.sql:717` | el de `tickets` (`desk`) | No, y es lo correcto | Sí |
| **57** · F1C-05 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_prevista_facturacion date` | `packages/zoho-sync/src/db/schema.sql:718` | el de `tickets` (`desk`) | No, y es lo correcto | Sí |

**El bloque de F1B-07 es `packages/zoho-sync/src/db/schema.sql:708-714`** —cuatro líneas de comentario y tres
sentencias— y **el de F1C-05, `packages/zoho-sync/src/db/schema.sql:715-718`** —dos de comentario y dos
sentencias, en `packages/zoho-sync/src/db/schema.sql:717-718`—. **F1B-03 (en sus dos cambios), F1C-11, F1F-05 y
F1B-08 no tocan el esquema.**

- **Las seis columnas de F1B-04 son anulables, sin `DEFAULT`, sin `CHECK` y sin relleno.** `novedades` a `NULL` es
  la marca de remisión de legado (`packages/zoho-sync/src/db/schema.sql:700-701`).
- **Las cuatro columnas nuevas de F1B-07 y F1C-05 también: anulables, sin `DEFAULT`, sin `CHECK` y sin relleno.**
  `prioridad_en_app_at` vacía significa «manda Zoho» (`packages/zoho-sync/src/db/schema.sql:708-709`); `origen`
  vacío, «ajuste manual con motivo» (`packages/zoho-sync/src/db/schema.sql:711`); `liberacion_motivo` vacío, «sin
  liberar por la vía nueva» (`packages/zoho-sync/src/db/schema.sql:715`). Una prueba fija que la sentencia 53 no
  toca filas (`packages/zoho-sync/src/db/migrate.test.ts:753-763`). La lista cerrada de motivos no es un `CHECK`:
  la impone el servidor (`packages/zoho-sync/src/db/schema.sql:716`).
- **La sentencia 55 es la única del rango que no añade nada: relaja una restricción.** `a` deja de ser obligatoria
  para que una reversión pueda devolver un ticket a «sin prioridad»
  (`packages/zoho-sync/src/db/schema.sql:712`). No toca filas. *Consecuencia para la reversión:* §4.5 (q).
- **Las tres `ALTER TABLE tickets` van sin calificar a propósito**: `tickets` está en `DESK_TABLES`
  (`packages/zoho-sync/src/db/migrate.ts:63-64`) y aterriza donde diga el `search_path`, que con `DB_SCHEMA=desk`
  es `desk,public` (`packages/zoho-sync/src/db/pool.ts:5`). El guardián del esquema las cuenta así: 55 `ALTER`, 29
  calificadas y 26 sin calificar (`packages/zoho-sync/src/db/migrate.test.ts:374-376`). *Hipótesis:* que
  producción tenga `DB_SCHEMA=desk` en los dos servicios. Sin esa variable el valor por defecto es `public`
  (`packages/zoho-sync/src/config.ts:87`); que en producción vale `desk` lo afirman `debt.md:824` y
  `docs/runbooks/verificaciones-pendientes-F0.md:9`, que son citas de segunda mano, y ni `DEPLOY.md` ni el fichero
  de ejemplo de variables la nombran (§3). Para el worker no lo afirma nadie.
- **`liberacion_motivo` y `fecha_prevista_facturacion` están fuera de `TICKET_COLS`**
  (`packages/zoho-sync/src/db/repo.ts:44-54`): el sincronizador no las escribe ni las borra. `prioridad_en_app_at`
  tampoco está en esa lista, pero **sí la lee** (`packages/zoho-sync/src/db/repo.ts:67`): es la diferencia que
  importa (§0 g).
- **La tabla nueva de F1B-04 está en `PUBLIC_TABLES`** (`packages/zoho-sync/src/db/migrate.ts:73`, al final de la
  línea: `catalogo_novedades`). Nace con diez filas y sin clave foránea.
- **Es la primera siembra de datos que viaja en `schema.sql` dentro de este rango.** `ON CONFLICT DO NOTHING` no
  restaura una etiqueta editada por SQL, pero **sí reinserta una fila borrada** en cada arranque
  (`packages/zoho-sync/src/db/schema.sql:677-681`).
- **Ninguna toca las cuatro tablas replicadas** (`DEPLOY.md:42`): ni `tickets` ni `public.prioridad_ajustes` están
  en esa lista. Por eso la regla de orden de `DEPLOY.md:50-51` —el DDL primero en el suscriptor y después en el
  hub— **no aplica** a ninguna de las veintidós. El orden que sí importa es otro, dentro de cada proceso: la
  migración antes que el sincronizador (§0 g, punto 1).

**Totales del rango `ae5aaf4..f619d04`:** doce tablas nuevas, **veinticinco** columnas nuevas anulables y sin
`DEFAULT` sobre tablas existentes, **un `NOT NULL` retirado**, nueve índices —todos sobre tablas nuevas— y diez
filas sembradas. Nada se borra ni se renombra.

### 2.2 · Dónde se aplican, y qué se rompe si una sentencia se omite

Se aplican solas al arrancar la App (`apps/desk/server/index.ts:26-27`) y, sobre `zoho-hub`, al arrancar el worker
(`apps/hub-sync/src/hubSync.ts:13`). **En el worker, las de F1B-04, las dos de `public.prioridad_ajustes` y las dos
de F1C-05 son inertes** (`git grep -c` de `novedades`, `indicadores`, `recepcion`, `prioridad_ajustes`,
`liberacion_motivo` y `fecha_prevista_facturacion` sobre `apps/hub-sync` en `f619d04` no devuelve nada, y las dos
de F1C-05 están fuera de `TICKET_COLS`). **La sentencia 53 NO es inerte en el worker**: `upsertTicket` es código de
`packages/zoho-sync` que el worker ejecuta en cada ticket, y lee `prioridad_en_app_at`
(`packages/zoho-sync/src/db/repo.ts:67`). El detalle de las 35 anteriores está en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:250-290` y `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:261-270`.
Para las veintidós nuevas, leído en el código y **no ejecutado**:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| **sentencias 47 a 50 (columnas de `public.remisiones`)** | **Toda alta de remisión**, también la de legado | El `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`) |
| **sentencias 51 y 52 (columnas de `public.remision_fotos`)** | La subida de fotos, la lectura de las fotos de una remisión y **todo envío** de remisión | `apps/desk/server/db/remisiones.ts:195`, `apps/desk/server/db/remisiones.ts:204`; el envío lee las fotos antes de decidir (`apps/desk/server/routes/remision.ts:289`) |
| **sentencia 36 (`public.catalogo_novedades`)** | La lista del formulario, el alta con el formulario nuevo y **todo envío** de remisión, también de legado | `apps/desk/server/db/novedades.ts:13`; el envío lee el catálogo siempre (`apps/desk/server/routes/remision.ts:289`) |
| sentencias 37 a 46 (la siembra) | Con menos de diez filas, la lista sale incompleta; con cero, el alta responde 422 «La lista de novedades no está cargada» | `DEPLOY.md:256-257`, `packages/shared/src/recepcion.ts:63` |
| **sentencia 53 (`tickets.prioridad_en_app_at`) — en `desk` o en `zoho-hub`** | **Todo el sincronizador de tickets de esa base, en silencio**: ningún ticket de Zoho se inserta ni se actualiza; el proceso sigue en pie y sólo deja `persistTicket(<id>) falló:` en el log. En `desk`, además, guardar un Top 5 con tickets que cambian falla y se deshace entero | El `SELECT` previo de `upsertTicket` (`packages/zoho-sync/src/db/repo.ts:66-69`); el aislamiento por ticket (`packages/zoho-sync/src/sync.ts:125-133`); la propagación (`apps/desk/server/db/prioridadCliente.ts:118`), dentro de una transacción (`apps/desk/server/db/prioridadCliente.ts:107`) |
| **sentencia 54 (`public.prioridad_ajustes.origen`)** | Leer la prioridad de un ticket con su traza (el panel de prioridad del ticket), guardar la prioridad de **cualquier** cliente —la lectura de trazas va antes de decidir si hay algo que propagar— y crear un ticket para un cliente Top 5 cuando la prioridad final difiere de la pedida | `apps/desk/server/db/prioridadCliente.ts:80`, `apps/desk/server/db/prioridadCliente.ts:111`, `apps/desk/server/db/prioridadCliente.ts:119`, `apps/desk/server/services/equipoNuevo.ts:90` |
| sentencia 55 (`DROP NOT NULL` de `a`) | Desmarcar un Top 5 cuando alguno de sus tickets tiene que volver a «sin prioridad»: la traza de esa reversión no se puede insertar y **toda** la operación se deshace | `apps/desk/server/db/prioridadCliente.ts:119`, con `a` vacío (`packages/zoho-sync/src/db/schema.sql:712`) |
| **sentencias 56 y 57 (`tickets.liberacion_motivo`, `tickets.fecha_prevista_facturacion`)** | **Toda «Liberación sin factura»**: el `UPDATE` de la transición nombra las dos columnas. El resto de transiciones no | Las dos claves están en `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:131`), así que van a columna (`apps/desk/server/transitionExec.ts:90-92`) y entran en el `SET` (`packages/zoho-sync/src/db/repo.ts:301-302`) |

### 2.3 · Otros ficheros SQL del rango

Diez ficheros `.sql` cambian en `ae5aaf4..f619d04` (`git diff --stat ae5aaf4 f619d04 -- '*.sql'`). Tres los ejecuta
el arranque: `packages/zoho-sync/src/db/schema.sql` (§2.1) y, en el worker, `packages/zoho-sync/src/booksHub/schema-books.sql`
(+7) y `packages/zoho-sync/src/crmHub/schema-crm.sql` (+12), que no cambian desde `e8840e7` y están descritos en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:292-305`. Los otros siete están en `docs/sdd`, **no corren al
desplegar** (`docs` no entra en la imagen: `Dockerfile:16-22`) y los ejecuta una persona:

| Fichero | Qué hace | Quién y cuándo | ¿Escribe? |
|---|---|---|---|
| `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` (**nuevo desde `5f68822`**) | Cuenta los tickets que quedarán bloqueados por la guarda de F1B-03 | Gerencia, **antes** de desplegar (§0 b) | No |
| `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Histórico de llegadas a `Ingresado` sin remisión | Gerencia, **antes** de desplegar (§0 b) | No |
| `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` | Recuento y traslado de los tickets de servicio en `Pendiente` | Alfonso, en el corte (§0 a) | **Sí** (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`) |
| `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` | Compuestos y gases patrón | Alfonso, con el dato del Director Técnico (§6.1) | **Sí** |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` y el alta de los cierres de fin de año | Recuentos y cierres del paquete del 2026-10-01 | Como dice aquel paquete (§6.1) | Sólo el de cierres |

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Comprobado para `5f68822..f619d04`:

- `git diff --name-only -G"process\.env|import\.meta\.env|VITE_" 5f68822 f619d04 -- apps packages` → vacío.
- `packages/zoho-sync/src/config.ts`, que es donde se leen las variables de los dos servicios, **no cambia en todo
  el rango** `ae5aaf4..f619d04` (`git diff --stat` vacío).
- En el rango entero, las únicas líneas añadidas que nombran `process.env` están en el detector de citas, en el
  barrido de reconciliación y en sus pruebas (`apps/desk/server/citas/cli.ts`, `apps/desk/server/citas/git.ts`,
  `apps/desk/server/reconciliacion/cli.ts`, y cuatro ficheros de prueba o de apoyo a las pruebas): herramientas de
  repositorio que la App no carga, y que no leen ninguna variable propia (pasan el entorno a `git`).
- El fichero de ejemplo de variables **no aparece** entre los ficheros que cambian en `ae5aaf4..f619d04`
  (`git diff --stat ae5aaf4 f619d04` restringido a la raíz lista doce ficheros y no está; `git diff --stat ae5aaf4
  f619d04 -- .env.example` sale vacío). En esta sesión sí se pudieron leer **los nombres** de las variables que
  documenta —sólo los nombres, ningún valor—: son veinticuatro, y entre ellos están `SWEEP_ENABLED`,
  `SWEEP_DRY_RUN`, `N8N_AVISOS_WEBHOOK_URL` y `AVISOS_COPIA_EMAIL`.
- `DEPLOY.md` gana 76 líneas desde `5f68822`, **ninguna desde `24a14eb`**, y las dos secciones nuevas dicen
  expresamente que no hay interruptores ni variables nuevas (`DEPLOY.md:258-259`, `DEPLOY.md:265-267`). Las cuatro
  tandas posteriores no añadieron sección a `DEPLOY.md`: lo que piden a quien despliega está sólo en sus informes
  de archivo y en este paquete.

**Hallazgo: no hay ninguna variable nueva ni ningún interruptor para las ocho piezas nuevas** (§10). **Y una
corrección al paquete del 2026-10-04**, que afirmaba que ninguna variable se lee sin estar documentada: **`DB_SCHEMA`
se lee (`packages/zoho-sync/src/config.ts:87`) y no está ni en el fichero de ejemplo ni en `DEPLOY.md`**. No es
nueva —viene de antes de `ae5aaf4`— ni enciende un escritor, pero decide en qué esquema aterrizan las `ALTER TABLE
tickets` sin calificar (§2.1), así que este paquete depende de ella. Bajo la regla de secretos de `CLAUDE.md`, una
variable no documentada se trata como defecto: queda anotado aquí, sin corregir.

**Lo que no es nuevo pero este paquete obliga a mirar:** `SWEEP_ENABLED` y `SWEEP_DRY_RUN` (§0 c), y
`N8N_AVISOS_WEBHOOK_URL` y `AVISOS_COPIA_EMAIL` (`packages/zoho-sync/src/config.ts:114-117`), cuyos valores en
producción no están verificados (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:296-300`).

**Ninguna de las tandas nuevas enciende un escritor hacia fuera.** F1F-05 sólo lee
(`apps/desk/server/indicadores.ts:51-55`); F1B-03 sólo añade una lectura; F1C-11 cambia dos constantes; F1B-04
escribe en `public.remisiones` y `public.remision_fotos`, de la base de la App, y la categoría de la foto no viaja
a n8n (`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:89`). De las
cuatro posteriores: el caso sin salida de F1B-03 sólo cambia un predicado y un botón; F1B-08 sólo lee; F1B-07
escribe en `tickets` y en `public.prioridad_ajustes`, de la base de la App
(`apps/desk/server/db/prioridadCliente.ts:118-119`), y la escritura hacia Zoho queda expresamente fuera de su
alcance (`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/proposal.md:53`); F1C-05 escribe
en `tickets` y en la traza de la transición, de la base de la App (`packages/zoho-sync/src/db/repo.ts:311-318`).

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy — CONDICIÓN DE PARADA

Obligatoria por `decision/p55-backup` (`openspec/config.yaml:2253-2261`) y por
`decision/f1c09-copia-antes-de-desplegar` (§0 a). `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo
siguiente es **hipótesis**, no procedimiento verificado:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
# La cadena de conexión es la variable DATABASE_URL del servicio App: el NOMBRE, nunca su valor en un chat.
pg_dump --format=custom --file=desk_antes_de_f619d04.dump "$DATABASE_URL"
```

**Criterio de hecho, sea cual sea el método: existe un fichero de copia con fecha de hoy, fuera del servidor, y su
tamaño no es cero. Sin eso comprobado, no se despliega.**

Sobre `zoho-hub`: si `SWEEP_ENABLED=true` y `SWEEP_DRY_RUN=false`, decidir antes si se copia el hub (§0 c).

### 4.2 · Publicar

`DEPLOY.md` cubre el mecanismo y no se repite: App en `DEPLOY.md:177-180`, worker en `DEPLOY.md:186-205`.

- **Publicar `f619d04` entero, no un commit intermedio** (§7). Ya está empujado: `origin/main` es `f619d04`, con
  CI en verde.
- **App y worker son servicios independientes de la misma imagen** (`Dockerfile:27-29`). El worker hay que
  redesplegarlo aparte para que `afa4252` tenga efecto. Qué versión corre hoy el worker no está verificado.
- **Orden del corte:** copia comprobada → paso 1 de F1C-09 → Deploy de la App → §4.4 sobre `desk`, con su bloque
  «F1B-07» → paso 2 de F1C-09 y recuento posterior → cargos de permiso → Top 5 → worker → bloque «F1B-07» de §4.4
  sobre `zoho-hub`.
- **El orden «la migración antes que el sincronizador» no se ordena a mano:** lo hace cada proceso al arrancar
  (`apps/desk/server/index.ts:27`, `apps/hub-sync/src/hubSync.ts:13`). Lo que sí hay que hacer a mano es
  **comprobar que entró**, en cada base, porque `migrate` no se detiene si una sentencia falla (§0 g, punto 1).
- **App y worker no tienen que publicarse a la vez por causa del esquema.** Cada uno migra su propia base y
  `tickets` no se replica (`DEPLOY.md:42`): publicar la App con `f619d04` y dejar el worker en su versión anterior
  no rompe el worker, y al revés tampoco. *Hipótesis:* esto supone que el worker no escribe en `desk` ni la App en
  `zoho-hub`, que es lo que dice `DEPLOY.md:33-36` y no está verificado contra las variables de producción.

### 4.3 · La imagen

Sin cambios: ni `Dockerfile` ni `package.json` ni `package-lock.json` cambian en `5f68822..f619d04`. Que la imagen
de `f619d04` construya en EasyPanel es **hipótesis**: no se ha construido.

### 4.4 · Comprobar que producción está en el commit publicado

**El bundle** (mismo método que los paquetes anteriores):

1. Construcción local del árbol de `f619d04`, el 2026-10-04: fichero `index-DjybFcf5.js` (395,39 kB; 395.394
   bytes), sha256 `c57013def55628bf998398fd263b07a69b169b645127cfe6b84e699e3c2158be`. Se construyó dos veces, con
   la salida en dos carpetas distintas fuera del repositorio, y dio el mismo nombre y el mismo sha256.
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente qué `index-*.js`
   carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `f619d04`.** Si sale `index-BuzKRdWI.js`, es el bundle que el paquete
   del 2026-10-04 dio para `24a14eb` (`docs/sdd/Paquete_de_Despliegue_2026-10-04.md:32`): se publicó sin las cuatro
   tandas posteriores, y con el caso sin salida de F1B-03 abierto. Si sale `index-DZ1geyGk.js`, es el de `5f68822`
   (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:357-358`).

*Límites:* la referencia se construyó en Windows y producción construye en `node:22-alpine`; que den los mismos
bytes es **hipótesis**. Se construyó con `vite build`, sin el `tsc -b` que antepone `npm run build`. Y el bundle
sólo prueba el cliente.

**Que la migración entró — obligatorio, en los minutos siguientes al Deploy.** Consola de PostgreSQL de producción,
base `desk`, **sólo lectura**. Es la consulta del paquete del 2026-10-04 —que ya incluía la comprobación de
lectura de F1B-04 de `DEPLOY.md:240-251`— ampliada con las cuatro columnas nuevas de F1B-07 y F1C-05, la
comprobación de que `a` admite vacío, dos recuentos más y los dos tamaños que pide F1B-08. **No se ha ejecutado**
(§9). Detrás va, aparte, el bloque «F1B-07», que es el que se repite sobre `zoho-hub`.

```sql
BEGIN READ ONLY;

SELECT to_regclass('public.calendario_cierres')     AS cierres,
       to_regclass('public.equipos_cambios')        AS cambios,
       to_regclass('public.ov_asociaciones')        AS asociaciones,
       to_regclass('public.contratos')              AS contratos,
       to_regclass('public.alarmas_avisadas')       AS alarmas_avisadas,
       to_regclass('public.alarmas_corte')          AS alarmas_corte,
       to_regclass('public.cliente_prioridad')      AS cliente_prioridad,
       to_regclass('public.prioridad_ajustes')      AS prioridad_ajustes,
       to_regclass('public.gases_patron')           AS gases_patron,
       to_regclass('public.certificados_fabrica')   AS certificados_fabrica,
       to_regclass('public.clientes_provisionales') AS clientes_provisionales,
       to_regclass('public.catalogo_novedades')     AS catalogo_novedades;
-- Deben salir los DOCE nombres, ninguno NULL.

SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'), ('desk','tickets','ov_zoho_avisada'),
        ('desk','tickets','modalidad'),
        ('desk','tickets','prioridad_en_app_at'),
        ('desk','tickets','liberacion_motivo'),    ('desk','tickets','fecha_prevista_facturacion'),
        ('public','prioridad_ajustes','origen'),
        ('desk','equipos','fecha_adquisicion'),    ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),         ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),        ('desk','equipos','drive_url'),
        ('desk','equipos','compuesto'),            ('desk','equipos','pendiente_validar'),
        ('public','catalogo_modelos','compuesto'),
        ('public','remisiones','hay_novedad'),
        ('public','remisiones','novedades'),       ('public','remisiones','novedad_otro'),
        ('public','remisiones','rotulado_at'),     ('public','remisiones','rotulado_por'),
        ('public','remision_fotos','categoria'),   ('public','remision_fotos','novedad'),
        ('public','users','cargo_permiso'))
 ORDER BY 1, 2, 3;
-- Deben salir 25 filas, todas con is_nullable = YES y column_default vacío.
-- Si falta ('desk','tickets','prioridad_en_app_at'), ('desk','tickets','ov_elegida_en_app_at') o
--   ('desk','tickets','ov_zoho_avisada'), el SINCRONIZADOR está roto entero y en silencio: revertir ya.
-- Si falta ('desk','tickets','liberacion_motivo') o ('desk','tickets','fecha_prevista_facturacion'), no se
--   puede hacer NINGUNA «Liberación sin factura»: revertir.
-- Si falta ('public','prioridad_ajustes','origen'), no se puede guardar la prioridad de ningún cliente ni leer
--   la prioridad de un ticket: revertir.
-- prioridad_en_app_at debe salir con data_type = timestamp with time zone; fecha_prevista_facturacion, date;
--   liberacion_motivo y origen, text.
-- Si falta ('public','users','cargo_permiso'), NADIE puede usar la aplicación: revertir ya.
-- Si falta ('desk','equipos','pendiente_validar') o ('desk','equipos','compuesto'), no se puede leer
--   ningún equipo ni crear tickets con equipo registrado: revertir.
-- Si falta ('desk','tickets','modalidad'), no se puede crear ningún ticket.
-- Si falta una de las cuatro nuevas de public.remisiones, no se puede crear NINGUNA remisión: revertir.
-- Si falta una de las dos de public.remision_fotos, no se pueden subir fotos ni enviar remisiones: revertir.
-- novedades debe salir con data_type = jsonb; rotulado_at, timestamp with time zone; las demás nuevas, text.

SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente',
                     'idx_prioridad_ajustes_ticket', 'idx_gases_patron_cilindro',
                     'idx_certificados_fabrica_ticket')
 ORDER BY 1;
-- Deben salir 9 filas.

SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid) AS definicion
  FROM pg_constraint
 WHERE contype = 'c'
   AND conname IN ('contratos_fin_no_antes_de_inicio', 'prioridad_ajustes_motivo')
 ORDER BY 2;
-- Deben salir 2 filas.

SELECT conrelid::regclass AS tabla, pg_get_constraintdef(oid) AS clave
  FROM pg_constraint
 WHERE contype = 'p'
   AND conrelid IN (to_regclass('public.alarmas_avisadas'), to_regclass('public.alarmas_corte'),
                    to_regclass('public.cliente_prioridad'), to_regclass('public.prioridad_ajustes'),
                    to_regclass('public.gases_patron'), to_regclass('public.certificados_fabrica'),
                    to_regclass('public.clientes_provisionales'), to_regclass('public.catalogo_novedades'))
 ORDER BY 1;
-- Deben salir 8 filas. La nueva, con PRIMARY KEY (clave).

SELECT count(*) AS novedades, count(*) FILTER (WHERE activo) AS activas FROM public.catalogo_novedades;
-- Deben salir 10 y 10. Con menos de diez, la lista del formulario sale incompleta; con cero, el alta de
--   remisión responde 422 «La lista de novedades no está cargada».

SELECT (SELECT count(*) FROM public.cliente_prioridad)      AS filas_top5,
       (SELECT count(*) FROM public.prioridad_ajustes)      AS filas_ajustes,
       (SELECT count(*) FROM public.users WHERE cargo_permiso IS NOT NULL) AS usuarios_con_cargo,
       (SELECT count(*) FROM public.gases_patron)           AS gases,
       (SELECT count(*) FROM public.certificados_fabrica)   AS certificados,
       (SELECT count(*) FROM public.clientes_provisionales) AS provisionales,
       (SELECT count(*) FROM desk.equipos WHERE compuesto IS NOT NULL)  AS equipos_con_compuesto,
       (SELECT count(*) FROM desk.equipos WHERE pendiente_validar)      AS equipos_pendientes,
       (SELECT count(*) FROM public.remisiones WHERE novedades IS NOT NULL) AS remisiones_formulario_nuevo,
       (SELECT count(*) FROM desk.tickets WHERE prioridad_en_app_at IS NOT NULL) AS tickets_prioridad_en_app,
       (SELECT count(*) FROM desk.tickets WHERE liberacion_motivo IS NOT NULL)   AS tickets_liberados_via_nueva;
-- Justo después del Deploy, las once a 0: todo nace vacío y sin relleno.
-- Si filas_top5 NO es 0, hay clientes Top 5 marcados antes de este código: no se han propagado; hay que
--   volver a guardarlos uno a uno (§0 g, punto 2, y §6.5).

SELECT is_nullable FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'prioridad_ajustes' AND column_name = 'a';
-- Debe salir YES (sentencia 55). Con NO, desmarcar un Top 5 puede fallar entero (§2.2).

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después del Deploy; 1 fila tras la primera pasada (unos 3 minutos). Anotar `corte`.

SELECT (SELECT count(*) FROM desk.tickets) AS tickets, (SELECT count(*) FROM desk.equipos) AS equipos;
-- Dato que pide F1B-08: anotar las dos cifras y devolverlas al panel (§6.9).

ROLLBACK;
```

**El bloque «F1B-07» — la comprobación de lectura del sincronizador. Se ejecuta DOS veces: en `desk`, tras el Deploy
de la App, y en `zoho-hub`, tras el redespliegue del worker.** No nombra el esquema a propósito: en `desk` la tabla
vive en el esquema `desk`, y en qué esquema vive dentro de `zoho-hub` no está comprobado (§9). **No se ha
ejecutado.**

```sql
BEGIN READ ONLY;

SELECT current_database() AS base, table_schema, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'tickets'
   AND column_name IN ('prioridad_en_app_at', 'ov_elegida_en_app_at', 'ov_zoho_avisada')
 ORDER BY table_schema, column_name;
-- Deben salir TRES filas con el mismo table_schema: el esquema donde el servicio escribe sus tickets.
--   prioridad_en_app_at y ov_elegida_en_app_at, timestamp with time zone; ov_zoho_avisada, text; las tres, YES.
-- Si falta UNA, el SELECT previo de upsertTicket falla en cada ticket: el sincronizador de ESA base está
--   roto entero, y el proceso sigue en pie como si nada. Revertir ese servicio (§4.5).
-- Si salen filas de dos esquemas, la que cuenta es la del esquema que el servicio usa; anotar las dos.
-- Si no sale ninguna fila y la tabla existe, comprobar con qué rol se consulta: information_schema sólo
--   enseña las columnas de las tablas sobre las que el rol tiene algún privilegio.

SELECT max(synced_at) AS ultima_sincronizacion FROM tickets;
-- Va sin calificar: si la consola no encuentra la tabla, calificarla con el table_schema de la consulta anterior.
-- Señal de apoyo, NO prueba: anotar la hora y repetir pasados unos minutos. HIPÓTESIS: que avance en cada
--   pasada depende de que Zoho traiga tickets modificados. La prueba de que el sincronizador falla es la línea
--   del log, no esta hora.

ROLLBACK;
```

Si falta algo en cualquiera de los dos bloques, buscar `migrate: sentencia omitida` en el log del servicio
(`packages/zoho-sync/src/db/migrate.ts:33`) —y, para el bloque «F1B-07», `persistTicket(` seguido de `falló:`
(`packages/zoho-sync/src/sync.ts:132`)— y **pasar a §4.5**. Después: entrar en la aplicación y abrir el tablero.

**Y que la migración de F1C-09 entró:** el recuento posterior del paso 3 (§0 a), con el grupo 1 a 0.

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel.** La base no hay que tocarla para que `ae5aaf4` funcione:
las veinticinco columnas nuevas son anulables y sin `DEFAULT`, el `NOT NULL` retirado es de una tabla que
`ae5aaf4` no conoce, y `ae5aaf4` no nombra ninguna de las piezas nuevas de F1B-04, F1B-07 ni F1C-05 (`git grep -c
"catalogo_novedades\|novedad_otro\|rotulado_at\|prioridad_en_app_at\|prioridad_ajustes\|liberacion_motivo\|fecha_prevista_facturacion"
ae5aaf4 -- apps packages` → sin resultados). El razonamiento para las 35 sentencias anteriores, las señales que
obligan a revertir y lo que la reversión no deshace están en
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:460-503`. **La reversión es por servicio:** si lo que falla es el
bloque «F1B-07» sobre `zoho-hub`, se revierte el worker, no la App. Nuevos:

- **(m) La guarda de F1B-03 desaparece** y «Habilitar Servicio» vuelve a pasar sin remisión. No deja nada en la
  base.
- **(n) El catálogo de novedades y las seis columnas se quedan, sin uso.** Las remisiones creadas con el
  formulario nuevo conservan sus novedades y su rotulado en columnas que `ae5aaf4` no lee; sus observaciones sí
  llevan el texto compuesto (`apps/desk/server/routes/remision.ts:249`). *Hipótesis:* una remisión del formulario
  nuevo que quedara pendiente de envío se enviaría con la regla antigua.
- **(o) La derivación de F1C-11 deja de proponerse**; los tickets ya derivados conservan su derivado. El cargo de
  permiso «Especialista técnico» ya asignado queda en una columna que `ae5aaf4` no lee.
- **(p) La ruta y el enlace de F1F-05 desaparecen.** No escribió nada.
- **(q) F1B-07: las prioridades propagadas quedan sin protección.** La marca `prioridad_en_app_at` y las trazas se
  quedan en la base, pero `ae5aaf4` no lee la marca: su `upsertTicket` sólo se abstiene con `managed_by_app`
  (`packages/zoho-sync/src/db/repo.ts:58-59` en `ae5aaf4`) y la propagación **no** pone esa bandera
  (`apps/desk/server/db/prioridadCliente.ts:118`). O sea que, tras revertir, el sincronizador vuelve a escribir la
  prioridad de Zoho sobre los tickets propagados que no sean `managed_by_app`. Las filas de traza con `a` vacío se
  quedan en una tabla que `ae5aaf4` no nombra. La vista «Equipos en Remisión creada» desaparece.
- **(r) F1B-08: la caja de búsqueda desaparece.** No escribió nada.
- **(s) F1C-05: «Liberación sin factura» vuelve a pedir la casilla**, que es lo que `ae5aaf4` declara
  (`packages/shared/src/transitions.ts:247` en `ae5aaf4`). Los tickets liberados por la vía nueva conservan motivo
  y fecha en columnas que `ae5aaf4` no lee, y **se quedan sin la casilla marcada**.
- **(t) El caso sin salida de F1B-03 deja de tener botón**, pero con la reversión desaparece también la guarda (m),
  así que no hay ticket atascado.

**Señales nuevas que obligan a volver atrás:**

| Señal | Qué significa |
|---|---|
| No se puede crear ninguna remisión de entrada (500) | Falta una de las cuatro columnas nuevas de `public.remisiones` (§2.2) |
| No se puede enviar ninguna remisión ni subir fotos (500) | Falta `public.catalogo_novedades` o una columna de `public.remision_fotos` (§2.2) |
| **El log del servicio se llena de `persistTicket(<id>) falló:` y no entra ningún ticket nuevo de Zoho** | Falta `prioridad_en_app_at`, `ov_elegida_en_app_at` u `ov_zoho_avisada` en `tickets` **de esa base** (§0 g, §2.2). No se ve en pantalla |
| «Liberación sin factura» responde 500 | Falta `liberacion_motivo` o `fecha_prevista_facturacion` (§2.2) |
| Guardar la prioridad de un cliente responde 500, o el panel de prioridad de un ticket no carga | Falta `origen` en `public.prioridad_ajustes` (§2.2) |

**No son motivo de reversión:** el 422 «No se puede habilitar el servicio: falta una remisión de entrada vigente…»
(es la guarda; si alcanza a más tickets de los contados, se consulta, no se revierte a ciegas); los 422 del
formulario de recepción («Confirma que el equipo quedó rotulado y guardado», «Faltan fotos obligatorias: …», «Falta
la foto de cada novedad marcada: …»); el 403 de `/api/indicadores` a quien no es administrador; una casilla
«Derivado a» que no propone a nadie (es E-162 b); los 422 de la liberación sin factura («El motivo debe ser uno
de: …», «Fecha inválida en el campo: Fecha prevista de facturación», «Falta el texto de la autorización: …»,
`packages/shared/src/liberacionSinFactura.ts:31-34`); el 422 de la búsqueda («La búsqueda admite 64 caracteres como
máximo», `packages/shared/src/busquedaTickets.ts:33`); un ticket que **baja** de prioridad al marcar a su cliente
Top 5 (es lo construido, E-190); y los que ya listaba el paquete del 2026-10-03
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:500-503`).

---

## 5 · Cambios de comportamiento y riesgos

Producción no tiene ninguno de los de esta sección.

### 5.1 · Lo nuevo desde `5f68822`

| Cambio archivado (`tanda`, `cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|
| `2026-10-03-tipo-servicio-ticket-sin-ov` (**F1B-03** parte L, `cierra: no`; deja fuera la OVI de garantía y la supresión de los prefijos, `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:5`) | **(1)** «Habilitar Servicio» no pasa sin una remisión de entrada vigente: 422 «No se puede habilitar el servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.», y el botón sale desactivado con ese texto. **(2)** Con una remisión vigente en cualquier estado de envío, pasa. **(3)** Si ninguna de las vigentes está confirmada, el botón está activo y aparece el aviso «Remisión de entrada sin confirmar…», que no bloquea. **(4)** Alcanza a los tres orígenes y a todas las clasificaciones que pasan por la transición (§0 b) | Guarda: `apps/desk/server/services/ticketService.ts:131`, `apps/desk/server/services/ticketService.ts:273-277`. Lectura: `apps/desk/server/db/remisiones.ts:237-240`. Predicado y texto: `packages/shared/src/remision.ts:126-135`. Cliente: `apps/desk/src/lib/habilitarServicio.ts:14-21`, `apps/desk/src/lib/habilitarServicio.ts:29-33`, `apps/desk/src/components/TransitionPanel.tsx:130`, `apps/desk/src/components/TransitionPanel.tsx:137` |
| `2026-10-03-derivacion-repuestos-director-tecnico` (**F1C-11**, `cierra: si`; deja fuera el respaldo al Especialista técnico y la restricción de quién ejecuta cada paso) | **(1)** En «Solicitud repuestos» la casilla «Derivado a» abre con quien tenga el cargo de firma «Director Técnico». **(2)** En «Entrega de Repuestos» abre con el técnico que tomó el ticket. **(3)** Es una propuesta: quien ejecuta puede cambiarla y el servidor sólo exige que la persona exista y esté activa. **(4)** La lista de cargos de permiso gana «Especialista técnico», que no concede ni quita nada | Mapa: `packages/shared/src/transitions.ts:276`, `packages/shared/src/transitions.ts:281`. Propuesta en el cliente: `apps/desk/src/lib/personas.ts:73-79`. Lo único que impone el servidor: `apps/desk/server/services/ticketService.ts:138-142`. Octavo cargo: `packages/shared/src/cargos.ts:14`; que no concede nada, `openspec/changes/archive/2026-10-03-derivacion-repuestos-director-tecnico/verify-report.md:83` |
| `2026-10-03-recepcion-rotulacion-foto-entrada` (**F1B-04** sin accesorios, `cierra: no`; deja fuera los accesorios, la mitad de salida de la foto obligatoria y la pantalla para mantener la lista) | **(1)** El formulario de la remisión de entrada lleva una **lista de novedades** (diez, «Sin novedad» excluye a las demás, «Otro» exige texto) en lugar del campo libre. **(2)** Casilla obligatoria **«Rotulado y guardado»**: sin ella no se crea la remisión. **(3)** Cada foto lleva categoría; para **enviar** hacen falta las tres mínimas —equipo, accesorios y embalaje— y una foto por **cada** novedad marcada, y el rechazo nombra lo que falta. **(4)** Las remisiones de legado (sin novedades) siguen con la regla anterior. **(5)** La lista sólo se edita por SQL | Lista: `apps/desk/server/routes/novedades.ts:16-18`, `apps/desk/server/db/novedades.ts:11-14`. Alta: `apps/desk/server/routes/remision.ts:158`, `apps/desk/server/services/recepcion.ts:13-19`, `packages/shared/src/recepcion.ts:97-101`. Envío: `apps/desk/server/routes/remision.ts:289-293`, `packages/shared/src/recepcion.ts:151-162`, mínimas en `packages/shared/src/recepcion.ts:26`. Categoría: `apps/desk/server/routes/remision.ts:384`, `packages/shared/src/recepcion.ts:169-183`. Cliente: `apps/desk/src/components/CrearRemision.tsx:284`, `apps/desk/src/components/CrearRemision.tsx:299` |
| `2026-10-03-continuidad-indicadores` (**F1F-05**, `cierra: no`; deja fuera el 51 y el 55, que salen «sin dato», y la comparación efectiva) | **(1)** Los administradores ven en «Análisis» el enlace «Descargar indicadores (CSV)». **(2)** `GET /api/indicadores` devuelve, en JSON o CSV, los nueve indicadores por ticket y un resumen de comparación con el valor de Zoho, sin umbral ni veredicto. **(3)** Sin valor de Zoho sincronizado, el resumen lo dice y no da porcentaje. **(4)** Sólo lee | Ruta: `apps/desk/server/routes/indicadores.ts:41-54`. Lectura: `apps/desk/server/indicadores.ts:56-86`. Enlace: `apps/desk/src/components/Analisis.tsx:83`, `apps/desk/src/lib/indicadoresUrl.ts:16-18`. Cobertura: `openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:8-13` |
| **Nueva** · `2026-10-04-remision-creada-sin-salida` (**F1B-03**, el caso sin salida, `cierra: no`; deja fuera la OVI de garantía, los prefijos y la guarda de estado en el alta de remisión, `openspec/changes/archive/2026-10-04-remision-creada-sin-salida/archive-report.md:8-13`) | **(1)** Un ticket en `Remisión creada` **sin** remisión de entrada vigente enseña el botón «Crear remisión»; antes recibía el 422 de «Habilitar Servicio» y no tenía cómo cumplirlo. **(2)** Con una remisión pendiente de envío, el botón dice «Remisión pendiente de envío» y abre ésa. **(3)** Con una de entrada confirmada —el ticket sano— el botón no se ofrece. **(4)** Mientras las remisiones del ticket cargan, tampoco. **(5)** La guarda de «Habilitar Servicio» no cambia | Predicado: `packages/shared/src/transitions.ts:163-165`. Botón: `apps/desk/src/lib/botonRemision.ts:31`, `apps/desk/src/lib/botonRemision.ts:33-35`, `apps/desk/src/lib/botonRemision.ts:39-40`. Recorrido probado en el servidor: `apps/desk/server/remisionCreadaSinSalida.test.ts:31-39` |
| **Nueva** · `2026-10-04-propagar-top5-lista-remision-creada` (**F1B-07**, `cierra: no`; deja fuera la calificación del cliente sin contrato ni Top 5 y quién ajusta a mano fuera de los Top 5, `openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/archive-report.md:9-13`) | **(1)** Guardar la prioridad de un cliente —marcarlo Top 5, cambiarle la prioridad o desmarcarlo— **cambia en el acto la prioridad de sus tickets abiertos**, con una fila de traza por ticket, y el panel dice «N tickets abiertos actualizados». **(2)** Desmarcarlo los devuelve a la prioridad calculada. **(3)** Un ticket con un ajuste manual no se toca. **(4)** La prioridad propagada **no la pisa el sincronizador**, aunque el ticket venga de Zoho. **(5)** Un ticket creado para un cliente Top 5 guarda la prioridad pedida para poder volver a ella. **(6)** Vista nueva «Equipos en Remisión creada»: todos los tickets en ese estado, del que más tiempo lleva al que menos; sin entrada registrada, al final. **(7)** El panel de prioridad del ticket enseña «sin prioridad» cuando una reversión la dejó vacía. **(8)** Tras propagar, los tickets no aparecen como no leídos | Ruta: `apps/desk/server/routes/prioridad.ts:44`. Propagación: `apps/desk/server/db/prioridadCliente.ts:106-124`; qué cambia cada ticket, `packages/shared/src/prioridadPropagada.ts:41-50` (la exención, en `packages/shared/src/prioridadPropagada.ts:44`). Sincronizador: `packages/zoho-sync/src/db/repo.ts:76-78`. Alta bajo Top 5: `apps/desk/server/services/ticketService.ts:108`, `apps/desk/server/services/equipoNuevo.ts:90`. Lista: `apps/desk/server/routes/prioridad.ts:92-94`, `apps/desk/server/db/listaRemisionCreada.ts:13-16`, `packages/shared/src/listaPorEntrada.ts:10-16`. Cliente: `apps/desk/src/lib/boardView.ts:15`, `apps/desk/src/components/Sidebar.tsx:10`, `apps/desk/src/components/Top5Panel.tsx:28`, `apps/desk/src/components/PanelPrioridad.tsx:55` |
| **Nueva** · `2026-10-04-busqueda-ticket-serial` (**F1B-08**, la búsqueda, `cierra: no`; deja fuera «vistas equivalentes a Zoho», `openspec/changes/archive/2026-10-04-busqueda-ticket-serial/archive-report.md:10-13`) | **(1)** El listado tiene una caja «Buscar por número o serial». **(2)** Si el texto son dígitos, con o sin «#», encuentra el ticket de ese número **exacto** («86» no encuentra el 864). **(3)** Siempre busca el texto como trozo del serial, sin distinguir mayúsculas, en la copia del ticket y en el equipo enlazado. **(4)** Funciona en activos, en cerrados —el total y las páginas cuentan lo filtrado—, en «Todos» y en «Mis tickets». **(5)** Más de 64 caracteres, o un `q` repetido, responde 422. **(6)** En «Equipos en Remisión creada» la caja no se enseña y el texto se vacía al entrar. **(7)** El autocompletado por serial de la recepción pasa a recortar los espacios de los lados | Rutas: `apps/desk/server/routes/tickets.ts:104-114`, `apps/desk/server/routes/prioridad.ts:83-86`. Lectura de `q`: `apps/desk/server/util/busquedaTickets.ts:8-13`, `packages/shared/src/busquedaTickets.ts:28-37`. Patrón compartido: `packages/shared/src/busquedaTickets.ts:15-17`, que consume la recepción en `apps/desk/server/db/equipos.ts:60`. SQL: `packages/zoho-sync/src/db/busquedaTickets.ts:17-24`. Cliente: `apps/desk/src/components/BuscadorTickets.tsx:10-27`, `apps/desk/src/App.tsx:59`, `apps/desk/src/App.tsx:107` |
| **Nueva** · `2026-10-04-liberacion-sin-factura-motivo-fecha` (**F1C-05**, la paridad, `cierra: no`; deja fuera los Decisionales y el propietario del registro; la alarma por fecha vencida es de F1C-02, `openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:10-13`) | **(1)** «Liberación sin factura» deja de pedir la casilla y pide **motivo** (lista cerrada de tres), **fecha prevista de facturación** y **texto de la autorización**. **(2)** El texto sólo es obligatorio con el tercer motivo, «Autorización excepcional de Dirección Comercial». **(3)** La fecha tiene que ser un día real; **una fecha pasada se acepta** (E-201). **(4)** Los tres se piden de nuevo en cada liberación, sin prellenar; una segunda liberación no hereda el texto de la primera. **(5)** La ficha enseña motivo y fecha; el historial guarda los tres valores de cada liberación. **(6)** **Las liberaciones nuevas no marcan la casilla «Liberación del ticket sin facturar»**; las anteriores la conservan (abajo). **(7)** Quién puede liberar no cambia: área Comercial y cargo Director Comercial | Catálogo: `packages/shared/src/transitions.ts:246-247`. Guarda de contenido: `packages/shared/src/liberacionSinFactura.ts:23-37`, cableada tras el 409 de estado y los 403 de área y cargo en `apps/desk/server/services/ticketService.ts:134` (los 403, en `apps/desk/server/services/ticketService.ts:131`). Texto: `apps/desk/server/services/ticketService.ts:133`, `packages/shared/src/liberacionSinFactura.ts:40-44`. Columnas: `packages/zoho-sync/src/db/rows.ts:131`. Cliente: `apps/desk/src/components/TransitionPanel.tsx:33`, `apps/desk/src/components/TicketProperties.tsx:76`, `apps/desk/src/components/TicketProperties.tsx:184` |

**Quién lee hoy `liberacion_sin_facturar`, y qué deja de ver con las liberaciones nuevas (F1C-05).** Barrido:
`grep -rn "liberacion_sin_facturar\|liberacionSinFacturar" apps packages --include=*.ts --include=*.tsx
--include=*.sql`, hecho sobre `f619d04`. Da doce líneas en siete ficheros; `liberacionSinFacturar`, en camello, no
aparece en ninguna. **Ese barrido no caza al lector de la pantalla**, que lee el dato por su etiqueta y no por el
nombre de la columna: hizo falta un segundo, `grep -rn "Liberación del ticket sin facturar"`, y es el que encuentra
la ficha. Fuera de las pruebas son éstos:

| # | Dónde | Qué hace con el dato | Qué deja de ver con una liberación nueva |
|---|---|---|---|
| 1 | `packages/zoho-sync/src/db/schema.sql:39` | Define la columna. No lee | Nada: la columna sigue ahí |
| 2 | `packages/zoho-sync/src/db/rows.ts:45` | El tipo de la fila. No decide nada | Nada |
| 3 | `packages/zoho-sync/src/db/rows.ts:130` | La entrada de `PROMOTED_COLUMNS` que une la columna con la etiqueta «Liberación del ticket sin facturar». Por ella pasan los tres siguientes | — |
| 4 | `packages/zoho-sync/src/db/mappers.ts:55-59` | **Escribe**, no lee: copia a la columna el valor que trae Zoho, al sincronizar | Nada. Sigue llegando de Zoho en los tickets que la App no gestiona |
| 5 | `packages/zoho-sync/src/db/repo.ts:53` | **Escribe**: la columna está en `TICKET_COLS`, así que el sincronizador la reescribe con lo de Zoho, salvo en los tickets `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:71`) | Nada. Un ticket liberado en la App queda `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:298`) y el sincronizador ya no lo toca |
| 6 | `packages/zoho-sync/src/db/mappers.ts:224-230` | **Lee**: reconstruye, columna a etiqueta, los campos que la ficha recibe | Entrega la casilla vacía en los tickets liberados por la vía nueva |
| 7 | `apps/desk/src/components/TicketProperties.tsx:88` (se pinta en `apps/desk/src/components/TicketProperties.tsx:188-190`, con la regla de `apps/desk/src/components/TicketProperties.tsx:49-51`) | **Lee y enseña**: la casilla «Liberación del ticket sin facturar» de la sección «Verificación de procesos» de la ficha | **La casilla sale sin marcar** en todo ticket liberado desde el Deploy. Es el único sitio donde una persona lo nota |
| 8 | `apps/desk/server/transitionExec.ts:90-92` | Enruta a columna lo que una transición declare con esa etiqueta | Ya no enruta nada: ninguna transición la declara (`packages/shared/src/transitions.ts:247`) |

**Lo que NO hay:** ningún informe, indicador, exportación, guarda, alarma ni consulta de `apps` o `packages` lee
esa columna: los dos barridos no devuelven ninguna otra línea fuera de las pruebas. **Hay pruebas que la
nombran**, cinco ficheros, y no cuentan como lectores:
`apps/desk/server/liberacionSinFactura.test.ts`, `apps/desk/server/transicionesEjecucion.test.ts`,
`packages/shared/src/prioridad.test.ts`, `packages/zoho-sync/src/db/liberacionFicha.test.ts` y
`packages/zoho-sync/src/db/mappers.test.ts`. *Hipótesis:* que fuera del repositorio —un informe de Zoho, una
consulta guardada, una hoja de cálculo— alguien cuente liberaciones por esa casilla; es justo la pregunta E-203
(`docs/sdd/ENTRADA.md:2011`), y no es comprobable desde aquí. Un matiz: la liberación nueva **no desmarca** la
casilla. Un ticket que ya la traía marcada de un ciclo anterior la conserva.

**Las rutas nuevas o cambiadas, con su guarda.** Las dos de F1B-04 y F1F-05 se registran en
`apps/desk/server/app.ts:61`, sin condición; las de F1B-07 y F1B-08 viven en ficheros de rutas que ya estaban
registrados (`apps/desk/server/app.ts` no cambia desde `24a14eb`).

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `GET /api/novedades-remision` | Sólo sesión; devuelve las activas | `apps/desk/server/routes/novedades.ts:16-18` |
| `GET /api/indicadores` | 401 sin sesión → **403** sin ser administrador → 400 por parámetros → lectura | `apps/desk/server/routes/indicadores.ts:41-44` |
| `POST /api/remisiones/:id/fotos` (cambia) | 404 → 400 sin archivo → 415 → **422** por categoría no válida | `apps/desk/server/routes/remision.ts:378-387` |
| **Nueva** · `GET /api/remision-creada` | Sólo sesión; es una vista y no concede permiso | `apps/desk/server/routes/prioridad.ts:92-94` |
| `PUT /api/clients/:id/prioridad` (cambia: ahora propaga) | 404 el cliente no existe → **403** sin área Comercial y cargo Director Comercial → 422 por contenido → escritura y propagación en una transacción | `apps/desk/server/routes/prioridad.ts:34-45` |
| `GET /api/tickets` (cambia: acepta `q`) | 401 sin sesión → **422** por `q` no válido → lectura | `apps/desk/server/routes/tickets.ts:35`, `apps/desk/server/routes/tickets.ts:104` |
| `GET /api/mis-tickets` (cambia: acepta `q`) | 401 sin sesión → **422** por `q` no válido → lectura | `apps/desk/server/routes/prioridad.ts:83` |
| `POST /api/tickets/:id/transition`, para «Liberación sin factura» (cambia) | 409 de estado → 403 de área y de cargo → **422** de contenido, con la presencia delante | `apps/desk/server/routes/tickets.ts:192-193`; `apps/desk/server/services/ticketService.ts:126-131`, `apps/desk/server/services/ticketService.ts:134` |

**Regla 13, decisión a decisión, de los `.tsx` nuevos o cambiados:**

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Desactivar «Habilitar Servicio» sin remisión vigente (`apps/desk/src/components/TransitionPanel.tsx:130`, con `apps/desk/src/lib/habilitarServicio.ts:14-21`) | `apps/desk/server/services/ticketService.ts:273-277`: 422 |
| Enseñar el aviso «sin confirmar» (`apps/desk/src/components/TransitionPanel.tsx:137`) | **Ninguna, declarado:** es presentación; el servidor habilita igual (`apps/desk/src/lib/habilitarServicio.ts:23-28`) |
| Exigir novedades, texto de «Otro» y rotulado antes de crear (`apps/desk/src/components/CrearRemision.tsx:299`) | `apps/desk/server/routes/remision.ts:158`: 422 |
| No dejar enviar sin las fotos exigidas | `apps/desk/server/routes/remision.ts:289-293`: 422 |
| Subir cada foto con su categoría (`apps/desk/src/components/CrearRemision.tsx:82`) | `apps/desk/server/routes/remision.ts:384`: 422 |
| Enseñar el enlace de indicadores sólo al administrador (`apps/desk/src/lib/indicadoresUrl.ts:16-18`) | `apps/desk/server/routes/indicadores.ts:41`: 403 |
| Proponer al Director Técnico en la casilla «Derivado a» (`apps/desk/src/lib/personas.ts:74-79`) | **Ninguna, declarado:** el servidor no impone el destinatario (`apps/desk/server/services/ticketService.ts:138-142`); es la pregunta E-160 (`docs/sdd/ENTRADA.md:1792`) |
| **Nueva** · Ofrecer «Crear remisión» sólo en los tres orígenes de «Habilitar Servicio» (`apps/desk/src/lib/botonRemision.ts:31`) | **Ninguna, declarado y no corregido:** el alta de remisión no lee el estado del ticket (`apps/desk/server/routes/remision.ts:120-264`). Es el punto 2 de la regla 13 —sin contrapartida, el cliente es la guarda— y la pregunta E-184 (`docs/sdd/ENTRADA.md:1916`). El hueco es anterior a este cambio |
| **Nueva** · Pedir `/api/remision-creada` y enseñar la lista tal como llega, sin filtrar ni reordenar (`apps/desk/src/App.tsx:69`) | `apps/desk/server/routes/prioridad.ts:92-94`; el orden lo pone `apps/desk/server/db/listaRemisionCreada.ts:16` |
| **Nueva** · Enseñar «N tickets abiertos actualizados» (`apps/desk/src/components/Top5Panel.tsx:28`) | El recuento lo devuelve `apps/desk/server/db/prioridadCliente.ts:122`; quién puede guardar, `apps/desk/server/routes/prioridad.ts:40`: 403 |
| **Nueva** · Enviar el texto de búsqueda tal cual, con `maxLength` 64 (`apps/desk/src/components/BuscadorTickets.tsx:19`) | `packages/shared/src/busquedaTickets.ts:33`, que da el 422 en `apps/desk/server/util/busquedaTickets.ts:10` |
| **Nueva** · Motivo y fecha obligatorios, sólo tres motivos, y no prellenar al volver a liberar (`apps/desk/src/components/TransitionPanel.tsx:33`) | `packages/shared/src/liberacionSinFactura.ts:31-34`, cableada en `apps/desk/server/services/ticketService.ts:134`: 422. No prellenar no necesita contrapartida: el servidor lee sólo lo que llega y reescribe el texto (`apps/desk/server/services/ticketService.ts:133`) |

La tabla completa de las cuatro tandas nuevas —seis, siete, nueve y siete decisiones— está en sus informes de
verificación, con la prueba de cada una: `openspec/changes/archive/2026-10-04-remision-creada-sin-salida/verify-report.md:69`,
`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/verify-report.md:201-215`,
`openspec/changes/archive/2026-10-04-busqueda-ticket-serial/verify-report.md:112-129` y
`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/verify-report.md:146-159`. **La única sin
línea de servidor es la primera de arriba** (E-184).

### 5.2 · Lo que arrastra del 2026-10-03, sin cambios de contenido

Todo lo de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:513-520` (F1A-03, F1C-09, F1C-10, F1B-15, `afa4252` y el
barrido de reconciliación), sus rutas (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:524-530`) y lo que aquél
arrastraba del 2026-10-01 (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:547-554`).

**Cuatro filas cambian de contenido por las tandas nuevas:** la guarda de «Habilitar Servicio» de F1B-15 (alta
pendiente) convive ahora con la de F1B-03, que corre justo detrás en la misma línea
(`apps/desk/server/services/ticketService.ts:131`); la novedad con foto del F1B-04 anterior pasa a ser la regla
de las remisiones de legado (`packages/shared/src/recepcion.ts:154`); **guardar la prioridad de un cliente, que en
`24a14eb` sólo escribía la fila del cliente (`fijarPrioridadCliente`), ahora la escribe y propaga a sus tickets
abiertos** (`apps/desk/server/routes/prioridad.ts:44`, §5.1); y **la «Liberación sin factura» que aquel paquete describía por su casilla y su cargo conserva el cargo y
cambia la casilla por tres campos** (§5.1). El orden «primero los cargos, después el Top 5» de §0 (f) sigue
valiendo, y ahora pesa más: marcar un Top 5 escribe en el acto sobre tickets abiertos.

### 5.3 · Riesgos que se publican a sabiendas

**Nuevos.**

**R39 · F1B-03 bloquea tickets el día del Deploy, y cuántos no está medido.** Los dos recuentos no se han
ejecutado. Alcanza a «Equipo nuevo» por un supuesto no decidido (E-158). **La tercera parte de este riesgo, tal
como la escribió el paquete del 2026-10-04 —un ticket en `Remisión creada` sin remisión vigente no tenía botón
para crearla—, queda retirada por `remision-creada-sin-salida`** (§0 b): ese ticket tiene ahora el botón, y el
recorrido está probado en el servidor. Lo que queda es saber si hay alguno (E-185).

**R40 · La decisión que sostiene la guarda no está registrada como clave** en `openspec/config.yaml` (E-159,
`docs/sdd/ENTRADA.md:1787`). No bloquea el despliegue. Además, mover el par de guardas de «Habilitar Servicio»
delante de cargo, prioridad o verificación no lo caza ninguna prueba
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:122-125`).

**R41 · F1B-04 se publica con cinco preguntas abiertas** (E-163 a E-167, `docs/sdd/ENTRADA.md:1807`,
`docs/sdd/ENTRADA.md:1812`, `docs/sdd/ENTRADA.md:1817`, `docs/sdd/ENTRADA.md:1822`, `docs/sdd/ENTRADA.md:1827`):
una foto por cada novedad o basta una; quién edita la lista y dónde; «Falta un accesorio» exige una foto de algo
que no está; un equipo sin accesorios o sin embalaje tiene que subir otra foto para poder enviar; y el rotulado se
confirma antes de que exista la etiqueta. Mientras no haya respuesta rige lo construido, que es lo más estricto.
**Alcance pendiente de Gerencia, no bloqueo del despliegue.**

**R42 · F1C-11 depende de un texto tecleado a mano.** Si el cargo de firma del Director Técnico no está escrito
así, no hay propuesta ni aviso (E-162 b). Y la derivación es propuesta, no imposición (E-160).

**R43 · F1F-05: la ruta sin periodo carga todos los tickets, sin tope, y el enlace no pasa periodo**
(`apps/desk/server/indicadores.ts:61`, `apps/desk/server/indicadores.ts:69`, `apps/desk/src/components/Analisis.tsx:83`;
`openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:89`). Su coste en producción es
**hipótesis sin medir**. Cómo entrega la base real una columna de fecha sólo se probó con filas simuladas
(`openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:125-127`).

**R44 · F1F-05 se publica con diez preguntas abiertas** (E-171 a E-180, de `docs/sdd/ENTRADA.md:1847` a
`docs/sdd/ENTRADA.md:1894`) y un hallazgo medido: Zoho no descuenta festivos, así que la medición a la letra
quedará bajo el 95 % en esos tickets (E-182, `docs/sdd/ENTRADA.md:1904`). Ninguna bloquea el despliegue; deciden
cómo se lee la comparación.

**R45 · IV-12 gana un tercer punto**: la guarda nueva de recepción del alta corre antes de «Orden de venta no
encontrada» (`apps/desk/server/routes/remision.ts:158`, `apps/desk/server/routes/remision.ts:220`; E-169,
`docs/sdd/ENTRADA.md:1837`). Un alta con novedades inválidas y una orden inexistente da el error de las novedades.

**Nuevos de este paquete (R46 a R51).**

**R46 · F1B-07: todo el sincronizador depende de una columna cuya migración puede fallar sin que nadie se entere.**
`migrate` no se detiene (`packages/zoho-sync/src/db/migrate.ts:29-35`) y el fallo posterior es una línea de log por
ticket (`packages/zoho-sync/src/sync.ts:125-133`). En las dos bases. La mitigación es la comprobación de lectura de
§4.4, que no es opcional (§0 g, punto 1). **No ejecutado: sale de leer el código.**

**R47 · F1B-07 escribe sobre tickets abiertos en el acto, con seis supuestos sin decidir** (E-188 a E-193, de
`docs/sdd/ENTRADA.md:1936` a `docs/sdd/ENTRADA.md:1961`). Los que se notan el primer día: **un Top 5 más bajo que
la prioridad que el ticket tenía lo baja**, salvo contrato vigente (E-190); una prioridad cambiada en una
transición entre marcar y desmarcar se pierde al revertir (E-189); y tras desmarcar, la marca se conserva y sigue
mandando la App sobre Zoho (E-188). Además: la atomicidad de la propagación está probada **por secuencia, no por
efecto sobre filas**, porque el motor de las pruebas no revierte (aviso W-1,
`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/archive-report.md:51-52`), y la
propagación lee tickets y trazas sin bloquear las filas (E-194, `docs/sdd/ENTRADA.md:1966`): un ajuste manual
confirmado en ese instante podría perder su exención. **Hipótesis sin probar**; exige concurrencia real.

**R48 · F1B-08: la búsqueda es un `LIKE` con comodín delante, sin índice.** Que la tabla tenga «miles de filas» y
el coste sea despreciable es **hipótesis** del diseño, a confirmar con el recuento que pide a quien despliegue
(`openspec/changes/archive/2026-10-04-busqueda-ticket-serial/archive-report.md:77-78`; §4.4 lo incluye). Se
publica con cinco preguntas (E-195 a E-199, de `docs/sdd/ENTRADA.md:1971` a `docs/sdd/ENTRADA.md:1991`): la que
más se nota es que **un ticket histórico sin copia del serial y sin equipo enlazado no se encuentra por serial**
(E-197). Y un arreglo del cliente quedó sin prueba automática, por ser `.tsx`: el vaciado del texto al entrar en
«Equipos en Remisión creada»
(`openspec/changes/archive/2026-10-04-busqueda-ticket-serial/archive-report.md:52-54`).

**R49 · F1C-05 cambia lo que significa «liberado sin factura» en los datos.** (a) Las liberaciones nuevas no
marcan la casilla (E-203): §0 (g), punto 3. (b) **Los tickets que ya estén en `Por Entregar / Sin facturar` el día
del Deploy se liberaron con la casilla y no tienen ni motivo ni fecha**; no hay relleno (E-204,
`docs/sdd/ENTRADA.md:2016`). (c) Una fecha prevista **pasada** se acepta (E-201, `docs/sdd/ENTRADA.md:2001`).
(d) Una segunda liberación borra de la ficha el texto de la primera; el historial lo conserva (E-205,
`docs/sdd/ENTRADA.md:2021`). (e) **La mezcla de `custom_fields` no está probada contra PostgreSQL real** (aviso
W2, E-206): §0 (g), punto 4. Ninguna bloquea el despliegue; la (e) pide una comprobación en la primera liberación
real.

**R50 · El caso sin salida de F1B-03 se cierra por el botón, no por el servidor.** El alta de remisión sigue sin
leer el estado del ticket (E-184), y la anulación de una remisión y la sincronización del estado del ticket siguen
sin compartir transacción (E-186). Los dos huecos son anteriores a este paquete; se publican declarados.

**R51 · `DB_SCHEMA` decide dónde aterrizan tres de las cinco sentencias nuevas y no está documentada** donde la
regla de secretos pide (§3). Su valor en producción, para la App y para el worker, es hipótesis (§9).

**Del paquete del 2026-10-03, con su estado de hoy:** R32 a R38 siguen como están escritos
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:564-600`), y la tabla de los riesgos del 2026-10-01, también
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:605-619`). Ninguno se cierra con las ocho piezas nuevas.

---

## 6 · Tareas de persona — por dueño y en orden de ejecución

Todas las tareas de persona de los cambios archivados cuyos commits están en `ae5aaf4..f619d04` y que no tienen
resultado. **Archivar no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). Las del paquete del 2026-10-03
se arrastran completas y aquí se remite a su paso a paso. Las de las ocho piezas nuevas van enteras; las de las
cuatro últimas van marcadas **Nueva**.

Fuentes de las nuevas: `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:110-118`,
`openspec/changes/archive/2026-10-03-derivacion-repuestos-director-tecnico/archive-report.md:86-90`,
`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:103-107`,
`openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:115-121`, y las entradas E-158,
E-160, E-162 a E-170 y E-181 de `docs/sdd/ENTRADA.md`. De las cuatro últimas:
`openspec/changes/archive/2026-10-04-remision-creada-sin-salida/archive-report.md:85-89`,
`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/archive-report.md:92-96`,
`openspec/changes/archive/2026-10-04-busqueda-ticket-serial/archive-report.md:82-88`,
`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/archive-report.md:91-96`, y las entradas
E-184 a E-206.

### 6.1 · Alfonso (Gerencia) y quien administra el despliegue

| Cuándo | Tarea (con su cambio) | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Antes — PARADA** | **Los dos recuentos de F1B-03 en producción**, y entregar las cifras | Publicar la guarda | Abajo |
| **Antes** | **P-1 de `continuidad-indicadores`** — la consulta de sólo lectura de `DEPLOY.md:272-298` | Saber si la comparación tendrá valores de Zoho (si no, E-173) | Abajo |
| **Antes — PARADA** | **Copia de la base y comprobar que existe** | El Deploy entero | §4.1 |
| **Antes** | Recuento previo de F1C-09; P.3 de `verificacion-gas-patron-certificado`; comprobar `SWEEP_ENABLED` y `SWEEP_DRY_RUN`; y las cinco arrastradas del 2026-10-01 | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:641-649` y sus pasos, `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:657-695` |
| **Durante el corte** | Paso 2 del script de F1C-09 y recuento posterior; paso 6 de P.2 de `alarmas-horas-habiles` | Que ningún ticket de servicio quede en `Pendiente` sin botones | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:650-651` |
| **Durante el corte** | **Comprobación de lectura de F1B-04** (diez filas y seis columnas) | Dar F1B-04 por publicada | §4.4 la incluye; origen, `DEPLOY.md:234-261` |
| **Nueva · Durante el corte, justo tras el Deploy de la App** | **Comprobación de lectura de F1B-07 sobre `desk`**: las tres columnas de `tickets` de las que depende el sincronizador, y con ella las de F1C-05 | Saber que el sincronizador de `desk` no está roto en silencio, y que se puede liberar sin factura | §4.4, la consulta larga y el bloque «F1B-07»; razón, §0 (g) |
| **Nueva · Justo tras redesplegar el worker** | **La misma comprobación de F1B-07 sobre `zoho-hub`** | Saber que el sincronizador del hub no está roto en silencio | §4.4, bloque «F1B-07» |
| **Nueva · Durante el corte** | **Mirar `filas_top5` en §4.4.** Si no es cero, avisar al Director Comercial: hay clientes Top 5 que volver a guardar | Que la propagación alcance a los Top 5 marcados antes | §0 (g), punto 2; §6.5 |
| **Nueva · Antes, con los dos recuentos de F1B-03** | **E-185** — leer, en el recuento del 2026-10-03, la fila de estado `Remisión creada` con `sin_remision_vigente` | Saber si al publicar hay tickets que usarán el botón nuevo. **Informativo, no bloquea** | `docs/sdd/ENTRADA.md:1921`; es el mismo recuento de abajo |
| **Antes del viernes 13/11/2026** | **P-2 de `continuidad-indicadores`** — que F1F-05 esté desplegada | Medir desde el 16/11 | §0 (d) |
| **Después** | Verificación en la app de F1C-09; siembra de F1A-03 cuando llegue el dato; cierres de fin de año; y las verificaciones arrastradas | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:652-655` y `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:670-718` |

**Los dos recuentos de F1B-03, paso a paso.** Sin desplegar nada; se pueden hacer hoy.

1. Conectarse a la base `desk` de producción como siempre. **No pegar la cadena de conexión ni la contraseña en
   ningún chat, captura ni documento.**
2. Ejecutar entera `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`. Devuelve una fila por
   estado, clasificación y `managed_by_app`, y una de total. Anotar todas las filas.
3. Ejecutar entera `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`. Devuelve una fila
   (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:68-75`). Anotarla.
4. **Devolver al panel:** de la primera, el total de `sin_remision_vigente` y, aparte, las filas de clasificación
   «Equipo nuevo» y las de estado `Remisión creada`; de la segunda, `llegaron` y `sin_remision_al_llegar`.
5. Con esas cifras delante, Gerencia responde E-158 (§6.2).

**P-1 de `continuidad-indicadores`, paso a paso.** Ejecutar el bloque de `DEPLOY.md:276-298`, que es una
transacción de sólo lectura. Devolver si aparecen, y dónde (`custom_fields` o `raw`), los nombres de los nueve
indicadores y de la calificación de satisfacción.

### 6.2 · Gerencia (decisiones)

| Cuándo | Decisión | Qué desbloquea | Dónde está |
|---|---|---|---|
| **Antes — PARADA** | **E-158** — ¿la guarda de remisión alcanza a los tickets de «Equipo nuevo»? (con Servicio Técnico) | **Publicar `f619d04`.** Si es «no», hace falta código nuevo y este paquete no vale | `docs/sdd/ENTRADA.md:1782` |
| **Antes** | P.3 de `alarmas-horas-habiles` (la ráfaga); la precondición de P.1 de `permisos-por-cargo`; y cuál de las dos lecturas de la siembra vale | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:724-726` |
| Sin orden | **E-160** — ¿la derivación al Director Técnico se propone o se impone? | Si hay cambio nuevo con la guarda. **No bloquea** | `docs/sdd/ENTRADA.md:1792` |
| Sin orden | **E-163 a E-167** (con Servicio Técnico) — las cinco de la recepción | Alcance de F1B-04. **No bloquean** | R41 |
| Sin orden | **E-171 a E-180** — las diez de los indicadores | El 51, el 55 y cómo se lee la comparación. **No bloquean** | R44 |
| Sin orden | **E-157** — qué es «crear la OVI de garantía» en Desk | La parte de OVI de F1B-03, no construida | `docs/sdd/ENTRADA.md:1777` |
| **Nueva** · Sin orden | **E-184** — ¿debe el servidor impedir crear una remisión de entrada fuera de la fase inicial? | Si se abre un cambio que imponga el estado en el alta. **No bloquea** | `docs/sdd/ENTRADA.md:1916` |
| **Nueva** · Sin orden | **E-188 a E-193** — las seis de la propagación del Top 5: si manda la App sobre Zoho tras propagar, si una prioridad puesta en una transición exime al ticket, **si el Top 5 también baja**, qué trae la lista de «Remisión creada», si la lista pinta el tiempo, y qué base se guarda al nacer bajo Top 5 | Alcance de F1B-07. **No bloquean**; mientras tanto rige lo construido | R47 |
| **Nueva** · Sin orden | **E-195 a E-199** — las cinco de la búsqueda: si se conserva al cambiar de vista, número exacto o por trozo, **relleno de los tickets antiguos sin copia del serial** (con la medición de quien despliegue), si cubre asunto, cliente y contacto, y si cubre la lista de «Remisión creada» | Alcance de F1B-08. **No bloquean** | R48 |
| **Nueva** · Sin orden | **E-201 a E-205** — las cinco de la liberación: si la fecha tiene que ser futura, si el texto es obligatorio con los tres motivos, **cómo se cuentan las liberaciones ahora que la casilla no se marca**, qué se hace con los tickets ya liberados sin motivo ni fecha, y si una segunda liberación debe borrar el texto de la primera | Alcance de F1C-05 y de la alarma de F1C-02. **No bloquean** | R49 |
| **Desde el 16/11** | **P-3 de `continuidad-indicadores`** (con Servicio Técnico y Comercial) — comprobar las cuatro semanas y explicar por escrito cada diferencia mayor de un día | Dar los nueve indicadores por buenos | `docs/sdd/ENTRADA.md:1899` |
| Sin orden | Las del paquete anterior que siguen abiertas | Lo que cada una dice allí | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:727-731` |

### 6.3 · Administrador de la aplicación

| Cuándo | Tarea | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Antes** | **E-162 (b)** — en la pantalla de usuarios, confirmar que el cargo de quien es Director Técnico está escrito exactamente «Director Técnico» | Que la derivación de F1C-11 proponga a alguien | Abajo |
| **Durante el corte, lo primero tras §4.4 y la migración** | **P.1 de `permisos-por-cargo`** — asignar los cargos de permiso, empezando por el Director Comercial; **y con ellos E-162 (a): «Especialista técnico» a Johny Luna** | Que Comercial recupere la «Liberación sin factura»; cumplir `decision/cargo-encargado-de-inventario` | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:739` |
| **Después** | **P-4 de `continuidad-indicadores`** — el enlace de descarga | Verificación de F1F-05 | Abajo |
| **Después** | **Verificación en la app de F1C-11** (con un usuario de Servicio Técnico) | Verificación de la tanda | Abajo |

**E-162 (b), paso a paso.** Pantalla de usuarios → abrir a la persona que es Director Técnico → leer su cargo de
firma. La comparación ignora mayúsculas y espacios de más (*hipótesis*, por el nombre de la función `normalizar`
de `apps/desk/src/lib/personas.ts:75`, que no se leyó entera); un cargo distinto —«Director de Servicio Técnico»,
por ejemplo— no casa. *Hipótesis:* que la pantalla de usuarios de producción enseñe ya ese campo; la columna
existe en el esquema de `ae5aaf4`.

**P-4 de `continuidad-indicadores`, paso a paso** (`DEPLOY.md:307-308`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Con un administrador, abrir «Análisis» y pulsar «Descargar indicadores (CSV)» | Se descarga un fichero `indicadores-` con la fecha de hoy |
| 2 | Abrirlo en la hoja de cálculo | Se abre sin asistente de importación: columnas separadas y acentos correctos |
| 3 | Con un usuario que no sea administrador, abrir «Análisis» | El enlace no aparece |

**Verificación en la app de F1C-11.** El cambio no escribió pasos; éstos salen de lo construido (§5.1):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Ticket de servicio en `En Proceso` → «Solicitud repuestos» | La casilla «Derivado a» abre con el Director Técnico |
| 2 | Ese ticket, ya en `Solicitado` → «Entrega de Repuestos» | La casilla abre con el técnico que tomó el ticket |
| 3 | Pantalla de usuarios → selector «Cargo de permiso» | Ofrece ocho cargos, entre ellos «Especialista técnico» |

⚠️ Los pasos 1 y 2 mueven un ticket real: hacerlos sobre uno que de verdad pida repuestos, o sobre uno de prueba.

### 6.4 · Director Técnico

Sin tareas nuevas. Sigue pendiente la entrega de gases patrón y compuestos de F1A-03
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:745`).

### 6.5 · Director Comercial

La lista Top 5 se marca como decía el paquete del 2026-10-03
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:751-754`), **después** de los cargos de permiso. Lo que cambia con
F1B-07:

| Cuándo | Tarea | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Nueva · Durante el corte, tras los cargos** | Marcar el Top 5 **sabiendo que cada guardado cambia en el acto la prioridad de los tickets abiertos de ese cliente** | Que la cola del taller refleje el Top 5 desde el primer día | El panel responde «N tickets abiertos actualizados» |
| **Nueva · Durante el corte, sólo si `filas_top5` no era cero** | **Volver a guardar cada cliente Top 5 que ya estuviera marcado antes de este Deploy** | Que esos clientes se propaguen: no lo hacen solos (§0 g, punto 2) | Abajo |

**Volver a guardar un Top 5, paso a paso.** Abrir la lista Top 5 → por cada cliente que ya estuviera marcado,
guardar de nuevo su prioridad → anotar el número de tickets que el panel dice haber actualizado. El servidor
propaga en cada guardado, cambie o no la fila del cliente (`apps/desk/server/db/prioridadCliente.ts:108-110`).
*Hipótesis:* que el panel deje guardar sin haber cambiado nada; es `.tsx`, queda fuera de la red de pruebas y no
se comprobó. Si no deja, se cambia la prioridad y se devuelve a la que tenía, lo que produce dos propagaciones y
dos filas de traza por ticket afectado.

### 6.6 · Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Después** | **Verificación en la app de F1B-03** — una persona de Comercial | Abajo |
| **Nueva · Después** | **Verificación en la app del caso sin salida de F1B-03** — quien tenga acceso a la aplicación (Gerencia o quien despliega) | Abajo |
| **Nueva · Después** | **Las siete comprobaciones de F1B-07** — Comercial | Abajo |
| **Nueva · Después, en la PRIMERA liberación sin factura real** | **Las cinco comprobaciones de F1C-05**, y con la tercera la de **E-206** — Gerencia o quien opere la aplicación con el cargo Director Comercial | Abajo |
| **Después** | Las del paquete del 2026-10-03: contratos, F1B-15, F1C-10 y las del 2026-10-01 | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:758-791` |

**Verificación en la app de F1B-03**
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:118`), sobre
`https://ambientalia-desk.ambientalia.cloud/`:

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir un ticket en `Ticket creado` u `OV asignada` **sin** remisión de entrada | «Habilitar Servicio» sale desactivado, con el texto «No se puede habilitar el servicio: falta una remisión de entrada vigente…» |
| 2 | Crear la remisión de entrada y **no** enviarla; volver al ticket | El botón está **activo** y aparece el aviso «Remisión de entrada sin confirmar…» |
| 3 | Enviar la remisión y esperar a que se confirme | El botón sigue activo y el aviso desaparece |
| 4 | Pulsar «Habilitar Servicio» | El ticket pasa a `Ingresado` |

**Verificación en la app del caso sin salida de F1B-03**
(`openspec/changes/archive/2026-10-04-remision-creada-sin-salida/tasks.md:146`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir un ticket en `Remisión creada` **sin** remisión de entrada vigente, si el recuento dio alguno (E-185) | Aparece el botón «Crear remisión» |
| 2 | Abrir un ticket sano en `Remisión creada`, con su remisión confirmada | El botón **no** aparece |
| 3 | Recargar el ticket del paso 1 y mirar mientras carga | El botón no parpadea antes de que carguen las remisiones |

Si el recuento no da ningún ticket para el paso 1, el paso queda sin hacer y se dice así: no se fabrica un ticket
atascado en producción para comprobarlo.

**Las siete comprobaciones de F1B-07**
(`openspec/changes/archive/2026-10-04-propagar-top5-lista-remision-creada/tasks.md:359-365`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Marcar un cliente Top 5 | Sus tickets abiertos toman la prioridad nueva, cada uno con su traza; el panel dice cuántos |
| 2 | Desmarcarlo | Los tickets vuelven a la prioridad que tenían |
| 3 | Antes del paso 1, ajustar a mano la prioridad de uno de sus tickets | Ese ticket no cambia ni al marcar ni al desmarcar |
| 4 | Esperar una pasada del sincronizador (unos 3 minutos) y mirar un ticket venido de Zoho | Conserva la prioridad propagada |
| 5 | Abrir «Equipos en Remisión creada» | El que más tiempo lleva en el estado está arriba |
| 6 | Crear un ticket para un cliente Top 5 y después desmarcar al cliente | El ticket vuelve a la prioridad que se pidió en el alta |
| 7 | Tras propagar, mirar el listado | Los tickets del cliente **no** aparecen como no leídos |

⚠️ Los pasos 1, 2, 3 y 6 escriben sobre tickets reales y dejan traza: hacerlos con un cliente que de verdad vaya a
ser Top 5, o deshacerlos en el mismo acto. El paso 4 es, además, la comprobación en la aplicación de que la
sentencia 53 entró en `desk`.

**Las cinco comprobaciones de F1C-05**
(`openspec/changes/archive/2026-10-04-liberacion-sin-factura-motivo-fecha/tasks.md:135-139`):

| # | Paso | Resultado esperado |
|---|---|---|
| P1 | Liberar un ticket en `Por Facturar` con cada uno de los tres motivos | Se ven tres campos y ninguna casilla |
| P2 | Elegir «Autorización excepcional de Dirección Comercial» y dejar el texto vacío | La aplicación lo rechaza y nombra lo que falta |
| P3 | Entregar, volver a `Por Facturar` y liberar otra vez, **esta vez sin texto** | Motivo, fecha y texto salen vacíos y editables; **no se hereda el texto de la primera** |
| P4 | Abrir la ficha y el historial | La ficha enseña motivo y fecha; el historial, los tres valores de cada liberación. La casilla «Liberación del ticket sin facturar» sale sin marcar |
| P5 | Pantalla de usuarios | Existe alguien con el cargo Director Comercial |

**P3 es la comprobación de E-206, y es la única de este paquete que prueba algo que ninguna prueba automática ha
visto contra PostgreSQL** (§0 g, punto 4). Después del P3, quien administra el despliegue ejecuta, en `desk` y en
sólo lectura:

```sql
BEGIN READ ONLY;
SELECT number, liberacion_motivo, fecha_prevista_facturacion, liberacion_sin_facturar,
       custom_fields ? 'Texto de la autorización'   AS tiene_la_clave,
       custom_fields ->> 'Texto de la autorización' AS texto,
       (SELECT count(*) FROM jsonb_object_keys(custom_fields)) AS claves_en_custom_fields
  FROM desk.tickets
 WHERE number = 0;   -- sustituir 0 por el número del ticket del paso P3
ROLLBACK;
```

Lo esperado, que es **hipótesis** hasta verlo: `liberacion_motivo` y `fecha_prevista_facturacion` con los valores
de la segunda liberación; `tiene_la_clave` verdadero y `texto` vacío —la clave se queda, con valor nulo, y el
texto de la primera no sobrevive—; `liberacion_sin_facturar` vacío; y `claves_en_custom_fields` igual o mayor que
antes de liberar, porque la mezcla añade o pisa una clave y no borra las demás. **Si `texto` trae el de la primera
liberación, o si `custom_fields` perdió claves, se devuelve al panel como hallazgo y se responde en E-206**; no es
motivo de reversión. La consulta no se ha ejecutado, y la clave es la de
`packages/shared/src/liberacionSinFactura.ts:14`.

⚠️ Los pasos P1 a P3 mueven tickets reales por `Por Facturar` y `Por Entregar / Sin facturar`: hacerlos sobre un
ticket que de verdad se vaya a liberar sin factura. El ciclo completo del P3 —liberar, entregar, volver y liberar—
puede no darse el primer día; la consulta sirve igual tras la primera liberación, para ver que motivo, fecha y
clave se escribieron.

### 6.7 · Servicio Técnico y Calidad

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes — PARADA de F1B-04** | **E-170 (1)** — confirmar la lista de diez novedades | Abajo |
| **Antes** | Enterarse de los cambios visibles | §1 |
| **Después** | **E-170 (3)** — comprobar el formulario de recepción, nueve pasos | Abajo |
| **Después** | Las del paquete anterior | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:795-813` |

**E-170 (1), la lista a confirmar** (`packages/zoho-sync/src/db/schema.sql:690-699`): Sin novedad · Golpe o
abolladura en la carcasa · Rayón o daño estético · Pantalla o display dañado · Conector o puerto dañado · Falta un
accesorio · Embalaje inadecuado o dañado · Humedad, suciedad o contaminación visible · Sello o precinto roto ·
Otro. Si hay que cambiarla, se cambia por SQL, antes o después de publicar.

**E-170 (3), los nueve pasos** (`docs/sdd/ENTRADA.md:1843`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir el alta de remisión de entrada | Diez novedades y ningún campo libre de observación de novedad |
| 2 | Marcar «Sin novedad» y luego otra; y al revés | «Sin novedad» excluye a las demás en los dos sentidos |
| 3 | Marcar «Otro» sin escribir texto | No deja crear |
| 4 | No marcar «Rotulado y guardado» | No deja crear |
| 5 | Marcar una novedad y no subir su foto | No deja crear |
| 6 | Dejar sin subir una de las tres fotos mínimas | No deja crear |
| 7 | Con algo exigido sin subir | No ofrece «Continuar sin fotos» |
| 8 | Provocar un envío bloqueado | El mensaje dice qué categoría o qué novedad falta |
| 9 | Alta completa y envío | La remisión se envía y la etiqueta lleva el código del ticket |

⚠️ El paso 9 crea y envía una remisión real: hacerlo con un equipo que de verdad esté entrando.

### 6.8 · Quien administra n8n

| Cuándo | Tarea | Qué desbloquea |
|---|---|---|
| **Antes — PARADA de F1B-04** | **E-170 (2)** — comprobar que la etiqueta que imprime el flujo lleva el código del ticket | Que «Rotulado y guardado» tenga con qué rotular |

### 6.9 · Quien publica

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | Comprobar por el bundle en qué commit está producción. `f619d04` ya está empujado y con CI en verde | §4.4 |
| **Durante el corte** | Deploy de la App; §4.4 entero **sobre `desk`**, con su bloque «F1B-07»; avisar a Alfonso para el paso 2 de F1C-09 | §4.2, §4.4 |
| **Durante el corte** | Redespliegue del worker, **sólo después** de la comprobación de `SWEEP_*`; y justo después, **el bloque «F1B-07» de §4.4 sobre `zoho-hub`** | §0 (c), §0 (g) |
| **Nueva · Durante el corte** | **Dato de F1B-08:** devolver al panel el recuento de `desk.tickets` y de `desk.equipos` | §4.4 lo incluye; `openspec/changes/archive/2026-10-04-busqueda-ticket-serial/tasks.md:127` |
| **Nueva · Después** | **Los escenarios manuales de F1B-08** — QA o quien despliegue | Abajo |

**Los escenarios manuales de F1B-08**
(`openspec/changes/archive/2026-10-04-busqueda-ticket-serial/tasks.md:126`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Escribir en la caja un número de ticket, y luego el mismo con «#» delante | Sale ese ticket las dos veces |
| 2 | Escribir los últimos dígitos de un serial; y el serial completo en minúsculas | Salen los tickets de ese equipo |
| 3 | En cerrados, buscar uno que no esté en la primera página; repetir en «Mis tickets» | Sale, y el paginador enseña el total **filtrado** |
| 4 | Borrar el texto; y cambiar de página, escribir y mirar la página | El listado vuelve completo; al escribir, vuelve a la primera página |
| 5 | Entrar en «Equipos en Remisión creada» con un texto escrito y volver | Allí no hay caja; al volver, la caja y el listado están sin filtro |
| 6 | En el alta de remisión de entrada, usar el autocompletado por serial | Responde igual que antes |

El paso 5 es el arreglo que quedó sin prueba automática (R48).

### 6.10 · Sin dueño con nombre (arrastradas)

Las de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:825-828`. Y, de F1B-03, la comprobación de Drive y n8n sobre
los prefijos, de Gerencia, que es del segundo cambio de la tanda y no de este despliegue
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:117`).

**De la sesión de supervisión, nuevas, ninguna condiciona el despliegue:** que la aceptación con servicios reales
incluya una segunda liberación sin texto (E-206, `docs/sdd/ENTRADA.md:2026`) y la concurrencia de la propagación
(E-194, `docs/sdd/ENTRADA.md:1966`); y decidir si se corrige que anular una remisión y sincronizar el estado no
compartan transacción (E-186, `docs/sdd/ENTRADA.md:1926`). Y, sin destino asignado a propósito, que la gestión de
equipos busque el serial con su propio patrón (E-200, `docs/sdd/ENTRADA.md:1996`).

---

## 7 · Lo que NO es desplegable

**`f619d04` no es desplegable hoy**, por §0 (b). Cumplidas las condiciones de §0, nada más lo impide. Lo comprobado
para el tramo nuevo; para los anteriores vale la tabla de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:837-847`.

| Condición que haría `f619d04` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración de esquema no idempotente | **No hay, con una salvedad.** De las veintidós nuevas, veintiuna llevan `IF NOT EXISTS` u `ON CONFLICT DO NOTHING`. La 55 (`DROP NOT NULL`) no lleva `IF`: que repetirla no dé error es hipótesis sobre el motor, no comprobada aquí | §2.1 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Diez columnas anulables sin `DEFAULT`; los `NOT NULL` son de la tabla nueva de F1B-04; la única restricción que se toca se **relaja** | §2.1 |
| Una sentencia sin calificar que aterrice en el esquema equivocado | **No hay.** Diecinueve van calificadas con `public`; las tres sin calificar son sobre `tickets`, que es de `DESK_TABLES`, y es lo correcto. Depende de `DB_SCHEMA` (R51) | §2.1 |
| Un `;` en un comentario o en un texto que parta una sentencia | **No hay.** 57 caracteres `;` en 57 líneas | §2.1 |
| Una sentencia nueva cuyo fallo no tumbe el arranque y rompa algo en silencio | **Sí hay una: la 53.** No hace el paquete no desplegable; hace obligatoria la comprobación de lectura en las dos bases | §0 (g), §4.4 |
| Un interruptor de escritor sin documentar | **No hay variable nueva.** Hay una variable anterior sin documentar, `DB_SCHEMA`, que no es un interruptor de escritor | §3 |
| Trabajo a medias en el código | **No hay.** En `git diff 5f68822 f619d04 -- apps packages`, las líneas añadidas con `it.fails`, `.skip(`, `it.todo`, `FIXME` o `XXX` son 0 | — |
| Un «no se despliega sin X» con X fuera del paquete | **No.** Las cuatro condiciones de publicación (E-158 y recuentos, E-162, E-170, E-181) están en §0. Las cuatro tandas nuevas no añaden ninguna: sus informes de archivo traen datos y avisos, no paradas (§0 g) | §0 |
| Una decisión previa sin la cual lo publicado sería otro | **Dos:** E-158 (sin valor por defecto aceptado: es parada) y la ráfaga de alarmas (por defecto, apagada) | §0 (b), §0 (f) |

**Publicar `f619d04` entero, no un commit intermedio.** A los tramos de
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:849-859` se añaden éstos, que son **lectura del orden de los commits
y de sus títulos, no ejecución** (hipótesis sobre el comportamiento exacto de cada intermedio):

- **F1B-04, entre `231f7e3` y `1b289f3`:** el servidor ya valida la recepción y las puertas de envío, y el
  formulario nuevo llega con el último.
- **F1B-03, entre `6dbae98` y `613669b`:** el primero trae la guarda y el segundo el botón desactivado con su
  texto; en ese tramo el botón se ofrecería y respondería 422.
- **F1B-03, cualquier commit entre `a4bfc85` y el anterior a `90477b8`:** la guarda sin la salida para el
  ticket en `Remisión creada`. Es el estado que describía el paquete del 2026-10-04; `24a14eb` está en ese tramo.
- **F1B-07, entre `081e78e` y `9c4498f`:** la marca por fila ya la lee el sincronizador, y nadie la escribe
  todavía.
- **F1C-05, entre `0f3cafc` y `ffc3bea`:** las dos columnas existen y la guarda de contenido está escrita y sin
  cablear; el formulario sigue pidiendo la casilla.

Las cuatro fusiones nuevas son puntos de `main` con CI en verde en tres de ellas (`90477b8`, `93e6741`,
`59d02da`), pero este paquete **no** mide ninguno de esos puntos: mide `f619d04`.

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se leyeron contra el árbol de `f619d04`. Se comprobaron de dos maneras:
con un guion propio, fuera del repositorio, que extrae cada cita completa, mira que sus dos extremos existan y no
estén vacíos y enseña el texto de los dos extremos; y **una a una**, leyendo ese texto contra lo que la frase
afirma. **No se pasaron por el detector de `pre-push`** (`apps/desk/server/citas/cli.ts`), que trabaja sobre una
revisión commiteada, y este fichero no está commiteado. Todas van con la ruta completa desde la raíz; no hay
ninguna en forma abreviada.

**El paquete del 2026-10-04**, al que éste sustituye, se revalidó con el mismo guion, comparando cada línea citada
con la de `24a14eb`: **244 citas completas, ninguna rota hoy; 242 idénticas byte a byte; 2 con contenido
distinto**, las dos del mismo párrafo: `packages/shared/src/transitions.ts:163-165` y
`apps/desk/src/lib/botonRemision.ts:31`. Son justo las que sostenían el caso sin salida, y hoy dicen lo contrario
de lo que aquel paquete afirmaba: es el caso C de la regla de mutación 4, y aquí están reescritas (§0 b). Las otras
242 se arrastran sin tocar el número.

El paquete del 2026-10-03 se revalidó igual, comparando cada línea citada con la de `5f68822`: **289 citas
completas, ninguna rota hoy; 268 idénticas byte a byte; 21 con contenido distinto.** De esas 21, catorce son de su
nota final, escrita después de `5f68822` sobre líneas que entonces no existían, y siete son líneas de código
editadas en su sitio: la 131 de `apps/desk/server/services/ticketService.ts` (citada dos veces), la 134 de ese
mismo fichero (citada dos veces; es la que cambia desde el paquete del 2026-10-04, por F1C-05), la 73 de
`packages/zoho-sync/src/db/migrate.ts`, la 61 de `apps/desk/server/app.ts` y la 70 de
`apps/desk/src/components/TransitionPanel.tsx`. Las siete se releyeron: siguen diciendo lo que aquel paquete
afirma. Que una línea sea idéntica prueba que la cita de aquel paquete sigue valiendo lo que valía; no vuelve a
probar que diga lo que la frase afirma. Las citas del paquete del 2026-10-01 a las que aquél remite **no se han
vuelto a leer**.

Los SHA de la tabla de la cabecera se comprobaron con `git log`, y las cifras de cada fusión, con `git diff
--shortstat` contra su primer padre. El bundle se construyó dos veces con la salida fuera del repositorio; `dist/`
del repositorio no se tocó. Tipos, lint y pruebas se ejecutaron en esta sesión sobre el árbol de `f619d04`.

**Lo que se cita de los informes y no se reprodujo:** los veredictos de verify, las mutaciones y los recuentos de
escenarios de las cuatro tandas nuevas salen de sus `archive-report.md` y `verify-report.md`. Lo que este paquete
afirma del **código** —qué lee `upsertTicket`, qué tolera `migrate`, qué escribe la liberación, quién lee la
casilla— se leyó en el código, no en los informes.

**Un detector que no cazaba todo lo que la afirmación abarca.** El barrido pedido para los lectores de
`liberacion_sin_facturar`, por el nombre de la columna, no encuentra el único sitio donde una persona ve el dato:
la ficha lo lee por su **etiqueta** (`apps/desk/src/components/TicketProperties.tsx:88`). Hizo falta un segundo
barrido, por el texto de la etiqueta. Queda dicho en §5.1.

---

## 9 · Lo no comprobado

La lista completa y numerada de lo que este documento afirma sin haberlo podido comprobar desde el repositorio, o
que marca «hipótesis», está **al final, en §11 «Hipótesis de este paquete»**. Donde el texto remite a «§9», la
referencia es a esa lista.

---

## 10 · Qué se puede desplegar HOY sin esperar a nadie, y qué espera a qué respuesta

**Las piezas no se pueden separar: van todas en el mismo código.** Lo que lo prueba:

- **Una sola imagen para los dos servicios, que ejecuta el código fuente tal cual** (`Dockerfile:27-29`): no hay
  artefactos por pieza.
- **Ninguna de las ocho piezas nuevas tiene interruptor de entorno.** La guarda de F1B-03 se llama sin condición
  (`apps/desk/server/services/ticketService.ts:131`) y su única condición es el id de la transición
  (`apps/desk/server/services/ticketService.ts:274`). Las rutas de F1B-04 y de F1F-05 se registran sin condición
  (`apps/desk/server/app.ts:61`). La derivación de F1C-11 son dos entradas de una constante
  (`packages/shared/src/transitions.ts:276`, `packages/shared/src/transitions.ts:281`). De las cuatro últimas: la
  propagación de F1B-07 se llama sin condición desde la ruta (`apps/desk/server/routes/prioridad.ts:44`) y la
  lectura de la marca está dentro de `upsertTicket` (`packages/zoho-sync/src/db/repo.ts:67`); la búsqueda de
  F1B-08 es un middleware de ruta fijo (`apps/desk/server/routes/tickets.ts:104`); la liberación de F1C-05 es una
  línea del catálogo (`packages/shared/src/transitions.ts:247`); y el caso sin salida, una condición de un
  predicado (`packages/shared/src/transitions.ts:164`). Y no hay ninguna lectura nueva de variables de entorno
  (§3).
- **Tampoco se pueden separar eligiendo commit.** En `main`, la fusión de F1B-03 (`a4bfc85`) es la **primera**
  que entra después de `5f68822`; F1C-11, F1B-04 y F1F-05 entran detrás (`git log --first-parent 5f68822..f619d04`).
  Entre `5f68822` y el commit anterior a `a4bfc85` no cambia código (`git diff --stat 5f68822 609739f -- apps
  packages` → vacío). O sea: **todo commit de `main` que traiga F1C-11, F1B-04 o F1F-05 trae también la guarda.**
  Las cuatro fusiones posteriores (`90477b8`, `93e6741`, `59d02da`, `32e5df3`) entran todavía más atrás: el caso
  sin salida, F1B-07, F1B-08 y F1C-05 **también** van detrás de la guarda.

**Por tanto, todo el despliegue de la App sobre `f619d04` espera a E-158 y a los dos recuentos.** Sólo hay dos
puntos publicables de la App con paquete: `5f68822` y `f619d04`. `24a14eb`, el del paquete del 2026-10-04, deja de
serlo: publicarlo dejaría abierto el caso sin salida que `f619d04` cierra.

| Qué | Servicio | ¿Hoy, sin esperar ninguna respuesta? | Espera a |
|---|---|---|---|
| **`5f68822`** — todo lo del paquete del 2026-10-03 (F1A-03, F1C-09, F1C-10, F1B-15 y lo anterior) | App | **Sí**, con sus propias condiciones de parada, que son tareas y no respuestas: copia de la base y migración de F1C-09 en el mismo corte, y nombrar quién asigna los cargos (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:72-82`) | Nada. Pero no lleva F1F-05 |
| **Guarda de F1B-03** | App, `f619d04` | **No** | **E-158** (Gerencia, con Servicio Técnico) y **los dos recuentos** en producción (Gerencia). Si E-158 es «no alcanza», código nuevo y paquete nuevo |
| **F1C-11** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior. Su condición propia, E-162 (b), se puede mirar hoy; E-162 (a) es de después del Deploy |
| **F1B-04** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior, más **E-170 (1)** (Servicio Técnico confirma la lista) y **E-170 (2)** (quien administra n8n confirma la etiqueta) |
| **F1F-05** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior. No tiene condición propia para desplegarse, y tiene **fecha: antes del 13/11/2026** |
| **Nueva** · **El caso sin salida de F1B-03** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior. Sin condición propia; E-185 es informativo |
| **Nueva** · **F1B-07** | App, `f619d04` (y la lectura de la marca, también en el worker) | **No, por ir detrás de la guarda** | Lo anterior. Sin respuesta que esperar, pero con **comprobación obligatoria tras el Deploy** (§0 g, punto 1) y con el Top 5 **después** de los cargos |
| **Nueva** · **F1B-08** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior. Sin condición propia |
| **Nueva** · **F1C-05** | App, `f619d04` | **No, por ir detrás de la guarda** | Lo anterior. Sin condición propia; quien libera necesita el cargo Director Comercial, que se asigna tras el Deploy (§0 f, punto 2) |
| **`afa4252`** (pagos en el barrido) | Worker `hub-sync` | **Sí**, en cuanto se miren `SWEEP_ENABLED` y `SWEEP_DRY_RUN` | Esa comprobación, de quien administra el despliegue. **No espera a E-158**: la guarda es código de la App y el worker no la carga. Publicado con `f619d04`, el worker lleva además la lectura de `prioridad_en_app_at`: detrás va el bloque «F1B-07» de §4.4 sobre `zoho-hub` |
| Las veintidós sentencias nuevas sobre `zoho-hub` | Worker `hub-sync` | **Sí**: al arrancar el worker con `f619d04` se crean allí la tabla y las columnas. Todas inertes **salvo la 53**, que el sincronizador del worker lee (§2.2) | Nada. Pero hay que comprobar que la 53 entró |
| Los dos recuentos de F1B-03 (y con ellos E-185), la consulta P-1 de F1F-05, el paso 1 de F1C-09, los recuentos de F1A-03 y los dos tamaños de F1B-08 | Ninguno: sólo lectura sobre producción | **Sí**, hoy, sin desplegar: todo lo que leen existe en el esquema de `ae5aaf4` | Nada |

**Qué pieza va en cuál servicio.** En la App: la guarda de F1B-03 y su caso sin salida, la derivación de F1C-11,
la recepción de F1B-04, los indicadores de F1F-05, la propagación y la lista de F1B-07, la búsqueda de F1B-08 y la
liberación de F1C-05, enteros. En el worker: el esquema entero, que `migrate` aplica también en el hub, y **una
sola pieza de código de las ocho: la lectura de `prioridad_en_app_at` en `upsertTicket`**
(`packages/zoho-sync/src/db/repo.ts:67`), que es de `packages/zoho-sync` y el worker ejecuta en cada ticket. En el
hub esa marca está siempre vacía, así que el worker se comporta como antes —siempre que la columna exista—. Lo
demás que el worker tiene pendiente de redesplegar es `afa4252`, del paquete del 2026-10-03. De `packages/shared`,
`packages/zoho-sync` importa en `f619d04` `esCuarentena`, `clasificarOV`, `motivoCuarentena`, `mapHistoryEvent`,
`extractServiceCode`, las constantes del alta y, nuevo, **el tipo** `BusquedaTickets`
(`packages/zoho-sync/src/db/busquedaTickets.ts:1`): un tipo, sin código en ejecución. Ninguna de esas piezas
cambia de comportamiento con las ocho tandas.

**La consecuencia que hay que mirar:** la fecha de F1F-05 (13/11/2026) queda atada a la respuesta de E-158. Si
E-158 se retrasa, la única forma de que F1F-05 llegue a tiempo es un cambio de código nuevo, que sería otro commit
y otro paquete.

---

## 11 · Hipótesis de este paquete

Todo lo que este documento afirma **sin haberlo podido comprobar en el repositorio**. Lo que no está en esta lista
se leyó en el árbol de `f619d04`, con ruta y línea.

**Sobre producción y sobre cómo arranca.**

1. **Que producción siga hoy en `ae5aaf4`.** Consta en los paquetes anteriores y ningún commit registra un
   despliegue hecho; el estado real sólo lo dice el bundle (§4.4).
2. **Qué versión corre hoy el worker `hub-sync`**, y qué mecanismo lo arranca: `Dockerfile:27-29` dice que la
   misma imagen elige el punto de entrada por `APP_ENTRYPOINT`; `DEPLOY.md:188-190`, que se cambia el comando de
   arranque. Los dos llevan al mismo fichero; cuál usa EasyPanel no está verificado (`DEPLOY.md:53-55`).
3. **Que pulsar Deploy en EasyPanel reinicie el proceso y, por tanto, vuelva a correr `migrate`**; que no queden
   dos instancias del mismo servicio a la vez durante el cambio; y que el servicio no se reinicie solo en bucle.
   `DEPLOY.md:177-180` sólo dice que el servidor corre `migrate` «en el primer arranque».
4. **El valor de `DB_SCHEMA` en producción**, para la App y para el worker. Para la App lo afirman dos documentos
   del repositorio, de segunda mano; para el worker, ninguno. De él depende en qué esquema aterrizan las tres
   `ALTER TABLE tickets` nuevas (§2.1).
5. **En qué esquema vive `tickets` dentro de `zoho-hub`**, y si hay una sola tabla con ese nombre en cada base.
   Por eso el bloque «F1B-07» de §4.4 no nombra el esquema.
6. **Que el worker escriba sólo en `zoho-hub` y la App sólo en `desk`.** Lo dice `DEPLOY.md:33-36`; depende de
   la variable `DATABASE_URL` de cada servicio, que no se ve desde el repositorio.
7. **El valor de `SWEEP_ENABLED` y `SWEEP_DRY_RUN` en producción** (§0 c), y el de `N8N_AVISOS_WEBHOOK_URL` y
   `AVISOS_COPIA_EMAIL` (§3). Del fichero de ejemplo de variables sólo se leyeron los **nombres**.

**Sobre la base de datos.**

8. **Que las cinco sentencias nuevas se apliquen sin error en el PostgreSQL de producción.** No se han ejecutado
   contra PostgreSQL real en esta sesión: la prueba de integración de la migración sale omitida en local
   (`packages/zoho-sync/src/db/migrate.integration.test.ts`, 2 pruebas omitidas) y no se abrió el registro del CI
   para ver si allí corre contra una base real.
9. **Por qué podría fallar la `ALTER` de `prioridad_en_app_at`, y con qué probabilidad.** Las causas posibles
   —que el rol del servicio no sea el dueño de `tickets`, un bloqueo sobre la tabla en el momento del arranque, un
   tiempo de espera— no son comprobables desde aquí. **Los permisos del rol de cada servicio sobre su base no se
   conocen.** Lo comprobado es sólo lo que pasa **si** falla: `migrate` sigue y el sincronizador se rompe.
10. **Que el sincronizador quede roto «en silencio» tal como se describe.** Sale de leer `migrate`, `upsertTicket`
    y `persistEach`; no se ha reproducido quitando la columna de una base.
11. **Que repetir `ALTER COLUMN a DROP NOT NULL` no dé error** (sentencia 55). Es conducta conocida del motor, no
    comprobada aquí contra PostgreSQL.
12. **Que las consultas de §4.4, las dos, funcionen y devuelvan lo que se dice.** No se han ejecutado. En
    particular: que el rol con el que se consulte vea las columnas en `information_schema`, que sólo enseña los
    objetos sobre los que el rol tiene algún privilegio; y que `max(synced_at)` avance en cada pasada.
13. **Las consecuencias de §2.2 de omitir cada sentencia**, y las de la reversión de §4.5 (q) a (t): salen de leer
    el código de `f619d04` y el de `ae5aaf4`, no de ejecutarlo.
14. **Los procedimientos de copia y restauración** con `pg_dump` y `pg_restore` (§4.1).
15. **Que la replicación hub→desk no se vea afectada.** Se razona de que ninguna de las cuatro tablas replicadas
    cambia (`DEPLOY.md:42`); el estado real de la suscripción no se ha mirado.

**Sobre las cuatro tandas nuevas.**

16. **Que no haya clientes Top 5 marcados en producción antes de este Deploy.** Es consecuencia de la hipótesis 1;
    lo dice `filas_top5` en §4.4. **Y que el panel del Top 5 deje guardar sin cambiar nada**, que es lo que haría
    falta para «volver a guardar» (§6.5): es `.tsx` y no se comprobó.
17. **Que la mezcla `jsonb || jsonb` haga en PostgreSQL lo que hace la emulación del arnés**: que una segunda
    liberación sin texto deje la clave con valor nulo y no herede el de la primera, y que no se pierdan las demás
    claves de `custom_fields` (aviso W2, E-206). Y, con ello, **el resultado esperado de la consulta de §6.6**.
18. **Que nadie, fuera del repositorio, cuente las liberaciones por la casilla** —un informe de Zoho, una consulta
    guardada, una hoja de cálculo— (E-203). En `apps` y `packages` no lo hace nadie; fuera no se puede ver.
19. **Cuántos tickets hay hoy en `Por Entregar / Sin facturar`** liberados con la casilla y sin motivo ni fecha
    (E-204).
20. **El tamaño de `desk.tickets` y `desk.equipos`**, y por tanto el coste de la búsqueda sin índice (R48); y
    cuántos tickets históricos no tienen copia del serial ni equipo enlazado (E-197).
21. **Que la propagación del Top 5 sea atómica y segura con concurrencia real.** Está probada por secuencia, no
    por efecto sobre filas, y lee sin bloquear (aviso W-1, E-194).
22. **Que exista hoy algún ticket en `Remisión creada` sin remisión de entrada vigente**, y de dónde saldría
    (E-185, E-186, E-187).
23. **Todo lo que «ve el usuario» de las cuatro tandas nuevas en §1 y §5.1.** Sale de leer el código y sus
    pruebas; ninguna pantalla se abrió en un navegador, y los `.tsx` están fuera de la red de pruebas. Para eso
    están las comprobaciones de persona de §6.
24. **Los veredictos, las mutaciones y los recuentos de escenarios** de los informes de verificación y de archivo:
    se citan, no se reprodujeron.

**Lo que ya estaba sin comprobar en el paquete del 2026-10-04 y sigue igual.**

25. **Cuántos tickets bloqueará la guarda de F1B-03** y cuántos son de «Equipo nuevo»: los dos recuentos no se han
    ejecutado (§0 b).
26. **Que la consulta P-1 de F1F-05 funcione en el PostgreSQL de producción** y qué devuelve (§0 d).
27. **Que la etiqueta de n8n se imprima al enviar y lleve el código del ticket** (§0 e).
28. **Cómo está escrito en producción el cargo del Director Técnico**, que la comparación ignore mayúsculas y
    espacios, y que la pantalla de usuarios de producción enseñe ese campo (§6.3).
29. **Qué pasos del CI corren contra PostgreSQL real.** El CI de `f619d04` está en verde; su registro no se abrió.
30. **Que el bundle de Windows y el de `node:22-alpine` sean idénticos**, que anteponer `tsc -b` no lo cambie, y
    que la imagen de `f619d04` construya en EasyPanel (§4.3, §4.4).
31. **El coste de `GET /api/indicadores` sin periodo sobre la base real**, y cómo entrega ésta las columnas de
    fecha (R43).
32. **Lo que haría `ae5aaf4` con una remisión del formulario nuevo pendiente de envío** (§4.5, n).
33. **El comportamiento de los commits intermedios** de §7.
34. **Todo lo que el paquete del 2026-10-03 dejó sin comprobar y sigue igual**
    (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:881-909`), salvo su punto 4: tipos, lint y pruebas sí se
    ejecutaron hoy en local. Y las citas del paquete del 2026-10-01 a las que aquél remite, que no se han vuelto a
    leer.
