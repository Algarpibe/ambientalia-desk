# Paquete de despliegue — 2026-10-04

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe un
agente que no despliega ni commitea. La publicación es una acción manual: el CI **no despliega**, sólo verifica
(`DEPLOY.md:270-271`).

**Este paquete sustituye al del 2026-10-03 para publicar.** Aquél (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md`)
cubría `ae5aaf4..5f68822`, es un registro fechado y **no se toca**. Fijaba como base en producción `ae5aaf4`
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:25`), y ningún commit de `5f68822..24a14eb` registra un despliegue
(`git log --oneline -i --grep="despleg" 5f68822..24a14eb` no devuelve nada). Por eso todo se mide otra vez desde
`ae5aaf4`. **Hipótesis:** que producción siga hoy en `ae5aaf4`; no es comprobable desde el repositorio y se
comprueba con el método del bundle de §4.4 antes de empezar (§9).

Cómo se lee: lo que arrastra del 2026-10-03 y **no ha cambiado** se recoge aquí resumido y remite, con ruta y
línea, a aquel paquete para el detalle largo. Lo nuevo desde `5f68822` —cuatro tandas— va completo. Las citas de
código de este documento se leyeron contra `24a14eb`. Las del paquete del 2026-10-03 se revalidaron de una vez
(§8): de sus 289 citas completas, ninguna apunta hoy a una línea inexistente o vacía y 270 dicen hoy, byte a byte,
lo mismo que en `5f68822`.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `24a14eb` (HEAD local de `main` el 2026-10-04). **No está en `origin/main`**, que apunta a `9620e05`; entre los dos sólo cambia `openspec/config.yaml` (`git diff --name-only 9620e05 24a14eb`) |
| Base que consta en producción | `ae5aaf4` (hipótesis, arriba) |
| Rango medido | **`ae5aaf4..24a14eb`** |
| `git diff --shortstat ae5aaf4 24a14eb` | **638 files changed, 125762 insertions(+), 1888 deletions(-)** |
| Commits del rango | **489** (`git rev-list --count ae5aaf4..24a14eb`); **52** posteriores a `5f68822` |
| De ellos, tocan `apps/` o `packages/` | **138**; **20** posteriores a `5f68822` (lista abajo) |
| Código tocado | **254 ficheros**, +27.671/−869 (`git diff --shortstat ae5aaf4 24a14eb -- apps packages`); desde `5f68822`: **59 ficheros, +3.784/−189** |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` desde `5f68822` | Sólo `CLAUDE.md` y `DEPLOY.md` (+76 líneas, dos secciones nuevas). **Ni `Dockerfile`, ni `package.json`, ni `package-lock.json`, ni `.github`, ni el fichero de ejemplo de variables** |
| Ficheros `.sql` que cambian desde `5f68822` | Dos: `packages/zoho-sync/src/db/schema.sql` (+31) y `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` (+59, nuevo) |
| Bundle del cliente de `24a14eb` | `index-BuzKRdWI.js`, 393.531 bytes, sha256 `074732dc64ab79e0e8411e8f95d62fec830c4d61cbe8411785adcae070c67d2f` (§4.4; construido el 2026-10-04 con `vite build`, sin `tsc -b`, con la salida fuera del repositorio) |
| Tipos, lint y pruebas | Ejecutados el 2026-10-04 sobre el árbol de `24a14eb`: `npm test` **2.954 pruebas en verde y 2 omitidas** (188 ficheros y 1 omitido), `npm run typecheck` limpio, `npm run lint` 165 avisos y 0 errores. CI en verde sobre `5797c65` (run 37201986199), `4c35661` (37202328621), `85d6018` (37202726591) y `9620e05` (37203084851). **Sobre `24a14eb` no hay CI: no está empujado** |

`git diff --name-only 85d6018 24a14eb -- apps packages` sale vacío: los cuatro commits posteriores a la última
fusión (`5c6f03c`, `7e73e5e`, `9620e05`, `24a14eb`) son sólo documentación.

**Las cuatro piezas nuevas, por orden de llegada a `main`** (cada SHA comprobado con `git log` y `git diff --stat`
contra el primer padre de su fusión):

| Pieza (`tanda`, `cierra`) | Fusión a `main` | Código | Verify | Archivo | Qué toca |
|---|---|---|---|---|---|
| `tipo-servicio-ticket-sin-ov` (**F1B-03** parte L, `cierra: no`) | `a4bfc85` | `6dbae98`, `613669b` | `b34cf8d` | `560f60f` | 20 ficheros, +652/−57: la guarda en `ticketService.ts`, su lectura en `db/remisiones.ts`, el predicado en `packages/shared/src/remision.ts` y el botón (`TransitionPanel.tsx`, `habilitarServicio.ts`). Sin esquema |
| `derivacion-repuestos-director-tecnico` (**F1C-11**, `cierra: si`) | `5797c65` | `d179c12` (+ `8f91947`, pruebas) | `79180e6` | `920b304` | 11 ficheros, +229/−45: `transitions.ts`, `cargos.ts`, `sla.ts` (comentario) y pruebas. Sin esquema |
| `recepcion-rotulacion-foto-entrada` (**F1B-04** sin accesorios, `cierra: no`) | `4c35661` | `da9c740`, `231f7e3`, `e24d490`, `8f8506f`, `1b289f3` (+ `4c778b0`, pruebas) | `4649306` | `9e2ebdf` | 20 ficheros, +1.526/−89: **esquema** (+31 líneas), ruta y servicio nuevos, `routes/remision.ts`, `CrearRemision.tsx`, y `DEPLOY.md` (+29) |
| `continuidad-indicadores` (**F1F-05**, `cierra: no`) | `85d6018` | `24e636a`, `e252518`, `d25ecda`, `d0a7c85`, `37bd97f` (+ `17cdf05`, remediación) | `710a34e` | `c6d25ae` | 17 ficheros, +1.459/−4: ruta nueva de sólo lectura, cálculo en `packages/shared`, enlace en `Analisis.tsx`, y `DEPLOY.md` (+47). Sin esquema |

Los otros commits de la lista de 20 son las dos fusiones de `main` hacia las ramas (`76225c0`, `61f0ee3`) y los
commits de archivo, que tocan una prueba de reconciliación.

*Correcciones al paquete del 2026-10-03, halladas al revalidarlo contra `24a14eb`* (aquél no se toca):

- **«Las dos consultas de recuento» de F1B-03 no están en un solo fichero.** La nota final de aquel paquete las
  sitúa en `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`
  (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:921-922`). Ese fichero trae **una** consulta y dice de sí mismo
  que es la segunda; la primera es `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`
  (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:3-7`). Son dos ficheros (§0 b).
- **Las sentencias nuevas de `schema.sql` pasan de treinta y cinco a cincuenta y dos** (§2.1).
- **Las pruebas pasan de 2.544 a 2.954**, y el bundle de referencia es otro (cabecera).
- **Los cargos de permiso pasan de siete a ocho** (`packages/shared/src/cargos.ts:12-15`).
- **El mapa de derivación por defecto pasa de tres a cinco entradas** (`packages/shared/src/transitions.ts:274-282`).
- **Cinco líneas de código que aquel paquete cita cambiaron de contenido sin moverse**, y lo que afirmaba de ellas
  sigue siendo cierto: la línea 131 de `ticketService.ts` (gana la llamada a la guarda nueva), la 73 de
  `migrate.ts` (gana `catalogo_novedades`), la 61 de `app.ts` (gana dos registros de rutas) y la 70 de
  `TransitionPanel.tsx`. Detalle en §8.

---

## 0 · Condiciones de parada y avisos — leer antes que nada

Las cinco primeras son **condiciones de parada**: si una no está cumplida, no se pulsa Deploy sobre `24a14eb`.

### (a) F1C-09 — CONDICIÓN DE PARADA: sin copia comprobada de la base, no se despliega; y migración en el mismo corte

Decisión de Gerencia del 2026-10-02, `decision/f1c09-copia-antes-de-desplegar` (`openspec/config.yaml:3659-3680`).
Respuesta textual (`openspec/config.yaml:3665`):

> «No despliegues F1C-09 sin copia previa de la base.»

Sus consecuencias escritas (`openspec/config.yaml:3667-3670`): antes de desplegar y de ejecutar la migración se
hace una copia de la base `desk` **y se comprueba que existe**; es tarea de persona de Alfonso. **F1C-09 está
dentro de `24a14eb`, así que la condición alcanza a este paquete entero.**

**Despliegue y migración van EN EL MISMO CORTE.** F1C-09 retira «Marcar como pendiente» y las dos «Servicio
externo» hacia `Por Facturar` (`packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`),
y `Pendiente` pasa a existir sólo en soporte remoto (`packages/shared/src/estados.ts:182`). Entre el Deploy y la
migración, un ticket de servicio en `Pendiente` se queda sin transiciones
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:66`).

