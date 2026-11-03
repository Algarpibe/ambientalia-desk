# Paquete de despliegue — 2026-11-03, adenda: el servidor de `75664c92` y la corrección del worker

Adenda a los paquetes fechados anteriores, que **no se editan**. El último era
`docs/sdd/Paquete_de_Despliegue_2026-11-02.md`. Esta adenda hace tres cosas. Deja el estado de producción antes del
despliegue de `75664c92` (`relleno-completo-conversaciones`, tanda 1G-01, `cierra: si`). Corrige lo que los paquetes del
27/10 al 02/11 decían del worker `zoho-hub-sync`. Y añade la fila de `75664c92` a la tabla de publicaciones, pendiente de
desplegar. Va `fuera-del-plan` con el mismo motivo que las anteriores: `decision/excepcion-plazo-rq-kp-26`, punto (4) de
su respuesta textual (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`).

**De dónde sale cada dato.** Todas las horas van en UTC. Ninguna sesión de construcción entra en producción. Hay tres
fuentes, y cada dato dice la suya:

- **Dato de Alfonso**, del 02/11: la hora del redespliegue de la App (log de la App), y el commit, la hora y las
  variables del worker (registro de despliegue de EasyPanel, logs del worker y SQL). Supervisión los recoge en
  `docs/sdd/ENTRADA.md` → E-259 y E-260.
- **Medida del analista**, 2026-10-30: el cliente servido (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:24-29`).
- **Medida de esta sesión**, el 2026-11-03: la fusión `75664c92` y su CI; las comparaciones de git de §1, §2 y §3; las
  horas de los pushes, sacadas de las ejecuciones del CI (`gh run list`); y las rutas y líneas, leídas en `75664c92`.

Lo que ninguna de las tres comprueba va marcado como **hipótesis**.

---

## 1 · Estado de hoy en producción, antes de este despliegue

**Cliente: `index-F1jDYjEU.js`.** La última medida es la del analista, el 30/10 a las 14:06
(`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:24-29`). Después hubo al menos dos redespliegues de la App: el del
encendido del 30/10 (el relleno arrancó a las 14:57:52, `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:51-52`) y el del
02/11. El bundle no se ha vuelto a medir. **Hipótesis:** que siga siendo el mismo. Lo apoya que ningún commit de `main`
entre `e5f9bbde` y `a729a371` toca `apps/` ni `packages/` (abajo).

**Servidor: el código de `dc6ecd28` y `e5f9bbde`** (`docs/sdd/Paquete_de_Despliegue_2026-11-02.md:26-29`).

**Redespliegue de la App el 02/11 a las 17:07:52** (dato de Alfonso, log de la App). El motivo no consta. **A esa hora
`main` estaba en `bdfb455e`, no en `a729a371`** (medida de esta sesión):

- `a729a371` se commiteó a las 18:54:29 del 02/11 y su push lanzó el CI a las 18:57:01, casi dos horas después del
  arranque.
- El último push anterior al arranque fue el de `bdfb455e`, el 30/10 a las 14:27:15. El siguiente, `51f7ea08`, llegó a
  las 17:25:10 del 02/11, diecisiete minutos después del arranque.
- Para el código del servidor da igual. `git diff --stat e5f9bbde bdfb455e -- apps packages` y
  `git diff --stat e5f9bbde a729a371 -- apps packages` salen **los dos vacíos**: desde `e5f9bbde` hasta `a729a371`, `main`
  sólo recibió documentación.
- **Hipótesis:** que EasyPanel construyera desde `main` de GitHub en ese momento.

**Interruptores.** `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES`, **encendidos desde el 30/10** en
el servicio App (dato de Alfonso; `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:31-33`).
`RELLENO_CONVERSACIONES_HABILITADO` no existe en el código que corre: `git grep` no la encuentra en `e5f9bbde`, y entra
con `75664c92`.

## 2 · Corrección: el worker `zoho-hub-sync` (E-259)

**El worker corre `63604b9b` desde el 22/10 a las 12:45** (dato de Alfonso del 02/11, registro de despliegue de
EasyPanel; `docs/sdd/ENTRADA.md` → E-259).

