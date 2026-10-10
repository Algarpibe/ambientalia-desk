# Paquete de despliegue — 2026-10-10 (b), adenda: comprobaciones posteriores al despliegue

Adenda a los paquetes fechados anteriores, que **no se editan**. Registra lo que se midió en producción el
2026-10-10, después de publicar. **Donde esta adenda y un paquete anterior digan cosas distintas, vale ésta.**

**De dónde sale cada dato.** Ninguna sesión de construcción entra en producción. Todo lo que aquí se dice de
producción es **dato de producción aportado por Alfonso el 2026-10-10**, salvo la medición del bundle, que es del
analista en la misma fecha; esta sesión no ha repetido ninguna de las dos. Lo que se dice del código se leyó en el
árbol de `b24a86a`, con ruta y línea. Lo que no es ni lo uno ni lo otro lleva la palabra **hipótesis**.

---

## 0 · Lo que cambia de un vistazo

| Asunto | Estado el 2026-10-10 |
|---|---|
| Qué código sirve producción | El de `473665b`, que es el mismo de `b24a86a` |
| `public.nit_exentos` | Existe, con su fila sembrada |
| Cargos | Asignados |
| Tickets que la guarda de F1B-03 deja sin habilitar | **Uno**: el nº 996 |
| Interruptores de la App | Ausentes los tres |
| Barrido del worker | **Activo y borrando**, a propósito |
| Copia de seguridad de `desk` | **Nunca había funcionado.** Primera copia válida hoy, en el mismo servidor |
| Avisos por área | **Sólo llegan a administradores**: ningún rol de los leídos recibe avisos |

Los dos fundamentos que las claves del 09/10 daban por ciertos —que la tabla de provisionales y el campo de cargo
nacían con este despliegue— eran **falsos**: producción no estaba en `ae5aaf4`. Ver §9.

## 1 · Qué código sirve producción

Medición del analista, 2026-10-10: producción sirve `assets/index-Tl4V5akM.js`, **408.060 bytes**, sha256
`61e8c639a79bc4098d2c74ecd6fe90b8673a2a45709be940cd0b0c6d9f783cdf`, idéntico byte a byte (`cmp`) al build local de
`b24a86a`. Es el mismo nombre, tamaño y sha256 que el consolidado anota para `473665b`
(`docs/sdd/Paquete_de_Despliegue_2026-10-09.md:28`).

Comprobado en el repositorio por esta sesión: `git diff --shortstat 473665b b24a86a -- apps packages` no devuelve
nada. Entre los dos commits sólo cambia documentación.

**Por la mañana producción servía `index-Bn-rFXLV.js`, el de `7a2b1c8`** (medición del analista). Entre `7a2b1c8` y
`473665b` hay 18 ficheros de código, +860/−37 (`git diff --shortstat 7a2b1c8 473665b -- apps packages`): es la pieza
de los NIT exentos y el aviso de provisional. **Eso, y no todo el rango desde `ae5aaf4`, es lo que entró el 10/10.**

**Límite, el de siempre:** el bundle prueba el cliente. Que el servidor y la migración corran el mismo commit se
deduce de las comprobaciones de §2 a §6, no del bundle.

**Aviso de método.** La descarga del bundle se corta —`curl` sale con el código 28—. Hay que reanudarla con
`curl -C -` hasta tener el tamaño completo **antes** de calcular el sha256: un sha256 de una descarga cortada no
coincide con nada y parece un despliegue distinto.

## 2 · `public.nit_exentos`

Una fila: `222222222222`, `Consumidor final`, activo. Es la condición (j) del consolidado, **cumplida**: existe la
tabla (`packages/zoho-sync/src/db/schema.sql:801`) y su fila sembrada (`packages/zoho-sync/src/db/schema.sql:807`).
El alta con cliente manual no responde `500` por esta causa.

## 3 · Cargos, roles y avisos

### 3.1 · Lo asignado

Siete usuarios activos.

| Persona | Rol | Cargo de permiso | Cargo de texto libre |
|---|---|---|---|
| Gustavo | Sí | Sí | Sí |
| Ángela | Sí | Sí | Sí |
| Johny | Sí | Sí | Sí |
| Miguel | `Técnico` | `Técnico` | «Técnico MAGA» |
| Julián | `Técnico` | `Técnico` | «Técnico NJMG» |
| José Manuel | No consta | `Técnico de campo` | No consta |
| Alfonso | **Sin rol**; es administrador | No consta | No consta |

- La cuenta de **José Manuel se creó hoy**. Su fila no se releyó por consulta: es dato declarado por Alfonso, no
  leído.
