# Paquete de despliegue — 2026-10-03

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe un
agente que no despliega ni commitea. La publicación es una acción manual: el CI **no despliega**
(`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:5-6`).

**Este paquete sustituye al del 2026-10-01 para publicar.** Aquél (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md`)
cubría `ae5aaf4..e8840e7`, es un registro fechado y **no se toca**. Fijaba como base en producción `ae5aaf4`,
verificada por sha256 del bundle el 2026-09-10 (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:20`), y ningún commit
de `e8840e7..5f68822` registra un despliegue (`git log --oneline e8840e7..5f68822 -i --grep="despleg"` sólo
devuelve `bad1f85`, que es una condición y no un despliegue). Por eso todo se mide otra vez desde `ae5aaf4`. Que
producción siga hoy en `ae5aaf4` **no es comprobable desde el repositorio**: se comprueba con el método del bundle
de §4.4 antes de empezar (§9).

Cómo se lee: lo que arrastra del 2026-10-01 y **no ha cambiado** se recoge aquí resumido y remite, con ruta y
línea, a aquel paquete para el detalle largo. Lo nuevo desde `e8840e7` va completo. **Las citas de código que
contiene el paquete del 2026-10-01 se comprobaron contra `e8840e7`**; después cambian 82 ficheros de código, así
que esas citas se leen en esa revisión, no en el árbol de hoy. Las citas de código de este documento se leyeron
contra `5f68822`.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `5f68822` (HEAD de `main` el 2026-10-03) |
| Base que consta en producción | `ae5aaf4` (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:20`) |
| Rango medido | **`ae5aaf4..5f68822`** |
| `git diff --shortstat ae5aaf4 5f68822` | **570 files changed, 111640 insertions(+), 1801 deletions(-)** |
| Commits del rango | **437** (`git rev-list --count ae5aaf4..5f68822`); **72** posteriores a `e8840e7` |
| De ellos, tocan `apps/` o `packages/` | **118**; **20** posteriores a `e8840e7` (lista abajo) |
| Código tocado | **223 ficheros**, +23.999/−792 (`git diff --shortstat ae5aaf4 5f68822 -- apps packages`); desde `e8840e7`: **82 ficheros, +4.575/−322** |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` desde `e8840e7` | Sólo `CLAUDE.md` (`git diff --name-only e8840e7 5f68822` con esas cuatro carpetas excluidas). **Ni `Dockerfile`, ni `package.json`, ni `package-lock.json`, ni `DEPLOY.md`, ni `.env.example`, ni `.github`** |
| Ficheros `.sql` que cambian desde `e8840e7` | Tres: `packages/zoho-sync/src/db/schema.sql` (+54), `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` (+65, nuevo) y `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` (+103, nuevo) |
| Bundle del cliente de `5f68822` | `index-DZ1geyGk.js`, 387.839 bytes, sha256 `505de5a61bbd1a6778fc88d2a4b7c35945346de701be05a7fe6dcd3d984fd286` (§4.4; construido el 2026-10-03 con `vite build`, sin `tsc -b`, fuera del repositorio) |
| Tipos, lint y pruebas | Ejecutados el 2026-10-03 sobre `f375bbf`, el último commit que cambia código: `npm test` 2.544 pruebas en verde y 2 omitidas, `npm run typecheck` limpio, `npm run lint` 165 avisos y 0 errores. CI en verde sobre `f375bbf` (run 37123433977), `7797b7b` (37124082855) y `5f68822` (37124911134). Sobre `5f68822` en local no se repitieron: desde `f375bbf` sólo cambia documentación |

`git diff --name-only f375bbf 5f68822 -- apps packages` sale vacío: los dos commits posteriores al último merge
(`7797b7b` y `5f68822`) son sólo documentación. Y el cliente no cambia después de `ba7547e`
(`git diff --name-only ba7547e 5f68822 -- apps/desk/src packages/shared/src` → vacío).

**Los 20 commits de código posteriores a `e8840e7`, por pieza** (cada SHA comprobado con `git show --stat`; los
merges, con sus dos padres):

| Pieza (`tanda`, `cierra`) | Merge a `main` | Código | Verify | Archivo |
|---|---|---|---|---|
| booksHub, barrido de pagos (fuera del plan, sin ficha) | commits directos | `afa4252`, `a1cfe07` (éste sólo tipa la prueba) | — | — |
| `verificacion-gas-patron-certificado` (**F1A-03**, `cierra: si`) | commits directos | `084875c`, `f644027`, `5251896` | `15e7bce` | `43dd092` |
| `barrido-avance-archivado` (`fuera-del-plan`) | `8e654bd` | `7f99f07`, `51ae313` | — | `048fcf0` |
| `tres-transiciones-cifra-anclada` (**F1C-09**, `cierra: si`) | `0070ef1` | `ad1aaa0`, `42f591e` | `011f6ea` | `c0d16f6` (toca además una prueba de reconciliación) |
| Condición de despliegue de F1C-09 (E-151) | — | — | — | `bad1f85` (sólo `docs/sdd/ENTRADA.md` y `openspec/config.yaml`) |
| `rechazo-solo-comercial` (**F1C-10**, `cierra: si`) | `132d25f` | `2277e3e` (+ `8bae67a`, `72ac490`, pruebas de reconciliación) | `4984c3b` | `b16cbb4` |
| `alta-manual-equipo-cliente` (**F1B-15**, `cierra: si`) | `f375bbf` | `9910430`, `9e0f468`, `96ec938`, `8bd4121`, `ba7547e`, `099d11f` (+ `4b3c22d`, prueba de reconciliación) | `51157f2` | `c557273` |

*Correcciones al paquete del 2026-10-01, halladas al revalidarlo contra `5f68822`* (aquél no se toca):

- **Sus riesgos R1 y R2 —liberar un analizador sin Verificación y sin certificado— ya están CONSTRUIDOS** por
  F1A-03 (§5.1). La guarda de Verificación sólo actúa cuando haya compuestos y gases sembrados (§6).
- **E-109 y E-110 ya no son decisiones pendientes.** Las dos están decididas desde el 2026-10-01
  (`docs/sdd/ENTRADA.md:1422`, `docs/sdd/ENTRADA.md:1430`; respuesta en `docs/sdd/ENTRADA.md:1670`). La cola queda
  como está construida; en cambio, **la propagación del Top 5 a los tickets abiertos está decidida y NO construida**
  (`openspec/config.yaml:3392-3394`): lo que se publica hace lo contrario de lo decidido (§5.3, R38).
- **La unión de los tres catálogos pasa de 44 a 41 transiciones** (`packages/shared/src/invariantesGrafo.test.ts:172-174`):
  F1C-09 retira tres. `Finalizado` sigue siendo el único estado sin salida (`packages/shared/src/invariantesGrafo.test.ts:177`).
- **«Liberación» desde `Verificación` ya no es un clic**: pide el número del certificado de fábrica (§5.1). Afecta
  al paso 2 de la verificación de `salidas-verificacion` que aquel paquete describía.
- **Servicio Técnico pierde el «Rechazo» de `Notificación cliente`** (F1C-10, §5.1) y **`Pendiente` deja de ser
  estado de servicio** (F1C-09, §0).

---

## 0 · Condiciones de parada y avisos — leer antes que nada

### (a) F1C-09 — CONDICIÓN DE PARADA: sin copia comprobada de la base, no se despliega

Decisión de Gerencia del 2026-10-02, `decision/f1c09-copia-antes-de-desplegar` (`openspec/config.yaml:3659-3680`).
Respuesta textual (`openspec/config.yaml:3665`):

> «No despliegues F1C-09 sin copia previa de la base.»

Sus consecuencias escritas (`openspec/config.yaml:3667-3670`): antes de desplegar y de ejecutar la migración se
hace una copia de la base `desk` **y se comprueba que existe**; es tarea de persona de Alfonso. **F1C-09 está
dentro de `5f68822`, así que la condición alcanza a este paquete entero**: sin copia comprobada, no se pulsa
Deploy.

**Y despliegue y migración van EN EL MISMO CORTE.** F1C-09 retira «Marcar como pendiente» y las dos «Servicio
externo» hacia `Por Facturar` (`packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`),
y `Pendiente` pasa a existir sólo en soporte remoto (`packages/shared/src/estados.ts:182`). Entre el Deploy y la
migración, **un ticket de servicio en `Pendiente` se queda sin transiciones**
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:66`).

El script es `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`. Sus pasos reales, leídos en el fichero:

| Paso | Cuándo | Qué hace | Línea |
|---|---|---|---|
| 1 · Recuento previo | **Antes** de desplegar. Sólo lectura | Tres consultas: recuento de los tickets en `Pendiente` en tres grupos (1 servicio gobernado por la app: se mueve; 2 servicio gobernado por Zoho: no se mueve; 3 soporte remoto: no se toca); los números de ticket del grupo 2; y las clasificaciones distintas presentes en `Pendiente` | `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:32-42` |
| — · Desplegar | — | — | `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:21-24` |
| 2 · Traslado | **Tras** desplegar, en el mismo corte | Una transacción: inserta una fila de traza por ticket en `desk.ticket_transitions` (`transition_id` `migracion_f1c09_pendiente`) y **después** pasa a `En Proceso` los del grupo 1 (`status = 'Pendiente'`, `managed_by_app = true`, clasificación distinta de soporte remoto) | `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:44-53` |
| 3 · Recuento posterior | Justo después | Repetir la primera consulta del paso 1: **el grupo 1 sale a 0** | `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:55` |
| Reversión | Sólo si hace falta | Bloque comentado con prefijo `-- REV` | `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65` |

Avisos del propio cambio, que hay que conocer antes de ejecutarlo:

- **El script no se ha ejecutado nunca contra PostgreSQL real** (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:3-5`;
  `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:45-46`). Está probado por
  sentencias sobre pg-mem. **La copia de (a) es la red.**
- **Leer la tercera consulta del paso 1 antes de ejecutar el paso 2.** El script reconoce soporte remoto con un
  `LIKE` más amplio que la regla de la aplicación: no mueve de más, pero puede dejar en `Pendiente` un ticket con
  una clasificación inesperada (`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:39-41`).