El script es `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`: paso 1 de sólo lectura **antes** de desplegar
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:32-42`), paso 2 de traslado **tras** desplegar
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:44-53`) y recuento posterior
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:55`). Ni el script ni el código de F1C-09 cambian desde
`5f68822`: la tabla de pasos y los cinco avisos del cambio (nunca ejecutado contra PostgreSQL real, predicado de
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
App: publicar `24a14eb` es publicarla (§10).

**Antes de desplegar hacen falta dos cosas, las dos de personas:**

1. **La respuesta de Gerencia a E-158** (`docs/sdd/ENTRADA.md:1782`): si la guarda alcanza a los tickets de
   «Equipo nuevo». Lo construido aplica el supuesto «sí, sin excepciones», **no decidido**. Si la respuesta es
   «no alcanza», hace falta un cambio de código nuevo (una excepción por clasificación) y **`24a14eb` deja de ser
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

**Qué hacer con los bloqueados.** El texto del 422 dice «Crea la remisión de entrada desde el ticket». Leído en el
código: la pantalla sólo ofrece «Crear remisión» en `OV asignada` y `Ticket creado`
(`packages/shared/src/transitions.ts:163-165`, `apps/desk/src/lib/botonRemision.ts:31`). **Un ticket en `Remisión
creada` sin remisión de entrada vigente no tiene ese botón.** *Hipótesis:* eso sólo le ocurre a tickets que
llegaron a ese estado desde Zoho, porque en la App el estado lo escribe la propia remisión y anular la última lo
devuelve a `Ticket creado` (`apps/desk/server/routes/remision.ts:334`). El recuento reparte por estado y por
`managed_by_app`, así que dirá cuántos son; si la fila de `Remisión creada` trae `sin_remision_vigente` mayor que
cero, se consulta antes de desplegar (R39).

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
contenido. En una línea cada uno, con las citas críticas releídas en `24a14eb`:

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
   `apps/desk/server/services/alarmasSla.ts:102-104`). Si Gerencia la quiere encendida, `24a14eb` deja de ser el
   commit a publicar.
6. **`migrate` es tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:29-35`). Por eso §4.4 no es
   opcional.
7. **Los tickets «Soporte remoto» y «Equipo nuevo» ya abiertos cambian de botones el día del Deploy**, sin medir
   cuántos.

---

## 1 · Resumen para quien publica

