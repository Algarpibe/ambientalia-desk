# Paquete de despliegue — 2026-10-06 (adenda: copia semanal de Drive)

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada.** La publicación es una
acción manual: el CI no despliega, sólo verifica (`DEPLOY.md:270-271`).

**Esta adenda es INCREMENTAL y NO sustituye al paquete del 2026-10-05 (b)**
(`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md`, medido sobre `36dc352`, que no se toca). Lo **complementa** con lo que
entró en `main` después, en el rango **`36dc352..cdfd0b0`**. Quien publique `cdfd0b0` necesita los dos: las condiciones
de parada, la copia de la base, el esquema, el procedimiento y las tareas de persona de aquél siguen en pie y aquí no
se repiten ni se han vuelto a leer. Cada dato lleva la ruta y la línea leídas en `cdfd0b0`.

## 0 · Medición del rango

| Dato | Valor |
|---|---|
| Cabeza medida | `cdfd0b0`, fusión `--no-ff` de la rama `respaldo-semanal-drive` (cabeza `22bce3d`) |
| Rango | `36dc352..cdfd0b0`, **14 commits** (`git rev-list --count`) |
| `git diff --shortstat 36dc352 cdfd0b0` | 34 files changed, 3374 insertions(+), 29 deletions(-) |
| Código (`-- apps packages`) | **21 ficheros, +1.489/−3**; sin pruebas: **10 ficheros, +539/−1** |
| Cliente (`-- apps/desk/src`) | **sin cambios** |
| Esquema (`packages/zoho-sync/src/db/schema.sql`) | **sin cambios**: esta adenda no añade ninguna sentencia |
| `Dockerfile`, `package.json`, `package-lock.json` | **sin cambios**: ninguna dependencia nueva |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` | sólo `DEPLOY.md` (+52 líneas, apartado 13, `DEPLOY.md:418-468`) |

## 1 · Qué pieza entra

**La copia semanal de la carpeta de Drive (`respaldo-semanal-drive`, F1F-02, `cierra: no`).** Una vez por semana la App
copia la carpeta de documentación de servicio al mismo almacenamiento S3 del respaldo nocturno, cifrada con la misma
clave, sin pasar por el disco del servidor, sólo lo nuevo o cambiado y con retención de 12 meses por código
(`DEPLOY.md:420-424`). Está **adelantada con el interruptor cerrado** (`decision/f1f02-copia-semanal-drive-adelantada`,
`openspec/config.yaml:3865`).

**Publicar `cdfd0b0` con el interruptor ausente no cambia nada observable.** Con `RESPALDO_DRIVE_HABILITADO` distinto de
`true` exacto, la App no programa la pasada (`apps/desk/server/index.ts:113`), no pide token a Google y no lista,
descarga ni sube nada (`apps/desk/server/respaldo/copiaDrive.ts:102`). Encenderla exige reiniciar la App, porque la
configuración se lee al arrancar (`apps/desk/server/index.ts:112`).

El resto del rango es documental: el paquete del 05/10 (b), el recálculo de la R01.4, la reconciliación y el registro de
la decisión que adelanta esta copia.

## 2 · Variables de entorno — las cinco `RESPALDO_DRIVE_*`, todas apagadas al publicar

Todas son del servicio **App**. Ninguna está en el fichero de ejemplo de entorno: añadir sus líneas es tarea de persona
(§3, paso 4). No hay variables nuevas para el destino: se reutilizan `RESPALDO_S3_*`, `RESPALDO_CLAVE_CIFRADO` y
`RESPALDO_AVISO_EMAIL` del respaldo nocturno (`DEPLOY.md:439-440`).

| Variable | Valor al publicar | Dónde se lee | Documentada en |
|---|---|---|---|
| `RESPALDO_DRIVE_HABILITADO` | **Ausente** (apagado). `=== 'true'`. Se enciende tras las tareas de §3 | `apps/desk/server/respaldo/configDrive.ts:31` | `DEPLOY.md:426-430` |
| `RESPALDO_DRIVE_CREDENCIAL` | Vacía; JSON de la cuenta de servicio en base64, **sólo en el gestor de secretos** | `apps/desk/server/respaldo/configDrive.ts:34` | `DEPLOY.md:434` |
| `RESPALDO_DRIVE_CARPETA_ID` | Vacía; el id de la carpeta raíz | `apps/desk/server/respaldo/configDrive.ts:35` | `DEPLOY.md:435` |
| `RESPALDO_DRIVE_DIA` | Ausente; por defecto `0` (domingo) | `apps/desk/server/respaldo/configDrive.ts:32` | `DEPLOY.md:436` |
| `RESPALDO_DRIVE_HORA` | Ausente; por defecto `5` (hora del contenedor) | `apps/desk/server/respaldo/configDrive.ts:33` | `DEPLOY.md:437` |

**Qué se rompe si el interruptor se pone mal** (`DEPLOY.md:426-430`): encendido sin la credencial, la carpeta, el destino
o la clave, cada pasada falla y manda un correo que nombra la variable que falta
(`apps/desk/server/respaldo/configDrive.ts:47-55`); apagado por descuido, no hay copia de Drive y nadie recibe aviso.

## 3 · Tareas de persona — ninguna sesión las hace

Dueños: Gerencia (el proveedor) y la persona con acceso al despliegue. Están escritas en `DEPLOY.md:462-468` y en
`openspec/changes/archive/2026-10-06-respaldo-semanal-drive/archive-report.md:60-69`. Van **después** del encendido del
respaldo nocturno (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:670`), porque comparten proveedor, destino y clave.

