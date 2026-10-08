## ADDED Requirements

### RQ-AV-21 · Aviso a Comercial de un cliente provisional sin enlazar cuyo NIT ya está en Books, una sola vez por pareja

Gerencia, `decision/e155-aviso-provisional-en-books` (`openspec/config.yaml:4228`): «Sí, el aviso a Comercial, sin
bloquear.»

El sistema **SHALL** crear un aviso cuando exista una **pareja** formada por un cliente provisional
(`public.clientes_provisionales`, `tickets-core` RQ-TC-30) **sin enlazar** (`enlazado_a` nulo) y un contacto de Books
(vista `clients`) cuyo NIT casa con el del provisional por `nitCoincide` (`packages/shared/src/altaManual.ts:46-53`), la
misma comparación del alta. Cada pareja es `(provisional, contacto)`: un provisional con dos contactos coincidentes forma
dos parejas.

**No bloquea nada.** El aviso **MUST NOT** impedir ni demorar ningún alta, transición ni sincronización; es informativo.

**Exentos.** Si el NIT de **cualquiera de los dos lados** es exento (`tickets-core` RQ-TC-57), la pareja **MUST NOT**
avisar: basta que el del provisional o el del contacto lo sea (supuesto S-6, reversible).

**Al enlazar, deja de avisar.** Un provisional enlazado **MUST NOT** formar parte de ninguna pareja evaluada, tenga o no
la marca.

**Una sola vez por pareja.** El sistema **MUST NOT** crear un segundo aviso para la misma pareja, aunque la pasada la
evalúe muchas veces. La **marca** vive en la tabla `public.provisional_books_avisados`, con clave primaria
`(provisional_id, contacto_id)`, y **SHALL** escribirse en la **misma transacción** que la creación de los avisos: si la
transacción falla, ni hay marca ni hay avisos; si hay marca, hay avisos. Una pareja ya marcada no se vuelve a marcar ni
avisa. La inserción de la marca **SHALL** detectar la pareja ya marcada (violación de unicidad) y salir sin avisar, de modo
que dos pasadas concurrentes sobre la misma pareja avisan una sola vez.

**Destinatarios antes de la marca.** El aviso **SHALL** ir a cada destinatario de `destinatariosDeArea(db, 'Comercial', '')`
(`apps/desk/server/db/avisos.ts:74-93`), uno por destinatario y por pareja, y los destinatarios **SHALL** resolverse
**antes** de escribir la marca. Si **nadie** recibe el aviso, la pareja **MUST NOT** marcarse: se registra una advertencia
(una sola por pasada) y la pasada siguiente reintenta en cuanto haya un destinatario.

**Canal y contenido.** El aviso **SHALL** ser sólo de bandeja, creado con `crearAviso`
(`apps/desk/server/db/avisos.ts:8-18`) con `ticketId` nulo (supuesto S-3, reversible): **MUST NOT** disparar el canal de
correo (`RQ-AV-09`) y `enviado_at` **SHALL** quedar `NULL`. El texto **SHALL** nombrar la razón social del provisional, su
NIT y el nombre del contacto de Books, e invitar a enlazarlos: «El cliente provisional «{razón social}» (NIT {nit})
coincide por NIT con el contacto de Books «{nombre}». Conviene enlazarlos.» Se origina únicamente desde el proceso
`ambientalia-desk`, no desde `apps/hub-sync`. No escribe en `books.*` ni hacia Zoho.

**La pasada.** El servicio **SHALL** engancharse a la pasada periódica del servidor, en la cadena de
`apps/desk/server/index.ts:88` (junto a las pasadas de `RQ-AV-14` y `RQ-AV-19`), y correr en **cada intervalo** de
sincronización, no una vez al día (supuesto S-5, reversible), porque «sin destinatarios se reintenta». Si no hay
provisionales sin enlazar, la pasada **SHALL** salir sin leer los contactos de Books. La pasada **MUST NOT lanzar**: un
error propio se registra y no interrumpe la cadena (la sincronización con Zoho que sigue en ella corre igual), y un fallo
al evaluar una pareja **MUST NOT** impedir que se evalúen las demás.

