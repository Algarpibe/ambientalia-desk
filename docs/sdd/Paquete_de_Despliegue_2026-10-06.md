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

## 11 · Añadido por `accesorios-lista-por-modelo` (F1B-04, `cierra: no`) — sin interruptor, ocho supuestos para Gerencia, cinco límites y seis tareas de persona

**Qué entra.** Los accesorios de la remisión de entrada salen de la lista del modelo con nombre oficial y SKU, y no se puede escribir uno a
mano en ninguna de las tres vías. Concretamente:

- **Nombre y SKU en el formulario.** `GET /api/remisiones/nueva` sirve además de `incluye` (que no cambia) el detalle de cada ítem
  (`apps/desk/server/routes/remision.ts:68`, campo `incluyeDetalle`), y el formulario pinta el SKU en gris junto al nombre cuando lo hay
  (`apps/desk/src/components/CrearRemision.tsx:261`, `apps/desk/src/components/CrearRemision.tsx:264`). Lo que se envía y lo que viaja a n8n
  siguen siendo los nombres.
- **Cierre del texto libre en el catálogo.** Un artículo de clase accesorio exige artículo de Books: el alta a mano responde `422`
  (`apps/desk/server/routes/catalogo.ts:220`), el cambio de clase por `PATCH` de un artículo sin artículo de Books a accesorio también
  (`apps/desk/server/routes/catalogo.ts:294`), y la copia a otros modelos omite los accesorios sin artículo de Books y los cuenta
  (`apps/desk/server/db/catalogoArticulos.ts:166`, devueltos en `apps/desk/server/db/catalogoArticulos.ts:190`).
- **Lo que llega fuera de lista es una novedad.** Fila nueva sembrada, `accesorio_fuera_de_lista`, que exige texto
  (`packages/zoho-sync/src/db/schema.sql:768`). La lista de novedades pasa de diez a once.
- **Ruta y pantalla del Director Técnico.** `POST /api/catalogo/modelos/:id/accesorios`
  (`apps/desk/server/routes/accesoriosModelo.ts:22`), con el permiso `puedeAnadirAccesorios`
  (`packages/shared/src/accesoriosLista.ts:46`) y la clase, el nombre y el SKU tomados de Books. La pantalla «Accesorios por modelo» está en
  Configuración (`apps/desk/src/components/Configuracion.tsx:127` y `apps/desk/src/components/Configuracion.tsx:165`;
  `apps/desk/src/components/AccesoriosModeloPanel.tsx`).
- **Consulta de modelos sin accesorios**, de sólo lectura y para una persona: `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`.
  La comprobación de lectura tras desplegar está en `DEPLOY.md`, apartado «Comprobación de lectura tras desplegar F1B-04 (accesorios por
  modelo)». **No hay variable de entorno ni interruptor** y no hay tabla nueva.

**Qué NO se construye.** (1) **La foto por accesorio:** los documentos cuelgan del modelo y no del artículo, y la sincronización de
artículos no trae imagen; no hay dónde guardarla. (2) **La confirmación del «número de parte»:** la aplicación enseña el SKU de Books y
nada más (S-1). Tampoco se toca el orden de guardas del alta de remisión (IV-12 no se amplía ni se corrige).

**Qué queda de la fila F1B-04 tras esta tanda.** No se cierra (`cierra: no`). Quedan: la mitad de salida de E-123 (fotos obligatorias en la
remisión de salida), la foto por accesorio, la confirmación del número de parte y las preguntas abiertas E-163 a E-167. **No tienen entrada
nueva en `docs/sdd/ENTRADA.md`**: el fichero tenía cambios de Supervisión sin commitear cuando se escribió esto, así que la entrada la abre
Supervisión.

### 11.1 · Para Gerencia — ocho supuestos reversibles, a confirmar o corregir