- **El grupo 2 no se mueve** y queda en `Pendiente` sin transiciones en la aplicación: qué pasa con él es la
  pregunta P-1, de Gerencia, sin respuesta (§6.2). Medido el 2026-10-02 en Zoho Desk: 0 tickets en «Pendiente»
  entre los 250 no archivados (`openspec/config.yaml:3673-3676`); contra la base sólo lo dice el paso 1.
- **La reversión comentada borra todas las filas marcador**, también las de tickets que ya tengan transiciones
  posteriores (`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:44`).
- Es idempotente: una segunda pasada no encuentra filas del grupo 1 (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:25-27`).

### (b) `afa4252` — el worker `hub-sync` hay que redesplegarlo, y antes hay que mirar dos variables

`afa4252` añade **una entrada** a la lista de entidades del barrido (*mark-and-sweep*) de Books: los pagos de
clientes, con su tabla hija (`packages/zoho-sync/src/booksHub/sync.ts:190-192`). Son tres líneas de código y una
prueba; **no hay DDL** (`git show --stat afa4252` lista sólo `sync.ts` y `sweep.test.ts`; las tablas
`books.customer_payments` y `books.customer_payment_invoices` ya existían). Es código del worker: **no tiene
efecto hasta que se redespliegue el servicio `hub-sync`**; redesplegar la App no lo activa.

**No borra nada por sí solo.** El barrido sólo se programa si `SWEEP_ENABLED` vale `true`
(`packages/zoho-sync/src/config.ts:118`, «default OFF»; `apps/hub-sync/src/hub-sync.ts:68`), y sólo borra si
además `SWEEP_DRY_RUN` vale `false` (`packages/zoho-sync/src/config.ts:119`, «default ON»;
`packages/zoho-sync/src/sweep/sweep.ts:77`). `DEPLOY.md:200-201` dice lo mismo: `SWEEP_ENABLED` «nace apagado» y
`SWEEP_DRY_RUN` «nace encendido».

**Tarea de persona ANTES de desplegar el worker:** comprobar esos dos valores en el gestor de secretos de
producción (§6.1). **Su valor en producción no es verificable desde el repositorio.**

> **Si el barrido está activo, borrará las filas de `books.customer_payments` y `customer_payment_invoices` que
> Zoho ya no tenga.**

Qué acota ese borrado, leído en el código: cada candidato se vuelve a comprobar por id en Zoho antes de borrar
(`packages/zoho-sync/src/sweep/sweep.ts:65-75`); si los huérfanos superan 200 filas o el 10 % de la tabla, la
entidad se salta (`packages/zoho-sync/src/sweep/sweep.ts:62-64`; topes por defecto en
`packages/zoho-sync/src/config.ts:121-122`); se borra primero la tabla hija y luego la cabecera
(`packages/zoho-sync/src/sweep/sweep.ts:81-84`); corre una vez al día, a las 4 por defecto
(`packages/zoho-sync/src/config.ts:120`). Ocurre en `zoho-hub`: `books.customer_payments` no está entre las cuatro
tablas replicadas hacia `desk` (`DEPLOY.md:42`). **Una reversión de código no recupera filas borradas** (§4.5).

### (c) Lo que ya traía el paquete del 2026-10-01 y sigue en pie

1. **`public.users.cargo_permiso`: si la columna falta, nadie puede usar la aplicación.** La sesión se lee en
   cada petición con esa columna (`apps/desk/server/auth/sessions.ts:17`, `apps/desk/server/auth/middleware.ts:18`).
   La consulta de §4.4 es obligatoria justo después del Deploy; si falta, se revierte (§4.5). Fuente:
   `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:69-74`.
2. **CAMBIO VISIBLE de F1C-05: desde el Deploy, un usuario de Comercial que no sea administrador deja de poder
   hacer la «Liberación sin factura»** hasta que se le asigne el cargo de permiso `Director Comercial`
   (`packages/shared/src/cargos.ts:32`; el administrador pasa siempre, `packages/shared/src/cargos.ts:49`; 403 en
   `apps/desk/server/services/ticketService.ts:131`). La columna nace con el Deploy, así que el cargo no se puede
   asignar antes: hay que **nombrar quién asigna y aceptar por escrito ese intervalo** antes del Deploy, y asignar
   el mismo día. Fuente: `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:75-80` y su R24,
   `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:940-946`.
3. **El orden del mismo día:** primero asignar `cargo_permiso` (P.1 de F1C-05), después marcar la lista Top 5
   (P.1 de F1B-07), porque sin cargo sólo el administrador la marca (`packages/shared/src/cargos.ts:80-83`).
   Fuente: `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:81-83`.
4. **El cargo de las alarmas no es el cargo de permiso.** Las alarmas de SLA buscan al `Coordinador Comercial`
   en `users.cargo`, el de la firma (`apps/desk/server/db/avisos.ts:109`); asignar `cargo_permiso` no enruta
   alarmas. Fuente: R30, `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:985-990`.
5. **La P.3 de `alarmas-horas-habiles` (ráfaga de lo vencido) SIGUE VIVA y se decide ANTES del Deploy.** No hay
   decisión registrada (`grep -n -i "r.faga" openspec/config.yaml` → 0 líneas el 2026-10-03). Sin respuesta se
   publica apagada, que es lo que hace `5f68822`: el corte se escribe una sola vez en la primera pasada
   (`apps/desk/server/services/alarmasSla.ts:61`) y lo ya vencido se marca sin avisar
   (`apps/desk/server/services/alarmasSla.ts:102-104`). **Si Gerencia la quiere encendida, `5f68822` deja de ser el
   commit a publicar.** Fuente: `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:85-88` y
   `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1322-1346`.
6. **`migrate` es tolerante por sentencia**: una sentencia que falle se salta con un mensaje en el log y la App
   arranca igual (`packages/zoho-sync/src/db/migrate.ts:29-35`). Por eso §4.4 no es opcional.
7. **Los tickets «Soporte remoto» y «Equipo nuevo» ya abiertos cambian de botones el día del Deploy**, sin medir
   cuántos (R14 y R3 de aquel paquete, `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1002-1005` y
   `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1077-1087`).

---

## 1 · Resumen para quien publica

**Veredicto: `5f68822` es DESPLEGABLE, condicionado a (a) de §0** —copia de la base comprobada, y despliegue y
migración de F1C-09 en el mismo corte— y con la comprobación de `SWEEP_*` de (b) antes de redesplegar el worker.
Las migraciones de esquema son todas aditivas e idempotentes (§2), no hay ninguna variable de entorno nueva (§3) y
no queda ningún «no se despliega sin X» fuera de este documento (§7). El estado de tipos, lint y pruebas en
`5f68822` no se ejecutó en esta sesión (§9).

**El corte, en orden** (detalle en §4 y §6):

1. **Antes:** copia de la base y comprobación de que existe (§4.1); paso 1 del script de F1C-09 (§0 a); recuentos
   P.3 de F1A-03 (§6.1); mirar `SWEEP_ENABLED` y `SWEEP_DRY_RUN` (§0 b); decisión de la ráfaga; nombrar quién
   asigna los cargos de permiso; y lo recomendado del 2026-10-01 (§6).
2. **Deploy de la App**, y en los minutos siguientes la consulta de §4.4. Si falta una tabla o columna, se
   revierte (§4.5).
3. **En el mismo corte:** paso 2 del script de F1C-09 y su recuento posterior; después, asignar `cargo_permiso`
   y marcar el Top 5, en ese orden.
4. **Redespliegue del worker `hub-sync`**, con los dos valores de `SWEEP_*` ya mirados.
5. **Después:** siembra de F1A-03 cuando el Director Técnico entregue el dato, y las verificaciones en la app.

**Lo que puede sorprender al equipo, nuevo desde el 2026-10-01** (lo anterior, en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:95-127`):

1. **Toda «Liberación» desde `Verificación` pide el «Número del certificado de fábrica»**, también la de los
   tickets que ya estén en `Verificación` ese día (F1A-03).
2. **Desaparecen tres botones del flujo de servicio**: «Marcar como pendiente» y los dos «Servicio externo» hacia
   `Por Facturar`; «Diagnóstico complementario» pasa a salir de `En Proceso` (F1C-09).
3. **Servicio Técnico deja de ver «Rechazo» en `Notificación cliente`** y deja de recibir el aviso de área al
   entrar un ticket en ese estado (F1C-10).
4. **El alta de ticket ofrece «darlo de alta manualmente» y «registrarlo como provisional»**, y un ticket con
   cliente provisional o equipo pendiente de validar **no pasa «Habilitar Servicio»** hasta que Comercial enlace y
   valide (F1B-15).
5. **Con compuestos y gases sembrados, un equipo de familia no se libera desde `En Proceso`**: responde 409 «debe
   pasar por Verificación». Con la tabla de gases vacía, ese efecto no alcanza a nadie (F1A-03).

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — treinta y cinco sentencias nuevas, todas al final