**Veredicto: `24a14eb` es DESPLEGABLE sólo cuando se cumplan las condiciones de §0.** Hoy **no** lo es: falta la
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
3. **Deploy de la App**, y en los minutos siguientes la consulta de §4.4. Si falta una tabla o columna, se revierte
   (§4.5).
4. **En el mismo corte:** paso 2 del script de F1C-09 y su recuento posterior; después, asignar los cargos de
   permiso (incluido «Especialista técnico») y marcar el Top 5, en ese orden.
5. **Redespliegue del worker `hub-sync`**, con los dos valores de `SWEEP_*` ya mirados.
6. **Después:** las verificaciones en la aplicación (§6), la siembra de F1A-03 cuando llegue el dato, y la medición
   de F1F-05 desde el 16/11.

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

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — cincuenta y dos sentencias nuevas, todas al final

`git diff --shortstat ae5aaf4 24a14eb -- packages/zoho-sync/src/db/schema.sql` → «1 file changed, 259
insertions(+)», ninguna línea borrada: ninguna sentencia existente cambia. El diff es **un solo bloque**
(`@@ -446,3 +446,262 @@`): las 259 líneas nuevas son de la 449 a la 707, el final del fichero.

**Cómo se contó.** `schemaStatements` trocea el fichero por `;` a ciegas (`packages/zoho-sync/src/db/migrate.ts:19-21`),
así que una sentencia es un `;`. De la línea 449 a la 707 hay **52 caracteres `;`**, repartidos en **52 líneas**,
una por sentencia, y **ningún comentario lleva `;`**. Las **treinta y cinco** primeras (hasta la línea 676) son las
del paquete del 2026-10-03 y no se han movido: las 27 primeras están en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:157-180` y las ocho siguientes en
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:224-233`. Desde `5f68822` se añaden **31 líneas**
(`packages/zoho-sync/src/db/schema.sql:677-707`) con **diecisiete** sentencias, todas de F1B-04:

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

**F1B-03, F1C-11 y F1F-05 no tocan el esquema.**

- **Las seis columnas nuevas son anulables, sin `DEFAULT`, sin `CHECK` y sin relleno.** `novedades` a `NULL` es la
  marca de remisión de legado (`packages/zoho-sync/src/db/schema.sql:700-701`).
- **La tabla nueva está en `PUBLIC_TABLES`** (`packages/zoho-sync/src/db/migrate.ts:73`, al final de la línea:
  `catalogo_novedades`). Nace con diez filas y sin clave foránea.
- **Es la primera siembra de datos que viaja en `schema.sql` dentro de este rango.** `ON CONFLICT DO NOTHING` no
  restaura una etiqueta editada por SQL, pero **sí reinserta una fila borrada** en cada arranque
  (`packages/zoho-sync/src/db/schema.sql:677-681`).
- **Ninguna toca las cuatro tablas replicadas** (`DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51`
  no aplica.

**Totales del rango `ae5aaf4..24a14eb`:** doce tablas nuevas, veintiuna columnas nuevas anulables y sin `DEFAULT`
sobre tablas existentes, nueve índices —todos sobre tablas nuevas— y diez filas sembradas. Nada se borra ni se
renombra.

### 2.2 · Dónde se aplican, y qué se rompe si una sentencia se omite

Se aplican solas al arrancar la App (`apps/desk/server/index.ts:26-27`) y, sobre `zoho-hub`, al arrancar el worker
(`apps/hub-sync/src/hubSync.ts:13`); en el worker son inertes (`git grep` de `novedades`, `indicadores` y
`recepcion` sobre `apps/hub-sync` en `24a14eb` → 0). El detalle de las 35 anteriores está en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:250-290` y `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:261-270`.
Para las diecisiete nuevas, leído en el código y **no ejecutado**:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| **sentencias 47 a 50 (columnas de `public.remisiones`)** | **Toda alta de remisión**, también la de legado | El `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`) |
| **sentencias 51 y 52 (columnas de `public.remision_fotos`)** | La subida de fotos, la lectura de las fotos de una remisión y **todo envío** de remisión | `apps/desk/server/db/remisiones.ts:195`, `apps/desk/server/db/remisiones.ts:204`; el envío lee las fotos antes de decidir (`apps/desk/server/routes/remision.ts:289`) |
| **sentencia 36 (`public.catalogo_novedades`)** | La lista del formulario, el alta con el formulario nuevo y **todo envío** de remisión, también de legado | `apps/desk/server/db/novedades.ts:13`; el envío lee el catálogo siempre (`apps/desk/server/routes/remision.ts:289`) |
| sentencias 37 a 46 (la siembra) | Con menos de diez filas, la lista sale incompleta; con cero, el alta responde 422 «La lista de novedades no está cargada» | `DEPLOY.md:256-257`, `packages/shared/src/recepcion.ts:63` |

### 2.3 · Otros ficheros SQL del rango

Diez ficheros `.sql` cambian en `ae5aaf4..24a14eb` (`git diff --stat ae5aaf4 24a14eb -- '*.sql'`). Tres los ejecuta
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

**Ninguna nueva.** Comprobado para `5f68822..24a14eb`:

- `git diff --name-only -G"process\.env|import\.meta\.env|VITE_" 5f68822 24a14eb -- apps packages` → vacío.
- `packages/zoho-sync/src/config.ts`, que es donde se leen las variables de los dos servicios, **no cambia en todo
  el rango** `ae5aaf4..24a14eb` (`git diff --stat` vacío).
- En el rango entero, las únicas líneas añadidas que nombran `process.env` están en el detector de citas, en el
  barrido de reconciliación y en sus pruebas (`apps/desk/server/citas/cli.ts`, `apps/desk/server/citas/git.ts`,
  `apps/desk/server/reconciliacion/cli.ts`): herramientas de repositorio que la App no carga, y que no leen
  ninguna variable propia (pasan el entorno a `git`).
- El fichero de ejemplo de variables **no aparece** entre los ficheros que cambian en `ae5aaf4..24a14eb`
  (`git diff --stat ae5aaf4 24a14eb` restringido a la raíz lista once ficheros y no está). **Su contenido no se
  pudo leer en esta sesión** (lectura denegada por permisos), así que no se afirma qué variables documenta (§9).
- `DEPLOY.md` gana 76 líneas desde `5f68822` y las dos secciones nuevas dicen expresamente que no hay
  interruptores ni variables nuevas (`DEPLOY.md:258-259`, `DEPLOY.md:265-267`).

**Hallazgo: ninguna variable se lee sin estar documentada, y tampoco hay ningún interruptor para las cuatro
piezas nuevas** (§10).

**Lo que no es nuevo pero este paquete obliga a mirar:** `SWEEP_ENABLED` y `SWEEP_DRY_RUN` (§0 c), y
`N8N_AVISOS_WEBHOOK_URL` y `AVISOS_COPIA_EMAIL` (`packages/zoho-sync/src/config.ts:114-117`), cuyos valores en
producción no están verificados (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:296-300`).