| # | Qué confirmar | Qué hace hoy la aplicación | Qué cambia si la respuesta es «no» |
|---|---|---|---|
| S-1 | **¿El SKU de Books es el «número de parte»?** | Se enseña el SKU tal cual, o sólo el nombre si el artículo no lo tiene (`apps/desk/src/components/CrearRemision.tsx:264`). El maestro los usa casi como equivalentes (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1236`, «nombre y SKU»), pero la decisión lo deja como hipótesis | Hay que decir de qué campo de Books sale el número de parte; cambiaría el origen del dato que arma el detalle (`packages/shared/src/accesoriosLista.ts`) y quizá hace falta traerlo en la réplica de artículos |
| S-2 | **¿El permiso del Director Técnico es `puedeMantenerNovedades` (área Servicio Técnico y cargo Director Técnico; el administrador pasa)?** | La ruta responde `403` a cualquiera que no cumpla ese predicado (`apps/desk/server/routes/accesoriosModelo.ts:25`) y la pantalla no se le enseña | Habría que definir el permiso propio y cambiar `puedeAnadirAccesorios` y su matriz de pruebas |
| S-3 | **¿El Director Técnico sólo añade?** | Sí: la ruta nueva sólo tiene alta. Retirar, reactivar, reordenar, copiar y borrar siguen siendo del administrador (`apps/desk/server/routes/catalogo.ts:288`, el `PATCH`, exige superadministrador) | Habría que abrir esas operaciones al Director Técnico con su propio permiso y su traza; ver también el límite 11.2 (a) |
| S-4 | **Un accesorio real que no es artículo de Books («Manuales», «Pletinas»), ¿ya no se puede añadir?** | Es la lectura literal de «nada de texto libre»: el alta a mano responde `422` (`apps/desk/server/routes/catalogo.ts:220`) y la ruta del Director Técnico sólo acepta artículos de Books (`apps/desk/server/routes/accesoriosModelo.ts:29`). Los que ya existen se conservan | Hay que decidir si esos accesorios se dan de alta en Books o si se admite una excepción, y quitar o acotar la guarda del alta |
| S-5 | **La novedad «Accesorio fuera de lista», ¿exige texto y, como toda novedad marcada, también su foto?** | Exige texto (`packages/shared/src/recepcion.ts:97-99`) y la foto de cada novedad marcada falta mientras no se suba (`packages/shared/src/recepcion.ts:140-142`). Va con orden 65, tras «Falta un accesorio» | Si no debe exigir texto, se cambia la marca de la fila sembrada; si no debe pedir foto, hay que tocar la regla de fotos por novedad, que es de todas las novedades |
| S-7 | **«Modelos sin categoría de accesorios», ¿se lee como «sin ningún accesorio activo»?** | Sí: la consulta cuenta los manuales activos y los derivados no ocultos (`docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`), porque la asignación por categoría está cerrada para accesorios | Habría que rehacer la consulta sobre `catalogo_modelo_categorias` solamente |
| S-9 | **La copia de accesorios a otros modelos, ¿omite los que no tienen artículo de Books?** | Sí, y avisa cuántos no copió (`apps/desk/server/db/catalogoArticulos.ts:166`, `apps/desk/server/db/catalogoArticulos.ts:190`). No estaba en el encargo: es la tercera vía por la que nacía un accesorio de texto libre | Se retira el filtro de la copia y queda declarada abierta esa vía |
| S-10 | **Si se marcan a la vez «Otro» y «Accesorio fuera de lista», ¿basta un solo texto?** | Sí: el texto es uno por remisión y los dos lo comparten (`packages/shared/src/recepcion.ts:97-99`) | Hay que cambiar `validarRecepcion` y la forma del cuerpo para llevar un texto por novedad |

S-6 (legado y perfil intactos, sin migración ni relleno) y S-8 (el SKU no se guarda en la remisión, es dato de presentación) son de
implementación y no piden respuesta de Gerencia.

### 11.2 · Límites declarados

(a) **El Director Técnico recibe `409` ante un accesorio desactivado y no puede reactivarlo.** La comprobación de repetido mira el nombre
dentro de la clase **sin filtrar por activo** (`apps/desk/server/db/catalogoArticulos.ts:71-74`), así que un accesorio que el administrador
desactivó sigue contando como «ya está en la lista». Reactivarlo es del administrador (`apps/desk/server/routes/catalogo.ts:288`).
(b) **La ruta no rechaza un modelo inactivo.** Sólo comprueba que el modelo exista (`apps/desk/server/routes/accesoriosModelo.ts:24`); la
pantalla no ofrece los inactivos, pero la API aceptaría añadir a uno. Es inocuo y no se corrige.
(c) **`PATCH` con un id inexistente responde `200`, como antes.** La guarda de clase lee la fila antes de escribir y, si no existe, deja
pasar la petición hasta la escritura (`apps/desk/server/routes/catalogo.ts:298`, `apps/desk/server/routes/catalogo.ts:299`); no se introdujo
un `404` porque el encargo prohibía cambiar el comportamiento de los demás casos.
(d) **El buscador de artículos descarta los de Books sin SKU, así que el Director Técnico no puede añadirlos desde la pantalla.** La
pantalla «Accesorios por modelo» sólo ofrece lo que devuelve `GET /api/articulos` (`apps/desk/server/routes/directory.ts:33`), y su consulta
exige SKU no vacío (`packages/zoho-sync/src/books/repo.ts:30`). El servidor sí acepta un artículo sin SKU y lo guarda con `sku` nulo (prueba
«un artículo de Books sin SKU entra con sku null» de `apps/desk/server/accesoriosModelo.test.ts`), y la lista del modelo prevé accesorios sin SKU
(RQ-RE-32), pero ese caso sólo llega por categoría y no por la pantalla. Es una comodidad más estrecha que la regla, no una guarda que falte. **No
se corrige en esta tanda**; queda a decisión de Gerencia si el buscador debe ofrecer también esos artículos.
(e) **Citas archivadas a `packages/zoho-sync/src/db/migrate.test.ts` cuyo contenido cambió en sitio (caso B de la regla de mutación 4).** Esta
tanda editó en el mismo sitio, sin mover líneas, la línea 652 de ese fichero (el recuento de sentencias de `schema.sql`, que ahora suma la siembra de
`accesorio_fuera_de_lista`) y las líneas 794 a 798 (la posición de la última sentencia, que pasa de ser el índice de `public.reasignaciones` a ser
esa siembra). Hay siete citas archivadas a la línea 652 en `openspec/changes/archive/` (una de ellas es el rango 648 a 652): afirman el recuento
y la posición de su fecha, falsos hoy y ciertos entonces. **No se renumeran ni se editan**: son históricas. Además, el segundo pase de abreviadas
no se hizo en los lotes de esta tanda; el detector sale en 0. De las 14 abreviadas rotas informativas, 13 son anteriores y ninguna cae en un fichero que esta rama toque; la decimocuarta es nueva y está en el `verify-report.md` de este cambio: nombra la primera línea añadida a `DEPLOY.md`, que es una línea en blanco.

### 11.3 · Tareas de persona — fuera del recuento de la tanda

Sin casillas: son decisiones o comprobaciones de personas, no trabajo que una tanda pueda hacer en este repositorio. **Archivar el cambio no
las da por hechas.** **No tienen entrada en `docs/sdd/ENTRADA.md`**: la entrada la abre Supervisión.

| # | Quién | Qué | Qué desbloquea |
|---|---|---|---|
| P-1 | Quien tenga acceso a la base de producción | Ejecutar `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql` **antes del corte** y llevar el resultado al Director Técnico | Saber cuántos modelos quedan sin lista y cuáles |
| P-2 | Director Técnico | Completar la lista de los modelos que salgan vacíos de P-1, en Configuración, «Accesorios por modelo» | Que el técnico tenga casillas que marcar en la remisión de esos modelos |
| P-3 | Gerencia | Confirmar o corregir S-1, S-3, S-4, S-9 y S-10 (y S-2, S-5 y S-7, §11.1) | Deja firme de dónde sale el número de parte, quién añade y qué pasa con los accesorios que no son de Books |
| P-4 | Gerencia | Pegar en el maestro la corrección 31 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`) | El maestro deja de decir que el accesorio se escribe y que sólo hay diez novedades |
| P-5 | Quien verifica la aplicación | Tras desplegar: el formulario enseña nombre y SKU; la pantalla «Accesorios por modelo» sólo la ve quien puede; «Añadir a mano» ya no ofrece accesorio; «Accesorio fuera de lista» aparece como novedad y pide texto y foto | Da por comprobado lo que los `.tsx` no cubren (están fuera de la red de pruebas, F0-00) |
| P-6 | Mantenedor | Desplegar y comprobar que la novedad `accesorio_fuera_de_lista` existe en producción tras el arranque (`DEPLOY.md`) | Que el técnico tenga la salida para el accesorio fuera de lista |