`git diff --shortstat ae5aaf4 5f68822 -- packages/zoho-sync/src/db/schema.sql` → «1 file changed, 228
insertions(+)», ninguna línea borrada: ninguna sentencia existente cambia. Las **veintisiete** primeras
(sentencias 1 a 27, hasta la línea 622) son las del paquete del 2026-10-01 y **no se han movido**: su tabla,
sentencia a sentencia, está en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:157-180`. Desde `e8840e7` se añaden
**54 líneas** (una en blanco y `packages/zoho-sync/src/db/schema.sql:624-676`) con **ocho** sentencias:

| # | Sentencia | Línea | Esquema | ¿Calificada? | ¿Idempotente? | Tanda |
|---|---|---|---|---|---|---|
| **28** | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text` | `packages/zoho-sync/src/db/schema.sql:628` | `desk` | No, a propósito (`equipos` está en `DESK_TABLES`) | Sí | F1A-03 |
| **29** | `ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text` | `packages/zoho-sync/src/db/schema.sql:629` | `public` | **Sí** | Sí | F1A-03 |
| **30** | `CREATE TABLE IF NOT EXISTS public.gases_patron (id bigserial PRIMARY KEY, cilindro, compuesto, disponible, vence, registrado_por, created_at)` | `packages/zoho-sync/src/db/schema.sql:632-640` | `public` | **Sí** | Sí | F1A-03 |
| **31** | `CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro ON public.gases_patron (cilindro)` | `packages/zoho-sync/src/db/schema.sql:641` | `public` | **Sí** | Sí | F1A-03 |
| **32** | `CREATE TABLE IF NOT EXISTS public.certificados_fabrica (id text PRIMARY KEY, ticket_id, transicion_id, filename, content_b64, size, created_at, created_by)` | `packages/zoho-sync/src/db/schema.sql:644-653` | `public` | **Sí** | Sí | F1A-03 |
| **33** | `CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket ON public.certificados_fabrica (ticket_id)` | `packages/zoho-sync/src/db/schema.sql:654` | `public` | **Sí** | Sí | F1A-03 |
| **34** | `CREATE TABLE IF NOT EXISTS public.clientes_provisionales (id text PRIMARY KEY, razon_social, nit, contacto, telefono, correo, motivo, creado_por_*, created_at, enlazado_*)` | `packages/zoho-sync/src/db/schema.sql:658-673` | `public` | **Sí** | Sí | F1B-15 |
| **35** | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` | `packages/zoho-sync/src/db/schema.sql:676` | `desk` | No, a propósito | Sí | F1B-15 |

**F1C-09, F1C-10, el barrido de reconciliación y booksHub no tocan el esquema.**

- **Las tres columnas nuevas son anulables, sin `DEFAULT`, sin `CHECK` y sin relleno.** `equipos` va sin calificar
  porque está en `DESK_TABLES` (`packages/zoho-sync/src/db/migrate.ts:63-64`) y la conexión de la App fija
  `search_path=desk,public` (`packages/zoho-sync/src/db/pool.ts:5`). La lista cerrada de compuestos vive en
  `packages/shared/src/gasPatron.ts:13`, no en la base.
- **Las tres tablas nuevas están en `PUBLIC_TABLES`** (`packages/zoho-sync/src/db/migrate.ts:73`, al final de la
  línea: `gases_patron`, `certificados_fabrica`, `clientes_provisionales`). Nacen vacías y sin clave foránea.
  Sus `NOT NULL` no pueden rechazar nada que ya exista.
- **Punto y coma.** `schemaStatements` trocea el fichero por `;` a ciegas
  (`packages/zoho-sync/src/db/migrate.ts:19-21`). Comprobado sobre `5f68822`: de la línea 449 a la 676 hay
  **exactamente 35 líneas con `;`**, una por sentencia; en el bloque nuevo son ocho, y **ningún comentario del
  bloque nuevo lleva `;`**.
- **Ninguna toca las cuatro tablas replicadas** (`DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51`
  no aplica.

**Totales del rango `ae5aaf4..5f68822`:** once tablas nuevas, quince columnas nuevas anulables y sin `DEFAULT`
sobre tablas existentes, y nueve índices, todos sobre tablas nuevas. Nada se borra ni se renombra.

### 2.2 · Dónde se aplican, y qué se rompe si una sentencia se omite

Se aplican solas al arrancar la App (`apps/desk/server/index.ts:26-27`) y, sobre `zoho-hub`, al arrancar el
worker (`apps/hub-sync/src/hubSync.ts:13`); en el worker son inertes (`git grep` de los cuatro nombres nuevos
sobre `apps/hub-sync` en `5f68822` → 0). El detalle de las 27 anteriores, con su tabla de consecuencias, está en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:250-290`. Para las ocho nuevas:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| **sentencia 35 (`equipos.pendiente_validar`)** | **Todo lo que lee un equipo por su id**: el alta de ticket con equipo registrado, «Habilitar Servicio», la validación, y la lista y la hoja de vida de equipos. Responden 500 | `getEquipo` nombra la columna (`apps/desk/server/db/equipos.ts:78`); el alta lo llama (`apps/desk/server/services/ticketService.ts:26`) y la guarda de «Habilitar Servicio» también (`apps/desk/server/services/ticketService.ts:261`); la lectura completa la nombra (`apps/desk/server/db/equipos.ts:164-167`) |
| **sentencia 28 (`equipos.compuesto`)** | La lista y la hoja de vida de equipos, el alta de equipo y toda «Liberación» de un ticket con equipo | `apps/desk/server/db/equipos.ts:164-167`, `apps/desk/server/db/equipos.ts:123` y `apps/desk/server/db/gasesPatron.ts:17` |
| sentencia 29 (`catalogo_modelos.compuesto`) | El alta de un equipo con modelo del catálogo | `apps/desk/server/db/equipos.ts:418`, llamada desde `apps/desk/server/db/equipos.ts:120` |
| sentencia 30 (`public.gases_patron`) | **Toda «Liberación»** de un ticket con equipo responde 500. Sin equipo, no | La consulta une `equipos` con `gases_patron` (`apps/desk/server/db/gasesPatron.ts:17`) en cada `liberacion` (`apps/desk/server/services/ticketService.ts:241-245`); sin equipo sale antes (`apps/desk/server/db/gasesPatron.ts:15`) |
| sentencia 31 (índice único de cilindro) | Nada visible. *Hipótesis:* el bloque D de la siembra, que usa `ON CONFLICT (cilindro)`, fallaría | `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:89-91` |
| sentencia 32 (`public.certificados_fabrica`) | Adjuntar, listar y descargar el PDF del certificado. La liberación, no | `apps/desk/server/db/certificadosFabrica.ts:27`, `apps/desk/server/db/certificadosFabrica.ts:34` |
| sentencia 33 (índice) | Nada visible | Índice no único |
| sentencia 34 (`public.clientes_provisionales`) | El alta manual con cliente provisional, el enlace y la búsqueda de clientes cuando pide provisionales. Los listados sólo la consultan si algún ticket lleva un cliente con prefijo provisional | `apps/desk/server/services/altaManual.ts:137`, `apps/desk/server/db/clientesProvisionales.ts:28`, `apps/desk/server/routes/directory.ts:16`, `apps/desk/server/db/ticketsConCliente.ts:15-24` |

### 2.3 · Otros ficheros SQL del rango

Los del paquete del 2026-10-01 no cambian (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:292-305`). Nuevos, y
**ninguno corre al desplegar**: `docs` no entra en la imagen y nada del arranque los invoca.

| Fichero | Qué hace | Quién y cuándo | ¿Escribe? |
|---|---|---|---|
| `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` | Recuento y traslado de los tickets de servicio en `Pendiente` | Alfonso, en el corte (§0 a) | **Sí**: `INSERT` y `UPDATE` en una transacción (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`) |
| `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` | Recuentos previos, compuesto por modelo, herencia a equipos, excepciones y gases patrón | Alfonso, con el dato del Director Técnico (§6.1) | **Sí**: transacción de `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:49-99` |

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Comprobado para `e8840e7..5f68822`:

- `git diff --name-only -G"process\.env|import\.meta\.env|VITE_" e8840e7 5f68822 -- apps packages` → vacío.
- `git diff --stat e8840e7 5f68822 -- DEPLOY.md packages/zoho-sync/src/config.ts Dockerfile package.json
  package-lock.json` → vacío. `.env.example` y `.github` tampoco cambian (cabecera).
- Para `ae5aaf4..e8840e7` lo midió el paquete anterior, con el mismo resultado
  (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:309-377`); se resume a continuación.

**Lo que no es nuevo pero este paquete obliga a mirar:**

- **`SWEEP_ENABLED` y `SWEEP_DRY_RUN`** (worker): ya existían y están documentadas (`DEPLOY.md:200-201`), pero
  `afa4252` amplía lo que el barrido puede borrar. §0 (b).
- **`N8N_AVISOS_WEBHOOK_URL`** decide si las alarmas salen por correo o sólo en la campana, y
  **`AVISOS_COPIA_EMAIL`**, si tiene valor, recibe copia de todas las alarmas. Sus valores en producción no están
  verificados. Detalle en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:335-354`.

**Ninguna de las tandas nuevas enciende un escritor hacia fuera.** F1B-15 no escribe en Zoho ni en `books.*`
(`apps/desk/server/services/altaManual.ts:11-16`, `apps/desk/server/db/clientesProvisionales.ts:80-86`); F1A-03
sólo lee `gases_patron` (`apps/desk/server/db/gasesPatron.ts:5-8`) y escribe el PDF en la base de la App. El
barrido de reconciliación (`7f99f07`, `51ae313`) es un comando de línea (`package.json:20`): su único importador
fuera de su carpeta es un auxiliar de pruebas (`apps/desk/server/testing/arbolDePrueba.ts:1`), así que ni la App
ni el worker lo cargan (comprobado por `grep` de importaciones, no por un guardián).

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy — CONDICIÓN DE PARADA

Obligatoria por dos decisiones: copia previa a cada cambio, con responsable **Alfonso (Gerencia)**
(`openspec/config.yaml:2253-2261`, `decision/p55-backup`), y, expresamente para este rango,
`decision/f1c09-copia-antes-de-desplegar` (§0 a). No hay copia de pruebas: la única red es ésta
(`openspec/config.yaml:1705-1707`).

`DEPLOY.md` **no describe** ningún procedimiento de copia. Lo siguiente es **hipótesis**, no procedimiento
verificado, igual que en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:397-405`:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
# La cadena de conexión es la variable DATABASE_URL del servicio App: el NOMBRE, nunca su valor en un chat.
pg_dump --format=custom --file=desk_antes_de_5f68822.dump "$DATABASE_URL"
```

**Criterio de hecho, sea cual sea el método: existe un fichero de copia con fecha de hoy, fuera del servidor, y
su tamaño no es cero. Sin eso comprobado, no se despliega.**

Sobre `zoho-hub`: el paquete anterior decía que no necesitaba copia porque sus cambios eran aditivos. **Con el
barrido activo y borrando (§0 b), eso deja de ser cierto para los pagos**: una fila que Zoho ya no tiene no se
puede volver a traer de Zoho. Si `SWEEP_ENABLED=true` y `SWEEP_DRY_RUN=false`, decidir antes si se copia el hub.

### 4.2 · Publicar

`DEPLOY.md` cubre el mecanismo y no se repite: App en `DEPLOY.md:177-180`, worker en `DEPLOY.md:186-205`.

- **Publicar `5f68822` entero, no un commit intermedio** (§7).
- **App y worker son servicios independientes.** El worker hay que redesplegarlo aparte para que `afa4252` tenga
  efecto. Qué versión corre hoy el worker no está verificado.
- **Orden del corte:** copia comprobada → paso 1 de F1C-09 → Deploy de la App → §4.4 → paso 2 de F1C-09 y
  recuento posterior → cargos de permiso → Top 5 → worker.

### 4.3 · La imagen

Sin cambios desde el paquete anterior: ni `Dockerfile` (`Dockerfile:19-22`, `Dockerfile:27-29`), ni
`package.json`, ni `package-lock.json` cambian en `e8840e7..5f68822`. Detalle en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:435-449`. Que la imagen de `5f68822` construya en EasyPanel es
**hipótesis**: no se ha construido.

### 4.4 · Comprobar que producción está en el commit publicado

**El bundle** (mismo método que el 2026-09-10, `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`):

1. Construcción local de `5f68822`, el 2026-10-03: fichero `index-DZ1geyGk.js` (387,84 kB; 387.839 bytes),
   sha256 `505de5a61bbd1a6778fc88d2a4b7c35945346de701be05a7fe6dcd3d984fd286`. Se construyó dos veces en dos
   carpetas distintas fuera del repositorio y dio el mismo nombre y el mismo sha256.
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente qué `index-*.js`
   carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `5f68822`.** Si sale `index-BRgjbhPT.js`, es el bundle de `e8840e7`
   (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:456-458`): se publicó el commit equivocado.