**Ninguna de las tandas nuevas enciende un escritor hacia fuera.** F1F-05 sólo lee
(`apps/desk/server/indicadores.ts:51-55`); F1B-03 sólo añade una lectura; F1C-11 cambia dos constantes; F1B-04
escribe en `public.remisiones` y `public.remision_fotos`, de la base de la App, y la categoría de la foto no viaja
a n8n (`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:89`).

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy — CONDICIÓN DE PARADA

Obligatoria por `decision/p55-backup` (`openspec/config.yaml:2253-2261`) y por
`decision/f1c09-copia-antes-de-desplegar` (§0 a). `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo
siguiente es **hipótesis**, no procedimiento verificado:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
# La cadena de conexión es la variable DATABASE_URL del servicio App: el NOMBRE, nunca su valor en un chat.
pg_dump --format=custom --file=desk_antes_de_24a14eb.dump "$DATABASE_URL"
```

**Criterio de hecho, sea cual sea el método: existe un fichero de copia con fecha de hoy, fuera del servidor, y su
tamaño no es cero. Sin eso comprobado, no se despliega.**

Sobre `zoho-hub`: si `SWEEP_ENABLED=true` y `SWEEP_DRY_RUN=false`, decidir antes si se copia el hub (§0 c).

### 4.2 · Publicar

`DEPLOY.md` cubre el mecanismo y no se repite: App en `DEPLOY.md:177-180`, worker en `DEPLOY.md:186-205`.

- **Publicar `24a14eb` entero, no un commit intermedio** (§7). Antes hay que empujarlo: hoy `origin/main` es
  `9620e05`, que lleva el mismo código.
- **App y worker son servicios independientes de la misma imagen** (`Dockerfile:27-29`). El worker hay que
  redesplegarlo aparte para que `afa4252` tenga efecto. Qué versión corre hoy el worker no está verificado.
- **Orden del corte:** copia comprobada → paso 1 de F1C-09 → Deploy de la App → §4.4 → paso 2 de F1C-09 y recuento
  posterior → cargos de permiso → Top 5 → worker.

### 4.3 · La imagen

Sin cambios: ni `Dockerfile` ni `package.json` ni `package-lock.json` cambian en `5f68822..24a14eb`. Que la imagen
de `24a14eb` construya en EasyPanel es **hipótesis**: no se ha construido.

### 4.4 · Comprobar que producción está en el commit publicado

**El bundle** (mismo método que los paquetes anteriores):