## 12 · Traspaso de `accesorios-lista-por-modelo` — dos avisos para Gerencia y una hipótesis que sigue abierta

`accesorios-lista-por-modelo` está fusionado a `main` en `5ce4252`. **F1B-04 no queda cerrada** (`cierra: no`): sigue en curso en
`docs/sdd/RECONCILIACION.md`, y lo que queda de la fila está en el apartado 11. Lo que sigue no es tarea de ninguna sesión de construcción.
**No tiene entrada en `docs/sdd/ENTRADA.md`**: el fichero tenía cambios de Supervisión sin commitear cuando se escribió esto, así que la
entrada la abre Supervisión.

### 12.1 · Para Gerencia — dos cosas que cambian en el uso

| Qué cambia | Qué hace hoy la aplicación | Qué cambia si Gerencia no lo quiere así |
|---|---|---|
| **Un accesorio que no sea artículo de Books («Manuales», «Pletinas») ya no se puede añadir** | El alta a mano de un accesorio sin artículo de Books responde `422` (`apps/desk/server/routes/catalogo.ts:220`) y la ruta del Director Técnico sólo acepta artículos que existan en Books (`apps/desk/server/routes/accesoriosModelo.ts:29`). Los accesorios de texto libre que ya existían se conservan. Es el supuesto S-4 de §11.1 | Hay que decidir si esos accesorios se dan de alta en Books o si se admite una excepción, y quitar o acotar la guarda del alta |
| **El buscador descarta los artículos de Books sin SKU** | La pantalla «Accesorios por modelo» sólo ofrece lo que devuelve el buscador de artículos, y su consulta exige SKU no vacío (`packages/zoho-sync/src/books/repo.ts:30`). El servidor sí aceptaría un artículo sin SKU; lo que no hay es forma de elegirlo desde la pantalla. Es el límite (d) de §11.2 | Hay que abrir el buscador a los artículos sin SKU, que es un cambio de la consulta compartida con los demás buscadores de artículos |