**Lo que decían los paquetes del 27/10 al 02/11 era erróneo desde el 22/10.** Esos paquetes no se editan; los corrige esta
adenda:

- `docs/sdd/Paquete_de_Despliegue_2026-10-27.md:34` y `docs/sdd/Paquete_de_Despliegue_2026-10-28.md:37`: «no consta que se
  haya redesplegado desde el 11/10».
- `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:59-60`: no consta redespliegue ni commit.
- `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:35`: «sin cambio».

**Medidas de esta sesión:**

- `git merge-base --is-ancestor afa4252 63604b9b` sale con **código 0**: el barrido de los pagos de clientes (`afa4252`,
  «barrer pagos de clientes borrados en Zoho», 01/10) **está dentro** de lo que corre el worker. Lo que
  `docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:39-43` daba como «no activo en el worker» lo está desde el 22/10.
- `63604b9b` se commiteó el 22/10 a las 11:25:57, antes del despliegue de las 12:45, y está en `main`
  (`git merge-base --is-ancestor 63604b9b 75664c92`, código 0).
- `git diff --stat 63604b9b 75664c92 -- apps/hub-sync packages/zoho-sync`, sin contar las pruebas, da **6 ficheros** de
  `packages/zoho-sync` (+208 −29) y ninguno de `apps/hub-sync`. Vienen de tres fusiones: `7c9b3db7` (F1F-01, 26/10),
  `dc6ecd28` y `75664c92`. El worker no los lleva (§6).

**El barrido** (E-260). En el worker, `SWEEP_ENABLED=true` y `SWEEP_DRY_RUN=false` (dato de Alfonso). Con `false` el
barrido borra de verdad: sólo frena con un valor distinto de `false` (`packages/zoho-sync/src/config.ts:119`). Hasta el
02/11, la línea del barrido de `books.customer_payments` dice «borrados 0» en todas las pasadas, de 1460 a 1464 pagos
(dato de Alfonso). Las tres columnas de la condición (i) existen en `zoho-hub`, esquema `desk` (dato de Alfonso).

Gerencia lo confirma el 02/11 (`decision/e260-sweep-dry-run-false`, `openspec/config.yaml` →
`decisiones_de_gerencia_adenda`). Su respuesta, literal:

> «SWEEP_DRY_RUN se queda en false. La tarea de redesplegar el worker se da por hecha con ese valor. Seguimiento: revisar
> una vez por semana la línea «sweep books customer_payments» del log del worker (hasta hoy, 0 borrados).»

**Las dos tareas de persona del worker quedan cerradas:**

- **«Averiguar con qué commit corre el worker»** (`docs/sdd/Paquete_de_Despliegue_2026-11-02.md:118`): **HECHA**. La
  responde E-259: `63604b9b`.
- **«Redesplegar el worker con las condiciones (h) e (i) y `SWEEP_DRY_RUN=true`»**
  (`docs/sdd/Paquete_de_Despliegue_2026-11-02.md:119`): **CERRADA SIN HACER**, por dos razones:
  1. El redespliegue ya se había hecho el 22/10. Las condiciones (h) e (i)
     (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:52-55`) se comprobaron después y se cumplen (E-260).
  2. `SWEEP_DRY_RUN=true` ya no aplica. Era una recomendación
     (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:57-62`), y Gerencia ha decidido que se queda en `false`
     (`decision/e260-sweep-dry-run-false`).

  La decisión dice «se da por hecha con ese valor». Aquí se registra además que la tarea, tal como estaba escrita, no se
  ejecutó: el worker corre con `false`. Queda abierto sólo el seguimiento semanal (§6).

## 3 · Qué trae `75664c92`

Fusión `--no-ff` de la rama `relleno-completo-conversaciones` (`bf65cd67`) sobre `a729a371`, el 03/11 a las 11:21. Es la
tanda **1G-01**, con `cierra: si`, y construye `decision/adelanto-09-11-empezar-1g`. El CI `41627152347` sale en verde
(medida de esta sesión).

**Sólo cambia el servidor:**