| Paso | Quién | Qué |
|---|---|---|
| 1 | Gerencia | Elegir el proveedor (`p55c-proveedor-copia`), que cuesta dinero. Es el mismo del respaldo nocturno |
| 2 | La persona con acceso al despliegue | Crear la cuenta de servicio de Google con **lectura** de la carpeta y guardar su credencial en el gestor de secretos; nunca en un chat, una captura o un prompt |
| 3 | La persona con acceso al despliegue | El almacenamiento tiene que ser **versionado**, con **bloqueo de borrado de 12 meses** y con la regla de ciclo de vida `AbortIncompleteMultipartUpload` |
| 4 | La persona que publica | Añadir al fichero de ejemplo de entorno las seis líneas de `DEPLOY.md:443-448` |
| 5 | La persona con acceso a producción | `RESPALDO_DRIVE_HABILITADO=true` y reiniciar la App |
| 6 | La persona responsable del respaldo | La prueba mensual de restauración incluye recuperar un documento de la carpeta (`DEPLOY.md:456-460`) |

## 4 · Hipótesis de esta adenda

1. **Sin verificar hasta elegir proveedor:** que el bloqueo de borrado exija `Content-MD5` en cada parte, el límite de
   exportación de Drive y que el proveedor elegido admita versionado, bloqueo y multiparte como S3
   (`openspec/changes/archive/2026-10-06-respaldo-semanal-drive/archive-report.md:58`).
2. Ninguna pasada real se ha ejecutado: las pruebas usan dobles de Drive y de S3. La primera copia real es la del paso 5.
3. Límite conocido de la prueba «sin disco», sin efecto en lo que se publica: `docs/sdd/ENTRADA.md`, E-235.

## 5 · Añadido por `ovi-garantia-por-cargo` (F1B-03, parte OVI) — condición previa de persona

**Antes de publicar el commit que traiga este cambio, hay que asignar los cargos de permiso** (respuesta de Gerencia del 06/10,
`decision/e157-ovi-garantia-por-cargo`, punto 4). Asociar una orden `OVI-` a un ticket lo hace sólo quien tiene el cargo Director Técnico,
o un administrador (`packages/shared/src/cargos.ts:71-74`). **Si se publica sin cargos asignados, sólo un administrador podrá asociar
una OVI** en el alta, en «Habilitar Servicio», en la orden adicional de las aprobaciones y en la remisión de entrada; los demás verán un
`403`. No hay variable de entorno ni interruptor: la guarda está activa desde que se publica.