### 12.2 · Hipótesis que sigue abierta — que el SKU sea el «número de parte»

La aplicación enseña el SKU de Books junto al nombre del accesorio y nada más. **Que ese SKU sea el «número de parte» sigue siendo
hipótesis**: ninguna fuente lo confirma y esta tanda no lo decide. Es el supuesto S-1 de §11.1 y la tarea P-3 de §11.3; hasta que Gerencia
responda, ningún documento del repositorio debe darlo por cierto.

## 13 · Añadido por `ampliacion-contrato` (F1B-11, `cierra: si`) — tabla nueva, sin interruptor, supuestos para Gerencia y cuatro tareas de persona nuevas

**Qué entra.** Un contrato se puede ampliar hasta el 31/12 del año de su vencimiento, lo registra Comercial y queda con traza
(`decision/e086-ampliacion-contrato`, Gerencia, 2026-10-06). **No hay variable de entorno ni interruptor**: está activo desde que se publica. La
comprobación de lectura tras desplegar está en `DEPLOY.md`, apartado «Comprobación de lectura tras desplegar F1B-11 (ampliación de contrato)».

- **La regla, en `shared`.** El tope es el 31/12 del año del vencimiento y el año son los cuatro primeros caracteres de la fecha, sin pasarla por `Date`
  (`packages/shared/src/contratos.ts:259`). El rechazo sale de `motivoNoAmpliable`, con orden fijo: fecha, posterior a la vigente, tope y plazo cerrado
  (`packages/shared/src/contratos.ts:264`); el motivo vacío lo añade `ampliacionDelCuerpo` (`packages/shared/src/contratos.ts:283`); y `cabeAmpliacion` es la
  comodidad del cliente (`packages/shared/src/contratos.ts:275`).