1. Construcción local del árbol de `24a14eb`, el 2026-10-04: fichero `index-BuzKRdWI.js` (393,53 kB; 393.531
   bytes), sha256 `074732dc64ab79e0e8411e8f95d62fec830c4d61cbe8411785adcae070c67d2f`. Se construyó dos veces, con
   la salida en dos carpetas distintas fuera del repositorio, y dio el mismo nombre y el mismo sha256.
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente qué `index-*.js`
   carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `24a14eb`.** Si sale `index-DZ1geyGk.js`, es el bundle de `5f68822`
   (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:357-358`): se publicó el commit del paquete anterior.

*Límites:* la referencia se construyó en Windows y producción construye en `node:22-alpine`; que den los mismos
bytes es **hipótesis**. Se construyó con `vite build`, sin el `tsc -b` que antepone `npm run build`. Y el bundle
sólo prueba el cliente.

**Que la migración entró — obligatorio, en los minutos siguientes al Deploy.** Consola de PostgreSQL de producción,
base `desk`, **sólo lectura**. Es la consulta del paquete anterior ampliada con una tabla, seis columnas, una clave
primaria y el recuento de la siembra; incluye la comprobación de lectura de F1B-04 de `DEPLOY.md:240-251`. **No se
ha ejecutado** (§9).

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
-- Deben salir 21 filas, todas con is_nullable = YES y column_default vacío.
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
       (SELECT count(*) FROM public.remisiones WHERE novedades IS NOT NULL) AS remisiones_formulario_nuevo;
-- Justo después del Deploy, las nueve a 0: todo nace vacío y sin relleno.

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después del Deploy; 1 fila tras la primera pasada (unos 3 minutos). Anotar `corte`.

ROLLBACK;
```

Si falta algo, buscar `migrate: sentencia omitida` en el log del servicio App
(`packages/zoho-sync/src/db/migrate.ts:33`) y **pasar a §4.5**. Después: entrar en la aplicación y abrir el
tablero.

**Y que la migración de F1C-09 entró:** el recuento posterior del paso 3 (§0 a), con el grupo 1 a 0.

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel.** La base no hay que tocarla para que `ae5aaf4` funcione:
las veintiuna columnas nuevas son anulables y sin `DEFAULT`, y `ae5aaf4` no nombra ninguna de las piezas nuevas de
F1B-04 (`git grep -c "catalogo_novedades\|novedad_otro\|rotulado_at" ae5aaf4 -- apps packages` → sin resultados).
El razonamiento para las 35 sentencias anteriores, las señales que obligan a revertir y lo que la reversión no
deshace están en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:460-503`. Nuevos:

- **(m) La guarda de F1B-03 desaparece** y «Habilitar Servicio» vuelve a pasar sin remisión. No deja nada en la
  base.
- **(n) El catálogo de novedades y las seis columnas se quedan, sin uso.** Las remisiones creadas con el
  formulario nuevo conservan sus novedades y su rotulado en columnas que `ae5aaf4` no lee; sus observaciones sí
  llevan el texto compuesto (`apps/desk/server/routes/remision.ts:249`). *Hipótesis:* una remisión del formulario
  nuevo que quedara pendiente de envío se enviaría con la regla antigua.
- **(o) La derivación de F1C-11 deja de proponerse**; los tickets ya derivados conservan su derivado. El cargo de
  permiso «Especialista técnico» ya asignado queda en una columna que `ae5aaf4` no lee.
- **(p) La ruta y el enlace de F1F-05 desaparecen.** No escribió nada.

**Señales nuevas que obligan a volver atrás:**

| Señal | Qué significa |
|---|---|
| No se puede crear ninguna remisión de entrada (500) | Falta una de las cuatro columnas nuevas de `public.remisiones` (§2.2) |
| No se puede enviar ninguna remisión ni subir fotos (500) | Falta `public.catalogo_novedades` o una columna de `public.remision_fotos` (§2.2) |

**No son motivo de reversión:** el 422 «No se puede habilitar el servicio: falta una remisión de entrada vigente…»
(es la guarda; si alcanza a más tickets de los contados, se consulta, no se revierte a ciegas); los 422 del
formulario de recepción («Confirma que el equipo quedó rotulado y guardado», «Faltan fotos obligatorias: …», «Falta
la foto de cada novedad marcada: …»); el 403 de `/api/indicadores` a quien no es administrador; una casilla
«Derivado a» que no propone a nadie (es E-162 b); y los que ya listaba el paquete anterior
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
| `2026-10-03-continuidad-indicadores` (**F1F-05**, `cierra: no`; deja fuera el 51 y el 55, que salen «sin dato», y la comparación efectiva) | **(1)** Los administradores ven en «Análisis» el enlace «Descargar indicadores (CSV)». **(2)** `GET /api/indicadores` devuelve, en JSON o CSV, los nueve indicadores por ticket y un resumen de comparación con el valor de Zoho, sin umbral ni veredicto. **(3)** Sin valor de Zoho sincronizado, el resumen lo dice y no da porcentaje. **(4)** Sólo lee | Ruta: `apps/desk/server/routes/indicadores.ts:41-54`. Lectura: `apps/desk/server/indicadores.ts:56-86` en `42a4828`. Enlace: `apps/desk/src/components/Analisis.tsx:83`, `apps/desk/src/lib/indicadoresUrl.ts:16-18`. Cobertura: `openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:8-13` |

**Las rutas nuevas, con su guarda.** Las dos se registran en `apps/desk/server/app.ts:61`, sin condición.

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `GET /api/novedades-remision` | Sólo sesión; devuelve las activas | `apps/desk/server/routes/novedades.ts:16-18` |
| `GET /api/indicadores` | 401 sin sesión → **403** sin ser administrador → 400 por parámetros → lectura | `apps/desk/server/routes/indicadores.ts:41-44` |
| `POST /api/remisiones/:id/fotos` (cambia) | 404 → 400 sin archivo → 415 → **422** por categoría no válida | `apps/desk/server/routes/remision.ts:378-387` |

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

### 5.2 · Lo que arrastra del 2026-10-03, sin cambios de contenido

Todo lo de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:513-520` (F1A-03, F1C-09, F1C-10, F1B-15, `afa4252` y el
barrido de reconciliación), sus rutas (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:524-530`) y lo que aquél
arrastraba del 2026-10-01 (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:547-554`).

**Dos filas cambian de contenido por las tandas nuevas:** la guarda de «Habilitar Servicio» de F1B-15 (alta
pendiente) convive ahora con la de F1B-03, que corre justo detrás en la misma línea
(`apps/desk/server/services/ticketService.ts:131`); y la novedad con foto del F1B-04 anterior pasa a ser la regla
de las remisiones de legado (`packages/shared/src/recepcion.ts:154`).

### 5.3 · Riesgos que se publican a sabiendas

**Nuevos.**

**R39 · F1B-03 bloquea tickets el día del Deploy, y cuántos no está medido.** Los dos recuentos no se han
ejecutado. Alcanza a «Equipo nuevo» por un supuesto no decidido (E-158). Y un ticket en `Remisión creada` sin
remisión vigente en la base de la App no tiene botón para crearla (§0 b): leído en el código, no reproducido.

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

**Del paquete del 2026-10-03, con su estado de hoy:** R32 a R38 siguen como están escritos
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:564-600`), y la tabla de los riesgos del 2026-10-01, también
(`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:605-619`). Ninguno se cierra con las cuatro tandas nuevas.

---

## 6 · Tareas de persona — por dueño y en orden de ejecución

Todas las tareas de persona de los cambios archivados cuyos commits están en `ae5aaf4..24a14eb` y que no tienen
resultado. **Archivar no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). Las del paquete anterior se
arrastran completas y aquí se remite a su paso a paso. Las nuevas van enteras.

Fuentes de las nuevas: `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:110-118`,
`openspec/changes/archive/2026-10-03-derivacion-repuestos-director-tecnico/archive-report.md:86-90`,
`openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/archive-report.md:103-107`,
`openspec/changes/archive/2026-10-03-continuidad-indicadores/archive-report.md:115-121`, y las entradas E-158,
E-160, E-162 a E-170 y E-181 de `docs/sdd/ENTRADA.md`.

### 6.1 · Alfonso (Gerencia) y quien administra el despliegue

| Cuándo | Tarea (con su cambio) | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Antes — PARADA** | **Los dos recuentos de F1B-03 en producción**, y entregar las cifras | Publicar la guarda | Abajo |
| **Antes** | **P-1 de `continuidad-indicadores`** — la consulta de sólo lectura de `DEPLOY.md:272-298` | Saber si la comparación tendrá valores de Zoho (si no, E-173) | Abajo |
| **Antes — PARADA** | **Copia de la base y comprobar que existe** | El Deploy entero | §4.1 |
| **Antes** | Recuento previo de F1C-09; P.3 de `verificacion-gas-patron-certificado`; comprobar `SWEEP_ENABLED` y `SWEEP_DRY_RUN`; y las cinco arrastradas del 2026-10-01 | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:641-649` y sus pasos, `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:657-695` |
| **Durante el corte** | Paso 2 del script de F1C-09 y recuento posterior; paso 6 de P.2 de `alarmas-horas-habiles` | Que ningún ticket de servicio quede en `Pendiente` sin botones | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:650-651` |
| **Durante el corte** | **Comprobación de lectura de F1B-04** (diez filas y seis columnas) | Dar F1B-04 por publicada | §4.4 la incluye; origen, `DEPLOY.md:234-261` |
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
| **Antes — PARADA** | **E-158** — ¿la guarda de remisión alcanza a los tickets de «Equipo nuevo»? (con Servicio Técnico) | **Publicar `24a14eb`.** Si es «no», hace falta código nuevo y este paquete no vale | `docs/sdd/ENTRADA.md:1782` |
| **Antes** | P.3 de `alarmas-horas-habiles` (la ráfaga); la precondición de P.1 de `permisos-por-cargo`; y cuál de las dos lecturas de la siembra vale | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:724-726` |
| Sin orden | **E-160** — ¿la derivación al Director Técnico se propone o se impone? | Si hay cambio nuevo con la guarda. **No bloquea** | `docs/sdd/ENTRADA.md:1792` |
| Sin orden | **E-163 a E-167** (con Servicio Técnico) — las cinco de la recepción | Alcance de F1B-04. **No bloquean** | R41 |
| Sin orden | **E-171 a E-180** — las diez de los indicadores | El 51, el 55 y cómo se lee la comparación. **No bloquean** | R44 |
| Sin orden | **E-157** — qué es «crear la OVI de garantía» en Desk | La parte de OVI de F1B-03, no construida | `docs/sdd/ENTRADA.md:1777` |
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

Sin tareas nuevas. La lista Top 5: `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:751-754`.

### 6.6 · Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Después** | **Verificación en la app de F1B-03** — una persona de Comercial | Abajo |
| **Después** | Las del paquete anterior: contratos, F1B-15, F1C-10 y las del 2026-10-01 | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:758-791` |

**Verificación en la app de F1B-03**
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:118`), sobre
`https://ambientalia-desk.ambientalia.cloud/`:

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir un ticket en `Ticket creado` u `OV asignada` **sin** remisión de entrada | «Habilitar Servicio» sale desactivado, con el texto «No se puede habilitar el servicio: falta una remisión de entrada vigente…» |
| 2 | Crear la remisión de entrada y **no** enviarla; volver al ticket | El botón está **activo** y aparece el aviso «Remisión de entrada sin confirmar…» |
| 3 | Enviar la remisión y esperar a que se confirme | El botón sigue activo y el aviso desaparece |
| 4 | Pulsar «Habilitar Servicio» | El ticket pasa a `Ingresado` |

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
| **Antes** | Comprobar por el bundle en qué commit está producción; empujar `24a14eb` y esperar el CI | §4.4 |
| **Durante el corte** | Deploy de la App; §4.4 entero; avisar a Alfonso para el paso 2 de F1C-09 | §4.2, §4.4 |
| **Durante el corte** | Redespliegue del worker, **sólo después** de la comprobación de `SWEEP_*` | §0 (c) |