| # | Quién | Qué | Cómo se comprueba |
|---|---|---|---|
| 1 | Gerencia | Decir qué persona lleva el cargo Director Técnico | — |
| 2 | Un administrador | Asignarle el cargo en la pantalla de usuarios, antes de publicar | Esa persona asocia una OVI a un ticket de prueba y no ve el `403` |

Lo que NO cambia al publicar: un ticket que ya tiene su OVI (venido de Zoho o creado en la aplicación) la conserva y puede seguir su
flujo; reconfirmarla no pide el cargo. Y un ticket con tipo de servicio «Garantía» deja de admitir una orden que no sea OVI cuando la
orden entra; los que ya la tienen asociada no se tocan.

## 6 · Traspaso de `ovi-garantia-por-cargo` — dos preguntas y un límite, para Supervisión y para el Director Técnico

Fusionado a `main` en `9822bd7`. Lo que sigue no es tarea de ninguna sesión de construcción: son dos decisiones de negocio que la tanda
dejó sin respuesta y un límite conocido de lo construido. **No tienen entrada en `docs/sdd/ENTRADA.md`**: el fichero tenía cambios de
Supervisión sin commitear cuando se escribió esto, así que la entrada la abre Supervisión.

### 6.1 · Las dos preguntas, que van juntas

| # | Pregunta | Qué hace hoy la aplicación | Qué desbloquea la respuesta |
|---|---|---|---|
| a | **¿Una OVI sólo puede ir en tickets de garantía?** Pendiente desde la respuesta 2.5 de Gerencia del 06/10 | No lo impone: la guarda construida es la contraria —un ticket de Garantía sólo admite OVI (`packages/shared/src/ordenOVI.ts:61-64`)— y una OVI puede entrar en un ticket de cualquier tipo de servicio si quien la asocia tiene el cargo (`packages/shared/src/ordenOVI.ts:54-58`) | Si la respuesta es «sí», falta una guarda nueva (escalón C) en las mismas cuatro puertas |
| b | **En un ticket de garantía, ¿se puede cobrar aparte un repuesto no cubierto con una orden normal?** | **Lo bloquea**: la orden adicional de las aprobaciones pasa por la misma regla, y en un ticket de Garantía toda orden que entra y no es OVI da `422` (`apps/desk/server/services/guardasOVI.ts:22`) | Si la respuesta es «sí», la orden adicional queda exenta de «Garantía sólo con OVI» y hay que decir si la exención vale también para la orden principal |

Las dos son la misma frontera vista desde cada lado —qué órdenes caben en qué tickets— y conviene responderlas a la vez: una respuesta
«sí» a (b) con un «sí» a (a) deja un ticket de garantía con una OVI y una orden normal, que es coherente; un «no» a (b) obliga a abrir
otro ticket para el repuesto.

### 6.2 · El límite del prefijo

«Es OVI» se decide por el prefijo literal `OVI-`, sin distinguir mayúsculas y tras recortar espacios en los extremos
(`packages/shared/src/subOV.ts:63-67`). **Un número tecleado a mano como «OVI 26-1» (con espacio) u «OVI–26-1» (con raya en vez de
guion) NO cuenta como OVI**: no pide el cargo, y en un ticket de Garantía se rechaza como orden normal. El segundo efecto falla cerrado;
el primero no. Hipótesis, no medida aquí: una orden elegida en el buscador llega con el número que le da Books, así que el límite afectaría sólo al texto libre.

## 7 · Añadido por `ficha-garantia-proveedor` (F1B-13, `cierra: no`) — tabla nueva, sin interruptor y una condición de persona