- **La ruta y su escalera.** `POST /api/contratos/:id/ampliar` (`apps/desk/server/routes/contratos.ts:74`): contrato inexistente `404`
  (`apps/desk/server/routes/contratos.ts:78`), sin el área Comercial `403` (`apps/desk/server/routes/contratos.ts:79`), contenido `422`
  (`apps/desk/server/routes/contratos.ts:81`) y carrera `409` (`apps/desk/server/routes/contratos.ts:87`). Quien amplía es el de la sesión (`apps/desk/server/routes/contratos.ts:83`), nunca el del cuerpo.
- **La traza.** Una tabla nueva, `public.contrato_ampliaciones` (`packages/zoho-sync/src/db/schema.sql:773`), que `migrate` crea al arrancar y que nace vacía. El
  `UPDATE` de la fecha va condicionado a la fecha que leyó la ruta (`apps/desk/server/db/contratos.ts:133`) y la fila de traza se escribe en la misma
  transacción (`apps/desk/server/db/contratos.ts:138`). Comprobación declarada: `git grep` sobre el repositorio no encuentra ninguna sentencia que borre o modifique filas de esa tabla.
- **La lectura ampliada.** `GET /api/contratos/:id` sirve además `ampliaciones` y `fechaFinOriginal` (`apps/desk/server/routes/contratos.ts:33`); sin
  ampliaciones, la original es la vigente.
- **La ficha.** Enseña «Vencimiento original» cuando difiere (`apps/desk/src/components/ContratoFicha.tsx:61`), el botón «Ampliar» a Comercial y
  administradores si queda sitio (`apps/desk/src/components/ContratoFicha.tsx:65`) y la lista de ampliaciones (`apps/desk/src/components/ContratoFicha.tsx:71`).
  El formulario no valida nada y enseña el error del servidor tal cual (`apps/desk/src/components/ContratoFicha.tsx:130`).
- **Las tres puertas no cambian.** Las guardas de contrato vencido del alta, de la transición y de la remisión leen la fecha de fin vigente: una ampliación
  las desbloquea hasta la fecha nueva y vuelven a bloquear al pasarla. Lo fija `apps/desk/server/ampliacionContratoPuertas.test.ts`.

**Qué NO se construye.** (1) **Editar o borrar un contrato** (E-088): la ampliación no corrige un lote o un cliente equivocados. (2) **Acortar o corregir una
fecha de fin** (S-3). (3) **Avisar al ampliar** (S-5). (4) **Tocar la fila F1B-11 del plan** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:91`): se
marca cerrada después del archivo.

**Qué queda de la fila F1B-11 tras esta tanda.** **Se cierra al archivarse** (`cierra: si`): la ampliación era lo único que le faltaba
(`decision/e086-ampliacion-contrato`, consecuencia 5), y es el remanente que el plan declara en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:216`.
IV-11 sigue reducido, no cerrado, y IV-12 queda intacto: `ticketService.ts` y `remision.ts` no tienen diff.

### 13.1 · Para Gerencia — supuestos reversibles, a confirmar o corregir