- Los roles que existen: `Coordinador Administrativo y Financiero` [Compras], `Coordinador Comercial` [Comercial],
  `Director Técnico` [Servicio Técnico], `Especialista Técnico` [Servicio Técnico] y uno **creado hoy**, `Técnico`
  [Servicio Técnico].

**Lo que este registro no dice, y no se supone:** qué rol y qué valores exactos tienen Gustavo, Ángela y Johny; qué
rol tiene José Manuel; y si Alfonso lleva el cargo de permiso `Director Comercial`. Como administrador, Alfonso pasa
todas las guardas de cargo (`packages/shared/src/cargos.ts:49`, `packages/shared/src/cargos.ts:72`,
`packages/shared/src/cargos.ts:82`), así que no bloquea nada; pero la tabla de Gerencia se lo asigna
(`decision/tabla-de-cargos-y-personas-10-10`).

### 3.2 · Comprobado en pantalla

1. «Solicitud repuestos» propone a **Gustavo** en «Derivado a».
2. Un técnico **no** puede ajustar la prioridad.

Son las dos comprobaciones de `docs/sdd/Paquete_de_Despliegue_2026-10-10.md`, §3.2. La lectura de su §3.1 no consta
como ejecutada entera.

### 3.3 · Hallazgo: el área la da el rol, y el procedimiento no lo decía como paso

El área de una persona sale de su **rol** (`public.roles.areas`), y los roles son **datos**, no código: se crean y
se cambian desde la aplicación. `docs/sdd/Paquete_de_Despliegue_2026-10-10.md` trataba el rol como una nota al
margen —«lo que este procedimiento no toca»— y sólo para dos personas. Era insuficiente: **sin rol con el área
Servicio Técnico, un técnico no puede ejecutar ninguna transición de su área**, y hubo que crear el rol `Técnico`
sobre la marcha (`packages/shared/src/permissions.ts:4-7`). El procedimiento completo tiene tres campos por persona, no dos: **rol, cargo de permiso y cargo de
texto libre**.

### 3.4 · Hallazgo: los avisos por área sólo llegan a administradores

Los cuatro roles anteriores a hoy tienen `recibe_avisos` en falso (leído en producción). El del rol `Técnico`,
creado hoy, no se leyó: nace en falso (`packages/zoho-sync/src/db/schema.sql:143`).

Un aviso que se dirige a un **área** llega a las personas cuyo rol tiene esa área **y** recibe avisos, y a todos los
administradores (`apps/desk/server/db/avisos.ts:81`, `apps/desk/server/db/avisos.ts:89`). Con todos los roles en
falso, **sólo lo reciben los administradores**. Alcanza a:

| Aviso | Área | Dónde |
|---|---|---|
| El de cada transición que pasa el trabajo a otra área | La de destino | `apps/desk/server/services/ticketService.ts:200` |
| Discrepancia de la orden de venta con Zoho | Comercial | `apps/desk/server/services/avisoDiscrepanciaOV.ts:39` |
| Ritmo de consumo de un contrato | Comercial | `apps/desk/server/services/avisoRitmoContrato.ts:32` |
| Cliente provisional que ya está en Books | Comercial | `apps/desk/server/services/avisoProvisionalEnBooks.ts:85` |
| Respaldo de una alarma de plazo sin su cargo | Comercial | `apps/desk/server/services/alarmasSla.ts:76` |
| Respaldo del aviso de 60 días de garantía sin su cargo | Servicio Técnico | `apps/desk/server/services/avisoReclamacionProveedor.ts:29` |

**Lo que no se ve afectado:** los avisos que van a un **cargo** no miran el rol. Las tres alarmas de plazo llegan a
quien tenga «Coordinador Comercial» en el texto libre (`apps/desk/server/db/avisos.ts:104-112`), y el aviso de 60
días de la ficha de garantía a quien tenga `Director Técnico` como cargo de permiso
(`apps/desk/server/db/avisos.ts:121-127`).

El interruptor está en la pantalla de roles, una casilla por rol
(`apps/desk/src/components/RolesAdmin.tsx:45`).

> **Pregunta para Gerencia, que esta adenda no decide:** ¿qué roles deben recibir los avisos de su área? Hasta que
> se responda, todo aviso por área lo ve sólo un administrador.

## 4 · Recuentos de F1B-03

**Habilitables hoy** (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`): **un** ticket sin
remisión de entrada vigente.

| Ticket | Estado | Clasificación | Serial | Orden | Encargado | `managed_by_app` |
|---|---|---|---|---|---|---|
| nº 996 | `OV asignada` | Equipo Para Servicio | 18A21058 | OV-2026-174 | «Pendiente Asignar» | falso |

Ese ticket no pasa «Habilitar Servicio» hasta tener su remisión de entrada
(`apps/desk/server/services/ticketService.ts:273-277`); el botón «Crear remisión» se le ofrece en ese estado
(`packages/shared/src/transitions.ts:163-165`). **No es de «Equipo nuevo».** Pendiente de persona: avisar a Servicio
Técnico.

**Histórico** (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`):