**Ráfaga al desplegar.** Toda pareja que ya exista al desplegar avisa una vez en la primera pasada: no hay corte que las
silencie (supuesto S-4, reversible sólo antes de desplegar).

#### Scenario: Una pareja provisional × contacto con el mismo NIT avisa a Comercial
- GIVEN un provisional sin enlazar con NIT «900.123.456-7», un contacto de Books con NIT «900123456» y usuarios activos del área Comercial
- WHEN corre la pasada
- THEN se crea un aviso a cada destinatario de Comercial que nombra la razón social, el NIT y el nombre del contacto, con `ticketId` nulo y `enviado_at` `NULL`, y queda la marca de la pareja

#### Scenario: Una segunda pasada no repite el aviso
- GIVEN el aviso de la pareja ya creado y su marca puesta
- WHEN corre la pasada otra vez, aunque sea muchas veces
- THEN no se crea ningún aviso nuevo

#### Scenario: Un provisional con dos contactos coincidentes forma dos parejas
- GIVEN un provisional sin enlazar y dos contactos de Books con su mismo NIT
- WHEN corre la pasada
- THEN se avisa una vez por cada pareja y existen dos marcas

#### Scenario: Un provisional enlazado no avisa
- GIVEN un provisional con `enlazado_a` no nulo y un contacto de Books con su mismo NIT, sin marca
- WHEN corre la pasada
- THEN no se crea ningún aviso ni marca

#### Scenario: Al enlazar un provisional ya avisado no se evalúa más
- GIVEN una pareja ya avisada y marcada, y el provisional se enlaza después
- WHEN corre la pasada
- THEN no se crea ningún aviso nuevo

#### Scenario: Un NIT exento en el provisional no avisa
- GIVEN un provisional sin enlazar con NIT «222222222222» y un contacto de Books con ese NIT
- WHEN corre la pasada
- THEN no se crea ningún aviso ni marca

#### Scenario: Un NIT exento en el contacto no avisa
- GIVEN un contacto de Books cuyo NIT es exento y un provisional sin enlazar con ese NIT escrito con formato
- WHEN corre la pasada
- THEN no se crea ningún aviso ni marca

#### Scenario: Sin destinatarios no se marca y se reintenta
- GIVEN una pareja pendiente y ningún usuario activo del área Comercial
- WHEN corre la pasada
- THEN no se crea ningún aviso, la pareja queda sin marca y se registra una única advertencia; cuando aparece un destinatario, la pasada siguiente avisa y marca

#### Scenario: La marca y los avisos van en la misma transacción
- GIVEN una pareja pendiente y un fallo al crear uno de los avisos
- WHEN corre la pasada
- THEN no queda marca ni ningún aviso de esa pareja; la pasada siguiente lo reintenta

#### Scenario: Dos pasadas concurrentes avisan una sola vez
- GIVEN dos pasadas que evalúan a la vez la misma pareja
- WHEN las dos intentan insertar la marca
- THEN sólo una la inserta y sólo esa crea avisos

#### Scenario: Sin provisionales sin enlazar no se leen los contactos
- GIVEN ningún provisional sin enlazar
- WHEN corre la pasada
- THEN termina sin consultar los contactos de Books y no crea nada

#### Scenario: El aviso sólo va a la bandeja
- GIVEN cualquier aviso de esta pareja
- WHEN se crea
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de `RQ-AV-09`

#### Scenario: La pasada no lanza y la sincronización corre igual
- GIVEN un fallo de base de datos dentro del servicio del aviso
- WHEN corre la cadena periódica
- THEN el error se registra y la sincronización con Zoho que sigue en la cadena corre igual

#### Scenario: Un fallo en una pareja no impide las demás
- GIVEN dos parejas pendientes y un fallo al procesar la primera
- WHEN corre la pasada
- THEN la segunda se avisa y se marca, y la primera se reintenta en la pasada siguiente

#### Scenario: El aviso no bloquea ningún alta ni transición
- GIVEN una pareja pendiente de avisar
- WHEN se crea un ticket o se ejecuta una transición mientras corre la pasada
- THEN la operación responde igual que sin la pareja