| # | Qué confirmar | Qué hace hoy la aplicación | Qué cambia si la respuesta es «no» |
|---|---|---|---|
| S-1 | **¿El motivo de la ampliación es obligatorio?** (pregunta 1) **La fuente no lo exige**: ni E-086 ni la decisión lo nombran; se pide por coherencia con liberar y reasignar | Un motivo vacío tras recortar da `422` «El motivo es obligatorio» (`packages/shared/src/contratos.ts:288`) | Se quita esa guarda; la columna ya es anulable y no hay `CHECK`, así que no hace falta migración |
| S-2 | **¿Se puede ampliar el mismo contrato más de una vez?** (pregunta 2) | Sí, mientras cada fecha nueva sea posterior a la vigente (`packages/shared/src/contratos.ts:267`) y no pase del tope | Una guarda más en el escalón C, «ya ampliado», que lea la traza |
| S-3 | **¿Una ampliación sólo alarga?** | Sí: una fecha igual o anterior a la vigente da `422` (`packages/shared/src/contratos.ts:267`) | Acortar o corregir es otra operación, con su propia regla y su propia traza |
| S-4 | **Tras ampliar, ¿debe volver a evaluarse el aviso de ritmo del trimestre ya avisado?** (pregunta 3) | No: la marca sólo sube (`apps/desk/server/services/avisoRitmoContrato.ts:28`) y el último trimestre acaba en la fecha de fin (`packages/shared/src/contratos.ts:94`), así que **una ampliación corta alarga el trimestre ya avisado** y en ese tramo no habrá aviso nuevo | La ampliación pone la marca a nulo en la misma transacción; hay que decidir si se avisa de nuevo aunque el trimestre ya se avisara |
| S-5 | **¿Ampliar genera un aviso a Comercial?** | No genera ninguno | Un aviso a Comercial escrito en la misma transacción de la ampliación |
| S-6 | **¿La traza la puede leer cualquier usuario con sesión?** | Sí, como el resto de la ficha (`apps/desk/server/routes/contratos.ts:28`) | Se filtran los campos de la traza por área en la lectura |
| S-7 | **¿Un contrato que aún no ha empezado también se puede ampliar?** | Sí: la regla no mira la fecha de inicio (`packages/shared/src/contratos.ts:264`) | Una guarda más en el escalón C |
| S-10 | **¿El 31/12 entero se puede ampliar?** | Sí: el plazo se cierra por el día, no por la hora, y `hoy` igual al tope todavía amplía (`packages/shared/src/contratos.ts:270`) | Cambiar la comparación y decidir desde qué hora cierra el plazo |

### 13.2 · Límites declarados

- **La atomicidad no se prueba de verdad.** Sin pool no se abre transacción (`apps/desk/server/db/transaccion.ts:15`), y las pruebas corren sin pool; la
  estructura (el `UPDATE` y el `INSERT` dentro de `enTransaccion`) está fijada por mutaciones, pero que PostgreSQL revierta de verdad si falla el `INSERT`
  es hipótesis hasta que la tarea P.8 lo compruebe en producción.
- **Por la API, con el plazo cerrado y una fecha inválida, se lee primero el error de la fecha.** El orden de `motivoNoAmpliable` pone la fecha antes que
  el plazo (`packages/shared/src/contratos.ts:266`); quien manda una fecha mala a un contrato fuera de plazo oye la corrección de la fecha y no que el
  plazo terminó. Es el orden de la escalera, no un descuido.
- **La ficha no se refresca sola si otro usuario amplía.** La carga una vez (`apps/desk/src/components/ContratoFicha.tsx:23`); quien tenga la ficha
  abierta ve la fecha vieja y, si amplía, recibe el `409` de la carrera (`apps/desk/server/routes/contratos.ts:87`), tras el cual la ficha se recarga.
- **S-4 es un límite, no sólo una pregunta:** una ampliación corta no vuelve a avisar del ritmo en el trimestre ya avisado.
- **E-088 sigue fuera de alcance:** un contrato mal dado de alta se sigue sin poder corregir. **IV-11 sigue reducido** y **IV-12 queda intacto.**

### 13.3 · Tareas de persona — fuera del recuento de la tanda

Sin casillas: son decisiones o comprobaciones de personas, no trabajo que una tanda pueda hacer en este repositorio. **Archivar el cambio no las da por
hechas.** P.1, P.4, P.6 y P.7 se heredan de `registro-contrato` (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:110-120`).

| # | Quién | Qué | Qué desbloquea |
|---|---|---|---|
| P.1 | Alfonso | Consulta de formato de subOV en producción (heredada) | Que Comercial y Supervisión sepan si el formato de lote asumido es el real |
| P.4 | Alfonso | Literales de borrador y anulada en Books (heredada) | Que la cuenta de subOV excluya los estados correctos |
| P.6 | Comercial | Tras el despliegue, verificar en la aplicación prioridad, bloqueo, informe, CSV y pasada de ritmo (heredada) | Da por comprobado lo que los `.tsx` no cubren (F0-00) |
| P.7 | Comercial | Dar de alta los contratos vigentes en la pantalla de contratos (heredada) | Que haya contratos que ampliar |
| P.8 | Comercial | Tras el despliegue, ampliar un contrato real y comprobar la traza, el desbloqueo y el rechazo fuera del tope; comprobar además la atomicidad real, que ninguna prueba cubre | Da por comprobada la atomicidad y la pantalla, que está fuera de la red de pruebas |
| P.9 | Gerencia | Pegar en el maestro la corrección 32 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`) | El maestro deja de decir que la ampliación está abierta y que la fila F1B-11 no se cierra |
| P.10 | Supervisión | Actualizar E-086 y abrir las entradas nuevas con la redacción de abajo, en `docs/sdd/ENTRADA.md`, que esta rama no toca | Que la bandeja refleje la decisión y los hallazgos de la tanda |
| P.11 | Gerencia | Responder las tres preguntas: motivo obligatorio (S-1), ampliar más de una vez (S-2) y reevaluar el aviso de ritmo del trimestre ya avisado (S-4); y confirmar S-3, S-5, S-6, S-7 y S-10 | Deja firme la regla de la ampliación |