*Límites:* la referencia se construyó en Windows y producción construye en `node:22-alpine`; que den los mismos
bytes es **hipótesis**. Se construyó con `vite build`, sin el `tsc -b` que antepone `npm run build`; el
compilador de tipos no interviene en el bundle (hipótesis razonable, no ejecutada). Y el bundle sólo prueba el
cliente.

**Que la migración entró — obligatorio, en los minutos siguientes al Deploy.** Consola de PostgreSQL de
producción, base `desk`, **sólo lectura**. Es la consulta del paquete anterior ampliada con tres tablas, tres
columnas, dos índices y tres claves primarias:

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
       to_regclass('public.clientes_provisionales') AS clientes_provisionales;
-- Deben salir los ONCE nombres, ninguno NULL.

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
        ('public','users','cargo_permiso'))
 ORDER BY 1, 2, 3;
-- Deben salir 15 filas, todas con is_nullable = YES y column_default vacío.
-- Si falta ('public','users','cargo_permiso'), NADIE puede usar la aplicación: revertir ya.
-- Si falta ('desk','equipos','pendiente_validar') o ('desk','equipos','compuesto'), no se puede leer
--   ningún equipo ni crear tickets con equipo registrado: revertir.
-- Si falta ('desk','tickets','modalidad'), no se puede crear ningún ticket.
-- pendiente_validar debe salir con data_type = boolean; las dos compuesto y cargo_permiso, text.

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
                    to_regclass('public.clientes_provisionales'))
 ORDER BY 1;
-- Deben salir 7 filas. Las tres nuevas, las tres con PRIMARY KEY (id).

SELECT (SELECT count(*) FROM public.cliente_prioridad)      AS filas_top5,
       (SELECT count(*) FROM public.prioridad_ajustes)      AS filas_ajustes,
       (SELECT count(*) FROM public.users WHERE cargo_permiso IS NOT NULL) AS usuarios_con_cargo,
       (SELECT count(*) FROM public.gases_patron)           AS gases,
       (SELECT count(*) FROM public.certificados_fabrica)   AS certificados,
       (SELECT count(*) FROM public.clientes_provisionales) AS provisionales,
       (SELECT count(*) FROM desk.equipos WHERE compuesto IS NOT NULL)  AS equipos_con_compuesto,
       (SELECT count(*) FROM desk.equipos WHERE pendiente_validar)      AS equipos_pendientes;
-- Justo después del Deploy, las ocho a 0: todo nace vacío y sin relleno.

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después del Deploy; 1 fila tras la primera pasada (unos 3 minutos). Anotar `corte`.

ROLLBACK;
```

Si falta algo, buscar `migrate: sentencia omitida` en el log del servicio App
(`packages/zoho-sync/src/db/migrate.ts:33`) y **pasar a §4.5**. Después: **entrar en la aplicación** y abrir el
tablero, y mirar el log tras el primer ciclo, como describe
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:550-565`.

**Y que la migración de F1C-09 entró:** el recuento posterior del paso 3 (§0 a), con el grupo 1 a 0.

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel.** La base no hay que tocarla para que `ae5aaf4`
funcione: las quince columnas nuevas son anulables y sin `DEFAULT`, y `ae5aaf4` no nombra ninguna de las piezas
nuevas (`git grep -c "gases_patron\|certificados_fabrica\|clientes_provisionales\|pendiente_validar" ae5aaf4 --
apps packages` → sin resultados; la palabra «compuesto» sólo aparece allí en tres títulos de prueba, con otro
sentido). El razonamiento para las 27 sentencias anteriores, las señales que obligan a revertir y las que no,
están en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:567-730`.

**Lo que la reversión de código NO deshace.** Del paquete anterior siguen valiendo todos los puntos de
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:584-672` (cargos, Top 5, ajustes, tickets en `Solicitud Soporte`
sin salida, corte de alarmas, asociaciones, contratos). Nuevos:

- **(h) La migración de F1C-09 no se deshace sola.** Los tickets trasladados siguen en `En Proceso` con su fila
  marcador. `En Proceso` es estado de servicio en `ae5aaf4`, así que no quedan varados. Devolverlos a `Pendiente`
  es el bloque `-- REV` del script (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`), con el aviso de
  §0 (a) sobre las filas marcador; es dato de producción y decisión de persona.
- **(i) Los clientes provisionales y los equipos manuales se quedan.** `ae5aaf4` no conoce
  `public.clientes_provisionales`: *hipótesis*, un ticket cuyo cliente lleva el prefijo provisional
  (`packages/shared/src/altaManual.ts:11`) se vería sin nombre de cliente. Y la guarda de «Habilitar Servicio»
  desaparece: esos tickets pasarían sin enlace ni validación.
- **(j) Compuestos, gases y certificados quedan inertes.** La guarda de Verificación y la exigencia del
  certificado desaparecen; lo ya liberado y sus trazas no cambian
  (`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:224`). La siembra no se
  revierte.
- **(k) Servicio Técnico recupera «Rechazo» en `Notificación cliente`** y los tres botones retirados vuelven.
- **(l) Las filas que el barrido haya borrado en `zoho-hub` no vuelven** redesplegando el worker anterior.

**Volver al estado exacto de la base** es restaurar la copia de §4.1 junto con redesplegar `ae5aaf4`; se pierde
todo lo escrito después del Deploy. Procedimiento en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:680-694`,
que es **hipótesis**.

**Señales nuevas que obligan a volver atrás:**

| Señal | Qué significa |
|---|---|
| No se puede abrir ninguna hoja de vida ni crear un ticket con un equipo registrado (500) | Falta `desk.equipos.pendiente_validar` o `desk.equipos.compuesto` (§2.2) |
| Toda «Liberación» de un ticket con equipo responde 500 | Falta `public.gases_patron` (§2.2) |
| Tras el paso 2 de F1C-09, el recuento posterior no da 0 en el grupo 1, o el paso 2 da error | La migración no entró como se espera. No repetir a ciegas: leer el error y, si hace falta, restaurar la copia |

**No son motivo de reversión:** el 422 «Falta el número del certificado de fábrica»; el 409 «… debe pasar por
Verificación antes de liberarse»; el 422 «No se puede habilitar el servicio: …»; el 409 «El NIT … ya está en
Books…»; un técnico que ya no ve «Rechazo» en `Notificación cliente` ni «Marcar como pendiente»; el 400
«Transición desconocida» para una de las tres ids retiradas.

---

## 5 · Cambios de comportamiento y riesgos

Producción no tiene ninguno de los de esta sección.

### 5.1 · Lo nuevo desde `e8840e7`

| Cambio archivado (`tanda`, `cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|
| `2026-10-01-verificacion-gas-patron-certificado` (**F1A-03**, `cierra: si`; deja fuera la siembra y la edición del compuesto desde la hoja de vida, `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/archive-report.md:7-10`) | **(1) CAMBIO VISIBLE (a):** toda «Liberación» desde `Verificación` pide el «Número del certificado de fábrica» —texto obligatorio, PDF opcional—, también para los tickets que ya estén en `Verificación` ese día. Sin él, 422 «Falta el número del certificado de fábrica». **(2) CAMBIO VISIBLE (b):** un equipo con compuesto y gas patrón vigente de ese compuesto no se libera desde `En Proceso`: 409 «Este equipo tiene compuesto con gas patrón vigente: debe pasar por Verificación antes de liberarse». **(3)** Con compuesto y **sin** gas vigente, la liberación desde `En Proceso` pasa, exige el certificado y deja en el historial «Liberado sin Verificación: Sin gas patrón vigente de …». **(4)** Un ticket sin equipo, o con equipo sin compuesto, no cambia. **(5)** PDF opcional del certificado, que se adjunta después de liberar: sólo Servicio Técnico, sólo PDF, sólo descarga. **(6)** El compuesto de un equipo lo corrige sólo un administrador y el alta lo hereda del modelo. **Con la tabla de gases vacía y sin compuestos sembrados, (2) y (3) no alcanzan a nadie** | Veredicto: `packages/shared/src/gasPatron.ts:69-79` (vigencia, `packages/shared/src/gasPatron.ts:38-40`). Servidor: `apps/desk/server/services/ticketService.ts:131` (409, tras el área y antes de todo 422), `apps/desk/server/services/ticketService.ts:134` (422 del certificado), `apps/desk/server/services/ticketService.ts:155` (motivo en la traza), `apps/desk/server/services/ticketService.ts:241-250`. Lectura: `apps/desk/server/db/gasesPatron.ts:14-26`. Campo: `packages/shared/src/transitions.ts:359-360`. PDF: `apps/desk/server/routes/certificadoFabrica.ts:28-43` (403 en `:33-35`, 409 en `:37`, 415 en `:38-40`), descarga `apps/desk/server/routes/certificadoFabrica.ts:52-54`, borrado sólo administrador `apps/desk/server/routes/certificadoFabrica.ts:58-60`. Compuesto: `apps/desk/server/routes/equipos.ts:110`. Cliente: `apps/desk/src/components/TransitionPanel.tsx:179`, `apps/desk/src/components/CertificadoFabricaPdf.tsx:11` |
| `2026-10-01-tres-transiciones-cifra-anclada` (**F1C-09**, `cierra: si`) | **(1)** Desaparecen «Marcar como pendiente» (`En Proceso` → `Pendiente`) y las dos «Servicio externo» hacia `Por Facturar` (desde `Pendiente` y desde `Notificado`). **(2)** «Diagnóstico complementario» sale de `En Proceso`, no de `Pendiente`. **(3)** `Pendiente` deja de ser estado de servicio: sólo existe en soporte remoto. **(4)** Las tres ids retiradas responden 400 «Transición desconocida». Cifras: 31 transiciones, 35 pasos del mapa, 20 estados de servicio | Retiradas: `packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`. Diagnóstico: `packages/shared/src/transitions.ts:244`. Estado: `packages/shared/src/estados.ts:182`. 400: `apps/desk/server/services/ticketService.ts:123`. Cifras: `packages/shared/src/cifrasAncladas.test.ts:24`. Informe: `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:25-34` |
| `2026-10-02-rechazo-solo-comercial` (**F1C-10**, `cierra: si`) | **(1)** El «Rechazo» de `Notificación cliente` pasa a ser sólo de Comercial: un usuario sólo de Servicio Técnico deja de ver el botón y recibe 403 por API. Las otras dos «Rechazo» siguen admitiendo a Servicio Técnico. **(2)** Servicio Técnico deja de recibir el aviso de área cuando un ticket entra en `Notificación cliente` (supuesto S-1) | `packages/shared/src/transitions.ts:236`; las otras dos, `packages/shared/src/transitions.ts:234` y `packages/shared/src/transitions.ts:238`. 403: `apps/desk/server/services/ticketService.ts:129-130`. S-1: `openspec/changes/archive/2026-10-02-rechazo-solo-comercial/archive-report.md:74` |
| `2026-10-02-alta-manual-equipo-cliente` (**F1B-15**, `cierra: si`; deja fuera sólo tareas de persona y el aviso P-A, `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/archive-report.md:5-8`) | **(1) Alta manual de equipo** en el alta de ticket («El equipo no está registrado: darlo de alta manualmente»): serial y su confirmación, modelo del catálogo o marca, texto y tipo, y motivo. El equipo nace «pendiente de validar». **(2) Cliente provisional** («El cliente no está en la lista: registrarlo como provisional»): razón social, NIT, contacto, teléfono, correo y motivo. No se combina con un cliente existente ni con una orden de venta. **(3)** Si el NIT ya está en Books, 409 con los candidatos para elegir uno. **(4) Enlace**: Comercial o un administrador enlaza el provisional con su contacto de Books desde la hoja de vida («Enlazar»); reescribe el cliente de sus tickets y equipos, con traza. **(5) Validación**: «Validar equipo», mismos permisos, con traza. **(6) Guarda de «Habilitar Servicio»**: mientras el cliente sea provisional o el equipo esté pendiente, 422 «No se puede habilitar el servicio: …». **(7)** Marca «provisional» en el buscador de clientes y en la tarjeta | Alta: `apps/desk/server/services/ticketService.ts:24-28`, `apps/desk/server/services/ticketService.ts:91`, `apps/desk/server/services/ticketService.ts:96`; exigencias en `apps/desk/server/services/altaManual.ts:38-51` y `apps/desk/server/services/altaManual.ts:58-89`; contenido `apps/desk/server/services/altaManual.ts:99-117`; 409 del NIT `apps/desk/server/services/altaManual.ts:158-161` con `packages/shared/src/altaManual.ts:46-53`. Enlace: `apps/desk/server/routes/altaManual.ts:20-38`, transacción `apps/desk/server/db/clientesProvisionales.ts:87-110`. Validación: `apps/desk/server/routes/altaManual.ts:40-52`. Guarda: `apps/desk/server/services/ticketService.ts:258-264`, mensaje `packages/shared/src/altaManual.ts:74-79`. Resolución de clientes: `apps/desk/server/services/clientes.ts:20-31`. Rutas montadas en `apps/desk/server/app.ts:61`. Cliente: `apps/desk/src/components/AltaManual.tsx:26`, `apps/desk/src/components/AltaManual.tsx:58`, `apps/desk/src/components/AltaManual.tsx:154`, `apps/desk/src/components/AltaManual.tsx:160`, `apps/desk/src/components/CreateTicket.tsx:319`, `apps/desk/src/components/TicketCard.tsx:54` |
| booksHub `afa4252` (fuera del plan) | Nada en la App. En el worker, el barrido incluye los pagos de clientes (§0 b) | `packages/zoho-sync/src/booksHub/sync.ts:190-192` |
| `2026-10-02-barrido-avance-archivado` (`fuera-del-plan`) | Nada: herramienta de repositorio (`npm run reconcile`) | `package.json:20` |

**Las rutas nuevas, con su guarda.** Todas bajo `requireAuth(db)`.

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `POST /api/tickets/:id/certificado-fabrica` | 404 ticket → 400 sin archivo → **403** fuera de Servicio Técnico → **409** sin liberación registrada → **415** si no es PDF | `apps/desk/server/routes/certificadoFabrica.ts:28-43` |
| `GET /api/tickets/:id/certificado-fabrica` y `…/:pdfId` | Sólo sesión; 404 si el PDF no es de ese ticket | `apps/desk/server/routes/certificadoFabrica.ts:45-56` |
| `DELETE /api/tickets/:id/certificado-fabrica/:pdfId` | Sólo administrador | `apps/desk/server/routes/certificadoFabrica.ts:58-60` |
| `POST /api/clientes-provisionales/:id/enlace` | 404 provisional o contacto → **403** sin Comercial → **409** ya enlazado → **422** sin contacto → transacción → 409 por carrera | `apps/desk/server/routes/altaManual.ts:20-38` |
| `POST /api/equipos/:id/validacion` | 404 → **403** sin Comercial → **409** si no está pendiente | `apps/desk/server/routes/altaManual.ts:40-52` |

**Regla 13, decisión a decisión, de los `.tsx` nuevos o cambiados:**

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Ofrecer el PDF sólo en «Liberación» y subirlo después de liberar (`apps/desk/src/components/TransitionPanel.tsx:179`, `apps/desk/src/components/TransitionPanel.tsx:111`) | `apps/desk/server/routes/certificadoFabrica.ts:37` (409 sin liberación) y `apps/desk/server/routes/certificadoFabrica.ts:38-40` (415) |
| No marcar el número como obligatorio en el formulario (`packages/shared/src/transitions.ts:360`, `required: false`) | `apps/desk/server/services/ticketService.ts:134`: el servidor decide cuándo se exige |
| Desactivar «Habilitar Servicio» con alta pendiente (`apps/desk/src/components/TransitionPanel.tsx:70`, con `motivoAltaPendiente` de `shared`) | `apps/desk/server/services/ticketService.ts:258-264`: 422 |
| Enseñar «Enlazar» y «Validar equipo» sólo a quien puede (`apps/desk/src/components/AltaManual.tsx:147`, `apps/desk/src/components/AltaManual.tsx:159-160`) | `apps/desk/server/routes/altaManual.ts:31` y `apps/desk/server/routes/altaManual.ts:47`: 403 |
| Pedir los datos del alta manual en el formulario (`apps/desk/src/components/AltaManual.tsx:26`, `apps/desk/src/components/AltaManual.tsx:58`) | `apps/desk/server/services/altaManual.ts:38-51` y `apps/desk/server/services/altaManual.ts:58-89`: 422 listando lo que falta |

### 5.2 · Lo que arrastra del 2026-10-01, sin cambios de contenido

Se recoge por tanda; el detalle, con sus tablas de rutas y de la regla 13, está en el paquete anterior y se lee
contra `e8840e7`.

| Tanda | Qué ve el usuario, en una línea | Detalle |
|---|---|---|
| F1C-05 `permisos-por-cargo` | Selector «Cargo de permiso» en usuarios; la «Liberación sin factura» exige área Comercial y cargo `Director Comercial` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:739-779` |
| F1B-07 `prioridad-top5-cliente` | «Clientes Top 5 y prioridad», «manda la más alta» al nacer, panel de prioridad con «Ajustar», el técnico pierde la prioridad al escalar, tablero y «Mis tickets» ordenados por urgencia y habilitación | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:739-779` |
| F1B-06 `blueprint-soporte-remoto` | Flujo propio de soporte remoto, nacimiento en `Solicitud Soporte`, selector «Modalidad»; los SR heredados cambian de botones (S-6) | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:781-834` |
| F1B-08 `alarmas-horas-habiles` | Tres alarmas de SLA en horas hábiles al `Coordinador Comercial`, marca «Esperando aprobación del cliente», corte el día del Deploy | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:781-834` |
| F1B-11 (tres cambios) | Protección de la OV elegida en la app, asociaciones OV↔ticket con «Liberar» y cuarentena, contratos por lote con prioridad `High` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:836-879` |
| F1B-12, F1B-14, F1B-04, F1B-06 (cambio 1), F1A-03 (`salidas-verificacion`), F1B-02, F1B-08 (`por-entregar-es-espera`), F1A-08, F1B-10, F1A-07 | Cierres, alta y edición de equipo, novedad con foto, flujo de equipo nuevo, salidas de `Verificación`, hoja de vida, esperas, tercera puerta, precedencia, fechas derivadas | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:892-934` |

**Dos filas de esa tabla cambian de contenido por las tandas nuevas:** la «Liberación» de `salidas-verificacion`
ahora pide certificado (F1A-03), y el alta de equipo nuevo convive con el alta manual (F1B-15), que es otra vía
y otro formulario.

### 5.3 · Riesgos que se publican a sabiendas

**Nuevos.**

**R32 · La migración de F1C-09 se estrena en producción.** Nunca se ha ejecutado contra PostgreSQL real; su
predicado de soporte remoto es más amplio que el de la aplicación; su reversión borra todas las filas marcador;
y el grupo 2 queda sin mover y sin transiciones hasta que Gerencia responda P-1. Todo en §0 (a). Entre el Deploy
y el paso 2, los tickets de servicio en `Pendiente` no tienen botones: **cuántos son no está medido** (lo dice
el paso 1).

**R33 · El barrido puede borrar pagos en `zoho-hub`** si está activo y sin simulacro. §0 (b). El valor de las
dos variables en producción no está verificado.

**R34 · F1A-03 sin siembra queda a medias, y con siembra cambia el taller.** Sin compuestos ni gases, sólo actúa
el certificado desde `Verificación`. Con compuestos y sin gases, todo equipo de familia sale de `En Proceso` con
motivo y certificado; sólo con los dos bloquea
(`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:221`). Cuántos tickets hay hoy
en `Verificación` y en `En Proceso` de los cuatro modelos **no está medido** (P.3, §6.1). Además: los equipos sin
modelo quedan fuera de la guarda y el cambio de compuesto no deja traza
(`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/archive-report.md:88-90`).

**R35 · El script de siembra confirma solo.** Su comentario dice que se escriba `COMMIT` o `ROLLBACK` según
cuadre la comprobación (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:98`), pero la línea siguiente
**ya es `COMMIT;`** (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:99`): ejecutado de corrido,
confirma sin esperar a que nadie mire. Hay que ejecutarlo sentencia a sentencia y parar antes de esa línea. No
se ha ejecutado nunca (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:3-5`).

**R36 · F1B-15: dos decisiones abiertas y un coste sin medir.** Hoy **todo** NIT que ya esté en Books bloquea el
alta manual, también uno genérico (E-154, `docs/sdd/ENTRADA.md:1761`); y nadie avisa de que un provisional ya
tiene contacto en Books: el enlace depende de que alguien se acuerde (E-155, `docs/sdd/ENTRADA.md:1766`). Son
**alcance pendiente de Gerencia, no bloqueo del despliegue**. Además, cada alta manual con cliente provisional
lee todos los contactos de Books (`apps/desk/server/db/clientesProvisionales.ts:69-75`); su coste es hipótesis sin
medir (`openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/archive-report.md:122-123`).

**R37 · F1C-10, supuesto S-1:** Servicio Técnico deja de enterarse por aviso de área de que un ticket entró en
`Notificación cliente`. Reversible con el cambio opuesto del catálogo.

**R38 · El Top 5 no se propaga a los tickets abiertos, y Gerencia decidió que sí.** Lo construido no toca la
prioridad de los tickets existentes al marcar un cliente; la decisión del 2026-10-01 lo cambia y sigue sin
construir (`openspec/config.yaml:3392-3397`). Es el R28 del paquete anterior, que pasa de «pregunta abierta» a
«decidido y pendiente de construir».

**Del paquete del 2026-10-01, con su estado de hoy.** Texto completo en
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:936-1141`.

| Riesgo | Estado el 2026-10-03 |
|---|---|
| R1, R2 (liberar sin Verificación ni certificado) | **Construidos** por F1A-03; R1 depende de la siembra (R34) |
| R3 (tickets «Equipo nuevo» abiertos cambian de flujo), R14 (SR heredados, S-6) | Vivos, sin medir |
| R4, R15 (áreas supuestas de equipo nuevo y soporte remoto) | Vivos |
| R5, R13, R31 (menores) | Vivos |
| R6 (IV-11 reducido), R7 (IV-12) | Vivos, sin destino |
| R8 (contratos sin registrar el día uno), R9 (contrato mal tecleado) | Vivos |
| R10 | Cerrado desde aquel paquete |
| R11, R12 (cuarentena y literales de Books sin medir) | Vivos |
| R16 a R23 (alarmas y `Solicitud Soporte`) | Vivos |
| R24 (hueco sin cargo), R30 (dos «cargo») | Vivos: §0 (c) |
| R25, R26, R27 | Vivos |
| R28 | Decidido, sin construir: R38 |
| R29 | **Confirmado** por Gerencia: la cola queda como está (`openspec/config.yaml:3390-3391`) |

---

## 6 · Tareas de persona — por dueño y en orden de ejecución

Todas las tareas de persona de los cambios archivados cuyos commits están en `ae5aaf4..5f68822` y que no tienen
resultado. **Archivar no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). Las del paquete anterior se
arrastran completas: su lista está en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1198-1239` y aquí se remite a
su paso a paso. Las nuevas van enteras. Una tarea se nombra siempre con su cambio, porque las P.n chocan.

Fuentes de las nuevas: `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:256-259`,
`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/tasks.md:110-113`,
`openspec/changes/archive/2026-10-02-rechazo-solo-comercial/tasks.md:86`,
`openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/tasks.md:130-132`. El cambio
`barrido-avance-archivado` no deja ninguna tarea de despliegue: sus tres filas son de Gerencia sobre el propio
barrido (`openspec/changes/archive/2026-10-02-barrido-avance-archivado/tasks.md:115-117`).

### 6.1 · Alfonso (Gerencia)

| Cuándo | Tarea (con su cambio) | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Antes — PARADA** | **Copia de la base y comprobar que existe** (`decision/f1c09-copia-antes-de-desplegar`, `decision/p55-backup`) | El Deploy entero. Sin ella no se despliega | §4.1 |
| **Antes** | **Recuento previo de F1C-09** — paso 1 del script, sólo lectura | Saber cuántos tickets se mueven, cuáles gobierna Zoho y si alguna clasificación cae mal | §0 (a); abajo |
| **Antes** | **P.3 de `verificacion-gas-patron-certificado`** — contar los tickets en `Verificación` y los «Equipo nuevo» en `En Proceso` de los cuatro modelos | Saber a cuántos alcanza el certificado obligatorio y la guarda | Abajo |
| **Antes** | **Comprobar `SWEEP_ENABLED` y `SWEEP_DRY_RUN`** del servicio `hub-sync` (hipótesis: los administra Alfonso; el paquete anterior nombraba así a quien administra EasyPanel) | Saber si redesplegar el worker empezará a borrar pagos | Abajo |
| **Antes** | P.1 de `blueprint-soporte-remoto` — recuento de SR por estado | Medir S-6 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1264-1290` |
| **Antes** | P.1 de `alarmas-horas-habiles` — hay un usuario activo con cargo de firma `Coordinador Comercial` | Que las alarmas lleguen a esa persona | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1292-1320` |
| **Antes** | Preparar el paso 6 de P.2 de `alarmas-horas-habiles` — localizar un ticket ya vencido | Poder hacer el paso 6 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1348-1368` |
| **Antes** (recomendado) | P.1 y P.4 de F1B-11 — consulta de subOV | Medir cuarentena y literales del saldo | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1370-1394` |
| **Antes** (recomendado) | Mirar `AVISOS_COPIA_EMAIL` y si `N8N_AVISOS_WEBHOOK_URL` tiene valor | Que nadie reciba copia de todas las alarmas sin querer | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1396-1408` |
| **Durante el corte** | **Ejecutar el paso 2 del script de F1C-09** justo tras §4.4, y el **recuento posterior** | Que ningún ticket de servicio quede en `Pendiente` sin botones | §0 (a); abajo |
| **Durante el corte** | Paso 6 de P.2 de `alarmas-horas-habiles` | Cierra S33 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1498-1514` |
| **Después** | **Verificación en la app de F1C-09** | Verificación de la tanda | Abajo |
| **Después** | **P.2 de `verificacion-gas-patron-certificado`** — ejecutar la siembra, **cuando el Director Técnico entregue P.1** | Que la guarda de Verificación actúe | Abajo |
| **Después** | `INSERT` de los cierres de fin de año (F1B-12), antes del 24/12 | Que las alarmas no cuenten esos días | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1550-1567` |
| **Después** | P.2 de `alarmas-horas-habiles`, pasos 1 a 5 (con Comercial), y P.2 de `blueprint-soporte-remoto` (con Servicio Técnico) | Verificación de las dos tandas | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1498-1531` |

**Recuento previo y traslado de F1C-09, paso a paso.**

1. Conectarse a la base `desk` de producción como siempre. **No pegar la cadena de conexión ni la contraseña en
   ningún chat, captura ni documento.**
2. **Antes del Deploy:** ejecutar las tres consultas de
   `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:33-42`. Anotar el recuento por grupo, los números del
   grupo 2 y la lista de clasificaciones. **Si alguna clasificación de la tercera consulta no se reconoce, parar
   y consultarlo antes de seguir.**
3. Deploy de la App y §4.4.
4. **Tras el Deploy, en el mismo corte:** ejecutar `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`.
5. Repetir la primera consulta del paso 1: **el grupo 1 debe salir a 0** o no aparecer.
6. **Devolver:** los tres recuentos previos, el número de filas trasladadas y el recuento posterior.

**Verificación en la app de F1C-09** (`https://ambientalia-desk.ambientalia.cloud/`, con Servicio Técnico). El
cambio no escribió pasos; éstos salen de lo que la tanda cambió (§5.1):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir un ticket de servicio en `En Proceso` | No ofrece «Marcar como pendiente»; sí «Diagnóstico complementario» |
| 2 | Abrir un ticket de servicio en `Notificado` | No ofrece «Servicio externo» hacia `Por Facturar`; conserva sus otras salidas |
| 3 | Abrir uno de los tickets trasladados en el paso 2 del script | Está en `En Proceso`, con botones, y su historial tiene «Traslado de Pendiente a En Proceso (F1C-09)» |
| 4 | Un ticket «Soporte remoto» en `Pendiente`, si lo hay | Sigue en `Pendiente` y ofrece sólo «Continuación soporte» |

**P.3 de `verificacion-gas-patron-certificado`, paso a paso.** Sólo lectura, antes del Deploy: ejecutar las dos
consultas de `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:36-46`, que no leen ninguna columna
nueva. Devolver las dos cifras. Los tickets en `Verificación` son los que necesitarán el número del certificado
desde el Deploy: **avisar a Servicio Técnico y a Calidad antes**.

**Comprobar `SWEEP_ENABLED` y `SWEEP_DRY_RUN`, paso a paso.**

1. En EasyPanel, servicio `hub-sync` → variables de entorno. Mirar **sólo** si existen y qué valor tienen esas
   dos. **No copiar ningún valor a un chat ni a un documento**: basta devolver «activo y borrando», «activo en
   simulacro» o «apagado».
2. **`SWEEP_ENABLED` ausente o distinto de `true`:** apagado. Redesplegar el worker no borra nada.
3. **`SWEEP_ENABLED=true` y `SWEEP_DRY_RUN` ausente o distinto de `false`:** simulacro. El log dirá cuántos
   huérfanos ve en pagos, sin borrar (`apps/hub-sync/src/hub-sync.ts:68-78`).
4. **`SWEEP_ENABLED=true` y `SWEEP_DRY_RUN=false`:** activo. **Si el barrido está activo, borrará las filas de
   `books.customer_payments` y `customer_payment_invoices` que Zoho ya no tenga.** Decidir antes de redesplegar si
   se acepta, si se pasa primero por una pasada en simulacro, o si se copia el hub.

**P.2 de `verificacion-gas-patron-certificado` (la siembra), paso a paso.** Tras el Deploy y con el dato de P.1.

1. Ejecutar las comprobaciones de `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:30-33`: deben salir
   la tabla, las dos columnas y **cuatro** modelos. Si no, no seguir.
2. Rellenar, con los datos del Director Técnico, los bloques marcados `[P.1]`
   (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:64-67`,
   `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:81-85` y
   `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:87-91`).
3. Ejecutar **sentencia a sentencia** desde el `BEGIN` hasta la comprobación 4.E
   (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:49-96`) y **parar ahí** (R35).
4. Si los recuentos cuadran, `COMMIT;`. Si no, `ROLLBACK;`.

⚠️ **¿Puede correr la siembra en parte, sin el dato del Director Técnico? Hay dos lecturas escritas y este
documento no elige:**

| Lectura | Dónde está escrita |
|---|---|
| **Sí, en parte:** «sin P.1 sólo corren A y B» (compuesto de los cuatro modelos AP-370 y herencia a sus equipos) | `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:222`; `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:23-24` |
| **No:** «El script de siembra no se ejecuta hasta tenerla» (respuesta textual de Gerencia, punto 4) | `openspec/config.yaml:3588`, recogido en `openspec/config.yaml:3597-3598` y en `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/archive-report.md:83` |

La segunda es posterior y es una respuesta de Gerencia; la primera es la nota de la tanda. Correr A y B sin
gases cambia el taller (R34), así que **quien ejecute pregunta antes a Gerencia cuál vale**.

### 6.2 · Gerencia (decisiones)

| Cuándo | Decisión | Qué desbloquea | Dónde está |
|---|---|---|---|
| **Antes** | **P.3 de `alarmas-horas-habiles`** — ¿se enciende la ráfaga de lo vencido? Sin respuesta, apagada | Si es «encender», hace falta código nuevo y este paquete no vale | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1322-1346` |
| **Antes** (con administración) | **Precondición de P.1 de `permisos-por-cargo`** — nombrar quién asigna los cargos, preparar la lista y aceptar por escrito el intervalo sólo-administrador; avisar a Comercial y a Servicio Técnico | Que el hueco dure minutos | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1410-1444` |
| **Antes** | Decir cuál de las dos lecturas de la siembra vale | La siembra parcial | §6.1 |
| Sin orden | **P-1 de `tres-transiciones-cifra-anclada`** — qué pasa con los tickets de servicio en `Pendiente` que gobierna Zoho. Supuesto mientras no conteste: los mueve F1F-01 | El grupo 2 de la migración | `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:65` |
| Sin orden | **Q1/Q2 de `alta-manual-equipo-cliente`** — quién hace el alta manual y si los cinco datos son el mínimo | Cerrar dos supuestos de F1B-15 | `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/tasks.md:130` |
| Sin orden | **E-154** — ¿hay NIT genéricos que no deban bloquear el alta manual? | **Alcance pendiente, no bloquea el despliegue** | `docs/sdd/ENTRADA.md:1761` |
| Sin orden | **E-155** (P-A) — ¿se construye el aviso de que un provisional ya está en Books? | **Alcance pendiente, no bloquea el despliegue** | `docs/sdd/ENTRADA.md:1766` |
| Sin orden | Las del paquete anterior que siguen abiertas: los dos rellenos de F1B-11, E-086, E-090, P.4 de `alarmas-horas-habiles`, E-092 y las preguntas 3.b y 3.b.3 | Lo que cada una dice allí | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1714-1737` |

*Salen de esta lista respecto al 2026-10-01:* **E-109 y E-110**, decididas (cabecera; R38 y R29).

### 6.3 · Administrador de la aplicación

| Cuándo | Tarea | Qué desbloquea | Paso a paso |
|---|---|---|---|
| **Durante el corte, lo primero tras §4.4 y la migración** | **P.1 de `permisos-por-cargo`** — asignar `cargo_permiso`, empezando por el Director Comercial | Que Comercial recupere la «Liberación sin factura» | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1462-1496` (paso A) |

### 6.4 · Director Técnico

| Cuándo | Tarea | Qué desbloquea |
|---|---|---|
| **Cuanto antes; no bloquea el Deploy** | **P.1 de `verificacion-gas-patron-certificado`** — entregar la lista de gases patrón (cilindro, compuesto, disponibilidad y vencimiento del certificado del cilindro), el compuesto de cada serial del lote AP-370 de 2024 (24 tickets) y el de los modelos convertidores | Los bloques A (convertidores), C y D de la siembra y, con ellos, la guarda de Verificación (`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:256`) |

Los compuestos se entregan en una de las siete formas de la lista cerrada (`packages/shared/src/gasPatron.ts:13`).

### 6.5 · Director Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** (recomendado) | Preparar la lista Top 5, fuera de la app | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1446-1453` |
| **Durante el corte, tras P.1 de F1C-05** | **P.1 de `prioridad-top5-cliente`** — marcar la lista Top 5 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1462-1496` (paso B) |

### 6.6 · Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Después, el mismo día** | P.7 de `registro-contrato` — alta de los contratos vigentes | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1533-1548` |
| **Después** | **Verificación en la app de F1B-15, cuatro comprobaciones** | Abajo |
| **Después** | **Verificación en la app de F1C-10** (con quien despliega) | Abajo |
| **Después** | P.3 de `parche-iv11-orden-venta`, P.3 de `asociacion-ov-ticket`, P.6 de `registro-contrato` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1569-1614` |
| **Después** | P.2 de `permisos-por-cargo` y P.2 de `prioridad-top5-cliente` (ésta con Servicio Técnico) | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1682-1712` |
| **Después** | RQ-HV-12 (botón «Editar» de la hoja de vida) y las comprobaciones de `hojas-vida`, con Gerencia | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1616-1680` |

**Verificación en la app de F1B-15 — una persona de Comercial**
(`openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/tasks.md:132`: alta manual, enlace, validación y
«Habilitar Servicio»). Sobre `https://ambientalia-desk.ambientalia.cloud/`. El cambio nombra las cuatro
comprobaciones; los pasos salen de lo construido (§5.1).

| # | Comprobación | Paso a paso | Resultado esperado |
|---|---|---|---|
| 1 | **Alta manual** | «Nuevo ticket» → marcar «El cliente no está en la lista: registrarlo como provisional» y «El equipo no está registrado: darlo de alta manualmente» → rellenar los cinco datos del cliente y su motivo, y serial, confirmación, modelo y motivo del equipo → crear | El ticket se crea; su tarjeta y el buscador marcan el cliente como «provisional». Con un NIT que ya esté en Books, el alta se rechaza y ofrece los candidatos |
| 2 | **Enlace** | Hoja de vida del equipo creado → aviso «El cliente … es provisional» → buscar el contacto de Books → «Enlazar» | El cliente del ticket y del equipo pasa a ser el de Books y la marca «provisional» desaparece. Un usuario sin Comercial no ve «Enlazar» |
| 3 | **Validación** | En la misma hoja de vida → «Validar equipo» | Desaparece «El equipo está pendiente de validar»; la sección «Cambios» registra la validación |
| 4 | **«Habilitar Servicio»** | **Antes** de los pasos 2 y 3, abrir el ticket e intentar «Habilitar Servicio»; repetir **después** | Antes: no pasa, con «No se puede habilitar el servicio: …» nombrando lo que falta. Después: pasa |

⚠️ El paso 1 crea un ticket, un equipo y un cliente provisional reales. Hacerlo con un caso de prueba y borrar el
ticket al terminar con «Eliminar ticket» (sólo administrador). *Hipótesis:* el equipo y el cliente provisional de
prueba no se borran con el ticket; el enlace no tiene «deshacer».

**Verificación en la app de F1C-10 — quien despliega / Gerencia, con un usuario de cada área**
(`openspec/changes/archive/2026-10-02-rechazo-solo-comercial/tasks.md:86`):

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Usuario sólo de Servicio Técnico abre un ticket en `Notificación cliente` | **No** ve «Rechazo» |
| 2 | Usuario de Comercial abre el mismo ticket | Ve «Rechazo» |
| 3 | Usuario sólo de Servicio Técnico abre un ticket en `Notificación Comercial` o en `Rev./Diagnostico` | Sigue viendo «Rechazo» |
| 4 | Un ticket entra en `Notificación cliente` | La campana de Servicio Técnico **no** avisa |

### 6.7 · Servicio Técnico y Calidad

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | Enterarse de los cambios visibles: certificado obligatorio desde `Verificación`, tres botones menos, sin «Rechazo» en `Notificación cliente`, prioridad y orden del tablero | §1 |
| **Después** | **P.4 de `verificacion-gas-patron-certificado`** — Calidad y Servicio Técnico, con quien decida Gerencia | Abajo |
| **Después** | P.2 de `blueprint-soporte-remoto` (con Alfonso), RQ-RE-19, comprobaciones de `blueprint-equipo-nuevo` y de `salidas-verificacion`, P.2 de `prioridad-top5-cliente` (con Comercial) | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1516-1531`, `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1616-1662` y `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1682-1712` |

**P.4 de `verificacion-gas-patron-certificado`**
(`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:259`):

| # | Paso | Resultado esperado | ¿Necesita la siembra? |
|---|---|---|---|
| 1 | «Liberación» desde `Verificación` sin número | Se rechaza; con número pasa. El campo no lleva asterisco | No |
| 2 | Adjuntar un PDF; intentar con un PNG | El PDF se adjunta; el PNG se rechaza | No |
| 3 | Un equipo con compuesto y gas vigente, en `En Proceso` → «Liberación» | «… debe pasar por Verificación antes de liberarse» | Sí, completa |
| 4 | Un equipo con compuesto y sin gas vigente → «Liberación» | Pasa, y el historial dice «Liberado sin Verificación: Sin gas patrón vigente de …» | Sí, bloques A y B |
| 5 | Un ticket sin equipo, o con equipo sin compuesto | No cambia, salvo el certificado desde `Verificación` | No |

⚠️ Los pasos 1, 3 y 4 mueven tickets reales: hacerlos sobre uno que de verdad haya que liberar, o sobre uno de
prueba que se borra después.

### 6.8 · Quien publica

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | Comprobar por el bundle en qué commit está producción | §4.4 |
| **Durante el corte** | Deploy de la App; §4.4 entero; avisar a Alfonso para el paso 2 de F1C-09 | §4.2, §4.4 |
| **Durante el corte** | Redespliegue del worker, **sólo después** de la comprobación de `SWEEP_*` | §0 (b) |

### 6.9 · Sin dueño con nombre (arrastradas)

Alta con serie nueva y con serie registrada (`alta-equipo-nuevo-en-ticket`), pestaña «EN ESPERA»
(`por-entregar-es-espera`), y zona `America/Bogota` en el contenedor (`fechas-derivadas-servidor`):
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1664-1680`. La zona horaria vale ahora también para «hoy» en la
vigencia de los gases patrón (`apps/desk/server/services/ticketService.ts:244`).

---

## 7 · Lo que NO es desplegable

**Nada en `5f68822`, cumplida la condición de §0 (a).** Lo comprobado para el tramo nuevo; para
`ae5aaf4..e8840e7` vale la tabla de `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1741-1757`.

| Condición que haría `5f68822` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración de esquema no idempotente | **No hay.** Las ocho nuevas llevan `IF NOT EXISTS` | §2.1 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Tres columnas anulables sin `DEFAULT`; los `NOT NULL` son de tablas nuevas | §2.1, §4.5 |
| Una sentencia sin calificar que aterrice en el esquema equivocado | **No hay.** Las dos sin calificar son sobre `equipos`, de `DESK_TABLES`; las tres tablas están en `PUBLIC_TABLES` | §2.1 |
| Un `;` en un comentario que parta una sentencia | **No hay.** 35 líneas con `;`, una por sentencia | §2.1 |
| Un interruptor de escritor sin documentar | **No hay variable nueva.** El barrido de pagos cuelga de dos interruptores que ya existían y están documentados | §3, §0 (b) |
| Trabajo a medias en el código | **No hay.** En `git diff e8840e7 5f68822 -- apps packages`, las líneas añadidas con `it.fails`, `.skip(`, `it.todo`, `FIXME` o `XXX` son 0 | — |
| Un estado sin salida | **No en el catálogo:** `Finalizado` es el único (`packages/shared/src/invariantesGrafo.test.ts:177`). **Sí en los datos, de forma transitoria:** los tickets de servicio en `Pendiente` entre el Deploy y la migración | §0 (a) |
| Un «no se despliega sin X» con X fuera del paquete | **No.** F1C-09 exige copia previa: §0 (a) y §4.1. F1A-03 pide un paquete nuevo (`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:216`): es este documento, y los siete puntos de su nota (`openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/tasks.md:218-224`) están en §2.1, §5.1, R34 y §6 |
| Una decisión previa sin la cual lo publicado sería otro | Sólo la ráfaga de alarmas, con valor por defecto escrito: apagada | §0 (c) |

**Publicar `5f68822` entero, no un commit intermedio.** A los tramos del paquete anterior
(`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1759-1791`) se añaden éstos, que son **lectura del orden de los
commits y de sus títulos, no ejecución** (hipótesis sobre el comportamiento exacto de cada intermedio):

- **F1C-09, entre `ad1aaa0` y `42f591e`:** el primero retira las transiciones y el script de migración llega con
  el segundo. Publicar `ad1aaa0` deja los tickets de servicio en `Pendiente` sin salida y sin script.
- **F1B-15, entre `8bd4121` y `ba7547e`:** el primero trae la guarda de «Habilitar Servicio» y las rutas de
  enlace y validación; la interfaz llega con el segundo. En ese tramo un ticket con alta pendiente quedaría
  bloqueado sin pantalla para desbloquearlo.
- **F1A-03, entre `f644027` y `5251896`:** el servidor exige el certificado desde `Verificación` y la interfaz
  del PDF llega después.

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se leyeron contra el árbol de `5f68822` y se pasaron por el detector de
`pre-push` (`apps/desk/server/citas/cli.ts`) sobre un árbol temporal que incluye este fichero. Las del paquete
del 2026-10-01 a las que se remite **no se han vuelto a leer una a una**: son ciertas de `e8840e7`, y de los
ficheros que citan cambian después, entre otros, `apps/desk/server/services/ticketService.ts`,
`packages/shared/src/transitions.ts`, `packages/shared/src/estados.ts` y `apps/desk/server/routes/remision.ts`.
Las que este documento repite como críticas (§0 c) sí se releyeron en `5f68822`.

Los SHA de la tabla de la cabecera se comprobaron con `git show --stat` y `git merge-base --is-ancestor` contra
sus merges. El bundle se construyó dos veces fuera del repositorio; `dist/` del repositorio no se tocó.

---

## 9 · Lo no comprobado

Todo lo que este documento afirma sin haberlo podido comprobar desde el repositorio, o que marca «hipótesis»:

1. **Que producción siga hoy en `ae5aaf4`.** Consta en el paquete anterior y ningún commit registra un
   despliegue; el estado real sólo lo dice el bundle (§4.4).
2. **El valor de `SWEEP_ENABLED` y `SWEEP_DRY_RUN` en producción**, y por tanto si redesplegar el worker borra
   pagos (§0 b). Tampoco la versión que corre hoy el worker.
3. **El valor de `N8N_AVISOS_WEBHOOK_URL` y `AVISOS_COPIA_EMAIL` en producción** (§3).
4. **Tipos, lint y pruebas en `5f68822`, en local: no repetidos.** Se ejecutaron sobre `f375bbf` (cabecera), y
   después de `f375bbf` no cambia código. Sobre `5f68822` lo único medido es el CI en verde (run 37124911134);
   no se abrió su registro para confirmar qué pasos corrieron contra PostgreSQL real.
5. **Que el bundle de Windows y el de `node:22-alpine` sean idénticos**, y que anteponer `tsc -b` no cambie el
   bundle (§4.4). Y que la imagen de `5f68822` construya en EasyPanel (§4.3).
6. **Los procedimientos de copia y restauración** con `pg_dump` y `pg_restore` (§4.1, §4.5).
7. **El comportamiento de la migración de F1C-09 y de la siembra de F1A-03 en PostgreSQL real**: ninguna de las
   dos se ha ejecutado nunca (§0 a, R35).
8. **Cuántos tickets de servicio hay en `Pendiente`**, en cada grupo; cuántos tickets hay en `Verificación` y
   cuántos «Equipo nuevo» en `En Proceso` de los cuatro modelos (§6.1). Sólo consta la medición en Zoho Desk del
   2026-10-02: 0 en «Pendiente» entre 250 no archivados, con la hipótesis de que la API no listó archivados.
9. **Que el bloque D de la siembra falle sin el índice único de cilindro** (§2.2), y **que un ticket con cliente
   provisional se vea sin nombre tras revertir a `ae5aaf4`** (§4.5, i).
10. **Que el equipo y el cliente provisional de prueba no se borren al eliminar el ticket** (§6.6).
11. **El coste de leer todos los contactos de Books en cada alta manual** (R36).
12. **El comportamiento de los commits intermedios** de §7: no se construyeron ni probaron por separado.
13. **Que quien administra las variables del worker sea Alfonso** (§6.1).
14. **Que ni la App ni el worker carguen el barrido de reconciliación**: comprobado sólo por `grep` de
    importaciones estáticas (§3), no por un guardián que recorra el grafo.
15. **Todo lo que el paquete del 2026-10-01 dejó sin medir y sigue igual**
    (`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1833-1842`): recuento de SR de S-6, recuento de «Equipo nuevo»,
    OV en cuarentena, literales de Books, tamaño de lo que se marca en silencio, cargo de firma
    `Coordinador Comercial`, liberaciones sin factura en el hueco sin cargo, forma de `books.sales_orders` en
    producción y zona horaria del contenedor.