| Medida | Tickets |
|---|---|
| Llegaron a `Ingresado` | 126 |
| Sin remisión al llegar | 72 |
| — nunca tuvieron | 66 |
| — sólo anulada | 0 |
| — creada después | 6 |
| Desde «Ticket creado» | 1 |

72 de 126 es el 57 %: más de la mitad de los tickets llegaba a `Ingresado` sin remisión. Es la medida de cuánto
cambia la guarda el trabajo diario, no un defecto de datos. La hipótesis 15 del consolidado queda **medida**.

## 5 · Variables

| Servicio | Variable | Valor |
|---|---|---|
| App | `MIGRACION_TICKETS_HABILITADA` | No existe |
| App | `RESPALDO_HABILITADO` | No existe |
| App | `RESPALDO_DRIVE_HABILITADO` | No existe |
| App | `DB_SCHEMA` | `desk` |
| Worker | `DB_SCHEMA` | `desk` |
| Worker | `SWEEP_ENABLED` | `true` |
| Worker | `SWEEP_DRY_RUN` | `false` |

- Condición (k) del consolidado, **cumplida**: los tres interruptores están ausentes.
- Hipótesis 4 y 6 del consolidado, **medidas** en lo que toca a `DB_SCHEMA`, al barrido y a los tres interruptores.
  De la hipótesis 6 siguen sin medir `N8N_AVISOS_WEBHOOK_URL`, `AVISOS_COPIA_EMAIL` y `SYNC_INTERVAL_MS`.
- **El barrido está activo y borra.** Con `SWEEP_ENABLED` en `true` se programa
  (`packages/zoho-sync/src/config.ts:118`, `apps/hub-sync/src/hub-sync.ts:68`) y con `SWEEP_DRY_RUN` en `false`
  borra (`packages/zoho-sync/src/config.ts:119`, `packages/zoho-sync/src/sweep/sweep.ts:77`). Lo encendió Alfonso
  **a propósito**, porque lo pidió otra aplicación que consume el hub. Es el caso que la condición (h) del
  consolidado avisaba: desde que el worker corra este código, el barrido alcanza también a los pagos de clientes y a
  sus aplicaciones a facturas (`packages/zoho-sync/src/booksHub/sync.ts:190-192`), y **una reversión de código no
  recupera lo borrado**.
- `DEPLOY.md:203-205` decía que los valores del worker estaban sin verificar: actualizado en sitio con estos tres y
  su fecha.

**No consta** si el worker se redesplegó el 10/10, ni con qué commit corre. De eso depende que el barrido de pagos
esté ya en marcha. Sigue siendo la hipótesis 2 del consolidado.

## 6 · Sincronizador

Observado en directo unos **7 minutos**: ninguna línea «Zoho /tickets/search» ni «Zoho /tickets/<id>» en el log.

**Es ausencia de fallo observada, no prueba del permiso.** Siete minutos son dos ciclos al intervalo por defecto
(`packages/zoho-sync/src/config.ts:88`). Que el token tenga el permiso de búsqueda, y que se llame
`Desk.search.READ`, sigue siendo la hipótesis 21 del consolidado: lo que se puede decir es que en esos ciclos no
cayó a la página reciente (`packages/zoho-sync/src/sync.ts:404-407`).

## 7 · Incidente del 2026-10-07

A las **12:30 UTC del 2026-10-07** la App arrancó con `desk-db` no disponible —primero `ENOTFOUND`, luego
`ECONNREFUSED`—. La migración omitió todas sus sentencias y el servidor no llegó a arrancar; a las **12:30:53**
arrancó bien. **La causa del reinicio de la base es desconocida.**

Lo que el código explica: la migración es tolerante por sentencia y sigue aunque fallen todas
(`packages/zoho-sync/src/db/migrate.ts:29-35`); corre al principio del arranque
(`apps/desk/server/index.ts:27`). Que el proceso cayera después, en la primera consulta que no está envuelta, es
**hipótesis**: no se ha leído el log.

Por qué importa aunque se resolviera sola: es el mismo mecanismo de las condiciones (i) y (j) del consolidado. **Una
migración que no entra no detiene el arranque.** Si la base hubiera vuelto a mitad de la migración, el servidor
habría arrancado con el esquema a medias y sin ningún error a la vista. La comprobación de §4.5 del consolidado
tras cada arranque es lo único que lo detecta.