**Qué entra.** La ficha de reclamación de garantía al fabricante: sobre cada OVI asociada a un ticket, quien lleva el cargo Director Técnico
(o un administrador) responde «¿Se reclama al fabricante?»; un «sí» abre una ficha que avanza abierta → enviada → resuelta, y un «no» guarda
uno de tres motivos. Una ficha sin resolver a los 60 días naturales avisa una sola vez, a quien lleva el cargo o, si nadie lo lleva, al
área Servicio Técnico. Añade **una tabla**, `public.garantia_proveedor` (`packages/zoho-sync/src/db/schema.sql`, al final), que `migrate`
crea al arrancar; no toca la replicación ni el hub. **No hay variable de entorno ni interruptor**: está activa desde que se publica. La
comprobación de lectura tras desplegar está en `DEPLOY.md`, apartado «Comprobación de lectura tras desplegar F1B-13».

**Condición ya registrada: asignar el cargo Director Técnico antes de publicar** (la misma de §5, `decision/e157-ovi-garantia-por-cargo`,
consecuencia 5). Sin él, **sólo un administrador responde la pregunta**, y el aviso de 60 días cae al área Servicio Técnico en lugar de ir
al cargo. No hace falta una tarea nueva: si §5 ya se cumplió, ésta también.

**Lo que se verá el día de publicar.** Toda OVI ya asociada a un ticket aparece como «Pendiente de respuesta», porque la tabla nace vacía
y no hay relleno. Es seguro, y el volumen no está medido.

Lo que NO hace esta pieza: no calcula el valor reclamado (se captura a mano), no mide el valor recuperado por marca ni las piezas con
fallas repetidas, y no envía la pieza por remisión; el punto 7 del Anexo D sigue abierto.