- `POST /api/admin/relleno-conversaciones` y el `GET` de la misma ruta, sólo para superadministrador
  (`apps/desk/server/routes/rellenoConversaciones.ts:36`, `apps/desk/server/routes/rellenoConversaciones.ts:46`). El `POST`
  lanza la pasada en segundo plano; el `GET` sólo devuelve el estado y nunca lanza.
- El interruptor `RELLENO_CONVERSACIONES_HABILITADO`, que nace cerrado (`=== 'true'`,
  `packages/zoho-sync/src/config.ts:125`). Cerrado, el `POST` da `403` nombrando la variable
  (`apps/desk/server/routes/rellenoConversaciones.ts:17-18`). La excepción es `limite=0`: sólo cuenta, sin llamar a Zoho
  ni escribir (`apps/desk/server/routes/rellenoConversaciones.ts:39`, `apps/desk/server/rellenoConversaciones.ts:147-151`).
- `syncTicket` acepta un detalle ya leído (`packages/zoho-sync/src/sync.ts:178-179`). El cableado de la App está en
  `apps/desk/server/app.ts:50` y `apps/desk/server/app.ts:57`.
- La §21 de `DEPLOY.md` (`DEPLOY.md:882`), con sus dos frases y sus pasos (`DEPLOY.md:904-912`).
- Sin migración: `git diff --stat dc6ecd28 75664c92 -- '*.sql'` sale vacío.

**El cliente no cambia:** `git diff --stat a729a371 75664c92 -- apps/desk/src` sale vacío. El build del intento i6 dio
`index-F1jDYjEU.js`, de 427,51 kB
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:70`). Es una medida de la tanda,
sobre su árbol. **Hipótesis:** que producción siga sirviendo ese bundle después del despliegue. Se mide en el paso (d).

**Con el marcado encendido, el relleno también marca.** El relleno toma `marcar` de `MARCAR_CONVERSACIONES_AUSENTES`
(`apps/desk/server/app.ts:50`), que está encendida desde el 30/10. Cuando se lance (paso e), marcará lo que Zoho ya no
devuelve. Es lo que dice el paso 7 de la §21 (`DEPLOY.md:912`).

**Recorre otra población que el relleno del 30/10.** Aquel recorría la lista `/tickets` de Zoho y llegó a 258 de 784
tickets (`docs/sdd/Paquete_de_Despliegue_2026-11-02.md:123-129`). Este recorre las filas de `desk.tickets`, sin las
`app-` (`apps/desk/server/rellenoConversaciones.ts:56-62`). **Hipótesis:** que eso cubra los cerrados antiguos. Lo dirá el
resumen de la pasada (P-3).

## 4 · Publicaciones desde la última del 30/10

Es la misma tabla que `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:105-108`, desde su última fila. El encendido del 30/10
y el redespliegue del 02/11 no añaden fila: no trajeron código nuevo (§1).

| Fecha | Commit de `main` | Bundle | Qué llevó |
|---|---|---|---|
| **pendiente de desplegar** | `75664c92` | `index-F1jDYjEU.js` (sin cambio según el build de la tanda; sólo servidor) | 1G-01 `relleno-completo-conversaciones`: `POST` y `GET /api/admin/relleno-conversaciones`, sólo superadministrador, tras `RELLENO_CONVERSACIONES_HABILITADO`, que nace cerrado; `syncTicket` con detalle ya leído; sin migración |

## 5 · Pasos de Alfonso, en orden

**(a) Copia previa** de `desk-db` (base `desk`) con el botón de EasyPanel.

**(b) Redesplegar la App desde `main` `75664c92`**, con `RELLENO_CONVERSACIONES_HABILITADO` **ausente**, es decir,
cerrada. `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES` se quedan como están.

**(c) Comprobar el servidor sin abrir nada.** Como superadministrador, desde la consola del navegador con la sesión de
Desk abierta:

    const r = await fetch('/api/admin/relleno-conversaciones?limite=0', { method: 'POST' }); [r.status, await r.json()]

- Tiene que devolver `200` con `aRecorrer` y `saltadosApp`
  (`apps/desk/server/rellenoConversaciones.ts:147-151`), sin llamar a Zoho ni escribir.
- Sin `desde`, la suma de los dos es el número de filas de `desk.tickets`
  (`apps/desk/server/rellenoConversaciones.ts:56-62`). Se puede contrastar con `SELECT count(*) FROM desk.tickets;`.

Después, la misma orden **sin parámetros**:

    const r = await fetch('/api/admin/relleno-conversaciones', { method: 'POST' }); [r.status, await r.json()]

- Tiene que dar `403` con un mensaje que nombra `RELLENO_CONVERSACIONES_HABILITADO`
  (`apps/desk/server/routes/rellenoConversaciones.ts:17-18`).
- Un `403` que diga «Requiere permisos de administrador» es otro: la sesión no es de superadministrador
  (`apps/desk/server/auth/middleware.ts:26-27`).

> ⚠️ **Escribir exactamente `limite=0`.** `limite=00` pasa la validación
> (`apps/desk/server/routes/rellenoConversaciones.ts:26`), pero `apps/desk/server/routes/rellenoConversaciones.ts:39`
> compara con el literal `'0'`. Con la variable cerrada, `00` da el `403`. Con la variable abierta (paso e), lanza una
> pasada vacía que reinicia el estado y borra el resumen anterior
> (`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/verify-report.md:154`).

**(d) Medir el cliente:** el nombre y el tamaño del bundle que sirve producción. Lo esperado es `index-F1jDYjEU.js`, de
427.510 bytes (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:28`).