**Redacción propuesta para `docs/sdd/ENTRADA.md`** (la abre Supervisión; esta rama no toca ese fichero).

- **Cambio de estado de E-086:** de **NUEVA** a **DECIDIDA** el 2026-10-06, con la respuesta textual «Año natural del vencimiento. Ampliación hasta el 31/12
  de ese año, porque el 1/1 cambia la lista de precios. La registra Comercial, con traza.» (`decision/e086-ampliacion-contrato`). Construida en
  `ampliacion-contrato`; desbloquea el cierre de la fila F1B-11.
- **Entrada nueva (pregunta):** «¿El motivo de la ampliación es obligatorio, se puede ampliar más de una vez y debe reevaluarse el aviso de ritmo del
  trimestre ya avisado?» Origen: S-1, S-2 y S-4 de `ampliacion-contrato`. Dueño propuesto: Gerencia. Qué desbloquea: dejar firme la regla de la ampliación.
- **Entrada nueva (hallazgo):** «Una ampliación corta alarga el trimestre ya avisado y no genera aviso nuevo de ritmo en ese tramo.» Origen: S-4. Afecta a:
  el aviso de ritmo del contrato. Destino: **sin destino asignado**, a propósito; que lo asigne quien decida el alcance.

## 14 · Añadido por `indicadores-51-55` (F1F-05, `cierra: no`) — tabla nueva, sin interruptor, tres preguntas, tres hallazgos y tres tareas de persona

**Qué entra.** (1) **El 51 «Tiempo de recogida del equipo»** sale del historial: días naturales entre la finalización y el día de la transición de entrega
(`entrega_al_cliente` o `entrega_sin_factura`; si hay varias, la última) — `packages/shared/src/indicadores.ts:254` y `:257`. (2) **Una tabla nueva,
`public.encuesta_respuestas`** (`packages/zoho-sync/src/db/schema.sql:787`). (3) **`POST /api/indicadores/encuesta`**
(`apps/desk/server/routes/encuestaRespuestas.ts:19`), sólo para administradores. (4) **Una cuarta consulta en `GET /api/indicadores`**
(`apps/desk/server/indicadores.ts:85`) que alimenta el 55 con la última respuesta de cada ticket.

**Qué NO entra.** La comparación con la exportación de Zoho (el cargador de esa exportación y su formato), la pantalla de carga (la spec la prohíbe, RQ-KP-18) y
el canal de la encuesta (S-G). `cierra: no`: la fila F1F-05 del plan no se marca.

**Despliegue.** La migración crea una tabla nueva y vacía; **no hay interruptor ni variable** y `.env.example` no cambia. La comprobación de lectura y la forma de invocar la
carga (multipart, campo `file`, sesión de administrador, respuesta `{ leidas, insertadas, duplicadas, rechazadas }`) están en `DEPLOY.md`, apartado «Comprobación de lectura
tras desplegar F1F-05». Fecha límite para medir las cuatro semanas: antes del viernes 13/11/2026 (`DEPLOY.md`, sección 9).

**Redacción propuesta para `docs/sdd/ENTRADA.md`** (la abre Supervisión; esta rama no toca ese fichero y las entradas van **sin número**: en `main` la última es la E-235).