| # | Quién | Qué | Qué desbloquea |
|---|---|---|---|
| P-1 | Gerencia, con quien tenga acceso a la base de producción | Comprobar si las líneas de una OVI traen costo, dónde (el `raw` de `books.sales_orders`, o sólo el hub) y en qué moneda | El valor reclamado automático |
| P-2 | Gerencia | Confirmar los 60 días y que sean naturales (hoy: el día 61 avisa) | Deja firme la frontera del aviso |
| P-3 | Gerencia y un administrador | Asignar el cargo Director Técnico antes de publicar | Que alguien más que el administrador responda, y que el aviso vaya al cargo |
| P-4 | Gerencia | Pegar en el maestro la corrección 29 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`) | El maestro deja de decir «al crear» y «tomado del costo» |

Archivar el cambio no da por hechas estas cuatro tareas.

## 8 · Traspaso de `ficha-garantia-proveedor` y de `sync-tickets-por-modificacion` — para el Director Técnico y para Supervisión

`ficha-garantia-proveedor` está fusionado a `main` en `9b48aa8`; `sync-tickets-por-modificacion`, en `f32f153`. Lo que sigue no es tarea
de ninguna sesión de construcción. **No tiene entrada en `docs/sdd/ENTRADA.md`**: el fichero tenía cambios de Supervisión sin commitear
cuando se escribió esto, así que la entrada la abre Supervisión.

### 8.1 · Para el Director Técnico — dos confirmaciones sobre la ficha de reclamación

| # | Qué confirmar | Qué hace hoy la aplicación | Qué cambia si la respuesta es «no» |
|---|---|---|---|
| a | **Que la respuesta a «¿Se reclama al fabricante?» no se cambia una vez dada** | Una segunda respuesta sobre la misma orden da `409` (`apps/desk/server/routes/garantiaProveedor.ts:55`, y la línea 59 de ese fichero para la carrera). No hay ruta para pasar de «no» a «sí» ni al revés: de una ficha abierta se editan sus cinco datos, no la respuesta (`apps/desk/server/db/garantiaProveedor.ts:116-117`) | Hace falta una vía para corregir la respuesta, y decidir quién puede usarla y si deja traza |
| b | **Que el valor reclamado se escribe a mano** | Se captura en el formulario y se guarda con origen `manual` (`apps/desk/server/db/garantiaProveedor.ts:99`, `packages/shared/src/garantiaProveedor.ts:37`); admite quedar vacío y sólo se valida que sea un número mayor o igual a 0 (`packages/shared/src/garantiaProveedor.ts:137-138`). No se calcula desde el costo de la orden | El valor automático depende de la tarea P-1 de §7 (si las líneas de una OVI traen costo, dónde y en qué moneda) |

### 8.2 · Para Supervisión — un hueco menor de `sync-tickets-por-modificacion` y su relleno pendiente

**El hueco.** Al leer el detalle de cada ticket modificado, un error `429`, `≥ 500` o de red corta la pasada
(`packages/zoho-sync/src/sync.ts:418`, `packages/zoho-sync/src/sync.ts:424`) y el ciclo siguiente continúa. **Un detalle que falla con
otro código —un `403` o un `404`, por ejemplo— se salta y la pasada sigue** (`packages/zoho-sync/src/sync.ts:419`). La marca de agua es
el mayor `modified_time` de los tickets ya guardados (`packages/zoho-sync/src/sync.ts:381`), así que al guardarse los tickets posteriores
puede adelantar al que se saltó. Lo que lo acota: cada ciclo vuelve a pedir desde la marca menos un solape
(`packages/zoho-sync/src/sync.ts:385`), de modo que el ticket saltado se reintenta mientras caiga dentro de ese solape; fuera de él, no
vuelve a salir hasta que Zoho lo modifique otra vez. Queda registrado en la consola (`packages/zoho-sync/src/sync.ts:417`), sin aviso.
Hipótesis, no medida: que un detalle dé `403` o `404` justo después de aparecer en la búsqueda es raro —un ticket borrado o movido entre
las dos llamadas—.

**El relleno en producción sigue pendiente.** Las tres tareas de persona del cambio (el relleno `backfillTickets`, el log del primer ciclo
y comprobar que el ticket nº 884 figura cerrado) están en
`openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/archive-report.md`, con su dueño. Archivar y fusionar no las da por hechas.

## 9 · Añadido por `reasignacion-con-motivo` (F1B-05, `cierra: si`) — tabla nueva, sin interruptor, cinco supuestos para Gerencia y cuatro tareas de persona

**Qué entra.** Reasignar la persona a cargo de un ticket **sin cambiar de estado**, con motivo obligatorio. Una ruta nueva,
`POST /api/tickets/:id/reasignar` (`apps/desk/server/routes/reasignacion.ts:23`); una tabla nueva, `public.reasignaciones`
(`packages/zoho-sync/src/db/schema.sql:756`), que `migrate` crea al arrancar; el aviso a la persona de destino, en la aplicación y por
correo, con el motivo y el nombre de quien reasigna (`apps/desk/server/services/avisoReasignacion.ts:18`); un evento nuevo en el historial
del ticket, con De, A, Motivo y Reasignado por; y el panel «Reasignar» en el detalle del ticket
(`apps/desk/src/components/PanelReasignar.tsx`, montado en `apps/desk/src/components/TicketDetailView.tsx:320`). **No hay variable de
entorno ni interruptor**: está activo desde que se publica. La comprobación de lectura tras desplegar está en `DEPLOY.md`, apartado
«Comprobación de lectura tras desplegar F1B-05».

**Quién puede reasignar hoy.** Un administrador, o quien tenga el área de alguna de las transiciones que salen del estado actual del
ticket dentro de su flujo (`packages/shared/src/reasignacion.ts:24-27`). No hace falta ser la persona a cargo y el cargo no cuenta. El
destino puede ser cualquier persona activa (`apps/desk/server/routes/reasignacion.ts:35`). El maestro dice «la persona a cargo y el
Director o el Coordinador del área»; Gerencia aplazó esa restricción a F1C-05 (`decision/e089-e220-visibilidad-y-traspaso`) y se entrega
como corrección 30 del maestro.

### 9.1 · Para Gerencia — cinco supuestos reversibles, a confirmar o corregir

| # | Qué confirmar | Qué hace hoy la aplicación | Qué cambia si la respuesta es «no» |
|---|---|---|---|
| S-2 | **En un estado sin transiciones de salida («Finalizado», por ejemplo), ¿sólo reasigna un administrador?** | La lista de áreas del estado queda vacía y sólo pasa el administrador (`packages/shared/src/reasignacion.ts:26`); a los demás la ruta les responde `403` (`apps/desk/server/routes/reasignacion.ts:29`) y el panel no se les enseña | Hay que decidir quién más puede reasignar en esos estados (el área del último estado, por ejemplo) y cambiar el predicado de `shared`, su barrido de pruebas y la prueba de la ruta |
| S-4 | **Reasignar a la misma persona que ya lleva el ticket, ¿se rechaza?** | Da `422` «El ticket ya está a cargo de esa persona» (`packages/shared/src/reasignacion.ts:45`, devuelto por `apps/desk/server/routes/reasignacion.ts:32`), y el desplegable no la ofrece | Se permitiría, y quedaría una fila de traza con origen igual al destino y un aviso a quien ya lo llevaba: hay que quitar esa comparación del validador y decidir si ese caso avisa |
| S-5 | **Reasignarse el ticket a uno mismo, ¿se permite y no avisa?** | Se permite: la ruta no compara el destino con quien reasigna (`apps/desk/server/routes/reasignacion.ts:31`) y deja la traza; el aviso se suprime porque quien actúa ya lo sabe (`apps/desk/server/services/avisoReasignacion.ts:17`) | Si debe prohibirse, hace falta una guarda nueva en la ruta que conozca al actor (el validador de `shared` hoy no lo recibe); si debe avisar, se quita la línea 17 de ese fichero |
| S-6 | **El destino, ¿puede ser de cualquier área?** | Sí: sólo se exige que exista y esté activo (`apps/desk/server/routes/reasignacion.ts:35`), igual que la derivación al crear el ticket. El maestro habla de «técnicos de la misma área» | Hay que exigir el área del estado al destino en la ruta (otro `422` tras la línea 35) y filtrar el desplegable del panel con la misma regla, comprobando primero cuántas personas tienen áreas asignadas |
| S-8 | **Eliminar un ticket, ¿borra también sus reasignaciones?** | Sí: la lista de tablas hijas incluye `reasignaciones` (`apps/desk/server/db/eliminarTicket.ts:54`), así que la persona de origen o de destino vuelve a poder darse de baja | Si se conservaran, esas filas seguirían contando como uso del usuario (`apps/desk/server/auth/users.ts:139`) y esa persona **no se podría borrar nunca**: habría que decidir cómo se liberan |

### 9.2 · Límites declarados

- **La suite no ejercita el bloqueo de fila de PostgreSQL.** La carrera entre dos reasignaciones simultáneas se resuelve con un `UPDATE`
  condicionado a la persona a cargo leída (`apps/desk/server/db/reasignaciones.ts:34`): quien pierde recibe `409`, sin traza ni aviso. La
  prueba del `409` es determinista, con una conexión que escribe otro valor justo antes del `UPDATE`
  (`apps/desk/server/routes/reasignacion.test.ts:232`); lo que hace PostgreSQL con dos transacciones reales a la vez no lo cubre la suite
  (pg-mem no simula concurrencia). Hipótesis: bajo el aislamiento por defecto de PostgreSQL la segunda reevalúa la condición tras el
  bloqueo y no acierta fila; no medida aquí.
- **Si falla el alta del aviso tras escribir, la respuesta es `500` con la reasignación ya hecha.** El aviso se escribe después de la
  transacción (`apps/desk/server/routes/reasignacion.ts:41`); si su `INSERT` falla, la reasignación y su traza quedan, y quien reasignó ve un
  error. El correo, en cambio, nunca tumba la respuesta: si no sale, el aviso queda sin sellar (`enviado_at` en `NULL`). Lo fija
  `apps/desk/server/routes/reasignacion.test.ts:302`.

### 9.3 · Tareas de persona — fuera del recuento de la tanda

Sin casillas: son decisiones o comprobaciones de personas, no trabajo que una tanda pueda hacer en este repositorio. **Archivar el cambio no
las da por hechas.** **No tienen entrada en `docs/sdd/ENTRADA.md`**: la entrada la abre Supervisión.

| # | Quién | Qué | Qué desbloquea |
|---|---|---|---|
| P-1 | Analista | Tras el despliegue, verificar en la aplicación el panel, el aviso y la línea del historial | Da por comprobado lo que los `.tsx` no cubren (están fuera de la red de pruebas, F0-00) |
| P-2 | Gerencia | Confirmar o corregir S-2, S-4, S-5 y S-6 (y S-8, §9.1) | Deja firme quién reasigna y a quién |
| P-3 | Gerencia | Pegar en el maestro la corrección 30 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`) | El maestro deja de decir que sólo reasignan la persona a cargo y la dirección del área |
| P-4 | Mantenedor | Desplegar y comprobar que existe `public.reasignaciones` en producción (`DEPLOY.md`) | Que reasignar y el historial no fallen por tabla ausente |