**(e) Aparte, y sólo después de (c): el relleno.** Se hace según la §21 de `DEPLOY.md`, pasos 1-7
(`DEPLOY.md:904-912`). Es la tarea P-2
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:121`).

- Abre la variable, así que lleva **su propia copia previa** (paso 1), distinta de la de (a).
- Marcará lo ausente, porque `MARCAR_CONVERSACIONES_AUSENTES` está encendida (§3).
- La §21 no dice si la variable se cierra al terminar. Si se cierra, la vuelta atrás es quitarla y redesplegar
  (`DEPLOY.md:895`).

**(f) P-1:** añadir a `.env.example` la línea `RELLENO_CONVERSACIONES_HABILITADO=` (`DEPLOY.md:899`;
`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:120`). La fusión no toca
`.env.example`.

## 6 · Pendientes de persona

| Tarea | Lo hace | Destino |
|---|---|---|
| Pasos (a) a (d): copia previa, despliegue de `75664c92` con la variable cerrada, comprobación del servidor y medida del cliente | Alfonso | §5 de esta adenda |
| P-2: el relleno, paso (e), con su propia copia previa | Alfonso | `DEPLOY.md` §21; `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:121` |
| P-3: pasar el resumen al analista y llevar los descuadrados y los «no está en Zoho» a la bandeja | Alfonso / analista | Bandeja (R-3), Supervisión; `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:122` |
| P-1: la línea de `.env.example`, paso (f) | Alfonso | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:120` |
| Seguimiento semanal: leer la línea «sweep books customer_payments» del log del worker | Alfonso (supuesto de Supervisión: la respuesta no nombra dueño) | `decision/e260-sweep-dry-run-false` |
| Prueba del borrado de un comentario en Zoho (H-3) | Alfonso | `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:116` |
| Revisar en los logs de la App si hubo `429` | Alfonso | `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:117` |

Las dos últimas siguen abiertas desde el paquete del 02/11. Las dos del worker de ese paquete quedan cerradas (§2).

**Sobre `debt.md:602`**, que dice «CERRADO por `relleno-completo-conversaciones`»: el mecanismo está cerrado; la
ejecución depende de P-2. Es el supuesto S-32 del informe de archivo
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:112`).

**Para la bandeja (R-3), como hipótesis: el worker va por detrás de `main` en `packages/zoho-sync`.** Corre `63604b9b` y
no lleva los 6 ficheros que han cambiado después (§2).

- **Hipótesis:** que ninguno de esos cambios afecte a lo que hace el worker. No se ha evaluado.

Esta sesión no da de alta la entrada: `docs/sdd/ENTRADA.md` es de Supervisión.