- **Entrada nueva (pregunta, S-D):** «¿El formulario de la encuesta recoge el número de ticket, u otro dato con el que asociar cada respuesta a su servicio?» Dueño
  propuesto: Comercial. Qué desbloquea: que el analizador deje de ser un supuesto (hoy lee el número de ticket).
- **Entrada nueva (pregunta, S-E):** «¿La exportación es el CSV de Google Forms tal cual, con qué columnas, y la fecha viene `DD/MM/AAAA` con el día primero?» Dueño: Comercial,
  que es quien la envía. Tarea de persona P-1: entregar una muestra real. Qué desbloquea: confirmar o sustituir sólo el analizador (`apps/desk/server/encuesta/analizarRespuestas.ts`).
- **Entrada nueva (pregunta, S-G):** «¿Se acepta cargar las respuestas sin columna `canal` hasta la integración de la tableta?» Es un recorte frente a la letra del maestro:
  «Cada calificación guarda su canal (correo o tableta)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2969`), cuya versión integrada va después del
  corte (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2970`). Dueño: Gerencia. Si la respuesta es «no», hace falta un `ALTER TABLE` calificado, con tanda propia.
- **Entrada nueva (hallazgo):** «`instanteDeJornada` (`packages/shared/src/calendarioLaboral.ts:155`) devuelve un instante 24 horas antes del debido para las horas 0 a 4.»
  **Medido en esta tanda**, con un script temporal ejecutado con `node_modules/.bin/tsx` que importa la función y la llama con el día `2027-01-12` (borrado después): hora 0 →
  `2027-01-11T05:00:00.000Z` (debería ser `2027-01-12T05:00:00.000Z`), hora 2 → `2027-01-11T07:00:00.000Z`, hora 4 → `2027-01-11T09:00:00.000Z`, y hora 8 →
  `2027-01-12T13:00:00.000Z` (correcta). Causa probable (hipótesis, a partir de la lectura de `packages/shared/src/calendarioLaboral.ts:155-166`): la hora deseada se formatea en Bogotá, cae el día anterior y la
  diferencia no contempla el cambio de día. Hoy nadie lo sufre porque sus llamadores usan las 08:00 y las 17:00; la tanda no la corrige y el analizador la usa sólo a mediodía. Destino: **sin destino asignado**, a propósito.
- **Entrada nueva (hallazgo):** «El 51 calculado entra ahora en la comparación con el valor de Zoho del `GET`, donde antes no había par.» Es consecuencia de calcularlo.
- **Entrada nueva (hallazgo):** «`supertest` corta la conexión cuando el servidor responde 401 o 403 sin leer un cuerpo de más de 10 MB; la prueba del límite de subida usa `node:http`.»
  Afecta a: las pruebas de la ruta de carga. Sin destino: es una nota para quien escriba pruebas de subida.
- **Nota para Supervisión (`openspec/config.yaml`, que esta rama no toca):** las líneas 4096, 4102, 4105 y 4107 citan `packages/shared/src/indicadores.ts:88-89` y `:58`,
  `apps/desk/server/routes/indicadores.ts:52` y `openspec/specs/kpis/spec.md:257` en `42a4828` para describir el estado ANTERIOR a esta tanda («hoy el 51 sale sin dato», «no hay tabla ni cargador»).
  Son **caso B**: les corresponde nombrar la revisión `42a4828` en la misma línea, no renumerarse. Y la decisión `e171-e172-e173-indicadores-51-55` queda construida en su parte
  del 51 y del 55; la comparación con la exportación de Zoho sigue pendiente.

**Tareas de persona — fuera del recuento. Archivar el cambio no las da por hechas.**

| # | Quién | Qué | Qué desbloquea |
|---|---|---|---|
| P-1 | Comercial | Entregar una muestra real de la exportación del formulario de la encuesta | Confirmar o sustituir el analizador (S-D, S-E) y responder la lectura de `DD/MM/AAAA` |
| P-2 | Un administrador de la aplicación | Cargar las respuestas de enero de 2027, tras desplegar y tras P-1 | Que el 55 tenga datos del periodo posterior al corte |
| P-3 | Quien administra el despliegue | Desplegar antes del 13/11/2026 y hacer la comprobación de lectura (la tabla nace vacía y sin relleno) | Producción lista para medir las cuatro semanas |