## 10 · Traspaso de `reasignacion-con-motivo` — una confirmación para Gerencia y un límite

`reasignacion-con-motivo` está fusionado a `main` en `1bf414a` y F1B-05 queda cerrada por archivo (`docs/sdd/RECONCILIACION.md`). Lo que
sigue no es tarea de ninguna sesión de construcción. **No tiene entrada en `docs/sdd/ENTRADA.md`**: el fichero tenía cambios de Supervisión
sin commitear cuando se escribió esto, así que la entrada la abre Supervisión.

### 10.1 · Para Gerencia — confirmar quién puede reasignar

| Qué confirmar | Qué hace hoy la aplicación | Qué dice el maestro | Qué cambia si la respuesta es «no» |
|---|---|---|---|
| **Que reasigna un administrador o quien tenga el área de alguna transición que sale del estado actual del ticket** | Es lo construido: el predicado está en `packages/shared/src/reasignacion.ts:24-27` y lo impone el servidor con un `403` (`apps/desk/server/routes/reasignacion.ts:29`). No hace falta ser la persona a cargo y el cargo no cuenta | «La persona a cargo y el Director o el Coordinador del área». La diferencia se entrega como corrección 30 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1493`) | Hay que cambiar el predicado de `shared` para que conozca a la persona a cargo y el cargo de quien reasigna, con su barrido de pruebas y la prueba de la ruta; el panel sigue al predicado, así que no decide nada por su cuenta |

Va junto con los cinco supuestos de §9.1, que siguen pendientes de la misma confirmación (tarea P-2 de §9.3).

### 10.2 · Límite — si falla el alta del aviso tras escribir, la respuesta es `500` con la reasignación hecha

El aviso a la persona de destino se escribe después de la transacción y fuera de ella (`apps/desk/server/routes/reasignacion.ts:41`). Si su
`INSERT` falla, la persona a cargo ya cambió y la traza ya está escrita, pero quien reasignó ve un error y la persona de destino no recibe
aviso. Reintentar desde el panel da `422` «El ticket ya está a cargo de esa persona» (`packages/shared/src/reasignacion.ts:45`), que es la
señal de que la primera vez sí se aplicó. Lo fija `apps/desk/server/routes/reasignacion.test.ts:302`. No se corrige en esta tanda.