## 8 · Copia de seguridad

**La copia de EasyPanel de `desk-db` no había funcionado nunca.**

- Estaba configurada para una base llamada `ambientalia_project`, **que no existe**. Los tres intentos de agosto
  fallaron.
- **Corregido el 2026-10-10** al nombre `desk`. Primera copia válida: **2026-10-10T13:11:39Z**, 8,94 MB.
- Está en «Local Disk»: **en el mismo servidor que la base.** Si se pierde el servidor, se pierden las dos.
- La programación diaria (`0 2 * * *`) estaba **deshabilitada**, y con retención ilimitada.

`ambientalia_project` es el nombre del **proyecto** de EasyPanel (`DEPLOY.md:73`). Que alguien pusiera el nombre del
proyecto donde iba el de la base es **hipótesis**, pero es la explicación más corta.

**Sustituye a la hipótesis 12 del consolidado**, que proponía un `pg_dump` a mano sin haberlo verificado. El
procedimiento real es el botón de copia de EasyPanel, con el nombre de base `desk`.

**Dos consecuencias que hay que decir sin rodeos:**

1. **`decision/f1c09-copia-antes-de-desplegar` no se cumplió.** Su respuesta es «No despliegues F1C-09 sin copia
   previa de la base.» La mañana del 10/10 producción ya estaba en `7a2b1c8`, que incluye F1C-09, y hasta las
   13:11:39Z de ese día no existió ninguna copia válida. No se sabe de ningún daño; se registra porque es una
   decisión de Gerencia que no se respetó, y porque nadie lo sabía.
2. **Las tres copias automáticas que trae este código siguen apagadas** (§5): hoy la única copia es la de EasyPanel,
   manual y en el mismo servidor.

**Pendiente de persona:** sacar la copia del servidor, y decidir si se habilita la diaria y con qué retención.

## 9 · Las hipótesis del consolidado, tras medir

| Hipótesis | Resultado |
|---|---|
| 1 · producción sigue en `ae5aaf4` | **FALSA.** La mañana del 10/10 estaba en `7a2b1c8` |
| 4 · `DB_SCHEMA` | Medida: `desk` en los dos servicios |
| 6 · barrido e interruptores | Medida en parte (§5) |
| 12 · copia manual con `pg_dump` | **Sustituida** (§8) |
| 15 · tickets que bloquea la guarda de F1B-03 | Medida: uno (§4) |
| 21 · permiso de búsqueda de Zoho | Sin fallo en 7 minutos; **no probada** (§6) |

**Lo que arrastra la hipótesis 1.** El esquema de `7a2b1c8` ya trae `public.clientes_provisionales`,
`public.users.cargo_permiso` y `public.prioridad_ajustes`. Por tanto:

- La tabla de provisionales **no nació** con el despliegue del 10/10. La condición de parada de Gerencia se
  comprobó: se leyó con **0 filas**, y se publicó sin construir el resumen.
- Los cargos **sí se habrían podido asignar antes**. Se asignaron el 10/10, tras publicar.
- Las dos claves del 09/10 llevan desde hoy una nota de medición propia, sin tocar la respuesta de Gerencia:
  `decision/s4-f1b19-resumen-de-provisionales-no-se-construye` y
  `decision/cargos-se-asignan-tras-publicar-fuera-de-horario`.

## 10 · Lo que no consta como comprobado

Esta adenda registra lo que llegó. De lo que el consolidado pedía comprobar al publicar, **no consta resultado** de:

- El bloque 1 de su §4.5 entero —los dieciocho nombres de tabla—; de él sólo consta `nit_exentos`.
- Las tres columnas de `tickets` que lee el sincronizador (condición i), en `desk` y en `zoho-hub`.
- La lectura de `public.prioridad_ajustes` (condición f): con producción en `7a2b1c8` la tabla ya existía, así que
  **pudo haber prioridades ajustadas con el código anterior**, que siguen congelando la fila entera.
- El paso 2 de F1C-09 y su recuento posterior (condición b).
- El redespliegue del worker y su log.
- El Top 5.

Ninguna se da por hecha ni por fallida.

## 11 · Pendientes de persona

| Tarea | Dueño |
|---|---|
| Sacar la copia de `desk` fuera del servidor | Alfonso |
| Decidir si se habilita la copia diaria, y con qué retención | Gerencia |
| Avisar a Servicio Técnico del ticket nº 996: necesita su remisión de entrada | Alfonso |
| Decidir qué roles reciben los avisos de su área | Gerencia |
| Las comprobaciones de §10 | Persona con acceso a producción |