### 6.10 · Sin dueño con nombre (arrastradas)

Las de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:825-828`. Y, de F1B-03, la comprobación de Drive y n8n sobre
los prefijos, de Gerencia, que es del segundo cambio de la tanda y no de este despliegue
(`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:117`).

---

## 7 · Lo que NO es desplegable

**`24a14eb` no es desplegable hoy**, por §0 (b). Cumplidas las condiciones de §0, nada más lo impide. Lo comprobado
para el tramo nuevo; para los anteriores vale la tabla de `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:837-847`.

| Condición que haría `24a14eb` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración de esquema no idempotente | **No hay.** Las diecisiete nuevas llevan `IF NOT EXISTS` u `ON CONFLICT DO NOTHING` | §2.1 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Seis columnas anulables sin `DEFAULT`; los `NOT NULL` son de la tabla nueva | §2.1 |
| Una sentencia sin calificar que aterrice en el esquema equivocado | **No hay.** Las diecisiete van calificadas con `public` | §2.1 |
| Un `;` en un comentario o en un texto que parta una sentencia | **No hay.** 52 caracteres `;` en 52 líneas | §2.1 |
| Un interruptor de escritor sin documentar | **No hay variable nueva** | §3 |
| Trabajo a medias en el código | **No hay.** En `git diff 5f68822 24a14eb -- apps packages`, las líneas añadidas con `it.fails`, `.skip(`, `it.todo`, `FIXME` o `XXX` son 0 | — |
| Un «no se despliega sin X» con X fuera del paquete | **No.** Las cuatro condiciones de publicación (E-158 y recuentos, E-162, E-170, E-181) están en §0 | §0 |
| Una decisión previa sin la cual lo publicado sería otro | **Dos:** E-158 (sin valor por defecto aceptado: es parada) y la ráfaga de alarmas (por defecto, apagada) | §0 (b), §0 (f) |

**Publicar `24a14eb` entero, no un commit intermedio.** A los tramos de
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:849-859` se añaden éstos, que son **lectura del orden de los commits
y de sus títulos, no ejecución** (hipótesis sobre el comportamiento exacto de cada intermedio):

- **F1B-04, entre `231f7e3` y `1b289f3`:** el servidor ya valida la recepción y las puertas de envío, y el
  formulario nuevo llega con el último.
- **F1B-03, entre `6dbae98` y `613669b`:** el primero trae la guarda y el segundo el botón desactivado con su
  texto; en ese tramo el botón se ofrecería y respondería 422.

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se leyeron contra el árbol de `24a14eb` y se comprobaron con un guion
propio, fuera del repositorio, que extrae cada cita completa y mira que sus dos extremos existan y no estén
vacíos. **No se pasaron por el detector de `pre-push`** (`apps/desk/server/citas/cli.ts`), que trabaja sobre una
revisión commiteada, y este fichero no está commiteado.

El paquete del 2026-10-03 se revalidó con el mismo guion, comparando además cada línea citada con la de
`5f68822`: **289 citas completas, ninguna rota hoy; 270 idénticas byte a byte; 19 con contenido distinto.** De
esas 19, catorce son de su nota final, escrita después de `5f68822` sobre líneas que entonces no existían, y cinco
son líneas de código editadas en su sitio: la 131 de `apps/desk/server/services/ticketService.ts` (citada dos
veces), la 73 de `packages/zoho-sync/src/db/migrate.ts`, la 61 de `apps/desk/server/app.ts` y la 70 de
`apps/desk/src/components/TransitionPanel.tsx`. Las cinco se releyeron: siguen diciendo lo que aquel paquete
afirma. Que una línea sea idéntica prueba que la cita de aquel paquete sigue valiendo lo que valía; no vuelve a
probar que diga lo que la frase afirma. Las citas del paquete del 2026-10-01 a las que aquél remite **no se han
vuelto a leer**.

Los SHA de la tabla de la cabecera se comprobaron con `git log` y `git diff --stat` contra el primer padre de cada
fusión. El bundle se construyó dos veces con la salida fuera del repositorio; `dist/` del repositorio no se tocó.

---

## 9 · Lo no comprobado

Todo lo que este documento afirma sin haberlo podido comprobar desde el repositorio, o que marca «hipótesis»:

1. **Que producción siga hoy en `ae5aaf4`.** Consta en los paquetes anteriores y ningún commit registra un
   despliegue; el estado real sólo lo dice el bundle (§4.4).
2. **Cuántos tickets bloqueará la guarda de F1B-03**, cuántos son de «Equipo nuevo» y cuántos están en `Remisión
   creada`: los dos recuentos no se han ejecutado (§0 b).
3. **Que sólo los tickets venidos de Zoho puedan estar en `Remisión creada` sin remisión vigente**, y que esos
   tickets no tengan forma de crear la remisión desde la pantalla: leído en el código, no reproducido (§0 b).
4. **El valor de `SWEEP_ENABLED` y `SWEEP_DRY_RUN` en producción**, y la versión que corre hoy el worker (§0 c).
   Tampoco el de `N8N_AVISOS_WEBHOOK_URL` y `AVISOS_COPIA_EMAIL` (§3).
5. **El contenido del fichero de ejemplo de variables.** Su lectura está denegada en esta sesión. Sólo consta que
   no cambia en el rango y que `packages/zoho-sync/src/config.ts` tampoco (§3).
6. **Que la consulta P-1 de F1F-05 funcione en el PostgreSQL de producción** y qué devuelve (§0 d).
7. **Que la etiqueta de n8n se imprima al enviar y lleve el código del ticket** (§0 e).
8. **Cómo está escrito en producción el cargo del Director Técnico**, que la comparación ignore mayúsculas y
   espacios, y que la pantalla de usuarios de producción enseñe ese campo (§6.3).
9. **La consulta de §4.4 ampliada: no se ha ejecutado.** Tampoco las consecuencias de §2.2 de omitir una de las
   diecisiete sentencias nuevas: salen de leer el código.
10. **CI sobre `24a14eb`: no existe**, porque no está empujado. Lo medido es el CI de `9620e05`, que lleva el mismo
    código, y la ejecución local de hoy. No se abrió el registro del CI para ver qué pasos corrieron contra
    PostgreSQL real.
11. **Que el bundle de Windows y el de `node:22-alpine` sean idénticos**, que anteponer `tsc -b` no lo cambie, y
    que la imagen de `24a14eb` construya en EasyPanel (§4.3, §4.4).
12. **Los procedimientos de copia y restauración** con `pg_dump` y `pg_restore` (§4.1).
13. **El coste de `GET /api/indicadores` sin periodo sobre la base real**, y cómo entrega ésta las columnas de
    fecha (R43).
14. **Lo que haría `ae5aaf4` con una remisión del formulario nuevo pendiente de envío** (§4.5, n).
15. **El comportamiento de los commits intermedios** de §7.
16. **Qué mecanismo arranca el worker en producción.** `Dockerfile:27-29` dice que la misma imagen elige el punto
    de entrada por `APP_ENTRYPOINT`; `DEPLOY.md:188-190` dice que se cambia el comando de arranque. Los dos llevan
    al mismo fichero; cuál usa EasyPanel no está verificado (`DEPLOY.md:53-55`).
17. **Todo lo que el paquete del 2026-10-03 dejó sin comprobar y sigue igual**
    (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:881-909`), salvo su punto 4: tipos, lint y pruebas sí se
    ejecutaron hoy en local.

---

## 10 · Qué se puede desplegar HOY sin esperar a nadie, y qué espera a qué respuesta

**Las piezas no se pueden separar: van todas en el mismo código.** Lo que lo prueba:

- **Una sola imagen para los dos servicios, que ejecuta el código fuente tal cual** (`Dockerfile:27-29`): no hay
  artefactos por pieza.
- **Ninguna de las cuatro piezas nuevas tiene interruptor de entorno.** La guarda de F1B-03 se llama sin condición
  (`apps/desk/server/services/ticketService.ts:131`) y su única condición es el id de la transición
  (`apps/desk/server/services/ticketService.ts:274`). Las rutas de F1B-04 y de F1F-05 se registran sin condición
  (`apps/desk/server/app.ts:61`). La derivación de F1C-11 son dos entradas de una constante
  (`packages/shared/src/transitions.ts:276`, `packages/shared/src/transitions.ts:281`). Y no hay ninguna lectura
  nueva de variables de entorno (§3).
- **Tampoco se pueden separar eligiendo commit.** En `main`, la fusión de F1B-03 (`a4bfc85`) es la **primera**
  que entra después de `5f68822`; F1C-11, F1B-04 y F1F-05 entran detrás (`git log --first-parent 5f68822..24a14eb`).
  Entre `5f68822` y el commit anterior a `a4bfc85` no cambia código (`git diff --stat 5f68822 609739f -- apps
  packages` → vacío). O sea: **todo commit de `main` que traiga F1C-11, F1B-04 o F1F-05 trae también la guarda.**

**Por tanto, todo el despliegue de la App sobre `24a14eb` espera a E-158 y a los dos recuentos.** Sólo hay dos
puntos publicables de la App: `5f68822` y `24a14eb`.

| Qué | Servicio | ¿Hoy, sin esperar ninguna respuesta? | Espera a |
|---|---|---|---|
| **`5f68822`** — todo lo del paquete del 2026-10-03 (F1A-03, F1C-09, F1C-10, F1B-15 y lo anterior) | App | **Sí**, con sus propias condiciones de parada, que son tareas y no respuestas: copia de la base y migración de F1C-09 en el mismo corte, y nombrar quién asigna los cargos (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:72-82`) | Nada. Pero no lleva F1F-05 |
| **Guarda de F1B-03** | App, `24a14eb` | **No** | **E-158** (Gerencia, con Servicio Técnico) y **los dos recuentos** en producción (Gerencia). Si E-158 es «no alcanza», código nuevo y paquete nuevo |
| **F1C-11** | App, `24a14eb` | **No, por ir detrás de la guarda** | Lo anterior. Su condición propia, E-162 (b), se puede mirar hoy; E-162 (a) es de después del Deploy |
| **F1B-04** | App, `24a14eb` | **No, por ir detrás de la guarda** | Lo anterior, más **E-170 (1)** (Servicio Técnico confirma la lista) y **E-170 (2)** (quien administra n8n confirma la etiqueta) |
| **F1F-05** | App, `24a14eb` | **No, por ir detrás de la guarda** | Lo anterior. No tiene condición propia para desplegarse, y tiene **fecha: antes del 13/11/2026** |
| **`afa4252`** (pagos en el barrido) | Worker `hub-sync` | **Sí**, en cuanto se miren `SWEEP_ENABLED` y `SWEEP_DRY_RUN` | Esa comprobación, de quien administra el despliegue. **No espera a E-158**: la guarda es código de la App y el worker no la carga |
| Las diecisiete sentencias de F1B-04 sobre `zoho-hub` | Worker `hub-sync` | **Sí**: al arrancar el worker con `24a14eb` se crean allí la tabla y las columnas, inertes (§2.2) | Nada |
| Los dos recuentos de F1B-03, la consulta P-1 de F1F-05, el paso 1 de F1C-09 y los recuentos de F1A-03 | Ninguno: sólo lectura sobre producción | **Sí**, hoy, sin desplegar | Nada |

**Qué pieza va en cuál servicio.** En la App: la guarda de F1B-03, la derivación de F1C-11, la recepción de
F1B-04 y los indicadores de F1F-05, enteros. En el worker: nada de las cuatro salvo el esquema de F1B-04, que
`migrate` aplica también en el hub; lo que el worker tiene pendiente de redesplegar es `afa4252`, del paquete
anterior. El worker no importa de `packages/shared` nada que las cuatro piezas cambien (sus importaciones en
`24a14eb` son `esCuarentena`, `clasificarOV`, `motivoCuarentena`, `mapHistoryEvent`, `extractServiceCode` y las
constantes del alta).

**La consecuencia que hay que mirar:** la fecha de F1F-05 (13/11/2026) queda atada a la respuesta de E-158. Si
E-158 se retrasa, la única forma de que F1F-05 llegue a tiempo es un cambio de código nuevo, que sería otro commit
y otro paquete.
